import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save, Trash2, Tag } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AdminImageUploader } from "@/components/ui/AdminImageUploader";
import { AdminVideoUploader } from "@/components/ui/AdminVideoUploader";
import { AdminSubmitButton } from "@/components/admin/AdminButton";
import { listAllPlatforms } from "@/lib/platforms";

/** Formats a Date for a datetime-local input, in the user's local time. */
function formatForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === "new";

  /* Product, platforms and branches load in one parallel round-trip. */
  const [loadedProduct, platforms, branches] = await Promise.all([
    isNew ? Promise.resolve(null) : prisma.product.findUnique({ where: { id: params.id } }),
    listAllPlatforms(),
    prisma.platformBranch.findMany({
      where: { isEnabled: true },
      orderBy: [{ platformType: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, platformType: true },
    }),
  ]);
  const product = loadedProduct;
  if (!isNew && !product) return notFound();

  const platformLabel = (code: string) => platforms.find((p) => p.code === code)?.name ?? code;

  async function saveProduct(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const coverImageUrl = formData.get("coverImageUrl") as string;
    const demoVideoUrl = formData.get("demoVideoUrl") as string;
    const active = formData.get("active") === "on";

    /* ── Dynamic platform/branch assignment ─────────────────────────────
       Optional; validated against the owner-managed tables so a product can
       only point at a real platform and a branch of that same platform. */
    const rawPlatform = ((formData.get("platformType") as string) || "").toUpperCase();
    const platformType = rawPlatform || null;
    const rawBranchId = ((formData.get("branchId") as string) || "") || null;
    if (platformType) {
      const platform = await prisma.platform.findUnique({ where: { code: platformType } });
      if (!platform) redirect("/mkpanelzoneadmin/products?error=failed");
    }
    if (rawBranchId) {
      const branch = await prisma.platformBranch.findUnique({ where: { id: rawBranchId } });
      if (!branch || branch.platformType !== platformType) {
        redirect("/mkpanelzoneadmin/products?error=failed");
      }
    }

    /* ── Per-product sale ───────────────────────────────────────────────
       Window fields are optional; an expired sale simply stops applying via
       effectivePrice() — no manual cleanup needed. */
    const saleEnabled = formData.get("saleEnabled") === "on";
    const rawSalePrice = (formData.get("salePrice") as string) || "";
    const salePrice = rawSalePrice !== "" && !Number.isNaN(parseFloat(rawSalePrice)) ? parseFloat(rawSalePrice) : null;
    const saleStartsRaw = (formData.get("saleStartsAt") as string) || "";
    const saleEndsRaw = (formData.get("saleEndsAt") as string) || "";
    const saleStartsAt = saleStartsRaw ? new Date(saleStartsRaw) : null;
    const saleEndsAt = saleEndsRaw ? new Date(saleEndsRaw) : null;
    if (saleEnabled && (salePrice == null || salePrice >= price)) {
      // A sale that isn't cheaper is meaningless — refuse rather than confuse.
      redirect("/mkpanelzoneadmin/products?error=sale");
    }

    const data = {
      name, slug, description, price, coverImageUrl, demoVideoUrl, active,
      platformType, branchId: rawBranchId,
      saleEnabled, salePrice, saleStartsAt, saleEndsAt,
    };

    try {
      if (isNew) {
        await prisma.product.create({ data });
      } else {
        await prisma.product.update({ where: { id: params.id }, data });
      }
      revalidatePath("/mkpanelzoneadmin/products");
      revalidatePath("/products");
      revalidatePath("/");
      redirect("/mkpanelzoneadmin/products");
    } catch (error) {
      // Next's redirect() throws internally — rethrow so it still navigates.
      if ((error as { digest?: string })?.digest) throw error;
      console.error("[saveProduct]", error);
      redirect("/mkpanelzoneadmin/products?error=failed");
    }
  }

  async function deleteProduct() {
    "use server";
    if (isNew) return;
    try {
      await prisma.product.delete({ where: { id: params.id } });
      revalidatePath("/mkpanelzoneadmin/products");
      revalidatePath("/products");
      redirect("/mkpanelzoneadmin/products");
    } catch (error) {
      if ((error as { digest?: string })?.digest) throw error;
      console.error("[deleteProduct]", error);
      redirect("/mkpanelzoneadmin/products?error=failed");
    }
  }

  const branchOptions = product?.platformType
    ? branches.filter((b) => b.platformType === product.platformType)
    : branches;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/mkpanelzoneadmin/products" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-brand-ink-3 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
            {isNew ? "Add Product" : "Edit Product"}
          </h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">
            {isNew ? "Create a new product listing." : "Modify product details and pricing."}
          </p>
        </div>
      </div>

      {isNew && <input type="hidden" name="__new" value="1" />}

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveProduct} className="space-y-6" id="productForm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Product Name</label>
              <input
                type="text"
                name="name"
                defaultValue={product?.name || ""}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">URL Slug</label>
              <input
                type="text"
                name="slug"
                defaultValue={product?.slug || ""}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Description</label>
              <textarea
                name="description"
                defaultValue={product?.description || ""}
                required
                rows={4}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                defaultValue={product?.price || 0}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  defaultChecked={isNew ? true : product?.active}
                  className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10"
                />
                <label htmlFor="active" className="text-sm text-white font-bold">Active &amp; Visible</label>
              </div>
            </div>

            {/* ── Platform / Branch assignment (dynamic, both optional) ── */}
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Platform (optional)</label>
              <select
                name="platformType"
                defaultValue={product?.platformType || ""}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              >
                <option value="">— Not assigned —</option>
                {platforms.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-brand-ink-3 font-mono">Used later by checkout and account creation.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Branch (optional)</label>
              <select
                name="branchId"
                defaultValue={product?.branchId || ""}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              >
                <option value="">— Not assigned —</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.id}>{platformLabel(b.platformType)} → {b.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-brand-ink-3 font-mono">Branch must belong to the selected platform.</p>
            </div>

            {/* ── Per-product sale ── */}
            <div className="space-y-4 md:col-span-2 p-4 rounded-xl bg-black/30 border border-white/5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="saleEnabled"
                  id="saleEnabled"
                  defaultChecked={product?.saleEnabled ?? false}
                  className="w-4 h-4 accent-green-500 bg-black/50 border-white/10"
                />
                <label htmlFor="saleEnabled" className="flex items-center gap-2 text-sm font-bold text-white">
                  <Tag size={15} className="text-green-400" /> Enable Sale Price
                </label>
                <span className="text-[11px] text-brand-ink-3 font-mono">
                  Overrides the global offer for this product — never stacked.
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Sale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="salePrice"
                    defaultValue={product?.salePrice ?? ""}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Sale Starts (optional)</label>
                  <input
                    type="datetime-local"
                    name="saleStartsAt"
                    defaultValue={formatForInput(product?.saleStartsAt)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Sale Ends (optional)</label>
                  <input
                    type="datetime-local"
                    name="saleEndsAt"
                    defaultValue={formatForInput(product?.saleEndsAt)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                  />
                </div>
              </div>
              <p className="text-[11px] text-brand-ink-3 font-mono">
                After the end time the normal price returns automatically — no manual cleanup.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Cover Image</label>
              <AdminImageUploader
                name="coverImageUrl"
                defaultValue={product?.coverImageUrl || ""}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Demo Video (Optional)</label>
              <AdminVideoUploader
                name="demoVideoUrl"
                defaultValue={product?.demoVideoUrl || ""}
              />
            </div>
          </div>
        </form>

        <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
          {!isNew ? (
            <form action={deleteProduct}>
              <AdminSubmitButton
                variant="danger"
                label="Delete Product"
                pendingLabel="Deleting…"
                successLabel="Deleted"
              >
                <Trash2 size={16} />
              </AdminSubmitButton>
            </form>
          ) : <div />}

          <AdminSubmitButton form="productForm" label="Save Product" pendingLabel="Saving…" successLabel="Saved ✓">
            <Save size={16} />
          </AdminSubmitButton>
        </div>
      </div>
    </div>
  );
}
