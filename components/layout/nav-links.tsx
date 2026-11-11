"use client";

import { ChartColumn, Dumbbell, GraduationCap, Map, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

/** Primary destinations, shared by the header and the phone bottom bar. */
export function primaryNavItems(locale: Locale, dict: Dictionary): NavItem[] {
  return [
    { href: `/${locale}`, label: dict.nav.learn, icon: GraduationCap, match: (p) => p === `/${locale}` },
    {
      href: `/${locale}/courses`,
      label: dict.nav.courses,
      icon: Map,
      match: (p) => p.startsWith(`/${locale}/courses`) || p.startsWith(`/${locale}/placement`),
    },
    {
      href: `/${locale}/practice`,
      label: dict.nav.practice,
      icon: Dumbbell,
      match: (p) => p.startsWith(`/${locale}/practice`),
    },
    {
      href: `/${locale}/progress`,
      label: dict.nav.progress,
      icon: ChartColumn,
      match: (p) =>
        p.startsWith(`/${locale}/progress`) || p.startsWith(`/${locale}/plan`) || p.startsWith(`/${locale}/collection`),
    },
  ];
}

export function settingsNavItem(locale: Locale, dict: Dictionary): NavItem {
  return {
    href: `/${locale}/settings`,
    label: dict.nav.settings,
    icon: Settings,
    match: (p) => p.startsWith(`/${locale}/settings`) || p.startsWith(`/${locale}/account`),
  };
}

function NavLinksView({ pathname }: { pathname: string | null }) {
  const { locale, dict } = useI18n();
  return (
    // Phones use the bottom bar (MobileNav) instead.
    <nav aria-label={dict.nav.primary} className="flex items-center gap-0.5 max-sm:hidden">
      {primaryNavItems(locale, dict).map(({ href, label, icon: Icon, match }) => {
        const active = pathname ? match(pathname) : false;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
              active ? "bg-muted text-fg" : "text-fg-muted hover:bg-hover hover:text-fg",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {/* Four destinations fit with labels from lg; tablets show icons with tooltips. */}
            <span className="max-lg:hidden">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function NavLinks() {
  return <NavLinksView pathname={usePathname()} />;
}

/** Rendered while the pathname is unknown (e.g. prerendering a fallback shell). */
export function NavLinksFallback() {
  return <NavLinksView pathname={null} />;
}

/** Settings in the header on larger screens (phones reach it from the bottom bar). */
export function SettingsLink() {
  const { locale, dict } = useI18n();
  const { href, label, icon: Icon } = settingsNavItem(locale, dict);
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-hover hover:text-fg max-sm:hidden"
    >
      <Icon className="size-4" aria-hidden="true" />
    </Link>
  );
}
