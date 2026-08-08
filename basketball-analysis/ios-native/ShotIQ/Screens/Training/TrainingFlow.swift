import SwiftUI

// Training flow — screens 054-062. Drill execution mirrors the web contract:
// marks POST to /api/shot-events via APIClient.

// MARK: - Shared training helpers (canonical 054 look)

/// Court photography slot. `photo` is a canonical crop key (see
/// `CanonicalPhoto`). Older screens left this nil and showed a gray icon box;
/// production paths now fall back to bundled basketball imagery so list/detail
/// cards still have a visible shot-related frame.
enum PhotoThumbMediaResolver {
    static func photoKey(explicit photo: String?, icon: String) -> String {
        if let photo { return photo }
        if icon.contains("play") { return "068-visual-002" }
        if icon.contains("chart") { return "069-visual-004" }
        if icon.contains("target") { return "065-visual-001" }
        if icon.contains("viewfinder") || icon.contains("camera") {
            return "054-visual-001"
        }
        return "054-visual-003"
    }
}

struct PhotoThumb: View {
    var width: CGFloat? = nil
    var height: CGFloat
    var icon: String = "figure.basketball"
    var photo: String? = nil
    var body: some View {
        CanonicalPhoto(resolvedPhoto, width: width, height: height, cornerRadius: 6)
            .accessibilityLabel("Shot media thumbnail")
    }
    private var resolvedPhoto: String {
        PhotoThumbMediaResolver.photoKey(explicit: photo, icon: icon)
    }
}

/// Small gray capsule chip (canonical drill meta tags).
/// Drill metadata pill ("20 min", "Form Focus", "Intermediate").
///
/// `lineLimit(1)` alone let the pill be squeezed to whatever the row had left,
/// so the label ellipsized inside the capsule — "Form…", "Inter…", "All Le…" on
/// 054/058. Canonical fits three of these in the ~164pt the drill row leaves
/// (12 min 28.6pt, Game Speed 44.2pt, All Levels 37.8pt); the condensed width,
/// the 9pt step and the tighter inset bring the app's three inside the same
/// budget, and `fixedSize` stops the row from taking it back.
struct TagChip: View {
    let text: String
    var body: some View {
        Text(text)
            .shotiqCondensed(9, weight: .medium)
            .foregroundStyle(ShotIQColor.graphite)
            .lineLimit(1)
            .fixedSize(horizontal: true, vertical: false)
            .padding(.horizontal, 6).padding(.vertical, 4)
            .background(ShotIQColor.warmCanvas, in: Capsule())
    }
}

/// Tiny caps label used above values inside canonical cards.
struct MicroLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .shotiqMicroCaps(10, weight: .semibold)
            .foregroundStyle(ShotIQColor.graphite)
    }
}

struct VRule: View {
    var height: CGFloat = 36
    var body: some View { Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: height) }
}

/// Request body for POST /api/saved-workouts — bookmarking a drill persists it
/// to the signed-in user's saved workouts (shape per src/app/api/saved-workouts/route.ts).
struct SavedWorkoutBody: Encodable {
    var name: String
    var drillCount = 1
    var drillIds: [String] = []
}

struct TrainingSavedDrill: Identifiable, Codable, Equatable {
    var id: String { name.lowercased().replacingOccurrences(of: " ", with: "-") }
    var name: String
    var description: String
    var phase: String
    var shots: Int
    var makes: Int
    var accuracy: String
    var completed: String
    var difficulty: String
    var duration: String
    var photo: String?

    static func catalog(name: String, difficulty: String, duration: String,
                        description: String, phase: String = "RELEASE",
                        photo: String? = nil) -> TrainingSavedDrill {
        TrainingSavedDrill(name: name, description: description, phase: phase,
                           shots: 0, makes: 0, accuracy: "--",
                           completed: "Saved now", difficulty: difficulty,
                           duration: duration, photo: photo)
    }
}

enum TrainingSavedDrillStore {
    static let key = "shotiq.training.savedDrills.v1"

    static func decode(_ payload: String) -> [TrainingSavedDrill] {
        guard let data = payload.data(using: .utf8),
              let drills = try? JSONDecoder().decode([TrainingSavedDrill].self, from: data) else { return [] }
        return drills
    }

    static func encode(_ drills: [TrainingSavedDrill]) -> String {
        guard let data = try? JSONEncoder().encode(drills),
              let payload = String(data: data, encoding: .utf8) else { return "[]" }
        return payload
    }

    static func contains(_ name: String, in payload: String) -> Bool {
        decode(payload).contains { $0.name.caseInsensitiveCompare(name) == .orderedSame }
    }

    static func save(_ drill: TrainingSavedDrill, in payload: String) -> String {
        var drills = decode(payload)
        drills.removeAll { $0.name.caseInsensitiveCompare(drill.name) == .orderedSame }
        drills.insert(drill, at: 0)
        return encode(drills)
    }

    static func remove(_ name: String, from payload: String) -> String {
        encode(decode(payload).filter { $0.name.caseInsensitiveCompare(name) != .orderedSame })
    }
}

struct TrainingWorkoutRecord: Identifiable, Codable, Equatable {
    var id: String
    var drillName: String
    var shots: Int
    var makes: Int
    var durationSeconds: Int
    var completedAt: Date

    var misses: Int { max(shots - makes, 0) }
    var accuracy: Double { shots == 0 ? 0 : Double(makes) / Double(shots) }
    var accuracyText: String { shots == 0 ? "--" : String(format: "%.1f%%", accuracy * 100) }
    var pointsEarned: Int { max(40, makes * 12 + shots * 3) }
    var formScore: Int { min(99, max(40, Int((accuracy * 100).rounded()) + min(shots, 12))) }
    var formVerdict: String { formScore >= 85 ? "GREAT" : formScore >= 70 ? "GOOD" : "BUILDING" }
    var formNote: String {
        shots == 0 ? "Track a few shots to unlock session feedback." :
        accuracy >= 0.7 ? "Good session. Keep building repeatable mechanics." :
        "Keep the reps coming and focus on clean alignment."
    }
    var phaseScores: [(String, Int)] {
        let base = formScore
        return [("SETUP", min(99, base + 2)),
                ("LOAD", max(40, base - 1)),
                ("RISE", min(99, base + 1)),
                ("RELEASE", base),
                ("FOLLOW-THROUGH", max(40, base - 2))]
    }
    var primaryTargetScore: Int { min(10, max(1, Int((accuracy * 10).rounded()))) }

    static func manualSession(drillName: String, shots: Int, makes: Int,
                              durationSeconds: Int) -> TrainingWorkoutRecord {
        TrainingWorkoutRecord(id: UUID().uuidString,
                              drillName: drillName,
                              shots: shots,
                              makes: makes,
                              durationSeconds: durationSeconds,
                              completedAt: Date())
    }
}

enum TrainingWorkoutStore {
    static let key = "shotiq.training.completedWorkouts.v1"

    static func decode(_ payload: String) -> [TrainingWorkoutRecord] {
        guard let data = payload.data(using: .utf8),
              let workouts = try? JSONDecoder().decode([TrainingWorkoutRecord].self, from: data) else { return [] }
        return workouts
    }

    static func encode(_ workouts: [TrainingWorkoutRecord]) -> String {
        guard let data = try? JSONEncoder().encode(workouts),
              let payload = String(data: data, encoding: .utf8) else { return "[]" }
        return payload
    }

    static func latest(in payload: String) -> TrainingWorkoutRecord? {
        decode(payload).sorted { $0.completedAt > $1.completedAt }.first
    }

    static func save(_ workout: TrainingWorkoutRecord, in payload: String) -> String {
        var workouts = decode(payload)
        workouts.removeAll { $0.id == workout.id }
        workouts.insert(workout, at: 0)
        return encode(Array(workouts.prefix(25)))
    }
}

struct TrainingHomeDrillRow: Identifiable, Equatable {
    var id: String { title.lowercased().replacingOccurrences(of: " ", with: "-") }
    var title: String
    var tags: [String]
    var description: String
    var photo: String?
}

struct TrainingHomeWorkoutSummary: Equatable {
    var timestamp: String
    var drillName: String
    var shots: String
    var makes: String
    var accuracy: String
    var verdict: String
    var note: String
    var formScore: String
    var scorePct: Double

    static let canonicalDemo = TrainingHomeWorkoutSummary(
        timestamp: "Today at 8:24 AM",
        drillName: "Quick Release Builder",
        shots: "24",
        makes: "15",
        accuracy: "62.5%",
        verdict: "GOOD",
        note: "Keep building consistency.",
        formScore: "82",
        scorePct: 0.82)

    static let empty = TrainingHomeWorkoutSummary(
        timestamp: "No workouts yet",
        drillName: "Start tracking to build history",
        shots: "0",
        makes: "0",
        accuracy: "--",
        verdict: "READY",
        note: "Track shots to unlock session feedback.",
        formScore: "--",
        scorePct: 0)

    init(workout: TrainingWorkoutRecord) {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d • h:mm a"
        timestamp = formatter.string(from: workout.completedAt)
        drillName = workout.drillName
        shots = "\(workout.shots)"
        makes = "\(workout.makes)"
        accuracy = workout.accuracyText
        verdict = workout.formVerdict
        note = workout.formNote
        formScore = "\(workout.formScore)"
        scorePct = Double(workout.formScore) / 100
    }

    private init(timestamp: String, drillName: String, shots: String, makes: String,
                 accuracy: String, verdict: String, note: String,
                 formScore: String, scorePct: Double) {
        self.timestamp = timestamp
        self.drillName = drillName
        self.shots = shots
        self.makes = makes
        self.accuracy = accuracy
        self.verdict = verdict
        self.note = note
        self.formScore = formScore
        self.scorePct = scorePct
    }
}

struct TrainingHomeData {
    var target: String
    var targetGlyph: CorrectionKind
    var drills: [TrainingHomeDrillRow]
    var workout: TrainingHomeWorkoutSummary

    static func resolve(latestAnalysis: ShotIQAnalysisResultDTO?,
                        completedWorkoutsPayload: String,
                        savedDrillsPayload: String) -> TrainingHomeData {
        let presentation = latestAnalysis.map(AnalysisResultPresentation.init(result:))
            ?? (UITestHooks.demoData ? .canonicalDemo : .noResult)
        let latestWorkout = TrainingWorkoutStore.latest(in: completedWorkoutsPayload)
        let canonicalDemo = latestAnalysis == nil && latestWorkout == nil && UITestHooks.demoData
        let target = presentation.coachingTarget
        let stored = TrainingSavedDrillStore.decode(savedDrillsPayload).map {
            TrainingHomeDrillRow(title: $0.name,
                                 tags: [$0.duration, "Form Focus", $0.difficulty],
                                 description: $0.description,
                                 photo: $0.photo)
        }
        let baseDrills = canonicalDemo
            ? canonicalDrills
            : [recommendedDrill(for: target)] + canonicalDrills
        return TrainingHomeData(
            target: target,
            targetGlyph: glyph(for: target),
            drills: deduped(stored + baseDrills),
            workout: latestWorkout.map(TrainingHomeWorkoutSummary.init(workout:))
                ?? (canonicalDemo ? .canonicalDemo : .empty))
    }

    private static let canonicalDrills = [
        TrainingHomeDrillRow(title: "Quick Release Builder",
                             tags: ["20 min", "Form Focus", "Intermediate"],
                             description: "Improve release speed and consistency.",
                             photo: "054-visual-003"),
        TrainingHomeDrillRow(title: "Elbow Alignment Series",
                             tags: ["15 min", "Form Focus", "All Levels"],
                             description: "Train a stacked elbow and straight line.",
                             photo: "054-visual-002"),
        TrainingHomeDrillRow(title: "Catch & Shoot Flow",
                             tags: ["12 min", "Game Speed", "All Levels"],
                             description: "Smooth rhythm from catch to follow-through.",
                             photo: "054-visual-001")
    ]

    private static func recommendedDrill(for target: String) -> TrainingHomeDrillRow {
        let normalized = target.lowercased()
        if normalized.contains("wrist") {
            return TrainingHomeDrillRow(title: "WRIST STAY DRILL",
                                       tags: ["6 min", "Release", "Beginner"],
                                       description: "Keeps wrist neutral for a clean, consistent release.",
                                       photo: nil)
        }
        if normalized.contains("centerline") || normalized.contains("release closer") {
            return TrainingHomeDrillRow(title: "ALIGN & EXTEND",
                                       tags: ["10 min", "Release", "Intermediate"],
                                       description: "Promotes full extension and vertical ball flight.",
                                       photo: nil)
        }
        return TrainingHomeDrillRow(title: "STACK & SHOOT",
                                   tags: ["8 min", "Release", "Beginner"],
                                   description: "Builds stacked elbow position and a straight shooting line.",
                                   photo: "056-visual-001")
    }

    private static func glyph(for target: String) -> CorrectionKind {
        let normalized = target.lowercased()
        if normalized.contains("centerline") || normalized.contains("release closer") { return .square }
        if normalized.contains("drive") { return .drive }
        return .stack
    }

