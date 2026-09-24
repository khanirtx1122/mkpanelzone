import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { AppWindow, Trash2, Info, CalendarClock, MousePointerClick } from "lucide-react";
import { revalidatePath } from "next/cache";
import { AdminImageUploader } from "@/components/ui/AdminImageUploader";
import { requireOwner } from "@/lib/ownerAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsGroup, SettingsGrid, SettingsField } from "@/components/admin/SettingsField";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/ConfirmSubmit";
import { FieldLabel } from "@/components/ui/Input";

export const metadata = {
  title: "Edit Popup | Owner Panel",
};

export const dynamic = "force-dynamic";

const FREQUENCY_OPTIONS = [
  { value: "ALWAYS", label: "Every page load" },
  { value: "ONCE_PER_SESSION", label: "Once per session" },
  { value: "ONCE_PER_DAY", label: "Once per day" },
  { value: "ONCE_EVER", label: "Once ever" },
];

const SCOPE_OPTIONS = [
  { value: "ALL", label: "Everyone" },
  { value: "MEMBERS", label: "Signed-in customers only" },
  { value: "GUESTS", label: "Signed-out visitors only" },
];

/**
 * `datetime-local` has no concept of a timezone, so a stored UTC instant must
 * be shifted by the current offset before being sliced into a wall-clock
 * string. Skipping the shift silently reschedules by the offset amount.
 */
function formatForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default async function EditPopupPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const isNew = params.id === "new";

  let popup = null;
  if (!isNew) {
    popup = await prisma.popup.findUnique({
      where: { id: params.id },
    });
    if (!popup) return notFound();
  }

  async function savePopup(formData: FormData) {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const buttonLink = formData.get("buttonLink") as string;
    const buttonText = formData.get("buttonText") as string;
    const frequency = formData.get("frequency") as string;
    const scope = formData.get("scope") as string;
    const active = formData.get("active") === "on";
    const startDateRaw = formData.get("startDate") as string;
    const endDateRaw = formData.get("endDate") as string;

    const startDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : null;

    try {
      if (isNew) {
        await prisma.popup.create({
          data: { title, message, imageUrl, buttonLink, buttonText, frequency, scope, active, startDate, endDate },
        });
      } else {
        await prisma.popup.update({
          where: { id: params.id },
          data: { title, message, imageUrl, buttonLink, buttonText, frequency, scope, active, startDate, endDate },
        });
      }
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/popups?error=failed");
    }

    /* Outside the try block on purpose: `redirect()` signals by throwing, so
       issuing it inside would let the catch above swallow a successful save. */
    revalidatePath("/mkpanelzoneadmin/popups");
    revalidatePath("/");
    redirect("/mkpanelzoneadmin/popups");
  }

  async function deletePopup() {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");
    if (isNew) return;
    try {
      await prisma.popup.delete({ where: { id: params.id } });
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/popups?error=failed");
    }

    revalidatePath("/mkpanelzoneadmin/popups");
    revalidatePath("/");
    redirect("/mkpanelzoneadmin/popups");
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow={isNew ? "New record" : "Popup"}
        title={isNew ? "Create popup" : (popup!.title || "Popup")}
        description="A modal shown over the storefront. Unlike an announcement, it can carry artwork and a call to action."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Popups", href: "/mkpanelzoneadmin/popups" },
          { label: isNew ? "New" : (popup!.title || "Edit") },
        ]}
        actions={
          !isNew ? (
            <ConfirmSubmit
              action={deletePopup}
              tone="danger"
              confirm={{
                title: `Delete “${popup!.title}”?`,
                description: "This cannot be undone.",
                body: "The popup stops appearing immediately. Visitors who already dismissed it keep their dismissal record, which is harmless.",
                confirmLabel: "Delete popup",
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
          <span>The popup could not be saved. Check the server log for the underlying error.</span>
        </div>
      )}

      <form action={savePopup} className="space-y-5">
        <SettingsGroup
          icon={<AppWindow size={16} />}
          title="Content"
          description="The headline and body copy shown inside the modal."
        >
          <SettingsGrid>
            <SettingsField
              label="Title"
              name="title"
              full
              defaultValue={popup?.title ?? ""}
              placeholder="e.g. Flash sale live now"
            />
            <SettingsField
              label="Description"
              name="message"
              variant="textarea"
              full
              rows={3}
              defaultValue={popup?.message ?? ""}
              placeholder="A sentence or two of supporting detail…"
              hint="Optional. Keep it short — the modal is narrow on phones."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          title="Artwork"
          description="An optional image rendered above the title."
        >
          <AdminImageUploader
            name="imageUrl"
            defaultValue={popup?.imageUrl ?? ""}
            bucket="media"
            label="Popup image"
          />
        </SettingsGroup>

        <SettingsGroup
          icon={<MousePointerClick size={16} />}
          title="Call to action"
          description="Both fields are needed for a button to appear — a link with no label renders nothing."
        >
          <SettingsGrid>
            <SettingsField
              label="Button link"
              name="buttonLink"
              mono
              defaultValue={popup?.buttonLink ?? ""}
              placeholder="https://…"
              hint="Optional. Must be an absolute URL."
            />
            <SettingsField
              label="Button label"
              name="buttonText"
              defaultValue={popup?.buttonText ?? "Learn More"}
              placeholder="Learn More"
              hint="Only used when a button link is set."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          icon={<CalendarClock size={16} />}
          title="Frequency, audience & schedule"
          description="How often the modal may appear, to whom, and during which window."
        >
          <SettingsGrid>
            <SettingsField
              label="Show frequency"
              name="frequency"
              variant="select"
              defaultValue={popup?.frequency ?? "ONCE_PER_SESSION"}
              options={FREQUENCY_OPTIONS}
              hint="Dismissal is remembered per browser. Choosing “every page load” is intentionally intrusive — use it sparingly."
            />
            <SettingsField
              label="Audience"
              name="scope"
              variant="select"
              defaultValue={popup?.scope ?? "ALL"}
              options={SCOPE_OPTIONS}
              hint="Evaluated on the server before the popup is ever sent to the browser."
            />
            <SettingsField
              label="Start"
              name="startDate"
              type="datetime-local"
              defaultValue={formatForInput(popup?.startDate)}
              hint="Optional."
            />
            <SettingsField
              label="End"
              name="endDate"
              type="datetime-local"
              defaultValue={formatForInput(popup?.endDate)}
              hint="Optional."
            />

            <div className="flex items-start gap-3 sm:col-span-2">
              <input
                type="checkbox"
                name="active"
                id="active"
                defaultChecked={isNew ? true : (popup?.active ?? false)}
                className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer rounded border-border-subtle bg-foreground/[0.06] accent-[color:var(--accent)]"
              />
              <div className="min-w-0">
                <FieldLabel htmlFor="active" className="cursor-pointer">
                  Active
                </FieldLabel>
                <p className="text-[11.5px] leading-relaxed text-brand-ink-4">
                  The master switch, applied on top of the schedule above.
                </p>
              </div>
            </div>
          </SettingsGrid>
        </SettingsGroup>

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-[16px] border border-border-subtle px-4 py-3 backdrop-blur-xl [background:var(--glass-bg)]">
          <SubmitButton>{isNew ? "Create popup" : "Save changes"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
