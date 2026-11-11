import { describe, expect, it } from "vitest";
import { applyAdventurePass, crystalBalance } from "@/lib/adventure/engine";
import { emptyAdventure, eventId, parseAdventure, type AdventureEvent, type AdventureState } from "@/lib/adventure/state";
import {
  BACKUP_SECTIONS,
  MAX_BACKUP_BYTES,
  backupFileName,
  createBackup,
  mergeProgressStates,
  parseBackup,
  planImport,
  type BackupData,
  type ImportContext,
} from "@/lib/backup/backup";
import { toGamificationCatalog } from "@/lib/content/catalog";
import { getCatalog } from "@/lib/content/localize";
import { applyPracticePass, applyStepPass } from "@/lib/gamification/engine";
import { emptyGamification } from "@/lib/gamification/state";
import { exerciseXp, totalXp } from "@/lib/gamification/xp";
import { emptyCompetency, setUserOverride } from "@/lib/learning/competency";
import { getPracticeActivity } from "@/lib/practice/content";
import { emptyPractice, recordPracticePass } from "@/lib/practice/state";
import { emptyDrafts, setDraftFile } from "@/lib/progress/drafts";
import { emptyProgress, recordStepPassed } from "@/lib/progress/progress";
import { emptySchedule, setDeadline } from "@/lib/schedule/deadlines";

const catalog = toGamificationCatalog(getCatalog("en"));
const context: ImportContext = {
  catalog,
  isPracticeActivity: (id) => getPracticeActivity(id) !== undefined,
  recommend: () => null,
};

const empty: BackupData = {
  progress: emptyProgress,
  gamification: { ...emptyGamification, migratedProgress: true },
  competency: emptyCompetency,
  adventure: emptyAdventure,
  practice: emptyPractice,
  drafts: emptyDrafts,
  schedule: emptySchedule,
};

/** Complete exercises the way the app does: progress, XP and crystals from real passes. */
function complete(data: BackupData, exerciseIds: string[], start: Date): BackupData {
  let { progress, gamification, adventure } = data;
  let time = start.getTime();
  for (const exerciseId of exerciseIds) {
    const exercise = catalog.exercises[exerciseId];
    for (const stepId of exercise.stepIds) {
      const now = new Date((time += 60_000));
      progress = recordStepPassed(progress, exerciseId, stepId, exercise.stepIds, now.toISOString());
      gamification = applyStepPass({ state: gamification, progress, catalog, exerciseId, stepId, now }).state;
      adventure = applyAdventurePass({ state: adventure, progress, catalog, xpAwards: gamification.awards, exerciseId, stepId, now });
    }
  }
  return { ...data, progress, gamification, adventure };
}

function roundTrip(data: BackupData) {
  const parsed = parseBackup(JSON.stringify(createBackup(data, new Date("2026-11-10T12:00:00.000Z"))));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.data;
}

const deviceA = complete(empty, ["py-hello-world", "py-multiple-prints"], new Date("2026-11-01T09:00:00.000Z"));
const deviceB = complete(empty, ["py-hello-world", "js-hello-console"], new Date("2026-11-02T09:00:00.000Z"));

