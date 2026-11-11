import type { GamificationCatalog } from "@/lib/gamification/engine";
import type { XpAward } from "@/lib/gamification/xp";
import type { ProgressState } from "@/lib/progress/progress";
import { COSMETICS, CRYSTAL_REWARDS, cosmeticById, type CosmeticId, type CosmeticSlot } from "./catalog";
import { questPeriod, utcDay, validInstant, type QuestKind } from "./periods";
import { crystalBalance, eventId, type AdventureEvent, type AdventureState, type CrystalAward, type LearningActivity } from "./state";

export { crystalBalance, mergeAdventure, mergeAdventureWithConflicts } from "./state";
export { questPeriod, utcDay } from "./periods";
export { adventureAchievements } from "./achievements";
export { chapterMessage, CHAPTER_MESSAGES } from "./messages";

function append(state: AdventureState, event: AdventureEvent): AdventureState {
  if (Object.hasOwn(state.events, event.id)) return state;
  return { ...state, events: { ...state.events, [event.id]: event } };
}

export function ownedCosmetics(state: AdventureState): CosmeticId[] {
  return COSMETICS.filter((item) => state.events[eventId.purchase(item.id)]?.kind === "purchase").map((item) => item.id);
}

export function purchaseCosmetic(state: AdventureState, id: string, now: Date): {
  state: AdventureState; status: "purchased" | "owned" | "insufficient" | "unknown";
} {
  const item = cosmeticById(id);
  if (!item) return { state, status: "unknown" };
  if (state.events[eventId.purchase(item.id)]) return { state, status: "owned" };
  if (crystalBalance(state) < item.cost) return { state, status: "insufficient" };
  // A changed device clock must not make an affordable purchase precede its
  // funding in the persisted ledger and disappear on the next load.
  const latest = Object.values(state.events).reduce((time, event) => Math.max(time, Date.parse(event.at)), now.getTime());
  return {
    state: append(state, { id: eventId.purchase(item.id), kind: "purchase", at: new Date(latest).toISOString(), itemId: item.id, amount: -item.cost }),
    status: "purchased",
  };
}

export function equipCosmetic(state: AdventureState, id: CosmeticId | null, slot: CosmeticSlot, now: Date): AdventureState {
  if (id !== null) {
    const item = cosmeticById(id);
    if (!item || item.slot !== slot || !ownedCosmetics(state).includes(id)) return state;
  }
  if ((state.equipped[slot] ?? null) === id) return state;
  const equipped = { ...state.equipped };
  if (id === null) delete equipped[slot];
  else equipped[slot] = id;
  return { ...state, equipped, settingsAt: new Date(Math.max(now.getTime(), Date.parse(state.settingsAt) + 1)).toISOString() };
}

export function enrollQuest(state: AdventureState, kind: QuestKind, now: Date): AdventureState {
  const { period } = questPeriod(kind, now);
  return append(state, { id: eventId.quest(kind, period), kind: "quest", at: now.toISOString(), quest: kind, period });
}

export function questProgress(state: AdventureState, kind: QuestKind, now: Date): {
  period: string; start: string; end: string; enrolled: boolean; done: number; target: number; completed: boolean;
} {
  const dates = questPeriod(kind, now);
  const enrollment = state.events[eventId.quest(kind, dates.period)];
  const target = kind === "daily" ? 1 : 3;
  const activities = enrollment?.kind === "quest" ? Object.values(state.events).filter((event): event is LearningActivity =>
    event.kind === "activity" && event.at >= enrollment.at && event.at >= dates.start && event.at < dates.end) : [];
  const done = Math.min(target, new Set(activities.map((event) => event.exerciseId)).size);
  return { ...dates, enrolled: enrollment?.kind === "quest", done, target, completed: Boolean(state.events[eventId[kind](dates.period)]) };
}

function progressConfirms(progress: ProgressState | undefined, exerciseId: string, stepIds: string[]): boolean {
  if (!progress) return true;
  const entry = progress.exercises[exerciseId];
  return Boolean(entry && validInstant(entry.completedAt) && stepIds.length && stepIds.every((step) => entry.completedStepIds.includes(step)));
}

/**
 * Existing XP is immutable evidence, never a second XP balance. Genuine saved
 * first completions and regular chapter awards receive the same crystals as new
 * completions. Historical activity retains its original date and cannot satisfy
 * a quest joined later. Passing progress is checked when supplied by the caller.
 */
