"use client"

import React, { useEffect, useState } from "react"

/**
 * ProgressTracker Component
 * 
 * Visualizes user's shooting form improvement over time.
 * Shows score trends, angle improvements, and coaching insights.
 */

interface HistoryEntry {
  id: string
  analysisId: string
  recordedAt: string
  scores: {
    overall: number | null
    form: number | null
    balance: number | null
    release: number | null
    consistency: number | null
  }
  angles: {
    elbow: number | null
    knee: number | null
    release: number | null
  }
  scoreChange: number | null
}

interface ProgressStats {
  totalAnalyses: number
  averageScore: number | null
  highestScore: number | null
  lowestScore: number | null
  latestScore: number | null
  overallTrend: "improving" | "declining" | "stable" | "insufficient_data"
  improvementRate: number | null
}

interface ProgressTrackerProps {
  userProfileId: string
  className?: string
}

export function ProgressTracker({ userProfileId, className = "" }: ProgressTrackerProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<"overall" | "form" | "balance" | "release">("overall")

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analysis-history?userProfileId=${userProfileId}&limit=20`)
        const data = await response.json()

        if (data.success) {
          setHistory(data.history)
          setStats(data.stats)
          setError(null)
        } else {
          setError(data.error || "Failed to load history")
        }
      } catch {
        setError("Failed to connect to server")
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [userProfileId])

  const refetch = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analysis-history?userProfileId=${userProfileId}&limit=20`)
      const data = await response.json()

      if (data.success) {
        setHistory(data.history)
        setStats(data.stats)
        setError(null)
      } else {
        setError(data.error || "Failed to load history")
      }
    } catch {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-gray-800 rounded mb-4"></div>
          <div className="h-20 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
        <div className="text-red-400 text-center">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats || history.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Progress Tracker</h3>
        <div className="text-center py-8 text-gray-400">
          <p className="text-xl mb-2">📊</p>
          <p>No analysis history yet.</p>
          <p className="text-sm mt-1">Complete your first analysis to start tracking progress!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Progress Tracker</h3>
        <TrendBadge trend={stats.overallTrend} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Latest Score"
          value={stats.latestScore}
          suffix="/100"
          change={history[0]?.scoreChange}
        />
        <StatCard
          label="Average"
          value={stats.averageScore}
          suffix="/100"
        />
        <StatCard
          label="Best Score"
          value={stats.highestScore}
          suffix="/100"
          highlight
        />
        <StatCard
          label="Improvement Rate"
          value={stats.improvementRate}
          suffix="%"
          description="sessions improved"
        />
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2 mb-4">
        {(["overall", "form", "balance", "release"] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedMetric === metric
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <ProgressChart 
          history={history} 
          metric={selectedMetric}
        />
      </div>

      {/* Recent Sessions */}
      <div>
        <h4 className="text-md font-medium text-white mb-3">Recent Sessions</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {history.slice(0, 10).map((entry, idx) => (
            <SessionRow key={entry.id} entry={entry} isLatest={idx === 0} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  label,
  value,
  suffix,
  change,
  highlight,
  description,
}: {
  label: string
  value: number | null
  suffix?: string
  change?: number | null
  highlight?: boolean
  description?: string
}) {
  return (
    <div className={`p-4 rounded-lg ${highlight ? "bg-green-900/30 border border-green-500/30" : "bg-gray-800"}`}>
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${highlight ? "text-green-400" : "text-white"}`}>
          {value !== null ? value : "-"}
        </span>
        {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
      </div>
      {change !== null && change !== undefined && (
        <div className={`text-xs mt-1 ${change > 0 ? "text-green-400" : change < 0 ? "text-red-400" : "text-gray-500"}`}>
          {change > 0 ? "↑" : change < 0 ? "↓" : "→"} {Math.abs(change).toFixed(1)} from last
        </div>
      )}
      {description && (
        <div className="text-gray-500 text-xs mt-1">{description}</div>
      )}
    </div>
  )
}

// Trend Badge
function TrendBadge({ trend }: { trend: ProgressStats["overallTrend"] }) {
  const config = {
    improving: { color: "bg-green-500/20 text-green-400 border-green-500/50", icon: "↑", text: "Improving" },
    declining: { color: "bg-red-500/20 text-red-400 border-red-500/50", icon: "↓", text: "Needs Focus" },
    stable: { color: "bg-blue-500/20 text-blue-400 border-blue-500/50", icon: "→", text: "Stable" },
    insufficient_data: { color: "bg-gray-500/20 text-gray-400 border-gray-500/50", icon: "?", text: "More Data Needed" },
  }

  const { color, icon, text } = config[trend]

  return (
    <span className={`px-3 py-1 text-sm rounded-full border ${color}`}>
      {icon} {text}
    </span>
  )
}

// Simple Progress Chart
function ProgressChart({ 
  history, 
  metric 
}: { 
  history: HistoryEntry[]
  metric: "overall" | "form" | "balance" | "release"
}) {
  // Reverse to show oldest first (left to right)
  const chartData = [...history].reverse()
  
  // Get values for the selected metric
  const values = chartData.map(h => h.scores[metric]).filter((v): v is number => v !== null)
  
  if (values.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-500">
        No data for this metric
      </div>
    )
  }

  const maxValue = Math.max(...values, 100)
  const minValue = Math.min(...values, 0)
  const range = maxValue - minValue || 1

  return (
    <div className="h-32 flex items-end gap-1">
      {chartData.map((entry, idx) => {
        const value = entry.scores[metric]
        if (value === null) return null

        const height = ((value - minValue) / range) * 100
        const isLatest = idx === chartData.length - 1

        return (
          <div
            key={entry.id}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div className="text-xs text-gray-500">{value}</div>
            <div
              className={`w-full rounded-t transition-all ${
                isLatest ? "bg-blue-500" : "bg-gray-600"
              }`}
              style={{ height: `${Math.max(height, 5)}%` }}
              title={`${new Date(entry.recordedAt).toLocaleDateString()}: ${value}`}
            />
          </div>
        )
      })}
    </div>
  )
}

// Session Row
function SessionRow({ entry, isLatest }: { entry: HistoryEntry; isLatest: boolean }) {
  const date = new Date(entry.recordedAt)
  const scoreChange = entry.scoreChange

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isLatest ? "bg-blue-900/20 border border-blue-500/30" : "bg-gray-800"
    }`}>
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-400">
          {date.toLocaleDateString()}
        </div>
        {isLatest && (
          <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
            Latest
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-white font-medium">
            {entry.scores.overall !== null ? entry.scores.overall : "-"}
          </div>
          {scoreChange !== null && (
            <div className={`text-xs ${
              scoreChange > 0 ? "text-green-400" : 
              scoreChange < 0 ? "text-red-400" : "text-gray-500"
            }`}>
              {scoreChange > 0 ? "+" : ""}{scoreChange.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgressTracker





