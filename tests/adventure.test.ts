import { describe, expect, it } from "vitest";
import { COSMETICS, CRYSTAL_REWARDS } from "@/lib/adventure/catalog";
import {
  adventureAchievements, applyAdventurePass, backfillAdventure, chapterMessage, CHAPTER_MESSAGES,
  crystalBalance, enrollQuest, equipCosmetic, mergeAdventure, mergeAdventureWithConflicts,
  ownedCosmetics, purchaseCosmetic, questPeriod, questProgress,
} from "@/lib/adventure/engine";
import { emptyAdventure, eventId, parseAdventure, type AdventureState } from "@/lib/adventure/state";
import { applyStepPass, type GamificationCatalog } from "@/lib/gamification/engine";
import { emptyGamification, type GamificationState } from "@/lib/gamification/state";
import { emptyProgress, recordStepPassed, type ProgressState } from "@/lib/progress/progress";

const at = (value: string) => new Date(`${value.length === 10 ? `${value}T12:00:00.000` : value}Z`);
const catalog: GamificationCatalog = {
  exercises: {
    a: { courseId: "javascript", chapterId: "c1", type: "challenge", stepIds: ["task"] },
    b: { courseId: "javascript", chapterId: "c1", type: "lab", stepIds: ["task"] },
    c: { courseId: "python", chapterId: "c2", type: "checkpoint", stepIds: ["task"] },
    multi: { courseId: "python", chapterId: "c3", type: "challenge", stepIds: ["one", "two"] },
  },
  chapters: [{ courseId: "javascript", chapterId: "c1", language: "javascript", exerciseIds: ["a", "b"] }],
};
interface Learner { adventure: AdventureState; progress: ProgressState; xp: GamificationState }
const learner = (): Learner => ({ adventure: emptyAdventure, progress: emptyProgress, xp: emptyGamification });
function pass(before: Learner, exerciseId: string, now: Date, stepId = "task"): Learner {
  const progress = recordStepPassed(before.progress, exerciseId, stepId, catalog.exercises[exerciseId].stepIds, now.toISOString());
  const xp = applyStepPass({ state: before.xp, progress, catalog, exerciseId, stepId, now }).state;
  return { progress, xp, adventure: applyAdventurePass({ state: before.adventure, progress, catalog, xpAwards: xp.awards, exerciseId, stepId, now }) };
}

