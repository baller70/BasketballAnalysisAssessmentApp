import XCTest

/// Canonical-screen screenshot + click-test harness.
///
/// Two jobs, one pass:
///
/// 1. **Screenshots.** Every canonical screen it can reach is attached to the
///    result bundle as an `XCTAttachment` named `NNN-<slug>` (e.g.
///    `018-home-standard`), so `scripts/simulator-screenshots.sh` can export
///    them to `artifacts/simshots/<name>.png` and diff them against the
///    canonical designs.
///
/// 2. **Click test.** Every control the walk taps is *asserted* to land on the
///    destination screen's `accessibilityIdentifier`. A control that is missing,
///    or a tap that goes nowhere, is recorded and the test fails at the end with
///    the full list — that is the "does every button actually do something"
///    check.
///
/// The app is driven entirely through test-only launch arguments (see
/// `UITestHooks` in ShotIQApp.swift): no account, no credentials, no network.
final class CanonicalScreenshotTests: XCTestCase {

    // MARK: - Run-wide bookkeeping (shared so the manifest test can report it)

    private static var captured: [String] = []
    private static var failures: [String] = []
    private static var skipped: [String] = []
    private static var shotIndex = 0

    /// Signed-in shell with deterministic offline data.
    private static let mainArgs = ["-uiTestBypassAuth", "-uiTestDemoData"]

    private var app: XCUIApplication!

    override func setUp() {
        // Collect every dead tap in one run instead of stopping at the first.
        continueAfterFailure = true
    }

    override func tearDown() {
        app?.terminate()
        app = nil
    }

    // MARK: - Harness

    @discardableResult
    private func launch(_ args: [String]) -> XCUIApplication {
        app?.terminate()
        let a = XCUIApplication()
        a.launchArguments = args
        a.launch()
        app = a
        return a
    }

    private func slug(_ screenID: String) -> String {
        screenID.replacingOccurrences(of: "screen-ios-", with: "")
    }

    /// Attach the current app screenshot under a stable, sortable name.
    private func shot(_ name: String) {
        Self.shotIndex += 1
        let full = String(format: "%03d-%@", Self.shotIndex, name)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = full
        attachment.lifetime = .keepAlways
        add(attachment)
        Self.captured.append(full)
    }

    private func note(_ message: String, required: Bool) {
        if required {
            Self.failures.append(message)
            XCTFail(message)
        } else {
            Self.skipped.append(message)
        }
    }

    /// Does a view carrying this canonical `accessibilityIdentifier` exist?
    private func screenExists(_ id: String, timeout: TimeInterval = 6) -> Bool {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
            .waitForExistence(timeout: timeout)
    }

    /// Assert we are on a canonical screen, and capture it.
    @discardableResult
    private func expectScreen(_ id: String, timeout: TimeInterval = 8,
                              capture: Bool = true, required: Bool = true,
                              context: String = "") -> Bool {
        if screenExists(id, timeout: timeout) {
            if capture { shot(slug(id)) }
            return true
        }
        note("Screen \(id) never appeared\(context.isEmpty ? "" : " (\(context))")", required: required)
        return false
    }

    private func scrollContainer() -> XCUIElement {
        let sv = app.scrollViews.firstMatch
        return sv.exists ? sv : app
    }

    /// Find a tappable control whose label (or identifier) contains `text`,
    /// scrolling the current screen if it is below the fold.
    private func findControl(_ text: String, index: Int = 0, maxSwipes: Int = 5) -> XCUIElement? {
        let predicate = NSPredicate(format: "label CONTAINS[c] %@ OR identifier == %@", text, text)
        for attempt in 0...maxSwipes {
            for query in [app.buttons, app.staticTexts, app.images, app.otherElements] {
                let matches = query.matching(predicate)
                let count = matches.count
                guard count > index else { continue }
                let element = matches.element(boundBy: index)
                if element.exists && element.isHittable { return element }
                if element.exists && attempt == maxSwipes { return element }
            }
            if attempt < maxSwipes { scrollContainer().swipeUp() }
        }
        return nil
    }

