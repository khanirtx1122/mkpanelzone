import { CreateBranchForm } from "./CreateBranchForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "New Branch | Owner Panel",
};

export default async function NewBranchPage(props: {
  searchParams?: Promise<{ platform?: string }>;
}) {
  const platform = ((await props.searchParams)?.platform || "ANDROID").toUpperCase();
  const valid = ["ANDROID", "IOS", "PC"].includes(platform) ? platform : "ANDROID";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/mkpanelzoneadmin/resources?platform=${valid}`}
          className="inline-flex items-center gap-2 text-brand-ink-3 hover:text-white transition-colors mb-4 text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} />
          Back to Resources
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase mb-2">New {valid} Branch</h1>
        <p className="text-brand-ink-3">
          Branches appear in customer creation and the public access page once enabled.
        </p>
      </div>

      <CreateBranchForm platform={valid} />
    </div>
  );
}
