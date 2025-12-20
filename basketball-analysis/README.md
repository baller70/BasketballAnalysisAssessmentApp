# Basketball Shooting Analysis Tool

A Next.js application for AI-powered basketball shooting form analysis. Upload images or videos of your shooting form to receive detailed biomechanical feedback, elite shooter comparisons, and personalized coaching.

## 🎯 Quick Navigation for Developers

### Where to Find Things

| What You Need | Where to Find It |
|---------------|------------------|
| **Main upload page** | `src/app/page.tsx` |
| **Results/analysis display** | `src/app/results/demo/page.tsx` |
| **Image upload component** | `src/components/upload/MediaUpload.tsx` |
| **Video upload component** | `src/components/upload/VideoUploadInline.tsx` |
| **Analysis state management** | `src/stores/analysisStore.ts` |
| **Vision AI analysis service** | `src/services/visionAnalysis.ts` |
| **Video analysis service** | `src/services/videoAnalysis.ts` |
| **Session storage (localStorage)** | `src/services/sessionStorage.ts` |
| **Elite shooters data** | `src/data/eliteShooters.ts` |
| **Shooting flaws detection** | `src/data/shootingFlawsDatabase.ts` |
| **API routes** | `src/app/api/[endpoint]/route.ts` |
| **Shared UI components** | `src/components/ui/` |
| **Custom icons** | `src/components/icons/` |
| **TypeScript types** | `src/types/index.ts` |
| **Utility functions** | `src/lib/utils.ts` |
| **Constants** | `src/lib/constants.ts` |

---

## 📁 Project Structure

```
basketball-analysis/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # HOME PAGE - Main upload interface
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── providers.tsx             # React Query and other providers
│   │   ├── globals.css               # Global styles and Tailwind
│   │   │
│   │   ├── api/                      # API Routes (Backend)
│   │   │   ├── detect-basketball/    # Roboflow ball detection
│   │   │   ├── upload/               # S3 image upload
│   │   │   ├── save-analysis/        # Save to database
│   │   │   ├── profile/              # User profile CRUD
│   │   │   ├── analysis-history/     # Historical analysis data
│   │   │   └── ...                   # Other API endpoints
│   │   │
│   │   ├── results/demo/page.tsx     # RESULTS PAGE - Analysis display
│   │   ├── profile/page.tsx          # User profile page
│   │   ├── elite-shooters/page.tsx   # Elite shooters database
│   │   ├── upload/page.tsx           # Alternative upload page
│   │   ├── video-analysis/page.tsx   # Video-specific analysis
│   │   └── settings/page.tsx         # App settings
│   │
│   ├── components/                   # React Components
│   │   ├── upload/                   # UPLOAD COMPONENTS
│   │   │   ├── MediaUpload.tsx       # Image upload with shot strip
│   │   │   ├── VideoUploadInline.tsx # Video upload component
│   │   │   ├── PlayerProfileForm.tsx # Player info form
│   │   │   └── index.ts              # Barrel exports
│   │   │
│   │   ├── analysis/                 # ANALYSIS DISPLAY COMPONENTS
│   │   │   ├── AnalysisDashboard.tsx # Main analysis dashboard
│   │   │   ├── AutoScreenshots.tsx   # Auto-generated screenshots
│   │   │   ├── AnnotatedImageDisplay.tsx # Image with annotations
│   │   │   ├── ShotBreakdownStrip.tsx # Shot phase strip
│   │   │   ├── SkeletonOverlay.tsx   # Pose skeleton drawing
│   │   │   └── index.ts              # Barrel exports
│   │   │
│   │   ├── icons/                    # CUSTOM ICONS
│   │   │   ├── MedalIcons.tsx        # Medal ranking icons
│   │   │   ├── IconSystem.tsx        # Core icon components
│   │   │   ├── StatusIcon.tsx        # Status indicators
│   │   │   └── index.ts              # Barrel exports
│   │   │
│   │   ├── ui/                       # SHARED UI COMPONENTS
│   │   │   ├── button.tsx            # Button component
│   │   │   ├── card.tsx              # Card component
│   │   │   ├── input.tsx             # Input component
│   │   │   └── ...                   # Other UI primitives
│   │   │
│   │   ├── profile/                  # PROFILE COMPONENTS
│   │   │   ├── ProfileCard.tsx       # Profile display card
│   │   │   ├── ProfileWizard.tsx     # Profile setup wizard
│   │   │   └── cards/                # Individual profile cards
│   │   │
│   │   ├── gamification/             # GAMIFICATION FEATURES
│   │   │   └── GamificationComponents.tsx
│   │   │
│   │   ├── comparison/               # SHOOTER COMPARISON
│   │   │   └── Phase6ComparisonPanel.tsx
│   │   │
│   │   └── layout/                   # LAYOUT COMPONENTS
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   │
│   ├── services/                     # BUSINESS LOGIC SERVICES
│   │   ├── visionAnalysis.ts         # Vision AI pose detection
│   │   ├── videoAnalysis.ts          # Video frame extraction
│   │   ├── sessionStorage.ts         # localStorage session management
│   │   ├── coachingInsights.ts       # Coaching feedback generation
│   │   ├── comparisonAlgorithm.ts    # Shooter comparison logic
│   │   └── gamificationService.ts    # Points, badges, streaks
│   │
│   ├── stores/                       # ZUSTAND STATE STORES
│   │   ├── analysisStore.ts          # Main analysis state
│   │   └── profileStore.ts           # User profile state
│   │
│   ├── data/                         # STATIC DATA & DATABASES
│   │   ├── eliteShooters.ts          # NBA shooter profiles
│   │   ├── shootingFlawsDatabase.ts  # Flaw detection rules
│   │   ├── shooterDatabase.ts        # Extended shooter data
│   │   └── drillDatabase.ts          # Practice drills
│   │
│   ├── lib/                          # UTILITIES & HELPERS
│   │   ├── utils.ts                  # General utilities (cn, formatters)
│   │   ├── constants.ts              # App-wide constants
│   │   ├── errors.ts                 # Error handling utilities
│   │   ├── prisma.ts                 # Prisma client
│   │   ├── shotBreakdown.ts          # Shot phase analysis
│   │   ├── medalRanking.ts           # Medal tier calculation
│   │   ├── coaching/                 # Coaching system
│   │   ├── storage/                  # S3 storage utilities
│   │   └── upload/                   # Upload validation
│   │
│   ├── hooks/                        # CUSTOM REACT HOOKS
│   │   ├── useLocalStorage.ts        # localStorage sync hook
│   │   ├── useDebounce.ts            # Debounce hook
│   │   └── index.ts                  # Barrel exports
│   │
│   └── types/                        # TYPESCRIPT DEFINITIONS
│       └── index.ts                  # All shared types
│
├── prisma/                           # DATABASE
│   └── schema.prisma                 # Prisma schema
│
├── public/                           # STATIC ASSETS
│   └── images/                       # Static images
│
└── Configuration Files
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.mjs
    └── vercel.json
```

