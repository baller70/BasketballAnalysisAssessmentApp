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
        // Test-only: deterministic history so 018/019 render their populated
        // state without a signed-in account or a network round trip.
        if UITestHooks.demoData {
            stats = HistoryStats(totalAnalyses: 12, averageScore: 79, latestScore: 82,
                                 overallTrend: "improving", improvementRate: 8.1)
            recent = []
            return
        }
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
            // Test-only: pin one of the three canonical home states so the
            // screenshot harness can capture 017, 018 and 019 deterministically.
            if let forced = UITestHooks.homeVariant {
                switch forced {
                case "new": HomeNewPlayerView(vm: vm, showMenu: $showMenu)
                case "standard": HomeStandardView(vm: vm, showMenu: $showMenu)
                default: HomeProfessionalView(vm: vm, showMenu: $showMenu)
                }
            } else if vm.loading {
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
        .sheet(isPresented: $showMenu) { ProfileMenuView().modifier(CanonicalTypeScale()) }
    }
}

/// Canonical top chrome for the home screens: TopBar (wordmark + gear) above
/// the PlayerHeader (name + streak/points), exactly as in canonical 017-019.
struct HomeHeader: View {
    @Binding var showMenu: Bool
    @EnvironmentObject var app: AppState
    var body: some View {
        VStack(spacing: 0) {
            TopBar(onSettings: { showMenu = true })
            PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
        }
    }
}

/// Orange filled CTA label used inside NavigationLinks (canonical primary CTA).
private func homeCTALabel(_ title: String, icon: String = "camera.metering.center.weighted") -> some View {
    HStack(spacing: 10) {
        // Canonical prints its capture reticle on the primary CTA, not a
        // metering symbol.
        CaptureReticleGlyph(size: 19)
        Text(title).shotiqBody(ShotIQType.button + 1, weight: .semibold)
    }
    // 58pt against canonical 018's measured 46.1pt — this is the CTA the review
    // clocked at ~23% over. It shares the canonical control height with
    // PrimaryButton now.
    .frame(maxWidth: .infinity).frame(height: ShotIQType.controlHeight)
    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
    .foregroundStyle(.white)
    .lineLimit(1)
    .minimumScaleFactor(0.7)
}

/// Small dark media placeholder (canonical thumbnails are video frames).
private func homeMediaThumb(height: CGFloat, icon: String = "play.fill") -> some View {
    RoundedRectangle(cornerRadius: 4)
        .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
        .frame(height: height)
        .overlay(Image(systemName: icon).font(.system(size: 16)).foregroundStyle(.white.opacity(0.85)))
}

/// Large media frame carrying the canonical photograph (018/019 LATEST
/// ANALYSIS). The crops are now cut from the photograph's own frame — the wide
/// gym interior, 572x459 and 548x406 — not from the athlete's body box, so they
/// fill this landscape slot. `.fill` (the `CanonicalPhoto` default) crops the
/// surplus; the earlier `.fit` letterboxed the tall body cut-out and left the
/// dark surface showing as side bars. The dark rectangle stays as the backdrop
/// for a missing asset; the frame, corner radius and position are untouched.
private func homeCanonicalFrame(_ key: String, height: CGFloat) -> some View {
    RoundedRectangle(cornerRadius: 4)
        .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
        .frame(height: height)
        .overlay(CanonicalPhoto(key, height: height, cornerRadius: 4))
}

/// LATEST SESSION stats strip: shots / makes / make % / trend + delta (018/019).
private struct HomeSessionStats: View {
    var body: some View {
        HStack(alignment: .center, spacing: 18) {
            StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric)
            StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric)
            StatBlock(value: "62.5%", label: "MAKE %", valueSize: ShotIQType.numeric)
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 3) {
                TrendLine(points: [2, 3.1, 2.6, 4.2], stroke: ShotIQColor.confirmGreen)
                    .frame(width: 86, height: 28)
                HStack(spacing: 3) {
                    Text("+8.1%").shotiqBody(11, weight: .semibold).foregroundStyle(ShotIQColor.confirmGreen)
                    Text("vs last session").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                }
            }
        }
    }
}

