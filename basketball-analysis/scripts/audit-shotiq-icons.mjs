#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const webRoots = [
  "src/app",
  "src/components/shotiq",
  "src/components/upload",
  "src/components/live",
  "src/components/analysis",
  "src/components/analytics",
  "src/components/dashboard",
  "src/components/goals",
  "src/components/points",
  "src/components/profile",
  "src/components/training",
]

// The production `main` branch deploys the web app from Contabo. Native iOS
// icon parity is audited on the ShotIQ native branch, where the Swift asset
// catalog changes are present too.
const swiftRoot = null

const webControlIcons = new Set([
  "ArrowLeft", "ArrowRight", "ArrowUpDown", "ChevronLeft", "ChevronRight", "ChevronDown", "ChevronUp",
  "X", "Check", "Plus", "Minus", "Circle", "Square", "MoreVertical", "MoreHorizontal",
  "Play", "Pause", "SkipBack", "SkipForward", "Maximize", "Maximize2", "Minimize",
  "Undo2", "Redo2", "RotateCcw", "RotateCw", "RefreshCw", "RefreshCcw",
  "Eye", "EyeOff", "Loader2", "Search", "Bell", "Info", "HelpCircle", "AlertCircle", "AlertTriangle",
  "Lock", "Save", "Bookmark", "Trash", "Trash2", "Download", "Share", "Share2",
  "Filter", "SlidersHorizontal", "Type", "Move", "MousePointer2", "MoveRight",
  "Highlighter", "Palette", "Sun", "ZoomIn", "LogOut", "VolumeX", "Volume2",
  "SwitchCamera", "CameraOff", "UploadCloud", "CloudOff",
])

const sidebarIconExceptionFile = path.join("src", "components", "shotiq", "ShotIQShell.tsx")
const webSidebarIcons = new Set([
  "Home", "LineChart", "Activity", "TrendingUp", "Film", "Compass", "Settings", "Video",
  "Upload", "Gauge", "PersonStanding", "AlertTriangle", "GitCompare", "CreditCard",
  "Dumbbell", "ListChecks", "CalendarDays", "Target", "Trophy", "User", "HelpCircle",
  "FileVideo", "Award", "SlidersHorizontal", "Rocket",
])

const swiftControlPatterns = [
  /^chevron\./,
  /^arrow\.left$/,
  /^arrow\.clockwise$/,
  /^arrow\.counterclockwise$/,
  /^arrow\.uturn\./,
  /^arrow\.triangle\./,
  /^arrow\.up\.arrow\.down$/,
  /^arrow\.up\.left\.and\.arrow\.down\.right$/,
  /^arrow\.down\.to\.line$/,
  /^square\.and\.arrow\.up$/,
  /^ellipsis$/,
  /^xmark($|\.)/,
  /^checkmark($|\.)/,
  /^minus($|\.)/,
  /^plus($|\.)/,
  /^pause($|\.)/,
  /^play($|\.fill$|\.circle$|\.rectangle$)/,
  /^backward\./,
  /^forward\./,
  /^speaker\./,
  /^eye($|\.)/,
  /^lock$/,
  /^envelope$/,
  /^key$/,
  /^questionmark\./,
  /^info\./,
  /^magnifyingglass$/,
  /^bookmark($|\.)/,
  /^trash$/,
  /^pencil$/,
  /^rectangle\.portrait\.and\.arrow\.right$/,
  /^square$/,
  /^checkmark\.square\.fill$/,
  /^circle($|\.dotted$|\.dashed$)/,
  /^stop($|\.)/,
  /^stopwatch$/,
  /^list\.bullet$/,
]

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, exts, out)
    else if (exts.some((x) => entry.name.endsWith(x))) out.push(p)
  }
  return out
}

function lineOf(src, index) {
  return src.slice(0, index).split("\n").length
}

const webFindings = []
for (const rel of webRoots) {
  for (const file of walk(path.join(root, rel), [".tsx", ".ts"])) {
    if (file.endsWith(path.join("src", "components", "shotiq", "ApprovedLucide.tsx"))) continue
    const src = fs.readFileSync(file, "utf8")
    for (const m of src.matchAll(/import\s+\{([^}]*)\}\s+from\s*["']lucide-react["']/g)) {
      const relFile = path.relative(root, file)
      const imported = m[1]
        .split(",")
        .map((raw) => raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim())
        .filter(Boolean)
      for (const name of imported) {
        if (name === "LucideIcon") continue
        if (relFile === sidebarIconExceptionFile && webSidebarIcons.has(name)) continue
        if (!webControlIcons.has(name)) {
          webFindings.push(`${relFile}:${lineOf(src, m.index)} ${name}`)
        }
      }
    }
  }
}

const swiftFindings = []
if (swiftRoot) {
  for (const file of walk(path.join(root, swiftRoot), [".swift"])) {
    const src = fs.readFileSync(file, "utf8")
    for (const m of src.matchAll(/Image\(systemName:\s*"([^"]+)"\)/g)) {
      const symbol = m[1]
      if (!swiftControlPatterns.some((r) => r.test(symbol))) {
        swiftFindings.push(`${path.relative(root, file)}:${lineOf(src, m.index)} ${symbol}`)
      }
    }
  }
}

if (webFindings.length || swiftFindings.length) {
  console.error("ShotIQ icon audit failed. Replace these feature icons with the approved ImageGen pack:")
  if (webFindings.length) {
    console.error("\nWeb lucide feature imports:")
    for (const item of webFindings) console.error(`  ${item}`)
  }
  if (swiftFindings.length) {
    console.error("\niOS SF Symbol feature uses:")
    for (const item of swiftFindings) console.error(`  ${item}`)
  }
  process.exit(1)
}

const scopeLabel = swiftRoot ? "web/iOS" : "web"
console.log(`ShotIQ icon audit passed: no old feature icons found in strict ${scopeLabel} scopes.`)
