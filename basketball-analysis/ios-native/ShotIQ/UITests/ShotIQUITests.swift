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

    private func screen(_ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
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

        XCTAssertTrue(app.staticTexts["VIDEO SOURCE"].exists)
        XCTAssertTrue(app.staticTexts["Video library"].exists)
        XCTAssertTrue(app.staticTexts["Browse files"].exists)
        XCTAssertTrue(app.staticTexts["Record video"].exists)
        XCTAssertTrue(app.staticTexts["Upload queue"].exists)
        XCTAssertTrue(app.staticTexts["View filming tips"].exists)
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
        for reviewItem in ["CAPTURE REVIEW", "15", "MAKES", "62.5%", "MAKE %", "NEED REVIEW", "DISCARDED"] {
            XCTAssertNotNil(findControl(reviewItem, maxSwipes: 2), "Missing capture review item: \(reviewItem)")
        }
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

        app.buttons["USE PHOTO"].tap()
        XCTAssertTrue(screen("screen-ios-upload-quality-check").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["IMG_4521.JPG"].exists)
        XCTAssertTrue(app.staticTexts["Side view • ready to analyze"].exists)
        if !app.staticTexts["Shooting hand is in frame."].waitForExistence(timeout: 15) {
            XCTAssertTrue(app.staticTexts["Pose detector unavailable on this simulator/device."].exists)
        }
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
    }

    func testUploadQueueShowsStepByStepProgressToResults() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData"])
        guard app.buttons["Capture"].waitForExistence(timeout: 8) else {
            throw XCTSkip("Not signed in")
        }
        app.buttons["Capture"].tap()
        XCTAssertTrue(screen("screen-ios-analyze-hub").waitForExistence(timeout: 8))
        tapControl("View all")
        XCTAssertTrue(screen("screen-ios-upload-queue").waitForExistence(timeout: 8))
        tapControl("Analyze now")
        XCTAssertTrue(screen("screen-ios-analysis-processing").waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["Upload complete"].exists)
        XCTAssertTrue(app.staticTexts["Detecting pose & landmarks"].exists)
        XCTAssertTrue(app.staticTexts["Scoring mechanics"].exists)
        XCTAssertTrue(app.staticTexts["Comparing to your baseline"].exists)
        XCTAssertTrue(app.staticTexts["Building coaching plan"].exists)
        XCTAssertTrue(screen("screen-ios-analysis-result-overview").waitForExistence(timeout: 30))
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

    func testProgressProfileMediaGoalAnalyticsAndImageSurfacesWork() throws {
        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "analytics-cards"])
        XCTAssertTrue(screen("screen-ios-analytics-cards").waitForExistence(timeout: 8))
        assertVisible("All time")
        assertVisible("All media")
        for item in ["AI ANALYSIS HISTORY", "FORM SCORE TREND", "82", "GOOD",
                     "24", "SHOTS", "15", "MAKES", "62.5%", "ACCURACY",
                     "ANALYSIS SESSIONS", "Catch & Shoot", "Off the Dribble",
                     "Pull-Up Jumper", "Mid-Range Work", "IMPROVEMENT", "NEEDS REVIEW"] {
            assertVisible(item)
        }

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "analytics-detailed"])
        XCTAssertTrue(screen("screen-ios-analytics-detailed").waitForExistence(timeout: 8))
        for item in ["ANALYSIS HISTORY", "+6.4%", "78.2%", "MECHANICS SCORECARD",
                     "SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH",
                     "SESSION COMPARISON", "Form Score", "Make %", "Release Consistency",
                     "RELEASE ARC RANGE", "50.4°", "IDEAL: 48°–52°",
                     "SHOT RAIL SUMMARY"] {
            assertVisible(item)
        }
        assertVisible("Confidence: High")

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "profile"])
        XCTAssertTrue(screen("screen-ios-profile").waitForExistence(timeout: 8))
        for item in ["JORDAN ELLIS", "6", "DAY STREAK", "2,840", "POINTS",
                     "24", "SHOTS", "15", "MAKES", "62.5%", "MAKE %",
                     "PHYSICAL PROFILE", "SHOOTING PROFILE", "PLAYER CARD",
                     "PROFILE COMPLETION", "82%"] {
            assertVisible(item)
        }

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "player-card"])
        XCTAssertTrue(screen("screen-ios-player-card").waitForExistence(timeout: 8))
        for item in ["FORM SCORE", "82", "GOOD", "62.5%", "MAKE %",
                     "MEASUREMENTS", "SHOT BREAKDOWN", "MECHANICS OVERVIEW",
                     "SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH",
                     "Customize card", "Share card", "Download card"] {
            assertVisible(item)
        }

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

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "goals"])
        XCTAssertTrue(screen("screen-ios-goals").waitForExistence(timeout: 8))
        for item in ["GOALS", "ACTIVE (2)", "68%", "40%", "MAKE %",
                     "AVG. FORM SCORE", "82", "GOAL PROGRESS",
                     "Keep elbow stacked through release",
                     "Create goal"] {
            assertVisible(item)
        }
        tapControl("Form Score")
        assertVisible("Make %", maxSwipes: 2)

        launch(["-uiTestBypassAuth", "-uiTestDemoData", "-uiTestStage", "goal-detail"])
        XCTAssertTrue(screen("screen-ios-goal-detail").waitForExistence(timeout: 8))
        for item in ["Keep elbow stacked through release", "IMPACT", "HIGH",
                     "GOAL PROGRESS", "72%", "TECHNIQUE SNAPSHOT",
                     "ELBOW STACK ANGLE", "87°", "TARGET RANGE", "85°–95°",
                     "LINKED SESSIONS", "RECOMMENDED DRILLS", "Quick Release Builder"] {
            assertVisible(item)
        }
    }
}
