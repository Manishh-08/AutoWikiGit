import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack native CSS handling in Next.js 16+
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
