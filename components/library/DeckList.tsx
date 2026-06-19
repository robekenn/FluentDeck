"use client";

import { FormEvent, useState } from "react";
import type { Deck, FlashCard, Language } from "../../lib/fluentdeck/types";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Panel from "../ui/Panel";
import EmptyState from "../ui/EmptyState";

export default function DeckList({
  languages,
  decks,
  selectedLanguageId,
  setSelectedLanguageId,
  selectedDeckId,
  setSelectedDeckId,
  cardsByDeck,
  languageMap,
  createDeck,
  deleteDeck,
  studyDeck,
}: {
  languages: Language[];
  decks: Deck[];
  selectedLanguageId: string;
  setSelectedLanguageId: (id: string) => void;
  selectedDeckId: string;
  setSelectedDeckId: (id: string) => void;
  cardsByDeck: Map<string, FlashCard[]>;
  languageMap: Map<string, Language>;
  createDeck: (input: { languageId: string; name: string; description: string }) => void;
  deleteDeck: (deckId: string) => void;
  studyDeck: (deckId: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [languageId, setLanguageId] = useState(languages[0]?.id ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !languageId) {
      return;
    }

    createDeck({
      languageId,
      name,
      description,
    });

    setName("");
    setDescription("");
  }

  return (
    <>
      <Panel title="Library Filter" subtitle="Keep the screen focused by language.">
        <div className="flex flex-wrap gap-2">
          <FilterButton active={selectedLanguageId === "all"} onClick={() => setSelectedLanguageId("all")}>
            All
          </FilterButton>

          {languages.map((language) => (
            <FilterButton
              key={language.id}
              active={selectedLanguageId === language.id}
              onClick={() => setSelectedLanguageId(language.id)}
            >
              {language.name}
            </FilterButton>
          ))}
        </div>
      </Panel>

      <Panel title="Create Deck" subtitle="Add a focused group of cards.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Language">
            <select
              value={languageId}
              onChange={(event) => setLanguageId(event.target.value)}
              className="input"
            >
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Deck name">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: French Verbs"
              className="input"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this deck for?"
              className="input min-h-24"
            />
          </Field>

          <Button variant="success" className="w-full" type="submit">
            Add Deck
          </Button>
        </form>
      </Panel>

      <Panel title="Decks" subtitle="Pick the deck you want to edit.">
        <div className="space-y-3">
          {decks.map((deck) => {
            const language = languageMap.get(deck.languageId);
            const count = cardsByDeck.get(deck.id)?.length ?? 0;
            const isSelected = selectedDeckId === deck.id;

            return (
              <article
                key={deck.id}
                className={`rounded-3xl border p-4 transition ${
                  isSelected
                    ? "border-blue-300/60 bg-blue-400/10"
                    : "border-white/10 bg-slate-950/40 hover:bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDeckId(deck.id)}
                  className="block w-full text-left"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    {language?.name ?? "Unknown"}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">{deck.name}</h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {count} card{count === 1 ? "" : "s"}
                  </p>

                  {deck.description && (
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {deck.description}
                    </p>
                  )}
                </button>

                <div className="mt-4 flex gap-2">
                  <Button className="px-3 py-1.5 text-xs" onClick={() => studyDeck(deck.id)}>
                    Study
                  </Button>

                  <Button
                    variant="danger"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => deleteDeck(deck.id)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            );
          })}

          {decks.length === 0 && (
            <EmptyState
              title="No decks yet"
              message="Create a deck to start organizing your language study."
            />
          )}
        </div>
      </Panel>
    </>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
        active
          ? "bg-blue-400 text-slate-950"
          : "border border-white/10 text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}