import * as React from "react"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the asymmetric accent edges used for hero/feature cards */
  important?: boolean;
  /**
   * Use the glass material. Per spec §5 glass is rare and meaningful —
   * reserved for nav, modals and drawers. Default is a raised surface.
   */
  glass?: boolean;
  /** Adds press-feedback scale on active for clickable cards */
  interactive?: boolean;
  /** Level 3 elevated panel instead of level 2 raised surface */
  elevated?: boolean;
  /** Corner radius token override */
  radius?: "md" | "lg" | "xl" | "2xl";
}

const RADIUS: Record<NonNullable<GlassCardProps["radius"]>, string> = {
  md: "rounded-[14px]",
  lg: "rounded-[18px]",
  xl: "rounded-[22px]",
  "2xl": "rounded-[28px]",
};

/**
 * GlassCard — legacy-named surface primitive, now driven by the material
 * system. Existing call-sites keep working; the visual result is a proper
 * elevation ladder instead of one repeated glass treatment.
 */
export function GlassCard({
  className,
  children,
  important = false,
  glass = false,
  interactive = false,
  elevated = false,
  radius = "lg",
  ...props
}: GlassCardProps) {
  const material = glass ? "elevation-glass" : elevated ? "mat-3" : "elevation-card";
  const pressClass = interactive ? "press-feedback cursor-pointer" : "";
  const radiusClass = RADIUS[radius];

  return (
    <div
      className={`relative ${radiusClass} p-6 ${material} ${pressClass} ${className ?? ""}`}
      {...props}
    >
      {/* Top-edge elevation highlight — conveys light from above */}
      {!glass && (
        <div
          className={`absolute inset-x-0 top-0 h-px ${radiusClass} bg-[var(--border-top-highlight)] pointer-events-none`}
          aria-hidden
        />
      )}

      {/* Important card accent edges — asymmetric, intentional */}
      {important && (
        <>
          <div
            className="absolute top-0 left-0 w-20 h-[2px] bg-gradient-to-r from-[color:var(--text-3)] to-transparent rounded-tl-[inherit] opacity-70 pointer-events-none"
            aria-hidden
          />
          <div
            className="absolute bottom-0 right-0 w-20 h-[2px] bg-gradient-to-l from-brand-red-500 to-transparent rounded-br-[inherit] opacity-70 pointer-events-none"
            aria-hidden
          />
        </>
      )}

      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
