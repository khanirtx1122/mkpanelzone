import { createHmac } from "crypto";
import { cookies } from "next/headers";
import type { OwnerSession } from "@/lib/owner";

export const OWNER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function sessionSecret(): string {
  const secret = process.env.OWNER_BOOTSTRAP_TOKEN;
  if (!secret || secret.length < 32) {
    throw new Error("OWNER_BOOTSTRAP_TOKEN must be configured with a high-entropy value.");
  }
  return secret;
}

/** Produces a tamper-evident session signature without exposing the secret. */
export function signOwnerSession(userId: string): string {
  return createHmac("sha256", sessionSecret()).update(`owner-session:${userId}`).digest("hex");
}

export function serializeOwnerSession(userId: string): string {
  return `${userId}.${signOwnerSession(userId)}`;
}

/** True when the request arrived over HTTPS directly or through a proxy. */
export function isHttpsRequest(request: Request): boolean {
  if (new URL(request.url).protocol === "https:") return true;
  return request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

/** Issues the HttpOnly, signed, sliding owner session cookie. */
export async function writeOwnerSessionCookie(session: OwnerSession, https: boolean): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("owner_session", serializeOwnerSession(session.userId), {
    httpOnly: true,
    secure: https,
    sameSite: "strict",
    path: "/",
    maxAge: OWNER_SESSION_MAX_AGE,
  });
}
