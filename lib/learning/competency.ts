import { SKILL_LEVELS, type ProgrammingLanguage, type SkillId, type SkillLevel } from "@/lib/content/types";
import { PLACEMENT_LEVELS, type PlacementLevel } from "./placement";

/**
 * Learning proficiency per language ("track"). This is deliberately separate
 * from the gamification XP level: XP measures effort on this platform, while
 * proficiency describes what the learner already knows and where they should
 * start. Nothing here locks content.
 *
 * Effective level = the learner's own override, else the latest placement
 * suggestion, else their self-reported level ("not sure" counts as unknown).
 */

export type TrackId = ProgrammingLanguage;
export const TRACKS: TrackId[] = ["python", "javascript", "typescript", "react"];

export type SelfReportedLevel = SkillLevel | "not-sure";
export const SELF_REPORT_OPTIONS: SelfReportedLevel[] = [...SKILL_LEVELS, "not-sure"];

export interface PlacementResult {
  assessmentId: string;
  /** Assessment version the result was produced with. */
  version: number;
  level: PlacementLevel;
  correct: number;
  answered: number;
  total: number;
  stoppedEarly: boolean;
  completedAt: string;
}

/** Evidence for one skill from the latest placement. Exercise completions are derived from progress instead. */
export interface SkillEvidence {
  correct: number;
  total: number;
  source: "placement";
  at: string;
}

export type RecommendationReason = "first-success" | "self-report" | "placement" | "override";

/** Where the learner was advised to start (a snapshot; the next task is derived from progress). */
export interface RecommendedNext {
  courseId: string;
  chapterId: string;
  exerciseId: string;
  level: SkillLevel;
  reason: RecommendationReason;
  at: string;
}

export interface TrackCompetency {
  selfReportedLevel: SelfReportedLevel | null;
  placementResult: PlacementResult | null;
  skillEvidence: Record<SkillId, SkillEvidence>;
  recommendedNext: RecommendedNext | null;
  assessmentDate: string | null;
  userOverride: SkillLevel | null;
  updatedAt: string;
}

/**
 * - `pending`: first visit, nothing chosen yet.
 * - `completed`: the learner chose a level for at least one language.
 * - `skipped`: the learner chose "Skip for now".
 * - `legacy`: the learner was already learning before levels existed.
 */
export type OnboardingStatus = "pending" | "completed" | "skipped" | "legacy";

export interface CompetencyState {
  version: 1;
  onboarding: OnboardingStatus;
  tracks: Partial<Record<TrackId, TrackCompetency>>;
  /** Tracks whose optional placement prompt was dismissed ("Not now"). */
  dismissedPrompts: TrackId[];
  /** True once data saved before this feature existed has been looked at. */
  migrated: boolean;
}

export const emptyCompetency: CompetencyState = {
  version: 1,
  onboarding: "pending",
  tracks: {},
  dismissedPrompts: [],
  migrated: false,
};

export function emptyTrack(now: string): TrackCompetency {
  return {
    selfReportedLevel: null,
    placementResult: null,
    skillEvidence: {},
    recommendedNext: null,
    assessmentDate: null,
    userOverride: null,
    updatedAt: now,
  };
}

/* ------------------------------ Parsing ------------------------------ */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 1000;
const isLevel = (value: unknown): value is SkillLevel => SKILL_LEVELS.includes(value as SkillLevel);
const isTrack = (value: unknown): value is TrackId => TRACKS.includes(value as TrackId);

function parsePlacement(value: unknown): PlacementResult | null {
  if (!isRecord(value)) return null;
  const { assessmentId, version, level, correct, answered, total, stoppedEarly, completedAt } = value;
  if (!isString(assessmentId) || !isCount(version) || !PLACEMENT_LEVELS.includes(level as PlacementLevel)) return null;
  if (!isCount(correct) || !isCount(answered) || !isCount(total) || correct > answered || answered > total) return null;
  if (!isString(completedAt)) return null;
  return {
    assessmentId,
    version,
    level: level as PlacementLevel,
    correct,
    answered,
    total,
    stoppedEarly: stoppedEarly === true,
    completedAt,
  };
}

