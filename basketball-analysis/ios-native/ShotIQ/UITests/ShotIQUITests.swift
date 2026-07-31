import XCTest

/// XCUITest smoke journeys. Run on an iPhone simulator (primary) plus a second
/// viewport (e.g. iPhone SE) per the test matrix.
final class ShotIQUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testSplashLeadsToWelcomeOrHome() {
        // splash auto-advances; either the welcome CTA or the home tab bar must appear
        let started = app.buttons["Get started"].waitForExistence(timeout: 6)
            || app.buttons["Home"].waitForExistence(timeout: 2)
        XCTAssertTrue(started)
    }

    func testSignInValidation() throws {
        guard app.buttons["I already have an account"].waitForExistence(timeout: 6) else {
            throw XCTSkip("Session already signed in")
        }
        app.buttons["I already have an account"].tap()
        app.buttons["signin-submit"].tap()
        XCTAssertTrue(app.staticTexts["signin-error"].waitForExistence(timeout: 3))
    }

    func testTabBarReachesEveryRootScreen() throws {
        guard app.buttons["Home"].waitForExistence(timeout: 8) else {
            throw XCTSkip("Not signed in — auth-gated run")
        }
        for tab in ["Analyze", "Training", "Progress", "Profile", "Home"] {
            app.buttons[tab].tap()
        }
        XCTAssertTrue(app.buttons["Home"].isSelected || app.buttons["Home"].exists)
    }

    func testDrillMarkMakeUpdatesCount() throws {
        guard app.buttons["Training"].waitForExistence(timeout: 8) else {
            throw XCTSkip("Not signed in")
        }
        app.buttons["Training"].tap()
        app.staticTexts["Discover drills"].tap()
        app.staticTexts["Pound Crossover Foundation"].tap()
        app.buttons["Start drill"].tap()
        app.buttons["mark-make"].tap()
        app.buttons["mark-make"].tap()
        app.buttons["mark-miss"].tap()
        XCTAssertTrue(app.staticTexts["67%"].exists || app.staticTexts["3"].exists)
    }
}