    private func tap(_ element: XCUIElement) {
        if element.isHittable {
            element.tap()
        } else {
            element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        }
    }

    /// The click test: tap `control`, then require `destination` to appear.
    @discardableResult
    private func tapAndExpect(_ control: String, _ destination: String,
                              from source: String, index: Int = 0,
                              timeout: TimeInterval = 8,
                              required: Bool = true, capture: Bool = true) -> Bool {
        guard let element = findControl(control, index: index) else {
            note("MISSING CONTROL — “\(control)” was not on \(source); cannot verify it opens \(destination)",
                 required: required)
            return false
        }
        tap(element)
        if screenExists(destination, timeout: timeout) {
            if capture { shot(slug(destination)) }
            return true
        }
        note("DEAD TAP — “\(control)” on \(source) did not open \(destination)", required: required)
        return false
    }

    /// Tab bar buttons carry the canonical short labels.
    private func selectTab(_ label: String) {
        let button = app.buttons[label]
        if button.waitForExistence(timeout: 8) { tap(button) }
    }

    /// Cheap navigation reset: leaving a tab tears its NavigationStack down, so
    /// bouncing off another tab returns the tab to its root screen.
    private func resetTab(_ label: String, root: String) {
        selectTab(label == "Progress" ? "Home" : "Progress")
        selectTab(label)
        _ = screenExists(root, timeout: 8)
    }

    // MARK: - 001-007 · auth

    func test01AuthScreens() {
        // Screen 001 cannot be caught on a timer. XCUITest does not issue its
        // first accessibility query until 15-30s after `launch()` on the CI Mac
        // — in the run that reported this, the app started at t=1.09s and the
        // splash query went out at t=22.63s, 11.1s of which was the runner's own
        // "wait for the app to idle". Any brand hold short enough to ship (1.2s,
        // then 2.5s) is long gone by then, which is why this screen "never
        // appeared" twice. `-uiTestHoldSplash` makes the app hold screen 001
        // until it is tapped instead, so the assertion below means what it says.
        launch(["-uiTestHoldSplash"])
        expectScreen("screen-ios-splash", timeout: 30)
        app.tap() // release the hold — SplashView advances on tap
        expectScreen("screen-ios-welcome", timeout: 15)

        tapAndExpect("Sign in", "screen-ios-sign-in", from: "welcome")
        tapAndExpect("Forgot password?", "screen-ios-forgot-password", from: "sign-in")

        launch([])
        guard expectScreen("screen-ios-welcome", timeout: 15, capture: false) else { return }
        tapAndExpect("Create account", "screen-ios-create-account", from: "welcome")

        // 005 verify-email needs a real sign-up round trip; 007 reset-password
        // has no inbound navigation in the app at all.
        Self.skipped.append("screen-ios-verify-email — only reachable after a successful network sign-up")
        Self.skipped.append("screen-ios-reset-password — no screen in the app navigates to ResetPasswordView")
    }

    // MARK: - 008-016 · onboarding

    func test02OnboardingScreens() {
        launch(["-uiTestBypassAuth", "-uiTestOnboarding", "-uiTestDemoData"])
        guard expectScreen("screen-ios-onboarding-intro", timeout: 20) else { return }

        tapAndExpect("Build my player profile", "screen-ios-physical-profile", from: "onboarding-intro")
        tapAndExpect("CONTINUE", "screen-ios-experience-body-type", from: "physical-profile")
        tapAndExpect("Continue", "screen-ios-shooting-profile", from: "experience-body-type")
        tapAndExpect("Continue", "screen-ios-player-bio", from: "shooting-profile")
        tapAndExpect("Review profile", "screen-ios-onboarding-review", from: "player-bio")

        // "Complete profile" PUTs /api/profile. Signed out that call fails and
        // the screen offers "Continue without saving" — either path must reach
        // the camera primer.
        if let complete = findControl("Complete profile") {
            tap(complete)
            if !screenExists("screen-ios-camera-permission-primer", timeout: 25) {
                if let fallback = findControl("Continue without saving") { tap(fallback) }
            }
        }
        guard expectScreen("screen-ios-camera-permission-primer", timeout: 20) else { return }

        // "Not now" avoids the system permission alerts; the primed screens are
        // what the canonical designs show anyway.
        tapAndExpect("Not now", "screen-ios-photo-library-permission", from: "camera-permission-primer")
        tapAndExpect("Not now", "screen-ios-notification-permission-primer", from: "photo-library-permission")
    }

