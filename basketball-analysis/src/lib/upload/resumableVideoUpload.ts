'use client'

import { csrfFetch } from '@/lib/api/csrfFetch'
import {
  listQueuedUploads,
  saveUploadCheckpoint,
  updateUploadEntry,
  uploadQueueStorage,
  type UploadQueueEntry,
  type UploadQueueStorage,
} from '@/lib/upload/uploadQueue'

export const VIDEO_UPLOAD_PART_SIZE = 8 * 1024 * 1024

export interface ResumableUploadDependencies {
  storage?: UploadQueueStorage
  apiFetch?: typeof fetch
  partFetch?: typeof fetch
  partSizeBytes?: number
  maxAttempts?: number
  isOnline?: () => boolean
  delay?: (milliseconds: number) => Promise<void>
  signal?: AbortSignal
  onUpdate?: (entry: UploadQueueEntry) => void
}

const defaultDelay = (milliseconds: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, milliseconds)
})

async function responseJson(response: Response, message: string): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(typeof body?.error === 'string' ? body.error : message)
  return body && typeof body === 'object' ? body as Record<string, unknown> : {}
}

async function withRetry<T>(
  operation: () => Promise<T>,
  input: {
    maxAttempts: number
    delay: (milliseconds: number) => Promise<void>
    signal?: AbortSignal
    onRetry?: (attempt: number, error: unknown) => Promise<void>
  },
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= input.maxAttempts; attempt += 1) {
    input.signal?.throwIfAborted()
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt >= input.maxAttempts) break
      await input.onRetry?.(attempt, error)
      await input.delay(Math.min(4_000, 300 * 2 ** (attempt - 1)))
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Video part upload failed')
}

