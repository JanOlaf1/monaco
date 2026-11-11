import { describe, expect, it } from "vitest";
import { COSMETICS, CRYSTAL_NAME } from "@/lib/adventure/catalog";
import { adventureAchievements } from "@/lib/adventure/engine";
import { CHAPTER_MESSAGES } from "@/lib/adventure/messages";
import { emptyAdventure } from "@/lib/adventure/state";
import { adventureDictionaries } from "@/lib/i18n/adventure";

function leaves(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
}
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("adventure bilingual copy", () => {
  it("has matching keys, nonempty strings and matching interpolation placeholders", () => {
    const en = new Map(leaves(adventureDictionaries.en));
    const fi = new Map(leaves(adventureDictionaries.fi));
    expect([...en.keys()].sort()).toEqual([...fi.keys()].sort());
    for (const [key, value] of en) {
      expect(value.trim(), key).not.toBe("");
      expect(fi.get(key)?.trim(), key).not.toBe("");
      expect(placeholders(fi.get(key) ?? ""), key).toEqual(placeholders(value));
    }
  });

  it("has bilingual names and descriptions for every real item, achievement and chapter card", () => {
    const texts = [CRYSTAL_NAME, ...COSMETICS.flatMap((item) => [item.title, item.description]),
      ...adventureAchievements(emptyAdventure).flatMap((achievement) => [achievement.title, achievement.description]),
      ...CHAPTER_MESSAGES.map((message) => message.text)];
    for (const text of texts) {
      expect(text.en.trim()).not.toBe("");
      expect(text.fi.trim()).not.toBe("");
      expect(text.fi).not.toBe(text.en);
    }
    expect(CHAPTER_MESSAGES.every((message) => message.authorship === "Koodaamo original")).toBe(true);
  });
});