    // MARK: - 017-020 · home states + profile menu

    func test03HomeScreens() {
        launch(Self.mainArgs + ["-uiTestHomeVariant", "new"])
        guard expectScreen("screen-ios-home-new-player", timeout: 20) else { return }
        tapAndExpect("Analyze your first shot", "screen-ios-analyze-hub", from: "home-new-player", capture: false)
        resetTab("Home", root: "screen-ios-home-new-player")
        tapAndExpect("GET AI ANALYSIS", "screen-ios-no-analysis-yet", from: "home-new-player")
        resetTab("Home", root: "screen-ios-home-new-player")
        tapAndExpect("See capture guide", "screen-ios-capture-guide", from: "home-new-player")

        launch(Self.mainArgs + ["-uiTestHomeVariant", "standard"])
        guard expectScreen("screen-ios-home-standard", timeout: 20) else { return }
        tapAndExpect("View latest analysis", "screen-ios-analysis-result-overview",
                     from: "home-standard", capture: false)
        resetTab("Home", root: "screen-ios-home-standard")
        tapAndExpect("Quick Release Builder", "screen-ios-drill-detail", from: "home-standard")

        launch(Self.mainArgs + ["-uiTestHomeVariant", "pro"])
        guard expectScreen("screen-ios-home-professional", timeout: 20) else { return }
        tapAndExpect("View all", "screen-ios-analytics-detailed", from: "home-professional", capture: false)

        // The gear in the top bar opens the profile menu sheet.
        launch(Self.mainArgs + ["-uiTestHomeVariant", "pro"])
        _ = screenExists("screen-ios-home-professional", timeout: 20)
        tapAndExpect("Menu", "screen-ios-profile-menu", from: "home-professional")
        tapAndExpect("POINTS SYSTEM", "screen-ios-points-system", from: "profile-menu")

        launch(Self.mainArgs + ["-uiTestHomeVariant", "pro"])
        _ = screenExists("screen-ios-home-professional", timeout: 20)
        tapAndExpect("Menu", "screen-ios-profile-menu", from: "home-professional", capture: false)
        tapAndExpect("ELITE SHOOTERS", "screen-ios-elite-shooters", from: "profile-menu")
        tapAndExpect("Klay Thompson", "screen-ios-elite-shooter-detail", from: "elite-shooters")
        tapAndExpect("Compare with my shot", "screen-ios-photo-comparison", from: "elite-shooter-detail")
    }

    // MARK: - 021-035 · capture

