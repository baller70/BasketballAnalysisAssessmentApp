import SwiftUI
import UIKit // PhotoReviewCropView's initialiser takes a UIImage?

// Native SwiftUI ShotIQ app — MVVM, async/await, canonical white interface.
// Screen inventory: 72 canonical screens (ios.splash … ios.share-results); every
// view carries its screenId as an accessibilityIdentifier for XCUITest.

@main
struct ShotIQApp: App {
    @StateObject private var app = AppState()
    var body: some Scene {
        WindowGroup {
            RootView()
                .buttonStyle(.plain) // iOS 26 default style tint-washes every Button into a salmon capsule
                .environmentObject(app)
                .tint(ShotIQColor.shotiqOrange)
                .preferredColorScheme(.light) // canonical white interface
                // THE TYPE SCALE IS PART OF THE DESIGN, SO IT DOES NOT FLOAT.
                //
                // Every one of the ~176 type declarations in this app is
                // `Font.custom(_:size:)`, and since iOS 14 that form SCALES WITH
                // THE PHONE'S TEXT SIZE SETTING. Everything around the type —
                // column widths, paddings, glyph sizes, the 853px canonical
                // geometry — is fixed. So on a phone set above the default, the
                // text grows and its containers do not: labels stop fitting,
                // rows sum wider than the screen, and (per the note in
                // CanonicalPhoto.swift) the whole screen ends up wider than the
                // viewport and centred inside it, clipped off BOTH edges with
                // the header wordmark and tab bar cut away.
                //
                // That is what Kevin was looking at, and no simulator capture
                // could ever have shown it: the simulator runs at the default
                // size, so all 74 screenshots came back clean while the app on
                // a real phone was unusable. Same shape of blind spot as the
                // seeded-vs-empty account (ledger rule 36).
                //
                // Clamping to `.large` — the system default — pins the scale the
                // canonical screens were measured at. Smaller settings still
                // apply (text below the design size cannot overflow a fixed
                // frame); larger ones are capped.
                //
                // This is a LAYOUT FIX, NOT AN ACCESSIBILITY POSITION. A player
                // who needs larger text is still not served, and making these 72
                // pixel-specified screens genuinely reflow is a separate piece
                // of work that has to be designed, not bolted on. Until then the
                // app must at least be legible and whole rather than clipped.
                // `-uiTestNoTypeClamp` lifts the clamp so the capture harness
                // can shoot the unclamped arm and prove this is the cause.
                .modifier(CanonicalTypeScale())
                // UI-test launches sometimes need to skip Splash before the
                // splash view's own task has become observable to XCTest.
                .task {
                    if UITestHooks.active {
                        await app.boot()
                    }
                }
        }
    }
}

/// Pins the canonical type scale — see the long note at the call site.
///
/// A plain `.dynamicTypeSize(...)` cannot be made conditional inline (there is
/// no optional-range overload), so the branch lives in a modifier. Both arms
/// must exist for the falsification to be runnable: with the clamp the app
/// holds its measured layout, without it the capture harness reproduces the
/// overflow, and a run that shows no difference between the two arms would
/// mean this diagnosis is wrong.
struct CanonicalTypeScale: ViewModifier {
    // Explicit @ViewBuilder: the two arms return different concrete types, and
    // this repo has no Swift toolchain to catch it if the protocol requirement
    // does not propagate the builder on the toolchain that actually compiles.
    @ViewBuilder
    func body(content: Content) -> some View {
        if UITestHooks.noTypeClamp {
            content
        } else {
            content.dynamicTypeSize(...DynamicTypeSize.large)
        }
    }
}

/// Test-only launch hooks. Every switch here is read from
/// `ProcessInfo.processInfo.arguments`, which only an XCUITest harness (or a
/// developer typing them into a scheme) can set — a shipped build launched by
/// SpringBoard never carries them, so none of this is reachable in production.
/// See ShotIQ/UITests/CanonicalScreenshotTests.swift.
enum UITestHooks {
    private static let args = ProcessInfo.processInfo.arguments +
        (ProcessInfo.processInfo.environment["SHOTIQ_UI_TEST_ARGS"]?
            .split(separator: "|")
            .map(String.init) ?? [])

