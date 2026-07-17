import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateCsrf: vi.fn(),
  resolveProfileId: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  analysisUpdateMany: vi.fn(),
  analysisFindUnique: vi.fn(),
  initiateMultipartUpload: vi.fn(),
  signMultipartPart: vi.fn(),
  completeMultipartUpload: vi.fn(),
  abortMultipartUpload: vi.fn(),
  buildMultipartObjectKey: vi.fn(),
}))

vi.mock('@/lib/csrf', () => ({ validateCsrf: mocks.validateCsrf }))
vi.mock('@/lib/auth/currentUser', () => ({
  resolveProfileId: mocks.resolveProfileId,
  isError: (result: { error?: NextResponse }) => Boolean(result.error),
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    mediaUpload: {
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
      create: mocks.create,
      update: mocks.update,
    },
    userAnalysis: { updateMany: mocks.analysisUpdateMany, findUnique: mocks.analysisFindUnique },
  },
}))
vi.mock('@/lib/storage/multipartUpload', () => ({
  initiateMultipartUpload: mocks.initiateMultipartUpload,
  signMultipartPart: mocks.signMultipartPart,
  completeMultipartUpload: mocks.completeMultipartUpload,
  abortMultipartUpload: mocks.abortMultipartUpload,
  buildMultipartObjectKey: mocks.buildMultipartObjectKey,
}))

import { POST as initiate } from '@/app/api/media-uploads/route'
import { POST as signPart } from '@/app/api/media-uploads/[uploadId]/parts/route'
import { POST as complete } from '@/app/api/media-uploads/[uploadId]/complete/route'
import { POST as abort } from '@/app/api/media-uploads/[uploadId]/abort/route'

const request = (url: string, body: unknown) => new NextRequest(url, {
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
})

const context = { params: { uploadId: 'db-upload-1' } }

describe('authenticated multipart media upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.validateCsrf.mockReturnValue(null)
    mocks.resolveProfileId.mockResolvedValue({ profileId: 'profile-1' })
    mocks.findUnique.mockResolvedValue(null)
    mocks.findFirst.mockResolvedValue({
      id: 'db-upload-1',
      userProfileId: 'profile-1',
      clientSessionId: 'session-1',
      objectKey: 'user-uploads/profile-1/videos/key.mov',
      storageUploadId: 's3-upload-1',
      contentType: 'video/quicktime',
      status: 'pending',
    })
    mocks.buildMultipartObjectKey.mockReturnValue('user-uploads/profile-1/videos/key.mov')
    mocks.initiateMultipartUpload.mockResolvedValue({ storageUploadId: 's3-upload-1' })
    mocks.create.mockResolvedValue({
      id: 'db-upload-1',
      objectKey: 'user-uploads/profile-1/videos/key.mov',
      status: 'pending',
    })
    mocks.signMultipartPart.mockResolvedValue('https://signed.test/part-1')
    mocks.completeMultipartUpload.mockResolvedValue({
      url: 'https://media.test/key.mov',
      eTag: 'complete-etag',
    })
    mocks.update.mockResolvedValue({ id: 'db-upload-1', status: 'complete' })
    mocks.analysisUpdateMany.mockResolvedValue({ count: 1 })
    mocks.analysisFindUnique.mockResolvedValue({ id: 'analysis-1' })
    mocks.abortMultipartUpload.mockResolvedValue(undefined)
  })

  it('requires CSRF before initiating storage state', async () => {
    mocks.validateCsrf.mockReturnValue(NextResponse.json({ error: 'csrf' }, { status: 403 }))
    const response = await initiate(request('http://shotiq.test/api/media-uploads', {
      clientSessionId: 'session-1', fileName: 'shot.mov', contentType: 'video/quicktime', sizeBytes: 12_000_000,
    }))

    expect(response.status).toBe(403)
    expect(mocks.initiateMultipartUpload).not.toHaveBeenCalled()
  })

  it('rejects unsafe filenames and non-video content', async () => {
    const response = await initiate(request('http://shotiq.test/api/media-uploads', {
      clientSessionId: 'session-1', fileName: '../shot.exe', contentType: 'application/octet-stream', sizeBytes: 100,
    }))

    expect(response.status).toBe(400)
    expect(mocks.initiateMultipartUpload).not.toHaveBeenCalled()
  })

  it('initiates a deterministic key scoped only to the signed-in profile', async () => {
    const response = await initiate(request('http://shotiq.test/api/media-uploads', {
      clientSessionId: 'session-1', fileName: 'iPhone Shot.MOV', contentType: 'video/quicktime', sizeBytes: 12_000_000,
    }))

    expect(response.status).toBe(201)
    expect(mocks.buildMultipartObjectKey).toHaveBeenCalledWith('profile-1', 'session-1', 'iPhone Shot.MOV')
    expect(mocks.initiateMultipartUpload).toHaveBeenCalledWith(expect.objectContaining({
      objectKey: 'user-uploads/profile-1/videos/key.mov',
      contentType: 'video/quicktime',
    }))
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userProfileId: 'profile-1',
        clientSessionId: 'session-1',
        sizeBytes: BigInt(12_000_000),
      }),
    }))
  })

  it('signs only an owned pending upload part', async () => {
    const response = await signPart(request('http://shotiq.test/api/media-uploads/db-upload-1/parts', {
      partNumber: 2,
    }), context)

    expect(response.status).toBe(200)
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'db-upload-1', userProfileId: 'profile-1', status: 'pending' },
    }))
    expect(mocks.signMultipartPart).toHaveBeenCalledWith(expect.objectContaining({ partNumber: 2 }))
  })

  it('returns 404 instead of signing another user upload', async () => {
    mocks.findFirst.mockResolvedValue(null)
    const response = await signPart(request('http://shotiq.test/api/media-uploads/db-upload-1/parts', {
      partNumber: 1,
    }), context)

    expect(response.status).toBe(404)
    expect(mocks.signMultipartPart).not.toHaveBeenCalled()
  })

  it('completes ordered parts and links media to only the exact analysis identity', async () => {
    const response = await complete(request('http://shotiq.test/api/media-uploads/db-upload-1/complete', {
      parts: [
        { partNumber: 2, eTag: 'etag-2' },
        { partNumber: 1, eTag: 'etag-1' },
      ],
    }), context)

    expect(response.status).toBe(200)
    expect(mocks.completeMultipartUpload).toHaveBeenCalledWith(expect.objectContaining({
      parts: [
        { partNumber: 1, eTag: 'etag-1' },
        { partNumber: 2, eTag: 'etag-2' },
      ],
    }))
    expect(mocks.analysisUpdateMany).toHaveBeenCalledWith({
      where: { userProfileId: 'profile-1', clientSessionId: 'session-1' },
      data: {
        videoUrl: 'https://media.test/key.mov',
        videoS3Path: 'user-uploads/profile-1/videos/key.mov',
      },
    })
  })

  it('aborts only the caller-owned upload', async () => {
    const response = await abort(request('http://shotiq.test/api/media-uploads/db-upload-1/abort', {}), context)

    expect(response.status).toBe(200)
    expect(mocks.abortMultipartUpload).toHaveBeenCalled()
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'aborted' },
    }))
  })
})
