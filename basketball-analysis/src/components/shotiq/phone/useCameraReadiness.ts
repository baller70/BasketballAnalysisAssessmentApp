"use client"

import React from "react"
import { analyzeImageElement } from "@/services/pose"
import { cocoBallDetector } from "@/services/vision/CocoBallDetector"

/**
 * The readiness panel on canonical 030 — actually checking the camera.
 *
 * THE SIX ROWS WERE LITERALS. `READY_ROWS` in LiveCapture read "Full body GOOD
 * / Lighting GOOD / Stability GOOD / Hoop visible GOOD / Ball visible GOOD /
 * Pose confidence 92%", so the screen told every player their setup was
 * correct before recording — in the dark, with the phone in a pocket, with the
 * player out of frame. It is the check a player trusts before they shoot, and
 * it was six words on a card.
 *
 * FIVE OF THE SIX ARE ANSWERABLE from the frame, and they are answered by the
 * pipelines this app already ships rather than new ones:
 *
 *  - FULL BODY and POSE CONFIDENCE come from MoveNet — the same detector the
 *    analysis runs. Full body asks whether the joints that define a shot are
 *    actually in frame (both ankles, both shoulders, the head), not merely
 *    whether some keypoints were found: a player cropped at the knees returns
 *    plenty of keypoints and cannot be analysed.
 *  - LIGHTING is mean luminance off the sampled frame. No model needed.
 *  - STABILITY is the mean absolute difference between consecutive samples,
 *    which is camera shake plus subject motion; a phone on a tripod reads near
 *    zero and a handheld one does not.
 *  - BALL VISIBLE is the COCO detector the upload pipeline uses for shot
 *    tracking, looking for a sports ball.
 *
 * THE SIXTH IS NOT. Nothing in this app detects a hoop — the rim is
 * USER-CALIBRATED, tapped by the player on the upload screen, and there is no
 * rim detector to ask. It reports "Not checked" rather than a green GOOD,
 * because a player who trusts that row and frames the rim out of shot gets no
 * shot result at all.
 *
 * SAMPLING IS DELIBERATELY SLOW. Two models over a video frame is expensive on
 * a phone, and this runs while the player is still setting up. One pass every
 * `INTERVAL_MS`, never overlapping, and it stops the moment the panel unmounts.
 */

export type ReadinessState = "good" | "poor" | "checking" | "unavailable"

export interface ReadinessRow {
  label: string
  value: string
  state: ReadinessState
}

const INTERVAL_MS = 1200
/** Joints without which a shot cannot be analysed, whatever else is in frame. */
const REQUIRED = ["left_ankle", "right_ankle", "left_shoulder", "right_shoulder", "nose"]

/** Mean luminance, 0-255, of a downsampled frame. */
function meanLuminance(data: Uint8ClampedArray): number {
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  }
  return sum / (data.length / 4)
}

/** Mean absolute per-pixel difference between two same-sized frames, 0-255. */
function frameDelta(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let sum = 0
  for (let i = 0; i < a.length; i += 4) sum += Math.abs(a[i] - b[i])
  return sum / (a.length / 4)
}

export interface ReadinessInputs {
  /** Mean frame luminance, 0-255. */
  luma: number
  /** Mean per-pixel change since the previous sample, or null on the first. */
  motion: number | null
  keypointsFound: boolean
  fullBody: boolean
  /** Mean keypoint score, 0-1, or null when no pose was found. */
  confidence: number | null
  /** Whether a sports ball was seen, or null when the detector could not run. */
  ball: boolean | null
}

/**
 * The six rows from one sample's measurements. Pure, so the thresholds can be
 * tested without a camera, a GPU or a model — none of which a CI box has.
 */
