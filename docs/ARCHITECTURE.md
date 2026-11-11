# Architecture

Koodaamo is a bilingual (English/Finnish) interactive coding course platform built on the
existing Next.js 16 App Router project (Cache Components + Partial Prefetching enabled,
Turbopack, Tailwind CSS 4, React 19.3). It runs entirely without a backend: learner code
executes in the browser, and learner data is stored in `localStorage`.

```
app/[lang]/…            Routes: home, courses, course path, workspace, progress, plan
components/             UI: home, learn (paths), gamification, progress, mascot, workspace,
                        editor, catalog, schedule, layout, ui
content/                Course, chapter and exercise definitions (data only)
lib/content/            Content types, factories, registry, localisation, client catalog
lib/execution/          Code runners (JS + Python), harness, shared types
lib/gamification/       Pure XP, level, streak, achievement and daily-goal logic
lib/adventure/          Independent crystal ledger, UTC quests, cosmetic catalog and local store
lib/learning/           Proficiency levels, placement scoring, recommendations (pure)
content/placement/      Placement checks per runnable language (data only)
lib/sync/               Cloud sync: document schema, deterministic merge, engine, domain list
lib/firebase/, lib/account/   Optional Firebase Auth + Firestore Lite (lazy), account state
lib/pwa/, public/sw.js  Install prompt, connectivity, service worker registration and caching
lib/practice/, content/practice/  Mobile practice activities, answer checking, results store
lib/backup/             Backup export, validation and additive import
lib/i18n/               Locales, typed UI dictionaries, formatting helpers
lib/progress/, lib/schedule/   Pure learner-state logic (progress, drafts, deadlines)
lib/storage/, lib/learner/     Persistence adapter, stores, hooks, learner summary
public/workers/         Static ES-module Python worker (not bundled, see below)
scripts/                Copies Monaco + Pyodide into public/vendor at dev/build time
tests/                  Vitest unit tests (grading, harness, content, gamification, state)
e2e/                    Playwright browser tests against the production build
e2e-cloud/, tests/emulators/  Account and sync tests against the Firebase Emulator Suite
```

Routes: `/[lang]` (home), `/[lang]/courses` (catalog), `/[lang]/courses/[courseId]` (visual
learning path), `/[lang]/courses/[courseId]/[exerciseId]` (workspace), `/[lang]/placement/[courseId]`
(optional placement check), `/[lang]/progress` (XP level, streak, goal, skill levels, achievements)
and `/[lang]/plan` (target dates). The header navigation is Learn / Courses / Practice / Progress
plus a Settings icon; on phones the same destinations move to a bottom bar (`MobileNav`), which is
hidden in the workspace. `/[lang]/practice` holds the mobile practice activities, `/[lang]/settings`
installation, offline information, theme, backup/restore and the account link, and `/[lang]/offline`
is the service worker's fallback page (see [PWA.md](PWA.md)).
`/[lang]/collection` contains the optional Code Archipelago cosmetics, quests and new achievements,
linked from the learner home and Progress page.

## Routing and internationalisation

- `proxy.ts` prefixes URLs without a locale (`/` → `/en`). The language switcher stores the
  learner's choice in the `cl_locale` cookie, which the proxy prefers; English is the default.
- `app/[lang]/layout.tsx` is the root layout. `generateStaticParams` returns every locale, and
  all course/exercise routes also return their params, so every page is prerendered.
  (`dynamicParams` is unavailable with Cache Components; unknown ids call `notFound()`, and
  `app/[lang]/[...rest]` renders the localised 404 page for unknown paths.)
- Server code reads the locale with `next/root-params` (`lib/i18n/server.ts`). Client components
  get the active dictionary through `I18nProvider`.
- UI strings live in `lib/i18n/dictionaries/{en,fi}.ts`. The Finnish dictionary is typed as the
  English one, so missing keys fail type-checking; `tests/i18n.test.ts` also checks that
  placeholders match. Course content uses `LocalizedText = Record<Locale, string>` fields.
- **Adding a language:** add it to `locales` in `lib/i18n/config.ts`, add a dictionary, and
  translate the content. `localize()` falls back to English for missing content.

## Content model

`lib/content/types.ts` defines courses → **chapters** → exercises. Each chapter has a theme
(icon + colour tone) used by the learning path. An exercise is plain data: metadata, a
markdown concept explanation (what / why / how), objectives, starter files, and one or more
**steps**. Each step has instructions, optional progressive hints, test definitions and
optional starter files (used by "Reset"). Exercises are `challenge`s (short, usually one step),
`lab`s (a bigger task with a requirement list, shown as milestones on the path) or
`checkpoint`s (a lab-sized review of a whole band, see below).

