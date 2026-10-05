"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Square, Trash2, ExternalLink, ImageOff, Loader2 } from "lucide-react";
import { adminDeleteProofs } from "@/app/mkpanelzoneadmin/actions";
import { useAdminToast } from "@/components/admin/AdminToast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export type ProofItem = {
  key: string;
  source: "order" | "customer";
  id: string;
  path: string;
  url: string;
  exists: boolean;
  inlineVisible: boolean;
  /** Order number or customer identifier. */
  ref: string;
  /** Who it came from: checkout order or agent/reseller customer. */
  origin: string;
  date: string;
};

/**
 * Bulk-proof manager. Selection is fully local; deletion asks once, runs a
 * single server action, and reports exactly how many items succeeded —
 * storage policy failures are surfaced, never swallowed.
 */
export function ProofManager({ items }: { items: ProofItem[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const allSelected = items.length > 0 && selected.size === items.length;
  const missingCount = useMemo(() => items.filter((i) => !i.exists).length, [items]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.key)));
  };

  const onConfirmDelete = async () => {
    setDeleting(true);
    try {
      const refs = items
        .filter((i) => selected.has(i.key))
        .map((i) => ({ source: i.source, id: i.id, path: i.path }));
      const result = await adminDeleteProofs(refs);
      if (result.failed > 0) {
        toast.warning(
          `Deleted ${result.deleted} of ${refs.length}`,
          `${result.failed} could not be removed from storage — their records were kept so nothing disappears silently.`,
        );
      } else {
        toast.success(`Deleted ${result.deleted} proof${result.deleted === 1 ? "" : "s"}`, "Storage objects and references removed.");
      }
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error("Deletion failed", "Please try again.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selected.size} proof${selected.size === 1 ? "" : "s"}?`}
        body="The screenshot files are removed from storage and their order/customer references cleared. This cannot be undone."
        confirmLabel={`Delete ${selected.size}`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-black/20 border border-white/5">
        <button
          type="button"
          onClick={toggleAll}
          className="admin-press inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-white"
        >
          {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
          {allSelected ? "Deselect all" : "Select all visible"}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-brand-ink-3">
            {selected.size} selected{missingCount > 0 ? ` · ${missingCount} file${missingCount === 1 ? "" : "s"} already missing from storage` : ""}
          </span>
          <button
            type="button"
            disabled={selected.size === 0 || deleting}
            onClick={() => setConfirmOpen(true)}
            aria-busy={deleting}
            className="admin-press inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {deleting ? "Deleting…" : "Delete Selected"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const isSelected = selected.has(item.key);
          return (
            <div
              key={item.key}
              className={`rounded-xl border p-4 space-y-3 transition-colors ${
                isSelected ? "border-brand-blue-500/50 bg-brand-blue-500/[0.06]" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  aria-pressed={isSelected}
                  className="admin-press p-1 -m-1 text-brand-ink-3 hover:text-white"
                  aria-label={isSelected ? "Deselect" : "Select"}
                >
                  {isSelected ? <CheckSquare size={17} className="text-brand-blue-400" /> : <Square size={17} />}
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-brand-ink-3 border border-white/10">
                  {item.source === "order" ? "Order" : "Customer"}
                </span>
              </div>

              <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40 h-40 flex items-center justify-center">
                {!item.exists ? (
                  <div className="flex flex-col items-center gap-2 text-brand-ink-3">
                    <ImageOff size={22} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">File missing</span>
                  </div>
                ) : item.inlineVisible ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={`Proof ${item.ref}`} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[11px] font-mono text-brand-ink-3">Not previewable (PDF/HEIC)</span>
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-white truncate font-mono">{item.ref}</p>
                <p className="text-[11px] text-brand-ink-3 truncate">{item.origin}</p>
                <p className="text-[10px] text-brand-ink-3 font-mono">{item.date}</p>
              </div>

              {item.exists && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-blue-400 hover:text-brand-blue-300"
                >
                  Open full size <ExternalLink size={12} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
