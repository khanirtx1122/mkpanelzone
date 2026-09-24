"use client";

import { useState } from "react";
import { managementLogin } from "@/app/actions";
import { ShieldAlert, ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input, FieldLabel } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * Management entry — the staff-only sign-in surface (spec §60: admin/agent
 * separation is visual as well as functional).
 *
 * Distinct from the customer portal on purpose: no product imagery, no
 * marketing, a restrained dark surface and a clear warning. The server contract
 * (`managementLogin`) is unchanged.
 */
export default function MkAgentsLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    /* Read FormData before the await — `currentTarget` is not safe to touch
       after an asynchronous boundary. */
    const formData = new FormData(e.currentTarget);
    const result = await managementLogin(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Ambient depth — two restrained lights, no decorative 3D */}
      <div className="pointer-events-none absolute inset-0 ambient-blue opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 ambient-crimson opacity-50"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.5]" aria-hidden />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* ── Brand ─────────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex flex-col items-center gap-3 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]"
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-border-strong text-[17px] font-extrabold text-brand-ink-2"
              style={{
                background:
                  "linear-gradient(150deg, var(--ambient-strong), var(--ambient-strong))",
              }}
              aria-hidden
            >
              MK
            </span>
            <span className="flex flex-col items-center">
              <span className="text-[19px] font-extrabold tracking-[0.10em] text-foreground">
                PANEL ZONE
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.19em] text-brand-ink-3">
                Management Access
              </span>
            </span>
          </Link>
        </div>

        {/* ── Card ──────────────────────────────────────────────────── */}
        <div className="mat-5 relative overflow-hidden rounded-[20px] p-6 sm:p-7">
          {/* Intent accent — crimson, because this is a privileged door */}
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-red-500/60 to-transparent"
            aria-hidden
          />

          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] text-[color:var(--status-danger-text)]">
              <Lock size={14} aria-hidden />
            </span>
            <div>
              <h1 className="text-[14px] font-extrabold tracking-tight text-foreground">
                Staff sign-in
              </h1>
              <p className="text-[11.5px] text-brand-ink-3">
                Owner and agent accounts only
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-[12.5px] leading-relaxed"
                style={{
                  background: "var(--status-danger-bg)",
                  borderColor: "var(--status-danger-border)",
                  color: "var(--status-danger-text)",
                }}
              >
                <ShieldAlert size={15} className="mt-[2px] shrink-0" aria-hidden />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div>
              <FieldLabel htmlFor="mgmt-username" required>
                Agent / Owner ID
              </FieldLabel>
              <Input
                id="mgmt-username"
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="Your assigned ID"
              />
            </div>

            <div>
              <FieldLabel htmlFor="mgmt-password" required>
                Password
              </FieldLabel>
              <Input
                id="mgmt-password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? "Authenticating…" : "Authenticate"}
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 border-t border-border-subtle pt-5">
            <ShieldCheck size={13} className="mt-[2px] shrink-0 text-brand-ink-4" aria-hidden />
            <p className="text-[11.5px] leading-relaxed text-brand-ink-4">
              Sessions are verified on the server for every privileged action. Credentials are
              hashed and disabled accounts are refused at sign-in.
            </p>
          </div>
        </div>

        {/* ── Exit ──────────────────────────────────────────────────── */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-brand-ink-3 transition-colors hover:text-foreground"
          >
            <ArrowLeft
              size={13}
              className="transition-transform duration-150 group-hover:-translate-x-0.5"
              aria-hidden
            />
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
