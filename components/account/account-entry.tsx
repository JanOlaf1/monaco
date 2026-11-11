"use client";

import { CircleUserRound } from "lucide-react";
import Link from "next/link";
import { useAccount } from "@/lib/account/hooks";
import { useI18n } from "@/lib/i18n/client";

/** Discreet header link to the optional account page. Hidden when accounts are not configured. */
export function AccountEntry() {
  const { locale, dict } = useI18n();
  const { available, user } = useAccount();
  if (!available) return null;
  return (
    <Link
      href={`/${locale}/account`}
      className="relative inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-fg-muted transition-colors hover:bg-hover hover:text-fg"
      aria-label={user?.email ? `${dict.nav.account}: ${user.email}` : dict.nav.account}
    >
      <CircleUserRound className="size-4" aria-hidden="true" />
      <span className="max-lg:hidden">{dict.nav.account}</span>
      {user ? <span className="absolute right-1 top-1 size-1.5 rounded-full bg-success" aria-hidden="true" /> : null}
    </Link>
  );
}
