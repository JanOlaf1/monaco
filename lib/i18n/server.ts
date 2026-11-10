import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./config";
import { getDictionaryFor, type Dictionary } from "./dictionaries";

/**
 * Server-only helpers. `next/root-params` reads the `[lang]` segment of the
 * root layout, so callers don't need to pass the locale around.
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: getDictionaryFor(locale) };
}
