"use client";

import { useState } from "react";
import {
  adminUpdateCustomerStatus,
  adminResetCustomerDevice,
  adminSetCustomerPassword,
  adminChangeCustomerPlatform,
  adminSetCustomerPaymentStatus,
} from "@/app/mkpanelzoneadmin/actions";
import { ShieldAlert, ShieldCheck, Trash2, KeyRound, Loader2, CreditCard, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminToast } from "@/components/admin/AdminToast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useActionLifecycle } from "@/components/admin/AdminButton";

type ConfirmState = {
  kind: "status" | "device" | "password";
  title: string;
  body: string;
  confirmLabel: string;
} | null;

export function CustomerActions({ 
  customerId, 
  currentStatus,
  deviceCount,
  currentPlatform,
  currentPackageId,
  currentPaymentStatus,
  packages,
  platforms
}: { 
  customerId: string; 
  currentStatus: string;
  deviceCount: number;
  currentPlatform: string;
  currentPackageId: string;
  currentPaymentStatus: string;
  packages: any[];
  platforms: { code: string; name: string }[];
}) {
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const toast = useAdminToast();
  const { phase, run } = useActionLifecycle();

  /* ── PAID / UNPAID ────────────────────────────────────────────────────────
     Local state: on server confirmation we update ONLY this row's badge. No
     dashboard refetch, no re-fetch of customers/platforms/resources. */
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [paymentPhase, setPaymentPhase] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const paymentBusy = paymentPhase === "saving";

  const togglePaymentStatus = async () => {
    if (paymentBusy) return; // duplicate-submission guard
    const next = paymentStatus === "UNPAID" ? "PAID" : "UNPAID";
    setPaymentPhase("saving");
    try {
      const result = await adminSetCustomerPaymentStatus(customerId, next);
      if ((result as any)?.error) {
        setPaymentPhase("error");
        toast.error("Could not update payment status", (result as any).error);
        setTimeout(() => setPaymentPhase("idle"), 1600);
        return;
      }
      // Success is only shown AFTER the server confirmed the write.
      setPaymentStatus(next);
      setPaymentPhase("saved");
      toast.success(
        next === "PAID" ? "Marked as PAID" : "Marked as UNPAID",
        next === "PAID"
          ? "Protected resources unlock on their next request."
          : "Protected resources are blocked immediately — including open sessions."
      );
      setTimeout(() => setPaymentPhase("idle"), 1400);
    } catch {
      setPaymentPhase("error");
      toast.error("Could not update payment status", "Please try again.");
      setTimeout(() => setPaymentPhase("idle"), 1600);
    }
  };

  const handleToggleStatus = () =>
    setConfirmState({
      kind: "status",
      title: currentStatus === "active" ? "Disable customer account?" : "Enable customer account?",
      body:
        currentStatus === "active"
          ? "This customer will immediately lose access to the platform."
          : "This customer will regain full platform access.",
      confirmLabel: currentStatus === "active" ? "Disable Account" : "Enable Account",
    });

  const handleResetDevice = () =>
    setConfirmState({
      kind: "device",
      title: "Reset device binding?",
      body: "The customer will be able to sign in on a new device. Their current device loses access.",
      confirmLabel: "Reset Device",
    });

  const handleResetPassword = () =>
    setConfirmState({
      kind: "password",
      title: "Set a new password",
      body: "The customer's current password will be replaced immediately.",
      confirmLabel: "Update Password",
    });

  const onConfirm = async () => {
    if (!confirmState) return;
    if (confirmState.kind === "password" && passwordInput.length < 6) {
      toast.error("Password too short", "Use at least 6 characters.");
      setConfirmState(null);
      return;
    }
    try {
      if (confirmState.kind === "status") {
        const newStatus = currentStatus === "active" ? "disabled" : "active";
        const result = await run(() => adminUpdateCustomerStatus(customerId, newStatus));
        if (result?.error) { toast.error("Could not update status", result.error); return; }
        toast.success("Account " + (newStatus === "active" ? "enabled" : "disabled"), "Status change confirmed.");
        router.refresh();
      } else if (confirmState.kind === "device") {
        const result = await run(() => adminResetCustomerDevice(customerId));
        if (result?.error) { toast.error("Could not reset device", result.error); return; }
        toast.success("Device binding reset", "Customer can sign in on a new device.");
        router.refresh();
      } else {
        const result = await run(() => adminSetCustomerPassword(customerId, passwordInput));
        if (result?.error) { toast.error("Could not update password", result.error); return; }
        toast.success("Password updated", "Share it with the customer securely.");
        setPasswordInput("");
      }
    } catch {
      toast.error("Action failed", "Please try again.");
    } finally {
      setConfirmState(null);
    }
  };

  const [platform, setPlatform] = useState(currentPlatform);
  const [packageId, setPackageId] = useState(currentPackageId);

  const handleUpdatePlatform = async () => {
    try {
      const result = await run(() => adminChangeCustomerPlatform(customerId, platform, packageId));
      if (result?.error) { toast.error("Could not update platform", result.error); return; }
      toast.success("Platform updated", "Customer's platform and package are confirmed.");
      router.refresh();
    } catch {
      toast.error("Action failed", "Please try again.");
    }
  };

  const busy = phase === "pending";

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ""}
        body={confirmState?.body}
        confirmLabel={confirmState?.confirmLabel ?? "Confirm"}
        onClose={() => setConfirmState(null)}
        onConfirm={onConfirm}
      />

      {/* Hidden password field inside dialog flow */}
      {confirmState?.kind === "password" && (
        <input
          type="password"
          autoFocus
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          className="hidden"
        />
      )}

      {message && (
        <div className="p-3 bg-brand-blue-500/10 border border-brand-blue-500/20 text-brand-blue-400 rounded-lg text-sm font-bold">
          {message}
        </div>
      )}

      <div className="p-4 sm:p-6 border border-white/10 rounded-2xl bg-white/5 space-y-6">
        <h2 className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest border-b border-white/5 pb-3">Management Actions</h2>

        <div className="space-y-4">
          {/* Payment / access gate — the highest-impact control on this page. */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-black/20 rounded-xl border border-white/5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={16} className={paymentStatus === "UNPAID" ? "text-amber-400" : "text-green-400"} />
                <p className="font-bold text-white">Payment Status</p>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                    paymentStatus === "UNPAID"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      : "bg-green-500/10 text-green-400 border-green-500/25"
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>
              <p className="text-xs text-brand-ink-3">
                Controls protected resource access only. ID, password, platform, branch, package and
                device binding are never touched.
              </p>
            </div>
            <button
              onClick={togglePaymentStatus}
              disabled={paymentBusy}
              aria-busy={paymentBusy}
              className={`admin-press flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-sm border transition-colors disabled:cursor-not-allowed ${
                paymentPhase === "saved"
                  ? "bg-green-500/15 text-green-400 border-green-500/30"
                  : paymentStatus === "UNPAID"
                    ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
              }`}
            >
              {paymentBusy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : paymentPhase === "saved" ? (
                <Check size={16} />
              ) : (
                <CreditCard size={16} />
              )}
              {paymentBusy
                ? "SAVING…"
                : paymentPhase === "saved"
                  ? "SAVED ✓"
                  : paymentStatus === "UNPAID"
                    ? "Mark as Paid"
                    : "Mark as Unpaid"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-black/20 rounded-xl border border-white/5">
            <div>
              <p className="font-bold text-white mb-1">Account Status</p>
              <p className="text-xs text-brand-ink-3">Enable or disable access to the platform</p>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={busy}
              aria-busy={busy}
              className={`admin-press flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-sm transition-colors ${
                currentStatus === "active" 
                  ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                  : "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
              }`}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : currentStatus === "active" ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
              {currentStatus === "active" ? "Disable Account" : "Enable Account"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-black/20 rounded-xl border border-white/5">
            <div>
              <p className="font-bold text-white mb-1">Device Bindings ({deviceCount})</p>
              <p className="text-xs text-brand-ink-3">Clear registered hardware IDs</p>
            </div>
            <button
              onClick={handleResetDevice}
              disabled={busy || deviceCount === 0}
              aria-busy={busy}
              className="admin-press flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold text-sm hover:bg-orange-500/20 transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Reset Device
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-black/20 rounded-xl border border-white/5">
            <div>
              <p className="font-bold text-white mb-1">Force Password Reset</p>
              <p className="text-xs text-brand-ink-3">Override customer credentials</p>
            </div>
            <button
              onClick={handleResetPassword}
              disabled={busy}
              className="admin-press flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-brand-blue-500/10 text-brand-blue-500 border border-brand-blue-500/20 font-bold text-sm hover:bg-brand-blue-500/20 transition-colors"
            >
              <KeyRound size={16} /> Reset Password
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 gap-4">
            <div>
              <p className="font-bold text-white mb-1">Platform & Package</p>
              <p className="text-xs text-brand-ink-3">Change assigned platform and package</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setPackageId("");
                }}
                className="bg-white/5 border border-white/10 rounded-lg py-2.5 min-h-[44px] px-3 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              >
                <option value={currentPlatform} disabled className="bg-black text-white">
                  {platforms.find((p) => p.code === currentPlatform)?.name ?? currentPlatform} (current)
                </option>
                {platforms
                  .filter((p) => p.code !== currentPlatform)
                  .map((p) => (
                    <option key={p.code} value={p.code} className="bg-black text-white">{p.name}</option>
                  ))}
              </select>
              
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg py-2.5 min-h-[44px] px-3 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              >
                <option value="" className="bg-black text-white">None</option>
                {packages.filter(pkg => pkg.platformType === platform).map(pkg => (
                  <option key={pkg.id} value={pkg.id} className="bg-black text-white">{pkg.name}</option>
                ))}
              </select>

              <button
                onClick={handleUpdatePlatform}
                disabled={busy || (platform === currentPlatform && packageId === currentPackageId)}
                aria-busy={busy}
                className="admin-press inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-brand-blue-500/10 text-brand-blue-500 border border-brand-blue-500/20 font-bold text-sm hover:bg-brand-blue-500/20 transition-colors disabled:opacity-50"
              >
                {busy && <Loader2 size={15} className="animate-spin" />} Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
