import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Megaphone, Trash2, Info, CalendarClock } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/ownerAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsGroup, SettingsGrid, SettingsField } from "@/components/admin/SettingsField";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/ConfirmSubmit";
import { FieldLabel } from "@/components/ui/Input";

export const metadata = {
  title: "Edit Announcement | Owner Panel",
};

export const dynamic = "force-dynamic";

/** Mirrors the four tones the public announcement bar knows how to render. */
const TYPE_OPTIONS = [
  { value: "INFO", label: "Info — blue" },
  { value: "SUCCESS", label: "Success — green" },
  { value: "WARNING", label: "Warning — amber" },
  { value: "ALERT", label: "Alert — red" },
];

const SCOPE_OPTIONS = [
  { value: "ALL", label: "Everyone" },
  { value: "MEMBERS", label: "Signed-in customers only" },
  { value: "GUESTS", label: "Signed-out visitors only" },
];

/**
 * `datetime-local` inputs speak local wall-clock time with no zone, so a UTC
 * Date has to be shifted by the current offset before it is sliced. Getting
 * this wrong silently moves the schedule by the offset amount.
 */
function formatForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default async function EditAnnouncementPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const isNew = params.id === "new";

  let announcement = null;
  if (!isNew) {
    announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
    });
    if (!announcement) return notFound();
  }

  async function saveAnnouncement(formData: FormData) {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const link = formData.get("link") as string;
    const type = formData.get("type") as string;
    const scope = formData.get("scope") as string;
    const active = formData.get("active") === "on";
    const startDateRaw = formData.get("startDate") as string;
    const endDateRaw = formData.get("endDate") as string;

    const startDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : null;

    try {
      if (isNew) {
        await prisma.announcement.create({
          data: { title, message, link, type, scope, active, startDate, endDate },
        });
      } else {
        await prisma.announcement.update({
          where: { id: params.id },
          data: { title, message, link, type, scope, active, startDate, endDate },
        });
      }
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/announcements?error=failed");
    }

    /* Outside the try block on purpose: `redirect()` signals by throwing, so
       issuing it inside would let the catch above swallow a successful save. */
    revalidatePath("/mkpanelzoneadmin/announcements");
    // The public bar reads this on every request, so the storefront is revalidated too.
    revalidatePath("/");
    redirect("/mkpanelzoneadmin/announcements");
  }

  async function deleteAnnouncement() {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");
    if (isNew) return;
    try {
      await prisma.announcement.delete({ where: { id: params.id } });
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/announcements?error=failed");
    }

    revalidatePath("/mkpanelzoneadmin/announcements");
    revalidatePath("/");
    redirect("/mkpanelzoneadmin/announcements");
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow={isNew ? "New record" : "Announcement"}
        title={isNew ? "Create announcement" : (announcement!.title || "Announcement")}
        description="A single line of site-wide copy. It appears above the navigation bar on the storefront."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Announcements", href: "/mkpanelzoneadmin/announcements" },
          { label: isNew ? "New" : (announcement!.title || "Edit") },
        ]}
        actions={
          !isNew ? (
            <ConfirmSubmit
              action={deleteAnnouncement}
              tone="danger"
              confirm={{
                title: "Delete this announcement?",
                description: "This cannot be undone.",
                body: "It disappears from the storefront immediately. Past visitors will simply no longer see it.",
                confirmLabel: "Delete",
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
          <span>The announcement could not be saved. Check the server log for the underlying error.</span>
        </div>
      )}

      <form action={saveAnnouncement} className="space-y-5">
        <SettingsGroup
          icon={<Megaphone size={16} />}
          title="Content"
          description="The message visitors read, and where it points if they click it."
        >
          <SettingsGrid>
            <SettingsField
              label="Internal title"
              name="title"
              defaultValue={announcement?.title ?? ""}
              placeholder="e.g. Summer sale 2026"
              hint="For your own reference in this list. Not shown to visitors."
            />
            <SettingsField
              label="Click link"
              name="link"
              type="url"
              mono
              defaultValue={announcement?.link ?? ""}
              placeholder="https://…"
              hint="Optional. Leave empty to render the bar as plain text."
            />
            <SettingsField
              label="Message"
              name="message"
              variant="textarea"
              full
              rows={3}
              defaultValue={announcement?.message ?? ""}
              placeholder="Message shown to visitors…"
              hint="Keep it to one short sentence — the bar is a single line and truncates on mobile."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          icon={<CalendarClock size={16} />}
          title="Presentation & schedule"
          description="Who sees it, how it is coloured, and when it is allowed to run."
        >
          <SettingsGrid>
            <SettingsField
              label="Style"
              name="type"
              variant="select"
              defaultValue={announcement?.type ?? "INFO"}
              options={TYPE_OPTIONS}
              hint="Sets the accent colour of the bar."
            />
            <SettingsField
              label="Audience"
              name="scope"
              variant="select"
              defaultValue={announcement?.scope ?? "ALL"}
              options={SCOPE_OPTIONS}
            />
            <SettingsField
              label="Start"
              name="startDate"
              type="datetime-local"
              defaultValue={formatForInput(announcement?.startDate)}
              hint="Optional. Before this moment the bar stays hidden."
            />
            <SettingsField
              label="End"
              name="endDate"
              type="datetime-local"
              defaultValue={formatForInput(announcement?.endDate)}
              hint="Optional. After this moment the bar stops showing."
            />

            <div className="flex items-start gap-3 sm:col-span-2">
              <input
                type="checkbox"
                name="active"
                id="active"
                defaultChecked={isNew ? true : (announcement?.active ?? false)}
                className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer rounded border-border-subtle bg-foreground/[0.06] accent-[color:var(--accent)]"
              />
              <div className="min-w-0">
                <FieldLabel htmlFor="active" className="cursor-pointer">
                  Active
                </FieldLabel>
                <p className="text-[11.5px] leading-relaxed text-brand-ink-4">
                  The master switch. When off, the bar is hidden regardless of the schedule
                  above — useful for taking a message down without deleting it.
                </p>
              </div>
            </div>
          </SettingsGrid>
        </SettingsGroup>

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-[16px] border border-border-subtle px-4 py-3 backdrop-blur-xl [background:var(--glass-bg)]">
          <SubmitButton>{isNew ? "Create announcement" : "Save changes"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
