"use client";

import { Download, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CRYSTAL_NAME } from "@/lib/adventure/catalog";
import { applyImport, exportBackup, previewImport } from "@/lib/backup/actions";
import {
  MAX_BACKUP_BYTES,
  parseBackup,
  type BackupData,
  type BackupError,
  type ImportContext,
  type ImportSummary,
} from "@/lib/backup/backup";
import { useI18n } from "@/lib/i18n/client";
import { localeTags } from "@/lib/i18n/config";
import { format, plural } from "@/lib/i18n/format";
import { useCatalog } from "@/lib/learner/catalog-context";
import { recommendForTrack } from "@/lib/learning/recommend";
import { getPracticeActivity } from "@/lib/practice/content";

type Status = { tone: "info" | "error"; text: string } | null;

interface Pending {
  data: Partial<BackupData>;
  exportedAt: string | null;
  summary: ImportSummary;
}

function download(fileName: string, json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export to a file and an additive, confirmed import. Never includes account credentials or tokens. */
export function BackupPanel() {
  const { locale, dict } = useI18n();
  const { courses, gamification: catalog } = useCatalog();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const text = dict.backup;

  const context = useMemo<ImportContext>(
    () => ({
      catalog,
      isPracticeActivity: (id) => getPracticeActivity(id) !== undefined,
      recommend: (trackId, track) =>
        recommendForTrack(
          courses.find((course) => course.language === trackId),
          track,
          new Date().toISOString(),
        ),
    }),
    [catalog, courses],
  );

  const errorText = (error: BackupError | "read" | "apply") => text.errors[error];

  const onExport = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const { fileName, json } = await exportBackup();
      download(fileName, json);
      setStatus({ tone: "info", text: format(text.exported, { file: fileName }) });
    } catch (error) {
      console.warn("[backup] Export failed:", error);
      setStatus({ tone: "error", text: text.exportFailed });
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    setStatus(null);
    if (file.size > MAX_BACKUP_BYTES) {
      setStatus({ tone: "error", text: errorText("too-large") });
      return;
    }
    setBusy(true);
    try {
      let source: string;
      try {
        source = await file.text();
      } catch {
        setStatus({ tone: "error", text: errorText("read") });
        return;
      }
      const parsed = parseBackup(source);
      if (!parsed.ok) {
        setStatus({ tone: "error", text: errorText(parsed.error) });
        return;
      }
      const summary = await previewImport(parsed.data, context);
      setPending({ data: parsed.data, exportedAt: parsed.exportedAt, summary });
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const result = await applyImport(pending.data, context);
      setStatus({
        tone: "info",
        text: result.adventureFailed ? `${text.restored} ${text.adventureFailed}` : text.restored,
      });
      setPending(null);
    } catch (error) {
      console.warn("[backup] Import failed:", error);
      setStatus({ tone: "error", text: errorText("apply") });
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  const summary = pending?.summary;
  const items: string[] = [];
  if (summary) {
    if (summary.exercises > 0) items.push(plural(locale, text.summary.exercises, summary.exercises));
    if (summary.xp > 0) items.push(format(text.summary.xp, { count: summary.xp }));
    if (summary.crystals > 0) {
      items.push(format(text.summary.crystals, { count: summary.crystals, currency: CRYSTAL_NAME[locale] }));
    }
    if (summary.practice > 0) items.push(plural(locale, text.summary.practice, summary.practice));
    if (summary.drafts > 0) items.push(plural(locale, text.summary.drafts, summary.drafts));
    if (summary.deadlines > 0) items.push(plural(locale, text.summary.deadlines, summary.deadlines));
    if (summary.levels > 0) items.push(plural(locale, text.summary.levels, summary.levels));
  }
  const date = pending?.exportedAt
    ? new Intl.DateTimeFormat(localeTags[locale], { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(pending.exportedAt),
      )
    : null;

  return (
    <div className="space-y-4 text-sm">
      <p className="text-fg-muted">{text.intro}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void onExport()} disabled={busy} className="h-11 sm:h-9">
          <Download aria-hidden="true" />
          {busy && !pending ? text.exporting : text.export}
        </Button>
        <Button onClick={() => fileInput.current?.click()} disabled={busy} className="h-11 sm:h-9">
          <Upload aria-hidden="true" />
          {text.import}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="backup-file"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </div>
      <p className="text-xs text-fg-subtle">{text.importHint}</p>
      {status ? (
        <p
          role={status.tone === "error" ? "alert" : "status"}
          data-testid="backup-status"
          className={status.tone === "error" ? "text-danger" : "text-fg"}
        >
          {status.text}
        </p>
      ) : null}

      <Dialog
        open={pending !== null}
        onClose={() => (busy ? undefined : setPending(null))}
        title={text.confirmTitle}
        closeLabel={text.close}
        description={date ? format(text.confirmBody, { date }) : text.confirmBodyUndated}
      >
        {summary ? (
          <div className="space-y-3 text-sm" data-testid="backup-summary">
            {summary.changed && items.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{summary.changed ? text.otherChanges : text.nothingNew}</p>
            )}
            {summary.keptLocal > 0 ? <p className="text-fg-muted">{plural(locale, text.keptLocal, summary.keptLocal)}</p> : null}
            {summary.rejectedPurchases > 0 ? (
              <p className="text-fg-muted">{plural(locale, text.rejectedPurchases, summary.rejectedPurchases)}</p>
            ) : null}
            {summary.skipped > 0 ? <p className="text-fg-muted">{plural(locale, text.skipped, summary.skipped)}</p> : null}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button onClick={() => setPending(null)} disabled={busy}>
                {summary.changed ? text.cancel : text.close}
              </Button>
              {summary.changed ? (
                <Button variant="primary" onClick={() => void onConfirm()} disabled={busy}>
                  {text.confirm}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
