import SwiftUI
import UIKit

// Player card & elite comparison flow — screens 048-053. Shooter data comes
// from the shared /api/shooters endpoint. Elite shooter photos are neutral
// gray placeholder rectangles (no raster assets ship with the app).

/// TopBar whose settings gear actually opens the Settings hub.
fileprivate struct EliteTopBar: View {
    @State private var showSettings = false
    var body: some View {
        TopBar(onSettings: { showSettings = true })
            .navigationDestination(isPresented: $showSettings) { SettingsHubView() }
    }
}

/// Lightweight payload for this flow's info alerts.
fileprivate struct EliteInfoNote: Identifiable {
    let id = UUID()
    let title: String
    let message: String
}

fileprivate enum EliteStudyStore {
    static let comparisonsKey = "shotiq.elite.savedComparisons.v1"
    static let referencesKey = "shotiq.elite.savedReferences.v1"

    static func contains(_ id: String, key: String) -> Bool {
        decode(key).contains(id)
    }

    static func set(_ saved: Bool, id: String, key: String) {
        var ids = decode(key)
        if saved { ids.insert(id) } else { ids.remove(id) }
        encode(ids, key: key)
    }

    private static func decode(_ key: String) -> Set<String> {
        guard let data = UserDefaults.standard.data(forKey: key),
              let ids = try? JSONDecoder().decode([String].self, from: data) else { return [] }
        return Set(ids)
    }

    private static func encode(_ ids: Set<String>, key: String) {
        guard let data = try? JSONEncoder().encode(Array(ids).sorted()) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }
}

fileprivate extension View {
    func eliteInfoAlert(_ note: Binding<EliteInfoNote?>) -> some View {
        alert(note.wrappedValue?.title ?? "",
              isPresented: Binding(get: { note.wrappedValue != nil },
                                   set: { if !$0 { note.wrappedValue = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(note.wrappedValue?.message ?? "")
        }
    }
}

fileprivate struct EliteRemotePoseImage: View {
    var url: URL
    var height: CGFloat
    var fallbackKey: String
    var alignment: Alignment = .center
    var initialPose: DetectedPose?

    @State private var image: UIImage?
    @State private var failed = false

    var body: some View {
        Group {
            if let image {
                CapturedPoseImage(image: image,
                                  height: height,
                                  cornerRadius: 4,
                                  showsPose: true,
                                  showBones: true,
                                  showJoints: true,
                                  initialPose: initialPose)
            } else {
                CanonicalMediaSurface(key: fallbackKey, height: height, alignment: alignment)
                    .overlay {
                        if failed {
                            Text("Media unavailable")
                                .shotiqBody(11, weight: .semibold)
                                .foregroundStyle(.white)
                                .padding(.horizontal, 9).padding(.vertical, 6)
                                .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 5))
                        } else {
                            ProgressView()
                                .controlSize(.regular)
                                .tint(.white)
                                .padding(12)
                                .background(.black.opacity(0.55), in: Circle())
                        }
                    }
            }
        }
        .task(id: url) { await loadImage() }
    }

    private func loadImage() async {
        image = nil
        failed = false
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse,
                  (200..<300).contains(http.statusCode),
                  let loaded = UIImage(data: data) else {
                failed = true
                return
            }
            image = loaded
        } catch {
            failed = true
        }
    }
}

/// Compact, self-contained card used for ImageRenderer exports ("Download card" /
/// "Save card"). Mirrors the canonical card banner + score + session stats.
fileprivate struct PlayerCardExportView: View {
    var name: String
    var subtitle: String = "RIGHT-HANDED • ADVANCED"
    var scoreText: String = "82"
    var scorePct: Double = 0.82
    var scoreVerdict: String = "GOOD"
    var shotsText: String = "24"
    var makesText: String = "15"
    var accuracyText: String = "62.5%"
    var accent: Color = ShotIQColor.shotiqOrange
    var jersey: Int? = nil
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("SHOTIQ").shotiqCondensed(17, weight: .black)
                Spacer()
                if let jersey {
                    Text("#\(jersey)").font(.custom("Tungsten-Medium", size: 18))
                }
                Text("AI ANALYSIS").shotiqBody(12, weight: .semibold).kerning(3)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 16).frame(height: 44)
            .background(accent)
            VStack(alignment: .leading, spacing: 10) {
                Text(name.uppercased()).shotiqDisplay(34)
                Text(subtitle.uppercased()).shotiqBody(11, weight: .medium).kerning(0.6)
                    .foregroundStyle(ShotIQColor.graphite)
                HStack(alignment: .center, spacing: 16) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("FORM SCORE").shotiqBody(10, weight: .semibold).kerning(0.6)
                            .foregroundStyle(ShotIQColor.graphite)
                        Text(scoreText).font(.custom("Tungsten-Medium", size: 52)).foregroundStyle(accent)
                        ScoreBar(pct: scorePct, color: accent).frame(width: 96)
                    }
                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 56)
                    StatBlock(value: shotsText, label: "SHOTS", valueSize: ShotIQType.numeric)
                    StatBlock(value: makesText, label: "MAKES", valueSize: ShotIQType.numeric)
                    StatBlock(value: accuracyText, label: "MAKE %", valueSize: ShotIQType.numeric)
                }
                Text(scoreVerdict).shotiqBody(11, weight: .bold).kerning(0.6)
                    .foregroundStyle(ShotIQColor.graphite)
                PhaseStrip()
            }
            .padding(16)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ShotIQColor.paper)
    }
}

enum PlayerCardImageRenderer {
    @MainActor
    static func render(name: String,
                       subtitle: String = "RIGHT-HANDED • ADVANCED",
                       scoreText: String = "82",
                       scorePct: Double = 0.82,
                       scoreVerdict: String = "GOOD",
                       shotsText: String = "24",
                       makesText: String = "15",
                       accuracyText: String = "62.5%",
                       accent: Color = ShotIQColor.shotiqOrange,
                       jersey: Int? = nil) -> UIImage? {
        let renderer = ImageRenderer(content: PlayerCardExportView(name: name,
                                                                   subtitle: subtitle,
                                                                   scoreText: scoreText,
                                                                   scorePct: scorePct,
                                                                   scoreVerdict: scoreVerdict,
                                                                   shotsText: shotsText,
                                                                   makesText: makesText,
                                                                   accuracyText: accuracyText,
                                                                   accent: accent,
                                                                   jersey: jersey))
        renderer.scale = 3
        return renderer.uiImage
    }
}

fileprivate struct PlayerCardPhaseData {
    var phase: String
    var score: String
    var tint: Color
    var active: Bool
}

fileprivate struct PlayerCardData {
    var name: String
    var subtitle: String
    var scoreText: String
    var scorePct: Double
    var scoreVerdict: String
    var scoreCaption: String
    var streakText: String
    var pointsText: String
    var shotsText: String
    var makesText: String
    var accuracyText: String
    var trendText: String
    var archetypeTitle: String
    var archetypeCaption: String
    var primaryTarget: String
    var primaryCaption: String
    var badgeTitle: String
    var badgeCaption: String
    var heightText: String
    var heightMetric: String
    var wingspanText: String
    var wingspanMetric: String
    var shootingReachText: String
    var shootingReachMetric: String
    var standingReachText: String
    var standingReachMetric: String
    var phaseScores: [PlayerCardPhaseData]

    static func make(user: APIUser?,
                     latestAnalysis: ShotIQAnalysisResultDTO?,
                     hand: String,
                     level: String,
                     heightIn: Int,
                     wingspanIn: Int) -> PlayerCardData {
        let name = user?.displayName?.isEmpty == false ? (user?.displayName ?? "Jordan Ellis") : "Jordan Ellis"
        let isCanonicalDemo = latestAnalysis == nil && UITestHooks.demoData
        let presentation = latestAnalysis.map(AnalysisResultPresentation.init)
            ?? (isCanonicalDemo ? .canonicalDemo : .noResult)
        let subtitle = "\(hand.capitalized)-handed • \(level.capitalized)"
        let measurements = Self.measurements(isCanonicalDemo: isCanonicalDemo,
                                             heightIn: heightIn,
                                             wingspanIn: wingspanIn)
        let phaseScores = isCanonicalDemo
            ? [
                PlayerCardPhaseData(phase: "SETUP", score: "84", tint: ShotIQColor.confirmGreen, active: false),
                PlayerCardPhaseData(phase: "LOAD", score: "78", tint: ShotIQColor.analysisBlue, active: false),
                PlayerCardPhaseData(phase: "RISE", score: "81", tint: ShotIQColor.analysisBlue, active: false),
                PlayerCardPhaseData(phase: "RELEASE", score: "78", tint: ShotIQColor.shotiqOrange, active: true),
                PlayerCardPhaseData(phase: "FOLLOW-THROUGH", score: "88", tint: ShotIQColor.confirmGreen, active: false),
            ]
            : Self.phaseScores(from: presentation)

        return PlayerCardData(
            name: name,
            subtitle: subtitle,
            scoreText: presentation.scoreText,
            scorePct: presentation.scorePct,
            scoreVerdict: presentation.scoreVerdict,
            scoreCaption: presentation.scoreCaption,
            streakText: isCanonicalDemo ? "6" : "--",
            pointsText: isCanonicalDemo ? "2,840" : "--",
            shotsText: isCanonicalDemo ? "24" : "--",
            makesText: isCanonicalDemo ? "15" : "--",
            accuracyText: isCanonicalDemo ? "62.5%" : "--",
            trendText: isCanonicalDemo ? "+8.1%" : presentation.provenanceSummary,
            archetypeTitle: isCanonicalDemo ? "Balanced Shooter" : "\(presentation.mediaLabel) Analysis",
            archetypeCaption: isCanonicalDemo
                ? "Smooth, repeatable, and well-aligned mechanics."
                : presentation.provenanceSummary,
            primaryTarget: presentation.coachingTarget,
            primaryCaption: isCanonicalDemo
                ? "Maintain vertical alignment for a cleaner release."
                : "Built from the latest saved ShotIQ analysis.",
            badgeTitle: isCanonicalDemo ? "Release Control" : presentation.sourceCoverageVerdict,
            badgeCaption: isCanonicalDemo
                ? "Consistent release height and timing."
                : presentation.sourceCoverageCaption,
            heightText: measurements.heightText,
            heightMetric: measurements.heightMetric,
            wingspanText: measurements.wingspanText,
            wingspanMetric: measurements.wingspanMetric,
            shootingReachText: measurements.shootingReachText,
            shootingReachMetric: measurements.shootingReachMetric,
            standingReachText: measurements.standingReachText,
            standingReachMetric: measurements.standingReachMetric,
            phaseScores: phaseScores)
    }

    private static func phaseScores(from presentation: AnalysisResultPresentation) -> [PlayerCardPhaseData] {
        let labels = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
        let items = Array(presentation.scoreBreakdown.prefix(labels.count))
        return labels.enumerated().map { index, label in
            let item = index < items.count ? items[index] : nil
            let pct = item?.scorePct ?? 0
            return PlayerCardPhaseData(phase: label,
                                       score: item?.scoreText ?? "--",
                                       tint: Self.tint(for: pct, source: item?.source ?? "missing"),
                                       active: label == "RELEASE")
        }
    }

    private static func tint(for pct: Double, source: String) -> Color {
        guard source != "missing" else { return ShotIQColor.graphite }
        if pct >= 0.84 { return ShotIQColor.confirmGreen }
        if pct >= 0.70 { return ShotIQColor.analysisBlue }
        return ShotIQColor.shotiqOrange
    }

    private static func measurements(isCanonicalDemo: Bool,
                                     heightIn: Int,
                                     wingspanIn: Int) -> (heightText: String, heightMetric: String,
                                                         wingspanText: String, wingspanMetric: String,
                                                         shootingReachText: String, shootingReachMetric: String,
                                                         standingReachText: String, standingReachMetric: String) {
        if isCanonicalDemo {
            return ("6'3\"", "190 cm", "6'6\"", "198 cm", "8'2\"", "249 cm", "8'0\"", "244 cm")
        }
        let standingReach = max(heightIn + 21, 0)
        let shootingReach = max(standingReach + 2, 0)
        return (Self.inchesText(heightIn), Self.cmText(heightIn),
                Self.inchesText(wingspanIn), Self.cmText(wingspanIn),
                Self.inchesText(shootingReach), Self.cmText(shootingReach),
                Self.inchesText(standingReach), Self.cmText(standingReach))
    }

    private static func inchesText(_ inches: Int) -> String {
        "\(inches / 12)'\(inches % 12)\""
    }

    private static func cmText(_ inches: Int) -> String {
        "\(Int(round(Double(inches) * 2.54))) cm"
    }
}

fileprivate struct EliteMatchMetricData: Identifiable {
    var id: String { name }
    var icon: String
    var name: String
    var unit: String
    var you: String
    var elite: String
    var diff: String
    var markerPct: Double
}

fileprivate struct EliteMatchData {
    var playerName: String
    var playerSubtitle: String
    var formScore: String
    var formPct: Double
    var shots: String
    var makes: String
    var accuracy: String
    var eliteName: String
    var eliteSubtitle: String
    var eliteScore: String
    var similarity: String
    var sharedMechanics: String
    var releaseAlignment: String
    var target: String
    var targetState: String
    var targetMatch: String
    var comparisonRows: [EliteMatchMetricData]

    static func make(user: APIUser?,
                     shooter: EliteShooterDTO?,
                     presentation explicitPresentation: AnalysisResultPresentation?,
                     latestAnalysis: ShotIQAnalysisResultDTO?,
                     hand: String,
                     level: String) -> EliteMatchData {
        let playerName = user?.displayName?.isEmpty == false ? (user?.displayName ?? "Jordan Ellis") : "Jordan Ellis"
        let shooterName = shooter?.name ?? "Elite Guard"
        let shooterSubtitle = shooter.map { "\($0.team) • \($0.position)" } ?? "Reference Profile"
        let isCanonicalDemo = explicitPresentation == nil && latestAnalysis == nil && UITestHooks.demoData
        let presentation = explicitPresentation
            ?? latestAnalysis.map(AnalysisResultPresentation.init)
            ?? (isCanonicalDemo ? .canonicalDemo : .noResult)
        if isCanonicalDemo {
            return EliteMatchData(
                playerName: playerName,
                playerSubtitle: "Right-handed • Advanced",
                formScore: "82",
                formPct: 0.82,
                shots: "24",
                makes: "15",
                accuracy: "62.5%",
                eliteName: shooterName,
                eliteSubtitle: shooterSubtitle,
                eliteScore: "94",
                similarity: "89%",
                sharedMechanics: "5 OF 6",
                releaseAlignment: "±2°",
                target: "Keep elbow stacked through release",
                targetState: "ON TRACK",
                targetMatch: "91% match",
                comparisonRows: Self.canonicalRows)
        }
        let measured = max(presentation.scoreBreakdown.filter { !$0.isUnavailable }.count,
                           presentation.sourceCoverageText == "0" ? 0 : 1)
        let total = max(presentation.scoreBreakdown.count, 1)
        let similarity = Int(round((Double(measured) / Double(total)) * 100))
        let targetState = presentation.scoreVerdict == "UNAVAILABLE" ? "NEEDS DATA" : presentation.scoreVerdict
        let releaseAlignment = presentation.releaseOffsetText == "--" ? "--" : presentation.releaseOffsetText
        return EliteMatchData(
            playerName: playerName,
            playerSubtitle: "\(hand.capitalized)-handed • \(level.capitalized)",
            formScore: presentation.scoreText,
            formPct: presentation.scorePct,
            shots: "--",
            makes: "--",
            accuracy: "--",
            eliteName: shooterName,
            eliteSubtitle: shooterSubtitle,
            eliteScore: "94",
            similarity: "\(similarity)%",
            sharedMechanics: "\(measured) OF \(total)",
            releaseAlignment: releaseAlignment,
            target: presentation.coachingTarget,
            targetState: targetState,
            targetMatch: presentation.sourceCoverageVerdict,
            comparisonRows: Self.rows(from: presentation))
    }

    private static let canonicalRows: [EliteMatchMetricData] = [
        EliteMatchMetricData(icon: "figure.basketball", name: "Release Height", unit: "inches", you: "78.2", elite: "78.6", diff: "0.4\"", markerPct: 0.46),
        EliteMatchMetricData(icon: "angle", name: "Release Angle", unit: "degrees", you: "52°", elite: "51°", diff: "1°", markerPct: 0.48),
        EliteMatchMetricData(icon: "point.3.connected.trianglepath.dotted", name: "Elbow Flexion", unit: "degrees", you: "92°", elite: "93°", diff: "1°", markerPct: 0.48),
        EliteMatchMetricData(icon: "person.crop.rectangle", name: "Shot Pocket", unit: "inches", you: "12.1\"", elite: "12.4\"", diff: "0.3\"", markerPct: 0.47),
        EliteMatchMetricData(icon: "arrow.up.and.down", name: "Vertical Jump", unit: "inches", you: "18.7\"", elite: "19.1\"", diff: "0.4\"", markerPct: 0.46),
        EliteMatchMetricData(icon: "stopwatch", name: "Release Time", unit: "sec", you: "0.52", elite: "0.50", diff: "0.02", markerPct: 0.48),
    ]

    private static func rows(from presentation: AnalysisResultPresentation) -> [EliteMatchMetricData] {
        let balance = presentation.scoreBreakdown.first { $0.metric.caseInsensitiveCompare("Balance") == .orderedSame }?.scoreText ?? "--"
        let centerline = presentation.metrics.first { $0.label == "CENTERLINE" }?.value ?? "--"
        return [
            EliteMatchMetricData(icon: "figure.basketball", name: "Release Height", unit: "saved analysis", you: presentation.releaseHeightText, elite: "7'8\"", diff: diffText(presentation.releaseHeightText), markerPct: marker(for: presentation.releaseHeightText)),
            EliteMatchMetricData(icon: "angle", name: "Release Offset", unit: "-5° to +5° target", you: presentation.releaseOffsetText, elite: "0°", diff: diffText(presentation.releaseOffsetText), markerPct: marker(for: presentation.releaseOffsetText)),
            EliteMatchMetricData(icon: "point.3.connected.trianglepath.dotted", name: "Elbow Angle", unit: "150°-180° target", you: presentation.elbowAngleText, elite: "165°", diff: diffText(presentation.elbowAngleText), markerPct: marker(for: presentation.elbowAngleText)),
            EliteMatchMetricData(icon: "point.bottomleft.forward.to.point.topright.scurvepath", name: "Wrist Angle", unit: "50°-100° target", you: presentation.wristAngleText, elite: "75°", diff: diffText(presentation.wristAngleText), markerPct: marker(for: presentation.wristAngleText)),
            EliteMatchMetricData(icon: "scale.3d", name: "Balance", unit: "base stability", you: balance, elite: "95%", diff: diffText(balance), markerPct: marker(for: balance)),
            EliteMatchMetricData(icon: "scope", name: "Centerline", unit: "body alignment", you: centerline, elite: "0°", diff: diffText(centerline), markerPct: marker(for: centerline)),
        ]
    }

    private static func diffText(_ value: String) -> String {
        value == "--" ? "--" : "measured"
    }

    private static func marker(for value: String) -> Double {
        value == "--" ? 0.08 : 0.48
    }
}

fileprivate enum EliteComparisonSelection {
    static let shooterIDKey = "eliteCompareShooterID"

    static func resolve(shooterID: Int,
                        explicit: EliteShooterDTO?,
                        shooters: [EliteShooterDTO]) -> EliteShooterDTO? {
        explicit
            ?? shooters.first { $0.id == shooterID }
            ?? shooters.first
    }
}

/// Career shooting rates arrive from /api/shooters already scaled 0-100 —
/// `src/data/eliteShooters.ts` carries `careerPct: 43.0`, and the route passes
/// it through untouched. The UITest seed below used to carry 0-1 fractions
/// instead, which is why 053 rendered "0.5%" for a 45.9% shooter: the seed and
/// the API disagreed, not the formatter. The seed now matches the API and one
/// formatter owns every display site so the five cannot drift apart again.
func shotiqPercentText(_ percent: Double?) -> String {
    guard let percent else { return "—" }
    return String(format: "%.1f%%", percent)
}

fileprivate struct EliteShooterBreakdownData {
    var label: String
    var percent: String
    var shots: String
}

fileprivate struct EliteShooterMechanicData {
    var label: String
    var value: String
}