    func test04CaptureScreens() {
        launch(Self.mainArgs)
        selectTab("Capture")
        guard expectScreen("screen-ios-analyze-hub", timeout: 20) else { return }

        tapAndExpect("Upload image", "screen-ios-photo-upload-source", from: "analyze-hub")
        resetTab("Capture", root: "screen-ios-analyze-hub")
        tapAndExpect("Upload video", "screen-ios-video-upload", from: "analyze-hub")
        resetTab("Capture", root: "screen-ios-analyze-hub")
        tapAndExpect("Free Throw", "screen-ios-media-detail", from: "analyze-hub")
        resetTab("Capture", root: "screen-ios-analyze-hub")

        // Live capture chain: setup → calibration → readiness → ready →
        // recording (auto-starts) → live feedback.
        tapAndExpect("Live camera", "screen-ios-live-camera-setup", from: "analyze-hub")
        tapAndExpect("Set up camera", "screen-ios-hoop-calibration", from: "live-camera-setup")
        tapAndExpect("Confirm hoop", "screen-ios-readiness-check", from: "hoop-calibration")
        tapAndExpect("Keep position", "screen-ios-capture-ready", from: "readiness-check")
        // CaptureReadyView auto-advances after its 3-second countdown.
        expectScreen("screen-ios-live-recording", timeout: 25)
        tapAndExpect("Stop recording", "screen-ios-live-form-feedback", from: "live-recording")

        // Second pass down the same chain for the "end round" branch.
        resetTab("Capture", root: "screen-ios-analyze-hub")
        tapAndExpect("Live camera", "screen-ios-live-camera-setup", from: "analyze-hub", capture: false)
        tapAndExpect("Skip calibration", "screen-ios-readiness-check", from: "live-camera-setup",
                     required: false, capture: false)
        tapAndExpect("Set up camera", "screen-ios-hoop-calibration", from: "live-camera-setup",
                     required: false, capture: false)
        tapAndExpect("Confirm hoop", "screen-ios-readiness-check", from: "hoop-calibration",
                     required: false, capture: false)
        tapAndExpect("Keep position", "screen-ios-capture-ready", from: "readiness-check", capture: false)
        if screenExists("screen-ios-live-recording", timeout: 25) {
            tapAndExpect("END ROUND", "screen-ios-shot-detected", from: "live-recording")
            tapAndExpect("CONFIRM MAKE", "screen-ios-capture-review", from: "shot-detected")
        }

        // Upload queue → processing → results.
        resetTab("Capture", root: "screen-ios-analyze-hub")
        tapAndExpect("View all", "screen-ios-upload-queue", from: "analyze-hub")
        tapAndExpect("Analyze now", "screen-ios-analysis-processing", from: "upload-queue")
        // AnalysisProcessingView auto-advances when its progress task finishes.
        expectScreen("screen-ios-analysis-result-overview", timeout: 30)

        Self.skipped.append("screen-ios-photo-review-crop / screen-ios-upload-quality-check — need a real photo picked from the simulator library")
    }

    // MARK: - 036-053 · analysis + elite

    func test05AnalysisScreens() {
        launch(Self.mainArgs + ["-uiTestHomeVariant", "standard"])
        guard expectScreen("screen-ios-home-standard", timeout: 20, capture: false) else { return }

        func openResults() -> Bool {
            resetTab("Home", root: "screen-ios-home-standard")
            guard let link = findControl("View latest analysis") else { return false }
            tap(link)
            return screenExists("screen-ios-analysis-result-overview", timeout: 15)
        }

        guard openResults() else {
            note("Could not open the analysis result overview from home-standard", required: true)
            return
        }
        tapAndExpect("View shot breakdown", "screen-ios-shot-breakdown", from: "analysis-result-overview")
        tapAndExpect("Open release frame", "screen-ios-frame-detail-skeleton", from: "shot-breakdown")
        tapAndExpect("Annotations", "screen-ios-annotation-toolbar", from: "frame-detail-skeleton")

        if openResults() {
            tapAndExpect("FORM SCORE", "screen-ios-form-score", from: "analysis-result-overview")
            tapAndExpect("Review weakest metric", "screen-ios-metric-detail", from: "form-score")
        }

        if openResults() {
            tapAndExpect("PRIMARY COACHING TARGET", "screen-ios-flaws-overview", from: "analysis-result-overview")
            tapAndExpect("ELBOW FLARE", "screen-ios-flaw-detail", from: "flaws-overview")
        }

        if openResults() {
            tapAndExpect("KLAY THOMPSON", "screen-ios-elite-match", from: "analysis-result-overview")
            tapAndExpect("Choose another shooter", "screen-ios-elite-shooters",
                         from: "elite-match", capture: false)
        }

        if openResults() {
            tapAndExpect("Share analysis", "screen-ios-share-results", from: "analysis-result-overview")
        }

        Self.skipped.append("screen-ios-analysis-taking-longer — nothing in the app ever sets AnalysisProcessingView's `long` flag")
        Self.skipped.append("screen-ios-analysis-error — AnalysisErrorView has no inbound navigation anywhere in the app")
    }

    // MARK: - 054-062 · training

