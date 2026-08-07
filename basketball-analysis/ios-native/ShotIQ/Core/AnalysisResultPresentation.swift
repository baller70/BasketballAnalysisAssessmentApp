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

struct AnalysisResultPresentation: Equatable {
    var id: String
    var scoreText: String
    var scorePct: Double
    var scoreVerdict: String
    var scoreCaption: String
    var mediaURL: URL?
    var videoURL: URL?
    var mediaLabel: String
    var recordedLabel: String
    var phaseText: String
    var coachingTarget: String
    var metrics: [AnalysisMetricTile]
    var provenanceSummary: String

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
        videoURL = Self.url(result.media.videoUrl)
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
    }

    static let canonicalDemo = AnalysisResultPresentation(
        id: "canonical-demo",
        scoreText: "82",
        scorePct: 0.82,
        scoreVerdict: "GOOD",
        scoreCaption: "Keep building consistency.",
        mediaURL: nil,
        videoURL: nil,
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
        provenanceSummary: "canonical screenshot demo")

    static let noResult = AnalysisResultPresentation(
        id: "no-saved-analysis",
        scoreText: "--",
        scorePct: 0,
        scoreVerdict: "UNAVAILABLE",
        scoreCaption: "No saved analysis result has been loaded.",
        mediaURL: nil,
        videoURL: nil,
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
        provenanceSummary: "0 measured • 6 unavailable")

    private init(id: String, scoreText: String, scorePct: Double, scoreVerdict: String,
                 scoreCaption: String, mediaURL: URL?, videoURL: URL?, mediaLabel: String,
                 recordedLabel: String, phaseText: String, coachingTarget: String,
                 metrics: [AnalysisMetricTile], provenanceSummary: String) {
        self.id = id
        self.scoreText = scoreText
        self.scorePct = scorePct
        self.scoreVerdict = scoreVerdict
        self.scoreCaption = scoreCaption
        self.mediaURL = mediaURL
        self.videoURL = videoURL
        self.mediaLabel = mediaLabel
        self.recordedLabel = recordedLabel
        self.phaseText = phaseText
        self.coachingTarget = coachingTarget
        self.metrics = metrics
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
}
