import { ChevronLeft, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CourseActions } from "@/components/course/course-actions";
import { LearningPath } from "@/components/learn/learning-path";
import { chapterIcons, tones } from "@/components/learn/theme";
import { PageShell } from "@/components/layout/page-shell";
import { LanguageMark, languageNames } from "@/components/ui/language-mark";
import { cn } from "@/lib/cn";
import { getCatalog } from "@/lib/content/localize";
import { getCourse, getCourses } from "@/lib/content/registry";
import { localize } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";

type Params = PageProps<"/[lang]/courses/[courseId]">["params"];

export async function generateStaticParams() {
  return getCourses().map((course) => ({ courseId: course.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) return {};
  const { locale } = await getDictionary();
  return { title: localize(course.title, locale), description: localize(course.summary, locale) };
}

/**
 * The learning path for one course. Prerendered for every course; the
 * Suspense boundary lets client navigations show a skeleton instantly.
 */
export default async function CoursePage({ params }: PageProps<"/[lang]/courses/[courseId]">) {
  const { dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <Suspense fallback={<CourseSkeleton />}>
        <CourseContent params={params} />
      </Suspense>
    </PageShell>
  );
}

function CourseSkeleton() {
  const bar = "animate-pulse rounded bg-muted";
  return (
    <div aria-hidden="true">
      <div className={`${bar} h-4 w-28`} />
      <div className="mt-8 flex items-center gap-4">
        <div className={`${bar} size-12 rounded-lg`} />
        <div className="space-y-2">
          <div className={`${bar} h-7 w-64`} />
          <div className={`${bar} h-4 w-80 max-w-full`} />
        </div>
      </div>
      <div className="mt-10 max-w-xl space-y-4">
        <div className={`${bar} h-20 rounded-2xl`} />
        <div className={`${bar} h-56 rounded-2xl`} />
      </div>
    </div>
  );
}

async function CourseContent({ params }: { params: Params }) {
  const { courseId } = await params;
  const { locale, dict } = await getDictionary();
  const course = getCatalog(locale).find((candidate) => candidate.id === courseId);
  if (!course) notFound();
  const available = course.status === "available" && course.exerciseIds.length > 0;

  return (
    <>
      <Link
        href={`/${locale}/courses`}
        className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        {dict.course.allCourses}
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <LanguageMark language={course.language} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{course.title}</h1>
          <p className="mt-1 max-w-2xl text-fg-muted">{course.summary}</p>
        </div>
      </div>

      {!available ? (
        <div className="mt-6 flex max-w-2xl gap-3 rounded-xl border border-line bg-muted p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          <div>
            <p className="font-medium">{dict.course.plannedCourseTitle}</p>
            <p className="mt-1 text-fg-muted">
              {format(dict.course.plannedCourseBody, { language: languageNames[course.language] })}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          <LearningPath course={course} hasPlacement={course.placement !== null} />
          {available ? <p className="mt-10 text-center text-xs text-fg-subtle">{dict.path.reviewAnytime}</p> : null}
        </div>

        {available ? (
          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <CourseActions courseId={course.id} courseTitle={course.title} exerciseIds={course.exerciseIds} />
            <nav aria-label={dict.path.chaptersNav} className="rounded-2xl border border-line bg-surface p-3 max-lg:hidden">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{dict.path.chaptersNav}</p>
              <ol>
                {course.chapters.map((chapter) => {
                  const Icon = chapterIcons[chapter.theme.icon];
                  return (
                    <li key={chapter.id}>
                      <a
                        href={`#chapter-${chapter.id}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-fg-muted hover:bg-hover hover:text-fg"
                      >
                        <Icon className={cn("size-4 shrink-0", tones[chapter.theme.tone].text)} aria-hidden="true" />
                        <span className="truncate">{chapter.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>
        ) : null}
      </div>
    </>
  );
}
