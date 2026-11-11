"use client";

import { ArrowRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { chapterName } from "@/components/learn/learning-path";
import { Button, ButtonLink } from "@/components/ui/button";
import { LanguageMark, languageNames } from "@/components/ui/language-mark";
import type { CatalogCourse } from "@/lib/content/catalog";
import { SKILL_LEVELS, type SkillLevel } from "@/lib/content/types";
import { useI18n } from "@/lib/i18n/client";
import { format, formatDateKey } from "@/lib/i18n/format";
import { effectiveLevel, TRACKS, type CompetencyState, type TrackId } from "@/lib/learning/competency";
import { useCatalog } from "@/lib/learner/catalog-context";
import { competencyActions, useCompetency } from "@/lib/learner/hooks";
import { toDateKey } from "@/lib/schedule/dates";

/**
 * Settings for the learner's proficiency per language. Changing a level is the
 * learner's own choice ("override"): it always wins over suggestions and only
 * moves the suggested starting chapter. Nothing is locked.
 */
export function SkillLevels() {
  const { dict } = useI18n();
  const { courses } = useCatalog();
  const { value: competency, hydrated } = useCompetency();

  return (
    <section
      id="levels"
      aria-labelledby="levels-title"
      className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 shadow-card"
    >
      <h2 id="levels-title" className="text-sm font-semibold">
        {dict.progressPage.levelsTitle}
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-fg-muted">{dict.progressPage.levelsIntro}</p>
      {hydrated ? (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {TRACKS.map((track) => (
            <TrackRow
              key={track}
              track={track}
              course={courses.find((course) => course.language === track)}
              competency={competency}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      )}
    </section>
  );
}

function TrackRow({
  track,
  course,
  competency,
}: {
  track: TrackId;
  course?: CatalogCourse;
  competency: CompetencyState;
}) {
  const { locale, dict } = useI18n();
  const selectId = useId();
  const state = competency.tracks[track];
  const effective = effectiveLevel(state);
  const playable = Boolean(course && course.exerciseIds.length > 0);
  const suggestion = state?.recommendedNext;
  const suggestedChapter = suggestion ? course?.chapters.find((chapter) => chapter.id === suggestion.chapterId) : undefined;
  const placement = state?.placementResult;

  return (
    <li className="rounded-xl border border-line p-4" data-track={track}>
      <div className="flex items-center gap-3">
        <LanguageMark language={track} size="sm" />
        <p className="font-medium">{languageNames[track]}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2">
        <div className="flex flex-col gap-1 text-xs text-fg-muted">
          <label htmlFor={selectId}>{format(dict.progressPage.levelFor, { language: languageNames[track] })}</label>
          <select
            id={selectId}
            value={effective?.level ?? ""}
            onChange={(event) =>
              competencyActions.setOverride(
                playable ? course : undefined,
                track,
                (event.target.value || null) as SkillLevel | null,
              )
            }
            className="h-9 min-w-48 rounded-lg border border-line bg-surface px-2 text-sm text-fg"
          >
            {effective ? null : <option value="">{dict.levels.notSet}</option>}
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {dict.levels.names[level]}
              </option>
            ))}
          </select>
        </div>
        {effective ? (
          <span className="pb-2 text-xs text-fg-subtle">{dict.levels.sources[effective.source]}</span>
        ) : null}
      </div>

      {effective?.source === "override" && (state?.placementResult || state?.selfReportedLevel) ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mt-1"
          onClick={() => competencyActions.setOverride(playable ? course : undefined, track, null)}
        >
          {dict.progressPage.useSuggestion}
        </Button>
      ) : null}
      {effective?.level === "professional" ? <p className="mt-2 text-xs text-fg-muted">{dict.levels.professionalNote}</p> : null}

      {!playable ? (
        <p className="mt-3 text-xs text-fg-subtle">{dict.progressPage.courseComingSoon}</p>
      ) : (
        <div className="mt-3 space-y-2 text-sm">
          {suggestedChapter && course && suggestion ? (
            <p>
              <Link
                href={`/${locale}/courses/${course.id}/${suggestion.exerciseId}`}
                className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
              >
                {format(dict.progressPage.suggested, { chapter: chapterName(suggestedChapter, dict) })}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </p>
          ) : null}
          {placement ? (
            <p className="text-xs text-fg-muted">
              {format(dict.progressPage.lastCheck, {
                date: formatDateKey(locale, toDateKey(new Date(placement.completedAt))),
                correct: placement.correct,
                answered: placement.answered,
                level: dict.levels.names[placement.level],
              })}
            </p>
          ) : null}
          {course?.placement ? (
            <ButtonLink href={`/${locale}/placement/${course.id}`} variant="secondary" size="sm">
              <ClipboardCheck aria-hidden="true" />
              {placement ? dict.progressPage.retakeCheck : dict.progressPage.takeCheck}
            </ButtonLink>
          ) : null}
        </div>
      )}
    </li>
  );
}
