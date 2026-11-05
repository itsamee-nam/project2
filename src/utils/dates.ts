/** All dates are handled in the device's local time zone as YYYY-MM-DD strings. */

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

/** Parse YYYY-MM-DD as local midnight. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from `from` (default today) until `iso`. Negative if in the past. */
export function daysUntil(iso: string, from: Date = new Date()): number {
  const a = fromISODate(todayISO(from)).getTime();
  const b = fromISODate(iso).getTime();
  return Math.round((b - a) / 86400000);
}

export type ExpiryStatus = 'none' | 'ok' | 'soon' | 'expired';

export const EXPIRING_SOON_DAYS = 3;

export function expiryStatus(iso: string | null | undefined, from: Date = new Date()): ExpiryStatus {
  if (!iso) return 'none';
  const d = daysUntil(iso, from);
  if (d < 0) return 'expired';
  if (d <= EXPIRING_SOON_DAYS) return 'soon';
  return 'ok';
}

export function expiryLabel(iso: string | null | undefined, from: Date = new Date()): string {
  if (!iso) return 'No expiry date';
  const d = daysUntil(iso, from);
  if (d < -1) return `Expired ${-d} days ago`;
  if (d === -1) return 'Expired yesterday';
  if (d === 0) return 'Expires today';
  if (d === 1) return 'Expires tomorrow';
  return `Expires in ${d} days`;
}

export function formatDisplayDate(iso: string): string {
  const d = fromISODate(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}
