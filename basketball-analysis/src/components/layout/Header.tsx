"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { User, ChevronDown, Upload, BarChart3, Users, BookOpen, Settings, Trophy, Star, Sparkles, GraduationCap, LogOut, Share2, Twitter, Facebook, Linkedin, Download, Link2, Check, Clock } from "lucide-react"
import { useDashboardViewStore, type DashboardView } from "@/stores/dashboardViewStore"
import { useAuthStore } from "@/stores/authStore"

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
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { view: dashboardView, setView: setDashboardView } = useDashboardViewStore()
  const { signOut, isAuthenticated, user } = useAuthStore()
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user?.displayName) {
      const names = user.displayName.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return user.displayName.substring(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }
  
  // Check if we're on an auth page (signin/signup)
  const isAuthPage = pathname === '/signin' || pathname === '/signup'
  
  const handleSignOut = () => {
    signOut()
    setIsProfileOpen(false)
    router.push('/signin')
  }

  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.origin + '/results/demo' : ''
    const text = 'Check out my basketball shooting analysis from SHOTIQ AI! 🏀'
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
    setIsProfileOpen(false)
    setIsShareOpen(false)
  }

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin + '/results/demo' : ''
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    // Trigger download of results - this would need to be connected to actual download functionality
    router.push('/results/demo?download=true')
    setIsProfileOpen(false)
    setIsShareOpen(false)
  }

  // Close dropdowns when clicking outside
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
    { label: "History", href: "/results/demo?tab=history", icon: Clock },
    { label: "Elite Shooter", href: "/elite-shooters", icon: Users },
    { label: "Guide", href: "/guide", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Badges & Achievements", href: "/badges", icon: Trophy },
  ]

  return (
    <header className="bg-[#2C2C2C] sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href={isAuthPage ? "/signin" : "/"} className="flex items-center">
            <Image
              src="/images/shotiq-header-logo.png"
              alt="SHOTIQ AI Analysis"
              width={862}
              height={260}
              className="h-12 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>

          {/* Only show navigation when NOT on auth pages */}
          {!isAuthPage && isAuthenticated && (
          <nav className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#FF6B35]/20 group-hover:shadow-[#FF6B35]/40 transition-all ring-2 ring-transparent group-hover:ring-[#FF6B35]/30">
                  {getUserInitials()}
                </div>
                <ChevronDown className={`w-4 h-4 text-[#888] group-hover:text-[#FF6B35] transition-all ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-[#2C2C2C] border border-[#3a3a3a] rounded-xl shadow-xl overflow-hidden z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-4 bg-gradient-to-r from-[#FF6B35]/10 to-transparent border-b border-[#3a3a3a]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {getUserInitials()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">
                          {user?.displayName || user?.firstName || 'Player'}
                        </p>
                        <p className="text-[#888] text-xs truncate">
                          {user?.email || 'View your profile'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard View Selector */}
                  <div className="px-3 py-3 border-b border-[#3a3a3a]">
                    <p className="text-[#666] text-[10px] uppercase tracking-wider mb-2 px-1">Dashboard View</p>
                    <div className="flex gap-1">
                      {VIEW_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setDashboardView(option.value)}
                          className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            dashboardView === option.value
                              ? `bg-gradient-to-br ${option.color} text-white shadow-lg`
                              : 'bg-[#2a2a2a] text-[#888] hover:bg-[#3a3a3a] hover:text-white'
                          }`}
                        >
                          <span className="text-base">{option.icon}</span>
                          <span className="text-[10px]">{option.label.substring(0, 3)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
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
                    
                    {/* Share Results Section */}
                    <div className="border-t border-[#3a3a3a] mt-2 pt-2">
                      <button
                        onClick={() => setIsShareOpen(!isShareOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-[#E5E5E5] hover:bg-[#3a3a3a] hover:text-[#FF6B35] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Share2 className="w-5 h-5" />
                          <span className="font-medium">Share Results</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isShareOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Share Submenu */}
                      {isShareOpen && (
                        <div className="bg-[#1a1a1a] mx-2 mb-2 rounded-lg overflow-hidden">
                          {/* Social Share Buttons */}
                          <div className="grid grid-cols-3 gap-1 p-2">
                            <button
                              onClick={() => handleShare('twitter')}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[#2a2a2a] hover:bg-[#1DA1F2]/20 border border-[#3a3a3a] hover:border-[#1DA1F2]/50 transition-all group"
                            >
                              <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                              <span className="text-[10px] text-[#888] group-hover:text-[#1DA1F2]">Twitter</span>
                            </button>
                            <button
                              onClick={() => handleShare('facebook')}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[#2a2a2a] hover:bg-[#4267B2]/20 border border-[#3a3a3a] hover:border-[#4267B2]/50 transition-all group"
                            >
                              <Facebook className="w-5 h-5 text-[#4267B2]" />
                              <span className="text-[10px] text-[#888] group-hover:text-[#4267B2]">Facebook</span>
                            </button>
                            <button
                              onClick={() => handleShare('linkedin')}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[#2a2a2a] hover:bg-[#0077B5]/20 border border-[#3a3a3a] hover:border-[#0077B5]/50 transition-all group"
                            >
                              <Linkedin className="w-5 h-5 text-[#0077B5]" />
                              <span className="text-[10px] text-[#888] group-hover:text-[#0077B5]">LinkedIn</span>
                            </button>
                          </div>
                          
                          {/* Download & Copy Link */}
                          <div className="border-t border-[#3a3a3a] p-2 space-y-1">
                            <button
                              onClick={handleDownload}
                              className="w-full flex items-center gap-3 px-3 py-2 text-[#E5E5E5] hover:bg-[#2a2a2a] rounded-lg transition-colors text-sm"
                            >
                              <Download className="w-4 h-4 text-[#888]" />
                              <span>Download Results</span>
                            </button>
                            <button
                              onClick={handleCopyLink}
                              className="w-full flex items-center gap-3 px-3 py-2 text-[#E5E5E5] hover:bg-[#2a2a2a] rounded-lg transition-colors text-sm"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-4 h-4 text-green-500" />
                                  <span className="text-green-500">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4 text-[#888]" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Sign Out Button */}
                    <div className="border-t border-[#3a3a3a] pt-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[#E5E5E5] hover:bg-[#3a3a3a] hover:text-[#FF6B35] transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
          )}
        </div>
      </div>
    </header>
  )
}

