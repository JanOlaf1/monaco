"use client";

import { BookOpen, Code, Terminal } from "lucide-react";
import {
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { DEFAULT_SIZES, LIMITS, setPanelSizes, usePanelSizes, type PanelSizes } from "./layout-store";

export type PanelId = "instructions" | "editor" | "output";

/**
 * Desktop (lg+): three resizable columns. Smaller screens: one panel at a time
 * with tabs. The panels are rendered once and only shown/hidden with CSS, so
 * the editor instance is never duplicated or remounted when switching tabs.
 */
export function WorkspaceLayout({
  instructions,
  editor,
  output,
  mobilePanel,
  onMobilePanelChange,
  mobileActions,
  badges,
}: {
  instructions: ReactNode;
  editor: ReactNode;
  output: ReactNode;
  mobilePanel: PanelId;
  onMobilePanelChange: (panel: PanelId) => void;
  mobileActions: ReactNode;
  badges?: Partial<Record<PanelId, ReactNode>>;
}) {
  const { dict } = useI18n();
  const sizes = usePanelSizes();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabs: { id: PanelId; label: string; icon: typeof BookOpen }[] = [
    { id: "instructions", label: dict.workspace.panels.instructions, icon: BookOpen },
    { id: "editor", label: dict.workspace.panels.editor, icon: Code },
    { id: "output", label: dict.workspace.panels.output, icon: Terminal },
  ];

  const style = { "--left": `${sizes.left}%`, "--right": `${sizes.right}%` } as CSSProperties;

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    onMobilePanelChange(tabs[next].id);
    document.getElementById(`ws-tab-${tabs[next].id}`)?.focus();
  }

  const panelClass = (id: PanelId) =>
    cn("min-h-0 min-w-0 flex-col bg-surface lg:flex", mobilePanel === id ? "flex flex-1" : "hidden");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label={dict.workspace.panels.instructions} className="flex border-b border-line bg-surface lg:hidden">
        {tabs.map((tab, index) => {
          const selected = mobilePanel === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`ws-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`ws-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onMobilePanelChange(tab.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={cn(
                "relative flex h-11 flex-1 items-center justify-center gap-1.5 text-[13px] font-medium transition-colors",
                selected ? "text-fg" : "text-fg-subtle hover:text-fg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {tab.label}
              {badges?.[tab.id]}
              {selected ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" /> : null}
            </button>
          );
        })}
      </div>

      <div ref={containerRef} style={style} className="flex min-h-0 flex-1">
        <section
          id="ws-panel-instructions"
          aria-label={dict.workspace.panels.instructions}
          className={cn(panelClass("instructions"), "lg:w-(--left) lg:flex-none")}
        >
          {instructions}
        </section>
        <Splitter
          containerRef={containerRef}
          side="left"
          sizes={sizes}
          label={dict.workspace.resizePanels}
          controls="ws-panel-instructions"
        />
        <section
          id="ws-panel-editor"
          aria-label={dict.workspace.panels.editor}
          className={cn(panelClass("editor"), "lg:flex-1")}
        >
          {editor}
        </section>
        <Splitter
          containerRef={containerRef}
          side="right"
          sizes={sizes}
          label={dict.workspace.resizePanels}
          controls="ws-panel-output"
        />
        <section
          id="ws-panel-output"
          aria-label={dict.workspace.panels.output}
          className={cn(panelClass("output"), "lg:w-(--right) lg:flex-none")}
        >
          {output}
        </section>
      </div>

      <div className="border-t border-line bg-surface px-3 py-2 lg:hidden">{mobileActions}</div>
    </div>
  );
}

function Splitter({
  containerRef,
  side,
  sizes,
  label,
  controls,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  side: "left" | "right";
  sizes: PanelSizes;
  label: string;
  controls: string;
}) {
  const drag = useRef<{ startX: number; start: PanelSizes; width: number } | null>(null);
  const value = side === "left" ? sizes.left : sizes.right;
  const [min, max] = side === "left" ? LIMITS.left : LIMITS.right;

  function update(next: number, persist: boolean) {
    setPanelSizes(side === "left" ? { ...sizes, left: next } : { ...sizes, right: next }, persist);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const width = containerRef.current?.getBoundingClientRect().width;
    if (!width) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, start: sizes, width };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state) return;
    const delta = ((event.clientX - state.startX) / state.width) * 100;
    const base = side === "left" ? state.start.left : state.start.right;
    setPanelSizes(
      side === "left" ? { ...state.start, left: base + delta } : { ...state.start, right: base - delta },
      false,
    );
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    setPanelSizes(sizes, true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 5 : 2;
    const grow = side === "left" ? "ArrowRight" : "ArrowLeft";
    const shrink = side === "left" ? "ArrowLeft" : "ArrowRight";
    if (event.key === grow) update(value + step, true);
    else if (event.key === shrink) update(value - step, true);
    else if (event.key === "Home") update(min, true);
    else if (event.key === "End") update(max, true);
    else return;
    event.preventDefault();
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-controls={controls}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onDoubleClick={() => update(side === "left" ? DEFAULT_SIZES.left : DEFAULT_SIZES.right, true)}
      className="group relative z-10 hidden w-px shrink-0 cursor-col-resize touch-none bg-line outline-none transition-colors hover:bg-accent focus-visible:bg-accent active:bg-accent lg:block"
    >
      {/* Wider invisible hit area for easier dragging. */}
      <span className="absolute inset-y-0 -left-1 -right-1" aria-hidden="true" />
    </div>
  );
}
