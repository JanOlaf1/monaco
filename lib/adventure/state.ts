import { COSMETICS, CRYSTAL_REWARDS, cosmeticById, type CosmeticId, type CosmeticSlot } from "./catalog";
import { questPeriod, utcDay, validId, validInstant, type QuestKind } from "./periods";

export type EarnKind = keyof typeof CRYSTAL_REWARDS;
export interface CrystalAward {
  id: string;
  kind: EarnKind;
  at: string;
  amount: number;
  sourceId: string;
}
export interface CosmeticPurchase {
  id: string;
  kind: "purchase";
  at: string;
  amount: number;
  itemId: CosmeticId;
}
export interface QuestEnrollment {
  id: string;
  kind: "quest";
  at: string;
  quest: QuestKind;
  period: string;
}
export interface VerifiedCheck {
  id: string;
  kind: "check";
  at: string;
  exerciseId: string;
  stepId: string;
}
export interface LearningActivity {
  id: string;
  kind: "activity";
  at: string;
  exerciseId: string;
  mode: "completion" | "review";
}
export type AdventureEvent = CrystalAward | CosmeticPurchase | QuestEnrollment | VerifiedCheck | LearningActivity;

/** Independent local-first document; no SDK, server time, or account fields. */
export interface AdventureState {
  version: 1;
  events: Record<string, AdventureEvent>;
  equipped: Partial<Record<CosmeticSlot, CosmeticId>>;
  showMessages: boolean;
  settingsAt: string;
}

export const emptyAdventure: AdventureState = {
  version: 1, events: {}, equipped: {}, showMessages: true, settingsAt: "1970-01-01T00:00:00.000Z",
};

export const eventId = {
  exercise: (id: string) => `crystal:exercise:${id}`,
  chapter: (id: string) => `crystal:chapter:${id}`,
  daily: (period: string) => `crystal:daily:${period}`,
  weekly: (period: string) => `crystal:weekly:${period}`,
  review: (period: string) => `crystal:review:${period}`,
  purchase: (id: string) => `purchase:${id}`,
  quest: (kind: QuestKind, period: string) => `quest:${kind}:${period}`,
  check: (day: string, exercise: string, step: string) => `check:${day}:${exercise}:${step}`,
  activity: (day: string, exercise: string) => `activity:${day}:${exercise}`,
};

const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function parseEvent(raw: unknown, id: string): AdventureEvent | null {
  if (!record(raw) || raw.id !== id || !validInstant(raw.at)) return null;
  const at = raw.at;
  const day = utcDay(new Date(at));
  if (raw.kind === "purchase") {
    const item = typeof raw.itemId === "string" ? cosmeticById(raw.itemId) : undefined;
    if (!item || id !== eventId.purchase(item.id) || raw.amount !== -item.cost) return null;
    return { id, kind: "purchase", at, itemId: item.id, amount: -item.cost };
  }
  if (raw.kind === "quest") {
    if (raw.quest !== "daily" && raw.quest !== "weekly") return null;
    const { period } = questPeriod(raw.quest, new Date(at));
    if (raw.period !== period || id !== eventId.quest(raw.quest, period)) return null;
    return { id, kind: "quest", at, quest: raw.quest, period };
  }
  if (raw.kind === "check") {
    if (!validId(raw.exerciseId) || !validId(raw.stepId) || id !== eventId.check(day, raw.exerciseId, raw.stepId)) return null;
    return { id, kind: "check", at, exerciseId: raw.exerciseId, stepId: raw.stepId };
  }
  if (raw.kind === "activity") {
    if (!validId(raw.exerciseId) || (raw.mode !== "completion" && raw.mode !== "review") || id !== eventId.activity(day, raw.exerciseId)) return null;
    return { id, kind: "activity", at, exerciseId: raw.exerciseId, mode: raw.mode };
  }
  if (typeof raw.kind !== "string" || !Object.hasOwn(CRYSTAL_REWARDS, raw.kind)) return null;
  const kind = raw.kind as EarnKind;
  if (raw.amount !== CRYSTAL_REWARDS[kind] || typeof raw.sourceId !== "string") return null;
  const sourceId = raw.sourceId;
  if (kind === "exercise" && (!validId(sourceId) || id !== eventId.exercise(sourceId))) return null;
  if (kind === "chapter" && (sourceId.split(":").length !== 2 || !sourceId.split(":").every(validId) || id !== eventId.chapter(sourceId))) return null;
  if ((kind === "daily" || kind === "weekly") && (sourceId !== questPeriod(kind, new Date(at)).period || id !== eventId[kind](sourceId))) return null;
  if (kind === "review" && (!validId(sourceId) || id !== eventId.review(day))) return null;
  return { id, kind, at, amount: CRYSTAL_REWARDS[kind], sourceId };
}

export const isCrystalAward = (event: AdventureEvent): event is CrystalAward =>
  Object.hasOwn(CRYSTAL_REWARDS, event.kind);

export function crystalBalance(state: AdventureState): number {
  return Object.values(state.events).reduce((sum, event) =>
    sum + (isCrystalAward(event) || event.kind === "purchase" ? event.amount : 0), 0);
}

