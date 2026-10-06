import { unstable_cache } from "next/cache";

/**
 * ADMIN DATA CACHE TAGS.
 *
 * Profiling the live database showed the dominant cost is NOT query
 * complexity — it is round-trip latency. Every single query costs ~356ms
 * regardless of how many rows it returns (2 agents and 10 products both took
 * ~357ms), and a cold connection costs ~1.8s. An admin page that runs three
 * queries therefore costs ~1.1s of pure waiting.
 *
 * The fix is to stop repeating those round-trips: list data is cached across
 * requests with a short window and an explicit tag, and every mutation that
 * changes that data invalidates the tag. Repeat navigation inside the panel
 * then costs no database round-trip at all, while saved changes still appear
 * immediately.
 */
export const ADMIN_TAGS = {
  orders: "admin-orders",
  customers: "admin-customers",
  agents: "admin-agents",
  products: "admin-products",
  proofs: "admin-proofs",
  resources: "admin-resources",
} as const;

/** Short window: bounds staleness even if a tag invalidation is ever missed. */
export const ADMIN_LIST_TTL = 30;

/**
 * Serialized order row for list rendering.
 *
 * Dates are converted to ISO strings on purpose: the Next data cache
 * serializes entries, and returning raw Date objects across that boundary is
 * not guaranteed. The list components already parse with `new Date(...)`, so
 * strings are the safe, explicit contract.
 */
export type CachedOrderRow = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerDiscord: string | null;
  customerWhatsapp: string | null;
  customerId: string | null;
  priceSnapshot: number;
  amountReported: number | null;
  amountMatches: boolean | null;
  paymentProofPath: string | null;
  status: string;
  createdAt: string;
  product: { name: string; coverImageUrl: string | null };
};

/**
 * Cached orders page query (list + count in one entry).
 * Keyed on the filter arguments, so each filter/page combination is cached
 * independently and pagination stays correct.
 */
export const getOrdersPageCached = unstable_cache(
  async (
    statusFilter: string,
    query: string,
    page: number,
    pageSize: number,
  ): Promise<{ rows: CachedOrderRow[]; total: number }> => {
    const { prisma } = await import("@/lib/prisma");

    const where: Record<string, unknown> = {};
    if (statusFilter !== "ALL") where.status = statusFilter.toLowerCase();
    if (query) {
      where.OR = [
        { orderNumber: { contains: query, mode: "insensitive" } },
        { customerEmail: { contains: query, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          customerEmail: true,
          customerDiscord: true,
          customerWhatsapp: true,
          customerId: true,
          priceSnapshot: true,
          amountReported: true,
          amountMatches: true,
          paymentProofPath: true,
          status: true,
          createdAt: true,
          product: { select: { name: true, coverImageUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      rows: orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
      total,
    };
  },
  ["admin-orders-page"],
  { revalidate: ADMIN_LIST_TTL, tags: [ADMIN_TAGS.orders] },
);
