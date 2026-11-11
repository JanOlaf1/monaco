import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PlacementFlow } from "@/components/placement/placement-flow";
import { languageNames } from "@/components/ui/language-mark";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { getPlacement, getPlacements, localizePlacement } from "@/lib/learning/placement-content";

type Params = PageProps<"/[lang]/placement/[courseId]">["params"];

export async function generateStaticParams() {
  return getPlacements().map((placement) => ({ courseId: placement.courseId }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { courseId } = await params;
  const placement = getPlacement(courseId);
  if (!placement) return {};
  const { dict } = await getDictionary();
  return { title: format(dict.placement.title, { language: languageNames[placement.language] }) };
}

/**
 * The optional placement check for one language. Prerendered per locale and
 * course; answers are checked in the browser (coding items with the same
 * isolated runners as the lessons) and saved locally as a recommendation.
 */
export default async function PlacementPage({ params }: PageProps<"/[lang]/placement/[courseId]">) {
  const { dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <Suspense fallback={<div className="mx-auto h-80 max-w-2xl animate-pulse rounded-2xl bg-muted" aria-hidden="true" />}>
        <PlacementContent params={params} />
      </Suspense>
    </PageShell>
  );
}

async function PlacementContent({ params }: { params: Params }) {
  const { courseId } = await params;
  const placement = getPlacement(courseId);
  if (!placement) notFound();
  const { locale } = await getDictionary();
  return <PlacementFlow placement={localizePlacement(placement, locale)} />;
}
