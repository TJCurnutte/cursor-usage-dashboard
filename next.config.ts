import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cursor-usage/core"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
