"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, AlertTriangle, CheckCircle2, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitOrder } from "@/app/actions";

interface Props {
  productId: string;
  planPrice: number;
}

export function CheckoutForm({ productId, planPrice }: Props) {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [amount, setAmount] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate idempotency key on mount
    setIdempotencyKey(crypto.randomUUID());
    
    // Restore from session storage
    const saved = sessionStorage.getItem(`checkout_draft_${productId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.discord) setDiscord(parsed.discord);
        if (parsed.amount) setAmount(parsed.amount);
      } catch (e) {}
    }
  }, [productId]);

  useEffect(() => {
    // Save draft on change
    const draft = { email, discord, amount };
    sessionStorage.setItem(`checkout_draft_${productId}`, JSON.stringify(draft));
  }, [email, discord, amount, productId]);

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
    
    const chosen = fileInputRef.current?.files?.[0];
    if (!chosen) {
      newErrors.paymentProof = "Payment proof screenshot is required.";
    } else if (chosen.size > 8 * 1024 * 1024) {
      // Caught here so the customer is told before anything is uploaded.
      newErrors.paymentProof = `That screenshot is ${(chosen.size / 1024 / 1024).toFixed(1)} MB. Please use a file under 8 MB.`;
    } else if (chosen.size === 0) {
      newErrors.paymentProof = "That file appears to be empty. Please choose it again.";
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
    formData.append("idempotencyKey", idempotencyKey);
    formData.append("paymentProof", fileInputRef.current!.files![0]);

    try {
      const res = await submitOrder(formData);
      
      if (!res.success) {
        setStatus("error");
        setErrors({ form: res.error || "An error occurred. Please try again." });
        return;
      }

      // Save success details for the success page. Storage can throw in older
      // Safari private mode, which must never break a completed order.
      try {
        // whatsappUrl is null whenever the owner's WhatsApp number is not
        // configured, and sessionStorage serialises that to the literal
        // string "null" — which the success page then resolved as a relative
        // URL and bounced the buyer to /order/null (404). Only ever persist
        // a real absolute http(s) URL.
        if (typeof res.whatsappUrl === "string" && /^https?:\/\//i.test(res.whatsappUrl)) {
          sessionStorage.setItem("pendingWhatsAppRedirect", res.whatsappUrl);
        } else {
          sessionStorage.removeItem("pendingWhatsAppRedirect");
        }
        sessionStorage.removeItem(`checkout_draft_${productId}`);
      } catch {
        /* non-fatal: the order is already placed server-side */
      }

      setStatus("success");

      // Small delay to show the success icon before redirecting
      setTimeout(() => {
        router.push(`/order/success?number=${res.orderRef}`);
      }, 400);

    } catch (err) {
      setStatus("error");
      setErrors({ form: "Network error. Please try again." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 flex flex-col relative" noValidate>
      {errors.form && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-400 text-sm font-medium">
          {errors.form}
        </div>
      )}

      {/* Honeypot */}
      <div className="absolute opacity-0 -z-10 pointer-events-none" aria-hidden="true">
        <label>Do not fill this out if you are human</label>
        <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-bold tracking-wide text-brand-ink-2 mb-2">Email Address (for receipt)</label>
        <Input 
          id="email"
          ref={emailRef}
          type="email" 
          required 
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={errors.email ? "border-red-500 focus:ring-red-500" : ""}
        />
        {errors.email && <p id="email-error" className="text-red-400 text-xs mt-1 font-medium">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="discord" className="block text-sm font-bold tracking-wide text-brand-ink-2 mb-2">Discord Username (optional)</label>
        <Input 
          id="discord"
          type="text" 
          placeholder="username#1234"
          value={discord}
          onChange={(e) => setDiscord(e.target.value)}
        />
      </div>

      <div className="pt-2 border-t border-border-subtle">
        <label htmlFor="amount" className="block text-sm font-bold tracking-wide text-brand-ink-2 mb-2">Amount you sent</label>
        
        {/* Warning Callout */}
        <div className="flex items-start gap-3 p-3 mb-4 rounded-md border border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-red-200 leading-relaxed font-medium">
            Type the exact amount you sent. Enter only what you actually paid. A wrong or missing amount can delay or cancel your order.
          </p>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold select-none text-sm tracking-widest">PKR</span>
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
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "amount-error" : "amount-status"}
            className={`pl-[3.75rem] font-mono font-bold ${errors.amount ? "border-red-500 focus:ring-red-500" : isMismatch ? "border-amber-500/50 focus:ring-amber-500" : ""}`}
          />
        </div>
        {errors.amount && <p id="amount-error" className="text-red-400 text-xs mt-1 font-medium">{errors.amount}</p>}
        
        {/* Live Status Chip */}
        {amount && !errors.amount && (
          <div id="amount-status" aria-live="polite" className="mt-2 text-xs font-medium flex items-center gap-1.5 transition-opacity">
            {isMatch ? (
              <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded shadow-[0_0_8px_rgba(74,222,128,0.2)]">
                <CheckCircle2 size={14} /> Matches the plan price
              </span>
            ) : isMismatch ? (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded shadow-[0_0_8px_rgba(251,191,36,0.2)]">
                <AlertTriangle size={14} /> Different from the plan price (PKR {planPrice.toFixed(2)}) - Please check before ordering
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border-subtle">
        <label htmlFor="paymentProof" className="block text-sm font-bold tracking-wide text-brand-ink-2 mb-2">Upload Payment Proof</label>
        <input 
          id="paymentProof"
          ref={fileInputRef}
          type="file" 
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/heic,image/heif,application/pdf"
          required
          aria-invalid={!!errors.paymentProof}
          aria-describedby={errors.paymentProof ? "file-error" : undefined}
          onChange={() => {
            if (errors.paymentProof) setErrors(prev => ({ ...prev, paymentProof: "" }));
          }}
          className={`block w-full text-sm text-brand-ink-3
            file:mr-4 file:py-2.5 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-bold file:tracking-wide
            file:bg-brand-blue-500 file:text-foreground
            hover:file:bg-blue-600 file:transition-colors file:duration-obsidian
            cursor-pointer bg-surface-glass border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent ${
              errors.paymentProof ? "border-red-500" : "border-border-subtle"
            }`}
        />
        {errors.paymentProof && <p id="file-error" className="text-red-400 text-xs mt-1 font-medium">{errors.paymentProof}</p>}
      </div>

      <div className="pt-2 flex items-center gap-2 text-xs font-medium text-brand-ink-4">
        <ShieldCheck size={16} className="text-brand-blue-500" />
        Your submission is encrypted and securely processed.
      </div>

      <div className="mt-2 pt-2">
        <Button 
          type="submit" 
          variant="primary" 
          disabled={status === "loading" || status === "success"}
          className="w-full h-[52px] text-base group relative overflow-hidden"
        >
          <span className="flex items-center justify-center gap-2 relative z-10 font-bold tracking-widest">
            {status === "loading" ? "SAVING YOUR ORDER..." : status === "success" ? (
              <><CheckCircle2 size={20} /> ORDER SAVED</>
            ) : (
              <><MessageCircle size={18} className="mr-1" /> ORDER NOW</>
            )}
          </span>
        </Button>
        <p className="text-center text-[11px] text-brand-ink-4 mt-3 font-medium px-4">
          Your order details will open in WhatsApp. Attach your payment screenshot in the chat.
        </p>
      </div>
    </form>
  );
}
