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

export interface CaptureSessionRequestOptions {
  /** Optional caller cancellation (for example when a component unmounts). */
  signal?: AbortSignal
  /** Maximum time spent waiting on the API; late callers can reconcile locally. */
  timeoutMs?: number
}

const DEFAULT_CAPTURE_REQUEST_TIMEOUT_MS = 10_000

async function fetchCaptureSession(
  input: RequestInfo | URL,
  init: RequestInit,
  options: CaptureSessionRequestOptions = {},
): Promise<Response> {
  const controller = new AbortController()
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(250, Math.floor(options.timeoutMs as number))
    : DEFAULT_CAPTURE_REQUEST_TIMEOUT_MS
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const forwardAbort = () => controller.abort(options.signal?.reason)
  options.signal?.addEventListener('abort', forwardAbort, { once: true })

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', forwardAbort)
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || `Capture session request failed (${response.status})`)
  }
  return result
}

export async function createCaptureSession(
  input: CreateCaptureSessionInput,
  options?: CaptureSessionRequestOptions,
): Promise<CaptureSessionRecord> {
  const response = await fetchCaptureSession("/api/capture-sessions", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  }, options)
  const result = await readResponse<{ captureSession: CaptureSessionRecord }>(response)
  return result.captureSession
}

export async function updateCaptureSession(
  id: string,
  input: UpdateCaptureSessionInput,
  options?: CaptureSessionRequestOptions,
): Promise<CaptureSessionRecord> {
  const response = await fetchCaptureSession(`/api/capture-sessions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  }, options)
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
