import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  label,
  className,
}: {
  /** 0–100 */
  value: number;
  label: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", clamped === 100 ? "bg-success" : "bg-accent")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