    func test06TrainingScreens() {
        launch(Self.mainArgs)
        selectTab("Train")
        guard expectScreen("screen-ios-training-home", timeout: 20) else { return }

        tapAndExpect("Quick start", "screen-ios-quick-start", from: "training-home")
        tapAndExpect("Start shot tracking", "screen-ios-drill-execution", from: "quick-start")

        resetTab("Train", root: "screen-ios-training-home")
        tapAndExpect("My drills", "screen-ios-my-drills", from: "training-home")
        tapAndExpect("Discover drills", "screen-ios-discover-drills", from: "my-drills")

        resetTab("Train", root: "screen-ios-training-home")
        tapAndExpect("Calendar", "screen-ios-workout-calendar", from: "training-home")

        resetTab("Train", root: "screen-ios-training-home")
        tapAndExpect("Quick Release Builder", "screen-ios-drill-detail", from: "training-home")
        tapAndExpect("Start drill", "screen-ios-drill-execution", from: "drill-detail", capture: false)
        // "End workout" persists the session first; offline that request fails
        // fast and the completion screen still comes up.
        tapAndExpect("End workout", "screen-ios-workout-completion", from: "drill-execution", timeout: 40)

        resetTab("Train", root: "screen-ios-training-home")
        // The RECENT WORKOUT card is the second "Quick Release Builder" on the
        // page and opens the shot tracker.
        tapAndExpect("Quick Release Builder", "screen-ios-shot-tracker",
                     from: "training-home", index: 1)
    }

    // MARK: - 063-072 · goals, analytics, media, profile

    func test07ProgressAndProfileScreens() {
        launch(Self.mainArgs)
        selectTab("Progress")
        guard expectScreen("screen-ios-analytics-cards", timeout: 20) else { return }
        tapAndExpect("View all", "screen-ios-analytics-detailed", from: "analytics-cards")

        selectTab("Profile")
        guard expectScreen("screen-ios-profile", timeout: 20) else { return }

        tapAndExpect("Player card", "screen-ios-player-card", from: "profile")
        tapAndExpect("Customize card", "screen-ios-customize-player-card", from: "player-card")

        resetTab("Profile", root: "screen-ios-profile")
        tapAndExpect("My media", "screen-ios-my-media", from: "profile")

        resetTab("Profile", root: "screen-ios-profile")
        tapAndExpect("Goals", "screen-ios-goals", from: "profile")
        tapAndExpect("Create goal", "screen-ios-create-goal", from: "goals")

        resetTab("Profile", root: "screen-ios-profile")
        tapAndExpect("Goals", "screen-ios-goals", from: "profile", capture: false)
        tapAndExpect("Keep elbow stacked through release", "screen-ios-goal-detail", from: "goals")

        resetTab("Profile", root: "screen-ios-profile")
        tapAndExpect("Settings", "screen-ios-settings-hub", from: "profile")

        resetTab("Profile", root: "screen-ios-profile")
        tapAndExpect("Share results", "screen-ios-share-results", from: "profile", capture: false)
    }

    // MARK: - manifest + verdict

    func test99Manifest() {
        let manifest = """
        ShotIQ canonical screenshot walk
        ================================
        screenshots captured: \(Self.captured.count)

        \(Self.captured.joined(separator: "\n"))

        not captured / not reachable (\(Self.skipped.count)):
        \(Self.skipped.isEmpty ? "none" : Self.skipped.joined(separator: "\n"))

        dead taps and missing controls (\(Self.failures.count)):
        \(Self.failures.isEmpty ? "none" : Self.failures.joined(separator: "\n"))
        """
        let attachment = XCTAttachment(string: manifest)
        attachment.name = "000-screenshot-manifest"
        attachment.lifetime = .keepAlways
        add(attachment)

        XCTAssertFalse(Self.captured.isEmpty, "The walk captured no screenshots at all")
        XCTAssertTrue(Self.failures.isEmpty,
                      "Click test found \(Self.failures.count) problem(s):\n" +
                      Self.failures.joined(separator: "\n"))
    }
}
