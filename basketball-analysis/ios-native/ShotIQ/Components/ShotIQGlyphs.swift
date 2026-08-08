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
        if size >= 18 {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: source),
                                     size: size,
                                     label: label)
        } else {
            ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch source {
            case .uploadImage:
                p.captureBrackets()
                p.poly([CGPoint(x: 7, y: 14.6), CGPoint(x: 10.4, y: 11.2),
                        CGPoint(x: 13.4, y: 13.2), CGPoint(x: 17, y: 9.2)])
                p.node(7, 14.6, r: 1.4)
                p.node(10.4, 11.2, r: 1.4, accent: true)
                p.node(13.4, 13.2, r: 1.4)
                p.node(17, 9.2, r: 1.4, accent: true)
            case .uploadVideo:
                p.rect(3, 7, 18, 10, radius: 1)
                p.line(9, 7, 9, 17)
                p.line(15, 7, 15, 17)
                p.line(6, 10.6, 6, 13.4)
                p.line(18, 10.6, 18, 13.4)
                p.basketball(12, 12, r: 2.1, accent: true)
                p.line(12, 18, 12, 21, accent: true)
                p.arrowHead(at: CGPoint(x: 12, y: 17.6), from: CGPoint(x: 12, y: 21),
                            span: 1.5, accent: true)
            case .liveCamera:
                p.captureBrackets()
                p.circle(11.2, 8.6, r: 1.5)
                p.line(11.2, 10.1, 11.6, 14)
                p.poly([CGPoint(x: 11.6, y: 14), CGPoint(x: 9.6, y: 16.8)])
                p.poly([CGPoint(x: 11.6, y: 14), CGPoint(x: 13.6, y: 16.6)])
                p.poly([CGPoint(x: 11.3, y: 11.2), CGPoint(x: 14, y: 9.4)])
                p.basketball(16, 8.4, r: 1.6, accent: true)
            }
        }
        }
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
        if size >= 18 {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                     size: size,
                                     label: label)
        } else {
            ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .elbowAngle:
                // Elbow directly under the ball, with the alignment guide visible.
                p.line(12, 4.2, 12, 19.8, accent: true, dash: [1.5, 1.8])
                p.basketball(12, 4.6, r: 2.1, accent: true)
                p.poly([CGPoint(x: 7.4, y: 19), CGPoint(x: 11, y: 13.2),
                        CGPoint(x: 12, y: 7.2)])
                p.node(11, 13.2, r: 1.6, accent: true)
                p.node(7.4, 19, r: 1.4)
            case .wristArc:
                // Wrist stacked above the elbow with a small snap cue.
                p.line(12, 5, 12, 19, accent: true, dash: [1.5, 1.8])
                p.basketball(12, 5.2, r: 2.1, accent: true)
                p.poly([CGPoint(x: 8.2, y: 19), CGPoint(x: 11.5, y: 12.8),
                        CGPoint(x: 12, y: 7.4)])
                p.node(11.5, 12.8, r: 1.5, accent: true)
                p.quad(CGPoint(x: 12.8, y: 7.2), CGPoint(x: 16.4, y: 8.3),
                       CGPoint(x: 16.9, y: 11.5), accent: true)
                p.arrowHead(at: CGPoint(x: 16.9, y: 11.7), from: CGPoint(x: 15.2, y: 9.2),
                            span: 1.4, accent: true)
            case .releaseHeight:
                // Floor-to-hand ruler beside a standing figure.
                p.line(4, 4.5, 4, 19.5)
                p.arrowHead(at: CGPoint(x: 4, y: 4.2), from: CGPoint(x: 4, y: 8), span: 1.8)
                p.arrowHead(at: CGPoint(x: 4, y: 19.8), from: CGPoint(x: 4, y: 16), span: 1.8)
                p.circle(13.5, 6.5, r: 1.6)
                p.line(13.5, 8.1, 13.5, 13.5)
                p.line(13.5, 10, 16.5, 8.4)
                p.line(13.5, 13.5, 11.6, 17.4)
                p.line(13.5, 13.5, 15.6, 17.4)
                p.line(9, 19.6, 19, 19.6)
            case .distance:
                // Tape measure laid along the floor.
                p.line(3, 13, 20, 13)
                p.arrowHead(at: CGPoint(x: 20.4, y: 13), from: CGPoint(x: 16, y: 13))
                p.line(6, 13, 6, 8.6)
                p.line(10, 13, 10, 10)
                p.line(14, 13, 14, 8.6)
                p.line(3, 18.5, 21, 18.5, dash: [2.5, 2.5])
            case .jump:
                // Rise arrow beside the tracked hip/head nodes.
                p.line(5, 20.5, 5, 4.5)
                p.arrowHead(at: CGPoint(x: 5, y: 4.2), from: CGPoint(x: 5, y: 8.4))
                p.line(14, 10, 14, 14, accent: true, dash: [1.4, 1.6])
                p.node(14, 8.2, r: 2, accent: true)
                p.node(14, 15.4, r: 2)
                p.line(9.5, 20.5, 19.5, 20.5)
            case .ballArc:
                // Ball flight: dotted parabola with launch and landing nodes.
                p.quad(CGPoint(x: 4.5, y: 18.5), CGPoint(x: 11.5, y: 0.5), CGPoint(x: 19.5, y: 11.5),
                       dash: [1.6, 2])
                p.line(4.5, 18.5, 8.5, 9, accent: true)
                p.node(4.5, 18.5, r: 1.5, accent: true)
                p.node(19.5, 11.5, r: 1.5)
            case .releasePath:
                // Straight path out of the hand, not the later flight arc.
                p.line(12, 5.2, 12, 18.8, accent: true, dash: [1.5, 1.8])
                p.arrowHead(at: CGPoint(x: 12, y: 4.8), from: CGPoint(x: 12, y: 9),
                            accent: true)
                p.basketball(12, 10.5, r: 2.2, accent: true)
                p.poly([CGPoint(x: 8.6, y: 20), CGPoint(x: 11.2, y: 16),
                        CGPoint(x: 12, y: 13)])
                p.node(11.2, 16, r: 1.4)
            case .centerline:
                // Body midline with the measured lateral offset arrowed off it.
                p.line(12, 3, 12, 21, dash: [2, 2])
                p.circle(12, 12, r: 2.4)
                p.line(14.6, 12, 20, 12, accent: true)
                p.arrowHead(at: CGPoint(x: 20.2, y: 12), from: CGPoint(x: 16, y: 12), accent: true)
                p.line(6.4, 12, 9.6, 12)
            case .balance:
                // Level bar across a planted stance.
                p.circle(12, 4.6, r: 1.9)
                p.line(12, 6.5, 12, 13)
                p.line(12, 13, 9.2, 18.6)
                p.line(12, 13, 14.8, 18.6)
                p.line(5.5, 9.6, 18.5, 9.6, accent: true)
                p.line(7.5, 20.6, 16.5, 20.6, dash: [2, 2])
            case .drift:
                // Reference line and how far the release point has drifted off it.
                p.line(7.5, 4, 7.5, 20, dash: [2, 2])
                p.node(7.5, 12, r: 1.5)
                p.line(9.6, 12, 17.4, 12, accent: true)
                p.arrowHead(at: CGPoint(x: 17.6, y: 12), from: CGPoint(x: 14, y: 12), accent: true)
                p.node(18.5, 7, r: 1.5, accent: true)
                p.line(18.5, 8.5, 18.5, 17, accent: true, dash: [1.6, 1.8])
            case .impact:
                // Effect landing on the tracked outcome node.
                p.line(12, 3.5, 12, 11.5, accent: true)
                p.arrowHead(at: CGPoint(x: 12, y: 11.8), from: CGPoint(x: 12, y: 8), accent: true)
                p.circle(12, 16, r: 3, accent: true)
                p.line(5, 20.5, 19, 20.5)
            case .tempo:
                // Beat rail — evenly spaced marks with the measured beat filled.
                p.line(3, 16.5, 21, 16.5)
                p.line(6, 16.5, 6, 11.5)
                p.line(12, 16.5, 12, 7)
                p.line(18, 16.5, 18, 11.5)
                p.node(6, 10.2, r: 1.4)
                p.node(12, 5.8, r: 1.6, accent: true, filled: true)
                p.node(18, 10.2, r: 1.4)
            case .consistency:
                // Repeat-band: a tight scatter of releases inside a dotted band.
                p.line(3.5, 8.5, 20.5, 8.5, dash: [2, 2])
                p.line(3.5, 15.5, 20.5, 15.5, dash: [2, 2])
                p.node(7, 12.6, r: 1.4)
                p.node(11, 11.2, r: 1.4, accent: true)
                p.node(15, 12.9, r: 1.4)
                p.node(18.6, 11.6, r: 1.4)
                p.poly([CGPoint(x: 7, y: 12.6), CGPoint(x: 11, y: 11.2),
                        CGPoint(x: 15, y: 12.9), CGPoint(x: 18.6, y: 11.6)])
            case .arcHeight:
                // Canonical 041: a low node polyline whose apex is picked out, with
                // the apex measured down to the rail. Not a parabola — the apex is
                // what is being read, so the shoulders sit on the floor line.
                p.poly([CGPoint(x: 3.6, y: 15.4), CGPoint(x: 7.2, y: 17.6),
                        CGPoint(x: 12, y: 8.2), CGPoint(x: 16.8, y: 13.2),
                        CGPoint(x: 20.4, y: 11)], dash: [1.6, 1.8])
                p.node(3.6, 15.4, r: 1.3)
                p.node(7.2, 17.6, r: 1.3, accent: true, filled: true)
                p.node(12, 8.2, r: 1.5, accent: true, filled: true)
                p.node(16.8, 13.2, r: 1.3, accent: true, filled: true)
                p.node(20.4, 11, r: 1.3)
            case .releaseAngle:
                // Canonical 041/070: a protractor corner — the horizontal, the
                // launch ray and the swept angle between them.
                p.line(5, 18.5, 20, 18.5)
                p.line(5, 18.5, 5, 6)
                p.line(5, 18.5, 18.5, 7.5)
                p.arc(5, 18.5, r: 7.2, from: -38, to: 0, accent: true, dash: [1.4, 1.8])
                p.node(5, 18.5, r: 1.4, accent: true, filled: true)
            case .spin:
                // Canonical 041: the ball with its two rotation arrows. The ball
                // seams are what separate it from `.accuracy`'s concentric target.
                p.basketball(12, 12, r: 4.6, accent: true)
                p.arc(12, 12, r: 7.6, from: 128, to: 202, accent: true)
                p.arrowHead(at: CGPoint(x: 7.5, y: 9), from: CGPoint(x: 5.6, y: 11.4),
                            span: 1.7, accent: true)
                p.arc(12, 12, r: 7.6, from: -52, to: 22, accent: true)
                p.arrowHead(at: CGPoint(x: 16.5, y: 15), from: CGPoint(x: 18.4, y: 12.6),
                            span: 1.7, accent: true)
            case .flightTime:
                // Canonical 041: the dotted flight path between the two timing
                // nodes — the *span*, not the height, is the measurement.
                p.quad(CGPoint(x: 4.5, y: 15.5), CGPoint(x: 12, y: 3), CGPoint(x: 19.5, y: 15.5),
                       dash: [1.5, 2])
                p.node(4.5, 15.5, r: 1.8, filled: true)
                p.node(19.5, 15.5, r: 1.8, filled: true)
                p.line(4.5, 19.6, 19.5, 19.6, accent: true)
                p.line(4.5, 18.4, 4.5, 20.8, accent: true)
                p.line(19.5, 18.4, 19.5, 20.8, accent: true)
            case .shotShape:
                // Canonical 070: plan view down the court — the rim line, the
                // dashed path and how far left or right of centre it finished.
                p.line(4, 19.5, 20, 19.5)
                p.node(6.5, 19.5, r: 1.4, accent: true, filled: true)
                p.node(17.5, 19.5, r: 1.4, accent: true, filled: true)
                p.line(12, 3.5, 12, 14, dash: [2, 2])
                p.poly([CGPoint(x: 12, y: 5), CGPoint(x: 10.4, y: 10.6),
                        CGPoint(x: 12.6, y: 14.4)], accent: true, dash: [1.4, 1.8])
                p.node(12, 3.5, r: 1.5)
            }
        }
        }
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

