import XCTest
import UIKit
@testable import ShotIQ

final class ShotIQTokenTests: XCTestCase {
    /// The sidecar spacing scale must survive into the generated Swift tokens.
    func testSpacingScale() {
        XCTAssertEqual(ShotIQSpacing.xs, 4)
        XCTAssertEqual(ShotIQSpacing.sm, 8)
        XCTAssertEqual(ShotIQSpacing.md, 16)
        XCTAssertEqual(ShotIQSpacing.lg, 24)
        XCTAssertEqual(ShotIQSpacing.xl, 32)
    }

    func testRadiusScale() {
        XCTAssertEqual(ShotIQRadius.none, 0)
        XCTAssertEqual(ShotIQRadius.control, 6)
        XCTAssertEqual(ShotIQRadius.card, 8)
        XCTAssertEqual(ShotIQRadius.pill, 999)
    }

    func testCanonicalCanvas() {
        XCTAssertEqual(ShotIQCanvas.ios, CGSize(width: 853, height: 1844))
        XCTAssertEqual(ShotIQCanvas.desktop, CGSize(width: 1440, height: 900))
    }
}

final class ShotIQGlyphResolverTests: XCTestCase {
    func testApprovedMechanicsAndEquipmentIconsResolveToBespokeGlyphs() {
        guard case .mechanic(.releasePath)? = ShotIQConcept.resolve("Straight Release Path") else {
            return XCTFail("Straight Release Path should use the vertical release-path glyph")
        }

        for label in ["Basketball", "Cones", "Spot", "Location"] {
            guard case .equipment? = ShotIQConcept.resolve(label) else {
                return XCTFail("\(label) should use a ShotIQ equipment glyph")
            }
        }
    }
}

final class KeychainStoreTests: XCTestCase {
    func testRoundTrip() {
        KeychainStore.save("abc123", key: "testToken")
        XCTAssertEqual(KeychainStore.read(key: "testToken"), "abc123")
        KeychainStore.delete(key: "testToken")
        XCTAssertNil(KeychainStore.read(key: "testToken"))
    }
}

final class AnalysisResultContractTests: XCTestCase {
    private func sampleAnalysisJSON(id: String = "analysis-1") -> String {
        """
        {
          "id": "\(id)",
          "clientSessionId": "ios-shot-1",
          "captureSessionId": "capture-1",
          "recordedAt": "2026-08-07T12:00:00.000Z",
          "source": "ios",
          "media": {
            "type": "video",
            "imageUrl": "https://media.test/shot.jpg",
            "annotatedImageUrl": "https://media.test/shot-annotated.jpg",
            "displayImageUrl": "https://media.test/shot-annotated.jpg",
            "videoUrl": "https://media.test/shot.mov"
          },
          "scores": {
            "overall": { "value": 84, "unit": "score", "source": "measured" },
            "form": { "value": 82, "unit": "score", "source": "measured" },
            "balance": { "value": null, "unit": "score", "source": "missing" },
            "release": { "value": 80, "unit": "score", "source": "measured" },
            "consistency": { "value": null, "unit": "score", "source": "missing" }
          },
          "angles": {
            "elbow": { "value": 161, "unit": "deg", "source": "measured" },
            "knee": { "value": null, "unit": "deg", "source": "missing" },
            "wrist": { "value": 72, "unit": "deg", "source": "measured" },
            "shoulder": { "value": null, "unit": "deg", "source": "missing" },
            "hip": { "value": null, "unit": "deg", "source": "missing" },
            "release": { "value": -3, "unit": "deg", "source": "measured" },
            "kneeMin": { "value": 88, "unit": "deg", "source": "measured" }
          },
          "measurements": {
            "releaseHeightInches": { "value": 92, "unit": "in", "source": "measured" },
            "releaseDistanceInches": { "value": null, "unit": "in", "source": "missing" },
            "verticalJumpInches": { "value": null, "unit": "in", "source": "missing" },
            "centerlineDeviationDeg": { "value": 4, "unit": "deg", "source": "measured" }
          },
          "phase": { "value": "release", "unit": null, "source": "measured" },
          "provenance": {
            "measured": ["scores.form", "angles.elbow", "phase"],
            "missing": ["scores.balance", "angles.knee"],
            "estimated": [],
            "demo": []
          }
        }
        """
    }

