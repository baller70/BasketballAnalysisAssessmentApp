import Foundation

struct AnalysisMetricTile: Equatable {
    var icon: String
    var label: String
    var value: String
    var verdict: String
    var isPositive: Bool
    var detailMetric: String
    var detailValue: Double
    var source: String
}

struct AnalysisScoreBreakdownItem: Equatable {
    var metric: String
    var scoreText: String
    var scorePct: Double
    var verdict: String
    var caption: String
    var detail: String
    var impact: String
    var source: String

    var isUnavailable: Bool { source == "missing" || scoreText == "--" }
}

struct AnalysisFlawItem: Equatable, Hashable, Identifiable {
    var rank: Int
    var title: String
    var impact: String
    var description: String
    var confidence: String
    var cta: String
    var phase: String
    var trendEnd: String
    var source: String

    var id: String { "\(rank)-\(title)-\(source)" }
}

struct AnalysisEliteMatchSummary: Equatable {
    var isMatched: Bool
    var title: String
    var subtitle: String
    var reason: String?
    var overallText: String
    var pct: Double
    var photoURL: URL?
    var releaseAngleText: String
    var elbowAngleText: String
    var shotArcText: String
    var isEstimated: Bool

    init(isMatched: Bool,
         title: String,
         subtitle: String,
         reason: String?,
         overallText: String,
         pct: Double,
         photoURL: URL?,
         releaseAngleText: String,
         elbowAngleText: String,
         shotArcText: String,
         isEstimated: Bool) {
        self.isMatched = isMatched
        self.title = title
        self.subtitle = subtitle
        self.reason = reason
        self.overallText = overallText
        self.pct = pct
        self.photoURL = photoURL
        self.releaseAngleText = releaseAngleText
        self.elbowAngleText = elbowAngleText
        self.shotArcText = shotArcText
        self.isEstimated = isEstimated
    }

    static let canonicalDemo = AnalysisEliteMatchSummary(
        isMatched: true,
        title: "KLAY THOMPSON",
        subtitle: "Golden State Warriors",
        reason: nil,
        overallText: "88%",
        pct: 0.88,
        photoURL: nil,
        releaseAngleText: "51°",
        elbowAngleText: "95%",
        shotArcText: "46°",
        isEstimated: false)

    static func pending(_ reason: String? = nil) -> AnalysisEliteMatchSummary {
        AnalysisEliteMatchSummary(
            isMatched: false,
            title: "ELITE MATCH PENDING",
            subtitle: reason ?? "Analyze a measured shot to see your closest elite comparison.",
            reason: reason,
            overallText: "--",
            pct: 0,
            photoURL: nil,
            releaseAngleText: "--",
            elbowAngleText: "--",
            shotArcText: "--",
            isEstimated: false)
    }

    init(match: EliteMatchResponseDTO?) {
        guard match?.matched == true,
              let top = match?.top,
              let name = top.name,
              let overall = top.overall else {
            self = .pending(match?.reason)
            return
        }
        isMatched = true
        title = name.uppercased()
        subtitle = top.team ?? "Elite shooter"
        reason = top.reason
        overallText = "\(overall)%"
        pct = min(max(Double(overall) / 100, 0), 1)
        photoURL = top.photoUrl.flatMap(URL.init(string:))
        releaseAngleText = Self.degrees(top.reference?.releaseAngle)
        elbowAngleText = Self.degrees(top.reference?.elbowAngle)
        shotArcText = Self.degrees(top.reference?.entryAngle)
        isEstimated = top.estimated ?? false
    }

    private static func degrees(_ value: Double?) -> String {
        guard let value else { return "--" }
        return "\(Int(value.rounded()))°"
    }
}

struct AnalysisOverviewChrome: Equatable {
    var playerName: String
    var subtitle: String
    var streak: String
    var points: String
    var eliteMatch: AnalysisEliteMatchSummary

    static let canonicalDemo = AnalysisOverviewChrome(
        playerName: "Jordan Ellis",
        subtitle: "Right-handed • Advanced",
        streak: "6",
        points: "2,840",
        eliteMatch: .canonicalDemo)

