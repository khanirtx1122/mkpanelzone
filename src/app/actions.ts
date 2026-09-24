"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import { getBooleanSetting } from "@/lib/settings";
import type { ActionState } from "@/lib/actionResult";

import { headers } from "next/headers";

const rateLimits = new Map<string, { count: number; expiresAt: number }>();
/**
 * Result of a checkout submission.
 *
 * Discriminated on `success` with *literal* true/false. The previous shape
 * widened the discriminant to `boolean`, so `if (!res.success)` narrowed nothing
 * and every consumer had to reach for `any` to read `error` or `whatsappUrl`.
 */
export type SubmitOrderResult =
  | { success: true; orderRef: string; whatsappUrl: string | null; messageText: string }
  | { success: false; error: string };

/** Cached result of a successful `submitOrder`, keyed by the idempotency key. */
const idempotencyCache = new Map<string, SubmitOrderResult>();

const orderSchema = z.object({
  productId: z.string(),
  email: z.string().email(),
  discord: z.string().optional(),
  amountReported: z.string(),
  honeypot: z.string().optional(),
  idempotencyKey: z.string().uuid(),
});

function generateOrderRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "MK-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function submitOrder(formData: FormData): Promise<SubmitOrderResult> {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "127.0.0.1";
    
    const now = Date.now();
    const limit = rateLimits.get(ip);
    if (limit && limit.expiresAt > now) {
      if (limit.count >= 5) {
        return { success: false, error: "Too many orders. Please try again later." };
      }
      limit.count++;
    } else {
      rateLimits.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    }

    const data = Object.fromEntries(formData.entries());
    
    const parsed = orderSchema.safeParse({
      productId: data.productId,
      email: data.email,
      discord: data.discord,
      amountReported: data.amountReported,
      honeypot: data.honeypot,
      idempotencyKey: data.idempotencyKey,
    });

    if (!parsed.success) {
      return { success: false, error: "Invalid data submitted." };
    }

    if (parsed.data.honeypot) {
      return { success: false, error: "Invalid request." };
    }

    if (idempotencyCache.has(parsed.data.idempotencyKey)) {
      /* `has` guarantees presence, but `Map.get` still types as possibly
         undefined — narrow it rather than asserting. */
      const cached = idempotencyCache.get(parsed.data.idempotencyKey);
      if (cached) return cached;
    }

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId }
    });

    if (!product) {
      return { success: false, error: "Product not found." };
    }

    let parsedAmount = parseFloat(parsed.data.amountReported.replace(/,/g, ''));
    if (isNaN(parsedAmount)) parsedAmount = 0;

    const amountMatches = parsedAmount === product.price;

    const file = formData.get("paymentProof") as File;
    if (!file || file.size === 0) {
      return { success: false, error: "Payment proof is required." };
    }

    const mockPath = `/uploads/${randomBytes(16).toString("hex")}-${file.name}`;
    const orderNumber = generateOrderRef();

    await prisma.order.create({
      data: {
        orderNumber,
        productId: product.id,
        priceSnapshot: product.price,
        customerEmail: parsed.data.email,
        customerDiscord: parsed.data.discord || "",
        paymentProofPath: mockPath,
        amountReported: parsedAmount,
        amountMatches,
        status: "pending"
      }
    });

    const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER;
    const storeTimezone = "Asia/Karachi";
    const dateStr = new Date().toLocaleString("en-GB", {
      timeZone: storeTimezone,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(",", "");

    const truncate = (str: string, len: number) => {
      const s = (str || "").replace(/[\r\n]+/g, " ").trim();
      return s.length > len ? s.substring(0, len - 3) + "..." : s;
    };

    const messageText = `*NEW ORDER - MK PANEL ZONE*
Order ID: ${orderNumber}
Date: ${dateStr}

*Product:* ${product.name}
*Plan price:* PKR ${product.price.toFixed(2)}
*Amount sent (typed by customer):* PKR ${parsedAmount.toFixed(2)}
*Amount check:* ${amountMatches ? "MATCHES" : `MISMATCH - expected PKR ${product.price.toFixed(2)}`}

*Customer name:* ${truncate(parsed.data.email.split('@')[0], 80)}
*Contact number:* ${truncate(parsed.data.email, 120)}
*Discord:* ${truncate(parsed.data.discord || "N/A", 120)}

*Screenshot:* uploaded on the website (Order ID above). I will also attach it in this chat.

Please verify my payment and send my access details.`;

    let whatsappUrl = null;
    if (ownerPhone) {
      whatsappUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(messageText)}`;
    }

    const result: SubmitOrderResult = {
      success: true,
      orderRef: orderNumber,
      whatsappUrl,
      messageText,
    };
    idempotencyCache.set(parsed.data.idempotencyKey, result);

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}

const loginSchema = z.object({
  identifier: z.string(),
  password: z.string(),
  platform: z.enum(['ANDROID', 'IOS', 'PC']),
});

export type LoginResult = 
  | { type: "SUCCESS" }
  | { type: "INVALID_CREDENTIALS" }
  | { type: "DEVICE_MISMATCH" }
  | { type: "WRONG_PLATFORM" }
  | { type: "ACCOUNT_DISABLED" }
  | { type: "ERROR"; message: string }
  | null;

export async function customerLogin(prevState: LoginResult, formData: FormData): Promise<LoginResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) return { type: "INVALID_CREDENTIALS" };

    const customer = await prisma.customer.findUnique({
      where: { identifier: parsed.data.identifier },
      include: { devices: true }
    });

    if (!customer) return { type: "INVALID_CREDENTIALS" };

    const argon2 = await import("argon2");
    const isValid = await argon2.verify(customer.passwordHash, parsed.data.password);
    if (!isValid) return { type: "INVALID_CREDENTIALS" };

    /*
      Account status is checked only after the password is verified, so the
      response cannot be used to probe which identifiers exist or which of them
      are disabled. Previously `status` was never read on any code path, which
      made the owner panel's "Disable customer" toggle purely decorative.
    */
    if (customer.status !== "active") {
      return { type: "ACCOUNT_DISABLED" };
    }

    if (customer.platformType !== parsed.data.platform) {
      return { type: "WRONG_PLATFORM" };
    }

    const { cookies, headers } = await import("next/headers");
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    const cookieStore = await cookies();

    if (customer.devices.length === 0) {
      /* First ever sign-in: mint the binding. */
      const newToken = randomBytes(32).toString("hex");
      const tokenHash = await argon2.hash(newToken);

      await prisma.customerDevice.create({
        data: {
          customerId: customer.id,
          deviceTokenHash: tokenHash,
          fingerprint: userAgent,
        }
      });

      cookieStore.set("device_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 10
      });
    } else if (await getBooleanSetting("enforce_device_binding", false)) {
      /*
        DEVICE ENFORCEMENT — OPT-IN, OFF BY DEFAULT.

        A binding already exists, so the presented `device_token` must match it.
        Until this setting is switched on in Control Room → Settings, sign-in
        behaves exactly as it always has: the binding is recorded but not checked.

        Why it is opt-in: there is no self-service reset. Switching this on
        immediately locks out every existing customer who has cleared cookies or
        changed hardware, and they can only recover by contacting support (which
        is the documented process — the owner panel has "Reset device binding").
        That is a commercial decision, so it is not made by default.

        The comparison fails closed: no cookie, an unreadable hash, or no match
        all deny the sign-in rather than silently rebinding to the new device.
      */
      const presented = cookieStore.get("device_token")?.value;
      let matchedDeviceId: string | null = null;

      if (presented) {
        for (const device of customer.devices) {
          try {
            if (await argon2.verify(device.deviceTokenHash, presented)) {
              matchedDeviceId = device.id;
              break;
            }
          } catch {
            /* A malformed stored hash must not abort the whole check — try the
               remaining bindings instead of denying on the first failure. */
          }
        }
      }

      if (!matchedDeviceId) {
        return { type: "DEVICE_MISMATCH" };
      }

      /* Record the successful use so the admin can see which binding is live. */
      await prisma.customerDevice.update({
        where: { id: matchedDeviceId },
        data: { lastUsedAt: new Date() },
      });
    }

    cookieStore.set("auth_session", customer.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return { type: "SUCCESS" };
  } catch (error: unknown) {
    console.error("Login Error:", error);
    return {
      type: "ERROR",
      message: error instanceof Error ? error.message : "An unexpected error occurred during login.",
    };
  }
}

export async function customerLogout() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("auth_session");
  redirect("/");
}

const agentLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type AgentLoginResult = 
  | { type: "SUCCESS"; role: string }
  | { type: "INVALID_CREDENTIALS" }
  | { type: "ERROR"; message: string }
  | null;

export async function agentLogin(prevState: AgentLoginResult, formData: FormData): Promise<AgentLoginResult> {
  const data = Object.fromEntries(formData.entries());
  const parsed = agentLoginSchema.safeParse(data);
  if (!parsed.success) return { type: "INVALID_CREDENTIALS" };

  const agent = await prisma.agent.findUnique({
    where: { username: parsed.data.username }
  });

  if (!agent || agent.status !== "ACTIVE") return { type: "INVALID_CREDENTIALS" };

  const argon2 = await import("argon2");
  const isValid = await argon2.verify(agent.passwordHash, parsed.data.password);
  if (!isValid) return { type: "INVALID_CREDENTIALS" };

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  
  cookieStore.set("agent_session", agent.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 // 1 day session
  });

  return { type: "SUCCESS", role: agent.role };
}

export async function agentLogout() {
  const { cookies } = await import("next/headers");
  const { redirect } = await import("next/navigation");
  const cookieStore = await cookies();
  cookieStore.delete("agent_session");
  redirect("/mk-agents");
}

// ==========================================
// UNIFIED MANAGEMENT LOGIN (OWNER & AGENT)
// ==========================================
export async function managementLogin(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  try {
    const user = await prisma.agent.findUnique({
      where: { username },
    });

    if (!user) {
      return { error: "Invalid credentials" };
    }

    if (user.status === "DISABLED") {
      return { error: "Account disabled. Contact administrator." };
    }

    if (user.role === "OWNER") {
      // Owners now use the private bootstrap mechanism
      return { error: "Invalid credentials" };
    }

    const argon2 = await import("argon2");
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      return { error: "Invalid credentials" };
    }

    // Update lastLoginAt
    await prisma.agent.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Create session
    const sessionData = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const sessionValue = JSON.stringify(sessionData);

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("agent_session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

  } catch (error) {
    console.error("Management login error:", error);
    return { error: "An unexpected error occurred" };
  }

  /*
    The redirect sits outside the try block on purpose. `redirect()` signals by
    throwing a control-flow error, so the handler above would otherwise swallow
    a *successful* sign-in. The previous workaround sniffed the error message
    for the string "NEXT_REDIRECT", which coupled us to an internal detail and
    would fail silently — turning a good login into "An unexpected error
    occurred" — the moment that string changed.
  */
  const { redirect } = await import("next/navigation");
  redirect("/agent");
}

// ==========================================
// OWNER ACTIONS
// ==========================================

async function ensureOwner() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("agent_session")?.value;
  if (!sessionValue) return null;
  
  try {
    const session = JSON.parse(sessionValue);
    if (session.role !== "OWNER") return null;
    return session;
  } catch {
    return null;
  }
}

export async function toggleAgentStatus(id: string, currentStatus: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    await prisma.agent.update({
      where: { id },
      data: { status: currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE" }
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/mkpanelzoneadmin/agents");
    return { success: true };
  } catch (error) {
    console.error("[actions.ts] unexpected failure:", error);
    return { error: "Failed to update agent status" };
  }
}

export async function resetAgentPassword(id: string, newPass: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    const argon2 = await import("argon2");
    const passwordHash = await argon2.hash(newPass);
    await prisma.agent.update({
      where: { id },
      data: { passwordHash }
    });
    return { success: true };
  } catch (error) {
    console.error("[actions.ts] unexpected failure:", error);
    return { error: "Failed to reset password" };
  }
}

export async function toggleCustomerStatus(id: string, currentStatus: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    await prisma.agent.update({
      where: { id },
      data: { status: currentStatus === "active" ? "disabled" : "active" }
    });
  } catch (error) {
    /* Previously an empty block, so a failed status toggle vanished without a
       trace. Log it so the cause is visible in the server output. */
    console.error("[actions.ts] status toggle failed:", error);
  }
}

export async function performCustomerStatusToggle(id: string, currentStatus: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    await prisma.customer.update({
      where: { id },
      data: { status: currentStatus === "active" ? "disabled" : "active" }
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath(`/mkpanelzoneadmin/customers/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[actions.ts] unexpected failure:", error);
    return { error: "Failed to update customer status" };
  }
}

