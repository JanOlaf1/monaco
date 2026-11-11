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
| Adventure (Code Archipelago) | `koodaamo:v1:adventure` | `users/{uid}/adventureEvents/{eventId}` + `users/{uid}/adventure/settings` | Union of ledger events by id; balance derived, never stored |

### Requirements before syncing gamification (XP and the Code Archipelago)

Do not sync these until every point below is implemented and tested:

1. **Event identity:** reward ids are already deterministic (`crystal:exercise:<id>`,
   `crystal:chapter:<id>`, `crystal:daily|weekly|review:<period>`, `quest:<kind>:<period>`,
   `purchase:<itemId>`, `step:…`/`exercise:…`/`chapter:…` for XP). Cloud documents must use the
   same ids as document ids so a merge is a set union and can never grant a reward twice.
2. **Derived values stay derived:** crystal balance, XP total, level and streak are computed from
   events, never written as numbers a client can inflate.
3. **Spending:** a purchase must not be accepted when the merged balance would go below zero.
   Two devices can each spend offline; the merge must detect an overdraft and resolve it
   deterministically (for example keep the earliest purchases, return later ones, and tell the
   learner). Rules cannot sum a ledger, so client-side trust remains (self-reported data).
4. **Schema and migration:** versioned documents, a parser that drops invalid events (as
   `parseAdventure` does locally), and a one-time upload of existing local events on first
   sign-in with the same merge.
5. **Security rules:** owner + verified email, per-event-kind schema validation (amounts fixed per
   kind, ids matching their kind, sizes bounded), create-only events (no updates or deletes),
   `serverUpdatedAt == request.time`, plus emulator tests.
6. **Volume:** batch uploads, debounce writes, and keep reads to one query per session.

Files that will need changes: `lib/sync/domains.ts` (flip `cloud`), new
`lib/sync/adventure-doc.ts`, `lib/sync/adventure-merge.ts` and a remote adapter in
`lib/firebase/`, a second engine instance in `lib/account/account-store.ts`,
`lib/adventure/store.ts` and `lib/adventure/state.ts` (expose a merge-safe apply of remote events),
`lib/gamification/state.ts` (the same for XP awards), `firestore.rules`,
`tests/emulators/`, `e2e-cloud/integration.spec.ts`, and the account page texts in
`lib/i18n/dictionaries/*.ts`.

Client-written data is self-reported (grading runs in the browser). That is fine for personal
progress; anything that must be trusted (certificates, rankings) needs server-side re-grading.

## Still open

- Deploy `firestore.rules` to `monaco-7bf62` (see the setup guide) — requires approval.
- Account deletion ("delete my data"): the rules deny deletes today; add a reviewed path
  (for example a callable function or the Delete User Data extension) before offering it.
- Google sign-in, App Check, and syncing the remaining domains.
