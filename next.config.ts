import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config for Next.js 16+
  turbopack: {
    // Empty config to silence warning - Turbopack handles Node.js modules automatically
  },
  
  // Webpack config (fallback for when --webpack flag is used)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },
};

export default nextConfig;