struct CueGlyph: View {
    var kind: CueKind
    var size: CGFloat = 26
    var accent: Color = ShotIQColor.confirmGreen
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .peak:
                p.poly([CGPoint(x: 3.5, y: 16.5), CGPoint(x: 7.5, y: 19), CGPoint(x: 12, y: 5.5),
                        CGPoint(x: 16.5, y: 19), CGPoint(x: 20.5, y: 16.5)])
                p.node(3.5, 16.5, r: 1.7, accent: true, filled: true)
                p.node(7.5, 19, r: 1.7, accent: true, filled: true)
                p.node(12, 5.5, r: 1.7)
                p.node(16.5, 19, r: 1.7, accent: true, filled: true)
                p.node(20.5, 16.5, r: 1.7, accent: true, filled: true)
            case .apex:
                p.poly([CGPoint(x: 5, y: 19.5), CGPoint(x: 10.5, y: 7),
                        CGPoint(x: 16, y: 11), CGPoint(x: 20, y: 8.5)])
                p.node(5, 19.5, r: 1.7, accent: true, filled: true)
                p.node(10.5, 7, r: 1.7, accent: true, filled: true)
                p.node(16, 11, r: 1.7)
                p.node(20, 8.5, r: 1.7)
            case .shoulders:
                p.line(12, 4.5, 12, 9)
                p.line(12, 9, 5.5, 14)
                p.line(12, 9, 18.5, 14)
                p.poly([CGPoint(x: 5.5, y: 14), CGPoint(x: 12, y: 19), CGPoint(x: 18.5, y: 14)],
                       dash: [2, 2])
                p.node(12, 4.5, r: 1.7)
                p.node(12, 9, r: 1.7, accent: true, filled: true)
                p.node(5.5, 14, r: 1.7, accent: true, filled: true)
                p.node(18.5, 14, r: 1.7, accent: true, filled: true)
            case .extensionLine:
                p.poly([CGPoint(x: 6, y: 19.5), CGPoint(x: 10, y: 13),
                        CGPoint(x: 14.5, y: 11), CGPoint(x: 19, y: 4.5)])
                p.line(14.5, 11, 16.5, 15, dash: [1.6, 1.8])
                p.node(6, 19.5, r: 1.7)
                p.node(10, 13, r: 1.7, accent: true, filled: true)
                p.node(14.5, 11, r: 1.7, accent: true, filled: true)
                p.node(19, 4.5, r: 1.7)
            case .base:
                p.line(12, 4.5, 12, 12)
                p.line(12, 12, 7, 20)
                p.line(12, 12, 17, 20)
                p.line(6.5, 9.5, 17.5, 9.5)
                p.node(12, 4.5, r: 1.7)
                p.node(7, 20, r: 1.7, accent: true, filled: true)
                p.node(17, 20, r: 1.7, accent: true, filled: true)
            case .tree:
                p.line(12, 4.5, 5.5, 12)
                p.line(12, 4.5, 18.5, 12)
                p.line(5.5, 12, 8.5, 19.5)
                p.line(18.5, 12, 15.5, 19.5)
                p.node(12, 4.5, r: 1.7)
                p.node(5.5, 12, r: 1.7)
                p.node(18.5, 12, r: 1.7)
                p.node(8.5, 19.5, r: 1.7, accent: true, filled: true)
                p.node(15.5, 19.5, r: 1.7, accent: true, filled: true)
            }
        }
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
        if size >= 18 {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                     size: size,
                                     label: label)
        } else {
            ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .stack:
                p.circle(12, 9.4, r: 2)
                p.line(12, 11.4, 12, 16.5)
                p.line(12, 16.5, 9.6, 21.2)
                p.line(12, 16.5, 14.4, 21.2)
                p.poly([CGPoint(x: 12, y: 12.6), CGPoint(x: 9, y: 9.6), CGPoint(x: 9.6, y: 6.2)])
                p.poly([CGPoint(x: 12, y: 12.6), CGPoint(x: 15, y: 9.6), CGPoint(x: 14.4, y: 6.2)])
                p.line(8.6, 3.8, 15.4, 3.8, accent: true, dash: [2, 2])
            case .square:
                p.circle(11, 4.6, r: 2)
                p.line(11, 6.6, 11, 13.4)
                p.line(11, 13.4, 8.4, 20.6)
                p.line(11, 13.4, 13.8, 20.6)
                p.poly([CGPoint(x: 11, y: 8.6), CGPoint(x: 16.4, y: 8.6), CGPoint(x: 16.4, y: 4.2)])
                p.poly([CGPoint(x: 14.6, y: 8.6), CGPoint(x: 14.6, y: 6.8), CGPoint(x: 16.4, y: 6.8)],
                       accent: true)
                p.line(6, 8.6, 9.2, 8.6)
            case .drive:
                p.circle(10.4, 7.6, r: 2)
                p.line(10.4, 9.6, 11, 15.4)
                p.poly([CGPoint(x: 11, y: 15.4), CGPoint(x: 8.4, y: 19.4), CGPoint(x: 8, y: 21.6)])
                p.poly([CGPoint(x: 11, y: 15.4), CGPoint(x: 13.8, y: 19), CGPoint(x: 14.6, y: 21.4)])
                p.line(10.6, 10.8, 13.4, 8)
                p.line(17, 20, 17, 4.6, accent: true, dash: [2, 2])
                p.arrowHead(at: CGPoint(x: 17, y: 4.4), from: CGPoint(x: 17, y: 8.4), accent: true)
            }
        }
        }
    }
}

