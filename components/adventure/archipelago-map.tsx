"use client";

import Link from "next/link";
import type { SkillLevel } from "@/lib/content/types";
import { adventureDictionary } from "@/lib/i18n/adventure";
import { useI18n } from "@/lib/i18n/client";
import { useCatalog } from "@/lib/learner/catalog-context";

const regions: SkillLevel[] = ["beginner", "intermediate", "advanced", "professional"];

/** Original compact SVG landscapes, deliberately a navigation aid rather than a game screen. */
function Island({ stage }: { stage: SkillLevel }) {
  return (
    <svg viewBox="0 0 160 90" className="h-20 w-36" aria-hidden="true">
      <path d="M10 76 Q37 68 61 76 T110 76 T150 76" fill="none" stroke="#38a5b6" strokeWidth="2" opacity=".5" />
      <ellipse cx="80" cy="65" rx="57" ry="13" fill="#45a58a" />
      <path d="M24 65 Q80 95 136 65" fill="#bb8b55" />
      {stage === "beginner" ? <g>
        <path d="M40 57 H92 V66 H40 Z M49 64 V76 M81 64 V76" stroke="#704e36" strokeWidth="4" fill="#d5ac77" />
        <path d="M93 52 L118 52 L112 61 L98 61 Z" fill="#d87840" />
        <path d="M105 23 V52 M108 24 L128 44 H108 Z" stroke="#384c66" strokeWidth="2" fill="#faf0d9" />
        <path d="M47 45 L47 25 L61 16 L75 25 L75 45 Z" fill="#f1d09b" />
        <path d="M42 25 L61 10 L80 25 Z" fill="#477c93" />
      </g> : stage === "intermediate" ? <g>
        {[45, 80, 115].map((x, index) => <g key={x} transform={`translate(${x} ${index === 1 ? -7 : 0})`}>
          <path d="M0 41 V66" stroke="#72553b" strokeWidth="5" />
          <path d="M0 18 L-17 43 H-10 L-22 55 H22 L10 43 H17 Z" fill={index === 1 ? "#36735c" : "#548d64"} />
        </g>)}
        <path d="M71 70 Q57 60 73 56 T84 45" stroke="#f0d59c" strokeWidth="5" fill="none" />
      </g> : stage === "advanced" ? <g>
        <path d="M42 60 V30 H68 V60 M74 60 V16 H99 V60 M106 60 V39 H125 V60" fill="#6e8aaf" stroke="#455d7e" strokeWidth="2" />
        {[49, 59, 81, 91, 112, 120].map((x) => <path key={x} d={`M${x} 43 V48 M${x} 32 V37`} stroke="#f7d78a" strokeWidth="4" />)}
        <path d="M33 63 H132 M84 61 V73" stroke="#e4c799" strokeWidth="5" />
        <path d="M82 14 H92 M87 9 V14" stroke="#455d7e" strokeWidth="3" />
      </g> : <g>
        <path d="M34 66 L80 8 L126 66 Z" fill="#758697" />
        <path d="M80 8 L59 35 L73 30 L82 38 L91 31 L103 38 Z" fill="#edf2f3" />
        <path d="M68 67 L83 53 L77 45" stroke="#d8bd86" strokeWidth="4" fill="none" />
        <path d="M80 9 V1 L98 5 L80 10" fill="#db8c48" />
      </g>}
    </svg>
  );
}

export function ArchipelagoMap() {
  const { locale } = useI18n();
  const text = adventureDictionary(locale);
  const { courses } = useCatalog();
  return (
    <section aria-label={text.title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 className="text-base font-semibold">{text.title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-fg-muted">{text.worldBody}</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {regions.map((stage) => <li key={stage} className="rounded-xl border border-line bg-muted/40 p-4">
          <div className="flex justify-center"><Island stage={stage} /></div>
          <h3 className="mt-1 text-sm font-semibold">{text.regions[stage].title}</h3>
          <p className="mt-1 min-h-14 text-xs leading-relaxed text-fg-muted">{text.regions[stage].body}</p>
          {stage === "professional" ? <p className="mt-3 text-xs text-fg-subtle">{text.future}</p> :
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
              {courses.filter((course) => course.status === "available").flatMap((course) => {
                const chapter = course.chapters.find((candidate) => candidate.status === "available" && candidate.level === stage);
                return chapter ? [<li key={course.id}><Link className="text-xs font-medium text-accent underline-offset-4 hover:underline" href={`/${locale}/courses/${course.id}#chapter-${chapter.id}`}>{course.title}</Link></li>] : [];
              })}
            </ul>}
        </li>)}
      </ol>
    </section>
  );
}
