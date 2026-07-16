import React from 'react'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

import type { CaptureReadiness } from '@/lib/capture/guidedCapture'

interface GuidedCaptureStatusProps {
  readiness: CaptureReadiness
  className?: string
  onRecordAnyway?: () => void
}

const STATE_CONTENT = {
  checking: {
    label: 'SETTING UP',
    icon: Loader2,
    shell: 'border-white/20 bg-black/70',
    iconColor: 'text-white/70',
  },
  needs_attention: {
    label: 'ADJUST CAMERA',
    icon: AlertTriangle,
    shell: 'border-[#FF6B35]/70 bg-black/80',
    iconColor: 'text-[#FF6B35]',
  },
  ready: {
    label: 'READY TO RECORD',
    icon: CheckCircle2,
    shell: 'border-green-400/70 bg-green-950/80',
    iconColor: 'text-green-400',
  },
} as const

export function GuidedCaptureStatus({
  readiness,
  className = '',
  onRecordAnyway,
}: GuidedCaptureStatusProps) {
  const content = STATE_CONTENT[readiness.status]
  const Icon = content.icon
  const message = readiness.ready
    ? 'Full body locked. ShotIQ is ready.'
    : readiness.primaryIssue?.message ?? 'Checking camera and tracking quality…'

  return (
    <div
      role="status"
      aria-live="polite"
      data-capture-state={readiness.status}
      className={`rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md ${content.shell} ${className}`}
    >
      <div className="flex items-center gap-3">
        <Icon
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 ${content.iconColor} ${readiness.status === 'checking' ? 'animate-spin' : ''}`}
        />
        <div className="min-w-0">
          <p className="text-xs font-black tracking-[0.16em] text-white">{content.label}</p>
          <p className="mt-0.5 text-sm font-medium leading-snug text-white/75">{message}</p>
        </div>
      </div>
      {readiness.status === 'needs_attention' && onRecordAnyway && (
        <button
          type="button"
          aria-label="Record without tracking lock"
          onClick={onRecordAnyway}
          className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black tracking-[0.12em] text-white transition hover:bg-white/20"
        >
          RECORD ANYWAY
        </button>
      )}
    </div>
  )
}

export default GuidedCaptureStatus
