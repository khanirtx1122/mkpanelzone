import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ANALYTICS_EVENT_TYPES,
  MAX_BATCH_EVENTS,
  SESSION_TIMEOUT_MS,
  isTrackablePath,
  normalizePath,
  normalizeReferrer,
  parseUserAgent,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/collect
 *
 * Narrow first-party ingestion endpoint. Accepts only the three controlled
 * event types, validates every field, drops admin/agent routes, drops obvious
 * bots, and never stores IP, form contents, or any personal data.
 *
 * Body: { vid, sid, sessionStart?, referrer?, heartbeat?, events?: [{t,p?,s?,k?}] }
 * Reply: { ok: true, sid }  — `sid` is the authoritative session key to keep
 *        using (the server rotates it after 30 minutes of inactivity).
 */

const bodySchema = z.object({
  vid: z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/),
  sid: z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
  sessionStart: z.number().int().positive().optional(),
  referrer: z.string().max(400).optional().nullable(),
  heartbeat: z.boolean().optional(),
  events: z
    .array(
      z.object({
        t: z.enum(ANALYTICS_EVENT_TYPES),
        p: z.string().max(200).optional(),
        s: z.string().max(64).optional().nullable(),
        k: z.string().max(120).optional().nullable(),
      })
    )
    .max(MAX_BATCH_EVENTS)
    .optional(),
});

/** Tiny in-memory rate guard — protects the DB from a runaway client. */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 90;
const RATE_WINDOW_MS = 60 * 1000;

function allow(vid: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(vid);
  if (!bucket || bucket.resetAt < now) {
    if (rateBuckets.size > 5000) rateBuckets.clear();
    rateBuckets.set(vid, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 8000) return NextResponse.json({ ok: false }, { status: 413 });

    const parsed = bodySchema.safeParse(JSON.parse(raw || "{}"));
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

    // `heartbeat` needs no special handling: a ping with no events simply
    // refreshes presence below (last_seen_at) and writes nothing else.
    const { vid, sid, sessionStart: sessionStartHint, referrer, events } = parsed.data;
    if (!allow(vid)) return NextResponse.json({ ok: false, rateLimited: true }, { status: 429 });

    const ua = parseUserAgent(req.headers.get("user-agent"));
    // Bot traffic is excluded from human visitor statistics entirely.
    if (ua.isBot) return NextResponse.json({ ok: true, ignored: true });

    // Server-side path filtering (defense in depth — the client also filters).
    const cleanEvents = (events ?? [])
      .map((e) => ({
        eventType: e.t,
        pagePath: normalizePath(e.p || "/"),
        sectionKey: e.s ? e.s.slice(0, 64) : null,
        targetKey: e.k ? e.k.slice(0, 120) : null,
      }))
      .filter((e) => isTrackablePath(e.pagePath));

    const now = new Date();
    const host = req.headers.get("host")?.split(":")[0];
    const cleanReferrer = normalizeReferrer(referrer, host);
    // Never trust a client-claimed start older than the inactivity timeout.
    const sessionStart = (() => {
      if (!sessionStartHint) return now;
      const candidate = new Date(sessionStartHint);
      const oldest = new Date(now.getTime() - SESSION_TIMEOUT_MS);
      if (candidate.getTime() > now.getTime() || candidate.getTime() < oldest.getTime()) return now;
      return candidate;
    })();

    // ── Visitor (anonymous token only) ──
    const visitor = await prisma.analyticsVisitor.upsert({
      where: { anonymousId: vid },
      create: {
        anonymousId: vid,
        lastSeenAt: now,
        firstReferrer: cleanReferrer,
        lastReferrer: cleanReferrer,
        deviceCategory: ua.deviceCategory,
        deviceName: ua.deviceName,
        osName: ua.osName,
        browserName: ua.browserName,
        isBot: false,
      },
      update: {
        lastSeenAt: now,
        ...(cleanReferrer ? { lastReferrer: cleanReferrer } : {}),
        deviceCategory: ua.deviceCategory,
        deviceName: ua.deviceName,
        osName: ua.osName,
        browserName: ua.browserName,
      },
      select: { id: true },
    });

    // ── Session (resolved server-side; rotated after 30 min of silence) ──
    const firstPage = cleanEvents.find((e) => e.eventType === "page_view")?.pagePath ?? "/";
    let session = sid ? await prisma.analyticsSession.findUnique({ where: { sessionKey: sid } }) : null;

    if (session && now.getTime() - session.lastSeenAt.getTime() > SESSION_TIMEOUT_MS) {
      await prisma.analyticsSession.update({
        where: { id: session.id },
        data: { endedAt: session.lastSeenAt },
      });
      session = null;
    }

    if (!session) {
      session = await prisma.analyticsSession.create({
        data: {
          sessionKey: sid ?? crypto.randomUUID(),
          visitorId: visitor.id,
          startedAt: sessionStart,
          lastSeenAt: now,
          entryPath: firstPage,
          lastPath: firstPage,
          pageViewCount: 0,
          deviceCategory: ua.deviceCategory,
          deviceName: ua.deviceName,
          osName: ua.osName,
          browserName: ua.browserName,
          referrer: cleanReferrer,
        },
      });
    }

    // ── Events ──
    const pageViews = cleanEvents.filter((e) => e.eventType === "page_view");
    const lastSection = [...cleanEvents].reverse().find((e) => e.eventType === "section_view" && e.sectionKey);

    if (cleanEvents.length > 0) {
      await prisma.analyticsEvent.createMany({
        data: cleanEvents.map((e) => ({
          visitorId: visitor.id,
          sessionId: session!.id,
          eventType: e.eventType,
          pagePath: e.pagePath,
          sectionKey: e.sectionKey,
          targetKey: e.targetKey,
        })),
      });
    }

    await prisma.analyticsSession.update({
      where: { id: session.id },
      data: {
        lastSeenAt: now,
        lastPath: pageViews.length ? pageViews[pageViews.length - 1].pagePath : session.lastPath,
        ...(lastSection?.sectionKey ? { currentSection: lastSection.sectionKey } : {}),
        ...(pageViews.length ? { pageViewCount: { increment: pageViews.length } } : {}),
      },
    });

    return NextResponse.json({ ok: true, sid: session.sessionKey });
  } catch (error) {
    console.error("[analytics] collect failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
