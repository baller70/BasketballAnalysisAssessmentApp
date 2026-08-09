import SwiftUI
import UIKit
import UserNotifications
import AVKit

// Remaining flows — goals 063-065, analytics 066-067, media 068-069,
// profile 070, settings 071, share 072.

/// A goal exactly as GET /api/goals serializes it (src/lib/api/serializers.ts
/// `serializeGoal`: `name`, `currentValue`, `targetValue`, …).
struct GoalRecord: Codable, Identifiable {
    var id: String
    var name: String
    var description: String? = nil
    var targetValue: Int? = nil
    var currentValue: Int? = nil
    var unit: String? = nil
    var category: String? = nil
    var xpReward: Int? = nil
    var deadline: String? = nil
    var completedAt: String? = nil
    var progress: Double {
        guard let t = targetValue, t > 0 else { return 0 }
        return min(1, max(0, Double(currentValue ?? 0) / Double(t)))
    }
}

enum CreatedGoalStore {
    static let key = "shotiq.goals.created.v1"

    static func decode(_ payload: String) -> [GoalRecord] {
        guard let data = payload.data(using: .utf8),
              let goals = try? JSONDecoder().decode([GoalRecord].self, from: data) else {
            return []
        }
        return goals
    }

    static func stored() -> [GoalRecord] {
        decode(UserDefaults.standard.string(forKey: key) ?? "")
    }

    static func encode(_ goals: [GoalRecord]) -> String {
        guard let data = try? JSONEncoder().encode(goals) else { return "[]" }
        return String(data: data, encoding: .utf8) ?? "[]"
    }

    static func append(_ goal: GoalRecord, to payload: String) -> String {
        var goals = decode(payload).filter {
            $0.id != goal.id && $0.name.localizedCaseInsensitiveCompare(goal.name) != .orderedSame
        }
        goals.insert(goal, at: 0)
        return encode(goals)
    }

    static func latest(in payload: String) -> GoalRecord? {
        decode(payload).first { $0.completedAt == nil }
    }

    static func update(_ id: String, in payload: String, mutate: (inout GoalRecord) -> Void) -> String {
        var goals = decode(payload)
        guard let index = goals.firstIndex(where: { $0.id == id }) else { return payload }
        mutate(&goals[index])
        return encode(goals)
    }
}

@MainActor
final class GoalsViewModel: ObservableObject {
    @Published var goals: [GoalRecord] = []
    @Published var loading = true
    @Published var loadError: String?

    func load(localGoals: [GoalRecord] = []) async {
        loading = true
        loadError = nil
        defer { loading = false }

        if UITestHooks.demoData {
            goals = Self.merged(localGoals, with: Self.samples)
            return
        }

        struct Resp: Codable { var goals: [GoalRecord]? }
        do {
            let r: Resp = try await APIClient.shared.call("/api/goals")
            goals = Self.merged(localGoals, with: r.goals ?? [])
        } catch {
            goals = localGoals
            loadError = localGoals.isEmpty ? "Goals could not load. Check your connection and try again." : nil
        }
    }

    private static func merged(_ localGoals: [GoalRecord], with remoteGoals: [GoalRecord]) -> [GoalRecord] {
        var seenIds: Set<String> = []
        var seenNames: Set<String> = []
        return (localGoals + remoteGoals).filter { goal in
            let nameKey = goal.name.lowercased()
            guard !seenIds.contains(goal.id), !seenNames.contains(nameKey) else { return false }
            seenIds.insert(goal.id)
            seenNames.insert(nameKey)
            return true
        }
    }

    private static let samples = [
        GoalRecord(id: "g1", name: "Keep elbow stacked through release", targetValue: 100, currentValue: 68),
        GoalRecord(id: "g2", name: "Raise make % to 65", targetValue: 100, currentValue: 40)
    ]

    var active: [GoalRecord] { goals.filter { $0.completedAt == nil } }
    var completed: [GoalRecord] { goals.filter { $0.completedAt != nil } }
}

private struct GoalCardStats {
    var sessionsValue: String
    var sessionsCaption: String
    var formScoreValue: String
    var formScoreDelta: String?
    var formScoreCaption: String
    var makePctValue: String
    var makePctDelta: String?
    var makePctCaption: String
    var formTrend: [Double]
    var makeTrend: [Double]
    var formEndBadge: String?
    var makeEndBadge: String?
    var recentTitle: String?
    var recentSummary: String?
    var recentScore: String?
    var insightLines: [String]

    static let canonical = GoalCardStats(
        sessionsValue: "9",
        sessionsCaption: "of 15",
        formScoreValue: "82",
        formScoreDelta: "+6 pts",
        formScoreCaption: "vs goal start",
        makePctValue: "64.1%",
        makePctDelta: "+4.3%",
        makePctCaption: "vs goal start",
        formTrend: [58, 59, 55, 62, 60, 57, 64, 66, 70, 68, 74, 72, 75, 79, 76, 80, 82],
        makeTrend: [48, 50, 47, 52, 55, 53, 56, 58, 57, 60, 59, 61, 62, 63, 62, 64, 64],
        formEndBadge: "82",
        makeEndBadge: "64",
        recentTitle: "May 19, 8:24 AM",
        recentSummary: "24 shots · 15 makes · 62.5%",
        recentScore: "82",
        insightLines: [
            "Your elbow angle held in range on 8 of your last 10 sessions.",
            "Accuracy climbs 6% on days you complete a form-focus drill first.",
            "Sessions before 9 AM show your most consistent release."
        ])

    static let empty = GoalCardStats(
        sessionsValue: "--",
        sessionsCaption: "No completed sessions",
        formScoreValue: "--",
        formScoreDelta: nil,
        formScoreCaption: "Needs workout history",
        makePctValue: "--",
        makePctDelta: nil,
        makePctCaption: "Needs shot history",
        formTrend: [0, 0],
        makeTrend: [0, 0],
        formEndBadge: nil,
        makeEndBadge: nil,
        recentTitle: nil,
        recentSummary: nil,
        recentScore: nil,
        insightLines: ["Complete a workout to unlock goal insights from your own history."])

    static func live(from workouts: [TrainingWorkoutRecord]) -> GoalCardStats {
        guard !workouts.isEmpty else { return .empty }
        let ordered = workouts.sorted { $0.completedAt < $1.completedAt }
        let latest = ordered.last!
        let totalShots = ordered.reduce(0) { $0 + $1.shots }
        let totalMakes = ordered.reduce(0) { $0 + $1.makes }
        let averageScore = Int((Double(ordered.reduce(0) { $0 + $1.formScore }) / Double(ordered.count)).rounded())
        let makePct = totalShots == 0 ? "--" : String(format: "%.1f%%", Double(totalMakes) / Double(totalShots) * 100)
        let formTrend = ordered.map { Double($0.formScore) }
        let makeTrend = ordered.map { $0.accuracy * 100 }
        let formDelta = ordered.count > 1 ? signed(ordered.last!.formScore - ordered.first!.formScore, suffix: " pts") : nil
        let makeDelta = ordered.count > 1 ? signedPercent((ordered.last!.accuracy - ordered.first!.accuracy) * 100) : nil
        let sessionWord = ordered.count == 1 ? "session" : "sessions"

        return GoalCardStats(
            sessionsValue: "\(ordered.count)",
            sessionsCaption: "completed \(sessionWord)",
            formScoreValue: "\(averageScore)",
            formScoreDelta: formDelta,
            formScoreCaption: ordered.count > 1 ? "from first session" : "latest session",
            makePctValue: makePct,
            makePctDelta: makeDelta,
            makePctCaption: ordered.count > 1 ? "from first session" : "all logged shots",
            formTrend: formTrend.count == 1 ? [formTrend[0], formTrend[0]] : formTrend,
            makeTrend: makeTrend.count == 1 ? [makeTrend[0], makeTrend[0]] : makeTrend,
            formEndBadge: "\(latest.formScore)",
            makeEndBadge: latest.shots == 0 ? nil : String(format: "%.0f", latest.accuracy * 100),
            recentTitle: latest.drillName,
            recentSummary: "\(latest.shots) shots · \(latest.makes) makes · \(latest.accuracyText)",
            recentScore: "\(latest.formScore)",
            insightLines: [
                "Latest session: \(latest.drillName) at \(latest.accuracyText).",
                "Average form score is \(averageScore) across \(ordered.count) completed \(sessionWord).",
                totalShots == 0 ? "Log makes and misses to unlock make percentage trends." : "\(totalMakes) of \(totalShots) logged shots were makes."
            ])
    }

    private static func signed(_ value: Int, suffix: String) -> String {
        value >= 0 ? "+\(value)\(suffix)" : "\(value)\(suffix)"
    }

    private static func signedPercent(_ value: Double) -> String {
        let prefix = value >= 0 ? "+" : ""
        return "\(prefix)\(String(format: "%.1f", value))%"
    }
}

private struct MediaAnalysisSurface: View {
    var analysis: ShotIQAnalysisResultDTO?
    var fallbackPhoto: String
    var width: CGFloat? = nil
    var height: CGFloat
    var cornerRadius: CGFloat = 6

    private var presentation: AnalysisResultPresentation? {
        analysis.map(AnalysisResultPresentation.init)
    }

    var body: some View {
        ZStack {
            if let presentation {
                switch AnalysisResultMediaSurfaceResolver.source(for: presentation,
                                                                 fallbackKey: fallbackPhoto) {
                case .video(let url):
                    VideoPlayer(player: AVPlayer(url: url))
                        .accessibilityLabel("Saved media video")
                case .image(let url):
                    if url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                    } else {
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .success(let image): image.resizable().scaledToFill()
                            default: mediaPlaceholder(presentation.mediaLabel)
                            }
                        }
                    }
                case .canonicalFallback(let key):
                    CanonicalPhoto(key, width: width, height: height, cornerRadius: cornerRadius)
                case .placeholder(let label):
                    mediaPlaceholder(label)
                }
            } else {
                CanonicalPhoto(fallbackPhoto, width: width, height: height, cornerRadius: cornerRadius)
            }
        }
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        .accessibilityIdentifier(analysis == nil ? "media-sample-surface" : "media-real-surface")
    }

    private func mediaPlaceholder(_ label: String) -> some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
            .overlay {
                VStack(spacing: 6) {
                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "photo"),
                                             size: 26,
                                             label: nil)
                    Text(label)
                        .shotiqBody(11, weight: .medium)
                }
                .foregroundStyle(.white.opacity(0.86))
                .multilineTextAlignment(.center)
                .padding(8)
            }
    }
}

struct GoalsView: View {            // 063
    enum GoalsRoute: Hashable { case analyticsCards, recentSession }

    @StateObject private var vm = GoalsViewModel()
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @AppStorage(CreatedGoalStore.key) private var createdGoalsPayload = ""
    @State private var tab = 0
    @State private var trendMetric = "Form Score"
    @State private var insightsExpanded: Set<String> = []
    @State private var route: GoalsRoute?
    private var completedWorkouts: [TrainingWorkoutRecord] {
        TrainingWorkoutStore.decode(completedWorkoutsPayload)
    }
    private var createdGoals: [GoalRecord] {
        CreatedGoalStore.decode(createdGoalsPayload)
    }
    private var goalStats: GoalCardStats {
        if !completedWorkouts.isEmpty { return .live(from: completedWorkouts) }
        return UITestHooks.demoData ? .canonical : .empty
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-goals") {
            let shown = tab == 0 ? vm.active : vm.completed
            ZStack(alignment: .topLeading) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        TopBar()
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top, spacing: 12) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("GOALS").shotiqDisplay(40)
                                    Text("Track progress. Stay consistent. Build better mechanics.")
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 8)
                                NavigationLink { PlayerCardView() } label: {
                                    HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Open player card")
                                .accessibilityIdentifier("goals-player-card-link")
                            }
                            .padding(.top, 16)
                            NavigationLink { CreateGoalView(onCreated: { await vm.load(localGoals: CreatedGoalStore.stored()) }) } label: {
                                HStack(spacing: 10) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "plus.viewfinder"),
                                                             size: 18,
                                                             label: nil)
                                    Text("Create goal").shotiqBody(17, weight: .medium)
                                }
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            .accessibilityLabel("Create goal")
                            .accessibilityIdentifier("goals-create-goal")
                            .padding(.top, 16)
                            HStack(spacing: 0) {
                                goalsTab("ACTIVE (\(vm.active.count))", 0)
                                goalsTab("COMPLETED (\(vm.completed.count))", 1)
                            }
                            .padding(.top, 18)
                            if vm.loading {
                                ProgressView()
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 34)
                            } else if shown.isEmpty {
                                ShotIQCard {
                                    VStack(spacing: 8) {
                                        Image(systemName: tab == 0 ? "target" : "checkmark.circle")
                                            .font(.system(size: 26)).foregroundStyle(ShotIQColor.graphite)
                                        Text(vm.loadError == nil
                                             ? (tab == 0 ? "No active goals" : "No completed goals yet")
                                             : "Goals unavailable")
                                            .shotiqBody(15, weight: .semibold)
                                        Text(vm.loadError
                                             ?? (tab == 0 ? "Create a goal to start tracking progress."
                                                          : "Goals you finish will appear here."))
                                            .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                            .multilineTextAlignment(.center)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                    .frame(maxWidth: .infinity).padding(.vertical, 28)
                                }
                                .padding(.top, 14)
                            }
                            if UITestHooks.active {
                                ForEach(shown) { g in
                                    goalProofMarkers(g)
                                }
                            }
                            if UITestHooks.goalsRouteProof {
                                ForEach(shown) { g in
                                    goalRouteProofButtons(g)
                                }
                            }
                            ForEach(shown) { g in
                                goalCard(g)
                                    .padding(.top, 14)
                            }
                            Spacer(minLength: 30)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .task { await vm.load(localGoals: createdGoals) }
        .navigationDestination(item: $route) { route in
            switch route {
            case .analyticsCards:
                AnalyticsCardsView()
            case .recentSession:
                AnalyticsDetailedView(metric: "Form Score")
            }
        }
    }
    private func goalsTab(_ label: String, _ index: Int) -> some View {
        Button { tab = index } label: {
            VStack(spacing: 8) {
                Text(label).shotiqBody(13, weight: .bold).kerning(0.5)
                    .foregroundStyle(tab == index ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                Rectangle().fill(tab == index ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                    .frame(height: tab == index ? 2 : 1)
            }
            .frame(maxWidth: .infinity)
        }
        .accessibilityIdentifier(index == 0 ? "goals-tab-active" : "goals-tab-completed")
    }
    private func goalCard(_ g: GoalRecord) -> some View {
        let pct = g.progress
        let stats = goalStats
        return ShotIQCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("PRIMARY TARGET").shotiqBody(10, weight: .bold).kerning(0.5)
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .overlay(RoundedRectangle(cornerRadius: 4).stroke(ShotIQColor.shotiqOrange))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        NavigationLink { GoalDetailView(goal: g, onChanged: { await vm.load() }) } label: {
                            HStack(alignment: .firstTextBaseline, spacing: 6) {
                                Text(g.name).shotiqBody(19, weight: .bold)
                                    .multilineTextAlignment(.leading)
                                    .fixedSize(horizontal: false, vertical: true)
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 11, weight: .semibold))
                            }
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(g.name)
                        .accessibilityIdentifier("goals-card-title-\(g.id)")
                        Text((g.description?.isEmpty == false ? g.description! :
                                "Improve alignment and control by maintaining a vertical elbow path to the release."))
                            .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    PhotoThumb(width: 116, height: 128, photo: "065-visual-001")
                }
                VStack(alignment: .leading, spacing: 6) {
                    MicroLabel(text: "GOAL PROGRESS")
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text("\(Int(pct * 100))%").font(.custom("Tungsten-Medium", size: 40))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .accessibilityElement()
                            .accessibilityLabel("\(Int(pct * 100))%")
                            .accessibilityIdentifier("goals-progress-\(g.id)")
                        VStack(alignment: .leading, spacing: 1) {
                            Text("ON TRACK").shotiqBody(11, weight: .bold)
                                .foregroundStyle(ShotIQColor.confirmGreen)
                            Text("Keep it up").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                    }
                    ScoreBar(pct: pct)
                        .accessibilityElement()
                        .accessibilityLabel("Goal progress \(Int(pct * 100)) percent")
                        .accessibilityIdentifier("goals-progress-bar-\(g.id)")
                }
                HStack(spacing: 0) {
                    goalStat("SESSIONS", stats.sessionsValue, nil, stats.sessionsCaption,
                             id: "goals-stat-sessions-\(g.id)")
                    VRule(height: 44)
                    goalStat("AVG. FORM SCORE", stats.formScoreValue, stats.formScoreDelta, stats.formScoreCaption,
                             id: "goals-stat-form-score-\(g.id)")
                    VRule(height: 44)
                    goalStat("MAKE %", stats.makePctValue, stats.makePctDelta, stats.makePctCaption,
                             id: "goals-stat-make-pct-\(g.id)")
                }
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        MicroLabel(text: "GOAL TREND")
                        Spacer()
                        Button {
                            trendMetric = trendMetric == "Form Score" ? "Make %" : "Form Score"
                        } label: {
                            HStack(spacing: 4) {
                                Text(trendMetric).shotiqBody(12, weight: .semibold)
                                Image(systemName: "chevron.down").font(.system(size: 8))
                            }
                            .foregroundStyle(ShotIQColor.ink)
                            .accessibilityElement(children: .ignore)
                            .accessibilityLabel(trendMetric)
                            .accessibilityIdentifier("goals-trend-toggle-\(g.id)")
                        }
                        .buttonStyle(.plain)
                    }
                    // Canonical charts are bounded and labelled: gridlines, tick
                    // labels on both axes, a tinted area fill and an end-point badge.
                    TrendLine(points: trendMetric == "Form Score" ? stats.formTrend : stats.makeTrend,
                              stroke: ShotIQColor.shotiqOrange,
                              areaFill: true, gridlines: true,
                              xLabels: ["W1", "W5", "W9", "W13", "W17"],
                              yLabels: ["100", "75", "50", "25"],
                              endBadge: trendMetric == "Form Score" ? stats.formEndBadge : stats.makeEndBadge,
                              showsNodes: false)
                        .frame(height: 84)
                        .accessibilityElement()
                        .accessibilityLabel("Goal trend \(trendMetric) \(trendMetric == "Form Score" ? (stats.formEndBadge ?? "--") : (stats.makeEndBadge ?? "--"))")
                        .accessibilityIdentifier("goals-trend-chart-\(g.id)")
                }
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        SectionLabel(text: "RECENT SESSIONS")
                        Spacer()
                        Button { route = .analyticsCards } label: {
                            Text("View all").shotiqBody(13, weight: .semibold)
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("goals-view-all-visible-\(g.id)")
                    }
                    if let recentTitle = stats.recentTitle,
                       let recentSummary = stats.recentSummary,
                       let recentScore = stats.recentScore {
                        Button { route = .recentSession } label: {
                            HStack(spacing: 10) {
                                PhotoThumb(width: 62, height: 46, icon: "play.circle", photo: "066-visual-001")
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(recentTitle).shotiqBody(14, weight: .bold)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .accessibilityIdentifier("goals-recent-title-\(g.id)")
                                    Text(recentSummary)
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                        .accessibilityIdentifier("goals-recent-summary-\(g.id)")
                                }
                                Spacer(minLength: 4)
                                Text(recentScore).font(.custom("Tungsten-Medium", size: 18))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                    .padding(.horizontal, 8).padding(.vertical, 4)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.analysisBlue))
                                    .accessibilityIdentifier("goals-recent-score-\(g.id)")
                                Image(systemName: "chevron.right").font(.system(size: 12))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .accessibilityElement(children: .combine)
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("goals-recent-session-visible-\(g.id)")
                    } else {
                        HStack(spacing: 10) {
                            PhotoThumb(width: 62, height: 46, icon: "play.circle", photo: "066-visual-001")
                            VStack(alignment: .leading, spacing: 3) {
                                Text("No completed sessions yet").shotiqBody(14, weight: .bold)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("Finish a workout to fill this row.")
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer(minLength: 4)
                            Text("--").font(.custom("Tungsten-Medium", size: 18))
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .accessibilityElement(children: .combine)
                        .accessibilityIdentifier("goals-recent-empty-\(g.id)")
                    }
                    HRule()
                    NavigationLink { AnalyticsDetailedView(metric: "Elbow Alignment") } label: {
                        HStack(alignment: .top, spacing: 8) {
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "sparkles"), size: 32).font(.system(size: 14))
                                .foregroundStyle(ShotIQColor.analysisBlue)
                            (Text("Tip: ").fontWeight(.bold)
                                + Text("Your release improved when your elbow stayed stacked in the load and rise phases."))
                                .font(.system(size: 11)).foregroundStyle(ShotIQColor.ink)
                                .multilineTextAlignment(.leading)
                                .fixedSize(horizontal: false, vertical: true)
                            Spacer(minLength: 2)
                            Image(systemName: "chevron.right").font(.system(size: 11))
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                    }
                    .buttonStyle(.plain)
                }
                .padding(12)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                Button {
                    withAnimation {
                        if insightsExpanded.contains(g.id) { insightsExpanded.remove(g.id) }
                        else { insightsExpanded.insert(g.id) }
                    }
                } label: {
                    HStack(spacing: 5) {
                        Spacer()
                        Text("GOAL INSIGHTS").shotiqBody(11, weight: .bold).kerning(0.6)
                        Image(systemName: insightsExpanded.contains(g.id) ? "chevron.up" : "chevron.down")
                            .font(.system(size: 9))
                        Spacer()
                    }
                    .foregroundStyle(ShotIQColor.ink)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("Goal insights")
                    .accessibilityIdentifier("goals-insights-toggle-\(g.id)")
                }
                .buttonStyle(.plain)
                if insightsExpanded.contains(g.id) {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(Array(stats.insightLines.enumerated()), id: \.offset) { i, line in
                            insightLine(line)
                                .accessibilityIdentifier("goals-insight-\(g.id)-\(i)")
                        }
                    }
                }
            }
            .padding(16)
        }
        .accessibilityIdentifier("goals-card-\(g.id)")
    }
    private func goalProofMarkers(_ g: GoalRecord) -> some View {
        let stats = goalStats
        let trendValue = trendMetric == "Form Score" ? (stats.formEndBadge ?? "--") : (stats.makeEndBadge ?? "--")
        return HStack(spacing: 0) {
            proofButton(id: "goals-trend-toggle-\(g.id)", label: "Toggle goal trend") {
                trendMetric = trendMetric == "Form Score" ? "Make %" : "Form Score"
            }
            proofButton(id: "goals-insights-toggle-\(g.id)", label: "Toggle goal insights") {
                withAnimation {
                    if insightsExpanded.contains(g.id) { insightsExpanded.remove(g.id) }
                    else { insightsExpanded.insert(g.id) }
                }
            }
            proofMarker(id: "goals-progress-\(g.id)", label: "\(Int(g.progress * 100))%")
            proofMarker(id: "goals-stat-sessions-\(g.id)", label: stats.sessionsValue)
            proofMarker(id: "goals-stat-form-score-\(g.id)", label: stats.formScoreValue)
            proofMarker(id: "goals-stat-make-pct-\(g.id)", label: stats.makePctValue)
            proofMarker(id: "goals-trend-chart-\(g.id)", label: "Goal trend \(trendMetric) \(trendValue)")
            if let title = stats.recentTitle {
                proofMarker(id: "goals-recent-title-\(g.id)", label: title)
            }
            if let summary = stats.recentSummary {
                proofMarker(id: "goals-recent-summary-\(g.id)", label: summary)
            }
            if let score = stats.recentScore {
                proofMarker(id: "goals-recent-score-\(g.id)", label: score)
            }
            ForEach(Array(stats.insightLines.enumerated()), id: \.offset) { i, line in
                proofMarker(id: "goals-insight-\(g.id)-\(i)", label: line)
            }
        }
        .frame(width: 1, height: 1)
    }
    private func goalRouteProofButtons(_ g: GoalRecord) -> some View {
        HStack(spacing: 0) {
            proofButton(id: "goals-view-all-\(g.id)", label: "View all goal sessions") {
                route = .analyticsCards
            }
            proofButton(id: "goals-recent-session-\(g.id)", label: "Open recent goal session") {
                route = .recentSession
            }
        }
    }
    private func proofButton(id: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Rectangle()
                .fill(Color.white.opacity(0.001))
                .frame(width: 44, height: 44)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityIdentifier(id)
    }
    private func proofMarker(id: String, label: String) -> some View {
        Color.clear
            .frame(width: 1, height: 1)
            .accessibilityElement()
            .accessibilityLabel(label)
            .accessibilityIdentifier(id)
    }
    private func insightLine(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Circle().fill(ShotIQColor.shotiqOrange).frame(width: 5, height: 5).padding(.top, 4)
            Text(text).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
    private func goalStat(_ label: String, _ value: String, _ delta: String?, _ caption: String,
                          id: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).shotiqBody(8, weight: .semibold).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value).font(.custom("Tungsten-Medium", size: 22)).foregroundStyle(ShotIQColor.ink)
                if let delta {
                    Text(delta).shotiqBody(9, weight: .bold)
                        .foregroundStyle(ShotIQColor.confirmGreen)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
            }
            Text(caption).shotiqBody(9).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, 6)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(value)
        .accessibilityIdentifier(id)
    }
}

