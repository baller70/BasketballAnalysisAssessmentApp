"use client"

import React, { useState } from "react"
import { 
  MousePointer2, 
  MoveRight, 
  Highlighter, 
  Circle, 
  Square, 
  Minus, 
  Palette, 
  Undo2, 
  Redo2, 
  Trash2,
  Sun,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Download
} from "lucide-react"

// Tool types
export type AnnotationTool = 'select' | 'arrow' | 'highlight' | 'spotlight' | 'circle' | 'rectangle' | 'line' | 'freehand'

// Video game effect types
export interface VideoGameEffects {
  playerGlow: boolean
  glowColor: string
  glowIntensity: number // 1-10
  motionTrails: boolean
  trailLength: number // frames
  statPopups: boolean
  popupStyle: 'arcade' | 'broadcast' | 'minimal'
  xrayMode: boolean
  xrayTarget: string | null // keypoint name
  telestrator: boolean
  focusZoom: boolean
  zoomLevel: number // 1-3
  slowMo: boolean
  slowMoSpeed: number // 0.25, 0.5, 0.75
}

// Annotation shape
export interface AnnotationShape {
  id: string
  type: AnnotationTool
  points: { x: number; y: number }[]
  color: string
  strokeWidth: number
  filled?: boolean
}

// Preset modes
export type PresetMode = 'broadcast' | 'analysis' | 'clean' | 'custom'

interface AnnotationToolbarProps {
  activeTool: AnnotationTool
  setActiveTool: (tool: AnnotationTool) => void
  activeColor: string
  setActiveColor: (color: string) => void
  strokeWidth: number
  setStrokeWidth: (width: number) => void
  effects: VideoGameEffects
  setEffects: (effects: VideoGameEffects) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onExport: () => void
  canUndo: boolean
  canRedo: boolean
  presetMode: PresetMode
  setPresetMode: (mode: PresetMode) => void
}

const colors = [
  '#FFD700', // Gold
  '#4ade80', // Green
  '#60a5fa', // Blue
  '#f97316', // Orange
  '#ef4444', // Red
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#ffffff', // White
]

const tools: { id: AnnotationTool; icon: React.ElementType; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'arrow', icon: MoveRight, label: 'Arrow' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
  { id: 'spotlight', icon: Sun, label: 'Spotlight' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'line', icon: Minus, label: 'Line' },
]

