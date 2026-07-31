import SwiftUI
import UserNotifications

// Remaining flows — goals 063-065, analytics 066-067, media 068-069,
// profile 070, settings 071, share 072.

@MainActor
final class GoalsViewModel: ObservableObject {
    @Published var goals: [GoalDTO] = []
    func load() async { goals = (try? await APIClient.shared.goals()) ?? [] }
    var display: [GoalDTO] {
        goals.isEmpty
            ? [GoalDTO(id: "g1", title: "Improve release consistency and arm alignment", progress: 0.72, targetDate: nil, status: "active"),
               GoalDTO(id: "g2", title: "Raise make % to 65", progress: 0.4, targetDate: nil, status: "active")]
            : goals
    }
}

struct GoalsView: View {            // 063
    @StateObject private var vm = GoalsViewModel()
    var body: some View {
        CanonicalScreen(testID: "screen-ios-goals") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Text("GOALS").shotiqDisplay(40)
                        Spacer()
                        NavigationLink { CreateGoalView() } label: {
                            Image(systemName: "plus").font(.system(size: 17, weight: .semibold))
                                .frame(width: 42, height: 42)
                                .background(ShotIQColor.shotiqOrange, in: Circle()).foregroundStyle(.white)
                        }
                        .accessibilityLabel("Create goal")
                    }
                    .padding(.top, 24)
                    ForEach(vm.display) { g in
                        NavigationLink { GoalDetailView(goal: g) } label: {
                            VStack(alignment: .leading, spacing: 9) {
                                HStack {
                                    Text("ACTIVE").font(.system(size: 10, weight: .bold))
                                        .padding(.horizontal, 8).padding(.vertical, 3)
                                        .overlay(Capsule().stroke(ShotIQColor.confirmGreen))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Spacer()
                                    Text("\(Int((g.progress ?? 0) * 100))%")
                                        .font(.custom("DINCondensed-Bold", size: 22))
                                }
                                Text(g.title).shotiqBody(16, weight: .semibold).multilineTextAlignment(.leading)
                                ScoreBar(pct: g.progress ?? 0, color: ShotIQColor.confirmGreen)
                            }
                            .padding(16)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        }
                        .padding(.top, 12)
                    }
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
        .task { await vm.load() }
    }
}

