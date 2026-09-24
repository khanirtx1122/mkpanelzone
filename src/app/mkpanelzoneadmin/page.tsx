import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Smartphone,
  Monitor,
  Package,
  ShoppingCart,
  FileImage,
  ArrowRight,
  Activity,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, toneFromStatus } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { DataTableShell, DataTableScroll, DataTableHead, DataTableBody, Th, Td, Tr, RowActionLink } from "@/components/ui/DataTable";

export const metadata = {
  title: "Overview | Control Room",
};

export const dynamic = "force-dynamic";

const PLATFORMS = ["ANDROID", "IOS", "PC"] as const;

const PLATFORM_LABEL: Record<string, string> = {
  ANDROID: "Android",
  IOS: "iPhone",
  PC: "PC",
};

const PLATFORM_COLOR: Record<string, string> = {
  ANDROID: "#4DA3FF",
  IOS: "#9AA6B8",
  PC: "#E4536F",
};

export default async function AdminDashboardPage() {
  let data: {
    totalAgents: number;
    activeAgents: number;
    totalCustomers: number;
    byPlatform: { platformType: string; count: number }[];
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    proofsAttached: number;
    recentOrders: {
      id: string;
      orderNumber: string;
      customerEmail: string;
      status: string;
      priceSnapshot: number;
      createdAt: Date;
      product: { name: string };
    }[];
    recentCustomers: {
      id: string;
      identifier: string;
      platformType: string;
      status: string;
      createdAt: Date;
    }[];
    growth: { label: string; count: number }[];
  } | null = null;

  try {
    const [
      totalAgents,
      activeAgents,
      totalCustomers,
      byPlatformRaw,
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      proofsAttached,
      recentOrders,
      recentCustomers,
    ] = await Promise.all([
      prisma.agent.count({ where: { role: "AGENT" } }),
      prisma.agent.count({ where: { role: "AGENT", status: "ACTIVE" } }),
      prisma.customer.count(),
      prisma.customer.groupBy({ by: ["platformType"], _count: { platformType: true } }),
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { NOT: { paymentProofPath: null } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          orderNumber: true,
          customerEmail: true,
          status: true,
          priceSnapshot: true,
          createdAt: true,
          product: { select: { name: true } },
        },
      }),
      prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          identifier: true,
          platformType: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Customer growth — real registrations, bucketed into the last 8 weeks.
    const now = new Date();
    const growth: { label: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i + 1) * 7);
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      const count = await prisma.customer.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      growth.push({ label: i === 0 ? "This wk" : `-${i}w`, count });
    }

    data = {
      totalAgents,
      activeAgents,
      totalCustomers,
      byPlatform: byPlatformRaw.map((r) => ({
        platformType: r.platformType,
        count: r._count.platformType,
      })),
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      proofsAttached,
      recentOrders,
      recentCustomers,
      growth,
    };
  } catch (error) {
    console.error("[admin] overview failed:", error);
  }

  if (!data) {
    return (
      <>
        <PageHeader
          eyebrow="Control room"
          title="Overview"
          description="Platform metrics and system status."
        />
        <ErrorState
          title="Metrics unavailable"
          description="The database could not be reached, so the overview cannot be computed right now. The rest of the control room may still be usable."
        />
      </>
    );
  }

  const platformTotal =
    data.byPlatform.reduce((sum, p) => sum + p.count, 0) || 1;
  const maxGrowth = Math.max(...data.growth.map((g) => g.count), 1);

  const stats = [
    { label: "Total customers", value: data.totalCustomers, Icon: UserPlus, href: "/mkpanelzoneadmin/customers" },
    { label: "Active agents", value: `${data.activeAgents}/${data.totalAgents}`, Icon: Users, href: "/mkpanelzoneadmin/agents" },
    { label: "Products live", value: `${data.activeProducts}/${data.totalProducts}`, Icon: Package, href: "/mkpanelzoneadmin/products" },
    { label: "Orders", value: data.totalOrders, Icon: ShoppingCart, href: "/mkpanelzoneadmin/orders" },
  ] as const;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Control room"
        title="Overview"
        description="Live platform metrics pulled directly from the database — no estimates, no placeholder analytics."
        breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}
      />

      {/* ── ATTENTION STRIP ── */}
      {(data.pendingOrders > 0 || data.proofsAttached > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/mkpanelzoneadmin/orders?status=PENDING"
            className="group flex items-center gap-4 rounded-[14px] border border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] px-4 py-3.5 transition-colors hover:brightness-110"
          >
            <Activity size={17} className="shrink-0 text-[color:var(--status-warning-text)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-foreground">
                {data.pendingOrders} order{data.pendingOrders === 1 ? "" : "s"} awaiting review
              </p>
              <p className="mt-0.5 text-[11.5px] text-brand-ink-3">
                Manual verification queue
              </p>
            </div>
            <ArrowRight
              size={15}
              className="shrink-0 text-brand-ink-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>

          <Link
            href="/mkpanelzoneadmin/orders"
            className="group flex items-center gap-4 rounded-[14px] border border-border-subtle bg-surface-raised px-4 py-3.5 transition-colors hover:border-border-strong"
          >
            <FileImage size={17} className="shrink-0 text-brand-ink-2" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-foreground">
                {data.proofsAttached} payment proof{data.proofsAttached === 1 ? "" : "s"} on file
              </p>
              <p className="mt-0.5 text-[11.5px] text-brand-ink-3">
                Stored privately, never public
              </p>
            </div>
            <ArrowRight
              size={15}
              className="shrink-0 text-brand-ink-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      )}

      {/* ── METRIC CARDS ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group relative overflow-hidden rounded-[16px] mat-4 p-5"
          >
            <span
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-[38px] transition-opacity duration-500"
              style={{
                background: "var(--ambient-strong)",
                opacity: 0.7,
              }}
              aria-hidden
            />
            <div className="relative flex items-start justify-between">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[12px] border"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--ambient-strong)",
                }}
                aria-hidden
              >
                <Icon
                  size={17}
                  style={{
                    color: "var(--text-2)",
                  }}
                />
              </span>
              <ArrowRight
                size={14}
                className="text-brand-ink-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>

            <p className="relative mt-5 tabular text-[28px] font-extrabold leading-none tracking-[-0.03em] text-foreground">
              {value}
            </p>
            <p className="relative mt-2 text-[10.5px] font-bold uppercase tracking-[0.13em] text-brand-ink-3">
              {label}
            </p>
          </Link>
        ))}
      </div>

      {/* ── CHARTS ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Platform distribution — horizontal bars, real counts */}
        <section className="rounded-[16px] mat-2 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[14.5px] font-bold tracking-[-0.012em] text-foreground">
              Platform distribution
            </h2>
            <span className="tabular text-[11px] font-bold uppercase tracking-[0.11em] text-brand-ink-4">
              {data.totalCustomers} total
            </span>
          </div>

          <ul className="space-y-4">
            {PLATFORMS.map((platform) => {
              const count =
                data.byPlatform.find((p) => p.platformType === platform)?.count ?? 0;
              const pct = Math.round((count / platformTotal) * 100);
              return (
                <li key={platform}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-brand-ink-2">
                      {platform === "PC" ? (
                        <Monitor size={13} className="text-brand-ink-4" aria-hidden />
                      ) : (
                        <Smartphone size={13} className="text-brand-ink-4" aria-hidden />
                      )}
                      {PLATFORM_LABEL[platform]}
                    </span>
                    <span className="tabular text-[12px] font-bold text-foreground">
                      {count}
                      <span className="ml-1.5 text-brand-ink-4">{pct}%</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.05]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${Math.max(pct, count > 0 ? 3 : 0)}%`,
                        background: PLATFORM_COLOR[platform],
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Customer growth — 8 real weekly buckets */}
        <section className="rounded-[16px] mat-2 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-[14.5px] font-bold tracking-[-0.012em] text-foreground">
              <TrendingUp size={14} className="text-brand-ink-2" aria-hidden />
              New customers
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.11em] text-brand-ink-4">
              Last 8 weeks
            </span>
          </div>

          <div className="flex h-[132px] items-end gap-2">
            {data.growth.map((bucket) => (
              <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="tabular text-[10px] font-bold text-brand-ink-4">
                  {bucket.count > 0 ? bucket.count : ""}
                </span>
                <div
                  className="w-full rounded-t-[4px] transition-[height] duration-700"
                  style={{
                    height: `${Math.max((bucket.count / maxGrowth) * 88, bucket.count > 0 ? 6 : 2)}px`,
                    background:
                      bucket.count > 0
                        ? "linear-gradient(180deg, #4DA3FF 0%, var(--ambient-strong) 100%)"
                        : "var(--border-subtle)",
                  }}
                  title={`${bucket.label}: ${bucket.count}`}
                />
                <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-brand-ink-4">
                  {bucket.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── RECENT ORDERS ── */}
      <section>
        <div className="mb-3.5 flex items-end justify-between gap-4">
          <h2 className="text-[14.5px] font-bold tracking-[-0.012em] text-foreground">
            Recent orders
          </h2>
          <Link
            href="/mkpanelzoneadmin/orders"
            className="group inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-brand-ink-3 transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            compact
            title="No orders yet"
            description="Orders placed through checkout will appear here for verification."
          />
        ) : (
          <DataTableShell>
            <DataTableScroll>
              <DataTableHead>
                <Th width="140px">Order</Th>
                <Th>Customer</Th>
                <Th>Product</Th>
                <Th align="right">Amount</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </DataTableHead>
              <DataTableBody>
                {data.recentOrders.map((order) => (
                  <Tr key={order.id}>
                    <Td>
                      <span className="font-mono text-[12px] font-semibold text-foreground">
                        {order.orderNumber}
                      </span>
                    </Td>
                    <Td>
                      <span className="block truncate text-[12.5px] text-brand-ink-2 max-w-[190px]">
                        {order.customerEmail}
                      </span>
                    </Td>
                    <Td>
                      <span className="block truncate text-[12.5px] font-medium text-foreground max-w-[190px]">
                        {order.product.name}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="tabular text-[12.5px] font-bold text-brand-ink-2">
                        PKR {order.priceSnapshot.toFixed(0)}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge tone={toneFromStatus(order.status)} size="xs">
                        {order.status}
                      </StatusBadge>
                    </Td>
                    <Td align="right">
                      <RowActionLink href={`/mkpanelzoneadmin/orders/${order.id}`}>
                        Review
                      </RowActionLink>
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableScroll>
          </DataTableShell>
        )}
      </section>

      {/* ── RECENT CUSTOMERS ── */}
      <section>
        <div className="mb-3.5 flex items-end justify-between gap-4">
          <h2 className="text-[14.5px] font-bold tracking-[-0.012em] text-foreground">
            Newest customers
          </h2>
          <Link
            href="/mkpanelzoneadmin/customers"
            className="group inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-brand-ink-3 transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        {data.recentCustomers.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            compact
            title="No customers yet"
            description="Customers created by you or by agents will appear here."
          />
        ) : (
          <DataTableShell>
            <DataTableScroll>
              <DataTableHead>
                <Th>Identifier</Th>
                <Th>Platform</Th>
                <Th>Status</Th>
                <Th align="right">Joined</Th>
                <Th align="right">Actions</Th>
              </DataTableHead>
              <DataTableBody>
                {data.recentCustomers.map((customer) => (
                  <Tr key={customer.id}>
                    <Td>
                      <span className="text-[13px] font-bold text-foreground">
                        {customer.identifier}
                      </span>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-brand-ink-2">
                        {customer.platformType === "PC" ? (
                          <Monitor size={12} className="text-brand-ink-4" aria-hidden />
                        ) : (
                          <Smartphone size={12} className="text-brand-ink-4" aria-hidden />
                        )}
                        {PLATFORM_LABEL[customer.platformType] ?? customer.platformType}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge tone={toneFromStatus(customer.status)} size="xs">
                        {customer.status}
                      </StatusBadge>
                    </Td>
                    <Td align="right">
                      <span className="tabular text-[12px] text-brand-ink-3">
                        {customer.createdAt.toLocaleDateString()}
                      </span>
                    </Td>
                    <Td align="right">
                      <RowActionLink
                        href={`/mkpanelzoneadmin/customers/${customer.id}`}
                      >
                        Open
                      </RowActionLink>
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableScroll>
          </DataTableShell>
        )}
      </section>
    </div>
  );
}
