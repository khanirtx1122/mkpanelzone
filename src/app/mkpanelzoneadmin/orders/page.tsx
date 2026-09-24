import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ShoppingCart, ArrowUpRight, DollarSign, Clock, Truck, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { StatusBadge, toneFromStatus } from "@/components/ui/StatusBadge";
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
  title: "Orders | Owner Panel",
};

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "APPROVED", "DELIVERED", "REJECTED", "CANCELLED"] as const;

export default async function OrdersPage(props: {
  searchParams?: Promise<{ status?: string; query?: string }>;
}) {
  const searchParams = await props.searchParams;
  const statusFilter = searchParams?.status || "ALL";
  const query = searchParams?.query || "";

  const whereClause: Prisma.OrderWhereInput = {};
  if (statusFilter !== "ALL") {
    whereClause.status = statusFilter.toLowerCase();
  }
  if (query) {
    whereClause.OR = [
      { orderNumber: { contains: query, mode: "insensitive" } },
      { customerEmail: { contains: query, mode: "insensitive" } },
    ];
  }

  /* Headline numbers come from the unfiltered set so the operator always sees
     the true pipeline size, regardless of the current filter (spec §22). */
  const [orders, statusGroups, revenueAgg] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: { product: { select: { name: true, coverImageUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({
      where: { status: { in: ["approved", "delivered"] } },
      _sum: { priceSnapshot: true },
    }),
  ]);

  const countOf = (s: string) =>
    statusGroups.find((g) => g.status.toLowerCase() === s.toLowerCase())?._count._all ?? 0;

  const totalOrders = statusGroups.reduce((sum, g) => sum + g._count._all, 0);
  const revenue = revenueAgg._sum.priceSnapshot ?? 0;
  const isFiltered = statusFilter !== "ALL" || Boolean(query);

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Review submitted payments, verify proof screenshots and advance each order through approval and delivery."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Orders" }]}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total orders"
          value={totalOrders}
          icon={<ShoppingCart size={13} />}
        />
        <StatTile
          label="Awaiting review"
          value={countOf("pending")}
          tone={countOf("pending") > 0 ? "warning" : "neutral"}
          icon={<Clock size={13} />}
        />
        <StatTile
          label="Delivered"
          value={countOf("delivered")}
          tone="info"
          icon={<Truck size={13} />}
        />
        <StatTile
          label="Settled revenue"
          value={`PKR ${revenue.toFixed(2)}`}
          tone="success"
          icon={<DollarSign size={13} />}
        />
      </div>

      <FilterBar
        searchKey="query"
        searchPlaceholder="Search order number or customer email…"
        selects={[
          {
            key: "status",
            label: "Status",
            options: STATUSES.map((s) => ({
              value: s,
              label: s.charAt(0) + s.slice(1).toLowerCase(),
            })),
          },
        ]}
      />

      <div className="mt-5">
        {orders.length === 0 ? (
          <div className="mat-2 rounded-[16px]">
            <EmptyState
              icon={Package}
              title={isFiltered ? "No orders match this view" : "No orders yet"}
              description={
                isFiltered
                  ? "Try a different status or clear the search. Existing orders were not modified."
                  : "Orders submitted through checkout will appear here for review."
              }
            />
          </div>
        ) : (
          <DataTableShell>
            <DataTableScroll>
              <DataTableHead>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Product</Th>
                <Th align="right">Amount</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
                <Th align="right">Action</Th>
              </DataTableHead>
              <DataTableBody>
                {orders.map((order) => (
                  <Tr key={order.id}>
                    <Td>
                      <span className="font-mono text-[12.5px] font-semibold text-foreground">
                        {order.orderNumber}
                      </span>
                    </Td>

                    <Td>
                      <p className="max-w-[220px] truncate text-[13px] text-foreground">
                        {order.customerEmail}
                      </p>
                      {order.customerDiscord && (
                        <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-brand-ink-3">
                          {order.customerDiscord}
                        </p>
                      )}
                    </Td>

                    <Td>
                      <div className="flex items-center gap-2.5">
                        {order.product.coverImageUrl && (
                          <span className="h-8 w-8 shrink-0 overflow-hidden rounded-[7px] border border-border-subtle bg-surface">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={order.product.coverImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </span>
                        )}
                        <span className="max-w-[180px] truncate text-[13px] font-medium text-brand-ink-2">
                          {order.product.name}
                        </span>
                      </div>
                    </Td>

                    <Td align="right">
                      <span className="tabular text-[13.5px] font-bold text-foreground">
                        PKR {order.priceSnapshot.toFixed(2)}
                      </span>
                    </Td>

                    <Td>
                      <StatusBadge tone={toneFromStatus(order.status)}>{order.status}</StatusBadge>
                    </Td>

                    <Td>
                      <span className="whitespace-nowrap text-[13px] text-brand-ink-2">
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </Td>

                    <Td align="right">
                      <RowActionLink href={`/mkpanelzoneadmin/orders/${order.id}`}>
                        Review
                        <ArrowUpRight size={12} aria-hidden />
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