fileprivate struct EliteShooterDetailData {
    var scoreText: String
    var scorePct: Double
    var scoreVerdict: String
    var scoreNote: String
    var tierValue: String
    var tierLabel: String
    var analyzedText: String
    var breakdownTotal: String
    var breakdown: [EliteShooterBreakdownData]
    var mechanics: [EliteShooterMechanicData]
    var strengths: [String]
    var weaknesses: [String]
    var bioText: String
    var shareText: String

    static func make(shooter: EliteShooterDTO) -> EliteShooterDetailData {
        if isCanonicalDemo(shooter) {
            return EliteShooterDetailData(
                scoreText: "82",
                scorePct: 0.82,
                scoreVerdict: "GOOD",
                scoreNote: "High-level, repeatable form.",
                tierValue: "53",
                tierLabel: "ELITE",
                analyzedText: "24 Shots Analyzed",
                breakdownTotal: "100% = 24 SHOTS",
                breakdown: [
                    EliteShooterBreakdownData(label: "Catch & Shoot", percent: "62.5%", shots: "15 SHOTS"),
                    EliteShooterBreakdownData(label: "Pull-Up", percent: "20.8%", shots: "5 SHOTS"),
                    EliteShooterBreakdownData(label: "Off Dribble", percent: "12.5%", shots: "3 SHOTS"),
                    EliteShooterBreakdownData(label: "Other", percent: "4.2%", shots: "1 SHOT"),
                ],
                mechanics: [
                    EliteShooterMechanicData(label: "Elbow Angle", value: "89°"),
                    EliteShooterMechanicData(label: "Release Height", value: "7'1\""),
                    EliteShooterMechanicData(label: "Release Angle", value: "51°"),
                    EliteShooterMechanicData(label: "Balance", value: "88%"),
                ],
                strengths: ["Quick, repeatable release", "High shooting arc", "Consistent base and balance"],
                weaknesses: ["Slight elbow flare in load", "Lower body under-utilized", "Off dribble rhythm"],
                bioText: bioText(shooter: shooter),
                shareText: "Studying \(shooter.name)'s shooting form on ShotIQ - \(shotiqPercentText(shooter.careerFieldGoalPct)) career FG.")
        }

        let score = wsiScore(shooter)
        let totalShots = max(18, min(72, Int(round((shooter.careerThreePct ?? shooter.careerPct ?? 38) * 0.58))))
        let catchPct = min(68, max(46, Int(round((shooter.careerThreePct ?? 38) + 18))))
        let pullPct = shooter.position.localizedCaseInsensitiveContains("point") ? 24 : 18
        let offPct = shooter.position.localizedCaseInsensitiveContains("guard") ? 16 : 10
        let otherPct = max(4, 100 - catchPct - pullPct - offPct)
        let breakdown = [
            breakdownRow("Catch & Shoot", catchPct, totalShots),
            breakdownRow("Pull-Up", pullPct, totalShots),
            breakdownRow("Off Dribble", offPct, totalShots),
            breakdownRow("Other", otherPct, totalShots),
        ]
        let releaseAngle = Int(round(47 + ((shooter.careerThreePct ?? shooter.careerPct ?? 38) - 35) * 0.35))
        let elbow = min(178, max(150, 150 + Int(round(Double(score - 70) * 0.45))))
        let releaseHeight = shooter.height + 24
        let balance = min(99, 82 + max(0, score - 70) / 2)

        return EliteShooterDetailData(
            scoreText: "\(score)",
            scorePct: Double(score) / 100.0,
            scoreVerdict: verdict(score),
            scoreNote: "\(shooter.name)'s reference profile is derived from career shooting data.",
            tierValue: "\(score)",
            tierLabel: tierLabel(shooter),
            analyzedText: "\(totalShots) Reference Samples",
            breakdownTotal: "100% = \(totalShots) SAMPLES",
            breakdown: breakdown,
            mechanics: [
                EliteShooterMechanicData(label: "Elbow Angle", value: "\(elbow)°"),
                EliteShooterMechanicData(label: "Release Height", value: inchesText(releaseHeight)),
                EliteShooterMechanicData(label: "Release Angle", value: "\(releaseAngle)°"),
                EliteShooterMechanicData(label: "Balance", value: "\(balance)%"),
            ],
            strengths: strengths(shooter, score: score),
            weaknesses: weaknesses(shooter, score: score),
            bioText: bioText(shooter: shooter),
            shareText: "Studying \(shooter.name)'s shooting form on ShotIQ - \(shotiqPercentText(shooter.careerFieldGoalPct)) career FG, \(shotiqPercentText(shooter.careerThreePct ?? shooter.careerPct)) from three.")
    }

    static func isCanonicalDemo(_ shooter: EliteShooterDTO) -> Bool {
        UITestHooks.demoData && !UITestHooks.eliteShooterCatalog && shooter.id == 1
    }

    static func wsiScore(_ shooter: EliteShooterDTO) -> Int {
        let fg = shooter.careerFieldGoalPct ?? shooter.careerPct ?? 38
        let three = shooter.careerThreePct ?? shooter.careerPct ?? 38
        let ft = shooter.careerFreeThrowPct
        let efficiency = fg * 0.35 + three * 0.45 + ft * 0.20
        let boost: Double
        switch tierLabel(shooter).lowercased() {
        case "legendary": boost = 44
        case "elite": boost = 40
        case "great": boost = 34
        case "good": boost = 28
        case "mid level", "mid_level": boost = 20
        default: boost = 12
        }
        return min(99, max(30, Int(round(efficiency + boost))))
    }

    static func tierLabel(_ shooter: EliteShooterDTO) -> String {
        (shooter.tier ?? "Reference")
            .replacingOccurrences(of: "_", with: " ")
            .capitalized
    }

    private static func breakdownRow(_ label: String, _ pct: Int, _ total: Int) -> EliteShooterBreakdownData {
        let shots = max(1, Int(round(Double(total * pct) / 100.0)))
        return EliteShooterBreakdownData(label: label,
                                         percent: "\(pct)%",
                                         shots: "\(shots) \(shots == 1 ? "SAMPLE" : "SAMPLES")")
    }

    private static func verdict(_ score: Int) -> String {
        if score >= 95 { return "LEGENDARY" }
        if score >= 88 { return "ELITE" }
        if score >= 78 { return "GREAT" }
        if score >= 70 { return "GOOD" }
        return "DEVELOPING"
    }

    private static func strengths(_ shooter: EliteShooterDTO, score: Int) -> [String] {
        var items: [String] = []
        if (shooter.careerThreePct ?? shooter.careerPct ?? 0) >= 42 {
            items.append("Deep range efficiency")
        } else {
            items.append("Repeatable perimeter touch")
        }
        if shooter.careerFreeThrowPct >= 88 {
            items.append("Stable free-throw mechanics")
        } else {
            items.append("Compact repeatable base")
        }
        items.append(score >= 90 ? "Elite shot preparation" : "Reliable release rhythm")
        return items
    }

    private static func weaknesses(_ shooter: EliteShooterDTO, score: Int) -> [String] {
        var items: [String] = []
        items.append(shooter.height < 76 ? "Needs quick release window" : "Can tighten off-dribble timing")
        items.append((shooter.careerThreePct ?? shooter.careerPct ?? 0) < 39 ? "Improve three-point consistency" : "Maintain balance under contests")
        items.append(score >= 90 ? "Small misses show in footwork" : "Raise release consistency")
        return items
    }

    private static func bioText(shooter: EliteShooterDTO) -> String {
        let key = shooter.name.lowercased()
        if key.contains("stephen curry") || key.contains("steph curry") {
            return "Stephen Curry changed what defenses have to guard. His greatness comes from range, handle, footwork, and a release fast enough to punish even a small mistake. Study Curry for balance on movement shots and the confidence to shoot with the same form from well beyond the line."
        }
        if key.contains("klay thompson") {
            return "Klay Thompson is one of the cleanest catch-and-shoot players ever. His shot is built on quiet feet, square shoulders, and almost no wasted motion from catch to release. Study Klay for repeatable mechanics, quick preparation, and how to stay ready without needing the ball in your hands."
        }
        if key.contains("ray allen") {
            return "Ray Allen turned shooting into a daily standard. His footwork, conditioning, and perfect repeatability made him elite coming off screens, spotting up, and shooting under pressure. Study Allen for preparation, body control, and the discipline to make every rep look the same."
        }
        if key.contains("steve kerr") {
            return "Steve Kerr was one of the most accurate three-point shooters in league history. His value came from knowing his role, getting his feet set early, and taking only the shots his mechanics were ready to finish. Study Kerr for shot selection, spacing, and simple form that holds up in big moments."
        }
        if key.contains("rick barry") {
            return "Rick Barry was a brilliant scorer with touch that showed up from the field and at the free-throw line. His underhand free throw looked different, but the result was elite because the routine was repeatable and pressure-proof. Study Barry for touch, confidence, and the courage to trust a mechanic that works."
        }
        let fg = shotiqPercentText(shooter.careerFieldGoalPct)
        let tp = shotiqPercentText(shooter.careerThreePct ?? shooter.careerPct)
        let strength = strengths(shooter, score: wsiScore(shooter)).first?.lowercased() ?? "repeatable shooting mechanics"
        return "\(shooter.name) is a \(tierLabel(shooter).lowercased()) \(shooter.era ?? "era") shooting reference for \(shooter.team). At \(shooter.height / 12)'\(shooter.height % 12)\" and \(shooter.weight) lb, the profile shows \(fg) from the field, \(tp) from three, and \(shotiqPercentText(shooter.careerFreeThrowPct)) at the line. Study this player for \(strength) and the way their mechanics repeat under game pressure."
    }

    private static func inchesText(_ inches: Int) -> String {
        "\(inches / 12)'\(inches % 12)\""
    }

    private static func grouped(_ value: Int) -> String {
        NumberFormatter.localizedString(from: NSNumber(value: value), number: .decimal)
    }
}

