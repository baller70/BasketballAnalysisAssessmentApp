import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  resolveProfileId: vi.fn(),
  create: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@/lib/auth/currentUser', () => ({
  resolveProfileId: mocks.resolveProfileId,
  isError: (result: { error?: NextResponse }) => Boolean(result.error),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    captureSession: {
      create: mocks.create,
      findMany: mocks.findMany,
      findFirst: mocks.findFirst,
      update: mocks.update,
    },
  },
}))

import { GET, POST } from '@/app/api/capture-sessions/route'
import { GET as GET_ONE, PATCH } from '@/app/api/capture-sessions/[id]/route'

const request = (url: string, method = 'GET', body?: unknown) => new NextRequest(url, {
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
  headers: body === undefined ? undefined : { 'content-type': 'application/json' },
})

describe('capture session API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveProfileId.mockResolvedValue({ profileId: 'profile-1' })
  })

  it('creates a session owned by the signed-in player and ignores a supplied owner', async () => {
    mocks.create.mockResolvedValue({ id: 'capture-1' })

    const response = await POST(request('http://shotiq.test/api/capture-sessions', 'POST', {
      userProfileId: 'attacker-profile',
      mode: 'form',
      source: 'live',
      platform: 'ios',
      deviceModel: 'iPhone 12',
      cameraFacing: 'rear',
      orientation: 'portrait',
      view: 'front',
      shootingHand: 'right',
      poseProvider: 'native-ios-vision',
      poseModel: 'apple-vision',
      readinessStatus: 'ready',
      frameWidth: 1080,
      frameHeight: 1920,
    }))

    expect(response.status).toBe(201)
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userProfileId: 'profile-1',
        mode: 'form',
        platform: 'ios',
        orientation: 'portrait',
      }),
    })
    expect(mocks.create.mock.calls[0][0].data.userProfileId).not.toBe('attacker-profile')
  })

  it('rejects invalid capture metadata before writing it', async () => {
    const response = await POST(request('http://shotiq.test/api/capture-sessions', 'POST', {
      mode: 'form',
      source: 'live',
      platform: 'ios',
      orientation: 'sideways-upside-down',
      readinessStatus: 'ready',
    }))

    expect(response.status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('lists only the signed-in player’s capture sessions', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'capture-1' }])

    const response = await GET(request('http://shotiq.test/api/capture-sessions?limit=12'))

    expect(response.status).toBe(200)
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userProfileId: 'profile-1' },
      take: 12,
    }))
  })

  it('does not reveal a session owned by another player', async () => {
    mocks.findFirst.mockResolvedValue(null)

    const response = await GET_ONE(
      request('http://shotiq.test/api/capture-sessions/capture-2'),
      { params: { id: 'capture-2' } }
    )

    expect(response.status).toBe(404)
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'capture-2', userProfileId: 'profile-1' },
    }))
  })

  it('appends a confidence-aware observation to an owned session', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'capture-1' })
    mocks.update.mockResolvedValue({ id: 'capture-1' })

    const response = await PATCH(
      request('http://shotiq.test/api/capture-sessions/capture-1', 'PATCH', {
        readinessStatus: 'recording',
        observation: {
          timestampMs: 1250,
          orientation: 'upright',
          poseConfidence: 0.91,
          fullBodyVisible: true,
          subjectFrameRatio: 0.72,
        },
      }),
      { params: { id: 'capture-1' } }
    )

    expect(response.status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'capture-1' },
      data: expect.objectContaining({
        readinessStatus: 'recording',
        observations: {
          create: expect.objectContaining({
            timestampMs: 1250,
            poseConfidence: 0.91,
            fullBodyVisible: true,
          }),
        },
      }),
      include: { observations: expect.any(Object) },
    })
  })
})
