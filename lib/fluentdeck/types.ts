export type TextDirection = "ltr" | "rtl";

export type View = "dashboard" | "library" | "study";

export type StudyMode = "due" | "new" | "all";

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

export type DeckInput = {
  languageId: string;
  name: string;
  description: string;
};

export type CardInput = {
  id?: string;
  deckId: string;
  front: string;
  back: string;
  transliteration: string;
  example: string;
  notes: string;
  tags: string[];
};