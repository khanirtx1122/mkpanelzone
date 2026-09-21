import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { SuccessAutoRedirect } from "./SuccessAutoRedirect";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const orderNumber = resolvedParams.number as string;

  return (
    <div className="max-w-2xl mx-auto px-6 py-32 min-h-[80vh] flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-brand-blue-500/10 border border-brand-blue-500/30 rounded-full flex items-center justify-center text-brand-blue-500 shadow-[0_0_30px_rgba(47,95,208,0.3)] mb-8">
        <CheckCircle size={40} />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">ORDER RECEIVED!</h1>
      <p className="text-xl text-brand-ink-3 mb-2 leading-relaxed">
        Thank you for your purchase. We are processing your request.
      </p>

      <SuccessAutoRedirect />
      
      {orderNumber && (
        <div className="mt-4 mb-8 p-6 bg-background/40 border border-border-subtle rounded-xl shadow-inner inline-block min-w-[300px]">
          <span className="text-[11px] text-brand-ink-4 font-bold uppercase tracking-widest block mb-2">Order Number</span>
          <span className="text-3xl font-mono font-extrabold text-foreground tracking-widest">{orderNumber}</span>
        </div>
      )}

      <p className="text-[14px] text-brand-ink-4 max-w-md mx-auto mb-10 leading-relaxed font-medium">
        Your order is being reviewed by our team. You will be contacted shortly via WhatsApp for the final setup.
      </p>

      <Button variant="outline" asChild>
        <Link href="/">RETURN TO HOME</Link>
      </Button>
    </div>
  );
}
