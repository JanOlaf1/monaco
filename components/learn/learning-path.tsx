"use client";

import { Check, CircleCheck, Code, FlaskConical, Play, Trophy } from "lucide-react";
import Link from "next/link";
import { Mascot } from "@/components/mascot/mascot";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { CatalogChapter, CatalogCourse } from "@/lib/content/catalog";
import { XP_REWARDS } from "@/lib/gamification/xp";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { useProgress } from "@/lib/learner/hooks";
import { isExerciseCompleted, type ProgressState } from "@/lib/progress/progress";
import { chapterIcons, tones } from "./theme";

const ROW = 112;
/** Horizontal offsets (percent of the track width) that make the trail wind. */
const SWAY = [0, 22, 0, -22];

type NodeState = "completed" | "current" | "upcoming";

/** The course as a winding path of chapters and challenges. */
export function LearningPath({ course }: { course: CatalogCourse }) {
  const { value: progress, hydrated } = useProgress();
  const currentId = hydrated ? course.exerciseIds.find((id) => !isExerciseCompleted(progress, id)) : undefined;
  return (
    <div className="space-y-10">
      {course.chapters.map((chapter) => (
        <ChapterSection
          key={chapter.id}
          chapter={chapter}
          progress={hydrated ? progress : undefined}
          currentId={currentId}
        />
      ))}
    </div>
  );
}

function ChapterSection({
  chapter,
  progress,
  currentId,
}: {
  chapter: CatalogChapter;
  progress?: ProgressState;
  currentId?: string;
}) {
  const { dict } = useI18n();
  const tone = tones[chapter.theme.tone];
  const Icon = chapterIcons[chapter.theme.icon];
  const planned = chapter.status === "planned" || chapter.exercises.length === 0;
  const done = progress ? chapter.exercises.filter((exercise) => isExerciseCompleted(progress, exercise.id)).length : 0;
  const complete = !planned && done === chapter.exercises.length;

  return (
    <section id={`chapter-${chapter.id}`} aria-labelledby={`chapter-title-${chapter.id}`} className="scroll-mt-24">
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-card",
          complete ? "border-success/40" : "border-line",
          planned && "opacity-70",
        )}
      >
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", tone.tile)}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", tone.text)}>
            {format(dict.path.chapter, { number: chapter.number })}
          </p>
          <h2 id={`chapter-title-${chapter.id}`} className="font-semibold leading-snug">
            {chapter.title}
          </h2>
          <p className="text-sm text-fg-muted">{chapter.summary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {planned ? (
            <Badge>{dict.path.comingSoon}</Badge>
          ) : complete ? (
            <Badge tone="success" icon={<CircleCheck aria-hidden="true" />}>
              {dict.path.chapterDone}
            </Badge>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-xp-soft px-2 py-0.5 text-xs font-semibold text-xp">
              <Trophy className="size-3" aria-hidden="true" />
              {format(dict.path.chapterReward, { xp: XP_REWARDS.chapter })}
            </span>
          )}
          {!planned ? (
            <span className="text-xs tabular-nums text-fg-subtle">
              {format(dict.path.chapterProgress, { done, total: chapter.exercises.length })}
            </span>
          ) : null}
        </div>
      </div>

      {!planned ? <Trail chapter={chapter} progress={progress} currentId={currentId} /> : null}
    </section>
  );
}

function Trail({
  chapter,
  progress,
  currentId,
}: {
  chapter: CatalogChapter;
  progress?: ProgressState;
  currentId?: string;
}) {
  const { locale, dict } = useI18n();
  const tone = tones[chapter.theme.tone];
  const height = chapter.exercises.length * ROW;
  const points = chapter.exercises.map((_, index) => ({ x: 50 + SWAY[index % SWAY.length], y: index * ROW + ROW / 2 }));
  const stateOf = (id: string): NodeState =>
    progress && isExerciseCompleted(progress, id) ? "completed" : id === currentId ? "current" : "upcoming";

  return (
    <div className="relative mx-auto mt-2 w-full max-w-sm" style={{ height }}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {points.slice(1).map((point, index) => {
          const previous = points[index];
          const done = stateOf(chapter.exercises[index].id) === "completed";
          return (
            <path
              key={index}
              d={`M${previous.x} ${previous.y} C${previous.x} ${previous.y + ROW / 2} ${point.x} ${point.y - ROW / 2} ${point.x} ${point.y}`}
              fill="none"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={done ? undefined : "2 9"}
              vectorEffect="non-scaling-stroke"
              className={done ? "stroke-success/70" : "stroke-path"}
            />
          );
        })}
      </svg>
      <ol>
        {chapter.exercises.map((exercise, index) => {
          const state = stateOf(exercise.id);
          const isLab = exercise.type === "lab";
          const point = points[index];
          const label = `${exercise.title} — ${dict.path.nodeStatus[state]}`;
          return (
            <li
              key={exercise.id}
              className="absolute flex w-36 -translate-x-1/2 flex-col items-center"
              style={{ left: `${point.x}%`, top: point.y - (isLab ? 36 : 32) }}
            >
              <Link
                href={`/${locale}/courses/${exercise.courseId}/${exercise.id}`}
                aria-label={label}
                data-state={state}
                className={cn(
                  "group relative flex items-center justify-center border-[3px] shadow-card transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5",
                  isLab ? "size-18 rounded-2xl" : "size-16 rounded-full",
                  state === "completed" && "border-success bg-success text-white dark:text-bg",
                  state === "current" && "ring-in border-accent bg-accent text-accent-fg",
                  state === "upcoming" && cn("bg-surface text-fg-subtle", isLab ? tone.border : "border-line"),
                )}
              >
                {state === "completed" ? (
                  isLab ? <Trophy className="size-7" aria-hidden="true" /> : <Check className="size-7" aria-hidden="true" />
                ) : state === "current" ? (
                  <Play className="ml-0.5 size-6" fill="currentColor" aria-hidden="true" />
                ) : isLab ? (
                  <FlaskConical className={cn("size-7", tone.text)} aria-hidden="true" />
                ) : (
                  <Code className="size-6" aria-hidden="true" />
                )}
                {state === "current" ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-fg shadow-card">
                    {dict.path.upNext}
                  </span>
                ) : null}
              </Link>
              <span className="mt-1.5 line-clamp-2 rounded-md bg-bg/90 px-1.5 py-0.5 text-center text-xs font-medium leading-tight text-fg-muted">
                {isLab ? <span className={cn("block text-[10px] font-semibold uppercase", tone.text)}>{dict.path.lab}</span> : null}
                {exercise.title}
              </span>
              {state === "current" ? (
                <Mascot
                  mood="welcome"
                  size={52}
                  className={cn(
                    "absolute top-1/2 translate-y-[-60%] max-sm:hidden",
                    point.x >= 50 ? "-left-14" : "-right-14",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
