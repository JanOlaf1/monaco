import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type MascotMood = "welcome" | "thinking" | "celebrating" | "encouraging";

/**
 * Saku, Koodaamo's otter mascot — an original flat-vector character with
 * explorer goggles and a scarf. Colours are fixed (they read well on both
 * light and dark backgrounds). Pass `label` when the mascot conveys meaning;
 * otherwise it is decorative and hidden from assistive technology.
 */
const C = {
  fur: "#8b5e3c",
  furDark: "#6b4529",
  cream: "#f3dfc1",
  ink: "#2b1d14",
  strap: "#2f5d62",
  lens: "#a7e8dc",
  scarf: "#e8833a",
  scarfDark: "#c4692a",
  blush: "#e99a7a",
  spark: "#fbbf24",
};

function Arm({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return <ellipse cx={x} cy={y} rx={8} ry={13} fill={C.fur} transform={`rotate(${rotate} ${x} ${y})`} />;
}

function Sparkle({ x, y, size = 6 }: { x: number; y: number; size?: number }) {
  const s = size;
  return (
    <path
      d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`}
      fill={C.spark}
    />
  );
}

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === "celebrating") {
    return (
      <g stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M60 61 Q66 54 72 61" />
        <path d="M88 61 Q94 54 100 61" />
      </g>
    );
  }
  const dx = mood === "thinking" ? 2 : 0;
  const dy = mood === "thinking" ? -3 : 0;
  return (
    <g>
      <circle cx={66 + dx} cy={60 + dy} r={5.5} fill={C.ink} />
      <circle cx={94 + dx} cy={60 + dy} r={5.5} fill={C.ink} />
      <circle cx={68 + dx} cy={58 + dy} r={1.8} fill="#fff" />
      <circle cx={96 + dx} cy={58 + dy} r={1.8} fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === "celebrating") {
    return (
      <g>
        <path d="M70 79 Q80 94 90 79 Z" fill={C.ink} />
        <ellipse cx={80} cy={86} rx={5} ry={3} fill="#e46a6a" />
      </g>
    );
  }
  if (mood === "thinking") {
    return <path d="M75 82 Q80 80 85 82" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />;
  }
  return (
    <path
      d="M72 79 Q76 84 80 80 Q84 84 88 79"
      stroke={C.ink}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

export function Mascot({
  mood = "welcome",
  size = 96,
  label,
  animate = false,
  className,
}: {
  mood?: MascotMood;
  size?: number;
  /** Accessible description; omit for decorative use. */
  label?: string;
  /** Play the mood's one-off entrance animation (respects reduced motion). */
  animate?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0 overflow-visible", animate && (mood === "celebrating" ? "mascot-bounce" : "mascot-pop"), className)}
      data-mood={mood}
    >
      {/* tail */}
      <path d="M110 134 C138 134 152 112 147 90 C145 81 133 83 134 92 C136 107 128 118 110 121 Z" fill={C.furDark} />
      {/* body */}
      <ellipse cx={80} cy={122} rx={38} ry={32} fill={C.fur} />
      <ellipse cx={80} cy={128} rx={24} ry={22} fill={C.cream} />
      <ellipse cx={63} cy={152} rx={12} ry={6} fill={C.furDark} />
      <ellipse cx={97} cy={152} rx={12} ry={6} fill={C.furDark} />

      {/* arms (pose depends on mood) */}
      {mood === "welcome" ? (
        <>
          <Arm x={56} y={124} rotate={15} />
          <g className={animate ? "mascot-wave" : undefined} style={{ transformOrigin: "108px 108px" }}>
            <Arm x={120} y={92} rotate={-35} />
          </g>
        </>
      ) : null}
      {mood === "thinking" ? (
        <>
          <Arm x={56} y={124} rotate={15} />
          <Arm x={96} y={98} rotate={-60} />
        </>
      ) : null}
      {mood === "celebrating" ? (
        <>
          <Arm x={40} y={92} rotate={35} />
          <Arm x={120} y={92} rotate={-35} />
        </>
      ) : null}
      {mood === "encouraging" ? (
        <>
          <Arm x={56} y={124} rotate={15} />
          <Arm x={114} y={106} rotate={-20} />
          <ellipse cx={116} cy={92} rx={4} ry={6} fill={C.fur} />
        </>
      ) : null}

      {/* scarf */}
      <path d="M48 92 Q80 108 112 92 L112 101 Q80 117 48 101 Z" fill={C.scarf} />
      <path d="M95 104 L104 124 L93 121 Z" fill={C.scarfDark} />

      {/* ears */}
      <circle cx={48} cy={36} r={9} fill={C.fur} />
      <circle cx={112} cy={36} r={9} fill={C.fur} />
      <circle cx={48} cy={36} r={4.5} fill={C.furDark} />
      <circle cx={112} cy={36} r={4.5} fill={C.furDark} />

      {/* head */}
      <ellipse cx={80} cy={62} rx={40} ry={36} fill={C.fur} />
      <ellipse cx={80} cy={76} rx={27} ry={20} fill={C.cream} />
      <circle cx={63} cy={80} r={11} fill={C.cream} />
      <circle cx={97} cy={80} r={11} fill={C.cream} />
      <circle cx={57} cy={72} r={4} fill={C.blush} opacity={0.45} />
      <circle cx={103} cy={72} r={4} fill={C.blush} opacity={0.45} />

      {/* goggles pushed up on the forehead */}
      <path d="M41 44 Q80 28 119 44" stroke={C.strap} strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={68} cy={38} r={8} fill={C.lens} stroke={C.strap} strokeWidth={3} />
      <circle cx={92} cy={38} r={8} fill={C.lens} stroke={C.strap} strokeWidth={3} />
      <circle cx={65.5} cy={35.5} r={2} fill="#fff" opacity={0.8} />
      <circle cx={89.5} cy={35.5} r={2} fill="#fff" opacity={0.8} />

      {mood === "encouraging" ? (
        <g stroke={C.furDark} strokeWidth={2.4} strokeLinecap="round" fill="none">
          <path d="M60 51 Q66 47 72 50" />
          <path d="M88 50 Q94 47 100 51" />
        </g>
      ) : null}

      <Eyes mood={mood} />
      <ellipse cx={80} cy={71} rx={7} ry={5} fill={C.ink} />
      <ellipse cx={78} cy={69.5} rx={2} ry={1.1} fill="#fff" opacity={0.6} />
      <Mouth mood={mood} />
      <g stroke={C.furDark} strokeWidth={1.4} strokeLinecap="round" opacity={0.55}>
        <path d="M58 77 L44 73" />
        <path d="M58 81 L44 82" />
        <path d="M102 77 L116 73" />
        <path d="M102 81 L116 82" />
      </g>

      {mood === "thinking" ? (
        <g>
          <circle cx={134} cy={26} r={10} fill={C.spark} stroke="#d97706" strokeWidth={2} />
          <rect x={129.5} y={35} width={9} height={6} rx={1.5} fill="#94a3b8" />
          <path d="M134 21 L134 27" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
        </g>
      ) : null}
      {mood === "celebrating" ? (
        <g className={animate ? "mascot-sparkle" : undefined}>
          <Sparkle x={22} y={46} />
          <Sparkle x={140} y={30} size={7} />
          <Sparkle x={26} y={98} size={4} />
          <Sparkle x={146} y={74} size={4} />
        </g>
      ) : null}
    </svg>
  );
}

/** Mascot with a short speech bubble. */
export function MascotSays({
  mood,
  children,
  size = 56,
  animate,
  className,
}: {
  mood: MascotMood;
  children: ReactNode;
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-2.5", className)}>
      <Mascot mood={mood} size={size} animate={animate} />
      <div className="relative mb-2 rounded-2xl rounded-bl-sm border border-line bg-surface px-3.5 py-2.5 text-sm leading-snug text-fg shadow-card">
        {children}
      </div>
    </div>
  );
}
