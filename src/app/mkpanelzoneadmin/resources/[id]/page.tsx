import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Link2, Trash2, Info, ShieldAlert, KeyRound } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/ownerAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsGroup, SettingsGrid, SettingsField } from "@/components/admin/SettingsField";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/ConfirmSubmit";

export const metadata = {
  title: "Edit Resource | Owner Panel",
};

export const dynamic = "force-dynamic";

const PLATFORM_OPTIONS = [
  { value: "ANDROID", label: "Android" },
  { value: "IOS", label: "iPhone / iOS" },
  { value: "PC", label: "PC" },
];

const TYPE_OPTIONS = [
  { value: "LINK", label: "External link" },
  { value: "FILE", label: "File download URL" },
  { value: "SECRET", label: "Secret key / licence" },
  { value: "NOTE", label: "Instruction note" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/**
 * Messages for the validation failures that `saveResource` can detect. These
 * were previously collapsed into a generic "failed" flag on the list page,
 * which meant a platform mismatch looked identical to a database outage.
 */
const ERROR_COPY: Record<string, string> = {
  mismatch:
    "That package belongs to a different platform. A resource's platform must match the platform of the package it is attached to, or the customer dashboard would offer it to the wrong device.",
  package: "The selected package no longer exists. Pick another one and save again.",
  failed: "The resource could not be saved. Check the server log for the underlying error.",
};

export default async function EditResourcePage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ packageId?: string; platform?: string; error?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const isNew = params.id === "new";
  const defaultPackageId = searchParams?.packageId || "";
  const platformFilter = searchParams?.platform || null;

  let resource = null;
  if (!isNew) {
    resource = await prisma.packageResource.findUnique({
      where: { id: params.id },
    });
    if (!resource) return notFound();
  }

  const packages = await prisma.package.findMany({
    where: platformFilter ? { platformType: platformFilter } : {},
    orderBy: { name: "asc" },
  });

  const androidPackages = packages.filter((p) => p.platformType === "ANDROID");
  const iosPackages = packages.filter((p) => p.platformType === "IOS");
  const pcPackages = packages.filter((p) => p.platformType === "PC");

  async function saveResource(formData: FormData) {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const rawPackageId = formData.get("packageId") as string;
    const packageId = rawPackageId === "" ? null : rawPackageId;
    const platformType = formData.get("platformType") as string;
    const url = (formData.get("url") as string) || null;
    const secret = (formData.get("secret") as string) || null;
    const status = formData.get("status") as string;

    const backToForm = (code: string) =>
      redirect(`/mkpanelzoneadmin/resources/${params.id}?error=${code}`);

    /*
      Validation runs before the try block. `redirect()` works by throwing, so a
      redirect issued inside the block would be caught by our own handler — and
      the specific reason for the failure would be lost.
    */
    if (packageId) {
      const pkg = await prisma.package.findUnique({ where: { id: packageId } });
      if (!pkg) backToForm("package");
      if (pkg!.platformType !== platformType) backToForm("mismatch");
    }

    try {
      if (isNew) {
        await prisma.packageResource.create({
          data: { name, type, packageId, platformType, url, secret, status },
        });
      } else {
        await prisma.packageResource.update({
          where: { id: params.id },
          data: { name, type, packageId, platformType, url, secret, status },
        });
      }
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/resources?error=failed");
    }

    revalidatePath("/mkpanelzoneadmin/resources");
    redirect("/mkpanelzoneadmin/resources");
  }

  async function deleteResource() {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");
    if (isNew) return;
    try {
      await prisma.packageResource.delete({ where: { id: params.id } });
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/resources?error=failed");
    }

    revalidatePath("/mkpanelzoneadmin/resources");
    redirect("/mkpanelzoneadmin/resources");
  }

  const errorCode = searchParams?.error;
  const errorMessage = errorCode ? ERROR_COPY[errorCode] : undefined;

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow={isNew ? "New record" : "Resource"}
        title={isNew ? "Add resource" : resource!.name}
        description="A resource is what a customer actually receives — a link, a download, or a licence key."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Resources", href: "/mkpanelzoneadmin/resources" },
          { label: isNew ? "New" : resource!.name },
        ]}
        actions={
          !isNew ? (
            <ConfirmSubmit
              action={deleteResource}
              tone="danger"
              confirm={{
                title: `Delete “${resource!.name}”?`,
                description: "This cannot be undone.",
                body: "It disappears from every customer dashboard that was showing it. Customers keep nothing to fall back on for this entry.",
                confirmLabel: "Delete resource",
                tone: "danger",
              }}
            >
              <Trash2 size={14} aria-hidden />
              Delete
            </ConfirmSubmit>
          ) : null
        }
      />

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-[14px] px-4 py-3.5 text-[12.5px] leading-relaxed"
          style={{
            background:
              errorCode === "mismatch" ? "var(--status-warning-bg)" : "var(--status-danger-bg)",
            border:
              errorCode === "mismatch"
                ? "1px solid var(--status-warning-border)"
                : "1px solid var(--status-danger-border)",
            color:
              errorCode === "mismatch"
                ? "var(--status-warning-text)"
                : "var(--status-danger-text)",
          }}
        >
          {errorCode === "mismatch" ? (
            <ShieldAlert size={15} className="mt-[2px] shrink-0" aria-hidden />
          ) : (
            <Info size={15} className="mt-[2px] shrink-0" aria-hidden />
          )}
          <span>{errorMessage}</span>
        </div>
      )}

      <form action={saveResource} className="space-y-5">
        <SettingsGroup
          icon={<Link2 size={16} />}
          title="Placement"
          description="Which platform, and optionally which specific package, this resource belongs to."
        >
          <SettingsGrid>
            <SettingsField
              label="Platform"
              name="platformType"
              variant="select"
              defaultValue={resource?.platformType ?? platformFilter ?? "ANDROID"}
              options={PLATFORM_OPTIONS}
              hint="Must match the package below, if one is selected."
            />
            <SettingsField
              label="Target package"
              name="packageId"
              variant="select"
              defaultValue={resource?.packageId ?? defaultPackageId}
              options={[
                { value: "", label: "No specific package (all packages on this platform)" },
                ...androidPackages.map((pkg) => ({
                  value: pkg.id,
                  label: `Android — ${pkg.name}`,
                })),
                ...iosPackages.map((pkg) => ({
                  value: pkg.id,
                  label: `iPhone — ${pkg.name}`,
                })),
                ...pcPackages.map((pkg) => ({ value: pkg.id, label: `PC — ${pkg.name}` })),
              ]}
              hint="Leave unset to make the resource available to every package on the chosen platform."
            />
          </SettingsGrid>

          {packages.length === 0 && (
            <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-brand-ink-4">
              <Info size={13} className="mt-[1px] shrink-0" aria-hidden />
              <span>
                No packages exist for this platform yet, so this resource can only be
                platform-wide. Create a package first to target it more precisely.
              </span>
            </p>
          )}
        </SettingsGroup>

        <SettingsGroup
          icon={<KeyRound size={16} />}
          title="Resource"
          description="How it is labelled and whether it is currently handed out."
        >
          <SettingsGrid>
            <SettingsField
              label="Name"
              name="name"
              defaultValue={resource?.name ?? ""}
              placeholder="e.g. Premium scripts hub"
              hint="This is the title the customer sees in their dashboard."
            />
            <SettingsField
              label="Type"
              name="type"
              variant="select"
              defaultValue={resource?.type ?? "LINK"}
              options={TYPE_OPTIONS}
              hint="Secret and note types are rendered as copyable, masked text rather than as a link."
            />
            <SettingsField
              label="Status"
              name="status"
              variant="select"
              defaultValue={resource?.status ?? "active"}
              options={STATUS_OPTIONS}
              hint="Inactive resources stay on the record but are withheld from customer dashboards."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          title="Payload"
          description="The destination and, if needed, the secret that accompanies it."
        >
          <SettingsGrid>
            <SettingsField
              label="URL"
              name="url"
              mono
              full
              defaultValue={resource?.url ?? ""}
              placeholder="https://…"
              hint="Optional for notes and secrets; required in practice for links and downloads."
            />
            <SettingsField
              label="Secret value or notes"
              name="secret"
              variant="textarea"
              mono
              full
              rows={4}
              defaultValue={resource?.secret ?? ""}
              placeholder="Licence key, credentials, or step-by-step instructions…"
              hint="Delivered to the customer and masked behind a reveal control on their dashboard."
            />
          </SettingsGrid>
        </SettingsGroup>

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-[16px] border border-border-subtle px-4 py-3 backdrop-blur-xl [background:var(--glass-bg)]">
          <SubmitButton>{isNew ? "Create resource" : "Save changes"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
