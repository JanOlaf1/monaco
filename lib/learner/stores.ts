import { emptyGamification, parseGamification, type GamificationState } from "@/lib/gamification/state";
import { emptyCompetency, parseCompetency, type CompetencyState } from "@/lib/learning/competency";
import { emptyDrafts, parseDrafts, type DraftsState } from "@/lib/progress/drafts";
import { emptyProgress, parseProgress, type ProgressState } from "@/lib/progress/progress";
import { emptySchedule, parseSchedule, type ScheduleState } from "@/lib/schedule/deadlines";
import { createLocalStorageAdapter } from "@/lib/storage/local-storage";
import { createPersistentStore } from "@/lib/storage/persistent-store";

/**
 * Learner data stores for this browser. Firebase Authentication and Firestore
 * are not enabled yet, so everything is stored locally. To sync later, swap
 * these adapters for Firestore-backed ones (see docs/FIREBASE_PLAN.md).
 */
const PREFIX = "koodaamo:v1";

export const STORAGE_KEYS = {
  progress: `${PREFIX}:progress`,
  drafts: `${PREFIX}:drafts`,
  schedule: `${PREFIX}:schedule`,
  gamification: `${PREFIX}:gamification`,
  competency: `${PREFIX}:competency`,
} as const;

/** Learning proficiency per language (separate from the XP level). */
export const competencyStore = createPersistentStore<CompetencyState>({
  adapter: createLocalStorageAdapter(STORAGE_KEYS.competency, parseCompetency),
  initial: emptyCompetency,
});

export const gamificationStore = createPersistentStore<GamificationState>({
  adapter: createLocalStorageAdapter(STORAGE_KEYS.gamification, parseGamification),
  initial: emptyGamification,
});

export const progressStore = createPersistentStore<ProgressState>({
  adapter: createLocalStorageAdapter(STORAGE_KEYS.progress, parseProgress),
  initial: emptyProgress,
});

export const draftsStore = createPersistentStore<DraftsState>({
  adapter: createLocalStorageAdapter(STORAGE_KEYS.drafts, parseDrafts),
  initial: emptyDrafts,
});

export const scheduleStore = createPersistentStore<ScheduleState>({
  adapter: createLocalStorageAdapter(STORAGE_KEYS.schedule, parseSchedule),
  initial: emptySchedule,
});
