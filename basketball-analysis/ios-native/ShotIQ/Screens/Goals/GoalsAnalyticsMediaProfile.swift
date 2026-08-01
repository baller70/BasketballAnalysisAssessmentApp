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
            ? [GoalDTO(id: "g1", title: "Keep elbow stacked through release", progress: 0.68, targetDate: nil, status: "active"),
               GoalDTO(id: "g2", title: "Raise make % to 65", progress: 0.4, targetDate: nil, status: "active")]
            : goals
    }
}

struct GoalsView: View {            // 063
    @StateObject private var vm = GoalsViewModel()
    @State private var tab = 0
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
                                    .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer(minLength: 8)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                        }
                        .padding(.top, 16)
                        NavigationLink { CreateGoalView() } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "plus.viewfinder")
                                Text("Create goal").font(.system(size: 17, weight: .medium))
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                        .accessibilityLabel("Create goal")
                        .padding(.top, 16)
                        HStack(spacing: 0) {
                            goalsTab("ACTIVE (\(vm.display.count))", 0)
                            goalsTab("COMPLETED (3)", 1)
                        }
                        .padding(.top, 18)
                        ForEach(vm.display) { g in
                            NavigationLink { GoalDetailView(goal: g) } label: {
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
                Text(label).font(.system(size: 13, weight: .bold)).kerning(0.5)
                    .foregroundStyle(tab == index ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                Rectangle().fill(tab == index ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                    .frame(height: tab == index ? 2 : 1)
            }
            .frame(maxWidth: .infinity)
        }
    }
    private func goalCard(_ g: GoalDTO) -> some View {
        let pct = g.progress ?? 0
        return ShotIQCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("PRIMARY TARGET").font(.system(size: 10, weight: .bold)).kerning(0.5)
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .overlay(RoundedRectangle(cornerRadius: 4).stroke(ShotIQColor.shotiqOrange))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Text(g.title).shotiqBody(19, weight: .bold)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                        Text("Improve alignment and control by maintaining a vertical elbow path to the release.")
                            .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    PhotoThumb(width: 116, height: 128)
                }
                VStack(alignment: .leading, spacing: 6) {
                    MicroLabel(text: "GOAL PROGRESS")
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text("\(Int(pct * 100))%").font(.custom("DINCondensed-Bold", size: 40))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("ON TRACK").font(.system(size: 11, weight: .bold))
                                .foregroundStyle(ShotIQColor.confirmGreen)
                            Text("Keep it up").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
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
                        HStack(spacing: 4) {
                            Text("Form Score").font(.system(size: 12, weight: .semibold))
                            Image(systemName: "chevron.down").font(.system(size: 8))
                        }
                        .foregroundStyle(ShotIQColor.ink)
                    }
                    TrendLine(points: [58, 59, 55, 62, 60, 57, 64, 66, 70, 68, 74, 72, 75, 79, 76, 80, 82],
                              stroke: ShotIQColor.shotiqOrange)
                        .frame(height: 84)
                }
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        SectionLabel(text: "RECENT SESSIONS")
                        Spacer()
                        Text("View all").font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                    }
                    HStack(spacing: 10) {
                        PhotoThumb(width: 62, height: 46, icon: "play.circle")
                        VStack(alignment: .leading, spacing: 3) {
                            Text("May 19, 8:24 AM").shotiqBody(14, weight: .bold)
                            Text("24 shots · 15 makes · 62.5%")
                                .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                .lineLimit(1).minimumScaleFactor(0.8)
                        }
                        Spacer(minLength: 4)
                        Text("82").font(.custom("DINCondensed-Bold", size: 18))
                            .foregroundStyle(ShotIQColor.analysisBlue)
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.analysisBlue))
                        Image(systemName: "chevron.right").font(.system(size: 12))
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    HRule()
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "sparkles").font(.system(size: 14))
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
                .padding(12)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                HStack(spacing: 5) {
                    Spacer()
                    Text("GOAL INSIGHTS").font(.system(size: 11, weight: .bold)).kerning(0.6)
                    Image(systemName: "chevron.down").font(.system(size: 9))
                    Spacer()
                }
                .foregroundStyle(ShotIQColor.ink)
            }
            .padding(16)
        }
    }
    private func goalStat(_ label: String, _ value: String, _ delta: String?, _ caption: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.system(size: 8, weight: .semibold)).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value).font(.custom("DINCondensed-Bold", size: 22)).foregroundStyle(ShotIQColor.ink)
                if let delta {
                    Text(delta).font(.system(size: 9, weight: .bold))
                        .foregroundStyle(ShotIQColor.confirmGreen)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
            }
            Text(caption).font(.system(size: 9)).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, 6)
    }
}

