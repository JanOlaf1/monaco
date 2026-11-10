import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { WorkspaceNav } from "@/components/workspace/types";
import { Workspace } from "@/components/workspace/workspace";
import { WorkspaceSkeleton } from "@/components/workspace/workspace-skeleton";
import { localizeExercise } from "@/lib/content/localize";
import { getExercise, getExerciseContext, getExerciseRouteParams } from "@/lib/content/registry";
import { localize } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";

type Params = PageProps<"/[lang]/courses/[courseId]/[exerciseId]">["params"];

export async function generateStaticParams() {
  return getExerciseRouteParams();
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { courseId, exerciseId } = await params;
  const context = getExerciseContext(courseId, exerciseId);
  if (!context) return {};
  const { locale } = await getDictionary();
  return {
    title: localize(context.exercise.title, locale),
    description: localize(context.exercise.summary, locale),
  };
}

/**
 * Every exercise is prerendered (generateStaticParams), so direct visits get
 * full HTML. The Suspense boundary lets client navigations show the workspace
 * skeleton instantly while the exercise streams in.
 */
export default function ExercisePage({ params }: PageProps<"/[lang]/courses/[courseId]/[exerciseId]">) {
  return (
    <main id="main" className="flex h-[calc(100dvh-var(--header-h))] flex-col overflow-hidden">
      <Suspense fallback={<WorkspaceSkeleton />}>
        <ExerciseWorkspace params={params} />
      </Suspense>
    </main>
  );
}

async function ExerciseWorkspace({ params }: { params: Params }) {
  const { courseId, exerciseId } = await params;
  const context = getExerciseContext(courseId, exerciseId);
  if (!context) notFound();
  const { locale } = await getDictionary();

  const neighbor = (id?: string) => {
    const exercise = id ? getExercise(id) : undefined;
    return exercise ? { id: exercise.id, title: localize(exercise.title, locale) } : undefined;
  };
  const nav: WorkspaceNav = {
    courseId: context.course.id,
    courseTitle: localize(context.course.title, locale),
    chapterTitle: localize(context.chapter.title, locale),
    chapterNumber: context.chapterNumber,
    chapterTheme: context.chapter.theme,
    positionInChapter: context.positionInChapter,
    chapterSize: context.chapter.exerciseIds.length,
    previous: neighbor(context.previousId),
    next: neighbor(context.nextId),
  };

  return <Workspace exercise={localizeExercise(context.exercise, locale)} nav={nav} />;
}
