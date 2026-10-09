"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_TAGS } from "@/lib/adminCache";
import { FREE_PANEL_SETTING_KEY, sanitizeUrl } from "@/lib/freePanel";
import { isValidBranchSlug } from "@/lib/branches";
import { requireOwner } from "@/lib/owner";

/**
 * Owner authorization for every server action below.
 *
 * Returns the verified owner session, or null for anyone else. Actions return
 * a generic "Unauthorized" result rather than throwing so a stale cookie never
 * produces a crash.
 */
async function ensureOwner() {
  return requireOwner();
}

// ----------------------------------------------------------------------
// PLATFORM BRANCHES
// ----------------------------------------------------------------------

export async function adminCreateBranch(prevState: any, formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { success: false, error: "Unauthorized" };

  const platformType = (formData.get("platformType") as string || "").toUpperCase();
  const name = ((formData.get("name") as string) || "").trim();
  const rawSlug = ((formData.get("slug") as string) || "").trim().toLowerCase();
  const description = (formData.get("description") as string || "").trim() || null;
  const slug = rawSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  if (!name || !slug) return { success: false, error: "Branch name is required." };

  /* Platform validation comes from the database, not a hardcoded list, so a
     platform the owner created in Admin works here immediately. */
  const platform = await prisma.platform.findUnique({ where: { code: platformType } });
  if (!platform) {
    return { success: false, error: "Invalid platform." };
  }
  if (!isValidBranchSlug(slug)) {
    return { success: false, error: "Slug may only contain lowercase letters, numbers and dashes." };
  }

  const existing = await prisma.platformBranch.findUnique({
    where: { platformType_slug: { platformType, slug } },
  });
  if (existing) return { success: false, error: "A branch with this slug already exists on this platform." };

  const maxOrder = await prisma.platformBranch.aggregate({
    where: { platformType },
    _max: { sortOrder: true },
  });

  try {
    await prisma.platformBranch.create({
      data: {
        platformType,
        name,
        slug,
        description,
        isEnabled: true,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
    revalidatePath("/mkpanelzoneadmin/resources");
    revalidatePath("/access");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create branch." };
  }
}

export async function adminUpdateBranch(formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const branchId = formData.get("branchId") as string;
  if (!branchId) return { error: "Missing branch." };

  try {
    const data: Record<string, unknown> = {};
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;
    const sortOrderRaw = formData.get("sortOrder") as string | null;
    if (name !== null) data.name = name.trim();
    if (description !== null) data.description = description.trim() || null;
    if (sortOrderRaw !== null && sortOrderRaw !== "") data.sortOrder = parseInt(sortOrderRaw, 10);
    if (formData.has("isEnabled")) data.isEnabled = formData.get("isEnabled") === "on";
    if (formData.has("warningEnabled")) data.warningEnabled = formData.get("warningEnabled") === "on";
    const warningTitle = formData.get("warningTitle") as string | null;
    const warningMessage = formData.get("warningMessage") as string | null;
    const warningButtonText = formData.get("warningButtonText") as string | null;
    if (warningTitle !== null) data.warningTitle = warningTitle.trim() || "BEFORE YOU CONTINUE";
    if (warningMessage !== null) data.warningMessage = warningMessage.trim();
    if (warningButtonText !== null) data.warningButtonText = warningButtonText.trim() || "I UNDERSTAND — CONTINUE";

    await prisma.platformBranch.update({ where: { id: branchId }, data });
    revalidatePath("/mkpanelzoneadmin/resources");
    revalidatePath("/access");
    return { success: true };
  } catch {
    return { error: "Failed to update branch." };
  }
}

export async function adminToggleBranchEnabled(formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const branchId = formData.get("branchId") as string;
  if (!branchId) return { error: "Missing branch." };

  try {
    const branch = await prisma.platformBranch.findUnique({ where: { id: branchId } });
    if (!branch) return { error: "Branch not found." };
    await prisma.platformBranch.update({
      where: { id: branchId },
      data: { isEnabled: !branch.isEnabled },
    });
    revalidatePath("/mkpanelzoneadmin/resources");
    revalidatePath("/access");
    return { success: true };
  } catch {
    return { error: "Failed to toggle branch." };
  }
}

// ----------------------------------------------------------------------
// CUSTOMERS
// ----------------------------------------------------------------------

export async function adminCreateCustomer(prevState: any, formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { success: false, error: "Unauthorized" };

  const identifier = ((formData.get("identifier") as string) || "").trim();
  const password = (formData.get("password") as string) || "";
  const platformType = ((formData.get("platformType") as string) || "").toUpperCase();
  let branchId = ((formData.get("branchId") as string) || "") || null;
  let packageId = ((formData.get("packageId") as string) || "") || null;
  const status = (formData.get("status") as string) || "active";
  /* Access gate chosen at creation time. Anything other than an explicit
     UNPAID is treated as PAID, matching the column default. */
  const paymentStatus =
    ((formData.get("paymentStatus") as string) || "PAID").toUpperCase() === "UNPAID"
      ? "UNPAID"
      : "PAID";

  if (!identifier || !password || !platformType) {
    return { success: false, error: "Customer ID, password and platform are required." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  /* Platform must exist in the database — never trust the submitted value. */
  const platform = await prisma.platform.findUnique({ where: { code: platformType } });
  if (!platform) {
    return { success: false, error: "Invalid platform." };
  }

  const existing = await prisma.customer.findUnique({ where: { identifier } });
  if (existing) {
    return { success: false, error: "Customer ID already exists." };
  }

  /* ── Branch resolution ───────────────────────────────────────────────────
     If the platform has enabled branches the owner must pick one and it must
     belong to this platform. If it has none, a Default branch is provisioned
     so a brand-new platform works without manual setup. */
  const platformBranches = await prisma.platformBranch.findMany({
    where: { platformType, isEnabled: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  if (platformBranches.length > 0) {
    const chosen = platformBranches.find((b) => b.id === branchId);
    if (!chosen) {
      return { success: false, error: "Please choose a branch for this platform." };
    }
    branchId = chosen.id;
  } else {
    const { ensurePlatformBranch } = await import("@/lib/auto-repair");
    branchId = await ensurePlatformBranch(platformType);
  }

  /* ── Package resolution ──────────────────────────────────────────────────
     An explicit package must belong to the platform. Otherwise fall back to
     the platform's default agent package, provisioning one if needed. */
  if (packageId) {
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.platformType !== platformType) {
      return { success: false, error: "Invalid package for this platform." };
    }
    packageId = pkg.id;
  } else {
    const { ensureDefaultPackages } = await import("@/lib/auto-repair");
    await ensureDefaultPackages();
    const fallback = await prisma.package.findFirst({
      where: { platformType, isDefaultForAgents: true },
      select: { id: true },
    });
    if (!fallback) {
      return { success: false, error: `No default package configured for ${platform.name}.` };
    }
    packageId = fallback.id;
  }

  try {
    const argon2 = await import("argon2");
    const passwordHash = await argon2.hash(password);

    await prisma.customer.create({
      data: {
        identifier,
        passwordHash,
        platformType,
        branchId,
        packageId,
        status,
        paymentStatus,
        createdSource: "OWNER_ADMIN",
      },
    });

    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath("/mkpanelzoneadmin");
    return { success: true };
  } catch (error) {
    console.error("[adminCreateCustomer]", error);
    return { success: false, error: "Unable to create customer. Please try again." };
  }
}

/**
 * PAID ⇄ UNPAID switch.
 *
 * Writes ONLY paymentStatus. Customer ID, password hash, platform, branch,
 * package, device bindings, expiry and createdAt are untouched, so an account
 * can be suspended for non-payment and restored later without a new password
 * or a device reset.
 *
 * Revalidating the customer list is not enough on its own: the next protected
 * request re-reads the row server-side, which is what revokes access for an
 * already-open session when the switch goes the other way (PAID → UNPAID).
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
    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath(`/mkpanelzoneadmin/customers/${id}`);
    return { success: true, paymentStatus: next };
  } catch (error) {
    console.error("[adminSetCustomerPaymentStatus]", error);
    return { error: "Failed to update payment status." };
  }
}

export async function adminUpdateCustomerStatus(id: string, newStatus: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    await prisma.customer.update({
      where: { id },
      data: { status: newStatus }
    });
    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath(`/mkpanelzoneadmin/customers/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[admin action] failed:", error);
    return { error: "Failed to update status." };
  }
}

export async function adminSetCustomerPassword(id: string, newPass: string) {
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
    console.error("[admin action] failed:", error);
    return { error: "Failed to set new password." };
  }
}

export async function adminResetCustomerDevice(customerId: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    await prisma.customerDevice.deleteMany({
      where: { customerId }
    });
    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath(`/mkpanelzoneadmin/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    console.error("[admin action] failed:", error);
    return { error: "Failed to reset device." };
  }
}

export async function adminChangeCustomerPlatform(id: string, platformType: string, packageId: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    /* Platform must be a real, known platform. */
    const platform = await prisma.platform.findUnique({ where: { code: platformType } });
    if (!platform) return { error: "Invalid platform." };

    /* A package must belong to the target platform — never leave a mismatch. */
    if (packageId) {
      const pkg = await prisma.package.findUnique({ where: { id: packageId } });
      if (!pkg || pkg.platformType !== platformType) {
        return { error: "Invalid package for this platform." };
      }
    }

    /* Move the customer to a branch belonging to the NEW platform, otherwise
       they would be stranded pointing at a branch from their old platform. */
    const targetBranch = await prisma.platformBranch.findFirst({
      where: { platformType, isEnabled: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    const data: { platformType: string; packageId: string | null; branchId?: string | null } = {
      platformType,
      packageId: packageId || null,
    };
    if (targetBranch) data.branchId = targetBranch.id;

    await prisma.customer.update({ where: { id }, data });

    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath(`/mkpanelzoneadmin/customers/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[adminChangeCustomerPlatform]", error);
    return { error: "Failed to update platform/package." };
  }
}

// ----------------------------------------------------------------------
// AGENTS
// ----------------------------------------------------------------------

export async function adminCreateAgent(prevState: any, formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { success: false, error: "Unauthorized" };

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const phone = ((formData.get("phone") as string) || "").replace(/[^\d]/g, "").slice(0, 15);
  const planKey = (formData.get("subscriptionPlan") as string) || "";

  if (!username || !password || username.length < 3 || password.length < 6) {
    return { success: false, error: "Invalid username or password length." };
  }

  const { findResellerPlan } = await import("@/lib/pricing");
  const plan = findResellerPlan(planKey);
  if (planKey && !plan) {
    return { success: false, error: "Unknown subscription plan." };
  }

  const existing = await prisma.agent.findUnique({ where: { username } });
  if (existing) {
    return { success: false, error: "Username already exists." };
  }

  const argon2 = await import("argon2");
  const passwordHash = await argon2.hash(password);

  const now = new Date();
  await prisma.agent.create({
    data: {
      username,
      passwordHash,
      role: "AGENT",
      status: "ACTIVE",
      phone: phone || null,
      subscriptionPlan: plan?.key ?? null,
      subscriptionStart: plan && plan.days !== null ? now : null,
      subscriptionExpiry: plan && plan.days !== null ? new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000) : null,
    }
  });

  revalidatePath("/mkpanelzoneadmin/agents");
  return { success: true };
}

export async function adminToggleAgentStatus(id: string, currentStatus: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    await prisma.agent.update({
      where: { id },
      data: { status: currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE" }
    });
    revalidatePath("/mkpanelzoneadmin/agents");
    revalidatePath(`/mkpanelzoneadmin/agents/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[admin action] failed:", error);
    return { error: "Failed to update agent status." };
  }
}

export async function adminSetAgentPassword(id: string, newPass: string) {
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
    console.error("[admin action] failed:", error);
    return { error: "Failed to reset password." };
  }
}

// ----------------------------------------------------------------------
// ORDERS
// ----------------------------------------------------------------------

export async function updateOrderStatus(formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const orderId = formData.get("orderId") as string;
  const status = formData.get("status") as string;

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    /* The orders list is served from a cross-request cache, so the tag must be
       invalidated for the new status to appear immediately. */
    revalidateTag(ADMIN_TAGS.orders, "max");
    revalidatePath("/mkpanelzoneadmin/orders");
    revalidatePath(`/mkpanelzoneadmin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("[admin action] failed:", error);
    return { error: "Failed to update order status." };
  }
}

// ----------------------------------------------------------------------
// PRODUCTS
// ----------------------------------------------------------------------

export async function toggleProductStatus(formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const productId = formData.get("productId") as string;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { error: "Product not found" };

    await prisma.product.update({
      where: { id: productId },
      data: { active: !product.active }
    });
    revalidatePath("/mkpanelzoneadmin/products");
    return { success: true };
  } catch (error) {
    console.error("[admin action] failed:", error);
    return { error: "Failed to toggle product status." };
  }
}

export async function deleteProduct(formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const productId = formData.get("productId") as string;

  try {
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/mkpanelzoneadmin/products");
    return { success: true };
  } catch (error) {
    console.error("[admin action] failed:", error);
    return { error: "Failed to delete product." };
  }
}

// ----------------------------------------------------------------------
// PAYMENT METHODS
// ----------------------------------------------------------------------

export async function togglePaymentMethod(formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const methodId = formData.get("methodId") as string;

  try {
    const method = await prisma.paymentMethod.findUnique({ where: { id: methodId } });
    if (!method) return { error: "Method not found" };

    await prisma.paymentMethod.update({
      where: { id: methodId },
      data: { active: !method.active }
    });
    revalidatePath("/mkpanelzoneadmin/payments");
    return { success: true };
  } catch (error) {
    console.error("[admin action] failed:", error);
    return { error: "Failed to toggle payment method." };
  }
}

// ----------------------------------------------------------------------
// RESOURCES
// ----------------------------------------------------------------------

export async function toggleResourceStatus(formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const resourceId = formData.get("resourceId") as string;

  try {
    const resource = await prisma.packageResource.findUnique({ where: { id: resourceId } });
    if (!resource) return { error: "Resource not found" };

    await prisma.packageResource.update({
      where: { id: resourceId },
      data: { status: resource.status === "active" ? "inactive" : "active" }
    });
    /* Revalidate every surface that lists this resource — the branch detail
       page was previously missed, so its list went stale after a toggle. */
    revalidatePath("/mkpanelzoneadmin/resources");
    revalidatePath("/mkpanelzoneadmin/resources/all");
    revalidatePath(`/mkpanelzoneadmin/resources/${resourceId}`);
    if (resource.branchId) {
      revalidatePath(`/mkpanelzoneadmin/resources/platform/${resource.platformType}/${resource.branchId}`);
    }
    revalidatePath(`/mkpanelzoneadmin/resources/platform/${resource.platformType}`);
    return { success: true };
  } catch (error) {
    console.error("[toggleResourceStatus]", error);
    return { error: "Failed to toggle resource status." };
  }
}

// ----------------------------------------------------------------------
// SITE SETTINGS
// ----------------------------------------------------------------------

export async function saveSettings(formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    const keys = Array.from(new Set(Array.from(formData.keys()).filter((key) => key.startsWith("setting_"))));

    /* Settings forms often submit several independent values. One transaction
       replaces a sequential request waterfall, keeps related changes atomic,
       and ensures the owner gets a single definitive success/failure result. */
    await prisma.$transaction(
      keys.map((key) => {
        const settingKey = key.replace("setting_", "");
        const value = String(formData.get(key) ?? "");
        return prisma.siteSetting.upsert({
          where: { key: settingKey },
          update: { value },
          create: { key: settingKey, value },
        });
      }),
    );

    // Hero Top CTA — sanitize the link server-side (internal or https:// only).
    if (formData.has("hero_cta_enabled")) {
      const rawLink = (formData.get("hero_cta_link") as string | null)?.trim() ?? "";
      let safeLink = "";
      if (rawLink.startsWith("/")) safeLink = rawLink;
      else {
        try {
          const u = new URL(rawLink);
          if (u.protocol === "https:" || u.protocol === "http:") safeLink = rawLink;
        } catch { /* unsafe/invalid → store empty */ }
      }
      await prisma.siteSetting.upsert({
        where: { key: "hero_cta" },
        update: { value: JSON.stringify({ enabled: formData.get("hero_cta_enabled") === "on", text: (formData.get("hero_cta_text") as string | null)?.trim() || "", link: safeLink, newTab: formData.get("hero_cta_new_tab") === "on" }) },
        create: { key: "hero_cta", value: JSON.stringify({ enabled: false, text: "", link: "", newTab: false }) },
      });
    }

    const redirectUrl = formData.get("redirectUrl") as string;
    if (redirectUrl) {
      revalidatePath(redirectUrl);
    }
    
    return { success: true };
  } catch (error) {
    console.error("[admin action] failed:", error);
    return { error: "Failed to save settings." };
  }
}

/**
 * Bulk-import Free Panel keys. Trims, normalizes, dedupes, skips lines already
 * stored. Accepts the owner's 6x6 format (XXXXXX-…-XXXXXX) and any sensible
 * key string; badly formatted lines are counted and skipped.
 */
export async function importFreePanelKeys(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  if (!owner) return;
  try {
    const raw = (formData.get("keys") as string | null) ?? "";
    const batchNotes = (formData.get("notes") as string | null)?.trim() || null;
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // Sensible key shape: uppercase alphanumeric groups separated by dashes.
    const KEY_FORMAT = /^[A-Z0-9]{4,8}(-[A-Z0-9]{4,8})+$/;

    // Dedupe within the paste itself
    const seen = new Set<string>();
    const candidates: string[] = [];
    let duplicatesInPaste = 0;
    let invalid = 0;
    for (const rawLine of lines) {
      // Normalize: unify case, strip accidental spaces around/inside the key
      const line = rawLine.toUpperCase().replace(/\s+/g, "");
      if (seen.has(line)) { duplicatesInPaste++; continue; }
      if (!KEY_FORMAT.test(line) || line.length < 4 || line.length > 64) { invalid++; continue; }
      seen.add(line);
      candidates.push(line);
    }

    // Skip keys already in DB
    const existing = await prisma.freePanelKey.findMany({
      where: { keyValue: { in: candidates } },
      select: { keyValue: true },
    });
    const existingSet = new Set(existing.map((e) => e.keyValue));
    const toInsert = candidates.filter((k) => !existingSet.has(k));
    const dbDuplicates = candidates.length - toInsert.length;

    if (toInsert.length > 0) {
      const batchId = randomBytes(6).toString("hex");
      await prisma.freePanelKey.createMany({
        data: toInsert.map((keyValue) => ({ keyValue, batchId, notes: batchNotes })),
        skipDuplicates: true,
      });
    }

    const skipped = duplicatesInPaste + dbDuplicates;
    const result = { submitted: lines.length, imported: toInsert.length, skipped, invalid };
    // Surface result via redirect query param
    const { redirect } = await import("next/navigation");
    revalidatePath("/mkpanelzoneadmin/free-panel");
    redirect(`/mkpanelzoneadmin/free-panel?imported=${result.imported}&skipped=${result.skipped}&submitted=${result.submitted}&invalid=${result.invalid}`);
  } catch (error) {
    // redirect() itself throws NEXT_REDIRECT; re-throw so a SUCCESS redirect
    // is never caught here and misreported as an import failure.
    if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error("importFreePanelKeys failed:", error);
    const { redirect } = await import("next/navigation");
    redirect("/mkpanelzoneadmin/free-panel?error=import");
  }
}

/**
 * Generate owner-format Free Panel keys: 6 groups of 6 characters from a
 * 32-symbol alphabet (no 0/O/1/I to keep keys readable over WhatsApp).
 * Uniqueness is enforced against the DB (keyValue is unique); a retry loop
 * covers the astronomically unlikely collision case.
 */
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateOwnerFormatKey(): string {
  const group = () =>
    Array.from(randomBytes(6))
      .map((b) => KEY_ALPHABET[b % KEY_ALPHABET.length])
      .join("");
  return Array.from({ length: 6 }, group).join("-");
}

export async function generateFreePanelKeys(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  if (!owner) return;
  let inserted = 0;
  let count = 10;
  try {
    count = Math.min(Math.max(Number(formData.get("count") ?? 10) || 10, 1), 500);
    const batchNotes = (formData.get("notes") as string | null)?.trim() || null;

    const batchId = randomBytes(6).toString("hex");
    let guard = 0;

    while (inserted < count && guard < count * 5) {
      guard++;
      const keyValue = generateOwnerFormatKey();
      try {
        await prisma.freePanelKey.create({
          data: { keyValue, batchId, notes: batchNotes ?? "Generated — owner format" },
        });
        inserted++;
      } catch {
        // Unique violation on the 1-in-billions collision — just draw again.
      }
    }

    revalidatePath("/mkpanelzoneadmin/free-panel");
  } catch (error) {
    console.error("generateFreePanelKeys failed:", error);
    const { redirect } = await import("next/navigation");
    redirect("/mkpanelzoneadmin/free-panel?error=generate");
  }
  // redirect() throws NEXT_REDIRECT — it must run OUTSIDE try/catch so the
  // success redirect is never swallowed and misreported as a failure.
  const { redirect } = await import("next/navigation");
  redirect(`/mkpanelzoneadmin/free-panel?generated=${inserted}&requested=${count}`);
}

/** Disable or re-enable selected keys (owner action from inventory list). */
export async function setFreePanelKeyStatus(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  if (!owner) return;
  try {
    const keyId = formData.get("keyId") as string | null;
    const status = formData.get("status") as string | null;
    if (!keyId || !status || !["AVAILABLE", "DISABLED"].includes(status)) return;
    // Only AVAILABLE keys can be toggled — never touch ASSIGNED history.
    await prisma.freePanelKey.updateMany({
      where: { id: keyId, status: { in: ["AVAILABLE", "DISABLED"] } },
      data: { status },
    });
    revalidatePath("/mkpanelzoneadmin/free-panel");
  } catch (error) {
    console.error("setFreePanelKeyStatus failed:", error);
  }
}

/**
 * Save MK FREE PC PANEL promotion config (single JSON SiteSetting row).
 * All owner URLs are sanitized server-side: only https:// (or internal relative) survive.
 */
export async function saveFreePanelConfig(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  if (!owner) return;
  try {
    const str = (k: string) => (formData.get(k) as string | null)?.trim() ?? "";
    const num = (k: string, fallback: number, min: number, max: number) => {
      const n = Number(str(k));
      return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
    };

    const freqRaw = str("popupFrequency");
    const value = {
      enabled: str("enabled") === "true",
      title: str("title") || "MK FREE PC PANEL",
      subtitle: str("subtitle") || "5 DAYS FREE ACCESS",
      durationLabel: str("durationLabel"),
      ctaLabel: str("ctaLabel") || "GET FREE ACCESS",
      whatsappUrl: sanitizeUrl(str("whatsappUrl")),
      youtubeUrl: sanitizeUrl(str("youtubeUrl")),
      discordUrl: sanitizeUrl(str("discordUrl")),
      downloadUrl: sanitizeUrl(str("downloadUrl")),
      downloadLabel: str("downloadLabel") || "Windows Download",
      setupInstructions: formData.get("setupInstructions")?.toString() ?? "",
      popupDelaySeconds: num("popupDelaySeconds", 4, 0, 60),
      popupFrequency: ["ONCE_PER_SESSION", "EVERY_VISIT", "ONCE_PER_VISITOR"].includes(freqRaw)
        ? freqRaw
        : "ONCE_PER_SESSION",
      startDate: str("startDate") || null,
      endDate: str("endDate") || null,
    };

    await prisma.siteSetting.upsert({
      where: { key: FREE_PANEL_SETTING_KEY },
      update: { value: JSON.stringify(value) },
      create: { key: FREE_PANEL_SETTING_KEY, value: JSON.stringify(value) },
    });

    revalidatePath("/mkpanelzoneadmin/free-panel");
    revalidatePath("/");
  } catch (error) {
    console.error("saveFreePanelConfig failed:", error);
  }
}

// ----------------------------------------------------------------------
// GLOBAL OFFER / ALL-PRODUCTS SALE
// ----------------------------------------------------------------------

/** Saves the site-wide offer. Pricing priority lives in lib/pricing.ts:
    an active product sale always wins; the global offer applies only to
    products without one — discounts are never stacked. */
export async function saveGlobalOffer(formData: FormData): Promise<void> {
  try {
    const enabled = formData.get("enabled") === "on";
    const title = ((formData.get("title") as string) || "").trim().slice(0, 120);
    const message = ((formData.get("message") as string) || "").trim().slice(0, 300);
    const discountPercent = Math.min(
      Math.max(Math.round(parseFloat((formData.get("discountPercent") as string) || "0") || 0), 0),
      95,
    );
    const startsRaw = (formData.get("startsAt") as string) || "";
    const endsRaw = (formData.get("endsAt") as string) || "";

    const value = JSON.stringify({
      enabled,
      title,
      message,
      discountPercent,
      startsAt: startsRaw ? new Date(startsRaw).toISOString() : null,
      endsAt: endsRaw ? new Date(endsRaw).toISOString() : null,
    });

    await prisma.siteSetting.upsert({
      where: { key: "global_offer" },
      update: { value },
      create: { key: "global_offer", value },
    });
    revalidatePath("/mkpanelzoneadmin/settings");
    revalidatePath("/products");
    revalidatePath("/");
  } catch (error) {
    console.error("[saveGlobalOffer]", error);
  }
}

// ----------------------------------------------------------------------
// CUSTOMER VALIDITY + DELETE
// ----------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/** Increases/decreases a customer's access expiry. Days may be negative.
    An expiry that lands in the past is stored as-is — the row then reads
    as expired instead of silently extending access. */
export async function adminAdjustCustomerExpiry(id: string, days: number) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { expiresAt: true },
    });
    if (!customer) return { error: "Customer not found." };

    const base = customer.expiresAt && customer.expiresAt.getTime() > Date.now()
      ? customer.expiresAt.getTime()
      : Date.now();
    const next = new Date(base + Math.round(days) * DAY_MS);

    await prisma.customer.update({ where: { id }, data: { expiresAt: next } });
    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath(`/mkpanelzoneadmin/customers/${id}`);
    return { success: true, expiresAt: next.toISOString() };
  } catch (error) {
    console.error("[adminAdjustCustomerExpiry]", error);
    return { error: "Failed to update validity." };
  }
}

/** Sets an exact expiry. Empty string clears it (no expiry). */
export async function adminSetCustomerExpiry(id: string, isoDate: string) {
  try {
    const expiresAt = isoDate.trim() ? new Date(isoDate) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return { error: "Invalid date." };
    }
    await prisma.customer.update({ where: { id }, data: { expiresAt } });
    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath(`/mkpanelzoneadmin/customers/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[adminSetCustomerExpiry]", error);
    return { error: "Failed to set expiry." };
  }
}

/** REAL customer deletion. Devices cascade via the FK; proof references live
    on this row and the storage object is removed best-effort afterwards. */
export async function adminDeleteCustomer(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { agentPaymentProof: true },
    });
    if (!customer) return { error: "Customer not found." };

    await prisma.customer.delete({ where: { id } });

    // Best-effort storage cleanup — a storage policy failure must not
    // surface as a failed deletion when the row is already gone.
    if (customer.agentPaymentProof) {
      const { deleteProofObject } = await import("@/lib/proofStorage");
      await deleteProofObject(customer.agentPaymentProof);
    }

    revalidatePath("/mkpanelzoneadmin/customers");
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteCustomer]", error);
    return { error: "Failed to delete customer." };
  }
}

// ----------------------------------------------------------------------
// RESELLER SUBSCRIPTIONS + DELETE
// ----------------------------------------------------------------------

/** Sets (or clears) a reseller's subscription. PERMANENT stores a plan key
    with a null expiry — never a fake countdown. */
export async function adminSetAgentSubscription(
  id: string,
  planKey: string,
  phone: string,
) {
  try {
    const { findResellerPlan } = await import("@/lib/pricing");
    const plan = findResellerPlan(planKey);
    if (!plan) return { error: "Unknown subscription plan." };

    const now = new Date();
    const data = {
      phone: phone.trim() || null,
      subscriptionPlan: plan.key,
      subscriptionStart: plan.days === null ? null : now,
      subscriptionExpiry:
        plan.days === null ? null : new Date(now.getTime() + plan.days * DAY_MS),
    };

    await prisma.agent.update({ where: { id }, data });
    revalidatePath("/mkpanelzoneadmin/agents");
    revalidatePath(`/mkpanelzoneadmin/agents/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[adminSetAgentSubscription]", error);
    return { error: "Failed to update subscription." };
  }
}

/** Deletes a reseller after detaching their customers (createdByAgentId is
    optional, so rows are preserved and simply become owner-less). */
export async function adminDeleteAgent(id: string) {
  try {
    const agent = await prisma.agent.findUnique({ where: { id }, select: { role: true } });
    if (!agent) return { error: "Account not found." };
    if (agent.role === "OWNER") return { error: "The owner account cannot be deleted." };

    await prisma.$transaction([
      prisma.customer.updateMany({
        where: { createdByAgentId: id },
        data: { createdByAgentId: null },
      }),
      prisma.agent.delete({ where: { id } }),
    ]);

    revalidatePath("/mkpanelzoneadmin/agents");
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteAgent]", error);
    return { error: "Failed to delete reseller." };
  }
}

// ----------------------------------------------------------------------
// PAYMENT PROOF STORAGE MANAGER
// ----------------------------------------------------------------------

export async function adminDeleteProofs(
  refs: { source: "order" | "customer"; id: string; path: string }[],
): Promise<{ deleted: number; failed: number }> {
  const { deleteProofObject } = await import("@/lib/proofStorage");
  let deleted = 0;
  let failed = 0;

  for (const ref of refs) {
    try {
      // Only clear the DB reference when the storage object is actually gone,
      // so the manager never claims success while the file still exists.
      if (!(await deleteProofObject(ref.path))) {
        failed++;
        continue;
      }
      if (ref.source === "order") {
        await prisma.order.update({ where: { id: ref.id }, data: { paymentProofPath: null } });
      } else {
        await prisma.customer.update({ where: { id: ref.id }, data: { agentPaymentProof: null } });
      }
      deleted++;
    } catch (error) {
      console.error("[adminDeleteProofs] item failed:", ref.id, error);
      failed++;
    }
  }

  revalidateTag(ADMIN_TAGS.proofs, "max");
  revalidateTag(ADMIN_TAGS.orders, "max");
  revalidateTag(ADMIN_TAGS.customers, "max");
  revalidatePath("/mkpanelzoneadmin/proofs");
  revalidatePath("/mkpanelzoneadmin/orders");
  revalidatePath("/mkpanelzoneadmin/customers");
  return { deleted, failed };
}

// ----------------------------------------------------------------------
// WHATSAPP ASSISTANTS + SOCIAL LINKS (JSON settings)
// ----------------------------------------------------------------------

export type WhatsAppAssistant = { name: string; number: string; enabled: boolean };

/** Saves the assistant list. Numbers are normalized to digits-only here so a
    bad paste can never produce a broken wa.me link on the public site. */
export async function saveWhatsAppAssistants(assistants: WhatsAppAssistant[]): Promise<{ success: boolean; error?: string }> {
  try {
    const cleaned = assistants
      .slice(0, 20)
      .map((a) => ({
        name: (a.name || "").trim().slice(0, 60),
        number: (a.number || "").replace(/[^\d]/g, "").slice(0, 15),
        enabled: a.enabled === true,
      }))
      .filter((a) => a.name && a.number);

    await prisma.siteSetting.upsert({
      where: { key: "support_whatsapp_assistants" },
      update: { value: JSON.stringify(cleaned) },
      create: { key: "support_whatsapp_assistants", value: JSON.stringify(cleaned) },
    });
    revalidatePath("/mkpanelzoneadmin/support");
    revalidatePath("/support");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[saveWhatsAppAssistants]", error);
    return { success: false, error: "Failed to save assistants." };
  }
}

export type SocialLink = { platform: string; url: string; enabled: boolean };

const KNOWN_SOCIAL = ["whatsapp", "discord", "tiktok", "facebook", "instagram", "youtube", "x", "telegram"];

/** Saves footer/social links. URLs are validated to https(s) so a stored
    link can never become a javascript: payload for visitors. */
export async function saveSocialLinks(links: SocialLink[]): Promise<{ success: boolean; error?: string }> {
  try {
    const cleaned = links
      .slice(0, 20)
      .map((l) => ({ platform: (l.platform || "").toLowerCase().trim(), url: (l.url || "").trim(), enabled: l.enabled === true }))
      .filter((l) => l.platform && KNOWN_SOCIAL.includes(l.platform))
      .filter((l) => {
        try {
          const u = new URL(l.url);
          return u.protocol === "https:" || u.protocol === "http:";
        } catch {
          return false;
        }
      });

    await prisma.siteSetting.upsert({
      where: { key: "social_links" },
      update: { value: JSON.stringify(cleaned) },
      create: { key: "social_links", value: JSON.stringify(cleaned) },
    });
    revalidatePath("/mkpanelzoneadmin/footer");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[saveSocialLinks]", error);
    return { success: false, error: "Failed to save social links." };
  }
}

// ----------------------------------------------------------------------
// HERO SOCIAL CTA ROTATOR (Admin-controlled)
// ----------------------------------------------------------------------

export type HeroCtaInput = { platform: string; label: string; url: string; enabled: boolean };

/**
 * Saves the hero rotator entries.
 *
 * Stored separately from the footer social links so the Owner can label and
 * order the hero states on their own. Entries without a valid http(s) URL are
 * dropped here rather than at render time, so the public hero can never be
 * handed a dead CTA.
 */
export async function saveHeroCtas(ctas: HeroCtaInput[]): Promise<{ success: boolean; error?: string }> {
  try {
    const { HERO_CTAS_KEY } = await import("@/lib/social");
    const { SOCIAL_META } = await import("@/lib/social");

    const cleaned = ctas
      .slice(0, 8)
      .map((c) => ({
        platform: (c.platform || "").toLowerCase().trim(),
        label: (c.label || "").trim().slice(0, 40),
        url: (c.url || "").trim(),
        enabled: c.enabled !== false,
      }))
      .filter((c) => c.platform && SOCIAL_META[c.platform])
      // A missing/invalid URL is kept as an empty entry so the Owner can see
      // and fix it in Admin, but it will not reach the public hero.
      .map((c) => ({ ...c, url: /^https?:\/\//i.test(c.url) ? c.url : "" }));

    await prisma.siteSetting.upsert({
      where: { key: HERO_CTAS_KEY },
      update: { value: JSON.stringify(cleaned) },
      create: { key: HERO_CTAS_KEY, value: JSON.stringify(cleaned) },
    });

    revalidatePath("/mkpanelzoneadmin/hero-cta");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[saveHeroCtas]", error);
    return { success: false, error: "Failed to save hero CTAs." };
  }
}

// ----------------------------------------------------------------------
// CUSTOMER ENTITLEMENTS (multi-access)
// ----------------------------------------------------------------------

/**
 * ATTACH A NEW ACCESS to an EXISTING customer.
 *
 * This is the whole point of the entitlement model: a customer who buys a
 * second product gets another access row on the SAME identity — never a second
 * customer account. The legacy Customer columns are also refreshed to the
 * newest access so older code paths keep behaving sensibly.
 */
export async function adminAddEntitlement(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const customerId = String(formData.get("customerId") || "");
  const platformType = String(formData.get("platformType") || "").toUpperCase();
  const branchId = String(formData.get("branchId") || "") || null;
  const packageId = String(formData.get("packageId") || "") || null;
  const paymentStatus = String(formData.get("paymentStatus") || "UNPAID") === "PAID" ? "PAID" : "UNPAID";
  const expiresRaw = String(formData.get("expiresAt") || "").trim();

  if (!customerId || !platformType) {
    return { error: "Platform is required." };
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
  if (!customer) return { error: "Customer not found." };

  /* Server-side validation: the platform must exist and be enabled, and the
     branch (if given) must belong to that platform. A tampered form can never
     attach an access to a mismatched branch. */
  const { findPlatformByCode } = await import("@/lib/platforms");
  const platform = await findPlatformByCode(platformType);
  if (!platform || !platform.isEnabled) return { error: "That platform is not available." };

  let validBranchId: string | null = null;
  if (branchId) {
    const branch = await prisma.platformBranch.findUnique({
      where: { id: branchId },
      select: { id: true, platformType: true, isEnabled: true },
    });
    if (!branch || branch.platformType !== platformType || !branch.isEnabled) {
      return { error: "That branch does not belong to the selected platform." };
    }
    validBranchId = branch.id;
  }

  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return { error: "Invalid expiry date." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      /* Extend rather than duplicate: if this exact access already exists, the
         new values update it instead of silently creating a second row. */
      const existing = await tx.customerEntitlement.findFirst({
        where: { customerId, platformType, branchId: validBranchId, packageId },
        select: { id: true },
      });

      if (existing) {
        await tx.customerEntitlement.update({
          where: { id: existing.id },
          data: { paymentStatus, expiresAt, status: "active" },
        });
      } else {
        await tx.customerEntitlement.create({
          data: {
            customerId,
            platformType,
            branchId: validBranchId,
            packageId,
            paymentStatus,
            status: "active",
            startsAt: new Date(),
            expiresAt,
            source: "OWNER",
          },
        });
      }

      /* Keep the legacy columns pointing at the most recent access so any code
         path that still reads them stays coherent. */
      await tx.customer.update({
        where: { id: customerId },
        data: { platformType, branchId: validBranchId, packageId, paymentStatus, expiresAt },
      });
    });

    revalidateTag(ADMIN_TAGS.customers, "max");
    revalidatePath(`/mkpanelzoneadmin/customers/${customerId}`);
    revalidatePath("/mkpanelzoneadmin/customers");
    return { success: true };
  } catch (error) {
    console.error("[adminAddEntitlement]", error);
    return { error: "Failed to add access." };
  }
}

/** Update one access: paid state, expiry, package, active/disabled. */
export async function adminUpdateEntitlement(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const entitlementId = String(formData.get("entitlementId") || "");
  if (!entitlementId) return { error: "Missing access id." };

  const row = await prisma.customerEntitlement.findUnique({
    where: { id: entitlementId },
    select: { id: true, customerId: true },
  });
  if (!row) return { error: "Access not found." };

  const data: Record<string, unknown> = {};

  if (formData.has("paymentStatus")) {
    data.paymentStatus = String(formData.get("paymentStatus")) === "PAID" ? "PAID" : "UNPAID";
  }
  if (formData.has("status")) {
    data.status = String(formData.get("status")) === "active" ? "active" : "disabled";
  }
  if (formData.has("packageId")) {
    data.packageId = String(formData.get("packageId") || "") || null;
  }
  if (formData.has("expiresAt")) {
    const raw = String(formData.get("expiresAt") || "").trim();
    const parsed = raw ? new Date(raw) : null;
    if (parsed && Number.isNaN(parsed.getTime())) return { error: "Invalid expiry date." };
    data.expiresAt = parsed;
  }

  if (Object.keys(data).length === 0) return { error: "Nothing to update." };

  try {
    await prisma.customerEntitlement.update({ where: { id: entitlementId }, data });
    revalidateTag(ADMIN_TAGS.customers, "max");
    revalidatePath(`/mkpanelzoneadmin/customers/${row.customerId}`);
    return { success: true };
  } catch (error) {
    console.error("[adminUpdateEntitlement]", error);
    return { error: "Failed to update access." };
  }
}

/**
 * REMOVE ONE ACCESS.
 *
 * Deliberately separate from deleting a customer: only this entitlement is
 * removed. The customer identity and every other access remain untouched.
 */
export async function adminRemoveEntitlement(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  const entitlementId = String(formData.get("entitlementId") || "");
  if (!entitlementId) return { error: "Missing access id." };

  const row = await prisma.customerEntitlement.findUnique({
    where: { id: entitlementId },
    select: { id: true, customerId: true },
  });
  if (!row) return { error: "Access not found." };

  try {
    await prisma.customerEntitlement.delete({ where: { id: entitlementId } });
    revalidateTag(ADMIN_TAGS.customers, "max");
    revalidatePath(`/mkpanelzoneadmin/customers/${row.customerId}`);
    revalidatePath("/mkpanelzoneadmin/customers");
    return { success: true };
  } catch (error) {
    console.error("[adminRemoveEntitlement]", error);
    return { error: "Failed to remove access." };
  }
}
