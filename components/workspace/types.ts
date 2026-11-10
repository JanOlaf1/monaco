import type { ChapterDefinition } from "@/lib/content/types";

/** Navigation context for the workspace, prepared by the exercise page. */
export interface WorkspaceNav {
  courseId: string;
  courseTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  chapterTheme: ChapterDefinition["theme"];
  /** 1-based position of this exercise in its chapter, and the chapter size. */
  positionInChapter: number;
  chapterSize: number;
  previous?: { id: string; title: string };
  next?: { id: string; title: string };
}