struct CreateGoalView: View {       // 064
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var desc = "Maintain a stacked elbow on every rep from rise through release to build repeatable form."
    @State private var category = "Form"
    @State private var targetType = "Consistency"
    @State private var unit = "Percent"
    @State private var target = 80.0
    var body: some View {
        CanonicalScreen(testID: "screen-ios-create-goal") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    VStack(alignment: .leading, spacing: 0) {
                        Button { dismiss() } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "chevron.left").font(.system(size: 13, weight: .bold))
                                Text("GOALS").font(.system(size: 13, weight: .bold)).kerning(0.8)
                            }
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .padding(.top, 14)
                        HStack(alignment: .top, spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("CREATE GOAL").shotiqDisplay(38)
                                Text("Set a measurable goal. Earn XP when you hit it.")
                                    .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer(minLength: 8)
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "GOAL NAME").padding(.top, 20)
                        HStack {
                            TextField("e.g. Keep elbow stacked through release", text: $title)
                                .font(.system(size: 15))
                            Text("\(title.count)").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.horizontal, 14).frame(height: 52)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 8)
                        SectionLabel(text: "DESCRIPTION (OPTIONAL)").padding(.top, 18)
                        HStack(alignment: .bottom) {
                            TextField("Describe the goal", text: $desc, axis: .vertical)
                                .font(.system(size: 15)).lineLimit(3...5)
                            Text("\(desc.count)").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
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
                        HStack(spacing: 0) {
                            PhotoThumb(width: 150, height: 110)
                            HStack {
                                Text("Keep elbow stacked through release").shotiqBody(15, weight: .bold)
                                    .multilineTextAlignment(.leading)
                                    .fixedSize(horizontal: false, vertical: true)
                                Spacer(minLength: 6)
                                Image(systemName: "chevron.right").font(.system(size: 13))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(14)
                        }
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
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
                                    Text("\(Int(target))").font(.custom("DINCondensed-Bold", size: 24))
                                        .frame(width: 58, height: 42)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                    Text("%").font(.system(size: 13, weight: .semibold))
                                    Text("of reps").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
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
                                    Text("150").font(.custom("DINCondensed-Bold", size: 24))
                                        .frame(width: 58, height: 42)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                    Text("XP").font(.system(size: 13, weight: .semibold))
                                }
                            }
                            .frame(width: 130, alignment: .leading)
                        }
                        .padding(.top, 14)
                        HStack(alignment: .top, spacing: 12) {
                            PhaseGlyph(active: true, size: 34)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Measured from RISE through RELEASE.")
                                    .font(.system(size: 13, weight: .semibold))
                                Text("Angle between upper arm and forearm should stay within your target range.")
                                    .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer(minLength: 4)
                            HStack(spacing: 3) {
                                Text("Learn how").font(.system(size: 12, weight: .semibold))
                                Image(systemName: "chevron.right").font(.system(size: 10))
                            }
                            .foregroundStyle(ShotIQColor.analysisBlue)
                        }
                        .padding(12)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 18)
                        HStack(spacing: 12) {
                            Button { dismiss() } label: {
                                Text("Cancel").font(.system(size: 16))
                                    .frame(maxWidth: .infinity).frame(height: 54)
                                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            PrimaryButton(title: "Create goal")
                                .disabled(title.isEmpty)
                        }
                        .padding(.vertical, 22)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func categoryCard(_ icon: String, _ label: String) -> some View {
        Button { category = label } label: {
            VStack(spacing: 7) {
                Image(systemName: icon).font(.system(size: 19))
                Text(label).font(.system(size: 11, weight: .medium))
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
                    Text(o).font(.system(size: 12, weight: o == sel.wrappedValue ? .semibold : .regular))
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
    var goal: GoalDTO
    @Environment(\.dismiss) private var dismiss
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
                                Text("GOALS").font(.system(size: 13, weight: .bold)).kerning(0.8)
                            }
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .padding(.top, 14)
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(goal.title.uppercased()).shotiqDisplay(30)
                                Text("Keep your shooting elbow stacked under the ball through release for a more efficient, repeatable shot.")
                                    .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            PhotoThumb(width: 128, height: 150)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 14) {
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("IMPACT").font(.system(size: 11, weight: .bold)).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("HIGH").shotiqDisplay(24)
                                    Text("Improves shot consistency and reduces off-line misses.")
                                        .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                VRule(height: 76)
                                VStack(alignment: .leading, spacing: 5) {
                                    MicroLabel(text: "FORM SCORE IMPACT")
                                    HStack(alignment: .firstTextBaseline, spacing: 5) {
                                        Text("+6–10").font(.custom("DINCondensed-Bold", size: 30))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Text("POTENTIAL").font(.system(size: 9, weight: .medium))
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
                                Text("OVERALL PROGRESS").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("\(Int((goal.progress ?? 0) * 100))%")
                                    .font(.custom("DINCondensed-Bold", size: 46))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                ScoreBar(pct: goal.progress ?? 0).frame(width: 110)
                            }
                            VStack(alignment: .leading, spacing: 6) {
                                Text("TREND (LAST 7 SESSIONS)").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                TrendLine(points: [40, 48, 55, 60, 66, 72],
                                          stroke: ShotIQColor.shotiqOrange)
                                    .frame(height: 84)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.top, 10)
                        SectionLabel(text: "TECHNIQUE SNAPSHOT").padding(.top, 22)
                        HStack(alignment: .top, spacing: 12) {
                            PhotoThumb(width: 118, height: 148)
                            VStack(alignment: .leading, spacing: 10) {
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "ELBOW STACK ANGLE")
                                    HStack(alignment: .firstTextBaseline, spacing: 5) {
                                        Text("87°").font(.custom("DINCondensed-Bold", size: 34))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        Text("AVG").font(.system(size: 9, weight: .medium))
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    ScoreBar(pct: 0.45)
                                    HStack {
                                        Text("60°"); Spacer(); Text("90°"); Spacer(); Text("120°")
                                    }
                                    .font(.system(size: 9)).foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("TARGET RANGE").font(.system(size: 8.5, weight: .semibold)).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("85°–95°").font(.custom("DINCondensed-Bold", size: 22))
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
                            Text("4 OF 6 THIS GOAL").font(.system(size: 10, weight: .semibold)).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 22)
                        ForEach(sessions, id: \.1) { s in
                            HStack(spacing: 10) {
                                PhotoThumb(width: 46, height: 34, icon: "play.circle")
                                VStack(spacing: 1) {
                                    Text(s.0).font(.custom("DINCondensed-Bold", size: 16))
                                    Text("SHOTS").font(.system(size: 6.5, weight: .medium))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(s.1).font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                                    Text(s.2).font(.system(size: 13, weight: .semibold))
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                    HStack(spacing: 3) {
                                        Text(s.3).font(.system(size: 10, weight: .semibold))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Text("MAKE %").font(.system(size: 7)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                Spacer(minLength: 4)
                                VStack(spacing: 1) {
                                    Text(s.4).font(.custom("DINCondensed-Bold", size: 16))
                                    Text("ELBOW").font(.system(size: 6.5, weight: .medium))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(spacing: 1) {
                                    Text(s.5).font(.custom("DINCondensed-Bold", size: 16))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Text("GOAL SCORE").font(.system(size: 6.5, weight: .medium))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                Image(systemName: "chevron.right").font(.system(size: 11))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.vertical, 9)
                            .overlay(HRule(), alignment: .bottom)
                        }
                        SectionLabel(text: "RECOMMENDED DRILLS").padding(.top, 20)
                        ForEach(["Quick Release Builder", "Wall Elbow Alignment"], id: \.self) { d in
                            NavigationLink { DrillDetailView(name: d) } label: {
                                HStack(spacing: 12) {
                                    PhotoThumb(width: 56, height: 44)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(d).shotiqBody(14, weight: .semibold)
                                            .lineLimit(1).minimumScaleFactor(0.8)
                                        Text("3 sets • 15 reps • Form Focus")
                                            .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer(minLength: 4)
                                    Text("Add drill").font(.system(size: 12, weight: .semibold))
                                        .padding(.horizontal, 11).padding(.vertical, 7)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
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
                        HStack(spacing: 12) {
                            PrimaryButton(title: "Log progress", icon: "chart.line.uptrend.xyaxis")
                            SecondaryButton(title: "Edit goal", icon: "pencil")
                        }
                        .padding(.top, 20)
                        SecondaryButton(title: "Mark goal complete", icon: "checkmark.circle")
                            .padding(.top, 10)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func snapshotCard(_ label: String, _ grade: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label).font(.system(size: 8.5, weight: .semibold)).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(grade).font(.system(size: 11, weight: .bold)).foregroundStyle(ShotIQColor.analysisBlue)
            Text(value).font(.custom("DINCondensed-Bold", size: 20))
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    private func milestone(_ title: String, _ caption: String, state: Int) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(.system(size: 9.5, weight: .bold)).kerning(0.3)
                .foregroundStyle(state == 1 ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
            Text(caption).font(.system(size: 9))
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
                        .font(.custom("DINCondensed-Bold", size: 12))
                        .foregroundStyle(last ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                        .position(x: coords[i].x, y: coords[i].y - 12)
                    if labels.indices.contains(i) {
                        Text(labels[i])
                            .font(.system(size: 7, weight: last ? .bold : .regular))
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
    private struct AnalysisSession: Identifiable {
        let id = UUID()
        let date, name: String
        let shots, makes: Int
        let acc: String
        let score: Int
        let delta, deltaLabel: String
        let deltaColor: Color
    }
    private var sessions: [AnalysisSession] {
        [.init(date: "Today at 8:24 AM", name: "Catch & Shoot", shots: 24, makes: 15, acc: "62.5%",
               score: 82, delta: "+6", deltaLabel: "IMPROVEMENT", deltaColor: ShotIQColor.confirmGreen),
         .init(date: "May 20 at 6:12 PM", name: "Off the Dribble", shots: 22, makes: 13, acc: "59.1%",
               score: 78, delta: "+4", deltaLabel: "IMPROVEMENT", deltaColor: ShotIQColor.confirmGreen),
         .init(date: "May 14 at 7:05 AM", name: "Pull-Up Jumper", shots: 25, makes: 14, acc: "56.0%",
               score: 75, delta: "—", deltaLabel: "NO CHANGE", deltaColor: ShotIQColor.analysisBlue),
         .init(date: "May 8 at 5:48 PM", name: "Mid-Range Work", shots: 20, makes: 11, acc: "55.0%",
               score: 70, delta: "-3", deltaLabel: "NEEDS REVIEW", deltaColor: ShotIQColor.reviewRed)]
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
                            filterChip("calendar", "All time")
                            filterChip("slider.horizontal.3", "All media")
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                SectionLabel(text: "FORM SCORE TREND")
                                HStack(alignment: .top, spacing: 10) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                                            Text("82").font(.custom("DINCondensed-Bold", size: 44))
                                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                            Text("GOOD").font(.system(size: 12, weight: .bold))
                                                .foregroundStyle(ShotIQColor.analysisBlue)
                                        }
                                        Text("Keep elbow stacked through release.")
                                            .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
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
                            HStack(spacing: 4) {
                                Text("View all").font(.system(size: 13, weight: .semibold))
                                Image(systemName: "chevron.right").font(.system(size: 10))
                            }
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .padding(.top, 22)
                        ForEach(sessions) { s in
                            sessionCard(s).padding(.top, 12)
                        }
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func filterChip(_ icon: String, _ label: String) -> some View {
        Button {} label: {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.system(size: 11))
                Text(label).font(.system(size: 12, weight: .medium))
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
            Text(value).font(.custom("DINCondensed-Bold", size: 24)).foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).font(.system(size: 7.5, weight: .medium)).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity)
    }
    private func sessionCard(_ s: AnalysisSession) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 0) {
                PhotoThumb(width: 112, height: 186)
                    .overlay(alignment: .bottomLeading) {
                        Text("\(s.score)").font(.custom("DINCondensed-Bold", size: 24))
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
                        Text(s.date).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                        Spacer()
                        Image(systemName: "ellipsis").font(.system(size: 13))
                            .foregroundStyle(ShotIQColor.graphite)
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
                            PhaseGlyph(active: p == "RELEASE", size: 15)
                        }
                    }
                    HStack(alignment: .bottom) {
                        VStack(spacing: 1) {
                            Text(s.delta).font(.custom("DINCondensed-Bold", size: 20))
                                .foregroundStyle(s.deltaColor)
                            Text(s.deltaLabel).font(.system(size: 7, weight: .bold)).kerning(0.3)
                                .foregroundStyle(s.deltaColor)
                                .lineLimit(1).minimumScaleFactor(0.7)
                        }
                        .frame(width: 84)
                        .padding(.vertical, 7)
                        .background(s.deltaColor.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                        Spacer(minLength: 6)
                        NavigationLink { AnalyticsDetailedView(metric: s.name) } label: {
                            HStack(spacing: 4) {
                                Text("Open session").font(.system(size: 12, weight: .semibold))
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
            Text(value).font(.custom("DINCondensed-Bold", size: 18))
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).font(.system(size: 7, weight: .medium)).kerning(0.3)
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
    @State private var range = "Last 30 days"
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
                            toolItem("rectangle.on.rectangle", "Cards")
                            toolItem("slider.horizontal.3", "Select metric")
                            toolItem("square.and.arrow.up", "Export")
                        }
                    }
                    .padding(.horizontal, 20).frame(height: 56)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        Text("ANALYSIS HISTORY").shotiqDisplay(38).padding(.top, 14)
                        Text("Track your mechanics. See what moves the needle.")
                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                        HStack(spacing: 8) {
                            detailChip("calendar", range, chevron: true)
                            detailChip("chart.xyaxis.line", metric, chevron: true)
                            detailChip(nil, "Confidence: High", chevron: false)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 12) {
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "TREND")
                                    Text("+6.4%").font(.custom("DINCondensed-Bold", size: 30))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Text("vs previous 30 days").font(.system(size: 10))
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .frame(width: 82, alignment: .leading)
                                TrendLine(points: [68, 66.5, 69, 72.5, 68.5, 71, 73.5, 77, 76.2],
                                          stroke: ShotIQColor.confirmGreen)
                                    .frame(height: 92)
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "LATEST")
                                    Text("78.2%").font(.custom("DINCondensed-Bold", size: 30))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text("MAY 24").font(.system(size: 10, weight: .medium))
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
                                            PhaseGlyph(active: p.0 == "RELEASE", size: 24)
                                            Text(p.0).font(.system(size: 7, weight: .bold)).kerning(0.2)
                                                .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.55)
                                            HStack(alignment: .firstTextBaseline, spacing: 2) {
                                                Text("\(p.1)").font(.custom("DINCondensed-Bold", size: 20))
                                                Text("+\(p.2)").font(.system(size: 8, weight: .bold))
                                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                            }
                                            Text(p.3).font(.system(size: 8, weight: .bold))
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
                                Text("METRIC").font(.system(size: 9, weight: .bold)).kerning(0.4)
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
                                    Text(r.0).font(.system(size: 11))
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
                                    Text("AVG ARC").font(.system(size: 8, weight: .semibold))
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("50.4°").font(.custom("DINCondensed-Bold", size: 32))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Text("IDEAL: 48°–52°").font(.system(size: 9, weight: .medium))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(width: 96, alignment: .leading)
                                ArcGauge().frame(height: 90).frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 4) {
                                    MicroLabel(text: "CONSISTENCY")
                                    Text("78.2%").font(.custom("DINCondensed-Bold", size: 28))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text("±3.6°").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
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
            Text(label).font(.system(size: 9)).lineLimit(1).minimumScaleFactor(0.7)
        }
        .foregroundStyle(ShotIQColor.ink)
    }
    private func detailChip(_ icon: String?, _ label: String, chevron: Bool) -> some View {
        Button {} label: {
            HStack(spacing: 5) {
                if let icon { Image(systemName: icon).font(.system(size: 11)) }
                Text(label).font(.system(size: 11, weight: .medium))
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
            Text(line1).font(.system(size: 7, weight: .bold))
            Text(line2).font(.system(size: 6.5)).foregroundStyle(ShotIQColor.graphite)
        }
        .lineLimit(1).minimumScaleFactor(0.6)
        .frame(width: 62)
        .padding(.vertical, 3)
        .background(highlight ? ShotIQColor.warmCanvas : .clear)
    }
    private func compCell(_ value: String, color: Color, highlight: Bool) -> some View {
        Text(value).font(.system(size: 11, weight: .semibold)).foregroundStyle(color)
            .lineLimit(1).minimumScaleFactor(0.6)
            .frame(width: 62)
            .padding(.vertical, 3)
            .background(highlight ? ShotIQColor.warmCanvas : .clear)
    }
    private func railTile(_ label: String, _ color: Color) -> some View {
        VStack(spacing: 0) {
            Rectangle().fill(ShotIQColor.warmCanvas).frame(height: 56)
                .overlay(Image(systemName: "figure.basketball").font(.system(size: 16))
                    .foregroundStyle(ShotIQColor.muted))
            Text(label).font(.system(size: 6.5, weight: .bold)).kerning(0.2)
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
    private let today: [(String, String, String, String, Color)] = [
        ("Pull-Up • Right", "8:24 AM", "82", "GOOD", ShotIQColor.analysisBlue),
        ("Spot-Up • Right", "8:18 AM", "74", "REVIEW", ShotIQColor.reviewRed),
        ("Catch & Shoot • Right", "8:12 AM", "86", "GOOD", ShotIQColor.analysisBlue),
        ("Live Session", "8:01 AM", "80", "GOOD", ShotIQColor.analysisBlue),
        ("Low Dribble Series", "7:45 AM", "88", "GOOD", ShotIQColor.analysisBlue),
        ("Cone Progression", "7:28 AM", "90", "EXCELLENT", ShotIQColor.confirmGreen)
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-my-media") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Primary target").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 12)
                        Text("Keep elbow stacked through release").shotiqBody(14, weight: .semibold)
                            .padding(.top, 2)
                        ShotIQCard {
                            HStack(spacing: 0) {
                                VStack(spacing: 3) {
                                    Text("FORM SCORE").font(.system(size: 8, weight: .semibold)).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("82").font(.custom("DINCondensed-Bold", size: 26))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("GOOD").font(.system(size: 8, weight: .bold))
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
                            Button {} label: {
                                HStack(spacing: 7) {
                                    Image(systemName: "square.and.arrow.up")
                                    Text("Upload").font(.system(size: 15, weight: .medium))
                                }
                                .padding(.horizontal, 16).frame(height: 46)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                        }
                        .padding(.top, 16)
                        Text("Review your shots and training sessions.")
                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                        HStack(spacing: 0) {
                            ForEach(["All", "Images", "Videos", "Live", "Workouts"], id: \.self) { s in
                                Button { segment = s } label: {
                                    Text(s).font(.system(size: 13, weight: segment == s ? .semibold : .regular))
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
                            mediaTool("slider.horizontal.3", "Filter")
                            mediaTool("arrow.up.arrow.down", "Sort: Newest")
                            mediaTool("viewfinder", "Select")
                        }
                        .padding(.top, 10)
                        HStack {
                            SectionLabel(text: "TODAY")
                            Spacer()
                            Text("12 ITEMS").font(.system(size: 10, weight: .semibold)).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 18)
                        let cols = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)
                        LazyVGrid(columns: cols, spacing: 14) {
                            ForEach(Array(today.enumerated()), id: \.offset) { i, t in
                                NavigationLink { MediaDetailView() } label: {
                                    mediaTile(t, duration: "0:0\((i + 3) % 9)")
                                }
                            }
                        }
                        .padding(.top, 10)
                        HStack {
                            SectionLabel(text: "YESTERDAY")
                            Spacer()
                            Text("8 ITEMS").font(.system(size: 10, weight: .semibold)).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 20)
                        HStack(spacing: 8) {
                            ForEach(0..<4, id: \.self) { i in
                                NavigationLink { MediaDetailView() } label: {
                                    PhotoThumb(height: 66)
                                        .overlay(alignment: .bottomLeading) {
                                            Text("0:0\((i + 4) % 9)")
                                                .font(.custom("DINCondensed-Bold", size: 10))
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
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func mediaStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 3) {
            Text(value).font(.custom("DINCondensed-Bold", size: 26)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).font(.system(size: 8, weight: .medium)).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func mediaTool(_ icon: String, _ label: String) -> some View {
        Button {} label: {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.system(size: 12))
                Text(label).font(.system(size: 12, weight: .medium))
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity).frame(height: 40)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
            .foregroundStyle(ShotIQColor.ink)
        }
    }
    private func mediaTile(_ t: (String, String, String, String, Color), duration: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            PhotoThumb(height: 112)
                .overlay(alignment: .bottomLeading) {
                    Text(duration).font(.custom("DINCondensed-Bold", size: 11))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 5).padding(.vertical, 2)
                        .background(.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 3))
                        .padding(5)
                }
                .overlay(alignment: .bottomTrailing) {
                    Image(systemName: t.3 == "REVIEW" ? "exclamationmark.circle.fill" : "checkmark.circle.fill")
                        .font(.system(size: 15))
                        .foregroundStyle(t.3 == "REVIEW" ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen)
                        .background(Circle().fill(.white).padding(2))
                        .padding(5)
                }
            HStack(alignment: .top, spacing: 4) {
                VStack(alignment: .leading, spacing: 1) {
                    Text(t.0).font(.system(size: 9.5, weight: .semibold))
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.6)
                    Text(t.1).font(.system(size: 8.5)).foregroundStyle(ShotIQColor.graphite)
                }
                Spacer(minLength: 2)
                VStack(alignment: .trailing, spacing: 1) {
                    Text(t.2).font(.custom("DINCondensed-Bold", size: 16)).foregroundStyle(t.4)
                    Text(t.3).font(.system(size: 6.5, weight: .bold)).foregroundStyle(t.4)
                        .lineLimit(1).minimumScaleFactor(0.6)
                }
            }
        }
    }
}

struct MediaDetailView: View {      // 069
    @Environment(\.dismiss) private var dismiss
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
                        Image(systemName: "ellipsis").font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
                    }
                    .padding(.horizontal, 20).frame(height: 52)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        ZStack {
                            MediaSurface(height: 310, duration: "6:12")
                            Circle().fill(.white.opacity(0.9)).frame(width: 52, height: 52)
                                .overlay(Image(systemName: "play.fill").font(.system(size: 19))
                                    .foregroundStyle(ShotIQColor.ink))
                        }
                        .overlay(alignment: .topLeading) {
                            Text("6:12").font(.custom("DINCondensed-Bold", size: 13)).foregroundStyle(.white)
                                .padding(.horizontal, 8).padding(.vertical, 4)
                                .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 4))
                                .padding(10)
                        }
                        .overlay(alignment: .topTrailing) {
                            Text("SLOW 1.0x").font(.system(size: 10, weight: .bold)).kerning(0.4)
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8).padding(.vertical, 5)
                                .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 4))
                                .padding(10)
                        }
                        .padding(.top, 14)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(0..<8, id: \.self) { i in
                                    RoundedRectangle(cornerRadius: 5)
                                        .fill(ShotIQColor.warmCanvas)
                                        .frame(width: 48, height: 38)
                                        .overlay(RoundedRectangle(cornerRadius: 5)
                                            .stroke(i == 4 ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                                                    lineWidth: i == 4 ? 2 : 1))
                                }
                            }
                            .padding(.vertical, 2)
                        }
                        .padding(.top, 10)
                        SectionLabel(text: "CAPTURE DETAILS").padding(.top, 18)
                        Text("MAY 21, 2025 • 8:24 AM").font(.custom("DINCondensed-Bold", size: 24))
                            .padding(.top, 6)
                        Text("Indoor Court • iPhone 15 Pro • 1080p • 60fps")
                            .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                        SectionLabel(text: "LINKED ANALYSIS").padding(.top, 18)
                        ShotIQCard {
                            HStack(spacing: 12) {
                                PhotoThumb(width: 62, height: 48, icon: "chart.xyaxis.line")
                                VStack(alignment: .leading, spacing: 3) {
                                    HStack(spacing: 4) {
                                        Text("Shot Analysis").font(.system(size: 14, weight: .bold))
                                        Text("• May 21, 2025").font(.system(size: 11))
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(1).minimumScaleFactor(0.7)
                                    }
                                    Text("Form Score").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                    HStack(spacing: 8) {
                                        Text("82").font(.custom("DINCondensed-Bold", size: 22))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: 0.82).frame(width: 76)
                                    }
                                }
                                Spacer(minLength: 4)
                                NavigationLink { AnalysisResultOverviewView() } label: {
                                    HStack(spacing: 4) {
                                        Text("Open analysis").font(.system(size: 12, weight: .semibold))
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
                        VStack(alignment: .leading, spacing: 5) {
                            MicroLabel(text: "PRIMARY COACHING TARGET")
                            HStack {
                                Text("Keep elbow stacked through release").shotiqBody(17, weight: .bold)
                                    .lineLimit(1).minimumScaleFactor(0.8)
                                Spacer()
                                Image(systemName: "chevron.right").font(.system(size: 13))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .padding(.vertical, 14)
                        .overlay(HRule(), alignment: .top)
                        .overlay(HRule(), alignment: .bottom)
                        .padding(.top, 18)
                        SectionLabel(text: "ACTIONS").padding(.top, 16)
                        HStack(spacing: 8) {
                            actionButton("play.fill", "Play", ShotIQColor.ink)
                            actionButton("square.and.arrow.up", "Share", ShotIQColor.ink)
                            actionButton("arrow.down.to.line", "Download", ShotIQColor.ink)
                            actionButton("trash", "Delete", ShotIQColor.reviewRed)
                        }
                        .padding(.top, 8)
                        HStack(spacing: 10) {
                            Image(systemName: "trash").font(.system(size: 15))
                                .foregroundStyle(ShotIQColor.reviewRed)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Delete this media?").font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(ShotIQColor.reviewRed)
                                Text("This action cannot be undone.")
                                    .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer(minLength: 4)
                            Button {} label: {
                                Text("Delete media").font(.system(size: 13, weight: .semibold))
                                    .padding(.horizontal, 12).padding(.vertical, 9)
                                    .background(ShotIQColor.reviewRed, in: RoundedRectangle(cornerRadius: 7))
                                    .foregroundStyle(.white)
                            }
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
    }
    private func actionButton(_ icon: String, _ label: String, _ color: Color) -> some View {
        Button {} label: {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.system(size: 12))
                Text(label).font(.system(size: 12, weight: .medium))
                    .lineLimit(1).minimumScaleFactor(0.6)
            }
            .frame(maxWidth: .infinity).frame(height: 46)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
            .foregroundStyle(color)
        }
    }
}

struct ProfileView: View {          // 070
    @EnvironmentObject var app: AppState
    var body: some View {
        CanonicalScreen(testID: "screen-ios-profile") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: 16) {
                            ZStack(alignment: .bottomTrailing) {
                                Circle().fill(ShotIQColor.rule).frame(width: 86, height: 86)
                                    .overlay(Text(shotiqInitials(app.user))
                                        .font(.system(size: 26, weight: .bold))
                                        .foregroundStyle(ShotIQColor.graphite))
                                Circle().fill(ShotIQColor.paper).frame(width: 28, height: 28)
                                    .overlay(Circle().stroke(ShotIQColor.rule))
                                    .overlay(Image(systemName: "pencil").font(.system(size: 12))
                                        .foregroundStyle(ShotIQColor.ink))
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text((app.user?.displayName ?? "Jordan Ellis").uppercased()).shotiqDisplay(32)
                                Text("Right-handed • Advanced").font(.system(size: 14))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .padding(.top, 18)
                        HStack(spacing: 0) {
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK").frame(maxWidth: .infinity)
                            VRule(height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                .frame(maxWidth: .infinity)
                            VRule(height: 46)
                            profileStat("24", "SHOTS")
                            VRule(height: 46)
                            profileStat("15", "MAKES")
                            VRule(height: 46)
                            profileStat("62.5%", "MAKE %")
                        }
                        .padding(.vertical, 16)
                        PrimaryButton(title: "Edit player profile", icon: "camera.viewfinder")
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
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                SectionLabel(text: "PLAYER CARD")
                                HStack(spacing: 14) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 8).fill(ShotIQColor.ink)
                                            .frame(width: 140, height: 94)
                                        VStack(spacing: 5) {
                                            HStack(spacing: 0) {
                                                Text("SHOT").font(.system(size: 9, weight: .black).width(.condensed))
                                                    .foregroundStyle(.white)
                                                Text("IQ").font(.system(size: 9, weight: .black).width(.condensed))
                                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                            }
                                            Text(shotiqInitials(app.user))
                                                .font(.system(size: 28, weight: .heavy).width(.condensed))
                                                .foregroundStyle(.white)
                                            Text((app.user?.displayName ?? "Jordan Ellis").uppercased())
                                                .font(.system(size: 8, weight: .semibold)).kerning(1)
                                                .foregroundStyle(.white)
                                                .lineLimit(1).minimumScaleFactor(0.7)
                                        }
                                    }
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("Share your profile and latest highlights.")
                                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                        NavigationLink { PlayerCardView() } label: {
                                            HStack(spacing: 5) {
                                                Text("View player card").font(.system(size: 14, weight: .semibold))
                                                Image(systemName: "chevron.right").font(.system(size: 11))
                                            }
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        }
                                    }
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    SectionLabel(text: "ABOUT \((app.user?.firstName ?? "Jordan").uppercased())")
                                    Spacer()
                                    HStack(spacing: 5) {
                                        Image(systemName: "sparkles").font(.system(size: 12))
                                        Text("Enhance bio").font(.system(size: 13, weight: .medium))
                                    }
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                }
                                Text("Dedicated to the details. Constantly working to build a repeatable, efficient shot with elite consistency.")
                                    .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .padding(14)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    SectionLabel(text: "PROFILE COMPLETION")
                                    Spacer()
                                    Text("82%").font(.custom("DINCondensed-Bold", size: 24))
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
                            row("person.crop.square", "Player card", AnyView(PlayerCardView()))
                            row("photo.stack", "My media", AnyView(MyMediaView()))
                            row("target", "Goals", AnyView(GoalsView()))
                            row("gearshape", "Settings", AnyView(SettingsHubView()))
                            row("square.and.arrow.up", "Share results", AnyView(ShareResultsView()))
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
    }
    private func profileStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 3) {
            Text(value).font(.custom("DINCondensed-Bold", size: 24)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).font(.system(size: 9, weight: .medium)).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func physCol(_ icon: String, _ value: String, _ label: String) -> some View {
        VStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 19)).foregroundStyle(ShotIQColor.ink)
            Text(value).font(.custom("DINCondensed-Bold", size: 22)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).font(.system(size: 7.5, weight: .medium)).kerning(0.3)
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
            Text(label).font(.system(size: 9)).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    private func accountRow(_ icon: String, _ label: String, _ value: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(ShotIQColor.ink)
            VStack(alignment: .leading, spacing: 1) {
                Text(label).font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                Text(value).font(.system(size: 12, weight: .semibold))
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
                    Text(title).font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.6)
                    Text(date).font(.system(size: 9)).foregroundStyle(ShotIQColor.graphite)
                }
                Spacer(minLength: 2)
                Image(systemName: "chevron.right").font(.system(size: 10))
                    .foregroundStyle(ShotIQColor.graphite)
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
            .overlay(HRule(), alignment: .bottom)
        }
    }
}

struct SettingsHubView: View {      // 071
    @EnvironmentObject var app: AppState
    @AppStorage("notifications") private var notifs = true
    @AppStorage("coachingAudio") private var audio = true
    @AppStorage("units") private var metric = false
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
                                    .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
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
                                            .font(.system(size: 19, weight: .bold))
                                            .foregroundStyle(ShotIQColor.graphite))
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text((app.user?.displayName ?? "Jordan Ellis").uppercased())
                                            .shotiqDisplay(26)
                                        Text("Right-handed • Advanced").font(.system(size: 13))
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(14)
                                HRule()
                                HStack(spacing: 0) {
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("FORM SCORE").font(.system(size: 8, weight: .semibold)).kerning(0.4)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("82").font(.custom("DINCondensed-Bold", size: 28))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: 0.82).frame(width: 58)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    settingsStat("24", "SHOTS")
                                    settingsStat("15", "MAKES")
                                    settingsStat("62.5%", "MAKE %")
                                    VStack(spacing: 3) {
                                        Text("+8.1%").font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                        Text("VS LAST SESSION").font(.system(size: 6.5, weight: .medium))
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(1).minimumScaleFactor(0.6)
                                    }
                                    .frame(maxWidth: .infinity)
                                }
                                .padding(14)
                                HRule()
                                Button {} label: {
                                    HStack(spacing: 12) {
                                        Image(systemName: "person.crop.square")
                                            .font(.system(size: 16)).foregroundStyle(ShotIQColor.ink)
                                        Text("Edit profile").font(.system(size: 15, weight: .semibold))
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
                                    }
                                HRule().padding(.leading, 14)
                                settingsToggle("Coaching audio cues", "Voice cues while you train.", $audio)
                                HRule().padding(.leading, 14)
                                settingsToggle("Metric units", "Use metric units across the app.", $metric)
                            }
                        }
                        .padding(.top, 8)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                settingsRow("bell", "Notifications", "Manage alerts, reminders, and updates.",
                                            status: "3 ON", statusColor: ShotIQColor.analysisBlue)
                                HRule().padding(.leading, 14)
                                settingsRow("arrow.triangle.2.circlepath", "Automation",
                                            "Auto-analysis, uploads, and data handling.",
                                            status: "2 ACTIVE", statusColor: ShotIQColor.confirmGreen)
                                HRule().padding(.leading, 14)
                                settingsRow("lock.shield", "Data and privacy",
                                            "Control your data, export, and permissions.",
                                            status: nil, statusColor: nil)
                                HRule().padding(.leading, 14)
                                settingsRow("questionmark.circle", "Help and support",
                                            "FAQs, guides, and contact options.",
                                            status: nil, statusColor: nil)
                                HRule().padding(.leading, 14)
                                settingsRow("info.circle", "About ShotIQ",
                                            "Version 1.0.0, terms, and app information.",
                                            status: nil, statusColor: nil)
                            }
                        }
                        .padding(.top, 14)
                        ShotIQCard {
                            Button { app.signOut() } label: {
                                HStack(spacing: 12) {
                                    Image(systemName: "rectangle.portrait.and.arrow.right")
                                        .font(.system(size: 15)).frame(width: 26)
                                    Text("Sign out").font(.system(size: 15, weight: .semibold))
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
    }
    private func settingsStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 3) {
            Text(value).font(.custom("DINCondensed-Bold", size: 22)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).font(.system(size: 7.5, weight: .medium)).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func settingsToggle(_ title: String, _ caption: String, _ isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 15, weight: .semibold))
                Text(caption).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
            }
        }
        .tint(ShotIQColor.shotiqOrange)
        .padding(14)
    }
    private func settingsRow(_ icon: String, _ title: String, _ caption: String,
                             status: String?, statusColor: Color?) -> some View {
        Button {} label: {
            HStack(spacing: 12) {
                Image(systemName: icon).font(.system(size: 17))
                    .foregroundStyle(ShotIQColor.ink).frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(ShotIQColor.ink)
                    Text(caption).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1).minimumScaleFactor(0.8)
                }
                Spacer(minLength: 4)
                if let status, let statusColor {
                    Text(status).font(.system(size: 11, weight: .bold)).kerning(0.4)
                        .foregroundStyle(statusColor)
                }
                Image(systemName: "chevron.right").font(.system(size: 13))
                    .foregroundStyle(ShotIQColor.graphite)
            }
            .padding(14)
        }
    }
}

