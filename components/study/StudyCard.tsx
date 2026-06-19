import type { Deck, FlashCard, Language, StudyRating } from "../../lib/fluentdeck/types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function StudyCard({
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
  language: Language | null;
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

        <Button onClick={onSkip}>Skip</Button>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-slate-500">
          Front
        </p>

        <div
          className="flex min-h-44 items-center justify-center rounded-3xl bg-white/[0.05] p-8 text-center"
          dir={language?.direction ?? "ltr"}
        >
          <p className="text-4xl font-black leading-tight sm:text-6xl">
            {card.front}
          </p>
        </div>

        {card.transliteration && (
          <p className="mt-4 text-center text-blue-200">{card.transliteration}</p>
        )}

        {!revealed ? (
          <div className="mt-8 flex justify-center">
            <Button variant="primary" className="px-8 py-4 text-lg" onClick={onReveal}>
              Reveal Answer
            </Button>
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