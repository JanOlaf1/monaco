import Link from "next/link";
import { Suspense } from "react";
import { AccountEntry } from "@/components/account/account-entry";
import { HeaderStats } from "@/components/gamification/header-stats";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitcher, LanguageSwitcherFallback } from "./language-switcher";
import { LogoMark } from "./logo";
import { NavLinks, NavLinksFallback } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="sticky top-0 z-30 h-(--header-h) border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <Link href={`/${locale}`} className="flex items-center gap-2 rounded-md pr-1" aria-label={dict.meta.siteName}>
          <LogoMark className="size-7" />
          <span className="text-[15px] font-semibold tracking-tight max-md:hidden">{dict.meta.siteName}</span>
        </Link>
        <div className="mx-1 h-5 w-px bg-line max-md:hidden" aria-hidden="true" />
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <HeaderStats />
          <Suspense fallback={<LanguageSwitcherFallback />}>
            <LanguageSwitcher />
          </Suspense>
          <ThemeToggle />
          <AccountEntry />
        </div>
      </div>
    </header>
  );
}
