import * as React from "react";

/**
 * SectionHeading — one consistent section header across the whole site.
 *
 * Uses an asymmetric, left-aligned editorial default (spec §3: avoid
 * "giant centered text with no composition") with an optional centered
 * variant for genuine focal moments.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  accent = "blue",
  actions,
  className = "",
  id,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  /**
   * Retained so existing call sites keep compiling. The rule it controls is now
   * achromatic — tinting a decorative 24px hairline crimson or blue is exactly
   * the kind of gratuitous colour the art direction removes. Callers can drop
   * the prop.
   */
  accent?: "blue" | "crimson" | "none";
  actions?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const centered = align === "center";
  void accent;

  return (
    <div
      className={`flex flex-col gap-5 ${
        centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"
      } ${className}`}
    >
      <div className={centered ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <div
            className={`flex items-center gap-2.5 mb-3.5 ${
              centered ? "justify-center" : ""
            }`}
          >
            <span className="h-px w-6 bg-[color:var(--text-4)]" aria-hidden />
            <span className="eyebrow">{eyebrow}</span>
          </div>
        )}

        <h2
          id={id}
          className="text-[30px] leading-[1.06] sm:text-[42px] lg:text-[52px] font-extrabold text-foreground tracking-[-0.032em]"
        >
          {title}
        </h2>

        {description && (
          <p className="mt-4 text-[14px] sm:text-[15px] leading-relaxed text-brand-ink-3 max-w-xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className={`shrink-0 ${centered ? "" : "md:pb-1"}`}>{actions}</div>
      )}
    </div>
  );
}