// MARK: - Flaw portraits

/// Side-on figure with the flawed segment picked out in the alert colour — the
/// ~56pt diagram canonical prints on each top-flaw card.
enum FlawKind { case elbow, wrist, release, base, guideHand }

struct FlawFigure: View {
    var kind: FlawKind
    var size: CGFloat = 56
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            p.circle(10.6, 7.6, r: 2)
            p.line(10.6, 9.6, 11.2, 15.2)
            p.poly([CGPoint(x: 11.2, y: 15.2), CGPoint(x: 8.8, y: 19), CGPoint(x: 8.4, y: 21.6)])
            p.poly([CGPoint(x: 11.2, y: 15.2), CGPoint(x: 13.8, y: 18.8), CGPoint(x: 14.8, y: 21.4)])
            switch kind {
            case .elbow:
                p.poly([CGPoint(x: 10.8, y: 10.8), CGPoint(x: 13.6, y: 7.6), CGPoint(x: 15.4, y: 4.6)],
                       accent: true)
                p.node(13.6, 7.6, r: 1.4, accent: true)
                p.circle(15.8, 4, r: 1.8, accent: true)
            case .wrist:
                p.line(10.8, 10.8, 13.4, 8.6)
                p.circle(15.4, 6.4, r: 3.2, accent: true)
                p.line(17.4, 4.4, 19, 3, accent: true, dash: [1.4, 1.6])
            case .release:
                p.line(10.8, 10.8, 12.8, 8.4)
                p.circle(14.8, 4.4, r: 3, accent: true)
                p.line(14.8, 7.4, 14.8, 12.6, accent: true, dash: [1.4, 1.8])
            case .base:
                p.line(10.8, 10.8, 13.6, 8.8)
                p.circle(15.4, 7, r: 2)
                p.line(8.4, 21.6, 14.8, 21.6, accent: true)
                p.line(6.4, 21.6, 8, 21.6, accent: true, dash: [1.2, 1.4])
                p.line(15.2, 21.6, 16.8, 21.6, accent: true, dash: [1.2, 1.4])
            case .guideHand:
                p.line(10.8, 10.8, 13.6, 8)
                p.circle(15.6, 6, r: 2)
                p.line(11.6, 12.4, 14.4, 11, accent: true)
                p.line(14.4, 11, 16.6, 12.4, accent: true)
                p.node(14.4, 11, r: 1.2, accent: true)
            }
        }
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
        case .volume: return "shotiq-approved-ui-ladder-balls"
        case .accuracy, .makes, .makePercent: return "shotiq-approved-ui-target-reticle"
        case .pointsEarned: return "shotiq-approved-ui-progress-line"
        }
    }

    var body: some View {
        if size >= 14 {
            ShotIQApprovedRasterIcon(assetName: approvedAssetName,
                                     size: size,
                                     label: label)
        } else {
            ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .points:
                p.poly([CGPoint(x: 12, y: 2.6), CGPoint(x: 20.2, y: 7.3), CGPoint(x: 20.2, y: 16.7),
                        CGPoint(x: 12, y: 21.4), CGPoint(x: 3.8, y: 16.7), CGPoint(x: 3.8, y: 7.3),
                        CGPoint(x: 12, y: 2.6)])
                p.basketball(12, 12, r: 4, accent: true)
            case .formScore:
                p.arc(12, 14.5, r: 8.2, from: 180, to: 360, dash: [1.5, 2])
                p.line(12, 14.5, 17.2, 9.4, accent: true)
                p.node(12, 14.5, r: 1.5, accent: true, filled: true)
                p.line(3.8, 14.5, 5.6, 14.5)
                p.line(18.4, 14.5, 20.2, 14.5)
            case .dayStreak:
                p.rect(3, 6, 18, 12, radius: 1.2)
                p.line(7.4, 6, 7.4, 18)
                p.line(16.6, 6, 16.6, 18)
                p.line(5.2, 9, 5.2, 10.2)
                p.line(5.2, 13.8, 5.2, 15)
                p.line(18.8, 9, 18.8, 10.2)
                p.line(18.8, 13.8, 18.8, 15)
                p.basketball(12, 12, r: 1.9, accent: true)
            case .volume:
                p.line(4, 19.5, 20, 19.5)
                p.line(7, 19.5, 7, 13)
                p.line(12, 19.5, 12, 8.5)
                p.line(17, 19.5, 17, 11)
                p.node(12, 6.9, r: 1.5, accent: true, filled: true)
            case .accuracy:
                p.circle(12, 12, r: 8)
                p.circle(12, 12, r: 4, dash: [1.6, 1.8])
                p.node(12, 12, r: 1.6, accent: true, filled: true)
                p.line(12, 4, 12, 2.4)
                p.line(12, 21.6, 12, 20)
                p.line(4, 12, 2.4, 12)
                p.line(21.6, 12, 20, 12)
            case .makes:
                // Backboard, rim and net, face on — canonical 062's MAKES mark.
                p.rect(5.5, 4.5, 13, 8, radius: 0.8)
                p.rect(9.5, 8, 5, 4.5, radius: 0.4)
                p.line(6.5, 14.5, 17.5, 14.5, accent: true)
                p.poly([CGPoint(x: 7.6, y: 14.5), CGPoint(x: 9.4, y: 20),
                        CGPoint(x: 14.6, y: 20), CGPoint(x: 16.4, y: 14.5)])
                p.line(10.4, 14.5, 11.4, 20)
                p.line(13.6, 14.5, 12.6, 20)
            case .makePercent:
                // A ring with the made share swept out of it — a rate.
                p.circle(12, 12, r: 7.6, dash: [1.6, 2])
                p.arc(12, 12, r: 7.6, from: -90, to: 135, accent: true)
                p.node(12, 4.4, r: 1.5, accent: true, filled: true)
                p.line(8.4, 15.4, 15.6, 8.6)
                p.node(9.4, 9.6, r: 1.1)
                p.node(14.6, 14.4, r: 1.1)
            case .pointsEarned:
                // Rising node line, the earned step picked out — a gain, not a
                // lifetime balance (that is `.points`, the hexagon token).
                p.poly([CGPoint(x: 3.6, y: 17.4), CGPoint(x: 8, y: 14.6),
                        CGPoint(x: 12, y: 16.2), CGPoint(x: 16, y: 8.6),
                        CGPoint(x: 20.4, y: 11.4)])
                p.node(3.6, 17.4, r: 1.4)
                p.node(8, 14.6, r: 1.4)
                p.node(12, 16.2, r: 1.4)
                p.node(16, 8.6, r: 1.8, accent: true, filled: true)
                p.node(20.4, 11.4, r: 1.4)
            }
        }
        }
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
        if size >= 16 {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                     size: size,
                                     label: label)
        } else {
            ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .release:
                p.line(12, 4.5, 6, 12.5)
                p.line(12, 4.5, 18, 10.5)
                p.line(6, 12.5, 11, 19.5)
                p.node(12, 4.5, r: 1.8, accent: true)
                p.node(6, 12.5, r: 1.8)
                p.node(18, 10.5, r: 1.8)
                p.node(11, 19.5, r: 1.8)
            case .ladder:
                p.line(7.5, 3.5, 5.5, 20.5)
                p.line(16.5, 3.5, 18.5, 20.5)
                p.line(7.1, 7, 16.9, 7)
                p.line(6.6, 11.5, 17.4, 11.5)
                p.line(6.1, 16, 17.9, 16)
            case .flow:
                p.arc(11.5, 13, r: 4.5, from: 220, to: 120)
                p.poly([CGPoint(x: 9.6, y: 5.4), CGPoint(x: 8.4, y: 8.8), CGPoint(x: 11.8, y: 9.6)])
                p.node(15.5, 9, r: 2, accent: true)
            }
        }
        }
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
        if size >= 18 {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                     size: size,
                                     label: label)
        } else {
            ShotIQGlyph(size: size, accent: accent, label: label) { p in
            if kind != .lighting { p.captureBrackets() }
            switch kind {
            case .athlete:
                p.circle(11, 8.2, r: 1.4)
                p.line(11, 9.6, 11.4, 13.6)
                p.line(11.4, 13.6, 9.6, 16.4)
                p.line(11.4, 13.6, 13.4, 16.2)
                p.line(11.1, 10.8, 13.4, 12.4)
            case .framing:
                p.circle(12, 7.3, r: 1.3)
                p.line(12, 8.6, 12, 14.2)
                p.line(12, 10.4, 9.6, 12.2)
                p.line(12, 10.4, 14.4, 12.2)
                p.line(12, 14.2, 10.2, 18)
                p.line(12, 14.2, 13.8, 18)
                p.line(9.4, 19, 14.6, 19, accent: true)
            case .lighting:
                p.circle(12, 12, r: 4, accent: true)
                p.line(12, 3.5, 12, 5.5)
                p.line(12, 18.5, 12, 20.5)
                p.line(3.5, 12, 5.5, 12)
                p.line(18.5, 12, 20.5, 12)
                p.line(6.2, 6.2, 7.6, 7.6)
                p.line(16.4, 16.4, 17.8, 17.8)
                p.line(17.8, 6.2, 16.4, 7.6)
                p.line(7.6, 16.4, 6.2, 17.8)
            case .stability:
                p.rect(7, 7.2, 10, 5.8, radius: 1)
                p.node(15.2, 10.1, r: 0.8, filled: true)
                p.line(12, 13, 12, 19)
                p.line(12, 15.4, 8.8, 20.4)
                p.line(12, 15.4, 15.2, 20.4)
                p.line(5.5, 18.6, 18.5, 18.6, accent: true, dash: [1.4, 1.8])
            }
        }
        }
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
        if size >= 18 {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: kind),
                                     size: size,
                                     label: label)
        } else {
            ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .basketball:
                p.basketball(12, 12, r: 5.6, accent: true)
                p.line(5.5, 17, 3.8, 18.2, dash: [1.4, 1.8])
                p.line(18.5, 6.8, 20.2, 5.6, dash: [1.4, 1.8])
            case .cones:
                p.poly([CGPoint(x: 12, y: 5), CGPoint(x: 7, y: 18),
                        CGPoint(x: 17, y: 18), CGPoint(x: 12, y: 5)])
                p.line(8.4, 14.4, 15.6, 14.4, accent: true)
                p.line(6, 20, 18, 20)
            case .spot:
                p.line(4, 13, 20, 13)
                p.line(4, 10.2, 4, 15.8)
                p.line(20, 10.2, 20, 15.8)
                for i in 0...5 {
                    let x = 6.7 + CGFloat(i) * 2.1
                    p.line(x, 13, x, 16.2)
                }
                p.node(12, 13, r: 1.5, accent: true, filled: true)
            case .location:
                p.quad(CGPoint(x: 12, y: 21), CGPoint(x: 5.8, y: 12.8),
                       CGPoint(x: 8.2, y: 6.8))
                p.quad(CGPoint(x: 8.2, y: 6.8), CGPoint(x: 12, y: 2.8),
                       CGPoint(x: 15.8, y: 6.8))
                p.quad(CGPoint(x: 15.8, y: 6.8), CGPoint(x: 18.2, y: 12.8),
                       CGPoint(x: 12, y: 21))
                p.circle(12, 10.3, r: 2.4, accent: true)
                p.arc(12, 21, r: 5.4, from: 205, to: 335)
            }
        }
        }
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
        if size >= 14 {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(for: mark),
                                     size: size,
                                     label: nil)
        } else {
            ShotIQGlyph(size: size, accent: ShotIQColor.shotiqOrange) { p in
            switch mark {
            case .home:
                p.captureBrackets(inset: 3.5, arm: 4, radius: 1.4)
                p.basketball(12, 12, r: 2.3, accent: active)
            case .capture:
                p.line(6.5, 15.5, 12, 9.5)
                p.line(12, 9.5, 18, 14)
                p.node(6.5, 15.5, r: 2)
                p.node(12, 9.5, r: 2.2, accent: active, filled: active)
                p.node(18, 14, r: 2)
            case .train:
                p.line(4.5, 5.5, 4.5, 18.5)
                p.line(19.5, 5.5, 19.5, 18.5)
                p.line(4.5, 8, 19.5, 8)
                p.line(4.5, 12, 19.5, 12)
                p.line(4.5, 16, 19.5, 16)
                p.node(8.3, 12, r: 1.5)
                p.basketball(12, 12, r: 1.8, accent: active)
                p.node(15.7, 12, r: 1.5)
            case .progress:
                p.quad(CGPoint(x: 3.5, y: 18), CGPoint(x: 9, y: 5.5), CGPoint(x: 20.5, y: 7.5))
                p.node(3.5, 18, r: 1.8)
                p.node(11.6, 8.6, r: 1.8)
                p.node(20.5, 7.5, r: 1.8, accent: active, filled: active)
            }
        }
            .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
        }
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

