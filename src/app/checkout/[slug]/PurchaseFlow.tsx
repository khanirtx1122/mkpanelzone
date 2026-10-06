"use client";

import { useState } from "react";
import {
  ClipboardList,
  CreditCard,
  Upload,
  UserRoundPlus,
  LockKeyhole,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { CheckoutForm, type PaymentMethodOption } from "./CheckoutForm";

/**
 * GUIDED PURCHASE FLOW.
 *
 * "Purchase Now" no longer drops the buyer straight into a form. Step 1
 * explains exactly what will happen (payment, screenshot, credentials,
 * pending state, activation) in plain language; step 2 is the order form.
 *
 * The instruction step is local state only — no navigation, so returning to it
 * never loses what the buyer already typed into the form.
 */
export function PurchaseFlow({
  productId,
  planPrice,
  productName,
  paymentMethods,
  whatsappHref,
}: {
  productId: string;
  planPrice: number;
  productName: string;
  paymentMethods: PaymentMethodOption[];
  whatsappHref?: string | null;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  if (step === 1) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-blue-400">
          <ClipboardList size={14} /> Step 1 of 2 — Before you order
        </div>

        <p className="text-sm text-brand-ink-2 leading-relaxed">
          Buying <strong className="text-foreground">{productName}</strong> takes about two minutes.
          Here is exactly what happens next — no surprises.
        </p>

        <ol className="space-y-3">
          {[
            {
              Icon: CreditCard,
              title: "1. Send the payment",
              body: `Transfer exactly PKR ${planPrice.toFixed(0)} using any payment method shown on this page.`,
            },
            {
              Icon: Upload,
              title: "2. Upload your payment screenshot",
              body: "Take a screenshot of the successful transaction — it is required to verify your payment.",
            },
            {
              Icon: UserRoundPlus,
              title: "3. Choose your own login",
              body: "You pick your User ID and Password in the form. Keep them safe — you will use them to sign in.",
            },
            {
              Icon: LockKeyhole,
              title: "4. Your account starts as PENDING",
              body: "Your account is created instantly, but paid resources stay locked until we confirm your payment.",
            },
            {
              Icon: ShieldCheck,
              title: "5. Payment confirmed → full access",
              body: "Once the payment is verified, the same account unlocks your purchased resources automatically.",
            },
          ].map(({ Icon, title, body }) => (
            <li
              key={title}
              className="flex gap-3 p-3.5 rounded-xl border"
              style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
            >
              <span className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center bg-brand-blue-500/12 border border-brand-blue-500/25 text-brand-blue-400">
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold text-foreground mb-0.5">{title}</span>
                <span className="block text-[12px] text-brand-ink-3 leading-relaxed">{body}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="text-[11px] text-brand-ink-3 leading-relaxed">
          Verification usually completes shortly after payment. You will be contacted on the email or
          WhatsApp number you provide if anything needs confirming.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="group inline-flex flex-1 items-center justify-center gap-2 px-6 py-3.5 min-h-[50px] rounded-xl font-bold tracking-wider uppercase text-[13px] text-white active:scale-[0.985] transition-transform"
            style={{
              background: "linear-gradient(135deg, #1E3FA8, #2F5FD0)",
              boxShadow: "0 8px 22px -10px rgba(47,95,208,0.9)",
            }}
          >
            I understand — Continue
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>

          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[50px] rounded-xl font-bold tracking-wider uppercase text-[12px] text-brand-ink-2 hover:text-foreground transition-colors border"
              style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
            >
              Ask a question
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setStep(1)}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink-3 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} /> Step 2 of 2 — Order details
      </button>

      <CheckoutForm productId={productId} planPrice={planPrice} paymentMethods={paymentMethods} />
    </div>
  );
}
