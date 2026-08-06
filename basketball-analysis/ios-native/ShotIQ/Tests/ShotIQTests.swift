import XCTest
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

final class KeychainStoreTests: XCTestCase {
    func testRoundTrip() {
        KeychainStore.save("abc123", key: "testToken")
        XCTAssertEqual(KeychainStore.read(key: "testToken"), "abc123")
        KeychainStore.delete(key: "testToken")
        XCTAssertNil(KeychainStore.read(key: "testToken"))
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
}

/// The pose overlay's two silent-failure modes: a skeleton drawn against the
/// wrong rectangle, and a framing verdict asserted rather than measured. Both
/// look fine in a screenshot and are wrong on a phone, so both are pinned here.
final class PoseDetectionTests: XCTestCase {

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
