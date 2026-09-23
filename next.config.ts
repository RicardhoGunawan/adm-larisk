import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 1-klik: tidak perlu config khusus, Next 16 + Turbopack auto-optimized
  // Pastikan env NEXT_PUBLIC_API_URL di-set di Vercel Dashboard
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
