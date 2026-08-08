import SwiftUI

// MARK: - Approved ImageGen icons

struct ShotIQApprovedRasterIcon: View {
    var assetName: String
    var size: CGFloat
    var label: String? = nil

    var body: some View {
        Image(assetName)
            .resizable()
            .renderingMode(.original)
            .scaledToFit()
            .accessibilityLabel(label ?? assetName)
            .frame(width: size, height: size)
    }
}

enum ShotIQApprovedIconAsset {}

// ShotIQ bespoke line-art glyph family — the iOS half of the vocabulary that
// lives on the web at `src/components/shotiq/Glyphs.tsx`.
//
// The canonical renders never use a system icon set: every concept gets its own
// small diagram in one family — thin consistent stroke, rounded caps and joins,
// small open circular nodes, dotted guide lines, one tokenised accent colour.
// The sidecar states the same contract:
//
//   iconography.familyId       = "shotiq-motion-glyphs-v1"
//   iconography.grid           = 24
//   iconography.lineCap/Join   = "round"
//   iconography.fillPolicy     = "Outline-led with one intentional filled focal detail."
//   iconography.prohibited     = [..., "generic stick figures", "mixed icon families", ...]
//
// The rule these exist to enforce: **one glyph means exactly one thing.** If a
// second concept needs a mark, draw it a new one — never reuse a shape.

// MARK: - Drawing primitives

/// Keeps the drawn stroke ~1.4–2.0pt whatever box the glyph is set in, so a 56pt
/// diagram is not a blob beside a 20pt row mark. Returned in 24-grid units; the
/// renderer multiplies by the box scale.
func shotiqGlyphStrokeWidth(_ size: CGFloat) -> CGFloat {
    min(1.8, max(0.85, 38 / max(size, 1)))
}

/// One drawn element of a glyph, expressed on the canonical 24x24 grid.
struct ShotIQGlyphMark {
    var path: Path
    var accent = false
    /// Dash pattern in 24-grid units; empty means a solid stroke.
    var dash: [CGFloat] = []
    /// Filled marks are the family's single "intentional filled focal detail".
    var filled = false
    /// Knocks a node out against the page before it is stroked.
    var knockout = false
}

/// Accumulates glyph geometry on the 24x24 grid. Deliberately tiny: every glyph
/// in the family is polylines, nodes, arcs and quadratic curves.
struct ShotIQGlyphPen {
    private(set) var marks: [ShotIQGlyphMark] = []

    mutating func poly(_ pts: [CGPoint], accent: Bool = false, dash: [CGFloat] = []) {
        guard let first = pts.first else { return }
        var p = Path()
        p.move(to: first)
        pts.dropFirst().forEach { p.addLine(to: $0) }
        marks.append(ShotIQGlyphMark(path: p, accent: accent, dash: dash))
    }

    mutating func line(_ x1: CGFloat, _ y1: CGFloat, _ x2: CGFloat, _ y2: CGFloat,
                       accent: Bool = false, dash: [CGFloat] = []) {
        poly([CGPoint(x: x1, y: y1), CGPoint(x: x2, y: y2)], accent: accent, dash: dash)
    }

    /// Open circular node — the family's most repeated motif (tracked landmark).
    mutating func node(_ x: CGFloat, _ y: CGFloat, r: CGFloat = 1.6,
                       accent: Bool = false, filled: Bool = false, knockout: Bool = true) {
        let p = Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2))
        marks.append(ShotIQGlyphMark(path: p, accent: accent, filled: filled,
                                     knockout: knockout && !filled))
    }

    mutating func circle(_ x: CGFloat, _ y: CGFloat, r: CGFloat,
                         accent: Bool = false, dash: [CGFloat] = []) {
        let p = Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2))
        marks.append(ShotIQGlyphMark(path: p, accent: accent, dash: dash))
    }

    mutating func basketball(_ x: CGFloat, _ y: CGFloat, r: CGFloat = 2.2,
                             accent: Bool = true) {
        circle(x, y, r: r, accent: accent)
        line(x - r, y, x + r, y, accent: accent)
        quad(CGPoint(x: x, y: y - r), CGPoint(x: x + r * 0.58, y: y),
             CGPoint(x: x, y: y + r), accent: accent)
        quad(CGPoint(x: x, y: y - r), CGPoint(x: x - r * 0.58, y: y),
             CGPoint(x: x, y: y + r), accent: accent)
    }

    mutating func rect(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat,
                       radius: CGFloat = 1, accent: Bool = false, dash: [CGFloat] = []) {
        let p = Path(roundedRect: CGRect(x: x, y: y, width: w, height: h), cornerRadius: radius)
        marks.append(ShotIQGlyphMark(path: p, accent: accent, dash: dash))
    }

    mutating func quad(_ from: CGPoint, _ control: CGPoint, _ to: CGPoint,
                       accent: Bool = false, dash: [CGFloat] = []) {
        var p = Path()
        p.move(to: from)
        p.addQuadCurve(to: to, control: control)
        marks.append(ShotIQGlyphMark(path: p, accent: accent, dash: dash))
    }

    mutating func arc(_ cx: CGFloat, _ cy: CGFloat, r: CGFloat,
                      from: Double, to: Double, clockwise: Bool = false,
                      accent: Bool = false, dash: [CGFloat] = []) {
        var p = Path()
        p.addArc(center: CGPoint(x: cx, y: cy), radius: r,
                 startAngle: .degrees(from), endAngle: .degrees(to), clockwise: clockwise)
        marks.append(ShotIQGlyphMark(path: p, accent: accent, dash: dash))
    }

    /// Small chevron/arrowhead, used for every directional callout in the family.
    mutating func arrowHead(at tip: CGPoint, from tail: CGPoint, span: CGFloat = 1.9,
                            accent: Bool = false) {
        let dx = tip.x - tail.x, dy = tip.y - tail.y
        let len = max(sqrt(dx * dx + dy * dy), 0.001)
        let ux = dx / len, uy = dy / len
        let bx = tip.x - ux * span, by = tip.y - uy * span
        poly([CGPoint(x: bx - uy * span * 0.62, y: by + ux * span * 0.62),
              tip,
              CGPoint(x: bx + uy * span * 0.62, y: by - ux * span * 0.62)], accent: accent)
    }

    /// The four framing brackets shared by every capture-surface mark.
    mutating func captureBrackets(inset: CGFloat = 3, arm: CGFloat = 4.5, radius: CGFloat = 1.5) {
        let a = inset, b = 24 - inset
        poly([CGPoint(x: a, y: a + arm), CGPoint(x: a, y: a + radius),
              CGPoint(x: a + radius, y: a), CGPoint(x: a + arm, y: a)])
        poly([CGPoint(x: b - arm, y: a), CGPoint(x: b - radius, y: a),
              CGPoint(x: b, y: a + radius), CGPoint(x: b, y: a + arm)])
        poly([CGPoint(x: b, y: b - arm), CGPoint(x: b, y: b - radius),
              CGPoint(x: b - radius, y: b), CGPoint(x: b - arm, y: b)])
        poly([CGPoint(x: a + arm, y: b), CGPoint(x: a + radius, y: b),
              CGPoint(x: a, y: b - radius), CGPoint(x: a, y: b - arm)])
    }
}

