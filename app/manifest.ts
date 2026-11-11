import type { MetadataRoute } from "next";

/**
 * Web App Manifest. Installing is optional; the app works the same in a
 * browser tab. `start_url` "/" lets the proxy open the learner's language
 * (cookie) so one installed app serves both Finnish and English.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Koodaamo",
    short_name: "Koodaamo",
    description: "Learn to code in small, real steps · Opi koodaamaan pienin, oikein askelin",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#f6f7f9",
    theme_color: "#3a57d6",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Practice · Harjoittele", short_name: "Practice", url: "/practice", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Progress · Edistyminen", short_name: "Progress", url: "/progress", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
