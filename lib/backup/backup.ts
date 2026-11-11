import { crystalBalance, mergeAdventureWithConflicts } from "@/lib/adventure/engine";
import { parseAdventure, type AdventureState } from "@/lib/adventure/state";
import type { GamificationCatalog } from "@/lib/gamification/engine";
import { parseGamification, type GamificationState } from "@/lib/gamification/state";
import { longestStreak, MAX_ACTIVE_DAYS } from "@/lib/gamification/streaks";
import { XP_REWARDS, exerciseXp, totalXp, type XpAward } from "@/lib/gamification/xp";
import { parseCompetency, type CompetencyState } from "@/lib/learning/competency";
import { mergePractice, parsePractice, type PracticeState } from "@/lib/practice/state";
import { parseDrafts, type DraftsState } from "@/lib/progress/drafts";
import { parseProgress, type ExerciseProgress, type ProgressState } from "@/lib/progress/progress";
import { parseSchedule, type ScheduleState } from "@/lib/schedule/deadlines";
import { toDateKey } from "@/lib/schedule/dates";
import { contentKey } from "@/lib/sync/competency-doc";
import { mergeCompetency, type Recommend } from "@/lib/sync/competency-merge";

/**
 * Progress backup files: export, validation and a safe, additive merge.
 *
 * - A backup holds learning data only. It never includes passwords, Firebase
 *   credentials, sign-in tokens or the account session hint.
 * - Every section is validated with the same parser used for stored data, so
 *   malformed or tampered entries are dropped individually.
 * - Importing only adds: nothing that exists in this browser is deleted.
 *   Accomplishments and crystal events are keyed by id, so importing the same
 *   backup twice (or one that overlaps) never counts a reward twice.
 */
export const BACKUP_FORMAT = "koodaamo-backup";
export const BACKUP_VERSION = 1;
/** Generous for years of learning data; anything larger is not one of our files. */
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export interface BackupData {
  progress: ProgressState;
  gamification: GamificationState;
  competency: CompetencyState;
  adventure: AdventureState;
  practice: PracticeState;
  drafts: DraftsState;
  schedule: ScheduleState;
}

export type BackupSection = keyof BackupData;
export const BACKUP_SECTIONS: BackupSection[] = [
  "progress",
  "gamification",
  "competency",
  "adventure",
  "practice",
  "drafts",
  "schedule",
];

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  data: BackupData;
}

export function createBackup(data: BackupData, now: Date): BackupFile {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), data };
}

export function backupFileName(now: Date): string {
  return `koodaamo-backup-${toDateKey(now)}.json`;
}

export type BackupError = "too-large" | "invalid-json" | "not-backup" | "newer-version" | "empty";

export type ParsedBackup =
  | { ok: true; exportedAt: string | null; data: Partial<BackupData> }
  | { ok: false; error: BackupError };

const PARSERS: { [K in BackupSection]: (raw: unknown) => BackupData[K] | null } = {
  progress: parseProgress,
  gamification: parseGamification,
  competency: parseCompetency,
  adventure: parseAdventure,
  practice: parsePractice,
  drafts: parseDrafts,
  schedule: parseSchedule,
};

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: "too-large" };
  let raw: unknown;
  try {
    // Drop keys that could alter object prototypes when entries are copied.
    raw = JSON.parse(text, (key, value: unknown) => (UNSAFE_KEYS.has(key) ? undefined : value));
  } catch {
    return { ok: false, error: "invalid-json" };
  }
  if (!raw || typeof raw !== "object" || (raw as { format?: unknown }).format !== BACKUP_FORMAT) {
    return { ok: false, error: "not-backup" };
  }
  const file = raw as { version?: unknown; exportedAt?: unknown; data?: unknown };
  if (typeof file.version === "number" && file.version > BACKUP_VERSION) return { ok: false, error: "newer-version" };
  if (file.version !== BACKUP_VERSION || !file.data || typeof file.data !== "object") {
    return { ok: false, error: "not-backup" };
  }
  const sections = file.data as Record<string, unknown>;
  const data: Partial<BackupData> = {};
  for (const section of BACKUP_SECTIONS) {
    const parsed = PARSERS[section](sections[section]);
    if (parsed) (data as Record<BackupSection, unknown>)[section] = parsed;
  }
  if (Object.keys(data).length === 0) return { ok: false, error: "empty" };
  const exportedAt =
    typeof file.exportedAt === "string" && Number.isFinite(Date.parse(file.exportedAt)) ? file.exportedAt : null;
  return { ok: true, exportedAt, data };
}

