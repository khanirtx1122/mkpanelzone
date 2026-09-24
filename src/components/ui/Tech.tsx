import * as React from "react";

/**
 * The technical annotation layer, as components.
 *
 * Both reference sites (alche.studio, zrk.technology) are built on a monospace
 * annotation layer that carries indices, units, coordinates and comment markers.
 * It is the single most identifiable signature of that art direction, and the
 * easiest thing to get wrong: applied loosely it becomes decoration, and the
 * interface reads as a theme rather than as engineering.
 *
 * The rules, enforced by these components rather than by discipline:
 *   · A label labels. It never carries a sentence.
 *   · Counters use tabular numerals so they do not jitter while ticking.
 *   · Wide letter-spacing is reserved for this layer alone.
 *
 * Server-safe: pure markup, no state.
 */

type Tone = "default" | "bright" | "dim" | "accent";
type Size = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<Size, string> = {
  sm: "tech-sm",
  md: "",
  lg: "tech-lg",
  xl: "tech-xl",
};

const TONE_CLASS: Record<Tone, string> = {
  default: "",
  bright: "tech-bright",
  dim: "tech-dim",
  accent: "tech-accent",
};

export interface TechLabelProps {
  children: React.ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
  /** Render as a different element — e.g. "dt", "th", "span". Defaults to span. */
  as?: "span" | "div" | "p" | "dt" | "th" | "dd" | "li";
}

/** A monospace, uppercase, wide-tracked label. */
export function TechLabel({
  children,
  tone = "default",
  size = "md",
  className = "",
  as: Tag = "span",
}: TechLabelProps) {
  return (
    <Tag className={`tech ${SIZE_CLASS[size]} ${TONE_CLASS[tone]} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

/**
 * A numbered readout, e.g. `01 / 05`.
 *
 * The padded form matters: unpadded counters make a list of twelve items look
 * ragged as soon as it passes nine.
 */
export function TechIndex({
  current,
  total,
  className = "",
  pad = 2,
}: {
  current: number;
  total?: number;
  className?: string;
  pad?: number;
}) {
  const format = (n: number) => String(n).padStart(pad, "0");

  return (
    <span className={`tech-index ${className}`.trim()}>
      {format(current)}
      {typeof total === "number" && (
        <span className="text-brand-ink-4"> / {format(total)}</span>
      )}
    </span>
  );
}

/** A hairline divider that reads as a technical rule, not a border. */
export function TechRule({ className = "" }: { className?: string }) {
  return <div className={`tech-rule ${className}`.trim()} aria-hidden />;
}

/**
 * A section marker — the `works_intro` / `mission_in` device.
 *
 * A quiet lowercase identifier that names the section for the reader the way a
 * code comment names a block. Rendered aria-hidden because it duplicates the
 * heading that follows it.
 */
export function SectionMarker({
  id,
  index,
  total,
  className = "",
}: {
  id: string;
  index?: number;
  total?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()} aria-hidden>
      <span className="tech tech-dim">{id}</span>
      <span className="h-px flex-1 bg-[color:var(--line-color)]" />
      {typeof index === "number" && <TechIndex current={index} total={total} />}
    </div>
  );
}

/** A comment marker — `//`, `};`, `/*` — used as a delimiter. Decorative. */
export function TechMarker({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`tech-marker ${className}`.trim()} aria-hidden>
      {children}
    </span>
  );
}

type DisplaySize = "xs" | "sm" | "md" | "lg" | "xl";

const DISPLAY_CLASS: Record<DisplaySize, string> = {
  xs: "text-display-xs",
  sm: "text-display-sm",
  md: "text-display",
  lg: "text-display-lg",
  xl: "text-display-xl",
};

/**
 * A display heading. Intended for hero and section statements only —
 * anything below ~28px should use the normal h1–h4 roles.
 */
export function DisplayHeading({
  children,
  size = "md",
  as: Tag = "h2",
  tight = false,
  className = "",
}: {
  children: React.ReactNode;
  size?: DisplaySize;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  tight?: boolean;
  className?: string;
}) {
  return (
    <Tag
      className={`display ${DISPLAY_CLASS[size]} ${tight ? "display-tight" : ""} text-foreground ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}

/**
 * A stat readout in the reference idiom: a large number over a small mono
 * label, separated by a hairline. Numbers must be real — never a placeholder.
 */
export function TechStat({
  label,
  value,
  unit,
  index,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  index?: number;
  className?: string;
}) {
  return (
    <div className={`border-t border-border-subtle pt-4 ${className}`.trim()}>
      <div className="flex items-baseline justify-between gap-3">
        <TechLabel tone="dim" size="sm">
          {label}
        </TechLabel>
        {typeof index === "number" && <TechIndex current={index} className="tech-dim" />}
      </div>
      <p className="mt-3 font-mono text-[26px] font-medium leading-none tracking-[-0.02em] text-foreground [font-variant-numeric:tabular-nums]">
        {value}
        {unit && <span className="ml-1 text-[13px] text-brand-ink-3">{unit}</span>}
      </p>
    </div>
  );
}