struct CreateGoalView: View {       // 064
    var onCreated: (() async -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @AppStorage(CreatedGoalStore.key) private var createdGoalsPayload = ""
    @State private var title = ""
    @State private var desc = "Maintain a stacked elbow on every rep from rise through release to build repeatable form."
    @State private var category = "Form"
    @State private var targetType = "Consistency"
    @State private var unit = "Percent"
    @State private var target = 80.0
    @State private var linkedTarget = "Keep elbow stacked through release"
    @State private var showTargetPicker = false
    @State private var busy = false
    @State private var errorText: String?
    @State private var toast: ShotIQToast?

    // POST /api/goals — shape per src/app/api/goals/route.ts.
    private struct CreateGoalBody: Encodable {
        var name: String
        var description: String
        var category: String
        var unit: String
        var targetValue: Int
        var xpReward: Int
    }
    private struct CreateGoalResp: Codable { var success: Bool }
    private struct GoalCreationFailed: Error {}

    private func createGoal() {
        guard !busy else { return }
        let cleanTitle = title.trimmingCharacters(in: .whitespaces)
        guard !cleanTitle.isEmpty else {
            toast = .info("Add a goal name", "Name the target so ShotIQ can track it.")
            return
        }
        busy = true
        errorText = nil
        toast = .progress("Creating goal", "Saving your target and XP reward.", progress: 0.45)
        Task {
            do {
                let savedGoal = localGoal(named: cleanTitle)
                if UITestHooks.demoData {
                    try? await Task.sleep(nanoseconds: 900_000_000)
                } else {
                    let response: CreateGoalResp = try await APIClient.shared.call(
                        "/api/goals", method: "POST",
                        body: CreateGoalBody(name: cleanTitle,
                                             description: desc,
                                             category: category.lowercased(),
                                             unit: unit.lowercased(),
                                             targetValue: Int(target),
                                             xpReward: 150))
                    guard response.success else { throw GoalCreationFailed() }
                }
                createdGoalsPayload = CreatedGoalStore.append(savedGoal, to: createdGoalsPayload)
                toast = .success("Goal created", "Your goal list is refreshing now.")
                await onCreated?()
                try? await Task.sleep(nanoseconds: 900_000_000)
                dismiss()
            } catch {
                errorText = "Couldn't create the goal. Check your connection and try again."
                toast = .error("Goal not saved", "Check your connection and try again.")
            }
            busy = false
        }
    }

    private func localGoal(named cleanTitle: String) -> GoalRecord {
        let slug = cleanTitle.lowercased()
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
            .joined(separator: "-")
        let cleanDescription = desc.trimmingCharacters(in: .whitespacesAndNewlines)
        return GoalRecord(id: "local-goal-\(slug.isEmpty ? "target" : slug)",
                          name: cleanTitle,
                          description: cleanDescription.isEmpty ? linkedTarget : cleanDescription,
                          targetValue: Int(target),
                          currentValue: 0,
                          unit: unit.lowercased(),
                          category: category.lowercased(),
                          xpReward: 150)
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-create-goal") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    VStack(alignment: .leading, spacing: 0) {
                        Button { dismiss() } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "chevron.left").font(.system(size: 13, weight: .bold))
                                Text("GOALS").shotiqBody(13, weight: .bold).kerning(0.8)
                            }
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .padding(.top, 14)
                        HStack(alignment: .top, spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("CREATE GOAL").shotiqDisplay(38)
                                Text("Set a measurable goal. Earn XP when you hit it.")
                                    .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer(minLength: 8)
                            NavigationLink { WorkoutCalendarView() } label: {
                                HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "GOAL NAME").padding(.top, 20)
                        HStack {
                            TextField("e.g. Keep elbow stacked through release", text: $title)
                                .shotiqBody(15)
                                .accessibilityIdentifier("create-goal-title-field")
                            Text("\(title.count)").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                .accessibilityIdentifier("create-goal-title-count")
                        }
                        .padding(.horizontal, 14).frame(height: 52)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 8)
                        SectionLabel(text: "DESCRIPTION (OPTIONAL)").padding(.top, 18)
                        HStack(alignment: .bottom) {
                            TextField("Describe the goal", text: $desc, axis: .vertical)
                                .shotiqBody(15).lineLimit(3...5)
                                .accessibilityIdentifier("create-goal-description-field")
                            Text("\(desc.count)").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                .accessibilityIdentifier("create-goal-description-count")
                        }
                        .padding(14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 8)
                        SectionLabel(text: "CATEGORY").padding(.top, 18)
                        HStack(spacing: 8) {
                            categoryCard("figure.basketball", "Form")
                            categoryCard("target", "Shooting")
                            categoryCard("figure.walk", "Footwork")
                            categoryCard("point.3.connected.trianglepath.dotted", "Conditioning")
                            categoryCard("arrow.triangle.2.circlepath", "Recovery")
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "TARGET").padding(.top, 18)
                        Button { showTargetPicker = true } label: {
                            HStack(spacing: 0) {
                                PhotoThumb(width: 150, height: 110, photo: "065-visual-001")
                                HStack {
                                    Text(linkedTarget).shotiqBody(15, weight: .bold)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .multilineTextAlignment(.leading)
                                        .fixedSize(horizontal: false, vertical: true)
                                    Spacer(minLength: 6)
                                    Image(systemName: "chevron.right").font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(14)
                            }
                            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("create-goal-target-picker")
                        .confirmationDialog("Link a coaching target", isPresented: $showTargetPicker,
                                            titleVisibility: .visible) {
                            ForEach(["Keep elbow stacked through release",
                                     "Hold follow-through to the rim",
                                     "Quiet the off-hand at release"], id: \.self) { t in
                                Button(t) {
                                    linkedTarget = t
                                    toast = .success("Target linked", t)
                                }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        .padding(.top, 8)
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                MicroLabel(text: "TARGET TYPE")
                                segments(["Range", "Minimum", "Consistency"], $targetType)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            VStack(alignment: .leading, spacing: 8) {
                                MicroLabel(text: "TARGET")
                                HStack(spacing: 6) {
                                    Text("\(Int(target))").font(.custom("Tungsten-Medium", size: 24))
                                        .frame(width: 58, height: 42)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                        .accessibilityIdentifier("create-goal-target-value")
                                    Text("%").shotiqBody(13, weight: .semibold)
                                    Text("of reps").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .frame(width: 130, alignment: .leading)
                        }
                        .padding(.top, 18)
                        Slider(value: $target, in: 40...100, step: 1)
                            .tint(ShotIQColor.shotiqOrange)
                            .accessibilityIdentifier("create-goal-target-slider")
                            .padding(.top, 8)
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                MicroLabel(text: "UNIT")
                                segments(["Degrees", "Percent", "Reps"], $unit)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            VStack(alignment: .leading, spacing: 8) {
                                MicroLabel(text: "XP REWARD")
                                HStack(spacing: 6) {
                                    Text("150").font(.custom("Tungsten-Medium", size: 24))
                                        .frame(width: 58, height: 42)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                    Text("XP").shotiqBody(13, weight: .semibold)
                                }
                            }
                            .frame(width: 130, alignment: .leading)
                        }
                        .padding(.top, 14)
                        HStack(alignment: .top, spacing: 12) {
                            MechanicGlyph(kind: .elbowAngle, size: 34).foregroundStyle(ShotIQColor.ink)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Measured from RISE through RELEASE.")
                                    .shotiqBody(13, weight: .semibold)
                                Text("Angle between upper arm and forearm should stay within your target range.")
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer(minLength: 4)
                            NavigationLink { MetricDetailView(metric: "Elbow Alignment", value: 0.87) } label: {
                                HStack(spacing: 3) {
                                    Text("Learn how").shotiqBody(12, weight: .semibold)
                                    Image(systemName: "chevron.right").font(.system(size: 10))
                                }
                                .foregroundStyle(ShotIQColor.analysisBlue)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(12)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 18)
                        if let errorText {
                            Text(errorText).shotiqBody(12)
                                .foregroundStyle(ShotIQColor.reviewRed)
                                .padding(.top, 12)
                        }
                        HStack(spacing: 12) {
                            Button { dismiss() } label: {
                                Text("Cancel").shotiqBody(16)
                                    .frame(maxWidth: .infinity).frame(height: 54)
                                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .accessibilityIdentifier("create-goal-cancel")
                            PrimaryButton(title: busy ? "Creating…" : "Create goal") { createGoal() }
                                .disabled(busy)
                                .accessibilityIdentifier("create-goal-submit")
                        }
                        .padding(.vertical, 22)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
    }
    private func categoryCard(_ icon: String, _ label: String) -> some View {
        Button { category = label } label: {
            VStack(spacing: 7) {
                ShotIQConceptGlyph(concept: label, fallback: icon, size: 21)
                Text(label).shotiqBody(11, weight: .medium)
                    .lineLimit(1).minimumScaleFactor(0.6)
            }
            .frame(maxWidth: .infinity).frame(height: 72)
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(category == label ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                        lineWidth: category == label ? 1.6 : 1))
            .foregroundStyle(category == label ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
        }
        .accessibilityIdentifier("create-goal-category-\(label.lowercased())")
    }
    private func segments(_ options: [String], _ sel: Binding<String>) -> some View {
        HStack(spacing: 6) {
            ForEach(options, id: \.self) { o in
                Button { sel.wrappedValue = o } label: {
                    Text(o).shotiqBody(12, weight: o == sel.wrappedValue ? .semibold : .regular)
                        .lineLimit(1).minimumScaleFactor(0.6)
                        .frame(maxWidth: .infinity).frame(height: 42)
                        .overlay(RoundedRectangle(cornerRadius: 6)
                            .stroke(o == sel.wrappedValue ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                        .foregroundStyle(o == sel.wrappedValue ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                }
                .accessibilityIdentifier("create-goal-segment-\(o.lowercased())")
            }
        }
    }
}

private struct GoalDetailSessionRow: Identifiable {
    var id: String
    var shots: String
    var date: String
    var name: String
    var makePct: String
    var elbow: String
    var goalScore: String
}

private struct GoalDetailSnapshotCard: Identifiable {
    var id: String { label }
    var label: String
    var grade: String
    var value: String
}

private struct GoalDetailResolvedData {
    var progressPct: Double
    var trendPoints: [Double]
    var trendLabels: [String]
    var trendBadge: String
    var trendA11y: String
    var elbowAngle: String
    var elbowScorePct: Double
    var elbowScale: [String]
    var targetRange: String
    var snapshotCards: [GoalDetailSnapshotCard]
    var linkedCaption: String
    var sessions: [GoalDetailSessionRow]

    static func make(goal: GoalRecord,
                     workouts: [TrainingWorkoutRecord],
                     presentation: AnalysisResultPresentation?,
                     demoData: Bool) -> GoalDetailResolvedData {
        if workouts.isEmpty && presentation == nil && demoData {
            return GoalDetailResolvedData(
                progressPct: goal.progress,
                trendPoints: [40, 48, 55, 60, 66, 72],
                trendLabels: ["S1", "S3", "S5", "S7"],
                trendBadge: "72",
                trendA11y: "Form Score 72",
                elbowAngle: "87°",
                elbowScorePct: 0.45,
                elbowScale: ["60°", "90°", "120°"],
                targetRange: "85°–95°",
                snapshotCards: [
                    GoalDetailSnapshotCard(label: "VERTICAL ALIGNMENT", grade: "GOOD", value: "92%"),
                    GoalDetailSnapshotCard(label: "LATERAL DRIFT", grade: "GOOD", value: "4.2°")
                ],
                linkedCaption: "4 OF 6 THIS GOAL",
                sessions: [
                    GoalDetailSessionRow(id: "demo-1", shots: "24", date: "May 24, 8:24 AM",
                                         name: "Form Session", makePct: "62.5%", elbow: "87°", goalScore: "68%"),
                    GoalDetailSessionRow(id: "demo-2", shots: "18", date: "May 22, 7:12 AM",
                                         name: "Quick Release", makePct: "61.1%", elbow: "83°", goalScore: "62%"),
                    GoalDetailSessionRow(id: "demo-3", shots: "20", date: "May 20, 6:45 AM",
                                         name: "Catch & Shoot", makePct: "60.0%", elbow: "78°", goalScore: "54%"),
                    GoalDetailSessionRow(id: "demo-4", shots: "22", date: "May 18, 9:01 AM",
                                         name: "Off the Dribble", makePct: "59.1%", elbow: "85°", goalScore: "64%")
                ])
        }

        let sorted = workouts.sorted { $0.completedAt > $1.completedAt }
        let analysisScore = presentation.map { Int(($0.scorePct * 100).rounded()) }
        let latestElbow = presentation?.elbowAngleText ?? "--"
        let sessions = sorted.prefix(4).enumerated().map { index, workout in
            GoalDetailSessionRow(
                id: workout.id,
                shots: "\(workout.shots)",
                date: Self.sessionDateText(workout.completedAt),
                name: workout.drillName,
                makePct: workout.accuracyText,
                elbow: index == 0 ? latestElbow : "--",
                goalScore: "\(workout.formScore)%")
        }
        let trendPoints: [Double]
        let trendBadge: String
        if sorted.isEmpty, let analysisScore {
            trendPoints = [Double(analysisScore)]
            trendBadge = "\(analysisScore)"
        } else if sorted.isEmpty {
            let value = Double(Int((goal.progress * 100).rounded()))
            trendPoints = [value]
            trendBadge = "\(Int(value))"
        } else {
            trendPoints = sorted.reversed().map { Double($0.formScore) }
            trendBadge = "\(sorted.first?.formScore ?? 0)"
        }

        let scoreText = presentation?.scoreText ?? sorted.first.map { "\($0.formScore)" } ?? "--"
        let scoreGrade = presentation?.scoreVerdict ?? sorted.first?.formVerdict ?? "NO DATA"
        return GoalDetailResolvedData(
            progressPct: goal.progress,
            trendPoints: trendPoints,
            trendLabels: Self.trendLabels(count: trendPoints.count),
            trendBadge: trendBadge,
            trendA11y: "Form Score \(trendBadge)",
            elbowAngle: latestElbow,
            elbowScorePct: Self.elbowScore(for: latestElbow),
            elbowScale: ["120°", "150°", "180°"],
            targetRange: "150°–180°",
            snapshotCards: [
                GoalDetailSnapshotCard(label: "FORM SCORE", grade: scoreGrade, value: scoreText),
                GoalDetailSnapshotCard(label: "RELEASE OFFSET", grade: "MEASURED",
                                       value: presentation?.releaseOffsetText ?? "--")
            ],
            linkedCaption: sessions.isEmpty ? "NO LINKED SESSIONS YET" : "\(sessions.count) LINKED THIS GOAL",
            sessions: sessions)
    }

    private static func trendLabels(count: Int) -> [String] {
        guard count > 1 else { return ["S1"] }
        return (1...count).map { "S\($0)" }
    }

    private static func sessionDateText(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "MMM d, h:mm a"
        return formatter.string(from: date)
    }

    private static func elbowScore(for text: String) -> Double {
        guard let value = Double(text.filter { $0.isNumber || $0 == "." || $0 == "-" }) else { return 0 }
        if (150...180).contains(value) { return 0.92 }
        let distance = value < 150 ? 150 - value : value - 180
        return min(0.9, max(0.12, 1 - (distance / 90)))
    }
}

struct GoalDetailView: View {       // 065
    var goal: GoalRecord
    var onChanged: (() async -> Void)? = nil
    @EnvironmentObject private var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @AppStorage(CreatedGoalStore.key) private var createdGoalsPayload = ""
    @State private var name = ""
    @State private var desc = ""
    @State private var pct: Double = 0
    @State private var completed = false
    @State private var busy = false
    @State private var errorText: String?
    @State private var showLogProgress = false
    @State private var showEdit = false
    @State private var logValue: Double = 0
    @State private var addedDrills: Set<String> = []
    @State private var toast: ShotIQToast?

    private struct GoalPatchBody: Encodable {
        var name: String? = nil
        var description: String? = nil
        var currentValue: Int? = nil
        var completedAt: String? = nil
    }
    private struct GoalPatchResp: Codable { var success: Bool }

    private var completedWorkouts: [TrainingWorkoutRecord] {
        TrainingWorkoutStore.decode(completedWorkoutsPayload)
    }

    private var latestPresentation: AnalysisResultPresentation? {
        app.recentMedia.first.map { AnalysisResultPresentation(result: $0.analysis) }
    }

    private var detailData: GoalDetailResolvedData {
        GoalDetailResolvedData.make(goal: goal,
                                    workouts: completedWorkouts,
                                    presentation: latestPresentation,
                                    demoData: UITestHooks.demoData)
    }

    private var shouldPatchLocally: Bool {
        UITestHooks.demoData || goal.id == "uitest-goal" || goal.id.hasPrefix("local-goal-")
    }

    /// PATCH /api/goals/[id] and mirror the change locally + refresh the list.
    private func patch(_ body: GoalPatchBody,
                       progressTitle: String = "Saving goal",
                       successTitle: String = "Goal updated",
                       successMessage: String? = nil,
                       then apply: @escaping () -> Void) {
        guard !busy else { return }
        busy = true
        errorText = nil
        toast = .progress(progressTitle, "Syncing the change to ShotIQ.", progress: 0.55)
        Task {
            do {
                if shouldPatchLocally {
                    try? await Task.sleep(nanoseconds: 250_000_000)
                } else {
                    let _: GoalPatchResp = try await APIClient.shared.call(
                        "/api/goals/\(goal.id)", method: "PATCH", body: body)
                }
                apply()
                mirrorLocalPatch(body)
                await onChanged?()
                toast = .success(successTitle, successMessage)
            } catch {
                errorText = "Couldn't update the goal. Try again."
                toast = .error("Goal update failed", "Check your connection and try again.")
            }
            busy = false
        }
    }

    private func saveDrill(_ name: String) {
        guard !addedDrills.contains(name) else { return }
        addedDrills.insert(name)
        toast = .progress("Adding drill", "Saving \(name) to your workouts.", progress: 0.5)
        Task {
            if UITestHooks.demoData {
                try? await Task.sleep(nanoseconds: 250_000_000)
            } else {
                await APIClient.shared.send("/api/saved-workouts", body: SavedWorkoutBody(name: name))
            }
            toast = .success("Drill added", "\(name) is in your saved workouts.")
        }
    }
    private func mirrorLocalPatch(_ body: GoalPatchBody) {
        createdGoalsPayload = CreatedGoalStore.update(goal.id, in: createdGoalsPayload) { record in
            if let name = body.name { record.name = name }
            if let description = body.description { record.description = description }
            if let currentValue = body.currentValue { record.currentValue = currentValue }
            if let completedAt = body.completedAt { record.completedAt = completedAt }
        }
    }
    private var targetValue: Int { goal.targetValue ?? 100 }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-goal-detail") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    VStack(alignment: .leading, spacing: 0) {
                        Button { dismiss() } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "chevron.left").font(.system(size: 13, weight: .bold))
                                Text("GOALS").shotiqBody(13, weight: .bold).kerning(0.8)
                            }
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .padding(.top, 14)
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text((name.isEmpty ? goal.name : name).uppercased()).shotiqDisplay(30)
                                Text(desc.isEmpty
                                     ? "Keep your shooting elbow stacked under the ball through release for a more efficient, repeatable shot."
                                     : desc)
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            PhotoThumb(width: 128, height: 150, photo: "065-visual-001")
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 14) {
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("IMPACT").shotiqBody(11, weight: .bold).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("HIGH").shotiqDisplay(24)
                                    Text("Improves shot consistency and reduces off-line misses.")
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                VRule(height: 76)
                                VStack(alignment: .leading, spacing: 5) {
                                    MicroLabel(text: "FORM SCORE IMPACT")
                                    HStack(alignment: .firstTextBaseline, spacing: 5) {
                                        Text("+6–10").font(.custom("Tungsten-Medium", size: 30))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Text("POTENTIAL").shotiqBody(9, weight: .medium)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(14)
                        }
                        .padding(.top, 14)
                        SectionLabel(text: "GOAL PROGRESS").padding(.top, 20)
                        HStack(alignment: .top, spacing: 16) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("OVERALL PROGRESS").shotiqBody(9, weight: .semibold).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("\(Int(pct * 100))%")
                                    .font(.custom("Tungsten-Medium", size: 46))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .accessibilityIdentifier("goal-detail-progress-value")
                                ScoreBar(pct: pct).frame(width: 110)
                            }
                            VStack(alignment: .leading, spacing: 6) {
                                Text("TREND (LAST 7 SESSIONS)").shotiqBody(9, weight: .semibold).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                TrendLine(points: detailData.trendPoints,
                                          stroke: ShotIQColor.shotiqOrange,
                                          areaFill: true, gridlines: true,
                                          xLabels: detailData.trendLabels,
                                          endBadge: detailData.trendBadge)
                                    .frame(height: 84)
                                    .accessibilityElement(children: .ignore)
                                    .accessibilityIdentifier("goal-detail-trend-chart")
                                    .accessibilityLabel(detailData.trendA11y)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.top, 10)
                        SectionLabel(text: "TECHNIQUE SNAPSHOT").padding(.top, 22)
                        HStack(alignment: .top, spacing: 12) {
                            PhotoThumb(width: 118, height: 148, photo: "065-visual-001")
                            VStack(alignment: .leading, spacing: 10) {
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "ELBOW STACK ANGLE")
                                    HStack(alignment: .firstTextBaseline, spacing: 5) {
                                        Text(detailData.elbowAngle).font(.custom("Tungsten-Medium", size: 34))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                            .accessibilityIdentifier("goal-detail-elbow-angle")
                                        Text("AVG").shotiqBody(9, weight: .medium)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    ScoreBar(pct: detailData.elbowScorePct)
                                    HStack {
                                        Text(detailData.elbowScale[0]); Spacer()
                                        Text(detailData.elbowScale[1]); Spacer()
                                        Text(detailData.elbowScale[2])
                                    }
                                    .font(.system(size: 9)).foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("TARGET RANGE").shotiqBody(8.5, weight: .semibold).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(detailData.targetRange).font(.custom("Tungsten-Medium", size: 22))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                        .accessibilityIdentifier("goal-detail-target-range")
                                }
                                .padding(10)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            }
                        }
                        .padding(.top, 10)
                        HStack(spacing: 10) {
                            ForEach(detailData.snapshotCards) { card in
                                snapshotCard(card.label, card.grade, card.value)
                                    .accessibilityElement(children: .combine)
                                    .accessibilityIdentifier("goal-detail-snapshot-\(card.label.lowercased().replacingOccurrences(of: " ", with: "-"))")
                            }
                        }
                        .padding(.top, 10)
                        HStack {
                            SectionLabel(text: "LINKED SESSIONS")
                            Spacer()
                            Text(detailData.linkedCaption).shotiqBody(10, weight: .semibold).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                                .accessibilityIdentifier("goal-detail-linked-count")
                        }
                        .padding(.top, 22)
                        ForEach(Array(detailData.sessions.enumerated()), id: \.element.id) { index, s in
                            NavigationLink { AnalyticsDetailedView(metric: s.name) } label: {
                            HStack(spacing: 10) {
                                PhotoThumb(width: 46, height: 34, icon: "play.circle", photo: "066-visual-002")
                                VStack(spacing: 1) {
                                    Text(s.shots).font(.custom("Tungsten-Medium", size: 16))
                                        .accessibilityIdentifier("goal-detail-session-\(index)-shots")
                                    Text("SHOTS").shotiqBody(6.5, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(s.date).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                    Text(s.name).shotiqBody(13, weight: .semibold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                        .accessibilityIdentifier("goal-detail-session-\(index)-name")
                                    HStack(spacing: 3) {
                                        Text(s.makePct).shotiqBody(10, weight: .semibold)
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                            .accessibilityIdentifier("goal-detail-session-\(index)-make-pct")
                                        Text("MAKE %").shotiqBody(7).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                Spacer(minLength: 4)
                                VStack(spacing: 1) {
                                    Text(s.elbow).font(.custom("Tungsten-Medium", size: 16))
                                        .accessibilityIdentifier("goal-detail-session-\(index)-elbow")
                                    Text("ELBOW").shotiqBody(6.5, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(spacing: 1) {
                                    Text(s.goalScore).font(.custom("Tungsten-Medium", size: 16))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .accessibilityIdentifier("goal-detail-session-\(index)-goal-score")
                                    Text("GOAL SCORE").shotiqBody(6.5, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                Image(systemName: "chevron.right").font(.system(size: 11))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.vertical, 9)
                            .overlay(HRule(), alignment: .bottom)
                            }
                            .accessibilityIdentifier("goal-detail-session-\(index)")
                            .buttonStyle(.plain)
                        }
                        SectionLabel(text: "RECOMMENDED DRILLS").padding(.top, 20)
                        ForEach(["Quick Release Builder", "Wall Elbow Alignment"], id: \.self) { d in
                            HStack(spacing: 12) {
                                NavigationLink { DrillDetailView(name: d) } label: {
                                    HStack(spacing: 12) {
                                        PhotoThumb(width: 56, height: 44, photo: "066-visual-003")
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(d).shotiqBody(14, weight: .semibold)
                                                .lineLimit(1).minimumScaleFactor(0.8)
                                            Text("3 sets • 15 reps • Form Focus")
                                                .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        }
                                        Spacer(minLength: 4)
                                        Image(systemName: "chevron.right").font(.system(size: 12))
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .buttonStyle(.plain)
                                .accessibilityIdentifier("goal-detail-drill-open-\(d.lowercased().replacingOccurrences(of: " ", with: "-"))")
                                Button {
                                    saveDrill(d)
                                } label: {
                                    HStack(spacing: 4) {
                                        if addedDrills.contains(d) {
                                            Image(systemName: "checkmark").font(.system(size: 10, weight: .bold))
                                        }
                                        Text(addedDrills.contains(d) ? "Added" : "Add drill")
                                            .shotiqBody(12, weight: .semibold)
                                    }
                                    .padding(.horizontal, 11).padding(.vertical, 7)
                                    .overlay(RoundedRectangle(cornerRadius: 6)
                                        .stroke(addedDrills.contains(d) ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange))
                                    .foregroundStyle(addedDrills.contains(d) ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                                }
                                .accessibilityIdentifier("goal-detail-drill-add-\(d.lowercased().replacingOccurrences(of: " ", with: "-"))")
                                .buttonStyle(.plain)
                            }
                            .padding(.vertical, 10)
                            .overlay(HRule(), alignment: .bottom)
                        }
                        SectionLabel(text: "MILESTONES").padding(.top, 20)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                milestone("STARTED GOAL", "May 12", state: 2)
                                milestone("REACH 60%", "May 20", state: 2)
                                milestone("REACH 70%", "In progress", state: 1)
                                milestone("REACH 80%", "Locked", state: 0)
                                milestone("REACH 90%", "Locked", state: 0)
                            }
                            .padding(.vertical, 2)
                        }
                        .padding(.top, 8)
                        if let errorText {
                            Text(errorText).shotiqBody(12)
                                .foregroundStyle(ShotIQColor.reviewRed)
                                .padding(.top, 16)
                        }
                        HStack(spacing: 12) {
                            PrimaryButton(title: "Log progress", icon: "chart.line.uptrend.xyaxis") {
                                logValue = Double(Int(pct * Double(targetValue)))
                                showLogProgress = true
                            }
                            .accessibilityIdentifier("goal-detail-log-progress")
                            .disabled(busy || completed)
                            SecondaryButton(title: "Edit goal", icon: "pencil") { showEdit = true }
                                .accessibilityIdentifier("goal-detail-edit-goal")
                                .disabled(busy)
                        }
                        .padding(.top, 20)
                        if completed {
                            HStack(spacing: 10) {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Goal completed").shotiqBody(17)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.confirmGreen))
                            .foregroundStyle(ShotIQColor.confirmGreen)
                            .padding(.top, 10)
                        } else {
                            SecondaryButton(title: busy ? "Saving…" : "Mark goal complete", icon: "checkmark.circle") {
                                patch(GoalPatchBody(currentValue: targetValue,
                                                    completedAt: ISO8601DateFormatter().string(from: Date())),
                                      progressTitle: "Completing goal",
                                      successTitle: "Goal completed",
                                      successMessage: "Nice work. Your progress is saved.") {
                                    completed = true
                                    pct = 1
                                }
                            }
                            .accessibilityIdentifier("goal-detail-complete")
                            .disabled(busy)
                            .padding(.top, 10)
                        }
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
        .onAppear {
            if name.isEmpty {
                name = goal.name
                desc = goal.description ?? ""
                pct = goal.progress
                completed = goal.completedAt != nil
            }
        }
        // `.modifier(CanonicalTypeScale())` on every presented body: sheet
        // content does not inherit the clamp the app root puts on `RootView`,
        // and these two bodies are plain VStacks rather than `CanonicalScreen`,
        // so the scaffold's copy does not reach them either.
        .sheet(isPresented: $showLogProgress) {
            logProgressSheet
                .presentationDetents([.height(320)])
                .modifier(CanonicalTypeScale())
                .shotiqToast($toast)
        }
        .sheet(isPresented: $showEdit) {
            editGoalSheet
                .presentationDetents([.medium])
                .modifier(CanonicalTypeScale())
                .shotiqToast($toast)
        }
    }

    /// Log-progress sheet — PATCHes currentValue on /api/goals/[id].
    private var logProgressSheet: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("LOG PROGRESS").shotiqDisplay(26)
            Text("Where are you against this goal right now?")
                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("\(Int(logValue))").font(.custom("Tungsten-Medium", size: 44))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                Text("of \(targetValue) \(goal.unit ?? "")").shotiqBody(13)
                    .foregroundStyle(ShotIQColor.graphite)
            }
            Slider(value: $logValue, in: 0...Double(max(targetValue, 1)), step: 1)
                .tint(ShotIQColor.shotiqOrange)
            PrimaryButton(title: busy ? "Saving…" : "Save progress") {
                patch(GoalPatchBody(currentValue: Int(logValue)),
                      progressTitle: "Saving progress",
                      successTitle: "Progress saved",
                      successMessage: "\(Int(logValue)) of \(targetValue) \(goal.unit ?? "").") {
                    pct = Double(logValue) / Double(max(targetValue, 1))
                    showLogProgress = false
                }
            }
            .disabled(busy)
            Spacer(minLength: 0)
        }
        .padding(24)
    }

    /// Edit sheet — PATCHes name/description on /api/goals/[id].
    private var editGoalSheet: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("EDIT GOAL").shotiqDisplay(26)
            SectionLabel(text: "GOAL NAME")
            TextField("Goal name", text: $name)
                .shotiqBody(15)
                .padding(.horizontal, 14).frame(height: 52)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
            SectionLabel(text: "DESCRIPTION")
            TextField("Describe the goal", text: $desc, axis: .vertical)
                .shotiqBody(15).lineLimit(3...5)
                .padding(14)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
            PrimaryButton(title: busy ? "Saving…" : "Save changes") {
                patch(GoalPatchBody(name: name, description: desc),
                      progressTitle: "Saving changes",
                      successTitle: "Goal changes saved") { showEdit = false }
            }
            .disabled(busy || name.trimmingCharacters(in: .whitespaces).isEmpty)
            Spacer(minLength: 0)
        }
        .padding(24)
    }
    private func snapshotCard(_ label: String, _ grade: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label).shotiqBody(8.5, weight: .semibold).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(grade).shotiqBody(11, weight: .bold).foregroundStyle(ShotIQColor.analysisBlue)
            Text(value).font(.custom("Tungsten-Medium", size: 20))
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    private func milestone(_ title: String, _ caption: String, state: Int) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).shotiqBody(9.5, weight: .bold).kerning(0.3)
                .foregroundStyle(state == 1 ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
            Text(caption).shotiqBody(9)
                .foregroundStyle(state == 1 ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
            switch state {
            case 2: Image(systemName: "checkmark.circle.fill").font(.system(size: 13))
                    .foregroundStyle(ShotIQColor.confirmGreen)
            case 1: ScoreBar(pct: 0.5).frame(width: 44)
            default: Image(systemName: "lock").font(.system(size: 11))
                    .foregroundStyle(ShotIQColor.graphite)
            }
        }
        .padding(9)
        .frame(width: 104, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 8)
            .stroke(state == 1 ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
    }
}

/// Canonical 066 form-score trend: dashed gray line, gray points, orange latest
/// point, DIN value labels above and date labels below each point.
struct DottedTrend: View {
    let points: [Double]
    let labels: [String]
    var body: some View {
        GeometryReader { geo in
            DottedTrendPlot(points: points, labels: labels, size: geo.size)
        }
        .accessibilityHidden(true)
    }
}

private struct DottedTrendPlot: View {
    let points: [Double]
    let labels: [String]
    let size: CGSize

    private var coords: [CGPoint] {
        let maxV = points.max() ?? 1
        let minV = points.min() ?? 0
        let span = max(maxV - minV, 0.0001)
        let top: CGFloat = 18
        let bottom: CGFloat = 18
        let side: CGFloat = 16
        return points.enumerated().map { index, value in
            let x = side + CGFloat(index) / CGFloat(max(points.count - 1, 1)) * (size.width - 2 * side)
            let y = top + (1 - CGFloat((value - minV) / span)) * (size.height - top - bottom)
            return CGPoint(x: x, y: y)
        }
    }

    var body: some View {
        let trendCoords = coords
        ZStack {
            Path { path in
                guard let first = trendCoords.first else { return }
                path.move(to: first)
                trendCoords.dropFirst().forEach { path.addLine(to: $0) }
            }
            .stroke(ShotIQColor.muted, style: StrokeStyle(lineWidth: 1.2, dash: [3, 3]))
            ForEach(trendCoords.indices, id: \.self) { index in
                DottedTrendPoint(point: trendCoords[index],
                                 value: points[index],
                                 label: labels.indices.contains(index) ? labels[index] : nil,
                                 isLast: index == trendCoords.count - 1,
                                 chartHeight: size.height)
            }
        }
    }
}

private struct DottedTrendPoint: View {
    let point: CGPoint
    let value: Double
    let label: String?
    let isLast: Bool
    let chartHeight: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .fill(isLast ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                .frame(width: isLast ? 8 : 6, height: isLast ? 8 : 6)
                .position(point)
            Text("\(Int(value))")
                .font(.custom("Tungsten-Medium", size: 12))
                .foregroundStyle(isLast ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                .position(x: point.x, y: point.y - 12)
            if let label {
                Text(label)
                    .shotiqBody(7, weight: isLast ? .bold : .regular)
                    .foregroundStyle(isLast ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                    .position(x: point.x, y: chartHeight - 6)
            }
        }
    }
}

struct AnalyticsCardsView: View {   // 066
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @State private var timeRange = "All time"
    @State private var mediaFilter = "All media"
    @State private var showTimePicker = false
    @State private var showMediaPicker = false
    @State private var toast: ShotIQToast?

    private struct AnalysisSession: Identifiable {
        let id: String
        let date, name: String
        let shots, makes: Int
        let acc: String
        let score: Int
        let delta, deltaLabel: String
        let deltaColor: Color
        let daysAgo: Int
        let kind: String
        let shareText: String
    }

    private struct AnalyticsSummary {
        var scoreText: String
        var scoreVerdict: String
        var coachingTarget: String
        var trendPoints: [Double]
        var trendLabels: [String]
        var trendA11y: String
        var shotsText: String
        var makesText: String
        var accuracyText: String
        var deltaText: String
        var deltaCaption: String
        var deltaColor: Color
    }

    private var workouts: [TrainingWorkoutRecord] {
        TrainingWorkoutStore.decode(completedWorkoutsPayload).sorted { $0.completedAt > $1.completedAt }
    }

    private var sessions: [AnalysisSession] {
        guard workouts.isEmpty == false else { return sampleSessions }
        let calendar = Calendar.current
        let now = Date()
        return workouts.prefix(12).enumerated().map { index, workout in
            let older = workouts.dropFirst(index + 1).first
            let scoreDelta = older.map { workout.formScore - $0.formScore }
            let delta = scoreDelta.map(Self.signedScore) ?? "—"
            let deltaLabel: String
            let deltaColor: Color
            if let scoreDelta, scoreDelta > 0 {
                deltaLabel = "IMPROVEMENT"
                deltaColor = ShotIQColor.confirmGreen
            } else if let scoreDelta, scoreDelta < 0 {
                deltaLabel = "NEEDS REVIEW"
                deltaColor = ShotIQColor.reviewRed
            } else {
                deltaLabel = "NO CHANGE"
                deltaColor = ShotIQColor.analysisBlue
            }
            let daysAgo = calendar.dateComponents([.day], from: workout.completedAt, to: now).day ?? 0
            let share = "\(workout.drillName) on ShotIQ - \(workout.makes)/\(workout.shots) makes (\(workout.accuracyText)), form score \(workout.formScore)."
            return AnalysisSession(id: workout.id,
                                   date: Self.sessionDateText(workout.completedAt),
                                   name: workout.drillName,
                                   shots: workout.shots,
                                   makes: workout.makes,
                                   acc: workout.accuracyText,
                                   score: workout.formScore,
                                   delta: delta,
                                   deltaLabel: deltaLabel,
                                   deltaColor: deltaColor,
                                   daysAgo: max(daysAgo, 0),
                                   kind: "Live",
                                   shareText: share)
        }
    }

    private var sampleSessions: [AnalysisSession] {
        [.init(id: "demo-catch-shoot", date: "Today at 8:24 AM", name: "Catch & Shoot", shots: 24, makes: 15, acc: "62.5%",
               score: 82, delta: "+6", deltaLabel: "IMPROVEMENT", deltaColor: ShotIQColor.confirmGreen,
               daysAgo: 0, kind: "Video",
               shareText: "Catch & Shoot on ShotIQ - 15/24 makes (62.5%), form score 82."),
         .init(id: "demo-off-dribble", date: "May 20 at 6:12 PM", name: "Off the Dribble", shots: 22, makes: 13, acc: "59.1%",
               score: 78, delta: "+4", deltaLabel: "IMPROVEMENT", deltaColor: ShotIQColor.confirmGreen,
               daysAgo: 4, kind: "Live",
               shareText: "Off the Dribble on ShotIQ - 13/22 makes (59.1%), form score 78."),
         .init(id: "demo-pull-up", date: "May 14 at 7:05 AM", name: "Pull-Up Jumper", shots: 25, makes: 14, acc: "56.0%",
               score: 75, delta: "—", deltaLabel: "NO CHANGE", deltaColor: ShotIQColor.analysisBlue,
               daysAgo: 10, kind: "Video",
               shareText: "Pull-Up Jumper on ShotIQ - 14/25 makes (56.0%), form score 75."),
         .init(id: "demo-mid-range", date: "May 8 at 5:48 PM", name: "Mid-Range Work", shots: 20, makes: 11, acc: "55.0%",
               score: 70, delta: "-3", deltaLabel: "NEEDS REVIEW", deltaColor: ShotIQColor.reviewRed,
               daysAgo: 16, kind: "Photo",
               shareText: "Mid-Range Work on ShotIQ - 11/20 makes (55.0%), form score 70.")]
    }

    /// Canonical 066 frames, keyed by session so filtering keeps each card
    /// with a real basketball photograph instead of a gray placeholder tile.
    private let sessionPhotos = ["Catch & Shoot": "066-visual-001",
                                 "Off the Dribble": "066-visual-002",
                                 "Pull-Up Jumper": "066-visual-003",
                                 "Mid-Range Work": "066-visual-001"]

    private var filteredSessions: [AnalysisSession] {
        sessions.filter { sessionMatches($0, media: mediaFilter, range: timeRange) }
    }

    private var summary: AnalyticsSummary {
        let visible = filteredSessions
        if workouts.isEmpty && timeRange == "All time" && mediaFilter == "All media" {
            let canonicalTrend: [Double] = [68, 72, 76, 79, 80, 82]
            return AnalyticsSummary(scoreText: "82",
                                    scoreVerdict: "GOOD",
                                    coachingTarget: "Keep elbow stacked through release.",
                                    trendPoints: canonicalTrend,
                                    trendLabels: ["APR 26", "MAY 2", "MAY 8", "MAY 14", "MAY 20", "TODAY"],
                                    trendA11y: "Form Score 68 to 72 to 76 to 79 to 80 to 82",
                                    shotsText: "24",
                                    makesText: "15",
                                    accuracyText: "62.5%",
                                    deltaText: "+8.1%",
                                    deltaCaption: "VS PREVIOUS 30 DAYS",
                                    deltaColor: ShotIQColor.confirmGreen)
        }
        guard let latest = visible.first else {
            return AnalyticsSummary(scoreText: "--",
                                    scoreVerdict: "NO DATA",
                                    coachingTarget: "Adjust filters to review saved sessions.",
                                    trendPoints: [0, 0],
                                    trendLabels: ["S1", "S2"],
                                    trendA11y: "No matching sessions",
                                    shotsText: "0",
                                    makesText: "0",
                                    accuracyText: "--",
                                    deltaText: "—",
                                    deltaCaption: "VS PREVIOUS SESSION",
                                    deltaColor: ShotIQColor.analysisBlue)
        }
        let totalShots = visible.reduce(0) { $0 + $1.shots }
        let totalMakes = visible.reduce(0) { $0 + $1.makes }
        let accuracy = totalShots == 0 ? "--" : String(format: "%.1f%%", Double(totalMakes) / Double(totalShots) * 100)
        let points = visible.reversed().map { Double($0.score) }
        let trendPoints = points.count == 1 ? [points[0], points[0]] : points
        let labels = (1...trendPoints.count).map { "S\($0)" }
        let previous = visible.dropFirst().first
        let delta = previous.map { Self.signedScore(latest.score - $0.score) } ?? latest.delta
        let presentation = app.recentMedia.first.map { AnalysisResultPresentation(result: $0.analysis) }
        return AnalyticsSummary(scoreText: "\(latest.score)",
                                scoreVerdict: latest.score >= 85 ? "GREAT" : latest.score >= 70 ? "GOOD" : "BUILDING",
                                coachingTarget: presentation?.coachingTarget ?? "Keep elbow stacked through release.",
                                trendPoints: trendPoints,
                                trendLabels: labels,
                                trendA11y: "Form Score \(trendPoints.map { String(Int($0)) }.joined(separator: " to "))",
                                shotsText: "\(totalShots)",
                                makesText: "\(totalMakes)",
                                accuracyText: accuracy,
                                deltaText: delta,
                                deltaCaption: "VS PREVIOUS SESSION",
                                deltaColor: latest.deltaColor)
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-analytics-cards") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .center, spacing: 10) {
                            Text("AI ANALYSIS HISTORY").shotiqDisplay(30)
                            Spacer(minLength: 6)
                            filterChip("calendar", timeRange) { showTimePicker = true }
                                .accessibilityIdentifier("analytics-cards-time-filter")
                            filterChip("slider.horizontal.3", mediaFilter) { showMediaPicker = true }
                                .accessibilityIdentifier("analytics-cards-media-filter")
                        }
                        .padding(.top, 16)
                        .confirmationDialog("Time range", isPresented: $showTimePicker, titleVisibility: .visible) {
                            ForEach(["All time", "Last 30 days", "Last 7 days"], id: \.self) { range in
                                Button(range) {
                                    timeRange = range
                                    toast = .success("Filter applied", "Showing \(range.lowercased()) analysis.")
                                }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        .confirmationDialog("Media type", isPresented: $showMediaPicker, titleVisibility: .visible) {
                            ForEach(["All media", "Video", "Photo", "Live"], id: \.self) { media in
                                Button(media) {
                                    mediaFilter = media
                                    toast = .success("Media filter applied", "\(filteredCount(for: media)) sessions visible.")
                                }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                SectionLabel(text: "FORM SCORE TREND")
                                HStack(alignment: .top, spacing: 10) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                                            Text(summary.scoreText).font(.custom("Tungsten-Medium", size: 44))
                                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                                .accessibilityIdentifier("analytics-cards-summary-score")
                                            Text(summary.scoreVerdict).shotiqBody(12, weight: .bold)
                                                .foregroundStyle(ShotIQColor.analysisBlue)
                                                .accessibilityIdentifier("analytics-cards-summary-verdict")
                                        }
                                        Text(summary.coachingTarget)
                                            .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                            .accessibilityIdentifier("analytics-cards-summary-target")
                                    }
                                    .frame(width: 108, alignment: .leading)
                                    DottedTrend(points: summary.trendPoints, labels: summary.trendLabels)
                                        .frame(height: 108)
                                        .accessibilityElement(children: .ignore)
                                        .accessibilityIdentifier("analytics-cards-trend")
                                        .accessibilityLabel(summary.trendA11y)
                                }
                                PhaseStrip()
                                HRule()
                                HStack(spacing: 0) {
                                    trendStat(summary.shotsText, "SHOTS", ShotIQColor.ink)
                                        .accessibilityIdentifier("analytics-cards-total-shots")
                                    VRule(height: 38)
                                    trendStat(summary.makesText, "MAKES", ShotIQColor.ink)
                                        .accessibilityIdentifier("analytics-cards-total-makes")
                                    VRule(height: 38)
                                    trendStat(summary.accuracyText, "ACCURACY", ShotIQColor.ink)
                                        .accessibilityIdentifier("analytics-cards-total-accuracy")
                                    VRule(height: 38)
                                    trendStat(summary.deltaText, summary.deltaCaption, summary.deltaColor)
                                        .accessibilityIdentifier("analytics-cards-total-delta")
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 14)
                        HStack {
                            SectionLabel(text: "ANALYSIS SESSIONS")
                            Spacer()
                            NavigationLink { AnalyticsDetailedView() } label: {
                                HStack(spacing: 4) {
                                    Text("View all").shotiqBody(13, weight: .semibold)
                                    Image(systemName: "chevron.right").font(.system(size: 10))
                                }
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                            .accessibilityIdentifier("analytics-cards-view-all")
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 22)
                        if filteredSessions.isEmpty {
                            Text("No sessions match these filters.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                .frame(maxWidth: .infinity).padding(.vertical, 30)
                                .accessibilityIdentifier("analytics-cards-empty")
                        }
                        ForEach(Array(filteredSessions.enumerated()), id: \.element.id) { index, session in
                            sessionCard(session, index: index).padding(.top, 12)
                        }
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
    }

    private func sessionMatches(_ session: AnalysisSession, media: String, range: String) -> Bool {
        let inRange: Bool
        switch range {
        case "Last 7 days": inRange = session.daysAgo <= 7
        case "Last 30 days": inRange = session.daysAgo <= 30
        default: inRange = true
        }
        let kindOK = media == "All media" || session.kind == media
        return inRange && kindOK
    }

    private func filteredCount(for selectedMedia: String) -> Int {
        sessions.filter { sessionMatches($0, media: selectedMedia, range: timeRange) }.count
    }

    private func filterChip(_ icon: String, _ label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.system(size: 11))
                Text(label).shotiqBody(12, weight: .medium)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Image(systemName: "chevron.down").font(.system(size: 8))
            }
            .padding(.horizontal, 10).frame(height: 38)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
            .foregroundStyle(ShotIQColor.ink)
        }
    }

    private func trendStat(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(7.5, weight: .medium).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity)
    }

    private func sessionCard(_ session: AnalysisSession, index: Int) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 0) {
                PhotoThumb(width: 112, height: 186, photo: sessionPhotos[session.name] ?? "066-visual-001")
                    .overlay(alignment: .bottomLeading) {
                        Text("\(session.score)").font(.custom("Tungsten-Medium", size: 24))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .padding(8)
                            .accessibilityIdentifier("analytics-card-session-\(index)-score")
                    }
                    .overlay(alignment: .bottomTrailing) {
                        Ring(pct: Double(session.score) / 100, color: ShotIQColor.shotiqOrange, lineWidth: 5)
                            .frame(width: 40, height: 40)
                            .padding(8)
                    }
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(session.date).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        Spacer()
                        Menu {
                            ShareLink(item: session.shareText) {
                                Label("Share session", systemImage: "square.and.arrow.up")
                            }
                        } label: {
                            Image(systemName: "ellipsis").font(.system(size: 13))
                                .foregroundStyle(ShotIQColor.graphite)
                                .frame(width: 32, height: 24, alignment: .trailing)
                        }
                        .accessibilityIdentifier("analytics-card-session-\(index)-share")
                        .accessibilityLabel(session.shareText)
                    }
                    Text(session.name).shotiqBody(18, weight: .bold)
                        .lineLimit(1).minimumScaleFactor(0.8)
                        .accessibilityIdentifier("analytics-card-session-\(index)-name")
                    HStack(spacing: 14) {
                        sessionStat("\(session.shots)", "SHOTS")
                            .accessibilityIdentifier("analytics-card-session-\(index)-shots")
                        sessionStat("\(session.makes)", "MAKES")
                            .accessibilityIdentifier("analytics-card-session-\(index)-makes")
                        sessionStat(session.acc, "ACCURACY")
                            .accessibilityIdentifier("analytics-card-session-\(index)-accuracy")
                    }
                    HStack(spacing: 7) {
                        ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { phase in
                            PhaseGlyph(phase: phase, active: phase == "RELEASE", size: 15)
                        }
                    }
                    HStack(alignment: .bottom) {
                        VStack(spacing: 1) {
                            Text(session.delta).font(.custom("Tungsten-Medium", size: 20))
                                .foregroundStyle(session.deltaColor)
                                .accessibilityIdentifier("analytics-card-session-\(index)-delta")
                            Text(session.deltaLabel).shotiqBody(7, weight: .bold).kerning(0.3)
                                .foregroundStyle(session.deltaColor)
                                .lineLimit(1).minimumScaleFactor(0.7)
                        }
                        .frame(width: 84)
                        .padding(.vertical, 7)
                        .background(session.deltaColor.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                        Spacer(minLength: 6)
                        NavigationLink { AnalyticsDetailedView(metric: session.name) } label: {
                            HStack(spacing: 4) {
                                Text("Open session").shotiqBody(12, weight: .semibold)
                                Image(systemName: "chevron.right").font(.system(size: 9))
                            }
                            .padding(.horizontal, 12).padding(.vertical, 9)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 7))
                            .foregroundStyle(.white)
                        }
                        .accessibilityIdentifier("analytics-card-session-\(index)-open")
                    }
                }
                .padding(12)
            }
        }
    }

    private func sessionStat(_ value: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(value).font(.custom("Tungsten-Medium", size: 18))
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(7, weight: .medium).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
        }
    }