    private static func deduped(_ rows: [TrainingHomeDrillRow]) -> [TrainingHomeDrillRow] {
        var seen: Set<String> = []
        return rows.filter { row in
            let key = row.title.lowercased()
            if seen.contains(key) { return false }
            seen.insert(key)
            return true
        }
    }
}

struct QuickStartData {
    var target: String
    var scoreText: String
    var scorePct: Double
    var verdict: String
    var note: String
    var shotTarget: Int
    var makeTarget: Int
    var shotCaption: String
    var makeCaption: String
    var drillName: String

    static func resolve(latestAnalysis: ShotIQAnalysisResultDTO?,
                        completedWorkoutsPayload: String) -> QuickStartData {
        let presentation = latestAnalysis.map(AnalysisResultPresentation.init(result:))
            ?? (UITestHooks.demoData ? .canonicalDemo : .noResult)
        let latestWorkout = TrainingWorkoutStore.latest(in: completedWorkoutsPayload)
        let canonicalDemo = latestAnalysis == nil && latestWorkout == nil && UITestHooks.demoData
        let target = presentation.coachingTarget
        if canonicalDemo {
            return QuickStartData(
                target: target,
                scoreText: "82",
                scorePct: 0.82,
                verdict: "GOOD",
                note: "Keep building consistency.",
                shotTarget: 24,
                makeTarget: 15,
                shotCaption: "Recommended 20-30 shots",
                makeCaption: "Recommended 50-65%",
                drillName: "Wall Elbow Alignment")
        }

        let baseShots = latestWorkout?.shots ?? 24
        let baseMakes = latestWorkout?.makes ?? 15
        let nextShots = latestWorkout == nil ? baseShots : max(1, min(60, baseShots + 3))
        let nextMakes = latestWorkout == nil ? baseMakes : max(0, min(nextShots, baseMakes + 2))
        let scoreText = presentation.scoreText != "--"
            ? presentation.scoreText
            : latestWorkout.map { "\($0.formScore)" } ?? "--"
        let scorePct = presentation.scoreText != "--"
            ? presentation.scorePct
            : latestWorkout.map { Double($0.formScore) / 100 } ?? 0
        return QuickStartData(
            target: target,
            scoreText: scoreText,
            scorePct: scorePct,
            verdict: presentation.scoreVerdict == "UNAVAILABLE"
                ? (latestWorkout?.formVerdict ?? "READY")
                : presentation.scoreVerdict,
            note: latestWorkout.map { "Built from your last \($0.shots)-shot session." }
                ?? presentation.scoreCaption,
            shotTarget: nextShots,
            makeTarget: nextMakes,
            shotCaption: latestWorkout.map { "Last session \($0.shots) shots" }
                ?? "Recommended 20-30 shots",
            makeCaption: latestWorkout.map { "Last session \($0.makes) makes" }
                ?? "Recommended 50-65%",
            drillName: recommendedDrillName(for: target))
    }

    private static func recommendedDrillName(for target: String) -> String {
        let normalized = target.lowercased()
        if normalized.contains("wrist") { return "WRIST STAY DRILL" }
        if normalized.contains("centerline") || normalized.contains("release closer") {
            return "ALIGN & EXTEND"
        }
        return "STACK & SHOOT"
    }
}

struct HRule: View {
    var body: some View { Rectangle().fill(ShotIQColor.rule).frame(height: 1) }
}

struct TrainingHomeView: View {     // 054
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingSavedDrillStore.key) private var savedDrillsPayload = ""
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    private var homeData: TrainingHomeData {
        TrainingHomeData.resolve(latestAnalysis: app.recentMedia.first?.analysis,
                                 completedWorkoutsPayload: completedWorkoutsPayload,
                                 savedDrillsPayload: savedDrillsPayload)
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-training-home") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        // PRIMARY COACHING TARGET (canonical warm-canvas hero card)
                        HStack(alignment: .center, spacing: 12) {
                            VStack(alignment: .leading, spacing: 8) {
                                MicroLabel(text: "PRIMARY COACHING TARGET")
                                Text(homeData.target)
                                    .shotiqBody(21, weight: .bold)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .accessibilityIdentifier("training-home-target")
                            }
                            Spacer(minLength: 8)
                            VStack(spacing: 8) {
                                CorrectionGlyph(kind: homeData.targetGlyph, size: 54).foregroundStyle(ShotIQColor.ink)
                                Image(systemName: "checkmark.circle")
                                    .font(.system(size: 19))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                        .padding(16)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 10))
                        .padding(.top, 16)

                        NavigationLink { QuickStartView() } label: {
                            HStack(spacing: 10) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.viewfinder"),
                                                         size: 18,
                                                         label: nil)
                                Text("Quick start").shotiqBody(17, weight: .medium)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                        .padding(.top, 14)

                        HStack(spacing: 10) {
                            optionCard("bookmark", "My drills", MyDrillsView())
                            optionCard("magnifyingglass", "Discover", DiscoverDrillsView())
                            optionCard("calendar", "Calendar", WorkoutCalendarView())
                        }
                        .padding(.top, 12)

                        HStack {
                            SectionLabel(text: "SAVED DRILLS")
                            Spacer()
                            NavigationLink { MyDrillsView() } label: {
                                HStack(spacing: 4) {
                                    Text("View all").shotiqBody(13)
                                    Image(systemName: "chevron.right").font(.system(size: 11))
                                }
                                .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .padding(.top, 22)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                ForEach(Array(homeData.drills.enumerated()), id: \.element.id) { i, d in
                                    NavigationLink { DrillDetailView(name: d.title) } label: {
                                        // 8 rather than 10 across four gutters:
                                        // the three metadata pills need ~164pt and
                                        // the row was leaving them 166.
                                        HStack(spacing: 8) {
                                            PhotoThumb(width: 84, height: 76,
                                                       photo: d.photo)
                                            WorkoutGlyph(kind: .init(drillName: d.title), size: 28)
                                                .foregroundStyle(i == 0 ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                            VStack(alignment: .leading, spacing: 5) {
                                                Text(d.title).shotiqBody(15, weight: .semibold)
                                                    .lineLimit(1).minimumScaleFactor(0.8)
                                                    .accessibilityIdentifier("training-home-recommended-drill-\(i)")
                                                HStack(spacing: 5) {
                                                    ForEach(d.tags, id: \.self) { TagChip(text: $0) }
                                                }
                                                Text(d.description).shotiqBody(11)
                                                    .foregroundStyle(ShotIQColor.graphite)
                                                    .lineLimit(1).minimumScaleFactor(0.8)
                                            }
                                            Spacer(minLength: 4)
                                            Image(systemName: "chevron.right")
                                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                        }
                                        .padding(10)
                                    }
                                    if i < homeData.drills.count - 1 {
                                        HRule().padding(.leading, 10)
                                    }
                                }
                            }
                        }
                        .padding(.top, 8)

                        HStack {
                            SectionLabel(text: "RECENT WORKOUT")
                            Spacer()
                            Text(homeData.workout.timestamp).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                .accessibilityIdentifier("training-home-recent-time")
                        }
                        .padding(.top, 22)
                        NavigationLink { ShotTrackerView() } label: {
                            ShotIQCard {
                                HStack(spacing: 0) {
                                    PhotoThumb(width: 100, height: 128, photo: "054-visual-001")
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text(homeData.workout.drillName).shotiqBody(15, weight: .semibold)
                                            .lineLimit(1).minimumScaleFactor(0.8)
                                            .accessibilityIdentifier("training-home-recent-drill")
                                        HStack(spacing: 14) {
                                            StatBlock(value: homeData.workout.shots, label: "SHOTS", valueSize: ShotIQType.numeric)
                                                .accessibilityIdentifier("training-home-recent-shots")
                                            StatBlock(value: homeData.workout.makes, label: "MAKES", valueSize: ShotIQType.numeric)
                                                .accessibilityIdentifier("training-home-recent-makes")
                                            StatBlock(value: homeData.workout.accuracy, label: "MAKE %", valueSize: ShotIQType.numeric)
                                                .accessibilityIdentifier("training-home-recent-accuracy")
                                        }
                                        HStack(spacing: 7) {
                                            Text(homeData.workout.verdict).shotiqBody(10, weight: .bold)
                                                .foregroundStyle(ShotIQColor.analysisBlue)
                                                .accessibilityIdentifier("training-home-recent-verdict")
                                            Text(homeData.workout.note).shotiqBody(11)
                                                .foregroundStyle(ShotIQColor.graphite)
                                                .lineLimit(1).minimumScaleFactor(0.8)
                                                .accessibilityIdentifier("training-home-recent-note")
                                        }
                                    }
                                    .padding(12)
                                    Spacer(minLength: 0)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("FORM SCORE").shotiqBody(9, weight: .semibold).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text(homeData.workout.formScore).font(.custom("Tungsten-Medium", size: 44))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                            .accessibilityIdentifier("training-home-recent-score")
                                        ScoreBar(pct: homeData.workout.scorePct).frame(width: 60)
                                    }
                                    .padding(.trailing, 12)
                                }
                            }
                        }
                        .accessibilityIdentifier("training-home-recent-workout-card")
                        .accessibilityLabel("Recent workout")
                        .padding(.top, 8)
                        PhaseStrip().padding(.top, 22)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func optionCard(_ icon: String, _ title: String, _ dest: some View) -> some View {
        NavigationLink { dest } label: {
            VStack(spacing: 8) {
                ShotIQConceptGlyph(concept: title, fallback: icon, size: 24)
                    .foregroundStyle(ShotIQColor.ink)
                    .accessibilityHidden(true)
                Text(title).shotiqBody(14, weight: .medium).foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.8)
                    .accessibilityHidden(true)
            }
            .frame(maxWidth: .infinity).frame(height: 82)
            .background(ShotIQColor.paper)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
            .contentShape(Rectangle())
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(title)
            .accessibilityIdentifier(title)
        }
        .accessibilityLabel(title)
        .accessibilityIdentifier(title)
    }
}

struct QuickStartView: View {       // 055
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @State private var shotTarget = 24
    @State private var makeTarget = 15
    @State private var targetsSeeded = false
    private var quickData: QuickStartData {
        QuickStartData.resolve(latestAnalysis: app.recentMedia.first?.analysis,
                               completedWorkoutsPayload: completedWorkoutsPayload)
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-quick-start") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        Text("QUICK START").shotiqDisplay(40).padding(.top, 16)
                        (Text("Get right to work. We've prefilled this workout from ")
                            + Text("\(quickData.target).").fontWeight(.semibold))
                            .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 6)
                            .accessibilityIdentifier("quick-start-context")
                        HStack(alignment: .top, spacing: 16) {
                            PhotoThumb(height: 190, photo: "055-visual-001").frame(maxWidth: .infinity)
                            VStack(alignment: .leading, spacing: 6) {
                                MicroLabel(text: "FORM SCORE")
                                Text(quickData.scoreText).font(.custom("Tungsten-Medium", size: 52))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .accessibilityIdentifier("quick-start-score")
                                ScoreBar(pct: quickData.scorePct).frame(width: 96)
                                Text(quickData.verdict).shotiqBody(13, weight: .bold)
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                    .accessibilityIdentifier("quick-start-verdict")
                                Text(quickData.note)
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .accessibilityIdentifier("quick-start-note")
                            }
                            .frame(width: 112, alignment: .leading)
                        }
                        .padding(.top, 16)
                        SectionLabel(text: "SHOT RAIL FOCUS").padding(.top, 22)
                        PhaseStrip().padding(.top, 10)
                        NavigationLink { GoalsView() } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                MicroLabel(text: "PRIMARY COACHING TARGET")
                                HStack {
                                    Text(quickData.target).shotiqBody(18, weight: .bold)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                        .accessibilityIdentifier("quick-start-target")
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(.vertical, 14)
                            .overlay(HRule(), alignment: .top)
                            .overlay(HRule(), alignment: .bottom)
                        }
                        .padding(.top, 18)
                        SectionLabel(text: "WORKOUT TARGETS").padding(.top, 16)
                        HStack(alignment: .top, spacing: 12) {
                            targetCard("SHOT TARGET", icon: "target", value: $shotTarget,
                                       unit: "SHOTS", caption: quickData.shotCaption,
                                       idPrefix: "quick-start-shot-target")
                            targetCard("MAKE TARGET", icon: "chart.line.uptrend.xyaxis", value: $makeTarget,
                                       unit: "MAKES", caption: quickData.makeCaption,
                                       idPrefix: "quick-start-make-target")
                        }
                        .padding(.top, 10)
                        NavigationLink { DrillExecutionView(drillName: quickData.drillName) } label: {
                            HStack(spacing: 10) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.viewfinder"),
                                                         size: 18,
                                                         label: nil)
                                Text("Start shot tracking").shotiqBody(17, weight: .medium)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                        .padding(.vertical, 22)
                        .accessibilityIdentifier("quick-start-start-tracking")
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .onAppear {
            guard !targetsSeeded else { return }
            shotTarget = quickData.shotTarget
            makeTarget = quickData.makeTarget
            targetsSeeded = true
        }
    }
    private func targetCard(_ label: String, icon: String, value: Binding<Int>,
                            unit: String, caption: String, idPrefix: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            MicroLabel(text: label)
            HStack(alignment: .top) {
                StatBlock(value: "\(value.wrappedValue)", label: unit, valueSize: ShotIQType.numeric * 1.4)
                    .accessibilityIdentifier(idPrefix)
                Spacer()
                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                         size: 24,
                                         label: nil)
            }
            Text(caption).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(2).minimumScaleFactor(0.8)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 10) {
                Spacer()
                stepButton("minus", id: "\(idPrefix)-minus") { value.wrappedValue = max(0, value.wrappedValue - 1) }
                stepButton("plus", id: "\(idPrefix)-plus") { value.wrappedValue += 1 }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
    }
    private func stepButton(_ icon: String, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.system(size: 14, weight: .medium))
                .frame(width: 38, height: 38)
                .overlay(Circle().stroke(ShotIQColor.rule))
                .foregroundStyle(ShotIQColor.ink)
        }
        .accessibilityIdentifier(id)
    }
}

