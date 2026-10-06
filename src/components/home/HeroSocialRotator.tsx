"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SOCIAL_META } from "@/lib/social";
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

export type RotatorLink = { platform: string; url: string };

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

const ROTATE_MS = 4500;

/**
 * HERO COMPACT CTA ROTATOR.
 *
 * Same footprint as the previous static hero pill — no layout shift, no side
 * panels. One social CTA is visible at a time, cross-fading every ~4.5s and
 * looping forever. Links come from Admin (social_links); each state carries its
 * own accent so WhatsApp/TikTok/Discord/Instagram read distinctly.
 *
 * The outer container has a fixed height and a min-width, so swapping items can
 * never move the headline below it.
 */
export function HeroSocialRotator({ links }: { links: RotatorLink[] }) {
  const items = useMemo(
    () => links.filter((l) => SOCIAL_META[l.platform] && ICONS[l.platform]),
    [links],
  );

  const [index, setIndex] = useState(0);
  /* Reduced-motion is read through useSyncExternalStore: no setState-in-effect,
     no ref read during render, and the server snapshot stays "false" so
     hydration matches. */
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

  return (
    <div className="flex justify-center mb-4" style={{ minHeight: 34 }}>
      <div className="relative h-[34px]" style={{ minWidth: 196 }}>
        {items.map((item, i) => {
          const meta = SOCIAL_META[item.platform];
          const Icon = ICONS[item.platform];
          const active = i === index % items.length;

          return (
            <a
              key={item.platform}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
              data-analytics-click={`cta:hero-${item.platform}`}
              className="hero-cta absolute inset-x-0 mx-auto inline-flex items-center gap-2 pl-2.5 pr-2 h-[34px] rounded-full border whitespace-nowrap focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2"
              style={{
                width: "fit-content",
                background: meta.accentSoft,
                borderColor: meta.border,
                color: meta.text,
                boxShadow: active ? `0 0 14px -2px ${meta.border}` : "none",
                opacity: active ? 1 : 0,
                transform: active
                  ? "translateY(0) scale(1)"
                  : reduced
                    ? "none"
                    : "translateY(4px) scale(0.97)",
                transition: reduced
                  ? "opacity 0.2s linear"
                  : "opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
                pointerEvents: active ? "auto" : "none",
              }}
            >
              <span
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ background: meta.accent, boxShadow: `0 0 7px ${meta.border}` }}
              />
              <Icon size={13} />
              <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.14em] uppercase">
                {meta.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
