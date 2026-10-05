"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Save, Share2 } from "lucide-react";
import { saveSocialLinks, type SocialLink } from "@/app/mkpanelzoneadmin/actions";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useActionLifecycle } from "@/components/admin/AdminButton";

const PLATFORMS = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "discord", label: "Discord" },
  { key: "tiktok", label: "TikTok" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X / Twitter" },
  { key: "telegram", label: "Telegram" },
];

/** Footer/social link editor — one atomic save, server-validated URLs. */
export function SocialLinksManager({ initial }: { initial: SocialLink[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { run, isPending } = useActionLifecycle();
  const [rows, setRows] = useState<SocialLink[]>(initial);

  const update = (index: number, patch: Partial<SocialLink>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSave = async () => {
    try {
      const result = await run(() => saveSocialLinks(rows));
      if (result?.error) {
        toast.error("Could not save links", result.error);
        return;
      }
      toast.success("Social links saved", "The footer updates on the public site automatically.");
      router.refresh();
    } catch {
      toast.error("Action failed", "Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <p className="text-sm text-brand-ink-3">No social links yet. Add one below.</p>
      )}

      {rows.map((row, index) => (
        <div key={index} className="p-4 rounded-xl bg-black/20 border border-white/5 grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto_auto] gap-3 items-center">
          <select
            value={row.platform}
            onChange={(e) => update(index, { platform: e.target.value })}
            className="bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
          >
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>

          <input
            type="url"
            value={row.url}
            onChange={(e) => update(index, { url: e.target.value })}
            placeholder="https://…"
            className="bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50 font-mono"
          />

          <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => update(index, { enabled: e.target.checked })}
              className="w-4 h-4 accent-green-500"
            />
            Visible
          </label>

          <button
            type="button"
            aria-label="Remove link"
            onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
            className="admin-press p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 justify-self-start sm:justify-self-end"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { platform: "whatsapp", url: "", enabled: true }])}
          className="admin-press inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-white"
        >
          <Plus size={15} /> Add Link
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          aria-busy={isPending}
          className="admin-press inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider bg-brand-blue-500 hover:bg-brand-blue-600 text-white disabled:opacity-60"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isPending ? "Saving…" : "Save Social Links"}
        </button>
      </div>

      <p className="text-[11px] text-brand-ink-3 font-mono flex items-center gap-1.5">
        <Share2 size={12} /> Known platforms render with their proper logos on the public footer.
      </p>
    </div>
  );
}
