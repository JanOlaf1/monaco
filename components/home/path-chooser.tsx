"use client";

import { ArrowRight, Clock } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { LanguageMark } from "@/components/ui/language-mark";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { useCatalog } from "@/lib/learner/catalog-context";
import { gamificationActions } from "@/lib/learner/hooks";

const CHOICES = ["python", "javascript"] as const;

/** First-time onboarding: pick Python or JavaScript, then jump straight into the first challenge. */
export function PathChooser() {
  const { locale, dict } = useI18n();
  const { courses } = useCatalog();
  const [selected, setSelected] = useState<(typeof CHOICES)[number]>("python");
  const options = CHOICES.map((id) => courses.find((course) => course.id === id)).filter(
    (course): course is NonNullable<typeof course> => Boolean(course && course.exerciseIds.length),
  );
  const chosen = options.find((course) => course.id === selected) ?? options[0];
  const first = chosen?.chapters.flatMap((chapter) => chapter.exercises)[0];

  return (
    <div>
      <p id="choose-path" className="text-sm font-medium text-fg-muted">
        {dict.home.choosePath}
      </p>
      <div role="radiogroup" aria-labelledby="choose-path" className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map((course) => {
          const isSelected = course.id === chosen?.id;
          const firstExercise = course.chapters.flatMap((chapter) => chapter.exercises)[0];
          return (
            <button
              key={course.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(course.id as (typeof CHOICES)[number])}
              className={cn(
                "flex items-start gap-3 rounded-xl border-2 bg-surface p-4 text-left transition-colors",
                isSelected ? "border-accent shadow-card" : "border-line hover:border-line-strong",
              )}
            >
              <LanguageMark language={course.language} />
              <span className="min-w-0">
                <span className="block font-semibold">{course.language === "python" ? "Python" : "JavaScript"}</span>
                <span className="block text-sm text-fg-muted">{dict.home.pitch[course.id as "python" | "javascript"]}</span>
                {firstExercise ? (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-fg-subtle">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {format(dict.home.firstChallenge, { minutes: firstExercise.estimatedMinutes })}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {chosen && first ? (
        <ButtonLink
          href={`/${locale}/courses/${chosen.id}/${first.id}`}
          variant="primary"
          className="mt-5 h-11 w-full px-6 text-base sm:w-auto"
          onClick={() => gamificationActions.setPreferredCourse(chosen.id)}
        >
          {dict.home.start}
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
      ) : null}
    </div>
  );
}
