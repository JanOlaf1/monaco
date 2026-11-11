# Firebase integration plan

**Status (2026-11-11):** Optional accounts with Firebase Authentication (email and password) are
implemented, and **only the competency model** (skill levels, placement results and related
fields) is synchronised to Cloud Firestore. All other learner data is still local to the browser.
Setup and deployment steps: [FIREBASE_SETUP.md](FIREBASE_SETUP.md). Nothing is deployed
automatically.

## Principles

- Learning, grading and deadlines keep working without an account. Signing in only adds
  syncing across devices. No anonymous Firebase accounts are created.
- Firebase is loaded lazily: only on the account page, or when this browser signed in before.
  Learners who never sign in do not download the SDK.
- No credentials in the repository. The web config comes from App Hosting
  (`FIREBASE_WEBAPP_CONFIG` → SDK autoinit) or `.env.local` for development.
- Never overwrite valid local data: merges are deterministic, keep the newest placement result
  and any manual choice, and ask the learner when two choices disagree.
- Only verified email addresses can read or write cloud data (enforced by the rules).

## Implemented: competency sync

| Piece | Where |
| ----- | ----- |
| Cloud document shape and validation | `lib/sync/competency-doc.ts` (`users/{uid}/competency/{track}`, schema version 1, `updatedAt`, `serverUpdatedAt`) |
| Deterministic merge and conflicts | `lib/sync/competency-merge.ts` |
| Sync engine (read once per session, debounced writes of changed tracks only, offline/denied handling) | `lib/sync/competency-sync.ts` |
| Firestore adapter (Firestore Lite) | `lib/firebase/competency-remote.ts` |
| Auth, session and UI state | `lib/account/account-store.ts`, `components/account/*`, `/[lang]/account` |
| Security rules and tests | `firestore.rules`, `tests/emulators/` |

Merge rules per track: data present on one side is kept; the placement result with the later
`completedAt` wins together with its skill evidence and assessment date; `selfReportedLevel` and
`userOverride` merge when equal or present on one side only, and two different values become a
conflict the learner resolves on the account page (until then the device keeps its value and that
track is not uploaded); `recommendedNext` is recomputed.

## Next domains (planned, not synced yet)

`lib/sync/domains.ts` lists every domain and whether it is synced; the account page reads it, so
the UI cannot claim more than is implemented. Each new domain needs a document shape and parser,
a deterministic merge, a remote adapter, rules with tests, and the same engine pattern.

| Domain | Local key | Planned Firestore path | Merge idea |
| ------ | --------- | ---------------------- | ---------- |
| Progress | `koodaamo:v1:progress` | `users/{uid}/progress/{exerciseId}` | Union of completed steps, earliest `completedAt` |
| Rewards | `koodaamo:v1:gamification` | `users/{uid}/awards/{accomplishmentId}` + summary fields | Union by accomplishment id (never double-counts XP); recompute level and streak |
| Drafts | `koodaamo:v1:drafts` | `users/{uid}/drafts/{exerciseId}` | Newest `updatedAt`; save on check/blur, not per keystroke |
| Schedule | `koodaamo:v1:schedule` | `users/{uid}/deadlines/{targetKey}` | Newest `updatedAt` |

Client-written data is self-reported (grading runs in the browser). That is fine for personal
progress; anything that must be trusted (certificates, rankings) needs server-side re-grading.

## Still open

- Deploy `firestore.rules` to `monaco-7bf62` (see the setup guide) — requires approval.
- Account deletion ("delete my data"): the rules deny deletes today; add a reviewed path
  (for example a callable function or the Delete User Data extension) before offering it.
- Google sign-in, App Check, and syncing the remaining domains.
