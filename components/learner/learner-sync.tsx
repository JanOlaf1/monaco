"use client";

import { useEffect, useLayoutEffect } from "react";
import { useCatalog } from "@/lib/learner/catalog-context";
import { migrateLearnerData, useGamification, useProgress } from "@/lib/learner/hooks";
import { hasLearnerActivity } from "@/lib/learner/summary";

/**
 * Mounted once in the root layout:
 * - runs the one-time XP backfill for progress saved before gamification;
 * - keeps <html data-learner> in sync with stored data (the inline boot
 *   script sets it before paint; this corrects it after storage changes).
 */
export function LearnerSync() {
  const { gamification: catalog } = useCatalog();
  const progress = useProgress();
  const gamification = useGamification();
  const hydrated = progress.hydrated && gamification.hydrated;
  const migrated = gamification.value.migratedProgress;
  const returning = hydrated && hasLearnerActivity(progress.value, gamification.value);

  useEffect(() => {
    if (hydrated && !migrated) migrateLearnerData(catalog);
  }, [hydrated, migrated, catalog]);

  useLayoutEffect(() => {
    if (hydrated) document.documentElement.setAttribute("data-learner", returning ? "returning" : "new");
  }, [hydrated, returning]);

  return null;
}
