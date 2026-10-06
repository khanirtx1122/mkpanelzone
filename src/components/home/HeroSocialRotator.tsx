"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  WhatsAppIcon,
  TikTokIcon,
  DiscordIcon,
  InstagramIcon,
  FacebookIcon,
  YouTubeIcon,
  TelegramIcon,
  XIcon,
} from "@/components/ui/SocialIcons";

export type RotatorLink = { platform: string; url: string; label?: string };

const ICONS: Record<string, (p: { size?: number }) => React.ReactElement> = {
  whatsapp: WhatsAppIcon,
  tiktok: TikTokIcon,
  discord: DiscordIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
  telegram: TelegramIcon,
  x: XIcon,
};

/** Fallback labels — the owner can override each one in Admin. */
const DEFAULT_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp Channel",
  tiktok: "Follow on TikTok",
  discord: "Join Discord",
  instagram: "Follow on Instagram",
  facebook: "Follow on Facebook",
  youtube: "Watch on YouTube",
  telegram: "Join Telegram",
  x: "Follow on X",
};

const ROTATE_MS = 4500;

/**
 * HERO COMPACT CTA ROTATOR.
 *
 * Occupies the same 34px pill as the original static badge: one CTA visible at
 * a time, cross-fading every ~4.5s, looping forever. Only the icon, text and
 * internal surface change — the outer container is a fixed height with a
 * min-width, so the headline below can never move.
 *
 * Visual identity per platform (including genuinely separate light and dark
 * treatments) lives in globals.css keyed on `data-platform`, so a theme switch
 * repaints instantly with no React re-render.
 *
 * Items come from Admin; platforms without a valid URL are not rendered at all,
 * so a dead CTA can never appear.
 */
export function HeroSocialRotator({ links }: { links: RotatorLink[] }) {
  const items = useMemo(
    () => links.filter((l) => ICONS[l.platform] && /^https?:\/\//i.test(l.url)),
    [links],
  );

  const [index, setIndex] = useState(0);
  const reduced = useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    },
    () => {
      try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        return false;
      }
    },
    () => false,
  );

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;

  const activeIndex = index % items.length;

  return (
    <div className="flex justify-center mb-4" style={{ minHeight: 34 }}>
      {/* Fixed-size stage: no dimension animation, ever. */}
      <div className="relative h-[34px]" style={{ minWidth: 196 }}>
        {items.map((item, i) => {
          const Icon = ICONS[item.platform];
          const active = i === activeIndex;
          const label = item.label?.trim() || DEFAULT_LABEL[item.platform] || item.platform;

          return (
            <a
              key={item.platform}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
              data-platform={item.platform}
              data-inactive={active ? undefined : "true"}
              data-analytics-click={`cta:hero-${item.platform}`}
              className="hero-social-chip absolute inset-x-0 mx-auto inline-flex items-center gap-2 pl-2.5 pr-3 h-[34px] rounded-full border whitespace-nowrap focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2"
              style={{
                width: "fit-content",
                opacity: active ? 1 : 0,
                transform: active
                  ? "translateY(0) scale(1)"
                  : reduced
                    ? "none"
                    : "translateY(5px) scale(0.98)",
                pointerEvents: active ? "auto" : "none",
              }}
            >
              <span className="hero-social-dot w-[6px] h-[6px] rounded-full shrink-0" />
              <span className="hero-social-icon inline-flex shrink-0">
                <Icon size={13} />
              </span>
              <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.13em] uppercase">
                {label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
