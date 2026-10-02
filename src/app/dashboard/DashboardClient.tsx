"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import {
  Download,
  Key,
  Link as LinkIcon,
  LogOut,
  ShieldCheck,
  HelpCircle,
  ShieldAlert,
  FileText,
  Image as ImageIcon,
  PlayCircle,
  GraduationCap,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { customerLogout } from "@/app/actions";

/** Resource shape as delivered by the server (ordered by sortOrder). */
export interface ResourceView {
  id: string;
  name: string;
  description: string | null;
  type: string;
  url: string | null;
  secret: string | null;
  bodyText: string | null;
  accentStyle: string;
  sortOrder: number;
}

interface DashboardClientProps {
  identifier: string;
  resources: ResourceView[];
  platformType: string;
  platformName?: string;
  branchName: string | null;
  warning: {
    branchId: string;
    title: string;
    message: string;
    buttonText: string;
  } | null;
}

/* ── Controlled presentation accents for TEXT / TUTORIAL resources ──────── *
   Only these keys are honoured; anything unknown falls back to DEFAULT, so a
   resource can never inject arbitrary colour or markup. */
const ACCENTS: Record<string, { border: string; label: string; text: string; chip: string }> = {
  DEFAULT: { border: "border-border-subtle", label: "", text: "text-foreground", chip: "bg-foreground/5 text-brand-ink-2" },
  INFO: { border: "border-brand-blue-500/40", label: "Information", text: "text-foreground", chip: "bg-brand-blue-500/10 text-brand-blue-500 border-brand-blue-500/20" },
  WARNING: { border: "border-amber-500/40", label: "Important", text: "text-foreground", chip: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  SUCCESS: { border: "border-green-500/40", label: "Success", text: "text-foreground", chip: "bg-green-500/10 text-green-400 border-green-500/20" },
  HIGHLIGHT: { border: "border-brand-red-500/40", label: "Highlighted", text: "text-foreground", chip: "bg-brand-red-500/10 text-brand-red-500 border-brand-red-500/20" },
};

function accentFor(key: string) {
  return ACCENTS[(key || "DEFAULT").toUpperCase()] ?? ACCENTS.DEFAULT;
}

/** Direct media URLs we can play inline (anything else opens externally). */
function isPlayableFile(url: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i.test(url);
}

function CopyableSecret({ value, accent }: { value: string; accent?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked (older Safari / insecure origin) — value stays visible */
    }
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 p-3 bg-background/60 border border-border-subtle rounded-lg font-mono text-center overflow-x-auto">
        <span className={accent ? "text-brand-red-500 font-bold tracking-widest" : "text-foreground font-bold tracking-wide"}>
          {value}
        </span>
      </div>
      <Button variant="outline" className="shrink-0 text-xs gap-1.5" onClick={handle}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "COPIED" : "COPY"}
      </Button>
    </div>
  );
}

