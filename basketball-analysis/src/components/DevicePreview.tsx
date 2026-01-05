"use client"

import React, { useState, useEffect } from 'react'
import { Smartphone, Tablet, Monitor, X, RotateCcw } from 'lucide-react'
import { usePathname } from 'next/navigation'

type DeviceType = 'mobile' | 'tablet' | 'desktop' | null

interface DeviceConfig {
  width: number
  height: number
  label: string
  icon: React.ReactNode
}

const DEVICES: Record<Exclude<DeviceType, null>, DeviceConfig> = {
  mobile: {
    width: 375,
    height: 812,
    label: 'iPhone',
    icon: <Smartphone className="w-4 h-4" />,
  },
  tablet: {
    width: 768,
    height: 1024,
    label: 'iPad',
    icon: <Tablet className="w-4 h-4" />,
  },
  desktop: {
    width: 1440,
    height: 900,
    label: 'Desktop',
    icon: <Monitor className="w-4 h-4" />,
  },
}

interface DevicePreviewProps {
  children: React.ReactNode
}

export function DevicePreview({ children }: DevicePreviewProps) {
  const pathname = usePathname()
  const [activeDevice, setActiveDevice] = useState<DeviceType>(null)
  const [iframeKey, setIframeKey] = useState(0)

  // Build the URL for the iframe
  const previewUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${pathname}?preview=true` 
    : pathname

  // Check if we're inside the preview iframe
  const [isInsidePreview, setIsInsidePreview] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setIsInsidePreview(urlParams.get('preview') === 'true')
    }
  }, [])

  // If we're inside the preview iframe, just render children without the preview UI
  if (isInsidePreview) {
    return <>{children}</>
  }

  // Normal view - no device selected
  if (!activeDevice) {
    return (
      <>
        {/* Floating Preview Button */}
        <div className="fixed top-20 right-4 z-50 flex gap-2">
          {(Object.keys(DEVICES) as Exclude<DeviceType, null>[]).map((device) => {
            const config = DEVICES[device]
            return (
              <button
                key={device}
                onClick={() => setActiveDevice(device)}
                className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-sm text-[#888] hover:text-white hover:border-[#FF6B35] transition-all shadow-lg"
                title={`Preview as ${config.label}`}
              >
                {config.icon}
              </button>
            )
          })}
        </div>
        {children}
      </>
    )
  }

  const currentDevice = DEVICES[activeDevice]

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Preview Toolbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#3a3a3a] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Device Selector */}
          <div className="flex items-center gap-1 bg-[#2a2a2a] rounded-lg p-1">
            {(Object.keys(DEVICES) as Exclude<DeviceType, null>[]).map((device) => {
              const config = DEVICES[device]
              const isActive = activeDevice === device
              return (
                <button
                  key={device}
                  onClick={() => {
                    setActiveDevice(device)
                    setIframeKey(prev => prev + 1) // Force iframe reload
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'text-[#888] hover:text-white hover:bg-[#3a3a3a]'
                    }
                  `}
                >
                  {config.icon}
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              )
            })}
          </div>

          {/* Device Info & Actions */}
          <div className="flex items-center gap-4">
            <span className="text-[#888] text-sm hidden sm:block">
              {currentDevice.label}: <span className="text-[#FF6B35] font-mono">{currentDevice.width} × {currentDevice.height}</span>
            </span>
            
            {/* Refresh */}
            <button
              onClick={() => setIframeKey(prev => prev + 1)}
              className="p-2 bg-[#2a2a2a] rounded-lg text-[#888] hover:text-white hover:bg-[#3a3a3a] transition-all"
              title="Refresh preview"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            {/* Close Preview */}
            <button
              onClick={() => setActiveDevice(null)}
              className="flex items-center gap-2 px-3 py-2 bg-[#FF6B35] rounded-lg text-sm text-white font-medium hover:bg-[#E55A2B] transition-all"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="pt-20 pb-8 flex justify-center items-start min-h-screen">
        <div className="relative">
          {/* Device Frame */}
          <div 
            className={`
              relative bg-[#1a1a1a] rounded-[40px] p-3 shadow-2xl
              ${activeDevice === 'mobile' ? 'rounded-[40px]' : activeDevice === 'tablet' ? 'rounded-[24px]' : 'rounded-lg'}
            `}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* Notch for mobile */}
            {activeDevice === 'mobile' && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#0a0a0a] rounded-b-2xl z-10 flex items-center justify-center">
                <div className="w-16 h-4 bg-[#1a1a1a] rounded-full" />
              </div>
            )}
            
            {/* Camera for tablet */}
            {activeDevice === 'tablet' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2a2a2a] rounded-full z-10" />
            )}

            {/* Screen bezel */}
            <div 
              className={`
                bg-[#0a0a0a] overflow-hidden
                ${activeDevice === 'mobile' ? 'rounded-[32px]' : activeDevice === 'tablet' ? 'rounded-[16px]' : 'rounded-md'}
              `}
            >
              {/* Iframe with actual device dimensions */}
              <iframe
                key={iframeKey}
                src={previewUrl}
                width={currentDevice.width}
                height={currentDevice.height}
                className="border-0"
                style={{
                  transform: activeDevice === 'desktop' ? 'scale(0.7)' : 'scale(1)',
                  transformOrigin: 'top left',
                  width: activeDevice === 'desktop' ? currentDevice.width : currentDevice.width,
                  height: activeDevice === 'desktop' ? currentDevice.height : currentDevice.height,
                }}
                title={`${currentDevice.label} Preview`}
              />
            </div>

            {/* Home indicator for mobile */}
            {activeDevice === 'mobile' && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#3a3a3a] rounded-full" />
            )}
          </div>

          {/* Device label */}
          <div className="text-center mt-4 text-[#666] text-sm">
            {currentDevice.label} Preview
          </div>
        </div>
      </div>
    </div>
  )
}
