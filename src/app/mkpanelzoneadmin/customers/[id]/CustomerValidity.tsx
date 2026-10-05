"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Trash2, Plus, Minus, CalendarX } from "lucide-react";
import {
  adminAdjustCustomerExpiry,
  adminSetCustomerExpiry,
  adminDeleteCustomer,
} from "@/app/mkpanelzoneadmin/actions";
import { useAdminToast } from "@/components/admin/AdminToast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useActionLifecycle } from "@/components/admin/AdminButton";

function expiryState(expiresAt: string | null): { label: string; tone: string } {
  if (!expiresAt) return { label: "No expiry set", tone: "bg-white/5 text-brand-ink-3 border-white/10" };
  const end = new Date(expiresAt);
  const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
  if (days <= 0) return { label: "Expired", tone: "bg-red-500/10 text-red-400 border-red-500/25" };
  if (days <= 3) return { label: `${days} day${days === 1 ? "" : "s"} left`, tone: "bg-amber-500/10 text-amber-400 border-amber-500/25" };
  return { label: `${days} days left`, tone: "bg-green-500/10 text-green-400 border-green-500/25" };
}

/** Validity management: quick +7/+30/−7 days, exact date, and real deletion. */
export function CustomerValidity({
  customerId,
  expiresAt,
  identifier,
}: {
  customerId: string;
  expiresAt: string | null;
  identifier: string;
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const { run, isPending } = useActionLifecycle();

  const [exactDate, setExactDate] = useState(
    expiresAt ? new Date(expiresAt).toISOString().slice(0, 16) : "",
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  const state = expiryState(expiresAt);

  const adjust = async (days: number, label: string) => {
    const result = await run(() => adminAdjustCustomerExpiry(customerId, days));
    if (!result) return;
    try {
      if (result.error) {
        toast.error("Could not update validity", result.error);
        return;
      }
      toast.success(
        `Validity ${label}`,
        result.expiresAt ? `New expiry: ${new Date(result.expiresAt).toLocaleString()}` : undefined,
      );
      router.refresh();
    } catch {
      toast.error("Action failed", "Please try again.");
    }
  };

  const setExact = async () => {
    // datetime-local is interpreted in the owner's local time.
    const iso = exactDate ? new Date(exactDate).toISOString() : "";
    const result = await run(() => adminSetCustomerExpiry(customerId, iso));
    if (!result) return;
    try {
      if (result.error) {
        toast.error("Could not set expiry", result.error);
        return;
      }
      toast.success(iso ? "Expiry updated" : "Expiry cleared", undefined);
      router.refresh();
    } catch {
      toast.error("Action failed", "Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      const result = await adminDeleteCustomer(customerId);
      if (result?.error) {
        toast.error("Could not delete customer", result.error);
        return;
      }
      toast.success("Customer deleted", `${identifier} and their device bindings are gone.`);
      router.push("/mkpanelzoneadmin/customers");
    } catch {
      toast.error("Action failed", "Please try again.");
      setDeleteOpen(false);
    }
  };

  return (
    <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-5">
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this customer?"
        body="The account, its device bindings and its payment proof are removed permanently. This cannot be undone."
        confirmLabel="Delete Customer"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <h2 className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
        <CalendarClock size={16} /> Validity &amp; Danger Zone
      </h2>

      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${state.tone}`}>{state.label}</span>
        {expiresAt && (
          <span className="text-[11px] font-mono text-brand-ink-3">
            {new Date(expiresAt).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => adjust(7, "extended by 7 days")}
          className="admin-press inline-flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider border bg-green-500/10 text-green-400 border-green-500/25 hover:bg-green-500/20 disabled:opacity-50"
        >
          <Plus size={13} /> 7 Days
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => adjust(30, "extended by 30 days")}
          className="admin-press inline-flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider border bg-green-500/10 text-green-400 border-green-500/25 hover:bg-green-500/20 disabled:opacity-50"
        >
          <Plus size={13} /> 30 Days
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => adjust(-7, "reduced by 7 days")}
          className="admin-press inline-flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20 disabled:opacity-50"
        >
          <Minus size={13} /> 7 Days
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => adjust(-30, "reduced by 30 days")}
          className="admin-press inline-flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20 disabled:opacity-50"
        >
          <Minus size={13} /> 30 Days
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="datetime-local"
          value={exactDate}
          onChange={(e) => setExactDate(e.target.value)}
          className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 min-h-[44px] text-white focus:outline-none focus:border-brand-blue-500/50"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={setExact}
          className="admin-press inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider border bg-white/5 text-white border-white/10 hover:bg-white/10 disabled:opacity-50"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <CalendarX size={15} />}
          {exactDate ? "Set Expiry" : "Clear Expiry"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        disabled={isPending}
        className="admin-press w-full inline-flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider border bg-red-500/10 text-red-500 border-red-500/25 hover:bg-red-500/20"
      >
        <Trash2 size={15} /> Delete Customer
      </button>
    </div>
  );
}
