import { isDue } from "../../lib/fluentdeck/srs";
import type {
  Deck,
  FlashCard,
  Language,
  StudyMode,
  View,
} from "../../lib/fluentdeck/types";
import Button from "../ui/Button";
import Panel from "../ui/Panel";

export default function DashboardView({
  languages,
  decks,
  cards,
  languageMap,
  deckMap,
  dueCards,
  newCards,
  reviewedCards,
  setView,
  setSelectedLanguageId,
  setStudyMode,
  setStudyDeckId,
}: {
  languages: Language[];
  decks: Deck[];
  cards: FlashCard[];
  languageMap: Map<string, Language>;
  deckMap: Map<string, Deck>;
  dueCards: FlashCard[];
  newCards: FlashCard[];
  reviewedCards: FlashCard[];
  setView: (view: View) => void;
  setSelectedLanguageId: (id: string) => void;
  setStudyMode: (mode: StudyMode) => void;
  setStudyDeckId: (id: string) => void;
}) {
  return (
    <section className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total cards" value={cards.length} detail="Across every deck" />
        <StatCard title="Due today" value={dueCards.length} detail="Ready to review" />
        <StatCard title="New cards" value={newCards.length} detail="Never reviewed" />
        <StatCard title="Reviewed" value={reviewedCards.length} detail="Studied at least once" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <Panel title="Languages" subtitle="Choose a language to manage its decks.">
          <div className="grid gap-4 md:grid-cols-3">
            {languages.map((language) => {
              const languageDecks = decks.filter((deck) => deck.languageId === language.id);

              const languageCards = cards.filter((card) => {
                const deck = deckMap.get(card.deckId);
                return deck?.languageId === language.id;
              });

              const due = languageCards.filter((card) => isDue(card)).length;

              return (
                <button
                  key={language.id}
                  onClick={() => {
                    setSelectedLanguageId(language.id);
                    setView("library");
                  }}
                  className="group rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-left transition hover:-translate-y-1 hover:bg-white/10"
                >
                  <div className={`mb-5 h-2 rounded-full bg-gradient-to-r ${language.accent}`} />

                  <h3 className="text-xl font-bold">{language.name}</h3>

                  <p className="mt-2 text-sm text-slate-400">
                    {languageDecks.length} decks • {languageCards.length} cards • {due} due
                  </p>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Next review" subtitle="Jump straight into today’s practice.">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm text-slate-400">Cards due today</p>
              <p className="mt-2 text-5xl font-black">{dueCards.length}</p>
            </div>

            <Button
              variant="primary"
              className="w-full py-4 text-base"
              onClick={() => {
                setStudyMode("due");
                setStudyDeckId("all");
                setView("study");
              }}
            >
              Study Due Cards
            </Button>

            <Button
              className="w-full py-4 text-base"
              onClick={() => {
                setStudyMode("all");
                setStudyDeckId("all");
                setView("study");
              }}
            >
              Study Everything
            </Button>
          </div>
        </Panel>
      </div>

      <Panel title="Recent cards" subtitle="A quieter preview of what is in your library.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.slice(0, 6).map((card) => {
            const deck = deckMap.get(card.deckId);
            const language = deck ? languageMap.get(deck.languageId) : null;

            return (
              <article
                key={card.id}
                className="rounded-3xl border border-white/10 bg-slate-950/45 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  {language?.name ?? "Unknown"} / {deck?.name ?? "No deck"}
                </p>

                <h3 className="mt-3 text-2xl font-black" dir={language?.direction ?? "ltr"}>
                  {card.front}
                </h3>

                <p className="mt-2 text-sm text-slate-300">{card.back}</p>
              </article>
            );
          })}
        </div>
      </Panel>
    </section>
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