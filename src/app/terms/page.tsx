import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 min-h-[80vh] flex flex-col justify-center">
      <div className="mb-12">
        <Button variant="ghost" asChild className="text-brand-ink-3 hover:text-foreground -ml-4 font-bold tracking-wide">
          <Link href="/"><ArrowLeft size={16} className="mr-2" /> BACK TO HOME</Link>
        </Button>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight uppercase">Terms of Service</h1>
      
      <GlassCard className="prose prose-invert prose-brand max-w-none border-border-subtle bg-surface-glass">
        <p className="text-brand-ink-4 mb-6 text-[13px] font-bold tracking-widest uppercase">Last Updated: {new Date().toLocaleDateString()}</p>
        <p className="text-brand-ink-2 leading-relaxed mb-8 text-[15px]">
          By accessing or using MK Panel Zone products, you agree to be bound by these Terms of Service.
        </p>

        <h2 className="text-xl font-extrabold text-foreground mb-4 mt-10 tracking-tight">1. License & Usage</h2>
        <p className="text-brand-ink-2 leading-relaxed mb-8 text-[15px]">
          Your purchase grants you a single-user license, cryptographically bound to one device. 
          Sharing, reverse engineering, distributing, or attempting to bypass our security measures 
          will result in an immediate, permanent ban without refund.
        </p>

        <h2 className="text-xl font-extrabold text-foreground mb-4 mt-10 tracking-tight">2. Refunds Policy</h2>
        <p className="text-brand-ink-2 leading-relaxed mb-8 text-[15px]">
          Due to the digital nature of our products and immediate access upon verification, 
          all sales are final. We do not offer refunds once a product has been delivered.
        </p>

        <h2 className="text-xl font-extrabold text-foreground mb-4 mt-10 tracking-tight">3. Modifications</h2>
        <p className="text-brand-ink-2 leading-relaxed mb-8 text-[15px]">
          We reserve the right to modify or discontinue, temporarily or permanently, our services 
          with or without notice. We are not liable to you or any third party for any modification 
          or discontinuance of the service.
        </p>
      </GlassCard>
    </div>
  );
}