struct CreateGoalView: View {       // 064
    @State private var title = ""
    @State private var metric = "Make %"
    @State private var target = 65.0
    var body: some View {
        CanonicalScreen(testID: "screen-ios-create-goal") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("CREATE GOAL").shotiqDisplay(40).padding(.top, 24)
                    SectionLabel(text: "GOAL NAME").padding(.top, 20)
                    TextField("e.g. Raise make % to 65", text: $title)
                        .padding(.horizontal, 14).frame(height: 50)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule)).padding(.top, 8)
                    SectionLabel(text: "METRIC").padding(.top, 20)
                    ChipRow(options: ["Make %", "Form Score", "Release", "Balance"], selection: $metric)
                    SectionLabel(text: "TARGET · \(Int(target))").padding(.top, 20)
                    Slider(value: $target, in: 40...100, step: 1).tint(ShotIQColor.shotiqOrange)
                    PrimaryButton(title: "Create goal").padding(.top, 26)
                        .disabled(title.isEmpty)
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct GoalDetailView: View {       // 065
    var goal: GoalDTO
    var body: some View {
        CanonicalScreen(testID: "screen-ios-goal-detail") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("GOAL DETAIL").shotiqDisplay(38).padding(.top, 24)
                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(goal.title).shotiqBody(17, weight: .semibold)
                            HStack {
                                Ring(pct: goal.progress ?? 0, color: ShotIQColor.confirmGreen)
                                    .frame(width: 88, height: 88)
                                    .overlay(Text("\(Int((goal.progress ?? 0) * 100))%")
                                        .font(.custom("DINCondensed-Bold", size: 24)))
                                Spacer()
                                TrendLine(points: [40, 48, 55, 60, 66, 72]).frame(width: 150, height: 60)
                            }
                        }
                        .padding(18)
                    }
                    .padding(.top, 14)
                    SectionLabel(text: "LINKED DRILLS").padding(.top, 20)
                    ForEach(["Quick Release Builder", "Wall Elbow Alignment"], id: \.self) { d in
                        NavigationLink { DrillDetailView(name: d) } label: {
                            HStack {
                                Image(systemName: "figure.run").frame(width: 28)
                                Text(d).shotiqBody(15, weight: .semibold)
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.vertical, 12)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        }
                    }
                    SecondaryButton(title: "Mark goal complete").padding(.top, 24)
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct AnalyticsCardsView: View {   // 066
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analytics-cards") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("PROGRESS").shotiqDisplay(40).padding(.top, 24)
                    let cards: [(String, String, String, [Double])] = [
                        ("FORM SCORE", "82", "+8.1%", [72, 75, 74, 78, 80, 82]),
                        ("MAKE %", "62.5%", "+6.4%", [52, 55, 58, 54, 60, 62.5]),
                        ("RELEASE SPEED", "1.32s", "+3.2%", [1.5, 1.44, 1.4, 1.38, 1.35, 1.32]),
                        ("ELBOW ALIGNMENT", "92%", "+7.6%", [80, 83, 86, 88, 90, 92]),
                    ]
                    ForEach(cards, id: \.0) { label, v, d, pts in
                        NavigationLink { AnalyticsDetailedView(metric: label) } label: {
                            ShotIQCard {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        SectionLabel(text: label)
                                        Text(v).font(.custom("DINCondensed-Bold", size: 40))
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text("\(d) vs last 30 days").font(.system(size: 12))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                    }
                                    Spacer()
                                    TrendLine(points: pts, stroke: ShotIQColor.analysisBlue)
                                        .frame(width: 130, height: 60)
                                }
                                .padding(16)
                            }
                        }
                        .padding(.top, 12)
                    }
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct AnalyticsDetailedView: View { // 067
    var metric = "FORM SCORE"
    @State private var range = "30D"
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analytics-detailed") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text(metric).shotiqDisplay(38).padding(.top, 24)
                    ChipRow(options: ["7D", "30D", "90D", "ALL"], selection: $range)
                        .padding(.top, 12)
                    ShotIQCard {
                        TrendLine(points: [70, 72, 71, 75, 74, 78, 77, 80, 82], stroke: ShotIQColor.analysisBlue)
                            .frame(height: 200).padding(16)
                    }
                    .padding(.top, 14)
                    SectionLabel(text: "BY SHOT TYPE").padding(.top, 20)
                    ForEach([("Catch & Shoot", 0.84), ("Pull-Up", 0.78), ("Off the Dribble", 0.71)], id: \.0) { t, v in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(t).shotiqBody(14, weight: .semibold)
                                Spacer()
                                Text("\(Int(v * 100))").font(.custom("DINCondensed-Bold", size: 20))
                            }
                            ScoreBar(pct: v, color: ShotIQColor.analysisBlue)
                        }
                        .padding(.vertical, 9)
                    }
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct MyMediaView: View {          // 068
    var body: some View {
        CanonicalScreen(testID: "screen-ios-my-media") {
            VStack(alignment: .leading, spacing: 0) {
                Text("MY MEDIA").shotiqDisplay(40).padding(.horizontal, 24).padding(.top, 24)
                let cols = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)
                ScrollView {
                    LazyVGrid(columns: cols, spacing: 8) {
                        ForEach(0..<12, id: \.self) { i in
                            NavigationLink { MediaDetailView() } label: {
                                MediaSurface(height: 120)
                                    .overlay(alignment: .bottomLeading) {
                                        Text("0:0\(i % 9)").font(.custom("DINCondensed-Bold", size: 12))
                                            .foregroundStyle(.white).padding(6)
                                    }
                            }
                        }
                    }
                    .padding(24)
                }
            }
        }
    }
}

struct MediaDetailView: View {      // 069
    var body: some View {
        CanonicalScreen(testID: "screen-ios-media-detail") {
            VStack(spacing: 0) {
                MediaSurface(height: 460).padding(.horizontal, 16).padding(.top, 16)
                HStack(spacing: 24) {
                    StatBlock(value: "82", label: "FORM SCORE", color: ShotIQColor.shotiqOrange, valueSize: 30)
                    StatBlock(value: "Made", label: "RESULT", color: ShotIQColor.confirmGreen, valueSize: 30)
                    StatBlock(value: "0:07", label: "LENGTH", valueSize: 30)
                    Spacer()
                }
                .padding(.horizontal, 24).padding(.top, 16)
                HStack(spacing: 12) {
                    SecondaryButton(title: "Re-analyze", icon: "arrow.clockwise")
                    SecondaryButton(title: "Share", icon: "square.and.arrow.up")
                }
                .padding(.horizontal, 24).padding(.top, 14)
                Spacer()
            }
        }
    }
}

