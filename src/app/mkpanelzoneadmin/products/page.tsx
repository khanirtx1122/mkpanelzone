import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import {
  Plus,
  Edit3,
  ExternalLink,
  Power,
  PowerOff,
  Package,
  ImageOff,
  CheckCircle2,
} from "lucide-react";
import { toggleProductStatus } from "../actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/admin/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/admin/StatTile";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
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
  title: "Products | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage(props: {
  searchParams?: Promise<{ status?: string; query?: string }>;
}) {
  const searchParams = await props.searchParams;
  const statusFilter = searchParams?.status || "ALL";
  const query = searchParams?.query || "";

  const whereClause: Prisma.ProductWhereInput = {};
  if (statusFilter === "ACTIVE") whereClause.active = true;
  if (statusFilter === "INACTIVE") whereClause.active = false;
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
    ];
  }

  const [products, activeTotal, inactiveTotal] = await Promise.all([
    prisma.product.findMany({ where: whereClause, orderBy: { createdAt: "desc" } }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { active: false } }),
  ]);

  const isFiltered = statusFilter !== "ALL" || Boolean(query);
  const setToggle = toggleProductStatus as unknown as (formData: FormData) => Promise<void>;

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Control the storefront catalogue: pricing, visibility and the media attached to each product page."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Products" }]}
        actions={
          <Button asChild variant="primary">
            <Link href="/mkpanelzoneadmin/products/new">
              <Plus size={16} />
              <span>Add Product</span>
            </Link>
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatTile
          label={isFiltered ? "Matching" : "Total"}
          value={products.length}
          icon={<Package size={13} />}
        />
        <StatTile
          label="Live"
          value={activeTotal}
          tone="success"
          icon={<CheckCircle2 size={13} />}
        />
        <StatTile label="Hidden" value={inactiveTotal} tone={inactiveTotal > 0 ? "warning" : "neutral"} />
      </div>

      <FilterBar
        searchKey="query"
        searchPlaceholder="Search product name or slug…"
        selects={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "ACTIVE", label: "Live" },
              { value: "INACTIVE", label: "Hidden" },
            ],
          },
        ]}
      />

      <div className="mt-5">
        {products.length === 0 ? (
          <div className="mat-2 rounded-[16px]">
            <EmptyState
              icon={Package}
              title={isFiltered ? "No products match this view" : "No products yet"}
              description={
                isFiltered
                  ? "Adjust the filters above to see the rest of the catalogue."
                  : "Add the first product to make it available on the storefront."
              }
            />
          </div>
        ) : (
          <DataTableShell>
            <DataTableScroll>
              <DataTableHead>
                <Th>Product</Th>
                <Th>Slug</Th>
                <Th align="right">Price</Th>
                <Th>Visibility</Th>
                <Th>Media</Th>
                <Th align="right">Actions</Th>
              </DataTableHead>
              <DataTableBody>
                {products.map((product) => (
                  <Tr key={product.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {product.coverImageUrl ? (
                          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-[9px] border border-border-subtle bg-surface">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.coverImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </span>
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border border-border-subtle bg-foreground/[0.03] text-brand-ink-4">
                            <ImageOff size={15} aria-hidden />
                          </span>
                        )}
                        <span className="max-w-[220px] truncate text-[13.5px] font-bold text-foreground">
                          {product.name}
                        </span>
                      </div>
                    </Td>

                    <Td>
                      <span className="font-mono text-[11.5px] text-brand-ink-3">
                        {product.slug}
                      </span>
                    </Td>

                    <Td align="right">
                      <span className="tabular text-[13.5px] font-bold text-foreground">
                        PKR {product.price.toFixed(2)}
                      </span>
                    </Td>

                    <Td>
                      <StatusBadge tone={product.active ? "success" : "neutral"} dot>
                        {product.active ? "Live" : "Hidden"}
                      </StatusBadge>
                    </Td>

                    <Td>
                      <div className="flex items-center gap-1.5">
                        <MediaChip label="IMG" on={Boolean(product.coverImageUrl)} />
                        <MediaChip label="VID" on={Boolean(product.demoVideoUrl)} />
                      </div>
                    </Td>

                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        <RowActionLink
                          href={`/products/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View live product page"
                        >
                          <ExternalLink size={12} aria-hidden />
                        </RowActionLink>

                        <RowActionLink href={`/mkpanelzoneadmin/products/${product.id}`}>
                          <Edit3 size={12} aria-hidden />
                          Edit
                        </RowActionLink>

                        <ConfirmSubmit
                          action={setToggle}
                          fields={{ productId: product.id }}
                          tone={product.active ? "warning" : "success"}
                          confirm={
                            product.active
                              ? {
                                  title: `Hide “${product.name}”?`,
                                  description:
                                    "The product page will stop appearing in the catalogue and cannot be purchased.",
                                  body: "Existing orders and customer entitlements are untouched. You can make it live again at any time.",
                                  confirmLabel: "Hide product",
                                  tone: "warning",
                                }
                              : undefined
                          }
                        >
                          {product.active ? (
                            <>
                              <PowerOff size={12} aria-hidden />
                              Hide
                            </>
                          ) : (
                            <>
                              <Power size={12} aria-hidden />
                              Publish
                            </>
                          )}
                        </ConfirmSubmit>
                      </div>
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

function MediaChip({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`rounded-[6px] border px-1.5 py-[3px] text-[9px] font-bold tracking-[0.08em] ${
        on
          ? "border-border-subtle bg-foreground/[0.05] text-brand-ink-2"
          : "border-border-subtle bg-foreground/[0.02] text-brand-ink-4"
      }`}
      title={on ? `${label} attached` : `No ${label}`}
    >
      {label}
    </span>
  );
}
