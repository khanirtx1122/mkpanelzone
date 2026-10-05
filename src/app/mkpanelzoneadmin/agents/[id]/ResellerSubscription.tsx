"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Phone, Trash2, Loader2, Save } from "lucide-react";
import { adminSetAgentSubscription, adminDeleteAgent } from "@/app/mkpanelzoneadmin/actions";
import { RESELLER_PLANS, subscriptionRemaining } from "@/lib/pricing";
import { useAdminToast } from "@/components/admin/AdminToast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useActionLifecycle } from "@/components/admin/AdminButton";

/**
 * Reseller subscription editor: plan, phone, honest remaining-validity
 * (permanent = "no expiry", never a fake countdown), and real deletion with
 * customer detachment handled server-side.
 */
export function ResellerSubscription({
  agentId,
  currentPlan,
  currentPhone,
  currentExpiry,
}: {
  agentId: string;
  currentPlan: string | null;
  currentPhone: string | null;
  currentExpiry: string | null;
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const { phase, run, isPending } = useActionLifecycle();

  const [plan, setPlan] = useState(currentPlan || "");
  const [phone, setPhone] = useState(currentPhone || "");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const activePlan = RESELLER_PLANS.find((p) => p.key === plan);
  const expiryLabel = subscriptionRemaining(currentExpiry);

  const handleSave = async () => {
    try {
      const result = await run(() => adminSetAgentSubscription(agentId, plan, phone));
      if (result?.error) {
        toast.error("Could not update subscription", result.error);
        return;
      }
      toast.success("Subscription updated", activePlan ? `${activePlan.label} plan is now active.` : "Subscription cleared.");
      router.refresh();
    } catch {
      toast.error("Action failed", "Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      const result = await adminDeleteAgent(agentId);
      if (result?.error) {
        toast.error("Could not delete reseller", result.error);
        return;
      }
      toast.success("Reseller deleted", "Their customers were kept and detached.");
      router.push("/mkpanelzoneadmin/agents");
    } catch {
      toast.error("Action failed", "Please try again.");
      setDeleteOpen(false);
    }
  };

  return (
    <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-5">
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this reseller?"
        body="Their login is removed permanently. Customers they created are kept and simply lose the reseller attribution."
        confirmLabel="Delete Reseller"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
        <CalendarClock size={16} className="text-brand-blue-500" /> Subscription
      </h2>

      {currentPlan && (
        <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink-3">Current plan</p>
            <p className="text-sm font-bold text-white">
              {RESELLER_PLANS.find((p) => p.key === currentPlan)?.label ?? currentPlan}
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
            expiryLabel === "Expired"
              ? "bg-red-500/10 text-red-400 border-red-500/25"
              : "bg-green-500/10 text-green-400 border-green-500/25"
          }`}>
            {expiryLabel}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-[10px] uppercase font-bold text-brand-ink-3 tracking-widest">Plan</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 min-h-[44px] text-white focus:outline-none focus:border-brand-blue-500/50"
        >
          <option value="">— No subscription —</option>
          {RESELLER_PLANS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label} — PKR {p.price.toLocaleString()}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-brand-ink-3 font-mono">
          Saving restarts the subscription clock from now. Permanent never expires.
        </p>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-brand-ink-3 tracking-widest">
          <Phone size={12} /> WhatsApp Number
        </label>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="923001234567"
          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 min-h-[44px] text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50 font-mono"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          aria-busy={isPending}
          className="admin-press flex-1 inline-flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl font-bold uppercase tracking-wider text-xs border transition-colors disabled:opacity-60 bg-brand-blue-500/10 text-brand-blue-400 border-brand-blue-500/25 hover:bg-brand-blue-500/20"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : phase === "success" ? <Save size={15} /> : null}
          {isPending ? "Saving…" : phase === "success" ? "Saved ✓" : "Save Subscription"}
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          disabled={isPending}
          className="admin-press inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl font-bold uppercase tracking-wider text-xs border transition-colors bg-red-500/10 text-red-500 border-red-500/25 hover:bg-red-500/20"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </div>
  );
}
