/** Practice results (stored locally under `koodaamo:v1:practice`). */
export interface PracticeEntry {
  /** First correct answer (ISO). XP is awarded for this one only. */
  firstPassedAt: string;
  /** Latest correct answer (ISO); orders the review deck. */
  lastPassedAt: string;
}

export interface PracticeState {
  version: 1;
  activities: Record<string, PracticeEntry>;
}

export const emptyPractice: PracticeState = { version: 1, activities: {} };

const isInstant = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 40 && Number.isFinite(Date.parse(value));

const isActivityId = (value: string) => /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);

/** Validate stored data. Invalid entries are dropped, never the whole state. */
export function parsePractice(raw: unknown): PracticeState | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (value.version !== 1 || !value.activities || typeof value.activities !== "object") return null;
  const activities: Record<string, PracticeEntry> = {};
  for (const [id, entry] of Object.entries(value.activities as Record<string, unknown>)) {
    const item = entry as Partial<PracticeEntry> | null;
    if (!isActivityId(id) || !item || !isInstant(item.firstPassedAt) || !isInstant(item.lastPassedAt)) continue;
    const [first, last] = [item.firstPassedAt, item.lastPassedAt].sort();
    activities[id] = { firstPassedAt: first, lastPassedAt: last };
  }
  return { version: 1, activities };
}

export function recordPracticePass(state: PracticeState, activityId: string, now: string): PracticeState {
  const current = state.activities[activityId];
  return {
    ...state,
    activities: {
      ...state.activities,
      [activityId]: { firstPassedAt: current?.firstPassedAt ?? now, lastPassedAt: now },
    },
  };
}

/** Union of two practice histories: earliest first pass, latest pass. */
export function mergePractice(a: PracticeState, b: PracticeState): PracticeState {
  const activities = { ...a.activities };
  for (const [id, entry] of Object.entries(b.activities)) {
    const current = activities[id];
    activities[id] = current
      ? {
          firstPassedAt: current.firstPassedAt < entry.firstPassedAt ? current.firstPassedAt : entry.firstPassedAt,
          lastPassedAt: current.lastPassedAt > entry.lastPassedAt ? current.lastPassedAt : entry.lastPassedAt,
        }
      : entry;
  }
  return { version: 1, activities };
}