/// Renders a pen's marks into a box. Base strokes resolve to the inherited
/// `foregroundStyle`, so a parent can recolour a whole row; the accent colour is
/// passed in and defaults to the ShotIQ orange token.
struct ShotIQGlyph: View {
    private let marks: [ShotIQGlyphMark]
    var size: CGFloat
    var accent: Color
    var label: String?

    init(size: CGFloat = 24,
         accent: Color = ShotIQColor.shotiqOrange,
         label: String? = nil,
         _ build: (inout ShotIQGlyphPen) -> Void) {
        var pen = ShotIQGlyphPen()
        build(&pen)
        self.marks = pen.marks
        self.size = size
        self.accent = accent
        self.label = label
    }

    var body: some View {
        let lineWidth = shotiqGlyphStrokeWidth(size)
        let drawn = marks
        let tint = accent
        Canvas { ctx, box in
            let k = min(box.width, box.height) / 24
            ctx.scaleBy(x: k, y: k)
            for m in drawn {
                let shading: GraphicsContext.Shading = m.accent ? .color(tint) : .foreground
                if m.filled {
                    ctx.fill(m.path, with: shading)
                    continue
                }
                if m.knockout { ctx.fill(m.path, with: .color(ShotIQColor.paper)) }
                ctx.stroke(m.path, with: shading,
                           style: StrokeStyle(lineWidth: lineWidth, lineCap: .round,
                                              lineJoin: .round, dash: m.dash))
            }
        }
        .frame(width: size, height: size)
        // Glyphs are decoration unless the caller names them.
        .accessibilityLabel(label ?? "")
        .accessibilityHidden(label == nil)
    }
}

// MARK: - Shot phases (five genuinely different poses)

/// The five phases of the shot. Canonical draws a different figure for each —
/// the app used to repeat one pose across all five on 14+ screens.
enum ShotPhase: String, CaseIterable {
    case setup, load, rise, release, follow

    /// Normalises the label strings the screens carry ("FOLLOW-THROUGH").
    init(label: String) {
        let k = label.lowercased()
        if k.hasPrefix("setup") { self = .setup }
        else if k.hasPrefix("load") { self = .load }
        else if k.hasPrefix("rise") { self = .rise }
        else if k.hasPrefix("follow") { self = .follow }
        else { self = .release }
    }

    /// Canonical caps label for the phase rail.
    var title: String {
        switch self {
        case .setup: "SETUP"
        case .load: "LOAD"
        case .rise: "RISE"
        case .release: "RELEASE"
        case .follow: "FOLLOW-THROUGH"
        }
    }

    fileprivate func draw(_ p: inout ShotIQGlyphPen, active: Bool) {
        switch self {
        case .setup:
            // Upright, ball carried at the hip — the address position.
            p.circle(9.8, 4.4, r: 2)
            p.line(9.8, 6.4, 10.4, 13.4)
            p.poly([CGPoint(x: 10.4, y: 13.4), CGPoint(x: 8.4, y: 17.4), CGPoint(x: 8, y: 21.4)])
            p.poly([CGPoint(x: 10.4, y: 13.4), CGPoint(x: 12.6, y: 17.4), CGPoint(x: 13.2, y: 21.4)])
            p.poly([CGPoint(x: 10, y: 8.4), CGPoint(x: 12.6, y: 11.4), CGPoint(x: 14.4, y: 12.2)])
            p.basketball(15.4, 12.5, r: 2.3, accent: active)
        case .load:
            // Deep knee bend, ball low and in front — gathering.
            p.circle(8.6, 6.4, r: 2)
            p.line(8.6, 8.4, 10.8, 13)
            p.poly([CGPoint(x: 10.8, y: 13), CGPoint(x: 7.8, y: 16.2), CGPoint(x: 8.6, y: 21.4)])
            p.poly([CGPoint(x: 10.8, y: 13), CGPoint(x: 13.6, y: 16.4), CGPoint(x: 13.6, y: 21.4)])
            p.poly([CGPoint(x: 9.5, y: 10.4), CGPoint(x: 12.2, y: 12.4), CGPoint(x: 14, y: 13.2)])
            p.basketball(15.2, 13.8, r: 2.3, accent: active)
        case .rise:
            // Extending upward, ball at the forehead — the lift.
            p.circle(10.6, 5.6, r: 2)
            p.line(10.6, 7.6, 10.6, 13.6)
            p.poly([CGPoint(x: 10.6, y: 13.6), CGPoint(x: 8.2, y: 17.4), CGPoint(x: 8.6, y: 21.4)])
            p.poly([CGPoint(x: 10.6, y: 13.6), CGPoint(x: 12.8, y: 17.2), CGPoint(x: 13.8, y: 20.8)])
            p.poly([CGPoint(x: 10.6, y: 9), CGPoint(x: 12.8, y: 7.2), CGPoint(x: 14.4, y: 6.5)])
            p.basketball(15.7, 5.8, r: 2.3, accent: active)
        case .release:
            // Full extension, ball leaving the hand overhead.
            p.circle(9.6, 8, r: 2)
            p.line(9.6, 10, 10.4, 15.2)
            p.poly([CGPoint(x: 10.4, y: 15.2), CGPoint(x: 8.4, y: 18.6), CGPoint(x: 8, y: 21.6)])
            p.poly([CGPoint(x: 10.4, y: 15.2), CGPoint(x: 12.8, y: 18.4), CGPoint(x: 13.8, y: 21.4)])
            p.poly([CGPoint(x: 9.9, y: 11), CGPoint(x: 12.4, y: 7.8), CGPoint(x: 13.2, y: 5.4)])
            p.line(13.2, 5.4, 14.1, 6.6, accent: active)
            p.basketball(15.1, 2.8, r: 2.2, accent: active)
        case .follow:
            // Arm held out long with the wrist relaxed — the ball is gone.
            p.circle(9.6, 7, r: 2)
            p.line(9.6, 9, 10.4, 14.8)
            p.poly([CGPoint(x: 10.4, y: 14.8), CGPoint(x: 8.4, y: 18.6), CGPoint(x: 8, y: 21.4)])
            p.poly([CGPoint(x: 10.4, y: 14.8), CGPoint(x: 13, y: 18.4), CGPoint(x: 14, y: 21.2)])
            p.poly([CGPoint(x: 9.9, y: 10.2), CGPoint(x: 13.2, y: 6.4), CGPoint(x: 16.6, y: 4.8)])
            p.line(16.6, 4.8, 17.2, 7.2, accent: active)
            p.quad(CGPoint(x: 17.6, y: 3.2), CGPoint(x: 20.2, y: 2.2), CGPoint(x: 20.6, y: 5),
                   accent: active, dash: [1.4, 1.6])
            p.basketball(21.1, 4.7, r: 1.5, accent: active)
        }
    }
}

