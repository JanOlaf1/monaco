// Renders the app icons (PNG) from the original SVG sources in public/icons/.
// Run after changing the artwork: `node scripts/generate-icons.mjs`
// Uses the locally installed Chrome through Playwright (a dev dependency).
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const outputs = [
  { source: "public/icons/icon.svg", file: "public/icons/icon-192.png", size: 192 },
  { source: "public/icons/icon.svg", file: "public/icons/icon-512.png", size: 512 },
  { source: "public/icons/maskable.svg", file: "public/icons/maskable-192.png", size: 192 },
  { source: "public/icons/maskable.svg", file: "public/icons/maskable-512.png", size: 512 },
  // iOS adds its own rounded corners and needs an opaque, full-bleed image.
  { source: "public/icons/maskable.svg", file: "public/icons/apple-touch-icon.png", size: 180 },
];

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL === "" ? undefined : "chrome" });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const { source, file, size } of outputs) {
    const svg = await readFile(source, "utf8");
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent"><img alt="" width="${size}" height="${size}" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"></body></html>`,
    );
    await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    console.log(`wrote ${file}`);
  }
} finally {
  await browser.close();
}