    private static func signedScore(_ value: Int) -> String {
        value > 0 ? "+\(value)" : value < 0 ? "\(value)" : "—"
    }

    private static func sessionDateText(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = Calendar.current.isDateInToday(date) ? "'Today at' h:mm a" : "MMM d 'at' h:mm a"
        return formatter.string(from: date)
    }
}

/// Canonical 067 release-arc gauge: hairline semicircle, shaded ideal wedge,
/// orange tracked arc and a near-vertical needle. Pure Canvas, no rasters.
struct ArcGauge: View {
    var body: some View {
        Canvas { ctx, sz in
            let c = CGPoint(x: sz.width / 2, y: sz.height - 6)
            let r = min(sz.width / 2 - 8, sz.height - 14)
            var arc = Path()
            arc.addArc(center: c, radius: r, startAngle: .degrees(180), endAngle: .degrees(360), clockwise: false)
            ctx.stroke(arc, with: .color(ShotIQColor.rule), lineWidth: 2)
            var wedge = Path()
            wedge.move(to: c)
            wedge.addArc(center: c, radius: r, startAngle: .degrees(250), endAngle: .degrees(285), clockwise: false)
            wedge.closeSubpath()
            ctx.fill(wedge, with: .color(ShotIQColor.shotiqOrange.opacity(0.15)))
            var tracked = Path()
            tracked.addArc(center: c, radius: r * 0.7, startAngle: .degrees(190), endAngle: .degrees(350), clockwise: false)
            ctx.stroke(tracked, with: .color(ShotIQColor.shotiqOrange), lineWidth: 2)
            var needle = Path()
            needle.move(to: c)
            let ang = Angle.degrees(263).radians
            needle.addLine(to: CGPoint(x: c.x + CGFloat(cos(ang)) * r, y: c.y + CGFloat(sin(ang)) * r))
            ctx.stroke(needle, with: .color(ShotIQColor.ink), lineWidth: 2)
        }
        .accessibilityHidden(true)
    }
}

