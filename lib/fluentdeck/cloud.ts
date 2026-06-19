import type { SupabaseClient } from "@supabase/supabase-js";
import { createInitialData } from "./seed";
import type { AppData, Deck, FlashCard, Language } from "./types";
import type { Database } from "../supabase/types";

type Supabase = SupabaseClient<Database>;

type DbLanguage = Database["public"]["Tables"]["languages"]["Row"];
type DbDeck = Database["public"]["Tables"]["decks"]["Row"];
type DbCard = Database["public"]["Tables"]["cards"]["Row"];

export function languageToRow(language: Language, userId: string) {
  return {
    user_id: userId,
    id: language.id,
    name: language.name,
    code: language.code,
    direction: language.direction,
    accent: language.accent,
  };
}

export function deckToRow(deck: Deck, userId: string) {
  return {
    user_id: userId,
    id: deck.id,
    language_id: deck.languageId,
    name: deck.name,
    description: deck.description,
    created_at: deck.createdAt,
  };
}

export function cardToRow(card: FlashCard, userId: string) {
  return {
    user_id: userId,
    id: card.id,
    deck_id: card.deckId,
    front: card.front,
    back: card.back,
    transliteration: card.transliteration,
    example: card.example,
    notes: card.notes,
    tags: card.tags,
    due_date: card.dueDate,
    interval_days: card.intervalDays,
    ease_factor: card.easeFactor,
    repetitions: card.repetitions,
    lapses: card.lapses,
    last_reviewed_at: card.lastReviewedAt,
    created_at: card.createdAt,
    updated_at: card.updatedAt,
  };
}

function languageFromRow(row: DbLanguage): Language {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    direction: row.direction,
    accent: row.accent,
  };
}

function deckFromRow(row: DbDeck): Deck {
  return {
    id: row.id,
    languageId: row.language_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

function cardFromRow(row: DbCard): FlashCard {
  return {
    id: row.id,
    deckId: row.deck_id,
    front: row.front,
    back: row.back,
    transliteration: row.transliteration,
    example: row.example,
    notes: row.notes,
    tags: row.tags ?? [],
    dueDate: row.due_date,
    intervalDays: row.interval_days,
    easeFactor: Number(row.ease_factor),
    repetitions: row.repetitions,
    lapses: row.lapses,
    lastReviewedAt: row.last_reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchCloudData(
  supabase: Supabase,
  userId: string
): Promise<AppData> {
  const [languagesResult, decksResult, cardsResult] = await Promise.all([
    supabase
      .from("languages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("decks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("cards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (languagesResult.error) {
    throw languagesResult.error;
  }

  if (decksResult.error) {
    throw decksResult.error;
  }

  if (cardsResult.error) {
    throw cardsResult.error;
  }

  return {
    schemaVersion: 1,
    languages: (languagesResult.data ?? []).map(languageFromRow),
    decks: (decksResult.data ?? []).map(deckFromRow),
    cards: (cardsResult.data ?? []).map(cardFromRow),
  };
}

export async function replaceCloudData(
  supabase: Supabase,
  userId: string,
  data: AppData
): Promise<AppData> {
  const deleteResult = await supabase
    .from("languages")
    .delete()
    .eq("user_id", userId);

  if (deleteResult.error) {
    throw deleteResult.error;
  }

  const languageRows = data.languages.map((language) =>
    languageToRow(language, userId)
  );

  const deckRows = data.decks.map((deck) => deckToRow(deck, userId));
  const cardRows = data.cards.map((card) => cardToRow(card, userId));

  if (languageRows.length > 0) {
    const { error } = await supabase.from("languages").insert(languageRows);

    if (error) {
      throw error;
    }
  }

  if (deckRows.length > 0) {
    const { error } = await supabase.from("decks").insert(deckRows);

    if (error) {
      throw error;
    }
  }

  if (cardRows.length > 0) {
    const { error } = await supabase.from("cards").insert(cardRows);

    if (error) {
      throw error;
    }
  }

  return data;
}

export async function seedCloudData(
  supabase: Supabase,
  userId: string
): Promise<AppData> {
  const starterData = createInitialData();
  return replaceCloudData(supabase, userId, starterData);
}