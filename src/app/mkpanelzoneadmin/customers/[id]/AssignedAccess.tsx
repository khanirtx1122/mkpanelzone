"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Save, Loader2, Layers, CheckCircle2, Clock, Ban, ChevronDown,
} from "lucide-react";
import {
  adminAddEntitlement,
  adminUpdateEntitlement,
  adminRemoveEntitlement,
} from "@/app/mkpanelzoneadmin/actions";
import { useAdminToast } from "@/components/admin/AdminToast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export type EntitlementView = {
  id: string;
  platformType: string;
  branchId: string | null;
  branchName: string | null;
  packageId: string | null;
  packageName: string | null;
  paymentStatus: string;
  status: string;
  expiresAt: string | null;
};

export type PlatformOption = { code: string; name: string };
export type BranchOption = { id: string; platformType: string; name: string };
export type PackageOption = { id: string; name: string; platformType: string };

/**
 * ASSIGNED ACCESS.
 *
 * One customer identity, many independent accesses. Each row carries its own
 * paid/unpaid state and its own expiry, so adding a second (or fifth) product
 * never requires a second customer account — and an unpaid new access never
 * locks the customer's existing paid ones.
 *
 * Remove Access is deliberately distinct from Delete Customer: removing a row
 * here deletes only that access.
 */
