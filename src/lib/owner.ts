import { cache } from "react";
import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { signOwnerSession } from "@/lib/owner-session";

/**
 * OWNER SESSION — server-side authority for the official admin panel.
 *
 * The owner has no public login screen by design. A private high-entropy
 * bootstrap URL establishes an HttpOnly, signed `owner_session` cookie. Every
 * protected route, server action and admin API resolves the active OWNER row
 * from that cookie; a client cannot turn a known database id into a session.
 */
export type OwnerSession = {
  userId: string;
  username: string;
  role: string;
};

function validSignature(value: string, expected: string): boolean {
  const supplied = Buffer.from(value, "hex");
  const trusted = Buffer.from(expected, "hex");
  return supplied.length === trusted.length && timingSafeEqual(supplied, trusted);
}

function parseSession(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return null;

  const userId = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!/^[0-9a-f-]{20,}$/i.test(userId) || !/^[0-9a-f]{64}$/i.test(signature)) return null;

  try {
    return validSignature(signature, signOwnerSession(userId)) ? userId : null;
  } catch {
    // A missing bootstrap secret must never degrade into an implicit owner.
    return null;
  }
}

/**
 * Resolves the signed-in active OWNER. `cache` deduplicates the cookie and
 * database read across a single server render/action without leaking a session
 * across requests.
 */
export const getOwnerSession = cache(async (): Promise<OwnerSession | null> => {
  const cookieStore = await cookies();
  const userId = parseSession(cookieStore.get("owner_session")?.value);
  if (!userId) return null;

  try {
    const owner = await prisma.agent.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, status: true },
    });
    if (!owner || owner.role !== "OWNER" || owner.status !== "ACTIVE") return null;
    return { userId: owner.id, username: owner.username, role: owner.role };
  } catch (error) {
    console.error("[owner] session lookup failed:", error);
    return null;
  }
});

export async function isOwner(): Promise<boolean> {
  return (await getOwnerSession()) !== null;
}

/** Guard for server actions and route handlers. */
export async function requireOwner(): Promise<OwnerSession | null> {
  return getOwnerSession();
}
