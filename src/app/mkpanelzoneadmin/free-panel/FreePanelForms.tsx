"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminToast } from "@/components/admin/AdminToast";

/**
 * Announces the outcome of the last free-panel server action (which completes
 * with a redirect carrying result params) as premium toasts. Rendered once on
 * the free-panel page.
 */
export function FreePanelResultToasts() {
  const toast = useAdminToast();
  const params = useSearchParams();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = params.toString();
    if (!key || key === lastKey.current) return;
    lastKey.current = key;

    const imported = params.get("imported");
    if (imported !== null) {
      const skipped = Number(params.get("skipped") ?? 0);
      const invalid = Number(params.get("invalid") ?? 0);
      const parts: string[] = [];
      if (skipped > 0) parts.push(`${skipped} duplicate${skipped === 1 ? "" : "s"} skipped`);
      if (invalid > 0) parts.push(`${invalid} invalid format skipped`);
      toast.success(
        `${imported} key${imported === "1" ? "" : "s"} imported`,
        parts.length ? parts.join(" · ") : "Key inventory updated."
      );
      return;
    }

    const generated = params.get("generated");
    if (generated !== null) {
      const requested = Number(params.get("requested") ?? 0);
      const skipped = Math.max(requested - Number(generated), 0);
      toast.success(
        `${generated} key${generated === "1" ? "" : "s"} generated`,
        skipped > 0 ? `${skipped} skipped (rare collision).` : "Format: XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX"
      );
      return;
    }

    if (params.get("error") === "import") {
      toast.error("Import failed", "Please check the input and try again.");
    } else if (params.get("error") === "generate") {
      toast.error("Generation failed", "Please try again.");
    }
  }, [params, toast]);

  return null;
}
