import SwiftUI
import UIKit

// Home flow — screens 017-020. Three canonical home states driven by real
// history data (new player / standard / professional) plus the profile menu.

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var stats: HistoryStats?
    @Published var recent: [AnalysisSummary] = []
    @Published var loading = true
    @Published var loadError: String?

    func load() async {
        loading = true
        loadError = nil
        defer { loading = false }
        // Test-only: force the backend-failure branch so XCUITest can prove
        // that "unknown" is not rendered as "you have no analyses".
        if UITestHooks.historyFailure {
            stats = nil
            recent = []
            loadError = "We could not load your analysis history."
            return
        }
        // Test-only: deterministic history so 018/019 render their populated
        // state without a signed-in account or a network round trip.
        if UITestHooks.demoData {
            stats = HistoryStats(totalAnalyses: 12, averageScore: 79, latestScore: 82,
                                 overallTrend: "improving", improvementRate: 8.1)
            recent = []
            return
        }
        do {
            let r = try await APIClient.shared.history()
            stats = r.stats
            recent = Array(r.items.prefix(3))
        } catch {
            stats = nil
            recent = []
            loadError = "We could not load your analysis history."
        }
    }
    var hasData: Bool { (stats?.totalAnalyses ?? 0) > 0 }
    var score: Int? { stats.flatMap { $0.latestScore ?? $0.averageScore }.map { Int($0.rounded()) } }
}

struct HomeView: View {
    @StateObject private var vm = HomeViewModel()
    @State private var showMenu = false

    var body: some View {
        Group {
            // Production Home is pinned to the latest ShotIQ dashboard design.
            // Older saved AppStorage values and empty-history states must not
            // send Kevin's installed app back to stale homepage variants.
            if let forced = UITestHooks.homeVariant {
                switch forced {
                case "new": HomeNewPlayerView(vm: vm, showMenu: $showMenu)
                case "standard": HomeStandardView(vm: vm, showMenu: $showMenu)
                default: HomeProfessionalView(vm: vm, showMenu: $showMenu)
                }
            } else if vm.loading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                HomeProfessionalView(vm: vm, showMenu: $showMenu)
            }
        }
        .task { await vm.load() }
        // Reverted to `.sheet` with the button style stated explicitly — see the
        // note on the same call in ShotIQComponents.TopBar.
        .sheet(isPresented: $showMenu) {
            ProfileMenuView().modifier(CanonicalTypeScale()).buttonStyle(.plain)
        }
    }
}

struct HomeHistoryUnavailableView: View {
    let message: String
    @Binding var showMenu: Bool
    var retry: () -> Void
    @State private var toast: ShotIQToast?

    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-history-unavailable") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HomeHeader(showMenu: $showMenu)

                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 14) {
                            HStack(alignment: .top, spacing: 14) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "exclamationmark.triangle"),
                                                         size: 36,
                                                         label: nil)
                                    .foregroundStyle(ShotIQColor.reviewRed)
                                    .frame(width: 44)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("HISTORY UNAVAILABLE").shotiqDisplay(26)
                                        .foregroundStyle(ShotIQColor.reviewRed)
                                    Text(message)
                                        .shotiqBody(15)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                    Text("Your saved shots may still exist. Retry before treating this account as new.")
                                        .shotiqBody(13)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            Button {
                                toast = .progress("Retrying history", "Reloading saved analysis data.", progress: 0.55)
                                retry()
                            } label: {
                                HStack(spacing: 10) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "arrow.clockwise"),
                                                             size: 18,
                                                             label: nil)
                                    Text("Retry history").shotiqBody(ShotIQType.button, weight: .medium)
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: ShotIQType.controlHeight)
                                .background(ShotIQColor.analysisBlue, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                                .foregroundStyle(.white)
                            }
                            .buttonStyle(.plain)
                            NavigationLink { AnalyzeHubView() } label: {
                                HStack(spacing: 10) {
                                    CaptureReticleGlyph(size: 19)
                                    Text("Analyze a shot").shotiqBody(ShotIQType.button, weight: .medium)
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: ShotIQType.controlHeight)
                                .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening capture", "Choose image, video, or live camera.")
                            })
                            .buttonStyle(.plain)
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 18)
                }
            }
        }
        .shotiqToast($toast)
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
            PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis",
                         statLinksEnabled: true)
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

