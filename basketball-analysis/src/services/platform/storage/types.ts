/**
 * Platform Storage Types
 * Defines the interface for platform-agnostic storage operations
 */

/**
 * Platform-agnostic storage interface
 * All platform implementations must conform to this interface
 */
export interface PlatformStorage {
  /**
   * Get an item from storage
   * @param key - Storage key
   * @returns Promise resolving to the value or null if not found
   */
  getItem(key: string): Promise<string | null>
  
  /**
   * Set an item in storage
   * @param key - Storage key
   * @param value - Value to store (will be stringified)
   * @returns Promise resolving when complete
   */
  setItem(key: string, value: string): Promise<void>
  
  /**
   * Remove an item from storage
   * @param key - Storage key
   * @returns Promise resolving when complete
   */
  removeItem(key: string): Promise<void>
  
  /**
   * Clear all items from storage
   * @returns Promise resolving when complete
   */
  clear(): Promise<void>
  
  /**
   * Get all storage keys
   * @returns Promise resolving to array of keys
   */
  getAllKeys(): Promise<string[]>
  
  /**
   * Get multiple items at once
   * @param keys - Array of keys to retrieve
   * @returns Promise resolving to key-value pairs
   */
  multiGet(keys: string[]): Promise<Array<[string, string | null]>>
  
  /**
   * Set multiple items at once
   * @param keyValuePairs - Array of [key, value] pairs
   * @returns Promise resolving when complete
   */
  multiSet(keyValuePairs: Array<[string, string]>): Promise<void>
  
  /**
   * Remove multiple items at once
   * @param keys - Array of keys to remove
   * @returns Promise resolving when complete
   */
  multiRemove(keys: string[]): Promise<void>
  
  /**
   * Get storage usage information
   * @returns Promise resolving to storage info
   */
  getStorageInfo(): Promise<StorageInfo>
}

/**
 * Storage information
 */
export interface StorageInfo {
  /**
   * Total bytes used
   */
  bytesUsed: number
  
  /**
   * Total bytes available (null if unlimited)
   */
  bytesAvailable: number | null
  
  /**
   * Number of items stored
   */
  itemCount: number
  
  /**
   * Storage type
   */
  type: 'localStorage' | 'tauriStore' | 'asyncStorage' | 'secureStorage'
}

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

export enum StorageErrorCode {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_KEY = 'INVALID_KEY',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  UNKNOWN = 'UNKNOWN',
}
