# Firebase integration plan

**Status:** Only Firebase App Hosting is configured (`firebase.json`, `apphosting.yaml`,
`.firebaserc`). Firebase Authentication and Cloud Firestore are **not** enabled, and no code
initialises Firebase. The `firebase` npm package is installed but unused. Everything below
requires explicit approval before any console change, deployment or billable resource.

## Principles

- Learning, grading and deadlines keep working without an account. Signing in only adds
  syncing across devices.
- Firebase is initialised lazily, only in code paths that need it (account UI and the
  Firestore adapter), never in the root layout or shared modules.
- No credentials in the repository. The web config is provided through App Hosting
  environment variables (`apphosting.yaml` → `env`, `availability: [BUILD, RUNTIME]`) and
  `.env.local` for development (git-ignored). Server-only secrets, if ever needed, go to
  Cloud Secret Manager via `firebase apphosting:secrets:set`.

## Phase 1 — Authentication

1. Enable Authentication in the Firebase console (Email link and/or Google provider).
2. Add `lib/firebase/client.ts` that calls `initializeApp` on first use (client only).
3. Add an account menu (sign in / sign out). Keep pages static: auth state is read on the
   client, so the prerendered shell does not depend on cookies.
4. Server-side session verification is only needed for features that must be trusted on the
   server (not needed for progress sync).

## Phase 2 — Firestore and synchronisation

The UI already talks to stores through `PersistenceAdapter` (`lib/storage/adapter.ts`).
Syncing means adding a Firestore adapter and choosing the adapter per session:

| Store    | Local key              | Firestore path                       |
| -------- | ---------------------- | ------------------------------------ |
| Progress | `koodaamo:v1:progress` | `users/{uid}/progress/{exerciseId}`  |
| Drafts   | `koodaamo:v1:drafts`   | `users/{uid}/drafts/{exerciseId}`    |
| Schedule | `koodaamo:v1:schedule` | `users/{uid}/deadlines/{targetKey}`  |
| Rewards  | `koodaamo:v1:gamification` | `users/{uid}/awards/{accomplishmentId}` + fields on `users/{uid}` (active days, best streak, achievements, daily goal) |
| Levels   | `koodaamo:v1:competency` | `users/{uid}/tracks/{trackId}` (self-reported level, placement result, skill evidence, override) |
| Profile  | –                      | `users/{uid}` (display name, locale) |

- One document per exercise/deadline keeps writes small. Drafts are already debounced
  (400 ms). Increase this for Firestore, or save on blur/check, to limit write costs.
- Course completion is derived from exercise progress, so there is no separate copy that could
  disagree.
- XP awards are keyed by accomplishment id (`step:…`, `exercise:…`, `chapter:…`), so merging
  devices is a union by id and can never double-count XP. Active days are a set union;
  achievements keep the earliest date; level and streak are recomputed, not stored.
- Proficiency levels merge per track by the newest `updatedAt`; a manual override is never
  replaced by a placement result from another device.
- **First sign-in merge:** union of completed steps (keep the earliest `completedAt`), the
  newest draft by `updatedAt`, and the newest deadline by `updatedAt`. After merging, Firestore
  becomes the source of truth and localStorage acts as an offline cache.
- `subscribe()` maps to `onSnapshot`, so other tabs and devices update live.

### Security Rules (draft — validate with the emulator before use)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read, delete: if isOwner(uid);
      allow create, update: if isOwner(uid)
        && request.resource.data.keys().hasOnly(['displayName', 'locale', 'createdAt', 'updatedAt'])
        && request.resource.data.locale in ['en', 'fi'];

      match /progress/{exerciseId} {
        allow read, delete: if isOwner(uid);
        allow create, update: if isOwner(uid)
          && request.resource.data.keys().hasOnly(['completedStepIds', 'currentStepId', 'completedAt', 'updatedAt'])
          && request.resource.data.completedStepIds is list
          && request.resource.data.completedStepIds.size() <= 50;
      }

      match /drafts/{exerciseId} {
        allow read, delete: if isOwner(uid);
        allow create, update: if isOwner(uid)
          && request.resource.data.keys().hasOnly(['files', 'updatedAt'])
          && request.resource.data.files is map
          && request.resource.data.files.size() <= 10;
      }

      match /deadlines/{key} {
        allow read, delete: if isOwner(uid);
        allow create, update: if isOwner(uid)
          && request.resource.data.keys().hasOnly(['target', 'dueDate', 'createdAt', 'updatedAt'])
          && request.resource.data.dueDate is string
          && request.resource.data.dueDate.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
          && request.resource.data.target.type in ['course', 'exercise'];
      }
    }

    // Everything else is denied by default.
  }
}
```

Note that client-written progress is self-reported (grading runs in the browser). That is
fine for personal progress. Anything that must be trusted, such as certificates or
leaderboards, requires server-side re-grading and is out of scope.

## Needed later (not done)

- Enable Authentication providers and Cloud Firestore (choose a region; Standard edition).
- Add the web app config as App Hosting environment variables.
- Deploy `firestore.rules` (and indexes, if queries need them) with `firebase deploy --only firestore`.
- Add a Firebase Emulator Suite setup for local development and rules tests.
- Check pricing: Firestore free-tier quotas versus the expected write volume from drafts.