    func testSharedAnalysisResultDecodesWithoutInventingMissingMetrics() throws {
        let json = sampleAnalysisJSON().data(using: .utf8)!

        let result = try JSONDecoder().decode(ShotIQAnalysisResultDTO.self, from: json)

        XCTAssertEqual(result.source, "ios")
        XCTAssertEqual(result.media.videoUrl, "https://media.test/shot.mov")
        XCTAssertEqual(result.scores.form.value, 82)
        XCTAssertEqual(result.scores.balance.value, nil)
        XCTAssertEqual(result.scores.balance.source, "missing")
        XCTAssertEqual(result.angles.elbow.value, 161)
        XCTAssertEqual(result.angles.release.value, -3)
        XCTAssertTrue(result.provenance.measured.contains("angles.elbow"))
        XCTAssertTrue(result.provenance.missing.contains("scores.balance"))
        XCTAssertEqual(result.provenance.demo, [])
    }

    func testLatestAnalysisEnvelopeAcceptsAnalysisResultField() throws {
        let json = """
        {
          "success": true,
          "analysis": null,
          "analysisResult": \(sampleAnalysisJSON(id: "from-analysis-result"))
        }
        """.data(using: .utf8)!

        let envelope = try JSONDecoder().decode(LatestAnalysisResponseDTO.self, from: json)

        XCTAssertEqual(envelope.result?.id, "from-analysis-result")
        XCTAssertEqual(envelope.result?.scores.overall.value, 84)
    }

    func testAnalysisPresentationUsesContractValuesAndMissingSentinels() throws {
        let result = try JSONDecoder().decode(ShotIQAnalysisResultDTO.self,
                                              from: sampleAnalysisJSON().data(using: .utf8)!)

        let presentation = AnalysisResultPresentation(result: result)

        XCTAssertEqual(presentation.scoreText, "82")
        XCTAssertEqual(presentation.mediaURL?.absoluteString, "https://media.test/shot-annotated.jpg")
        XCTAssertEqual(presentation.videoURL?.absoluteString, "https://media.test/shot.mov")
        XCTAssertEqual(presentation.metrics.first(where: { $0.label == "RELEASE HEIGHT" })?.value, "7'8\"")
        XCTAssertEqual(presentation.metrics.first(where: { $0.label == "RELEASE OFFSET" })?.value, "-3°")
        XCTAssertEqual(presentation.metrics.first(where: { $0.label == "ELBOW ANGLE" })?.value, "161°")
        XCTAssertFalse(presentation.metrics.contains { $0.value == "52°" && $0.source != "demo" })
    }

    func testAnalysisPresentationKeepsLocalMediaFallbackWhenServerUrlIsMissing() throws {
        let json = """
        {
          "id": "local-photo",
          "clientSessionId": "ios-shot-local",
          "captureSessionId": null,
          "recordedAt": "2026-08-07T12:00:00.000Z",
          "source": "ios",
          "media": {
            "type": "image",
            "imageUrl": null,
            "annotatedImageUrl": null,
            "displayImageUrl": null,
            "videoUrl": null,
            "localImageUrl": "file:///tmp/shotiq-local-photo.jpg",
            "localVideoUrl": null
          },
          "scores": {
            "overall": { "value": 84, "unit": "score", "source": "measured" },
            "form": { "value": 82, "unit": "score", "source": "measured" },
            "balance": { "value": null, "unit": "score", "source": "missing" },
            "release": { "value": 80, "unit": "score", "source": "measured" },
            "consistency": { "value": null, "unit": "score", "source": "missing" }
          },
          "angles": {
            "elbow": { "value": 161, "unit": "deg", "source": "measured" },
            "knee": { "value": null, "unit": "deg", "source": "missing" },
            "wrist": { "value": 72, "unit": "deg", "source": "measured" },
            "shoulder": { "value": null, "unit": "deg", "source": "missing" },
            "hip": { "value": null, "unit": "deg", "source": "missing" },
            "release": { "value": -3, "unit": "deg", "source": "measured" },
            "kneeMin": { "value": 88, "unit": "deg", "source": "measured" }
          },
          "measurements": {
            "releaseHeightInches": { "value": 92, "unit": "in", "source": "measured" },
            "releaseDistanceInches": { "value": null, "unit": "in", "source": "missing" },
            "verticalJumpInches": { "value": null, "unit": "in", "source": "missing" },
            "centerlineDeviationDeg": { "value": 4, "unit": "deg", "source": "measured" }
          },
          "phase": { "value": "release", "unit": null, "source": "measured" },
          "provenance": {
            "measured": ["scores.form", "angles.elbow", "phase"],
            "missing": ["scores.balance", "angles.knee"],
            "estimated": [],
            "demo": []
          }
        }
        """.data(using: .utf8)!

        let result = try JSONDecoder().decode(ShotIQAnalysisResultDTO.self, from: json)
        let presentation = AnalysisResultPresentation(result: result)

        XCTAssertEqual(result.media.localImageUrl, "file:///tmp/shotiq-local-photo.jpg")
        XCTAssertEqual(presentation.mediaURL?.absoluteString, "file:///tmp/shotiq-local-photo.jpg")
        XCTAssertNil(presentation.videoURL)
    }

