"use client";

import { Target } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { formatDateKey } from "@/lib/i18n/format";
import { scheduleActions, useSchedule } from "@/lib/learner/hooks";
import { addDays, daysBetween, isValidDateKey, todayKey } from "@/lib/schedule/dates";
import { targetKey, type DeadlineTarget } from "@/lib/schedule/deadlines";
import { DeadlineStatusBadge } from "./deadline-status";

type Choice = "none" | "7" | "14" | "custom";

/**
 * Shows the target date for a course or exercise and lets the learner set,
 * reschedule or remove it. Purely a planning aid — it never restricts access.
 */
export function DeadlineControl({
  target,
  completed,
  className,
}: {
  target: DeadlineTarget;
  completed: boolean;
  className?: string;
}) {
  const { dict } = useI18n();
  const { value, hydrated } = useSchedule();
  const [open, setOpen] = useState(false);
  const deadline = value.deadlines[targetKey(target)];

  if (!hydrated) {
    return <div className={cn("h-8", className)} aria-hidden="true" />;
  }

  const today = todayKey();
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {deadline ? (
        <>
          <DeadlineStatusBadge dueDate={deadline.dueDate} today={today} completed={completed} />
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
            {dict.deadlines.change}
          </Button>
        </>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="-ml-2">
          <Target aria-hidden="true" />
          {dict.deadlines.set}
        </Button>
      )}
      {open ? (
        <DeadlineDialog
          target={target}
          currentDate={deadline?.dueDate}
          today={today}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function initialChoice(currentDate: string | undefined, today: string): Choice {
  if (!currentDate) return "7";
  const days = daysBetween(today, currentDate);
  if (days === 7) return "7";
  if (days === 14) return "14";
  return "custom";
}

export function DeadlineDialog({
  target,
  currentDate,
  today,
  onClose,
}: {
  target: DeadlineTarget;
  currentDate?: string;
  today: string;
  onClose: () => void;
}) {
  const { locale, dict } = useI18n();
  const [choice, setChoice] = useState<Choice>(() => initialChoice(currentDate, today));
  const [customDate, setCustomDate] = useState(() =>
    currentDate && daysBetween(today, currentDate) >= 0 ? currentDate : addDays(today, 30),
  );
  const name = useId();
  const customId = useId();

  const customValid = isValidDateKey(customDate) && daysBetween(today, customDate) >= 0;
  const options: { value: Choice; label: string; hint?: string }[] = [
    { value: "none", label: dict.deadlines.optionNone },
    { value: "7", label: dict.deadlines.option7, hint: formatDateKey(locale, addDays(today, 7)) },
    { value: "14", label: dict.deadlines.option14, hint: formatDateKey(locale, addDays(today, 14)) },
    { value: "custom", label: dict.deadlines.optionCustom },
  ];

  function save() {
    if (choice === "none") {
      scheduleActions.remove(target);
    } else if (choice === "custom") {
      if (!customValid) return;
      scheduleActions.set(target, customDate);
    } else {
      scheduleActions.set(target, addDays(today, Number(choice)));
    }
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={dict.deadlines.dialogTitle}
      description={dict.deadlines.dialogBody}
      closeLabel={dict.common.close}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <fieldset className="space-y-1.5">
          <legend className="sr-only">{dict.deadlines.dialogTitle}</legend>
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                choice === option.value ? "border-accent bg-accent-soft" : "border-line hover:bg-hover",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={choice === option.value}
                onChange={() => setChoice(option.value)}
                className="accent-(--accent)"
              />
              <span className="font-medium">{option.label}</span>
              {option.hint ? <span className="ml-auto text-xs text-fg-subtle">{option.hint}</span> : null}
            </label>
          ))}
        </fieldset>
        {choice === "custom" ? (
          <div className="mt-3">
            <label htmlFor={customId} className="text-xs font-medium text-fg-muted">
              {dict.deadlines.customLabel}
            </label>
            <input
              id={customId}
              type="date"
              min={today}
              value={customDate}
              onChange={(event) => setCustomDate(event.target.value)}
              aria-invalid={!customValid}
              className="mt-1 block h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-fg"
            />
            {!customValid ? <p className="mt-1 text-xs text-danger">{dict.deadlines.invalidDate}</p> : null}
          </div>
        ) : null}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {dict.common.cancel}
          </Button>
          <Button type="submit" variant="primary" disabled={choice === "custom" && !customValid}>
            {dict.common.save}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
