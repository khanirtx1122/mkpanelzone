import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/owner";

const MEDIA_BUCKET = "media";
const ALLOWED_PREFIXES = ["payment-proofs/", "uploads/"];

function sourceUrl(path: string): string | null {
  const normalized = path.replace(/^\/+/, "");
  if (
    !ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix)) ||
    normalized.includes("..") ||
    normalized.includes("\\")
  ) {
    return null;
  }

  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uvqsbebblbgjpktdoplk.supabase.co").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${encodeURI(normalized)}`;
}

/** Streams a stored payment proof only after validating the owner session. */
export async function GET(request: NextRequest) {
  const owner = await requireOwner();
  if (!owner) return new NextResponse(null, { status: 404 });

  const source = sourceUrl(request.nextUrl.searchParams.get("path") || "");
  if (!source) return new NextResponse(null, { status: 404 });

  try {
    const upstream = await fetch(source, {
      headers: request.headers.get("range") ? { Range: request.headers.get("range")! } : undefined,
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    const acceptRanges = upstream.headers.get("accept-ranges");
    if (contentType) headers.set("Content-Type", contentType);
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);
    if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
