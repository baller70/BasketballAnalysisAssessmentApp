import SwiftUI

// Shared canonical components for the 72 iOS screens (853x1844 sidecar canvas).
// Charts, gauges and glyphs are SwiftUI Path/Canvas — never raster screenshots.

// MARK: - Typography helpers bound to the sidecar token roles

extension View {
    /// Canonical display face. Bebas Neue is NOT an iOS system font — asking
    /// for it fell back to full-width SF at the raw sidecar pixel size, which
    /// is what shattered every page title on device. The system condensed
    /// width at ~0.8x reproduces the canonical narrow-caps look, and the
    /// scale factor absorbs any title that would still overflow.
    func shotiqDisplay(_ size: CGFloat) -> some View {
        // Wilson X Connect display face (Tungsten Bold), bundled via UIAppFonts.
        font(.custom("Tungsten-Bold", size: size * 0.86))
            .foregroundStyle(ShotIQColor.ink)
            .lineLimit(2)
            .minimumScaleFactor(0.5)
    }
    func shotiqNumeric(_ size: CGFloat) -> some View {
        // DIN Condensed ships with iOS as "Tungsten-Semibold", so unlike web the
        // canonical numeric face is available natively. Numerals never wrap.
        // Wilson X numerals (Tungsten Semibold) replace DIN Condensed.
        font(.custom("Tungsten-Semibold", size: size)).foregroundStyle(ShotIQColor.ink)
            .lineLimit(1)
            .minimumScaleFactor(0.6)
    }
    func shotiqBody(_ size: CGFloat = 16, weight: Font.Weight = .regular) -> some View {
        // Wilson X body face (Boxed): Medium / Semibold / Heavy by weight.
        let face = weight >= .bold ? "BoxedHeavy" : (weight >= .semibold ? "BoxedSemibold" : "BoxedMedium")
        return font(.custom(face, size: size)).foregroundStyle(ShotIQColor.ink)
    }
}

/// Initials for the signed-in player (canonical player-card / Profile-tab badge).
/// The mockups show "JE" for the placeholder player Jordan Ellis — real builds
/// derive from the account.
func shotiqInitials(_ user: APIUser?) -> String {
    let first = user?.firstName ?? ""
    let last = user?.lastName ?? ""
    let combo = "\(first.prefix(1))\(last.prefix(1))"
    if !combo.isEmpty { return combo.uppercased() }
    if let name = user?.displayName, !name.isEmpty {
        let parts = name.split(separator: " ")
        let combo = parts.prefix(2).map { String($0.prefix(1)) }.joined()
        if !combo.isEmpty { return combo.uppercased() }
    }
    if let email = user?.email, let c = email.first { return String(c).uppercased() }
    return "SI"
}

struct SectionLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 12, weight: .bold))
            .kerning(0.8)
            .foregroundStyle(ShotIQColor.ink)
    }
}

// MARK: - Wordmark

struct Wordmark: View {
    var size: CGFloat = 30
    var body: some View {
        HStack(spacing: 0) {
            Text("SHOT").font(.custom("Tungsten-Black", size: size * 0.9)).foregroundStyle(ShotIQColor.ink)
            Text("IQ").font(.custom("Tungsten-Black", size: size * 0.9)).foregroundStyle(ShotIQColor.shotiqOrange)
        }
        .lineLimit(1)
        .fixedSize()
        .accessibilityLabel("ShotIQ")
    }
}

// MARK: - Canonical top chrome (screens 017-072): wordmark bar + player header

struct TopBar: View {
    var onSettings: () -> Void = {}
    var body: some View {
        HStack {
            Wordmark(size: 30)
            Spacer()
            Button(action: onSettings) {
                Image(systemName: "gearshape").font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Settings")
        }
        .padding(.horizontal, 20)
        .frame(height: 52)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
    }
}

/// One stat in the header strip: small line icon, DIN numeral, tiny caps label.
struct HeaderStat: View {
    var icon: String
    var value: String
    var label: String
    var body: some View {
        VStack(spacing: 3) {
            Image(systemName: icon).font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
            Text(value).font(.custom("Tungsten-Semibold", size: 24)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(label).font(.system(size: 9, weight: .medium)).kerning(0.6)
                .foregroundStyle(ShotIQColor.graphite)
        }
    }
}

/// Canonical player header: condensed-caps name + gray subtitle on the left,
/// streak/points stats separated by hairlines on the right.
struct PlayerHeader: View {
    var name: String
    var subtitle: String = "Right-handed • Advanced"
    var streak: String = "6"
    var points: String = "2,840"
    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(name.uppercased()).shotiqDisplay(38)
                Text(subtitle).font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer(minLength: 8)
            HeaderStat(icon: "film", value: streak, label: "DAY STREAK")
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
            HeaderStat(icon: "circle.hexagongrid", value: points, label: "POINTS")
        }
        .padding(.horizontal, 20)
        .padding(.top, 14)
    }
}