---

## 🔄 Data Flow

### Image Analysis Flow
```
1. User uploads images → MediaUpload.tsx
2. Images stored in state → analysisStore.ts
3. Click "Analyze" → page.tsx handleAnalyze()
4. Ball detection → /api/detect-basketball
5. Pose detection → visionAnalysis.ts → Python backend
6. Results displayed → results/demo/page.tsx
7. Session saved → sessionStorage.ts
```

### Video Analysis Flow
```
1. User uploads video → VideoUploadInline.tsx
2. Video stored in state → analysisStore.ts
3. Click "Analyze" → page.tsx handleVideoAnalysis()
4. Frame extraction → videoAnalysis.ts → Python backend
5. Per-frame analysis → visionAnalysis.ts
6. Results displayed → results/demo/page.tsx
7. Session saved → sessionStorage.ts
```

---

## 🛠 Key Files Reference

### Pages (What users see)
- `src/app/page.tsx` - **Main upload page** with image/video toggle
- `src/app/results/demo/page.tsx` - **Results page** (8000+ lines, main analysis display)
- `src/app/profile/page.tsx` - User profile management
- `src/app/elite-shooters/page.tsx` - Elite shooter database browser

### Components (Reusable UI)
- `src/components/upload/MediaUpload.tsx` - Image upload with 7-slot grid
- `src/components/upload/VideoUploadInline.tsx` - Video upload with preview
- `src/components/analysis/AutoScreenshots.tsx` - Auto-generated analysis screenshots
- `src/components/icons/MedalIcons.tsx` - Gold/Silver/Bronze medal icons

### Services (Business Logic)
- `src/services/visionAnalysis.ts` - Calls Python backend for pose detection
- `src/services/videoAnalysis.ts` - Video processing and frame extraction
- `src/services/sessionStorage.ts` - localStorage CRUD for sessions

### State Management
- `src/stores/analysisStore.ts` - Zustand store for all analysis state

### Data
- `src/data/eliteShooters.ts` - NBA shooter profiles with measurements
- `src/data/shootingFlawsDatabase.ts` - Flaw detection rules and feedback

---

## 🔧 Common Modifications

### To modify the upload interface:
→ Edit `src/app/page.tsx` (main page) or `src/components/upload/MediaUpload.tsx`

### To modify the results display:
→ Edit `src/app/results/demo/page.tsx`

### To add a new API endpoint:
→ Create `src/app/api/[endpoint-name]/route.ts`

### To modify analysis logic:
→ Edit `src/services/visionAnalysis.ts` or `src/services/videoAnalysis.ts`

### To add new shooter data:
→ Edit `src/data/eliteShooters.ts`

### To modify flaw detection:
→ Edit `src/data/shootingFlawsDatabase.ts`

### To add new icons:
→ Edit `src/components/icons/IconSystem.tsx` or create new in `src/components/icons/`

### To modify state management:
→ Edit `src/stores/analysisStore.ts`

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📝 Environment Variables

Create `.env.local` with:
```
NEXT_PUBLIC_HYBRID_API_URL=http://localhost:5001
DATABASE_URL=your_database_url
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket
```

---

## 📚 Additional Documentation

- See `DEVELOPER_GUIDE.md` for detailed development workflows
- See `src/types/index.ts` for all TypeScript interfaces
- See `src/lib/constants.ts` for app-wide constants
