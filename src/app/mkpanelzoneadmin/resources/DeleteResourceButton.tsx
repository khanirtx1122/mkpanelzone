"use client";

import { Trash2 } from "lucide-react";

export function DeleteResourceButton({ resource }: { resource: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(`Delete resource "${resource}"? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
      className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
    >
      <Trash2 size={16} /> Delete Resource
    </button>
  );
}
