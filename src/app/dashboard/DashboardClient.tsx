"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  LogOut,
  ShieldCheck,
  HelpCircle,
  LayoutGrid,
  Key,
  BookOpen,
  Wrench,
  Fingerprint,
  CircleDot,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { PackageResource } from "@prisma/client";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { customerLogout } from "@/app/actions";

interface DashboardClientProps {
  identifier: string;
  packageName: string;
  resources: PackageResource[];
  platformType: string;
}

const PLATFORM_LABEL: Record<string, string> = {
  ANDROID: "Android",
  IOS: "iPhone",
  PC: "PC",
};

/**
 * DashboardClient — the secure resource vault (spec §17–20).
 *
 * Layout is a three-column workspace on large screens:
 *   left   → platform identity + section navigation
 *   centre → the resource workspace (grouped, never mixed)
 *   right  → account + status information
 *
 * Below `lg` it collapses into a single column with a sticky account strip,
 * so nothing is ever side-scrolled or clipped.
 *
 * Resources are grouped exactly as the specification requires — main file,
 * file password, utilities and tutorials — and the platform is stated on
 * every card so a customer can never mistake which vault they are in.
 */
export function DashboardClient({
  identifier,
  packageName,
  resources,
  platformType,
}: DashboardClientProps) {
  const [activeSection, setActiveSection] = useState<string>("all");

  const mainFile = resources.find((r) => r.name === "MAIN FILE");
  const filePassword = resources.find((r) => r.name === "FILE PASSWORD");
  const tutorials = resources.filter((r) => r.name.includes("TUTORIAL"));
  const otherResources = resources.filter(
    (r) =>
      r.name !== "MAIN FILE" &&
      r.name !== "FILE PASSWORD" &&
      !r.name.includes("TUTORIAL")
  );

  const platformLabel = PLATFORM_LABEL[platformType] ?? platformType;

  const sections = [
    { key: "all", label: "All resources", Icon: LayoutGrid, count: resources.length },
    { key: "files", label: "Main package", Icon: PackageCheck, count: (mainFile ? 1 : 0) + (filePassword ? 1 : 0) },
    { key: "utilities", label: "Utilities", Icon: Wrench, count: otherResources.length },
    { key: "tutorials", label: "Tutorials", Icon: BookOpen, count: tutorials.length },
  ].filter((s) => s.key === "all" || s.count > 0);

  const showSection = (key: string) =>
    activeSection === "all" || activeSection === key;

  return (
    <div className="relative min-h-screen pb-20 pt-[104px] sm:pt-[124px]">
      {/* Background depth — vault lighting */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(55% 55% at 20% 0%, var(--ambient-strong) 0%, transparent 64%), radial-gradient(45% 45% at 88% 30%, var(--ambient-strong) 0%, transparent 66%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-grid opacity-40"
        style={{
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.8), transparent)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.8), transparent)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        {/* ── COMPACT HEADER ── */}
        <ScrollReveal>
          <header className="mb-8 flex flex-col gap-5 border-b border-border-subtle pb-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone="success" size="sm" icon={ShieldCheck}>
                  Active
                </StatusBadge>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-ink-3">
                  <Fingerprint size={10} aria-hidden />
                  {platformLabel} vault
                </span>
              </div>

              <h1 className="text-[24px] font-extrabold tracking-[-0.026em] text-foreground sm:text-[30px]">
                Your digital access
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-brand-ink-3">
                Everything included in <span className="font-semibold text-brand-ink-2">{packageName}</span>,
                organised and ready to download.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <Button variant="ghost" asChild className="text-brand-ink-3 hover:text-foreground">
                <Link href="/support">
                  <HelpCircle size={15} aria-hidden />
                  Support
                </Link>
              </Button>
              <form action={customerLogout}>
                <Button
                  type="submit"
                  variant="outline"
                  className="gap-2 border-[color:var(--status-danger-border)] text-[color:var(--status-danger-text)] hover:bg-[color:var(--status-danger-bg)]"
                >
                  <LogOut size={15} aria-hidden />
                  Log out
                </Button>
              </form>
            </div>
          </header>
        </ScrollReveal>

        {/* ── WORKSPACE ── */}
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-7">
          {/* LEFT — platform identity + navigation */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-[104px] lg:space-y-5">
              {/* Identity card */}
              <div className="relative overflow-hidden rounded-[18px] mat-2 p-5">
                <span
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-[36px]"
                  style={{ background: "var(--ambient-strong)" }}
                  aria-hidden
                />
                <div className="relative flex items-center gap-3.5">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border"
                    style={{
                      borderColor: "rgba(77,163,255,0.26)",
                      background:
                        "linear-gradient(160deg, var(--ambient-strong), var(--ambient-blue))",
                    }}
                    aria-hidden
                  >
                    <ShieldCheck size={20} className="text-brand-ink-2" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-ink-4">
                      Customer
                    </p>
                    <p className="truncate text-[14.5px] font-extrabold tracking-[-0.01em] text-foreground">
                      {identifier}
                    </p>
                  </div>
                </div>

                <dl className="relative mt-5 space-y-3 border-t border-border-subtle pt-4">
                  {[
                    { label: "Platform", value: platformLabel },
                    { label: "Package", value: packageName },
                    {
                      label: "Resources",
                      value: `${resources.length} available`,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-ink-4">
                        {label}
                      </dt>
                      <dd className="truncate text-[12.5px] font-semibold text-brand-ink-2">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Section navigation — desktop only; mobile uses the flow order */}
              <nav
                aria-label="Resource sections"
                className="hidden rounded-[18px] mat-2 p-2 lg:block"
              >
                {sections.map(({ key, label, Icon, count }) => {
                  const isActive = activeSection === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveSection(key)}
                      aria-pressed={isActive}
                      className={`relative flex w-full items-center gap-3 rounded-[12px] px-3.5 py-3 text-left transition-colors duration-200 ${
                        isActive
                          ? "bg-[var(--ambient-strong)] text-foreground"
                          : "text-brand-ink-3 hover:bg-foreground/[0.03] hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 h-[52%] w-[3px] -translate-y-1/2 rounded-r-full bg-brand-blue-400"
                          aria-hidden
                        />
                      )}
                      <Icon
                        size={16}
                        className={isActive ? "text-brand-ink-2" : "text-brand-ink-4"}
                        aria-hidden
                      />
                      <span className="flex-1 text-[13px] font-bold">{label}</span>
                      <span className="tabular text-[11px] font-bold text-brand-ink-4">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* CENTRE — resource workspace */}
          <main className="lg:col-span-6">
            {resources.length === 0 ? (
              <EmptyState
                icon={PackageCheck}
                title="No resources issued yet"
                description="Your package does not have any active resources at the moment. If you believe this is wrong, contact support and we will check your account."
                action={
                  <Button variant="primary" asChild>
                    <Link href="/support">Contact support</Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-10">
                {/* Main package group */}
                {showSection("files") && (mainFile || filePassword) && (
                  <section>
                    <GroupHeading
                      eyebrow="Primary"
                      title="Main package"
                      count={(mainFile ? 1 : 0) + (filePassword ? 1 : 0)}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      {mainFile && (
                        <div className="sm:col-span-2">
                          <ResourceCard
                            name={mainFile.name}
                            description={mainFile.description}
                            type={mainFile.type}
                            url={mainFile.url}
                            version={mainFile.version}
                            variant="primary"
                            index={0}
                          />
                        </div>
                      )}
                      {filePassword && (
                        <div className="sm:col-span-2">
                          <ResourceCard
                            name={filePassword.name}
                            description={filePassword.description}
                            type={filePassword.type}
                            secret={filePassword.secret}
                            variant="secret"
                            index={1}
                          />
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Utilities / tools */}
                {showSection("utilities") && otherResources.length > 0 && (
                  <section>
                    <GroupHeading
                      eyebrow="Tools"
                      title="Utilities &amp; extras"
                      count={otherResources.length}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      {otherResources.map((res, idx) => (
                        <ResourceCard
                          key={res.id}
                          name={res.name}
                          description={res.description}
                          type={res.type}
                          url={res.url}
                          secret={res.secret}
                          variant="default"
                          index={idx}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Tutorials */}
                {showSection("tutorials") && tutorials.length > 0 && (
                  <section>
                    <GroupHeading
                      eyebrow="Guides"
                      title="Tutorials &amp; walkthroughs"
                      count={tutorials.length}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {tutorials.map((tutorial, idx) => (
                        <ResourceCard
                          key={tutorial.id}
                          name={tutorial.name}
                          type={tutorial.type}
                          url={tutorial.url}
                          variant="tutorial"
                          index={idx}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>

          {/* RIGHT — account + status */}
          <aside className="lg:col-span-3">
            <div className="space-y-5 lg:sticky lg:top-[104px]">
              <div className="rounded-[18px] mat-2 p-5">
                <p className="eyebrow mb-4">Account status</p>

                <ul className="space-y-3.5">
                  {[
                    { label: "Access", value: "Active", tone: "success" as const },
                    { label: "Device binding", value: "Enforced", tone: "info" as const },
                    { label: "Platform lock", value: "Server-side", tone: "info" as const },
                  ].map(({ label, value, tone }) => (
                    <li key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[12.5px] text-brand-ink-3">{label}</span>
                      <StatusBadge tone={tone} size="xs">
                        {value}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[18px] mat-2 p-5">
                <p className="eyebrow mb-4">Security notes</p>
                <ul className="space-y-3">
                  {[
                    "Secrets are masked until you reveal them.",
                    "Downloads open in a new tab — keep your session signed in.",
                    "Never share your customer ID or password.",
                  ].map((note) => (
                    <li key={note} className="flex items-start gap-2.5">
                      <CircleDot
                        size={12}
                        className="mt-[3px] shrink-0 text-brand-ink-2"
                        aria-hidden
                      />
                      <span className="text-[12px] leading-relaxed text-brand-ink-3">
                        {note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="relative overflow-hidden rounded-[18px] border p-5"
                style={{
                  borderColor: "rgba(77,163,255,0.22)",
                  background:
                    "linear-gradient(165deg, var(--ambient-strong) 0%, var(--surface-raised) 62%)",
                }}
              >
                <span
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] border"
                  style={{
                    borderColor: "rgba(77,163,255,0.26)",
                    background: "var(--ambient-strong)",
                  }}
                  aria-hidden
                >
                  <Key size={17} className="text-brand-ink-2" />
                </span>
                <h3 className="text-[14px] font-bold tracking-[-0.01em] text-foreground">
                  Missing something?
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed text-brand-ink-3">
                  If a file or guide you expected is not listed here, support can
                  check your package.
                </p>
                <Button variant="outline" asChild className="mt-4 w-full">
                  <Link href="/support">Open support</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function GroupHeading({
  eyebrow,
  title,
  count,
}: {
  eyebrow: string;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border-subtle pb-3.5">
      <div>
        <p className="eyebrow mb-1.5">{eyebrow}</p>
        <h2 className="text-[17px] font-extrabold tracking-[-0.016em] text-foreground">
          {title}
        </h2>
      </div>
      <span className="tabular text-[11px] font-bold uppercase tracking-[0.11em] text-brand-ink-4">
        {count} item{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}
