import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import * as argon2 from "argon2";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  const deviceToken = cookieStore.get("device_token")?.value;

  if (!sessionId || !deviceToken) {
    redirect("/access");
  }

  // Double check device token is valid for this user
  const customer = await prisma.customer.findUnique({
    where: { id: sessionId },
    include: { devices: true }
  });

  if (!customer) {
    redirect("/access");
  }

  let authorized = false;
  for (const device of customer.devices) {
    if (await argon2.verify(device.deviceTokenHash, deviceToken)) {
      authorized = true;
      break;
    }
  }

  if (!authorized) {
    redirect("/access");
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {children}
    </div>
  );
}
