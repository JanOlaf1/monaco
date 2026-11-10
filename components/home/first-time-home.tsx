import { Code, Flame, Zap } from "lucide-react";
import Link from "next/link";
import { Mascot } from "@/components/mascot/mascot";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { PathChooser } from "./path-chooser";

/** The first-visit home: a welcome, one choice and one button. Server-rendered for a fast first paint. */
export function FirstTimeHome({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const features = [
    { icon: Zap, label: dict.home.features.small },
    { icon: Flame, label: dict.home.features.rewards },
    { icon: Code, label: dict.home.features.real },
  ];
  return (
    <section className="grid items-center gap-6 py-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10 lg:py-10">
      <div className="order-2 max-w-xl lg:order-1">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.1]">
          {dict.home.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-fg-muted text-pretty sm:text-lg">{dict.home.body}</p>
        <div className="mt-8">
          <PathChooser />
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-muted">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <Icon className="size-4 text-accent" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
        <Link href={`/${locale}/courses`} className="mt-6 inline-block text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
          {dict.home.browseAll}
        </Link>
      </div>
      {/* Phones: a compact mascot beside the bubble so "Start learning" stays on the first screen. */}
      <div className="order-1 flex flex-row-reverse items-center justify-end gap-3 lg:order-2 lg:flex-col lg:justify-center">
        <div className="relative rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-3 text-left text-sm font-medium shadow-card sm:text-base lg:rounded-tl-2xl lg:rounded-bl-sm lg:text-center">
          {dict.home.welcomeBubble}
        </div>
        <Mascot mood="welcome" size={200} label={dict.mascot.name} animate className="shrink-0 max-lg:size-20" />
      </div>
    </section>
  );
}
