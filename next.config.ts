import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",
  
  // Disable image optimization if using external image service
  // images: {
  //   unoptimized: true,
  // },
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
  },

  // Recommended: Enable strict mode for React
  reactStrictMode: true,
};

export default nextConfig;