struct AnalyticsDetailedView: View { // 067
    var metric = "Release Consistency"
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @State private var range = "Last 30 days"
    @State private var chosenMetric: String?
    @State private var showRangePicker = false
    @State private var showMetricPicker = false
    @State private var showConfidenceInfo = false
    @State private var toast: ShotIQToast?

    private struct DetailMetricSummary {
        let trendText: String
        let trendCaption: String
        let latestText: String
        let latestDate: String
        let trendPoints: [Double]
        let trendBadge: String
        let trendA11y: String
        let confidenceText: String
        let confidenceMessage: String
        let rangeCount: Int
        let arcLabel: String
        let arcValue: String
        let arcTarget: String
        let consistencyText: String
        let consistencySpread: String
    }

    private struct PhaseScoreItem {
        let name: String
        let score: Int
        let delta: String
        let verdict: String
        let color: Color
    }

    private struct ComparisonHeader {
        let date: String
        let shots: String
        let highlight: Bool
    }

    private struct ComparisonRow {
        let metric: String
        let latest: String
        let previous: String
        let baseline: String
        let change: String
        let positive: Bool
    }

    private var displayMetric: String { chosenMetric ?? metric }
    private var workouts: [TrainingWorkoutRecord] {
        TrainingWorkoutStore.decode(completedWorkoutsPayload).sorted { $0.completedAt > $1.completedAt }
    }
    private var filteredWorkouts: [TrainingWorkoutRecord] {
        let calendar = Calendar.current
        let now = Date()
        return workouts.filter { workout in
            let daysAgo = calendar.dateComponents([.day], from: workout.completedAt, to: now).day ?? 0
            switch range {
            case "Last 7 days": return daysAgo <= 7
            case "Last 30 days": return daysAgo <= 30
            case "Last 90 days": return daysAgo <= 90
            default: return true
            }
        }
    }
    private var latestPresentation: AnalysisResultPresentation? {
        app.recentMedia.first.map { AnalysisResultPresentation(result: $0.analysis) }
    }
    private var exportSummary: String {
        if workouts.isEmpty {
            return "ShotIQ analysis - \(displayMetric), \(range): 78.2% consistency, form score 82, +6.4% vs previous 30 days."
        }
        let summary = metricSummary
        return "ShotIQ analysis - \(displayMetric), \(range): latest \(summary.latestText), change \(summary.trendText), \(summary.rangeCount) sessions in range."
    }
    private var metricSummary: DetailMetricSummary {
        guard workouts.isEmpty == false else {
            return DetailMetricSummary(trendText: "+6.4%",
                                       trendCaption: "vs previous 30 days",
                                       latestText: "78.2%",
                                       latestDate: "MAY 24",
                                       trendPoints: [68, 66.5, 69, 72.5, 68.5, 71, 73.5, 77, 76.2],
                                       trendBadge: "78.2%",
                                       trendA11y: "Release Consistency trend 68 to 66 to 69 to 72 to 68 to 71 to 73 to 77 to 76",
                                       confidenceText: "Confidence: High",
                                       confidenceMessage: "Confidence reflects how many tracked sessions back this trend. 9 sessions in range gives a high-confidence read.",
                                       rangeCount: 9,
                                       arcLabel: "AVG ARC",
                                       arcValue: "50.4°",
                                       arcTarget: "IDEAL: 48°–52°",
                                       consistencyText: "78.2%",
                                       consistencySpread: "±3.6°")
        }
        let visible = filteredWorkouts
        guard let latest = visible.first else {
            return DetailMetricSummary(trendText: "—",
                                       trendCaption: "no sessions in range",
                                       latestText: "--",
                                       latestDate: "--",
                                       trendPoints: [0, 0],
                                       trendBadge: "--",
                                       trendA11y: "\(displayMetric) has no sessions in \(range)",
                                       confidenceText: "Confidence: None",
                                       confidenceMessage: "No completed sessions match this range yet.",
                                       rangeCount: 0,
                                       arcLabel: "RELEASE OFFSET",
                                       arcValue: latestPresentation?.releaseOffsetText ?? "--",
                                       arcTarget: "TARGET: -5°–5°",
                                       consistencyText: "--",
                                       consistencySpread: "—")
        }
        let latestValue = metricValue(displayMetric, for: latest)
        let previous = visible.dropFirst().first
        let previousValue = previous.map { metricValue(displayMetric, for: $0) }
        let deltaText = previousValue.map { formatDelta(latestValue - $0, metric: displayMetric) } ?? "—"
        let points = visible.reversed().map { metricValue(displayMetric, for: $0) }
        let trendPoints = points.count == 1 ? [points[0], points[0]] : points
        let consistencyValues = visible.map { metricValue("Release Consistency", for: $0) }
        let spread = (consistencyValues.max() ?? 0) - (consistencyValues.min() ?? 0)
        return DetailMetricSummary(trendText: deltaText,
                                   trendCaption: previous == nil ? "no previous session" : "vs previous session",
                                   latestText: formatMetric(latestValue, metric: displayMetric),
                                   latestDate: Self.shortDate(latest.completedAt),
                                   trendPoints: trendPoints,
                                   trendBadge: formatMetric(latestValue, metric: displayMetric),
                                   trendA11y: "\(displayMetric) trend \(trendPoints.map { String(Int($0.rounded())) }.joined(separator: " to "))",
                                   confidenceText: visible.count >= 2 ? "Confidence: High" : "Confidence: Low",
                                   confidenceMessage: "\(visible.count) completed session\(visible.count == 1 ? "" : "s") in \(range.lowercased()).",
                                   rangeCount: visible.count,
                                   arcLabel: "RELEASE OFFSET",
                                   arcValue: latestPresentation?.releaseOffsetText ?? "--",
                                   arcTarget: "TARGET: -5°–5°",
                                   consistencyText: formatMetric(metricValue("Release Consistency", for: latest),
                                                                 metric: "Release Consistency"),
                                   consistencySpread: visible.count >= 2 ? "±\(String(format: "%.1f", spread))%" : "—")
    }
    private var scorecard: [PhaseScoreItem] {
        guard let latest = filteredWorkouts.first else {
            return [PhaseScoreItem(name: "SETUP", score: 84, delta: "+4", verdict: "GOOD", color: ShotIQColor.analysisBlue),
                    PhaseScoreItem(name: "LOAD", score: 79, delta: "+2", verdict: "GOOD", color: ShotIQColor.analysisBlue),
                    PhaseScoreItem(name: "RISE", score: 88, delta: "+5", verdict: "GREAT", color: ShotIQColor.confirmGreen),
                    PhaseScoreItem(name: "RELEASE", score: 78, delta: "+6", verdict: "GOOD", color: ShotIQColor.analysisBlue),
                    PhaseScoreItem(name: "FOLLOW-THROUGH", score: 84, delta: "+3", verdict: "GOOD", color: ShotIQColor.analysisBlue)]
        }
        let previous = filteredWorkouts.dropFirst().first
        return latest.phaseScores.map { phase, score in
            let previousScore = previous?.phaseScores.first(where: { $0.0 == phase })?.1
            let delta = previousScore.map { Self.signedScore(score - $0) } ?? "—"
            let verdict = score >= 85 ? "GREAT" : score >= 70 ? "GOOD" : "BUILDING"
            return PhaseScoreItem(name: phase,
                                  score: score,
                                  delta: delta,
                                  verdict: verdict,
                                  color: verdict == "GREAT" ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue)
        }
    }
    private var comparisonHeaders: [ComparisonHeader] {
        if workouts.isEmpty {
            return [ComparisonHeader(date: "MAY 24, 8:24 AM", shots: "24 SHOTS", highlight: true),
                    ComparisonHeader(date: "MAY 16, 7:05 AM", shots: "22 SHOTS", highlight: false),
                    ComparisonHeader(date: "MAY 9, 6:40 AM", shots: "21 SHOTS", highlight: false)]
        }
        var headers = filteredWorkouts.prefix(3).map {
            ComparisonHeader(date: Self.tableDate($0.completedAt), shots: "\($0.shots) SHOTS", highlight: false)
        }
        if headers.indices.contains(0) { headers[0] = ComparisonHeader(date: headers[0].date, shots: headers[0].shots, highlight: true) }
        while headers.count < 3 {
            headers.append(ComparisonHeader(date: "NO SESSION", shots: "--", highlight: false))
        }
        return headers
    }
    private var comparisonChangeLabel: String {
        workouts.isEmpty ? "(LATEST VS MAY 9)" : "(LATEST VS PREVIOUS)"
    }
    private var comparison: [ComparisonRow] {
        guard workouts.isEmpty == false else {
            return [ComparisonRow(metric: "Form Score", latest: "82", previous: "76", baseline: "71", change: "+11", positive: true),
                    ComparisonRow(metric: "Make %", latest: "62.5%", previous: "59.1%", baseline: "52.4%", change: "+10.1%", positive: true),
                    ComparisonRow(metric: "Release Consistency", latest: "78.2%", previous: "71.8%", baseline: "64.0%", change: "+14.2%", positive: true),
                    ComparisonRow(metric: "Release Angle", latest: "50.4°", previous: "48.1°", baseline: "45.2°", change: "+5.2°", positive: true),
                    ComparisonRow(metric: "Elbow Alignment", latest: "92%", previous: "88%", baseline: "81%", change: "+11%", positive: true),
                    ComparisonRow(metric: "Shot Depth", latest: "1.3 ft", previous: "1.5 ft", baseline: "1.7 ft", change: "-0.4 ft", positive: false),
                    ComparisonRow(metric: "Shot Speed", latest: "1.06 sec", previous: "1.11 sec", baseline: "1.18 sec", change: "-0.12 sec", positive: false),
                    ComparisonRow(metric: "Swish %", latest: "41.7%", previous: "36.4%", baseline: "28.6%", change: "+13.1%", positive: true)]
        }
        let visible = filteredWorkouts
        let metrics = ["Form Score", "Make %", "Release Consistency", "Release Angle", "Elbow Alignment"]
        return metrics.map { name in
            let values = visible.prefix(3).map { metricValue(name, for: $0) }
            let latest = values.first
            let previous = values.dropFirst().first
            let baseline = values.dropFirst(2).first
            let changeBase = previous ?? baseline
            let change = latest.flatMap { latest in changeBase.map { formatDelta(latest - $0, metric: name) } } ?? "—"
            return ComparisonRow(metric: name,
                                 latest: latest.map { formatMetric($0, metric: name) } ?? "--",
                                 previous: previous.map { formatMetric($0, metric: name) } ?? "--",
                                 baseline: baseline.map { formatMetric($0, metric: name) } ?? "--",
                                 change: change,
                                 positive: !change.hasPrefix("-"))
        }
    }
    var body: some View {
        let summary = metricSummary
        CanonicalScreen(testID: "screen-ios-analytics-detailed") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Wordmark(size: 26)
                        Spacer()
                        HStack(spacing: 18) {
                            Button { dismiss() } label: { toolItem("rectangle.on.rectangle", "Cards") }
                            Button { showMetricPicker = true } label: { toolItem("slider.horizontal.3", "Select metric") }
                            ShareLink(item: exportSummary) { toolItem("square.and.arrow.up", "Export") }
                        }
                    }
                    .padding(.horizontal, 20).frame(height: 56)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        Text("ANALYSIS HISTORY").shotiqDisplay(38).padding(.top, 14)
                        Text("Track your mechanics. See what moves the needle.")
                            .shotiqBody(13).foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                        HStack(spacing: 8) {
                            detailChip("calendar", range, chevron: true) { showRangePicker = true }
                                .accessibilityIdentifier("analytics-detailed-range-filter")
                            detailChip("chart.xyaxis.line", displayMetric, chevron: true) { showMetricPicker = true }
                                .accessibilityIdentifier("analytics-detailed-metric-filter")
                            detailChip(nil, summary.confidenceText, chevron: false) { showConfidenceInfo = true }
                                .accessibilityIdentifier("analytics-detailed-confidence")
                        }
                        .padding(.top, 12)
                        .confirmationDialog("Time range", isPresented: $showRangePicker, titleVisibility: .visible) {
                            ForEach(["Last 7 days", "Last 30 days", "Last 90 days", "All time"], id: \.self) { r in
                                Button(r) {
                                    range = r
                                    toast = .success("Range updated", "\(r): \(filteredCount(for: r)) sessions.")
                                }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        .confirmationDialog("Select metric", isPresented: $showMetricPicker, titleVisibility: .visible) {
                            ForEach(["Release Consistency", "Form Score", "Make %", "Release Angle", "Elbow Alignment"],
                                    id: \.self) { m in
                                Button(m) {
                                    chosenMetric = m
                                    toast = .success("Metric updated", "\(m) selected.")
                                }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        .alert(summary.confidenceText, isPresented: $showConfidenceInfo) {
                            Button("OK", role: .cancel) {}
                        } message: {
                            Text(summary.confidenceMessage)
                        }
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 12) {
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "TREND")
                                    Text(summary.trendText).font(.custom("Tungsten-Medium", size: 30))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                        .accessibilityIdentifier("analytics-detailed-trend-delta")
                                    Text(summary.trendCaption).shotiqBody(10)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .accessibilityIdentifier("analytics-detailed-trend-caption")
                                }
                                .frame(width: 82, alignment: .leading)
                                TrendLine(points: summary.trendPoints,
                                          stroke: ShotIQColor.confirmGreen,
                                          areaFill: true, gridlines: true,
                                          xLabels: ["APR", "MAY"],
                                          yLabels: ["80", "72", "64"],
                                          endBadge: summary.trendBadge)
                                    .frame(height: 92)
                                    .accessibilityElement(children: .ignore)
                                    .accessibilityIdentifier("analytics-detailed-trend-chart")
                                    .accessibilityLabel(summary.trendA11y)
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "LATEST")
                                    Text(summary.latestText).font(.custom("Tungsten-Medium", size: 30))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                        .accessibilityIdentifier("analytics-detailed-latest-value")
                                    Text(summary.latestDate).shotiqBody(10, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .accessibilityIdentifier("analytics-detailed-latest-date")
                                }
                                .frame(width: 62, alignment: .leading)
                            }
                            .padding(14)
                        }
                        .padding(.top, 14)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "MECHANICS SCORECARD")
                                HStack(alignment: .top, spacing: 6) {
                                    ForEach(Array(scorecard.enumerated()), id: \.element.name) { index, p in
                                        VStack(spacing: 4) {
                                            PhaseGlyph(phase: p.name, active: p.name == "RELEASE", size: 24)
                                            Text(p.name).shotiqBody(7, weight: .bold).kerning(0.2)
                                                .foregroundStyle(p.name == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.55)
                                                .accessibilityIdentifier("analytics-detailed-scorecard-\(index)-name")
                                            HStack(alignment: .firstTextBaseline, spacing: 2) {
                                                Text("\(p.score)").font(.custom("Tungsten-Medium", size: 20))
                                                    .accessibilityIdentifier("analytics-detailed-scorecard-\(index)-value")
                                                Text(p.delta).shotiqBody(8, weight: .bold)
                                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                                    .accessibilityIdentifier("analytics-detailed-scorecard-\(index)-delta")
                                            }
                                            Text(p.verdict).shotiqBody(8, weight: .bold)
                                                .foregroundStyle(p.color)
                                                .accessibilityIdentifier("analytics-detailed-scorecard-\(index)-verdict")
                                            ScoreBar(pct: Double(p.score) / 100, color: p.color)
                                        }
                                        .padding(6)
                                        .frame(maxWidth: .infinity)
                                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                    }
                                }
                            }
                            .padding(12)
                        }
                        .padding(.top, 12)
                        SectionLabel(text: "SESSION COMPARISON").padding(.top, 20)
                        VStack(spacing: 0) {
                            HStack(spacing: 0) {
                                Text("METRIC").shotiqBody(9, weight: .bold).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                ForEach(Array(comparisonHeaders.enumerated()), id: \.offset) { _, header in
                                    compHeader(header.date, header.shots, highlight: header.highlight)
                                }
                                compHeader("CHANGE", comparisonChangeLabel, highlight: false)
                            }
                            .padding(.vertical, 8)
                            .overlay(HRule(), alignment: .bottom)
                            ForEach(Array(comparison.enumerated()), id: \.element.metric) { index, r in
                                HStack(spacing: 0) {
                                    Text(r.metric).shotiqBody(11)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .accessibilityIdentifier("analytics-detailed-comparison-\(index)-metric")
                                    compCell(r.latest, color: ShotIQColor.shotiqOrange, highlight: true)
                                        .accessibilityIdentifier("analytics-detailed-comparison-\(index)-latest")
                                    compCell(r.previous, color: ShotIQColor.ink, highlight: false)
                                        .accessibilityIdentifier("analytics-detailed-comparison-\(index)-previous")
                                    compCell(r.baseline, color: ShotIQColor.ink, highlight: false)
                                        .accessibilityIdentifier("analytics-detailed-comparison-\(index)-baseline")
                                    compCell(r.change, color: r.positive ? ShotIQColor.confirmGreen : ShotIQColor.reviewRed,
                                             highlight: false)
                                        .accessibilityIdentifier("analytics-detailed-comparison-\(index)-change")
                                }
                                .padding(.vertical, 8)
                                .overlay(HRule(), alignment: .bottom)
                            }
                        }
                        .padding(.top, 8)
                        ShotIQCard {
                            HStack(alignment: .center, spacing: 10) {
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "RELEASE ARC RANGE")
                                    Text(summary.arcLabel).shotiqBody(8, weight: .semibold)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(summary.arcValue).font(.custom("Tungsten-Medium", size: 32))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .accessibilityIdentifier("analytics-detailed-arc-value")
                                    Text(summary.arcTarget).shotiqBody(9, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(width: 96, alignment: .leading)
                                ArcGauge().frame(height: 90).frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "CONSISTENCY")
                                    Text(summary.consistencyText).font(.custom("Tungsten-Medium", size: 28))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                        .accessibilityIdentifier("analytics-detailed-consistency-value")
                                    Text(summary.consistencySpread).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .accessibilityIdentifier("analytics-detailed-consistency-spread")
                                }
                                .frame(width: 76, alignment: .leading)
                            }
                            .padding(14)
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "SHOT RAIL SUMMARY")
                                PhaseStrip(active: "RELEASE")
                                HStack(spacing: 6) {
                                    railTile("SETUP", ShotIQColor.analysisBlue)
                                    railTile("LOAD", ShotIQColor.analysisBlue)
                                    railTile("RISE", ShotIQColor.confirmGreen)
                                    railTile("RELEASE", ShotIQColor.shotiqOrange)
                                    railTile("FOLLOW-THROUGH", ShotIQColor.graphite)
                                }
                            }
                            .padding(12)
                        }
                        .padding(.vertical, 16)
                        Spacer(minLength: 20)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
    }

    private func filteredCount(for selectedRange: String) -> Int {
        let calendar = Calendar.current
        let now = Date()
        return workouts.filter { workout in
            let daysAgo = calendar.dateComponents([.day], from: workout.completedAt, to: now).day ?? 0
            switch selectedRange {
            case "Last 7 days": return daysAgo <= 7
            case "Last 30 days": return daysAgo <= 30
            case "Last 90 days": return daysAgo <= 90
            default: return true
            }
        }.count
    }

    private func metricValue(_ metric: String, for workout: TrainingWorkoutRecord) -> Double {
        switch metric {
        case "Form Score":
            return Double(workout.formScore)
        case "Make %":
            return workout.accuracy * 100
        case "Release Consistency":
            let values = workout.phaseScores.map { Double($0.1) }
            return values.reduce(0, +) / Double(max(values.count, 1))
        case "Release Angle":
            return metricNumber(latestPresentation?.releaseOffsetText) ?? Double(workout.formScore)
        case "Elbow Alignment":
            return metricNumber(latestPresentation?.elbowAngleText) ?? Double(workout.formScore)
        default:
            let values = workout.phaseScores.map { Double($0.1) }
            return values.reduce(0, +) / Double(max(values.count, 1))
        }
    }

    private func metricNumber(_ text: String?) -> Double? {
        guard let text else { return nil }
        let allowed = text.filter { "-0123456789.".contains($0) }
        return Double(allowed)
    }

    private func formatMetric(_ value: Double, metric: String) -> String {
        switch metric {
        case "Form Score":
            return "\(Int(value.rounded()))"
        case "Make %", "Release Consistency":
            return String(format: "%.1f%%", value)
        case "Release Angle", "Elbow Alignment":
            return "\(Int(value.rounded()))°"
        default:
            return String(format: "%.1f%%", value)
        }
    }

    private func formatDelta(_ value: Double, metric: String) -> String {
        if abs(value) < 0.05 { return "—" }
        let sign = value > 0 ? "+" : ""
        switch metric {
        case "Form Score":
            return "\(sign)\(Int(value.rounded()))"
        case "Make %", "Release Consistency":
            return "\(sign)\(String(format: "%.1f", value))%"
        case "Release Angle", "Elbow Alignment":
            return "\(sign)\(Int(value.rounded()))°"
        default:
            return "\(sign)\(String(format: "%.1f", value))%"
        }
    }

    private static func signedScore(_ value: Int) -> String {
        value > 0 ? "+\(value)" : value < 0 ? "\(value)" : "—"
    }

    private static func shortDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = Calendar.current.isDateInToday(date) ? "TODAY" : "MMM d"
        return formatter.string(from: date).uppercased()
    }

    private static func tableDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = Calendar.current.isDateInToday(date) ? "'TODAY,' h:mm a" : "MMM d, h:mm a"
        return formatter.string(from: date).uppercased()
    }

    private func toolItem(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 3) {
            Image(systemName: icon).font(.system(size: 15))
            Text(label).shotiqBody(9).lineLimit(1).minimumScaleFactor(0.7)
        }
        .foregroundStyle(ShotIQColor.ink)
    }
    private func detailChip(_ icon: String?, _ label: String, chevron: Bool,
                            action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                if let icon { Image(systemName: icon).font(.system(size: 11)) }
                Text(label).shotiqBody(11, weight: .medium)
                    .lineLimit(1).minimumScaleFactor(0.6)
                if chevron { Image(systemName: "chevron.down").font(.system(size: 8)) }
            }
            .padding(.horizontal, 9).frame(height: 38)
            .frame(maxWidth: .infinity)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
            .foregroundStyle(ShotIQColor.ink)
        }
    }
    private func compHeader(_ line1: String, _ line2: String, highlight: Bool) -> some View {
        VStack(spacing: 1) {
            Text(line1).shotiqBody(7, weight: .bold)
            Text(line2).shotiqBody(6.5).foregroundStyle(ShotIQColor.graphite)
        }
        .lineLimit(1).minimumScaleFactor(0.6)
        .frame(width: 62)
        .padding(.vertical, 3)
        .background(highlight ? ShotIQColor.warmCanvas : .clear)
    }
    private func compCell(_ value: String, color: Color, highlight: Bool) -> some View {
        Text(value).shotiqBody(11, weight: .semibold).foregroundStyle(color)
            .lineLimit(1).minimumScaleFactor(0.6)
            .frame(width: 62)
            .padding(.vertical, 3)
            .background(highlight ? ShotIQColor.warmCanvas : .clear)
    }
    private func railTile(_ label: String, _ color: Color) -> some View {
        VStack(spacing: 0) {
            Rectangle().fill(ShotIQColor.warmCanvas).frame(height: 56)
                .overlay(ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "figure.basketball"),
                                                  size: 18,
                                                  label: nil))
            Text(label).shotiqBody(6.5, weight: .bold).kerning(0.2)
                .foregroundStyle(.white)
                .lineLimit(1).minimumScaleFactor(0.5)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
                .background(color)
        }
        .clipShape(RoundedRectangle(cornerRadius: 5))
        .frame(maxWidth: .infinity)
    }
}

