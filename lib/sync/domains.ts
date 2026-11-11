/**
 * Learner data domains and where each one lives. This list is the single
 * source of truth for the account page ("what is synced") so the UI can never
 * claim more than is implemented.
 *
 * To sync another domain later: give it a cloud document shape and parser
 * (like competency-doc.ts), a deterministic merge (like competency-merge.ts),
 * a remote adapter (like lib/firebase/competency-remote.ts) and security
 * rules, then reuse the engine pattern in competency-sync.ts and flip `cloud`.
 */
export type SyncDomainId = "competency" | "progress" | "rewards" | "adventure" | "practice" | "drafts" | "schedule";

export interface SyncDomain {
  id: SyncDomainId;
  /** Local storage key in this browser. */
  localKey: string;
  /** Firestore location when synced (planned paths are documented, not used). */
  cloudPath: string;
  cloud: boolean;
}

export const SYNC_DOMAINS: SyncDomain[] = [
  { id: "competency", localKey: "koodaamo:v1:competency", cloudPath: "users/{uid}/competency/{track}", cloud: true },
  { id: "progress", localKey: "koodaamo:v1:progress", cloudPath: "users/{uid}/progress/{exerciseId}", cloud: false },
  { id: "rewards", localKey: "koodaamo:v1:gamification", cloudPath: "users/{uid}/awards/{accomplishmentId}", cloud: false },
  // Code Archipelago (Milestone 4): crystals, quests and avatar items as an event ledger.
  { id: "adventure", localKey: "koodaamo:v1:adventure", cloudPath: "users/{uid}/adventureEvents/{eventId}", cloud: false },
  // Mobile practice results (Milestone 7); their XP lives in the rewards domain.
  { id: "practice", localKey: "koodaamo:v1:practice", cloudPath: "users/{uid}/practice/{activityId}", cloud: false },
  { id: "drafts", localKey: "koodaamo:v1:drafts", cloudPath: "users/{uid}/drafts/{exerciseId}", cloud: false },
  { id: "schedule", localKey: "koodaamo:v1:schedule", cloudPath: "users/{uid}/deadlines/{targetKey}", cloud: false },
];