export function AnnotationToolbar({
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  strokeWidth,
  setStrokeWidth,
  effects,
  setEffects,
  onUndo,
  onRedo,
  onClear,
  onExport,
  canUndo,
  canRedo,
  presetMode,
  setPresetMode,
}: AnnotationToolbarProps) {
  const [showEffectsPanel, setShowEffectsPanel] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Preset configurations
  const applyPreset = (mode: PresetMode) => {
    setPresetMode(mode)
    switch (mode) {
      case 'broadcast':
        setEffects({
          ...effects,
          playerGlow: true,
          glowColor: '#FFD700',
          glowIntensity: 7,
          motionTrails: true,
          trailLength: 5,
          statPopups: true,
          popupStyle: 'broadcast',
          xrayMode: false,
          xrayTarget: null,
          telestrator: true,
          focusZoom: false,
          zoomLevel: 1,
          slowMo: false,
          slowMoSpeed: 0.5,
        })
        break
      case 'analysis':
        setEffects({
          ...effects,
          playerGlow: true,
          glowColor: '#4ade80',
          glowIntensity: 5,
          motionTrails: false,
          trailLength: 3,
          statPopups: true,
          popupStyle: 'minimal',
          xrayMode: true,
          xrayTarget: null,
          telestrator: false,
          focusZoom: true,
          zoomLevel: 1.5,
          slowMo: false,
          slowMoSpeed: 0.5,
        })
        break
      case 'clean':
        setEffects({
          ...effects,
          playerGlow: false,
          motionTrails: false,
          statPopups: false,
          xrayMode: false,
          xrayTarget: null,
          telestrator: false,
          focusZoom: false,
          slowMo: false,
        })
        break
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-3 shadow-2xl">
      {/* Main Toolbar Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 border-r border-[#3a3a3a] pr-3">
          {tools.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTool(id)}
              title={label}
              className={`p-2 rounded-lg transition-all ${
                activeTool === id
                  ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50'
                  : 'text-[#888] hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className="relative border-r border-[#3a3a3a] pr-3">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded-lg hover:bg-[#2a2a2a] flex items-center gap-2"
          >
            <div 
              className="w-5 h-5 rounded-full border-2 border-white/50"
              style={{ backgroundColor: activeColor }}
            />
            <Palette className="w-4 h-4 text-[#888]" />
          </button>
          
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] shadow-xl z-50">
              <div className="grid grid-cols-3 gap-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      setActiveColor(color)
                      setShowColorPicker(false)
                    }}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      activeColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              {/* Stroke Width */}
              <div className="mt-2 pt-2 border-t border-[#3a3a3a]">
                <label className="text-xs text-[#888] block mb-1">Stroke Width</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Undo/Redo/Clear */}
        <div className="flex items-center gap-1 border-r border-[#3a3a3a] pr-3">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className={`p-2 rounded-lg transition-all ${
              canUndo ? 'text-[#888] hover:text-white hover:bg-[#2a2a2a]' : 'text-[#444] cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className={`p-2 rounded-lg transition-all ${
              canRedo ? 'text-[#888] hover:text-white hover:bg-[#2a2a2a]' : 'text-[#444] cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClear}
            title="Clear All"
            className="p-2 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Video Game Effects Toggle */}
        <div className="flex items-center gap-1 border-r border-[#3a3a3a] pr-3">
          <button
            onClick={() => setShowEffectsPanel(!showEffectsPanel)}
            title="Video Game Effects"
            className={`p-2 rounded-lg flex items-center gap-2 transition-all ${
              showEffectsPanel
                ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50'
                : 'text-[#888] hover:text-white hover:bg-[#2a2a2a]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-medium">Effects</span>
          </button>
        </div>

        {/* Preset Modes */}
        <div className="flex items-center gap-1 border-r border-[#3a3a3a] pr-3">
          {(['broadcast', 'analysis', 'clean'] as PresetMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => applyPreset(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                presetMode === mode
                  ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50'
                  : 'text-[#888] hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={onExport}
          title="Export Annotated Image"
          className="p-2 rounded-lg text-[#888] hover:text-[#4ade80] hover:bg-[#4ade80]/10 transition-all ml-auto"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Effects Panel (Expandable) */}
      {showEffectsPanel && (
        <div className="mt-3 pt-3 border-t border-[#3a3a3a]">
          <h4 className="text-xs text-[#888] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Video Game Effects
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Player Glow */}
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white">Player Glow</span>
                <button
                  onClick={() => setEffects({ ...effects, playerGlow: !effects.playerGlow })}
                  className={`p-1 rounded ${effects.playerGlow ? 'text-[#FFD700]' : 'text-[#666]'}`}
                >
                  {effects.playerGlow ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {effects.playerGlow && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {['#FFD700', '#4ade80', '#60a5fa', '#ef4444'].map(color => (
                      <button
                        key={color}
                        onClick={() => setEffects({ ...effects, glowColor: color })}
                        className={`w-5 h-5 rounded-full border ${effects.glowColor === color ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={effects.glowIntensity}
                    onChange={(e) => setEffects({ ...effects, glowIntensity: Number(e.target.value) })}
                    className="w-full h-1"
                  />
                </div>
              )}
            </div>

            {/* Motion Trails */}
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white">Motion Trails</span>
                <button
                  onClick={() => setEffects({ ...effects, motionTrails: !effects.motionTrails })}
                  className={`p-1 rounded ${effects.motionTrails ? 'text-[#FFD700]' : 'text-[#666]'}`}
                >
                  {effects.motionTrails ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {effects.motionTrails && (
                <div>
                  <label className="text-xs text-[#888]">Trail Length</label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={effects.trailLength}
                    onChange={(e) => setEffects({ ...effects, trailLength: Number(e.target.value) })}
                    className="w-full h-1"
                  />
                </div>
              )}
            </div>

            {/* Stat Pop-ups */}
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white">Stat Pop-ups</span>
                <button
                  onClick={() => setEffects({ ...effects, statPopups: !effects.statPopups })}
                  className={`p-1 rounded ${effects.statPopups ? 'text-[#FFD700]' : 'text-[#666]'}`}
                >
                  {effects.statPopups ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {effects.statPopups && (
                <div className="flex gap-1">
                  {(['arcade', 'broadcast', 'minimal'] as const).map(style => (
                    <button
                      key={style}
                      onClick={() => setEffects({ ...effects, popupStyle: style })}
                      className={`px-2 py-1 rounded text-xs ${
                        effects.popupStyle === style 
                          ? 'bg-[#FFD700]/20 text-[#FFD700]' 
                          : 'text-[#888] hover:text-white'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* X-Ray Mode */}
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white">X-Ray Mode</span>
                <button
                  onClick={() => setEffects({ ...effects, xrayMode: !effects.xrayMode })}
                  className={`p-1 rounded ${effects.xrayMode ? 'text-[#FFD700]' : 'text-[#666]'}`}
                >
                  {effects.xrayMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Telestrator */}
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Telestrator</span>
                <button
                  onClick={() => setEffects({ ...effects, telestrator: !effects.telestrator })}
                  className={`p-1 rounded ${effects.telestrator ? 'text-[#FFD700]' : 'text-[#666]'}`}
                >
                  {effects.telestrator ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Focus Zoom */}
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white">Focus Zoom</span>
                <button
                  onClick={() => setEffects({ ...effects, focusZoom: !effects.focusZoom })}
                  className={`p-1 rounded ${effects.focusZoom ? 'text-[#FFD700]' : 'text-[#666]'}`}
                >
                  {effects.focusZoom ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {effects.focusZoom && (
                <div>
                  <label className="text-xs text-[#888]">Zoom Level</label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.5"
                    value={effects.zoomLevel}
                    onChange={(e) => setEffects({ ...effects, zoomLevel: Number(e.target.value) })}
                    className="w-full h-1"
                  />
                </div>
              )}
            </div>

            {/* Slow-Mo */}
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white">Slow-Mo</span>
                <button
                  onClick={() => setEffects({ ...effects, slowMo: !effects.slowMo })}
                  className={`p-1 rounded ${effects.slowMo ? 'text-[#FFD700]' : 'text-[#666]'}`}
                >
                  {effects.slowMo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {effects.slowMo && (
                <div className="flex gap-1">
                  {[0.25, 0.5, 0.75].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setEffects({ ...effects, slowMoSpeed: speed })}
                      className={`px-2 py-1 rounded text-xs ${
                        effects.slowMoSpeed === speed 
                          ? 'bg-[#FFD700]/20 text-[#FFD700]' 
                          : 'text-[#888] hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Default effects
export const defaultVideoGameEffects: VideoGameEffects = {
  playerGlow: true,
  glowColor: '#FFD700',
  glowIntensity: 5,
  motionTrails: false,
  trailLength: 5,
  statPopups: true,
  popupStyle: 'broadcast',
  xrayMode: false,
  xrayTarget: null,
  telestrator: false,
  focusZoom: false,
  zoomLevel: 1.5,
  slowMo: false,
  slowMoSpeed: 0.5,
}

