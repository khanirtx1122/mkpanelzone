import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessForm } from "./AccessForm";
import { ensureDefaultBranches } from "@/lib/branches";
import { listActivePlatforms } from "@/lib/platforms";
import { prisma } from "@/lib/prisma";
import { getWhatsAppNumber, whatsappLink } from "@/lib/settings";
import { MessageCircle } from "lucide-react";

export const metadata = {
  title: "Customer Access | MK Panel Zone",
};

export default async function AccessPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  const deviceToken = cookieStore.get("device_token")?.value;
  if (sessionId && deviceToken) {
    redirect("/dashboard");
  }

  /* The Android branch split is a genuine Android-only structure, so it still
     runs explicitly. Everything platform-generic now comes from the database. */
  await ensureDefaultBranches();

  const platforms = await listActivePlatforms();

  /* Branches for every enabled platform in ONE grouped query rather than a
     per-platform round-trip. The selection screen switches between platforms
     client-side without any additional network work. */
  const branches = await prisma.platformBranch.findMany({
    where: {
      platformType: { in: platforms.map((p) => p.code) },
      isEnabled: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      platformType: true,
      name: true,
      slug: true,
      description: true,
    },
  });

  const branchesByPlatform: Record<string, typeof branches> = {};
  for (const b of branches) {
    (branchesByPlatform[b.platformType] ??= []).push(b);
  }

  /* Support hand-off — primary admin-configured WhatsApp number. */
  const waNumber = await getWhatsAppNumber();
  const helpHref = whatsappLink(waNumber, "Hi MK Panel Zone, I am having a problem accessing my panel.");

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32 relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />
      <AccessForm
        platforms={platforms.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          iconKey: p.iconKey,
        }))}
        branchesByPlatform={branchesByPlatform}
      />

      {/* Compact premium support entry — fits under the access card. */}
      {helpHref && (
        <a
          href={helpHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-full text-[11px] font-extrabold tracking-[0.14em] uppercase text-white active:scale-[0.97] transition-transform"
          style={{
            background: "linear-gradient(135deg, #128C4A, #25D366)",
            boxShadow: "0 8px 20px -12px rgba(37,211,102,0.9)",
          }}
        >
          <MessageCircle size={14} />
          Having Problem?
        </a>
      )}
    </div>
  );
}
