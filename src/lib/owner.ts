import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * OWNER AUTHORIZATION — single source of truth for the admin panel.
 *
 * The owner has no visible login page (by design). Access is established by
 * opening the private bootstrap URL with a high-entropy token, which sets an
 * HttpOnly `owner_session` cookie. Every admin page and every admin server
 * action must go through `requireOwner()`.
 *
 * Previously the admin layout and actions returned a hardcoded OWNER object,
 * which meant anyone who knew the URL had full control. This restores a real
 * server-side check without changing the "no login screen" UX.
 */

export type OwnerSession = {
  userId: string;
  username: string;
  role: string;
};

function parseSession(raw: string | undefined): { userId?: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* not JSON — legacy plain-id cookie */
  }
  return null;
}

/**
 * Resolves the signed-in OWNER from the session cookie, verifying against the
 * database so a disabled or deleted owner loses access immediately.
 * Returns null when the caller is not a valid, active owner.
 */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("owner_session")?.value;
  if (!raw) return null;

  const parsed = parseSession(raw);
  const id = parsed?.userId ?? raw;

  try {
    const owner = await prisma.agent.findUnique({
      where: { id },
      select: { id: true, username: true, role: true, status: true },
    });
    if (!owner || owner.role !== "OWNER" || owner.status !== "ACTIVE") return null;
    return { userId: owner.id, username: owner.username, role: owner.role };
  } catch (error) {
    console.error("[getOwnerSession] lookup failed:", error);
    return null;
  }
}

/** Convenience boolean form for pages that only need to gate rendering. */
export async function isOwner(): Promise<boolean> {
  return (await getOwnerSession()) !== null;
}

/**
 * Guard for server actions. Returns the session or null — callers return an
 * "Unauthorized" result when null instead of throwing, so a stale cookie
 * produces a clean error rather than a crash.
 */
export async function requireOwner(): Promise<OwnerSession | null> {
  return getOwnerSession();
}
