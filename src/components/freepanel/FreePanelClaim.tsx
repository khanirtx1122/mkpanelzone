"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Check,
  ArrowRight,
  Copy,
  Download,
  MessageCircle,
  PlaySquare,
  Hash,
  ShieldCheck,
  Monitor,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface FreePanelConfigPublic {
  enabled: boolean;
  /** Offer is on but inventory is empty — public "currently ended" view. */
  inventoryEmpty?: boolean;
  title: string;
  subtitle: string;
  durationLabel: string;
  ctaLabel: string;
  whatsappUrl: string;
  youtubeUrl: string;
  discordUrl: string;
  downloadUrl: string;
  downloadLabel: string;
  setupInstructions: string;
  popupDelaySeconds: number;
  popupFrequency: "ONCE_PER_SESSION" | "EVERY_VISIT" | "ONCE_PER_VISITOR";
}

export interface ExistingClaim {
  key: string;
  expiresAt: string;
  status: string;
}

type StepId = "whatsapp" | "youtube" | "discord";

const STEP_META: { id: StepId; title: string; verb: string; Icon: typeof MessageCircle }[] = [
  { id: "whatsapp", title: "Join WhatsApp Channel", verb: "JOIN WHATSAPP", Icon: MessageCircle },
  { id: "youtube", title: "Subscribe on YouTube", verb: "OPEN YOUTUBE", Icon: PlaySquare },
  { id: "discord", title: "Join Discord Server", verb: "JOIN DISCORD", Icon: Hash },
];

const EASE = [0.22, 1, 0.36, 1] as const;

interface FreePanelClaimProps {
  config: FreePanelConfigPublic;
  initialClaim: ExistingClaim | null;
  onClose: () => void;
}

