/**
 * The analysis job the processing screen watches.
 *
 * `/video-analysis/processing` draws canonical's five-stage pipeline with a
 * progress bar and a per-stage done/running/queued list. It was a `setTimeout`:
 * its `stage` was never advanced (the source literally read `void setStage`),
 * it never received an analysis id, and it polled nothing. The bar sat at 64%
 * for fifteen seconds and then declared itself slow — for every player, whether
 * or not anything was running. It told the user their video was being analysed
 * while nothing was analysing.
 *
 * The real run already exists and already knows its stages. `VideoUpload`
 * drives the pipeline client-side and moves through five of them — uploading,
 * analysing frames, processing results, saving the session, loading results —
 * reporting each into its own local state where no other screen could see it.
 * This is the contract that lets the canonical screen watch that run instead of
 * pretending to be one.
 *
 * WHY A MODULE STORE AND NOT A URL PARAM. The job's subject is a `File`, which
 * cannot cross a route boundary in a query string, and the run is client-side —
 * there is no server-side job row to poll. A subscribable module value is the
 * smallest thing that lets one component's real progress reach another's view.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: it does not re-implement the run. There is
 * one analysis pipeline and one save path, in `VideoUpload`; a second copy
 * would be two routes that disagree about the same shot, which is the defect
 * this whole log is about. This carries STATUS only.
 */

export type JobStage = "upload" | "pose" | "score" | "baseline" | "plan"

/** The five stages, in the order canonical's panel lists them. */
export const JOB_STAGES: JobStage[] = ["upload", "pose", "score", "baseline", "plan"]

/** Share of the run complete once each stage is REACHED, as canonical bands it. */
export const STAGE_PROGRESS: Record<JobStage, number> = {
  upload: 20, pose: 64, score: 78, baseline: 90, plan: 100,
}

export interface AnalysisJob {
  /** Running, or the terminal state it reached. */
  status: "running" | "done" | "failed"
  /** The clip being analysed. The processing screen mounts the pipeline over
   *  it — a `File` cannot cross a route boundary any other way, and the run is
   *  client-side, so it has to travel with the job. */
  file: File | null
  stage: JobStage
  /** Set when the run finished and the analysis was saved. */
  analysisId: string | null
  /** The reason the run failed, for the error screen to show. */
  error: string | null
  /** When the run began, so a reload can tell a live job from a stale one. */
  startedAt: number
}

let job: AnalysisJob | null = null
const listeners = new Set<(j: AnalysisJob | null) => void>()

function emit() {
  for (const listener of listeners) listener(job)
}

export function subscribeToAnalysisJob(fn: (j: AnalysisJob | null) => void): () => void {
  listeners.add(fn)
  fn(job)
  return () => { listeners.delete(fn) }
}

export function getAnalysisJob(): AnalysisJob | null {
  return job
}

/** Called by the pipeline when a run begins. Keeps any file already queued. */
export function startAnalysisJob(startedAt: number): void {
  job = { status: "running", file: job?.file ?? null, stage: "upload", analysisId: null, error: null, startedAt }
  emit()
}

/**
 * Queue a clip for analysis and hand the caller off to the processing screen.
 *
 * The upload flow used to `router.push` to that screen having kept only the
 * clip's METADATA — the `File` itself was read in `onPick` and dropped — so no
 * run ever started and the screen had nothing to show. The file rides on the
 * job now, and the processing screen mounts the one existing pipeline over it.
 */
export function queueAnalysisFile(file: File): void {
  job = {
    status: "running", file, stage: "upload",
    analysisId: null, error: null, startedAt: Date.now(),
  }
  emit()
}

/** Called as the pipeline reaches each stage. Ignored once the job is terminal. */
export function advanceAnalysisJob(stage: JobStage): void {
  if (!job || job.status !== "running") return
  job = { ...job, stage }
  emit()
}

export function completeAnalysisJob(analysisId: string | null): void {
  if (!job) return
  job = { ...job, status: "done", stage: "plan", analysisId }
  emit()
}

export function failAnalysisJob(error: string): void {
  if (!job) return
  job = { ...job, status: "failed", error }
  emit()
}

/** Clears the job — used when its screen has finished acting on it. */
export function clearAnalysisJob(): void {
  job = null
  emit()
}
