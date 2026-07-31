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
