"use client";

import { FilterBar } from "@/components/admin/FilterBar";

/**
 * CustomerFilters — thin configuration layer over the shared FilterBar.
 *
 * Kept as a named export so the page's import path is unchanged. The actual
 * URL-param semantics live in FilterBar; this file only declares which
 * dimensions customers can be sliced by.
 */
export function CustomerFilters({
  agents = [],
}: {
  agents?: { id: string; username: string }[];
}) {
  return (
    <FilterBar
      searchPlaceholder="Search customer identifier…"
      selects={[
        {
          key: "platform",
          label: "Platform",
          options: [
            { value: "ANDROID", label: "Android" },
            { value: "IOS", label: "iOS" },
            { value: "PC", label: "PC" },
          ],
        },
        {
          key: "status",
          label: "Status",
          options: [
            { value: "active", label: "Active" },
            { value: "disabled", label: "Disabled" },
          ],
        },
        ...(agents.length
          ? [
              {
                key: "agentId",
                label: "Creator",
                options: agents.map((a) => ({
                  value: a.id,
                  label: a.username,
                })),
              },
            ]
          : []),
      ]}
    />
  );
}
