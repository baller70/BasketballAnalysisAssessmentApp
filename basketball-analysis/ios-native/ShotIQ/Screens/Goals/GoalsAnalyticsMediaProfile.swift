import SwiftUI
import UIKit
import UserNotifications

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

@MainActor
final class GoalsViewModel: ObservableObject {
    @Published var goals: [GoalRecord] = []
    @Published var loading = true
    @Published var loadError: String?

    func load() async {
        loading = true
        loadError = nil
        defer { loading = false }

        if UITestHooks.demoData {
            goals = Self.samples
            return
        }

        struct Resp: Codable { var goals: [GoalRecord]? }
        do {
            let r: Resp = try await APIClient.shared.call("/api/goals")
            goals = r.goals ?? []
        } catch {
            goals = []
            loadError = "Goals could not load. Check your connection and try again."
        }
    }

    private static let samples = [
        GoalRecord(id: "g1", name: "Keep elbow stacked through release", targetValue: 100, currentValue: 68),
        GoalRecord(id: "g2", name: "Raise make % to 65", targetValue: 100, currentValue: 40)
    ]

    var active: [GoalRecord] { goals.filter { $0.completedAt == nil } }
    var completed: [GoalRecord] { goals.filter { $0.completedAt != nil } }
}

struct GoalsView: View {            // 063
    @StateObject private var vm = GoalsViewModel()
    @State private var tab = 0
    @State private var trendMetric = "Form Score"
    @State private var insightsExpanded: Set<String> = []
    var body: some View {
        CanonicalScreen(testID: "screen-ios-goals") {
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
                        }
                        .padding(.top, 16)
                        NavigationLink { CreateGoalView(onCreated: { await vm.load() }) } label: {
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
                        .padding(.top, 16)
                        HStack(spacing: 0) {
                            goalsTab("ACTIVE (\(vm.active.count))", 0)
                            goalsTab("COMPLETED (\(vm.completed.count))", 1)
                        }
                        .padding(.top, 18)
                        let shown = tab == 0 ? vm.active : vm.completed
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
                        ForEach(shown) { g in
                            NavigationLink { GoalDetailView(goal: g, onChanged: { await vm.load() }) } label: {
                                goalCard(g)
                            }
                            .padding(.top, 14)
                        }
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .task { await vm.load() }
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
    }
    private func goalCard(_ g: GoalRecord) -> some View {
        let pct = g.progress
        return ShotIQCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("PRIMARY TARGET").shotiqBody(10, weight: .bold).kerning(0.5)
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .overlay(RoundedRectangle(cornerRadius: 4).stroke(ShotIQColor.shotiqOrange))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Text(g.name).shotiqBody(19, weight: .bold)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
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
                        VStack(alignment: .leading, spacing: 1) {
                            Text("ON TRACK").shotiqBody(11, weight: .bold)
                                .foregroundStyle(ShotIQColor.confirmGreen)
                            Text("Keep it up").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                    }
                    ScoreBar(pct: pct)
                }
                HStack(spacing: 0) {
                    goalStat("SESSIONS", "9", nil, "of 15")
                    VRule(height: 44)
                    goalStat("AVG. FORM SCORE", "82", "+6 pts", "vs goal start")
                    VRule(height: 44)
                    goalStat("MAKE %", "64.1%", "+4.3%", "vs goal start")
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
                        }
                        .buttonStyle(.plain)
                    }
                    // Canonical charts are bounded and labelled: gridlines, tick
                    // labels on both axes, a tinted area fill and an end-point badge.
                    TrendLine(points: trendMetric == "Form Score"
                              ? [58, 59, 55, 62, 60, 57, 64, 66, 70, 68, 74, 72, 75, 79, 76, 80, 82]
                              : [48, 50, 47, 52, 55, 53, 56, 58, 57, 60, 59, 61, 62, 63, 62, 64, 64],
                              stroke: ShotIQColor.shotiqOrange,
                              areaFill: true, gridlines: true,
                              xLabels: ["W1", "W5", "W9", "W13", "W17"],
                              yLabels: ["100", "75", "50", "25"],
                              endBadge: trendMetric == "Form Score" ? "82" : "64",
                              showsNodes: false)
                        .frame(height: 84)
                }
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        SectionLabel(text: "RECENT SESSIONS")
                        Spacer()
                        NavigationLink { AnalyticsCardsView() } label: {
                            Text("View all").shotiqBody(13, weight: .semibold)
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .buttonStyle(.plain)
                    }
                    NavigationLink { AnalyticsDetailedView(metric: "Form Score") } label: {
                        HStack(spacing: 10) {
                            PhotoThumb(width: 62, height: 46, icon: "play.circle", photo: "066-visual-001")
                            VStack(alignment: .leading, spacing: 3) {
                                Text("May 19, 8:24 AM").shotiqBody(14, weight: .bold)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("24 shots · 15 makes · 62.5%")
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.8)
                            }
                            Spacer(minLength: 4)
                            Text("82").font(.custom("Tungsten-Medium", size: 18))
                                .foregroundStyle(ShotIQColor.analysisBlue)
                                .padding(.horizontal, 8).padding(.vertical, 4)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.analysisBlue))
                            Image(systemName: "chevron.right").font(.system(size: 12))
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                    }
                    .buttonStyle(.plain)
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
                }
                .buttonStyle(.plain)
                if insightsExpanded.contains(g.id) {
                    VStack(alignment: .leading, spacing: 6) {
                        insightLine("Your elbow angle held in range on 8 of your last 10 sessions.")
                        insightLine("Accuracy climbs 6% on days you complete a form-focus drill first.")
                        insightLine("Sessions before 9 AM show your most consistent release.")
                    }
                }
            }
            .padding(16)
        }
    }
    private func insightLine(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Circle().fill(ShotIQColor.shotiqOrange).frame(width: 5, height: 5).padding(.top, 4)
            Text(text).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
    private func goalStat(_ label: String, _ value: String, _ delta: String?, _ caption: String) -> some View {
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
    }
}