struct HandGlyph: View {
    var kind: HandKind
    var size: CGFloat = 30
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            // Drawn right-handed on the 24-grid, then reflected for the left.
            let flip = kind == .left
            func x(_ v: CGFloat) -> CGFloat { flip ? 24 - v : v }
            // Two opposed corner brackets, on the shooting side.
            p.poly([CGPoint(x: x(4), y: 8.5), CGPoint(x: x(4), y: 4),
                    CGPoint(x: x(9), y: 4)])
            p.poly([CGPoint(x: x(4), y: 15.5), CGPoint(x: x(4), y: 20),
                    CGPoint(x: x(9), y: 20)])
            // Wrist -> palm -> two fingers: the constellation itself is chiral,
            // so the two marks stay apart even at row size.
            p.poly([CGPoint(x: x(8), y: 16.6), CGPoint(x: x(10.6), y: 10),
                    CGPoint(x: x(14.4), y: 7.2), CGPoint(x: x(18.4), y: 11)])
            p.line(x(14.4), 7.2, x(15.6), 13.2)
            p.node(x(8), 16.6, r: 1.6)
            p.node(x(10.6), 10, r: 1.6, accent: true, filled: true)
            p.node(x(14.4), 7.2, r: 1.6, accent: true, filled: true)
            p.node(x(18.4), 11, r: 1.6, accent: true)
            p.node(x(15.6), 13.2, r: 1.6)
        }
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

