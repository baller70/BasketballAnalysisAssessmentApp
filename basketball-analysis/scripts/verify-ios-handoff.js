#!/usr/bin/env node

/**
 * Pre-Xcode handoff gate.
 *
 * This intentionally does not invoke Xcode: its job is to prove that the
 * generated Capacitor project is complete and internally consistent before it
 * is handed to the Mac/Xcode phase.
 */

const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const failures = []

function check(condition, message) {
  if (condition) console.log(`✅ ${message}`)
  else failures.push(message)
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath)
  check(fs.existsSync(absolutePath), `${relativePath} exists`)
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : ''
}

const nodeMajor = Number(process.versions.node.split('.')[0])
check(nodeMajor >= 22, `Node ${process.versions.node} satisfies Capacitor 8 (>=22)`)

const project = read('ios/App/App.xcodeproj/project.pbxproj')
const plist = read('ios/App/App/Info.plist')
const appDelegate = read('ios/App/App/AppDelegate.swift')
const mainStoryboard = read('ios/App/App/Base.lproj/Main.storyboard')
const bridge = read('ios/App/App/ShotIQBridgeViewController.swift')
const visionPlugin = read('ios/App/App/ShotIQVisionPlugin.swift')
const geometry = read('ios/App/App/ShotIQVisionGeometry.swift')
const swiftPackage = read('ios/App/CapApp-SPM/Package.swift')
const webEntry = read('ios/App/App/public/index.html')
const generatedConfigPath = path.join(root, 'ios/App/App/capacitor.config.json')
const generatedConfigText = read('ios/App/App/capacitor.config.json')

let config = null
try {
  config = JSON.parse(generatedConfigText)
} catch {
  failures.push('ios/App/App/capacitor.config.json is valid JSON')
}

check(project.includes('PRODUCT_BUNDLE_IDENTIFIER = com.shotiqai.app;'), 'bundle identifier is com.shotiqai.app')
check(project.includes('IPHONEOS_DEPLOYMENT_TARGET = 15.0;'), 'deployment target is iOS 15.0')
check(project.includes('CODE_SIGN_STYLE = Automatic;'), 'automatic signing is configured')
check(project.includes('MARKETING_VERSION = 1.0;'), 'marketing version is configured')
check(project.includes('CURRENT_PROJECT_VERSION = 1;'), 'build version is configured')

for (const permission of [
  'NSCameraUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'NSMicrophoneUsageDescription',
]) {
  check(plist.includes(`<key>${permission}</key>`), `${permission} is declared`)
}
check(plist.includes('<key>NSAllowsArbitraryLoads</key>\n\t\t<false/>'), 'arbitrary network loads are disabled')

check(appDelegate.includes('ApplicationDelegateProxy.shared'), 'AppDelegate forwards Capacitor URL lifecycle events')
check(mainStoryboard.includes('customClass="ShotIQBridgeViewController"'), 'main storyboard launches the custom Capacitor bridge')
check(bridge.includes('registerPluginInstance(ShotIQVisionPlugin())'), 'ShotIQVision native plugin is registered')
check(visionPlugin.includes('VNDetectHumanBodyPoseRequest'), 'Apple Vision pose implementation is present')
check(geometry.includes('ShotIQVisionGeometry'), 'native pose geometry implementation is present')

const requiredPlugins = [
  'CapacitorCamera',
  'CapacitorFilesystem',
  'CapacitorHaptics',
  'CapacitorKeyboard',
  'CapacitorPreferences',
  'CapacitorShare',
  'CapacitorSplashScreen',
  'CapacitorStatusBar',
]
for (const plugin of requiredPlugins) {
  check(swiftPackage.includes(plugin), `${plugin} is included in Swift Package Manager`)
}

check(config?.appId === 'com.shotiqai.app', 'generated Capacitor app id matches Xcode')
check(config?.server?.url === 'https://shotiq.194-146-12-139.sslip.io', 'generated native shell points to the approved HTTPS app URL')
check(config?.loggingBehavior === 'none', 'generated production bridge logging is disabled')
check(Array.isArray(config?.packageClassList) && config.packageClassList.length === 8, 'all eight Capacitor plugin classes are generated')
check(webEntry.includes('Connect to the internet to load your training.'), 'offline bootstrap page is bundled')

if (failures.length > 0) {
  console.error('\n❌ iOS handoff is not ready:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(`\n✅ iOS PRE-XCODE HANDOFF READY: ${generatedConfigPath}`)
