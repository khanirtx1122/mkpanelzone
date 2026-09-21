import * as React from "react";
import { Check } from "lucide-react";

export function Steps({
  steps
}: {
  steps: { title: string; description: string }[];
}) {
  return (
    <div className="relative space-y-6 sm:space-y-8 before:absolute before:inset-0 before:ml-[15px] sm:before:ml-[23px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-strong before:to-transparent">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <div key={index} className="relative flex items-start md:justify-center">
            {/* Left side on desktop (empty for alignment) */}
            <div className="hidden md:block w-1/2 pr-8 text-right opacity-0">.</div>
            
            {/* Center Circle */}
            <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-border-strong bg-surface shadow-[0_0_10px_rgba(255,255,255,0.05)] dark:shadow-[0_0_10px_rgba(255,255,255,0.05)] shadow-[0_0_10px_rgba(0,0,0,0.05)] shrink-0 z-10 text-foreground font-bold text-[12px] sm:text-[14px]">
              {isLast ? <Check size={16} className="text-brand-neon-blue" /> : index + 1}
            </div>

            {/* Content (right side on desktop, right side on mobile) */}
            <div className="pl-12 sm:pl-16 md:pl-8 md:w-1/2">
              <h4 className="text-[14px] sm:text-[16px] font-bold text-foreground mb-1">{step.title}</h4>
              <p className="text-[12px] sm:text-[14px] text-brand-ink-3 leading-relaxed">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
