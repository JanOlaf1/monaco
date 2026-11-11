"use client";

import { useEffect } from "react";
import { reconcileAdventure, useAdventure } from "@/lib/adventure/hooks";
import { useCatalog } from "@/lib/learner/catalog-context";
import { useGamification, useProgress } from "@/lib/learner/hooks";

/** Backfill only recorded learning accomplishments, never visit activity. */
export function AdventureSync() {
  const { gamification: catalog } = useCatalog();
  const progress = useProgress();
  const gamification = useGamification();
  const adventure = useAdventure();
  useEffect(() => {
    if (progress.hydrated && gamification.hydrated && adventure.hydrated && !adventure.readOnly && gamification.value.migratedProgress) {
      void reconcileAdventure({ progress: progress.value, xpAwards: gamification.value.awards, catalog }).catch((error: unknown) => {
        console.warn("[adventure] Could not reconcile local rewards:", error);
      });
    }
  }, [progress.hydrated, progress.value, gamification.hydrated, gamification.value, adventure.hydrated, adventure.readOnly, catalog]);
  return null;
}
