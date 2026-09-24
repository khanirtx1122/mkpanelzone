import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  ReceiptText,
  Copy,
  Clock,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import { SuccessAutoRedirect } from "./SuccessAutoRedirect";

export const metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Order success (spec §14 / §41: a designed confirmation, not a default page).
 *
 * `noindex` because an order reference should never end up in a search index.
 * The reference is shown with a copy affordance since customers routinely need
 * to quote it in the WhatsApp thread.
 */
export default async function OrderSuccessPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const orderNumber = resolvedParams.number as string;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 ambient-blue opacity-50" aria-hidden />

      <div className="relative mx-auto flex min-h-[78vh] max-w-[680px] flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        {/* ── Confirmation mark ───────────────────────────────────── */}
        <span
          className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full border"
          style={{
            borderColor: "var(--status-success-border)",
            background: "var(--status-success-bg)",
            color: "var(--status-success-text)",
          }}
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 42px rgba(16,185,129,.22)" }}
            aria-hidden
          />
          <CheckCircle2 size={36} aria-hidden />
        </span>

        <h1 className="mt-7 text-[28px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[36px]">
          Order received
        </h1>

        <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-brand-ink-3">
          Your order has been recorded. Nothing else is required from you until the team
          confirms the payment.
        </p>

        {/* ── Order reference ─────────────────────────────────────── */}
        {orderNumber && (
          <div className="mat-4 mt-7 w-full max-w-sm rounded-[18px] p-5">
            <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-ink-4">
              <ReceiptText size={12} aria-hidden />
              Your order number
            </p>
            <p className="tabular mt-3 select-all break-all font-mono text-[26px] font-extrabold leading-none tracking-[0.04em] text-foreground">
              {orderNumber}
            </p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-brand-ink-4">
              <Copy size={11} aria-hidden />
              Select the number to copy it
            </p>
          </div>
        )}

        {/* ── WhatsApp handoff (client, reads sessionStorage) ─────── */}
        <SuccessAutoRedirect />

        {/* ── What to expect ──────────────────────────────────────── */}
        <ul className="mt-2 grid w-full max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {[
            { Icon: Clock, title: "Verified manually", body: "Usually well under 12 hours." },
            { Icon: ShieldCheck, title: "One device", body: "Transferable via support." },
            { Icon: LifeBuoy, title: "Keep the number", body: "Quote it for any support query." },
          ].map(({ Icon, title, body }) => (
            <li key={title} className="mat-2 rounded-[14px] p-4">
              <Icon size={15} className="text-brand-ink-2" aria-hidden />
              <p className="mt-2.5 text-[12.5px] font-bold text-foreground">{title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-brand-ink-3">{body}</p>
            </li>
          ))}
        </ul>

        {/* ── Exits ───────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="group inline-flex h-[46px] items-center justify-center gap-2 rounded-[12px] border border-border-subtle px-5 text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
          >
            Continue browsing
            <ArrowRight
              size={14}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <Link
            href="/access"
            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-foreground/[0.05] px-5 text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:bg-foreground/[0.07]"
          >
            Go to my access
          </Link>
        </div>
      </div>
    </div>
  );
}
