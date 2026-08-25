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
    var phase: String? = nil
    var confidence: Double
    var keypoints: [String: VideoPosePoint]
    var sourceWidth: Double? = nil
    var sourceHeight: Double? = nil
    var elbowAngle: Double?
    var kneeAngle: Double?
    var wristAngle: Double?
    var shoulderAngle: Double?
    var hipAngle: Double?
    var releaseAngle: Double?
}

extension VideoPoseFrameRecord {
    var detectedPose: DetectedPose? {
        var joints: [DetectedPose.Joint: CGPoint] = [:]
        for (rawName, point) in keypoints {
            let key = VNRecognizedPointKey(rawValue: rawName)
            let joint = VNHumanBodyPoseObservation.JointName(rawValue: key)
            joints[joint] = CGPoint(x: point.x, y: point.y)
        }
        let pose = DetectedPose(joints: joints, confidence: Float(confidence))
        return pose.isUsable ? pose : nil
    }

    var phaseLabel: String {
        phase?.uppercased().replacingOccurrences(of: "_", with: "-") ?? "RELEASE"
    }
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
    var releaseHeightInches: Double?
    var centerlineDeviationDeg: Double?
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
    // Match the old ShotIQ live/video feel more closely: the overlay needs
    // enough temporal density to follow an arm through the release, not just
    // land on a few key poses.
    static let maxSampledFrames = 300
    static let targetFPS = 30.0
    static let videoJointConfidence: Float = 0.16

    static func analyze(job: VideoAnalysisJob) async -> VideoPoseAnalysis {
        let sampleTimes = sampleTimes(start: job.trimStartSeconds,
                                      end: job.trimEndSeconds,
                                      maxCount: maxSampledFrames)
        let asset = AVURLAsset(url: job.clip.url)
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: 720, height: 720)
        generator.requestedTimeToleranceBefore = .zero
        generator.requestedTimeToleranceAfter = .zero

        var frames: [VideoPoseFrameRecord] = []
        var preferredCenter: CGPoint?
        for (index, seconds) in sampleTimes.enumerated() {
            let time = CMTime(seconds: seconds, preferredTimescale: 600)
            var actualTime = CMTime.invalid
            guard let cgImage = try? generator.copyCGImage(at: time, actualTime: &actualTime) else {
                continue
            }
            let detectedSeconds = actualTime.seconds.isFinite ? actualTime.seconds : seconds
            let image = UIImage(cgImage: cgImage)
            guard let pose = await ShotIQPose.detect(in: image,
                                                     minimumConfidence: videoJointConfidence,
                                                     preferredCenter: preferredCenter) else {
                continue
            }
            preferredCenter = pose.trackingCenter ?? preferredCenter
            frames.append(frameRecord(index: index,
                                      timestamp: detectedSeconds,
                                      pose: pose,
                                      sourceSize: image.size))
        }
        frames = temporallyStabilizedFrames(frames, sampleTimes: sampleTimes)
        frames = framesWithPhases(frames)