struct PlayerCardView: View {       // 048
    @EnvironmentObject var app: AppState
    @AppStorage("profileHeightIn") private var heightIn = 75
    @AppStorage("profileWingspanIn") private var wingspanIn = 77
    @AppStorage("profileHand") private var hand = "right"
    @AppStorage("profileLevel") private var level = "advanced"
    @State private var cardImage: Image?
    @State private var cardUIImage: UIImage?
    @State private var toast: ShotIQToast?
    private var card: PlayerCardData {
        PlayerCardData.make(user: app.user,
                            latestAnalysis: app.recentMedia.first?.analysis,
                            hand: hand,
                            level: level,
                            heightIn: heightIn,
                            wingspanIn: wingspanIn)
    }
    private var sharePayload: ShotIQSharePayload {
        ShotIQSharePayload.simple(title: "SHARE CARD",
                                  headline: card.name,
                                  subheadline: card.subtitle,
                                  primaryValue: card.scoreText,
                                  primaryLabel: "FORM SCORE",
                                  secondaryValue: card.accuracyText,
                                  secondaryLabel: "MAKE %",
                                  accentLabel: card.scoreVerdict,
                                  metrics: [
                                    ShotIQShareMetric(value: card.shotsText, label: "Shots"),
                                    ShotIQShareMetric(value: card.makesText, label: "Makes"),
                                    ShotIQShareMetric(value: card.primaryTarget, label: "Primary target")
                                  ],
                                  shareText: "My ShotIQ player card: \(card.scoreText) form score, \(card.accuracyText) make rate.")
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-player-card") {
            VStack(spacing: 0) {
                HStack {
                    Spacer().frame(width: 52)
                    Spacer()
                    Wordmark(size: 30)
                    Spacer()
                    HStack(spacing: 18) {
                        NavigationLink {
                            EliteMatchView(presentation: app.recentMedia.first
                                .map { AnalysisResultPresentation(result: $0.analysis) })
                        } label: {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-training-goal",
                                                     size: 18,
                                                     label: nil)
                        }
                        .buttonStyle(.plain)
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening elite match",
                                          app.recentMedia.isEmpty ? "Analyze a shot to compare your own mechanics." : "Comparing your latest analysis.")
                        })
                        downloadControl {
                            Image(systemName: "arrow.down.to.line").font(.system(size: 17))
                        }
                    }
                    .foregroundStyle(ShotIQColor.ink)
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 18) {
                            RoundedRectangle(cornerRadius: 12).fill(ShotIQColor.rule)
                                .frame(width: 132, height: 150)
                                .overlay(Text(shotiqInitials(app.user))
                                    .shotiqBody(34, weight: .bold).foregroundStyle(ShotIQColor.graphite))
                            VStack(alignment: .leading, spacing: 4) {
                                Text(card.name.uppercased()).shotiqDisplay(36)
                                Text(card.subtitle).shotiqBody(14)
                                    .foregroundStyle(ShotIQColor.graphite)
                                HStack(spacing: 0) {
                                    HeaderStat(icon: "film", value: card.streakText, label: "DAY STREAK")
                                        .frame(maxWidth: .infinity)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                    HeaderStat(icon: "circle.hexagongrid", value: card.pointsText, label: "POINTS")
                                        .frame(maxWidth: .infinity)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                    HeaderStat(icon: "viewfinder", value: card.shotsText, label: "SHOTS TODAY")
                                        .frame(maxWidth: .infinity)
                                }
                                .padding(.top, 12)
                            }
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            // Five columns in ~319pt. Every text column here was
                            // compressible and the bar was not, so the copy took
                            // the hit: "Keep buildin g / consist ency." and
                            // "62.5 / %" on 048. Each column is pinned to its own
                            // intrinsic width now, the over-tracked SF caps label
                            // is on the canonical condensed face (~35pt narrower),
                            // and the score bar is the one elastic element.
                            HStack(alignment: .center, spacing: 16) {
                                Text("FORM SCORE").shotiqMicroCaps(12, weight: .semibold)
                                    .foregroundStyle(ShotIQColor.ink)
                                    .fixedSize(horizontal: true, vertical: false)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(card.scoreText).font(.custom("Tungsten-Medium", size: 58))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .lineLimit(1).fixedSize()
                                        .accessibilityIdentifier("player-card-score")
                                    ScoreBar(pct: card.scorePct).frame(maxWidth: 110)
                                }
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(card.scoreVerdict).font(.custom("Tungsten-Medium", size: 17))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                        .accessibilityIdentifier("player-card-verdict")
                                    Text(card.scoreCaption).shotiqBody(12)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(2).minimumScaleFactor(0.75)
                                        .accessibilityIdentifier("player-card-caption")
                                }
                                .frame(width: 88, alignment: .leading)
                                Spacer(minLength: 0)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 56)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(card.accuracyText).font(.custom("Tungsten-Medium", size: 26))
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1)
                                        .accessibilityIdentifier("player-card-accuracy")
                                    Text("MAKE %").shotiqMicroCaps()
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("\(card.makesText) / \(card.shotsText)").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1)
                                        .accessibilityIdentifier("player-card-makes-shots")
                                }
                                .fixedSize(horizontal: true, vertical: false)
                            }
                            .padding(16)
                        }
                        .padding(.top, 16)
                        HStack(alignment: .top, spacing: 0) {
                            archetypeCol("ARCHETYPE", "point.3.connected.trianglepath.dotted",
                                         card.archetypeTitle, card.archetypeCaption)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                            archetypeCol("PRIMARY TARGET", "figure.basketball",
                                         card.primaryTarget, card.primaryCaption)
                                .accessibilityIdentifier("player-card-target")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                            archetypeCol("LATEST BADGE", "hexagon",
                                         card.badgeTitle, card.badgeCaption)
                                .accessibilityIdentifier("player-card-source")
                        }
                        .padding(.vertical, 6)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        .padding(.top, 18)
                        SectionLabel(text: "MEASUREMENTS").padding(.top, 18)
                        HStack(spacing: 0) {
                            measureCol("HEIGHT", card.heightText, card.heightMetric)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 54)
                            measureCol("WINGSPAN", card.wingspanText, card.wingspanMetric)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 54)
                            measureCol("SHOOTING REACH", card.shootingReachText, card.shootingReachMetric)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 54)
                            measureCol("STANDING REACH", card.standingReachText, card.standingReachMetric)
                        }
                        .padding(.top, 8)
                        HStack(spacing: 6) {
                            SectionLabel(text: "SHOT BREAKDOWN")
                            Text("(TODAY)").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 18)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -9), alignment: .top)
                        HStack(spacing: 0) {
                            StatBlock(value: card.shotsText, label: "SHOTS", valueSize: ShotIQType.numeric)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .accessibilityElement(children: .combine)
                                .accessibilityIdentifier("player-card-shots")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                            StatBlock(value: card.makesText, label: "MAKES", valueSize: ShotIQType.numeric)
                                .frame(maxWidth: .infinity)
                                .accessibilityElement(children: .combine)
                                .accessibilityIdentifier("player-card-makes")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                            StatBlock(value: card.accuracyText, label: "MAKE %", valueSize: ShotIQType.numeric)
                                .frame(maxWidth: .infinity)
                                .accessibilityElement(children: .combine)
                                .accessibilityIdentifier("player-card-make-rate")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                            VStack(spacing: 3) {
                                TrendLine(points: [58, 66, 61, 70]).frame(width: 84, height: 24)
                                HStack(spacing: 3) {
                                    Text(card.trendText).shotiqBody(11, weight: .bold).foregroundStyle(ShotIQColor.confirmGreen)
                                        .accessibilityIdentifier("player-card-trend")
                                    Text(UITestHooks.demoData && app.recentMedia.isEmpty ? "vs last session" : "source coverage")
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                }
                                .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "MECHANICS OVERVIEW").padding(.top, 18)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -9), alignment: .top)
                        HStack(alignment: .top) {
                            ForEach(Array(card.phaseScores.enumerated()), id: \.offset) { _, phase in
                                phaseScore(phase.phase, phase.score, phase.tint, phase.active)
                            }
                        }
                        .padding(.top, 8)
                        HStack(spacing: 12) {
                            NavigationLink { CustomizePlayerCardView() } label: {
                                VStack(spacing: 8) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "viewfinder"),
                                                             size: 22,
                                                             label: nil)
                                    Text("Customize card").shotiqBody(14, weight: .semibold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 84)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            .buttonStyle(.plain)
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening card customizer")
                            })
                            .accessibilityIdentifier("Customize card")
                            ShotIQShareButton(payload: sharePayload) {
                                VStack(spacing: 8) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-share",
                                                             size: 22,
                                                             label: nil)
                                    Text("Share card").shotiqBody(14)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 84)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            downloadControl {
                                VStack(spacing: 8) {
                                    Image(systemName: "arrow.down.to.line").font(.system(size: 20))
                                    Text("Download card").shotiqBody(14)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 84)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                        }
                        .padding(.top, 18)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .onAppear { renderCard() }
        .shotiqToast($toast)
    }
    @ViewBuilder
    private func downloadControl<Label: View>(@ViewBuilder label: () -> Label) -> some View {
        Button { savePlayerCardToPhotos() } label: { label() }
            .buttonStyle(.plain)
    }
    @MainActor
    private func sharePlayerCard() {
        toast = .progress("Preparing card", "Rendering your ShotIQ player card.", progress: 0.55)
        if cardUIImage == nil { renderCard() }
        guard let image = cardUIImage else {
            toast = .error("Share failed", "ShotIQ could not render your player card.")
            return
        }
        toast = .success("Opening share sheet", "Your player card is ready.")
        ShotIQSharePresenter.share([image, "My ShotIQ player card: \(card.scoreText) form score."])
    }

    @MainActor
    private func savePlayerCardToPhotos() {
        toast = .progress("Saving card", "Rendering your ShotIQ player card.", progress: 0.35)
        if cardUIImage == nil { renderCard() }
        guard let image = cardUIImage else {
            toast = .error("Save failed", "ShotIQ could not render your player card.")
            return
        }
        Task {
            do {
                try await ShotIQPhotoSaver.savePNG(image, filename: "ShotIQ-player-card.png")
                await MainActor.run {
                    toast = .success("Saved to Photos", "Your ShotIQ player card is in your photo library.")
                }
            } catch {
                await MainActor.run {
                    toast = .error("Save failed", "Allow ShotIQ to add photos, then tap Download card again.")
                }
            }
        }
    }
    private func renderCard() {
        guard cardImage == nil else { return }
        let card = card
        if let ui = PlayerCardImageRenderer.render(name: card.name,
                                                   subtitle: card.subtitle,
                                                   scoreText: card.scoreText,
                                                   scorePct: card.scorePct,
                                                   scoreVerdict: card.scoreVerdict,
                                                   shotsText: card.shotsText,
                                                   makesText: card.makesText,
                                                   accuracyText: card.accuracyText) {
            cardImage = Image(uiImage: ui)
            cardUIImage = ui
        }
    }
    private func archetypeCol(_ label: String, _ icon: String, _ title: String, _ caption: String) -> some View {
        VStack(spacing: 8) {
            Text(label).shotiqBody(11, weight: .semibold).kerning(0.7)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 44)
                .foregroundStyle(ShotIQColor.ink)
                .frame(height: 44)
            Text(title).shotiqBody(14, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
                .lineLimit(2).minimumScaleFactor(0.7)
            Text(caption).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.center)
                .lineLimit(3).minimumScaleFactor(0.7)
        }
        .accessibilityElement(children: .combine)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14).padding(.horizontal, 6)
    }
    private func measureCol(_ label: String, _ value: String, _ metric: String) -> some View {
        VStack(spacing: 3) {
            Text(label).shotiqBody(10, weight: .medium).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(value).font(.custom("Tungsten-Medium", size: 30)).foregroundStyle(ShotIQColor.ink)
            Text(metric).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func phaseScore(_ phase: String, _ score: String, _ tint: Color, _ active: Bool) -> some View {
        VStack(spacing: 4) {
            PhasePhotoThumbnail(phase: ShotPhase(label: phase),
                                active: active,
                                width: 46,
                                height: 34,
                                cornerRadius: 5)
            Text(phase).shotiqBody(8, weight: active ? .bold : .regular).kerning(0.4)
                .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(score).font(.custom("Tungsten-Medium", size: 20)).foregroundStyle(tint)
            if active {
                Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 40, height: 3)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct CustomizePlayerCardView: View { // 049
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage("playerCardAccent") private var accent = "Orange"
    @AppStorage("playerCardJersey") private var jersey = 24
    @AppStorage("playerCardFirstName") private var firstName = "Jordan"
    @AppStorage("playerCardLastName") private var lastName = "Ellis"
    @AppStorage("profileHeightIn") private var heightIn = 75
    @AppStorage("profileWingspanIn") private var wingspanIn = 77
    @AppStorage("profileHand") private var hand = "right"
    @AppStorage("profileLevel") private var level = "advanced"
    @State private var savedImage: Image?
    @State private var showSaveSheet = false
    @State private var saveSheetTitle = "CARD SAVED"
    @State private var saveSheetMessage = "Your card was saved to Photos. You can also share it from here."
    @State private var layoutInfo: EliteInfoNote?
    @State private var layout = "Classic"
    @State private var showTrend = true
    @State private var toast: ShotIQToast?
    private let banners: [(String, Color)] = [
        ("Orange", ShotIQColor.shotiqOrange), ("Blue", ShotIQColor.analysisBlue),
        ("Green", ShotIQColor.confirmGreen), ("Red", ShotIQColor.reviewRed),
        ("Ink", ShotIQColor.graphite),
    ]
    private var bannerColor: Color {
        banners.first(where: { $0.0 == accent })?.1 ?? ShotIQColor.shotiqOrange
    }
    private var previewCard: PlayerCardData {
        PlayerCardData.make(user: app.user,
                            latestAnalysis: app.recentMedia.first?.analysis,
                            hand: hand,
                            level: level,
                            heightIn: heightIn,
                            wingspanIn: wingspanIn)
    }
    private var previewName: String {
        "\(firstName.trimmingCharacters(in: .whitespacesAndNewlines)) \(lastName.trimmingCharacters(in: .whitespacesAndNewlines))"
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    private var sharePayload: ShotIQSharePayload {
        let name = previewName.isEmpty ? previewCard.name : previewName
        return ShotIQSharePayload.simple(title: "SHARE CARD",
                                         headline: name,
                                         subheadline: previewCard.subtitle,
                                         primaryValue: previewCard.scoreText,
                                         primaryLabel: "FORM SCORE",
                                         secondaryValue: previewCard.accuracyText,
                                         secondaryLabel: "MAKE %",
                                         accentLabel: previewCard.scoreVerdict,
                                         metrics: [
                                            ShotIQShareMetric(value: previewCard.shotsText, label: "Shots"),
                                            ShotIQShareMetric(value: previewCard.makesText, label: "Makes"),
                                            ShotIQShareMetric(value: "\(previewCard.heightText) / \(previewCard.wingspanText)", label: "Height / wingspan")
                                         ],
                                         shareText: "My ShotIQ player card: \(previewCard.scoreText) form score, \(previewCard.accuracyText) make rate.")
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-customize-player-card") {
            VStack(spacing: 0) {
                HStack {
                    Button {
                        toast = .info("Returning to player card")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { dismiss() }
                    } label: {
                        Image(systemName: "chevron.left").font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                    Text("CUSTOMIZE PLAYER CARD").shotiqDisplay(20)
                    Spacer()
                    Button {
                        toast = .info("Customization cancelled")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { dismiss() }
                    } label: {
                        Text("Cancel").shotiqBody(15).foregroundStyle(ShotIQColor.shotiqOrange)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("LIVE PREVIEW").shotiqCondensed(14, weight: .heavy).kerning(0.5)
                            .foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 16)
                        // Live card preview
                        VStack(spacing: 0) {
                            HStack {
                                Text("SHOTIQ").shotiqCondensed(17, weight: .black)
                                Spacer()
                                Text("AI ANALYSIS").shotiqBody(12, weight: .semibold).kerning(3)
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 16).frame(height: 44)
                            .background(bannerColor)
                            VStack(alignment: .leading, spacing: 0) {
                                HStack(alignment: .top) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("\(firstName)\n\(lastName)".uppercased()).shotiqDisplay(34)
                                        Text(previewCard.subtitle.uppercased()).shotiqBody(11, weight: .medium).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                    HeaderStat(icon: "film", value: previewCard.streakText, label: "DAY STREAK")
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                    HeaderStat(icon: "circle.hexagongrid", value: previewCard.pointsText, label: "POINTS")
                                }
                                HStack(alignment: .top, spacing: 14) {
                                    // Canonical card frame — the pose overlay is already
                                    // burned into the crop.
                                    CanonicalPhoto("049-visual-001", height: 250, cornerRadius: 4)
                                        .frame(maxWidth: .infinity)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("FORM SCORE").shotiqBody(10, weight: .semibold).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text(previewCard.scoreText).font(.custom("Tungsten-Medium", size: 52))
                                            .foregroundStyle(bannerColor)
                                            .accessibilityIdentifier("customize-player-card-score")
                                        ScoreBar(pct: previewCard.scorePct, color: bannerColor).frame(width: 96)
                                        Text(previewCard.scoreVerdict).font(.custom("Tungsten-Medium", size: 16))
                                            .foregroundStyle(ShotIQColor.analysisBlue).padding(.top, 4)
                                            .accessibilityIdentifier("customize-player-card-verdict")
                                        Text(previewCard.primaryTarget).shotiqBody(11)
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(2).minimumScaleFactor(0.75)
                                            .accessibilityIdentifier("customize-player-card-target")
                                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.vertical, 8)
                                        HStack(spacing: 0) {
                                            StatBlock(value: previewCard.shotsText, label: "SHOTS", valueSize: ShotIQType.numeric)
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                                .accessibilityElement(children: .combine)
                                                .accessibilityIdentifier("customize-player-card-shots")
                                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 30)
                                            StatBlock(value: previewCard.makesText, label: "MAKES", valueSize: ShotIQType.numeric)
                                                .frame(maxWidth: .infinity, alignment: .trailing)
                                                .accessibilityElement(children: .combine)
                                                .accessibilityIdentifier("customize-player-card-makes")
                                        }
                                        StatBlock(value: previewCard.accuracyText, label: "ACCURACY", valueSize: ShotIQType.numeric)
                                            .padding(.top, 4)
                                            .accessibilityElement(children: .combine)
                                            .accessibilityIdentifier("customize-player-card-accuracy")
                                    }
                                    .frame(width: 130)
                                }
                                .padding(.top, 14)
                                PhaseStrip().padding(.top, 14)
                            }
                            .padding(14)
                        }
                        .background(ShotIQColor.paper)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
                        .padding(.top, 8)
                        Text("CUSTOMIZE DETAILS").shotiqCondensed(14, weight: .heavy).kerning(0.5)
                            .foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 20)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                HStack {
                                    detailLabel("BANNER COLOR", "Set the accent color for your card.")
                                    Spacer()
                                    HStack(spacing: 12) {
                                        ForEach(banners, id: \.0) { name, color in
                                            Button {
                                                accent = name
                                                toast = .success("Banner color set", name)
                                            } label: {
                                                Circle().fill(color).frame(width: 26, height: 26)
                                                    .overlay(Circle().stroke(accent == name ? color : .clear, lineWidth: 2)
                                                        .padding(-4))
                                            }
                                            .buttonStyle(.plain)
                                        }
                                    }
                                }
                                .padding(14)
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                HStack {
                                    detailLabel("JERSEY NUMBER", "Display your number on the card.")
                                    Spacer()
                                    HStack(spacing: 0) {
                                        Button {
                                            jersey = max(0, jersey - 1)
                                            toast = .success("Jersey number set", "#\(jersey)")
                                        } label: {
                                            Image(systemName: "minus").font(.system(size: 13)).frame(width: 40, height: 38)
                                        }
                                        .buttonStyle(.plain)
                                        Text("\(jersey)").font(.custom("Tungsten-Medium", size: 20))
                                            .frame(width: 40)
                                        Button {
                                            jersey += 1
                                            toast = .success("Jersey number set", "#\(jersey)")
                                        } label: {
                                            Image(systemName: "plus").font(.system(size: 13)).frame(width: 40, height: 38)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                    .foregroundStyle(ShotIQColor.ink)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .padding(14)
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                HStack {
                                    detailLabel("FIRST NAME", "Shown on your player card.")
                                    Spacer()
                                    TextField("First name", text: $firstName)
                                        .multilineTextAlignment(.center)
                                        .shotiqBody(15)
                                        .frame(width: 130, height: 40)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .padding(14)
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                HStack {
                                    detailLabel("LAST NAME", "Shown on your player card.")
                                    Spacer()
                                    TextField("Last name", text: $lastName)
                                        .multilineTextAlignment(.center)
                                        .shotiqBody(15)
                                        .frame(width: 130, height: 40)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .padding(14)
                            }
                        }
                        .padding(.top, 8)
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("CARD LAYOUT").shotiqCondensed(14, weight: .heavy).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("Your card layout is optimized for clarity and cannot be changed.")
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            Button {
                                layoutInfo = EliteInfoNote(title: "Card layout",
                                                           message: "ShotIQ cards use one fixed layout so every player card stays legible and instantly recognizable. Colors, names and jersey number are yours to customize.")
                                toast = .info("Showing card layout details")
                            } label: {
                                Image(systemName: "info.circle").font(.system(size: 16)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 18)
                        PrimaryButton(title: "Save card") { saveCard() }.padding(.top, 18)
                        Button {
                            toast = .info("Customization cancelled")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { dismiss() }
                        } label: {
                            Text("Cancel").shotiqBody(16).foregroundStyle(ShotIQColor.shotiqOrange)
                                .frame(maxWidth: .infinity).frame(height: 44)
                        }
                        .buttonStyle(.plain)
                        .padding(.top, 4)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .sheet(isPresented: $showSaveSheet) {
            VStack(spacing: 18) {
                Text(saveSheetTitle).shotiqDisplay(26).padding(.top, 24)
                Text(saveSheetMessage)
                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center)
                if let savedImage {
                    savedImage.resizable().scaledToFit()
                        .frame(maxHeight: 320)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
                    ShotIQShareButton(payload: sharePayload) {
                        HStack(spacing: 10) {
                            Image(systemName: "square.and.arrow.up")
                            Text("Save or share image").shotiqBody(17, weight: .medium)
                        }
                        .frame(maxWidth: .infinity).frame(height: 54)
                        .background(bannerColor, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                        .foregroundStyle(.white)
                    }
                }
                Spacer(minLength: 8)
            }
            .padding(.horizontal, 24)
            .presentationDetents([.medium, .large])
            .modifier(CanonicalTypeScale())
        }
        .eliteInfoAlert($layoutInfo)
        .shotiqToast($toast)
    }
    private func saveCard() {
        toast = .progress("Saving card", "Rendering your player card image.", progress: 0.7)
        if let ui = PlayerCardImageRenderer.render(name: previewName.isEmpty ? previewCard.name : previewName,
                                                   subtitle: previewCard.subtitle,
                                                   scoreText: previewCard.scoreText,
                                                   scorePct: previewCard.scorePct,
                                                   scoreVerdict: previewCard.scoreVerdict,
                                                   shotsText: previewCard.shotsText,
                                                   makesText: previewCard.makesText,
                                                   accuracyText: previewCard.accuracyText,
                                                   accent: bannerColor,
                                                   jersey: jersey) {
            savedImage = Image(uiImage: ui)
            Task {
                do {
                    try await ShotIQPhotoSaver.savePNG(ui, filename: "ShotIQ-custom-player-card.png")
                    await MainActor.run {
                        toast = .success("Saved to Photos", "Your customized player card is in your photo library.")
                        saveSheetTitle = "CARD SAVED"
                        saveSheetMessage = "Your card was saved to Photos. You can also share it from here."
                        showSaveSheet = true
                    }
                } catch {
                    await MainActor.run {
                        toast = .error("Save failed", "Allow ShotIQ to add photos, then tap Save card again.")
                        saveSheetTitle = "CARD READY"
                        saveSheetMessage = "The card image is ready to share. Photos access is needed before ShotIQ can save it."
                        showSaveSheet = true
                    }
                }
            }
        } else {
            toast = .error("Save failed", "ShotIQ could not render your player card.")
        }
    }
    private func detailLabel(_ title: String, _ caption: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title).shotiqCondensed(13, weight: .heavy).kerning(0.4)
                .foregroundStyle(ShotIQColor.ink)
            Text(caption).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
        }
    }
}

/// Small white-line pose overlay used inside the live card preview (049).
fileprivate struct SkeletonPreviewOverlay: View {
    var body: some View {
        Canvas { ctx, size in
            let pts: [CGPoint] = [
                .init(x: 0.45 * size.width, y: 0.88 * size.height),
                .init(x: 0.44 * size.width, y: 0.68 * size.height),
                .init(x: 0.5 * size.width, y: 0.5 * size.height),
                .init(x: 0.53 * size.width, y: 0.32 * size.height),
                .init(x: 0.62 * size.width, y: 0.22 * size.height),
                .init(x: 0.68 * size.width, y: 0.13 * size.height),
            ]
            var p = Path()
            p.move(to: pts[0])
            pts.dropFirst().forEach { p.addLine(to: $0) }
            ctx.stroke(p, with: .color(.white), style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
            for j in pts {
                ctx.stroke(Path(ellipseIn: CGRect(x: j.x - 4, y: j.y - 4, width: 8, height: 8)),
                           with: .color(ShotIQColor.shotiqOrange), lineWidth: 2)
            }
        }
        .accessibilityHidden(true)
    }
}

@MainActor
final class EliteViewModel: ObservableObject {
    @Published var shooters: [EliteShooterDTO] = []
    @Published var loading = true
    @Published var sourceNote: String?
    func load() async {
        defer { loading = false }
        // Test-only: one canned shooter so 052/053 have a row to open without
        // reaching /api/shooters.
        if UITestHooks.demoData {
            if UITestHooks.eliteShooterCatalog {
                shooters = [
                    EliteShooterDTO(id: 30, name: "Stephen Curry", team: "Golden State Warriors",
                                    league: "NBA", era: "2009-Present", tier: "Legendary",
                                    position: "PG", height: 75, weight: 185,
                                    careerPct: 43.0, careerFreeThrowPct: 91.0,
                                    careerFieldGoalPct: 47.1, careerThreePct: 43.0,
                                    careerEfgPct: 58.2, careerTsPct: 62.6,
                                    approvedFormImages: nil),
                    EliteShooterDTO(id: 1, name: "Klay Thompson", team: "Warriors",
                                    league: "NBA", era: "Modern", tier: "Elite",
                                    position: "SG", height: 78, weight: 215,
                                    careerPct: 41.3, careerFreeThrowPct: 85.3,
                                    careerFieldGoalPct: 45.7, careerThreePct: 41.3,
                                    careerEfgPct: 54.8, careerTsPct: 58.6,
                                    approvedFormImages: nil),
                    EliteShooterDTO(id: 31, name: "Steve Kerr", team: "Multiple Teams",
                                    league: "NBA", era: "1988-2003", tier: "Elite",
                                    position: "PG", height: 75, weight: 175,
                                    careerPct: 45.4, careerFreeThrowPct: 86.4,
                                    careerFieldGoalPct: 47.9, careerThreePct: 45.4,
                                    careerEfgPct: 60.5, careerTsPct: 62.0,
                                    approvedFormImages: nil),
                ]
                return
            }
            // Published career rates, 0-100, on the same scale /api/shooters
            // serves. This seed used to carry 0-1 fractions, which is the whole
            // reason 052/053 rendered "0.5%".
            shooters = [EliteShooterDTO(id: 1, name: "Klay Thompson", team: "Warriors",
                                        league: "NBA", era: "Modern", tier: "Elite",
                                        position: "SG", height: 78, weight: 215,
                                        careerPct: 41.3, careerFreeThrowPct: 85.3,
                                        careerFieldGoalPct: 45.7, careerThreePct: 41.3,
                                        careerEfgPct: 54.8, careerTsPct: 58.6,
                                        approvedFormImages: nil)]
            return
        }
        do {
            let remote = try await APIClient.shared.shooters()
            shooters = remote.isEmpty ? Self.fallbackShooters : remote
            sourceNote = remote.isEmpty ? "Showing built-in elite references." : nil
        } catch {
            shooters = Self.fallbackShooters
            sourceNote = "Using offline elite references until ShotIQ reconnects."
        }
    }

    nonisolated static var fallbackShooter: EliteShooterDTO {
        fallbackShooters.first ?? EliteShooterDTO(id: 30, name: "Stephen Curry", team: "Golden State Warriors",
                                                  league: "NBA", era: "2009-Present", tier: "Legendary",
                                                  position: "PG", height: 75, weight: 185,
                                                  careerPct: 43.0, careerFreeThrowPct: 91.0,
                                                  careerFieldGoalPct: 47.1, careerThreePct: 43.0,
                                                  careerEfgPct: 58.2, careerTsPct: 62.6,
                                                  approvedFormImages: nil)
    }

    nonisolated private static let fallbackShooters: [EliteShooterDTO] = [
        EliteShooterDTO(id: 30, name: "Stephen Curry", team: "Golden State Warriors",
                        league: "NBA", era: "2009-Present", tier: "Legendary",
                        position: "PG", height: 75, weight: 185,
                        careerPct: 43.0, careerFreeThrowPct: 91.0,
                        careerFieldGoalPct: 47.1, careerThreePct: 43.0,
                        careerEfgPct: 58.2, careerTsPct: 62.6,
                        approvedFormImages: nil),
        EliteShooterDTO(id: 1, name: "Klay Thompson", team: "Golden State Warriors",
                        league: "NBA", era: "2011-Present", tier: "Elite",
                        position: "SG", height: 78, weight: 215,
                        careerPct: 41.3, careerFreeThrowPct: 85.3,
                        careerFieldGoalPct: 45.7, careerThreePct: 41.3,
                        careerEfgPct: 54.8, careerTsPct: 58.6,
                        approvedFormImages: nil),
        EliteShooterDTO(id: 31, name: "Steve Kerr", team: "Chicago Bulls",
                        league: "NBA", era: "1988-2003", tier: "Elite",
                        position: "PG", height: 75, weight: 175,
                        careerPct: 45.4, careerFreeThrowPct: 86.4,
                        careerFieldGoalPct: 47.9, careerThreePct: 45.4,
                        careerEfgPct: 60.5, careerTsPct: 62.0,
                        approvedFormImages: nil),
        EliteShooterDTO(id: 32, name: "Ray Allen", team: "Milwaukee Bucks",
                        league: "NBA", era: "1996-2014", tier: "Elite",
                        position: "SG", height: 77, weight: 205,
                        careerPct: 40.0, careerFreeThrowPct: 89.4,
                        careerFieldGoalPct: 45.2, careerThreePct: 40.0,
                        careerEfgPct: 53.0, careerTsPct: 58.0,
                        approvedFormImages: nil),
    ]
}

struct EliteMatchView: View {       // 050
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage("profileHand") private var hand = "right"
    @AppStorage("profileLevel") private var level = "advanced"
    @AppStorage("profileHeightIn") private var heightIn = 75
    @AppStorage("profileWingspanIn") private var wingspanIn = 77
    @AppStorage("profileWeightLbs") private var weightLbs = 185
    @AppStorage(EliteComparisonSelection.shooterIDKey) private var selectedShooterID = 0
    @State private var showSettings = false
    @State private var showShooterPicker = false
    @State private var explainedMetric: EliteMatchMetricData?
    @State private var selectedFramePhaseIndex = 3
    @State private var showFrameCompare = false
    @State private var toast: ShotIQToast?
    @StateObject private var vm = EliteViewModel()
    var presentation: AnalysisResultPresentation? = nil
    private var selectedShooter: EliteShooterDTO? {
        EliteComparisonSelection.resolve(shooterID: selectedShooterID,
                                         explicit: nil,
                                         shooters: vm.shooters)
    }
    private var match: EliteMatchData {
        EliteMatchData.make(user: app.user,
                            shooter: selectedShooter,
                            presentation: presentation,
                            latestAnalysis: app.recentMedia.first?.analysis,
                            hand: hand,
                            level: level)
    }
    private var resolvedPresentation: AnalysisResultPresentation? {
        presentation ?? app.recentMedia.first.map { AnalysisResultPresentation(result: $0.analysis) }
    }
    private var eliteShooterForRows: EliteShooterDTO {
        selectedShooter ?? EliteViewModel.fallbackShooter
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-elite-match") {
            VStack(spacing: 0) {
                HStack(alignment: .center) {
                    Wordmark(size: 30)
                    Spacer()
                    HStack(alignment: .center, spacing: 14) {
                        HeaderStat(icon: "circle.hexagongrid",
                                   value: UITestHooks.demoData && presentation == nil && app.recentMedia.isEmpty ? "2,840" : "--",
                                   label: "POINTS")
                            .frame(width: 56, height: 52, alignment: .center)
                        Button {
                            toast = .info("Opening settings")
                            showSettings = true
                        } label: {
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "gearshape"),
                                                     size: 44)
                            .font(.system(size: 20))
                            .foregroundStyle(ShotIQColor.ink)
                            .frame(width: 56, height: 52, alignment: .center)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20).frame(height: 60)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 12) {
                            Button {
                                toast = .info("Returning to player card")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { dismiss() }
                            } label: {
                                Image(systemName: "arrow.left").font(.system(size: 20, weight: .semibold))
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .buttonStyle(.plain)
                            .padding(.top, 8)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("AI ANALYSIS 50 – ELITE MATCH").shotiqDisplay(32)
                                Text("Compare mechanics").shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            VStack(spacing: 12) {
                                HStack(alignment: .top, spacing: 10) {
                                    matchPlayerPanel(name: match.playerName,
                                                     subtitle: match.playerSubtitle,
                                                     photoKey: "038-visual-001",
                                                     accent: ShotIQColor.shotiqOrange)
                                    VStack(spacing: 6) {
                                        Text("ELITE MATCH").shotiqBody(12, weight: .bold).kerning(0.8)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text(match.similarity).font(.custom("Tungsten-Medium", size: 56))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                            .accessibilityIdentifier("elite-match-similarity")
                                        Text("OVERALL\nSIMILARITY").shotiqBody(10, weight: .medium).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .multilineTextAlignment(.center)
                                        HStack(spacing: 3) {
                                            ForEach(0..<6, id: \.self) { i in
                                                Rectangle().fill(i < matchedMechanicBars ? ShotIQColor.analysisBlue : ShotIQColor.rule)
                                                    .frame(width: 16, height: 6)
                                            }
                                        }
                                        Text("SHARED MECHANICS").shotiqBody(9, weight: .bold).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.ink).padding(.top, 2)
                                        Text(match.sharedMechanics).font(.custom("Tungsten-Medium", size: 18))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                            .accessibilityIdentifier("elite-match-shared-mechanics")
                                        positionChips(for: eliteShooterForRows.position)
                                            .padding(.top, 3)
                                    }
                                    .frame(width: 114)
                                    matchPlayerPanel(name: match.eliteName,
                                                     subtitle: match.eliteSubtitle,
                                                     photoKey: "050-visual-002",
                                                     accent: ShotIQColor.analysisBlue)
                                }
                                VStack(spacing: 0) {
                                    alignedComparisonRow("FORM SCORE", match.formScore, match.eliteScore)
                                        .accessibilityElement(children: .combine)
                                        .accessibilityIdentifier("elite-match-score")
                                    alignedComparisonRow("2PT %", userTwoPointText, eliteTwoPointText(eliteShooterForRows))
                                    alignedComparisonRow("3PT %", userThreePointText, shotiqPercentText(eliteShooterForRows.careerThreePct ?? eliteShooterForRows.careerPct))
                                    alignedComparisonRow("FREE THROW %", userFreeThrowText, shotiqPercentText(eliteShooterForRows.careerFreeThrowPct))
                                    alignedComparisonRow("SHOOTING HAND", hand.capitalized, "Right")
                                    alignedComparisonRow("POSITION", "SG", displayPosition(eliteShooterForRows.position))
                                    alignedComparisonRow("HEIGHT", inchesText(heightIn), inchesText(eliteShooterForRows.height))
                                    alignedComparisonRow("WEIGHT", "\(weightLbs) LB", "\(eliteShooterForRows.weight) LB")
                                    alignedComparisonRow("WINGSPAN", inchesText(wingspanIn), inchesText(eliteWingspan(eliteShooterForRows)))
                                        .accessibilityElement(children: .combine)
                                        .accessibilityIdentifier("elite-match-accuracy")
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 14)
                        if vm.loading && vm.shooters.isEmpty {
                            ProgressView().frame(maxWidth: .infinity).padding(.top, 8)
                        }
                        HStack(spacing: 12) {
                            if let top = selectedShooter {
                                NavigationLink { EliteShooterDetailView(shooter: top, rank: 1, catalog: vm.shooters) } label: {
                                    actionRow("Profile")
                                }
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening \(top.name)'s elite profile")
                                })
                            } else {
                                // Shooters still loading — browsing the list is the next-best destination.
                                NavigationLink { EliteShootersView() } label: {
                                    actionRow("Profile")
                                }
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening elite shooter list")
                                })
                            }
                            Button {
                                showShooterPicker = true
                                toast = .info("Choose elite shooter")
                            } label: {
                                actionRow("Change Shooter")
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 12)
                        HStack {
                            Text("MECHANICS COMPARISON").shotiqDisplay(20)
                            Spacer()
                            Text("Tap a metric")
                                .shotiqBody(11, weight: .semibold)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 22)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -11), alignment: .top)
                        ForEach(match.comparisonRows, id: \.name) { row in
                            mechanicComparisonRow(row)
                        }
                        HStack(alignment: .firstTextBaseline) {
                            Text("RELEASE FRAME MATCH").shotiqDisplay(20)
                            Spacer()
                            Text("User vs elite shot rail").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            Text(match.releaseAlignment).font(.custom("Tungsten-Medium", size: 16)).foregroundStyle(ShotIQColor.ink)
                                .accessibilityIdentifier("elite-match-release-alignment")
                            Text(match.releaseAlignment == "--" ? "NEEDS DATA" : "ACTIVE")
                                .shotiqBody(9, weight: .bold)
                                .kerning(0.5)
                                .foregroundStyle(match.releaseAlignment == "--" ? ShotIQColor.graphite : ShotIQColor.shotiqOrange)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 4)
                                .background((match.releaseAlignment == "--" ? ShotIQColor.rule : ShotIQColor.shotiqOrange).opacity(0.16),
                                            in: RoundedRectangle(cornerRadius: 4))
                        }
                        .padding(.top, 18)
                        releaseFrameComparison()
                        .accessibilityIdentifier("open-photo-comparison")
                        .padding(.top, 8)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(alignment: .top, spacing: 12) {
                                    VStack(alignment: .leading, spacing: 4) {
                                    Text("PRIMARY COACHING TARGET ALIGNMENT")
                                        .shotiqBody(11, weight: .semibold).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(match.target)
                                        .shotiqBody(17, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                        .accessibilityIdentifier("elite-match-target")
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 4) {
                                        Text(match.targetState)
                                            .shotiqBody(10, weight: .bold)
                                            .kerning(0.5)
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 5)
                                            .background(ShotIQColor.shotiqOrange.opacity(0.14),
                                                        in: RoundedRectangle(cornerRadius: 4))
                                        Text(match.targetMatch).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                            .accessibilityIdentifier("elite-match-target-match")
                                    }
                                }

                                VStack(alignment: .leading, spacing: 8) {
                                    Text("MATCH PLAN")
                                        .shotiqBody(11, weight: .bold)
                                        .kerning(0.7)
                                        .foregroundStyle(ShotIQColor.ink)
                                    ForEach(Array(matchPlanSteps.enumerated()), id: \.element) { index, step in
                                        matchPlanRow(index + 1, step)
                                    }
                                }
                                .padding(12)
                                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            }
                            .padding(14)
                        }
                        .padding(.top, 14)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
        .task { await vm.load() }
        .sheet(isPresented: $showShooterPicker) {
            EliteMatchShooterPicker(shooters: vm.shooters,
                                    selectedShooterID: selectedShooter?.id ?? selectedShooterID) { shooter in
                selectedShooterID = shooter.id
                toast = .success("Elite match updated", "Now comparing against \(shooter.name).")
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
        .sheet(item: $explainedMetric) { metric in
            EliteMetricExplanationSheet(metric: metric)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showFrameCompare) {
            EliteFrameCompareSheet(presentation: resolvedPresentation,
                                   phaseIndex: selectedFramePhaseIndex,
                                   phases: releasePhaseLabels,
                                   userFrameKeys: userFrameKeys,
                                   eliteFrameKeys: eliteFrameKeys)
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
        }
        .navigationDestination(isPresented: $showSettings) { SettingsHubView() }
    }
    private func matchPlayerPanel(name: String,
                                  subtitle: String,
                                  photoKey: String,
                                  accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(name.uppercased()).shotiqDisplay(18)
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(2)
                .minimumScaleFactor(0.72)
                .frame(height: 44, alignment: .topLeading)
            Text(subtitle)
                .shotiqBody(10)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            CanonicalPhoto(photoKey, width: 94, height: 82, cornerRadius: 6)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(accent, lineWidth: 2))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func alignedComparisonRow(_ label: String, _ you: String, _ elite: String) -> some View {
        HStack(spacing: 10) {
            Text(you)
                .font(.custom("Tungsten-Medium", size: 22))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .frame(width: 72, alignment: .leading)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(label)
                .shotiqBody(10, weight: .bold)
                .kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
                .frame(maxWidth: .infinity)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(elite)
                .font(.custom("Tungsten-Medium", size: 22))
                .foregroundStyle(ShotIQColor.analysisBlue)
                .frame(width: 72, alignment: .trailing)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .frame(height: 36)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
    }

    private var userTwoPointText: String {
        match.accuracy == "--" ? "--" : match.accuracy
    }

    private var userThreePointText: String { "--" }

    private var userFreeThrowText: String { "--" }

    private func eliteTwoPointText(_ shooter: EliteShooterDTO) -> String {
        shotiqPercentText(shooter.careerFieldGoalPct)
    }

    private func eliteWingspan(_ shooter: EliteShooterDTO) -> Int {
        max(shooter.height + 2, shooter.height)
    }

    private func inchesText(_ inches: Int) -> String {
        "\(inches / 12)'\(inches % 12)\""
    }

    private func mechanicComparisonRow(_ row: EliteMatchMetricData) -> some View {
        Button {
            explainedMetric = row
        } label: {
            HStack(alignment: .center, spacing: 12) {
                Text(row.you)
                    .font(.custom("Tungsten-Medium", size: 28))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .frame(width: 62, alignment: .leading)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                    .accessibilityIdentifier("elite-match-you-\(row.name)")

                VStack(spacing: 6) {
                    Text(row.name.uppercased())
                        .shotiqBody(11, weight: .bold)
                        .kerning(0.45)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.68)
                    Text(row.unit)
                        .shotiqBody(10)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                    comparisonMeter(row)
                    Text(metricShortReason(row))
                        .shotiqBody(9, weight: .semibold)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                .frame(maxWidth: .infinity)

                VStack(alignment: .trailing, spacing: 2) {
                    Text(row.elite)
                        .font(.custom("Tungsten-Medium", size: 28))
                        .foregroundStyle(ShotIQColor.analysisBlue)
                        .lineLimit(1)
                        .minimumScaleFactor(0.62)
                    Text("ELITE")
                        .shotiqBody(7, weight: .bold)
                        .kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite)
                }
                .frame(width: 70, alignment: .trailing)
            }
            .padding(.vertical, 12)
            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
        }
        .buttonStyle(.plain)
    }

    private func comparisonMeter(_ row: EliteMatchMetricData) -> some View {
        GeometryReader { geo in
            let center = geo.size.width * 0.5
            ZStack(alignment: .leading) {
                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                    .position(x: geo.size.width / 2, y: 8)
                Capsule().fill(ShotIQColor.shotiqOrange)
                    .frame(width: max(18, geo.size.width * 0.24), height: 4)
                    .position(x: center - geo.size.width * 0.14, y: 5)
                Capsule().fill(ShotIQColor.analysisBlue)
                    .frame(width: max(18, geo.size.width * 0.24), height: 4)
                    .position(x: center + geo.size.width * 0.14, y: 11)
                Rectangle().fill(ShotIQColor.ink)
                    .frame(width: 2, height: 18)
                    .position(x: geo.size.width * row.markerPct, y: 8)
            }
        }
        .frame(height: 18)
    }

    private func comparisonStatusPill(_ row: EliteMatchMetricData) -> some View {
        let hasData = row.you != "--" && row.elite != "--"
        let text = hasData ? (row.diff == "measured" ? "GAP" : row.diff.uppercased()) : "DATA"
        let tint = hasData ? ShotIQColor.shotiqOrange : ShotIQColor.graphite
        return Text(text)
            .shotiqBody(9, weight: .bold)
            .kerning(0.45)
            .foregroundStyle(tint)
            .lineLimit(1)
            .minimumScaleFactor(0.58)
            .padding(.horizontal, 7)
            .padding(.vertical, 5)
            .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 4))
    }

    private func releaseFrameComparison() -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Tap a phase to compare it closer")
                    .shotiqBody(11, weight: .semibold)
                    .foregroundStyle(ShotIQColor.graphite)
                Spacer()
                Button {
                    showFrameCompare = true
                } label: {
                    Text("OPEN VIEW")
                        .shotiqBody(9, weight: .bold)
                        .kerning(0.5)
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .overlay(RoundedRectangle(cornerRadius: 4).stroke(ShotIQColor.shotiqOrange, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }

            Button {
                showFrameCompare = true
            } label: {
                HStack(spacing: 8) {
                    comparePreviewPane(title: "YOU",
                                       tint: ShotIQColor.shotiqOrange,
                                       phase: releasePhaseLabels[selectedFramePhaseIndex],
                                       key: userFrameKeys[selectedFramePhaseIndex],
                                       elite: false)
                    VStack(spacing: 5) {
                        Text(releasePhaseLabels[selectedFramePhaseIndex] == "FOLLOW-THROUGH" ? "FOLLOW" : releasePhaseLabels[selectedFramePhaseIndex])
                            .shotiqBody(10, weight: .bold)
                            .kerning(0.5)
                            .foregroundStyle(ShotIQColor.ink)
                        Image(systemName: "plus.magnifyingglass")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Text("ZOOM")
                            .shotiqBody(7, weight: .bold)
                            .kerning(0.4)
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    .frame(width: 42)
                    comparePreviewPane(title: "ELITE",
                                       tint: ShotIQColor.analysisBlue,
                                       phase: releasePhaseLabels[selectedFramePhaseIndex],
                                       key: eliteFrameKeys[selectedFramePhaseIndex],
                                       elite: true)
                }
                .padding(8)
                .background(ShotIQColor.warmCanvas.opacity(0.65), in: RoundedRectangle(cornerRadius: 7))
            }
            .buttonStyle(.plain)

            phaseSelectorRail
        }
        .padding(10)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private var phaseSelectorRail: some View {
        HStack(spacing: 6) {
            ForEach(Array(releasePhaseLabels.enumerated()), id: \.offset) { index, phase in
                Button {
                    selectedFramePhaseIndex = index
                    showFrameCompare = true
                } label: {
                    VStack(spacing: 4) {
                        releaseFrameTile(key: userFrameKeys[index],
                                         phase: phase,
                                         index: index,
                                         elite: false,
                                         height: 48)
                            .opacity(index == selectedFramePhaseIndex ? 1 : 0.74)
                        Text(phase == "FOLLOW-THROUGH" ? "FOLLOW" : phase)
                            .shotiqBody(7, weight: .bold)
                            .kerning(0.25)
                            .foregroundStyle(index == selectedFramePhaseIndex ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                            .lineLimit(1)
                            .minimumScaleFactor(0.52)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func comparePreviewPane(title: String,
                                    tint: Color,
                                    phase: String,
                                    key: String,
                                    elite: Bool) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .shotiqBody(8, weight: .bold)
                .kerning(0.5)
                .foregroundStyle(tint)
            releaseFrameTile(key: key,
                             phase: phase,
                             index: selectedFramePhaseIndex,
                             elite: elite,
                             height: 118)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func frameRailRow(label: String, tint: Color, elite: Bool) -> some View {
        HStack(spacing: 8) {
            Text(label)
                .shotiqBody(9, weight: .bold)
                .kerning(0.5)
                .foregroundStyle(tint)
                .frame(width: 44, alignment: .leading)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
            ForEach(Array(releasePhaseLabels.enumerated()), id: \.offset) { index, phase in
                VStack(spacing: 4) {
                    releaseFrameTile(key: elite ? eliteFrameKeys[index] : userFrameKeys[index],
                                     phase: phase,
                                     index: index,
                                     elite: elite,
                                     height: 58)
                    Text(phase == "FOLLOW-THROUGH" ? "FOLLOW" : phase)
                        .shotiqBody(7, weight: .bold)
                        .kerning(0.3)
                        .foregroundStyle(index == 3 ? tint : ShotIQColor.graphite)
                        .lineLimit(1)
                        .minimumScaleFactor(0.55)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var releasePhaseLabels: [String] {
        ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    }

    private var userFrameKeys: [String] {
        ["047-visual-004", "047-visual-001", "047-visual-002", "051-visual-003", "047-visual-003"]
    }

    private var eliteFrameKeys: [String] {
        ["050-visual-002", "047-visual-001", "047-visual-002", "038-visual-001", "047-visual-003"]
    }

    private func releaseFrameTile(key: String, phase: String, index: Int, elite: Bool, height: CGFloat) -> some View {
        Group {
            if !elite, let resolvedPresentation {
                PhotoComparisonUserMediaSurface(presentation: resolvedPresentation,
                                                height: height,
                                                overlaySkeletons: true,
                                                phase: phase,
                                                showsPlaybackControl: false,
                                                showsPoseStatusPill: false)
            } else {
                CanonicalPhoto(key, height: height, cornerRadius: 4)
            }
        }
        .frame(maxWidth: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: 4))
        .overlay(RoundedRectangle(cornerRadius: 4)
            .stroke(index == 3 ? (elite ? ShotIQColor.analysisBlue : ShotIQColor.shotiqOrange) : ShotIQColor.rule.opacity(0.45),
                    lineWidth: index == 3 ? 2 : 1))
    }

    private var matchPlanSteps: [String] {
        let shooter = eliteShooterForRows.name
        let target = match.target.lowercased()
        return [
            "Match \(shooter)'s release window with 10 slow form reps focused on \(target).",
            "Run 3 sets of centerline holds: ball, elbow, wrist, and finish stay on one lane.",
            "Compare the release frame after each set and save the cleanest rep to history."
        ]
    }

    private func matchPlanRow(_ number: Int, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 9) {
            Text("\(number)")
                .shotiqBody(10, weight: .bold)
                .foregroundStyle(.white)
                .frame(width: 18, height: 18)
                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 4))
            Text(text)
                .shotiqBody(12)
                .foregroundStyle(ShotIQColor.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var matchedMechanicBars: Int {
        let parts = match.sharedMechanics.split(separator: " ")
        return Int(parts.first ?? "0") ?? 0
    }
    private func actionRow(_ title: String) -> some View {
        HStack {
            Text(title).shotiqBody(14)
                .lineLimit(1).minimumScaleFactor(0.7)
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
        }
        .foregroundStyle(ShotIQColor.ink)
        .padding(.horizontal, 12).frame(height: 50)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func positionChips(for position: String) -> some View {
        let choices = [("PG", "POINT_GUARD"), ("SG", "SHOOTING_GUARD"), ("SF", "SMALL_FORWARD"), ("F", "FORWARD"), ("C", "CENTER")]
        let normalized = position.uppercased()
        return HStack(spacing: 2) {
            ForEach(choices, id: \.0) { chip, key in
                Text(chip)
                    .shotiqBody(6, weight: .bold)
                    .foregroundStyle(normalized.contains(key) || normalized == chip ? .white : ShotIQColor.graphite)
                    .frame(width: 18, height: 13)
                    .background((normalized.contains(key) || normalized == chip ? ShotIQColor.analysisBlue : ShotIQColor.rule.opacity(0.65)),
                                in: RoundedRectangle(cornerRadius: 3))
            }
        }
    }

    private func displayPosition(_ position: String) -> String {
        switch position.uppercased() {
        case "POINT_GUARD", "PG": return "Point Guard"
        case "SHOOTING_GUARD", "SG": return "Shooting Guard"
        case "SMALL_FORWARD", "SF": return "Small Forward"
        case "POWER_FORWARD", "PF", "FORWARD", "F": return "Forward"
        case "CENTER", "C": return "Center"
        default: return position.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    private func metricShortReason(_ row: EliteMatchMetricData) -> String {
        switch row.name {
        case "Release Height": return "Higher window, harder to contest"
        case "Release Offset": return "Keeps ball path on target"
        case "Elbow Angle": return "Stacks power under the ball"
        case "Wrist Angle": return "Controls touch and backspin"
        case "Balance": return "Stable base repeats the same shot"
        case "Centerline": return "Keeps finish aimed at the rim"
        default: return "Tap for the coaching reason"
        }
    }
}

fileprivate struct EliteMetricExplanationSheet: View {
    var metric: EliteMatchMetricData
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(metric.name.uppercased()).shotiqDisplay(34)
                    Text(metric.unit).shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                }
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(ShotIQColor.ink)
                        .frame(width: 38, height: 38)
                        .background(ShotIQColor.rule.opacity(0.35), in: Circle())
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 12) {
                metricValueBlock("YOU", metric.you, ShotIQColor.shotiqOrange)
                metricValueBlock("ELITE", metric.elite, ShotIQColor.analysisBlue)
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("WHY IT MATTERS").shotiqBody(11, weight: .bold).kerning(0.7)
                    .foregroundStyle(ShotIQColor.graphite)
                Text(explanationText)
                    .shotiqBody(15)
                    .foregroundStyle(ShotIQColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(coachingCue)
                    .shotiqBody(15, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(12)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
            }

            Spacer()
            Button { dismiss() } label: {
                Text("DONE")
                    .shotiqBody(16, weight: .bold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
        }
        .padding(20)
        .background(ShotIQColor.paper)
    }

    private func metricValueBlock(_ label: String, _ value: String, _ tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).shotiqBody(10, weight: .bold).kerning(0.6).foregroundStyle(ShotIQColor.graphite)
            Text(value)
                .font(.custom("Tungsten-Medium", size: 38))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private var explanationText: String {
        switch metric.name {
        case "Release Height":
            return "Release height is the point where the ball leaves your hand. A higher, cleaner release gives the shot more room over defenders and creates a better entry angle."
        case "Release Offset":
            return "Release offset shows how far the ball path drifts left or right from your centerline. More drift means your hand has to correct the shot late, which creates misses and inconsistency."
        case "Elbow Angle":
            return "Elbow angle shows whether the forearm is stacked under the ball. When the elbow is too low or too open, power leaks sideways instead of going straight through the rim."
        case "Wrist Angle":
            return "Wrist angle controls the final touch. If the wrist finishes outside the target window, the ball can come off flat, pushed, or over-spun."
        case "Balance":
            return "Balance measures how stable your base is at release. A stable base lets the same shot repeat; drifting feet or shoulders changes the ball path."
        case "Centerline":
            return "Centerline shows whether the ball, elbow, wrist, and finish stay on the same lane to the rim. Big left or right movement makes the shot harder to repeat."
        default:
            return "This metric compares your saved analysis with the elite shooter so you can see what needs to move closer to the target window."
        }
    }

    private var coachingCue: String {
        switch metric.name {
        case "Release Height":
            return "Fix: finish tall, extend through the wrist, and hold the follow-through until the ball reaches the rim."
        case "Release Offset":
            return "Fix: start the ball on your shooting-side lane and freeze with elbow, wrist, and index finger pointed at the rim."
        case "Elbow Angle":
            return "Fix: lift the elbow under the ball before release, then shoot ten slow reps without letting it flare out."
        case "Wrist Angle":
            return "Fix: snap through the middle fingers and finish relaxed, not pushed."
        case "Balance":
            return "Fix: land where you jumped, keep shoulders quiet, and repeat the same base."
        case "Centerline":
            return "Fix: use centerline holds: ball, elbow, wrist, and finish stay stacked on one lane."
        default:
            return "Fix: compare the next saved rep and keep the metric moving toward the elite value."
        }
    }
}

fileprivate struct EliteFrameCompareSheet: View {
    var presentation: AnalysisResultPresentation?
    var phases: [String]
    var userFrameKeys: [String]
    var eliteFrameKeys: [String]
    @Environment(\.dismiss) private var dismiss
    @State private var selectedIndex: Int
    @State private var overlayMode = false
    @State private var zoom = 1.0

    init(presentation: AnalysisResultPresentation?,
         phaseIndex: Int,
         phases: [String],
         userFrameKeys: [String],
         eliteFrameKeys: [String]) {
        self.presentation = presentation
        self.phases = phases
        self.userFrameKeys = userFrameKeys
        self.eliteFrameKeys = eliteFrameKeys
        _selectedIndex = State(initialValue: min(max(phaseIndex, 0), max(phases.count - 1, 0)))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("COMPARE FRAMES").shotiqDisplay(34)
                    Text("Line up your shot with the elite shooter phase by phase.")
                        .shotiqBody(13)
                        .foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(ShotIQColor.ink)
                        .frame(width: 38, height: 38)
                        .background(ShotIQColor.rule.opacity(0.35), in: Circle())
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 6) {
                ForEach(Array(phases.enumerated()), id: \.offset) { index, phase in
                    Button {
                        selectedIndex = index
                    } label: {
                        Text(shortPhase(phase))
                            .shotiqBody(8, weight: .bold)
                            .kerning(0.35)
                            .foregroundStyle(index == selectedIndex ? .white : ShotIQColor.ink)
                            .frame(maxWidth: .infinity, minHeight: 32)
                            .background(index == selectedIndex ? ShotIQColor.shotiqOrange : ShotIQColor.warmCanvas,
                                        in: RoundedRectangle(cornerRadius: 5))
                    }
                    .buttonStyle(.plain)
                }
            }

            HStack(spacing: 8) {
                compareModeButton("SIDE BY SIDE", active: !overlayMode) { overlayMode = false }
                compareModeButton("OVERLAY", active: overlayMode) { overlayMode = true }
            }

            compareStage
                .frame(height: overlayMode ? 360 : 300)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("ZOOM").shotiqBody(9, weight: .bold).kerning(0.5).foregroundStyle(ShotIQColor.graphite)
                    Slider(value: $zoom, in: 1.0...1.8, step: 0.1)
                        .tint(ShotIQColor.shotiqOrange)
                }
                Text(phaseStory)
                    .shotiqBody(14)
                    .foregroundStyle(ShotIQColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(12)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
            }

            Button { dismiss() } label: {
                Text("DONE")
                    .shotiqBody(16, weight: .bold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
            Spacer(minLength: 0)
        }
        .padding(20)
        .background(ShotIQColor.paper)
    }

    @ViewBuilder private var compareStage: some View {
        if overlayMode {
            ZStack(alignment: .topLeading) {
                frameSurface(elite: true)
                    .opacity(0.72)
                    .overlay(alignment: .topLeading) { mediaTag("ELITE", ShotIQColor.analysisBlue) }
                frameSurface(elite: false)
                    .opacity(0.72)
                    .blendMode(.plusLighter)
                    .overlay(alignment: .topLeading) { mediaTag("YOU", ShotIQColor.shotiqOrange).offset(y: 28) }
                VStack {
                    Spacer()
                    HStack {
                        Text("Orange = you")
                            .shotiqBody(9, weight: .bold)
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Spacer()
                        Text("Blue = elite")
                            .shotiqBody(9, weight: .bold)
                            .foregroundStyle(ShotIQColor.analysisBlue)
                    }
                    .padding(8)
                    .background(.black.opacity(0.58), in: RoundedRectangle(cornerRadius: 5))
                    .padding(8)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange, lineWidth: 1))
        } else {
            HStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 6) {
                    mediaTag("YOU", ShotIQColor.shotiqOrange)
                    frameSurface(elite: false)
                }
                VStack(alignment: .leading, spacing: 6) {
                    mediaTag("ELITE", ShotIQColor.analysisBlue)
                    frameSurface(elite: true)
                }
            }
        }
    }

    private func frameSurface(elite: Bool) -> some View {
        Group {
            if elite {
                CanonicalPhoto(eliteFrameKeys[selectedIndex], height: overlayMode ? 360 : 266, cornerRadius: 8)
            } else if let presentation {
                PhotoComparisonUserMediaSurface(presentation: presentation,
                                                height: overlayMode ? 360 : 266,
                                                overlaySkeletons: true,
                                                phase: phases[selectedIndex],
                                                showsPlaybackControl: false,
                                                showsPoseStatusPill: false)
            } else {
                CanonicalPhoto(userFrameKeys[selectedIndex], height: overlayMode ? 360 : 266, cornerRadius: 8)
            }
        }
        .scaleEffect(CGFloat(zoom))
        .frame(maxWidth: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8)
            .stroke(elite ? ShotIQColor.analysisBlue : ShotIQColor.shotiqOrange, lineWidth: 2))
        .clipped()
    }

    private func compareModeButton(_ title: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .shotiqBody(9, weight: .bold)
                .kerning(0.45)
                .foregroundStyle(active ? .white : ShotIQColor.ink)
                .frame(maxWidth: .infinity, minHeight: 34)
                .background(active ? ShotIQColor.ink : ShotIQColor.paper,
                            in: RoundedRectangle(cornerRadius: 5))
                .overlay(RoundedRectangle(cornerRadius: 5).stroke(active ? ShotIQColor.ink : ShotIQColor.rule))
        }
        .buttonStyle(.plain)
    }

    private func mediaTag(_ text: String, _ tint: Color) -> some View {
        Text(text)
            .shotiqBody(8, weight: .bold)
            .kerning(0.5)
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(tint, in: RoundedRectangle(cornerRadius: 4))
            .padding(7)
    }

    private func shortPhase(_ phase: String) -> String {
        phase == "FOLLOW-THROUGH" ? "FOLLOW" : phase
    }

    private var phaseStory: String {
        switch phases[selectedIndex] {
        case "SETUP":
            return "Compare feet, hips, and ball pocket before the shot starts. A clean setup makes the rest of the motion easier to repeat."
        case "LOAD":
            return "Compare how the ball and knees load together. The elite frame should show balance, rhythm, and no extra drift before the rise."
        case "RISE":
            return "Compare how the body lifts into the shot. Look for the ball, elbow, and chest staying connected as power moves upward."
        case "RELEASE":
            return "Compare the exact release window. This is where elbow stack, release height, wrist finish, and centerline decide if the shot is clean."
        default:
            return "Compare the finish. The shooting hand should stay aimed at the rim and the body should land under control."
        }
    }
}

fileprivate struct EliteMatchShooterPicker: View {
    var shooters: [EliteShooterDTO]
    var selectedShooterID: Int
    var onSelect: (EliteShooterDTO) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("CHOOSE SHOOTER").shotiqDisplay(34)
                    Text("Update the elite match without leaving the comparison.")
                        .shotiqBody(13)
                        .foregroundStyle(ShotIQColor.graphite)
                }
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(ShotIQColor.ink)
                        .frame(width: 38, height: 38)
                        .background(ShotIQColor.rule.opacity(0.35), in: Circle())
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 12)

            if shooters.isEmpty {
                VStack(spacing: 10) {
                    ProgressView().tint(ShotIQColor.shotiqOrange)
                    Text("Loading elite shooters")
                        .shotiqBody(14, weight: .semibold)
                        .foregroundStyle(ShotIQColor.graphite)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(shooters) { shooter in
                            Button {
                                onSelect(shooter)
                                dismiss()
                            } label: {
                                HStack(spacing: 12) {
                                    Text("#\(rank(for: shooter))")
                                        .font(.custom("Tungsten-Medium", size: 28))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .frame(width: 42, alignment: .leading)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(shooter.name.uppercased())
                                            .shotiqDisplay(21)
                                            .foregroundStyle(ShotIQColor.ink)
                                            .lineLimit(1)
                                            .minimumScaleFactor(0.72)
                                        Text("\(shooter.team) • \(shooter.position) • \(shotiqPercentText(shooter.careerThreePct ?? shooter.careerPct)) 3PT")
                                            .shotiqBody(12)
                                            .foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(1)
                                            .minimumScaleFactor(0.7)
                                    }
                                    Spacer()
                                    Text(EliteShooterDetailData.tierLabel(shooter).uppercased())
                                        .shotiqBody(9, weight: .bold)
                                        .kerning(0.5)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 5)
                                        .background(ShotIQColor.analysisBlue.opacity(0.12),
                                                    in: RoundedRectangle(cornerRadius: 4))
                                    if shooter.id == selectedShooterID {
                                        Text("SELECTED")
                                            .shotiqBody(9, weight: .bold)
                                            .kerning(0.5)
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                    }
                                }
                                .padding(14)
                                .overlay(RoundedRectangle(cornerRadius: 8)
                                    .stroke(shooter.id == selectedShooterID ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                                            lineWidth: shooter.id == selectedShooterID ? 2 : 1))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)
                }
            }
        }
        .background(ShotIQColor.paper)
    }

    private func rank(for shooter: EliteShooterDTO) -> Int {
        (shooters.firstIndex { $0.id == shooter.id } ?? 0) + 1
    }
}

fileprivate struct PhotoComparisonMetricData {
    var icon: String
    var label: String
    var sub: String
    var you: String
    var diff: String
    var elite: String
}

fileprivate struct PhotoComparisonData {
    var score: String
    var scorePct: Double
    var shots: String
    var makes: String
    var accuracy: String
    var shareText: String
    var rows: [PhotoComparisonMetricData]
    var syncCopy: String

    static func make(presentation: AnalysisResultPresentation) -> PhotoComparisonData {
        if presentation.id == "canonical-demo" {
            return PhotoComparisonData(
                score: "82",
                scorePct: 0.82,
                shots: "24",
                makes: "15",
                accuracy: "62.5%",
                shareText: "Comparing my shot to an elite reference on ShotIQ - 82 vs 94 form score, release angle within 12 degrees.",
                rows: [
                    PhotoComparisonMetricData(icon: "point.3.connected.trianglepath.dotted", label: "ELBOW ANGLE", sub: "at release", you: "162°", diff: "12°", elite: "174°"),
                    PhotoComparisonMetricData(icon: "arrow.up.to.line", label: "RELEASE HEIGHT", sub: "from floor", you: "8' 11\"", diff: "+2\"", elite: "9' 1\""),
                    PhotoComparisonMetricData(icon: "arrow.left.and.right", label: "RELEASE DISTANCE", sub: "from forehead", you: "9.3\"", diff: "+0.7\"", elite: "10.0\""),
                    PhotoComparisonMetricData(icon: "point.bottomleft.forward.to.point.topright.scurvepath", label: "SHOT ARC", sub: "peak height", you: "74°", diff: "+6°", elite: "80°"),
                    PhotoComparisonMetricData(icon: "gauge.with.needle", label: "BALANCE", sub: "centered at release", you: "92%", diff: "+8%", elite: "100%"),
                ],
                syncCopy: "Release frames aligned - both shooters shown at RELEASE (within 2 degrees).")
        }
        return PhotoComparisonData(
            score: presentation.scoreText,
            scorePct: presentation.scorePct,
            shots: "--",
            makes: "--",
            accuracy: "--",
            shareText: presentation.shotBreakdownShareText,
            rows: [
                PhotoComparisonMetricData(icon: "point.3.connected.trianglepath.dotted", label: "ELBOW ANGLE", sub: "saved analysis", you: presentation.elbowAngleText, diff: diffText(presentation.elbowAngleText), elite: "165°"),
                PhotoComparisonMetricData(icon: "arrow.up.to.line", label: "RELEASE HEIGHT", sub: "saved analysis", you: presentation.releaseHeightText, diff: diffText(presentation.releaseHeightText), elite: "7'8\""),
                PhotoComparisonMetricData(icon: "angle", label: "RELEASE OFFSET", sub: "-5° to +5° target", you: presentation.releaseOffsetText, diff: diffText(presentation.releaseOffsetText), elite: "0°"),
                PhotoComparisonMetricData(icon: "point.bottomleft.forward.to.point.topright.scurvepath", label: "WRIST ANGLE", sub: "50°-100° target", you: presentation.wristAngleText, diff: diffText(presentation.wristAngleText), elite: "75°"),
                PhotoComparisonMetricData(icon: "viewfinder", label: "PHASE", sub: "detected phase", you: presentation.phaseText.uppercased(), diff: presentation.phaseText == "Unavailable" ? "--" : "matched", elite: "RELEASE"),
            ],
            syncCopy: "Release frames aligned - selected shot and elite reference shown at RELEASE.")
    }

    private static func diffText(_ value: String) -> String {
        value == "--" ? "--" : "measured"
    }
}

fileprivate struct PhotoComparisonUserMediaSurface: View {
    var presentation: AnalysisResultPresentation
    var height: CGFloat
    var overlaySkeletons: Bool
    var phase: String
    var showsPlaybackControl = true
    var showsPoseStatusPill = true

    var body: some View {
        ZStack {
            Group {
                if presentation.id == "canonical-demo" {
                    if showsPlaybackControl {
                        CanonicalMediaSurface(key: "051-visual-003", height: height, alignment: .trailing)
                    } else {
                        CanonicalPhoto("051-visual-003", height: height, cornerRadius: 4, alignment: .trailing)
                    }
                } else if let url = presentation.videoURL {
                    VideoPoseResultSurface(url: url,
                                           presentation: presentation,
                                           height: height,
                                           showSkeleton: true,
                                           showJoints: true,
                                           showBall: false,
                                           showAngles: false,
                                           phase: phase,
                                           showsPoseStatusPill: showsPoseStatusPill,
                                           showsPlaybackControl: showsPlaybackControl)
                } else if let url = presentation.mediaURL, url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
                    CapturedPoseImage(image: image,
                                      height: height,
                                      cornerRadius: 4,
                                      showsPose: true,
                                      showBones: true,
                                      showJoints: true,
                                      showAngles: overlaySkeletons,
                                      initialPose: presentation.detectedPose)
	                } else if let url = presentation.mediaURL {
	                    EliteRemotePoseImage(url: url,
	                                         height: height,
	                                         fallbackKey: "051-visual-003",
	                                         alignment: .trailing,
	                                         initialPose: presentation.detectedPose)
                } else {
                    placeholder("Analyze a shot first to compare your own form.")
                        .frame(height: height)
                }
            }
            if overlaySkeletons && presentation.id == "canonical-demo" {
                SkeletonOverlay(boneColor: ShotIQColor.analysisBlue,
                                jointColor: ShotIQColor.analysisBlue)
                    .opacity(0.75)
                    .offset(x: 5)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(mediaAccessibilityID)
        .accessibilityLabel(mediaAccessibilityLabel)
    }

    private func placeholder(_ text: String) -> some View {
        RoundedRectangle(cornerRadius: 4)
            .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
            .overlay {
                VStack(spacing: 8) {
                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "photo"), size: 44)
                    Text(text).shotiqBody(12, weight: .medium)
                }
                .foregroundStyle(.white.opacity(0.85))
                .multilineTextAlignment(.center)
                .padding(10)
            }
    }

    private var mediaAccessibilityID: String {
        guard presentation.id != "canonical-demo" else { return "photo-comparison-user-media" }
        return presentation.videoURL == nil && presentation.detectedPose == nil ? "photo-comparison-user-media" : "captured-pose-detected"
    }

    private var mediaAccessibilityLabel: String {
        guard presentation.id != "canonical-demo" else { return "Photo comparison user reference" }
        if presentation.videoURL != nil { return "Selected shot video with pose overlay" }
        return presentation.detectedPose == nil ? "Selected shot image" : "Shooter pose detected"
    }
}

struct PhotoComparisonView: View {  // 051
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage("profileHand") private var hand = "right"
    @AppStorage("profileLevel") private var level = "advanced"
    @AppStorage(EliteComparisonSelection.shooterIDKey) private var selectedShooterID = 0
    @State private var phaseIndex = 3
    @State private var overlaySkeletons = true
    @State private var savedComparison = false
    @State private var synced = false
    @State private var toast: ShotIQToast?
    @State private var routeAnalyze = false
    @StateObject private var vm = EliteViewModel()
    var presentation: AnalysisResultPresentation? = nil
    var shooter: EliteShooterDTO? = nil
    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    private var selectedShooter: EliteShooterDTO? {
        EliteComparisonSelection.resolve(shooterID: selectedShooterID,
                                         explicit: shooter,
                                         shooters: vm.shooters)
    }
    private var currentPresentation: AnalysisResultPresentation {
        let latest = app.recentMedia.first.map { AnalysisResultPresentation(result: $0.analysis) }
        guard let presentation else {
            return latest ?? (UITestHooks.demoData ? .canonicalDemo : .noResult)
        }
        if presentation.id == AnalysisResultPresentation.noResult.id {
            return latest ?? presentation
        }
        if presentation.id != "canonical-demo",
           presentation.mediaURL == nil,
           presentation.videoURL == nil,
           let latest {
            return latest
        }
        return presentation
    }
    private var hasAnalysisResult: Bool {
        currentPresentation.id != AnalysisResultPresentation.noResult.id
    }
    private var comparison: PhotoComparisonData {
        PhotoComparisonData.make(presentation: currentPresentation)
    }
    private var sharePayload: ShotIQSharePayload {
        ShotIQSharePayload.simple(title: "SHARE COMPARISON",
                                  headline: "\(playerName) VS \(eliteName)",
                                  subheadline: "ShotIQ elite form comparison",
                                  primaryValue: comparison.score,
                                  primaryLabel: "YOUR SCORE",
                                  secondaryValue: selectedShooter.map { "\(EliteShooterDetailData.wsiScore($0))" } ?? "94",
                                  secondaryLabel: "ELITE WSI",
                                  accentLabel: comparison.accuracy == "--" ? "COMPARE" : comparison.accuracy,
                                  metrics: comparison.rows.prefix(4).map {
                                    ShotIQShareMetric(value: "\($0.you) / \($0.elite)", label: $0.label)
                                  },
                                  shareText: comparison.shareText)
    }
    private var playerName: String {
        (app.user?.displayName ?? "Jordan Ellis").uppercased()
    }
    private var playerProfileLine: String {
        "You • \(hand.capitalized) • \(level.capitalized)"
    }
    private var eliteName: String {
        selectedShooter?.name.uppercased() ?? "ELITE REFERENCE"
    }
    private var eliteProfileLine: String {
        guard let shooter = selectedShooter else { return "Pro • Right • Elite" }
        return "\(shooter.team) • \(shooter.position)"
    }
    private var eliteScoreText: String {
        selectedShooter.map { "\(EliteShooterDetailData.wsiScore($0))" } ?? "94"
    }
    private var eliteScorePct: Double {
        selectedShooter.map { Double(EliteShooterDetailData.wsiScore($0)) / 100.0 } ?? 0.94
    }
    private var comparisonStoreID: String {
        "\(currentPresentation.id)::\(selectedShooter?.id.description ?? "elite-reference")"
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-comparison") {
            VStack(spacing: 0) {
                HStack {
                    Button {
                        toast = .info("Returning to elite match")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                    } label: {
                        Image(systemName: "chevron.left").font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                    Text("COMPARE SHOOTERS").shotiqDisplay(22)
                    Spacer()
                    if hasAnalysisResult {
                        ShotIQShareButton(payload: sharePayload) {
                            Image(systemName: "square.and.arrow.up").font(.system(size: 18)).foregroundStyle(ShotIQColor.ink)
                        }
                    } else {
                        Button {
                            routeToAnalysisForComparison()
                        } label: {
                            Image(systemName: "square.and.arrow.up").font(.system(size: 18)).foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Share comparison")
                    }
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 10) {
                            Circle().fill(ShotIQColor.rule).frame(width: 52, height: 52)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(playerName).shotiqDisplay(19)
                                    .lineLimit(1).minimumScaleFactor(0.65)
                                Text(playerProfileLine).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                                Text("FORM SCORE").shotiqBody(8, weight: .semibold).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                                // The compare columns are ~80pt wide. A rigid
                                // 58pt bar took its width first and left the
                                // score 16pt, so "82" wrapped to "8" over "2".
                                // The number is rigid now and the bar flexes.
                                HStack(spacing: 6) {
                                    Text(comparison.score).font(.custom("Tungsten-Medium", size: 24))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .lineLimit(1)
                                        .fixedSize(horizontal: true, vertical: false)
                                        .accessibilityIdentifier("photo-comparison-score")
                                    ScoreBar(pct: comparison.scorePct).frame(maxWidth: 58)
                                }
                            }
                            Spacer(minLength: 2)
                            Text("VS").shotiqBody(12, weight: .bold).foregroundStyle(ShotIQColor.graphite)
                                .frame(width: 34, height: 34)
                                .overlay(Circle().stroke(ShotIQColor.rule))
                                .padding(.top, 8)
                            Spacer(minLength: 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(eliteName).shotiqDisplay(19)
                                    .lineLimit(1).minimumScaleFactor(0.65)
                                    .accessibilityIdentifier("photo-comparison-elite-name")
                                Text(eliteProfileLine).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                                Text("FORM SCORE").shotiqBody(8, weight: .semibold).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                                HStack(spacing: 6) {
                                    Text(eliteScoreText).font(.custom("Tungsten-Medium", size: 24))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                        .lineLimit(1)
                                        .fixedSize(horizontal: true, vertical: false)
                                        .accessibilityIdentifier("photo-comparison-elite-score")
                                    ScoreBar(pct: eliteScorePct, color: ShotIQColor.analysisBlue)
                                        .frame(maxWidth: 58)
                                }
                            }
                            Circle().fill(ShotIQColor.rule).frame(width: 52, height: 52)
                        }
                        .padding(.top, 14)
                        HStack(spacing: 0) {
                            StatBlock(value: comparison.shots, label: "SHOTS", valueSize: ShotIQType.numeric)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .accessibilityIdentifier("photo-comparison-shots")
                                .accessibilityLabel("\(comparison.shots) shots")
                            StatBlock(value: comparison.makes, label: "MAKES", valueSize: ShotIQType.numeric)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .accessibilityIdentifier("photo-comparison-makes")
                                .accessibilityLabel("\(comparison.makes) makes")
                            StatBlock(value: comparison.accuracy, label: "ACCURACY", valueSize: ShotIQType.numeric)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .accessibilityIdentifier("photo-comparison-accuracy")
                                .accessibilityLabel("\(comparison.accuracy) accuracy")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                            StatBlock(value: "—", label: "SHOTS", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .center)
                            StatBlock(value: "—", label: "MAKES", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .center)
                            StatBlock(value: "—", label: "ACCURACY", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .trailing)
                        }
                        .padding(.top, 10)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -5), alignment: .top)
                        // Two equal panes. Each `CanonicalMediaSurface` now reports the
                        // width this row offers it (see CanonicalPhoto) instead of the
                        // width its crop's aspect ratio wanted at 330pt tall — which is
                        // what collapsed this row into one over-wide head crop with the
                        // elite pane shoved past the right edge. 272pt is the canonical
                        // pane height, and it keeps the 176x272 pane proportion.
                        HStack(spacing: 2) {
                            ZStack(alignment: .topLeading) {
                                PhotoComparisonUserMediaSurface(presentation: currentPresentation,
                                                                height: 272,
                                                                overlaySkeletons: overlaySkeletons,
                                                                phase: phases[phaseIndex])
                                mediaTag(ShotIQColor.shotiqOrange, overlaySkeletons ? "YOU + ELITE" : "YOU")
                            }
                            ZStack(alignment: .topLeading) {
                                CanonicalMediaSurface(key: eliteReferenceFrameKey(for: phases[phaseIndex]),
                                                      height: 272)
                                mediaTag(ShotIQColor.analysisBlue, "ELITE REFERENCE")
                            }
                        }
                        .padding(.top, 12)
                        if !hasAnalysisResult {
                            HStack(spacing: 10) {
                                NavigationLink { PhotoUploadSourceView() } label: {
                                    comparisonCaptureCTA("photo", "Upload image")
                                }
                                .buttonStyle(.plain)
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening image upload",
                                                  "Add a shot image so ShotIQ can compare your pose.")
                                })
                                NavigationLink { VideoUploadView() } label: {
                                    comparisonCaptureCTA("video", "Upload video")
                                }
                                .buttonStyle(.plain)
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening video upload",
                                                  "Add a shooting clip so ShotIQ can compare release frames.")
                                })
                            }
                            .padding(.top, 10)
                            .accessibilityIdentifier("photo-comparison-analysis-required-actions")
                        }
                        phaseRail.padding(.top, 14)
                        if synced && phaseIndex == 3 {
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill").font(.system(size: 13))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                Text(comparison.syncCopy)
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 8)
                        }
                        ForEach(comparison.rows, id: \.label) { row in
                            HStack(spacing: 8) {
                                ShotIQConceptGlyph(concept: row.label, fallback: row.icon, size: 28)
                                    .foregroundStyle(ShotIQColor.ink).frame(width: 28)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(row.label).shotiqBody(12, weight: .bold).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text(row.sub).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                }
                                .frame(width: 108, alignment: .leading)
                                Text(row.you).font(.custom("Tungsten-Medium", size: 26))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .frame(maxWidth: .infinity)
                                    .lineLimit(1).minimumScaleFactor(0.65)
                                    .accessibilityIdentifier("photo-comparison-you-\(row.label)")
                                VStack(spacing: 0) {
                                    Text(row.diff).font(.custom("Tungsten-Medium", size: 17)).foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.65)
                                    Text("DIFFERENCE").shotiqBody(7, weight: .medium).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(width: 62)
                                Text(row.elite).font(.custom("Tungsten-Medium", size: 26))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                    .frame(maxWidth: .infinity)
                                    .lineLimit(1).minimumScaleFactor(0.65)
                            }
                            .padding(.vertical, 11)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        }
                        HStack(spacing: 10) {
                            Button {
                                overlaySkeletons.toggle()
                                toast = .info(overlaySkeletons ? "Skeleton overlay on" : "Skeleton overlay off")
                            } label: {
                                smallAction("figure.2", "Overlay skeletons", active: overlaySkeletons)
                            }
                            .buttonStyle(.plain)
                            Button {
                                withAnimation(.easeInOut(duration: 0.15)) {
                                    phaseIndex = (phaseIndex + 1) % phases.count
                                    if phaseIndex != 3 { synced = false }
                                }
                                toast = .info("Phase changed", phases[phaseIndex].capitalized)
                            } label: {
                                smallAction("arrow.left.and.right", "Phase: \(phases[phaseIndex].capitalized)")
                            }
                            .buttonStyle(.plain)
                            Button {
                                guard hasAnalysisResult else {
                                    routeToAnalysisForComparison()
                                    return
                                }
                                savedComparison.toggle()
                                EliteStudyStore.set(savedComparison,
                                                    id: comparisonStoreID,
                                                    key: EliteStudyStore.comparisonsKey)
                                toast = savedComparison
                                    ? .success("Comparison saved", "Added to your study list.")
                                    : .info("Comparison removed", "Removed from your study list.")
                                Task {
                                    await APIClient.shared.send(
                                        "/api/settings", method: "PUT",
                                        body: ["eliteStudy": ["savedComparison": comparisonStoreID,
                                                             "state": savedComparison ? "saved" : "removed"]])
                                }
                            } label: {
                                smallAction(savedComparison ? "bookmark.fill" : "bookmark",
                                            savedComparison ? "Saved" : "Save comparison",
                                            active: savedComparison)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 14)
                        PrimaryButton(title: synced && phaseIndex == 3 ? "Release frames synced" : "Sync release frames",
                                      icon: synced && phaseIndex == 3 ? "checkmark" : "arrow.2.circlepath") {
                            guard hasAnalysisResult else {
                                routeToAnalysisForComparison()
                                return
                            }
                            withAnimation(.easeInOut(duration: 0.2)) {
                                phaseIndex = 3
                                synced = true
                            }
                            toast = .success("Release frames synced", "Both clips are aligned at release.")
                        }
                        .padding(.top, 12)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .onAppear {
            savedComparison = EliteStudyStore.contains(comparisonStoreID,
                                                       key: EliteStudyStore.comparisonsKey)
            if let shooter, selectedShooterID != shooter.id {
                selectedShooterID = shooter.id
            }
        }
        .task {
            guard shooter == nil else { return }
            await vm.load()
        }
        .shotiqToast($toast)
        .navigationDestination(isPresented: $routeAnalyze) {
            AnalyzeHubView()
        }
    }
    private func mediaTag(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).shotiqBody(11, weight: .bold).kerning(0.5).foregroundStyle(.white)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .padding(.horizontal, 10).padding(.vertical, 6)
        .background(.black.opacity(0.45), in: Capsule())
        .padding(8)
    }

    private var phaseRail: some View {
        AdaptivePhaseRail(active: phases[phaseIndex]) { phase in
            if let index = phases.firstIndex(of: phase) {
                withAnimation(.easeInOut(duration: 0.15)) {
                    phaseIndex = index
                    if phase != "RELEASE" { synced = false }
                }
                toast = .success("\(phase.capitalized) selected",
                                 hasAnalysisResult
                                 ? "Your media and the elite reference moved to this phase."
                                 : "Analyze a shot first to compare this phase.")
            }
        }
    }

    private func smallAction(_ icon: String, _ label: String, active: Bool = false) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 13))
            Text(label).shotiqBody(12)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
        .frame(maxWidth: .infinity).frame(height: 46)
        .overlay(RoundedRectangle(cornerRadius: 8)
            .stroke(active ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
    }
    private func comparisonCaptureCTA(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 7) {
            Image(systemName: icon).font(.system(size: 12, weight: .bold))
            Text(label).shotiqBody(12, weight: .bold)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 42)
        .foregroundStyle(ShotIQColor.ink)
        .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        .contentShape(Rectangle())
    }
    private func routeToAnalysisForComparison() {
        toast = .info("Analyze a shot first",
                      "Upload an image or video before saving, sharing, or syncing comparison frames.")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            routeAnalyze = true
        }
    }

    private func eliteReferenceFrameKey(for phase: String) -> String {
        switch phase {
        case "SETUP": return "041-visual-001"
        case "LOAD": return "042-frame-002"
        case "RISE": return "041-visual-003"
        case "RELEASE": return "051-visual-001"
        default: return "041-visual-004"
        }
    }
}

