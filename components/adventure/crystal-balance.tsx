"use client";

import Link from "next/link";
import { Gem } from "lucide-react";
import { CRYSTAL_NAME } from "@/lib/adventure/catalog";
import { crystalBalance } from "@/lib/adventure/engine";
import { useAdventure } from "@/lib/adventure/hooks";
import { adventureDictionary } from "@/lib/i18n/adventure";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";

export function CrystalBalance() {
  const { locale } = useI18n();
  const { value, hydrated, readOnly } = useAdventure();
  const text = adventureDictionary(locale);
  return <Link href={`/${locale}/collection`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-hover" title={text.openCollection}>
    <Gem className="size-4 text-accent" aria-hidden="true" />
    <span data-testid="crystal-balance">{hydrated ? format(text.balance, { count: readOnly ? "?" : crystalBalance(value), currency: CRYSTAL_NAME[locale] }) : CRYSTAL_NAME[locale]}</span>
  </Link>;
}
