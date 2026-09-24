"use client";

import * as React from "react";

/**
 * TabbedForm — a tab rail over a set of panels inside one `<form>`.
 *
 * Spec §24 asks for a tabbed product editor; this is the reusable shell for it.
 *
 * The important detail: inactive panels are hidden with CSS that is only
 * active when `html[data-js="on"]` is set. Hidden form controls are still
 * *successful* controls and are submitted normally, so tabbing never drops a
 * field from the payload. Panels are also kept mounted, so switching tabs
 * preserves everything the user has typed — including local state inside the
 * uploaders.
 *
 * Progressive enhancement: without JavaScript the `data-js` flag is never set,
 * so no panel is hidden — every field stays visible and editable, and the whole
 * form still submits. The tab rail is simply inert decoration in that case.
 */

export interface AdminTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Short line shown to the right of the tab rail. */
  hint?: string;
}

export interface TabbedFormProps {
  tabs: AdminTab[];
  /** One panel per tab, in the same order. */
  children: React.ReactNode;
  className?: string;
}

export function TabbedForm({ tabs, children, className = "" }: TabbedFormProps) {
  const panels = React.Children.toArray(children);
  const [active, setActive] = React.useState(0);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const count = Math.min(tabs.length, panels.length);

  const focusTab = (index: number) => {
    const next = (index + count) % count;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTab(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab(active - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(count - 1);
    }
  };

  return (
    <div className={className}>
      {/* Tab rail */}
      <div
        role="tablist"
        aria-label="Form sections"
        onKeyDown={onKeyDown}
        className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-border-subtle pb-3"
      >
        {tabs.slice(0, count).map((tab, index) => {
          const selected = index === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={[
                "inline-flex items-center gap-2 rounded-[11px] px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]",
                selected
                  ? "border border-border-strong bg-foreground/[0.08] text-foreground"
                  : "border border-transparent text-brand-ink-3 hover:bg-foreground/[0.045] hover:text-foreground",
              ].join(" ")}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panels — hidden by CSS only, never unmounted */}
      {panels.slice(0, count).map((panel, index) => (
        <div
          key={tabs[index]?.id ?? index}
          role="tabpanel"
          id={`panel-${tabs[index]?.id ?? index}`}
          aria-labelledby={`tab-${tabs[index]?.id ?? index}`}
          data-tabpanel=""
          data-active={index === active ? "true" : "false"}
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
