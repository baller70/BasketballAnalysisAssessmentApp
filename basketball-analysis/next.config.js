/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Enable static export for Tauri and Capacitor builds.
  // Set TAURI_BUILD=true or CAPACITOR_BUILD=true to enable static export.
  output: (process.env.TAURI_BUILD === 'true' || process.env.CAPACITOR_BUILD === 'true') ? 'export' : process.env.NEXT_OUTPUT_MODE,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Disable the X-Powered-By header for security.
  poweredByHeader: false,

  // Generate a unique build ID per deployment to bust stale caches.
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  images: {
    // Use unoptimized images for static exports (Tauri/Capacitor).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.nba.com",
      },
      {
        protocol: "https",
        hostname: "*.shotiqai.com",
      },
    ],
  },

  // Cache-control headers to prevent stale content (mirrors vercel.json so the
  // same behavior applies on non-Vercel hosts). Custom headers are skipped for
  // static-export builds, so this is a no-op for Tauri/Capacitor.
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
      ],
    },
    {
      source: '/',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
      ],
    },
  ],
};

module.exports = nextConfig;
