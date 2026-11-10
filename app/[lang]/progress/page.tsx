import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Mascot } from "@/components/mascot/mascot";
import { ProgressView } from "@/components/progress/progress-view";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.progressPage.title };
}

/** Anonymous progress profile: everything comes from this browser's local storage. */
export default async function ProgressPage() {
  const { dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <div className="flex items-center gap-4">
        <Mascot mood="celebrating" size={72} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.progressPage.title}</h1>
          <p className="mt-1 text-fg-muted">{dict.progressPage.intro}</p>
        </div>
      </div>
      <ProgressView />
    </PageShell>
  );
}
