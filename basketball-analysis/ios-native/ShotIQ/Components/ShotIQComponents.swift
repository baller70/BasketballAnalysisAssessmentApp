import SwiftUI
import UIKit
import Photos
import AVKit

// Shared canonical components for the 72 iOS screens (853x1844 sidecar canvas).
// Charts, gauges and glyphs are SwiftUI Path/Canvas — never raster screenshots.

@MainActor
enum ShotIQSharePresenter {
    static func share(_ items: [Any]) {
        guard let scene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.activationState == .foregroundActive }),
              let window = scene.windows.first(where: { $0.isKeyWindow }),
              let root = window.rootViewController else { return }

        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        controller.popoverPresentationController?.sourceView = window
        controller.popoverPresentationController?.sourceRect = CGRect(x: window.bounds.midX,
                                                                      y: window.bounds.midY,
                                                                      width: 1,
                                                                      height: 1)

        var presenter = root
        while let presented = presenter.presentedViewController {
            presenter = presented
        }
        presenter.present(controller, animated: true)
    }
}

enum ShotIQPhotoSaver {
    static func savePNG(_ image: UIImage, filename: String) async throws {
        guard let data = image.pngData() else { throw CocoaError(.fileWriteUnknown) }
        let current = PHPhotoLibrary.authorizationStatus(for: .addOnly)
        let status = current == .notDetermined
            ? await PHPhotoLibrary.requestAuthorization(for: .addOnly)
            : current
        guard status == .authorized || status == .limited else {
            throw NSError(domain: "ShotIQPhotoSaver", code: 1)
        }
        try await PHPhotoLibrary.shared().performChanges {
            let options = PHAssetResourceCreationOptions()
            options.originalFilename = filename
            let request = PHAssetCreationRequest.forAsset()
            request.addResource(with: .photo, data: data, options: options)
        }
    }
}

final class ShotIQAspectFillVideoPlayerView: UIView {
    override class var layerClass: AnyClass { AVPlayerLayer.self }

    var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .black
        playerLayer.videoGravity = .resizeAspectFill
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = .black
        playerLayer.videoGravity = .resizeAspectFill
    }
}

struct ShotIQAspectFillVideoPlayer: UIViewRepresentable {
    let player: AVPlayer

    func makeUIView(context: Context) -> ShotIQAspectFillVideoPlayerView {
        let view = ShotIQAspectFillVideoPlayerView()
        view.playerLayer.player = player
        return view
    }

    func updateUIView(_ uiView: ShotIQAspectFillVideoPlayerView, context: Context) {
        uiView.playerLayer.player = player
        uiView.playerLayer.videoGravity = .resizeAspectFill
    }
}

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
    /// Wilson X numerals, replacing DIN Condensed.
    ///
    /// Medium, matching the display face — canonical does not set its numerals
    /// heavier than its headings. Measured at matched cap height against the
    /// canonical PNGs: 053 "62.5" cap 26 reads ink 0.376 and 052 "48.2%" cap 25
    /// reads 0.382, against medium 0.407, semibold 0.533 and bold 0.633.
    func shotiqNumeric(_ size: CGFloat = ShotIQType.numeric) -> some View {
        font(.custom("Tungsten-Medium", size: size))
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
            .minimumScaleFactor(0.62)
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
                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "gearshape"), size: 44).font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
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
        // REVERTED to `.sheet`. Changing this to `fullScreenCover` was not
        // asked for, and it broke every screen reached through the menu: the
        // app pins `.buttonStyle(.plain)` at the app root because iOS 26's
        // default style tint-washes every Button into a salmon capsule, and
        // that setting does not cross a presentation boundary any more than
        // the type clamp does. Moving the menu to a different presentation
        // moved the whole path behind it, and My Media came back with a pink
        // blob behind every chip, button and thumbnail.
        //
        // `.buttonStyle(.plain)` is now stated explicitly on the presented
        // content rather than inherited, so the style holds whichever
        // presentation this uses.
        .sheet(isPresented: $showMenu) {
            ProfileMenuView().modifier(CanonicalTypeScale()).buttonStyle(.plain)
        }
    }
}

/// One stat in the header strip: bespoke line mark, condensed numeral, tiny caps
/// label.
///
/// The mark is chosen from the *concept* (the caps label), not from the legacy
/// SF Symbol name a screen happens to pass, so the same statistic never gets two
/// different marks and two statistics never share one.
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
                StatMarkGlyph(kind: resolvedMark, size: 26).foregroundStyle(ShotIQColor.ink)
            } else {
                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                         size: 26,
                                         label: nil)
            }
            Text(value).font(.custom("Tungsten-Medium", size: ShotIQType.numeric))
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(label).shotiqMicroCaps()
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1)
                .minimumScaleFactor(0.55)
        }
    }
}