    /// Skip splash/auth and drop straight into the signed-in tab shell.
    static var bypassAuth: Bool { args.contains("-uiTestBypassAuth") }

    /// Clear stored tokens and drop straight into the signed-out auth stack.
    static var signedOut: Bool { args.contains("-uiTestSignedOut") }

    /// Land in the onboarding flow instead of the main tabs (implies bypass).
    static var startOnboarding: Bool { args.contains("-uiTestOnboarding") }

    /// Seed deterministic in-memory data so screens that normally need the
    /// backend render their populated state with no network at all.
    static var demoData: Bool { args.contains("-uiTestDemoData") }

    /// Hold screen 001 until the harness taps through instead of releasing it on
    /// a clock.
    ///
    /// A timed brand moment cannot be observed by XCUITest. Measured on the CI
    /// Mac (result bundle for run 30737235481, test01): the app is launched at
    /// t=1.09s, "Setting up automation session" finishes at t=11.52s, the
    /// runner's own "Wait for com.baller70.shotiq to idle" then eats a further
    /// 11.1s, and the first accessibility query for `screen-ios-splash` is not
    /// issued until t=22.63s. Later launches in the same run reach their first
    /// query between 15s and 28s. No hold that a real user would tolerate — 1.2s
    /// before, 2.5s after — survives that, which is why the splash "never
    /// appeared" twice running. With this hook the splash waits for an event
    /// instead of a timer, so the walk is deterministic on any machine.
    static var holdSplash: Bool { args.contains("-uiTestHoldSplash") }

    /// Lift the canonical Dynamic Type clamp, so a capture run can shoot the
    /// app the way a phone set above the default text size draws it.
    ///
    /// This exists to make the clamp FALSIFIABLE rather than asserted. The
    /// claim is that unclamped type is what pushed screens wider than the
    /// viewport on Kevin's phone; the test of that claim is to boot the
    /// simulator at an accessibility content size and capture both arms. If the
    /// clamped and unclamped sets come back the same, the diagnosis is wrong
    /// and the real cause is still out there.
    static var noTypeClamp: Bool { args.contains("-uiTestNoTypeClamp") }

    /// Feed the staged media screens with the bundled full-body shooter photo
    /// instead of their empty canonical placeholders. This lets the simulator
    /// prove the real-image path, including pose/framing feedback, without
    /// needing to operate the system photo picker.
    static var useSampleMedia: Bool { args.contains("-uiTestSampleMedia") }

    /// `-uiTestHomeVariant new|standard|pro` forces one of the three canonical
    /// home states (017/018/019) instead of inferring it from history data.
    static var homeVariant: String? {
        guard let i = args.firstIndex(of: "-uiTestHomeVariant"), args.indices.contains(i + 1) else { return nil }
        return args[i + 1]
    }

    /// Optional asset name paired with `-uiTestSampleMedia`, so the simulator can
    /// prove the pose path with a sample that Vision recognizes on iOS.
    static var sampleMediaName: String {
        guard let i = args.firstIndex(of: "-uiTestSampleMediaName"), args.indices.contains(i + 1) else {
            return "photo-068-visual-004"
        }
        return args[i + 1]
    }

    /// Force the history endpoint branch to fail for production-path proof.
    /// Without this hook the simulator can only prove an empty account, not the
    /// more dangerous case where a backend error was being mistaken for empty.
    static var historyFailure: Bool { args.contains("-uiTestHistoryFailure") }

    /// Force the photo-analysis submission to fail after a selected image has
    /// loaded, proving screen 040 preserves media for retry/reframe paths.
    static var analysisFailure: Bool { args.contains("-uiTestAnalysisFailure") }

    /// Force a deterministic pose into the local analysis DTO so the simulator
    /// can prove downstream pose rendering even when Vision weights are absent.
    static var forceSamplePose: Bool { args.contains("-uiTestForceSamplePose") }

    /// Seed analysis screens with measured-but-weak mechanics so simulator
    /// proof can verify derived flaws instead of canonical demo flaws.
    static var weakAnalysis: Bool { args.contains("-uiTestWeakAnalysis") }

