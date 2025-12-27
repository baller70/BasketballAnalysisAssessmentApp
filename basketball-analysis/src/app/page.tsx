"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'

/**
 * Landing page that handles authentication routing
 * - If not authenticated: redirect to /signin
 * - If authenticated but profile incomplete: redirect to /onboarding  
 * - If authenticated with complete profile: redirect to /upload
 */
export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { profileComplete } = useProfileStore()

  useEffect(() => {
    // Wait a moment for stores to hydrate from localStorage
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/signin')
      } else if (!profileComplete && !user?.profileComplete) {
        router.replace('/onboarding')
      } else {
        router.replace('/upload')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, profileComplete, user?.profileComplete, router])

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-[#FF6B35] text-xl">Loading...</div>
    </div>
  )
}