    static func production(user: APIUser?,
                           profile: APIProfileDTO?,
                           badges: BadgesResponseDTO?,
                           match: EliteMatchResponseDTO?) -> AnalysisOverviewChrome {
        AnalysisOverviewChrome(
            playerName: displayName(user: user, profile: profile),
            subtitle: profileSubtitle(profile),
            streak: numberOrDash(badges?.stats?.currentStreak),
            points: groupedNumberOrDash(badges?.stats?.totalPoints),
            eliteMatch: AnalysisEliteMatchSummary(match: match))
    }

    static func productionFallback(user: APIUser?) -> AnalysisOverviewChrome {
        production(user: user, profile: nil, badges: nil, match: nil)
    }

    private static func displayName(user: APIUser?, profile: APIProfileDTO?) -> String {
        for candidate in [
            profile?.displayName,
            user?.displayName,
            fullName(first: profile?.firstName, last: profile?.lastName),
            fullName(first: user?.firstName, last: user?.lastName),
            emailPrefix(profile?.email),
            emailPrefix(user?.email),
        ] {
            if let candidate, !candidate.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return candidate
            }
        }
        return "Player"
    }

    private static func profileSubtitle(_ profile: APIProfileDTO?) -> String {
        let parts = [
            handedness(profile?.dominantHand),
            titleCase(profile?.experienceLevel),
        ].compactMap { $0 }
        return parts.isEmpty ? "ShotIQ athlete" : parts.joined(separator: " • ")
    }

    private static func handedness(_ raw: String?) -> String? {
        guard let value = titleCase(raw) else { return nil }
        if value == "Ambidextrous" { return value }
        return "\(value)-handed"
    }

    private static func titleCase(_ raw: String?) -> String? {
        guard let raw else { return nil }
        let cleaned = raw
            .replacingOccurrences(of: "_", with: " ")
            .replacingOccurrences(of: "-", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty else { return nil }
        return cleaned
            .lowercased()
            .split(separator: " ")
            .map { $0.prefix(1).uppercased() + $0.dropFirst() }
            .joined(separator: " ")
    }

    private static func fullName(first: String?, last: String?) -> String? {
        let parts = [first, last]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? nil : parts.joined(separator: " ")
    }

    private static func emailPrefix(_ email: String?) -> String? {
        guard let email, let prefix = email.split(separator: "@").first else { return nil }
        return String(prefix).replacingOccurrences(of: ".", with: " ")
    }

    private static func numberOrDash(_ value: Int?) -> String {
        guard let value else { return "--" }
        return "\(value)"
    }

    private static func groupedNumberOrDash(_ value: Int?) -> String {
        guard let value else { return "--" }
        return NumberFormatter.localizedString(from: NSNumber(value: value), number: .decimal)
    }
}

struct AnalysisResultPresentation: Equatable {
    var id: String
    var scoreText: String
    var scorePct: Double
    var scoreVerdict: String
    var scoreCaption: String
    var mediaURL: URL?
    var videoURL: URL?
    var detectedPose: DetectedPose?
    var mediaLabel: String
    var recordedLabel: String
    var phaseText: String
    var coachingTarget: String
    var metrics: [AnalysisMetricTile]
    var scoreBreakdown: [AnalysisScoreBreakdownItem]
    var flaws: [AnalysisFlawItem]
    var provenanceSummary: String
    var sourceCoverageText: String
    var sourceCoverageVerdict: String
    var sourceCoverageCaption: String
    var weakestScoreItem: AnalysisScoreBreakdownItem {
        let measured = scoreBreakdown.filter { !$0.isUnavailable }
        return measured.min { $0.scorePct < $1.scorePct }
            ?? scoreBreakdown.first
            ?? AnalysisScoreBreakdownItem(metric: "Form", scoreText: "--", scorePct: 0,
                                          verdict: "UNAVAILABLE",
                                          caption: "No trusted score available.",
                                          detail: "Missing score source",
                                          impact: "High",
                                          source: "missing")
    }
    var releaseHeightText: String { metricValue(label: "RELEASE HEIGHT") }
    var releaseOffsetText: String { metricValue(label: "RELEASE OFFSET") }
    var elbowAngleText: String { metricValue(label: "ELBOW ANGLE") }
    var wristAngleText: String { metricValue(label: "WRIST ANGLE") }
    var formScoreShareText: String {
        "My ShotIQ form score: \(scoreText) (\(scoreVerdict)) from \(mediaLabel.lowercased()) recorded \(recordedLabel)."
    }
    var shotBreakdownShareText: String {
        "My ShotIQ shot breakdown: form score \(scoreText) (\(scoreVerdict)), release offset \(releaseOffsetText), release height \(releaseHeightText)."
    }

