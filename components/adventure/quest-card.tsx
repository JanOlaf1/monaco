"use client";

import { useEffect, useReducer, useState } from "react";
import { Check, Compass } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { CRYSTAL_REWARDS } from "@/lib/adventure/catalog";
import { questProgress } from "@/lib/adventure/engine";
import { adventureActions, useAdventure } from "@/lib/adventure/hooks";
import type { QuestKind } from "@/lib/adventure/periods";
import { adventureDictionary } from "@/lib/i18n/adventure";
import { useI18n } from "@/lib/i18n/client";
import { format, formatDateKey } from "@/lib/i18n/format";

/** Re-evaluate dates while a page remains open, as well as on returning to the tab. */
function usePeriodClock() {
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    const timer = setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
}

function Quest({ kind }: { kind: QuestKind }) {
  const { locale } = useI18n();
  const text = adventureDictionary(locale);
  const { value, hydrated, readOnly } = useAdventure();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  usePeriodClock();
  const quest = hydrated && !readOnly ? questProgress(value, kind, new Date()) : null;
  const join = async () => {
    setPending(true); setFailed(false);
    try { await adventureActions.enrollQuest(kind); } catch { setFailed(true); }
    finally { setPending(false); }
  };
  // `end` is exclusive; show the last calendar day included in the quest.
  const lastDay = quest ? new Date(new Date(quest.end).getTime() - 1).toISOString().slice(0, 10) : "";
  return <section data-testid={`quest-${kind}`} className="rounded-xl border border-line p-4" aria-busy={!hydrated || pending}>
    <div className="flex items-center gap-2">
      {quest?.completed ? <Check className="size-4 text-success" aria-hidden="true" /> : <Compass className="size-4 text-accent" aria-hidden="true" />}
      <h3 className="text-sm font-semibold">{text[kind]}</h3>
    </div>
    <p className="mt-1 text-xs leading-relaxed text-fg-muted">{kind === "daily" ? text.dailyBody : text.weeklyBody}</p>
    {quest ? <>
      <p className="mt-2 text-xs text-fg-muted">{format(text.questDates, { start: formatDateKey(locale, quest.start.slice(0, 10)), end: formatDateKey(locale, lastDay) })}</p>
      <p className="mt-2 text-sm font-medium" role="status">{quest.completed ? text.questComplete : format(text.questProgress, { done: quest.done, target: quest.target, reward: CRYSTAL_REWARDS[kind] })}</p>
      {quest.enrolled ? <p className="mt-2 text-xs text-fg-muted">{quest.completed ? null : text.questActive}</p> :
        <Button className="mt-3" size="sm" disabled={pending || readOnly} onClick={() => void join()}>{pending ? text.working : kind === "daily" ? text.joinDaily : text.joinWeekly}</Button>}
    </> : readOnly ? <><p className="mt-3 text-xs text-fg-muted">{text.futureVersionNotice}</p><Button size="sm" className="mt-3" disabled>{kind === "daily" ? text.joinDaily : text.joinWeekly}</Button></> : <div className="mt-3 h-8 rounded bg-muted" />}
    {failed ? <p className="mt-2 text-xs text-danger" role="alert">{text.saveFailed}</p> : null}
  </section>;
}

export function QuestCard() {
  const { locale } = useI18n();
  const text = adventureDictionary(locale);
  return <section className="rounded-2xl border border-line bg-surface p-5 shadow-card" aria-label={text.daily}>
    <Quest kind="daily" />
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-medium text-fg-muted">{text.questDetails}</summary>
      <p className="my-3 text-xs leading-relaxed text-fg-muted">{text.questIntro}</p>
      <Quest kind="weekly" />
      <p className="mt-3 text-xs leading-relaxed text-fg-muted">{text.reviewRule}</p>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">{text.utcNote}</p>
    </details>
    <ButtonLink href={`/${locale}/courses`} variant="ghost" size="sm" className="mt-3">{text.questContinue}</ButtonLink>
  </section>;
}
