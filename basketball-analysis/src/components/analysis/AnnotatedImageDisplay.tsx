"use client"

import React from "react"
import { MedalIcon } from "@/components/icons/MedalIcons"
import { getMedalTierFromStatus } from "@/lib/medalRanking"

interface Annotation {
  position?: string
  angle?: string
  alignment?: string
  status?: "good" | "warning" | "critical"
  [key: string]: string | undefined
}

interface AnnotationsData {
  ball?: Annotation
  shootingHand?: Annotation
  guideHand?: Annotation
  shootingElbow?: Annotation
  shootingShoulder?: Annotation
  head?: Annotation
  core?: Annotation
  hips?: Annotation
  knees?: Annotation
  feet?: Annotation
  ankles?: Annotation
}

interface Props {
  imageUrl: string
  annotations?: AnnotationsData
  centerLineAnalysis?: {
    verticalAlignment?: string
    shoulderHipAlignment?: string
    balancePoint?: string
  }
  phaseDetection?: {
    currentPhase?: string
    phaseQuality?: string
  }
}

const StatusIcon = ({ status }: { status?: string }) => {
  if (!status) return null
  const medalTier = getMedalTierFromStatus(status as "good" | "warning" | "critical", undefined)
  return <MedalIcon tier={medalTier} size={16} />
}

const statusColor = (status?: string) => {
  if (status === "good") return "border-green-500/50 bg-green-500/10"
  if (status === "warning") return "border-orange-500/50 bg-orange-500/10"
  if (status === "critical") return "border-red-500/50 bg-red-500/10"
  return "border-[#4a4a4a] bg-[#2a2a2a]"
}

const AnnotationCard = ({ title, data }: { title: string; data?: Annotation }) => {
  if (!data) return null
  
  // Get the main description from the data
  const mainText = data.position || data.angle || data.alignment || data.bend || 
                   data.stance || data.engagement || data.height || ""
  const details = Object.entries(data)
    .filter(([key, val]) => key !== "status" && val && key !== "position" && key !== "angle")
    .map(([key, val]) => `${key}: ${val}`)
  
  return (
    <div className={`rounded-lg border p-3 ${statusColor(data.status)}`}>
      <div className="flex items-center gap-2 mb-1">
        <StatusIcon status={data.status} />
        <span className="font-semibold text-[#FF6B35] text-sm uppercase tracking-wide">{title}</span>
      </div>
      {mainText && <p className="text-[#E5E5E5] text-sm">{mainText}</p>}
      {details.length > 0 && (
        <ul className="text-[#999] text-xs mt-1 space-y-0.5">
          {details.slice(0, 2).map((d, i) => (
            <li key={i}>• {d}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AnnotatedImageDisplay({ imageUrl, annotations, centerLineAnalysis, phaseDetection }: Props) {
  return (
    <div className="space-y-6">
      {/* Phase Detection Banner */}
      {phaseDetection?.currentPhase && (
        <div className="bg-[#FF6B35]/20 border border-[#FF6B35]/50 rounded-lg p-3 text-center">
          <span className="text-[#FF6B35] font-bold uppercase tracking-wider">
            {phaseDetection.currentPhase.replace("_", " ")} Phase
          </span>
          {phaseDetection.phaseQuality && (
            <p className="text-[#E5E5E5] text-sm mt-1">{phaseDetection.phaseQuality}</p>
          )}
        </div>
      )}

      {/* Main Image - CENTERED */}
      <div className="flex justify-center">
        <div className="relative bg-[#1a1a1a] rounded-xl overflow-hidden border-2 border-[#3a3a3a] max-w-2xl w-full">
          {/* Center Line Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-500/30" />
          </div>
          
          {/* The Image - Centered */}
          <div className="flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Shooting form analysis"
              className="max-w-full max-h-[60vh] object-contain rounded-lg"
              style={{ margin: "0 auto", display: "block" }}
            />
          </div>
        </div>
      </div>

      {/* Center Line Analysis */}
      {centerLineAnalysis && (
        <div className="bg-[#2a2a2a] rounded-lg border border-[#4a4a4a] p-4">
          <h4 className="text-[#FF6B35] font-semibold text-sm uppercase tracking-wider mb-3">
            Body Alignment Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {centerLineAnalysis.verticalAlignment && (
              <div>
                <span className="text-[#888]">Vertical:</span>
                <span className="text-[#E5E5E5] ml-2">{centerLineAnalysis.verticalAlignment}</span>
              </div>
            )}
            {centerLineAnalysis.shoulderHipAlignment && (
              <div>
                <span className="text-[#888]">Shoulder-Hip:</span>
                <span className="text-[#E5E5E5] ml-2">{centerLineAnalysis.shoulderHipAlignment}</span>
              </div>
            )}
            {centerLineAnalysis.balancePoint && (
              <div>
                <span className="text-[#888]">Balance:</span>
                <span className="text-[#E5E5E5] ml-2">{centerLineAnalysis.balancePoint}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Annotations Grid */}
      {annotations && (
        <div className="space-y-4">
          <h4 className="text-[#FF6B35] font-semibold text-sm uppercase tracking-wider">
            Body Part Analysis
          </h4>
          
          {/* Upper Body */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AnnotationCard title="Ball" data={annotations.ball} />
            <AnnotationCard title="Shooting Hand" data={annotations.shootingHand} />
            <AnnotationCard title="Guide Hand" data={annotations.guideHand} />
            <AnnotationCard title="Head" data={annotations.head} />
          </div>

          {/* Arms & Shoulders */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <AnnotationCard title="Shooting Elbow" data={annotations.shootingElbow} />
            <AnnotationCard title="Shooting Shoulder" data={annotations.shootingShoulder} />
            <AnnotationCard title="Core" data={annotations.core} />
          </div>

          {/* Lower Body */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AnnotationCard title="Hips" data={annotations.hips} />
            <AnnotationCard title="Knees" data={annotations.knees} />
            <AnnotationCard title="Ankles" data={annotations.ankles} />
            <AnnotationCard title="Feet" data={annotations.feet} />
          </div>
        </div>
      )}
    </div>
  )
}








