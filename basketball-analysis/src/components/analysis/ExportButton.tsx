"use client"

import React, { useState } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  exportAnnotatedImage,
  downloadExportedImage,
  checkBackendHealth,
  type SkeletonConfig,
} from '@/services/pythonBackendApi'

interface ExportButtonProps {
  file: File | null
  skeletonConfig?: Partial<SkeletonConfig>
  className?: string
}

export function ExportButton({ file, skeletonConfig, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)

  // Check backend availability on mount
  React.useEffect(() => {
    checkBackendHealth()
      .then(() => setBackendAvailable(true))
      .catch(() => setBackendAvailable(false))
  }, [])

  const handleExport = async () => {
    if (!file) {
      setError('No image file available')
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const response = await exportAnnotatedImage(file, skeletonConfig, 'png', 95)

      if (!response.success || !response.image_base64) {
        throw new Error(response.message || 'Export failed')
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `basketball-analysis-${timestamp}.png`

      downloadExportedImage(response.image_base64, response.content_type, filename)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  // Show nothing if backend is not available
  if (backendAvailable === false) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-yellow-500", className)}>
        <AlertCircle className="w-4 h-4" />
        <span>Export service unavailable</span>
      </div>
    )
  }

  // Loading state while checking backend
  if (backendAvailable === null) {
    return (
      <button
        disabled
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-[#4a4a4a] text-[#888] cursor-not-allowed",
          className
        )}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking export service...
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={isExporting || !file}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
          "bg-[#FFD700] text-black hover:bg-[#E5C100]",
          "disabled:bg-[#4a4a4a] disabled:text-[#888] disabled:cursor-not-allowed",
          className
        )}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export Annotated Image
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}

