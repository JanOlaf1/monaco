import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCatalog } from "@/lib/content/localize";
import { authErrorKey, classifySyncError } from "@/lib/firebase/errors";
import {
  applyPlacementResult,
  emptyCompetency,
  setSelfReportedLevel,
  setUserOverride,
  type CompetencyState,
  type PlacementResult,
  type TrackCompetency,
  type TrackId,
} from "@/lib/learning/competency";
import { recommendForTrack } from "@/lib/learning/recommend";
import { contentKey, parseCompetencyDocument, toCompetencyDocument, type CompetencyDocument } from "@/lib/sync/competency-doc";
import { mergeCompetency, resolveConflict, type Recommend } from "@/lib/sync/competency-merge";
import { createCompetencySync, type CompetencyRemote, type LocalCompetencyStore } from "@/lib/sync/competency-sync";
import { SYNC_DOMAINS } from "@/lib/sync/domains";

const T1 = "2026-11-10T08:00:00.000Z";
const T2 = "2026-11-11T08:00:00.000Z";
const courses = getCatalog("en");
const recommend: Recommend = (trackId, track) =>
  recommendForTrack(courses.find((course) => course.language === trackId), track, T2);

const placement = (level: PlacementResult["level"], completedAt: string, correct = 5): PlacementResult => ({
  assessmentId: "placement-python",
  version: 1,
  level,
  correct,
  answered: 6,
  total: 9,
  stoppedEarly: true,
  completedAt,
});

function withPlacement(state: CompetencyState, level: PlacementResult["level"], at: string, skill = "py.loops") {
  return applyPlacementResult(state, "python", placement(level, at), { [skill]: { correct: 1, total: 1 } }, at);
}

describe("cloud documents", () => {
  it("round-trips a track and rejects corrupted or foreign documents", () => {
    const track = withPlacement(setSelfReportedLevel(emptyCompetency, "python", "advanced", T1), "intermediate", T1).tracks.python!;
    const document = toCompetencyDocument("python", track);
    expect(document).toMatchObject({ schemaVersion: 1, track: "python" });
    expect(parseCompetencyDocument("python", JSON.parse(JSON.stringify(document)))).toEqual(track);
    expect(parseCompetencyDocument("javascript", document)).toBeNull();
    expect(parseCompetencyDocument("python", { ...document, schemaVersion: 2 })).toBeNull();
    expect(parseCompetencyDocument("python", { ...document, updatedAt: 42 })).toBeNull();
    expect(parseCompetencyDocument("cobol", { ...document, track: "cobol" })).toBeNull();
    expect(parseCompetencyDocument("python", "garbage")).toBeNull();
  });

  it("compares content without timestamps", () => {
    const track = setSelfReportedLevel(emptyCompetency, "python", "beginner", T1).tracks.python!;
    expect(contentKey(track)).toBe(contentKey({ ...track, updatedAt: T2 }));
    expect(contentKey(track)).not.toBe(contentKey({ ...track, selfReportedLevel: "advanced" }));
  });

  it("only claims competency as synced", () => {
    expect(SYNC_DOMAINS.filter((domain) => domain.cloud).map((domain) => domain.id)).toEqual(["competency"]);
  });
});

