"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="relative w-full">
        <input
          type={actualType}
          className={[
            /* Layout & shape */
            "flex h-[52px] w-full rounded-[14px] px-4 py-2",
            /* Typography — 16px minimum on mobile avoids iOS zoom-on-focus */
            "text-[16px] sm:text-sm font-medium text-foreground placeholder:text-brand-ink-3",
            /* Surface — theme-aware via CSS vars */
            "bg-[var(--input-bg,rgba(0,0,0,0.35))] border border-[var(--border-subtle)]",
            /* Focus — ring only, no box-shadow transition (paint trigger) */
            "focus:outline-none focus:ring-2 focus:ring-brand-neon-blue/60 focus:border-brand-neon-blue",
            /* Transition — border-color only */
            "transition-[border-color] duration-[var(--duration-fast,150ms)]",
            /* States */
            "disabled:cursor-not-allowed disabled:opacity-50",
            /* Password eye padding */
            isPassword ? "pr-12" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          ref={ref}
          {...props}
        />
        {isPassword && (
          /* Eye toggle — explicit 44×44 tap area */
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-0 top-0 h-full w-[48px] flex items-center justify-center text-brand-ink-3 hover:text-foreground transition-colors duration-[var(--duration-fast,150ms)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon-blue rounded-r-[14px]"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
