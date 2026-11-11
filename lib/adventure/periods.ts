export type QuestKind = "daily" | "weekly";

export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Fixed UTC periods cannot be repeated by changing the browser's time zone. */
export function questPeriod(kind: QuestKind, now: Date): { period: string; start: string; end: string } {
  const start = new Date(`${utcDay(now)}T00:00:00.000Z`);
  if (kind === "weekly") start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + (kind === "daily" ? 1 : 7));
  return { period: utcDay(start), start: start.toISOString(), end: end.toISOString() };
}

export const validInstant = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  Number.isFinite(new Date(value).getTime()) && new Date(value).toISOString() === value;

export const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/.test(value) &&
  value !== "constructor" && value !== "prototype";
