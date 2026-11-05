/**
 * Parsing and scaling of recipe measures such as "1 1/2 cups", "250g", "4-6 medium", "to taste".
 * Replaces the Kotlin QuantityScaler from Project I (which could not handle mixed fractions or ranges).
 */

const VULGAR: Record<string, string> = {
  '½': ' 1/2', '¼': ' 1/4', '¾': ' 3/4', '⅓': ' 1/3', '⅔': ' 2/3', '⅛': ' 1/8', '⅜': ' 3/8', '⅝': ' 5/8', '⅞': ' 7/8',
};

const NUM = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)`;
const MEASURE_RE = new RegExp(String.raw`^\s*${NUM}(?:\s*(?:-|–|to)\s*${NUM})?(\s*)(.*)$`, 'i');

function replaceVulgar(s: string): string {
  return s.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, (c) => VULGAR[c]).replace(/(\d)\s+(\d\/\d)/g, '$1 $2');
}

export function parseNumber(s: string): number {
  const t = s.trim();
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(t);
}

const FRACTIONS: [number, string][] = [
  [0, ''], [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'], [1 / 2, '1/2'],
  [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'], [7 / 8, '7/8'], [1, ''],
];

/** 1.5 -> "1 1/2", 0.33 -> "1/3", 3 -> "3" */
export function formatFraction(value: number): string {
  if (!isFinite(value) || value <= 0) return '0';
  let whole = Math.floor(value);
  const frac = value - whole;
  let best = FRACTIONS[0];
  for (const f of FRACTIONS) if (Math.abs(f[0] - frac) < Math.abs(best[0] - frac)) best = f;
  if (best[0] === 1) {
    whole += 1;
    best = FRACTIONS[0];
  }
  if (!best[1]) return whole === 0 ? '1/8' : String(whole);
  return whole === 0 ? best[1] : `${whole} ${best[1]}`;
}

const METRIC = /^(g|gm|gram|grams|kg|ml|l|litre|liter|oz|lb|lbs|mg)\b/i;

function formatAmount(value: number, rest: string): string {
  if (METRIC.test(rest.trim())) {
    // metric/weights: whole numbers when big, one decimal when small
    if (value >= 10) return String(Math.round(value));
    return String(Math.round(value * 10) / 10);
  }
  return formatFraction(value);
}

/** Scale a measure by `factor`. Non-numeric measures ("to taste", "pinch") are returned unchanged. */
export function scaleMeasure(measure: string, factor: number): string {
  if (!measure || factor === 1) return measure;
  const m = replaceVulgar(measure).match(MEASURE_RE);
  if (!m) return measure;
  const [, a, b, sep, rest] = m;
  const lo = parseNumber(a) * factor;
  const first = formatAmount(lo, rest);
  const amount = b ? `${first}-${formatAmount(parseNumber(b) * factor, rest)}` : first;
  return `${amount}${rest ? sep : ''}${rest}`.trim();
}

/** The numeric part of a measure (midpoint of a range) and the remaining text. */
export function splitMeasure(measure: string): { amount: number | null; rest: string } {
  const m = replaceVulgar(measure).match(MEASURE_RE);
  if (!m) return { amount: null, rest: measure.trim() };
  const lo = parseNumber(m[1]);
  const hi = m[2] ? parseNumber(m[2]) : lo;
  return { amount: (lo + hi) / 2, rest: m[4].trim() };
}

export interface GramHints {
  /** grams in a typical whole piece (1 onion, 1 egg) */
  pieceG?: number;
  /** grams in one measuring cup */
  cupG?: number;
  /** grams in one tablespoon */
  tbspG?: number;
}

/** Best-effort conversion of a measure to grams. Returns null when unknown ("to taste"). */
export function measureToGrams(measure: string, hints: GramHints = {}): number | null {
  const { amount, rest } = splitMeasure(measure);
  if (amount === null) return null;
  const unit = rest.toLowerCase().replace(/[.,]/g, '').split(/\s+/)[0] ?? '';
  const tbsp = hints.tbspG ?? 15;
  const cup = hints.cupG ?? 150;
  switch (true) {
    case /^(g|gm|gram|grams)$/.test(unit): return amount;
    case unit === 'kg': return amount * 1000;
    case unit === 'mg': return amount / 1000;
    case /^(ml|millilitre|milliliter|millilitres|milliliters)$/.test(unit): return amount;
    case /^(l|litre|liter|litres|liters)$/.test(unit): return amount * 1000;
    case /^(oz|ounce|ounces)$/.test(unit): return amount * 28.35;
    case /^(lb|lbs|pound|pounds)$/.test(unit): return amount * 453.6;
    case /^(cup|cups)$/.test(unit): return amount * cup;
    case /^(tbsp|tablespoon|tablespoons|tbs)$/.test(unit): return amount * tbsp;
    case /^(tsp|teaspoon|teaspoons)$/.test(unit): return amount * (tbsp / 3);
    case /^(pinch|dash)$/.test(unit): return amount * 0.5;
    case /^(clove|cloves)$/.test(unit): return amount * 4;
    case /^(can|cans|tin|tins)$/.test(unit): return amount * 400;
    case /^(slice|slices)$/.test(unit): return amount * 25;
    case /^(bunch|bunches)$/.test(unit): return amount * 100;
    case /^(small)$/.test(unit): return amount * (hints.pieceG ?? 60) * 0.7;
    case /^(large|big)$/.test(unit): return amount * (hints.pieceG ?? 60) * 1.4;
    case /^(medium|piece|pieces|pcs|pc|whole|each|)$/.test(unit): return amount * (hints.pieceG ?? 60);
    default:
      // "1 tbsp minced" handled above; anything else we cannot trust
      return hints.pieceG ? amount * hints.pieceG : null;
  }
}