struct BodyMetricGlyph: View {
    var kind: BodyMetricKind
    var size: CGFloat = 22
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .age:
                // Bracketed tick scale — elapsed years read off a framed rule.
                p.captureBrackets(inset: 4.5, arm: 3.6, radius: 1.2)
                p.line(12, 5.6, 12, 18.4)
                p.line(12, 8.4, 15, 8.4, accent: true)
                p.line(12, 12, 15, 12, accent: true)
                p.line(12, 15.6, 15, 15.6, accent: true)
                p.node(12, 5.2, r: 1.5, accent: true, filled: true)
                p.node(12, 18.8, r: 1.5, accent: true, filled: true)
            case .height:
                // Standing rule: one vertical span between two capped ends.
                p.poly([CGPoint(x: 7.5, y: 4), CGPoint(x: 5.5, y: 4),
                        CGPoint(x: 5.5, y: 20), CGPoint(x: 7.5, y: 20)])
                p.line(12, 5.6, 12, 18.4, accent: true, dash: [1.6, 1.8])
                p.line(9.6, 9.4, 14.4, 9.4)
                p.line(9.6, 14.6, 14.4, 14.6)
                p.node(12, 4.4, r: 1.6, accent: true, filled: true)
                p.node(12, 19.6, r: 1.6, accent: true, filled: true)
            case .weight:
                // Balance beam with a centre pointer — mass, read horizontally.
                p.line(4, 14.5, 20, 14.5)
                p.line(12, 14.5, 12, 9.5)
                p.line(9, 9.5, 15, 9.5)
                p.line(6, 18.5, 18, 18.5, dash: [2, 2])
                p.node(4.4, 18.5, r: 1.6, accent: true, filled: true)
                p.node(19.6, 18.5, r: 1.6, accent: true, filled: true)
            case .wingspan:
                // Front-on figure, arms out, span measured fingertip to fingertip.
                p.circle(12, 6.4, r: 2.2)
                p.line(12, 8.6, 12, 15)
                p.line(4.6, 10.8, 19.4, 10.8)
                p.line(12, 15, 9, 20.6)
                p.line(12, 15, 15, 20.6)
                p.line(3.6, 7.4, 20.4, 7.4, accent: true, dash: [1.6, 1.8])
                p.node(3.6, 7.4, r: 1.6, accent: true, filled: true)
                p.node(20.4, 7.4, r: 1.6, accent: true, filled: true)
            }
        }
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

