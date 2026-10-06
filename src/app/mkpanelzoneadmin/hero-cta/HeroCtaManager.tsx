"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ArrowUp, ArrowDown, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { saveHeroCtas, type HeroCtaInput } from "@/app/mkpanelzoneadmin/actions";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useActionLifecycle } from "@/components/admin/AdminButton";

const PLATFORMS = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "tiktok", label: "TikTok" },
  { key: "discord", label: "Discord" },
  { key: "instagram", label: "Instagram" },
  // Additional platforms are supported but listed after the four hero states.
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "telegram", label: "Telegram" },
  { key: "x", label: "X / Twitter" },
];

/** The four states the hero rotation is specified around. */
const PRIMARY_PLATFORMS = ["whatsapp", "tiktok", "discord", "instagram"];

const SUGGESTED: Record<string, string> = {
  whatsapp: "WhatsApp Channel",
  tiktok: "Follow on TikTok",
  discord: "Join Discord",
  instagram: "Follow on Instagram",
};

/** Colour swatch so the Owner can see which identity each row will render. */
const SWATCH: Record<string, string> = {
  whatsapp: "#25D366",
  tiktok: "#0B0B0D",
  discord: "#5865F2",
  instagram: "#E1306C",
  facebook: "#1877F2",
  youtube: "#FF0000",
  telegram: "#229ED9",
  x: "#0F1419",
};

/**
 * HERO CTA ROTATOR MANAGER.
 *
 * Explicit, obvious control over the compact hero chip: which platforms rotate,
 * what each one says, and where it points — with a live preview of the exact
 * chip the public hero renders. Order controls the rotation sequence.
 */
