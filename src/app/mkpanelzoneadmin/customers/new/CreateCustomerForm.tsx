"use client";

import { useActionState, useState, useEffect } from "react";
import { adminCreateCustomer } from "@/app/mkpanelzoneadmin/actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface BranchLite {
  id: string;
  platformType: string;
  name: string;
  isEnabled: boolean;
}

export function CreateCustomerForm({ packages, branches }: { packages: any[]; branches: BranchLite[] }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    { success?: boolean; error?: string } | null,
    FormData
  >(adminCreateCustomer, null);

  useEffect(() => {
    if (state?.success) {
      router.push("/mkpanelzoneadmin/customers");
    }
  }, [state, router]);

  const [platform, setPlatform] = useState("ANDROID");
  const platformBranches = branches.filter((b) => b.platformType === platform);

  return (
    <form action={formAction} className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-2xl">
      {state?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-2">Identifier (Username/ID)</label>
        <input
          name="identifier"
          type="text"
          required
          className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
          placeholder="e.g. user_123"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-2">Password</label>
        <input
          name="password"
          type="password"
          required
          className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
          placeholder="Min 6 characters"
          minLength={6}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-2">Platform</label>
        <select
          name="platformType"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors appearance-none"
          required
        >
          <option value="ANDROID">Android</option>
          <option value="IOS">iOS</option>
          <option value="PC">PC</option>
        </select>
      </div>

      {platformBranches.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-2">Branch</label>
          <select
            name="branchId"
            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors appearance-none"
            required
          >
            <option value="">Select a branch...</option>
            {platformBranches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}{!branch.isEnabled ? " (disabled)" : ""}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-brand-ink-3 mt-1.5">
            The customer will only be able to sign in through this branch.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-2">Package</label>
        <select
          name="packageId"
          className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors appearance-none"
          required
        >
          <option value="">Select a package...</option>
          {packages.filter(pkg => pkg.platformType === platform).map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-2">Initial Status</label>
        <select
          name="status"
          className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors appearance-none"
        >
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-blue-500 hover:bg-brand-blue-400 disabled:opacity-50 text-white font-bold rounded-lg transition-colors w-full sm:w-auto"
        >
          {isPending ? <Loader2 className="animate-spin" size={20} /> : null}
          {isPending ? "Creating..." : "Create Customer"}
        </button>
      </div>
    </form>
  );
}
