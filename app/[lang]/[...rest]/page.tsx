import { notFound } from "next/navigation";

/**
 * This route always renders the not-found page, so there is nothing to validate for instant
 * navigation (validation would only report that notFound() stopped rendering). Next.js
 * excludes its own error routes the same way.
 */
export const instant = false;

/** Any unknown path below a locale renders the localized not-found page. */
export default function CatchAll() {
  notFound();
}
