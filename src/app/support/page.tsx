import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 min-h-[80vh] flex flex-col justify-center">
      <div className="mb-12">
        <Button variant="ghost" asChild className="text-brand-ink-3 hover:text-foreground -ml-4 font-bold tracking-wide">
          <Link href="/"><ArrowLeft size={16} className="mr-2" /> BACK TO HOME</Link>
        </Button>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">SUPPORT CENTER</h1>
      <p className="text-lg text-brand-ink-3 mb-12 leading-relaxed">
        Need assistance with your package or access? Our elite support team is ready.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="flex flex-col items-start gap-4 hover:-translate-y-1 transition-all duration-obsidian group border-border-subtle hover:border-[#5865F2]/30">
          <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2] border border-[#5865F2]/30 group-hover:scale-110 transition-transform duration-obsidian">
            <MessageCircle size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Discord Support</h2>
          <p className="text-brand-ink-3 text-[15px] leading-relaxed">
            Join our private Discord server. Create a ticket in the #support channel with your order number.
          </p>
          <Button variant="outline" className="w-full mt-4 bg-[#5865F2]/10 border-[#5865F2]/30 text-foreground hover:bg-[#5865F2]/20">
            Join Discord Server
          </Button>
        </GlassCard>

        <GlassCard className="flex flex-col items-start gap-4 hover:-translate-y-1 transition-all duration-obsidian group border-border-subtle hover:border-brand-blue-500/30">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue-500/10 flex items-center justify-center text-brand-blue-500 border border-brand-blue-500/30 group-hover:scale-110 transition-transform duration-obsidian">
            <MessageCircle size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Email Support</h2>
          <p className="text-brand-ink-3 text-[15px] leading-relaxed">
            Email us directly. Please allow up to 24 hours for a response from our technical team.
          </p>
          <Button variant="outline" className="w-full mt-4 hover:bg-brand-blue-500 hover:text-foreground hover:border-brand-blue-500 transition-colors">
            support@mkpanel.zone
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