describe("backup files", () => {
  it("round-trips every learning data section", () => {
    const file = createBackup(deviceA, new Date("2026-11-10T12:00:00.000Z"));
    expect(Object.keys(file.data).sort()).toEqual([...BACKUP_SECTIONS].sort());
    const parsed = roundTrip(deviceA);
    for (const section of BACKUP_SECTIONS) expect(parsed[section], section).toEqual(deviceA[section]);
    expect(backupFileName(new Date(2026, 10, 10))).toBe("koodaamo-backup-2026-11-10.json");
  });

  it("contains no account data, credentials or tokens", () => {
    const json = JSON.stringify(createBackup(deviceA, new Date()));
    for (const secret of ["account-session", "password", "token", "apiKey", "uid", "email"]) {
      expect(json.toLowerCase(), secret).not.toContain(secret.toLowerCase());
    }
  });

  it("rejects files that are not valid backups", () => {
    expect(parseBackup("not json")).toEqual({ ok: false, error: "invalid-json" });
    expect(parseBackup(JSON.stringify({ format: "something-else", version: 1, data: {} }))).toEqual({ ok: false, error: "not-backup" });
    expect(parseBackup(JSON.stringify([1, 2, 3]))).toEqual({ ok: false, error: "not-backup" });
    expect(parseBackup(JSON.stringify({ format: "koodaamo-backup", version: 2, data: {} }))).toEqual({ ok: false, error: "newer-version" });
    expect(parseBackup(JSON.stringify({ format: "koodaamo-backup", version: "1", data: {} }))).toEqual({ ok: false, error: "not-backup" });
    expect(parseBackup(JSON.stringify({ format: "koodaamo-backup", version: 1, data: { progress: { version: 9 } } }))).toEqual({
      ok: false,
      error: "empty",
    });
    expect(parseBackup("x".repeat(MAX_BACKUP_BYTES + 1))).toEqual({ ok: false, error: "too-large" });
  });

  it("keeps valid sections and drops malformed ones", () => {
    const file = createBackup(deviceA, new Date());
    const tampered = JSON.parse(JSON.stringify(file));
    tampered.data.adventure = { version: 1, events: "broken" };
    tampered.data.gamification.awards["exercise:py-hello-world"].kind = "jackpot";
    const parsed = parseBackup(JSON.stringify(tampered));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.adventure).toBeUndefined();
    expect(parsed.data.progress).toEqual(deviceA.progress);
    expect(parsed.data.gamification?.awards["exercise:py-hello-world"]).toBeUndefined();
  });

  it("ignores prototype keys", () => {
    const json = `{"format":"koodaamo-backup","version":1,"data":{"progress":{"version":1,"exercises":{"__proto__":{"completedStepIds":["x"],"polluted":true},"py-hello-world":{"completedStepIds":["task"],"updatedAt":"2026-11-01T00:00:00.000Z"}}}}}`;
    const parsed = parseBackup(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(Object.keys(parsed.data.progress!.exercises)).toEqual(["py-hello-world"]);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(parsed.data.progress!.exercises)).toBe(Object.prototype);
  });
});

