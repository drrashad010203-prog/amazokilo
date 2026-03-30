import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.nooncdn.com",
      },
      {
        protocol: "https",
        hostname: "**.noon.com",
      },
    ],
  },
};

export default nextConfig;
