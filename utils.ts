export type OddsFormat = 'american' | 'decimal';

export function americanToDecimal(american: number): number {
  if (american > 0) {
    return 1 + american / 100;
  }
  return 1 + 100 / Math.abs(american);
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

export function formatOdds(value: number, format: OddsFormat): string {
  if (!Number.isFinite(value)) return '—';

  if (format === 'decimal') {
    const decimal = value > 0 || value < 0 ? americanToDecimal(value) : value;
    return decimal.toFixed(2);
  }

  if (value > 0) return `+${Math.round(value)}`;
  return `${Math.round(value)}`;
}

function normalizedComparatorValue(price: number, point?: number): number {
  if (typeof point === 'number' && Number.isFinite(point)) {
    return point;
  }
  return 0;
}

export function isBetterMoneyline(candidatePrice: number, currentBestPrice?: number): boolean {
  if (currentBestPrice === undefined) return true;
  return candidatePrice > currentBestPrice;
}

export function isBetterSpreadOrTotal(
  candidatePoint: number | undefined,
  candidatePrice: number,
  bestPoint: number | undefined,
  bestPrice: number | undefined
): boolean {
  const candidateValue = normalizedComparatorValue(candidatePrice, candidatePoint);
  const bestValue = normalizedComparatorValue(bestPrice ?? 0, bestPoint);

  if (candidateValue !== bestValue) {
    return candidateValue > bestValue;
  }

  if (bestPrice === undefined) return true;
  return candidatePrice > bestPrice;
}