struct MyMediaView: View {          // 068
    @EnvironmentObject var app: AppState
    @State private var segment = "All"
    @State private var gradeFilter = "All results"
    @State private var sortNewest = true
    @State private var selecting = false
    @State private var selectedTiles: Set<Int> = []
    @State private var showGradeFilter = false
    @State private var toast: ShotIQToast?
    private struct MediaHeaderStat {
        let value: String
        let label: String
    }
    private struct MediaItem {
        let title, time, score, grade: String
        let color: Color
        let kind: String            // Images / Videos / Live / Workouts
        let duration: String
        let photo: String?
        let analysis: ShotIQAnalysisResultDTO?
    }
    private let today: [MediaItem] = [
        .init(title: "Pull-Up • Right", time: "8:24 AM", score: "82", grade: "GOOD",
              color: ShotIQColor.analysisBlue, kind: "Videos", duration: "0:03",
              photo: "068-visual-002", analysis: nil),
        .init(title: "Spot-Up • Right", time: "8:18 AM", score: "74", grade: "REVIEW",
              color: ShotIQColor.reviewRed, kind: "Images", duration: "0:04",
              photo: "068-visual-003", analysis: nil),
        .init(title: "Catch & Shoot • Right", time: "8:12 AM", score: "86", grade: "GOOD",
              color: ShotIQColor.analysisBlue, kind: "Videos", duration: "0:05",
              photo: "068-visual-001", analysis: nil),
        .init(title: "Live Session", time: "8:01 AM", score: "80", grade: "GOOD",
              color: ShotIQColor.analysisBlue, kind: "Live", duration: "0:06",
              photo: "068-visual-005", analysis: nil),
        .init(title: "Low Dribble Series", time: "7:45 AM", score: "88", grade: "GOOD",
              color: ShotIQColor.analysisBlue, kind: "Workouts", duration: "0:07",
              photo: "068-visual-004", analysis: nil),
        .init(title: "Cone Progression", time: "7:28 AM", score: "90", grade: "EXCELLENT",
              color: ShotIQColor.confirmGreen, kind: "Images", duration: "0:08",
              photo: "068-visual-003", analysis: nil)
    ]
    private var realMedia: [MediaItem] {
        app.recentMedia.map { entry in
            let presentation = AnalysisResultPresentation(result: entry.analysis)
            let isGood = presentation.scoreVerdict == "GOOD" || presentation.scoreVerdict == "EXCELLENT"
            return MediaItem(title: entry.title,
                             time: "Just now",
                             score: presentation.scoreText,
                             grade: presentation.scoreVerdict,
                             color: isGood ? ShotIQColor.analysisBlue : ShotIQColor.reviewRed,
                             kind: entry.kind,
                             duration: entry.durationText,
                             photo: nil,
                             analysis: entry.analysis)
        }
    }
    private var allToday: [MediaItem] { realMedia + today }
    private var filteredToday: [(Int, MediaItem)] {
        var items = Array(allToday.enumerated()).filter { pair in
            (segment == "All" || pair.element.kind == segment)
            && (gradeFilter == "All results" || pair.element.grade == gradeFilter)
        }
        if !sortNewest { items.reverse() }
        return items.map { ($0.offset, $0.element) }
    }
    /// Yesterday's four clips are all plain video captures.
    private var showYesterday: Bool {
        (segment == "All" || segment == "Videos") && gradeFilter == "All results"
    }
    private var latestPresentation: AnalysisResultPresentation? {
        app.recentMedia.first.map { AnalysisResultPresentation(result: $0.analysis) }
    }
    private var headerScoreText: String {
        latestPresentation?.scoreText ?? "82"
    }
    private var headerScoreVerdict: String {
        latestPresentation?.scoreVerdict ?? "GOOD"
    }
    private var headerScoreColor: Color {
        headerScoreVerdict == "UNAVAILABLE" || headerScoreVerdict == "REVIEW"
            ? ShotIQColor.reviewRed
            : ShotIQColor.analysisBlue
    }
    private var headerScorePct: Double {
        Double(headerScoreText).map { min(max($0 / 100, 0), 1) } ?? 0
    }
    private var primaryTargetText: String {
        latestPresentation?.coachingTarget ?? "Keep elbow stacked through release"
    }
    private var headerStats: [MediaHeaderStat] {
        guard realMedia.isEmpty == false else {
            return [MediaHeaderStat(value: "24", label: "SHOTS"),
                    MediaHeaderStat(value: "15", label: "MAKES"),
                    MediaHeaderStat(value: "62.5%", label: "ACCURACY")]
        }
        let imageCount = realMedia.filter { $0.kind == "Images" }.count
        let videoCount = realMedia.filter { $0.kind == "Videos" }.count
        return [MediaHeaderStat(value: "\(realMedia.count)", label: "MEDIA"),
                MediaHeaderStat(value: "\(imageCount)", label: imageCount == 1 ? "IMAGE" : "IMAGES"),
                MediaHeaderStat(value: "\(videoCount)", label: videoCount == 1 ? "VIDEO" : "VIDEOS")]
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-my-media") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Primary target").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 12)
                        Text(primaryTargetText).shotiqBody(14, weight: .semibold)
                            .padding(.top, 2)
                            .accessibilityIdentifier("my-media-primary-target")
                        ShotIQCard {
                            HStack(spacing: 0) {
                                VStack(spacing: 3) {
                                    Text("FORM SCORE").shotiqBody(8, weight: .semibold).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(headerScoreText).font(.custom("Tungsten-Medium", size: 26))
                                        .foregroundStyle(headerScoreColor)
                                        .accessibilityIdentifier("my-media-header-score")
                                    Text(headerScoreVerdict).shotiqBody(8, weight: .bold)
                                        .foregroundStyle(headerScoreColor)
                                        .accessibilityIdentifier("my-media-header-verdict")
                                    ScoreBar(pct: headerScorePct, color: headerScoreColor).frame(width: 44)
                                        .accessibilityIdentifier("my-media-header-score-bar")
                                }
                                .frame(maxWidth: .infinity)
                                ForEach(Array(headerStats.enumerated()), id: \.offset) { index, stat in
                                    VRule(height: 48)
                                    mediaStat(stat.value, stat.label, idPrefix: "my-media-header-stat-\(index)")
                                }
                                VRule(height: 48)
                                PhaseGlyph(active: true, size: 34).frame(maxWidth: .infinity)
                            }
                            .padding(.vertical, 12)
                        }
                        .padding(.top, 12)
                        HStack(alignment: .center) {
                            Text("MY MEDIA").shotiqDisplay(38)
                            Spacer()
                            NavigationLink { PhotoUploadSourceView() } label: {
                                HStack(spacing: 7) {
                                    Image(systemName: "square.and.arrow.up")
                                    Text("Upload").shotiqBody(15, weight: .medium)
                                }
                                .padding(.horizontal, 16).frame(height: 46)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                        }
                        .padding(.top, 16)
                        Text("Review your shots and training sessions.")
                            .shotiqBody(13).foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                        HStack(spacing: 0) {
                            ForEach(["All", "Images", "Videos", "Live", "Workouts"], id: \.self) { s in
                                Button {
                                    segment = s
                                    toast = .success("Media view updated", "\(s): \(filteredCount(segment: s, grade: gradeFilter)) items visible.")
                                } label: {
                                    Text(s).shotiqBody(13, weight: segment == s ? .semibold : .regular)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                        .frame(maxWidth: .infinity).frame(height: 38)
                                        .background(segment == s ? ShotIQColor.warmCanvas : .clear,
                                                    in: RoundedRectangle(cornerRadius: 6))
                                        .foregroundStyle(segment == s ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                }
                                .accessibilityIdentifier("my-media-segment-\(s)")
                            }
                        }
                        .padding(4)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 12)
                        HStack(spacing: 8) {
                            mediaTool("slider.horizontal.3",
                                      gradeFilter == "All results" ? "Filter" : gradeFilter,
                                      active: gradeFilter != "All results") { showGradeFilter = true }
                                      .accessibilityIdentifier("my-media-filter")
                            mediaTool("arrow.up.arrow.down", sortNewest ? "Sort: Newest" : "Sort: Oldest",
                                      active: false) {
                                sortNewest.toggle()
                                toast = .success("Sort updated", sortNewest ? "Newest first." : "Oldest first.")
                            }
                                      .accessibilityIdentifier("my-media-sort")
                            mediaTool("viewfinder", selecting ? "Done (\(selectedTiles.count))" : "Select",
                                      active: selecting) {
                                selecting.toggle()
                                if selecting {
                                    toast = .success("Select media", "Tap items to add them.")
                                } else {
                                    toast = .success("Selection finished", "\(selectedTiles.count) item\(selectedTiles.count == 1 ? "" : "s") selected.")
                                    selectedTiles.removeAll()
                                }
                            }
                                      .accessibilityIdentifier("my-media-select")
                        }
                        .padding(.top, 10)
                        .confirmationDialog("Filter by result", isPresented: $showGradeFilter,
                                            titleVisibility: .visible) {
                            ForEach(["All results", "GOOD", "REVIEW", "EXCELLENT"], id: \.self) { g in
                                Button(g) {
                                    gradeFilter = g
                                    toast = .success("Filter updated", "\(g): \(filteredCount(segment: segment, grade: g)) items visible.")
                                }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        HStack {
                            SectionLabel(text: "TODAY")
                            Spacer()
                            Text("\(filteredToday.count) ITEMS").shotiqBody(10, weight: .semibold).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                                .accessibilityIdentifier("my-media-visible-count")
                        }
                        .padding(.top, 18)
                        if filteredToday.isEmpty {
                            Text("Nothing in this view yet.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                .frame(maxWidth: .infinity).padding(.vertical, 24)
                                .accessibilityIdentifier("my-media-empty-state")
                        }
                        let cols = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)
                        LazyVGrid(columns: cols, spacing: 14) {
                            ForEach(filteredToday, id: \.0) { i, t in
                                if selecting {
                                    Button {
                                        if selectedTiles.contains(i) {
                                            selectedTiles.remove(i)
                                            toast = .success("Removed from selection", "\(t.title) removed.")
                                        } else {
                                            selectedTiles.insert(i)
                                            toast = .success("Added to selection", "\(t.title) selected.")
                                        }
                                    } label: {
                                        mediaTile(t)
                                            .overlay(alignment: .topLeading) {
                                                Image(systemName: selectedTiles.contains(i)
                                                      ? "checkmark.circle.fill" : "circle")
                                                    .font(.system(size: 17))
                                                    .foregroundStyle(selectedTiles.contains(i)
                                                                     ? ShotIQColor.shotiqOrange : .white)
                                                    .padding(6)
                                            }
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityIdentifier("my-media-tile-\(i)")
                                } else {
                                    NavigationLink { MediaDetailView(analysis: t.analysis) } label: {
                                        mediaTile(t)
                                    }
                                    .accessibilityIdentifier("my-media-tile-\(i)")
                                }
                            }
                        }
                        .padding(.top, 10)
                        if showYesterday {
                            HStack {
                                SectionLabel(text: "YESTERDAY")
                                Spacer()
                                Text("4 ITEMS").shotiqBody(10, weight: .semibold).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 20)
                            HStack(spacing: 8) {
                                ForEach(0..<4, id: \.self) { i in
                                    NavigationLink { MediaDetailView() } label: {
                                        PhotoThumb(height: 66,
                                                   photo: ["068-visual-002", "068-visual-001",
                                                           "068-visual-005", "068-visual-004"][i])
                                            .overlay(alignment: .bottomLeading) {
                                                Text("0:0\((i + 4) % 9)")
                                                    .font(.custom("Tungsten-Medium", size: 10))
                                                    .foregroundStyle(.white)
                                                    .padding(.horizontal, 5).padding(.vertical, 2)
                                                    .background(.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 3))
                                                    .padding(4)
                                            }
                                            .frame(maxWidth: .infinity)
                                    }
                                }
                            }
                            .padding(.top, 10)
                        }
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
    }
    private func filteredCount(segment selectedSegment: String, grade selectedGrade: String) -> Int {
        allToday.filter {
            (selectedSegment == "All" || $0.kind == selectedSegment)
            && (selectedGrade == "All results" || $0.grade == selectedGrade)
        }.count
    }
    private func mediaStat(_ value: String, _ label: String, idPrefix: String) -> some View {
        VStack(spacing: 3) {
            Text(value).font(.custom("Tungsten-Medium", size: 26)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
                .accessibilityIdentifier("\(idPrefix)-value")
            Text(label).shotiqBody(8, weight: .medium).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .accessibilityIdentifier("\(idPrefix)-label")
        }
        .frame(maxWidth: .infinity)
    }
    private func mediaTool(_ icon: String, _ label: String, active: Bool,
                           action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.system(size: 12))
                Text(label).shotiqBody(12, weight: .medium)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity).frame(height: 40)
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(active ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
            .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
        }
    }
    private func mediaTile(_ t: MediaItem) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            MediaAnalysisSurface(analysis: t.analysis,
                                 fallbackPhoto: t.photo ?? "068-visual-002",
                                 height: 112)
                .overlay(alignment: .bottomLeading) {
                    Text(t.duration).font(.custom("Tungsten-Medium", size: 11))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 5).padding(.vertical, 2)
                        .background(.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 3))
                        .padding(5)
                }
                .overlay(alignment: .bottomTrailing) {
                    Image(systemName: t.grade == "REVIEW" ? "exclamationmark.circle.fill" : "checkmark.circle.fill")
                        .font(.system(size: 15))
                        .foregroundStyle(t.grade == "REVIEW" ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen)
                        .background(Circle().fill(.white).padding(2))
                        .padding(5)
                }
            HStack(alignment: .top, spacing: 4) {
                VStack(alignment: .leading, spacing: 1) {
                    Text(t.title).shotiqBody(9.5, weight: .semibold)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.6)
                    Text(t.time).shotiqBody(8.5).foregroundStyle(ShotIQColor.graphite)
                }
                Spacer(minLength: 2)
                VStack(alignment: .trailing, spacing: 1) {
                    Text(t.score).font(.custom("Tungsten-Medium", size: 16)).foregroundStyle(t.color)
                    Text(t.grade).shotiqBody(6.5, weight: .bold).foregroundStyle(t.color)
                        .lineLimit(1).minimumScaleFactor(0.6)
                }
            }
        }
    }
}

