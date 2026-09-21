import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass" | "product";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild = false, children, ...props }, ref) => {
    
    const baseClasses = "relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden active:scale-[0.98]";
    
    const variantClasses = {
      primary: "bg-surface-glass text-brand-ink rounded-[13px] shadow-[0_0_15px_rgba(77,163,255,0.15)] hover:shadow-[0_0_25px_rgba(77,163,255,0.25)] hover:-translate-y-[2px]",
      secondary: "bg-surface text-brand-ink rounded-[13px] border border-border-subtle hover:bg-surface-glass",
      outline: "bg-transparent border border-border-subtle text-brand-ink rounded-[13px] hover:bg-foreground/5",
      ghost: "bg-transparent border-transparent text-brand-ink rounded-[13px] hover:bg-foreground/5",
      glass: "bg-surface-glass backdrop-blur-xl border border-border-subtle text-foreground hover:bg-foreground/10 hover:border-border-subtle rounded-[13px]",
      product: "bg-surface-glass border border-transparent text-foreground rounded-[13px]",
    };

    const sizeClasses = {
      default: "h-[54px] px-6 text-sm",
      lg: "h-[60px] px-8 text-base",
      sm: "h-[44px] px-4 text-xs",
      icon: "h-[54px] w-[54px]"
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ""}`;

    const innerContent = (
      <>
        {(variant === "primary" || variant === "secondary") && (
          <>
            {/* 1px neon gradient border */}
            <div className="absolute inset-0 rounded-[13px] neon-border-gradient opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {/* Hover sweeping light */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[800ms] ease-out pointer-events-none" />
          </>
        )}
        <span className="relative z-10 flex items-center gap-2">
          {asChild && React.isValidElement(children) ? (children as React.ReactElement<any>).props.children : children}
        </span>
      </>
    );

    if (asChild && React.isValidElement(children)) {
      return (
        <Slot className={combinedClasses} ref={ref as any} {...props}>
          {React.cloneElement(children as any, undefined, innerContent)}
        </Slot>
      );
    }

    return (
      <button className={combinedClasses} ref={ref} {...props}>
        {innerContent}
      </button>
    );
  }
)
Button.displayName = "Button"

export { Button }
