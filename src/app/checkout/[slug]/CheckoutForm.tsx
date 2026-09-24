"use client";

import { useIsClient } from "@/lib/useIsClient";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input, FieldLabel } from "@/components/ui/Input";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  Upload,
  X,
  ImageIcon,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { submitOrder } from "@/app/actions";

interface Props {
  productId: string;
  planPrice: number;
}

/**
 * CheckoutForm — the order submission surface (spec §14: checkout is
 * preserved exactly).
 *
 * All behaviour is unchanged and deliberately kept intact:
 *  - honeypot field for bot filtering
 *  - `idempotencyKey` generated once per mount so a double submit cannot
 *    create two orders
 *  - draft persistence to sessionStorage keyed by product
 *  - live amount-vs-plan comparison
 *  - the same `submitOrder` payload keys and the WhatsApp redirect handoff
 *
 * Only the presentation layer changed.
 */
export function CheckoutForm({ productId, planPrice }: Props) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [amount, setAmount] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [proof, setProof] = useState<{ name: string; url: string } | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  /*
    The idempotency key has to be generated on the client so SSR and hydration
    agree on the initial value. It is read only when the form is submitted, so it
    lives in a ref rather than state — nothing renders from it, which means no
    setState inside an effect and no wasted re-render.
  */
  const idempotencyKeyRef = useRef("");
  useEffect(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
  }, []);

  /*
    Restore a saved draft.

    The values live in sessionStorage, which only exists on the client, so this is
    React's documented "adjusting state when something external changes" pattern:
    adjust during render rather than in an effect, guarded by `draftApplied` so it
    happens exactly once.
  */
  const isClient = useIsClient();
  const [draftApplied, setDraftApplied] = useState(false);

  if (isClient && !draftApplied) {
    setDraftApplied(true);
    try {
      const saved = sessionStorage.getItem(`checkout_draft_${productId}`);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          email?: string;
          discord?: string;
          amount?: string;
        };
        if (parsed.email) setEmail(parsed.email);
        if (parsed.discord) setDiscord(parsed.discord);
        if (parsed.amount) setAmount(parsed.amount);
      }
    } catch {
      /* A corrupt draft must never block checkout — start clean instead. */
    }
  }

  useEffect(() => {
    /*
      Gate the save on `draftApplied`, otherwise this effect would run on the
      first commit and write the empty initial values over the customer's saved
      draft before the restore above has had a chance to apply it.
    */
    if (!draftApplied) return;
    const draft = { email, discord, amount };
    sessionStorage.setItem(`checkout_draft_${productId}`, JSON.stringify(draft));
  }, [email, discord, amount, productId, draftApplied]);

  /* Revoke the preview blob URL when it is replaced or unmounted. */
  useEffect(() => {
    return () => {
      if (proof?.url) URL.revokeObjectURL(proof.url);
    };
  }, [proof]);

  const parsedAmount = parseFloat(amount.replace(/,/g, ""));
  const isValidAmount = !isNaN(parsedAmount) && amount.trim() !== "";
  const isMatch = isValidAmount && parsedAmount === planPrice;
  const isMismatch = isValidAmount && parsedAmount !== planPrice;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!amount) {
      newErrors.amount = "Amount is required.";
    } else if (!isValidAmount || parsedAmount <= 0) {
      newErrors.amount = "Please enter a valid positive number.";
    } else if (amount.includes(".") && amount.split(".")[1].length > 2) {
      newErrors.amount = "Maximum 2 decimal places allowed.";
    }

    if (!fileInputRef.current?.files?.length) {
      newErrors.paymentProof = "Payment proof screenshot is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.email) emailRef.current?.focus();
      else if (newErrors.amount) amountRef.current?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus("loading");
    setErrors({});

    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("email", email);
    formData.append("discord", discord);
    formData.append("amountReported", amount);
    formData.append("honeypot", honeypot);
    formData.append("idempotencyKey", idempotencyKeyRef.current);
    formData.append("paymentProof", fileInputRef.current!.files![0]);

    try {
      const res = await submitOrder(formData);

      if (!res.success) {
        setStatus("error");
        setErrors({ form: res.error || "An error occurred. Please try again." });
        return;
      }

      /*
        Save the hand-off URL for the success page — but only when there is one.
        `whatsappUrl` is null when the owner has not configured a phone number,
        and `sessionStorage.setItem(key, null)` stores the *string* "null", which
        the success page would then try to navigate to.
      */
      if (res.whatsappUrl) {
        sessionStorage.setItem("pendingWhatsAppRedirect", res.whatsappUrl);
      }

      setStatus("success");

      // Clear draft
      sessionStorage.removeItem(`checkout_draft_${productId}`);

      // Small delay to show the success icon before redirecting
      setTimeout(() => {
        router.push(`/order/success?number=${res.orderRef}`);
      }, 400);
    } catch (err) {
      console.error("[CheckoutForm.tsx] unexpected failure:", err);
      setStatus("error");
      setErrors({ form: "Network error. Please try again." });
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setProof(file ? { name: file.name, url: URL.createObjectURL(file) } : null);
    if (errors.paymentProof) setErrors((prev) => ({ ...prev, paymentProof: "" }));
  };

  const clearFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setProof(null);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col space-y-5" noValidate>
      {errors.form && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-[12.5px] leading-relaxed"
          style={{
            background: "var(--status-danger-bg)",
            borderColor: "var(--status-danger-border)",
            color: "var(--status-danger-text)",
          }}
        >
          <AlertTriangle size={14} className="mt-[2px] shrink-0" aria-hidden />
          <span className="font-medium">{errors.form}</span>
        </div>
      )}

      {/* Honeypot — unchanged, still invisible and unfocusable */}
      <div className="pointer-events-none absolute -z-10 opacity-0" aria-hidden="true">
        <label>Do not fill this out if you are human</label>
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
        />
      </div>

      {/* ── Contact ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <FieldLabel htmlFor="email" required>
            Email address
          </FieldLabel>
          <Input
            id="email"
            ref={emailRef}
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            hint={errors.email ? undefined : "Your receipt and order updates go here."}
          />
        </div>

        <div>
          <FieldLabel htmlFor="discord">Discord username</FieldLabel>
          <Input
            id="discord"
            type="text"
            placeholder="username#1234"
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            hint="Optional — speeds up delivery if we need to reach you."
          />
        </div>
      </div>

      {/* ── Amount ──────────────────────────────────────────────── */}
      <div className="space-y-4 border-t border-border-subtle pt-5">
        <div
          className="flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-[12px] leading-relaxed"
          style={{
            background: "var(--status-warning-bg)",
            borderColor: "var(--status-warning-border)",
            color: "var(--status-warning-text)",
          }}
        >
          <AlertTriangle size={14} className="mt-[2px] shrink-0" aria-hidden />
          <span className="font-medium">
            Type the exact amount you sent. Enter only what you actually paid — a wrong or
            missing amount can delay or cancel your order.
          </span>
        </div>

        <div>
          <FieldLabel htmlFor="amount" required>
            Amount you sent
          </FieldLabel>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 select-none text-[12px] font-bold tracking-[0.1em] text-brand-ink-3"
              aria-hidden
            >
              PKR
            </span>
            <Input
              id="amount"
              ref={amountRef}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                // Only allow numbers, commas, and dots
                const val = e.target.value;
                if (/^[0-9.,]*$/.test(val)) {
                  setAmount(val);
                }
              }}
              error={errors.amount}
              className={`pl-[3.5rem] font-mono font-bold ${
                !errors.amount && isMismatch ? "border-[color:var(--status-warning-border)]" : ""
              }`}
            />
          </div>

          {/* Live comparison — real arithmetic against the plan price */}
          {amount && !errors.amount && (
            <div
              id="amount-status"
              aria-live="polite"
              className="mt-2.5 flex items-center gap-2 text-[11.5px] font-semibold"
            >
              {isMatch ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] px-2.5 py-1 text-[color:var(--status-success-text)]">
                  <CheckCircle2 size={12} aria-hidden />
                  Matches the plan price
                </span>
              ) : isMismatch ? (
                <span className="inline-flex items-start gap-1.5 rounded-[10px] border border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] px-2.5 py-1.5 text-[color:var(--status-warning-text)]">
                  <AlertTriangle size={12} className="mt-[1px] shrink-0" aria-hidden />
                  <span>
                    Different from the plan price (PKR {planPrice.toFixed(2)}) — please check
                    before ordering.
                  </span>
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment proof ───────────────────────────────────────── */}
      <div className="space-y-3 border-t border-border-subtle pt-5">
        <div>
          <FieldLabel htmlFor="paymentProof" required>
            Payment proof
          </FieldLabel>

          {proof ? (
            <div className="flex items-center gap-3.5 rounded-[12px] border border-border-subtle bg-[var(--input-bg)] p-3">
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[9px] border border-border-subtle bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proof.url} alt="Selected payment proof" className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground">{proof.name}</p>
                <p className="mt-0.5 text-[11.5px] text-[color:var(--status-success-text)]">
                  Attached — ready to submit
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove selected file"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-border-subtle text-brand-ink-3 transition-colors hover:border-[color:var(--status-danger-border)] hover:text-[color:var(--status-danger-text)]"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label
              htmlFor="paymentProof"
              className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed bg-[var(--input-bg)] px-6 py-7 text-center transition-colors hover:border-border-strong hover:bg-foreground/[0.04] ${
                errors.paymentProof
                  ? "border-[color:var(--status-danger-border)]"
                  : "border-border-strong"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-foreground/[0.05] text-brand-ink-2 transition-transform duration-200 group-hover:scale-105">
                <Upload size={18} aria-hidden />
              </span>
              <span className="mt-1 text-[13px] font-bold text-foreground">
                Attach your payment screenshot
              </span>
              <span className="text-[11.5px] text-brand-ink-3">PNG or JPEG</span>
            </label>
          )}

          <input
            id="paymentProof"
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            required
            aria-invalid={!!errors.paymentProof}
            aria-describedby={errors.paymentProof ? "file-error" : undefined}
            onChange={handleFile}
            className="sr-only"
          />

          {errors.paymentProof && (
            <p
              id="file-error"
              className="mt-2 flex items-start gap-1.5 text-[12px] font-medium"
              style={{ color: "var(--status-danger-text)" }}
            >
              <ImageIcon size={13} className="mt-[2px] shrink-0" aria-hidden />
              {errors.paymentProof}
            </p>
          )}
        </div>
      </div>

      {/* ── Submit ──────────────────────────────────────────────── */}
      <div className="space-y-3 border-t border-border-subtle pt-5">
        <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-brand-ink-4">
          <Lock size={12} className="mt-[2px] shrink-0 text-brand-ink-2" aria-hidden />
          Your submission is sent over an encrypted connection and verified manually by the
          team before delivery.
        </p>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={status === "loading" || status === "success"}
          loading={status === "loading"}
        >
          {status === "loading" ? (
            "Saving your order…"
          ) : status === "success" ? (
            <>
              <CheckCircle2 size={18} aria-hidden />
              Order saved
            </>
          ) : (
            <>
              <MessageCircle size={17} aria-hidden />
              Place order
            </>
          )}
        </Button>

        <p className="px-2 text-center text-[11px] font-medium leading-relaxed text-brand-ink-4">
          Your order details will open in WhatsApp — attach your payment screenshot in the
          chat to complete verification.
        </p>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-brand-ink-4">
        <ShieldCheck size={13} className="text-brand-ink-2" aria-hidden />
        Order number issued instantly · Manual verification
      </p>
    </form>
  );
}
