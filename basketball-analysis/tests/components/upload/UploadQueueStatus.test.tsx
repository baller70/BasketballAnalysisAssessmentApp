import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UploadQueueStatus } from '@/components/upload/UploadQueueStatus'
import type { UploadQueueEntry, UploadQueueStatus as Status } from '@/lib/upload/uploadQueue'

const entry = (status: Status, error?: string): UploadQueueEntry => ({
  id: `entry-${status}`,
  clientSessionId: 'session-1',
  fileName: 'shot.mov',
  contentType: 'video/quicktime',
  sizeBytes: 10,
  blob: new Blob(['video']),
  status,
  completedParts: status === 'uploading' ? [{ partNumber: 1, eTag: 'etag' }] : [],
  error,
  attempts: 1,
  createdAt: 1,
  updatedAt: 2,
})

describe('UploadQueueStatus', () => {
  it.each([
    ['uploading', 'Uploading original video'],
    ['paused', 'Waiting for connection'],
    ['retrying', 'Retrying video upload'],
    ['failed', 'Video upload needs attention'],
    ['complete', 'Original video saved'],
  ] as const)('renders the %s state clearly', (status, label) => {
    render(<UploadQueueStatus entries={[entry(status)]} onRetry={() => undefined} />)
    expect(screen.getByText(label)).toBeTruthy()
  })

  it('offers a manual retry for paused and failed entries', () => {
    const onRetry = vi.fn()
    render(<UploadQueueStatus entries={[entry('failed', 'Network unavailable')]} onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry video upload' }))
    expect(onRetry).toHaveBeenCalledWith('entry-failed')
    expect(screen.getByText('Network unavailable')).toBeTruthy()
  })
})
