import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckoutForm } from "./CheckoutForm";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  ShieldCheck,
  Clock,
  ReceiptText,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Steps } from "@/components/ui/Steps";

export const metadata = {
  title: "Checkout",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Checkout (spec §14: the checkout flow is preserved, not reinvented).
 *
 * The data contract is identical — the product is looked up by slug with
 * `active: true`, only `active` payment methods are offered, and the form
 * receives the same `productId` / `planPrice` props.
 */
export default async function CheckoutPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug, active: true },
  });

  if (!product) notFound();

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { active: true },
  });

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 ambient-blue opacity-40" aria-hidden />

      <div className="relative mx-auto max-w-[1080px] px-4 py-14 sm:px-6 sm:py-16">
        <PageHeader
          eyebrow="Checkout"
          title="Complete your order"
          description={
            <>
              You are purchasing{" "}
              <strong className="font-bold text-foreground">{product.name}</strong> for{" "}
              <strong className="font-bold text-foreground">
                PKR {product.price.toFixed(2)}
              </strong>
              . Payment is verified manually before delivery.
            </>
          }
          breadcrumbs={[
            { label: "Products", href: "/products" },
            { label: product.name, href: `/products/${product.slug}` },
            { label: "Checkout" },
          ]}
          actions={
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex h-[38px] items-center gap-1.5 rounded-[11px] border border-border-subtle px-3.5 text-[12px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
            >
              <ArrowLeft size={14} aria-hidden />
              Back to product
            </Link>
          }
        />

        {/* ── Order summary ───────────────────────────────────────── */}
        <div className="mat-3 mb-7 flex flex-col gap-4 rounded-[18px] p-4 sm:flex-row sm:items-center sm:gap-5">
          {product.coverImageUrl ? (
            <span className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[13px] border border-border-subtle bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.coverImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
          ) : (
            <span className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[13px] border border-border-subtle bg-foreground/[0.03] text-brand-ink-4">
              <ReceiptText size={22} aria-hidden />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold tracking-tight text-foreground">
              {product.name}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-brand-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={11} aria-hidden />
                Verified within 12 hours
              </span>
              <span className="text-brand-ink-4" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={11} aria-hidden />
                One account, one device
              </span>
            </p>
          </div>

          <div className="shrink-0 border-t border-border-subtle pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-brand-ink-4">
              Total
            </p>
            <p className="tabular mt-1 text-[21px] font-extrabold leading-none text-foreground">
              PKR {product.price.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* ── Step 1: send payment ─────────────────────────────── */}
          <section>
            <StepHeading index={1} title="Send the payment" />

            <div className="mat-2 rounded-[16px] p-5">
              <p className="text-[13px] leading-relaxed text-brand-ink-2">
                Send exactly{" "}
                <strong className="font-bold text-foreground">
                  PKR {product.price.toFixed(2)}
                </strong>{" "}
                using one of the accounts below, then take a screenshot of the confirmed
                transaction.
              </p>

              {paymentMethods.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon={Wallet}
                    title="No payment method available"
                    description="The team has not enabled a payment channel yet. Please contact support before sending money."
                    compact
                  />
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {paymentMethods.map((pm) => (
                    <li
                      key={pm.id}
                      className="rounded-[12px] border border-border-subtle bg-foreground/[0.025] p-4"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard size={13} className="shrink-0 text-brand-ink-2" aria-hidden />
                        <h3 className="text-[13px] font-bold tracking-[0.01em] text-foreground">
                          {pm.name}
                        </h3>
                      </div>
                      {/* select-all so the account details can be copied in one tap */}
                      <p className="mt-2.5 select-all break-words rounded-[9px] border border-border-subtle bg-surface px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-foreground">
                        {pm.accountDetails}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div
                className="mt-4 flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-[11.5px] leading-relaxed"
                style={{
                  background: "var(--status-info-bg)",
                  borderColor: "var(--status-info-border)",
                  color: "var(--status-info-text)",
                }}
              >
                <Info size={13} className="mt-[2px] shrink-0" aria-hidden />
                <span>
                  Send the exact amount in a single transaction. Partial or combined payments
                  cannot be matched to your order automatically.
                </span>
              </div>
            </div>
          </section>

          {/* ── Step 2: submit proof ─────────────────────────────── */}
          <section>
            <StepHeading index={2} title="Submit your proof" />

            <div className="mat-3 rounded-[16px] p-5">
              <CheckoutForm productId={product.id} planPrice={product.price} />
            </div>
          </section>
        </div>

        {/* ── What happens next ───────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
            What happens next
          </h2>
          <div className="mat-2 rounded-[16px] p-5 sm:p-6">
            <Steps
              steps={[
                {
                  title: "Order number issued instantly",
                  description:
                    "You receive a reference the moment you submit, and the details open in WhatsApp so you can attach the screenshot there.",
                },
                {
                  title: "Payment verified manually",
                  description:
                    "The team compares the amount you reported against the plan price and the screenshot. This is usually well under 12 hours.",
                },
                {
                  title: "Access details released",
                  description:
                    "Once approved, your credentials appear in your account dashboard, bound to the platform you chose.",
                },
              ]}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StepHeading({ index, title }: { index: number; title: string }) {
  return (
    <h2 className="mb-3.5 flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-foreground/[0.06] text-[11px] font-extrabold text-brand-ink-2">
        {index}
      </span>
      <span className="text-[15px] font-extrabold tracking-tight text-foreground">{title}</span>
    </h2>
  );
}