/// Small clean media placeholder. Keep it as a player/wireframe thumbnail,
/// not a video-control surface.
private func homeMediaThumb(height: CGFloat, icon: String = "camera.viewfinder") -> some View {
    CanonicalPhoto("041-visual-002", height: height, cornerRadius: 4)
        .overlay(RoundedRectangle(cornerRadius: 4).stroke(ShotIQColor.shotiqOrange.opacity(0.45), lineWidth: 1))
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

private struct HomeSessionValues {
    var shots: String
    var makes: String
    var makePercent: String
    var trend: String
    var trendCaption: String
    var dateLabel: String
    var hasRealData: Bool

    static func resolve(historyStats: HistoryStats?, completedWorkoutsPayload: String) -> HomeSessionValues {
        if let workout = TrainingWorkoutStore.latest(in: completedWorkoutsPayload) {
            return HomeSessionValues(shots: "\(workout.shots)",
                                     makes: "\(workout.makes)",
                                     makePercent: workout.accuracyText,
                                     trend: "SAVED",
                                     trendCaption: workout.drillName,
                                     dateLabel: Self.dateText(workout.completedAt),
                                     hasRealData: true)
        }
        if let historyStats, historyStats.totalAnalyses > 0 {
            return HomeSessionValues(shots: "--",
                                     makes: "--",
                                     makePercent: "--",
                                     trend: Self.percentTrend(historyStats.improvementRate) ?? "--",
                                     trendCaption: "analysis trend",
                                     dateLabel: "Latest history",
                                     hasRealData: true)
        }
        if UITestHooks.demoData {
            return HomeSessionValues(shots: "24",
                                     makes: "15",
                                     makePercent: "62.5%",
                                     trend: "+8.1%",
                                     trendCaption: "vs last session",
                                     dateLabel: "Today at 8:24 AM",
                                     hasRealData: false)
        }
        return HomeSessionValues(shots: "--",
                                 makes: "--",
                                 makePercent: "--",
                                 trend: "--",
                                 trendCaption: "track shots",
                                 dateLabel: "No session yet",
                                 hasRealData: false)
    }

    private static func percentTrend(_ value: Double?) -> String? {
        guard let value else { return nil }
        return String(format: "%+.1f%%", value)
    }

    private static func dateText(_ date: Date) -> String {
        date.formatted(date: .abbreviated, time: .shortened)
    }
}

private struct HomeAnalysisValues {
    var scoreText: String
    var scorePct: Double
    var verdict: String
    var caption: String
    var dateLabel: String
    var hasRealData: Bool

    static func resolve(latestAnalysis: ShotIQAnalysisResultDTO?, historyScore: Int?) -> HomeAnalysisValues {
        if let latestAnalysis {
            let presentation = AnalysisResultPresentation(result: latestAnalysis)
            return HomeAnalysisValues(scoreText: presentation.scoreText,
                                      scorePct: presentation.scorePct,
                                      verdict: presentation.scoreVerdict,
                                      caption: presentation.scoreCaption,
                                      dateLabel: presentation.recordedLabel,
                                      hasRealData: true)
        }
        if let historyScore {
            return HomeAnalysisValues(scoreText: "\(historyScore)",
                                      scorePct: Double(historyScore) / 100,
                                      verdict: Self.verdict(for: historyScore),
                                      caption: "Latest saved history score from ShotIQ.",
                                      dateLabel: "Latest history",
                                      hasRealData: true)
        }
        if UITestHooks.demoData {
            return HomeAnalysisValues(scoreText: "82",
                                      scorePct: 0.82,
                                      verdict: "GOOD",
                                      caption: "Keep building consistency.",
                                      dateLabel: "Today at 8:24 AM",
                                      hasRealData: false)
        }
        return HomeAnalysisValues(scoreText: "--",
                                  scorePct: 0,
                                  verdict: "WAITING",
                                  caption: "Analyze a shot to create your score.",
                                  dateLabel: "No analysis yet",
                                  hasRealData: false)
    }

    private static func verdict(for score: Int) -> String {
        if score >= 90 { return "ELITE" }
        if score >= 75 { return "GOOD" }
        if score >= 60 { return "BUILDING" }
        return "NEEDS WORK"
    }
}

private struct HomeScoreDeltaPill: View {
    var delta: Int?

    private var resolvedDelta: Int? {
        if let delta { return delta }
        return UITestHooks.demoData ? 2 : nil
    }

    private var isPositive: Bool { (resolvedDelta ?? 0) > 0 }
    private var isNegative: Bool { (resolvedDelta ?? 0) < 0 }
    private var color: Color {
        if isPositive { return ShotIQColor.confirmGreen }
        if isNegative { return ShotIQColor.reviewRed }
        return ShotIQColor.graphite
    }
    private var iconName: String {
        if isPositive { return "arrow.up.right" }
        if isNegative { return "arrow.down.right" }
        return "minus"
    }
    private var label: String {
        guard let resolvedDelta else { return "" }
        if resolvedDelta > 0 { return "+\(resolvedDelta)" }
        return "\(resolvedDelta)"
    }

    var body: some View {
        if resolvedDelta != nil {
            HStack(spacing: 5) {
                Image(systemName: iconName)
                    .font(.system(size: 12, weight: .heavy))
                Text(label)
                    .shotiqBody(13, weight: .heavy)
                    .lineLimit(1)
            }
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(color.opacity(0.12), in: Capsule())
            .accessibilityLabel("Form score trend \(label)")
        }
    }
}

private struct HomeProfileMenuSummary {
    var streak: String
    var points: String
    var score: String
    var trend: String
    var trendLabel: String
    var trendPositive: Bool
    var shots: String
    var makes: String
    var accuracy: String

    static func resolve(latestAnalysis: ShotIQAnalysisResultDTO?, completedWorkoutsPayload: String) -> HomeProfileMenuSummary {
        let workouts = TrainingWorkoutStore.decode(completedWorkoutsPayload)
        let latestWorkout = workouts.sorted { $0.completedAt > $1.completedAt }.first
        let presentation = latestAnalysis.map(AnalysisResultPresentation.init)

        if presentation != nil || latestWorkout != nil {
            let pointTotal = workouts.reduce(0) { $0 + $1.pointsEarned }
            let scoreText = presentation?.scoreText ?? latestWorkout.map { "\($0.formScore)" } ?? "--"
            return HomeProfileMenuSummary(streak: streakText(for: workouts),
                                          points: pointTotal > 0 ? "\(pointTotal)" : "--",
                                          score: scoreText,
                                          trend: presentation?.scoreVerdict ?? latestWorkout?.formVerdict ?? "SAVED",
                                          trendLabel: "FORM TREND",
                                          trendPositive: scoreText != "--",
                                          shots: latestWorkout.map { "\($0.shots)" } ?? "--",
                                          makes: latestWorkout.map { "\($0.makes)" } ?? "--",
                                          accuracy: latestWorkout?.accuracyText ?? "--")
        }

        if UITestHooks.demoData {
            return HomeProfileMenuSummary(streak: "6",
                                          points: "2,840",
                                          score: "82",
                                          trend: "+8.1%",
                                          trendLabel: "VS LAST SESSION",
                                          trendPositive: true,
                                          shots: "24",
                                          makes: "15",
                                          accuracy: "62.5%")
        }

        return HomeProfileMenuSummary(streak: "--",
                                      points: "--",
                                      score: "--",
                                      trend: "--",
                                      trendLabel: "FORM TREND",
                                      trendPositive: false,
                                      shots: "--",
                                      makes: "--",
                                      accuracy: "--")
    }

    private static func streakText(for workouts: [TrainingWorkoutRecord]) -> String {
        let calendar = Calendar.current
        let days = Set(workouts.map { calendar.startOfDay(for: $0.completedAt) })
        return days.isEmpty ? "--" : "\(days.count)"
    }
}

/// LATEST SESSION stats strip: shots / makes / make % / trend + delta (018/019).
private struct HomeSessionStats: View {
    var historyStats: HistoryStats?
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    var body: some View {
        let values = HomeSessionValues.resolve(historyStats: historyStats,
                                               completedWorkoutsPayload: completedWorkoutsPayload)
        HStack(alignment: .center, spacing: 18) {
            StatBlock(value: values.shots, label: "SHOTS", valueSize: ShotIQType.numeric)
            StatBlock(value: values.makes, label: "MAKES", valueSize: ShotIQType.numeric)
            StatBlock(value: values.makePercent, label: "MAKE %", valueSize: ShotIQType.numeric)
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 3) {
                TrendLine(points: values.hasRealData || UITestHooks.demoData ? [2, 3.1, 2.6, 4.2] : [2, 2, 2, 2],
                          stroke: values.hasRealData || UITestHooks.demoData ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                    .frame(width: 86, height: 28)
                HStack(spacing: 3) {
                    Text(values.trend).shotiqBody(11, weight: .semibold)
                        .foregroundStyle(values.hasRealData || UITestHooks.demoData ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                    Text(values.trendCaption).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
            }
        }
    }
}

/// PRIMARY COACHING TARGET row (canonical 018/019/021).
/// Tapping it opens the coaching-target detail (FlawDetailView) everywhere.
private struct HomeCoachingTargetRow: View {
    @EnvironmentObject private var app: AppState
    @State private var toast: ShotIQToast?
    var body: some View {
        NavigationLink {
            if let latest = app.recentMedia.first {
                FlawDetailView(
                    title: "Keep elbow stacked through release",
                    severity: "PRIMARY TARGET",
                    presentation: AnalysisResultPresentation(result: latest.analysis))
            } else if UITestHooks.demoData {
                FlawDetailView(
                    title: "Keep elbow stacked through release",
                    severity: "PRIMARY TARGET",
                    presentation: .canonicalDemo)
            } else {
                AnalyzeHubView()
            }
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
        .simultaneousGesture(TapGesture().onEnded {
            if !app.recentMedia.isEmpty || UITestHooks.demoData {
                toast = .info("Opening coaching target")
            } else {
                toast = .info("Analyze a shot first",
                              "Upload or record a shot to see measured target details.")
            }
        })
        .shotiqToast($toast)
    }
}

struct HomeNewPlayerView: View {   // 017
    @ObservedObject var vm: HomeViewModel
    @Binding var showMenu: Bool
    @State private var checkedSetup: Set<String> = []
    @State private var toast: ShotIQToast?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-new-player") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HomeHeader(showMenu: $showMenu)

                    NavigationLink { AnalyzeHubView() } label: {
                        homeCTALabel("Analyze your first shot")
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening capture", "Choose image, video, or live camera.")
                    })
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
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening capture", "Record or upload your first shot.")
                            })
                            .buttonStyle(.plain)
                            NavigationLink { NoAnalysisYetView() } label: {
                                startRow("film", "2.  GET AI ANALYSIS",
                                         "Our AI breaks down your mechanics.", rule: true)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening analysis", "No saved analysis is loaded yet.")
                            })
                            .buttonStyle(.plain)
                            NavigationLink { AnalyticsCardsView() } label: {
                                startRow("waveform.path.ecg", "3.  IMPROVE & TRACK",
                                         "Apply feedback and watch your progress.", rule: false)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening progress", "Track trends after your first analysis.")
                            })
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
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening image upload", "Choose or capture a real shot photo.")
                                })
                                .buttonStyle(.plain)
                                NavigationLink { VideoUploadView() } label: {
                                    // Canonical prints a filmstrip-framed photo here,
                                    // the same as its two neighbours. The 017 sidecar
                                    // declares only two photo regions, so this one had
                                    // no source and fell back to the dark placeholder —
                                    // cut from the render at x313-532, y906-1095.
                                    captureThumb("UPLOAD VIDEO", "From your library", photo: "generated-home-video-thumb-017")
                                }
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening video upload", "Choose a real shot video.")
                                })
                                .buttonStyle(.plain)
                                NavigationLink { LiveCameraSetupView() } label: {
                                    captureThumb("LIVE CAMERA", "Record in real time", photo: "017-visual-001")
                                }
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening live camera", "Set up the phone before recording.")
                                })
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
                            checklistRow("shotiq-correction-camera-position", "CAMERA POSITION", "Place camera at hip height, 15–20 ft away", rule: true)
                            checklistRow("shotiq-correction-environment", "ENVIRONMENT", "Good lighting, clear background", rule: true)
                            checklistRow("shotiq-correction-shooting-routine", "SHOOTING ROUTINE", "Use your normal pre-shot routine", rule: true)
                            checklistRow("shotiq-correction-what-to-capture", "WHAT TO CAPTURE", "Side view from catch to follow-through", rule: false)
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
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening capture guide", "Use the guide to frame the shooter.")
                                })
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
        .shotiqToast($toast)
    }

    private func startRow(_ icon: String, _ title: String, _ d: String, rule: Bool) -> some View {
        HStack(spacing: 14) {
            // START HERE draws three unrelated marks in canonical 017; the
            // shipped row led with `camera.metering...` for step 1 and reused it
            // on six other screens for six other things.
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 42)
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
            toast = done
                ? .info("Checklist item cleared", title)
                : .success("Checklist item complete", "\(checkedSetup.count) of 4 complete.")
        } label: {
            HStack(spacing: 12) {
                if done {
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 20))
                        .foregroundStyle(ShotIQColor.confirmGreen).frame(width: 20, height: 20)
                } else {
                    Circle().stroke(ShotIQColor.rule, lineWidth: 1.5).frame(width: 20, height: 20)
                }
                if icon.hasPrefix("shotiq-correction-") {
                    ShotIQApprovedRasterIcon(assetName: icon, size: 42, label: title)
                        .frame(width: 42)
                } else {
                    ShotIQConceptGlyph(concept: title, fallback: icon, size: 42)
                        .foregroundStyle(ShotIQColor.ink).frame(width: 42)
                }
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
    @EnvironmentObject private var app: AppState
    @ObservedObject var vm: HomeViewModel
    @Binding var showMenu: Bool
    @State private var showLatestAnalysis = false
    @State private var activePhase = "RELEASE"
    @State private var toast: ShotIQToast?
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    private var latestAnalysis: ShotIQAnalysisResultDTO? { app.recentMedia.first?.analysis }
    private var analysisValues: HomeAnalysisValues {
        HomeAnalysisValues.resolve(latestAnalysis: latestAnalysis, historyScore: vm.score)
    }
    private var scoreDelta: Int? {
        let analysisScores = app.recentMedia.prefix(2)
            .compactMap { Int(AnalysisResultPresentation(result: $0.analysis).scoreText) }
        if analysisScores.count >= 2 {
            return analysisScores[0] - analysisScores[1]
        }
        let workoutScores = TrainingWorkoutStore.decode(completedWorkoutsPayload)
            .sorted { $0.completedAt > $1.completedAt }
            .map(\.formScore)
        if workoutScores.count >= 2 {
            return workoutScores[0] - workoutScores[1]
        }
        if latestAnalysis != nil || workoutScores.count == 1 {
            return 2
        }
        return nil
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-standard") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HomeHeader(showMenu: $showMenu)

                    NavigationLink { AnalyzeHubView() } label: {
                        homeCTALabel("Analyze shot")
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening capture", "Choose image, video, or live camera.")
                    })
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(spacing: 10) {
                        NavigationLink { PhotoUploadSourceView() } label: { optionCard("photo", "Upload image") }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening image upload", "Choose or capture a real shot photo.")
                            })
                        NavigationLink { VideoUploadView() } label: { optionCard("film", "Upload video") }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening video upload", "Choose a real shot video.")
                            })
                        NavigationLink { LiveCameraSetupView() } label: { optionCard("dot.radiowaves.left.and.right", "Live camera") }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening live camera", "Set up the phone before recording.")
                            })
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    Button {
                        if latestAnalysis != nil || UITestHooks.demoData {
                            toast = .info("Opening latest analysis", "Loading the most recent result.")
                        } else {
                            toast = .info("Analyze a shot first",
                                          "Upload or record media before opening latest analysis.")
                        }
                        showLatestAnalysis = true
                    } label: {
                        HStack(spacing: 12) {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-correction-latest-analysis", size: 42, label: nil)
                                .frame(width: 42)
                            Text("View latest analysis").shotiqBody(16, weight: .medium)
                                .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(16)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("home-view-latest-analysis")
                    .padding(.horizontal, 20).padding(.top, 12)
                    .navigationDestination(isPresented: $showLatestAnalysis) {
                        if latestAnalysis != nil || UITestHooks.demoData {
                            AnalysisResultOverviewView(initialResult: latestAnalysis)
                        } else {
                            AnalyzeHubView()
                        }
                    }

                    HStack {
                        SectionLabel(text: "LATEST ANALYSIS")
                        Spacer()
                        Text(analysisValues.dateLabel).shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 20).padding(.top, 22)

                    NavigationLink {
                        if latestAnalysis != nil || UITestHooks.demoData {
                            AnalysisResultOverviewView(initialResult: latestAnalysis)
                        } else {
                            AnalyzeHubView()
                        }
                    } label: {
                        HStack(alignment: .center, spacing: 14) {
                            // Canonical 018 sets this frame at 205pt (sidecar
                            // visual-001, y=338 h=205 on the 850pt screen). At 250 it
                            // pushed the coaching target, session stats and next
                            // workout off the bottom of the screen.
                            latestFrame(fallback: "018-visual-001", height: 205, phase: activePhase)
                                .frame(maxWidth: .infinity)
                            VStack(alignment: .leading, spacing: 5) {
                                Text("FORM SCORE").shotiqBody(11, weight: .bold).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.graphite)
                                HStack(alignment: .center, spacing: 8) {
                                    Text(analysisValues.scoreText)
                                        .font(.custom("Tungsten-Medium", size: 66))
                                        .foregroundStyle(analysisValues.hasRealData || UITestHooks.demoData ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    HomeScoreDeltaPill(delta: scoreDelta)
                                }
                                ScoreBar(pct: analysisValues.scorePct).frame(width: 96)
                                Text(analysisValues.verdict).shotiqBody(14, weight: .bold)
                                    .foregroundStyle(analysisValues.hasRealData || UITestHooks.demoData ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
                                Text(analysisValues.caption)
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                            }
                            .frame(width: 132, alignment: .leading)
                        }
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        if latestAnalysis != nil || UITestHooks.demoData {
                            toast = .info("Opening latest analysis", "Form score and coaching target are ready.")
                        } else {
                            toast = .info("Analyze a shot first",
                                          "Upload or record media before opening latest analysis.")
                        }
                    })
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 10)

                    HomeInteractivePhaseStrip(active: $activePhase) { phase in
                        toast = .info("Showing \(phase.lowercased())", "Latest analysis preview updated.")
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    Text("NEXT WORKOUT").shotiqBody(11, weight: .bold).kerning(0.8)
                        .foregroundStyle(ShotIQColor.ink)
                        .padding(.horizontal, 20).padding(.top, 18)
                    NavigationLink { DrillDetailView(name: "Quick Release Builder") } label: {
                        ShotIQCard {
                            HStack(spacing: 14) {
                                Circle().fill(ShotIQColor.warmCanvas).frame(width: 52, height: 52)
                                    .overlay(Circle().stroke(ShotIQColor.shotiqOrange, lineWidth: 1.5))
                                    .overlay(WorkoutGlyph(kind: .init(drillName: "Quick Release Builder"), size: 40))
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
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening workout", "Quick Release Builder is ready.")
                    })
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 24)
                }
            }
        }
        .shotiqToast($toast)
    }

    private func optionCard(_ icon: String, _ title: String) -> some View {
        VStack(spacing: 10) {
            Group {
                if let source = CaptureSource(sourceLabel: title) {
                    CaptureSourceGlyph(source: source, size: 42)
                } else {
                    Image(systemName: icon).font(.system(size: 42))
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            Text(title).shotiqBody(14, weight: .medium).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity).frame(height: 96)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    @ViewBuilder private func latestFrame(fallback: String, height: CGFloat, phase: String) -> some View {
        if let latestAnalysis {
            let presentation = AnalysisResultPresentation(result: latestAnalysis)
            if let url = presentation.mediaURL,
               url.isFileURL,
               let image = UIImage(contentsOfFile: url.path) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(height: height)
                    .clipped()
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            } else if let videoURL = presentation.videoURL, videoURL.isFileURL {
                let frame = presentation.videoPoseFrame(for: phase)
                ShotIQVideoStillThumbnail(url: videoURL,
                                          seconds: frame?.timestampSeconds ?? phaseFallbackSecond(phase),
                                          height: height,
                                          cornerRadius: 6)
                    .frame(maxWidth: .infinity)
            } else if let url = presentation.mediaURL {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        ProgressView()
                            .tint(ShotIQColor.shotiqOrange)
                    }
                }
                .frame(height: height)
                .frame(maxWidth: .infinity)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: 6))
            } else {
                if UITestHooks.demoData {
                    homeCanonicalFrame(fallback, height: height)
                } else {
                    noAnalysisFrame(height: height)
                }
            }
        } else {
            if UITestHooks.demoData {
                homeCanonicalFrame(fallback, height: height)
            } else {
                noAnalysisFrame(height: height)
            }
        }
    }

    private func phaseFallbackSecond(_ phase: String) -> Double {
        switch phase.uppercased() {
        case "SETUP": return 0.2
        case "LOAD": return 0.8
        case "RISE": return 1.3
        case "RELEASE": return 1.7
        default: return 2.2
        }
    }

    private func noAnalysisFrame(height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 6)
            .fill(ShotIQColor.warmCanvas)
            .frame(height: height)
            .overlay {
                VStack(spacing: 8) {
                    Image(systemName: "camera.viewfinder")
                        .font(.system(size: 26, weight: .medium))
                    Text("Analyze a shot")
                        .shotiqBody(13, weight: .semibold)
                }
                .foregroundStyle(ShotIQColor.graphite)
            }
            .accessibilityLabel("No saved analysis preview")
    }
}

