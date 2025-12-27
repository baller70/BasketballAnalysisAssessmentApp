"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import { BasketballIcon } from "@/components/icons"
import { Loader2, Mail, Lock } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const { signIn, isLoading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signIn(formData.email, formData.password)

      if (result.success) {
        // Show warning if using local storage
        if (result.warning) {
          console.warn(result.warning)
        }
        // Wait a moment for store to update and cookie to be set
        setTimeout(() => {
          const { user } = useAuthStore.getState()
          const targetUrl = user?.profileComplete ? "/upload" : "/onboarding"
          // Use window.location for hard redirect to ensure middleware picks up the cookie
          window.location.href = targetUrl
        }, 200)
      } else {
        setError(result.error || "Sign in failed")
        setIsSubmitting(false)
      }
    } catch {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BasketballIcon className="w-16 h-16 text-[#FF6B35]" />
          </div>
          <h1 className="text-3xl font-bold text-[#E5E5E5] mb-2">
            Welcome Back
          </h1>
          <p className="text-[#888]">
            Sign in to continue your analysis
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#E5E5E5] flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#E5E5E5] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-all"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#E5E5E5] flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#E5E5E5] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-all"
                placeholder="Enter your password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-[#1a1a1a] font-bold py-3 px-6 rounded-lg hover:from-[#FF4500] hover:to-[#FF8C00] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B35]/20"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-[#888] text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#FF6B35] hover:text-[#FF4500] font-medium transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

