import { isDue } from "../../lib/fluentdeck/srs";
import type { Deck, FlashCard, Language } from "../../lib/fluentdeck/types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

export default function CardList({
  cards,
  deckMap,
  languageMap,
  onEdit,
  onDelete,
}: {
  cards: FlashCard[];
  deckMap: Map<string, Deck>;
  languageMap: Map<string, Language>;
  onEdit: (card: FlashCard) => void;
  onDelete: (cardId: string) => void;
}) {
  if (cards.length === 0) {
    return (
      <EmptyState
        title="No cards found"
        message="Try changing the filter, clearing search, or adding a new card."
      />
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const deck = deckMap.get(card.deckId);
        const language = deck ? languageMap.get(deck.languageId) : null;

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
                  <Badge>{isDue(card) ? "Due" : `Due ${card.dueDate}`}</Badge>
                </div>

                <h3 className="text-2xl font-black" dir={language?.direction ?? "ltr"}>
                  {card.front}
                </h3>

                {card.transliteration && (
                  <p className="mt-1 text-sm text-blue-200">{card.transliteration}</p>
                )}

                <p className="mt-3 text-slate-300">{card.back}</p>

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
                <Button className="px-3 py-1.5 text-xs" onClick={() => onEdit(card)}>
                  Edit
                </Button>

                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => onDelete(card.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}