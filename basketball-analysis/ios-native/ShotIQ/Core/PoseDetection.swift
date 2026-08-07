//
//  PoseDetection.swift
//  ShotIQ
//
//  THE SKELETON THE APP DRAWS WAS NEVER YOUR SKELETON.
//
//  `SkeletonOverlay` (Screens/Analysis/AnalysisFlow.swift) draws a six-point
//  chain from constants — ankle, knee, hip, shoulder, elbow, wrist at fixed
//  normalized coordinates. That is exactly right over the canonical crops,
//  which are staged frames of one posed shooter. It is wrong the moment the
//  picture is the player's own: the app claims to have found their joints and
//  is drawing the same figure it would draw over a blank rectangle.
//
//  This runs Apple's Vision body-pose request on the actual pixels, on device,
//  with no network call and nothing sent anywhere. It is the iOS counterpart of
//  what the web upload screen does with MoveNet (components/upload/
//  UploadedPoseOverlay.tsx), and it draws the same way — white bones, orange
//  joints — so one shot looks the same on both platforms.
//
//  ADDITIVE: nothing here replaces the canonical overlay. `SkeletonOverlay`
//  keeps its constants and keeps behaving identically when it is handed no
//  detected pose, which is what every canonical screen does. Detection is
//  applied only where the image on screen is the player's own capture.
//
//  Joints are keyed by `VNHumanBodyPoseObservation.JointName`, never by the
//  raw-value strings behind it: those are ARKit rig names ("left_forearm_joint"
//  is the ELBOW) and a typo in one would silently drop a limb with nothing to
//  catch it. Drawing code is handed plain points, so no view needs to import
//  Vision or know a joint name at all.
//

import CoreGraphics
import UIKit
import Vision

enum PoseDetectionResult: Equatable {
    case detected(DetectedPose)
    case noPose
    case unavailable(String)
}

/// A body pose located in one still, in top-left-origin unit coordinates so it
/// can be drawn straight into a SwiftUI Canvas without a second flip.
struct DetectedPose: Equatable {
    typealias Joint = VNHumanBodyPoseObservation.JointName

    /// Confident joint positions, in unit coordinates of the IMAGE.
    let joints: [Joint: CGPoint]
    /// Mean confidence over the joints that cleared the floor.
    let confidence: Float

    /// A pose worth drawing has enough of the body to read as a body. Below
    /// this the honest thing is to draw nothing rather than a few floating
    /// dots that imply a measurement was made.
    var isUsable: Bool { joints.count >= 6 }

    /// Every drawable bone as a pair of points, skipping segments whose ends
    /// were not both found. This is what the overlay strokes — it never has to
    /// look a joint up by name.
    var boneSegments: [(CGPoint, CGPoint)] {
        ShotIQPose.bones.compactMap { pair -> (CGPoint, CGPoint)? in
            guard let a = joints[pair.0], let b = joints[pair.1] else { return nil }
            return (a, b)
        }
    }

    /// Every confident joint, for the dots drawn on top of the bones.
    var points: [CGPoint] { Array(joints.values) }

    /// Is the shooting hand in frame? The wrists are the joints the shot is
    /// actually graded on, so this is the only honest question about hands the
    /// detection can answer.
    var hasWrist: Bool { joints[.leftWrist] != nil || joints[.rightWrist] != nil }

    /// Is the whole shooter in frame?
    ///
    /// The upload quality check has always asserted "Entire body is visible ·
    /// Good" from a constant, over any photo at all. This answers it from the
    /// detection: the head end and the foot end both have to be found, and both
    /// have to sit inside the frame rather than against its edge, which is what
    /// a body cropped at the ankles looks like to Vision.
    var isFullBodyVisible: Bool {
        let inset: CGFloat = 0.02
        func found(_ names: [Joint]) -> Bool {
            names.contains { name in
                guard let p = joints[name] else { return false }
                return p.y > inset && p.y < 1 - inset && p.x > inset && p.x < 1 - inset
            }
        }
        return found([.neck, .leftShoulder, .rightShoulder])
            && found([.leftAnkle, .rightAnkle, .leftKnee, .rightKnee])
    }
}

enum ShotIQPose {

    /// Vision reports a confidence per joint. Anything under this is a guess,
    /// and a guessed joint drags a whole limb across the frame — the same 0.3
    /// floor the web pipeline uses, so both platforms discard the same points.
    static let minimumJointConfidence: Float = 0.3

