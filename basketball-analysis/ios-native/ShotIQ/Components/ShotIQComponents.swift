import SwiftUI

// Shared canonical components for the 72 iOS screens (853x1844 sidecar canvas).
// Charts, gauges and glyphs are SwiftUI Path/Canvas — never raster screenshots.

// MARK: - Typography helpers bound to the sidecar token roles

/// Canonical type scale, in points.
///
/// Taken from the iOS sidecars, not from screenshots: the canonical canvas is
/// 853px wide against a 393pt device, so `pt = canvas_px x 0.4607`. These are the
/// median measured sizes per role across all 72 screens:
///
///   role     canvas px   pt
///   h1          70.0    32.3
///   h2          42.0    19.4
///   numeric     33.5    15.4
///   h4          28.0    12.9
///   body        26.0    12.0
///   caption     16.0     7.4
///
/// Sizes are set per role against this table — never by one blanket multiplier,
/// and never by comparing rendered glyph heights between Inter/Bebas/DIN and the
/// app's Wilson X Connect faces, which do not share metrics.
enum ShotIQType {
    static let h1: CGFloat = 32.3
    static let h2: CGFloat = 19.4
    static let numeric: CGFloat = 15.4
    static let h4: CGFloat = 12.9
    static let body: CGFloat = 12.0
    static let caption: CGFloat = 7.4
    /// The sidecar has no button role. Canonical CTA labels measure 1.18x the
    /// body line in the same typeface on 003/018, so the role is derived rather
    /// than looked up.
    static let button: CGFloat = 15.5

    /// All-caps micro-label ("DAY STREAK", "SHOTS", "FOLLOW-THROUGH").
    ///
    /// Measured off canonical 018 and 031: cap height 6.45pt, "DAY STREAK"
    /// 45.1pt wide. The shipped role was 7.4pt SF at 0.6 tracking — a 5.3pt cap
    /// smeared across 51.9pt, i.e. ~50% more tracking at a *smaller* cap height
    /// than canonical, which is what tips "FOLLOW-THROUGH" and "PRACTICE TIME"
    /// into the ellipsis. 9pt on the condensed width gives a 6.48pt cap at
    /// essentially the same advance, so the label gets taller without getting
    /// wider. Use via `shotiqMicroCaps()`.
    static let microLabel: CGFloat = 9

    /// Tracking for `microLabel`, cut by a third from the shipped 0.6. The
    /// generated token table (ShotIQTokens.ShotIQTypography.label/.caption)
    /// carries `letterSpacing: 0` — the tracking on these labels was never in
    /// the design system to begin with.
    static let microTracking: CGFloat = 0.4

    /// Section heading ("LATEST ANALYSIS", "SHOT RAIL:", "MEASUREMENTS").
    ///
    /// Canonical draws these in the bundled condensed display face, not in the
    /// body face: "LATEST ANALYSIS" measures 84.3pt wide at a 12.0pt cap on
    /// canonical 018. Tungsten-Bold advances 4.896em for that string at a
    /// 0.70em cap height, so 16pt lands at 78.3pt / 11.2pt cap — versus the
    /// shipped 127.3pt / 9.67pt cap in SF Bold at 0.8 tracking.
    static let sectionLabel: CGFloat = 16
    static let sectionTracking: CGFloat = 0.5

    /// Canonical control height. Measured on canonical 018 the primary CTA is
    /// 46.1pt tall (45.1 on 017, 47.9 on 003); the shipped buttons ran 54pt,
    /// and the home CTA 58pt — ~23% over, on the screens that then lost their
    /// footer modules off the bottom.
    static let controlHeight: CGFloat = 47
}

/// Wilson X Connect body face for a requested weight. Font.Weight is not
/// Comparable, so the mapping is an explicit switch.
func shotiqBoxedFace(_ weight: Font.Weight) -> String {
    switch weight {
    case .black, .heavy, .bold: return "BoxedHeavy"
    case .semibold, .medium: return "BoxedSemibold"
    default: return "BoxedMedium"
    }
}

