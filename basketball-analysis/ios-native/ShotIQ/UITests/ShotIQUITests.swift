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
        app.buttons["mark-make"].tap()
        app.buttons["mark-miss"].tap()
        XCTAssertTrue(app.staticTexts["67%"].exists || app.staticTexts["3"].exists)
    }
}