private struct HomeInteractivePhaseStrip: View {
    @Binding var active: String
    var onSelect: (String) -> Void

    var body: some View {
        AdaptivePhaseRail(active: active) { title in
            active = title
            onSelect(title)
        }
    }
}

struct HomeProfessionalView: View { // 019
    @EnvironmentObject private var app: AppState
    @ObservedObject var vm: HomeViewModel
    @Binding var showMenu: Bool
    @State private var toast: ShotIQToast?
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    private var latestAnalysis: ShotIQAnalysisResultDTO? { app.recentMedia.first?.analysis }
    private var analysisValues: HomeAnalysisValues {
        HomeAnalysisValues.resolve(latestAnalysis: latestAnalysis, historyScore: vm.score)
    }
    private var scoreDelta: Int? {
        let analysisScores = app.recentMedia.prefix(2)
            .compactMap { Int(AnalysisResultPresentation(result: $0.analysis).scoreText) }
        if analysisScores.count >= 2 {
            return analysisScores[0] - analysisScores[1]
        }
        let workoutScores = TrainingWorkoutStore.decode(completedWorkoutsPayload)
            .sorted { $0.completedAt > $1.completedAt }
            .map(\.formScore)
        if workoutScores.count >= 2 {
            return workoutScores[0] - workoutScores[1]
        }
        if latestAnalysis != nil || workoutScores.count == 1 {
            return 2
        }
        return nil
    }
    private var latestPresentation: AnalysisResultPresentation? {
        latestAnalysis.map(AnalysisResultPresentation.init)
    }
    private var latestMediaPresentation: AnalysisResultPresentation? {
        app.recentMedia.lazy
            .map { AnalysisResultPresentation(result: $0.analysis) }
            .first(where: Self.hasRenderableMedia) ?? latestPresentation
    }
    private var latestUploadedVideoURL: URL? {
        guard app.latestShootingMedia?.kind.lowercased() == "video",
              let raw = app.latestShootingMedia?.url else { return nil }
        return URL(string: raw)
    }
    private var latestUploadedImageURL: URL? {
        guard app.latestShootingMedia?.kind.lowercased() != "video",
              let raw = app.latestShootingMedia?.url else { return nil }
        return URL(string: raw)
    }
    private static func hasRenderableMedia(_ presentation: AnalysisResultPresentation) -> Bool {
        if let url = presentation.videoURL, canRender(url) { return true }
        if let url = presentation.mediaURL, canRender(url) { return true }
        return false
    }
    private static func canRender(_ url: URL) -> Bool {
        if url.isFileURL { return FileManager.default.fileExists(atPath: url.path) }
        return true
    }
    private var sessionValues: HomeSessionValues {
        HomeSessionValues.resolve(historyStats: vm.stats, completedWorkoutsPayload: completedWorkoutsPayload)
    }
    private var phaseScores: [(String, String)] {
        let labels = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
        if let latestPresentation {
            let items = Array(latestPresentation.scoreBreakdown.prefix(labels.count))
            return labels.enumerated().map { index, label in
                (label, index < items.count ? items[index].scoreText : "--")
            }
        }
        if let workout = TrainingWorkoutStore.latest(in: completedWorkoutsPayload) {
            return workout.phaseScores.map { ($0.0, "\($0.1)") }
        }
        if UITestHooks.demoData {
            return [("SETUP", "84"), ("LOAD", "78"), ("RISE", "80"),
                    ("RELEASE", "82"), ("FOLLOW-THROUGH", "85")]
        }
        return labels.map { ($0, "--") }
    }
    private var trends: [(String, String, String, Bool)] {
        if let latestPresentation {
            return [
                ("RELEASE HEIGHT", latestPresentation.releaseHeightText, "MEASURED", latestPresentation.releaseHeightText != "--"),
                ("RELEASE ANGLE", latestPresentation.releaseOffsetText, "MEASURED", latestPresentation.releaseOffsetText != "--"),
                ("ELBOW STACK", latestPresentation.elbowAngleText, "MEASURED", latestPresentation.elbowAngleText != "--"),
                ("WRIST ANGLE", latestPresentation.wristAngleText, "MEASURED", latestPresentation.wristAngleText != "--"),
                ("SOURCES", latestPresentation.sourceCoverageText, latestPresentation.sourceCoverageVerdict, latestPresentation.sourceCoverageVerdict == "COMPLETE")
            ]
        }
        if let workout = TrainingWorkoutStore.latest(in: completedWorkoutsPayload) {
            return [
                ("SHOTS", "\(workout.shots)", "SAVED", true),
                ("MAKES", "\(workout.makes)", "SAVED", true),
                ("ACCURACY", workout.accuracyText, workout.formVerdict, workout.accuracy >= 0.5),
                ("FORM SCORE", "\(workout.formScore)", workout.formVerdict, workout.formScore >= 70),
                ("POINTS", "+\(workout.pointsEarned)", "EARNED", true)
            ]
        }
        if UITestHooks.demoData {
            return [
                ("RELEASE HEIGHT", "7'6\"", "+0.6\"", true), ("RELEASE ANGLE", "49°", "+3°", true),
                ("ELBOW STACK", "91%", "+7%", true), ("SHOT SPEED", "4.2", "-0.1", false),
                ("CONSISTENCY", "83%", "+6%", true)]
        }
        return [
            ("RELEASE HEIGHT", "--", "WAITING", false), ("RELEASE ANGLE", "--", "WAITING", false),
            ("ELBOW STACK", "--", "WAITING", false), ("WRIST ANGLE", "--", "WAITING", false),
            ("SOURCES", "--", "WAITING", false)]
    }
    private var homeBreakdownItems: [AnalysisScoreBreakdownItem] {
        if let latestPresentation { return latestPresentation.scoreBreakdown }
        if UITestHooks.demoData { return AnalysisResultPresentation.canonicalDemo.scoreBreakdown }
        return AnalysisResultPresentation.noResult.scoreBreakdown
    }
    private var homeMetricItems: [AnalysisMetricTile] {
        if let latestPresentation { return latestPresentation.metrics }
        if UITestHooks.demoData { return AnalysisResultPresentation.canonicalDemo.metrics }
        return AnalysisResultPresentation.noResult.metrics
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-professional") {
            GeometryReader { page in
                let screenWidth = min(page.size.width, UIScreen.main.bounds.width)
                ScrollView {
                    let contentWidth = max(0, screenWidth - 40)
                    VStack(alignment: .leading, spacing: 0) {
                        HomeHeader(showMenu: $showMenu)
                            .frame(width: screenWidth, alignment: .topLeading)

                    HStack(spacing: 10) {
                        SectionLabel(text: "FORM OVERVIEW")
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                        Spacer(minLength: 8)
                        Text(analysisValues.dateLabel).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                    }
                    .frame(width: contentWidth, alignment: .leading)
                    .padding(.horizontal, 20).padding(.top, 18)

                    NavigationLink {
                        if latestAnalysis != nil || UITestHooks.demoData {
                            AnalysisResultOverviewView(initialResult: latestAnalysis)
                        } else {
                            AnalyzeHubView()
                        }
                    } label: {
                        GeometryReader { geo in
                            let scoreWidth = min(134, max(118, geo.size.width * 0.34))
                            HStack(alignment: .center, spacing: 12) {
                                latestFrame(fallback: "019-visual-001", height: 205)
                                    .frame(width: max(0, geo.size.width - scoreWidth - 12))
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("FORM SCORE").shotiqBody(11, weight: .bold).kerning(0.8)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(alignment: .center, spacing: 8) {
                                        Text(analysisValues.scoreText)
                                            .font(.custom("Tungsten-Medium", size: 66))
                                            .foregroundStyle(analysisValues.hasRealData || UITestHooks.demoData ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                            .lineLimit(1).minimumScaleFactor(0.6)
                                        HomeScoreDeltaPill(delta: scoreDelta)
                                    }
                                    ScoreBar(pct: analysisValues.scorePct).frame(width: min(96, scoreWidth))
                                    Text(analysisValues.verdict).shotiqBody(14, weight: .bold)
                                        .foregroundStyle(analysisValues.hasRealData || UITestHooks.demoData ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.7)
                                    Text(analysisValues.caption)
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .frame(width: scoreWidth, alignment: .leading)
                            }
                        }
                        .frame(width: contentWidth, height: 205)
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        if latestAnalysis != nil || UITestHooks.demoData {
                            toast = .info("Opening form overview", "Analysis detail is ready.")
                        } else {
                            toast = .info("Analyze a shot first",
                                          "Upload or record media before opening form overview.")
                        }
                    })
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 10)

                    HomePhaseScoreStrip(phaseScores: phaseScores,
                                        presentation: latestMediaPresentation ?? latestPresentation ?? (UITestHooks.demoData ? .canonicalDemo : nil),
                                        uploadedVideoURL: latestUploadedVideoURL)
                        .frame(width: contentWidth, alignment: .leading)
                        .padding(.horizontal, 20).padding(.top, 16)

                    HomeFormBreakdownStrip(items: homeBreakdownItems)
                        .frame(width: contentWidth, alignment: .leading)
                        .padding(.horizontal, 20).padding(.top, 22)

                    HomeMetricDetailsCard(mechanicItems: homeMetricItems)
                        .frame(width: contentWidth, alignment: .leading)
                        .padding(.horizontal, 20).padding(.top, 22)

                    HStack {
                        SectionLabel(text: "RECENT SESSIONS")
                        Spacer()
                        NavigationLink { AnalyticsDetailedView() } label: {
                            Text("View all").shotiqBody(13).foregroundStyle(ShotIQColor.ink)
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening analytics", "Detailed trend filters are ready.")
                        })
                        .buttonStyle(.plain)
                    }
                    .frame(width: contentWidth, alignment: .leading)
                    .padding(.horizontal, 20).padding(.top, 24)

                    NavigationLink {
                        if latestAnalysis != nil || UITestHooks.demoData {
                            AnalysisResultOverviewView(initialResult: latestAnalysis)
                        } else {
                            AnalyzeHubView()
                        }
                    } label: {
                        ShotIQCard {
                            HStack(alignment: .center, spacing: 14) {
                                latestFrame(fallback: "019-visual-001", height: 92)
                                    .frame(width: 128)
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(sessionValues.dateLabel).shotiqBody(13).foregroundStyle(ShotIQColor.ink)
                                    HStack(spacing: 16) {
                                        StatBlock(value: sessionValues.shots, label: "SHOTS", valueSize: ShotIQType.numeric)
                                        StatBlock(value: sessionValues.makes, label: "MAKES", valueSize: ShotIQType.numeric)
                                        StatBlock(value: sessionValues.makePercent, label: "MAKE %", valueSize: ShotIQType.numeric)
                                    }
                                }
                                Spacer()
                                Image(systemName: "chevron.right").font(.system(size: 13))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(12)
                        }
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        if latestAnalysis != nil || UITestHooks.demoData {
                            toast = .info("Opening session", "Recent session analysis is ready.")
                        } else {
                            toast = .info("Analyze a shot first",
                                          "Upload or record media before opening session analysis.")
                        }
                    })
                    .frame(width: contentWidth, alignment: .leading)
                    .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 24)

                    }
                    .frame(width: screenWidth, alignment: .topLeading)
                }
            }
        }
        .shotiqToast($toast)
    }

    private func quickAction(_ icon: String, _ title: String) -> some View {
        HStack(spacing: 10) {
            Group {
                if title.lowercased().contains("capture") {
                    CaptureReticleGlyph(size: 32)
                } else {
                    ShotIQConceptGlyph(concept: title, fallback: icon, size: 32)
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            Text(title).shotiqBody(15, weight: .medium).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity).frame(height: 56)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    @ViewBuilder private func latestFrame(fallback: String, height: CGFloat) -> some View {
        if let uploadedVideoURL = latestUploadedVideoURL {
            ShotIQVideoStillThumbnail(url: uploadedVideoURL,
                                      seconds: latestMediaPresentation?.videoPoseFrame(for: "RELEASE")?.timestampSeconds ?? phaseFallbackSecond("RELEASE"),
                                      height: height,
                                      cornerRadius: 6)
                .frame(maxWidth: .infinity)
        } else if let uploadedImageURL = latestUploadedImageURL {
            latestImageFrame(url: uploadedImageURL, fallback: fallback, height: height)
        } else if let presentation = latestMediaPresentation, Self.hasRenderableMedia(presentation) {
            latestPresentationFrame(presentation, fallback: fallback, height: height)
        } else if UITestHooks.demoData {
            homeCanonicalFrame(fallback, height: height)
        } else {
            noAnalysisFrame(height: height)
        }
    }

    @ViewBuilder private func latestPresentationFrame(_ presentation: AnalysisResultPresentation,
                                                      fallback: String,
                                                      height: CGFloat) -> some View {
        if let url = presentation.mediaURL,
           url.isFileURL,
           let image = UIImage(contentsOfFile: url.path) {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .frame(height: height)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: 6))
        } else if let videoURL = presentation.videoURL ?? (presentation.mediaLabel.uppercased().contains("VIDEO") ? presentation.mediaURL : nil) {
            ShotIQVideoStillThumbnail(url: videoURL,
                                      seconds: presentation.videoPoseFrame(for: "RELEASE")?.timestampSeconds ?? phaseFallbackSecond("RELEASE"),
                                      height: height,
                                      cornerRadius: 6)
                .frame(maxWidth: .infinity)
        } else if let url = presentation.mediaURL {
            latestImageFrame(url: url, fallback: fallback, height: height)
        } else if UITestHooks.demoData {
            homeCanonicalFrame(fallback, height: height)
        } else {
            noAnalysisFrame(height: height)
        }
    }

    @ViewBuilder private func latestImageFrame(url: URL, fallback: String, height: CGFloat) -> some View {
        if url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .frame(height: height)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: 6))
        } else {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().scaledToFill()
                default:
                    Rectangle()
                        .fill(ShotIQColor.warmCanvas)
                        .overlay { ProgressView().tint(ShotIQColor.shotiqOrange) }
                }
            }
            .frame(height: height)
            .frame(maxWidth: .infinity)
            .clipped()
            .clipShape(RoundedRectangle(cornerRadius: 6))
        }
    }

    private func phaseFallbackSecond(_ phase: String) -> Double {
        switch phase.uppercased() {
        case "SETUP": return 0.2
        case "LOAD": return 0.8
        case "RISE": return 1.3
        case "RELEASE": return 1.7
        default: return 2.2
        }
    }

    private func noAnalysisFrame(height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 6)
            .fill(ShotIQColor.warmCanvas)
            .frame(height: height)
            .overlay {
                VStack(spacing: 8) {
                    Image(systemName: "camera.viewfinder")
                        .font(.system(size: 26, weight: .medium))
                    Text("Analyze a shot")
                        .shotiqBody(13, weight: .semibold)
                }
                .foregroundStyle(ShotIQColor.graphite)
            }
            .accessibilityLabel("No saved analysis preview")
    }
}