/** Purchases are accepted against rewards available by their timestamp. */
function fundedEvents(events: AdventureEvent[]): { events: Record<string, AdventureEvent>; rejectedPurchases: string[] } {
  const accepted: Record<string, AdventureEvent> = {};
  const rejectedPurchases: string[] = [];
  let balance = 0;
  const sorted = events.toSorted((a, b) => a.at.localeCompare(b.at) ||
    Number(a.kind === "purchase") - Number(b.kind === "purchase") || a.id.localeCompare(b.id));
  for (const event of sorted) {
    if (event.kind === "purchase") {
      if (balance < -event.amount) { rejectedPurchases.push(event.id); continue; }
      balance += event.amount;
    } else if (isCrystalAward(event)) balance += event.amount;
    accepted[event.id] = event;
  }
  return { events: accepted, rejectedPurchases };
}

function equipment(raw: unknown, events: Record<string, AdventureEvent>): AdventureState["equipped"] {
  const result: AdventureState["equipped"] = {};
  if (!record(raw)) return result;
  for (const item of COSMETICS) {
    if (raw[item.slot] === item.id && events[eventId.purchase(item.id)]?.kind === "purchase") result[item.slot] = item.id;
  }
  return result;
}

/** Keep derived rewards consistent with their own immutable learning evidence. */
function supportedEvents(entries: AdventureEvent[]): AdventureEvent[] {
  const byId = Object.fromEntries(entries.map((event) => [event.id, event]));
  const activities = entries.filter((event): event is LearningActivity => {
    if (event.kind !== "activity") return false;
    const first = byId[eventId.exercise(event.exerciseId)];
    if (first?.kind !== "exercise") return false;
    if (event.mode === "completion") return event.at === first.at;
    const day = utcDay(new Date(event.at));
    return utcDay(new Date(first.at)) < day && entries.some((check) =>
      check.kind === "check" && check.exerciseId === event.exerciseId &&
      utcDay(new Date(check.at)) === day && check.at <= event.at);
  });
  const activityIds = new Set(activities.map((event) => event.id));
  return entries.filter((event) => {
    if (event.kind === "activity") return activityIds.has(event.id);
    if (event.kind === "review") return activities.some((activity) =>
      activity.mode === "review" && activity.exerciseId === event.sourceId && activity.at <= event.at &&
      utcDay(new Date(activity.at)) === utcDay(new Date(event.at)));
    if (event.kind === "daily" || event.kind === "weekly") {
      const joined = byId[eventId.quest(event.kind, event.sourceId)];
      if (joined?.kind !== "quest" || joined.at > event.at) return false;
      const { end } = questPeriod(event.kind, new Date(event.at));
      const distinct = new Set(activities.filter((activity) =>
        activity.at >= joined.at && activity.at <= event.at && activity.at < end).map((activity) => activity.exerciseId));
      return distinct.size >= (event.kind === "daily" ? 1 : 3);
    }
    return true;
  });
}

/** Invalid entries are dropped individually; unknown document versions are refused. */
export function parseAdventure(raw: unknown): AdventureState | null {
  if (!record(raw) || raw.version !== 1 || !record(raw.events)) return null;
  const entries = Object.entries(raw.events).map(([id, value]) => parseEvent(value, id)).filter((event): event is AdventureEvent => event !== null);
  const { events } = fundedEvents(supportedEvents(entries));
  return {
    version: 1, events, equipped: equipment(raw.equipped, events),
    showMessages: raw.showMessages !== false,
    settingsAt: validInstant(raw.settingsAt) ? raw.settingsAt : emptyAdventure.settingsAt,
  };
}

const preferEvent = (a: AdventureEvent, b: AdventureEvent): AdventureEvent =>
  a.at < b.at ? a : b.at < a.at ? b : JSON.stringify(a) <= JSON.stringify(b) ? a : b;

/**
 * Deterministic union for future sync. Concurrent spending is reconciled in
 * timestamp/id order. Callers MUST surface rejectedPurchases instead of silently
 * claiming both purchases succeeded; local transactions prevent this conflict.
 */
export function mergeAdventureWithConflicts(a: AdventureState, b: AdventureState): { state: AdventureState; rejectedPurchases: string[] } {
  const union = { ...a.events };
  for (const event of Object.values(b.events)) union[event.id] = union[event.id] ? preferEvent(union[event.id], event) : event;
  const { events, rejectedPurchases } = fundedEvents(Object.values(union));
  const latest = a.settingsAt > b.settingsAt ? a : b.settingsAt > a.settingsAt ? b :
    JSON.stringify({ equipped: a.equipped, showMessages: a.showMessages }) <= JSON.stringify({ equipped: b.equipped, showMessages: b.showMessages }) ? a : b;
  return {
    state: { version: 1, events, equipped: equipment(latest.equipped, events), showMessages: latest.showMessages, settingsAt: latest.settingsAt },
    rejectedPurchases,
  };
}

export const mergeAdventure = (a: AdventureState, b: AdventureState): AdventureState => mergeAdventureWithConflicts(a, b).state;
