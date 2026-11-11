"use client";

import { adventureStore, updateAdventure } from "@/lib/adventure/store";
import {
  competencyStore,
  draftsStore,
  gamificationStore,
  practiceStore,
  progressStore,
  scheduleStore,
} from "@/lib/learner/stores";
import {
  backupFileName,
  createBackup,
  mergeAdventureForImport,
  mergeCompetencyStates,
  mergeDraftsStates,
  mergeGamificationStates,
  mergePracticeStates,
  mergeProgressStates,
  mergeScheduleStates,
  planImport,
  type BackupData,
  type ImportContext,
  type ImportSummary,
} from "./backup";

const learnerStores = [progressStore, gamificationStore, competencyStore, practiceStore, draftsStore, scheduleStore];

/** This browser's learning data, once every store has loaded (pending draft edits included). */
async function readCurrentData(): Promise<BackupData> {
  await Promise.all([...learnerStores.map((store) => store.whenHydrated()), adventureStore.whenHydrated()]);
  await draftsStore.flush();
  return {
    progress: progressStore.getSnapshot().value,
    gamification: gamificationStore.getSnapshot().value,
    competency: competencyStore.getSnapshot().value,
    adventure: adventureStore.getSnapshot().value,
    practice: practiceStore.getSnapshot().value,
    drafts: draftsStore.getSnapshot().value,
    schedule: scheduleStore.getSnapshot().value,
  };
}

/** A downloadable backup of local learning data. Account data and tokens are never included. */
export async function exportBackup(now = new Date()): Promise<{ fileName: string; json: string }> {
  const file = createBackup(await readCurrentData(), now);
  return { fileName: backupFileName(now), json: JSON.stringify(file, null, 2) };
}

/** What importing would change, without writing anything. */
export async function previewImport(incoming: Partial<BackupData>, context: ImportContext): Promise<ImportSummary> {
  return planImport(await readCurrentData(), incoming, context).summary;
}

export interface ImportResult {
  summary: ImportSummary;
  /** Crystals could not be restored (data from a newer app version is stored here). */
  adventureFailed: boolean;
}

/**
 * Merge a validated backup into this browser. Each store is merged against its
 * latest value, so nothing written in the meantime is lost, and only additive
 * merges are used: no existing entry is deleted.
 */
export async function applyImport(incoming: Partial<BackupData>, context: ImportContext): Promise<ImportResult> {
  const { summary } = planImport(await readCurrentData(), incoming, context);
  const { progress, gamification, competency, practice, drafts, schedule, adventure } = incoming;
  if (progress) progressStore.update((state) => mergeProgressStates(state, progress));
  if (gamification) gamificationStore.update((state) => mergeGamificationStates(state, gamification, context).state);
  if (competency) competencyStore.update((state) => mergeCompetencyStates(state, competency, context.recommend).state);
  if (practice) practiceStore.update((state) => mergePracticeStates(state, practice, context).state);
  if (drafts) draftsStore.update((state) => mergeDraftsStates(state, drafts).state);
  if (schedule) scheduleStore.update((state) => mergeScheduleStates(state, schedule).state);
  await Promise.all(learnerStores.map((store) => store.flush()));

  let adventureFailed = false;
  if (adventure) {
    try {
      await updateAdventure((state) => {
        const merged = mergeAdventureForImport(state, adventure);
        return { state: merged.state, result: undefined };
      });
    } catch (error) {
      console.warn("[backup] Crystals could not be restored:", error);
      adventureFailed = true;
    }
  }
  return { summary, adventureFailed };
}
