import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shotiqai.app',
  appName: 'SHOTIQ AI',
  webDir: 'out',
  
  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a1a1a',
    preferredContentMode: 'mobile',
    // Use existing Tauri icons for iOS
    // Icons are copied from src-tauri/icons/ios/ during build
  },
  
  // Server configuration.
  // The app is server-backed (auth/DB/API), so the native iOS shell loads the
  // live web app directly; on-device MoveNet analysis runs inside the webview.
  // For local dev, override url with http://localhost:3000 + cleartext: true.
  server: {
    url: 'https://shotiq.194-146-12-139.sslip.io',

    // Allow navigation to the live host + external API/CDN calls.
    allowNavigation: [
      'shotiq.194-146-12-139.sslip.io',
      '*.sslip.io',
      'api.shotiqai.com',
      '*.shotiqai.com',
      'localhost:*',
    ],
  },
  
  // Plugins configuration
  plugins: {
    ShotIQVision: {
      minimumConfidence: 0.2,
    },

    // Camera plugin configuration
    Camera: {
      // iOS camera permissions
      iosCameraUsageDescription: 'SHOTIQ AI needs camera access to record your basketball shooting form for analysis.',
      iosPhotoLibraryUsageDescription: 'SHOTIQ AI needs photo library access to select images and videos for analysis.',
    },
    
    // Filesystem plugin configuration  
    Filesystem: {
      // iOS document storage
      iosDocumentsDirectory: 'Documents',
    },
    
    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a1a',
      showSpinner: true,
      spinnerColor: '#FF6B35',
      splashFullScreen: true,
      splashImmersive: true,
    },
    
    // Status bar configuration
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#1a1a1a',
    },
    
    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
  
  // Logging configuration
  loggingBehavior: 'debug',
};

export default config;
