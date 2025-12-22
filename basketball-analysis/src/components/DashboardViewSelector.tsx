"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, Star, Sparkles, GraduationCap } from "lucide-react"

export type DashboardView = "professional" | "standard" | "basic"

interface DashboardViewSelectorProps {
  currentView: DashboardView
  onViewChange: (view: DashboardView) => void
}

const VIEW_OPTIONS: { value: DashboardView; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Full analytics & detailed metrics",
    icon: <Star className="w-4 h-4" />,
    color: "from-purple-500 to-violet-600"
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced view for developing players",
    icon: <GraduationCap className="w-4 h-4" />,
    color: "from-blue-500 to-cyan-600"
  },
  {
    value: "basic",
    label: "Basic",
    description: "Simple & fun for young players",
    icon: <Sparkles className="w-4 h-4" />,
    color: "from-green-500 to-emerald-600"
  }
]

export function DashboardViewSelector({ currentView, onViewChange }: DashboardViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentOption = VIEW_OPTIONS.find(opt => opt.value === currentView) || VIEW_OPTIONS[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${currentOption.color} flex items-center justify-center text-white`}>
            {currentOption.icon}
          </div>
          <span className="text-[#E5E5E5] font-medium text-sm">{currentOption.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#888] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu - positioned to the right so it doesn't get cut off */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2">
            <div className="text-[#888] text-xs uppercase tracking-wider px-2 py-1 mb-1">
              Dashboard View
            </div>
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onViewChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  currentView === option.value
                    ? "bg-[#3a3a3a]"
                    : "hover:bg-[#333333]"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center text-white shadow-lg`}>
                  {option.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[#E5E5E5] font-semibold">{option.label}</span>
                    {currentView === option.value && (
                      <span className="text-[10px] bg-[#FFD700] text-[#1a1a1a] px-1.5 py-0.5 rounded font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[#888] text-xs">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Info Footer */}
          <div className="px-4 py-3 bg-[#1a1a1a] border-t border-[#3a3a3a]">
            <p className="text-[#666] text-xs">
              Choose a view that matches your experience level. You can switch anytime!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook to persist dashboard view preference
export function useDashboardView() {
  const [view, setView] = useState<DashboardView>("professional")

  useEffect(() => {
    const savedView = localStorage.getItem("dashboard_view") as DashboardView | null
    if (savedView && ["professional", "standard", "basic"].includes(savedView)) {
      setView(savedView)
    }
  }, [])

  const changeView = (newView: DashboardView) => {
    setView(newView)
    localStorage.setItem("dashboard_view", newView)
  }

  return { view, changeView }
}

