"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";

import { headers } from "next/headers";
import { ensureCustomerBranch, resolveBranch } from "@/lib/branches";
import { uploadPaymentProof } from "@/lib/paymentProof";

const rateLimits = new Map<string, { count: number; expiresAt: number }>();
const loginAttempts = new Map<string, { count: number; expiresAt: number }>();
/** Order submissions are idempotent per generated client key. */
const idempotencyCache = new Map<string, any>();

/**
 * Lightweight per-IP throttle for credential guessing. Deliberately generous:
 * it must never lock a real customer out on a shared mobile network.
 */
function loginThrottled(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.expiresAt <= now) {
    loginAttempts.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    return false;
  }
  entry.count++;
  return entry.count > 20;
}

function clearLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

const orderSchema = z.object({
  productId: z.string(),
  email: z.string().email(),
  discord: z.string().optional(),
  amountReported: z.string(),
  paymentMethod: z.string().optional(),
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

export async function submitOrder(formData: FormData) {
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
      paymentMethod: data.paymentMethod,
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
      return idempotencyCache.get(parsed.data.idempotencyKey);
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

    /* Resolve the customer's chosen payment method to its display name.
       Only a method that actually exists and is active is ever echoed back,
       so a forged value can't inject text into the WhatsApp message. */
    let paymentMethodName = "Not specified";
    if (parsed.data.paymentMethod) {
      const method = await prisma.paymentMethod.findUnique({
        where: { id: parsed.data.paymentMethod },
        select: { name: true, active: true },
      });
      if (method && method.active) paymentMethodName = method.name;
    }

    const file = formData.get("paymentProof") as File;
    if (!file || file.size === 0) {
      return { success: false, error: "Payment proof is required." };
    }

    /* ── REAL upload ─────────────────────────────────────────────────────
       The previous implementation invented a "/uploads/<random>-<name>"
       path, saved it and reported success — so Admin always saw a broken
       image. We now upload to Supabase Storage first and only persist the
       returned object path. If the upload fails we return a real error and
       create NO order, so success is never faked. */
    const upload = await uploadPaymentProof(file, "order");
    if (!upload.ok) {
      return { success: false, error: upload.error };
    }

    const orderNumber = generateOrderRef();

    await prisma.order.create({
      data: {
        orderNumber,
        productId: product.id,
        priceSnapshot: product.price,
        customerEmail: parsed.data.email,
        customerDiscord: parsed.data.discord || "",
        paymentProofPath: upload.path,
        amountReported: parsedAmount,
        amountMatches,
        status: "pending"
      }
    });

    /* Resolve the destination number from the Admin-managed setting, falling
       back to the legacy env var. Owner can change it any time without a deploy. */
    const { getWhatsAppNumber, whatsappLink } = await import("@/lib/settings");
    const ownerPhone = await getWhatsAppNumber();
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
*Payment method:* ${paymentMethodName}
*Amount sent (typed by customer):* PKR ${parsedAmount.toFixed(2)}
*Amount check:* ${amountMatches ? "MATCHES" : `MISMATCH - expected PKR ${product.price.toFixed(2)}`}

*Customer name:* ${truncate(parsed.data.email.split('@')[0], 80)}
*Contact number:* ${truncate(parsed.data.email, 120)}
*Discord:* ${truncate(parsed.data.discord || "N/A", 120)}

*Screenshot:* uploaded on the website (Order ID above). I will also attach it in this chat.

Please verify my payment and send my access details.`;

    const whatsappUrl = whatsappLink(ownerPhone, messageText);

    const result = { success: true, orderRef: orderNumber, whatsappUrl, messageText };
    idempotencyCache.set(parsed.data.idempotencyKey, result);

    return result;
  } catch (error: any) {
    console.error("[submitOrder] failed:", error);
    return { success: false, error: "We could not submit your order. Please try again." };
  }
}

const loginSchema = z.object({
  identifier: z.string(),
  password: z.string(),
  /* Platforms are dynamic (owner-managed), so the code is validated against
     the database below rather than pinned to a compile-time union. */
  platform: z.string().min(1).max(32),
  branchSlug: z.string().optional(),
});

export type LoginResult = 
  | { type: "SUCCESS" }
  | { type: "INVALID_CREDENTIALS" }
  | { type: "DEVICE_MISMATCH" }
  | { type: "WRONG_PLATFORM" }
  | { type: "BRANCH_DENIED" }
  | { type: "ERROR"; message: string }
  | null;

export async function customerLogin(prevState: any, formData: FormData): Promise<LoginResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) return { type: "INVALID_CREDENTIALS" };

    const { headers: headerReader } = await import("next/headers");
    const reqHeaders = await headerReader();
    const ip = (reqHeaders.get("x-forwarded-for") || "local").split(",")[0].trim();
    if (loginThrottled(ip)) {
      return { type: "ERROR", message: "Too many attempts. Please wait a few minutes and try again." };
    }

    /* The identifier is trimmed before lookup: a trailing space from a mobile
       keyboard's autocomplete was a common cause of "my password stopped
       working". Exactly one query — no duplicate round-trip. */
    const customer = await prisma.customer.findUnique({
      where: { identifier: parsed.data.identifier.trim() },
      include: { devices: true },
    });
    if (!customer) return { type: "INVALID_CREDENTIALS" };

    const argon2 = await import("argon2");
    let isValid = false;
    try {
      isValid = await argon2.verify(customer.passwordHash, parsed.data.password);
    } catch {
      // A malformed/legacy hash must read as invalid credentials, never crash.
      isValid = false;
    }
    /* ── Payment status is NOT revealed here and does not affect the answer.
       An unpaid customer authenticates exactly like a paid one, then hits the
       server-side gate on the dashboard. A wrong password can therefore never
       leak whether an account is paid or unpaid. */
    if (!isValid) {
      return { type: "INVALID_CREDENTIALS" };
    }
    clearLoginAttempts(ip);

    if (customer.platformType !== parsed.data.platform) {
      return { type: "WRONG_PLATFORM" };
    }

    if (customer.status !== "active") {
      return { type: "INVALID_CREDENTIALS" };
    }

    /* ── Branch authorization (server-side, never trusted from the client) ──
       The submitted branch slug is only a routing hint; the customer record
       is the source of truth. If the customer belongs to a branch and it is
       not the branch they selected (or that branch is disabled), deny with a
       neutral message that does not reveal which branch the account is in. */
    if (customer.branchId) {
      const branch = await prisma.platformBranch.findUnique({
        where: { id: customer.branchId },
      });
      const submitted = parsed.data.branchSlug
        ? await prisma.platformBranch.findUnique({
            where: { platformType_slug: { platformType: customer.platformType, slug: parsed.data.branchSlug } },
          })
        : null;
      if (!branch || !branch.isEnabled || (submitted && submitted.id !== branch.id)) {
        return { type: "BRANCH_DENIED" };
      }
    } else {
      // Legacy/pre-branch customer: attach to their platform's first enabled
      // branch so split platforms keep working without owner intervention.
      const branchId = await ensureCustomerBranch(customer);
      if (branchId && parsed.data.branchSlug) {
        const resolved = await resolveBranch(customer.platformType, parsed.data.branchSlug);
        if (!resolved.ok || resolved.branch.id !== branchId) {
          return { type: "BRANCH_DENIED" };
        }
      }
    }

    const { cookies, headers } = await import("next/headers");
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    const cookieStore = await cookies();

    /* ── Device token ────────────────────────────────────────────────────
       Previously this cookie was only issued on the customer's FIRST-ever
       login. Any later sign-in (new browser, cleared cookies, second device
       after a reset) left the browser without it, and /access refuses to
       redirect without BOTH cookies — which is what looked like a "stuck"
       login. The token is now issued whenever the browser has none. */
    if (!cookieStore.get("device_token")?.value) {
      const newToken = randomBytes(32).toString("hex");
      try {
        const tokenHash = await argon2.hash(newToken);
        await prisma.customerDevice.create({
          data: {
            customerId: customer.id,
            deviceTokenHash: tokenHash,
            fingerprint: userAgent,
          },
        });
      } catch (deviceError) {
        // Device bookkeeping must never block a valid sign-in.
        console.error("[customerLogin] device registration failed:", deviceError);
      }

      cookieStore.set("device_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 10,
      });
    }

    /* `lax` (not `strict`) so Safari still sends the session after a redirect
       back into the site from WhatsApp/Telegram; this is what made sign-in
       feel unreliable on older iPhones. */
    cookieStore.set("auth_session", customer.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    /* Non-sensitive companion hint (contains no identity). It lets the navbar
       and the announcement/popup layers know the audience in the browser, which
       keeps the public site statically renderable. */
    cookieStore.set("mk_session", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    /* Login bookkeeping — best effort, never fatal, and never blocks the
       response on a slow network. */
    prisma.customer
      .update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {});

    return { type: "SUCCESS" };
  } catch (error: any) {
    console.error("Login Error:", error);
    return { type: "ERROR", message: error?.message || "An unexpected error occurred during login." };
  }
}

export async function customerLogout() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("auth_session");
  cookieStore.delete("mk_session");
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

export async function agentLogin(prevState: any, formData: FormData): Promise<AgentLoginResult> {
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

    const { redirect } = await import("next/navigation");
    redirect("/agent");
  } catch (error) {
    const { redirect } = await import("next/navigation");
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Management login error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// ==========================================
// OWNER ACTIONS
// ==========================================

/**
 * Owner authorization.
 *
 * Previously this only JSON-parsed the `agent_session` cookie and trusted
 * `session.role === "OWNER"` — a forged cookie was enough to obtain owner
 * privileges. It now delegates to the shared, database-verified
 * `requireOwner()` (validates the `owner_session` cookie against an ACTIVE
 * OWNER row) so a client cannot mint a session by hand.
 */
async function ensureOwner() {
  const { requireOwner } = await import("@/lib/owner");
  return requireOwner();
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
    return { error: "Failed to reset password" };
  }
}

export async function toggleCustomerStatus(id: string, currentStatus: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  // NOTE: this previously wrote to prisma.agent — a customer action must only
  // ever touch the customer row. Kept as a thin wrapper so old call sites work.
  return performCustomerStatusToggle(id, currentStatus);
}

/**
 * PAID / UNPAID access switch. Touches ONLY paymentStatus: identifier,
 * password, platform, branch, package, device bindings, expiry, metadata and
 * createdAt are all left exactly as they were.
 */
export async function adminSetCustomerPaymentStatus(id: string, status: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const next = status === "UNPAID" ? "UNPAID" : "PAID";
  try {
    await prisma.customer.update({
      where: { id },
      data: { paymentStatus: next },
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath(`/mkpanelzoneadmin/customers/${id}`);
    return { success: true, paymentStatus: next };
  } catch (error) {
    console.error("[adminSetCustomerPaymentStatus]", error);
    return { error: "Failed to update payment status." };
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
    return { error: "Failed to reset password" };
  }
}

export async function createAgent(prevState: any, formData: FormData) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("agent_session")?.value;

  if (!sessionValue) return { success: false, error: "Unauthorized" };
  
  let sessionId = sessionValue;
  try {
    const session = JSON.parse(sessionValue);
    sessionId = session.userId;
  } catch (e) {
    // Fallback if not JSON
  }
  
  const owner = await prisma.agent.findUnique({ where: { id: sessionId } });
  if (!owner || owner.role !== "OWNER") return { success: false, error: "Forbidden" };

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

export async function agentCreateCustomer(prevState: any, formData: FormData) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("agent_session")?.value;

  if (!sessionValue) return { success: false, error: "Unauthorized" };
  
  let sessionId = sessionValue;
  try {
    const session = JSON.parse(sessionValue);
    sessionId = session.userId;
  } catch (e) {
    // Fallback if not JSON
  }
  
  const agent = await prisma.agent.findUnique({ where: { id: sessionId } });
  if (!agent) return { success: false, error: "Forbidden" };

  const identifier = ((formData.get("identifier") as string) || "").trim();
  const password = formData.get("password") as string;
  const platformType = ((formData.get("platformType") as string) || "").toUpperCase();

  if (!identifier || !password || !platformType) {
    return { success: false, error: "Identifier, password, and platform type are required." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  /* The platform comes from a client-controlled <select>, so it is verified
     against the owner-managed platform table before anything is written. */
  const { findPlatformByCode } = await import("@/lib/platforms");
  const platformRecord = await findPlatformByCode(platformType);
  if (!platformRecord || !platformRecord.isEnabled) {
    return { success: false, error: "That platform is not available. Please pick another." };
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

  /* Real upload via the shared proof pipeline. It returns a STORAGE OBJECT
     PATH — the old code persisted an absolute public URL, which is why the
     proof later failed to open for the Owner. */
  const upload = await uploadPaymentProof(file, `agent-${agent.username}`);
  if (!upload.ok) {
    return { success: false, error: upload.error };
  }

  const paymentStatus = ((formData.get("paymentStatus") as string) || "PAID") === "UNPAID" ? "UNPAID" : "PAID";

  const argon2 = await import("argon2");
  const passwordHash = await argon2.hash(password);

  const created = await prisma.customer.create({
    data: {
      identifier,
      passwordHash,
      platformType,
      packageId,
      paymentStatus,
      createdSource: "AGENT",
      createdByAgentId: agent.id,
      agentPaymentProof: upload.path,
    },
  });

  /* Attach agent-created customers to their platform's default branch (if
     one exists) so they land in the right section from their first login. */
  await ensureCustomerBranch(created);

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/mkpanelzoneadmin/customers");
  revalidatePath("/agent");

  return { success: true };
}