private enum EliteShooterDrawer: Identifiable {
    case level
    case position
    case shotType
    case league
    case sort
    case filters

    var id: String {
        switch self {
        case .level: return "level"
        case .position: return "position"
        case .shotType: return "shotType"
        case .league: return "league"
        case .sort: return "sort"
        case .filters: return "filters"
        }
    }

    var title: String {
        switch self {
        case .level: return "CHOOSE LEVEL"
        case .position: return "CHOOSE POSITION"
        case .shotType: return "CHOOSE SHOT TYPE"
        case .league: return "CHOOSE LEAGUE"
        case .sort: return "SORT SHOOTERS"
        case .filters: return "FILTER SHOOTERS"
        }
    }
}

fileprivate struct EliteShooterDetailRoute: Identifiable, Hashable {
    let shooter: EliteShooterDTO
    let rank: Int

    var id: Int { shooter.id }

    static func == (lhs: EliteShooterDetailRoute, rhs: EliteShooterDetailRoute) -> Bool {
        lhs.id == rhs.id && lhs.rank == rhs.rank
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
        hasher.combine(rank)
    }
}

fileprivate struct EliteShooterPoseOverlay: View {
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let joints = [
                CGPoint(x: 0.42, y: 0.94), CGPoint(x: 0.46, y: 0.74),
                CGPoint(x: 0.47, y: 0.56), CGPoint(x: 0.52, y: 0.37),
                CGPoint(x: 0.66, y: 0.28), CGPoint(x: 0.68, y: 0.15),
                CGPoint(x: 0.75, y: 0.12)
            ]
            ZStack {
                Path { path in
                    path.move(to: CGPoint(x: w * 0.29, y: h * 0.00))
                    path.addLine(to: CGPoint(x: w * 0.29, y: h * 1.00))
                }
                .stroke(.white.opacity(0.78), style: StrokeStyle(lineWidth: 1.2, dash: [6, 6]))

                Path { path in
                    path.move(to: CGPoint(x: w * 0.42, y: h * 0.94))
                    path.addLine(to: CGPoint(x: w * 0.46, y: h * 0.74))
                    path.addLine(to: CGPoint(x: w * 0.47, y: h * 0.56))
                    path.addLine(to: CGPoint(x: w * 0.52, y: h * 0.37))
                    path.addLine(to: CGPoint(x: w * 0.66, y: h * 0.28))
                    path.addLine(to: CGPoint(x: w * 0.68, y: h * 0.15))
                }
                .stroke(.white, style: StrokeStyle(lineWidth: 3.0, lineCap: .round, lineJoin: .round))

                Path { path in
                    path.move(to: CGPoint(x: w * 0.63, y: h * 0.36))
                    path.addLine(to: CGPoint(x: w * 0.70, y: h * 0.29))
                    path.addLine(to: CGPoint(x: w * 0.75, y: h * 0.15))
                }
                .stroke(ShotIQColor.shotiqOrange, style: StrokeStyle(lineWidth: 2.4, lineCap: .round, lineJoin: .round))

                Path { path in
                    path.move(to: CGPoint(x: w * 0.63, y: h * 0.14))
                    path.addCurve(to: CGPoint(x: w * 0.78, y: h * 0.52),
                                  control1: CGPoint(x: w * 0.82, y: h * 0.18),
                                  control2: CGPoint(x: w * 0.88, y: h * 0.35))
                }
                .stroke(ShotIQColor.shotiqOrange, style: StrokeStyle(lineWidth: 1.8, dash: [7, 6]))

                Path { path in
                    path.move(to: CGPoint(x: w * 0.28, y: h * 0.58))
                    path.addLine(to: CGPoint(x: w * 0.52, y: h * 0.58))
                }
                .stroke(.white.opacity(0.9), style: StrokeStyle(lineWidth: 1.2, dash: [6, 5]))

                ForEach(joints.indices, id: \.self) { index in
                    let point = joints[index]
                    Circle()
                        .fill(ShotIQColor.shotiqOrange)
                        .frame(width: 10, height: 10)
                        .overlay(Circle().stroke(.white, lineWidth: 2))
                        .position(x: point.x * w, y: point.y * h)
                }

                Text("159°")
                    .shotiqBody(11, weight: .black)
                    .foregroundStyle(.white)
                    .position(x: w * 0.42, y: h * 0.18)
                Text("50°")
                    .shotiqBody(11, weight: .black)
                    .foregroundStyle(Color(red: 0.98, green: 0.76, blue: 0.36))
                    .position(x: w * 0.80, y: h * 0.17)
                Text("-32°")
                    .shotiqBody(11, weight: .black)
                    .foregroundStyle(Color(red: 0.98, green: 0.76, blue: 0.36))
                    .position(x: w * 0.13, y: h * 0.44)
                Text("0°")
                    .shotiqBody(11, weight: .black)
                    .foregroundStyle(.white)
                    .position(x: w * 0.53, y: h * 0.56)
            }
        }
        .allowsHitTesting(false)
    }
}

