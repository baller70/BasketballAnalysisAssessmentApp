"use client"

import React, { useState } from "react"
import HistoricalDataSection from "@/components/analytics/HistoricalDataSection"
import { AnalyticsCardGame } from "@/components/analytics/AnalyticsCardGame"
import { ArrowLeft, BarChart3, Layers, Table2 } from "lucide-react"
import Link from "next/link"

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<'cards' | 'detailed'>('cards')

  return (
    <div className="space-y-8">
      {/* Page Header - Back button and Title inside the page */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Back to Dashboard */}
          <Link 
            href="/results/demo" 
            className="flex items-center text-slate-500 hover:text-slate-900 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-[#FF6B35]/50 group-hover:bg-[#FF6B35]/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
          </Link>
          
          {/* Divider */}
          <div className="h-8 w-px bg-slate-200" />
          
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wider">Analytics</h1>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
              viewMode === 'cards'
                ? 'bg-[#FF6B35] text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
              viewMode === 'detailed'
                ? 'bg-[#FF6B35] text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Table2 className="w-4 h-4" />
            <span className="hidden sm:inline">Detailed</span>
          </button>
        </div>
      </div>

      {/* Conditional Content Based on View Mode */}
      {viewMode === 'cards' ? (
        <AnalyticsCardGame />
      ) : (
        <HistoricalDataSection />
      )}
    </div>
  )
}
