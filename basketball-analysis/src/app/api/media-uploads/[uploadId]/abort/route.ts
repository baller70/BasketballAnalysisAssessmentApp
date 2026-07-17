import { NextRequest, NextResponse } from 'next/server'

import { isError, resolveProfileId } from '@/lib/auth/currentUser'
import { validateCsrf } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'
import { abortMultipartUpload } from '@/lib/storage/multipartUpload'

export async function POST(request: NextRequest, { params }: { params: { uploadId: string } }) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const upload = await prisma.mediaUpload.findFirst({
    where: { id: params.uploadId, userProfileId: resolved.profileId },
  })
  if (!upload) return NextResponse.json({ success: false, error: 'Upload not found' }, { status: 404 })
  if (upload.status === 'aborted') return NextResponse.json({ success: true })
  if (upload.status !== 'pending') {
    return NextResponse.json({ success: false, error: 'Upload is not pending' }, { status: 409 })
  }

  try {
    await abortMultipartUpload({
      objectKey: upload.objectKey,
      storageUploadId: upload.storageUploadId,
    })
    await prisma.mediaUpload.update({ where: { id: upload.id }, data: { status: 'aborted' } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('media-upload abort failed', error)
    return NextResponse.json({ success: false, error: 'Could not abort video upload' }, { status: 500 })
  }
}