struct ShotIQVideoStillThumbnail: View {
    var url: URL
    var seconds: Double
    var width: CGFloat? = nil
    var height: CGFloat
    var cornerRadius: CGFloat = 5

    @State private var image: UIImage?
    @State private var failed = false

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                Rectangle()
                    .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                    .overlay {
                        if failed {
                            Image(systemName: "video")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(.white.opacity(0.8))
                        } else {
                            ProgressView()
                                .controlSize(.small)
                                .tint(ShotIQColor.shotiqOrange)
                        }
                    }
            }
        }
        .frame(width: width, height: height)
        .clipped()
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        .task(id: "\(url.absoluteString)-\(seconds)") { await loadStill() }
        .accessibilityLabel("Video frame thumbnail")
    }

    private func loadStill() async {
        image = nil
        failed = false
        let asset = AVURLAsset(url: url)
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: 640, height: 640)
        generator.requestedTimeToleranceBefore = .zero
        generator.requestedTimeToleranceAfter = .zero
        do {
            let cgImage = try generator.copyCGImage(at: CMTime(seconds: max(0, seconds),
                                                              preferredTimescale: 600),
                                                    actualTime: nil)
            await MainActor.run {
                image = UIImage(cgImage: cgImage)
            }
        } catch {
            await MainActor.run {
                failed = true
            }
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
    var statLinksEnabled: Bool = true
    var body: some View {
        GeometryReader { geo in
            let availableWidth = max(0, geo.size.width - 40)
            let statWidth = min(58, max(44, availableWidth * 0.15))
            HStack(alignment: .center, spacing: 8) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(name.uppercased())
                        .shotiqDisplay(38)   // 38 x 0.86 = 32.7pt vs h1 32.3
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    Text(subtitle)
                        .shotiqBody(ShotIQType.body)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1)
                        .minimumScaleFactor(0.62)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .layoutPriority(1)

                if statLinksEnabled {
                    NavigationLink { WorkoutCalendarView() } label: {
                        HeaderStat(icon: "film", value: streak, label: "DAY STREAK")
                            .frame(width: statWidth)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("home-day-streak-link")
                } else {
                    HeaderStat(icon: "film", value: streak, label: "DAY STREAK")
                        .frame(width: statWidth)
                }
                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                if statLinksEnabled {
                    NavigationLink { PointsSystemView() } label: {
                        HeaderStat(icon: "circle.hexagongrid", value: points, label: "POINTS")
                            .frame(width: statWidth)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("home-points-link")
                } else {
                    HeaderStat(icon: "circle.hexagongrid", value: points, label: "POINTS")
                        .frame(width: statWidth)
                }
            }
            .frame(width: availableWidth, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.top, 14)
        }
        .frame(height: 90)
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
                if let icon {
                    Image(systemName: icon)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(.white)
                }
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
                if let icon {
                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                             size: 28,
                                             label: nil)
                }
                Text(title).shotiqBody(ShotIQType.button)
            }
            .frame(maxWidth: .infinity).frame(height: ShotIQType.controlHeight)
            .background(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
            .foregroundStyle(ShotIQColor.ink)
        }
        .frame(minHeight: 44)
    }
}

// MARK: - Customer feedback

enum ShotIQToastKind: Equatable {
    case progress
    case success
    case error
    case info

    var icon: String {
        switch self {
        case .progress: return "hourglass"
        case .success: return "checkmark.circle.fill"
        case .error: return "exclamationmark.triangle.fill"
        case .info: return "info.circle.fill"
        }
    }

    var tint: Color {
        switch self {
        case .progress: return ShotIQColor.analysisBlue
        case .success: return ShotIQColor.confirmGreen
        case .error: return ShotIQColor.reviewRed
        case .info: return ShotIQColor.shotiqOrange
        }
    }
}

struct ShotIQToast: Equatable, Identifiable {
    var id = UUID()
    var kind: ShotIQToastKind
    var title: String
    var message: String? = nil
    var progress: Double? = nil
    var autoDismissSeconds: Double? = 2.2

    static func progress(_ title: String, _ message: String? = nil,
                         progress: Double? = nil) -> ShotIQToast {
        ShotIQToast(kind: .progress, title: title, message: message,
                    progress: progress, autoDismissSeconds: nil)
    }