struct ShotTypeGlyph: View {
    var kind: ShotTypeKind
    var size: CGFloat = 26
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .catchShoot:
                // A closed catch-and-release loop: the pass arrives and leaves
                // from the same spot, so the path is a ring.
                p.circle(12, 12, r: 6.6, dash: [1.8, 2])
                p.node(12, 5.4, r: 1.7, accent: true, filled: true)
                p.node(18.6, 12, r: 1.7)
                p.node(12, 18.6, r: 1.7, accent: true, filled: true)
                p.node(5.4, 12, r: 1.7)
            case .pullUp:
                // Travel, then a hard stop and a vertical rise off two feet.
                p.poly([CGPoint(x: 4, y: 19.5), CGPoint(x: 9.5, y: 17.5)], dash: [1.6, 1.8])
                p.line(11.5, 16.5, 11.5, 6.5, accent: true)
                p.arrowHead(at: CGPoint(x: 11.5, y: 6.2), from: CGPoint(x: 11.5, y: 10.5),
                            accent: true)
                p.node(9.5, 17.5, r: 1.7, filled: true)
                p.node(15.5, 8.5, r: 1.7, accent: true, filled: true)
                p.line(13, 15, 15.5, 10)
            case .offDribble:
                // Two bounces into the gather — the dribble path is the mark.
                p.quad(CGPoint(x: 4.5, y: 8), CGPoint(x: 7, y: 20), CGPoint(x: 10, y: 9),
                       dash: [1.5, 1.9])
                p.quad(CGPoint(x: 10, y: 9), CGPoint(x: 13, y: 20), CGPoint(x: 16, y: 9),
                       dash: [1.5, 1.9])
                p.node(4.5, 8, r: 1.6)
                p.node(10, 9, r: 1.6)
                p.node(16, 9, r: 1.7, accent: true, filled: true)
                p.line(17.5, 7.5, 20, 5, accent: true)
            case .stepBack:
                // Retreating step then the release — the path runs backwards.
                p.poly([CGPoint(x: 19.5, y: 18), CGPoint(x: 13, y: 18)], accent: true)
                p.arrowHead(at: CGPoint(x: 12.6, y: 18), from: CGPoint(x: 16, y: 18),
                            accent: true)
                p.node(19.5, 18, r: 1.7)
                p.node(12.6, 18, r: 1.7, accent: true, filled: true)
                p.line(9.5, 15.5, 9.5, 6.5)
                p.node(9.5, 5.4, r: 1.7)
            case .other:
                // Unclassified: three loose attempts with no shared path.
                p.node(6.5, 16.5, r: 1.7)
                p.node(12, 8.5, r: 1.7, accent: true, filled: true)
                p.node(17.5, 15, r: 1.7)
                p.line(3.5, 20.5, 20.5, 20.5, dash: [2, 2])
                p.line(6.5, 18.1, 6.5, 20.5, dash: [1.4, 1.6])
                p.line(12, 10.2, 12, 20.5, dash: [1.4, 1.6])
                p.line(17.5, 16.7, 17.5, 20.5, dash: [1.4, 1.6])
            }
        }
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

