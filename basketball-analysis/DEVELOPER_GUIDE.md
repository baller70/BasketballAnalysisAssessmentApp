# Basketball Analysis - Developer Guide

This guide helps developers (and LLMs) quickly locate and modify specific functionality.

---

## 🎯 Quick File Lookup by Feature

### UPLOAD FEATURES

| Feature | Primary File | Supporting Files |
|---------|--------------|------------------|
| Image upload UI | `src/components/upload/MediaUpload.tsx` | `src/lib/shotBreakdown.ts` |
| Video upload UI | `src/components/upload/VideoUploadInline.tsx` | - |
| Upload validation | `src/lib/upload/uploadValidation.ts` | `src/components/upload/PreUploadValidation.tsx` |
| Image/Video toggle | `src/app/page.tsx` (lines 400-530) | - |
| Player profile form | `src/components/upload/PlayerProfileForm.tsx` | `src/stores/profileStore.ts` |
| Shot breakdown strip | `src/components/analysis/ShotBreakdownStrip.tsx` | `src/lib/shotBreakdown.ts` |

### ANALYSIS FEATURES

| Feature | Primary File | Supporting Files |
|---------|--------------|------------------|
| Image analysis | `src/services/visionAnalysis.ts` | `src/app/page.tsx` (handleImageAnalysis) |
| Video analysis | `src/services/videoAnalysis.ts` | `src/app/page.tsx` (handleVideoAnalysis) |
| Basketball detection | `src/app/api/detect-basketball/route.ts` | Roboflow API |
| Flaw detection | `src/data/shootingFlawsDatabase.ts` | `src/services/coachingInsights.ts` |
| Score calculation | `src/data/shootingFlawsDatabase.ts` (getShooterLevel) | - |
| Pose skeleton overlay | `src/components/analysis/SkeletonOverlay.tsx` | - |

### RESULTS DISPLAY

| Feature | Primary File | Location in File |
|---------|--------------|------------------|
| Main results page | `src/app/results/demo/page.tsx` | Entire file |
| Analysis dashboard | `src/components/analysis/AnalysisDashboard.tsx` | - |
| Auto screenshots | `src/components/analysis/AutoScreenshots.tsx` | - |
| Annotated image | `src/components/analysis/AnnotatedImageDisplay.tsx` | - |
| Medal icons | `src/components/icons/MedalIcons.tsx` | - |
| Elite shooter match | `src/app/results/demo/page.tsx` | Lines 3600-3900 |
| Coaching feedback | `src/services/coachingInsights.ts` | - |

### DATA & STORAGE

| Feature | Primary File | Description |
|---------|--------------|-------------|
| Session save/load | `src/services/sessionStorage.ts` | localStorage CRUD |
| Elite shooters DB | `src/data/eliteShooters.ts` | NBA player data |
| Shooting flaws DB | `src/data/shootingFlawsDatabase.ts` | Flaw rules |
| Drill database | `src/data/drillDatabase.ts` | Practice drills |
| Analysis state | `src/stores/analysisStore.ts` | Zustand store |
| Profile state | `src/stores/profileStore.ts` | Zustand store |

### UI COMPONENTS

| Component | File | Usage |
|-----------|------|-------|
| Button | `src/components/ui/button.tsx` | Everywhere |
| Card | `src/components/ui/card.tsx` | Results, profile |
| Input | `src/components/ui/input.tsx` | Forms |
| Tabs | `src/components/ui/tabs.tsx` | Results page |
| Progress | `src/components/ui/progress.tsx` | Loading states |
| Badge | `src/components/ui/badge.tsx` | Status indicators |

### ICONS

| Icon Type | File | Exports |
|-----------|------|---------|
| Medal icons | `src/components/icons/MedalIcons.tsx` | MedalIcon, GoldMedal, SilverMedal, etc. |
| Status icons | `src/components/icons/StatusIcon.tsx` | StatusIcon, StatusBadge |
| Form metric icons | `src/components/icons/FormMetricIcon.tsx` | FormMetricIcon |
| Coaching icons | `src/components/icons/CoachingLevelIcon.tsx` | CoachingLevelIcon |
| All icons | `src/components/icons/IconSystem.tsx` | BasketballIcon, etc. |

---

## 📍 File Location Patterns

### Pages (Routes)
```
src/app/[route]/page.tsx
```
- `src/app/page.tsx` → `/` (home)
- `src/app/results/demo/page.tsx` → `/results/demo`
- `src/app/profile/page.tsx` → `/profile`

### API Routes
```
src/app/api/[endpoint]/route.ts
```
- `src/app/api/detect-basketball/route.ts` → `POST /api/detect-basketball`
- `src/app/api/upload/route.ts` → `POST /api/upload`

### Components
```
src/components/[category]/[ComponentName].tsx
```
- Upload components: `src/components/upload/`
- Analysis components: `src/components/analysis/`
- UI primitives: `src/components/ui/`

### Services (Business Logic)
```
src/services/[serviceName].ts
```
- `visionAnalysis.ts` - AI pose detection
- `videoAnalysis.ts` - Video processing
- `sessionStorage.ts` - Data persistence

### State Stores
```
src/stores/[storeName]Store.ts
```
- `analysisStore.ts` - Main app state
- `profileStore.ts` - User profile state

