/**
 * Platform Detection and Utilities
 * Detects the current platform (web, desktop, iOS, Android) and provides platform-specific utilities
 */

export type Platform = 'web' | 'desktop' | 'ios' | 'android'
export type PlatformOS = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'browser'

/**
 * Detect the current platform
 */
export function getPlatform(): Platform {
  // Check if running in Tauri (desktop)
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return 'desktop'
  }
  
  // Check if running in Capacitor (mobile)
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    const Capacitor = (window as unknown as { Capacitor: { getPlatform: () => string } }).Capacitor
    const platform = Capacitor.getPlatform()
    
    if (platform === 'ios') return 'ios'
    if (platform === 'android') return 'android'
  }
  
  // Default to web
  return 'web'
}

/**
 * Get the specific operating system
 */
export function getPlatformOS(): PlatformOS {
  if (typeof window === 'undefined') return 'browser'
  
  const platform = getPlatform()
  
  if (platform === 'ios') return 'ios'
  if (platform === 'android') return 'android'

  // Browser visits do not have Capacitor's native platform marker. Detect the
  // device OS separately so iPhone/iPad Safari can receive web-specific media
  // handling without being mistaken for a native mobile app.
  const userAgent = navigator.userAgent.toLowerCase()
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iphone|ipad|ipod/.test(userAgent) || isIPadOS) return 'ios'
  if (userAgent.includes('android')) return 'android'
  
  if (platform === 'desktop' && '__TAURI__' in window) {
    if (userAgent.includes('mac')) return 'macos'
    if (userAgent.includes('win')) return 'windows'
    if (userAgent.includes('linux')) return 'linux'
  }
  
  return 'browser'
}

/**
 * Check if running on web platform
 */
export function isWeb(): boolean {
  return getPlatform() === 'web'
}

/**
 * Check if running on desktop platform
 */
export function isDesktop(): boolean {
  return getPlatform() === 'desktop'
}

/**
 * Check if running on mobile platform
 */
export function isMobile(): boolean {
  const platform = getPlatform()
  return platform === 'ios' || platform === 'android'
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios'
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android'
}

/**
 * Check if the device has touch capability
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints! > 0
  )
}

/**
 * Get platform-specific configuration
 */
export function getPlatformConfig() {
  const platform = getPlatform()
  
  return {
    platform,
    os: getPlatformOS(),
    isMobile: isMobile(),
    isDesktop: isDesktop(),
    isWeb: isWeb(),
    isTouch: isTouchDevice(),
    
    // Feature flags
    features: {
      hasFileSystem: platform === 'desktop' || isMobile(),
      hasNativeCamera: isMobile(),
      hasNativeNotifications: platform === 'desktop' || isMobile(),
      hasOfflineStorage: true, // All platforms support offline storage
      hasClipboard: true,
      hasPushNotifications: isMobile(),
      hasSystemTheme: platform === 'desktop' || isMobile(),
    },
    
    // UI preferences
    ui: {
      showNativeTitleBar: platform === 'desktop',
      useBottomNavigation: isMobile(),
      useSidebarNavigation: platform === 'web' || platform === 'desktop',
      minTouchTargetSize: isMobile() ? 44 : 32, // iOS: 44px, Android: 48px, Desktop: 32px
    },
  }
}

/**
 * Get platform-specific API base URL
 */
export function getAPIBaseURL(): string {
  const platform = getPlatform()
  
  // For web, use relative URLs (Next.js API routes or external API)
  if (platform === 'web') {
    return process.env.NEXT_PUBLIC_API_URL || '/api'
  }
  
  // For desktop and mobile, use absolute API URL
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.shotiq.ai'
}

/**
 * Get platform-specific storage limits
 */
export function getStorageLimits() {
  const platform = getPlatform()
  
  return {
    // localStorage limits (approximate)
    localStorage: platform === 'web' ? 5 * 1024 * 1024 : Infinity, // 5MB for web, unlimited for native
    
    // File storage limits
    fileStorage: platform === 'web' ? 50 * 1024 * 1024 : Infinity, // 50MB for web, unlimited for native
    
    // Session limits
    maxSessions: platform === 'web' ? 20 : 100, // Fewer sessions on web due to storage limits
  }
}

/**
 * Platform-specific error handling
 */
export function handlePlatformError(error: Error, context: string): void {
  const platform = getPlatform()
  
  console.error(`[${platform}] Error in ${context}:`, error)
  
  // Platform-specific error reporting
  if (platform === 'web') {
    // Web: Could send to analytics service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      })
    }
  } else if (platform === 'desktop') {
    // Desktop: Could use Tauri's logging
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      const { error: tauriError } = (window as unknown as { __TAURI__: { log: { error: (msg: string) => void } } }).__TAURI__.log
      tauriError(`${context}: ${error.message}`)
    }
  } else if (isMobile()) {
    // Mobile: Could use native crash reporting
    console.error(`Mobile error in ${context}:`, error)
  }
}

/**
 * Get platform-specific user agent
 */
export function getPlatformUserAgent(): string {
  const platform = getPlatform()
  const os = getPlatformOS()
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  
  return `ShotiqAI/${version} (${platform}; ${os})`
}

/**
 * Check if feature is supported on current platform
 */
export function isFeatureSupported(feature: string): boolean {
  const config = getPlatformConfig()
  
  const featureMap: Record<string, boolean> = {
    filesystem: config.features.hasFileSystem,
    camera: config.features.hasNativeCamera,
    notifications: config.features.hasNativeNotifications,
    offline: config.features.hasOfflineStorage,
    clipboard: config.features.hasClipboard,
    push: config.features.hasPushNotifications,
    theme: config.features.hasSystemTheme,
  }
  
  return featureMap[feature] ?? false
}

/**
 * Get platform-specific paths
 */
export function getPlatformPaths() {
  const platform = getPlatform()
  
  return {
    // Data storage paths
    data: platform === 'web' ? 'localStorage' : platform === 'desktop' ? 'app-data' : 'documents',
    
    // Cache paths
    cache: platform === 'web' ? 'indexedDB' : platform === 'desktop' ? 'app-cache' : 'cache',
    
    // Temp paths
    temp: platform === 'web' ? 'memory' : platform === 'desktop' ? 'temp' : 'tmp',
  }
}