    /// Seed more than one elite shooter so focused proof can verify selected
    /// shooter detail state instead of the one-row canonical screenshot path.
    static var eliteShooterCatalog: Bool { args.contains("-uiTestEliteShooterCatalog") }

    /// Clear locally persisted annotation proof data before a focused toolbar
    /// test. Normal launches never pass this flag.
    static var resetAnnotations: Bool { args.contains("-uiTestResetAnnotations") }

    /// Clear locally persisted saved-drill proof data before focused training
    /// catalog tests. Normal launches never pass this flag.
    static var resetTrainingDrills: Bool { args.contains("-uiTestResetTrainingDrills") }

    /// Clear locally persisted completed-workout proof data before focused
    /// shot-tracker tests. Normal launches never pass this flag.
    static var resetTrainingWorkouts: Bool { args.contains("-uiTestResetTrainingWorkouts") }

    /// Clear locally persisted created-goal proof data before focused goals
    /// tests. Normal launches never pass this flag.
    static var resetCreatedGoals: Bool { args.contains("-uiTestResetCreatedGoals") }

    /// Expose route-only Goals proof buttons for focused functional coverage.
    /// Normal launches and canonical screenshot tests never pass this flag.
    static var goalsRouteProof: Bool { args.contains("-uiTestGoalsRouteProof") }

    /// Clear locally persisted settings proof data before focused settings
    /// tests. Normal launches never pass this flag.
    static var resetSettings: Bool { args.contains("-uiTestResetSettings") }

    /// Launch media-gated staged screens empty so functional tests can prove
    /// customer feedback instead of using the canonical screenshot sample.
    static var noMedia: Bool { args.contains("-uiTestNoMedia") }

    /// `-uiTestStage <slug>` roots the app at one of the canonical screens
    /// whose *state* the harness cannot manufacture offline. Each slug is the
    /// screen's canonical slug, so the argument and the screenshot name match:
    ///
    /// | slug                     | screen | what normally gates it              |
    /// |--------------------------|--------|-------------------------------------|
    /// | `verify-email`           | 005    | a real network account sign-up       |
    /// | `reset-password`         | 007    | a reset token from an emailed link   |
    /// | `photo-upload-source`    | 022    | signed-in photo intake               |
    /// | `photo-review-crop`      | 023    | a photo picked from the library      |
    /// | `upload-quality-check`   | 024    | a picked photo/video to inspect      |
    /// | `video-review`           | 027    | a video picked from the library      |
    /// | `live-camera-setup`      | 028    | camera permission / live capture     |
    /// | `hoop-calibration`       | 029    | camera setup                         |
    /// | `readiness-check`        | 030    | hoop/camera setup                    |
    /// | `capture-ready`          | 031    | readiness confirmation               |
    /// | `live-recording`         | 032    | camera capture session               |
    /// | `live-form-feedback`     | 033    | live coaching feedback               |
    /// | `shot-detected`          | 034    | live detector event                  |
    /// | `analysis-taking-longer` | 037    | analysis slower than the watchdog    |
    /// | `analysis-error`         | 040    | an analyze/upload round trip failing |
    ///
    /// The two auth slugs root `AuthFlowView` (canonical 005/007 have no tab
    /// bar); the other five root the current tab inside `MainTabView`, which is
    /// why they keep the tab bar the canonical renders show. Like every hook
    /// here this reads `ProcessInfo.processInfo.arguments`, so a SpringBoard
    /// launch always sees `nil` and every branch guarded by it is dead code in a
    /// shipped build.
    static var stage: String? {
        guard let i = args.firstIndex(of: "-uiTestStage"), args.indices.contains(i + 1) else { return nil }
        return args[i + 1]
    }

