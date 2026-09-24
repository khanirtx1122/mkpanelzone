import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessForm } from "./AccessForm";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Customer Access | MK Panel Zone",
  description: "Secure portal for your purchased resources.",
};

/**
 * A session cookie is not proof that access is still allowed.
 *
 * `auth_session` holds only the customer id and lives for 30 days, so without
 * this check disabling an account in the owner panel would have no effect on
 * sessions that are already open. Re-reading the row here is what makes the
 * "Disable customer" action take effect.
 */
async function isSessionUsable(customerId: string): Promise<boolean> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { status: true },
    });
    return customer?.status === "active";
  } catch (error) {
    console.error("[access] session check failed:", error);
    /* Fail closed on the redirect: show the sign-in form rather than bouncing
       into a dashboard that may not be able to load its data. */
    return false;
  }
}

export default async function AccessPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  const deviceToken = cookieStore.get("device_token")?.value;

  if (sessionId && deviceToken && (await isSessionUsable(sessionId))) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-24 pt-[112px] sm:pt-[132px]">
      {/* ── Vault-inspired background: dark, engineered, secure ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% -5%, var(--ambient-strong) 0%, transparent 62%), radial-gradient(45% 45% at 90% 80%, var(--ambient-strong) 0%, transparent 66%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-grid-fine opacity-50"
        style={{
          maskImage: "radial-gradient(70% 60% at 50% 30%, rgba(0,0,0,0.9), transparent 78%)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 30%, rgba(0,0,0,0.9), transparent 78%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[1080px] px-4 sm:px-6">
        <AccessForm />
      </div>
    </div>
  );
}
