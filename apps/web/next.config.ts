import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le package partagé est livré en TypeScript : Next doit le compiler.
  transpilePackages: ["@vigor/shared"],
};

export default nextConfig;