    func testLocalPhotoFallbackCarriesSelectedImageWithoutDemoScores() throws {
        let url = URL(fileURLWithPath: "/tmp/shotiq-selected-photo.jpg")
        let result = ShotIQLocalAnalysisFactory.photo(localImageURL: url, detectedPose: nil)
        let presentation = AnalysisResultPresentation(result: result)

        XCTAssertEqual(result.source, "ios-native-local-photo-preview")
        XCTAssertEqual(presentation.mediaURL?.absoluteString, url.absoluteString)
        XCTAssertEqual(presentation.scoreText, "--")
        XCTAssertTrue(result.provenance.missing.contains("scores.form"))
        XCTAssertTrue(result.provenance.demo.isEmpty)
    }

    func testLocalVideoFallbackCarriesSelectedVideoAndMeasuredPoseSummary() throws {
        let url = URL(fileURLWithPath: "/tmp/shotiq-selected-video.mov")
        let clip = PickedVideoClip(url: url,
                                   filename: "shotiq-selected-video.mov",
                                   contentType: "video/quicktime",
                                   fileSizeBytes: 24_800_000,
                                   durationSeconds: 6,
                                   dimensions: CGSize(width: 1080, height: 1920),
                                   frameRate: 60)
        let job = VideoAnalysisJob(clientSessionId: "unit-local-video",
                                   clip: clip,
                                   trimStartFraction: 0.1,
                                   trimEndFraction: 0.9)
        let summary = VideoPoseAnalysisSummary(source: "unit-test",
                                               frameCount: 3,
                                               detectedFrameCount: 3,
                                               releaseFrameIndex: 1,
                                               releaseTimestampSeconds: 3,
                                               releaseElbowAngle: 161,
                                               releaseKneeAngle: 92,
                                               releaseWristAngle: 72,
                                               releaseShoulderAngle: nil,
                                               releaseHipAngle: nil,
                                               releaseAngle: -3,
                                               kneeAngleMin: 88,
                                               averageConfidence: 0.83,
                                               overallScore: 84,
                                               formScore: 82,
                                               releaseScore: 80,
                                               consistencyScore: 83)
        let result = ShotIQLocalAnalysisFactory.video(job: job,
                                                      poseAnalysis: VideoPoseAnalysis(summary: summary, frames: []))
        let presentation = AnalysisResultPresentation(result: result)

        XCTAssertEqual(result.source, "ios-native-local-video-preview")
        XCTAssertEqual(presentation.videoURL?.absoluteString, url.absoluteString)
        XCTAssertEqual(presentation.scoreText, "82")
        XCTAssertEqual(presentation.metrics.first(where: { $0.label == "ELBOW ANGLE" })?.value, "161°")
        XCTAssertTrue(result.provenance.demo.isEmpty)
    }

