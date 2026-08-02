import SwiftUI

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
            p.line(10, 8.4, 12.6, 11.4)
            p.node(14.8, 12.8, r: 2.2, accent: active, filled: active, knockout: false)
        case .load:
            // Deep knee bend, ball low and in front — gathering.
            p.circle(8.6, 6.4, r: 2)
            p.line(8.6, 8.4, 10.8, 13)
            p.poly([CGPoint(x: 10.8, y: 13), CGPoint(x: 7.8, y: 16.2), CGPoint(x: 8.6, y: 21.4)])
            p.poly([CGPoint(x: 10.8, y: 13), CGPoint(x: 13.6, y: 16.4), CGPoint(x: 13.6, y: 21.4)])
            p.line(9.5, 10.4, 12.2, 12.4)
            p.node(14.4, 13.6, r: 2.2, accent: active, filled: active, knockout: false)
        case .rise:
            // Extending upward, ball at the forehead — the lift.
            p.circle(10.6, 5.6, r: 2)
            p.line(10.6, 7.6, 10.6, 13.6)
            p.poly([CGPoint(x: 10.6, y: 13.6), CGPoint(x: 8.2, y: 17.4), CGPoint(x: 8.6, y: 21.4)])
            p.poly([CGPoint(x: 10.6, y: 13.6), CGPoint(x: 12.8, y: 17.2), CGPoint(x: 13.8, y: 20.8)])
            p.line(10.6, 9, 12.8, 7.2)
            p.node(15.4, 6, r: 2.2, accent: active, filled: active, knockout: false)
        case .release:
            // Full extension, ball leaving the hand overhead.
            p.circle(9.6, 8, r: 2)
            p.line(9.6, 10, 10.4, 15.2)
            p.poly([CGPoint(x: 10.4, y: 15.2), CGPoint(x: 8.4, y: 18.6), CGPoint(x: 8, y: 21.6)])
            p.poly([CGPoint(x: 10.4, y: 15.2), CGPoint(x: 12.8, y: 18.4), CGPoint(x: 13.8, y: 21.4)])
            p.poly([CGPoint(x: 9.9, y: 11), CGPoint(x: 12.4, y: 7.8), CGPoint(x: 13.2, y: 5.4)])
            p.node(14.4, 2.8, r: 2.2, accent: active, filled: active, knockout: false)
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
        ShotIQGlyph(size: size, accent: ShotIQColor.shotiqOrange) { p in
            phase.draw(&p, active: active)
        }
        .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
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
                p.line(12, 5.4, 12, 18.6, accent: true)
                p.node(12, 12, r: 1.7, accent: true, filled: true)
            case .liveCamera:
                p.captureBrackets()
                p.circle(11.2, 8.6, r: 1.5)
                p.line(11.2, 10.1, 11.6, 14)
                p.poly([CGPoint(x: 11.6, y: 14), CGPoint(x: 9.6, y: 16.8)])
                p.poly([CGPoint(x: 11.6, y: 14), CGPoint(x: 13.6, y: 16.6)])
                p.poly([CGPoint(x: 11.3, y: 11.2), CGPoint(x: 14, y: 9.4)])
                p.node(15.4, 8.6, r: 1.5, accent: true, filled: true)
            }
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
        ShotIQGlyph(size: size, label: label) { p in
            p.captureBrackets(inset: 3.5, arm: 4, radius: 1.4)
            p.node(12, 12, r: 2.2, filled: true)
        }
    }
}

// MARK: - Measurement diagrams

/// One diagram per measurable quantity. Never share a kind between two metrics.
enum MechanicKind {
    case elbowAngle, wristArc, releaseHeight, distance, jump, ballArc
    case centerline, balance, drift, impact, tempo, consistency
}

