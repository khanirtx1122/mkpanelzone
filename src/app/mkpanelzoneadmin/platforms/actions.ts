"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/owner";
import {
  isValidPlatformCode,
  normalizePlatformCode,
  isPlatformIconKey,
  layoutForPlatform,
  CORE_PLATFORMS,
} from "@/lib/platforms";

export type PlatformActionResult = { success?: boolean; error?: string }; 

/** Every path that renders a platform list and must be refreshed on change. */
function revalidatePlatformSurfaces() {
  revalidatePath("/mkpanelzoneadmin/platforms");
  revalidatePath("/mkpanelzoneadmin/resources");
  revalidatePath("/mkpanelzoneadmin/customers");
  revalidatePath("/mkpanelzoneadmin/customers/new");
  revalidatePath("/mkpanelzoneadmin/packages");
  revalidatePath("/access");
  revalidatePath("/agent/create");
  revalidatePath("/dashboard");
}

export async function adminCreatePlatform(
  prevState: PlatformActionResult | null,
  formData: FormData
): Promise<PlatformActionResult> {
  const owner = await requireOwner();
  if (!owner) return { success: false, error: "Unauthorized" };

  const rawName = ((formData.get("name") as string) || "").trim();
  const rawCode = ((formData.get("code") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim() || null;
  const iconKey = ((formData.get("iconKey") as string) || "layers").trim();
  const isEnabled = formData.get("isEnabled") === "on";
  const sortOrderRaw = (formData.get("sortOrder") as string) || "";

  if (!rawName) return { success: false, error: "Platform name is required." };

  // The slug is optional — derive a stable code from the name when omitted.
  const code = normalizePlatformCode(rawCode || rawName.replace(/\s+/g, "-"));
  if (!isValidPlatformCode(code)) {
    return { success: false, error: "Slug may only contain letters, numbers and dashes (min 2 characters)." };
  }
  if (!isPlatformIconKey(iconKey)) {
    return { success: false, error: "Unsupported icon." };
  }

  const existing = await prisma.platform.findUnique({ where: { code } });
  if (existing) return { success: false, error: "A platform with this slug already exists." };

  let sortOrder = parseInt(sortOrderRaw, 10);
  if (!Number.isFinite(sortOrder)) {
    const max = await prisma.platform.aggregate({ _max: { sortOrder: true } });
    sortOrder = (max._max.sortOrder ?? -1) + 1;
  }

  try {
    await prisma.platform.create({
      data: { code, name: rawName, description, iconKey, isEnabled, sortOrder },
    });

    // A brand-new platform is unusable without a branch, so give it one
    // immediately. The owner can rename it later; it will never be duplicated.
    const branchSlug = "default";
    const branchExists = await prisma.platformBranch.findUnique({
      where: { platformType_slug: { platformType: code, slug: branchSlug } },
    });
    if (!branchExists) {
      await prisma.platformBranch.create({
        data: {
          platformType: code,
          name: "Default",
          slug: branchSlug,
          description: `Default ${rawName} section.`,
          isEnabled: true,
          sortOrder: 0,
        },
      });
    }

    revalidatePlatformSurfaces();
    return { success: true };
  } catch (error) {
    console.error("[adminCreatePlatform]", error);
    return { success: false, error: "Unable to create platform. Please try again." };
  }
}

export async function adminUpdatePlatform(
  prevState: PlatformActionResult | null,
  formData: FormData
): Promise<PlatformActionResult> {
  const owner = await requireOwner();
  if (!owner) return { success: false, error: "Unauthorized" };

  const id = (formData.get("platformId") as string) || "";
  if (!id) return { success: false, error: "Missing platform." };

  const platform = await prisma.platform.findUnique({ where: { id } });
  if (!platform) return { success: false, error: "Platform not found." };

  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return { success: false, error: "Platform name is required." };

  const description = ((formData.get("description") as string) || "").trim() || null;
  const iconKey = ((formData.get("iconKey") as string) || platform.iconKey).trim();
  if (!isPlatformIconKey(iconKey)) return { success: false, error: "Unsupported icon." };

  const sortOrderRaw = formData.get("sortOrder") as string | null;
  let sortOrder = platform.sortOrder;
  if (sortOrderRaw !== null && sortOrderRaw !== "") {
    const parsed = parseInt(sortOrderRaw, 10);
    if (Number.isFinite(parsed)) sortOrder = parsed;
  }

  const isEnabled = formData.has("isEnabled") ? formData.get("isEnabled") === "on" : platform.isEnabled;

  try {
    // The `code` is deliberately immutable: customers, branches, packages and
    // resources all store it. Renaming the display name is always safe.
    await prisma.platform.update({
      where: { id },
      data: { name, description, iconKey, isEnabled, sortOrder },
    });
    revalidatePlatformSurfaces();
    return { success: true };
  } catch (error) {
    console.error("[adminUpdatePlatform]", error);
    return { success: false, error: "Unable to save platform. Please try again." };
  }
}

export async function adminTogglePlatformEnabled(formData: FormData): Promise<PlatformActionResult> {
  const owner = await requireOwner();
  if (!owner) return { success: false, error: "Unauthorized" };

  const id = (formData.get("platformId") as string) || "";
  try {
    const platform = await prisma.platform.findUnique({ where: { id } });
    if (!platform) return { success: false, error: "Platform not found." };

    await prisma.platform.update({
      where: { id },
      data: { isEnabled: !platform.isEnabled },
    });
    revalidatePlatformSurfaces();
    return { success: true };
  } catch (error) {
    console.error("[adminTogglePlatformEnabled]", error);
    return { success: false, error: "Unable to update platform. Please try again." };
  }
}

/**
 * Dependency check used by the delete confirmation flow. Returns the counts
 * that make deletion unsafe so the UI can show a real warning instead of
 * silently orphaning customers, branches, packages or resources.
 */
export async function adminPlatformDependencies(platformId: string): Promise<{
  customers: number;
  branches: number;
  packages: number;
  resources: number;
}> {
  const platform = await prisma.platform.findUnique({ where: { id: platformId }, select: { code: true } });
  if (!platform) return { customers: 0, branches: 0, packages: 0, resources: 0 };

  const [customers, branches, packages, resources] = await Promise.all([
    prisma.customer.count({ where: { platformType: platform.code } }),
    prisma.platformBranch.count({ where: { platformType: platform.code } }),
    prisma.package.count({ where: { platformType: platform.code } }),
    prisma.packageResource.count({ where: { platformType: platform.code } }),
  ]);

  return { customers, branches, packages, resources };
}

/**
 * Deletes a platform ONLY when it has no dependencies at all. Anything else is
 * refused with an explicit message — the owner is directed to disable instead,
 * which preserves every customer and resource record.
 */
export async function adminDeletePlatform(formData: FormData): Promise<PlatformActionResult> {
  const owner = await requireOwner();
  if (!owner) return { success: false, error: "Unauthorized" };

  const id = (formData.get("platformId") as string) || "";
  const platform = await prisma.platform.findUnique({ where: { id } });
  if (!platform) return { success: false, error: "Platform not found." };

  const deps = await adminPlatformDependencies(id);
  const total = deps.customers + deps.branches + deps.packages + deps.resources;

  if (total > 0) {
    const parts: string[] = [];
    if (deps.customers) parts.push(`${deps.customers} customer${deps.customers === 1 ? "" : "s"}`);
    if (deps.branches) parts.push(`${deps.branches} branch${deps.branches === 1 ? "" : "es"}`);
    if (deps.packages) parts.push(`${deps.packages} package${deps.packages === 1 ? "" : "s"}`);
    if (deps.resources) parts.push(`${deps.resources} resource${deps.resources === 1 ? "" : "s"}`);

    return {
      success: false,
      error: `This platform is currently in use (${parts.join(", ")}). Disable it instead — existing customers and data stay intact.`,
    };
  }

  // Never allow removing a core platform even when empty; the site's own
  // dashboards are built around them.
  if (CORE_PLATFORMS.some((c) => c.code === platform.code)) {
    return {
      success: false,
      error: "This is a core platform and cannot be deleted. You can disable it instead.",
    };
  }

  try {
    await prisma.platform.delete({ where: { id } });
    revalidatePlatformSurfaces();
    return { success: true };
  } catch (error) {
    console.error("[adminDeletePlatform]", error);
    return { success: false, error: "Unable to delete platform. Please try again." };
  }
}

/** Exposed so the edit form can explain which layout a platform will use. */
export async function platformLayoutHint(platformId: string): Promise<string> {
  const platform = await prisma.platform.findUnique({ where: { id: platformId }, select: { code: true } });
  if (!platform) return "GENERIC";
  return layoutForPlatform(platform.code);
}
