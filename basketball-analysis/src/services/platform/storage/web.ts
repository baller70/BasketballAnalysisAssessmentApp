/**
 * Web Platform Storage Implementation
 * Uses localStorage for web browsers
 */

import type { PlatformStorage, StorageInfo } from './types'
import { StorageError, StorageErrorCode } from './types'

class WebStorage implements PlatformStorage {
  private isAvailable(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false
    }
    
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
  
  async getItem(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      throw new StorageError(
        'localStorage is not available',
        StorageErrorCode.PERMISSION_DENIED
      )
    }
    
    try {
      return localStorage.getItem(key)
    } catch (error) {
      throw new StorageError(
        `Failed to get item: ${key}`,
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async setItem(key: string, value: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError(
        'localStorage is not available',
        StorageErrorCode.PERMISSION_DENIED
      )
    }
    
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      // Check if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageError(
          'Storage quota exceeded',
          StorageErrorCode.QUOTA_EXCEEDED,
          error
        )
      }
      
      throw new StorageError(
        `Failed to set item: ${key}`,
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async removeItem(key: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError(
        'localStorage is not available',
        StorageErrorCode.PERMISSION_DENIED
      )
    }
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      throw new StorageError(
        `Failed to remove item: ${key}`,
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async clear(): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError(
        'localStorage is not available',
        StorageErrorCode.PERMISSION_DENIED
      )
    }
    
    try {
      localStorage.clear()
    } catch (error) {
      throw new StorageError(
        'Failed to clear storage',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async getAllKeys(): Promise<string[]> {
    if (!this.isAvailable()) {
      throw new StorageError(
        'localStorage is not available',
        StorageErrorCode.PERMISSION_DENIED
      )
    }
    
    try {
      return Object.keys(localStorage)
    } catch (error) {
      throw new StorageError(
        'Failed to get all keys',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    if (!this.isAvailable()) {
      throw new StorageError(
        'localStorage is not available',
        StorageErrorCode.PERMISSION_DENIED
      )
    }
    
    try {
      return keys.map(key => [key, localStorage.getItem(key)])
    } catch (error) {
      throw new StorageError(
        'Failed to get multiple items',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError(
        'localStorage is not available',
        StorageErrorCode.PERMISSION_DENIED
      )
    }
    
    try {
      for (const [key, value] of keyValuePairs) {
        localStorage.setItem(key, value)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageError(
          'Storage quota exceeded',
          StorageErrorCode.QUOTA_EXCEEDED,
          error
        )
      }
      
      throw new StorageError(
        'Failed to set multiple items',
        StorageErrorCode.UNKNOWN,
        error as Error
      )
    }
  }
  
  async multiRemove(keys: string[]): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError(
        'localStorage is not available',
        StorageErrorCode.PERMISSION_DENIED
      )
    }
    
    try {
      for (const key of keys) {
        localStorage.removeItem(key)
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
    if (!this.isAvailable()) {
      return {
        bytesUsed: 0,
        bytesAvailable: null,
        itemCount: 0,
        type: 'localStorage',
      }
    }
    
    try {
      // Calculate bytes used
      let bytesUsed = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          bytesUsed += key.length + value.length
        }
      }
      
      // localStorage typically has 5-10MB limit
      const bytesAvailable = 5 * 1024 * 1024 // 5MB estimate
      
      return {
        bytesUsed,
        bytesAvailable,
        itemCount: localStorage.length,
        type: 'localStorage',
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
export const webStorage = new WebStorage()