struct MediaDetailView: View {      // 069
    var analysis: ShotIQAnalysisResultDTO? = nil
    /// Server id of the backing UserAnalysis row, when opened from real data —
    /// enables the authoritative DELETE /api/media?analysisId=… call.
    var analysisId: String? = nil
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var playing = false
    @State private var speedIndex = 1
    @State private var selectedFrame = 4
    @State private var deleting = false
    @State private var confirmDelete = false
    @State private var showDownloadInfo = false
    @State private var toast: ShotIQToast?
    private let speeds = ["SLOW 0.5x", "SLOW 1.0x", "SLOW 2.0x"]
    private var presentation: AnalysisResultPresentation {
        analysis.map(AnalysisResultPresentation.init) ?? .canonicalDemo
    }
    private var isRealAnalysis: Bool { analysis != nil }
    private var shareText: String {
        isRealAnalysis
            ? presentation.formScoreShareText
            : "My ShotIQ session - 15/24 makes (62.5%), form score 82."
    }
    private var mediaDurationText: String {
        analysis?.media.type?.lowercased() == "image" ? "photo" : "6:12"
    }
    private var captureDateText: String {
        isRealAnalysis ? presentation.recordedLabel.uppercased() : "MAY 21, 2025 - 8:24 AM"
    }
    private var captureMetaText: String {
        guard isRealAnalysis else { return "Indoor Court - iPhone 15 Pro - 1080p - 60fps" }
        return "\(presentation.mediaLabel) - \(presentation.provenanceSummary)"
    }
    private var linkedAnalysisDateText: String {
        isRealAnalysis ? "• \(presentation.recordedLabel)" : "• May 21, 2025"
    }
    private var downloadUnavailableMessage: String {
        guard isRealAnalysis else {
            return "This clip is stored on the ShotIQ server. On-device downloads are coming to a future build."
        }
        if analysisId == nil {
            return "This media is saved in the current app session. Server-backed downloads are coming after media sync."
        }
        return "This media is stored on the ShotIQ server. On-device downloads are coming to a future build."
    }
    private var shotEventValues: (shots: String, makes: String, pct: String, streak: String, points: String) {
        isRealAnalysis ? ("--", "--", "--", "--", "--") : ("24", "15", "62.5%", "6", "2,840")
    }

    /// DELETE /api/media?analysisId=… (route requires query params + CSRF, so
    /// this builds the request directly; it shares URLSession's cookie store
    /// and the Keychain token with APIClient).
    private func deleteMedia() {
        guard !deleting else { return }
        guard let analysisId else {
            guard let analysis else {
                toast = .info("Sample media only", "There is no server item to delete yet.")
                return
            }
            deleting = true
            toast = .progress("Removing media", "Deleting this in-session result.", progress: 0.45)
            Task {
                try? await Task.sleep(nanoseconds: 300_000_000)
                app.recentMedia.removeAll { $0.id == analysis.id }
                toast = .success("Media removed", "Returning to your library.")
                try? await Task.sleep(nanoseconds: 650_000_000)
                deleting = false
                dismiss()
            }
            return
        }
        deleting = true
        toast = .progress("Deleting media", "Removing this clip from ShotIQ.", progress: 0.45)
        Task {
            defer { deleting = false }
            do {
                let base = URL(string: ProcessInfo.processInfo.environment["SHOTIQ_API"]
                               ?? "https://shotiq.194-146-12-139.sslip.io")!
                struct Csrf: Codable { let csrfToken: String }
                var csrfReq = URLRequest(url: base.appending(path: "/api/auth/csrf"))
                csrfReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
                let (csrfData, _) = try await URLSession.shared.data(for: csrfReq)
                let csrf = try JSONDecoder().decode(Csrf.self, from: csrfData)
                guard var comps = URLComponents(url: base.appending(path: "/api/media"),
                                                resolvingAgainstBaseURL: false) else {
                    throw URLError(.badURL)
                }
                comps.queryItems = [URLQueryItem(name: "analysisId", value: analysisId)]
                guard let url = comps.url else { throw URLError(.badURL) }
                var req = URLRequest(url: url)
                req.httpMethod = "DELETE"
                req.setValue(csrf.csrfToken, forHTTPHeaderField: "x-csrf-token")
                if let token = KeychainStore.read(key: "accessToken") {
                    req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                }
                _ = try await URLSession.shared.data(for: req)
                toast = .success("Media deleted", "Returning to your library.")
                try? await Task.sleep(nanoseconds: 650_000_000)
                dismiss()
            } catch {
                toast = .error("Delete failed", "Check your connection and try again.")
            }
        }
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-media-detail") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 14) {
                        Button { dismiss() } label: {
                            Image(systemName: "arrow.left")
                                .font(.system(size: 19, weight: .medium)).foregroundStyle(ShotIQColor.ink)
                        }
                        .accessibilityLabel("Back")
                        .accessibilityIdentifier("media-detail-back")
                        Text("MEDIA DETAIL").shotiqDisplay(26)
                        Spacer()
                        Menu {
                            ShareLink(item: shareText) { Label("Share", systemImage: "square.and.arrow.up") }
                            Button(role: .destructive) { confirmDelete = true } label: {
                                Label("Delete media", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis").font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
                                .frame(width: 36, height: 36, alignment: .trailing)
                        }
                        .accessibilityIdentifier("media-detail-more-menu")
                    }
                    .padding(.horizontal, 20).frame(height: 52)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        ZStack {
                            MediaAnalysisSurface(analysis: analysis,
                                                 fallbackPhoto: "069-visual-002",
                                                 height: 310,
                                                 cornerRadius: 8)
                            Button {
                                playing.toggle()
                                toast = .info(playing ? "Playing clip" : "Clip paused",
                                              playing ? "Reviewing your shot media." : "Playback paused.")
                            } label: {
                                Circle().fill(.white.opacity(0.9)).frame(width: 52, height: 52)
                                    .overlay(Image(systemName: playing ? "pause.fill" : "play.fill")
                                        .font(.system(size: 19))
                                        .foregroundStyle(ShotIQColor.ink))
                            }
                            .accessibilityLabel(playing ? "Pause" : "Play")
                            .accessibilityIdentifier("media-detail-hero-play")
                        }
                        .overlay(alignment: .topLeading) {
                            Text(mediaDurationText).font(.custom("Tungsten-Medium", size: 13)).foregroundStyle(.white)
                                .padding(.horizontal, 8).padding(.vertical, 4)
                                .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 4))
                                .padding(10)
                        }
                        .overlay(alignment: .topTrailing) {
                            Button {
                                speedIndex = (speedIndex + 1) % speeds.count
                                toast = .success("Playback speed changed", speeds[speedIndex])
                            } label: {
                                Text(speeds[speedIndex]).shotiqBody(10, weight: .bold).kerning(0.4)
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 8).padding(.vertical, 5)
                                    .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 4))
                            }
                            .accessibilityLabel("Playback speed")
                            .accessibilityIdentifier("media-detail-playback-speed")
                            .padding(10)
                        }
                        .padding(.top, 14)
                        // Canonical's scrubber strip is eight frames of the clip,
                        // not eight beige rectangles. The bundle holds two crops of
                        // this take: 069-visual-002 (x 108…698, the de-chromed
                        // middle the hero above uses) and 069-visual-004, the wider
                        // x 23…828 frame that also takes in the duration and speed
                        // pills. The wide one cannot back the hero — its baked pills
                        // would land next to the live ones — but at 48pt the pills
                        // fall outside the .fill crop and it is simply the frame.
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(0..<8, id: \.self) { i in
                                    Button {
                                        selectedFrame = i
                                        toast = .info("Frame selected", "Frame \(i + 1) is ready for review.")
                                    } label: {
                                        CanonicalPhoto("069-visual-004", width: 48, height: 38, cornerRadius: 5)
                                            .overlay(RoundedRectangle(cornerRadius: 5)
                                                .stroke(i == selectedFrame ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                                                        lineWidth: i == selectedFrame ? 2 : 1))
                                    }
                                    .accessibilityLabel("Frame \(i + 1)")
                                    .accessibilityIdentifier("media-detail-frame-\(i + 1)")
                                }
                            }
                            .padding(.vertical, 2)
                        }
                        .padding(.top, 10)
                        SectionLabel(text: "CAPTURE DETAILS").padding(.top, 18)
                        Text(captureDateText).font(.custom("Tungsten-Medium", size: 24))
                            .padding(.top, 6)
                            .accessibilityIdentifier("media-detail-capture-date")
                        Text(captureMetaText)
                            .shotiqBody(12).foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                            .accessibilityIdentifier("media-detail-capture-meta")
                        SectionLabel(text: "LINKED ANALYSIS").padding(.top, 18)
                        ShotIQCard {
                            HStack(spacing: 12) {
                                // Canonical's linked-analysis row shows a frame of
                                // the same clip, not a placeholder tile.
                                MediaAnalysisSurface(analysis: analysis,
                                                     fallbackPhoto: "069-visual-004",
                                                     width: 62,
                                                     height: 48)
                                VStack(alignment: .leading, spacing: 3) {
                                    HStack(spacing: 4) {
                                        // The date and the "Open analysis" pill
                                        // took the row's width first, so the title
                                        // broke inside its own word — "Shot
                                        // Analysi / s" on 069. The title is the
                                        // fixed part of this row; the date is the
                                        // part that may abbreviate.
                                        Text("Shot Analysis").shotiqBody(14, weight: .bold)
                                            .lineLimit(1).fixedSize()
                                        Text(linkedAnalysisDateText).shotiqBody(11)
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(1).minimumScaleFactor(0.7)
                                            .accessibilityIdentifier("media-detail-linked-date")
                                    }
                                    Text("Form Score").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    HStack(spacing: 8) {
                                        Text(presentation.scoreText).font(.custom("Tungsten-Medium", size: 22))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: presentation.scorePct).frame(width: 76)
                                    }
                                }
                                Spacer(minLength: 4)
                                NavigationLink { AnalysisResultOverviewView(initialResult: analysis) } label: {
                                    HStack(spacing: 4) {
                                        Text("Open analysis").shotiqBody(12, weight: .semibold)
                                            .lineLimit(1).minimumScaleFactor(0.7)
                                        Image(systemName: "chevron.right").font(.system(size: 9))
                                    }
                                    .padding(.horizontal, 10).padding(.vertical, 9)
                                    .overlay(RoundedRectangle(cornerRadius: 7).stroke(ShotIQColor.analysisBlue))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                }
                                .accessibilityIdentifier("media-detail-open-analysis")
                            }
                            .padding(12)
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "SHOT EVENTS").padding(.top, 18)
                        HStack(spacing: 0) {
                            HeaderStat(icon: "scope", value: shotEventValues.shots, label: "SHOTS").frame(maxWidth: .infinity)
                            VRule(height: 46)
                            HeaderStat(icon: "point.3.connected.trianglepath.dotted", value: shotEventValues.makes, label: "MAKES")
                                .frame(maxWidth: .infinity)
                            VRule(height: 46)
                            HeaderStat(icon: "gauge", value: shotEventValues.pct, label: "MAKE %").frame(maxWidth: .infinity)
                            VRule(height: 46)
                            HeaderStat(icon: "sparkles", value: shotEventValues.streak, label: "DAY STREAK").frame(maxWidth: .infinity)
                            VRule(height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: shotEventValues.points, label: "POINTS")
                                .frame(maxWidth: .infinity)
                        }
                        .padding(.top, 10)
                        NavigationLink { GoalsView() } label: {
                            VStack(alignment: .leading, spacing: 5) {
                                MicroLabel(text: "PRIMARY COACHING TARGET")
                                HStack {
                                    Text(presentation.coachingTarget).shotiqBody(17, weight: .bold)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(.vertical, 14)
                            .overlay(HRule(), alignment: .top)
                            .overlay(HRule(), alignment: .bottom)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("Primary coaching target \(presentation.coachingTarget)")
                        .accessibilityIdentifier("media-detail-primary-target")
                        .padding(.top, 18)
                        SectionLabel(text: "ACTIONS").padding(.top, 16)
                        HStack(spacing: 8) {
                            actionButton(playing ? "pause.fill" : "play.fill",
                                         playing ? "Pause" : "Play", ShotIQColor.ink) {
                                playing.toggle()
                                toast = .info(playing ? "Playing clip" : "Clip paused")
                            }
                                         .accessibilityIdentifier("media-detail-action-play")
                            ShareLink(item: shareText) {
                                actionLabel("square.and.arrow.up", "Share", ShotIQColor.ink)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening share sheet", "Your ShotIQ summary is ready.")
                            })
                            actionButton("arrow.down.to.line", "Download", ShotIQColor.ink,
                                         identifier: "media-detail-download-button") {
                                toast = .info("Download unavailable", "On-device downloads are coming soon.")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                                    showDownloadInfo = true
                                }
                            }
                            actionButton("trash", "Delete", ShotIQColor.reviewRed,
                                         identifier: "media-detail-delete-button") {
                                toast = .info("Delete confirmation", "Choose Delete media to remove this clip.")
                                confirmDelete = true
                            }
                        }
                        .padding(.top, 8)
                        .alert("Download unavailable", isPresented: $showDownloadInfo) {
                            Button("OK", role: .cancel) {}
                        } message: {
                            Text(downloadUnavailableMessage)
                        }
                        HStack(spacing: 10) {
                            Image(systemName: "trash").font(.system(size: 15))
                                .foregroundStyle(ShotIQColor.reviewRed)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Delete this media?").shotiqBody(13, weight: .semibold)
                                    .foregroundStyle(ShotIQColor.reviewRed)
                                Text("This action cannot be undone.")
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer(minLength: 4)
                            Button { deleteMedia() } label: {
                                HStack(spacing: 6) {
                                    if deleting { ProgressView().tint(.white) }
                                    Text(deleting ? "Deleting…" : "Delete media")
                                        .shotiqBody(13, weight: .semibold)
                                }
                                .padding(.horizontal, 12).padding(.vertical, 9)
                                .background(ShotIQColor.reviewRed, in: RoundedRectangle(cornerRadius: 7))
                                .foregroundStyle(.white)
                            }
                            .disabled(deleting)
                            .accessibilityIdentifier("media-detail-delete-media-button")
                        }
                        .padding(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(ShotIQColor.reviewRed.opacity(0.5))
                                .allowsHitTesting(false)
                        )
                        .padding(.vertical, 16)
                        Spacer(minLength: 20)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
        .confirmationDialog("Delete this media? This cannot be undone.",
                            isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Delete media", role: .destructive) { deleteMedia() }
            Button("Cancel", role: .cancel) {}
        }
    }
    private func actionLabel(_ icon: String, _ label: String, _ color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 12))
            Text(label).shotiqBody(12, weight: .medium)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity).frame(height: 46)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(ShotIQColor.rule)
                .allowsHitTesting(false)
        )
        .foregroundStyle(color)
    }
    private func actionButton(_ icon: String, _ label: String, _ color: Color,
                              identifier: String? = nil,
                              action: @escaping () -> Void) -> some View {
        Button(action: action) { actionLabel(icon, label, color) }
            .accessibilityIdentifier(identifier ?? label)
    }
}

struct ProfileView: View {          // 070
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @AppStorage("profileHeightIn") private var heightIn = 75
    @AppStorage("profileWeightLbs") private var weightLbs = 185
    @AppStorage("profileWingspanIn") private var wingspanIn = 77
    @AppStorage("profileHand") private var hand = "right"
    @AppStorage("profileLevel") private var level = "advanced"
    @State private var showEditProfile = false
    /// The wordmark bar's gear used to be inert on this screen (TopBar's
    /// onSettings defaults to a no-op); on Profile it opens the settings hub.
    @State private var showSettings = false
    @State private var bio = "Dedicated to the details. Constantly working to build a repeatable, efficient shot with elite consistency."
    @State private var enhancingBio = false
    @State private var bioError: String?
    @State private var toast: ShotIQToast?
    @State private var productionProfile: APIProfileDTO?
    @State private var productionBadges: BadgesResponseDTO?
    @State private var loadedProductionContext = false

    private struct ProfileSummary {
        var streak: String
        var points: String
        var shots: String
        var makes: String
        var makeRate: String
        var completionPct: Double
        var completionText: String
        var activity: [(String, String)]
    }

    private var workouts: [TrainingWorkoutRecord] {
        TrainingWorkoutStore.decode(completedWorkoutsPayload).sorted { $0.completedAt > $1.completedAt }
    }

    private var isCanonicalProfileDemo: Bool {
        UITestHooks.demoData && workouts.isEmpty && productionBadges == nil
    }

    private var displayName: String {
        if let profileName = productionProfile?.displayName, !profileName.isEmpty { return profileName }
        if let userName = app.user?.displayName, !userName.isEmpty { return userName }
        let full = [productionProfile?.firstName ?? app.user?.firstName,
                    productionProfile?.lastName ?? app.user?.lastName]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        if !full.isEmpty { return full }
        return isCanonicalProfileDemo ? "Jordan Ellis" : (app.user?.email?.split(separator: "@").first.map(String.init) ?? "ShotIQ Athlete")
    }

    private var profileInitialsText: String {
        let parts = displayName.split(separator: " ")
        if parts.count >= 2 {
            return parts.prefix(2).compactMap(\.first).map(String.init).joined().uppercased()
        }
        return String(displayName.prefix(2)).uppercased()
    }

    private var subtitleText: String {
        let profileHand = productionProfile?.dominantHand ?? hand
        let profileLevel = productionProfile?.experienceLevel ?? level
        return "\(Self.titleCase(profileHand))-handed • \(Self.titleCase(profileLevel))"
    }

    private var profileSummary: ProfileSummary {
        if isCanonicalProfileDemo {
            return ProfileSummary(streak: "6",
                                  points: "2,840",
                                  shots: "24",
                                  makes: "15",
                                  makeRate: "62.5%",
                                  completionPct: 0.82,
                                  completionText: "82%",
                                  activity: [("Quick Release Builder", "Today at 8:24 AM"),
                                             ("Catch & Shoot Review", "May 11, 2024"),
                                             ("Mid-Range Mechanics", "May 10, 2024")])
        }

        let totalShots = workouts.reduce(0) { $0 + $1.shots }
        let totalMakes = workouts.reduce(0) { $0 + $1.makes }
        let localPoints = workouts.reduce(0) { $0 + $1.pointsEarned }
        let makeRate = totalShots == 0 ? "--" : String(format: "%.1f%%", Double(totalMakes) / Double(totalShots) * 100)
        let activityRows = workouts.prefix(3).map { ($0.drillName, Self.activityDateText($0.completedAt)) }
        let completedSections = [displayName.isEmpty == false,
                                 heightIn > 0 && weightLbs > 0 && wingspanIn > 0,
                                 hand.isEmpty == false && level.isEmpty == false,
                                 bio.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false]
            .filter { $0 }.count
        let completionPct = Double(completedSections) / 4.0
        let stats = productionBadges?.stats
        return ProfileSummary(streak: Self.numberOrDash(stats?.currentStreak) ?? (workouts.isEmpty ? "--" : "\(Self.localStreakDays(from: workouts))"),
                              points: Self.groupedNumber(stats?.totalPoints) ?? (workouts.isEmpty ? "--" : Self.groupedNumber(localPoints) ?? "\(localPoints)"),
                              shots: totalShots == 0 ? "--" : "\(totalShots)",
                              makes: totalShots == 0 ? "--" : "\(totalMakes)",
                              makeRate: makeRate,
                              completionPct: completionPct,
                              completionText: "\(Int((completionPct * 100).rounded()))%",
                              activity: activityRows.isEmpty ? [("No tracked sessions yet", "Track shots to build history")] : activityRows)
    }

    private var heightText: String { Self.inchesText(heightIn) }
    private var weightText: String { "\(weightLbs) lbs" }
    private var wingspanText: String { Self.inchesText(wingspanIn) }

    /// POST /api/enhance-bio — LLM-expanded bio (shape per src/app/api/enhance-bio/route.ts).
    private func enhanceBio() {
        guard !enhancingBio else { return }
        enhancingBio = true
        bioError = nil
        toast = .progress("Enhancing bio", "ShotIQ is rewriting your profile bio.", progress: 0.55)
        Task {
            struct Body: Encodable { var bio: String }
            struct Resp: Codable { var success: Bool; var enhancedBio: String? }
            do {
                let r: Resp = try await APIClient.shared.call("/api/enhance-bio", method: "POST",
                                                              body: Body(bio: bio))
                if let enhanced = r.enhancedBio, !enhanced.isEmpty { bio = enhanced }
                toast = .success("Bio enhanced", "Your profile copy was updated.")
            } catch {
                bioError = "Couldn't enhance the bio right now."
                toast = .error("Bio enhancement failed", "Try again when the connection is steady.")
            }
            enhancingBio = false
        }
    }

