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
    @AppStorage("homeVariant") private var pro = true
    @AppStorage("dashboardMode") private var dashboardMode = "Analysis"

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
            } else if let error = vm.loadError {
                HomeHistoryUnavailableView(message: error, showMenu: $showMenu) {
                    Task { await vm.load() }
                }
            } else if !vm.hasData {
                HomeNewPlayerView(vm: vm, showMenu: $showMenu)
            } else if dashboardMode == "Training" {
                TrainingHomeView()
            } else if pro {
                HomeProfessionalView(vm: vm, showMenu: $showMenu)
            } else {
                HomeStandardView(vm: vm, showMenu: $showMenu)
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
        if let historyStats, (historyStats.totalAnalyses ?? 0) > 0 {
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
    private var latestAnalysis: ShotIQAnalysisResultDTO? { app.recentMedia.first?.analysis }
    private var analysisValues: HomeAnalysisValues {
        HomeAnalysisValues.resolve(latestAnalysis: latestAnalysis, historyScore: vm.score)
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
                                Text(analysisValues.scoreText)
                                    .font(.custom("Tungsten-Medium", size: 66))
                                    .foregroundStyle(analysisValues.hasRealData || UITestHooks.demoData ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                ScoreBar(pct: analysisValues.scorePct).frame(width: 96)
                                Text(analysisValues.verdict).shotiqBody(14, weight: .bold)
                                    .foregroundStyle(analysisValues.hasRealData || UITestHooks.demoData ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
                                Text(analysisValues.caption)
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                            }
                            .frame(width: 108, alignment: .leading)
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

                    HomeCoachingTargetRow().padding(.horizontal, 20).padding(.top, 16)

                    SectionLabel(text: "LATEST SESSION").padding(.horizontal, 20).padding(.top, 14)
                    HomeSessionStats(historyStats: vm.stats).padding(.horizontal, 20).padding(.top, 8)

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
        HStack(alignment: .top) {
            ForEach(ShotPhase.allCases, id: \.self) { phase in
                let title = phase.title
                let on = active == title
                Button {
                    active = title
                    onSelect(title)
                } label: {
                    VStack(spacing: 4) {
                        PhaseGlyph(phase: phase, active: on, size: 44)
                        Text(title)
                            .shotiqMicroCaps(weight: on ? .bold : .regular,
                                             tracking: ShotIQType.microTracking - 0.05)
                            .foregroundStyle(on ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                        Rectangle()
                            .fill(on ? ShotIQColor.shotiqOrange : .clear)
                            .frame(width: 40, height: 3)
                    }
                    .frame(maxWidth: .infinity)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Show \(title.lowercased()) frame")
            }
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
    private var latestPresentation: AnalysisResultPresentation? {
        latestAnalysis.map(AnalysisResultPresentation.init)
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

    var body: some View {
        CanonicalScreen(testID: "screen-ios-home-professional") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HomeHeader(showMenu: $showMenu)

                    NavigationLink { AnalyzeHubView() } label: {
                        homeCTALabel("Open analysis workspace")
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening analysis workspace", "Capture, upload, and review tools are ready.")
                    })
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(spacing: 10) {
                        NavigationLink { AnalyzeHubView() } label: { quickAction("figure.basketball", "New capture") }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening capture", "Choose image, video, or live camera.")
                            })
                        NavigationLink {
                            if latestAnalysis != nil || UITestHooks.demoData {
                                AnalysisResultOverviewView(initialResult: latestAnalysis)
                            } else {
                                AnalyzeHubView()
                            }
                        } label: { quickAction("film", "View history") }
                            .simultaneousGesture(TapGesture().onEnded {
                                if latestAnalysis != nil || UITestHooks.demoData {
                                    toast = .info("Opening history", "Latest analysis summary is ready.")
                                } else {
                                    toast = .info("Analyze a shot first",
                                                  "Upload or record media before opening history.")
                                }
                            })
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    HStack {
                        SectionLabel(text: "FORM OVERVIEW")
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
                            latestFrame(fallback: "019-visual-001", height: 205)
                                .frame(maxWidth: .infinity)
                            VStack(alignment: .leading, spacing: 5) {
                                Text("FORM SCORE").shotiqBody(11, weight: .bold).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text(analysisValues.scoreText)
                                    .font(.custom("Tungsten-Medium", size: 66))
                                    .foregroundStyle(analysisValues.hasRealData || UITestHooks.demoData ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                ScoreBar(pct: analysisValues.scorePct).frame(width: 96)
                                Text(analysisValues.verdict).shotiqBody(14, weight: .bold)
                                    .foregroundStyle(analysisValues.hasRealData || UITestHooks.demoData ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
                                Text(analysisValues.caption)
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                            }
                            .frame(width: 108, alignment: .leading)
                        }
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
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "arrowtriangle.up.fill"), size: 32).font(.system(size: 8))
                                .foregroundStyle(ShotIQColor.confirmGreen)
                            Text("Improved").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                            Text("—").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                            Text("Stable").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "arrowtriangle.down.fill"), size: 32).font(.system(size: 8))
                                .foregroundStyle(ShotIQColor.reviewRed)
                            Text("Needs work").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 22)

                    HStack(alignment: .top, spacing: 4) {
                        ForEach(trends, id: \.0) { label, value, delta, up in
                            VStack(spacing: 4) {
                                MechanicGlyph(kind: .init(metricLabel: label), size: 30)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text(label).shotiqBody(8, weight: .medium).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text(value).font(.custom("Tungsten-Medium", size: 22))
                                    .foregroundStyle(ShotIQColor.ink)
                                HStack(spacing: 2) {
                                    Text(delta).shotiqBody(11, weight: .semibold)
                                    Image(systemName: up ? "arrow.up.right" : "hourglass").font(.system(size: 8))
                                }
                                .foregroundStyle(up ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
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
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening analytics", "Detailed trend filters are ready.")
                        })
                        .buttonStyle(.plain)
                    }
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
                    .padding(.horizontal, 20).padding(.top, 8)

                    HomeCoachingTargetRow().padding(.horizontal, 20).padding(.top, 16)

                    HomeSessionStats(historyStats: vm.stats).padding(.horizontal, 20).padding(.top, 12).padding(.bottom, 24)
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
