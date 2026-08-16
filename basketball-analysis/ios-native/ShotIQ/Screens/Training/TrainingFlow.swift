import SwiftUI
import UIKit
import UniformTypeIdentifiers

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

enum TrainingHiddenDrillStore {
    static let key = "shotiq.training.hiddenDrills.v1"

    static func decode(_ payload: String) -> Set<String> {
        guard let data = payload.data(using: .utf8),
              let names = try? JSONDecoder().decode([String].self, from: data) else { return [] }
        return Set(names)
    }

    static func encode(_ names: Set<String>) -> String {
        guard let data = try? JSONEncoder().encode(Array(names).sorted()),
              let payload = String(data: data, encoding: .utf8) else { return "[]" }
        return payload
    }

    static func hide(_ name: String, in payload: String) -> String {
        var hidden = decode(payload)
        hidden.insert(name.lowercased())
        return encode(hidden)
    }

    static func unhide(_ name: String, in payload: String) -> String {
        var hidden = decode(payload)
        hidden.remove(name.lowercased())
        return encode(hidden)
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
                        savedDrillsPayload: String,
                        createdGoalsPayload: String = "") -> TrainingHomeData {
        let presentation = latestAnalysis.map(AnalysisResultPresentation.init(result:))
            ?? (UITestHooks.demoData ? .canonicalDemo : .noResult)
        let latestWorkout = TrainingWorkoutStore.latest(in: completedWorkoutsPayload)
        let latestGoal = CreatedGoalStore.latest(in: createdGoalsPayload)
        let canonicalDemo = latestAnalysis == nil && latestWorkout == nil && latestGoal == nil && UITestHooks.demoData
        let target = latestGoal?.name ?? presentation.coachingTarget
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
                        completedWorkoutsPayload: String,
                        createdGoalsPayload: String = "") -> QuickStartData {
        let presentation = latestAnalysis.map(AnalysisResultPresentation.init(result:))
            ?? (UITestHooks.demoData ? .canonicalDemo : .noResult)
        let latestWorkout = TrainingWorkoutStore.latest(in: completedWorkoutsPayload)
        let latestGoal = CreatedGoalStore.latest(in: createdGoalsPayload)
        let canonicalDemo = latestAnalysis == nil && latestWorkout == nil && latestGoal == nil && UITestHooks.demoData
        let target = latestGoal?.name ?? presentation.coachingTarget
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
    @AppStorage(CreatedGoalStore.key) private var createdGoalsPayload = ""
    @State private var toast: ShotIQToast?
    private var homeData: TrainingHomeData {
        TrainingHomeData.resolve(latestAnalysis: app.recentMedia.first?.analysis,
                                 completedWorkoutsPayload: completedWorkoutsPayload,
                                 savedDrillsPayload: savedDrillsPayload,
                                 createdGoalsPayload: createdGoalsPayload)
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-training-home") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        NavigationLink { QuickStartView() } label: {
                            trainingLabHeroCard
                        }
                        .buttonStyle(.plain)
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening training lab")
                        })
                        .accessibilityIdentifier("training-home-lab-hero")
                        .padding(.top, 16)

                        HStack(spacing: 10) {
                            optionCard("calendar", "Calendar", WorkoutCalendarView())
                            optionCard("target", "Goals", GoalsView())
                            optionCard("chart.line.uptrend.xyaxis", "Progress", AnalyticsCardsView())
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
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening saved drills")
                            })
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
                                    .simultaneousGesture(TapGesture().onEnded {
                                        toast = .info("Opening \(d.title)")
                                    })
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
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening shot tracker")
                        })
                        .accessibilityIdentifier("training-home-recent-workout-card")
                        .accessibilityLabel("Recent workout")
                        .padding(.top, 8)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
    }
    private var trainingLabHeroCard: some View {
        CanonicalPhoto("054-training-lab-hero",
                       height: 126,
                       cornerRadius: 10,
                       alignment: .center)
            .frame(maxWidth: .infinity)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.shotiqOrange.opacity(0.45)))
            .contentShape(RoundedRectangle(cornerRadius: 10))
            .accessibilityLabel("ShotIQ Training Lab. Build your release. Form target 93.")
    }

    private func trainingHomeAction(_ icon: String, _ label: String, primary: Bool) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 24, weight: .semibold))
            Text(label).shotiqBody(14, weight: .bold)
                .lineLimit(1).minimumScaleFactor(0.75)
        }
        .frame(maxWidth: .infinity).frame(height: 46)
        .foregroundStyle(primary ? .white : ShotIQColor.ink)
        .background(primary ? ShotIQColor.ink : ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(primary ? ShotIQColor.ink : ShotIQColor.rule))
        .contentShape(Rectangle())
    }
    private func optionCard(_ icon: String, _ title: String, _ dest: some View) -> some View {
        NavigationLink { dest } label: {
            VStack(spacing: 8) {
                ShotIQConceptGlyph(concept: title, fallback: icon, size: 40)
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
        .simultaneousGesture(TapGesture().onEnded {
            toast = .info("Opening \(title)")
        })
        .accessibilityLabel(title)
        .accessibilityIdentifier(title)
    }
}

struct QuickStartView: View {       // 055
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @AppStorage(CreatedGoalStore.key) private var createdGoalsPayload = ""
    @State private var shotTarget = 24
    @State private var makeTarget = 15
    @State private var targetsSeeded = false
    @State private var toast: ShotIQToast?
    private var quickData: QuickStartData {
        QuickStartData.resolve(latestAnalysis: app.recentMedia.first?.analysis,
                               completedWorkoutsPayload: completedWorkoutsPayload,
                               createdGoalsPayload: createdGoalsPayload)
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
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening coaching target goals")
                        })
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
                        SectionLabel(text: "CAPTURE WORKOUT VIDEO").padding(.top, 16)
                        HStack(spacing: 12) {
                            NavigationLink { LiveCameraSetupView() } label: {
                                mediaActionButton(icon: "record.circle", title: "Record video", subtitle: "Live camera")
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening camera setup", "Record a real workout video.")
                            })
                            .accessibilityIdentifier("quick-start-record-video")
                            NavigationLink { VideoUploadView() } label: {
                                mediaActionButton(icon: "square.and.arrow.up", title: "Upload video", subtitle: "Library or Files")
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening video upload", "Choose a real workout clip.")
                            })
                            .accessibilityIdentifier("quick-start-upload-video")
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
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .success("Starting \(quickData.drillName)")
                        })
                        .padding(.vertical, 22)
                        .accessibilityIdentifier("quick-start-start-tracking")
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
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
                                         size: 38,
                                         label: nil)
            }
            Text(caption).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(2).minimumScaleFactor(0.8)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 10) {
                Spacer()
                stepButton("minus", id: "\(idPrefix)-minus") {
                    value.wrappedValue = max(0, value.wrappedValue - 1)
                    toast = .success("\(unit.capitalized) target set to \(value.wrappedValue)")
                }
                stepButton("plus", id: "\(idPrefix)-plus") {
                    value.wrappedValue += 1
                    toast = .success("\(unit.capitalized) target set to \(value.wrappedValue)")
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
    }

    private func mediaActionButton(icon: String, title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                     size: 36,
                                     label: nil)
            Text(title).shotiqBody(15, weight: .bold)
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.78)
            Text(subtitle).shotiqBody(11, weight: .medium)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 106, alignment: .leading)
        .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func stepButton(_ icon: String, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.system(size: 24, weight: .medium))
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
    @AppStorage(TrainingHiddenDrillStore.key) private var hiddenDrillsPayload = "[]"
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
        toast = .success("Filter updated", "\(value): \(filteredDrills.count) drill\(filteredDrills.count == 1 ? "" : "s") visible.")
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
        hiddenDrillsPayload = TrainingHiddenDrillStore.unhide(d.0, in: hiddenDrillsPayload)
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
                            Button {
                                toast = .info("Opening drill filters", "Choose difficulty, duration, or reset filters.")
                                showFilterMenu = true
                            } label: {
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
                                Button("Beginner only") {
                                    difficultyFilter = "Beginner"
                                    toast = .success("Filter updated", "\(filteredDrills.count) beginner drill\(filteredDrills.count == 1 ? "" : "s") visible.")
                                }
                                Button("Intermediate only") {
                                    difficultyFilter = "Intermediate"
                                    toast = .success("Filter updated", "\(filteredDrills.count) intermediate drill\(filteredDrills.count == 1 ? "" : "s") visible.")
                                }
                                Button("Under 10 minutes") {
                                    durationFilter = "Under 10 min"
                                    toast = .success("Filter updated", "\(filteredDrills.count) short drill\(filteredDrills.count == 1 ? "" : "s") visible.")
                                }
                                Button("Reset all filters") {
                                    flawFilter = "All Flaws"; phaseFilter = "All Phases"
                                    difficultyFilter = "All Difficulties"; durationFilter = "Any Duration"
                                    toast = .success("Filters reset", "\(filteredDrills.count) drills visible.")
                                }
                                Button("Cancel", role: .cancel) {
                                    toast = .info("Filters unchanged")
                                }
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
                                    Button {
                                        activeChip = f
                                        toast = .info("Opening \(f.lowercased())", "Pick a drill filter value.")
                                    } label: {
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
                            Button("Cancel", role: .cancel) {
                                toast = .info("Filter unchanged")
                            }
                        }
                        HStack(spacing: 5) {
                            Image(systemName: "arrow.up.arrow.down").font(.system(size: 12))
                            Text("Sort:").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            Menu {
                                ForEach(["Recommended", "Shortest first", "Name A–Z"], id: \.self) { s in
                                    Button(s) {
                                        sortMode = s
                                        toast = .success("Sort updated", s)
                                    }
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
                                                    PhasePhotoThumbnail(phase: ShotPhase.allCases[i],
                                                                        active: i == 3,
                                                                        width: 28,
                                                                        height: 20,
                                                                        cornerRadius: 3)
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
    @AppStorage(TrainingHiddenDrillStore.key) private var hiddenDrillsPayload = "[]"
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
                        Button {
                            toast = .info("Returning to drills")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                        } label: {
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
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening share sheet", "\(detail.name) is ready to share.")
                            })
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
                                        MechanicGlyph(kind: .init(metricLabel: m.0), size: 28)
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
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .success("Starting \(detail.name)", "Opening active drill controls.")
                            })
                            .accessibilityIdentifier("drill-detail-start-drill")
                            squareNav("calendar", id: "drill-detail-calendar") { WorkoutCalendarView() }
                            squareNav("play.rectangle", id: "drill-detail-media") {
	                                if let analysis = app.recentMedia.first?.analysis {
	                                    MediaDetailView(analysis: analysis,
	                                                    analysisId: analysis.id)
	                                } else {
                                    VideoUploadView()
                                }
                            }
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
        hiddenDrillsPayload = TrainingHiddenDrillStore.unhide(detail.name, in: hiddenDrillsPayload)
        savedDrillsPayload = TrainingSavedDrillStore.save(savedDrill, in: savedDrillsPayload)
        bookmarked = true
        toast = .success("Drill saved", "\(detail.name) added to My Drills.")
        Task { await APIClient.shared.send("/api/saved-workouts",
                                           body: SavedWorkoutBody(name: detail.name)) }
    }
    private func factColumn(_ icon: String, _ label: String, _ value: String, id: String) -> some View {
        VStack(spacing: 4) {
            ShotIQConceptGlyph(concept: label, fallback: icon, size: 24)
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
            ShotIQConceptGlyph(concept: label, fallback: icon, size: 32)
                .foregroundStyle(ShotIQColor.ink)
            Text(label).shotiqBody(7.5, weight: .semibold).kerning(0.4)
                .foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
        }
        .frame(width: 62)
    }
    private func equipCard(_ icon: String, _ title: String, _ caption: String) -> some View {
        HStack(spacing: 10) {
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 36)
                .foregroundStyle(ShotIQColor.ink)
                .frame(width: 36)
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
                                     size: 54,
                                     label: nil)
                .frame(width: 54, height: 54)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        }
        .accessibilityIdentifier(id)
        .simultaneousGesture(TapGesture().onEnded {
            if id == "drill-detail-media" {
                toast = app.recentMedia.isEmpty
                    ? .info("Opening video upload", "Add a workout clip to analyze.")
                    : .success("Opening latest media", "Your saved analysis media is ready.")
            } else {
                toast = .info("Opening workout calendar")
            }
        })
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
    @AppStorage(TrainingHiddenDrillStore.key) private var hiddenDrillsPayload = "[]"
    @State private var tab = 0                  // 0 MY DRILLS · 1 TRAIN · 2 ASSIGNED
    @State private var sortMode = "Newest"
    @State private var phaseFilter = "All phases"
    @State private var toast: ShotIQToast?
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
    private var hiddenDrillNames: Set<String> {
        TrainingHiddenDrillStore.decode(hiddenDrillsPayload)
    }
    private var allDrills: [TrainingSavedDrill] {
        (savedCatalogDrills + drills.filter { canonical in
            !savedCatalogDrills.contains { $0.name.caseInsensitiveCompare(canonical.name) == .orderedSame }
        })
        .filter { !hiddenDrillNames.contains($0.name.lowercased()) }
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
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening shot analysis")
                        })
                        .padding(.top, 16)
                        HStack(spacing: 0) {
                            tabButton("MY DRILLS", "Saved for you", 0)
                            NavigationLink { TrainingHomeView() } label: {
                                tabButtonLabel("TRAIN", "Drills & workouts", selected: false)
                            }
                            .buttonStyle(.plain)
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening training")
                            })
                            tabButton("ASSIGNED", "From coach", 2)
                        }
                        .padding(.top, 18)
                        HStack {
                            SectionLabel(text: "\(visibleDrills.count) DRILLS")
                            Spacer()
                            Menu {
                                Button("Newest") {
                                    sortMode = "Newest"
                                    toast = .success("Sorted by newest")
                                }
                                Button("Best accuracy") {
                                    sortMode = "Best accuracy"
                                    toast = .success("Sorted by best accuracy")
                                }
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
                                    Button(p) {
                                        phaseFilter = p
                                        toast = .success(p == "All phases" ? "Showing all phases" : "Filtering \(p)")
                                    }
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
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening drill discovery")
                                })
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
        .shotiqToast($toast)
    }
    private func tabButton(_ title: String, _ caption: String, _ index: Int) -> some View {
        let selected = tab == index
        return Button {
            tab = index
            toast = .success("Showing \(title.capitalized)")
        } label: {
            tabButtonLabel(title, caption, selected: selected)
        }
    }
    private func tabButtonLabel(_ title: String, _ caption: String, selected: Bool) -> some View {
        VStack(spacing: 6) {
            Text(title).shotiqBody(12, weight: .bold).kerning(0.5)
                .lineLimit(1).minimumScaleFactor(0.7)
                .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
            Text(caption).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
            Rectangle().fill(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                .frame(height: selected ? 2 : 1)
        }
        .frame(maxWidth: .infinity)
    }
    private func drillCard(_ d: TrainingSavedDrill) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 12) {
                NavigationLink { DrillDetailView(name: d.name) } label: {
                    PhotoThumb(width: 84, height: 150, photo: d.photo)
                }
                .simultaneousGesture(TapGesture().onEnded {
                    toast = .info("Opening \(d.name)")
                })
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top, spacing: 8) {
                        NavigationLink { DrillDetailView(name: d.name) } label: {
                            Text(d.name.uppercased()).shotiqDisplay(18)
                                .multilineTextAlignment(.leading)
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening \(d.name)")
                        })
                        Spacer(minLength: 4)
                        NavigationLink { DrillExecutionView(drillName: d.name) } label: {
                            Text("Start drill").shotiqBody(12, weight: .semibold)
                                .padding(.horizontal, 11).padding(.vertical, 7)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .success("Starting \(d.name)")
                        })
                        Menu {
                            Button("Move to top") {
                                hiddenDrillsPayload = TrainingHiddenDrillStore.unhide(d.name, in: hiddenDrillsPayload)
                                savedDrillsPayload = TrainingSavedDrillStore.save(d, in: savedDrillsPayload)
                                toast = .success("Drill moved to top", d.name)
                            }
                            Button("Remove from My Drills", role: .destructive) {
                                removeDrill(d)
                            }
                        } label: {
                            Image(systemName: "ellipsis")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(ShotIQColor.graphite)
                                .padding(.vertical, 4)
                        }
                        .accessibilityLabel("Drill actions")
                    }
                    Text(d.description).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(2).fixedSize(horizontal: false, vertical: true)
                    HStack(spacing: 8) {
                        metaPill(d.difficulty)
                        metaPill(d.duration)
                    }
                    HStack(spacing: 12) {
                        ForEach(phases, id: \.self) { p in
                            VStack(spacing: 3) {
                                PhasePhotoThumbnail(phase: ShotPhase(label: p),
                                                    active: p == d.phase,
                                                    width: 34,
                                                    height: 24,
                                                    cornerRadius: 3)
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
    private func removeDrill(_ drill: TrainingSavedDrill) {
        savedDrillsPayload = TrainingSavedDrillStore.remove(drill.name, from: savedDrillsPayload)
        hiddenDrillsPayload = TrainingHiddenDrillStore.hide(drill.name, in: hiddenDrillsPayload)
        toast = .success("Drill removed", drill.name)
    }
}

struct WorkoutCalendarView: View {  // 059
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @State private var selectedDay = 7
    @State private var monthIndex = 4          // 0-based; 4 = May 2025 (has data)
    @State private var displayYear = 2025
    @State private var showingCreateWorkoutModal = false
    @State private var showingDayDetail = false
    @State private var toast: ShotIQToast?
    @State private var calendarDraftDrills = CalendarDraftDrill.defaults
    @State private var draggedDraftDrill: CalendarDraftDrill?
    @State private var calendarSearchQuery = ""
    @State private var calendarFilterReleaseOnly = false
    @State private var selectedSessionType = "Workout"
    @AppStorage("shotiq.calendar.savedDraftDays.v1") private var savedDraftDaysPayload = ""
    @AppStorage("shotiq.calendar.startedDraftDays.v1") private var startedDraftDaysPayload = ""
    private let monthNames = ["January", "February", "March", "April", "May", "June",
                              "July", "August", "September", "October", "November", "December"]
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
              selectedDay == day else { return nil }
        return latestWorkout
    }
    private let completed: Set<Int> = [4, 25]
    private let scheduled: Set<Int> = [1, 2, 5, 6, 9, 12, 14, 15, 18, 19, 21, 22, 23, 26, 28, 29]
    private let inProgress: Set<Int> = [7, 8, 11, 13, 16, 20, 27, 30]
    private let missed: Set<Int> = [10, 17, 24, 31]
    private let weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    private var topWorkout: TrainingWorkoutRecord? { latestWorkout }
    private var savedDraftDays: Set<Int> {
        Set(savedDraftDaysPayload.split(separator: ",").compactMap { Int($0) })
    }
    private var startedDraftDays: Set<Int> {
        Set(startedDraftDaysPayload.split(separator: ",").compactMap { Int($0) })
    }
    private var draftDurationMinutes: Int {
        max(0, calendarDraftDrills.reduce(0) { $0 + $1.minutes })
    }
    private var draftShotCount: Int {
        max(0, calendarDraftDrills.reduce(0) { $0 + $1.shots })
    }
    private var filteredCalendarRecommendations: [CalendarDraftDrill] {
        CalendarDraftDrill.recommendations.filter { drill in
            let matchesSearch = calendarSearchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || drill.title.localizedCaseInsensitiveContains(calendarSearchQuery)
            || drill.tag.localizedCaseInsensitiveContains(calendarSearchQuery)
            let matchesFilter = !calendarFilterReleaseOnly || drill.tag == "Release" || drill.tag == "Elbow"
            return matchesSearch && matchesFilter
        }
    }
    private var selectedDayTitle: String {
        if let local = selectedLocalWorkout {
            let c = Calendar.current.dateComponents([.month, .day, .weekday], from: local.completedAt)
            let weekday = weekdayNames[max(0, min((c.weekday ?? 1) - 1, weekdayNames.count - 1))]
            let month = monthNames[max(0, min((c.month ?? 1) - 1, monthNames.count - 1))]
            return "\(weekday), \(month) \(c.day ?? selectedDay)"
        }
        let weekday = weekdayNames[(4 + selectedDay - 1) % 7]
        return "\(weekday), May \(selectedDay)"
    }
    private var selectedStatusText: String {
        selectedLocalWorkout == nil ? "In Progress" : "Completed"
    }
    private var selectedWorkoutName: String {
        selectedLocalWorkout?.drillName ?? "Combo Ladder"
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-workout-calendar") {
            ScrollView {
                calendarOverviewPage
            }
        }
        .shotiqToast($toast)
        .sheet(isPresented: $showingCreateWorkoutModal) {
            createWorkoutModal
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
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
        selectedDay = day
    }

    private var calendarOverviewPage: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text("WORKOUT CALENDAR").shotiqDisplay(43).foregroundStyle(ShotIQColor.ink)
                Text("Stay consistent. See progress.")
                    .shotiqBody(17, weight: .medium)
                    .foregroundStyle(ShotIQColor.graphite)
            }
            .padding(.top, 22)
            calendarSummaryCard
            calendarMonthCard
            legendCard
            Spacer(minLength: 30)
        }
        .padding(.horizontal, 18)
    }

    private var calendarDetailPage: some View {
        VStack(alignment: .leading, spacing: 12) {
            detailHeader
            targetSummaryCard
            workoutProgressCard
            drillPlanCard
            shotLogCard
            notesCard
            bottomActions
            Spacer(minLength: 28)
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
    }

    private var detailHeader: some View {
        HStack(alignment: .center) {
            Button {
                withAnimation(.spring(response: 0.22, dampingFraction: 0.9)) {
                    showingDayDetail = false
                }
            } label: {
                Text("Calendar")
                    .shotiqBody(16, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
            }
            .buttonStyle(.plain)
            Spacer()
            Text("\(monthNames[monthIndex]) \(selectedDay), \(displayYear)")
                .shotiqDisplay(30)
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Spacer()
            Text(dayStatus(selectedDay).label)
                .shotiqBody(12, weight: .semibold)
                .foregroundStyle(dayStatus(selectedDay).accent)
                .padding(.horizontal, 12)
                .frame(height: 34)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(dayStatus(selectedDay).accent.opacity(0.55), lineWidth: 1))
                .background(dayStatus(selectedDay).tint, in: RoundedRectangle(cornerRadius: 8))
        }
    }

    private var calendarSummaryCard: some View {
        ShotIQCard {
            GeometryReader { geo in
                let compact = geo.size.width < 520
                if compact {
                    VStack(spacing: 12) {
                        HStack(spacing: 12) {
                            CanonicalPhoto("059-visual-001",
                                           width: max(142, geo.size.width * 0.40),
                                           height: 176,
                                           cornerRadius: 12,
                                           alignment: .topTrailing)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(ShotIQColor.shotiqOrange, lineWidth: 2))
                            HStack(alignment: .top, spacing: 9) {
                                Rectangle()
                                    .fill(ShotIQColor.shotiqOrange)
                                    .frame(width: 3, height: 136)
                                    .padding(.top, 8)
                                VStack(alignment: .leading, spacing: 10) {
                                    VStack(alignment: .leading, spacing: -10) {
                                        HStack(alignment: .lastTextBaseline, spacing: 5) {
                                            Text("62.5")
                                                .font(.custom("Tungsten-Medium", size: 116))
                                                .foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(1)
                                                .minimumScaleFactor(0.48)
                                            Text("%")
                                                .font(.custom("Tungsten-Medium", size: 62))
                                                .foregroundStyle(ShotIQColor.ink)
                                                .baselineOffset(9)
                                        }
                                        Text("FG%")
                                            .shotiqDisplay(24)
                                            .foregroundStyle(ShotIQColor.ink)
                                            .padding(.leading, 2)
                                    }
                                    HStack(spacing: 8) {
                                        calendarMiniStat(icon: "basketball", value: "15", label: "Makes", compact: true)
                                        calendarMiniStat(icon: "xmark.circle", value: "9", label: "Misses", compact: true)
                                    }
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        calendarTrendCard(compact: true)
                    }
                    .padding(12)
                } else {
                    HStack(spacing: 22) {
                        CanonicalPhoto("059-visual-001",
                                       width: geo.size.width * 0.37,
                                       height: 410,
                                       cornerRadius: 12,
                                       alignment: .top)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(ShotIQColor.shotiqOrange, lineWidth: 2))
                        HStack(alignment: .top, spacing: 18) {
                            Rectangle()
                                .fill(ShotIQColor.shotiqOrange)
                                .frame(width: 3, height: 154)
                                .padding(.top, 8)
                            VStack(alignment: .leading, spacing: 14) {
                                VStack(alignment: .leading, spacing: -8) {
                                    HStack(alignment: .lastTextBaseline, spacing: 8) {
                                        Text("62.5")
                                            .font(.custom("Tungsten-Medium", size: 170))
                                            .foregroundStyle(ShotIQColor.ink)
                                            .lineLimit(1)
                                            .minimumScaleFactor(0.48)
                                        Text("%")
                                            .font(.custom("Tungsten-Medium", size: 88))
                                            .foregroundStyle(ShotIQColor.ink)
                                            .baselineOffset(15)
                                    }
                                    Text("FG%")
                                        .shotiqDisplay(33)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .padding(.leading, 2)
                                }
                                HStack(spacing: 10) {
                                    calendarMiniStat(icon: "basketball", value: "15", label: "Makes", compact: false)
                                    calendarMiniStat(icon: "xmark.circle", value: "9", label: "Misses", compact: false)
                                }
                                calendarTrendCard(compact: false)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(12)
                }
            }
            .frame(height: UIScreen.main.bounds.width < 600 ? 420 : 436)
        }
    }

    private var targetSummaryCard: some View {
        ShotIQCard {
            HStack(spacing: 16) {
                CanonicalPhoto("059-visual-001", width: 126, height: 126, cornerRadius: 63, alignment: .center)
                VStack(alignment: .leading, spacing: 10) {
                    Text("PRIMARY TARGET")
                        .shotiqMicroCaps(13, weight: .semibold)
                        .foregroundStyle(ShotIQColor.graphite)
                    Text("Keep elbow stacked\nthrough release")
                        .shotiqBody(20, weight: .semibold)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(2)
                        .minimumScaleFactor(0.82)
                    HStack(spacing: 0) {
                        targetStat("\(topWorkout?.shots ?? 24)", "Shots")
                        VRule(height: 42)
                        targetStat("\(topWorkout?.makes ?? 15)", "Makes")
                        VRule(height: 42)
                        targetStat(topWorkout?.accuracyText ?? "62.5%", "FG%")
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(14)
        }
    }

    private var calendarMonthCard: some View {
        ShotIQCard {
            VStack(spacing: 0) {
                HStack {
                    Button {
                        if monthIndex > 0 { monthIndex -= 1 }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                            Text("PREV")
                        }
                    }
                    .shotiqBody(12, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
                    .disabled(monthIndex == 0)
                    Spacer()
                    Text("\(monthNames[monthIndex].uppercased()) \(displayYear)")
                        .shotiqDisplay(28)
                        .foregroundStyle(ShotIQColor.ink)
                    Spacer()
                    Button {
                        if monthIndex < 11 { monthIndex += 1 }
                    } label: {
                        HStack(spacing: 4) {
                            Text("NEXT")
                            Image(systemName: "chevron.right")
                        }
                    }
                    .shotiqBody(12, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
                    .disabled(monthIndex == 11)
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 16)
                let cols = Array(repeating: GridItem(.flexible(), spacing: 0), count: 7)
                LazyVGrid(columns: cols, spacing: 0) {
                    ForEach(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], id: \.self) { d in
                        Text(d)
                            .shotiqBody(10, weight: .semibold)
                            .foregroundStyle(ShotIQColor.graphite)
                            .frame(maxWidth: .infinity, minHeight: 30)
                    }
                    if isDataMonth {
                        ForEach(227...230, id: \.self) { d in adjacentCell(d - 200) }
                    }
                    ForEach(1...daysInMonth[monthIndex], id: \.self) { d in dayCell(d) }
                    if isDataMonth {
                        ForEach(101...107, id: \.self) { d in adjacentCell(d - 100) }
                    }
                }
            }
            .padding(.bottom, 12)
        }
    }

    private var legendCard: some View {
        ShotIQCard {
            HStack(spacing: 10) {
                legendItem("Completed", status: .completed)
                legendItem("Scheduled", status: .scheduled)
                legendItem("In Progress", status: .inProgress)
                legendItem("Missed", status: .missed)
                legendItem("No workout", status: .none)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
        }
    }

    private var workoutProgressCard: some View {
        ShotIQCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .lastTextBaseline) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("20 min workout").shotiqBody(18, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                        Text("12 min elapsed").shotiqBody(13, weight: .medium).foregroundStyle(ShotIQColor.graphite)
                    }
                    Spacer()
                    HStack(alignment: .lastTextBaseline, spacing: 4) {
                        Text("60").font(.custom("Tungsten-Medium", size: 28)).foregroundStyle(ShotIQColor.shotiqOrange)
                        Text("%").shotiqBody(13, weight: .bold).foregroundStyle(ShotIQColor.shotiqOrange)
                        Text("complete").shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.graphite)
                    }
                }
                progressBar(0.60)
            }
            .padding(14)
        }
    }

    private var drillPlanCard: some View {
        ShotIQCard {
            VStack(spacing: 0) {
                HStack {
                    Text("Drill Plan").shotiqBody(18, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                    Spacer()
                    Text("4 drills").shotiqBody(12, weight: .medium).foregroundStyle(ShotIQColor.graphite)
                }
                .padding(.bottom, 8)
                drillPlanRow(photo: "059-visual-001", title: "Form Shooting", detail: "3 sets • 10 shots", status: "Completed", color: ShotIQColor.confirmGreen)
                drillPlanRow(photo: "070-visual-003", title: "Elbow Stack Reps", detail: "3 sets • 10 shots", status: "In Progress", color: ShotIQColor.shotiqOrange)
                drillPlanRow(photo: "059-visual-001", title: "Free Throws", detail: "2 sets • 10 shots", status: "Not Started", color: ShotIQColor.muted)
                drillPlanRow(photo: "054-visual-003", title: "Corner Makes", detail: "2 sets • 10 shots", status: "Not Started", color: ShotIQColor.muted, divider: false)
            }
            .padding(14)
        }
    }

    private var shotLogCard: some View {
        ShotIQCard {
            VStack(spacing: 0) {
                HStack {
                    Text("Shot Log").shotiqBody(18, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                    Spacer()
                    Text("View All").shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                }
                .padding(.bottom, 8)
                shotLogRow(result: "Make", time: "11:47 AM", location: "Right Elbow", made: true)
                shotLogRow(result: "Make", time: "11:46 AM", location: "Right Elbow", made: true)
                shotLogRow(result: "Miss", time: "11:45 AM", location: "Top of Key", made: false)
                shotLogRow(result: "Make", time: "11:44 AM", location: "Right Elbow", made: true)
                shotLogRow(result: "Miss", time: "11:43 AM", location: "Left Elbow", made: false, divider: false)
            }
            .padding(14)
        }
    }

    private var notesCard: some View {
        ShotIQCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("Notes").shotiqBody(18, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                    Spacer()
                    Text("Edit").shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                }
                Text("Coach note: release elbow drifted late on misses.")
                    .shotiqBody(13, weight: .medium)
                    .foregroundStyle(ShotIQColor.graphite)
            }
            .padding(14)
        }
    }

    private var bottomActions: some View {
        HStack(spacing: 12) {
            calendarActionButton("Resume Workout", stroke: ShotIQColor.shotiqOrange, foreground: ShotIQColor.shotiqOrange)
            calendarActionButton("Mark Complete", stroke: ShotIQColor.analysisBlue, foreground: ShotIQColor.analysisBlue)
            calendarActionButton("Edit Plan", stroke: ShotIQColor.graphite.opacity(0.55), foreground: ShotIQColor.ink)
        }
    }

    private func targetStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.custom("Tungsten-Medium", size: 30))
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .shotiqBody(12, weight: .medium)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }

    private func adjacentCell(_ d: Int) -> some View {
        Button {
            selectedDay = d
            withAnimation(.spring(response: 0.22, dampingFraction: 0.9)) {
                showingCreateWorkoutModal = true
            }
        } label: {
            VStack(spacing: 5) {
                Text("\(d)")
                    .shotiqBody(14, weight: .semibold)
                    .foregroundStyle(ShotIQColor.muted)
                    .frame(width: 32, height: 32)
                statusMark(.none, selected: false)
            }
            .frame(maxWidth: .infinity, minHeight: 78, alignment: .top)
            .padding(.top, 8)
            .overlay(Rectangle().stroke(ShotIQColor.rule.opacity(0.55), lineWidth: 0.7))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func dayCell(_ d: Int) -> some View {
        let status = dayStatus(d)
        let selected = d == selectedDay && status == .inProgress
        Button {
            selectedDay = d
            withAnimation(.spring(response: 0.22, dampingFraction: 0.9)) {
                showingCreateWorkoutModal = true
            }
        } label: {
            VStack(spacing: 5) {
                Text("\(d)")
                    .shotiqBody(14, weight: .semibold)
                    .foregroundStyle(selected ? .white : (status == .none ? ShotIQColor.muted : ShotIQColor.ink))
                    .frame(width: 32, height: 32)
                statusMark(status, selected: selected)
                if let line = statusLine(d) {
                    Text(line)
                        .shotiqBody(9, weight: .medium)
                        .foregroundStyle(selected ? .white : (status == .missed ? Color(red: 0.93, green: 0.31, blue: 0.27) : ShotIQColor.graphite))
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 78, alignment: .top)
            .padding(.top, 8)
            .background(selected ? ShotIQColor.shotiqOrange : status.tint)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: selected ? 10 : 0)
                    .stroke(ShotIQColor.rule.opacity(selected ? 0 : 0.55), lineWidth: 0.7)
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(monthNames[monthIndex]) \(d), \(status.label)")
    }

    private func legendItem(_ label: String, status: CalendarDayStatus) -> some View {
        HStack(spacing: 4) {
            statusMark(status, selected: false)
                .frame(width: 14, height: 14)
            Text(label).shotiqBody(9).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
    }

    private func statusMark(_ status: CalendarDayStatus, selected: Bool) -> some View {
        ZStack(alignment: .bottomTrailing) {
            Image(systemName: status.icon)
                .font(.system(size: status == .none ? 15 : 20, weight: .semibold))
                .foregroundStyle(selected ? .white : status.accent)
            if status == .inProgress {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(selected ? .white : ShotIQColor.shotiqOrange)
                    .offset(x: 0, y: -1)
            } else if status == .missed {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(selected ? .white : ShotIQColor.shotiqOrange)
                    .offset(x: 6, y: 4)
            } else if status == .none {
                Image(systemName: "moon.fill")
                    .font(.system(size: 7, weight: .bold))
                    .foregroundStyle(selected ? .white : ShotIQColor.muted)
                    .offset(x: 6, y: -5)
            }
        }
        .frame(width: 24, height: 24)
    }

    private func statusLine(_ day: Int) -> String? {
        let status = dayStatus(day)
        switch status {
        case .completed:
            return nil
        case .scheduled:
            return nil
        case .inProgress:
            return day == selectedDay ? "In Progress" : nil
        case .missed:
            return nil
        case .none:
            return nil
        }
    }

    private func dayStatus(_ day: Int) -> CalendarDayStatus {
        if isLocalWorkoutMonth && day == latestComponents?.day { return .completed }
        guard isDataMonth else { return .scheduled }
        if startedDraftDays.contains(day) { return .inProgress }
        if savedDraftDays.contains(day) { return .scheduled }
        if inProgress.contains(day) { return .inProgress }
        if completed.contains(day) { return .completed }
        if scheduled.contains(day) { return .scheduled }
        if missed.contains(day) { return .missed }
        return .none
    }

    private func calendarMiniStat(icon: String, value: String, label: String, compact: Bool) -> some View {
        HStack(spacing: compact ? 6 : 8) {
            Image(systemName: icon)
                .font(.system(size: compact ? 24 : 28, weight: .semibold))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .frame(width: compact ? 26 : 30)
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.custom("Tungsten-Medium", size: compact ? 38 : 42))
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                Text(label)
                    .shotiqBody(13, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
            }
        }
        .frame(maxWidth: .infinity, minHeight: compact ? 68 : 70, alignment: .center)
        .padding(.horizontal, compact ? 6 : 7)
        .background(.white, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func calendarTrendCard(compact: Bool) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("FG% (7-DAY)")
                    .shotiqDisplay(compact ? 19 : 25)
                    .foregroundStyle(ShotIQColor.ink)
                Spacer()
                Text("62.5%")
                    .shotiqBody(compact ? 16 : 18, weight: .bold)
                    .foregroundStyle(ShotIQColor.shotiqOrange)
            }
            HStack(alignment: .bottom, spacing: 7) {
                VStack(alignment: .trailing) {
                    Text("100%")
                    Spacer()
                    Text("50%")
                    Spacer()
                    Text("0%")
                }
                .shotiqBody(compact ? 9 : 12, weight: .medium)
                .foregroundStyle(ShotIQColor.ink)
                .frame(width: compact ? 34 : 42, height: compact ? 130 : 156)
                VStack(spacing: 6) {
                    CalendarTrendPlot()
                        .frame(height: compact ? 130 : 156)
                    HStack {
                        ForEach(Array(["S", "M", "T", "W", "T", "F", "S"].enumerated()), id: \.offset) { _, label in
                            Text(label)
                                .shotiqBody(compact ? 9 : 12, weight: .medium)
                                .foregroundStyle(ShotIQColor.ink)
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
            }
        }
        .padding(compact ? 14 : 16)
        .background(.white, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func progressBar(_ pct: Double) -> some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(ShotIQColor.rule)
                Capsule()
                    .fill(ShotIQColor.shotiqOrange)
                    .frame(width: geo.size.width * max(0, min(pct, 1)))
            }
        }
        .frame(height: 6)
    }

    private func drillPlanRow(photo: String, title: String, detail: String, status: String, color: Color, divider: Bool = true) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 14) {
                CanonicalPhoto(photo, width: 56, height: 56, cornerRadius: 28, alignment: .center)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                    Text(detail).shotiqBody(12, weight: .medium).foregroundStyle(ShotIQColor.graphite)
                }
                Spacer()
                Text(status).shotiqBody(11, weight: .medium).foregroundStyle(color)
                Circle().fill(color).frame(width: 8, height: 8)
            }
            .padding(.vertical, 9)
            if divider { Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.leading, 70) }
        }
    }

    private func shotLogRow(result: String, time: String, location: String, made: Bool, divider: Bool = true) -> some View {
        VStack(spacing: 0) {
            HStack {
                Text(result)
                    .shotiqBody(12, weight: .semibold)
                    .foregroundStyle(made ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                    .frame(width: 54, alignment: .leading)
                Circle()
                    .fill(made ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                    .frame(width: 8, height: 8)
                Text(time).shotiqBody(12, weight: .medium).foregroundStyle(ShotIQColor.graphite)
                    .frame(maxWidth: .infinity)
                Text(location).shotiqBody(12, weight: .medium).foregroundStyle(ShotIQColor.graphite)
                    .frame(width: 86, alignment: .trailing)
            }
            .padding(.vertical, 7)
            if divider { Rectangle().fill(ShotIQColor.rule).frame(height: 1) }
        }
    }

    private var createWorkoutModal: some View {
        VStack(spacing: 0) {
            createWorkoutModalHeader
            ScrollView {
                VStack(spacing: 12) {
                    createWorkoutHero
                    sessionSetupCard
                    attachedDrillsCard
                    addDrillsCard
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 12)
            }
            createWorkoutActionBar
        }
        .background(Color.white)
        .accessibilityIdentifier("calendar-create-workout-modal")
    }

    private var createWorkoutModalHeader: some View {
        HStack {
            Button {
                withAnimation(.spring(response: 0.22, dampingFraction: 0.9)) {
                    showingCreateWorkoutModal = false
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 22, weight: .bold))
                    Text("Cal")
                        .shotiqBody(15, weight: .bold)
                        .lineLimit(1)
                }
                .foregroundStyle(ShotIQColor.ink)
            }
            .buttonStyle(.plain)
            .frame(width: 70, alignment: .leading)
            Spacer()
            Text("\(monthNames[monthIndex].prefix(3)) \(selectedDay), \(displayYear)")
                .shotiqDisplay(30)
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Spacer()
            HStack(spacing: 6) {
                Text("Draft")
                    .shotiqBody(13, weight: .semibold)
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .lineLimit(1)
                    .frame(width: 66, height: 38)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.shotiqOrange, lineWidth: 1))
                Button {
                    withAnimation(.spring(response: 0.22, dampingFraction: 0.9)) {
                        showingCreateWorkoutModal = false
                    }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(ShotIQColor.ink)
                        .frame(width: 38, height: 38)
                        .background(ShotIQColor.rule.opacity(0.55), in: Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Close workout popup")
            }
            .frame(width: 110, alignment: .trailing)
        }
        .padding(.horizontal, 14)
        .frame(height: 62)
        .background(Color.white)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
    }

    private var createWorkoutHero: some View {
        ShotIQCard {
            GeometryReader { geo in
                let compact = geo.size.width < 500
                if compact {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 12) {
                            CanonicalPhoto("059-visual-001",
                                           width: 142,
                                           height: 142,
                                           cornerRadius: 10,
                                           alignment: .top)
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.shotiqOrange, lineWidth: 2))
                            Text("CREATE\nWORKOUT")
                                .shotiqDisplay(42)
                                .foregroundStyle(ShotIQColor.ink)
                                .lineLimit(2)
                                .minimumScaleFactor(0.72)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        segmentedTabs(compact: true)
                        HStack(spacing: 0) {
                            modalStat(icon: "clock", value: "\(draftDurationMinutes)", label: "Min", compact: true)
                            VRule(height: 42)
                            modalStat(icon: "list.clipboard", value: "\(calendarDraftDrills.count)", label: "Drills", compact: true)
                            VRule(height: 42)
                            modalStat(icon: "scope", value: "\(draftShotCount)", label: "Shots", compact: true)
                        }
                        .frame(height: 64)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule, lineWidth: 1))
                    }
                    .padding(14)
                } else {
                    HStack(spacing: 18) {
                        CanonicalPhoto("059-visual-001",
                                       width: geo.size.width * 0.34,
                                       height: 304,
                                       cornerRadius: 10,
                                       alignment: .top)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.shotiqOrange, lineWidth: 2))
                        VStack(alignment: .leading, spacing: 14) {
                            Text("CREATE WORKOUT")
                                .shotiqDisplay(64)
                                .foregroundStyle(ShotIQColor.ink)
                                .lineLimit(1)
                                .minimumScaleFactor(0.55)
                            segmentedTabs(compact: false)
                            HStack(spacing: 0) {
                                modalStat(icon: "clock", value: "\(draftDurationMinutes)", label: "MIN", compact: false)
                                VRule(height: 42)
                                modalStat(icon: "list.clipboard", value: "\(calendarDraftDrills.count)", label: "DRILLS", compact: false)
                                VRule(height: 42)
                                modalStat(icon: "scope", value: "\(draftShotCount)", label: "SHOTS", compact: false)
                            }
                            .frame(height: 74)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule, lineWidth: 1))
                        }
                    }
                    .padding(14)
                }
            }
            .frame(height: UIScreen.main.bounds.width < 600 ? 286 : 332)
        }
    }

    private func segmentedTabs(compact: Bool) -> some View {
        HStack(spacing: 0) {
            ForEach(["Workout", "Training", "Analysis"], id: \.self) { label in
                Button {
                    selectedSessionType = label
                } label: {
                    Text(compact ? compactSessionLabel(label) : label)
                        .shotiqBody(compact ? 12 : 13, weight: selectedSessionType == label ? .bold : .medium)
                        .foregroundStyle(selectedSessionType == label ? .white : ShotIQColor.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.78)
                        .frame(maxWidth: .infinity)
                        .frame(height: compact ? 38 : 42)
                        .background(selectedSessionType == label ? ShotIQColor.shotiqOrange : Color.white)
                        .overlay(Rectangle().stroke(ShotIQColor.rule, lineWidth: 0.7))
                }
                .buttonStyle(.plain)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func compactSessionLabel(_ label: String) -> String {
        switch label {
        case "Workout": return "Work"
        case "Training": return "Train"
        case "Analysis": return "AI"
        default: return label
        }
    }

    private func modalStat(icon: String, value: String, label: String, compact: Bool) -> some View {
        VStack(spacing: compact ? 1 : 2) {
            Image(systemName: icon)
                .font(.system(size: compact ? 17 : 18, weight: .semibold))
                .foregroundStyle(ShotIQColor.shotiqOrange)
            Text(value)
                .font(.custom("Tungsten-Medium", size: compact ? 30 : 34))
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .shotiqBody(compact ? 8 : 10, weight: .bold)
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .frame(maxWidth: .infinity)
    }

    private var sessionSetupCard: some View {
        ShotIQCard {
            VStack(spacing: 0) {
                cardHeader("SESSION SETUP", trailing: "May \(selectedDay)")
                setupRow("Name", value: "Elbow Stack")
                setupRow("Focus", custom: AnyView(
                    HStack(spacing: 8) {
                        focusChip("Elbow")
                        focusChip("Release")
                        Image(systemName: "plus")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(ShotIQColor.ink)
                            .frame(width: 32, height: 32)
                            .overlay(Circle().stroke(ShotIQColor.graphite.opacity(0.45)))
                    }
                ))
                setupRow("Mode", value: "Step-by-step", chevron: true)
                setupRow("Track", value: "Camera + backup", chevron: true, divider: false)
            }
            .padding(12)
        }
    }

    private var attachedDrillsCard: some View {
        ShotIQCard {
            VStack(spacing: 0) {
                HStack {
                    Text("ATTACHED DRILLS")
                        .shotiqDisplay(25)
                        .foregroundStyle(ShotIQColor.ink)
                    Spacer()
                    Text("\(calendarDraftDrills.count) selected")
                        .shotiqBody(12, weight: .medium)
                        .foregroundStyle(ShotIQColor.graphite)
                    Button {
                        addNextRecommendedDrill()
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(ShotIQColor.ink)
                            .frame(width: 28, height: 28)
                            .overlay(Circle().stroke(ShotIQColor.graphite.opacity(0.45)))
                    }
                    .buttonStyle(.plain)
                }
                .padding(.bottom, 8)
                ForEach(Array(calendarDraftDrills.enumerated()), id: \.element.id) { index, drill in
                    attachedDrillRow(index: index + 1,
                                     drill: drill,
                                     divider: index < calendarDraftDrills.count - 1)
                        .onDrag {
                            draggedDraftDrill = drill
                            return NSItemProvider(object: drill.id as NSString)
                        }
                        .onDrop(of: [UTType.text], delegate: CalendarDraftDrillDropDelegate(item: drill,
                                                                                             drills: $calendarDraftDrills,
                                                                                             draggedItem: $draggedDraftDrill))
                }
            }
            .padding(12)
        }
    }

    private var addDrillsCard: some View {
        ShotIQCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("ADD DRILLS")
                    .shotiqDisplay(25)
                    .foregroundStyle(ShotIQColor.ink)
                VStack(spacing: 10) {
                    drillSearchField
                    HStack(spacing: 10) {
                        drillFilterButton
                        drillAddButton
                    }
                }
                VStack(spacing: 10) {
                    ForEach(filteredCalendarRecommendations.prefix(3)) { drill in
                        addDrillRecommendation(drill: drill)
                    }
                }
            }
            .padding(12)
        }
    }

    private var drillSearchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(ShotIQColor.ink)
            TextField("Search drills...", text: $calendarSearchQuery)
                .shotiqBody(14, weight: .medium)
                .foregroundStyle(ShotIQColor.graphite)
                .textInputAutocapitalization(.never)
            Spacer()
        }
        .padding(.horizontal, 12)
        .frame(height: 46)
        .frame(maxWidth: .infinity)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private var drillFilterButton: some View {
        Button {
            calendarFilterReleaseOnly.toggle()
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "line.3.horizontal.decrease")
                Text("Filter")
                Image(systemName: "chevron.down")
            }
            .shotiqBody(13, weight: .semibold)
            .foregroundStyle(calendarFilterReleaseOnly ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
            .frame(maxWidth: .infinity)
            .frame(height: 46)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(calendarFilterReleaseOnly ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
        }
        .buttonStyle(.plain)
        .frame(width: 112)
    }

    private var drillAddButton: some View {
        Button {
            addNextRecommendedDrill()
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "plus")
                Text("Add Drill")
            }
            .shotiqBody(13, weight: .semibold)
            .foregroundStyle(ShotIQColor.shotiqOrange)
            .frame(maxWidth: .infinity)
            .frame(height: 46)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange))
        }
        .buttonStyle(.plain)
        .frame(width: 116)
    }

    private var createWorkoutActionBar: some View {
        HStack(spacing: 10) {
            workoutActionButton("Save", filled: true) {
                saveCalendarWorkoutDraft()
            }
            workoutActionButton("Start") {
                startCalendarWorkoutDraft()
            }
            workoutActionButton("Auto") {
                autoGenerateCalendarWorkout()
            }
        }
        .padding(14)
        .background(Color.white)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
    }

    private func workoutActionButton(_ title: String, filled: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .shotiqBody(15, weight: .bold)
                .foregroundStyle(filled ? .white : ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.78)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(filled ? ShotIQColor.shotiqOrange : Color.clear, in: RoundedRectangle(cornerRadius: 8))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(filled ? Color.clear : (title == "Start" ? ShotIQColor.ink : ShotIQColor.graphite.opacity(0.55)), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    private func cardHeader(_ title: String, trailing: String? = nil) -> some View {
        HStack {
            Text(title)
                .shotiqDisplay(25)
                .foregroundStyle(ShotIQColor.ink)
            Spacer()
            if let trailing {
                Text(trailing)
                    .shotiqBody(13, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
            }
        }
        .padding(.bottom, 8)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
    }

    private func setupRow(_ label: String, value: String, chevron: Bool = false, divider: Bool = true) -> some View {
        setupRow(label, custom: AnyView(
            HStack(spacing: 8) {
                Text(value)
                    .shotiqBody(13, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                if chevron {
                    Image(systemName: "chevron.down")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(ShotIQColor.ink)
                }
            }
        ), divider: divider)
    }

    private func setupRow(_ label: String, custom: AnyView, divider: Bool = true) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Text(label)
                    .shotiqBody(13, weight: .medium)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .frame(width: 76, alignment: .leading)
                Spacer()
                custom
            }
            .frame(minHeight: 48)
            if divider { Rectangle().fill(ShotIQColor.rule).frame(height: 1) }
        }
    }

    private func focusChip(_ title: String) -> some View {
        HStack(spacing: 6) {
            Text(title)
            Image(systemName: "xmark")
                .font(.system(size: 9, weight: .bold))
        }
        .shotiqBody(11, weight: .medium)
        .foregroundStyle(ShotIQColor.shotiqOrange)
        .padding(.horizontal, 10)
        .frame(height: 32)
        .background(ShotIQColor.shotiqOrange.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange.opacity(0.18)))
    }

    private func attachedDrillRow(index: Int, drill: CalendarDraftDrill, divider: Bool = true) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Image(systemName: "line.3.horizontal")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(width: 14)
                Text("\(index)")
                    .shotiqBody(14, weight: .bold)
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(width: 30, height: 30)
                    .overlay(Circle().stroke(ShotIQColor.rule))
                CanonicalPhoto(drill.photo, width: 46, height: 46, cornerRadius: 23, alignment: .center)
                VStack(alignment: .leading, spacing: 4) {
                    Text(drill.title).shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(drill.detail).shotiqBody(12, weight: .medium).foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                }
                Spacer()
                Text(drill.tag)
                    .shotiqBody(11, weight: .medium)
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .lineLimit(1)
                    .minimumScaleFactor(0.65)
                    .frame(width: 88, height: 34)
                    .background(ShotIQColor.shotiqOrange.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange.opacity(0.18)))
                Button {
                    removeDraftDrill(drill)
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(ShotIQColor.ink)
                        .frame(width: 30, height: 34)
                }
                .buttonStyle(.plain)
            }
            .padding(.vertical, 9)
            if divider { Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.leading, 104) }
        }
    }

    private func addDrillRecommendation(drill: CalendarDraftDrill) -> some View {
        let added = calendarDraftDrills.contains { $0.id == drill.id }
        return HStack(spacing: 9) {
            CanonicalPhoto(drill.photo, width: 48, height: 48, cornerRadius: 24, alignment: .center)
            VStack(alignment: .leading, spacing: 3) {
                Text(drill.title)
                    .shotiqBody(12, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Text("\(drill.minutes)m")
                    .shotiqBody(11, weight: .medium)
                    .foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Button {
                addDraftDrill(drill)
            } label: {
                Image(systemName: added ? "checkmark" : "plus")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(added ? ShotIQColor.confirmGreen : ShotIQColor.ink)
                    .frame(width: 30, height: 30)
                    .overlay(Circle().stroke((added ? ShotIQColor.confirmGreen : ShotIQColor.graphite).opacity(0.45)))
            }
            .buttonStyle(.plain)
            .disabled(added)
        }
        .padding(8)
        .frame(maxWidth: .infinity)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
    }

    private func addDraftDrill(_ drill: CalendarDraftDrill) {
        guard !calendarDraftDrills.contains(where: { $0.id == drill.id }) else {
            toast = .info("Already attached", drill.title)
            return
        }
        calendarDraftDrills.append(drill)
        toast = .success("Drill added", drill.title)
    }

    private func addNextRecommendedDrill() {
        guard let next = filteredCalendarRecommendations.first(where: { candidate in
            !calendarDraftDrills.contains(where: { $0.id == candidate.id })
        }) else {
            toast = .info("No more matching drills")
            return
        }
        addDraftDrill(next)
    }

    private func removeDraftDrill(_ drill: CalendarDraftDrill) {
        guard calendarDraftDrills.count > 1 else {
            toast = .info("Keep at least one drill")
            return
        }
        calendarDraftDrills.removeAll { $0.id == drill.id }
        toast = .success("Drill removed", drill.title)
    }

    private func saveCalendarWorkoutDraft() {
        var days = savedDraftDays
        days.insert(selectedDay)
        savedDraftDaysPayload = days.sorted().map(String.init).joined(separator: ",")
        var started = startedDraftDays
        started.remove(selectedDay)
        startedDraftDaysPayload = started.sorted().map(String.init).joined(separator: ",")
        toast = .success("Workout saved", "\(calendarDraftDrills.count) drills • \(draftShotCount) shots")
        withAnimation(.spring(response: 0.22, dampingFraction: 0.9)) {
            showingCreateWorkoutModal = false
        }
    }

    private func startCalendarWorkoutDraft() {
        var started = startedDraftDays
        started.insert(selectedDay)
        startedDraftDaysPayload = started.sorted().map(String.init).joined(separator: ",")
        var saved = savedDraftDays
        saved.remove(selectedDay)
        savedDraftDaysPayload = saved.sorted().map(String.init).joined(separator: ",")
        toast = .success("Workout started", "\(calendarDraftDrills.count) drills ready")
        withAnimation(.spring(response: 0.22, dampingFraction: 0.9)) {
            showingCreateWorkoutModal = false
        }
    }

    private func autoGenerateCalendarWorkout() {
        calendarDraftDrills = Array(CalendarDraftDrill.defaults.prefix(2)) + Array(CalendarDraftDrill.recommendations.prefix(2))
        calendarSearchQuery = ""
        calendarFilterReleaseOnly = false
        toast = .success("Workout generated", "\(calendarDraftDrills.count) drills • \(draftShotCount) shots")
    }

    private func calendarActionButton(_ title: String, stroke: Color, foreground: Color) -> some View {
        Button {
            toast = .info(title)
        } label: {
            Text(title)
                .shotiqBody(13, weight: .semibold)
                .foregroundStyle(foreground)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(stroke, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private enum CalendarDayStatus: Equatable {
        case completed
        case scheduled
        case inProgress
        case missed
        case none

        var label: String {
            switch self {
            case .completed: return "Completed"
            case .scheduled: return "Scheduled"
            case .inProgress: return "In Progress"
            case .missed: return "Missed"
            case .none: return "No Workout"
            }
        }

        var icon: String {
            switch self {
            case .completed: return "flame.fill"
            case .scheduled: return "calendar"
            case .inProgress: return "timer"
            case .missed: return "calendar"
            case .none: return "bed.double"
            }
        }

        var accent: Color {
            switch self {
            case .completed: return ShotIQColor.shotiqOrange
            case .scheduled: return ShotIQColor.ink
            case .inProgress: return ShotIQColor.shotiqOrange
            case .missed: return ShotIQColor.ink
            case .none: return ShotIQColor.muted
            }
        }

        var tint: Color {
            switch self {
            case .completed: return ShotIQColor.shotiqOrange.opacity(0.06)
            case .scheduled: return Color.clear
            case .inProgress: return ShotIQColor.shotiqOrange.opacity(0.06)
            case .missed: return Color(red: 0.93, green: 0.31, blue: 0.27).opacity(0.06)
            case .none: return Color.clear
            }
        }
    }
}

private struct CalendarDraftDrill: Identifiable, Equatable {
    var id: String
    var title: String
    var detail: String
    var tag: String
    var photo: String
    var minutes: Int
    var shots: Int

    static let defaults: [CalendarDraftDrill] = [
        CalendarDraftDrill(id: "form-shooting", title: "Form Shooting", detail: "3 sets • 10 shots", tag: "Release", photo: "059-visual-001", minutes: 5, shots: 10),
        CalendarDraftDrill(id: "elbow-stack-reps", title: "Elbow Stack Reps", detail: "3 sets • 10 shots", tag: "Elbow", photo: "021-v5-recent-elbow", minutes: 5, shots: 10),
        CalendarDraftDrill(id: "free-throws", title: "Free Throws", detail: "2 sets • 10 shots", tag: "Balance", photo: "021-v5-recent-release", minutes: 5, shots: 10),
        CalendarDraftDrill(id: "corner-makes", title: "Corner Makes", detail: "2 sets • 5 makes", tag: "Game Speed", photo: "054-visual-003", minutes: 5, shots: 10)
    ]

    static let recommendations: [CalendarDraftDrill] = [
        CalendarDraftDrill(id: "release-point", title: "Release Point", detail: "1 set • 10 shots", tag: "Release", photo: "021-v5-recent-release", minutes: 5, shots: 10),
        CalendarDraftDrill(id: "follow-through", title: "Follow Through", detail: "2 sets • 10 shots", tag: "Release", photo: "021-v5-recent-wrist", minutes: 8, shots: 10),
        CalendarDraftDrill(id: "arc-control", title: "Arc Control", detail: "2 sets • 10 shots", tag: "Arc", photo: "059-visual-001", minutes: 10, shots: 10),
        CalendarDraftDrill(id: "balance-base", title: "Balance Base", detail: "2 sets • 8 shots", tag: "Balance", photo: "021-v5-recent-elbow", minutes: 6, shots: 8)
    ]
}

private struct CalendarDraftDrillDropDelegate: DropDelegate {
    let item: CalendarDraftDrill
    @Binding var drills: [CalendarDraftDrill]
    @Binding var draggedItem: CalendarDraftDrill?

    func dropEntered(info: DropInfo) {
        guard let draggedItem,
              draggedItem != item,
              let from = drills.firstIndex(of: draggedItem),
              let to = drills.firstIndex(of: item) else { return }
        withAnimation(.spring(response: 0.22, dampingFraction: 0.9)) {
            drills.move(fromOffsets: IndexSet(integer: from), toOffset: to > from ? to + 1 : to)
        }
    }

    func performDrop(info: DropInfo) -> Bool {
        draggedItem = nil
        return true
    }
}

private struct CalendarTrendPlot: View {
    private let values: [CGFloat] = [0.70, 0.55, 0.78, 0.58, 0.86, 0.66, 0.90]

    var body: some View {
        GeometryReader { geo in
            let rect = geo.frame(in: .local)
            let points = values.enumerated().map { index, value in
                let x = rect.minX + CGFloat(index) * rect.width / CGFloat(max(values.count - 1, 1))
                let y = rect.maxY - rect.height * value
                return CGPoint(x: x, y: y)
            }
            ZStack {
                Path { path in
                    path.move(to: CGPoint(x: rect.minX, y: rect.maxY))
                    path.addLine(to: points[0])
                    for point in points.dropFirst() {
                        path.addLine(to: point)
                    }
                    path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
                    path.closeSubpath()
                }
                .fill(
                    LinearGradient(colors: [ShotIQColor.shotiqOrange.opacity(0.30), ShotIQColor.shotiqOrange.opacity(0.04)],
                                   startPoint: .top,
                                   endPoint: .bottom)
                )
                VStack(spacing: 0) {
                    Rectangle().fill(Color.black.opacity(0.18)).frame(height: 1)
                    Spacer()
                    Rectangle().fill(Color.black.opacity(0.18)).frame(height: 1)
                    Spacer()
                    Rectangle().fill(Color.black.opacity(0.35)).frame(height: 2)
                }
                HStack(spacing: 0) {
                    Rectangle().fill(Color.black.opacity(0.55)).frame(width: 2)
                    Spacer()
                }
                Path { path in
                    path.move(to: points[0])
                    for point in points.dropFirst() {
                        path.addLine(to: point)
                    }
                }
                .stroke(ShotIQColor.shotiqOrange, style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round))
                ForEach(Array(points.enumerated()), id: \.offset) { _, point in
                    Circle()
                        .fill(Color.white)
                        .frame(width: 15, height: 15)
                        .overlay(Circle().stroke(ShotIQColor.shotiqOrange, lineWidth: 4))
                        .position(point)
                }
            }
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
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
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
                        HStack(spacing: 10) {
                            NavigationLink { LiveCameraSetupView() } label: {
                                workoutPrimaryAction("record.circle", "Record workout")
                            }
                            .buttonStyle(.plain)
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .progress("Opening live camera",
                                                  "Set up the phone to record this workout.",
                                                  progress: 0.35)
                            })
                            .accessibilityLabel("Record workout video")
                            .accessibilityIdentifier("drill-execution-record-workout")

                            NavigationLink { VideoUploadView() } label: {
                                workoutSecondaryAction("square.and.arrow.up", "Upload clip")
                            }
                            .buttonStyle(.plain)
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening video upload",
                                              "Choose a saved workout clip to analyze.")
                            })
                            .accessibilityLabel("Upload workout video")
                            .accessibilityIdentifier("drill-execution-upload-clip")
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
                            VStack {
                                Spacer()
                                HStack(spacing: 8) {
                                    NavigationLink { LiveCameraSetupView() } label: {
                                        mediaActionPill("record.circle", "Record")
                                    }
                                    .buttonStyle(.plain)
                                    .simultaneousGesture(TapGesture().onEnded {
                                        toast = .progress("Opening live camera",
                                                          "Set up the phone to record this workout.",
                                                          progress: 0.35)
                                    })
                                    .accessibilityLabel("Record workout video")
                                    .accessibilityIdentifier("drill-execution-record-video")

                                    NavigationLink { VideoUploadView() } label: {
                                        mediaActionPill("square.and.arrow.up", "Upload")
                                    }
                                    .buttonStyle(.plain)
                                    .simultaneousGesture(TapGesture().onEnded {
                                        toast = .info("Opening video upload",
                                                      "Choose a saved workout clip to analyze.")
                                    })
                                    .accessibilityLabel("Upload workout video")
                                    .accessibilityIdentifier("drill-execution-upload-video")
                                }
                                .frame(maxWidth: .infinity, alignment: .trailing)
                                .padding(10)
                            }
                        }
                        .padding(.top, 12)
                        PhaseStrip().padding(.top, 16)
                        drillFeedbackStrip
                            .padding(.top, 10)
                        HStack(spacing: 10) {
                            Button {
                                guard m.shots.isEmpty == false else {
                                    toast = .info("No shots to undo",
                                                  "Mark a make or miss before using undo.")
                                    return
                                }
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
                                guard !m.shots.isEmpty else {
                                    toast = .info("Record a shot first",
                                                  "Mark a make or miss before ending this workout.")
                                    return
                                }
                                toast = .progress("Saving workout", "Syncing shots and workout summary.", progress: 0.65)
                                await m.finish(drillName: executionData.drillName)   // persist shots + workout
                                let workout = TrainingWorkoutRecord.manualSession(
                                    drillName: executionData.drillName,
                                    shots: m.shots.count,
                                    makes: m.makes,
                                    durationSeconds: m.elapsed)
                                completedWorkoutsPayload = TrainingWorkoutStore.save(workout, in: completedWorkoutsPayload)
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
            VStack(spacing: 8) {
                workoutVideoActionButtons
                shotActionButtons
            }
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial)
        }
        .navigationDestination(isPresented: $showCompletion) {
            WorkoutCompletionView(shots: m.shots.count,
                                  makes: m.makes,
                                  drillName: executionData.drillName,
                                  preferRouteTotals: true)
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

    private var workoutVideoActionButtons: some View {
        HStack(spacing: 10) {
            NavigationLink { LiveCameraSetupView() } label: {
                workoutPrimaryAction("record.circle", "Record workout")
            }
            .buttonStyle(.plain)
            .simultaneousGesture(TapGesture().onEnded {
                toast = .progress("Opening live camera",
                                  "Set up the phone to record this workout.",
                                  progress: 0.35)
            })
            .accessibilityLabel("Record workout video")
            .accessibilityIdentifier("drill-execution-bottom-record-workout")

            NavigationLink { VideoUploadView() } label: {
                workoutSecondaryAction("square.and.arrow.up", "Upload clip")
            }
            .buttonStyle(.plain)
            .simultaneousGesture(TapGesture().onEnded {
                toast = .info("Opening video upload",
                              "Choose a saved workout clip to analyze.")
            })
            .accessibilityLabel("Upload workout video")
            .accessibilityIdentifier("drill-execution-bottom-upload-clip")
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
    private func workoutPrimaryAction(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14, weight: .bold))
            Text(label).shotiqBody(13, weight: .bold)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 42)
        .foregroundStyle(.white)
        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
    }
    private func workoutSecondaryAction(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14, weight: .bold))
            Text(label).shotiqBody(13, weight: .bold)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 42)
        .foregroundStyle(ShotIQColor.ink)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    private func mediaActionPill(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 12, weight: .bold))
            Text(label).shotiqBody(12, weight: .bold)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 11)
        .frame(height: 34)
        .background(.black.opacity(0.76), in: Capsule())
        .overlay(Capsule().stroke(.white.opacity(0.22)))
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
    private var latestAnalysis: ShotIQAnalysisResultDTO? { app.recentMedia.first?.analysis }
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
                                .accessibilityIdentifier("tracker-timer-remaining")
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
                                        .accessibilityIdentifier("tracker-session-count")
                                }
                                HStack(spacing: 9) {
                                    NavigationLink { LiveCameraSetupView() } label: {
                                        trackerPrimaryAction("record.circle", "Record")
                                    }
                                    .buttonStyle(.plain)
                                    .simultaneousGesture(TapGesture().onEnded {
                                        toast = .progress("Opening live camera",
                                                          "Record your workout video from the tracker.",
                                                          progress: 0.35)
                                    })
                                    .accessibilityLabel("Record shot tracker video")
                                    .accessibilityIdentifier("tracker-record-workout")

                                    NavigationLink { VideoUploadView() } label: {
                                        trackerSecondaryAction("square.and.arrow.up", "Upload")
                                    }
                                    .buttonStyle(.plain)
                                    .simultaneousGesture(TapGesture().onEnded {
                                        toast = .info("Opening video upload",
                                                      "Choose a saved workout clip to analyze.")
                                    })
                                    .accessibilityLabel("Upload shot tracker video")
                                    .accessibilityIdentifier("tracker-upload-clip")
                                }
                                // This plate stays live because it counts the
                                // shots the player records in this session.
                                ZStack(alignment: .bottomLeading) {
                                    CanonicalPhoto("061-visual-001", height: 284)
                                        .accessibilityIdentifier("tracker-media")
                                        .accessibilityLabel("Shot tracker media 061-visual-001")
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(shots == 0 ? "READY" : "SHOT \(shots)")
                                            .shotiqBody(10, weight: .bold).kerning(0.4)
                                            .accessibilityIdentifier("tracker-media-status")
                                        Text(shots == 0 ? "START SESSION" : "JUST NOW")
                                            .shotiqBody(7).opacity(0.8)
                                    }
                                    .foregroundStyle(.white)
                                    .padding(8)
                                    .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 4))
                                    .padding(10)
                                    HStack(spacing: 8) {
                                        NavigationLink { LiveCameraSetupView() } label: {
                                            trackerMediaPill("record.circle", "Record")
                                        }
                                        .buttonStyle(.plain)
                                        .simultaneousGesture(TapGesture().onEnded {
                                            toast = .progress("Opening live camera",
                                                              "Record your workout video from the tracker.",
                                                              progress: 0.35)
                                        })
                                        .accessibilityLabel("Record shot tracker video")
                                        .accessibilityIdentifier("tracker-record-video")

                                        NavigationLink { VideoUploadView() } label: {
                                            trackerMediaPill("square.and.arrow.up", "Upload")
                                        }
                                        .buttonStyle(.plain)
                                        .simultaneousGesture(TapGesture().onEnded {
                                            toast = .info("Opening video upload",
                                                          "Choose a saved workout clip to analyze.")
                                        })
                                        .accessibilityLabel("Upload shot tracker video")
                                        .accessibilityIdentifier("tracker-upload-video")
                                    }
                                    .frame(maxWidth: .infinity, alignment: .trailing)
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
                                NavigationLink {
                                    if let latestAnalysis {
                                        AnalysisResultOverviewView(initialResult: latestAnalysis)
                                    } else {
                                        AnalyzeHubView()
                                    }
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: "list.bullet").font(.system(size: 10))
                                        Text("VIEW ANALYSIS").shotiqBody(9, weight: .bold).kerning(0.4)
                                    }
                                    .frame(maxWidth: .infinity).frame(height: 34)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                    .foregroundStyle(ShotIQColor.ink)
                                }
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = latestAnalysis == nil
                                        ? .info("Analyze a shot first",
                                                "Record or upload media before opening analysis.")
                                        : .info("Opening analysis", "Loading your latest ShotIQ result.")
                                })
                                .accessibilityIdentifier("tracker-view-analysis")
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
                                    .accessibilityElement(children: .combine)
                                    .accessibilityLabel(i <= shots
                                                        ? "Shot \(i) \(m.shots[i - 1].made ? "make" : "miss")"
                                                        : "Shot \(i) open")
                                    .accessibilityIdentifier("tracker-progress-\(i)")
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
                        HStack(alignment: .top, spacing: 8) {
                            ForEach(Array(phaseScores.enumerated()), id: \.offset) { i, p in
                                VStack(spacing: 5) {
                                    PhasePhotoThumbnail(phase: ShotPhase(label: p.0),
                                                        active: p.0 == "RELEASE",
                                                        width: 46,
                                                        height: 32,
                                                        cornerRadius: 4)
                                    Text(p.0).shotiqBody(8, weight: p.0 == "RELEASE" ? .bold : .regular)
                                        .kerning(0.3)
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                        .multilineTextAlignment(.center)
                                        .lineLimit(2).minimumScaleFactor(0.62)
                                        .accessibilityIdentifier("tracker-phase-\(i)-name")
                                    Text(p.1).font(.custom("Tungsten-Medium", size: 12))
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                        .accessibilityIdentifier("tracker-phase-\(i)-value")
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.top, 8)
                        ScoreBar(pct: pct).padding(.top, 8)
                            .accessibilityElement(children: .ignore)
                            .accessibilityLabel("Tracker score bar \(String(format: "%.1f%%", pct * 100))")
                            .accessibilityIdentifier("tracker-score-bar")
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
                                guard shots > 0 else {
                                    toast = .info("No shots to undo",
                                                  "Mark a make or miss before using undo.")
                                    return
                                }
                                m.undo()
                                toast = .info("Last shot removed", "\(shots) shots tracked")
                            } label: {
                                trackerButton("arrow.uturn.backward", "UNDO", ShotIQColor.ink, nil)
                            }
                            .accessibilityLabel("Undo last shot")
                            .accessibilityIdentifier("tracker-undo")
                            Button {
                                Task {
                                    guard shots > 0 else {
                                        toast = .info("Record a shot first",
                                                      "Mark a make or miss before ending.")
                                        return
                                    }
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
        .safeAreaInset(edge: .bottom) {
            trackerVideoActionButtons
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial)
        }
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
                                     size: 24,
                                     label: nil)
            Text(label).shotiqBody(10, weight: .bold).kerning(0.3)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity).frame(height: 50)
        .background(bg ?? .clear, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(bg == nil ? ShotIQColor.rule : .clear))
        .foregroundStyle(fg)
    }
    private var trackerVideoActionButtons: some View {
        HStack(spacing: 10) {
            NavigationLink { LiveCameraSetupView() } label: {
                trackerBottomAction("record.circle", "Record workout", primary: true)
            }
            .buttonStyle(.plain)
            .simultaneousGesture(TapGesture().onEnded {
                toast = .progress("Opening live camera",
                                  "Record your workout video from the tracker.",
                                  progress: 0.35)
            })
            .accessibilityLabel("Record shot tracker video")
            .accessibilityIdentifier("tracker-bottom-record-workout")

            NavigationLink { VideoUploadView() } label: {
                trackerBottomAction("square.and.arrow.up", "Upload clip", primary: false)
            }
            .buttonStyle(.plain)
            .simultaneousGesture(TapGesture().onEnded {
                toast = .info("Opening video upload",
                              "Choose a saved workout clip to analyze.")
            })
            .accessibilityLabel("Upload shot tracker video")
            .accessibilityIdentifier("tracker-bottom-upload-clip")
        }
    }
    private func trackerBottomAction(_ icon: String, _ label: String, primary: Bool) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14, weight: .bold))
            Text(label).shotiqBody(13, weight: .bold)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 44)
        .foregroundStyle(primary ? .white : ShotIQColor.ink)
        .background(primary ? ShotIQColor.shotiqOrange : ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(primary ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
        .contentShape(Rectangle())
    }
    private func trackerPrimaryAction(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 12, weight: .bold))
            Text(label).shotiqBody(11, weight: .bold)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 36)
        .foregroundStyle(.white)
        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
    }
    private func trackerSecondaryAction(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 12, weight: .bold))
            Text(label).shotiqBody(11, weight: .bold)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 36)
        .foregroundStyle(ShotIQColor.ink)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    private func trackerMediaPill(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 11, weight: .bold))
            Text(label).shotiqBody(11, weight: .bold)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 9)
        .frame(height: 32)
        .background(.black.opacity(0.76), in: Capsule())
        .overlay(Capsule().stroke(.white.opacity(0.22)))
    }
}

