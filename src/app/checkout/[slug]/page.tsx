import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckoutForm } from "./CheckoutForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug, active: true },
  });

  if (!product) notFound();

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { active: true }
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
      <Link href={`/products/${product.slug}`} className="text-brand-blue-500 hover:text-blue-400 text-sm mb-8 inline-block transition-colors font-bold tracking-wide">
        &larr; BACK TO PRODUCT
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">COMPLETE YOUR ORDER</h1>
        <p className="text-brand-ink-3 text-[17px]">
          You are purchasing <strong className="text-foreground">{product.name}</strong> for <strong className="text-foreground">PKR {product.price.toFixed(2)}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground mb-4">1. Send Payment</h2>
          <GlassCard className="mb-8 border-border-subtle shadow-[0_0_15px_rgba(255,255,255,0.02)]">
            <p className="text-sm text-brand-ink-3 mb-4 leading-relaxed">
              Please send exactly <strong className="text-foreground">PKR {product.price.toFixed(2)}</strong> using one of the methods below. Take a screenshot of the confirmed transaction.
            </p>
            <div className="space-y-4">
              {paymentMethods.map(pm => (
                <div key={pm.id} className="p-4 rounded-xl bg-surface-glass border border-border-subtle shadow-inner">
                  <h4 className="font-bold text-foreground tracking-wide">{pm.name}</h4>
                  <p className="text-sm text-brand-blue-500 font-mono mt-2 p-2 bg-surface rounded-md select-all border border-border-subtle">{pm.accountDetails}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground mb-4">2. Submit Proof</h2>
          <GlassCard className="border-brand-blue-500/30 shadow-[0_0_30px_rgba(47,95,208,0.15)] bg-surface-glass backdrop-blur-xl">
            <CheckoutForm productId={product.id} planPrice={product.price} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