Every chapter has a **level** (`beginner`, `intermediate`, `advanced`; `professional` is reserved),
the **skills** it practises (stable ids from `content/skills.ts`) and optionally `buildsOn` skills
that are shown as "helpful to know first" — a suggestion, never a lock. Levels never decrease in
course order, so a course reads as bands. A **checkpoint chapter** (`kind: "checkpoint"`) sits
between two bands and holds exactly one checkpoint exercise; it is not numbered, earns exercise XP
(50) but no chapter bonus, and passing it never marks the chapters it reviews as completed.
`docs/CONTENT_COVERAGE.md` shows counts per track and level and is checked by a test.

`lib/content/factories.ts` (`pyChallenge`, `jsChallenge`, `pyLab`, `jsLab`, `pyCheckpoint`,
`jsCheckpoint`, `l(en, fi)`, `check(...)`) keeps single-step exercises compact; multi-step
exercises are written out in full.

One generic workspace renders every exercise, so adding content never needs a new component:

1. Add the exercise under `content/exercises/<language>/`.
2. Register its module in `lib/content/registry.ts` and list its id in a chapter in
   `content/courses.ts`.
3. Add reference solutions (several valid styles + typical mistakes) to
   `tests/fixtures/solutions*.ts`. `npm test` verifies each one passes/fails exactly the
   expected tests, that the starter code does not already pass, and that the chapter
   structure and bilingual text are complete.

Server pages pass a localised, test-free summary of all courses (`getCatalog(locale)` →
`CatalogProvider`) to client components such as the path, home and progress pages.

