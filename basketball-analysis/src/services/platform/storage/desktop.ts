/**
 * Desktop Platform Storage Implementation
 * Uses Tauri's store plugin for desktop applications
 */

import type { PlatformStorage, StorageInfo } from './types'
import { StorageError, StorageErrorCode } from './types'

class DesktopStorage implements PlatformStorage {
  private store: any = null
  
  private async getStore() {
    if (this.store) return this.store
    
    try {
      // Dynamically import Tauri store
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { Store } = await import('@tauri-apps/plugin-store')
        // Create store instance - Tauri v2 API
        this.store = new (Store as any)('shotiq-storage.dat')
        return this.store
      }
      
      throw new Error('Tauri is not available')
    } catch (error) {
      throw new StorageError(
        'Failed to initialize Tauri store',
        StorageErrorCode.PERMISSION_DENIED,
        error as Error
      )
    }
  }
  
  async getItem(key: string): Promise<string | null> {
    try {
      const store = await this.getStore()
      const value = await store.get(key)
      return value !== null && value !== undefined ? String(value) : null
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
      const store = await this.getStore()
      await store.set(key, value)
      await store.save() // Persist to disk
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
      const store = await this.getStore()
      await store.delete(key)
      await store.save()
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
      const store = await this.getStore()
      await store.clear()
      await store.save()
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
      const store = await this.getStore()
      const keys = await store.keys()
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
      const store = await this.getStore()
      
      for (const [key, value] of keyValuePairs) {
        await store.set(key, value)
      }
      
      await store.save()
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
      const store = await this.getStore()
      
      for (const key of keys) {
        await store.delete(key)
      }
      
      await store.save()
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
        bytesAvailable: null, // Unlimited on desktop
        itemCount: keys.length,
        type: 'tauriStore',
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
export const desktopStorage = new DesktopStorage()
