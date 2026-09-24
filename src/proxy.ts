import { NextResponse, type NextRequest } from "next/server";
import { getBooleanSetting } from "@/lib/settings";

/**
 * proxy.ts — Next.js 16 request boundary.
 *
 * IMPORTANT (Next.js 16): the `middleware` file convention was renamed to
 * `proxy` and the exported function is now `proxy` rather than `middleware`.
 * The `runtime` config option is not available here — Proxy already defaults to
 * the Node.js runtime, which is what lets this file talk to Prisma directly
 * instead of round-tripping through an internal API route.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The `maintenance_mode` setting was editable in Control Room → Settings but no
 * code read it, so switching it on did nothing at all. This enforces it.
 *
 * Scope: public storefront routes only. The control room, the agent
 * workstation, the management entry, the maintenance page itself and all static
 * assets are excluded by the matcher below, so staff are never locked out of the
 * tools they need to turn maintenance back off.
 */

export async function proxy(request: NextRequest) {
  /*
    `getBooleanSetting` memoises for 10s and fails to the fallback (false) if the
    database is unreachable — so a database problem can never take the storefront
    down, it just means maintenance mode is not applied.
  */
  if (!(await getBooleanSetting("maintenance_mode", false))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Run only for public page routes.
     * Excluded: API routes, Next internals, the maintenance page itself, the
     * private surfaces (control room / agent / management entry) and any static
     * asset with a file extension.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|maintenance|mkpanelzoneadmin|agent|mk-agents|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|json|webmanifest)$).*)",
  ],
};
