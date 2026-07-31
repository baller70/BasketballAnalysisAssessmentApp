// Shared API contract client — same field names as the Next.js/Prisma backend.
// Short-lived access token + rotating refresh token in expo-secure-store.
import * as SecureStore from 'expo-secure-store'

const BASE = process.env.EXPO_PUBLIC_SHOTIQ_API ?? 'https://app.shotiqai.com'

export interface APIUser {
  id?: string; email?: string; displayName?: string
  firstName?: string; lastName?: string; profileComplete?: boolean
}
export interface HistoryStats {
  totalAnalyses: number; averageScore?: number | null; latestScore?: number | null
  overallTrend?: string; improvementRate?: number | null
}
export interface AnalysisSummary { title?: string; createdAt?: string; shotType?: string; score?: number }
export interface EliteShooterDTO {
  id: number; name: string; team: string; league: string; era?: string; tier?: string
  position: string; height: number; weight: number
  careerPct?: number; careerFreeThrowPct: number; approvedFormImages?: string[]
}
export interface GoalDTO { id: string; title: string; progress?: number; targetDate?: string; status?: string }

async function request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const token = await SecureStore.getItemAsync('accessToken')
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (res.status === 401 && retry) {
    await refreshTokens()
    return request<T>(path, init, false)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

async function refreshTokens(): Promise<void> {
  const refreshToken = await SecureStore.getItemAsync('refreshToken')
  if (!refreshToken) throw new Error('no refresh token')
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    throw new Error('refresh failed')
  }
  const t = (await res.json()) as { accessToken: string; refreshToken: string }
  await SecureStore.setItemAsync('accessToken', t.accessToken)
  await SecureStore.setItemAsync('refreshToken', t.refreshToken)
}

export const api = {
  async signIn(email: string, password: string): Promise<APIUser> {
    const r = await request<{ user: APIUser; accessToken?: string; refreshToken?: string }>(
      '/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) })
    if (r.accessToken) await SecureStore.setItemAsync('accessToken', r.accessToken)
    if (r.refreshToken) await SecureStore.setItemAsync('refreshToken', r.refreshToken)
    return r.user
  },
  async signOut() {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
  },
  async hasSession() { return (await SecureStore.getItemAsync('accessToken')) != null },
  async history(limit = 100) {
    const r = await request<{ success: boolean; stats?: HistoryStats; history?: AnalysisSummary[] }>(
      `/api/analysis-history?limit=${limit}`)
    return { stats: r.stats ?? null, items: r.history ?? [] }
  },
  async shooters() {
    return (await request<{ shooters: EliteShooterDTO[] }>('/api/shooters')).shooters
  },
  async goals() {
    return (await request<{ goals?: GoalDTO[] }>('/api/goals')).goals ?? []
  },
  async recordShotEvent(drillId: string, made: boolean) {
    try {
      await request('/api/shot-events', {
        method: 'POST',
        body: JSON.stringify({ drillId, result: made ? 'make' : 'miss', at: new Date().toISOString() }),
      })
    } catch { /* offline-tolerant */ }
  },
}
