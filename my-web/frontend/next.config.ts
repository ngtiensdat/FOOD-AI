import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "cafefcdn.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  // Thêm phần này để chuyển tiếp request /api sang Backend thực tế
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
// Rebuild trigger with non-sensitive NEXT_PUBLIC_API_URL


