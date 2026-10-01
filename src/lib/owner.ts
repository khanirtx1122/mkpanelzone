/**
 * OWNER SESSION — protection removed by owner request.
 *
 * The admin panel is now publicly accessible: anyone who opens
 * /mkpanelzoneadmin gets the OWNER experience. There is no cookie check,
 * no bootstrap token and no login screen. A single OWNER agent row is
 * auto-provisioned so audit logs and "created by" fields keep working.
 */

export type OwnerSession = {
  userId: string;
  username: string;
  role: string;
};

/** Resolves the implicit OWNER identity, creating it on first use. */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const owner = await prisma.agent.upsert({
      where: { username: "owner" },
      update: { status: "ACTIVE", role: "OWNER" },
      create: {
        username: "owner",
        // No login flow exists anymore; the hash is an unusable placeholder.
        passwordHash: "!",
        role: "OWNER",
        status: "ACTIVE",
      },
      select: { id: true, username: true, role: true },
    });
    return { userId: owner.id, username: owner.username, role: owner.role };
  } catch (error) {
    console.error("[getOwnerSession] failed:", error);
    return null;
  }
}

/** Convenience boolean form for pages that only need to gate rendering. */
export async function isOwner(): Promise<boolean> {
  return (await getOwnerSession()) !== null;
}

/** Guard for server actions. Always resolves now — kept for call-site stability. */
export async function requireOwner(): Promise<OwnerSession | null> {
  return getOwnerSession();
}
