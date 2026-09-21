import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 min-h-[80vh] flex flex-col justify-center">
      <div className="mb-12">
        <Button variant="ghost" asChild className="text-brand-ink-3 hover:text-foreground -ml-4 font-bold tracking-wide">
          <Link href="/"><ArrowLeft size={16} className="mr-2" /> BACK TO HOME</Link>
        </Button>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight uppercase">Privacy Policy</h1>
      
      <GlassCard className="prose prose-invert prose-brand max-w-none border-border-subtle bg-background/40">
        <p className="text-brand-ink-4 mb-6 text-[13px] font-bold tracking-widest uppercase">Last Updated: {new Date().toLocaleDateString()}</p>
        <p className="text-brand-ink-2 leading-relaxed mb-8 text-[15px]">
          At MK Panel Zone, we take your privacy and operational security extremely seriously. 
          This Privacy Policy describes how your personal information is collected, used, and protected.
        </p>

        <h2 className="text-xl font-extrabold text-foreground mb-4 mt-10 tracking-tight">1. Information We Collect</h2>
        <p className="text-brand-ink-2 leading-relaxed mb-8 text-[15px]">
          We collect minimal information required for service delivery. This includes your Discord ID (if provided), 
          email address for communication, and cryptographically hashed device identifiers to bind your access securely.
        </p>

        <h2 className="text-xl font-extrabold text-foreground mb-4 mt-10 tracking-tight">2. Device Binding & Security</h2>
        <p className="text-brand-ink-2 leading-relaxed mb-8 text-[15px]">
          To protect our software and ensure exclusivity, we use device fingerprinting. This data is irreversibly hashed 
          and cannot be used to identify your specific hardware configuration outside of our authentication flow.
        </p>

        <h2 className="text-xl font-extrabold text-foreground mb-4 mt-10 tracking-tight">3. Data Retention</h2>
        <p className="text-brand-ink-2 leading-relaxed mb-8 text-[15px]">
          We retain your order details and device hashes only as long as you maintain an active license with us. 
          We do not share, sell, or distribute your data to any third parties.
        </p>
      </GlassCard>
    </div>
  );
}