/* ------------------------------ Merging ------------------------------ */

export interface ImportContext {
  catalog: GamificationCatalog;
  isPracticeActivity: (id: string) => boolean;
  recommend: Recommend;
}

const earlier = (a: string | undefined, b: string | undefined) => (!a ? b : !b ? a : a < b ? a : b);
const later = (a: string, b: string) => (a > b ? a : b);

export function mergeProgressStates(current: ProgressState, incoming: ProgressState): ProgressState {
  const exercises: Record<string, ExerciseProgress> = { ...current.exercises };
  for (const [id, entry] of Object.entries(incoming.exercises)) {
    const mine = exercises[id];
    if (!mine) {
      exercises[id] = entry;
      continue;
    }
    const newer = entry.updatedAt > mine.updatedAt ? entry : mine;
    exercises[id] = {
      completedStepIds: [...new Set([...mine.completedStepIds, ...entry.completedStepIds])],
      currentStepId: newer.currentStepId ?? mine.currentStepId,
      completedAt: earlier(mine.completedAt, entry.completedAt),
      updatedAt: later(mine.updatedAt, entry.updatedAt),
    };
  }
  const visits = [current.lastVisited, incoming.lastVisited].filter((visit) => visit !== undefined);
  const lastVisited = visits.sort((a, b) => b.at.localeCompare(a.at))[0];
  return { version: 1, exercises, ...(lastVisited ? { lastVisited } : {}) };
}

/** The XP an imported accomplishment is worth, or null when it doesn't match current content. */
export function expectedAwardXp(award: XpAward, context: ImportContext): number | null {
  const parts = award.id.split(":");
  const { catalog } = context;
  switch (award.kind) {
    case "step": {
      const exercise = parts.length === 3 && parts[0] === "step" ? catalog.exercises[parts[1]] : undefined;
      return exercise && Object.hasOwn(catalog.exercises, parts[1]) && exercise.stepIds.includes(parts[2])
        ? XP_REWARDS.step
        : null;
    }
    case "exercise": {
      const exercise = parts.length === 2 && parts[0] === "exercise" && Object.hasOwn(catalog.exercises, parts[1])
        ? catalog.exercises[parts[1]]
        : undefined;
      return exercise ? exerciseXp(exercise.type) : null;
    }
    case "chapter":
      return parts.length === 3 &&
        parts[0] === "chapter" &&
        catalog.chapters.some((chapter) => chapter.courseId === parts[1] && chapter.chapterId === parts[2])
        ? XP_REWARDS.chapter
        : null;
    case "practice":
      return parts.length === 2 && parts[0] === "practice" && context.isPracticeActivity(parts[1])
        ? XP_REWARDS.practice
        : null;
  }
}

export function mergeGamificationStates(
  current: GamificationState,
  incoming: GamificationState,
  context: ImportContext,
): { state: GamificationState; skipped: number } {
  const awards = { ...current.awards };
  let skipped = 0;
  for (const award of Object.values(incoming.awards)) {
    if (awards[award.id]) continue; // Already earned here: never counted twice.
    const xp = expectedAwardXp(award, context);
    if (xp === null) {
      skipped++;
      continue;
    }
    awards[award.id] = { ...award, xp };
  }
  const activeDays = [...new Set([...current.activeDays, ...incoming.activeDays])].sort().slice(-MAX_ACTIVE_DAYS);
  const achievements = { ...current.achievements };
  for (const [id, entry] of Object.entries(incoming.achievements) as [keyof typeof achievements, { at: string }][]) {
    const mine = achievements[id];
    achievements[id] = mine && mine.at <= entry.at ? mine : entry;
  }
  return {
    state: {
      ...current,
      awards,
      activeDays,
      bestStreak: Math.max(current.bestStreak, incoming.bestStreak, longestStreak(activeDays)),
      achievements,
      fixedFailingSolution: current.fixedFailingSolution || incoming.fixedFailingSolution,
      dailyGoal: current.dailyGoal ?? incoming.dailyGoal,
      preferredCourse: current.preferredCourse ?? incoming.preferredCourse,
      migratedProgress: current.migratedProgress || incoming.migratedProgress,
    },
    skipped,
  };
}