/// Shot-phase pose. Five genuinely different figures, one per phase.
struct PhaseGlyph: View {
    var phase: ShotPhase = .release
    var active = false
    var size: CGFloat = 30

    init(phase: ShotPhase = .release, active: Bool = false, size: CGFloat = 30) {
        self.phase = phase
        self.active = active
        self.size = size
    }

    /// Convenience for the screens that carry the phase as a caps label.
    init(phase: String, active: Bool = false, size: CGFloat = 30) {
        self.init(phase: ShotPhase(label: phase), active: active, size: size)
    }

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: phase),
                                 size: size,
                                 label: phase.title)
    }
}

extension ShotIQApprovedIconAsset {
    static func assetName(for phase: ShotPhase) -> String {
        switch phase {
        case .setup: return "shotiq-approved-phase-setup"
        case .load: return "shotiq-approved-phase-load"
        case .rise: return "shotiq-approved-phase-rise"
        case .release: return "shotiq-approved-phase-release"
        case .follow: return "shotiq-approved-phase-follow"
        }
    }
}

// MARK: - Capture sources

/// Where a clip comes from. Canonical draws three unrelated diagrams here; the
/// app used to draw a photo/film/broadcast triple from the system set.
enum CaptureSource {
    /// Bracketed node polyline — a framed still with tracked landmarks on it.
    case uploadImage
    /// Court-rail diagram — a strip of frames on a rail with the marked frame.
    case uploadVideo
    /// Bracketed node figure — a live subject inside the capture reticle.
    case liveCamera
}

struct CaptureSourceGlyph: View {
    var source: CaptureSource
    var size: CGFloat = 26
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: source),
                                 size: size,
                                 label: label)
    }
}

extension ShotIQApprovedIconAsset {
    static func assetName(for source: CaptureSource) -> String {
        switch source {
        case .liveCamera: return "shotiq-approved-ui-live-camera"
        case .uploadVideo: return "shotiq-approved-ui-upload-video"
        case .uploadImage: return "shotiq-approved-ui-analytics-upload"
        }
    }
}

extension CaptureSource {
    /// Resolves a canonical capture-source label onto its diagram.
    init?(sourceLabel: String) {
        let k = sourceLabel.lowercased()
        switch true {
        case k.contains("image") || k.contains("photo") || k.contains("frame"): self = .uploadImage
        case k.contains("video") || k.contains("footage") || k.contains("clip"): self = .uploadVideo
        case k.contains("live") || k.contains("camera") || k.contains("record"): self = .liveCamera
        default: return nil
        }
    }
}

/// The capture reticle — canonical's mark for "analyze a shot". Deliberately the
/// same geometry as the Home tab mark, because it is the same concept.
struct CaptureReticleGlyph: View {
    var size: CGFloat = 22
    var label: String? = nil
    var body: some View {
        ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-target-reticle",
                                 size: size,
                                 label: label)
    }
}

// MARK: - Measurement diagrams

/// One diagram per measurable quantity. Never share a kind between two metrics.
enum MechanicKind {
    case elbowAngle, wristArc, releaseHeight, distance, jump, ballArc
    case centerline, balance, drift, impact, tempo, consistency
    /// Apex of the flight path measured off the floor — canonical 041 "ARC HEIGHT".
    /// Distinct from `releaseHeight` (a standing ruler) and from `ballArc`.
    case arcHeight
    /// The launch wedge at the hand — canonical 041 "RELEASE ANGLE", 070
    /// "Release angle". A protractor corner, never a parabola.
    case releaseAngle
    /// Rotation on the ball — canonical 041 "SIDE SPIN", 053 "Backspin".
    case spin
    /// Dotted flight path between two timing nodes — canonical 041 "FLIGHT TIME".
    case flightTime
    /// Plan-view left/right deviation of the shot — canonical 070 "Shot shape".
    case shotShape
    /// Straight vertical release path, distinct from flight arc.
    case releasePath
}

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: MechanicKind) -> String {
        switch kind {
        case .elbowAngle:
            return "shotiq-approved-mechanics-elbow-under-ball"
        case .wristArc:
            return "shotiq-approved-mechanics-wrist-over-elbow"
        case .releasePath:
            return "shotiq-approved-mechanics-elbow-stack"
        case .releaseHeight:
            return "shotiq-approved-mechanics-release-height"
        case .distance:
            return "shotiq-approved-mechanics-spot-ruler"
        case .impact:
            return "shotiq-approved-ui-target-reticle"
        case .jump:
            return "shotiq-approved-mechanics-shot-path-runner"
        case .ballArc, .arcHeight, .flightTime:
            return "shotiq-approved-mechanics-ball-speed"
        case .releaseAngle:
            return "shotiq-approved-mechanics-release-angle"
        case .shotShape:
            return "shotiq-approved-mechanics-shot-path-bounce"
        case .centerline:
            return "shotiq-approved-mechanics-body-centerline"
        case .balance:
            return "shotiq-approved-mechanics-balance-archetype"
        case .drift:
            return "shotiq-approved-mechanics-shot-path-bounce"
        case .tempo:
            return "shotiq-approved-ui-performance-gauge"
        case .consistency:
            return "shotiq-approved-ui-progress-line"
        case .spin:
            return "shotiq-approved-mechanics-backspin"
        }
    }
}