struct DiscoverDrillsView: View {   // 056
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingSavedDrillStore.key) private var savedDrillsPayload = ""
    @State private var query = ""
    // Each browse chip is a real filter dimension backed by a picker dialog.
    @State private var flawFilter = "All Flaws"
    @State private var phaseFilter = "All Phases"
    @State private var difficultyFilter = "All Difficulties"
    @State private var durationFilter = "Any Duration"
    @State private var sortMode = "Recommended"
    @State private var activeChip: String?
    @State private var showFilterMenu = false
    @State private var toast: ShotIQToast?
    private let drills: [(String, String, String, String)] = [
        ("STACK & SHOOT", "Beginner", "8 min", "Builds stacked elbow position and a straight shooting line."),
        ("WRIST STAY DRILL", "Beginner", "6 min", "Keeps wrist neutral for a clean, consistent release."),
        ("ALIGN & EXTEND", "Intermediate", "10 min", "Promotes full extension and vertical ball flight.")
    ]
    private let chipOptions: [String: [String]] = [
        "All Flaws": ["All Flaws", "Elbow flare", "Early wrist bend", "Left lean"],
        "All Phases": ["All Phases", "Setup", "Load", "Rise", "Release", "Follow-through"],
        "All Difficulties": ["All Difficulties", "Beginner", "Intermediate", "Advanced"],
        "Any Duration": ["Any Duration", "Under 10 min", "10+ min"]
    ]
    private func minutes(_ s: String) -> Int { Int(s.split(separator: " ").first ?? "0") ?? 0 }
    /// All sample drills target the Release phase / elbow-related flaws, so
    /// phase and flaw filters keep them unless a non-matching value is chosen.
    private var filteredDrills: [(String, String, String, String)] {
        var out = drills.filter { d in
            (query.isEmpty || d.0.localizedCaseInsensitiveContains(query) || d.3.localizedCaseInsensitiveContains(query))
            && (difficultyFilter == "All Difficulties" || d.1 == difficultyFilter)
            && (durationFilter == "Any Duration"
                || (durationFilter == "Under 10 min" && minutes(d.2) < 10)
                || (durationFilter == "10+ min" && minutes(d.2) >= 10))
            && (phaseFilter == "All Phases" || phaseFilter == "Release")
            && (flawFilter == "All Flaws" || flawFilter == "Elbow flare" || flawFilter == "Early wrist bend")
        }
        switch sortMode {
        case "Shortest first": out.sort { minutes($0.2) < minutes($1.2) }
        case "Name A–Z": out.sort { $0.0 < $1.0 }
        default: break
        }
        return out
    }
    private func chipLabel(for dimension: String) -> String {
        switch dimension {
        case "All Flaws": return flawFilter
        case "All Phases": return phaseFilter
        case "All Difficulties": return difficultyFilter
        default: return durationFilter
        }
    }
    private func setChip(_ dimension: String, to value: String) {
        switch dimension {
        case "All Flaws": flawFilter = value
        case "All Phases": phaseFilter = value
        case "All Difficulties": difficultyFilter = value
        default: durationFilter = value
        }
    }
    private func saved(_ d: (String, String, String, String)) -> Bool {
        TrainingSavedDrillStore.contains(d.0, in: savedDrillsPayload)
    }
    private func toggleSaved(_ d: (String, String, String, String)) {
        if saved(d) {
            savedDrillsPayload = TrainingSavedDrillStore.remove(d.0, from: savedDrillsPayload)
            toast = .info("Drill removed", "\(d.0) removed from My Drills.")
            return
        }
        let savedDrill = TrainingSavedDrill.catalog(name: d.0, difficulty: d.1,
                                                    duration: d.2, description: d.3,
                                                    photo: d.0 == "STACK & SHOOT" ? "056-visual-001" : nil)
        savedDrillsPayload = TrainingSavedDrillStore.save(savedDrill, in: savedDrillsPayload)
        toast = .success("Drill saved", "\(d.0) added to My Drills.")
        Task { await APIClient.shared.send("/api/saved-workouts",
                                           body: SavedWorkoutBody(name: d.0)) }
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-discover-drills") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        Text("DISCOVER DRILLS").shotiqDisplay(38).padding(.top, 16)
                        Text("Drills to address your mechanics and reach your targets.")
                            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                        HStack(spacing: 10) {
                            HStack(spacing: 8) {
                                Image(systemName: "magnifyingglass")
                                    .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                                TextField("Search drills", text: $query).shotiqBody(15)
                            }
                            .padding(.horizontal, 12).frame(height: 46)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            Button { showFilterMenu = true } label: {
                                HStack(spacing: 6) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-settings",
                                                             size: 15,
                                                             label: nil)
                                    Text("Filters").shotiqBody(14, weight: .medium)
                                }
                                .padding(.horizontal, 14).frame(height: 46)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            .confirmationDialog("Filter drills", isPresented: $showFilterMenu, titleVisibility: .visible) {
                                Button("Beginner only") { difficultyFilter = "Beginner" }
                                Button("Intermediate only") { difficultyFilter = "Intermediate" }
                                Button("Under 10 minutes") { durationFilter = "Under 10 min" }
                                Button("Reset all filters") {
                                    flawFilter = "All Flaws"; phaseFilter = "All Phases"
                                    difficultyFilter = "All Difficulties"; durationFilter = "Any Duration"
                                }
                                Button("Cancel", role: .cancel) {}
                            }
                        }
                        .padding(.top, 12)
                        SectionLabel(text: "RECOMMENDED FOR YOUR TARGET").padding(.top, 18)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 12) {
                                CorrectionGlyph(kind: .stack, size: 44).foregroundStyle(ShotIQColor.ink)
                                    .padding(9)
                                    .overlay(RoundedRectangle(cornerRadius: 8)
                                        .stroke(ShotIQColor.rule, style: StrokeStyle(lineWidth: 1, dash: [4])))
                                VStack(alignment: .leading, spacing: 10) {
                                    MicroLabel(text: "PRIMARY COACHING TARGET")
                                    NavigationLink { GoalsView() } label: {
                                        HStack {
                                            Text("Keep elbow stacked through release").shotiqBody(15, weight: .semibold)
                                                .foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.8)
                                            Spacer()
                                            Image(systemName: "chevron.right")
                                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                        }
                                    }
                                    .buttonStyle(.plain)
                                    HRule()
                                    MicroLabel(text: "RELATED FLAWS DETECTED")
                                    // Three labelled flaw marks share the ~250pt
                                    // this card's text column has left. At 11pt
                                    // with 14pt gutters the longest one bottomed
                                    // out on its scale floor and still ellipsized
                                    // — "Early wrist b…" on 056. One step down the
                                    // ramp plus tighter gutters puts all three
                                    // inside the column at full size.
                                    HStack(spacing: 8) {
                                        ForEach(["Elbow flare", "Early wrist bend", "Left lean"], id: \.self) { f in
                                            HStack(spacing: 5) {
                                                FlawFigure(kind: .init(flawLabel: f), size: 16,
                                                           accent: ShotIQColor.reviewRed)
                                                    .foregroundStyle(ShotIQColor.graphite)
                                                Text(f).shotiqBody(10).foregroundStyle(ShotIQColor.ink)
                                                    .lineLimit(1).minimumScaleFactor(0.6)
                                            }
                                        }
                                    }
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "BROWSE DRILLS").padding(.top, 20)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(["All Flaws", "All Phases", "All Difficulties", "Any Duration"], id: \.self) { f in
                                    let selected = chipLabel(for: f) != f
                                    Button { activeChip = f } label: {
                                        HStack(spacing: 4) {
                                            Text(chipLabel(for: f)).shotiqBody(13, weight: selected ? .semibold : .regular)
                                            Image(systemName: "chevron.down").font(.system(size: 9))
                                        }
                                        .padding(.horizontal, 12).frame(height: 38)
                                        .overlay(RoundedRectangle(cornerRadius: 8)
                                            .stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                                        .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                    }
                                }
                            }
                        }
                        .padding(.top, 10)
                        .confirmationDialog(activeChip ?? "Filter", isPresented: Binding(
                            get: { activeChip != nil }, set: { if !$0 { activeChip = nil } }
                        ), titleVisibility: .visible) {
                            if let dim = activeChip {
                                ForEach(chipOptions[dim] ?? [], id: \.self) { option in
                                    Button(option) { setChip(dim, to: option) }
                                }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        HStack(spacing: 5) {
                            Image(systemName: "arrow.up.arrow.down").font(.system(size: 12))
                            Text("Sort:").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            Menu {
                                ForEach(["Recommended", "Shortest first", "Name A–Z"], id: \.self) { s in
                                    Button(s) { sortMode = s }
                                }
                            } label: {
                                HStack(spacing: 5) {
                                    Text(sortMode).shotiqBody(13, weight: .semibold)
                                    Image(systemName: "chevron.down").font(.system(size: 9))
                                }
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            Spacer()
                            Text("\(filteredDrills.count) drills").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 12)
                        ForEach(filteredDrills, id: \.0) { d in
                            ShotIQCard {
                                HStack(spacing: 0) {
                                    // Canonical 056 only carries a frame for STACK & SHOOT.
                                    NavigationLink { DrillDetailView(name: d.0) } label: {
                                        PhotoThumb(width: 104, height: 158,
                                                   photo: d.0 == "STACK & SHOOT" ? "056-visual-001" : nil)
                                    }
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack(alignment: .top) {
                                            NavigationLink { DrillDetailView(name: d.0) } label: {
                                                Text(d.0).shotiqDisplay(20).lineLimit(1)
                                            }
                                            Spacer()
                                            Button {
                                                toggleSaved(d)
                                            } label: {
                                                Image(systemName: saved(d) ? "bookmark.fill" : "bookmark")
                                                    .font(.system(size: 18))
                                                    .foregroundStyle(saved(d) ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                                    .frame(width: 44, height: 44)
                                            }
                                            .buttonStyle(.plain)
                                            .accessibilityLabel(saved(d) ? "Remove saved drill" : "Save drill")
                                            .accessibilityIdentifier("discover-save-\(d.0.lowercased().replacingOccurrences(of: " ", with: "-").replacingOccurrences(of: "&", with: "and"))")
                                        }
                                        HStack(spacing: 8) {
                                            HStack(spacing: 4) {
                                                ForEach(0..<4, id: \.self) { i in
                                                    PhaseGlyph(phase: ShotPhase.allCases[i],
                                                               active: i == 3, size: 15)
                                                }
                                            }
                                            Text("Release").shotiqBody(11, weight: .medium)
                                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                            Text("· \(d.1) · \(d.2)").shotiqBody(11)
                                                .foregroundStyle(ShotIQColor.graphite)
                                                .lineLimit(1).minimumScaleFactor(0.7)
                                        }
                                        Text(d.3).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(2).multilineTextAlignment(.leading)
                                            .fixedSize(horizontal: false, vertical: true)
                                        HStack {
                                            Spacer()
                                            NavigationLink { DrillDetailView(name: d.0) } label: {
                                                Text("View drill").shotiqBody(13, weight: .semibold)
                                                    .padding(.horizontal, 14).padding(.vertical, 8)
                                                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                                                    .foregroundStyle(.white)
                                            }
                                        }
                                    }
                                    .padding(12)
                                }
                            }
                            .padding(.top, 12)
                        }
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
    }
}

struct DrillDetailData {
    var name: String
    var description: String
    var scoreText: String
    var scorePct: Double
    var skillType: String
    var level: String
    var duration: String
    var reps: String
    var buildSummary: String
    var builds: [String]
    var equipment: [(String, String, String)]
    var steps: [(String, String)]
    var cue: String
    var mechanics: [(String, String)]
    var photo: String

    static func resolve(name: String, latestAnalysis: ShotIQAnalysisResultDTO?) -> DrillDetailData {
        let presentation = latestAnalysis.map(AnalysisResultPresentation.init(result:))
            ?? (UITestHooks.demoData ? .canonicalDemo : .noResult)
        let canonicalDemo = latestAnalysis == nil && UITestHooks.demoData
        if canonicalDemo {
            return canonical(name: name)
        }

        let normalizedName = name.lowercased()
        let target = presentation.coachingTarget
        let normalizedTarget = target.lowercased()
        if normalizedName.contains("wrist") || normalizedTarget.contains("wrist") {
            return DrillDetailData(
                name: name,
                description: "Train wrist control from set point to release so the ball leaves on a clean line.",
                scoreText: presentation.scoreText,
                scorePct: presentation.scorePct,
                skillType: "Shooting",
                level: "Beginner",
                duration: "6 min",
                reps: "20-25 reps",
                buildSummary: "Targets the wrist-set weakness from the latest analysis and keeps the hand quiet until full extension.",
                builds: ["WRIST SET", "CLEAN SNAP", "FOLLOW-THROUGH"],
                equipment: standardEquipment(spot: "Free throw line"),
                steps: [
                    ("SETUP", "Start close with wrist set and elbow under the ball."),
                    ("LOAD", "Keep the wrist quiet as the ball moves into the pocket."),
                    ("RISE", "Lift through the elbow without letting the hand cast early."),
                    ("RELEASE", "Snap after extension and finish fingers down."),
                    ("FOLLOW-THROUGH", "Hold the wrist finish until the ball lands.")
                ],
                cue: "Hold your wrist set until the elbow finishes tall.",
                mechanics: [
                    ("Wrist Set", "Keep wrist angle stable until the release window."),
                    ("Elbow Under Ball", "Keep elbow under the ball from load to release."),
                    ("Follow-Through", "Finish with fingers down and wrist over elbow.")
                ],
                photo: "057-visual-001")
        }

        if normalizedName.contains("align") || normalizedTarget.contains("centerline") || normalizedTarget.contains("release closer") {
            return DrillDetailData(
                name: name,
                description: "Rehearse a centered rise and straight extension so the ball tracks through the rim line.",
                scoreText: presentation.scoreText,
                scorePct: presentation.scorePct,
                skillType: "Shooting",
                level: "Intermediate",
                duration: "10 min",
                reps: "30-40 reps",
                buildSummary: "Uses the latest release-path target to reduce lateral drift and keep the shot on centerline.",
                builds: ["CENTERLINE", "FULL EXTENSION", "RELEASE PATH"],
                equipment: standardEquipment(spot: "Center slot"),
                steps: [
                    ("SETUP", "Square feet and ball to the rim line."),
                    ("LOAD", "Gather without drifting off your centerline."),
                    ("RISE", "Extend straight up through the shoulder and elbow."),
                    ("RELEASE", "Let the ball leave above your shooting eye."),
                    ("FOLLOW-THROUGH", "Freeze the finish on the rim line.")
                ],
                cue: "Release through the centerline instead of drifting across it.",
                mechanics: [
                    ("Centerline", "Keep the ball path close to the rim line."),
                    ("Release Path", "Reduce side-to-side movement through extension."),
                    ("Full Extension", "Finish tall before the wrist snaps over.")
                ],
                photo: "057-visual-001")
        }

        return DrillDetailData(
            name: name,
            description: "Builds stacked elbow position and a straight shooting line for the latest coaching target.",
            scoreText: presentation.scoreText,
            scorePct: presentation.scorePct,
            skillType: "Shooting",
            level: "Beginner",
            duration: "8 min",
            reps: "24-30 reps",
            buildSummary: "Targets \(target.lowercased()) from the latest saved analysis to improve release consistency.",
            builds: ["ELBOW STACK", "WRIST ALIGNMENT", "RELEASE PATH"],
            equipment: standardEquipment(spot: "Free throw line"),
            steps: [
                ("SETUP", "Feet shoulder-width. Ball in shooting pocket. Elbow in."),
                ("LOAD", "Dip into a smooth gather. Keep elbow tucked and stacked."),
                ("RISE", "Extend up. Keep elbow under ball and aligned."),
                ("RELEASE", "Release at full extension. Wrist snaps over."),
                ("FOLLOW-THROUGH", "Hold tall finish. Elbow stacked, fingers down.")
            ],
            cue: target,
            mechanics: [
                ("Elbow Angle", "Raise the elbow into the 150-180 degree release band."),
                ("Release Path", "Keep the release offset inside the -5 to +5 degree band."),
                ("Form Score", "Use the saved form score to choose the next drill load.")
            ],
            photo: name.uppercased() == "STACK & SHOOT" ? "056-visual-001" : "057-visual-001")
    }

    private static func canonical(name: String) -> DrillDetailData {
        DrillDetailData(
            name: name,
            description: "Build a tight, controlled release by stacking your elbow and wrist through extension.",
            scoreText: "82",
            scorePct: 0.82,
            skillType: "Shooting",
            level: "Advanced",
            duration: "15 min",
            reps: "60-70 reps",
            buildSummary: "Teaches vertical alignment of the shooting arm to improve consistency, accuracy, and repeatable release mechanics.",
            builds: ["ELBOW STACK", "WRIST ALIGNMENT", "RELEASE PATH"],
            equipment: standardEquipment(spot: "Free throw line"),
            steps: [
                ("SETUP", "Feet shoulder-width. Ball in shooting pocket. Elbow in."),
                ("LOAD", "Dip into a smooth gather. Keep elbow tucked and stacked."),
                ("RISE", "Extend up. Keep elbow under ball and aligned."),
                ("RELEASE", "Release at full extension. Wrist snaps over."),
                ("FOLLOW-THROUGH", "Hold tall finish. Elbow stacked, fingers down.")
            ],
            cue: "Stack your elbow under the ball and finish tall every time.",
            mechanics: [
                ("Elbow Under Ball", "Keep elbow under the ball from load to release."),
                ("Wrist Over Elbow", "Snap wrist over elbow at the top of release."),
                ("Straight Release Path", "Drive straight up with minimal lateral drift.")
            ],
            photo: "057-visual-001")
    }

    private static func standardEquipment(spot: String) -> [(String, String, String)] {
        [
            ("figure.basketball", "Basketball", "1"),
            ("cone", "Cones", "2-3"),
            ("ruler", "Spot", spot),
            ("mappin.and.ellipse", "Location", "Any court")
        ]
    }
}

struct DrillDetailView: View {      // 057
    var name = "Pound Crossover Foundation"
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage(TrainingSavedDrillStore.key) private var savedDrillsPayload = ""
    @State private var bookmarked = false
    @State private var toast: ShotIQToast?
    private var detail: DrillDetailData {
        DrillDetailData.resolve(name: name, latestAnalysis: app.recentMedia.first?.analysis)
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-drill-detail") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Button { dismiss() } label: {
                            Image(systemName: "arrow.left")
                                .font(.system(size: 19, weight: .medium)).foregroundStyle(ShotIQColor.ink)
                        }
                        .accessibilityLabel("Back")
                        Spacer()
                        Wordmark(size: 26)
                        Spacer()
                        HStack(spacing: 18) {
                            Button {
                                toggleSaved()
                            } label: {
                                Image(systemName: bookmarked ? "bookmark.fill" : "bookmark")
                                    .foregroundStyle(bookmarked ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                            }
                            .accessibilityLabel(bookmarked ? "Remove saved drill" : "Save drill")
                            .accessibilityIdentifier("drill-detail-save")
                            ShareLink(item: "Check out the \(detail.name) drill on ShotIQ 🏀") {
                                Image(systemName: "square.and.arrow.up").foregroundStyle(ShotIQColor.ink)
                            }
                        }
                        .font(.system(size: 17))
                    }
                    .padding(.horizontal, 20).frame(height: 52)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                MicroLabel(text: "DRILL DETAIL")
                                Text(detail.name.uppercased()).shotiqDisplay(30)
                                    .accessibilityIdentifier("drill-detail-title")
                                Text(detail.description)
                                    .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .accessibilityIdentifier("drill-detail-description")
                            }
                            PhotoThumb(width: 138, height: 160, photo: detail.photo)
                                .overlay(alignment: .bottomTrailing) {
                                    VStack(spacing: 2) {
                                        Text("FORM SCORE").shotiqBody(7, weight: .semibold).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text(detail.scoreText).font(.custom("Tungsten-Medium", size: 26))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                            .accessibilityIdentifier("drill-detail-score")
                                        Rectangle().fill(ShotIQColor.shotiqOrange)
                                            .frame(width: CGFloat(max(4, 28 * detail.scorePct)), height: 3)
                                    }
                                    .padding(7)
                                    .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 6))
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                    .padding(8)
                                }
                        }
                        .padding(.top, 16)
                        HStack(spacing: 0) {
                            factColumn("chart.bar", "SKILL TYPE", detail.skillType, id: "drill-detail-skill-type")
                            VRule(height: 44)
                            factColumn("chart.line.uptrend.xyaxis", "LEVEL", detail.level, id: "drill-detail-level")
                            VRule(height: 44)
                            factColumn("stopwatch", "DURATION", detail.duration, id: "drill-detail-duration")
                            VRule(height: 44)
                            factColumn("arrow.triangle.2.circlepath", "REPS / TIME", detail.reps, id: "drill-detail-reps")
                        }
                        .padding(.vertical, 14)
                        .overlay(HRule(), alignment: .bottom)
                        SectionLabel(text: "WHAT IT BUILDS").padding(.top, 18)
                        HStack(alignment: .top, spacing: 12) {
                            Text(detail.buildSummary)
                                .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                .fixedSize(horizontal: false, vertical: true)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .accessibilityIdentifier("drill-detail-build-summary")
                            ForEach(Array(detail.builds.enumerated()), id: \.offset) { _, build in
                                buildColumn(buildIcon(for: build), build)
                            }
                        }
                        .padding(.top, 10)
                        SectionLabel(text: "EQUIPMENT & SETUP").padding(.top, 20)
                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible())], spacing: 10) {
                            ForEach(Array(detail.equipment.enumerated()), id: \.offset) { _, item in
                                equipCard(item.0, item.1, item.2)
                            }
                        }
                        .padding(.top, 10)
                        SectionLabel(text: "STEP-BY-STEP").padding(.top, 20)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(alignment: .top, spacing: 12) {
                                ForEach(Array(detail.steps.enumerated()), id: \.offset) { i, s in
                                    VStack(alignment: .leading, spacing: 6) {
                                        PhotoThumb(width: 104, height: 104)
                                            .overlay(alignment: .topLeading) {
                                                Text("\(i + 1)").font(.custom("Tungsten-Medium", size: 15))
                                                    .foregroundStyle(.white)
                                                    .frame(width: 22, height: 22)
                                                    .background(ShotIQColor.shotiqOrange, in: Circle())
                                                    .offset(x: -6, y: -6)
                                            }
                                        Text(s.0).shotiqBody(11, weight: .bold).kerning(0.5)
                                            .foregroundStyle(s.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                        Text(s.1).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                            .frame(width: 104, alignment: .leading)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        .padding(.top, 10)
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "COACHING CUE")
                                Text("\u{201C}\(detail.cue)\u{201D}")
                                    .shotiqBody(15).italic()
                                    .foregroundStyle(ShotIQColor.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .accessibilityIdentifier("drill-detail-cue")
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            VRule(height: 120)
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "TARGET MECHANICS")
                                ForEach(detail.mechanics, id: \.0) { m in
                                    HStack(alignment: .top, spacing: 8) {
                                        MechanicGlyph(kind: .init(metricLabel: m.0), size: 18)
                                            .foregroundStyle(ShotIQColor.ink)
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(m.0).shotiqBody(12, weight: .semibold)
                                                .accessibilityIdentifier("drill-detail-mechanic-\(m.0.lowercased().replacingOccurrences(of: " ", with: "-"))")
                                            Text(m.1).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                                .fixedSize(horizontal: false, vertical: true)
                                        }
                                    }
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.top, 22)
                        SectionLabel(text: "DRILL PREVIEW (AI OVERLAY)").padding(.top, 22)
                        HStack(alignment: .top, spacing: 12) {
                            MediaSurface(height: 112)
                            VStack(alignment: .leading, spacing: 7) {
                                Text("Green is the ideal alignment. Orange is your tracked movement.")
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                                legend(ShotIQColor.confirmGreen, "Optimal Path")
                                legend(ShotIQColor.shotiqOrange, "Your Path")
                            }
                            .frame(width: 128)
                        }
                        .padding(.top, 10)
                        HStack(spacing: 10) {
                            NavigationLink { DrillExecutionView(drillName: detail.name) } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "play.fill")
                                    Text("Start drill").shotiqBody(17, weight: .medium)
                                }
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            .accessibilityIdentifier("drill-detail-start-drill")
                            squareNav("calendar", id: "drill-detail-calendar") { WorkoutCalendarView() }
                            squareNav("play.rectangle", id: "drill-detail-media") { MediaDetailView() }
                        }
                        .padding(.vertical, 22)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .onAppear {
            bookmarked = TrainingSavedDrillStore.contains(detail.name, in: savedDrillsPayload)
        }
        .shotiqToast($toast)
    }
    private func toggleSaved() {
        if bookmarked {
            savedDrillsPayload = TrainingSavedDrillStore.remove(detail.name, from: savedDrillsPayload)
            bookmarked = false
            toast = .info("Drill removed", "\(detail.name) removed from My Drills.")
            return
        }
        let savedDrill = TrainingSavedDrill.catalog(name: detail.name,
                                                    difficulty: detail.level,
                                                    duration: detail.duration,
                                                    description: detail.description,
                                                    photo: detail.photo)
        savedDrillsPayload = TrainingSavedDrillStore.save(savedDrill, in: savedDrillsPayload)
        bookmarked = true
        toast = .success("Drill saved", "\(detail.name) added to My Drills.")
        Task { await APIClient.shared.send("/api/saved-workouts",
                                           body: SavedWorkoutBody(name: detail.name)) }
    }
    private func factColumn(_ icon: String, _ label: String, _ value: String, id: String) -> some View {
        VStack(spacing: 4) {
            ShotIQConceptGlyph(concept: label, fallback: icon, size: 17)
                .foregroundStyle(ShotIQColor.ink)
            Text(label).shotiqBody(8, weight: .semibold).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
            Text(value).shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
                .accessibilityIdentifier(id)
        }
        .frame(maxWidth: .infinity)
    }
    private func buildIcon(for label: String) -> String {
        let normalized = label.lowercased()
        if normalized.contains("wrist") { return "gauge" }
        if normalized.contains("path") || normalized.contains("centerline") { return "checkmark.circle" }
        if normalized.contains("extension") { return "arrow.up" }
        return "figure.stand"
    }
    private func buildColumn(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 5) {
            // TARGET MECHANICS: one diagram per mechanic being built.
            ShotIQConceptGlyph(concept: label, fallback: icon, size: 22)
                .foregroundStyle(ShotIQColor.ink)
            Text(label).shotiqBody(7.5, weight: .semibold).kerning(0.4)
                .foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
        }
        .frame(width: 62)
    }
    private func equipCard(_ icon: String, _ title: String, _ caption: String) -> some View {
        HStack(spacing: 10) {
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 26)
                .foregroundStyle(ShotIQColor.ink)
                .frame(width: 26)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).shotiqBody(13, weight: .semibold)
                Text(caption).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1).minimumScaleFactor(0.8)
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    private func legend(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 6) {
            HStack(spacing: 2) {
                ForEach(0..<3, id: \.self) { _ in Circle().fill(color).frame(width: 3.5, height: 3.5) }
            }
            Text(label).shotiqBody(11).foregroundStyle(ShotIQColor.ink)
        }
    }
    private func squareNav(_ icon: String, id: String, @ViewBuilder dest: @escaping () -> some View) -> some View {
        NavigationLink { dest() } label: {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                     size: 18,
                                     label: nil)
                .frame(width: 54, height: 54)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        }
        .accessibilityIdentifier(id)
    }
}

