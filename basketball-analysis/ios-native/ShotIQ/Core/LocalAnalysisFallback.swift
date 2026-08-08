import Foundation

enum ShotIQLocalAnalysisFactory {
    static func uiTestWeakAnalysis() -> ShotIQAnalysisResultDTO {
        ShotIQAnalysisResultDTO(
            id: "ios-ui-test-weak-analysis",
            clientSessionId: "ios-ui-test-weak",
            captureSessionId: nil,
            recordedAt: ISO8601DateFormatter().string(from: Date()),
            source: "ios-native-ui-test-weak-analysis",
            media: AnalysisMediaDTO(type: "image",
                                    imageUrl: nil,
                                    annotatedImageUrl: nil,
                                    displayImageUrl: nil,
                                    videoUrl: nil,
                                    localImageUrl: nil,
                                    localVideoUrl: nil),
            pose: AnalysisPoseDTO(pose: .uiTestSample),
            scores: AnalysisScoresDTO(
                overall: metric(72, unit: "score"),
                form: metric(82, unit: "score"),
                balance: metric(83, unit: "score"),
                release: metric(68, unit: "score"),
                consistency: metric(83, unit: "score")),
            angles: AnalysisAnglesDTO(
                elbow: metric(118, unit: "deg"),
                knee: metric(92, unit: "deg"),
                wrist: metric(72, unit: "deg"),
                shoulder: metric(nil, unit: "deg"),
                hip: metric(nil, unit: "deg"),
                release: metric(14, unit: "deg"),
                kneeMin: metric(88, unit: "deg")),
            measurements: AnalysisMeasurementsDTO(
                releaseHeightInches: metric(84, unit: "in"),
                releaseDistanceInches: metric(nil, unit: "in"),
                verticalJumpInches: metric(nil, unit: "in"),
                centerlineDeviationDeg: metric(2, unit: "deg")),
            phase: AnalysisTextMetricDTO(value: "release", unit: nil, source: "measured"),
            provenance: AnalysisProvenanceDTO(
                measured: ["pose.body", "scores.form", "scores.release", "scores.consistency",
                           "angles.elbow", "angles.wrist", "angles.release",
                           "measurements.centerlineDeviationDeg"],
                missing: ["angles.shoulder", "angles.hip", "measurements.releaseDistanceInches"],
                estimated: [],
                demo: []))
    }

    static func photo(localImageURL: URL?, detectedPose: DetectedPose?) -> ShotIQAnalysisResultDTO {
        let hasPose = detectedPose != nil
        let measured = hasPose ? ["pose.body"] : []
        let missing = hasPose
            ? ["scores.form", "angles.release", "angles.elbow", "angles.wrist", "measurements.releaseHeightInches"]
            : ["pose.body", "scores.form", "angles.release", "angles.elbow", "angles.wrist", "measurements.releaseHeightInches"]

        return ShotIQAnalysisResultDTO(
            id: "ios-local-photo-\(UUID().uuidString)",
            clientSessionId: "ios-local-\(UUID().uuidString)",
            captureSessionId: nil,
            recordedAt: ISO8601DateFormatter().string(from: Date()),
            source: "ios-native-local-photo-preview",
            media: AnalysisMediaDTO(type: "image",
                                    imageUrl: nil,
                                    annotatedImageUrl: nil,
                                    displayImageUrl: nil,
                                    videoUrl: nil,
                                    localImageUrl: localImageURL?.absoluteString,
                                    localVideoUrl: nil),
            pose: detectedPose.map(AnalysisPoseDTO.init),
            scores: missingScores(),
            angles: missingAngles(),
            measurements: missingMeasurements(),
            phase: AnalysisTextMetricDTO(value: hasPose ? "pose-detected" : nil,
                                         unit: nil,
                                         source: hasPose ? "measured" : "missing"),
            provenance: AnalysisProvenanceDTO(measured: measured,
                                              missing: missing,
                                              estimated: [],
                                              demo: []))
    }

