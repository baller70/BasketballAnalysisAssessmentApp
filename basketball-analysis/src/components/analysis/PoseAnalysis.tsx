"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"

// Types
interface Keypoint {
  x: number
  y: number
  confidence: number
  source: string
}

interface AnalysisResult {
  success: boolean
  keypoints: Record<string, Keypoint>
  confidence: number
  angles: Record<string, number>
  basketball: { x: number; y: number; radius: number } | null
  image_size: { width: number; height: number }
  method: string
  feedback?: Array<{ type: string; area: string; message: string }>
  overall_score?: number
}

interface PoseAnalysisProps {
  imageFile?: File
  imageBase64?: string
}

// Skeleton connections
const SKELETON: [string, string][] = [
  ['nose', 'left_shoulder'], ['nose', 'right_shoulder'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
  ['left_ankle', 'left_foot'], ['right_ankle', 'right_foot'],
]

// Source colors for keypoints
const SOURCE_COLORS: Record<string, string> = {
  'yolo': '#4ade80',
  'mediapipe': '#60a5fa',
  'fused': '#facc15',
  'ball_refined': '#f87171',
  'estimated': '#a855f7',
  'detected': '#22c55e',
}

// Hybrid API URL
const HYBRID_API_URL = 'http://localhost:5001'

export function PoseAnalysis({ imageFile, imageBase64 }: PoseAnalysisProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  
  // Display toggles
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [showKeypoints, setShowKeypoints] = useState(true)
  const [showBall, setShowBall] = useState(true)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Check server status
  const checkServer = useCallback(async () => {
    try {
      const response = await fetch(`${HYBRID_API_URL}/health`)
      const data = await response.json()
      setServerOnline(data.status === 'ok')
      return data.status === 'ok'
    } catch {
      setServerOnline(false)
      return false
    }
  }, [])

  // Check server on mount
  useEffect(() => {
    checkServer()
    const interval = setInterval(checkServer, 10000)
    return () => clearInterval(interval)
  }, [checkServer])

  // Load image
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    } else if (imageBase64) {
      setImageUrl(imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`)
    }
  }, [imageFile, imageBase64])

  // Draw overlay when result changes
  useEffect(() => {
    if (result && imageRef.current && canvasRef.current) {
      drawOverlay()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, showSkeleton, showKeypoints, showBall])

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Analyze image using hybrid system
  const analyzeImage = async () => {
    if (!imageUrl && !imageFile && !imageBase64) return

    const online = await checkServer()
    if (!online) {
      setError('Hybrid server offline. Start hybrid_pose_detection.py first.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get base64 image
      let base64: string
      if (imageFile) {
        base64 = await fileToBase64(imageFile)
      } else if (imageBase64) {
        base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
      } else {
        throw new Error('No image provided')
      }

      // Call hybrid pose detection
      const poseResponse = await fetch(`${HYBRID_API_URL}/api/detect-pose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      })

      const poseResult = await poseResponse.json()

      if (!poseResult.success) {
        throw new Error(poseResult.error || 'Pose detection failed')
      }

      // Call form analysis
      const analysisResponse = await fetch(`${HYBRID_API_URL}/api/analyze-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keypoints: poseResult.keypoints,
          angles: poseResult.angles
        })
      })

      const analysisResult = await analysisResponse.json()

      // Combine results
      setResult({
        ...poseResult,
        feedback: analysisResult.feedback,
        overall_score: analysisResult.overall_score
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  // Draw skeleton and keypoints on canvas
  const drawOverlay = () => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !result) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Match canvas to displayed image size
    canvas.width = image.clientWidth
    canvas.height = image.clientHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const kp = result.keypoints
    const sx = canvas.width / result.image_size.width
    const sy = canvas.height / result.image_size.height

    // Draw basketball
    if (showBall && result.basketball) {
      const ball = result.basketball
      ctx.beginPath()
      ctx.arc(ball.x * sx, ball.y * sy, ball.radius * Math.min(sx, sy), 0, Math.PI * 2)
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(ball.x * sx, ball.y * sy, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#f97316'
      ctx.fill()
    }

    // Draw skeleton
    if (showSkeleton) {
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'

      SKELETON.forEach(([start, end]) => {
        const startPt = kp[start]
        const endPt = kp[end]
        if (startPt && endPt && startPt.confidence > 0.3 && endPt.confidence > 0.3) {
          ctx.beginPath()
          ctx.moveTo(startPt.x * sx, startPt.y * sy)
          ctx.lineTo(endPt.x * sx, endPt.y * sy)
          ctx.stroke()
        }
      })
    }

    // Draw keypoints
    if (showKeypoints) {
      Object.entries(kp).forEach(([name, pt]) => {
        if (pt.confidence > 0.3) {
          const x = pt.x * sx
          const y = pt.y * sy
          const color = SOURCE_COLORS[pt.source] || '#4ade80'
          const radius = name.includes('wrist') ? 8 : 5

          // Glow
          ctx.beginPath()
          ctx.arc(x, y, radius + 3, 0, Math.PI * 2)
          ctx.fillStyle = color + '40'
          ctx.fill()

          // Point
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })
    }
  }

  // Handle image load
  const handleImageLoad = () => {
    if (result) {
      drawOverlay()
    }
  }

  // Format angle name
  const formatName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Get grade from score
  const getGrade = (score: number) => {
    if (score >= 85) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-500/20' }
    if (score >= 70) return { grade: 'B', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    if (score >= 55) return { grade: 'C', color: 'text-orange-400', bg: 'bg-orange-500/20' }
    return { grade: 'D', color: 'text-red-400', bg: 'bg-red-500/20' }
  }

  return (
    <div className="space-y-6">
      {/* Server Status */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg text-sm">
        <div className={`w-2.5 h-2.5 rounded-full ${
          serverOnline === null ? 'bg-yellow-400 animate-pulse' :
          serverOnline ? 'bg-green-400' : 'bg-red-400'
        }`} />
        <span className="text-gray-300">
          {serverOnline === null ? 'Checking server...' :
           serverOnline ? 'Hybrid server online' : 'Server offline - Start hybrid_pose_detection.py'}
        </span>
      </div>

      {/* Image Preview with Canvas Overlay */}
      {imageUrl && (
        <div className="relative bg-black rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Preview"
            className="w-full"
            onLoad={handleImageLoad}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
          />
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={analyzeImage}
        disabled={loading || !imageUrl}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
          loading || !imageUrl
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400'
        }`}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Analyzing...
          </>
        ) : (
          <>⚡ Analyze Shooting Form</>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Display Controls */}
      {result && (
        <div className="flex gap-4 p-4 bg-gray-800/50 rounded-xl">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSkeleton}
              onChange={(e) => setShowSkeleton(e.target.checked)}
              className="w-4 h-4 accent-yellow-500"
            />
            <span className="text-gray-300 text-sm">Skeleton</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showKeypoints}
              onChange={(e) => setShowKeypoints(e.target.checked)}
              className="w-4 h-4 accent-yellow-500"
            />
            <span className="text-gray-300 text-sm">Keypoints</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBall}
              onChange={(e) => setShowBall(e.target.checked)}
              className="w-4 h-4 accent-yellow-500"
            />
            <span className="text-gray-300 text-sm">Basketball</span>
          </label>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Method Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
            🔀 {result.method?.toUpperCase() || 'HYBRID'} Detection
          </div>

          {/* Basketball Detected */}
          {result.basketball && (
            <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <span className="text-3xl">🏀</span>
              <div>
                <h4 className="text-orange-400 font-semibold">Basketball Detected</h4>
                <p className="text-gray-400 text-sm">
                  Position: ({result.basketball.x.toFixed(0)}, {result.basketball.y.toFixed(0)})
                </p>
              </div>
            </div>
          )}

          {/* Score Card */}
          {result.overall_score !== undefined && (
            <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl text-center">
              <p className="text-gray-400 text-sm uppercase tracking-wider">Overall Form Score</p>
              <p className="text-6xl font-bold text-yellow-400 my-2">{result.overall_score}</p>
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${getGrade(result.overall_score).bg} ${getGrade(result.overall_score).color}`}>
                Grade {getGrade(result.overall_score).grade}
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-gray-500 text-xs uppercase">Confidence</p>
              <p className="text-2xl font-bold text-green-400">{(result.confidence * 100).toFixed(0)}%</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-gray-500 text-xs uppercase">Keypoints</p>
              <p className="text-2xl font-bold text-green-400">{Object.keys(result.keypoints).length}</p>
            </div>
          </div>

          {/* Angles */}
          {result.angles && Object.keys(result.angles).length > 0 && (
            <div>
              <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Measured Angles</h3>
              <div className="space-y-2">
                {Object.entries(result.angles).map(([name, value]) => (
                  <div key={name} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">{formatName(name)}</span>
                    <span className="text-orange-400 font-bold">{value.toFixed(1)}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {result.feedback && result.feedback.length > 0 && (
            <div>
              <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Form Feedback</h3>
              <div className="space-y-2">
                {result.feedback.map((fb, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl flex gap-3 ${
                      fb.type === 'success'
                        ? 'bg-green-500/10 border-l-4 border-green-500'
                        : 'bg-yellow-500/10 border-l-4 border-yellow-500'
                    }`}
                  >
                    <span className="text-xl">{fb.type === 'success' ? '✅' : '⚠️'}</span>
                    <div>
                      <h4 className="font-semibold text-white">{fb.area}</h4>
                      <p className="text-gray-400 text-sm">{fb.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keypoints Details (Collapsible) */}
          <details className="group">
            <summary className="cursor-pointer p-3 bg-gray-800/30 rounded-lg text-gray-400 text-sm hover:bg-gray-800/50">
              View All Keypoints ({Object.keys(result.keypoints).length})
            </summary>
            <div className="grid grid-cols-2 gap-2 mt-3 max-h-48 overflow-y-auto">
              {Object.entries(result.keypoints).map(([name, pt]) => (
                <div key={name} className="flex justify-between p-2 bg-gray-800/30 rounded text-xs">
                  <span className="text-gray-500">{name}</span>
                  <span style={{ color: SOURCE_COLORS[pt.source] || '#4ade80' }} className="font-mono">
                    ({pt.x.toFixed(0)}, {pt.y.toFixed(0)})
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}