// MARK: - Buttons

struct PrimaryButton: View {
    let title: String
    var icon: String? = nil
    var color: Color = ShotIQColor.shotiqOrange
    var action: () -> Void = {}
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if let icon { Image(systemName: icon) }
                Text(title).font(.system(size: 17, weight: .medium))
            }
            .frame(maxWidth: .infinity).frame(height: 54)
            .background(color, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
            .foregroundStyle(.white)
        }
        .frame(minHeight: 44) // minimum tap target
    }
}

struct SecondaryButton: View {
    let title: String
    var icon: String? = nil
    var action: () -> Void = {}
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if let icon { Image(systemName: icon) }
                Text(title).font(.system(size: 17))
            }
            .frame(maxWidth: .infinity).frame(height: 54)
            .background(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
            .foregroundStyle(ShotIQColor.ink)
        }
        .frame(minHeight: 44)
    }
}

// MARK: - Card

struct ShotIQCard<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        content
            .background(ShotIQColor.paper)
            .clipShape(RoundedRectangle(cornerRadius: ShotIQRadius.card))
            .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.card).stroke(ShotIQColor.rule))
    }
}

// MARK: - Data-driven trend line (SwiftUI Path — sidecar contract: no rasters)

struct TrendLine: View {
    let points: [Double]
    var stroke: Color = ShotIQColor.confirmGreen
    var body: some View {
        GeometryReader { geo in
            let maxV = points.max() ?? 1, minV = points.min() ?? 0
            let span = max(maxV - minV, 0.0001)
            let pad: CGFloat = 4
            let coords = points.enumerated().map { i, p in
                CGPoint(x: pad + CGFloat(i) / CGFloat(max(points.count - 1, 1)) * (geo.size.width - 2 * pad),
                        y: geo.size.height - pad - CGFloat((p - minV) / span) * (geo.size.height - 2 * pad))
            }
            ZStack {
                Path { p in
                    guard let first = coords.first else { return }
                    p.move(to: first)
                    coords.dropFirst().forEach { p.addLine(to: $0) }
                }
                .stroke(stroke, style: StrokeStyle(lineWidth: 1.6, lineCap: .round, lineJoin: .round))
                ForEach(coords.indices, id: \.self) { i in
                    Circle().fill(stroke).frame(width: 5.5, height: 5.5).position(coords[i])
                }
            }
        }
        .accessibilityHidden(true)
    }
}

// MARK: - Progress ring

struct Ring: View {
    let pct: Double
    var color: Color = ShotIQColor.shotiqOrange
    var lineWidth: CGFloat = 8
    var body: some View {
        ZStack {
            Circle().stroke(ShotIQColor.rule, lineWidth: lineWidth)
            Circle().trim(from: 0, to: max(0, min(1, pct)))
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}

// MARK: - Linear score bar

struct ScoreBar: View {
    let pct: Double
    var color: Color = ShotIQColor.shotiqOrange
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(ShotIQColor.rule)
                Capsule().fill(color).frame(width: geo.size.width * max(0, min(1, pct)))
            }
        }
        .frame(height: 7)
    }
}

// MARK: - Pose phase glyph (parametric, recolourable)

