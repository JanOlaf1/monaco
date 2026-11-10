import { localeTags, type Locale } from "./config";

export type PluralForms = { one: string; other: string } & Partial<
  Record<"zero" | "two" | "few" | "many", string>
>;

type Vars = Record<string, string | number>;

/** Replace `{name}` placeholders. Unknown placeholders are left untouched. */
export function format(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

const pluralRulesCache = new Map<Locale, Intl.PluralRules>();

function pluralRules(locale: Locale): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(localeTags[locale]);
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

/** Pick the plural form for `count` and interpolate `{count}` plus extra vars. */
export function plural(locale: Locale, forms: PluralForms, count: number, vars: Vars = {}): string {
  const category = pluralRules(locale).select(count) as keyof PluralForms;
  const template = forms[category] ?? forms.other;
  return format(template, { count, ...vars });
}

/** Format a local calendar date key (YYYY-MM-DD) for display. */
export function formatDateKey(locale: Locale, dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}