/// PRIMARY COACHING TARGET row (canonical 018/019/021).
/// Tapping it opens the coaching-target detail (FlawDetailView) everywhere.
private struct HomeCoachingTargetRow: View {
    var body: some View {
        NavigationLink {
            FlawDetailView(title: "Keep elbow stacked through release", severity: "PRIMARY TARGET")
        } label: {
            VStack(alignment: .leading, spacing: 5) {
                Text("PRIMARY COACHING TARGET")
                    .shotiqBody(11, weight: .medium).kerning(0.8)
                    .foregroundStyle(ShotIQColor.graphite)
                HStack {
                    Text("Keep elbow stacked through release")
                        .shotiqBody(20, weight: .semibold)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.7)
                    Spacer()
                    Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                }
            }
            .padding(.vertical, 14)
            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
        }
        .buttonStyle(.plain)
    }
}

struct HomeNewPlayerView: View {   // 017
    @ObservedObject var vm: HomeViewModel
    @Binding var showMenu: Bool
    @State private var checkedSetup: Set<String> = []
    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-new-player") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HomeHeader(showMenu: $showMenu)

                    NavigationLink { AnalyzeHubView() } label: {
                        homeCTALabel("Analyze your first shot")
                    }
                    .padding(.horizontal, 20).padding(.top, 18)
                    Text("See how your mechanics perform in minutes.")
                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 10)

                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 0) {
                            SectionLabel(text: "START HERE").padding(.bottom, 4)
                            NavigationLink { AnalyzeHubView() } label: {
                                startRow("camera.metering.center.weighted", "1.  CAPTURE YOUR SHOT",
                                         "Record from the side to analyze your form.", rule: true)
                            }
                            .buttonStyle(.plain)
                            NavigationLink { NoAnalysisYetView() } label: {
                                startRow("film", "2.  GET AI ANALYSIS",
                                         "Our AI breaks down your mechanics.", rule: true)
                            }
                            .buttonStyle(.plain)
                            NavigationLink { AnalyticsCardsView() } label: {
                                startRow("waveform.path.ecg", "3.  IMPROVE & TRACK",
                                         "Apply feedback and watch your progress.", rule: false)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionLabel(text: "CAPTURE YOUR SHOT")
                            HStack(alignment: .top, spacing: 10) {
                                NavigationLink { PhotoUploadSourceView() } label: {
                                    captureThumb("UPLOAD IMAGE", "From your library", photo: "017-visual-002")
                                }
                                .buttonStyle(.plain)
                                NavigationLink { VideoUploadView() } label: {
                                    // Canonical prints a filmstrip-framed photo here,
                                    // the same as its two neighbours. The 017 sidecar
                                    // declares only two photo regions, so this one had
                                    // no source and fell back to the dark placeholder —
                                    // cut from the render at x313-532, y906-1095.
                                    captureThumb("UPLOAD VIDEO", "From your library", photo: "017-visual-003")
                                }
                                .buttonStyle(.plain)
                                NavigationLink { LiveCameraSetupView() } label: {
                                    captureThumb("LIVE CAMERA", "Record in real time", photo: "017-visual-001")
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack {
                                SectionLabel(text: "SETUP CHECKLIST")
                                Spacer()
                                Text("\(checkedSetup.count) OF 4 COMPLETE").shotiqBody(10, weight: .medium).kerning(0.6)
                                    .foregroundStyle(checkedSetup.count == 4 ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                            }
                            .padding(.bottom, 4)
                            checklistRow("video", "CAMERA POSITION", "Place camera at hip height, 15–20 ft away", rule: true)
                            checklistRow("gearshape", "ENVIRONMENT", "Good lighting, clear background", rule: true)
                            checklistRow("figure.basketball", "SHOOTING ROUTINE", "Use your normal pre-shot routine", rule: true)
                            checklistRow("chart.line.uptrend.xyaxis", "WHAT TO CAPTURE", "Side view from catch to follow-through", rule: false)
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                SectionLabel(text: "YOUR PRIMARY TARGET")
                                Spacer()
                                NavigationLink { CaptureGuideView() } label: {
                                    HStack(spacing: 4) {
                                        Text("See capture guide").shotiqBody(13)
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Image(systemName: "chevron.right").font(.system(size: 11))
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                            Text("Keep elbow stacked through release.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            PhaseStrip()
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 28)
                }
            }
        }
    }

    private func startRow(_ icon: String, _ title: String, _ d: String, rule: Bool) -> some View {
        HStack(spacing: 14) {
            // START HERE draws three unrelated marks in canonical 017; the
            // shipped row led with `camera.metering...` for step 1 and reused it
            // on six other screens for six other things.
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 26)
                .foregroundStyle(ShotIQColor.ink).frame(width: 42)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).shotiqCondensed(15, weight: .heavy).kerning(0.5)
                    .foregroundStyle(ShotIQColor.ink)
                Text(d).shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
        }
        .padding(.vertical, 12)
        .overlay(alignment: .bottom) { if rule { Rectangle().fill(ShotIQColor.rule).frame(height: 1) } }
    }

    private func captureThumb(_ title: String, _ d: String, photo: String? = nil) -> some View {
        VStack(spacing: 6) {
            if let photo {
                CanonicalPhoto(photo, height: 96, cornerRadius: 4)
            } else {
                homeMediaThumb(height: 96, icon: "figure.basketball")
            }
            Text(title).shotiqCondensed(11, weight: .heavy).kerning(0.5)
                .foregroundStyle(ShotIQColor.ink)
            Text(d).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }

    /// Checklist rows check off for real, driving the "N OF 4 COMPLETE" count.
    private func checklistRow(_ icon: String, _ title: String, _ d: String, rule: Bool) -> some View {
        let done = checkedSetup.contains(title)
        return Button {
            withAnimation(.easeInOut(duration: 0.15)) {
                if done { checkedSetup.remove(title) } else { checkedSetup.insert(title) }
            }
        } label: {
            HStack(spacing: 12) {
                if done {
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 20))
                        .foregroundStyle(ShotIQColor.confirmGreen).frame(width: 20, height: 20)
                } else {
                    Circle().stroke(ShotIQColor.rule, lineWidth: 1.5).frame(width: 20, height: 20)
                }
                ShotIQConceptGlyph(concept: title, fallback: icon, size: 19)
                    .foregroundStyle(ShotIQColor.ink).frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).shotiqCondensed(13, weight: .heavy).kerning(0.5)
                        .foregroundStyle(ShotIQColor.ink)
                    Text(d).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
            }
            .padding(.vertical, 10)
            .overlay(alignment: .bottom) { if rule { Rectangle().fill(ShotIQColor.rule).frame(height: 1) } }
        }
        .buttonStyle(.plain)
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

                    NavigationLink { AnalyzeHubView() } label: {
                        homeCTALabel("Analyze shot")
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(spacing: 10) {
                        NavigationLink { PhotoUploadSourceView() } label: { optionCard("photo", "Upload image") }
                        NavigationLink { VideoUploadView() } label: { optionCard("film", "Upload video") }
                        NavigationLink { LiveCameraSetupView() } label: { optionCard("dot.radiowaves.left.and.right", "Live camera") }
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    NavigationLink { AnalysisResultOverviewView() } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "doc.text").font(.system(size: 19)).foregroundStyle(ShotIQColor.ink)
                            Text("View latest analysis").shotiqBody(16, weight: .medium)
                                .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(16)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    HStack {
                        SectionLabel(text: "LATEST ANALYSIS")
                        Spacer()
                        Text("Today at 8:24 AM").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 20).padding(.top, 22)

                    NavigationLink { AnalysisResultOverviewView() } label: {
                        HStack(alignment: .center, spacing: 14) {
                            // Canonical 018 sets this frame at 205pt (sidecar
                            // visual-001, y=338 h=205 on the 850pt screen). At 250 it
                            // pushed the coaching target, session stats and next
                            // workout off the bottom of the screen.
                            homeCanonicalFrame("018-visual-001", height: 205)
                                .frame(maxWidth: .infinity)
                            VStack(alignment: .leading, spacing: 5) {
                                Text("FORM SCORE").shotiqBody(11, weight: .bold).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("\(vm.score ?? 82)")
                                    .font(.custom("Tungsten-Medium", size: 66))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                ScoreBar(pct: Double(vm.score ?? 82) / 100).frame(width: 96)
                                Text("GOOD").shotiqBody(14, weight: .bold)
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                Text("Keep building consistency.")
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                            }
                            .frame(width: 108, alignment: .leading)
                        }
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 10)

                    PhaseStrip().padding(.horizontal, 20).padding(.top, 18)

                    HomeCoachingTargetRow().padding(.horizontal, 20).padding(.top, 16)

                    SectionLabel(text: "LATEST SESSION").padding(.horizontal, 20).padding(.top, 14)
                    HomeSessionStats().padding(.horizontal, 20).padding(.top, 8)

                    Text("NEXT WORKOUT").shotiqBody(11, weight: .bold).kerning(0.8)
                        .foregroundStyle(ShotIQColor.ink)
                        .padding(.horizontal, 20).padding(.top, 18)
                    NavigationLink { DrillDetailView(name: "Quick Release Builder") } label: {
                        ShotIQCard {
                            HStack(spacing: 14) {
                                Circle().fill(ShotIQColor.analysisBlue).frame(width: 52, height: 52)
                                    .overlay(WorkoutGlyph(kind: .init(drillName: "Quick Release Builder"), size: 22)
                                        .foregroundStyle(.white))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Quick Release Builder").shotiqBody(16, weight: .semibold)
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text("20 min  •  Form Focus").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                    Text("Improve release speed and consistency.")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(14)
                        }
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 24)
                }
            }
        }
    }

    private func optionCard(_ icon: String, _ title: String) -> some View {
        VStack(spacing: 10) {
            Group {
                if let source = CaptureSource(sourceLabel: title) {
                    CaptureSourceGlyph(source: source, size: 26)
                } else {
                    Image(systemName: icon).font(.system(size: 26))
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            Text(title).shotiqBody(14, weight: .medium).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity).frame(height: 96)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct HomeProfessionalView: View { // 019
    @ObservedObject var vm: HomeViewModel
    @Binding var showMenu: Bool

    private let phaseScores = [("SETUP", "84"), ("LOAD", "78"), ("RISE", "80"),
                               ("RELEASE", "82"), ("FOLLOW-THROUGH", "85")]
    private let trends: [(String, String, String, Bool)] = [
        ("RELEASE HEIGHT", "7'6\"", "+0.6\"", true), ("RELEASE ANGLE", "49°", "+3°", true),
        ("ELBOW STACK", "91%", "+7%", true), ("SHOT SPEED", "4.2", "−0.1", false),
        ("CONSISTENCY", "83%", "+6%", true)]

    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-professional") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HomeHeader(showMenu: $showMenu)

                    NavigationLink { AnalyzeHubView() } label: {
                        homeCTALabel("Open analysis workspace")
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(spacing: 10) {
                        NavigationLink { AnalyzeHubView() } label: { quickAction("figure.basketball", "New capture") }
                        NavigationLink { AnalysisResultOverviewView() } label: { quickAction("film", "View history") }
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    HStack {
                        SectionLabel(text: "FORM OVERVIEW")
                        Spacer()
                        Text("Today at 8:24 AM").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 20).padding(.top, 22)

                    NavigationLink { AnalysisResultOverviewView() } label: {
                        HStack(alignment: .center, spacing: 14) {
                            homeCanonicalFrame("019-visual-001", height: 205)
                                .frame(maxWidth: .infinity)
                            VStack(alignment: .leading, spacing: 5) {
                                Text("FORM SCORE").shotiqBody(11, weight: .bold).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("\(vm.score ?? 82)")
                                    .font(.custom("Tungsten-Medium", size: 66))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                ScoreBar(pct: Double(vm.score ?? 82) / 100).frame(width: 96)
                                Text("GOOD").shotiqBody(14, weight: .bold)
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                Text("Keep building consistency.")
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                            }
                            .frame(width: 108, alignment: .leading)
                        }
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 10)

                    // Phase strip with per-phase scores (canonical 019)
                    HStack(alignment: .top) {
                        ForEach(phaseScores, id: \.0) { p, v in
                            VStack(spacing: 4) {
                                PhaseGlyph(phase: p, active: p == "RELEASE", size: 28)
                                Text(p).shotiqBody(9, weight: p == "RELEASE" ? .bold : .regular).kerning(0.5)
                                    .foregroundStyle(p == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text(v).font(.custom("Tungsten-Medium", size: 17))
                                    .foregroundStyle(p == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                if p == "RELEASE" {
                                    Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 40, height: 3)
                                }
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    HStack(alignment: .center) {
                        SectionLabel(text: "MECHANICS TRENDS")
                        Spacer()
                        HStack(spacing: 8) {
                            Image(systemName: "arrowtriangle.up.fill").font(.system(size: 8))
                                .foregroundStyle(ShotIQColor.confirmGreen)
                            Text("Improved").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                            Text("—").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                            Text("Stable").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                            Image(systemName: "arrowtriangle.down.fill").font(.system(size: 8))
                                .foregroundStyle(ShotIQColor.reviewRed)
                            Text("Needs work").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 22)

                    HStack(alignment: .top, spacing: 4) {
                        ForEach(trends, id: \.0) { label, value, delta, up in
                            VStack(spacing: 4) {
                                MechanicGlyph(kind: .init(metricLabel: label), size: 22)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text(label).shotiqBody(8, weight: .medium).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text(value).font(.custom("Tungsten-Medium", size: 22))
                                    .foregroundStyle(ShotIQColor.ink)
                                HStack(spacing: 2) {
                                    Text(delta).shotiqBody(11, weight: .semibold)
                                    Image(systemName: up ? "arrow.up.right" : "arrow.down.right").font(.system(size: 8))
                                }
                                .foregroundStyle(up ? ShotIQColor.confirmGreen : ShotIQColor.reviewRed)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    HStack {
                        SectionLabel(text: "RECENT SESSIONS")
                        Spacer()
                        NavigationLink { AnalyticsDetailedView() } label: {
                            Text("View all").shotiqBody(13).foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 24)

                    NavigationLink { AnalysisResultOverviewView() } label: {
                        ShotIQCard {
                            HStack(alignment: .center, spacing: 14) {
                                homeMediaThumb(height: 92).frame(width: 128)
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Today at 8:24 AM").shotiqBody(13).foregroundStyle(ShotIQColor.ink)
                                    HStack(spacing: 16) {
                                        StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric)
                                        StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric)
                                        StatBlock(value: "62.5%", label: "MAKE %", valueSize: ShotIQType.numeric)
                                    }
                                }
                                Spacer()
                                Image(systemName: "chevron.right").font(.system(size: 13))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(12)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 8)

                    HomeCoachingTargetRow().padding(.horizontal, 20).padding(.top, 16)

                    HomeSessionStats().padding(.horizontal, 20).padding(.top, 12).padding(.bottom, 24)
                }
            }
        }
    }

    private func quickAction(_ icon: String, _ title: String) -> some View {
        HStack(spacing: 10) {
            Group {
                if title.lowercased().contains("capture") {
                    CaptureReticleGlyph(size: 19)
                } else {
                    ShotIQConceptGlyph(concept: title, fallback: icon, size: 19)
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            Text(title).shotiqBody(15, weight: .medium).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity).frame(height: 56)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct ProfileMenuView: View {      // 020
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage("dashboardMode") private var dashboardMode = "Analysis"

    private let menuRows = [
        ("camera.metering.center.weighted", "MY MEDIA", "View and manage your captured content"),
        ("figure.basketball", "ELITE SHOOTERS", "Study top shooters and their mechanics"),
        ("flag", "ACHIEVEMENTS", "Track milestones and personal bests"),
        ("circle.hexagongrid", "POINTS SYSTEM", "Learn how points work and how to earn more"),
        ("gearshape", "SETTINGS", "Customize your app experience")]

    /// Destinations for the menu rows — every row pushes a real screen.
    @ViewBuilder private func menuDestination(_ title: String) -> some View {
        switch title {
        case "MY MEDIA": MyMediaView()
        case "ELITE SHOOTERS": EliteShootersView()
        case "ACHIEVEMENTS": GoalsView()
        case "POINTS SYSTEM": PointsSystemView()
        default: SettingsHubView()
        }
    }

    var body: some View {
        // The menu is presented as a sheet; its rows push real screens, so it
        // carries its own NavigationStack.
        NavigationStack {
            menuContent.toolbar(.hidden, for: .navigationBar)
        }
    }

    private var menuContent: some View {
        CanonicalScreen(testID: "screen-ios-profile-menu") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Wordmark(size: 30)
                        Spacer()
                        Button { dismiss() } label: {
                            Image(systemName: "xmark").font(.system(size: 19)).foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Close")
                    }
                    .padding(.horizontal, 20).frame(height: 52)

                    HStack(alignment: .center, spacing: 16) {
                        // Canonical 020 paints a circular portrait here; users
                        // without one keep the initials disc.
                        if UIImage(named: "photo-020-visual-001") != nil {
                            CanonicalPhoto("020-visual-001", width: 88, height: 88, cornerRadius: 44)
                                .frame(width: 88, height: 88)
                                .clipShape(Circle())
                        } else {
                            Circle().fill(ShotIQColor.rule).frame(width: 88, height: 88)
                                .overlay(Text(shotiqInitials(app.user)).shotiqBody(26, weight: .bold)
                                    .foregroundStyle(ShotIQColor.graphite))
                        }
                        VStack(alignment: .leading, spacing: 6) {
                            Text((app.user?.displayName ?? "Jordan Ellis").uppercased()).shotiqDisplay(30)
                            Text("Right-handed • Advanced").shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                            Button {
                                dismiss()
                                app.tab = .profile
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "camera.metering.center.weighted").font(.system(size: 14))
                                    Text("View profile").shotiqBody(14, weight: .medium)
                                    Image(systemName: "chevron.right").font(.system(size: 10))
                                }
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                .padding(.horizontal, 12).padding(.vertical, 8)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(20)

                    HStack(alignment: .top, spacing: 0) {
                        HeaderStat(icon: "film", value: "6", label: "DAY STREAK").frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 48)
                        HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS").frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 48)
                        HeaderStat(icon: "camera.metering.center.weighted", value: "82", label: "FORM SCORE").frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 48)
                        VStack(spacing: 3) {
                            Image(systemName: "arrow.up.right").font(.system(size: 15)).foregroundStyle(ShotIQColor.confirmGreen)
                            Text("+8.1%").font(.custom("Tungsten-Medium", size: 24))
                                .foregroundStyle(ShotIQColor.confirmGreen)
                                .lineLimit(1).minimumScaleFactor(0.7)
                            Text("VS LAST SESSION").shotiqMicroCaps()
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .padding(.horizontal, 12).padding(.top, 4)

                    HStack(spacing: 0) {
                        VStack(spacing: 2) {
                            Text("24").font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                            Text("SHOTS").shotiqMicroCaps()
                                .foregroundStyle(ShotIQColor.graphite)
                        }.frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                        VStack(spacing: 2) {
                            Text("15").font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                            Text("MAKES").shotiqMicroCaps()
                                .foregroundStyle(ShotIQColor.graphite)
                        }.frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                        VStack(spacing: 2) {
                            Text("62.5%").font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                            Text("ACCURACY").shotiqMicroCaps()
                                .foregroundStyle(ShotIQColor.graphite)
                        }.frame(maxWidth: .infinity)
                    }
                    .padding(.horizontal, 40).padding(.top, 18)

                    // DASHBOARD MODE selector
                    HStack(spacing: 14) {
                        Image(systemName: "camera.metering.center.weighted").font(.system(size: 24))
                            .foregroundStyle(ShotIQColor.ink)
                        // NO Spacer HERE, AND THE LABEL COLUMN CLAIMS THE SLACK
                        // ITSELF. A Spacer and a Text are both flexible, so an
                        // over-budget HStack splits the leftover width between
                        // them — and Text compresses furthest, so Text loses.
                        // That starved this column to under one word: the
                        // capture measured thirteen consecutive short lines,
                        // narrowest 23 device px of 1178, i.e. "DASHBOARD MODE"
                        // set as DASH / BOAR / D / MODE and the sentence below
                        // it broken mid-word.
                        //
                        // The `.fixedSize` on the segmented control below is
                        // NOT the culprit and must stay — it is there because
                        // the control used to be the thing that collapsed
                        // ("Analy sis" / "Traini ng"). Making it incompressible
                        // only moved the squeeze to the next-most-flexible
                        // child. Removing the Spacer and giving this column the
                        // remaining width outright is what actually settles it,
                        // because then nothing is competing for the slack.
                        //
                        // Canonical 020-profile-menu keeps all three side by
                        // side — icon, label column, control — with the
                        // sentence wrapping to exactly two lines, so this is a
                        // width fix and NOT a licence to restack the row.
                        VStack(alignment: .leading, spacing: 3) {
                            Text("DASHBOARD MODE").shotiqCondensed(14, weight: .heavy).kerning(0.5)
                                .foregroundStyle(ShotIQColor.ink)
                                .fixedSize(horizontal: false, vertical: true)
                            Text("Choose what you see first when you open ShotIQ.")
                                .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        // maxWidth WITHOUT a layoutPriority, deliberately. An
                        // HStack allocates to its least flexible children
                        // first, so the `.fixedSize` control takes its ideal
                        // width and this column then absorbs whatever is left.
                        // Adding `.layoutPriority(1)` here would invert that —
                        // this column would be laid out first against the full
                        // width, take all of it, and starve the control back
                        // into "Analy sis" / "Traini ng". The priority is the
                        // fixedSize, not a number.
                        .frame(maxWidth: .infinity, alignment: .leading)
                        HStack(spacing: 0) {
                            ForEach(["Analysis", "Training"], id: \.self) { mode in
                                Button {
                                    dashboardMode = mode
                                    // Persist the preference server-side like the web client.
                                    Task {
                                        await APIClient.shared.send(
                                            "/api/settings", method: "PUT",
                                            body: ["automation": ["dashboardMode": mode.lowercased()]])
                                    }
                                } label: {
                                    // Without a fixed intrinsic width the row's
                                    // trailing segmented control is the thing
                                    // the HStack squeezes, and "Analysis" /
                                    // "Training" broke mid-word into
                                    // "Analy sis" / "Traini ng" on 020.
                                    Text(mode).shotiqBody(13, weight: .semibold)
                                        .lineLimit(1)
                                        .fixedSize(horizontal: true, vertical: false)
                                        .padding(.horizontal, 12).padding(.vertical, 8)
                                        .background(dashboardMode == mode ? ShotIQColor.shotiqOrange : ShotIQColor.paper)
                                        .foregroundStyle(dashboardMode == mode ? .white : ShotIQColor.ink)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    }
                    .padding(14)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 20).padding(.top, 22)

                    ShotIQCard {
                        VStack(spacing: 0) {
                            ForEach(menuRows, id: \.1) { icon, t, d in
                                NavigationLink { menuDestination(t) } label: {
                                    HStack(spacing: 16) {
                                        Image(systemName: icon).font(.system(size: 22))
                                            .foregroundStyle(ShotIQColor.ink).frame(width: 36)
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(t).shotiqCondensed(17, weight: .heavy).kerning(0.5)
                                                .foregroundStyle(ShotIQColor.ink)
                                            Text(d).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                        }
                                        Spacer()
                                        Image(systemName: "chevron.right").font(.system(size: 13))
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    .padding(.horizontal, 16).padding(.vertical, 14)
                                    .overlay(alignment: .bottom) {
                                        if t != "SETTINGS" { Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.horizontal, 16) }
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    Button {
                        dismiss(); app.signOut()
                    } label: {
                        HStack(spacing: 16) {
                            Image(systemName: "rectangle.portrait.and.arrow.right").font(.system(size: 22))
                                .foregroundStyle(ShotIQColor.reviewRed).frame(width: 36)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("SIGN OUT").shotiqCondensed(17, weight: .heavy).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("Sign out of your ShotIQ account")
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 13))
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(16)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 28)
                }
            }
        }
    }
}

/// POINTS SYSTEM — how points are earned, with the real ledger balance from
/// GET /api/points (falls back to the header value offline).
struct PointsSystemView: View {
    @State private var totalPoints: Int?
    @State private var tier: String?
    private let earns: [(String, String, String)] = [
        ("camera.metering.center.weighted", "ANALYZE A SHOT", "Run an AI analysis on a capture"),
        ("figure.basketball", "COMPLETE A WORKOUT", "Finish a training session or drill"),
        ("film", "KEEP YOUR STREAK", "Practice on back-to-back days"),
        ("flag", "HIT A GOAL MILESTONE", "Reach a target you set in Goals")]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-points-system") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()

                    Text("POINTS SYSTEM").shotiqDisplay(38)
                        .padding(.horizontal, 20).padding(.top, 24)
                    Text("Earn points for every rep you put in.")
                        .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    ShotIQCard {
                        HStack(alignment: .center, spacing: 16) {
                            Image(systemName: "circle.hexagongrid").font(.system(size: 28))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("TOTAL POINTS").shotiqBody(10, weight: .medium).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text(totalPoints.map { "\($0)" } ?? "2,840")
                                    .font(.custom("Tungsten-Medium", size: 34))
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            Spacer()
                            if let tier {
                                Text(tier.uppercased()).shotiqBody(11, weight: .bold).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .padding(.horizontal, 10).padding(.vertical, 6)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                            }
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    SectionLabel(text: "HOW TO EARN").padding(.horizontal, 20).padding(.top, 20)
                    ShotIQCard {
                        VStack(spacing: 0) {
                            ForEach(earns, id: \.1) { icon, t, d in
                                HStack(spacing: 14) {
                                    Image(systemName: icon).font(.system(size: 20))
                                        .foregroundStyle(ShotIQColor.ink).frame(width: 34)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(t).shotiqCondensed(14, weight: .heavy).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text(d).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(.vertical, 12)
                                .overlay(alignment: .bottom) {
                                    if t != "HIT A GOAL MILESTONE" { Rectangle().fill(ShotIQColor.rule).frame(height: 1) }
                                }
                            }
                        }
                        .padding(.horizontal, 14).padding(.vertical, 4)
                    }
                    .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 26)
                }
            }
        }
        .task {
            struct Tier: Codable { var displayName: String? }
            struct Resp: Codable { var success: Bool?; var totalPoints: Int?; var currentTier: Tier? }
            if let r: Resp = try? await APIClient.shared.call("/api/points") {
                totalPoints = r.totalPoints
                tier = r.currentTier?.displayName
            }
        }
    }
}
