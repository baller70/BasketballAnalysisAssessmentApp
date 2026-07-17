import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  resolveProfileId: vi.fn(),
  validateCsrf: vi.fn(),
  findMany: vi.fn(),
  deleteMany: vi.fn(),
  analysisFindFirst: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  historyUpsert: vi.fn(),
  txFindMany: vi.fn(),
  historyUpdate: vi.fn(),
}))

vi.mock('@/lib/auth/currentUser', () => ({
  resolveProfileId: mocks.resolveProfileId,
  isError: (result: { error?: NextResponse }) => Boolean(result.error),
}))
vi.mock('@/lib/csrf', () => ({ validateCsrf: mocks.validateCsrf }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    analysisHistory: { findMany: mocks.findMany, deleteMany: mocks.deleteMany },
    userAnalysis: { findFirst: mocks.analysisFindFirst },
    $transaction: mocks.transaction,
  },
}))

import { DELETE, GET, POST } from '@/app/api/analysis-history/route'

const tx = {
  $queryRaw: mocks.queryRaw,
  analysisHistory: {
    upsert: mocks.historyUpsert,
    findMany: mocks.txFindMany,
    update: mocks.historyUpdate,
  },
}

function request(url: string, method = 'GET', body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
  })
}

describe('analysis history sync API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveProfileId.mockResolvedValue({ profileId: 'profile-1' })
    mocks.validateCsrf.mockReturnValue(null)
    mocks.analysisFindFirst.mockResolvedValue({ id: 'analysis-1' })
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx))
    mocks.historyUpsert.mockResolvedValue({ id: 'history-1' })
    mocks.txFindMany.mockResolvedValue([{ id: 'history-1', overallScore: 0 }])
    mocks.historyUpdate.mockResolvedValue({ id: 'history-1' })
  })

  it('returns durable identities and preserves measured zero values', async () => {
    mocks.findMany.mockResolvedValue([{
      id: 'history-1', analysisId: 'analysis-1', analysisDate: new Date('2026-07-16T12:00:00Z'),
      overallScore: 0, formScore: 0, balanceScore: null, releaseScore: null,
      consistencyScore: null, elbowAngle: 0, kneeAngle: null, releaseAngle: null,
      scoreChange: 0, improvementAreas: null, regressionAreas: null,
      analysis: {
        id: 'analysis-1', clientSessionId: 'session-1', mediaType: 'video',
        captureSessionId: 'capture-1', imageUrl: null, annotatedImageUrl: null,
      },
    }])
    const response = await GET(request('http://shotiq.test/api/analysis-history?includeAnalysis=true'))
    const payload = await response.json()
    expect(payload.history[0]).toEqual(expect.objectContaining({
      clientSessionId: 'session-1', mediaType: 'video', captureSessionId: 'capture-1',
      scores: expect.objectContaining({ overall: 0, form: 0 }),
      angles: expect.objectContaining({ elbow: 0 }),
      scoreChange: 0,
    }))
  })

  it('requires CSRF for manual history writes', async () => {
    mocks.validateCsrf.mockReturnValue(NextResponse.json({ error: 'csrf' }, { status: 403 }))
    const response = await POST(request('http://shotiq.test/api/analysis-history', 'POST', {
      analysisId: 'analysis-1', overallScore: 80,
    }))
    expect(response.status).toBe(403)
    expect(mocks.analysisFindFirst).not.toHaveBeenCalled()
  })

  it('whitelists fields and always owns the row with the signed-in profile', async () => {
    const response = await POST(request('http://shotiq.test/api/analysis-history', 'POST', {
      analysisId: 'analysis-1', overallScore: 80,
      userProfileId: 'attacker', id: 'attacker-id', relation: { connect: { id: 'attacker' } },
    }))
    expect(response.status).toBe(200)
    const create = mocks.historyUpsert.mock.calls[0][0].create
    expect(create.userProfileId).toBe('profile-1')
    expect(create).not.toHaveProperty('id')
    expect(create).not.toHaveProperty('relation')
  })

  it('rejects invalid optional metrics as a client error', async () => {
    const response = await POST(request('http://shotiq.test/api/analysis-history', 'POST', {
      analysisId: 'analysis-1', overallScore: 80, formScore: 101,
    }))
    expect(response.status).toBe(400)
  })

  it('requires CSRF and scopes deletion to the signed-in profile', async () => {
    mocks.deleteMany.mockResolvedValue({ count: 1 })
    const response = await DELETE(request('http://shotiq.test/api/analysis-history?id=history-1', 'DELETE'))
    expect(response.status).toBe(200)
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { id: 'history-1', userProfileId: 'profile-1' },
    })
  })
})