---

## 🔧 Common Modification Patterns

### Adding a New Page

1. Create `src/app/[route-name]/page.tsx`
2. Add "use client" if using React hooks
3. Import components from `@/components/`
4. Import stores from `@/stores/`

### Adding a New API Endpoint

1. Create `src/app/api/[endpoint-name]/route.ts`
2. Export async functions: `GET`, `POST`, `PUT`, `DELETE`
3. Use `NextResponse.json()` for responses

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json()
  // Process...
  return NextResponse.json({ success: true, data: result })
}
```

### Adding a New Component

1. Create `src/components/[category]/[ComponentName].tsx`
2. Add file header comment explaining purpose
3. Export from category's `index.ts` barrel file
4. Use TypeScript interfaces for props

```typescript
// src/components/analysis/NewComponent.tsx
/**
 * NewComponent - Brief description
 * 
 * Purpose: What this component does
 * Used in: Where it's used (pages, other components)
 * 
 * @example
 * <NewComponent prop1="value" />
 */
```

### Adding to State Store

Edit `src/stores/analysisStore.ts`:

1. Add new state property to interface
2. Add initial value
3. Add setter action
4. Export if needed

### Adding New Types

Edit `src/types/index.ts`:

```typescript
export interface NewType {
  property1: string
  property2: number
}
```

---

## 🗂 Import Conventions

### Absolute Imports (Preferred)
```typescript
import { Component } from "@/components/category"
import { useStore } from "@/stores/storeName"
import { utilFunction } from "@/lib/utils"
import { ServiceFunction } from "@/services/serviceName"
import type { TypeName } from "@/types"
```

### Barrel Exports
Most directories have `index.ts` files for clean imports:
```typescript
// Instead of:
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// You can use:
import { Button, Card } from "@/components/ui"
```

---

## 🔍 Searching the Codebase

### By Feature Keywords

| Keyword | Files to Check |
|---------|----------------|
| "upload" | `src/components/upload/`, `src/app/page.tsx` |
| "analysis" | `src/services/`, `src/components/analysis/` |
| "results" | `src/app/results/demo/page.tsx` |
| "video" | `VideoUploadInline.tsx`, `videoAnalysis.ts` |
| "image" | `MediaUpload.tsx`, `visionAnalysis.ts` |
| "skeleton" | `SkeletonOverlay.tsx` |
| "flaw" | `shootingFlawsDatabase.ts` |
| "shooter" | `eliteShooters.ts`, `shooterDatabase.ts` |
| "medal" | `MedalIcons.tsx`, `medalRanking.ts` |
| "session" | `sessionStorage.ts` |
| "store" | `src/stores/` |
| "api" | `src/app/api/` |

### By Component Type

| Type | Directory |
|------|-----------|
| Pages | `src/app/*/page.tsx` |
| API Routes | `src/app/api/*/route.ts` |
| Upload UI | `src/components/upload/` |
| Analysis UI | `src/components/analysis/` |
| Icons | `src/components/icons/` |
| UI Primitives | `src/components/ui/` |
| Profile | `src/components/profile/` |

---

## 📊 State Management

### Analysis Store (`src/stores/analysisStore.ts`)

Key state properties:
- `uploadedFile` - Current uploaded file
- `mediaType` - "IMAGE" or "VIDEO"
- `uploadedImageBase64` - Base64 image data
- `visionAnalysisResult` - Analysis results
- `videoAnalysisData` - Video-specific data
- `isAnalyzing` - Loading state
- `analysisProgress` - Progress percentage
- `playerProfile` - User profile data

Key actions:
- `setUploadedFile(file)` - Set uploaded file
- `setVisionAnalysisResult(result)` - Set analysis results
- `resetUpload()` - Clear upload state
- `resetAll()` - Reset everything

### Profile Store (`src/stores/profileStore.ts`)

Key state properties:
- `profile` - User profile data
- `isLoading` - Loading state

---

## 🎨 Styling Conventions

- **Tailwind CSS** for all styling
- **Dark theme** by default (`bg-[#1a1a1a]`, `text-[#E5E5E5]`)
- **Gold accent** color: `#FFD700`
- **Card backgrounds**: `bg-[#2C2C2C]`
- **Borders**: `border-[#3a3a3a]`

Use the `cn()` utility for conditional classes:
```typescript
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  condition && "conditional-classes"
)} />
```

---

## 🐛 Debugging Tips

### Check Analysis Flow
1. Console logs in `src/app/page.tsx` (handleAnalyze)
2. Network tab for API calls
3. Check `src/services/visionAnalysis.ts` for backend calls

### Check State
```typescript
// In any component
const state = useAnalysisStore.getState()
console.log(state)
```

### Check Sessions
```typescript
// In browser console
localStorage.getItem('basketball_analysis_sessions')
```

---

## 📝 File Header Template

Add this to the top of every file:

```typescript
/**
 * @file ComponentName.tsx
 * @description Brief description of what this file does
 * 
 * PURPOSE:
 * - Main purpose 1
 * - Main purpose 2
 * 
 * USED BY:
 * - page.tsx
 * - OtherComponent.tsx
 * 
 * DEPENDENCIES:
 * - @/stores/analysisStore
 * - @/services/visionAnalysis
 */
```









