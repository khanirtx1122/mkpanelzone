import * as React from "react"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  important?: boolean;
  /** Use glass variant only for nav/modal/drawer, default uses elevation-card */
  glass?: boolean;
  /** Adds press-feedback scale on active for clickable cards */
  interactive?: boolean;
}

export function GlassCard({
  className,
  children,
  important = false,
  glass = false,
  interactive = false,
  ...props
}: GlassCardProps) {
  const baseClass = glass ? "elevation-glass" : "elevation-card";
  const pressClass = interactive ? "press-feedback cursor-pointer" : "";

  return (
    <div
      className={`relative rounded-[20px] p-6 ${baseClass} ${pressClass} ${className || ""}`}
      {...props}
    >
      {/* Top-edge elevation highlight — conveys light from above */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-[20px] bg-[var(--border-top-highlight)] pointer-events-none" />

      {/* Important card accent edges */}
      {important && (
        <>
          <div className="absolute top-0 left-0 w-20 h-[2px] bg-gradient-to-r from-brand-neon-blue to-transparent rounded-tl-[20px] opacity-80 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-20 h-[2px] bg-gradient-to-l from-brand-neon-red to-transparent rounded-br-[20px] opacity-80 pointer-events-none" />
        </>
      )}

      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
