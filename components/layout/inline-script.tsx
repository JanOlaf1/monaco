"use client";

/**
 * An inline script that runs while the browser parses the server HTML (before first paint).
 *
 * When React renders the root layout on the client (for example a soft navigation between
 * /en and /fi), it would create this <script> again; browsers never execute such scripts and
 * React reports it as a development error. Rendering `type="text/plain"` on the client turns
 * that copy into an inert data block, while the server HTML keeps `text/javascript`.
 * `suppressHydrationWarning` accepts the server value during hydration.
 * See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
