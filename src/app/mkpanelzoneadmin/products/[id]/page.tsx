import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
  Info,
  Package,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AdminImageUploader } from "@/components/ui/AdminImageUploader";
import { AdminVideoUploader } from "@/components/ui/AdminVideoUploader";
import { requireOwner } from "@/lib/ownerAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsGroup, SettingsGrid, SettingsField } from "@/components/admin/SettingsField";
import { TabbedForm } from "@/components/admin/TabbedForm";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/ConfirmSubmit";
import { FieldLabel } from "@/components/ui/Input";

export const metadata = {
  title: "Edit Product | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function EditProductPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const isNew = params.id === "new";

  let product = null;
  if (!isNew) {
    product = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!product) return notFound();
  }

  async function saveProduct(formData: FormData) {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const coverImageUrl = formData.get("coverImageUrl") as string;
    const demoVideoUrl = formData.get("demoVideoUrl") as string;
    const active = formData.get("active") === "on";

    try {
      if (isNew) {
        await prisma.product.create({
          data: { name, slug, description, price, coverImageUrl, demoVideoUrl, active },
        });
      } else {
        await prisma.product.update({
          where: { id: params.id },
          data: { name, slug, description, price, coverImageUrl, demoVideoUrl, active },
        });
      }
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/products?error=failed");
    }

    /* Outside the try block on purpose: `redirect()` signals by throwing, so
       issuing it inside would let the catch above swallow a successful save. */
    revalidatePath("/mkpanelzoneadmin/products");
    redirect("/mkpanelzoneadmin/products");
  }

  async function deleteProduct() {
    "use server";
    /* Authorization (spec §49): these inline actions write to the database
       and previously had no check at all. */
    const authOwner = await requireOwner();
    if (!authOwner) redirect("/mk-agents");
    if (isNew) return;
    try {
      await prisma.product.delete({ where: { id: params.id } });
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/products?error=failed");
    }

    revalidatePath("/mkpanelzoneadmin/products");
    redirect("/mkpanelzoneadmin/products");
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow={isNew ? "New record" : "Product"}
        title={isNew ? "Add product" : product!.name}
        description="Products are what visitors buy. Everything here is public once the product is active."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Products", href: "/mkpanelzoneadmin/products" },
          { label: isNew ? "New" : product!.name },
        ]}
        actions={
          <>
            {!isNew && product!.active && (
              <Link
                href={`/products/${product!.slug}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-[38px] items-center gap-1.5 rounded-[10px] border border-border-subtle px-3.5 text-[11px] font-bold uppercase tracking-[0.07em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
              >
                <ExternalLink size={13} aria-hidden />
                View live
              </Link>
            )}
            {!isNew && (
              <ConfirmSubmit
                action={deleteProduct}
                tone="danger"
                confirm={{
                  title: `Delete “${product!.name}”?`,
                  description: "This cannot be undone.",
                  body: "The product page stops resolving immediately. Orders already placed against it keep their own record and price snapshot.",
                  confirmLabel: "Delete product",
                  tone: "danger",
                }}
              >
                <Trash2 size={14} aria-hidden />
                Delete
              </ConfirmSubmit>
            )}
          </>
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
            The product could not be saved. A duplicate slug is the most common cause —
            check the server log for the underlying error.
          </span>
        </div>
      )}

      <form action={saveProduct} className="space-y-5">
        <TabbedForm
          tabs={[
            { id: "details", label: "Details", icon: <FileText size={13} aria-hidden /> },
            { id: "media", label: "Media", icon: <ImageIcon size={13} aria-hidden /> },
            { id: "visibility", label: "Visibility", icon: <Eye size={13} aria-hidden /> },
          ]}
        >
          {/* ── Details ───────────────────────────────────────────────── */}
          <SettingsGroup
            icon={<Package size={16} />}
            title="Listing details"
            description="The name, address and price customers see."
          >
            <SettingsGrid>
              <SettingsField
                label="Product name"
                name="name"
                defaultValue={product?.name ?? ""}
                placeholder="e.g. MK Panel Pro"
                hint="Shown as the page heading and in the product grid."
              />
              <SettingsField
                label="URL slug"
                name="slug"
                mono
                defaultValue={product?.slug ?? ""}
                placeholder="mk-panel-pro"
                hint="Lowercase words separated by hyphens. Must be unique — the page lives at /products/<slug>."
              />
              <SettingsField
                label="Price (PKR)"
                name="price"
                type="number"
                mono
                defaultValue={String(product?.price ?? 0)}
                placeholder="0.00"
                hint="Amount in Pakistani Rupees. This is the figure used at checkout."
              />
              <SettingsField
                label="Description"
                name="description"
                variant="textarea"
                full
                rows={5}
                defaultValue={product?.description ?? ""}
                placeholder="What the customer gets…"
                hint="Plain text. Rendered on the product page beneath the heading."
              />
            </SettingsGrid>
          </SettingsGroup>

          {/* ── Media ─────────────────────────────────────────────────── */}
          <div className="space-y-5">
            <SettingsGroup
              icon={<ImageIcon size={16} />}
              title="Cover image"
              description="Used on the product grid, the product page and order summaries."
            >
              <AdminImageUploader
                name="coverImageUrl"
                defaultValue={product?.coverImageUrl ?? ""}
                label="Cover image"
              />
            </SettingsGroup>

            <SettingsGroup
              title="Demo video"
              description="An optional clip for the product page. Playback flags live on the Media page."
            >
              <AdminVideoUploader
                name="demoVideoUrl"
                defaultValue={product?.demoVideoUrl ?? ""}
                label="Video source"
              />
            </SettingsGroup>
          </div>

          {/* ── Visibility ────────────────────────────────────────────── */}
          <SettingsGroup
            icon={<Eye size={16} />}
            title="Visibility"
            description="Whether this product is listed on the storefront."
          >
            <div className="flex items-start gap-3 rounded-[13px] border border-border-subtle bg-foreground/[0.025] p-4">
              <input
                type="checkbox"
                name="active"
                id="active"
                defaultChecked={isNew ? true : (product?.active ?? false)}
                className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer rounded border-border-subtle bg-foreground/[0.06] accent-[color:var(--accent)]"
              />
              <div className="min-w-0">
                <FieldLabel htmlFor="active" className="cursor-pointer">
                  Active and visible
                </FieldLabel>
                <p className="text-[11.5px] leading-relaxed text-brand-ink-4">
                  When off, the product is hidden from the storefront grid and its page
                  returns a not-found response. Existing orders are unaffected.
                </p>
              </div>
            </div>
          </SettingsGroup>
        </TabbedForm>

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-[16px] border border-border-subtle px-4 py-3 backdrop-blur-xl [background:var(--glass-bg)]">
          <SubmitButton>{isNew ? "Create product" : "Save changes"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
