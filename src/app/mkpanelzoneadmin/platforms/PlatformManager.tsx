"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Settings, Plus, Power, PowerOff, Trash2, AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminToast } from "@/components/admin/AdminToast";
import {
  adminCreatePlatform,
  adminUpdatePlatform,
  adminTogglePlatformEnabled,
  adminDeletePlatform,
  adminPlatformDependencies,
} from "./actions";
import { PLATFORM_ICON_OPTIONS, platformIcon } from "@/components/admin/PlatformIcon";

type Platform = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  iconKey: string;
  isEnabled: boolean;
  sortOrder: number;
};

type Mode = "create" | "edit";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white transition-colors focus:border-brand-blue-500/50 focus:outline-none";
const labelCls = "mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3";

/**
 * Create / edit / enable / delete a platform.
 *
 * Lifecycle for every async action is IDLE → pending → success/error, with the
 * success state shown only after the server actually confirms. No page reload.
 */
export function PlatformManager({
  mode,
  platform,
  trigger,
}: {
  mode: Mode;
  platform?: Platform;
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deps, setDeps] = useState<string | null>(null);

  const Icon = platformIcon(platform?.iconKey);

  const handleCreate = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await adminCreatePlatform(null, formData);
      if (!res.success) {
        setError(res.error ?? "Unable to create platform.");
        toast.error("Could not create platform", res.error);
        return;
      }
      setOpen(false);
      router.refresh();
      toast.success("Platform created", "It is now available across Access and Platform Resources.");
    });
  };

  const handleUpdate = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await adminUpdatePlatform(null, formData);
      if (!res.success) {
        setError(res.error ?? "Unable to save platform.");
        toast.error("Could not save platform", res.error);
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1400);
      router.refresh();
      toast.success("Platform saved", "Changes are live.");
    });
  };

  const handleToggle = async () => {
    if (!platform) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("platformId", platform.id);
      const res = await adminTogglePlatformEnabled(fd);
      if (!res.success) {
        toast.error("Could not update platform", res.error);
        return;
      }
      router.refresh();
      toast.success(
        platform.isEnabled ? "Platform disabled" : "Platform enabled",
        platform.isEnabled
          ? "It will no longer appear publicly. Existing data is untouched."
          : "It is available again."
      );
    });
  };

  const askDelete = async () => {
    if (!platform) return;
    const d = await adminPlatformDependencies(platform.id);
    const inUse = d.customers + d.branches + d.packages + d.resources;
    if (inUse > 0) {
      const parts: string[] = [];
      if (d.customers) parts.push(`${d.customers} customers`);
      if (d.branches) parts.push(`${d.branches} branches`);
      if (d.packages) parts.push(`${d.packages} packages`);
      if (d.resources) parts.push(`${d.resources} resources`);
      setDeps(parts.join(" · "));
      setConfirmDelete("BLOCKED");
      return;
    }
    setDeps(null);
    setConfirmDelete("CONFIRM");
  };

  const handleDelete = async () => {
    if (!platform) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("platformId", platform.id);
      const res = await adminDeletePlatform(fd);
      setConfirmDelete(null);
      if (!res.success) {
        toast.error("Could not delete platform", res.error);
        return;
      }
      router.refresh();
      toast.success("Platform deleted", "It was unused, so nothing else changed.");
    });
  };

  /* ── Create trigger ──────────────────────────────────────────────────── */
  if (mode === "create") {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
          {trigger ?? (
            <span className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-blue-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-blue-600">
              <Plus size={16} /> Add Platform
            </span>
          )}
        </button>

        {open && (
          <Modal title="Add Platform" onClose={() => setOpen(false)}>
            <form action={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Name</label>
                  <input name="name" required placeholder="e.g. Fancy" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Slug</label>
                  <input name="code" placeholder="fancy" className={inputCls} />
                  <p className="mt-1 text-[10px] text-brand-ink-3">Optional — generated from the name if left blank.</p>
                </div>
                <div>
                  <label className={labelCls}>Display Order</label>
                  <input name="sortOrder" type="number" placeholder="4" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Icon</label>
                  <select name="iconKey" defaultValue="layers" className={inputCls}>
                    {PLATFORM_ICON_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <input
                  name="description"
                  placeholder="Shown on the public access screen."
                  className={inputCls}
                />
              </div>

              <label className="inline-flex cursor-pointer select-none items-center gap-2.5">
                <input
                  type="checkbox"
                  name="isEnabled"
                  defaultChecked
                  className="h-4 w-4 accent-[var(--color-brand-blue-500)]"
                />
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Active</span>
              </label>

              <p className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[11px] leading-relaxed text-brand-ink-3">
                A <span className="font-bold text-white/70">Default</span> branch is created automatically so you can add
                resources right away. You can rename it afterwards.
              </p>

              {error && <p className="text-xs font-bold text-red-500">{error}</p>}

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="admin-press min-h-[44px] rounded-lg border border-white/10 bg-white/5 px-5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="admin-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-blue-500 px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-blue-600 disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {isPending ? "Creating…" : "Create Platform"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </>
    );
  }

  /* ── Edit trigger + management ───────────────────────────────────────── */
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="admin-press flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-brand-blue-400 transition-transform hover:scale-105"
          aria-label={`Manage ${platform?.name}`}
        >
          <Icon size={20} />
        </button>
      </div>

      {open && platform && (
        <Modal title={`Manage ${platform.name}`} onClose={() => setOpen(false)}>
          <form action={handleUpdate} className="space-y-5">
            <input type="hidden" name="platformId" value={platform.id} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Name</label>
                <input name="name" defaultValue={platform.name} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Slug (locked)</label>
                <input value={platform.code} readOnly disabled className={`${inputCls} opacity-60`} />
                <p className="mt-1 text-[10px] text-brand-ink-3">
                  Immutable — customers and resources reference it.
                </p>
              </div>
              <div>
                <label className={labelCls}>Display Order</label>
                <input name="sortOrder" type="number" defaultValue={platform.sortOrder} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Icon</label>
                <select name="iconKey" defaultValue={platform.iconKey} className={inputCls}>
                  {PLATFORM_ICON_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <input name="description" defaultValue={platform.description ?? ""} className={inputCls} />
            </div>

            <label className="inline-flex cursor-pointer select-none items-center gap-2.5">
              <input
                type="checkbox"
                name="isEnabled"
                defaultChecked={platform.isEnabled}
                className="h-4 w-4 accent-[var(--color-brand-blue-500)]"
              />
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">Active</span>
            </label>

            {error && <p className="text-xs font-bold text-red-500">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={askDelete}
                disabled={isPending}
                className="admin-press inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 text-xs font-bold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <Trash2 size={14} /> Delete
              </button>

              <div className="flex items-center gap-3">
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-400">
                    <CheckCircle2 size={14} /> SAVED
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isPending}
                  className="admin-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-blue-500 px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-blue-600 disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {isPending ? "Saving…" : "Save Platform"}
                </button>
              </div>
            </div>
          </form>

          {/* Enable / disable is separate from save so it is always one click. */}
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/5 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-bold text-white">
                {platform.isEnabled ? "Platform is active" : "Platform is disabled"}
              </p>
              <p className="text-[11px] text-brand-ink-3">
                {platform.isEnabled
                  ? "It appears on the public access screen and in new customer forms."
                  : "It is hidden publicly. Existing customers and resources are untouched."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={isPending}
              className={`admin-press inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border px-4 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                platform.isEnabled
                  ? "border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                  : "border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20"
              }`}
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : platform.isEnabled ? (
                <PowerOff size={14} />
              ) : (
                <Power size={14} />
              )}
              {platform.isEnabled ? "Disable" : "Enable"}
            </button>
          </div>
        </Modal>
      )}

      {/* Dependency warning — deletion refused when anything depends on it. */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title={confirmDelete === "BLOCKED" ? "This platform is in use" : "Delete this platform?"}
        body={
          confirmDelete === "BLOCKED"
            ? `Cannot delete — it still has ${deps}. Disable the platform instead: it will be hidden publicly while every customer, branch and resource stays exactly as it is.`
            : "This platform has no customers, branches, packages or resources, so it can be removed safely."
        }
        confirmLabel={confirmDelete === "BLOCKED" ? "Understood" : "Delete Platform"}
        danger={confirmDelete === "CONFIRM"}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete === "BLOCKED") {
            setConfirmDelete(null);
            return;
          }
          await handleDelete();
        }}
      />
    </>
  );
}

/** Lightweight modal — mobile-safe, no heavy effects, closable by backdrop. */
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto p-3 sm:p-6">
      <div className="modal-backdrop fixed inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div className="modal-in relative z-10 my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B0F18] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-press rounded-lg px-2 py-1 text-2xl leading-none text-brand-ink-3 transition-colors hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
