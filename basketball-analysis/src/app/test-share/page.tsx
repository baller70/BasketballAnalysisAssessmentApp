"use client"

import React from "react"
import { ShareCardGame } from "@/components/share/ShareCardGame"
import { ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"

export default function TestSharePage() {
  return (
    <div className="min-h-screen bg-[#050505] pb-32">
      <div className="px-6 py-6">
        {/* Page Header - Part of content, not sticky */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            {/* Back to Dashboard */}
            <Link 
              href="/results/demo" 
              className="flex items-center text-[#888] hover:text-white transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center group-hover:border-[#FF6B35]/50 group-hover:bg-[#FF6B35]/10 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </Link>
            
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <h1 className="text-xl font-bold text-white uppercase tracking-wider">Share</h1>
            </div>
          </div>
        </div>

        {/* Share Card Game */}
        <ShareCardGame />
      </div>
    </div>
  )
}
