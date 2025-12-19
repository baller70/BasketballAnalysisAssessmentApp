"use client"

import React, { useState } from "react"
import { ChevronDown } from "lucide-react"

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function CollapsibleSection({ 
  title, 
  icon, 
  defaultOpen = false, 
  children,
  className = ""
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`bg-[#2a2a2a] rounded-lg border border-[#4a4a4a] overflow-hidden ${className}`}>
      {/* Header - Always visible, clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#3a3a3a]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <h3 className="text-[#FFD700] font-bold text-sm uppercase tracking-wider">{title}</h3>
        </div>
        <div className={`text-[#888] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Content - Collapsible with animation */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-[#3a3a3a]">
          {children}
        </div>
      </div>
    </div>
  )
}

