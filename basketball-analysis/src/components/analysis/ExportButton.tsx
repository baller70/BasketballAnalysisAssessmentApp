"use client"

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  file?: File | null
  className?: string
}

export function ExportButton({ className }: ExportButtonProps) {
  // Export service is not available (Python backend removed)
  return (
    <div className={cn("flex items-center gap-2 text-sm text-orange-500", className)}>
      <AlertCircle className="w-4 h-4" />
      <span>Export service unavailable</span>
    </div>
  )
}