export function backfillAdventure(
  state: AdventureState,
  xpAwards: Record<string, XpAward>,
  catalog: GamificationCatalog,
  progress?: ProgressState,
): AdventureState {
  let next = state;
  for (const [key, award] of Object.entries(xpAwards)) {
    if (award.id !== key || !validInstant(award.at)) continue;
    if (award.kind === "exercise") {
      const exerciseId = key.startsWith("exercise:") ? key.slice("exercise:".length) : "";
      const exercise = Object.hasOwn(catalog.exercises, exerciseId) ? catalog.exercises[exerciseId] : undefined;
      if (!exercise || !progressConfirms(progress, exerciseId, exercise.stepIds)) continue;
      const at = progress?.exercises[exerciseId]?.completedAt ?? award.at;
      const day = utcDay(new Date(at));
      next = append(next, { id: eventId.exercise(exerciseId), kind: "exercise", at, amount: CRYSTAL_REWARDS.exercise, sourceId: exerciseId });
      next = append(next, { id: eventId.activity(day, exerciseId), kind: "activity", at, exerciseId, mode: "completion" });
    }
    if (award.kind === "chapter") {
      const chapter = catalog.chapters.find((entry) => key === `chapter:${entry.courseId}:${entry.chapterId}`);
      if (!chapter || !chapter.exerciseIds.length || !chapter.exerciseIds.every((id) => {
        const exercise = catalog.exercises[id];
        return Boolean(exercise && progressConfirms(progress, id, exercise.stepIds));
      })) continue;
      const sourceId = `${chapter.courseId}:${chapter.chapterId}`;
      const at = progress ? chapter.exerciseIds.map((id) => progress.exercises[id].completedAt!).sort().at(-1)! : award.at;
      next = append(next, { id: eventId.chapter(sourceId), kind: "chapter", at, amount: CRYSTAL_REWARDS.chapter, sourceId });
    }
  }
  return next;
}

/**
 * Call ONLY after a real passing check. A review requires rechecking every step
 * within one UTC day, of an exercise first completed on an earlier UTC day.
 * One review earns crystals per UTC day; additional verified work may still
 * advance a joined quest. Repeating a click cannot create another activity.
 */
export function applyAdventurePass(input: {
  state: AdventureState;
  progress: ProgressState;
  catalog: GamificationCatalog;
  xpAwards: Record<string, XpAward>;
  exerciseId: string;
  stepId: string;
  now: Date;
}): AdventureState {
  const { progress, catalog, xpAwards, exerciseId, stepId, now } = input;
  const exercise = Object.hasOwn(catalog.exercises, exerciseId) ? catalog.exercises[exerciseId] : undefined;
  if (!exercise || !exercise.stepIds.includes(stepId)) return input.state;
  let state = backfillAdventure(input.state, xpAwards, catalog, progress);
  const day = utcDay(now);
  const at = now.toISOString();
  const completedAt = progress.exercises[exerciseId]?.completedAt;
  if (validInstant(completedAt) && utcDay(new Date(completedAt)) < day && progressConfirms(progress, exerciseId, exercise.stepIds)) {
    state = append(state, { id: eventId.check(day, exerciseId, stepId), kind: "check", at, exerciseId, stepId });
    const allChecked = exercise.stepIds.every((id) => state.events[eventId.check(day, exerciseId, id)]?.kind === "check");
    if (allChecked) {
      state = append(state, { id: eventId.activity(day, exerciseId), kind: "activity", at, exerciseId, mode: "review" });
      state = append(state, { id: eventId.review(day), kind: "review", at, amount: CRYSTAL_REWARDS.review, sourceId: exerciseId });
    }
  }
  for (const kind of ["daily", "weekly"] as const) {
    const quest = questProgress(state, kind, now);
    if (quest.enrolled && quest.done >= quest.target) {
      state = append(state, { id: eventId[kind](quest.period), kind, at, amount: CRYSTAL_REWARDS[kind], sourceId: quest.period });
    }
  }
  return state;
}

export const crystalAwards = (state: AdventureState): CrystalAward[] =>
  Object.values(state.events).filter((event): event is CrystalAward =>
    event.kind !== "activity" && event.kind !== "check" && event.kind !== "quest" && event.kind !== "purchase");
