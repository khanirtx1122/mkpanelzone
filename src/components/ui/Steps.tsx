import * as React from "react";
import { Check } from "lucide-react";

/**
 * Steps — numbered process stepper.
 *
 * Rebuilt from the previous centre-line layout (which produced a stray
 * invisible alignment column and an inconsistent connector) into a clean
 * vertical rail with a real progress line that stops at the final step.
 */
export function Steps({
  steps,
}: {
  steps: { title: string; description: string }[];
}) {
  return (
    <ol className="relative space-y-7">
      {/* Rail — drawn between the first and last marker only */}
      <span
        className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-[color:var(--text-4)] via-border-strong to-transparent"
        aria-hidden
      />

      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={index} className="relative flex items-start gap-4">
            <span
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[12.5px] font-extrabold tabular ${
                isLast
                  ? "border-[rgba(61,220,151,0.34)] bg-[color:var(--status-success-bg)] text-[color:var(--status-success-text)]"
                  : "border-[rgba(77,163,255,0.30)] bg-[color:var(--surface-raised)] text-brand-ink-2"
              }`}
            >
              {isLast ? <Check size={15} aria-hidden /> : index + 1}
            </span>

            <div className="min-w-0 pt-1">
              <h4 className="text-[14.5px] font-bold tracking-[-0.01em] text-foreground">
                {step.title}
              </h4>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-brand-ink-3">
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
