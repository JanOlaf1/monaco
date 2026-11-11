import {
  Box,
  Braces,
  Bug,
  Calculator,
  Clock,
  Compass,
  Flame,
  Flag,
  FlaskConical,
  Footprints,
  Layers,
  List,
  Map,
  Mountain,
  Repeat,
  Rocket,
  ShieldCheck,
  Sparkles,
  Split,
  SquareFunction,
  ToggleRight,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { ChapterIcon, ChapterTone } from "@/lib/content/types";
import type { AchievementIcon } from "@/lib/gamification/achievements";

/** Visual design tokens for chapter themes and achievements. */
export const chapterIcons: Record<ChapterIcon, LucideIcon> = {
  compass: Compass,
  box: Box,
  calculator: Calculator,
  toggle: ToggleRight,
  split: Split,
  function: SquareFunction,
  repeat: Repeat,
  list: List,
  braces: Braces,
  type: Type,
  rocket: Rocket,
  flag: Flag,
  sparkles: Sparkles,
  shield: ShieldCheck,
  clock: Clock,
  layers: Layers,
};

export const achievementIcons: Record<AchievementIcon, LucideIcon> = {
  footprints: Footprints,
  sparkles: Sparkles,
  mountain: Mountain,
  bug: Bug,
  flask: FlaskConical,
  flame: Flame,
  map: Map,
  braces: Braces,
};

export interface ToneClasses {
  /** Icon tile: tinted background + strong foreground. */
  tile: string;
  /** Solid fill for completed markers and progress. */
  solid: string;
  /** Border colour for outlined elements. */
  border: string;
  /** Text colour. */
  text: string;
}

export const tones: Record<ChapterTone, ToneClasses> = {
  teal: {
    tile: "bg-teal-500/12 text-teal-700 dark:text-teal-300",
    solid: "bg-teal-600 dark:bg-teal-400",
    border: "border-teal-500/50",
    text: "text-teal-700 dark:text-teal-300",
  },
  sky: {
    tile: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    solid: "bg-sky-600 dark:bg-sky-400",
    border: "border-sky-500/50",
    text: "text-sky-700 dark:text-sky-300",
  },
  violet: {
    tile: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
    solid: "bg-violet-600 dark:bg-violet-400",
    border: "border-violet-500/50",
    text: "text-violet-700 dark:text-violet-300",
  },
  amber: {
    tile: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
    solid: "bg-amber-500 dark:bg-amber-400",
    border: "border-amber-500/50",
    text: "text-amber-700 dark:text-amber-300",
  },
  rose: {
    tile: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
    solid: "bg-rose-600 dark:bg-rose-400",
    border: "border-rose-500/50",
    text: "text-rose-700 dark:text-rose-300",
  },
  lime: {
    tile: "bg-lime-500/15 text-lime-700 dark:text-lime-300",
    solid: "bg-lime-600 dark:bg-lime-400",
    border: "border-lime-500/50",
    text: "text-lime-700 dark:text-lime-300",
  },
  indigo: {
    tile: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
    solid: "bg-indigo-600 dark:bg-indigo-400",
    border: "border-indigo-500/50",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  orange: {
    tile: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
    solid: "bg-orange-600 dark:bg-orange-400",
    border: "border-orange-500/50",
    text: "text-orange-700 dark:text-orange-300",
  },
};