    func metricShareText(metric: String, valueText: String) -> String {
        "My ShotIQ \(metric.lowercased()) metric: \(valueText) - form score \(scoreText) (\(scoreVerdict))."
    }

    init(result: ShotIQAnalysisResultDTO) {
        id = result.id
        let formScore = result.scores.form.value ?? result.scores.overall.value
        scoreText = Self.scoreText(formScore)
        scorePct = Self.percent(formScore)
        scoreVerdict = Self.scoreVerdict(formScore, source: result.scores.form.source)
        scoreCaption = result.scores.form.value == nil
            ? "Form score is unavailable until ShotIQ measures enough trusted pose data."
            : "Measured from this saved ShotIQ analysis."
        mediaURL = Self.url(result.media.displayImageUrl)
            ?? Self.url(result.media.annotatedImageUrl)
            ?? Self.url(result.media.imageUrl)
            ?? Self.url(result.media.localImageUrl)
        videoURL = Self.url(result.media.videoUrl)
            ?? Self.url(result.media.localVideoUrl)
        detectedPose = result.pose?.detectedPose
        mediaLabel = result.media.type?.capitalized ?? "Analysis media"
        recordedLabel = Self.recordedLabel(result.recordedAt)
        phaseText = result.phase.value?.replacingOccurrences(of: "-", with: " ").capitalized ?? "Unavailable"
        coachingTarget = Self.coachingTarget(for: result)
        metrics = [
            Self.numericTile(icon: "figure.basketball",
                             label: "RELEASE HEIGHT",
                             metric: "Release Height",
                             value: result.measurements.releaseHeightInches,
                             formatter: Self.feetInches),
            Self.numericTile(icon: "angle",
                             label: "RELEASE OFFSET",
                             metric: "Release",
                             value: result.angles.release,
                             formatter: { Self.degrees($0, signed: true) }),
            Self.numericTile(icon: "point.3.filled.connected.trianglepath.dotted",
                             label: "ELBOW ANGLE",
                             metric: "Elbow",
                             value: result.angles.elbow,
                             formatter: { Self.degrees($0) }),
            Self.numericTile(icon: "point.bottomleft.forward.to.point.topright.scurvepath",
                             label: "WRIST ANGLE",
                             metric: "Wrist",
                             value: result.angles.wrist,
                             formatter: { Self.degrees($0) }),
            Self.numericTile(icon: "scope",
                             label: "CENTERLINE",
                             metric: "Centerline",
                             value: result.measurements.centerlineDeviationDeg,
                             formatter: { Self.degrees($0) }),
            Self.textTile(icon: "viewfinder",
                          label: "PHASE",
                          metric: "Phase",
                          value: result.phase),
        ]
        provenanceSummary = "\(result.provenance.measured.count) measured • \(result.provenance.missing.count) unavailable"
        scoreBreakdown = [
            Self.scoreItem(metric: "Form", value: result.scores.form,
                           caption: "Overall shooting mechanics from this analysis.",
                           detail: "Alignment, posture, release efficiency", impact: "High"),
            Self.scoreItem(metric: "Balance", value: result.scores.balance,
                           caption: "Stability and control through the shot.",
                           detail: "Stability, control, body position", impact: "Medium"),
            Self.scoreItem(metric: "Release", value: result.scores.release,
                           caption: "Release quality from measured shot mechanics.",
                           detail: "Release path, timing, arm position", impact: "High"),
            Self.scoreItem(metric: "Consistency", value: result.scores.consistency,
                           caption: "Repeatability across trusted measurements.",
                           detail: "Repeatability, release control", impact: "High"),
            Self.scoreItem(metric: "Overall", value: result.scores.overall,
                           caption: "Combined result returned by the shared contract.",
                           detail: "Weighted saved analysis score", impact: "High"),
        ]
        flaws = Self.flaws(for: result)
        sourceCoverageText = "\(result.provenance.measured.count)"
        sourceCoverageVerdict = result.provenance.missing.isEmpty ? "COMPLETE" : "PARTIAL"
        sourceCoverageCaption = result.provenance.missing.isEmpty
            ? "All returned fields in this saved analysis are measured."
            : "\(result.provenance.missing.count) fields are unavailable, so ShotIQ leaves them blank instead of filling demo values."
    }

