import * as React from "react";

/**
 * GlowDivider — a considered section separator.
 *
 * Not every section boundary needs one (spec §57: avoid hard transitions
 * everywhere). When used, it carries a single accent light that fades out
 * asymmetrically so it reads as designed rather than mechanical.
 */
export function GlowDivider({
  accent = "blue",
  align = "center",
  className = "",
}: {
  accent?: "blue" | "crimson" | "both";
  align?: "left" | "center" | "right";
  className?: string;
}) {
  const gradient =
    accent === "crimson"
      ? "linear-gradient(90deg, transparent, var(--color-brand-red-500), transparent)"
      : accent === "both"
      ? "linear-gradient(90deg, transparent, var(--text-2) 35%, var(--color-brand-red-600) 65%, transparent)"
      : "linear-gradient(90deg, transparent, var(--text-3), transparent)";

  const alignClass =
    align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto";

  return (
    <div
      className={`h-px w-full max-w-[220px] opacity-45 ${alignClass} ${className}`}
      style={{ background: gradient }}
      role="presentation"
    />
  );
}

/** Full-bleed hairline rule with a soft centre falloff. */
export function SectionRule({ className = "" }: { className?: string }) {
  return <div className={`divider-glow w-full ${className}`} role="presentation" />;
}