    static func success(_ title: String, _ message: String? = nil) -> ShotIQToast {
        ShotIQToast(kind: .success, title: title, message: message)
    }

    static func error(_ title: String, _ message: String? = nil) -> ShotIQToast {
        ShotIQToast(kind: .error, title: title, message: message, autoDismissSeconds: 3.0)
    }

    static func info(_ title: String, _ message: String? = nil) -> ShotIQToast {
        ShotIQToast(kind: .info, title: title, message: message)
    }
}

private struct ShotIQToastView: View {
    let toast: ShotIQToast

    var body: some View {
        VStack(spacing: 7) {
            HStack(spacing: 10) {
                if toast.kind == .progress {
                    ProgressView()
                        .controlSize(.small)
                        .tint(toast.kind.tint)
                } else {
                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: toast.kind.icon),
                                             size: 24,
                                             label: nil)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(toast.title)
                        .shotiqBody(13, weight: .bold)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                    if let message = toast.message, !message.isEmpty {
                        Text(message)
                            .shotiqBody(11)
                            .foregroundStyle(ShotIQColor.graphite)
                            .lineLimit(2)
                            .minimumScaleFactor(0.75)
                    }
                }
                Spacer(minLength: 4)
            }
            if toast.kind == .progress {
                ProgressView(value: toast.progress ?? 0.55)
                    .tint(toast.kind.tint)
                    .accessibilityLabel("Action progress")
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        .shadow(color: .black.opacity(0.12), radius: 10, y: 4)
        .accessibilityElement(children: .combine)
        .accessibilityLabel([toast.title, toast.message].compactMap { $0 }.joined(separator: ". "))
        .accessibilityIdentifier("shotiq-toast")
    }
}

private struct ShotIQToastOverlay: ViewModifier {
    @Binding var toast: ShotIQToast?

    func body(content: Content) -> some View {
        ZStack(alignment: .top) {
            content
            if let toast {
                ShotIQToastView(toast: toast)
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .zIndex(20)
            }
        }
        .animation(.spring(response: 0.25, dampingFraction: 0.9), value: toast)
        .task(id: toast?.id) {
            guard let current = toast, let seconds = current.autoDismissSeconds else { return }
            try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            await MainActor.run {
                if toast?.id == current.id { toast = nil }
            }
        }
    }
}

extension View {
    func shotiqToast(_ toast: Binding<ShotIQToast?>) -> some View {
        modifier(ShotIQToastOverlay(toast: toast))
    }
}

// MARK: - Card

struct ShotIQCard<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        content
            .background(ShotIQColor.paper)
            .clipShape(RoundedRectangle(cornerRadius: ShotIQRadius.card))
            .overlay(
                RoundedRectangle(cornerRadius: ShotIQRadius.card)
                    .stroke(ShotIQColor.rule)
                    .allowsHitTesting(false)
            )
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
                        .font(.custom("Tungsten-Medium", size: ShotIQType.caption + 2.6))
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
        AdaptivePhaseRail(active: active)
    }
}

struct AdaptivePhaseRail: View {
    var active = "RELEASE"
    var action: ((String) -> Void)? = nil

