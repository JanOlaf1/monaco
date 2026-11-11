"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { toGamificationCatalog, type CatalogCourse, type CatalogSkill } from "@/lib/content/catalog";
import type { GamificationCatalog } from "@/lib/gamification/engine";

interface CatalogValue {
  courses: CatalogCourse[];
  skills: CatalogSkill[];
  gamification: GamificationCatalog;
}

const CatalogContext = createContext<CatalogValue | null>(null);

/** Provides the localized course and skill catalog (built on the server) to client components. */
export function CatalogProvider({
  courses,
  skills,
  children,
}: {
  courses: CatalogCourse[];
  skills: CatalogSkill[];
  children: ReactNode;
}) {
  const value = useMemo(() => ({ courses, skills, gamification: toGamificationCatalog(courses) }), [courses, skills]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside <CatalogProvider>.");
  return value;
}