struct MechanicGlyph: View {
    var kind: MechanicKind
    var size: CGFloat = 22
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

extension MechanicKind {
    /// Resolves a canonical metric label onto its own diagram, so a screen that
    /// lists five mechanics prints five different marks.
    init(metricLabel: String) {
        let k = metricLabel.lowercased()
        switch true {
        // Ordered longest-concept-first: "arc height" is neither `.releaseHeight`
        // (which "height" alone would pick) nor `.ballArc` (which "arc" would),
        // and "release angle" is not "elbow angle". Every arm below reaches a
        // different diagram — that is the whole contract of this resolver.
        case k.contains("arc height") || k.contains("apex"): self = .arcHeight
        case k.contains("shot shape") || k.contains("shape"): self = .shotShape
        case k.contains("spin"): self = .spin
        case k.contains("flight") || k.contains("hang"): self = .flightTime
        case k.contains("elbow"): self = .elbowAngle
        case k.contains("wrist") || k.contains("snap"): self = .wristArc
        case k.contains("release angle") || k.contains("launch"): self = .releaseAngle
        case k.contains("height"): self = .releaseHeight
        case k.contains("release path") || k.contains("shot path") || k.contains("straight path"):
            self = .releasePath
        case k.contains("angle") || k.contains("arc"): self = .ballArc
        // Before the balance arm: "distance" *contains* "stance", so
        // "RELEASE DISTANCE" on 051 was resolving to the balance diagram and
        // colliding with that screen's own BALANCE row.
        case k.contains("distance") || k.contains("range") || k.contains("depth"):
            self = .distance
        case k.contains("balance") || k.contains("base") || k.contains("stance")
            || k.contains("foot") || k.contains("knee") || k.contains("dip"): self = .balance
        case k.contains("lean") || k.contains("drift") || k.contains("align")
            || k.contains("flare"): self = .drift
        case k.contains("center") || k.contains("centre") || k.contains("midline")
            || k.contains("line"): self = .centerline
        case k.contains("jump") || k.contains("lift") || k.contains("rise")
            || k.contains("extension"): self = .jump
        case k.contains("speed") || k.contains("tempo") || k.contains("quick")
            || k.contains("time") || k.contains("rhythm"): self = .tempo
        case k.contains("consistency") || k.contains("repeat") || k.contains("stack"):
            self = .consistency
        default: self = .impact
        }
    }
}

extension FlawKind {
    /// Resolves a detected-flaw label onto its portrait.
    init(flawLabel: String) {
        let k = flawLabel.lowercased()
        switch true {
        case k.contains("elbow"): self = .elbow
        case k.contains("wrist"): self = .wrist
        case k.contains("guide") || k.contains("thumb"): self = .guideHand
        case k.contains("lean") || k.contains("base") || k.contains("balance")
            || k.contains("foot") || k.contains("stance"): self = .base
        default: self = .release
        }
    }
}

extension WorkoutKind {
    /// Resolves a drill name onto its family mark.
    init(drillName: String) {
        let k = drillName.lowercased()
        switch true {
        case k.contains("release") || k.contains("quick") || k.contains("snap"): self = .release
        case k.contains("ladder") || k.contains("series") || k.contains("progression")
            || k.contains("set") || k.contains("range"): self = .ladder
        default: self = .flow
        }
    }
}

extension ReadinessKind {
    /// Resolves a capture-context heading onto its check mark.
    init(contextLabel: String) {
        let k = contextLabel.lowercased()
        switch true {
        case k.contains("light") || k.contains("expos"): self = .lighting
        case k.contains("angle") || k.contains("frame") || k.contains("view")
            || k.contains("distance") || k.contains("position"): self = .framing
        case k.contains("stab") || k.contains("shake") || k.contains("tripod")
            || k.contains("motion") || k.contains("fps") || k.contains("speed"): self = .stability
        default: self = .athlete
        }
    }
}

// MARK: - Node cue diagrams

/// Canonical's dominant motif on coaching cards: a skeleton fragment drawn as
/// nodes and links. Each kind is a different fragment, so no two cues share one.
enum CueKind { case peak, apex, shoulders, extensionLine, base, tree }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: CueKind) -> String {
        switch kind {
        case .peak: return "shotiq-approved-v2-cue-peak"
        case .apex: return "shotiq-approved-v2-cue-apex"
        case .shoulders: return "shotiq-approved-v2-cue-shoulders"
        case .extensionLine: return "shotiq-approved-v2-cue-extension"
        case .base: return "shotiq-approved-v2-cue-base"
        case .tree: return "shotiq-approved-v2-cue-tree"
        }
    }
}

struct CueGlyph: View {
    var kind: CueKind
    var size: CGFloat = 26
    var accent: Color = ShotIQColor.confirmGreen
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

// MARK: - Coaching corrections

/// A figure demonstrating the fix, not the fault.
enum CorrectionKind { case stack, square, drive }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: CorrectionKind) -> String {
        switch kind {
        case .stack: return "shotiq-approved-mechanics-elbow-stack"
        case .square: return "shotiq-approved-ui-target-reticle"
        case .drive: return "shotiq-approved-mechanics-shot-path-runner"
        }
    }
}

struct CorrectionGlyph: View {
    var kind: CorrectionKind
    var size: CGFloat = 22
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

// MARK: - Flaw portraits

/// Side-on figure with the flawed segment picked out in the alert colour — the
/// ~56pt diagram canonical prints on each top-flaw card.
enum FlawKind { case elbow, wrist, release, base, guideHand }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: FlawKind) -> String {
        switch kind {
        case .elbow: return "shotiq-approved-v2-flaw-elbow"
        case .wrist: return "shotiq-approved-v2-flaw-wrist"
        case .release: return "shotiq-approved-v2-flaw-release"
        case .base: return "shotiq-approved-v2-flaw-base"
        case .guideHand: return "shotiq-approved-v2-flaw-guide"
        }
    }
}

