import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // next.config.js
  images: {
    remotePatterns: [
      {
        protocol: 'https', // or 'http'
        hostname: '**', // Allows any hostname
        port: '', // Leave empty for any port, or specify a port
        pathname: '/**', // Allows any path
      },
      // You can add more specific patterns here for other domains
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      //   pathname: '/account123/**',
      // },
    ],
  },

};

export default nextConfig;
