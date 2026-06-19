import type {
  Deck,
  FlashCard,
  Language,
  StudyMode,
  StudyRating,
} from "../../lib/fluentdeck/types";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Field from "../ui/Field";
import Panel from "../ui/Panel";
import StudyCard from "./StudyCard";

export default function StudyView({
  decks,
  languageMap,
  deckMap,
  studyMode,
  setStudyMode,
  studyDeckId,
  setStudyDeckId,
  studyCards,
  currentStudyCard,
  revealed,
  setRevealed,
  studyIndex,
  reviewCurrentCard,
  skipStudyCard,
  restartStudySession,
}: {
  decks: Deck[];
  languageMap: Map<string, Language>;
  deckMap: Map<string, Deck>;
  studyMode: StudyMode;
  setStudyMode: (mode: StudyMode) => void;
  studyDeckId: string;
  setStudyDeckId: (id: string) => void;
  studyCards: FlashCard[];
  currentStudyCard: FlashCard | null;
  revealed: boolean;
  setRevealed: (value: boolean) => void;
  studyIndex: number;
  reviewCurrentCard: (rating: StudyRating) => void;
  skipStudyCard: () => void;
  restartStudySession: () => void;
}) {
  const deck = currentStudyCard ? deckMap.get(currentStudyCard.deckId) ?? null : null;
  const language = deck ? languageMap.get(deck.languageId) ?? null : null;

  return (
    <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      <Panel title="Study Setup" subtitle="Pick what kind of review session you want.">
        <div className="space-y-5">
          <Field label="Mode">
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
              {decks.map((deckOption) => (
                <option key={deckOption.id} value={deckOption.id}>
                  {deckOption.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-sm text-slate-400">Cards in this session</p>
            <p className="mt-2 text-5xl font-black">{studyCards.length}</p>
          </div>

          <Button className="w-full" onClick={restartStudySession}>
            Restart Session
          </Button>
        </div>
      </Panel>

      <Panel title="Review" subtitle="Reveal the answer, then rate how well you knew it.">
        {currentStudyCard ? (
          <StudyCard
            card={currentStudyCard}
            deck={deck}
            language={language}
            revealed={revealed}
            progress={`${studyIndex + 1} / ${studyCards.length}`}
            onReveal={() => setRevealed(true)}
            onSkip={skipStudyCard}
            onRate={reviewCurrentCard}
          />
        ) : (
          <EmptyState
            title="Nothing to study right now"
            message="Add more cards, switch to all cards, or come back when more cards are due."
          />
        )}
      </Panel>
    </section>
  );
}