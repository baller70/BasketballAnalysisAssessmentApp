import SwiftUI

// Home flow — screens 017-020. Three canonical home states driven by real
// history data (new player / standard / professional) plus the profile menu.

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var stats: HistoryStats?
    @Published var recent: [AnalysisSummary] = []
    @Published var loading = true
    func load() async {
        defer { loading = false }
        if let r = try? await APIClient.shared.history() {
            stats = r.stats; recent = Array(r.items.prefix(3))
        }
    }
    var hasData: Bool { (stats?.totalAnalyses ?? 0) > 0 }
    var score: Int? { stats.flatMap { $0.latestScore ?? $0.averageScore }.map { Int($0.rounded()) } }
}

struct HomeView: View {
    @StateObject private var vm = HomeViewModel()
    @State private var showMenu = false
    @AppStorage("homeVariant") private var pro = true

    var body: some View {
        Group {
            if vm.loading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if !vm.hasData {
                HomeNewPlayerView(vm: vm, showMenu: $showMenu)
            } else if pro {
                HomeProfessionalView(vm: vm, showMenu: $showMenu)
            } else {
                HomeStandardView(vm: vm, showMenu: $showMenu)
            }
        }
        .task { await vm.load() }
        .sheet(isPresented: $showMenu) { ProfileMenuView() }
    }
}

struct HomeHeader: View {
    @Binding var showMenu: Bool
    @EnvironmentObject var app: AppState
    var body: some View {
        HStack {
            Wordmark(size: 28)
            Spacer()
            StatBlock(value: "6", label: "STREAK", valueSize: 20)
            StatBlock(value: "2,840", label: "POINTS", valueSize: 20).padding(.leading, 14)
            Button { showMenu = true } label: {
                Circle().fill(ShotIQColor.rule).frame(width: 38, height: 38)
                    .overlay(Text(shotiqInitials(app.user)).font(.system(size: 12, weight: .bold)).foregroundStyle(ShotIQColor.graphite))
            }
            .accessibilityLabel("Profile menu")
            .padding(.leading, 10)
        }
        .padding(.horizontal, 20).padding(.top, 16)
    }
}

struct HomeNewPlayerView: View {   // 017
    @ObservedObject var vm: HomeViewModel
    @Binding var showMenu: Bool
    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-new-player") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HomeHeader(showMenu: $showMenu)
                    Text("WELCOME TO SHOTIQ").shotiqDisplay(40).padding(.horizontal, 20).padding(.top, 24)
                    Text("Run your first analysis to unlock your Shot Room.")
                        .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 6)
                    ShotIQCard {
                        VStack(spacing: 14) {
                            PhaseStrip()
                            Text("No analyses yet").shotiqBody(17, weight: .semibold)
                            Text("Capture or upload a shot to see your form score, flaws and elite comparison.")
                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                .multilineTextAlignment(.center)
                            NavigationLink { AnalyzeHubView() } label: {
                                Text("Analyze my first shot").frame(maxWidth: .infinity).frame(height: 52)
                                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                                    .foregroundStyle(.white).font(.system(size: 16, weight: .medium))
                            }
                        }
                        .padding(20)
                    }
                    .padding(20)
                    SectionLabel(text: "HOW IT WORKS").padding(.horizontal, 20)
                    ForEach([("camera", "Capture", "Record from any angle with your phone."),
                             ("chart.xyaxis.line", "Analyze", "AI detects mechanics and scores your shot."),
                             ("figure.run", "Train", "Get personalized drills to improve faster."),
                             ("chart.line.uptrend.xyaxis", "Track", "Monitor progress and stay on target.")], id: \.1) { icon, t, d in
                        HStack(spacing: 14) {
                            Image(systemName: icon).font(.system(size: 22)).frame(width: 36)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(t).shotiqBody(15, weight: .semibold)
                                Text(d).font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(.horizontal, 20).padding(.vertical, 10)
                    }
                }
            }
        }
    }
}

