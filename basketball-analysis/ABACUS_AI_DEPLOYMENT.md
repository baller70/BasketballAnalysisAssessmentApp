# Abacus AI Deployment Guide - Basketball Shooting Analysis

This document provides comprehensive documentation for deploying the Basketball Shooting Analysis application on Abacus AI. It includes complete codebase structure, file purposes, data flows, and deployment requirements.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Complete File Structure](#3-complete-file-structure)
4. [Core Application Flow](#4-core-application-flow)
5. [File-by-File Documentation](#5-file-by-file-documentation)
6. [API Endpoints](#6-api-endpoints)
7. [State Management](#7-state-management)
8. [External Services & Dependencies](#8-external-services--dependencies)
9. [Environment Variables](#9-environment-variables)
10. [Build & Deployment](#10-build--deployment)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Project Overview

### What This Application Does

The Basketball Shooting Analysis Tool is an AI-powered web application that analyzes basketball shooting form through:

1. **Image Analysis**: Users upload 3-7 photos of their shooting form
2. **Video Analysis**: Users upload videos (up to 10 seconds) of their shooting motion
3. **Pose Detection**: AI detects body keypoints and calculates joint angles
4. **Form Scoring**: Algorithms score shooting mechanics against optimal benchmarks
5. **Elite Comparison**: Matches users with NBA shooters who have similar form
6. **Coaching Feedback**: Generates personalized improvement recommendations

### Key Features

- Real-time pose detection using YOLOv8-pose + MediaPipe
- 12+ biomechanical measurements (elbow angle, knee bend, release height, etc.)
- Phase-based analysis (Setup → Release → Follow-through)
- Elite shooter database with 50+ NBA players
- Gamification system (points, badges, streaks)
- Session history and progress tracking

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.28 | React framework with App Router |
| React | 18.x | UI library (Requires `useId` hook support) |
| Node.js | 18.17+ | Runtime environment |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Zustand | 4.x | State management |
| Lucide React | Latest | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 14.x | Serverless API endpoints |
| Prisma | 6.7.0 | Database ORM |
| AWS S3 | - | Image storage |

### External Services
| Service | Purpose |
|---------|---------|
| Python Backend (port 5001) | Pose detection (YOLOv8 + MediaPipe) |
| Video Backend (port 5002) | Video frame extraction |
| Roboflow API | Basketball detection |
| AWS S3 | Image storage |

---

## 3. Complete File Structure

```
basketball-analysis/
│
├── 📁 src/                           # Source code root
│   │
│   ├── 📁 app/                       # Next.js App Router (Pages & API)
│   │   │
│   │   ├── 📄 page.tsx               # HOME PAGE - Main upload interface
│   │   │                             # Handles image/video upload, analysis trigger
│   │   │                             # ~600 lines
│   │   │
│   │   ├── 📄 layout.tsx             # Root layout with Header/Footer
│   │   ├── 📄 providers.tsx          # React Query provider setup
│   │   ├── 📄 globals.css            # Global Tailwind styles
│   │   │
│   │   ├── 📁 results/
│   │   │   └── 📁 demo/
│   │   │       └── 📄 page.tsx       # RESULTS PAGE - Analysis display
│   │   │                             # Shows skeleton, angles, scores, comparisons
│   │   │                             # ~8000 lines (largest file)
│   │   │
│   │   ├── 📁 profile/
│   │   │   └── 📄 page.tsx           # User profile management
│   │   │
│   │   ├── 📁 elite-shooters/
│   │   │   └── 📄 page.tsx           # Elite shooter database browser
│   │   │
│   │   ├── 📁 settings/
│   │   │   └── 📄 page.tsx           # App settings
│   │   │
│   │   ├── 📁 upload/
│   │   │   └── 📄 page.tsx           # Alternative upload page
│   │   │
│   │   ├── 📁 video-analysis/
│   │   │   └── 📄 page.tsx           # Video-specific analysis page
│   │   │
│   │   └── 📁 api/                   # API Routes (Serverless Functions)
│   │       │
│   │       ├── 📁 detect-basketball/
│   │       │   └── 📄 route.ts       # POST: Roboflow ball detection
│   │       │
│   │       ├── 📁 upload/
│   │       │   └── 📄 route.ts       # POST: S3 image upload
│   │       │
│   │       ├── 📁 save-analysis/
│   │       │   └── 📄 route.ts       # POST: Save analysis to database
│   │       │
│   │       ├── 📁 profile/
│   │       │   └── 📄 route.ts       # GET/POST: User profile CRUD
│   │       │
│   │       ├── 📁 analysis-history/
│   │       │   └── 📄 route.ts       # GET: Historical analysis data
│   │       │
│   │       ├── 📁 compare-shooters/
│   │       │   └── 📄 route.ts       # POST: Elite shooter comparison
│   │       │
│   │       ├── 📁 create-visualization/
│   │       │   └── 📄 route.ts       # POST: Generate visualizations
│   │       │
│   │       ├── 📁 crop-image/
│   │       │   └── 📄 route.ts       # POST: Image cropping
│   │       │
│   │       ├── 📁 bodypix-crop/
│   │       │   └── 📄 route.ts       # POST: Body segmentation
│   │       │
│   │       ├── 📁 enhance-bio/
│   │       │   └── 📄 route.ts       # POST: Bio enhancement
│   │       │
│   │       └── 📁 scraper/
│   │           └── 📄 route.ts       # POST: Data scraping utilities
│   │
│   ├── 📁 components/                # React Components
│   │   │
│   │   ├── 📁 upload/                # Upload-related components
│   │   │   ├── 📄 index.ts           # Barrel exports
│   │   │   ├── 📄 MediaUpload.tsx    # Image upload with 7-slot grid
│   │   │   ├── 📄 VideoUploadInline.tsx # Video upload component
│   │   │   ├── 📄 VideoUpload.tsx    # Full video upload page
│   │   │   ├── 📄 PlayerProfileForm.tsx # Player info form
│   │   │   ├── 📄 UploadEducation.tsx # Upload tips
│   │   │   ├── 📄 UploadQualityScore.tsx # Quality scoring
│   │   │   └── 📄 PreUploadValidation.tsx # Validation display
│   │   │
│   │   ├── 📁 analysis/              # Analysis display components
│   │   │   ├── 📄 index.ts           # Barrel exports
│   │   │   ├── 📄 AnalysisDashboard.tsx # Main dashboard
│   │   │   ├── 📄 AnalysisProgress.tsx # Progress bar
│   │   │   ├── 📄 AnalysisProgressScreen.tsx # Full progress screen
│   │   │   ├── 📄 AngleIndicators.tsx # Angle measurement display
│   │   │   ├── 📄 AnnotatedImageDisplay.tsx # Image with annotations
│   │   │   ├── 📄 AnnotationToolbar.tsx # Annotation tools
│   │   │   ├── 📄 AnnotationWalkthroughVideo.tsx # Video walkthrough
│   │   │   ├── 📄 AutoScreenshots.tsx # Auto-generated screenshots
│   │   │   ├── 📄 EnhancedShotStrip.tsx # Enhanced shot strip
│   │   │   ├── 📄 ExportButton.tsx   # Export functionality
│   │   │   ├── 📄 FormScoreCard.tsx  # Score display card
│   │   │   ├── 📄 PoseAnalysis.tsx   # Pose analysis display
│   │   │   ├── 📄 ProgressTracker.tsx # Progress tracking
│   │   │   ├── 📄 ShotBreakdownStrip.tsx # Shot phase strip
│   │   │   ├── 📄 SkeletonOverlay.tsx # Pose skeleton drawing
│   │   │   ├── 📄 SplitScreenComparison.tsx # Side-by-side view
│   │   │   └── 📄 VideoFrameCapture.tsx # Frame capture
│   │   │
│   │   ├── 📁 icons/                 # Custom icon components
│   │   │   ├── 📄 index.ts           # Barrel exports
│   │   │   ├── 📄 MedalIcons.tsx     # Gold/Silver/Bronze medals
│   │   │   ├── 📄 IconSystem.tsx     # Core icon components
│   │   │   ├── 📄 IconWrapper.tsx    # Icon utility wrapper
│   │   │   ├── 📄 StatusIcon.tsx     # Status indicators
│   │   │   ├── 📄 FormMetricIcon.tsx # Form metric icons
│   │   │   └── 📄 CoachingLevelIcon.tsx # Coaching tier icons
│   │   │
│   │   ├── 📁 ui/                    # Shared UI primitives
│   │   │   ├── 📄 button.tsx         # Button component
│   │   │   ├── 📄 card.tsx           # Card component
│   │   │   ├── 📄 input.tsx          # Input component
│   │   │   ├── 📄 label.tsx          # Label component
│   │   │   ├── 📄 badge.tsx          # Badge component
│   │   │   ├── 📄 progress.tsx       # Progress bar
│   │   │   ├── 📄 select.tsx         # Select dropdown
│   │   │   ├── 📄 tabs.tsx           # Tab component
│   │   │   └── 📄 CollapsibleSection.tsx # Collapsible sections
│   │   │
│   │   ├── 📁 profile/               # Profile components
│   │   │   ├── 📄 index.ts           # Barrel exports
│   │   │   ├── 📄 ProfileCard.tsx    # Profile display
│   │   │   ├── 📄 ProfileWizard.tsx  # Setup wizard
│   │   │   └── 📁 cards/             # Individual profile cards
│   │   │       ├── 📄 index.ts
│   │   │       ├── 📄 AgeCard.tsx
│   │   │       ├── 📄 HeightCard.tsx
│   │   │       ├── 📄 WeightCard.tsx
│   │   │       └── ... (more cards)
│   │   │
│   │   ├── 📁 comparison/            # Comparison components
│   │   │   └── 📄 Phase6ComparisonPanel.tsx
│   │   │
│   │   ├── 📁 gamification/          # Gamification UI
│   │   │   └── 📄 GamificationComponents.tsx
│   │   │
│   │   └── 📁 layout/                # Layout components
│   │       ├── 📄 Header.tsx         # App header/nav
│   │       └── 📄 Footer.tsx         # App footer
│   │
│   ├── 📁 services/                  # Business logic services
│   │   ├── 📄 index.ts               # Barrel exports
│   │   ├── 📄 visionAnalysis.ts      # Image pose detection
│   │   ├── 📄 videoAnalysis.ts       # Video processing
│   │   ├── 📄 sessionStorage.ts      # localStorage management
│   │   ├── 📄 coachingInsights.ts    # Coaching feedback
│   │   ├── 📄 comparisonAlgorithm.ts # Shooter matching
│   │   ├── 📄 eliteShooters.ts       # Elite shooter data access
│   │   └── 📄 gamificationService.ts # Points/badges/streaks
│   │
│   ├── 📁 stores/                    # Zustand state stores
│   │   ├── 📄 index.ts               # Barrel exports
│   │   ├── 📄 analysisStore.ts       # Main analysis state
│   │   └── 📄 profileStore.ts        # User profile state
│   │
│   ├── 📁 data/                      # Static data & databases
│   │   ├── 📄 index.ts               # Barrel exports
│   │   ├── 📄 eliteShooters.ts       # NBA shooter profiles
│   │   ├── 📄 shootingFlawsDatabase.ts # Flaw detection rules
│   │   ├── 📄 shooterDatabase.ts     # Extended shooter data
│   │   └── 📄 drillDatabase.ts       # Practice drills
│   │
│   ├── 📁 lib/                       # Utilities & helpers
│   │   ├── 📄 utils.ts               # General utilities (cn, formatters)
│   │   ├── 📄 constants.ts           # App-wide constants
│   │   ├── 📄 errors.ts              # Error handling
│   │   ├── 📄 prisma.ts              # Prisma client
│   │   ├── 📄 shotBreakdown.ts       # Shot phase analysis
│   │   ├── 📄 medalRanking.ts        # Medal tier calculation
│   │   │
│   │   ├── 📁 coaching/              # Coaching system
│   │   │   ├── 📄 index.ts
│   │   │   ├── 📄 analysisIntegration.ts
│   │   │   ├── 📄 coachingPersonas.ts
│   │   │   ├── 📄 feedbackGenerator.ts
│   │   │   └── 📄 tierDetails.ts
│   │   │
│   │   ├── 📁 storage/               # S3 storage
│   │   │   ├── 📄 index.ts
│   │   │   ├── 📄 s3Client.ts
│   │   │   └── 📄 storageService.ts
│   │   │
│   │   ├── 📁 upload/                # Upload utilities
│   │   │   ├── 📄 index.ts
│   │   │   └── 📄 uploadValidation.ts
│   │   │
│   │   └── 📁 design/                # Design system
│   │       ├── 📄 index.ts
│   │       └── 📄 designSystem.ts
│   │
│   ├── 📁 hooks/                     # Custom React hooks
│   │   ├── 📄 index.ts               # Barrel exports
│   │   ├── 📄 useLocalStorage.ts     # localStorage sync
│   │   └── 📄 useDebounce.ts         # Debounce utility
│   │
│   └── 📁 types/                     # TypeScript definitions
│       └── 📄 index.ts               # All shared types
│
├── 📁 prisma/                        # Database schema
│   └── 📄 schema.prisma              # Prisma schema definition
│
├── 📁 public/                        # Static assets
│   └── 📄 favicon.ico
│
├── 📄 package.json                   # Dependencies
├── 📄 tsconfig.json                  # TypeScript config
├── 📄 tailwind.config.ts             # Tailwind config
├── 📄 next.config.mjs                # Next.js config
├── 📄 vercel.json                    # Vercel deployment config
├── 📄 README.md                      # Project overview
├── 📄 DEVELOPER_GUIDE.md             # Developer documentation
└── 📄 ABACUS_AI_DEPLOYMENT.md        # This file
```

---

## 4. Core Application Flow

### 4.1 Image Analysis Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────┘

1. USER UPLOADS IMAGES
   ├── File: src/app/page.tsx
   ├── Component: src/components/upload/MediaUpload.tsx
   └── Action: User selects 3-7 shooting form images

2. IMAGES STORED IN STATE
   ├── File: src/stores/analysisStore.ts
   └── State: uploadedFile, uploadedImageBase64, teaserFrames

3. USER CLICKS "ANALYZE"
   ├── File: src/app/page.tsx → handleAnalyze()
   └── Triggers: handleImageAnalysis()

4. BASKETBALL DETECTION (Optional)
   ├── API: POST /api/detect-basketball
   ├── Service: Roboflow API
   └── Returns: Ball position {x, y, confidence}

5. POSE DETECTION
   ├── File: src/services/visionAnalysis.ts → analyzeShootingForm()
   ├── Backend: POST http://localhost:5001/api/detect-pose
   ├── Technology: YOLOv8-pose + MediaPipe + OpenCV
   └── Returns: Keypoints, angles, confidence scores

6. FLAW DETECTION
   ├── File: src/data/shootingFlawsDatabase.ts → detectFlawsFromAngles()
   └── Returns: Array of detected flaws with severity

7. SCORE CALCULATION
   ├── File: src/data/shootingFlawsDatabase.ts → getShooterLevel()
   └── Returns: Overall score (0-100), skill level category

8. SESSION CREATED & SAVED
   ├── File: src/services/sessionStorage.ts → createSessionFromAnalysis()
   ├── Storage: localStorage key "basketball_analysis_sessions"
   └── Data: Images, keypoints, angles, scores, flaws, timestamp

9. REDIRECT TO RESULTS
   ├── Route: /results/demo
   └── File: src/app/results/demo/page.tsx

10. RESULTS DISPLAYED
    ├── Skeleton overlay on image
    ├── Angle measurements
    ├── Form score card
    ├── Elite shooter comparison
    ├── Coaching feedback
    └── Improvement recommendations
```

### 4.2 Video Analysis Flow

```
1. USER UPLOADS VIDEO
   ├── File: src/app/page.tsx
   ├── Component: src/components/upload/VideoUploadInline.tsx
   └── Validation: Max 10 seconds, under 50MB

2. VIDEO STORED IN STATE
   ├── File: src/stores/analysisStore.ts
   └── State: videoFile (via useState in page.tsx)

3. USER CLICKS "ANALYZE"
   ├── File: src/app/page.tsx → handleAnalyze()
   └── Triggers: handleVideoAnalysis()

4. VIDEO SENT TO BACKEND
   ├── File: src/services/videoAnalysis.ts → analyzeVideoShooting()
   ├── Backend: POST http://localhost:5002/api/analyze-video
   └── Process: Frame extraction, per-frame pose detection

5. KEY FRAMES IDENTIFIED
   ├── Phases: SETUP, RELEASE, FOLLOW_THROUGH
   └── Returns: Best frame for each phase with metrics

6. RESULTS PROCESSED
   ├── File: src/services/videoAnalysis.ts → convertVideoToSessionFormat()
   └── Converts video analysis to session storage format

7. SESSION SAVED & REDIRECT
   └── Same as image flow steps 8-10
```

---

## 5. File-by-File Documentation

### 5.1 Pages (src/app/)

#### `src/app/page.tsx` - Main Upload Page
```typescript
/**
 * PURPOSE: Primary entry point for the application
 * 
 * RESPONSIBILITIES:
 * - Render image/video upload toggle
 * - Display MediaUpload or VideoUploadInline based on selection
 * - Show PlayerProfileForm for user info
 * - Handle "Analyze" button click
 * - Orchestrate analysis flow
 * - Show progress screen during analysis
 * - Redirect to results page on completion
 * 
 * KEY FUNCTIONS:
 * - handleAnalyze() - Main analysis trigger
 * - handleImageAnalysis() - Process image uploads
 * - handleVideoAnalysis() - Process video uploads
 * 
 * STATE USED:
 * - mediaType: "image" | "video"
 * - isAnalyzing: boolean
 * - analysisProgress: number (0-100)
 * - All from useAnalysisStore()
 */
```

#### `src/app/results/demo/page.tsx` - Results Display Page
```typescript
/**
 * PURPOSE: Display comprehensive analysis results
 * 
 * SIZE: ~8000 lines (largest file in codebase)
 * 
 * KEY SECTIONS (approximate line numbers):
 * - Lines 1-200: Imports, types, state initialization
 * - Lines 200-500: Session loading from localStorage
 * - Lines 500-1500: Main analysis display (skeleton, angles)
 * - Lines 1500-2500: Video playback and frame analysis
 * - Lines 2500-3500: Elite shooter comparison section
 * - Lines 3500-5000: Coaching feedback and recommendations
 * - Lines 5000-8000: Additional UI components and modals
 * 
 * DATA SOURCES:
 * - sessionStorage.ts → getLatestSessionByMediaType()
 * - analysisStore.ts → current analysis state
 * 
 * FEATURES DISPLAYED:
 * - Annotated image with skeleton overlay
 * - Angle measurements with status indicators
 * - Overall form score
 * - Elite shooter match (top 5)
 * - Detected flaws with severity
 * - Coaching recommendations
 * - Practice drills
 */
```

### 5.2 Services (src/services/)

#### `src/services/visionAnalysis.ts` - Vision AI Service
```typescript
/**
 * PURPOSE: Connect to Python pose detection backend
 * 
 * BACKEND URL: process.env.NEXT_PUBLIC_HYBRID_API_URL || 'http://localhost:5001'
 * 
 * MAIN FUNCTIONS:
 * 
 * analyzeShootingForm(imageFile, ballPosition?)
 *   - Input: File object, optional ball position
 *   - Process: Sends base64 image to backend
 *   - Returns: VisionAnalysisResult with keypoints, angles, score
 * 
 * checkHybridServerHealth()
 *   - Purpose: Verify backend is running
 *   - Returns: boolean
 * 
 * BACKEND ENDPOINTS CALLED:
 * - POST /api/detect-pose - Main pose detection
 * - GET /health - Health check
 * 
 * RETURN TYPE:
 * interface VisionAnalysisResult {
 *   success: boolean
 *   error?: string
 *   analysis?: {
 *     overallScore: number
 *     category: string
 *     bodyPositions: Record<string, BodyPosition>
 *     measurements?: Record<string, number>
 *   }
 *   keypoints?: Record<string, {x, y, confidence}>
 *   angles?: Record<string, number>
 * }
 */
```

#### `src/services/videoAnalysis.ts` - Video Analysis Service
```typescript
/**
 * PURPOSE: Process video uploads for shooting analysis
 * 
 * BACKEND URL: process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:5002'
 * 
 * MAIN FUNCTIONS:
 * 
 * analyzeVideoShooting(videoFile)
 *   - Input: Video File object
 *   - Process: Sends video to backend for frame extraction
 *   - Returns: VideoAnalysisResult with key frames
 * 
 * convertVideoToSessionFormat(result)
 *   - Input: VideoAnalysisResult
 *   - Output: Format compatible with sessionStorage
 * 
 * RETURN TYPE:
 * interface VideoAnalysisResult {
 *   success: boolean
 *   keyScreenshots: KeyScreenshot[]
 *   frameCount: number
 *   duration: number
 *   phases: { setup, release, followThrough }
 * }
 */
```

#### `src/services/sessionStorage.ts` - Session Storage Service
```typescript
/**
 * PURPOSE: Persist analysis data in localStorage
 * 
 * STORAGE KEY: 'basketball_analysis_sessions'
 * 
 * MAIN FUNCTIONS:
 * 
 * saveSession(session: AnalysisSession)
 *   - Saves new session to localStorage
 *   - Returns: boolean success
 * 
 * getAllSessions()
 *   - Returns: AnalysisSession[] (all saved sessions)
 * 
 * getLatestSessionByMediaType(type: 'image' | 'video')
 *   - Returns: Most recent session of given type
 * 
 * createSessionFromAnalysis(...)
 *   - Creates AnalysisSession object from analysis results
 *   - Parameters: images, screenshots, analysisData, playerName, etc.
 * 
 * deleteSession(sessionId: string)
 *   - Removes session from storage
 * 
 * generateAnalytics(sessions)
 *   - Generates aggregated analytics data
 * 
 * DATA STRUCTURE:
 * interface AnalysisSession {
 *   id: string
 *   timestamp: string
 *   mediaType: 'image' | 'video'
 *   mainImageBase64: string
 *   skeletonImageBase64?: string
 *   screenshots: SessionScreenshot[]
 *   analysisData: SessionAnalysisData
 *   playerName?: string
 *   coachingLevelUsed?: string
 * }
 */
```

### 5.3 State Management (src/stores/)

#### `src/stores/analysisStore.ts` - Main Analysis Store
```typescript
/**
 * PURPOSE: Central state management for analysis flow
 * 
 * LIBRARY: Zustand with devtools and persist middleware
 * 
 * KEY STATE PROPERTIES:
 * 
 * Upload State:
 * - uploadedFile: File | null
 * - mediaType: "IMAGE" | "VIDEO"
 * - uploadedImageBase64: string | null
 * - mediaPreviewUrl: string | null
 * 
 * Analysis State:
 * - isAnalyzing: boolean
 * - analysisProgress: number (0-100)
 * - visionAnalysisResult: VisionAnalysisResult | null
 * - videoAnalysisData: VideoAnalysisData | null
 * - formAnalysisResult: FormAnalysisResult | null
 * 
 * Frame State (for shot strip):
 * - teaserFrames: string[] (base64 images)
 * - fullFrames: string[]
 * - allUploadedUrls: string[]
 * 
 * Profile State:
 * - playerProfile: PlayerProfile | null
 * 
 * KEY ACTIONS:
 * - setUploadedFile(file)
 * - setMediaType(type)
 * - setVisionAnalysisResult(result)
 * - setVideoAnalysisData(data)
 * - setAnalysisProgress(progress)
 * - resetUpload()
 * - resetAll()
 * 
 * PERSISTENCE:
 * - Persists to localStorage: analysisHistory, playerProfile
 */
```

### 5.4 Data Files (src/data/)

#### `src/data/eliteShooters.ts` - Elite Shooter Database
```typescript
/**
 * PURPOSE: NBA shooter profiles for comparison matching
 * 
 * TIER SYSTEM:
 * - LEGENDARY (95-99): Curry, Ray Allen, Reggie Miller
 * - ELITE (88-94): Klay Thompson, Kyle Korver
 * - GREAT (78-87): Devin Booker, Donovan Mitchell
 * - GOOD (70-77): Various competent shooters
 * 
 * DATA PER SHOOTER:
 * interface EliteShooter {
 *   id: number
 *   name: string
 *   team: string
 *   position: Position
 *   height: string (e.g., "6'3\"")
 *   weight: number (lbs)
 *   wingspan: string
 *   bodyType: BodyType
 *   career3PPercent: number
 *   careerFTPercent: number
 *   shootingStyle: string
 *   releaseType: string
 *   era: string
 *   photoId: string (for NBA headshot URL)
 * }
 * 
 * EXPORTS:
 * - ALL_ELITE_SHOOTERS: EliteShooter[]
 * - TIER_LABELS, TIER_COLORS
 * - POSITION_LABELS, LEAGUE_LABELS
 */
```

#### `src/data/shootingFlawsDatabase.ts` - Flaw Detection Rules
```typescript
/**
 * PURPOSE: Define shooting flaws and detection rules
 * 
 * SIZE: ~1800 lines
 * 
 * FLAW CATEGORIES:
 * - ELBOW_FLARE - Elbow sticking out
 * - LOW_RELEASE - Release point too low
 * - INSUFFICIENT_KNEE_BEND - Not enough leg power
 * - GUIDE_HAND_INTERFERENCE - Off-hand affecting shot
 * - FORWARD_LEAN - Leaning into shot
 * - And many more...
 * 
 * MAIN FUNCTIONS:
 * 
 * detectFlawsFromAngles(angles: Record<string, number>)
 *   - Input: Measured joint angles
 *   - Returns: Array of detected flaws with severity
 * 
 * getShooterLevel(score: number)
 *   - Input: Overall score (0-100)
 *   - Returns: { level, label, color, description }
 *   - Levels: Elite, Advanced, Intermediate, Developing, Needs Work
 * 
 * generateCoachingFeedback(flaws: Flaw[])
 *   - Input: Detected flaws
 *   - Returns: Coaching text for each flaw
 * 
 * FLAW STRUCTURE:
 * interface ShootingFlaw {
 *   id: string
 *   name: string
 *   category: FlawCategory
 *   severity: 'minor' | 'moderate' | 'major' | 'critical'
 *   description: string
 *   causes: string[]
 *   effects: string[]
 *   fix: string
 *   drills: string[]
 *   angleThresholds: { [angle]: { min, max } }
 * }
 */
```

### 5.5 Components (src/components/)

#### Upload Components

| Component | File | Purpose |
|-----------|------|---------|
| MediaUpload | `upload/MediaUpload.tsx` | 7-slot image upload grid |
| VideoUploadInline | `upload/VideoUploadInline.tsx` | Video upload with preview |
| PlayerProfileForm | `upload/PlayerProfileForm.tsx` | User info form |

#### Analysis Components

| Component | File | Purpose |
|-----------|------|---------|
| AnalysisDashboard | `analysis/AnalysisDashboard.tsx` | Main results dashboard |
| SkeletonOverlay | `analysis/SkeletonOverlay.tsx` | Draw pose skeleton on canvas |
| AngleIndicators | `analysis/AngleIndicators.tsx` | Display angle measurements |
| AutoScreenshots | `analysis/AutoScreenshots.tsx` | Auto-generated analysis screenshots |
| FormScoreCard | `analysis/FormScoreCard.tsx` | Overall score display |

#### Icon Components

| Component | File | Purpose |
|-----------|------|---------|
| MedalIcon | `icons/MedalIcons.tsx` | Gold/Silver/Bronze ranking medals |
| StatusIcon | `icons/StatusIcon.tsx` | Good/Warning/Critical indicators |
| FormMetricIcon | `icons/FormMetricIcon.tsx` | Form metric icons |

---

## 6. API Endpoints

### Internal API Routes (src/app/api/)

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/api/detect-basketball` | POST | Detect ball position | `{ image: base64 }` | `{ x, y, confidence }` |
| `/api/upload` | POST | Upload to S3 | `FormData` | `{ url: string }` |
| `/api/save-analysis` | POST | Save to database | `AnalysisSession` | `{ success: boolean }` |
| `/api/profile` | GET | Get user profile | - | `UserProfile` |
| `/api/profile` | POST | Update profile | `UserProfile` | `{ success: boolean }` |
| `/api/analysis-history` | GET | Get past analyses | - | `AnalysisSession[]` |
| `/api/compare-shooters` | POST | Match with elite | `{ angles, bodyType }` | `EliteShooter[]` |

### External Backend Endpoints

| Service | URL | Endpoint | Purpose |
|---------|-----|----------|---------|
| Pose Detection | `localhost:5001` | `POST /api/detect-pose` | YOLOv8 + MediaPipe pose detection |
| Pose Detection | `localhost:5001` | `GET /health` | Health check |
| Video Analysis | `localhost:5002` | `POST /api/analyze-video` | Video frame extraction |

---

## 7. State Management

### Zustand Store Structure

```typescript
// src/stores/analysisStore.ts

interface AnalysisState {
  // Upload State
  uploadedFile: File | null
  mediaType: "IMAGE" | "VIDEO"
  uploadedImageBase64: string | null
  mediaPreviewUrl: string | null
  
  // Frame State
  teaserFrames: string[]
  fullFrames: string[]
  allUploadedUrls: string[]
  
  // Analysis State
  isAnalyzing: boolean
  analysisProgress: number
  visionAnalysisResult: VisionAnalysisResult | null
  videoAnalysisData: VideoAnalysisData | null
  formAnalysisResult: FormAnalysisResult | null
  
  // Profile State
  playerProfile: PlayerProfile | null
  
  // Error State
  error: string | null
}

// Actions
interface AnalysisActions {
  setUploadedFile: (file: File | null) => void
  setMediaType: (type: "IMAGE" | "VIDEO") => void
  setVisionAnalysisResult: (result: VisionAnalysisResult | null) => void
  setVideoAnalysisData: (data: VideoAnalysisData | null) => void
  setAnalysisProgress: (progress: number) => void
  setPlayerProfile: (profile: PlayerProfile | null) => void
  resetUpload: () => void
  resetAll: () => void
}
```

### Usage Pattern

```typescript
// In any component
import { useAnalysisStore } from "@/stores/analysisStore"

function MyComponent() {
  // Select specific state
  const uploadedFile = useAnalysisStore(state => state.uploadedFile)
  const setUploadedFile = useAnalysisStore(state => state.setUploadedFile)
  
  // Or destructure multiple
  const { isAnalyzing, analysisProgress, visionAnalysisResult } = useAnalysisStore()
}
```

---

## 8. External Services & Dependencies

### Python Pose Detection Backend (Port 5001)

**Required for image analysis to work.**

```bash
# Expected to be running at:
http://localhost:5001

# Endpoints:
POST /api/detect-pose
GET /health
```

**Technology Stack:**
- YOLOv8-pose for initial detection
- MediaPipe for refined keypoints
- OpenCV for image processing

### Video Analysis Backend (Port 5002)

**Required for video analysis to work.**

```bash
# Expected to be running at:
http://localhost:5002

# Endpoints:
POST /api/analyze-video
```

### Roboflow API

**Used for basketball detection (optional enhancement).**

```typescript
// Called from: src/app/api/detect-basketball/route.ts
// API Key required in environment variables
```

### AWS S3

**Used for image storage (optional).**

```typescript
// Called from: src/app/api/upload/route.ts
// Credentials required in environment variables
```

---

## 9. Environment Variables

Create a `.env.local` file with:

```bash
# Required for pose detection
NEXT_PUBLIC_HYBRID_API_URL=http://localhost:5001

# Required for video analysis
NEXT_PUBLIC_VIDEO_API_URL=http://localhost:5002

# Database (if using Prisma)
DATABASE_URL=your_database_connection_string

# AWS S3 (optional, for image storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# Roboflow (optional, for ball detection)
ROBOFLOW_API_KEY=your_roboflow_key
```

---

## 10. Build & Deployment

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev

# App runs at http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Vercel Deployment

The app includes `vercel.json` for Vercel deployment:

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs"
}
```

### Abacus AI Deployment Notes

1. **Frontend Deployment**: Deploy the Next.js app as a standard Node.js application
2. **Backend Services**: The Python backends (ports 5001, 5002) need to be deployed separately
3. **Environment Variables**: Set all required env vars in Abacus AI dashboard
4. **Database**: Configure DATABASE_URL for Prisma if using database features

---

## 11. Troubleshooting

### Common Issues

#### "White screen / App not loading"
- Check browser console for errors
- Verify correct port (default 3000, may use 3001/3002 if busy)
- Clear browser cache and hard refresh

#### "Analysis fails / No results"
- Ensure Python backend is running on port 5001
- Check `NEXT_PUBLIC_HYBRID_API_URL` environment variable
- Verify backend health: `curl http://localhost:5001/health`

#### "Video analysis not working"
- Ensure video backend is running on port 5002
- Check video file size (max 50MB) and duration (max 10 seconds)

#### "Build fails"
- Run `npm install` to ensure all dependencies
- Run `npx prisma generate` before build
- Check for TypeScript errors: `npx tsc --noEmit`

#### "Session data not persisting"
- localStorage may be full - clear old sessions
- Check browser privacy settings

---

## Quick Reference Card

### File Locations by Feature

| Feature | Primary File |
|---------|--------------|
| Upload UI | `src/app/page.tsx` |
| Results Display | `src/app/results/demo/page.tsx` |
| Image Upload | `src/components/upload/MediaUpload.tsx` |
| Video Upload | `src/components/upload/VideoUploadInline.tsx` |
| Pose Detection | `src/services/visionAnalysis.ts` |
| Video Processing | `src/services/videoAnalysis.ts` |
| Session Storage | `src/services/sessionStorage.ts` |
| State Management | `src/stores/analysisStore.ts` |
| Elite Shooters | `src/data/eliteShooters.ts` |
| Flaw Detection | `src/data/shootingFlawsDatabase.ts` |
| Medal Icons | `src/components/icons/MedalIcons.tsx` |
| Types | `src/types/index.ts` |
| Utilities | `src/lib/utils.ts` |

### Import Patterns

```typescript
// Components
import { MediaUpload, VideoUploadInline } from "@/components/upload"
import { AnalysisDashboard, SkeletonOverlay } from "@/components/analysis"
import { MedalIcon, StatusIcon } from "@/components/icons"

// Services
import { analyzeShootingForm } from "@/services/visionAnalysis"
import { saveSession, getAllSessions } from "@/services/sessionStorage"

// State
import { useAnalysisStore } from "@/stores/analysisStore"

// Data
import { ALL_ELITE_SHOOTERS, detectFlawsFromAngles } from "@/data"

// Types
import type { PlayerProfile, AnalysisResult } from "@/types"

// Utilities
import { cn, fileToBase64 } from "@/lib/utils"
```

---

*Document generated for Abacus AI deployment - Basketball Shooting Analysis v2024.12.19*

