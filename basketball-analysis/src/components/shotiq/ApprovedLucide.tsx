"use client"

import React from "react"
import * as Lucide from "lucide-react"
import { approvedAssetForConcept } from "@/components/shotiq/Glyphs"

export type { LucideIcon, LucideProps } from "lucide-react"

const ICON_BASE = "/shotiq/icons/approved"

function approvedIcon(concept: string, fallback = concept) {
  const Icon = React.forwardRef<SVGSVGElement, Lucide.LucideProps>(function ApprovedShotIQIcon(
    { size = 24, className = "", children: _children, color: _color, strokeWidth: _strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, style, ...rest },
    ref,
  ) {
    const asset = approvedAssetForConcept(concept, fallback)
    const renderedSize = typeof size === "number" ? Math.max(size, 32) : size
    return (
      <svg
        {...rest}
        ref={ref}
        width={renderedSize}
        height={renderedSize}
        viewBox="0 0 24 24"
        className={className}
        style={{ width: renderedSize, height: renderedSize, ...style }}
        fill="none"
        aria-hidden={rest["aria-label"] ? undefined : "true"}
        role={rest["aria-label"] ? "img" : undefined}
      >
        <image href={`${ICON_BASE}/${asset}.png`} x="0" y="0" width="24" height="24" preserveAspectRatio="xMidYMid meet" />
      </svg>
    )
  })
  Icon.displayName = `ApprovedShotIQIcon(${concept})`
  return Icon
}

export const Activity = approvedIcon("Progress activity")
export const ArrowDown = approvedIcon("Progress down")
export const Award = approvedIcon("Achievements award badge")
export const BarChart3 = approvedIcon("Progress analytics")
export const BellRing = approvedIcon("Reminder alert")
export const BookOpen = approvedIcon("Help guide")
export const Brain = approvedIcon("AI analysis")
export const Calendar = approvedIcon("Training calendar")
export const CalendarCheck = approvedIcon("Training calendar complete")
export const CalendarClock = approvedIcon("Training calendar time")
export const CalendarDays = approvedIcon("Training calendar")
export const CalendarPlus = approvedIcon("Training calendar add")
export const Camera = approvedIcon("Live camera")
export const CheckCircle = approvedIcon("Success complete")
export const CheckCircle2 = approvedIcon("Success complete")
export const CircleCheck = approvedIcon("Success complete")
export const CircleDot = approvedIcon("Target point")
export const CircleX = approvedIcon("Warning error")
export const ClipboardCheck = approvedIcon("Checklist complete")
export const Clock = approvedIcon("Stopwatch time")
export const Crop = approvedIcon("Capture frame crop")
export const Crosshair = approvedIcon("Target reticle")
export const Crown = approvedIcon("Elite achievement")
export const Dumbbell = approvedIcon("Train workout")
export const Edit2 = approvedIcon("Edit coaching note")
export const Eraser = approvedIcon("Edit erase annotation")
export const FileText = approvedIcon("Report document")
export const Film = approvedIcon("Upload video")
export const Flag = approvedIcon("Goal flag")
export const Flame = approvedIcon("Calendar heat streak")
export const FlipHorizontal = approvedIcon("Switch camera")
export const Focus = approvedIcon("Focus target")
export const Footprints = approvedIcon("Footwork movement")
export const Gauge = approvedIcon("Form score gauge")
export const Gem = approvedIcon("Points badge")
export const Gift = approvedIcon("Reward badge")
export const GitCompare = approvedIcon("Compare pose")
export const Globe = approvedIcon("Public sharing")
export const GraduationCap = approvedIcon("Coaching tip")
export const Grip = approvedIcon("Grip handle")
export const GripVertical = approvedIcon("Grip reorder")
export const Hand = approvedIcon("Release hand")
export const Hexagon = approvedIcon("Points badge")
export const Image = approvedIcon("Upload image")
export const ImageIcon = approvedIcon("Upload image")
export const LayoutGrid = approvedIcon("Grid layout")
export const Lightbulb = approvedIcon("Coaching tip")
export const LineChart = approvedIcon("Progress analytics")
export const List = approvedIcon("Checklist")
export const ListChecks = approvedIcon("Drill checklist")
export const MailCheck = approvedIcon("Success complete")
export const MailWarning = approvedIcon("Warning error")
export const MapPin = approvedIcon("Location court")
export const Medal = approvedIcon("Achievement badge")
export const MonitorSmartphone = approvedIcon("Device sync")
export const MoveHorizontal = approvedIcon("Compare horizontal")
export const Navigation = approvedIcon("Goal path")
export const Pen = approvedIcon("Edit coaching note")
export const Pencil = approvedIcon("Edit coaching note")
export const Radio = approvedIcon("Live camera")
export const Ruler = approvedIcon("Measurements ruler")
export const Settings = approvedIcon("Settings")
export const ShieldCheck = approvedIcon("Privacy success")
export const SignalHigh = approvedIcon("Progress signal")
export const Sparkles = approvedIcon("AI analysis")
export const Star = approvedIcon("Achievement badge")
export const Target = approvedIcon("Target reticle")
export const Timer = approvedIcon("Stopwatch time")
export const TrendingDown = approvedIcon("Progress down")
export const TrendingUp = approvedIcon("Progress trend")
export const Trophy = approvedIcon("Achievement trophy")
export const Upload = approvedIcon("Upload image")
export const UploadCloud = approvedIcon("Upload cloud")
export const User = approvedIcon("Profile")
export const UserRound = approvedIcon("Profile")
export const Users = approvedIcon("Compare players")
export const Video = approvedIcon("Upload video")
export const Waypoints = approvedIcon("Progress path")
export const Workflow = approvedIcon("Workflow progress")
export const XCircle = approvedIcon("Warning error")
export const Zap = approvedIcon("Improve energy")
export const AlertCircle = approvedIcon("Warning error")
export const AlertTriangle = approvedIcon("Warning error")
export const HelpCircle = approvedIcon("Help guide")

