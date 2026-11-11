import { readFileSync } from "node:fs";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import {
  applyActionCode,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from "firebase/auth";
import { collection, connectFirestoreEmulator, doc, getDocs, getFirestore, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/content/localize";
import { createFirestoreCompetencyRemote } from "@/lib/firebase/competency-remote";
import { classifySyncError } from "@/lib/firebase/errors";
import {
  applyPlacementResult,
  emptyCompetency,
  setSelfReportedLevel,
  setUserOverride,
  type CompetencyState,
} from "@/lib/learning/competency";
import { recommendForTrack } from "@/lib/learning/recommend";
import { createCompetencySync, type CompetencySync, type LocalCompetencyStore } from "@/lib/sync/competency-sync";
import { authEmulatorUrl, firestoreEmulator } from "./emulator-hosts";

/**
 * End-to-end sync against the Auth and Firestore emulators with the real
 * Firebase SDK and the real security rules. Run with `npm run test:rules`.
 */
const PROJECT = "demo-koodaamo";
const AUTH = authEmulatorUrl;
const T1 = "2026-11-10T08:00:00.000Z";
const courses = getCatalog("en");

let rulesEnv: RulesTestEnvironment;
const apps: FirebaseApp[] = [];
const engines: CompetencySync[] = [];

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

/** One browser: its own Firebase app, auth session and local competency store. */
function device(name: string, local: CompetencyState, firestorePort = firestoreEmulator.port) {
  const app = initializeApp({ apiKey: "demo-api-key", projectId: PROJECT, appId: "1:1:web:demo", authDomain: `${PROJECT}.firebaseapp.com` }, name);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, AUTH, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, firestoreEmulator.host, firestorePort);
  const remote = createFirestoreCompetencyRemote(db, { collection, doc, getDocs, setDoc, serverTimestamp });
  const store = memoryStore(local);
  const engine = createCompetencySync({
    remote,
    local: store,
    recommend: (trackId, track) => recommendForTrack(courses.find((course) => course.language === trackId), track, T1),
    classifyError: classifySyncError,
    debounceMs: 20,
  });
  engines.push(engine);
  return { auth, db, remote, store, engine };
}

async function verifyEmail(auth: Auth, email: string) {
  await sendEmailVerification(auth.currentUser!);
  const response = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes } = (await response.json()) as { oobCodes: { email: string; oobCode: string; requestType: string }[] };
  const code = oobCodes.filter((entry) => entry.email === email && entry.requestType === "VERIFY_EMAIL").at(-1);
  await applyActionCode(auth, code!.oobCode);
  await auth.currentUser!.reload();
  await auth.currentUser!.getIdToken(true);
}

async function register(auth: Auth, email: string, verify = true) {
  const credential = await createUserWithEmailAndPassword(auth, email, "correct horse battery");
  if (verify) await verifyEmail(auth, email);
  return credential.user.uid;
}

async function cloudTracks(uid: string): Promise<Record<string, Record<string, unknown>>> {
  const result: Record<string, Record<string, unknown>> = {};
  await rulesEnv.withSecurityRulesDisabled(async (context) => {
    const snapshot = await context.firestore().collection(`users/${uid}/competency`).get();
    for (const document of snapshot.docs) result[document.id] = document.data();
  });
  return result;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
  rulesEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync("firestore.rules", "utf8"), ...firestoreEmulator },
  });
});

beforeEach(async () => {
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  await rulesEnv.clearFirestore();
});

afterEach(async () => {
  for (const engine of engines.splice(0)) engine.stop();
  await Promise.all(apps.splice(0).map((app) => deleteApp(app)));
});

afterAll(async () => {
  await rulesEnv?.cleanup();
});

