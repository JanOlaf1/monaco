import { parseTrack, TRACKS, type TrackCompetency, type TrackId } from "@/lib/learning/competency";

/**
 * Cloud document for one track: `users/{uid}/competency/{track}`.
 *
 * The fields mirror `TrackCompetency` plus a schema version, the track id and
 * timestamps. `serverUpdatedAt` is set with `serverTimestamp()` by the writer
 * and enforced by the security rules; it is never read back into local state.
 * Keep this shape in sync with `firestore.rules` (validCompetency).
 */
export const COMPETENCY_SCHEMA_VERSION = 1;
export const COMPETENCY_COLLECTION = "competency";

/** Bounds also enforced by the security rules. */
export const LIMITS = { maxSkills: 16, maxIdLength: 64, maxDateLength: 40 } as const;

export interface CompetencyDocument extends Omit<TrackCompetency, "updatedAt"> {
  schemaVersion: typeof COMPETENCY_SCHEMA_VERSION;
  track: TrackId;
  /** Client time of the last local change (ISO 8601). */
  updatedAt: string;
}

export function isTrackId(value: string): value is TrackId {
  return (TRACKS as string[]).includes(value);
}

export function toCompetencyDocument(trackId: TrackId, track: TrackCompetency): CompetencyDocument {
  return {
    schemaVersion: COMPETENCY_SCHEMA_VERSION,
    track: trackId,
    selfReportedLevel: track.selfReportedLevel,
    placementResult: track.placementResult,
    // Bounded like the rules; evidence is small (one entry per skill of a course).
    skillEvidence: Object.fromEntries(Object.entries(track.skillEvidence).slice(0, LIMITS.maxSkills)),
    recommendedNext: track.recommendedNext,
    assessmentDate: track.assessmentDate,
    userOverride: track.userOverride,
    updatedAt: track.updatedAt,
  };
}

/**
 * Validate a document read from the cloud. Unknown schema versions, a wrong
 * track id or malformed fields make the whole document invalid (`null`), so
 * corrupted cloud data can never overwrite valid local data.
 */
export function parseCompetencyDocument(id: string, raw: unknown): TrackCompetency | null {
  if (!isTrackId(id) || typeof raw !== "object" || raw === null) return null;
  const data = raw as Record<string, unknown>;
  if (data.schemaVersion !== COMPETENCY_SCHEMA_VERSION || data.track !== id) return null;
  if (typeof data.updatedAt !== "string" || data.updatedAt.length === 0) return null;
  return parseTrack(data);
}

/** Content identity of a track, ignoring timestamps (used to skip writes that change nothing). */
export function contentKey(track: TrackCompetency | undefined): string {
  return track ? stableStringify({ ...track, updatedAt: undefined }) : "";
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
