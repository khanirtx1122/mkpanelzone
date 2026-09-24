import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Verify token
  if (!token || token !== process.env.OWNER_BOOTSTRAP_TOKEN) {
    // Return 404 instead of 401 to prevent discovering the route exists
    return new NextResponse(null, { status: 404 });
  }

  try {
    // Find owner
    const owner = await prisma.agent.findFirst({
      where: { role: "OWNER", status: "ACTIVE" }
    });

    if (!owner) {
      return new NextResponse(null, { status: 404 });
    }

    // Set secure cookie
    const sessionData = {
      userId: owner.id,
      username: owner.username,
      role: owner.role,
    };
    const sessionValue = JSON.stringify(sessionData);

    const cookieStore = await cookies();
    cookieStore.set("owner_session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.redirect(new URL("/mkpanelzoneadmin", request.url));
  } catch (error) {
    console.error("Bootstrap error:", error);
    return new NextResponse(null, { status: 404 });
  }
}
