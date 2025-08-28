import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 無料プラン向け最適化
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  // バンドルサイズの削減
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

export default nextConfig;
