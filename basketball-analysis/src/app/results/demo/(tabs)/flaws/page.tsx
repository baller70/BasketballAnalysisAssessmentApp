"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { AlertTriangle, Calendar, ChevronDown, ChevronRight, Zap, Play, Clock, Target } from "lucide-react"
import { useAnalysisStore } from "@/stores/analysisStore"
import { getAllSessions, AnalysisSession } from "@/services/sessionStorage"
import { detectFlawsFromAngles } from "@/data/shootingFlawsDatabase"
import { usePoints } from "@/lib/points/pointsContext"
import { InlinePointsBurst } from "@/components/points/PointsBurst"

export default function FlawsPage() {
  const [expandedSessions, setExpandedSessions] = useState<string[]>(['current', 'demo'])
  const [expandedCards, setExpandedCards] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const sessionsPerPage = 10
  const [showPointsBurst, setShowPointsBurst] = useState(false)
  const [pointsBurstPosition, setPointsBurstPosition] = useState({ x: 0, y: 0 })
  const viewedFlaws = useRef<Set<string>>(new Set())
  
  const { earnPoints } = usePoints()
  const { visionAnalysisResult, uploadedImageBase64 } = useAnalysisStore()
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  
  useEffect(() => {
    const loadedSessions = getAllSessions()
    setSessions(loadedSessions)
  }, [])

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev =>
      prev.includes(sessionId) ? prev.filter(id => id !== sessionId) : [...prev, sessionId]
    )
  }

  const toggleCard = (cardId: string) => {
    const isExpanding = !expandedCards.includes(cardId)
    setExpandedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    )
    
    // Award points when viewing a flaw for the first time
    if (isExpanding && !viewedFlaws.current.has(cardId)) {
      viewedFlaws.current.add(cardId)
      const result = earnPoints('flaw_view')
      if (result.earned) {
        setShowPointsBurst(true)
        setTimeout(() => setShowPointsBurst(false), 1500)
      }
    }
  }

  const getFlawsForAngles = (angles: Record<string, number> | undefined) => {
    if (!angles) {
      return [{
        id: 0,
        title: "No Data Available",
        severity: "UNKNOWN",
        severityScore: 0,
        category: "N/A",
        description: "No analysis data available for this session.",
        correction: "Upload an image to analyze your shooting form.",
        causeChain: [],
        drills: [],
        impact: "N/A"
      }]
    }
    
    const dbFlaws = detectFlawsFromAngles(angles)
    
    return dbFlaws.map((flaw, idx) => ({
      id: idx,
      title: flaw.name,
      severity: flaw.priority >= 8 ? "CRITICAL" : flaw.priority >= 6 ? "MODERATE" : "MINOR",
      severityScore: Math.max(20, 100 - flaw.priority * 8),
      category: flaw.id.includes("ELBOW") ? "Form" : 
                flaw.id.includes("KNEE") ? "Power" : 
                flaw.id.includes("SHOULDER") || flaw.id.includes("HIP") ? "Balance" : "Mechanics",
      description: flaw.description,
      correction: flaw.fixes[0] || "Work with a coach to correct this issue.",
      causeChain: flaw.causeChain,
      drills: flaw.drills.slice(0, 3).map((drill, i) => ({
        name: drill,
        reps: i === 0 ? "3 sets × 20 reps" : i === 1 ? "50 shots" : "5 minutes",
        difficulty: i === 0 ? "Easy" : i === 1 ? "Medium" : "Easy"
      })),
      impact: flaw.priority >= 8 ? "Critical impact on accuracy" : 
              flaw.priority >= 6 ? "High impact on shot accuracy" : "Medium impact on shot power"
    }))
  }

  // Default demo flaws
  const defaultDemoFlaws = [
    {
      id: 1,
      title: "Elbow Flare",
      severity: "CRITICAL",
      severityScore: 35,
      category: "Form",
      description: "Your shooting elbow is drifting outward during release, causing inconsistent ball flight and reducing accuracy on mid-range shots.",
      correction: "Practice form shooting with your elbow tucked against a wall. Use the 'cookie jar' drill.",
      causeChain: [
        { effect: "Ball drifts left/right", explanation: "Side spin from elbow position", severity: "high" },
        { effect: "Inconsistent accuracy", explanation: "Variable release angle", severity: "medium" }
      ],
      drills: [
        { name: "Wall Elbow Drill", reps: "3 sets × 20 reps", difficulty: "Easy" },
        { name: "One-Hand Form Shots", reps: "50 shots", difficulty: "Medium" },
        { name: "Mirror Practice", reps: "5 minutes", difficulty: "Easy" }
      ],
      impact: "Critical impact on accuracy"
    },
    {
      id: 2,
      title: "Low Release Point",
      severity: "MODERATE",
      severityScore: 55,
      category: "Mechanics",
      description: "Your release height is below optimal range, making your shot easier to block and reducing the entry angle into the basket.",
      correction: "Extend fully through your shot before releasing. Practice releasing at the peak of your jump.",
      causeChain: [
        { effect: "Shot gets blocked", explanation: "Release too low for defenders", severity: "high" },
        { effect: "Flat arc trajectory", explanation: "Lower release = flatter shot", severity: "medium" }
      ],
      drills: [
        { name: "High Release Drill", reps: "3 sets × 15 reps", difficulty: "Medium" },
        { name: "Jump Shot Peak Practice", reps: "40 shots", difficulty: "Medium" },
        { name: "Chair Shooting Drill", reps: "5 minutes", difficulty: "Easy" }
      ],
      impact: "High impact on shot accuracy"
    },
    {
      id: 3,
      title: "Inconsistent Follow Through",
      severity: "MODERATE",
      severityScore: 60,
      category: "Form",
      description: "Your follow through varies from shot to shot, leading to inconsistent backspin and ball rotation.",
      correction: "Hold your follow through until the ball hits the rim. Focus on snapping your wrist.",
      causeChain: [
        { effect: "Variable backspin", explanation: "Inconsistent wrist action", severity: "medium" },
        { effect: "Unpredictable bounces", explanation: "Ball rotation varies", severity: "low" }
      ],
      drills: [
        { name: "Freeze Follow Through", reps: "3 sets × 25 reps", difficulty: "Easy" },
        { name: "Wrist Snap Drill", reps: "50 shots", difficulty: "Easy" },
        { name: "One-Hand Form Shooting", reps: "5 minutes", difficulty: "Medium" }
      ],
      impact: "Medium impact on shot power"
    },
    {
      id: 4,
      title: "Poor Base Alignment",
      severity: "MINOR",
      severityScore: 72,
      category: "Balance",
      description: "Your feet are not consistently aligned with the basket, causing your body to rotate during the shot.",
      correction: "Practice catching and squaring in one motion. Use floor markers to check foot alignment.",
      causeChain: [
        { effect: "Body rotation", explanation: "Feet not square to basket", severity: "medium" },
        { effect: "Off-balance shots", explanation: "Weight distribution uneven", severity: "low" }
      ],
      drills: [
        { name: "Footwork Square-Up", reps: "3 sets × 20 reps", difficulty: "Easy" },
        { name: "Catch & Shoot Alignment", reps: "30 shots", difficulty: "Medium" },
        { name: "Tape Line Drill", reps: "5 minutes", difficulty: "Easy" }
      ],
      impact: "Medium impact on shot power"
    },
    {
      id: 5,
      title: "Rushed Shot Motion",
      severity: "MINOR",
      severityScore: 68,
      category: "Power",
      description: "Your shooting motion is too quick, not allowing proper energy transfer from legs to arms.",
      correction: "Slow down your shot in practice, focus on rhythm. Use the 'dip' to create better timing.",
      causeChain: [
        { effect: "Weak shots", explanation: "No leg power transfer", severity: "medium" },
        { effect: "Inconsistent rhythm", explanation: "Timing varies shot to shot", severity: "low" }
      ],
      drills: [
        { name: "Slow Motion Shooting", reps: "3 sets × 15 reps", difficulty: "Easy" },
        { name: "Rhythm Dribble-Shot", reps: "40 shots", difficulty: "Medium" },
        { name: "Fatigue Shooting", reps: "5 minutes", difficulty: "Hard" }
      ],
      impact: "Medium impact on shot power"
    }
  ]

  const allSessionsWithFlaws = useMemo(() => {
    const result: { id: string; date: string; displayDate: string; flaws: any[]; score: number; isLive: boolean }[] = []
    
    if (visionAnalysisResult?.success && uploadedImageBase64) {
      result.push({
        id: 'current',
        date: new Date().toISOString(),
        displayDate: 'Today (Live)',
        flaws: getFlawsForAngles(visionAnalysisResult.angles),
        score: visionAnalysisResult.overall_score || 70,
        isLive: true
      })
    }
    
    sessions.forEach(session => {
      result.push({
        id: session.id,
        date: session.date,
        displayDate: session.displayDate,
        flaws: getFlawsForAngles(session.analysisData?.angles),
        score: session.analysisData?.overallScore || 0,
        isLive: false
      })
    })
    
    if (result.length === 0) {
      result.push({
        id: 'demo',
        date: new Date().toISOString(),
        displayDate: 'Demo Session',
        flaws: defaultDemoFlaws,
        score: 74,
        isLive: true
      })
    }
    
    return result
  }, [visionAnalysisResult, uploadedImageBase64, sessions])

  const totalPages = Math.ceil(allSessionsWithFlaws.length / sessionsPerPage)
  const paginatedSessions = allSessionsWithFlaws.slice(
    (currentPage - 1) * sessionsPerPage,
    currentPage * sessionsPerPage
  )
  const totalFlawsCurrentSession = allSessionsWithFlaws[0]?.flaws.length || 0

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "Hard") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (difficulty === "Medium") return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    return "bg-green-500/20 text-green-400 border-green-500/30"
  }

  const getSeverityColor = (severity: string) => {
    if (severity === "CRITICAL") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (severity === "MODERATE") return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  }

  return (
    <div className="space-y-6 relative">
      {/* GOLD Video Game Style Points Animation */}
      <InlinePointsBurst points={1} show={showPointsBurst} label="IQ" />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-red-400 uppercase tracking-wider" style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.3)' }}>
                Identified Flaws
              </h2>
              <p className="text-[#888] text-sm">{allSessionsWithFlaws.length} session{allSessionsWithFlaws.length !== 1 ? 's' : ''} • Click to expand</p>
            </div>
          </div>
          <div className="text-center px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/30">
            <p className="text-red-400 text-2xl font-black">{totalFlawsCurrentSession}</p>
            <p className="text-red-400/70 text-xs uppercase">Current Issues</p>
          </div>
        </div>
      </div>

      {/* Sessions Accordion List */}
      <div className="space-y-4">
        {paginatedSessions.map((session) => {
          const isSessionExpanded = expandedSessions.includes(session.id)
          
          return (
            <div
              key={session.id}
              className={`rounded-xl overflow-hidden border transition-all duration-300 ${
                session.isLive 
                  ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-600/5' 
                  : 'border-[#3a3a3a] bg-[#2a2a2a]'
              }`}
            >
              {/* Session Header */}
              <button
                onClick={() => toggleSession(session.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#1a1a1a]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    session.isLive ? 'bg-green-500/20 border border-green-500/40' : 'bg-[#3a3a3a] border border-[#4a4a4a]'
                  }`}>
                    <Calendar className={`w-5 h-5 ${session.isLive ? 'text-green-400' : 'text-[#888]'}`} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#E5E5E5]">{session.displayDate}</h3>
                      {session.isLive && (
                        <span className="px-2 py-0.5 bg-green-500 rounded text-[10px] font-bold text-white">LIVE</span>
                      )}
                    </div>
                    <p className="text-[#888] text-sm">{session.flaws.length} flaw{session.flaws.length !== 1 ? 's' : ''} • Score: {session.score}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    session.flaws.length === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    session.flaws.length <= 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {session.flaws.length === 0 ? 'EXCELLENT' : session.flaws.length <= 2 ? 'GOOD' : 'NEEDS WORK'}
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#4a4a4a] text-[#888] transition-transform duration-300 ${isSessionExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </button>

              {/* Session Content - Expandable */}
              {isSessionExpanded && (
                <div className="border-t border-[#3a3a3a] p-4 space-y-4">
                  {session.flaws.map((flaw: any, flawIdx: number) => {
                    const cardId = `${session.id}-${flawIdx}`
                    const isCardExpanded = expandedCards.includes(cardId)
                    
                    return (
                      <div key={cardId} className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] overflow-hidden">
                        {/* Flaw Header */}
                        <button
                          onClick={() => toggleCard(cardId)}
                          className="w-full p-4 flex items-center justify-between hover:bg-[#2a2a2a]/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-12 rounded-full ${
                              flaw.severity === 'CRITICAL' ? 'bg-red-500' :
                              flaw.severity === 'MODERATE' ? 'bg-orange-500' : 'bg-yellow-500'
                            }`} />
                            <div className="text-left">
                              <h4 className="text-white font-bold">{flaw.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityColor(flaw.severity)}`}>
                                  {flaw.severity}
                                </span>
                                <span className="text-[#666] text-xs">{flaw.category}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-[#666] transition-transform ${isCardExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Flaw Details - Expandable */}
                        {isCardExpanded && (
                          <div className="border-t border-[#2a2a2a] p-4 space-y-4">
                            <div>
                              <p className="text-[#888] text-sm leading-relaxed">{flaw.description}</p>
                            </div>
                            
                            {/* Cause Chain */}
                            {flaw.causeChain && flaw.causeChain.length > 0 && (
                              <div className="bg-[#2a2a2a] rounded-lg p-3">
                                <p className="text-orange-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                  <Zap className="w-3 h-3" /> Cause Chain
                                </p>
                                <div className="space-y-2">
                                  {flaw.causeChain.map((cause: any, i: number) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <span className="text-white text-sm font-medium">{cause.effect}</span>
                                        <span className="text-[#666] text-xs ml-2">— {cause.explanation}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Correction */}
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                              <p className="text-green-400 text-xs font-bold uppercase mb-1 flex items-center gap-2">
                                <Target className="w-3 h-3" /> How to Fix
                              </p>
                              <p className="text-green-300/90 text-sm">{flaw.correction}</p>
                            </div>

                            {/* Drills */}
                            {flaw.drills && flaw.drills.length > 0 && (
                              <div>
                                <p className="text-[#FF6B35] text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                  <Play className="w-3 h-3" /> Recommended Drills
                                </p>
                                <div className="grid gap-2">
                                  {flaw.drills.map((drill: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-[#2a2a2a] rounded-lg p-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                                          <Play className="w-4 h-4 text-[#FF6B35]" />
                                        </div>
                                        <span className="text-white text-sm font-medium">{drill.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[#888] text-xs flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> {drill.reps}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDifficultyColor(drill.difficulty)}`}>
                                          {drill.difficulty}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                currentPage === i + 1
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-[#2a2a2a] text-[#888] hover:bg-[#3a3a3a]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

