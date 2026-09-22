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
       * primary — deep cobalt gradient, subtle top highlight, refined shadow
       * Designed to feel expensive — not default Tailwind blue.
       */
      primary: [
        "text-white",
        "rounded-[13px]",
        // Gradient via inline style applied through a wrapper pseudo-approach:
        // We bake the gradient as a class-compatible approach using a hard-coded gradient class
        "[background:linear-gradient(160deg,#2F5FD0_0%,#1A3499_100%)]",
        "[box-shadow:0_4px_14px_rgba(47,95,208,0.35),inset_0_1px_0_rgba(255,255,255,0.10)]",
        "hover:opacity-90",
        // Light theme: stronger cobalt (less translucent)
        "[data-theme='light']_&:[background:linear-gradient(160deg,#2F5FD0_0%,#1E3FA8_100%)]",
        "[data-theme='light']_&:[box-shadow:0_4px_14px_rgba(47,95,208,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]",
      ].join(" "),

      secondary: [
        "bg-surface text-foreground",
        "rounded-[13px]",
        "border border-border-subtle hover:border-border-subtle-hover",
        "hover:bg-surface-raised",
        "[box-shadow:var(--shadow-card)]",
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
        "backdrop-blur-sm",
        "border border-border-subtle",
        "text-foreground",
        "rounded-[13px]",
        "hover:border-border-subtle-hover hover:bg-foreground/5",
        "[background:var(--glass-bg)]",
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
      default: "h-[48px] px-6 text-[14px] tracking-[0.06em]",
      lg:      "h-[56px] px-8 text-[15px] tracking-[0.06em]",
      sm:      "h-[44px] px-4 text-[13px] tracking-[0.05em]",
      icon:    "h-[48px] w-[48px]",
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant] || ""} ${sizeClasses[size]} ${className || ""}`;

    const innerContent = (
      <>
        {variant === "primary" && (
          /* Top-edge internal highlight stripe — baked, no animation */
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/12 rounded-t-[13px] pointer-events-none" />
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
