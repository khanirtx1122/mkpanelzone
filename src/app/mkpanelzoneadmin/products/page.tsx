import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Plus, Edit, Eye, Power, PowerOff } from "lucide-react";
import { toggleProductStatus } from "../actions"; // Will add this

export default async function ProductsPage(props: {
  searchParams?: Promise<{ status?: string; query?: string }>;
}) {
  const searchParams = await props.searchParams;
  const statusFilter = searchParams?.status || "ALL";
  const query = searchParams?.query || "";

  let whereClause: any = {};
  if (statusFilter === "ACTIVE") whereClause.active = true;
  if (statusFilter === "INACTIVE") whereClause.active = false;
  
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" }
  });

  const statuses = ["ALL", "ACTIVE", "INACTIVE"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Products</h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">Manage products, pricing and visibility.</p>
        </div>
        <Link
          href="/mkpanelzoneadmin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
        >
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {statuses.map(status => (
              <Link
                key={status}
                href={`/mkpanelzoneadmin/products?status=${status}${query ? `&query=${query}` : ""}`}
                className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter.toUpperCase() === status ? "bg-brand-blue-500/20 text-brand-blue-400 border border-brand-blue-500/30" : "text-brand-ink-3 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {status}
              </Link>
            ))}
          </div>

          <form className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink-3" size={16} />
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Search products..."
              className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50 transition-colors"
            />
            <input type="hidden" name="status" value={statusFilter} />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40">
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Product</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Slug</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Price</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Media</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-brand-ink-3">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.coverImageUrl && (
                          <div className="w-10 h-10 rounded bg-black border border-white/10 overflow-hidden flex-shrink-0">
                            <img src={product.coverImageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-sm font-bold text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-brand-ink-2">
                      {product.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-brand-blue-400">${product.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        product.active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brand-ink-3/10 text-brand-ink-3 border-brand-ink-3/20'
                      }`}>
                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-brand-ink-3">
                      {product.coverImageUrl ? "img " : ""}
                      {product.demoVideoUrl ? "vid" : ""}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-ink-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                          title="View Live"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link 
                          href={`/mkpanelzoneadmin/products/${product.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                        >
                          <Edit size={14} /> Edit
                        </Link>
                        <form action={toggleProductStatus as any}>
                          <input type="hidden" name="productId" value={product.id} />
                          <button 
                            type="submit"
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded transition-colors ${
                              product.active 
                                ? "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20" 
                                : "text-green-400 bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
                            }`}
                          >
                            {product.active ? <PowerOff size={14} /> : <Power size={14} />}
                            {product.active ? "Disable" : "Enable"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
