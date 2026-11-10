/**
 * Level curve. Advancing from level L to L + 1 costs
 *
 *   100 + 50 × (L − 1) XP      (100, 150, 200, 250, …)
 *
 * so the total XP at which level L starts is
 *
 *   threshold(L) = 100 × (L − 1) + 25 × (L − 1) × (L − 2)
 *
 *   L:          1    2    3    4    5     6     7     8     9     10
 *   threshold:  0  100  250  450  700  1000  1350  1750  2200  2700
 *
 * One micro-challenge is worth 30 XP (5 for the step + 25 for completing it),
 * so level 2 arrives after about four challenges and later levels gradually
 * need more work. Levels are purely motivational: nothing is gated by them.
 */
export const LEVEL_BASE_XP = 100;
export const LEVEL_STEP_XP = 50;

/** XP needed to go from `level` to `level + 1`. */
export function xpToAdvance(level: number): number {
  return LEVEL_BASE_XP + LEVEL_STEP_XP * (Math.max(1, level) - 1);
}

/** Total XP at which `level` starts. */
export function levelThreshold(level: number): number {
  const n = Math.max(1, Math.floor(level)) - 1;
  return LEVEL_BASE_XP * n + (LEVEL_STEP_XP * n * (n - 1)) / 2;
}

export interface LevelInfo {
  level: number;
  totalXp: number;
  /** XP earned since the current level started. */
  xpIntoLevel: number;
  /** XP the current level spans. */
  xpForLevel: number;
  /** XP still needed for the next level. */
  xpToNext: number;
  /** 0–1 progress through the current level. */
  progress: number;
}

export function levelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (levelThreshold(level + 1) <= xp) level++;
  const start = levelThreshold(level);
  const span = xpToAdvance(level);
  const into = xp - start;
  return { level, totalXp: xp, xpIntoLevel: into, xpForLevel: span, xpToNext: span - into, progress: into / span };
}