    /// The `stage` slugs that are rendered inside the signed-in tab shell.
    static let mainShellStages = ["analyze-hub", "photo-upload-source", "photo-review-crop", "upload-quality-check", "video-review",
                                  "live-camera-setup", "hoop-calibration", "readiness-check",
                                  "capture-ready", "live-recording", "live-form-feedback", "shot-detected",
                                  "analysis-processing", "analysis-taking-longer",
                                  "analysis-result-overview", "analysis-error",
                                  "flaws-overview",
                                  "training-home", "quick-start", "discover-drills", "drill-detail", "my-drills",
                                  "workout-calendar", "shot-tracker", "workout-completion",
                                  "analytics-cards", "analytics-detailed", "profile",
                                  "player-card", "customize-player-card", "my-media",
                                  "media-detail", "goals", "create-goal", "goal-detail",
                                  "settings-hub", "share-results"]

    /// Any hook at all — used to keep test-only branches out of normal launches.
    static var active: Bool {
        bypassAuth || signedOut || startOnboarding || demoData || holdSplash || noTypeClamp ||
        useSampleMedia || historyFailure || analysisFailure || weakAnalysis || eliteShooterCatalog ||
        resetAnnotations || resetTrainingDrills || resetTrainingWorkouts || resetCreatedGoals || resetSettings || noMedia ||
        homeVariant != nil || stage != nil
    }

    static let demoUser = APIUser(id: "uitest", email: "uitest@shotiq.local",
                                  displayName: "Jordan Ellis", firstName: "Jordan",
                                  lastName: "Ellis", profileComplete: true)
}

/// App-level state machine: splash → auth → onboarding → main.
@MainActor
struct ShotIQRecentMediaEntry: Identifiable, Equatable, Codable {
    var id: String
    var title: String
    var kind: String
    var durationText: String
    var analysis: ShotIQAnalysisResultDTO
}

final class AppState: ObservableObject {
    enum Phase { case splash, welcome, main }
    @Published var phase: Phase = .splash
    @Published var user: APIUser?
    @Published var onboardingComplete = false
    @Published var tab: RootTab = .home
    @Published var recentMedia: [ShotIQRecentMediaEntry] = [] {
        didSet { persistRecentMedia() }
    }
    private var sessionHydrationStarted = false
    private static let recentMediaKey = "shotiq.recentMedia.v1"

    init() {
        applyUITestResets()
        if !UITestHooks.active {
            recentMedia = Self.loadPersistedRecentMedia()
        }

        if UITestHooks.stage == "verify-email" || UITestHooks.stage == "reset-password" {
            phase = .welcome
        } else if UITestHooks.signedOut {
            KeychainStore.delete(key: "accessToken")
            KeychainStore.delete(key: "refreshToken")
            user = nil
            onboardingComplete = false
            phase = .welcome
        } else if UITestHooks.bypassAuth || UITestHooks.startOnboarding {
            user = UITestHooks.demoUser
            onboardingComplete = !UITestHooks.startOnboarding
            phase = .main
        }
        seedUITestAnalysisIfNeeded()
    }

    func rememberAnalysisMedia(_ analysis: ShotIQAnalysisResultDTO, title: String? = nil) {
        let existing = recentMedia.first { entry in
            entry.id == analysis.id
            || (analysis.clientSessionId != nil && entry.analysis.clientSessionId == analysis.clientSessionId)
        }
        let mergedAnalysis = existing.map { Self.mergeAnalysis(incoming: analysis, existing: $0.analysis) } ?? analysis
        let kind = mergedAnalysis.media.type?.lowercased() == "video" ? "Videos" : "Images"
        let entry = ShotIQRecentMediaEntry(
            id: mergedAnalysis.id,
            title: title ?? existing?.title ?? (kind == "Videos" ? "Analyzed Video" : "Analyzed Photo"),
            kind: kind,
            durationText: existing?.durationText ?? (kind == "Videos" ? "clip" : "photo"),
            analysis: mergedAnalysis)
        recentMedia.removeAll { existingEntry in
            existingEntry.id == entry.id
            || (entry.analysis.clientSessionId != nil && existingEntry.analysis.clientSessionId == entry.analysis.clientSessionId)
        }
        recentMedia.insert(entry, at: 0)
        if recentMedia.count > 24 {
            recentMedia = Array(recentMedia.prefix(24))
        }
    }

