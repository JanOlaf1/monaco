import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { PlanView } from "@/components/schedule/plan-view";
import { getCatalog } from "@/lib/content/localize";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.plan.title };
}

export default async function PlanPage() {
  const { locale, dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.plan.title}</h1>
        <p className="mt-2 text-fg-muted">{dict.plan.intro}</p>
      </div>
      <PlanView catalog={getCatalog(locale)} />
      <p className="mt-10 text-xs text-fg-subtle">{dict.plan.storageNote}</p>
    </PageShell>
  );
}
