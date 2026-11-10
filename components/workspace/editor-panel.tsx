"use client";

import { FileCode, ListChecks, LoaderCircle, Play, RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";

export type BusyState = "run" | "check" | null;

export function RunCheckButtons({
  busy,
  disabled,
  onRun,
  onCheck,
  className,
  compact = false,
}: {
  busy: BusyState;
  disabled: boolean;
  onRun: () => void;
  onCheck: () => void;
  className?: string;
  compact?: boolean;
}) {
  const { dict } = useI18n();
  const a = dict.workspace.actions;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRun}
        disabled={disabled || busy !== null}
        title={a.runShortcut}
        aria-keyshortcuts="Control+Enter"
        className={compact ? "flex-1" : undefined}
      >
        {busy === "run" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
        {busy === "run" ? a.running : a.run}
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={onCheck}
        disabled={disabled || busy !== null}
        title={a.checkShortcut}
        aria-keyshortcuts="Control+Shift+Enter"
        className={compact ? "flex-1" : undefined}
      >
        {busy === "check" ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <ListChecks aria-hidden="true" />
        )}
        {busy === "check" ? a.checking : a.check}
      </Button>
    </div>
  );
}

export function EditorPanel({
  files,
  activeFile,
  onSelectFile,
  languageName,
  busy,
  runDisabled,
  onRun,
  onCheck,
  onReset,
  children,
}: {
  files: { name: string }[];
  activeFile: string;
  onSelectFile: (name: string) => void;
  languageName: string;
  busy: BusyState;
  runDisabled: boolean;
  onRun: () => void;
  onCheck: () => void;
  onReset: () => void;
  children: ReactNode;
}) {
  const { dict } = useI18n();
  const a = dict.workspace.actions;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-editor">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-surface px-2">
        <div role="tablist" aria-label={dict.workspace.editor.files} className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {files.map((file) => {
            const active = file.name === activeFile;
            return (
              <button
                key={file.name}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectFile(file.name)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 font-mono text-[12.5px] transition-colors",
                  active ? "bg-muted text-fg" : "text-fg-muted hover:bg-hover hover:text-fg",
                )}
              >
                <FileCode className="size-3.5" aria-hidden="true" />
                {file.name}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} disabled={busy !== null} title={a.reset}>
            <RotateCcw aria-hidden="true" />
            <span className="max-xl:sr-only">{a.reset}</span>
          </Button>
          <RunCheckButtons busy={busy} disabled={runDisabled} onRun={onRun} onCheck={onCheck} className="max-lg:hidden" />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">{children}</div>

      <div className="flex h-7 shrink-0 items-center gap-3 border-t border-line bg-surface px-3 text-[11px] text-fg-subtle">
        <span>{languageName}</span>
        <span aria-hidden="true">·</span>
        <span>{dict.workspace.editor.saved}</span>
        <span className="ml-auto max-lg:hidden">Ctrl+Enter · Ctrl+Shift+Enter</span>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={a.resetTitle}
        description={a.resetBody}
        closeLabel={dict.common.close}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            {dict.common.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setConfirmReset(false);
              onReset();
            }}
          >
            <RotateCcw aria-hidden="true" />
            {a.resetConfirm}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export function EditorPlaceholder({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-fg-subtle">
      <p className="flex items-center gap-2">
        {children ? null : <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {message}
      </p>
      {children}
    </div>
  );
}