struct FlawFigure: View {
    var kind: FlawKind
    var size: CGFloat = 56
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

// MARK: - Stat-chip marks

/// The marks canonical prints beside a headline number. One per statistic.
enum StatMarkKind {
    /// Hexagon carrying a ball — the points token.
    case points
    /// Dotted gauge arc with the scored needle — the form score.
    case formScore
    /// Filmstrip with sprockets — sessions captured, i.e. the day streak.
    case dayStreak
    /// Stacked rails — shots taken.
    case volume
    /// Target with a struck centre — the accuracy *rate*.
    case accuracy
    /// Rim and net seen face on — makes, i.e. a count of balls that went in.
    /// Distinct from `.accuracy` (a rate) and from `.volume` (attempts): 069
    /// printed one mark for MAKES and MAKE %, and 062 printed near-identical
    /// rings for SHOTS and MAKES.
    case makes
    /// Ring with the made share swept out — a percentage, not a count.
    case makePercent
    /// Rising node line with the gained step accented — points *earned* in a
    /// session, against `.points` which is the lifetime token.
    case pointsEarned
}

struct StatMarkGlyph: View {
    var kind: StatMarkKind
    var size: CGFloat = 20
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    /// The single resolver from a canonical stat caption to its mark. Every
    /// screen that prints a stat strip goes through this one function, so the
    /// same statistic cannot pick up two marks on two screens and — more to the
    /// point — two statistics cannot end up sharing one. The arms are ordered
    /// so that a longer caption is tested before any caption it contains
    /// ("POINTS EARNED" before "POINTS", "MAKE %" before "MAKE").
    static func kind(forStatLabel label: String) -> StatMarkKind? {
        let k = label.uppercased()
        switch true {
        case k.contains("STREAK"): return .dayStreak
        case k.contains("EARNED") || k.contains("GAINED"): return .pointsEarned
        case k.contains("POINT"): return .points
        case k.contains("FORM SCORE") || k.contains("SCORE"): return .formScore
        case k.contains("MAKE %") || k.contains("MAKE%") || k.contains("PCT")
            || k.contains("FG%"): return .makePercent
        case k.contains("ACCURACY") || k.contains("SHOOTING %"): return .accuracy
        case k.contains("MAKE") || k.contains("MADE"): return .makes
        case k.contains("SHOT") || k.contains("ATTEMPT") || k.contains("REP"): return .volume
        default: return nil
        }
    }

    private var approvedAssetName: String {
        switch kind {
        case .points: return "shotiq-approved-ui-badge-target"
        case .formScore: return "shotiq-approved-ui-performance-gauge"
        case .dayStreak: return "shotiq-approved-ui-calendar-heat"
        case .volume: return "shotiq-approved-v2-stat-volume"
        case .accuracy: return "shotiq-approved-ui-target-reticle"
        case .makes: return "shotiq-approved-v2-stat-makes"
        case .makePercent: return "shotiq-approved-v2-stat-make-percent"
        case .pointsEarned: return "shotiq-approved-ui-progress-line"
        }
    }

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: approvedAssetName,
                                 size: size,
                                 label: label)
    }
}

// MARK: - Workout marks

/// Scheduled-workout marks — one shape per drill family.
enum WorkoutKind { case release, ladder, flow }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: WorkoutKind) -> String {
        switch kind {
        case .release: return "shotiq-approved-phase-release"
        case .ladder: return "shotiq-approved-ui-ladder-balls"
        case .flow: return "shotiq-approved-mechanics-routine-refresh"
        }
    }
}

struct WorkoutGlyph: View {
    var kind: WorkoutKind
    var size: CGFloat = 20
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

// MARK: - Capture readiness

/// Capture-readiness checks — bracketed framing marks, one per check.
enum ReadinessKind { case athlete, framing, lighting, stability }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: ReadinessKind) -> String {
        switch kind {
        case .athlete: return "shotiq-approved-mechanics-routine-refresh"
        case .framing: return "shotiq-approved-mechanics-capture-frame"
        case .lighting: return "shotiq-approved-mechanics-environment-light"
        case .stability: return "shotiq-approved-mechanics-camera-position"
        }
    }
}

struct ReadinessGlyph: View {
    var kind: ReadinessKind
    var size: CGFloat = 24
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

// MARK: - Equipment and setup

enum EquipmentKind { case basketball, cones, spot, location }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: EquipmentKind) -> String {
        switch kind {
        case .basketball: return "shotiq-approved-mechanics-ball-speed"
        case .cones: return "shotiq-approved-mechanics-cones"
        case .spot: return "shotiq-approved-mechanics-spot-ruler"
        case .location: return "shotiq-approved-mechanics-location-pin"
        }
    }
}

struct EquipmentGlyph: View {
    var kind: EquipmentKind
    var size: CGFloat = 24
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

extension EquipmentKind {
    init?(equipmentLabel: String) {
        let k = equipmentLabel.lowercased()
        switch true {
        case k.contains("basketball") || shotiqLabelHasWord(k, "ball"): self = .basketball
        case k.contains("cone"): self = .cones
        case k.contains("spot") || k.contains("free throw") || k.contains("line"): self = .spot
        case k.contains("location") || k.contains("court"): self = .location
        default: return nil
        }
    }
}

// MARK: - Tab-bar marks

/// The five bottom-tab marks. Canonical draws a capture reticle for Home, a node
/// graph for Capture, a rail for Train, a rising node arc for Progress and the
/// player's initials for Profile — five unrelated shapes.
enum NavMark { case home, capture, train, progress }

extension ShotIQApprovedIconAsset {
    static func assetName(for mark: NavMark) -> String {
        switch mark {
        case .home: return "shotiq-approved-ui-target-reticle"
        case .capture: return "shotiq-approved-ui-pose-shooter"
        case .train: return "shotiq-approved-ui-ladder-balls"
        case .progress: return "shotiq-approved-ui-progress-line"
        }
    }
}

struct NavGlyph: View {
    var mark: NavMark
    var size: CGFloat = 22
    var active = false

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: mark),
                                 size: size,
                                 label: nil)
    }
}

// MARK: - Dominant hand

/// Canonical 011 draws the two hands as *mirrored* node constellations inside
/// half-brackets: right-handed opens its brackets to the left and carries the
/// accent nodes on the right, left-handed is the exact reflection. The shipped
/// screen used `point.3.filled.connected...` against `point.3.connected...`,
/// two SF marks that differ only in whether three dots are filled — which is
/// what both graders read as "left and right render the same".
enum HandKind { case right, left }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: HandKind) -> String {
        switch kind {
        case .right: return "shotiq-approved-v2-hand-right"
        case .left: return "shotiq-approved-v2-hand-left"
        }
    }
}

