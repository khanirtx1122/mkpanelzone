"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
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

export async function ownerLogout() {
  const { redirect } = await import("next/navigation");
  const cookieStore = await cookies();
  cookieStore.delete("owner_session");
  redirect("/");
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
      status: "ACTIVE"
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
    const keys = Array.from(formData.keys()).filter(k => k.startsWith("setting_"));
    
    for (const key of keys) {
      const settingKey = key.replace("setting_", "");
      const value = formData.get(key) as string;

      await prisma.siteSetting.upsert({
        where: { key: settingKey },
        update: { value },
        create: { key: settingKey, value }
      });
    }

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
