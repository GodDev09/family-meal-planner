import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  // better-sqlite3 is a native Node.js addon — must not be bundled by webpack
  webpack(config, { isServer }) {
    if (isServer) {
      // Tell webpack to leave better-sqlite3 as an external (loaded at runtime by Node)
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        "better-sqlite3",
      ];
    }
    return config;
  },
};

export default nextConfig;
