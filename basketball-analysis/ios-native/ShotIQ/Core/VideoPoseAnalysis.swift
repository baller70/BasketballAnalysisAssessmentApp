import AVFoundation
import CoreGraphics
import UIKit
import Vision

struct VideoPosePoint: Codable, Equatable {
    var x: Double
    var y: Double
}

struct VideoPoseFrameRecord: Codable, Equatable {
    var frameIndex: Int
    var timestampSeconds: Double
    var confidence: Double
    var keypoints: [String: VideoPosePoint]
    var elbowAngle: Double?
    var kneeAngle: Double?
    var wristAngle: Double?
    var shoulderAngle: Double?
    var hipAngle: Double?
    var releaseAngle: Double?
}

struct VideoPoseAnalysisSummary: Codable, Equatable {
    var source: String
    var frameCount: Int
    var detectedFrameCount: Int
    var releaseFrameIndex: Int?
    var releaseTimestampSeconds: Double?
    var releaseElbowAngle: Double?
    var releaseKneeAngle: Double?
    var releaseWristAngle: Double?
    var releaseShoulderAngle: Double?
    var releaseHipAngle: Double?
    var releaseAngle: Double?
    var kneeAngleMin: Double?
    var averageConfidence: Double?
    var overallScore: Double?
    var formScore: Double?
    var releaseScore: Double?
    var consistencyScore: Double?
}

struct VideoPoseAnalysis: Equatable {
    var summary: VideoPoseAnalysisSummary
    var frames: [VideoPoseFrameRecord]
}

enum VideoPoseAnalyzer {
    static let maxSampledFrames = 12

    static func analyze(job: VideoAnalysisJob) async -> VideoPoseAnalysis {
        let sampleTimes = sampleTimes(start: job.trimStartSeconds,
                                      end: job.trimEndSeconds,
                                      maxCount: maxSampledFrames)
        let asset = AVURLAsset(url: job.clip.url)
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: 720, height: 720)

        var frames: [VideoPoseFrameRecord] = []
        for (index, seconds) in sampleTimes.enumerated() {
            let time = CMTime(seconds: seconds, preferredTimescale: 600)
            guard let cgImage = try? generator.copyCGImage(at: time, actualTime: nil) else {
                continue
            }
            let image = UIImage(cgImage: cgImage)
            guard let pose = await ShotIQPose.detect(in: image) else {
                continue
            }
            frames.append(frameRecord(index: index, timestamp: seconds, pose: pose))
        }

