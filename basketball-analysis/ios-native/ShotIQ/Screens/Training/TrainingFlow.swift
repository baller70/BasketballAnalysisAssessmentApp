import SwiftUI

// Training flow — screens 054-062. Drill execution mirrors the web contract:
// marks POST to /api/shot-events via APIClient.

struct TrainingHomeView: View {     // 054
    var body: some View {
        CanonicalScreen(testID: "screen-ios-training-home") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("TRAINING").shotiqDisplay(40).padding(.top, 24)
                    ShotIQCard {
                        HStack(spacing: 14) {
                            Circle().fill(ShotIQColor.analysisBlue).frame(width: 46, height: 46)
                                .overlay(Image(systemName: "figure.run").foregroundStyle(.white))
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Quick Release Builder").shotiqBody(16, weight: .semibold)
                                Text("20 min · Form Focus · targets your #1 flaw")
                                    .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            NavigationLink { QuickStartView() } label: {
                                Text("Start").font(.system(size: 14, weight: .semibold))
                                    .padding(.horizontal, 18).padding(.vertical, 9)
                                    .background(ShotIQColor.shotiqOrange, in: Capsule())
                                    .foregroundStyle(.white)
                            }
                        }
                        .padding(16)
                    }
                    .padding(.top, 16)
                    VStack(spacing: 12) {
                        row("magnifyingglass", "Discover drills", DiscoverDrillsView())
                        row("bookmark", "My drills", MyDrillsView())
                        row("calendar", "Workout calendar", WorkoutCalendarView())
                        row("target", "Shot tracker", ShotTrackerView())
                    }
                    .padding(.top, 20)
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
    private func row(_ icon: String, _ t: String, _ dest: some View) -> some View {
        NavigationLink { dest } label: {
            HStack(spacing: 14) {
                Image(systemName: icon).frame(width: 30)
                Text(t).shotiqBody(16, weight: .semibold)
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
            }
            .padding(16).foregroundStyle(ShotIQColor.ink)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        }
    }
}

struct QuickStartView: View {       // 055
    var body: some View {
        CanonicalScreen(testID: "screen-ios-quick-start") {
            VStack(alignment: .leading, spacing: 0) {
                Text("QUICK START").shotiqDisplay(40).padding(.top, 24)
                Text("Today's recommended session, built from your last analysis.")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                ForEach([("1", "Wall Elbow Alignment", "8 min"), ("2", "Quick Release Builder", "12 min"),
                         ("3", "Free Throw Ladder", "10 min")], id: \.0) { n, t, d in
                    HStack(spacing: 14) {
                        Circle().stroke(ShotIQColor.shotiqOrange, lineWidth: 2).frame(width: 34, height: 34)
                            .overlay(Text(n).font(.custom("DINCondensed-Bold", size: 18)))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(t).shotiqBody(15, weight: .semibold)
                            Text(d).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                    }
                    .padding(.vertical, 12)
                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                }
                Spacer()
                NavigationLink { DrillExecutionView(drillName: "Wall Elbow Alignment") } label: {
                    Text("Start session · 30 min").frame(maxWidth: .infinity).frame(height: 54)
                        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                }
                .padding(.bottom, 26)
            }
            .padding(.horizontal, 24)
        }
    }
}

struct DiscoverDrillsView: View {   // 056
    @State private var filter = "All"
    var body: some View {
        CanonicalScreen(testID: "screen-ios-discover-drills") {
            VStack(alignment: .leading, spacing: 0) {
                Text("DISCOVER DRILLS").shotiqDisplay(38).padding(.horizontal, 24).padding(.top, 24)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(["All", "Form", "Release", "Balance", "Footwork", "Conditioning"], id: \.self) { f in
                            Button { filter = f } label: {
                                Text(f).font(.system(size: 14, weight: filter == f ? .semibold : .regular))
                                    .padding(.horizontal, 16).padding(.vertical, 8)
                                    .background(filter == f ? ShotIQColor.ink : ShotIQColor.paper, in: Capsule())
                                    .overlay(Capsule().stroke(ShotIQColor.rule))
                                    .foregroundStyle(filter == f ? .white : ShotIQColor.ink)
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                }
                .padding(.top, 12)
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach([("Pound Crossover Foundation", "Ball Handling · Beginner · 6 min"),
                                 ("Quick Release Builder", "Form Focus · Intermediate · 12 min"),
                                 ("One-Hand Form Shooting", "Form · Beginner · 8 min"),
                                 ("Elbow Alignment Wall Drill", "Form · Beginner · 8 min"),
                                 ("Catch & Shoot Ladder", "Shooting · Advanced · 15 min")], id: \.0) { t, d in
                            NavigationLink { DrillDetailView(name: t) } label: {
                                HStack(spacing: 14) {
                                    MediaSurface(height: 62).frame(width: 100)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(t).shotiqBody(15, weight: .semibold).multilineTextAlignment(.leading)
                                        Text(d).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(12)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            }
                        }
                    }
                    .padding(24)
                }
            }
        }
    }
}

struct DrillDetailView: View {      // 057
    var name = "Pound Crossover Foundation"
    var body: some View {
        CanonicalScreen(testID: "screen-ios-drill-detail") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text(name.uppercased()).shotiqDisplay(34).padding(.top, 24)
                    HStack(spacing: 8) {
                        ForEach(["Ball Handling", "Beginner", "6 min", "Right Hand"], id: \.self) { c in
                            Text(c).font(.system(size: 12)).padding(.horizontal, 11).padding(.vertical, 5)
                                .overlay(Capsule().stroke(ShotIQColor.rule))
                        }
                    }
                    .padding(.top, 10)
                    MediaSurface(height: 240).padding(.top, 16)
                    SectionLabel(text: "HOW TO DO IT").padding(.top, 20)
                    ForEach(Array(["Set feet shoulder width, ball in right hand.",
                                   "Pound the ball hard at knee height.",
                                   "Cross over below the knees, stay low.",
                                   "Repeat for 45 seconds, then switch hands."].enumerated()), id: \.offset) { i, s in
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(i + 1)").font(.custom("DINCondensed-Bold", size: 20))
                                .foregroundStyle(ShotIQColor.shotiqOrange).frame(width: 22)
                            Text(s).shotiqBody(14)
                            Spacer()
                        }
                        .padding(.vertical, 7)
                    }
                    SectionLabel(text: "TARGETS").padding(.top, 14)
                    Text("Hand speed · control under fatigue · low stance")
                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                    NavigationLink { DrillExecutionView(drillName: name) } label: {
                        Text("Start drill").frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                    }
                    .padding(.vertical, 24)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct MyDrillsView: View {         // 058
    var body: some View {
        CanonicalScreen(testID: "screen-ios-my-drills") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("MY DRILLS").shotiqDisplay(40).padding(.top, 24)
                    SectionLabel(text: "SAVED").padding(.top, 16)
                    ForEach([("Quick Release Builder", "3x this week"), ("Wall Elbow Alignment", "Last: yesterday"),
                             ("Free Throw Ladder", "Last: 3 days ago")], id: \.0) { t, d in
                        NavigationLink { DrillDetailView(name: t) } label: {
                            HStack {
                                Image(systemName: "bookmark.fill").foregroundStyle(ShotIQColor.shotiqOrange).frame(width: 28)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(t).shotiqBody(15, weight: .semibold)
                                    Text(d).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.vertical, 12)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        }
                    }
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct WorkoutCalendarView: View {  // 059
    @State private var selected = 12
    var body: some View {
        CanonicalScreen(testID: "screen-ios-workout-calendar") {
            VStack(alignment: .leading, spacing: 0) {
                Text("WORKOUT CALENDAR").shotiqDisplay(36).padding(.top, 24)
                Text("May 2025").shotiqBody(15, weight: .semibold).padding(.top, 12)
                let cols = Array(repeating: GridItem(.flexible()), count: 7)
                LazyVGrid(columns: cols, spacing: 8) {
                    ForEach(["S", "M", "T", "W", "T2", "F", "S2"], id: \.self) { d in
                        Text(String(d.prefix(1))).font(.system(size: 11, weight: .bold))
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    ForEach(1...31, id: \.self) { d in
                        Button { selected = d } label: {
                            Text("\(d)").font(.system(size: 14, weight: selected == d ? .bold : .regular))
                                .frame(width: 38, height: 38)
                                .background(selected == d ? ShotIQColor.shotiqOrange : .clear, in: Circle())
                                .foregroundStyle(selected == d ? .white : ShotIQColor.ink)
                                .overlay(alignment: .bottom) {
                                    if [3, 6, 10, 12].contains(d) && selected != d {
                                        Circle().fill(ShotIQColor.confirmGreen).frame(width: 5, height: 5).offset(y: -2)
                                    }
                                }
                        }
                    }
                }
                .padding(.top, 10)
                SectionLabel(text: "MAY \(selected)").padding(.top, 18)
                ShotIQCard {
                    HStack {
                        Image(systemName: "figure.run").frame(width: 30)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Quick Release Builder").shotiqBody(15, weight: .semibold)
                            Text("Scheduled · 20 min").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                        NavigationLink { DrillExecutionView(drillName: "Quick Release Builder") } label: {
                            Text("Start").font(.system(size: 13, weight: .semibold)).foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                    }
                    .padding(14)
                }
                .padding(.top, 8)
                Spacer()
            }
            .padding(.horizontal, 24)
        }
    }
}

@MainActor
final class DrillSessionModel: ObservableObject {
    @Published var shots: [(n: Int, made: Bool)] = []
    @Published var elapsed = 0
    @Published var paused = false
    private var n = 0
    private var timer: Timer?
    var makes: Int { shots.filter(\.made).count }
    var pct: Double { shots.isEmpty ? 0 : Double(makes) / Double(shots.count) }

    func start() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in if let self, !self.paused { self.elapsed += 1 } }
        }
    }
    func stop() { timer?.invalidate() }
    func mark(_ made: Bool, drillId: String) {
        n += 1; shots.append((n, made))
        Task { await APIClient.shared.recordShotEvent(drillId: drillId, made: made) }
    }
    func undo() { if !shots.isEmpty { shots.removeLast() } }
}

struct DrillExecutionView: View {   // 060
    var drillName = "Pound Crossover Foundation"
    @StateObject private var m = DrillSessionModel()
    var body: some View {
        CanonicalScreen(testID: "screen-ios-drill-execution") {
            VStack(spacing: 0) {
                HStack {
                    Text(drillName.uppercased()).shotiqDisplay(26)
                    Spacer()
                    Text(String(format: "%02d:%02d", m.elapsed / 60, m.elapsed % 60))
                        .font(.custom("DINCondensed-Bold", size: 24))
                }
                .padding(.horizontal, 20).padding(.top, 16)
                ZStack(alignment: .topLeading) {
                    MediaSurface(height: 330)
                    HStack(spacing: 6) {
                        Circle().fill(ShotIQColor.shotiqOrange).frame(width: 7, height: 7)
                        Text("LIVE").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                    }
                    .padding(.horizontal, 9).padding(.vertical, 5)
                    .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 4))
                    .padding(10)
                }
                .padding(.horizontal, 20).padding(.top, 10)
                HStack(spacing: 26) {
                    StatBlock(value: "\(m.shots.count)", label: "SHOTS", valueSize: 30)
                    StatBlock(value: "\(m.makes)", label: "MAKES", color: ShotIQColor.confirmGreen, valueSize: 30)
                    StatBlock(value: String(format: "%.0f%%", m.pct * 100), label: "MAKE %", valueSize: 30)
                    Spacer()
                    Ring(pct: m.pct, color: ShotIQColor.confirmGreen, lineWidth: 6).frame(width: 52, height: 52)
                }
                .padding(.horizontal, 24).padding(.top, 14)
                HStack(spacing: 12) {
                    Button { m.mark(true, drillId: drillName) } label: {
                        Label("Make", systemImage: "checkmark.circle")
                            .frame(maxWidth: .infinity).frame(height: 50)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.confirmGreen, lineWidth: 2))
                            .foregroundStyle(ShotIQColor.confirmGreen)
                    }
                    .accessibilityIdentifier("mark-make")
                    Button { m.mark(false, drillId: drillName) } label: {
                        Label("Miss", systemImage: "xmark.circle")
                            .frame(maxWidth: .infinity).frame(height: 50)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.reviewRed, lineWidth: 2))
                            .foregroundStyle(ShotIQColor.reviewRed)
                    }
                    .accessibilityIdentifier("mark-miss")
                    Button { m.undo() } label: {
                        Image(systemName: "arrow.uturn.backward").frame(width: 52, height: 50)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .accessibilityLabel("Undo last shot")
                }
                .padding(.horizontal, 20).padding(.top, 14)
                HStack(spacing: 12) {
                    Button { m.paused.toggle() } label: {
                        Text(m.paused ? "Resume" : "Pause").frame(maxWidth: .infinity).frame(height: 46)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 15, weight: .medium))
                    }
                    NavigationLink { WorkoutCompletionView(shots: m.shots.count, makes: m.makes) } label: {
                        Text("End workout").frame(maxWidth: .infinity).frame(height: 46)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink).font(.system(size: 15))
                    }
                }
                .padding(.horizontal, 20).padding(.top, 10)
                Spacer()
            }
        }
        .onAppear { m.start() }
        .onDisappear { m.stop() }
    }
}