    var body: some View {
        GeometryReader { geo in
            let cellWidth = max(48, geo.size.width / CGFloat(ShotPhase.allCases.count))
            let thumbWidth = min(72, max(52, cellWidth - 10))
            let thumbHeight = max(36, thumbWidth * 0.72)
            HStack(alignment: .top, spacing: 0) {
                ForEach(ShotPhase.allCases, id: \.self) { phase in
                    let on = ShotPhase(label: active) == phase
                    Button {
                        action?(phase.title)
                    } label: {
                        VStack(spacing: 4) {
                            PhasePhotoThumbnail(phase: phase,
                                                active: on,
                                                width: thumbWidth,
                                                height: thumbHeight,
                                                cornerRadius: 6)
                            Text(phase.title)
                                .shotiqBody(8, weight: on ? .bold : .semibold)
                                .kerning(0.25)
                                .foregroundStyle(on ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                .lineLimit(2)
                                .multilineTextAlignment(.center)
                                .minimumScaleFactor(0.65)
                                .frame(height: 24)
                            Rectangle()
                                .fill(on ? ShotIQColor.shotiqOrange : .clear)
                                .frame(width: min(34, cellWidth - 12), height: 3)
                        }
                        .frame(width: cellWidth)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .disabled(action == nil)
                    .accessibilityLabel("Jump to \(phase.title)")
                }
            }
            .frame(width: geo.size.width, alignment: .leading)
        }
        .frame(height: 98)
    }
}

struct PhasePhotoThumbnail: View {
    var phase: ShotPhase
    var active = false
    var width: CGFloat = 62
    var height: CGFloat = 46
    var cornerRadius: CGFloat = 5

    var body: some View {
        CanonicalPhoto(Self.assetKey(for: phase),
                       width: width,
                       height: height,
                       cornerRadius: cornerRadius,
                       alignment: Self.alignment(for: phase))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(active ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                            lineWidth: active ? 2 : 1)
            )
    }

    static func assetKey(for phase: ShotPhase) -> String {
        switch phase {
        case .setup: return "shotiq-phase-thumb-setup"
        case .load: return "shotiq-phase-thumb-load"
        case .rise: return "shotiq-phase-thumb-rise"
        case .release: return "shotiq-phase-thumb-release"
        case .follow: return "shotiq-phase-thumb-follow"
        }
    }

    private static func alignment(for phase: ShotPhase) -> Alignment {
        .center
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
                Image(systemName: "play.fill").font(.system(size: 20)).foregroundStyle(.white)
                Text("0:00 / \(duration)").font(.custom("Tungsten-Medium", size: 13)).foregroundStyle(.white)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(.white.opacity(0.35))
                        Capsule().fill(.white).frame(width: geo.size.width * progress)
                    }
                }
                .frame(height: 3)
                Image(systemName: "arrow.up.left.and.arrow.down.right").font(.system(size: 18)).foregroundStyle(.white)
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
            Text(value).font(.custom("Tungsten-Medium", size: valueSize)).foregroundStyle(color)
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
            GeometryReader { proxy in
                let screenWidth = min(proxy.size.width, UIScreen.main.bounds.width)
                content
                    .frame(width: screenWidth, alignment: .topLeading)
                    .clipped()
                    .frame(width: proxy.size.width, alignment: .topLeading)
            }
            if UITestHooks.active {
                Color.clear
                    .frame(width: 1, height: 1)
                    .accessibilityElement()
                    .accessibilityIdentifier(testID)
                    .accessibilityLabel(testID)
            }
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
        // THE CLAMP HAS TO LIVE HERE, NOT ONLY AT THE APP ROOT.
        //
        // `ShotIQApp` applies `CanonicalTypeScale()` to `RootView()` inside the
        // `WindowGroup`. That covers everything the navigation stack pushes and
        // nothing a `.sheet` presents: sheet content is hosted in its own
        // presentation context, seeded from the scene, so an environment value
        // set on the presenting view does not reach it. Every screen behind a
        // sheet therefore ran at the phone's real text size while every pushed
        // screen ran clamped.
        //
        // Measured in the r-simshots capture at accessibility-medium: `TopBar`
        // and `ProfileMenuView` both draw `Wordmark(size: 30)` — the same view,
        // same parameter — and the lockup came back 207px wide on a pushed
        // screen (026) and 322px wide inside the profile-menu sheet (021/024),
        // a factor of 1.556. That is the whole of what Kevin photographed:
        // "DASHBOARD MODE" broken mid-word to "DASHBOA / RD MODE", "Choose what
        // you see first when you open ShotIQ." falling into eight one-word
        // lines, the elite filter chips truncated to "All Le…", and the shooter
        // photo on 024 bleeding off the right edge. All four of those screens
        // (021 profile-menu, 022 points-system, 023 elite-shooters, 024
        // elite-shooter-detail) are reached through that one sheet.
        //
        // Clamping on the screen scaffold instead of the app root makes it
        // presentation-independent: pushed, presented, or covered, a canonical
        // screen pins its own scale. It is idempotent where the root modifier
        // already applied.
        .modifier(CanonicalTypeScale())
        .accessibilityIdentifier(testID)
    }
}

// MARK: - Bottom tab bar

enum RootTab: String, CaseIterable {
    case home = "Home"
    case analyze = "Capture"
    case training = "My Drills"
    case progress = "Progress"
    case elite = "Elite"
    case media = "My Media"
    case goals = "Goals"
    case profile = "Profile"

    var navMark: NavMark? {
        switch self {
        case .home: .home
        case .analyze: .capture
        case .training: .train
        case .progress: .progress
        case .elite, .media, .goals, .profile: nil
        }
    }
}