export async function uploadQueuedVideo(
  id: string,
  dependencies: ResumableUploadDependencies = {},
): Promise<UploadQueueEntry> {
  const storage = dependencies.storage ?? uploadQueueStorage
  const apiFetch = dependencies.apiFetch ?? csrfFetch
  const partFetch = dependencies.partFetch ?? fetch
  const partSize = Math.max(1, Math.floor(dependencies.partSizeBytes ?? VIDEO_UPLOAD_PART_SIZE))
  const maxAttempts = Math.max(1, Math.floor(dependencies.maxAttempts ?? 3))
  const isOnline = dependencies.isOnline ?? (() => typeof navigator === 'undefined' || navigator.onLine)
  const delay = dependencies.delay ?? defaultDelay
  let entry = await storage.get(id)
  if (!entry) throw new Error('Queued video was not found')
  const emit = (value: UploadQueueEntry) => {
    entry = value
    dependencies.onUpdate?.(value)
  }

  if (!isOnline()) {
    const paused = await updateUploadEntry(storage, id, { status: 'paused', error: 'Waiting for an internet connection' })
    emit(paused)
    return paused
  }

  try {
    emit(await updateUploadEntry(storage, id, {
      status: entry.serverUploadId ? 'uploading' : 'queued',
      error: undefined,
      attempts: entry.attempts + 1,
    }))

    if (!entry.serverUploadId) {
      const response = await apiFetch('/api/media-uploads', {
        method: 'POST',
        signal: dependencies.signal,
        body: JSON.stringify({
          clientSessionId: entry.clientSessionId,
          fileName: entry.fileName,
          contentType: entry.contentType,
          sizeBytes: entry.sizeBytes,
        }),
      })
      const body = await responseJson(response, 'Could not start video upload')
      const upload = body.upload as { id?: unknown; status?: unknown; mediaUrl?: unknown } | undefined
      if (typeof upload?.id !== 'string') throw new Error('Upload server did not return an id')
      if (upload.status === 'complete') {
        const completedEntry = await updateUploadEntry(storage, id, {
          serverUploadId: upload.id,
          status: 'complete',
          mediaUrl: typeof upload.mediaUrl === 'string' ? upload.mediaUrl : undefined,
        })
        emit(completedEntry)
        return completedEntry
      }
      emit(await updateUploadEntry(storage, id, { serverUploadId: upload.id, status: 'uploading' }))
    }

    const completed = new Map(entry.completedParts.map((part) => [part.partNumber, part]))
    const partCount = Math.max(1, Math.ceil(entry.sizeBytes / partSize))
    for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
      if (completed.has(partNumber)) continue
      if (!isOnline()) {
        const paused = await updateUploadEntry(storage, id, { status: 'paused', error: 'Waiting for an internet connection' })
        emit(paused)
        return paused
      }

      const signResponse = await apiFetch(`/api/media-uploads/${entry.serverUploadId}/parts`, {
        method: 'POST',
        signal: dependencies.signal,
        body: JSON.stringify({ partNumber }),
      })
      const signed = await responseJson(signResponse, 'Could not authorize video part')
      if (typeof signed.url !== 'string') throw new Error('Upload server did not return a part URL')
      const start = (partNumber - 1) * partSize
      const end = Math.min(entry.sizeBytes, start + partSize)
      const part = entry.blob.slice(start, end, entry.contentType)
      const partResponse = await withRetry(async () => {
        const response = await partFetch(signed.url as string, {
          method: 'PUT',
          body: part,
          signal: dependencies.signal,
        })
        if (!response.ok) throw new Error(`Video part ${partNumber} failed (${response.status})`)
        const eTag = response.headers.get('etag')
        if (!eTag) throw new Error(`Video part ${partNumber} did not return an ETag`)
        return eTag
      }, {
        maxAttempts,
        delay,
        signal: dependencies.signal,
        onRetry: async (_attempt, error) => {
          emit(await updateUploadEntry(storage, id, {
            status: 'retrying',
            error: error instanceof Error ? error.message : 'Retrying video part',
          }))
        },
      })

      if (entry.status === 'retrying') {
        emit(await updateUploadEntry(storage, id, { status: 'uploading', error: undefined }))
      }

      const checkpoint = await saveUploadCheckpoint(storage, id, { partNumber, eTag: partResponse })
      emit(checkpoint)
      completed.set(partNumber, { partNumber, eTag: partResponse })
    }

    const completionResponse = await apiFetch(`/api/media-uploads/${entry.serverUploadId}/complete`, {
      method: 'POST',
      signal: dependencies.signal,
      body: JSON.stringify({ parts: [...completed.values()].sort((a, b) => a.partNumber - b.partNumber) }),
    })
    const completion = await responseJson(completionResponse, 'Could not complete video upload')
    const upload = completion.upload as { mediaUrl?: unknown } | undefined
    const finalEntry = await updateUploadEntry(storage, id, {
      status: 'complete',
      error: undefined,
      mediaUrl: typeof upload?.mediaUrl === 'string' ? upload.mediaUrl : undefined,
    })
    emit(finalEntry)
    return finalEntry
  } catch (error) {
    const aborted = dependencies.signal?.aborted
    const failed = await updateUploadEntry(storage, id, {
      status: aborted ? 'paused' : isOnline() ? 'failed' : 'paused',
      error: aborted ? 'Upload paused' : error instanceof Error ? error.message : 'Video upload failed',
    })
    emit(failed)
    if (aborted || !isOnline()) return failed
    throw error
  }
}

export async function abortQueuedVideo(
  id: string,
  dependencies: Pick<ResumableUploadDependencies, 'storage' | 'apiFetch' | 'signal'> = {},
): Promise<UploadQueueEntry> {
  const storage = dependencies.storage ?? uploadQueueStorage
  const apiFetch = dependencies.apiFetch ?? csrfFetch
  const entry = await storage.get(id)
  if (!entry) throw new Error('Queued video was not found')
  if (entry.serverUploadId) {
    const response = await apiFetch(`/api/media-uploads/${entry.serverUploadId}/abort`, {
      method: 'POST',
      signal: dependencies.signal,
      body: JSON.stringify({}),
    })
    await responseJson(response, 'Could not cancel video upload')
  }
  return updateUploadEntry(storage, id, { status: 'cancelled', error: undefined })
}

export async function resumeQueuedUploads(input: {
  storage?: UploadQueueStorage
  runner?: (id: string) => Promise<UploadQueueEntry>
} = {}): Promise<UploadQueueEntry[]> {
  const storage = input.storage ?? uploadQueueStorage
  const entries = await listQueuedUploads(storage)
  const results: UploadQueueEntry[] = []
  for (const entry of entries) {
    if (entry.status === 'complete' || entry.status === 'cancelled') continue
    try {
      results.push(await (input.runner ?? ((id) => uploadQueuedVideo(id, { storage })))(entry.id))
    } catch {
      const latest = await storage.get(entry.id)
      if (latest) results.push(latest)
    }
  }
  return results
}
