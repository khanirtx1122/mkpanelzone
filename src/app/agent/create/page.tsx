import { CreateCustomerForm } from "./CreateCustomerForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { UserPlus, Zap, ShieldCheck, Clock } from "lucide-react";

export const metadata = {
  title: "Create Customer | Agent Panel",
};

export const dynamic = "force-dynamic";

/**
 * Create-customer screen (spec §28).
 *
 * Single screen, no wizard: an agent should be able to complete a sale in one
 * pass. The supporting rail states the three facts that prevent most follow-up
 * tickets, rather than decorating the form.
 */
export default async function AgentCreateCustomerPage() {
  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader
        eyebrow="Workstation"
        title="Create Customer"
        description="Register a new customer, bind them to a platform and attach the payment screenshot."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ── Form ────────────────────────────────────────────────── */}
        <section className="mat-3 rounded-[18px] p-5 sm:p-6">
          <header className="mb-5 flex items-center gap-3 border-b border-border-subtle pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-border-subtle bg-foreground/[0.05] text-brand-ink-2">
              <UserPlus size={18} aria-hidden />
            </span>
            <div>
              <h2 className="text-[15px] font-extrabold tracking-tight text-foreground">
                Customer details
              </h2>
              <p className="text-[11.5px] text-brand-ink-3">
                All fields are required
              </p>
            </div>
          </header>

          <CreateCustomerForm />
        </section>

        {/* ── Reference rail ──────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mat-2 rounded-[16px] p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.13em] text-brand-ink-3">
              Before you submit
            </h3>
            <ul className="mt-4 space-y-3.5">
              {[
                {
                  Icon: Zap,
                  text: "Pick the platform carefully — it cannot be changed from the dashboard afterwards.",
                },
                {
                  Icon: Clock,
                  text: "Payment is verified manually by the owner. The customer sees the status change in their account.",
                },
                {
                  Icon: ShieldCheck,
                  /*
                    Read: "Access is bound to one device and enforced on the
                    server, not in the browser." The device token is minted on
                    first sign-in but never verified on later logins, so nothing
                    is enforced at the server. The policy and the real support
                    path are both true, so the copy states those instead.
                  */
                  text: "One account, one device. The first device to sign in is recorded, and support can transfer it if the customer changes hardware.",
                },
              ].map(({ Icon, text }, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-border-subtle bg-foreground/[0.035] text-brand-ink-2">
                    <Icon size={12} aria-hidden />
                  </span>
                  <span className="text-[12px] leading-relaxed text-brand-ink-3">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 px-1 text-[11px] leading-relaxed text-brand-ink-4">
            The default package for the selected platform is assigned automatically. If a
            platform has no default package, creation fails and the owner must configure one.
          </p>
        </aside>
      </div>
    </div>
  );
}