    private static func mergeAnalysis(incoming: ShotIQAnalysisResultDTO,
                                      existing: ShotIQAnalysisResultDTO) -> ShotIQAnalysisResultDTO {
        var merged = incoming
        if merged.media.localVideoUrl?.isEmpty != false {
            merged.media.localVideoUrl = existing.media.localVideoUrl
        }
        if merged.media.localImageUrl?.isEmpty != false {
            merged.media.localImageUrl = existing.media.localImageUrl
        }
        if merged.media.videoUrl?.isEmpty != false {
            merged.media.videoUrl = existing.media.videoUrl
        }
        if merged.media.displayImageUrl?.isEmpty != false {
            merged.media.displayImageUrl = existing.media.displayImageUrl
        }
        if merged.media.annotatedImageUrl?.isEmpty != false {
            merged.media.annotatedImageUrl = existing.media.annotatedImageUrl
        }
        if merged.media.imageUrl?.isEmpty != false {
            merged.media.imageUrl = existing.media.imageUrl
        }
        if merged.pose == nil {
            merged.pose = existing.pose
        }
        if merged.bodyPositions?.isEmpty != false {
            merged.bodyPositions = existing.bodyPositions
        }
        return merged
    }

    func boot() async {
        applyUITestResets()
        guard phase == .splash else { return }
        // Test-only: the two auth stages (005 verify-email, 007 reset-password)
        // live inside the signed-out stack, so hand straight to it rather than
        // waiting out the splash hold. See UITestHooks.stage.
        if UITestHooks.stage == "verify-email" || UITestHooks.stage == "reset-password" {
            phase = .welcome
            return
        }
        // Test-only: force a signed-out auth shell regardless of simulator
        // keychain state, so smoke tests do not depend on earlier app launches.
        if UITestHooks.signedOut {
            KeychainStore.delete(key: "accessToken")
            KeychainStore.delete(key: "refreshToken")
            user = nil
            onboardingComplete = false
            phase = .welcome
            return
        }
        // Test-only: jump past splash + sign-in so the screenshot harness can
        // walk the signed-in app without credentials or a network round trip.
        if UITestHooks.bypassAuth || UITestHooks.startOnboarding {
            user = UITestHooks.demoUser
            onboardingComplete = !UITestHooks.startOnboarding
            phase = .main
            seedUITestAnalysisIfNeeded()
            return
        }
        // Canonical 001 is a real screen, not a flash: hold the brand moment long
        // enough to be seen (and screenshotted) before the phase switch.
        //
        // Test-only: under -uiTestHoldSplash the hold is released by a tap on the
        // splash rather than by the clock, because the harness cannot query the
        // screen for 15-30s after launch (see UITestHooks.holdSplash). The
        // ceiling is only a backstop so a stray flag can never wedge the app.
        try? await Task.sleep(for: .seconds(UITestHooks.holdSplash ? 120.0 : 2.5))
        leaveSplash()
    }

    private func applyUITestResets() {
        if UITestHooks.resetAnnotations {
            UserDefaults.standard.removeObject(forKey: "shotiq.annotations.frame43.v1")
        }
        if UITestHooks.resetTrainingDrills {
            UserDefaults.standard.removeObject(forKey: "shotiq.training.savedDrills.v1")
        }
        if UITestHooks.resetTrainingWorkouts {
            UserDefaults.standard.removeObject(forKey: "shotiq.training.completedWorkouts.v1")
        }
        if UITestHooks.resetCreatedGoals {
            UserDefaults.standard.removeObject(forKey: CreatedGoalStore.key)
        }
        if UITestHooks.resetSettings {
            for key in ["notifications", "coachingAudio", "units", "autoAnalysis",
                        "dataBackup", "anonAnalytics", "peerComparisons"] {
                UserDefaults.standard.removeObject(forKey: key)
            }
        }
    }

    private func seedUITestAnalysisIfNeeded() {
        guard UITestHooks.weakAnalysis,
              recentMedia.contains(where: { $0.id == "ios-ui-test-weak-analysis" }) == false else { return }
        rememberAnalysisMedia(ShotIQLocalAnalysisFactory.uiTestWeakAnalysis(),
                              title: "Weak mechanics proof")
    }

