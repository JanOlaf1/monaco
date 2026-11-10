import type { Metadata } from "next";
import { CourseCard } from "@/components/catalog/course-card";
import { PageShell } from "@/components/layout/page-shell";
import { getCatalog } from "@/lib/content/localize";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.course.catalogTitle };
}

/** Secondary navigation: every course, including ones still being built. */
export default async function CoursesPage() {
  const { locale, dict } = await getDictionary();
  const catalog = getCatalog(locale);
  return (
    <PageShell dict={dict}>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.course.catalogTitle}</h1>
      <p className="mt-2 text-fg-muted">{dict.course.catalogIntro}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {catalog.map((course) => (
          <CourseCard key={course.id} course={course} locale={locale} dict={dict} />
        ))}
      </div>
      <p className="mt-10 text-xs text-fg-subtle">{dict.home.localNotice}</p>
    </PageShell>
  );
}