    static let canonicalDemo = AnalysisResultPresentation(
        id: "canonical-demo",
        scoreText: "82",
        scorePct: 0.82,
        scoreVerdict: "GOOD",
        scoreCaption: "Keep building consistency.",
        mediaURL: nil,
        videoURL: nil,
        detectedPose: nil,
        mediaLabel: "Demo media",
        recordedLabel: "Shot 41 • Today at 8:24 AM",
        phaseText: "Release",
        coachingTarget: "Keep elbow stacked through release",
        metrics: [
            AnalysisMetricTile(icon: "figure.basketball", label: "RELEASE HEIGHT", value: "7'8\"", verdict: "EXCELLENT", isPositive: true, detailMetric: "Release Height", detailValue: 0.92, source: "demo"),
            AnalysisMetricTile(icon: "angle", label: "RELEASE ANGLE", value: "52°", verdict: "GOOD", isPositive: true, detailMetric: "Release", detailValue: 0.52, source: "demo"),
            AnalysisMetricTile(icon: "point.3.filled.connected.trianglepath.dotted", label: "ELBOW ALIGNMENT", value: "93%", verdict: "GOOD", isPositive: true, detailMetric: "Elbow", detailValue: 0.93, source: "demo"),
            AnalysisMetricTile(icon: "point.bottomleft.forward.to.point.topright.scurvepath", label: "SHOT ARC", value: "46°", verdict: "GOOD", isPositive: true, detailMetric: "Shot Arc", detailValue: 0.46, source: "demo"),
            AnalysisMetricTile(icon: "scope", label: "SPIN RATE", value: "8.6", verdict: "GOOD", isPositive: true, detailMetric: "Spin Rate", detailValue: 0.86, source: "demo"),
            AnalysisMetricTile(icon: "viewfinder", label: "CENTEREDNESS", value: "92%", verdict: "EXCELLENT", isPositive: true, detailMetric: "Centeredness", detailValue: 0.92, source: "demo"),
        ],
        scoreBreakdown: [
            AnalysisScoreBreakdownItem(metric: "Form", scoreText: "84", scorePct: 0.84, verdict: "GOOD", caption: "Solid mechanics overall.", detail: "Alignment, posture, efficiency", impact: "High", source: "demo"),
            AnalysisScoreBreakdownItem(metric: "Balance", scoreText: "78", scorePct: 0.78, verdict: "GOOD", caption: "Slight lean on the rise.", detail: "Stability, control, body position", impact: "Medium", source: "demo"),
            AnalysisScoreBreakdownItem(metric: "Elbow", scoreText: "72", scorePct: 0.72, verdict: "NEEDS WORK", caption: "Elbow drifts out at load.", detail: "Stack, path, separation", impact: "High", source: "demo"),
            AnalysisScoreBreakdownItem(metric: "Power", scoreText: "86", scorePct: 0.86, verdict: "GOOD", caption: "Strong lower body drive.", detail: "Lower body drive, force transfer", impact: "Medium", source: "demo"),
            AnalysisScoreBreakdownItem(metric: "Consistency", scoreText: "81", scorePct: 0.81, verdict: "GOOD", caption: "Release point is repeatable.", detail: "Repeatability, release control", impact: "High", source: "demo"),
        ],
        flaws: [
            AnalysisFlawItem(rank: 1, title: "ELBOW FLARE", impact: "HIGH IMPACT",
                             description: "Elbow drifts outward during lift, creating inconsistent release path.",
                             confidence: "92%", cta: "Review elbow flare",
                             phase: "RELEASE", trendEnd: "60", source: "demo"),
            AnalysisFlawItem(rank: 2, title: "EARLY WRIST EXTENSION", impact: "MEDIUM IMPACT",
                             description: "Wrist extends too early, reducing arc and consistency.",
                             confidence: "76%", cta: "View history",
                             phase: "RELEASE", trendEnd: "64", source: "demo"),
            AnalysisFlawItem(rank: 3, title: "LOW FOLLOW-THROUGH", impact: "LOW IMPACT",
                             description: "Follow-through finishes below eye level, limiting rotation and hold.",
                             confidence: "58%", cta: "View history",
                             phase: "FOLLOW-THROUGH", trendEnd: "58", source: "demo"),
        ],
        sourceCoverageText: "76%",
        sourceCoverageVerdict: "MODERATE",
        sourceCoverageCaption: "Form is repeatable in games, with room to tighten elbow.",
        provenanceSummary: "canonical screenshot demo")

