"use client";

import * as React from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders a designed validation message below the field */
  error?: string;
  /** Renders a quiet helper line below the field */
  hint?: string;
}

/**
 * Input — refined form control.
 *
 * 16px minimum on mobile so iOS never zooms on focus, a focus ring rather
 * than a box-shadow transition (no repaint on every keystroke), and an
 * explicit 48px tap target for the password reveal control.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, hint, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    const describedBy = error
      ? `${fieldId}-error`
      : hint
      ? `${fieldId}-hint`
      : undefined;

    return (
      <div className="w-full">
        <div className="relative w-full group">
          <input
            id={fieldId}
            type={actualType}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={[
              /* Layout & shape */
              "flex h-[52px] w-full rounded-[12px] px-4 py-2",
              /* Typography — 16px minimum on mobile avoids iOS zoom-on-focus */
              "text-[16px] sm:text-[14px] font-medium text-foreground placeholder:text-brand-ink-3/70",
              /* Surface — theme-aware via CSS vars */
              "bg-[var(--input-bg)] border border-border-subtle",
              /* Focus — ring only, no box-shadow transition (paint trigger) */
              "focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)] focus:border-[color:var(--accent)]",
              "hover:border-border-strong",
              /* Transition — border-color only */
              "transition-[border-color,background-color] duration-[var(--duration-fast)]",
              /* States */
              "disabled:cursor-not-allowed disabled:opacity-50",
              /* Password eye padding */
              isPassword ? "pr-12" : "",
              error ? "border-[color:var(--status-danger-border)] focus:ring-[color:var(--status-danger-border)]" : "",
              className ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            ref={ref}
            {...props}
          />

          {/* Focus accent — a hairline that lights up, not a glow blob */}
          <span
            className="pointer-events-none absolute inset-x-3 -bottom-px h-px scale-x-0 bg-gradient-to-r from-transparent via-brand-blue-400/70 to-transparent transition-transform duration-300 group-focus-within:scale-x-100"
            aria-hidden
          />

          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 h-full w-[48px] flex items-center justify-center text-brand-ink-3 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] rounded-r-[12px]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error ? (
          <p
            id={`${fieldId}-error`}
            className="mt-2 flex items-start gap-1.5 text-[12px] font-medium text-[color:var(--status-danger-text)]"
          >
            <AlertCircle size={13} className="mt-[2px] shrink-0" aria-hidden />
            {error}
          </p>
        ) : hint ? (
          <p id={`${fieldId}-hint`} className="mt-2 text-[12px] text-brand-ink-3">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

/** Textarea counterpart sharing the exact Input surface treatment. */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={error ? true : undefined}
    className={[
      "w-full rounded-[12px] px-4 py-3 min-h-[110px] resize-y",
      "text-[16px] sm:text-[14px] font-medium text-foreground placeholder:text-brand-ink-3/70",
      "bg-[var(--input-bg)] border border-border-subtle",
      "focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)] focus:border-[color:var(--accent)]",
      "hover:border-border-strong",
      "transition-[border-color] duration-[var(--duration-fast)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      error ? "border-[color:var(--status-danger-border)]" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/** Native select styled to match Input — used by admin forms and filters. */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={[
      "h-[52px] w-full appearance-none rounded-[12px] pl-4 pr-10",
      "text-[15px] sm:text-[14px] font-medium text-foreground",
      "bg-[var(--input-bg)] border border-border-subtle",
      "focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)] focus:border-[color:var(--accent)]",
      "hover:border-border-strong cursor-pointer",
      "transition-[border-color] duration-[var(--duration-fast)]",
      "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236E7A8C%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

/** Consistent label used above every form control. */
export function FieldLabel({
  children,
  htmlFor,
  required,
  className = "",
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-2 block text-[12px] font-bold uppercase tracking-[0.09em] text-brand-ink-2 ${className}`}
    >
      {children}
      {required && <span className="ml-1 text-[color:var(--status-danger-text)]">*</span>}
    </label>
  );
}

export { Input, Textarea, Select };