struct ShotTrackerView: View {      // 061
    var body: some View {
        CanonicalScreen(testID: "screen-ios-shot-tracker") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("SHOT TRACKER").shotiqDisplay(38).padding(.top, 24)
                    HStack {
                        Ring(pct: 0.625, color: ShotIQColor.confirmGreen).frame(width: 110, height: 110)
                            .overlay(VStack {
                                Text("62.5%").font(.custom("DINCondensed-Bold", size: 26))
                                Text("MAKE %").font(.system(size: 9, weight: .bold)).foregroundStyle(ShotIQColor.graphite)
                            })
                        Spacer()
                        StatBlock(value: "24", label: "SHOTS", valueSize: 34)
                        StatBlock(value: "15", label: "MAKES", color: ShotIQColor.confirmGreen, valueSize: 34)
                        StatBlock(value: "9", label: "MISSES", color: ShotIQColor.reviewRed, valueSize: 34)
                    }
                    .padding(.top, 18)
                    SectionLabel(text: "LAST 24 SHOTS").padding(.top, 22)
                    let cols = Array(repeating: GridItem(.flexible()), count: 12)
                    LazyVGrid(columns: cols, spacing: 8) {
                        ForEach(0..<24, id: \.self) { i in
                            Image(systemName: i % 3 == 2 ? "xmark.circle.fill" : "checkmark.circle.fill")
                                .foregroundStyle(i % 3 == 2 ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen)
                        }
                    }
                    .padding(.top, 8)
                    SectionLabel(text: "MAKE % BY SESSION").padding(.top, 22)
                    ShotIQCard {
                        TrendLine(points: [52, 55, 58, 54, 60, 62.5], stroke: ShotIQColor.analysisBlue)
                            .frame(height: 130).padding(14)
                    }
                    .padding(.top, 8)
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct WorkoutCompletionView: View { // 062
    var shots = 24; var makes = 15
    var body: some View {
        CanonicalScreen(testID: "screen-ios-workout-completion") {
            VStack(spacing: 0) {
                Spacer()
                Image(systemName: "trophy").font(.system(size: 56, weight: .light))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                Text("WORKOUT COMPLETE").shotiqDisplay(36).padding(.top, 20)
                HStack(spacing: 30) {
                    StatBlock(value: "\(shots)", label: "SHOTS", valueSize: 36)
                    StatBlock(value: "\(makes)", label: "MAKES", color: ShotIQColor.confirmGreen, valueSize: 36)
                    StatBlock(value: shots > 0 ? String(format: "%.0f%%", Double(makes) / Double(shots) * 100) : "—",
                              label: "MAKE %", valueSize: 36)
                }
                .padding(.top, 22)
                Text("+120 points earned").font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(ShotIQColor.confirmGreen).padding(.top, 16)
                Spacer()
                PrimaryButton(title: "Done").padding(.horizontal, 24).padding(.bottom, 30)
            }
        }
    }
}
