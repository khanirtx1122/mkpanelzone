import { cookies } from "next/headers";
import type { OwnerSession } from "@/lib/owner";

/**
 * Owner session cookie lifecycle — shared by the bootstrap route and the
 * sliding refresh endpoint.
 *
 * Two past failure modes made the admin panel 404 even for the owner:
 *  1. `secure` was tied to NODE_ENV, so the cookie was silently dropped by
 *     browsers on any plain-HTTP origin (LAN IP, non-TLS deploy, preview
 *     tunnels) and every admin page cloaked with 404. We now derive `secure`
 *     from the actual request protocol instead.
 *  2. The cookie was a fixed 7-day window with no refresh, so an actively
 *     used panel still expired and 404'd. Sessions are now 30 days and
 *     re-issued on every admin page load (see /api/owner-session/refresh).
 */

export const OWNER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** True when the request arrived over HTTPS (directly or via a proxy). */
export function isHttpsRequest(request: Request): boolean {
  if (new URL(request.url).protocol === "https:") return true;
  const forwarded = request.headers.get("x-forwarded-proto");
  return forwarded?.split(",")[0]?.trim() === "https";
}

/** (Re)issues the HttpOnly owner_session cookie with a fresh 30-day window. */
export async function writeOwnerSessionCookie(
  session: OwnerSession,
  https: boolean,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("owner_session", JSON.stringify(session), {
    httpOnly: true,
    secure: https,
    sameSite: "strict",
    path: "/",
    maxAge: OWNER_SESSION_MAX_AGE,
  });
}
