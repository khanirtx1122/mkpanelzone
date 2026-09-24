"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/ownerAuth";
import { invalidateSetting } from "@/lib/settings";
import type { ActionState } from "@/lib/actionResult";

/**
 * Authorization gate for every action in this file (spec §49).
 *
 * This previously returned a hard-coded fake owner, which left all 14
 * privileged actions in this module callable by an anonymous request. It now
 * delegates to the shared owner-session check, which validates the httpOnly
 * `owner_session` cookie against the database (role OWNER + status ACTIVE).
 *
 * Returns null when the caller is unauthorized, which every call site already
 * handles by returning `{ error: "Unauthorized" }`.
 *
 * See `src/lib/ownerAuth.ts` for the development-only bypass rationale.
 */
async function ensureOwner() {
  return requireOwner();
}

export async function ownerLogout() {
  const { cookies } = await import("next/headers");
  const { redirect } = await import("next/navigation");
  const cookieStore = await cookies();
  cookieStore.delete("owner_session");
  // Don't redirect to an owner specific route that gives away its existence, maybe just home
  redirect("/");
}

// ----------------------------------------------------------------------
// CUSTOMERS
// ----------------------------------------------------------------------

export async function adminCreateCustomer(prevState: ActionState | null, formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { success: false, error: "Unauthorized" };

  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;
  const platformType = formData.get("platformType") as string;
  const packageId = formData.get("packageId") as string;
  const status = (formData.get("status") as string) || "active";

  if (!identifier || !password || !platformType || !packageId) {
    return { success: false, error: "All fields are required." };
  }

  const existing = await prisma.customer.findUnique({ where: { identifier } });
  if (existing) {
    return { success: false, error: "Customer ID already exists." };
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || pkg.platformType !== platformType) {
    return { success: false, error: "Invalid package for this platform." };
  }

  const argon2 = await import("argon2");
  const passwordHash = await argon2.hash(password);

  await prisma.customer.create({
    data: {
      identifier,
      passwordHash,
      platformType,
      packageId,
      status,
      createdSource: "OWNER",
    }
  });

  revalidatePath("/mkpanelzoneadmin/customers");
  return { success: true };
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
    console.error("actions.ts: unexpected failure:", error);
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
    console.error("actions.ts: unexpected failure:", error);
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
    console.error("actions.ts: unexpected failure:", error);
    return { error: "Failed to reset device." };
  }
}

export async function adminChangeCustomerPlatform(id: string, platformType: string, packageId: string) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  try {
    if (packageId) {
      const pkg = await prisma.package.findUnique({ where: { id: packageId } });
      if (!pkg || pkg.platformType !== platformType) {
        return { error: "Invalid package for this platform." };
      }
    }

    await prisma.customer.update({
      where: { id },
      data: { platformType, packageId: packageId || null }
    });
    revalidatePath("/mkpanelzoneadmin/customers");
    revalidatePath(`/mkpanelzoneadmin/customers/${id}`);
    return { success: true };
  } catch (error) {
    console.error("actions.ts: unexpected failure:", error);
    return { error: "Failed to update platform/package." };
  }
}

// ----------------------------------------------------------------------
// AGENTS
// ----------------------------------------------------------------------

export async function adminCreateAgent(prevState: ActionState | null, formData: FormData) {
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
    console.error("actions.ts: unexpected failure:", error);
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
    console.error("actions.ts: unexpected failure:", error);
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
    console.error("actions.ts: unexpected failure:", error);
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
    console.error("actions.ts: unexpected failure:", error);
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
    console.error("actions.ts: unexpected failure:", error);
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
    console.error("actions.ts: unexpected failure:", error);
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
    revalidatePath("/mkpanelzoneadmin/resources");
    return { success: true };
  } catch (error) {
    console.error("actions.ts: unexpected failure:", error);
    return { error: "Failed to toggle resource status." };
  }
}

// ----------------------------------------------------------------------
// SITE SETTINGS
// ----------------------------------------------------------------------

export async function saveSettings(prevState: ActionState | null, formData: FormData) {
  const owner = await ensureOwner();
  if (!owner) return { error: "Unauthorized" };

  /*
    THE BUG THIS FIXES.

    This action used to be declared `saveSettings(formData: FormData)` — one
    parameter. But `SettingsFormShell` binds it with
    `useActionState(saveSettings, null)`, and `useActionState` always invokes the
    action as `action(previousState, formData)`. So `formData` received `null`,
    `formData.keys()` threw, the `catch` below swallowed it, and every settings
    save returned "Failed to save settings."

    Because this is the only writer of `SiteSetting` anywhere in the codebase, no
    setting had ever been persisted — site name, SEO, footer copy, support links,
    maintenance mode, and device-binding enforcement were all unsaveable.

    The `prevState` parameter is now declared so the argument order matches, and
    the runtime guard below means a future mismatch fails loudly instead of
    looking like a database error.
  */
  if (!(formData instanceof FormData)) {
    console.error("[saveSettings] expected FormData but received", typeof formData);
    return { error: "The form could not be read. Please reload and try again." };
  }

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

      /*
        Settings that affect request handling are memoised for 10 seconds
        (see src/lib/settings.ts). Dropping the entry here makes a toggle take
        effect on the next request rather than up to 10 seconds later — which
        matters for maintenance mode and device-binding enforcement, where the
        owner is watching for the change.
      */
      invalidateSetting(settingKey);
    }

    const redirectUrl = formData.get("redirectUrl") as string;
    if (redirectUrl) {
      revalidatePath(redirectUrl);
    }
    
    return { success: true };
  } catch (error) {
    console.error("actions.ts: unexpected failure:", error);
    return { error: "Failed to save settings." };
  }
}