struct CreateGoalView: View {       // 064
    var onCreated: (() async -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
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
                let _: CreateGoalResp = try await APIClient.shared.call(
                    "/api/goals", method: "POST",
                    body: CreateGoalBody(name: cleanTitle,
                                         description: desc,
                                         category: category.lowercased(),
                                         unit: unit.lowercased(),
                                         targetValue: Int(target),
                                         xpReward: 150))
                toast = .success("Goal created", "Your goal list is refreshing now.")
                await onCreated?()
                try? await Task.sleep(nanoseconds: 650_000_000)
                dismiss()
            } catch {
                errorText = "Couldn't create the goal. Check your connection and try again."
                toast = .error("Goal not saved", "Check your connection and try again.")
            }
            busy = false
        }
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
                            Text("\(title.count)").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.horizontal, 14).frame(height: 52)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 8)
                        SectionLabel(text: "DESCRIPTION (OPTIONAL)").padding(.top, 18)
                        HStack(alignment: .bottom) {
                            TextField("Describe the goal", text: $desc, axis: .vertical)
                                .shotiqBody(15).lineLimit(3...5)
                            Text("\(desc.count)").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
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
                                    Text("%").shotiqBody(13, weight: .semibold)
                                    Text("of reps").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .frame(width: 130, alignment: .leading)
                        }
                        .padding(.top, 18)
                        Slider(value: $target, in: 40...100, step: 1)
                            .tint(ShotIQColor.shotiqOrange)
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
                            PrimaryButton(title: busy ? "Creating…" : "Create goal") { createGoal() }
                                .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || busy)
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
            }
        }
    }
}

