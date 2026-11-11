import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { PracticeHub } from "@/components/practice/practice-hub";
import { getDictionary } from "@/lib/i18n/server";
import { getLocalizedPractice } from "@/lib/practice/content";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.practice.title };
}

/** Phone-friendly practice: short, checked activities that complement the coding workspace. */
export default async function PracticePage() {
  const { locale, dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.practice.title}</h1>
        <p className="mt-2 text-fg-muted">{dict.practice.intro}</p>
        <div className="mt-6">
          <PracticeHub activities={getLocalizedPractice(locale)} />
        </div>
      </div>
    </PageShell>
  );
}
