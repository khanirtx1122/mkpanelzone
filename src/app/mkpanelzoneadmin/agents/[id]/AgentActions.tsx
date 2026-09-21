"use client";

import { useState } from "react";
import { adminSetAgentPassword, adminToggleAgentStatus } from "@/app/mkpanelzoneadmin/actions";
import { Power, ShieldAlert, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AgentActions({ agentId, currentStatus }: { agentId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const router = useRouter();

  const handleToggleStatus = async () => {
    if (!confirm(`Are you sure you want to ${currentStatus === "ACTIVE" ? "DISABLE" : "ENABLE"} this agent?`)) return;
    
    setLoading(true);
    setMessage(null);
    const result = await adminToggleAgentStatus(agentId, currentStatus);
    
    if (result.error) {
      setMessage({ text: result.error, type: 'error' });
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);
    const result = await adminSetAgentPassword(agentId, password);
    
    if (result.error) {
      setMessage({ text: result.error, type: 'error' });
    } else {
      setMessage({ text: "Password reset successfully", type: 'success' });
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
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
          {currentStatus === "ACTIVE" 
            ? "Disabling this agent will prevent them from logging in and creating new customers." 
            : "Enabling this agent will restore their access to the agent panel."}
        </p>
        <button
          onClick={handleToggleStatus}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors border ${
            currentStatus === "ACTIVE" 
              ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20" 
              : "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (currentStatus === "ACTIVE" ? "Disable Agent" : "Enable Agent")}
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
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
