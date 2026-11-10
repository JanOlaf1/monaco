/**
 * Locale configuration. To add a language:
 *  1. Add its code to `locales`.
 *  2. Add a dictionary in `lib/i18n/dictionaries/<code>.ts` and register it in
 *     `lib/i18n/dictionaries/index.ts` (TypeScript enforces the same shape).
 *  3. Add translations to course content (`LocalizedText` fields). Missing
 *     content falls back to `defaultLocale` at runtime via `localize()`.
 */
export const locales = ["en", "fi"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie used by `proxy.ts` to remember the user's language choice. */
export const LOCALE_COOKIE = "cl_locale";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fi: "Suomi",
};

/** BCP 47 tags used for Intl formatting. */
export const localeTags: Record<Locale, string> = {
  en: "en-GB",
  fi: "fi-FI",
};

export function hasLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Text that exists in every supported locale. */
export type LocalizedText = Record<Locale, string>;

/** Resolve localized content, falling back to the default locale. */
export function localize(text: Partial<LocalizedText> | undefined, locale: Locale): string {
  if (!text) return "";
  return text[locale] ?? text[defaultLocale] ?? "";
}

/** Replace the locale prefix of a pathname, e.g. `/en/courses` -> `/fi/courses`. */
export function switchLocaleInPath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (hasLocale(segments[1])) {
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  }
  return `/${locale}${pathname === "/" ? "" : pathname}`;
}