export async function resetCustomerDevice(customerId: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    await prisma.customerDevice.deleteMany({
      where: { customerId }
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/mkpanelzoneadmin/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions.ts] unexpected failure:", error);
    return { error: "Failed to reset device" };
  }
}

export async function resetCustomerPasswordOwner(id: string, newPass: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    const argon2 = await import("argon2");
    const passwordHash = await argon2.hash(newPass);
    await prisma.customer.update({
      where: { id },
      data: { passwordHash }
    });
    return { success: true };
  } catch (error) {
    console.error("[actions.ts] unexpected failure:", error);
    return { error: "Failed to reset password" };
  }
}

export async function createAgent(prevState: ActionState | null, formData: FormData) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("agent_session")?.value;

  if (!sessionValue) return { success: false, error: "Unauthorized" };
  
  let sessionId = sessionValue;
  try {
    const session = JSON.parse(sessionValue);
    sessionId = session.userId;
  } catch (e) {
    console.error("[actions.ts] unexpected failure:", e);
    // Fallback if not JSON
  }
  
  const owner = await prisma.agent.findUnique({ where: { id: sessionId } });
  if (!owner || owner.role !== "OWNER") return { success: false, error: "Forbidden" };
  /* Same reasoning as agentCreateCustomer: a disabled owner must not retain
     privileged access through a pre-existing session. */
  if (owner.status !== "ACTIVE") return { success: false, error: "Forbidden" };

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password || username.length < 3 || password.length < 6) {
    return { success: false, error: "Invalid username or password length." };
  }

  const existing = await prisma.agent.findUnique({ where: { username } });
  if (existing) {
    return { success: false, error: "Username already exists." };
  }

  const argon2 = await import("argon2");
  const passwordHash = await argon2.hash(password);

  await prisma.agent.create({
    data: {
      username,
      passwordHash,
      role: "AGENT",
    }
  });

  return { success: true };
}

