import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type {
  PlayerProfile,
  MediaType,
  ReportTier,
  AnalysisResult,
} from "@/types"

// Form analysis result type (previously from formAnalysis.ts)
export interface FormAnalysisResult {
  overall_score: number
  feedback: string[]
  keypoints: Record<string, { x: number; y: number; confidence: number; source?: string }>
  basketball?: { x: number; y: number; radius: number }
  // Legacy fields for backwards compatibility with results page
  metrics: Array<{ name: string; value: number; status?: string }>
  angles: Array<{ name: string; angle: number; optimal?: number }>
  bodyAngles: Array<{ name: string; value: number; optimal?: number }>
  overallScore: number
  category: string
  strengths: string[]
  improvements: string[]
}

// Vision analysis result type (previously from visionAnalysis.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface VisionAnalysisResult {
  success: boolean
  error?: string
  overall_score?: number
  feedback?: string[]
  angles?: Record<string, number>
  keypoints?: Record<string, { x: number; y: number; confidence: number; source?: string }>
  basketball?: { x: number; y: number; radius: number }
  // Legacy nested analysis object for backwards compatibility - allow any additional properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis?: any
}

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

// Video analysis data for frame-by-frame playback
export interface VideoAnalysisData {
  annotatedFramesBase64: string[]
  rawFramesBase64?: string[] // Optional raw frames without annotations
  frameCount: number
  duration: number
  fps: number
  phases: Array<{ phase: string; frame: number; timestamp: number }>
  metrics: {
    elbow_angle_range: { min: number | null; max: number | null; at_release: number | null }
    knee_angle_range: { min: number | null; max: number | null }
    release_frame: number
    release_timestamp: number
  }
  frameData: Array<{
    frame: number
    timestamp: number
    phase: string
    metrics: Record<string, number>
    ball?: { x: number; y: number; radius: number }
  }>
  // Keypoints for each frame (for drawing overlays)
  allKeypoints?: Array<Record<string, { x: number; y: number; confidence: number }>>
}

// Session data structure for IMAGE or VIDEO mode
interface SessionData {
  uploadedFile: File | null
  mediaPreviewUrl: string | null
  uploadedImageBase64: string | null
  teaserFrames: ShotBreakdownFrame[]
  fullFrames: ShotBreakdownFrame[]
  allUploadedUrls: string[]
  detectedKeypoints: DetectedKeypoint[]
  poseConfidence: number
  formAnalysisResult: FormAnalysisResult | null
  visionAnalysisResult: VisionAnalysisResult | null
  roboflowBallDetection: RoboflowBallDetection | null
  videoAnalysisData: VideoAnalysisData | null
}

interface AnalysisState {
  // Current analysis session
  currentAnalysis: AnalysisResult | null
  analysisHistory: AnalysisResult[]

  // SEPARATE session data for IMAGE and VIDEO modes
  imageSessionData: SessionData
  videoSessionData: SessionData
  
  // Current media type (which tab is active)
  mediaType: MediaType

  // Player profile
  playerProfile: PlayerProfile

  // Selected report tier
  reportTier: ReportTier

  // UI state
  isAnalyzing: boolean
  analysisProgress: number
  error: string | null

  // Getters for current session data (based on mediaType)
  getCurrentSessionData: () => SessionData
  
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
  setVideoAnalysisData: (data: VideoAnalysisData | null) => void
  resetUpload: () => void
  resetAll: () => void
  
  // Legacy getters for backwards compatibility (returns data from current session)
  uploadedFile: File | null
  mediaPreviewUrl: string | null
  uploadedImageBase64: string | null
  teaserFrames: ShotBreakdownFrame[]
  fullFrames: ShotBreakdownFrame[]
  allUploadedUrls: string[]
  detectedKeypoints: DetectedKeypoint[]
  poseConfidence: number
  formAnalysisResult: FormAnalysisResult | null
  visionAnalysisResult: VisionAnalysisResult | null
  roboflowBallDetection: RoboflowBallDetection | null
  videoAnalysisData: VideoAnalysisData | null
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

const initialSessionData: SessionData = {
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
  videoAnalysisData: null,
}

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentAnalysis: null,
        analysisHistory: [],
        
        // SEPARATE session data for IMAGE and VIDEO
        imageSessionData: { ...initialSessionData },
        videoSessionData: { ...initialSessionData },
        
        mediaType: "IMAGE",
        playerProfile: initialPlayerProfile,
        reportTier: "BASIC",
        isAnalyzing: false,
        analysisProgress: 0,
        error: null,
        