export const ArrowLeft = Lucide.ArrowLeft
export const ArrowLeftRight = Lucide.ArrowLeftRight
export const ArrowRight = Lucide.ArrowRight
export const ArrowUpDown = Lucide.ArrowUpDown
export const ArrowUpRight = Lucide.ArrowUpRight
export const Bell = Lucide.Bell
export const Bookmark = Lucide.Bookmark
export const CameraOff = Lucide.CameraOff
export const Check = Lucide.Check
export const ChevronDown = Lucide.ChevronDown
export const ChevronLeft = Lucide.ChevronLeft
export const ChevronRight = Lucide.ChevronRight
export const ChevronUp = Lucide.ChevronUp
export const Circle = Lucide.Circle
export const CloudOff = Lucide.CloudOff
export const Download = Lucide.Download
export const Eye = Lucide.Eye
export const EyeOff = Lucide.EyeOff
export const Filter = Lucide.Filter
export const Highlighter = Lucide.Highlighter
export const Info = Lucide.Info
export const Loader2 = Lucide.Loader2
export const Lock = Lucide.Lock
export const LogOut = Lucide.LogOut
export const Maximize = Lucide.Maximize
export const Maximize2 = Lucide.Maximize2
export const Minimize = Lucide.Minimize
export const Minimize2 = Lucide.Minimize2
export const Minus = Lucide.Minus
export const MoreHorizontal = Lucide.MoreHorizontal
export const MoreVertical = Lucide.MoreVertical
export const MousePointer2 = Lucide.MousePointer2
export const Move = Lucide.Move
export const MoveRight = Lucide.MoveRight
export const Palette = Lucide.Palette
export const Pause = Lucide.Pause
export const Play = Lucide.Play
export const Plus = Lucide.Plus
export const Redo2 = Lucide.Redo2
export const RefreshCcw = Lucide.RefreshCcw
export const RefreshCw = Lucide.RefreshCw
export const RotateCcw = Lucide.RotateCcw
export const RotateCw = Lucide.RotateCw
export const Save = Lucide.Save
export const Search = Lucide.Search
export const Share = Lucide.Share
export const Share2 = Lucide.Share2
export const SkipBack = Lucide.SkipBack
export const SkipForward = Lucide.SkipForward
export const SlidersHorizontal = Lucide.SlidersHorizontal
export const Square = Lucide.Square
export const Sun = Lucide.Sun
export const SwitchCamera = Lucide.SwitchCamera
export const Trash2 = Lucide.Trash2
export const Type = Lucide.Type
export const Undo2 = Lucide.Undo2
export const Volume2 = Lucide.Volume2
export const VolumeX = Lucide.VolumeX
export const X = Lucide.X
export const ZoomIn = Lucide.ZoomIn
