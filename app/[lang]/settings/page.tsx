import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { OfflineInfo } from "@/components/pwa/offline-info";
import { BackupPanel } from "@/components/settings/backup-panel";
import { InstallCard } from "@/components/settings/install-card";
import { OfflineStatus } from "@/components/settings/offline-status";
import { ThemeChoice } from "@/components/settings/theme-choice";
import { ButtonLink } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.settings.title };
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 id={`${id}-title`} className="text-base font-semibold">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Install, offline, appearance, backup and account options. Everything here is optional. */
export default async function SettingsPage() {
  const { locale, dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.settings.title}</h1>
        <p className="mt-2 text-fg-muted">{dict.settings.intro}</p>
        <div className="mt-8 space-y-5">
          <Section id="install" title={dict.settings.installTitle}>
            <InstallCard />
          </Section>
          <Section id="backup" title={dict.backup.title}>
            <BackupPanel />
          </Section>
          <Section id="offline" title={dict.settings.offlineTitle}>
            <OfflineStatus />
            <div className="mt-4">
              <OfflineInfo dict={dict} />
            </div>
          </Section>
          <Section id="appearance" title={dict.settings.appearanceTitle}>
            <ThemeChoice />
            <p className="mt-3 text-xs text-fg-subtle">{dict.settings.motionNote}</p>
          </Section>
          <Section id="account" title={dict.settings.accountTitle}>
            <p className="text-sm text-fg-muted">{dict.settings.accountBody}</p>
            <ButtonLink href={`/${locale}/account`} className="mt-3 h-11 sm:h-9">
              {dict.settings.accountLink}
            </ButtonLink>
          </Section>
          <Section id="storage" title={dict.settings.storageTitle}>
            <p className="text-sm text-fg-muted">{dict.settings.storageBody}</p>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}