export async function agentCreateCustomer(prevState: ActionState | null, formData: FormData) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("agent_session")?.value;

  if (!sessionValue) return { success: false, error: "Unauthorized" };
  
  let sessionId = sessionValue;
  try {
    const session = JSON.parse(sessionValue);
    sessionId = session.userId;
  } catch (e) {
    console.error("[actions.ts] unexpected failure:", e);
    // Fallback if not JSON
  }
  
  const agent = await prisma.agent.findUnique({ where: { id: sessionId } });
  if (!agent) return { success: false, error: "Forbidden" };

  /* Defense in depth (spec §49). Login already rejects a disabled agent, but an
     agent disabled *after* signing in keeps a valid cookie until it expires, so
     status is re-checked on the privileged action itself rather than trusted
     from the session. */
  if (agent.status !== "ACTIVE") {
    return { success: false, error: "Your account is disabled. Please contact the owner." };
  }

  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;
  const platformType = formData.get("platformType") as string;
  
  if (!identifier || !password || !platformType) {
    return { success: false, error: "Identifier, password, and platform type are required." };
  }

  const { ensureDefaultPackages } = await import("@/lib/auto-repair");
  await ensureDefaultPackages();

  const defaultPkg = await prisma.package.findFirst({
    where: { platformType, isDefaultForAgents: true }
  });

  if (!defaultPkg) {
    return { success: false, error: `No default package configured for platform ${platformType}. Please contact Owner.` };
  }
  
  const packageId = defaultPkg.id;

  const file = formData.get("paymentProof") as File;
  if (!file || file.size === 0) {
    return { success: false, error: "Payment proof is required." };
  }

  const existing = await prisma.customer.findUnique({ where: { identifier } });
  if (existing) {
    return { success: false, error: "Customer identifier already exists." };
  }

  let finalPaymentProofUrl = "";

  try {
    const { supabase } = await import("@/lib/supabaseClient");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalExt = file.name.split('.').pop() || 'tmp';
    const filename = `agent-${uniqueSuffix}.${originalExt}`;

    const { error } = await supabase.storage
      .from('media')
      .upload(`uploads/${filename}`, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });

    if (error) {
      console.error("Supabase Storage Error (Agent):", error);
      return { success: false, error: "Failed to upload payment proof image." };
    }

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(`uploads/${filename}`);

    finalPaymentProofUrl = publicUrlData.publicUrl;
  } catch (e: unknown) {
    console.error("Upload exception:", e);
    return { success: false, error: "Failed to upload payment proof image." };
  }
  
  const argon2 = await import("argon2");
  const passwordHash = await argon2.hash(password);

  await prisma.customer.create({
    data: {
      identifier,
      passwordHash,
      platformType,
      packageId,
      createdSource: "AGENT",
      createdByAgentId: agent.id,
      agentPaymentProof: finalPaymentProofUrl
    }
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/mkpanelzoneadmin/customers");
  revalidatePath("/agent/customers");

  return { success: true };
}
