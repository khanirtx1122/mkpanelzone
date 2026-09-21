import { prisma } from "./prisma";

export async function getSettings(keys: string[]) {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } }
  });

  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
}
