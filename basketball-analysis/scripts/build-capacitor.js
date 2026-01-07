#!/usr/bin/env node

/**
 * Capacitor Build Script
 * 
 * This script builds the Next.js app for Capacitor (iOS/Android)
 * It handles the static export requirements and syncs with native platforms.
 * 
 * Usage:
 *   node scripts/build-capacitor.js [ios|android|all]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.argv[2] || 'ios';

console.log('🏀 SHOTIQ AI - Capacitor Build');
console.log('================================');
console.log(`Target platform: ${platform}`);
console.log('');

// Step 1: Create temporary next.config for static export
console.log('📝 Step 1: Configuring Next.js for static export...');

const originalConfig = fs.readFileSync('next.config.js', 'utf8');

const staticExportConfig = `
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  
  // Skip API routes during static export
  // Mobile apps will call the backend API directly
  skipTrailingSlashRedirect: true,
  
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Allow build even with type errors for mobile
  },
  images: { 
    unoptimized: true,
  },
  
  // Exclude API routes from static export
  // These will be handled by the backend server
  exportPathMap: async function (defaultPathMap) {
    // Remove API routes from static export
    const filteredPaths = {};
    for (const [path, config] of Object.entries(defaultPathMap)) {
      if (!path.startsWith('/api/')) {
        filteredPaths[path] = config;
      }
    }
    return filteredPaths;
  },
};

module.exports = nextConfig;
`;

fs.writeFileSync('next.config.capacitor.js', staticExportConfig);

// Step 2: Build with static export config
console.log('🔨 Step 2: Building Next.js for static export...');

try {
  // Temporarily rename configs
  fs.renameSync('next.config.js', 'next.config.js.backup');
  fs.renameSync('next.config.capacitor.js', 'next.config.js');
  
  // Clean previous builds
  if (fs.existsSync('out')) {
    fs.rmSync('out', { recursive: true });
  }
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true });
  }
  
  // Run the build
  execSync('npx next build', { 
    stdio: 'inherit',
    env: { ...process.env, CAPACITOR_BUILD: 'true' }
  });
  
  console.log('✅ Build completed!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  // Restore original config
  if (fs.existsSync('next.config.js.backup')) {
    fs.renameSync('next.config.js.backup', 'next.config.js');
  }
  process.exit(1);
} finally {
  // Restore original config
  if (fs.existsSync('next.config.js.backup')) {
    fs.unlinkSync('next.config.js');
    fs.renameSync('next.config.js.backup', 'next.config.js');
  }
}

// Step 3: Verify output
console.log('📂 Step 3: Verifying build output...');

if (!fs.existsSync('out/index.html')) {
  console.error('❌ Build output missing index.html');
  process.exit(1);
}

console.log('✅ Build output verified!');

// Step 4: Sync with Capacitor
console.log('🔄 Step 4: Syncing with Capacitor...');

try {
  if (platform === 'all') {
    execSync('npx cap sync', { stdio: 'inherit' });
  } else {
    execSync(\`npx cap sync \${platform}\`, { stdio: 'inherit' });
  }
  console.log('✅ Capacitor sync completed!');
} catch (error) {
  console.error('❌ Capacitor sync failed:', error.message);
  process.exit(1);
}

// Step 5: Copy iOS icons if needed
if (platform === 'ios' || platform === 'all') {
  console.log('🎨 Step 5: Setting up iOS icons...');
  
  const tauriIconsDir = 'src-tauri/icons/ios';
  const capacitorIconsDir = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
  
  if (fs.existsSync(tauriIconsDir) && fs.existsSync(capacitorIconsDir)) {
    const icons = fs.readdirSync(tauriIconsDir);
    icons.forEach(icon => {
      const src = path.join(tauriIconsDir, icon);
      const dest = path.join(capacitorIconsDir, icon);
      fs.copyFileSync(src, dest);
    });
    console.log(\`✅ Copied \${icons.length} icons to iOS project\`);
  } else {
    console.log('⚠️  Icon directories not found, skipping icon copy');
  }
}

console.log('');
console.log('================================');
console.log('🎉 Capacitor build complete!');
console.log('');
console.log('Next steps:');
if (platform === 'ios' || platform === 'all') {
  console.log('  iOS: npx cap open ios');
}
if (platform === 'android' || platform === 'all') {
  console.log('  Android: npx cap open android');
}
console.log('');