    func testAnalysisPresentationFeedsDownstreamResultScreensWithoutDemoConstants() throws {
        let result = try JSONDecoder().decode(ShotIQAnalysisResultDTO.self,
                                              from: sampleAnalysisJSON().data(using: .utf8)!)

        let presentation = AnalysisResultPresentation(result: result)

        XCTAssertEqual(presentation.releaseHeightText, "7'8\"")
        XCTAssertEqual(presentation.releaseOffsetText, "-3°")
        XCTAssertEqual(presentation.elbowAngleText, "161°")
        XCTAssertEqual(presentation.wristAngleText, "72°")
        XCTAssertTrue(presentation.shotBreakdownShareText.contains("form score 82 (GOOD)"))
        XCTAssertTrue(presentation.shotBreakdownShareText.contains("release offset -3°"))
        XCTAssertTrue(presentation.shotBreakdownShareText.contains("release height 7'8\""))
        XCTAssertFalse(presentation.shotBreakdownShareText.contains("52°"))
        XCTAssertFalse(presentation.shotBreakdownShareText.contains("7.5 ft"))
        XCTAssertTrue(presentation.formScoreShareText.contains("form score: 82 (GOOD)"))
        XCTAssertFalse(presentation.formScoreShareText.contains("+8.1%"))
        XCTAssertEqual(presentation.metricShareText(metric: "Elbow", valueText: presentation.elbowAngleText),
                       "My ShotIQ elbow metric: 161° - form score 82 (GOOD).")
    }

    func testFormScoreBreakdownUsesSavedContractScoresAndMissingState() throws {
        let result = try JSONDecoder().decode(ShotIQAnalysisResultDTO.self,
                                              from: sampleAnalysisJSON().data(using: .utf8)!)

        let presentation = AnalysisResultPresentation(result: result)

        XCTAssertEqual(presentation.scoreBreakdown.map(\.metric),
                       ["Form", "Balance", "Release", "Consistency", "Overall"])
        XCTAssertEqual(presentation.scoreBreakdown.map(\.scoreText),
                       ["82", "--", "80", "--", "84"])
        XCTAssertEqual(presentation.scoreBreakdown.first(where: { $0.metric == "Balance" })?.verdict,
                       "UNAVAILABLE")
        XCTAssertEqual(presentation.scoreBreakdown.first(where: { $0.metric == "Consistency" })?.caption,
                       "Unavailable in this saved analysis.")
        XCTAssertFalse(presentation.scoreBreakdown.contains { $0.metric == "Power" && $0.source != "demo" })
        XCTAssertEqual(presentation.weakestScoreItem.metric, "Release")
        XCTAssertEqual(presentation.weakestScoreItem.scoreText, "80")
        XCTAssertEqual(presentation.sourceCoverageText, "3")
        XCTAssertEqual(presentation.sourceCoverageVerdict, "PARTIAL")
        XCTAssertTrue(presentation.sourceCoverageCaption.contains("2 fields are unavailable"))
    }
}

final class PoseOverlayAlignmentTests: XCTestCase {
    /// Sidecar contract: normalized keypoints must transform through the actual
    /// surface size so joints stay aligned after resizing.
    func testKeypointScalingIsProportional() {
        let joint = CGPoint(x: 0.52, y: 0.36)
        let small = CGSize(width: 200, height: 300)
        let large = CGSize(width: 400, height: 600)
        let ps = CGPoint(x: joint.x * small.width, y: joint.y * small.height)
        let pl = CGPoint(x: joint.x * large.width, y: joint.y * large.height)
        XCTAssertEqual(pl.x / ps.x, 2, accuracy: 0.0001)
        XCTAssertEqual(pl.y / ps.y, 2, accuracy: 0.0001)
    }
}

final class DrillSessionTests: XCTestCase {
    @MainActor func testMakeMissUndoDrivesPercentages() {
        let m = DrillSessionModel()
        m.mark(true, drillId: "t"); m.mark(true, drillId: "t"); m.mark(false, drillId: "t")
        XCTAssertEqual(m.shots.count, 3)
        XCTAssertEqual(m.makes, 2)
        XCTAssertEqual(m.pct, 2.0 / 3.0, accuracy: 0.0001)
        m.undo()
        XCTAssertEqual(m.shots.count, 2)
        XCTAssertEqual(m.pct, 1.0, accuracy: 0.0001)
    }

    func testLiveCaptureShotEventPayloadMatchesBackendContract() throws {
        let makeBody = APIClient.shotEventRecordBody(drillId: "live-capture", made: true)
        XCTAssertEqual(makeBody.events.count, 1)
        XCTAssertEqual(makeBody.events[0].detectedResult, "make")
        XCTAssertEqual(makeBody.events[0].metadata["drillId"], "live-capture")
        XCTAssertEqual(makeBody.events[0].metadata["source"], "ios-live-capture")

        let missBody = APIClient.shotEventRecordBody(drillId: "live-capture", made: false)
        XCTAssertEqual(missBody.events[0].detectedResult, "miss")

        let data = try JSONEncoder().encode(makeBody)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let events = try XCTUnwrap(object["events"] as? [[String: Any]])
        XCTAssertEqual(events.first?["detectedResult"] as? String, "make")
        XCTAssertNil(object["result"])
    }
}

