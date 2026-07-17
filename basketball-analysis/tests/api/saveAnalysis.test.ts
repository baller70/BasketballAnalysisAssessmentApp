import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  resolveProfileId: vi.fn(),
  validateCsrf: vi.fn(),
  uploadMedia: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  analysisFindUnique: vi.fn(),
  analysisUpsert: vi.fn(),
  shooterFindUnique: vi.fn(),
  historyUpsert: vi.fn(),
  historyFindMany: vi.fn(),
  historyUpdate: vi.fn(),
}))

vi.mock('@/lib/auth/currentUser', () => ({
  resolveProfileId: mocks.resolveProfileId,
  isError: (result: { error?: NextResponse }) => Boolean(result.error),
}))
vi.mock('@/lib/csrf', () => ({ validateCsrf: mocks.validateCsrf }))
vi.mock('@/lib/storage', () => ({ uploadMedia: mocks.uploadMedia }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}))

import { POST } from '@/app/api/save-analysis/route'

const tx = {
  $queryRaw: mocks.queryRaw,
  userAnalysis: { findUnique: mocks.analysisFindUnique, upsert: mocks.analysisUpsert },
  shooter: { findUnique: mocks.shooterFindUnique },
  analysisHistory: {
    upsert: mocks.historyUpsert,
    findMany: mocks.historyFindMany,
    update: mocks.historyUpdate,
  },
}

function request(body: unknown) {
  return new NextRequest('http://shotiq.test/api/save-analysis', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const valid = {
  clientSessionId: 'session-1',
  recordedAt: '2026-07-16T12:00:00.000Z',
  mediaType: 'video',
  captureSessionId: 'capture-1',
  overallScore: 82,
}

describe('POST /api/save-analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.validateCsrf.mockReturnValue(null)
    mocks.resolveProfileId.mockResolvedValue({ profileId: 'profile-1' })
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx))
    mocks.analysisFindUnique.mockResolvedValue(null)
    mocks.analysisUpsert.mockResolvedValue({ id: 'analysis-1' })
    mocks.historyUpsert.mockResolvedValue({ id: 'history-1' })
    mocks.historyFindMany.mockResolvedValue([{ id: 'history-1', overallScore: 82 }])
    mocks.historyUpdate.mockResolvedValue({ id: 'history-1' })
  })

  it('requires CSRF before writing', async () => {
    mocks.validateCsrf.mockReturnValue(NextResponse.json({ error: 'csrf' }, { status: 403 }))
    const response = await POST(request(valid))
    expect(response.status).toBe(403)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('rejects malformed durable identity and media metadata', async () => {
    const response = await POST(request({ ...valid, clientSessionId: '', mediaType: 'movie' }))
    expect(response.status).toBe(400)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('upserts by signed-in user and exact client session id', async () => {
    const response = await POST(request(valid))
    expect(response.status).toBe(200)
    expect(mocks.analysisUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        userProfileId_clientSessionId: {
          userProfileId: 'profile-1',
          clientSessionId: 'session-1',
        },
      },
      create: expect.objectContaining({ captureSessionId: 'capture-1', mediaType: 'video' }),
    }))
  })

  it('serializes the user history and repairs chronological score changes', async () => {
    mocks.historyFindMany.mockResolvedValue([
      { id: 'older', overallScore: 70, scoreChange: 999 },
      { id: 'current', overallScore: 82, scoreChange: 999 },
      { id: 'newer', overallScore: 79, scoreChange: 999 },
    ])
    await POST(request(valid))
    expect(mocks.queryRaw).toHaveBeenCalled()
    expect(mocks.historyUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'older' }, data: { scoreChange: null },
    })
    expect(mocks.historyUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'current' }, data: { scoreChange: 12 },
    })
    expect(mocks.historyUpdate).toHaveBeenNthCalledWith(3, {
      where: { id: 'newer' }, data: { scoreChange: -3 },
    })
  })

  it('reuses stored media and does not upload it again', async () => {
    mocks.analysisFindUnique.mockResolvedValue({
      id: 'analysis-1', imageUrl: '/saved.jpg', annotatedImageUrl: '/saved-annotated.jpg',
    })
    await POST(request({ ...valid, imageData: 'data:image/jpeg;base64,raw' }))
    expect(mocks.uploadMedia).not.toHaveBeenCalled()
    expect(mocks.analysisUpsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ imageUrl: '/saved.jpg' }),
    }))
  })

  it('does not let an older null request erase a late capture id', async () => {
    mocks.analysisFindUnique.mockResolvedValue({
      id: 'analysis-1', imageUrl: null, annotatedImageUrl: null,
      captureSessionId: 'capture-late-1',
    })
    await POST(request({ ...valid, captureSessionId: null }))
    expect(mocks.analysisUpsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ captureSessionId: 'capture-late-1' }),
    }))
  })
})