describe("cloud sync with the emulators", () => {
  it("migrates local data on first sign-in and restores it on another device", async () => {
    let local = setSelfReportedLevel(emptyCompetency, "python", "advanced", T1);
    local = applyPlacementResult(local, "python", {
      assessmentId: "placement-python",
      version: 1,
      level: "intermediate",
      correct: 4,
      answered: 6,
      total: 9,
      stoppedEarly: true,
      completedAt: T1,
    }, { "py.loops": { correct: 1, total: 1 } }, T1);
    local = setSelfReportedLevel(local, "javascript", "beginner", T1);

    const laptop = device("laptop", local);
    const uid = await register(laptop.auth, "ada@example.com");
    await laptop.engine.start(uid);
    expect(laptop.engine.getStatus()).toMatchObject({ state: "synced" });
    // Local data is unchanged and now also in the cloud.
    expect(laptop.store.value.tracks.python?.placementResult?.level).toBe("intermediate");
    const stored = await cloudTracks(uid);
    expect(Object.keys(stored).sort()).toEqual(["javascript", "python"]);
    expect(stored.python).toMatchObject({ schemaVersion: 1, track: "python", selfReportedLevel: "advanced" });

    // A second device with its own choice for another language: both survive.
    const phone = device("phone", setSelfReportedLevel(emptyCompetency, "react", "intermediate", T1));
    await signInWithEmailAndPassword(phone.auth, "ada@example.com", "correct horse battery");
    await phone.engine.start(uid);
    expect(phone.store.value.tracks.python?.placementResult?.level).toBe("intermediate");
    expect(phone.store.value.tracks.react?.selfReportedLevel).toBe("intermediate");
    expect(Object.keys(await cloudTracks(uid)).sort()).toEqual(["javascript", "python", "react"]);

    // A brand-new device gets everything.
    const tablet = device("tablet", emptyCompetency);
    await signInWithEmailAndPassword(tablet.auth, "ada@example.com", "correct horse battery");
    await tablet.engine.start(uid);
    expect(Object.keys(tablet.store.value.tracks).sort()).toEqual(["javascript", "python", "react"]);
    expect(tablet.engine.getStatus()).toMatchObject({ state: "synced" });
  });

  it("waits for the learner when two devices chose different levels", async () => {
    const first = device("first", setUserOverride(emptyCompetency, "python", "beginner", T1));
    const uid = await register(first.auth, "grace@example.com");
    await first.engine.start(uid);

    const second = device("second", setUserOverride(emptyCompetency, "python", "advanced", T1));
    await signInWithEmailAndPassword(second.auth, "grace@example.com", "correct horse battery");
    await second.engine.start(uid);
    const status = second.engine.getStatus();
    expect(status.state).toBe("conflict");
    expect((await cloudTracks(uid)).python?.userOverride).toBe("beginner");
    if (status.state !== "conflict") throw new Error("expected a conflict");
    await second.engine.resolve(status.conflicts[0], "local");
    expect((await cloudTracks(uid)).python?.userOverride).toBe("advanced");
  });

  it("ignores damaged cloud documents and keeps local data", async () => {
    const laptop = device("laptop", setSelfReportedLevel(emptyCompetency, "python", "beginner", T1));
    const uid = await register(laptop.auth, "linus@example.com");
    await rulesEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(`users/${uid}/competency/python`).set({ schemaVersion: 99, track: "python", junk: true });
    });
    await laptop.engine.start(uid);
    expect(laptop.engine.getStatus()).toMatchObject({ state: "synced", ignoredDocuments: 1 });
    expect(laptop.store.value.tracks.python?.selfReportedLevel).toBe("beginner");
    // The damaged document was replaced by the valid local data.
    expect((await cloudTracks(uid)).python).toMatchObject({ schemaVersion: 1, selfReportedLevel: "beginner" });
  });

  it("refuses unverified accounts and other users' data", async () => {
    const unverified = device("unverified", setSelfReportedLevel(emptyCompetency, "python", "beginner", T1));
    const uid = await register(unverified.auth, "new@example.com", false);
    await unverified.engine.start(uid);
    expect(unverified.engine.getStatus()).toMatchObject({ state: "denied" });
    expect(unverified.store.value.tracks.python?.selfReportedLevel).toBe("beginner");

    const owner = device("owner", setSelfReportedLevel(emptyCompetency, "python", "advanced", T1));
    const ownerUid = await register(owner.auth, "owner@example.com");
    await owner.engine.start(ownerUid);
    const intruder = device("intruder", emptyCompetency);
    await register(intruder.auth, "intruder@example.com");
    await expect(intruder.remote.load(ownerUid)).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("stops syncing after sign-out", async () => {
    const laptop = device("laptop", emptyCompetency);
    const uid = await register(laptop.auth, "out@example.com");
    await laptop.engine.start(uid);
    laptop.engine.stop();
    await signOut(laptop.auth);
    laptop.store.update((state) => setSelfReportedLevel(state, "python", "advanced", T1));
    await pause(200);
    expect(await cloudTracks(uid)).toEqual({});
    expect(laptop.store.value.tracks.python?.selfReportedLevel).toBe("advanced");
  });

  it("reports offline when Firestore cannot be reached, without changing local data", async () => {
    const online = device("online", emptyCompetency);
    const uid = await register(online.auth, "offline@example.com");
    const offline = device("offline", setSelfReportedLevel(emptyCompetency, "python", "beginner", T1), 1);
    await signInWithEmailAndPassword(offline.auth, "offline@example.com", "correct horse battery");
    await offline.engine.start(uid);
    expect(offline.engine.getStatus()).toMatchObject({ state: "offline" });
    expect(offline.store.value.tracks.python?.selfReportedLevel).toBe("beginner");
  }, 60_000);
});