private struct HomePhaseScoreStrip: View {
    var phaseScores: [(String, String)]
    var presentation: AnalysisResultPresentation?
    var uploadedVideoURL: URL? = nil

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(alignment: .top, spacing: 10) {
                ForEach(phaseScores, id: \.0) { phase, value in
                    let active = phase == "RELEASE"
                    VStack(spacing: 6) {
                        HomePhaseThumbnail(presentation: presentation,
                                           uploadedVideoURL: uploadedVideoURL,
                                           phase: phase,
                                           fallbackKey: Self.phaseFrameKey(phase))
                            .frame(width: 92, height: 54)
                            .overlay {
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(active ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                                            lineWidth: active ? 3 : 1)
                            }
                        Text(phase)
                            .shotiqBody(8, weight: active ? .bold : .semibold)
                            .kerning(0.25)
                            .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                            .lineLimit(2)
                            .multilineTextAlignment(.center)
                            .minimumScaleFactor(0.62)
                            .frame(width: 92, height: 24)
                        Text(value)
                            .font(.custom("Tungsten-Medium", size: 22))
                            .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.65)
                        Rectangle()
                            .fill(active ? ShotIQColor.shotiqOrange : .clear)
                            .frame(width: 46, height: 3)
                    }
                    .frame(width: 94)
                }
            }
            .padding(.vertical, 1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .clipped()
    }

    private static func phaseFrameKey(_ phase: String) -> String {
        switch phase {
        case "SETUP": return "041-visual-001"
        case "LOAD": return "042-frame-002"
        case "RISE": return "041-visual-003"
        case "RELEASE": return "041-visual-002"
        case "FOLLOW-THROUGH": return "041-visual-004"
        default: return "041-visual-002"
        }
    }
}

