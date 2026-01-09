"use client"

/**
 * Media Gallery Page
 * 
 * Displays all uploaded media organized by sessions and dates.
 * - Mobile-first design with responsive layouts
 * - Vertical/Portrait and Landscape support
 * - Fullscreen view for media items
 * - Organized by sessions and dates
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Clock, 
  ChevronRight,
  X,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  Filter,
  Grid,
  List,
  Dumbbell,
  Camera,
  Upload,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getAllSessions, deleteSession, type AnalysisSession } from '@/services/sessionStorage'

// ============================================
// TYPES
// ============================================

type MediaType = 'all' | 'image' | 'video' | 'live' | 'workout'
type ViewMode = 'grid' | 'list'
type SortOrder = 'newest' | 'oldest' | 'score'

interface GroupedSessions {
  date: string
  displayDate: string
  sessions: AnalysisSession[]
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function getMediaTypeIcon(session: AnalysisSession) {
  if (session.mediaType === 'video' || session.videoData) {
    return <Video className="w-4 h-4" />
  }
  return <ImageIcon className="w-4 h-4" />
}

function getMediaTypeLabel(session: AnalysisSession): string {
  if (session.videoData) {
    return session.id.startsWith('live-') ? 'Live' : 'Video'
  }
  return 'Image'
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

function groupSessionsByDate(sessions: AnalysisSession[]): GroupedSessions[] {
  const groups: Record<string, AnalysisSession[]> = {}
  
  sessions.forEach(session => {
    const dateKey = new Date(session.date).toISOString().split('T')[0]
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(session)
  })
  
  return Object.entries(groups)
    .map(([date, sessions]) => ({
      date,
      displayDate: formatDate(sessions[0].date),
      sessions: sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// ============================================
// COMPONENTS
// ============================================

function MediaCard({ 
  session, 
  viewMode, 
  onSelect, 
  onDelete 
}: { 
  session: AnalysisSession
  viewMode: ViewMode
  onSelect: () => void
  onDelete: () => void
}) {
  const isVideo = session.mediaType === 'video' || !!session.videoData
  const isLive = session.id.startsWith('live-')
  const score = session.analysisData?.overallScore || 0
  
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden"
      >
        <button
          onClick={onSelect}
          className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
        >
          {/* Thumbnail */}
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#2a2a2a] flex-shrink-0">
            {session.mainImageBase64 ? (
              <Image
                src={session.mainImageBase64}
                alt="Session thumbnail"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVideo ? <Video className="w-8 h-8 text-white/30" /> : <ImageIcon className="w-8 h-8 text-white/30" />}
              </div>
            )}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="w-6 h-6 text-white" />
              </div>
            )}
            {/* Type badge */}
            <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
              isLive ? 'bg-red-500' : isVideo ? 'bg-blue-500' : 'bg-green-500'
            }`}>
              {isLive ? 'Live' : isVideo ? 'Video' : 'Image'}
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-2xl font-black ${getScoreColor(score)}`}>{score}</span>
              <span className="text-white/40 text-sm">/ 100</span>
            </div>
            <p className="text-white/60 text-sm truncate">
              {session.analysisData?.shooterLevel || 'Analysis'}
            </p>
            <p className="text-white/40 text-xs mt-1">
              {formatTime(session.date)}
            </p>
          </div>
          
          <ChevronRight className="w-5 h-5 text-white/30" />
        </button>
      </motion.div>
    )
  }
  
  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      <button
        onClick={onSelect}
        className="w-full aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 hover:border-[#FF6B35]/50 transition-all"
      >
        {/* Thumbnail */}
        <div className="relative w-full h-full">
          {session.mainImageBase64 ? (
            <Image
              src={session.mainImageBase64}
              alt="Session thumbnail"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a]">
              {isVideo ? <Video className="w-12 h-12 text-white/30" /> : <ImageIcon className="w-12 h-12 text-white/30" />}
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          {/* Play button for videos */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          )}
          
          {/* Type badge */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
            isLive ? 'bg-red-500' : isVideo ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            {isLive ? 'Live' : isVideo ? 'Video' : 'Image'}
          </div>
          
          {/* Score */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center justify-between">
              <span className={`text-xl font-black ${getScoreColor(score)}`}>{score}</span>
              <span className="text-white/60 text-xs">{formatTime(session.date)}</span>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  )
}

