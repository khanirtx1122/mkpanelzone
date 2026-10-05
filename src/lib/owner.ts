import { cache } from "react";

/**
 * OWNER IDENTITY — implicit by design.
 *
 * The Official Admin Panel opens DIRECTLY at /mkpanelzoneadmin: no login
 * page, no bootstrap token, no session cookie, no auth challenge. A single
 * OWNER agent row is auto-provisioned so audit logs and "created by" fields
 * keep working. This is an explicit project requirement.
 *
 * PERFORMANCE: this is a cached READ that only writes when the row is
 * genuinely missing, and within a request every call site shares one lookup.
 */
export type OwnerSession = {
  userId: string;
  username: string;
  role: string;
};

const OWNER_USERNAME = "owner";

/** Resolves the implicit OWNER identity, creating it only if it is missing. */
export const getOwnerSession = cache(async (): Promise<OwnerSession | null> => {
  try {
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
  } catch (error) {
    // A race between two concurrent first-requests can violate the unique
    // username; retry the read once rather than failing the whole page.
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
