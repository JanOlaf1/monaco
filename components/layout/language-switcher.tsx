"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE_COOKIE, locales, localeNames, switchLocaleInPath, type Locale } from "@/lib/i18n/config";

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

function LanguageSwitcherView({ pathname }: { pathname: string }) {
  const { locale, dict } = useI18n();
  return (
    <div
      role="group"
      aria-label={dict.nav.language}
      className="flex h-8 items-center rounded-md border border-line bg-surface p-0.5"
    >
      {locales.map((option) => {
        const active = option === locale;
        return (
          <Link
            key={option}
            href={switchLocaleInPath(pathname, option)}
            hrefLang={option}
            lang={option}
            scroll={false}
            aria-current={active ? "true" : undefined}
            title={localeNames[option]}
            onClick={() => rememberLocale(option)}
            className={cn(
              "inline-flex h-full items-center rounded px-2 text-xs font-semibold uppercase tracking-wide transition-colors",
              active ? "bg-muted text-fg" : "text-fg-subtle hover:text-fg",
            )}
          >
            <span aria-hidden="true">{option}</span>
            <span className="sr-only">{localeNames[option]}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function LanguageSwitcher() {
  const { locale } = useI18n();
  return <LanguageSwitcherView pathname={usePathname() ?? `/${locale}`} />;
}

/** Rendered while the pathname is unknown; links to the other locale's home page. */
export function LanguageSwitcherFallback() {
  const { locale } = useI18n();
  return <LanguageSwitcherView pathname={`/${locale}`} />;
}