    static let noResult = AnalysisResultPresentation(
        id: "no-saved-analysis",
        scoreText: "--",
        scorePct: 0,
        scoreVerdict: "UNAVAILABLE",
        scoreCaption: "No saved analysis result has been loaded.",
        mediaURL: nil,
        videoURL: nil,
        detectedPose: nil,
        mediaLabel: "No saved media",
        recordedLabel: "No saved analysis",
        phaseText: "Unavailable",
        coachingTarget: "Analyze a shot to create a coaching target",
        metrics: [
            AnalysisMetricTile(icon: "figure.basketball", label: "RELEASE HEIGHT", value: "--", verdict: "UNAVAILABLE", isPositive: false, detailMetric: "Release Height", detailValue: 0, source: "missing"),
            AnalysisMetricTile(icon: "angle", label: "RELEASE OFFSET", value: "--", verdict: "UNAVAILABLE", isPositive: false, detailMetric: "Release", detailValue: 0, source: "missing"),
            AnalysisMetricTile(icon: "point.3.filled.connected.trianglepath.dotted", label: "ELBOW ANGLE", value: "--", verdict: "UNAVAILABLE", isPositive: false, detailMetric: "Elbow", detailValue: 0, source: "missing"),
            AnalysisMetricTile(icon: "point.bottomleft.forward.to.point.topright.scurvepath", label: "WRIST ANGLE", value: "--", verdict: "UNAVAILABLE", isPositive: false, detailMetric: "Wrist", detailValue: 0, source: "missing"),
            AnalysisMetricTile(icon: "scope", label: "CENTERLINE", value: "--", verdict: "UNAVAILABLE", isPositive: false, detailMetric: "Centerline", detailValue: 0, source: "missing"),
            AnalysisMetricTile(icon: "viewfinder", label: "PHASE", value: "--", verdict: "UNAVAILABLE", isPositive: false, detailMetric: "Phase", detailValue: 0, source: "missing"),
        ],
        scoreBreakdown: [
            AnalysisScoreBreakdownItem(metric: "Form", scoreText: "--", scorePct: 0, verdict: "UNAVAILABLE", caption: "No saved score loaded.", detail: "Missing score source", impact: "High", source: "missing"),
            AnalysisScoreBreakdownItem(metric: "Balance", scoreText: "--", scorePct: 0, verdict: "UNAVAILABLE", caption: "No saved score loaded.", detail: "Missing score source", impact: "Medium", source: "missing"),
            AnalysisScoreBreakdownItem(metric: "Release", scoreText: "--", scorePct: 0, verdict: "UNAVAILABLE", caption: "No saved score loaded.", detail: "Missing score source", impact: "High", source: "missing"),
            AnalysisScoreBreakdownItem(metric: "Consistency", scoreText: "--", scorePct: 0, verdict: "UNAVAILABLE", caption: "No saved score loaded.", detail: "Missing score source", impact: "High", source: "missing"),
            AnalysisScoreBreakdownItem(metric: "Overall", scoreText: "--", scorePct: 0, verdict: "UNAVAILABLE", caption: "No saved score loaded.", detail: "Missing score source", impact: "High", source: "missing"),
        ],
        flaws: [],
        sourceCoverageText: "0",
        sourceCoverageVerdict: "UNAVAILABLE",
        sourceCoverageCaption: "No saved analysis result has been loaded.",
        provenanceSummary: "0 measured • 6 unavailable")

