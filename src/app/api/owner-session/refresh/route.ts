import { NextResponse } from "next/server";
import { isHttpsRequest, writeOwnerSessionCookie } from "@/lib/owner-session";
import { getOwnerSession } from "@/lib/owner";

export const dynamic = "force-dynamic";

/**
 * Sliding session refresh for the owner panel. Called from the admin layout
 * on every page load: a valid session gets a fresh 30-day cookie so an
 * actively used panel never expires and cloaks itself with 404.
 */
export async function GET(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) {
    // 204, not 404 — this endpoint's existence isn't a secret once the
    // admin bundle is loaded anyway; it just has nothing to hand out.
    return new NextResponse(null, { status: 204 });
  }

  await writeOwnerSessionCookie(owner, isHttpsRequest(request));
  return new NextResponse(null, { status: 204 });
}