struct HomeStandardView: View {    // 018
    @ObservedObject var vm: HomeViewModel
    @Binding var showMenu: Bool
    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-standard") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HomeHeader(showMenu: $showMenu)
                    Text("DASHBOARD").shotiqDisplay(42).padding(.horizontal, 20).padding(.top, 22)
                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 10) {
                            SectionLabel(text: "FORM SCORE")
                            HStack(alignment: .bottom) {
                                Text("\(vm.score ?? 0)")
                                    .font(.custom("DINCondensed-Bold", size: 64))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                Spacer()
                                TrendLine(points: [3, 2.5, 3.6, 3, 4.4]).frame(width: 110, height: 40)
                            }
                            ScoreBar(pct: Double(vm.score ?? 0) / 100)
                            Text("GOOD — keep building consistency.")
                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.analysisBlue)
                        }
                        .padding(18)
                    }
                    .padding(20)
                    SectionLabel(text: "RECENT ANALYSES").padding(.horizontal, 20)
                    ForEach(vm.recent) { a in
                        NavigationLink { AnalysisResultOverviewView() } label: {
                            HStack(spacing: 14) {
                                MediaSurface(height: 56).frame(width: 92)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(a.title ?? "Shot analysis").shotiqBody(15, weight: .semibold)
                                    Text(a.shotType ?? "Catch & Shoot").font(.system(size: 12))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Text("\(Int(a.score ?? 0))").font(.custom("DINCondensed-Bold", size: 26))
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .padding(.horizontal, 20).padding(.vertical, 8)
                        }
                    }
                }
            }
        }
    }
}

struct HomeProfessionalView: View { // 019
    @ObservedObject var vm: HomeViewModel
    @Binding var showMenu: Bool
    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-professional") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HomeHeader(showMenu: $showMenu)
                    Text("TODAY'S SHOT ROOM").shotiqDisplay(40).padding(.horizontal, 20).padding(.top, 22)
                    Text(Date.now.formatted(date: .complete, time: .omitted))
                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite).padding(.horizontal, 20)
                    MediaSurface(height: 220).padding(20)
                    PhaseStrip().padding(.horizontal, 20)
                    HStack(spacing: 22) {
                        StatBlock(value: "\(vm.score ?? 0)", label: "FORM SCORE",
                                  color: ShotIQColor.shotiqOrange, valueSize: 44)
                        StatBlock(value: "24", label: "SHOTS", valueSize: 30)
                        StatBlock(value: "15", label: "MAKES", valueSize: 30)
                        StatBlock(value: "62.5%", label: "MAKE %", valueSize: 30)
                    }
                    .padding(20)
                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 8) {
                            SectionLabel(text: "PRIMARY COACHING TARGET")
                            Text("Keep elbow stacked through release").shotiqBody(17, weight: .semibold)
                            HStack {
                                Text("ACTIVE GOAL").font(.system(size: 10, weight: .bold))
                                    .padding(.horizontal, 8).padding(.vertical, 3)
                                    .overlay(RoundedRectangle(cornerRadius: 4).stroke(ShotIQColor.confirmGreen))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                Spacer()
                                Text("72%").font(.custom("DINCondensed-Bold", size: 18))
                            }
                            ScoreBar(pct: 0.72, color: ShotIQColor.confirmGreen)
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20)
                    NavigationLink { AnalyzeHubView() } label: {
                        Text("Analyze shot").frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                    }
                    .padding(20)
                }
            }
        }
    }
}

struct ProfileMenuView: View {      // 020
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        CanonicalScreen(testID: "screen-ios-profile-menu") {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 14) {
                    Circle().fill(ShotIQColor.rule).frame(width: 54, height: 54)
                        .overlay(Text("JE").font(.system(size: 16, weight: .bold)).foregroundStyle(ShotIQColor.graphite))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(app.user?.displayName ?? "Jordan Ellis").shotiqBody(17, weight: .semibold)
                        Text(app.user?.email ?? "").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                    }
                    Spacer()
                }
                .padding(20)
                ForEach([("person.crop.square", "Player card"), ("gearshape", "Settings"),
                         ("photo.stack", "My media"), ("trophy", "Achievements"),
                         ("square.and.arrow.up", "Share results")], id: \.1) { icon, t in
                    HStack(spacing: 14) {
                        Image(systemName: icon).frame(width: 30)
                        Text(t).shotiqBody(16)
                        Spacer()
                        Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 20).padding(.vertical, 14)
                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                }
                Button {
                    dismiss(); app.signOut()
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: "rectangle.portrait.and.arrow.right").frame(width: 30)
                        Text("Sign out").shotiqBody(16)
                    }
                    .foregroundStyle(ShotIQColor.reviewRed)
                    .padding(.horizontal, 20).padding(.vertical, 16)
                }
                Spacer()
            }
        }
    }
}
