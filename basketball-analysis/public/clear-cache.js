// Clear all caches on page load to ensure fresh content
(function() {
  'use strict';
  
  // Clear service worker caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
        console.log('[Cache Buster] Deleted cache:', name);
      }
    });
  }

  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister();
        console.log('[Cache Buster] Unregistered service worker');
      }
    });
  }

  // Clear localStorage version check
  const BUILD_VERSION = document.querySelector('meta[name="version"]')?.content || 'unknown';
  const STORED_VERSION = localStorage.getItem('app_version');
  
  if (STORED_VERSION !== BUILD_VERSION) {
    console.log('[Cache Buster] New version detected:', BUILD_VERSION);
    localStorage.setItem('app_version', BUILD_VERSION);
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Force reload if this isn't the first load
    if (STORED_VERSION && STORED_VERSION !== BUILD_VERSION) {
      console.log('[Cache Buster] Forcing reload for new version');
      // Only reload once per version change
      if (!sessionStorage.getItem('reloaded_for_version')) {
        sessionStorage.setItem('reloaded_for_version', 'true');
        window.location.reload(true);
      }
    }
  }
})();

