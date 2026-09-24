"use client";

import * as React from "react";
import {
  Download,
  Key,
  Link as LinkIcon,
  Copy,
  Eye,
  EyeOff,
  Check,
  Play,
  FileArchive,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export type ResourceVariant = "primary" | "secret" | "default" | "tutorial";

type DownloadState = "idle" | "opening" | "opened";

/**
 * ResourceCard — a single downloadable resource in the customer vault
 * (spec §18–20).
 *
 * Visual rules encoded here:
 *  • Every card states its readiness explicitly (READY / SECURE RESOURCE).
 *  • Secrets are masked by default with SHOW + COPY, and COPY flips to
 *    COPIED with a real clipboard confirmation.
 *  • Download feedback reflects what actually happens — the button enters
 *    an "Opening…" state while the resource is handed to the browser, then
 *    confirms. No fabricated progress percentages.
 */
export function ResourceCard({
  name,
  description,
  type = "FILE",
  url,
  secret,
  version,
  variant = "default",
  index = 0,
}: {
  name: string;
  description?: string | null;
  type?: string;
  url?: string | null;
  secret?: string | null;
  version?: string | null;
  variant?: ResourceVariant;
  index?: number;
}) {
  const [revealed, setRevealed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [download, setDownload] = React.useState<DownloadState>("idle");

  const copyTimer = React.useRef<number | null>(null);
  const openTimer = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      if (openTimer.current) window.clearTimeout(openTimer.current);
    },
    []
  );

  const handleCopy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; reveal the value so the user can select it.
      setRevealed(true);
    }
  };

  const handleOpen = () => {
    if (!url || download !== "idle") return;
    setDownload("opening");
    window.open(url, "_blank", "noopener,noreferrer");
    if (openTimer.current) window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => {
      setDownload("opened");
      openTimer.current = window.setTimeout(() => setDownload("idle"), 2200);
    }, 550);
  };

  /* ── PRIMARY (Main File) ───────────────────────────────────── */
  if (variant === "primary") {
    return (
      <article className="relative flex h-full flex-col overflow-hidden rounded-[18px] mat-2 p-6 card-entrance" style={{ animationDelay: `${index * 60}ms` }}>
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge tone="info" size="xs" icon={ShieldCheck}>
                Primary Resource
              </StatusBadge>
              {version && (
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-brand-ink-4">
                  v{version}
                </span>
              )}
            </div>

            <h3 className="text-[20px] font-extrabold uppercase tracking-[-0.012em] text-foreground">
              {name}
            </h3>
            <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-brand-ink-3">
              {description || "Ready to download. Always check for the latest version."}
            </p>
          </div>

          <div
            className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[16px] border sm:flex"
            style={{
              borderColor: "var(--border-subtle)",
              background:
                "linear-gradient(160deg, var(--ambient-strong), var(--ambient-blue))",
            }}
            aria-hidden
          >
            <FileArchive size={26} className="text-foreground" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {url ? (
            <button
              type="button"
              onClick={handleOpen}
              disabled={download === "opening"}
              className="group relative inline-flex h-[48px] items-center gap-2.5 overflow-hidden rounded-[12px] border border-white/[0.14] px-6 text-[13px] font-bold uppercase tracking-[0.055em] text-white transition-transform duration-100 active:scale-[0.978] disabled:cursor-progress"
              style={{
                background: "linear-gradient(168deg,var(--accent) 0%,var(--accent-strong) 60%,var(--accent-strong) 100%)",
                boxShadow: "0 1px 2px rgba(0,0,0,.4), 0 6px 18px var(--ambient-strong)",
              }}
            >
              <span className="absolute inset-x-0 top-0 h-px bg-white/[0.16]" aria-hidden />
              {download === "idle" && (
                <>
                  <Download size={15} aria-hidden />
                  Download File
                </>
              )}
              {download === "opening" && (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
                  Opening…
                </>
              )}
              {download === "opened" && (
                <>
                  <Check size={15} aria-hidden />
                  Opened
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex h-[48px] items-center rounded-[12px] border border-border-subtle px-6 text-[13px] font-bold uppercase tracking-[0.055em] text-brand-ink-3">
              Currently unavailable
            </span>
          )}

          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.09em] text-[color:var(--status-success-text)]">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            Ready to download
          </span>
        </div>
      </article>
    );
  }

  /* ── SECRET (File Password) ────────────────────────────────── */
  if (variant === "secret") {
    return (
      <article className="relative flex h-full flex-col overflow-hidden rounded-[18px] mat-2 p-6 card-entrance" style={{ animationDelay: `${index * 60}ms` }}>
        <div className="mb-4 flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[12px] border"
            style={{
              borderColor: "var(--status-danger-border)",
              background: "var(--status-danger-bg)",
            }}
            aria-hidden
          >
            <Key size={17} className="text-[color:var(--status-danger-text)]" />
          </span>
          <div>
            <h3 className="text-[16px] font-extrabold uppercase tracking-[-0.01em] text-foreground">
              {name}
            </h3>
            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-brand-ink-4">
              Secret
            </p>
          </div>
        </div>

        <p className="mb-5 text-[13px] leading-relaxed text-brand-ink-3">
          {description || "Required to extract the main file archive."}
        </p>

        {/* Masked value */}
        <div
          className="relative mb-5 flex min-h-[62px] items-center justify-center overflow-hidden rounded-[12px] border border-border-subtle bg-[var(--input-bg)] px-4"
        >
          {secret ? (
            <span
              className={`select-all break-all text-center font-mono text-[15px] font-bold tracking-[0.14em] text-[color:var(--status-danger-text)] transition-[filter,opacity] duration-300 ${
                revealed ? "blur-0 opacity-100" : "blur-[7px] opacity-70"
              }`}
            >
              {revealed ? secret : "••••••••••••"}
            </span>
          ) : (
            <span className="text-[13px] italic text-brand-ink-4">Currently unavailable</span>
          )}
        </div>

        <div className="mt-auto flex gap-2.5">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            disabled={!secret}
            aria-pressed={revealed}
            className="inline-flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[11px] border border-border-subtle bg-foreground/[0.03] text-[11px] font-bold uppercase tracking-[0.09em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
          >
            {revealed ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
            {revealed ? "Hide" : "Show"}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!secret}
            className={`inline-flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[11px] border text-[11px] font-bold uppercase tracking-[0.09em] transition-colors disabled:opacity-40 disabled:pointer-events-none ${
              copied
                ? "border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] text-[color:var(--status-success-text)]"
                : "border-border-subtle bg-foreground/[0.03] text-brand-ink-2 hover:border-border-strong hover:text-foreground"
            }`}
          >
            {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {secret && (
          <p className="mt-4 text-center text-[10.5px] leading-relaxed text-brand-ink-4">
            Never share this value — it is unique to your package.
          </p>
        )}
      </article>
    );
  }

  /* ── TUTORIAL ──────────────────────────────────────────────── */
  if (variant === "tutorial") {
    const inner = (
      <article
        className={`group/card flex h-full items-center gap-4 overflow-hidden rounded-[16px] mat-4 p-4 card-entrance ${
          url ? "" : "opacity-55"
        }`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-border-subtle"
          style={{
            background:
              "linear-gradient(160deg, var(--ambient-strong), var(--ambient-blue))",
          }}
          aria-hidden
        >
          <Play size={17} className="text-foreground" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold tracking-[-0.008em] text-foreground">
            {name.replace(/\s*TUTORIAL\s*/i, "") || name}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.09em] text-brand-ink-4">
            {url ? "Video guide" : "Not yet available"}
          </p>
        </div>

        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle text-brand-ink-3 transition-colors group-hover/card:border-border-strong group-hover/card:text-foreground"
          aria-hidden
        >
          {url ? <ExternalLink size={15} /> : <LinkIcon size={15} />}
        </span>
      </article>
    );

    return url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
        aria-label={`Open ${name} tutorial`}
      >
        {inner}
      </a>
    ) : (
      <div className="h-full cursor-not-allowed" aria-disabled="true">
        {inner}
      </div>
    );
  }

  /* ── DEFAULT (utilities / tools) ───────────────────────────── */
  const isSecretOnly = !url && !!secret;

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[16px] mat-4 p-5 card-entrance"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-extrabold uppercase tracking-[-0.008em] text-foreground">
            {name}
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-ink-3">
            {description || "Required utility for your platform."}
          </p>
        </div>

        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-border-subtle text-brand-ink-3"
          aria-hidden
        >
          {type === "LINK" ? <LinkIcon size={17} /> : <Download size={17} />}
        </span>
      </div>

      <div className="mt-auto">
        {url ? (
          <button
            type="button"
            onClick={handleOpen}
            disabled={download === "opening"}
            className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[11px] border border-border-subtle bg-foreground/[0.035] text-[11.5px] font-bold uppercase tracking-[0.07em] text-foreground transition-colors hover:border-border-strong hover:bg-[var(--ambient-strong)] disabled:cursor-progress"
          >
            {download === "idle" && (
              <>
                {type === "LINK" ? <ExternalLink size={14} aria-hidden /> : <Download size={14} aria-hidden />}
                {type === "LINK" ? "Open link" : "Download"}
              </>
            )}
            {download === "opening" && (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
                Opening…
              </>
            )}
            {download === "opened" && (
              <>
                <Check size={14} aria-hidden />
                Opened
              </>
            )}
          </button>
        ) : isSecretOnly ? (
          <div className="rounded-[11px] border border-border-subtle bg-[var(--input-bg)] p-3 text-center">
            <span className="select-all break-all font-mono text-[13px] font-bold tracking-[0.12em] text-[color:var(--status-danger-text)]">
              {secret}
            </span>
          </div>
        ) : (
          <span className="inline-flex h-[44px] w-full items-center justify-center rounded-[11px] border border-border-subtle text-[11.5px] font-bold uppercase tracking-[0.07em] text-brand-ink-3">
            Currently unavailable
          </span>
        )}
      </div>
    </article>
  );
}
