import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev indicator would leak into visual snapshots taken against dev.
  devIndicators: false,
};

export default nextConfig;
