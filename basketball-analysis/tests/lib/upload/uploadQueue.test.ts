import { beforeEach, describe, expect, it } from 'vitest'

import {
  enqueueVideoUpload,
  listQueuedUploads,
  saveUploadCheckpoint,
  UploadQueueError,
  type UploadQueueEntry,
  type UploadQueueStorage,
} from '@/lib/upload/uploadQueue'

class MemoryStorage implements UploadQueueStorage {
  values = new Map<string, UploadQueueEntry | unknown>()
  failWithQuota = false

  async get(id: string) { return this.values.get(id) as UploadQueueEntry | undefined }
  async list() { return [...this.values.values()] as UploadQueueEntry[] }
  async put(entry: UploadQueueEntry) {
    if (this.failWithQuota) throw new DOMException('full', 'QuotaExceededError')
    this.values.set(entry.id, entry)
  }
  async delete(id: string) { this.values.delete(id) }
}

describe('durable video upload queue', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('stores the original video Blob and durable session identity', async () => {
    const blob = new Blob(['original-video'], { type: 'video/quicktime' })
    const entry = await enqueueVideoUpload(storage, {
      blob,
      clientSessionId: 'session-1',
      fileName: 'shot.mov',
      id: 'queue-1',
      now: 100,
    })

    expect(entry).toMatchObject({
      id: 'queue-1',
      clientSessionId: 'session-1',
      fileName: 'shot.mov',
      contentType: 'video/quicktime',
      sizeBytes: blob.size,
      status: 'queued',
      completedParts: [],
    })
    expect((await storage.get('queue-1'))?.blob).toBe(blob)
  })

  it('checkpoints completed part numbers and ETags without duplicates', async () => {
    await enqueueVideoUpload(storage, {
      blob: new Blob(['video'], { type: 'video/mp4' }),
      clientSessionId: 'session-1', fileName: 'shot.mp4', id: 'queue-1', now: 1,
    })
    await saveUploadCheckpoint(storage, 'queue-1', { partNumber: 2, eTag: 'etag-2' }, 2)
    const updated = await saveUploadCheckpoint(storage, 'queue-1', { partNumber: 1, eTag: 'etag-1' }, 3)
    await saveUploadCheckpoint(storage, 'queue-1', { partNumber: 1, eTag: 'replacement' }, 4)

    expect(updated.completedParts).toEqual([
      { partNumber: 1, eTag: 'etag-1' },
      { partNumber: 2, eTag: 'etag-2' },
    ])
    expect((await storage.get('queue-1'))?.completedParts).toEqual([
      { partNumber: 1, eTag: 'replacement' },
      { partNumber: 2, eTag: 'etag-2' },
    ])
  })

  it('removes corrupt records instead of attempting an unrelated upload', async () => {
    storage.values.set('broken', { id: 'broken', clientSessionId: 'session-1' })
    const entries = await listQueuedUploads(storage)

    expect(entries).toEqual([])
    expect(storage.values.has('broken')).toBe(false)
  })

  it('surfaces browser quota failure with a stable error code', async () => {
    storage.failWithQuota = true
    await expect(enqueueVideoUpload(storage, {
      blob: new Blob(['video'], { type: 'video/mp4' }),
      clientSessionId: 'session-1', fileName: 'shot.mp4', id: 'queue-1', now: 1,
    })).rejects.toMatchObject<Partial<UploadQueueError>>({ code: 'quota_exceeded' })
  })
})
