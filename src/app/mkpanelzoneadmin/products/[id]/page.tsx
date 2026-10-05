import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AdminImageUploader } from "@/components/ui/AdminImageUploader";
import { AdminVideoUploader } from "@/components/ui/AdminVideoUploader";
import { requireOwner } from "@/lib/owner";

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === "new";

  let product = null;
  if (!isNew) {
    product = await prisma.product.findUnique({
      where: { id: params.id }
    });
    if (!product) return notFound();
  }

  async function saveProduct(formData: FormData) {
    "use server";
    if (!(await requireOwner())) redirect("/");

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
          data: { name, slug, description, price, coverImageUrl, demoVideoUrl, active }
        });
      } else {
        await prisma.product.update({
          where: { id: params.id },
          data: { name, slug, description, price, coverImageUrl, demoVideoUrl, active }
        });
      }
      revalidatePath("/mkpanelzoneadmin/products");
      redirect("/mkpanelzoneadmin/products");
    } catch (error) {
      console.error(error);
      // Let it fail silently for now or handle redirect properly
      redirect("/mkpanelzoneadmin/products?error=failed");
    }
  }

  async function deleteProduct() {
    "use server";
    if (!(await requireOwner())) redirect("/");
    if (isNew) return;
    try {
      await prisma.product.delete({ where: { id: params.id } });
      revalidatePath("/mkpanelzoneadmin/products");
      redirect("/mkpanelzoneadmin/products");
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/products?error=failed");
    }
  }

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
                <label htmlFor="active" className="text-sm text-white font-bold">Active & Visible</label>
              </div>
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
              <button 
                type="submit" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
              >
                <Trash2 size={16} /> Delete Product
              </button>
            </form>
          ) : <div />}
          
          <button 
            type="submit" 
            form="productForm"
            className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
          >
            <Save size={16} /> Save Product
          </button>
        </div>
      </div>
    </div>
  );
}