    private init(id: String, scoreText: String, scorePct: Double, scoreVerdict: String,
                 scoreCaption: String, mediaURL: URL?, videoURL: URL?,
                 detectedPose: DetectedPose?, mediaLabel: String,
                 recordedLabel: String, phaseText: String, coachingTarget: String,
                 metrics: [AnalysisMetricTile],
                 scoreBreakdown: [AnalysisScoreBreakdownItem],
                 flaws: [AnalysisFlawItem],
                 sourceCoverageText: String,
                 sourceCoverageVerdict: String,
                 sourceCoverageCaption: String,
                 provenanceSummary: String) {
        self.id = id
        self.scoreText = scoreText
        self.scorePct = scorePct
        self.scoreVerdict = scoreVerdict
        self.scoreCaption = scoreCaption
        self.mediaURL = mediaURL
        self.videoURL = videoURL
        self.detectedPose = detectedPose
        self.mediaLabel = mediaLabel
        self.recordedLabel = recordedLabel
        self.phaseText = phaseText
        self.coachingTarget = coachingTarget
        self.metrics = metrics
        self.scoreBreakdown = scoreBreakdown
        self.flaws = flaws
        self.sourceCoverageText = sourceCoverageText
        self.sourceCoverageVerdict = sourceCoverageVerdict
        self.sourceCoverageCaption = sourceCoverageCaption
        self.provenanceSummary = provenanceSummary
    }

    private static func url(_ raw: String?) -> URL? {
        guard let raw, !raw.isEmpty else { return nil }
        return URL(string: raw)
    }

    private static func percent(_ value: Double?) -> Double {
        guard let value else { return 0 }
        return min(max(value / 100, 0), 1)
    }

    private static func scoreText(_ value: Double?) -> String {
        guard let value else { return "--" }
        return "\(Int(value.rounded()))"
    }

    private static func scoreVerdict(_ value: Double?, source: String) -> String {
        guard let value, source != "missing" else { return "UNAVAILABLE" }
        if source == "estimated" { return "ESTIMATED" }
        if value >= 90 { return "EXCELLENT" }
        if value >= 75 { return "GOOD" }
        return "NEEDS WORK"
    }

    private static func sourceVerdict(_ source: String, value: Double?) -> (String, Bool) {
        guard value != nil, source != "missing" else { return ("UNAVAILABLE", false) }
        if source == "estimated" { return ("ESTIMATED", false) }
        if source == "demo" { return ("DEMO", false) }
        return ("MEASURED", true)
    }

    private static func numericTile(icon: String, label: String, metric: String,
                                    value: AnalysisMetricDTO,
                                    formatter: (Double) -> String) -> AnalysisMetricTile {
        let verdict = sourceVerdict(value.source, value: value.value)
        return AnalysisMetricTile(icon: icon,
                                  label: label,
                                  value: value.value.map(formatter) ?? "--",
                                  verdict: verdict.0,
                                  isPositive: verdict.1,
                                  detailMetric: metric,
                                  detailValue: percent(value.value),
                                  source: value.source)
    }

    private static func textTile(icon: String, label: String, metric: String,
                                 value: AnalysisTextMetricDTO) -> AnalysisMetricTile {
        let hasValue = value.value?.isEmpty == false
        let verdict = hasValue && value.source != "missing" ? value.source.uppercased() : "UNAVAILABLE"
        return AnalysisMetricTile(icon: icon,
                                  label: label,
                                  value: value.value?.uppercased() ?? "--",
                                  verdict: verdict,
                                  isPositive: value.source == "measured",
                                  detailMetric: metric,
                                  detailValue: hasValue ? 1 : 0,
                                  source: value.source)
    }