struct PhaseGlyph: View {
    var active = false
    var size: CGFloat = 30
    var body: some View {
        let c: Color = active ? ShotIQColor.shotiqOrange : ShotIQColor.ink
        Canvas { ctx, sz in
            let s = sz.width / 30
            var body = Path()
            body.move(to: CGPoint(x: 17 * s, y: 8 * s))
            body.addLine(to: CGPoint(x: 15 * s, y: 15 * s))
            body.addLine(to: CGPoint(x: 11 * s, y: 21 * s))
            body.move(to: CGPoint(x: 15 * s, y: 15 * s))
            body.addLine(to: CGPoint(x: 18 * s, y: 21 * s))
            body.move(to: CGPoint(x: 17 * s, y: 9.5 * s))
            body.addLine(to: CGPoint(x: 22 * s, y: 7 * s))
            body.addLine(to: CGPoint(x: 24 * s, y: 3 * s))
            ctx.stroke(body, with: .color(c), style: StrokeStyle(lineWidth: 1.6 * s, lineCap: .round))
            ctx.stroke(Path(ellipseIn: CGRect(x: 14.4 * s, y: 2.4 * s, width: 5.2 * s, height: 5.2 * s)),
                       with: .color(c), lineWidth: 1.6 * s)
            let ball = Path(ellipseIn: CGRect(x: 23.2 * s, y: 0.7 * s, width: 3.6 * s, height: 3.6 * s))
            if active { ctx.fill(ball, with: .color(c)) } else { ctx.stroke(ball, with: .color(c), lineWidth: 1.4 * s) }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

// MARK: - Phase strip

struct PhaseStrip: View {
    var active = "RELEASE"
    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    var body: some View {
        HStack(alignment: .top) {
            ForEach(phases, id: \.self) { p in
                VStack(spacing: 4) {
                    PhaseGlyph(active: p == active, size: 28)
                    Text(p)
                        .font(.system(size: 9, weight: p == active ? .bold : .regular))
                        .kerning(0.5)
                        .foregroundStyle(p == active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                    if p == active {
                        Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 40, height: 3)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
    }
}

// MARK: - Media surface (dark allowed only where the canonical screen has video)

struct MediaSurface: View {
    var height: CGFloat
    var duration = "0:07"
    var progress: Double = 0.28
    var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: 4).fill(Color(red: 0.106, green: 0.114, blue: 0.125))
            HStack(spacing: 10) {
                Image(systemName: "play.fill").font(.system(size: 13)).foregroundStyle(.white)
                Text("0:00 / \(duration)").font(.custom("Tungsten-Semibold", size: 13)).foregroundStyle(.white)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(.white.opacity(0.35))
                        Capsule().fill(.white).frame(width: geo.size.width * progress)
                    }
                }
                .frame(height: 3)
                Image(systemName: "arrow.up.left.and.arrow.down.right").font(.system(size: 12)).foregroundStyle(.white)
            }
            .padding(.horizontal, 14).padding(.bottom, 14)
        }
        .frame(height: height)
    }
}

// MARK: - Stat block

struct StatBlock: View {
    let value: String
    let label: String
    var color: Color = ShotIQColor.ink
    var valueSize: CGFloat = 26
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(.custom("Tungsten-Semibold", size: valueSize)).foregroundStyle(color)
            Text(label).font(.system(size: 10, weight: .medium)).kerning(0.7)
                .foregroundStyle(ShotIQColor.graphite)
        }
    }
}

// MARK: - Canonical screen scaffold: white canvas, hidden status bar

struct CanonicalScreen<Content: View>: View {
    var testID: String
    @ViewBuilder var content: Content
    var body: some View {
        ZStack(alignment: .top) {
            ShotIQColor.paper.ignoresSafeArea()
            content
        }
        .statusBarHidden(true) // sidecar contract: no system status icons
        .accessibilityIdentifier(testID)
    }
}

// MARK: - Bottom tab bar (canonical 5-tab layout)

enum RootTab: String, CaseIterable {
    // Canonical tab labels are single short words (018/054/066: Home,
    // Capture, Train, Progress, Profile) so nothing ever wraps.
    case home = "Home", analyze = "Analyze", training = "Train", progress = "Progress", profile = "Profile"
    var icon: String {
        switch self {
        case .home: "house"; case .analyze: "chart.xyaxis.line"; case .training: "figure.run"
        case .progress: "chart.line.uptrend.xyaxis"; case .profile: "person.crop.circle"
        }
    }
}

struct ShotIQTabBar: View {
    @Binding var tab: RootTab
    var body: some View {
        HStack {
            ForEach(RootTab.allCases, id: \.self) { t in
                Button { tab = t } label: {
                    VStack(spacing: 5) {
                        Image(systemName: t.icon).font(.system(size: 21))
                        Text(t.rawValue)
                            .font(.system(size: 10, weight: tab == t ? .bold : .regular))
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .foregroundStyle(tab == t ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                }
                // Explicitly plain: the iOS 26 default button treatment washes
                // buttons with the app tint — the salmon capsules on device.
                .buttonStyle(.plain)
                .accessibilityLabel(t.rawValue)
            }
        }
        .padding(.top, 10).padding(.bottom, 22)
        .background(ShotIQColor.paper)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
    }
}