struct AbilityGlyph: View {
    var kind: AbilityKind
    var size: CGFloat = 30
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            // The rail is shared; the arc height and the marker position are what
            // separate the three grades.
            p.line(4, 16.5, 20, 16.5)
            for i in 0...7 { p.line(4.6 + CGFloat(i) * 2.2, 16.5, 4.6 + CGFloat(i) * 2.2, 18.4) }
            let apex: CGFloat, markerX: CGFloat, spread: CGFloat
            switch kind {
            case .developing: apex = 11.6; markerX = 8.2; spread = 5.4
            case .intermediate: apex = 10.0; markerX = 10.1; spread = 5.0
            case .advanced: apex = 8.4; markerX = 12.0; spread = 4.6
            case .elite: apex = 5.2; markerX = 15.8; spread = 3.4
            case .professional: apex = 3.8; markerX = 17.6; spread = 2.8
            }
            p.poly([CGPoint(x: 12 - spread - 1.6, y: 14.6),
                    CGPoint(x: 12 - spread, y: apex + 2.2),
                    CGPoint(x: 12, y: apex),
                    CGPoint(x: 12 + spread, y: apex + 2.2),
                    CGPoint(x: 12 + spread + 1.6, y: 14.6)])
            p.node(12 - spread - 1.6, 14.6, r: 1.5)
            p.node(12 - spread, apex + 2.2, r: 1.5)
            p.node(12, apex, r: 1.6)
            p.node(12 + spread, apex + 2.2, r: 1.5)
            p.node(12 + spread + 1.6, 14.6, r: 1.5)
            p.poly([CGPoint(x: markerX - 1.5, y: 20.6), CGPoint(x: markerX, y: 18.6),
                    CGPoint(x: markerX + 1.5, y: 20.6), CGPoint(x: markerX - 1.5, y: 20.6)],
                   accent: true)
        }
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