Lesson text uses a small, safe markdown subset (`lib/content/markdown.ts`): paragraphs,
`###` headings, lists, fenced code (``` or ~~~), inline code, bold and italic. It renders to
React elements; raw HTML is never interpreted.

### Writing tests

Tests check behaviour, not source text. Every test has a localised `label` (the requirement)
and `failure` (what to do when it fails). `hidden: true` tests run normally but their details
are not shown — they discourage over-fitting, but they are shipped to the browser and are not
secret.

**JavaScript** (`lib/execution/javascript/test-api.ts`): the test body runs in the same scope as
the learner's code and receives `t`:

```js
t.equal(greet("Ada"), "Hello, Ada!");        // also: deepEqual, closeTo, ok, isType, includes
t.logged(greet(learnerName));                  // console output line
t.ok(t.ast.calls("greet"));                    // Acorn AST: declarationKind, definesFunction, has, findAll
const run = await t.runWith({ age: 18 });       // re-run with other top-level values
t.equal(run.value("isAdult"), true);
```

`t.runWith(overrides)` is the JavaScript counterpart of Python's `run(**values)`: it re-runs
the learner's program in the same worker with the first top-level declaration of each name
given a new value, and returns the re-run's console lines and bindings. Tests can then check
several inputs without requiring a function.

**Python** (`lib/execution/python/harness.ts`): snippets run with helpers such as
`var(name)`, `has_var(name)`, `expect_equal`, `expect_close`, `expect_type`, `expect_line`,
`find_nodes(ast.If)` (the real Python `ast` module) and `run(**values)`, which re-runs the
program with the first top-level assignment of each name replaced. That lets a lab test many
inputs without forcing a particular program structure:

```python
expect_close(run(distance_km=50, is_member=False).var("shipping_cost"), 4.9)
```

## Code execution

The UI depends only on the `CodeRunner` interface (`lib/execution/types.ts`):
`run()`, `check()`, `prepare()`, and a loading status. `lib/execution/registry.ts` lazily loads
runners and marks which languages are available; TypeScript and React are registered as
**planned** and are labelled as such in the UI. No results are simulated.

| Language   | Strategy |
| ---------- | -------- |
| JavaScript | A fresh dedicated Web Worker per Run/Check (`js.worker.ts`). Code is parsed with Acorn (syntax errors with line/column), then compiled with the `AsyncFunction` constructor *inside the worker* together with the test functions, so tests can call the learner's declarations. Console output is captured and formatted; pending timers are awaited briefly and then cancelled. The worker is terminated after every request. Limits: 5 s run / 8 s check. |
| Python     | Pyodide (CPython on WebAssembly) in a long-lived **module** worker (`public/workers/python.worker.mjs`). Each run gets a fresh namespace; `input()` and the `js`/`pyodide` bridge modules are blocked. Python cannot be interrupted without cross-origin isolation, so a timeout terminates the worker and a new one is started in the background. Limits: 8 s run / 15 s check (loading time is not counted). |

The Python worker is a static file because Pyodide 314 requires a module worker, while
Turbopack bundles `new Worker(new URL(…))` as a classic worker. The harness source is sent to
the worker in its `init` message, so the browser and the Node unit tests run the same harness.

Monaco Editor and Pyodide are self-hosted from `public/vendor` (copied from `node_modules` by
`scripts/copy-runtime-assets.mjs`, run automatically by `predev`/`prebuild`). They are fetched
only on workspace pages and never enter the server bundle.

### Security notes and limitations

Learner code never runs on the server or in the main page context. Worker isolation is still
**not** a hardened sandbox:

- Workers are same-origin. The JS worker removes `fetch`, `XMLHttpRequest`, `WebSocket`,
  `importScripts`, `indexedDB`, `caches` and nested workers before running code, and blocks
  `postMessage` spoofing. This is best-effort hardening, not a guarantee.
- The Python worker keeps Pyodide's internals; the `js` bridge is blocked at import level only.
- Memory use is not capped beyond what the browser enforces per worker.
- Grading happens in the learner's browser, so completion is self-reported. Anything that must
  be trustworthy (certificates, rankings) would need server-side re-grading in an isolated
  environment.
- `new Function`/`AsyncFunction` in the JS worker requires `'unsafe-eval'` if a Content Security
  Policy is added later; the inline theme script would need a nonce.

## Learner data and hydration

- `lib/storage/adapter.ts` defines an async `PersistenceAdapter` (`load`, `save`, `subscribe`).
  The current implementation is `localStorage` (`lib/storage/local-storage.ts`); data is
  validated on load, so malformed or old data is dropped instead of crashing.
- `createPersistentStore` exposes values for `useSyncExternalStore`. The server snapshot is
  always the initial value with `hydrated: false`, so server HTML and the first client render
  match; components show neutral placeholders until data has loaded.
- Stores: progress (completed steps, current step, last visited), drafts (code per exercise
  and file, debounced saves, flushed on `pagehide`), schedule (target dates).
- A step is recorded as passed only when a check returns `passed: true` — every test passed
  and the program itself ran without errors.
- Target dates are calendar date keys (`YYYY-MM-DD`) in the learner's local time. Passing a
  date changes only the label ("past target date"); nothing is locked or penalised.
- The gamification store (`koodaamo:v1:gamification`) holds XP awards, active days, best
  streak, earned achievements, the optional daily goal and the preferred course.
  `parseGamification` drops malformed entries individually.
- **Migration:** on first load after this feature shipped, `backfillFromProgress` awards XP,
  chapter bonuses and achievements for progress that was already saved, then sets
  `migratedProgress` so it never runs twice. The recorded completion dates of saved exercises
  become active days; no other days are invented.
- The competency store (`koodaamo:v1:competency`, version 1) holds the learning proficiency per
  language — see the next section. It is separate from every other store and never rewrites them.
- The practice store (`koodaamo:v1:practice`) holds the first and latest correct answer per
  practice activity; practice XP lives in the gamification store as `practice:<activityId>`
  awards (see [PWA.md](PWA.md)).
- **Home variant:** an inline `<head>` script (`lib/learner/boot-script.ts`) sets
  `<html data-learner="new|returning">` from stored data before first paint. Both home
  variants are server-rendered and CSS shows one, so there is no flash or layout shift.
  `LearnerSync` keeps the attribute correct after storage changes. The script is rendered by
  `InlineScript`, which turns client-side copies into inert data blocks (no React dev warning on
  soft navigations between `/en` and `/fi`).

## Proficiency levels and placement

Learning proficiency answers "where should this learner start?". It is **separate from the XP
level**, which only measures effort on the platform; the two never feed each other.

- **Competency model** (`lib/learning/competency.ts`): per track (`python`, `javascript`,
  `typescript`, `react`) the store keeps `selfReportedLevel` (a level or `not-sure`),
  `placementResult` (assessment id and version, suggested level, score, date), `skillEvidence`
  (placement answers per skill id), `recommendedNext` (a snapshot of the suggested start),
  `assessmentDate` and `userOverride`. The effective level is the learner's own override, else the
  latest placement suggestion, else the self-report. A new placement never replaces an override;
  the result screen offers "Use the suggestion" instead. Exercise completions are not copied into
  the competency store; skill overviews derive them from progress.
- **Onboarding** (`components/home/path-chooser.tsx`): language → optional level (Beginner /
  Familiar with basics / Advanced / Professional / Not sure) → start. "Skip for now" stores no
  level. Levels for the other languages can be set in an optional disclosure or later on the
  Progress page (`#levels`). Professional is labelled self-reported and leads to the deepest
  available band.
- **Placement check** (`content/placement/`, `lib/learning/placement.ts`, `/[lang]/placement/[id]`):
  nine items per runnable language, three per level (predict the output, choose the fix, a small
  coding task checked with the same isolated runners as lessons). Two of three correct passes a
  level; after a failed level the check stops early. The result is `beginner`, `intermediate` or
  `advanced` — never `professional` — and is presented as a suggestion, not a certificate.
  `tests/placement.test.ts` runs every predict snippet and every proposed fix to verify the answers.
- **Recommendations** (`lib/learning/recommend.ts`): `entryChapter` picks the first chapter of the
  learner's band (beginners start at the very beginning for a quick first success);
  `checkpointBefore` offers the checkpoint for the band being skipped; `nextTask` returns the
  first unfinished exercise from the suggested start, then earlier gaps. The home page continues an
  unfinished exercise first ("resume"), then the suggested start ("recommended"), then the next
  unfinished one. The path, the course sidebar and the home page all use `nextTask`.
- **Migration:** on first load after this feature, `migrateLearnerData` marks learners who already
  had progress as `legacy` (no onboarding is forced on them; an optional, dismissible placement
  prompt appears on the home page). Progress, XP, streaks, achievements, drafts and target dates
  stay in their own stores and are not modified. Malformed or unknown-version competency data is
  dropped by `parseCompetency`.

## Optional accounts and cloud sync

Accounts never gate learning. Firebase Authentication (email and password, with email
verification and password reset) is optional, and only the **competency model** is synced to
Cloud Firestore (`users/{uid}/competency/{track}`). `lib/sync/domains.ts` is the single list of
what is synced; the account page reads it. Details and console steps:
[FIREBASE_SETUP.md](FIREBASE_SETUP.md) and [FIREBASE_PLAN.md](FIREBASE_PLAN.md).

- **Configuration** (`lib/firebase/config.ts`): App Hosting's `FIREBASE_WEBAPP_CONFIG`
  (Firebase SDK autoinit) or `NEXT_PUBLIC_FIREBASE_*` in `.env.local`. Without either, the
  account entry is hidden and the app never contacts Firebase.
- **Lazy loading** (`lib/firebase/client.ts`): the SDK (Auth + Firestore Lite) loads only on
  the account page, or when this browser signed in before (a `"1"` hint in local storage;
  Firebase keeps its own session tokens, the app stores no passwords or tokens).
- **Sync** (`lib/sync/`): read once per session after the local store has loaded, merge
  deterministically (newest placement result with its evidence, manual choices kept, differing
  choices become conflicts the learner resolves), then write only changed tracks, debounced.
  Failures never change local data; the status shows offline/denied/error and retries on
  `online` or "Sync now". Signing out stops syncing and keeps local data.
- **Security rules** (`firestore.rules`): owner-only, verified email only, strict schema
  validation (ids, levels, scores, string sizes, per-skill evidence), `serverUpdatedAt ==
  request.time`, no deletes, everything else denied.
- **Code Archipelago and XP stay local.** The adventure ledger (`koodaamo:v1:adventure`: crystals,
  quests, cosmetics, equipped items) and XP/achievements (`koodaamo:v1:gamification`) are never
  read or written by the sync code; signing up, signing in or out does not change them.
  `e2e-cloud/integration.spec.ts` checks this, including that no rewards are granted twice.

## Gamification

All rules live in pure functions in `lib/gamification/` and are unit-tested.

- **XP** (`xp.ts`): passed step 5, completed challenge 25, completed lab or checkpoint 50,
  completed chapter bonus 50 (regular chapters only). Every award has an accomplishment id (`step:<exercise>:<step>`,
  `exercise:<exercise>`, `chapter:<course>:<chapter>`); an id is awarded at most once, so
  re-checking, resetting code or re-visiting never adds XP again.
- **Levels** (`levels.ts`): reaching level *L* needs `100·(L−1) + 25·(L−1)·(L−2)` total XP
  (0, 100, 250, 450, 700, 1000, …). Each level asks for 50 XP more than the previous one.
- **Streaks** (`streaks.ts`): a day counts when the learner passes at least one check. Days are
  local calendar keys and are compared as dates (not 24-hour intervals), so time zones and
  DST changes do not break them. The streak stays alive until the end of the day after the
  last active day. Missing a day only resets the counter; XP, progress and the best streak
  stay. There are no lives, freezes, purchases or reminders.
- **Achievements** (`achievements.ts`): First Steps (1 challenge), Curious Coder (5),
  Persistent Learner (10), Bug Hunter (pass a check after failing it), Lab Champion (first lab),
  On a Roll (3-day streak), Python Explorer / JavaScript Explorer (finish a chapter). Each is
  computed from real progress and stored once with its date.
- **Daily goal**: optional (none, 1, 2 or 3 completed challenges per day); reaching it is
  celebrated, missing it has no effect.
- `applyStepPass` (`engine.ts`) turns one passed check into new awards, level changes,
  achievements and streak updates. `recordCheckResult` (`lib/learner/hooks.ts`) saves them and
  publishes them to the toast layer (`celebrations.ts` → `CelebrationToasts`, an
  `aria-live` region). Animations are CSS-only and are reduced under `prefers-reduced-motion`.
- Rewards are computed in the learner's browser and are therefore self-reported (see the
  security notes); they must not be used for anything that needs to be trustworthy.

