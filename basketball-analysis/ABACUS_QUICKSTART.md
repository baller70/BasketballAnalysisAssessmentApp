# Abacus AI Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Clone & Install

```bash
# Navigate to project
cd basketball-analysis

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### Step 2: Environment Variables

Create `.env.local`:

```bash
# Required - Pose Detection Backend
NEXT_PUBLIC_HYBRID_API_URL=http://localhost:5001

# Required - Video Analysis Backend  
NEXT_PUBLIC_VIDEO_API_URL=http://localhost:5002

# Optional - Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional - AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket
```

### Step 3: Build & Run

```bash
# Build
npm run build

# Run
npm start

# Or development mode
npm run dev
```

---

## 📁 Key Files Quick Reference

| Need to modify... | Edit this file |
|-------------------|----------------|
| Upload page UI | `src/app/page.tsx` |
| Results display | `src/app/results/demo/page.tsx` |
| Image upload component | `src/components/upload/MediaUpload.tsx` |
| Video upload component | `src/components/upload/VideoUploadInline.tsx` |
| Pose detection service | `src/services/visionAnalysis.ts` |
| Video analysis service | `src/services/videoAnalysis.ts` |
| Session storage | `src/services/sessionStorage.ts` |
| App state | `src/stores/analysisStore.ts` |
| Elite shooter data | `src/data/eliteShooters.ts` |
| Flaw detection rules | `src/data/shootingFlawsDatabase.ts` |
| TypeScript types | `src/types/index.ts` |

---

## 🔧 Common Tasks

### Add a new page
```bash
# Create file
touch src/app/new-page/page.tsx
```

```typescript
// src/app/new-page/page.tsx
"use client"
export default function NewPage() {
  return <div>New Page</div>
}
```

### Add a new API endpoint
```bash
# Create file
mkdir -p src/app/api/new-endpoint
touch src/app/api/new-endpoint/route.ts
```

```typescript
// src/app/api/new-endpoint/route.ts
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ success: true })
}
```

### Add a new component
```bash
touch src/components/analysis/NewComponent.tsx
```

```typescript
// src/components/analysis/NewComponent.tsx
"use client"
import React from "react"

export function NewComponent() {
  return <div>New Component</div>
}
```

Then export from barrel:
```typescript
// src/components/analysis/index.ts
export { NewComponent } from "./NewComponent"
```

---

## 📊 Data Flow Summary

```
User uploads image/video
        ↓
State stored in Zustand (analysisStore)
        ↓
Click "Analyze" triggers handleAnalyze()
        ↓
visionAnalysis.ts calls Python backend (port 5001)
        ↓
Results processed, flaws detected
        ↓
Session saved to localStorage
        ↓
Redirect to /results/demo
        ↓
Results page loads session and displays
```

---

## 🐛 Debugging

### Check if backends are running
```bash
curl http://localhost:5001/health
curl http://localhost:5002/health
```

### Check localStorage
```javascript
// In browser console
JSON.parse(localStorage.getItem('basketball_analysis_sessions'))
```

### Check Zustand state
```javascript
// In browser console (with React DevTools)
// Or in component:
console.log(useAnalysisStore.getState())
```

---

## 📚 Full Documentation

- `README.md` - Project overview
- `DEVELOPER_GUIDE.md` - Detailed development guide
- `ABACUS_AI_DEPLOYMENT.md` - Complete deployment documentation
- `ARCHITECTURE.md` - System architecture diagrams

---

## 🆘 Support

If analysis fails:
1. Check Python backend is running on port 5001
2. Check environment variables are set
3. Check browser console for errors
4. Check network tab for failed requests

If build fails:
1. Run `npm install`
2. Run `npx prisma generate`
3. Check for TypeScript errors: `npx tsc --noEmit`