describe("merging local and cloud data", () => {
  it("keeps data that exists on one side only and uploads local-only tracks", () => {
    const local = setSelfReportedLevel(emptyCompetency, "javascript", "advanced", T1);
    const cloud = setSelfReportedLevel(emptyCompetency, "python", "beginner", T1).tracks;
    const result = mergeCompetency(local, cloud, recommend);
    expect(result.state.tracks.javascript?.selfReportedLevel).toBe("advanced");
    expect(result.state.tracks.python?.selfReportedLevel).toBe("beginner");
    expect(result.upload).toEqual(["javascript"]);
    expect(result.conflicts).toEqual([]);
  });

  it("keeps the most recent placement result with its evidence, whichever side it is on", () => {
    const local = withPlacement(emptyCompetency, "beginner", T1, "py.output");
    const cloud = withPlacement(emptyCompetency, "advanced", T2, "py.classes").tracks;
    const merged = mergeCompetency(local, cloud, recommend).state.tracks.python!;
    expect(merged.placementResult?.level).toBe("advanced");
    expect(Object.keys(merged.skillEvidence)).toEqual(["py.classes"]);
    expect(merged.assessmentDate).toBe(T2);
    // Same inputs, other direction: the same placement wins.
    const reverse = mergeCompetency(withPlacement(emptyCompetency, "advanced", T2, "py.classes"), local.tracks, recommend);
    expect(reverse.state.tracks.python?.placementResult).toEqual(merged.placementResult);
  });

  it("preserves a manual override present on one side only", () => {
    const local = setUserOverride(emptyCompetency, "python", "professional", T1);
    const cloud = withPlacement(emptyCompetency, "beginner", T2).tracks;
    const merged = mergeCompetency(local, cloud, recommend);
    expect(merged.state.tracks.python).toMatchObject({ userOverride: "professional", placementResult: { level: "beginner" } });
    // The suggestion follows the override (deepest available band).
    expect(merged.state.tracks.python?.recommendedNext).toMatchObject({ chapterId: "py-comprehensions", reason: "override" });
    expect(merged.upload).toEqual(["python"]);
  });

  it("asks the learner when both sides chose different levels, and does not upload that track", () => {
    const local = setUserOverride(setSelfReportedLevel(emptyCompetency, "python", "beginner", T1), "python", "advanced", T1);
    const cloud = setUserOverride(setSelfReportedLevel(emptyCompetency, "python", "beginner", T2), "python", "intermediate", T2).tracks;
    const result = mergeCompetency(local, cloud, recommend);
    expect(result.conflicts).toEqual([{ track: "python", field: "userOverride", local: "advanced", cloud: "intermediate" }]);
    expect(result.state.tracks.python?.userOverride).toBe("advanced");
    expect(result.upload).toEqual([]);

    const resolved = resolveConflict(result.state, result.conflicts[0], "cloud", recommend, T2);
    expect(resolved.tracks.python?.userOverride).toBe("intermediate");
    expect(resolved.tracks.python?.recommendedNext).toMatchObject({ chapterId: "py-functions" });
  });

  it("is deterministic and causes no write when nothing changed", () => {
    const local = withPlacement(setSelfReportedLevel(emptyCompetency, "python", "advanced", T1), "intermediate", T1);
    const cloudTrack = mergeCompetency(local, {}, recommend).state.tracks.python!;
    const first = mergeCompetency(local, { python: cloudTrack }, recommend);
    const second = mergeCompetency(local, { python: cloudTrack }, recommend);
    expect(first).toEqual(second);
    expect(first.upload).toEqual([]);
  });
});

/* ------------------------------ Engine ------------------------------ */

