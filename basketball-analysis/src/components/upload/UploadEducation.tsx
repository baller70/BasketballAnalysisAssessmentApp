"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ExcellentFormIcon,
  CriticalIssueIcon,
  CameraIcon,
  PlayIcon,
  InfoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GoodFormIcon,
} from "@/components/icons"
import {
  UPLOAD_DOS,
  UPLOAD_DONTS,
  VIDEO_CHECKLIST,
  IMAGE_SEQUENCE_GUIDE,
} from "@/lib/upload"

// ==========================================
// TYPES
// ==========================================

type TabId = "dos" | "donts" | "video" | "images"

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
}

// ==========================================
// COMPONENT
// ==========================================

interface UploadEducationProps {
  onClose?: () => void
  onStartUpload?: () => void
  initialTab?: TabId
}

export function UploadEducation({
  onClose,
  onStartUpload,
  initialTab = "dos",
}: UploadEducationProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const tabs: Tab[] = [
    { id: "dos", label: "Do's", icon: <GoodFormIcon size="sm" color="success" /> },
    { id: "donts", label: "Don'ts", icon: <CriticalIssueIcon size="sm" color="critical" /> },
    { id: "video", label: "Video Tips", icon: <PlayIcon size="sm" color="primary" /> },
    { id: "images", label: "Image Guide", icon: <CameraIcon size="sm" color="primary" /> },
  ]

  const toggleChecked = (id: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedItems(newChecked)
  }

  const requiredItemsCount = VIDEO_CHECKLIST.filter((item) => item.required).length
  const checkedRequiredCount = VIDEO_CHECKLIST.filter(
    (item) => item.required && checkedItems.has(item.id)
  ).length

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CameraIcon size="lg" color="current" />
            <div>
              <h2 className="text-xl font-bold">Upload Guidelines</h2>
              <p className="text-blue-100 text-sm">
                Follow these tips for the best analysis results
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                border-b-2 transition-colors
                ${activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "dos" && (
            <motion.div
              key="dos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DosList />
            </motion.div>
          )}

          {activeTab === "donts" && (
            <motion.div
              key="donts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DontsList />
            </motion.div>
          )}

          {activeTab === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <VideoChecklist
                checkedItems={checkedItems}
                onToggle={toggleChecked}
                requiredCount={requiredItemsCount}
                checkedCount={checkedRequiredCount}
              />
            </motion.div>
          )}

          {activeTab === "images" && (
            <motion.div
              key="images"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ImageSequenceGuide />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <InfoIcon size="sm" color="neutral" className="inline mr-1" />
            Quality uploads = Better analysis
          </p>
          {onStartUpload && (
            <button
              onClick={onStartUpload}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CameraIcon size="sm" color="current" />
              Start Upload
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function DosList() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <ExcellentFormIcon size="md" color="success" />
        <h3 className="text-lg font-semibold text-gray-900">Perfect Uploads</h3>
      </div>
      
      <div className="grid gap-3">
        {UPLOAD_DOS.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-lg"
          >
            <div className="flex-shrink-0 mt-0.5">
              <GoodFormIcon size="sm" color="success" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.description}</p>
              <p className="text-xs text-green-700 mt-1">
                <strong>Why:</strong> {item.whyItMatters}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DontsList() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <CriticalIssueIcon size="md" color="critical" />
        <h3 className="text-lg font-semibold text-gray-900">Avoid These Mistakes</h3>
      </div>
      
      <div className="grid gap-3">
        {UPLOAD_DONTS.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"
          >
            <div className="flex-shrink-0 mt-0.5">
              <CriticalIssueIcon size="sm" color="critical" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.description}</p>
              <p className="text-xs text-red-700 mt-1">
                <strong>Problem:</strong> {item.whyItMatters}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface VideoChecklistProps {
  checkedItems: Set<string>
  onToggle: (id: string) => void
  requiredCount: number
  checkedCount: number
}

function VideoChecklist({ checkedItems, onToggle, requiredCount, checkedCount }: VideoChecklistProps) {
  const progress = Math.round((checkedCount / requiredCount) * 100)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PlayIcon size="md" color="primary" />
          <h3 className="text-lg font-semibold text-gray-900">Video Checklist</h3>
        </div>
        <div className="text-sm text-gray-500">
          {checkedCount}/{requiredCount} required
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <motion.div
          className="h-2 rounded-full bg-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      <div className="space-y-2">
        {VIDEO_CHECKLIST.map((item) => {
          const isChecked = checkedItems.has(item.id)
          
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`
                w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left
                ${isChecked
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <div
                className={`
                  flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                  ${isChecked
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                  }
                `}
              >
                {isChecked && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isChecked ? "text-blue-700" : "text-gray-900"}`}>
                    {item.label}
                  </span>
                  {item.required && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ImageSequenceGuide() {
  const [activePhase, setActivePhase] = useState(0)
  const phase = IMAGE_SEQUENCE_GUIDE[activePhase]
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CameraIcon size="md" color="primary" />
        <h3 className="text-lg font-semibold text-gray-900">Image Sequence Guide</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        For best results, upload 3-7 images showing different phases of your shot.
        Click through to see what each image should capture.
      </p>
      
      {/* Phase Navigation */}
      <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
        <button
          onClick={() => setActivePhase(Math.max(0, activePhase - 1))}
          disabled={activePhase === 0}
          className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon size="sm" color={activePhase === 0 ? "neutral" : "primary"} />
        </button>
        
        <div className="flex items-center gap-2">
          {IMAGE_SEQUENCE_GUIDE.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActivePhase(idx)}
              className={`
                w-8 h-8 rounded-full text-sm font-medium transition-colors
                ${idx === activePhase
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
                }
              `}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setActivePhase(Math.min(IMAGE_SEQUENCE_GUIDE.length - 1, activePhase + 1))}
          disabled={activePhase === IMAGE_SEQUENCE_GUIDE.length - 1}
          className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon size="sm" color={activePhase === IMAGE_SEQUENCE_GUIDE.length - 1 ? "neutral" : "primary"} />
        </button>
      </div>
      
      {/* Active Phase Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`
            p-4 rounded-lg border-2
            ${phase.required
              ? "bg-blue-50 border-blue-200"
              : "bg-gray-50 border-gray-200"
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">
              Image {phase.phase}: {phase.title}
            </h4>
            {phase.required ? (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Required
              </span>
            ) : (
              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                Optional
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              What to show:
            </p>
            <ul className="grid grid-cols-2 gap-1">
              {phase.whatToShow.map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <GoodFormIcon size="sm" color="success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default UploadEducation







