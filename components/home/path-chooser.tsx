"use client";

import { ArrowRight, ChevronDown, Clock, ClipboardCheck } from "lucide-react";
import { useId, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { LanguageMark, languageNames } from "@/components/ui/language-mark";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { SELF_REPORT_OPTIONS, TRACKS, type SelfReportedLevel, type TrackId } from "@/lib/learning/competency";
import { entryChapter } from "@/lib/learning/recommend";
import { useCatalog } from "@/lib/learner/catalog-context";
import { competencyActions } from "@/lib/learner/hooks";

const CHOICES = ["python", "javascript"] as const;

/**
 * First-time onboarding: pick a language, optionally say how much you know,
 * and start. The level only changes the suggested starting chapter; "Not sure"
 * offers the placement check and "Skip for now" starts at the beginning.
 */
export function PathChooser() {
  const { locale, dict } = useI18n();
  const { courses } = useCatalog();
  const levelGroup = useId();
  const [selected, setSelected] = useState<(typeof CHOICES)[number]>("python");
  const [level, setLevel] = useState<SelfReportedLevel | null>(null);
  const [others, setOthers] = useState<Partial<Record<TrackId, SelfReportedLevel>>>({});

  const options = CHOICES.map((id) => courses.find((course) => course.id === id)).filter(
    (course): course is NonNullable<typeof course> => Boolean(course && course.exerciseIds.length),
  );
  const chosen = options.find((course) => course.id === selected) ?? options[0];
  if (!chosen) return null;

  const first = chosen.chapters.flatMap((chapter) => chapter.exercises)[0];
  const entry = level && level !== "not-sure" ? entryChapter(chosen, level) : undefined;
  const skipsAhead = Boolean(entry && level !== "beginner" && entry.number !== null);
  const startExercise = (skipsAhead ? entry?.exercises[0] : undefined) ?? first;
  const placementHref = `/${locale}/placement/${chosen.id}`;
  const startHref = level === "not-sure" ? placementHref : `/${locale}/courses/${chosen.id}/${startExercise?.id}`;
  const startLabel =
    level === "not-sure"
      ? dict.onboarding.takePlacement
      : skipsAhead && entry?.number
        ? format(dict.onboarding.startAt, { number: entry.number })
        : dict.home.start;
  const save = () =>
    competencyActions.completeOnboarding({ course: chosen, level, otherLevels: others, courses });
  const levelName = (option: SelfReportedLevel) =>
    option === "not-sure" ? dict.levels.notSure : dict.levels.names[option];
  const description = level
    ? level === "not-sure"
      ? dict.levels.notSureDescription
      : dict.levels.descriptions[level]
    : dict.onboarding.levelHint;

  return (
    <div>
      <p id="choose-path" className="text-sm font-medium text-fg-muted">
        {dict.home.choosePath}
      </p>
      <div role="radiogroup" aria-labelledby="choose-path" className="mt-3 grid grid-cols-2 gap-3">
        {options.map((course) => {
          const isSelected = course.id === chosen.id;
          const firstExercise = course.chapters.flatMap((chapter) => chapter.exercises)[0];
          return (
            <button
              key={course.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(course.id as (typeof CHOICES)[number])}
              className={cn(
                "flex items-start gap-3 rounded-xl border-2 bg-surface p-3 text-left transition-colors sm:p-4",
                isSelected ? "border-accent shadow-card" : "border-line hover:border-line-strong",
              )}
            >
              <LanguageMark language={course.language} />
              <span className="min-w-0">
                <span className="block font-semibold">{languageNames[course.language]}</span>
                <span className="block text-sm text-fg-muted max-sm:hidden">
                  {dict.home.pitch[course.id as "python" | "javascript"]}
                </span>
                {firstExercise ? (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-fg-subtle max-sm:hidden">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {format(dict.home.firstChallenge, { minutes: firstExercise.estimatedMinutes })}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <fieldset className="mt-5" aria-describedby={`${levelGroup}-hint`}>
        <legend className="text-sm font-medium text-fg-muted">
          {format(dict.onboarding.levelQuestion, { language: languageNames[chosen.language] })}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SELF_REPORT_OPTIONS.map((option) => (
            <label
              key={option}
              className={cn(
                "cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm transition-colors",
                "has-checked:border-accent has-checked:bg-accent-soft has-checked:font-medium has-checked:text-fg",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                "border-line text-fg-muted hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name={levelGroup}
                value={option}
                checked={level === option}
                onChange={() => setLevel(option)}
                className="sr-only"
              />
              {levelName(option)}
            </label>
          ))}
        </div>
        <p id={`${levelGroup}-hint`} className="mt-2 min-h-10 text-xs text-fg-muted" aria-live="polite">
          {description}
          {level === "professional" ? ` ${dict.levels.professionalNote}` : ""}
        </p>
      </fieldset>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <ButtonLink href={startHref} variant="primary" className="h-11 px-6 text-base max-sm:w-full" onClick={save}>
          {level === "not-sure" ? <ClipboardCheck aria-hidden="true" /> : null}
          {startLabel}
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
        <ButtonLink
          href={`/${locale}/courses/${chosen.id}/${first?.id}`}
          variant="ghost"
          className="h-11"
          onClick={() => competencyActions.skipOnboarding(chosen)}
        >
          {dict.onboarding.skip}
        </ButtonLink>
      </div>
      {skipsAhead ? (
        <p className="mt-2 text-sm">
          <a href={placementHref} onClick={save} className="text-accent underline-offset-4 hover:underline">
            {dict.onboarding.orPlacement}
          </a>
        </p>
      ) : null}

      <details className="group mt-4 text-sm">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-fg-muted hover:text-fg">
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          {dict.onboarding.otherLanguages}
        </summary>
        <p className="mt-2 text-xs text-fg-subtle">{dict.onboarding.otherLanguagesHint}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {TRACKS.filter((track) => track !== chosen.language).map((track) => {
            const course = courses.find((candidate) => candidate.language === track);
            const planned = !course || course.exerciseIds.length === 0;
            return (
              <div key={track} className="flex flex-col gap-1 text-xs text-fg-muted">
                <label htmlFor={`${levelGroup}-${track}`}>
                  {languageNames[track]}
                  {planned ? ` · ${dict.onboarding.comingSoon}` : ""}
                </label>
                <select
                  id={`${levelGroup}-${track}`}
                  value={others[track] ?? ""}
                  onChange={(event) =>
                    setOthers((current) => ({
                      ...current,
                      [track]: (event.target.value || undefined) as SelfReportedLevel | undefined,
                    }))
                  }
                  className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-fg"
                >
                  <option value="">{dict.onboarding.noAnswer}</option>
                  {SELF_REPORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {levelName(option)}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