function memoryStore(initial: CompetencyState): LocalCompetencyStore & { value: CompetencyState } {
  const listeners = new Set<() => void>();
  const store = {
    value: initial,
    get: () => store.value,
    update(updater: (state: CompetencyState) => CompetencyState) {
      store.value = updater(store.value);
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return store;
}

function fakeRemote(initial: Partial<Record<TrackId, TrackCompetency>> = {}) {
  const docs = new Map<TrackId, CompetencyDocument>();
  for (const [trackId, track] of Object.entries(initial)) docs.set(trackId as TrackId, toCompetencyDocument(trackId as TrackId, track!));
  const calls = { load: 0, save: [] as TrackId[] };
  let failure: unknown = null;
  const remote: CompetencyRemote & { calls: typeof calls; docs: typeof docs; fail(error: unknown): void } = {
    calls,
    docs,
    fail(error) {
      failure = error;
    },
    async load() {
      calls.load += 1;
      if (failure) throw failure;
      const tracks: Partial<Record<TrackId, TrackCompetency>> = {};
      for (const [trackId, document] of docs) tracks[trackId] = parseCompetencyDocument(trackId, document)!;
      return { tracks, invalid: [] };
    },
    async save(_uid, trackId, document) {
      if (failure) throw failure;
      calls.save.push(trackId);
      docs.set(trackId, JSON.parse(JSON.stringify(document)));
    },
  };
  return remote;
}

const offlineError = Object.assign(new Error("unavailable"), { code: "unavailable" });

describe("sync engine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const engineFor = (remote: CompetencyRemote, local: LocalCompetencyStore) =>
    createCompetencySync({ remote, local, recommend, classifyError: classifySyncError, debounceMs: 1000, now: () => T2 });

  it("migrates local data on first sign-in without losing anything", async () => {
    const local = memoryStore(withPlacement(setSelfReportedLevel(emptyCompetency, "python", "advanced", T1), "intermediate", T1));
    const remote = fakeRemote();
    const sync = engineFor(remote, local);
    await sync.start("alice");
    expect(remote.calls.load).toBe(1);
    expect(remote.calls.save).toEqual(["python"]);
    expect(local.value.tracks.python?.placementResult?.level).toBe("intermediate");
    expect(sync.getStatus()).toMatchObject({ state: "synced" });
  });

  it("brings a new device up to date from the cloud", async () => {
    const remote = fakeRemote(
      withPlacement(setSelfReportedLevel(emptyCompetency, "python", "advanced", T1), "intermediate", T1).tracks,
    );
    const local = memoryStore(emptyCompetency);
    await engineFor(remote, local).start("alice");
    expect(local.value.tracks.python).toMatchObject({ selfReportedLevel: "advanced", placementResult: { level: "intermediate" } });
    expect(remote.calls.save).toEqual([]);
  });

  it("debounces local changes and writes only changed tracks", async () => {
    const local = memoryStore(emptyCompetency);
    const remote = fakeRemote();
    const sync = engineFor(remote, local);
    await sync.start("alice");
    local.update((state) => setSelfReportedLevel(state, "python", "beginner", T2));
    local.update((state) => setSelfReportedLevel(state, "python", "intermediate", T2));
    expect(remote.calls.save).toEqual([]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(remote.calls.save).toEqual(["python"]);
    // A change that only touches timestamps causes no write.
    local.update((state) => ({ ...state, tracks: { ...state.tracks, python: { ...state.tracks.python!, updatedAt: "2027-01-01T00:00:00.000Z" } } }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(remote.calls.save).toEqual(["python"]);
  });

  it("keeps local data when offline and retries later", async () => {
    const local = memoryStore(setSelfReportedLevel(emptyCompetency, "react", "beginner", T1));
    const remote = fakeRemote();
    remote.fail(offlineError);
    const sync = engineFor(remote, local);
    await sync.start("alice");
    expect(sync.getStatus()).toMatchObject({ state: "offline" });
    expect(local.value.tracks.react?.selfReportedLevel).toBe("beginner");
    remote.fail(null);
    await sync.syncNow();
    expect(sync.getStatus()).toMatchObject({ state: "synced" });
    expect(remote.calls.save).toEqual(["react"]);
  });

  it("reports permission problems without touching local data", async () => {
    const local = memoryStore(setSelfReportedLevel(emptyCompetency, "python", "beginner", T1));
    const remote = fakeRemote();
    remote.fail(Object.assign(new Error("denied"), { code: "permission-denied" }));
    const sync = engineFor(remote, local);
    await sync.start("alice");
    expect(sync.getStatus()).toMatchObject({ state: "denied" });
    expect(local.value.tracks.python?.selfReportedLevel).toBe("beginner");
  });

  it("waits for the learner's choice before uploading a conflicted track", async () => {
    const local = memoryStore(setUserOverride(emptyCompetency, "python", "advanced", T1));
    const remote = fakeRemote(setUserOverride(emptyCompetency, "python", "beginner", T1).tracks);
    const sync = engineFor(remote, local);
    await sync.start("alice");
    const status = sync.getStatus();
    expect(status.state).toBe("conflict");
    expect(remote.calls.save).toEqual([]);
    if (status.state !== "conflict") throw new Error("expected a conflict");
    await sync.resolve(status.conflicts[0], "local");
    expect(remote.calls.save).toEqual(["python"]);
    expect(remote.docs.get("python")?.userOverride).toBe("advanced");
    expect(sync.getStatus()).toMatchObject({ state: "synced" });
  });

  it("stops writing after sign-out and leaves local data in place", async () => {
    const local = memoryStore(emptyCompetency);
    const remote = fakeRemote();
    const sync = engineFor(remote, local);
    await sync.start("alice");
    sync.stop();
    local.update((state) => setSelfReportedLevel(state, "python", "advanced", T2));
    await vi.advanceTimersByTimeAsync(5000);
    expect(remote.calls.save).toEqual([]);
    expect(local.value.tracks.python?.selfReportedLevel).toBe("advanced");
    expect(sync.getStatus()).toEqual({ state: "idle" });
  });
});

describe("error messages", () => {
  it("maps Firebase Auth codes to translated messages", () => {
    expect(authErrorKey({ code: "auth/invalid-credential" })).toBe("invalidCredentials");
    expect(authErrorKey({ code: "auth/user-not-found" })).toBe("invalidCredentials");
    expect(authErrorKey({ code: "auth/email-already-in-use" })).toBe("emailInUse");
    expect(authErrorKey({ code: "auth/weak-password" })).toBe("weakPassword");
    expect(authErrorKey({ code: "auth/network-request-failed" })).toBe("network");
    expect(authErrorKey({ code: "auth/something-new" })).toBe("generic");
    expect(authErrorKey(new Error("plain"))).toBe("generic");
  });

  it("classifies sync failures", () => {
    expect(classifySyncError({ code: "permission-denied" })).toBe("denied");
    expect(classifySyncError({ code: "unavailable" })).toBe("offline");
    expect(classifySyncError(new TypeError("fetch failed"))).toBe("offline");
    // How Firestore Lite reports a request that never reached the server.
    const wrapped = Object.assign(new Error("Request failed with error: fetch failed"), { code: "unknown" });
    expect(classifySyncError(wrapped)).toBe("offline");
    expect(classifySyncError(Object.assign(new Error("Something else"), { code: "unknown" }))).toBe("error");
    expect(classifySyncError({ code: "internal" })).toBe("error");
  });
});
