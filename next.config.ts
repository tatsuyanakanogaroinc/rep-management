import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // デバッグ用設定
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  // 無料プラン向け最適化
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  // バンドルサイズの削減
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    // 本番環境でもソースマップを有効化
    if (process.env.NODE_ENV === 'development') {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
};

export default nextConfig;
