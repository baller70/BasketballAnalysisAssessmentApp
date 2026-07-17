import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  abortQueuedVideo,
  uploadQueuedVideo,
  resumeQueuedUploads,
} from '@/lib/upload/resumableVideoUpload'
import {
  enqueueVideoUpload,
  type UploadQueueEntry,
  type UploadQueueStorage,
} from '@/lib/upload/uploadQueue'

class MemoryStorage implements UploadQueueStorage {
  values = new Map<string, UploadQueueEntry>()
  async get(id: string) { return this.values.get(id) }
  async list() { return [...this.values.values()] }
  async put(entry: UploadQueueEntry) { this.values.set(entry.id, entry) }
  async delete(id: string) { this.values.delete(id) }
}

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
})

describe('resumable multipart video upload', () => {
  let storage: MemoryStorage
  let apiFetch: ReturnType<typeof vi.fn>
  let partFetch: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    storage = new MemoryStorage()
    await enqueueVideoUpload(storage, {
      blob: new Blob(['abcdefghijkl'], { type: 'video/mp4' }),
      clientSessionId: 'session-1', fileName: 'shot.mp4', id: 'queue-1', now: 1,
    })
    apiFetch = vi.fn(async (url: string) => {
      if (url === '/api/media-uploads') return jsonResponse({ upload: { id: 'server-1' } }, 201)
      if (url.includes('/parts')) {
        const partNumber = Number(JSON.parse(apiFetch.mock.calls.at(-1)?.[1]?.body as string).partNumber)
        return jsonResponse({ url: `https://parts.test/${partNumber}` })
      }
      if (url.includes('/abort')) return jsonResponse({ success: true })
      if (url.includes('/complete')) return jsonResponse({ upload: { mediaUrl: 'https://media.test/shot.mp4' } })
      return jsonResponse({}, 404)
    })
    partFetch = vi.fn(async (_url: string) => new Response(null, {
      status: 200,
      headers: { ETag: `etag-${partFetch.mock.calls.length}` },
    }))
  })

  it('uploads sequential parts, checkpoints each ETag, and completes', async () => {
    const completed = await uploadQueuedVideo('queue-1', {
      storage,
      apiFetch,
      partFetch,
      partSizeBytes: 5,
      isOnline: () => true,
      delay: async () => undefined,
    })

    expect(partFetch).toHaveBeenCalledTimes(3)
    expect(completed).toMatchObject({
      status: 'complete',
      serverUploadId: 'server-1',
      mediaUrl: 'https://media.test/shot.mp4',
    })
    expect(completed.completedParts.map((part) => part.partNumber)).toEqual([1, 2, 3])
  })

  it('resumes only unfinished parts from an existing checkpoint', async () => {
    const entry = (await storage.get('queue-1'))!
    await storage.put({
      ...entry,
      serverUploadId: 'server-1',
      completedParts: [{ partNumber: 1, eTag: 'etag-existing' }],
    })
    await uploadQueuedVideo('queue-1', {
      storage, apiFetch, partFetch, partSizeBytes: 5,
      isOnline: () => true, delay: async () => undefined,
    })

    expect(partFetch).toHaveBeenCalledTimes(2)
    expect(apiFetch).not.toHaveBeenCalledWith('/api/media-uploads', expect.anything())
  })

  it('pauses offline without losing the Blob or checkpoints', async () => {
    const result = await uploadQueuedVideo('queue-1', {
      storage, apiFetch, partFetch, partSizeBytes: 5,
      isOnline: () => false, delay: async () => undefined,
    })

    expect(result.status).toBe('paused')
    expect(result.blob.size).toBe(12)
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('retries a failed part with bounded backoff and then completes', async () => {
    partFetch
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValue(new Response(null, { status: 200, headers: { ETag: 'etag-ok' } }))
    const delay = vi.fn(async () => undefined)
    const result = await uploadQueuedVideo('queue-1', {
      storage, apiFetch, partFetch, partSizeBytes: 20,
      isOnline: () => true, delay, maxAttempts: 3,
    })

    expect(result.status).toBe('complete')
    expect(partFetch).toHaveBeenCalledTimes(2)
    expect(delay).toHaveBeenCalledTimes(1)
  })

  it('continues other queued uploads when one entry fails', async () => {
    await enqueueVideoUpload(storage, {
      blob: new Blob(['other'], { type: 'video/mp4' }),
      clientSessionId: 'session-2', fileName: 'other.mp4', id: 'queue-2', now: 2,
    })
    const runner = vi.fn(async (id: string) => {
      if (id === 'queue-1') throw new Error('network')
      return (await storage.get(id))!
    })

    await resumeQueuedUploads({ storage, runner })
    expect(runner).toHaveBeenCalledTimes(2)
  })

  it('aborts the owned server upload and marks the local entry cancelled', async () => {
    const current = (await storage.get('queue-1'))!
    await storage.put({ ...current, serverUploadId: 'server-1' })
    const cancelled = await abortQueuedVideo('queue-1', { storage, apiFetch })

    expect(apiFetch).toHaveBeenCalledWith('/api/media-uploads/server-1/abort', expect.objectContaining({ method: 'POST' }))
    expect(cancelled.status).toBe('cancelled')
  })
})
