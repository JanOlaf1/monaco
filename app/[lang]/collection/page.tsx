import type { Metadata } from "next";
import { CollectionView } from "@/components/adventure/collection-view";
import { PageShell } from "@/components/layout/page-shell";
import { Mascot } from "@/components/mascot/mascot";
import { adventureDictionary } from "@/lib/i18n/adventure";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDictionary();
  return { title: adventureDictionary(locale).collection };
}

export default async function CollectionPage() {
  const { dict, locale } = await getDictionary();
  const text = adventureDictionary(locale);
  return <PageShell dict={dict}>
    <div className="flex items-center gap-4"><Mascot mood="welcome" size={72} /><div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{text.collection}</h1><p className="mt-1 max-w-2xl text-sm text-fg-muted">{text.collectionIntro}</p></div></div>
    <CollectionView />
  </PageShell>;
}
