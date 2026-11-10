import { describe, expect, it } from "vitest";
import { hasLocale, localize, switchLocaleInPath } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { fi } from "@/lib/i18n/dictionaries/fi";
import { format, formatDateKey, plural } from "@/lib/i18n/format";

function leaves(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("UI dictionaries", () => {
  const english = new Map(leaves(en));
  const finnish = new Map(leaves(fi));

  it("have the same keys", () => {
    expect([...finnish.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("have no empty strings", () => {
    for (const [key, value] of [...english, ...finnish]) expect(value.trim(), key).not.toBe("");
  });

  it("use the same placeholders in both languages", () => {
    for (const [key, value] of english) {
      expect(placeholders(finnish.get(key) ?? ""), key).toEqual(placeholders(value));
    }
  });

  it("are actually translated (not copied from English)", () => {
    // Pure templates such as "{current} / {total} XP" contain no words to translate.
    const hasWords = (value: string) => /\p{L}/u.test(value.replace(/\{\w+\}/g, "").replace(/\bXP\b/g, ""));
    const identical = [...english].filter(
      ([key, value]) => finnish.get(key) === value && value.length > 12 && hasWords(value),
    );
    // Brand names and short technical labels may legitimately stay the same.
    expect(identical.map(([key]) => key)).toEqual([]);
  });
});

describe("i18n helpers", () => {
  it("formats placeholders and plurals per locale", () => {
    expect(format("{done} of {total}", { done: 1, total: 3 })).toBe("1 of 3");
    expect(format("{missing} stays", {})).toBe("{missing} stays");
    expect(plural("en", en.deadlines.daysLeft, 1)).toBe("1 day left");
    expect(plural("en", en.deadlines.daysLeft, 3)).toBe("3 days left");
    expect(plural("fi", fi.deadlines.daysLeft, 1)).toBe("1 päivä jäljellä");
    expect(plural("fi", fi.deadlines.daysLeft, 5)).toBe("5 päivää jäljellä");
  });

  it("formats calendar dates for each locale", () => {
    expect(formatDateKey("en", "2026-11-17")).toBe("17 Nov 2026");
    // Finnish uses numeric dates (exact output depends on the ICU data in use).
    expect(formatDateKey("fi", "2026-11-17")).toMatch(/^17\.\s?(11\.|marrask)/);
  });

  it("switches the locale segment of a path", () => {
    expect(switchLocaleInPath("/en/courses/python", "fi")).toBe("/fi/courses/python");
    expect(switchLocaleInPath("/fi", "en")).toBe("/en");
    expect(switchLocaleInPath("/plan", "fi")).toBe("/fi/plan");
  });

  it("validates locales and falls back to English for missing content", () => {
    expect(hasLocale("fi")).toBe(true);
    expect(hasLocale("sv")).toBe(false);
    expect(hasLocale(undefined)).toBe(false);
    expect(localize({ en: "Hello" }, "fi")).toBe("Hello");
  });
});
