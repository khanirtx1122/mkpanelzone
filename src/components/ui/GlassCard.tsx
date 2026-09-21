import * as React from "react"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  important?: boolean;
}

export function GlassCard({ className, children, important = false, ...props }: GlassCardProps) {
  return (
    <div 
      className={`relative bg-surface-glass backdrop-blur-[24px] rounded-[22px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${className || ""}`} 
      {...props}
    >
      {/* 1px low opacity border + inner top highlight */}
      <div className="absolute inset-0 rounded-[22px] border border-border-subtle pointer-events-none" />
      <div className="absolute inset-0 rounded-[22px] border-t border-white/10 dark:border-white/10 border-black/5 pointer-events-none" />
      
      {/* Important card specific edges */}
      {important && (
        <>
          <div className="absolute top-0 left-0 w-16 h-[2px] bg-brand-neon-blue rounded-tl-[22px] blur-[1px]" />
          <div className="absolute bottom-0 right-0 w-16 h-[2px] bg-brand-neon-red rounded-br-[22px] blur-[1px]" />
        </>
      )}
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
