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
  
  // Server configuration for development
  server: {
    // For development, you can point to the dev server
    // Uncomment the line below during development:
    // url: 'http://localhost:3000',
    // cleartext: true,
    
    // Allow navigation to external URLs (for API calls)
    allowNavigation: [
      'api.shotiqai.com',
      '*.shotiqai.com',
      'localhost:*',
    ],
  },
  
  // Plugins configuration
  plugins: {
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