struct HandGlyph: View {
    var kind: HandKind
    var size: CGFloat = 30
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

extension HandKind {
    /// Resolves "Right", "RIGHT-HANDED", "Left-handed" onto the matching mark.
    init(handLabel: String) {
        self = handLabel.lowercased().contains("left") ? .left : .right
    }
}

// MARK: - Body measurements

/// Canonical 009 and 070 draw one measuring instrument per measured quantity:
/// a bracketed tick scale for age, a vertical rule for height, a beam for
/// weight, an arms-out figure for wingspan. The shipped screens routed all four
/// through `MechanicKind(metricLabel:)`, where only "height" matched — so
/// WEIGHT, WINGSPAN and AGE all fell to `.impact`, and HEIGHT collided with
/// RELEASE HEIGHT.
enum BodyMetricKind { case age, height, weight, wingspan }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: BodyMetricKind) -> String {
        switch kind {
        case .age: return "shotiq-approved-v2-body-age"
        case .height: return "shotiq-approved-v2-body-height"
        case .weight: return "shotiq-approved-v2-body-weight"
        case .wingspan: return "shotiq-approved-v2-body-wingspan"
        }
    }
}

struct BodyMetricGlyph: View {
    var kind: BodyMetricKind
    var size: CGFloat = 22
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

/// Whole-word containment. Substring matching is how this family acquired its
/// duplicates: "di-STANCE" resolved to the balance diagram and collided with
/// 051's own BALANCE row, and "im-AGE" would have given "Upload image" the age
/// ruler. Anything short enough to hide inside another word is matched as a
/// word, not as a substring.
func shotiqLabelHasWord(_ label: String, _ word: String) -> Bool {
    label.lowercased()
        .split(whereSeparator: { !$0.isLetter && !$0.isNumber })
        .contains(Substring(word))
}

extension BodyMetricKind {
    /// Resolves a canonical measurement label. Returns nil when the label is not
    /// a body measurement, so the caller can fall through to `MechanicKind`
    /// rather than being handed a wrong instrument.
    init?(measurementLabel: String) {
        let k = measurementLabel.lowercased()
        // "release height" is a shot mechanic, not a body measurement — it must
        // reach `MechanicKind.releaseHeight` and keep its own diagram.
        if k.contains("release") { return nil }
        switch true {
        case shotiqLabelHasWord(k, "age") || k.contains("birth"): self = .age
        case k.contains("wingspan") || shotiqLabelHasWord(k, "reach")
            || shotiqLabelHasWord(k, "span"): self = .wingspan
        case k.contains("weight") || shotiqLabelHasWord(k, "mass")
            || shotiqLabelHasWord(k, "lbs"): self = .weight
        case k.contains("height") || shotiqLabelHasWord(k, "tall"): self = .height
        default: return nil
        }
    }
}

// MARK: - Shot types

/// How the shot was created. Canonical 053 prints four unrelated node paths
/// across SHOT BREAKDOWN; the shipped screen routed all four labels through
/// `MechanicKind(metricLabel:)`, none matched, and all four fell to `.impact` —
/// the "four identical marks" both graders named.
enum ShotTypeKind { case catchShoot, pullUp, offDribble, stepBack, other }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: ShotTypeKind) -> String {
        switch kind {
        case .catchShoot: return "shotiq-approved-v2-shot-catch-shoot"
        case .pullUp: return "shotiq-approved-v2-shot-pull-up"
        case .offDribble: return "shotiq-approved-v2-shot-off-dribble"
        case .stepBack: return "shotiq-approved-v2-shot-step-back"
        case .other: return "shotiq-approved-v2-shot-other"
        }
    }
}

struct ShotTypeGlyph: View {
    var kind: ShotTypeKind
    var size: CGFloat = 26
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

extension ShotTypeKind {
    /// Resolves a canonical shot-type label. Nil when the string is not a shot
    /// type, so callers keep their own mark instead of being given a wrong one.
    init?(shotTypeLabel: String) {
        let k = shotTypeLabel.lowercased()
        switch true {
        case k.contains("catch"): self = .catchShoot
        case k.contains("pull"): self = .pullUp
        case k.contains("dribble"): self = .offDribble
        case k.contains("step back") || k.contains("step-back") || k.contains("stepback"):
            self = .stepBack
        case k == "other" || k.contains("other shot"): self = .other
        default: return nil
        }
    }
}

// MARK: - Athletic ability

/// Canonical 011 grades ability as one node arc over a tick rail, with the arc
/// rising and the rail marker advancing across the three cards. The shipped
/// screen used `figure.walk` / `figure.run` / `figure.basketball` — three
/// different families, and `figure.basketball` again for seven other concepts.
/// Five grades, because canonical 010 offers five and they must not share a
/// mark. The three original values keep their exact geometry so no screen that
/// already draws them shifts; the two new ones interleave.
enum AbilityKind { case developing, intermediate, advanced, elite, professional }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: AbilityKind) -> String {
        switch kind {
        case .developing: return "shotiq-approved-v2-ability-developing"
        case .intermediate: return "shotiq-approved-v2-ability-intermediate"
        case .advanced: return "shotiq-approved-v2-ability-advanced"
        case .elite: return "shotiq-approved-v2-ability-elite"
        case .professional: return "shotiq-approved-v2-ability-professional"
        }
    }
}

struct AbilityGlyph: View {
    var kind: AbilityKind
    var size: CGFloat = 30
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

extension AbilityKind {
    init?(abilityLabel: String) {
        let k = abilityLabel.lowercased()
        switch true {
        case k.contains("develop") || k.contains("beginner") || k.contains("new"):
            self = .developing
        // "intermediate" and "advanced" used to fold into one mark, as did
        // "elite" and "pro" — so canonical 010's five tiers drew as three, with
        // two adjacent pairs identical. Order matters: the more specific tier is
        // tested before the one whose word it would otherwise be caught by.
        case k.contains("intermediate") || k.contains("consistent"):
            self = .intermediate
        case k.contains("advanced"): self = .advanced
        case k.contains("elite"): self = .elite
        case k.contains("pro"): self = .professional
        default: return nil
        }
    }
}

// MARK: - Measured angle

/// A protractor reading a *specific* angle. Canonical 011 (COMPACT / BALANCED /
/// HIGH ARC) and 047 (YOUR ANGLE vs IDEAL RANGE) both compare angles side by
/// side, so the mark has to carry the value: two figures at the same degrees
/// would be the same mark, and that is correct — two figures at different
/// degrees must not be. The shipped 047 drew `figure.basketball` twice.
struct AngleWedgeGlyph: View {
    /// Degrees above the horizontal, measured anticlockwise from the +x axis.
    var degrees: Double
    var size: CGFloat = 34
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            let origin = CGPoint(x: 4.5, y: 19.5)
            let reach: CGFloat = 15.5
            let theta = degrees * .pi / 180
            let tip = CGPoint(x: origin.x + reach * CGFloat(cos(theta)),
                              y: origin.y - reach * CGFloat(sin(theta)))
            p.line(origin.x, origin.y, origin.x + reach, origin.y)
            p.line(origin.x, origin.y, tip.x, tip.y)
            p.arc(origin.x, origin.y, r: 6.4, from: -degrees, to: 0, accent: true)
            p.node(origin.x, origin.y, r: 1.5, accent: true, filled: true)
            p.node(tip.x, tip.y, r: 1.5)
        }
    }
}

