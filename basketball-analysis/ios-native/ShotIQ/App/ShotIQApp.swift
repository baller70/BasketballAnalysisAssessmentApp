import SwiftUI

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

    /// Any hook at all — used to keep test-only branches out of normal launches.
    static var active: Bool {
        bypassAuth || startOnboarding || demoData || holdSplash || homeVariant != nil
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
    var body: some View {
        VStack(spacing: 0) {
            Group {
                switch app.tab {
                case .home: NavigationStack { HomeView() }
                case .analyze: NavigationStack { AnalyzeHubView() }
                case .training: NavigationStack { TrainingHomeView() }
                case .progress: NavigationStack { AnalyticsCardsView() }
                case .profile: NavigationStack { ProfileView() }
                }
            }
            .frame(maxHeight: .infinity)
            ShotIQTabBar(tab: $app.tab)
        }
        .background(ShotIQColor.paper)
        .statusBarHidden(true)
    }
}