struct ProfileView: View {          // 070
    @EnvironmentObject var app: AppState
    var body: some View {
        CanonicalScreen(testID: "screen-ios-profile") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("PROFILE").shotiqDisplay(40).padding(.top, 24)
                    HStack(spacing: 16) {
                        Circle().fill(ShotIQColor.rule).frame(width: 74, height: 74)
                            .overlay(Text("JE").font(.system(size: 22, weight: .bold)).foregroundStyle(ShotIQColor.graphite))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(app.user?.displayName ?? "Jordan Ellis").shotiqBody(18, weight: .semibold)
                            Text("Right Hand · Advanced · Guard").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                    }
                    .padding(.top, 16)
                    HStack(spacing: 26) {
                        StatBlock(value: "37", label: "ANALYSES", valueSize: 30)
                        StatBlock(value: "82", label: "BEST FORM", valueSize: 30)
                        StatBlock(value: "6", label: "DAY STREAK", valueSize: 30)
                        StatBlock(value: "2,840", label: "POINTS", valueSize: 30)
                    }
                    .padding(.top, 18)
                    VStack(spacing: 0) {
                        row("person.crop.square", "Player card", AnyView(PlayerCardView()))
                        row("photo.stack", "My media", AnyView(MyMediaView()))
                        row("target", "Goals", AnyView(GoalsView()))
                        row("gearshape", "Settings", AnyView(SettingsHubView()))
                        row("square.and.arrow.up", "Share results", AnyView(ShareResultsView()))
                    }
                    .padding(.top, 18)
                    Button { app.signOut() } label: {
                        Text("Sign out").foregroundStyle(ShotIQColor.reviewRed).shotiqBody(16)
                            .padding(.vertical, 16)
                    }
                    Spacer(minLength: 20)
                }
                .padding(.horizontal, 24)
            }
        }
    }
    private func row(_ icon: String, _ t: String, _ dest: AnyView) -> some View {
        NavigationLink { dest } label: {
            HStack(spacing: 14) {
                Image(systemName: icon).frame(width: 28)
                Text(t).shotiqBody(16)
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
            }
            .padding(.vertical, 14).foregroundStyle(ShotIQColor.ink)
            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
        }
    }
}

struct SettingsHubView: View {      // 071
    @AppStorage("notifications") private var notifs = true
    @AppStorage("coachingAudio") private var audio = true
    @AppStorage("units") private var metric = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-settings-hub") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("SETTINGS").shotiqDisplay(40).padding(.top, 24)
                    SectionLabel(text: "PREFERENCES").padding(.top, 18)
                    Toggle("Workout notifications", isOn: $notifs).padding(.vertical, 10)
                        .onChange(of: notifs) { _, on in
                            if on { UNUserNotificationCenter.current()
                                .requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in } }
                        }
                    Toggle("Coaching audio cues", isOn: $audio).padding(.vertical, 10)
                    Toggle("Metric units", isOn: $metric).padding(.vertical, 10)
                    SectionLabel(text: "ACCOUNT").padding(.top, 18)
                    ForEach(["Edit profile", "Change password", "Privacy", "Export my data"], id: \.self) { t in
                        HStack {
                            Text(t).shotiqBody(15)
                            Spacer()
                            Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.vertical, 13)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                    }
                    SectionLabel(text: "ABOUT").padding(.top, 18)
                    HStack { Text("Version").shotiqBody(15); Spacer()
                        Text("1.0.0").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite) }
                        .padding(.vertical, 12)
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct ShareResultsView: View {     // 072
    var body: some View {
        CanonicalScreen(testID: "screen-ios-share-results") {
            VStack(spacing: 0) {
                Text("SHARE RESULTS").shotiqDisplay(38).padding(.top, 24)
                ShotIQCard {
                    VStack(spacing: 10) {
                        Wordmark(size: 24)
                        Text("JORDAN ELLIS").shotiqDisplay(26)
                        HStack(spacing: 22) {
                            StatBlock(value: "82", label: "FORM", color: ShotIQColor.shotiqOrange, valueSize: 32)
                            StatBlock(value: "62.5%", label: "MAKE %", valueSize: 32)
                            StatBlock(value: "+8.1%", label: "TREND", color: ShotIQColor.confirmGreen, valueSize: 32)
                        }
                        PhaseStrip()
                    }
                    .padding(20)
                }
                .padding(24)
                ShareLink(item: "My ShotIQ form score: 82 (GOOD) — 62.5% make rate, trending +8.1%. 🏀") {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .frame(maxWidth: .infinity).frame(height: 54)
                        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                }
                .padding(.horizontal, 24)
                Spacer()
            }
        }
    }
}
