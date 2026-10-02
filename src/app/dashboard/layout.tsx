import { redirect } from "next/navigation";
import { getPaidAccess } from "@/lib/customerAccess";
import { PaymentPending } from "@/components/ui/PaymentPending";
import { findPlatformByCode } from "@/lib/platforms";

/**
 * Protected-route shell.
 *
 * The gate runs here (one cached customer read for the whole request) so every
 * nested dashboard route inherits it. `DashboardPage` re-checks before it
 * queries resources, because App Router renders layout and page concurrently —
 * a layout-only guard would still let the page fetch protected data.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await getPaidAccess();

  if (access.kind === "ANONYMOUS") redirect("/access");

  if (access.kind === "BLOCKED_PAYMENT") {
    const platform = await findPlatformByCode(access.customer.platformType);
    return (
      <div className="min-h-screen bg-brand-bg">
        <PaymentPending
          identifier={access.customer.identifier}
          platformName={platform?.name ?? access.customer.platformType}
        />
      </div>
    );
  }

  return <div className="min-h-screen bg-brand-bg">{children}</div>;
}
