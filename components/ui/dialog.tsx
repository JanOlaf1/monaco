"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Modal dialog built on the native <dialog> element (focus trapping, Escape
 * to close and inertness of the page come from the browser).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  closeLabel,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  closeLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Close when this component is hidden by a route transition (Activity).
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-fg shadow-2xl",
        className,
      )}
    >
      {open ? (
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-base font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="-m-1 rounded-md p-1 text-fg-subtle hover:bg-hover hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>
          {description ? (
            <div id={descriptionId} className="mt-1.5 text-sm text-fg-muted">
              {description}
            </div>
          ) : null}
          <div className="mt-4">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
