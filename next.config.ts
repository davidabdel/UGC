import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses this directory as the workspace root so env loads from web/.env.local
  turbopack: {
    // Use the directory of this next.config.ts as the root
    root: __dirname,
  },
};

export default nextConfig;
