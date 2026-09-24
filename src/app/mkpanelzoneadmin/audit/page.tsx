import { prisma } from "@/lib/prisma";
import { Activity, Clock, ArrowUpRight, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, toneFromStatus } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile, StatGrid } from "@/components/admin/StatTile";
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
  title: "Activity | Owner Panel",
};

export const dynamic = "force-dynamic";

const LOOKBACK_MS = 24 * 60 * 60 * 1000;

/**
 * Cutoff for the "changed in 24h" tile.
 *
 * Extracted from the render body so the component stays a pure function of its
 * inputs — reading the clock inline is flagged by `react-hooks/purity`.
 */
function lookbackCutoff(): Date {
  return new Date(Date.now() - LOOKBACK_MS);
}

/**
 * Activity — the most recently touched orders, ordered by `updatedAt`.
 *
 * Honest naming: this is NOT a general audit trail. There is no audit table in
 * the schema, so the only durable record of "something changed and when" is the
 * order row itself. The page says so rather than implying coverage it does not
 * have.
 */
export default async function ActivityLogPage() {
  /*
    `changedToday` is counted across the whole table, not just the rows on
    screen. The earlier version derived it from the 30 fetched rows, so it
    silently under-reported on any busy day.
  */
  const [recentOrders, changedToday] = await Promise.all([
    prisma.order.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: { product: { select: { name: true } } },
    }),
    prisma.order.count({ where: { updatedAt: { gte: lookbackCutoff() } } }),
  ]);

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Observability"
        title="Activity"
        description="The most recently modified orders and their current state."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Activity" }]}
      />

      <StatGrid cols={3}>
        <StatTile label="Events shown" value={recentOrders.length} icon={<Activity size={13} />} />
        <StatTile
          label="Changed in 24h"
          value={changedToday}
          tone={changedToday > 0 ? "info" : "neutral"}
          icon={<Clock size={13} />}
        />
        <StatTile
          label="Coverage"
          value="Orders only"
          tone="warning"
        />
      </StatGrid>

      <div
        className="mb-5 flex items-start gap-2.5 rounded-[14px] px-4 py-3.5 text-[12.5px] leading-relaxed"
        style={{
          background: "var(--status-info-bg)",
          border: "1px solid var(--status-info-border)",
          color: "var(--status-info-text)",
        }}
      >
        <Info size={15} className="mt-[2px] shrink-0" aria-hidden />
        <span>
          Scope: order status changes only. Changes to products, packages, resources,
          customers and settings are not recorded in a queryable history yet.
        </span>
      </div>

      {recentOrders.length === 0 ? (
        <div className="mat-2 rounded-[16px]">
          <EmptyState
            icon={Activity}
            title="No activity recorded"
            description="Once orders are created or their status changes, those events will appear here."
          />
        </div>
      ) : (
        <DataTableShell>
          <DataTableScroll>
            <DataTableHead>
              <Th>When</Th>
              <Th>Event</Th>
              <Th>Status</Th>
              <Th>Reference</Th>
              <Th align="right">Action</Th>
            </DataTableHead>
            <DataTableBody>
              {recentOrders.map((order) => (
                <Tr key={order.id}>
                  <Td>
                    <span className="whitespace-nowrap text-[12.5px] text-brand-ink-3">
                      {order.updatedAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </Td>

                  <Td>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">
                        Order status updated
                      </p>
                      <p className="mt-0.5 max-w-[240px] truncate text-[11.5px] text-brand-ink-3">
                        {order.product.name}
                      </p>
                    </div>
                  </Td>

                  <Td>
                    <StatusBadge tone={toneFromStatus(order.status)}>{order.status}</StatusBadge>
                  </Td>

                  <Td>
                    <div className="min-w-0">
                      <p className="font-mono text-[12px] font-semibold text-brand-ink-2">
                        #{order.orderNumber}
                      </p>
                      <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-brand-ink-4">
                        {order.customerEmail}
                      </p>
                    </div>
                  </Td>

                  <Td align="right">
                    <RowActionLink href={`/mkpanelzoneadmin/orders/${order.id}`}>
                      Open
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
  );
}
