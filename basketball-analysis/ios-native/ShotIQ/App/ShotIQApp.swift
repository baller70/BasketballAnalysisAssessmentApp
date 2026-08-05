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

    /// `-uiTestHomeVariant new|standard|pro` forces one of the three canonical
    /// home states (017/018/019) instead of inferring it from history data.
    static var homeVariant: String? {
        guard let i = args.firstIndex(of: "-uiTestHomeVariant"), args.indices.contains(i + 1) else { return nil }
        return args[i + 1]
    }

    /// `-uiTestStage <slug>` roots the app at one of the seven canonical screens
    /// whose *state* the harness cannot manufacture offline. Each slug is the
    /// screen's canonical slug, so the argument and the screenshot name match:
    ///
    /// | slug                     | screen | what normally gates it              |
    /// |--------------------------|--------|-------------------------------------|
    /// | `verify-email`           | 005    | a real network account sign-up       |
    /// | `reset-password`         | 007    | a reset token from an emailed link   |
    /// | `photo-review-crop`      | 023    | a photo picked from the library      |
    /// | `upload-quality-check`   | 024    | a picked photo/video to inspect      |
    /// | `video-review`           | 027    | a video picked from the library      |
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

    /// The five `stage` slugs that are rendered inside the signed-in tab shell.
    static let mainShellStages = ["photo-review-crop", "upload-quality-check", "video-review",
                                  "analysis-taking-longer", "analysis-error"]

    /// Any hook at all — used to keep test-only branches out of normal launches.
    static var active: Bool {
        bypassAuth || startOnboarding || demoData || holdSplash || homeVariant != nil || stage != nil
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

    /// Test-only: true when `-uiTestStage` names one of the five canonical
    /// screens that live inside this shell but can only be reached from a photo
    /// or video the harness cannot pick (023/024/027) or from an analysis that
    /// runs long or fails (037/040). Always false in a shipped build, because
    /// `UITestHooks.stage` is nil unless a launch argument set it.
    private var isStaged: Bool {
        guard let stage = UITestHooks.stage else { return false }
        return UITestHooks.mainShellStages.contains(stage)
    }

    /// The staged screen, rooted in its own stack so its pushes still work. The
    /// tab bar below it is untouched, which is what canonical 023/024/027/037/040
    /// show. `image: nil` and the no-argument initialisers are the exact states
    /// those renders depict: the canonical review frame, the canonical clip.
    @ViewBuilder private var stagedRoot: some View {
        switch UITestHooks.stage ?? "" {
        case "photo-review-crop": PhotoReviewCropView(image: nil)
        case "upload-quality-check": UploadQualityCheckView()
        case "video-review": VideoReviewView()
        case "analysis-taking-longer": AnalysisTakingLongerView()
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
