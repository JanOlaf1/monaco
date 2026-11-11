"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";
import { chapterMessage, type CHAPTER_MESSAGES } from "@/lib/adventure/engine";
import type { CosmeticId, CosmeticSlot } from "@/lib/adventure/catalog";
import { useAdventure } from "@/lib/adventure/hooks";
import { subscribeRewards } from "@/lib/gamification/celebrations";
import { adventureDictionary } from "@/lib/i18n/adventure";
import { useI18n } from "@/lib/i18n/client";

/** A dismissible, original authored message, only after a newly completed chapter. */
export function ChapterMessage() {
  const { value, hydrated, readOnly } = useAdventure();
  return hydrated && !readOnly && value.showMessages ? <EnabledChapterMessage cosmetics={value.equipped} /> : null;
}

function EnabledChapterMessage({ cosmetics }: { cosmetics: Partial<Record<CosmeticSlot, CosmeticId>> }) {
  const { locale } = useI18n();
  const text = adventureDictionary(locale);
  const [message, setMessage] = useState<(typeof CHAPTER_MESSAGES)[number] | null>(null);
  useEffect(() => subscribeRewards((rewards) => {
    if (rewards.chapterCompleted) {
      const { courseId, chapterId } = rewards.chapterCompleted;
      setMessage(chapterMessage(courseId, chapterId));
    }
  }), []);

  if (!message) return null;
  return <aside className="fixed inset-x-3 top-16 z-40 rounded-2xl border border-line bg-surface p-4 shadow-lg sm:left-4 sm:right-auto sm:w-80" aria-label={text.messageHeading} data-testid="chapter-message">
    <div className="flex items-start gap-3">
      <Mascot size={48} mood="celebrating" animate cosmetics={cosmetics} />
      <div className="min-w-0 flex-1" role="status"><p className="text-xs font-semibold text-accent">{text.messageHeading}</p><p className="mt-1 text-sm leading-relaxed">{message.text[locale]}</p></div>
      <Button variant="ghost" size="icon" aria-label={text.dismiss} onClick={() => setMessage(null)}><X aria-hidden="true" /></Button>
    </div>
  </aside>;
}
