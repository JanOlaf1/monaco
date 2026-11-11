import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { skills } from "@/content/skills";
import { toCompetencyDocument } from "@/lib/sync/competency-doc";
import { emptyTrack, type TrackCompetency } from "@/lib/learning/competency";
import { firestoreEmulator } from "./emulator-hosts";

/**
 * Firestore Security Rules tests. Run with the Emulator Suite:
 *   npm run test:rules
 * (firebase emulators:exec --only auth,firestore --project demo-koodaamo ...)
 */
const RULES = readFileSync("firestore.rules", "utf8");
const NOW = "2026-11-11T09:00:00.000Z";
let env: RulesTestEnvironment;

const serverTime = () => firebase.firestore.FieldValue.serverTimestamp();

function track(overrides: Partial<TrackCompetency> = {}): TrackCompetency {
  return {
    ...emptyTrack(NOW),
    selfReportedLevel: "intermediate",
    placementResult: {
      assessmentId: "placement-python",
      version: 1,
      level: "intermediate",
      correct: 4,
      answered: 6,
      total: 9,
      stoppedEarly: true,
      completedAt: NOW,
    },
    skillEvidence: { "py.loops": { correct: 1, total: 1, source: "placement", at: NOW } },
    recommendedNext: {
      courseId: "python",
      chapterId: "py-functions",
      exerciseId: "py-greet-function",
      level: "intermediate",
      reason: "placement",
      at: NOW,
    },
    assessmentDate: NOW,
    ...overrides,
  };
}

/** A valid python document as the app writes it. */
function validDoc(extra: Record<string, unknown> = {}) {
  return { ...toCompetencyDocument("python", track()), serverUpdatedAt: serverTime(), ...extra };
}

const verified = (uid: string) => env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: true });
const path = (uid: string, trackId = "python") => `users/${uid}/competency/${trackId}`;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-koodaamo",
    firestore: { rules: RULES, ...firestoreEmulator },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe("owner access", () => {
  it("lets a verified owner create, read, list and update their documents", async () => {
    const db = verified("alice").firestore();
    await assertSucceeds(db.doc(path("alice")).set(validDoc()));
    await assertSucceeds(db.doc(path("alice")).get());
    await assertSucceeds(db.collection("users/alice/competency").get());
    await assertSucceeds(db.doc(path("alice")).set(validDoc({ userOverride: "advanced" })));
  });

  it("accepts all four tracks with their own skills, and empty documents", async () => {
    const db = verified("alice").firestore();
    for (const trackId of ["javascript", "typescript", "react"] as const) {
      const empty = { ...toCompetencyDocument(trackId, emptyTrack(NOW)), serverUpdatedAt: serverTime() };
      await assertSucceeds(db.doc(path("alice", trackId)).set(empty));
    }
  });

  it("does not allow deletes (the app never deletes)", async () => {
    const db = verified("alice").firestore();
    await assertSucceeds(db.doc(path("alice")).set(validDoc()));
    await assertFails(db.doc(path("alice")).delete());
  });
});

describe("other users and anonymous visitors", () => {
  it("denies reading or writing another user's documents", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(path("alice")).set(validDoc());
    });
    const bob = verified("bob").firestore();
    await assertFails(bob.doc(path("alice")).get());
    await assertFails(bob.collection("users/alice/competency").get());
    await assertFails(bob.doc(path("alice")).set(validDoc()));
  });

  it("denies unauthenticated access", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(db.doc(path("alice")).get());
    await assertFails(db.doc(path("alice")).set(validDoc()));
  });

  it("denies unverified email addresses", async () => {
    const db = env.authenticatedContext("carol", { email: "carol@example.com", email_verified: false }).firestore();
    await assertFails(db.doc(path("carol")).set(validDoc()));
    await assertFails(db.doc(path("carol")).get());
  });

  it("denies every other path, including the user document itself", async () => {
    const db = verified("alice").firestore();
    await assertFails(db.doc("users/alice").set({ name: "Alice" }));
    await assertFails(db.doc("users/alice/progress/py-hello-world").set({ done: true }));
    await assertFails(db.doc("public/anything").get());
  });
});

