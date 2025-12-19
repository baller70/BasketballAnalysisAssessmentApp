/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.nba.com",
      },
    ],
  },

  // Generate unique build ID for each deployment to bust cache
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  // Cache control headers to prevent stale content
  headers: async () => [
    {
      // Apply to all routes
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
        {
          key: 'Pragma',
          value: 'no-cache',
        },
        {
          key: 'Expires',
          value: '0',
        },
        {
          key: 'Surrogate-Control',
          value: 'no-store',
        },
      ],
    },
    {
      // Specifically target HTML pages
      source: '/',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate',
        },
      ],
    },
    {
      // API routes should never be cached
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate',
        },
      ],
    },
  ],

  // Disable powered by header for security
  poweredByHeader: false,
};

export default nextConfig;