export function HeroCtaManager({ initial }: { initial: HeroCtaInput[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { run, isPending } = useActionLifecycle();

  // Always show every platform as a row so nothing is "missing" — empty rows
  // simply do not reach the public hero.
  const [rows, setRows] = useState<HeroCtaInput[]>(() => {
    const byPlatform = new Map(initial.map((c) => [c.platform, c]));
    const ordered = initial.filter((c) => c.platform);
    const rest = PLATFORMS.filter((p) => !byPlatform.has(p.key)).map((p) => ({
      platform: p.key,
      label: "",
      url: "",
      enabled: false,
    }));
    return [...ordered, ...rest];
  });

  const update = (i: number, patch: Partial<HeroCtaInput>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const move = (i: number, dir: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      const t = i + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[i], next[t]] = [next[t], next[i]];
      return next;
    });
  };

  const live = rows.filter((r) => r.enabled && /^https?:\/\//i.test(r.url));

  /** Per-platform state, so the Owner can see exactly why a platform is absent
      instead of guessing. */
  const statusOf = (platform: string): "ACTIVE" | "MISSING URL" | "DISABLED" | "OFF" => {
    const row = rows.find((r) => r.platform === platform);
    if (!row) return "OFF";
    if (!row.enabled) return "DISABLED";
    return /^https?:\/\//i.test(row.url) ? "ACTIVE" : "MISSING URL";
  };

  const primaryStatus = PRIMARY_PLATFORMS.map((p) => ({
    platform: p,
    label: PLATFORMS.find((x) => x.key === p)?.label ?? p,
    status: statusOf(p),
  }));

  const handleSave = async () => {
    const result = await run(() => saveHeroCtas(rows));
    if (!result) return;
    if (result.error) {
      toast.error("Could not save hero CTAs", result.error);
      return;
    }
    toast.success(
      "Hero CTA saved",
      live.length === 0
        ? "No platform is live yet — the hero will show its fallback badge."
        : `${live.length} platform(s) rotating: ${live.map((l) => l.platform).join(" → ")}`,
    );
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {/* STATUS SUMMARY — the Owner must never have to guess why a platform
          is not appearing on the homepage. */}
      <div className="p-5 rounded-xl border border-white/10 bg-black/30">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-3">
          Rotation status
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {primaryStatus.map(({ platform, label, status }) => {
            const tone =
              status === "ACTIVE"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : status === "MISSING URL"
                  ? "border-red-500/35 bg-red-500/10 text-red-400"
                  : "border-white/10 bg-white/[0.03] text-brand-ink-3";
            return (
              <div key={platform} className={`rounded-lg border px-3 py-2.5 ${tone}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SWATCH[platform] }} />
                  <span className="text-[11px] font-bold text-white truncate">{label}</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest">{status}</span>
              </div>
            );
          })}
        </div>
        {primaryStatus.some((s) => s.status === "MISSING URL") && (
          <p className="mt-3 text-[11px] text-red-400 leading-relaxed flex items-start gap-1.5">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            A platform is enabled but has no valid link, so it is skipped on the homepage. Paste its
            https:// URL in the row below and save to bring it into the rotation.
          </p>
        )}
        {primaryStatus.every((s) => s.status === "DISABLED") && (
          <p className="mt-3 text-[11px] text-amber-400 leading-relaxed">
            Nothing is enabled — the hero will show its fallback badge instead of the rotation.
          </p>
        )}
      </div>

      {/* Live preview — exactly the 34px chip the public hero renders */}
      <div className="p-5 rounded-xl border border-white/10 bg-black/30">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-3">
          Live preview (hero chip)
        </p>
        {live.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle size={14} />
            Nothing is live — the hero will fall back to the static badge.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {live.map((r) => (
              <span
                key={r.platform}
                className="inline-flex items-center gap-2 pl-2.5 pr-3 h-[34px] rounded-full border text-[10px] font-extrabold uppercase tracking-[0.13em]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: SWATCH[r.platform] + "66",
                  color: "#E8EEF7",
                }}
              >
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: SWATCH[r.platform] }} />
                {r.label?.trim() || SUGGESTED[r.platform] || r.platform}
              </span>
            ))}
            <span className="text-[10px] font-mono text-brand-ink-3 ml-1">
              rotates every 4.5s →
            </span>
          </div>
        )}
      </div>

      {/* Rows */}
      <div className="space-y-2.5">
        {rows.map((row, i) => {
          const invalid = row.enabled && !/^https?:\/\//i.test(row.url);
          return (
            <div
              key={row.platform}
              className="p-3.5 rounded-xl border bg-white/[0.02] grid grid-cols-1 lg:grid-cols-[auto_1.1fr_1.6fr_auto_auto] gap-3 items-center"
              style={{ borderColor: invalid ? "rgba(239,68,68,0.35)" : "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Move up"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1 text-brand-ink-3 hover:text-white disabled:opacity-25"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  className="p-1 text-brand-ink-3 hover:text-white disabled:opacity-25"
                >
                  <ArrowDown size={14} />
                </button>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: SWATCH[row.platform] }}
                  aria-hidden
                />
                <span className="text-xs font-bold text-white capitalize min-w-[70px]">
                  {row.platform}
                </span>
              </div>

              <input
                type="text"
                value={row.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder={SUGGESTED[row.platform] || "Button label"}
                maxLength={40}
                className="bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50"
              />

              <input
                type="url"
                value={row.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="https://…"
                className={`bg-black border rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white placeholder-brand-ink-3 focus:outline-none font-mono ${
                  invalid ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-brand-blue-500/50"
                }`}
              />

              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => update(i, { enabled: e.target.checked })}
                  className="w-4 h-4 accent-green-500"
                />
                Enabled
              </label>

              <span className="text-[10px] font-mono whitespace-nowrap">
                {row.enabled && /^https?:\/\//i.test(row.url) ? (
                  <span className="inline-flex items-center gap-1 text-green-400">
                    <CheckCircle2 size={12} /> live
                  </span>
                ) : invalid ? (
                  <span className="inline-flex items-center gap-1 text-red-400">
                    <AlertTriangle size={12} /> needs URL
                  </span>
                ) : (
                  <span className="text-brand-ink-3">off</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          aria-busy={isPending}
          className="admin-press inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] rounded-xl text-xs font-bold uppercase tracking-wider bg-brand-blue-500 hover:bg-brand-blue-600 text-white disabled:opacity-60"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isPending ? "Saving…" : "Save Hero CTA"}
        </button>
        <p className="text-[11px] text-brand-ink-3 font-mono flex items-center gap-1.5">
          <Sparkles size={12} /> Only enabled entries with a valid https URL reach the public hero.
        </p>
      </div>
    </div>
  );
}