struct ShotIQTabBar: View {
    @Binding var tab: RootTab
    private var visibleTabs: [RootTab] {
        RootTab.allCases.filter { $0 != .progress && $0 != .goals && $0 != .profile }
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(alignment: .top, spacing: 0) {
                ForEach(visibleTabs, id: \.self) { t in
                    ShotIQTabButton(tab: t, isActive: tab == t) {
                        if tab != t { tab = t }
                    }
                }
            }
            .padding(.horizontal, 8)
        }
        .padding(.top, 10).padding(.bottom, 22)
        .background(ShotIQColor.paper)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
    }
}

private struct ShotIQTabButton: View {
    let tab: RootTab
    let isActive: Bool
    let action: () -> Void
    @EnvironmentObject private var app: AppState

    var body: some View {
        Button(action: action) {
            VStack(spacing: 5) {
                tabGlyph
                Text(tab.rawValue)
                    .shotiqBody(10, weight: isActive ? .bold : .regular)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .frame(width: 70)
            .frame(minHeight: 44)
            .foregroundStyle(isActive ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
        }
        // Explicitly plain: the iOS 26 default button treatment washes
        // buttons with the app tint — the salmon capsules on device.
        .buttonStyle(.plain)
        .accessibilityLabel(tab.rawValue)
        .accessibilityIdentifier("tab-\(tab.rawValue.lowercased())")
    }

    @ViewBuilder private var tabGlyph: some View {
        if let mark = tab.navMark {
            NavGlyph(mark: mark, size: 21, active: isActive)
        } else {
            switch tab {
            case .elite:
                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "person.2"),
                                         size: 21,
                                         label: nil)
            case .media:
                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "photo.stack"),
                                         size: 21,
                                         label: nil)
            case .goals:
                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "target"),
                                         size: 21,
                                         label: nil)
            case .profile:
                InitialsMark(initials: shotiqInitials(app.user), size: 21, active: isActive)
            case .home, .analyze, .training, .progress:
                EmptyView()
            }
        }
    }
}

struct ShotIQShareMetric: Identifiable {
    let id = UUID()
    var value: String
    var label: String
}

struct ShotIQSharePayload: Identifiable {
    let id = UUID()
    var title: String = "SHARE SHOTIQ"
    var subtitle: String = "Share this ShotIQ card with your network."
    var eyebrow: String = "SHOTIQ ANALYSIS"
    var headline: String = "ShotIQ"
    var subheadline: String = "AI shooting analysis"
    var primaryValue: String = "82"
    var primaryLabel: String = "FORM SCORE"
    var secondaryValue: String = "62.5%"
    var secondaryLabel: String = "MAKE %"
    var accentLabel: String = "GOOD"
    var metrics: [ShotIQShareMetric] = []
    var linkText: String = "shotiq.app"
    var image: UIImage? = nil
    var shareText: String

    static func simple(title: String,
                       headline: String,
                       subheadline: String,
                       primaryValue: String,
                       primaryLabel: String,
                       secondaryValue: String = "",
                       secondaryLabel: String = "",
                       accentLabel: String = "SHOTIQ",
                       metrics: [ShotIQShareMetric] = [],
                       image: UIImage? = nil,
                       shareText: String) -> ShotIQSharePayload {
        ShotIQSharePayload(title: title,
                           subtitle: "Share this ShotIQ card with your network.",
                           eyebrow: "SHOTIQ",
                           headline: headline,
                           subheadline: subheadline,
                           primaryValue: primaryValue,
                           primaryLabel: primaryLabel,
                           secondaryValue: secondaryValue,
                           secondaryLabel: secondaryLabel,
                           accentLabel: accentLabel,
                           metrics: metrics,
                           image: image,
                           shareText: shareText)
    }
}

struct ShotIQShareButton<Label: View>: View {
    var payload: ShotIQSharePayload
    private let label: () -> Label
    @State private var showShareDrawer = false

    init(payload: ShotIQSharePayload, @ViewBuilder label: @escaping () -> Label) {
        self.payload = payload
        self.label = label
    }

    var body: some View {
        Button {
            showShareDrawer = true
        } label: {
            label()
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showShareDrawer) {
            ShotIQShareDrawer(payload: payload)
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
                .modifier(CanonicalTypeScale())
        }
    }
}

