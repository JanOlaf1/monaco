# Koodaamo

An interactive, bilingual (English / Finnish) coding course platform. Learners follow a
visual, chapter-based learning path of short challenges and larger labs, write real code in
Monaco Editor, run it, and get per-requirement feedback from automated tests.

- **Python** (31 exercises) and **JavaScript** (30 exercises) are fully interactive, each in
  13 chapters across beginner, intermediate and advanced bands, with a checkpoint between bands
  (code runs in Web Workers; Python uses Pyodide). See
  [docs/CONTENT_COVERAGE.md](docs/CONTENT_COVERAGE.md).
- Learners can say how much they already know (per language) or take an optional placement check,
  and get a suggested starting chapter. This proficiency level is separate from the XP level and
  never locks content.
- **TypeScript** and **React** courses are outlined and clearly marked as coming soon.
- Motivation without pressure: XP, levels, a learning streak, 8 achievements, an optional
  daily goal and an original otter mascot. Nothing is ever locked, and there are no lives,
  energy or purchases.
- Progress, rewards, code drafts and optional personal target dates are saved in the
  browser. No account or database is required; an optional account (email and password)
  syncs only skill levels and placement results across devices.

"Koodaamo" is a working name, defined once in `lib/i18n/dictionaries/*.ts` (`meta.siteName`).

## Getting started

Requires Node.js 20.9+ (developed with Node 24).

```bash
npm install
npm run dev        # http://localhost:3000 (redirects to /en)
```

`npm run dev` and `npm run build` first run `scripts/copy-runtime-assets.mjs`, which copies
Monaco Editor and the Pyodide runtime from `node_modules` into `public/vendor`
(git-ignored, about 28 MB).

## Scripts

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Development server                                |
| `npm run build`     | Production build                                  |
| `npm start`         | Serve the production build                        |
| `npm run typecheck` | Generate route types and run `tsc`                |
| `npm run lint`      | ESLint                                            |
| `npm test`          | Vitest unit tests (includes Pyodide-based Python grading tests) |
| `npm run test:e2e`  | Playwright browser tests against the production build (run `npm run build` first) |
| `npm run test:rules` | Firestore security rules + sync tests on the Firebase emulators (needs Firebase CLI and Java 21+) |
| `npm run build:e2e-cloud` + `npm run test:e2e:cloud` | Account and sync UI in a browser against the emulators |

The e2e tests use the locally installed Google Chrome by default. Without Chrome, run
`npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL` to an empty string.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure, content model, how to write
  exercises and tests, code execution and its security limits, persistence, XP / level /
  streak / achievement rules.
- [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md): Firebase Console steps, local configuration,
  deploying the security rules and the emulator tests.
- [docs/FIREBASE_PLAN.md](docs/FIREBASE_PLAN.md): what is synced today (competency only) and the
  plan for the other learner data.

## Deployment

The project is connected to Firebase App Hosting (`apphosting.yaml`, `firebase.json`). Optional
accounts use Firebase Authentication (email/password) and Cloud Firestore; the Firestore security
rules (`firestore.rules`) must be deployed manually as described in
[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md). Nothing is deployed automatically.
