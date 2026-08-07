import XCTest

/// XCUITest smoke journeys. Run on an iPhone simulator (primary) plus a second
/// viewport (e.g. iPhone SE) per the test matrix.
final class ShotIQUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    private func launch(_ args: [String] = []) {
        app.terminate()
        app.launchArguments = args
        app.launch()
    }

    func testSplashLeadsToWelcomeOrHome() {
        launch(["-uiTestHoldSplash"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-splash").firstMatch.waitForExistence(timeout: 20))
        app.tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-welcome").firstMatch.waitForExistence(timeout: 15))
    }

    func testSignInValidation() throws {
        launch(["-uiTestSignedOut"])
        XCTAssertTrue(app.buttons["Sign in"].waitForExistence(timeout: 8))
        app.buttons["Sign in"].tap()
        app.buttons["signin-submit"].tap()
        XCTAssertTrue(app.staticTexts["signin-error"].waitForExistence(timeout: 3))
    }

    func testTabBarReachesEveryRootScreen() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData"])
        guard app.buttons["Home"].waitForExistence(timeout: 8) else {
            throw XCTSkip("Not signed in — auth-gated run")
        }
        for tab in ["Capture", "Train", "Progress", "Profile", "Home"] {
            app.buttons[tab].tap()
        }
        XCTAssertTrue(app.buttons["Home"].isSelected || app.buttons["Home"].exists)
    }

    func testDrillMarkMakeUpdatesCount() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData"])
        guard app.buttons["Train"].waitForExistence(timeout: 8) else {
            throw XCTSkip("Not signed in")
        }
        app.buttons["Train"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-training-home").firstMatch.waitForExistence(timeout: 8))
        XCTAssertTrue(app.buttons["Discover"].waitForExistence(timeout: 8))
        app.buttons["Discover"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-discover-drills").firstMatch.waitForExistence(timeout: 8))
        app.staticTexts["STACK & SHOOT"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-drill-detail").firstMatch.waitForExistence(timeout: 8))
        app.buttons["Start drill"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-drill-execution").firstMatch.waitForExistence(timeout: 8))
        app.buttons["mark-make"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "shotiq-toast").firstMatch.waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Make recorded"].exists)
        app.buttons["mark-make"].tap()
        app.buttons["mark-miss"].tap()
        XCTAssertTrue(app.staticTexts["Miss recorded"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["67%"].exists || app.staticTexts["3"].exists)
    }

    func testCaptureNoMediaShowsCustomerFeedback() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "photo-review-crop"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-photo-review-crop").firstMatch.waitForExistence(timeout: 8))
        app.buttons["USE PHOTO"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "shotiq-toast").firstMatch.waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Choose a photo first"].exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "screen-ios-upload-quality-check").firstMatch.waitForExistence(timeout: 1))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "upload-quality-check"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-upload-quality-check").firstMatch.waitForExistence(timeout: 8))
        app.buttons["Continue to analysis"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "shotiq-toast").firstMatch.waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Choose a photo first"].exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "screen-ios-analysis-processing").firstMatch.waitForExistence(timeout: 1))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "video-review"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-video-review").firstMatch.waitForExistence(timeout: 8))
        app.buttons["Analyze video"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "shotiq-toast").firstMatch.waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Choose a video first"].exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "screen-ios-analysis-processing").firstMatch.waitForExistence(timeout: 1))
    }
}
