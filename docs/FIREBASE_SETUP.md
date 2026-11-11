# Firebase setup (accounts and competency sync)

Koodaamo is local-first. Accounts are optional and, today, synchronise **only skill levels and
placement results** (`users/{uid}/competency/{track}`). Progress, XP, achievements, streaks,
code drafts and target dates stay in the browser. Without a Firebase configuration the app hides
accounts and never contacts Firebase.

The project is the existing **`monaco-7bf62`** (`.firebaserc`). Do not create another project.
Nothing in this repository deploys automatically; every step below is done by a developer.

## 1. Firebase Console (manual)

1. **Authentication → Sign-in method:** *Email/Password* enabled (already done). Leave
   *Email link (passwordless sign-in)* off. Google sign-in is intentionally not used yet.
2. **Authentication → Settings → User actions:** keep **Email enumeration protection** on. The
   app already shows the same message for unknown accounts and wrong passwords, and a neutral
   message for password resets.
3. **Authentication → Settings → Authorized domains:** make sure the App Hosting domain
   (`<backend>--monaco-7bf62.<region>.hosted.app`), any custom domain and `localhost` are listed.
4. **Authentication → Templates (optional):** set the sender name and adjust the verification and
   password-reset texts. The app sets the language per request (`fi` or `en`), so Firebase sends
   the matching built-in translation.
5. **Firestore Database:** the `(default)` database in *Native mode / Standard edition* (already
   created). If it was created in *test mode*, it is open to anyone until the rules in step 3 are
   deployed — deploy them before announcing accounts.
6. **Project settings → General → Your apps:** a **Web app** must exist. Its config is what the
   browser uses (it identifies the project; it is not a secret).
7. **App Hosting → backend `monaco` → Settings:** make sure the backend is associated with that
   web app. App Hosting then provides `FIREBASE_WEBAPP_CONFIG` during builds, the Firebase SDK
   turns it into default options, and `lib/firebase/config.ts` picks them up. No change to
   `apphosting.yaml` is needed and no keys are committed.

Optional hardening for later: App Check (reCAPTCHA Enterprise) for Firestore and Auth, and
budget alerts in Google Cloud Billing.

## 2. Local development

Without configuration everything works locally and accounts are hidden. To try accounts:

- **Against the emulators (recommended):** start `firebase emulators:start --only auth,firestore
  --project demo-koodaamo` and create a `.env.local` (git-ignored):

  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-koodaamo.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-koodaamo
  NEXT_PUBLIC_FIREBASE_APP_ID=1:1:web:demo
  NEXT_PUBLIC_FIREBASE_EMULATORS=1
  ```

  Verification emails are not sent; the Auth emulator prints the links in its log.
- **Against the real project:** copy the web app's `apiKey`, `authDomain`, `projectId` and `appId`
  into `.env.local` (without `NEXT_PUBLIC_FIREBASE_EMULATORS`). Never commit `.env*` files.

## 3. Deploy the security rules (when approved)

The rules live in `firestore.rules` and are referenced from `firebase.json`. Review them first;
they are a carefully tested prototype, not a guarantee.

```bash
firebase login
firebase use monaco-7bf62
npm run test:rules                                              # emulator tests must pass
firebase deploy --only firestore:rules --project monaco-7bf62 --dry-run   # validate only
firebase deploy --only firestore:rules --project monaco-7bf62
```

`--only firestore:rules` deploys nothing else (no hosting, no indexes, no functions). The app
needs no composite indexes. The app code itself reaches production through the existing App
Hosting rollout from GitHub.

## 4. Tests

| Command | Needs | What it checks |
| ------- | ----- | -------------- |
| `npm test` | – | Merge rules, document validation, sync engine (fake cloud), error mapping |
| `npm run test:rules` | Firebase CLI, Java 21+ | Security rules (16 cases) and real-SDK sync against the Auth and Firestore emulators |
| `npm run build:e2e-cloud && npm run test:e2e:cloud` | Firebase CLI, Java 21+, Chrome | Sign-up, email verification, migration, second device, sign-out and error messages in a browser |
| `npm run test:e2e` | Chrome | The default build: accounts hidden, no requests to Firebase |

Emulator tests use the demo project `demo-koodaamo`, so they can never reach real data. The
emulator ports are set in `firebase.json` (Auth 9095, Firestore 8085).

**Troubleshooting:** on Windows the Firestore emulator (a `java.exe` process) can keep running
after `emulators:exec` ends, and the next run fails with "port taken". Stop that Java process (or
wait for it to exit) before running the emulator tests again.
