import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * OWNER IDENTITY — implicit by design.
 *
 * The Official Admin Panel opens DIRECTLY at /mkpanelzoneadmin: no login
 * page, no bootstrap token, no session cookie, no auth challenge. A single
 * OWNER agent row is auto-provisioned so audit logs and "created by" fields
 * keep working. This is an explicit project requirement.
 *
 * PERFORMANCE: this runs in the admin layout, i.e. on EVERY admin navigation.
 * Profiling against the live database showed each query costs ~356ms purely in
 * network round-trip (the DB is in a different region), so this lookup alone
 * added ~356ms to every single admin click. The owner row is effectively
 * static, so it is now cached across requests with a long window — see below.
 */
export type OwnerSession = {
  userId: string;
  username: string;
  role: string;
};

const OWNER_USERNAME = "owner";

/** Cache tag so an owner change can invalidate the identity immediately. */
export const OWNER_CACHE_TAG = "owner-identity";

/**
 * The actual lookup. Cached across requests for 5 minutes: the owner row is
 * created once and its id never changes, so re-reading it on every navigation
 * bought nothing but latency. Mutations that touch the owner row call
 * revalidateTag(OWNER_CACHE_TAG).
 */
const readOwner = unstable_cache(
  async (): Promise<OwnerSession | null> => {
    const { prisma } = await import("@/lib/prisma");

    const existing = await prisma.agent.findUnique({
      where: { username: OWNER_USERNAME },
      select: { id: true, username: true, role: true, status: true },
    });

    if (existing) {
      // Repair a disabled/demoted owner row lazily, but never on every render.
      if (existing.status !== "ACTIVE" || existing.role !== "OWNER") {
        await prisma.agent.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", role: "OWNER" },
        });
        return { userId: existing.id, username: existing.username, role: "OWNER" };
      }
      return { userId: existing.id, username: existing.username, role: existing.role };
    }

    const created = await prisma.agent.create({
      data: {
        username: OWNER_USERNAME,
        // No login flow exists for this row; the hash is an unusable placeholder.
        passwordHash: "!",
        role: "OWNER",
        status: "ACTIVE",
      },
      select: { id: true, username: true, role: true },
    });
    return { userId: created.id, username: created.username, role: created.role };
  },
  ["owner-identity"],
  { revalidate: 300, tags: [OWNER_CACHE_TAG] },
);

/** Per-request dedup on top of the cross-request cache. */
export const getOwnerSession = cache(async (): Promise<OwnerSession | null> => {
  try {
    return await readOwner();
  } catch (error) {
    // A cache failure must never take the admin panel down — fall back to a
    // direct read so the owner can still get in.
    try {
      const { prisma } = await import("@/lib/prisma");
      const row = await prisma.agent.findUnique({
        where: { username: OWNER_USERNAME },
        select: { id: true, username: true, role: true },
      });
      if (row) return { userId: row.id, username: row.username, role: row.role };
    } catch {
      /* fall through */
    }
    console.error("[getOwnerSession] failed:", error);
    return null;
  }
});

/** Convenience boolean form for pages that only need to gate rendering. */
export async function isOwner(): Promise<boolean> {
  return (await getOwnerSession()) !== null;
}

/** Guard for server actions. Always resolves now — kept for call-site stability. */
export async function requireOwner(): Promise<OwnerSession | null> {
  return getOwnerSession();
}
