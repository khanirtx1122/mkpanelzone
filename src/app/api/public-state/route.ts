import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

/**
 * Lightweight public state probe used by middleware.
 *
 * Middleware runs on the Edge runtime and cannot use Prisma, so it asks this
 * route for the small set of flags it needs. Kept intentionally tiny and
 * cacheable so it never becomes a meaningful cost.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = await getSettings(["maintenance_mode"]);
    const maintenance = (s.maintenance_mode || "").toLowerCase() === "true";

    return NextResponse.json(
      { maintenance },
      {
        headers: {
          // Short cache: the owner expects a toggle to take effect quickly,
          // but middleware must not hit the database on every page view.
          "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=20",
        },
      },
    );
  } catch {
    // Never let a settings failure put the site into maintenance.
    return NextResponse.json({ maintenance: false });
  }
}
