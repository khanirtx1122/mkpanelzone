import Link from "next/link";
import { Wrench, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { getWhatsAppNumber, whatsappLink, getSettings } from "@/lib/settings";

export const metadata = {
  title: "Under Maintenance | MK Panel Zone",
  robots: { index: false, follow: false },
};

/**
 * PUBLIC MAINTENANCE SCREEN.
 *
 * Rendered when the Owner switches Admin → Settings → Maintenance Mode on.
 * Deliberately a proper page (not a 404/500) so visitors see a premium,
 * intentional state with a way to reach support.
 */
export default async function MaintenancePage() {
  const [number, settings] = await Promise.all([
    getWhatsAppNumber(),
    getSettings(["site_name"]),
  ]);
  const support = whatsappLink(number, "Hi MK Panel Zone, I saw the maintenance notice.");
  const siteName = settings.site_name?.trim() || "MK Panel Zone";

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20 relative overflow-hidden">
      {/* Static, cheap atmosphere — no animation cost while we're the only page */}
      <div className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full bg-brand-neon-blue/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] rounded-full bg-red-500/5 blur-[130px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg text-center">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-extrabold uppercase tracking-[0.18em] mb-6">
          <Wrench size={13} /> Scheduled Maintenance
        </span>

        <h1
          className="font-extrabold text-foreground tracking-tight leading-[1.15] mb-4"
          style={{ fontSize: "clamp(26px, 7vw, 42px)" }}
        >
          WEBSITE UNDER
          <br />
          MAINTENANCE
        </h1>

        <p className="text-brand-ink-3 leading-relaxed mb-8 max-w-md mx-auto" style={{ fontSize: "clamp(13px, 3.6vw, 15px)" }}>
          {siteName} is being updated right now. Everything will be back shortly —
          please come back in a little while.
        </p>

        <div
          className="rounded-2xl border p-5 mb-7 text-left space-y-3.5"
          style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
        >
          {[
            { Icon: Clock, text: "Maintenance is usually short — try refreshing in a few minutes." },
            { Icon: ShieldCheck, text: "Existing customer accounts and purchases are completely safe." },
            { Icon: MessageCircle, text: "Need something urgent? Message us on WhatsApp." },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex gap-3 items-start">
              <Icon size={15} className="text-brand-blue-400 mt-0.5 shrink-0" />
              <p className="text-[13px] text-brand-ink-2 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {support && (
            <a
              href={support}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 px-6 py-3.5 min-h-[50px] rounded-xl font-bold tracking-wider uppercase text-[12px] text-white active:scale-[0.985] transition-transform"
              style={{
                background: "linear-gradient(135deg, #128C4A, #25D366)",
                boxShadow: "0 10px 26px -12px rgba(37,211,102,0.85)",
              }}
            >
              <MessageCircle size={16} /> Contact Support
            </a>
          )}
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3.5 min-h-[50px] rounded-xl font-bold tracking-wider uppercase text-[12px] text-brand-ink-2 hover:text-foreground transition-colors border"
            style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}
