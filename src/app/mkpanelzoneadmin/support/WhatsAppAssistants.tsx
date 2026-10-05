"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Save, MessageCircle, ArrowUp, ArrowDown } from "lucide-react";
import { saveWhatsAppAssistants, type WhatsAppAssistant } from "@/app/mkpanelzoneadmin/actions";
import { useAdminToast } from "@/components/admin/AdminToast";
import { useActionLifecycle } from "@/components/admin/AdminButton";

/**
 * Multi-assistant WhatsApp editor: add / rename / renumber / enable /
 * reorder / delete. The whole list saves in one action — a single atomic
 * write instead of per-row round-trips.
 */
export function WhatsAppAssistants({ initial }: { initial: WhatsAppAssistant[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { run, isPending } = useActionLifecycle();
  const [rows, setRows] = useState<WhatsAppAssistant[]>(initial);

  const update = (index: number, patch: Partial<WhatsAppAssistant>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const move = (index: number, direction: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const result = await run(() => saveWhatsAppAssistants(rows));
      if (result?.error) {
        toast.error("Could not save assistants", result.error);
        return;
      }
      toast.success("Assistants saved", `${rows.filter((r) => r.number).length} contact(s) stored.`);
      router.refresh();
    } catch {
      toast.error("Action failed", "Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <p className="text-sm text-brand-ink-3">No assistants yet. Add one below.</p>
      )}

      {rows.map((row, index) => (
        <div key={index} className="p-4 rounded-xl bg-black/20 border border-white/5 grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_auto] gap-3 items-center">
          <div className="flex flex-col gap-1 text-brand-ink-3">
            <button type="button" aria-label="Move up" onClick={() => move(index, -1)} className="p-1 hover:text-white disabled:opacity-30" disabled={index === 0}>
              <ArrowUp size={14} />
            </button>
            <button type="button" aria-label="Move down" onClick={() => move(index, 1)} className="p-1 hover:text-white disabled:opacity-30" disabled={index === rows.length - 1}>
              <ArrowDown size={14} />
            </button>
          </div>

          <input
            type="text"
            value={row.name}
            onChange={(e) => update(index, { name: e.target.value })}
            placeholder="Assistant name"
            maxLength={60}
            className="bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50"
          />

          <input
            type="tel"
            inputMode="tel"
            value={row.number}
            onChange={(e) => update(index, { number: e.target.value })}
            placeholder="923001234567"
            className="bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50 font-mono"
          />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(e) => update(index, { enabled: e.target.checked })}
                className="w-4 h-4 accent-green-500"
              />
              On
            </label>
            <button
              type="button"
              aria-label="Remove assistant"
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              className="admin-press p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { name: "", number: "", enabled: true }])}
          className="admin-press inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-white"
        >
          <Plus size={15} /> Add Assistant
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          aria-busy={isPending}
          className="admin-press inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider bg-brand-blue-500 hover:bg-brand-blue-600 text-white disabled:opacity-60"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isPending ? "Saving…" : "Save Assistants"}
        </button>
      </div>

      <p className="text-[11px] text-brand-ink-3 font-mono flex items-center gap-1.5">
        <MessageCircle size={12} /> Numbers are digits-only international format. The Primary WhatsApp number above powers order and &quot;Having problem?&quot; CTAs; assistants appear in the support contact list.
      </p>
    </div>
  );
}
