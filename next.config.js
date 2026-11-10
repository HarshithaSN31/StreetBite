/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Tell webpack to treat better-sqlite3 as an external (server-only native module)
  // This prevents Next.js from trying to bundle it for the browser or edge runtime
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep better-sqlite3 as external so it uses the native .node binary
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
  // Required for better-sqlite3 native binaries on Vercel
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
