import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass" | "product" | "crimson" | "solid";
  size?: "default" | "sm" | "lg" | "icon" | "xl";
  asChild?: boolean;
  /** Shows an indeterminate spinner and blocks interaction */
  loading?: boolean;
}

/**
 * Button — the single button primitive.
 *
 * Design intent (spec §6): buttons should feel physical. Each variant has a
 * distinct material response — a baked top highlight, a real contact shadow,
 * and a 2.5% press compression. All motion is transform/opacity only so
 * hovering a row of buttons never triggers layout or paint storms.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      "relative inline-flex items-center justify-center",
      "font-bold tracking-[0.045em]",
      "transition-[transform,opacity,background-color,border-color,color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-obsidian)]",
      "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]",
      "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
      "active:scale-[0.978]",
      "group overflow-hidden isolate",
    ].join(" ");

    const variantClasses: Record<string, string> = {
      /** Deep cobalt with a baked top highlight and real contact shadow. */
      primary: [
        "text-white rounded-[12px]",
        "[background:linear-gradient(168deg,#3478E8_0%,#2457C5_58%,#1C3D91_100%)]",
        "[box-shadow:0_1px_2px_rgba(0,0,0,.4),0_6px_18px_rgba(36,87,197,.30),inset_0_1px_0_rgba(255,255,255,.14)]",
        "hover:brightness-[1.07]",
        "[data-theme='light']_&:[box-shadow:0_1px_2px_rgba(15,23,42,.12),0_8px_20px_rgba(36,87,197,.22),inset_0_1px_0_rgba(255,255,255,.20)]",
      ].join(" "),

      /** Crimson variant reserved for destructive / high-urgency actions. */
      crimson: [
        "text-white rounded-[12px]",
        "[background:linear-gradient(168deg,#C9274D_0%,#A51C3C_58%,#771329_100%)]",
        "[box-shadow:0_1px_2px_rgba(0,0,0,.4),0_6px_18px_rgba(165,28,60,.28),inset_0_1px_0_rgba(255,255,255,.12)]",
        "hover:brightness-[1.07]",
      ].join(" "),

      /**
       * Monochrome primary action — near-white on dark, near-black on light.
       *
       * This is the reference art direction's primary button: a solid achromatic
       * block reads as more confident than a coloured gradient, and it keeps the
       * accent free for the few places it is actually needed.
       */
      solid: [
        "rounded-[12px]",
        "bg-[color:var(--text-1)] text-[color:var(--background)]",
        "[box-shadow:0_1px_2px_rgba(0,0,0,.35),0_6px_20px_rgba(0,0,0,.28)]",
        "hover:opacity-90",
      ].join(" "),

      secondary: [
        "bg-surface-raised text-foreground rounded-[12px]",
        "border border-border-subtle hover:border-border-strong",
        "hover:bg-surface-elevated",
        "[box-shadow:var(--shadow-card)]",
      ].join(" "),

      outline: [
        "bg-transparent border border-border-subtle",
        "text-foreground rounded-[12px]",
        "hover:bg-foreground/[0.045] hover:border-border-strong",
      ].join(" "),

      ghost: [
        "bg-transparent border-transparent",
        "text-foreground rounded-[12px]",
        "hover:bg-foreground/[0.05]",
      ].join(" "),

      glass: [
        "backdrop-blur-md",
        "border border-border-subtle",
        "text-foreground rounded-[12px]",
        "hover:border-border-strong hover:bg-foreground/[0.05]",
        "[background:var(--glass-bg)]",
      ].join(" "),

      product: [
        "bg-surface-raised border border-transparent",
        "text-foreground rounded-[12px]",
        "hover:border-border-subtle hover:bg-surface-elevated",
      ].join(" "),
    };

    const sizeClasses: Record<string, string> = {
      /** Every size keeps a >=44px effective tap target on touch devices. */
      default: "h-[46px] px-5 text-[13px] tracking-[0.055em]",
      lg:      "h-[54px] px-7 text-[14px] tracking-[0.055em]",
      /** Hero-scale — for the single primary action above the fold. */
      xl:      "h-[62px] px-9 text-[14.5px] tracking-[0.06em]",
      sm:      "h-[38px] px-4 text-[12px] tracking-[0.045em]",
      icon:    "h-[46px] w-[46px] px-0",
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant] ?? ""} ${sizeClasses[size]} ${className ?? ""}`;

    const isSolid = variant === "primary" || variant === "crimson" || variant === "solid";

    const innerContent = (
      <>
        {/* Baked top-edge light — conveys a physical surface, never animates */}
        {isSolid && (
          <span
            className="absolute inset-x-0 top-0 h-px bg-white/[0.16] pointer-events-none"
            aria-hidden
          />
        )}

        {/* One-shot sheen sweep on hover (transform only) */}
        {isSolid && (
          <span
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
            aria-hidden
          >
            <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-white/[0.10] skew-x-[-16deg] transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-[320%]" />
          </span>
        )}

        <span className="relative z-10 flex items-center gap-2">
          {loading && (
            <span
              className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
              aria-hidden
            />
          )}
          {asChild && React.isValidElement(children)
            ? (children as React.ReactElement<{ children?: React.ReactNode }>).props.children
            : children}
        </span>
      </>
    );

    if (asChild && React.isValidElement(children)) {
      return (
        <Slot className={combinedClasses} ref={ref as React.Ref<HTMLElement>} {...props}>
          {React.cloneElement(
            children as React.ReactElement<{ children?: React.ReactNode }>,
            undefined,
            innerContent
          )}
        </Slot>
      );
    }

    return (
      <button
        className={combinedClasses}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {innerContent}
      </button>
    );
  }
)
Button.displayName = "Button"

export { Button }