    /// Leave screen 001 for whatever the stored session says comes next. Safe to
    /// call more than once — the first caller wins.
    func leaveSplash() {
        guard phase == .splash else { return }
        guard KeychainStore.read(key: "accessToken") != nil else {
            phase = .welcome
            return
        }
        // A stored access token means a returning user, but the tabs still need
        // the current profile and latest repo-backed analysis contract.
        phase = .main
        hydrateSignedInSessionIfNeeded()
    }

    func signedIn(_ user: APIUser) {
        self.user = user
        onboardingComplete = user.profileComplete ?? false
        phase = .main
        sessionHydrationStarted = false
        hydrateSignedInSessionIfNeeded()
    }

    func signOut() {
        Task { await APIClient.shared.signOut() }
        user = nil
        recentMedia = []
        Self.clearPersistedRecentMedia()
        sessionHydrationStarted = false
        phase = .welcome
    }

    private static func loadPersistedRecentMedia() -> [ShotIQRecentMediaEntry] {
        guard let data = UserDefaults.standard.data(forKey: recentMediaKey),
              let entries = try? JSONDecoder().decode([ShotIQRecentMediaEntry].self, from: data) else {
            return []
        }
        return Array(entries.prefix(24))
    }

    private func persistRecentMedia() {
        guard !UITestHooks.active else { return }
        if recentMedia.isEmpty {
            Self.clearPersistedRecentMedia()
            return
        }
        if let data = try? JSONEncoder().encode(recentMedia) {
            UserDefaults.standard.set(data, forKey: Self.recentMediaKey)
        }
    }

    private static func clearPersistedRecentMedia() {
        UserDefaults.standard.removeObject(forKey: recentMediaKey)
    }

    private func hydrateSignedInSessionIfNeeded() {
        guard !UITestHooks.active else {
            seedUITestAnalysisIfNeeded()
            return
        }
        guard !sessionHydrationStarted else { return }
        sessionHydrationStarted = true

        Task {
            async let profile: APIProfileDTO? = try? APIClient.shared.profile()
            async let latest: ShotIQAnalysisResultDTO? = try? APIClient.shared.latestAnalysis()

            if let loadedProfile = await profile {
                await MainActor.run {
                    var merged = self.user ?? APIUser()
                    merged.email = loadedProfile.email ?? merged.email
                    merged.displayName = loadedProfile.displayName ?? merged.displayName
                    merged.firstName = loadedProfile.firstName ?? merged.firstName
                    merged.lastName = loadedProfile.lastName ?? merged.lastName
                    merged.profileComplete = loadedProfile.profileComplete ?? merged.profileComplete
                    self.user = merged
                    if let complete = loadedProfile.profileComplete {
                        self.onboardingComplete = complete
                    }
                }
            }

            if let latestAnalysis = await latest {
                await MainActor.run {
                    let isVideo = latestAnalysis.media.type?.lowercased() == "video"
                    self.rememberAnalysisMedia(latestAnalysis,
                                               title: isVideo ? "Latest Video Analysis" : "Latest Photo Analysis")
                }
            }
        }
    }
}

struct RootView: View {
    @EnvironmentObject var app: AppState
    var body: some View {
        switch app.phase {
        case .splash: SplashView()
        case .welcome: AuthFlowView()
        case .main:
            if app.onboardingComplete { MainTabView() } else { OnboardingFlowView() }
        }
    }
}

/// Main shell: canonical 5-tab layout, each tab a NavigationStack reaching
/// every secondary screen in its flow.
struct MainTabView: View {
    @EnvironmentObject var app: AppState

    /// Test-only: true when `-uiTestStage` names one of the canonical
    /// screens that live inside this shell but can only be reached from a photo
    /// or video the harness cannot pick (023/024/027), from a camera/hoop
    /// state (028-034), from an analysis that runs long or fails (037/040), or
    /// from long-scroll profile/progress surfaces that need direct proof entry.
    /// Always false in a shipped build, because
    /// `UITestHooks.stage` is nil unless a launch argument set it.
    private var isStaged: Bool {
        guard let stage = UITestHooks.stage else { return false }
        return UITestHooks.mainShellStages.contains(stage)
    }

