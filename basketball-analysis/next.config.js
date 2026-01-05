/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  
  // Enable static export for Tauri and Capacitor builds
  // Set TAURI_BUILD=true or CAPACITOR_BUILD=true to enable static export
  output: (process.env.TAURI_BUILD === 'true' || process.env.CAPACITOR_BUILD === 'true') ? 'export' : process.env.NEXT_OUTPUT_MODE,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { 
    // Use unoptimized images for static exports (Tauri/Capacitor)
    unoptimized: (process.env.TAURI_BUILD === 'true' || process.env.CAPACITOR_BUILD === 'true') ? true : true,
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
};

module.exports = nextConfig;
