import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessForm } from "./AccessForm";
import { ensureDefaultBranches, listEnabledBranches } from "@/lib/branches";

export default async function AccessPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  const deviceToken = cookieStore.get("device_token")?.value;
  if (sessionId && deviceToken) {
    redirect("/dashboard");
  }

  await ensureDefaultBranches();
  const androidBranches = await listEnabledBranches("ANDROID");

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32 relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />
      <AccessForm
        androidBranches={androidBranches.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description,
        }))}
      />
    </div>
  );
}
