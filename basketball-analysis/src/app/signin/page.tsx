"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuthStore } from "@/stores/authStore"
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const { signIn, isLoading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

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
        setTimeout(() => {
          const { user } = useAuthStore.getState()
          // Returning users (profile complete) go directly to dashboard
          // New users go to onboarding to set up their profile
          const targetUrl = user?.profileComplete ? "/results/demo" : "/onboarding"
          router.push(targetUrl)
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
    <div className="min-h-screen bg-[#030303] flex relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF6B35]/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF6B35]/3 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(#FF6B35 1px, transparent 1px), linear-gradient(90deg, #FF6B35 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Diagonal lines */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.015]">
          <div className="absolute top-[20%] left-0 w-[200%] h-[1px] bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent rotate-[-35deg] origin-left" />
          <div className="absolute top-[50%] left-0 w-[200%] h-[1px] bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent rotate-[-35deg] origin-left" />
          <div className="absolute top-[80%] left-0 w-[200%] h-[1px] bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent rotate-[-35deg] origin-left" />
        </div>
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="mb-12">
            <Image
              src="/images/shotiq-logo.png"
              alt="SHOTIQ AI"
              width={380}
              height={108}
              className="brightness-0 invert opacity-90"
              priority
            />
          </div>
          
          {/* Tagline */}
          <h2 className="text-4xl font-light text-white/90 leading-tight mb-6">
            Elevate Your
            <span className="block text-[#FF6B35] font-semibold">Shooting Form</span>
          </h2>
          
          <p className="text-white/50 text-lg leading-relaxed mb-12">
            AI-powered basketball analysis that helps you perfect every shot. 
            Join thousands of players improving their game.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-[#FF6B35]">50K+</div>
              <div className="text-white/40 text-sm mt-1">Shots Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#FF6B35]">98%</div>
              <div className="text-white/40 text-sm mt-1">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#FF6B35]">4.9★</div>
              <div className="text-white/40 text-sm mt-1">User Rating</div>
            </div>
          </div>
        </div>
        
        {/* Decorative border */}
        <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-gradient-to-b from-transparent via-[#FF6B35]/20 to-transparent" />
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <Image
              src="/images/shotiq-logo.png"
              alt="SHOTIQ AI"
              width={340}
              height={96}
              className="brightness-0 invert opacity-90 mx-auto"
              priority
            />
            <p className="text-white/40 text-sm -mt-8">
              AI-powered basketball shooting analysis
            </p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight lg:text-left text-center">
              Welcome back
            </h1>
            <p className="text-white/50 text-base lg:text-left text-center">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form Card */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B35]/20 via-[#FF6B35]/5 to-[#FF6B35]/20 rounded-2xl blur-xl opacity-50" />
            
            <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="relative">
                  <label 
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      focusedField === 'email' || formData.email 
                        ? 'top-2 text-xs text-[#FF6B35]' 
                        : 'top-1/2 -translate-y-1/2 text-white/40'
                    }`}
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full bg-white/[0.03] border rounded-xl px-4 pt-6 pb-3 text-white text-base focus:outline-none transition-all duration-200 ${
                      focusedField === 'email' 
                        ? 'border-[#FF6B35]/50 bg-white/[0.05]' 
                        : 'border-white/[0.08] hover:border-white/[0.15]'
                    }`}
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <label 
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      focusedField === 'password' || formData.password 
                        ? 'top-2 text-xs text-[#FF6B35]' 
                        : 'top-1/2 -translate-y-1/2 text-white/40'
                    }`}
                  >
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full bg-white/[0.03] border rounded-xl px-4 pt-6 pb-3 pr-12 text-white text-base focus:outline-none transition-all duration-200 ${
                      focusedField === 'password' 
                        ? 'border-[#FF6B35]/50 bg-white/[0.05]' 
                        : 'border-white/[0.08] hover:border-white/[0.15]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-white/40 hover:text-[#FF6B35] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="group w-full relative overflow-hidden bg-[#FF6B35] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-[#FF6B35]/25 hover:bg-[#FF7A4A]"
                >
                  <span className="relative z-10">
                    {isSubmitting || isLoading ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        Sign in
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0a0a0a] px-4 text-sm text-white/30">or</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-white/50">
                  Don&apos;t have an account?{" "}
                  <Link 
                    href="/signup" 
                    className="text-[#FF6B35] hover:text-[#FF8C5A] font-semibold transition-colors inline-flex items-center gap-1"
                  >
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-white/30 text-xs mt-8">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-white/50 hover:text-[#FF6B35] transition-colors">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-white/50 hover:text-[#FF6B35] transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

