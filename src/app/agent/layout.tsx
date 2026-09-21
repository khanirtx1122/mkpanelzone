import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Activity, UserPlus, FileImage } from "lucide-react";
import { agentLogout } from "@/app/actions";
import { Button } from "@/components/ui/Button";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("agent_session")?.value;

  if (!sessionValue) {
    redirect("/mk-agents");
  }

  let sessionData;
  try {
    sessionData = JSON.parse(sessionValue);
  } catch (e) {
    redirect("/mk-agents");
  }

  const agentId = sessionData.userId || sessionData.agentId;

  if (!agentId) {
    redirect("/mk-agents");
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId }
  });

  if (!agent) {
    redirect("/mk-agents");
  }

  // Owner could theoretically use this, but they have their own panel.
  // We allow both AGENT and OWNER here for flexibility, but they initially route to /admin if OWNER.

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border-subtle bg-background/50 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10 text-brand-blue-500">
          <UserPlus size={24} />
          <h1 className="font-extrabold tracking-widest text-lg uppercase">AGENT PANEL</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/agent" className="flex items-center gap-3 px-4 py-3 rounded-lg text-brand-ink-2 hover:text-foreground hover:bg-foreground/5 transition-colors">
            <Activity size={18} />
            <span className="font-bold tracking-wide text-sm">Dashboard</span>
          </Link>
          <Link href="/agent/create" className="flex items-center gap-3 px-4 py-3 rounded-lg text-brand-ink-2 hover:text-foreground hover:bg-foreground/5 transition-colors">
            <UserPlus size={18} />
            <span className="font-bold tracking-wide text-sm">Create Customer</span>
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-border-subtle">
          <div className="mb-4">
            <p className="text-xs text-brand-ink-3 uppercase tracking-widest font-bold mb-1">Logged in as</p>
            <p className="text-sm font-bold text-foreground">{agent.username}</p>
          </div>
          <form action={agentLogout}>
            <Button type="submit" variant="outline" className="w-full gap-2 border-brand-red-500/30 text-brand-red-500 hover:bg-brand-red-500/10">
              <LogOut size={16} /> LOGOUT
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
