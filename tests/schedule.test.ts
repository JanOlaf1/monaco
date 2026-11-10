import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isValidDateKey, toDateKey } from "@/lib/schedule/dates";
import {
  deadlineStatus,
  emptySchedule,
  groupDeadlines,
  parseSchedule,
  removeDeadline,
  setDeadline,
  targetKey,
  type DeadlineTarget,
} from "@/lib/schedule/deadlines";

const now = "2026-11-10T12:00:00.000Z";
const course: DeadlineTarget = { type: "course", courseId: "python" };
const exercise: DeadlineTarget = { type: "exercise", courseId: "python", exerciseId: "shipping-cost-lab" };

describe("calendar dates", () => {
  it("uses local calendar dates", () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("adds days across month, year and leap-day boundaries", () => {
    expect(addDays("2026-11-10", 7)).toBe("2026-11-17");
    expect(addDays("2026-12-28", 14)).toBe("2027-01-11");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("counts whole days, unaffected by DST changes", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2); // EU DST starts 29 March
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2); // EU DST ends 25 October
    expect(daysBetween("2026-11-10", "2026-11-03")).toBe(-7);
  });

  it("rejects invalid dates", () => {
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2026-13-01")).toBe(false);
    expect(isValidDateKey("tomorrow")).toBe(false);
    expect(isValidDateKey("2026-02-28")).toBe(true);
  });
});

describe("deadlines", () => {
  it("sets, reschedules and removes a deadline", () => {
    let state = setDeadline(emptySchedule, course, "2026-11-17", now);
    expect(state.deadlines[targetKey(course)].dueDate).toBe("2026-11-17");
    const later = "2026-11-11T08:00:00.000Z";
    state = setDeadline(state, course, "2026-11-24", later);
    expect(state.deadlines[targetKey(course)]).toMatchObject({ dueDate: "2026-11-24", createdAt: now, updatedAt: later });
    state = removeDeadline(state, targetKey(course));
    expect(state.deadlines).toEqual({});
  });

  it("refuses invalid due dates", () => {
    expect(() => setDeadline(emptySchedule, course, "2026-02-31", now)).toThrow();
  });

  it("describes status without ever blocking anything", () => {
    expect(deadlineStatus("2026-11-17", "2026-11-10", false)).toEqual({ kind: "upcoming", daysLeft: 7 });
    expect(deadlineStatus("2026-11-10", "2026-11-10", false)).toEqual({ kind: "today" });
    expect(deadlineStatus("2026-11-07", "2026-11-10", false)).toEqual({ kind: "overdue", daysPast: 3 });
    expect(deadlineStatus("2026-11-07", "2026-11-10", true)).toEqual({ kind: "completed" });
  });

  it("groups deadlines for the plan view", () => {
    let state = setDeadline(emptySchedule, course, "2026-11-20", now);
    state = setDeadline(state, exercise, "2026-11-01", now);
    state = setDeadline(state, { type: "exercise", courseId: "javascript", exerciseId: "greeting-functions" }, "2026-11-12", now);
    const groups = groupDeadlines(Object.values(state.deadlines), "2026-11-10", (target) =>
      target.type === "exercise" && target.exerciseId === "greeting-functions",
    );
    expect(groups.upcoming.map((d) => d.key)).toEqual(["course:python"]);
    expect(groups.overdue.map((d) => d.key)).toEqual(["exercise:shipping-cost-lab"]);
    expect(groups.completed.map((d) => d.key)).toEqual(["exercise:greeting-functions"]);
  });

  it("parses stored data defensively", () => {
    expect(parseSchedule(null)).toBeNull();
    expect(parseSchedule({ version: 2, deadlines: {} })).toBeNull();
    const parsed = parseSchedule({
      version: 1,
      deadlines: {
        good: { target: course, dueDate: "2026-11-17", createdAt: now, updatedAt: now },
        badDate: { target: course, dueDate: "17.11.2026" },
        badTarget: { target: { type: "lesson" }, dueDate: "2026-11-17" },
      },
    });
    expect(Object.keys(parsed!.deadlines)).toEqual(["course:python"]);
  });
});