    private static func scoreItem(metric: String, value: AnalysisMetricDTO,
                                  caption: String, detail: String, impact: String) -> AnalysisScoreBreakdownItem {
        let text = scoreText(value.value)
        let pct = percent(value.value)
        let unavailable = value.value == nil || value.source == "missing"
        return AnalysisScoreBreakdownItem(metric: metric,
                                          scoreText: text,
                                          scorePct: pct,
                                          verdict: scoreVerdict(value.value, source: value.source),
                                          caption: unavailable ? "Unavailable in this saved analysis." : caption,
                                          detail: unavailable ? "Missing score source" : detail,
                                          impact: impact,
                                          source: value.source)
    }

    private static func flaws(for result: ShotIQAnalysisResultDTO) -> [AnalysisFlawItem] {
        var items: [(priority: Int, item: AnalysisFlawItem)] = []

        func confidence(_ metric: AnalysisMetricDTO, fallback: String = "74%") -> String {
            if metric.source == "measured" { return "88%" }
            if metric.source == "estimated" { return "64%" }
            return fallback
        }

        func impact(distance: Double, high: Double) -> String {
            distance >= high ? "HIGH IMPACT" : "MEDIUM IMPACT"
        }

        func add(priority: Int, title: String, impact: String, description: String,
                 confidence: String, cta: String, phase: String, trendEnd: String,
                 source: String) {
            items.append((priority, AnalysisFlawItem(rank: 0,
                                                     title: title,
                                                     impact: impact,
                                                     description: description,
                                                     confidence: confidence,
                                                     cta: cta,
                                                     phase: phase,
                                                     trendEnd: trendEnd,
                                                     source: source)))
        }

        func scoreFlaw(_ title: String, metric: String, value: AnalysisMetricDTO,
                       phase: String) {
            guard let score = value.value, value.source != "missing", score <= 80 else { return }
            let severe = score < 70
            add(priority: severe ? 1 : 2,
                title: "\(title) SCORE GAP",
                impact: severe ? "HIGH IMPACT" : "MEDIUM IMPACT",
                description: "\(metric) score is \(Int(score.rounded())), so this area is lowering the saved form result.",
                confidence: confidence(value, fallback: "70%"),
                cta: "Review \(title.lowercased())",
                phase: phase,
                trendEnd: "\(Int(score.rounded()))",
                source: value.source + ".scores." + title.lowercased())
        }

        scoreFlaw("FORM", metric: "Form", value: result.scores.form,
                  phase: result.phase.value?.uppercased() ?? "RELEASE")
        scoreFlaw("RELEASE", metric: "Release", value: result.scores.release,
                  phase: "RELEASE")
        scoreFlaw("BALANCE", metric: "Balance", value: result.scores.balance,
                  phase: "SETUP")
        scoreFlaw("CONSISTENCY", metric: "Consistency", value: result.scores.consistency,
                  phase: "FOLLOW-THROUGH")

        if let elbow = result.angles.elbow.value, result.angles.elbow.source != "missing",
           elbow < 150 || elbow > 180 {
            let distance = elbow < 150 ? 150 - elbow : elbow - 180
            add(priority: distance >= 15 ? 1 : 2,
                title: "ELBOW ANGLE OUT OF RANGE",
                impact: impact(distance: distance, high: 15),
                description: "Elbow angle is \(degrees(elbow)); target band is 150°-180° for a stacked release.",
                confidence: confidence(result.angles.elbow),
                cta: "Review elbow angle",
                phase: "RELEASE",
                trendEnd: "\(Int(elbow.rounded()))",
                source: result.angles.elbow.source + ".angles.elbow")
        }

        if let wrist = result.angles.wrist.value, result.angles.wrist.source != "missing",
           wrist < 50 || wrist > 100 {
            let distance = wrist < 50 ? 50 - wrist : wrist - 100
            add(priority: distance >= 12 ? 1 : 2,
                title: "WRIST ANGLE OUT OF RANGE",
                impact: impact(distance: distance, high: 12),
                description: "Wrist angle is \(degrees(wrist)); target band is 50°-100° for a controlled release.",
                confidence: confidence(result.angles.wrist),
                cta: "Review wrist angle",
                phase: "RELEASE",
                trendEnd: "\(Int(wrist.rounded()))",
                source: result.angles.wrist.source + ".angles.wrist")
        }

        if let release = result.angles.release.value, result.angles.release.source != "missing",
           abs(release) > 5 {
            let distance = abs(release) - 5
            add(priority: distance >= 8 ? 1 : 2,
                title: "RELEASE PATH DRIFT",
                impact: impact(distance: distance, high: 8),
                description: "Release offset is \(degrees(release, signed: true)); target band is -5° to +5°.",
                confidence: confidence(result.angles.release),
                cta: "Review release path",
                phase: "RELEASE",
                trendEnd: "\(Int(abs(release).rounded()))",
                source: result.angles.release.source + ".angles.release")
        }

        if let centerline = result.measurements.centerlineDeviationDeg.value,
           result.measurements.centerlineDeviationDeg.source != "missing",
           centerline > 3 {
            add(priority: centerline >= 8 ? 1 : 2,
                title: "CENTERLINE DEVIATION",
                impact: impact(distance: centerline, high: 8),
                description: "Centerline deviation is \(degrees(centerline)); target is under 3°.",
                confidence: confidence(result.measurements.centerlineDeviationDeg),
                cta: "Review centerline",
                phase: "RELEASE",
                trendEnd: "\(Int(centerline.rounded()))",
                source: result.measurements.centerlineDeviationDeg.source + ".measurements.centerline")
        }

        if items.isEmpty,
           result.provenance.measured.isEmpty,
           !result.provenance.missing.isEmpty {
            add(priority: 3,
                title: "INSUFFICIENT MEASUREMENT DATA",
                impact: "LOW IMPACT",
                description: "ShotIQ needs a clearer pose or saved backend result before it can rank mechanical flaws.",
                confidence: "0%",
                cta: "Retake analysis",
                phase: "SETUP",
                trendEnd: "0",
                source: "missing.provenance")
        }

        return items
            .sorted { left, right in
                if left.priority != right.priority { return left.priority < right.priority }
                return left.item.title < right.item.title
            }
            .prefix(3)
            .enumerated()
            .map { index, entry in
                var item = entry.item
                item.rank = index + 1
                return item
            }
    }

