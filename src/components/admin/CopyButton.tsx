"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/** Copy button with instant COPY → ✓ COPIED feedback (1.4s) + optional toast. */
export function CopyButton({
  value,
  label = "Copy",
  className = "",
  onCopied,
}: {
  value: string;
  label?: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for older webviews
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    onCopied?.();
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : `Copy ${label}`}
      className={`admin-press inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase border transition-colors ${
        copied
          ? "bg-green-500/15 text-green-400 border-green-500/30"
          : "bg-white/5 hover:bg-white/10 text-brand-ink-2 hover:text-white border-white/10"
      } ${className}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : label}
    </button>
  );
}
