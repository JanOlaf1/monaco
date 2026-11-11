import { getCourses, getExercise } from "./registry";
import { SKILL_LEVELS, type ExerciseType, type ProgrammingLanguage, type SkillLevel } from "./types";

/**
 * Playable exercise counts per track and level (the level of the chapter an
 * exercise belongs to). docs/CONTENT_COVERAGE.md shows this matrix, and
 * tests/coverage.test.ts keeps the document in sync with the registry.
 */
export interface CoverageRow {
  track: ProgrammingLanguage;
  byLevel: Record<SkillLevel, number>;
  byType: Record<ExerciseType, number>;
  total: number;
}

export function coverageMatrix(): CoverageRow[] {
  return getCourses().map((course) => {
    const byLevel = Object.fromEntries(SKILL_LEVELS.map((level) => [level, 0])) as Record<SkillLevel, number>;
    const byType: Record<ExerciseType, number> = { challenge: 0, lab: 0, checkpoint: 0 };
    for (const chapter of course.chapters) {
      if (chapter.status !== "available") continue;
      for (const id of chapter.exerciseIds) {
        const exercise = getExercise(id);
        if (!exercise) continue;
        byLevel[chapter.level] += 1;
        byType[exercise.type] += 1;
      }
    }
    return { track: course.language, byLevel, byType, total: Object.values(byLevel).reduce((a, b) => a + b, 0) };
  });
}
