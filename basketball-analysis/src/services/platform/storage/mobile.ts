/**
 * Mobile Platform Storage Implementation
 * Uses Capacitor Storage for iOS and Android
 */

import type { PlatformStorage, StorageInfo } from './types'
import { StorageError, StorageErrorCode } from './types'

class MobileStorage implements PlatformStorage {
  private storage: any = null
  
  private async getStorage() {
    if (this.storage) return this.storage
    
    try {
      // Dynamically import Capacitor Storage
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        try {
          // @ts-ignore - Capacitor may not be installed for desktop builds
          const { Storage } = await import('@capacitor/storage')
          this.storage = Storage
          return this.storage
        } catch (error) {
          // Capacitor not installed - this is fine for desktop/web builds
          throw new Error('Capacitor Storage not available')
        }
      }
      
      throw new Error('Capacitor is not available')
    } catch (error) {
      throw new StorageError(
        'Failed to initialize Capacitor Storage',
        StorageErrorCode.PERMISSION_DENIED,
        error as Error
      )
    }
  }
  
  async getItem(key: string): Promise<string | null> {
    try {
      const storage = await this.getStorage()
      const { value } = await storage.get({ key })
      return value
    } catch (error) {
      throw new StorageError(
        `Failed to get item: ${key}`,
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      const storage = await this.getStorage()
      await storage.set({ key, value })
    } catch (error) {
      throw new StorageError(
        `Failed to set item: ${key}`,
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async removeItem(key: string): Promise<void> {
    try {
      const storage = await this.getStorage()
      await storage.remove({ key })
    } catch (error) {
      throw new StorageError(
        `Failed to remove item: ${key}`,
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async clear(): Promise<void> {
    try {
      const storage = await this.getStorage()
      await storage.clear()
    } catch (error) {
      throw new StorageError(
        'Failed to clear storage',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async getAllKeys(): Promise<string[]> {
    try {
      const storage = await this.getStorage()
      const { keys } = await storage.keys()
      return keys
    } catch (error) {
      throw new StorageError(
        'Failed to get all keys',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      const results: Array<[string, string | null]> = []
      
      for (const key of keys) {
        const value = await this.getItem(key)
        results.push([key, value])
      }
      
      return results
    } catch (error) {
      throw new StorageError(
        'Failed to get multiple items',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      for (const [key, value] of keyValuePairs) {
        await this.setItem(key, value)
      }
    } catch (error) {
      throw new StorageError(
        'Failed to set multiple items',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async multiRemove(keys: string[]): Promise<void> {
    try {
      for (const key of keys) {
        await this.removeItem(key)
      }
    } catch (error) {
      throw new StorageError(
        'Failed to remove multiple items',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const keys = await this.getAllKeys()
      let bytesUsed = 0
      
      for (const key of keys) {
        const value = await this.getItem(key)
        if (value) {
          bytesUsed += key.length + value.length
        }
      }
      
      return {
        bytesUsed,
        bytesAvailable: null, // Unlimited on mobile (within device limits)
        itemCount: keys.length,
        type: 'asyncStorage',
      }
    } catch (error) {
      throw new StorageError(
        'Failed to get storage info',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
}

// Export singleton instance
export const mobileStorage = new MobileStorage()