struct DrillExecutionData {
    var drillName: String
    var cue: String
    var focus: String
    var targetMakes: Int
    var mediaKey: String

    static func resolve(drillName: String, latestAnalysis: ShotIQAnalysisResultDTO?) -> DrillExecutionData {
        let detail = DrillDetailData.resolve(name: drillName, latestAnalysis: latestAnalysis)
        let canonicalDemo = latestAnalysis == nil && UITestHooks.demoData
        let focus = detail.mechanics.first?.0 ?? "Elbow alignment"
        return DrillExecutionData(
            drillName: detail.name,
            cue: canonicalDemo ? "Keep elbow stacked through release" : detail.cue,
            focus: canonicalDemo ? "Elbow alignment at release" : focus,
            targetMakes: canonicalDemo ? 15 : targetMakes(from: detail.reps),
            mediaKey: canonicalDemo ? "060-visual-002" : detail.photo)
    }

    private static func targetMakes(from reps: String) -> Int {
        let firstNumber = reps.split { !$0.isNumber }.compactMap { Int($0) }.first ?? 24
        return max(1, Int((Double(firstNumber) * 0.625).rounded()))
    }
}

struct MyDrillsView: View {         // 058
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage(TrainingSavedDrillStore.key) private var savedDrillsPayload = ""
    @State private var tab = 1                  // 0 TRAIN · 1 MY DRILLS · 2 ASSIGNED
    @State private var sortMode = "Newest"
    @State private var phaseFilter = "All phases"
    private let drills: [TrainingSavedDrill] = [
        TrainingSavedDrill(name: "Quick Release Builder",
                           description: "Keep elbow stacked through release",
                           phase: "RELEASE", shots: 24, makes: 15,
                           accuracy: "62.5%", completed: "May 10, 2025",
                           difficulty: "Intermediate", duration: "20 min",
                           photo: "058-visual-002"),
        TrainingSavedDrill(name: "Stationary Pound Dribble",
                           description: "Build a strong handle with a stationary pound dribble focus",
                           phase: "LOAD", shots: 18, makes: 11,
                           accuracy: "61.1%", completed: "May 8, 2025",
                           difficulty: "Beginner", duration: "15 min",
                           photo: "058-visual-001"),
        TrainingSavedDrill(name: "Speed Dribble Combo",
                           description: "Advance your handle with speed dribble combinations and counters",
                           phase: "RISE", shots: 30, makes: 21,
                           accuracy: "70.0%", completed: "May 5, 2025",
                           difficulty: "Intermediate", duration: "18 min",
                           photo: "058-visual-003"),
        TrainingSavedDrill(name: "1-2 Step Finishing",
                           description: "Finish at the rim using quick 1-2 step footwork and control",
                           phase: "RISE", shots: 16, makes: 12,
                           accuracy: "75.0%", completed: "Apr 28, 2025",
                           difficulty: "Beginner", duration: "12 min",
                           photo: "058-visual-004")
    ]
    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    private var savedCatalogDrills: [TrainingSavedDrill] {
        TrainingSavedDrillStore.decode(savedDrillsPayload)
    }
    private var allDrills: [TrainingSavedDrill] {
        savedCatalogDrills + drills.filter { canonical in
            !savedCatalogDrills.contains { $0.name.caseInsensitiveCompare(canonical.name) == .orderedSame }
        }
    }
    private var visibleDrills: [TrainingSavedDrill] {
        var out = allDrills.filter { phaseFilter == "All phases" || $0.phase == phaseFilter }
        if sortMode == "Best accuracy" {
            out.sort { (Double($0.accuracy.dropLast()) ?? -1) > (Double($1.accuracy.dropLast()) ?? -1) }
        }
        return out
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-my-drills") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        NavigationLink { AnalyzeHubView() } label: {
                            HStack(spacing: 10) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.viewfinder"),
                                                         size: 18,
                                                         label: nil)
                                Text("Analyze shot").shotiqBody(17, weight: .medium)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                        .padding(.top, 16)
                        HStack(spacing: 0) {
                            tabButton("figure.run", "TRAIN", "Drills & workouts", 0)
                            tabButton("point.3.connected.trianglepath.dotted", "MY DRILLS", "Saved for you", 1)
                            tabButton("scribble.variable", "ASSIGNED", "From coach", 2)
                        }
                        .padding(.top, 18)
                        HStack {
                            SectionLabel(text: "\(visibleDrills.count) DRILLS")
                            Spacer()
                            Menu {
                                Button("Newest") { sortMode = "Newest" }
                                Button("Best accuracy") { sortMode = "Best accuracy" }
                            } label: {
                                HStack(spacing: 4) {
                                    Text("Sort:").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    Text(sortMode).shotiqBody(12, weight: .semibold)
                                        .foregroundStyle(ShotIQColor.ink)
                                    Image(systemName: "chevron.down").font(.system(size: 8))
                                        .foregroundStyle(ShotIQColor.ink)
                                }
                            }
                            VRule(height: 14).padding(.horizontal, 8)
                            Menu {
                                ForEach(["All phases", "SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                                    Button(p) { phaseFilter = p }
                                }
                            } label: {
                                HStack(spacing: 5) {
                                    Text(phaseFilter == "All phases" ? "Filter" : phaseFilter)
                                        .shotiqBody(12)
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-settings",
                                                             size: 12,
                                                             label: nil)
                                }
                                .foregroundStyle(phaseFilter == "All phases" ? ShotIQColor.ink : ShotIQColor.shotiqOrange)
                            }
                        }
                        .padding(.top, 18)
                        if tab == 2 {
                            ShotIQCard {
                                VStack(spacing: 8) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-workout-saved",
                                                             size: 28,
                                                             label: nil)
                                    Text("No assigned drills yet").shotiqBody(15, weight: .semibold)
                                    Text("Drills your coach assigns will appear here.")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 28)
                            }
                            .padding(.top, 12)
                        } else {
                            ForEach(visibleDrills) { d in
                                drillCard(d)
                                    .padding(.top, 12)
                            }
                        }
                        ShotIQCard {
                            HStack(spacing: 12) {
                                PhotoThumb(width: 74, height: 74, icon: "viewfinder")
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("READY TO DISCOVER MORE DRILLS?").shotiqBody(13, weight: .bold)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                    Text("Find new drills tailored to your shooting mechanics and training goals.")
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 6)
                                NavigationLink { DiscoverDrillsView() } label: {
                                    Text("Discover drills").shotiqBody(12, weight: .semibold)
                                        .padding(.horizontal, 11).padding(.vertical, 8)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                            }
                            .padding(12)
                        }
                        .padding(.top, 14)
                        PhaseStrip().padding(.top, 22)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func tabButton(_ icon: String, _ title: String, _ caption: String, _ index: Int) -> some View {
        let selected = tab == index
        // TRAIN pops back to the training home this screen was pushed from;
        // the other two switch the visible list in place.
        return Button {
            if index == 0 { dismiss() } else { tab = index }
        } label: {
            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    ShotIQConceptGlyph(concept: title, fallback: icon, size: 16)
                    Text(title).shotiqBody(12, weight: .bold).kerning(0.5)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
                .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                Text(caption).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Rectangle().fill(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                    .frame(height: selected ? 2 : 1)
            }
            .frame(maxWidth: .infinity)
        }
    }
    private func drillCard(_ d: TrainingSavedDrill) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 12) {
                NavigationLink { DrillDetailView(name: d.name) } label: {
                    PhotoThumb(width: 84, height: 150, photo: d.photo)
                }
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top, spacing: 8) {
                        NavigationLink { DrillDetailView(name: d.name) } label: {
                            Text(d.name.uppercased()).shotiqDisplay(18)
                                .multilineTextAlignment(.leading)
                        }
                        Spacer(minLength: 4)
                        NavigationLink { DrillExecutionView(drillName: d.name) } label: {
                            Text("Start drill").shotiqBody(12, weight: .semibold)
                                .padding(.horizontal, 11).padding(.vertical, 7)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                    }
                    Text(d.description).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(2).fixedSize(horizontal: false, vertical: true)
                    HStack(spacing: 8) {
                        metaPill(d.difficulty)
                        metaPill(d.duration)
                    }
                    HStack(spacing: 16) {
                        ForEach(phases, id: \.self) { p in
                            VStack(spacing: 3) {
                                PhaseGlyph(phase: p, active: p == d.phase, size: 18)
                                Rectangle().fill(p == d.phase ? ShotIQColor.shotiqOrange : .clear)
                                    .frame(width: 18, height: 2)
                            }
                        }
                    }
                    HStack(spacing: 0) {
                        miniStat("\(d.shots)", "SHOTS")
                        miniStat("\(d.makes)", "MAKES")
                        miniStat(d.accuracy, "BEST ACCURACY")
                        miniStat(d.completed, "LAST COMPLETED")
                    }
                }
                .padding(.vertical, 12).padding(.trailing, 12)
            }
        }
    }
    private func metaPill(_ text: String) -> some View {
        Text(text).shotiqBody(10, weight: .semibold)
            .foregroundStyle(ShotIQColor.ink)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
            .lineLimit(1).minimumScaleFactor(0.7)
    }
    private func miniStat(_ value: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(.custom("Tungsten-Medium", size: 17)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(7, weight: .medium).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct WorkoutCalendarView: View {  // 059
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @State private var selected = 7
    @State private var monthIndex = 4          // 0-based; 4 = May 2025 (has data)
    @State private var displayYear = 2025
    @State private var dayCardExpanded = true
    private let monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                              "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
    private let daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    private var latestWorkout: TrainingWorkoutRecord? {
        TrainingWorkoutStore.latest(in: completedWorkoutsPayload)
    }
    private var latestComponents: DateComponents? {
        guard let latestWorkout else { return nil }
        return Calendar.current.dateComponents([.year, .month, .day, .weekday], from: latestWorkout.completedAt)
    }
    private var isLocalWorkoutMonth: Bool {
        guard let latestComponents,
              let month = latestComponents.month,
              let year = latestComponents.year else { return false }
        return monthIndex == month - 1 && displayYear == year
    }
    private var isDataMonth: Bool { monthIndex == 4 && displayYear == 2025 }
    private var selectedLocalWorkout: TrainingWorkoutRecord? {
        guard isLocalWorkoutMonth,
              let day = latestComponents?.day,
              selected == day else { return nil }
        return latestWorkout
    }
    private let completed: Set<Int> = [4, 5, 6, 9, 12, 15, 18]
    private let missed: Set<Int> = [10, 17]
    /// Canonical greys 24 with no marker and no duration — the legend's
    /// "no workout" state. 31 falls outside the scheduled range already.
    private let noWorkout: Set<Int> = [24]
    private let minutes: [Int: String] = [4: "18 min", 5: "17 min", 6: "20 min", 9: "15 min",
                                          12: "17 min", 15: "15 min", 18: "18 min"]
    private let weekdayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
    private var topWorkout: TrainingWorkoutRecord? { latestWorkout }
    private var selectedDayTitle: String {
        if let local = selectedLocalWorkout {
            let c = Calendar.current.dateComponents([.month, .day, .weekday], from: local.completedAt)
            let weekday = weekdayNames[max(0, min((c.weekday ?? 1) - 1, weekdayNames.count - 1))]
            let month = monthNames[max(0, min((c.month ?? 1) - 1, monthNames.count - 1))]
            return "\(weekday), \(month) \(c.day ?? selected)"
        }
        let weekday = weekdayNames[(4 + selected - 1) % 7]
        return "\(weekday), MAY \(selected)"
    }
    private var selectedStatusText: String {
        selectedLocalWorkout == nil ? "IN PROGRESS" : "COMPLETED"
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-workout-calendar") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        // Primary target strip
                        HStack(spacing: 10) {
                            CorrectionGlyph(kind: .stack, size: 28).foregroundStyle(ShotIQColor.ink)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("PRIMARY TARGET").shotiqBody(9, weight: .semibold).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("Keep elbow stacked through release")
                                    .shotiqBody(13, weight: .semibold)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            Spacer(minLength: 6)
                            stripStat("\(topWorkout?.shots ?? 24)", "SHOTS", id: "calendar-strip-shots")
                            stripStat("\(topWorkout?.makes ?? 15)", "MAKES", id: "calendar-strip-makes")
                            stripStat(topWorkout?.accuracyText ?? "62.5%", "FG%", id: "calendar-strip-fg")
                        }
                        .padding(12)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 16)
                        // Month header
                        HStack {
                            Button { if monthIndex > 0 { monthIndex -= 1 } } label: {
                                Image(systemName: "chevron.left").font(.system(size: 17))
                                    .foregroundStyle(monthIndex > 0 ? ShotIQColor.ink : ShotIQColor.muted)
                            }
                            .accessibilityLabel("Previous month")
                            Spacer()
                            Text("\(monthNames[monthIndex]) \(displayYear)").shotiqDisplay(26)
                            Spacer()
                            Button { if monthIndex < 11 { monthIndex += 1 } } label: {
                                Image(systemName: "chevron.right").font(.system(size: 17))
                                    .foregroundStyle(monthIndex < 11 ? ShotIQColor.ink : ShotIQColor.muted)
                            }
                            .accessibilityLabel("Next month")
                        }
                        .padding(.top, 16)
                        let cols = Array(repeating: GridItem(.flexible(), spacing: 2), count: 7)
                        LazyVGrid(columns: cols, spacing: 2) {
                            ForEach(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], id: \.self) { d in
                                Text(d).shotiqBody(9, weight: .bold).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            if isDataMonth {
                                // Offset ids, exactly as the trailing run below does.
                                // These April cells print 27-30, and so do May's real
                                // 27-30 further down the SAME LazyVGrid — identical
                                // \.self ids in one grid collide, SwiftUI keeps the
                                // first of each and silently drops the later four, so
                                // the month ended at 26 with 31 stranded.
                                ForEach(227...230, id: \.self) { d in adjacentCell(d - 200) }
                            }
                            ForEach(1...daysInMonth[monthIndex], id: \.self) { d in dayCell(d) }
                            if isDataMonth {
                                ForEach(101...107, id: \.self) { d in adjacentCell(d - 100) }
                            }
                        }
                        .padding(.top, 10)
                        // Legend
                        HStack(spacing: 10) {
                            legendItem("Completed") { Image(systemName: "checkmark.circle").font(.system(size: 11)).foregroundStyle(ShotIQColor.confirmGreen) }
                            legendItem("Scheduled") { Circle().stroke(ShotIQColor.shotiqOrange, lineWidth: 1.4).frame(width: 10, height: 10) }
                            legendItem("In Progress") { Circle().fill(ShotIQColor.shotiqOrange).frame(width: 10, height: 10) }
                            legendItem("Missed") { Image(systemName: "xmark.circle").font(.system(size: 11)).foregroundStyle(ShotIQColor.reviewRed) }
                            legendItem("No workout") { Text("24").font(.custom("Tungsten-Medium", size: 12)).foregroundStyle(ShotIQColor.muted) }
                        }
                        .padding(.top, 12)
                        // Selected day card
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 10) {
                                    Text(selectedDayTitle)
                                        .shotiqBody(15, weight: .bold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                        .accessibilityIdentifier("calendar-selected-day-title")
                                    Text(selectedStatusText).shotiqBody(9, weight: .bold).kerning(0.4)
                                        .padding(.horizontal, 7).padding(.vertical, 3)
                                        .overlay(RoundedRectangle(cornerRadius: 4).stroke(selectedLocalWorkout == nil ? ShotIQColor.shotiqOrange : ShotIQColor.confirmGreen))
                                        .foregroundStyle(selectedLocalWorkout == nil ? ShotIQColor.shotiqOrange : ShotIQColor.confirmGreen)
                                        .accessibilityIdentifier("calendar-selected-status")
                                    Spacer()
                                    Button { withAnimation { dayCardExpanded.toggle() } } label: {
                                        Image(systemName: dayCardExpanded ? "chevron.up" : "chevron.down")
                                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                                    }
                                    .accessibilityLabel(dayCardExpanded ? "Collapse day details" : "Expand day details")
                                }
                                if dayCardExpanded {
                                HStack(alignment: .top, spacing: 12) {
                                    PhotoThumb(width: 112, height: 128, photo: "059-visual-001")
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(selectedLocalWorkout?.drillName.uppercased() ?? "COMBO LADDER").shotiqDisplay(22)
                                            .accessibilityIdentifier("calendar-selected-workout-name")
                                        HStack(spacing: 5) {
                                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "clock"), size: 32).font(.system(size: 11))
                                            Text(selectedLocalWorkout.map { "Completed • \($0.shots) shots • \($0.accuracyText)" } ?? "Day 4 of 7 • 17 min").shotiqBody(12, weight: .semibold)
                                                .accessibilityIdentifier("calendar-selected-workout-summary")
                                        }
                                        Text(selectedLocalWorkout.map { "Saved session: \($0.makes) makes, \($0.misses) misses, +\($0.pointsEarned) points earned." } ??
                                             "Layer catch-and-shoot reps with movement progressions to reinforce release timing and alignment under fatigue.")
                                            .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                        HStack(spacing: 12) {
                                            ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                                                PhaseGlyph(phase: p, active: p == "RELEASE", size: 16)
                                            }
                                        }
                                    }
                                }
                                NavigationLink { DrillExecutionView(drillName: "Combo Ladder") } label: {
                                    HStack(spacing: 8) {
                                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.viewfinder"),
                                                                 size: 18,
                                                                 label: nil)
                                        Text("Open workout").shotiqBody(16, weight: .medium)
                                    }
                                    .frame(maxWidth: .infinity).frame(height: 50)
                                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                    .foregroundStyle(.white)
                                }
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 14)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .onAppear(perform: syncLatestWorkoutSelection)
    }
    private func syncLatestWorkoutSelection() {
        guard let c = latestComponents,
              let month = c.month,
              let year = c.year,
              let day = c.day else { return }
        monthIndex = max(0, min(month - 1, 11))
        displayYear = year
        selected = day
    }
    private func stripStat(_ value: String, _ label: String, id: String? = nil) -> some View {
        VStack(spacing: 1) {
            Text(value).font(.custom("Tungsten-Medium", size: 17)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
                .accessibilityIdentifier(id ?? "")
            Text(label).shotiqBody(7, weight: .medium).foregroundStyle(ShotIQColor.graphite)
        }
    }
    private func adjacentCell(_ d: Int) -> some View {
        Text("\(d)").shotiqBody(13).foregroundStyle(ShotIQColor.muted)
            .frame(maxWidth: .infinity, minHeight: 54, alignment: .top)
            .padding(.top, 4)
    }
    @ViewBuilder
    private func dayCell(_ d: Int) -> some View {
        Button { selected = d; dayCardExpanded = true } label: {
            VStack(spacing: 3) {
                if isLocalWorkoutMonth && d == latestComponents?.day {
                    Text("\(d)").shotiqBody(12, weight: .bold)
                        .foregroundStyle(d == selected ? .white : ShotIQColor.ink)
                        .frame(width: 26, height: 26)
                        .background(d == selected ? ShotIQColor.shotiqOrange : .clear, in: Circle())
                    Image(systemName: "checkmark.circle").font(.system(size: 12))
                        .foregroundStyle(ShotIQColor.confirmGreen)
                    Text(latestWorkout.map { "\($0.shots) shots" } ?? "Done")
                        .shotiqBody(7).foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1).minimumScaleFactor(0.7)
                } else if !isDataMonth {
                    Text("\(d)").shotiqBody(13).foregroundStyle(ShotIQColor.ink)
                } else if d == selected {
                    Text("\(d)").shotiqBody(12, weight: .bold).foregroundStyle(.white)
                        .frame(width: 26, height: 26)
                        .background(ShotIQColor.shotiqOrange, in: Circle())
                    Text("In Progress").shotiqBody(7, weight: .semibold)
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .lineLimit(1).minimumScaleFactor(0.7)
                } else {
                    Text("\(d)").shotiqBody(13, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                    if completed.contains(d) {
                        Image(systemName: "checkmark.circle").font(.system(size: 12))
                            .foregroundStyle(ShotIQColor.confirmGreen)
                        Text(minutes[d] ?? "").shotiqBody(7).foregroundStyle(ShotIQColor.graphite)
                    } else if missed.contains(d) {
                        Image(systemName: "xmark.circle").font(.system(size: 12))
                            .foregroundStyle(ShotIQColor.reviewRed)
                        Text("Missed").shotiqBody(7).foregroundStyle(ShotIQColor.reviewRed)
                    } else if d >= 8 && d <= 30 && !noWorkout.contains(d) {
                        Circle().stroke(ShotIQColor.shotiqOrange, lineWidth: 1.3)
                            .frame(width: 12, height: 12)
                        Text("20 min").shotiqBody(7).foregroundStyle(ShotIQColor.graphite)
                    }
                }
            }
            .frame(maxWidth: .infinity, minHeight: 54, alignment: .top)
            .padding(.top, 4)
        }
    }
    private func legendItem(_ label: String, @ViewBuilder mark: () -> some View) -> some View {
        HStack(spacing: 4) {
            mark()
            Text(label).shotiqBody(8.5).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
    }
}

@MainActor
final class DrillSessionModel: ObservableObject {
    @Published var shots: [(n: Int, made: Bool)] = []
    @Published var elapsed = 0
    @Published var paused = false
    @Published var saving = false
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
    /// Marks count locally so Undo can truly remove the last shot; the whole
    /// session is persisted in one batch by `finish` — matching the backend,
    /// where POST /api/shot-events accepts `{ events: [...] }` batches and has
    /// no per-event delete.
    func mark(_ made: Bool, drillId: String) { n += 1; shots.append((n, made)) }
    func undo() { if !shots.isEmpty { shots.removeLast(); n = max(0, n - 1) } }

    // POST /api/shot-events — shape per src/app/api/shot-events/route.ts.
    private struct ShotEventsBody: Encodable {
        struct Event: Encodable {
            var sequence: Int
            var detected = true
            var detectedResult: String
            var confidence = 1.0
            var metadata: [String: String]
        }
        var events: [Event]
    }
    // POST /api/workouts — shape per src/app/api/workouts/route.ts.
    private struct WorkoutBody: Encodable {
        var name: String
        var scheduledDate: String
        var completed = true
        var completedAt: String
        var duration: Int
        var totalShots: Int
        var totalMade: Int
        var totalMissed: Int
        var accuracy: Double
    }

    /// Ends the session: writes every marked shot to /api/shot-events and the
    /// completed workout (real totals) to /api/workouts.
    func finish(drillName: String) async {
        stop()
        guard !shots.isEmpty, !saving else { return }
        saving = true
        defer { saving = false }
        let events = shots.map { shot in
            ShotEventsBody.Event(sequence: shot.n,
                                 detectedResult: shot.made ? "make" : "miss",
                                 metadata: ["drillId": drillName, "source": "ios-manual"])
        }
        await APIClient.shared.send("/api/shot-events", body: ShotEventsBody(events: events))
        let now = ISO8601DateFormatter().string(from: Date())
        let made = makes
        await APIClient.shared.send("/api/workouts", body: WorkoutBody(
            name: drillName,
            scheduledDate: now,
            completedAt: now,
            duration: max(1, Int((Double(elapsed) / 60).rounded())),
            totalShots: shots.count,
            totalMade: made,
            totalMissed: shots.count - made,
            accuracy: Double(made) / Double(shots.count) * 100))
    }
}

struct DrillExecutionView: View {   // 060
    @EnvironmentObject var app: AppState
    var drillName = "Pound Crossover Foundation"
    @StateObject private var m = DrillSessionModel()
    @State private var viewAngle = "FRONT VIEW"
    @State private var showCompletion = false
    @State private var toast: ShotIQToast?
    @State private var drillFeedback: ShotIQToast?
    private var executionData: DrillExecutionData {
        DrillExecutionData.resolve(drillName: drillName, latestAnalysis: app.recentMedia.first?.analysis)
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-drill-execution") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .center, spacing: 10) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("DRILL EXECUTION").shotiqDisplay(30)
                                Text(executionData.drillName.uppercased()).shotiqBody(10, weight: .bold).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                                    .accessibilityIdentifier("drill-execution-drill-name")
                            }
                            Text("Set 2 of 5").shotiqBody(12, weight: .medium)
                                .padding(.horizontal, 10).padding(.vertical, 5)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("TARGET").shotiqBody(10, weight: .semibold).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("\(executionData.targetMakes) makes").shotiqBody(16, weight: .semibold)
                                    .accessibilityIdentifier("drill-execution-target")
                            }
                        }
                        .padding(.top, 14)
                        ShotIQCard {
                            HStack(alignment: .center, spacing: 12) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("COACHING CUE").shotiqBody(11, weight: .bold).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text(executionData.cue).shotiqBody(17, weight: .bold)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .accessibilityIdentifier("drill-execution-cue")
                                }
                                Spacer(minLength: 4)
                                VRule(height: 58)
                                CorrectionGlyph(kind: .stack, size: 40).foregroundStyle(ShotIQColor.ink)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("FOCUS AREA").shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(executionData.focus).shotiqBody(12, weight: .medium)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .accessibilityIdentifier("drill-execution-focus")
                                }
                                .frame(width: 84)
                            }
                            .padding(14)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            HStack(spacing: 0) {
                                execStat("\(m.makes)", "MAKES", id: "drill-execution-makes")
                                VRule(height: 40)
                                execStat("\(m.shots.count)", "SHOTS", id: "drill-execution-shots")
                                VRule(height: 40)
                                execStat(String(format: "%.1f%%", m.pct * 100), "MAKE %", id: "drill-execution-make-pct")
                                Spacer(minLength: 8)
                                VStack(spacing: 6) {
                                    HStack(spacing: 5) {
                                        ForEach(0..<6, id: \.self) { i in
                                            Circle()
                                                .fill(i < min(6, m.makes * 6 / executionData.targetMakes)
                                                      ? ShotIQColor.confirmGreen : ShotIQColor.rule)
                                                .frame(width: 11, height: 11)
                                        }
                                    }
                                    Text("\(max(executionData.targetMakes - m.makes, 0)) to target")
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .accessibilityIdentifier("drill-execution-target-remaining")
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 10)
                        ZStack(alignment: .top) {
                            CanonicalMediaSurface(key: executionData.mediaKey, height: 290)
                                .accessibilityIdentifier("drill-execution-media")
                                .accessibilityLabel("Drill execution media \(executionData.mediaKey)")
                            HStack {
                                Menu {
                                    ForEach(["FRONT VIEW", "SIDE VIEW", "REAR VIEW"], id: \.self) { v in
                                        Button(v) {
                                            viewAngle = v
                                            toast = .success("Camera view changed", v)
                                        }
                                    }
                                } label: {
                                    HStack(spacing: 5) {
                                        Text(viewAngle).shotiqBody(10, weight: .bold).kerning(0.5)
                                            .accessibilityIdentifier("drill-execution-view-angle")
                                        Image(systemName: "chevron.down").font(.system(size: 8))
                                    }
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 10).padding(.vertical, 6)
                                    .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 5))
                                }
                                Spacer()
                                HStack(spacing: 6) {
                                    Circle().fill(ShotIQColor.shotiqOrange).frame(width: 7, height: 7)
                                    Text(String(format: "%02d:%02d", m.elapsed / 60, m.elapsed % 60))
                                        .font(.custom("Tungsten-Medium", size: 14)).foregroundStyle(.white)
                                        .accessibilityIdentifier("drill-execution-timer")
                                }
                                .padding(.horizontal, 9).padding(.vertical, 5)
                                .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 5))
                            }
                            .padding(10)
                        }
                        .padding(.top, 12)
                        PhaseStrip().padding(.top, 16)
                        drillFeedbackStrip
                            .padding(.top, 10)
                        HStack(spacing: 10) {
                            Button {
                                m.undo()
                                toast = .info("Last shot removed", "\(m.shots.count) shots remaining")
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "arrow.uturn.backward")
                                    Text("Undo").shotiqBody(15)
                                }
                                .frame(maxWidth: .infinity).frame(height: 48)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            .accessibilityLabel("Undo last shot")
                            .accessibilityIdentifier("drill-execution-undo")
                            Button {
                                m.paused.toggle()
                                toast = .info(m.paused ? "Workout paused" : "Workout resumed",
                                              m.paused ? "Timer is paused." : "Keep tracking your makes.")
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: m.paused ? "play" : "pause")
                                    Text(m.paused ? "Resume" : "Pause").shotiqBody(15)
                                }
                                .frame(maxWidth: .infinity).frame(height: 48)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            .accessibilityIdentifier("drill-execution-pause")
                        }
                        .padding(.top, 10)
                        Button {
                            Task {
                                toast = .progress("Saving workout", "Syncing shots and workout summary.", progress: 0.65)
                                await m.finish(drillName: executionData.drillName)   // persist shots + workout
                                toast = .success("Workout saved", "Opening your completion summary.")
                                try? await Task.sleep(nanoseconds: 650_000_000)
                                showCompletion = true
                            }
                        } label: {
                            HStack(spacing: 8) {
                                if m.saving { ProgressView().tint(ShotIQColor.shotiqOrange) }
                                else { Image(systemName: "stop.circle") }
                                Text(m.saving ? "Saving…" : "End workout").shotiqBody(16, weight: .medium)
                            }
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .disabled(m.saving)
                        .accessibilityIdentifier("drill-execution-end-workout")
                        .padding(.top, 10)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
        .safeAreaInset(edge: .bottom) {
            shotActionButtons
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial)
        }
        .navigationDestination(isPresented: $showCompletion) {
            WorkoutCompletionView(shots: m.shots.count, makes: m.makes, drillName: executionData.drillName)
        }
        .onAppear { m.start() }
        .onDisappear { m.stop() }
    }
    private func recordShot(made: Bool) {
        m.mark(made, drillId: executionData.drillName)
        let feedback: ShotIQToast = made
            ? .success("Make recorded", "\(m.makes) makes • \(m.shots.count) shots")
            : .info("Miss recorded", "\(m.makes) makes • \(m.shots.count) shots")
        drillFeedback = feedback
        toast = feedback
    }

    private var shotActionButtons: some View {
        HStack(spacing: 10) {
            Button {
                recordShot(made: true)
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle")
                    Text("Mark make").shotiqBody(15, weight: .semibold)
                }
                .frame(maxWidth: .infinity).frame(height: 52)
                .background(ShotIQColor.confirmGreen, in: RoundedRectangle(cornerRadius: 8))
                .foregroundStyle(.white)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Mark make")
            .accessibilityIdentifier("mark-make")

            Button {
                recordShot(made: false)
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "xmark.circle")
                    Text("Mark miss").shotiqBody(15, weight: .semibold)
                }
                .frame(maxWidth: .infinity).frame(height: 52)
                .background(ShotIQColor.reviewRed, in: RoundedRectangle(cornerRadius: 8))
                .foregroundStyle(.white)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Mark miss")
            .accessibilityIdentifier("mark-miss")
        }
    }

    @ViewBuilder private var drillFeedbackStrip: some View {
        if let toast = drillFeedback {
            HStack(spacing: 10) {
                ShotIQApprovedRasterIcon(
                    assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: toast.kind.icon),
                    size: 18,
                    label: nil
                )
                VStack(alignment: .leading, spacing: 2) {
                    Text(toast.title)
                        .shotiqBody(13, weight: .bold)
                        .foregroundStyle(ShotIQColor.ink)
                    if let message = toast.message, !message.isEmpty {
                        Text(message)
                            .shotiqBody(11)
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                }
                Spacer()
            }
            .padding(12)
            .background(toast.kind.tint.opacity(0.10), in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(toast.kind.tint.opacity(0.32)))
            .accessibilityElement(children: .combine)
            .accessibilityLabel([toast.title, toast.message].compactMap { $0 }.joined(separator: ". "))
            .accessibilityIdentifier("shotiq-toast")
        }
    }

    private func execStat(_ value: String, _ label: String, id: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.custom("Tungsten-Medium", size: 30)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
                .accessibilityIdentifier(id)
            Text(label).shotiqBody(9, weight: .medium).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ShotTrackerView: View {      // 061
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @StateObject private var m = DrillSessionModel()
    @State private var showCompletion = false
    @State private var toast: ShotIQToast?
    @State private var completedWorkout: TrainingWorkoutRecord?
    private let sessionTarget = 25
    private var shots: Int { m.shots.count }
    private var makes: Int { m.makes }
    private var pct: Double { shots == 0 ? 0 : Double(makes) / Double(shots) }
    private var currentStreak: Int {
        var streak = 0
        for shot in m.shots.reversed() {
            guard shot.made else { break }
            streak += 1
        }
        return streak
    }
    private var phaseScores: [(String, String)] {
        guard shots > 0 else {
            return [("SETUP", "--"), ("LOAD", "--"), ("RISE", "--"),
                    ("RELEASE", "--"), ("FOLLOW-THROUGH", "--")]
        }
        let record = TrainingWorkoutRecord.manualSession(drillName: "Shot Tracker Session",
                                                         shots: shots,
                                                         makes: makes,
                                                         durationSeconds: m.elapsed)
        return record.phaseScores.map { ($0.0, "\($0.1)%") }
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-shot-tracker") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    // Session bar
                    HStack(spacing: 10) {
                        Text("20-MINUTE TRAINING SESSION").shotiqBody(14, weight: .bold)
                            .lineLimit(1).minimumScaleFactor(0.7)
                        Spacer(minLength: 6)
                        Image(systemName: "stopwatch").font(.system(size: 13))
                        VStack(alignment: .leading, spacing: 0) {
                            Text(String(format: "%02d:%02d", max(0, 20 * 60 - m.elapsed) / 60,
                                        max(0, 20 * 60 - m.elapsed) % 60))
                                .font(.custom("Tungsten-Medium", size: 17))
                            Text("REMAINING").shotiqBody(7, weight: .medium).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        VRule(height: 26)
                        Button {
                            m.paused.toggle()
                            toast = .info(m.paused ? "Workout paused" : "Workout resumed")
                        } label: {
                            HStack(spacing: 5) {
                                Image(systemName: m.paused ? "play.fill" : "pause.fill").font(.system(size: 10))
                            Text(m.paused ? "RESUME" : "PAUSE WORKOUT")
                                .shotiqBody(10, weight: .bold).kerning(0.4)
                                .lineLimit(1).minimumScaleFactor(0.7)
                        }
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .accessibilityIdentifier("tracker-pause")
                    }
                    .padding(.horizontal, 20).padding(.vertical, 12)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    SectionLabel(text: "SHOT TRACKER")
                                    Spacer()
                                    Text("\(shots) OF \(sessionTarget)")
                                        .font(.custom("Tungsten-Medium", size: 16))
                                }
                                // This plate stays live because it counts the
                                // shots the player records in this session.
                                ZStack(alignment: .bottomLeading) {
                                    CanonicalPhoto("061-visual-001", height: 284)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(shots == 0 ? "READY" : "SHOT \(shots)")
                                            .shotiqBody(10, weight: .bold).kerning(0.4)
                                        Text(shots == 0 ? "START SESSION" : "JUST NOW")
                                            .shotiqBody(7).opacity(0.8)
                                    }
                                    .foregroundStyle(.white)
                                    .padding(8)
                                    .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 4))
                                    .padding(10)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            VStack(alignment: .leading, spacing: 9) {
                                MicroLabel(text: "MAKE PERCENTAGE")
                                Text(String(format: "%.1f%%", pct * 100))
                                    .font(.custom("Tungsten-Medium", size: 36))
                                    .foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                    .accessibilityIdentifier("tracker-make-pct")
                                Text("\(makes) OF \(shots)").font(.custom("Tungsten-Medium", size: 14))
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .accessibilityIdentifier("tracker-makes-total")
                                Ring(pct: pct, color: ShotIQColor.confirmGreen, lineWidth: 7)
                                    .frame(width: 54, height: 54)
                                HRule()
                                MicroLabel(text: "CURRENT STREAK")
                                HStack(alignment: .firstTextBaseline, spacing: 4) {
                                    Text("\(currentStreak)").font(.custom("Tungsten-Medium", size: 26))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                        .accessibilityIdentifier("tracker-current-streak")
                                    Text("MAKES").shotiqBody(8, weight: .bold)
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                }
                                HRule()
                                MicroLabel(text: "QUICK CORRECTION")
                                correction("Elbow Height", "Raise elbow")
                                correction("Shooting Pocket", "Tighten pocket")
                                correction("Release Arc", "Less forward tilt")
                                NavigationLink { AnalysisResultOverviewView() } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: "list.bullet").font(.system(size: 10))
                                        Text("VIEW ANALYSIS").shotiqBody(9, weight: .bold).kerning(0.4)
                                    }
                                    .frame(maxWidth: .infinity).frame(height: 34)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                    .foregroundStyle(ShotIQColor.ink)
                                }
                            }
                            .frame(width: 128)
                        }
                        .padding(.top, 16)
                        SectionLabel(text: "SET PROGRESS").padding(.top, 20)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(1...sessionTarget, id: \.self) { i in
                                    VStack(spacing: 3) {
                                        if i <= shots {
                                            let made = m.shots.indices.contains(i - 1)
                                                ? m.shots[i - 1].made : true
                                            Image(systemName: made ? "checkmark.circle.fill" : "xmark.circle")
                                                .font(.system(size: 18))
                                                .foregroundStyle(made ? ShotIQColor.confirmGreen : ShotIQColor.reviewRed)
                                        } else {
                                            Circle().stroke(ShotIQColor.rule, lineWidth: 1.4)
                                                .frame(width: 17, height: 17)
                                        }
                                        Text("\(i)").shotiqBody(9).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                            }
                            .padding(.vertical, 2)
                        }
                        .padding(.top, 8)
                        HStack(spacing: 16) {
                            Spacer()
                            HStack(spacing: 5) {
                                Image(systemName: "checkmark.circle.fill").font(.system(size: 11))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                Text("MAKE").shotiqBody(9, weight: .bold)
                            }
                            HStack(spacing: 5) {
                                Image(systemName: "xmark.circle").font(.system(size: 11))
                                    .foregroundStyle(ShotIQColor.reviewRed)
                                Text("MISS").shotiqBody(9, weight: .bold)
                            }
                            Spacer()
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "SHOT RAIL").padding(.top, 20)
                        HStack(alignment: .top) {
                            ForEach(phaseScores, id: \.0) { p in
                                VStack(spacing: 3) {
                                    PhaseGlyph(phase: p.0, active: p.0 == "RELEASE", size: 26)
                                    Text(p.0).shotiqBody(8, weight: p.0 == "RELEASE" ? .bold : .regular)
                                        .kerning(0.3)
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text(p.1).font(.custom("Tungsten-Medium", size: 12))
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.top, 8)
                        ScoreBar(pct: pct).padding(.top, 8)
                        HStack(spacing: 8) {
                            Button {
                                m.mark(true, drillId: "shot-tracker")
                                toast = .success("Make recorded", "\(makes) of \(shots) shots made")
                            } label: {
                                trackerButton("checkmark.circle", "MARK MAKE", .white, ShotIQColor.confirmGreen)
                            }
                            .accessibilityLabel("Mark make")
                            .accessibilityIdentifier("tracker-mark-make")
                            Button {
                                m.mark(false, drillId: "shot-tracker")
                                toast = .info("Miss recorded", "\(makes) of \(shots) shots made")
                            } label: {
                                trackerButton("xmark.circle", "MARK MISS", .white, ShotIQColor.shotiqOrange)
                            }
                            .accessibilityLabel("Mark miss")
                            .accessibilityIdentifier("tracker-mark-miss")
                            Button {
                                m.undo()
                                toast = .info("Last shot removed", "\(shots) shots tracked")
                            } label: {
                                trackerButton("arrow.uturn.backward", "UNDO", ShotIQColor.ink, nil)
                            }
                            .accessibilityLabel("Undo last shot")
                            .accessibilityIdentifier("tracker-undo")
                            Button {
                                Task {
                                    toast = .progress("Saving workout", "Syncing shot tracker results.", progress: 0.65)
                                    await m.finish(drillName: "Shot Tracker Session")
                                    let workout = TrainingWorkoutRecord.manualSession(
                                        drillName: "Shot Tracker Session",
                                        shots: shots,
                                        makes: makes,
                                        durationSeconds: m.elapsed)
                                    completedWorkoutsPayload = TrainingWorkoutStore.save(workout, in: completedWorkoutsPayload)
                                    completedWorkout = workout
                                    toast = .success("Workout saved", "Opening your completion summary.")
                                    try? await Task.sleep(nanoseconds: 650_000_000)
                                    showCompletion = true
                                }
                            } label: {
                                trackerButton("stop.circle", m.saving ? "SAVING…" : "END WORKOUT", ShotIQColor.ink, nil)
                            }
                            .disabled(m.saving)
                            .accessibilityLabel("End workout")
                            .accessibilityIdentifier("tracker-end-workout")
                        }
                        .padding(.top, 18)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
        .navigationDestination(isPresented: $showCompletion) {
            WorkoutCompletionView(workout: completedWorkout, shots: shots, makes: makes, drillName: "Shot Tracker Session")
        }
        .onAppear { m.start() }
        .onDisappear { m.stop() }
    }
    private func correction(_ title: String, _ caption: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(title).shotiqBody(11, weight: .semibold)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(caption).shotiqBody(9).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .padding(.horizontal, 8).padding(.vertical, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
    }
    private func trackerButton(_ icon: String, _ label: String, _ fg: Color, _ bg: Color?) -> some View {
        HStack(spacing: 5) {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                     size: 12,
                                     label: nil)
            Text(label).shotiqBody(10, weight: .bold).kerning(0.3)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity).frame(height: 50)
        .background(bg ?? .clear, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(bg == nil ? ShotIQColor.rule : .clear))
        .foregroundStyle(fg)
    }
}