struct MechanicGlyph: View {
    var kind: MechanicKind
    var size: CGFloat = 22
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .elbowAngle:
                // Two limb segments meeting at a joint, measured sweep dotted in.
                p.poly([CGPoint(x: 4.5, y: 16.5), CGPoint(x: 11, y: 8), CGPoint(x: 19.5, y: 14.5)])
                p.quad(CGPoint(x: 8, y: 13.4), CGPoint(x: 11.4, y: 16.2), CGPoint(x: 15, y: 12.6),
                       accent: true, dash: [1.4, 1.8])
                p.node(4.5, 16.5, r: 1.5)
                p.node(11, 8, r: 1.5, accent: true)
                p.node(19.5, 14.5, r: 1.5)
            case .wristArc:
                // Forearm into a cocked hand, flexion dotted at the joint.
                p.poly([CGPoint(x: 4.5, y: 19), CGPoint(x: 10.5, y: 11.5), CGPoint(x: 16, y: 9)])
                p.line(16, 9, 18.5, 11)
                p.quad(CGPoint(x: 12.4, y: 9.6), CGPoint(x: 9.4, y: 9.8), CGPoint(x: 9.4, y: 13.6),
                       accent: true, dash: [1.4, 1.8])
                p.node(10.5, 11.5, r: 1.5, accent: true)
                p.node(4.5, 19, r: 1.5)
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
        case k.contains("elbow"): self = .elbowAngle
        case k.contains("wrist") || k.contains("snap"): self = .wristArc
        case k.contains("height"): self = .releaseHeight
        case k.contains("angle") || k.contains("arc"): self = .ballArc
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
        case k.contains("distance") || k.contains("range") || k.contains("depth"):
            self = .distance
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

struct CorrectionGlyph: View {
    var kind: CorrectionKind
    var size: CGFloat = 22
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
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
    /// Target with a struck centre — makes.
    case accuracy
}

struct StatMarkGlyph: View {
    var kind: StatMarkKind
    var size: CGFloat = 20
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
        ShotIQGlyph(size: size, accent: accent, label: label) { p in
            switch kind {
            case .points:
                p.poly([CGPoint(x: 12, y: 2.6), CGPoint(x: 20.2, y: 7.3), CGPoint(x: 20.2, y: 16.7),
                        CGPoint(x: 12, y: 21.4), CGPoint(x: 3.8, y: 16.7), CGPoint(x: 3.8, y: 7.3),
                        CGPoint(x: 12, y: 2.6)])
                p.circle(12, 12, r: 4)
                p.line(8, 12, 16, 12)
                p.quad(CGPoint(x: 12, y: 8), CGPoint(x: 14.6, y: 12), CGPoint(x: 12, y: 16))
                p.quad(CGPoint(x: 12, y: 8), CGPoint(x: 9.4, y: 12), CGPoint(x: 12, y: 16))
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
                p.node(12, 12, r: 1.7, accent: true, filled: true)
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
            }
        }
    }
}

// MARK: - Workout marks

/// Scheduled-workout marks — one shape per drill family.
enum WorkoutKind { case release, ladder, flow }

struct WorkoutGlyph: View {
    var kind: WorkoutKind
    var size: CGFloat = 20
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
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

// MARK: - Capture readiness

/// Capture-readiness checks — bracketed framing marks, one per check.
enum ReadinessKind { case athlete, framing, lighting, stability }

struct ReadinessGlyph: View {
    var kind: ReadinessKind
    var size: CGFloat = 24
    var accent: Color = ShotIQColor.shotiqOrange
    var label: String? = nil

    var body: some View {
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
                p.rect(8.5, 6.5, 7, 11, radius: 1, accent: true)
                p.circle(12, 9.4, r: 1.1)
                p.line(12, 10.5, 12, 14)
                p.line(12, 11.6, 10.3, 12.6)
                p.line(12, 11.6, 13.7, 12.6)
                p.line(12, 14, 10.6, 16.2)
                p.line(12, 14, 13.4, 16.2)
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
                p.rect(6.5, 8.5, 11, 7, radius: 1)
                p.line(12, 14, 12, 10, accent: true)
                p.arrowHead(at: CGPoint(x: 12, y: 9.6), from: CGPoint(x: 12, y: 13), accent: true)
            }
        }
    }
}

// MARK: - Tab-bar marks

/// The five bottom-tab marks. Canonical draws a capture reticle for Home, a node
/// graph for Capture, a rail for Train, a rising node arc for Progress and the
/// player's initials for Profile — five unrelated shapes.
enum NavMark { case home, capture, train, progress }

struct NavGlyph: View {
    var mark: NavMark
    var size: CGFloat = 22
    var active = false

    var body: some View {
        ShotIQGlyph(size: size, accent: ShotIQColor.shotiqOrange) { p in
            switch mark {
            case .home:
                p.captureBrackets(inset: 3.5, arm: 4, radius: 1.4)
                p.node(12, 12, r: 2.2, accent: active, filled: active)
            case .capture:
                p.line(6.5, 15.5, 12, 9.5)
                p.line(12, 9.5, 18, 14)
                p.node(6.5, 15.5, r: 2)
                p.node(12, 9.5, r: 2.2, accent: active, filled: active)
                p.node(18, 14, r: 2)
            case .train:
                p.line(3.5, 8.5, 20.5, 8.5)
                p.line(3.5, 15.5, 20.5, 15.5)
                p.node(7.5, 12, r: 1.9)
                p.node(12, 12, r: 1.9, accent: active, filled: active)
                p.node(16.5, 12, r: 1.9)
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

/// Profile tab: canonical prints the player's initials in a hairline box rather
/// than a person silhouette.
struct InitialsMark: View {
    var initials: String
    var size: CGFloat = 22
    var active = false
    var body: some View {
        Text(initials)
            .font(.system(size: size * 0.46, weight: .heavy).width(.condensed))
            .kerning(0.3)
            .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
            .frame(width: size, height: size * 0.86)
            .overlay(RoundedRectangle(cornerRadius: 2)
                .stroke(active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite,
                        lineWidth: shotiqGlyphStrokeWidth(size) * size / 24))
            .accessibilityHidden(true)
    }
}
