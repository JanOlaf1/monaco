import type { Firestore } from "firebase/firestore/lite";
import type { TrackCompetency, TrackId } from "@/lib/learning/competency";
import { COMPETENCY_COLLECTION, parseCompetencyDocument } from "@/lib/sync/competency-doc";
import type { CompetencyRemote } from "@/lib/sync/competency-sync";

/**
 * Competency documents in Cloud Firestore: `users/{uid}/competency/{track}`.
 * One query reads at most four small documents; a write replaces one document.
 */
export function createFirestoreCompetencyRemote(
  db: Firestore,
  sdk: Pick<typeof import("firebase/firestore/lite"), "collection" | "doc" | "getDocs" | "setDoc" | "serverTimestamp">,
): CompetencyRemote {
  return {
    async load(uid) {
      const snapshot = await sdk.getDocs(sdk.collection(db, "users", uid, COMPETENCY_COLLECTION));
      const tracks: Partial<Record<TrackId, TrackCompetency>> = {};
      const invalid: string[] = [];
      for (const document of snapshot.docs) {
        const parsed = parseCompetencyDocument(document.id, document.data());
        if (parsed) tracks[document.id as TrackId] = parsed;
        else invalid.push(document.id);
      }
      return { tracks, invalid };
    },
    async save(uid, trackId, document) {
      await sdk.setDoc(sdk.doc(db, "users", uid, COMPETENCY_COLLECTION, trackId), {
        ...document,
        serverUpdatedAt: sdk.serverTimestamp(),
      });
    },
  };
}
