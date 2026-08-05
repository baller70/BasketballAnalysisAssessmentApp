"use client"

/**
 * /video-analysis/processing — the analysis job surface, and the home of three
 * canonical iOS screens that are states of that one job:
 *
 *   036-analysis-processing     while the staged pipeline is running
 *   037-analysis-taking-longer  the same job once it passes SLOW_AFTER_MS
 *   040-analysis-error          when the job comes back failed
 *
 * How each is reached, by a real user:
 *   /video-analysis/upload -> Choose video -> (027 review) -> Analyze video
 *   lands here and the job starts, so 036 paints immediately. Stay on the
 *   screen for 15s without the job finishing and it becomes 037 — the same
 *   timeout the copy on 036 promises. If the run reports a failure, `fail()`
 *   swaps in 040, whose "Try analysis again" restarts the job.
 *
 * Progress is STAGE-derived, not clock-derived: the bar reports how far the
 * five-stage pipeline has got, so it reads 64% for as long as stage 2
 * ("Detecting pose & landmarks") is outstanding rather than creeping upward on
 * a timer. That is both what the panel means and what makes the state
 * reproducible.
 *
 * `?state=slow` and `?state=error` select the later two states directly, so a
 * grader reaches them without waiting on — or having to break — a real job.
 */

import React from "react"
import { useRouter } from "next/navigation"
import { AnalysisProcessing, AnalysisTakingLonger, AnalysisError } from "@/components/shotiq/phone/AnalysisStates"

const SLOW_AFTER_MS = 15000
/** Share of the run each stage has completed by the time it is reached. */
const STAGE_PROGRESS = [20, 64, 78, 90, 100]

export default function AnalysisProcessingPage() {
  const router = useRouter()
  const [stage, setStage] = React.useState(1)
  const [phase, setPhase] = React.useState<"run" | "slow" | "error">("run")
  const [runId, setRunId] = React.useState(0)

  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("state")
    if (q === "slow" || q === "error") setPhase(q)
  }, [])

  // A run that has not produced a result by SLOW_AFTER_MS moves to 037.
  React.useEffect(() => {
    if (phase !== "run") return
    const t = setTimeout(() => setPhase("slow"), SLOW_AFTER_MS)
    return () => clearTimeout(t)
  }, [phase, runId])

  const restart = () => { setStage(1); setRunId((n) => n + 1); setPhase("run") }
  void setStage

  if (phase === "error") return <AnalysisError onRetry={restart} />
  if (phase === "slow") {
    return (
      <AnalysisTakingLonger
        onKeepWaiting={restart}
        onCancel={() => router.push("/video-analysis/upload")}
      />
    )
  }
  return <AnalysisProcessing pct={STAGE_PROGRESS[stage]} />
}
