# Koodaamo

An interactive, bilingual (English / Finnish) coding course platform. Learners follow a
visual, chapter-based learning path of short challenges and larger labs, write real code in
Monaco Editor, run it, and get per-requirement feedback from automated tests.

- **Python** (22 exercises) and **JavaScript** (21 exercises) are fully interactive, each in
  10 chapters (code runs in Web Workers; Python uses Pyodide).
- **TypeScript** and **React** courses are outlined and clearly marked as coming soon.
- Motivation without pressure: XP, levels, a learning streak, 8 achievements, an optional
  daily goal and an original otter mascot. Nothing is ever locked, and there are no lives,
  energy or purchases.
- Progress, rewards, code drafts and optional personal target dates are saved in the
  browser. No account or database is required.

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

The e2e tests use the locally installed Google Chrome by default. Without Chrome, run
`npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL` to an empty string.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure, content model, how to write
  exercises and tests, code execution and its security limits, persistence, XP / level /
  streak / achievement rules.
- [docs/FIREBASE_PLAN.md](docs/FIREBASE_PLAN.md): the plan for Authentication, Firestore sync
  and Security Rules. Nothing beyond App Hosting is enabled yet.

## Deployment

The project is connected to Firebase App Hosting (`apphosting.yaml`, `firebase.json`). No other
Firebase services are used yet.