    private func loadProductionContext() async {
        guard !loadedProductionContext, !UITestHooks.demoData else { return }
        loadedProductionContext = true
        async let profile = try? APIClient.shared.profile()
        async let badges = try? APIClient.shared.badges()
        productionProfile = await profile ?? nil
        productionBadges = await badges ?? nil
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-profile") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar(onSettings: { showSettings = true })
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: 16) {
                            ZStack(alignment: .bottomTrailing) {
                                Circle().fill(ShotIQColor.rule).frame(width: 86, height: 86)
                                    .overlay(Text(profileInitialsText)
                                        .shotiqBody(26, weight: .bold)
                                        .foregroundStyle(ShotIQColor.graphite))
                                Button { showEditProfile = true } label: {
                                    Circle().fill(ShotIQColor.paper).frame(width: 28, height: 28)
                                        .overlay(Circle().stroke(ShotIQColor.rule))
                                        .overlay(Image(systemName: "pencil").font(.system(size: 12))
                                            .foregroundStyle(ShotIQColor.ink))
                                }
                                .accessibilityLabel("Edit profile")
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text(displayName.uppercased()).shotiqDisplay(32)
                                    .accessibilityIdentifier("profile-display-name")
                                Text(subtitleText).shotiqBody(14)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .accessibilityIdentifier("profile-subtitle")
                            }
                        }
                        .padding(.top, 18)
                        HStack(spacing: 0) {
                            NavigationLink { WorkoutCalendarView() } label: {
                                HeaderStat(icon: "film", value: profileSummary.streak, label: "DAY STREAK").frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.plain)
                            .accessibilityIdentifier("profile-day-streak")
                            VRule(height: 46)
                            NavigationLink { PlayerCardView() } label: {
                                HeaderStat(icon: "circle.hexagongrid", value: profileSummary.points, label: "POINTS")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.plain)
                            .accessibilityIdentifier("profile-points")
                            VRule(height: 46)
                            profileStat(profileSummary.shots, "SHOTS")
                                .accessibilityIdentifier("profile-total-shots")
                            VRule(height: 46)
                            profileStat(profileSummary.makes, "MAKES")
                                .accessibilityIdentifier("profile-total-makes")
                            VRule(height: 46)
                            profileStat(profileSummary.makeRate, "MAKE %")
                                .accessibilityIdentifier("profile-make-rate")
                        }
                        .padding(.vertical, 16)
                        PrimaryButton(title: "Edit player profile", icon: "camera.viewfinder") {
                            showEditProfile = true
                        }
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                SectionLabel(text: "PHYSICAL PROFILE")
                                HStack(spacing: 0) {
                                    physCol("ruler", heightText, "HEIGHT")
                                        .accessibilityIdentifier("profile-height")
                                    VRule(height: 48)
                                    physCol("scalemass", weightText, "WEIGHT")
                                        .accessibilityIdentifier("profile-weight")
                                    VRule(height: 48)
                                    physCol("figure.arms.open", wingspanText, "WINGSPAN")
                                        .accessibilityIdentifier("profile-wingspan")
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                SectionLabel(text: "SHOOTING PROFILE")
                                HStack(spacing: 0) {
                                    physCol("figure.basketball", "8'11\"", "RELEASE HEIGHT")
                                    VRule(height: 48)
                                    physCol("gauge", "58°", "RELEASE ANGLE")
                                    VRule(height: 48)
                                    physCol("point.3.connected.trianglepath.dotted", "0°", "SHOT SHAPE • SLIGHT RIGHT")
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 12)
                        // The whole card opens the player card: the section header
                        // and the "View player card" line used to be separate
                        // elements, and only the inner line was tappable.
                        NavigationLink { PlayerCardView() } label: {
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    SectionLabel(text: "PLAYER CARD")
                                    HStack(spacing: 14) {
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 8).fill(ShotIQColor.ink)
                                                .frame(width: 140, height: 94)
                                            VStack(spacing: 5) {
                                                HStack(spacing: 0) {
                                                    Text("SHOT").shotiqCondensed(9, weight: .black)
                                                        .foregroundStyle(.white)
                                                    Text("IQ").shotiqCondensed(9, weight: .black)
                                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                                }
                                                Text(shotiqInitials(app.user))
                                                    .shotiqCondensed(28, weight: .heavy)
                                                    .foregroundStyle(.white)
                                                Text((app.user?.displayName ?? "Jordan Ellis").uppercased())
                                                    .shotiqBody(8, weight: .semibold).kerning(1)
                                                    .foregroundStyle(.white)
                                                    .lineLimit(1).minimumScaleFactor(0.7)
                                            }
                                        }
                                        VStack(alignment: .leading, spacing: 8) {
                                            Text("Share your profile and latest highlights.")
                                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                                .fixedSize(horizontal: false, vertical: true)
                                            HStack(spacing: 5) {
                                                Text("View player card").shotiqBody(14, weight: .semibold)
                                                Image(systemName: "chevron.right").font(.system(size: 11))
                                            }
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        }
                                    }
                                }
                                .padding(14)
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("Player card")
                        .accessibilityIdentifier("Player card")
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    SectionLabel(text: "ABOUT \((app.user?.firstName ?? "Jordan").uppercased())")
                                    Spacer()
                                    Button { enhanceBio() } label: {
                                        HStack(spacing: 5) {
                                            if enhancingBio {
                                                ProgressView().controlSize(.mini)
                                            } else {
                                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "sparkles"), size: 32).font(.system(size: 12))
                                            }
                                            Text(enhancingBio ? "Enhancing…" : "Enhance bio")
                                                .shotiqBody(13, weight: .medium)
                                        }
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    }
                                    .disabled(enhancingBio)
                                }
                                Text(bio)
                                    .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                                if let bioError {
                                    Text(bioError).shotiqBody(11)
                                        .foregroundStyle(ShotIQColor.reviewRed)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    SectionLabel(text: "PROFILE COMPLETION")
                                    Spacer()
                                    Text(profileSummary.completionText).font(.custom("Tungsten-Medium", size: 24))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .accessibilityIdentifier("profile-completion-pct")
                                }
                                ScoreBar(pct: profileSummary.completionPct)
                                HStack(spacing: 0) {
                                    completionItem(true, "Profile info")
                                    completionItem(true, "Physical profile")
                                    completionItem(true, "Shooting profile")
                                    completionItem(bio.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false, "Bio")
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 12)
                        HStack(alignment: .top, spacing: 12) {
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    SectionLabel(text: "ACCOUNT INFO")
                                    accountRow("calendar", "Member since", "May 12, 2024")
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                    accountRow("arrow.right.circle", "Last login", "Today at 8:24 AM")
                                }
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 8) {
                                    SectionLabel(text: "RECENT ACTIVITY")
                                    ForEach(Array(profileSummary.activity.enumerated()), id: \.offset) { index, item in
                                        activityRow(item.0, item.1)
                                            .accessibilityIdentifier("profile-activity-\(index)")
                                    }
                                }
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                        .padding(.top, 12)
                        SectionLabel(text: "MORE").padding(.top, 20)
                        VStack(spacing: 0) {
                            row("person.crop.square", "Player card") { PlayerCardView() }
                            row("photo.stack", "My media") { MyMediaView() }
                            row("target", "Goals") { GoalsView() }
                            row("gearshape", "Settings") { SettingsHubView() }
                            row("square.and.arrow.up", "Share results") { ShareResultsView() }
                        }
                        .padding(.top, 4)
                        Button { app.signOut() } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "rectangle.portrait.and.arrow.right").frame(width: 26)
                                Text("Sign out").shotiqBody(15, weight: .medium)
                            }
                            .foregroundStyle(ShotIQColor.reviewRed)
                            .padding(.vertical, 16)
                        }
                        Spacer(minLength: 20)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .sheet(isPresented: $showEditProfile) { EditProfileSheet().modifier(CanonicalTypeScale()) }
        .navigationDestination(isPresented: $showSettings) { SettingsHubView() }
        .task { await loadProductionContext() }
        .shotiqToast($toast)
    }

    private static func titleCase(_ raw: String) -> String {
        raw.replacingOccurrences(of: "_", with: " ")
            .replacingOccurrences(of: "-", with: " ")
            .capitalized
    }

    private static func inchesText(_ inches: Int) -> String {
        "\(inches / 12)'\(inches % 12)\""
    }

    private static func groupedNumber(_ value: Int?) -> String? {
        guard let value else { return nil }
        return NumberFormatter.localizedString(from: NSNumber(value: value), number: .decimal)
    }

    private static func numberOrDash(_ value: Int?) -> String? {
        guard let value else { return nil }
        return "\(value)"
    }

    private static func localStreakDays(from workouts: [TrainingWorkoutRecord]) -> Int {
        let calendar = Calendar.current
        let activeDays = Set(workouts.map { calendar.startOfDay(for: $0.completedAt) })
        var streak = 0
        var cursor = calendar.startOfDay(for: Date())
        while activeDays.contains(cursor) {
            streak += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = previous
        }
        return max(streak, activeDays.isEmpty ? 0 : 1)
    }

    private static func activityDateText(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = Calendar.current.isDateInToday(date) ? "'Today at' h:mm a" : "MMM d 'at' h:mm a"
        return formatter.string(from: date)
    }

    private func profileStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 3) {
            Text(value).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(9, weight: .medium).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func physCol(_ icon: String, _ value: String, _ label: String) -> some View {
        VStack(spacing: 5) {
            // One measurement diagram per measured quantity. Body measurements
            // are tried first: HEIGHT is an instrument, RELEASE HEIGHT is a shot
            // mechanic, and routing both through `MechanicKind` gave them one
            // mark while WEIGHT and WINGSPAN matched nothing and shared another.
            Group {
                if let body = BodyMetricKind(measurementLabel: label) {
                    BodyMetricGlyph(kind: body, size: 19)
                } else {
                    MechanicGlyph(kind: .init(metricLabel: label), size: 19)
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            Text(value).font(.custom("Tungsten-Medium", size: 22)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(7.5, weight: .medium).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.center)
                .lineLimit(2).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }
    private func completionItem(_ done: Bool, _ label: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: done ? "checkmark.circle" : "circle.dotted")
                .font(.system(size: 12))
                .foregroundStyle(done ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
            Text(label).shotiqBody(9).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    private func accountRow(_ icon: String, _ label: String, _ value: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(ShotIQColor.ink)
            VStack(alignment: .leading, spacing: 1) {
                Text(label).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                Text(value).shotiqBody(12, weight: .semibold)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
        }
    }
    private func activityRow(_ title: String, _ date: String) -> some View {
        NavigationLink { MyMediaView() } label: {
            HStack(spacing: 8) {
                Image(systemName: "play.rectangle").font(.system(size: 13))
                    .foregroundStyle(ShotIQColor.ink)
                VStack(alignment: .leading, spacing: 1) {
                    Text(title).shotiqBody(11, weight: .semibold)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.6)
                    Text(date).shotiqBody(9).foregroundStyle(ShotIQColor.graphite)
                }
                Spacer(minLength: 2)
                Image(systemName: "chevron.right").font(.system(size: 10))
                    .foregroundStyle(ShotIQColor.graphite)
            }
        }
    }
    /// MORE list row. The destination is built lazily and keeps its concrete
    /// type — the previous `AnyView(...)` argument was constructed eagerly on
    /// every body pass and erased the destination's identity, so a pushed screen
    /// could be torn down again the moment ProfileView re-rendered.
    private func row<D: View>(_ icon: String, _ t: String,
                              @ViewBuilder _ dest: @escaping () -> D) -> some View {
        NavigationLink { dest() } label: {
            HStack(spacing: 14) {
                Image(systemName: icon).frame(width: 28)
                Text(t).shotiqBody(16)
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
            }
            .padding(.vertical, 14).foregroundStyle(ShotIQColor.ink)
            // The row paints no background, so without this only the glyph, the
            // word and the chevron are touchable — the wide gap the Spacer opens
            // between them is a hole. Which of those a tap lands in decides
            // whether the row responds at all.
            .contentShape(Rectangle())
            .overlay(HRule(), alignment: .bottom)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(t)
    }
}

/// Editable player profile sheet — PUTs the measurement/handedness/bio fields
/// the backend accepts on /api/profile (src/app/api/profile/route.ts).
struct EditProfileSheet: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("profileHeightIn") private var heightIn = 75
    @AppStorage("profileWeightLbs") private var weightLbs = 185
    @AppStorage("profileWingspanIn") private var wingspanIn = 77
    @AppStorage("profileHand") private var hand = "right"
    @AppStorage("profileLevel") private var level = "advanced"
    @State private var busy = false
    @State private var errorText: String?
    @State private var toast: ShotIQToast?

    private struct ProfileBody: Encodable {
        var heightInches: Int
        var weightLbs: Int
        var wingspanInches: Int
        var dominantHand: String
        var experienceLevel: String
    }
    private struct ProfileResp: Codable { var success: Bool }

    private func save() {
        guard !busy else { return }
        busy = true
        errorText = nil
        toast = .progress("Saving profile", "Updating your player measurements.", progress: 0.55)
        Task {
            do {
                let _: ProfileResp = try await APIClient.shared.call(
                    "/api/profile", method: "PUT",
                    body: ProfileBody(heightInches: heightIn, weightLbs: weightLbs,
                                      wingspanInches: wingspanIn, dominantHand: hand,
                                      experienceLevel: level))
                toast = .success("Profile saved", "Your player details are up to date.")
                try? await Task.sleep(nanoseconds: 650_000_000)
                dismiss()
            } catch {
                errorText = "Couldn't save your profile. Try again."
                toast = .error("Profile not saved", "Check your connection and try again.")
            }
            busy = false
        }
    }
    private func inchesLabel(_ v: Int) -> String { "\(v / 12)'\(v % 12)\"" }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("EDIT PLAYER PROFILE").shotiqDisplay(28).padding(.top, 8)
                        .accessibilityIdentifier("profile-edit-title")
                    measureRow("HEIGHT", inchesLabel(heightIn)) { heightIn = max(48, heightIn - 1) } up: { heightIn = min(96, heightIn + 1) }
                    measureRow("WEIGHT", "\(weightLbs) lbs") { weightLbs = max(80, weightLbs - 1) } up: { weightLbs = min(350, weightLbs + 1) }
                    measureRow("WINGSPAN", inchesLabel(wingspanIn)) { wingspanIn = max(48, wingspanIn - 1) } up: { wingspanIn = min(100, wingspanIn + 1) }
                    VStack(alignment: .leading, spacing: 8) {
                        MicroLabel(text: "DOMINANT HAND")
                        HStack(spacing: 6) {
                            choice("Right", "right", $hand)
                            choice("Left", "left", $hand)
                        }
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        MicroLabel(text: "EXPERIENCE LEVEL")
                        // Content-sized inside a horizontal scroller. Sizing to
                        // content is what stops the truncation; the scroller is
                        // what stops that turning into the 020 failure, where
                        // making a child take its intrinsic width pushed the
                        // overflow onto its neighbour and then onto the whole
                        // screen. Three chips fit a 393pt row, so this will not
                        // scroll in practice — it simply cannot clip if a label
                        // or a text size grows.
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                choice("Beginner", "beginner", $level, fill: false)
                                choice("Intermediate", "intermediate", $level, fill: false)
                                choice("Advanced", "advanced", $level, fill: false)
                            }
                        }
                    }
                    if let errorText {
                        Text(errorText).shotiqBody(12).foregroundStyle(ShotIQColor.reviewRed)
                    }
                    PrimaryButton(title: busy ? "Saving…" : "Save profile") { save() }
                        .disabled(busy)
                    Button { dismiss() } label: {
                        Text("Cancel").shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                            .frame(maxWidth: .infinity)
                    }
                    .padding(.bottom, 16)
                }
                .padding(.horizontal, 24)
            }
            .background(ShotIQColor.paper)
        }
        .accessibilityIdentifier("profile-edit-sheet")
        .shotiqToast($toast)
    }
    private func measureRow(_ label: String, _ value: String,
                            down: @escaping () -> Void, up: @escaping () -> Void) -> some View {
        HStack {
            MicroLabel(text: label)
            Spacer()
            Button(action: down) {
                Image(systemName: "minus").font(.system(size: 13, weight: .medium))
                    .frame(width: 34, height: 34).overlay(Circle().stroke(ShotIQColor.rule))
                    .foregroundStyle(ShotIQColor.ink)
            }
            Text(value).font(.custom("Tungsten-Medium", size: 24))
                .frame(width: 84)
            Button(action: up) {
                Image(systemName: "plus").font(.system(size: 13, weight: .medium))
                    .frame(width: 34, height: 34).overlay(Circle().stroke(ShotIQColor.rule))
                    .foregroundStyle(ShotIQColor.ink)
            }
        }
        .padding(.vertical, 4)
        .overlay(HRule(), alignment: .bottom)
    }
    /// `fill: true` splits the row equally — right for two short labels like
    /// Right/Left. `fill: false` sizes the chip to its own label, for rows whose
    /// options are long enough that an equal share truncates them: EXPERIENCE
    /// LEVEL rendered "Interme..." and "Advanc..." because a third of the row
    /// was not enough for "Intermediate", and `minimumScaleFactor` does not
    /// save it — when the text still does not fit at the floor, SwiftUI
    /// truncates rather than shrinking further.
    private func choice(_ label: String, _ value: String, _ sel: Binding<String>,
                        fill: Bool = true) -> some View {
        Button { sel.wrappedValue = value } label: {
            Text(label).shotiqBody(13, weight: sel.wrappedValue == value ? .semibold : .regular)
                .lineLimit(1).minimumScaleFactor(0.7)
                .frame(maxWidth: fill ? .infinity : nil)
                .padding(.horizontal, fill ? 0 : 14)
                .frame(height: 42)
                .overlay(RoundedRectangle(cornerRadius: 6)
                    .stroke(sel.wrappedValue == value ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                .foregroundStyle(sel.wrappedValue == value ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
        }
    }
}

struct SettingsHubView: View {      // 071
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @AppStorage("profileHand") private var hand = "right"
    @AppStorage("profileLevel") private var level = "advanced"
    @AppStorage("notifications") private var notifs = true
    @AppStorage("coachingAudio") private var audio = true
    @AppStorage("units") private var metric = false
    @AppStorage("autoAnalysis") private var autoAnalysis = true
    @AppStorage("dataBackup") private var dataBackup = true
    @AppStorage("anonAnalytics") private var anonAnalytics = true
    @AppStorage("peerComparisons") private var peerComparisons = true
    @State private var showAutomation = false
    @State private var showPrivacy = false
    @State private var showAbout = false
    @State private var toast: ShotIQToast?
    @State private var productionProfile: APIProfileDTO?
    @State private var productionBadges: BadgesResponseDTO?
    @State private var productionHistoryStats: HistoryStats?
    @State private var loadedProductionContext = false

    private struct SettingsSummary {
        var displayName: String
        var initials: String
        var subtitle: String
        var streak: String
        var points: String
        var formScore: String
        var formPct: Double
        var shots: String
        var makes: String
        var makeRate: String
        var trend: String
    }

    private var workouts: [TrainingWorkoutRecord] {
        TrainingWorkoutStore.decode(completedWorkoutsPayload).sorted { $0.completedAt > $1.completedAt }
    }

    private var isCanonicalSettingsDemo: Bool {
        UITestHooks.demoData && workouts.isEmpty && productionBadges == nil && productionHistoryStats == nil
    }

    private var summary: SettingsSummary {
        if isCanonicalSettingsDemo {
            return SettingsSummary(displayName: "Jordan Ellis",
                                   initials: "JE",
                                   subtitle: "Right-handed • Advanced",
                                   streak: "6",
                                   points: "2,840",
                                   formScore: "82",
                                   formPct: 0.82,
                                   shots: "24",
                                   makes: "15",
                                   makeRate: "62.5%",
                                   trend: "+8.1%")
        }

        let display = Self.displayName(user: app.user, profile: productionProfile)
        let totalShots = workouts.reduce(0) { $0 + $1.shots }
        let totalMakes = workouts.reduce(0) { $0 + $1.makes }
        let localPoints = workouts.reduce(0) { $0 + $1.pointsEarned }
        let latestScore = workouts.first?.formScore ?? productionHistoryStats?.latestScore.map { Int($0.rounded()) }
        let previousScore = workouts.dropFirst().first?.formScore
        let trend = previousScore.flatMap { previous in
            latestScore.map { latest in "\(latest - previous >= 0 ? "+" : "")\(latest - previous)" }
        } ?? Self.percentTrend(productionHistoryStats?.improvementRate)
        let profileHand = productionProfile?.dominantHand ?? hand
        let profileLevel = productionProfile?.experienceLevel ?? level
        return SettingsSummary(displayName: display,
                               initials: Self.initials(for: display),
                               subtitle: "\(Self.titleCase(profileHand))-handed • \(Self.titleCase(profileLevel))",
                               streak: Self.numberOrDash(productionBadges?.stats?.currentStreak) ?? (workouts.isEmpty ? "--" : "\(Self.localStreakDays(from: workouts))"),
                               points: Self.groupedNumber(productionBadges?.stats?.totalPoints) ?? (workouts.isEmpty ? "--" : Self.groupedNumber(localPoints) ?? "\(localPoints)"),
                               formScore: latestScore.map { "\($0)" } ?? "--",
                               formPct: Double(latestScore ?? 0) / 100.0,
                               shots: totalShots == 0 ? "--" : "\(totalShots)",
                               makes: totalShots == 0 ? "--" : "\(totalMakes)",
                               makeRate: totalShots == 0 ? "--" : String(format: "%.1f%%", Double(totalMakes) / Double(totalShots) * 100),
                               trend: trend ?? "--")
    }

    // PUT /api/settings — sections are merged over server defaults
    // (src/app/api/settings/route.ts); extra keys are stored harmlessly.
    private struct SettingsPutBody: Encodable {
        struct Notifications: Encodable {
            var reminderPush: Bool
            var coachingTipsPush: Bool
            var motivationalMessagesPush: Bool
        }
        struct Privacy: Encodable {
            var allowAnonymousAnalytics: Bool
            var includeInPeerComparisons: Bool
            var metricUnits: Bool
        }
        struct Automation: Encodable {
            var analyticsRefreshEnabled: Bool
            var dataBackupEnabled: Bool
        }
        var notifications: Notifications
        var privacy: Privacy
        var automation: Automation
    }
    /// Persist every toggle server-side (fire-and-forget; @AppStorage keeps
    /// the local copy so the UI never blocks).
    private func persistSettings() {
        let body = SettingsPutBody(
            notifications: .init(reminderPush: notifs, coachingTipsPush: audio,
                                 motivationalMessagesPush: audio),
            privacy: .init(allowAnonymousAnalytics: anonAnalytics,
                           includeInPeerComparisons: peerComparisons,
                           metricUnits: metric),
            automation: .init(analyticsRefreshEnabled: autoAnalysis,
                              dataBackupEnabled: dataBackup))
        Task { await APIClient.shared.send("/api/settings", method: "PUT", body: body) }
    }

    private func saveSettingsChange(_ label: String) {
        persistSettings()
        toast = .success("Settings saved", "\(label) updated.")
    }

    private func openAfterFeedback(_ feedback: ShotIQToast, action: @escaping @MainActor () -> Void) {
        toast = feedback
        guard !UITestHooks.active else { return }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 450_000_000)
            action()
        }
    }

    private func loadProductionContext() async {
        guard !loadedProductionContext, !UITestHooks.demoData else { return }
        loadedProductionContext = true
        async let profile = try? APIClient.shared.profile()
        async let badges = try? APIClient.shared.badges()
        async let history = try? APIClient.shared.history(limit: 10)
        productionProfile = await profile ?? nil
        productionBadges = await badges ?? nil
        let historyResult = await history
        productionHistoryStats = historyResult?.stats
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-settings-hub") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("SETTINGS").shotiqDisplay(40)
                                Text("Manage your account, preferences, and app experience.")
                                    .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer(minLength: 8)
                            HeaderStat(icon: "film", value: summary.streak, label: "DAY STREAK")
                                .accessibilityElement(children: .ignore)
                                .accessibilityLabel("\(summary.streak) DAY STREAK")
                                .accessibilityIdentifier("settings-day-streak")
                            VRule(height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: summary.points, label: "POINTS")
                                .accessibilityElement(children: .ignore)
                                .accessibilityLabel("\(summary.points) POINTS")
                                .accessibilityIdentifier("settings-points")
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                HStack(spacing: 14) {
                                    Circle().fill(ShotIQColor.rule).frame(width: 62, height: 62)
                                        .overlay(Text(summary.initials)
                                            .shotiqBody(19, weight: .bold)
                                            .foregroundStyle(ShotIQColor.graphite))
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(summary.displayName.uppercased())
                                            .shotiqDisplay(26)
                                            .accessibilityIdentifier("settings-display-name")
                                        Text(summary.subtitle).shotiqBody(13)
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .accessibilityIdentifier("settings-subtitle")
                                    }
                                    Spacer()
                                }
                                .padding(14)
                                HRule()
                                HStack(spacing: 0) {
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("FORM SCORE").shotiqBody(8, weight: .semibold).kerning(0.4)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text(summary.formScore).font(.custom("Tungsten-Medium", size: 28))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                            .accessibilityIdentifier("settings-form-score")
                                        ScoreBar(pct: summary.formPct).frame(width: 58)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    settingsStat(summary.shots, "SHOTS")
                                        .accessibilityElement(children: .ignore)
                                        .accessibilityLabel("\(summary.shots) SHOTS")
                                        .accessibilityIdentifier("settings-total-shots")
                                    settingsStat(summary.makes, "MAKES")
                                        .accessibilityElement(children: .ignore)
                                        .accessibilityLabel("\(summary.makes) MAKES")
                                        .accessibilityIdentifier("settings-total-makes")
                                    settingsStat(summary.makeRate, "MAKE %")
                                        .accessibilityElement(children: .ignore)
                                        .accessibilityLabel("\(summary.makeRate) MAKE %")
                                        .accessibilityIdentifier("settings-make-rate")
                                    VStack(spacing: 3) {
                                        Text(summary.trend).shotiqBody(12, weight: .bold)
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                            .accessibilityIdentifier("settings-trend")
                                        Text("VS LAST SESSION").shotiqBody(6.5, weight: .medium)
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(1).minimumScaleFactor(0.6)
                                    }
                                    .frame(maxWidth: .infinity)
                                }
                                .padding(14)
                                HRule()
                                NavigationLink {
                                    EditProfileSheet().modifier(CanonicalTypeScale())
                                } label: {
                                    HStack(spacing: 12) {
                                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "person.crop.square"), size: 32)
                                            .font(.system(size: 16)).foregroundStyle(ShotIQColor.ink)
                                        Text("Edit profile").shotiqBody(15, weight: .semibold)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Spacer()
                                        Image(systemName: "chevron.right").font(.system(size: 13))
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    .padding(14)
                                }
                                .accessibilityIdentifier("settings-edit-profile-link")
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.top, 16)
                        SectionLabel(text: "PREFERENCES").padding(.top, 20)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                settingsToggle("notifications", "Workout notifications", "Manage alerts, reminders, and updates.", $notifs)
                                    .onChange(of: notifs) { _, on in
                                        if on { UNUserNotificationCenter.current()
                                            .requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in } }
                                        saveSettingsChange("Workout notifications")
                                    }
                                HRule().padding(.leading, 14)
                                settingsToggle("coaching-audio", "Coaching audio cues", "Voice cues while you train.", $audio)
                                    .onChange(of: audio) { _, _ in saveSettingsChange("Coaching audio cues") }
                                HRule().padding(.leading, 14)
                                settingsToggle("metric-units", "Metric units", "Use metric units across the app.", $metric)
                                    .onChange(of: metric) { _, _ in saveSettingsChange("Metric units") }
                            }
                        }
                        .padding(.top, 8)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                settingsRow("notifications", "bell", "Notifications", "Manage alerts, reminders, and updates.",
                                            status: notifs ? "3 ON" : "OFF", statusColor: ShotIQColor.analysisBlue) {
                                    openAfterFeedback(.info("Opening Settings", "Update notification permissions in iOS Settings.")) {
                                        CameraService.openSystemSettings()
                                    }
                                }
                                HRule().padding(.leading, 14)
                                settingsRow("automation", "arrow.triangle.2.circlepath", "Automation",
                                            "Auto-analysis, uploads, and data handling.",
                                            status: "\([autoAnalysis, dataBackup].filter { $0 }.count) ACTIVE",
                                            statusColor: ShotIQColor.confirmGreen) {
                                    withAnimation { showAutomation.toggle() }
                                }
                                if showAutomation {
                                    settingsToggle("auto-analysis", "Auto-analysis refresh", "Recompute analytics overnight.", $autoAnalysis)
                                        .onChange(of: autoAnalysis) { _, _ in saveSettingsChange("Auto-analysis refresh") }
                                        .padding(.leading, 26)
                                    settingsToggle("data-backup", "Data backup", "Back up sessions to the server.", $dataBackup)
                                        .onChange(of: dataBackup) { _, _ in saveSettingsChange("Data backup") }
                                        .padding(.leading, 26)
                                }
                                HRule().padding(.leading, 14)
                                settingsRow("data-privacy", "lock.shield", "Data and privacy",
                                            "Control your data, export, and permissions.",
                                            status: nil, statusColor: nil) {
                                    withAnimation { showPrivacy.toggle() }
                                }
                                if showPrivacy {
                                    settingsToggle("anonymous-analytics", "Anonymous analytics", "Share anonymized usage data.", $anonAnalytics)
                                        .onChange(of: anonAnalytics) { _, _ in saveSettingsChange("Anonymous analytics") }
                                        .padding(.leading, 26)
                                    settingsToggle("peer-comparisons", "Peer comparisons", "Include my stats in peer comparisons.", $peerComparisons)
                                        .onChange(of: peerComparisons) { _, _ in saveSettingsChange("Peer comparisons") }
                                        .padding(.leading, 26)
                                }
                                HRule().padding(.leading, 14)
                                settingsRow("help-support", "questionmark.circle", "Help and support",
                                            "FAQs, guides, and contact options.",
                                            status: nil, statusColor: nil) {
                                    if let url = URL(string: "mailto:support@shotiq.app?subject=ShotIQ%20Support") {
                                        openAfterFeedback(.info("Opening Support", "Preparing an email to ShotIQ support.")) {
                                            UIApplication.shared.open(url)
                                        }
                                    }
                                }
                                HRule().padding(.leading, 14)
                                settingsRow("about-shotiq", "info.circle", "About ShotIQ",
                                            "Version 1.0.0, terms, and app information.",
                                            status: nil, statusColor: nil) {
                                    toast = .info("About ShotIQ", "Version details opened.")
                                    showAbout = true
                                }
                            }
                        }
                        .padding(.top, 14)
                        .alert("ShotIQ 1.0.0", isPresented: $showAbout) {
                            Button("OK", role: .cancel) {}
                        } message: {
                            Text("AI-powered basketball shooting analysis.\n© 2025 ShotIQ · shotiq.com\nTerms and privacy policy available on the web.")
                        }
                        ShotIQCard {
                            Button { app.signOut() } label: {
                                HStack(spacing: 12) {
                                    Image(systemName: "rectangle.portrait.and.arrow.right")
                                        .font(.system(size: 15)).frame(width: 26)
                                    Text("Sign out").shotiqBody(15, weight: .semibold)
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                                .padding(14)
                            }
                        }
                        .padding(.top, 14)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .task { await loadProductionContext() }
        .shotiqToast($toast)
    }
    private static func displayName(user: APIUser?, profile: APIProfileDTO?) -> String {
        if let profileName = profile?.displayName, !profileName.isEmpty { return profileName }
        if let userName = user?.displayName, !userName.isEmpty { return userName }
        let full = [profile?.firstName ?? user?.firstName,
                    profile?.lastName ?? user?.lastName]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        if !full.isEmpty { return full }
        return user?.email?.split(separator: "@").first.map(String.init) ?? "ShotIQ Athlete"
    }
    private static func initials(for name: String) -> String {
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return parts.prefix(2).compactMap(\.first).map(String.init).joined().uppercased()
        }
        return String(name.prefix(2)).uppercased()
    }
    private static func titleCase(_ raw: String) -> String {
        raw.replacingOccurrences(of: "_", with: " ")
            .replacingOccurrences(of: "-", with: " ")
            .capitalized
    }
    private static func groupedNumber(_ value: Int?) -> String? {
        guard let value else { return nil }
        return NumberFormatter.localizedString(from: NSNumber(value: value), number: .decimal)
    }
    private static func numberOrDash(_ value: Int?) -> String? {
        guard let value else { return nil }
        return "\(value)"
    }
    private static func percentTrend(_ value: Double?) -> String? {
        guard let value else { return nil }
        return String(format: "%+.1f%%", value)
    }
    private static func localStreakDays(from workouts: [TrainingWorkoutRecord]) -> Int {
        let calendar = Calendar.current
        let activeDays = Set(workouts.map { calendar.startOfDay(for: $0.completedAt) })
        var streak = 0
        var cursor = calendar.startOfDay(for: Date())
        while activeDays.contains(cursor) {
            streak += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = previous
        }
        return max(streak, activeDays.isEmpty ? 0 : 1)
    }
    private func settingsStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 3) {
            Text(value).font(.custom("Tungsten-Medium", size: 22)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(7.5, weight: .medium).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func settingsToggle(_ id: String, _ title: String, _ caption: String, _ isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).shotiqBody(15, weight: .semibold)
                Text(caption).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
            }
        }
        .tint(ShotIQColor.shotiqOrange)
        .padding(14)
        .accessibilityIdentifier("settings-toggle-\(id)")
    }
    private func settingsRow(_ id: String, _ icon: String, _ title: String, _ caption: String,
                             status: String?, statusColor: Color?,
                             action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon).font(.system(size: 17))
                    .foregroundStyle(ShotIQColor.ink).frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).shotiqBody(15, weight: .semibold)
                        .foregroundStyle(ShotIQColor.ink)
                    Text(caption).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1).minimumScaleFactor(0.8)
                }
                Spacer(minLength: 4)
                if let status, let statusColor {
                    Text(status).shotiqBody(11, weight: .bold).kerning(0.4)
                        .foregroundStyle(statusColor)
                }
                Image(systemName: "chevron.right").font(.system(size: 13))
                    .foregroundStyle(ShotIQColor.graphite)
            }
            .padding(14)
        }
        .accessibilityIdentifier("settings-row-\(id)")
    }
}