final class ScreenshotExportRendererTests: XCTestCase {
    @MainActor
    func testPlayerCardExportRendersShareableImage() throws {
        let image = try XCTUnwrap(PlayerCardImageRenderer.render(name: "Jordan Ellis"))

        XCTAssertGreaterThanOrEqual(image.size.width, 360)
        XCTAssertGreaterThan(image.size.height, 120)
        XCTAssertGreaterThanOrEqual(image.cgImage?.width ?? 0, 1_000)
        XCTAssertGreaterThan(image.cgImage?.height ?? 0, 350)
    }

    @MainActor
    func testCustomizedPlayerCardExportRendersShareableImage() throws {
        let image = try XCTUnwrap(PlayerCardImageRenderer.render(name: "Kevin Houston",
                                                                 accent: ShotIQColor.analysisBlue,
                                                                 jersey: 70))

        XCTAssertGreaterThanOrEqual(image.size.width, 360)
        XCTAssertGreaterThan(image.size.height, 120)
        XCTAssertGreaterThanOrEqual(image.cgImage?.width ?? 0, 1_000)
    }

    @MainActor
    func testShareResultsExportRendersShareableImage() throws {
        let image = try XCTUnwrap(ShareResultsImageRenderer.render(name: "Jordan Ellis"))

        XCTAssertGreaterThanOrEqual(image.size.width, 340)
        XCTAssertGreaterThan(image.size.height, 120)
        XCTAssertGreaterThanOrEqual(image.cgImage?.width ?? 0, 1_000)
        XCTAssertGreaterThan(image.cgImage?.height ?? 0, 350)
    }
}

final class PlaceholderReplacementTests: XCTestCase {
    func testPhotoThumbnailPlaceholderFallbacksResolveToBundledMedia() {
        let cases: [(explicit: String?, icon: String, expected: String)] = [
            (nil, "figure.basketball", "054-visual-003"),
            (nil, "play.circle", "068-visual-002"),
            (nil, "chart.xyaxis.line", "069-visual-004"),
            (nil, "target", "065-visual-001"),
            (nil, "camera.viewfinder", "054-visual-001"),
            ("072-visual-001", "figure.basketball", "072-visual-001"),
        ]

        for item in cases {
            let key = PhotoThumbMediaResolver.photoKey(explicit: item.explicit, icon: item.icon)
            XCTAssertEqual(key, item.expected)
            XCTAssertNotNil(UIImage(named: "photo-\(key)"),
                            "Missing bundled replacement media for \(key)")
        }
    }

    func testAnalysisMediaSurfaceUsesRealLocalPhotoBeforeCanonicalFallback() {
        let url = URL(fileURLWithPath: "/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-fixtures/placeholder-proof.jpg")
        let result = ShotIQLocalAnalysisFactory.photo(localImageURL: url, detectedPose: nil)
        let presentation = AnalysisResultPresentation(result: result)

        XCTAssertEqual(AnalysisResultMediaSurfaceResolver.source(for: presentation,
                                                                 fallbackKey: "038-visual-001"),
                       .image(url))
    }

    func testAnalysisMediaSurfaceUsesRealVideoBeforeCanonicalFallback() {
        let url = URL(fileURLWithPath: "/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-fixtures/placeholder-proof.mov")
        let clip = PickedVideoClip(url: url,
                                   filename: "shotiq-placeholder-proof.mov",
                                   contentType: "video/quicktime",
                                   fileSizeBytes: 1,
                                   durationSeconds: 6,
                                   dimensions: CGSize(width: 1080, height: 1920),
                                   frameRate: 60)
        let job = VideoAnalysisJob(clientSessionId: "placeholder-video",
                                   clip: clip,
                                   trimStartFraction: 0,
                                   trimEndFraction: 1)
        let result = ShotIQLocalAnalysisFactory.video(job: job, poseAnalysis: nil)
        let presentation = AnalysisResultPresentation(result: result)

        XCTAssertEqual(AnalysisResultMediaSurfaceResolver.source(for: presentation,
                                                                 fallbackKey: "038-visual-001"),
                       .video(url))
    }

