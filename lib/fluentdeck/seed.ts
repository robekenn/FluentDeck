import { todayISO } from "./dates";
import type { AppData, CardInput, DeckInput, FlashCard, Language, Deck } from "./types";

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function formatTags(tags: string[]) {
  return tags.join(", ");
}

export function makeDeck(input: DeckInput): Deck {
  return {
    id: createId("deck"),
    languageId: input.languageId,
    name: input.name.trim(),
    description: input.description.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function makeCard(input: CardInput): FlashCard {
  const now = new Date().toISOString();

  return {
    id: input.id ?? createId("card"),
    deckId: input.deckId,
    front: input.front.trim(),
    back: input.back.trim(),
    transliteration: input.transliteration.trim(),
    example: input.example.trim(),
    notes: input.notes.trim(),
    tags: input.tags,
    createdAt: now,
    updatedAt: now,
    dueDate: todayISO(),
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    lastReviewedAt: null,
  };
}

export function createInitialData(): AppData {
  const now = new Date().toISOString();

  const languages: Language[] = [
    {
      id: "lang_french",
      name: "French",
      code: "fr",
      direction: "ltr",
      accent: "from-blue-500 to-cyan-400",
    },
    {
      id: "lang_spanish",
      name: "Spanish",
      code: "es",
      direction: "ltr",
      accent: "from-orange-500 to-rose-400",
    },
    {
      id: "lang_hebrew",
      name: "Hebrew",
      code: "he",
      direction: "rtl",
      accent: "from-violet-500 to-fuchsia-400",
    },
  ];

  const decks: Deck[] = [
    {
      id: "deck_french_basics",
      languageId: "lang_french",
      name: "French Basics",
      description: "Core phrases, greetings, and beginner vocabulary.",
      createdAt: now,
    },
    {
      id: "deck_spanish_restaurant",
      languageId: "lang_spanish",
      name: "Spanish Restaurant Phrases",
      description: "Useful phrases for ordering food and drinks.",
      createdAt: now,
    },
    {
      id: "deck_hebrew_basics",
      languageId: "lang_hebrew",
      name: "Hebrew Basics",
      description: "Common Hebrew words with transliteration.",
      createdAt: now,
    },
  ];

  const cards: FlashCard[] = [
    makeCard({
      deckId: "deck_french_basics",
      front: "Bonjour",
      back: "Hello / good morning",
      transliteration: "",
      example: "Bonjour, comment ça va ?",
      notes: "Used during the day. In the evening, use “bonsoir.”",
      tags: ["greetings", "beginner"],
    }),
    makeCard({
      deckId: "deck_french_basics",
      front: "Je voudrais...",
      back: "I would like...",
      transliteration: "",
      example: "Je voudrais un café, s’il vous plaît.",
      notes: "A polite phrase for ordering or requesting something.",
      tags: ["phrases", "restaurant"],
    }),
    makeCard({
      deckId: "deck_spanish_restaurant",
      front: "Buenas tardes",
      back: "Good afternoon",
      transliteration: "",
      example: "Buenas tardes. ¿Qué le gustaría beber?",
      notes: "",
      tags: ["greetings", "restaurant"],
    }),
    makeCard({
      deckId: "deck_spanish_restaurant",
      front: "¿Algo más?",
      back: "Anything else?",
      transliteration: "",
      example: "¿Algo más para usted?",
      notes: "",
      tags: ["phrases", "ordering"],
    }),
    makeCard({
      deckId: "deck_hebrew_basics",
      front: "שָׁלוֹם",
      back: "Peace / hello / goodbye",
      transliteration: "shalom",
      example: "",
      notes: "One of the most common Hebrew words.",
      tags: ["greetings", "beginner"],
    }),
    makeCard({
      deckId: "deck_hebrew_basics",
      front: "תּוֹדָה",
      back: "Thank you",
      transliteration: "todah",
      example: "תּוֹדָה רַבָּה",
      notes: "Todah rabah means “thank you very much.”",
      tags: ["politeness", "beginner"],
    }),
  ];

  return {
    schemaVersion: 1,
    languages,
    decks,
    cards,
  };
}