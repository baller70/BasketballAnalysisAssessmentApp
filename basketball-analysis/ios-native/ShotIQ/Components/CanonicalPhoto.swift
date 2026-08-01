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
/// The imagesets are single-scale and unscaled; every call site is `.resizable`
/// inside a fixed frame, so intrinsic size never matters.
struct CanonicalPhoto: View {
    let key: String
    var width: CGFloat?
    var height: CGFloat?
    var cornerRadius: CGFloat = 4
    var contentMode: ContentMode = .fill

    init(_ key: String, width: CGFloat? = nil, height: CGFloat? = nil,
         cornerRadius: CGFloat = 4, contentMode: ContentMode = .fill) {
        self.key = key
        self.width = width
        self.height = height
        self.cornerRadius = cornerRadius
        self.contentMode = contentMode
    }

    var body: some View {
        Group {
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
        .frame(width: width, height: height)
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

    var body: some View {
        ZStack(alignment: .bottom) {
            CanonicalPhoto(key, height: height, cornerRadius: 4)
            LinearGradient(colors: [.clear, .black.opacity(0.55)],
                           startPoint: .center, endPoint: .bottom)
            HStack(spacing: 10) {
                Image(systemName: "play.fill").font(.system(size: 13)).foregroundStyle(.white)
                Text("0:00 / \(duration)")
                    .font(.custom("Tungsten-Semibold", size: 13)).foregroundStyle(.white)
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
