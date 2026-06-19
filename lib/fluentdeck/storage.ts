import { createInitialData } from "./seed";
import type { AppData } from "./types";

export const STORAGE_KEY = "fluentdeck.app.v1";

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

export function isValidImport(value: unknown): value is AppData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const possible = value as Partial<AppData>;

  return (
    possible.schemaVersion === 1 &&
    Array.isArray(possible.languages) &&
    Array.isArray(possible.decks) &&
    Array.isArray(possible.cards)
  );
}