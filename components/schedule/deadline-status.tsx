"use client";

import { CalendarClock, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/client";
import { format, formatDateKey, plural } from "@/lib/i18n/format";
import { deadlineStatus, type DeadlineStatus } from "@/lib/schedule/deadlines";

export function useDeadlineText() {
  const { locale, dict } = useI18n();
  return (status: DeadlineStatus): string => {
    switch (status.kind) {
      case "completed":
        return dict.deadlines.completed;
      case "today":
        return dict.deadlines.dueToday;
      case "overdue":
        return plural(locale, dict.deadlines.daysPast, status.daysPast);
      case "upcoming":
        return plural(locale, dict.deadlines.daysLeft, status.daysLeft);
    }
  };
}

/** Target date plus a gentle status. Past targets use a calm warning tone, never an error. */
export function DeadlineStatusBadge({
  dueDate,
  today,
  completed,
}: {
  dueDate: string;
  today: string;
  completed: boolean;
}) {
  const { locale, dict } = useI18n();
  const describe = useDeadlineText();
  const status = deadlineStatus(dueDate, today, completed);
  const tone =
    status.kind === "completed"
      ? "success"
      : status.kind === "overdue"
        ? "warning"
        : status.kind === "today"
          ? "accent"
          : "neutral";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
        <CalendarClock className="size-3.5" aria-hidden="true" />
        {format(dict.deadlines.target, { date: formatDateKey(locale, dueDate) })}
      </span>
      <Badge tone={tone} icon={status.kind === "completed" ? <CircleCheck aria-hidden="true" /> : undefined}>
        {describe(status)}
      </Badge>
    </span>
  );
}
