"use client";

import { useEffect, useMemo, useState } from "react";
import { createInitialData, makeCard, makeDeck } from "../lib/fluentdeck/seed";
import { loadStoredData, saveStoredData } from "../lib/fluentdeck/storage";
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
  const [ready, setReady] = useState(false);
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
    const stored = loadStoredData();

    setData(stored);
    setSelectedDeckId(stored.decks[0]?.id ?? "");
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      saveStoredData(data);
    }
  }, [data, ready]);

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

  function createDeck(input: DeckInput) {
    const deck = makeDeck(input);

    setData((current) => ({
      ...current,
      decks: [deck, ...current.decks],
    }));

    setSelectedDeckId(deck.id);
    setView("library");
  }

  function deleteDeck(deckId: string) {
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

  function upsertCard(input: CardInput) {
    if (input.id) {
      setData((current) => ({
        ...current,
        cards: current.cards.map((card) => {
          if (card.id !== input.id) {
            return card;
          }

          return {
            ...card,
            deckId: input.deckId,
            front: input.front.trim(),
            back: input.back.trim(),
            transliteration: input.transliteration.trim(),
            example: input.example.trim(),
            notes: input.notes.trim(),
            tags: input.tags,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));

      return;
    }

    const card = makeCard(input);

    setData((current) => ({
      ...current,
      cards: [card, ...current.cards],
    }));
  }

  function deleteCard(cardId: string) {
    const confirmed = window.confirm("Delete this card?");

    if (!confirmed) {
      return;
    }

    setData((current) => ({
      ...current,
      cards: current.cards.filter((card) => card.id !== cardId),
    }));
  }

  function reviewCurrentCard(rating: StudyRating) {
    if (!currentStudyCard) {
      return;
    }

    const oldLength = studyCards.length;

    setData((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === currentStudyCard.id ? reviewCard(card, rating) : card
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

  function replaceData(nextData: AppData) {
    setData(nextData);
    setSelectedDeckId(nextData.decks[0]?.id ?? "");
    setStudyDeckId("all");
    setStudyIndex(0);
    setRevealed(false);
    setView("dashboard");
  }

  function resetData() {
    const confirmed = window.confirm(
      "Reset everything back to the starter FluentDeck data? This will replace your current browser data."
    );

    if (!confirmed) {
      return;
    }

    replaceData(createInitialData());
  }

  return {
    ready,
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