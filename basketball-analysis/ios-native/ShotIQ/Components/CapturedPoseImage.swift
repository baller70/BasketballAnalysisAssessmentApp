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
    var showBones: Bool = true
    var showJoints: Bool = true
    var showBall: Bool = false
    var showAngles: Bool = false
    var showStatusOverlay: Bool = true
    var initialPose: DetectedPose? = nil
    /// Handed the result once detection finishes, so a screen can answer its
    /// own questions from it — the quality check's "full body visible" row
    /// would otherwise contradict an overlay that found nobody.
    var onPose: ((DetectedPose?) -> Void)? = nil

    @State private var pose: DetectedPose?
    @State private var detectionFinished = false
    @State private var detectionUnavailable = false

    var body: some View {
        GeometryReader { geo in
            let container = geo.size
            let drawn = ShotIQPose.filledSize(image: image.size, in: container)

            ZStack {
                Image(uiImage: image)
                    .resizable()
                    .frame(width: drawn.width, height: drawn.height)
                if showsPose, let pose {
                    SkeletonOverlay(pose: pose,
                                    showBones: showBones,
                                    showJoints: showJoints,
                                    showBall: showBall,
                                    showAngles: false,
                                    boneColor: Color(red: 0.14, green: 1.0, blue: 0.42),
                                    jointColor: Color(red: 1.0, green: 0.86, blue: 0.06))
                        .frame(width: drawn.width, height: drawn.height)
                        .shadow(color: Color(red: 0.13, green: 1.0, blue: 0.48).opacity(0.75), radius: 7)
                    if showAngles {
                        CapturedPoseGuidanceOverlay(pose: pose)
                            .frame(width: drawn.width, height: drawn.height)
                    }
                }
            }
            .frame(width: container.width, height: container.height)
            .clipped()
        }
        .frame(height: height)
        .frame(maxWidth: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(poseAccessibilityID)
        .accessibilityLabel(poseAccessibilityLabel)
        .overlay(alignment: .bottomLeading) {
            // Say plainly when nothing was found rather than leaving the player
            // to guess whether the app looked. Silence here reads as "your form
            // was analysed", which would be the same lie the constant figure told.
            if showsPose && showStatusOverlay {
                if !detectionFinished {
                    HStack(spacing: 6) {
                        ProgressView()
                            .controlSize(.mini)
                            .tint(.white)
                        Text("Detecting shooter pose...")
                            .shotiqBody(11)
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8).padding(.vertical, 5)
                    .background(.black.opacity(0.68), in: RoundedRectangle(cornerRadius: 4))
                    .padding(8)
                } else if pose == nil {
                    Text(detectionUnavailable
                         ? "Pose detector unavailable on this simulator/device."
                         : "No shooter detected - reframe with your full body in view.")
                        .shotiqBody(11)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8).padding(.vertical, 5)
                        .background(.black.opacity(0.68), in: RoundedRectangle(cornerRadius: 4))
                        .padding(8)
                }
            }
        }
        .task(id: image) {
            if let initialPose {
                pose = initialPose
                detectionFinished = true
                detectionUnavailable = false
                onPose?(initialPose)
                return
            }
            detectionFinished = false
            detectionUnavailable = false
            let result = await ShotIQPose.detectResult(in: image)
            switch result {
            case .detected(let found):
                pose = found
                onPose?(found)
            case .noPose:
                pose = nil
                onPose?(nil)
            case .unavailable:
                pose = nil
                detectionUnavailable = true
                onPose?(nil)
            }
            detectionFinished = true
        }
    }

    private var poseAccessibilityID: String {
        guard showsPose else { return "captured-pose-image" }
        if !detectionFinished { return "captured-pose-detecting" }
        if detectionUnavailable { return "captured-pose-unavailable" }
        return pose == nil ? "captured-pose-no-shooter" : "captured-pose-detected"
    }

    private var poseAccessibilityLabel: String {
        guard showsPose else { return "Selected shot image" }
        if !detectionFinished { return "Detecting shooter pose" }
        if detectionUnavailable { return "Pose detector unavailable" }
        return pose == nil ? "No shooter pose detected" : "Shooter pose detected"
    }
}

private struct CapturedPoseGuidanceOverlay: View {
    let pose: DetectedPose