/// Wilson X Connect condensed display face (Tungsten) for a requested weight.
/// The four cuts are all listed in `UIAppFonts`; PostScript names verified from
/// the OTF name tables.
func shotiqTungstenFace(_ weight: Font.Weight) -> String {
    switch weight {
    case .black: return "Tungsten-Black"
    case .heavy, .bold: return "Tungsten-Bold"
    case .semibold: return "Tungsten-Semibold"
    default: return "Tungsten-Medium"
    }
}

extension View {
    /// Canonical display face: Wilson X Connect "Tungsten Medium", bundled in
    /// the app via UIAppFonts. The scale factor absorbs any title that would
    /// still overflow its line.
    ///
    /// None of the four type helpers set a foreground colour any more. They
    /// used to hard-code `ShotIQColor.ink`, and for `Text` the *innermost*
    /// `foregroundStyle` wins — so a call site written
    /// `.shotiqBody(13).foregroundStyle(ShotIQColor.graphite)` rendered ink and
    /// silently lost its secondary colour. Ink is now the inherited default,
    /// set once at the `CanonicalScreen` root, which every call site's own
    /// `foregroundStyle` can override exactly as its author intended.
    /// Canonical's display weight is Tungsten MEDIUM, not Bold. Measured by
    /// rendering each cut at the canonical string's exact cap height and
    /// comparing ink density against the canonical PNG:
    ///
    ///   053 "JORDAN ELLIS"  cap 63  canonical 0.421 | medium 0.433 | bold 0.654
    ///   053 "CAREER SHOOTING SUMMARY"
    ///                       cap 28  canonical 0.423 | medium 0.459 | bold 0.662
    ///
    /// All four Tungsten cuts share a cap ratio, so the 0.86 multiplier that
    /// sets cap height is unchanged — only the stroke weight and the advance
    /// width it drags along change.
    func shotiqDisplay(_ size: CGFloat) -> some View {
        font(.custom("Tungsten-Medium", size: size * 0.86))
            .lineLimit(2)
            .minimumScaleFactor(0.5)
    }
    /// Wilson X numerals (Tungsten Semibold), replacing DIN Condensed.
    func shotiqNumeric(_ size: CGFloat = ShotIQType.numeric) -> some View {
        font(.custom("Tungsten-Semibold", size: size))
            .lineLimit(1)
            .minimumScaleFactor(0.6)
    }
    /// Wilson X body face (Boxed): Medium / Semibold / Heavy by weight.
    /// Defaulted to the canonical `body` role — it used to default to 16pt
    /// against a 12pt target, which is the upstream cause of most of the
    /// mid-word wrapping, truncation and clipped CTAs on the shipped screens.
    ///
    /// This is the helper the bulk of the screens route through: the shipped
    /// build set ~900 text runs in `.system(size:)`, i.e. SF Pro, at the right
    /// point sizes but the wrong advance widths. Sizes are carried over
    /// unchanged — the measured median literal is 12.0pt against a 12.0pt body
    /// target, so there was never anything wrong with the sizes.
    func shotiqBody(_ size: CGFloat = ShotIQType.body, weight: Font.Weight = .regular) -> some View {
        font(.custom(shotiqBoxedFace(weight), size: size))
    }

    /// Canonical all-caps micro-label: condensed width, canonical cap height,
    /// tracking cut by a third. See `ShotIQType.microLabel`.
    ///
    /// The condensed width is the half of this that stops the truncation —
    /// raising the cap height on the standard width would have made
    /// "FOLLOW-THROUGH", "PRACTICE TIME" and "BEST ACCURACY LAST COMPLETED"
    /// ellipsize harder, not less.
    ///
    /// The width now comes from the bundled condensed face rather than from
    /// SF Pro's `.width(.condensed)` axis. The point size is unchanged: the
    /// 9pt figure was derived from a 0.72em SF cap against canonical's 6.45pt,
    /// and Tungsten-Medium's cap is 0.70em, so 9pt still lands at 6.3pt of cap
    /// — within a tenth of the canonical label — while advancing narrower than
    /// SF Condensed, which can only reduce the truncation this role suffers.
    func shotiqMicroCaps(_ size: CGFloat = ShotIQType.microLabel,
                         weight: Font.Weight = .medium,
                         tracking: CGFloat = ShotIQType.microTracking) -> some View {
        font(.custom(shotiqTungstenFace(weight), size: size))
            .kerning(tracking)
            .lineLimit(1)
            .minimumScaleFactor(0.6)
    }