struct ShareResultsView: View {     // 072
    @EnvironmentObject var app: AppState
    var body: some View {
        CanonicalScreen(testID: "screen-ios-share-results") {
            ScrollView {
                VStack(spacing: 0) {
                    Text("SHARE RESULTS").shotiqDisplay(34).padding(.top, 24)
                    Text("Preview what others will see. Private data is excluded.")
                        .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
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
                                    Text("Right-handed • Advanced").font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer(minLength: 8)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("FORM SCORE").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("82").font(.custom("DINCondensed-Bold", size: 44))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: 0.82).frame(width: 88)
                                }
                            }
                            HRule()
                            HStack(alignment: .center) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("PRIMARY COACHING TARGET")
                                        .font(.system(size: 9, weight: .semibold)).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("Keep elbow stacked through release").shotiqBody(15, weight: .bold)
                                        .lineLimit(2).minimumScaleFactor(0.8)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 8)
                                VStack(alignment: .trailing, spacing: 5) {
                                    Text("ACTIVE GOAL").font(.system(size: 9, weight: .bold)).kerning(0.4)
                                        .padding(.horizontal, 7).padding(.vertical, 3)
                                        .overlay(RoundedRectangle(cornerRadius: 4).stroke(ShotIQColor.confirmGreen))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    HStack(spacing: 6) {
                                        Text("72%").font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                        ScoreBar(pct: 0.72, color: ShotIQColor.confirmGreen).frame(width: 54)
                                    }
                                }
                            }
                            HStack(alignment: .top, spacing: 12) {
                                PhotoThumb(height: 176).frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 9) {
                                    Text("MECHANICS HIGHLIGHTS")
                                        .font(.system(size: 9, weight: .semibold)).kerning(0.5)
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
                                    Text("+8.1%").font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Text("VS LAST SESSION").font(.system(size: 6.5, weight: .medium))
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
                    Text("SHARE PREVIEW").font(.system(size: 11, weight: .bold)).kerning(0.8)
                        .padding(.top, 20)
                    HStack(spacing: 10) {
                        ShareLink(item: "My ShotIQ form score: 82 (GOOD) — 62.5% make rate, trending +8.1%. 🏀") {
                            shareOption("square.and.arrow.up", "Share image", ShotIQColor.shotiqOrange)
                        }
                        Button {} label: { shareOption("arrow.down.to.line", "Save image", ShotIQColor.ink) }
                        Button {} label: { shareOption("square.on.square", "Copy", ShotIQColor.ink) }
                        Button {} label: { shareOption("ellipsis", "More", ShotIQColor.ink) }
                    }
                    .padding(.horizontal, 20).padding(.top, 12)
                    HStack(spacing: 6) {
                        Image(systemName: "lock").font(.system(size: 11))
                        Text("Private media, session clips, and personal notes are not included.")
                            .font(.system(size: 11))
                            .lineLimit(1).minimumScaleFactor(0.8)
                    }
                    .foregroundStyle(ShotIQColor.graphite)
                    .padding(.horizontal, 20)
                    .padding(.top, 14).padding(.bottom, 30)
                }
            }
        }
    }
    private func shareStat(_ icon: String, _ value: String, _ label: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
            VStack(alignment: .leading, spacing: 0) {
                Text(value).font(.custom("DINCondensed-Bold", size: 16))
                Text(label).font(.system(size: 6.5, weight: .medium)).kerning(0.3)
                    .foregroundStyle(ShotIQColor.graphite)
            }
        }
    }
    private func highlight(_ icon: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
                Text(label).font(.system(size: 9, weight: .semibold)).kerning(0.3)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            Text("GOOD").font(.system(size: 10, weight: .bold))
                .foregroundStyle(ShotIQColor.analysisBlue)
                .padding(.leading, 18)
        }
    }
    private func shareBottomStat(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.custom("DINCondensed-Bold", size: 22)).foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).font(.system(size: 7.5, weight: .medium)).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func shareOption(_ icon: String, _ label: String, _ tint: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 20)).foregroundStyle(tint)
            Text(label).font(.system(size: 11, weight: .medium)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity).frame(height: 76)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
    }
}
