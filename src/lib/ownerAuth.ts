import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * Owner authorization for the control room (spec §49, §64).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The audit found that `ensureOwner()` in `src/app/mkpanelzoneadmin/actions.ts`
 * had been reduced to a stub returning a fake owner:
 *
 *     async function ensureOwner() {
 *       // Bypass session check as requested by the user
 *       return { role: "OWNER", username: "Owner" };
 *     }
 *
 * …and that `mkpanelzoneadmin/layout.tsx` performed no session check at all.
 * The combined effect was that every page under /mkpanelzoneadmin was readable
 * by anyone, and all 14 privileged server actions (create/disable customers,
 * reset device bindings, overwrite passwords, create agents, delete products,
 * edit site settings) were invocable by an anonymous request.
 *
 * The intended mechanism already existed and was left intact elsewhere:
 *   - `/api/mk-bootstrap?token=OWNER_BOOTSTRAP_TOKEN` sets an httpOnly
 *     `owner_session` cookie containing { userId, username, role }
 *   - `ownerLogout()` deletes that cookie
 *   - `managementLogin()` deliberately refuses OWNER accounts, so owners are
 *     expected to arrive through the bootstrap route
 *
 * This module restores that mechanism in one place so the layout and every
 * action share the same rule instead of each re-implementing it.
 *
 * DEVELOPMENT BYPASS
 * ------------------
 * Enforcing the cookie in every environment would lock the owner out locally:
 * there is no `.env` file in this project, so `OWNER_BOOTSTRAP_TOKEN` is unset
 * and the bootstrap route correctly answers 404. The bypass below therefore
 * applies ONLY when NODE_ENV is not "production". In a production build the
 * check is always enforced.
 *
 * To test production behaviour locally, run the app with NODE_ENV=production
 * and set OWNER_BOOTSTRAP_TOKEN, then visit
 * /api/mk-bootstrap?token=<your token> to establish a real session.
 */

export interface OwnerPrincipal {
  id: string;
  username: string;
  role: string;
  /** true when this principal came from the development bypass */
  isDevBypass?: boolean;
}

/** The bypass is scoped to non-production builds only. */
export function isAdminAuthBypassed(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Resolve a real owner from the `owner_session` cookie.
 * Returns null for: missing cookie, malformed JSON, unknown agent, non-OWNER
 * role, or a disabled account.
 */
export async function getOwnerSession(): Promise<OwnerPrincipal | null> {
  let raw: string | undefined;
  try {
    const cookieStore = await cookies();
    raw = cookieStore.get("owner_session")?.value;
  } catch {
    return null;
  }

  if (!raw) return null;

  let parsed: { userId?: string; agentId?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const id = parsed?.userId || parsed?.agentId;
  if (!id) return null;

  try {
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) return null;
    /* Role and status are re-checked against the database rather than trusted
       from the cookie, so revoking an owner takes effect immediately instead of
       waiting for the cookie to expire. */
    if (agent.role !== "OWNER") return null;
    if (agent.status !== "ACTIVE") return null;

    return { id: agent.id, username: agent.username, role: agent.role };
  } catch {
    /* A database outage must not be mistaken for a valid session. */
    return null;
  }
}

/**
 * The single entry point used by the layout and by every privileged action.
 * Returns null when the caller is not an authorized owner.
 */
export async function requireOwner(): Promise<OwnerPrincipal | null> {
  const real = await getOwnerSession();

  if (isAdminAuthBypassed()) {
    if (real) return real;
    return { id: "dev-bypass", username: "Owner (dev bypass)", role: "OWNER", isDevBypass: true };
  }

  return real;
}

/** True when the caller may perform owner-level writes. */
export async function isAuthorizedOwner(): Promise<boolean> {
  return (await requireOwner()) !== null;
}