struct WorkoutCompletionView: View { // 062
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    var workout: TrainingWorkoutRecord?
    var shots = 24; var makes = 15
    var drillName = "Quick Release Builder"
    private var resolvedWorkout: TrainingWorkoutRecord {
        workout ?? TrainingWorkoutStore.latest(in: completedWorkoutsPayload) ??
        TrainingWorkoutRecord.manualSession(drillName: drillName,
                                            shots: shots,
                                            makes: makes,
                                            durationSeconds: 20 * 60)
    }
    private var accuracy: String { resolvedWorkout.accuracyText }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-workout-completion") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    HStack(alignment: .center, spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("WORKOUT COMPLETE").shotiqDisplay(34)
                            Text(resolvedWorkout.drillName.uppercased()).shotiqBody(10, weight: .bold).kerning(0.5)
                                .foregroundStyle(ShotIQColor.graphite)
                                .lineLimit(1).minimumScaleFactor(0.7)
                                .accessibilityIdentifier("completion-drill-name")
                            Text("Great session, \(app.user?.firstName ?? "Jordan").")
                                .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer(minLength: 8)
                        NavigationLink { WorkoutCalendarView() } label: {
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                        }
                        .buttonStyle(.plain)
                        VRule(height: 46)
                        NavigationLink { PlayerCardView() } label: {
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)
                    VStack(alignment: .leading, spacing: 0) {
                        ShotIQCard {
                            HStack(spacing: 0) {
                                completionStat("scope", "\(resolvedWorkout.shots)", "SHOTS", ShotIQColor.ink,
                                               id: "completion-shots")
                                VRule(height: 54)
                                completionStat("target", "\(resolvedWorkout.makes)", "MAKES", ShotIQColor.ink,
                                               id: "completion-makes")
                                VRule(height: 54)
                                completionStat("gauge", accuracy, "ACCURACY", ShotIQColor.ink,
                                               id: "completion-accuracy")
                                VRule(height: 54)
                                completionStat("chart.line.uptrend.xyaxis", "+\(resolvedWorkout.pointsEarned)",
                                               "POINTS EARNED", ShotIQColor.ink,
                                               id: "completion-points")
                            }
                            .padding(.vertical, 16)
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            HStack(spacing: 0) {
                                PhotoThumb(width: 200, height: 210, photo: "062-visual-001")
                                VStack(alignment: .leading, spacing: 6) {
                                    MicroLabel(text: "FORM SCORE")
                                    Text("\(resolvedWorkout.formScore)").font(.custom("Tungsten-Medium", size: 58))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .accessibilityIdentifier("completion-form-score")
                                    ScoreBar(pct: Double(resolvedWorkout.formScore) / 100).frame(width: 96)
                                    Text(resolvedWorkout.formVerdict).shotiqBody(13, weight: .bold)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text(resolvedWorkout.formNote)
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .padding(14)
                                Spacer(minLength: 0)
                            }
                        }
                        .padding(.top, 12)
                        SectionLabel(text: "PHASE BREAKDOWN").padding(.top, 20)
                        HStack(alignment: .top) {
                            ForEach(resolvedWorkout.phaseScores, id: \.0) { p in
                                VStack(spacing: 4) {
                                    PhaseGlyph(phase: p.0, active: p.0 == "RELEASE", size: 28)
                                    Text(p.0).shotiqBody(8, weight: p.0 == "RELEASE" ? .bold : .regular)
                                        .kerning(0.3)
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text("\(p.1)").font(.custom("Tungsten-Medium", size: 16))
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.top, 10)
                        ShotIQCard {
                            HStack(spacing: 14) {
                                CorrectionGlyph(kind: .stack, size: 38).foregroundStyle(ShotIQColor.ink)
                                    .padding(10)
                                    .overlay(Circle().stroke(ShotIQColor.rule))
                                VStack(alignment: .leading, spacing: 6) {
                                    MicroLabel(text: "PRIMARY TARGET")
                                    Text("Keep elbow stacked through release").shotiqBody(15, weight: .bold)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                    HStack(spacing: 10) {
                                        ScoreBar(pct: Double(resolvedWorkout.primaryTargetScore) / 10, color: ShotIQColor.confirmGreen)
                                        Text("\(resolvedWorkout.primaryTargetScore) / 10").font(.custom("Tungsten-Medium", size: 16))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                            .accessibilityIdentifier("completion-primary-target-score")
                                    }
                                    Text("Progress this session").shotiqBody(11)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 12) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "viewfinder"),
                                                         size: 32,
                                                         label: nil)
                                VStack(alignment: .leading, spacing: 5) {
                                    MicroLabel(text: "COACHING TAKEAWAY")
                                    Text(resolvedWorkout.makes >= resolvedWorkout.misses
                                         ? "Strong shooting rhythm. Keep your elbow stacked as fatigue builds."
                                         : "Keep logging reps. Focus on a clean setup and balanced release.")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 10)
                        NavigationLink { DrillDetailView(name: "Elbow Stack Builder") } label: {
                            ShotIQCard {
                                HStack(spacing: 12) {
                                    Circle().fill(ShotIQColor.analysisBlue).frame(width: 44, height: 44)
                                        .overlay(ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-training-goal",
                                                                         size: 22,
                                                                         label: nil))
                                    VStack(alignment: .leading, spacing: 2) {
                                        MicroLabel(text: "NEXT RECOMMENDATION")
                                        Text("Elbow Stack Builder").shotiqBody(15, weight: .semibold)
                                        Text("15 min • Form Focus — Build alignment and repeatable release.")
                                            .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(1).minimumScaleFactor(0.8)
                                    }
                                    Spacer(minLength: 4)
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(14)
                            }
                        }
                        .padding(.top, 10)
                        HStack(spacing: 10) {
                            NavigationLink { ShotBreakdownView() } label: {
                                HStack(spacing: 6) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-onboarding-review",
                                                             size: 14,
                                                             label: nil)
                                    Text("Review shots").shotiqBody(13, weight: .semibold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 50)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                            ShareLink(item: "ShotIQ workout complete — \(resolvedWorkout.makes)/\(resolvedWorkout.shots) makes (\(accuracy)). 🏀") {
                                HStack(spacing: 6) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-share",
                                                             size: 14,
                                                             label: nil)
                                    Text("Share progress").shotiqBody(13, weight: .semibold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 50)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.analysisBlue))
                                .foregroundStyle(ShotIQColor.analysisBlue)
                            }
                            NavigationLink { DrillExecutionView(drillName: drillName) } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "arrow.clockwise").font(.system(size: 12))
                                    Text("Repeat drill").shotiqBody(13, weight: .semibold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 50)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                        }
                        .padding(.vertical, 20)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    /// Canonical 062 prints four clearly different marks across this row. The
    /// shipped screen used `scope` for SHOTS and `target` for MAKES — two SF
    /// concentric rings that both graders read as the same icon.
    private func completionStat(_ icon: String, _ value: String, _ label: String, _ color: Color,
                                id: String? = nil) -> some View {
        VStack(spacing: 4) {
            StatMarkGlyph(kind: StatMarkGlyph.kind(forStatLabel: label) ?? .volume, size: 18)
                .foregroundStyle(ShotIQColor.ink)
            Text(value).font(.custom("Tungsten-Medium", size: 28)).foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.6)
                .accessibilityIdentifier(id ?? "")
            Text(label).shotiqBody(8, weight: .medium).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }
}
