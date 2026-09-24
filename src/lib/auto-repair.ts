import { prisma } from "@/lib/prisma";

export async function ensureDefaultPackages() {
  const platforms = ["ANDROID", "IOS", "PC"];

  for (const platform of platforms) {
    const existing = await prisma.package.findFirst({
      where: { platformType: platform, isDefaultForAgents: true }
    });

    if (!existing) {
      await prisma.package.create({
        data: {
          name: `Default ${platform} Package`,
          description: `Auto-generated default package for ${platform} platform.`,
          platformType: platform,
          isDefaultForAgents: true
        }
      });
    }
  }
}
