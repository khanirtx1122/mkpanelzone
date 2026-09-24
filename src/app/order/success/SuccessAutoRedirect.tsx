"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Loader2, MessageCircle, ArrowRight } from "lucide-react";

/**
 * SuccessAutoRedirect — hands the customer off to WhatsApp.
 *
 * Behaviour preserved: reads the pending URL once from sessionStorage, clears
 * it so a refresh does not re-trigger, and navigates after a short delay.
 *
 * The one addition is a visible countdown. A 2-second silent redirect reads as
 * the page breaking if the browser is slow to switch apps, so the customer now
 * sees exactly what is about to happen and can go immediately instead of
 * waiting.
 */

const DELAY_SECONDS = 2;

const STORAGE_KEY = "pendingWhatsAppRedirect";

/**
 * Read-once, memoised accessor for the pending redirect.
 *
 * Memoised because `getSnapshot` may be called more than once per render and
 * must return a stable value — and because the read *consumes* the key (it is
 * removed so a refresh does not re-trigger the hand-off), which must not happen
 * twice.
 *
 * The module-level cache also replaces the previous `hasRedirected` ref, whose
 * only job was to stop the mount effect running twice.
 */
let cached: string | null | undefined;

function readPendingRedirect(): string | null {
  if (cached !== undefined) return cached;

  try {
    const url = sessionStorage.getItem(STORAGE_KEY);
    if (url) sessionStorage.removeItem(STORAGE_KEY);
    /* Guard against the literal string "null", which older builds could store
       when no WhatsApp number was configured — navigating to it would send the
       customer to /null. */
    cached = url && url !== "null" ? url : null;
  } catch (err) {
    console.error("Failed to read sessionStorage", err);
    cached = null;
  }

  return cached;
}

/* The value cannot change while mounted — the subscription is a no-op. */
const subscribeNever = () => () => {};

/** Server: nothing pending, so the panel does not render during SSR. */
const getServerPendingRedirect = () => null;

export function SuccessAutoRedirect() {
  /*
    Read through an external store rather than an effect. The value only exists
    on the client, which is exactly what `useSyncExternalStore` handles: the
    server snapshot is null so nothing renders during SSR, and the client
    snapshot is the stored URL — with no cascading render and no setState inside
    an effect.
  */
  const redirectUrl = useSyncExternalStore(
    subscribeNever,
    readPendingRedirect,
    getServerPendingRedirect
  );
  const [secondsLeft, setSecondsLeft] = useState(DELAY_SECONDS);

  /* Countdown then hand off. Both timers are cleared on unmount so a fast
     navigation away cannot fire a stray redirect. */
  useEffect(() => {
    if (!redirectUrl) return;

    const tick = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const go = window.setTimeout(() => {
      window.location.assign(redirectUrl);
    }, DELAY_SECONDS * 1000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(go);
    };
  }, [redirectUrl]);

  if (!redirectUrl) return null;

  return (
    <div className="mat-4 mt-6 mb-8 w-full max-w-lg rounded-[18px] p-5 sm:p-6">
      <div className="flex items-center justify-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border-subtle bg-foreground/[0.05] text-brand-ink-2">
          <MessageCircle size={16} aria-hidden />
        </span>
        <h2 className="text-[15px] font-extrabold tracking-tight text-foreground">
          Forwarding you to WhatsApp
        </h2>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-brand-ink-3">
        We are sending your order details to the team so you can attach the payment
        screenshot in the chat.
      </p>

      {/* Progress — the countdown is shown, not implied */}
      <div className="mt-4">
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-foreground/[0.07]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={DELAY_SECONDS}
          aria-valuenow={DELAY_SECONDS - secondsLeft}
          aria-label="Time until WhatsApp opens"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-400 transition-[width] duration-1000 ease-linear"
            style={{ width: `${((DELAY_SECONDS - secondsLeft) / DELAY_SECONDS) * 100}%` }}
          />
        </div>
        <p
          className="mt-2 text-center text-[11.5px] font-medium text-brand-ink-4"
          aria-live="polite"
        >
          {secondsLeft > 0 ? `Opening automatically in ${secondsLeft}s…` : "Opening WhatsApp…"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.location.assign(redirectUrl)}
        className="group mt-5 inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-[12px] text-[13px] font-bold tracking-[0.05em] text-white transition-[filter] duration-150 hover:brightness-[1.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
        style={{
          background: "linear-gradient(168deg,#3478E8 0%,#2457C5 58%,#1C3D91 100%)",
          boxShadow:
            "0 1px 2px rgba(0,0,0,.4), 0 6px 18px var(--ambient-strong), inset 0 1px 0 rgba(255,255,255,.14)",
        }}
      >
        <Loader2 size={16} className="animate-spin" aria-hidden />
        Open WhatsApp now
        <ArrowRight
          size={15}
          className="transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden
        />
      </button>

      <p className="mt-3 text-center text-[11.5px] leading-relaxed text-brand-ink-4">
        If nothing happens, tap the button above. Your order is already saved either way.
      </p>
    </div>
  );
}
