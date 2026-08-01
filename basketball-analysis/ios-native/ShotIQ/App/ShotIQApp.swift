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

/// App-level state machine: splash → auth → onboarding → main.
@MainActor
final class AppState: ObservableObject {
    enum Phase { case splash, welcome, main }
    @Published var phase: Phase = .splash
    @Published var user: APIUser?
    @Published var onboardingComplete = false
    @Published var tab: RootTab = .home

    func boot() async {
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
