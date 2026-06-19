import type { View } from "../../lib/fluentdeck/types";
import Button from "../ui/Button";

export default function AppHeader({
  view,
  setView,
  cardCount,
  deckCount,
  dueCount,
  onExport,
  onImportClick,
  onReset,
}: {
  view: View;
  setView: (view: View) => void;
  cardCount: number;
  deckCount: number;
  dueCount: number;
  onExport: () => void;
  onImportClick: () => void;
  onReset: () => void;
}) {
  return (
    <header className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300">
            French • Spanish • Hebrew • More
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            FluentDeck
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            A calm, organized flashcard space for building vocabulary and reviewing
            languages over time.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-3">
          <HeaderStat label="Cards" value={cardCount} />
          <HeaderStat label="Due" value={dueCount} />
          <HeaderStat label="Decks" value={deckCount} />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <nav className="flex flex-wrap gap-3">
          <TabButton active={view === "dashboard"} onClick={() => setView("dashboard")}>
            Dashboard
          </TabButton>
          <TabButton active={view === "library"} onClick={() => setView("library")}>
            Library
          </TabButton>
          <TabButton active={view === "study"} onClick={() => setView("study")}>
            Study
          </TabButton>
        </nav>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onExport}>Export</Button>
          <Button onClick={onImportClick}>Import</Button>
          <Button variant="danger" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeaderStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-2xl bg-white/[0.06] p-4 text-center">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
    </div>
  );
}

function TabButton({
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