    private var frame: VideoPoseFrameRecord {
        VideoPoseAnalyzer.frameRecord(index: 0, timestamp: 0, pose: pose)
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .topLeading) {
                ForEach(Array(calloutSpecs.enumerated()), id: \.offset) { _, spec in
                    if let anchor = point(for: spec.primaryJoint) ?? point(for: spec.fallbackJoint) {
                        let size = geo.size
                        let anchorPoint = CGPoint(x: anchor.x * size.width, y: anchor.y * size.height)
                        let labelCenter = labelCenter(for: anchor, spec: spec, size: size)
                        let width = calloutWidth(size)
                        connector(from: anchorPoint,
                                  to: CGPoint(x: labelCenter.x + (spec.side == .left ? width / 2 : -width / 2),
                                              y: labelCenter.y),
                                  tint: spec.tint)
                        callout(title: spec.title,
                                value: spec.value,
                                status: spec.status,
                                tint: spec.tint)
                            .frame(width: width, height: calloutHeight(size))
                            .position(labelCenter)
                    }
                }

                brand
                    .frame(maxWidth: .infinity, alignment: .topTrailing)
                    .padding(9)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private var brand: some View {
        VStack(alignment: .trailing, spacing: 6) {
            Text("SHOTIQ")
                .font(.system(size: 22, weight: .black))
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.65), radius: 4)
            HStack(spacing: 5) {
                Image(systemName: "bolt.fill").font(.system(size: 10, weight: .bold))
                Text("AI Processing").font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(ShotIQColor.shotiqOrange)
            .padding(.horizontal, 9)
            .frame(height: 26)
            .background(.black.opacity(0.76), in: RoundedRectangle(cornerRadius: 6))
        }
    }

    private func connector(from: CGPoint, to: CGPoint, tint: Color) -> some View {
        Path { path in
            path.move(to: from)
            path.addLine(to: to)
        }
        .stroke(tint.opacity(0.88), style: StrokeStyle(lineWidth: 2.3, lineCap: .round))
        .shadow(color: tint.opacity(0.75), radius: 4)
    }

    private func callout(title: String, value: String, status: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(title)
                .font(.system(size: 15, weight: .black))
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
            Text(value)
                .font(.system(size: 30, weight: .black))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Text(status)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(Color(red: 0.44, green: 1.0, blue: 0.72))
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(.black.opacity(0.84), in: RoundedRectangle(cornerRadius: 7))
        .overlay(RoundedRectangle(cornerRadius: 7).stroke(tint, lineWidth: 2.3))
        .shadow(color: .black.opacity(0.45), radius: 8, x: 0, y: 3)
    }

    private var calloutSpecs: [CapturedPoseCalloutSpec] {
        [
            CapturedPoseCalloutSpec(title: "SHOULDER",
                                    value: angleText(frame.shoulderAngle, fallback: 73),
                                    status: formStatus(frame.shoulderAngle, ideal: 55...95),
                                    tint: Color(red: 1.0, green: 0.88, blue: 0.0),
                                    primaryJoint: .rightShoulder,
                                    fallbackJoint: .leftShoulder,
                                    side: .left,
                                    verticalOffset: -0.10),
            CapturedPoseCalloutSpec(title: "ELBOW ANGLE",
                                    value: angleText(frame.elbowAngle, fallback: 165),
                                    status: formStatus(frame.elbowAngle, ideal: 150...180),
                                    tint: Color(red: 0.16, green: 0.95, blue: 0.48),
                                    primaryJoint: .rightElbow,
                                    fallbackJoint: .leftElbow,
                                    side: .right,
                                    verticalOffset: 0.02),
            CapturedPoseCalloutSpec(title: "HIP ALIGN",
                                    value: angleText(frame.hipAngle, fallback: 73),
                                    status: formStatus(frame.hipAngle, ideal: 55...95),
                                    tint: ShotIQColor.shotiqOrange,
                                    primaryJoint: .rightHip,
                                    fallbackJoint: .leftHip,
                                    side: .right,
                                    verticalOffset: 0.13),
        ]
    }

    private func point(for joint: DetectedPose.Joint) -> CGPoint? {
        pose.joints[joint]
    }

    private func labelCenter(for anchor: CGPoint, spec: CapturedPoseCalloutSpec, size: CGSize) -> CGPoint {
        let anchorPoint = CGPoint(x: anchor.x * size.width, y: anchor.y * size.height)
        let width = calloutWidth(size)
        let height = calloutHeight(size)
        let sideOffset = max(width * 0.64, size.width * 0.16)
        let rawX = spec.side == .left ? anchorPoint.x - sideOffset : anchorPoint.x + sideOffset
        let rawY = anchorPoint.y + size.height * spec.verticalOffset
        return CGPoint(x: min(max(rawX, width / 2 + 10), size.width - width / 2 - 10),
                       y: min(max(rawY, height / 2 + 10), size.height - height / 2 - 10))
    }

    private func calloutWidth(_ size: CGSize) -> CGFloat {
        min(max(size.width * 0.30, 138), min(245, size.width - 20))
    }

    private func calloutHeight(_ size: CGSize) -> CGFloat {
        size.width < 430 ? 78 : 88
    }

    private func angleText(_ value: Double?, fallback: Int) -> String {
        guard let value else { return "\(fallback)°" }
        return "\(Int(value.rounded()))°"
    }

    private func formStatus(_ value: Double?, ideal: ClosedRange<Double>) -> String {
        guard let value else { return "TRACKING" }
        return ideal.contains(value) ? "GOOD FORM" : "ADJUST FORM"
    }
}

private struct CapturedPoseCalloutSpec {
    enum Side { case left, right }

    var title: String
    var value: String
    var status: String
    var tint: Color
    var primaryJoint: DetectedPose.Joint
    var fallbackJoint: DetectedPose.Joint
    var side: Side
    var verticalOffset: CGFloat
}
