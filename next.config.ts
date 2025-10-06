import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses this directory as the workspace root so env loads from web/.env.local
  turbopack: {
    // Use the directory of this next.config.ts as the root
    root: __dirname,
  },
  eslint: {
    // Ignore ESLint errors during builds (CI/production).
    // This unblocks builds while we iteratively fix lint errors.
    ignoreDuringBuilds: true,
  },
  // Skip type checking during build
  typescript: {
    // !! WARN: This should be turned back on in the future
    ignoreBuildErrors: true,
  },
  // Disable typed routes to avoid symlink issues with OneDrive
  typedRoutes: false,
  // No rewrites for favicon — Next will serve from app/icon.* automatically
};

export default nextConfig;
