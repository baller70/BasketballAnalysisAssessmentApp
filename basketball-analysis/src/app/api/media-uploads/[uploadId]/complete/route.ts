import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { isError, resolveProfileId } from '@/lib/auth/currentUser'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { completeMultipartUpload } from '@/lib/storage/multipartUpload'

const completeSchema = z.object({
  parts: z.array(z.object({
    partNumber: z.number().int().min(1).max(10_000),
    eTag: z.string().trim().min(1).max(255),
  })).min(1).max(10_000),
})

export async function POST(request: NextRequest, { params }: { params: { uploadId: string } }) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const parsed = completeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid completed parts' }, { status: 400 })

  const upload = await prisma.mediaUpload.findFirst({
    where: { id: params.uploadId, userProfileId: resolved.profileId },
  })
  if (!upload) return NextResponse.json({ success: false, error: 'Upload not found' }, { status: 404 })
  if (upload.status === 'complete' && upload.mediaUrl) {
    return NextResponse.json({ success: true, upload: { id: upload.id, status: 'complete', mediaUrl: upload.mediaUrl } })
  }
  if (upload.status !== 'pending') {
    return NextResponse.json({ success: false, error: 'Upload is not pending' }, { status: 409 })
  }

  try {
    const seen = new Set<number>()
    const parts = [...parsed.data.parts]
      .sort((left, right) => left.partNumber - right.partNumber)
      .filter((part) => !seen.has(part.partNumber) && seen.add(part.partNumber))
    const completed = await completeMultipartUpload({
      objectKey: upload.objectKey,
      storageUploadId: upload.storageUploadId,
      parts,
    })
    const analysis = await prisma.userAnalysis.findUnique({
      where: {
        userProfileId_clientSessionId: {
          userProfileId: resolved.profileId,
          clientSessionId: upload.clientSessionId,
        },
      },
      select: { id: true },
    })
    await prisma.mediaUpload.update({
      where: { id: upload.id },
      data: {
        status: 'complete',
        completedParts: parts,
        mediaUrl: completed.url,
        completedAt: new Date(),
        analysisId: analysis?.id,
      },
    })
    await prisma.userAnalysis.updateMany({
      where: { userProfileId: resolved.profileId, clientSessionId: upload.clientSessionId },
      data: { videoUrl: completed.url, videoS3Path: upload.objectKey },
    })
    return NextResponse.json({ success: true, upload: { id: upload.id, status: 'complete', mediaUrl: completed.url } })
  } catch (error) {
    console.error('media-upload completion failed', error)
    return NextResponse.json({ success: false, error: 'Could not complete video upload' }, { status: 500 })
  }
}
