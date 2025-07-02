import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://d1t76x8dt2bju7.cloudfront.net/**')],
  },
};

export default nextConfig;
