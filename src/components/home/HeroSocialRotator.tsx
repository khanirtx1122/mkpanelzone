"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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

/* Timing: a 2.8s cycle = ~2.45s fully visible, 175ms fade out, swap, 175ms
   fade in. Fast and premium, with no long gap where the chip is invisible. */
const CYCLE_MS = 2800;
const FADE_MS = 175;

/**
 * HERO COMPACT CTA ROTATOR.
 *
 * EXACTLY ONE pill exists in the DOM at all times — one container, one
 * position, one footprint. There is a single persistent <a>; only its icon,
 * label, href and platform theme attribute change as the index advances.
 *
 * This replaces the previous approach, which rendered one absolutely
 * positioned element PER platform. Because each label has a different width,
 * those elements did not resolve to identical centres and could appear offset
 * or overflowing, producing the "multiple pills in different places" symptom.
 * With a single element that problem cannot occur: there is nothing else to
 * position.
 *
 * Motion is opacity-only. The wrapper has a fixed 34px height, so the headline
 * below can never move and the hero height never changes.
 *
 * Items come from Admin; platforms without a valid URL are never rendered.
 */
export function HeroSocialRotator({ links }: { links: RotatorLink[] }) {
  const items = useMemo(
    () => links.filter((l) => ICONS[l.platform] && /^https?:\/\//i.test(l.url)),
    [links],
  );

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const fadeTimer = useRef<number | null>(null);

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

  /* The index is clamped during render rather than in an effect: if the Owner
     disables a platform in Admin and the list shrinks, we simply read a valid
     entry instead of scheduling a corrective state update. */
  const safeIndex = items.length > 0 ? Math.min(index, items.length - 1) : 0;

  /* Rotation. A single interval drives: fade out → swap content → fade in.
     With one item there is no rotation at all, so no pointless transitions —
     `visible` already starts true, so the single pill simply stays put. */
  useEffect(() => {
    if (items.length < 2) return;

    const id = window.setInterval(() => {
      setVisible(false); // fade out
      fadeTimer.current = window.setTimeout(() => {
        setIndex((i) => (i + 1) % items.length); // swap content in place
        setVisible(true); // fade in
      }, FADE_MS);
    }, CYCLE_MS);

    return () => {
      window.clearInterval(id);
      if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[safeIndex];
  const Icon = ICONS[current.platform];
  const label = current.label?.trim() || DEFAULT_LABEL[current.platform] || current.platform;

  return (
    /* Fixed-height, horizontally centred slot. Nothing here depends on the
       platform, so the pill can never move. */
    <div className="flex justify-center mb-4" style={{ height: 34 }}>
      <a
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        data-platform={current.platform}
        data-analytics-click={`cta:hero-${current.platform}`}
        aria-label={label}
        className="hero-social-chip inline-flex items-center gap-2 pl-2.5 pr-3 h-[34px] rounded-full border whitespace-nowrap focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2"
        style={{
          opacity: visible ? 1 : 0,
          transition: reduced ? "opacity 90ms linear" : `opacity ${FADE_MS}ms linear`,
          willChange: "opacity",
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
    </div>
  );
}
