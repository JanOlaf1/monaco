import { beforeAll, describe, expect, it } from "vitest";
import { skills } from "@/content/skills";
import { code } from "@/lib/content/md";
import { runJavaScript } from "@/lib/execution/javascript/engine";
import { chunksToEntries } from "@/lib/execution/output";
import { finalizeCheck } from "@/lib/execution/types";
import { locales } from "@/lib/i18n/config";
import { nextItemIndex, passMark, placementOutcome, PLACEMENT_LEVELS, type PlacementAnswer, type PlacementItem } from "@/lib/learning/placement";
import { getPlacement, getPlacements, localizePlacement } from "@/lib/learning/placement-content";
import { isolatedAsyncFunction } from "./helpers/js-realm";
import { loadHarness, type PythonHarness } from "./helpers/pyodide";

let harness: PythonHarness;
beforeAll(async () => {
  harness = await loadHarness();
});

async function jsOutput(source: string): Promise<{ output: string; error?: string }> {
  const { run } = await runJavaScript({ code: source, fileName: "index.js", AsyncFunction: isolatedAsyncFunction(), settleMs: 200 });
  return { output: run.output.map((entry) => entry.text).join("\n"), error: run.error?.name };
}

function pyOutput(source: string): { output: string; error?: string } {
  const report = harness.runProgram(source);
  const lines = chunksToEntries(report.output ?? []).filter((entry) => entry.stream === "stdout");
  return { output: lines.map((entry) => entry.text).join("\n"), error: report.error?.name };
}

const outputOf = (language: "javascript" | "python", source: string) =>
  language === "javascript" ? jsOutput(source) : Promise.resolve(pyOutput(source));