    /// Condensed brand face at a caller-chosen size, and nothing else — the
    /// face-only sibling of `shotiqMicroCaps`, for the call sites that already
    /// set their own kerning, line limit or scale factor and would have had
    /// those overridden. Same face, same point size, no other modifiers.
    func shotiqCondensed(_ size: CGFloat, weight: Font.Weight = .medium) -> some View {
        font(.custom(shotiqTungstenFace(weight), size: size))
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

/// Canonical section heading. Condensed display face, canonical cap height,
/// near-zero tracking — see `ShotIQType.sectionLabel`. Because the face is
/// ~34% narrower than the SF Bold it replaces, every row that pairs a section
/// label with a trailing control ("LATEST ANALYSIS" + "Today at 8:24 AM",
/// "QUEUE (3)" + "1 uploading • 1 completed") gets that width back.
struct SectionLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.custom("Tungsten-Medium", size: ShotIQType.sectionLabel))
            .kerning(ShotIQType.sectionTracking)
            .foregroundStyle(ShotIQColor.ink)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
    }
}

// MARK: - Wordmark

struct Wordmark: View {
    var size: CGFloat = 30
    var body: some View {
        HStack(spacing: 0) {
            // The wordmark is not the display face. Canonical draws SHOTIQ in a
            // normal-width grotesque: at cap 27 it advances 148px (aspect 5.48)
            // with ink density 0.436. Tungsten-Black is condensed and much
            // heavier — 73px at the same cap (aspect 2.70) and ink 0.657, so the
            // logo read as a narrow black slab. BoxedHeavy carries the same
            // weight (ink 0.448) at aspect 3.52; the rest of the width is the
            // letterform difference the rubric scopes out.
            Text("SHOT").font(.custom("BoxedHeavy", size: size * 0.74)).foregroundStyle(ShotIQColor.ink)
            Text("IQ").font(.custom("BoxedHeavy", size: size * 0.74)).foregroundStyle(ShotIQColor.shotiqOrange)
        }
        .lineLimit(1)
        .fixedSize()
        .accessibilityLabel("ShotIQ")
    }
}

// MARK: - Canonical top chrome (screens 017-072): wordmark bar + player header

struct TopBar: View {
    /// Screens that own a settings destination pass one in. Screens that don't
    /// used to leave the gear inert (`{}`) — it now opens the profile menu
    /// sheet, the same surface the home screens' gear opens.
    var onSettings: (() -> Void)?
    @State private var showMenu = false

    init(onSettings: (() -> Void)? = nil) { self.onSettings = onSettings }

    var body: some View {
        HStack {
            Wordmark(size: 30)
            Spacer()
            Button { if let onSettings { onSettings() } else { showMenu = true } } label: {
                Image(systemName: "gearshape").font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
            }
            .buttonStyle(.plain)
            // "Menu", not "Settings": this gear opens the profile menu (021),
            // while the profile screen has its own "Settings" row that opens the
            // settings hub (071). Both were called "Settings", so a search for
            // that name hit this header button first on every screen — which is
            // why tapping Settings on the profile screen opened the menu instead
            // and read as a dead tap. It also meant VoiceOver announced two
            // different destinations under one name.
            .accessibilityLabel("Menu")
        }
        .padding(.horizontal, 20)
        .frame(height: 52)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
        .sheet(isPresented: $showMenu) { ProfileMenuView() }
    }
}

/// One stat in the header strip: bespoke line mark, condensed numeral, tiny caps
/// label.
///
/// The mark is chosen from the *concept* (the caps label), not from the SF
/// Symbol name a screen happens to pass, so the same statistic never gets two
/// different marks and two statistics never share one. `icon` is kept as the
/// fallback for concepts canonical draws with a plain system-style icon.
struct HeaderStat: View {
    var icon: String
    var value: String
    var label: String
    /// Explicit override when the label alone is ambiguous.
    var mark: StatMarkKind? = nil

