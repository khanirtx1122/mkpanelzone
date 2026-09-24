import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";
import Link from "next/link";
import { ChevronRight, PackageX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let dbAvailable = true;

  try {
    products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[products] fetch failed:", error);
    dbAvailable = false;
  }

  return (
    <div className="relative min-h-screen pb-24 pt-[104px] sm:pt-[124px]">
      {/* Background depth — restrained, two lights only */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(60% 60% at 78% 0%, var(--ambient-strong) 0%, transparent 66%), radial-gradient(45% 45% at 8% 22%, var(--ambient-strong) 0%, transparent 66%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-grid opacity-50"
        style={{
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.8), transparent)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.8), transparent)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.11em] text-brand-ink-3"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight size={12} className="opacity-50" aria-hidden />
          <span className="text-brand-ink-2">Products</span>
        </nav>

        {/* Header — asymmetric: statement left, live count right */}
        <div className="mb-12 flex flex-col gap-7 sm:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3.5">Catalogue</p>
            <h1
              className="font-extrabold tracking-[-0.035em] text-foreground"
              style={{ fontSize: "clamp(34px, 7vw, 58px)", lineHeight: 1 }}
            >
              Products
            </h1>
            <p className="mt-5 text-[14.5px] leading-relaxed text-brand-ink-3 sm:text-[15.5px]">
              Premium tools, guided setup and panel access. Every purchase is
              issued for a single device and released only after your payment is
              verified by a person.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-[14px] border border-border-subtle bg-surface-raised px-5 py-3.5">
              <p className="tabular text-[24px] font-extrabold leading-none tracking-[-0.03em] text-foreground">
                {dbAvailable ? products.length : "—"}
              </p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-3">
                Available now
              </p>
            </div>
          </div>
        </div>

        {!dbAvailable || products.length === 0 ? (
          <EmptyState
            icon={PackageX}
            title="The catalogue is temporarily unavailable"
            description="We could not reach our product database just now. This is usually brief — please try again shortly, or contact support if it persists."
            action={
              <Link
                href="/support"
                className="inline-flex h-[46px] items-center gap-2 rounded-[12px] border border-border-subtle bg-foreground/[0.03] px-5 text-[12.5px] font-bold uppercase tracking-[0.07em] text-foreground transition-colors hover:border-border-strong"
              >
                Contact support
              </Link>
            }
          />
        ) : (
          <ProductsClient initialProducts={products} />
        )}
      </div>
    </div>
  );
}
