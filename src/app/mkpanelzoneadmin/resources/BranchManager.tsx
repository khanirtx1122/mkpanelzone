"use client";

import { useState } from "react";
import { ChevronDown, Settings, Power, PowerOff, Loader2, CheckCircle2 } from "lucide-react";
import { adminUpdateBranch, adminToggleBranchEnabled } from "../actions";
import type { PlatformBranch } from "@prisma/client";

export function BranchManager({ branch, compact = false }: { branch: PlatformBranch; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEnabled = async () => {
    setToggling(true);
    setError(null);
    const fd = new FormData();
    fd.set("branchId", branch.id);
    const res = await adminToggleBranchEnabled(fd);
    setToggling(false);
    if (res?.error) setError(res.error);
  };

  const save = async (formData: FormData) => {
    setSaving(true);
    setSaved(false);
    setError(null);
    formData.set("branchId", branch.id);
    const res = await adminUpdateBranch(formData);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`bg-black/20 ${compact ? "rounded-xl border border-white/5" : "border-b border-white/5"}`}>
      <div className={`flex items-center justify-between gap-3 ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors uppercase tracking-wider"
        >
          <Settings size={15} className="text-brand-blue-400" />
          <span className={compact ? "text-xs" : ""}>{compact ? "Settings" : `Branch settings — ${branch.name}`}</span>
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={toggleEnabled}
          disabled={toggling}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded transition-colors disabled:opacity-50 ${
            branch.isEnabled
              ? "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20"
              : "text-green-400 bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
          }`}
        >
          {toggling ? <Loader2 size={13} className="animate-spin" /> : branch.isEnabled ? <PowerOff size={13} /> : <Power size={13} />}
          {branch.isEnabled ? "Disable Branch" : "Enable Branch"}
        </button>
      </div>

      {open && (
        <div className="px-4 pb-5 pt-1">
          <form action={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 mb-1.5">Branch Name</label>
              <input
                name="name"
                defaultValue={branch.name}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 mb-1.5">Sort Order</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={branch.sortOrder}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 mb-1.5">Description (shown on selection screen)</label>
              <input
                name="description"
                defaultValue={branch.description || ""}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              />
            </div>

            <div className="md:col-span-2 pt-2 border-t border-white/5">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none mb-4">
                <input type="checkbox" name="warningEnabled" defaultChecked={branch.warningEnabled} className="w-4 h-4 accent-[var(--color-brand-blue-500)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Show safety notice after login</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 mb-1.5">Notice Title</label>
                  <input
                    name="warningTitle"
                    defaultValue={branch.warningTitle}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 mb-1.5">Button Text</label>
                  <input
                    name="warningButtonText"
                    defaultValue={branch.warningButtonText}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 mb-1.5">Notice Message</label>
                  <textarea
                    name="warningMessage"
                    defaultValue={branch.warningMessage}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3">
              {error && <span className="text-red-500 text-xs font-bold">{error}</span>}
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-bold">
                  <CheckCircle2 size={14} /> SAVED
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 disabled:opacity-50 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {saving ? "SAVING..." : "Save Branch"}
              </button>
            </div>
          </form>
        </div>
      )}
      {error && !open && (
        <p className="px-4 pb-3 text-red-500 text-xs font-bold">{error}</p>
      )}
    </div>
  );
}