        // Legacy getters - return data from current session based on mediaType
        get uploadedFile() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.uploadedFile : state.imageSessionData.uploadedFile 
        },
        get mediaPreviewUrl() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.mediaPreviewUrl : state.imageSessionData.mediaPreviewUrl 
        },
        get uploadedImageBase64() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.uploadedImageBase64 : state.imageSessionData.uploadedImageBase64 
        },
        get teaserFrames() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.teaserFrames : state.imageSessionData.teaserFrames 
        },
        get fullFrames() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.fullFrames : state.imageSessionData.fullFrames 
        },
        get allUploadedUrls() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.allUploadedUrls : state.imageSessionData.allUploadedUrls 
        },
        get detectedKeypoints() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.detectedKeypoints : state.imageSessionData.detectedKeypoints 
        },
        get poseConfidence() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.poseConfidence : state.imageSessionData.poseConfidence 
        },
        get formAnalysisResult() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.formAnalysisResult : state.imageSessionData.formAnalysisResult 
        },
        get visionAnalysisResult() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.visionAnalysisResult : state.imageSessionData.visionAnalysisResult 
        },
        get roboflowBallDetection() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.roboflowBallDetection : state.imageSessionData.roboflowBallDetection 
        },
        get videoAnalysisData() { 
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData.videoAnalysisData : state.imageSessionData.videoAnalysisData 
        },
        
        // Getter for current session data
        getCurrentSessionData: () => {
          const state = get()
          return state.mediaType === "VIDEO" ? state.videoSessionData : state.imageSessionData
        },

        // Actions - update the appropriate session based on mediaType
        setUploadedFile: (file) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, uploadedFile: file } }
            }
            return { imageSessionData: { ...state.imageSessionData, uploadedFile: file } }
          }, false, "setUploadedFile"),

        setMediaType: (type) =>
          set({ mediaType: type }, false, "setMediaType"),

        setMediaPreviewUrl: (url) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, mediaPreviewUrl: url } }
            }
            return { imageSessionData: { ...state.imageSessionData, mediaPreviewUrl: url } }
          }, false, "setMediaPreviewUrl"),

        setUploadedImageBase64: (base64) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, uploadedImageBase64: base64 } }
            }
            return { imageSessionData: { ...state.imageSessionData, uploadedImageBase64: base64 } }
          }, false, "setUploadedImageBase64"),

        setTeaserFrames: (frames) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, teaserFrames: frames } }
            }
            return { imageSessionData: { ...state.imageSessionData, teaserFrames: frames } }
          }, false, "setTeaserFrames"),

        setFullFrames: (frames) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, fullFrames: frames } }
            }
            return { imageSessionData: { ...state.imageSessionData, fullFrames: frames } }
          }, false, "setFullFrames"),

        setAllUploadedUrls: (urls) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, allUploadedUrls: urls } }
            }
            return { imageSessionData: { ...state.imageSessionData, allUploadedUrls: urls } }
          }, false, "setAllUploadedUrls"),

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
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, detectedKeypoints: keypoints } }
            }
            return { imageSessionData: { ...state.imageSessionData, detectedKeypoints: keypoints } }
          }, false, "setDetectedKeypoints"),

        setPoseConfidence: (confidence) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, poseConfidence: confidence } }
            }
            return { imageSessionData: { ...state.imageSessionData, poseConfidence: confidence } }
          }, false, "setPoseConfidence"),

        setFormAnalysisResult: (result) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, formAnalysisResult: result } }
            }
            return { imageSessionData: { ...state.imageSessionData, formAnalysisResult: result } }
          }, false, "setFormAnalysisResult"),

        setVisionAnalysisResult: (result) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, visionAnalysisResult: result } }
            }
            return { imageSessionData: { ...state.imageSessionData, visionAnalysisResult: result } }
          }, false, "setVisionAnalysisResult"),

        setRoboflowBallDetection: (detection) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, roboflowBallDetection: detection } }
            }
            return { imageSessionData: { ...state.imageSessionData, roboflowBallDetection: detection } }
          }, false, "setRoboflowBallDetection"),

        setVideoAnalysisData: (data) =>
          set((state) => {
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: { ...state.videoSessionData, videoAnalysisData: data } }
            }
            return { imageSessionData: { ...state.imageSessionData, videoAnalysisData: data } }
          }, false, "setVideoAnalysisData"),

        resetUpload: () =>
          set((state) => {
            const resetData = { ...initialSessionData }
            if (state.mediaType === "VIDEO") {
              return { videoSessionData: resetData, error: null }
            }
            return { imageSessionData: resetData, error: null }
          }, false, "resetUpload"),

        resetAll: () =>
          set(
            {
              currentAnalysis: null,
              imageSessionData: { ...initialSessionData },
              videoSessionData: { ...initialSessionData },
              mediaType: "IMAGE",
              playerProfile: initialPlayerProfile,
              reportTier: "BASIC",
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
          imageSessionData: state.imageSessionData,
          videoSessionData: state.videoSessionData,
        }),
      }
    )
  )
)

