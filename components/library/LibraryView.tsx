"use client";

import { useState } from "react";
import type {
  CardInput,
  Deck,
  FlashCard,
  Language,
  StudyMode,
  View,
} from "../../lib/fluentdeck/types";
import Panel from "../ui/Panel";
import DeckList from "./DeckList";
import CardEditor from "./CardEditor";
import CardList from "./CardList";

export default function LibraryView({
  languages,
  decks,
  selectedLanguageId,
  setSelectedLanguageId,
  selectedDeckId,
  setSelectedDeckId,
  selectedDeck,
  selectedDeckLanguage,
  search,
  setSearch,
  filteredDecks,
  filteredCards,
  cardsByDeck,
  languageMap,
  deckMap,
  createDeck,
  deleteDeck,
  upsertCard,
  deleteCard,
  setView,
  setStudyDeckId,
  setStudyMode,
}: {
  languages: Language[];
  decks: Deck[];
  selectedLanguageId: string;
  setSelectedLanguageId: (id: string) => void;
  selectedDeckId: string;
  setSelectedDeckId: (id: string) => void;
  selectedDeck: Deck | null;
  selectedDeckLanguage: Language | null;
  search: string;
  setSearch: (value: string) => void;
  filteredDecks: Deck[];
  filteredCards: FlashCard[];
  cardsByDeck: Map<string, FlashCard[]>;
  languageMap: Map<string, Language>;
  deckMap: Map<string, Deck>;
  createDeck: (input: { languageId: string; name: string; description: string }) => void;
  deleteDeck: (deckId: string) => void;
  upsertCard: (input: CardInput) => void;
  deleteCard: (cardId: string) => void;
  setView: (view: View) => void;
  setStudyDeckId: (id: string) => void;
  setStudyMode: (mode: StudyMode) => void;
}) {
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);

  function studyDeck(deckId: string) {
    setStudyDeckId(deckId);
    setStudyMode("all");
    setView("study");
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-6">
        <DeckList
          languages={languages}
          decks={filteredDecks}
          selectedLanguageId={selectedLanguageId}
          setSelectedLanguageId={setSelectedLanguageId}
          selectedDeckId={selectedDeckId}
          setSelectedDeckId={(deckId) => {
            setSelectedDeckId(deckId);
            setEditingCard(null);
          }}
          cardsByDeck={cardsByDeck}
          languageMap={languageMap}
          createDeck={createDeck}
          deleteDeck={deleteDeck}
          studyDeck={studyDeck}
        />
      </div>

      <div className="space-y-6">
        <CardEditor
          key={editingCard?.id ?? selectedDeckId}
          decks={decks}
          selectedDeck={selectedDeck}
          selectedDeckLanguage={selectedDeckLanguage}
          editingCard={editingCard}
          onSubmit={(input) => {
            upsertCard(input);
            setEditingCard(null);
          }}
          onCancel={() => setEditingCard(null)}
        />

        <Panel title="Cards" subtitle="Search, edit, or delete cards in your library.">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cards, decks, tags..."
              className="input"
            />
          </div>

          <CardList
            cards={filteredCards}
            deckMap={deckMap}
            languageMap={languageMap}
            onEdit={setEditingCard}
            onDelete={(cardId) => {
              deleteCard(cardId);

              if (editingCard?.id === cardId) {
                setEditingCard(null);
              }
            }}
          />
        </Panel>
      </div>
    </section>
  );
}