function parseEvidence(value: unknown): Record<SkillId, SkillEvidence> {
  const evidence: Record<SkillId, SkillEvidence> = {};
  if (!isRecord(value)) return evidence;
  for (const [skill, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    const { correct, total, at } = entry;
    if (isCount(correct) && isCount(total) && correct <= total && isString(at)) {
      evidence[skill] = { correct, total, source: "placement", at };
    }
  }
  return evidence;
}

function parseRecommendation(value: unknown): RecommendedNext | null {
  if (!isRecord(value)) return null;
  const { courseId, chapterId, exerciseId, level, reason, at } = value;
  const reasons: RecommendationReason[] = ["first-success", "self-report", "placement", "override"];
  if (!isString(courseId) || !isString(chapterId) || !isString(exerciseId) || !isLevel(level) || !isString(at)) return null;
  if (!reasons.includes(reason as RecommendationReason)) return null;
  return { courseId, chapterId, exerciseId, level, reason: reason as RecommendationReason, at };
}

/** Validate one stored track (shared by local storage and cloud documents). */
export function parseTrack(value: unknown): TrackCompetency | null {
  if (!isRecord(value)) return null;
  const self = value.selfReportedLevel;
  return {
    selfReportedLevel: isLevel(self) || self === "not-sure" ? (self as SelfReportedLevel) : null,
    placementResult: parsePlacement(value.placementResult),
    skillEvidence: parseEvidence(value.skillEvidence),
    recommendedNext: parseRecommendation(value.recommendedNext),
    assessmentDate: isString(value.assessmentDate) ? value.assessmentDate : null,
    userOverride: isLevel(value.userOverride) ? value.userOverride : null,
    updatedAt: isString(value.updatedAt) ? value.updatedAt : new Date(0).toISOString(),
  };
}

/** Validate stored data. Unknown versions and malformed entries are dropped, never trusted. */
export function parseCompetency(raw: unknown): CompetencyState | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const statuses: OnboardingStatus[] = ["pending", "completed", "skipped", "legacy"];
  const tracks: CompetencyState["tracks"] = {};
  if (isRecord(raw.tracks)) {
    for (const [track, value] of Object.entries(raw.tracks)) {
      const parsed = isTrack(track) ? parseTrack(value) : null;
      if (parsed) tracks[track as TrackId] = parsed;
    }
  }
  return {
    version: 1,
    onboarding: statuses.includes(raw.onboarding as OnboardingStatus) ? (raw.onboarding as OnboardingStatus) : "pending",
    tracks,
    dismissedPrompts: Array.isArray(raw.dismissedPrompts) ? [...new Set(raw.dismissedPrompts.filter(isTrack))] : [],
    migrated: raw.migrated === true,
  };
}

/* --------------------------- Derived values --------------------------- */

export type LevelSource = "override" | "placement" | "self";

export function effectiveLevel(track: TrackCompetency | undefined): { level: SkillLevel; source: LevelSource } | null {
  if (!track) return null;
  if (track.userOverride) return { level: track.userOverride, source: "override" };
  if (track.placementResult) return { level: track.placementResult.level, source: "placement" };
  if (track.selfReportedLevel && track.selfReportedLevel !== "not-sure") {
    return { level: track.selfReportedLevel, source: "self" };
  }
  return null;
}

/** Has the learner told us anything (used to choose the returning home). */
export function hasCompetencyChoices(state: CompetencyState): boolean {
  return (
    state.onboarding === "completed" ||
    state.onboarding === "skipped" ||
    Object.values(state.tracks).some(
      (track) => track && (track.selfReportedLevel || track.placementResult || track.userOverride),
    )
  );
}

/* ------------------------------ Updates ------------------------------ */

function updateTrack(
  state: CompetencyState,
  trackId: TrackId,
  now: string,
  change: (track: TrackCompetency) => Partial<TrackCompetency>,
): CompetencyState {
  const current = state.tracks[trackId] ?? emptyTrack(now);
  return { ...state, tracks: { ...state.tracks, [trackId]: { ...current, ...change(current), updatedAt: now } } };
}

export function setSelfReportedLevel(
  state: CompetencyState,
  trackId: TrackId,
  level: SelfReportedLevel | null,
  now: string,
): CompetencyState {
  return updateTrack(state, trackId, now, () => ({ selfReportedLevel: level }));
}

export function setRecommendation(state: CompetencyState, trackId: TrackId, next: RecommendedNext | null, now: string) {
  return updateTrack(state, trackId, now, () => ({ recommendedNext: next }));
}

/** Store a placement result. An existing manual override is kept (the learner decides). */
export function applyPlacementResult(
  state: CompetencyState,
  trackId: TrackId,
  result: PlacementResult,
  skills: Record<SkillId, { correct: number; total: number }>,
  now: string,
): CompetencyState {
  const skillEvidence: Record<SkillId, SkillEvidence> = {};
  for (const [skill, entry] of Object.entries(skills)) {
    skillEvidence[skill] = { correct: entry.correct, total: entry.total, source: "placement", at: result.completedAt };
  }
  return updateTrack(state, trackId, now, () => ({
    placementResult: result,
    assessmentDate: result.completedAt,
    skillEvidence,
  }));
}

/** Set (or clear with `null`) the learner's own choice, which always wins over suggestions. */
export function setUserOverride(state: CompetencyState, trackId: TrackId, level: SkillLevel | null, now: string) {
  return updateTrack(state, trackId, now, () => ({ userOverride: level }));
}

export function setOnboarding(state: CompetencyState, status: OnboardingStatus): CompetencyState {
  return state.onboarding === status ? state : { ...state, onboarding: status };
}

export function dismissPlacementPrompt(state: CompetencyState, trackId: TrackId): CompetencyState {
  return state.dismissedPrompts.includes(trackId)
    ? state
    : { ...state, dismissedPrompts: [...state.dismissedPrompts, trackId] };
}

/**
 * One-time migration for learners who used the platform before levels
 * existed: they are marked `legacy` (no onboarding forced on them) and their
 * progress, XP and streak stay exactly where they are, in their own stores.
 */
export function migrateCompetency(state: CompetencyState, hadActivity: boolean): CompetencyState {
  if (state.migrated) return state;
  return {
    ...state,
    onboarding: hadActivity && state.onboarding === "pending" ? "legacy" : state.onboarding,
    migrated: true,
  };
}