struct ShotIQShareDrawer: View {
    let payload: ShotIQSharePayload
    @Environment(\.dismiss) private var dismiss
    @State private var copied = false
    @State private var saved = false

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(payload.title.uppercased())
                                .shotiqDisplay(44)
                                .foregroundStyle(ShotIQColor.ink)
                            Text(payload.subtitle)
                                .shotiqBody(14)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer(minLength: 12)
                        Button { dismiss() } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 22, weight: .bold))
                                .foregroundStyle(ShotIQColor.ink)
                                .frame(width: 58, height: 58)
                                .background(ShotIQColor.warmCanvas, in: Circle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Close share")
                    }
                    ShotIQSharePreviewCard(payload: payload)
                        .shadow(color: .black.opacity(0.08), radius: 12, y: 5)
                    VStack(spacing: 8) {
                        shareRow(icon: "link", title: copied ? "Copied link" : "Copy link") {
                            UIPasteboard.general.string = payload.shareText
                            withAnimation(.spring(response: 0.22, dampingFraction: 0.9)) {
                                copied = true
                            }
                        }
                        shareRow(icon: "message.fill", title: "Messages") { shareCard() }
                        shareRow(icon: "envelope.fill", title: "Mail") { shareCard() }
                        shareRow(icon: saved ? "checkmark.circle.fill" : "arrow.down.to.line", title: saved ? "Saved image" : "Save image") {
                            saveCard()
                        }
                    }
                }
                .padding(.horizontal, 22)
                .padding(.top, 22)
                .padding(.bottom, 18)
            }
            VStack(spacing: 12) {
                Button { shareCard() } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 18, weight: .semibold))
                        Text("SHARE").shotiqDisplay(25)
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                }
                .buttonStyle(.plain)
                Button { dismiss() } label: {
                    Text("CANCEL").shotiqDisplay(18)
                        .foregroundStyle(ShotIQColor.graphite)
                        .frame(maxWidth: .infinity)
                        .frame(height: 36)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 22)
            .padding(.top, 12)
            .padding(.bottom, 18)
            .background(ShotIQColor.paper)
        }
        .background(ShotIQColor.paper)
    }

    private func shareRow(icon: String, title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .frame(width: 28)
                Text(title).shotiqBody(15, weight: .medium)
                    .foregroundStyle(ShotIQColor.ink)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(ShotIQColor.graphite)
            }
            .frame(height: 52)
            .padding(.horizontal, 14)
            .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        }
        .buttonStyle(.plain)
    }

    @MainActor
    private func shareCard() {
        if let image = payload.image ?? ShotIQShareCardRenderer.render(payload: payload) {
            ShotIQSharePresenter.share([image, payload.shareText])
        } else {
            ShotIQSharePresenter.share([payload.shareText])
        }
    }

    @MainActor
    private func saveCard() {
        guard let image = payload.image ?? ShotIQShareCardRenderer.render(payload: payload) else { return }
        Task {
            do {
                try await ShotIQPhotoSaver.savePNG(image, filename: "ShotIQ-share-card.png")
                await MainActor.run { saved = true }
            } catch {
                await MainActor.run { saved = false }
            }
        }
    }
}

struct ShotIQSharePreviewCard: View {
    let payload: ShotIQSharePayload

    private var visibleMetrics: [ShotIQShareMetric] {
        let base = payload.metrics
        if !payload.secondaryValue.isEmpty {
            return [ShotIQShareMetric(value: payload.secondaryValue, label: payload.secondaryLabel)] + base
        }
        return base
    }

