import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { agentLogout } from "@/app/actions";
import { AgentNav } from "@/components/agent/AgentNav";

export const metadata = {
  title: "Agent Workstation",
};

/**
 * Agent workstation shell (spec §28).
 *
 * Security note (spec §49): the session read, JSON parse, agent lookup and all
 * redirects below are the original authorization logic, unchanged. This file
 * was restyled only — moving or weakening any of these checks would be a
 * security change, not a visual one.
 *
 * Deliberately not cinematic: no intro, no particles, no 3D. Agents are here to
 * create accounts quickly, so the chrome is a thin header and a two-item nav.
 */
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
    console.error("[layout.tsx] unexpected failure:", e);
    redirect("/mk-agents");
  }

  const agentId = sessionData.userId || sessionData.agentId;

  if (!agentId) {
    redirect("/mk-agents");
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    redirect("/mk-agents");
  }

  /*
    The account must still be active. `managementLogin` already refuses a
    DISABLED agent at sign-in, but without this an agent disabled mid-session
    would keep browsing the panel until their cookie expired. Sending them back
    to the sign-in page surfaces the "Account disabled" message there.
  */
  if (agent.status !== "ACTIVE") {
    redirect("/mk-agents");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Command bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Identity */}
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border-strong text-[11px] font-extrabold text-brand-ink-2"
              style={{
                background:
                  "linear-gradient(150deg, var(--ambient-strong), var(--ambient-strong))",
              }}
              aria-hidden
            >
              MK
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold tracking-[0.02em] text-foreground">
                Agent Workstation
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-brand-ink-3">
                <ShieldCheck size={11} className="shrink-0 text-brand-ink-2" aria-hidden />
                <span className="truncate">{agent.username}</span>
              </p>
            </div>
          </div>

          {/* Nav + session */}
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <AgentNav />

            <div className="flex shrink-0 items-center gap-3 border-l border-border-subtle pl-3">
              <span
                className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-brand-ink-4 sm:flex"
                title="Session active"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--status-success-text)] animate-dot-pulse" aria-hidden />
                Active
              </span>
              <form action={agentLogout}>
                <button
                  type="submit"
                  className="inline-flex h-[38px] items-center gap-1.5 rounded-[10px] border border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] px-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--status-danger-text)] transition-colors hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
                >
                  <LogOut size={13} aria-hidden />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* ── Workspace ──────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-7 sm:px-6 sm:py-9">
        {children}
      </main>
    </div>
  );
}
