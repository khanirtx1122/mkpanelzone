import Link from "next/link";
import {
  BadgeCheck,
  Users,
  Layers,
  Wallet,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { RESELLER_PLANS } from "@/lib/pricing";
import { getWhatsAppNumber, whatsappLink } from "@/lib/settings";

export const metadata = {
  title: "MK Reseller Program | MK Panel Zone",
  description:
    "MK Panel Zone Reseller Program — apna reseller panel lein, customer IDs banayein aur apni sales manage karein.",
};

/* Plans come from the same catalogue the admin uses, so the public page and
   the reseller subscription records can never drift apart. */
export default async function ResellerPage() {
  const number = await getWhatsAppNumber();
  const joinHref = whatsappLink(
    number,
    "Hi MK Panel Zone, I want to join the Reseller Program. Please share the details.",
  );

  return (
    <div className="relative min-h-screen pt-24 sm:pt-28 pb-20">
      {/* Static atmosphere — no animation cost */}
      <div className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full bg-brand-neon-blue/5 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[420px] h-[420px] rounded-full bg-red-500/5 blur-[130px] pointer-events-none" />

      <div className="max-w-[980px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-[10px] font-extrabold uppercase tracking-[0.18em] mb-5">
            <BadgeCheck size={13} /> MK Reseller Program
          </span>
          <h1
            className="font-extrabold text-foreground tracking-tight leading-[1.12] mb-4"
            style={{ fontSize: "clamp(27px, 7vw, 46px)" }}
          >
            APNA RESELLER PANEL LEIN
          </h1>
          <p className="text-brand-ink-3 leading-relaxed max-w-2xl mx-auto" style={{ fontSize: "clamp(13px, 3.6vw, 15px)" }}>
            MK Panel Zone ke saath reseller banayein — apne customers ke liye IDs banayein, apni sales
            manage karein, aur poora system professionally use karein. Website ke product prices
            publicly kam karne ki zaroorat nahi.
          </p>
        </div>

        {/* How it works */}
        <GlassCard className="p-5 sm:p-7 mb-8">
          <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-brand-ink-3 mb-5">
            Kaise kaam karta hai
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                Icon: Wallet,
                title: "1. Plan choose karein",
                body: "Neeche diye gaye plans mein se apna subscription select karein aur payment bhejein.",
              },
              {
                Icon: Users,
                title: "2. Reseller access milega",
                body: "Payment confirm hone par aap ko apna reseller login milta hai jahan se aap customers banate hain.",
              },
              {
                Icon: Layers,
                title: "3. Customers banayein",
                body: "Har customer ke liye platform aur branch select karein, proof attach karein aur sale complete karein.",
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-2.5">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-blue-500/12 border border-brand-blue-500/25 text-brand-blue-400">
                  <Icon size={18} />
                </span>
                <span className="text-[13px] font-bold text-foreground">{title}</span>
                <span className="text-[12px] text-brand-ink-3 leading-relaxed">{body}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* What you get */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            { Icon: BadgeCheck, text: "Apna dedicated reseller access panel" },
            { Icon: Users, text: "Unlimited customer IDs apni sales ke liye" },
            { Icon: Layers, text: "Platform aur branch wise customer management" },
            { Icon: ShieldCheck, text: "Proof attach karke professional record rakhne ki sahulat" },
            { Icon: Clock, text: "Plan ke hisaab se clear remaining validity" },
            { Icon: Wallet, text: "Website prices public kam karne ki zaroorat nahi" },
          ].map(({ Icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-3 p-4 rounded-xl border"
              style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
            >
              <Icon size={16} className="text-brand-blue-400 mt-0.5 shrink-0" />
              <span className="text-[13px] text-brand-ink-2 leading-relaxed">{text}</span>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="mb-10">
          <h2 className="text-center text-[13px] font-extrabold uppercase tracking-[0.16em] text-brand-ink-3 mb-6">
            Subscription Plans
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {RESELLER_PLANS.map((plan) => {
              const isPermanent = plan.days === null;
              return (
                <div
                  key={plan.key}
                  className="relative p-4 sm:p-5 rounded-2xl border text-center overflow-hidden"
                  style={{
                    background: isPermanent
                      ? "linear-gradient(160deg, rgba(190,30,60,0.14), rgba(47,95,208,0.06))"
                      : "var(--surface-glass)",
                    borderColor: isPermanent ? "rgba(239,68,68,0.35)" : "var(--border-subtle)",
                  }}
                >
                  {isPermanent && (
                    <span className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-400 to-transparent" />
                  )}
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-ink-3 mb-2">
                    {plan.label}
                  </p>
                  <p className="font-extrabold text-foreground tracking-tight" style={{ fontSize: "clamp(20px, 5vw, 27px)" }}>
                    <span className="text-[12px] font-bold text-brand-ink-3 mr-1">PKR</span>
                    {plan.price.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-[11px] text-brand-ink-3">
                    {isPermanent ? "No expiry" : `${plan.days} days access`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          {joinHref && (
            <a
              href={joinHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 min-h-[54px] rounded-2xl font-extrabold tracking-[0.08em] uppercase text-[13px] text-white active:scale-[0.985] transition-transform w-full sm:w-auto"
              style={{
                background: "linear-gradient(135deg, #128C4A, #25D366)",
                boxShadow: "0 14px 32px -14px rgba(37,211,102,0.9)",
              }}
            >
              <MessageCircle size={18} />
              Join Now
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
          )}
          <p className="text-[12px] text-brand-ink-3">
            Already a reseller?{" "}
            <Link href="/mkpanelzoneagents" className="font-bold text-brand-blue-400 hover:text-brand-blue-300 transition-colors">
              Reseller Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