export function FreePanelClaim({ config, initialClaim, onClose }: FreePanelClaimProps) {
  /** "offer" | "steps" | "success" | "ended" — success after issuance / existing claim */
  const [phase, setPhase] = useState<"offer" | "steps" | "success" | "ended">(
    initialClaim ? "success" : config.inventoryEmpty ? "ended" : "offer"
  );
  const [steps, setSteps] = useState<Record<StepId, boolean>>({
    whatsapp: false,
    youtube: false,
    discord: false,
  });
  const [claim, setClaim] = useState<ExistingClaim | null>(initialClaim);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const completedCount = Object.values(steps).filter(Boolean).length;

  // Focus management: remember trigger, focus dialog, trap Tab, restore on close
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus?.();
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  const handleStepClick = (id: StepId, url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    setSteps((s) => ({ ...s, [id]: true })); // honest mode: opening marks it OPENED/completed-by-user
  };

  const handleGetKey = async () => {
    if (completedCount < 3 || issuing) return;
    setIssuing(true);
    setIssueError(null);
    try {
      const res = await fetch("/api/free-panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepsDone: Object.entries(steps)
            .filter(([, done]) => done)
            .map(([id]) => id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.ended) {
          setPhase("ended"); // inventory exhausted between render and click
          return;
        }
        throw new Error(data?.error || "Failed to create access.");
      }
      setClaim({ key: data.key, expiresAt: data.expiresAt, status: "ACTIVE" });
      setPhase("success");
    } catch (err) {
      setIssueError(err instanceof Error ? err.message : "Failed to create access.");
    } finally {
      setIssuing(false);
    }
  };

  const handleCopy = async () => {
    if (!claim) return;
    try {
      await navigator.clipboard.writeText(claim.key);
    } catch {
      // Fallback for older WebView2/Android WebViews without async clipboard
      const ta = document.createElement("textarea");
      ta.value = claim.key;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="free-panel-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6"
        style={{ background: "rgba(8,12,20,0.72)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="presentation"
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="free-panel-title"
          tabIndex={-1}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.32, ease: EASE }}
          className="relative w-full max-w-[560px] max-h-[92dvh] overflow-y-auto rounded-[22px] border outline-none"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-subtle)",
            boxShadow:
              "0 24px 64px rgba(4,8,18,0.5), 0 2px 8px rgba(4,8,18,0.3), inset 0 1px 0 var(--border-top-highlight)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top edge light */}
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none z-10"
            style={{ background: "linear-gradient(90deg,transparent,rgba(77,163,255,0.35),transparent)" }}
          />

          {/* Close button — 44px touch target */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 w-11 h-11 flex items-center justify-center rounded-full text-brand-ink-3 hover:text-foreground hover:bg-foreground/5 active:scale-90 transition-[color,background-color,transform] duration-150"
          >
            <X size={19} />
          </button>

          {/* ──────────────── PHASE: ENDED (inventory exhausted) ──────────────── */}
          {phase === "ended" && (
            <div className="p-6 sm:p-8 text-center">
              <div
                className="w-14 h-14 mx-auto mb-4 rounded-[16px] flex items-center justify-center border"
                style={{ background: "rgba(47,95,208,0.10)", borderColor: "rgba(77,163,255,0.25)" }}
              >
                <Monitor size={24} className="text-brand-neon-blue" />
              </div>
              <h2
                id="free-panel-title"
                className="font-extrabold text-foreground tracking-tight mb-2"
                style={{ fontSize: "clamp(19px,5vw,24px)" }}
              >
                FREE PANEL CURRENTLY ENDED
              </h2>
              <p className="text-[13px] sm:text-[14px] text-brand-ink-3 leading-relaxed max-w-sm mx-auto mb-6">
                All available access keys have been claimed.
                Please wait for the next Free Panel release.
              </p>
              <button
                onClick={onClose}
                className="w-full h-[46px] rounded-[14px] text-[12px] font-bold tracking-[0.08em] uppercase text-brand-ink-3 hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* ──────────────── PHASE: OFFER ──────────────── */}
          {phase === "offer" && (
            <div className="p-6 sm:p-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full border"
                style={{
                  borderColor: "rgba(77,163,255,0.25)",
                  background: "rgba(47,95,208,0.10)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-neon-blue" />
                <span className="text-[10px] font-bold tracking-[0.16em] text-brand-neon-blue uppercase">
                  Limited Offer
                </span>
              </div>

              <h2
                id="free-panel-title"
                className="font-extrabold text-foreground tracking-tight leading-[1.12] mb-2 pr-8"
                style={{ fontSize: "clamp(22px,6vw,30px)" }}
              >
                {config.title}
              </h2>
              <p
                className="text-transparent bg-clip-text font-extrabold tracking-[0.08em] mb-3"
                style={{
                  fontSize: "clamp(15px,4vw,19px)",
                  backgroundImage: "linear-gradient(90deg,#4DA3FF 0%,#2F5FD0 70%)",
                }}
              >
                {config.subtitle}
              </p>
              <p className="text-[13px] sm:text-[14px] text-brand-ink-3 leading-relaxed mb-6">
                {config.durationLabel}
              </p>

              {/* PC-only tag */}
              <div className="flex items-center gap-2 mb-7 text-[11px] font-bold tracking-[0.1em] uppercase text-brand-ink-3">
                <Monitor size={14} className="text-brand-neon-blue" />
                PC only · No payment required
              </div>

              <button
                onClick={() => setPhase("steps")}
                className="w-full h-[52px] rounded-[14px] text-white text-[13px] font-extrabold tracking-[0.08em] uppercase relative overflow-hidden active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)",
                  boxShadow: "0 4px 16px rgba(47,95,208,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
                }}
              >
                {config.ctaLabel}
                <ArrowRight size={15} />
              </button>

              <button
                onClick={onClose}
                className="w-full mt-3 h-[44px] text-[12px] font-bold tracking-[0.08em] uppercase text-brand-ink-3 hover:text-foreground transition-colors"
              >
                Maybe Later
              </button>
            </div>
          )}

          {/* ──────────────── PHASE: STEPS ──────────────── */}
          {phase === "steps" && (
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3 mb-1 pr-8">
                <h2
                  id="free-panel-title"
                  className="font-extrabold text-foreground tracking-tight"
                  style={{ fontSize: "clamp(19px,5vw,24px)" }}
                >
                  FREE PC ACCESS
                </h2>
                <span
                  className="shrink-0 mt-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-[0.12em] border"
                  style={{
                    color: "#4DA3FF",
                    borderColor: "rgba(77,163,255,0.3)",
                    background: "rgba(47,95,208,0.10)",
                  }}
                >
                  5 DAYS
                </span>
              </div>
              <p className="text-[13px] text-brand-ink-3 mb-2">
                Complete the steps below to unlock your access.
              </p>
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-brand-ink-3 mb-5">
                Step {Math.min(completedCount + 1, 3)} of 3 · {completedCount}/3 Complete
              </p>

              {/* Progress bar */}
              <div className="h-1 rounded-full overflow-hidden mb-6" style={{ background: "var(--surface-raised)" }}>
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${(completedCount / 3) * 100}%`,
                    background: "linear-gradient(90deg,#1E3FA8,#4DA3FF)",
                  }}
                />
              </div>

              <div className="space-y-3 mb-2">
                {STEP_META.map(({ id, title, verb, Icon }) => {
                  const done = steps[id];
                  const url =
                    id === "whatsapp" ? config.whatsappUrl : id === "youtube" ? config.youtubeUrl : config.discordUrl;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 p-3.5 rounded-[16px] border transition-colors duration-200"
                      style={{
                        background: done ? "rgba(47,95,208,0.06)" : "var(--surface-raised)",
                        borderColor: done ? "rgba(77,163,255,0.30)" : "var(--border-subtle)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 border"
                        style={{
                          background: done ? "rgba(77,163,255,0.12)" : "var(--surface-glass)",
                          borderColor: done ? "rgba(77,163,255,0.3)" : "var(--border-subtle)",
                        }}
                      >
                        {done ? (
                          <Check size={17} className="text-brand-neon-blue" />
                        ) : (
                          <Icon size={17} style={{ color: "var(--color-foreground-muted, #8fa3bd)" }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-bold text-foreground leading-tight">{title}</p>
                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase mt-0.5" style={{ color: done ? "#4DA3FF" : "var(--color-foreground-muted, #8fa3bd)" }}>
                          {done ? "✓ Completed" : "○ Not completed"}
                        </p>
                      </div>

                      {!done && url ? (
                        <button
                          onClick={() => handleStepClick(id, url)}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[11px] text-[10.5px] font-extrabold tracking-[0.06em] uppercase text-white border active:scale-95 transition-transform duration-150"
                          style={{
                            background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)",
                            borderColor: "rgba(77,163,255,0.35)",
                          }}
                        >
                          {verb}
                          <ArrowRight size={11} />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Locked CTA */}
              <button
                onClick={handleGetKey}
                disabled={completedCount < 3 || issuing}
                aria-disabled={completedCount < 3}
                className="w-full h-[52px] mt-4 rounded-[14px] text-[13px] font-extrabold tracking-[0.08em] uppercase flex items-center justify-center gap-2 transition-[background-color,opacity,transform] duration-200 active:scale-[0.98]"
                style={
                  completedCount < 3
                    ? {
                        background: "var(--surface-raised)",
                        color: "var(--color-foreground-muted, #8fa3bd)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "not-allowed",
                        opacity: 0.7,
                      }
                    : {
                        background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)",
                        color: "#fff",
                        boxShadow: "0 4px 16px rgba(47,95,208,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
                      }
                }
              >
                {issuing ? (
                  "CREATING ACCESS…"
                ) : (
                  <>
                    GET YOUR KEY
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
              {completedCount < 3 && (
                <p className="text-center text-[11px] text-brand-ink-3 mt-2">
                  Complete all 3 steps to continue.
                </p>
              )}
              {issueError && (
                <p className="text-center text-[11px] mt-2" style={{ color: "#FF5C7A" }}>
                  {issueError}
                </p>
              )}
            </div>
          )}

          {/* ──────────────── PHASE: SUCCESS ──────────────── */}
          {phase === "success" && claim && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-1 pr-8">
                <div
                  className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0 border"
                  style={{
                    background: "rgba(47,95,208,0.12)",
                    borderColor: "rgba(77,163,255,0.3)",
                  }}
                >
                  <ShieldCheck size={20} className="text-brand-neon-blue" />
                </div>
                <h2
                  id="free-panel-title"
                  className="font-extrabold text-foreground tracking-tight"
                  style={{ fontSize: "clamp(19px,5vw,24px)" }}
                >
                  ACCESS READY
                </h2>
              </div>
              <p className="text-[13px] text-brand-ink-3 mb-6 ml-[60px] -mt-1">
                Your 5-Day PC Trial has been created.
              </p>

              {/* Key field */}
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-brand-ink-3 mb-2">
                YOUR KEY
              </p>
              <div
                className="flex items-center gap-2 p-2 pl-4 rounded-[14px] border mb-2"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
              >
                <code
                  className="flex-1 min-w-0 font-mono text-[15px] sm:text-[17px] font-bold tracking-[0.08em] text-foreground truncate"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {claim.key}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[10px] text-[10.5px] font-extrabold tracking-[0.06em] uppercase border active:scale-95 transition-transform duration-150"
                  style={{
                    background: copied ? "rgba(47,95,208,0.16)" : "linear-gradient(135deg,#1E3FA8,#2F5FD0)",
                    color: copied ? "#4DA3FF" : "#fff",
                    borderColor: "rgba(77,163,255,0.35)",
                  }}
                >
                  {copied ? (
                    <>
                      COPIED <Check size={11} />
                    </>
                  ) : (
                    <>
                      COPY <Copy size={11} />
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-brand-ink-3 mb-6">
                Valid for 5 days{claim.expiresAt ? ` · until ${formatDate(claim.expiresAt)}` : ""}
              </p>

              {/* Download */}
              {config.downloadUrl && (
                <a
                  href={config.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-[52px] mb-2 rounded-[14px] text-[13px] font-extrabold tracking-[0.08em] uppercase text-white flex items-center justify-center gap-2 border active:scale-[0.98] transition-transform duration-150"
                  style={{
                    background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)",
                    borderColor: "rgba(77,163,255,0.35)",
                    boxShadow: "0 4px 16px rgba(47,95,208,0.3), inset 0 1px 0 rgba(255,255,255,0.14)",
                  }}
                >
                  <Download size={15} />
                  {config.downloadLabel}
                  <ArrowRight size={13} />
                </a>
              )}

              {/* Setup note */}
              <div
                className="mt-4 p-4 rounded-[14px] border"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
              >
                <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-brand-ink-3 mb-2.5">
                  QUICK SETUP
                </p>
                <ol className="space-y-1.5">
                  {config.setupInstructions
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12.5px] text-brand-ink-3 leading-snug">
                        <span className="font-bold text-brand-neon-blue shrink-0">{i + 1}.</span>
                        <span>{line.replace(/^\d+[.)]\s*/, "")}</span>
                      </li>
                    ))}
                </ol>
              </div>

              <button
                onClick={onClose}
                className="w-full h-[46px] mt-4 text-[12px] font-bold tracking-[0.08em] uppercase text-brand-ink-3 hover:text-foreground transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FreePanelClaim;
