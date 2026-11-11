import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { coverageMatrix } from "@/lib/content/coverage";

const doc = readFileSync("docs/CONTENT_COVERAGE.md", "utf8");
const names = { python: "Python", javascript: "JavaScript", typescript: "TypeScript", react: "React" } as const;

/** Numbers of the first table row in the document that starts with `| <label> |`. */
function documentedRow(label: string): number[] {
  const line = doc.split("\n").find((candidate) => candidate.startsWith(`| ${label} |`));
  if (!line) throw new Error(`docs/CONTENT_COVERAGE.md has no row for ${label}`);
  return line
    .split("|")
    .slice(2, -1)
    .map((cell) => Number(cell.trim()));
}

describe("content coverage matrix", () => {
  it("matches the registry (update docs/CONTENT_COVERAGE.md when content changes)", () => {
    for (const row of coverageMatrix()) {
      const { beginner, intermediate, advanced, professional } = row.byLevel;
      expect(documentedRow(names[row.track]), row.track).toEqual([beginner, intermediate, advanced, professional, row.total]);
    }
  });

  it("covers the placement levels for every runnable track", () => {
    for (const row of coverageMatrix().filter((candidate) => candidate.total > 0)) {
      expect(row.byLevel.beginner, row.track).toBeGreaterThan(0);
      expect(row.byLevel.intermediate, row.track).toBeGreaterThan(0);
      expect(row.byLevel.advanced, row.track).toBeGreaterThan(0);
      expect(row.byType.checkpoint, row.track).toBe(2);
    }
  });
});
