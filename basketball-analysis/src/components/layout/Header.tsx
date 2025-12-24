"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Activity, User, ChevronDown, Upload, BarChart3, Users, BookOpen, Settings, Trophy } from "lucide-react"

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
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
            <div className="w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center">
              <Activity className="w-7 h-7 text-[#1a1a1a]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#FFD700] uppercase tracking-wider">
                BASKETBALL SHOOTING MECHANICS ANALYSIS
              </h1>
              <p className="text-sm text-[#E5E5E5] uppercase tracking-wide">
                Advanced Biomechanical Analysis with Visual Tracking
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 text-[#E5E5E5] hover:text-[#FFD700] transition-colors font-medium uppercase tracking-wider"
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
                        className="flex items-center gap-3 px-4 py-3 text-[#E5E5E5] hover:bg-[#3a3a3a] hover:text-[#FFD700] transition-colors"
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

