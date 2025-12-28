/**
 * Platform Storage - Main Entry Point
 * Auto-detects platform and exports the appropriate storage implementation
 */

import { getPlatform } from '@/utils/platform'
import type { PlatformStorage } from './types'

export * from './types'

/**
 * Get the platform-specific storage implementation
 * This function is async because some platforms need to load modules dynamically
 */
export async function getStorage(): Promise<PlatformStorage> {
  const platform = getPlatform()
  
  switch (platform) {
    case 'web': {
      const { webStorage } = await import('./web')
      return webStorage
    }
    
    case 'desktop': {
      const { desktopStorage } = await import('./desktop')
      return desktopStorage
    }
    
    case 'ios':
    case 'android': {
      const { mobileStorage } = await import('./mobile')
      return mobileStorage
    }
    
    default: {
      // Fallback to web storage
      const { webStorage } = await import('./web')
      return webStorage
    }
  }
}

/**
 * Singleton storage instance
 * Initialized lazily on first access
 */
let storageInstance: PlatformStorage | null = null

/**
 * Get the singleton storage instance
 * Use this for most operations to avoid re-initializing
 */
export async function storage(): Promise<PlatformStorage> {
  if (!storageInstance) {
    storageInstance = await getStorage()
  }
  return storageInstance
}

/**
 * Helper functions for common storage operations
 * These wrap the platform storage with JSON serialization/deserialization
 */

/**
 * Get and parse JSON from storage
 */
export async function getJSON<T>(key: string, defaultValue?: T): Promise<T | null> {
  try {
    const store = await storage()
    const value = await store.getItem(key)
    
    if (value === null) {
      return defaultValue ?? null
    }
    
    return JSON.parse(value) as T
  } catch (error) {
    console.error(`Failed to get JSON for key: ${key}`, error)
    return defaultValue ?? null
  }
}

/**
 * Stringify and set JSON in storage
 */
export async function setJSON<T>(key: string, value: T): Promise<boolean> {
  try {
    const store = await storage()
    const jsonString = JSON.stringify(value)
    await store.setItem(key, jsonString)
    return true
  } catch (error) {
    console.error(`Failed to set JSON for key: ${key}`, error)
    return false
  }
}

/**
 * Remove item from storage
 */
export async function remove(key: string): Promise<boolean> {
  try {
    const store = await storage()
    await store.removeItem(key)
    return true
  } catch (error) {
    console.error(`Failed to remove key: ${key}`, error)
    return false
  }
}

/**
 * Clear all storage
 */
export async function clearAll(): Promise<boolean> {
  try {
    const store = await storage()
    await store.clear()
    return true
  } catch (error) {
    console.error('Failed to clear storage', error)
    return false
  }
}

/**
 * Get all keys
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    const store = await storage()
    return await store.getAllKeys()
  } catch (error) {
    console.error('Failed to get all keys', error)
    return []
  }
}

/**
 * Get storage info
 */
export async function getStorageInfo() {
  try {
    const store = await storage()
    return await store.getStorageInfo()
  } catch (error) {
    console.error('Failed to get storage info', error)
    return {
      bytesUsed: 0,
      bytesAvailable: null,
      itemCount: 0,
      type: 'localStorage' as const,
    }
  }
}

/**
 * Check if a key exists
 */
export async function hasKey(key: string): Promise<boolean> {
  try {
    const store = await storage()
    const value = await store.getItem(key)
    return value !== null
  } catch (error) {
    console.error(`Failed to check key: ${key}`, error)
    return false
  }
}

/**
 * Get multiple JSON values at once
 */
export async function getMultipleJSON<T>(keys: string[]): Promise<Record<string, T | null>> {
  try {
    const store = await storage()
    const pairs = await store.multiGet(keys)
    
    const result: Record<string, T | null> = {}
    
    for (const [key, value] of pairs) {
      if (value !== null) {
        try {
          result[key] = JSON.parse(value) as T
        } catch {
          result[key] = null
        }
      } else {
        result[key] = null
      }
    }
    
    return result
  } catch (error) {
    console.error('Failed to get multiple JSON values', error)
    return {}
  }
}

/**
 * Set multiple JSON values at once
 */
export async function setMultipleJSON<T>(items: Record<string, T>): Promise<boolean> {
  try {
    const store = await storage()
    const pairs: Array<[string, string]> = []
    
    for (const [key, value] of Object.entries(items)) {
      pairs.push([key, JSON.stringify(value)])
    }
    
    await store.multiSet(pairs)
    return true
  } catch (error) {
    console.error('Failed to set multiple JSON values', error)
    return false
  }
}