        return VideoPoseAnalysis(summary: summary(from: frames, sampledCount: sampleTimes.count),
                                 frames: frames)
    }

    static func sampleTimes(start: Double, end: Double, maxCount: Int) -> [Double] {
        let lower = max(0, start)
        let upper = max(lower, end)
        guard upper > lower, maxCount > 0 else { return [] }
        let duration = upper - lower
        let rawCount = max(1, Int((duration * targetFPS).rounded(.down)))
        let count = min(maxCount, max(3, rawCount))
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

    static func frameRecord(index: Int,
                            timestamp: Double,
                            pose: DetectedPose,
                            sourceSize: CGSize? = nil) -> VideoPoseFrameRecord {
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
            phase: nil,
            confidence: Double(pose.confidence),
            keypoints: keypoints,
            sourceWidth: sourceSize.map { Double($0.width) },
            sourceHeight: sourceSize.map { Double($0.height) },
            elbowAngle: angle(shoulder, elbow, wrist),
            kneeAngle: angle(hip, knee, ankle),
            wristAngle: wristAngle(elbow: elbow, wrist: wrist),
            shoulderAngle: angle(hip, shoulder, elbow),
            hipAngle: angle(shoulder, hip, knee),
            releaseAngle: releaseAngle(elbow: elbow, wrist: wrist))
    }

    private static func temporallyStabilizedFrames(_ records: [VideoPoseFrameRecord],
                                                   sampleTimes: [Double]) -> [VideoPoseFrameRecord] {
        let sorted = records.sorted { $0.timestampSeconds < $1.timestampSeconds }
        guard sorted.count > 1 else { return sorted }

        let densified = densifiedFrames(sorted, sampleTimes: sampleTimes)
        let completed = framesWithShortJointGapsFilled(densified)
        return lowLatencySmoothedFrames(completed)
    }

    /// Vision sometimes misses a close-up bend/release frame even though the
    /// frames immediately before and after are locked. The player sees that as
    /// lag because playback holds the previous pose. Bridge only short holes
    /// between real detections so the overlay keeps moving with the video.
    private static func densifiedFrames(_ records: [VideoPoseFrameRecord],
                                        sampleTimes: [Double]) -> [VideoPoseFrameRecord] {
        guard !records.isEmpty else { return [] }
        let byIndex = Dictionary(uniqueKeysWithValues: records.map { ($0.frameIndex, $0) })
        let maxBridgeSeconds = 0.42
        var output: [VideoPoseFrameRecord] = []

        for (index, requestedSeconds) in sampleTimes.enumerated() {
            if let record = byIndex[index] {
                output.append(record)
                continue
            }

            guard let before = records.last(where: { $0.frameIndex < index }),
                  let after = records.first(where: { $0.frameIndex > index }),
                  after.timestampSeconds > before.timestampSeconds,
                  after.timestampSeconds - before.timestampSeconds <= maxBridgeSeconds else {
                continue
            }

            let timestamp = min(max(requestedSeconds, before.timestampSeconds), after.timestampSeconds)
            let fraction = (timestamp - before.timestampSeconds) / (after.timestampSeconds - before.timestampSeconds)
            if let bridged = interpolatedFrame(index: index,
                                               timestamp: timestamp,
                                               before: before,
                                               after: after,
                                               fraction: fraction,
                                               confidenceScale: 0.92) {
                output.append(bridged)
            }
        }

        return output.sorted { $0.timestampSeconds < $1.timestampSeconds }
    }

    /// Fill missing elbow/wrist/knee points inside otherwise-good frames. This
    /// handles the close-camera case where Vision keeps the torso but drops an
    /// arm for a moment as the shooter bends or extends.
    private static func framesWithShortJointGapsFilled(_ records: [VideoPoseFrameRecord]) -> [VideoPoseFrameRecord] {
        guard records.count > 1 else { return records }
        let maxJointBridgeSeconds = 0.36
        let maxForwardPredictionSeconds = 0.52
        let allKeys = Set(records.flatMap { $0.keypoints.keys })

        return records.enumerated().compactMap { position, record in
            var keypoints = record.keypoints
            for key in allKeys where keypoints[key] == nil {
                let previous = records[..<position].last { $0.keypoints[key] != nil }
                let next = records[(position + 1)...].first { $0.keypoints[key] != nil }
                if let previous,
                   let next,
                   let previousPoint = previous.keypoints[key],
                   let nextPoint = next.keypoints[key],
                   next.timestampSeconds > previous.timestampSeconds,
                   next.timestampSeconds - previous.timestampSeconds <= maxJointBridgeSeconds {
                    let fraction = (record.timestampSeconds - previous.timestampSeconds)
                        / (next.timestampSeconds - previous.timestampSeconds)
                    keypoints[key] = interpolate(previousPoint, nextPoint, fraction: fraction)
                    continue
                }

                if let predicted = forwardPredictedPoint(for: key,
                                                         at: record.timestampSeconds,
                                                         beforePosition: position,
                                                         records: records,
                                                         maxAgeSeconds: maxForwardPredictionSeconds) {
                    keypoints[key] = predicted
                }
            }
            return replacingKeypoints(record, with: keypoints, confidenceScale: keypoints.count > record.keypoints.count ? 0.96 : 1)
        }
    }

    /// Smooth only tiny detection jitter. Large changes, like the shooting arm
    /// extending, pass through almost raw so smoothing does not become visible
    /// lag.
    private static func lowLatencySmoothedFrames(_ records: [VideoPoseFrameRecord]) -> [VideoPoseFrameRecord] {
        guard records.count > 1 else { return records }
        var output: [VideoPoseFrameRecord] = []
        var previousKeypoints: [String: VideoPosePoint] = [:]

        for record in records.sorted(by: { $0.timestampSeconds < $1.timestampSeconds }) {
            var keypoints = record.keypoints
            for (key, point) in record.keypoints {
                guard let previous = previousKeypoints[key] else { continue }
                let distance = hypot(point.x - previous.x, point.y - previous.y)
                guard distance < 0.08 else { continue }
                keypoints[key] = blend(previous, point, currentWeight: 0.82)
            }
            if let updated = replacingKeypoints(record, with: keypoints, confidenceScale: 1) {
                output.append(updated)
                previousKeypoints = updated.keypoints
            } else {
                output.append(record)
                previousKeypoints = record.keypoints
            }
        }

        return output
    }

    private static func interpolatedFrame(index: Int,
                                          timestamp: Double,
                                          before: VideoPoseFrameRecord,
                                          after: VideoPoseFrameRecord,
                                          fraction: Double,
                                          confidenceScale: Double) -> VideoPoseFrameRecord? {
        let keys = Set(before.keypoints.keys).intersection(after.keypoints.keys)
        var keypoints: [String: VideoPosePoint] = [:]
        for key in keys {
            guard let a = before.keypoints[key],
                  let b = after.keypoints[key] else { continue }
            keypoints[key] = interpolate(a, b, fraction: fraction)
        }
        let confidence = ((before.confidence + after.confidence) / 2) * confidenceScale
        return frameRecord(index: index,
                           timestamp: timestamp,
                           keypoints: keypoints,
                           confidence: confidence,
                           sourceWidth: before.sourceWidth ?? after.sourceWidth,
                           sourceHeight: before.sourceHeight ?? after.sourceHeight)
    }

    private static func replacingKeypoints(_ record: VideoPoseFrameRecord,
                                           with keypoints: [String: VideoPosePoint],
                                           confidenceScale: Double) -> VideoPoseFrameRecord? {
        frameRecord(index: record.frameIndex,
                    timestamp: record.timestampSeconds,
                    keypoints: keypoints,
                    confidence: record.confidence * confidenceScale,
                    sourceWidth: record.sourceWidth,
                    sourceHeight: record.sourceHeight)
    }

    private static func frameRecord(index: Int,
                                    timestamp: Double,
                                    keypoints: [String: VideoPosePoint],
                                    confidence: Double,
                                    sourceWidth: Double?,
                                    sourceHeight: Double?) -> VideoPoseFrameRecord? {
        guard let pose = detectedPose(keypoints: keypoints, confidence: confidence) else { return nil }
        let sourceSize: CGSize? = {
            guard let sourceWidth,
                  let sourceHeight,
                  sourceWidth > 0,
                  sourceHeight > 0 else { return nil }
            return CGSize(width: sourceWidth, height: sourceHeight)
        }()
        return frameRecord(index: index, timestamp: timestamp, pose: pose, sourceSize: sourceSize)
    }

    private static func detectedPose(keypoints: [String: VideoPosePoint], confidence: Double) -> DetectedPose? {
        var joints: [DetectedPose.Joint: CGPoint] = [:]
        for (rawName, point) in keypoints {
            let key = VNRecognizedPointKey(rawValue: rawName)
            let joint = VNHumanBodyPoseObservation.JointName(rawValue: key)
            joints[joint] = CGPoint(x: point.x, y: point.y)
        }
        let pose = DetectedPose(joints: joints, confidence: Float(confidence))
        return pose.isUsable ? pose : nil
    }

    private static func forwardPredictedPoint(for key: String,
                                              at timestamp: Double,
                                              beforePosition: Int,
                                              records: [VideoPoseFrameRecord],
                                              maxAgeSeconds: Double) -> VideoPosePoint? {
        guard let latest = records[..<beforePosition].last(where: { $0.keypoints[key] != nil }),
              let latestPoint = latest.keypoints[key],
              timestamp >= latest.timestampSeconds,
              timestamp - latest.timestampSeconds <= maxAgeSeconds else {
            return nil
        }

        guard let previous = records[..<beforePosition].last(where: {
            $0.frameIndex != latest.frameIndex && $0.keypoints[key] != nil
        }),
              let previousPoint = previous.keypoints[key],
              latest.timestampSeconds > previous.timestampSeconds else {
            return latestPoint
        }

        let dt = latest.timestampSeconds - previous.timestampSeconds
        let lead = timestamp - latest.timestampSeconds
        guard dt > 0, lead > 0 else { return latestPoint }

        let vx = (latestPoint.x - previousPoint.x) / dt
        let vy = (latestPoint.y - previousPoint.y) / dt
        let maxStep = 0.09
        let dx = min(max(vx * lead, -maxStep), maxStep)
        let dy = min(max(vy * lead, -maxStep), maxStep)
        return VideoPosePoint(x: min(max(latestPoint.x + dx, 0), 1),
                              y: min(max(latestPoint.y + dy, 0), 1))
    }

    private static func interpolate(_ a: VideoPosePoint,
                                    _ b: VideoPosePoint,
                                    fraction: Double) -> VideoPosePoint {
        let t = min(max(fraction, 0), 1)
        return VideoPosePoint(x: a.x + (b.x - a.x) * t,
                              y: a.y + (b.y - a.y) * t)
    }

    private static func blend(_ previous: VideoPosePoint,
                              _ current: VideoPosePoint,
                              currentWeight: Double) -> VideoPosePoint {
        let weight = min(max(currentWeight, 0), 1)
        return VideoPosePoint(x: previous.x * (1 - weight) + current.x * weight,
                              y: previous.y * (1 - weight) + current.y * weight)
    }

    private static func framesWithPhases(_ records: [VideoPoseFrameRecord]) -> [VideoPoseFrameRecord] {
        let sorted = records.sorted { $0.timestampSeconds < $1.timestampSeconds }
        guard !sorted.isEmpty else { return records }
        let release = releaseFrame(in: sorted)
        let releasePosition = release.flatMap { target in
            sorted.firstIndex { $0.frameIndex == target.frameIndex }
        } ?? Int((Double(sorted.count - 1) * 0.68).rounded())

        return sorted.enumerated().map { position, original in
            var frame = original
            frame.phase = phaseLabel(position: position,
                                     count: sorted.count,
                                     releasePosition: releasePosition)
            return frame
        }
    }

    private static func phaseLabel(position: Int, count: Int, releasePosition: Int) -> String {
        guard count > 1 else { return "RELEASE" }
        let release = min(max(releasePosition, 0), count - 1)
        if position == 0 { return "SETUP" }
        if position >= max(release - 1, 0) && position <= min(release + 1, count - 1) {
            return "RELEASE"
        }
        if position > release { return "FOLLOW-THROUGH" }

        let loadCutoff = max(1, Int((Double(max(release, 1)) * 0.45).rounded()))
        return position <= loadCutoff ? "LOAD" : "RISE"
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
        let releaseHeight = release.flatMap(releaseHeightInches)
        let centerline = release.flatMap(centerlineDeviationDeg)
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
            releaseHeightInches: releaseHeight,
            centerlineDeviationDeg: centerline,
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

    private static func releaseHeightInches(frame: VideoPoseFrameRecord) -> Double? {
        guard let pose = frame.detectedPose,
              let wrist = shootingWrist(in: pose),
              let body = bodyVerticalSpan(in: pose),
              body.height > 0.12 else { return nil }
        let normalizedHeight = (body.floorY - wrist.y) / body.height
        let estimatedStandingHeight = 75.0
        return min(max(Double(normalizedHeight) * estimatedStandingHeight, 48), 118)
    }

    private static func centerlineDeviationDeg(frame: VideoPoseFrameRecord) -> Double? {
        guard let pose = frame.detectedPose,
              let wrist = shootingWrist(in: pose),
              let hipCenter = midpoint(pose.joints[.leftHip], pose.joints[.rightHip])
                    ?? midpoint(pose.joints[.leftShoulder], pose.joints[.rightShoulder]) else { return nil }
        let dx = Double(wrist.x - hipCenter.x)
        let dy = max(abs(Double(hipCenter.y - wrist.y)), 0.04)
        return min(max(atan2(dx, dy) * 180 / Double.pi, -45), 45)
    }

    private static func bodyVerticalSpan(in pose: DetectedPose) -> (topY: CGFloat, floorY: CGFloat, height: CGFloat)? {
        let headCandidates = [pose.joints[.nose], pose.joints[.leftEye], pose.joints[.rightEye], pose.joints[.neck]]
            .compactMap { $0?.y }
        let footCandidates = [pose.joints[.leftAnkle], pose.joints[.rightAnkle], pose.joints[.leftKnee], pose.joints[.rightKnee]]
            .compactMap { $0?.y }
        guard let top = headCandidates.min(),
              let floor = footCandidates.max(),
              floor > top else { return nil }
        return (top, floor, floor - top)
    }

    private static func shootingWrist(in pose: DetectedPose) -> CGPoint? {
        let side = shootingSide(in: pose)
        return side == .right ? pose.joints[.rightWrist] ?? pose.joints[.leftWrist]
            : pose.joints[.leftWrist] ?? pose.joints[.rightWrist]
    }

    private static func midpoint(_ a: CGPoint?, _ b: CGPoint?) -> CGPoint? {
        guard let a, let b else { return a ?? b }
        return CGPoint(x: (a.x + b.x) / 2, y: (a.y + b.y) / 2)
    }

    private static func average(_ values: [Double?]) -> Double? {
        let available = values.compactMap { $0 }
        guard !available.isEmpty else { return nil }
        return available.reduce(0, +) / Double(available.count)
    }
}