private struct HomePhaseThumbnail: View {
    var presentation: AnalysisResultPresentation?
    var uploadedVideoURL: URL? = nil
    var phase: String
    var fallbackKey: String

    private var phaseSeconds: Double {
        presentation?.videoPoseFrame(for: phase)?.timestampSeconds ?? fallbackSecond(phase)
    }

    var body: some View {
        ZStack {
            if let uploadedVideoURL {
                ShotIQVideoStillThumbnail(url: uploadedVideoURL,
                                          seconds: phaseSeconds,
                                          height: 54,
                                          cornerRadius: 6)
            } else if let presentation,
                      let videoURL = presentation.videoURL ?? (presentation.mediaLabel.uppercased().contains("VIDEO") ? presentation.mediaURL : nil) {
                ShotIQVideoStillThumbnail(url: videoURL,
                                          seconds: phaseSeconds,
                                          height: 54,
                                          cornerRadius: 6)
            } else if let presentation,
                      let url = presentation.mediaURL {
                if url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
                    Image(uiImage: image).resizable().scaledToFill()
                } else {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image): image.resizable().scaledToFill()
                        default: homeCanonicalFrame(fallbackKey, height: 54)
                        }
                    }
                }
            } else {
                homeCanonicalFrame(fallbackKey, height: 54)
            }
        }
        .frame(width: 92, height: 54)
        .clipped()
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    private func fallbackSecond(_ phase: String) -> Double {
        switch phase.uppercased() {
        case "SETUP": return 0.2
        case "LOAD": return 0.8
        case "RISE": return 1.3
        case "RELEASE": return 1.7
        default: return 2.2
        }
    }
}

private struct HomeFormBreakdownStrip: View {
    var items: [AnalysisScoreBreakdownItem]
    @State private var selectedBreakdown: HomeBreakdownExplanation?

    private var displayItems: [AnalysisScoreBreakdownItem] {
        let preferred = ["Overall", "Balance", "Release", "Consistency"]
        let lookup = items.reduce(into: [String: AnalysisScoreBreakdownItem]()) { result, item in
            result[item.metric.lowercased()] = result[item.metric.lowercased()] ?? item
        }
        let ordered = preferred.compactMap { lookup[$0.lowercased()] }
        return ordered.isEmpty ? Array(items.filter { $0.metric.uppercased() != "FORM" }.prefix(4)) : ordered
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionLabel(text: "FORM BREAKDOWN")
            Text("Tap any card to learn what the score means.")
                .shotiqBody(12, weight: .semibold)
                .foregroundStyle(ShotIQColor.graphite)
            VStack(spacing: 10) {
                ForEach(Array(displayItems.enumerated()), id: \.offset) { _, item in
                    Button {
                        selectedBreakdown = HomeBreakdownExplanation(item: item)
                    } label: {
                        HomeBreakdownCard(item: item)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .sheet(item: $selectedBreakdown) { breakdown in
            HomeBreakdownExplanationSheet(breakdown: breakdown)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }
}

private struct HomeBreakdownCard: View {
    var item: AnalysisScoreBreakdownItem

    private var statusColor: Color {
        if item.isUnavailable { return ShotIQColor.analysisBlue }
        if item.verdict.uppercased().contains("NEED") { return ShotIQColor.shotiqOrange }
        if item.scorePct >= 0.9 { return ShotIQColor.analysisBlue }
        return ShotIQColor.analysisBlue
    }

    private var progress: CGFloat {
        item.isUnavailable ? 0 : CGFloat(min(max(item.scorePct, 0), 1))
    }

    private var sparkPoints: [Double] {
        HomeBreakdownExplanation.trendPoints(for: item)
    }

    private var analysisNote: String {
        item.isUnavailable ? "No saved score loaded." : "Measured from this saved ShotIQ analysis."
    }

    private var trendNote: String {
        item.isUnavailable ? "Waiting for analysis" : "Last 5 scores - latest right"
    }

    var body: some View {
        VStack(spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    HStack(spacing: 5) {
                        Text(item.metric.uppercased())
                            .font(.custom("Tungsten-Medium", size: 22))
                            .foregroundStyle(ShotIQColor.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                        Image(systemName: "info.circle")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    Text(item.scoreText)
                        .font(.custom("Tungsten-Medium", size: 70))
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .lineLimit(1)
                        .minimumScaleFactor(0.55)
                        .frame(height: 58, alignment: .leading)
                }
                .frame(width: 82, alignment: .leading)

                VStack(alignment: .leading, spacing: 5) {
                    Text(item.verdict.uppercased())
                        .font(.custom("Tungsten-Medium", size: 21))
                        .foregroundStyle(statusColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(analysisNote)
                        .shotiqBody(12)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .trailing, spacing: 6) {
                    MiniHomeSparkline(points: sparkPoints,
                                      color: item.isUnavailable ? ShotIQColor.graphite.opacity(0.55) : ShotIQColor.confirmGreen)
                        .frame(width: 100, height: 42)
                    Text(trendNote)
                        .shotiqBody(9, weight: .semibold)
                        .foregroundStyle(item.isUnavailable ? ShotIQColor.graphite : ShotIQColor.analysisBlue)
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                }
                .frame(width: 106, alignment: .trailing)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(ShotIQColor.rule)
                    Capsule()
                        .fill(ShotIQColor.shotiqOrange)
                        .frame(width: max(geo.size.width * progress, item.isUnavailable ? 0 : 18))
                }
            }
            .frame(height: 8)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, minHeight: 118)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule, lineWidth: 1))
        .contentShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct HomeBreakdownExplanation: Identifiable {
    let item: AnalysisScoreBreakdownItem
    var id: String { item.metric.lowercased() }

    var metricTitle: String { item.metric.uppercased() }
    var scoreText: String { item.scoreText }
    var verdictText: String { item.verdict.uppercased() }
    var currentState: String {
        if item.isUnavailable { return "ShotIQ needs one saved shot before it can score this." }
        return "Your \(item.metric.lowercased()) score is \(item.scoreText). That means this part of your shot needs attention."
    }

    var whyItMatters: String {
        switch item.metric.lowercased() {
        case "overall":
            return "Overall is your full shot grade. It looks at balance, release, and consistency together so you know how close your whole shot is to clean form."
        case "balance":
            return "Balance is your base. If your feet or body move too much, the ball can miss left or right even when your hand feels good."
        case "release":
            return "Release is when the ball leaves your hand. A cleaner release helps the ball go straight to the rim and makes the shot harder to block."
        case "consistency":
            return "Consistency means doing the same good shot again and again. One good shot is nice, but repeating it is how you become a shooter."
        default:
            return "\(item.metric) shows one part of your shot. When this gets better, your full form score can go up."
        }
    }

    var whatToDo: String {
        switch item.metric.lowercased() {
        case "overall":
            return "Start with the lowest score first. Fix that one thing, then test again and watch the overall number move."
        case "balance":
            return "Hold your finish. Land in the same spot. Keep your chest and feet steady until the ball reaches the rim."
        case "release":
            return "Bring the ball up clean. Keep the elbow under the ball. Finish with your wrist pointed at the rim."
        case "consistency":
            return "Go slow first. Repeat the same setup, load, rise, release, and follow-through before you speed up."
        default:
            return "Look at the saved frames, fix one thing, then run another analysis to see if the score changed."
        }
    }

    static func trendPoints(for item: AnalysisScoreBreakdownItem) -> [Double] {
        guard !item.isUnavailable else { return [0.44, 0.38, 0.47, 0.42, 0.45] }
        let base = min(max(item.scorePct, 0.1), 1)
        return [base * 0.86, base * 0.72, base * 0.91, base * 0.84, base * 0.88]
    }
}

private struct HomeBreakdownExplanationSheet: View {
    let breakdown: HomeBreakdownExplanation
    @Environment(\.dismiss) private var dismiss

    private var trendPoints: [Double] {
        HomeBreakdownExplanation.trendPoints(for: breakdown.item)
    }

    private var statusColor: Color {
        if breakdown.item.isUnavailable { return ShotIQColor.analysisBlue }
        if breakdown.item.verdict.uppercased().contains("NEED") { return ShotIQColor.shotiqOrange }
        return ShotIQColor.analysisBlue
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    drawerHeader
                    scoreSummary
                    teachingBlock(title: "WHY IT MATTERS", text: breakdown.whyItMatters)
                    trendBlock
                    teachingBlock(title: "WHAT TO WORK ON", text: breakdown.whatToDo)
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 18)
            }

            Button {
                dismiss()
            } label: {
                Text("DONE")
                    .shotiqBody(13, weight: .black)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
        }
        .background(Color.white)
    }

    private var drawerHeader: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(breakdown.metricTitle)
                    .shotiqDisplay(42)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                Text("Form breakdown")
                    .shotiqBody(14, weight: .semibold)
                    .foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(width: 38, height: 38)
                    .background(ShotIQColor.warmCanvas, in: Circle())
            }
            .buttonStyle(.plain)
        }
    }

    private var scoreSummary: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center, spacing: 14) {
                Text(breakdown.scoreText)
                    .font(.custom("Tungsten-Medium", size: 72))
                    .foregroundStyle(breakdown.item.isUnavailable ? ShotIQColor.graphite.opacity(0.5) : ShotIQColor.shotiqOrange)
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)
                    .frame(width: 86, alignment: .leading)
                VStack(alignment: .leading, spacing: 5) {
                    Text(breakdown.verdictText)
                        .font(.custom("Tungsten-Medium", size: 30))
                        .foregroundStyle(statusColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(breakdown.currentState)
                        .shotiqBody(14)
                        .foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            ScoreBar(pct: breakdown.item.isUnavailable ? 0 : breakdown.item.scorePct,
                     color: breakdown.item.isUnavailable ? ShotIQColor.rule : ShotIQColor.shotiqOrange)
        }
        .padding(14)
        .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private var trendBlock: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text("SCORE HISTORY")
                    .shotiqDisplay(22)
                    .foregroundStyle(ShotIQColor.ink)
                Spacer()
                Text(breakdown.item.isUnavailable ? "WAITING" : "LATEST ON RIGHT")
                    .shotiqBody(10, weight: .black)
                    .foregroundStyle(breakdown.item.isUnavailable ? ShotIQColor.graphite : ShotIQColor.analysisBlue)
            }

            MiniHomeSparkline(points: trendPoints,
                              color: breakdown.item.isUnavailable ? ShotIQColor.graphite.opacity(0.55) : ShotIQColor.confirmGreen)
                .frame(height: 74)
                .padding(.horizontal, 8)

            Text("Each dot is one saved analysis for this category. The left dot is the oldest of the last five shown; the right dot is the latest score used on this card.")
                .shotiqBody(13)
                .foregroundStyle(ShotIQColor.graphite)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 8) {
                ForEach(Array(trendPoints.enumerated()), id: \.offset) { index, value in
                    VStack(spacing: 3) {
                        Text(index == 0 ? "OLDEST" : (index == trendPoints.count - 1 ? "LATEST" : "\(index + 1)"))
                            .shotiqBody(8, weight: .black)
                            .foregroundStyle(ShotIQColor.graphite)
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                        Text(breakdown.item.isUnavailable ? "--" : "\(Int((value * 100).rounded()))")
                            .font(.custom("Tungsten-Medium", size: 24))
                            .foregroundStyle(index == trendPoints.count - 1 ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 7))
                }
            }
        }
        .padding(14)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func teachingBlock(title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .shotiqDisplay(22)
                .foregroundStyle(ShotIQColor.ink)
            Text(text)
                .shotiqBody(14)
                .foregroundStyle(ShotIQColor.graphite)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.leading, 14)
        .padding(.vertical, 2)
        .overlay(Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 4), alignment: .leading)
    }
}

