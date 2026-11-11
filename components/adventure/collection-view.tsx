"use client";

import { useState } from "react";
import { Award, Gem } from "lucide-react";
import { Mascot } from "@/components/mascot/mascot";
import { Button, ButtonLink } from "@/components/ui/button";
import { COSMETICS, CRYSTAL_NAME, CRYSTAL_REWARDS, type Cosmetic, type CosmeticId } from "@/lib/adventure/catalog";
import { adventureAchievements, crystalBalance, ownedCosmetics } from "@/lib/adventure/engine";
import { adventureActions, useAdventure } from "@/lib/adventure/hooks";
import type { AdventureEvent } from "@/lib/adventure/state";
import { cn } from "@/lib/cn";
import { adventureDictionary } from "@/lib/i18n/adventure";
import { useI18n } from "@/lib/i18n/client";
import { format, formatDateKey } from "@/lib/i18n/format";
import { useCatalog } from "@/lib/learner/catalog-context";
import { ArchipelagoMap } from "./archipelago-map";
import { CrystalBalance } from "./crystal-balance";
import { QuestCard } from "./quest-card";

export function CollectionView() {
  const { locale } = useI18n();
  const text = adventureDictionary(locale);
  const { value, hydrated, readOnly, conflictingPurchases, sessionOnly } = useAdventure();
  const { courses } = useCatalog();
  const [preview, setPreview] = useState<CosmeticId | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  const balance = crystalBalance(value);
  const owned = ownedCosmetics(value);
  const previewItem = COSMETICS.find((item) => item.id === preview);
  const equipped = previewItem ? { ...value.equipped, [previewItem.slot]: previewItem.id } : value.equipped;
  const eventSource = (event: AdventureEvent): string | undefined => {
    if (event.kind === "purchase") return COSMETICS.find((item) => item.id === event.itemId)?.title[locale];
    if (event.kind === "exercise" || event.kind === "review") {
      return courses.flatMap((course) => course.chapters.flatMap((chapter) => chapter.exercises)).find((exercise) => exercise.id === event.sourceId)?.title;
    }
    if (event.kind === "chapter") {
      const [courseId, chapterId] = event.sourceId.split(":");
      return courses.find((course) => course.id === courseId)?.chapters.find((chapter) => chapter.id === chapterId)?.title;
    }
    return undefined;
  };

  async function buy(item: Cosmetic) {
    setPending(true); setNotice(""); setError(false);
    try {
      const result = await adventureActions.purchase(item.id);
      const success = result === "purchased" || result === "owned";
      setNotice(success ? format(text.purchased, { item: item.title[locale] }) : text.purchaseFailed);
      setError(!success);
    } catch { setNotice(text.purchaseFailed); setError(true); }
    finally { setPending(false); }
  }
  async function wear(item: Cosmetic) {
    setPending(true); setNotice(""); setError(false);
    try { await adventureActions.equip(value.equipped[item.slot] === item.id ? null : item.id, item.slot); setPreview(null); }
    catch { setNotice(text.saveFailed); setError(true); }
    finally { setPending(false); }
  }

  return <div className="mt-7 space-y-6">
    {readOnly ? <p role="status" className="rounded-xl border border-line bg-surface p-4 text-sm text-fg-muted">{text.futureVersionNotice}</p> : null}
    {conflictingPurchases.length > 0 ? <p role="status" className="rounded-xl border border-line bg-surface p-4 text-sm text-fg-muted">{text.conflictingPurchasesNotice}</p> : null}
    {sessionOnly ? <p role="status" className="rounded-xl border border-line bg-surface p-4 text-sm text-fg-muted">{text.sessionOnlyNotice}</p> : null}
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card" aria-labelledby="explorer-kit-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="explorer-kit-title" className="text-base font-semibold">{text.cosmetics}</h2><p className="mt-1 text-sm text-fg-muted">{text.cosmeticsBody}</p></div>
        <CrystalBalance />
      </div>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center rounded-xl bg-muted/50 p-4" data-testid="avatar-preview">
          <Mascot size={160} cosmetics={equipped} label={text.avatar} />
          <p className="mt-3 min-h-5 text-center text-xs text-fg-muted" role="status">{previewItem ? format(text.previewing, { item: previewItem.title[locale] }) : text.equipped}</p>
          {preview ? <Button className="mt-2" size="sm" variant="ghost" onClick={() => setPreview(null)}>{text.resetPreview}</Button> : null}
        </div>
        <ul className="grid gap-3 sm:grid-cols-2" aria-busy={!hydrated || pending}>
          {COSMETICS.map((item) => {
            const hasItem = owned.includes(item.id);
            const wearing = value.equipped[item.slot] === item.id;
            return <li key={item.id} data-testid={`cosmetic-${item.id}`} data-owned={hasItem} data-equipped={wearing} className={cn("rounded-xl border p-4", wearing ? "border-accent/50 bg-accent-soft" : "border-line")}>
              <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold">{item.title[locale]}</h3><span className="flex items-center gap-1 text-xs font-medium tabular-nums"><Gem className="size-3.5 text-accent" aria-hidden="true" />{item.cost}</span></div>
              <p className="mt-1 min-h-9 text-xs leading-relaxed text-fg-muted">{item.description[locale]}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" disabled={!hydrated} aria-label={format(text.previewLabel, { item: item.title[locale] })} aria-pressed={preview === item.id} onClick={() => setPreview(item.id)}>{text.preview}</Button>
                {hasItem ? <Button size="sm" disabled={pending || !hydrated || readOnly} aria-label={format(wearing ? text.unequipLabel : text.equipLabel, { item: item.title[locale] })} onClick={() => void wear(item)}>{wearing ? text.unequip : text.equip}</Button> :
                  <Button size="sm" disabled={pending || !hydrated || readOnly || balance < item.cost} aria-label={format(text.unlockLabel, { item: item.title[locale], cost: item.cost })} onClick={() => void buy(item)}>{format(text.unlock, { cost: item.cost })}</Button>}
              </div>
              <p className="mt-2 min-h-4 text-xs text-fg-muted">{!hydrated ? "" : hasItem ? wearing ? text.equipped : text.owned : balance < item.cost ? format(text.insufficient, { count: item.cost - balance }) : CRYSTAL_NAME[locale]}</p>
            </li>;
          })}
        </ul>
      </div>
      <p className={cn("mt-3 min-h-5 text-sm", error ? "text-danger" : "text-success")} role="status" aria-live="polite">{pending ? text.working : notice}</p>
      <details className="mt-2 text-xs text-fg-muted"><summary className="cursor-pointer font-medium text-fg">{text.rules}</summary><p className="mt-2 leading-relaxed">{format(text.rulesBody, CRYSTAL_REWARDS)}</p><p className="mt-2 leading-relaxed">{text.reviewRule}</p></details>
      <p className="mt-3 text-xs leading-relaxed text-fg-muted">{text.localNotice}</p>
    </section>

    <div className="grid items-start gap-5 lg:grid-cols-[1fr_2fr]">
      <QuestCard />
      <section data-testid="adventure-achievements" className="rounded-2xl border border-line bg-surface p-5 shadow-card" aria-labelledby="archipelago-achievements-title">
        <h2 id="archipelago-achievements-title" className="text-base font-semibold">{text.achievements}</h2>
        <p className="mt-1 text-xs text-fg-muted">{text.achievementsBody}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {adventureAchievements(value).map((achievement) => <li key={achievement.id} data-achievement={achievement.id} data-earned={hydrated && achievement.earned ? "true" : "false"} className={cn("rounded-xl border p-3", achievement.earned && hydrated ? "border-line" : "border-dashed border-line")}>
            <div className="flex items-center gap-2"><Award className={cn("size-5", hydrated && achievement.earned ? "text-achievement" : "text-fg-muted")} aria-hidden="true" /><h3 className="text-sm font-medium">{achievement.title[locale]}</h3></div>
            <p className="mt-1 text-xs text-fg-muted">{achievement.description[locale]}</p>
            <p className="mt-2 text-xs text-fg-muted">{hydrated && achievement.earned && achievement.at ? format(text.earned, { date: formatDateKey(locale, achievement.at.slice(0, 10)) }) : text.notYet}</p>
          </li>)}
        </ul>
        <ButtonLink href={`/${locale}/progress`} variant="ghost" size="sm" className="mt-4">{text.previousAchievements}</ButtonLink>
      </section>
    </div>
    <ArchipelagoMap />
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-4 accent-accent" checked={value.showMessages} disabled={!hydrated || pending || readOnly} onChange={(event) => { const checked = event.target.checked; setPending(true); void adventureActions.setShowMessages(checked).catch(() => { setNotice(text.saveFailed); setError(true); }).finally(() => setPending(false)); }} /><span><span className="text-sm font-medium">{text.messages}</span><span className="mt-1 block text-xs text-fg-muted">{text.messagesBody}</span></span></label>
      <details className="mt-5"><summary className="cursor-pointer text-sm font-medium">{text.ledger}</summary>
        <ol className="mt-3 space-y-2 text-xs">
          {Object.values(value.events).filter((event) => "amount" in event).sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id)).slice(0, 30).map((event) => "amount" in event ? <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2"><span>{text.historyKinds[event.kind]}{eventSource(event) ? <span> · {eventSource(event)}</span> : null} <span className="text-fg-muted">· {formatDateKey(locale, event.at.slice(0, 10))}</span></span><span className="font-medium tabular-nums">{event.amount > 0 ? "+" : ""}{event.amount}</span></li> : null)}
          {Object.values(value.events).every((event) => !("amount" in event)) ? <li className="text-fg-muted">{text.ledgerEmpty}</li> : null}
        </ol>
      </details>
    </section>
  </div>;
}