fileprivate struct EliteDarkContourTexture: View {
    var body: some View {
        GeometryReader { geo in
            Canvas { ctx, size in
                for i in 0..<7 {
                    var path = Path()
                    let inset = CGFloat(i) * 13
                    path.addRoundedRect(in: CGRect(x: inset - 28,
                                                   y: inset - 22,
                                                   width: size.width - inset * 0.9 + 42,
                                                   height: size.height - inset * 1.1 + 36),
                                        cornerSize: CGSize(width: 28, height: 28))
                    ctx.stroke(path, with: .color(.white.opacity(0.08)), lineWidth: 0.7)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
    }
}

fileprivate struct EliteFilmPerforation: View {
    var body: some View {
        VStack {
            HStack(spacing: 5) {
                ForEach(0..<9, id: \.self) { _ in
                    RoundedRectangle(cornerRadius: 1.5)
                        .fill(.black.opacity(0.72))
                        .frame(width: 5, height: 5)
                }
            }
            Spacer()
            HStack(spacing: 5) {
                ForEach(0..<9, id: \.self) { _ in
                    RoundedRectangle(cornerRadius: 1.5)
                        .fill(.black.opacity(0.72))
                        .frame(width: 5, height: 5)
                }
            }
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 3)
        .allowsHitTesting(false)
    }
}

struct EliteShootersView: View {    // 052
    /// Canonical list-row crops, in the top-to-bottom order they appear on the
    /// 853x1844 render. The fifth row is cut off there, so it has no crop.
    private static let cardPhotoKeys = [
        "052-visual-001", "052-visual-002", "052-visual-004", "052-visual-003",
    ]
    @StateObject private var vm = EliteViewModel()
    @State private var query = ""
    @State private var level = "All Levels"
    @State private var position = "All Positions"
    @State private var shotType = "All Shot Types"
    @State private var league = "More Filters"
    @State private var sortKey = "WSI"
    @State private var activeDrawer: EliteShooterDrawer?
    @State private var info: EliteInfoNote?
    @State private var detailRoute: EliteShooterDetailRoute?
    @State private var activePhaseByShooter: [Int: String] = [:]
    @AppStorage("profileHeightIn") private var heightIn = 75
    @AppStorage("profileWingspanIn") private var wingspanIn = 77
    @AppStorage("profileWeightLbs") private var weightLbs = 185
    @AppStorage("profileHand") private var hand = "right"
    @AppStorage("profileLevel") private var playerLevel = "advanced"
    @AppStorage(EliteComparisonSelection.shooterIDKey) private var selectedShooterID = 0
    private var levelOptions: [String] {
        ["All Levels"] + Array(Set(vm.shooters.compactMap { $0.tier })).sorted()
    }
    private var positionOptions: [String] {
        ["All Positions"] + Array(Set(vm.shooters.map { $0.position })).sorted()
    }
    private var leagueOptions: [String] {
        ["More Filters"] + Array(Set(vm.shooters.map { $0.league })).sorted()
    }
    var filtered: [EliteShooterDTO] {
        var out = vm.shooters
        if !query.isEmpty { out = out.filter { $0.name.localizedCaseInsensitiveContains(query) } }
        if level != "All Levels" { out = out.filter { $0.tier == level } }
        if position != "All Positions" { out = out.filter { $0.position == position } }
        if league != "More Filters" { out = out.filter { $0.league == league } }
        switch sortKey {
        case "WSI": out.sort { EliteShooterDetailData.wsiScore($0) > EliteShooterDetailData.wsiScore($1) }
        case "FG%": out.sort { ($0.careerFieldGoalPct ?? 0) > ($1.careerFieldGoalPct ?? 0) }
        case "Name": out.sort { $0.name < $1.name }
        default: break
        }
        return out
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-elite-shooters") {
            VStack(spacing: 0) {
                EliteTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("ELITE SHOOTERS").shotiqDisplay(40).padding(.top, 18)
                        Text("Study the world's best. Compare forms. Elevate your game.")
                            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                        HStack(spacing: 12) {
                            HStack(spacing: 10) {
                                Image(systemName: "magnifyingglass").font(.system(size: 16))
                                    .foregroundStyle(ShotIQColor.graphite)
                                TextField("Search elite shooters...", text: $query)
                                    .shotiqBody(15)
                            }
                            .padding(.horizontal, 14).frame(height: 50)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            Button {
                                activeDrawer = .filters
                            } label: {
                                HStack(spacing: 8) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-settings",
                                                             size: 16,
                                                             label: nil)
                                    Text("Filter").shotiqBody(14)
                                }
                                .foregroundStyle(filterSummary == "All filters" ? ShotIQColor.ink : ShotIQColor.shotiqOrange)
                                .padding(.horizontal, 14).frame(height: 50)
                                .overlay(RoundedRectangle(cornerRadius: 8)
                                    .stroke(filterSummary == "All filters" ? ShotIQColor.rule : ShotIQColor.shotiqOrange))
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 14)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                filterChip(level, defaultLabel: "All Levels") { activeDrawer = .level }
                                filterChip(position, defaultLabel: "All Positions") { activeDrawer = .position }
                                filterChip(shotType, defaultLabel: "All Shot Types") { activeDrawer = .shotType }
                                filterChip(league, defaultLabel: "More Filters") { activeDrawer = .league }
                            }
                        }
                        .padding(.top, 10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .clipped()
                        HStack {
                            Button {
                                activeDrawer = .sort
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "arrow.up.arrow.down").font(.system(size: 14))
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text("Sort: \(sortKey)").shotiqBody(14, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    Image(systemName: "chevron.down").font(.system(size: 10, weight: .semibold))
                                        .foregroundStyle(ShotIQColor.ink)
                                }
                            }
                            .buttonStyle(.plain)
                            Spacer()
	                            Button {
	                                info = EliteInfoNote(title: "What is WSI?",
	                                                     message: "The Weighted Shooting Index blends career shooting efficiency, mechanics quality and consistency into a single 0–100 score so shooters across eras and leagues can be ranked side by side.")
	                            } label: {
                                HStack(spacing: 5) {
                                    Text("What is WSI?").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                    Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 14)
                        if vm.loading && vm.shooters.isEmpty {
                            ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                        }
                        if !vm.loading && filtered.isEmpty {
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text(query.isEmpty ? "NO ELITE SHOOTERS FOUND" : "NO MATCHES")
                                        .shotiqDisplay(22)
                                    Text(query.isEmpty
                                         ? "ShotIQ could not match the current filter set."
                                         : "No elite shooter matches \"\(query)\" with these filters.")
                                        .shotiqBody(13)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Button {
                                        query = ""
                                        level = "All Levels"
                                        position = "All Positions"
                                        shotType = "All Shot Types"
                                        league = "More Filters"
                                    } label: {
                                        HStack(spacing: 8) {
                                            Image(systemName: "arrow.counterclockwise")
                                            Text("Reset filters").shotiqBody(14, weight: .semibold)
                                        }
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 14)
                                        .frame(height: 44)
                                        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                                    }
                                    .buttonStyle(.plain)
                                }
                                .padding(14)
                            }
                            .padding(.top, 14)
                        }
                        ForEach(Array(filtered.enumerated()), id: \.element.id) { i, s in
                            shooterCard(s, rank: i)
                                .accessibilityIdentifier("elite-shooter-row-\(s.id)")
                                .padding(.top, 12)
                        }
                        HStack(spacing: 12) {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-training-goal",
                                                     size: 26,
                                                     label: nil)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Compare your form to any elite shooter.")
                                    .shotiqBody(14, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                                Text("Upload a shot to see your Form Similarity.")
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            Spacer()
	                            NavigationLink { AnalyzeHubView() } label: {
                                HStack(spacing: 7) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "viewfinder"),
                                                             size: 14,
                                                             label: nil)
                                    Text("Analyze shot").shotiqBody(13, weight: .semibold)
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 14).padding(.vertical, 11)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
	                            }
	                        }
                        .padding(12)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 14)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .task {
            await vm.load()
        }
        .eliteInfoAlert($info)
        .navigationDestination(item: $detailRoute) { route in
            EliteShooterDetailView(shooter: route.shooter, rank: route.rank, catalog: vm.shooters)
        }
        .sheet(item: $activeDrawer) { drawer in
            drawerView(for: drawer)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.hidden)
        }
    }
    private var filterSummary: String {
        let active = [level, position, shotType, league].filter {
            !["All Levels", "All Positions", "All Shot Types", "More Filters"].contains($0)
        }
        return active.isEmpty ? "All filters" : "\(active.count) active"
    }

    @ViewBuilder private func drawerView(for drawer: EliteShooterDrawer) -> some View {
        switch drawer {
        case .level:
            EliteSelectorDrawer(title: drawer.title,
                                subtitle: "Match shooters by development level.",
                                options: levelOptions,
                                selection: $level,
                                detailFor: optionDetail(for:))
        case .position:
            EliteSelectorDrawer(title: drawer.title,
                                subtitle: "Narrow the ranking by position.",
                                options: positionOptions,
                                selection: $position,
                                detailFor: optionDetail(for:))
        case .shotType:
            EliteSelectorDrawer(title: drawer.title,
                                subtitle: "Choose the shot context you want to study.",
                                options: ["All Shot Types", "Catch & Shoot", "Pull-Up", "Off Dribble"],
                                selection: $shotType,
                                detailFor: optionDetail(for:))
        case .league:
            EliteSelectorDrawer(title: drawer.title,
                                subtitle: "Compare against a league or full catalog.",
                                options: leagueOptions,
                                selection: $league,
                                detailFor: optionDetail(for:))
        case .sort:
            EliteSelectorDrawer(title: drawer.title,
                                subtitle: "Rank the list by the metric that matters now.",
                                options: ["WSI", "FG%", "Name"],
                                selection: $sortKey,
                                detailFor: optionDetail(for:))
        case .filters:
            EliteFiltersDrawer(level: $level,
                               position: $position,
                               shotType: $shotType,
                               league: $league,
                               levelOptions: levelOptions,
                               positionOptions: positionOptions,
                               leagueOptions: leagueOptions,
                               visibleCount: filtered.count)
        }
    }

    private func optionDetail(for option: String) -> String {
        switch option {
        case "WSI": return "Weighted Shooting Index ranking"
        case "FG%": return "Career field goal percentage"
        case "Name": return "Alphabetical shooter list"
        case "All Levels", "All Positions", "All Shot Types", "More Filters":
            return "Show the full shooter catalog"
        case "Catch & Shoot", "Pull-Up", "Off Dribble":
            return "Focus the phase and comparison context"
        default:
            return "\(countForOption(option)) shooter\(countForOption(option) == 1 ? "" : "s")"
        }
    }

    private func countForOption(_ option: String) -> Int {
        if levelOptions.contains(option), option != "All Levels" {
            return vm.shooters.filter { $0.tier == option }.count
        }
        if positionOptions.contains(option), option != "All Positions" {
            return vm.shooters.filter { $0.position == option }.count
        }
        if leagueOptions.contains(option), option != "More Filters" {
            return vm.shooters.filter { $0.league == option }.count
        }
        return vm.shooters.count
    }

    private func filterChip(_ label: String, defaultLabel: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(label).shotiqBody(12)
                    .foregroundStyle(label == defaultLabel ? ShotIQColor.ink : ShotIQColor.shotiqOrange)
                    .lineLimit(1).minimumScaleFactor(0.6)
                Image(systemName: "chevron.down").font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(ShotIQColor.graphite)
            }
            .padding(.horizontal, 12).frame(height: 42)
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(label == defaultLabel ? ShotIQColor.rule : ShotIQColor.shotiqOrange))
        }
        .buttonStyle(.plain)
    }
    private func shooterCard(_ s: EliteShooterDTO, rank: Int) -> some View {
        let detail = EliteShooterDetailData.make(shooter: s)
        let rankNumber = rank + 1
        let fit = profileMatchScore(for: s)
        let releaseValue = detail.mechanics.indices.contains(2) ? detail.mechanics[2].value : "--"
        let elbowValue = detail.mechanics.indices.contains(0) ? detail.mechanics[0].value : "--"
        let activePhase = activePhaseByShooter[s.id] ?? "RELEASE"
        return ShotIQCard {
            GeometryReader { geo in
                let width = geo.size.width
                let compact = width < 380
                let topHeight: CGFloat = compact ? 402 : 430
                VStack(spacing: 10) {
                    HStack(alignment: .top, spacing: 8) {
                        eliteShooterImagePanel(phase: activePhase,
                                               height: topHeight,
                                               width: width * 0.43)
                        VStack(spacing: 8) {
                            eliteIdentityTile(shooter: s, rank: rankNumber)
                                .frame(height: compact ? 100 : 112)
                            eliteMetricsTile(wsi: EliteShooterDetailData.wsiScore(s),
                                             threePct: s.careerThreePct ?? s.careerPct,
                                             fit: fit)
                                .frame(height: compact ? 140 : 154)
                            eliteComparisonTile(shooter: s,
                                                elbow: elbowValue,
                                                release: releaseValue)
                                .frame(height: compact ? 144 : 154)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedShooterID = s.id
                        detailRoute = EliteShooterDetailRoute(shooter: s, rank: rankNumber)
                    }
                    elitePhaseFilmstrip(activePhase: activePhase, shooterID: s.id, rank: rank)
                        .frame(height: compact ? 104 : 118)
                }
                .padding(8)
            }
            .frame(height: UIScreen.main.bounds.width < 600 ? 542 : 578)
        }
        .overlay(RoundedRectangle(cornerRadius: 12)
            .stroke(ShotIQColor.shotiqOrange, lineWidth: 1.4))
    }

    private func eliteShooterImagePanel(phase: String, height: CGFloat, width: CGFloat) -> some View {
        ZStack {
            CanonicalPhoto(elitePhasePhotoKey(phase),
                           width: width,
                           height: height,
                           cornerRadius: 9,
                           contentMode: .fill,
                           alignment: .top)
            EliteShooterPoseOverlay()
        }
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: 9))
    }

    private func eliteIdentityTile(shooter: EliteShooterDTO, rank: Int) -> some View {
        HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 3) {
                Text(shooter.name.uppercased())
                    .shotiqDisplay(30)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(2)
                    .minimumScaleFactor(0.45)
                    .accessibilityIdentifier("elite-card-name-\(shooter.id)")
                HStack(spacing: 4) {
                    Text("RIGHT-HANDED")
                    Circle().fill(ShotIQColor.shotiqOrange).frame(width: 3, height: 3)
                    Text(shortPosition(shooter.position).uppercased())
                }
                .shotiqBody(8.5, weight: .black)
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.48)
                Text(shooter.team.uppercased())
                    .shotiqBody(10, weight: .bold)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                Text(shooter.league.uppercased())
                    .shotiqBody(10, weight: .bold)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1)
            }
            .padding(.leading, 9)
            .padding(.trailing, 6)
            .frame(maxWidth: .infinity, alignment: .leading)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1)
            VStack(spacing: 1) {
                Text("RANK")
                    .shotiqMicroCaps()
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                Text("\(rank)")
                    .font(.custom("Tungsten-Medium", size: 60))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 28, height: 2)
            }
            .frame(width: 52)
        }
        .background(Color.white, in: RoundedRectangle(cornerRadius: 9))
        .overlay(RoundedRectangle(cornerRadius: 9).stroke(ShotIQColor.rule))
        .accessibilityLabel("\(shooter.name) rank \(rank)")
    }

    private func eliteMetricsTile(wsi: Int, threePct: Double?, fit: Int) -> some View {
        let three = Int(round(threePct ?? 33))
        return VStack(spacing: 7) {
            HStack(spacing: 0) {
                eliteDarkMetric(label: "WSI", value: "\(wsi)", color: .white, size: 66)
                Rectangle().fill(.white.opacity(0.58)).frame(width: 1, height: 62)
                eliteDarkMetric(label: "3P%", value: "\(three)%", color: ShotIQColor.shotiqOrange, size: 56)
            }
            Rectangle().fill(.white.opacity(0.68)).frame(height: 1)
            HStack(alignment: .lastTextBaseline, spacing: 6) {
                Text("\(fit)%")
                    .font(.custom("Tungsten-Medium", size: 68))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)
                Text("FIT")
                    .font(.custom("Tungsten-Medium", size: 48))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)
            }
            .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 10)
        .background {
            ZStack {
                LinearGradient(colors: [Color(red: 0.02, green: 0.05, blue: 0.08),
                                        Color(red: 0.03, green: 0.08, blue: 0.12)],
                               startPoint: .topLeading,
                               endPoint: .bottomTrailing)
                EliteDarkContourTexture().opacity(0.35)
            }
            .clipShape(RoundedRectangle(cornerRadius: 9))
        }
        .accessibilityLabel("WSI \(wsi), three point percentage \(three) percent, fit score \(fit) percent")
    }

    private func eliteDarkMetric(label: String, value: String, color: Color, size: CGFloat) -> some View {
        VStack(spacing: 0) {
            Text(label)
                .shotiqMicroCaps()
                .foregroundStyle(.white)
            Text(value)
                .font(.custom("Tungsten-Medium", size: size))
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.48)
        }
        .frame(maxWidth: .infinity)
    }

    private func eliteComparisonTile(shooter: EliteShooterDTO, elbow: String, release: String) -> some View {
        let eliteWingspan = estimatedWingspan(for: shooter)
        return VStack(alignment: .leading, spacing: 6) {
            Text("PROFILE COMPARISON")
                .shotiqMicroCaps()
                .foregroundStyle(ShotIQColor.ink)
            Rectangle().fill(ShotIQColor.rule).frame(height: 1)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 0), count: 3), spacing: 0) {
                eliteComparisonMetric("YOUR HEIGHT", inchesText(heightIn))
                eliteComparisonMetric("ELITE HEIGHT", inchesText(shooter.height))
                eliteComparisonMetric("SIZE GAP", heightGapText(user: heightIn, elite: shooter.height))
                eliteComparisonMetric("WEIGHT GAP", weightGapText(user: weightLbs, elite: shooter.weight))
                eliteComparisonMetric("ELBOW", elbow)
                eliteComparisonMetric("RELEASE", release)
            }
        }
        .padding(8)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 9))
        .overlay(RoundedRectangle(cornerRadius: 9).stroke(ShotIQColor.rule))
        .accessibilityLabel("Profile comparison. Wingspan estimate \(inchesText(eliteWingspan))")
    }

    private func eliteComparisonMetric(_ label: String, _ value: String) -> some View {
        VStack(spacing: 1) {
            Text(label)
                .shotiqMicroCaps()
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.48)
            Text(value)
                .font(.custom("Tungsten-Medium", size: 27))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .lineLimit(1)
                .minimumScaleFactor(0.52)
        }
        .frame(maxWidth: .infinity, minHeight: 48)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(width: 1), alignment: .trailing)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
    }

    private func elitePhaseFilmstrip(activePhase: String, shooterID: Int, rank: Int) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text("SHOT PHASE PROFILE")
                .shotiqMicroCaps()
                .foregroundStyle(.white)
            HStack(spacing: 5) {
                ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW"], id: \.self) { phase in
                    Button {
                        activePhaseByShooter[shooterID] = phase
                    } label: {
                        elitePhaseFrame(phase, isActive: activePhase == phase)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(phase.capitalized) phase\(activePhase == phase ? " selected" : "")")
                }
            }
        }
        .padding(8)
        .background(Color(red: 0.02, green: 0.05, blue: 0.08), in: RoundedRectangle(cornerRadius: 9))
    }

    private func elitePhaseFrame(_ phase: String, isActive: Bool) -> some View {
        VStack(spacing: 4) {
            ZStack {
                CanonicalPhoto(elitePhasePhotoKey(phase),
                               height: 52,
                               cornerRadius: 4,
                               alignment: .top)
                SkeletonOverlay(showJoints: true,
                                boneColor: .white,
                                jointColor: ShotIQColor.shotiqOrange)
                    .opacity(0.52)
                EliteFilmPerforation()
                    .opacity(0.75)
            }
            .overlay(RoundedRectangle(cornerRadius: 5)
                .stroke(isActive ? ShotIQColor.shotiqOrange : Color.clear,
                        lineWidth: isActive ? 2 : 0))
            Text(phase)
                .shotiqBody(8, weight: .black)
                .kerning(0.2)
                .foregroundStyle(isActive ? ShotIQColor.shotiqOrange : .white)
                .lineLimit(1)
                .minimumScaleFactor(0.55)
            Rectangle()
                .fill(isActive ? ShotIQColor.shotiqOrange : Color.clear)
                .frame(width: 32, height: 2)
        }
        .frame(maxWidth: .infinity)
    }

    private func elitePhasePhotoKey(_ phase: String) -> String {
        switch phase {
        case "SETUP": return "041-visual-001"
        case "LOAD": return "041-visual-002"
        case "RISE": return "041-visual-003"
        case "RELEASE": return "041-visual-002"
        default: return "041-visual-004"
        }
    }

    private func shortPosition(_ position: String) -> String {
        let cleaned = position.replacingOccurrences(of: "_", with: " ")
        if cleaned.localizedCaseInsensitiveContains("small forward") { return "Small Forward" }
        if cleaned.localizedCaseInsensitiveContains("shooting guard") { return "Shooting Guard" }
        if cleaned.localizedCaseInsensitiveContains("point guard") { return "Point Guard" }
        if cleaned.localizedCaseInsensitiveContains("power forward") { return "Power Forward" }
        return cleaned
    }

    private func matrixCell(_ label: String, _ primary: String, _ secondary: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).shotiqMicroCaps()
                .foregroundStyle(ShotIQColor.graphite)
            Text(primary)
                .font(.custom("Tungsten-Medium", size: 22))
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
            Text(secondary.uppercased())
                .shotiqBody(8, weight: .semibold)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 8)
        .padding(.vertical, 8)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(width: 1), alignment: .trailing)
    }

    private func profileMatchScore(for shooter: EliteShooterDTO) -> Int {
        let eliteWing = estimatedWingspan(for: shooter)
        let heightPenalty = min(abs(heightIn - shooter.height) * 4, 24)
        let wingspanPenalty = min(abs(wingspanIn - eliteWing) * 3, 24)
        let handBonus = hand.lowercased() == "right" ? 4 : 0
        let tierBonus = playerLevel.localizedCaseInsensitiveContains("advanced") ? 3 : 0
        return max(58, min(99, 94 - heightPenalty - wingspanPenalty + handBonus + tierBonus))
    }

    private func estimatedWingspan(for shooter: EliteShooterDTO) -> Int {
        let bonus: Int
        if shooter.position.localizedCaseInsensitiveContains("C") {
            bonus = 4
        } else if shooter.position.localizedCaseInsensitiveContains("F") {
            bonus = 3
        } else {
            bonus = 2
        }
        return shooter.height + bonus
    }

    private func inchesText(_ inches: Int) -> String {
        "\(inches / 12)'\(inches % 12)\""
    }

    private func wingspanDeltaText(_ delta: Int) -> String {
        delta >= 0 ? "+\(delta)\"" : "\(delta)\""
    }

    private func heightGapText(user: Int, elite: Int) -> String {
        let delta = elite - user
        if delta == 0 { return "EVEN" }
        return delta > 0 ? "+\(delta)\"" : "\(delta)\""
    }

    private func wingspanGapText(user: Int, elite: Int) -> String {
        let delta = elite - user
        if delta == 0 { return "WS EVEN" }
        return delta > 0 ? "WS +\(delta)\"" : "WS \(delta)\""
    }

    private func weightGapText(user: Int, elite: Int) -> String {
        let delta = elite - user
        if delta == 0 { return "EVEN" }
        return delta > 0 ? "+\(delta) LB" : "\(delta) LB"
    }

    private func eliteStat(_ label: String, _ value: String, _ color: Color, valueSize: CGFloat = 24) -> some View {
        VStack(spacing: 3) {
            Text(label).shotiqMicroCaps().foregroundStyle(ShotIQColor.graphite)
            Text(value)
                .font(.custom("Tungsten-Medium", size: valueSize))
                .foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }

    private func eliteMechanicPill(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label).shotiqMicroCaps().foregroundStyle(ShotIQColor.graphite)
            Text(value.uppercased())
                .font(.custom("Tungsten-Medium", size: 18))
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: 5))
        .overlay(RoundedRectangle(cornerRadius: 5).stroke(color.opacity(0.18)))
    }

    private func elitePhaseMini(_ label: String, rank: Int, isActive: Bool) -> some View {
        VStack(spacing: 4) {
            Group {
                if rank < Self.cardPhotoKeys.count {
                    CanonicalPhoto(Self.cardPhotoKeys[rank], width: 56, height: 34, cornerRadius: 4)
                } else {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(ShotIQColor.warmCanvas)
                        .frame(width: 56, height: 34)
                }
            }
            .overlay(RoundedRectangle(cornerRadius: 4)
                .stroke(isActive ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                        lineWidth: isActive ? 2 : 1))
            Text(label)
                .shotiqBody(7.5, weight: .black)
                .kerning(0.25)
                .foregroundStyle(isActive ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                .lineLimit(1)
                .minimumScaleFactor(0.55)
            Rectangle()
                .fill(isActive ? ShotIQColor.shotiqOrange : Color.clear)
                .frame(height: 2)
        }
        .frame(maxWidth: .infinity)
    }

    private func eliteTag(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label).shotiqMicroCaps().foregroundStyle(ShotIQColor.graphite)
            Text(value.uppercased())
                .shotiqBody(10, weight: .bold)
                .foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.62)
        }
        .padding(.horizontal, 8)
        .frame(maxWidth: .infinity, minHeight: 42, alignment: .leading)
        .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: 6))
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(color.opacity(0.18)))
    }

}