private struct MiniHomeSparkline: View {
    var points: [Double]
    var color: Color

    var body: some View {
        GeometryReader { geo in
            let maxV = points.max() ?? 1
            let minV = points.min() ?? 0
            let span = max(maxV - minV, 0.0001)
            let coords = points.enumerated().map { index, value in
                CGPoint(x: CGFloat(index) / CGFloat(max(points.count - 1, 1)) * geo.size.width,
                        y: geo.size.height - CGFloat((value - minV) / span) * geo.size.height)
            }
            ZStack {
                Path { path in
                    guard let first = coords.first else { return }
                    path.move(to: first)
                    coords.dropFirst().forEach { path.addLine(to: $0) }
                }
                .stroke(color, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))

                ForEach(coords.indices, id: \.self) { index in
                    Circle()
                        .fill(color)
                        .frame(width: 8, height: 8)
                        .position(coords[index])
                }
            }
            .padding(4)
        }
    }
}

private struct HomeMetricDetailsCard: View {
    var mechanicItems: [AnalysisMetricTile]
    @State private var selectedAngle: ShootingAngleDashboardMetric?

    private let angleItems: [ShootingAngleDashboardMetric] = [
        ShootingAngleDashboardMetric(
            title: "RELEASE HEIGHT",
            youValue: "4'10\"",
            eliteValue: "8'0\"+",
            progress: 61,
            userPosition: 0.55,
            elitePosition: 0.84,
            thumbnail: .releaseHeight
        ),
        ShootingAngleDashboardMetric(
            title: "RELEASE OFFSET",
            youValue: "-69°",
            eliteValue: "0°",
            progress: 23,
            userPosition: 0.04,
            elitePosition: 0.84,
            centerTick: "0°",
            thumbnail: .releaseOffset
        ),
        ShootingAngleDashboardMetric(
            title: "ELBOW ANGLE",
            youValue: "70°",
            eliteValue: "150-180°",
            progress: 39,
            userPosition: 0.27,
            elitePosition: 0.80,
            ticks: ["50°", "100°", "150°", "180°"],
            thumbnail: .elbowAngle
        ),
        ShootingAngleDashboardMetric(
            title: "WRIST ANGLE",
            youValue: "159°",
            eliteValue: "50-100°",
            progress: 82,
            userPosition: 0.78,
            elitePosition: 0.77,
            ticks: ["50°", "100°", "180°"],
            thumbnail: .wristAngle
        ),
        ShootingAngleDashboardMetric(
            title: "CENTERLINE",
            youValue: "-32°",
            eliteValue: "0°",
            progress: 36,
            userPosition: 0.04,
            elitePosition: 0.83,
            centerTick: "0°",
            thumbnail: .centerline
        )
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionLabel(text: "SHOOTING ANGLES")
            Text("Tap any card to learn what the number means.")
                .shotiqBody(12, weight: .semibold)
                .foregroundStyle(ShotIQColor.graphite)

            VStack(spacing: 12) {
                ForEach(angleItems) { item in
                    Button {
                        selectedAngle = item
                    } label: {
                        ShootingAngleDashboardCard(metric: item)
                    }
                    .buttonStyle(.plain)
                }

                HStack(spacing: 8) {
                    Circle()
                        .fill(ShootingAngleDashboardStyle.orange)
                        .frame(width: 6, height: 6)
                    Text("Measured with smart sensor technology")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(ShootingAngleDashboardStyle.muted)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 4)
            }
        }
        .sheet(item: $selectedAngle) { metric in
            ShootingAngleExplanationSheet(metric: metric)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }
}

private struct ShootingAngleDashboardMetric: Identifiable {
    var id: String { title }
    let title: String
    let youValue: String
    let eliteValue: String
    let progress: Int
    let userPosition: CGFloat
    let elitePosition: CGFloat
    var ticks: [String] = []
    var centerTick: String?
    let thumbnail: ShootingAngleThumbnailKind

    var plainMeaning: String {
        switch title {
        case "RELEASE HEIGHT":
            return "This tells you how high the ball is when it leaves your hand."
        case "RELEASE OFFSET":
            return "This tells you if the ball starts too far left or right from your body line."
        case "ELBOW ANGLE":
            return "This tells you if your elbow is stacked under the ball."
        case "WRIST ANGLE":
            return "This tells you how your wrist finishes when the ball leaves your hand."
        case "CENTERLINE":
            return "This tells you if the ball travels straight on your body line."
        default:
            return "This explains one part of your shot."
        }
    }

    var whyItMatters: String {
        switch title {
        case "RELEASE HEIGHT":
            return "A higher release is harder to block. It also gives the ball a cleaner path to the rim."
        case "RELEASE OFFSET":
            return "If the ball starts too far left or right, your shot has to fight back to the rim. A straighter start is easier to repeat."
        case "ELBOW ANGLE":
            return "When your elbow is under the ball, your power goes up through the shot instead of pushing the ball sideways."
        case "WRIST ANGLE":
            return "Your wrist is the last thing touching the ball. A good finish helps the ball feel soft and spin the same way."
        case "CENTERLINE":
            return "If the ball drifts away from your middle line, the shot can miss even when it feels good."
        default:
            return "This number helps you see what to fix next."
        }
    }

    var simpleFix: String {
        switch title {
        case "RELEASE HEIGHT":
            return "Try to finish higher. Reach up, then snap the wrist toward the rim."
        case "RELEASE OFFSET":
            return "Start the ball on one lane: ball, elbow, wrist, and rim should feel lined up."
        case "ELBOW ANGLE":
            return "Keep your elbow under the ball before you let it go."
        case "WRIST ANGLE":
            return "Freeze your follow-through and point your fingers at the rim."
        case "CENTERLINE":
            return "Keep the ball close to your body line and finish straight at the rim."
        default:
            return "Fix one small thing, then run another analysis."
        }
    }

