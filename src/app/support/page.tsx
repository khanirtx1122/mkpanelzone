import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSettings, getWhatsAppNumber, whatsappLink } from "@/lib/settings";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Clock, ShieldCheck, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const [number, settings] = await Promise.all([
    getWhatsAppNumber(),
    getSettings(["support_whatsapp_label", "support_whatsapp_message", "support_faq_text"]),
  ]);

  const label = settings.support_whatsapp_label?.trim() || "Chat on WhatsApp";
  const prefill = settings.support_whatsapp_message?.trim() || "";
  const href = whatsappLink(number, prefill);
  const faq = (settings.support_faq_text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 sm:py-24 min-h-[80vh] flex flex-col justify-center">
      <div className="mb-10">
        <Button variant="ghost" asChild className="text-brand-ink-3 hover:text-foreground -ml-4 font-bold tracking-wide">
          <Link href="/"><ArrowLeft size={16} className="mr-2" /> BACK TO HOME</Link>
        </Button>
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-5 tracking-tight">SUPPORT CENTER</h1>
      <p className="text-lg text-brand-ink-3 mb-10 leading-relaxed">
        All support runs through WhatsApp — payments, access issues, resets and setup help.
      </p>

      <GlassCard className="p-8 border-green-500/25 relative overflow-hidden">
        {/* Soft WhatsApp-green atmosphere, static (no animation cost) */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37,211,102,0.14), transparent 70%)" }}
          aria-hidden
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
            <MessageCircle size={30} />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
              WhatsApp Support
            </h2>
            <p className="text-brand-ink-3 text-[15px] leading-relaxed">
              {href
                ? "Message us directly. Include your order ID and a short description of the issue for the fastest response."
                : "Support is being set up. Please check back shortly."}
            </p>
          </div>
        </div>

        <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            asChild={!!href}
            variant="primary"
            size="lg"
            disabled={!href}
            className={`flex-1 ${href ? "bg-[#25D366] hover:bg-[#1FB855] text-[#04240F] shadow-[0_4px_20px_rgba(37,211,102,0.25)]" : "opacity-50"}`}
          >
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} className="mr-2" /> {label.toUpperCase()}
              </a>
            ) : (
              <span><MessageCircle size={18} className="mr-2" /> SUPPORT UNAVAILABLE</span>
            )}
          </Button>
        </div>

        {href && (
          <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-brand-ink-3 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#25D366]" /> Typical reply within 24 hours
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#25D366]" /> Verified payment confirmation
            </span>
          </div>
        )}
      </GlassCard>

      {faq.length > 0 && (
        <div className="mt-10">
          <h3 className="text-[13px] font-bold tracking-[0.18em] text-brand-ink-3 uppercase mb-4">
            Before You Message
          </h3>
          <ul className="space-y-3">
            {faq.map((line, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] text-brand-ink-2 leading-relaxed">
                <ChevronRight size={16} className="text-brand-blue-500 shrink-0 mt-1" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
