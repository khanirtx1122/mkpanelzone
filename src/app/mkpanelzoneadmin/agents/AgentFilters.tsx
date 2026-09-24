"use client";

import { FilterBar } from "@/components/admin/FilterBar";

/**
 * AgentFilters — configuration layer over the shared FilterBar.
 * Agent status values are stored uppercase in the database ("ACTIVE" /
 * "DISABLED") so the option values match exactly.
 */
export function AgentFilters() {
  return (
    <FilterBar
      searchPlaceholder="Search agent username…"
      selects={[
        {
          key: "status",
          label: "Status",
          options: [
            { value: "ACTIVE", label: "Active" },
            { value: "DISABLED", label: "Disabled" },
          ],
        },
      ]}
    />
  );
}