describe("placement content", () => {
  it("has one assessment per runnable course with three items per level", () => {
    expect(getPlacements().map((placement) => placement.courseId).sort()).toEqual(["javascript", "python"]);
    for (const placement of getPlacements()) {
      const ids = placement.items.map((item) => item.id);
      expect(new Set(ids).size, placement.id).toBe(ids.length);
      for (const level of PLACEMENT_LEVELS) {
        const items = placement.items.filter((item) => item.level === level);
        expect(items.map((item) => item.kind).sort(), `${placement.id} ${level}`).toEqual(["code", "debug", "predict"]);
      }
      // Items are ordered beginner → advanced.
      const ranks = placement.items.map((item) => PLACEMENT_LEVELS.indexOf(item.level));
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it("refers only to skills of its own language", () => {
    const tracks = new Map(skills.map((skill) => [skill.id, skill.track]));
    for (const placement of getPlacements()) {
      for (const item of placement.items) {
        expect(item.skills.length, item.id).toBeGreaterThan(0);
        for (const skill of item.skills) expect(tracks.get(skill), `${item.id}: ${skill}`).toBe(placement.language);
      }
    }
  });

  it("has well-formed choices with exactly one answer", () => {
    for (const placement of getPlacements()) {
      for (const item of placement.items) {
        if (item.kind === "code") {
          expect(item.tests.length, item.id).toBeGreaterThanOrEqual(2);
          continue;
        }
        const optionIds = item.options.map((option) => option.id);
        expect(new Set(optionIds).size, item.id).toBe(optionIds.length);
        expect(optionIds, item.id).toContain(item.answer);
        expect(item.options.length, item.id).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("is translated into every locale", () => {
    for (const placement of getPlacements()) {
      for (const locale of locales) {
        const localized = localizePlacement(placement, locale);
        for (const item of localized.items) {
          expect(item.prompt.trim().length, `${item.id}.prompt.${locale}`).toBeGreaterThan(0);
          expect(item.explanation.trim().length, `${item.id}.explanation.${locale}`).toBeGreaterThan(0);
          if (item.kind === "debug") for (const option of item.options) expect(option.label.trim().length).toBeGreaterThan(0);
        }
      }
      expect(JSON.parse(JSON.stringify(localizePlacement(placement, "fi"))).items).toHaveLength(placement.items.length);
    }
  });
});

describe("placement answers are verified by running the code", () => {
  for (const placement of getPlacements()) {
    for (const item of placement.items) {
      if (item.kind === "predict") {
        it(`${item.id}: the correct option is the real output`, async () => {
          const { output, error } = await outputOf(placement.language, item.code);
          expect(error).toBeUndefined();
          for (const option of item.options) {
            expect(option.output === output, `${item.id} option ${option.id}`).toBe(option.id === item.answer);
          }
        });
      }
      if (item.kind === "debug") {
        it(`${item.id}: only the correct fix produces the expected output`, async () => {
          const buggy = await outputOf(placement.language, item.code);
          expect(buggy.output === item.expectedOutput && !buggy.error, "the original code must be buggy").toBe(false);
          for (const option of item.options) {
            const fixed = await outputOf(placement.language, option.fixed);
            const works = fixed.output === item.expectedOutput && !fixed.error;
            expect(works, `${item.id} option ${option.id}`).toBe(option.id === item.answer);
          }
        });
      }
    }
  }
});

interface CodeCase {
  itemId: string;
  name: string;
  source: string;
  failing: string[];
}

const codeCases: CodeCase[] = [
  // JavaScript
  { itemId: "js-b-code", name: "comparisons", source: 'function isWeekend(day) {\n  return day === "Saturday" || day === "Sunday";\n}\n', failing: [] },
  { itemId: "js-b-code", name: "includes", source: 'const isWeekend = (day) => ["Saturday", "Sunday"].includes(day);\n', failing: [] },
  { itemId: "js-b-code", name: "only Saturday", source: 'function isWeekend(day) {\n  return day === "Saturday";\n}\n', failing: ["weekend"] },
  { itemId: "js-b-code", name: "always true", source: "function isWeekend(day) {\n  return true;\n}\n", failing: ["weekday"] },
  {
    itemId: "js-i-code",
    name: "loop",
    source: code`
      function averageScore(students) {
        if (students.length === 0) return 0;
        let sum = 0;
        for (const student of students) sum += student.score;
        return Math.round((sum / students.length) * 10) / 10;
      }
    `,
    failing: [],
  },
  {
    itemId: "js-i-code",
    name: "reduce",
    source: code`
      const averageScore = (students) =>
        students.length ? Number((students.reduce((sum, s) => sum + s.score, 0) / students.length).toFixed(1)) : 0;
    `,
    failing: [],
  },
  {
    itemId: "js-i-code",
    name: "no empty guard",
    source: code`
      function averageScore(students) {
        let sum = 0;
        for (const student of students) sum += student.score;
        return Math.round((sum / students.length) * 10) / 10;
      }
    `,
    failing: ["empty"],
  },
  {
    itemId: "js-i-code",
    name: "no rounding",
    source: code`
      function averageScore(students) {
        if (!students.length) return 0;
        let sum = 0;
        for (const student of students) sum += student.score;
        return sum / students.length;
      }
    `,
    failing: ["rounding"],
  },
  {
    itemId: "js-a-code",
    name: "reduce and sort",
    source: code`
      function topTags(posts, n) {
        const counts = posts.flatMap((post) => post.tags).reduce((acc, tag) => {
          acc[tag] = (acc[tag] ?? 0) + 1;
          return acc;
        }, {});
        return Object.keys(counts)
          .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
          .slice(0, n);
      }
    `,
    failing: [],
  },
  {
    itemId: "js-a-code",
    name: "Map",
    source: code`
      function topTags(posts, n) {
        const counts = new Map();
        for (const post of posts) {
          for (const tag of post.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
        }
        const tags = [...counts.entries()];
        tags.sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0] < b[0] ? -1 : 1));
        return tags.slice(0, n).map((entry) => entry[0]);
      }
    `,
    failing: [],
  },
  {
    itemId: "js-a-code",
    name: "no tie-breaker",
    source: code`
      function topTags(posts, n) {
        const counts = {};
        for (const post of posts) for (const tag of post.tags) counts[tag] = (counts[tag] ?? 0) + 1;
        return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, n);
      }
    `,
    failing: ["ties"],
  },
  {
    itemId: "js-a-code",
    name: "least used first",
    source: code`
      function topTags(posts, n) {
        const counts = {};
        for (const post of posts) for (const tag of post.tags) counts[tag] = (counts[tag] ?? 0) + 1;
        return Object.keys(counts).sort((a, b) => counts[a] - counts[b] || a.localeCompare(b)).slice(0, n);
      }
    `,
    failing: ["counts"],
  },

  // Python
  {
    itemId: "py-b-code",
    name: "if/elif/else",
    source: code`
      def water_state(celsius):
          if celsius <= 0:
              return "ice"
          elif celsius >= 100:
              return "steam"
          else:
              return "water"
    `,
    failing: [],
  },
  {
    itemId: "py-b-code",
    name: "conditional expression",
    source: 'def water_state(celsius):\n    return "ice" if celsius <= 0 else "steam" if celsius >= 100 else "water"\n',
    failing: [],
  },
  {
    itemId: "py-b-code",
    name: "0 is not ice",
    source: 'def water_state(celsius):\n    if celsius < 0:\n        return "ice"\n    if celsius >= 100:\n        return "steam"\n    return "water"\n',
    failing: ["ice"],
  },
  {
    itemId: "py-b-code",
    name: "100 is not steam",
    source: 'def water_state(celsius):\n    if celsius <= 0:\n        return "ice"\n    if celsius > 100:\n        return "steam"\n    return "water"\n',
    failing: ["steam"],
  },
  {
    itemId: "py-i-code",
    name: "min over sorted names",
    source: "def cheapest(prices):\n    if not prices:\n        return None\n    return min(sorted(prices), key=lambda name: prices[name])\n",
    failing: [],
  },
  {
    itemId: "py-i-code",
    name: "loop",
    source: code`
      def cheapest(prices):
          best = None
          for name, price in prices.items():
              if best is None or price < prices[best] or (price == prices[best] and name < best):
                  best = name
          return best
    `,
    failing: [],
  },
  {
    itemId: "py-i-code",
    name: "ignores ties",
    source: "def cheapest(prices):\n    if not prices:\n        return None\n    return min(prices, key=prices.get)\n",
    failing: ["tie"],
  },
  {
    itemId: "py-i-code",
    name: "crashes when empty",
    source: "def cheapest(prices):\n    return min(sorted(prices), key=lambda name: prices[name])\n",
    failing: ["empty"],
  },
  {
    itemId: "py-a-code",
    name: "set comprehension",
    source: 'def normalize_emails(emails):\n    return sorted({e.strip().lower() for e in emails if "@" in e})\n',
    failing: [],
  },
  {
    itemId: "py-a-code",
    name: "loop",
    source: code`
      def normalize_emails(emails):
          result = []
          for email in emails:
              cleaned = email.strip().lower()
              if "@" in cleaned and cleaned not in result:
                  result.append(cleaned)
          return sorted(result)
    `,
    failing: [],
  },
  {
    itemId: "py-a-code",
    name: "keeps duplicates",
    source: 'def normalize_emails(emails):\n    return sorted([e.strip().lower() for e in emails if "@" in e])\n',
    failing: ["cleans"],
  },
  {
    itemId: "py-a-code",
    name: "keeps invalid entries",
    source: "def normalize_emails(emails):\n    return sorted({e.strip().lower() for e in emails})\n",
    failing: ["skips-invalid"],
  },
];

function findCodeItem(itemId: string) {
  for (const placement of getPlacements()) {
    const item = placement.items.find((candidate) => candidate.id === itemId);
    if (item?.kind === "code") return { placement, item };
  }
  throw new Error(`Unknown coding item ${itemId}`);
}

async function checkCode(itemId: string, source: string) {
  const { placement, item } = findCodeItem(itemId);
  const tests = item.tests.map((test) => ({ id: test.id, code: test.code }));
  if (placement.language === "javascript") {
    const { run, tests: results = [] } = await runJavaScript({
      code: source,
      fileName: "index.js",
      tests,
      AsyncFunction: isolatedAsyncFunction(),
      settleMs: 200,
    });
    return finalizeCheck(run, results, run.durationMs);
  }
  const report = harness.runTests(source, tests);
  return { passed: report.tests.every((test) => test.status === "pass") && !report.run.error, tests: report.tests };
}

describe("placement coding items", () => {
  for (const testCase of codeCases) {
    it(`${testCase.itemId}: ${testCase.name}`, async () => {
      const result = await checkCode(testCase.itemId, testCase.source);
      expect(result.tests.filter((test) => test.status !== "pass").map((test) => test.id)).toEqual(testCase.failing);
      expect(result.tests.some((test) => test.status === "error")).toBe(false);
    });
  }

  it("has valid and invalid solutions for every coding item, and the starter fails", async () => {
    for (const placement of getPlacements()) {
      for (const item of placement.items) {
        if (item.kind !== "code") continue;
        const cases = codeCases.filter((candidate) => candidate.itemId === item.id);
        expect(cases.some((candidate) => candidate.failing.length === 0), `${item.id} valid`).toBe(true);
        expect(cases.some((candidate) => candidate.failing.length > 0), `${item.id} invalid`).toBe(true);
        expect((await checkCode(item.id, item.starter)).passed, `${item.id} starter`).toBe(false);
      }
    }
  });
});

describe("placement scoring", () => {
  const items: Pick<PlacementItem, "id" | "level" | "skills">[] = [
    { id: "b1", level: "beginner", skills: ["s.a"] },
    { id: "b2", level: "beginner", skills: ["s.a"] },
    { id: "b3", level: "beginner", skills: ["s.b"] },
    { id: "i1", level: "intermediate", skills: ["s.b"] },
    { id: "i2", level: "intermediate", skills: ["s.c"] },
    { id: "i3", level: "intermediate", skills: ["s.c"] },
    { id: "a1", level: "advanced", skills: ["s.d"] },
    { id: "a2", level: "advanced", skills: ["s.d"] },
    { id: "a3", level: "advanced", skills: ["s.d"] },
  ];
  const answer = (itemId: string, correct: boolean, skipped = false): PlacementAnswer => ({ itemId, correct, skipped });

  it("needs two of three to pass a level", () => {
    expect(passMark(3)).toBe(2);
  });

  it("walks through the items in order", () => {
    expect(nextItemIndex(items, [])).toBe(0);
    expect(nextItemIndex(items, [answer("b1", true)])).toBe(1);
    expect(nextItemIndex(items, [answer("b1", true), answer("b2", true), answer("b3", false)])).toBe(3);
  });

  it("stops early after a failed level and recommends that level", () => {
    const answers = [answer("b1", true), answer("b2", false), answer("b3", false, true)];
    expect(nextItemIndex(items, answers)).toBeNull();
    const outcome = placementOutcome(items, answers);
    expect(outcome.level).toBe("beginner");
    expect(outcome.stoppedEarly).toBe(true);
    expect(outcome.answered).toBe(3);
  });

  it("recommends intermediate after passing only the beginner level", () => {
    const answers = [
      ...["b1", "b2", "b3"].map((id) => answer(id, true)),
      answer("i1", true),
      answer("i2", false),
      answer("i3", false),
    ];
    expect(nextItemIndex(items, answers)).toBeNull();
    const outcome = placementOutcome(items, answers);
    expect(outcome.level).toBe("intermediate");
    expect(outcome.skills).toEqual({ "s.a": { correct: 2, total: 2 }, "s.b": { correct: 2, total: 2 }, "s.c": { correct: 0, total: 2 } });
  });

  it("recommends advanced (never professional) after passing intermediate", () => {
    const all = items.map((item) => answer(item.id, true));
    expect(nextItemIndex(items, all)).toBeNull();
    const outcome = placementOutcome(items, all);
    expect(outcome.level).toBe("advanced");
    expect(outcome.stoppedEarly).toBe(false);
    expect(outcome.correct).toBe(9);
  });

  it("counts skipped items as not correct", () => {
    const answers = ["b1", "b2", "b3"].map((id) => answer(id, false, true));
    expect(placementOutcome(items, answers).level).toBe("beginner");
  });

  it("looks up assessments by course", () => {
    expect(getPlacement("python")?.id).toBe("placement-python");
    expect(getPlacement("typescript")).toBeUndefined();
  });
});
