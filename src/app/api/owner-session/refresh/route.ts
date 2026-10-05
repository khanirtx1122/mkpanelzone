import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/owner";
import { isHttpsRequest, writeOwnerSessionCookie } from "@/lib/owner-session";

export const dynamic = "force-dynamic";

/** Refreshes a valid owner's sliding session without exposing session data. */
export async function GET(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) return new NextResponse(null, { status: 204 });

  await writeOwnerSessionCookie(owner, isHttpsRequest(request));
  return new NextResponse(null, { status: 204 });
}
