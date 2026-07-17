import { createHash } from 'crypto'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import {
  getS3Url,
  S3_CONFIG,
  s3Client,
  withKeyPrefix,
} from '@/lib/storage/s3Client'

export interface MultipartPart {
  partNumber: number
  eTag: string
}

const safeExtension = (fileName: string): string => {
  const extension = fileName.toLowerCase().match(/\.(mp4|mov|webm|m4v)$/)?.[1]
  return extension ?? 'mp4'
}

/** Stable, opaque, caller-scoped key; filenames never become path segments. */
export function buildMultipartObjectKey(
  userProfileId: string,
  clientSessionId: string,
  fileName: string,
): string {
  const digest = createHash('sha256')
    .update(`${userProfileId}\0${clientSessionId}`)
    .digest('hex')
    .slice(0, 32)
  return `user-uploads/${userProfileId}/videos/${digest}.${safeExtension(fileName)}`
}

export async function initiateMultipartUpload(input: {
  objectKey: string
  contentType: string
}): Promise<{ storageUploadId: string }> {
  const response = await s3Client.send(new CreateMultipartUploadCommand({
    Bucket: S3_CONFIG.bucket,
    Key: withKeyPrefix(input.objectKey),
    ContentType: input.contentType,
  }))
  if (!response.UploadId) throw new Error('Object storage did not return a multipart upload id')
  return { storageUploadId: response.UploadId }
}

export async function signMultipartPart(input: {
  objectKey: string
  storageUploadId: string
  partNumber: number
}): Promise<string> {
  return getSignedUrl(s3Client, new UploadPartCommand({
    Bucket: S3_CONFIG.bucket,
    Key: withKeyPrefix(input.objectKey),
    UploadId: input.storageUploadId,
    PartNumber: input.partNumber,
  }), { expiresIn: 15 * 60 })
}

export async function completeMultipartUpload(input: {
  objectKey: string
  storageUploadId: string
  parts: MultipartPart[]
}): Promise<{ url: string; eTag?: string }> {
  const response = await s3Client.send(new CompleteMultipartUploadCommand({
    Bucket: S3_CONFIG.bucket,
    Key: withKeyPrefix(input.objectKey),
    UploadId: input.storageUploadId,
    MultipartUpload: {
      Parts: input.parts.map((part) => ({ ETag: part.eTag, PartNumber: part.partNumber })),
    },
  }))
  return {
    url: getS3Url(withKeyPrefix(input.objectKey)),
    eTag: response.ETag,
  }
}

export async function abortMultipartUpload(input: {
  objectKey: string
  storageUploadId: string
}): Promise<void> {
  await s3Client.send(new AbortMultipartUploadCommand({
    Bucket: S3_CONFIG.bucket,
    Key: withKeyPrefix(input.objectKey),
    UploadId: input.storageUploadId,
  }))
}
