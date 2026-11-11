import { javascriptPlacement } from "@/content/placement/javascript";
import { pythonPlacement } from "@/content/placement/python";
import { localize, type Locale } from "@/lib/i18n/config";
import type { PlacementDefinition, PlacementItem, PlacementLevel } from "./placement";

/**
 * Placement registry and single-locale views for the browser. Like exercise
 * tests, the answers are shipped to the client (checking happens there), so
 * they discourage guessing rather than provide secrecy.
 */
const placements: PlacementDefinition[] = [javascriptPlacement, pythonPlacement];

export function getPlacements(): PlacementDefinition[] {
  return placements;
}

export function getPlacement(courseId: string): PlacementDefinition | undefined {
  return placements.find((placement) => placement.courseId === courseId);
}

interface LocalizedItemBase {
  id: string;
  level: PlacementLevel;
  skills: string[];
  prompt: string;
  explanation: string;
}

export type LocalizedPlacementItem =
  | (LocalizedItemBase & { kind: "predict"; code: string; options: { id: string; output: string }[]; answer: string })
  | (LocalizedItemBase & {
      kind: "debug";
      code: string;
      expectedOutput: string;
      options: { id: string; label: string }[];
      answer: string;
    })
  | (LocalizedItemBase & {
      kind: "code";
      starter: string;
      tests: { id: string; label: string; failure: string; code: string }[];
    });

export interface LocalizedPlacement {
  id: string;
  version: number;
  courseId: string;
  language: PlacementDefinition["language"];
  minutes: number;
  items: LocalizedPlacementItem[];
}

function localizeItem(item: PlacementItem, locale: Locale): LocalizedPlacementItem {
  const base = {
    id: item.id,
    level: item.level,
    skills: item.skills,
    prompt: localize(item.prompt, locale),
    explanation: localize(item.explanation, locale),
  };
  switch (item.kind) {
    case "predict":
      return { ...base, kind: "predict", code: item.code, options: item.options, answer: item.answer };
    case "debug":
      return {
        ...base,
        kind: "debug",
        code: item.code,
        expectedOutput: item.expectedOutput,
        // The fixed programs are only needed by the verification tests.
        options: item.options.map((option) => ({ id: option.id, label: localize(option.label, locale) })),
        answer: item.answer,
      };
    case "code":
      return {
        ...base,
        kind: "code",
        starter: item.starter,
        tests: item.tests.map((test) => ({
          id: test.id,
          label: localize(test.label, locale),
          failure: localize(test.failure, locale),
          code: test.code,
        })),
      };
  }
}

export function localizePlacement(placement: PlacementDefinition, locale: Locale): LocalizedPlacement {
  return {
    id: placement.id,
    version: placement.version,
    courseId: placement.courseId,
    language: placement.language,
    minutes: placement.minutes,
    items: placement.items.map((item) => localizeItem(item, locale)),
  };
}
