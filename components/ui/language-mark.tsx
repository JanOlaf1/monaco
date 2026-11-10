import type { ProgrammingLanguage } from "@/lib/content/types";
import { cn } from "@/lib/cn";

const marks: Record<ProgrammingLanguage, { label: string; name: string; className: string }> = {
  javascript: {
    label: "JS",
    name: "JavaScript",
    className: "bg-amber-400/15 text-amber-700 dark:text-amber-300",
  },
  typescript: {
    label: "TS",
    name: "TypeScript",
    className: "bg-blue-500/12 text-blue-700 dark:text-blue-300",
  },
  python: {
    label: "Py",
    name: "Python",
    className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
  react: {
    label: "Re",
    name: "React",
    className: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300",
  },
};

export const languageNames: Record<ProgrammingLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  react: "React",
};

/** A neutral monogram tile for a technology (not an official logo). */
export function LanguageMark({
  language,
  size = "md",
  className,
}: {
  language: ProgrammingLanguage;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const mark = marks[language];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-mono font-semibold tracking-tight",
        size === "sm" && "size-6 text-[10px] rounded-md",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-12 text-sm",
        mark.className,
        className,
      )}
    >
      {mark.label}
    </span>
  );
}
