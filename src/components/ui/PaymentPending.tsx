import Link from "next/link";
import { LockKeyhole, MessageCircle, LogOut } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { customerLogout } from "@/app/actions";

/**
 * Shown to an authenticated customer whose paymentStatus is UNPAID.
 *
 * This screen is only ever rendered by the server AFTER the access gate denied
 * the request — no resource markup, URLs, secrets or metadata are sent to the
 * browser with it.
 */
export function PaymentPending({
  identifier,
  platformName,
}: {
  identifier?: string;
  platformName?: string | null;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 py-24">
      <GlassCard className="max-w-lg w-full p-7 sm:p-9 text-center border-brand-red-500/30 shadow-[0_0_40px_rgba(179,18,47,0.12)]">
        <div className="w-16 h-16 rounded-2xl bg-brand-red-500/10 border border-brand-red-500/30 mx-auto flex items-center justify-center text-brand-red-500 mb-6">
          <LockKeyhole size={30} />
        </div>

        <p className="text-brand-red-500 text-[11px] font-bold tracking-[0.22em] uppercase mb-3">
          Access Restricted
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase mb-4">
          Payment Pending
        </h1>
        <p className="text-brand-ink-3 text-[15px] leading-relaxed mb-6">
          Your access is currently restricted because payment has not been completed or
          approved yet.
        </p>

        {(identifier || platformName) && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-7">
            {identifier && (
              <span className="px-3 py-1 rounded-full bg-foreground/5 border border-border-subtle text-[11px] font-bold tracking-widest uppercase text-brand-ink-2">
                {identifier}
              </span>
            )}
            {platformName && (
              <span className="px-3 py-1 rounded-full bg-brand-blue-500/10 border border-brand-blue-500/20 text-[11px] font-bold tracking-widest uppercase text-brand-blue-500">
                {platformName}
              </span>
            )}
          </div>
        )}

        <div className="text-left bg-background/50 border border-border-subtle rounded-xl p-4 mb-7">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-brand-ink-3 mb-3">
            What to do next
          </p>
          <ul className="space-y-2.5 text-[14px] text-brand-ink-3 leading-relaxed">
            <li className="flex gap-2.5">
              <span className="text-brand-blue-500 font-bold">1.</span>
              <span>Complete your payment as instructed by the MK Panel Zone team.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="text-brand-blue-500 font-bold">2.</span>
              <span>Send your payment screenshot to support so it can be verified.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="text-brand-blue-500 font-bold">3.</span>
              <span>
                Once approved, this same account unlocks automatically — no new ID or
                password is needed.
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="primary" asChild className="w-full sm:flex-1">
            <Link href="/support">
              <MessageCircle size={16} className="mr-2" /> CONTACT SUPPORT
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:flex-1">
            <Link href="/">BACK TO HOME</Link>
          </Button>
        </div>

        {/* A blocked customer must still be able to sign out and switch accounts
            — the blocked screen replaces the dashboard, which owns the only
            other logout control. */}
        <form action={customerLogout} className="mt-3">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[12px] text-[12px] font-bold tracking-wider uppercase text-brand-ink-3 hover:text-foreground border border-transparent hover:border-border-subtle transition-colors"
          >
            <LogOut size={14} /> SIGN OUT OF THIS ACCOUNT
          </button>
        </form>
      </GlassCard>

      <p className="text-[12px] text-brand-ink-3 mt-6 text-center max-w-sm">
        Your account, password, platform and device binding are unchanged. Access returns the
        moment your payment is approved.
      </p>
    </div>
  );
}
