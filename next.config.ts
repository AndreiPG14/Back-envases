import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jsonwebtoken'],
  },
};

export default nextConfig;