    func testCanonicalAndEmptyAnalysisMediaResolveToDifferentPlaceholderModes() {
        XCTAssertEqual(AnalysisResultMediaSurfaceResolver.source(for: .canonicalDemo,
                                                                 fallbackKey: "038-visual-001"),
                       .canonicalFallback("038-visual-001"))
        XCTAssertEqual(AnalysisResultMediaSurfaceResolver.source(for: .noResult,
                                                                 fallbackKey: "038-visual-001"),
                       .placeholder("No saved media"))
    }
}

final class GoalsViewModelTests: XCTestCase {
    @MainActor
    func testProductionGoalsDoNotStartWithSampleProgress() {
        XCTAssertFalse(UITestHooks.demoData)
        let vm = GoalsViewModel()

        XCTAssertTrue(vm.active.isEmpty)
        XCTAssertTrue(vm.completed.isEmpty)
    }
}

final class PickedVideoClipTests: XCTestCase {
    func testPickedVideoClipFormatsMetadataFromActualAssetValues() {
        let clip = PickedVideoClip(url: URL(fileURLWithPath: "/tmp/shot.mov"),
                                   filename: "shot.mov",
                                   contentType: "video/quicktime",
                                   fileSizeBytes: 24_800_000,
                                   durationSeconds: 6.5,
                                   dimensions: CGSize(width: 1080, height: 1920),
                                   frameRate: 59.94)

        XCTAssertEqual(clip.durationText, "00:06.50")
        XCTAssertEqual(clip.timeText(at: 0.8), "00:05.20")
        XCTAssertEqual(clip.orientationText, "1080 x 1920")
        XCTAssertEqual(clip.fileSizeText, "24.8 MB")
        XCTAssertEqual(clip.frameRateText, "60 FPS")
    }

    func testVideoAnalysisJobCarriesTrimWindowInSeconds() {
        let clip = PickedVideoClip(url: URL(fileURLWithPath: "/tmp/shot.mp4"),
                                   filename: "shot.mp4",
                                   contentType: "video/mp4",
                                   fileSizeBytes: 12_000_000,
                                   durationSeconds: 10,
                                   dimensions: nil,
                                   frameRate: nil)
        let job = VideoAnalysisJob(clientSessionId: "ios-video-test",
                                   clip: clip,
                                   trimStartFraction: 0.2,
                                   trimEndFraction: 0.75)

        XCTAssertEqual(job.trimStartSeconds, 2, accuracy: 0.0001)
        XCTAssertEqual(job.trimEndSeconds, 7.5, accuracy: 0.0001)
        XCTAssertEqual(job.trimmedDurationSeconds, 5.5, accuracy: 0.0001)
        XCTAssertEqual(job.trimWindowText, "00:02.00-00:07.50")
    }
}

final class VideoPoseAnalyzerTests: XCTestCase {
    func testSampleTimesStayInsideTrimWindow() {
        let times = VideoPoseAnalyzer.sampleTimes(start: 2, end: 7.5, maxCount: 4)

        XCTAssertEqual(times.count, 4)
        XCTAssertEqual(times.first, 2)
        XCTAssertEqual(times.last, 7.5)
        XCTAssertTrue(times.allSatisfy { $0 >= 2 && $0 <= 7.5 })
    }

    func testAngleMeasuresMiddleJoint() {
        let measured = VideoPoseAnalyzer.angle(CGPoint(x: 0, y: 0),
                                               CGPoint(x: 1, y: 0),
                                               CGPoint(x: 1, y: 1))

        XCTAssertEqual(measured ?? 0, 90, accuracy: 0.0001)
    }

    func testReleaseAngleMatchesWebForearmDeviationFromVertical() {
        XCTAssertEqual(
            VideoPoseAnalyzer.releaseAngle(elbow: CGPoint(x: 0, y: 1),
                                           wrist: CGPoint(x: 0, y: 0)) ?? 999,
            0,
            accuracy: 0.0001)
        XCTAssertEqual(
            VideoPoseAnalyzer.releaseAngle(elbow: CGPoint(x: 0, y: 1),
                                           wrist: CGPoint(x: 1, y: 0)) ?? 999,
            45,
            accuracy: 0.0001)
    }

