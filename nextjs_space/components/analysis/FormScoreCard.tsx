"use client"

import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Target } from 'lucide-react'

export interface MetricScore {
  name: string
  value: number
  optimalMin: number
  optimalMax: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  description: string
}

export interface PriorityIssue {
  rank: number
  title: string
  description: string
  severity: 'critical' | 'moderate' | 'minor'
  recommendation: string
}

interface FormScoreCardProps {
  overallScore: number
  category: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL'
  metrics: MetricScore[]
  priorityIssues: PriorityIssue[]
  confidence: number
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#84cc16'
  if (score >= 55) return '#eab308'
  return '#ef4444'
}

function getStatusIcon(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    case 'critical': return <XCircle className="w-4 h-4 text-red-500" />
  }
}

function getSeverityBadge(severity: 'critical' | 'moderate' | 'minor') {
  const colors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    moderate: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    minor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[severity]}`}>
      {severity.toUpperCase()}
    </span>
  )
}

export function FormScoreCard({
  overallScore,
  category,
  metrics,
  priorityIssues,
  confidence,
}: FormScoreCardProps) {
  const scoreColor = getScoreColor(overallScore)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (overallScore / 100) * circumference

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] px-4 py-3 border-b border-[#3a3a3a]">
        <div className="flex items-center justify-between">
          <h3 className="text-[#FFD700] font-bold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Form Analysis Score
          </h3>
          <span className="text-xs text-[#888]">
            Confidence: {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Score Gauge */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90">
              <circle cx="56" cy="56" r="45" stroke="#3a3a3a" strokeWidth="10" fill="none" />
              <circle
                cx="56" cy="56" r="45"
                stroke={scoreColor}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: scoreColor }}>
                {overallScore}
              </span>
              <span className="text-xs text-[#888]">/ 100</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-white mb-1">
              {category.replace('_', ' ')}
            </div>
            <p className="text-sm text-[#888]">
              {category === 'EXCELLENT' && 'Your shooting form is elite-level!'}
              {category === 'GOOD' && 'Solid fundamentals with room to refine.'}
              {category === 'NEEDS_IMPROVEMENT' && 'Several areas need attention.'}
              {category === 'CRITICAL' && 'Significant form issues detected.'}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-[#E5E5E5] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FFD700]" />
            Key Measurements
          </h4>
          <div className="space-y-3">
            {metrics.slice(0, 5).map((metric, index) => (
              <div key={index} className="bg-[#2a2a2a] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(metric.status)}
                    <span className="text-sm text-white">{metric.name}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-white">
                    {metric.value}{metric.unit}
                  </span>
                </div>
                {/* Optimal range bar */}
                <div className="relative h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
                  {/* Optimal zone indicator */}
                  <div
                    className="absolute h-full bg-green-500/30"
                    style={{
                      left: `${(metric.optimalMin / 180) * 100}%`,
                      width: `${((metric.optimalMax - metric.optimalMin) / 180) * 100}%`,
                    }}
                  />
                  {/* Current value marker */}
                  <div
                    className="absolute w-2 h-2 rounded-full top-0 -translate-x-1/2"
                    style={{
                      left: `${(metric.value / 180) * 100}%`,
                      backgroundColor: metric.status === 'good' ? '#22c55e' :
                                       metric.status === 'warning' ? '#eab308' : '#ef4444',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[#666]">0{metric.unit}</span>
                  <span className="text-[10px] text-green-500">
                    Optimal: {metric.optimalMin}-{metric.optimalMax}{metric.unit}
                  </span>
                  <span className="text-[10px] text-[#666]">180{metric.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Issues */}
        {priorityIssues.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-[#E5E5E5] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFD700]" />
              Priority Fix List
            </h4>
            <div className="space-y-2">
              {priorityIssues.map((issue) => (
                <div
                  key={issue.rank}
                  className="bg-gradient-to-r from-[#2a2a2a] to-[#252525] rounded-lg p-3 border-l-4"
                  style={{
                    borderColor: issue.severity === 'critical' ? '#ef4444' :
                                 issue.severity === 'moderate' ? '#f97316' : '#eab308'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#3a3a3a] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {issue.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{issue.title}</span>
                        {getSeverityBadge(issue.severity)}
                      </div>
                      <p className="text-xs text-[#888] mb-2">{issue.description}</p>
                      <div className="bg-[#1a1a1a] rounded px-2 py-1.5">
                        <span className="text-xs text-[#FFD700]">💡 </span>
                        <span className="text-xs text-[#aaa]">{issue.recommendation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

