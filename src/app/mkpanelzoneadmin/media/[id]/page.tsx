import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Image as ImageIcon, Video, Info, Film } from "lucide-react";
import { revalidatePath } from "next/cache";
import { AdminImageUploader } from "@/components/ui/AdminImageUploader";
import { AdminVideoUploader } from "@/components/ui/AdminVideoUploader";
import { requireOwner } from "@/lib/ownerAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsGroup, SettingsGrid, SettingsField } from "@/components/admin/SettingsField";
import { SubmitButton } from "@/components/admin/ConfirmSubmit";
import { FieldLabel } from "@/components/ui/Input";

export const metadata = {
  title: "Product Media | Owner Panel",
};

export const dynamic = "force-dynamic";

/** The three playback sources the storefront knows how to render. */
const VIDEO_TYPE_OPTIONS = [
  { value: "DIRECT", label: "Direct file (MP4 / WebM)" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "VIMEO", label: "Vimeo" },
];

/** The playback flags, in the order they appear on the product page. */
const VIDEO_FLAGS = [
  {
    name: "videoAutoplay",
    label: "Autoplay",
    hint: "Starts on its own when the player scrolls into view. Browsers require muted playback for this to be allowed.",
  },
  {
    name: "videoMutedDefault",
    label: "Muted by default",
    hint: "Required in practice for autoplay to work at all.",
  },
  {
    name: "videoLoop",
    label: "Loop",
    hint: "Restarts the clip automatically when it ends.",
  },
] as const;

export default async function ProductMediaDetailsPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);

  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) return notFound();

  async function saveMedia(formData: FormData) {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");

    const coverImageUrl = formData.get("coverImageUrl") as string;
    const demoVideoUrl = formData.get("demoVideoUrl") as string;
    const demoVideoType = formData.get("demoVideoType") as string;
    const demoVideoPosterUrl = formData.get("demoVideoPosterUrl") as string;

    const videoAutoplay = formData.get("videoAutoplay") === "on";
    const videoMutedDefault = formData.get("videoMutedDefault") === "on";
    const videoLoop = formData.get("videoLoop") === "on";
    const videoEnabled = formData.get("videoEnabled") === "on";

    try {
      await prisma.product.update({
        where: { id: params.id },
        data: {
          coverImageUrl,
          demoVideoUrl,
          demoVideoType,
          demoVideoPosterUrl,
          videoAutoplay,
          videoMutedDefault,
          videoLoop,
          videoEnabled,
        },
      });
    } catch (error) {
      console.error(error);
      redirect(`/mkpanelzoneadmin/media/${params.id}?error=failed`);
    }

    /* Outside the try block on purpose: `redirect()` signals by throwing, so
       issuing it inside would let the catch above swallow a successful save and
       bounce back to this page showing a spurious error banner. */
    revalidatePath("/mkpanelzoneadmin/media");
    redirect("/mkpanelzoneadmin/media");
  }

  const flags = {
    videoAutoplay: product.videoAutoplay,
    videoMutedDefault: product.videoMutedDefault,
    videoLoop: product.videoLoop,
  } as Record<string, boolean>;

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow="Media"
        title={product.name}
        description="The cover image and demo video used on this product's storefront page."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Media", href: "/mkpanelzoneadmin/media" },
          { label: product.name },
        ]}
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
          <span>The media settings could not be saved. Check the server log for the underlying error.</span>
        </div>
      )}

      <form action={saveMedia} className="space-y-5">
        <SettingsGroup
          icon={<ImageIcon size={16} />}
          title="Cover image"
          description="The thumbnail used on the storefront grid, search results and order summaries."
        >
          <AdminImageUploader
            name="coverImageUrl"
            defaultValue={product.coverImageUrl || ""}
            label="Cover image"
          />
        </SettingsGroup>

        <SettingsGroup
          icon={<Video size={16} />}
          title="Demo video"
          description="An optional clip shown on the product page. Leave the player disabled to hide the section entirely."
        >
          <div className="space-y-5">
            {/* Master switch first — it governs everything below it */}
            <div className="flex items-start gap-3 rounded-[13px] border border-border-subtle bg-foreground/[0.025] p-3.5">
              <input
                type="checkbox"
                name="videoEnabled"
                id="videoEnabled"
                defaultChecked={product.videoEnabled}
                className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer rounded border-border-subtle bg-foreground/[0.06] accent-[color:var(--accent)]"
              />
              <div className="min-w-0">
                <FieldLabel htmlFor="videoEnabled" className="cursor-pointer">
                  Show the video player
                </FieldLabel>
                <p className="text-[11.5px] leading-relaxed text-brand-ink-4">
                  When off, the product page renders the cover image only. The URL and flags
                  below are kept so you can switch it back on later.
                </p>
              </div>
            </div>

            <SettingsGrid>
              <div className="sm:col-span-2">
                <AdminVideoUploader
                  name="demoVideoUrl"
                  defaultValue={product.demoVideoUrl || ""}
                  label="Video source"
                />
              </div>

              <SettingsField
                label="Source type"
                name="demoVideoType"
                variant="select"
                defaultValue={product.demoVideoType || "DIRECT"}
                options={VIDEO_TYPE_OPTIONS}
                hint="Must match the URL above, or the player will fail to load."
              />

              <div className="flex items-start gap-2.5 self-end rounded-[11px] border border-border-subtle bg-foreground/[0.02] p-3 text-[11.5px] leading-relaxed text-brand-ink-4">
                <Film size={13} className="mt-[2px] shrink-0 text-brand-ink-2" aria-hidden />
                <span>
                  YouTube and Vimeo clips are embedded with their own controls, so the
                  playback flags below do not apply to them.
                </span>
              </div>

              <div className="sm:col-span-2">
                <AdminImageUploader
                  name="demoVideoPosterUrl"
                  defaultValue={product.demoVideoPosterUrl || ""}
                  label="Poster frame"
                />
              </div>
            </SettingsGrid>

            <div className="grid grid-cols-1 gap-4 border-t border-border-subtle pt-5 sm:grid-cols-3">
              {VIDEO_FLAGS.map((flag) => (
                <div key={flag.name} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name={flag.name}
                    id={flag.name}
                    defaultChecked={flags[flag.name]}
                    className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer rounded border-border-subtle bg-foreground/[0.06] accent-[color:var(--accent)]"
                  />
                  <div className="min-w-0">
                    <FieldLabel htmlFor={flag.name} className="cursor-pointer">
                      {flag.label}
                    </FieldLabel>
                    <p className="text-[11.5px] leading-relaxed text-brand-ink-4">{flag.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SettingsGroup>

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-[16px] border border-border-subtle px-4 py-3 backdrop-blur-xl [background:var(--glass-bg)]">
          <SubmitButton>Save media settings</SubmitButton>
        </div>
      </form>
    </div>
  );
}
