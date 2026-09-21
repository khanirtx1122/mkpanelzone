"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="w-full space-y-2">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className={`border rounded-lg transition-colors duration-300 ${isOpen ? 'bg-surface border-border-strong' : 'bg-transparent border-border-subtle hover:border-border-strong'}`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-neon-blue rounded-lg"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-foreground text-[13px] sm:text-[15px]">{item.question}</span>
              <ChevronDown 
                size={16} 
                className={`text-brand-ink-3 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-foreground' : ''}`}
              />
            </button>
            <div 
              className="grid transition-all duration-300 ease-in-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="p-4 pt-0 text-brand-ink-3 text-[12px] sm:text-[14px] leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
