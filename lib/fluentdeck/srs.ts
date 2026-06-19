import { addDaysISO } from "./dates";
import type { FlashCard, StudyRating } from "./types";

export function isDue(card: FlashCard, today = new Date().toISOString().slice(0, 10)) {
  return card.dueDate <= today;
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