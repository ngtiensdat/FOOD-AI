import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "cafefcdn.com" },
    ],
  },
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  // @ts-expect-error - Bỏ qua lỗi type do version Next.js hiện tại không export đầy đủ type này
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