    /// Maps a canonical stat label onto its bespoke mark. The mapping itself
    /// lives on `StatMarkGlyph` so that every stat strip in the app — this
    /// header, 062's completion row, 069's media strip — resolves through one
    /// table and cannot drift into printing one mark for two statistics.
    private var resolvedMark: StatMarkKind? {
        mark ?? StatMarkGlyph.kind(forStatLabel: label)
    }

    var body: some View {
        VStack(spacing: 3) {
            if let resolvedMark {
                StatMarkGlyph(kind: resolvedMark, size: 19).foregroundStyle(ShotIQColor.ink)
            } else {
                Image(systemName: icon).font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
            }
            Text(value).font(.custom("Tungsten-Semibold", size: ShotIQType.numeric))
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(label).shotiqMicroCaps()
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
                Text(name.uppercased()).shotiqDisplay(38)   // 38 x 0.86 = 32.7pt vs h1 32.3
                Text(subtitle).shotiqBody(ShotIQType.body)
                    .foregroundStyle(ShotIQColor.graphite)
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
                Text(title).shotiqBody(ShotIQType.button, weight: .medium)
            }
            .frame(maxWidth: .infinity).frame(height: ShotIQType.controlHeight)
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
                Text(title).shotiqBody(ShotIQType.button)
            }
            .frame(maxWidth: .infinity).frame(height: ShotIQType.controlHeight)
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

/// Canonical charts are bounded and labelled: hairline gridlines, tick labels on
/// both axes, a tinted area under the line and a value callout on the last
/// point. The bare-polyline form is still the default so the 86x28 sparkline in
/// a stats row stays a sparkline — the chrome is opted into per call site.
struct TrendLine: View {
    let points: [Double]
    var stroke: Color = ShotIQColor.confirmGreen
    /// Tinted area between the line and the plot floor.
    var areaFill = false
    /// Horizontal hairlines behind the series (plus verticals when x labels
    /// are supplied).
    var gridlines = false
    /// Tick labels along the bottom axis, left-to-right.
    var xLabels: [String] = []
    /// Tick labels up the left axis, top-to-bottom (max first).
    var yLabels: [String] = []
    /// Value callout pinned to the final point.
    var endBadge: String? = nil
    /// Open nodes on every sample. Off for dense series.
    var showsNodes = true

    private var gutterLeft: CGFloat { yLabels.isEmpty ? 4 : 26 }
    private var gutterBottom: CGFloat { xLabels.isEmpty ? 4 : 13 }
    private var gutterRight: CGFloat { endBadge == nil ? 4 : 34 }

