import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type {
  PlayerProfile,
  MediaType,
  ReportTier,
  AnalysisResult,
} from "@/types"
import type { FormAnalysisResult } from "@/lib/formAnalysis"
import type { VisionAnalysisResult } from "@/services/visionAnalysis"

// Roboflow basketball detection result
export interface RoboflowBallDetection {
  x: number // center x as percentage
  y: number // center y as percentage
  width: number // width as percentage
  height: number // height as percentage
  confidence: number
}

// Detected keypoint from TensorFlow pose detection
export interface DetectedKeypoint {
  name: string
  x: number
  y: number
  confidence: number
}

// Shot breakdown frame (for the strip)
export interface ShotBreakdownFrame {
  id: string
  url: string
  label: string
  wristAngle?: number
  confidence?: number
}

interface AnalysisState {
  // Current analysis session
  currentAnalysis: AnalysisResult | null
  analysisHistory: AnalysisResult[]

  // Upload state
  uploadedFile: File | null
  mediaType: MediaType
  mediaPreviewUrl: string | null
  // Base64 image data (persists across navigation)
  uploadedImageBase64: string | null

  // Shot breakdown strip frames
  teaserFrames: ShotBreakdownFrame[]
  fullFrames: ShotBreakdownFrame[]
  allUploadedUrls: string[]

  // Player profile
  playerProfile: PlayerProfile

  // Selected report tier
  reportTier: ReportTier

  // Pose detection results
  detectedKeypoints: DetectedKeypoint[]
  poseConfidence: number
  formAnalysisResult: FormAnalysisResult | null

  // Vision AI analysis result
  visionAnalysisResult: VisionAnalysisResult | null

  // Roboflow basketball detection
  roboflowBallDetection: RoboflowBallDetection | null

  // UI state
  isAnalyzing: boolean
  analysisProgress: number
  error: string | null

  // Actions
  setUploadedFile: (file: File | null) => void
  setMediaType: (type: MediaType) => void
  setMediaPreviewUrl: (url: string | null) => void
  setUploadedImageBase64: (base64: string | null) => void
  setTeaserFrames: (frames: ShotBreakdownFrame[]) => void
  setFullFrames: (frames: ShotBreakdownFrame[]) => void
  setAllUploadedUrls: (urls: string[]) => void
  setPlayerProfile: (profile: Partial<PlayerProfile>) => void
  setReportTier: (tier: ReportTier) => void
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void
  addToHistory: (analysis: AnalysisResult) => void
  setIsAnalyzing: (isAnalyzing: boolean) => void
  setAnalysisProgress: (progress: number) => void
  setError: (error: string | null) => void
  setDetectedKeypoints: (keypoints: DetectedKeypoint[]) => void
  setPoseConfidence: (confidence: number) => void
  setFormAnalysisResult: (result: FormAnalysisResult | null) => void
  setVisionAnalysisResult: (result: VisionAnalysisResult | null) => void
  setRoboflowBallDetection: (detection: RoboflowBallDetection | null) => void
  resetUpload: () => void
  resetAll: () => void
}