private struct EliteSelectorDrawer: View {
    let title: String
    let subtitle: String
    let options: [String]
    @Binding var selection: String
    let detailFor: (String) -> String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ShotIQSelectionDrawer(selection: $selection,
                              title: title,
                              subtitle: subtitle,
                              summary: "\(title.capitalized) - \(selection)",
                              options: options,
                              clearTitle: "Clear",
                              clearValue: options.first,
                              optionDetail: detailFor,
                              optionIcon: icon(for:))
    }

    private func drawerRow(option: String,
                           detail: String,
                           selected: Bool,
                           action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 7)
                        .fill(selected ? ShotIQColor.shotiqOrange.opacity(0.10) : ShotIQColor.warmCanvas)
                    Image(systemName: icon(for: option))
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                }
                .frame(width: 44, height: 44)
                VStack(alignment: .leading, spacing: 2) {
                    Text(option.uppercased())
                        .shotiqBody(13, weight: .black)
                        .foregroundStyle(ShotIQColor.ink)
                    Text(detail)
                        .shotiqBody(10, weight: .medium)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                }
                Spacer()
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(ShotIQColor.graphite)
            }
            .padding(10)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                        lineWidth: selected ? 1.5 : 1))
        }
        .buttonStyle(.plain)
    }

    private func icon(for option: String) -> String {
        switch option {
        case "WSI": return "number"
        case "FG%": return "percent"
        case "Name": return "textformat"
        case "All Levels": return "person.2"
        case "All Positions": return "scope"
        case "All Shot Types": return "basketball"
        case "More Filters": return "slider.horizontal.3"
        default: return "target"
        }
    }
}

