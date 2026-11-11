"use client";

import { Check, CircleCheck, Code, Flag, FlaskConical, Play, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { Mascot } from "@/components/mascot/mascot";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { CatalogChapter, CatalogCourse } from "@/lib/content/catalog";
import { XP_REWARDS } from "@/lib/gamification/xp";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { effectiveLevel, type TrackCompetency, type TrackId } from "@/lib/learning/competency";
import { nextTask } from "@/lib/learning/recommend";
import { useCatalog } from "@/lib/learner/catalog-context";
import { useCompetency, useProgress } from "@/lib/learner/hooks";
import { isExerciseCompleted, type ProgressState } from "@/lib/progress/progress";
import { chapterIcons, tones } from "./theme";

const ROW = 112;
/** Horizontal offsets (percent of the track width) that make the trail wind. */
const SWAY = [0, 22, 0, -22];

type NodeState = "completed" | "current" | "upcoming";

/** "Chapter 6: Functions", or just the title for checkpoints (it already says "Checkpoint"). */
export function chapterName(chapter: CatalogChapter, dict: Dictionary): string {
  return chapter.number === null ? chapter.title : format(dict.home.chapterLine, { number: chapter.number, title: chapter.title });
}

/**
 * The course as a winding path of chapters, grouped into bands
 * (beginner → advanced). The learner's level only adds suggestions: every
 * node is a normal link and nothing is locked.
 */
export function LearningPath({ course, hasPlacement = false }: { course: CatalogCourse; hasPlacement?: boolean }) {
  const { dict } = useI18n();
  const progress = useProgress();
  const competency = useCompetency();
  const hydrated = progress.hydrated && competency.hydrated;
  const track = hydrated ? competency.value.tracks[course.language as TrackId] : undefined;
  const currentId = hydrated ? nextTask(course, progress.value, track)?.exercise.id : undefined;
  const suggestedChapterId = track?.recommendedNext?.courseId === course.id ? track.recommendedNext.chapterId : undefined;

  // A band heading goes before the first regular chapter of each level.
  const bandStarts = new Set<string>();
  let lastLevel: string | null = null;
  for (const chapter of course.chapters) {
    if (chapter.kind === "chapter" && chapter.level !== lastLevel) {
      bandStarts.add(chapter.id);
      lastLevel = chapter.level;
    }
  }

  return (
    <div className="space-y-10">
      {course.exerciseIds.length > 0 ? (
        <LevelBanner course={course} track={track} hydrated={hydrated} hasPlacement={hasPlacement} />
      ) : null}
      {course.chapters.map((chapter) => (
        <Fragment key={chapter.id}>
          {bandStarts.has(chapter.id) ? (
            <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              <span>{dict.path.bands[chapter.level]}</span>
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            </h2>
          ) : null}
          <ChapterSection
            chapter={chapter}
            progress={hydrated ? progress.value : undefined}
            currentId={currentId}
            suggested={chapter.id === suggestedChapterId}
          />
        </Fragment>
      ))}
    </div>
  );
}

function LevelBanner({
  course,
  track,
  hydrated,
  hasPlacement,
}: {
  course: CatalogCourse;
  track?: TrackCompetency;
  hydrated: boolean;
  hasPlacement: boolean;
}) {
  const { locale, dict } = useI18n();
  if (!hydrated) return <div className="h-24 animate-pulse rounded-2xl bg-muted" aria-hidden="true" />;

  const effective = effectiveLevel(track);
  const suggested =
    track?.recommendedNext?.courseId === course.id
      ? course.chapters.find((chapter) => chapter.id === track.recommendedNext?.chapterId)
      : undefined;
  const linkClass = "font-medium text-accent underline-offset-4 hover:underline";

  return (
    <section
      aria-labelledby="level-banner-title"
      className="rounded-2xl border border-line bg-surface p-4 shadow-card"
      data-testid="level-banner"
    >
      {effective ? (
        <>
          <p className="text-sm">
            <span id="level-banner-title" className="text-fg-muted">
              {dict.path.yourLevel}:
            </span>{" "}
            <strong>{dict.levels.names[effective.level]}</strong>{" "}
            <span className="text-fg-subtle">· {dict.levels.sources[effective.source]}</span>{" "}
            <Link href={`/${locale}/progress#levels`} className={linkClass}>
              {dict.path.changeLevel}
            </Link>
          </p>
          {suggested ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Sparkles className="size-4 text-accent" aria-hidden="true" />
              <span>{format(dict.path.suggestedChapter, { chapter: chapterName(suggested, dict) })}</span>
              <a href={`#chapter-${suggested.id}`} className={linkClass}>
                {dict.path.goToSuggestion}
              </a>
            </p>
          ) : null}
          {effective.level === "professional" ? (
            <p className="mt-1.5 text-xs text-fg-muted">{dict.levels.professionalNote}</p>
          ) : null}
        </>
      ) : (
        <p className="text-sm">
          <span id="level-banner-title">{dict.path.setLevel}</span>{" "}
          <Link href={`/${locale}/progress#levels`} className={linkClass}>
            {dict.home.setLevel}
          </Link>
          {hasPlacement ? (
            <>
              {" · "}
              <Link href={`/${locale}/placement/${course.id}`} className={linkClass}>
                {dict.onboarding.takePlacement}
              </Link>
            </>
          ) : null}
        </p>
      )}
      <p className="mt-1.5 text-xs text-fg-subtle">{dict.path.noLocks}</p>
    </section>
  );
}

