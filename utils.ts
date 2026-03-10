import type { Book, EventItem, MarketKey, OddsFormat, Outcome } from './types';

export const BOOK_ORDER = ['pinnacle', 'fanduel', 'draftkings'] as const;

export function formatOdds(price: number, format: OddsFormat): string {
  if (format === 'american') {
    return price > 0 ? `+${price}` : `${price}`;
  }
  if (price > 0) {
    return (1 + price / 100).toFixed(2);
  }
  return (1 + 100 / Math.abs(price)).toFixed(2);
}

export function getMarket(book: Book, marketKey: MarketKey) {
  return book.markets.find((market) => market.key === marketKey);
}

export function outcomeLabel(outcome: Outcome, marketKey: MarketKey): string {
  if (marketKey === 'h2h') return outcome.name;
  const point = typeof outcome.point === 'number' ? ` ${outcome.point > 0 ? '+' : ''}${outcome.point}` : '';
  return `${outcome.name}${point}`;
}

function normalizedComparatorValue(price: number, point?: number): number {
  return point ?? Number.NaN || 0;
}

function sameOutcome(a: Outcome, b: Outcome, marketKey: MarketKey): boolean {
  if (a.name !== b.name) return false;
  if (marketKey === 'h2h') return true;
  return normalizedComparatorValue(a.price, a.point) === normalizedComparatorValue(b.price, b.point);
}

export function isBetterPrice(candidate: Outcome, incumbent: Outcome): boolean {
  return candidate.price > incumbent.price;
}

export function bestOutcomeByLabel(event: EventItem, marketKey: MarketKey) {
  const bestMap = new Map<string, { bookKey: string; outcome: Outcome }>();

  for (const book of event.books) {
    const market = getMarket(book, marketKey);
    if (!market) continue;
    for (const outcome of market.outcomes) {
      const label = outcomeLabel(outcome, marketKey);
      const current = bestMap.get(label);
      if (!current || isBetterPrice(outcome, current.outcome)) {
        bestMap.set(label, { bookKey: book.key, outcome });
      }
    }
  }

  return bestMap;
}

export function teamScore(event: EventItem, teamName: string): string | null {
  return event.scores?.find((item) => item.name === teamName)?.score ?? null;
}

export function eventStatus(event: EventItem): string {
  if (event.completed) return 'Final';
  if (event.isLive) return 'Live';
  return 'Upcoming';
}

export function relativeUpdated(iso?: string): string {
  if (!iso) return '—';
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}
