import Link from "next/link";
import { Wrench, ShieldCheck, Clock, LifeBuoy, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Scheduled maintenance",
  description:
    "MK Panel Zone is temporarily unavailable while scheduled maintenance is carried out.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Maintenance screen.
 *
 * Reached via a rewrite from `src/proxy.ts` when the `maintenance_mode` setting
 * is enabled — the visitor's original URL is preserved in the address bar.
 *
 * Deliberately exposes no private routes (spec §59): no link to the control
 * room or the agent workstation, only public destinations. Staff reach their
 * tools by navigating directly, which is already how they work.
 */
export default function MaintenancePage() {
  return (
    <div className="relative flex min-h-[78vh] items-center justify-center overflow-hidden px-4 py-20">
      <div className="pointer-events-none absolute inset-0 ambient-blue opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-grid opacity-[0.45]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-[560px] text-center">
        {/* Mark */}
        <span
          className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[20px] border"
          style={{
            borderColor: "var(--status-warning-border)",
            background: "var(--status-warning-bg)",
            color: "var(--status-warning-text)",
          }}
        >
          <Wrench size={30} aria-hidden />
        </span>

        <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.19em] text-brand-ink-3">
          MK Panel Zone
        </p>

        <h1 className="mt-3 text-[27px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[34px]">
          Scheduled maintenance
        </h1>

        <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-brand-ink-3">
          The storefront is temporarily offline while we carry out maintenance. Your account,
          orders and access details are unaffected and will be exactly as you left them.
        </p>

        {/* Reassurance */}
        <ul className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {[
            {
              Icon: ShieldCheck,
              title: "Nothing lost",
              body: "Accounts and orders are intact.",
            },
            {
              Icon: Clock,
              title: "Short window",
              body: "These windows are kept brief.",
            },
            {
              Icon: LifeBuoy,
              title: "Need help now?",
              body: "Support stays reachable.",
            },
          ].map(({ Icon, title, body }) => (
            <li key={title} className="mat-2 rounded-[14px] p-4">
              <Icon size={15} className="text-brand-ink-2" aria-hidden />
              <p className="mt-2.5 text-[12.5px] font-bold text-foreground">{title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-brand-ink-3">{body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/support"
            className="group inline-flex h-[46px] items-center justify-center gap-2 rounded-[12px] border border-border-subtle px-5 text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
          >
            Contact support
            <ArrowRight
              size={14}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <Link
            href="/"
            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-foreground/[0.05] px-5 text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:bg-foreground/[0.07]"
          >
            Check again
          </Link>
        </div>
      </div>
    </div>
  );
}
