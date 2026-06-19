"use client";

import { ChangeEvent, useRef } from "react";
import { useFluentDeck } from "../../hooks/useFluentDeck";
import { isValidImport } from "../../lib/fluentdeck/storage";
import { todayISO } from "../../lib/fluentdeck/dates";
import AppHeader from "./AppHeader";
import DashboardView from "../dashboard/DashboardView";
import LibraryView from "../library/LibraryView";
import StudyView from "../study/StudyView";

export default function FluentDeckApp() {
  const app = useFluentDeck();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function exportData() {
    const blob = new Blob([JSON.stringify(app.data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `fluentdeck-backup-${todayISO()}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!isValidImport(parsed)) {
        throw new Error("Invalid FluentDeck backup.");
      }

      app.replaceData(parsed);
    } catch {
      window.alert("That file could not be imported. Make sure it is a FluentDeck JSON backup.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          view={app.view}
          setView={app.setView}
          cardCount={app.data.cards.length}
          deckCount={app.data.decks.length}
          dueCount={app.dueCards.length}
          onExport={exportData}
          onImportClick={() => fileInputRef.current?.click()}
          onReset={app.resetData}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={importData}
        />

        {app.view === "dashboard" && (
          <DashboardView
            languages={app.data.languages}
            decks={app.data.decks}
            cards={app.data.cards}
            languageMap={app.languageMap}
            deckMap={app.deckMap}
            dueCards={app.dueCards}
            newCards={app.newCards}
            reviewedCards={app.reviewedCards}
            setView={app.setView}
            setSelectedLanguageId={app.setSelectedLanguageId}
            setStudyMode={app.setStudyMode}
            setStudyDeckId={app.setStudyDeckId}
          />
        )}

        {app.view === "library" && (
          <LibraryView
            languages={app.data.languages}
            decks={app.data.decks}
            selectedLanguageId={app.selectedLanguageId}
            setSelectedLanguageId={app.setSelectedLanguageId}
            selectedDeckId={app.selectedDeckId}
            setSelectedDeckId={app.setSelectedDeckId}
            selectedDeck={app.selectedDeck}
            selectedDeckLanguage={app.selectedDeckLanguage}
            search={app.search}
            setSearch={app.setSearch}
            filteredDecks={app.filteredDecks}
            filteredCards={app.filteredCards}
            cardsByDeck={app.cardsByDeck}
            languageMap={app.languageMap}
            deckMap={app.deckMap}
            createDeck={app.createDeck}
            deleteDeck={app.deleteDeck}
            upsertCard={app.upsertCard}
            deleteCard={app.deleteCard}
            setView={app.setView}
            setStudyDeckId={app.setStudyDeckId}
            setStudyMode={app.setStudyMode}
          />
        )}

        {app.view === "study" && (
          <StudyView
            decks={app.data.decks}
            languageMap={app.languageMap}
            deckMap={app.deckMap}
            studyMode={app.studyMode}
            setStudyMode={app.setStudyMode}
            studyDeckId={app.studyDeckId}
            setStudyDeckId={app.setStudyDeckId}
            studyCards={app.studyCards}
            currentStudyCard={app.currentStudyCard}
            revealed={app.revealed}
            setRevealed={app.setRevealed}
            studyIndex={app.studyIndex}
            reviewCurrentCard={app.reviewCurrentCard}
            skipStudyCard={app.skipStudyCard}
            restartStudySession={app.restartStudySession}
          />
        )}
      </div>
    </main>
  );
}