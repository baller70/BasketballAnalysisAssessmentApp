"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { useProfileStore } from "@/stores/profileStore"
import { ProfileWizard } from "@/components/profile/ProfileWizard"

export default function OnboardingPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { completeProfile } = useProfileStore()

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (!isAuthenticated) {
      router.push("/signin")
    }
  }, [isAuthenticated, router])

  const handleComplete = async () => {
    // Mark profile as complete in both stores
    completeProfile()
    useAuthStore.getState().setProfileComplete(true)
    
    // Save profile to database via API
    try {
      const profileData = useProfileStore.getState()
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...profileData,
        }),
      })
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
    
    // Redirect to home page
    router.push("/")
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505]">
      <ProfileWizard onComplete={handleComplete} />
    </div>
  )
}

