import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { isError, resolveProfileId } from '@/lib/auth/currentUser'
import { validateCsrf } from '@/lib/csrf'
import { FILE_LIMITS } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import {
  buildMultipartObjectKey,
  initiateMultipartUpload,
} from '@/lib/storage/multipartUpload'

const initiateSchema = z.object({
  clientSessionId: z.string().trim().min(1).max(191),
  fileName: z.string().trim().min(1).max(255)
    .refine((value) => !/[\\/]/.test(value) && /\.(mp4|mov|webm|m4v)$/i.test(value), 'Unsupported video filename'),
  contentType: z.enum(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']),
  sizeBytes: z.number().int().positive().max(FILE_LIMITS.MAX_VIDEO_SIZE_BYTES),
})

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const parsed = initiateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid video upload', issues: parsed.error.issues }, { status: 400 })
  }
  const { clientSessionId, fileName, contentType, sizeBytes } = parsed.data

  try {
    const existing = await prisma.mediaUpload.findUnique({
      where: {
        userProfileId_clientSessionId: {
          userProfileId: resolved.profileId,
          clientSessionId,
        },
      },
    })
    if (existing && existing.status !== 'aborted' && existing.status !== 'failed') {
      return NextResponse.json({
        success: true,
        upload: {
          id: existing.id,
          objectKey: existing.objectKey,
          status: existing.status,
          mediaUrl: existing.mediaUrl,
        },
      })
    }

    const objectKey = buildMultipartObjectKey(resolved.profileId, clientSessionId, fileName)
    const storage = await initiateMultipartUpload({ objectKey, contentType })
    const data = {
        userProfileId: resolved.profileId,
        clientSessionId,
        fileName,
        contentType,
        sizeBytes: BigInt(sizeBytes),
        objectKey,
        storageUploadId: storage.storageUploadId,
        status: 'pending',
        completedParts: undefined,
        mediaUrl: undefined,
        completedAt: undefined,
      }
    const upload = existing
      ? await prisma.mediaUpload.update({ where: { id: existing.id }, data })
      : await prisma.mediaUpload.create({ data })
    return NextResponse.json({
      success: true,
      upload: { id: upload.id, objectKey: upload.objectKey, status: upload.status },
    }, { status: 201 })
  } catch (error) {
    console.error('media-upload initiate failed', error)
    return NextResponse.json({ success: false, error: 'Could not start video upload' }, { status: 500 })
  }
}
