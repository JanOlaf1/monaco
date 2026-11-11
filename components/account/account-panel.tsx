"use client";

import { Cloud, CloudOff, HardDrive, LoaderCircle, LogOut, MailCheck, RefreshCw } from "lucide-react";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { languageNames } from "@/components/ui/language-mark";
import { cn } from "@/lib/cn";
import { account, type ActionResult } from "@/lib/account/account-store";
import { useAccount } from "@/lib/account/hooks";
import type { AuthErrorKey } from "@/lib/firebase/errors";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import type { SelfReportedLevel } from "@/lib/learning/competency";
import type { CompetencyConflict } from "@/lib/sync/competency-merge";
import { SYNC_DOMAINS } from "@/lib/sync/domains";

type Mode = "signIn" | "register" | "reset";
type Notice = { tone: "success" | "error"; text: string } | null;

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-line bg-surface p-5 shadow-card", className)}>{children}</section>;
}

function NoticeText({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p
      role={notice.tone === "error" ? "alert" : "status"}
      className={cn("mt-3 text-sm", notice.tone === "error" ? "text-danger" : "text-success")}
    >
      {notice.text}
    </p>
  );
}

/** The optional account page: sign in, register, reset, verify, sync status and what is stored where. */
export function AccountPanel() {
  const { dict } = useI18n();
  const state = useAccount();
  // Kept here (not in the forms) so a message survives the switch between
  // the signed-out and signed-in views, e.g. "Account created…" or "Signed out…".
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    void account.start();
  }, []);

  return (
    <div className="mt-6 space-y-4">
      <NoticeText notice={notice} />
      {!state.available ? (
        <Card>
          <p className="text-sm">{dict.account.unavailable}</p>
        </Card>
      ) : state.phase === "unavailable" ? (
        <Card>
          <p className="text-sm" role="alert">
            {dict.account.loadFailed}
          </p>
        </Card>
      ) : state.phase === "idle" || state.phase === "loading" ? (
        <Card>
          <p className="flex items-center gap-2 text-sm text-fg-muted" aria-busy="true">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            {dict.account.loading}
          </p>
        </Card>
      ) : state.phase === "signed-out" ? (
        <SignedOut onNotice={setNotice} />
      ) : (
        <SignedIn onNotice={setNotice} />
      )}
      <WhatSyncs />
    </div>
  );
}

function SignedOut({ onNotice }: { onNotice: (notice: Notice) => void }) {
  const { locale, dict } = useI18n();
  const a = dict.account;
  const id = useId();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const setNotice = onNotice;

  const errorText = (key: AuthErrorKey) => a.errors[key];
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    let result: ActionResult & { verificationSent?: boolean };
    if (mode === "signIn") result = await account.signIn(email, password);
    else if (mode === "register") result = await account.register(email, password, locale);
    else result = await account.resetPassword(email, locale);
    setBusy(false);
    if (!result.ok) {
      setNotice({ tone: "error", text: errorText(result.error) });
      return;
    }
    if (mode === "reset") setNotice({ tone: "success", text: a.resetSent });
    if (mode === "register") {
      setNotice({
        tone: "success",
        text: result.verificationSent === false ? a.registeredNoMail : format(a.registered, { email: email.trim() }),
      });
    }
    setPassword("");
  };

  return (
    <Card>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={a.title}>
        {(["signIn", "register", "reset"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => {
              setMode(option);
              setNotice(null);
            }}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              mode === option ? "border-accent bg-accent-soft font-medium text-fg" : "border-line text-fg-muted hover:bg-hover",
            )}
          >
            {a.tabs[option]}
          </button>
        ))}
      </div>
      <form className="mt-4 space-y-3" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-email`} className="text-sm font-medium">
            {a.email}
          </label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm"
          />
        </div>
        {mode !== "reset" ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-password`} className="text-sm font-medium">
              {a.password}
            </label>
            <input
              id={`${id}-password`}
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              minLength={mode === "register" ? 6 : undefined}
              aria-describedby={mode === "register" ? `${id}-password-hint` : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-lg border border-line bg-surface px-3 text-sm"
            />
            {mode === "register" ? (
              <p id={`${id}-password-hint`} className="text-xs text-fg-subtle">
                {a.passwordHint}
              </p>
            ) : null}
          </div>
        ) : null}
        <Button type="submit" variant="primary" disabled={busy} className="h-10 px-5">
          {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {busy ? a.working : mode === "signIn" ? a.submitSignIn : mode === "register" ? a.submitRegister : a.submitReset}
        </Button>
      </form>
    </Card>
  );
}

