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
    private static let args = ProcessInfo.processInfo.arguments

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
                                  "analysis-taking-longer", "analysis-error",
                                  "analytics-cards", "analytics-detailed", "profile",
                                  "player-card", "customize-player-card", "my-media",
                                  "media-detail", "goals", "create-goal", "goal-detail",
                                  "settings-hub", "share-results"]

    /// Any hook at all — used to keep test-only branches out of normal launches.
    static var active: Bool {
        bypassAuth || signedOut || startOnboarding || demoData || holdSplash || noTypeClamp ||
        useSampleMedia || historyFailure || analysisFailure || homeVariant != nil || stage != nil
    }

    static let demoUser = APIUser(id: "uitest", email: "uitest@shotiq.local",
                                  displayName: "Jordan Ellis", firstName: "Jordan",
                                  lastName: "Ellis", profileComplete: true)
}

/// App-level state machine: splash → auth → onboarding → main.
@MainActor
final class AppState: ObservableObject {
    enum Phase { case splash, welcome, main }
    @Published var phase: Phase = .splash
    @Published var user: APIUser?
    @Published var onboardingComplete = false
    @Published var tab: RootTab = .home

    func boot() async {
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

    /// Leave screen 001 for whatever the stored session says comes next. Safe to
    /// call more than once — the first caller wins.
    func leaveSplash() {
        guard phase == .splash else { return }
        // A stored access token means a returning user.
        phase = KeychainStore.read(key: "accessToken") != nil ? .main : .welcome
    }

    func signedIn(_ user: APIUser) {
        self.user = user
        onboardingComplete = user.profileComplete ?? false
        phase = .main
    }

    func signOut() {
        Task { await APIClient.shared.signOut() }
        user = nil
        phase = .welcome
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
        case "photo-review-crop": PhotoReviewCropView(image: UITestHooks.sampleShotImage)
        case "upload-quality-check": UploadQualityCheckView(image: UITestHooks.sampleShotImage)
        case "video-review": VideoReviewView()
        case "live-camera-setup": LiveCameraSetupView()
        case "hoop-calibration": HoopCalibrationView()
        case "readiness-check": ReadinessCheckView()
        case "capture-ready": CaptureReadyView()
        case "live-recording": LiveRecordingView()
        case "live-form-feedback": LiveFormFeedbackView()
        case "shot-detected": ShotDetectedView()
        case "analysis-taking-longer": AnalysisTakingLongerView()
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