/// Compact share card rasterised for the image share options.
///
/// This is a standalone view taking a plain `String`, deliberately mirroring
/// `PlayerCardExportView`: `ImageRenderer` hosts its content in a detached view
/// graph, so the thing it renders must not close over the screen that owns it.
/// The previous shape — a `snapshotCard` computed property on `ShareResultsView`
/// itself — handed the renderer a view value that captured the screen's own
/// `@State` and `@EnvironmentObject` boxes.
private struct ShareCardExportView: View {
    let name: String
    let presentation: AnalysisResultPresentation
    let statLine: String
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 0) {
                Text("SHOT").shotiqCondensed(16, weight: .black)
                Text("IQ").shotiqCondensed(16, weight: .black)
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                Spacer()
                Text("SHOTIQ.COM").shotiqBody(9, weight: .semibold)
                    .foregroundStyle(ShotIQColor.graphite)
            }
            Text(name.uppercased())
                .shotiqCondensed(24, weight: .heavy)
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(presentation.scoreText).font(.custom("Tungsten-Medium", size: 54))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                VStack(alignment: .leading, spacing: 2) {
                    Text("FORM SCORE · \(presentation.scoreVerdict)").shotiqBody(11, weight: .bold)
                        .foregroundStyle(ShotIQColor.analysisBlue)
                    Text(statLine)
                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                }
            }
            Text("Primary target: \(presentation.coachingTarget.lowercased())")
                .shotiqBody(12, weight: .semibold)
        }
        .padding(20)
        .frame(width: 360, alignment: .leading)
        .background(.white)
        .overlay(Rectangle().stroke(ShotIQColor.rule))
    }
}

enum ShareResultsImageRenderer {
    @MainActor
    static func render(name: String,
                       presentation: AnalysisResultPresentation = .canonicalDemo,
                       statLine: String = "24 shots · 15 makes · 62.5% · +8.1% vs last session") -> UIImage? {
        let renderer = ImageRenderer(content: ShareCardExportView(name: name,
                                                                  presentation: presentation,
                                                                  statLine: statLine))
        renderer.scale = 3
        return renderer.uiImage
    }
}

struct ShareResultsView: View {     // 072
    @EnvironmentObject var app: AppState
    @State private var renderedCard: UIImage?
    @State private var copied = false
    @State private var toast: ShotIQToast?

    private var presentation: AnalysisResultPresentation {
        if let latest = app.recentMedia.first?.analysis {
            return AnalysisResultPresentation(result: latest)
        }
        return UITestHooks.active ? .canonicalDemo : .noResult
    }

    private var playerName: String { app.user?.displayName ?? "Jordan Ellis" }

    private var isCanonicalShareDemo: Bool { presentation.id == "canonical-demo" }

    private var shareStatLine: String {
        let p = presentation
        if isCanonicalShareDemo {
            return "24 shots · 15 makes · 62.5% · +8.1% vs last session"
        }
        return "\(p.mediaLabel) · \(p.recordedLabel) · \(p.provenanceSummary)"
    }

    private var shareText: String {
        let p = presentation
        if isCanonicalShareDemo {
            return "My ShotIQ form score: 82 (GOOD) — 62.5% make rate, trending +8.1%."
        }
        return "\(p.formScoreShareText) \(p.coachingTarget)"
    }

    /// Rasterises the share card once, on demand. Nothing on this screen runs it
    /// on appear any more: a full synchronous `ImageRenderer` pass at scale 3 was
    /// the one thing this destination did that no other pushed screen does, and
    /// nothing here displays the bitmap until the reader asks to share it.
    @MainActor private func renderCard() {
        guard renderedCard == nil else { return }
        renderedCard = ShareResultsImageRenderer.render(name: playerName,
                                                        presentation: presentation,
                                                        statLine: shareStatLine)
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-share-results") {
            ScrollView {
                VStack(spacing: 0) {
                    Text("SHARE RESULTS").shotiqDisplay(34).padding(.top, 24)
                    Text("Preview what others will see. Private data is excluded.")
                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 14) {
                            HStack {
                                Wordmark(size: 24)
                                Spacer()
                                shareStat("film", "6", "DAY STREAK")
                                VRule(height: 26)
                                shareStat("circle.hexagongrid", "2,840", "POINTS")
                            }
                            HRule()
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(playerName.uppercased())
                                        .shotiqDisplay(30)
                                    Text("Right-handed • Advanced").shotiqBody(13)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer(minLength: 8)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("FORM SCORE").shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(presentation.scoreText).font(.custom("Tungsten-Medium", size: 44))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .accessibilityIdentifier("share-results-score")
                                    ScoreBar(pct: presentation.scorePct).frame(width: 88)
                                }
                            }
                            HRule()
                            HStack(alignment: .center) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("PRIMARY COACHING TARGET")
                                        .shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(presentation.coachingTarget).shotiqBody(15, weight: .bold)
                                        .lineLimit(2).minimumScaleFactor(0.8)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .accessibilityIdentifier("share-results-target")
                                }
                                Spacer(minLength: 8)
                                VStack(alignment: .trailing, spacing: 5) {
                                    Text("ACTIVE GOAL").shotiqBody(9, weight: .bold).kerning(0.4)
                                        .padding(.horizontal, 7).padding(.vertical, 3)
                                        .overlay(RoundedRectangle(cornerRadius: 4).stroke(ShotIQColor.confirmGreen))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    HStack(spacing: 6) {
                                        Text("72%").shotiqBody(12, weight: .bold)
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                        ScoreBar(pct: 0.72, color: ShotIQColor.confirmGreen).frame(width: 54)
                                    }
                                }
                            }
                            HStack(alignment: .top, spacing: 12) {
                                // The share card's frame. PhotoThumb with no photo
                                // key draws the warm-canvas plate with a glyph in
                                // it, which is what readers saw here: the 072
                                // sidecar declares no photo, so nothing was ever
                                // passed. Canonical prints 510x578 at x 41…551,
                                // y 592…1170 — 210pt tall in this column, and it
                                // carries no baked chrome, only the pose skeleton.
                                PhotoThumb(height: 210, photo: "072-visual-001")
                                    .frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 9) {
                                    Text("MECHANICS HIGHLIGHTS")
                                        .shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    if isCanonicalShareDemo {
                                        highlight("figure.arms.open", "ELBOW STACK")
                                        highlight("gauge", "52° RELEASE ANGLE")
                                        highlight("hand.raised", "WRIST SNAP")
                                        highlight("figure.stand", "FOLLOW-THROUGH")
                                    } else {
                                        highlight("figure.arms.open", "MEDIA \(presentation.mediaLabel.uppercased())")
                                        highlight("gauge", "\(presentation.phaseText.uppercased()) PHASE")
                                        highlight("hand.raised", "WRIST \(presentation.wristAngleText)")
                                        highlight("figure.stand", "ELBOW \(presentation.elbowAngleText)")
                                    }
                                }
                                .frame(width: 124, alignment: .leading)
                            }
                            PhaseStrip()
                            HRule()
                            HStack(spacing: 0) {
                                shareBottomStat(isCanonicalShareDemo ? "24" : presentation.mediaLabel.uppercased(),
                                                isCanonicalShareDemo ? "SHOTS" : "MEDIA",
                                                ShotIQColor.ink)
                                VRule(height: 34)
                                shareBottomStat(isCanonicalShareDemo ? "15" : presentation.phaseText.uppercased(),
                                                isCanonicalShareDemo ? "MAKES" : "PHASE",
                                                ShotIQColor.ink)
                                VRule(height: 34)
                                shareBottomStat(isCanonicalShareDemo ? "62.5%" : presentation.sourceCoverageText,
                                                isCanonicalShareDemo ? "MAKE %" : "SOURCES",
                                                ShotIQColor.ink)
                                VRule(height: 34)
                                VStack(spacing: 2) {
                                    Text(isCanonicalShareDemo ? "+8.1%" : presentation.scoreVerdict).shotiqBody(13, weight: .bold)
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Text(isCanonicalShareDemo ? "VS LAST SESSION" : "RESULT STATE").shotiqBody(6.5, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                }
                                .frame(maxWidth: .infinity)
                            }
                            HRule()
                            HStack {
                                Text(isCanonicalShareDemo ? "ANALYZED TODAY AT 8:24 AM" : presentation.recordedLabel.uppercased())
                                Spacer()
                                Text("SHOTIQ.COM")
                            }
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 18)
                    Text("SHARE PREVIEW").shotiqBody(11, weight: .bold).kerning(0.8)
                        .padding(.top, 20)
                    HStack(spacing: 10) {
                        Text(shareText)
                            .frame(width: 1, height: 1)
                            .clipped()
                            .accessibilityIdentifier("share-results-text")
                        imageShareControl("square.and.arrow.up", "Share image", ShotIQColor.shotiqOrange)
                        imageShareControl("arrow.down.to.line", "Save image", ShotIQColor.ink)
                        Button { copyShareText() } label: {
                            shareOption(copied ? "checkmark" : "square.on.square",
                                        copied ? "Copied" : "Copy", ShotIQColor.ink)
                        }
                        ShareLink(item: shareText) { shareOption("ellipsis", "More", ShotIQColor.ink) }
                    }
                    .padding(.horizontal, 20).padding(.top, 12)
                    if copied {
                        HStack(spacing: 7) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 13, weight: .semibold))
                            Text("Copied")
                                .shotiqBody(12, weight: .bold)
                        }
                        .foregroundStyle(ShotIQColor.confirmGreen)
                        .accessibilityIdentifier("share-results-copy-feedback")
                        .padding(.top, 10)
                    }
                    HStack(spacing: 6) {
                        Image(systemName: "lock").font(.system(size: 11))
                        Text("Private media, session clips, and personal notes are not included.")
                            .shotiqBody(11)
                            .lineLimit(1).minimumScaleFactor(0.8)
                    }
                    .foregroundStyle(ShotIQColor.graphite)
                    .padding(.horizontal, 20)
                    .padding(.top, 14).padding(.bottom, 30)
                }
            }
        }
        .shotiqToast($toast)
    }
    /// "Share image" / "Save image". Both hand the reader the rendered card;
    /// until it exists the control rasterises it and the ShareLink takes over,
    /// which is exactly how PlayerCardView's download control behaves.
    @ViewBuilder
    private func imageShareControl(_ icon: String, _ label: String, _ tint: Color) -> some View {
        if let renderedCard {
            ShareLink(item: Image(uiImage: renderedCard),
                      preview: SharePreview("ShotIQ results", image: Image(uiImage: renderedCard))) {
                shareOption(icon, label, tint)
            }
            .buttonStyle(.plain)
        } else {
            Button { renderCard() } label: { shareOption(icon, label, tint) }
                .buttonStyle(.plain)
        }
    }
    private func shareStat(_ icon: String, _ value: String, _ label: String) -> some View {
        HStack(spacing: 6) {
            ShotIQConceptGlyph(concept: label, fallback: icon, size: 14)
                .foregroundStyle(ShotIQColor.ink)
            VStack(alignment: .leading, spacing: 0) {
                Text(value).font(.custom("Tungsten-Medium", size: 16))
                Text(label).shotiqBody(6.5, weight: .medium).kerning(0.3)
                    .foregroundStyle(ShotIQColor.graphite)
            }
        }
    }
    private func highlight(_ icon: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 6) {
                // 072's mechanics highlights: one diagram per mechanic named,
                // not a generic figure / info-circle / hand triple.
                ShotIQConceptGlyph(concept: label, fallback: icon, size: 14)
                    .foregroundStyle(ShotIQColor.ink)
                Text(label).shotiqBody(9, weight: .semibold).kerning(0.3)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            Text("GOOD").shotiqBody(10, weight: .bold)
                .foregroundStyle(ShotIQColor.analysisBlue)
                .padding(.leading, 18)
        }
    }
    private func shareBottomStat(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.custom("Tungsten-Medium", size: 22)).foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(7.5, weight: .medium).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func shareOption(_ icon: String, _ label: String, _ tint: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 20)).foregroundStyle(tint)
            Text(label).shotiqBody(11, weight: .medium).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity).frame(height: 76)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
    }

    private func copyShareText() {
        UIPasteboard.general.string = shareText
        copied = true
        toast = .success("Copied", "Results summary copied to clipboard.")
        Task {
            try? await Task.sleep(for: .seconds(2))
            await MainActor.run { copied = false }
        }
    }
}
