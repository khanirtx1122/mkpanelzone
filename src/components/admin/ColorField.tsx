"use client";

import * as React from "react";
import { FieldLabel } from "@/components/ui/Input";

/**
 * ColorField — swatch picker with a synchronised hex readout.
 *
 * The original implementation rendered a `<input type="color">` next to a
 * *disabled* text input that was hard-coded to the stored value, so picking a
 * new colour changed nothing on screen and looked broken. This keeps the two in
 * sync and lets the hex be typed directly.
 *
 * Only the single `name` field is posted (the hex value), preserving the
 * `setting_<key>` convention that `saveSettings` depends on.
 */
export function ColorField({
  label,
  name,
  defaultValue,
  hint,
  warning,
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
  warning?: string;
}) {
  const [value, setValue] = React.useState(defaultValue);

  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <div>
      <FieldLabel htmlFor={`color-${name}`}>{label}</FieldLabel>

      <div className="flex items-center gap-2.5">
        <span
          className="relative flex h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[11px] border border-border-subtle"
          style={{ background: isValidHex ? value : "transparent" }}
        >
          <input
            id={`color-${name}`}
            type="color"
            value={isValidHex ? value : "#000000"}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            aria-label={`${label} picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>

        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          placeholder="#2457C5"
          className={`h-[46px] w-full rounded-[11px] border bg-[var(--input-bg)] px-3.5 font-mono text-[13px] font-semibold text-foreground transition-[border-color] duration-150 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)] ${
            isValidHex ? "border-border-subtle" : "border-[color:var(--status-danger-border)]"
          }`}
        />
      </div>

      {!isValidHex && (
        <p
          className="mt-2 text-[11.5px] font-medium"
          style={{ color: "var(--status-danger-text)" }}
        >
          Enter a 6-digit hex value, e.g. #2457C5
        </p>
      )}

      {warning && (
        <p
          className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed"
          style={{ color: "var(--status-warning-text)" }}
        >
          {warning}
        </p>
      )}

      {hint && <p className="mt-2 text-[11.5px] leading-relaxed text-brand-ink-4">{hint}</p>}
    </div>
  );
}
