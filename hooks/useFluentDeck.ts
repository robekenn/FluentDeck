"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
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

export function useFluentDeck() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

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

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUser(currentUser);
      setAuthLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        setData(createInitialData());
        setSelectedDeckId("");
        setView("dashboard");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    async function loadCloudData() {
      setDataLoading(true);
      setCloudError(null);

      try {
        let nextData = await fetchCloudData(supabase, user.id);

        if (nextData.languages.length === 0) {
          nextData = await seedCloudData(supabase, user.id);
        }

        if (!active) {
          return;
        }

        setData(nextData);
        setSelectedDeckId(nextData.decks[0]?.id ?? "");
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
      const current = map.get(card.deckId) ?? [];
      current.push(card);
      map.set(card.deckId, current);
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

  function requireUserId() {
    if (!user) {
      setCloudError("Please sign in first.");
      return null;
    }

    return user.id;
  }

  async function signIn(email: string, password: string) {
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
    await supabase.auth.signOut();
    setUser(null);
    setData(createInitialData());
    setSelectedDeckId("");
    setView("dashboard");
  }

  async function createDeck(input: DeckInput) {
    const userId = requireUserId();

    if (!userId) {
      return;
    }

    const deck = makeDeck(input);

    const { error } = await supabase.from("decks").insert(deckToRow(deck, userId));

    if (error) {
      setCloudError(error.message);
      return;
    }

    setData((current) => ({
      ...current,
      decks: [deck, ...current.decks],
    }));

    setSelectedDeckId(deck.id);
    setView("library");
  }

  async function deleteDeck(deckId: string) {
    const userId = requireUserId();

    if (!userId) {
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

    const { error } = await supabase
      .from("decks")
      .delete()
      .eq("user_id", userId)
      .eq("id", deckId);

    if (error) {
      setCloudError(error.message);
      return;
    }

    setData((current) => ({
      ...current,
      decks: current.decks.filter((item) => item.id !== deckId),
      cards: current.cards.filter((card) => card.deckId !== deckId),
    }));

    if (selectedDeckId === deckId) {
      const nextDeck = data.decks.find((item) => item.id !== deckId);
      setSelectedDeckId(nextDeck?.id ?? "");
    }
  }

  async function upsertCard(input: CardInput) {
    const userId = requireUserId();

    if (!userId) {
      return;
    }

    if (input.id) {
      const currentCard = data.cards.find((card) => card.id === input.id);

      if (!currentCard) {
        return;
      }

      const updatedCard: FlashCard = {
        ...currentCard,
        deckId: input.deckId,
        front: input.front.trim(),
        back: input.back.trim(),
        transliteration: input.transliteration.trim(),
        example: input.example.trim(),
        notes: input.notes.trim(),
        tags: input.tags,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("cards")
        .update(cardToRow(updatedCard, userId))
        .eq("user_id", userId)
        .eq("id", updatedCard.id);

      if (error) {
        setCloudError(error.message);
        return;
      }

      setData((current) => ({
        ...current,
        cards: current.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card
        ),
      }));

      return;
    }

    const card = makeCard(input);

    const { error } = await supabase.from("cards").insert(cardToRow(card, userId));

    if (error) {
      setCloudError(error.message);
      return;
    }

    setData((current) => ({
      ...current,
      cards: [card, ...current.cards],
    }));
  }

  async function deleteCard(cardId: string) {
    const userId = requireUserId();

    if (!userId) {
      return;
    }

    const confirmed = window.confirm("Delete this card?");

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("user_id", userId)
      .eq("id", cardId);

    if (error) {
      setCloudError(error.message);
      return;
    }

    setData((current) => ({
      ...current,
      cards: current.cards.filter((card) => card.id !== cardId),
    }));
  }

  async function reviewCurrentCard(rating: StudyRating) {
    const userId = requireUserId();

    if (!userId || !currentStudyCard) {
      return;
    }

    const oldLength = studyCards.length;
    const reviewedCard = reviewCard(currentStudyCard, rating);

    const { error } = await supabase
      .from("cards")
      .update(cardToRow(reviewedCard, userId))
      .eq("user_id", userId)
      .eq("id", reviewedCard.id);

    if (error) {
      setCloudError(error.message);
      return;
    }

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
    const userId = requireUserId();

    if (!userId) {
      return;
    }

    setDataLoading(true);
    setCloudError(null);

    try {
      await replaceCloudData(supabase, userId, nextData);

      setData(nextData);
      setSelectedDeckId(nextData.decks[0]?.id ?? "");
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