"use client";

import { useActionState, useEffect, useState } from "react";
import { customerLogin, type LoginResult } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Input, FieldLabel } from "@/components/ui/Input";
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowLeft,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PlatformCard, PLATFORM_META, type PlatformKey } from "@/components/ui/PlatformCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type PlatformType = PlatformKey | null;

export function AccessForm() {
  const [state, formAction, pending] = useActionState<LoginResult, FormData>(customerLogin, null);
  const [platform, setPlatform] = useState<PlatformType>(null);
  const router = useRouter();

  /*
    Derived, not stored. `isSuccess` is a pure function of the action result, so
    holding it in state meant an effect whose only job was to copy one piece of
    data into another — and a cascading render on every success.
  */
  const isSuccess = state?.type === "SUCCESS";

  /* The effect now owns only the timer; nothing sets state synchronously. */
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => router.push("/dashboard"), 520);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  /* ── Device already bound to another device ─────────────────── */
  /*
    Note: no code path currently returns DEVICE_MISMATCH, so this screen is
    unreachable today. Its copy has been corrected anyway — it previously
    asserted that "device binding is enforced on the server", which is not true:
    a device token is minted on first sign-in but never verified on later
    logins. The wording below describes only what the system actually does.
  */
  if (state?.type === "DEVICE_MISMATCH") {
    return (
      <ScrollReveal>
        <PortalNotice
          tone="danger"
          icon={ShieldAlert}
          eyebrow="Access locked"
          title="This access is already registered"
          body="This customer access is registered to a different device. Support can reset the device binding for you if you have changed hardware."
          actions={
            <>
              <Button variant="primary" asChild className="w-full">
                <Link href="/support">Contact support</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Back to home</Link>
              </Button>
            </>
          }
        />
      </ScrollReveal>
    );
  }

  /* ── Account disabled by the owner ──────────────────────────── */
  if (state?.type === "ACCOUNT_DISABLED") {
    return (
      <ScrollReveal>
        <PortalNotice
          tone="danger"
          icon={ShieldAlert}
          eyebrow="Access suspended"
          title="This account is disabled"
          body="Your credentials are correct, but this account has been disabled. Contact support and we will look into it."
          actions={
            <>
              <Button variant="primary" asChild className="w-full">
                <Link href="/support">Contact support</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Back to home</Link>
              </Button>
            </>
          }
        />
      </ScrollReveal>
    );
  }

  /* ── Wrong platform ─────────────────────────────────────────── */
  if (state?.type === "WRONG_PLATFORM") {
    return (
      <ScrollReveal>
        <PortalNotice
          tone="warning"
          icon={AlertTriangle}
          eyebrow="Platform mismatch"
          title="Wrong platform"
          body="These credentials belong to a different platform section. Return to platform selection and choose the correct one."
          actions={
            <Button onClick={() => setPlatform(null)} variant="primary" className="w-full">
              Return to platform selection
            </Button>
          }
        />
      </ScrollReveal>
    );
  }

  /* ── Step 1: platform selection ─────────────────────────────── */
  if (!platform) {
    return (
      <div>
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-7 flex justify-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-[17px] border"
                style={{
                  borderColor: "rgba(77,163,255,0.28)",
                  background:
                    "linear-gradient(160deg, var(--ambient-strong), var(--ambient-blue))",
                  boxShadow: "0 8px 30px var(--ambient-strong)",
                }}
                aria-hidden
              >
                <Shield size={24} className="text-brand-ink-2" />
              </span>
            </div>

            <p className="eyebrow mb-3.5">Secure Portal</p>
            <h1
              className="font-extrabold tracking-[-0.032em] text-foreground"
              style={{ fontSize: "clamp(28px, 6vw, 46px)", lineHeight: 1.06 }}
            >
              Customer Access
            </h1>
            <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-brand-ink-3">
              Select the platform your purchase belongs to. You will only ever
              reach the resources issued for that platform.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {(Object.keys(PLATFORM_META) as PlatformKey[]).map((key, i) => (
            <ScrollReveal key={key} delay={i * 80}>
              <PlatformCard
                platform={key}
                index={i}
                selected={false}
                onSelect={() => setPlatform(key)}
              />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={240}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-border-subtle pt-7">
            {[
              "Server-side platform enforcement",
              /* Was "One device per account" — a claim about enforcement that the
                 code does not implement. Replaced with a property that is
                 actually true: passwords are hashed with argon2. */
              "Credentials stored as secure hashes",
              "Secrets masked by default",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 text-[11.5px] font-semibold text-brand-ink-3"
              >
                <Lock size={12} className="text-brand-ink-2" aria-hidden />
                {item}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    );
  }

  /* ── Step 2: credentials ────────────────────────────────────── */
  const meta = PLATFORM_META[platform];
  const isError = state?.type === "INVALID_CREDENTIALS";

  return (
    <div className="mx-auto max-w-[460px]">
      <ScrollReveal>
        <button
          type="button"
          onClick={() => setPlatform(null)}
          className="mb-7 inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.11em] text-brand-ink-3 transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} aria-hidden />
          Change platform
        </button>

        <div className="mb-8 flex items-start gap-4">
          <span
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[15px] border"
            style={{
              borderColor: "rgba(77,163,255,0.26)",
              background:
                "linear-gradient(160deg, var(--ambient-strong), var(--ambient-blue))",
            }}
            aria-hidden
          >
            <meta.Icon size={22} className="text-brand-ink-2" />
          </span>

          <div className="min-w-0">
            <StatusBadge tone="info" size="xs" icon={Lock}>
              Platform selected
            </StatusBadge>
            <h1 className="mt-2.5 text-[24px] font-extrabold tracking-[-0.026em] text-foreground">
              {meta.label} access
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-brand-ink-3">
              Enter the credentials issued with your purchase.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={70}>
        <motion.div
          animate={isError ? { x: [-4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.32 }}
        >
          <div className="relative overflow-hidden rounded-[20px] mat-5">
            {/* Secure sweep across the top edge */}
            <motion.span
              className="absolute left-0 top-0 z-20 h-px w-1/2 bg-[color:var(--text-2)]"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "200%", opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              aria-hidden
            />

            <div className="p-6 sm:p-7">
              <form action={formAction} className="space-y-5">
                <input type="hidden" name="platform" value={platform} />

                <div>
                  <FieldLabel htmlFor="mk-identifier" required>
                    Device / Customer ID
                  </FieldLabel>
                  <Input
                    id="mk-identifier"
                    name="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Enter your customer ID"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="mk-password" required>
                    Password
                  </FieldLabel>
                  <Input
                    id="mk-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>

                <AnimatePresence initial={false}>
                  {isError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-[12px] border p-3.5"
                        style={{
                          borderColor: "var(--status-danger-border)",
                          background: "var(--status-danger-bg)",
                        }}
                      >
                        <ShieldAlert
                          size={15}
                          className="mt-[1px] shrink-0 text-[color:var(--status-danger-text)]"
                          aria-hidden
                        />
                        <p className="text-[12.5px] font-medium leading-relaxed text-[color:var(--status-danger-text)]">
                          That customer ID and password combination was not
                          recognised. Check for typos and try again.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {state?.type === "ERROR" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-[12px] border p-3.5"
                        style={{
                          borderColor: "var(--status-danger-border)",
                          background: "var(--status-danger-bg)",
                        }}
                      >
                        <ShieldAlert
                          size={15}
                          className="mt-[1px] shrink-0 text-[color:var(--status-danger-text)]"
                          aria-hidden
                        />
                        <p className="text-[12.5px] font-medium leading-relaxed text-[color:var(--status-danger-text)]">
                          {state.message}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="mt-1 w-full"
                  disabled={pending || isSuccess}
                  loading={pending && !isSuccess}
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 size={17} aria-hidden />
                      Access verified
                    </>
                  ) : pending ? (
                    "Verifying access…"
                  ) : (
                    <>
                      <KeyRound size={16} aria-hidden />
                      Access my files
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Security footer inside the panel */}
            <div className="flex items-center gap-2.5 border-t border-border-subtle bg-surface/50 px-6 py-4">
              <Lock size={12} className="shrink-0 text-[color:var(--status-success-text)]" aria-hidden />
              <p className="text-[11px] leading-relaxed text-brand-ink-3">
                Credentials are transmitted securely and never stored in the
                browser.
              </p>
            </div>
          </div>
        </motion.div>
      </ScrollReveal>

      <ScrollReveal delay={130}>
        <p className="mt-6 text-center text-[12.5px] text-brand-ink-4">
          Lost your credentials?{" "}
          <Link
            href="/support"
            className="font-bold text-brand-ink-2 transition-colors hover:text-foreground"
          >
            Contact support
          </Link>
        </p>
      </ScrollReveal>
    </div>
  );
}

/* ── Shared designed notice surface (error states, spec §41) ──── */
function PortalNotice({
  tone,
  icon: Icon,
  eyebrow,
  title,
  body,
  actions,
}: {
  tone: "danger" | "warning";
  icon: typeof ShieldAlert;
  eyebrow: string;
  title: string;
  body: string;
  actions: React.ReactNode;
}) {
  const palette =
    tone === "danger"
      ? {
          border: "var(--status-danger-border)",
          bg: "var(--status-danger-bg)",
          text: "var(--status-danger-text)",
        }
      : {
          border: "var(--status-warning-border)",
          bg: "var(--status-warning-bg)",
          text: "var(--status-warning-text)",
        };

  return (
    <div className="mx-auto max-w-[460px]">
      <div className="relative overflow-hidden rounded-[20px] mat-5 p-7 text-center">
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${palette.text}, transparent)`, opacity: 0.5 }}
          aria-hidden
        />

        <span
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[18px] border"
          style={{ borderColor: palette.border, background: palette.bg }}
          aria-hidden
        >
          <Icon size={28} style={{ color: palette.text }} />
        </span>

        <p className="eyebrow mb-2.5">{eyebrow}</p>
        <h2 className="text-[22px] font-extrabold tracking-[-0.024em] text-foreground">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-brand-ink-3">
          {body}
        </p>

        <div className="mt-7 flex flex-col gap-3">{actions}</div>
      </div>
    </div>
  );
}