export function evaluateReadiness(x: ReadinessInputs): ReadinessRow[] {
  return [
    !x.keypointsFound
      ? { label: "Full body", value: "NO PLAYER", state: "poor" }
      : x.fullBody
        ? { label: "Full body", value: "GOOD", state: "good" }
        : { label: "Full body", value: "OUT OF FRAME", state: "poor" },
    // Below ~45 a phone camera is already grainy; above ~215 it is blown out.
    x.luma < 45 ? { label: "Lighting", value: "TOO DARK", state: "poor" }
      : x.luma > 215 ? { label: "Lighting", value: "TOO BRIGHT", state: "poor" }
      : { label: "Lighting", value: "GOOD", state: "good" },
    x.motion == null
      ? { label: "Stability", value: "CHECKING", state: "checking" }
      : x.motion > 12
        ? { label: "Stability", value: "SHAKY", state: "poor" }
        : { label: "Stability", value: "GOOD", state: "good" },
    /* Nothing detects a hoop. The rim is calibrated by tapping it on the upload
       screen, so there is no detector to ask, and a green GOOD here would send
       a player off to record with the rim out of shot. */
    { label: "Hoop visible", value: "NOT CHECKED", state: "unavailable" },
    x.ball == null
      ? { label: "Ball visible", value: "CHECKING", state: "checking" }
      : x.ball
        ? { label: "Ball visible", value: "GOOD", state: "good" }
        : { label: "Ball visible", value: "NOT SEEN", state: "poor" },
    x.confidence == null
      ? { label: "Pose confidence", value: "—", state: "poor" }
      : {
          label: "Pose confidence",
          value: `${Math.round(x.confidence * 100)}%`,
          state: x.confidence >= 0.5 ? "good" : "poor",
        },
  ]
}

export function useCameraReadiness(stream: MediaStream | null): ReadinessRow[] {
  const [rows, setRows] = React.useState<ReadinessRow[] | null>(null)
  const previous = React.useRef<Uint8ClampedArray | null>(null)

  React.useEffect(() => {
    if (!stream) { setRows(null); previous.current = null; return }

    let dead = false
    let busy = false
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.srcObject = stream
    void video.play().catch(() => {})

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    const sample = async () => {
      if (dead || busy || !ctx || !video.videoWidth) return
      busy = true
      try {
        // A small frame is enough for every one of these and keeps two models
        // affordable on a phone.
        canvas.width = 256
        canvas.height = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * 256))
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data

        const luma = meanLuminance(frame)
        const motion = previous.current && previous.current.length === frame.length
          ? frameDelta(previous.current, frame)
          : null
        previous.current = frame

        const pose = await analyzeImageElement(canvas).catch(() => null)
        const keypoints = pose?.keypoints ?? null
        const named = new Map(
          (keypoints ?? []).map((k) => [k.name, k] as const),
        )
        const visible = (n: string) => (named.get(n)?.score ?? 0) >= 0.3
        const fullBody = keypoints ? REQUIRED.every(visible) : false
        const scores = (keypoints ?? []).map((k) => k.score).filter((n) => Number.isFinite(n))
        const confidence = scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null

        /* `detect` already filters to a sports ball and returns the single
           best observation, or null when it saw none. */
        let ball: boolean | null = null
        try {
          await cocoBallDetector.init()
          ball = (await cocoBallDetector.detect(canvas)) != null
        } catch { ball = null }

        if (dead) return
        setRows(evaluateReadiness({ luma, motion, keypointsFound: keypoints != null, fullBody, confidence, ball }))
      } finally {
        busy = false
      }
    }

    void sample()
    const timer = setInterval(() => { void sample() }, INTERVAL_MS)
    return () => {
      dead = true
      clearInterval(timer)
      video.srcObject = null
      previous.current = null
    }
  }, [stream])

  /* Before the first pass lands — and with no camera at all — the panel shows
     the check as PENDING rather than as passed. Canonical's six green rows are
     what a granted, framed, lit camera looks like; they are not what an
     unanswered check looks like. */
  return rows ?? [
    { label: "Full body", value: "CHECKING", state: "checking" },
    { label: "Lighting", value: "CHECKING", state: "checking" },
    { label: "Stability", value: "CHECKING", state: "checking" },
    { label: "Hoop visible", value: "NOT CHECKED", state: "unavailable" },
    { label: "Ball visible", value: "CHECKING", state: "checking" },
    { label: "Pose confidence", value: "CHECKING", state: "checking" },
  ]
}