    var body: some View {
        VStack(spacing: 0) {
            shareBrandHeader
            shareScoreBand
            shareFeatureBlock
            shareMetricTable
            shareFooter
        }
        .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange.opacity(0.45), lineWidth: 1.4))
    }

    private var shareBrandHeader: some View {
        VStack(spacing: 10) {
            HStack(spacing: 0) {
                Text("SHOT").shotiqCondensed(31, weight: .black)
                    .foregroundStyle(ShotIQColor.ink)
                Text("IQ").shotiqCondensed(31, weight: .black)
                    .foregroundStyle(ShotIQColor.shotiqOrange)
            }
            Text(payload.eyebrow.uppercased())
                .shotiqBody(9, weight: .black)
                .kerning(0.7)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 18)
        .padding(.bottom, 14)
    }

    private var shareScoreBand: some View {
        HStack(spacing: 0) {
            VStack(spacing: 2) {
                Text(payload.primaryValue)
                    .font(.custom("Tungsten-Medium", size: 58))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .lineLimit(1)
                    .minimumScaleFactor(0.64)
                Text(payload.primaryLabel.uppercased())
                    .shotiqBody(8.5, weight: .black)
                    .kerning(0.5)
                    .foregroundStyle(.white.opacity(0.82))
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
            }
            .frame(maxWidth: .infinity)

            Rectangle().fill(Color.white.opacity(0.35)).frame(width: 1, height: 58)

            VStack(spacing: 3) {
                Text(payload.accentLabel.uppercased())
                    .shotiqBody(12, weight: .black)
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.68)
                Text("SHOTIQ")
                    .shotiqBody(8, weight: .black)
                    .kerning(0.6)
                    .foregroundStyle(.white.opacity(0.72))
            }
            .frame(maxWidth: .infinity)

            Rectangle().fill(Color.white.opacity(0.35)).frame(width: 1, height: 58)

            VStack(spacing: 2) {
                Text(payload.secondaryValue.isEmpty ? "LIVE" : payload.secondaryValue)
                    .font(.custom("Tungsten-Medium", size: 42))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.64)
                Text((payload.secondaryLabel.isEmpty ? "ANALYSIS" : payload.secondaryLabel).uppercased())
                    .shotiqBody(8.5, weight: .black)
                    .kerning(0.5)
                    .foregroundStyle(.white.opacity(0.82))
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 10)
        .background(ShotIQColor.ink)
    }

    private var shareFeatureBlock: some View {
        HStack(alignment: .center, spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(ShotIQColor.warmCanvas)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                if let image = payload.image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 86, height: 86)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                } else {
                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-pose-shooter",
                                             size: 58,
                                             label: nil)
                        .foregroundStyle(ShotIQColor.ink)
                    Circle()
                        .stroke(ShotIQColor.shotiqOrange, lineWidth: 2)
                        .frame(width: 42, height: 42)
                        .offset(x: 20, y: -18)
                }
            }
            .frame(width: 86, height: 86)

            VStack(alignment: .leading, spacing: 7) {
                Text(payload.headline.uppercased())
                    .shotiqDisplay(31)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(2)
                    .minimumScaleFactor(0.62)
                Text(payload.subheadline)
                    .shotiqBody(12, weight: .semibold)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(2)
                Text("SHAREABLE SHOTIQ CARD")
                    .shotiqBody(9, weight: .black)
                    .kerning(0.6)
                    .foregroundStyle(ShotIQColor.shotiqOrange)
            }
            Spacer(minLength: 0)
        }
        .padding(16)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
    }

    private var shareMetricTable: some View {
        VStack(spacing: 0) {
            ForEach(Array(visibleMetrics.prefix(6))) { metric in
                shareMetricRow(metric)
            }
        }
    }

    @ViewBuilder
    private func shareMetricRow(_ metric: ShotIQShareMetric) -> some View {
        let parts = metric.value.components(separatedBy: " / ")
        if parts.count == 2 {
            HStack(alignment: .center) {
                metricValue(parts[0], color: ShotIQColor.ink, alignment: .leading)
                Text(metric.label.uppercased())
                    .shotiqDisplay(18)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                    .frame(maxWidth: .infinity)
                metricValue(parts[1], color: ShotIQColor.shotiqOrange, alignment: .trailing)
            }
            .padding(.horizontal, 18)
            .frame(height: 52)
            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
        } else {
            HStack(alignment: .center, spacing: 12) {
                Text(metric.label.uppercased())
                    .shotiqDisplay(18)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                    .frame(maxWidth: .infinity, alignment: .leading)
                metricValue(metric.value, color: ShotIQColor.shotiqOrange, alignment: .trailing)
            }
            .padding(.horizontal, 18)
            .frame(height: 52)
            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
        }
    }

    private func metricValue(_ text: String, color: Color, alignment: Alignment) -> some View {
        Text(text)
            .font(.custom("Tungsten-Medium", size: 35))
            .foregroundStyle(color)
            .lineLimit(1)
            .minimumScaleFactor(0.58)
            .frame(maxWidth: .infinity, alignment: alignment)
    }

    private var shareFooter: some View {
        HStack(spacing: 12) {
            ShotIQQRMark()
                .frame(width: 58, height: 58)
                .padding(6)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 6))
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
            VStack(alignment: .leading, spacing: 4) {
                Text("FULL SHOTIQ BREAKDOWN")
                    .shotiqBody(12, weight: .black)
                    .foregroundStyle(ShotIQColor.ink)
                Text("Scan or tap the link to view details")
                    .shotiqBody(10, weight: .medium)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
                Text(payload.linkText)
                    .shotiqBody(11, weight: .black)
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }
            Spacer(minLength: 0)
        }
        .padding(16)
    }
}

