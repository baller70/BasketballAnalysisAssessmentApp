import SwiftUI

/// Photographic imagery lifted from the canonical ShotIQ screen renders.
///
/// The canonical designs paint real athlete/court frames wherever the app was
/// drawing an empty dark rectangle. The sidecars for the 72 iOS screens mark
/// those regions as `type: photo` with exact pixel bounds on the 853x1844
/// canvas, so each one is cropped straight out of its screen render and
/// bundled as `photo-<screen>-<element>` in Assets.xcassets.
///
/// Asset names are the sidecar's own screen number and element id, so a screen
/// asks for exactly the frame its canonical render shows:
///
///     CanonicalPhoto("018-visual-001", height: 148)
///
/// ## Why the image is painted into an overlay rather than sized directly
///
/// `Image.resizable().aspectRatio(contentMode: .fill)` does not accept the
/// width it is offered — it *reports* the width its aspect ratio demands once a
/// height is pinned. With `.frame(width: nil, height: h)` (which is how most
/// call sites ask for a photo) that reported width becomes the frame's width,
/// so a landscape crop in a 190pt-tall slot claims ~316pt inside a 217pt
/// column. Nothing clips it: the row grows, the enclosing `VStack` grows, the
/// `ScrollView` reports the oversized content width, and the whole screen ends
/// up wider than the 393pt viewport and centred inside it — clipped off *both*
/// edges, header wordmark and tab bar included. `.frame(maxWidth: .infinity)`
/// does not rescue it either: a flexible frame reports
/// `max(childWidth, proposedWidth)`, so an oversized child still wins.
///
/// Sizing a `Color.clear` spacer — which always takes exactly the size it is
/// offered — and painting the image into its `overlay` inverts that: the layout
/// width is whatever the row offered, and the surplus image is cropped by the
/// `clipShape`, which is what `.fill` is supposed to mean.
struct CanonicalPhoto: View {
    let key: String
    var width: CGFloat?
    var height: CGFloat?
    var cornerRadius: CGFloat = 4
    var contentMode: ContentMode = .fill
    /// Which part of an over-large crop survives the clip. Canonical frames are
    /// centred unless the subject sits at one edge.
    var alignment: Alignment = .center

    init(_ key: String, width: CGFloat? = nil, height: CGFloat? = nil,
         cornerRadius: CGFloat = 4, contentMode: ContentMode = .fill,
         alignment: Alignment = .center) {
        self.key = key
        self.width = width
        self.height = height
        self.cornerRadius = cornerRadius
        self.contentMode = contentMode
        self.alignment = alignment
    }

    var body: some View {
        Color.clear
            .frame(width: width, height: height)
            .overlay(alignment: alignment) {
                if let ui = UIImage(named: "photo-\(key)") {
                    Image(uiImage: ui)
                        .resizable()
                        .aspectRatio(contentMode: contentMode)
                } else {
                    // A missing crop must never punch a white hole in the layout;
                    // fall back to the same dark surface the app used before.
                    Rectangle().fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    }
}

/// Media surface backed by a canonical frame: the photograph the design shows,
/// with the player chrome (scrubber, timecode) drawn on top of it.
struct CanonicalMediaSurface: View {
    let key: String
    var height: CGFloat
    var duration = "0:07"
    var progress: Double = 0.28
    /// Passed through to `CanonicalPhoto` — see its note on cropping.
    var alignment: Alignment = .center

    var body: some View {
        ZStack(alignment: .bottom) {
            CanonicalPhoto(key, height: height, cornerRadius: 4, alignment: alignment)
            LinearGradient(colors: [.clear, .black.opacity(0.55)],
                           startPoint: .center, endPoint: .bottom)
            HStack(spacing: 10) {
                Image(systemName: "play.fill").font(.system(size: 13)).foregroundStyle(.white)
                Text("0:00 / \(duration)")
                    .font(.custom("Tungsten-Medium", size: 13)).foregroundStyle(.white)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(.white.opacity(0.35))
                        Capsule().fill(.white).frame(width: geo.size.width * progress)
                    }
                }
                .frame(height: 3)
                Image(systemName: "arrow.up.left.and.arrow.down.right")
                    .font(.system(size: 12)).foregroundStyle(.white)
            }
            .padding(.horizontal, 14).padding(.bottom, 14)
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: 4))
    }
}
