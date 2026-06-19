"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  cardToRow,
  deckToRow,
  fetchCloudData,
  replaceCloudData,
  seedCloudData,
} from "../lib/fluentdeck/cloud";
import { createInitialData, makeCard, makeDeck } from "../lib/fluentdeck/seed";
import { isDue, reviewCard } from "../lib/fluentdeck/srs";
import type {
  AppData,
  CardInput,
  DeckInput,
  FlashCard,
  StudyMode,
  StudyRating,
  View,
} from "../lib/fluentdeck/types";
import type { Database } from "../lib/supabase/types";

type FluentDeckSupabase = SupabaseClient<Database>;

export function useFluentDeck() {
  const [supabase, setSupabase] = useState<FluentDeckSupabase | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>(() => createInitialData());

  const [view, setView] = useState<View>("dashboard");
  const [selectedLanguageId, setSelectedLanguageId] = useState("all");
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [search, setSearch] = useState("");

  const [studyMode, setStudyMode] = useState<StudyMode>("due");
  const [studyDeckId, setStudyDeckId] = useState("all");
  const [studyIndex, setStudyIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    async function initializeSupabase() {
      setAuthLoading(true);
      setCloudError(null);

      try {
        const { createSupabaseBrowserClient } = await import(
          "../lib/supabase/client"
        );

        if (!mounted) {
          return;
        }

        const client = createSupabaseBrowserClient();
        setSupabase(client);

        const {
          data: { user: currentUser },
          error,
        } = await client.auth.getUser();

        if (!mounted) {
          return;
        }

        if (error) {
          setCloudError(error.message);
        }

        setUser(currentUser);
        setAuthLoading(false);

        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setAuthLoading(false);

          if (!session?.user) {
            setData(createInitialData());
            setSelectedDeckId("");
            setSelectedLanguageId("all");
            setSearch("");
            setStudyDeckId("all");
            setStudyIndex(0);
            setRevealed(false);
            setView("dashboard");
          }
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not initialize Supabase.";

        if (mounted) {
          setCloudError(message);
          setAuthLoading(false);
        }
      }
    }

    initializeSupabase();

    return () => {
      mounted = false;

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      return;
    }

    const client = supabase;
    const userId = user.id;
    let active = true;

    async function loadCloudData() {
      setDataLoading(true);
      setCloudError(null);

      try {
        let nextData = await fetchCloudData(client, userId);

        if (nextData.languages.length === 0) {
          nextData = await seedCloudData(client, userId);
        }

        if (!active) {
          return;
        }

        setData(nextData);
        setSelectedDeckId(nextData.decks[0]?.id ?? "");
        setSelectedLanguageId("all");
        setSearch("");
        setStudyDeckId("all");
        setStudyIndex(0);
        setRevealed(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not load your Supabase data.";

        if (active) {
          setCloudError(message);
        }
      } finally {
        if (active) {
          setDataLoading(false);
        }
      }
    }

    loadCloudData();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const languageMap = useMemo(() => {
    return new Map(data.languages.map((language) => [language.id, language]));
  }, [data.languages]);

  const deckMap = useMemo(() => {
    return new Map(data.decks.map((deck) => [deck.id, deck]));
  }, [data.decks]);

  const cardsByDeck = useMemo(() => {
    const map = new Map<string, FlashCard[]>();

    for (const card of data.cards) {
      const currentCards = map.get(card.deckId) ?? [];
      currentCards.push(card);
      map.set(card.deckId, currentCards);
    }

    return map;
  }, [data.cards]);

  const selectedDeck = deckMap.get(selectedDeckId) ?? null;

  const selectedDeckLanguage = selectedDeck
    ? languageMap.get(selectedDeck.languageId) ?? null
    : null;

  const filteredDecks = useMemo(() => {
    if (selectedLanguageId === "all") {
      return data.decks;
    }

    return data.decks.filter((deck) => deck.languageId === selectedLanguageId);
  }, [data.decks, selectedLanguageId]);

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.cards.filter((card) => {
      const deck = deckMap.get(card.deckId);

      if (!deck) {
        return false;
      }

      if (selectedLanguageId !== "all" && deck.languageId !== selectedLanguageId) {
        return false;
      }

      if (!query) {
        return true;
      }

      const language = languageMap.get(deck.languageId);

      return [
        card.front,
        card.back,
        card.transliteration,
        card.example,
        card.notes,
        card.tags.join(" "),
        deck.name,
        language?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [data.cards, deckMap, languageMap, search, selectedLanguageId]);

  const dueCards = useMemo(() => {
    return data.cards.filter((card) => isDue(card));
  }, [data.cards]);

  const newCards = useMemo(() => {
    return data.cards.filter((card) => card.repetitions === 0);
  }, [data.cards]);

  const reviewedCards = useMemo(() => {
    return data.cards.filter((card) => card.lastReviewedAt !== null);
  }, [data.cards]);

  const studyCards = useMemo(() => {
    let pool = data.cards;

    if (studyDeckId !== "all") {
      pool = pool.filter((card) => card.deckId === studyDeckId);
    }

    if (studyMode === "due") {
      pool = pool.filter((card) => isDue(card));
    }

    if (studyMode === "new") {
      pool = pool.filter((card) => card.repetitions === 0);
    }

    return [...pool].sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }

      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [data.cards, studyDeckId, studyMode]);

  const currentStudyCard = studyCards[studyIndex] ?? null;

  useEffect(() => {
    setStudyIndex(0);
    setRevealed(false);
  }, [studyMode, studyDeckId]);

  useEffect(() => {
    if (studyIndex >= studyCards.length) {
      setStudyIndex(0);
      setRevealed(false);
    }
  }, [studyCards.length, studyIndex]);

  function requireCloudSession() {
    if (!supabase) {
      setCloudError("Supabase is still loading. Please try again.");
      return null;
    }

    if (!user) {
      setCloudError("Please sign in first.");
      return null;
    }

    return {
      supabase,
      userId: user.id,
    };
  }

  async function signIn(email: string, password: string) {
    if (!supabase) {
      return {
        ok: false,
        message: "Supabase is still loading. Please try again.",
      };
    }

    setCloudError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    return {
      ok: true,
      message: "Signed in.",
    };
  }

  async function signUp(email: string, password: string) {
    if (!supabase) {
      return {
        ok: false,
        message: "Supabase is still loading. Please try again.",
      };
    }

    setCloudError(null);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    if (signUpData.session) {
      return {
        ok: true,
        message: "Account created. Your starter decks are being prepared.",
      };
    }

    return {
      ok: true,
      message:
        "Account created. Check your email to confirm your account, then sign in.",
    };
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setData(createInitialData());
    setSelectedDeckId("");
    setSelectedLanguageId("all");
    setSearch("");
    setStudyDeckId("all");
    setStudyIndex(0);
    setRevealed(false);
    setView("dashboard");
  }

  async function createDeck(input: DeckInput) {
    const session = requireCloudSession();

    if (!session) {
      return;
    }

    const deck = makeDeck(input);

    const { error } = await session.supabase
      .from("decks")
      .insert(deckToRow(deck, session.userId));

    if (error) {
      setCloudError(error.message);
      return;
    }

    setCloudError(null);

    setData((current) => ({
      ...current,
      decks: [deck, ...current.decks],
    }));

    setSelectedDeckId(deck.id);
    setView("library");
  }

  async function deleteDeck(deckId: string) {
    const session = requireCloudSession();

    if (!session) {
      return;
    }

    const deck = deckMap.get(deckId);

    if (!deck) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${deck.name}" and all of its cards? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await session.supabase
      .from("decks")
      .delete()
      .eq("user_id", session.userId)
      .eq("id", deckId);

    if (error) {
      setCloudError(error.message);
      return;
    }

    setCloudError(null);

    setData((current) => {
      const nextDecks = current.decks.filter((item) => item.id !== deckId);
      const nextCards = current.cards.filter((card) => card.deckId !== deckId);

      return {
        ...current,
        decks: nextDecks,
        cards: nextCards,
      };
    });

    if (selectedDeckId === deckId) {
      const nextDeck = data.decks.find((item) => item.id !== deckId);
      setSelectedDeckId(nextDeck?.id ?? "");
    }
  }

  async function upsertCard(input: CardInput) {
    const session = requireCloudSession();

    if (!session) {
      return;
    }

    if (input.id) {
      const existingCard = data.cards.find((card) => card.id === input.id);

      if (!existingCard) {
        setCloudError("Could not find the card you are trying to update.");
        return;
      }

      const updatedCard: FlashCard = {
        ...existingCard,
        deckId: input.deckId,
        front: input.front.trim(),
        back: input.back.trim(),
        transliteration: input.transliteration.trim(),
        example: input.example.trim(),
        notes: input.notes.trim(),
        tags: input.tags,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await session.supabase
        .from("cards")
        .update(cardToRow(updatedCard, session.userId))
        .eq("user_id", session.userId)
        .eq("id", updatedCard.id);

      if (error) {
        setCloudError(error.message);
        return;
      }

      setCloudError(null);

      setData((current) => ({
        ...current,
        cards: current.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card
        ),
      }));

      return;
    }

    const card = makeCard(input);

    const { error } = await session.supabase
      .from("cards")
      .insert(cardToRow(card, session.userId));

    if (error) {
      setCloudError(error.message);
      return;
    }

    setCloudError(null);

    setData((current) => ({
      ...current,
      cards: [card, ...current.cards],
    }));
  }

  async function deleteCard(cardId: string) {
    const session = requireCloudSession();

    if (!session) {
      return;
    }

    const confirmed = window.confirm("Delete this card?");

    if (!confirmed) {
      return;
    }

    const { error } = await session.supabase
      .from("cards")
      .delete()
      .eq("user_id", session.userId)
      .eq("id", cardId);

    if (error) {
      setCloudError(error.message);
      return;
    }

    setCloudError(null);

    setData((current) => ({
      ...current,
      cards: current.cards.filter((card) => card.id !== cardId),
    }));
  }

  async function reviewCurrentCard(rating: StudyRating) {
    const session = requireCloudSession();

    if (!session || !currentStudyCard) {
      return;
    }

    const oldLength = studyCards.length;
    const reviewedCard = reviewCard(currentStudyCard, rating);

    const { error } = await session.supabase
      .from("cards")
      .update(cardToRow(reviewedCard, session.userId))
      .eq("user_id", session.userId)
      .eq("id", reviewedCard.id);

    if (error) {
      setCloudError(error.message);
      return;
    }

    setCloudError(null);

    setData((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === reviewedCard.id ? reviewedCard : card
      ),
    }));

    setRevealed(false);

    setStudyIndex((currentIndex) => {
      if (studyMode === "all") {
        return oldLength <= 1 ? 0 : (currentIndex + 1) % oldLength;
      }

      const nextLength = Math.max(0, oldLength - 1);

      if (nextLength === 0) {
        return 0;
      }

      return Math.min(currentIndex, nextLength - 1);
    });
  }

  function skipStudyCard() {
    setRevealed(false);

    setStudyIndex((currentIndex) => {
      if (studyCards.length <= 1) {
        return 0;
      }

      return (currentIndex + 1) % studyCards.length;
    });
  }

  function restartStudySession() {
    setStudyIndex(0);
    setRevealed(false);
  }

  async function replaceData(nextData: AppData) {
    const session = requireCloudSession();

    if (!session) {
      return;
    }

    setDataLoading(true);
    setCloudError(null);

    try {
      await replaceCloudData(session.supabase, session.userId, nextData);

      setData(nextData);
      setSelectedDeckId(nextData.decks[0]?.id ?? "");
      setSelectedLanguageId("all");
      setSearch("");
      setStudyDeckId("all");
      setStudyIndex(0);
      setRevealed(false);
      setView("dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not replace cloud data.";

      setCloudError(message);
    } finally {
      setDataLoading(false);
    }
  }

  async function resetData() {
    const confirmed = window.confirm(
      "Reset your FluentDeck data back to the starter decks? This only affects your signed-in account."
    );

    if (!confirmed) {
      return;
    }

    await replaceData(createInitialData());
  }

  return {
    supabase,

    authLoading,
    dataLoading,
    cloudError,

    user,
    signIn,
    signUp,
    signOut,

    data,
    view,
    setView,

    selectedLanguageId,
    setSelectedLanguageId,

    selectedDeckId,
    setSelectedDeckId,
    selectedDeck,
    selectedDeckLanguage,

    search,
    setSearch,

    studyMode,
    setStudyMode,
    studyDeckId,
    setStudyDeckId,
    studyIndex,
    revealed,
    setRevealed,
    studyCards,
    currentStudyCard,
    reviewCurrentCard,
    skipStudyCard,
    restartStudySession,

    languageMap,
    deckMap,
    cardsByDeck,
    filteredDecks,
    filteredCards,
    dueCards,
    newCards,
    reviewedCards,

    createDeck,
    deleteDeck,
    upsertCard,
    deleteCard,

    replaceData,
    resetData,
  };
}