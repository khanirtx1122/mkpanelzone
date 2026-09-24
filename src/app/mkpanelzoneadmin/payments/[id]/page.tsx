import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { CreditCard, Trash2, Info } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/ownerAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsGroup, SettingsGrid, SettingsField } from "@/components/admin/SettingsField";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/ConfirmSubmit";
import { FieldLabel } from "@/components/ui/Input";

export const metadata = {
  title: "Edit Payment Method | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function EditPaymentMethodPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const isNew = params.id === "new";

  let method = null;
  if (!isNew) {
    method = await prisma.paymentMethod.findUnique({
      where: { id: params.id },
    });
    if (!method) return notFound();
  }

  async function saveMethod(formData: FormData) {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");

    const name = formData.get("name") as string;
    const accountDetails = formData.get("accountDetails") as string;
    const active = formData.get("active") === "on";

    try {
      if (isNew) {
        await prisma.paymentMethod.create({
          data: { name, accountDetails, active },
        });
      } else {
        await prisma.paymentMethod.update({
          where: { id: params.id },
          data: { name, accountDetails, active },
        });
      }
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/payments?error=failed");
    }

    /* Outside the try block on purpose: `redirect()` signals by throwing, so
       issuing it inside would let the catch above swallow a successful save. */
    revalidatePath("/mkpanelzoneadmin/payments");
    redirect("/mkpanelzoneadmin/payments");
  }

  async function deleteMethod() {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");
    if (isNew) return;
    try {
      await prisma.paymentMethod.delete({ where: { id: params.id } });
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/payments?error=failed");
    }

    revalidatePath("/mkpanelzoneadmin/payments");
    redirect("/mkpanelzoneadmin/payments");
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow={isNew ? "New record" : "Payment method"}
        title={isNew ? "Add payment method" : (method!.name ?? "Payment method")}
        description="The exact account details a customer copies when paying. These appear on the checkout page."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Payments", href: "/mkpanelzoneadmin/payments" },
          { label: isNew ? "New" : (method!.name ?? "Edit") },
        ]}
        actions={
          !isNew ? (
            <ConfirmSubmit
              action={deleteMethod}
              tone="danger"
              confirm={{
                title: `Delete “${method!.name}”?`,
                description: "This cannot be undone.",
                body:
                  "Customers will no longer be able to choose this method at checkout. Past orders that used it keep their record.",
                confirmLabel: "Delete method",
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
          <span>The change could not be saved. Check the server log for the underlying error.</span>
        </div>
      )}

      <form action={saveMethod} className="space-y-5">
        <SettingsGroup
          icon={<CreditCard size={16} />}
          title="Method details"
          description="Name it the way customers will recognise it, then paste the exact receiving details."
        >
          <SettingsGrid>
            <SettingsField
              label="Method name"
              name="name"
              defaultValue={method?.name ?? ""}
              placeholder="e.g. Binance Pay, Bank Transfer, JazzCash"
              hint="Shown as the option label at checkout."
            />
            <SettingsField
              label="Account details"
              name="accountDetails"
              variant="textarea"
              full
              rows={5}
              mono
              defaultValue={method?.accountDetails ?? ""}
              placeholder={"Account title\nAccount / wallet number\nAny network or branch note"}
              hint="Rendered verbatim in a copy-to-clipboard block. One detail per line reads best."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          title="Availability"
          description="An inactive method is hidden from checkout but keeps its record."
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              name="active"
              id="active"
              defaultChecked={isNew ? true : (method?.active ?? false)}
              className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer rounded border-border-subtle bg-foreground/[0.06] accent-[color:var(--accent)]"
            />
            <div className="min-w-0">
              <FieldLabel htmlFor="active" className="cursor-pointer">
                Available at checkout
              </FieldLabel>
              <p className="text-[11.5px] leading-relaxed text-brand-ink-4">
                Turn this off to stop new orders using this method without deleting it.
              </p>
            </div>
          </div>
        </SettingsGroup>

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-[16px] border border-border-subtle px-4 py-3 backdrop-blur-xl [background:var(--glass-bg)]">
          <SubmitButton>{isNew ? "Create method" : "Save changes"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