    static func video(job: VideoAnalysisJob, poseAnalysis: VideoPoseAnalysis?) -> ShotIQAnalysisResultDTO {
        let summary = poseAnalysis?.summary
        let hasFrames = (poseAnalysis?.frames.isEmpty == false)
        var measured: [String] = []
        var missing: [String] = []

        func track(_ key: String, _ value: Double?) {
            if value == nil { missing.append(key) } else { measured.append(key) }
        }
        track("scores.overall", summary?.overallScore)
        track("scores.form", summary?.formScore)
        track("scores.release", summary?.releaseScore)
        track("scores.consistency", summary?.consistencyScore)
        track("angles.elbow", summary?.releaseElbowAngle)
        track("angles.knee", summary?.releaseKneeAngle)
        track("angles.wrist", summary?.releaseWristAngle)
        track("angles.release", summary?.releaseAngle)
        if !hasFrames { missing.append("pose.frames") } else { measured.append("pose.frames") }

        return ShotIQAnalysisResultDTO(
            id: "ios-local-video-\(UUID().uuidString)",
            clientSessionId: job.clientSessionId,
            captureSessionId: nil,
            recordedAt: ISO8601DateFormatter().string(from: Date()),
            source: "ios-native-local-video-preview",
            media: AnalysisMediaDTO(type: "video",
                                    imageUrl: nil,
                                    annotatedImageUrl: nil,
                                    displayImageUrl: nil,
                                    videoUrl: nil,
                                    localImageUrl: nil,
                                    localVideoUrl: job.clip.url.absoluteString),
            pose: nil,
            scores: AnalysisScoresDTO(
                overall: metric(summary?.overallScore, unit: "score"),
                form: metric(summary?.formScore, unit: "score"),
                balance: metric(nil, unit: "score"),
                release: metric(summary?.releaseScore, unit: "score"),
                consistency: metric(summary?.consistencyScore, unit: "score")),
            angles: AnalysisAnglesDTO(
                elbow: metric(summary?.releaseElbowAngle, unit: "deg"),
                knee: metric(summary?.releaseKneeAngle, unit: "deg"),
                wrist: metric(summary?.releaseWristAngle, unit: "deg"),
                shoulder: metric(summary?.releaseShoulderAngle, unit: "deg"),
                hip: metric(summary?.releaseHipAngle, unit: "deg"),
                release: metric(summary?.releaseAngle, unit: "deg"),
                kneeMin: metric(summary?.kneeAngleMin, unit: "deg")),
            measurements: missingMeasurements(),
            phase: AnalysisTextMetricDTO(value: summary?.releaseFrameIndex == nil ? nil : "release",
                                         unit: nil,
                                         source: summary?.releaseFrameIndex == nil ? "missing" : "measured"),
            provenance: AnalysisProvenanceDTO(measured: measured,
                                              missing: missing,
                                              estimated: [],
                                              demo: []))
    }

    private static func metric(_ value: Double?, unit: String?) -> AnalysisMetricDTO {
        AnalysisMetricDTO(value: value, unit: unit, source: value == nil ? "missing" : "measured")
    }

    private static func missingScores() -> AnalysisScoresDTO {
        AnalysisScoresDTO(overall: metric(nil, unit: "score"),
                          form: metric(nil, unit: "score"),
                          balance: metric(nil, unit: "score"),
                          release: metric(nil, unit: "score"),
                          consistency: metric(nil, unit: "score"))
    }

    private static func missingAngles() -> AnalysisAnglesDTO {
        AnalysisAnglesDTO(elbow: metric(nil, unit: "deg"),
                          knee: metric(nil, unit: "deg"),
                          wrist: metric(nil, unit: "deg"),
                          shoulder: metric(nil, unit: "deg"),
                          hip: metric(nil, unit: "deg"),
                          release: metric(nil, unit: "deg"),
                          kneeMin: metric(nil, unit: "deg"))
    }

    private static func missingMeasurements() -> AnalysisMeasurementsDTO {
        AnalysisMeasurementsDTO(releaseHeightInches: metric(nil, unit: "in"),
                                releaseDistanceInches: metric(nil, unit: "in"),
                                verticalJumpInches: metric(nil, unit: "in"),
                                centerlineDeviationDeg: metric(nil, unit: "deg"))
    }
}
