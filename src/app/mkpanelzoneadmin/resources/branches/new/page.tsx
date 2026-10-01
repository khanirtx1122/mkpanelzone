import { CreateBranchForm } from "./CreateBranchForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listAllPlatforms, findPlatformByCode } from "@/lib/platforms";
import { notFound } from "next/navigation";

export const metadata = {
  title: "New Branch | Owner Panel",
};

export default async function NewBranchPage(props: {
  searchParams?: Promise<{ platform?: string }>;
}) {
  const requested = ((await props.searchParams)?.platform || "").toUpperCase();

  /* Platform validity is resolved from the database — a branch can be created
     on any platform the owner has defined, not just the original three. */
  const platformRecord = requested ? await findPlatformByCode(requested) : null;
  if (requested && !platformRecord) return notFound();

  const platforms = await listAllPlatforms();
  const platform = platformRecord?.code ?? platforms[0]?.code ?? "ANDROID";
  const platformName = platformRecord?.name ?? platforms[0]?.name ?? platform;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/mkpanelzoneadmin/resources/platform/${platform}`}
          className="inline-flex items-center gap-2 text-brand-ink-3 hover:text-white transition-colors mb-4 text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} />
          Back to Resources
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase mb-2">New {platformName} Branch</h1>
        <p className="text-brand-ink-3">
          Branches appear in customer creation and the public access page once enabled.
        </p>
      </div>

      <CreateBranchForm
        platform={platform}
        platforms={platforms.map((p) => ({ code: p.code, name: p.name }))}
      />
    </div>
  );
}
