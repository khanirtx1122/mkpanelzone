"use client";

import * as React from "react";
import { Smartphone, TabletSmartphone, Monitor, ArrowRight, Check, type LucideIcon } from "lucide-react";

export type PlatformKey = "ANDROID" | "IOS" | "PC";

/**
 * Neutral, professional device glyphs (spec §15).
 *
 * Deliberately NOT vendor logos — a generic phone, a generic tablet-phone and
 * a generic monitor, so the portal reads as a platform selector rather than a
 * brand wall.
 */
export const PLATFORM_META: Record<
  PlatformKey,
  {
    label: string;
    short: string;
    description: string;
    Icon: LucideIcon;
    accent: "blue" | "crimson" | "steel";
  }
> = {
  ANDROID: {
    label: "Android",
    short: "ANDROID",
    description:
      "Panel package, MT Manager and Shizuku utilities with setup walkthroughs.",
    Icon: Smartphone,
    accent: "blue",
  },
  IOS: {
    label: "iPhone",
    short: "IPHONE",
    description:
      "iPhone package file and its dedicated setup guide.",
    Icon: TabletSmartphone,
    accent: "steel",
  },
  PC: {
    label: "PC",
    short: "PC",
    description:
      "Desktop package resources for Windows systems.",
    Icon: Monitor,
    accent: "crimson",
  },
};

/**
 * The single platform-card tone — achromatic.
 *
 * This previously gave each platform its own brand hue (Android blue, iPhone
 * steel, PC crimson). Three differently-coloured cards in a row is decoration:
 * the platform is already identified by its device icon and its label, so the
 * hue added nothing and spent the brand colours. Keys are retained because
 * `PLATFORM_META` still indexes by them.
 */
const NEUTRAL_PLATFORM_TONE = {
  text: "var(--text-2)",
  soft: "var(--ambient-strong)",
  border: "var(--border-subtle)",
  ring: "var(--border-strong)",
} as const;

const ACCENT = {
  blue: NEUTRAL_PLATFORM_TONE,
  crimson: NEUTRAL_PLATFORM_TONE,
  steel: NEUTRAL_PLATFORM_TONE,
} as const;

/**
 * PlatformCard — one of the three platform portals on /access (spec §15).
 *
 * Selected state is communicated by a lit border, a check badge and a
 * subtle scale — three signals, so it never relies on colour alone.
 */
export function PlatformCard({
  platform,
  selected = false,
  onSelect,
  resourceCount,
  index = 0,
}: {
  platform: PlatformKey;
  selected?: boolean;
  onSelect: () => void;
  resourceCount?: number;
  index?: number;
}) {
  const meta = PLATFORM_META[platform];
  const tone = ACCENT[meta.accent];
  const Icon = meta.Icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="group relative w-full overflow-hidden rounded-[20px] border p-6 text-left outline-none transition-[transform,border-color,box-shadow,background-color] duration-[var(--duration-normal)] ease-[cubic-bezier(.22,1,.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] active:scale-[0.99] sm:p-7 card-entrance"
      style={{
        animationDelay: `${index * 80}ms`,
        background: selected
          ? `linear-gradient(180deg, ${tone.soft} 0%, var(--surface-raised) 55%)`
          : "var(--surface-raised)",
        borderColor: selected ? tone.ring : "var(--border-subtle)",
        boxShadow: selected
          ? `0 1px 2px rgba(0,0,0,.4), 0 14px 34px ${tone.soft}`
          : "var(--shadow-card)",
        transform: selected ? "translateY(-2px)" : undefined,
      }}
    >
      {/* Top-edge light */}
      <span
        className="absolute inset-x-0 top-0 h-px bg-[var(--border-top-highlight)]"
        aria-hidden
      />
      {/* Accent light entering from the top-left, brightens when selected */}
      <span
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(75% 55% at 12% 0%, ${tone.soft}, transparent 68%)`,
          opacity: selected ? 1 : 0.5,
        }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Device glyph in a dimensional frame */}
        <div className="relative">
          <span
            className="absolute inset-0 rounded-[15px] blur-xl transition-opacity duration-300"
            style={{ background: tone.soft, opacity: selected ? 0.9 : 0.4 }}
            aria-hidden
          />
          <span
            className="relative flex h-14 w-14 items-center justify-center rounded-[15px] border transition-transform duration-[var(--duration-normal)] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]"
            style={{
              borderColor: tone.border,
              background: "linear-gradient(160deg, rgba(255,255,255,0.045), transparent)",
            }}
            aria-hidden
          >
            <Icon size={24} style={{ color: tone.text }} />
          </span>
        </div>

        {/* Selected confirmation */}
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200"
          style={{
            borderColor: selected ? tone.ring : "var(--border-subtle)",
            background: selected ? tone.ring : "transparent",
            opacity: selected ? 1 : 0.55,
          }}
          aria-hidden
        >
          <Check
            size={13}
            className="text-white transition-opacity duration-200"
            style={{ opacity: selected ? 1 : 0 }}
          />
        </span>
      </div>

      <div className="relative mt-6">
        <h3 className="text-[19px] font-extrabold tracking-[-0.016em] text-foreground">
          {meta.label}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-brand-ink-3">
          {meta.description}
        </p>
      </div>

      <div className="relative mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.11em] text-[color:var(--status-success-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-dot-pulse" aria-hidden />
          {resourceCount !== undefined && resourceCount > 0
            ? `${resourceCount} resource${resourceCount === 1 ? "" : "s"} ready`
            : "Available"}
        </span>

        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: tone.text }}
        >
          Continue
          <ArrowRight size={13} aria-hidden />
        </span>
      </div>
    </button>
  );
}
