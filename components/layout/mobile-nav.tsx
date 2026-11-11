"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { primaryNavItems, settingsNavItem } from "./nav-links";

/** The coding workspace (/[lang]/courses/[course]/[exercise]) has its own bottom Run/Check bar. */
export function isWorkspacePath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments[1] === "courses" && segments.length >= 4;
}

/**
 * Bottom navigation for phones: large touch targets within thumb reach.
 * Larger screens keep the header navigation; the workspace hides this bar.
 * Only one of the two navigations is visible at a time, so they share a label.
 */
export function MobileNav() {
  const { locale, dict } = useI18n();
  const pathname = usePathname() ?? "";
  if (isWorkspacePath(pathname)) return null;
  const items = [...primaryNavItems(locale, dict), settingsNavItem(locale, dict)];
  return (
    <>
      {/* Keeps the end of the page clear of the fixed bar. */}
      <div aria-hidden="true" className="h-[calc(3.5rem+env(safe-area-inset-bottom))] sm:hidden" />
      <nav
        aria-label={dict.nav.primary}
        data-testid="mobile-nav"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-surface/85 sm:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {items.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 text-[11px] font-medium leading-tight transition-colors",
                    active ? "text-accent" : "text-fg-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