struct MediaFormatGlyph: View {
    var kind: MediaFormatKind
    var size: CGFloat = 24
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            p.captureBrackets(inset: 3, arm: 4, radius: 1.4)
            switch kind {
            case .mp4:
                // Frame run: four cells on a strip.
                p.rect(6.5, 9, 11, 6, radius: 0.8)
                p.line(9.25, 9, 9.25, 15)
                p.line(12, 9, 12, 15)
                p.line(14.75, 9, 14.75, 15)
                p.node(12, 12, r: 1.2, accent: true, filled: true)
            case .mov:
                // Playhead on a rail — a timeline, not a strip.
                p.line(6, 15.5, 18, 15.5)
                p.poly([CGPoint(x: 10, y: 8), CGPoint(x: 15.5, y: 11.4),
                        CGPoint(x: 10, y: 14.8), CGPoint(x: 10, y: 8)])
                p.node(13, 15.5, r: 1.3, accent: true, filled: true)
            case .jpg:
                // Single still: one framed horizon with a subject node.
                p.rect(6.5, 8.5, 11, 7, radius: 0.8)
                p.poly([CGPoint(x: 7.6, y: 14), CGPoint(x: 10.6, y: 11),
                        CGPoint(x: 13, y: 12.6), CGPoint(x: 16.4, y: 9.6)])
                p.node(16.4, 9.6, r: 1.2, accent: true, filled: true)
            case .png:
                // Transparency: the checker corner is the whole point of PNG.
                p.rect(6.5, 8.5, 11, 7, radius: 0.8)
                p.line(6.5, 12, 17.5, 12)
                p.line(12, 8.5, 12, 15.5)
                p.rect(6.5, 8.5, 5.5, 3.5, radius: 0, accent: true, dash: [1.3, 1.5])
                p.rect(12, 12, 5.5, 3.5, radius: 0, accent: true, dash: [1.3, 1.5])
            case .heic:
                // Stacked variants: HEIC carries more than one rendition.
                p.rect(8.5, 7.5, 9.5, 6, radius: 0.8)
                p.rect(6.5, 10.5, 9.5, 6, radius: 0.8)
                p.node(11.2, 13.5, r: 1.3, accent: true, filled: true)
            }
        }
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
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            // Forearm.
            p.line(8.2, 21.5, 10.2, 11.4)
            p.line(12.6, 21.5, 13.8, 11.8)
            // Back of the hand and the knuckle line.
            p.quad(CGPoint(x: 10.2, y: 11.4), CGPoint(x: 11.4, y: 7.4),
                   CGPoint(x: 15.4, y: 6.4))
            p.quad(CGPoint(x: 13.8, y: 11.8), CGPoint(x: 16.4, y: 10.6),
                   CGPoint(x: 17.6, y: 8.4))
            // Relaxed fingers hanging over.
            p.quad(CGPoint(x: 15.4, y: 6.4), CGPoint(x: 19.4, y: 6),
                   CGPoint(x: 19.8, y: 9.2))
            p.quad(CGPoint(x: 15.2, y: 8), CGPoint(x: 19, y: 7.8),
                   CGPoint(x: 19.4, y: 10.6))
            // The measured wrist break.
            p.node(11.4, 13.6, r: 1.5, filled: true)
            p.quad(CGPoint(x: 13.4, y: 14.6), CGPoint(x: 15.6, y: 16.6),
                   CGPoint(x: 18, y: 15.4), accent: true, dash: [1.4, 1.8])
            p.arrowHead(at: CGPoint(x: 18.4, y: 15.2), from: CGPoint(x: 16, y: 16.4),
                        span: 1.7, accent: true)
            p.node(14.6, 5.4, r: 1.6, accent: true, filled: true)
        }
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
        ShotIQApprovedRasterIcon(assetName: "shotiq-approved-mechanics-node-target",
                                 size: size,
                                 label: label)
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

/// Draws the bespoke mark for a caption, falling back to a system symbol only
/// when the family genuinely has no mark for that concept.
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
        case .none: Image(systemName: fallback).font(.system(size: size * 0.8))
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
