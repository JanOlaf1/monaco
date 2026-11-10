import { FirstTimeHome } from "@/components/home/first-time-home";
import { ReturningHome } from "@/components/home/returning-home";
import { PageShell } from "@/components/layout/page-shell";
import { getDictionary } from "@/lib/i18n/server";

/**
 * Home. Both variants are rendered; CSS shows one based on
 * <html data-learner>, which an inline script sets before first paint from
 * locally stored progress (no flash, no hydration mismatch). The first-time
 * variant is fully server-rendered; the returning one fills in from storage.
 */
export default async function HomePage() {
  const { locale, dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <div data-show-for="new">
        <FirstTimeHome locale={locale} dict={dict} />
      </div>
      <div data-show-for="returning">
        <ReturningHome />
      </div>
    </PageShell>
  );
}