Milestone 4 adds an independent version-1 adventure document (`koodaamo:v1:adventure`),
without changing the existing XP or proficiency schemas. Crystal balances and inventory derive
from immutable events; existing completion evidence is backfilled once per accomplishment ID.
Quests use UTC calendar periods, while existing streaks/daily goals retain local dates. Local
spending uses Web Locks where supported. See [Milestone 4](MILESTONE_4.md) for the full reward
and cosmetic catalogs, storage behavior and explicit integration points for future cloud sync.

## Workspace UI notes

- Desktop: three resizable panels (keyboard-accessible separators; sizes saved per browser).
  Below 1024 px: one panel at a time with tabs and a fixed Run/Check bar. Panels are hidden
  with CSS, so the editor is never duplicated.
- Cache Components keeps recently visited routes mounted but hidden with React `<Activity>`.
  The Monaco wrapper therefore creates the editor and its models in an effect and disposes
  them in the cleanup, restoring content from the draft store and the cursor position from a
  view-state cache when the route is shown again.
- Monaco renders only in the browser (`use(browser())` + `Suspense`), so no Monaco code runs
  during server rendering.
- Progressive disclosure: the task card and hints are visible; theory, lab requirements and
  the target date are collapsed. Checks are listed only after **Check answer**: failing ones
  under "What to fix", passed ones collapsed. Success shows the XP earned and a Continue
  button; the workspace never navigates on its own.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test` (Vitest: JS engine, Python harness via
  Pyodide in Node, reference solutions for every exercise, content validation, i18n parity,
  gamification rules, learner summary, dates/deadlines, progress, storage, formatting),
  `npm run build`.
- `npm run test:e2e` (Playwright) builds nothing itself: run `npm run build` first. It starts
  `next start` on port 3210 and uses the locally installed Google Chrome
  (`PLAYWRIGHT_CHANNEL` overrides the channel; set it to an empty string after
  `npx playwright install chromium` to use Playwright's bundled browser). Specs cover
  onboarding, the returning-learner home, completing challenges, XP without duplicates,
  level-up, chapter bonus, achievements, streaks, the daily goal, data migration and malformed
  storage, the learning path and keyboard navigation, EN/FI switching, dark mode, JS/Python
  execution and timeouts, a phone-sized layout, and (Milestone 3) level onboarding, skipping,
  placement checks in both languages, reassessment, manual overrides, migration of older data and
  keyboard-only level choice. The PWA specs (`e2e/pwa*.spec.ts`) cover the manifest and Chrome's
  installability check, the install flow, offline pages and reconnection, a service worker update,
  settings, backup export/import, the phone bottom bar and mobile practice.
- `npm run test:rules` runs the security-rules tests and real-SDK sync tests against the Auth
  and Firestore emulators (demo project, Firebase CLI and Java required).
  `npm run build:e2e-cloud && npm run test:e2e:cloud` runs the account UI in a browser against
  the emulators, using a separate `.next-cloud-e2e` build.
- If styles in a production build look out of date, delete `.next/cache/turbopack` and build
  again. During this milestone one local build served an older `globals.css` from Turbopack's
  build cache; the cause could not be reproduced afterwards.
