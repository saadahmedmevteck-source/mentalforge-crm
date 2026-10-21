import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite loads its WASM and data files from node_modules at runtime, so it can't be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