    /// The staged screen, rooted in its own stack so its pushes still work. The
    /// tab bar below it is untouched, which is what canonical staged screens
    /// show. `image: nil` and the no-argument initialisers are the exact states
    /// those renders depict: the canonical review frame, the canonical clip.
    @ViewBuilder private var stagedRoot: some View {
        switch UITestHooks.stage ?? "" {
        case "analyze-hub": AnalyzeHubView()
        case "photo-upload-source": PhotoUploadSourceView()
        case "photo-review-crop": PhotoReviewCropView(image: UITestHooks.noMedia ? nil : UITestHooks.sampleShotImage)
        case "upload-quality-check": UploadQualityCheckView(image: UITestHooks.noMedia ? nil : UITestHooks.sampleShotImage)
        case "video-review": VideoReviewView()
        case "live-camera-setup": LiveCameraSetupView()
        case "hoop-calibration": HoopCalibrationView()
        case "readiness-check": ReadinessCheckView()
        case "capture-ready": CaptureReadyView()
        case "live-recording": LiveRecordingView()
        case "live-form-feedback": LiveFormFeedbackView()
        case "shot-detected": ShotDetectedView()
        case "analysis-processing": AnalysisProcessingView(initialResult: ShotIQLocalAnalysisFactory.uiTestWeakAnalysis())
        case "analysis-taking-longer": AnalysisTakingLongerView()
        case "analysis-result-overview": AnalysisResultOverviewView(initialResult: ShotIQLocalAnalysisFactory.uiTestWeakAnalysis())
        case "flaws-overview": FlawsOverviewView(presentation: AnalysisResultPresentation(result: ShotIQLocalAnalysisFactory.uiTestWeakAnalysis()))
        case "training-home": TrainingHomeView()
        case "quick-start": QuickStartView()
        case "discover-drills": DiscoverDrillsView()
        case "drill-detail": DrillDetailView(name: "STACK & SHOOT")
        case "my-drills": MyDrillsView()
        case "workout-calendar": WorkoutCalendarView()
        case "shot-tracker": ShotTrackerView()
        case "workout-completion": WorkoutCompletionView()
        case "analytics-cards": AnalyticsCardsView()
        case "analytics-detailed": AnalyticsDetailedView()
        case "profile": ProfileView()
        case "player-card": PlayerCardView()
        case "customize-player-card": CustomizePlayerCardView()
        case "my-media": MyMediaView()
        case "media-detail": MediaDetailView()
        case "goals": GoalsView()
        case "create-goal": CreateGoalView()
        case "goal-detail":
            GoalDetailView(goal: GoalRecord(
                id: "uitest-goal",
                name: "Keep elbow stacked through release",
                description: "Keep your shooting elbow stacked under the ball through release for a repeatable shot.",
                targetValue: 100,
                currentValue: 72,
                unit: "%",
                category: "Form",
                xpReward: 250
            ))
        case "settings-hub": SettingsHubView()
        case "share-results": ShareResultsView()
        // "analysis-error" is the only slug left; a `default` arm keeps the
        // ViewBuilder's conditional chain one branch shorter.
        default: AnalysisErrorView()
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            Group {
                if isStaged {
                    NavigationStack { stagedRoot }
                } else {
                    switch app.tab {
                    case .home: NavigationStack { HomeView() }
                    case .analyze: NavigationStack { AnalyzeHubView() }
                    case .training: NavigationStack { TrainingHomeView() }
                    case .progress: NavigationStack { AnalyticsCardsView() }
                    case .profile: NavigationStack { ProfileView() }
                    }
                }
            }
            .frame(maxHeight: .infinity)
            ShotIQTabBar(tab: $app.tab)
        }
        .background(ShotIQColor.paper)
        .statusBarHidden(true)
    }
}

extension UITestHooks {
    static var sampleShotImage: UIImage? {
        useSampleMedia ? UIImage(named: sampleMediaName) : nil
    }
}
