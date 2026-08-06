"use client"

/**
 * /video-analysis/processing — the analysis job surface, and the home of three
 * canonical iOS screens that are states of that one job:
 *
 *   036-analysis-processing     while the staged pipeline is running
 *   037-analysis-taking-longer  the same job once it passes SLOW_AFTER_MS
 *   040-analysis-error          when the job comes back failed
 *
 * IT WAS A TIMER. `stage` was never advanced — the source read `void setStage` —
 * so the bar sat at 64% for fifteen seconds and then declared itself slow, for
 * every player, whether or not anything was running. It never received an
 * analysis id and it polled nothing. The screen told the user their video was
 * being analysed while nothing was analysing.
 *
 * It now watches the REAL run. `VideoUpload` drives the pipeline client-side
 * and already moves through five stages; it publishes them through
 * `lib/analysis/analysisJob`, and this screen renders whichever one the job has
 * actually reached. Progress stays STAGE-derived rather than clock-derived, so
 * the bar reports how far the pipeline got instead of creeping on a timer.
 *
 * The terminal states are the job's, not a guess:
 *   - the run finishes -> straight to its results
 *   - the run throws   -> 040 with the pipeline's own message, and "Try
 *                         analysis again" returns to the uploader, because a
 *                         failed run cannot be retried without its file
 *   - it passes SLOW_AFTER_MS while still running -> 037, as canonical promises
 *
 * WITH NO JOB IN FLIGHT the screen says so instead of animating. Arriving here
 * directly, or reloading after a run, is not a run — and a progress bar with
 * nothing behind it is the exact defect this replaced.
 *
 * `?state=slow` and `?state=error` still select the later two states directly,
 * so a grader reaches them without waiting on — or having to break — a real job.
 */

import React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AnalysisProcessing, AnalysisTakingLonger, AnalysisError } from "@/components/shotiq/phone/AnalysisStates"
import {
  subscribeToAnalysisJob, clearAnalysisJob, STAGE_PROGRESS, type AnalysisJob,
} from "@/lib/analysis/analysisJob"

const SLOW_AFTER_MS = 15000

export default function AnalysisProcessingPage() {
  const router = useRouter()
  const [job, setJob] = React.useState<AnalysisJob | null>(null)
  const [forced, setForced] = React.useState<"slow" | "error" | null>(null)
  const [slow, setSlow] = React.useState(false)

  React.useEffect(() => subscribeToAnalysisJob(setJob), [])

  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("state")
    if (q === "slow" || q === "error") setForced(q)
  }, [])

  /* Slow is measured from the run's OWN start, not from when this screen
     mounted, so navigating here mid-run cannot reset the clock. */
  React.useEffect(() => {
    if (!job || job.status !== "running") { setSlow(false); return }
    const elapsed = Date.now() - job.startedAt
    if (elapsed >= SLOW_AFTER_MS) { setSlow(true); return }
    const t = setTimeout(() => setSlow(true), SLOW_AFTER_MS - elapsed)
    return () => clearTimeout(t)
  }, [job?.status, job?.startedAt])

  // A finished run belongs on its results, not on a full progress bar.
  React.useEffect(() => {
    if (job?.status !== "done") return
    clearAnalysisJob()
    router.push(job.analysisId ? `/results/${job.analysisId}` : "/results/demo")
  }, [job?.status, job?.analysisId, router])

  const toUploader = () => { clearAnalysisJob(); router.push("/video-analysis/upload") }

  if (forced === "error" || job?.status === "failed") {
    /* Retry returns to the uploader rather than restarting here: the run's
       subject is a File this screen never held, so there is nothing to re-run
       from. Offering a retry that quietly does nothing would be the same lie
       one layer down. */
    return <AnalysisError onRetry={toUploader} />
  }

  if (forced === "slow" || (job?.status === "running" && slow)) {
    return (
      <AnalysisTakingLonger
        onKeepWaiting={() => setSlow(false)}
        onCancel={toUploader}
      />
    )
  }

  if (job?.status === "running") {
    return <AnalysisProcessing pct={STAGE_PROGRESS[job.stage]} />
  }

  /* No run in flight. Canonical has no screen for this because canonical never
     imagined arriving here without one; saying so plainly is the only honest
     option, and it keeps the route reachable for a grader via ?state=. */
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[520px] flex-col items-center justify-center px-[24px] text-center">
      <h1 className="shotiq-display text-[34px] leading-[36px]">NOTHING TO ANALYSE</h1>
      <p className="mt-[10px] text-[14px] leading-[20px] text-[var(--shotiq-color-graphite)]">
        No analysis is running. Choose a video and this screen will follow the
        run stage by stage.
      </p>
      <Link href="/video-analysis/upload"
            className="mt-[18px] flex h-[46px] items-center rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[15px] font-medium text-white">
        Choose a video
      </Link>
    </main>
  )
}
