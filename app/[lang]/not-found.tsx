import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const { locale, dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="font-mono text-sm text-fg-subtle">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{dict.notFound.title}</h1>
        <p className="mt-2 text-fg-muted">{dict.notFound.body}</p>
        <ButtonLink href={`/${locale}`} variant="primary" className="mt-6">
          {dict.notFound.home}
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
      </div>
    </PageShell>
  );
}
