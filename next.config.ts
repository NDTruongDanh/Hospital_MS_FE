import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Optimized for Docker - creates minimal production build
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

export default nextConfig;