// MARK: - Supported media formats

/// Canonical 022 gives each accepted container its own bracketed mark. The
/// shipped screen printed the same filled `photo` symbol for JPG, PNG and HEIC.
enum MediaFormatKind { case mp4, mov, jpg, png, heic }

extension ShotIQApprovedIconAsset {
    static func assetName(for kind: MediaFormatKind) -> String {
        switch kind {
        case .mp4: return "shotiq-approved-v2-media-mp4"
        case .mov: return "shotiq-approved-v2-media-mov"
        case .jpg: return "shotiq-approved-v2-media-jpg"
        case .png: return "shotiq-approved-v2-media-png"
        case .heic: return "shotiq-approved-v2-media-heic"
        }
    }
}

struct MediaFormatGlyph: View {
    var kind: MediaFormatKind
    var size: CGFloat = 24
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                 size: size,
                                 label: label)
    }
}

extension MediaFormatKind {
    init?(formatLabel: String) {
        switch formatLabel.uppercased() {
        case "MP4": self = .mp4
        case "MOV": self = .mov
        case "JPG", "JPEG": self = .jpg
        case "PNG": self = .png
        case "HEIC", "HEIF": self = .heic
        default: return nil
        }
    }
}

// MARK: - Release hand

/// The ~44pt hand illustration canonical 041 prints beside the release-angle
/// callout: forearm, relaxed fingers, and the measured wrist break dotted in.
/// The shipped screen used `hand.point.up.left`, a filled cartoon hand that both
/// graders called out by name.
struct ReleaseHandGlyph: View {
    var size: CGFloat = 44
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-release-hand",
                                 size: size,
                                 label: label)
    }
}

// MARK: - Coaching target

/// The bracketed cue mark canonical prints on every "PRIMARY TARGET" and
/// "COACHING TAKEAWAY" row (011, 017, 030, 062): capture brackets around a
/// short node path with one accented segment. The shipped screens printed
/// `camera.metering.center.weighted` here — the same symbol they also used for
/// the Home tab, "Analyze video", "Set up camera" and six other concepts.
struct CoachingTargetGlyph: View {
    var size: CGFloat = 28
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-coaching-target",
                                 size: size,
                                 label: label)
    }
}

extension ShotIQApprovedIconAsset {
    static func assetName(forSystemFallback fallback: String) -> String {
        let k = fallback.lowercased()
        switch true {
        case k.contains("film") || k.contains("video") || k.contains("play"):
            return "shotiq-approved-ui-upload-video"
        case k.contains("camera") || k.contains("viewfinder") || k.contains("scope"):
            return "shotiq-approved-ui-target-reticle"
        case k.contains("chart") || k.contains("trend") || k.contains("progress"):
            return "shotiq-approved-ui-progress-line"
        case k.contains("point.3") || k.contains("connected") || k.contains("node"):
            return "shotiq-approved-ui-pose-shooter"
        case k.contains("ruler") || k.contains("measure"):
            return "shotiq-approved-v2-onboarding-measurements"
        case k.contains("person") || k.contains("profile"):
            return "shotiq-approved-v2-onboarding-profile"
        case k.contains("calendar"):
            return "shotiq-approved-ui-calendar-heat"
        case k.contains("hexagon") || k.contains("point"):
            return "shotiq-approved-ui-badge-target"
        case k.contains("trash"):
            return "shotiq-approved-v2-ui-trash"
        case k.contains("share"):
            return "shotiq-approved-v2-ui-share"
        case k.contains("upload") || k.contains("arrow.down") || k.contains("arrow.up"):
            return "shotiq-approved-v2-ui-upload"
        case k.contains("gear") || k.contains("setting") || k.contains("slider"):
            return "shotiq-approved-v2-ui-settings"
        case k.contains("check"):
            return "shotiq-approved-v2-ui-check-ring"
        case k.contains("warning") || k.contains("exclamation"):
            return "shotiq-approved-v2-ui-warning"
        default:
            return "shotiq-approved-v2-coaching-target"
        }
    }
}

// MARK: - Concept resolver

/// Resolves a row's own caption onto the one bespoke mark for that concept, or
/// to nothing when the family has no mark for it.
///
/// This exists because of how the duplicate marks got in. The screens carried an
/// SF Symbol name per row, hand-picked, and three names —
/// `camera.metering.center.weighted`, `point.3.connected.trianglepath.dotted`
/// and `figure.basketball` — ended up standing in for about thirty unrelated
/// concepts between them: the Home tab, "Analyze video", "Set up camera",
/// "Sign in", "TRAIN", "Conditioning", "MAKES", "SHOT SHAPE", "ELITE",
/// "LEFT-HANDED" and so on. Choosing from the caption instead makes that class
/// of mistake unrepresentable: one concept, one mark.
///
/// Returning `nil` is a first-class answer. Where canonical has no bespoke mark
/// for something (a chevron, a share tray, a lock) the caller keeps its system
/// symbol — forcing a wrong diagram on it would trade one duplicate for another.
enum ShotIQConcept {
    case shotType(ShotTypeKind)
    case hand(HandKind)
    case body(BodyMetricKind)
    case ability(AbilityKind)
    case source(CaptureSource)
    case readiness(ReadinessKind)
    case mechanic(MechanicKind)
    case phase(ShotPhase)
    case stat(StatMarkKind)
    case nav(NavMark)
    case workout(WorkoutKind)
    case cue(CueKind)
    case equipment(EquipmentKind)
    case coachingTarget
    case captureReticle