describe("crystals remain separate from XP", () => {
  it("only rewards genuine first completion and a regular chapter, once", () => {
    let state = learner();
    state = pass(state, "a", at("2026-11-10"));
    expect(crystalBalance(state.adventure)).toBe(5);
    const xp = JSON.stringify(state.xp);
    state = pass(state, "a", at("2026-11-10T13:00:00.000"));
    expect(crystalBalance(state.adventure)).toBe(5);
    expect(JSON.stringify(state.xp)).toBe(xp);
    state = pass(state, "b", at("2026-11-10T14:00:00.000"));
    expect(crystalBalance(state.adventure)).toBe(30);
    expect(state.adventure.events["crystal:chapter:javascript:c1"]).toMatchObject({ amount: 20 });
    expect(backfillAdventure(state.adventure, state.xp.awards, catalog, state.progress)).toBe(state.adventure);
  });

  it("does not reward partial checks, app opening, or unknown exercise ids", () => {
    expect(crystalBalance(backfillAdventure(emptyAdventure, {}, catalog, emptyProgress))).toBe(0);
    const state = pass(learner(), "multi", at("2026-11-10"), "one");
    expect(crystalBalance(state.adventure)).toBe(0);
    expect(applyAdventurePass({ state: emptyAdventure, progress: emptyProgress, catalog, xpAwards: {}, exerciseId: "constructor", stepId: "task", now: at("2026-11-10") })).toBe(emptyAdventure);
  });

  it("preserves all existing learner data and deterministically backfills saved completions", () => {
    let saved = pass(learner(), "a", at("2026-10-01"));
    saved = pass(saved, "b", at("2026-10-02"));
    const before = JSON.stringify({ xp: saved.xp, progress: saved.progress });
    const migrated = backfillAdventure(emptyAdventure, saved.xp.awards, catalog, saved.progress);
    expect(crystalBalance(migrated)).toBe(30);
    expect(migrated.events["crystal:exercise:a"].at).toBe("2026-10-01T12:00:00.000Z");
    expect(JSON.stringify({ xp: saved.xp, progress: saved.progress })).toBe(before);
    expect(parseAdventure(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
  });

  it("rejects XP unsupported by passing progress", () => {
    const completed = pass(learner(), "a", at("2026-11-10"));
    expect(crystalBalance(backfillAdventure(emptyAdventure, completed.xp.awards, catalog, emptyProgress))).toBe(0);
    expect(crystalBalance(backfillAdventure(emptyAdventure, completed.xp.awards, catalog, {
      version: 1, exercises: { a: { completedAt: "2026-11-10T12:00:00.000Z", completedStepIds: [], updatedAt: "2026-11-10T12:00:00.000Z" } },
    }))).toBe(0);
  });

  it("ignores an invented chapter and a malformed completion timestamp", () => {
    const completed = pass(learner(), "a", at("2026-11-10"));
    const awards = { ...completed.xp.awards, "chapter:javascript:invented": { id: "chapter:javascript:invented", kind: "chapter" as const, xp: 50, at: "2026-11-10T12:00:00.000Z", day: "2026-11-10" } };
    expect(crystalBalance(backfillAdventure(emptyAdventure, awards, catalog, completed.progress))).toBe(5);
    const progress = { ...completed.progress, exercises: { a: { ...completed.progress.exercises.a, completedAt: "bad" } } };
    expect(crystalBalance(backfillAdventure(emptyAdventure, awards, catalog, progress))).toBe(0);
  });
});

describe("optional UTC quests and verified reviews", () => {
  it("requires opt-in before the learning activity", () => {
    let state = pass(learner(), "a", at("2026-11-10T10:00:00.000"));
    expect(questProgress(state.adventure, "daily", at("2026-11-10"))).toMatchObject({ enrolled: false, done: 0 });
    state.adventure = enrollQuest(state.adventure, "daily", at("2026-11-10T11:00:00.000"));
    state = pass(state, "a", at("2026-11-10"));
    expect(questProgress(state.adventure, "daily", at("2026-11-10"))).toMatchObject({ done: 0, completed: false });
    state = pass(state, "b", at("2026-11-10T13:00:00.000"));
    expect(questProgress(state.adventure, "daily", at("2026-11-10"))).toMatchObject({ done: 1, completed: true });
    expect(crystalBalance(state.adventure)).toBe(33);
  });

  it("counts new activity even when the background migration ran first", () => {
    const state = learner();
    state.adventure = enrollQuest(state.adventure, "daily", at("2026-11-10T09:00:00.000"));
    const complete = pass(state, "a", at("2026-11-10"));
    const migrated = backfillAdventure(state.adventure, complete.xp.awards, catalog, complete.progress);
    const next = applyAdventurePass({ state: migrated, progress: complete.progress, catalog, xpAwards: complete.xp.awards, exerciseId: "a", stepId: "task", now: at("2026-11-10") });
    expect(crystalBalance(next)).toBe(8);
    expect(questProgress(next, "daily", at("2026-11-10")).completed).toBe(true);
  });

  it("requires every step of an older exercise to pass again before rewarding review", () => {
    let state = pass(learner(), "multi", at("2026-11-09"), "one");
    state = pass(state, "multi", at("2026-11-09"), "two");
    state.adventure = enrollQuest(state.adventure, "daily", at("2026-11-10T10:00:00.000"));
    state = pass(state, "multi", at("2026-11-10T11:00:00.000"), "one");
    expect(crystalBalance(state.adventure)).toBe(5);
    expect(questProgress(state.adventure, "daily", at("2026-11-10")).done).toBe(0);
    state = pass(state, "multi", at("2026-11-10"), "two");
    expect(crystalBalance(state.adventure)).toBe(10);
    expect(questProgress(state.adventure, "daily", at("2026-11-10")).completed).toBe(true);
    state = pass(state, "multi", at("2026-11-10T13:00:00.000"), "two");
    expect(crystalBalance(state.adventure)).toBe(10);
  });

  it("does not combine review steps from different UTC days", () => {
    let state = pass(learner(), "multi", at("2026-11-08"), "one");
    state = pass(state, "multi", at("2026-11-08"), "two");
    state = pass(state, "multi", at("2026-11-09"), "one");
    state = pass(state, "multi", at("2026-11-10"), "two");
    expect(crystalBalance(state.adventure)).toBe(5);
  });

  it("caps review crystal rewards at one exercise per UTC day", () => {
    let state = pass(learner(), "a", at("2026-11-08"));
    state = pass(state, "b", at("2026-11-08"));
    state = pass(state, "a", at("2026-11-10"));
    state = pass(state, "b", at("2026-11-10T13:00:00.000"));
    expect(crystalBalance(state.adventure)).toBe(32);
    expect(Object.values(state.adventure.events).filter((event) => event.kind === "review")).toHaveLength(1);
  });

  it("requires three distinct exercises for a weekly quest and never rewards it twice", () => {
    let state = learner();
    state.adventure = enrollQuest(state.adventure, "weekly", at("2026-11-09T10:00:00.000"));
    state = pass(state, "a", at("2026-11-09"));
    state = pass(state, "a", at("2026-11-10"));
    expect(questProgress(state.adventure, "weekly", at("2026-11-10")).done).toBe(1);
    state = pass(state, "b", at("2026-11-10T13:00:00.000"));
    state = pass(state, "c", at("2026-11-10T14:00:00.000"));
    expect(questProgress(state.adventure, "weekly", at("2026-11-10"))).toMatchObject({ done: 3, target: 3, completed: true });
    const amount = crystalBalance(state.adventure);
    state = pass(state, "c", at("2026-11-10T15:00:00.000"));
    expect(crystalBalance(state.adventure)).toBe(amount);
  });

  it("uses fixed UTC daily and Monday weekly boundaries regardless of supplied offset", () => {
    expect(questPeriod("daily", new Date("2026-11-11T01:00:00+02:00"))).toEqual(questPeriod("daily", new Date("2026-11-10T15:00:00-08:00")));
    expect(questPeriod("weekly", at("2026-11-15"))).toEqual({ period: "2026-11-09", start: "2026-11-09T00:00:00.000Z", end: "2026-11-16T00:00:00.000Z" });
    expect(questPeriod("weekly", at("2026-11-16")).period).toBe("2026-11-16");
    expect(questPeriod("daily", new Date("2026-03-29T01:30:00+02:00")).period).toBe("2026-03-28");
    expect(questPeriod("daily", new Date("2026-03-29T04:30:00+03:00")).period).toBe("2026-03-29");
  });

  it("requires a fresh opt-in at midnight and never transfers an old quest", () => {
    let state = learner();
    state.adventure = enrollQuest(state.adventure, "daily", at("2026-11-10T23:59:59.000"));
    state = pass(state, "a", at("2026-11-11T00:00:01.000"));
    expect(questProgress(state.adventure, "daily", at("2026-11-11"))).toMatchObject({ enrolled: false, done: 0 });
    expect(crystalBalance(state.adventure)).toBe(5);
  });
});

describe("fixed-price cosmetic inventory", () => {
  function funded() { return pass(pass(learner(), "a", at("2026-11-10")), "b", at("2026-11-10T13:00:00.000")).adventure; }

  it("unlocks, equips and removes only owned items; preview has no domain side effects", () => {
    const original = funded();
    expect(equipCosmetic(original, "hat", "head", at("2026-11-11"))).toBe(original);
    const bought = purchaseCosmetic(original, "goggles", at("2026-11-11"));
    expect(bought.status).toBe("purchased");
    expect(ownedCosmetics(bought.state)).toEqual(["goggles"]);
    expect(crystalBalance(bought.state)).toBe(15);
    expect(bought.state.equipped).toEqual({});
    expect(equipCosmetic(bought.state, "goggles", "head", at("2026-11-11"))).toBe(bought.state);
    const equipped = equipCosmetic(bought.state, "goggles", "eyes", at("2026-11-11"));
    expect(equipped.equipped).toEqual({ eyes: "goggles" });
    const removed = equipCosmetic(equipped, null, "eyes", at("2026-11-11T13:00:00.000"));
    expect(removed.equipped).toEqual({});
    expect(ownedCosmetics(removed)).toEqual(["goggles"]);
    expect(crystalBalance(original)).toBe(30);
  });

  it("never charges twice, accepts a zero final balance, and rejects insufficient funds", () => {
    const bought = purchaseCosmetic(funded(), "hat", at("2026-11-11"));
    expect(crystalBalance(bought.state)).toBe(0);
    expect(purchaseCosmetic(bought.state, "hat", at("2026-11-11T13:00:00.000"))).toEqual({ state: bought.state, status: "owned" });
    expect(purchaseCosmetic(bought.state, "scarf", at("2026-11-11"))).toEqual({ state: bought.state, status: "insufficient" });
    expect(purchaseCosmetic(bought.state, "__proto__", at("2026-11-11"))).toEqual({ state: bought.state, status: "unknown" });
  });

  it("retains inventory and equipped cosmetics across a serialized reload", () => {
    const bought = purchaseCosmetic(funded(), "scarf", at("2026-11-11"));
    const equipped = equipCosmetic(bought.state, "scarf", "neck", at("2026-11-11"));
    expect(parseAdventure(JSON.parse(JSON.stringify(equipped)))).toEqual(equipped);
  });

  it("retains an affordable purchase when the device clock moves backwards", () => {
    const bought = purchaseCosmetic(funded(), "hat", at("2026-11-01"));
    expect(bought.status).toBe("purchased");
    expect(ownedCosmetics(parseAdventure(JSON.parse(JSON.stringify(bought.state)))!)).toEqual(["hat"]);
    const futureSettings = { ...bought.state, settingsAt: "2027-01-01T12:00:00.000Z" };
    const equipped = equipCosmetic(futureSettings, "hat", "head", at("2026-11-11"));
    expect(mergeAdventure(futureSettings, equipped).equipped).toEqual({ head: "hat" });
  });

  it("keeps all cosmetics independent of skill or lesson locks", () => {
    expect(COSMETICS.map((item) => [item.id, item.slot, item.cost])).toEqual([
      ["goggles", "eyes", 15], ["scarf", "neck", 10], ["backpack", "back", 25], ["hat", "head", 30],
    ]);
    expect(COSMETICS.every((item) => item.title.en && item.title.fi && item.description.en && item.description.fi)).toBe(true);
  });
});

describe("validated ledger and future cloud merge contract", () => {
  const funded = () => pass(pass(learner(), "a", at("2026-11-10")), "b", at("2026-11-10T13:00:00.000")).adventure;

  it("rejects unknown schema versions, malformed dates and inconsistent amounts", () => {
    expect(parseAdventure({ version: 99, events: {} })).toBeNull();
    expect(parseAdventure({ version: 1, events: [] })).toBeNull();
    const state = funded();
    const bad = {
      ...state, events: {
        ...state.events,
        "crystal:exercise:fake": { id: "crystal:exercise:fake", kind: "exercise", sourceId: "fake", amount: 1_000_000, at: "2026-11-10T12:00:00.000Z" },
        "crystal:exercise:date": { id: "crystal:exercise:date", kind: "exercise", sourceId: "date", amount: 5, at: "2026-02-30T12:00:00.000Z" },
      },
    };
    expect(crystalBalance(parseAdventure(bad)!)).toBe(30);
    expect(parseAdventure(bad)!.events["crystal:exercise:fake"]).toBeUndefined();
  });

  it("does not accept an unfunded purchase, a changed price, or unowned equipment", () => {
    expect(parseAdventure({ ...emptyAdventure, equipped: { head: "hat" }, events: {
      "purchase:hat": { id: "purchase:hat", kind: "purchase", at: "2026-11-10T12:00:00.000Z", amount: -30, itemId: "hat" },
    } })).toEqual(emptyAdventure);
    const state = funded();
    const parsed = parseAdventure({ ...state, equipped: { head: "hat" }, events: {
      ...state.events, "purchase:hat": { id: "purchase:hat", kind: "purchase", at: "2026-11-11T12:00:00.000Z", amount: -1, itemId: "hat" },
    } })!;
    expect(crystalBalance(parsed)).toBe(30);
    expect(parsed.equipped).toEqual({});
  });

  it("drops orphaned quest and review rewards with no matching learning evidence", () => {
    const parsed = parseAdventure({ ...emptyAdventure, events: {
      "crystal:daily:2026-11-10": { id: "crystal:daily:2026-11-10", kind: "daily", sourceId: "2026-11-10", amount: 3, at: "2026-11-10T12:00:00.000Z" },
      "crystal:review:2026-11-10": { id: "crystal:review:2026-11-10", kind: "review", sourceId: "a", amount: 2, at: "2026-11-10T12:00:00.000Z" },
      "activity:2026-11-10:a": { id: "activity:2026-11-10:a", kind: "activity", exerciseId: "a", mode: "completion", at: "2026-11-10T12:00:00.000Z" },
    } });
    expect(parsed).toEqual(emptyAdventure);
  });

  it("deduplicates rewards and purchases on repeated merges and resolves timestamp conflicts consistently", () => {
    const base = funded();
    const bought = purchaseCosmetic(base, "scarf", at("2026-11-11"));
    expect(mergeAdventure(bought.state, bought.state)).toEqual(bought.state);
    expect(mergeAdventure(base, bought.state)).toEqual(mergeAdventure(bought.state, base));
    expect(crystalBalance(mergeAdventure(base, bought.state))).toBe(20);
    const changed = { ...base, events: { ...base.events, [eventId.exercise("a")]: { ...base.events[eventId.exercise("a")], at: "2026-11-11T12:00:00.000Z" } } };
    expect(mergeAdventure(base, changed).events[eventId.exercise("a")].at).toBe("2026-11-10T12:00:00.000Z");
  });

  it("returns explicit concurrent spending conflicts while never producing a negative balance", () => {
    const base = funded();
    const first = purchaseCosmetic(base, "backpack", at("2026-11-11"));
    const second = purchaseCosmetic(base, "hat", at("2026-11-11T13:00:00.000"));
    const merged = mergeAdventureWithConflicts(first.state, second.state);
    expect(crystalBalance(merged.state)).toBe(5);
    expect(ownedCosmetics(merged.state)).toEqual(["backpack"]);
    expect(merged.rejectedPurchases).toEqual(["purchase:hat"]);
    expect(mergeAdventureWithConflicts(second.state, first.state)).toEqual(merged);
  });

  it("uses deterministic last-written settings and cannot equip an item lost to a spend conflict", () => {
    const base = funded();
    const a = equipCosmetic(purchaseCosmetic(base, "backpack", at("2026-11-11")).state, "backpack", "back", at("2026-11-11"));
    const b = equipCosmetic(purchaseCosmetic(base, "hat", at("2026-11-11T13:00:00.000")).state, "hat", "head", at("2026-11-11T14:00:00.000"));
    const merged = mergeAdventure(a, b);
    expect(merged.equipped).toEqual({});
    expect(merged.settingsAt).toBe("2026-11-11T14:00:00.000Z");
    expect(mergeAdventure(a, b)).toEqual(mergeAdventure(b, a));
  });
});

describe("original achievements and chapter messages", () => {
  it("derives additional meaningful achievements from real ledger events", () => {
    let state = pass(learner(), "a", at("2026-11-09"));
    state.adventure = enrollQuest(state.adventure, "daily", at("2026-11-10T10:00:00.000"));
    state = pass(state, "a", at("2026-11-10"));
    const badges = adventureAchievements(state.adventure);
    expect(badges).toHaveLength(6);
    expect(badges.filter((badge) => badge.earned).map((badge) => badge.id)).toEqual(["first-review", "daily-explorer"]);
    expect(badges.every((badge) => badge.title.en && badge.title.fi && badge.description.en && badge.description.fi)).toBe(true);
    expect(adventureAchievements(parseAdventure(JSON.parse(JSON.stringify(state.adventure)))!)).toEqual(badges);
  });

  it("selects stable bilingual, original-authored messages without fabricated attribution", () => {
    expect(chapterMessage("javascript", "c1")).toEqual(chapterMessage("javascript", "c1"));
    expect(CHAPTER_MESSAGES).toHaveLength(4);
    expect(CHAPTER_MESSAGES.every((entry) => entry.authorship === "Koodaamo original" && entry.version === 1 && entry.text.en && entry.text.fi)).toBe(true);
    expect(CRYSTAL_REWARDS).toEqual({ exercise: 5, chapter: 20, daily: 3, weekly: 10, review: 2 });
  });
});
