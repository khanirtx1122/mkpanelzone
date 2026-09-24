import { Hero } from "@/components/home/Hero";
import { MainProductsSection } from "@/components/home/MainProductsSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { CinematicIntro } from "@/components/ui/CinematicIntro";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TechLabel, TechStat } from "@/components/ui/Tech";
import Link from "next/link";
import {
  Shield,
  Zap,
  ArrowRight,
  Lock,
  Smartphone,
  Monitor,
  FileCheck2,
  Headset,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  /* Resilient fetch — if the database is unreachable the homepage still
     renders a complete, designed experience rather than a 500 (spec §41). */
  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let dbAvailable = true;
  try {
    products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  } catch (error) {
    console.error("[home] product fetch failed:", error);
    dbAvailable = false;
  }

  const featuredProducts = products.slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CinematicIntro />

      {/* 1 ── Hero: cinematic environment + opening composition */}
      <Hero products={products} />

      {/* 2 ── Featured: editorial hierarchy */}
      {featuredProducts.length > 0 && (
        <FeaturedProductsSection products={featuredProducts} />
      )}

      {/* 3 ── Ecosystem: the full catalogue, grouped */}
      {products.length > 0 && <MainProductsSection products={products} />}

      {/* 4 ── Platform facts — real, verifiable values only.
             No invented member counts or fake engagement metrics (§3).
             Presented as a numbered ledger in the reference idiom: mono index,
             large tabular figure, mono label. No icons — the numbers carry it. */}
      <section className="relative border-y border-border-subtle bg-surface/50">
        <div className="pointer-events-none absolute inset-0 ambient-blue opacity-50" aria-hidden />
        <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4 pt-14 sm:pt-16">
            <TechLabel tone="bright" size="sm">
              facts
            </TechLabel>
            <span className="h-px flex-1 bg-[color:var(--line-color)]" />
            <TechLabel tone="dim" size="sm">
              verifiable
            </TechLabel>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 pb-14 sm:grid-cols-4 sm:pb-16">
            {[
              {
                value: dbAvailable ? String(products.length).padStart(2, "0") : "—",
                label: "Live products",
              },
              { value: "03", label: "Platforms covered" },
              { value: "1–12h", label: "Verification window" },
              { value: "24/7", label: "Support channels open" },
            ].map(({ value, label }, i) => (
              <ScrollReveal key={label} delay={i * 70}>
                <TechStat label={label} value={value} index={i + 1} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 ── Why MK Panel Zone — dense, with real reasoning */}
      <section className="relative py-16 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="relative mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          <ScrollReveal>
            <SectionHeading
              eyebrow="Why MK Panel Zone"
              title="Built to be trusted, not just delivered"
              description="Every order is reviewed by a person, every account is locked to the platform it was bought for, and every setup step is documented."
              align="center"
              className="mx-auto"
            />
          </ScrollReveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {[
              {
                Icon: Shield,
                /*
                  This card previously read "Device-bound access" with the body
                  "Each package is cryptographically tied to the first supported
                  device that signs in. Sharing an account fails at the server,
                  not in the browser." None of that was true: a device token is
                  minted on first sign-in but never verified on later logins, so
                  nothing fails at the server. Platform locking, by contrast, is
                  genuinely enforced by `customerLogin` and by the dashboard's
                  platform-scoped resource query — so the card now describes that.
                */
                title: "Platform-locked access",
                body: "Each account is issued for the platform it was bought for. Signing in from a different platform is rejected server-side, and your dashboard only ever serves resources for that platform.",
              },
              {
                Icon: FileCheck2,
                title: "Manual verification",
                body: "Payment proof is reviewed by a person before access is issued. No automated clearing, no silent failures, no surprises.",
              },
              {
                Icon: Zap,
                title: "Immediate fulfilment",
                body: "Once your proof clears you are issued credentials straight into your dashboard, together with the files and guides you need.",
              },
              {
                Icon: Smartphone,
                title: "Per-platform resources",
                body: "Android, iPhone and PC each get their own vault. You only ever see the files that belong to your platform.",
              },
              {
                Icon: Lock,
                title: "Secrets stay masked",
                body: "File passwords are masked by default with explicit reveal and copy controls, so a shoulder-surf never exposes them.",
              },
              {
                Icon: Headset,
                title: "Support that answers",
                body: "Priority channels for setup and troubleshooting, with a documented process instead of guesswork.",
              },
            ].map(({ Icon, title, body }, i) => (
              <ScrollReveal key={title} delay={i * 60}>
                <article className="group relative h-full overflow-hidden rounded-[18px] mat-4 p-6">
                  <span
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-[42px] transition-opacity duration-500"
                    style={{
                      background: "var(--ambient-strong)",
                      opacity: 0.55,
                    }}
                    aria-hidden
                  />
                  <span
                    className="relative mb-5 flex h-11 w-11 items-center justify-center rounded-[13px] border"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--ambient-strong)",
                    }}
                    aria-hidden
                  >
                    <Icon
                      size={19}
                      style={{
                        color: "var(--text-2)",
                      }}
                    />
                  </span>

                  <h3 className="text-[15.5px] font-bold tracking-[-0.012em] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-brand-ink-3">
                    {body}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6 ── Customer access — vault-inspired transition (§57) */}
      <section className="relative overflow-hidden border-y border-border-subtle py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(70% 100% at 50% 0%, var(--ambient-strong) 0%, transparent 62%), linear-gradient(180deg, var(--surface) 0%, var(--background) 100%)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-50" aria-hidden />

        <div className="relative mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal from="left">
              <div>
                <StatusBadge tone="info" size="sm" icon={Lock}>
                  Secure Portal
                </StatusBadge>

                <h2
                  className="mt-5 font-extrabold tracking-[-0.028em] text-foreground"
                  style={{ fontSize: "clamp(28px, 5.4vw, 46px)", lineHeight: 1.06 }}
                >
                  Your resources,
                  <br />
                  behind one door.
                </h2>

                <p className="mt-5 max-w-[52ch] text-[14.5px] leading-relaxed text-brand-ink-3">
                  Choose your platform, sign in with the credentials issued after
                  verification, and everything you paid for is waiting — the main
                  package, its password, the utilities and the walkthroughs.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/access"
                    className="group relative inline-flex h-[52px] items-center justify-center gap-2.5 overflow-hidden rounded-[13px] border border-white/[0.14] px-6 text-[13px] font-bold uppercase tracking-[0.07em] text-white transition-transform duration-100 active:scale-[0.978]"
                    style={{
                      background: "linear-gradient(168deg,#3478E8 0%,#2457C5 58%,#1C3D91 100%)",
                      boxShadow: "0 1px 2px rgba(0,0,0,.4), 0 8px 24px var(--ambient-strong)",
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-px bg-white/[0.16]" aria-hidden />
                    <Lock size={15} aria-hidden />
                    Customer Access
                  </Link>
                  <Link
                    href="/support"
                    className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-[13px] border border-border-subtle bg-foreground/[0.025] px-6 text-[13px] font-bold uppercase tracking-[0.07em] text-foreground transition-colors hover:border-border-strong hover:bg-foreground/[0.05]"
                  >
                    Need help?
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Vault preview — the three platform doors */}
            <ScrollReveal from="right" delay={100}>
              <div className="relative">
                <div
                  className="pointer-events-none absolute -inset-6 rounded-[32px] blur-[60px]"
                  style={{ background: "radial-gradient(circle, var(--ambient-strong), transparent 70%)" }}
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-[22px] mat-6 p-5 sm:p-7">
                  <p className="eyebrow mb-5">Platform selection</p>

                  <div className="space-y-3">
                    {[
                      { Icon: Smartphone, label: "Android", note: "Panel · MT Manager · Shizuku" },
                      { Icon: Smartphone, label: "iPhone", note: "Package · Setup guide" },
                      { Icon: Monitor, label: "PC", note: "Desktop package resources" },
                    ].map(({ Icon, label, note }) => (
                      <div
                        key={label}
                        className="flex items-center gap-4 rounded-[14px] border border-border-subtle bg-foreground/[0.02] p-4 transition-colors hover:border-border-strong hover:bg-foreground/[0.04]"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border"
                          style={{
                            borderColor: "var(--border-subtle)",
                          }}
                          aria-hidden
                        >
                          <Icon
                            size={17}
                            style={{
                              color: "var(--text-2)",
                            }}
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-bold text-foreground">{label}</p>
                          <p className="mt-0.5 truncate text-[11.5px] text-brand-ink-4">{note}</p>
                        </div>
                        <ArrowRight size={14} className="ml-auto shrink-0 text-brand-ink-4" aria-hidden />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-2.5 border-t border-border-subtle pt-5">
                    <Shield size={13} className="shrink-0 text-[color:var(--status-success-text)]" aria-hidden />
                    <p className="text-[11.5px] leading-relaxed text-brand-ink-3">
                      Platform access is enforced on the server — you can never
                      reach another platform&apos;s resources.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 7 ── Closing CTA — dramatic, quiet, and the last thing seen */}
      <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(55% 80% at 50% 100%, var(--ambient-strong) 0%, transparent 68%), radial-gradient(55% 80% at 50% 0%, var(--ambient-strong) 0%, transparent 68%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-[720px] px-4 text-center sm:px-6">
          <ScrollReveal>
            <p className="eyebrow">Ready when you are</p>
            <h2
              className="mt-5 font-extrabold tracking-[-0.03em] text-foreground"
              style={{ fontSize: "clamp(30px, 6vw, 52px)", lineHeight: 1.05 }}
            >
              Get set up properly,
              <br />
              the first time.
            </h2>
            <p className="mx-auto mt-5 max-w-[46ch] text-[14.5px] leading-relaxed text-brand-ink-3">
              Browse the catalogue, complete checkout with your payment proof, and
              we&apos;ll have your access ready once it&apos;s verified.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="group relative inline-flex h-[54px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-[13px] border border-white/[0.14] px-8 text-[13.5px] font-bold uppercase tracking-[0.07em] text-white transition-transform duration-100 active:scale-[0.978] sm:w-auto"
                style={{
                  background: "linear-gradient(168deg,#3478E8 0%,#2457C5 58%,#1C3D91 100%)",
                  boxShadow: "0 1px 2px rgba(0,0,0,.4), 0 10px 28px var(--ambient-strong)",
                }}
              >
                <span className="absolute inset-x-0 top-0 h-px bg-white/[0.16]" aria-hidden />
                Explore Products
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>

              <Link
                href="/support"
                className="inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[13px] border border-border-subtle bg-foreground/[0.025] px-8 text-[13.5px] font-bold uppercase tracking-[0.07em] text-foreground transition-colors hover:border-border-strong hover:bg-foreground/[0.05] sm:w-auto"
              >
                Contact Support
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-border-subtle pt-7">
              {["Manual verification", "Platform-locked access", "Guides included"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 text-[11.5px] font-semibold text-brand-ink-3"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--text-4)]" aria-hidden />
                  {item}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
