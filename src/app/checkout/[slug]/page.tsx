import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CheckoutForm } from "./CheckoutForm";
import { productContent } from "@/lib/productContent";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug, active: true },
  });

  if (!product) notFound();

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  const cover = product.coverImageUrl || productContent[product.slug]?.image || null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 min-h-screen">
      <Link
        href={`/products/${product.slug}`}
        className="text-brand-blue-500 hover:text-blue-400 text-sm mb-8 inline-flex items-center gap-1.5 transition-colors font-bold tracking-wide"
      >
        <ArrowLeft size={14} /> BACK TO PRODUCT
      </Link>

      <div className="text-center mb-10 sm:mb-14">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
          COMPLETE YOUR ORDER
        </h1>
        <p className="text-brand-ink-3 text-[15px] sm:text-[17px] max-w-xl mx-auto">
          You are purchasing{" "}
          <strong className="text-foreground">{product.name}</strong> for{" "}
          <strong className="text-foreground tabular-nums">PKR {product.price.toFixed(2)}</strong>
        </p>
      </div>

      {/* Compact order summary */}
      <GlassCard className="mb-8 p-4 sm:p-5 flex items-center gap-4 max-w-2xl mx-auto">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.name}
            className="w-16 h-16 rounded-xl object-cover border border-border-subtle shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-widest uppercase text-brand-blue-500 mb-1">
            Your Order
          </p>
          <p className="text-[15px] sm:text-base font-extrabold text-foreground tracking-tight truncate">
            {product.name}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] font-bold tracking-widest uppercase text-brand-ink-3 mb-1">Total</p>
          <p className="text-base sm:text-lg font-extrabold text-foreground tabular-nums">
            PKR {product.price.toFixed(0)}
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: payment methods */}
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-blue-500/15 border border-brand-blue-500/30 text-brand-blue-400 text-xs flex items-center justify-center font-bold">1</span>
            Send Payment
          </h2>

          {paymentMethods.length === 0 ? (
            <GlassCard className="p-6 border-amber-500/30">
              <p className="text-sm text-amber-400 font-medium leading-relaxed">
                No payment methods are available right now. Please contact support before ordering.
              </p>
            </GlassCard>
          ) : (
            <p className="text-sm text-brand-ink-3 mb-4 leading-relaxed">
              Send exactly{" "}
              <strong className="text-foreground tabular-nums">PKR {product.price.toFixed(2)}</strong>{" "}
              using any method below, then select it on the right and upload your screenshot.
            </p>
          )}

          <div className="space-y-4">
            {paymentMethods.map((pm) => (
              <GlassCard key={pm.id} className="p-4 sm:p-5">
                <h4 className="font-bold text-foreground tracking-wide mb-2 flex items-center justify-between gap-3">
                  {pm.name}
                  <span className="text-[10px] font-bold tracking-widest uppercase text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 shrink-0">
                    Active
                  </span>
                </h4>
                <p className="text-sm text-brand-blue-400 font-mono p-2.5 bg-background/60 rounded-md select-all border border-border-subtle break-all">
                  {pm.accountDetails}
                </p>
              </GlassCard>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-2.5 text-xs text-brand-ink-3 leading-relaxed">
            <ShieldCheck size={16} className="text-brand-blue-500 shrink-0 mt-0.5" />
            <span>
              Never share your password. Our team only ever asks for your Order ID and payment screenshot.
            </span>
          </div>
        </div>

        {/* Right: proof submission */}
        <div className="lg:sticky lg:top-24">
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-blue-500/15 border border-brand-blue-500/30 text-brand-blue-400 text-xs flex items-center justify-center font-bold">2</span>
            Confirm Payment
          </h2>
          <GlassCard className="border-brand-blue-500/30 shadow-[0_0_30px_rgba(47,95,208,0.15)] bg-surface-glass">
            <CheckoutForm
              productId={product.id}
              planPrice={product.price}
              paymentMethods={paymentMethods.map((pm) => ({ id: pm.id, name: pm.name }))}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
