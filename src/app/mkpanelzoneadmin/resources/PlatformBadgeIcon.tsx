"use client";

import { platformIcon } from "@/components/admin/PlatformIcon";
import type { LucideIcon } from "lucide-react";

/**
 * Renders a platform icon by its stored `iconKey`.
 *
 * Platform icons live in a client module (lucide components aren't
 * serialisable across the server boundary), so server components delegate
 * rendering here instead of hardcoding an icon per platform.
 */
export function PlatformBadgeIcon({
  iconKey,
  size = 24,
  className,
}: {
  iconKey: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const Icon: LucideIcon = platformIcon(iconKey);
  return <Icon size={size} className={className} />;
}
