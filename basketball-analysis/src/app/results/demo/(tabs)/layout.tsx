"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Activity, AlertTriangle, User, Users, ClipboardList, Target, BarChart3 } from "lucide-react"

const TAB_CONFIG: Record<string, { label: string; icon: typeof Activity }> = {
  analysis: { label: "Analysis", icon: Activity },
  flaws: { label: "Flaws", icon: AlertTriangle },
  player: { label: "Player", icon: User },
  compare: { label: "Compare", icon: Users },
  training: { label: "Training", icon: ClipboardList },
  goals: { label: "Goals", icon: Target },
}

// Analytics is a separate page accessible from dropdown, not shown in bottom tabs
const ANALYTICS_CONFIG = { label: "Analytics", icon: BarChart3 }

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const currentTab = pathname?.split("/").pop() || ""
  // Check both TAB_CONFIG and ANALYTICS_CONFIG for the current tab
  const tabConfig = TAB_CONFIG[currentTab] || (currentTab === 'history' ? ANALYTICS_CONFIG : null)
  const TabIcon = tabConfig?.icon || Activity

  // Check if we're on the analytics/history page (no floating header, everything in page content)
  const isAnalyticsPage = currentTab === 'history'

  return (
    <div className="min-h-screen bg-[#050505] pb-24">
      {/* Sticky Header with Back Button - NOT shown for analytics page */}
      {!isAnalyticsPage && (
        <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#2a2a2a]">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Back to Dashboard */}
              <Link 
                href="/results/demo" 
                className="flex items-center gap-2 text-[#888] hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center group-hover:border-[#FF6B35]/50 group-hover:bg-[#FF6B35]/10 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </Link>
              
              {/* Divider */}
              <div className="h-6 w-px bg-[#333]" />
              
              {/* Current Tab Title */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center">
                  <TabIcon className="w-4 h-4 text-[#FF6B35]" />
                </div>
                <h1 className="text-white font-bold text-lg uppercase tracking-wider">
                  {tabConfig?.label || "Dashboard"}
                </h1>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Page Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
      
      {/* Bottom Tab Navigation - Fixed at bottom, exactly like main dashboard */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-6 h-16 md:h-[72px]">
            {Object.entries(TAB_CONFIG).map(([id, config]) => {
              const isActive = currentTab === id
              const Icon = config.icon
              return (
                <Link
                  key={id}
                  href={`/results/demo/${id}`}
                  className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                    isActive 
                      ? "text-[#FF6B35]" 
                      : "text-[#888] hover:text-[#ccc]"
                  }`}
                >
                  {/* Active indicator bar at top */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#FF6B35]" />
                  )}
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? "scale-110" : ""} transition-transform`} />
                  <span className={`text-[10px] md:text-xs font-medium ${isActive ? "font-bold" : ""}`}>
                    {config.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

