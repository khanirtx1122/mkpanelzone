import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function EditPaymentMethodPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === "new";

  let method = null;
  if (!isNew) {
    method = await prisma.paymentMethod.findUnique({
      where: { id: params.id }
    });
    if (!method) return notFound(); // Should be method, will fix
  }

  async function saveMethod(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const accountDetails = formData.get("accountDetails") as string;
    const active = formData.get("active") === "on";

    try {
      if (isNew) {
        await prisma.paymentMethod.create({
          data: { name, accountDetails, active }
        });
      } else {
        await prisma.paymentMethod.update({
          where: { id: params.id },
          data: { name, accountDetails, active }
        });
      }
      revalidatePath("/mkpanelzoneadmin/payments");
      redirect("/mkpanelzoneadmin/payments");
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/payments?error=failed");
    }
  }

  async function deleteMethod() {
    "use server";
    if (isNew) return;
    try {
      await prisma.paymentMethod.delete({ where: { id: params.id } });
      revalidatePath("/mkpanelzoneadmin/payments");
      redirect("/mkpanelzoneadmin/payments");
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/payments?error=failed");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/mkpanelzoneadmin/payments" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-brand-ink-3 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
            {isNew ? "Add Payment Method" : "Edit Payment Method"}
          </h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">
            Configure account details shown to customers during checkout.
          </p>
        </div>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveMethod} className="space-y-6" id="paymentForm">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Method Name (e.g. Binance, PayPal)</label>
              <input 
                type="text" 
                name="name" 
                defaultValue={method?.name || ""}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Account Details</label>
              <textarea 
                name="accountDetails" 
                defaultValue={method?.accountDetails || ""}
                required
                rows={4}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
              />
              <p className="text-xs text-brand-ink-3 font-mono">Exact details customers should copy/paste to send payments.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  name="active"
                  id="active"
                  defaultChecked={isNew ? true : method?.active}
                  className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10" 
                />
                <label htmlFor="active" className="text-sm text-white font-bold">Active (Available for checkout)</label>
              </div>
            </div>
          </div>
        </form>

        <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
          {!isNew ? (
            <form action={deleteMethod}>
              <button 
                type="submit" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
              >
                <Trash2 size={16} /> Delete Method
              </button>
            </form>
          ) : <div />}
          
          <button 
            type="submit" 
            form="paymentForm"
            className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
          >
            <Save size={16} /> Save Method
          </button>
        </div>
      </div>
    </div>
  );
}
