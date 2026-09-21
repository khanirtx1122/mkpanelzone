import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LogOut, ExternalLink } from "lucide-react";
import { ownerLogout } from "./actions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Bypass session check as requested by the user
  const agent = await prisma.agent.findFirst({
    where: { role: "OWNER" }
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans selection:bg-brand-red-500/30">
      <AdminSidebar username={agent?.username || "Owner"} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0c]">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 md:px-10 border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm font-medium text-brand-ink-2">
            <span>Admin</span>
            <span className="text-brand-ink-3">/</span>
            <span className="text-white">Workspace</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="hidden sm:flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-brand-ink-2 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
              <ExternalLink size={14} /> View Live Site
            </Link>
            <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
            <form action={ownerLogout}>
              <button type="submit" className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-brand-red-500 hover:text-white transition-colors bg-brand-red-500/10 hover:bg-brand-red-500/20 px-4 py-2 rounded-lg border border-brand-red-500/20 group">
                <LogOut size={14} className="group-hover:translate-x-1 transition-transform" /> Sign Out
              </button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
