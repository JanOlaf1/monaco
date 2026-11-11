// Builds the app into .next-cloud-e2e with a demo Firebase configuration that
// talks only to the local Emulator Suite (never to a real project). Used by
// `npm run test:e2e:cloud`; the normal `npm run build` output is untouched.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const assets = spawnSync(process.execPath, ["scripts/copy-runtime-assets.mjs"], { stdio: "inherit" });
if (assets.status !== 0) process.exit(assets.status ?? 1);

const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_DIST_DIR: ".next-cloud-e2e",
    NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-koodaamo.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-koodaamo",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:1:web:demo",
    NEXT_PUBLIC_FIREBASE_EMULATORS: "1",
  },
});
process.exit(result.status ?? 1);
