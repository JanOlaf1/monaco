/**
 * Calendar-date helpers using the learner's LOCAL date. Deadlines are stored
 * as date keys ("YYYY-MM-DD") rather than timestamps, so "due on the 14th"
 * means the 14th wherever the learner is, and DST changes can't shift it.
 */

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const match = DATE_KEY.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day };
}

export function isValidDateKey(key: string): boolean {
  return parseDateKey(key) !== null;
}

export function addDays(key: string, days: number): string {
  const parts = parseDateKey(key);
  if (!parts) throw new Error(`Invalid date key: ${key}`);
  return toDateKey(new Date(parts.year, parts.month - 1, parts.day + days));
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const a = parseDateKey(from);
  const b = parseDateKey(to);
  if (!a || !b) throw new Error(`Invalid date key: ${from} / ${to}`);
  const utcA = Date.UTC(a.year, a.month - 1, a.day);
  const utcB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((utcB - utcA) / 86_400_000);
}
