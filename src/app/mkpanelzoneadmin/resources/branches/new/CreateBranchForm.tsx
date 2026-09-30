"use client";

import { useActionState, useState } from "react";
import { adminCreateBranch } from "@/app/mkpanelzoneadmin/actions";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateBranchForm({ platform }: { platform: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(adminCreateBranch, null);
  const [name, setName] = useState("");

  if (state?.success) {
    setTimeout(() => router.push(`/mkpanelzoneadmin/resources?platform=${platform}`), 600);
  }

  return (
    <form action={formAction} className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-2xl max-w-xl">
      {state?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-bold text-sm inline-flex items-center gap-2">
          <CheckCircle2 size={16} /> Branch created.
        </div>
      )}

      <input type="hidden" name="platformType" value={platform} />

      <div>
        <label className="block text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-2">Branch Name</label>
        <input
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
          placeholder="e.g. Android Beta"
        />
        <p className="text-[11px] text-brand-ink-3 mt-1.5 font-mono">
          Slug: {name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "auto"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-2">Description (optional)</label>
        <input
          name="description"
          type="text"
          className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
          placeholder="Shown under the branch name during selection"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-blue-500 hover:bg-brand-blue-400 disabled:opacity-50 text-white font-bold rounded-lg transition-colors w-full sm:w-auto"
        >
          {isPending ? <Loader2 className="animate-spin" size={18} /> : null}
          {isPending ? "Creating..." : "Create Branch"}
        </button>
      </div>
    </form>
  );
}