    /// The segments drawn between joints. Eyes and ears are deliberately absent:
    /// canonical's figure is a shooting-form skeleton, not an anatomy diagram,
    /// and they add clutter over the face without adding a graded mechanic.
    static let bones: [(DetectedPose.Joint, DetectedPose.Joint)] = [
        (.neck, .leftShoulder), (.neck, .rightShoulder),
        (.leftShoulder, .rightShoulder),
        (.leftShoulder, .leftElbow), (.leftElbow, .leftWrist),
        (.rightShoulder, .rightElbow), (.rightElbow, .rightWrist),
        (.leftShoulder, .leftHip), (.rightShoulder, .rightHip),
        (.leftHip, .rightHip),
        (.leftHip, .leftKnee), (.leftKnee, .leftAnkle),
        (.rightHip, .rightKnee), (.rightKnee, .rightAnkle),
    ]

    /// The size an aspect-FILL image is actually drawn at inside a container:
    /// the larger of the two scales covers both axes and the overflow is
    /// centred and clipped, which is the geometry `.scaledToFill()` uses.
    ///
    /// This is the number the skeleton has to be drawn against. A pose is in
    /// unit coordinates of the whole image, so drawing it against the visible
    /// container instead puts a correctly-shaped figure beside the player —
    /// which is exactly how the web overlay first went wrong, by reading an
    /// <img>'s layout size rather than its natural size. Factored out so the
    /// arithmetic can be tested rather than eyeballed on a phone.
    static func filledSize(image: CGSize, in container: CGSize) -> CGSize {
        let pixels = CGSize(width: max(image.width, 1), height: max(image.height, 1))
        let scale = max(container.width / pixels.width, container.height / pixels.height)
        return CGSize(width: pixels.width * scale, height: pixels.height * scale)
    }

    /// Vision's normalized space has its origin at the BOTTOM left; SwiftUI's
    /// Canvas has its origin at the top left. Getting this backwards draws a
    /// perfectly-shaped skeleton standing on its head, which is why the flip
    /// lives in one place rather than at each call site.
    private static func topLeft(_ p: CGPoint) -> CGPoint {
        CGPoint(x: p.x, y: 1 - p.y)
    }

    /// A UIImage carries its rotation in `imageOrientation` rather than in the
    /// pixels. Handing Vision the raw CGImage without it means a photo taken in
    /// portrait is analysed sideways and no body is found at all.
    private static func cgOrientation(_ o: UIImage.Orientation) -> CGImagePropertyOrientation {
        switch o {
        case .up: return .up
        case .down: return .down
        case .left: return .left
        case .right: return .right
        case .upMirrored: return .upMirrored
        case .downMirrored: return .downMirrored
        case .leftMirrored: return .leftMirrored
        case .rightMirrored: return .rightMirrored
        @unknown default: return .up
        }
    }

    /// Find the body in a still. Returns nil when there is no person in the
    /// frame, when too few joints are confident, or when Vision fails — every
    /// one of which the caller treats the same way: claim nothing.
    ///
    /// Runs off the main thread: on a full-resolution iPhone photo the request
    /// takes long enough to stutter the UI if it runs during a view update.
    static func detect(in image: UIImage) async -> DetectedPose? {
        if case .detected(let pose) = await detectResult(in: image) { return pose }
        return nil
    }

    static func detectResult(in image: UIImage) async -> PoseDetectionResult {
        guard let cgImage = image.cgImage else { return .unavailable("Image could not be read.") }
        let orientation = cgOrientation(image.imageOrientation)

        return await withCheckedContinuation { (continuation: CheckedContinuation<PoseDetectionResult, Never>) in
            DispatchQueue.global(qos: .userInitiated).async {
                let request = VNDetectHumanBodyPoseRequest()
                let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])
                do {
                    try handler.perform([request])
                } catch {
                    continuation.resume(returning: .unavailable("Pose detector unavailable on this simulator/device."))
                    return
                }

                guard let observations = request.results, !observations.isEmpty else {
                    continuation.resume(returning: .noPose)
                    return
                }

                // A gym has other people in it. The shooter is the figure Vision
                // is surest of across the most joints — a bystander in the
                // background resolves into far fewer.
                let best = observations.max { a, b in
                    (a.availableJointNames.count, a.confidence) < (b.availableJointNames.count, b.confidence)
                }
                guard let observation = best,
                      let points = try? observation.recognizedPoints(.all) else {
                    continuation.resume(returning: .noPose)
                    return
                }

                var joints: [DetectedPose.Joint: CGPoint] = [:]
                var confidences: [Float] = []
                for (name, point) in points where point.confidence >= minimumJointConfidence {
                    joints[name] = topLeft(point.location)
                    confidences.append(point.confidence)
                }

                let pose = DetectedPose(
                    joints: joints,
                    confidence: confidences.isEmpty
                        ? 0
                        : confidences.reduce(0, +) / Float(confidences.count)
                )
                continuation.resume(returning: pose.isUsable ? .detected(pose) : .noPose)
            }
        }
    }
}
