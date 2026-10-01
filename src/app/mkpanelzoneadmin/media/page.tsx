import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Video, Image as ImageIcon, Settings, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

export default async function ProductMediaPage(props: {
  searchParams?: Promise<{ query?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);

  let whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
    ];
  }

  /* Paginated + narrow SELECT: only the media-related columns are read, not
     the whole product row. */
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        coverImageUrl: true,
        demoVideoUrl: true,
        videoEnabled: true,
        videoAutoplay: true,
        videoMutedDefault: true,
        videoLoop: true,
      },
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/mkpanelzoneadmin/media${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Product Media</h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">Manage product images and video settings.</p>
        </div>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex justify-end bg-black/20">
          <form className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink-3" size={16} />
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Search products..."
              className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50 transition-colors"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40">
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Product</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Media Setup</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Video Settings</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-brand-ink-3">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-black border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.coverImageUrl ? (
                            <img src={product.coverImageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-white/20" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{product.name}</div>
                          <div className="text-xs text-brand-ink-3 font-mono">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <ImageIcon size={14} className={product.coverImageUrl ? "text-green-400" : "text-red-400"} />
                          <span className={product.coverImageUrl ? "text-white" : "text-brand-ink-3"}>Cover Image</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Video size={14} className={product.demoVideoUrl ? "text-green-400" : "text-red-400"} />
                          <span className={product.demoVideoUrl ? "text-white" : "text-brand-ink-3"}>Demo Video</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${product.videoEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {product.videoEnabled ? 'ON' : 'OFF'}
                        </span>
                        {product.videoEnabled && (
                          <>
                            {product.videoAutoplay && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-brand-ink-2">Autoplay</span>}
                            {product.videoMutedDefault && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-brand-ink-2">Muted</span>}
                            {product.videoLoop && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-brand-ink-2">Loop</span>}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/mkpanelzoneadmin/media/${product.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                      >
                        <Settings size={14} /> Manage Media
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/20">
            <p className="text-xs font-mono text-brand-ink-3">
              Page {page} of {totalPages} · {total} products
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={buildPageUrl(Math.max(1, page - 1))}
                className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  page <= 1
                    ? "text-brand-ink-3/40 pointer-events-none border border-white/5"
                    : "text-white bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                <ChevronLeft size={14} /> Prev
              </Link>
              <Link
                href={buildPageUrl(Math.min(totalPages, page + 1))}
                className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  page >= totalPages
                    ? "text-brand-ink-3/40 pointer-events-none border border-white/5"
                    : "text-white bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                Next <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
