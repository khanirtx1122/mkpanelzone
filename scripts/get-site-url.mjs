import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const prisma = new PrismaClient();
const rows = await prisma.siteSetting.findMany({ where: { key: "site_url" } });
console.log(JSON.stringify(rows));
await prisma.$disconnect();
