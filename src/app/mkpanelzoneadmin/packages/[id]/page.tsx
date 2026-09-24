import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Layers, Trash2, Info } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/ownerAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsGroup, SettingsGrid, SettingsField } from "@/components/admin/SettingsField";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/ConfirmSubmit";
import { FieldLabel } from "@/components/ui/Input";

export const metadata = {
  title: "Edit Package | Owner Panel",
};

export const dynamic = "force-dynamic";

const PLATFORM_OPTIONS = [
  { value: "ANDROID", label: "Android" },
  { value: "IOS", label: "iPhone / iOS" },
  { value: "PC", label: "PC" },
];

export default async function EditPackagePage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const isNew = params.id === "new";

  let pkg = null;
  if (!isNew) {
    pkg = await prisma.package.findUnique({
      where: { id: params.id },
    });
    if (!pkg) return notFound();
  }

  async function savePackage(formData: FormData) {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const platformType = formData.get("platformType") as string;
    const isDefaultForAgents = formData.get("isDefaultForAgents") === "true";

    try {
      if (isDefaultForAgents) {
        // Unset any existing default for this platform
        await prisma.package.updateMany({
          where: { platformType, isDefaultForAgents: true },
          data: { isDefaultForAgents: false },
        });
      }

      if (isNew) {
        await prisma.package.create({
          data: { name, description, platformType, isDefaultForAgents },
        });
      } else {
        await prisma.package.update({
          where: { id: params.id },
          data: { name, description, platformType, isDefaultForAgents },
        });
      }
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/packages?error=failed");
    }

    /* Both calls live outside the try block on purpose: `redirect()` signals by
       throwing, so issuing it inside would let the catch above swallow a
       successful save and report it as a failure. */
    revalidatePath("/mkpanelzoneadmin/packages");
    redirect("/mkpanelzoneadmin/packages");
  }

  async function deletePackage() {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");
    if (isNew) return;
    try {
      await prisma.package.delete({ where: { id: params.id } });
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/packages?error=failed");
    }

    revalidatePath("/mkpanelzoneadmin/packages");
    redirect("/mkpanelzoneadmin/packages");
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow={isNew ? "New record" : "Package"}
        title={isNew ? "Add package" : pkg!.name}
        description="A package is an access tier. Assigning one to a customer decides which resources appear in their dashboard."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Packages", href: "/mkpanelzoneadmin/packages" },
          { label: isNew ? "New" : pkg!.name },
        ]}
        actions={
          !isNew ? (
            <ConfirmSubmit
              action={deletePackage}
              tone="danger"
              confirm={{
                title: `Delete “${pkg!.name}”?`,
                description: "This cannot be undone.",
                body:
                  "Deleting a package removes it from the catalogue. Any customer still assigned to it will be left without an access tier until you assign a new one.",
                confirmLabel: "Delete package",
                tone: "danger",
              }}
            >
              <Trash2 size={14} aria-hidden />
              Delete
            </ConfirmSubmit>
          ) : null
        }
      />

      {searchParams?.error === "failed" && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-[14px] px-4 py-3.5 text-[12.5px] leading-relaxed"
          style={{
            background: "var(--status-danger-bg)",
            border: "1px solid var(--status-danger-border)",
            color: "var(--status-danger-text)",
          }}
        >
          <Info size={15} className="mt-[2px] shrink-0" aria-hidden />
          <span>
            The change could not be saved. This usually means the database rejected the
            write — check the server log for the underlying error.
          </span>
        </div>
      )}

      <form action={savePackage} className="space-y-5">
        <SettingsGroup
          icon={<Layers size={16} />}
          title="Package identity"
          description="How this tier is named and which platform it unlocks."
        >
          <SettingsGrid>
            <SettingsField
              label="Package name"
              name="name"
              defaultValue={pkg?.name ?? ""}
              placeholder="e.g. Starter, Pro, Elite"
              hint="Shown to customers on their dashboard and in the agent panel."
            />
            <SettingsField
              label="Platform"
              name="platformType"
              variant="select"
              defaultValue={pkg?.platformType ?? "ANDROID"}
              options={PLATFORM_OPTIONS}
              hint="A customer can only ever hold a package for the platform they signed up on."
            />
            <SettingsField
              label="Description"
              name="description"
              variant="textarea"
              full
              rows={4}
              defaultValue={pkg?.description ?? ""}
              placeholder="What this tier includes…"
              hint="Plain text. Internal notes are fine here — this is not shown to customers."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          title="Agent defaults"
          description="Control which package the agent panel pre-selects."
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              name="isDefaultForAgents"
              id="isDefaultForAgents"
              value="true"
              defaultChecked={pkg?.isDefaultForAgents ?? false}
              className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer rounded border-border-subtle bg-foreground/[0.06] accent-[color:var(--accent)]"
            />
            <div className="min-w-0">
              <FieldLabel htmlFor="isDefaultForAgents" className="cursor-pointer">
                Default package for this platform
              </FieldLabel>
              <p className="text-[11.5px] leading-relaxed text-brand-ink-4">
                Only one package per platform can be the default. Enabling this clears the
                flag on any other package for the same platform.
              </p>
            </div>
          </div>
        </SettingsGroup>

        {/* Sticky action bar — always reachable on long forms */}
        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-[16px] border border-border-subtle px-4 py-3 backdrop-blur-xl [background:var(--glass-bg)]">
          <SubmitButton>
            {isNew ? "Create package" : "Save changes"}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
