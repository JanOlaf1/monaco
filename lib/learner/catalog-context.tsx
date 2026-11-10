"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { toGamificationCatalog, type CatalogCourse } from "@/lib/content/catalog";
import type { GamificationCatalog } from "@/lib/gamification/engine";

interface CatalogValue {
  courses: CatalogCourse[];
  gamification: GamificationCatalog;
}

const CatalogContext = createContext<CatalogValue | null>(null);

/** Provides the localized course catalog (built on the server) to client components. */
export function CatalogProvider({ courses, children }: { courses: CatalogCourse[]; children: ReactNode }) {
  const value = useMemo(() => ({ courses, gamification: toGamificationCatalog(courses) }), [courses]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside <CatalogProvider>.");
  return value;
}