function FullscreenViewer({
  session,
  onClose,
  onDelete,
}: {
  session: AnalysisSession
  onClose: () => void
  onDelete: () => void
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  
  const isVideo = session.mediaType === 'video' || !!session.videoData
  const score = session.analysisData?.overallScore || 0
  
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    } else {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleFullscreen}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-white" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Media */}
      <div className="w-full h-full flex items-center justify-center p-4">
        {isVideo && session.videoData?.annotatedFramesBase64?.[0] ? (
          <div className="relative max-w-full max-h-full">
            <video
              ref={videoRef}
              src={session.videoData.annotatedFramesBase64[0]}
              className="max-w-full max-h-[80vh] object-contain"
              loop
              playsInline
              onClick={handlePlayPause}
            />
            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </button>
            )}
          </div>
        ) : session.mainImageBase64 ? (
          <Image
            src={session.mainImageBase64}
            alt="Analysis"
            width={1920}
            height={1080}
            className="max-w-full max-h-[80vh] object-contain"
          />
        ) : (
          <div className="text-white/40 text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4" />
            <p>No media available</p>
          </div>
        )}
      </div>
      
      {/* Footer - Session Info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className={`text-3xl font-black ${getScoreColor(score)}`}>{score}</span>
              <span className="text-white/40 text-lg ml-2">/ 100</span>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{session.analysisData?.shooterLevel || 'Analysis'}</p>
              <p className="text-white/40 text-sm">{formatDate(session.date)}</p>
            </div>
          </div>
          
          {/* Angles */}
          {session.analysisData?.angles && Object.keys(session.analysisData.angles).length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(session.analysisData.angles).slice(0, 5).map(([key, value]) => (
                <div key={key} className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-white font-bold text-sm">{typeof value === 'number' ? `${value}°` : '--'}</p>
                  <p className="text-white/40 text-[10px] uppercase">{key.replace('Angle', '')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function MediaGalleryPage() {
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MediaType>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [selectedSession, setSelectedSession] = useState<AnalysisSession | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Load sessions
  useEffect(() => {
    const loadSessions = () => {
      const allSessions = getAllSessions()
      setSessions(allSessions)
      setLoading(false)
    }
    loadSessions()
  }, [])
  
  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions]
    
    // Filter by type
    if (filter !== 'all') {
      result = result.filter(s => {
        if (filter === 'video') return s.mediaType === 'video' && !s.id.startsWith('live-')
        if (filter === 'live') return s.id.startsWith('live-')
        if (filter === 'image') return s.mediaType === 'image' || !s.mediaType
        if (filter === 'workout') return s.id.includes('workout')
        return true
      })
    }
    
    // Sort
    if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (sortOrder === 'score') {
      result.sort((a, b) => (b.analysisData?.overallScore || 0) - (a.analysisData?.overallScore || 0))
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
    
    return result
  }, [sessions, filter, sortOrder])
  
  // Group by date
  const groupedSessions = useMemo(() => {
    return groupSessionsByDate(filteredSessions)
  }, [filteredSessions])
  
  // Handle delete
  const handleDelete = useCallback((sessionId: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      setSelectedSession(null)
    }
  }, [])
  
  // Stats
  const stats = useMemo(() => {
    const images = sessions.filter(s => s.mediaType === 'image' || !s.mediaType).length
    const videos = sessions.filter(s => s.mediaType === 'video' && !s.id.startsWith('live-')).length
    const live = sessions.filter(s => s.id.startsWith('live-')).length
    const avgScore = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.analysisData?.overallScore || 0), 0) / sessions.length)
      : 0
    return { images, videos, live, avgScore, total: sessions.length }
  }, [sessions])
  
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/results/demo" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">My Media</h1>
                <p className="text-white/40 text-sm">{stats.total} sessions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-full transition-colors ${
                  showFilters ? 'bg-[#FF6B35] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {viewMode === 'grid' ? (
                  <List className="w-5 h-5 text-white" />
                ) : (
                  <Grid className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex-shrink-0 bg-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-white font-bold">{stats.avgScore}</span>
              <span className="text-white/40 text-sm">Avg</span>
            </div>
            <div className="flex-shrink-0 bg-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-green-400" />
              <span className="text-white font-bold">{stats.images}</span>
            </div>
            <div className="flex-shrink-0 bg-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              <span className="text-white font-bold">{stats.videos}</span>
            </div>
            <div className="flex-shrink-0 bg-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-red-400" />
              <span className="text-white font-bold">{stats.live}</span>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10"
            >
              <div className="p-4 space-y-3">
                {/* Type filter */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'All', icon: Grid },
                    { id: 'image', label: 'Images', icon: ImageIcon },
                    { id: 'video', label: 'Videos', icon: Video },
                    { id: 'live', label: 'Live', icon: Camera },
                    { id: 'workout', label: 'Workouts', icon: Dumbbell },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setFilter(id as MediaType)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        filter === id
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
                
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-sm">Sort:</span>
                  {[
                    { id: 'newest', label: 'Newest' },
                    { id: 'oldest', label: 'Oldest' },
                    { id: 'score', label: 'Best Score' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setSortOrder(id as SortOrder)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        sortOrder === id
                          ? 'bg-white/20 text-white'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Upload className="w-10 h-10 text-white/30" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Media Yet</h2>
            <p className="text-white/40 mb-6">
              {filter === 'all' 
                ? "Upload images, videos, or go live to start analyzing your shot!"
                : `No ${filter} sessions found.`
              }
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-xl hover:bg-[#E55A2A] transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Media
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedSessions.map((group) => (
              <div key={group.date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#FF6B35]" />
                  <h2 className="text-white font-bold">{group.displayDate}</h2>
                  <span className="text-white/40 text-sm">({group.sessions.length})</span>
                </div>
                
                {/* Sessions */}
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
                  : 'space-y-3'
                }>
                  <AnimatePresence mode="popLayout">
                    {group.sessions.map((session) => (
                      <MediaCard
                        key={session.id}
                        session={session}
                        viewMode={viewMode}
                        onSelect={() => setSelectedSession(session)}
                        onDelete={() => handleDelete(session.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedSession && (
          <FullscreenViewer
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
            onDelete={() => handleDelete(selectedSession.id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