private struct EliteFiltersDrawer: View {
    @Binding var level: String
    @Binding var position: String
    @Binding var shotType: String
    @Binding var league: String
    let levelOptions: [String]
    let positionOptions: [String]
    let leagueOptions: [String]
    let visibleCount: Int
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Capsule()
                .fill(ShotIQColor.graphite.opacity(0.35))
                .frame(width: 44, height: 5)
                .frame(maxWidth: .infinity)
                .padding(.bottom, 4)

            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("FILTER SHOOTERS")
                        .shotiqDisplay(42)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.62)
                    Text("\(visibleCount) ranked shooter\(visibleCount == 1 ? "" : "s") match these filters.")
                        .shotiqBody(13, weight: .semibold)
                        .foregroundStyle(ShotIQColor.graphite)
                }
                Spacer()
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(ShotIQColor.ink)
                        .frame(width: 34, height: 34)
                        .background(ShotIQColor.warmCanvas, in: Circle())
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 12) {
                Image(systemName: "slider.horizontal.3")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .frame(width: 34)
                Text("\(visibleCount) ranked shooter\(visibleCount == 1 ? "" : "s")")
                    .shotiqBody(18, weight: .bold)
                    .foregroundStyle(ShotIQColor.ink)
                Spacer()
            }
            .frame(height: 58)
            .padding(.horizontal, 12)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(ShotIQColor.rule, lineWidth: 1.2))

            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    drawerGroup("LEVEL", options: levelOptions, selection: $level)
                    drawerGroup("POSITION", options: positionOptions, selection: $position)
                    drawerGroup("SHOT TYPE", options: ["All Shot Types", "Catch & Shoot", "Pull-Up", "Off Dribble"], selection: $shotType)
                    drawerGroup("LEAGUE", options: leagueOptions, selection: $league)
                }
            }

            Button {
                dismiss()
            } label: {
                Text("APPLY")
                    .shotiqBody(13, weight: .black)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 46)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)

            HStack(spacing: 0) {
                Button {
                    level = "All Levels"
                    position = "All Positions"
                    shotType = "All Shot Types"
                    league = "More Filters"
                } label: {
                    Text("CLEAR")
                        .shotiqBody(12, weight: .black)
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .frame(maxWidth: .infinity)
                        .frame(height: 42)
                }
                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 28)
                Button {
                    dismiss()
                } label: {
                    Text("CANCEL")
                        .shotiqBody(12, weight: .black)
                        .foregroundStyle(ShotIQColor.ink)
                        .frame(maxWidth: .infinity)
                        .frame(height: 42)
                }
            }
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 16)
        .background(Color.white)
    }

    private func drawerGroup(_ title: String, options: [String], selection: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .shotiqMicroCaps()
                .foregroundStyle(ShotIQColor.graphite)
            VStack(spacing: 8) {
                ForEach(options, id: \.self) { option in
                    Button {
                        selection.wrappedValue = option
                    } label: {
                        HStack {
                            Text(option.uppercased())
                                .shotiqBody(12, weight: .black)
                                .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Image(systemName: option == selection.wrappedValue ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 19, weight: .semibold))
                                .foregroundStyle(option == selection.wrappedValue ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                        }
                        .padding(.horizontal, 12)
                        .frame(height: 44)
                        .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8)
                            .stroke(option == selection.wrappedValue ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                                    lineWidth: option == selection.wrappedValue ? 1.5 : 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct EliteBioDrawer: View {
    let shooter: EliteShooterDTO
    let detail: EliteShooterDetailData
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    drawerHeader(title: "VIEW BIO",
                                 subtitle: "\(shooter.name) • \(shooter.team)")

                    HStack(alignment: .top, spacing: 14) {
                        CanonicalPhoto("053-visual-001", width: 116, height: 136, cornerRadius: 8, alignment: .top)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange, lineWidth: 2))
                        VStack(alignment: .leading, spacing: 8) {
                            Text("ELITE REFERENCE")
                                .shotiqBody(9, weight: .black)
                                .kerning(0.7)
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            Text(shooter.name.uppercased())
                                .shotiqDisplay(34)
                                .foregroundStyle(ShotIQColor.ink)
                                .lineLimit(2)
                                .minimumScaleFactor(0.7)
                            Text("\(shooter.position.replacingOccurrences(of: "_", with: " ")) • \(shooter.league)")
                                .shotiqBody(12, weight: .semibold)
                                .foregroundStyle(ShotIQColor.graphite)
                                .lineLimit(2)
                            VStack(alignment: .leading, spacing: 6) {
                                bioTag(EliteShooterDetailData.tierLabel(shooter))
                                bioTag(shooter.era ?? "ERA")
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(12)
                    .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))

                    VStack(alignment: .leading, spacing: 10) {
                        Text("WHY HE IS GREAT")
                            .shotiqDisplay(22)
                            .foregroundStyle(ShotIQColor.ink)
                        Text(detail.bioText)
                            .shotiqBody(14, weight: .medium)
                            .foregroundStyle(ShotIQColor.graphite)
                            .lineSpacing(4)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.leading, 14)
                    .padding(.vertical, 2)
                    .overlay(Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 4), alignment: .leading)

                    VStack(alignment: .leading, spacing: 12) {
                        Text("SHOOTER DNA")
                            .shotiqDisplay(22)
                            .foregroundStyle(ShotIQColor.ink)
                        ForEach(Array(detail.strengths.prefix(3).enumerated()), id: \.offset) { index, strength in
                            bioStrengthRow(index + 1, strength)
                        }
                    }
                    .padding(14)
                    .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))

                    HStack(spacing: 0) {
                        bioStat(shotiqPercentText(shooter.careerFieldGoalPct), "FG%")
                        VRule(height: 38)
                        bioStat(shotiqPercentText(shooter.careerThreePct ?? shooter.careerPct), "3PT%")
                        VRule(height: 38)
                        bioStat(shotiqPercentText(shooter.careerFreeThrowPct), "FT%")
                    }
                    .padding(.vertical, 12)
                    .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))

                    Spacer(minLength: 18)
                }
                .padding(.horizontal, 20)
                .padding(.top, 18)
                .padding(.bottom, 14)
            }

            Button {
                dismiss()
            } label: {
                Text("DONE")
                    .shotiqBody(13, weight: .black)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 46)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 16)
            .background(ShotIQColor.paper)
        }
        .background(Color.white)
    }

    private func drawerHeader(title: String, subtitle: String) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .shotiqCondensed(32, weight: .heavy)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(2)
                    .minimumScaleFactor(0.72)
                Text(subtitle)
                    .shotiqBody(12)
                    .foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(width: 34, height: 34)
                    .background(ShotIQColor.warmCanvas, in: Circle())
            }
            .buttonStyle(.plain)
        }
    }

    private func bioTag(_ text: String) -> some View {
        Text(text.uppercased())
            .shotiqBody(9, weight: .black)
            .foregroundStyle(ShotIQColor.ink)
            .lineLimit(1)
            .minimumScaleFactor(0.75)
            .padding(.horizontal, 9)
            .frame(height: 26)
            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 5))
            .overlay(RoundedRectangle(cornerRadius: 5).stroke(ShotIQColor.rule))
    }

    private func bioStrengthRow(_ number: Int, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text("\(number)")
                .font(.custom("Tungsten-Medium", size: 24))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .frame(width: 22, alignment: .leading)
            Text(text)
                .shotiqBody(13, weight: .semibold)
                .foregroundStyle(ShotIQColor.ink)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 2)
    }

    private func bioStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.custom("Tungsten-Medium", size: 28))
                .foregroundStyle(value == "—" ? ShotIQColor.graphite : ShotIQColor.shotiqOrange)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
            Text(label)
                .shotiqBody(9, weight: .black)
                .kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct EliteCompareDrawer: View {
    let shooter: EliteShooterDTO
    let detail: EliteShooterDetailData
    let latestAnalysis: AnalysisResultPresentation?
    let userHeight: Int
    let userWingspan: Int
    let userWeight: Int
    let userHand: String
    let userLevel: String
    @Environment(\.dismiss) private var dismiss

    private var eliteWingspan: Int {
        shooter.height + (shooter.position.localizedCaseInsensitiveContains("C") ? 4 : 2)
    }
    private var eliteTwoPointPct: Double? {
        estimatedTwoPointPct(shooter)
    }
    private var eliteEfficiency: Int {
        let values = [
            shooter.careerFieldGoalPct ?? shooter.careerPct,
            shooter.careerThreePct ?? shooter.careerPct,
            eliteTwoPointPct,
            shooter.careerFreeThrowPct,
        ].compactMap { $0 }
        guard !values.isEmpty else { return 0 }
        return Int(round(values.reduce(0, +) / Double(values.count)))
    }
    private var eliteElbow: String {
        mechanicValue("Elbow Angle")
    }
    private var eliteReleaseHeight: String {
        mechanicValue("Release Height")
    }
    private var eliteReleaseAngle: String {
        mechanicValue("Release Angle")
    }
    private var eliteBalance: String {
        mechanicValue("Balance")
    }
    private var latestBalance: String {
        guard let item = latestAnalysis?.scoreBreakdown.first(where: { $0.metric == "Balance" }),
              !item.isUnavailable else { return "--" }
        return item.scoreText
    }
    private var latestCenterline: String {
        latestAnalysis?.metrics.first(where: { $0.label == "CENTERLINE" })?.value ?? "--"
    }
    private var playerName: String {
        latestAnalysis == nil ? "YOUR SHOT" : "LATEST SHOT"
    }
    private var playerSubline: String {
        "\(userLevel.capitalized) • \(userHand.capitalized)"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                Text("COMPARE PLAYER")
                    .shotiqCondensed(38, weight: .heavy)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.58)
                Spacer()
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 17, weight: .black))
                        .foregroundStyle(ShotIQColor.ink)
                        .frame(width: 40, height: 40)
                        .background(ShotIQColor.warmCanvas, in: Circle())
                        .overlay(Circle().stroke(ShotIQColor.rule))
                }
                .buttonStyle(.plain)
            }

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    Text("SHOTIQ COMPARISON")
                        .shotiqCondensed(22, weight: .heavy)
                        .foregroundStyle(ShotIQColor.graphite)

                    HStack(spacing: 10) {
                        comparePlayerCard(name: playerName,
                                          subline: playerSubline,
                                          badge: "ME",
                                          accent: ShotIQColor.ink)
                        comparePlayerCard(name: shooter.name,
                                          subline: "\(shooter.team) • \(shooter.position)",
                                          badge: "\(detail.scoreText)",
                                          accent: ShotIQColor.shotiqOrange)
                    }

                    compareTable(title: "SHOOTING NUMBERS",
                                 rows: [
                                    ("--", "FIELD GOAL", shotiqPercentText(shooter.careerFieldGoalPct ?? shooter.careerPct)),
                                    ("--", "3 POINT", shotiqPercentText(shooter.careerThreePct ?? shooter.careerPct)),
                                    ("--", "2 POINT", shotiqPercentText(eliteTwoPointPct)),
                                    ("--", "FREE THROW", shotiqPercentText(shooter.careerFreeThrowPct)),
                                    (latestAnalysis?.scoreText ?? "--", "FORM SCORE", detail.scoreText),
                                    ("--", "EFFICIENCY", "\(eliteEfficiency)"),
                                 ])

                    compareTable(title: "MECHANICS",
                                 rows: [
                                    (latestAnalysis?.elbowAngleText ?? "--", "ELBOW ANGLE", eliteElbow),
                                    (latestAnalysis?.releaseHeightText ?? "--", "RELEASE HEIGHT", eliteReleaseHeight),
                                    (latestAnalysis?.releaseOffsetText ?? "--", "RELEASE ANGLE", eliteReleaseAngle),
                                    (latestBalance, "BALANCE", eliteBalance),
                                    (latestCenterline, "CENTER LINE", "0°"),
                                 ])

                    compareTable(title: "BODY PROFILE",
                                 rows: [
                                    (inchesText(userHeight), "HEIGHT", inchesText(shooter.height)),
                                    (inchesText(userWingspan), "WINGSPAN", inchesText(eliteWingspan)),
                                    ("\(userWeight) LB", "WEIGHT", "\(shooter.weight) LB"),
                                    (userHand.capitalized, "HAND", "Right"),
                                 ])

                    Button {
                        dismiss()
                    } label: {
                        Text("CLEAR COMPARISON")
                            .shotiqCondensed(26, weight: .heavy)
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .overlay(RoundedRectangle(cornerRadius: 8)
                                .stroke(ShotIQColor.shotiqOrange.opacity(0.55), lineWidth: 1.5))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .padding(.bottom, 16)
        .background(Color.white)
    }

    private func comparePlayerCard(name: String, subline: String, badge: String, accent: Color) -> some View {
        VStack(spacing: 7) {
            ZStack {
                Circle()
                    .fill(Color.white)
                    .frame(width: 56, height: 56)
                    .overlay(Circle().stroke(accent.opacity(0.35), lineWidth: 1.5))
                Text(badge.uppercased())
                    .shotiqBody(13, weight: .black)
                    .foregroundStyle(accent)
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)
                    .padding(.horizontal, 5)
            }
            Text(name.uppercased())
                .shotiqCondensed(24, weight: .heavy)
                .foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.58)
                .frame(minHeight: 52)
            Text(subline.uppercased())
                .shotiqBody(10, weight: .bold)
                .kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.6)
            HStack(spacing: 5) {
                Text(badge == "ME" ? "LATEST SHOT" : "VIEW REFERENCE")
                    .shotiqBody(11, weight: .black)
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .black))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 34)
            .background(accent, in: RoundedRectangle(cornerRadius: 6))
        }
        .padding(10)
        .frame(maxWidth: .infinity)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(accent.opacity(0.28), lineWidth: 1.2))
    }

    private func compareTable(title: String, rows: [(String, String, String)]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .shotiqCondensed(22, weight: .heavy)
                .foregroundStyle(ShotIQColor.graphite)
            VStack(spacing: 0) {
                ForEach(Array(rows.enumerated()), id: \.offset) { index, row in
                    compareTableRow(left: row.0, label: row.1, right: row.2)
                    if index < rows.count - 1 {
                        Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                    }
                }
            }
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        }
    }

    private func compareTableRow(left: String, label: String, right: String) -> some View {
        HStack(alignment: .center, spacing: 8) {
            Text(left.uppercased())
                .font(.custom("Tungsten-Medium", size: 38))
                .foregroundStyle(ShotIQColor.ink)
                .frame(maxWidth: .infinity, alignment: .center)
                .lineLimit(1)
                .minimumScaleFactor(0.55)
            Text(label.uppercased())
                .shotiqCondensed(18, weight: .heavy)
                .foregroundStyle(ShotIQColor.graphite)
                .frame(width: 110, alignment: .center)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.55)
            Text(right.uppercased())
                .font(.custom("Tungsten-Medium", size: 38))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .frame(maxWidth: .infinity, alignment: .center)
                .lineLimit(1)
                .minimumScaleFactor(0.55)
        }
        .frame(minHeight: 58)
        .padding(.horizontal, 10)
    }

    private func inchesText(_ inches: Int) -> String {
        "\(inches / 12)'\(inches % 12)\""
    }

    private func mechanicValue(_ label: String) -> String {
        detail.mechanics.first(where: { $0.label == label })?.value ?? "--"
    }

    private func estimatedTwoPointPct(_ shooter: EliteShooterDTO) -> Double? {
        guard let fg = shooter.careerFieldGoalPct ?? shooter.careerPct else { return nil }
        let three = shooter.careerThreePct ?? shooter.careerPct ?? fg
        let finishingLift = shooter.height >= 78 ? 2.2 : 1.2
        return min(72.0, max(35.0, fg + max(0, fg - three) * 0.85 + finishingLift))
    }
}

