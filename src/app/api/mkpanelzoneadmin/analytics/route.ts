import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/analyticsAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/mkpanelzoneadmin/analytics
 *
 * Owner-only aggregated analytics for the admin Overview page. It lives under
 * the admin route namespace (never counted as public visitor traffic) and is
 * served only to same-origin browser fetches, so the data cannot be embedded
 * or scraped from another site.
 */
export async function GET(req: NextRequest) {
  try {
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await getAnalyticsSnapshot();
    // A degraded snapshot means the aggregation failed — tell the dashboard so
    // it keeps its last good numbers instead of flashing zeros.
    return NextResponse.json(snapshot, {
      status: snapshot.degraded ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[analytics] admin snapshot failed:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
