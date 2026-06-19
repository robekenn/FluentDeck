"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AppData,
  Deck,
  FlashCard,
  StudyRating,
  createCard,
  createDeck,
  createInitialData,
  formatTags,
  isDue,
  loadStoredData,
  normalizeTags,
  reviewCard,
  saveStoredData,
  todayISO,
} from "../lib/fluentdeck-data";

type View = "dashboard" | "manage" | "study";
type StudyMode = "due" | "all" | "new";

type DeckForm = {
  name: string;
  description: string;
  languageId: string;
};

type CardForm = {
  front: string;
  back: string;
  transliteration: string;
  example: string;
  notes: string;
  tags: string;
};

const emptyCardForm: CardForm = {
  front: "",
  back: "",
  transliteration: "",
  example: "",
  notes: "",
  tags: "",
};

export default function FluentDeckApp() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(() => createInitialData());
  const [view, setView] = useState<View>("dashboard");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("all");
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<CardForm>(emptyCardForm);
  const [studyMode, setStudyMode] = useState<StudyMode>("due");
  const [studyDeckId, setStudyDeckId] = useState<string>("all");
  const [studyIndex, setStudyIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const [deckForm, setDeckForm] = useState<DeckForm>({
    name: "",
    description: "",
    languageId: "lang_french",
  });

  useEffect(() => {
    const stored = loadStoredData();
    setData(stored);
    setSelectedDeckId(stored.decks[0]?.id ?? "");
    setDeckForm((previous) => ({
      ...previous,
      languageId: stored.languages[0]?.id ?? "",
    }));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      saveStoredData(data);
    }
  }, [data, ready]);

  const languageMap = useMemo(() => {
    return new Map(data.languages.map((language) => [language.id, language]));
  }, [data.languages]);

  const deckMap = useMemo(() => {
    return new Map(data.decks.map((deck) => [deck.id, deck]));
  }, [data.decks]);

  const cardsByDeck = useMemo(() => {
    const map = new Map<string, FlashCard[]>();

    for (const card of data.cards) {
      const list = map.get(card.deckId) ?? [];
      list.push(card);
      map.set(card.deckId, list);
    }

    return map;
  }, [data.cards]);

  const selectedDeck = data.decks.find((deck) => deck.id === selectedDeckId) ?? null;

  const visibleDecks = useMemo(() => {
    if (selectedLanguageId === "all") {
      return data.decks;
    }

    return data.decks.filter((deck) => deck.languageId === selectedLanguageId);
  }, [data.decks, selectedLanguageId]);

  const visibleCards = useMemo(() => {
    const text = search.trim().toLowerCase();

    return data.cards.filter((card) => {
      const deck = deckMap.get(card.deckId);

      if (!deck) {
        return false;
      }

      if (selectedLanguageId !== "all" && deck.languageId !== selectedLanguageId) {
        return false;
      }

      if (!text) {
        return true;
      }

      return [
        card.front,
        card.back,
        card.transliteration,
        card.example,
        card.notes,
        card.tags.join(" "),
        deck.name,
        languageMap.get(deck.languageId)?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(text);
    });
  }, [data.cards, deckMap, languageMap, search, selectedLanguageId]);

  const dueCards = useMemo(() => {
    return data.cards.filter((card) => isDue(card));
  }, [data.cards]);

  const newCards = useMemo(() => {
    return data.cards.filter((card) => card.repetitions === 0);
  }, [data.cards]);

  const reviewedCards = data.cards.filter((card) => card.lastReviewedAt !== null);

  const studyCards = useMemo(() => {
    let pool = data.cards;

    if (studyDeckId !== "all") {
      pool = pool.filter((card) => card.deckId === studyDeckId);
    }

    if (studyMode === "due") {
      pool = pool.filter((card) => isDue(card));
    }

    if (studyMode === "new") {
      pool = pool.filter((card) => card.repetitions === 0);
    }

    return [...pool].sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }

      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [data.cards, studyDeckId, studyMode]);

  const currentStudyCard = studyCards[studyIndex] ?? null;

  useEffect(() => {
    setStudyIndex(0);
    setRevealed(false);
  }, [studyMode, studyDeckId]);

  useEffect(() => {
    if (studyIndex >= studyCards.length) {
      setStudyIndex(0);
      setRevealed(false);
    }
  }, [studyCards.length, studyIndex]);

  function getDeckLanguage(deck: Deck | null | undefined) {
    if (!deck) {
      return null;
    }

    return languageMap.get(deck.languageId) ?? null;
  }

  function getCardLanguage(card: FlashCard) {
    return getDeckLanguage(deckMap.get(card.deckId));
  }

  function handleCreateDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deckForm.name.trim() || !deckForm.languageId) {
      return;
    }

    const deck = createDeck(deckForm);

    setData((current) => ({
      ...current,
      decks: [deck, ...current.decks],
    }));

    setSelectedDeckId(deck.id);
    setDeckForm({
      name: "",
      description: "",
      languageId: deckForm.languageId,
    });
    setView("manage");
  }

  function handleDeleteDeck(deckId: string) {
    const deck = deckMap.get(deckId);

    if (!deck) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${deck.name}" and all of its cards? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setData((current) => ({
      ...current,
      decks: current.decks.filter((item) => item.id !== deckId),
      cards: current.cards.filter((card) => card.deckId !== deckId),
    }));

    if (selectedDeckId === deckId) {
      const nextDeck = data.decks.find((item) => item.id !== deckId);
      setSelectedDeckId(nextDeck?.id ?? "");
    }
  }

  function handleCardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedDeckId || !cardForm.front.trim() || !cardForm.back.trim()) {
      return;
    }

    if (editingCardId) {
      setData((current) => ({
        ...current,
        cards: current.cards.map((card) => {
          if (card.id !== editingCardId) {
            return card;
          }

          return {
            ...card,
            front: cardForm.front.trim(),
            back: cardForm.back.trim(),
            transliteration: cardForm.transliteration.trim(),
            example: cardForm.example.trim(),
            notes: cardForm.notes.trim(),
            tags: normalizeTags(cardForm.tags),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));

      setEditingCardId(null);
      setCardForm(emptyCardForm);
      return;
    }

    const card = createCard({
      deckId: selectedDeckId,
      front: cardForm.front,
      back: cardForm.back,
      transliteration: cardForm.transliteration,
      example: cardForm.example,
      notes: cardForm.notes,
      tags: normalizeTags(cardForm.tags),
    });

    setData((current) => ({
      ...current,
      cards: [card, ...current.cards],
    }));

    setCardForm(emptyCardForm);
  }

  function startEditingCard(card: FlashCard) {
    setSelectedDeckId(card.deckId);
    setEditingCardId(card.id);
    setCardForm({
      front: card.front,
      back: card.back,
      transliteration: card.transliteration,
      example: card.example,
      notes: card.notes,
      tags: formatTags(card.tags),
    });
    setView("manage");
  }

  function cancelEditingCard() {
    setEditingCardId(null);
    setCardForm(emptyCardForm);
  }

  function deleteCard(cardId: string) {
    const confirmed = window.confirm("Delete this card?");

    if (!confirmed) {
      return;
    }

    setData((current) => ({
      ...current,
      cards: current.cards.filter((card) => card.id !== cardId),
    }));

    if (editingCardId === cardId) {
      cancelEditingCard();
    }
  }

  function rateCurrentCard(rating: StudyRating) {
    if (!currentStudyCard) {
      return;
    }

    const oldPoolLength = studyCards.length;

    setData((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === currentStudyCard.id ? reviewCard(card, rating) : card
      ),
    }));

    setRevealed(false);

    setStudyIndex((index) => {
      if (studyMode === "all") {
        return oldPoolLength <= 1 ? 0 : (index + 1) % oldPoolLength;
      }

      const nextLength = Math.max(0, oldPoolLength - 1);

      if (nextLength === 0) {
        return 0;
      }

      return Math.min(index, nextLength - 1);
    });
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
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
      const parsed = JSON.parse(text) as AppData;

      if (
        parsed.schemaVersion !== 1 ||
        !Array.isArray(parsed.languages) ||
        !Array.isArray(parsed.decks) ||
        !Array.isArray(parsed.cards)
      ) {
        throw new Error("Invalid FluentDeck file.");
      }

      setData(parsed);
      setSelectedDeckId(parsed.decks[0]?.id ?? "");
      setView("dashboard");
    } catch {
      window.alert("That file could not be imported. Make sure it is a FluentDeck JSON backup.");
    } finally {
      event.target.value = "";
    }
  }

  function resetDemoData() {
    const confirmed = window.confirm(
      "Reset everything back to the starter FluentDeck data? This will replace your current browser data."
    );

    if (!confirmed) {
      return;
    }

    const fresh = createInitialData();
    setData(fresh);
    setSelectedDeckId(fresh.decks[0]?.id ?? "");
    setSearch("");
    setView("dashboard");
  }

  const selectedDeckLanguage = getDeckLanguage(selectedDeck);

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300">
                French • Spanish • Hebrew • More
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                FluentDeck
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Build custom flashcard decks, practice vocabulary, and review
                languages with a clean spaced-repetition study flow.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-3">
              <MiniStat label="Cards" value={data.cards.length} />
              <MiniStat label="Due" value={dueCards.length} />
              <MiniStat label="Decks" value={data.decks.length} />
            </div>
          </div>

          <nav className="mt-6 flex flex-wrap gap-3">
            <NavButton active={view === "dashboard"} onClick={() => setView("dashboard")}>
              Dashboard
            </NavButton>
            <NavButton active={view === "manage"} onClick={() => setView("manage")}>
              Decks & Cards
            </NavButton>
            <NavButton active={view === "study"} onClick={() => setView("study")}>
              Study
            </NavButton>

            <div className="ml-0 flex flex-wrap gap-3 lg:ml-auto">
              <button
                onClick={exportData}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Export
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Import
              </button>

              <button
                onClick={resetDemoData}
                className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
              >
                Reset
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={importData}
              />
            </div>
          </nav>
        </header>

        <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={selectedLanguageId === "all"}
              onClick={() => setSelectedLanguageId("all")}
            >
              All Languages
            </FilterButton>

            {data.languages.map((language) => (
              <FilterButton
                key={language.id}
                active={selectedLanguageId === language.id}
                onClick={() => setSelectedLanguageId(language.id)}
              >
                {language.name}
              </FilterButton>
            ))}
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search cards, decks, tags..."
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-blue-400/40 placeholder:text-slate-500 focus:ring-4 sm:max-w-sm"
          />
        </section>

        {view === "dashboard" && (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total cards" value={data.cards.length} detail="Across every deck" />
                <StatCard title="Due today" value={dueCards.length} detail="Ready to review" />
                <StatCard title="New cards" value={newCards.length} detail="Never reviewed" />
                <StatCard
                  title="Reviewed"
                  value={reviewedCards.length}
                  detail="Cards you have studied"
                />
              </div>

              <Panel title="Languages">
                <div className="grid gap-4 md:grid-cols-3">
                  {data.languages.map((language) => {
                    const decks = data.decks.filter((deck) => deck.languageId === language.id);
                    const cards = data.cards.filter((card) => {
                      const deck = deckMap.get(card.deckId);
                      return deck?.languageId === language.id;
                    });
                    const due = cards.filter((card) => isDue(card)).length;

                    return (
                      <button
                        key={language.id}
                        onClick={() => {
                          setSelectedLanguageId(language.id);
                          setView("manage");
                        }}
                        className="group rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-left transition hover:-translate-y-1 hover:bg-white/10"
                      >
                        <div
                          className={`mb-5 h-2 rounded-full bg-gradient-to-r ${language.accent}`}
                        />
                        <h3 className="text-xl font-bold">{language.name}</h3>
                        <p className="mt-2 text-sm text-slate-400">
                          {decks.length} decks • {cards.length} cards • {due} due
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Quick study">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-slate-300">
                      You have{" "}
                      <span className="font-bold text-white">{dueCards.length}</span>{" "}
                      card{dueCards.length === 1 ? "" : "s"} due today.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Study cards often to push them farther into the future.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setStudyMode("due");
                      setStudyDeckId("all");
                      setView("study");
                    }}
                    className="rounded-2xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.02]"
                  >
                    Study Due Cards
                  </button>
                </div>
              </Panel>
            </div>

            <Panel title="Recent / Matching Cards">
              <CardList
                cards={visibleCards.slice(0, 8)}
                deckMap={deckMap}
                languageMap={languageMap}
                onEdit={startEditingCard}
                onDelete={deleteCard}
              />
            </Panel>
          </section>
        )}

        {view === "manage" && (
          <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-6">
              <Panel title="Create Deck">
                <form onSubmit={handleCreateDeck} className="space-y-4">
                  <Field label="Language">
                    <select
                      value={deckForm.languageId}
                      onChange={(event) =>
                        setDeckForm((current) => ({
                          ...current,
                          languageId: event.target.value,
                        }))
                      }
                      className="input"
                    >
                      {data.languages.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Deck name">
                    <input
                      value={deckForm.name}
                      onChange={(event) =>
                        setDeckForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Example: French Verbs"
                      className="input"
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      value={deckForm.description}
                      onChange={(event) =>
                        setDeckForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="What will this deck help you study?"
                      className="input min-h-24"
                    />
                  </Field>

                  <button className="w-full rounded-2xl bg-blue-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-blue-300">
                    Add Deck
                  </button>
                </form>
              </Panel>

              <Panel title="Decks">
                <div className="space-y-3">
                  {visibleDecks.map((deck) => {
                    const language = getDeckLanguage(deck);
                    const count = cardsByDeck.get(deck.id)?.length ?? 0;

                    return (
                      <div
                        key={deck.id}
                        className={`rounded-3xl border p-4 transition ${
                          selectedDeckId === deck.id
                            ? "border-blue-300/60 bg-blue-400/10"
                            : "border-white/10 bg-slate-950/40 hover:bg-white/5"
                        }`}
                      >
                        <button
                          onClick={() => setSelectedDeckId(deck.id)}
                          className="block w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                                {language?.name ?? "Unknown"}
                              </p>
                              <h3 className="mt-1 text-lg font-bold">{deck.name}</h3>
                              <p className="mt-1 text-sm text-slate-400">
                                {count} card{count === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>

                          {deck.description && (
                            <p className="mt-3 text-sm leading-6 text-slate-400">
                              {deck.description}
                            </p>
                          )}
                        </button>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              setStudyDeckId(deck.id);
                              setStudyMode("all");
                              setView("study");
                            }}
                            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
                          >
                            Study
                          </button>

                          <button
                            onClick={() => handleDeleteDeck(deck.id)}
                            className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {visibleDecks.length === 0 && (
                    <EmptyState
                      title="No decks yet"
                      message="Create your first deck to start adding cards."
                    />
                  )}
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel title={editingCardId ? "Edit Card" : "Add Card"}>
                {selectedDeck ? (
                  <form onSubmit={handleCardSubmit} className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-sm text-slate-400">Adding to</p>
                      <p className="font-bold">
                        {selectedDeck.name}{" "}
                        <span className="text-slate-500">
                          / {selectedDeckLanguage?.name ?? "Unknown"}
                        </span>
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Front">
                        <textarea
                          value={cardForm.front}
                          onChange={(event) =>
                            setCardForm((current) => ({
                              ...current,
                              front: event.target.value,
                            }))
                          }
                          placeholder="Word or phrase"
                          className="input min-h-28 text-lg"
                          dir={selectedDeckLanguage?.direction ?? "ltr"}
                        />
                      </Field>

                      <Field label="Back">
                        <textarea
                          value={cardForm.back}
                          onChange={(event) =>
                            setCardForm((current) => ({
                              ...current,
                              back: event.target.value,
                            }))
                          }
                          placeholder="Translation / answer"
                          className="input min-h-28 text-lg"
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Transliteration">
                        <input
                          value={cardForm.transliteration}
                          onChange={(event) =>
                            setCardForm((current) => ({
                              ...current,
                              transliteration: event.target.value,
                            }))
                          }
                          placeholder="Example: shalom"
                          className="input"
                        />
                      </Field>

                      <Field label="Tags">
                        <input
                          value={cardForm.tags}
                          onChange={(event) =>
                            setCardForm((current) => ({
                              ...current,
                              tags: event.target.value,
                            }))
                          }
                          placeholder="verbs, beginner, travel"
                          className="input"
                        />
                      </Field>
                    </div>

                    <Field label="Example sentence">
                      <textarea
                        value={cardForm.example}
                        onChange={(event) =>
                          setCardForm((current) => ({
                            ...current,
                            example: event.target.value,
                          }))
                        }
                        placeholder="Add the word in context"
                        className="input min-h-24"
                        dir={selectedDeckLanguage?.direction ?? "ltr"}
                      />
                    </Field>

                    <Field label="Notes">
                      <textarea
                        value={cardForm.notes}
                        onChange={(event) =>
                          setCardForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Grammar notes, memory tricks, pronunciation reminders..."
                        className="input min-h-24"
                      />
                    </Field>

                    <div className="flex flex-wrap gap-3">
                      <button className="rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-300">
                        {editingCardId ? "Update Card" : "Add Card"}
                      </button>

                      {editingCardId && (
                        <button
                          type="button"
                          onClick={cancelEditingCard}
                          className="rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-200 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <EmptyState
                    title="Choose a deck first"
                    message="Create or select a deck before adding flashcards."
                  />
                )}
              </Panel>

              <Panel title="Cards">
                <CardList
                  cards={visibleCards}
                  deckMap={deckMap}
                  languageMap={languageMap}
                  onEdit={startEditingCard}
                  onDelete={deleteCard}
                />
              </Panel>
            </div>
          </section>
        )}

        {view === "study" && (
          <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <Panel title="Study Settings">
              <div className="space-y-5">
                <Field label="Study mode">
                  <select
                    value={studyMode}
                    onChange={(event) => setStudyMode(event.target.value as StudyMode)}
                    className="input"
                  >
                    <option value="due">Due cards</option>
                    <option value="new">New cards</option>
                    <option value="all">All cards</option>
                  </select>
                </Field>

                <Field label="Deck">
                  <select
                    value={studyDeckId}
                    onChange={(event) => setStudyDeckId(event.target.value)}
                    className="input"
                  >
                    <option value="all">All decks</option>
                    {data.decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-sm text-slate-400">Current session</p>
                  <p className="mt-2 text-3xl font-black">{studyCards.length}</p>
                  <p className="text-sm text-slate-500">
                    card{studyCards.length === 1 ? "" : "s"} available
                  </p>
                </div>

                <button
                  onClick={() => {
                    setStudyIndex(0);
                    setRevealed(false);
                  }}
                  className="w-full rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-200 hover:bg-white/10"
                >
                  Restart Session
                </button>
              </div>
            </Panel>

            <Panel title="Review">
              {currentStudyCard ? (
                <StudyCard
                  card={currentStudyCard}
                  deck={deckMap.get(currentStudyCard.deckId) ?? null}
                  language={getCardLanguage(currentStudyCard)}
                  revealed={revealed}
                  progress={`${studyIndex + 1} / ${studyCards.length}`}
                  onReveal={() => setRevealed(true)}
                  onSkip={() => {
                    setRevealed(false);
                    setStudyIndex((index) =>
                      studyCards.length <= 1 ? 0 : (index + 1) % studyCards.length
                    );
                  }}
                  onRate={rateCurrentCard}
                />
              ) : (
                <EmptyState
                  title="Nothing to study right now"
                  message="Add more cards, switch to all cards, or come back when more cards are due."
                />
              )}
            </Panel>
          </section>
        )}
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-2xl bg-white/[0.06] p-4 text-center">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
    </div>
  );
}

function NavButton({
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
      className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
        active
          ? "bg-white text-slate-950"
          : "border border-white/10 text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
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

function StatCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
      <p className="text-sm font-semibold text-slate-400">{title}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/20 backdrop-blur">
      <h2 className="mb-5 text-xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950/30 p-8 text-center">
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
    </div>
  );
}

function CardList({
  cards,
  deckMap,
  languageMap,
  onEdit,
  onDelete,
}: {
  cards: FlashCard[];
  deckMap: Map<string, Deck>;
  languageMap: Map<string, { id: string; name: string; direction: "ltr" | "rtl" }>;
  onEdit: (card: FlashCard) => void;
  onDelete: (cardId: string) => void;
}) {
  if (cards.length === 0) {
    return (
      <EmptyState
        title="No cards found"
        message="Try changing the language filter, clearing search, or adding a new card."
      />
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const deck = deckMap.get(card.deckId);
        const language = deck ? languageMap.get(deck.languageId) : null;
        const due = isDue(card);

        return (
          <article
            key={card.id}
            className="rounded-3xl border border-white/10 bg-slate-950/45 p-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge>{language?.name ?? "Unknown"}</Badge>
                  <Badge>{deck?.name ?? "No deck"}</Badge>
                  <Badge>{due ? "Due" : `Due ${card.dueDate}`}</Badge>
                </div>

                <h3
                  className="text-2xl font-black"
                  dir={language?.direction ?? "ltr"}
                >
                  {card.front}
                </h3>

                {card.transliteration && (
                  <p className="mt-1 text-sm text-blue-200">
                    {card.transliteration}
                  </p>
                )}

                <p className="mt-3 text-slate-300">{card.back}</p>

                {card.example && (
                  <p
                    className="mt-3 rounded-2xl bg-white/[0.05] p-3 text-sm text-slate-300"
                    dir={language?.direction ?? "ltr"}
                  >
                    {card.example}
                  </p>
                )}

                {card.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => onEdit(card)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
                >
                  Edit
                </button>

                <button
                  onClick={() => onDelete(card.id)}
                  className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-400">
      {children}
    </span>
  );
}

function StudyCard({
  card,
  deck,
  language,
  revealed,
  progress,
  onReveal,
  onSkip,
  onRate,
}: {
  card: FlashCard;
  deck: Deck | null;
  language: { id: string; name: string; direction: "ltr" | "rtl" } | null;
  revealed: boolean;
  progress: string;
  onReveal: () => void;
  onSkip: () => void;
  onRate: (rating: StudyRating) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{progress}</Badge>
          <Badge>{language?.name ?? "Unknown"}</Badge>
          <Badge>{deck?.name ?? "No deck"}</Badge>
        </div>

        <button
          onClick={onSkip}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"
        >
          Skip
        </button>
      </div>

      <div className="min-h-[22rem] rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-slate-500">
          Front
        </p>

        <div
          className="flex min-h-32 items-center justify-center rounded-3xl bg-white/[0.05] p-8 text-center"
          dir={language?.direction ?? "ltr"}
        >
          <p className="text-4xl font-black leading-tight sm:text-6xl">{card.front}</p>
        </div>

        {card.transliteration && (
          <p className="mt-4 text-center text-blue-200">{card.transliteration}</p>
        )}

        {!revealed ? (
          <div className="mt-8 flex justify-center">
            <button
              onClick={onReveal}
              className="rounded-2xl bg-white px-8 py-4 text-lg font-black text-slate-950 transition hover:scale-[1.02]"
            >
              Reveal Answer
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-5">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-emerald-200">
                Back
              </p>
              <p className="text-2xl font-bold text-white">{card.back}</p>
            </div>

            {card.example && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <p className="mb-2 text-sm font-bold text-slate-400">Example</p>
                <p dir={language?.direction ?? "ltr"}>{card.example}</p>
              </div>
            )}

            {card.notes && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <p className="mb-2 text-sm font-bold text-slate-400">Notes</p>
                <p className="leading-7 text-slate-300">{card.notes}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-4">
              <RatingButton
                label="Again"
                detail="Review now"
                className="border-red-300/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                onClick={() => onRate("again")}
              />
              <RatingButton
                label="Hard"
                detail="Soon"
                className="border-amber-300/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                onClick={() => onRate("hard")}
              />
              <RatingButton
                label="Good"
                detail="Later"
                className="border-blue-300/30 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20"
                onClick={() => onRate("good")}
              />
              <RatingButton
                label="Easy"
                detail="Much later"
                className="border-emerald-300/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                onClick={() => onRate("easy")}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <MiniStudyStat label="Due" value={card.dueDate} />
        <MiniStudyStat label="Interval" value={`${card.intervalDays}d`} />
        <MiniStudyStat label="Ease" value={card.easeFactor.toFixed(2)} />
        <MiniStudyStat label="Reviews" value={String(card.repetitions)} />
      </div>
    </div>
  );
}

function RatingButton({
  label,
  detail,
  className,
  onClick,
}: {
  label: string;
  detail: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${className}`}
    >
      <p className="font-black">{label}</p>
      <p className="mt-1 text-xs opacity-75">{detail}</p>
    </button>
  );
}

function MiniStudyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-black text-slate-200">{value}</p>
    </div>
  );
}