    /// Ordered most-specific first. Every arm reaches a different diagram.
    static func resolve(_ caption: String) -> ShotIQConcept? {
        let k = caption.lowercased()

        // 1. Named entities that own a whole family.
        if k.contains("handed") { return .hand(HandKind(handLabel: caption)) }
        if let s = ShotTypeKind(shotTypeLabel: caption) { return .shotType(s) }

        // 2. Shot phases, before mechanics — "follow-through" is a phase, and
        //    routing it through the metric table would drop it on `.impact`.
        if k.contains("follow-through") || k.contains("follow through") { return .phase(.follow) }
        if k == "setup" || k == "load" || k == "rise" || k == "release phase" {
            return .phase(ShotPhase(label: caption))
        }

        // 3. Measured quantities.
        if let b = BodyMetricKind(measurementLabel: caption) { return .body(b) }
        if k.contains("elbow") || k.contains("wrist") || k.contains("release height")
            || k.contains("release angle") || k.contains("arc height") || k.contains("spin")
            || k.contains("centered") || k.contains("centre") || k.contains("balance")
            || k.contains("flight") || k.contains("tempo") || k.contains("consistency")
            || k.contains("shot shape") || k.contains("alignment") || k.contains("flexion") {
            return .mechanic(MechanicKind(metricLabel: caption))
        }

        // 3b. Ball path. 057's TARGET MECHANICS lists ELBOW STACK, WRIST
        //     ALIGNMENT and RELEASE PATH side by side, so the third needs its
        //     own diagram rather than falling through to a system symbol.
        if k.contains("release path") || k.contains("shot path") || k.contains("straight path") {
            return .mechanic(.releasePath)
        }

        // 4. Where media comes from. "Take photo" is a live capture and
        //    "Choose from library" is a stored still — matching on the word
        //    "photo" alone would give 022's two rows the same mark.
        if k.contains("live camera") || k.contains("record live")
            || k.contains("take photo") || k.contains("take a photo") {
            return .source(.liveCamera)
        }
        if k.contains("upload video") || k.contains("choose video") { return .source(.uploadVideo) }
        if k.contains("upload image") || k.contains("upload photo")
            || k.contains("library") { return .source(.uploadImage) }

        // 5. Capture readiness checks. 017's four-row checklist and 030's
        //    setup rows each need four different bracket marks.
        if k.contains("in frame") || k.contains("full body") || k.contains("full-body")
            || k.contains("framing") || k.contains("what to capture") {
            return .readiness(.framing)
        }
        if k.contains("lighting") || k.contains("exposure") || k.contains("environment") {
            return .readiness(.lighting)
        }
        if k.contains("stable") || k.contains("steady") || k.contains("tripod")
            || k.contains("camera position") { return .readiness(.stability) }
        if k.contains("routine") || k.contains("athlete visible") { return .readiness(.athlete) }

        // 5b. Drill equipment and setup cards.
        if let e = EquipmentKind(equipmentLabel: caption) { return .equipment(e) }

        // 6. Navigation and the four product pillars canonical draws on 002/017.
        if k == "home" { return .nav(.home) }
        if k.contains("capture your shot") || k == "capture" || k.contains("new capture") {
            return .captureReticle
        }
        if k.contains("ai analysis") || k == "analyze" || k.contains("analyze a shot")
            || k.contains("analyzing motion") || k.contains("detecting pose") {
            return .cue(.tree)
        }
        // "MY DRILLS" sits directly beside "TRAIN" in 058's tab strip, so it
        // needs its own mark rather than the Train rail.
        if k.contains("my drills") || k.contains("saved drills") { return .workout(.ladder) }
        if k == "train" || k.contains("workout") { return .nav(.train) }
        if k.contains("track") || k.contains("progress") || k.contains("improve") {
            return .nav(.progress)
        }

        // 7. Statistics.
        if let s = StatMarkGlyph.kind(forStatLabel: caption) { return .stat(s) }

        // 8. Coaching copy.
        if k.contains("primary target") || k.contains("coaching") || k.contains("takeaway")
            || k.contains("why this matters") { return .coachingTarget }
        return nil
    }
}

/// Draws the bespoke mark for a caption, keeping unknown feature rows inside
/// the ShotIQ raster icon family instead of falling back to SF Symbols.
struct ShotIQConceptGlyph: View {
    var concept: String
    var fallback: String
    var size: CGFloat = 22
    var accent: Color = ShotIQColor.shotiqOrange

    var body: some View {
        switch ShotIQConcept.resolve(concept) {
        case .shotType(let k): ShotTypeGlyph(kind: k, size: size, accent: accent)
        case .hand(let k): HandGlyph(kind: k, size: size, accent: accent)
        case .body(let k): BodyMetricGlyph(kind: k, size: size, accent: accent)
        case .ability(let k): AbilityGlyph(kind: k, size: size, accent: accent)
        case .source(let k): CaptureSourceGlyph(source: k, size: size, accent: accent)
        case .readiness(let k): ReadinessGlyph(kind: k, size: size, accent: accent)
        case .mechanic(let k): MechanicGlyph(kind: k, size: size, accent: accent)
        case .phase(let k): PhaseGlyph(phase: k, size: size)
        case .stat(let k): StatMarkGlyph(kind: k, size: size, accent: accent)
        case .nav(let k): NavGlyph(mark: k, size: size)
        case .workout(let k): WorkoutGlyph(kind: k, size: size, accent: accent)
        case .cue(let k): CueGlyph(kind: k, size: size, accent: accent)
        case .equipment(let k): EquipmentGlyph(kind: k, size: size, accent: accent)
        case .coachingTarget: CoachingTargetGlyph(size: size, accent: accent)
        case .captureReticle: CaptureReticleGlyph(size: size)
        case .none:
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: fallback),
                                     size: size,
                                     label: nil)
        }
    }
}

/// Profile tab: canonical prints the player's initials in a hairline box rather
/// than a person silhouette.
struct InitialsMark: View {
    var initials: String
    var size: CGFloat = 22
    var active = false
    var body: some View {
        Text(initials)
            .shotiqCondensed(size * 0.46, weight: .heavy)
            .kerning(0.3)
            .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
            .frame(width: size, height: size * 0.86)
            .overlay(RoundedRectangle(cornerRadius: 2)
                .stroke(active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite,
                        lineWidth: shotiqGlyphStrokeWidth(size) * size / 24))
            .accessibilityHidden(true)
    }
}