export function mergeCompetencyStates(
  current: CompetencyState,
  incoming: CompetencyState,
  recommend: Recommend,
): { state: CompetencyState; conflicts: number } {
  // Same rules as account sync; on a conflict this browser's own choice is kept.
  const merged = mergeCompetency(current, incoming.tracks, recommend);
  return {
    state: {
      ...merged.state,
      onboarding: current.onboarding === "pending" ? incoming.onboarding : current.onboarding,
      dismissedPrompts: [...new Set([...current.dismissedPrompts, ...incoming.dismissedPrompts])],
      migrated: current.migrated || incoming.migrated,
    },
    conflicts: merged.conflicts.length,
  };
}

export function mergePracticeStates(
  current: PracticeState,
  incoming: PracticeState,
  context: Pick<ImportContext, "isPracticeActivity">,
): { state: PracticeState; skipped: number } {
  const known = Object.entries(incoming.activities).filter(([id]) => context.isPracticeActivity(id));
  return {
    state: mergePractice(current, { version: 1, activities: Object.fromEntries(known) }),
    skipped: Object.keys(incoming.activities).length - known.length,
  };
}

/** Drafts: a draft that already exists here is kept; missing ones are added. */
export function mergeDraftsStates(current: DraftsState, incoming: DraftsState): { state: DraftsState; kept: number } {
  const exercises = { ...current.exercises };
  let kept = 0;
  for (const [id, draft] of Object.entries(incoming.exercises)) {
    if (!exercises[id]) exercises[id] = draft;
    else if (JSON.stringify(exercises[id].files) !== JSON.stringify(draft.files)) kept++;
  }
  return { state: { version: 1, exercises }, kept };
}

/** Target dates: one that already exists here is kept; missing ones are added. */
export function mergeScheduleStates(current: ScheduleState, incoming: ScheduleState): { state: ScheduleState; kept: number } {
  const deadlines = { ...current.deadlines };
  let kept = 0;
  for (const [key, deadline] of Object.entries(incoming.deadlines)) {
    if (!deadlines[key]) deadlines[key] = deadline;
    else if (deadlines[key].dueDate !== deadline.dueDate) kept++;
  }
  return { state: { version: 1, deadlines }, kept };
}

/**
 * Crystals and avatar items: the event ledgers are combined by id. If both
 * devices spent the same crystals on different items, an item already owned
 * here is never taken away; the backup's conflicting purchase is left out and
 * reported instead.
 */
export function mergeAdventureForImport(
  current: AdventureState,
  incoming: AdventureState,
): { state: AdventureState; rejectedPurchases: string[] } {
  const merged = mergeAdventureWithConflicts(current, incoming);
  const keepsOwn = (result: { rejectedPurchases: string[] }) =>
    !result.rejectedPurchases.some((id) => Object.hasOwn(current.events, id));
  if (keepsOwn(merged)) return merged;

  const theirPurchases = Object.values(incoming.events)
    .filter((event) => event.kind === "purchase" && !Object.hasOwn(current.events, event.id))
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  const without = (ids: Set<string>): AdventureState => ({
    ...incoming,
    events: Object.fromEntries(
      Object.entries(incoming.events).filter(([id, event]) => event.kind !== "purchase" || !ids.has(id)),
    ),
  });
  const accepted = new Set<string>();
  const excluded = new Set(theirPurchases.map((event) => event.id));
  let result = mergeAdventureWithConflicts(current, without(excluded));
  // Add the backup's purchases back one by one while the items owned here stay funded.
  for (const purchase of theirPurchases) {
    excluded.delete(purchase.id);
    const attempt = mergeAdventureWithConflicts(current, without(excluded));
    if (keepsOwn(attempt) && !attempt.rejectedPurchases.length) {
      result = attempt;
      accepted.add(purchase.id);
    } else {
      excluded.add(purchase.id);
    }
  }
  return { state: result.state, rejectedPurchases: theirPurchases.filter((event) => !accepted.has(event.id)).map((event) => event.id) };
}

