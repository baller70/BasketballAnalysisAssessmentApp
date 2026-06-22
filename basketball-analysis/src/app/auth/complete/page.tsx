"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

/**
 * OAuth landing page. The provider callback has already set the httpOnly
 * session cookie and redirected here; we hydrate the client auth store from
 * the session, then route the user to onboarding or the dashboard.
 */
export default function AuthCompletePage() {
  const router = useRouter()
  const hydrateFromSession = useAuthStore((s) => s.hydrateFromSession)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    hydrateFromSession().then(({ success, profileComplete }) => {
      if (!success) {
        router.replace("/signin?error=session_expired")
        return
      }
      router.replace(profileComplete ? "/results/demo" : "/onboarding")
    })
  }, [hydrateFromSession, router])

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-white/80">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        <p className="text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
