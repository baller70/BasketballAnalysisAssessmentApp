"use client"

import React from 'react'
import { Eye, EyeOff, Bone, Ruler, MessageCircle, RotateCcw } from 'lucide-react'

interface OverlayControlsProps {
  showSkeleton: boolean
  showAngles: boolean
  showIssues: boolean
  onToggleSkeleton: () => void
  onToggleAngles: () => void
  onToggleIssues: () => void
  onReset: () => void
}

interface ToggleButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  activeColor: string
}

function ToggleButton({ active, onClick, icon, label, activeColor }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        transition-all duration-200 border
        ${active 
          ? `${activeColor} border-current shadow-lg` 
          : 'bg-[#2a2a2a] text-[#888] border-[#3a3a3a] hover:bg-[#3a3a3a] hover:text-white'
        }
      `}
    >
      {active ? icon : <EyeOff className="w-4 h-4" />}
      <span>{label}</span>
      {active ? (
        <Eye className="w-3 h-3 ml-1 opacity-60" />
      ) : (
        <span className="text-xs opacity-60">OFF</span>
      )}
    </button>
  )
}

export function OverlayControls({
  showSkeleton,
  showAngles,
  showIssues,
  onToggleSkeleton,
  onToggleAngles,
  onToggleIssues,
  onReset,
}: OverlayControlsProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[#E5E5E5]">Overlay Controls</h4>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-[#888] hover:text-white transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <ToggleButton
          active={showSkeleton}
          onClick={onToggleSkeleton}
          icon={<Bone className="w-4 h-4" />}
          label="Skeleton"
          activeColor="bg-green-500/20 text-green-400"
        />
        
        <ToggleButton
          active={showAngles}
          onClick={onToggleAngles}
          icon={<Ruler className="w-4 h-4" />}
          label="Angles"
          activeColor="bg-blue-500/20 text-blue-400"
        />
        
        <ToggleButton
          active={showIssues}
          onClick={onToggleIssues}
          icon={<MessageCircle className="w-4 h-4" />}
          label="Issues"
          activeColor="bg-orange-500/20 text-orange-400"
        />
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-[#3a3a3a]">
        <p className="text-xs text-[#666] mb-2">Color Legend:</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-[#888]">Good Form</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-[#888]">Needs Work</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-[#888]">Critical Issue</span>
          </div>
        </div>
      </div>
    </div>
  )
}

