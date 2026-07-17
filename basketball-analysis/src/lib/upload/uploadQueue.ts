'use client'

export type UploadQueueStatus =
  | 'queued'
  | 'uploading'
  | 'paused'
  | 'retrying'
  | 'failed'
  | 'complete'
  | 'cancelled'

export interface UploadPartCheckpoint {
  partNumber: number
  eTag: string
}

export interface UploadQueueEntry {
  id: string
  clientSessionId: string
  fileName: string
  contentType: string
  sizeBytes: number
  blob: Blob
  status: UploadQueueStatus
  serverUploadId?: string
  completedParts: UploadPartCheckpoint[]
  mediaUrl?: string
  error?: string
  attempts: number
  createdAt: number
  updatedAt: number
}

export interface UploadQueueStorage {
  get(id: string): Promise<UploadQueueEntry | undefined>
  list(): Promise<UploadQueueEntry[]>
  put(entry: UploadQueueEntry): Promise<void>
  delete(id: string): Promise<void>
}

export class UploadQueueError extends Error {
  constructor(
    message: string,
    readonly code: 'quota_exceeded' | 'corrupt_entry' | 'storage_unavailable',
  ) {
    super(message)
    this.name = 'UploadQueueError'
  }
}

const generatedId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `upload_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
}

function validEntry(value: unknown): value is UploadQueueEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entry = value as Partial<UploadQueueEntry>
  return typeof entry.id === 'string'
    && typeof entry.clientSessionId === 'string'
    && typeof entry.fileName === 'string'
    && typeof entry.contentType === 'string'
    && typeof entry.sizeBytes === 'number'
    && entry.blob instanceof Blob
    && Array.isArray(entry.completedParts)
    && typeof entry.status === 'string'
}

function videoContentType(blob: Blob, fileName: string): string {
  if (['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'].includes(blob.type)) return blob.type
  if (/\.mov$/i.test(fileName)) return 'video/quicktime'
  if (/\.webm$/i.test(fileName)) return 'video/webm'
  if (/\.m4v$/i.test(fileName)) return 'video/x-m4v'
  return 'video/mp4'
}

async function safePut(storage: UploadQueueStorage, entry: UploadQueueEntry): Promise<void> {
  try {
    await storage.put(entry)
  } catch (error) {
    if (isQuotaError(error)) {
      throw new UploadQueueError('Not enough browser storage to retain this video for retry', 'quota_exceeded')
    }
    throw error
  }
}

export async function enqueueVideoUpload(
  storage: UploadQueueStorage,
  input: {
    blob: Blob
    clientSessionId: string
    fileName: string
    id?: string
    now?: number
  },
): Promise<UploadQueueEntry> {
  const now = input.now ?? Date.now()
  const entry: UploadQueueEntry = {
    id: input.id ?? generatedId(),
    clientSessionId: input.clientSessionId,
    fileName: input.fileName,
    contentType: videoContentType(input.blob, input.fileName),
    sizeBytes: input.blob.size,
    blob: input.blob,
    status: 'queued',
    completedParts: [],
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  }
  await safePut(storage, entry)
  return entry
}

export async function listQueuedUploads(storage: UploadQueueStorage): Promise<UploadQueueEntry[]> {
  const rawEntries = await storage.list()
  const valid: UploadQueueEntry[] = []
  for (const value of rawEntries as unknown[]) {
    if (validEntry(value)) {
      valid.push(value)
      continue
    }
    const id = value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string'
      ? (value as { id: string }).id
      : null
    if (id) await storage.delete(id)
  }
  return valid.sort((left, right) => left.createdAt - right.createdAt)
}

export async function updateUploadEntry(
  storage: UploadQueueStorage,
  id: string,
  changes: Partial<Omit<UploadQueueEntry, 'id' | 'blob' | 'clientSessionId' | 'createdAt'>>,
  now = Date.now(),
): Promise<UploadQueueEntry> {
  const entry = await storage.get(id)
  if (!entry || !validEntry(entry)) throw new UploadQueueError('Upload queue entry is missing or corrupt', 'corrupt_entry')
  const updated = { ...entry, ...changes, updatedAt: now }
  await safePut(storage, updated)
  return updated
}

export async function saveUploadCheckpoint(
  storage: UploadQueueStorage,
  id: string,
  checkpoint: UploadPartCheckpoint,
  now = Date.now(),
): Promise<UploadQueueEntry> {
  const entry = await storage.get(id)
  if (!entry || !validEntry(entry)) throw new UploadQueueError('Upload queue entry is missing or corrupt', 'corrupt_entry')
  const completedParts = entry.completedParts
    .filter((part) => part.partNumber !== checkpoint.partNumber)
    .concat(checkpoint)
    .sort((left, right) => left.partNumber - right.partNumber)
  return updateUploadEntry(storage, id, { completedParts }, now)
}

const DB_NAME = 'shotiq-media-uploads'
const STORE_NAME = 'uploads'

/** Native IndexedDB adapter: Blobs remain binary and survive Safari reloads. */
export class IndexedDbUploadQueueStorage implements UploadQueueStorage {
  private databasePromise: Promise<IDBDatabase> | null = null

  private database(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new UploadQueueError('IndexedDB is unavailable', 'storage_unavailable'))
    }
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1)
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE_NAME)) {
            request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
          }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Could not open upload storage'))
      })
    }
    return this.databasePromise
  }

  private async request<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const database = await this.database()
    return new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode)
      const request = action(transaction.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Upload storage request failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Upload storage transaction aborted'))
    })
  }

  async get(id: string): Promise<UploadQueueEntry | undefined> {
    return this.request('readonly', (store) => store.get(id))
  }

  async list(): Promise<UploadQueueEntry[]> {
    return this.request('readonly', (store) => store.getAll())
  }

  async put(entry: UploadQueueEntry): Promise<void> {
    await this.request('readwrite', (store) => store.put(entry))
  }

  async delete(id: string): Promise<void> {
    await this.request('readwrite', (store) => store.delete(id))
  }
}

export const uploadQueueStorage = new IndexedDbUploadQueueStorage()

export const UPLOAD_QUEUE_CHANGE_EVENT = 'shotiq-upload-queue-change'

export function notifyUploadQueueChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UPLOAD_QUEUE_CHANGE_EVENT))
}
