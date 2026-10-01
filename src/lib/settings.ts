import { cache } from "react";
import { prisma } from "./prisma";

/**
 * Site settings reader.
 *
 * Wrapped in React's `cache()` so multiple components rendering in the same
 * request share one database round-trip instead of each issuing their own
 * `findMany`. Admin layout + page, or several sections of the same page, now
 * resolve settings exactly once per request.
 *
 * The cache is per-request only — mutations stay immediately visible because
 * every settings write already calls `revalidatePath`.
 */
export const getSettings = cache(async function getSettings(keys: string[]) {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } }
  });

  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
});