export interface ImportSummary {
  /** Exercises completed in the backup but not yet here. */
  exercises: number;
  xp: number;
  crystals: number;
  practice: number;
  drafts: number;
  deadlines: number;
  /** Skill-level tracks added or updated. */
  levels: number;
  /** Drafts, target dates or level choices that differ and were kept as they are here. */
  keptLocal: number;
  /** Avatar purchases whose crystals are not in the combined history. */
  rejectedPurchases: number;
  /** Entries that don't match current lessons or activities. */
  skipped: number;
  /** False when importing would change nothing. */
  changed: boolean;
}

export interface ImportPlan {
  next: BackupData;
  summary: ImportSummary;
}

/** Combine a validated backup with this browser's data (pure; nothing is written). */
export function planImport(current: BackupData, incoming: Partial<BackupData>, context: ImportContext): ImportPlan {
  const progress = incoming.progress ? mergeProgressStates(current.progress, incoming.progress) : current.progress;
  const gamification = incoming.gamification
    ? mergeGamificationStates(current.gamification, incoming.gamification, context)
    : { state: current.gamification, skipped: 0 };
  const competency = incoming.competency
    ? mergeCompetencyStates(current.competency, incoming.competency, context.recommend)
    : { state: current.competency, conflicts: 0 };
  const adventure = incoming.adventure
    ? mergeAdventureForImport(current.adventure, incoming.adventure)
    : { state: current.adventure, rejectedPurchases: [] };
  const practice = incoming.practice
    ? mergePracticeStates(current.practice, incoming.practice, context)
    : { state: current.practice, skipped: 0 };
  const drafts = incoming.drafts ? mergeDraftsStates(current.drafts, incoming.drafts) : { state: current.drafts, kept: 0 };
  const schedule = incoming.schedule
    ? mergeScheduleStates(current.schedule, incoming.schedule)
    : { state: current.schedule, kept: 0 };

  const completed = (state: ProgressState) =>
    new Set(Object.entries(state.exercises).filter(([, entry]) => entry.completedAt).map(([id]) => id));
  const before = completed(current.progress);
  const levels = Object.keys(competency.state.tracks).filter(
    (track) =>
      contentKey(competency.state.tracks[track as keyof CompetencyState["tracks"]]) !==
      contentKey(current.competency.tracks[track as keyof CompetencyState["tracks"]]),
  ).length;

  const next: BackupData = {
    progress,
    gamification: gamification.state,
    competency: competency.state,
    adventure: adventure.state,
    practice: practice.state,
    drafts: drafts.state,
    schedule: schedule.state,
  };
  const summary: ImportSummary = {
    exercises: [...completed(progress)].filter((id) => !before.has(id)).length,
    xp: totalXp(next.gamification.awards) - totalXp(current.gamification.awards),
    crystals: crystalBalance(next.adventure) - crystalBalance(current.adventure),
    practice: Object.keys(next.practice.activities).length - Object.keys(current.practice.activities).length,
    drafts: Object.keys(next.drafts.exercises).length - Object.keys(current.drafts.exercises).length,
    deadlines: Object.keys(next.schedule.deadlines).length - Object.keys(current.schedule.deadlines).length,
    levels,
    keptLocal: drafts.kept + schedule.kept + competency.conflicts,
    rejectedPurchases: adventure.rejectedPurchases.length,
    skipped: gamification.skipped + practice.skipped,
    changed: BACKUP_SECTIONS.some((section) => JSON.stringify(next[section]) !== JSON.stringify(current[section])),
  };
  return { next, summary };
}