export function AssignedAccess({
  customerId,
  entitlements,
  platforms,
  branches,
  packages,
}: {
  customerId: string;
  entitlements: EntitlementView[];
  platforms: PlatformOption[];
  branches: BranchOption[];
  packages: PackageOption[];
}) {
  const router = useRouter();
  const toast = useAdminToast();

  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<EntitlementView | null>(null);

  // Add-access form state
  const [platform, setPlatform] = useState(platforms[0]?.code ?? "ANDROID");
  const [branchId, setBranchId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">("UNPAID");
  const [expiresAt, setExpiresAt] = useState("");

  const platformBranches = branches.filter((b) => b.platformType === platform);
  const platformPackages = packages.filter((p) => p.platformType === platform);

  const paidCount = entitlements.filter((e) => e.status === "active" && e.paymentStatus === "PAID").length;
  const unpaidCount = entitlements.filter((e) => e.status === "active" && e.paymentStatus !== "PAID").length;

  const handleAdd = async () => {
    setBusy("add");
    const fd = new FormData();
    fd.set("customerId", customerId);
    fd.set("platformType", platform);
    fd.set("branchId", branchId);
    fd.set("packageId", packageId);
    fd.set("paymentStatus", paymentStatus);
    fd.set("expiresAt", expiresAt);

    const res = await adminAddEntitlement(fd);
    setBusy(null);

    if (res?.error) {
      toast.error("Could not add access", res.error);
      return;
    }
    toast.success("Access added", "Attached to this same customer account.");
    setAdding(false);
    setExpiresAt("");
    setBranchId("");
    setPackageId("");
    router.refresh();
  };

  const handleUpdate = async (id: string, patch: Record<string, string>) => {
    setBusy(id);
    const fd = new FormData();
    fd.set("entitlementId", id);
    for (const [k, v] of Object.entries(patch)) fd.set(k, v);

    const res = await adminUpdateEntitlement(fd);
    setBusy(null);

    if (res?.error) {
      toast.error("Could not update access", res.error);
      return;
    }
    toast.success("Access updated");
    router.refresh();
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    setBusy(confirmRemove.id);
    const fd = new FormData();
    fd.set("entitlementId", confirmRemove.id);
    const res = await adminRemoveEntitlement(fd);
    setBusy(null);

    if (res?.error) {
      toast.error("Could not remove access", res.error);
      setConfirmRemove(null);
      return;
    }
    toast.success("Access removed", "The customer account and its other accesses are untouched.");
    setConfirmRemove(null);
    router.refresh();
  };

  return (
    <div className="bg-[#0E1420] border border-white/5 rounded-xl p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3 mb-5">
        <h2 className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest flex items-center gap-2">
          <Layers size={15} /> Assigned Access
        </h2>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/25">
            {paidCount} paid
          </span>
          <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
            {unpaidCount} unpaid
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {entitlements.length === 0 && (
          <p className="text-sm text-brand-ink-3 italic">
            No access assigned yet. Add the first access below.
          </p>
        )}

        {entitlements.map((e) => {
          const expired = e.expiresAt ? new Date(e.expiresAt).getTime() <= Date.now() : false;
          const paid = e.paymentStatus === "PAID";
          const disabled = e.status !== "active";
          const isOpen = expanded === e.id;

          return (
            <div
              key={e.id}
              className="rounded-xl border bg-white/[0.02] overflow-hidden"
              style={{ borderColor: expired ? "rgba(239,68,68,0.3)" : "var(--border-subtle)" }}
            >
              <div className="p-4 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm font-bold text-white truncate">
                      {e.branchName || e.platformType}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-brand-ink-3 border border-white/10">
                      {e.platformType}
                    </span>
                    {/* Status is conveyed by text + icon, not colour alone. */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        disabled
                          ? "bg-white/5 text-brand-ink-3 border-white/10"
                          : expired
                            ? "bg-red-500/10 text-red-400 border-red-500/25"
                            : paid
                              ? "bg-green-500/10 text-green-400 border-green-500/25"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      }`}
                    >
                      {disabled ? <Ban size={10} /> : expired ? <Clock size={10} /> : paid ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      {disabled ? "Disabled" : expired ? "Expired" : paid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <div className="text-[11px] text-brand-ink-3 font-mono flex flex-wrap gap-x-4 gap-y-1">
                    <span>Package: {e.packageName || "—"}</span>
                    <span>
                      Expires:{" "}
                      {e.expiresAt
                        ? new Date(e.expiresAt).toLocaleDateString()
                        : "Permanent"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-[11px] font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    Edit
                    <ChevronDown size={13} style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(e)}
                    disabled={busy === e.id}
                    aria-label="Remove this access"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 transition-colors disabled:opacity-50"
                  >
                    {busy === e.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">
                        Payment
                      </span>
                      <select
                        value={e.paymentStatus}
                        onChange={(ev) => handleUpdate(e.id, { paymentStatus: ev.target.value })}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                      >
                        <option value="PAID">PAID</option>
                        <option value="UNPAID">UNPAID</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">
                        Expiry (blank = permanent)
                      </span>
                      <input
                        type="date"
                        defaultValue={e.expiresAt ? new Date(e.expiresAt).toISOString().slice(0, 10) : ""}
                        onChange={(ev) => handleUpdate(e.id, { expiresAt: ev.target.value })}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">
                        Access state
                      </span>
                      <select
                        value={e.status}
                        onChange={(ev) => handleUpdate(e.id, { status: ev.target.value })}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">
                      Package
                    </span>
                    <select
                      value={e.packageId ?? ""}
                      onChange={(ev) => handleUpdate(e.id, { packageId: ev.target.value })}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                    >
                      <option value="">No package</option>
                      {packages
                        .filter((p) => p.platformType === e.platformType)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD ACCESS */}
      <div className="mt-5 pt-5 border-t border-white/5">
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] w-full sm:w-auto rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-colors"
            style={{ background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)" }}
          >
            <Plus size={15} /> Add Access
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-[11px] text-brand-ink-3">
              This attaches a new access to <strong className="text-white">the same customer account</strong> —
              no new customer is created.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">
                  Platform
                </span>
                <select
                  value={platform}
                  onChange={(ev) => {
                    setPlatform(ev.target.value);
                    setBranchId("");
                    setPackageId("");
                  }}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                >
                  {platforms.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">
                  Branch
                </span>
                <select
                  value={branchId}
                  onChange={(ev) => setBranchId(ev.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                >
                  <option value="">Platform-wide (any branch)</option>
                  {platformBranches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">
                  Package
                </span>
                <select
                  value={packageId}
                  onChange={(ev) => setPackageId(ev.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                >
                  <option value="">No package</option>
                  {platformPackages.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">
                  Payment
                </span>
                <select
                  value={paymentStatus}
                  onChange={(ev) => setPaymentStatus(ev.target.value as "PAID" | "UNPAID")}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PAID">PAID</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-ink-3 mb-1.5">
                  Expiry (leave blank for permanent)
                </span>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(ev) => setExpiresAt(ev.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAdd}
                disabled={busy === "add"}
                aria-busy={busy === "add"}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)" }}
              >
                {busy === "add" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {busy === "add" ? "Adding…" : "Add to customer"}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="inline-flex items-center justify-center px-5 py-3 min-h-[46px] rounded-xl text-xs font-bold uppercase tracking-wider text-brand-ink-2 hover:text-white border border-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove !== null}
        title="Remove this access?"
        body={
          confirmRemove
            ? `This removes only the ${confirmRemove.branchName || confirmRemove.platformType} access. The customer account and its other accesses are not affected.`
            : ""
        }
        confirmLabel="Remove access"
        danger
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemove}
      />
    </div>
  );
}