describe("importing a backup", () => {
  it("restores everything into an empty browser", () => {
    const { next, summary } = planImport(empty, roundTrip(deviceA), context);
    expect(next.progress).toEqual(deviceA.progress);
    expect(totalXp(next.gamification.awards)).toBe(totalXp(deviceA.gamification.awards));
    expect(crystalBalance(next.adventure)).toBe(crystalBalance(deviceA.adventure));
    expect(summary).toMatchObject({
      exercises: 2,
      xp: totalXp(deviceA.gamification.awards),
      crystals: crystalBalance(deviceA.adventure),
      changed: true,
      skipped: 0,
    });
  });

  it("never counts XP or crystals twice, even when imported repeatedly", () => {
    const backup = roundTrip(deviceA);
    const once = planImport(empty, backup, context).next;
    const twice = planImport(once, backup, context);
    expect(twice.summary).toMatchObject({ changed: false, xp: 0, crystals: 0, exercises: 0 });
    expect(totalXp(twice.next.gamification.awards)).toBe(totalXp(deviceA.gamification.awards));
  });

  it("combines two devices without double-counting shared accomplishments", () => {
    const { next, summary } = planImport(deviceA, roundTrip(deviceB), context);
    const ids = new Set([...Object.keys(deviceA.gamification.awards), ...Object.keys(deviceB.gamification.awards)]);
    expect(Object.keys(next.gamification.awards).sort()).toEqual([...ids].sort());
    // Only js-hello-console is new: its steps and completion, not py-hello-world again.
    expect(summary.exercises).toBe(1);
    expect(summary.xp).toBe(totalXp(next.gamification.awards) - totalXp(deviceA.gamification.awards));
    expect(next.adventure.events[eventId.exercise("py-hello-world")]).toBeDefined();
    const exerciseCrystals = Object.values(next.adventure.events).filter((event) => event.kind === "exercise");
    expect(exerciseCrystals.map((event) => event.id).sort()).toEqual(
      ["js-hello-console", "py-hello-world", "py-multiple-prints"].map(eventId.exercise).sort(),
    );
  });

  it("never deletes existing data", () => {
    const current = {
      ...deviceA,
      drafts: setDraftFile(emptyDrafts, "py-hello-world", "main.py", "print('mine')", "2026-11-05T00:00:00.000Z"),
      schedule: setDeadline(emptySchedule, { type: "course", courseId: "python" }, "2026-12-01", "2026-11-05T00:00:00.000Z"),
    };
    const { next } = planImport(current, roundTrip(deviceB), context);
    for (const id of Object.keys(current.gamification.awards)) expect(next.gamification.awards[id]).toEqual(current.gamification.awards[id]);
    for (const id of Object.keys(current.progress.exercises)) expect(next.progress.exercises[id]?.completedAt).toBe(current.progress.exercises[id].completedAt);
    for (const id of Object.keys(current.adventure.events)) expect(next.adventure.events[id]).toBeDefined();
    expect(next.drafts.exercises["py-hello-world"].files["main.py"]).toBe("print('mine')");
    expect(next.schedule.deadlines["course:python"].dueDate).toBe("2026-12-01");
  });

  it("keeps this browser's drafts, target dates and level choices on a conflict", () => {
    const current: BackupData = {
      ...empty,
      drafts: setDraftFile(emptyDrafts, "py-hello-world", "main.py", "print('mine')", "2026-11-01T00:00:00.000Z"),
      schedule: setDeadline(emptySchedule, { type: "course", courseId: "python" }, "2026-12-01", "2026-11-01T00:00:00.000Z"),
      competency: setUserOverride(emptyCompetency, "python", "beginner", "2026-11-01T00:00:00.000Z"),
    };
    const incoming: BackupData = {
      ...empty,
      drafts: setDraftFile(
        setDraftFile(emptyDrafts, "py-hello-world", "main.py", "print('theirs')", "2026-11-09T00:00:00.000Z"),
        "py-string-length",
        "main.py",
        "print(len('abc'))",
        "2026-11-09T00:00:00.000Z",
      ),
      schedule: setDeadline(
        setDeadline(emptySchedule, { type: "course", courseId: "python" }, "2026-12-24", "2026-11-09T00:00:00.000Z"),
        { type: "course", courseId: "javascript" },
        "2027-01-15",
        "2026-11-09T00:00:00.000Z",
      ),
      competency: setUserOverride(
        setUserOverride(emptyCompetency, "python", "advanced", "2026-11-09T00:00:00.000Z"),
        "javascript",
        "intermediate",
        "2026-11-09T00:00:00.000Z",
      ),
    };
    const { next, summary } = planImport(current, roundTrip(incoming), context);
    expect(next.drafts.exercises["py-hello-world"].files["main.py"]).toBe("print('mine')");
    expect(next.drafts.exercises["py-string-length"].files["main.py"]).toBe("print(len('abc'))");
    expect(next.schedule.deadlines["course:python"].dueDate).toBe("2026-12-01");
    expect(next.schedule.deadlines["course:javascript"].dueDate).toBe("2027-01-15");
    expect(next.competency.tracks.python?.userOverride).toBe("beginner");
    expect(next.competency.tracks.javascript?.userOverride).toBe("intermediate");
    expect(summary).toMatchObject({ drafts: 1, deadlines: 1, levels: 1, keptLocal: 3 });
  });

  it("uses the real XP value and skips entries that don't match current content", () => {
    const tampered = JSON.parse(JSON.stringify(createBackup(deviceA, new Date())));
    tampered.data.gamification.awards["exercise:py-hello-world"].xp = 999;
    tampered.data.gamification.awards["exercise:not-a-lesson"] = {
      id: "exercise:not-a-lesson", kind: "exercise", xp: 50, at: "2026-11-01T00:00:00.000Z", day: "2026-11-01",
    };
    tampered.data.gamification.awards["practice:pr-made-up"] = {
      id: "practice:pr-made-up", kind: "practice", xp: 5, at: "2026-11-01T00:00:00.000Z", day: "2026-11-01",
    };
    tampered.data.practice = { version: 1, activities: { "pr-made-up": { firstPassedAt: "2026-11-01T00:00:00.000Z", lastPassedAt: "2026-11-01T00:00:00.000Z" } } };
    const parsed = parseBackup(JSON.stringify(tampered));
    if (!parsed.ok) throw new Error(parsed.error);
    const { next, summary } = planImport(empty, parsed.data, context);
    expect(next.gamification.awards["exercise:py-hello-world"].xp).toBe(exerciseXp("challenge"));
    expect(next.gamification.awards["exercise:not-a-lesson"]).toBeUndefined();
    expect(next.gamification.awards["practice:pr-made-up"]).toBeUndefined();
    expect(next.practice.activities["pr-made-up"]).toBeUndefined();
    expect(summary.skipped).toBe(3);
    expect(summary.xp).toBe(totalXp(deviceA.gamification.awards));
  });

  it("restores practice results and their XP once", () => {
    const now = new Date("2026-11-03T10:00:00.000Z");
    const practised: BackupData = {
      ...empty,
      practice: recordPracticePass(emptyPractice, "pr-py-average", now.toISOString()),
      gamification: applyPracticePass({ state: empty.gamification, progress: emptyProgress, catalog, activityId: "pr-py-average", now }).state,
    };
    const first = planImport(empty, roundTrip(practised), context);
    expect(first.summary).toMatchObject({ practice: 1, xp: 5 });
    expect(planImport(first.next, roundTrip(practised), context).summary).toMatchObject({ changed: false, xp: 0 });
  });

  it("keeps avatar items owned here when both devices spent the same crystals", () => {
    const crystals = (minute: number, source: string): AdventureEvent => ({
      id: eventId.exercise(source), kind: "exercise", at: `2026-11-01T10:0${minute}:00.000Z`, amount: 5, sourceId: source,
    });
    const earned = Object.fromEntries(
      [crystals(1, "py-hello-world"), crystals(2, "py-multiple-prints"), crystals(3, "variables-and-strings")].map((event) => [event.id, event]),
    );
    const owns = (itemId: "goggles" | "scarf", amount: number, at: string): AdventureState =>
      parseAdventure({
        ...emptyAdventure,
        events: { ...earned, [eventId.purchase(itemId)]: { id: eventId.purchase(itemId), kind: "purchase", at, amount, itemId } },
        equipped: {},
        settingsAt: at,
      })!;
    const here = owns("goggles", -15, "2026-11-05T10:00:00.000Z");
    // The backup spent the same crystals earlier, on a different item.
    const there = owns("scarf", -10, "2026-11-04T10:00:00.000Z");
    expect(crystalBalance(here)).toBe(0);
    expect(crystalBalance(there)).toBe(5);

    const { next, summary } = planImport({ ...empty, adventure: here }, roundTrip({ ...empty, adventure: there }), context);
    expect(next.adventure.events[eventId.purchase("goggles")]).toBeDefined();
    expect(next.adventure.events[eventId.purchase("scarf")]).toBeUndefined();
    expect(summary.rejectedPurchases).toBe(1);
    expect(crystalBalance(next.adventure)).toBeGreaterThanOrEqual(0);
  });
});

describe("progress merge", () => {
  it("unions passed steps and keeps the earliest completion", () => {
    const merged = mergeProgressStates(
      { version: 1, exercises: { a: { completedStepIds: ["s1"], updatedAt: "2026-11-02T00:00:00.000Z", completedAt: "2026-11-02T00:00:00.000Z" } } },
      {
        version: 1,
        exercises: { a: { completedStepIds: ["s2"], updatedAt: "2026-11-03T00:00:00.000Z", completedAt: "2026-11-01T00:00:00.000Z", currentStepId: "s2" } },
        lastVisited: { courseId: "python", exerciseId: "a", at: "2026-11-03T00:00:00.000Z" },
      },
    );
    expect(merged.exercises.a).toEqual({
      completedStepIds: ["s1", "s2"],
      currentStepId: "s2",
      completedAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-03T00:00:00.000Z",
    });
    expect(merged.lastVisited?.exerciseId).toBe("a");
  });
});
