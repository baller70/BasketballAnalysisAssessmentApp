import type {
  CreateCaptureSessionInput,
  UpdateCaptureSessionInput,
} from "@/lib/api/captureSessions"

export interface CaptureSessionRecord {
  id: string
  readinessStatus: string
  startedAt: string
  endedAt?: string | null
  [key: string]: unknown
}

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || `Capture session request failed (${response.status})`)
  }
  return result
}

export async function createCaptureSession(
  input: CreateCaptureSessionInput
): Promise<CaptureSessionRecord> {
  const response = await fetch("/api/capture-sessions", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
  const result = await readResponse<{ captureSession: CaptureSessionRecord }>(response)
  return result.captureSession
}

export async function updateCaptureSession(
  id: string,
  input: UpdateCaptureSessionInput
): Promise<CaptureSessionRecord> {
  const response = await fetch(`/api/capture-sessions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
  const result = await readResponse<{ captureSession: CaptureSessionRecord }>(response)
  return result.captureSession
}

export async function getCaptureSession(id: string): Promise<CaptureSessionRecord> {
  const response = await fetch(`/api/capture-sessions/${encodeURIComponent(id)}`, {
    credentials: "include",
  })
  const result = await readResponse<{ captureSession: CaptureSessionRecord }>(response)
  return result.captureSession
}

export async function listCaptureSessions(limit = 20): Promise<CaptureSessionRecord[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)))
  const response = await fetch(`/api/capture-sessions?limit=${safeLimit}`, {
    credentials: "include",
  })
  const result = await readResponse<{ captureSessions: CaptureSessionRecord[] }>(response)
  return result.captureSessions
}
