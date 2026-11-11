import {
  emptyTrack,
  TRACKS,
  type CompetencyState,
  type PlacementResult,
  type RecommendedNext,
  type TrackCompetency,
  type TrackId,
} from "@/lib/learning/competency";
import { contentKey } from "./competency-doc";

/**
 * Deterministic merge of local and cloud competency data. The same inputs
 * always give the same result, nothing valid is dropped, and choices only a
 * person can make are returned as conflicts instead of being guessed.
 *
 * Per track:
 * - Present on one side only → that side is kept.
 * - placementResult → the more recent result (completedAt), with its skill
 *   evidence and assessment date; ties prefer the higher score, then the cloud.
 * - selfReportedLevel / userOverride (the learner's own choices) → equal
 *   values merge; a value on one side only is kept; two different values are
 *   a conflict. Until it is resolved the device keeps its own value and that
 *   track is not uploaded.
 * - recommendedNext is derived, so it is recomputed for the merged level.
 */

export type ConflictField = "selfReportedLevel" | "userOverride";

export interface CompetencyConflict {
  track: TrackId;
  field: ConflictField;
  local: string;
  cloud: string;
}

export interface MergeResult {
  state: CompetencyState;
  conflicts: CompetencyConflict[];
  /** Tracks whose merged content differs from the cloud and is safe to upload. */
  upload: TrackId[];
}

/** Recomputes the suggested start for a merged track (null when it has no level). */
export type Recommend = (trackId: TrackId, track: TrackCompetency) => RecommendedNext | null;

function newerPlacement(local: PlacementResult | null, cloud: PlacementResult | null): "local" | "cloud" {
  if (!local) return "cloud";
  if (!cloud) return "local";
  if (local.completedAt !== cloud.completedAt) return local.completedAt > cloud.completedAt ? "local" : "cloud";
  if (local.correct !== cloud.correct) return local.correct > cloud.correct ? "local" : "cloud";
  return "cloud";
}

function mergeChoice<T extends string>(
  trackId: TrackId,
  field: ConflictField,
  local: T | null,
  cloud: T | null,
  conflicts: CompetencyConflict[],
): T | null {
  if (local === cloud) return local;
  if (local === null) return cloud;
  if (cloud === null) return local;
  conflicts.push({ track: trackId, field, local, cloud });
  return local;
}

export function mergeTrack(
  trackId: TrackId,
  local: TrackCompetency | undefined,
  cloud: TrackCompetency | undefined,
  recommend: Recommend,
): { track?: TrackCompetency; conflicts: CompetencyConflict[] } {
  if (!local && !cloud) return { conflicts: [] };
  if (!local || !cloud) return { track: (local ?? cloud)!, conflicts: [] };
  // Identical content (timestamps aside): keep it as it is, so nothing needs to be written.
  if (contentKey(local) === contentKey(cloud)) return { track: cloud.updatedAt >= local.updatedAt ? cloud : local, conflicts: [] };

  const conflicts: CompetencyConflict[] = [];
  const placementSide = newerPlacement(local.placementResult, cloud.placementResult);
  const placementSource = placementSide === "local" ? local : cloud;
  const merged: TrackCompetency = {
    ...emptyTrack(local.updatedAt > cloud.updatedAt ? local.updatedAt : cloud.updatedAt),
    selfReportedLevel: mergeChoice(trackId, "selfReportedLevel", local.selfReportedLevel, cloud.selfReportedLevel, conflicts),
    userOverride: mergeChoice(trackId, "userOverride", local.userOverride, cloud.userOverride, conflicts),
    placementResult: placementSource.placementResult,
    skillEvidence: placementSource.skillEvidence,
    assessmentDate: placementSource.assessmentDate,
  };
  // Reuse an identical existing suggestion (cloud first) so its timestamp doesn't cause a needless write.
  const recomputed = recommend(trackId, merged);
  merged.recommendedNext =
    [cloud.recommendedNext, local.recommendedNext].find((existing) => sameRecommendation(existing, recomputed)) ??
    recomputed;
  return { track: merged, conflicts };
}

function sameRecommendation(a: RecommendedNext | null, b: RecommendedNext | null): boolean {
  if (!a || !b) return a === b;
  return (
    a.courseId === b.courseId &&
    a.chapterId === b.chapterId &&
    a.exerciseId === b.exerciseId &&
    a.level === b.level &&
    a.reason === b.reason
  );
}

export function mergeCompetency(
  local: CompetencyState,
  cloud: Partial<Record<TrackId, TrackCompetency>>,
  recommend: Recommend,
): MergeResult {
  const tracks: CompetencyState["tracks"] = {};
  const conflicts: CompetencyConflict[] = [];
  const upload: TrackId[] = [];
  for (const trackId of TRACKS) {
    const result = mergeTrack(trackId, local.tracks[trackId], cloud[trackId], recommend);
    if (!result.track) continue;
    tracks[trackId] = result.track;
    conflicts.push(...result.conflicts);
    if (result.conflicts.length === 0 && contentKey(result.track) !== contentKey(cloud[trackId])) upload.push(trackId);
  }
  return { state: { ...local, tracks }, conflicts, upload };
}

/** Apply the learner's decision for one conflict. */
export function resolveConflict(
  state: CompetencyState,
  conflict: CompetencyConflict,
  choice: "local" | "cloud",
  recommend: Recommend,
  now: string,
): CompetencyState {
  const current = state.tracks[conflict.track];
  if (!current) return state;
  const value = choice === "local" ? conflict.local : conflict.cloud;
  const updated: TrackCompetency = { ...current, [conflict.field]: value, updatedAt: now };
  updated.recommendedNext = recommend(conflict.track, updated);
  return { ...state, tracks: { ...state.tracks, [conflict.track]: updated } };
}
