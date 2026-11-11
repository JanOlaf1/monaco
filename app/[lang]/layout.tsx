import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AccountSync } from "@/components/account/account-sync";
import { CelebrationToasts } from "@/components/gamification/celebration-toasts";
import { AdventureSync } from "@/components/adventure/adventure-sync";
import { ChapterMessage } from "@/components/adventure/chapter-message";
import { InlineScript } from "@/components/layout/inline-script";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { PwaNotices } from "@/components/pwa/pwa-provider";
import { LearnerSync } from "@/components/learner/learner-sync";
import { getCatalog, getSkillCatalog } from "@/lib/content/localize";
import { I18nProvider } from "@/lib/i18n/client";
import { locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { LEARNER_SCRIPT } from "@/lib/learner/boot-script";
import { CatalogProvider } from "@/lib/learner/catalog-context";
import { THEME_SCRIPT } from "@/lib/theme/script";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    title: { default: `${dict.meta.siteName} — ${dict.meta.tagline}`, template: `%s · ${dict.meta.siteName}` },
    description: dict.meta.description,
    applicationName: dict.meta.siteName,
    // The web app manifest comes from app/manifest.ts.
    appleWebApp: { capable: true, title: dict.meta.siteName, statusBarStyle: "default" },
    icons: {
      icon: [
        { url: "/icons/icon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  // viewport-fit=cover lets the phone bottom bar pad itself for the home indicator.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#11141a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, dict } = await getDictionary();
  return (
    <html
      lang={locale}
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <InlineScript html={THEME_SCRIPT + LEARNER_SCRIPT} />
      </head>
      <body className="min-h-full">
        <I18nProvider locale={locale} dict={dict}>
          <CatalogProvider courses={getCatalog(locale)} skills={getSkillCatalog(locale)}>
            <a
              href="#main"
              className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
            >
              {dict.nav.skipToContent}
            </a>
            <SiteHeader locale={locale} dict={dict} />
            {children}
            <Suspense fallback={null}>
              <MobileNav />
            </Suspense>
            <PwaNotices />
            <LearnerSync />
            <AccountSync />
            <AdventureSync />
            <CelebrationToasts />
            <ChapterMessage />
          </CatalogProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