function ChapterSection({
  chapter,
  progress,
  currentId,
  suggested,
}: {
  chapter: CatalogChapter;
  progress?: ProgressState;
  currentId?: string;
  suggested: boolean;
}) {
  const { dict } = useI18n();
  const { skills } = useCatalog();
  const tone = tones[chapter.theme.tone];
  const Icon = chapterIcons[chapter.theme.icon];
  const planned = chapter.status === "planned" || chapter.exercises.length === 0;
  const checkpoint = chapter.kind === "checkpoint";
  const done = progress ? chapter.exercises.filter((exercise) => isExerciseCompleted(progress, exercise.id)).length : 0;
  const complete = !planned && done === chapter.exercises.length;
  const helpful = chapter.buildsOn
    .map((id) => skills.find((skill) => skill.id === id)?.title)
    .filter((title): title is string => Boolean(title));

  return (
    <section
      id={`chapter-${chapter.id}`}
      aria-labelledby={`chapter-title-${chapter.id}`}
      className="scroll-mt-24"
      data-suggested={suggested || undefined}
    >
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-card",
          complete ? "border-success/40" : suggested ? "border-accent/60" : "border-line",
          checkpoint && !complete && !suggested && "border-dashed",
          planned && "opacity-70",
        )}
      >
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", tone.tile)}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", tone.text)}>
            {checkpoint ? dict.path.checkpoint : format(dict.path.chapter, { number: chapter.number ?? "" })}
          </p>
          <h3 id={`chapter-title-${chapter.id}`} className="font-semibold leading-snug">
            {chapter.title}
          </h3>
          <p className="text-sm text-fg-muted">{chapter.summary}</p>
          {checkpoint && !planned ? <p className="mt-1 text-xs text-fg-subtle">{dict.path.checkpointHint}</p> : null}
          {helpful.length > 0 ? (
            <p className="mt-1 text-xs text-fg-subtle">{format(dict.path.helpfulFirst, { skills: helpful.join(" · ") })}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {suggested ? <Badge tone="accent">{dict.path.suggestedStart}</Badge> : null}
          {planned ? (
            <Badge>{dict.path.comingSoon}</Badge>
          ) : complete ? (
            <Badge tone="success" icon={<CircleCheck aria-hidden="true" />}>
              {dict.path.chapterDone}
            </Badge>
          ) : checkpoint ? null : (
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
          // Labs and checkpoints are milestones: a bigger, square node.
          const milestone = exercise.type !== "challenge";
          const isCheckpoint = exercise.type === "checkpoint";
          const point = points[index];
          const label = `${exercise.title} — ${dict.path.nodeStatus[state]}`;
          const MilestoneIcon = isCheckpoint ? Flag : FlaskConical;
          return (
            <li
              key={exercise.id}
              className="absolute flex w-36 -translate-x-1/2 flex-col items-center"
              style={{ left: `${point.x}%`, top: point.y - (milestone ? 36 : 32) }}
            >
              <Link
                href={`/${locale}/courses/${exercise.courseId}/${exercise.id}`}
                aria-label={label}
                data-state={state}
                className={cn(
                  "group relative flex items-center justify-center border-[3px] shadow-card transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5",
                  milestone ? "size-18 rounded-2xl" : "size-16 rounded-full",
                  state === "completed" && "border-success bg-success text-white dark:text-bg",
                  state === "current" && "ring-in border-accent bg-accent text-accent-fg",
                  state === "upcoming" && cn("bg-surface text-fg-subtle", milestone ? tone.border : "border-line"),
                )}
              >
                {state === "completed" ? (
                  milestone ? <Trophy className="size-7" aria-hidden="true" /> : <Check className="size-7" aria-hidden="true" />
                ) : state === "current" ? (
                  <Play className="ml-0.5 size-6" fill="currentColor" aria-hidden="true" />
                ) : milestone ? (
                  <MilestoneIcon className={cn("size-7", tone.text)} aria-hidden="true" />
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
                {milestone ? (
                  <span className={cn("block text-[10px] font-semibold uppercase", tone.text)}>
                    {isCheckpoint ? dict.path.checkpoint : dict.path.lab}
                  </span>
                ) : null}
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
