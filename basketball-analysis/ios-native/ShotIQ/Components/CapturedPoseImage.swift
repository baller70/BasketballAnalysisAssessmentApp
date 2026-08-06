//
//  CapturedPoseImage.swift
//  ShotIQ
//
//  The player's own photo with the player's own skeleton on it.
//
//  Screens that show a canonical crop keep drawing `SkeletonOverlay` exactly as
//  before — those frames are a staged shooter and the constant figure fits them.
//  This view is for the other case: the picture the player just took or picked,
//  where the app was drawing that same constant figure and calling it their
//  form. It runs `ShotIQPose.detect` on the actual pixels and draws what came
//  back, or draws nothing at all when no body was found.
//
//  THE COORDINATE TRAP THIS EXISTS TO AVOID. The photo is drawn aspect-FILL, so
//  it overflows its frame and is clipped; a detected pose is in unit
//  coordinates of the whole image. Drawing those units into the visible frame
//  puts a correctly-shaped skeleton next to the player instead of on them —
//  the same defect the web overlay hit by reading an <img>'s layout size
//  instead of its natural size. The skeleton is therefore drawn into a Canvas
//  sized and positioned to the image's DRAWN rect, and the pair is clipped
//  together.
//

import SwiftUI
import UIKit

struct CapturedPoseImage: View {
    let image: UIImage
    /// Height of the visible frame, matching the plain `Image` it replaces.
    var height: CGFloat
    var cornerRadius: CGFloat = 0
    /// Set false to show the photo untouched (an "original / analysed" toggle).
    var showsPose: Bool = true
    /// Handed the result once detection finishes, so a screen can answer its
    /// own questions from it — the quality check's "full body visible" row
    /// would otherwise contradict an overlay that found nobody.
    var onPose: ((DetectedPose?) -> Void)? = nil

    @State private var pose: DetectedPose?
    @State private var detectionFinished = false

    var body: some View {
        GeometryReader { geo in
            let container = geo.size
            let drawn = ShotIQPose.filledSize(image: image.size, in: container)

            ZStack {
                Image(uiImage: image)
                    .resizable()
                    .frame(width: drawn.width, height: drawn.height)
                if showsPose, let pose {
                    SkeletonOverlay(pose: pose, showBall: false)
                        .frame(width: drawn.width, height: drawn.height)
                }
            }
            .frame(width: container.width, height: container.height)
            .clipped()
        }
        .frame(height: height)
        .frame(maxWidth: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        .overlay(alignment: .bottomLeading) {
            // Say plainly when nothing was found rather than leaving the player
            // to guess whether the app looked. Silence here reads as "your form
            // was analysed", which would be the same lie the constant figure told.
            if showsPose && detectionFinished && pose == nil {
                Text("No shooter detected — reframe with your full body in view.")
                    .shotiqBody(11)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8).padding(.vertical, 5)
                    .background(.black.opacity(0.68), in: RoundedRectangle(cornerRadius: 4))
                    .padding(8)
            }
        }
        .task(id: image) {
            detectionFinished = false
            let found = await ShotIQPose.detect(in: image)
            pose = found
            detectionFinished = true
            onPose?(found)
        }
    }
}