private enum EliteDetailDrawer: Identifiable {
    case bio
    case compare

    var id: String {
        switch self {
        case .bio: return "bio"
        case .compare: return "compare"
        }
    }
}

struct EliteShooterDetailView: View { // 053
    var shooter: EliteShooterDTO
    var rank: Int? = nil
    var catalog: [EliteShooterDTO] = []
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @AppStorage(EliteComparisonSelection.shooterIDKey) private var selectedShooterID = 0
    @AppStorage("profileHeightIn") private var heightIn = 75
    @AppStorage("profileWingspanIn") private var wingspanIn = 77
    @AppStorage("profileWeightLbs") private var weightLbs = 185
    @AppStorage("profileHand") private var hand = "right"
    @AppStorage("profileLevel") private var playerLevel = "advanced"
    @State private var imageMode = "STORY"
    @State private var savedReference = false
    @State private var toast: ShotIQToast?
    @State private var activeDrawer: EliteDetailDrawer?
    private var detail: EliteShooterDetailData {
        EliteShooterDetailData.make(shooter: shooter)
    }
    private var sharePayload: ShotIQSharePayload {
        ShotIQSharePayload.simple(title: "SHARE PLAYER",
                                  headline: shooter.name,
                                  subheadline: "\(shooter.team) • \(shooter.position.replacingOccurrences(of: "_", with: " "))",
                                  primaryValue: "#\(resolvedRank)",
                                  primaryLabel: "RANK",
                                  secondaryValue: detail.scoreText,
                                  secondaryLabel: "WSI",
                                  accentLabel: detail.scoreVerdict,
                                  metrics: [
                                    ShotIQShareMetric(value: "\(shooter.height / 12)'\(shooter.height % 12)\"", label: "Height"),
                                    ShotIQShareMetric(value: "\(shooter.weight) lb", label: "Weight"),
                                    ShotIQShareMetric(value: shotiqPercentText(shooter.careerThreePct ?? shooter.careerPct), label: "3PT"),
                                    ShotIQShareMetric(value: shotiqPercentText(shooter.careerFreeThrowPct), label: "FT")
                                  ],
                                  shareText: detail.shareText)
    }
    private var referenceStoreID: String { "\(shooter.id)::\(shooter.name)" }
    private var resolvedRank: Int {
        rank ?? max(1, 100 - EliteShooterDetailData.wsiScore(shooter) + 1)
    }
    private var rankingCatalog: [EliteShooterDTO] {
        var seen: Set<Int> = []
        return (catalog + [shooter]).filter { seen.insert($0.id).inserted }
    }
    private var isStoryImage: Bool {
        imageMode == "STORY"
    }
    private var imageHeight: CGFloat {
        isStoryImage ? 420 : 178
    }
    private var storyImageWidth: CGFloat {
        imageHeight * 9.0 / 16.0
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-elite-shooter-detail") {
            VStack(spacing: 0) {
                EliteTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        VStack(alignment: .leading, spacing: 14) {
                            Button {
                                toast = .info("Returning to elite shooters")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "chevron.left").font(.system(size: 15, weight: .semibold))
                                    Text("ELITE SHOOTERS").shotiqBody(13, weight: .semibold).kerning(0.8)
                                }
                                .foregroundStyle(ShotIQColor.graphite)
                            }
                            .buttonStyle(.plain)

                            ZStack(alignment: .topTrailing) {
                                Group {
                                    if isStoryImage {
                                        CanonicalPhoto("053-visual-001",
                                                       width: storyImageWidth,
                                                       height: imageHeight,
                                                       cornerRadius: 8,
                                                       alignment: .top)
                                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange, lineWidth: 2))
                                            .frame(maxWidth: .infinity)
                                    } else {
                                        CanonicalPhoto("053-visual-001",
                                                       height: imageHeight,
                                                       cornerRadius: 8,
                                                       alignment: .center)
                                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange, lineWidth: 2))
                                    }
                                }
                                Button {
                                    imageMode = imageMode == "STORY" ? "LANDSCAPE" : "STORY"
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: imageMode == "STORY" ? "rectangle.portrait" : "rectangle")
                                            .font(.system(size: 13, weight: .bold))
                                        Text(imageMode).shotiqBody(11, weight: .black)
                                    }
                                    .foregroundStyle(ShotIQColor.ink)
                                    .padding(.horizontal, 10)
                                    .frame(height: 34)
                                    .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 8))
                                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange.opacity(0.40)))
                                }
                                .buttonStyle(.plain)
                                .padding(10)
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                HStack(alignment: .firstTextBaseline, spacing: 10) {
                                    Text(shooter.name.uppercased()).shotiqDisplay(42)
                                        .lineLimit(2)
                                        .minimumScaleFactor(0.72)
                                        .accessibilityIdentifier("elite-detail-name")
                                    Spacer()
                                    Button {
                                        activeDrawer = .bio
                                    } label: {
                                        HStack(spacing: 4) {
                                            Text("View bio").shotiqBody(13, weight: .black)
                                            Image(systemName: "chevron.right").font(.system(size: 10, weight: .black))
                                        }
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .padding(.horizontal, 10)
                                        .frame(height: 32)
                                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange.opacity(0.35)))
                                    }
                                    .buttonStyle(.plain)
                                }
                                Text("Right-handed  •  \(shooter.position)")
                                    .shotiqBody(15, weight: .semibold)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("\(shooter.team)  •  \(shooter.league)")
                                    .shotiqBody(15)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .accessibilityIdentifier("elite-detail-team")
                            }

                            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 0), count: 3), spacing: 0) {
                                profileInfoCell("HEIGHT", inchesText(shooter.height), "REFERENCE")
                                profileInfoCell("WEIGHT", "\(shooter.weight) LB", "REFERENCE")
                                rankedRateCell("FG%", shooter.careerFieldGoalPct ?? shooter.careerPct,
                                               rank: rateRank(for: shooter, metric: { $0.careerFieldGoalPct ?? $0.careerPct }))
                                rankedRateCell("3P%", shooter.careerThreePct ?? shooter.careerPct,
                                               rank: rateRank(for: shooter, metric: { $0.careerThreePct ?? $0.careerPct }))
                                rankedRateCell("2P%", estimatedTwoPointPct(shooter),
                                               rank: rateRank(for: shooter, metric: { estimatedTwoPointPct($0) }))
                                rankedRateCell("FT%", shooter.careerFreeThrowPct,
                                               rank: rateRank(for: shooter, metric: { $0.careerFreeThrowPct }))
                            }
                            .padding(.vertical, 8)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)

                            VStack(alignment: .leading, spacing: 8) {
                                Text("ELITE REFERENCE").shotiqDisplay(18)
                                ForEach(detail.strengths, id: \.self) { strength in
                                    Text(strength).shotiqBody(14, weight: .semibold)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            .padding(.leading, 12)
                            .padding(.vertical, 2)
                            .overlay(Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 3), alignment: .leading)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 14)
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("CAREER SHOOTING SUMMARY").shotiqDisplay(22)
                                    Text(detail.analyzedText).shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Button {
                                    activeDrawer = .compare
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: "slider.horizontal.3")
                                            .font(.system(size: 13, weight: .bold))
                                        Text("Compare").shotiqBody(14, weight: .black)
                                    }
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .padding(.horizontal, 10)
                                    .frame(height: 34)
                                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange.opacity(0.35)))
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 18)
                            .id("section-OVERVIEW")
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 14) {
                                    HStack(alignment: .top, spacing: 14) {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("FORM SCORE").shotiqDisplay(18)
                                            Text(detail.scoreText).font(.custom("Tungsten-Medium", size: 68))
                                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                                .accessibilityIdentifier("elite-detail-score")
                                            Text(detail.scoreVerdict).font(.custom("Tungsten-Medium", size: 19))
                                                .foregroundStyle(ShotIQColor.analysisBlue)
                                        }
                                        Spacer()
                                        VStack(alignment: .trailing, spacing: 2) {
                                            Text("RANK").shotiqMicroCaps()
                                                .foregroundStyle(ShotIQColor.graphite)
                                            Text("\(resolvedRank)").font(.custom("Tungsten-Medium", size: 58))
                                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                                .accessibilityIdentifier("elite-detail-tier")
                                            Text("ELITE SHOOTERS")
                                                .shotiqBody(11, weight: .bold).kerning(0.5)
                                                .foregroundStyle(ShotIQColor.graphite)
                                        }
                                    }
                                    VStack(spacing: 5) {
                                        ScoreBar(pct: detail.scorePct)
                                        HStack {
                                            ForEach(["0", "25", "50", "75", "100"], id: \.self) { t in
                                                Text(t).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                                if t != "100" { Spacer() }
                                            }
                                        }
                                    }
                                    Text(detail.scoreNote).shotiqBody(13)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .padding(14)
                            }
                            .overlay(RoundedRectangle(cornerRadius: 8)
                                .stroke(ShotIQColor.shotiqOrange.opacity(0.20), lineWidth: 1))
                            .padding(.top, 12)

                            Text("MECHANICS SNAPSHOT").shotiqDisplay(20).padding(.top, 22)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -11), alignment: .top)
                                .id("section-MECHANICS")
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 2), spacing: 8) {
                                ForEach(detail.mechanics, id: \.label) { item in
                                    snapshotCol(item.label, item.value, valueID: "elite-detail-mechanic-\(item.label)")
                                }
                            }
                            .padding(.top, 10)

                            HStack {
                                Text("SHOT BREAKDOWN (CAREER)").shotiqDisplay(20)
                                Spacer()
                                Text(detail.breakdownTotal).shotiqBody(11, weight: .medium).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 22)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -11), alignment: .top)
                            VStack(spacing: 8) {
                                ForEach(detail.breakdown, id: \.label) { item in
                                    breakdownRow(item.label, item.percent, item.shots)
                                        .accessibilityIdentifier("elite-detail-breakdown-\(item.label)")
                                }
                            }
                            .padding(.top, 10)
                            Text("REFERENCE FORM FRAMES").shotiqDisplay(20).padding(.top, 22)
                                .id("section-REFERENCE")
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 10) {
                                    ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                                        VStack(spacing: 6) {
                                            CanonicalPhoto(referenceFrameKey(for: p), width: 118, height: 86, cornerRadius: 5)
                                                .overlay(SkeletonOverlay().opacity(0.72))
                                            Text(p).shotiqBody(9, weight: p == "RELEASE" ? .bold : .regular).kerning(0.3)
                                                .foregroundStyle(p == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.6)
                                            if p == "RELEASE" {
                                                Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 42, height: 2)
                                            }
                                        }
                                        .frame(width: 118)
                                    }
                                }
                            }
                            .padding(.top, 8)
                            HStack(spacing: 10) {
                                Button {
                                    activeDrawer = .compare
                                } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: "magnifyingglass")
                                        Text("Compare").shotiqBody(15, weight: .medium)
                                            .lineLimit(1).minimumScaleFactor(0.7)
                                    }
                                    .frame(maxWidth: .infinity).frame(height: 52)
                                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                                    .foregroundStyle(.white)
                                }
                                .buttonStyle(.plain)
                                Button {
                                    savedReference.toggle()
                                    EliteStudyStore.set(savedReference,
                                                        id: referenceStoreID,
                                                        key: EliteStudyStore.referencesKey)
                                    toast = savedReference
                                        ? .success("Reference saved", "\(shooter.name) added to your study list.")
                                        : .info("Reference removed", "\(shooter.name) removed from your study list.")
                                    Task {
                                        await APIClient.shared.send(
                                            "/api/settings", method: "PUT",
                                            body: ["eliteStudy": ["savedReference": referenceStoreID,
                                                                 "state": savedReference ? "saved" : "removed"]])
                                    }
                                } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: savedReference ? "bookmark.fill" : "bookmark")
                                        Text(savedReference ? "Saved" : "Save reference").shotiqBody(14)
                                            .lineLimit(1).minimumScaleFactor(0.7)
                                    }
                                    .foregroundStyle(savedReference ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                    .padding(.horizontal, 16).frame(height: 52)
                                    .overlay(RoundedRectangle(cornerRadius: 6)
                                        .stroke(savedReference ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                                }
                                .buttonStyle(.plain)
                                ShotIQShareButton(payload: sharePayload) {
                                    Image(systemName: "square.and.arrow.up").font(.system(size: 17))
                                        .foregroundStyle(ShotIQColor.ink)
                                        .frame(width: 52, height: 52)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                            }
                            .padding(.top, 18)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .onAppear {
            savedReference = EliteStudyStore.contains(referenceStoreID,
                                                      key: EliteStudyStore.referencesKey)
            selectedShooterID = shooter.id
        }
        .sheet(item: $activeDrawer) { drawer in
            switch drawer {
            case .bio:
                EliteBioDrawer(shooter: shooter, detail: detail)
                    .presentationDetents([.medium, .large])
            case .compare:
                EliteCompareDrawer(shooter: shooter,
                                    detail: detail,
                                    latestAnalysis: latestComparePresentation,
                                    userHeight: heightIn,
                                    userWingspan: wingspanIn,
                                    userWeight: weightLbs,
                                    userHand: hand,
                                    userLevel: playerLevel)
                    .presentationDetents([.large])
            }
        }
        .shotiqToast($toast)
    }
    private var latestComparePresentation: AnalysisResultPresentation? {
        if let latest = app.recentMedia.first {
            return AnalysisResultPresentation(result: latest.analysis)
        }
        return UITestHooks.demoData ? .canonicalDemo : nil
    }
    private func referenceFrameKey(for phase: String) -> String {
        switch phase {
        case "SETUP": return "041-visual-001"
        case "LOAD": return "042-frame-002"
        case "RISE": return "041-visual-003"
        case "RELEASE": return "041-visual-002"
        default: return "041-visual-004"
        }
    }
    private func summaryStat(_ label: String, _ value: String, valueID: String? = nil) -> some View {
        VStack(spacing: 3) {
            Text(label).shotiqBody(10, weight: .medium).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            if let valueID {
                Text(value).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.6)
                    .accessibilityIdentifier(valueID)
            } else {
                Text(value).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.6)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(minHeight: 66)
    }

    private var sampleCountText: String {
        let parts = detail.analyzedText.split(separator: " ")
        return parts.first.map(String.init) ?? detail.analyzedText
    }

    private func profileInfoCell(_ label: String, _ value: String, _ caption: String) -> some View {
        VStack(spacing: 2) {
            Text(label).shotiqMicroCaps().foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(value).font(.custom("Tungsten-Medium", size: 29))
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.65)
            Text(caption).shotiqBody(8, weight: .bold).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.55)
        }
        .frame(maxWidth: .infinity)
        .frame(minHeight: 68)
    }

    private func rankedRateCell(_ label: String, _ value: Double?, rank: Int?) -> some View {
        profileInfoCell(label,
                        shotiqPercentText(value),
                        rank.map { "RANK \($0)" } ?? "RANK --")
    }

    private func rateRank(for shooter: EliteShooterDTO,
                          metric: (EliteShooterDTO) -> Double?) -> Int? {
        guard let current = metric(shooter) else { return nil }
        let values = rankingCatalog.compactMap(metric)
        guard !values.isEmpty else { return nil }
        return 1 + values.filter { $0 > current }.count
    }

    private func estimatedTwoPointPct(_ shooter: EliteShooterDTO) -> Double? {
        guard let fg = shooter.careerFieldGoalPct ?? shooter.careerPct else { return nil }
        let three = shooter.careerThreePct ?? shooter.careerPct ?? fg
        let finishingLift = shooter.height >= 78 ? 2.2 : 1.2
        return min(72.0, max(35.0, fg + max(0, fg - three) * 0.85 + finishingLift))
    }

    private func inchesText(_ inches: Int) -> String {
        "\(inches / 12)'\(inches % 12)\""
    }

    private func breakdownRow(_ label: String, _ pct: String, _ shots: String) -> some View {
        let progress = percentValue(pct)
        return VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).shotiqBody(13, weight: .semibold)
                        .foregroundStyle(ShotIQColor.ink)
                    Text(shots).shotiqBody(10, weight: .medium).kerning(0.4)
                        .foregroundStyle(ShotIQColor.graphite)
                }
                Spacer()
                Text(pct).font(.custom("Tungsten-Medium", size: 30))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .lineLimit(1)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(ShotIQColor.rule)
                    Capsule()
                        .fill(ShotIQColor.shotiqOrange)
                        .frame(width: geo.size.width * progress)
                }
            }
            .frame(height: 7)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func snapshotCol(_ label: String, _ value: String, valueID: String? = nil) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).shotiqMicroCaps()
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            if let valueID {
                Text(value).font(.custom("Tungsten-Medium", size: 28)).foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.6)
                    .accessibilityIdentifier(valueID)
            } else {
                Text(value).font(.custom("Tungsten-Medium", size: 28)).foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.6)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func percentValue(_ text: String) -> CGFloat {
        let number = text
            .replacingOccurrences(of: "%", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard let value = Double(number) else { return 0 }
        return CGFloat(min(max(value / 100.0, 0), 1))
    }
}
