import { daysBetween, isValidDateKey } from "./dates";

/**
 * Optional personal target dates. They are motivational planning tools only:
 * nothing in the app locks content, removes progress or penalises the learner
 * when a date passes.
 */

export type DeadlineTarget =
  | { type: "course"; courseId: string }
  | { type: "exercise"; courseId: string; exerciseId: string };

export interface Deadline {
  key: string;
  target: DeadlineTarget;
  /** Local calendar date, YYYY-MM-DD. */
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleState {
  version: 1;
  deadlines: Record<string, Deadline>;
}

export const emptySchedule: ScheduleState = { version: 1, deadlines: {} };

export function targetKey(target: DeadlineTarget): string {
  return target.type === "course" ? `course:${target.courseId}` : `exercise:${target.exerciseId}`;
}

function parseTarget(raw: unknown): DeadlineTarget | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (value.type === "course" && typeof value.courseId === "string") {
    return { type: "course", courseId: value.courseId };
  }
  if (value.type === "exercise" && typeof value.courseId === "string" && typeof value.exerciseId === "string") {
    return { type: "exercise", courseId: value.courseId, exerciseId: value.exerciseId };
  }
  return null;
}

export function parseSchedule(raw: unknown): ScheduleState | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<ScheduleState>;
  if (value.version !== 1 || typeof value.deadlines !== "object" || value.deadlines === null) return null;
  const deadlines: Record<string, Deadline> = {};
  for (const entry of Object.values(value.deadlines)) {
    const target = parseTarget((entry as Deadline | undefined)?.target);
    if (!target || typeof entry.dueDate !== "string" || !isValidDateKey(entry.dueDate)) continue;
    const key = targetKey(target);
    deadlines[key] = {
      key,
      target,
      dueDate: entry.dueDate,
      createdAt: String(entry.createdAt ?? ""),
      updatedAt: String(entry.updatedAt ?? ""),
    };
  }
  return { version: 1, deadlines };
}

export function setDeadline(
  state: ScheduleState,
  target: DeadlineTarget,
  dueDate: string,
  now: string,
): ScheduleState {
  if (!isValidDateKey(dueDate)) throw new Error(`Invalid due date: ${dueDate}`);
  const key = targetKey(target);
  const existing = state.deadlines[key];
  return {
    ...state,
    deadlines: {
      ...state.deadlines,
      [key]: { key, target, dueDate, createdAt: existing?.createdAt ?? now, updatedAt: now },
    },
  };
}

export function removeDeadline(state: ScheduleState, key: string): ScheduleState {
  if (!state.deadlines[key]) return state;
  const deadlines = { ...state.deadlines };
  delete deadlines[key];
  return { ...state, deadlines };
}

export type DeadlineStatus =
  | { kind: "completed" }
  | { kind: "overdue"; daysPast: number }
  | { kind: "today" }
  | { kind: "upcoming"; daysLeft: number };

export function deadlineStatus(dueDate: string, today: string, completed: boolean): DeadlineStatus {
  if (completed) return { kind: "completed" };
  const days = daysBetween(today, dueDate);
  if (days < 0) return { kind: "overdue", daysPast: -days };
  if (days === 0) return { kind: "today" };
  return { kind: "upcoming", daysLeft: days };
}

export interface GroupedDeadlines {
  upcoming: Deadline[];
  overdue: Deadline[];
  completed: Deadline[];
}

/** Group for the plan view. "Due today" counts as upcoming. */
export function groupDeadlines(
  deadlines: Deadline[],
  today: string,
  isCompleted: (target: DeadlineTarget) => boolean,
): GroupedDeadlines {
  const groups: GroupedDeadlines = { upcoming: [], overdue: [], completed: [] };
  for (const deadline of deadlines) {
    const status = deadlineStatus(deadline.dueDate, today, isCompleted(deadline.target));
    if (status.kind === "completed") groups.completed.push(deadline);
    else if (status.kind === "overdue") groups.overdue.push(deadline);
    else groups.upcoming.push(deadline);
  }
  const byDate = (a: Deadline, b: Deadline) => a.dueDate.localeCompare(b.dueDate);
  groups.upcoming.sort(byDate);
  groups.overdue.sort(byDate);
  groups.completed.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  return groups;
}
