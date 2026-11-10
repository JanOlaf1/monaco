import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LanguageMark } from "@/components/ui/language-mark";
import type { CatalogCourse } from "@/lib/content/catalog";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { plural } from "@/lib/i18n/format";
import { CourseProgress } from "./course-progress";

export function CourseCard({ course, locale, dict }: { course: CatalogCourse; locale: Locale; dict: Dictionary }) {
  const available = course.status === "available" && course.exerciseIds.length > 0;
  return (
    <Link
      href={`/${locale}/courses/${course.id}`}
      className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <LanguageMark language={course.language} size="lg" />
        {available ? null : <Badge>{dict.common.comingSoon}</Badge>}
      </div>
      <h2 className="mt-4 text-base font-semibold tracking-tight">{course.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{course.summary}</p>
      <p className="mt-3 text-xs text-fg-subtle">
        {plural(locale, dict.course.chapters, course.chapters.length)}
        {available ? ` · ${plural(locale, dict.course.exercises, course.exerciseIds.length)}` : null}
      </p>
      <div className="mt-auto pt-5">
        {available ? (
          <CourseProgress exerciseIds={course.exerciseIds} label={course.title} />
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-fg-subtle group-hover:text-fg-muted">
            {dict.course.view}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </Link>
  );
}