private struct ShotIQQRMark: View {
    private let cells: Set<Int> = [
        0, 1, 2, 4, 6, 7, 8,
        9, 11, 13, 15, 17,
        18, 19, 20, 22, 24, 25, 26,
        28, 30, 31, 33, 35,
        36, 38, 40, 42, 44,
        45, 46, 48, 50, 52, 53,
        55, 57, 58, 60, 62,
        63, 64, 65, 67, 69, 70, 71
    ]

    var body: some View {
        GeometryReader { proxy in
            let gap: CGFloat = 2
            let size = (min(proxy.size.width, proxy.size.height) - gap * 8) / 9
            VStack(spacing: gap) {
                ForEach(0..<9, id: \.self) { row in
                    HStack(spacing: gap) {
                        ForEach(0..<9, id: \.self) { col in
                            let index = row * 9 + col
                            RoundedRectangle(cornerRadius: 1)
                                .fill(cells.contains(index) ? ShotIQColor.ink : Color.clear)
                                .frame(width: size, height: size)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        }
    }
}

struct ShotIQSelectionDrawer: View {
    @Binding var selection: String
    let title: String
    let subtitle: String
    let summary: String
    let options: [String]
    var clearTitle: String?
    var clearValue: String?
    var optionDetail: (String) -> String = { _ in "" }
    var optionIcon: (String) -> String = { _ in "circle" }
    var onSelect: (String) -> Void = { _ in }
    var onClear: (() -> Void)?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Capsule()
                .fill(ShotIQColor.graphite.opacity(0.35))
                .frame(width: 44, height: 5)
                .frame(maxWidth: .infinity)
                .padding(.bottom, 4)

            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 7) {
                    Text(title.uppercased())
                        .shotiqDisplay(42)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.62)
                    Text(subtitle)
                        .shotiqBody(13, weight: .semibold)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(2)
                }
                Spacer(minLength: 14)
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(ShotIQColor.ink)
                        .frame(width: 42, height: 42)
                        .background(ShotIQColor.warmCanvas, in: Circle())
                }
                .accessibilityIdentifier("shotiq-drawer-close")
            }

            HStack(spacing: 12) {
                Image(systemName: "slider.horizontal.3")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .frame(width: 34)
                Text(summary)
                    .shotiqBody(18, weight: .bold)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.66)
                Spacer()
            }
            .frame(height: 58)
            .padding(.horizontal, 12)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(ShotIQColor.rule, lineWidth: 1.2))

            VStack(spacing: 10) {
                ForEach(options, id: \.self) { option in
                    Button {
                        selection = option
                        onSelect(option)
                        dismiss()
                    } label: {
                        selectionRow(option)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("shotiq-drawer-option-\(option.replacingOccurrences(of: " ", with: "-").lowercased())")
                }
            }

            if let clearTitle {
                Button {
                    if let clearValue {
                        selection = clearValue
                    }
                    onClear?()
                    dismiss()
                } label: {
                    Text(clearTitle.uppercased())
                        .shotiqBody(14, weight: .black)
                        .kerning(0.4)
                        .frame(maxWidth: .infinity)
                        .frame(height: 46)
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8)
                            .stroke(ShotIQColor.shotiqOrange, lineWidth: 1.4))
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("shotiq-drawer-clear")
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 18)
        .background(Color.white)
    }

    private func selectionRow(_ option: String) -> some View {
        let selected = selection == option
        let detail = optionDetail(option)
        return HStack(spacing: 14) {
            Image(systemName: optionIcon(option))
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                .frame(width: 34)

            VStack(alignment: .leading, spacing: 2) {
                Text(option.uppercased())
                    .shotiqDisplay(28)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.68)
                if !detail.isEmpty {
                    Text(detail)
                        .shotiqBody(13, weight: .semibold)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                }
            }

            Spacer()

            Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.graphite.opacity(0.5))
        }
        .frame(height: 72)
        .padding(.horizontal, 12)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8)
            .stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                    lineWidth: selected ? 1.8 : 1.1))
    }
}

enum ShotIQShareCardRenderer {
    @MainActor
    static func render(payload: ShotIQSharePayload) -> UIImage? {
        let renderer = ImageRenderer(content: ShotIQSharePreviewCard(payload: payload)
            .frame(width: 640)
            .modifier(CanonicalTypeScale()))
        renderer.scale = 3
        return renderer.uiImage
    }
}
