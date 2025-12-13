import React from "react"
import { cn } from "@/lib/utils"
import type { ShotFrame } from "@/lib/shotBreakdown"

interface ShotBreakdownStripProps {
  title?: string
  frames: ShotFrame[]
  watermark?: string
  dense?: boolean
}

export function ShotBreakdownStrip({ title, frames, watermark, dense = false }: ShotBreakdownStripProps) {
  if (!frames || frames.length === 0) return null

  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold text-[#FFD700]">{title}</h3>}
      <div
        className={cn(
          "flex w-full overflow-x-auto gap-2 rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] p-2",
          dense ? "space-x-2" : "space-x-3"
        )}
      >
        {frames.map((frame, idx) => (
          <div
            key={frame.id}
            className={cn(
              "relative rounded-md overflow-hidden bg-black border border-[#2d2d2d]",
              dense ? "min-w-[120px] w-[140px]" : "min-w-[160px] w-[180px]"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frame.url} alt={frame.label} className="w-full h-full object-cover" />
            {watermark && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs uppercase tracking-widest text-white/50 bg-black/30 px-2 py-1 rounded">
                  {watermark}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <div className="text-xs font-semibold text-white">{idx + 1}. {frame.label}</div>
              <div className="text-[10px] text-[#b0b0b0]">
                Wrist:{Math.round((1 - frame.wristHeight) * 100)} · Conf:{Math.round(frame.confidence * 100)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}






