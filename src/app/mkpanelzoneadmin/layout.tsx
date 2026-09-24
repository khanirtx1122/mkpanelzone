import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ExternalLink, ShieldCheck } from "lucide-react";
import { ownerLogout } from "./actions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireOwner, isAdminAuthBypassed } from "@/lib/ownerAuth";

export const metadata = {
  title: "Control Room | MK Panel Zone",
};

/**
 * AdminLayout — the private control room (spec §21, §60).
 *
 * Visually distinct from the public site on purpose: information density,
 * a persistent sidebar, a fixed command header and a cooler, flatter surface
 * treatment. Same brand, different job.
 *
 * SECURITY (spec §49, §64)
 * ------------------------
 * This layout previously performed no session check whatsoever — it only looked
 * up an OWNER row to use as a display name. Every control-room page was
 * therefore readable by anyone. The guard below now requires a valid
 * `owner_session` cookie whose subject is an active OWNER.
 *
 * In non-production builds `requireOwner()` returns a development principal so
 * the panel stays reachable without a configured OWNER_BOOTSTRAP_TOKEN. In a
 * production build the redirect is always enforced.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();

  if (!owner) {
    redirect("/mk-agents");
  }

  const isDevBypass = owner.isDevBypass === true && isAdminAuthBypassed();

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--background)] text-foreground md:flex-row">
      <AdminSidebar username={owner.username} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── COMMAND HEADER ── */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border-subtle bg-[color:var(--background)]/85 px-6 backdrop-blur-xl md:flex lg:px-8">
          <div className="flex items-center gap-2.5 text-[12.5px]">
            <ShieldCheck size={14} className="text-brand-ink-2" aria-hidden />
            <span className="font-bold uppercase tracking-[0.1em] text-brand-ink-3">
              Control Room
            </span>
            <span className="text-brand-ink-4" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            {isDevBypass ? (
              /* Loud, unmissable: the panel is unauthenticated in this build. */
              <span
                className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 lg:flex"
                style={{
                  borderColor: "var(--status-warning-border)",
                  background: "var(--status-warning-bg)",
                  color: "var(--status-warning-text)",
                }}
                title="NODE_ENV is not 'production', so owner auth is bypassed in this build."
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-dot-pulse" aria-hidden />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.14em]">
                  Dev · auth bypassed
                </span>
              </span>
            ) : (
              <span className="hidden items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1.5 lg:flex">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[color:var(--status-success-text)] animate-dot-pulse"
                  aria-hidden
                />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
                  Owner session
                </span>
              </span>
            )}

            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-border-subtle px-3 text-[11.5px] font-bold uppercase tracking-[0.07em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
            >
              <ExternalLink size={13} aria-hidden />
              View live site
            </Link>

            <form action={ownerLogout}>
              <button
                type="submit"
                className="group inline-flex h-9 items-center gap-2 rounded-[10px] border border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] px-3.5 text-[11.5px] font-bold uppercase tracking-[0.07em] text-[color:var(--status-danger-text)] transition-colors hover:brightness-125"
              >
                <LogOut
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
                Sign out
              </button>
            </form>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
