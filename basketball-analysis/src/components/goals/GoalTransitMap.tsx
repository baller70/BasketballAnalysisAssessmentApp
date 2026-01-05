"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { X, Target, Navigation, Trophy, Award, Flame, Dumbbell, Calendar, ArrowRight, Plus, Clock, Check, CircleDot, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// Mapbox access token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmFsbGVyNzAiLCJhIjoiY2xzNXUybnJiMWpmeDJtbXU0c3R6bmYxbCJ9.E8wE8cllAFL9WeZ4WiITDA'

interface GoalStop {
  id: string
  name: string
  landmark: string
  coordinates: [number, number] // [lng, lat]
  icon: string
  completed: boolean
  current: boolean
  goalDescription: string
  xpReward: number
}

interface GoalTransitMapProps {
  playerCity?: string
  playerState?: string
  playerLat?: number
  playerLng?: number
}

export function GoalTransitMap({ playerCity, playerState, playerLat, playerLng }: GoalTransitMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [isFullRouteView, setIsFullRouteView] = useState(false)
  
  // Function to view full route
  const viewFullRoute = useCallback(async () => {
    if (!map.current) return
    const mapboxglModule = await import('mapbox-gl')
    const mapboxgl = mapboxglModule.default
    const bounds = new mapboxgl.LngLatBounds()
    goalStops.forEach(stop => bounds.extend(stop.coordinates))
    map.current.fitBounds(bounds, { padding: 80, duration: 1500 })
    setIsFullRouteView(true)
  }, [])
  
  // Function to zoom to current goal
  const zoomToCurrentGoal = useCallback(() => {
    if (!map.current) return
    const currentStop = goalStops.find(s => s.current)
    if (currentStop) {
      map.current.flyTo({
        center: currentStop.coordinates,
        zoom: 14.5,
        duration: 1500
      })
      setIsFullRouteView(false)
    }
  }, [])
  
  // Default to Union City, NJ area (like the screenshot) if no location provided
  const centerLat = playerLat || 40.7795
  const centerLng = playerLng || -74.0324
  const cityName = playerCity || 'West New York'
  const stateName = playerState || 'NJ'
  
  // Goal stops with coordinates spread across a WIDE area - zigzagging through the region
  // Route spans ~10 miles, forcing user to scroll/explore the map
  // Will be dynamically generated based on user's location + nearby landmarks via Places API
  const goalStops: GoalStop[] = [
    { 
      id: '1', 
      name: 'START', 
      landmark: 'Liberty State Park', 
      coordinates: [-74.0550, 40.7090], // Jersey City - South (START)
      icon: 'start',
      completed: true, 
      current: false, 
      goalDescription: 'Begin Your Journey', 
      xpReward: 0 
    },
    { 
      id: '2', 
      name: 'FORM CHECK', 
      landmark: 'Exchange Place', 
      coordinates: [-74.0328, 40.7162], // Jersey City Downtown - East
      icon: 'target',
      completed: true, 
      current: false, 
      goalDescription: 'Perfect Form Baseline', 
      xpReward: 50 
    },
    { 
      id: '3', 
      name: '50 SHOTS', 
      landmark: 'Hoboken Waterfront', 
      coordinates: [-74.0280, 40.7370], // Hoboken - Northeast
      icon: 'dumbbell',
      completed: true, 
      current: false, 
      goalDescription: '50 Practice Shots', 
      xpReward: 100 
    },
    { 
      id: '4', 
      name: '90° ELBOW', 
      landmark: cityName + ' Recreation Center', 
      coordinates: [-74.0630, 40.7580], // Union City - West (CURRENT)
      icon: 'current',
      completed: false, 
      current: true, 
      goalDescription: 'Perfect Elbow Angle', 
      xpReward: 150 
    },
    { 
      id: '5', 
      name: '100 MAKES', 
      landmark: 'North Bergen High School', 
      coordinates: [-74.0200, 40.7850], // North Bergen - East
      icon: 'flame',
      completed: false, 
      current: false, 
      goalDescription: '100 Makes Challenge', 
      xpReward: 200 
    },
    { 
      id: '6', 
      name: 'STREAK MASTER', 
      landmark: 'Overpeck County Park', 
      coordinates: [-74.0450, 40.8150], // Ridgefield Park - Northwest
      icon: 'star',
      completed: false, 
      current: false, 
      goalDescription: '7-Day Practice Streak', 
      xpReward: 300 
    },
    { 
      id: '7', 
      name: 'FORM PERFECT', 
      landmark: 'Meadowlands Sports Complex', 
      coordinates: [-74.0740, 40.8120], // East Rutherford - West
      icon: 'award',
      completed: false, 
      current: false, 
      goalDescription: '95%+ Form Score', 
      xpReward: 400 
    },
    { 
      id: '8', 
      name: 'ELITE BADGE', 
      landmark: 'MetLife Stadium', 
      coordinates: [-74.0744, 40.8135], // Final Destination - Championship Venue
      icon: 'trophy',
      completed: false, 
      current: false, 
      goalDescription: 'Elite Shooter Badge', 
      xpReward: 500 
    },
  ]
  
  const completedCount = goalStops.filter(s => s.completed).length
  const currentGoal = goalStops.find(s => s.current)
  const totalGoals = goalStops.length - 1

  useEffect(() => {
    if (!mapContainer.current) return
    
    // Dynamically import mapbox-gl to avoid SSR issues
    const initMap = async () => {
      try {
        // Add Mapbox CSS to head if not already present
        if (!document.querySelector('link[href*="mapbox-gl"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css'
          document.head.appendChild(link)
          // Wait for CSS to load
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        const mapboxglModule = await import('mapbox-gl')
        const mapboxgl = mapboxglModule.default
        
        if (map.current) return // Already initialized
        
        mapboxgl.accessToken = MAPBOX_TOKEN
        
        // Find current goal to center map on it
        const currentGoalStop = goalStops.find(s => s.current)
        const mapCenter = currentGoalStop ? currentGoalStop.coordinates : [centerLng, centerLat]
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11', // Dark style like NJ Transit
          center: mapCenter as [number, number],
          zoom: 14.5, // Zoomed in tight - user must scroll to see full route
          pitch: 0,
          bearing: 0,
          attributionControl: false,
        })
        
        map.current.on('load', () => {
          if (!map.current) return
          setMapLoaded(true)
          
          // Create route coordinates
          const routeCoordinates = goalStops.map(stop => stop.coordinates)
          
          // Add route line source
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates
              }
            }
          })
          
          // Add route line layer - ORANGE like the app theme
          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#FF6B35',
              'line-width': 6,
              'line-opacity': 1
            }
          })
          
          // Add route line glow effect
          map.current.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#FF6B35',
              'line-width': 12,
              'line-opacity': 0.3,
              'line-blur': 4
            }
          }, 'route-line')
          
          // Add stop markers with labels
          goalStops.forEach((stop, index) => {
            const el = document.createElement('div')
            el.style.cssText = 'display: flex; align-items: center; gap: 8px;'
            
            // Alternate label position (left/right) for visual variety
            const labelOnRight = index % 2 === 0
            
            if (stop.current) {
              // Current position - large white circle with basketball icon + prominent label
              el.className = 'current-stop-marker'
              el.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex-direction: ${labelOnRight ? 'row' : 'row-reverse'};">
                  <div style="
                    width: 56px;
                    height: 56px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 20px rgba(255, 107, 53, 0.5);
                    border: 4px solid white;
                    animation: pulse 2s infinite;
                    flex-shrink: 0;
                  ">
                    <div style="
                      width: 40px;
                      height: 40px;
                      background: #FF6B35;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                        <line x1="12" y1="2" x2="12" y2="6"/>
                        <line x1="12" y1="18" x2="12" y2="22"/>
                        <line x1="2" y1="12" x2="6" y2="12"/>
                        <line x1="18" y1="12" x2="22" y2="12"/>
                      </svg>
                    </div>
                  </div>
                  <div style="
                    background: rgba(255, 107, 53, 0.95);
                    padding: 8px 14px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    white-space: nowrap;
                  ">
                    <div style="color: white; font-weight: 800; font-size: 13px; letter-spacing: 0.5px;">${stop.name}</div>
                    <div style="color: rgba(255,255,255,0.8); font-size: 11px; margin-top: 2px;">${stop.landmark}</div>
                  </div>
                </div>
              `
            } else if (stop.completed) {
              // Completed stop - orange filled dot + label
              el.className = 'completed-stop-marker'
              el.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; flex-direction: ${labelOnRight ? 'row' : 'row-reverse'};">
                  <div style="
                    width: 16px;
                    height: 16px;
                    background: #FF6B35;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    flex-shrink: 0;
                  "></div>
                  <div style="
                    background: rgba(0,0,0,0.7);
                    padding: 6px 10px;
                    border-radius: 6px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    white-space: nowrap;
                    backdrop-filter: blur(4px);
                  ">
                    <div style="color: #FF6B35; font-weight: 700; font-size: 11px; letter-spacing: 0.5px;">✓ ${stop.name}</div>
                    <div style="color: rgba(255,255,255,0.6); font-size: 10px;">${stop.landmark}</div>
                  </div>
                </div>
              `
            } else {
              // Future stop - white dot + muted label
              el.className = 'future-stop-marker'
              el.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; flex-direction: ${labelOnRight ? 'row' : 'row-reverse'};">
                  <div style="
                    width: 12px;
                    height: 12px;
                    background: rgba(255,255,255,0.5);
                    border-radius: 50%;
                    border: 2px solid rgba(255,255,255,0.3);
                    flex-shrink: 0;
                  "></div>
                  <div style="
                    background: rgba(0,0,0,0.5);
                    padding: 5px 8px;
                    border-radius: 5px;
                    white-space: nowrap;
                    backdrop-filter: blur(4px);
                  ">
                    <div style="color: rgba(255,255,255,0.5); font-weight: 600; font-size: 10px; letter-spacing: 0.5px;">${stop.name}</div>
                    <div style="color: rgba(255,255,255,0.3); font-size: 9px;">${stop.landmark}</div>
                  </div>
                </div>
              `
            }
            
            new mapboxgl.Marker({ element: el, anchor: 'center' })
              .setLngLat(stop.coordinates)
              .addTo(map.current!)
          })
          
          // Add user start location marker (blue pulsing dot)
          const userMarkerEl = document.createElement('div')
          userMarkerEl.innerHTML = `
            <div style="position: relative;">
              <div style="
                width: 16px;
                height: 16px;
                background: #3B82F6;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
                position: relative;
                z-index: 2;
              "></div>
              <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 16px;
                height: 16px;
                background: #3B82F6;
                border-radius: 50%;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                opacity: 0.75;
              "></div>
            </div>
          `
          
          new mapboxgl.Marker({ element: userMarkerEl })
            .setLngLat(goalStops[0].coordinates)
            .addTo(map.current!)
          
          // DON'T fit bounds - keep zoomed in so user must scroll to explore
          // This creates engagement and a sense of journey
          
          // Add navigation controls
          map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
        })
        
        // Add CSS for animations
        const style = document.createElement('style')
        style.textContent = `
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          .mapboxgl-canvas {
            outline: none;
          }
          /* Hide Mapbox logo and attribution */
          .mapboxgl-ctrl-logo,
          .mapboxgl-ctrl-attrib {
            display: none !important;
          }
        `
        document.head.appendChild(style)
      } catch (error) {
        console.error('Error initializing Mapbox:', error)
      }
    }
    
    initMap()
    
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [centerLat, centerLng])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-2xl">
      {/* Map Container */}
      <div className="relative h-[500px]" style={{ backgroundColor: '#0a1628' }}>
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ minHeight: '500px' }} />
        
        {/* Loading indicator */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a1628] z-5">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60 text-sm">Loading map...</p>
            </div>
          </div>
        )}
        
        {/* Top Left - Route Identity Overlay */}
        <div className="absolute top-4 left-4 z-10">
          {/* Leaderboard Rank Badge - Orange theme */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-[#FF6B35] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg shadow-[#FF6B35]/30">
              <span className="text-white/80 text-xs font-medium">#</span>
              <span className="text-white text-base font-black">20</span>
              <span className="text-white/80 text-xs font-medium">RANK</span>
            </div>
          </div>
          {/* User League - Light orange outline style */}
          <div 
            className="text-5xl font-black tracking-tight"
            style={{ 
              color: 'transparent',
              WebkitTextStroke: '0.5px rgba(255, 107, 53, 0.7)',
              letterSpacing: '3px'
            }}
          >
            MY GOALS
          </div>
          {/* Journey Progress - Orange gradient bars */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white text-sm font-bold tracking-wider drop-shadow-lg">JOURNEY</span>
            <div className="flex gap-0.5">
              {/* Show progress: filled = completed, empty = remaining */}
              {goalStops.map((stop, i) => (
                <div 
                  key={i}
                  className={`w-1.5 h-4 rounded-sm ${
                    stop.completed 
                      ? 'bg-[#FF6B35]' 
                      : stop.current 
                      ? 'bg-[#FF6B35]/60' 
                      : 'bg-[#3a3a3a]'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Top Right - Control Buttons */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button 
            onClick={() => {/* Close/minimize */}}
            className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            title="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={isFullRouteView ? zoomToCurrentGoal : viewFullRoute}
            className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
            title={isFullRouteView ? "Zoom to Current Goal" : "View Full Route"}
          >
            <Target className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={zoomToCurrentGoal}
            className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
            title="My Location"
          >
            <Navigation className="w-6 h-6 text-white" />
          </button>
        </div>
        
      </div>
      
      {/* Bottom Section - Destination & Controls */}
      <div className="bg-[#0a1628] p-4">
        {/* Current Goal Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl">{currentGoal?.name || 'Next Goal'}</span>
              <span className="text-white/60 text-sm ml-2">via {currentGoal?.landmark || 'Form Training'}</span>
            </div>
          </div>
          <button 
            onClick={zoomToCurrentGoal}
            className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold px-6 py-2 rounded-xl transition-colors shadow-lg shadow-[#FF6B35]/30 text-lg"
          >
            GO
          </button>
        </div>
        
        {/* Stat Cards - 3 in a row - Subtle dark theme with orange outline */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Goals Completed */}
          <div className="bg-gradient-to-br from-[#1a2a3a] to-[#0f1a24] rounded-xl px-2 py-4 text-center relative overflow-hidden border border-[#FF6B35]/30 hover:border-[#FF6B35]/60 hover:shadow-lg hover:shadow-[#FF6B35]/20 transition-all duration-300 cursor-pointer">
            <div className="absolute top-2 right-2 opacity-30">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
              <div className="flex gap-0.5 mt-0.5">
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
            <div className="text-4xl font-black text-white">{completedCount}</div>
            <div className="text-white/50 text-xs">completed</div>
            <div className="mt-2 flex justify-center">
              <div className="flex gap-0.5">
                {goalStops.slice(0, 4).map((stop, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${stop.completed ? 'bg-[#FF6B35]' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Goals Remaining */}
          <div className="bg-gradient-to-br from-[#1a2a3a] to-[#0f1a24] rounded-xl px-2 py-4 text-center relative overflow-hidden border border-[#FF6B35]/30 hover:border-[#FF6B35]/60 hover:shadow-lg hover:shadow-[#FF6B35]/20 transition-all duration-300 cursor-pointer">
            <div className="absolute top-2 right-2 opacity-30">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
            <div className="text-4xl font-black text-white">{goalStops.length - completedCount - 1}</div>
            <div className="text-white/50 text-xs">remaining</div>
          </div>
          
          {/* Streak */}
          <div className="bg-gradient-to-br from-[#1a2a3a] to-[#0f1a24] rounded-xl px-2 py-4 text-center relative overflow-hidden border border-[#FF6B35]/30 hover:border-[#FF6B35]/60 hover:shadow-lg hover:shadow-[#FF6B35]/20 transition-all duration-300 cursor-pointer">
            <div className="text-4xl font-black text-white">7</div>
            <div className="text-white/50 text-xs">day streak</div>
            <div className="mt-1 bg-white/10 rounded px-1.5 py-0.5 text-[9px] text-white/70 font-medium uppercase tracking-wider inline-block">
              On Track
            </div>
          </div>
        </div>
        
        {/* Status Badges - Basketball Relevant */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Progress Status - Green/Yellow/Red based on status */}
          <div className="flex items-center gap-2 bg-green-500 rounded-full px-4 py-2 flex-shrink-0">
            <div className="w-5 h-5 bg-green-700 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-white text-sm font-semibold">On Track</span>
          </div>
          {/* Goal Deadline - Orange theme */}
          <div className="flex items-center gap-2 bg-[#FF6B35] rounded-full px-4 py-2 flex-shrink-0">
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Goal: Jan 31</span>
          </div>
          {/* Average Form Score - Orange theme */}
          <div className="flex items-center gap-2 bg-[#FF6B35] rounded-full px-4 py-2 flex-shrink-0">
            <span className="text-white text-sm font-medium">85% Form</span>
          </div>
        </div>
      </div>
      
      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#3a3a3a] w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] p-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Add New Goal</h3>
              <button onClick={() => setShowAddGoal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[#888] text-sm block mb-2">Goal Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Form', 'Consistency', 'Volume', 'Accuracy'].map(type => (
                    <button key={type} className="bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] rounded-lg p-3 text-center transition-colors">
                      <div className="text-white font-bold">{type}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold py-3 rounded-lg transition-colors">
                Add to Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalTransitMap

