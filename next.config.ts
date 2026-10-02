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
};

export default nextConfig;
