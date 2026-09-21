"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";

async function ensureOwner() {
  // Bypass session check as requested by the user
  return { role: "OWNER", username: "Owner" };
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

export async function adminCreateCustomer(prevState: any, formData: FormData) {
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

    const redirectUrl = formData.get("redirectUrl") as string;
    if (redirectUrl) {
      revalidatePath(redirectUrl);
    }
    
    return { success: true };
  } catch (error) {
    return { error: "Failed to save settings." };
  }
}