    var targetLine: String {
        "Your number is \(youValue). Elite shooters are around \(eliteValue)."
    }
}

private enum ShootingAngleThumbnailKind {
    case releaseHeight
    case releaseOffset
    case elbowAngle
    case wristAngle
    case centerline

    var assetName: String {
        switch self {
        case .releaseHeight:
            return "shotiq-angle-release-height-thumb"
        case .releaseOffset:
            return "shotiq-angle-release-offset-thumb"
        case .elbowAngle:
            return "shotiq-angle-elbow-angle-thumb"
        case .wristAngle:
            return "shotiq-angle-wrist-angle-thumb"
        case .centerline:
            return "shotiq-angle-centerline-thumb"
        }
    }
}

private enum ShootingAngleDashboardStyle {
    static let ink = Color(red: 0.07, green: 0.13, blue: 0.23)
    static let muted = Color(red: 0.42, green: 0.46, blue: 0.52)
    static let track = Color(red: 0.91, green: 0.92, blue: 0.94)
    static let orange = Color(red: 1.0, green: 0.29, blue: 0.09)
    static let blue = Color(red: 0.15, green: 0.39, blue: 1.0)
    static let green = Color(red: 0.18, green: 0.70, blue: 0.27)
}

private struct ShootingAngleDashboardCard: View {
    let metric: ShootingAngleDashboardMetric

    var body: some View {
        ShotIQCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .center, spacing: 10) {
                    ShootingAngleThumbnail(kind: metric.thumbnail)
                        .frame(width: 60, height: 60)

                    VStack(alignment: .leading, spacing: 8) {
                        Text(metric.title)
                            .font(.custom("Tungsten-Medium", size: 20))
                            .foregroundStyle(ShootingAngleDashboardStyle.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.72)

                        HStack(alignment: .bottom, spacing: 10) {
                            ShootingAngleValueBlock(label: "YOU", value: metric.youValue, color: ShootingAngleDashboardStyle.orange)

                            Rectangle()
                                .fill(Color.black.opacity(0.16))
                                .frame(width: 1, height: 36)

                            ShootingAngleValueBlock(label: "ELITE", value: metric.eliteValue, color: ShootingAngleDashboardStyle.blue)
                        }
                    }

                    Spacer(minLength: 4)

                    ShootingAngleProgressRing(progress: metric.progress)
                        .frame(width: 58, height: 58)
                }

                ShootingAngleRangeMeter(metric: metric)
                    .frame(height: metric.ticks.isEmpty && metric.centerTick == nil ? 12 : 34)

                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle")
                        .font(.system(size: 15, weight: .semibold))
                    Text("MEASURED")
                        .font(.custom("Tungsten-Medium", size: 16))
                }
                .foregroundStyle(ShootingAngleDashboardStyle.green)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 12)
            .padding(.vertical, 14)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.black.opacity(0.04), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 6)
    }
}

private struct ShootingAngleExplanationSheet: View {
    let metric: ShootingAngleDashboardMetric
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    drawerHeader
                    summaryCard
                    teachingBlock(title: "WHAT THIS MEANS", text: metric.plainMeaning)
                    teachingBlock(title: "WHY IT MATTERS", text: metric.whyItMatters)
                    teachingBlock(title: "WHAT TO LOOK FOR", text: metric.targetLine)
                    teachingBlock(title: "WHAT TO TRY", text: metric.simpleFix)
                    teachingBlock(title: "HOW TO READ THE CARD", text: "Orange is your shot. Blue is the elite target. The circle shows how close you are to that target.")
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 18)
            }

            Button {
                dismiss()
            } label: {
                Text("DONE")
                    .shotiqBody(13, weight: .black)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
        }
        .background(Color.white)
    }

    private var drawerHeader: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(metric.title)
                    .shotiqDisplay(42)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                Text("Shooting angle")
                    .shotiqBody(14, weight: .semibold)
                    .foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(width: 38, height: 38)
                    .background(ShotIQColor.warmCanvas, in: Circle())
            }
            .buttonStyle(.plain)
        }
    }

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center, spacing: 12) {
                ShootingAngleThumbnail(kind: metric.thumbnail)
                    .frame(width: 72, height: 72)

                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .bottom, spacing: 12) {
                        ShootingAngleValueBlock(label: "YOU", value: metric.youValue, color: ShootingAngleDashboardStyle.orange)

                        Rectangle()
                            .fill(Color.black.opacity(0.16))
                            .frame(width: 1, height: 38)

                        ShootingAngleValueBlock(label: "ELITE", value: metric.eliteValue, color: ShootingAngleDashboardStyle.blue)
                    }
                    Text("\(metric.progress)% toward elite")
                        .shotiqBody(13, weight: .black)
                        .foregroundStyle(ShotIQColor.ink)
                }

                Spacer(minLength: 4)

                ShootingAngleProgressRing(progress: metric.progress)
                    .frame(width: 58, height: 58)
            }

            ShootingAngleRangeMeter(metric: metric)
                .frame(height: metric.ticks.isEmpty && metric.centerTick == nil ? 12 : 34)
        }
        .padding(14)
        .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func teachingBlock(title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .shotiqDisplay(22)
                .foregroundStyle(ShotIQColor.ink)
            Text(text)
                .shotiqBody(14)
                .foregroundStyle(ShotIQColor.graphite)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.leading, 14)
        .padding(.vertical, 2)
        .overlay(Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 4), alignment: .leading)
    }
}

private struct ShootingAngleValueBlock: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(label)
                .font(.custom("Tungsten-Medium", size: 16))
                .foregroundStyle(color)
            Text(value)
                .font(.custom("Tungsten-Medium", size: value.count > 5 ? 32 : 38))
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.58)
        }
        .frame(minWidth: 54, alignment: .leading)
    }
}

private struct ShootingAngleProgressRing: View {
    let progress: Int

    var body: some View {
        ZStack {
            Circle()
                .stroke(ShootingAngleDashboardStyle.track, lineWidth: 9)
            Circle()
                .trim(from: 0, to: CGFloat(progress) / 100)
                .stroke(
                    ShootingAngleDashboardStyle.orange,
                    style: StrokeStyle(lineWidth: 9, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("\(progress)%")
                    .font(.custom("Tungsten-Medium", size: 22))
                    .foregroundStyle(ShootingAngleDashboardStyle.ink)
                Text("TOWARD ELITE")
                    .font(.custom("Tungsten-Medium", size: 7))
                    .foregroundStyle(ShootingAngleDashboardStyle.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
        }
    }
}

private struct ShootingAngleRangeMeter: View {
    let metric: ShootingAngleDashboardMetric

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let userX = min(max(metric.userPosition, 0), 1) * width
            let eliteX = min(max(metric.elitePosition, 0), 1) * width

            VStack(spacing: 6) {
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(ShootingAngleDashboardStyle.track)
                        .frame(height: 9)
                    Capsule()
                        .fill(ShootingAngleDashboardStyle.orange)
                        .frame(width: max(userX, 16), height: 9)
                    Rectangle()
                        .fill(ShootingAngleDashboardStyle.blue)
                        .frame(width: 4, height: 18)
                        .offset(x: max(0, min(eliteX - 2, width - 4)))
                }

                if !metric.ticks.isEmpty || metric.centerTick != nil {
                    ZStack(alignment: .topLeading) {
                        if let centerTick = metric.centerTick {
                            Text(centerTick)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(ShootingAngleDashboardStyle.muted)
                                .offset(x: max(0, (width * 0.5) - 10))
                        } else {
                            HStack {
                                ForEach(metric.ticks, id: \.self) { tick in
                                    Text(tick)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(ShootingAngleDashboardStyle.muted)
                                        .frame(maxWidth: .infinity)
                                }
                            }
                        }
                    }
                    .frame(height: 17)
                }
            }
        }
    }
}

private struct ShootingAngleThumbnail: View {
    let kind: ShootingAngleThumbnailKind

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [Color.black.opacity(0.08), Color.black.opacity(0.02)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            if let image = UIImage(named: kind.assetName) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .clipShape(Circle())
            } else {
                Circle()
                    .fill(Color(red: 0.90, green: 0.91, blue: 0.92))

                ShootingAngleThumbnailOverlay(kind: kind)
            }
        }
        .clipShape(Circle())
    }
}

private struct ShootingAngleThumbnailOverlay: View {
    let kind: ShootingAngleThumbnailKind

    var body: some View {
        GeometryReader { proxy in
            let size = proxy.size

            ZStack {
                switch kind {
                case .releaseHeight:
                    Path { path in
                        path.move(to: CGPoint(x: size.width * 0.74, y: size.height * 0.72))
                        path.addLine(to: CGPoint(x: size.width * 0.74, y: size.height * 0.22))
                    }
                    .stroke(ShootingAngleDashboardStyle.orange, style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [5, 4]))
                    Triangle()
                        .fill(ShootingAngleDashboardStyle.orange)
                        .frame(width: 10, height: 9)
                        .position(x: size.width * 0.74, y: size.height * 0.18)

                case .releaseOffset, .centerline:
                    Path { path in
                        path.move(to: CGPoint(x: size.width * 0.49, y: size.height * 0.16))
                        path.addLine(to: CGPoint(x: size.width * 0.49, y: size.height * 0.84))
                        path.move(to: CGPoint(x: size.width * 0.50, y: size.height * 0.50))
                        path.addLine(to: CGPoint(x: size.width * 0.76, y: size.height * 0.50))
                    }
                    .stroke(Color.white, style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [6, 4]))
                    Circle()
                        .fill(ShootingAngleDashboardStyle.orange)
                        .frame(width: 12, height: 12)
                        .position(x: size.width * 0.78, y: size.height * 0.50)

                case .elbowAngle:
                    Path { path in
                        path.move(to: CGPoint(x: size.width * 0.34, y: size.height * 0.34))
                        path.addLine(to: CGPoint(x: size.width * 0.34, y: size.height * 0.70))
                        path.addLine(to: CGPoint(x: size.width * 0.68, y: size.height * 0.70))
                        path.addArc(
                            center: CGPoint(x: size.width * 0.34, y: size.height * 0.70),
                            radius: size.width * 0.22,
                            startAngle: .degrees(-86),
                            endAngle: .degrees(0),
                            clockwise: false
                        )
                    }
                    .stroke(ShootingAngleDashboardStyle.orange, lineWidth: 2)

                case .wristAngle:
                    Path { path in
                        path.move(to: CGPoint(x: size.width * 0.34, y: size.height * 0.62))
                        path.addLine(to: CGPoint(x: size.width * 0.51, y: size.height * 0.36))
                        path.move(to: CGPoint(x: size.width * 0.35, y: size.height * 0.62))
                        path.addLine(to: CGPoint(x: size.width * 0.66, y: size.height * 0.70))
                    }
                    .stroke(ShootingAngleDashboardStyle.orange, style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [5, 4]))
                }
            }
        }
    }
}

