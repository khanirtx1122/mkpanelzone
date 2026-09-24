import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

/**
 * LegalPage — one layout for policy documents (spec §53).
 *
 * The body copy is passed through verbatim by the caller; this component only
 * governs presentation, so legal text is never rewritten as a side effect of a
 * restyle.
 *
 * Note on the date: the previous implementation printed
 * `new Date().toLocaleDateString()`, so the "Last Updated" line silently showed
 * *today* on every visit — which is misleading on a legal document. The caller
 * now supplies a fixed, real date.
 */

export interface LegalSection {
  heading: string;
  body: string;
}

export function LegalPage({
  title,
  intro,
  sections,
  lastUpdated,
  breadcrumbLabel,
  accent = "blue",
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  /** Human-readable, fixed date string */
  lastUpdated: string;
  breadcrumbLabel: string;
  accent?: "blue" | "crimson";
}) {
  const accentText = accent === "crimson" ? "text-brand-red-400" : "text-brand-ink-2";

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 ambient-blue opacity-30" aria-hidden />

      <div className="relative mx-auto max-w-[860px] px-4 py-14 sm:px-6 sm:py-16">
        <PageHeader
          eyebrow="Legal"
          title={title}
          description={intro}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: breadcrumbLabel }]}
          actions={
            <Link
              href="/"
              className="group inline-flex h-[38px] items-center gap-1.5 rounded-[11px] border border-border-subtle px-3.5 text-[12px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
            >
              <ArrowLeft
                size={14}
                className="transition-transform duration-150 group-hover:-translate-x-0.5"
                aria-hidden
              />
              Home
            </Link>
          }
        />

        {/* Document meta */}
        <div className="mat-2 mb-7 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[14px] px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-ink-3">
            <FileText size={12} className={accentText} aria-hidden />
            Last updated {lastUpdated}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-ink-3">
            <ShieldCheck size={12} className={accentText} aria-hidden />
            {sections.length} sections
          </span>
        </div>

        {/* Sections — numbered, with a quiet index for scanning */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <section key={section.heading} className="mat-3 rounded-[18px] p-5 sm:p-6">
              <h2 className="flex items-baseline gap-3 text-[16px] font-extrabold tracking-[-0.01em] text-foreground">
                <span className={`tabular text-[13px] font-extrabold ${accentText}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              <p className="mt-3 text-[14px] leading-[1.75] text-brand-ink-2">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-[11.5px] leading-relaxed text-brand-ink-4">
          Questions about this document?{" "}
          <Link
            href="/support"
            className="font-bold text-brand-ink-2 transition-colors hover:text-brand-ink-2"
          >
            Contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
