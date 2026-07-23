#!/usr/bin/env node

/**
 * Capacitor Build Script
 * 
 * ShotIQ's native shell is server-backed, so the normal path creates the small
 * local shell required by Capacitor and syncs native projects. Set
 * CAPACITOR_STATIC_BUILD=true only when the Next app is made fully exportable.
 * 
 * Usage:
 *   node scripts/build-capacitor.js [ios|android|all]
 */

const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getCapacitorBuildMode } = require('./capacitor-build-mode');

const platform = process.argv[2] || 'ios';
const buildMode = getCapacitorBuildMode();

console.log('🏀 SHOTIQ AI - Capacitor Build');
console.log('================================');
console.log(`Target platform: ${platform}`);
console.log(`Build mode: ${buildMode}`);
console.log('');

console.log('📦 Step 1: Preparing Capacitor web assets...');

if (fs.existsSync('out')) {
  fs.rmSync('out', { recursive: true });
}

if (buildMode === 'static-export') {
  console.log('🔨 Explicit static export requested...');
  try {
    execSync('npx next build', {
      stdio: 'inherit',
      env: { ...process.env, CAPACITOR_BUILD: 'true' },
    });
  } catch (error) {
    console.error('❌ Static export failed:', error.message);
    process.exit(1);
  }
} else {
  // capacitor.config.ts points the native webview at ShotIQ's production URL.
  // Capacitor still requires webDir to exist during sync, so provide a small,
  // branded local document without attempting to export server/API routes.
  fs.mkdirSync('out', { recursive: true });
  fs.writeFileSync('out/index.html', `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ShotIQ</title></head>
<body style="margin:0;background:#101010;color:white;font-family:system-ui;display:grid;min-height:100vh;place-items:center">
  <main style="text-align:center"><h1>SHOTIQ</h1><p>Connect to the internet to load your training.</p></main>
</body>
</html>`);
}

console.log('📂 Step 2: Verifying Capacitor web assets...');

if (!fs.existsSync('out/index.html')) {
  console.error('❌ Build output missing index.html');
  process.exit(1);
}

console.log('✅ Capacitor web assets verified!');

// Step 3: Sync with Capacitor
console.log('🔄 Step 3: Syncing with Capacitor...');

try {
  const capacitorCli = path.resolve('node_modules/@capacitor/cli/bin/capacitor');
  const args = platform === 'all' ? ['sync'] : ['sync', platform];
  if (!fs.existsSync(capacitorCli)) {
    throw new Error('Local Capacitor CLI is missing. Run npm install first.');
  }
  // Use the current Node process explicitly. This avoids `npx` selecting a
  // different system Node version than the Node 22 handoff process.
  execFileSync(process.execPath, [capacitorCli, ...args], { stdio: 'inherit' });
  console.log('✅ Capacitor sync completed!');
} catch (error) {
  console.error('❌ Capacitor sync failed:', error.message);
  process.exit(1);
}

// Step 4: Copy iOS icons if needed
if (platform === 'ios' || platform === 'all') {
  console.log('🎨 Step 4: Setting up iOS icons...');
  
  const tauriIconsDir = 'src-tauri/icons/ios';
  const capacitorIconsDir = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
  
  if (fs.existsSync(tauriIconsDir) && fs.existsSync(capacitorIconsDir)) {
    const icons = fs.readdirSync(tauriIconsDir);
    icons.forEach(icon => {
      const src = path.join(tauriIconsDir, icon);
      const dest = path.join(capacitorIconsDir, icon);
      fs.copyFileSync(src, dest);
    });
    console.log(`✅ Copied ${icons.length} icons to iOS project`);
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




