"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTransition } from "react";

export function AgentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleStatus = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status && status !== "ALL") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-ink-3">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search agent username..."
          defaultValue={searchParams.get("q")?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50 transition-colors"
        />
      </div>
      
      <select
        defaultValue={searchParams.get("status")?.toString() || "ALL"}
        onChange={(e) => handleStatus(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
      >
        <option value="ALL" className="bg-black text-white">All Status</option>
        <option value="ACTIVE" className="bg-black text-white">Active</option>
        <option value="DISABLED" className="bg-black text-white">Disabled</option>
      </select>
    </div>
  );
}
