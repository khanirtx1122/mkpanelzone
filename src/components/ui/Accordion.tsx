"use client";

import { useState, useId } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Accordion — FAQ disclosure.
 *
 * Uses a grid-template-rows transition so the open/close animates without
 * measuring or animating height (no layout thrash), plus proper
 * aria-controls / region wiring.
 */
export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="w-full divide-y divide-[color:var(--border-subtle)] overflow-hidden rounded-[16px] border border-border-subtle bg-surface-raised">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={index} className="transition-colors duration-200">
            <h3>
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-5 px-5 py-[18px] text-left transition-colors hover:bg-foreground/[0.02] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--accent)] sm:px-6 sm:py-5"
              >
                <span
                  className={`text-[14px] font-bold leading-snug tracking-[-0.008em] transition-colors sm:text-[15px] ${
                    isOpen ? "text-foreground" : "text-brand-ink-2"
                  }`}
                >
                  {item.question}
                </span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-[transform,color,border-color] duration-300 ${
                    isOpen
                      ? "rotate-180 border-[rgba(77,163,255,0.34)] text-brand-ink-2"
                      : "border-border-subtle text-brand-ink-4"
                  }`}
                  aria-hidden
                >
                  <ChevronDown size={14} />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 pr-12 text-[13px] leading-relaxed text-brand-ink-3 sm:px-6 sm:pb-6">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
