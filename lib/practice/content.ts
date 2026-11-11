import { javascriptPractice } from "@/content/practice/javascript";
import { pythonPractice } from "@/content/practice/python";
import { localize, type Locale } from "@/lib/i18n/config";
import type { PracticeActivity, PracticeLanguage, QuizActivity } from "./types";

/**
 * Practice registry and single-locale views for the browser. As with exercise
 * tests and placement items, answer keys ship to the client (answers are
 * checked on the device, which also makes practice work offline).
 */
const activities: PracticeActivity[] = [...pythonPractice, ...javascriptPractice];
const byId = new Map(activities.map((activity) => [activity.id, activity]));

export const PRACTICE_LANGUAGES: PracticeLanguage[] = ["python", "javascript"];

export function getPracticeActivities(): PracticeActivity[] {
  return activities;
}

export function getPracticeActivity(id: string): PracticeActivity | undefined {
  return byId.get(id);
}

type Texts = { prompt: string; explanation: string };
type LocalizedQuiz = Omit<QuizActivity, "prompt" | "explanation" | "options"> &
  Texts & { options: { id: string; label: string }[] };
type LocalizedOther<A = Exclude<PracticeActivity, QuizActivity>> = A extends PracticeActivity
  ? Omit<A, "prompt" | "explanation"> & Texts
  : never;

/** A practice activity with its texts in one locale. */
export type LocalizedPracticeActivity = LocalizedOther | LocalizedQuiz;

export function localizeActivity(activity: PracticeActivity, locale: Locale): LocalizedPracticeActivity {
  const texts = { prompt: localize(activity.prompt, locale), explanation: localize(activity.explanation, locale) };
  if (activity.kind === "quiz") {
    return {
      ...activity,
      ...texts,
      options: activity.options.map((option) => ({ id: option.id, label: localize(option.label, locale) })),
    };
  }
  return { ...activity, ...texts };
}

export function getLocalizedPractice(locale: Locale): LocalizedPracticeActivity[] {
  return activities.map((activity) => localizeActivity(activity, locale));
}
