"use client";

import { Check, FlaskConical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CatalogChapter } from "@/lib/content/catalog";
import { useI18n } from "@/lib/i18n/client";
import { isExerciseCompleted, type ProgressState } from "@/lib/progress/progress";

/** One chapter as a row of connected nodes (completed / current / upcoming). */
export function MiniPath({
  chapter,
  progress,
  currentId,
}: {
  chapter: CatalogChapter;
  progress: ProgressState;
  currentId?: string;
}) {
  const { locale, dict } = useI18n();
  return (
    <ol className="flex items-center" aria-label={chapter.title}>
      {chapter.exercises.map((exercise, index) => {
        const done = isExerciseCompleted(progress, exercise.id);
        const current = exercise.id === currentId;
        const status = done ? dict.path.nodeStatus.completed : current ? dict.path.nodeStatus.current : dict.path.nodeStatus.upcoming;
        return (
          <li key={exercise.id} className="flex flex-1 items-center last:flex-none">
            <Link
              href={`/${locale}/courses/${exercise.courseId}/${exercise.id}`}
              aria-label={`${exercise.title} — ${status}`}
              title={exercise.title}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-transform hover:scale-105",
                done && "border-success bg-success text-white dark:text-bg",
                current && !done && "ring-in border-accent bg-accent-soft text-accent",
                !done && !current && "border-line bg-surface text-fg-subtle",
                exercise.type !== "challenge" && "rounded-lg",
              )}
            >
              {done ? (
                <Check className="size-4" aria-hidden="true" />
              ) : exercise.type !== "challenge" ? (
                <FlaskConical className="size-4" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </Link>
            {index < chapter.exercises.length - 1 ? (
              <span className={cn("mx-1 h-0.5 flex-1 rounded-full", done ? "bg-success/60" : "bg-path")} aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