    var body: some View {
        GeometryReader { geo in
            let maxV = points.max() ?? 1, minV = points.min() ?? 0
            let span = max(maxV - minV, 0.0001)
            let plot = CGRect(x: gutterLeft, y: 5,
                              width: max(geo.size.width - gutterLeft - gutterRight, 1),
                              height: max(geo.size.height - 5 - gutterBottom, 1))
            let coords = points.enumerated().map { i, p in
                CGPoint(x: plot.minX + CGFloat(i) / CGFloat(max(points.count - 1, 1)) * plot.width,
                        y: plot.maxY - CGFloat((p - minV) / span) * plot.height)
            }
            ZStack(alignment: .topLeading) {
                if gridlines {
                    ForEach(0..<4, id: \.self) { i in
                        let y = plot.minY + plot.height * CGFloat(i) / 3
                        Rectangle().fill(ShotIQColor.rule)
                            .frame(width: plot.width, height: 1)
                            .position(x: plot.midX, y: y)
                    }
                    ForEach(xLabels.indices, id: \.self) { i in
                        let x = plot.minX + plot.width * CGFloat(i) / CGFloat(max(xLabels.count - 1, 1))
                        Rectangle().fill(ShotIQColor.rule.opacity(0.7))
                            .frame(width: 1, height: plot.height)
                            .position(x: x, y: plot.midY)
                    }
                }

                if areaFill, coords.count > 1 {
                    Path { p in
                        p.move(to: CGPoint(x: coords[0].x, y: plot.maxY))
                        coords.forEach { p.addLine(to: $0) }
                        p.addLine(to: CGPoint(x: coords[coords.count - 1].x, y: plot.maxY))
                        p.closeSubpath()
                    }
                    .fill(stroke.opacity(0.12))
                }

                Path { p in
                    guard let first = coords.first else { return }
                    p.move(to: first)
                    coords.dropFirst().forEach { p.addLine(to: $0) }
                }
                .stroke(stroke, style: StrokeStyle(lineWidth: 1.6, lineCap: .round, lineJoin: .round))

                if showsNodes {
                    ForEach(coords.indices, id: \.self) { i in
                        Circle().fill(stroke).frame(width: 5.5, height: 5.5).position(coords[i])
                    }
                }

                // Axis frame: canonical charts are bounded on the left and floor.
                if gridlines || !yLabels.isEmpty || !xLabels.isEmpty {
                    Rectangle().fill(ShotIQColor.rule)
                        .frame(width: 1, height: plot.height)
                        .position(x: plot.minX, y: plot.midY)
                    Rectangle().fill(ShotIQColor.rule)
                        .frame(width: plot.width, height: 1)
                        .position(x: plot.midX, y: plot.maxY)
                }

                ForEach(yLabels.indices, id: \.self) { i in
                    Text(yLabels[i])
                        .shotiqBody(ShotIQType.caption, weight: .medium)
                        .foregroundStyle(ShotIQColor.graphite)
                        .frame(width: gutterLeft - 4, alignment: .trailing)
                        .position(x: (gutterLeft - 4) / 2,
                                  y: plot.minY + plot.height * CGFloat(i) / CGFloat(max(yLabels.count - 1, 1)))
                }

                ForEach(xLabels.indices, id: \.self) { i in
                    Text(xLabels[i])
                        .shotiqBody(ShotIQType.caption, weight: .medium)
                        .foregroundStyle(ShotIQColor.graphite)
                        .fixedSize()
                        .position(x: plot.minX + plot.width * CGFloat(i) / CGFloat(max(xLabels.count - 1, 1)),
                                  y: plot.maxY + gutterBottom / 2 + 1)
                }

                if let endBadge, let last = coords.last {
                    Text(endBadge)
                        .font(.custom("Tungsten-Semibold", size: ShotIQType.caption + 2.6))
                        .foregroundStyle(stroke)
                        .lineLimit(1).fixedSize()
                        .padding(.horizontal, 4).padding(.vertical, 1)
                        .background(stroke.opacity(0.12), in: RoundedRectangle(cornerRadius: 3))
                        .position(x: min(last.x + gutterRight / 2 + 2, geo.size.width - gutterRight / 2),
                                  y: max(last.y, 8))
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

// MARK: - Phase strip
//
// `PhaseGlyph` and the five poses now live in Components/ShotIQGlyphs.swift.

struct PhaseStrip: View {
    var active = "RELEASE"
    var body: some View {
        HStack(alignment: .top) {
            ForEach(ShotPhase.allCases, id: \.self) { phase in
                let on = ShotPhase(label: active) == phase
                VStack(spacing: 4) {
                    PhaseGlyph(phase: phase, active: on, size: 28)
                    // "FOLLOW-THROUGH" is the longest label in the app and the
                    // rail gives it ~64pt. On the standard SF width at 0.5
                    // tracking it needed ~92pt, so it bottomed out on the 0.7
                    // scale floor and *still* ellipsized to "FOLLOW-THRO…" on
                    // 019/031/034/043/049/052/055/066. The condensed width plus
                    // the reduced tracking brings it inside the cell; canonical
                    // shrinks that one cell the same way (55.7pt at a 6.45pt
                    // cap while SETUP stays full size).
                    Text(phase.title)
                        .shotiqMicroCaps(weight: on ? .bold : .regular,
                                         tracking: ShotIQType.microTracking - 0.05)
                        .foregroundStyle(on ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                    if on {
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
    var valueSize: CGFloat = ShotIQType.numeric
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(.custom("Tungsten-Semibold", size: valueSize)).foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(label).shotiqMicroCaps()
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
        // Ink is the inherited default for the whole screen. It used to be
        // stamped inside `shotiqBody` / `shotiqNumeric` / `shotiqDisplay`,
        // which for `Text` beat any `foregroundStyle` the call site added
        // afterwards — the innermost one wins. Setting it here keeps every
        // uncoloured run at ink while letting a row that asks for graphite,
        // orange, green or white actually get it.
        .foregroundStyle(ShotIQColor.ink)
        .statusBarHidden(true) // sidecar contract: no system status icons
        // Every canonical screen paints its own header and its own back
        // affordance ("< ANALYZE", "BACK TO SIGN IN"). Without this the
        // NavigationStack also draws the system bar on every pushed screen,
        // which stacked a second back chevron above the ShotIQ lockup and ate
        // ~100pt: measured against the renders, content began at 13.3% of
        // screen height instead of canonical's 1.5%. That lost row is what
        // pushed the primary CTA off the bottom of most screens.
        .toolbar(.hidden, for: .navigationBar)
        // …and hiding the bar was only half of it. `statusBarHidden(true)`
        // stops the clock and the battery from drawing, but it does NOT
        // collapse the top safe-area inset: on the Dynamic Island devices the
        // window keeps reporting 59pt of sensor housing, and every screen laid
        // its content out below it. Measured on the r3 captures (1178x2556, 3x,
        // iPhone 15 Pro) the SHOTIQ wordmark's cap top sat at 74.3pt on every
        // single screen — 59pt of inset plus the ~15pt the wordmark sits down
        // inside the 52pt bar — against 12.4pt on canonical 017, 13.4pt on
        // canonical 018 and 9.2pt on canonical 066. The background already
        // ignored the inset, so the 59pt read as plain dead white above the
        // lockup and pushed a card's worth of content past the fold. Canonical
        // draws its own chrome from y=0, so the content has to as well; the
        // wordmark and gear sit outboard of the island cutout, exactly as the
        // renders show them.
        .ignoresSafeArea(.container, edges: .top)
        .accessibilityIdentifier(testID)
    }
}

// MARK: - Bottom tab bar (canonical 5-tab layout)

enum RootTab: String, CaseIterable {
    // Canonical tab labels are single short words (018/054/066: Home,
    // Capture, Train, Progress, Profile) so nothing ever wraps.
    case home = "Home", analyze = "Capture", training = "Train", progress = "Progress", profile = "Profile"
    var icon: String {
        switch self {
        // Canonical draws a capture reticle for tab 2, not a line chart, and a
        // target frame for Home rather than a filled house.
        case .home: "viewfinder"; case .analyze: "camera.viewfinder"; case .training: "figure.run"
        case .progress: "chart.line.uptrend.xyaxis"; case .profile: "person.crop.circle"
        }
    }
    /// Canonical draws five unrelated bespoke marks here — a framing reticle, a
    /// node graph, a rail, a rising node arc, and the player's initials.
    var navMark: NavMark? {
        switch self {
        case .home: .home; case .analyze: .capture; case .training: .train
        case .progress: .progress; case .profile: nil
        }
    }
}

struct ShotIQTabBar: View {
    @Binding var tab: RootTab
    @EnvironmentObject private var app: AppState
    var body: some View {
        HStack {
            ForEach(RootTab.allCases, id: \.self) { t in
                Button { tab = t } label: {
                    VStack(spacing: 5) {
                        if let mark = t.navMark {
                            NavGlyph(mark: mark, size: 21, active: tab == t)
                        } else {
                            InitialsMark(initials: shotiqInitials(app.user), size: 21, active: tab == t)
                        }
                        Text(t.rawValue)
                            .shotiqBody(10, weight: tab == t ? .bold : .regular)
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
