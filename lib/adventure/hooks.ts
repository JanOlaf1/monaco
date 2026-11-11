"use client";

import { useSyncExternalStore } from "react";
import type { GamificationCatalog } from "@/lib/gamification/engine";
import type { XpAward } from "@/lib/gamification/xp";
import type { ProgressState } from "@/lib/progress/progress";
import type { CosmeticId, CosmeticSlot } from "./catalog";
import { applyAdventurePass, backfillAdventure, enrollQuest, equipCosmetic, purchaseCosmetic } from "./engine";
import { adventureStorageStatus, adventureStore, hasUnsupportedAdventureVersion, updateAdventure } from "./store";

export function useAdventure() {
  const snapshot = useSyncExternalStore(adventureStore.subscribe, adventureStore.getSnapshot, adventureStore.getServerSnapshot);
  const status = useSyncExternalStore(adventureStorageStatus.subscribe, adventureStorageStatus.getSnapshot, adventureStorageStatus.getServerSnapshot);
  return { ...snapshot, ...status, readOnly: snapshot.hydrated && hasUnsupportedAdventureVersion() };
}

export const adventureActions = {
  purchase(id: CosmeticId) {
    return updateAdventure((state) => {
      const next = purchaseCosmetic(state, id, new Date());
      return { state: next.state, result: next.status };
    });
  },
  equip(id: CosmeticId | null, slot: CosmeticSlot) {
    return updateAdventure((state) => ({ state: equipCosmetic(state, id, slot, new Date()), result: undefined }));
  },
  enrollQuest(kind: "daily" | "weekly") {
    const joinedAt = new Date();
    return updateAdventure((state) => ({ state: enrollQuest(state, kind, joinedAt), result: undefined }));
  },
  setShowMessages(showMessages: boolean) {
    return updateAdventure((state) => ({
      state: {
        ...state,
        showMessages,
        settingsAt: new Date(Math.max(Date.now(), Date.parse(state.settingsAt) + 1 || 0)).toISOString(),
      },
      result: undefined,
    }));
  },
};

export function reconcileAdventure(input: {
  xpAwards: Record<string, XpAward>; catalog: GamificationCatalog; progress: ProgressState;
}) {
  return updateAdventure((state) => ({
    state: backfillAdventure(state, input.xpAwards, input.catalog, input.progress), result: undefined,
  }));
}

/** Called only after the existing runner has passed every test for a step. */
export function recordAdventurePass(input: {
  progress: ProgressState; catalog: GamificationCatalog; xpAwards: Record<string, XpAward>;
  exerciseId: string; stepId: string; now: Date;
}) {
  return updateAdventure((state) => ({ state: applyAdventurePass({ ...input, state }), result: undefined }));
}