        return VideoPoseAnalysis(summary: summary(from: frames, sampledCount: sampleTimes.count),
                                 frames: frames)
    }

    static func sampleTimes(start: Double, end: Double, maxCount: Int) -> [Double] {
        let lower = max(0, start)
        let upper = max(lower, end)
        guard upper > lower, maxCount > 0 else { return [] }
        let duration = upper - lower
        let count = min(maxCount, max(3, Int(duration.rounded(.up))))
        if count == 1 { return [lower + duration / 2] }
        return (0..<count).map { index in
            lower + (duration * Double(index) / Double(count - 1))
        }
    }

    static func angle(_ a: CGPoint?, _ b: CGPoint?, _ c: CGPoint?) -> Double? {
        guard let a, let b, let c else { return nil }
        let v1 = CGVector(dx: a.x - b.x, dy: a.y - b.y)
        let v2 = CGVector(dx: c.x - b.x, dy: c.y - b.y)
        let mag1 = hypot(v1.dx, v1.dy)
        let mag2 = hypot(v2.dx, v2.dy)
        guard mag1 > 0, mag2 > 0 else { return nil }
        let cosine = min(max((v1.dx * v2.dx + v1.dy * v2.dy) / (mag1 * mag2), -1), 1)
        return acos(cosine) * 180 / Double.pi
    }

    /// Same vector metric as the web pose pipeline:
    /// 0 = straight up, positive = forward lean from vertical.
    static func releaseAngle(elbow: CGPoint?, wrist: CGPoint?) -> Double? {
        guard let elbow, let wrist else { return nil }
        let dx = Double(wrist.x - elbow.x)
        let dy = Double(elbow.y - wrist.y)
        return (atan2(dx, dy) * 180 / Double.pi).rounded()
    }

    /// Same display metric as the web pose pipeline: forearm elevation from
    /// horizontal, normalized to 0...180 and stored as `wristAngle`.
    static func wristAngle(elbow: CGPoint?, wrist: CGPoint?) -> Double? {
        guard let elbow, let wrist else { return nil }
        let dx = Double(wrist.x - elbow.x)
        let dy = Double(wrist.y - elbow.y)
        var armAngle = (atan2(-dy, dx) * 180 / Double.pi).rounded()
        if armAngle < 0 { armAngle += 180 }
        return armAngle
    }

    private static func frameRecord(index: Int, timestamp: Double, pose: DetectedPose) -> VideoPoseFrameRecord {
        let j = pose.joints
        let side = shootingSide(in: pose)
        let shoulder = side == .right ? j[.rightShoulder] : j[.leftShoulder]
        let elbow = side == .right ? j[.rightElbow] : j[.leftElbow]
        let wrist = side == .right ? j[.rightWrist] : j[.leftWrist]
        let hip = side == .right ? j[.rightHip] : j[.leftHip]
        let knee = side == .right ? j[.rightKnee] : j[.leftKnee]
        let ankle = side == .right ? j[.rightAnkle] : j[.leftAnkle]

        var keypoints: [String: VideoPosePoint] = [:]
        for (name, point) in j {
            keypoints[name.rawValue.rawValue] = VideoPosePoint(x: point.x, y: point.y)
        }

        return VideoPoseFrameRecord(
            frameIndex: index,
            timestampSeconds: timestamp,
            confidence: Double(pose.confidence),
            keypoints: keypoints,
            elbowAngle: angle(shoulder, elbow, wrist),
            kneeAngle: angle(hip, knee, ankle),
            wristAngle: wristAngle(elbow: elbow, wrist: wrist),
            shoulderAngle: angle(hip, shoulder, elbow),
            hipAngle: angle(shoulder, hip, knee),
            releaseAngle: releaseAngle(elbow: elbow, wrist: wrist))
    }

    private enum Side { case left, right }

    private static func shootingSide(in pose: DetectedPose) -> Side {
        let left = pose.joints[.leftWrist]
        let right = pose.joints[.rightWrist]
        switch (left, right) {
        case let (l?, r?):
            return r.y <= l.y ? .right : .left
        case (nil, _?):
            return .right
        default:
            return .left
        }
    }

    private static func releaseFrame(in frames: [VideoPoseFrameRecord]) -> VideoPoseFrameRecord? {
        frames.min { left, right in
            let leftWristY = wristY(in: left) ?? 1
            let rightWristY = wristY(in: right) ?? 1
            return leftWristY < rightWristY
        }
    }

    private static func wristY(in frame: VideoPoseFrameRecord) -> Double? {
        let left = frame.keypoints[VNHumanBodyPoseObservation.JointName.leftWrist.rawValue.rawValue]?.y
        let right = frame.keypoints[VNHumanBodyPoseObservation.JointName.rightWrist.rawValue.rawValue]?.y
        switch (left, right) {
        case let (l?, r?): return min(l, r)
        case let (l?, nil): return l
        case let (nil, r?): return r
        default: return nil
        }
    }

    private static func summary(from frames: [VideoPoseFrameRecord], sampledCount: Int) -> VideoPoseAnalysisSummary {
        let release = releaseFrame(in: frames)
        let kneeMin = frames.compactMap(\.kneeAngle).min()
        let averageConfidence = frames.isEmpty
            ? nil
            : frames.map(\.confidence).reduce(0, +) / Double(frames.count)
        let releaseScore = score(value: release?.elbowAngle, idealMin: 150, idealMax: 180)
        let wristScore = score(value: release?.wristAngle, idealMin: 50, idealMax: 100)
        let verticalReleaseScore = score(value: release?.releaseAngle, idealMin: -5, idealMax: 5)
        let formScore = average([
            releaseScore,
            wristScore,
            verticalReleaseScore,
            score(value: kneeMin, idealMin: 70, idealMax: 120),
        ])
        let consistencyScore = averageConfidence.map { min(max($0 * 100, 0), 100) }
        let overallScore = average([formScore, consistencyScore])

        return VideoPoseAnalysisSummary(
            source: "ios-native-vision-video",
            frameCount: sampledCount,
            detectedFrameCount: frames.count,
            releaseFrameIndex: release?.frameIndex,
            releaseTimestampSeconds: release?.timestampSeconds,
            releaseElbowAngle: release?.elbowAngle,
            releaseKneeAngle: release?.kneeAngle,
            releaseWristAngle: release?.wristAngle,
            releaseShoulderAngle: release?.shoulderAngle,
            releaseHipAngle: release?.hipAngle,
            releaseAngle: release?.releaseAngle,
            kneeAngleMin: kneeMin,
            averageConfidence: averageConfidence,
            overallScore: overallScore,
            formScore: formScore,
            releaseScore: releaseScore,
            consistencyScore: consistencyScore)
    }

    private static func score(value: Double?, idealMin: Double, idealMax: Double) -> Double? {
        guard let value else { return nil }
        if value >= idealMin && value <= idealMax { return 100 }
        let miss = value < idealMin ? idealMin - value : value - idealMax
        return min(max(100 - miss * 2, 0), 100)
    }

    private static func average(_ values: [Double?]) -> Double? {
        let available = values.compactMap { $0 }
        guard !available.isEmpty else { return nil }
        return available.reduce(0, +) / Double(available.count)
    }
}
