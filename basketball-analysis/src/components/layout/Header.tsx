"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown, BarChart3, Users, BookOpen, Settings, Trophy, Star, GraduationCap, LogOut, Share2, Twitter, Facebook, Linkedin, Download, Link2, Check, Zap } from "lucide-react"
import { useDashboardViewStore, type DashboardView } from "@/stores/dashboardViewStore"
import { useAuthStore } from "@/stores/authStore"
import { PointsDisplay } from "@/components/points/PointsDisplay"

const VIEW_OPTIONS: { value: DashboardView; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Full analytics & detailed metrics",
    icon: <Star className="w-4 h-4" />,
    color: "from-[#FF6B35] to-[#E55A2B]"
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced view for developing players",
    icon: <GraduationCap className="w-4 h-4" />,
    color: "from-slate-700 to-slate-900"
  }
]

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { view: dashboardView, setView: setDashboardView } = useDashboardViewStore()
  const { signOut, isAuthenticated, user } = useAuthStore()
  
  // Load avatar from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('user_avatar')
      if (storedAvatar) {
        setAvatarUrl(storedAvatar)
      }
    }
  }, [])
  
  // Listen for storage changes (when avatar is updated in settings)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedAvatar = localStorage.getItem('user_avatar')
      setAvatarUrl(storedAvatar)
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for same-tab updates
    const interval = setInterval(() => {
      const storedAvatar = localStorage.getItem('user_avatar')
      if (storedAvatar !== avatarUrl) {
        setAvatarUrl(storedAvatar)
      }
    }, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [avatarUrl])
  
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
    { label: "Dashboard", href: "/results/demo", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Analytics", href: "/results/demo/history", icon: BarChart3 },
    { label: "Elite Shooter", href: "/elite-shooters", icon: Users },
    { label: "Badges & Achievements", href: "/badges", icon: Trophy },
    { label: "Guide", href: "/guide", icon: BookOpen },
    { label: "Points System", href: "/points", icon: Zap },
  ]

  return (
    <header className="bg-black sticky top-0 z-50">
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
            {/* Points Display */}
            <PointsDisplay variant="header" showProgress={true} />
            
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center text-white font-bold text-base shadow-lg shadow-[#FF6B35]/20 group-hover:shadow-[#FF6B35]/40 transition-all ring-2 ring-transparent group-hover:ring-[#FF6B35]/30 overflow-hidden">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover scale-110"
                    />
                  ) : (
                    getUserInitials()
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-300 group-hover:text-[#FF6B35] transition-all ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden z-50 max-h-[85vh] overflow-y-auto transform origin-top-right transition-all">
                  {/* User Info Header */}
                  <div className="px-6 py-5 bg-gradient-to-b from-slate-50 to-white/0 border-b border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center text-white font-bold text-xl shadow-md ring-4 ring-white overflow-hidden flex-shrink-0">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt="Profile"
                            width={56}
                            height={56}
                            className="w-full h-full object-cover scale-110"
                          />
                        ) : (
                          getUserInitials()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-bold text-lg leading-tight truncate">
                          {user?.displayName || user?.firstName || 'Player'}
                        </p>
                        <p className="text-slate-500 text-sm font-medium truncate">
                          {user?.email || 'View your profile'}
                        </p>
                      </div>
                    </div>
                  
                  {/* Dashboard View Selector */}
                  <div className="px-4 py-5 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-slate-400 text-xs uppercase tracking-widest mb-3 px-2 font-bold">Dashboard Mode</p>
                    <div className="flex bg-slate-200/50 p-1.5 rounded-2xl">
                      {VIEW_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setDashboardView(option.value)
                            setIsProfileOpen(false)
                            router.push('/results/demo')
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            dashboardView === option.value
                              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                          }`}
                        >
                          {dashboardView === option.value && <span className="text-base">{option.icon}</span>}
                          <span>{option.value === 'professional' ? 'Pro' : option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    {profileMenuItems.map((item) => {
                      const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsProfileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all ${
                            isActive 
                              ? 'bg-[#FF6B35]/10 text-[#FF6B35] font-bold' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-[#FF6B35]' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                    
                    <div className="h-px bg-slate-100 my-2 mx-2" />
                    
                    {/* Share Results Section */}
                    <div>
                      <button
                        onClick={() => setIsShareOpen(!isShareOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 mb-1 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center gap-3">
                          <Share2 className="w-5 h-5 text-slate-400" />
                          <span>Share</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isShareOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Share Submenu */}
                      {isShareOpen && (
                        <div className="bg-slate-50 mx-2 mb-2 rounded-lg overflow-hidden border border-slate-200">
                          {/* Social Share Buttons */}
                          <div className="grid grid-cols-3 gap-1 p-2">
                            <button
                              onClick={() => handleShare('twitter')}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-white hover:bg-[#1DA1F2]/10 border border-slate-200 hover:border-[#1DA1F2]/50 transition-all group"
                            >
                              <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                              <span className="text-[10px] text-slate-500 group-hover:text-[#1DA1F2]">Twitter</span>
                            </button>
                            <button
                              onClick={() => handleShare('facebook')}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-white hover:bg-[#4267B2]/10 border border-slate-200 hover:border-[#4267B2]/50 transition-all group"
                            >
                              <Facebook className="w-5 h-5 text-[#4267B2]" />
                              <span className="text-[10px] text-slate-500 group-hover:text-[#4267B2]">Facebook</span>
                            </button>
                            <button
                              onClick={() => handleShare('linkedin')}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-white hover:bg-[#0077B5]/10 border border-slate-200 hover:border-[#0077B5]/50 transition-all group"
                            >
                              <Linkedin className="w-5 h-5 text-[#0077B5]" />
                              <span className="text-[10px] text-slate-500 group-hover:text-[#0077B5]">LinkedIn</span>
                            </button>
                          </div>
                          
                          {/* Download & Copy Link */}
                          <div className="border-t border-slate-100 p-2 space-y-1">
                            <button
                              onClick={handleDownload}
                              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              <Download className="w-4 h-4 text-slate-400" />
                              <span>Download</span>
                            </button>
                            <button
                              onClick={handleCopyLink}
                              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-sm font-medium"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-4 h-4 text-green-500" />
                                  <span className="text-green-600">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4 text-slate-400" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="h-px bg-slate-100 my-2 mx-2" />
                    
                    {/* Sign Out Button */}
                    <div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 font-medium transition-colors whitespace-nowrap"
                      >
                        <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                        <span>Logout</span>
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

