"use client";

import { ChartColumn, GraduationCap, Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";

function NavLinksView({ pathname }: { pathname: string | null }) {
  const { locale, dict } = useI18n();
  const links = [
    { href: `/${locale}`, label: dict.nav.learn, icon: GraduationCap, match: (p: string) => p === `/${locale}` },
    {
      href: `/${locale}/courses`,
      label: dict.nav.courses,
      icon: Map,
      match: (p: string) => p.startsWith(`/${locale}/courses`),
    },
    {
      href: `/${locale}/progress`,
      label: dict.nav.progress,
      icon: ChartColumn,
      match: (p: string) => p.startsWith(`/${locale}/progress`) || p.startsWith(`/${locale}/plan`),
    },
  ];
  return (
    <nav aria-label={dict.nav.primary} className="flex items-center gap-0.5">
      {links.map(({ href, label, icon: Icon, match }) => {
        const active = pathname ? match(pathname) : false;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium transition-colors sm:px-2.5",
              active ? "bg-muted text-fg" : "text-fg-muted hover:bg-hover hover:text-fg",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="max-sm:hidden">{label}</span>
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
