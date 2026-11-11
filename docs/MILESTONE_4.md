# Milestone 4: Code Archipelago

Implemented independently from Milestone 3 (`de88fab`), without Firebase changes.
The four original SVG regions describe learning stages: Starter Harbor,
Logic Forest, App City and Production Summit. Existing available JavaScript and
Python chapter paths remain freely accessible. Production Summit is explicitly a
future destination; TypeScript and React execution are still unimplemented.

## Crystal rules

Code Crystals / Koodikiteet are non-monetized and separate from XP. The localized
currency name and reward amounts are configured in `lib/adventure/catalog.ts`.

| Verified accomplishment | Crystals | Deduplication |
| --- | ---: | --- |
| First complete exercise, including labs/checkpoints | 5 | Once per exercise ID |
| Complete regular chapter | 20 | Once per course/chapter ID |
| Optional daily quest | 3 | Once per UTC day, after joining |
| Optional weekly quest | 10 | Once per UTC Monday-start week, after joining |
| Verified review | 2 | Once per UTC day across all exercises |

A daily quest requires one newly completed exercise or verified review after
joining. A weekly quest requires three distinct exercises through new completions
or verified reviews after joining. Previously completed work does not complete a
newly joined quest retrospectively. A review requires passing every step of an
exercise again on a UTC date later than its original completion date. Failed
checks, running code without checking, opening the app, reloading and resetting
code do not earn crystals. Rechecking on the completion date does not earn a
review reward. UTC periods prevent timezone changes from creating extra claims;
existing XP streaks and daily goals retain their existing local-calendar rules.
Quests are optional, have visible date ranges, and never lock or penalize lessons.

## Cosmetic catalog

All four items are original SVG additions to the existing Saku otter. The catalog
is typed and extensible. Preview is free and does not change ownership or equipment.

| Stable item ID | English / Finnish name | Slot | Cost |
| --- | --- | --- | ---: |
| `goggles` | Tideglass goggles / Vuorovesilasit | Eyes | 15 |
| `scarf` | Aurora scarf / Revontulihuivi | Neck | 10 |
| `backpack` | Mapmaker's backpack / Kartanpiirtäjän reppu | Back | 25 |
| `hat` | Harbor captain's hat / Satamakapteenin hattu | Head | 30 |

An item can be unlocked once, equipped and removed without further spending.
The balance is derived from the event ledger, never a second mutable counter.
Insufficient funds cannot create a purchase; equipment must reference an owned
item in the correct slot. Cosmetics never change grading, competency, XP or
lesson availability. There are no payments, packs, randomized rewards or gates.

## Local data and integration with the Firebase branch

- New document: `AdventureState`, version 1, persisted separately under
  `koodaamo:v1:adventure`. `lib/adventure/` domain functions import no Firebase SDK.
- Existing progress, XP, achievements, streaks, drafts, competency and deadlines
  keep their existing keys and schemas. Existing verified exercise/chapter XP
  awards and progress provide evidence for idempotent crystal backfill. Merely
  opening the application without completed work creates no reward.
- New rewards, quest enrollment, successful review checks, learning activity and
  cosmetic spending have stable event IDs. The ledger also records ISO timestamps;
  calendar periods are defined in UTC. Preserve these IDs and original timestamps
  when adding cloud synchronization.
- `mergeAdventureWithConflicts` unions immutable events deterministically and
  reports unfunded concurrent purchases. A sync integration must surface those
  conflicts to the learner. Never independently sum device balances or overwrite
  one device's ledger with the other's.
- Equipment and the encouragement-card preference use `settingsAt` for deterministic
  last-write reconciliation. Validate imported/cloud data with `parseAdventure`
  before merging. Documents with a newer schema are preserved unchanged and open
  in read-only mode with a localized notice; this version refuses mutations.
- Local mutations serialize within a tab and use Web Locks where supported to
  read the latest ledger before spending. A future same-browser sync writer must
  use the same lock name (`koodaamo:v1:adventure`). Browsers without Web Locks
  cannot provide the same cross-tab atomicity; use deterministic merge conflict
  reporting when synchronizing independent devices.
- The collection surfaces unfunded concurrent purchase conflicts with a localized
  notice. Storage failures retain the in-memory collection for the current visit
  and display a session-only warning; a successful later save clears that warning.
  These statuses are presentation state, not additional cloud ledger fields.
- Merge attention: `app/[lang]/layout.tsx` mounts the independent adventure sync
  component, and `lib/learner/hooks.ts` forwards genuinely passed checks after the
  existing progress/XP update. Preserve the Firebase branch's account and sync
  hooks around these additions. Central adventure translations live in
  `lib/i18n/adventure.ts`, separate from the existing account dictionary additions.
- Cloud inclusion is an explicit follow-up: register this new document in the
  sync schema, validate allowed fields/security rules, and test two-device
  conflicts. This milestone does not enable services or change production data.

The local ledger is learner-controlled browser data, not a secure economy or
certification. Clearing browser storage removes the collection; there is no
cross-device persistence until the Firebase integration deliberately includes it.

## Additional achievements and messages

Six additional achievements are derived from recorded ledger evidence. They do
not add a second completion counter or award extra crystals:

| Achievement | Condition |
| --- | --- |
| Fresh Perspective / Uusi näkökulma | One verified review |
| Review Ranger / Kertausretkeilijä | Verified reviews on three distinct UTC days |
| A Small Expedition / Pieni tutkimusretki | Complete one optional daily quest |
| Weekly Navigator / Viikon suunnistaja | Complete one optional weekly quest |
| Explorer's Wardrobe / Tutkijan varusteet | Unlock two different cosmetics |
| Chapter Cartographer / Lukujen kartoittaja | Complete three regular chapters |

The original eight learning achievements remain in the existing Progress view.
`lib/adventure/messages.ts` starts the versioned, typed encouragement catalog with
four original bilingual messages; no historical quotations or attribution are
used. The chapter ID deterministically selects a message. Collection settings can
disable the cards without changing any learning data or rewards.

## Presentation and verification

`/[lang]/collection` contains the avatar preview, catalog, crystal history,
additional achievements, quests and encouragement-card preference. Original
chapter messages are authored for Koodaamo, have typed bilingual catalog entries,
and are shown only after a newly completed chapter. They are not attributed
historical quotations. The homepage keeps the next lesson prominent and places
details behind disclosure controls; the code workspace retains its existing
editor, runners and checks. Animation respects reduced-motion preferences.

Focused tests live in `tests/adventure*.ts`, `e2e/adventure.spec.ts` and
`e2e/adventure.mobile.spec.ts`. Run the repository checks with `npm run typecheck`,
`npm run lint`, `npm test`, `npm run build`, then `npm run test:e2e`. The browser
suite targets the production build and uses the configured Chrome channel. Exact
executed results are reported with the milestone commit, not presumed here.
The focused browser coverage includes two real tabs with simultaneously queued
purchase attempts, checking that one shared balance cannot fund both items.