function SignedIn({ onNotice }: { onNotice: (notice: Notice) => void }) {
  const { locale, dict } = useI18n();
  const a = dict.account;
  const { user, sync } = useAccount();
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const run = async (action: () => Promise<Notice>) => {
    setBusy(true);
    onNotice(null);
    onNotice(await action());
    setBusy(false);
  };

  return (
    <>
      <Card>
        <p className="text-sm" data-testid="signed-in-as">
          {format(a.signedInAs, { email: user.email ?? "" })}
        </p>
        {!user.emailVerified ? (
          <div className="mt-4 rounded-xl border border-warning/40 bg-warning-soft p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <MailCheck className="size-4" aria-hidden="true" />
              {a.verifyTitle}
            </h2>
            <p className="mt-1 text-sm text-fg-muted">{format(a.verifyBody, { email: user.email ?? "" })}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="primary"
                disabled={busy}
                onClick={() =>
                  run(async () =>
                    (await account.refreshVerification()) ? null : { tone: "error", text: a.notVerifiedYet },
                  )
                }
              >
                {a.checkVerification}
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const result = await account.resendVerification(locale);
                    return result.ok ? { tone: "success", text: a.verificationSent } : { tone: "error", text: a.errors[result.error] };
                  })
                }
              >
                {a.resendVerification}
              </Button>
            </div>
          </div>
        ) : (
          <SyncStatusView />
        )}
        <Button variant="ghost" size="sm" className="-ml-2 mt-4" disabled={busy} onClick={() => run(async () => {
          const result = await account.signOut();
          return result.ok ? { tone: "success", text: a.signedOut } : { tone: "error", text: a.errors[result.error] };
        })}>
          <LogOut aria-hidden="true" />
          {a.signOut}
        </Button>
      </Card>
      {sync.state === "conflict" ? <Conflicts conflicts={sync.conflicts} /> : null}
    </>
  );
}

function SyncStatusView() {
  const { locale, dict } = useI18n();
  const a = dict.account;
  const { sync } = useAccount();
  const failing = sync.state === "offline" || sync.state === "denied" || sync.state === "error";
  return (
    <div className="mt-4" data-testid="sync-status" data-state={sync.state}>
      <h2 className="text-sm font-semibold">{a.syncTitle}</h2>
      <p className={cn("mt-1 flex items-center gap-2 text-sm", failing ? "text-danger" : "text-fg-muted")} role="status">
        {sync.state === "syncing" ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : failing ? (
          <CloudOff className="size-4" aria-hidden="true" />
        ) : (
          <Cloud className="size-4" aria-hidden="true" />
        )}
        {a.syncState[sync.state]}
        {sync.state === "synced"
          ? ` · ${format(a.lastSynced, { time: new Date(sync.at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) })}`
          : ""}
      </p>
      {sync.state === "synced" && sync.ignoredDocuments > 0 ? <p className="mt-1 text-xs text-fg-muted">{a.ignoredDocuments}</p> : null}
      <Button variant="secondary" size="sm" className="mt-3" disabled={sync.state === "syncing"} onClick={() => void account.syncNow()}>
        <RefreshCw aria-hidden="true" />
        {a.syncNow}
      </Button>
    </div>
  );
}

function Conflicts({ conflicts }: { conflicts: CompetencyConflict[] }) {
  const { dict } = useI18n();
  const a = dict.account;
  const levelName = (value: string) =>
    value === "not-sure" ? dict.levels.notSure : dict.levels.names[value as Exclude<SelfReportedLevel, "not-sure">] ?? value;
  return (
    <Card className="border-warning/50">
      <h2 className="font-semibold">{a.conflictTitle}</h2>
      <ul className="mt-3 space-y-4">
        {conflicts.map((conflict) => (
          <li key={`${conflict.track}-${conflict.field}`} data-conflict={`${conflict.track}-${conflict.field}`}>
            <p className="text-sm">{format(a.conflictBody, { language: languageNames[conflict.track] })}</p>
            <p className="mt-1 text-xs text-fg-muted">{a.conflictField[conflict.field]}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => void account.resolveConflict(conflict, "local")}>
                {format(a.keepLocal, { level: levelName(conflict.local) })}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void account.resolveConflict(conflict, "cloud")}>
                {format(a.keepCloud, { level: levelName(conflict.cloud) })}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function WhatSyncs() {
  const { dict } = useI18n();
  const a = dict.account;
  const { available, user } = useAccount();
  const syncing = available && Boolean(user?.emailVerified);
  const synced = SYNC_DOMAINS.filter((domain) => domain.cloud && syncing);
  const local = SYNC_DOMAINS.filter((domain) => !domain.cloud || !syncing);
  return (
    <Card>
      <h2 className="font-semibold">{a.whatSyncs}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {synced.length > 0 ? (
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-medium">
              <Cloud className="size-4 text-accent" aria-hidden="true" />
              {a.syncedItems}
            </h3>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-fg-muted" data-testid="synced-domains">
              {synced.map((domain) => (
                <li key={domain.id}>{a.domains[domain.id]}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <HardDrive className="size-4 text-fg-subtle" aria-hidden="true" />
            {a.localItems}
          </h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-fg-muted" data-testid="local-domains">
            {local.map((domain) => (
              <li key={domain.id}>{a.domains[domain.id]}</li>
            ))}
          </ul>
        </div>
      </div>
      {!syncing ? <p className="mt-3 text-xs text-fg-subtle">{a.signedOutNote}</p> : null}
    </Card>
  );
}
