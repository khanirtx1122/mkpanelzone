import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { CheckCircle, Clock, KeyRound, Mail, MessageCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { SuccessAutoRedirect } from "./SuccessAutoRedirect";
import { getWhatsAppNumber, whatsappLink } from "@/lib/settings";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * ORDER RECEIVED / THANK YOU.
 *
 * The account already exists at this point (created UNPAID during checkout),
 * so this page tells the buyer exactly where things stand: order received,
 * account created, payment pending, and how to reach support. The WhatsApp CTA
 * uses the admin-configured primary number.
 */
export default async function OrderSuccessPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const orderNumber = (resolvedParams.number as string) || "";
  const accountUsername = (resolvedParams.u as string) || "";
  const platform = (resolvedParams.p as string) || "";

  const number = await getWhatsAppNumber();
  const whatsappHref = whatsappLink(
    number,
    orderNumber
      ? `Hi MK Panel Zone, I just placed order ${orderNumber}. Please verify my payment.`
      : "Hi MK Panel Zone, I just placed an order and need help.",
  );

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-6 py-16 sm:py-24 min-h-[80vh] flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 shadow-[0_0_30px_rgba(74,222,128,0.25)] mb-7">
        <CheckCircle size={40} />
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight">
        ORDER RECEIVED
      </h1>
      <p className="text-[15px] sm:text-base text-brand-ink-3 mb-6 leading-relaxed max-w-md">
        Thank you — your order is in. Your account has been created and is waiting for payment
        verification.
      </p>

      <SuccessAutoRedirect />

      <div className="w-full max-w-sm space-y-3 mb-7">
        {orderNumber && (
          <div className="p-5 bg-background/40 border border-border-subtle rounded-xl">
            <span className="text-[11px] text-brand-ink-4 font-bold uppercase tracking-widest block mb-1.5">
              Order Number
            </span>
            <span className="text-2xl font-mono font-extrabold text-foreground tracking-widest break-all">
              {orderNumber}
            </span>
          </div>
        )}

        {accountUsername && (
          <div className="p-5 bg-background/40 border border-border-subtle rounded-xl text-left space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-brand-ink-4 font-bold uppercase tracking-widest">Your Login</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-400 border border-amber-500/25">
                Pending
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <KeyRound size={14} className="text-brand-blue-400 shrink-0" />
              <span className="font-mono font-bold text-foreground break-all">{accountUsername}</span>
            </div>
            {platform && (
              <p className="text-[12px] text-brand-ink-3">
                Platform: <span className="font-bold text-foreground">{platform}</span>
              </p>
            )}
            <p className="text-[11px] text-brand-ink-3 leading-relaxed">
              Use the password you chose at checkout to sign in.
            </p>
          </div>
        )}
      </div>

      <GlassCard className="w-full text-left p-5 sm:p-6 space-y-3.5 mb-7">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
          What happens next
        </h2>
        {[
          { Icon: Clock, text: "We verify your payment screenshot — this usually takes a short while." },
          { Icon: Mail, text: "You may be contacted on your email or WhatsApp if anything needs confirming." },
          { Icon: ShieldCheck, text: "Once approved, your account becomes PAID and your resources unlock automatically." },
          { Icon: KeyRound, text: "Then sign in from Customer Access using your chosen User ID and password." },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex gap-3 items-start">
            <Icon size={15} className="text-brand-blue-400 mt-0.5 shrink-0" />
            <p className="text-[13px] text-brand-ink-2 leading-relaxed">{text}</p>
          </div>
        ))}
      </GlassCard>

      {whatsappHref && (
        <div className="w-full space-y-3">
          <p className="text-[13px] text-brand-ink-3">
            To make the process quicker, contact us on WhatsApp with your Order Number.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-full items-center justify-center gap-2.5 px-6 py-3.5 min-h-[52px] rounded-xl font-bold tracking-wider uppercase text-[13px] text-white active:scale-[0.985] transition-transform"
            style={{
              background: "linear-gradient(135deg, #128C4A, #25D366)",
              boxShadow: "0 10px 26px -12px rgba(37,211,102,0.85)",
            }}
          >
            <MessageCircle size={17} />
            Contact us on WhatsApp
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      )}

      <div className="mt-7 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/access"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl text-[12px] font-bold uppercase tracking-wider text-foreground border transition-colors"
          style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
        >
          Go to Customer Access
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-3 min-h-[46px] rounded-xl text-[12px] font-bold uppercase tracking-wider text-brand-ink-3 hover:text-foreground transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
