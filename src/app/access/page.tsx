import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessForm } from "./AccessForm";
import { getAccessConfig } from "@/lib/accessConfig";
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

  /* ── CRITICAL PATH ────────────────────────────────────────────────────
     Profiling this route against the live database showed ~2.7s of SEQUENTIAL
     round-trips before any content could render (two branch upserts, a
     settings read, the platform query, the branch query, another settings
     read), which is what left the loading skeleton on screen.

     Everything the first screen needs now runs CONCURRENTLY, and the stable
     platform/branch configuration is served from a tagged cache. No
     customer-specific data is fetched here — only public selector config. */
  const [config, waNumber] = await Promise.all([
    getAccessConfig(),
    getWhatsAppNumber(),
  ]);

  const helpHref = whatsappLink(waNumber, "Hi MK Panel Zone, I am having a problem accessing my panel.");

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32 relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />
      <AccessForm
        platforms={config.platforms}
        branchesByPlatform={config.branchesByPlatform}
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
