'use client'

/**
 * Draws the REAL pose skeleton over a photo the user just picked.
 *
 * Until now every wireframe in this app was decoration. The iOS overlay draws
 * six hard-coded normalised points, the canonical thumbnails have the skeleton
 * baked into the image file, and `/results/demo` is a static page — so a photo
 * a player uploaded was never measured, and the nodes they saw belonged to
 * somebody else's picture.
 *
 * `poseDetectionService` (MoveNet, 619 lines, already in this repo) has been
 * doing this properly for the live camera the whole time. It accepts an
 * `HTMLImageElement` as happily as a video, so a still needs no new backend,
 * no upload round-trip and no model of its own — just the same detector, run
 * once, and its keypoints drawn in the canonical style.
 *
 * ADDITIVE BY CONSTRUCTION. The plain <img> is always rendered. The canvas is
 * an overlay on top of it, so if the model fails to load, finds nobody, or the
 * browser lacks WebGL, the caller still shows exactly the preview it showed
 * before — this component can degrade to a no-op but it cannot subtract.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  poseDetectionService,
  SKELETON_CONNECTIONS,
  type Pose,
} from '@/services/poseDetection'

/** Canonical overlay colours — white bones, orange joints, as the design draws them. */
const BONE = '#FFFFFF'
const JOINT = '#FD3701'

/** Below this MoveNet confidence a keypoint is guesswork; don't draw it. */
const MIN_SCORE = 0.3

export type PoseStatus = 'idle' | 'detecting' | 'found' | 'none' | 'error'

interface Props {
  /** Object URL or data URL for the image the user selected. */
  src: string
  alt?: string
  className?: string
  /** Told the outcome so the page can caption it; never required. */
  onStatus?: (status: PoseStatus, pose: Pose | null) => void
}

export default function UploadedPoseOverlay({ src, alt = 'Upload preview', className, onStatus }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [status, setStatus] = useState<PoseStatus>('idle')
  const poseRef = useRef<Pose | null>(null)

  const report = useCallback((s: PoseStatus, p: Pose | null) => {
    setStatus(s)
    poseRef.current = p
    onStatus?.(s, p)
  }, [onStatus])

  /**
   * Paint the skeleton in the image's own pixel space.
   *
   * MoveNet returns coordinates in the image's INTRINSIC pixels, while the
   * <img> is laid out by CSS at whatever size the grid gives it. Sizing the
   * canvas backing store to naturalWidth/Height and letting CSS stretch it the
   * same way it stretches the photo keeps the two in register at any layout
   * size, with no scale factor to recompute on resize.
   */
  const draw = useCallback((pose: Pose) => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    const w = img.naturalWidth
    const h = img.naturalHeight
    if (!w || !h) return
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)

    // Stroke weights are a fraction of the image's own size so the overlay
    // reads the same on a 700px crop and a 4000px phone photo.
    const bone = Math.max(2, Math.round(Math.min(w, h) / 180))
    const dot = Math.max(3, Math.round(Math.min(w, h) / 120))

    const kp = pose.keypoints
    const ok = (i: number) => kp[i] && (kp[i].score ?? 0) >= MIN_SCORE

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = BONE
    ctx.lineWidth = bone
    for (const [a, b] of SKELETON_CONNECTIONS) {
      if (!ok(a) || !ok(b)) continue
      ctx.beginPath()
      ctx.moveTo(kp[a].x, kp[a].y)
      ctx.lineTo(kp[b].x, kp[b].y)
      ctx.stroke()
    }

    ctx.fillStyle = JOINT
    for (let i = 0; i < kp.length; i++) {
      if (!ok(i)) continue
      ctx.beginPath()
      ctx.arc(kp[i].x, kp[i].y, dot, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const img = imgRef.current
    if (!img || !src) return

    const run = async () => {
      report('detecting', null)
      try {
        // 'lightning' is the single-person model. Live mode swaps the detector
        // to 'multipose' when it starts, and initialize() disposes whatever was
        // there first, so running here cannot leave Live mode holding a
        // detector that ignores pose IDs.
        await poseDetectionService.initialize('lightning')
        if (cancelled) return

        // DETECT ON A CANVAS AT THE FILE'S OWN SIZE, NOT ON THE <img>.
        //
        // tfjs reads an HTMLImageElement through its `width`/`height`
        // PROPERTIES, which reflect the element's LAYOUT size once CSS has had
        // its way — here `w-full h-full` inside a square tile. So a 182x281
        // photo was being sampled as 280x280 and the keypoints came back in
        // that stretched space, while the overlay drew them in the file's
        // 182x281 space. The skeleton appeared, correctly shaped, and sat
        // beside the player instead of on him: squashed vertically and fanned
        // out horizontally by exactly the aspect difference.
        //
        // Drawing into an offscreen canvas at naturalWidth/naturalHeight makes
        // the detector's coordinate space and the overlay's the same space, so
        // no scale factor has to be maintained in two places.
        const off = document.createElement('canvas')
        off.width = img.naturalWidth
        off.height = img.naturalHeight
        const offCtx = off.getContext('2d')
        if (!offCtx) { report('error', null); return }
        offCtx.drawImage(img, 0, 0, off.width, off.height)

        const pose = await poseDetectionService.detectPose(off)
        if (cancelled) return
        if (!pose) { report('none', null); return }
        draw(pose)
        report('found', pose)
      } catch (e) {
        console.error('[UploadedPoseOverlay] detection failed', e)
        if (!cancelled) report('error', null)
      }
    }

    if (img.complete && img.naturalWidth) void run()
    else img.addEventListener('load', run, { once: true })

    return () => {
      cancelled = true
      img.removeEventListener('load', run)
    }
  }, [src, draw, report])

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        className="w-full h-full object-cover"
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      {status === 'detecting' && (
        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
          Finding your form…
        </div>
      )}
      {status === 'none' && (
        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
          No shooter detected
        </div>
      )}
    </div>
  )
}
