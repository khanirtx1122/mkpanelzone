"use client";

import { useState } from "react";
import { adminSetAgentPassword, adminToggleAgentStatus } from "@/app/mkpanelzoneadmin/actions";
import { Power, ShieldAlert, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminToast } from "@/components/admin/AdminToast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useActionLifecycle } from "@/components/admin/AdminButton";

export function AgentActions({ agentId, currentStatus }: { agentId: string, currentStatus: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const router = useRouter();
  const toast = useAdminToast();
  const { phase, run } = useActionLifecycle();

  const disabling = currentStatus === "ACTIVE";

  const confirmToggle = async () => {
    try {
      const result = await run(() => adminToggleAgentStatus(agentId, currentStatus));
      if (result?.error) {
        toast.error("Could not update agent", result.error);
        return;
      }
      toast.success(disabling ? "Agent disabled" : "Agent enabled", disabling ? "They can no longer sign in." : "Their access is restored.");
      router.refresh();
    } catch {
      toast.error("Action failed", "Please try again.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password too short", "Use at least 6 characters.");
      return;
    }
    try {
      const result = await run(() => adminSetAgentPassword(agentId, password));
      if (result?.error) {
        toast.error("Could not update password", result.error);
        setMessage({ text: result.error, type: 'error' });
        return;
      }
      toast.success("Password updated", "Share it with the agent securely.");
      setMessage({ text: "Password reset successfully", type: 'success' });
      setPassword("");
    } catch {
      toast.error("Action failed", "Please try again.");
    }
  };

  const busy = phase === "pending";

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={dialogOpen}
        title={disabling ? "Disable this agent?" : "Enable this agent?"}
        body={disabling
          ? "This agent will no longer be able to sign in or create customers."
          : "This agent will regain access to the agent panel."}
        confirmLabel={disabling ? "Disable Agent" : "Enable Agent"}
        onClose={() => setDialogOpen(false)}
        onConfirm={confirmToggle}
      />

      {message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-green-500/10 border-green-500/20 text-green-200'}`}>
          {message.type === 'error' ? <ShieldAlert size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
          <Power size={16} className="text-brand-red-500" /> Account Status
        </h2>
        <p className="text-sm text-brand-ink-3">
          {disabling
            ? "Disabling this agent will prevent them from logging in and creating new customers." 
            : "Enabling this agent will restore their access to the agent panel."}
        </p>
        <button
          onClick={() => setDialogOpen(true)}
          disabled={busy}
          aria-busy={busy}
          className={`admin-press w-full py-3 min-h-[44px] rounded-xl font-bold uppercase tracking-wider text-xs transition-colors border inline-flex items-center justify-center gap-2 ${
            disabling
              ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20" 
              : "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
          }`}
        >
          {busy && <Loader2 size={15} className="animate-spin" />}
          {disabling ? "Disable Agent" : "Enable Agent"}
        </button>
      </div>

      <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
          <Lock size={16} className="text-brand-blue-500" /> Reset Password
        </h2>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-brand-ink-3 tracking-widest mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              placeholder="Min 6 characters"
              disabled={busy}
            />
          </div>
          <button
            type="submit"
            disabled={busy || !password}
            aria-busy={busy}
            className="admin-press w-full py-3 min-h-[44px] rounded-xl font-bold uppercase tracking-wider text-xs transition-colors bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {busy ? <><Loader2 size={15} className="animate-spin" /> Updating…</> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
