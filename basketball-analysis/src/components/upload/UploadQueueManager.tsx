'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { UploadQueueStatus } from '@/components/upload/UploadQueueStatus'
import { uploadQueuedVideo } from '@/lib/upload/resumableVideoUpload'
import {
  listQueuedUploads,
  UPLOAD_QUEUE_CHANGE_EVENT,
  uploadQueueStorage,
  type UploadQueueEntry,
} from '@/lib/upload/uploadQueue'

const replaceEntry = (entries: UploadQueueEntry[], next: UploadQueueEntry): UploadQueueEntry[] => {
  const existing = entries.findIndex((entry) => entry.id === next.id)
  if (existing < 0) return [...entries, next]
  const updated = [...entries]
  updated[existing] = next
  return updated
}

/** App-level worker so navigation never interrupts an IndexedDB upload retry. */
export function UploadQueueManager() {
  const [entries, setEntries] = useState<UploadQueueEntry[]>([])
  const running = useRef(new Set<string>())
  const draining = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const next = await listQueuedUploads(uploadQueueStorage)
      setEntries(next)
      return next
    } catch {
      return []
    }
  }, [])

  const run = useCallback(async (id: string) => {
    if (running.current.has(id)) return
    running.current.add(id)
    try {
      await uploadQueuedVideo(id, {
        storage: uploadQueueStorage,
        onUpdate: (entry) => setEntries((current) => replaceEntry(current, entry)),
      })
    } catch {
      await refresh()
    } finally {
      running.current.delete(id)
    }
  }, [refresh])

  const resume = useCallback(async () => {
    if (draining.current) return
    draining.current = true
    try {
      const queued = await refresh()
      // Sequential parts and sequential files keep iPhone memory/network use
      // bounded while a long capture is being analyzed in parallel.
      for (const entry of queued) {
        if (entry.status !== 'complete' && entry.status !== 'cancelled') await run(entry.id)
      }
    } finally {
      draining.current = false
    }
  }, [refresh, run])

  useEffect(() => {
    void resume()
    const handleQueueChange = () => { void resume() }
    window.addEventListener('online', handleQueueChange)
    window.addEventListener(UPLOAD_QUEUE_CHANGE_EVENT, handleQueueChange)
    return () => {
      window.removeEventListener('online', handleQueueChange)
      window.removeEventListener(UPLOAD_QUEUE_CHANGE_EVENT, handleQueueChange)
    }
  }, [resume])

  if (!entries.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-[#171717]/95 p-3 shadow-2xl backdrop-blur">
      <UploadQueueStatus entries={entries} onRetry={(id) => void run(id)} />
    </div>
  )
}
