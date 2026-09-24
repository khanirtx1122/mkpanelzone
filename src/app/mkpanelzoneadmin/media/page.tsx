import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ImageIcon, Video, Settings2, ImageOff, Play, Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/admin/StatTile";
import {
  DataTableShell,
  DataTableScroll,
  DataTableHead,
  DataTableBody,
  Th,
  Td,
  Tr,
  RowActionLink,
} from "@/components/ui/DataTable";

export const metadata = {
  title: "Product Media | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function ProductMediaPage(props: {
  searchParams?: Promise<{ query?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";

  const whereClause: Prisma.ProductWhereInput = {};
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  const withCover = products.filter((p) => p.coverImageUrl).length;
  const withVideo = products.filter((p) => p.demoVideoUrl).length;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Presentation"
        title="Product Media"
        description="Cover imagery and demo-video behaviour for every product in the catalogue."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Media" }]}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatTile label="Products" value={products.length} icon={<ImageIcon size={13} />} />
        <StatTile
          label="With cover"
          value={withCover}
          tone={withCover === products.length && products.length > 0 ? "success" : "warning"}
        />
        <StatTile
          label="With video"
          value={withVideo}
          tone="info"
          icon={<Video size={13} />}
        />
      </div>

      <FilterBar searchKey="query" searchPlaceholder="Search products by name or slug…" />

      <div className="mt-5">
        {products.length === 0 ? (
          <div className="mat-2 rounded-[16px]">
            <EmptyState
              icon={ImageOff}
              title={query ? "No products match that search" : "No products yet"}
              description={
                query
                  ? "Try a different name or slug."
                  : "Products will appear here once they are created."
              }
            />
          </div>
        ) : (
          <DataTableShell>
            <DataTableScroll>
              <DataTableHead>
                <Th>Product</Th>
                <Th>Cover image</Th>
                <Th>Demo video</Th>
                <Th>Video behaviour</Th>
                <Th align="right">Action</Th>
              </DataTableHead>
              <DataTableBody>
                {products.map((product) => (
                  <Tr key={product.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border-subtle bg-surface">
                          {product.coverImageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={product.coverImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageOff size={18} className="text-brand-ink-4" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[200px] truncate text-[13.5px] font-bold text-foreground">
                            {product.name}
                          </p>
                          <p className="mt-0.5 max-w-[200px] truncate font-mono text-[10.5px] text-brand-ink-4">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td>
                      <PresenceRow
                        on={Boolean(product.coverImageUrl)}
                        onLabel="Attached"
                        offLabel="Missing"
                      />
                    </Td>

                    <Td>
                      <PresenceRow
                        on={Boolean(product.demoVideoUrl)}
                        onLabel="Attached"
                        offLabel="Missing"
                      />
                    </Td>

                    <Td>
                      {product.videoEnabled ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge tone="success" icon={Play}>
                            On
                          </StatusBadge>
                          {product.videoAutoplay && <Flag>Autoplay</Flag>}
                          {product.videoMutedDefault && <Flag>Muted</Flag>}
                          {product.videoLoop && <Flag>Loop</Flag>}
                        </div>
                      ) : (
                        <StatusBadge tone="neutral" icon={X}>
                          Off
                        </StatusBadge>
                      )}
                    </Td>

                    <Td align="right">
                      <RowActionLink href={`/mkpanelzoneadmin/media/${product.id}`}>
                        <Settings2 size={12} aria-hidden />
                        Manage
                      </RowActionLink>
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableScroll>
          </DataTableShell>
        )}
      </div>
    </div>
  );
}

function PresenceRow({
  on,
  onLabel,
  offLabel,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${
        on ? "text-[color:var(--status-success-text)]" : "text-brand-ink-4"
      }`}
    >
      {on ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}
      {on ? onLabel : offLabel}
    </span>
  );
}

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[6px] border border-border-subtle bg-foreground/[0.04] px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em] text-brand-ink-2">
      {children}
    </span>
  );
}
