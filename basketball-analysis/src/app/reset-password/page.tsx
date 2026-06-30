"use client"

import React, { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react"

async function getCsrfToken(): Promise<string> {
  try {
    const res = await fetch("/api/auth/csrf", { method: "GET", credentials: "include" })
    if (!res.ok) return ""
    const data = await res.json()
    return typeof data?.csrfToken === "string" ? data.csrfToken : ""
  } catch {
    return ""
  }
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("This reset link is invalid. Please request a new one.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    try {
      const csrfToken = await getCsrfToken()
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setIsSubmitting(false)
      } else {
        setDone(true)
        setTimeout(() => router.push("/signin"), 2000)
      }
    } catch {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B35]/20 via-[#FF6B35]/5 to-[#FF6B35]/20 rounded-2xl blur-xl opacity-50" />
      <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
        {done ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-[#FF6B35]" />
            </div>
            <p className="text-white/80">
              Your password has been reset. Redirecting you to sign in...
            </p>
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 text-[#FF6B35] hover:text-[#FF8C5A] font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] focus:border-[#FF6B35]/50 rounded-xl px-4 py-4 pr-12 text-white text-base focus:outline-none transition-all duration-200 placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] focus:border-[#FF6B35]/50 rounded-xl px-4 py-4 text-white text-base focus:outline-none transition-all duration-200 placeholder:text-white/40"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full relative overflow-hidden bg-[#FF6B35] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-[#FF6B35]/25 hover:bg-[#FF7A4A]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  Reset password
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>

            <div className="text-center">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-[#FF6B35] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center relative overflow-hidden px-6 py-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF6B35]/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF6B35]/3 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(#FF6B35 1px, transparent 1px), linear-gradient(90deg, #FF6B35 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-10">
          <Image
            src="/images/shotiq-logo.png"
            alt="SHOTIQ AI"
            width={300}
            height={84}
            className="brightness-0 invert opacity-90 mx-auto"
            priority
          />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            Choose a new password
          </h1>
          <p className="text-white/50 text-base">
            Pick a strong password you don&apos;t use anywhere else.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
