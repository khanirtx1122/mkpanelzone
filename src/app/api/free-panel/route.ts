import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getFreePanelConfig,
  isWithinSchedule,
  generateClaimToken,
} from "@/lib/freePanel";

export const dynamic = "force-dynamic";

/**
 * GET /api/free-panel — public config for the claim flow (URLs already sanitized).
 * Also returns the visitor's existing claim when a claimToken cookie is present,
 * plus live inventory availability so the UI can show the correct ended state.
 */
export async function GET(req: NextRequest) {
  try {
    const config = await getFreePanelConfig();
    const availableKeys = await prisma.freePanelKey.count({ where: { status: "AVAILABLE" } });
    const offerLive = config.enabled && isWithinSchedule(config) && availableKeys > 0;

    const publicConfig = {
      enabled: offerLive,
      // Distinct state: offer is on but inventory is empty → public "ended" view.
      inventoryEmpty: config.enabled && isWithinSchedule(config) && availableKeys === 0,
      title: config.title,
      subtitle: config.subtitle,
      durationLabel: config.durationLabel,
      ctaLabel: config.ctaLabel,
      whatsappUrl: config.whatsappUrl,
      youtubeUrl: config.youtubeUrl,
      discordUrl: config.discordUrl,
      downloadUrl: config.downloadUrl,
      downloadLabel: config.downloadLabel,
      setupInstructions: config.setupInstructions,
      popupDelaySeconds: config.popupDelaySeconds,
      popupFrequency: config.popupFrequency,
    };

    const token = req.cookies.get("mk_free_claim")?.value;
    let claim: { key: string; expiresAt: string; status: string } | null = null;
    if (token) {
      const existing = await prisma.freeClaim.findUnique({
        where: { claimToken: token },
        include: { panelKey: true },
      });
      if (existing && existing.status === "ACTIVE" && existing.expiresAt > new Date()) {
        claim = {
          key: existing.panelKey?.keyValue ?? existing.key,
          expiresAt: existing.expiresAt.toISOString(),
          status: existing.status,
        };
      }
    }

    return NextResponse.json({ config: publicConfig, claim });
  } catch (error) {
    console.error("[free-panel] GET failed:", error);
    return NextResponse.json({ error: "Failed to load offer" }, { status: 500 });
  }
}

/**
 * POST /api/free-panel — assign exactly ONE available inventory key to this claim.
 *
 * Concurrency safety: assignment is a transactional updateMany on a single
 * AVAILABLE row. Two customers clicking simultaneously can never receive the
 * same key — the database serializes the row claims. Idempotent: an existing
 * valid claim always returns its own key without consuming another.
 */
export async function POST(req: NextRequest) {
  try {
    const config = await getFreePanelConfig();
    if (!config.enabled || !isWithinSchedule(config)) {
      return NextResponse.json({ error: "This offer is not available." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const stepsDone = Array.isArray(body?.stepsDone)
      ? body.stepsDone.filter((s: unknown) => typeof s === "string" && ["whatsapp", "youtube", "discord"].includes(s)).join(",")
      : "";

    const existingToken = req.cookies.get("mk_free_claim")?.value;

    // ── Claim idempotency ──
    if (existingToken) {
      const existing = await prisma.freeClaim.findUnique({
        where: { claimToken: existingToken },
        include: { panelKey: true },
      });
      if (existing && existing.status === "ACTIVE" && existing.expiresAt > new Date()) {
        return NextResponse.json({
          ok: true,
          alreadyClaimed: true,
          key: existing.panelKey?.keyValue ?? existing.key,
          expiresAt: existing.expiresAt.toISOString(),
        });
      }
    }

    // ── Atomic key assignment ──
    // Transactionally claim one AVAILABLE inventory key. On a lost race
    // (another request claimed the same candidate first) we retry with the
    // next AVAILABLE key — retries are bounded, so this is cheap and safe.
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const claimToken = existingToken || generateClaimToken();

    let assignedKey: { id: string; keyValue: string } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await prisma.$transaction(async (tx) => {
        const candidate = await tx.freePanelKey.findFirst({
          where: { status: "AVAILABLE" },
          orderBy: { createdAt: "asc" },
          select: { id: true, keyValue: true },
        });
        if (!candidate) return null;

        const claimed = await tx.freePanelKey.updateMany({
          where: { id: candidate.id, status: "AVAILABLE" }, // guard: still AVAILABLE
          data: { status: "ASSIGNED", assignedAt: new Date() },
        });
        if (claimed.count === 0) return undefined; // lost race → retry

        const claim = await tx.freeClaim.create({
          data: { claimToken, key: candidate.id, platform: "PC", durationDays: 5, stepsDone, status: "ACTIVE", expiresAt },
        });
        await tx.freePanelKey.update({ where: { id: candidate.id }, data: { claimId: claim.id } });
        return candidate;
      });
      if (result === null) break; // inventory truly empty
      if (result) { assignedKey = result; break; }
      // undefined → lost race, retry
    }

    if (!assignedKey) {
      // Inventory exhausted between render and click — honest ended state.
      return NextResponse.json(
        { ok: false, ended: true, error: "All available Free Panel keys have been claimed. Please wait for the next release." },
        { status: 409 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      alreadyClaimed: false,
      key: assignedKey.keyValue,
      expiresAt: expiresAt.toISOString(),
    });
    res.cookies.set("mk_free_claim", claimToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (error) {
    console.error("[free-panel] POST failed:", error);
    return NextResponse.json({ error: "Failed to create access. Please try again." }, { status: 500 });
  }
}
