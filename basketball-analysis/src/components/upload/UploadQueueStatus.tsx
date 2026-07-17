'use client'

import { CheckCircle2, CloudOff, Loader2, RefreshCw, UploadCloud } from 'lucide-react'

import type { UploadQueueEntry } from '@/lib/upload/uploadQueue'

export interface UploadQueueStatusProps {
  entries: UploadQueueEntry[]
  onRetry(id: string): void
}

const description = (entry: UploadQueueEntry) => {
  switch (entry.status) {
    case 'uploading': return { label: 'Uploading original video', icon: UploadCloud, color: 'text-[#FF6B35]' }
    case 'queued': return { label: 'Video queued for upload', icon: UploadCloud, color: 'text-[#FF6B35]' }
    case 'paused': return { label: 'Waiting for connection', icon: CloudOff, color: 'text-amber-400' }
    case 'retrying': return { label: 'Retrying video upload', icon: Loader2, color: 'text-amber-400' }
    case 'failed': return { label: 'Video upload needs attention', icon: CloudOff, color: 'text-red-400' }
    case 'complete': return { label: 'Original video saved', icon: CheckCircle2, color: 'text-green-400' }
    case 'cancelled': return { label: 'Video upload cancelled', icon: CloudOff, color: 'text-slate-400' }
  }
}

export function UploadQueueStatus({ entries, onRetry }: UploadQueueStatusProps) {
  if (!entries.length) return null
  return (
    <div className="space-y-2" aria-label="Video upload queue">
      {entries.map((entry) => {
        const state = description(entry)
        const Icon = state.icon
        const canRetry = entry.status === 'failed' || entry.status === 'paused'
        return (
          <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
            <Icon className={`h-5 w-5 shrink-0 ${state.color} ${entry.status === 'retrying' ? 'animate-spin' : ''}`} />
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-bold ${state.color}`}>{state.label}</div>
              <div className="truncate text-xs text-white/55">{entry.fileName}</div>
              {entry.error && <div className="mt-1 text-xs text-red-300">{entry.error}</div>}
            </div>
            {canRetry && (
              <button
                type="button"
                aria-label="Retry video upload"
                onClick={() => onRetry(entry.id)}
                className="rounded-full border border-[#FF6B35]/50 p-2 text-[#FF6B35]"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
