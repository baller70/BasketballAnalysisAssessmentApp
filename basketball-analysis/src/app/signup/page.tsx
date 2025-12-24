"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import { BasketballIcon } from "@/components/icons"
import { Loader2, Mail, Lock, User } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, isLoading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.firstName || undefined,
        formData.lastName || undefined
      )

      if (result.success) {
        // Show warning if using local storage
        if (result.warning) {
          console.warn(result.warning)
        }
        // Redirect to onboarding quiz
        router.push("/onboarding")
      } else {
        setError(result.error || "Sign up failed")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BasketballIcon className="w-16 h-16 text-[#FFD700]" />
          </div>
          <h1 className="text-3xl font-bold text-[#E5E5E5] mb-2">
            Create Your Account
          </h1>
          <p className="text-[#888]">
            Start your basketball analysis journey
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#E5E5E5] flex items-center gap-2">
                  <User className="w-4 h-4" />
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#E5E5E5] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#E5E5E5] flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#E5E5E5] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>

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
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#E5E5E5] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all"
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
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#E5E5E5] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all"
                placeholder="At least 6 characters"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#E5E5E5] flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#E5E5E5] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all"
                placeholder="Confirm your password"
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
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#1a1a1a] font-bold py-3 px-6 rounded-lg hover:from-[#FFA500] hover:to-[#FF8C00] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-[#888] text-sm">
              Already have an account?{" "}
              <Link href="/signin" className="text-[#FFD700] hover:text-[#FFA500] font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

