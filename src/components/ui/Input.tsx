"use client";

import * as React from "react"
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
          className={`flex h-[52px] w-full rounded-[14px] border border-white/10 bg-black/40 px-4 py-2 text-sm text-brand-ink placeholder:text-brand-ink-3 focus:outline-none focus:ring-1 focus:ring-brand-neon-blue focus:border-brand-neon-blue focus:shadow-[0_0_15px_rgba(77,163,255,0.2)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ${isPassword ? 'pr-12' : ''} ${className || ""}`}
          ref={ref}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-ink-3 hover:text-brand-ink transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
