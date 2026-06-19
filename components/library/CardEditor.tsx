"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatTags, normalizeTags } from "../../lib/fluentdeck/seed";
import type { CardInput, Deck, FlashCard, Language } from "../../lib/fluentdeck/types";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Field from "../ui/Field";
import Panel from "../ui/Panel";

const emptyForm = {
  front: "",
  back: "",
  transliteration: "",
  example: "",
  notes: "",
  tags: "",
};

export default function CardEditor({
  decks,
  selectedDeck,
  selectedDeckLanguage,
  editingCard,
  onSubmit,
  onCancel,
}: {
  decks: Deck[];
  selectedDeck: Deck | null;
  selectedDeckLanguage: Language | null;
  editingCard: FlashCard | null;
  onSubmit: (input: CardInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingCard) {
      setForm({
        front: editingCard.front,
        back: editingCard.back,
        transliteration: editingCard.transliteration,
        example: editingCard.example,
        notes: editingCard.notes,
        tags: formatTags(editingCard.tags),
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingCard]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedDeck || !form.front.trim() || !form.back.trim()) {
      return;
    }

    onSubmit({
      id: editingCard?.id,
      deckId: selectedDeck.id,
      front: form.front,
      back: form.back,
      transliteration: form.transliteration,
      example: form.example,
      notes: form.notes,
      tags: normalizeTags(form.tags),
    });

    setForm(emptyForm);
  }

  return (
    <Panel
      title={editingCard ? "Edit Card" : "Add Card"}
      subtitle="The form stays isolated, so it is easy to improve later."
    >
      {!selectedDeck ? (
        <EmptyState
          title="Choose a deck first"
          message="Create or select a deck before adding cards."
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <p className="text-sm text-slate-400">Current deck</p>
            <p className="font-bold">
              {selectedDeck.name}{" "}
              <span className="text-slate-500">/ {selectedDeckLanguage?.name}</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Front">
              <textarea
                value={form.front}
                onChange={(event) => setForm({ ...form, front: event.target.value })}
                placeholder="Word or phrase"
                className="input min-h-28 text-lg"
                dir={selectedDeckLanguage?.direction ?? "ltr"}
              />
            </Field>

            <Field label="Back">
              <textarea
                value={form.back}
                onChange={(event) => setForm({ ...form, back: event.target.value })}
                placeholder="Translation / answer"
                className="input min-h-28 text-lg"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Transliteration">
              <input
                value={form.transliteration}
                onChange={(event) =>
                  setForm({ ...form, transliteration: event.target.value })
                }
                placeholder="Example: shalom"
                className="input"
              />
            </Field>

            <Field label="Tags">
              <input
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                placeholder="verbs, beginner, travel"
                className="input"
              />
            </Field>
          </div>

          <Field label="Example">
            <textarea
              value={form.example}
              onChange={(event) => setForm({ ...form, example: event.target.value })}
              placeholder="Add the word in context"
              className="input min-h-24"
              dir={selectedDeckLanguage?.direction ?? "ltr"}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Grammar notes, pronunciation reminders, memory tricks..."
              className="input min-h-24"
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button variant="success" type="submit">
              {editingCard ? "Update Card" : "Add Card"}
            </Button>

            {editingCard && (
              <Button type="button" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </Panel>
  );
}