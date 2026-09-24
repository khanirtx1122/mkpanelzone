import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * PageHeader — consistent page identity for admin, agent and portal pages.
 * Breadcrumb + title + description on the left, primary actions on the right.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  eyebrow,
  className = "",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <header className={`mb-7 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-ink-3"
        >
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <ChevronRight size={12} className="opacity-50 shrink-0" aria-hidden />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors truncate max-w-[160px]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-brand-ink-2 truncate max-w-[200px]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="text-[22px] sm:text-[27px] font-extrabold text-foreground tracking-[-0.02em] leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[13px] sm:text-[14px] leading-relaxed text-brand-ink-3">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