const initialPlayerProfile: PlayerProfile = {
  name: "",
  email: "",
  position: undefined,
  skillLevel: undefined,
  age: undefined,
  height: "",
  weight: "",
  wingspan: "",
  bodyType: undefined,
}

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        currentAnalysis: null,
        analysisHistory: [],
        uploadedFile: null,
        mediaType: "IMAGE",
        mediaPreviewUrl: null,
        uploadedImageBase64: null,
        teaserFrames: [],
        fullFrames: [],
        allUploadedUrls: [],
        playerProfile: initialPlayerProfile,
        reportTier: "BASIC",
        detectedKeypoints: [],
        poseConfidence: 0,
        formAnalysisResult: null,
        visionAnalysisResult: null,
        roboflowBallDetection: null,
        isAnalyzing: false,
        analysisProgress: 0,
        error: null,

        // Actions
        setUploadedFile: (file) =>
          set({ uploadedFile: file }, false, "setUploadedFile"),

        setMediaType: (type) =>
          set({ mediaType: type }, false, "setMediaType"),

        setMediaPreviewUrl: (url) =>
          set({ mediaPreviewUrl: url }, false, "setMediaPreviewUrl"),

        setUploadedImageBase64: (base64) =>
          set({ uploadedImageBase64: base64 }, false, "setUploadedImageBase64"),

        setTeaserFrames: (frames) =>
          set({ teaserFrames: frames }, false, "setTeaserFrames"),

        setFullFrames: (frames) =>
          set({ fullFrames: frames }, false, "setFullFrames"),

        setAllUploadedUrls: (urls) =>
          set({ allUploadedUrls: urls }, false, "setAllUploadedUrls"),

        setPlayerProfile: (profile) =>
          set(
            (state) => ({
              playerProfile: { ...state.playerProfile, ...profile },
            }),
            false,
            "setPlayerProfile"
          ),

        setReportTier: (tier) =>
          set({ reportTier: tier }, false, "setReportTier"),

        setCurrentAnalysis: (analysis) =>
          set({ currentAnalysis: analysis }, false, "setCurrentAnalysis"),

        addToHistory: (analysis) =>
          set(
            (state) => ({
              analysisHistory: [analysis, ...state.analysisHistory],
            }),
            false,
            "addToHistory"
          ),

        setIsAnalyzing: (isAnalyzing) =>
          set({ isAnalyzing }, false, "setIsAnalyzing"),

        setAnalysisProgress: (progress) =>
          set({ analysisProgress: progress }, false, "setAnalysisProgress"),

        setError: (error) => set({ error }, false, "setError"),

        setDetectedKeypoints: (keypoints) =>
          set({ detectedKeypoints: keypoints }, false, "setDetectedKeypoints"),

        setPoseConfidence: (confidence) =>
          set({ poseConfidence: confidence }, false, "setPoseConfidence"),

        setFormAnalysisResult: (result) =>
          set({ formAnalysisResult: result }, false, "setFormAnalysisResult"),

        setVisionAnalysisResult: (result) =>
          set({ visionAnalysisResult: result }, false, "setVisionAnalysisResult"),

        setRoboflowBallDetection: (detection) =>
          set({ roboflowBallDetection: detection }, false, "setRoboflowBallDetection"),

        resetUpload: () =>
          set(
            {
              uploadedFile: null,
              mediaPreviewUrl: null,
              uploadedImageBase64: null,
              teaserFrames: [],
              fullFrames: [],
              allUploadedUrls: [],
              detectedKeypoints: [],
              poseConfidence: 0,
              formAnalysisResult: null,
              visionAnalysisResult: null,
              roboflowBallDetection: null,
              error: null,
            },
            false,
            "resetUpload"
          ),

        resetAll: () =>
          set(
            {
              currentAnalysis: null,
              uploadedFile: null,
              mediaType: "IMAGE",
              mediaPreviewUrl: null,
              uploadedImageBase64: null,
              teaserFrames: [],
              fullFrames: [],
              allUploadedUrls: [],
              playerProfile: initialPlayerProfile,
              reportTier: "BASIC",
              detectedKeypoints: [],
              poseConfidence: 0,
              formAnalysisResult: null,
              visionAnalysisResult: null,
              roboflowBallDetection: null,
              isAnalyzing: false,
              analysisProgress: 0,
              error: null,
            },
            false,
            "resetAll"
          ),
      }),
      {
        name: "basketball-analysis-storage",
        partialize: (state) => ({
          analysisHistory: state.analysisHistory,
          playerProfile: state.playerProfile,
          uploadedImageBase64: state.uploadedImageBase64,
          visionAnalysisResult: state.visionAnalysisResult,
          roboflowBallDetection: state.roboflowBallDetection,
        }),
      }
    )
  )
)

