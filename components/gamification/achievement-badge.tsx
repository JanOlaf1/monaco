import { tones, achievementIcons } from "@/components/learn/theme";
import { cn } from "@/lib/cn";
import type { AchievementDefinition } from "@/lib/gamification/achievements";

/** Round medallion for an achievement; greyed out until earned. */
export function AchievementMedal({
  definition,
  earned,
  size = "md",
}: {
  definition: AchievementDefinition;
  earned: boolean;
  size?: "sm" | "md";
}) {
  const Icon = achievementIcons[definition.icon];
  const tone = tones[definition.tone];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full border-2",
        size === "md" ? "size-14" : "size-10",
        earned ? cn(tone.tile, tone.border) : "border-dashed border-line-strong bg-muted text-fg-subtle/70",
      )}
    >
      <Icon className={size === "md" ? "size-6" : "size-4.5"} />
    </span>
  );
}
