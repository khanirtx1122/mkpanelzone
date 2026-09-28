"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { FreePanelClaim } from "./FreePanelClaim";
import type { FreePanelConfigPublic, ExistingClaim } from "./FreePanelClaim";

interface FreePanelContextValue {
  /** Opens the claim flow (safe to call anytime; no-op while offer is disabled). */
  openFreePanel: () => void;
  /** True when the offer is enabled and scheduled — used by the header CTA. */
  available: boolean;
}

const FreePanelContext = createContext<FreePanelContextValue>({
  openFreePanel: () => {},
  available: false,
});

export function useFreePanel() {
  return useContext(FreePanelContext);
}

const VISITOR_KEY = "mk_free_panel_seen_ever";

export function FreePanelProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FreePanelConfigPublic | null>(null);
  const [claim, setClaim] = useState<ExistingClaim | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/free-panel")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setConfig(data.config);
        setClaim(data.claim ?? null);

        // Auto-popup only when the offer is live, the visitor hasn't already
        // claimed, and the configured frequency allows it.
        const cfg = data.config as FreePanelConfigPublic;
        if (!cfg?.enabled || data.claim) return;

        let allow = true;
        try {
          if (cfg.popupFrequency === "ONCE_PER_SESSION") {
            if (sessionStorage.getItem("mk_free_panel_dismissed") === "1") allow = false;
          } else if (cfg.popupFrequency === "ONCE_PER_VISITOR") {
            if (localStorage.getItem(VISITOR_KEY) === "1") allow = false;
          }
          // EVERY_VISIT → always allow
        } catch {
          // storage unavailable — default to showing
        }
        if (!allow) return;

        const delay = Math.min(Math.max(cfg.popupDelaySeconds ?? 4, 0), 60) * 1000;
        timerRef.current = setTimeout(() => {
          if (!cancelled) setOpen(true);
        }, delay);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Respect the session: don't re-interrupt on internal navigation.
    try {
      const cfg = config;
      if (cfg?.popupFrequency === "ONCE_PER_SESSION") {
        sessionStorage.setItem("mk_free_panel_dismissed", "1");
      } else if (cfg?.popupFrequency === "ONCE_PER_VISITOR") {
        localStorage.setItem(VISITOR_KEY, "1");
      }
    } catch {
      // storage unavailable — skip persistence
    }
  }, [config]);

  const openFreePanel = useCallback(() => {
    // Offer disabled entirely, or enabled but inventory exhausted (unless the
    // visitor already has a claim — they can still recover their key).
    if (!config?.enabled) return;
    // Re-fetch the visitor's claim so a returning claimer lands on the
    // success view (initial mount data can be stale after a claim was issued).
    fetch("/api/free-panel")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.claim) setClaim(data.claim);
      })
      .catch(() => {})
      .finally(() => setOpen(true));
  }, [config]);

  return (
    <FreePanelContext.Provider value={{ openFreePanel, available: !!config?.enabled }}>
      {children}
      {open && config && (
        <FreePanelClaim config={config} initialClaim={claim} onClose={handleClose} />
      )}
    </FreePanelContext.Provider>
  );
}

export default FreePanelProvider;
