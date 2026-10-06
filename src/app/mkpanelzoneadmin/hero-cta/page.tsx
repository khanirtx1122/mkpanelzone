import { getStoredHeroCtas, HERO_CTAS_KEY } from "@/lib/social";
import { Sparkles, Link2 } from "lucide-react";
import Link from "next/link";
import { HeroCtaManager } from "./HeroCtaManager";
import type { HeroCtaInput } from "../actions";

export const metadata = {
  title: "Hero CTA | Owner Panel",
};

/**
 * HERO SOCIAL CTA MANAGER.
 *
 * A dedicated, obvious home for the rotating chip above the hero headline.
 * Previously this was only reachable through the Footer page, which made the
 * hero's behaviour feel undocumented — the Owner had no clear place to control
 * it. Entries saved here are independent of the footer links and take priority.
 */
export default async function HeroCtaPage() {
  const stored = await getStoredHeroCtas();
  const initial: HeroCtaInput[] = stored.map((c) => ({
    platform: c.platform,
    label: c.label,
    url: c.url,
    enabled: c.enabled,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans flex items-center gap-2">
          <Sparkles size={20} className="text-brand-blue-400" /> Hero Social CTA
        </h1>
        <p className="text-sm text-brand-ink-3 mt-1 font-mono">
          The compact rotating chip above the hero headline. One platform shows at a time, every 4.5 seconds.
        </p>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl p-5 sm:p-6 shadow-2xl">
        <HeroCtaManager initial={initial} />
      </div>

      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-[12px] text-brand-ink-3 leading-relaxed space-y-1.5">
        <p className="font-bold text-white flex items-center gap-1.5">
          <Link2 size={13} /> How this relates to Footer social links
        </p>
        <p>
          Entries saved here <span className="text-white font-bold">take priority</span> for the hero chip.
          If you leave this page empty, the hero falls back to your{" "}
          <Link href="/mkpanelzoneadmin/footer" className="text-brand-blue-400 hover:text-brand-blue-300 font-bold">
            Footer social links
          </Link>
          , and then to the primary WhatsApp number.
        </p>
        <p className="font-mono text-[11px]">
          Stored under SiteSetting key <code className="text-brand-blue-400">{HERO_CTAS_KEY}</code>.
        </p>
      </div>
    </div>
  );
}
