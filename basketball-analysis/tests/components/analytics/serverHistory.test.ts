import { describe, expect, it } from 'vitest'
import {
  buildHistoricalChartData,
  mergeLocalAndServerSessions,
  serverHistoryToSessions,
  type ServerHistoryEntry,
} from '@/components/analytics/serverHistory'
import type { AnalysisSession } from '@/services/sessionStorage'

function local(id: string, date: string, score: number): AnalysisSession {
  return {
    id,
    date,
    displayDate: 'Jul 16',
    timestamp: new Date(date).getTime(),
    mainImageBase64: '',
    screenshots: [],
    analysisData: {
      overallScore: score,
      shooterLevel: '',
      angles: {},
      detectedFlaws: [],
      measurements: {},
    },
    mediaType: 'image',
  }
}

function server(overrides: Partial<ServerHistoryEntry> = {}): ServerHistoryEntry {
  return {
    id: 'history-1',
    analysisId: 'analysis-1',
    clientSessionId: 'session-1',
    mediaType: 'video',
    captureSessionId: 'capture-1',
    recordedAt: '2026-07-16T12:00:00.000Z',
    scores: { overall: 80, form: 75, balance: null, release: 70, consistency: null },
    angles: { elbow: 90, knee: null, release: 48 },
    scoreChange: null,
    analysis: { id: 'analysis-1', imageUrl: '/shot.jpg', improvements: ['Elbow drift'] },
    ...overrides,
  }
}

describe('server history reconciliation', () => {
  it('maps the exact client id, media type, capture id, and persisted metrics', () => {
    const [mapped] = serverHistoryToSessions([server()])
    expect(mapped.id).toBe('session-1')
    expect(mapped.mediaType).toBe('video')
    expect(mapped.videoData?.captureSessionId).toBe('capture-1')
    expect(mapped.analysisData.measurements).toEqual({ formScore: 75, releaseScore: 70 })
    expect(mapped.analysisData.detectedFlaws).toEqual(['Elbow drift'])
  })

  it('drops malformed rows instead of fabricating a zero score', () => {
    expect(serverHistoryToSessions([server({
      scores: { overall: null, form: null, balance: null, release: null, consistency: null },
    })])).toEqual([])
  })

  it('keeps the richer local row when the client id matches exactly', () => {
    const localRow = local('session-1', '2026-07-16T12:00:00.000Z', 80)
    const mapped = serverHistoryToSessions([server()])
    expect(mergeLocalAndServerSessions([localRow], mapped)).toEqual([localRow])
  })

  it('does not collapse distinct modern sessions with the same day and score', () => {
    const localRow = local('session-1', '2026-07-16T12:00:00.000Z', 80)
    const second = serverHistoryToSessions([server({
      id: 'history-2',
      analysisId: 'analysis-2',
      clientSessionId: 'session-2',
    })])
    expect(mergeLocalAndServerSessions([localRow], second).map((row) => row.id).sort())
      .toEqual(['session-1', 'session-2'])
  })

  it('uses a multiset fallback for legacy same-day rows', () => {
    const locals = [local('local-a', '2026-07-16T10:00:00.000Z', 80)]
    const legacy = serverHistoryToSessions([
      server({ id: 'h1', analysisId: 'a1', clientSessionId: null }),
      server({ id: 'h2', analysisId: 'a2', clientSessionId: null }),
    ])
    const merged = mergeLocalAndServerSessions(locals, legacy)
    expect(merged).toHaveLength(2)
    expect(merged.filter((row) => row.id.startsWith('server-'))).toHaveLength(1)
  })
})

describe('buildHistoricalChartData', () => {
  it('averages only measured values and leaves missing metrics null', () => {
    const rows = buildHistoricalChartData([
      {
        date: new Date('2026-07-16T10:00:00Z'), score: 80, elbowAngle: 90,
        kneeAngle: null, releaseAngle: null, consistency: null,
        formScore: 70, balanceScore: null, releaseScore: null,
      },
      {
        date: new Date('2026-07-16T18:00:00Z'), score: 90, elbowAngle: null,
        kneeAngle: null, releaseAngle: null, consistency: null,
        formScore: 80, balanceScore: null, releaseScore: null,
      },
    ])
    expect(rows[0]).toEqual(expect.objectContaining({
      sessionCount: 2,
      score: 85,
      elbowAngle: 90,
      kneeAngle: null,
      formScore: 75,
      balanceScore: null,
    }))
  })

  it('orders chart days chronologically', () => {
    const metric = (date: string) => ({
      date: new Date(date), score: 80, elbowAngle: null, kneeAngle: null,
      releaseAngle: null, consistency: null, formScore: null,
      balanceScore: null, releaseScore: null,
    })
    const rows = buildHistoricalChartData([
      metric('2026-07-17T00:00:00Z'),
      metric('2026-07-15T00:00:00Z'),
    ])
    expect(rows.map((row) => row.date.toISOString().slice(0, 10)))
      .toEqual(['2026-07-15', '2026-07-17'])
  })
})
