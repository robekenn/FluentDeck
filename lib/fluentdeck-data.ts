export type TextDirection = "ltr" | "rtl";

export type StudyRating = "again" | "hard" | "good" | "easy";

export type Language = {
  id: string;
  name: string;
  code: string;
  direction: TextDirection;
  accent: string;
};

export type Deck = {
  id: string;
  languageId: string;
  name: string;
  description: string;
  createdAt: string;
};

export type FlashCard = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  transliteration: string;
  example: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt: string | null;
};

export type AppData = {
  schemaVersion: 1;
  languages: Language[];
  decks: Deck[];
  cards: FlashCard[];
};

export const STORAGE_KEY = "fluentdeck.app.v1";

export function todayISO(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

export function addDaysISO(days: number, date = new Date()) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString().slice(0, 10);
}

export function isDue(card: FlashCard, date = todayISO()) {
  return card.dueDate <= date;
}

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

export function createDeck(input: {
  languageId: string;
  name: string;
  description?: string;
}): Deck {
  return {
    id: createId("deck"),
    languageId: input.languageId,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    createdAt: new Date().toISOString(),
  };
}

export function createCard(input: {
  deckId: string;
  front: string;
  back: string;
  transliteration?: string;
  example?: string;
  notes?: string;
  tags?: string[];
}): FlashCard {
  const now = new Date().toISOString();

  return {
    id: createId("card"),
    deckId: input.deckId,
    front: input.front.trim(),
    back: input.back.trim(),
    transliteration: input.transliteration?.trim() ?? "",
    example: input.example?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    tags: input.tags ?? [],
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

function roundEase(value: number) {
  return Math.round(value * 100) / 100;
}

export function reviewCard(card: FlashCard, rating: StudyRating): FlashCard {
  const now = new Date().toISOString();
  const oldInterval = Math.max(0, card.intervalDays);
  let ease = card.easeFactor;
  let intervalDays = 0;
  let dueOffset = 0;
  let repetitions = card.repetitions;
  let lapses = card.lapses;

  if (rating === "again") {
    ease = Math.max(1.3, ease - 0.25);
    intervalDays = 0;
    dueOffset = 0;
    repetitions = 0;
    lapses += 1;
  }

  if (rating === "hard") {
    ease = Math.max(1.3, ease - 0.15);
    intervalDays = Math.max(1, Math.ceil(oldInterval * 1.2));
    dueOffset = intervalDays;
    repetitions += 1;
  }

  if (rating === "good") {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (oldInterval < 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(3, Math.round(oldInterval * ease));
    }

    dueOffset = intervalDays;
    repetitions += 1;
  }

  if (rating === "easy") {
    ease = Math.min(3.2, ease + 0.15);

    if (repetitions === 0) {
      intervalDays = 4;
    } else if (oldInterval < 3) {
      intervalDays = 7;
    } else {
      intervalDays = Math.max(7, Math.round(oldInterval * ease * 1.35));
    }

    dueOffset = intervalDays;
    repetitions += 1;
  }

  return {
    ...card,
    easeFactor: roundEase(ease),
    intervalDays,
    repetitions,
    lapses,
    dueDate: addDaysISO(dueOffset),
    lastReviewedAt: now,
    updatedAt: now,
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
    createCard({
      deckId: "deck_french_basics",
      front: "Bonjour",
      back: "Hello / good morning",
      example: "Bonjour, comment ça va ?",
      notes: "Used during the day. In the evening, use “bonsoir.”",
      tags: ["greetings", "beginner"],
    }),
    createCard({
      deckId: "deck_french_basics",
      front: "Je voudrais...",
      back: "I would like...",
      example: "Je voudrais un café, s’il vous plaît.",
      notes: "A polite phrase for ordering or requesting something.",
      tags: ["phrases", "restaurant"],
    }),
    createCard({
      deckId: "deck_french_basics",
      front: "Où est... ?",
      back: "Where is...?",
      example: "Où est la bibliothèque ?",
      tags: ["questions", "travel"],
    }),
    createCard({
      deckId: "deck_spanish_restaurant",
      front: "Buenas tardes",
      back: "Good afternoon",
      example: "Buenas tardes. ¿Qué le gustaría beber?",
      tags: ["greetings", "restaurant"],
    }),
    createCard({
      deckId: "deck_spanish_restaurant",
      front: "¿Algo más?",
      back: "Anything else?",
      example: "¿Algo más para usted?",
      tags: ["phrases", "ordering"],
    }),
    createCard({
      deckId: "deck_spanish_restaurant",
      front: "Enseguida se lo traigo.",
      back: "I’ll bring it to you right away.",
      tags: ["service", "restaurant"],
    }),
    createCard({
      deckId: "deck_hebrew_basics",
      front: "שָׁלוֹם",
      back: "Peace / hello / goodbye",
      transliteration: "shalom",
      notes: "One of the most common Hebrew words.",
      tags: ["greetings", "beginner"],
    }),
    createCard({
      deckId: "deck_hebrew_basics",
      front: "תּוֹדָה",
      back: "Thank you",
      transliteration: "todah",
      example: "תּוֹדָה רַבָּה",
      notes: "Todah rabah means “thank you very much.”",
      tags: ["politeness", "beginner"],
    }),
    createCard({
      deckId: "deck_hebrew_basics",
      front: "בְּבַקָּשָׁה",
      back: "Please / you’re welcome",
      transliteration: "bevakasha",
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

export function loadStoredData(): AppData {
  if (typeof window === "undefined") {
    return createInitialData();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialData();
  }

  try {
    const parsed = JSON.parse(raw) as AppData;

    if (
      parsed &&
      parsed.schemaVersion === 1 &&
      Array.isArray(parsed.languages) &&
      Array.isArray(parsed.decks) &&
      Array.isArray(parsed.cards)
    ) {
      return parsed;
    }

    return createInitialData();
  } catch {
    return createInitialData();
  }
}

export function saveStoredData(data: AppData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}