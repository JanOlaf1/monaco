"use client";

import { Target, Trophy, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mascot } from "@/components/mascot/mascot";
import { AchievementMedal } from "@/components/gamification/achievement-badge";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/gamification/achievements";
import { subscribeRewards } from "@/lib/gamification/celebrations";
import type { Rewards } from "@/lib/gamification/engine";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { useCatalog } from "@/lib/learner/catalog-context";

type Toast =
  | { id: number; kind: "level"; level: number }
  | { id: number; kind: "achievement"; achievement: AchievementId }
  | { id: number; kind: "chapter"; title: string }
  | { id: number; kind: "goal" };

const LIFETIME_MS = 6_500;
let nextId = 1;

/**
 * Small, dismissible notifications for meaningful milestones. They sit in a
 * corner, never cover the editor's text area, never steal focus, and are
 * announced politely to screen readers.
 */
export function CelebrationToasts() {
  const { dict } = useI18n();
  const { courses } = useCatalog();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const active = timers.current;
    const dismissLater = (id: number) => {
      active.set(
        id,
        setTimeout(() => {
          active.delete(id);
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, LIFETIME_MS),
      );
    };
    const unsubscribe = subscribeRewards((rewards: Rewards) => {
      const items: Toast[] = [];
      if (rewards.levelAfter > rewards.levelBefore) items.push({ id: nextId++, kind: "level", level: rewards.levelAfter });
      if (rewards.chapterCompleted) {
        const chapter = courses
          .find((course) => course.id === rewards.chapterCompleted?.courseId)
          ?.chapters.find((candidate) => candidate.id === rewards.chapterCompleted?.chapterId);
        if (chapter) items.push({ id: nextId++, kind: "chapter", title: chapter.title });
      }
      for (const achievement of rewards.achievements) items.push({ id: nextId++, kind: "achievement", achievement });
      if (rewards.dailyGoal?.reachedNow) items.push({ id: nextId++, kind: "goal" });
      if (!items.length) return;
      setToasts((current) => [...current, ...items].slice(-4));
      for (const item of items) dismissLater(item.id);
    });
    return () => {
      unsubscribe();
      for (const timer of active.values()) clearTimeout(timer);
      active.clear();
    };
  }, [courses]);

  const dismiss = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={dict.gamification.notifications}
      className="pointer-events-none fixed inset-x-3 bottom-20 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 lg:bottom-4"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} onDismiss={() => dismiss(toast.id)} label={dict.gamification.dismiss}>
          {toast.kind === "level" ? (
            <>
              <Mascot mood="celebrating" size={44} animate />
              <p className="text-sm font-semibold">{format(dict.gamification.levelUp, { level: toast.level })}</p>
            </>
          ) : null}
          {toast.kind === "achievement" ? (
            <>
              <AchievementMedal
                definition={ACHIEVEMENTS.find((definition) => definition.id === toast.achievement)!}
                earned
                size="sm"
              />
              <div>
                <p className="text-xs font-medium text-achievement">{dict.gamification.achievementUnlocked}</p>
                <p className="text-sm font-semibold">{dict.achievements.items[toast.achievement].title}</p>
              </div>
            </>
          ) : null}
          {toast.kind === "chapter" ? (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-xp-soft text-xp">
                <Trophy className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium text-xp">{dict.gamification.chapterComplete}</p>
                <p className="text-sm font-semibold">{toast.title}</p>
              </div>
            </>
          ) : null}
          {toast.kind === "goal" ? (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-success-soft text-success">
                <Target className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold">{dict.gamification.dailyGoalReached}</p>
            </>
          ) : null}
        </ToastCard>
      ))}
    </div>
  );
}

function ToastCard({ children, onDismiss, label }: { children: ReactNode; onDismiss: () => void; label: string }) {
  return (
    <div className="rise-in pointer-events-auto flex w-full max-w-xs items-center gap-3 rounded-xl border border-line bg-surface py-2.5 pl-3 pr-2 shadow-lg sm:w-80">
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={label}
        className="rounded-md p-1 text-fg-subtle hover:bg-hover hover:text-fg"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
