import { TRACKS, type CompetencyState, type TrackCompetency, type TrackId } from "@/lib/learning/competency";
import { contentKey, toCompetencyDocument, type CompetencyDocument } from "./competency-doc";
import { mergeCompetency, resolveConflict, type CompetencyConflict, type Recommend } from "./competency-merge";

/**
 * Keeps the local competency store and the learner's cloud documents in step.
 *
 * - Reads the cloud once when a session starts (and again only on request or
 *   after a failure), merges deterministically and uploads only what changed.
 * - Local changes are uploaded after a short debounce; competency changes are
 *   rare (onboarding, placement, level choice), never per keystroke.
 * - The local store stays the source the UI reads. Failed requests never
 *   change local data; they are retried on the next change or `syncNow()`.
 *
 * The engine is framework-free: the cloud and local stores are injected so it
 * is unit-testable and other learner data can follow the same pattern later.
 */

export interface CompetencyRemote {
  /** All competency documents of the user, validated. `invalid` lists ids that were ignored. */
  load(uid: string): Promise<{ tracks: Partial<Record<TrackId, TrackCompetency>>; invalid: string[] }>;
  save(uid: string, trackId: TrackId, document: CompetencyDocument): Promise<void>;
}

export interface LocalCompetencyStore {
  get(): CompetencyState;
  update(updater: (state: CompetencyState) => CompetencyState): void;
  subscribe(listener: () => void): () => void;
}

export type SyncFailure = "offline" | "denied" | "error";

export type SyncStatus =
  | { state: "idle" }
  | { state: "syncing" }
  | { state: "synced"; at: string; ignoredDocuments: number }
  | { state: "conflict"; conflicts: CompetencyConflict[] }
  | { state: SyncFailure; message?: string };

export interface CompetencySync {
  start(uid: string): Promise<void>;
  stop(): void;
  /** Re-read the cloud and upload pending changes (e.g. after coming back online). */
  syncNow(): Promise<void>;
  resolve(conflict: CompetencyConflict, choice: "local" | "cloud"): Promise<void>;
  getStatus(): SyncStatus;
  subscribe(listener: () => void): () => void;
}

export function createCompetencySync(options: {
  remote: CompetencyRemote;
  local: LocalCompetencyStore;
  recommend: Recommend;
  classifyError: (error: unknown) => SyncFailure;
  debounceMs?: number;
  now?: () => string;
}): CompetencySync {
  const { remote, local, recommend, classifyError } = options;
  const debounceMs = options.debounceMs ?? 1500;
  const now = options.now ?? (() => new Date().toISOString());

  let uid: string | null = null;
  let status: SyncStatus = { state: "idle" };
  let conflicts: CompetencyConflict[] = [];
  /** Content of each track as last read from or written to the cloud. */
  let cloudKeys: Partial<Record<TrackId, string>> = {};
  let pulled = false;
  let applying = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribeLocal: (() => void) | null = null;
  let ignoredDocuments = 0;
  /** Bumped on start/stop so late responses from an old session are ignored. */
  let session = 0;
  const listeners = new Set<() => void>();

  const setStatus = (next: SyncStatus) => {
    status = next;
    for (const listener of listeners) listener();
  };
  const settledStatus = (): SyncStatus =>
    conflicts.length > 0 ? { state: "conflict", conflicts } : { state: "synced", at: now(), ignoredDocuments };

  const fail = (error: unknown) => {
    const kind = classifyError(error);
    setStatus({ state: kind, message: error instanceof Error ? error.message : undefined });
  };

  const conflicted = (trackId: TrackId) => conflicts.some((conflict) => conflict.track === trackId);

  let pushing: Promise<void> | null = null;
  let pushAgain = false;

  /** Serialised: a push requested while one is running runs once more afterwards. */
  async function push(current: number): Promise<void> {
    if (pushing) {
      pushAgain = true;
      return pushing;
    }
    pushing = (async () => {
      do {
        pushAgain = false;
        await pushOnce(current);
      } while (pushAgain && current === session);
    })();
    try {
      await pushing;
    } finally {
      pushing = null;
    }
  }

  /** Upload tracks whose local content differs from the cloud (skipping unresolved conflicts). */
  async function pushOnce(current: number): Promise<void> {
    if (!uid || !pulled) return;
    const state = local.get();
    const pending = TRACKS.filter((trackId) => {
      const track = state.tracks[trackId];
      return track && !conflicted(trackId) && contentKey(track) !== (cloudKeys[trackId] ?? "");
    });
    if (pending.length === 0) {
      if (status.state !== "synced" && status.state !== "conflict") setStatus(settledStatus());
      return;
    }
    setStatus({ state: "syncing" });
    try {
      for (const trackId of pending) {
        const track = state.tracks[trackId]!;
        await remote.save(uid, trackId, toCompetencyDocument(trackId, track));
        if (current !== session) return;
        cloudKeys = { ...cloudKeys, [trackId]: contentKey(track) };
      }
      setStatus(settledStatus());
    } catch (error) {
      if (current === session) fail(error);
    }
  }

  async function pull(current: number): Promise<void> {
    if (!uid) return;
    setStatus({ state: "syncing" });
    let cloud: Awaited<ReturnType<CompetencyRemote["load"]>>;
    try {
      cloud = await remote.load(uid);
    } catch (error) {
      if (current === session) fail(error);
      return;
    }
    if (current !== session) return;
    ignoredDocuments = cloud.invalid.length;
    cloudKeys = Object.fromEntries(TRACKS.map((trackId) => [trackId, contentKey(cloud.tracks[trackId])]));
    const result = mergeCompetency(local.get(), cloud.tracks, recommend);
    conflicts = result.conflicts;
    applying = true;
    try {
      local.update((state) => ({ ...state, tracks: result.state.tracks }));
    } finally {
      applying = false;
    }
    pulled = true;
    await push(current);
    if (current === session && status.state === "syncing") setStatus(settledStatus());
  }

  const schedule = () => {
    if (applying || !uid || !pulled) return;
    if (timer) clearTimeout(timer);
    const current = session;
    timer = setTimeout(() => {
      timer = null;
      void push(current);
    }, debounceMs);
  };

  function stop() {
    session += 1;
    if (timer) clearTimeout(timer);
    timer = null;
    unsubscribeLocal?.();
    unsubscribeLocal = null;
    uid = null;
    pulled = false;
    conflicts = [];
    cloudKeys = {};
    if (status.state !== "idle") setStatus({ state: "idle" });
  }

  return {
    async start(nextUid: string) {
      if (uid === nextUid && pulled) return;
      stop();
      session += 1;
      uid = nextUid;
      unsubscribeLocal = local.subscribe(schedule);
      await pull(session);
    },
    stop,
    async syncNow() {
      if (!uid) return;
      if (timer) clearTimeout(timer);
      timer = null;
      await pull(session);
    },
    async resolve(conflict, choice) {
      local.update((state) => resolveConflict(state, conflict, choice, recommend, now()));
      conflicts = conflicts.filter(
        (candidate) => !(candidate.track === conflict.track && candidate.field === conflict.field),
      );
      await push(session);
      if (status.state !== "syncing") setStatus(settledStatus());
    },
    getStatus: () => status,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
