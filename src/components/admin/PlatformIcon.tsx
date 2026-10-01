"use client";

import {
  Smartphone,
  Apple,
  Monitor,
  Tablet,
  Globe,
  Gamepad2,
  Layers,
  type LucideIcon,
} from "lucide-react";

/**
 * Controlled icon system for platforms.
 *
 * The owner picks from a fixed set of keys — arbitrary markup is never stored
 * or rendered. Unknown keys fall back to a neutral icon so a hand-edited row
 * can never break the UI.
 */
const ICONS: Record<string, LucideIcon> = {
  android: Smartphone,
  apple: Apple,
  monitor: Monitor,
  tablet: Tablet,
  globe: Globe,
  gamepad: Gamepad2,
  layers: Layers,
};

export function platformIcon(key: string | null | undefined): LucideIcon {
  if (!key) return Layers;
  return ICONS[key] ?? Layers;
}

export const PLATFORM_ICON_OPTIONS = [
  { key: "android", label: "Android / Phone" },
  { key: "apple", label: "Apple" },
  { key: "monitor", label: "Monitor / PC" },
  { key: "tablet", label: "Tablet" },
  { key: "globe", label: "Web / Globe" },
  { key: "gamepad", label: "Console" },
  { key: "layers", label: "Generic" },
] as const;