export function DashboardClient({
  identifier,
  resources,
  platformType,
  platformName,
  branchName,
  warning,
}: DashboardClientProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Branch safety notice: once per authenticated browser session. */
  const ackKey = warning ? `branch_warning_ack_${warning.branchId}` : null;
  const [showWarning, setShowWarning] = useState(false);
  useEffect(() => {
    if (!ackKey || typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        if (!sessionStorage.getItem(ackKey)) setShowWarning(true);
      } catch {
        setShowWarning(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [ackKey]);
  const acknowledgeWarning = () => {
    if (ackKey && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(ackKey, "1");
      } catch {
        /* storage blocked — the notice simply shows again next visit */
      }
    }
    setShowWarning(false);
  };

  /* ── Group by TYPE (names are no longer the contract) ─────────────────
     "MAIN FILE" / "FILE PASSWORD" keep their featured slots because that is
     how the existing library is authored; every other resource renders by its
     declared type, so new types work with no code change. */
  const upper = (v: string) => (v || "").toUpperCase();
  const primary = resources.find((r) => upper(r.name) === "MAIN FILE");
  const password = resources.find(
    (r) => upper(r.name) === "FILE PASSWORD" || upper(r.name).includes("PASSWORD") || r.type === "SECRET"
  );

  const rest = resources.filter((r) => r.id !== primary?.id && r.id !== password?.id);

  /* A resource is a tutorial when its TYPE says so, or — for rows authored
     before the type existed — when its name says so. That keeps every existing
     tutorial in its familiar section while new TUTORIAL resources work purely
     on type. */
  const isTutorial = (r: ResourceView) =>
    r.type === "TUTORIAL" || upper(r.name).includes("TUTORIAL");

  const files = rest.filter((r) => r.type === "FILE" && !isTutorial(r));
  const links = rest.filter((r) => (r.type === "LINK" || (!r.type && r.url)) && !isTutorial(r));
  const texts = rest.filter((r) => r.type === "TEXT" || r.type === "NOTE");
  const images = rest.filter((r) => r.type === "IMAGE");
  const videos = rest.filter((r) => r.type === "VIDEO");
  const tutorials = rest.filter(isTutorial);
  /* Anything with an unrecognised type still shows as a generic link card. */
  const otherLinks = [...files, ...links].filter((r) => r.id !== primary?.id);

  const handlePasswordCopy = () => {
    if (password?.secret) {
      navigator.clipboard
        .writeText(password.secret)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        })
        .catch(() => {});
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 min-h-screen">
      {/* Branch safety notice — blocks resources until acknowledged */}
      {showWarning && warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <GlassCard className="max-w-md w-full p-8 border-brand-blue-500/30 shadow-[0_0_30px_rgba(47,95,208,0.15)]">
            <div className="w-14 h-14 rounded-2xl bg-brand-blue-500/10 border border-brand-blue-500/30 flex items-center justify-center text-brand-blue-500 mb-6">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-4 uppercase tracking-tight">
              {warning.title}
            </h2>
            <p className="text-brand-ink-3 text-sm leading-relaxed mb-8">{warning.message}</p>
            <Button variant="primary" size="lg" className="w-full" onClick={acknowledgeWarning}>
              {warning.buttonText}
            </Button>
          </GlassCard>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-mono font-bold text-foreground tracking-widest">
            MK PANEL ZONE
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="text-brand-ink-3 hover:text-foreground">
            <Link href="/support">
              <HelpCircle size={16} className="mr-2" /> SUPPORT
            </Link>
          </Button>
          <form action={customerLogout}>
            <Button
              type="submit"
              variant="outline"
              className="gap-2 text-brand-red-500 hover:text-red-400 hover:border-brand-red-500/50"
            >
              <LogOut size={16} /> LOG OUT
            </Button>
          </form>
        </div>
      </div>

      {/* Intro Section */}
      <div className="mb-10">
        <p className="text-brand-blue-500 uppercase tracking-widest text-[13px] font-bold mb-2">
          Private Customer Portal
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
          YOUR DIGITAL ACCESS
        </h1>
        <p className="text-brand-ink-3 max-w-2xl mb-8 text-[16px] leading-relaxed">
          Everything included in your package, organized in one place.
        </p>

        <div className="flex flex-wrap items-center gap-4 bg-background/40 border border-border-subtle p-4 rounded-xl max-w-md">
          <div className="w-12 h-12 rounded-full bg-brand-blue-500/10 border border-brand-blue-500/20 flex items-center justify-center">
            <ShieldCheck className="text-brand-blue-500" size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-ink-3">Customer</p>
            <p className="font-extrabold text-foreground text-lg tracking-wide break-all">
              {identifier}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {branchName && (
              <span className="px-3 py-1 bg-brand-blue-500/10 text-brand-blue-500 text-[10px] font-bold rounded-full border border-brand-blue-500/20 tracking-widest uppercase">
                {branchName}
              </span>
            )}
            <span className="px-3 py-1 bg-foreground/10 text-foreground text-[10px] font-bold rounded-full border border-border-subtle tracking-widest uppercase">
              {platformName || platformType}
            </span>
            <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20 tracking-widest">
              PAID · ACTIVE
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Row 1: Main File + File Password */}
        {(primary || password) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {primary && (
              <GlassCard className="lg:col-span-2 flex flex-col justify-between group hover:border-brand-blue-500/30 transition-colors">
                <div className="flex items-start justify-between mb-8 gap-4">
                  <div>
                    <p className="text-brand-blue-500 text-[11px] font-bold tracking-widest uppercase mb-2">
                      Primary Resource
                    </p>
                    <h3 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight break-words">
                      {primary.name}
                    </h3>
                    <p className="text-brand-ink-3 text-[15px]">
                      {primary.description || "Ready to download. Always check for the latest version."}
                    </p>
                  </div>
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-foreground/5 border border-border-subtle flex items-center justify-center group-hover:bg-brand-blue-500/10 group-hover:border-brand-blue-500/30 transition-colors">
                    <Download size={28} className="text-brand-ink-2 group-hover:text-brand-blue-500 transition-colors" />
                  </div>
                </div>

                {primary.url ? (
                  <Button asChild variant="primary" className="w-full sm:w-auto">
                    <Link href={primary.url} target="_blank" rel="noreferrer">
                      DOWNLOAD FILE <Download size={16} className="ml-2" />
                    </Link>
                  </Button>
                ) : primary.secret ? (
                  <CopyableSecret value={primary.secret} />
                ) : (
                  <Button disabled variant="outline" className="w-full sm:w-auto opacity-50">
                    Currently unavailable
                  </Button>
                )}
              </GlassCard>
            )}

            {password && (
              <GlassCard className={`flex flex-col justify-between ${primary ? "lg:col-span-1" : "lg:col-span-3"}`}>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Key size={20} className="text-brand-red-500" />
                    <h3 className="text-xl font-extrabold tracking-tight text-foreground break-words">
                      {password.name}
                    </h3>
                  </div>
                  <p className="text-brand-ink-3 text-[14px] mb-6">
                    {password.description || "Required to extract the main file archive."}
                  </p>

                  {password.secret ? (
                    <div className="p-4 bg-background/60 border border-border-subtle rounded-xl font-mono text-center flex items-center justify-center overflow-hidden">
                      <span
                        className={`text-brand-red-500 font-bold tracking-widest transition-none ${
                          showPassword ? "opacity-100" : "blur-[6px] opacity-60 select-none"
                        }`}
                      >
                        {showPassword ? password.secret : "••••••••••••"}
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 bg-background/40 border border-border-subtle rounded-xl text-center">
                      <span className="text-brand-ink-3 text-sm italic font-medium">
                        Currently unavailable
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!password.secret}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex-1 text-xs ${copied ? "bg-green-500/20 text-green-400 border-green-500/50" : ""}`}
                    onClick={handlePasswordCopy}
                    disabled={!password.secret}
                  >
                    {copied ? "COPIED!" : "COPY"}
                  </Button>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* TEXT / NOTE — rendered as a polished panel, never raw text */}
        {texts.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {texts.map((res) => {
              const accent = accentFor(res.accentStyle);
              return (
                <GlassCard key={res.id} className={`p-6 border ${accent.border}`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-foreground/5 border border-border-subtle flex items-center justify-center text-brand-ink-2">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-lg font-extrabold tracking-tight ${accent.text} break-words`}>
                          {res.name}
                        </h3>
                        {accent.label && (
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${accent.chip}`}>
                            {accent.label}
                          </span>
                        )}
                      </div>
                      {res.description && (
                        <p className="text-brand-ink-3 text-[13px] mt-1">{res.description}</p>
                      )}
                    </div>
                  </div>
                  {(res.bodyText || res.secret) && (
                    <div className="prose-invert max-w-none text-[15px] leading-relaxed text-brand-ink-2 whitespace-pre-wrap break-words border-t border-border-subtle pt-4">
                      {res.bodyText || res.secret}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* IMAGE */}
        {images.length > 0 && (
          <div>
            <h3 className="text-[15px] font-extrabold tracking-widest text-foreground mb-6 mt-4 uppercase">
              Images
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {images.map((res) => (
                <GlassCard key={res.id} className="p-5">
                  <h3 className="text-base font-extrabold tracking-tight text-foreground mb-1 break-words">
                    {res.name}
                  </h3>
                  {res.description && (
                    <p className="text-brand-ink-3 text-[13px] mb-4">{res.description}</p>
                  )}
                  {res.url ? (
                    <a href={res.url} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={res.url}
                        alt={res.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto max-h-[420px] object-contain rounded-xl border border-border-subtle bg-background/40"
                      />
                    </a>
                  ) : (
                    <div className="p-4 bg-background/40 border border-border-subtle rounded-xl text-center text-sm text-brand-ink-3">
                      Currently unavailable
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO — nothing is fetched until the visitor presses play */}
        {videos.length > 0 && (
          <div>
            <h3 className="text-[15px] font-extrabold tracking-widest text-foreground mb-6 mt-4 uppercase">
              Videos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map((res) => (
                <GlassCard key={res.id} className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <PlayCircle size={20} className="text-brand-blue-500 shrink-0" />
                    <h3 className="text-base font-extrabold tracking-tight text-foreground break-words">
                      {res.name}
                    </h3>
                  </div>
                  {res.description && (
                    <p className="text-brand-ink-3 text-[13px] mb-4">{res.description}</p>
                  )}
                  {res.url ? (
                    isPlayableFile(res.url) ? (
                      <video
                        controls
                        preload="none"
                        playsInline
                        className="w-full h-auto rounded-xl border border-border-subtle bg-black"
                        src={res.url}
                      />
                    ) : (
                      <Button asChild variant="glass" className="w-full">
                        <Link href={res.url} target="_blank" rel="noreferrer">
                          WATCH VIDEO <PlayCircle size={16} className="ml-2" />
                        </Link>
                      </Button>
                    )
                  ) : (
                    <div className="p-4 bg-background/40 border border-border-subtle rounded-xl text-center text-sm text-brand-ink-3">
                      Currently unavailable
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* TUTORIAL */}
        {tutorials.length > 0 && (
          <div>
            <h3 className="text-[15px] font-extrabold tracking-widest text-foreground mb-6 mt-4 uppercase">
              Tutorials &amp; Guides
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tutorials.map((tutorial) => {
                const accent = accentFor(tutorial.accentStyle);
                const body = tutorial.bodyText || tutorial.secret;
                return (
                  <GlassCard
                    key={tutorial.id}
                    className={`h-full flex flex-col p-6 border ${accent.border}`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-brand-blue-500/10 flex items-center justify-center text-brand-blue-500">
                        <GraduationCap size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold tracking-wide text-foreground break-words">
                          {tutorial.name}
                        </p>
                        {accent.label && (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${accent.chip}`}>
                            {accent.label}
                          </span>
                        )}
                      </div>
                    </div>
                    {tutorial.description && (
                      <p className="text-brand-ink-3 text-[13px] mb-3">{tutorial.description}</p>
                    )}
                    {body && (
                      <p className="text-brand-ink-2 text-[14px] leading-relaxed whitespace-pre-wrap break-words mb-4">
                        {body}
                      </p>
                    )}
                    {tutorial.url && (
                      <Button asChild variant="glass" className="mt-auto w-full">
                        <Link href={tutorial.url} target="_blank" rel="noreferrer">
                          OPEN GUIDE <LinkIcon size={16} className="ml-2" />
                        </Link>
                      </Button>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Everything else: FILE / LINK resources, in manual display order */}
        {otherLinks.length > 0 && (
          <div>
            <h3 className="text-[15px] font-extrabold tracking-widest text-foreground mb-6 mt-4 uppercase">
              Additional Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherLinks.map((res) => {
                const isFile = res.type === "FILE";
                return (
                  <GlassCard
                    key={res.id}
                    className="flex flex-col justify-between group hover:border-brand-blue-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-6 gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-extrabold tracking-tight text-foreground mb-2 uppercase break-words">
                          {res.name}
                        </h3>
                        <p className="text-brand-ink-3 text-[13px]">
                          {res.description ||
                            `${isFile ? "Download for" : "Required for"} ${(platformName || platformType).toLowerCase()} access.`}
                        </p>
                      </div>
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-foreground/5 flex items-center justify-center text-brand-ink-2 group-hover:text-foreground transition-colors">
                        {isFile ? <Download size={20} /> : <LinkIcon size={20} />}
                      </div>
                    </div>
                    {res.url ? (
                      <Button asChild variant="glass" className="w-full">
                        <Link href={res.url} target="_blank" rel="noreferrer">
                          {isFile ? "DOWNLOAD" : "OPEN LINK"}
                          {isFile ? (
                            <Download size={16} className="ml-2" />
                          ) : (
                            <LinkIcon size={16} className="ml-2" />
                          )}
                        </Link>
                      </Button>
                    ) : res.secret ? (
                      <CopyableSecret value={res.secret} accent />
                    ) : (
                      <Button disabled variant="outline" className="w-full opacity-50">
                        Currently unavailable
                      </Button>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {resources.length === 0 && (
          <GlassCard className="p-8 text-center">
            <ImageIcon size={28} className="mx-auto text-brand-ink-3 mb-4" />
            <p className="text-brand-ink-3 text-sm">
              No resources have been published for your section yet. Please check back shortly.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
