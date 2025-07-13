import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // ✅ disables lint blocking on build
  },
  // other config options...
}

export default nextConfig
