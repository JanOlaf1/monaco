"use client";

import { useMemo } from "react";
import { useCatalog } from "@/lib/learner/catalog-context";
import { useCompetency, useGamification, useProgress } from "@/lib/learner/hooks";
import { summarizeLearner } from "@/lib/learner/summary";
import { todayKey } from "@/lib/schedule/dates";

/** Learner summary from stored state. `hydrated` is false on the server and until storage loads. */
export function useLearnerSummary() {
  const { courses, gamification: catalog } = useCatalog();
  const progress = useProgress();
  const gamification = useGamification();
  const competency = useCompetency();
  const hydrated = progress.hydrated && gamification.hydrated && competency.hydrated;
  // The local date only matters once data has loaded on the client.
  const today = hydrated ? todayKey() : "2000-01-01";
  const summary = useMemo(
    () =>
      summarizeLearner({
        progress: progress.value,
        gamification: gamification.value,
        competency: competency.value,
        courses,
        catalog,
        today,
      }),
    [progress.value, gamification.value, competency.value, courses, catalog, today],
  );
  return {
    summary,
    hydrated,
    progress: progress.value,
    gamification: gamification.value,
    competency: competency.value,
    today,
  };
}