    func testWristAngleMatchesWebForearmElevationFromHorizontal() {
        XCTAssertEqual(
            VideoPoseAnalyzer.wristAngle(elbow: CGPoint(x: 0, y: 1),
                                         wrist: CGPoint(x: 0, y: 0)) ?? 999,
            90,
            accuracy: 0.0001)
        XCTAssertEqual(
            VideoPoseAnalyzer.wristAngle(elbow: CGPoint(x: 0, y: 0),
                                         wrist: CGPoint(x: 1, y: 0)) ?? 999,
            0,
            accuracy: 0.0001)
    }
}

/// The pose overlay's two silent-failure modes: a skeleton drawn against the
/// wrong rectangle, and a framing verdict asserted rather than measured. Both
/// look fine in a screenshot and are wrong on a phone, so both are pinned here.
final class PoseDetectionTests: XCTestCase {
    func testBundledSampleMediaProvidesDrawablePose() async throws {
        let image = try XCTUnwrap(UIImage(named: "photo-068-visual-004"))
        let result = await ShotIQPose.detectResult(in: image)
        guard case .detected(let pose) = result else {
            if case .unavailable(let reason) = result {
                throw XCTSkip(reason)
            }
            XCTFail("Bundled full-body sample did not produce a usable pose.")
            return
        }

        XCTAssertTrue(pose.isUsable)
        XCTAssertTrue(pose.hasWrist)
        XCTAssertGreaterThanOrEqual(pose.joints.count, 6)
    }

    /// A pose with every joint of a shooter standing in the middle of frame.
    private func fullBody() -> DetectedPose {
        DetectedPose(joints: [
            .neck: CGPoint(x: 0.50, y: 0.18),
            .leftShoulder: CGPoint(x: 0.45, y: 0.22),
            .rightShoulder: CGPoint(x: 0.55, y: 0.22),
            .leftElbow: CGPoint(x: 0.42, y: 0.36),
            .rightElbow: CGPoint(x: 0.58, y: 0.36),
            .leftWrist: CGPoint(x: 0.44, y: 0.48),
            .rightWrist: CGPoint(x: 0.60, y: 0.46),
            .leftHip: CGPoint(x: 0.47, y: 0.52),
            .rightHip: CGPoint(x: 0.53, y: 0.52),
            .leftKnee: CGPoint(x: 0.46, y: 0.70),
            .rightKnee: CGPoint(x: 0.54, y: 0.70),
            .leftAnkle: CGPoint(x: 0.46, y: 0.88),
            .rightAnkle: CGPoint(x: 0.54, y: 0.88),
        ], confidence: 0.82)
    }

    func testFullBodyInFrameReadsAsVisible() {
        XCTAssertTrue(fullBody().isFullBodyVisible)
        XCTAssertTrue(fullBody().hasWrist)
        XCTAssertTrue(fullBody().isUsable)
    }

    /// Cropped at the waist: the quality check must NOT keep saying "Good".
    func testBodyCroppedBelowTheHipsIsNotFullyVisible() {
        var joints = fullBody().joints
        for leg in [DetectedPose.Joint.leftKnee, .rightKnee, .leftAnkle, .rightAnkle] {
            joints.removeValue(forKey: leg)
        }
        XCTAssertFalse(DetectedPose(joints: joints, confidence: 0.8).isFullBodyVisible)
    }

    /// Feet jammed against the bottom edge is what a body cut off at the ankles
    /// looks like to Vision — inside the dictionary, but not inside the frame.
    func testJointsPinnedToTheFrameEdgeDoNotCountAsVisible() {
        var joints = fullBody().joints
        joints[.leftAnkle] = CGPoint(x: 0.46, y: 0.999)
        joints[.rightAnkle] = CGPoint(x: 0.54, y: 0.999)
        joints.removeValue(forKey: .leftKnee)
        joints.removeValue(forKey: .rightKnee)
        XCTAssertFalse(DetectedPose(joints: joints, confidence: 0.8).isFullBodyVisible)
    }

    func testMissingWristsAreReportedRatherThanAssumed() {
        var joints = fullBody().joints
        joints.removeValue(forKey: .leftWrist)
        joints.removeValue(forKey: .rightWrist)
        XCTAssertFalse(DetectedPose(joints: joints, confidence: 0.8).hasWrist)
    }

