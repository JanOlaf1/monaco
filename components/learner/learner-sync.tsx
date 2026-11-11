"use client";

import { useEffect, useLayoutEffect } from "react";
import { useCatalog } from "@/lib/learner/catalog-context";
import { migrateLearnerData, useCompetency, useGamification, useProgress } from "@/lib/learner/hooks";
import { hasLearnerActivity } from "@/lib/learner/summary";

/**
 * Mounted once in the root layout:
 * - runs the one-time migrations for data saved by earlier versions (XP
 *   backfill, marking learners who were active before proficiency levels);
 * - keeps <html data-learner> in sync with stored data (the inline boot
 *   script sets it before paint; this corrects it after storage changes).
 */
export function LearnerSync() {
  const { gamification: catalog } = useCatalog();
  const progress = useProgress();
  const gamification = useGamification();
  const competency = useCompetency();
  const hydrated = progress.hydrated && gamification.hydrated && competency.hydrated;
  const needsMigration = !gamification.value.migratedProgress || !competency.value.migrated;
  const returning = hydrated && hasLearnerActivity(progress.value, gamification.value, competency.value);

  useEffect(() => {
    if (hydrated && needsMigration) migrateLearnerData(catalog);
  }, [hydrated, needsMigration, catalog]);

  useLayoutEffect(() => {
    if (hydrated) document.documentElement.setAttribute("data-learner", returning ? "returning" : "new");
  }, [hydrated, returning]);

  return null;
}
