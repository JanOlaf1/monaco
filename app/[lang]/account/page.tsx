import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/account-panel";
import { PageShell } from "@/components/layout/page-shell";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.account.title, robots: { index: false } };
}

/** Optional account: sign in to sync skill levels across devices. Learning never requires it. */
export default async function AccountPage() {
  const { dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.account.title}</h1>
        <p className="mt-2 text-fg-muted">{dict.account.intro}</p>
        <AccountPanel />
      </div>
    </PageShell>
  );
}
