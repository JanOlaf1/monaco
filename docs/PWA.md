# PWA, offline use, mobile practice and backups

Koodaamo can be installed as a Progressive Web App. Installing is optional: everything works the
same in a browser tab, and nothing about learning depends on it.

## Installation

- `app/manifest.ts` → `/manifest.webmanifest`: name and short name "Koodaamo", `display: standalone`,
  `start_url` and `scope` `/` (the proxy redirects `/` to the learner's language), theme and
  background colours, shortcuts to Practice and Progress.
- Icons in `public/icons/`: `icon-192.png`, `icon-512.png` (purpose `any`), `maskable-192.png`,
  `maskable-512.png` (full-bleed with a safe zone), `apple-touch-icon.png` (180 px) and `icon.svg`.
  They are rendered from the SVG sources by `node scripts/generate-icons.mjs` (uses the local
  Chrome through Playwright); the PNGs are committed.
- The root layout adds `applicationName`, `appleWebApp` (iOS standalone title and status bar),
  icon links and `viewport-fit=cover`, so the phone bottom bar can pad itself for the home
  indicator.
- **Install flows** (Settings → Install Koodaamo, `components/settings/install-card.tsx`):
  - Chromium browsers fire `beforeinstallprompt`; `lib/pwa/pwa-store.ts` keeps the event and the
    **Install app** button calls its `prompt()` only after the learner clicks.
  - iOS/iPadOS Safari has no prompt, so short localized steps are shown (Share → Add to Home
    Screen → Add).
  - Other browsers get a one-line hint about the browser menu.
  - No popup is ever shown automatically, and an installed app shows "running as an installed
    app" instead.

## Service worker (`public/sw.js`)

The service worker is hand-written (no extra dependency) and registered only in production builds
(`lib/pwa/pwa-store.ts`, `updateViaCache: "none"`). `/sw.js` itself is served with
`Cache-Control: no-cache, no-store, must-revalidate` (`next.config.ts`).

| Request | Strategy |
| --- | --- |
| Page navigations | Network first; the copy from the last visit is used only when the network fails. A page never opened before falls back to `/{locale}/offline`. |
| `/_next/static/*` (content-hashed) | Cache first |
| Monaco (`/vendor/monaco-editor/*`), `/workers/*`, icons, manifest | Network first with a cached fallback (their URLs do not change between versions) |
| Other origins (Firebase Authentication, Firestore, Google APIs), non-GET, Next.js RSC data requests, `/api/*`, `/vendor/pyodide/*` | Not handled and never cached |

- The install step precaches both offline pages and the stylesheets/scripts they reference, so
  the fallback page renders fully offline.
- Pages contain no learner data (it lives in `localStorage`), and Firebase traffic is never
  touched, so no credentials, tokens, Firestore responses or execution results are cached.
- At most 120 visited pages are kept.

### Updates

A new service worker version installs in the background and then **waits**. The page shows a
quiet notice ("A new version of Koodaamo is ready" — Update now / Later). **Update now** sends
`SKIP_WAITING` and reloads once the new version controls the page. **Later** keeps the learner on
the current version; the waiting version also takes over when every Koodaamo tab is closed. Old
caches (`koodaamo-sw-*` with another version) are deleted on activation. Bump `VERSION` in
`sw.js` when the caching rules change.

Because pages are network-first, an online learner always gets the newest HTML, and hashed assets
cannot mix between versions, so no one is stranded on an old build.

### What works offline

Offline-capable:

- Pages opened before, once Koodaamo has loaded online with the service worker active.
- JavaScript lessons opened and run before: editing, running and checking code (the JS worker is a
  hashed `/_next/static` chunk and Monaco is cached on use).
- Practice activities on a practice page opened before (answers are checked on the device and
  results are saved locally).
- Progress, drafts, XP and crystals (all in `localStorage`).

Needs a connection:

- **Python lessons.** The Pyodide runtime (about 28 MB) is deliberately not cached, so the app
  does not claim Python works offline.
- Signing in and syncing skill levels with an account.
- Pages never opened before.
- Getting new versions.

The header shows a small "Offline" marker while the connection is down, together with a
dismissible notice. Returning online shows "You're back online" briefly. The account sync engine
already retries when the connection returns; local data is unaffected.

## Mobile layout

- Phones (below the `sm` breakpoint) get a bottom bar with Learn, Courses, Practice, Progress and
  Settings: 56 px tall targets, safe-area padding, `aria-current` for the active page, and a spacer
  so content is never hidden. The coding workspace hides it because it has its own Run/Check bar.
- Larger screens keep the header navigation. Labels show from `lg`; tablets show icons with
  accessible names and tooltips. Settings is an icon in the header.
- The desktop workspace and Monaco are unchanged.

## Mobile practice (`/[lang]/practice`)

Short activities that complement (never replace) the Monaco workspace, defined as data in
`content/practice/{python,javascript}.ts` (typed in `lib/practice/types.ts`):

| Kind | Interaction | Checked by |
| --- | --- | --- |
| Predict the output | choose the exact output | answer key |
| Find the bug | choose the faulty line | answer key; the fix is shown afterwards |
| Complete the code | choose what fills the blank | every option that produces the expected output is accepted |
| Put the lines in order | move lines with up/down buttons (touch, keyboard, screen reader) | the arrangement's text against all accepted orders |
| Choose the implementation | pick a function | every option that passes the harness is accepted |
| Quick quiz | concept question | answer key (and, for quizzes about code, a stated runtime result) |
| Review | resurfaces answered activities and those of completed lessons, least recently practised first | — |

- **Genuine checking.** `tests/practice.test.ts` runs every snippet with the lessons' own
  JavaScript engine and Pyodide harness. It verifies:
  - each predict answer matches the real output;
  - every bug fix works and the original doesn't;
  - exactly the accepted completions and implementations pass;
  - for reorder items, all permutations are executed and exactly the working ones are accepted.
- **Rewards.**
  - `recordPracticeAnswer` (`lib/learner/hooks.ts`) re-evaluates the answer against the registry,
    so the UI cannot award XP for an unchecked answer.
  - The first correct answer earns 5 XP (`practice:<activityId>`, awarded once).
  - Any correct answer counts as learning activity for the streak, and achievements are
    re-checked.
  - Practice earns **no crystals** and does not count toward the daily exercise goal or
    exercise-based achievements: crystals stay tied to verified code checks.
  - "Show answer" reveals the key without saving or rewarding anything.
- Only Python and JavaScript have activities. TypeScript and React practice is not offered until
  those courses exist.

## Backup and restore (Settings)

`lib/backup/backup.ts` (pure) and `lib/backup/actions.ts` (stores):

- **Export** downloads `koodaamo-backup-YYYY-MM-DD.json` containing `progress`, `gamification`,
  `competency`, `adventure`, `practice`, `drafts` and `schedule`. It never contains passwords,
  Firebase credentials, sign-in tokens or the account session hint.
- **Import** validates each section with the same parser used for stored data: malformed entries
  are dropped, prototype keys are ignored, files over 5 MB and newer backup versions are refused.
  The learner then confirms a summary dialog. Merging only adds data:
  - Progress: union of passed steps, earliest completion.
  - XP awards: union by accomplishment id. Imported awards must match current lessons or
    activities and get their real XP value, so nothing is counted twice and tampered values are
    corrected.
  - Crystals: union of the event ledger by id. If both devices spent the same crystals on
    different items, the item owned in this browser is kept and the backup's purchase is
    reported.
  - Practice results: union.
  - Skill levels: the account sync merge; on a conflict this browser's choice is kept.
  - Drafts and target dates: existing ones are kept; missing ones are added.
- Importing the same file twice changes nothing ("Everything in this backup is already here").

**Storage note shown to learners:** an installed app and the browser may keep separate storage
(on iPhone and iPad the home-screen app does not see Safari's data), and clearing site data removes
progress. A backup file is the way to move or keep it. Only skill levels sync through an account;
the rest is not synchronized by Firestore.

## Limitations

- Real devices were not tested. Automated tests use Chrome with a Pixel 7 profile and an iPhone
  user agent for the iOS instructions.
- Chrome's automated installability check reports `in-incognito` for every automated context. The
  test checks that no other installability errors are reported.
- Offline navigation relies on cached HTML. Next.js client navigations whose data was not
  prefetched fall back to a full page load, which the service worker then serves from cache or
  with the offline page.
- Backup files are not signed. Like local storage itself, they can be edited by the learner;
  import corrects XP values and ignores unknown entries, but it is not tamper-proof.