struct GoalDetailView: View {       // 065
    var goal: GoalRecord
    var onChanged: (() async -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
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
                let _: GoalPatchResp = try await APIClient.shared.call(
                    "/api/goals/\(goal.id)", method: "PATCH", body: body)
                apply()
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
            await APIClient.shared.send("/api/saved-workouts", body: SavedWorkoutBody(name: name))
            toast = .success("Drill added", "\(name) is in your saved workouts.")
        }
    }
    private var targetValue: Int { goal.targetValue ?? 100 }
    private let sessions: [(String, String, String, String, String, String)] = [
        ("24", "May 24, 8:24 AM", "Form Session", "62.5%", "87°", "68%"),
        ("18", "May 22, 7:12 AM", "Quick Release", "61.1%", "83°", "62%"),
        ("20", "May 20, 6:45 AM", "Catch & Shoot", "60.0%", "78°", "54%"),
        ("22", "May 18, 9:01 AM", "Off the Dribble", "59.1%", "85°", "64%")
    ]
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
                                ScoreBar(pct: pct).frame(width: 110)
                            }
                            VStack(alignment: .leading, spacing: 6) {
                                Text("TREND (LAST 7 SESSIONS)").shotiqBody(9, weight: .semibold).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                TrendLine(points: [40, 48, 55, 60, 66, 72],
                                          stroke: ShotIQColor.shotiqOrange,
                                          areaFill: true, gridlines: true,
                                          xLabels: ["S1", "S3", "S5", "S7"],
                                          endBadge: "72")
                                    .frame(height: 84)
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
                                        Text("87°").font(.custom("Tungsten-Medium", size: 34))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        Text("AVG").shotiqBody(9, weight: .medium)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    ScoreBar(pct: 0.45)
                                    HStack {
                                        Text("60°"); Spacer(); Text("90°"); Spacer(); Text("120°")
                                    }
                                    .font(.system(size: 9)).foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("TARGET RANGE").shotiqBody(8.5, weight: .semibold).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("85°–95°").font(.custom("Tungsten-Medium", size: 22))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                }
                                .padding(10)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            }
                        }
                        .padding(.top, 10)
                        HStack(spacing: 10) {
                            snapshotCard("VERTICAL ALIGNMENT", "GOOD", "92%")
                            snapshotCard("LATERAL DRIFT", "GOOD", "4.2°")
                        }
                        .padding(.top, 10)
                        HStack {
                            SectionLabel(text: "LINKED SESSIONS")
                            Spacer()
                            Text("4 OF 6 THIS GOAL").shotiqBody(10, weight: .semibold).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 22)
                        ForEach(sessions, id: \.1) { s in
                            NavigationLink { AnalyticsDetailedView(metric: s.2) } label: {
                            HStack(spacing: 10) {
                                PhotoThumb(width: 46, height: 34, icon: "play.circle", photo: "066-visual-002")
                                VStack(spacing: 1) {
                                    Text(s.0).font(.custom("Tungsten-Medium", size: 16))
                                    Text("SHOTS").shotiqBody(6.5, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(s.1).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                    Text(s.2).shotiqBody(13, weight: .semibold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                    HStack(spacing: 3) {
                                        Text(s.3).shotiqBody(10, weight: .semibold)
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Text("MAKE %").shotiqBody(7).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                Spacer(minLength: 4)
                                VStack(spacing: 1) {
                                    Text(s.4).font(.custom("Tungsten-Medium", size: 16))
                                    Text("ELBOW").shotiqBody(6.5, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(spacing: 1) {
                                    Text(s.5).font(.custom("Tungsten-Medium", size: 16))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Text("GOAL SCORE").shotiqBody(6.5, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                Image(systemName: "chevron.right").font(.system(size: 11))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.vertical, 9)
                            .overlay(HRule(), alignment: .bottom)
                            }
                            .buttonStyle(.plain)
                        }
                        SectionLabel(text: "RECOMMENDED DRILLS").padding(.top, 20)
                        ForEach(["Quick Release Builder", "Wall Elbow Alignment"], id: \.self) { d in
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
                                    .buttonStyle(.plain)
                                    Image(systemName: "chevron.right").font(.system(size: 12))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(.vertical, 10)
                                .overlay(HRule(), alignment: .bottom)
                            }
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
                            .disabled(busy || completed)
                            SecondaryButton(title: "Edit goal", icon: "pencil") { showEdit = true }
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
            let maxV = points.max() ?? 1, minV = points.min() ?? 0
            let span = max(maxV - minV, 0.0001)
            let top: CGFloat = 18, bottom: CGFloat = 18, side: CGFloat = 16
            let coords = points.enumerated().map { i, p in
                CGPoint(x: side + CGFloat(i) / CGFloat(max(points.count - 1, 1)) * (geo.size.width - 2 * side),
                        y: top + (1 - CGFloat((p - minV) / span)) * (geo.size.height - top - bottom))
            }
            ZStack {
                Path { p in
                    guard let f = coords.first else { return }
                    p.move(to: f)
                    coords.dropFirst().forEach { p.addLine(to: $0) }
                }
                .stroke(ShotIQColor.muted, style: StrokeStyle(lineWidth: 1.2, dash: [3, 3]))
                ForEach(coords.indices, id: \.self) { i in
                    let last = i == coords.count - 1
                    Circle().fill(last ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                        .frame(width: last ? 8 : 6, height: last ? 8 : 6)
                        .position(coords[i])
                    Text("\(Int(points[i]))")
                        .font(.custom("Tungsten-Medium", size: 12))
                        .foregroundStyle(last ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                        .position(x: coords[i].x, y: coords[i].y - 12)
                    if labels.indices.contains(i) {
                        Text(labels[i])
                            .shotiqBody(7, weight: last ? .bold : .regular)
                            .foregroundStyle(last ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                            .position(x: coords[i].x, y: geo.size.height - 6)
                    }
                }
            }
        }
        .accessibilityHidden(true)
    }
}

struct AnalyticsCardsView: View {   // 066
    @EnvironmentObject var app: AppState
    @State private var timeRange = "All time"
    @State private var mediaFilter = "All media"
    @State private var showTimePicker = false
    @State private var showMediaPicker = false
    @State private var toast: ShotIQToast?
    private struct AnalysisSession: Identifiable {
        let id = UUID()
        let date, name: String
        let shots, makes: Int
        let acc: String
        let score: Int
        let delta, deltaLabel: String
        let deltaColor: Color
        let daysAgo: Int
        let kind: String
    }
    private var sessions: [AnalysisSession] {
        [.init(date: "Today at 8:24 AM", name: "Catch & Shoot", shots: 24, makes: 15, acc: "62.5%",
               score: 82, delta: "+6", deltaLabel: "IMPROVEMENT", deltaColor: ShotIQColor.confirmGreen,
               daysAgo: 0, kind: "Video"),
         .init(date: "May 20 at 6:12 PM", name: "Off the Dribble", shots: 22, makes: 13, acc: "59.1%",
               score: 78, delta: "+4", deltaLabel: "IMPROVEMENT", deltaColor: ShotIQColor.confirmGreen,
               daysAgo: 4, kind: "Live"),
         .init(date: "May 14 at 7:05 AM", name: "Pull-Up Jumper", shots: 25, makes: 14, acc: "56.0%",
               score: 75, delta: "—", deltaLabel: "NO CHANGE", deltaColor: ShotIQColor.analysisBlue,
               daysAgo: 10, kind: "Video"),
         .init(date: "May 8 at 5:48 PM", name: "Mid-Range Work", shots: 20, makes: 11, acc: "55.0%",
               score: 70, delta: "-3", deltaLabel: "NEEDS REVIEW", deltaColor: ShotIQColor.reviewRed,
               daysAgo: 16, kind: "Photo")]
    }
    /// Canonical 066 frames, keyed by session so filtering keeps each card
    /// with a real basketball photograph instead of a gray placeholder tile.
    private let sessionPhotos = ["Catch & Shoot": "066-visual-001",
                                 "Off the Dribble": "066-visual-002",
                                 "Pull-Up Jumper": "066-visual-003",
                                 "Mid-Range Work": "066-visual-001"]
    private var filteredSessions: [AnalysisSession] {
        sessions.filter { s in
            let inRange: Bool
            switch timeRange {
            case "Last 7 days": inRange = s.daysAgo <= 7
            case "Last 30 days": inRange = s.daysAgo <= 30
            default: inRange = true
            }
            let kindOK = mediaFilter == "All media" || s.kind == mediaFilter
            return inRange && kindOK
        }
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
                            filterChip("slider.horizontal.3", mediaFilter) { showMediaPicker = true }
                        }
                        .padding(.top, 16)
                        .confirmationDialog("Time range", isPresented: $showTimePicker, titleVisibility: .visible) {
                            ForEach(["All time", "Last 30 days", "Last 7 days"], id: \.self) { r in
                                Button(r) {
                                    timeRange = r
                                    toast = .success("Filter applied", "Showing \(r.lowercased()) analysis.")
                                }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        .confirmationDialog("Media type", isPresented: $showMediaPicker, titleVisibility: .visible) {
                            ForEach(["All media", "Video", "Photo", "Live"], id: \.self) { k in
                                Button(k) {
                                    mediaFilter = k
                                    toast = .success("Media filter applied", "\(filteredSessions.count) sessions visible.")
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
                                            Text("82").font(.custom("Tungsten-Medium", size: 44))
                                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                            Text("GOOD").shotiqBody(12, weight: .bold)
                                                .foregroundStyle(ShotIQColor.analysisBlue)
                                        }
                                        Text("Keep elbow stacked through release.")
                                            .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                    .frame(width: 108, alignment: .leading)
                                    DottedTrend(points: [68, 72, 76, 79, 80, 82],
                                                labels: ["APR 26", "MAY 2", "MAY 8", "MAY 14", "MAY 20", "TODAY"])
                                        .frame(height: 108)
                                }
                                PhaseStrip()
                                HRule()
                                HStack(spacing: 0) {
                                    trendStat("24", "SHOTS", ShotIQColor.ink)
                                    VRule(height: 38)
                                    trendStat("15", "MAKES", ShotIQColor.ink)
                                    VRule(height: 38)
                                    trendStat("62.5%", "ACCURACY", ShotIQColor.ink)
                                    VRule(height: 38)
                                    trendStat("+8.1%", "VS PREVIOUS 30 DAYS", ShotIQColor.confirmGreen)
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
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 22)
                        if filteredSessions.isEmpty {
                            Text("No sessions match these filters.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                .frame(maxWidth: .infinity).padding(.vertical, 30)
                        }
                        ForEach(filteredSessions) { s in
                            sessionCard(s).padding(.top, 12)
                        }
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
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
    private func sessionCard(_ s: AnalysisSession) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 0) {
                PhotoThumb(width: 112, height: 186, photo: sessionPhotos[s.name])
                    .overlay(alignment: .bottomLeading) {
                        Text("\(s.score)").font(.custom("Tungsten-Medium", size: 24))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .padding(8)
                    }
                    .overlay(alignment: .bottomTrailing) {
                        Ring(pct: Double(s.score) / 100, color: ShotIQColor.shotiqOrange, lineWidth: 5)
                            .frame(width: 40, height: 40)
                            .padding(8)
                    }
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(s.date).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        Spacer()
                        Menu {
                            ShareLink(item: "\(s.name) on ShotIQ — \(s.makes)/\(s.shots) makes (\(s.acc)), form score \(s.score). 🏀") {
                                Label("Share session", systemImage: "square.and.arrow.up")
                            }
                        } label: {
                            Image(systemName: "ellipsis").font(.system(size: 13))
                                .foregroundStyle(ShotIQColor.graphite)
                                .frame(width: 32, height: 24, alignment: .trailing)
                        }
                    }
                    Text(s.name).shotiqBody(18, weight: .bold)
                        .lineLimit(1).minimumScaleFactor(0.8)
                    HStack(spacing: 14) {
                        sessionStat("\(s.shots)", "SHOTS")
                        sessionStat("\(s.makes)", "MAKES")
                        sessionStat(s.acc, "ACCURACY")
                    }
                    HStack(spacing: 7) {
                        ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                            PhaseGlyph(phase: p, active: p == "RELEASE", size: 15)
                        }
                    }
                    HStack(alignment: .bottom) {
                        VStack(spacing: 1) {
                            Text(s.delta).font(.custom("Tungsten-Medium", size: 20))
                                .foregroundStyle(s.deltaColor)
                            Text(s.deltaLabel).shotiqBody(7, weight: .bold).kerning(0.3)
                                .foregroundStyle(s.deltaColor)
                                .lineLimit(1).minimumScaleFactor(0.7)
                        }
                        .frame(width: 84)
                        .padding(.vertical, 7)
                        .background(s.deltaColor.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                        Spacer(minLength: 6)
                        NavigationLink { AnalyticsDetailedView(metric: s.name) } label: {
                            HStack(spacing: 4) {
                                Text("Open session").shotiqBody(12, weight: .semibold)
                                Image(systemName: "chevron.right").font(.system(size: 9))
                            }
                            .padding(.horizontal, 12).padding(.vertical, 9)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 7))
                            .foregroundStyle(.white)
                        }
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
    @Environment(\.dismiss) private var dismiss
    @State private var range = "Last 30 days"
    @State private var chosenMetric: String?
    @State private var showRangePicker = false
    @State private var showMetricPicker = false
    @State private var showConfidenceInfo = false
    private var displayMetric: String { chosenMetric ?? metric }
    private var exportSummary: String {
        "ShotIQ analysis — \(displayMetric), \(range): 78.2% consistency, form score 82, +6.4% vs previous 30 days."
    }
    private let scorecard: [(String, Int, Int, String)] = [
        ("SETUP", 84, 4, "GOOD"), ("LOAD", 79, 2, "GOOD"), ("RISE", 88, 5, "GREAT"),
        ("RELEASE", 78, 6, "GOOD"), ("FOLLOW-THROUGH", 84, 3, "GOOD")
    ]
    private let comparison: [(String, String, String, String, String, Bool)] = [
        ("Form Score", "82", "76", "71", "+11", true),
        ("Make %", "62.5%", "59.1%", "52.4%", "+10.1%", true),
        ("Release Consistency", "78.2%", "71.8%", "64.0%", "+14.2%", true),
        ("Release Angle", "50.4°", "48.1°", "45.2°", "+5.2°", true),
        ("Elbow Alignment", "92%", "88%", "81%", "+11%", true),
        ("Shot Depth", "1.3 ft", "1.5 ft", "1.7 ft", "-0.4 ft", false),
        ("Shot Speed", "1.06 sec", "1.11 sec", "1.18 sec", "-0.12 sec", false),
        ("Swish %", "41.7%", "36.4%", "28.6%", "+13.1%", true)
    ]
    var body: some View {
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
                            detailChip("chart.xyaxis.line", displayMetric, chevron: true) { showMetricPicker = true }
                            detailChip(nil, "Confidence: High", chevron: false) { showConfidenceInfo = true }
                        }
                        .padding(.top, 12)
                        .confirmationDialog("Time range", isPresented: $showRangePicker, titleVisibility: .visible) {
                            ForEach(["Last 7 days", "Last 30 days", "Last 90 days", "All time"], id: \.self) { r in
                                Button(r) { range = r }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        .confirmationDialog("Select metric", isPresented: $showMetricPicker, titleVisibility: .visible) {
                            ForEach(["Release Consistency", "Form Score", "Make %", "Release Angle", "Elbow Alignment"],
                                    id: \.self) { m in
                                Button(m) { chosenMetric = m }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        .alert("Confidence: High", isPresented: $showConfidenceInfo) {
                            Button("OK", role: .cancel) {}
                        } message: {
                            Text("Confidence reflects how many tracked sessions back this trend. 9 sessions in range gives a high-confidence read.")
                        }
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 12) {
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "TREND")
                                    Text("+6.4%").font(.custom("Tungsten-Medium", size: 30))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Text("vs previous 30 days").shotiqBody(10)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .frame(width: 82, alignment: .leading)
                                TrendLine(points: [68, 66.5, 69, 72.5, 68.5, 71, 73.5, 77, 76.2],
                                          stroke: ShotIQColor.confirmGreen,
                                          areaFill: true, gridlines: true,
                                          xLabels: ["APR", "MAY"],
                                          yLabels: ["80", "72", "64"],
                                          endBadge: "78.2%")
                                    .frame(height: 92)
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "LATEST")
                                    Text("78.2%").font(.custom("Tungsten-Medium", size: 30))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text("MAY 24").shotiqBody(10, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
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
                                    ForEach(scorecard, id: \.0) { p in
                                        VStack(spacing: 4) {
                                            PhaseGlyph(phase: p.0, active: p.0 == "RELEASE", size: 24)
                                            Text(p.0).shotiqBody(7, weight: .bold).kerning(0.2)
                                                .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.55)
                                            HStack(alignment: .firstTextBaseline, spacing: 2) {
                                                Text("\(p.1)").font(.custom("Tungsten-Medium", size: 20))
                                                Text("+\(p.2)").shotiqBody(8, weight: .bold)
                                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                            }
                                            Text(p.3).shotiqBody(8, weight: .bold)
                                                .foregroundStyle(p.3 == "GREAT" ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue)
                                            ScoreBar(pct: Double(p.1) / 100,
                                                     color: p.3 == "GREAT" ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue)
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
                                compHeader("MAY 24, 8:24 AM", "24 SHOTS", highlight: true)
                                compHeader("MAY 16, 7:05 AM", "22 SHOTS", highlight: false)
                                compHeader("MAY 9, 6:40 AM", "21 SHOTS", highlight: false)
                                compHeader("CHANGE", "(LATEST VS MAY 9)", highlight: false)
                            }
                            .padding(.vertical, 8)
                            .overlay(HRule(), alignment: .bottom)
                            ForEach(comparison, id: \.0) { r in
                                HStack(spacing: 0) {
                                    Text(r.0).shotiqBody(11)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                    compCell(r.1, color: ShotIQColor.shotiqOrange, highlight: true)
                                    compCell(r.2, color: ShotIQColor.ink, highlight: false)
                                    compCell(r.3, color: ShotIQColor.ink, highlight: false)
                                    compCell(r.4, color: r.5 ? ShotIQColor.confirmGreen : ShotIQColor.reviewRed,
                                             highlight: false)
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
                                    Text("AVG ARC").shotiqBody(8, weight: .semibold)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("50.4°").font(.custom("Tungsten-Medium", size: 32))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Text("IDEAL: 48°–52°").shotiqBody(9, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(width: 96, alignment: .leading)
                                ArcGauge().frame(height: 90).frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "CONSISTENCY")
                                    Text("78.2%").font(.custom("Tungsten-Medium", size: 28))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text("±3.6°").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
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
    private struct MediaItem {
        let title, time, score, grade: String
        let color: Color
        let kind: String            // Images / Videos / Live / Workouts
    }
    private let today: [MediaItem] = [
        .init(title: "Pull-Up • Right", time: "8:24 AM", score: "82", grade: "GOOD",
              color: ShotIQColor.analysisBlue, kind: "Videos"),
        .init(title: "Spot-Up • Right", time: "8:18 AM", score: "74", grade: "REVIEW",
              color: ShotIQColor.reviewRed, kind: "Images"),
        .init(title: "Catch & Shoot • Right", time: "8:12 AM", score: "86", grade: "GOOD",
              color: ShotIQColor.analysisBlue, kind: "Videos"),
        .init(title: "Live Session", time: "8:01 AM", score: "80", grade: "GOOD",
              color: ShotIQColor.analysisBlue, kind: "Live"),
        .init(title: "Low Dribble Series", time: "7:45 AM", score: "88", grade: "GOOD",
              color: ShotIQColor.analysisBlue, kind: "Workouts"),
        .init(title: "Cone Progression", time: "7:28 AM", score: "90", grade: "EXCELLENT",
              color: ShotIQColor.confirmGreen, kind: "Images")
    ]
    /// Canonical 068 grid frames, in the tile order above. The second tile used
    /// to keep a gray placeholder because no crop was assigned; reuse a nearby
    /// shot frame so every media item has visible basketball imagery.
    private let todayPhotos: [String?] = ["068-visual-002", "068-visual-003", "068-visual-001",
                                          "068-visual-005", "068-visual-004", "068-visual-003"]
    private var filteredToday: [(Int, MediaItem)] {
        var items = Array(today.enumerated()).filter { pair in
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
    var body: some View {
        CanonicalScreen(testID: "screen-ios-my-media") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Primary target").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 12)
                        Text("Keep elbow stacked through release").shotiqBody(14, weight: .semibold)
                            .padding(.top, 2)
                        ShotIQCard {
                            HStack(spacing: 0) {
                                VStack(spacing: 3) {
                                    Text("FORM SCORE").shotiqBody(8, weight: .semibold).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("82").font(.custom("Tungsten-Medium", size: 26))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("GOOD").shotiqBody(8, weight: .bold)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    ScoreBar(pct: 0.82, color: ShotIQColor.analysisBlue).frame(width: 44)
                                }
                                .frame(maxWidth: .infinity)
                                VRule(height: 48)
                                mediaStat("24", "SHOTS")
                                VRule(height: 48)
                                mediaStat("15", "MAKES")
                                VRule(height: 48)
                                mediaStat("62.5%", "ACCURACY")
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
                                Button { segment = s } label: {
                                    Text(s).shotiqBody(13, weight: segment == s ? .semibold : .regular)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                        .frame(maxWidth: .infinity).frame(height: 38)
                                        .background(segment == s ? ShotIQColor.warmCanvas : .clear,
                                                    in: RoundedRectangle(cornerRadius: 6))
                                        .foregroundStyle(segment == s ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                }
                            }
                        }
                        .padding(4)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 12)
                        HStack(spacing: 8) {
                            mediaTool("slider.horizontal.3",
                                      gradeFilter == "All results" ? "Filter" : gradeFilter,
                                      active: gradeFilter != "All results") { showGradeFilter = true }
                            mediaTool("arrow.up.arrow.down", sortNewest ? "Sort: Newest" : "Sort: Oldest",
                                      active: false) { sortNewest.toggle() }
                            mediaTool("viewfinder", selecting ? "Done (\(selectedTiles.count))" : "Select",
                                      active: selecting) {
                                selecting.toggle()
                                if !selecting { selectedTiles.removeAll() }
                            }
                        }
                        .padding(.top, 10)
                        .confirmationDialog("Filter by result", isPresented: $showGradeFilter,
                                            titleVisibility: .visible) {
                            ForEach(["All results", "GOOD", "REVIEW", "EXCELLENT"], id: \.self) { g in
                                Button(g) { gradeFilter = g }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        HStack {
                            SectionLabel(text: "TODAY")
                            Spacer()
                            Text("\(filteredToday.count) ITEMS").shotiqBody(10, weight: .semibold).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 18)
                        if filteredToday.isEmpty {
                            Text("Nothing in this view yet.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                .frame(maxWidth: .infinity).padding(.vertical, 24)
                        }
                        let cols = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)
                        LazyVGrid(columns: cols, spacing: 14) {
                            ForEach(filteredToday, id: \.0) { i, t in
                                if selecting {
                                    Button {
                                        if selectedTiles.contains(i) { selectedTiles.remove(i) }
                                        else { selectedTiles.insert(i) }
                                    } label: {
                                        mediaTile(t, duration: "0:0\((i + 3) % 9)", photo: photoKey(i))
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
                                } else {
                                    NavigationLink { MediaDetailView() } label: {
                                        mediaTile(t, duration: "0:0\((i + 3) % 9)", photo: photoKey(i))
                                    }
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
    }
    private func mediaStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 3) {
            Text(value).font(.custom("Tungsten-Medium", size: 26)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(8, weight: .medium).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
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
    private func photoKey(_ i: Int) -> String? {
        todayPhotos.indices.contains(i) ? todayPhotos[i] : nil
    }
    private func mediaTile(_ t: MediaItem, duration: String, photo: String? = nil) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            PhotoThumb(height: 112, photo: photo)
                .overlay(alignment: .bottomLeading) {
                    Text(duration).font(.custom("Tungsten-Medium", size: 11))
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
    /// Server id of the backing UserAnalysis row, when opened from real data —
    /// enables the authoritative DELETE /api/media?analysisId=… call.
    var analysisId: String? = nil
    @Environment(\.dismiss) private var dismiss
    @State private var playing = false
    @State private var speedIndex = 1
    @State private var selectedFrame = 4
    @State private var deleting = false
    @State private var confirmDelete = false
    @State private var showDownloadInfo = false
    @State private var toast: ShotIQToast?
    private let speeds = ["SLOW 0.5x", "SLOW 1.0x", "SLOW 2.0x"]
    private let shareText = "My ShotIQ session — 15/24 makes (62.5%), form score 82. 🏀"

    /// DELETE /api/media?analysisId=… (route requires query params + CSRF, so
    /// this builds the request directly; it shares URLSession's cookie store
    /// and the Keychain token with APIClient).
    private func deleteMedia() {
        guard !deleting else { return }
        deleting = true
        toast = .progress("Deleting media", "Removing this clip from ShotIQ.", progress: 0.45)
        Task {
            defer { deleting = false }
            guard let analysisId else {
                toast = .info("Sample media only", "There is no server item to delete yet.")
                return
            }
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
                    }
                    .padding(.horizontal, 20).frame(height: 52)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        ZStack {
                            CanonicalMediaSurface(key: "069-visual-002", height: 310, duration: "6:12")
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
                        }
                        .overlay(alignment: .topLeading) {
                            Text("6:12").font(.custom("Tungsten-Medium", size: 13)).foregroundStyle(.white)
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
                                }
                            }
                            .padding(.vertical, 2)
                        }
                        .padding(.top, 10)
                        SectionLabel(text: "CAPTURE DETAILS").padding(.top, 18)
                        Text("MAY 21, 2025 • 8:24 AM").font(.custom("Tungsten-Medium", size: 24))
                            .padding(.top, 6)
                        Text("Indoor Court • iPhone 15 Pro • 1080p • 60fps")
                            .shotiqBody(12).foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                        SectionLabel(text: "LINKED ANALYSIS").padding(.top, 18)
                        ShotIQCard {
                            HStack(spacing: 12) {
                                // Canonical's linked-analysis row shows a frame of
                                // the same clip, not a placeholder tile.
                                PhotoThumb(width: 62, height: 48, icon: "chart.xyaxis.line",
                                           photo: "069-visual-004")
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
                                        Text("• May 21, 2025").shotiqBody(11)
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(1).minimumScaleFactor(0.7)
                                    }
                                    Text("Form Score").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    HStack(spacing: 8) {
                                        Text("82").font(.custom("Tungsten-Medium", size: 22))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: 0.82).frame(width: 76)
                                    }
                                }
                                Spacer(minLength: 4)
                                NavigationLink { AnalysisResultOverviewView() } label: {
                                    HStack(spacing: 4) {
                                        Text("Open analysis").shotiqBody(12, weight: .semibold)
                                            .lineLimit(1).minimumScaleFactor(0.7)
                                        Image(systemName: "chevron.right").font(.system(size: 9))
                                    }
                                    .padding(.horizontal, 10).padding(.vertical, 9)
                                    .overlay(RoundedRectangle(cornerRadius: 7).stroke(ShotIQColor.analysisBlue))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                }
                            }
                            .padding(12)
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "SHOT EVENTS").padding(.top, 18)
                        HStack(spacing: 0) {
                            HeaderStat(icon: "scope", value: "24", label: "SHOTS").frame(maxWidth: .infinity)
                            VRule(height: 46)
                            HeaderStat(icon: "point.3.connected.trianglepath.dotted", value: "15", label: "MAKES")
                                .frame(maxWidth: .infinity)
                            VRule(height: 46)
                            HeaderStat(icon: "gauge", value: "62.5%", label: "MAKE %").frame(maxWidth: .infinity)
                            VRule(height: 46)
                            HeaderStat(icon: "sparkles", value: "6", label: "DAY STREAK").frame(maxWidth: .infinity)
                            VRule(height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                .frame(maxWidth: .infinity)
                        }
                        .padding(.top, 10)
                        NavigationLink { GoalsView() } label: {
                            VStack(alignment: .leading, spacing: 5) {
                                MicroLabel(text: "PRIMARY COACHING TARGET")
                                HStack {
                                    Text("Keep elbow stacked through release").shotiqBody(17, weight: .bold)
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
                        }
                        .buttonStyle(.plain)
                        .padding(.top, 18)
                        SectionLabel(text: "ACTIONS").padding(.top, 16)
                        HStack(spacing: 8) {
                            actionButton(playing ? "pause.fill" : "play.fill",
                                         playing ? "Pause" : "Play", ShotIQColor.ink) {
                                playing.toggle()
                                toast = .info(playing ? "Playing clip" : "Clip paused")
                            }
                            ShareLink(item: shareText) {
                                actionLabel("square.and.arrow.up", "Share", ShotIQColor.ink)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening share sheet", "Your ShotIQ summary is ready.")
                            })
                            actionButton("arrow.down.to.line", "Download", ShotIQColor.ink) {
                                showDownloadInfo = true
                                toast = .info("Download unavailable", "On-device downloads are coming soon.")
                            }
                            actionButton("trash", "Delete", ShotIQColor.reviewRed) { confirmDelete = true }
                        }
                        .padding(.top, 8)
                        .alert("Download unavailable", isPresented: $showDownloadInfo) {
                            Button("OK", role: .cancel) {}
                        } message: {
                            Text("This clip is stored on the ShotIQ server. On-device downloads are coming to a future build.")
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
                        }
                        .padding(12)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.reviewRed.opacity(0.5)))
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
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        .foregroundStyle(color)
    }
    private func actionButton(_ icon: String, _ label: String, _ color: Color,
                              action: @escaping () -> Void) -> some View {
        Button(action: action) { actionLabel(icon, label, color) }
    }
}

struct ProfileView: View {          // 070
    @EnvironmentObject var app: AppState
    @State private var showEditProfile = false
    /// The wordmark bar's gear used to be inert on this screen (TopBar's
    /// onSettings defaults to a no-op); on Profile it opens the settings hub.
    @State private var showSettings = false
    @State private var bio = "Dedicated to the details. Constantly working to build a repeatable, efficient shot with elite consistency."
    @State private var enhancingBio = false
    @State private var bioError: String?
    @State private var toast: ShotIQToast?

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
    var body: some View {
        CanonicalScreen(testID: "screen-ios-profile") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar(onSettings: { showSettings = true })
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: 16) {
                            ZStack(alignment: .bottomTrailing) {
                                Circle().fill(ShotIQColor.rule).frame(width: 86, height: 86)
                                    .overlay(Text(shotiqInitials(app.user))
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
                                Text((app.user?.displayName ?? "Jordan Ellis").uppercased()).shotiqDisplay(32)
                                Text("Right-handed • Advanced").shotiqBody(14)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .padding(.top, 18)
                        HStack(spacing: 0) {
                            NavigationLink { WorkoutCalendarView() } label: {
                                HeaderStat(icon: "film", value: "6", label: "DAY STREAK").frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.plain)
                            VRule(height: 46)
                            NavigationLink { PlayerCardView() } label: {
                                HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.plain)
                            VRule(height: 46)
                            profileStat("24", "SHOTS")
                            VRule(height: 46)
                            profileStat("15", "MAKES")
                            VRule(height: 46)
                            profileStat("62.5%", "MAKE %")
                        }
                        .padding(.vertical, 16)
                        PrimaryButton(title: "Edit player profile", icon: "camera.viewfinder") {
                            showEditProfile = true
                        }
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                SectionLabel(text: "PHYSICAL PROFILE")
                                HStack(spacing: 0) {
                                    physCol("ruler", "6'3\"", "HEIGHT")
                                    VRule(height: 48)
                                    physCol("scalemass", "185 lbs", "WEIGHT")
                                    VRule(height: 48)
                                    physCol("figure.arms.open", "6'5\"", "WINGSPAN")
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
                                    Text("82%").font(.custom("Tungsten-Medium", size: 24))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                }
                                ScoreBar(pct: 0.82)
                                HStack(spacing: 0) {
                                    completionItem(true, "Profile info")
                                    completionItem(true, "Physical profile")
                                    completionItem(true, "Shooting profile")
                                    completionItem(false, "Bio")
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
                                    activityRow("Quick Release Builder", "Today at 8:24 AM")
                                    activityRow("Catch & Shoot Review", "May 11, 2024")
                                    activityRow("Mid-Range Mechanics", "May 10, 2024")
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
        .shotiqToast($toast)
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
    @AppStorage("notifications") private var notifs = true
    @AppStorage("coachingAudio") private var audio = true
    @AppStorage("units") private var metric = false
    @AppStorage("autoAnalysis") private var autoAnalysis = true
    @AppStorage("dataBackup") private var dataBackup = true
    @AppStorage("anonAnalytics") private var anonAnalytics = true
    @AppStorage("peerComparisons") private var peerComparisons = true
    @State private var showEditProfile = false
    @State private var showAutomation = false
    @State private var showPrivacy = false
    @State private var showAbout = false

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
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                            VRule(height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                HStack(spacing: 14) {
                                    Circle().fill(ShotIQColor.rule).frame(width: 62, height: 62)
                                        .overlay(Text(shotiqInitials(app.user))
                                            .shotiqBody(19, weight: .bold)
                                            .foregroundStyle(ShotIQColor.graphite))
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text((app.user?.displayName ?? "Jordan Ellis").uppercased())
                                            .shotiqDisplay(26)
                                        Text("Right-handed • Advanced").shotiqBody(13)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(14)
                                HRule()
                                HStack(spacing: 0) {
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("FORM SCORE").shotiqBody(8, weight: .semibold).kerning(0.4)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("82").font(.custom("Tungsten-Medium", size: 28))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: 0.82).frame(width: 58)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    settingsStat("24", "SHOTS")
                                    settingsStat("15", "MAKES")
                                    settingsStat("62.5%", "MAKE %")
                                    VStack(spacing: 3) {
                                        Text("+8.1%").shotiqBody(12, weight: .bold)
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                        Text("VS LAST SESSION").shotiqBody(6.5, weight: .medium)
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(1).minimumScaleFactor(0.6)
                                    }
                                    .frame(maxWidth: .infinity)
                                }
                                .padding(14)
                                HRule()
                                Button { showEditProfile = true } label: {
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
                            }
                        }
                        .padding(.top, 16)
                        SectionLabel(text: "PREFERENCES").padding(.top, 20)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                settingsToggle("Workout notifications", "Manage alerts, reminders, and updates.", $notifs)
                                    .onChange(of: notifs) { _, on in
                                        if on { UNUserNotificationCenter.current()
                                            .requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in } }
                                        persistSettings()
                                    }
                                HRule().padding(.leading, 14)
                                settingsToggle("Coaching audio cues", "Voice cues while you train.", $audio)
                                    .onChange(of: audio) { _, _ in persistSettings() }
                                HRule().padding(.leading, 14)
                                settingsToggle("Metric units", "Use metric units across the app.", $metric)
                                    .onChange(of: metric) { _, _ in persistSettings() }
                            }
                        }
                        .padding(.top, 8)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                settingsRow("bell", "Notifications", "Manage alerts, reminders, and updates.",
                                            status: notifs ? "3 ON" : "OFF", statusColor: ShotIQColor.analysisBlue) {
                                    CameraService.openSystemSettings()
                                }
                                HRule().padding(.leading, 14)
                                settingsRow("arrow.triangle.2.circlepath", "Automation",
                                            "Auto-analysis, uploads, and data handling.",
                                            status: "\([autoAnalysis, dataBackup].filter { $0 }.count) ACTIVE",
                                            statusColor: ShotIQColor.confirmGreen) {
                                    withAnimation { showAutomation.toggle() }
                                }
                                if showAutomation {
                                    settingsToggle("Auto-analysis refresh", "Recompute analytics overnight.", $autoAnalysis)
                                        .onChange(of: autoAnalysis) { _, _ in persistSettings() }
                                        .padding(.leading, 26)
                                    settingsToggle("Data backup", "Back up sessions to the server.", $dataBackup)
                                        .onChange(of: dataBackup) { _, _ in persistSettings() }
                                        .padding(.leading, 26)
                                }
                                HRule().padding(.leading, 14)
                                settingsRow("lock.shield", "Data and privacy",
                                            "Control your data, export, and permissions.",
                                            status: nil, statusColor: nil) {
                                    withAnimation { showPrivacy.toggle() }
                                }
                                if showPrivacy {
                                    settingsToggle("Anonymous analytics", "Share anonymized usage data.", $anonAnalytics)
                                        .onChange(of: anonAnalytics) { _, _ in persistSettings() }
                                        .padding(.leading, 26)
                                    settingsToggle("Peer comparisons", "Include my stats in peer comparisons.", $peerComparisons)
                                        .onChange(of: peerComparisons) { _, _ in persistSettings() }
                                        .padding(.leading, 26)
                                }
                                HRule().padding(.leading, 14)
                                settingsRow("questionmark.circle", "Help and support",
                                            "FAQs, guides, and contact options.",
                                            status: nil, statusColor: nil) {
                                    if let url = URL(string: "mailto:support@shotiq.app?subject=ShotIQ%20Support") {
                                        UIApplication.shared.open(url)
                                    }
                                }
                                HRule().padding(.leading, 14)
                                settingsRow("info.circle", "About ShotIQ",
                                            "Version 1.0.0, terms, and app information.",
                                            status: nil, statusColor: nil) {
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
        .sheet(isPresented: $showEditProfile) { EditProfileSheet().modifier(CanonicalTypeScale()) }
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
    private func settingsToggle(_ title: String, _ caption: String, _ isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).shotiqBody(15, weight: .semibold)
                Text(caption).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
            }
        }
        .tint(ShotIQColor.shotiqOrange)
        .padding(14)
    }
    private func settingsRow(_ icon: String, _ title: String, _ caption: String,
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
                Text("82").font(.custom("Tungsten-Medium", size: 54))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                VStack(alignment: .leading, spacing: 2) {
                    Text("FORM SCORE · GOOD").shotiqBody(11, weight: .bold)
                        .foregroundStyle(ShotIQColor.analysisBlue)
                    Text("24 shots · 15 makes · 62.5% · +8.1% vs last session")
                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                }
            }
            Text("Primary target: keep elbow stacked through release")
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
    static func render(name: String) -> UIImage? {
        let renderer = ImageRenderer(content: ShareCardExportView(name: name))
        renderer.scale = 3
        return renderer.uiImage
    }
}

struct ShareResultsView: View {     // 072
    @EnvironmentObject var app: AppState
    @State private var renderedCard: UIImage?
    @State private var copied = false
    private let shareText = "My ShotIQ form score: 82 (GOOD) — 62.5% make rate, trending +8.1%. 🏀"

    /// Rasterises the share card once, on demand. Nothing on this screen runs it
    /// on appear any more: a full synchronous `ImageRenderer` pass at scale 3 was
    /// the one thing this destination did that no other pushed screen does, and
    /// nothing here displays the bitmap until the reader asks to share it.
    @MainActor private func renderCard() {
        guard renderedCard == nil else { return }
        renderedCard = ShareResultsImageRenderer.render(name: app.user?.displayName ?? "Jordan Ellis")
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
                                    Text((app.user?.displayName ?? "Jordan Ellis").uppercased())
                                        .shotiqDisplay(30)
                                    Text("Right-handed • Advanced").shotiqBody(13)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer(minLength: 8)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("FORM SCORE").shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("82").font(.custom("Tungsten-Medium", size: 44))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: 0.82).frame(width: 88)
                                }
                            }
                            HRule()
                            HStack(alignment: .center) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("PRIMARY COACHING TARGET")
                                        .shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("Keep elbow stacked through release").shotiqBody(15, weight: .bold)
                                        .lineLimit(2).minimumScaleFactor(0.8)
                                        .fixedSize(horizontal: false, vertical: true)
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
                                    highlight("figure.arms.open", "ELBOW STACK")
                                    highlight("gauge", "52° RELEASE ANGLE")
                                    highlight("hand.raised", "WRIST SNAP")
                                    highlight("figure.stand", "FOLLOW-THROUGH")
                                }
                                .frame(width: 124, alignment: .leading)
                            }
                            PhaseStrip()
                            HRule()
                            HStack(spacing: 0) {
                                shareBottomStat("24", "SHOTS", ShotIQColor.ink)
                                VRule(height: 34)
                                shareBottomStat("15", "MAKES", ShotIQColor.ink)
                                VRule(height: 34)
                                shareBottomStat("62.5%", "MAKE %", ShotIQColor.ink)
                                VRule(height: 34)
                                VStack(spacing: 2) {
                                    Text("+8.1%").shotiqBody(13, weight: .bold)
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Text("VS LAST SESSION").shotiqBody(6.5, weight: .medium)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                }
                                .frame(maxWidth: .infinity)
                            }
                            HRule()
                            HStack {
                                Text("ANALYZED TODAY AT 8:24 AM")
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
                        imageShareControl("square.and.arrow.up", "Share image", ShotIQColor.shotiqOrange)
                        imageShareControl("arrow.down.to.line", "Save image", ShotIQColor.ink)
                        Button {
                            UIPasteboard.general.string = shareText
                            copied = true
                            Task { try? await Task.sleep(for: .seconds(2)); copied = false }
                        } label: {
                            shareOption(copied ? "checkmark" : "square.on.square",
                                        copied ? "Copied" : "Copy", ShotIQColor.ink)
                        }
                        ShareLink(item: shareText) { shareOption("ellipsis", "More", ShotIQColor.ink) }
                    }
                    .padding(.horizontal, 20).padding(.top, 12)
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
}
