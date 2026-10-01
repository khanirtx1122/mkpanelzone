import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminToastProvider } from "@/components/admin/AdminToast";
import { AdminShell } from "@/components/admin/AdminShell";
import { getOwnerSession } from "@/lib/owner";
import { listAllPlatforms } from "@/lib/platforms";
import "@/components/admin/admin.css";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  /* Owner protection removed by owner request: the panel is publicly
     accessible. The owner identity is implicit (auto-provisioned). */
  const owner = await getOwnerSession();
  if (!owner) throw new Error("Owner identity unavailable — is the database reachable?");

  /* Platforms are needed by the sidebar grouping. Cheap, cached read. */
  const platforms = await listAllPlatforms();

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans selection:bg-brand-red-500/30">
        <AdminSidebar username={owner.username} platforms={platforms} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0c]">
          {/* Top Header */}
          <header className="h-16 flex items-center justify-between px-4 md:px-10 border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-10 relative">
            <div className="flex items-center gap-2 text-sm font-medium text-brand-ink-2 min-w-0">
              <span>Admin</span>
              <span className="text-brand-ink-3">/</span>
              <span className="text-white truncate">Workspace</span>
            </div>

            <div className="flex items-center gap-3 md:gap-4 shrink-0">
              <Link href="/" target="_blank" className="hidden sm:flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-brand-ink-2 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 admin-press">
                <ExternalLink size={14} /> View Live Site
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-x-hidden">
            <div className="max-w-7xl mx-auto w-full">
              <AdminShell>{children}</AdminShell>
            </div>
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
}
