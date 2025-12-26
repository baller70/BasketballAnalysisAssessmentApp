"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Activity, User, ChevronDown, Upload, BarChart3, Users, BookOpen, Settings, Trophy, Star, Sparkles, GraduationCap } from "lucide-react"
import { useDashboardViewStore, type DashboardView } from "@/stores/dashboardViewStore"

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

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const viewDropdownRef = useRef<HTMLDivElement>(null)
  const { view: dashboardView, setView: setDashboardView } = useDashboardViewStore()
  
  const currentOption = VIEW_OPTIONS.find(opt => opt.value === dashboardView) || VIEW_OPTIONS[0]

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setIsViewOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const profileMenuItems = [
    { label: "My Profile", href: "/profile", icon: User },
    { label: "Upload", href: "/", icon: Upload },
    { label: "Results", href: "/results/demo", icon: BarChart3 },
    { label: "Elite Shooter", href: "/elite-shooters", icon: Users },
    { label: "Guide", href: "/guide", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Badges & Achievements", href: "/badges", icon: Trophy },
  ]

  return (
    <header className="bg-[#2C2C2C] sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center">
              <Activity className="w-7 h-7 text-[#1a1a1a]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#FF6B35] uppercase tracking-wider">
                BASKETBALL SHOOTING MECHANICS ANALYSIS
              </h1>
              <p className="text-sm text-[#E5E5E5] uppercase tracking-wide">
                Advanced Biomechanical Analysis with Visual Tracking
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            {/* Dashboard View Selector */}
            <div className="relative" ref={viewDropdownRef}>
              <button
                onClick={() => setIsViewOpen(!isViewOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg hover:bg-[#4a4a4a] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${currentOption.color} flex items-center justify-center text-white`}>
                    {currentOption.icon}
                  </div>
                  <span className="text-[#E5E5E5] font-medium text-sm">{currentOption.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#888] transition-transform ${isViewOpen ? "rotate-180" : ""}`} />
              </button>

              {/* View Dropdown Menu */}
              {isViewOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2">
                    <div className="text-[#888] text-xs uppercase tracking-wider px-2 py-1 mb-1">
                      Dashboard View
                    </div>
                    {VIEW_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDashboardView(option.value)
                          setIsViewOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                          dashboardView === option.value
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
                            {dashboardView === option.value && (
                              <span className="text-[10px] bg-[#FF6B35] text-[#1a1a1a] px-1.5 py-0.5 rounded font-bold">
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

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 text-[#E5E5E5] hover:text-[#FF6B35] transition-colors font-medium uppercase tracking-wider"
              >
                <User className="w-5 h-5" />
                PROFILE
                <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#2C2C2C] border border-[#3a3a3a] rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="py-2">
                    {profileMenuItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-[#E5E5E5] hover:bg-[#3a3a3a] hover:text-[#FF6B35] transition-colors"
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