    private static func feetInches(_ inches: Double) -> String {
        let total = Int(inches.rounded())
        return "\(total / 12)'\(total % 12)\""
    }

    private static func degrees(_ value: Double, signed: Bool = false) -> String {
        let rounded = Int(value.rounded())
        if signed && rounded > 0 { return "+\(rounded)°" }
        return "\(rounded)°"
    }

    private static func recordedLabel(_ raw: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: raw) ?? ISO8601DateFormatter().date(from: raw)
        guard let date else { return raw }
        let out = DateFormatter()
        out.dateFormat = "MMM d • h:mm a"
        return out.string(from: date)
    }

    private static func coachingTarget(for result: ShotIQAnalysisResultDTO) -> String {
        if result.angles.elbow.source == "measured", let elbow = result.angles.elbow.value, elbow < 150 {
            return "Stack elbow higher through release"
        }
        if result.angles.wrist.source == "measured", let wrist = result.angles.wrist.value, wrist < 50 {
            return "Hold wrist set until release"
        }
        if result.measurements.centerlineDeviationDeg.source == "measured",
           let center = result.measurements.centerlineDeviationDeg.value,
           abs(center) > 5 {
            return "Keep release closer to your centerline"
        }
        return "Keep elbow stacked through release"
    }

    private func metricValue(label: String) -> String {
        metrics.first(where: { $0.label == label })?.value ?? "--"
    }
}