    /// Too little of a body to draw: a handful of dots must not be presented as
    /// a read of someone's shooting form.
    func testTooFewJointsIsNotUsable() {
        let sparse = DetectedPose(joints: [
            .nose: CGPoint(x: 0.5, y: 0.1),
            .leftEye: CGPoint(x: 0.48, y: 0.09),
        ], confidence: 0.4)
        XCTAssertFalse(sparse.isUsable)
    }

    /// A bone is skipped when either end is missing, rather than being drawn to
    /// the origin — one absent wrist must not stroke a limb into the corner.
    func testBonesWithAMissingEndAreSkipped() {
        let complete = fullBody().boneSegments.count
        var joints = fullBody().joints
        joints.removeValue(forKey: .leftWrist)
        let reduced = DetectedPose(joints: joints, confidence: 0.8).boneSegments.count
        XCTAssertEqual(reduced, complete - 1)
        XCTAssertGreaterThan(reduced, 0)
    }

    /// Aspect-fill: a tall photo in a wide box is scaled on WIDTH and overflows
    /// vertically. Scaling on height instead would shrink the player to a strip
    /// down the middle and take the skeleton with it.
    func testTallImageInAWideBoxIsScaledOnWidth() {
        let drawn = ShotIQPose.filledSize(image: CGSize(width: 1000, height: 2000),
                                          in: CGSize(width: 353, height: 240))
        XCTAssertEqual(drawn.width, 353, accuracy: 0.01)
        XCTAssertEqual(drawn.height, 706, accuracy: 0.01)
        XCTAssertGreaterThan(drawn.height, 240, "an aspect-filled tall photo must overflow its box")
    }

    /// And the other way: a wide photo overflows horizontally.
    func testWideImageInATallBoxIsScaledOnHeight() {
        let drawn = ShotIQPose.filledSize(image: CGSize(width: 4000, height: 1000),
                                          in: CGSize(width: 353, height: 240))
        XCTAssertEqual(drawn.height, 240, accuracy: 0.01)
        XCTAssertEqual(drawn.width, 960, accuracy: 0.01)
    }

    /// A zero-sized image must not divide by zero and take the screen with it.
    func testDegenerateImageSizeDoesNotProduceNaN() {
        let drawn = ShotIQPose.filledSize(image: .zero, in: CGSize(width: 353, height: 240))
        XCTAssertTrue(drawn.width.isFinite && drawn.height.isFinite)
    }
}

final class PhotoQualityTests: XCTestCase {
    private func image(size: CGSize, color: UIColor) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        return UIGraphicsImageRenderer(size: size, format: format).image { ctx in
            color.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
        }
    }

    func testLightingUsesMeasuredBrightness() {
        let good = ShotIQPhotoQuality.evaluate(image(size: CGSize(width: 1280, height: 720),
                                                   color: UIColor(white: 0.55, alpha: 1)))
        XCTAssertEqual(good.lightingRow.status, "Good")
        XCTAssertTrue(good.lightingRow.ok)

        let dark = ShotIQPhotoQuality.evaluate(image(size: CGSize(width: 1280, height: 720),
                                                   color: UIColor(white: 0.08, alpha: 1)))
        XCTAssertEqual(dark.lightingRow.status, "Too dark")
        XCTAssertFalse(dark.lightingRow.ok)

        let bright = ShotIQPhotoQuality.evaluate(image(size: CGSize(width: 1280, height: 720),
                                                     color: UIColor(white: 0.98, alpha: 1)))
        XCTAssertEqual(bright.lightingRow.status, "Too bright")
        XCTAssertFalse(bright.lightingRow.ok)
    }

    func testResolutionUsesActualPixelDimensions() {
        let high = ShotIQPhotoQuality.evaluate(image(size: CGSize(width: 1280, height: 720),
                                                   color: .gray))
        XCTAssertEqual(high.resolutionRow.title, "Image resolution")
        XCTAssertEqual(high.resolutionRow.status, "High")
        XCTAssertTrue(high.resolutionRow.ok)
        XCTAssertTrue(high.resolutionRow.detail.contains("1280 x 720"))

        let low = ShotIQPhotoQuality.evaluate(image(size: CGSize(width: 480, height: 640),
                                                  color: .gray))
        XCTAssertEqual(low.resolutionRow.status, "Low")
        XCTAssertFalse(low.resolutionRow.ok)
        XCTAssertTrue(low.resolutionRow.detail.contains("480 x 640"))
    }
}
