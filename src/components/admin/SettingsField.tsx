import * as React from "react";
import { Input, Textarea, Select, FieldLabel } from "@/components/ui/Input";

/**
 * Presentational building blocks for every settings-style admin screen
 * (spec §53: reusable component systems; §27: structured content management,
 * not arbitrary CSS chaos).
 *
 * Server-safe: these are pure markup, so the settings pages stay server
 * components and only the save bar ships client JavaScript.
 */

/** A titled, bordered group of related fields. */
export function SettingsGroup({
  icon,
  title,
  description,
  children,
  className = "",
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mat-3 rounded-[18px] p-5 sm:p-6 ${className}`}>
      <header className="mb-5 flex items-start gap-3 border-b border-border-subtle pb-4">
        {icon && (
          <span className="mt-[2px] flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border-subtle bg-foreground/[0.05] text-brand-ink-2">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-brand-ink-3">{description}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

/** Two-column responsive field grid. */
export function SettingsGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${className}`}>{children}</div>
  );
}

type FieldVariant = "input" | "textarea" | "select";

export interface SettingsFieldProps {
  /** Human label shown above the control */
  label: string;
  /** POST field name — MUST keep the `setting_<key>` convention */
  name: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  variant?: FieldVariant;
  /** Select options, only used when variant="select" */
  options?: { value: string; label: string }[];
  /** Stretch a field across both grid columns */
  full?: boolean;
  type?: string;
  rows?: number;
  mono?: boolean;
  /** Marks the control as required for native validation. */
  required?: boolean;
}

/**
 * SettingsField — one labelled control.
 *
 * `name` is passed through untouched because `saveSettings` derives the
 * database key by stripping the `setting_` prefix. Renaming a field here
 * would silently stop persisting that setting, so the prefix is mandatory.
 */
export function SettingsField({
  label,
  name,
  defaultValue = "",
  placeholder,
  hint,
  variant = "input",
  options = [],
  full = false,
  type = "text",
  rows = 4,
  mono = false,
  required = false,
}: SettingsFieldProps) {
  const id = `setting-${name}`;
  const monoClass = mono ? "font-mono" : "";

  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {variant === "textarea" ? (
        <Textarea
          id={id}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={monoClass}
        />
      ) : variant === "select" ? (
        <Select id={id} name={name} defaultValue={defaultValue} required={required}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={monoClass}
        />
      )}
      {hint && <p className="mt-2 text-[11.5px] leading-relaxed text-brand-ink-4">{hint}</p>}
    </div>
  );
}
