import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isHttpsRequest, writeOwnerSessionCookie } from "@/lib/owner-session";

function hasValidBootstrapToken(token: string | null): boolean {
  const expected = process.env.OWNER_BOOTSTRAP_TOKEN;
  if (!token || !expected || expected.length < 32) return false;
  const supplied = Buffer.from(token);
  const trusted = Buffer.from(expected);
  return supplied.length === trusted.length && timingSafeEqual(supplied, trusted);
}

/**
 * Private owner entry point. A valid high-entropy token establishes an
 * HttpOnly session then redirects to the existing admin route. Invalid access
 * is intentionally indistinguishable from a missing route.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!hasValidBootstrapToken(token)) return new NextResponse(null, { status: 404 });

  try {
    const owner = await prisma.agent.findFirst({
      where: { role: "OWNER", status: "ACTIVE" },
      select: { id: true, username: true, role: true },
    });
    if (!owner) return new NextResponse(null, { status: 404 });

    await writeOwnerSessionCookie(
      { userId: owner.id, username: owner.username, role: owner.role },
      isHttpsRequest(request),
    );
    return NextResponse.redirect(new URL("/mkpanelzoneadmin", request.url));
  } catch (error) {
    console.error("[owner-bootstrap] failed:", error);
    return new NextResponse(null, { status: 404 });
  }
}
