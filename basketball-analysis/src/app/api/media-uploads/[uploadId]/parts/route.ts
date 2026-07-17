import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { isError, resolveProfileId } from '@/lib/auth/currentUser'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { signMultipartPart } from '@/lib/storage/multipartUpload'

const partSchema = z.object({ partNumber: z.number().int().min(1).max(10_000) })

export async function POST(request: NextRequest, { params }: { params: { uploadId: string } }) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const parsed = partSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid part number' }, { status: 400 })

  const upload = await prisma.mediaUpload.findFirst({
    where: { id: params.uploadId, userProfileId: resolved.profileId, status: 'pending' },
  })
  if (!upload) return NextResponse.json({ success: false, error: 'Upload not found' }, { status: 404 })

  try {
    const url = await signMultipartPart({
      objectKey: upload.objectKey,
      storageUploadId: upload.storageUploadId,
      partNumber: parsed.data.partNumber,
    })
    return NextResponse.json({ success: true, partNumber: parsed.data.partNumber, url })
  } catch (error) {
    console.error('media-upload part signing failed', error)
    return NextResponse.json({ success: false, error: 'Could not sign video part' }, { status: 500 })
  }
}
