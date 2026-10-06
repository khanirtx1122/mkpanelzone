import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Product artwork is uploaded to Supabase Storage at full resolution
       (2–3 MB each). The built-in optimizer resizes them to ~300 KB, but its
       default cache lifetime is only 60 seconds — far too short for assets
       that change a few times a year. A long TTL means the expensive
       download-and-resize happens once instead of repeatedly. */
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },

  /**
   * Bounded revalidation window for the public homepage.
   *
   * The homepage is ISR-cached (`revalidate = 60`), but Next's default
   * `stale-while-revalidate` is effectively unbounded (~1 year). That meant a
   * stale copy could keep being served long after the Owner changed something
   * visible — e.g. the hero social CTA — making saved settings look like they
   * had no effect. Admin saves still purge the entry immediately via
   * revalidatePath("/"); this window is the safety net that guarantees the
   * homepage self-heals within about a minute even if an invalidation is ever
   * missed.
   */
  async headers() {
    return [
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=60" },
        ],
      },
    ];
  },
};

export default nextConfig;