describe("document validation", () => {
  const db = () => verified("alice").firestore();

  it("rejects unknown tracks and a mismatched track field", async () => {
    await assertFails(db().doc(path("alice", "cobol")).set({ ...validDoc(), track: "cobol" }));
    await assertFails(db().doc(path("alice", "javascript")).set(validDoc()));
  });

  it("rejects extra fields and missing fields", async () => {
    await assertFails(db().doc(path("alice")).set(validDoc({ isAdmin: true })));
    const { assessmentDate: _omitted, ...missing } = validDoc();
    void _omitted;
    await assertFails(db().doc(path("alice")).set(missing));
  });

  it("rejects invalid levels and a professional placement result", async () => {
    await assertFails(db().doc(path("alice")).set(validDoc({ selfReportedLevel: "wizard" })));
    await assertFails(db().doc(path("alice")).set(validDoc({ userOverride: "not-sure" })));
    const professional = { ...track().placementResult!, level: "professional" };
    await assertFails(db().doc(path("alice")).set(validDoc({ placementResult: professional })));
  });

  it("rejects impossible scores, wrong types and foreign assessments", async () => {
    const base = track().placementResult!;
    await assertFails(db().doc(path("alice")).set(validDoc({ placementResult: { ...base, correct: 7, answered: 6 } })));
    await assertFails(db().doc(path("alice")).set(validDoc({ placementResult: { ...base, total: 5000, answered: 6 } })));
    await assertFails(db().doc(path("alice")).set(validDoc({ placementResult: { ...base, correct: "4" } })));
    await assertFails(db().doc(path("alice")).set(validDoc({ placementResult: { ...base, assessmentId: "placement-javascript" } })));
    await assertFails(db().doc(path("alice")).set(validDoc({ schemaVersion: 2 })));
  });

  it("rejects oversized or malformed strings", async () => {
    const huge = "x".repeat(100_000);
    await assertFails(db().doc(path("alice")).set(validDoc({ updatedAt: huge })));
    await assertFails(db().doc(path("alice")).set(validDoc({ assessmentDate: "yesterday" })));
    const recommendation = { ...track().recommendedNext!, exerciseId: huge };
    await assertFails(db().doc(path("alice")).set(validDoc({ recommendedNext: recommendation })));
    await assertFails(
      db().doc(path("alice")).set(validDoc({ recommendedNext: { ...track().recommendedNext!, courseId: "javascript" } })),
    );
  });

  it("validates skill evidence keys and every entry", async () => {
    const entry = { correct: 1, total: 1, source: "placement", at: NOW };
    await assertSucceeds(db().doc(path("alice")).set(validDoc({ skillEvidence: { "py.loops": entry, "py.text": entry } })));
    await assertFails(db().doc(path("alice")).set(validDoc({ skillEvidence: { "js.loops": entry } })));
    await assertFails(db().doc(path("alice")).set(validDoc({ skillEvidence: { "py.loops": { ...entry, junk: "x" } } })));
    await assertFails(db().doc(path("alice")).set(validDoc({ skillEvidence: { "py.loops": { ...entry, at: "x".repeat(5000) } } })));
    await assertFails(db().doc(path("alice")).set(validDoc({ skillEvidence: { "py.loops": { ...entry, correct: 2 } } })));
  });

  it("requires the server timestamp", async () => {
    await assertFails(db().doc(path("alice")).set(validDoc({ serverUpdatedAt: new Date("2020-01-01") })));
    await assertFails(db().doc(path("alice")).set(validDoc({ serverUpdatedAt: NOW })));
  });

  it("validates updates as strictly as creates", async () => {
    await assertSucceeds(db().doc(path("alice")).set(validDoc()));
    await assertFails(db().doc(path("alice")).update({ selfReportedLevel: "wizard", serverUpdatedAt: serverTime() }));
    await assertFails(db().doc(path("alice")).update({ extra: "x", serverUpdatedAt: serverTime() }));
    await assertSucceeds(db().doc(path("alice")).update({ userOverride: "beginner", serverUpdatedAt: serverTime() }));
  });
});

describe("rules stay in sync with the content", () => {
  it("lists exactly the skill ids of each track", () => {
    for (const [trackId, fn] of [
      ["python", "pythonSkills"],
      ["javascript", "javascriptSkills"],
      ["typescript", "typescriptSkills"],
      ["react", "reactSkills"],
    ] as const) {
      const body = RULES.slice(RULES.indexOf(`function ${fn}()`)).split("}")[0];
      const listed = [...body.matchAll(/'([a-z.-]+)'/g)].map((match) => match[1]).sort();
      const expected = skills.filter((skill) => skill.track === trackId).map((skill) => skill.id).sort();
      expect(listed, trackId).toEqual(expected);
      for (const id of expected) expect(RULES, `${trackId}: evidenceOk for ${id}`).toContain(`evidenceOk(m, '${id}')`);
    }
  });
});
