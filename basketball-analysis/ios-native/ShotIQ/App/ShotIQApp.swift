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

    /// `-uiTestHomeVariant new|standard|pro` forces one of the three canonical
    /// home states (017/018/019) instead of inferring it from history data.
    static var homeVariant: String? {
        guard let i = args.firstIndex(of: "-uiTestHomeVariant"), args.indices.contains(i + 1) else { return nil }
        return args[i + 1]
    }

    /// Any hook at all — used to keep test-only branches out of normal launches.
    static var active: Bool { bypassAuth || startOnboarding || demoData || homeVariant != nil }

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
        try? await Task.sleep(for: .seconds(1.2))
        // A stored access token means a returning user.
        if KeychainStore.read(key: "accessToken") != nil {
            phase = .main
        } else {
            phase = .welcome
        }
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
