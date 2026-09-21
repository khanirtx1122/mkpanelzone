import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass" | "product";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild = false, children, ...props }, ref) => {
    
    /**
     * Base — transform + opacity only (no box-shadow, no filter, no color in base transition)
     * active:scale = press feedback per spec 6.3
     * disabled: explicit text muted (not just opacity-50 which loses text visibility)
     */
    const baseClasses = [
      "relative inline-flex items-center justify-center",
      "font-bold tracking-wide",
      "transition-[transform,opacity] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-obsidian)]",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon-blue focus-visible:ring-offset-2",
      "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
      "active:scale-[0.975]",
      "group overflow-hidden",
    ].join(" ");

    const variantClasses: Record<string, string> = {
      /**
       * primary — solid neon-glass fill that is actually visible.
       * Background: a real branded tint so it reads as "primary CTA".
       * Border gradient overlay is decorative, not structural contrast.
       */
      primary: [
        "bg-brand-blue-500 text-white",
        "shadow-[0_0_0_1px_rgba(77,163,255,0.4)]",
        "hover:bg-brand-blue-500/90",
        "rounded-[13px]",
        // Light theme: stronger branded fill
        "[data-theme='light']_&:bg-brand-blue-700",
      ].join(" "),

      secondary: [
        "bg-surface text-foreground",
        "rounded-[13px]",
        "border border-border-subtle hover:border-border-subtle-hover",
        "hover:bg-surface-raised",
      ].join(" "),

      outline: [
        "bg-transparent border border-border-subtle",
        "text-foreground",
        "rounded-[13px]",
        "hover:bg-foreground/5 hover:border-border-subtle-hover",
      ].join(" "),

      ghost: [
        "bg-transparent border-transparent",
        "text-foreground",
        "rounded-[13px]",
        "hover:bg-foreground/6",
      ].join(" "),

      glass: [
        "bg-glass-bg backdrop-blur-xl",
        "border border-border-subtle",
        "text-foreground",
        "hover:bg-foreground/8 hover:border-border-subtle-hover",
        "rounded-[13px]",
      ].join(" "),

      product: [
        "bg-surface-glass border border-transparent",
        "text-foreground",
        "rounded-[13px]",
        "hover:border-border-subtle",
      ].join(" "),
    };

    const sizeClasses: Record<string, string> = {
      /** All heights meet 44px minimum tap target per spec section 7 */
      default: "h-[54px] px-6 text-sm [font-size:16px] sm:text-sm sm:[font-size:0.875rem]",
      lg: "h-[60px] px-8 text-base",
      sm: "h-[44px] px-4 text-xs [font-size:16px] sm:text-xs sm:[font-size:0.75rem]",
      icon: "h-[54px] w-[54px]",
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant] || ""} ${sizeClasses[size]} ${className || ""}`;

    const innerContent = (
      <>
        {(variant === "primary" || variant === "secondary") && (
          /* Neon gradient border overlay — opacity only, no transform animation */
          <div className="absolute inset-0 rounded-[13px] neon-border-gradient opacity-50 group-hover:opacity-80 transition-opacity duration-[var(--duration-fast)] pointer-events-none" />
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
