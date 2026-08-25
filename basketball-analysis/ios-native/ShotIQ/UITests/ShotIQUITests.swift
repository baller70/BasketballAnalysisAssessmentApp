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
        app = XCUIApplication()
        app.launchArguments = args
        app.launchEnvironment["SHOTIQ_UI_TEST_ARGS"] = args.joined(separator: "|")
        app.launch()
    }

    private func screen(_ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    private func waitForAnyScreen(_ ids: [String], timeout: TimeInterval = 8) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        repeat {
            if ids.contains(where: { screen($0).exists }) { return true }
            RunLoop.current.run(until: Date().addingTimeInterval(0.15))
        } while Date() < deadline
        return ids.contains(where: { screen($0).exists })
    }

    private func findControl(_ text: String, maxSwipes: Int = 5) -> XCUIElement? {
        let predicate = NSPredicate(format: "label CONTAINS[c] %@ OR identifier == %@", text, text)
        func existingMatch() -> XCUIElement? {
            for query in [app.buttons, app.staticTexts, app.images, app.otherElements] {
                let match = query.matching(predicate).firstMatch
                if match.exists { return match }
            }
            return nil
        }

        let scroll = app.scrollViews.firstMatch
        for attempt in 0...maxSwipes {
            if let match = existingMatch(), match.isHittable { return match }
            if attempt < maxSwipes {
                scroll.exists ? scroll.swipeUp() : app.swipeUp()
            }
        }
        for attempt in 0...(maxSwipes * 2) {
            if let match = existingMatch(), match.isHittable { return match }
            if attempt < maxSwipes * 2 {
                scroll.exists ? scroll.swipeDown() : app.swipeDown()
            }
        }
        return existingMatch()
    }

    private func tapControl(_ text: String, file: StaticString = #filePath, line: UInt = #line) {
        guard let element = findControl(text) else {
            XCTFail("Missing control: \(text)", file: file, line: line)
            return
        }
        if element.isHittable {
            element.tap()
        } else {
            element.tap()
        }
    }

    private func tapExactControl(_ text: String, file: StaticString = #filePath, line: UInt = #line) {
        let predicate = NSPredicate(format: "label == %@ OR identifier == %@", text, text)
        for query in [app.buttons, app.staticTexts, app.images, app.otherElements] {
            let element = query.matching(predicate).firstMatch
            if element.waitForExistence(timeout: 2) {
                if element.isHittable {
                    element.tap()
                } else {
                    element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
                }
                return
            }
        }
        XCTFail("Missing exact control: \(text)", file: file, line: line)
    }

    private func tapButton(id: String, file: StaticString = #filePath, line: UInt = #line) {
        let element = app.buttons[id]
        let scroll = app.scrollViews.firstMatch
        for attempt in 0...6 {
            if element.waitForExistence(timeout: 1), element.isHittable {
                element.tap()
                return
            }
            if attempt < 6 {
                scroll.exists ? scroll.swipeUp() : app.swipeUp()
            }
        }
        for attempt in 0...6 {
            if element.exists, element.isHittable {
                element.tap()
                return
            }
            if attempt < 6 {
                scroll.exists ? scroll.swipeDown() : app.swipeDown()
            }
        }
        XCTFail("Missing hittable button id: \(id)", file: file, line: line)
    }

    private func tapElement(id: String, file: StaticString = #filePath, line: UInt = #line) {
        let element = app.descendants(matching: .any).matching(identifier: id).firstMatch
        let scroll = app.scrollViews.firstMatch
        for attempt in 0...6 {
            if element.waitForExistence(timeout: 1), element.isHittable {
                element.tap()
                return
            }
            if attempt < 6 {
                scroll.exists ? scroll.swipeUp() : app.swipeUp()
            }
        }
        for attempt in 0...6 {
            if element.exists, element.isHittable {
                element.tap()
                return
            }
            if attempt < 6 {
                scroll.exists ? scroll.swipeDown() : app.swipeDown()
            }
        }
        XCTFail("Missing hittable element id: \(id)", file: file, line: line)
    }

    private func toastContains(_ text: String) -> Bool {
        let toast = screen("shotiq-toast")
        return toast.exists && toast.label.localizedCaseInsensitiveContains(text)
    }

    private func waitForToastContaining(_ text: String, timeout: TimeInterval = 3) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if toastContains(text) { return true }
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }
        return toastContains(text)
    }

    private func assertVisible(_ text: String, maxSwipes: Int = 4,
                               file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertNotNil(findControl(text, maxSwipes: maxSwipes), "Missing visible item: \(text)", file: file, line: line)
    }

    private func assertStaticText(id: String, contains text: String,
                                  file: StaticString = #filePath, line: UInt = #line) {
        let element = app.staticTexts[id]
        XCTAssertTrue(element.waitForExistence(timeout: 2), "Missing static text id: \(id)", file: file, line: line)
        XCTAssertTrue(element.label.localizedCaseInsensitiveContains(text),
                      "Expected \(id) to contain \(text), got \(element.label)", file: file, line: line)
    }

    private func assertElement(id: String, contains text: String,
                               file: StaticString = #filePath, line: UInt = #line) {
        let element = screen(id)
        XCTAssertTrue(element.waitForExistence(timeout: 2), "Missing element id: \(id)", file: file, line: line)
        XCTAssertTrue(element.label.localizedCaseInsensitiveContains(text),
                      "Expected \(id) to contain \(text), got \(element.label)", file: file, line: line)
    }

    private func assertVisibleElement(id: String, contains text: String,
                                      maxSwipes: Int = 4,
                                      file: StaticString = #filePath, line: UInt = #line) {
        let element = screen(id)
        let scroll = app.scrollViews.firstMatch
        for attempt in 0...maxSwipes {
            if element.exists {
                XCTAssertTrue(element.label.localizedCaseInsensitiveContains(text),
                              "Expected \(id) to contain \(text), got \(element.label)", file: file, line: line)
                return
            }
            if attempt < maxSwipes {
                scroll.exists ? scroll.swipeUp() : app.swipeUp()
            }
        }
        XCTFail("Missing element id: \(id)", file: file, line: line)
    }

    private func assertSwitch(id: String, isOn: Bool,
                              file: StaticString = #filePath, line: UInt = #line) {
        let element = app.switches[id]
        XCTAssertTrue(element.waitForExistence(timeout: 3), "Missing switch id: \(id)", file: file, line: line)
        XCTAssertEqual(element.value as? String, isOn ? "1" : "0",
                       "Unexpected switch value for \(id)", file: file, line: line)
    }

    private func tapSwitch(id: String, file: StaticString = #filePath, line: UInt = #line) {
        let element = app.switches[id]
        XCTAssertTrue(element.waitForExistence(timeout: 3), "Missing switch id: \(id)", file: file, line: line)
        if element.isHittable {
            element.tap()
        } else {
            element.coordinate(withNormalizedOffset: CGVector(dx: 0.86, dy: 0.5)).tap()
        }
    }

    private func dismissKeyboardIfPresent() {
        if app.keyboards.buttons["Done"].exists {
            app.keyboards.buttons["Done"].tap()
        } else if app.keyboards.buttons["Return"].exists {
            app.keyboards.buttons["Return"].tap()
        } else if app.keyboards.firstMatch.exists {
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.08)).tap()
        }
    }

    private func tapDialogOption(_ text: String,
                                 file: StaticString = #filePath, line: UInt = #line) {
        let predicate = NSPredicate(format: "label CONTAINS[c] %@ OR identifier == %@", text, text)
        let queries = [app.buttons, app.staticTexts, app.otherElements]
        for query in queries {
            let element = query.matching(predicate).firstMatch
            if element.waitForExistence(timeout: 2) {
                if element.isHittable {
                    element.tap()
                } else {
                    element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
                }
                return
            }
        }
        XCTFail("Missing dialog option: \(text)", file: file, line: line)
    }

    private func tapAndExpect(_ control: String, destination: String,
                              file: StaticString = #filePath, line: UInt = #line) {
        for attempt in 0..<2 {
            guard let element = findControl(control, maxSwipes: attempt == 0 ? 5 : 2) else {
                XCTFail("Missing control: \(control)", file: file, line: line)
                return
            }
            if element.isHittable {
                element.tap()
            } else {
                element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
            }
            if screen(destination).waitForExistence(timeout: 8) {
                return
            }
        }
        XCTFail("Dead tap: \(control) did not open \(destination)", file: file, line: line)
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
        for (tab, destination) in [("Capture", "screen-ios-analyze-hub"),
                                   ("Train", "screen-ios-training-home"),
                                   ("Progress", "screen-ios-analytics-cards"),
                                   ("Profile", "screen-ios-profile"),
                                   ("Home", "screen-ios-home-standard")] {
            app.buttons[tab].tap()
            XCTAssertTrue(screen(destination).waitForExistence(timeout: 8),
                          "\(tab) tab did not open \(destination)")
            XCTAssertTrue(waitForToastContaining("Opened \(tab)", timeout: 2) || tab == "Home")
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

    func testDiscoverDrillFiltersAndSavedDrillsPersistLocally() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingDrills",
                "-uiTestStage", "training-home"])
        XCTAssertTrue(screen("screen-ios-training-home").waitForExistence(timeout: 8))
        tapAndExpect("Discover", destination: "screen-ios-discover-drills")

        tapControl("Filters")
        tapDialogOption("Beginner only")
        XCTAssertTrue(app.staticTexts["2 drills"].waitForExistence(timeout: 3))
        assertVisible("STACK & SHOOT")
        assertVisible("WRIST STAY DRILL")

        tapButton(id: "discover-save-stack-and-shoot")
        XCTAssertTrue(waitForToastContaining("Drill saved"))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "training-home"])
        XCTAssertTrue(screen("screen-ios-training-home").waitForExistence(timeout: 8))
        tapAndExpect("My drills", destination: "screen-ios-my-drills")
        assertVisible("STACK & SHOOT")
        assertVisible("Saved now")
        assertVisible("--")
    }

    func testShotTrackerStartsAtZeroAndCompletionUsesSessionTotals() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        assertStaticText(id: "tracker-session-count", contains: "0 OF 25")
        assertStaticText(id: "tracker-makes-total", contains: "0 OF 0")
        assertStaticText(id: "tracker-make-pct", contains: "0.0%")
        assertStaticText(id: "tracker-current-streak", contains: "0")
        assertElement(id: "tracker-timer-remaining", contains: ":")
        assertElement(id: "tracker-media", contains: "061-visual-001")
        assertStaticText(id: "tracker-media-status", contains: "READY")
        assertElement(id: "tracker-record-workout", contains: "Record")
        assertElement(id: "tracker-upload-clip", contains: "Upload")
        assertElement(id: "tracker-bottom-record-workout", contains: "Record workout")
        assertElement(id: "tracker-bottom-upload-clip", contains: "Upload clip")
        assertElement(id: "tracker-progress-1", contains: "Shot 1 open")
        assertStaticText(id: "tracker-phase-0-value", contains: "--")
        assertStaticText(id: "tracker-phase-3-name", contains: "RELEASE")
        assertElement(id: "tracker-score-bar", contains: "0.0%")

        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(waitForToastContaining("Record a shot first"))
        XCTAssertTrue(screen("screen-ios-shot-tracker").exists)

        tapButton(id: "tracker-pause")
        XCTAssertTrue(waitForToastContaining("Workout paused"))
        tapButton(id: "tracker-pause")
        XCTAssertTrue(waitForToastContaining("Workout resumed"))

        tapElement(id: "tracker-view-analysis")
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))

        tapButton(id: "tracker-mark-make")
        XCTAssertTrue(waitForToastContaining("Make recorded"))
        assertStaticText(id: "tracker-media-status", contains: "SHOT 1")
        assertElement(id: "tracker-progress-1", contains: "Shot 1 make")
        tapButton(id: "tracker-mark-miss")
        XCTAssertTrue(waitForToastContaining("Miss recorded"))
        assertElement(id: "tracker-progress-2", contains: "Shot 2 miss")
        tapButton(id: "tracker-mark-make")
        assertStaticText(id: "tracker-session-count", contains: "3 OF 25")
        assertStaticText(id: "tracker-makes-total", contains: "2 OF 3")
        assertStaticText(id: "tracker-make-pct", contains: "66.7%")
        assertStaticText(id: "tracker-current-streak", contains: "1")
        assertStaticText(id: "tracker-phase-0-value", contains: "%")

        tapButton(id: "tracker-undo")
        XCTAssertTrue(waitForToastContaining("Last shot removed"))
        assertElement(id: "tracker-progress-3", contains: "Shot 3 open")
        assertStaticText(id: "tracker-makes-total", contains: "1 OF 2")
        assertStaticText(id: "tracker-make-pct", contains: "50.0%")

        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(waitForToastContaining("Saving workout"))
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))
        assertStaticText(id: "completion-shots", contains: "3")
        assertStaticText(id: "completion-makes", contains: "2")
        assertStaticText(id: "completion-accuracy", contains: "66.7%")
        assertStaticText(id: "completion-points", contains: "+40")
        assertStaticText(id: "completion-form-score", contains: "70")
        assertElement(id: "completion-media", contains: "062-visual-001")
        assertElement(id: "completion-form-score-bar", contains: "70 percent")
        assertStaticText(id: "completion-form-verdict", contains: "GOOD")
        assertStaticText(id: "completion-form-note", contains: "Keep the reps coming")
        assertStaticText(id: "completion-phase-0-name", contains: "SETUP")
        assertStaticText(id: "completion-phase-0-value", contains: "72")
        assertStaticText(id: "completion-phase-3-name", contains: "RELEASE")
        assertStaticText(id: "completion-phase-3-value", contains: "70")
        assertStaticText(id: "completion-primary-target-title", contains: "Keep elbow stacked")
        assertElement(id: "completion-primary-target-bar", contains: "7 out of 10")
        assertStaticText(id: "completion-primary-target-score", contains: "7 / 10")
        assertVisibleElement(id: "completion-coaching-takeaway", contains: "Strong shooting rhythm")
        assertVisibleElement(id: "completion-share-progress", contains: "2 of 3 makes 66.7%")
    }

    func testTrainingHomeUsesLatestAnalysisAndWorkoutHistory() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestResetTrainingDrills", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "training-home"])
        XCTAssertTrue(screen("screen-ios-training-home").waitForExistence(timeout: 8))
        assertStaticText(id: "training-home-target", contains: "Stack elbow higher")
        assertStaticText(id: "training-home-recommended-drill-0", contains: "STACK & SHOOT")
        assertElement(id: "training-home-record-workout", contains: "Record workout")
        assertElement(id: "training-home-upload-clip", contains: "Upload clip")
        tapElement(id: "training-home-record-workout")
        XCTAssertTrue(screen("screen-ios-live-camera-setup").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestResetTrainingDrills", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "training-home"])
        XCTAssertTrue(screen("screen-ios-training-home").waitForExistence(timeout: 8))
        tapElement(id: "training-home-upload-clip")
        XCTAssertTrue(screen("screen-ios-video-upload").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestResetTrainingDrills", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "training-home"])
        XCTAssertTrue(screen("screen-ios-training-home").waitForExistence(timeout: 8))
        assertStaticText(id: "training-home-recent-drill", contains: "Start tracking")
        assertElement(id: "training-home-recent-shots", contains: "0")
        assertElement(id: "training-home-recent-makes", contains: "0")
        assertElement(id: "training-home-recent-accuracy", contains: "--")
        assertStaticText(id: "training-home-recent-score", contains: "--")
        XCTAssertFalse(app.staticTexts["62.5%"].exists)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "training-home"])
        XCTAssertTrue(screen("screen-ios-training-home").waitForExistence(timeout: 8))
        assertStaticText(id: "training-home-target", contains: "Stack elbow higher")
        assertStaticText(id: "training-home-recommended-drill-0", contains: "STACK & SHOOT")
        assertStaticText(id: "training-home-recent-drill", contains: "Shot Tracker Session")
        assertElement(id: "training-home-recent-shots", contains: "3")
        assertElement(id: "training-home-recent-makes", contains: "2")
        assertElement(id: "training-home-recent-accuracy", contains: "66.7%")
        assertStaticText(id: "training-home-recent-score", contains: "70")
        XCTAssertFalse(app.staticTexts["62.5%"].exists)
    }

    func testQuickStartUsesLatestAnalysisWorkoutHistoryAndTargetSteppers() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestResetTrainingWorkouts", "-uiTestStage", "quick-start"])
        XCTAssertTrue(screen("screen-ios-quick-start").waitForExistence(timeout: 8))
        assertStaticText(id: "quick-start-target", contains: "Stack elbow higher")
        assertStaticText(id: "quick-start-score", contains: "82")
        assertStaticText(id: "quick-start-verdict", contains: "GOOD")
        assertElement(id: "quick-start-shot-target", contains: "24")
        assertElement(id: "quick-start-make-target", contains: "15")

        tapButton(id: "quick-start-shot-target-plus")
        assertElement(id: "quick-start-shot-target", contains: "25")
        tapButton(id: "quick-start-make-target-minus")
        assertElement(id: "quick-start-make-target", contains: "14")

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "quick-start"])
        XCTAssertTrue(screen("screen-ios-quick-start").waitForExistence(timeout: 8))
        assertStaticText(id: "quick-start-target", contains: "Stack elbow higher")
        assertStaticText(id: "quick-start-score", contains: "82")
        assertVisibleElement(id: "quick-start-note", contains: "last 3-shot session")
        assertElement(id: "quick-start-shot-target", contains: "6")
        assertElement(id: "quick-start-make-target", contains: "4")
        assertVisibleElement(id: "quick-start-record-video", contains: "Record video")
        assertVisibleElement(id: "quick-start-upload-video", contains: "Upload video")
        XCTAssertFalse(app.staticTexts["62.5%"].exists)

        tapButton(id: "quick-start-record-video")
        XCTAssertTrue(screen("screen-ios-live-camera-setup").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "quick-start"])
        XCTAssertTrue(screen("screen-ios-quick-start").waitForExistence(timeout: 8))
        tapButton(id: "quick-start-upload-video")
        XCTAssertTrue(screen("screen-ios-video-upload").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "quick-start"])
        XCTAssertTrue(screen("screen-ios-quick-start").waitForExistence(timeout: 8))
        tapButton(id: "quick-start-start-tracking")
        XCTAssertTrue(screen("screen-ios-drill-execution").waitForExistence(timeout: 8))
        assertStaticText(id: "drill-execution-drill-name", contains: "STACK & SHOOT")
    }

    func testCreateGoalPersistsIntoGoalsListAndTrainingContext() throws {
        let title = "Raise corner make rate"
        let goalId = "local-goal-raise-corner-make-rate"

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetCreatedGoals",
                "-uiTestStage", "goals"])
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        tapButton(id: "goals-create-goal")
        XCTAssertTrue(screen("screen-ios-create-goal").waitForExistence(timeout: 8))

        let titleField = app.textFields["create-goal-title-field"]
        XCTAssertTrue(titleField.waitForExistence(timeout: 3))
        titleField.tap()
        titleField.typeText(title)
        dismissKeyboardIfPresent()

        tapButton(id: "create-goal-submit")
        XCTAssertTrue(waitForToastContaining("Creating goal"))
        XCTAssertTrue(waitForToastContaining("Goal created", timeout: 6))
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        assertVisible(title)
        assertElement(id: "goals-progress-\(goalId)", contains: "0%")

        tapExactControl(title)
        XCTAssertTrue(screen("screen-ios-goal-detail").waitForExistence(timeout: 8))
        assertVisible(title)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "goals"])
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        assertVisible(title)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "training-home"])
        XCTAssertTrue(screen("screen-ios-training-home").waitForExistence(timeout: 8))
        assertStaticText(id: "training-home-target", contains: title)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "quick-start"])
        XCTAssertTrue(screen("screen-ios-quick-start").waitForExistence(timeout: 8))
        assertElement(id: "quick-start-context", contains: title)
    }

    func testDrillDetailUsesLatestAnalysisPlanAndControls() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestResetTrainingDrills", "-uiTestStage", "drill-detail"])
        XCTAssertTrue(screen("screen-ios-drill-detail").waitForExistence(timeout: 8))
        assertStaticText(id: "drill-detail-title", contains: "STACK & SHOOT")
        assertStaticText(id: "drill-detail-score", contains: "82")
        assertStaticText(id: "drill-detail-level", contains: "Beginner")
        assertStaticText(id: "drill-detail-duration", contains: "8 min")
        assertStaticText(id: "drill-detail-reps", contains: "24-30")
        assertVisibleElement(id: "drill-detail-build-summary", contains: "stack elbow higher")
        assertVisibleElement(id: "drill-detail-cue", contains: "Stack elbow higher")
        assertVisibleElement(id: "drill-detail-mechanic-elbow-angle", contains: "Elbow Angle")
        XCTAssertFalse(app.staticTexts["Advanced"].exists)
        XCTAssertFalse(app.staticTexts["60-70 reps"].exists)

        tapButton(id: "drill-detail-save")
        XCTAssertTrue(waitForToastContaining("Drill saved"))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "my-drills"])
        XCTAssertTrue(screen("screen-ios-my-drills").waitForExistence(timeout: 8))
        assertVisible("STACK & SHOOT")
        assertVisible("Beginner")
        assertVisible("8 min")

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "drill-detail"])
        XCTAssertTrue(screen("screen-ios-drill-detail").waitForExistence(timeout: 8))
        tapElement(id: "drill-detail-calendar")
        XCTAssertTrue(screen("screen-ios-workout-calendar").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "drill-detail"])
        XCTAssertTrue(screen("screen-ios-drill-detail").waitForExistence(timeout: 8))
        tapElement(id: "drill-detail-media")
        XCTAssertTrue(screen("screen-ios-media-detail").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "drill-detail"])
        XCTAssertTrue(screen("screen-ios-drill-detail").waitForExistence(timeout: 8))
        tapButton(id: "drill-detail-start-drill")
        XCTAssertTrue(screen("screen-ios-drill-execution").waitForExistence(timeout: 8))
        assertStaticText(id: "drill-execution-drill-name", contains: "STACK & SHOOT")
    }

    func testDrillExecutionUsesSelectedPlanAndLiveControls() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "drill-detail"])
        XCTAssertTrue(screen("screen-ios-drill-detail").waitForExistence(timeout: 8))
        tapButton(id: "drill-detail-start-drill")
        XCTAssertTrue(screen("screen-ios-drill-execution").waitForExistence(timeout: 8))

        assertStaticText(id: "drill-execution-drill-name", contains: "STACK & SHOOT")
        assertStaticText(id: "drill-execution-cue", contains: "Stack elbow higher")
        assertStaticText(id: "drill-execution-focus", contains: "Elbow Angle")
        assertElement(id: "drill-execution-media", contains: "056-visual-001")
        assertStaticText(id: "drill-execution-target", contains: "15 makes")
        assertStaticText(id: "drill-execution-makes", contains: "0")
        assertStaticText(id: "drill-execution-shots", contains: "0")
        assertStaticText(id: "drill-execution-make-pct", contains: "0.0%")
        assertStaticText(id: "drill-execution-target-remaining", contains: "15 to target")
        assertElement(id: "drill-execution-record-workout", contains: "Record")
        assertElement(id: "drill-execution-upload-clip", contains: "Upload")

        tapControl("FRONT VIEW")
        tapDialogOption("SIDE VIEW")
        XCTAssertTrue(waitForToastContaining("Camera view changed"))
        assertStaticText(id: "drill-execution-view-angle", contains: "SIDE VIEW")

        tapButton(id: "mark-make")
        XCTAssertTrue(waitForToastContaining("Make recorded"))
        assertStaticText(id: "drill-execution-makes", contains: "1")
        assertStaticText(id: "drill-execution-shots", contains: "1")
        assertStaticText(id: "drill-execution-make-pct", contains: "100.0%")
        assertStaticText(id: "drill-execution-target-remaining", contains: "14 to target")

        tapButton(id: "mark-miss")
        XCTAssertTrue(waitForToastContaining("Miss recorded"))
        assertStaticText(id: "drill-execution-makes", contains: "1")
        assertStaticText(id: "drill-execution-shots", contains: "2")
        assertStaticText(id: "drill-execution-make-pct", contains: "50.0%")

        tapButton(id: "drill-execution-undo")
        XCTAssertTrue(waitForToastContaining("Last shot removed"))
        assertStaticText(id: "drill-execution-shots", contains: "1")
        assertStaticText(id: "drill-execution-make-pct", contains: "100.0%")

        tapButton(id: "mark-miss")
        tapButton(id: "drill-execution-pause")
        XCTAssertTrue(waitForToastContaining("Workout paused"))
        tapButton(id: "drill-execution-pause")
        XCTAssertTrue(waitForToastContaining("Workout resumed"))

        tapButton(id: "drill-execution-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 10))
        assertStaticText(id: "completion-drill-name", contains: "STACK & SHOOT")
        assertStaticText(id: "completion-shots", contains: "2")
        assertStaticText(id: "completion-makes", contains: "1")
        assertStaticText(id: "completion-accuracy", contains: "50.0%")
    }

    func testWorkoutCompletionPrefersFinishedDrillOverStoredHistory() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))
        assertStaticText(id: "completion-drill-name", contains: "SHOT TRACKER SESSION")

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "drill-detail"])
        XCTAssertTrue(screen("screen-ios-drill-detail").waitForExistence(timeout: 8))
        tapButton(id: "drill-detail-start-drill")
        XCTAssertTrue(screen("screen-ios-drill-execution").waitForExistence(timeout: 8))
        tapButton(id: "mark-make")
        tapButton(id: "mark-miss")
        tapButton(id: "drill-execution-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 10))
        assertStaticText(id: "completion-drill-name", contains: "STACK & SHOOT")
        assertStaticText(id: "completion-shots", contains: "2")
        assertStaticText(id: "completion-makes", contains: "1")
        assertStaticText(id: "completion-accuracy", contains: "50.0%")
        assertStaticText(id: "completion-form-score", contains: "52")
        assertStaticText(id: "completion-primary-target-score", contains: "5 / 10")
    }

    func testWorkoutCompletionRoutesAndControlsAreLive() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "workout-completion"])
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))
        assertStaticText(id: "completion-drill-name", contains: "QUICK RELEASE BUILDER")
        assertElement(id: "completion-media", contains: "062-visual-001")
        assertStaticText(id: "completion-phase-4-name", contains: "FOLLOW-THROUGH")
        assertStaticText(id: "completion-phase-4-value", contains: "73")
        assertVisibleElement(id: "completion-next-recommendation", contains: "Elbow Stack Builder")
        assertVisibleElement(id: "completion-review-shots", contains: "Review shots")
        assertVisibleElement(id: "completion-share-progress", contains: "15 of 24 makes 62.5%")
        assertVisibleElement(id: "completion-repeat-drill", contains: "Repeat drill")

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "workout-completion"])
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))
        tapElement(id: "completion-calendar-link")
        XCTAssertTrue(screen("screen-ios-workout-calendar").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "workout-completion"])
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))
        tapElement(id: "completion-player-card-link")
        XCTAssertTrue(screen("screen-ios-player-card").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "workout-completion"])
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))
        tapElement(id: "completion-next-recommendation")
        XCTAssertTrue(screen("screen-ios-drill-detail").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "workout-completion"])
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))
        tapElement(id: "completion-review-shots")
        XCTAssertTrue(screen("screen-ios-shot-breakdown").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "workout-completion"])
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))
        tapElement(id: "completion-repeat-drill")
        XCTAssertTrue(screen("screen-ios-drill-execution").waitForExistence(timeout: 8))
    }

    func testWorkoutCalendarShowsCompletedTrackerSession() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "workout-calendar"])
        XCTAssertTrue(app.staticTexts["calendar-selected-workout-name"].waitForExistence(timeout: 8))
        assertStaticText(id: "calendar-strip-shots", contains: "3")
        assertStaticText(id: "calendar-strip-makes", contains: "2")
        assertStaticText(id: "calendar-strip-fg", contains: "66.7%")
        assertStaticText(id: "calendar-selected-status", contains: "COMPLETED")
        assertStaticText(id: "calendar-selected-workout-name", contains: "SHOT TRACKER SESSION")
        assertStaticText(id: "calendar-selected-workout-summary", contains: "3 shots")
    }

    func testSettingsTogglesPersistLocallyAndShowFeedback() throws {
        let coachingAudio = "settings-toggle-coaching-audio"

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetSettings",
                "-uiTestResetTrainingWorkouts", "-uiTestStage", "settings-hub"])
        XCTAssertTrue(screen("screen-ios-settings-hub").waitForExistence(timeout: 8))
        assertSwitch(id: coachingAudio, isOn: true)

        tapSwitch(id: coachingAudio)
        XCTAssertTrue(waitForToastContaining("Settings saved"))
        XCTAssertTrue(waitForToastContaining("Coaching audio cues"))
        assertSwitch(id: coachingAudio, isOn: false)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "settings-hub"])
        XCTAssertTrue(screen("screen-ios-settings-hub").waitForExistence(timeout: 8))
        assertSwitch(id: coachingAudio, isOn: false)

        tapSwitch(id: coachingAudio)
        XCTAssertTrue(waitForToastContaining("Settings saved"))
        assertSwitch(id: coachingAudio, isOn: true)
    }

    func testSettingsPreservesCanonicalDemoStatsWithoutWorkoutHistory() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "settings-hub"])
        XCTAssertTrue(screen("screen-ios-settings-hub").waitForExistence(timeout: 8))
        assertElement(id: "settings-display-name", contains: "JORDAN ELLIS")
        assertElement(id: "settings-subtitle", contains: "Right-handed")
        assertElement(id: "settings-day-streak", contains: "6")
        assertElement(id: "settings-points", contains: "2,840")
        assertElement(id: "settings-form-score", contains: "82")
        assertElement(id: "settings-total-shots", contains: "24")
        assertElement(id: "settings-total-makes", contains: "15")
        assertElement(id: "settings-make-rate", contains: "62.5%")
        assertElement(id: "settings-trend", contains: "+8.1%")
    }

    func testSettingsUsesWorkoutHistoryStats() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "settings-hub"])
        XCTAssertTrue(screen("screen-ios-settings-hub").waitForExistence(timeout: 8))
        assertElement(id: "settings-display-name", contains: "JORDAN ELLIS")
        assertElement(id: "settings-day-streak", contains: "1")
        assertElement(id: "settings-points", contains: "85")
        assertElement(id: "settings-form-score", contains: "99")
        assertElement(id: "settings-total-shots", contains: "6")
        assertElement(id: "settings-total-makes", contains: "5")
        assertElement(id: "settings-make-rate", contains: "83.3%")
        assertElement(id: "settings-trend", contains: "+29")
        XCTAssertFalse(app.staticTexts["2,840"].exists)
        XCTAssertFalse(app.staticTexts["62.5%"].exists)
    }

    func testSettingsRowsRevealControlsAndShowFeedback() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetSettings",
                "-uiTestResetTrainingWorkouts", "-uiTestStage", "settings-hub"])
        XCTAssertTrue(screen("screen-ios-settings-hub").waitForExistence(timeout: 8))

        tapButton(id: "settings-row-automation")
        XCTAssertTrue(app.switches["settings-toggle-auto-analysis"].waitForExistence(timeout: 2))
        tapSwitch(id: "settings-toggle-auto-analysis")
        XCTAssertTrue(waitForToastContaining("Settings saved"))
        XCTAssertTrue(waitForToastContaining("Auto-analysis refresh"))

        tapButton(id: "settings-row-data-privacy")
        XCTAssertTrue(app.switches["settings-toggle-anonymous-analytics"].waitForExistence(timeout: 2))
        tapSwitch(id: "settings-toggle-anonymous-analytics")
        XCTAssertTrue(waitForToastContaining("Settings saved"))
        XCTAssertTrue(waitForToastContaining("Anonymous analytics"))

        tapButton(id: "settings-row-notifications")
        XCTAssertTrue(waitForToastContaining("Opening Settings"))

        tapButton(id: "settings-row-help-support")
        XCTAssertTrue(waitForToastContaining("Opening Support"))

        tapButton(id: "settings-row-about-shotiq")
        XCTAssertTrue(app.alerts["ShotIQ 1.0.0"].waitForExistence(timeout: 2))
        app.alerts["ShotIQ 1.0.0"].buttons["OK"].tap()
    }

    func testVideoUploadShowsFullScreenSourceOptions() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData"])
        guard app.buttons["Capture"].waitForExistence(timeout: 8) else {
            throw XCTSkip("Not signed in")
        }
        app.buttons["Capture"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-analyze-hub").firstMatch.waitForExistence(timeout: 8))
        let uploadVideo = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Upload video")).firstMatch
        XCTAssertTrue(uploadVideo.waitForExistence(timeout: 8))
        uploadVideo.tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-video-upload").firstMatch.waitForExistence(timeout: 8))

        XCTAssertFalse(app.staticTexts["SELECT MEDIA TYPE"].exists)
        XCTAssertFalse(app.staticTexts["Images - Upload 3-7 photos"].exists)
        XCTAssertTrue(app.staticTexts["Video Requirements"].exists)
        XCTAssertTrue(app.staticTexts["Browse video"].exists)
        XCTAssertTrue(app.staticTexts["Record video"].exists)
        XCTAssertTrue(app.staticTexts["Upload queue"].exists)
        XCTAssertTrue(app.staticTexts["Filming tips"].exists)
        XCTAssertFalse(app.staticTexts["Choose video"].exists)
    }

    func testLiveCaptureCalibrationEndRoundAndConfirmMakeWorks() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData"])
        guard app.buttons["Capture"].waitForExistence(timeout: 8) else {
            throw XCTSkip("Not signed in")
        }
        app.buttons["Capture"].tap()
        XCTAssertTrue(screen("screen-ios-analyze-hub").waitForExistence(timeout: 8))

        tapAndExpect("Live camera", destination: "screen-ios-live-camera-setup")
        for setupItem in ["STABLE PLACEMENT", "FULL-BODY IN FRAME", "HOOP VISIBLE", "SHOOTING HAND"] {
            XCTAssertNotNil(findControl(setupItem), "Missing live setup item: \(setupItem)")
        }

        tapAndExpect("Set up camera", destination: "screen-ios-hoop-calibration")
        XCTAssertTrue(app.staticTexts["HOOP CALIBRATION"].exists)
        XCTAssertTrue(app.staticTexts["Align the overlay with the hoop."].exists)
        tapAndExpect("Confirm hoop", destination: "screen-ios-readiness-check")
        for check in ["Full body", "Lighting", "Stability", "Hoop visible", "Ball visible", "Pose confidence"] {
            XCTAssertNotNil(findControl(check), "Missing readiness check: \(check)")
        }

        tapAndExpect("Keep position", destination: "screen-ios-capture-ready")
        XCTAssertTrue(app.staticTexts["CAPTURE READY"].exists)
        if !screen("screen-ios-live-recording").waitForExistence(timeout: 3) {
            tapControl("Start recording")
        }
        XCTAssertTrue(screen("screen-ios-live-recording").waitForExistence(timeout: 25))
        XCTAssertNotNil(findControl("SHOTS"), "Missing live shots rail")
        XCTAssertNotNil(findControl("MAKES"), "Missing live makes rail")
        XCTAssertNotNil(findControl("MAKE %"), "Missing live make percentage rail")

        tapAndExpect("END ROUND", destination: "screen-ios-shot-detected")
        for resultItem in ["SHOT DETECTED", "CONFIRM THIS RESULT", "CONFIRM MAKE", "MARK MISS",
                           "NOT A SHOT", "Catch & Shoot", "Release Height"] {
            XCTAssertNotNil(findControl(resultItem), "Missing shot-detected item: \(resultItem)")
        }

        tapControl("CONFIRM MAKE")
        XCTAssertTrue(screen("shotiq-toast").waitForExistence(timeout: 3))
        XCTAssertTrue(toastContains("Saving shot result") || toastContains("Make recorded"))
        XCTAssertTrue(screen("screen-ios-capture-review").waitForExistence(timeout: 8))
        for reviewItem in ["CAPTURE REVIEW", "1", "SHOTS", "MAKES", "100.0%", "MAKE %",
                           "NEED REVIEW", "DISCARDED", "Nothing to review in this view"] {
            XCTAssertNotNil(findControl(reviewItem, maxSwipes: 2), "Missing capture review item: \(reviewItem)")
        }
        XCTAssertFalse(app.staticTexts["15"].exists)
        XCTAssertFalse(app.staticTexts["62.5%"].exists)
    }

    func testLiveRecordingHudStartsAtZeroAndUpdatesFromSessionEvents() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "live-recording"])
        XCTAssertTrue(screen("screen-ios-live-recording").waitForExistence(timeout: 8))

        let shots = app.otherElements["live-stat-SHOTS"]
        let makes = app.otherElements["live-stat-MAKES"]
        let makePercent = app.otherElements["live-stat-MAKE %"]
        XCTAssertTrue(shots.exists)
        XCTAssertTrue(makes.exists)
        XCTAssertTrue(makePercent.exists)
        XCTAssertEqual(shots.label, "SHOTS 0")
        XCTAssertEqual(makes.label, "MAKES 0")
        XCTAssertEqual(makePercent.label, "MAKE % --")
        XCTAssertFalse(app.staticTexts["24"].exists)
        XCTAssertFalse(app.staticTexts["15"].exists)
        XCTAssertFalse(app.staticTexts["62.5%"].exists)

        tapControl("Simulate made shot")
        tapControl("Simulate missed shot")

        XCTAssertEqual(shots.label, "SHOTS 2")
        XCTAssertEqual(makes.label, "MAKES 1")
        XCTAssertEqual(makePercent.label, "MAKE % 50.0%")
    }

    func testLiveFormFeedbackWaitsForMeasuredLivePoseBeforeShowingScores() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "live-form-feedback"])
        XCTAssertTrue(screen("screen-ios-live-form-feedback").waitForExistence(timeout: 8))

        XCTAssertTrue(app.staticTexts["Waiting for live pose."].exists)
        XCTAssertTrue(app.staticTexts["No live pose measurement yet. Keep the athlete fully in frame."].exists)
        XCTAssertTrue(app.staticTexts["--"].exists)
        XCTAssertFalse(app.staticTexts["87%"].exists)
        XCTAssertFalse(app.staticTexts["Keep building consistency."].exists)

        tapControl("Simulate live feedback")

        XCTAssertTrue(app.staticTexts["Keep elbow stacked."].exists)
        XCTAssertTrue(app.staticTexts["79"].exists)
        XCTAssertTrue(app.staticTexts["72%"].exists)
        XCTAssertTrue(app.staticTexts["Release"].exists)
    }

    func testShotDetectedMarkMissShowsFeedbackAndOpensReview() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "shot-detected"])
        XCTAssertTrue(screen("screen-ios-shot-detected").waitForExistence(timeout: 8))
        XCTAssertNotNil(findControl("CONFIRM MAKE"), "Missing make confirmation")
        XCTAssertNotNil(findControl("MARK MISS"), "Missing miss correction")
        tapControl("MARK MISS")
        XCTAssertTrue(screen("shotiq-toast").waitForExistence(timeout: 3))
        XCTAssertTrue(toastContains("Saving shot result") || toastContains("Miss recorded"))
        XCTAssertTrue(screen("screen-ios-capture-review").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["CAPTURE REVIEW"].exists)
    }

    func testPhotoUploadRequiresFrontSideRearViewsAndCarriesAngleToAnalysis() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "photo-upload-source",
                "-uiTestSampleMedia", "-uiTestSampleMediaName", "photo-068-visual-004"])
        XCTAssertTrue(screen("screen-ios-photo-upload-source").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["Add front, side, and rear shot photos so ShotIQ knows exactly which angle it is evaluating."].exists)
        for item in ["SHOT VIEWPOINTS", "FRONT VIEW", "SIDE VIEW", "REAR VIEW",
                     "ADD FRONT PHOTO", "ADD SIDE PHOTO", "ADD REAR PHOTO",
                     "Choose front photo", "Choose side photo", "Choose rear photo"] {
            assertVisible(item, maxSwipes: 5)
        }

        tapControl("Continue with selected views")
        XCTAssertTrue(screen("shotiq-toast").waitForExistence(timeout: 3))
        XCTAssertTrue(toastContains("Add front, side, and rear photos first"))
        XCTAssertFalse(screen("screen-ios-photo-review-crop").waitForExistence(timeout: 1))

        tapControl("Use sample for all views")
        XCTAssertTrue(waitForToastContaining("All views ready"))
        for item in ["FRONT READY", "SIDE READY", "REAR READY"] {
            assertVisible(item, maxSwipes: 5)
        }

        tapControl("Continue with selected views")
        XCTAssertTrue(screen("screen-ios-photo-review-crop").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["Side view selected. Adjust crop to include your full body from head to toe."].exists)
        app.buttons["USE PHOTO"].tap()
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["We'll check your side view to make sure it's ready for the best analysis."].exists)
        XCTAssertTrue(app.staticTexts["Side view • ready to analyze"].exists)
    }

    func testSamplePhotoRunsPoseQualityAndProcessingFeedback() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "photo-review-crop",
                "-uiTestSampleMedia", "-uiTestSampleMediaName", "photo-068-visual-004"])
        XCTAssertTrue(screen("screen-ios-photo-review-crop").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["3:4"].exists)
        XCTAssertTrue(app.staticTexts["Tip: Include your full body. Leave a little space above your head and below your feet."].exists)
        for unmeasuredCropItem in ["82", "24", "15", "62.5%", "FORM SCORE", "SHOTS", "MAKES",
                                   "ACCURACY", "Keep elbow stacked through release"] {
            XCTAssertFalse(app.staticTexts[unmeasuredCropItem].exists,
                           "Photo review crop must not show unmeasured pre-analysis value: \(unmeasuredCropItem)")
        }

        app.buttons["USE PHOTO"].tap()
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 8))
        for sourceSafeItem in ["READY", "SIDE", "AFTER", "TARGET AFTER ANALYSIS",
                               "ShotIQ will set this after the upload finishes."] {
            XCTAssertTrue(app.staticTexts[sourceSafeItem].exists, "Missing pre-analysis source-safe item: \(sourceSafeItem)")
        }
        for unmeasuredItem in ["82", "24", "15", "62.5%", "FORM SCORE", "SHOTS", "MAKES",
                               "ACCURACY", "Keep elbow stacked through release"] {
            XCTAssertFalse(app.staticTexts[unmeasuredItem].exists,
                           "Upload quality check must not show unmeasured pre-analysis value: \(unmeasuredItem)")
        }
        XCTAssertTrue(app.staticTexts["IMG_4521.JPG"].exists)
        XCTAssertTrue(app.staticTexts["Side view • ready to analyze"].exists)
        if !app.staticTexts["Shooting hand is in frame."].waitForExistence(timeout: 15) {
            XCTAssertTrue(app.staticTexts["Pose detector unavailable on this simulator/device."].exists)
        }
        XCTAssertTrue(app.staticTexts["Image resolution"].exists)
        XCTAssertNotNil(findControl("pixels", maxSwipes: 1))
        XCTAssertFalse(app.staticTexts["Video resolution"].exists)
        XCTAssertFalse(app.staticTexts["1080p"].exists)
        XCTAssertTrue(app.staticTexts["Full body visibility"].exists)
        XCTAssertTrue(app.staticTexts["Shooting hand visibility"].exists)
        XCTAssertTrue(app.staticTexts["Best framing: side view, full body in frame, shooting hand and ball fully visible."].exists)

        app.buttons["Continue to analysis"].tap()
        XCTAssertTrue(screen("shotiq-toast").waitForExistence(timeout: 3))
        XCTAssertTrue(screen("screen-ios-analysis-processing").waitForExistence(timeout: 25))
        XCTAssertTrue(app.staticTexts["Upload complete"].exists)
        XCTAssertTrue(app.staticTexts["Detecting pose & landmarks"].exists)
        XCTAssertTrue(app.staticTexts["Scoring mechanics"].exists)
        XCTAssertTrue(app.staticTexts["Building coaching plan"].exists)
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 30))
        if !screen("captured-pose-detected").waitForExistence(timeout: 15) {
            XCTAssertTrue(screen("captured-pose-unavailable").exists || screen("captured-pose-no-shooter").exists,
                          "Analysis overview must use the selected-photo pose surface instead of the canonical demo skeleton.")
        }
    }

    func testSelectedPhotoAnalysisAppearsInMyMediaAndDetail() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestHomeVariant", "standard",
                "-uiTestSampleMedia", "-uiTestSampleMediaName", "photo-068-visual-004",
                "-uiTestForceSamplePose"])
        XCTAssertTrue(screen("screen-ios-home-standard").waitForExistence(timeout: 20))
        tapControl("Upload image")
        XCTAssertTrue(screen("screen-ios-photo-upload-source").waitForExistence(timeout: 8))
        tapControl("Use sample for all views")
        XCTAssertTrue(waitForToastContaining("All views ready"))
        tapControl("Continue with selected views")
        XCTAssertTrue(screen("screen-ios-photo-review-crop").waitForExistence(timeout: 8))
        app.buttons["USE PHOTO"].tap()
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 8))
        app.buttons["Continue to analysis"].tap()
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 30))

        tapButton(id: "tab-profile")
        XCTAssertTrue(screen("screen-ios-profile").waitForExistence(timeout: 8))
        tapControl("My media")
        XCTAssertTrue(screen("screen-ios-my-media").waitForExistence(timeout: 8))
        assertStaticText(id: "my-media-header-score", contains: "--")
        assertStaticText(id: "my-media-header-verdict", contains: "UNAVAILABLE")
        assertStaticText(id: "my-media-header-stat-0-value", contains: "1")
        assertStaticText(id: "my-media-header-stat-0-label", contains: "MEDIA")
        assertStaticText(id: "my-media-header-stat-1-value", contains: "1")
        assertStaticText(id: "my-media-header-stat-1-label", contains: "IMAGE")
        assertStaticText(id: "my-media-header-stat-2-value", contains: "0")
        assertStaticText(id: "my-media-header-stat-2-label", contains: "VIDEOS")
        XCTAssertNotNil(findControl("Side View Analysis"), "Selected analysis must appear in My Media.")
        XCTAssertNotNil(findControl("Just now"), "Selected analysis must be surfaced as the newest media item.")
        XCTAssertTrue(screen("media-real-surface").waitForExistence(timeout: 5),
                      "My Media must render the selected image/video surface.")

        tapButton(id: "my-media-tile-0")
        XCTAssertTrue(screen("screen-ios-media-detail").waitForExistence(timeout: 8))
        XCTAssertTrue(screen("media-real-surface").waitForExistence(timeout: 5),
                      "Media detail must render the selected media surface.")
        for detail in ["MEDIA DETAIL", "CAPTURE DETAILS", "Image", "LINKED ANALYSIS",
                       "Shot Analysis", "Form Score", "Open analysis", "PRIMARY COACHING TARGET"] {
            XCTAssertNotNil(findControl(detail), "Missing selected media detail item: \(detail)")
        }
        XCTAssertFalse(app.staticTexts["MAY 21, 2025 - 8:24 AM"].exists)
        XCTAssertFalse(app.staticTexts["62.5%"].exists)
        tapAndExpect("Open analysis", destination: "screen-ios-analysis-result-overview")
        XCTAssertTrue(screen("captured-pose-detected").waitForExistence(timeout: 8))

        tapAndExpect("Share analysis", destination: "screen-ios-share-results")
        assertStaticText(id: "share-results-score", contains: "--")
        assertStaticText(id: "share-results-target", contains: "Keep elbow stacked")
        assertStaticText(id: "share-results-text", contains: "UNAVAILABLE")
        assertStaticText(id: "share-results-text", contains: "image")
        assertVisible("MEDIA IMAGE")
        assertVisible("POSE DETECTED PHASE")
        XCTAssertFalse(app.staticTexts["62.5%"].exists)
        XCTAssertFalse(app.staticTexts["24"].exists)
        tapControl("Copy")
        XCTAssertTrue(screen("share-results-copy-badge").waitForExistence(timeout: 1) ||
                      screen("share-results-copy-feedback").waitForExistence(timeout: 1) ||
                      app.buttons["Copied"].waitForExistence(timeout: 1) ||
                      waitForToastContaining("Copied", timeout: 3))
    }

    func testMyMediaUsesLatestAnalysisHeaderFiltersSortAndSelectionFeedback() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "my-media"])
        XCTAssertTrue(screen("screen-ios-my-media").waitForExistence(timeout: 8))
        assertStaticText(id: "my-media-primary-target", contains: "Stack elbow higher")
        assertStaticText(id: "my-media-header-score", contains: "82")
        assertStaticText(id: "my-media-header-verdict", contains: "GOOD")
        assertStaticText(id: "my-media-header-stat-0-value", contains: "1")
        assertStaticText(id: "my-media-header-stat-0-label", contains: "MEDIA")
        assertStaticText(id: "my-media-header-stat-1-value", contains: "1")
        assertStaticText(id: "my-media-header-stat-1-label", contains: "IMAGE")
        assertStaticText(id: "my-media-header-stat-2-value", contains: "0")
        assertStaticText(id: "my-media-header-stat-2-label", contains: "VIDEOS")
        assertStaticText(id: "my-media-visible-count", contains: "7 ITEMS")

        tapButton(id: "my-media-segment-Images")
        XCTAssertTrue(waitForToastContaining("Images: 3 items visible"))
        assertStaticText(id: "my-media-visible-count", contains: "3 ITEMS")

        tapButton(id: "my-media-filter")
        tapDialogOption("REVIEW")
        XCTAssertTrue(waitForToastContaining("REVIEW: 1 items visible"))
        assertStaticText(id: "my-media-visible-count", contains: "1 ITEMS")

        tapButton(id: "my-media-sort")
        XCTAssertTrue(waitForToastContaining("Oldest first"))

        tapButton(id: "my-media-select")
        XCTAssertTrue(waitForToastContaining("Tap items to add"))
        tapControl("Spot-Up")
        XCTAssertTrue(waitForToastContaining("Spot-Up"))
        assertVisible("Done (1)")
        tapButton(id: "my-media-select")
        XCTAssertTrue(waitForToastContaining("1 item selected"))
    }

    func testMediaDetailUsesRealAnalysisDateTargetAndLocalDeleteFeedback() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "my-media"])
        XCTAssertTrue(screen("screen-ios-my-media").waitForExistence(timeout: 8))
        tapButton(id: "my-media-tile-0")
        XCTAssertTrue(screen("screen-ios-media-detail").waitForExistence(timeout: 8))
        assertElement(id: "media-detail-capture-meta", contains: "Image")
        let dateFormatter = DateFormatter()
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
        dateFormatter.dateFormat = "MMM d"
        let expectedRecordedDay = dateFormatter.string(from: Date())
        assertElement(id: "media-detail-linked-date", contains: expectedRecordedDay)
        XCTAssertFalse(app.staticTexts["• May 21, 2025"].exists)

        tapButton(id: "media-detail-playback-speed")
        XCTAssertTrue(waitForToastContaining("Playback speed changed"))
        tapButton(id: "media-detail-frame-2")
        XCTAssertTrue(waitForToastContaining("Frame 2"))
        tapButton(id: "media-detail-primary-target")
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "my-media"])
        XCTAssertTrue(screen("screen-ios-my-media").waitForExistence(timeout: 8))
        tapButton(id: "my-media-tile-0")
        XCTAssertTrue(screen("screen-ios-media-detail").waitForExistence(timeout: 8))
        tapButton(id: "media-detail-delete-media-button")
        XCTAssertTrue(waitForToastContaining("Media removed"))
        XCTAssertTrue(screen("screen-ios-my-media").waitForExistence(timeout: 8))
        assertStaticText(id: "my-media-visible-count", contains: "6 ITEMS")
    }

    func testLatestPhotoAnalysisFeedsPlayerCardAndCustomizationFeedback() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestHomeVariant", "standard",
                "-uiTestSampleMedia", "-uiTestSampleMediaName", "photo-068-visual-004",
                "-uiTestForceSamplePose"])
        XCTAssertTrue(screen("screen-ios-home-standard").waitForExistence(timeout: 20))
        tapControl("Upload image")
        XCTAssertTrue(screen("screen-ios-photo-upload-source").waitForExistence(timeout: 8))
        tapControl("Use sample for all views")
        XCTAssertTrue(waitForToastContaining("All views ready"))
        tapControl("Continue with selected views")
        XCTAssertTrue(screen("screen-ios-photo-review-crop").waitForExistence(timeout: 8))
        app.buttons["USE PHOTO"].tap()
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 8))
        app.buttons["Continue to analysis"].tap()
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 30))

        app.buttons["Profile"].tap()
        XCTAssertTrue(screen("screen-ios-profile").waitForExistence(timeout: 8))
        tapControl("Player card")
        XCTAssertTrue(screen("screen-ios-player-card").waitForExistence(timeout: 8))
        assertStaticText(id: "player-card-score", contains: "--")
        assertStaticText(id: "player-card-verdict", contains: "UNAVAILABLE")
        assertElement(id: "player-card-target", contains: "Keep elbow stacked")
        assertElement(id: "player-card-source", contains: "PARTIAL")
        assertElement(id: "player-card-shots", contains: "--")
        assertElement(id: "player-card-makes", contains: "--")
        assertElement(id: "player-card-make-rate", contains: "--")
        XCTAssertFalse(app.staticTexts["62.5%"].exists)

        tapControl("Customize card")
        XCTAssertTrue(screen("screen-ios-customize-player-card").waitForExistence(timeout: 8))
        assertStaticText(id: "customize-player-card-score", contains: "--")
        assertStaticText(id: "customize-player-card-verdict", contains: "UNAVAILABLE")
        assertElement(id: "customize-player-card-target", contains: "Keep elbow stacked")
        assertElement(id: "customize-player-card-shots", contains: "--")
        assertElement(id: "customize-player-card-makes", contains: "--")
        assertElement(id: "customize-player-card-accuracy", contains: "--")
        tapControl("Save card")
        XCTAssertTrue(app.staticTexts["CARD SAVED"].waitForExistence(timeout: 8))
        assertVisible("Save or share image", maxSwipes: 2)
    }

    func testWeakMeasuredAnalysisFeedsEliteMatchComparison() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestHomeVariant", "standard"])
        XCTAssertTrue(screen("screen-ios-home-standard").waitForExistence(timeout: 20))
        tapControl("View latest analysis")
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 8))
        tapControl("COMPARE")
        XCTAssertTrue(screen("screen-ios-elite-match").waitForExistence(timeout: 8))

        assertStaticText(id: "elite-match-score", contains: "82")
        assertStaticText(id: "elite-match-similarity", contains: "100%")
        assertStaticText(id: "elite-match-shared-mechanics", contains: "5 OF 5")
        assertStaticText(id: "elite-match-you-Release Offset", contains: "+14°")
        assertStaticText(id: "elite-match-you-Elbow Angle", contains: "118°")
        assertStaticText(id: "elite-match-you-Wrist Angle", contains: "72°")
        assertStaticText(id: "elite-match-release-alignment", contains: "+14°")
        assertVisibleElement(id: "elite-match-target", contains: "Stack elbow higher")
        XCTAssertFalse(app.staticTexts["62.5%"].exists)
    }

    func testSelectedPhotoAnalysisFeedsPhotoComparisonPoseAndPlaceholders() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestHomeVariant", "standard",
                "-uiTestSampleMedia", "-uiTestSampleMediaName", "photo-068-visual-004",
                "-uiTestForceSamplePose"])
        XCTAssertTrue(screen("screen-ios-home-standard").waitForExistence(timeout: 20))
        tapControl("Upload image")
        XCTAssertTrue(screen("screen-ios-photo-upload-source").waitForExistence(timeout: 8))
        tapControl("Use sample for all views")
        XCTAssertTrue(waitForToastContaining("All views ready"))
        tapControl("Continue with selected views")
        XCTAssertTrue(screen("screen-ios-photo-review-crop").waitForExistence(timeout: 8))
        app.buttons["USE PHOTO"].tap()
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 8))
        app.buttons["Continue to analysis"].tap()
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 30))

        tapControl("COMPARE")
        XCTAssertTrue(screen("screen-ios-elite-match").waitForExistence(timeout: 8))
        tapElement(id: "open-photo-comparison")
        XCTAssertTrue(screen("screen-ios-photo-comparison").waitForExistence(timeout: 8))
        XCTAssertTrue(screen("captured-pose-detected").waitForExistence(timeout: 8))
        assertStaticText(id: "photo-comparison-score", contains: "--")
        assertElement(id: "photo-comparison-shots", contains: "--")
        assertElement(id: "photo-comparison-makes", contains: "--")
        assertElement(id: "photo-comparison-accuracy", contains: "--")
        assertVisibleElement(id: "photo-comparison-you-PHASE", contains: "POSE DETECTED")
        XCTAssertFalse(app.staticTexts["62.5%"].exists)

        tapControl("Overlay skeletons")
        XCTAssertTrue(screen("captured-pose-detected").exists)
        tapControl("Sync release frames")
        assertVisible("Release frames synced", maxSwipes: 2)
    }

    func testEliteShootersOpenSelectedShooterDetailAndComparison() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestEliteShooterCatalog",
                "-uiTestHomeVariant", "pro"])
        XCTAssertTrue(screen("screen-ios-home-professional").waitForExistence(timeout: 20))
        tapControl("Menu")
        XCTAssertTrue(screen("screen-ios-profile-menu").waitForExistence(timeout: 8))
        tapElement(id: "profile-menu-row-elite-shooters")
        XCTAssertTrue(screen("screen-ios-elite-shooters").waitForExistence(timeout: 8))
        assertVisible("Stephen Curry")

        tapElement(id: "elite-shooter-row-30")
        XCTAssertTrue(screen("screen-ios-elite-shooter-detail").waitForExistence(timeout: 8))
        assertStaticText(id: "elite-detail-name", contains: "STEPHEN CURRY")
        assertStaticText(id: "elite-detail-team", contains: "Golden State Warriors")
        assertElement(id: "elite-detail-fg", contains: "47.1%")
        assertElement(id: "elite-detail-three", contains: "43.0%")
        assertStaticText(id: "elite-detail-score", contains: "98")
        assertStaticText(id: "elite-detail-tier", contains: "98")
        assertVisibleElement(id: "elite-detail-mechanic-Release Angle", contains: "50°")
        XCTAssertFalse(app.staticTexts["KLAY THOMPSON"].exists)

        tapControl("Save reference")
        XCTAssertTrue(waitForToastContaining("Reference saved"))
        tapControl("Compare with my shot")
        XCTAssertTrue(screen("screen-ios-photo-comparison").waitForExistence(timeout: 8))
        assertStaticText(id: "photo-comparison-elite-name", contains: "STEPHEN CURRY")
        assertStaticText(id: "photo-comparison-elite-score", contains: "98")
    }

    func testCanonicalMediaLibraryAndDetailStillRenderSampleSurfaces() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "my-media"])
        XCTAssertTrue(screen("screen-ios-my-media").waitForExistence(timeout: 8))
        XCTAssertTrue(screen("media-sample-surface").waitForExistence(timeout: 5))
        for item in ["MY MEDIA", "Pull-Up", "Spot-Up", "Catch & Shoot", "Cone Progression"] {
            XCTAssertNotNil(findControl(item), "Missing canonical media-library item: \(item)")
        }

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "media-detail"])
        XCTAssertTrue(screen("screen-ios-media-detail").waitForExistence(timeout: 8))
        XCTAssertTrue(screen("media-sample-surface").waitForExistence(timeout: 5))
        for item in ["MEDIA DETAIL", "CAPTURE DETAILS", "MAY 21, 2025",
                     "LINKED ANALYSIS", "Shot Analysis", "Form Score", "82",
                     "SHOT EVENTS", "24", "15", "62.5%", "PRIMARY COACHING TARGET"] {
            XCTAssertNotNil(findControl(item), "Missing canonical media-detail item: \(item)")
        }
    }

    func testAnalysisBreakdownShowsPhaseSequenceAndJointControls() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestHomeVariant", "standard"])
        XCTAssertTrue(screen("screen-ios-home-standard").waitForExistence(timeout: 20))
        tapControl("View latest analysis")
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 8))
        for overviewItem in ["YOUR SIX KEY METRICS", "RELEASE HEIGHT", "RELEASE ANGLE",
                             "ELBOW ALIGNMENT", "SHOT ARC", "SPIN RATE", "CENTEREDNESS",
                             "PHASE", "SOURCES"] {
            XCTAssertTrue(app.staticTexts[overviewItem].exists, "Missing overview analytics item: \(overviewItem)")
        }
        tapControl("View shot breakdown")
        XCTAssertTrue(screen("screen-ios-shot-breakdown").waitForExistence(timeout: 8))

        for phase in ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"] {
            XCTAssertTrue(app.staticTexts[phase].exists, "Missing phase: \(phase)")
        }
        for metric in ["RELEASE HEIGHT", "RELEASE OFFSET", "ELBOW ANGLE", "WRIST ANGLE"] {
            XCTAssertTrue(app.staticTexts[metric].exists, "Missing metric: \(metric)")
        }
        XCTAssertTrue(app.staticTexts["PHASE COACHING"].exists)
        XCTAssertTrue(app.staticTexts["Great elevation and alignment. Focus on snapping wrist down to create more backspin."].exists)

        tapAndExpect("Open release frame", destination: "screen-ios-frame-detail-skeleton")
        for control in ["Skeleton", "Joint points", "Annotations", "Basketball"] {
            XCTAssertNotNil(findControl(control), "Missing frame control: \(control)")
        }
        tapControl("Show joint angles")
        XCTAssertNotNil(findControl("Hide joint angles", maxSwipes: 1))
        XCTAssertTrue(app.staticTexts["TARGET"].exists)
        XCTAssertTrue(app.staticTexts["Keep elbow stacked through release"].exists)
    }

    func testFrameDetailUsesSelectedMediaPoseAndSavedMetrics() throws {
        launch(["-uiTestBypassAuth", "-uiTestSampleMedia", "-uiTestForceSamplePose",
                "-uiTestStage", "upload-quality-check"])
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 20))
        XCTAssertTrue(app.staticTexts["READY"].exists)

        tapControl("Continue to analysis")
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 30))
        tapControl("View shot breakdown")
        XCTAssertTrue(screen("screen-ios-shot-breakdown").waitForExistence(timeout: 8))
        tapAndExpect("Open release frame", destination: "screen-ios-frame-detail-skeleton")

        XCTAssertTrue(screen("frame-detail-real-media").waitForExistence(timeout: 8))
        XCTAssertTrue(screen("captured-pose-detected").waitForExistence(timeout: 8))
        XCTAssertTrue(screen("frame-detail-presentation-source").exists)
        XCTAssertTrue(app.staticTexts["SAVED ANALYSIS"].exists)
        XCTAssertTrue(app.staticTexts["POSE DETECTED • FRAME 42"].exists)
        XCTAssertFalse(app.staticTexts["SHOT 12 OF 24"].exists)
        for oldDemoValue in ["82", "24", "15", "62.5%"] {
            XCTAssertFalse(app.staticTexts[oldDemoValue].exists,
                           "Frame detail must not reuse demo stat: \(oldDemoValue)")
        }

        tapControl("Joint points")
        tapControl("Show joint angles")
        XCTAssertNotNil(findControl("Hide joint angles", maxSwipes: 1))
    }

    func testAnnotationToolbarDrawSaveAndReopenWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestHomeVariant", "standard",
                "-uiTestResetAnnotations"])
        XCTAssertTrue(screen("screen-ios-home-standard").waitForExistence(timeout: 20))
        tapControl("View latest analysis")
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 8))
        tapControl("View shot breakdown")
        XCTAssertTrue(screen("screen-ios-shot-breakdown").waitForExistence(timeout: 8))
        tapAndExpect("Open release frame", destination: "screen-ios-frame-detail-skeleton")
        tapAndExpect("Annotations", destination: "screen-ios-annotation-toolbar")

        let canvas = screen("annotation-canvas")
        XCTAssertTrue(canvas.waitForExistence(timeout: 8))
        assertStaticText(id: "annotation-count", contains: "0 annotations")

        canvas.coordinate(withNormalizedOffset: CGVector(dx: 0.22, dy: 0.28))
            .press(forDuration: 0.1,
                   thenDragTo: canvas.coordinate(withNormalizedOffset: CGVector(dx: 0.64, dy: 0.56)))
        assertStaticText(id: "annotation-count", contains: "1 annotation")

        tapButton(id: "annotation-tool-arrow")
        canvas.coordinate(withNormalizedOffset: CGVector(dx: 0.32, dy: 0.68))
            .press(forDuration: 0.1,
                   thenDragTo: canvas.coordinate(withNormalizedOffset: CGVector(dx: 0.74, dy: 0.34)))
        assertStaticText(id: "annotation-count", contains: "2 annotations")

        tapButton(id: "annotation-tool-undo")
        assertStaticText(id: "annotation-count", contains: "1 annotation")
        tapButton(id: "annotation-tool-redo")
        assertStaticText(id: "annotation-count", contains: "2 annotations")

        tapButton(id: "annotation-export-image")
        XCTAssertTrue(waitForToastContaining("Export ready"))
        XCTAssertTrue(app.buttons["annotation-share-image"].waitForExistence(timeout: 2))
        tapButton(id: "annotation-copy-summary")
        XCTAssertTrue(waitForToastContaining("Summary copied"))

        let frameTime = app.staticTexts["annotation-frame-time"]
        XCTAssertTrue(frameTime.waitForExistence(timeout: 2))
        let beforeStep = frameTime.label
        tapButton(id: "annotation-step-forward")
        XCTAssertNotEqual(frameTime.label, beforeStep)
        tapButton(id: "annotation-play-pause")

        tapControl("Save annotations")
        XCTAssertTrue(app.alerts["Annotations saved"].waitForExistence(timeout: 4))
        XCTAssertTrue(app.alerts.staticTexts["2 annotations saved to frame 43."].exists)
        app.alerts.buttons["OK"].tap()

        tapExactControl("Back")
        XCTAssertTrue(screen("screen-ios-frame-detail-skeleton").waitForExistence(timeout: 8))
        tapAndExpect("Annotations", destination: "screen-ios-annotation-toolbar")
        assertStaticText(id: "annotation-count", contains: "2 annotations")
    }

    func testHistoryFetchFailureDoesNotShowNoAnalysisYet() throws {
        launch(["-uiTestBypassAuth", "-uiTestHistoryFailure"])

        XCTAssertTrue(screen("screen-ios-home-history-unavailable").waitForExistence(timeout: 20))
        XCTAssertTrue(app.staticTexts["HISTORY UNAVAILABLE"].exists)
        XCTAssertTrue(app.staticTexts["Your saved shots may still exist. Retry before treating this account as new."].exists)
        XCTAssertFalse(screen("screen-ios-home-new-player").waitForExistence(timeout: 1))
        XCTAssertFalse(screen("screen-ios-no-analysis-yet").waitForExistence(timeout: 1))
        XCTAssertFalse(app.staticTexts["NO ANALYSES YET"].exists)

        tapControl("Analyze a shot")
        XCTAssertTrue(screen("screen-ios-analyze-hub").waitForExistence(timeout: 8))
    }

    func testAnalysisErrorPreservesSelectedPhotoForRetryAndReframe() throws {
        let args = ["-uiTestBypassAuth", "-uiTestSampleMedia", "-uiTestAnalysisFailure",
                    "-uiTestStage", "upload-quality-check"]

        launch(args)
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 20))
        XCTAssertTrue(app.staticTexts["READY"].exists)
        tapControl("Continue to analysis")
        XCTAssertTrue(screen("screen-ios-analysis-error").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["Your selected side view is saved for retry."].exists)

        tapControl("Choose another frame")
        XCTAssertTrue(screen("screen-ios-photo-review-crop").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["Side view selected. Adjust crop to include your full body from head to toe."].exists)

        launch(args)
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 20))
        tapControl("Continue to analysis")
        XCTAssertTrue(screen("screen-ios-analysis-error").waitForExistence(timeout: 8))
        tapControl("Try analysis again")
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["READY"].exists)
    }

    func testAnalysisCoachingNotesMetricDetailsAndFlawTagsWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestHomeVariant", "standard"])
        XCTAssertTrue(screen("screen-ios-home-standard").waitForExistence(timeout: 20))
        tapControl("View latest analysis")
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 8))

        tapControl("FORM SCORE")
        XCTAssertTrue(screen("screen-ios-form-score").waitForExistence(timeout: 8))
        for formItem in ["FORM BREAKDOWN", "SOURCE COVERAGE", "KEY INSIGHT", "METRIC DETAILS",
                         "Review weakest metric", "Generated from the lowest trusted saved score"] {
            XCTAssertNotNil(findControl(formItem), "Missing form analytics item: \(formItem)")
        }

        tapControl("Review weakest metric")
        XCTAssertTrue(screen("screen-ios-metric-detail").waitForExistence(timeout: 8))
        for metricItem in ["AI ANALYSIS", "MEASURED", "ELITE RANGE", "CONFIDENCE",
                           "WHY IT MATTERS", "CORRECTION CUE", "Keep elbow stacked under the ball",
                           "TOO FLARED", "STACKED", "BEHIND BODY", "View frame"] {
            XCTAssertNotNil(findControl(metricItem), "Missing metric coaching item: \(metricItem)")
        }

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestHomeVariant", "standard"])
        XCTAssertTrue(screen("screen-ios-home-standard").waitForExistence(timeout: 20))
        tapControl("View latest analysis")
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 8))

        tapControl("FLAWS")
        XCTAssertTrue(screen("screen-ios-flaws-overview").waitForExistence(timeout: 8))
        for flawItem in ["AI analysis detected 3 priority flaws", "ELBOW FLARE", "HIGH IMPACT",
                         "EARLY WRIST EXTENSION", "MEDIUM IMPACT", "LOW FOLLOW-THROUGH",
                         "LOW IMPACT", "CONFIDENCE", "AFFECTED PHASES"] {
            XCTAssertNotNil(findControl(flawItem), "Missing flaw overview item: \(flawItem)")
        }

        tapControl("Review elbow flare")
        XCTAssertTrue(screen("screen-ios-flaw-detail").waitForExistence(timeout: 8))
        for detailItem in ["FLAW DETAIL", "EVIDENCE FRAMES", "IMPACT", "YOUR ANGLE",
                           "IDEAL RANGE", "25", "15", "HOW TO FIX", "TARGET POSITION",
                           "Elbow under ball", "Forearm vertical", "Wrist behind ball",
                           "RECOMMENDED DRILL", "Towel Elbow Stack"] {
            XCTAssertNotNil(findControl(detailItem), "Missing flaw detail item: \(detailItem)")
        }
        tapButton(id: "flaw-detail-evidence-release")
        XCTAssertTrue(screen("screen-ios-frame-detail-skeleton").waitForExistence(timeout: 8))
    }

    func testFlawsOverviewUsesWeakSavedAnalysisInsteadOfDemoFlaws() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestHomeVariant", "standard"])
        XCTAssertTrue(screen("screen-ios-home-standard").waitForExistence(timeout: 20))
        tapControl("View latest analysis")
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 8))

        tapControl("FLAWS")
        XCTAssertTrue(screen("screen-ios-flaws-overview").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["AI analysis detected 3 priority flaws impacting your shot efficiency."].exists)
        for generated in ["ELBOW ANGLE OUT OF RANGE", "RELEASE PATH DRIFT", "RELEASE SCORE GAP",
                          "Review elbow angle", "Review release path", "Review release"] {
            XCTAssertNotNil(findControl(generated), "Missing generated flaw item: \(generated)")
        }
        for oldDemo in ["ELBOW FLARE", "EARLY WRIST EXTENSION", "LOW FOLLOW-THROUGH"] {
            XCTAssertFalse(app.staticTexts[oldDemo].exists,
                           "Flaws overview must not reuse demo flaw: \(oldDemo)")
        }

        tapControl("Review release path")
        XCTAssertTrue(screen("screen-ios-flaw-detail").waitForExistence(timeout: 8))
        for detail in ["RELEASE PATH DRIFT", "Release offset is +14°",
                       "YOUR OFFSET", "14°", "IDEAL BAND", "-5° to +5°",
                       "Release through centerline", "Elbow over shooting hip",
                       "Line Release Holds"] {
            XCTAssertNotNil(findControl(detail), "Missing generated flaw detail item: \(detail)")
        }
        XCTAssertFalse(app.staticTexts["Elbow flare opens your shooting angle and adds unwanted side spin, which reduces accuracy and increases variability."].exists)
        XCTAssertFalse(app.staticTexts["25°"].exists)
    }

    func testUploadQueueStartsEmptyAndBlocksAnalysisWithoutMedia() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "analyze-hub"])
        XCTAssertTrue(screen("screen-ios-analyze-hub").waitForExistence(timeout: 8))
        tapControl("View all")
        XCTAssertTrue(screen("screen-ios-upload-queue").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["No media queued"].exists)
        XCTAssertTrue(app.staticTexts["Add an image or video from your device to start upload and analysis."].exists)
        XCTAssertFalse(app.staticTexts["pullup-jumper.mov"].exists)
        XCTAssertFalse(app.staticTexts["spotup-three.mov"].exists)
        XCTAssertFalse(app.staticTexts["transition-pullup.mov"].exists)
        tapControl("Analyze now")
        XCTAssertTrue(screen("shotiq-toast").waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Add media first"].exists)
        XCTAssertFalse(screen("screen-ios-analysis-processing").waitForExistence(timeout: 1))
    }

    func testCaptureNoMediaShowsCustomerFeedback() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestNoMedia", "-uiTestStage", "photo-review-crop"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-photo-review-crop").firstMatch.waitForExistence(timeout: 8))
        app.buttons["USE PHOTO"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "shotiq-toast").firstMatch.waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Choose a photo first"].exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "screen-ios-upload-quality-check").firstMatch.waitForExistence(timeout: 1))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestNoMedia", "-uiTestStage", "upload-quality-check"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-upload-quality-check").firstMatch.waitForExistence(timeout: 8))
        app.buttons["Continue to analysis"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "shotiq-toast").firstMatch.waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Choose a photo first"].exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "screen-ios-analysis-processing").firstMatch.waitForExistence(timeout: 1))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "video-review"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-video-review").firstMatch.waitForExistence(timeout: 8))
        tapControl("Edit player profile")
        XCTAssertTrue(screen("profile-edit-sheet").waitForExistence(timeout: 4) ||
                      app.staticTexts["EDIT PLAYER PROFILE"].waitForExistence(timeout: 4))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "video-review"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "screen-ios-video-review").firstMatch.waitForExistence(timeout: 8))
        app.buttons["Analyze video"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "shotiq-toast").firstMatch.waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Choose a video first"].exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "screen-ios-analysis-processing").firstMatch.waitForExistence(timeout: 1))
    }

    func testAnalyticsCardsImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "analytics-cards"])
        XCTAssertTrue(screen("screen-ios-analytics-cards").waitForExistence(timeout: 8))
        assertVisible("All time")
        assertVisible("All media")
        for item in ["AI ANALYSIS HISTORY", "FORM SCORE TREND", "82", "GOOD",
                     "24", "SHOTS", "15", "MAKES", "62.5%", "ACCURACY",
                     "ANALYSIS SESSIONS", "Catch & Shoot", "Off the Dribble",
                     "Pull-Up Jumper", "Mid-Range Work", "IMPROVEMENT", "NEEDS REVIEW"] {
            assertVisible(item)
        }

    }

    func testAnalyticsCardsUseWorkoutHistoryFiltersAndShareValues() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "analytics-cards"])
        XCTAssertTrue(screen("screen-ios-analytics-cards").waitForExistence(timeout: 8))
        assertElement(id: "analytics-cards-summary-score", contains: "99")
        assertElement(id: "analytics-cards-summary-verdict", contains: "GREAT")
        assertElement(id: "analytics-cards-summary-target", contains: "Stack elbow higher")
        assertElement(id: "analytics-cards-trend", contains: "Form Score 70 to 99")
        assertElement(id: "analytics-cards-total-shots", contains: "6")
        assertElement(id: "analytics-cards-total-makes", contains: "5")
        assertElement(id: "analytics-cards-total-accuracy", contains: "83.3%")
        assertElement(id: "analytics-cards-total-delta", contains: "+29")
        assertVisibleElement(id: "analytics-card-session-0-name", contains: "Shot Tracker Session", maxSwipes: 2)
        assertVisibleElement(id: "analytics-card-session-0-shots", contains: "3", maxSwipes: 1)
        assertVisibleElement(id: "analytics-card-session-0-makes", contains: "3", maxSwipes: 1)
        assertVisibleElement(id: "analytics-card-session-0-accuracy", contains: "100.0%", maxSwipes: 1)
        assertVisibleElement(id: "analytics-card-session-0-score", contains: "99", maxSwipes: 1)
        assertVisibleElement(id: "analytics-card-session-0-delta", contains: "+29", maxSwipes: 1)
        assertVisibleElement(id: "analytics-card-session-0-share", contains: "3/3 makes (100.0%), form score 99", maxSwipes: 1)

        tapButton(id: "analytics-cards-media-filter")
        tapDialogOption("Live")
        XCTAssertTrue(waitForToastContaining("2 sessions visible"))
        assertVisibleElement(id: "analytics-card-session-1-accuracy", contains: "66.7%", maxSwipes: 3)

        tapButton(id: "analytics-cards-media-filter")
        tapDialogOption("Photo")
        XCTAssertTrue(waitForToastContaining("0 sessions visible"))
        assertVisibleElement(id: "analytics-cards-empty", contains: "No sessions match", maxSwipes: 2)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "analytics-cards"])
        XCTAssertTrue(screen("screen-ios-analytics-cards").waitForExistence(timeout: 8))
        tapButton(id: "analytics-card-session-0-open")
        XCTAssertTrue(screen("screen-ios-analytics-detailed").waitForExistence(timeout: 8))
    }

    func testAnalyticsDetailedImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "analytics-detailed"])
        XCTAssertTrue(screen("screen-ios-analytics-detailed").waitForExistence(timeout: 8))
        for item in ["ANALYSIS HISTORY", "+6.4%", "78.2%", "MECHANICS SCORECARD",
                     "SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH",
                     "SESSION COMPARISON", "Form Score", "Make %", "Release Consistency",
                     "RELEASE ARC RANGE", "50.4°", "IDEAL: 48°–52°",
                     "SHOT RAIL SUMMARY"] {
            assertVisible(item)
        }
        assertVisible("Confidence: High")
    }

    func testAnalyticsDetailedUsesWorkoutHistoryMetricRangeAndFeedback() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "analytics-detailed"])
        XCTAssertTrue(screen("screen-ios-analytics-detailed").waitForExistence(timeout: 8))
        assertElement(id: "analytics-detailed-trend-delta", contains: "+28.4%")
        assertElement(id: "analytics-detailed-trend-caption", contains: "vs previous session")
        assertElement(id: "analytics-detailed-latest-value", contains: "98.4%")
        assertElement(id: "analytics-detailed-trend-chart", contains: "Release Consistency trend 70 to 98")
        assertElement(id: "analytics-detailed-confidence", contains: "Confidence: High")
        assertVisibleElement(id: "analytics-detailed-scorecard-3-value", contains: "99", maxSwipes: 2)
        assertVisibleElement(id: "analytics-detailed-scorecard-3-delta", contains: "+29", maxSwipes: 1)
        assertVisibleElement(id: "analytics-detailed-scorecard-3-verdict", contains: "GREAT", maxSwipes: 1)
        assertVisibleElement(id: "analytics-detailed-comparison-0-latest", contains: "99", maxSwipes: 3)
        assertVisibleElement(id: "analytics-detailed-comparison-0-previous", contains: "70", maxSwipes: 1)
        assertVisibleElement(id: "analytics-detailed-comparison-0-change", contains: "+29", maxSwipes: 1)
        assertVisibleElement(id: "analytics-detailed-arc-value", contains: "+14°", maxSwipes: 3)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "analytics-detailed"])
        XCTAssertTrue(screen("screen-ios-analytics-detailed").waitForExistence(timeout: 8))
        tapButton(id: "analytics-detailed-metric-filter")
        tapDialogOption("Form Score")
        XCTAssertTrue(waitForToastContaining("Form Score selected"))
        assertElement(id: "analytics-detailed-trend-delta", contains: "+29")
        assertElement(id: "analytics-detailed-latest-value", contains: "99")

        tapButton(id: "analytics-detailed-range-filter")
        tapDialogOption("Last 7 days")
        XCTAssertTrue(waitForToastContaining("Last 7 days: 2 sessions"))
        assertElement(id: "analytics-detailed-trend-delta", contains: "+29")
    }

    func testProfileImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "profile"])
        XCTAssertTrue(screen("screen-ios-profile").waitForExistence(timeout: 8))
        for item in ["JORDAN ELLIS", "6", "DAY STREAK", "2,840", "POINTS",
                     "24", "SHOTS", "15", "MAKES", "62.5%", "MAKE %",
                     "PHYSICAL PROFILE", "SHOOTING PROFILE", "PLAYER CARD",
                     "PROFILE COMPLETION", "82%"] {
            assertVisible(item)
        }
    }

    func testProfileUsesWorkoutHistoryStatsAndActivity() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "profile"])
        XCTAssertTrue(screen("screen-ios-profile").waitForExistence(timeout: 8))
        assertElement(id: "profile-display-name", contains: "JORDAN ELLIS")
        assertElement(id: "profile-day-streak", contains: "1")
        assertElement(id: "profile-points", contains: "85")
        assertElement(id: "profile-total-shots", contains: "6")
        assertElement(id: "profile-total-makes", contains: "5")
        assertElement(id: "profile-make-rate", contains: "83.3%")
        assertVisibleElement(id: "profile-activity-0", contains: "Shot Tracker Session", maxSwipes: 3)
        XCTAssertFalse(app.staticTexts["2,840"].exists)
        XCTAssertFalse(app.staticTexts["62.5%"].exists)
    }

    func testPlayerCardImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "player-card"])
        XCTAssertTrue(screen("screen-ios-player-card").waitForExistence(timeout: 8))
        for item in ["FORM SCORE", "82", "GOOD", "62.5%", "MAKE %",
                     "MEASUREMENTS", "SHOT BREAKDOWN", "MECHANICS OVERVIEW",
                     "SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH",
                     "Customize card", "Share card", "Download card"] {
            assertVisible(item)
        }
    }

    func testCustomizePlayerCardImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "customize-player-card"])
        XCTAssertTrue(screen("screen-ios-customize-player-card").waitForExistence(timeout: 8))
        for item in ["LIVE PREVIEW", "FORM SCORE", "82", "GOOD",
                     "24", "SHOTS", "15", "MAKES", "62.5%", "ACCURACY",
                     "CUSTOMIZE DETAILS", "BANNER COLOR", "JERSEY NUMBER",
                     "FIRST NAME", "LAST NAME", "Save card"] {
            assertVisible(item)
        }
        tapControl("Save card")
        XCTAssertTrue(app.staticTexts["CARD SAVED"].waitForExistence(timeout: 8))
        assertVisible("Save or share image", maxSwipes: 2)
    }

    func testMediaLibraryImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "my-media"])
        XCTAssertTrue(screen("screen-ios-my-media").waitForExistence(timeout: 8))
        for item in ["MY MEDIA", "FORM SCORE", "82", "GOOD", "24", "SHOTS",
                     "15", "MAKES", "62.5%", "ACCURACY", "All", "Images",
                     "Videos", "Live", "Workouts", "Pull-Up", "Spot-Up",
                     "Catch & Shoot", "Cone Progression"] {
            assertVisible(item)
        }
        tapControl("Images")
        assertVisible("Spot-Up", maxSwipes: 2)
        tapControl("Select")
        tapControl("Spot-Up")
        assertVisible("Done (1)", maxSwipes: 2)
        tapControl("Done")
    }

    func testMediaDetailImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "media-detail"])
        XCTAssertTrue(screen("screen-ios-media-detail").waitForExistence(timeout: 8))
        tapExactControl("Play")
        XCTAssertTrue(waitForToastContaining("Playing clip"))
        tapExactControl("Playback speed")
        tapExactControl("Frame 1")
        XCTAssertTrue(waitForToastContaining("Frame selected"))
        for item in ["MEDIA DETAIL", "CAPTURE DETAILS", "MAY 21, 2025",
                     "LINKED ANALYSIS", "Shot Analysis", "Form Score", "82",
                     "SHOT EVENTS", "24", "SHOTS", "15", "MAKES", "62.5%",
                     "MAKE %", "6", "DAY STREAK", "2,840", "POINTS",
                     "PRIMARY COACHING TARGET", "ACTIONS", "Play", "Share",
                     "Download", "Delete media"] {
            assertVisible(item)
        }
        tapAndExpect("Open analysis", destination: "screen-ios-analysis-result-overview")
    }

    func testGoalsImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "goals"])
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        for item in ["GOALS", "ACTIVE (2)", "68%", "40%", "MAKE %",
                     "AVG. FORM SCORE", "82", "GOAL PROGRESS",
                     "Keep elbow stacked through release",
                     "Create goal"] {
            assertVisible(item)
        }
        tapControl("Form Score")
        assertVisible("Make %", maxSwipes: 2)
    }

    func testGoalsUseCompletedWorkoutHistoryAndRoutes() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestGoalsRouteProof",
                "-uiTestStage", "goals"])
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        assertVisibleElement(id: "goals-progress-g1", contains: "68%")
        assertVisibleElement(id: "goals-stat-sessions-g1", contains: "1")
        assertVisibleElement(id: "goals-stat-form-score-g1", contains: "70")
        assertVisibleElement(id: "goals-stat-make-pct-g1", contains: "66.7%")
        assertVisibleElement(id: "goals-trend-chart-g1", contains: "Form Score 70")
        assertVisibleElement(id: "goals-recent-title-g1", contains: "Shot Tracker Session")
        assertVisibleElement(id: "goals-recent-summary-g1", contains: "3 shots")
        assertVisibleElement(id: "goals-recent-summary-g1", contains: "66.7%")
        assertVisibleElement(id: "goals-recent-score-g1", contains: "70")

        tapElement(id: "goals-trend-toggle-g1")
        assertVisibleElement(id: "goals-trend-chart-g1", contains: "Make % 67")
        tapElement(id: "goals-insights-toggle-g1")
        assertVisibleElement(id: "goals-insight-g1-0", contains: "Shot Tracker Session")
        assertVisibleElement(id: "goals-insight-g1-1", contains: "Average form score is 70")

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestGoalsRouteProof",
                "-uiTestStage", "goals"])
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        tapElement(id: "goals-player-card-link")
        XCTAssertTrue(screen("screen-ios-player-card").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestGoalsRouteProof",
                "-uiTestStage", "goals"])
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        tapElement(id: "goals-create-goal")
        XCTAssertTrue(screen("screen-ios-create-goal").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestGoalsRouteProof",
                "-uiTestStage", "goals"])
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        tapElement(id: "goals-recent-session-g1")
        XCTAssertTrue(screen("screen-ios-analytics-detailed").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestGoalsRouteProof",
                "-uiTestStage", "goals"])
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        tapElement(id: "goals-view-all-g1")
        XCTAssertTrue(screen("screen-ios-analytics-cards").waitForExistence(timeout: 8))
    }

    func testGoalDetailUsesWorkoutHistoryAndAnalysisSnapshot() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestResetTrainingWorkouts",
                "-uiTestStage", "shot-tracker"])
        XCTAssertTrue(screen("screen-ios-shot-tracker").waitForExistence(timeout: 8))
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-mark-miss")
        tapButton(id: "tracker-mark-make")
        tapButton(id: "tracker-end-workout")
        XCTAssertTrue(screen("screen-ios-workout-completion").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestWeakAnalysis",
                "-uiTestStage", "goal-detail"])
        XCTAssertTrue(screen("screen-ios-goal-detail").waitForExistence(timeout: 8))
        assertElement(id: "goal-detail-progress-value", contains: "72%")
        assertElement(id: "goal-detail-trend-chart", contains: "Form Score 70")
        assertVisibleElement(id: "goal-detail-elbow-angle", contains: "118°", maxSwipes: 3)
        assertVisibleElement(id: "goal-detail-target-range", contains: "150°", maxSwipes: 3)
        assertVisibleElement(id: "goal-detail-target-range", contains: "180°", maxSwipes: 1)
        assertVisibleElement(id: "goal-detail-snapshot-form-score", contains: "82", maxSwipes: 1)
        assertVisibleElement(id: "goal-detail-snapshot-release-offset", contains: "+14°", maxSwipes: 1)
        assertVisibleElement(id: "goal-detail-linked-count", contains: "1 LINKED THIS GOAL", maxSwipes: 1)
        assertVisibleElement(id: "goal-detail-session-0-name", contains: "Shot Tracker Session", maxSwipes: 1)
        assertVisibleElement(id: "goal-detail-session-0-shots", contains: "3", maxSwipes: 1)
        assertVisibleElement(id: "goal-detail-session-0-make-pct", contains: "66.7%", maxSwipes: 1)
        assertVisibleElement(id: "goal-detail-session-0-elbow", contains: "118°", maxSwipes: 1)
        assertVisibleElement(id: "goal-detail-session-0-goal-score", contains: "70%", maxSwipes: 1)

        tapElement(id: "goal-detail-session-0")
        XCTAssertTrue(screen("screen-ios-analytics-detailed").waitForExistence(timeout: 8))
    }

    func testGoalDetailImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "goal-detail"])
        XCTAssertTrue(screen("screen-ios-goal-detail").waitForExistence(timeout: 8))
        for item in ["Keep elbow stacked through release", "IMPACT", "HIGH",
                     "GOAL PROGRESS", "72%", "TECHNIQUE SNAPSHOT",
                     "ELBOW STACK ANGLE", "87°", "TARGET RANGE", "85°–95°",
                     "LINKED SESSIONS", "RECOMMENDED DRILLS", "Quick Release Builder"] {
            assertVisible(item)
        }
    }

    func testSecondaryControlsShowFeedbackAndDialogs() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "create-goal"])
        XCTAssertTrue(screen("screen-ios-create-goal").waitForExistence(timeout: 8))
        for control in ["Shooting", "Footwork", "Range", "Minimum", "Degrees", "Reps", "Learn how"] {
            assertVisible(control)
        }
        tapControl("Shooting")
        tapControl("Minimum")
        tapControl("Reps")
        tapControl("Keep elbow stacked through release")
        tapDialogOption("Hold follow-through to the rim")
        XCTAssertTrue(waitForToastContaining("Target linked"))
        tapAndExpect("Learn how", destination: "screen-ios-metric-detail")

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "goal-detail"])
        XCTAssertTrue(screen("screen-ios-goal-detail").waitForExistence(timeout: 8))
        tapControl("Log progress")
        XCTAssertTrue(app.staticTexts["LOG PROGRESS"].waitForExistence(timeout: 4))
        assertVisible("Save progress", maxSwipes: 1)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "goal-detail"])
        XCTAssertTrue(screen("screen-ios-goal-detail").waitForExistence(timeout: 8))
        tapControl("Edit goal")
        XCTAssertTrue(app.staticTexts["EDIT GOAL"].waitForExistence(timeout: 4))
        assertVisible("Save changes", maxSwipes: 1)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "goal-detail"])
        XCTAssertTrue(screen("screen-ios-goal-detail").waitForExistence(timeout: 8))
        tapButton(id: "goal-detail-drill-add-quick-release-builder")
        XCTAssertTrue(waitForToastContaining("Adding drill") || waitForToastContaining("Drill added"))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "goal-detail"])
        XCTAssertTrue(screen("screen-ios-goal-detail").waitForExistence(timeout: 8))
        tapButton(id: "goal-detail-drill-open-quick-release-builder")
        XCTAssertTrue(screen("screen-ios-drill-detail").waitForExistence(timeout: 8))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "settings-hub"])
        XCTAssertTrue(screen("screen-ios-settings-hub").waitForExistence(timeout: 8))
        let editProfileLink = app.buttons["settings-edit-profile-link"]
        XCTAssertTrue(editProfileLink.waitForExistence(timeout: 2))
        editProfileLink.coordinate(withNormalizedOffset: CGVector(dx: 0.18, dy: 0.5)).tap()
        XCTAssertTrue(app.staticTexts["EDIT PLAYER PROFILE"].waitForExistence(timeout: 4))
        assertVisible("Save profile", maxSwipes: 1)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "settings-hub"])
        XCTAssertTrue(screen("screen-ios-settings-hub").waitForExistence(timeout: 8))
        tapControl("Automation")
        assertVisible("Auto-analysis refresh")
        assertVisible("Data backup")
        tapControl("Data and privacy")
        assertVisible("Anonymous analytics")
        assertVisible("Peer comparisons")
        tapControl("Coaching audio cues")
        tapControl("Metric units")
        tapControl("About ShotIQ")
        XCTAssertTrue(app.alerts["ShotIQ 1.0.0"].waitForExistence(timeout: 4))
        app.alerts.buttons["OK"].tap()

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "share-results"])
        XCTAssertTrue(screen("screen-ios-share-results").waitForExistence(timeout: 8))
        for control in ["Share image", "Save image", "Copy", "More"] {
            assertVisible(control)
        }
        tapControl("Copy")
        XCTAssertTrue(screen("share-results-copy-badge").waitForExistence(timeout: 1) ||
                      screen("share-results-copy-feedback").waitForExistence(timeout: 1) ||
                      app.buttons["Copied"].waitForExistence(timeout: 1) ||
                      waitForToastContaining("Copied", timeout: 3))
        tapControl("Share image")
        XCTAssertTrue(app.buttons["Share image"].waitForExistence(timeout: 3))
        tapControl("Save image")
        XCTAssertTrue(app.buttons["Save image"].waitForExistence(timeout: 3))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "media-detail"])
        XCTAssertTrue(screen("screen-ios-media-detail").waitForExistence(timeout: 8))
        tapButton(id: "media-detail-download-button")
        XCTAssertTrue(waitForToastContaining("Saving media summary", timeout: 1) ||
                      waitForToastContaining("Saved to Photos", timeout: 4) ||
                      waitForToastContaining("Photos access needed", timeout: 4) ||
                      waitForToastContaining("Download failed", timeout: 4))
        tapButton(id: "media-detail-delete-button")
        XCTAssertTrue(waitForToastContaining("Delete confirmation"))

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "media-detail"])
        XCTAssertTrue(screen("screen-ios-media-detail").waitForExistence(timeout: 8))
        tapButton(id: "media-detail-delete-media-button")
        XCTAssertTrue(waitForToastContaining("Deleting media", timeout: 1) ||
                      waitForToastContaining("Media removed", timeout: 4))
    }

    func testOnboardingProfileControlsCarryForwardAndPermissionSkipsWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestOnboarding", "-uiTestDemoData"])
        XCTAssertTrue(screen("screen-ios-onboarding-intro").waitForExistence(timeout: 20))
        tapControl("Build my player profile")

        XCTAssertTrue(screen("screen-ios-physical-profile").waitForExistence(timeout: 8))
        tapElement(id: "measurement-age-increase")
        assertStaticText(id: "measurement-age-value", contains: "25")
        tapElement(id: "measurement-age-unit-right")
        assertStaticText(id: "measurement-age-value", contains: "300")
        tapElement(id: "measurement-height-increase")
        tapElement(id: "measurement-height-unit-right")
        assertStaticText(id: "measurement-height-value", contains: "190")
        tapElement(id: "measurement-weight-decrease")
        tapElement(id: "measurement-weight-unit-right")
        assertStaticText(id: "measurement-weight-value", contains: "83")
        tapElement(id: "measurement-wingspan-increase")
        tapElement(id: "measurement-wingspan-unit-right")
        assertStaticText(id: "measurement-wingspan-value", contains: "200")
        tapAndExpect("CONTINUE", destination: "screen-ios-experience-body-type")

        tapControl("BEGINNER")
        tapControl("SLIM / LEAN")
        assertVisible("Beginner")
        tapAndExpect("Continue", destination: "screen-ios-shooting-profile")

        tapControl("LEFT-HANDED")
        tapControl("DEVELOPING")
        tapControl("COMPACT")
        assertVisible("Left-handed", maxSwipes: 1)
        tapAndExpect("Continue", destination: "screen-ios-player-bio")

        tapControl("Enhance bio")
        assertVisible("Write at least 20 characters first", maxSwipes: 1)
        tapControl("Review profile")

        XCTAssertTrue(screen("screen-ios-onboarding-review").waitForExistence(timeout: 8))
        assertVisible("Left-handed", maxSwipes: 2)
        assertVisible("Beginner", maxSwipes: 3)
        tapControl("COACHING FOCUS")
        assertVisible("updates automatically", maxSwipes: 1)

        tapControl("Complete profile")
        if !screen("screen-ios-camera-permission-primer").waitForExistence(timeout: 12) {
            tapControl("Continue without saving")
        }
        XCTAssertTrue(screen("screen-ios-camera-permission-primer").waitForExistence(timeout: 8))
        tapControl("Not now")

        XCTAssertTrue(screen("screen-ios-photo-library-permission").waitForExistence(timeout: 8))
        tapControl("Not now")

        XCTAssertTrue(screen("screen-ios-notification-permission-primer").waitForExistence(timeout: 8))
        tapControl("Not now")
        XCTAssertTrue(waitForAnyScreen([
            "screen-ios-home-new-player",
            "screen-ios-home-standard",
            "screen-ios-home-professional"
        ], timeout: 12))
    }
}