struct WorkoutCompletionView: View { // 062
    @EnvironmentObject var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @State private var toast: ShotIQToast?
    var workout: TrainingWorkoutRecord?
    var shots = 24; var makes = 15
    var drillName = "Quick Release Builder"
    var preferRouteTotals = false
    private var routeWorkout: TrainingWorkoutRecord {
        TrainingWorkoutRecord.manualSession(drillName: drillName,
                                            shots: shots,
                                            makes: makes,
                                            durationSeconds: 20 * 60)
    }
    private var resolvedWorkout: TrainingWorkoutRecord {
        if let workout { return workout }
        if preferRouteTotals { return routeWorkout }
        return TrainingWorkoutStore.latest(in: completedWorkoutsPayload) ?? routeWorkout
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
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening workout calendar")
                        })
                        .accessibilityLabel("View workout calendar")
                        .accessibilityIdentifier("completion-calendar-link")
                        VRule(height: 46)
                        NavigationLink { PlayerCardView() } label: {
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                        }
                        .buttonStyle(.plain)
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening player card")
                        })
                        .accessibilityLabel("View player card points")
                        .accessibilityIdentifier("completion-player-card-link")
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
                                    .accessibilityElement()
                                    .accessibilityLabel("Workout completion media 062-visual-001")
                                    .accessibilityIdentifier("completion-media")
                                VStack(alignment: .leading, spacing: 6) {
                                    MicroLabel(text: "FORM SCORE")
                                    Text("\(resolvedWorkout.formScore)").font(.custom("Tungsten-Medium", size: 58))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .accessibilityIdentifier("completion-form-score")
                                    ScoreBar(pct: Double(resolvedWorkout.formScore) / 100)
                                        .frame(width: 96)
                                        .accessibilityElement()
                                        .accessibilityLabel("Form score progress \(resolvedWorkout.formScore) percent")
                                        .accessibilityIdentifier("completion-form-score-bar")
                                    Text(resolvedWorkout.formVerdict).shotiqBody(13, weight: .bold)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                        .accessibilityIdentifier("completion-form-verdict")
                                    Text(resolvedWorkout.formNote)
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .accessibilityIdentifier("completion-form-note")
                                }
                                .padding(14)
                                Spacer(minLength: 0)
                            }
                        }
                        .padding(.top, 12)
                        SectionLabel(text: "PHASE BREAKDOWN").padding(.top, 20)
                        HStack(alignment: .top, spacing: 8) {
                            ForEach(Array(resolvedWorkout.phaseScores.enumerated()), id: \.offset) { i, p in
                                VStack(spacing: 5) {
                                    PhasePhotoThumbnail(phase: ShotPhase(label: p.0),
                                                        active: p.0 == "RELEASE",
                                                        width: 48,
                                                        height: 34,
                                                        cornerRadius: 4)
                                    Text(p.0).shotiqBody(8, weight: p.0 == "RELEASE" ? .bold : .regular)
                                        .kerning(0.3)
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                        .multilineTextAlignment(.center)
                                        .lineLimit(2).minimumScaleFactor(0.62)
                                        .accessibilityIdentifier("completion-phase-\(i)-name")
                                    Text("\(p.1)").font(.custom("Tungsten-Medium", size: 16))
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                        .accessibilityIdentifier("completion-phase-\(i)-value")
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
                                        .accessibilityIdentifier("completion-primary-target-title")
                                    HStack(spacing: 10) {
                                        ScoreBar(pct: Double(resolvedWorkout.primaryTargetScore) / 10, color: ShotIQColor.confirmGreen)
                                            .accessibilityElement()
                                            .accessibilityLabel("Primary target progress \(resolvedWorkout.primaryTargetScore) out of 10")
                                            .accessibilityIdentifier("completion-primary-target-bar")
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
                                        .accessibilityIdentifier("completion-coaching-takeaway")
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
                        .accessibilityLabel("Next recommendation Elbow Stack Builder")
                        .accessibilityIdentifier("completion-next-recommendation")
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .success("Opening recommended drill", "Elbow Stack Builder")
                        })
                        .padding(.top, 10)
                        HStack(spacing: 10) {
                            NavigationLink {
                                if let latest = app.recentMedia.first {
                                    ShotBreakdownView(presentation: AnalysisResultPresentation(result: latest.analysis))
                                } else if UITestHooks.demoData {
                                    ShotBreakdownView(presentation: .canonicalDemo)
                                } else {
                                    AnalyzeHubView()
                                }
                            } label: {
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
                            .accessibilityIdentifier("completion-review-shots")
                            .simultaneousGesture(TapGesture().onEnded {
                                if !app.recentMedia.isEmpty || UITestHooks.demoData {
                                    toast = .progress("Opening shot review",
                                                      "Loading your shot breakdown.",
                                                      progress: 0.45)
                                } else {
                                    toast = .info("Analyze a shot first",
                                                  "Record or upload media before reviewing shot frames.")
                                }
                            })
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
                            .accessibilityLabel("Share progress \(resolvedWorkout.makes) of \(resolvedWorkout.shots) makes \(accuracy)")
                            .accessibilityIdentifier("completion-share-progress")
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening share sheet", "Workout progress is ready.")
                            })
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
                            .accessibilityIdentifier("completion-repeat-drill")
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .success("Repeating drill", drillName)
                            })
                        }
                        .padding(.vertical, 20)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
    }
    /// Canonical 062 prints four clearly different marks across this row. The
    /// shipped screen used `scope` for SHOTS and `target` for MAKES — two SF
    /// concentric rings that both graders read as the same icon.
    private func completionStat(_ icon: String, _ value: String, _ label: String, _ color: Color,
                                id: String? = nil) -> some View {
        VStack(spacing: 4) {
            StatMarkGlyph(kind: StatMarkGlyph.kind(forStatLabel: label) ?? .volume, size: 28)
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