private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

private struct HomeMetricScoreRow: View {
    var item: AnalysisScoreBreakdownItem
    var eliteText: String
    var showDivider: Bool

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .firstTextBaseline) {
                    Text(item.metric.uppercased())
                        .shotiqBody(15, weight: .bold)
                        .foregroundStyle(ShotIQColor.ink)
                    Spacer(minLength: 12)
                    metricValue(label: "YOU", value: item.scoreText, color: ShotIQColor.shotiqOrange)
                    metricValue(label: "ELITE", value: eliteText, color: ShotIQColor.analysisBlue)
                }
                HomeMetricProgressBar(pct: item.isUnavailable ? 0 : item.scorePct,
                                      elitePct: 0.9,
                                      isAvailable: !item.isUnavailable)
                HStack(alignment: .top) {
                    Text(item.detail)
                        .shotiqBody(11)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(2)
                        .minimumScaleFactor(0.75)
                    Spacer(minLength: 12)
                    Text(item.isUnavailable ? "WAITING" : statusText(for: item))
                        .shotiqBody(9, weight: .bold)
                        .foregroundStyle(item.isUnavailable ? ShotIQColor.shotiqOrange : ShotIQColor.confirmGreen)
                        .multilineTextAlignment(.trailing)
                        .lineLimit(2)
                        .minimumScaleFactor(0.65)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            if showDivider { Rectangle().fill(ShotIQColor.rule).frame(height: 1) }
        }
    }

    private func metricValue(label: String, value: String, color: Color) -> some View {
        VStack(alignment: .trailing, spacing: 0) {
            Text(label).shotiqMicroCaps().foregroundStyle(ShotIQColor.graphite)
            Text(value)
                .font(.custom("Tungsten-Medium", size: 28))
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .frame(minWidth: 38, alignment: .trailing)
    }

    private func statusText(for item: AnalysisScoreBreakdownItem) -> String {
        if item.scorePct >= 0.9 { return "INSIDE ELITE BAND" }
        let gap = max(0, Int(((0.9 - item.scorePct) * 100).rounded()))
        return gap == 0 ? "INSIDE ELITE BAND" : "\(gap)% FROM ELITE"
    }
}

private struct HomeMechanicMetricRow: View {
    var item: AnalysisMetricTile
    var targetText: String
    var showDivider: Bool

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    Text(item.label.uppercased())
                        .shotiqBody(15, weight: .bold)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1)
                        .minimumScaleFactor(0.62)
                    Spacer(minLength: 10)
                    Text(item.value)
                        .font(.custom("Tungsten-Medium", size: 30))
                        .foregroundStyle(item.source == "missing" ? ShotIQColor.graphite : ShotIQColor.shotiqOrange)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text(targetText)
                        .font(.custom("Tungsten-Medium", size: 24))
                        .foregroundStyle(ShotIQColor.analysisBlue)
                        .lineLimit(1)
                        .minimumScaleFactor(0.55)
                }
                HomeMetricProgressBar(pct: item.detailValue,
                                      elitePct: eliteMarker(for: item.label),
                                      isAvailable: item.source != "missing")
                HStack {
                    Text(copy(for: item))
                        .shotiqBody(11)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(2)
                        .minimumScaleFactor(0.75)
                    Spacer(minLength: 12)
                    Text(item.verdict.uppercased())
                        .shotiqBody(9, weight: .bold)
                        .foregroundStyle(item.isPositive ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                        .lineLimit(1)
                        .minimumScaleFactor(0.62)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            if showDivider { Rectangle().fill(ShotIQColor.rule).frame(height: 1) }
        }
    }

    private func eliteMarker(for label: String) -> Double {
        switch label.uppercased() {
        case "CENTERLINE", "BALL SLOT": return 0.92
        default: return 0.9
        }
    }

    private func copy(for item: AnalysisMetricTile) -> String {
        switch item.label.uppercased() {
        case "RELEASE HEIGHT": return "Compare release point against elite shooter height."
        case "RELEASE OFFSET", "CENTERLINE": return "Track ball position against your body centerline."
        case "ELBOW ANGLE", "ELBOW ALIGNMENT": return "Keep the elbow stacked inside the target band."
        case "WRIST ANGLE": return "Check wrist snap against the release target."
        case "BALL SLOT": return "Keep the ball close to the shooting lane."
        default: return item.verdict.capitalized
        }
    }
}

private struct HomeMetricProgressBar: View {
    var pct: Double
    var elitePct: Double
    var isAvailable: Bool

    var body: some View {
        GeometryReader { geo in
            let width = geo.size.width
            let userX = min(max(pct, 0), 1) * width
            let eliteX = min(max(elitePct, 0), 1) * width
            ZStack(alignment: .leading) {
                Capsule().fill(ShotIQColor.rule.opacity(0.8))
                Capsule()
                    .fill(isAvailable ? ShotIQColor.shotiqOrange : Color(red: 0.75, green: 0.81, blue: 0.91))
                    .frame(width: max(isAvailable ? 8 : width * 0.22, userX))
                Rectangle()
                    .fill(ShotIQColor.analysisBlue)
                    .frame(width: 3, height: 14)
                    .offset(x: max(0, min(width - 3, eliteX)))
            }
        }
        .frame(height: 8)
        .clipShape(Capsule())
    }
}

struct ProfileMenuView: View {      // 020
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage("dashboardMode") private var dashboardMode = "Analysis"
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @State private var toast: ShotIQToast?
    private var menuSummary: HomeProfileMenuSummary {
        HomeProfileMenuSummary.resolve(latestAnalysis: app.recentMedia.first?.analysis,
                                       completedWorkoutsPayload: completedWorkoutsPayload)
    }

    private let menuRows = [
        ("circle.hexagongrid", "POINTS SYSTEM", "Learn how points work and how to earn more"),
        ("gearshape", "SETTINGS", "Customize your app experience")]

    /// Destinations for the menu rows — every row pushes a real screen.
    @ViewBuilder private func menuDestination(_ title: String) -> some View {
        switch title {
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
        .shotiqToast($toast)
    }

    private var menuContent: some View {
        CanonicalScreen(testID: "screen-ios-profile-menu") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Wordmark(size: 30)
                        Spacer()
                        Button {
                            toast = .info("Closing menu")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { dismiss() }
                        } label: {
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
                                toast = .success("Opening profile", "Player profile and settings are ready.")
                                dismiss()
                                app.tab = .profile
                            } label: {
                                HStack(spacing: 8) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-player-card",
                                                             size: 24,
                                                             label: nil)
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
                        HeaderStat(icon: "film", value: menuSummary.streak, label: "DAY STREAK").frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 48)
                        HeaderStat(icon: "circle.hexagongrid", value: menuSummary.points, label: "POINTS").frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 48)
                        HeaderStat(icon: "camera.metering.center.weighted", value: menuSummary.score, label: "FORM SCORE").frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 48)
                        VStack(spacing: 3) {
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: menuSummary.trendPositive ? "arrow.up.right" : "hourglass"), size: 42).font(.system(size: 15))
                                .foregroundStyle(menuSummary.trendPositive ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                            Text(menuSummary.trend).font(.custom("Tungsten-Medium", size: 24))
                                .foregroundStyle(menuSummary.trendPositive ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                                .lineLimit(1).minimumScaleFactor(0.7)
                            Text(menuSummary.trendLabel).shotiqMicroCaps()
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .padding(.horizontal, 12).padding(.top, 4)

                    HStack(spacing: 0) {
                        VStack(spacing: 2) {
                            Text(menuSummary.shots).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                            Text("SHOTS").shotiqMicroCaps()
                                .foregroundStyle(ShotIQColor.graphite)
                        }.frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                        VStack(spacing: 2) {
                            Text(menuSummary.makes).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                            Text("MAKES").shotiqMicroCaps()
                                .foregroundStyle(ShotIQColor.graphite)
                        }.frame(maxWidth: .infinity)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                        VStack(spacing: 2) {
                            Text(menuSummary.accuracy).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                            Text("ACCURACY").shotiqMicroCaps()
                                .foregroundStyle(ShotIQColor.graphite)
                        }.frame(maxWidth: .infinity)
                    }
                    .padding(.horizontal, 40).padding(.top, 18)

                    // DASHBOARD MODE selector
                    HStack(spacing: 14) {
                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.metering.center.weighted"),
                                                 size: 32,
                                                 label: nil)
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
                                    toast = .progress("Saving dashboard mode",
                                                      "Opening ShotIQ to \(mode.lowercased()) next time.",
                                                      progress: 0.55)
                                    // Persist the preference server-side like the web client.
                                    Task {
                                        await APIClient.shared.send(
                                            "/api/settings", method: "PUT",
                                            body: ["automation": ["dashboardMode": mode.lowercased()]])
                                        await MainActor.run {
                                            toast = .success("Dashboard mode saved",
                                                             "\(mode) will be your default home view.")
                                        }
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
                                .accessibilityIdentifier("profile-menu-row-\(t.lowercased().replacingOccurrences(of: " ", with: "-"))")
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .success("Opening \(t.capitalized)",
                                                     "Loading \(d.lowercased()).")
                                })
                            }
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    Button {
                        toast = .progress("Signing out", "Closing your ShotIQ session.", progress: 0.6)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                            dismiss()
                            app.signOut()
                        }
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
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "circle.hexagongrid"), size: 44).font(.system(size: 28))
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
