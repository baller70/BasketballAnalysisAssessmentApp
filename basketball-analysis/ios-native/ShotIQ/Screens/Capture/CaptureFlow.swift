import SwiftUI
import PhotosUI
import AVFoundation
import AVKit

// Capture & upload flow — screens 021-035. PhotosUI for library import,
// AVFoundation capture session for live camera (permission-gated).

// MARK: - Live camera plumbing shared by the capture flow

/// One shared camera for the whole live flow (028-035) so pushing from setup →
/// calibration → readiness → recording keeps a single AVCaptureSession alive
/// instead of fighting over the device with per-screen sessions.
extension CameraService {
    static let live = CameraService()

    /// Flip between the back and front wide-angle cameras in place.
    func flipCamera() {
        guard let current = session.inputs
            .compactMap({ $0 as? AVCaptureDeviceInput })
            .first(where: { $0.device.hasMediaType(.video) }) else { return }
        let next: AVCaptureDevice.Position = current.device.position == .back ? .front : .back
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: next),
              let input = try? AVCaptureDeviceInput(device: device) else { return }
        session.beginConfiguration()
        session.removeInput(current)
        if session.canAddInput(input) { session.addInput(input) } else { session.addInput(current) }
        session.commitConfiguration()
    }
}

/// Live viewfinder layer dropped inside the dark camera surfaces: real preview
/// when running, Settings deep-link card when denied, dark placeholder while
/// the session spins up.
private struct LiveViewfinder: View {
    @ObservedObject var camera: CameraService
    var radius: CGFloat = 8
    var body: some View {
        ZStack {
            if camera.status == .ready {
                CameraPreviewView(session: camera.session)
                    .clipShape(RoundedRectangle(cornerRadius: radius))
            } else if camera.status == .unauthorized {
                CameraDeniedView().padding(18)
            }
        }
        .onAppear { camera.start() }
    }
}

/// Full-screen camera sheet behind "Take photo" / "Retake" — real capture via
/// CameraService.capturePhoto(); the shot flows back into the review path.
struct CameraPhotoCaptureView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var camera = CameraService.live
    var onCapture: (UIImage) -> Void
    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black.ignoresSafeArea()
            if camera.status == .ready {
                CameraPreviewView(session: camera.session).ignoresSafeArea()
            } else if camera.status == .unauthorized {
                CameraDeniedView().padding(24)
            } else {
                ProgressView().tint(.white)
            }
            VStack(spacing: 14) {
                Button {
                    camera.capturePhoto()
                } label: {
                    Circle().stroke(.white, lineWidth: 4).frame(width: 76, height: 76)
                        .overlay(Circle().fill(.white).frame(width: 62, height: 62))
                }
                .buttonStyle(.plain)
                .disabled(camera.status != .ready)
                .accessibilityLabel("Take photo")
                Button { dismiss() } label: {
                    Text("Cancel").font(.system(size: 16, weight: .medium)).foregroundStyle(.white)
                }
                .buttonStyle(.plain)
            }
            .padding(.bottom, 34)
        }
        .onAppear { camera.lastPhoto = nil; camera.start() }
        .onDisappear { camera.stop() }
        .onChange(of: camera.lastPhoto) { _, data in
            if let data, let img = UIImage(data: data) {
                onCapture(img)
                dismiss()
            }
        }
    }
}

/// Bake a 90° rotation into the picked image (rotate dial side buttons).
private func shotiqRotated(_ image: UIImage, clockwise: Bool) -> UIImage {
    let size = CGSize(width: image.size.height, height: image.size.width)
    return UIGraphicsImageRenderer(size: size).image { ctx in
        let c = ctx.cgContext
        c.translateBy(x: size.width / 2, y: size.height / 2)
        c.rotate(by: (clockwise ? CGFloat.pi : -CGFloat.pi) / 2)
        image.draw(in: CGRect(x: -image.size.width / 2, y: -image.size.height / 2,
                              width: image.size.width, height: image.size.height))
    }
}

/// Bake a centered 3:4 crop into the picked image (CROP button — matches the
/// 3:4 badge on the crop frame).
private func shotiqCropped34(_ image: UIImage) -> UIImage {
    let w = image.size.width, h = image.size.height
    let ratio: CGFloat = 3.0 / 4.0
    var cropW = w, cropH = h
    if w / h > ratio { cropW = h * ratio } else { cropH = w / ratio }
    let origin = CGPoint(x: (w - cropW) / 2, y: (h - cropH) / 2)
    return UIGraphicsImageRenderer(size: CGSize(width: cropW, height: cropH)).image { _ in
        image.draw(at: CGPoint(x: -origin.x, y: -origin.y))
    }
}

// MARK: - Shared canonical chrome for the capture screens

/// TopBar + PlayerHeader stack shown at the top of most capture screens.
private struct CaptureHeader: View {
    @EnvironmentObject var app: AppState
    var body: some View {
        VStack(spacing: 0) {
            TopBar()
            PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
        }
    }
}

/// Filled CTA label used inside NavigationLinks (orange by default).
private func captureCTA(_ title: String, icon: String? = nil,
                        color: Color = ShotIQColor.shotiqOrange) -> some View {
    HStack(spacing: 10) {
        if let icon { Image(systemName: icon).font(.system(size: 18, weight: .medium)) }
        Text(title).font(.system(size: 17, weight: .semibold))
    }
    .frame(maxWidth: .infinity).frame(height: 56)
    .background(color, in: RoundedRectangle(cornerRadius: 8))
    .foregroundStyle(.white)
    .lineLimit(1)
    .minimumScaleFactor(0.7)
}

/// Bordered secondary label used inside NavigationLinks / plain buttons.
private func captureOutline(_ title: String, icon: String? = nil) -> some View {
    HStack(spacing: 10) {
        if let icon { Image(systemName: icon).font(.system(size: 16)) }
        Text(title).font(.system(size: 16))
    }
    .frame(maxWidth: .infinity).frame(height: 52)
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    .foregroundStyle(ShotIQColor.ink)
    .lineLimit(1)
    .minimumScaleFactor(0.7)
}

/// Dark camera / media placeholder (dark allowed only where the PNG shows video).
private func captureDark(_ height: CGFloat, radius: CGFloat = 8) -> some View {
    RoundedRectangle(cornerRadius: radius)
        .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
        .frame(height: height)
}

/// PRIMARY COACHING TARGET row (canonical 026/028/030/031/032/034).
/// Tapping it opens the coaching-target detail (FlawDetailView) everywhere.
private struct CaptureCoachingRow: View {
    var boxed = false
    var body: some View {
        let row = VStack(alignment: .leading, spacing: 5) {
            Text("PRIMARY COACHING TARGET")
                .font(.system(size: 11, weight: .medium)).kerning(0.8)
                .foregroundStyle(ShotIQColor.graphite)
            HStack {
                Text("Keep elbow stacked through release")
                    .font(.system(size: 19, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
            }
        }
        NavigationLink {
            FlawDetailView(title: "Keep elbow stacked through release", severity: "PRIMARY TARGET")
        } label: {
            Group {
                if boxed {
                    ShotIQCard { row.padding(14) }
                } else {
                    row.padding(.vertical, 12)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

/// Capture guide — the filming checklist behind "View capture guide" /
/// "See capture guide" / "View filming tips" / "Camera help".
struct CaptureGuideView: View {
    private let tips: [(String, String, String)] = [
        ("video", "CAMERA POSITION", "Place the camera at hip height, 15–20 ft away."),
        ("iphone", "SIDE VIEW", "Film from the side at chest height — it gives the most accurate angles."),
        ("figure.stand", "FULL BODY IN FRAME", "Feet to fingertips visible with a little space above your head."),
        ("lightbulb", "GOOD LIGHTING", "Well-lit court, clear background, no backlight."),
        ("rectangle.dashed", "HOOP VISIBLE", "Keep the backboard and rim in frame for make detection."),
        ("figure.basketball", "NORMAL ROUTINE", "Use your regular pre-shot routine so we analyze your real shot."),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-capture-guide") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    Text("CAPTURE GUIDE").shotiqDisplay(38)
                        .padding(.horizontal, 20).padding(.top, 24)
                    Text("Film like this for the most accurate AI analysis.")
                        .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    ShotIQCard {
                        VStack(spacing: 0) {
                            ForEach(tips, id: \.1) { icon, t, d in
                                HStack(spacing: 14) {
                                    Image(systemName: icon).font(.system(size: 20))
                                        .foregroundStyle(ShotIQColor.ink).frame(width: 34)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(t).font(.system(size: 14, weight: .heavy).width(.condensed)).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text(d).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(.vertical, 12)
                                .overlay(alignment: .bottom) {
                                    if t != "NORMAL ROUTINE" { Rectangle().fill(ShotIQColor.rule).frame(height: 1) }
                                }
                            }
                        }
                        .padding(.horizontal, 14).padding(.vertical, 4)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    PhaseStrip().padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 26)
                }
            }
        }
    }
}

/// LATEST SESSION stats strip: shots / makes / make % / trend delta.
private struct CaptureSessionStats: View {
    var body: some View {
        HStack(alignment: .center, spacing: 18) {
            StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric)
            StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric)
            StatBlock(value: "62.5%", label: "MAKE %", valueSize: ShotIQType.numeric)
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 3) {
                TrendLine(points: [2, 3.1, 2.6, 4.2], stroke: ShotIQColor.confirmGreen)
                    .frame(width: 86, height: 28)
                HStack(spacing: 3) {
                    Text("+8.1%").font(.system(size: 11, weight: .semibold)).foregroundStyle(ShotIQColor.confirmGreen)
                    Text("vs last session").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                }
            }
        }
    }
}

/// One small centered stat used in horizontal stat strips.
private func captureStat(_ value: String, _ label: String,
                         color: Color = ShotIQColor.ink, size: CGFloat = 26) -> some View {
    VStack(spacing: 2) {
        Text(value).font(.custom("Tungsten-Semibold", size: size)).foregroundStyle(color)
            .lineLimit(1).minimumScaleFactor(0.6)
        Text(label).shotiqMicroCaps()
            .foregroundStyle(ShotIQColor.graphite)
    }
    .frame(maxWidth: .infinity)
}

struct AnalyzeHubView: View {       // 021
    @EnvironmentObject var app: AppState
    // Fourth field is the canonical crop for that thumbnail; only the 2nd and 4th
    // captures have a frame bundled (021-visual-003 / -004 in the sidecar).
    private let recents: [(String, String, String, String?)] = [
        ("0:06", "Today • 8:24 AM", "Free Throw", nil),
        ("0:04", "Today • 8:17 AM", "Catch & Shoot", "021-visual-003"),
        ("0:05", "Yesterday • 6:42 PM", "Pull-Up Jumper", nil),
        ("0:05", "Yesterday • 6:35 PM", "Off the Dribble", "021-visual-004")]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analyze-hub") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    Text("ANALYZE YOUR SHOT").shotiqDisplay(40)
                        .padding(.horizontal, 20).padding(.top, 26)
                    Text("Choose how you want to capture your shot.")
                        .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    HStack(alignment: .top, spacing: 10) {
                        NavigationLink { LiveCameraSetupView() } label: {
                            hubOption("dot.radiowaves.left.and.right", "Live camera", "Record a new shot in real time.")
                        }
                        NavigationLink { VideoUploadView() } label: {
                            hubOption("film", "Upload video", "Analyze footage from your device.")
                        }
                        NavigationLink { PhotoUploadSourceView() } label: {
                            hubOption("photo", "Upload image", "Analyze a single frame or photo.")
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    NavigationLink { CaptureGuideView() } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "doc.text").font(.system(size: 19)).foregroundStyle(ShotIQColor.ink)
                            Text("View capture guide").font(.system(size: 16, weight: .medium))
                                .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(16)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 12)

                    HStack {
                        SectionLabel(text: "RECENT CAPTURES")
                        Spacer()
                        NavigationLink { UploadQueueView() } label: {
                            HStack(spacing: 4) {
                                Text("View all").font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                                Image(systemName: "chevron.right").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 22)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(alignment: .top, spacing: 10) {
                            ForEach(recents, id: \.1) { dur, when, kind, photo in
                                NavigationLink { MediaDetailView() } label: {
                                    VStack(alignment: .leading, spacing: 4) {
                                        ZStack(alignment: .bottomTrailing) {
                                            if let photo {
                                                CanonicalPhoto(photo, width: 104, height: 128, cornerRadius: 4)
                                            } else {
                                                captureDark(128, radius: 4).frame(width: 104)
                                            }
                                            Text(dur).font(.custom("Tungsten-Semibold", size: 12)).foregroundStyle(.white)
                                                .padding(.horizontal, 6).padding(.vertical, 3)
                                                .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 3))
                                                .padding(6)
                                        }
                                        Text(when).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                        Text(kind).font(.system(size: 12, weight: .medium)).foregroundStyle(ShotIQColor.ink)
                                    }
                                    .frame(width: 104)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    .padding(.top, 10)

                    HStack(alignment: .center, spacing: 14) {
                        Image(systemName: "point.topleft.down.curvedto.point.bottomright.up")
                            .font(.system(size: 24)).foregroundStyle(ShotIQColor.analysisBlue)
                        Text("Film from the side at chest height, showing your full body from feet to fingertips with good lighting and a clear background.")
                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                    }
                    .padding(14)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    .padding(.horizontal, 20).padding(.top, 16)

                    Text("YOUR SHOOTING SNAPSHOT")
                        .font(.system(size: 11, weight: .bold)).kerning(0.8).foregroundStyle(ShotIQColor.ink)
                        .padding(.horizontal, 20).padding(.top, 20)
                    CaptureSessionStats().padding(.horizontal, 20).padding(.top, 8)

                    CaptureCoachingRow().padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 24)
                }
            }
        }
        .navigationTitle("").toolbar(.hidden, for: .navigationBar)
        // Returning to the hub means the live flow ended — release the camera.
        .onAppear { CameraService.live.stop() }
    }

    private func hubOption(_ icon: String, _ t: String, _ d: String) -> some View {
        VStack(spacing: 8) {
            // Canonical draws a different diagram per source, not a photo/film/
            // broadcast triple out of the system set.
            Group {
                if let source = CaptureSource(sourceLabel: t) {
                    CaptureSourceGlyph(source: source, size: 26)
                } else {
                    Image(systemName: icon).font(.system(size: 26))
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            .frame(height: 44)
            Text(t).font(.system(size: 14, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(d).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.center)
                .lineLimit(2).minimumScaleFactor(0.8)
        }
        .padding(.vertical, 16).padding(.horizontal, 6)
        .frame(maxWidth: .infinity, minHeight: 140, alignment: .top)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct PhotoUploadSourceView: View { // 022
    @Environment(\.dismiss) private var dismiss
    @State private var pick: PhotosPickerItem?
    @State private var image: UIImage?
    @State private var goReview = false
    @State private var showCamera = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-upload-source") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()

                    Button { dismiss() } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
                            Text("ANALYZE SHOT").font(.system(size: 13, weight: .bold)).kerning(1)
                        }
                        .foregroundStyle(ShotIQColor.graphite)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 16)

                    Text("PHOTO UPLOAD SOURCE").shotiqDisplay(38)
                        .padding(.horizontal, 20).padding(.top, 8)
                    Text("Upload a side or 45-degree angle video or photo for the most accurate analysis.")
                        .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 6)

                    SectionLabel(text: "SUPPORTED FORMATS").padding(.horizontal, 20).padding(.top, 24)
                    HStack(alignment: .center, spacing: 0) {
                        formatCol("film", "MP4", "VIDEO")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                        formatCol("play.circle", "MOV", "VIDEO")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                        formatCol("photo", "JPG", "PHOTO")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                        formatCol("photo", "PNG", "PHOTO")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                        formatCol("photo", "HEIC", "PHOTO")
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    SectionLabel(text: "BEST ANGLE FOR ANALYSIS").padding(.horizontal, 20).padding(.top, 24)
                    HStack(alignment: .top, spacing: 12) {
                        angleCard("SIDE VIEW", "IDEAL", "Use this angle when possible.",
                                  photo: "022-visual-001", ideal: true)
                        angleCard("45° VIEW", "GOOD", "Use if side view isn't available.",
                                  photo: "022-visual-003", ideal: false)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    SectionLabel(text: "CHOOSE UPLOAD SOURCE").padding(.horizontal, 20).padding(.top, 24)
                    VStack(spacing: 12) {
                        PhotosPicker(selection: $pick, matching: .images) {
                            sourceRow("camera.metering.center.weighted", "Choose from library",
                                      "Select a video or photo from your device.")
                        }
                        Button { showCamera = true } label: {
                            sourceRow("camera", "Take photo", "Capture a new photo using your camera.")
                        }
                        .buttonStyle(.plain)
                        Button { dismiss() } label: {
                            Text("Cancel").font(.system(size: 16))
                                .frame(maxWidth: .infinity).frame(height: 52)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 12).padding(.bottom, 26)
                }
            }
        }
        .onChange(of: pick) { _, item in
            Task {
                if let data = try? await item?.loadTransferable(type: Data.self),
                   let img = UIImage(data: data) { image = img; goReview = true }
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPhotoCaptureView { img in image = img; goReview = true }
        }
        .navigationDestination(isPresented: $goReview) { PhotoReviewCropView(image: image) }
    }

    private func formatCol(_ icon: String, _ t: String, _ d: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
            Text(t).font(.custom("Tungsten-Semibold", size: 17)).foregroundStyle(ShotIQColor.ink)
            Text(d).font(.system(size: 9, weight: .medium)).kerning(0.5).foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }

    private func angleCard(_ badge: String, _ verdict: String, _ d: String,
                           photo: String, ideal: Bool) -> some View {
        VStack(spacing: 0) {
            ZStack(alignment: .topLeading) {
                CanonicalPhoto(photo, height: 180, cornerRadius: 0)
                Text(badge).font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .background(ShotIQColor.analysisBlue, in: Capsule())
                    .padding(8)
            }
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "checkmark.circle").font(.system(size: 20))
                    .foregroundStyle(ideal ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
                VStack(alignment: .leading, spacing: 2) {
                    Text(verdict).font(.system(size: 13, weight: .heavy).width(.condensed)).kerning(0.5)
                        .foregroundStyle(ideal ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
                    Text(d).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                }
                Spacer(minLength: 0)
            }
            .padding(10)
        }
        .background(ShotIQColor.paper)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func sourceRow(_ icon: String, _ t: String, _ d: String) -> some View {
        HStack(spacing: 16) {
            Image(systemName: icon).font(.system(size: 24)).foregroundStyle(ShotIQColor.shotiqOrange).frame(width: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(t).font(.system(size: 17, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                Text(d).font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
        }
        .padding(16)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct PhotoReviewCropView: View {  // 023
    @Environment(\.dismiss) private var dismiss
    @State private var image: UIImage?
    @State private var showCamera = false
    init(image: UIImage?) { _image = State(initialValue: image) }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-review-crop") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Centered wordmark bar with back arrow (canonical 023)
                    ZStack {
                        HStack {
                            Button { dismiss() } label: {
                                Image(systemName: "arrow.left").font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
                            }
                            .buttonStyle(.plain)
                            Spacer()
                        }
                        VStack(spacing: 1) {
                            Wordmark(size: 26)
                            Text("AI ANALYSIS").font(.system(size: 11, weight: .medium)).kerning(2)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                    }
                    .padding(.horizontal, 20).frame(height: 58)
                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("PHOTO REVIEW").shotiqDisplay(36)
                            Text("Adjust crop to include your full body from head to toe.")
                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer(minLength: 8)
                        HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                        HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    ZStack(alignment: .topLeading) {
                        Group {
                            if let image {
                                Image(uiImage: image).resizable().scaledToFill()
                            } else {
                                // Nothing picked yet — show the canonical review frame.
                                CanonicalPhoto("023-visual-001", cornerRadius: 0)
                            }
                        }
                        .frame(height: 430).frame(maxWidth: .infinity).clipped()
                        // rule-of-thirds crop grid + dashed frame
                        GeometryReader { geo in
                            Path { p in
                                for f in [1.0 / 3.0, 2.0 / 3.0] {
                                    p.move(to: CGPoint(x: geo.size.width * f, y: 0))
                                    p.addLine(to: CGPoint(x: geo.size.width * f, y: geo.size.height))
                                    p.move(to: CGPoint(x: 0, y: geo.size.height * f))
                                    p.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height * f))
                                }
                            }
                            .stroke(.white.opacity(0.7), lineWidth: 1)
                            Rectangle()
                                .stroke(.white.opacity(0.85), style: StrokeStyle(lineWidth: 1.5, dash: [6, 5]))
                                .padding(14)
                        }
                        Text("3:4").font(.system(size: 13, weight: .semibold)).foregroundStyle(.white)
                            .padding(.horizontal, 9).padding(.vertical, 5)
                            .background(.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 5))
                            .padding(10)
                    }
                    .frame(height: 430).clipped()
                    .overlay(alignment: .bottom) {
                        HStack(spacing: 8) {
                            Image(systemName: "info.circle").font(.system(size: 12))
                            Text("Tip: Include your full body. Leave a little space above your head and below your feet.")
                                .font(.system(size: 11))
                                .lineLimit(2).minimumScaleFactor(0.8)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 6))
                        .padding(10)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    // Rotation dial
                    HStack(spacing: 14) {
                        Button {
                            if let img = image { image = shotiqRotated(img, clockwise: false) }
                        } label: {
                            Image(systemName: "arrow.counterclockwise").font(.system(size: 19)).foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Rotate left")
                        VStack(spacing: 5) {
                            HStack(spacing: 0) {
                                ForEach(0..<21, id: \.self) { i in
                                    Capsule().fill(i == 10 ? ShotIQColor.shotiqOrange : ShotIQColor.muted)
                                        .frame(width: i == 10 ? 2 : 1, height: i % 5 == 0 ? 13 : 8)
                                        .frame(maxWidth: .infinity)
                                }
                            }
                            HStack {
                                Text("-10°"); Spacer(); Text("-5°"); Spacer()
                                Text("0°").foregroundStyle(ShotIQColor.shotiqOrange)
                                Spacer(); Text("5°"); Spacer(); Text("10°")
                            }
                            .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Button {
                            if let img = image { image = shotiqRotated(img, clockwise: true) }
                        } label: {
                            Image(systemName: "rotate.right").font(.system(size: 19)).foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Rotate right")
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    HStack(spacing: 10) {
                        Button { showCamera = true } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "camera").font(.system(size: 15))
                                Text("RETAKE").font(.system(size: 13, weight: .heavy).width(.condensed)).kerning(0.5)
                            }
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        Button {
                            if let img = image { image = shotiqCropped34(img) }
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "crop").font(.system(size: 15))
                                Text("CROP").font(.system(size: 13, weight: .heavy).width(.condensed)).kerning(0.5)
                            }
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        NavigationLink { UploadQualityCheckView(image: image) } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark").font(.system(size: 15, weight: .bold))
                                Text("USE PHOTO").font(.system(size: 13, weight: .heavy).width(.condensed)).kerning(0.5)
                            }
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .background(ShotIQColor.confirmGreen, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    PhaseStrip().padding(.horizontal, 20).padding(.top, 20).padding(.bottom, 24)
                }
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPhotoCaptureView { img in image = img }
        }
    }
}

struct UploadQualityCheckView: View { // 024
    var image: UIImage? = nil
    @Environment(\.dismiss) private var dismiss
    @State private var busy = false
    @State private var uploadError: String?
    /// One route out of this screen: analysis processing on success, the
    /// canonical analysis-error screen (040) when the upload/analyze call fails.
    enum UploadRoute: Hashable { case processing, failed }
    @State private var route: UploadRoute?
    private let checks: [(String, String, String, Bool)] = [
        ("Lighting", "Well-lit and clear.", "Good", true),
        ("Full body visibility", "Entire body is visible.", "Good", true),
        ("Video resolution", "High resolution.", "1080p", true),
        ("Shooting hand visibility",
         "Shooting hand is slightly cropped at the fingertips. Please reframe to show the full hand and ball.",
         "Needs attention", false)]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-upload-quality-check") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    // Compact profile stat strip (blue accents, canonical 024)
                    HStack(alignment: .center, spacing: 0) {
                        captureStat("82", "FORM SCORE", color: ShotIQColor.analysisBlue)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                        captureStat("24", "SHOTS")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                        captureStat("15", "MAKES")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                        captureStat("62.5%", "ACCURACY", color: ShotIQColor.analysisBlue)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("PRIMARY TARGET").font(.system(size: 9, weight: .medium)).kerning(0.5)
                                .foregroundStyle(ShotIQColor.graphite)
                            Text("Keep elbow stacked through release")
                                .font(.system(size: 11)).foregroundStyle(ShotIQColor.ink)
                                .lineLimit(2).minimumScaleFactor(0.8)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.leading, 8)
                    }
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                    .padding(.top, 12)

                    HStack(spacing: 12) {
                        Image(systemName: "square.and.arrow.up").font(.system(size: 24)).foregroundStyle(ShotIQColor.ink)
                        Text("UPLOAD QUALITY CHECK").shotiqDisplay(34)
                    }
                    .padding(.horizontal, 20).padding(.top, 20)
                    Text("We'll check your video to make sure it's ready for the best analysis.")
                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    ZStack(alignment: .topLeading) {
                        if let image {
                            Image(uiImage: image).resizable().scaledToFill()
                                .frame(height: 250).frame(maxWidth: .infinity).clipped()
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        } else {
                            MediaSurface(height: 250, duration: "0:04")
                        }
                        VStack(alignment: .leading, spacing: 1) {
                            Text(image == nil ? "IMG_4521.MOV" : "IMG_4521.JPG").font(.system(size: 12, weight: .semibold))
                            Text(image == nil ? "00:04 • 1080p • 30fps" : "Photo • ready to analyze").font(.system(size: 10))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10).padding(.vertical, 6)
                        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 5))
                        .padding(10)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    VStack(spacing: 0) {
                        ForEach(checks, id: \.0) { t, d, status, ok in
                            HStack(alignment: .top, spacing: 14) {
                                Image(systemName: ok ? "checkmark.circle.fill" : "exclamationmark.circle")
                                    .font(.system(size: 22))
                                    .foregroundStyle(ok ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(t).font(.system(size: 16, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    Text(d).font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Text(status).font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(ok ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            .padding(.vertical, 13)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 8)

                    HStack(alignment: .center, spacing: 14) {
                        ReadinessGlyph(kind: .framing, size: 30).foregroundStyle(ShotIQColor.ink)
                        Text("Best framing: side view, full body in frame, shooting hand and ball fully visible.")
                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                        Spacer()
                        ReadinessGlyph(kind: .athlete, size: 22).foregroundStyle(ShotIQColor.ink)
                            .padding(8)
                            .overlay(Rectangle().stroke(ShotIQColor.shotiqOrange, style: StrokeStyle(lineWidth: 1.5, dash: [4, 3])))
                    }
                    .padding(14)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 20).padding(.top, 16)

                    Button {
                        Task { await analyze() }
                    } label: {
                        HStack(spacing: 10) {
                            if busy { ProgressView().tint(.white) }
                            Text(busy ? "Uploading & analyzing…" : "Continue to analysis")
                                .font(.system(size: 17, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity).frame(height: 56)
                        .background(ShotIQColor.confirmGreen, in: RoundedRectangle(cornerRadius: 8))
                        .foregroundStyle(.white)
                    }
                    .buttonStyle(.plain)
                    .disabled(busy)
                    .padding(.horizontal, 20).padding(.top, 18)
                    if let uploadError {
                        Text(uploadError).font(.system(size: 12)).foregroundStyle(ShotIQColor.reviewRed)
                            .padding(.horizontal, 20).padding(.top, 8)
                    }
                    Button { dismiss() } label: { captureOutline("Choose another") }
                        .buttonStyle(.plain)
                        .disabled(busy)
                        .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
        .navigationDestination(item: $route) { r in
            switch r {
            case .processing: AnalysisProcessingView()
            case .failed: AnalysisErrorView()
            }
        }
    }

    /// Mirrors the web upload flow: multipart POST /api/upload, then
    /// POST /api/vision-analyze on the same frame, then POST /api/save-analysis
    /// to persist the session — before showing the processing screen.
    private func analyze() async {
        guard let jpeg = image?.jpegData(compressionQuality: 0.7) else {
            route = .processing // nothing picked (placeholder path) — just proceed
            return
        }
        busy = true
        uploadError = nil
        defer { busy = false }

        // 1. Upload the raw frame (field "image", uploadType "user").
        var imageUrl: String?
        if let respData = try? await APIClient.shared.uploadImage(jpeg) {
            struct UploadResp: Codable { var success: Bool?; var url: String?; var imageUrl: String? }
            let r = try? JSONDecoder().decode(UploadResp.self, from: respData)
            imageUrl = r?.url ?? r?.imageUrl
        }

        // 2. Coach-centric vision analysis (same contract the web client uses).
        struct VisionBody: Codable {
            var image: String; var drillId: String; var drillName: String
            var drillDescription: String; var coachingPoints: [String]; var focusArea: String
        }
        struct VisionResp: Codable {
            struct Analysis: Codable {
                var overallGrade: String?
                var gradeDescription: String?
                var coachSays: String?
            }
            var success: Bool?
            var analysis: Analysis?
        }
        var overallScore: Double?
        var coachingNotes: String?
        let vision: VisionResp? = try? await APIClient.shared.call(
            "/api/vision-analyze", method: "POST",
            body: VisionBody(
                image: jpeg.base64EncodedString(),
                drillId: "shot-form-photo",
                drillName: "Shot form analysis",
                drillDescription: "Single-frame jump shot form check from an uploaded photo.",
                coachingPoints: ["Keep elbow stacked through release",
                                 "Balanced base with feet shoulder-width apart",
                                 "Full follow-through with a relaxed wrist"],
                focusArea: "Shooting form"))
        if let analysis = vision?.analysis {
            let grades: [String: Double] = ["A": 95, "B": 85, "C": 75, "D": 65, "F": 50]
            overallScore = analysis.overallGrade.flatMap { grades[$0] }
            coachingNotes = analysis.coachSays ?? analysis.gradeDescription
        }

        // 3. Persist the analysis session (idempotent by clientSessionId).
        struct SaveBody: Codable {
            var clientSessionId: String; var recordedAt: String; var mediaType: String
            var imageUrl: String?; var overallScore: Double?; var coachingNotes: String?
        }
        struct SaveResp: Codable { var success: Bool?; var analysisId: String? }
        do {
            let _: SaveResp = try await APIClient.shared.call(
                "/api/save-analysis", method: "POST",
                body: SaveBody(clientSessionId: "ios-\(UUID().uuidString)",
                               recordedAt: ISO8601DateFormatter().string(from: Date()),
                               mediaType: "image",
                               imageUrl: imageUrl,
                               overallScore: overallScore,
                               coachingNotes: coachingNotes))
            route = .processing
        } catch {
            // Canonical 040: a failed analyze/upload round trip opens the
            // analysis-error screen, which offers retry / another frame / support.
            uploadError = "Couldn't reach the analysis service. Check your connection and try again."
            route = .failed
        }
    }
}

struct UploadQueueView: View {      // 025
    struct Item: Identifiable { let id = UUID(); var name: String; var pct: Double; var state: String }
    @State private var items = [Item(name: "pullup-jumper.mov", pct: 0.62, state: "Uploading"),
                                Item(name: "spotup-three.mov", pct: 1.0, state: "Complete"),
                                Item(name: "transition-pullup.mov", pct: 0, state: "Queued")]
    @State private var addPick: PhotosPickerItem?
    @State private var goAnalyze = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-upload-queue") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    HStack(alignment: .center, spacing: 0) {
                        captureStat("82", "FORM SCORE")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                        captureStat("24", "SHOTS")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                        captureStat("15", "MAKES")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                        captureStat("62.5%", "SHOOTING %")
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("UPLOAD QUEUE").shotiqDisplay(38)
                            Text("Review, upload, and analyze your shots.")
                                .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                        PhotosPicker(selection: $addPick, matching: .any(of: [.images, .videos])) {
                            VStack(spacing: 5) {
                                Image(systemName: "plus.viewfinder").font(.system(size: 22)).foregroundStyle(ShotIQColor.ink)
                                Text("Add media").font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                            }
                            .padding(.horizontal, 16).padding(.vertical, 12)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 20)

                    HStack {
                        SectionLabel(text: "QUEUE (\(items.count))")
                        Spacer()
                        Text(queueSummary).font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 20).padding(.top, 20)

                    ForEach(items) { it in
                        queueCard(it).padding(.horizontal, 20).padding(.top, 12)
                    }

                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(spacing: 14) {
                                Image(systemName: "wifi").font(.system(size: 20)).foregroundStyle(ShotIQColor.analysisBlue)
                                    .frame(width: 30)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Uploads will continue in the background")
                                        .font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    Text("You can close ShotIQ and we'll finish uploading.")
                                        .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(.bottom, 12)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            HStack(spacing: 14) {
                                Image(systemName: "icloud.slash").font(.system(size: 20)).foregroundStyle(ShotIQColor.graphite)
                                    .frame(width: 30)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Connection protection")
                                        .font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    Text("We'll automatically resume if your connection drops.")
                                        .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(.top, 12)
                        }
                        .padding(14)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    Button { goAnalyze = true } label: { captureCTA("Analyze selected (1)") }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20).padding(.top, 16)
                    Button {
                        withAnimation { items.removeAll { $0.state == "Complete" } }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "trash").font(.system(size: 14))
                            Text("Remove completed").font(.system(size: 14))
                        }
                        .foregroundStyle(ShotIQColor.graphite)
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 12).padding(.bottom, 26)
                }
            }
        }
        .onChange(of: addPick) { _, item in
            guard item != nil else { return }
            withAnimation {
                items.append(Item(name: "new-capture-\(items.count + 1).mov", pct: 0, state: "Queued"))
            }
            addPick = nil
        }
        .navigationDestination(isPresented: $goAnalyze) { AnalysisProcessingView() }
    }

    private var queueSummary: String {
        let up = items.filter { $0.state == "Uploading" }.count
        let done = items.filter { $0.state == "Complete" }.count
        return "\(up) uploading • \(done) completed"
    }

    private func queueCard(_ it: Item) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 12) {
                ZStack(alignment: .topLeading) {
                    captureDark(104, radius: 4).frame(width: 118)
                    Image(systemName: it.state == "Complete" ? "photo" : "play.circle")
                        .font(.system(size: 15)).foregroundStyle(.white)
                        .padding(6)
                        .background(.black.opacity(0.55), in: RoundedRectangle(cornerRadius: 4))
                        .padding(6)
                }
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Image(systemName: it.state == "Complete" ? "checkmark.circle.fill" :
                                (it.state == "Uploading" ? "arrow.up.circle.fill" : "clock"))
                            .font(.system(size: 17))
                            .foregroundStyle(it.state == "Complete" ? ShotIQColor.confirmGreen :
                                (it.state == "Uploading" ? ShotIQColor.analysisBlue : ShotIQColor.graphite))
                        Text(it.state == "Complete" ? "Image" : "Video")
                            .font(.system(size: 16, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                            .lineLimit(1).fixedSize()
                        Text("•").foregroundStyle(ShotIQColor.graphite)
                        // The trailing overflow Menu and the Spacer left this
                        // status word compressible, so "Uploading" and "Complete"
                        // broke inside the word — "Uploadin g" / "Complet e" on
                        // 025. It is a single token; it never wraps.
                        Text(it.state).font(.system(size: 14, weight: .medium))
                            .lineLimit(1).fixedSize()
                            .foregroundStyle(it.state == "Complete" ? ShotIQColor.confirmGreen :
                                (it.state == "Uploading" ? ShotIQColor.analysisBlue : ShotIQColor.graphite))
                        Spacer()
                        Menu {
                            Button("Remove from queue", role: .destructive) {
                                withAnimation { items.removeAll { $0.id == it.id } }
                            }
                        } label: {
                            Image(systemName: "ellipsis").foregroundStyle(ShotIQColor.graphite)
                                .padding(.vertical, 4).padding(.leading, 8)
                        }
                    }
                    Text("May 21, 2025 at 8:24 AM").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                    Text(it.name).font(.system(size: 13, weight: .medium)).foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.8)
                    if it.state == "Complete" {
                        Text("Ready to analyze").font(.system(size: 13, weight: .medium))
                            .foregroundStyle(ShotIQColor.confirmGreen)
                        // Shares the screen's one route to processing with
                        // "Analyze selected" — a second NavigationLink to the same
                        // destination competed with the screen's
                        // navigationDestination and the tap went nowhere.
                        Button { goAnalyze = true } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "camera.metering.center.weighted").font(.system(size: 14))
                                Text("Analyze now").font(.system(size: 14, weight: .medium))
                            }
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .frame(maxWidth: .infinity).frame(height: 40)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("Analyze now")
                    } else if it.state == "Uploading" || it.state == "Paused" {
                        HStack(alignment: .firstTextBaseline) {
                            Text("\(Int(it.pct * 100))%").font(.custom("Tungsten-Semibold", size: 28))
                                .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Text("18.7 MB / 32.1 MB").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                        }
                        ScoreBar(pct: it.pct, color: ShotIQColor.analysisBlue)
                        HStack {
                            Text(it.state == "Paused" ? "Upload paused" : "Uploading over Wi-Fi")
                                .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            Spacer()
                            Button {
                                if let idx = items.firstIndex(where: { $0.id == it.id }) {
                                    items[idx].state = items[idx].state == "Uploading" ? "Paused" : "Uploading"
                                }
                            } label: {
                                Image(systemName: it.state == "Uploading" ? "pause" : "play")
                                    .font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                                    .padding(8)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(it.state == "Uploading" ? "Pause upload" : "Resume upload")
                        }
                    } else {
                        Text("Waiting to upload").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        ScoreBar(pct: it.pct, color: ShotIQColor.analysisBlue)
                    }
                }
            }
            .padding(12)
        }
    }
}

struct VideoUploadView: View {      // 026
    @State private var pick: PhotosPickerItem?
    @State private var go = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-video-upload") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    Text("VIDEO UPLOAD").shotiqDisplay(38).padding(.horizontal, 20).padding(.top, 24)
                    Text("Upload a clear video of your shot for AI analysis.")
                        .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    PhotosPicker(selection: $pick, matching: .videos) {
                        VStack(spacing: 8) {
                            Image(systemName: "film").font(.system(size: 34)).foregroundStyle(ShotIQColor.ink)
                            Text("Choose video").font(.system(size: 20, weight: .semibold))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            Text("MP4 • 3–45 seconds").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                            Text("Best results in portrait orientation.")
                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .frame(maxWidth: .infinity).frame(height: 210)
                        .overlay(RoundedRectangle(cornerRadius: 10)
                            .stroke(ShotIQColor.muted, style: StrokeStyle(lineWidth: 1.5, dash: [7, 6])))
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(alignment: .top, spacing: 10) {
                        NavigationLink { LiveCameraSetupView() } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "camera.metering.center.weighted").font(.system(size: 22))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Record video").font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    Text("Use your camera").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(14)
                            .frame(maxWidth: .infinity, minHeight: 76, alignment: .leading)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        }
                        .buttonStyle(.plain)
                        NavigationLink { CaptureGuideView() } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "point.topleft.down.curvedto.point.bottomright.up")
                                    .font(.system(size: 22)).foregroundStyle(ShotIQColor.analysisBlue)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("View filming tips").font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    Text("Learn the best way to film your shot")
                                        .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer(minLength: 0)
                                Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(14)
                            .frame(maxWidth: .infinity, minHeight: 76, alignment: .leading)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    SectionLabel(text: "FRAMING GUIDE").padding(.horizontal, 20).padding(.top, 22)
                    Text("Full body in frame from feet to above release.")
                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 2)
                    HStack(spacing: 12) {
                        framingCard("GOOD", good: true)
                        framingCard("TOO CLOSE", photo: "026-visual-001", good: false)
                    }
                    .padding(.horizontal, 20).padding(.top, 10)

                    // Profile summary (canonical warm panel)
                    VStack(alignment: .leading, spacing: 0) {
                        SectionLabel(text: "YOUR PROFILE SUMMARY").padding(.bottom, 10)
                        HStack(alignment: .center, spacing: 0) {
                            captureStat("24", "SHOTS", size: 30)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                            captureStat("15", "MAKES", size: 30)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                            captureStat("62.5%", "MAKE %", size: 30)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                            VStack(spacing: 3) {
                                Text("82").font(.custom("Tungsten-Semibold", size: 30))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                Text("FORM SCORE").font(.system(size: 9, weight: .medium)).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                ScoreBar(pct: 0.82).frame(width: 64)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.bottom, 14)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        NavigationLink {
                            FlawDetailView(title: "Keep elbow stacked through release", severity: "PRIMARY TARGET")
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("PRIMARY COACHING TARGET")
                                    .font(.system(size: 10, weight: .medium)).kerning(0.7)
                                    .foregroundStyle(ShotIQColor.graphite)
                                HStack {
                                    Text("Keep elbow stacked through release")
                                        .font(.system(size: 17, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        .padding(.top, 12)
                    }
                    .padding(16)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 20).padding(.top, 18)

                    PhaseStrip().padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 26)
                }
            }
        }
        .onChange(of: pick) { _, v in if v != nil { go = true } }
        .navigationDestination(isPresented: $go) { VideoReviewView() }
    }

    private func framingCard(_ badge: String, photo: String? = nil, good: Bool) -> some View {
        ZStack(alignment: .topLeading) {
            if let photo {
                CanonicalPhoto(photo, height: 150, cornerRadius: 8)
            } else {
                captureDark(150, radius: 8)
            }
            Text(badge).font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                .padding(.horizontal, 8).padding(.vertical, 4)
                .background(good ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange,
                            in: RoundedRectangle(cornerRadius: 4))
                .padding(8)
        }
        .overlay(alignment: .bottomTrailing) {
            Image(systemName: good ? "checkmark.circle.fill" : "xmark.circle.fill")
                .font(.system(size: 24))
                .foregroundStyle(good ? ShotIQColor.confirmGreen : ShotIQColor.reviewRed)
                .background(Circle().fill(.white).padding(2))
                .padding(8)
        }
    }
}

struct VideoReviewView: View {      // 027
    @Environment(\.dismiss) private var dismiss
    @State private var trimStart: Double = 0.1
    @State private var trimEnd: Double = 0.8
    var body: some View {
        CanonicalScreen(testID: "screen-ios-video-review") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Button { dismiss() } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "arrow.left").font(.system(size: 14, weight: .semibold))
                                    Text("AI ANALYSIS").font(.system(size: 13, weight: .bold)).kerning(1)
                                }
                                .foregroundStyle(ShotIQColor.graphite)
                            }
                            .buttonStyle(.plain)
                            Text("VIDEO REVIEW").shotiqDisplay(38)
                            Text("Review your clip and adjust the range before we analyze.")
                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer(minLength: 8)
                        HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                        HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    HStack(alignment: .center, spacing: 0) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Jordan Ellis").font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                            Text("Right-handed • Advanced").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        captureStat("82", "FORM SCORE", color: ShotIQColor.shotiqOrange, size: 24)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 30)
                        captureStat("24", "SHOTS", size: 24)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 30)
                        captureStat("15", "MAKES", size: 24)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 30)
                        captureStat("62.5%", "%", size: 24)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    HStack(alignment: .center, spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("PRIMARY TARGET").font(.system(size: 10, weight: .medium)).kerning(0.7)
                                .foregroundStyle(ShotIQColor.graphite)
                            Text("Keep elbow stacked through release")
                                .font(.system(size: 16, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                .lineLimit(1).minimumScaleFactor(0.7)
                        }
                        Spacer()
                        TrendLine(points: [2, 3, 2.6, 3.6, 4.1], stroke: ShotIQColor.shotiqOrange)
                            .frame(width: 76, height: 30)
                    }
                    .padding(14)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 20).padding(.top, 12)

                    CanonicalMediaSurface(key: "027-visual-001", height: 300, duration: "0:06")
                        .padding(.horizontal, 20).padding(.top, 14)

                    Text("Drag the handles to trim your clip")
                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 14)

                    // Trim scrubber with orange handles
                    GeometryReader { geo in
                        let w = geo.size.width
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 6).fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                                .frame(height: 54)
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(ShotIQColor.shotiqOrange, lineWidth: 3)
                                .frame(width: w * (trimEnd - trimStart), height: 54)
                                .offset(x: w * trimStart)
                            RoundedRectangle(cornerRadius: 5).fill(ShotIQColor.shotiqOrange)
                                .frame(width: 18, height: 54)
                                .overlay(Image(systemName: "pause").font(.system(size: 10, weight: .bold)).foregroundStyle(.white))
                                .offset(x: w * trimStart - 9)
                                .gesture(DragGesture(minimumDistance: 0, coordinateSpace: .named("trimTrack"))
                                    .onChanged { v in
                                        trimStart = min(max(0, v.location.x / w), trimEnd - 0.08)
                                    })
                            RoundedRectangle(cornerRadius: 5).fill(ShotIQColor.shotiqOrange)
                                .frame(width: 18, height: 54)
                                .overlay(Image(systemName: "pause").font(.system(size: 10, weight: .bold)).foregroundStyle(.white))
                                .offset(x: w * trimEnd - 9)
                                .gesture(DragGesture(minimumDistance: 0, coordinateSpace: .named("trimTrack"))
                                    .onChanged { v in
                                        trimEnd = max(min(1, v.location.x / w), trimStart + 0.08)
                                    })
                        }
                        .coordinateSpace(name: "trimTrack")
                    }
                    .frame(height: 54).padding(.horizontal, 20).padding(.top, 8)

                    HStack {
                        Text("00:00.50").font(.custom("Tungsten-Semibold", size: 15)).foregroundStyle(ShotIQColor.graphite)
                        Spacer()
                        Text("00:06.00").font(.custom("Tungsten-Semibold", size: 15)).foregroundStyle(ShotIQColor.shotiqOrange)
                        Spacer()
                        Text("00:06.50").font(.custom("Tungsten-Semibold", size: 15)).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 20).padding(.top, 6)

                    SectionLabel(text: "VIDEO DETAILS").padding(.horizontal, 20).padding(.top, 20)
                    HStack(alignment: .top, spacing: 0) {
                        detailCol("clock", "00:06.00", "DURATION")
                        detailCol("iphone", "1080 × 1920", "ORIENTATION")
                        detailCol("doc", "24.8 MB", "FILE SIZE")
                        detailCol("film", "60 FPS", "FRAME RATE")
                    }
                    .padding(.horizontal, 20).padding(.top, 10)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("HOW SHOT DETECTION WORKS")
                            .font(.system(size: 15, weight: .heavy).width(.condensed)).kerning(0.5)
                            .foregroundStyle(ShotIQColor.ink)
                        Text("ShotIQ identifies your shooting motion using pose tracking and ball flight to isolate each rep. You can review and adjust the range if needed.")
                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 20).padding(.top, 16)

                    NavigationLink { AnalysisProcessingView() } label: {
                        captureCTA("Analyze video", icon: "camera.metering.center.weighted")
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(spacing: 10) {
                        Button {
                            // Snap the handles back to the AI-detected shot window.
                            withAnimation(.easeInOut(duration: 0.25)) { trimStart = 0.1; trimEnd = 0.8 }
                        } label: { captureOutline("Trim", icon: "crop") }.buttonStyle(.plain)
                        Button { dismiss() } label: { captureOutline("Change video", icon: "square.and.arrow.up") }.buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 10)

                    NavigationLink { ProfileView() } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "person").font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
                            Text("Edit player profile").font(.system(size: 15)).foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
    }

    private func detailCol(_ icon: String, _ v: String, _ l: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(ShotIQColor.ink)
            Text(v).font(.custom("Tungsten-Semibold", size: 17)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(l).font(.system(size: 9, weight: .medium)).kerning(0.5).foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
}

struct LiveCameraSetupView: View {  // 028
    @ObservedObject private var camera = CameraService.live
    @State private var rightHanded = true
    var body: some View {
        CanonicalScreen(testID: "screen-ios-live-camera-setup") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    ShotIQCard {
                        HStack(alignment: .center, spacing: 0) {
                            VStack(spacing: 2) {
                                Text("FORM SCORE").font(.system(size: 9, weight: .medium)).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                HStack(alignment: .firstTextBaseline, spacing: 2) {
                                    Text("82").font(.custom("Tungsten-Semibold", size: 26))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("/100").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            captureStat("24", "SHOTS", size: 24)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            captureStat("15", "MAKES", size: 24)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            captureStat("62.5%", "ACCURACY", size: 24)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("PRIMARY TARGET").font(.system(size: 8, weight: .medium)).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("Keep elbow stacked through release")
                                    .font(.system(size: 10)).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(2).minimumScaleFactor(0.8)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.leading, 6)
                        }
                        .padding(.vertical, 12).padding(.horizontal, 8)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("LIVE CAMERA SETUP").shotiqDisplay(36)
                            Text("Follow the checklist below for best AI analysis.")
                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                        Button { camera.flipCamera() } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "arrow.triangle.2.circlepath").font(.system(size: 15))
                                Text("Switch camera").font(.system(size: 13, weight: .medium))
                            }
                            .foregroundStyle(ShotIQColor.ink)
                            .padding(.horizontal, 12).padding(.vertical, 10)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    // Live camera preview with corner brackets + dashed crosshair
                    ZStack {
                        captureDark(300)
                        LiveViewfinder(camera: camera)
                        GeometryReader { geo in
                            let w = geo.size.width, h = geo.size.height
                            Path { p in
                                p.move(to: CGPoint(x: w / 2, y: 12)); p.addLine(to: CGPoint(x: w / 2, y: h - 12))
                                p.move(to: CGPoint(x: 12, y: h * 0.55)); p.addLine(to: CGPoint(x: w - 12, y: h * 0.55))
                            }
                            .stroke(.white.opacity(0.8), style: StrokeStyle(lineWidth: 1.2, dash: [5, 5]))
                            Path { p in
                                let m: CGFloat = 16, l: CGFloat = 26
                                p.move(to: CGPoint(x: m, y: m + l)); p.addLine(to: CGPoint(x: m, y: m)); p.addLine(to: CGPoint(x: m + l, y: m))
                                p.move(to: CGPoint(x: w - m - l, y: m)); p.addLine(to: CGPoint(x: w - m, y: m)); p.addLine(to: CGPoint(x: w - m, y: m + l))
                                p.move(to: CGPoint(x: m, y: h - m - l)); p.addLine(to: CGPoint(x: m, y: h - m)); p.addLine(to: CGPoint(x: m + l, y: h - m))
                                p.move(to: CGPoint(x: w - m - l, y: h - m)); p.addLine(to: CGPoint(x: w - m, y: h - m)); p.addLine(to: CGPoint(x: w - m, y: h - m - l))
                            }
                            .stroke(.white, lineWidth: 3)
                        }
                        if camera.status == .unknown {
                            VStack(spacing: 10) {
                                Image(systemName: "camera").font(.system(size: 30)).foregroundStyle(.white)
                                Text("Camera permission needed").font(.system(size: 14)).foregroundStyle(.white)
                                Button("Allow camera") { camera.start() }
                                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                    }
                    .frame(height: 300)
                    .padding(.horizontal, 20).padding(.top, 14)

                    ShotIQCard {
                        VStack(spacing: 0) {
                            setupRow("camera.metering.center.weighted", "STABLE PLACEMENT", "Phone is steady and on a flat surface.")
                            setupRow("figure.stand", "FULL-BODY IN FRAME", "From head to shoes with space around.")
                            setupRow("rectangle.dashed", "HOOP VISIBLE", "Backboard and rim clearly visible.")
                            HStack(spacing: 14) {
                                ReadinessGlyph(kind: .athlete, size: 26)
                                    .foregroundStyle(ShotIQColor.ink).frame(width: 34)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("SHOOTING HAND").font(.system(size: 14, weight: .heavy).width(.condensed)).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text("Confirm your dominant shooting hand.")
                                        .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                HStack(spacing: 0) {
                                    Button { rightHanded = false } label: {
                                        Text("LEFT").font(.system(size: 12, weight: .bold)).kerning(0.5)
                                            .padding(.horizontal, 14).padding(.vertical, 9)
                                            .background(rightHanded ? ShotIQColor.paper : ShotIQColor.shotiqOrange)
                                            .foregroundStyle(rightHanded ? ShotIQColor.ink : .white)
                                    }
                                    .buttonStyle(.plain)
                                    Button { rightHanded = true } label: {
                                        Text("RIGHT").font(.system(size: 12, weight: .bold)).kerning(0.5)
                                            .padding(.horizontal, 14).padding(.vertical, 9)
                                            .background(rightHanded ? ShotIQColor.shotiqOrange : ShotIQColor.paper)
                                            .foregroundStyle(rightHanded ? .white : ShotIQColor.ink)
                                    }
                                    .buttonStyle(.plain)
                                }
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            }
                            .padding(.vertical, 12)
                        }
                        .padding(.horizontal, 14).padding(.vertical, 4)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    NavigationLink { HoopCalibrationView() } label: {
                        captureCTA("Set up camera", icon: "camera.metering.center.weighted")
                    }
                    .padding(.horizontal, 20).padding(.top, 16)
                    NavigationLink { VideoUploadView() } label: {
                        captureOutline("Use uploaded video", icon: "square.and.arrow.up")
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 10)

                    PhaseStrip(active: "SETUP").padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 26)
                }
            }
        }
    }

    private func setupRow(_ icon: String, _ t: String, _ d: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.system(size: 20)).foregroundStyle(ShotIQColor.ink).frame(width: 34)
            VStack(alignment: .leading, spacing: 2) {
                Text(t).font(.system(size: 14, weight: .heavy).width(.condensed)).kerning(0.5)
                    .foregroundStyle(ShotIQColor.ink)
                Text(d).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Image(systemName: "checkmark.circle").font(.system(size: 22)).foregroundStyle(ShotIQColor.confirmGreen)
        }
        .padding(.vertical, 12)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
    }
}

struct HoopCalibrationView: View {  // 029
    @ObservedObject private var camera = CameraService.live
    @State private var hoopPos = CGPoint(x: 0.5, y: 0.35)
    var body: some View {
        CanonicalScreen(testID: "screen-ios-hoop-calibration") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("HOOP CALIBRATION").shotiqDisplay(36)
                            Text("Align the overlay with the hoop.")
                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer(minLength: 8)
                        HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                        HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    // Full-bleed camera area with crosshair + framing brackets
                    GeometryReader { geo in
                        let w = geo.size.width, h = geo.size.height
                        let cx = hoopPos.x * w, cy = hoopPos.y * h
                        ZStack {
                            Rectangle().fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                            LiveViewfinder(camera: camera, radius: 0)
                            Path { p in
                                p.move(to: CGPoint(x: cx, y: 0)); p.addLine(to: CGPoint(x: cx, y: h))
                                p.move(to: CGPoint(x: 0, y: cy)); p.addLine(to: CGPoint(x: w, y: cy))
                            }
                            .stroke(.white, lineWidth: 1.6)
                            Path { p in
                                let bw: CGFloat = min(w, h) * 0.42, l: CGFloat = 22, r: CGFloat = 10
                                let x0 = cx - bw, x1 = cx + bw
                                let y0 = cy - bw * 0.7, y1 = cy + bw * 0.7
                                p.move(to: CGPoint(x: x0, y: y0 + l))
                                p.addArc(tangent1End: CGPoint(x: x0, y: y0), tangent2End: CGPoint(x: x0 + l, y: y0), radius: r)
                                p.addLine(to: CGPoint(x: x0 + l, y: y0))
                                p.move(to: CGPoint(x: x1 - l, y: y0))
                                p.addArc(tangent1End: CGPoint(x: x1, y: y0), tangent2End: CGPoint(x: x1, y: y0 + l), radius: r)
                                p.addLine(to: CGPoint(x: x1, y: y0 + l))
                                p.move(to: CGPoint(x: x0, y: y1 - l))
                                p.addArc(tangent1End: CGPoint(x: x0, y: y1), tangent2End: CGPoint(x: x0 + l, y: y1), radius: r)
                                p.addLine(to: CGPoint(x: x0 + l, y: y1))
                                p.move(to: CGPoint(x: x1 - l, y: y1))
                                p.addArc(tangent1End: CGPoint(x: x1, y: y1), tangent2End: CGPoint(x: x1, y: y1 - l), radius: r)
                                p.addLine(to: CGPoint(x: x1, y: y1 - l))
                            }
                            .stroke(.white, lineWidth: 5)
                        }
                        .coordinateSpace(name: "hoopArea")
                        .contentShape(Rectangle())
                        // Press-and-hold, then drag, to move the reticle. A plain
                        // full-surface DragGesture swallowed the enclosing
                        // ScrollView's pan, so this screen could not be scrolled at
                        // all and its "Confirm hoop" CTA — below the fold on a
                        // phone — was unreachable. A long press does not compete
                        // with a scroll flick, so both gestures now work.
                        .gesture(
                            LongPressGesture(minimumDuration: 0.25)
                                .sequenced(before: DragGesture(minimumDistance: 0,
                                                               coordinateSpace: .named("hoopArea")))
                                .onChanged { value in
                                    guard case .second(true, let drag?) = value else { return }
                                    hoopPos = CGPoint(x: min(max(drag.location.x / w, 0.15), 0.85),
                                                      y: min(max(drag.location.y / h, 0.15), 0.85))
                                }
                        )
                        .accessibilityLabel("Hoop calibration viewfinder — press and hold, then drag, to move the crosshair")
                        .overlay(alignment: .bottom) {
                            HStack(spacing: 10) {
                                ReadinessGlyph(kind: .framing, size: 26).foregroundStyle(.white)
                                Text("Center the hoop in the frame.\nAlign the rim with the crosshair.")
                                    .font(.system(size: 14)).foregroundStyle(.white)
                            }
                            .padding(.horizontal, 14).padding(.vertical, 10)
                            .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 8))
                            .padding(.bottom, 18)
                        }
                    }
                    .frame(height: 430)
                    .padding(.top, 14)

                    HStack(spacing: 10) {
                        Button { camera.flipCamera() } label: { captureOutline("Switch camera", icon: "arrow.triangle.2.circlepath") }
                            .buttonStyle(.plain)
                        NavigationLink { ReadinessCheckView() } label: {
                            captureOutline("Skip calibration", icon: "viewfinder")
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    NavigationLink { ReadinessCheckView() } label: {
                        captureCTA("Confirm hoop", icon: "scope", color: ShotIQColor.confirmGreen)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("Confirm hoop")
                    .padding(.horizontal, 20).padding(.top, 10)

                    PhaseStrip().padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 26)
                }
            }
        }
    }
}

struct ReadinessCheckView: View {   // 030
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var camera = CameraService.live
    private let checks = [("Full body", "GOOD"), ("Lighting", "GOOD"), ("Stability", "GOOD"),
                          ("Hoop visible", "GOOD"), ("Ball visible", "GOOD"), ("Pose confidence", "92%")]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-readiness-check") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    Button { dismiss() } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "arrow.left").font(.system(size: 16, weight: .semibold))
                            Text("AI ANALYSIS").font(.system(size: 13, weight: .bold)).kerning(1)
                        }
                        .foregroundStyle(ShotIQColor.graphite)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 16)

                    Text("READINESS CHECK").shotiqDisplay(38).padding(.horizontal, 20).padding(.top, 6)
                    Text("Get everything green to capture your best analysis.")
                        .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    ZStack(alignment: .topLeading) {
                        captureDark(400)
                        LiveViewfinder(camera: camera).frame(height: 400)
                        HStack(spacing: 6) {
                            Circle().fill(ShotIQColor.confirmGreen).frame(width: 8, height: 8)
                            Text("LIVE").font(.system(size: 13, weight: .semibold)).foregroundStyle(.white)
                        }
                        .padding(.horizontal, 12).padding(.vertical, 7)
                        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 7))
                        .padding(12)
                    }
                    .overlay(alignment: .trailing) {
                        VStack(alignment: .leading, spacing: 0) {
                            ForEach(checks, id: \.0) { name, value in
                                HStack(spacing: 8) {
                                    Image(systemName: "checkmark.circle.fill").font(.system(size: 16))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(name).font(.system(size: 12, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                        Text(value).font(.system(size: 10, weight: .bold)).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                    }
                                    Spacer(minLength: 0)
                                }
                                .padding(.vertical, 6)
                                .overlay(alignment: .bottom) {
                                    if name != "Pose confidence" { Rectangle().fill(ShotIQColor.rule).frame(height: 1) }
                                }
                            }
                        }
                        .padding(10)
                        .frame(width: 168)
                        .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.trailing, 12)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    SectionLabel(text: "SHOT PHASE").padding(.horizontal, 20).padding(.top, 18)
                    PhaseStrip().padding(.horizontal, 20).padding(.top, 8)

                    NavigationLink {
                        FlawDetailView(title: "Keep elbow stacked through release", severity: "PRIMARY TARGET")
                    } label: {
                        HStack(alignment: .center, spacing: 14) {
                            TrendLine(points: [1, 2.4, 3.4, 4], stroke: ShotIQColor.shotiqOrange)
                                .frame(width: 52, height: 40)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("PRIMARY COACHING TARGET")
                                    .font(.system(size: 10, weight: .medium)).kerning(0.7)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("Keep elbow stacked through release")
                                    .font(.system(size: 18, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(2).minimumScaleFactor(0.8)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 16)

                    NavigationLink { CaptureReadyView() } label: {
                        captureCTA("Keep position", color: ShotIQColor.confirmGreen)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("Keep position")
                    .padding(.horizontal, 20).padding(.top, 16)

                    HStack(spacing: 10) {
                        NavigationLink { CaptureGuideView() } label: { captureOutline("Camera help", icon: "camera") }
                            .buttonStyle(.plain)
                        Button { dismiss() } label: { captureOutline("Cancel") }.buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
    }
}

struct CaptureReadyView: View {     // 031
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var camera = CameraService.live
    @State private var count = 3
    @State private var go = false
    @State private var cancelled = false
    private let readiness = [("Camera", "Positioned"), ("Full Body", "In Frame"), ("Lighting", "Good"),
                             ("Space", "Clear"), ("Battery", "Sufficient")]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-capture-ready") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("CAPTURE READY").shotiqDisplay(38)
                            Text("All readiness checks confirmed. You're good to go.")
                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                        Image(systemName: "checkmark.circle").font(.system(size: 38))
                            .foregroundStyle(ShotIQColor.confirmGreen)
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(alignment: .top, spacing: 0) {
                        ForEach(readiness, id: \.0) { t, d in
                            VStack(spacing: 3) {
                                Image(systemName: "checkmark.circle.fill").font(.system(size: 16))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                Text(t).font(.system(size: 12, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text(d).font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    SectionLabel(text: "CAMERA PREVIEW").padding(.horizontal, 20).padding(.top, 20)
                    ZStack(alignment: .bottomTrailing) {
                        captureDark(260)
                        LiveViewfinder(camera: camera).frame(height: 260)
                        Text("1080p • 60fps").font(.system(size: 12, weight: .medium)).foregroundStyle(.white)
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(.black.opacity(0.72), in: Capsule())
                            .padding(10)
                    }
                    .overlay(alignment: .topTrailing) {
                        Text("AUTO-START IN \(count)")
                            .font(.system(size: 10, weight: .bold)).kerning(0.6).foregroundStyle(.white)
                            .padding(.horizontal, 8).padding(.vertical, 5)
                            .background(.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 4))
                            .padding(10)
                    }
                    .padding(.horizontal, 20).padding(.top, 8)

                    HStack(spacing: 6) {
                        SectionLabel(text: "SHOT RAIL:")
                        Text("SETUP").font(.system(size: 12, weight: .bold)).kerning(0.8)
                            .foregroundStyle(ShotIQColor.analysisBlue)
                    }
                    .padding(.horizontal, 20).padding(.top, 18)
                    PhaseStrip(active: "RELEASE").padding(.horizontal, 20).padding(.top, 8)

                    CaptureCoachingRow().padding(.horizontal, 20).padding(.top, 16)

                    SectionLabel(text: "LATEST SESSION").padding(.horizontal, 20).padding(.top, 12)
                    CaptureSessionStats().padding(.horizontal, 20).padding(.top, 8)

                    Button { go = true } label: {
                        captureCTA("Start recording", icon: "record.circle", color: ShotIQColor.confirmGreen)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(spacing: 10) {
                        Button {
                            cancelled = true
                            dismiss() // back to the readiness/setup screens
                        } label: { captureOutline("Adjust setup", icon: "slider.horizontal.3") }.buttonStyle(.plain)
                        Button {
                            cancelled = true
                            CameraService.live.stop()
                            dismiss()
                        } label: { captureOutline("Cancel", icon: "xmark") }.buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
        .task {
            while count > 1 {
                try? await Task.sleep(for: .seconds(1))
                if cancelled { return }
                count -= 1
            }
            try? await Task.sleep(for: .seconds(1))
            if !cancelled { go = true }
        }
        .navigationDestination(isPresented: $go) { LiveRecordingView() }
    }
}

struct LiveRecordingView: View {    // 032
    @ObservedObject private var camera = CameraService.live
    @State private var seconds = 0
    @State private var timer: Timer?
    @State private var paused = false
    /// Single item-based route out of recording: two
    /// `navigationDestination(isPresented:)` modifiers on one view conflict and
    /// only the last one presents, which left "Stop recording" going nowhere.
    enum RecordingRoute: Hashable { case feedback, detected }
    @State private var route: RecordingRoute?
    private var clock: String { String(format: "%02d:%02d", seconds / 60, seconds % 60) }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-live-recording") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    HStack(spacing: 8) {
                        Circle().fill(ShotIQColor.shotiqOrange).frame(width: 9, height: 9)
                        Text("LIVE RECORDING").font(.system(size: 16, weight: .heavy).width(.condensed)).kerning(0.8)
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Text("Session time  \(clock)").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                            .padding(.leading, 8)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    // Live camera surface with recording overlays
                    ZStack(alignment: .topLeading) {
                        captureDark(470)
                        LiveViewfinder(camera: camera).frame(height: 470)
                        VStack(alignment: .leading, spacing: 3) {
                            Text("CONFIDENCE").font(.system(size: 10, weight: .bold)).kerning(0.8)
                                .foregroundStyle(.white)
                            Text("92%").font(.custom("Tungsten-Semibold", size: 30))
                                .foregroundStyle(ShotIQColor.confirmGreen)
                            Capsule().fill(ShotIQColor.confirmGreen).frame(width: 64, height: 4)
                        }
                        .padding(14)
                    }
                    .overlay(alignment: .topTrailing) {
                        HStack(spacing: 7) {
                            Circle().fill(ShotIQColor.shotiqOrange).frame(width: 8, height: 8)
                            VStack(alignment: .leading, spacing: 0) {
                                Text("REC").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                                Text(clock).font(.custom("Tungsten-Semibold", size: 20)).foregroundStyle(.white)
                            }
                        }
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(.black.opacity(0.66), in: RoundedRectangle(cornerRadius: 7))
                        .padding(12)
                    }
                    .overlay(alignment: .trailing) {
                        VStack(alignment: .leading, spacing: 12) {
                            VStack(alignment: .leading, spacing: 1) {
                                Text("SHOTS").font(.system(size: 9, weight: .bold)).kerning(0.6).foregroundStyle(.white.opacity(0.85))
                                Text("24").font(.custom("Tungsten-Semibold", size: 30)).foregroundStyle(.white)
                            }
                            Rectangle().fill(.white.opacity(0.5)).frame(width: 60, height: 1)
                            VStack(alignment: .leading, spacing: 1) {
                                Text("MAKES").font(.system(size: 9, weight: .bold)).kerning(0.6).foregroundStyle(.white.opacity(0.85))
                                Text("15").font(.custom("Tungsten-Semibold", size: 30)).foregroundStyle(.white)
                            }
                            Rectangle().fill(.white.opacity(0.5)).frame(width: 60, height: 1)
                            VStack(alignment: .leading, spacing: 1) {
                                Text("MAKE %").font(.system(size: 9, weight: .bold)).kerning(0.6).foregroundStyle(.white.opacity(0.85))
                                Text("62.5%").font(.custom("Tungsten-Semibold", size: 30)).foregroundStyle(.white)
                            }
                        }
                        .padding(.trailing, 16)
                    }
                    .overlay(alignment: .bottom) {
                        HStack(alignment: .top) {
                            ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                                VStack(spacing: 3) {
                                    Text(p).font(.system(size: 8, weight: p == "RELEASE" ? .bold : .regular)).kerning(0.4)
                                        .foregroundStyle(p == "RELEASE" ? ShotIQColor.shotiqOrange : .white.opacity(0.85))
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    if p == "RELEASE" {
                                        Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 34, height: 2)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.horizontal, 12).padding(.bottom, 12)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    CaptureCoachingRow(boxed: true).padding(.horizontal, 20).padding(.top, 14)

                    ShotIQCard {
                        HStack(alignment: .top, spacing: 0) {
                            liveMetric("stopwatch", "REPS REMAINING", "00:42")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 56)
                            liveMetric("stopwatch", "ROUND TIMER", "00:42")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 56)
                            liveMetric("hand.raised", "QUALITY TOUCHES", "50")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 56)
                            VStack(spacing: 4) {
                                TrendLine(points: [2, 2.8, 2.4, 3.6, 4], stroke: ShotIQColor.confirmGreen)
                                    .frame(width: 56, height: 18)
                                Text("CURRENT STREAK").font(.system(size: 8, weight: .medium)).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text("7").font(.custom("Tungsten-Semibold", size: 24)).foregroundStyle(ShotIQColor.ink)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.vertical, 14).padding(.horizontal, 8)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    HStack(alignment: .top) {
                        Spacer()
                        // Each transport control is one Button covering its glyph AND
                        // its caption — the captions used to be loose Text siblings,
                        // so tapping the visible word did nothing.
                        Button {
                            paused.toggle()
                            if paused {
                                camera.stopRecording()
                            } else if camera.status == .ready {
                                camera.startRecording()
                            }
                        } label: {
                            VStack(spacing: 8) {
                                Circle().stroke(ShotIQColor.rule, lineWidth: 1.5).frame(width: 62, height: 62)
                                    .overlay(Image(systemName: paused ? "play.fill" : "pause.fill")
                                        .font(.system(size: 20)).foregroundStyle(ShotIQColor.ink))
                                Text(paused ? "RESUME" : "PAUSE").font(.system(size: 10, weight: .medium)).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(paused ? "Resume recording" : "Pause recording")
                        Spacer()
                        Button {
                            camera.stopRecording()
                            route = .feedback
                        } label: {
                            VStack(spacing: 8) {
                                Circle().fill(ShotIQColor.shotiqOrange).frame(width: 84, height: 84)
                                    .overlay(RoundedRectangle(cornerRadius: 5).fill(.white).frame(width: 26, height: 26))
                                Text("STOP RECORDING").font(.system(size: 11, weight: .bold)).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Stop recording")
                        .accessibilityIdentifier("Stop recording")
                        Spacer()
                        Button {
                            camera.stopRecording()
                            route = .detected
                        } label: {
                            VStack(spacing: 8) {
                                Circle().stroke(ShotIQColor.rule, lineWidth: 1.5).frame(width: 62, height: 62)
                                    .overlay(Image(systemName: "flag.fill").font(.system(size: 19)).foregroundStyle(ShotIQColor.ink))
                                Text("END ROUND").font(.system(size: 10, weight: .medium)).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("END ROUND")
                        .accessibilityIdentifier("END ROUND")
                        Spacer()
                    }
                    .padding(.top, 22).padding(.bottom, 28)
                }
            }
        }
        .onAppear { timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in if !paused { seconds += 1 } } }
        .onDisappear { timer?.invalidate() }
        .task {
            // Roll for real: spin the shared session up, then start the movie file output.
            camera.start()
            try? await Task.sleep(for: .seconds(0.6))
            if camera.status == .ready && !camera.isRecording && !paused { camera.startRecording() }
        }
        .navigationDestination(item: $route) { r in
            switch r {
            case .feedback: LiveFormFeedbackView()
            case .detected: ShotDetectedView()
            }
        }
    }

    private func liveMetric(_ icon: String, _ label: String, _ value: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
            Text(label).font(.system(size: 8, weight: .medium)).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(value).font(.custom("Tungsten-Semibold", size: 24)).foregroundStyle(ShotIQColor.ink)
        }
        .frame(maxWidth: .infinity)
    }
}

struct LiveFormFeedbackView: View { // 033
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var camera = CameraService.live
    @State private var muted = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-live-form-feedback") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    HStack {
                        SectionLabel(text: "LIVE FORM FEEDBACK")
                        Spacer()
                        HStack(spacing: 6) {
                            Circle().fill(ShotIQColor.analysisBlue).frame(width: 8, height: 8)
                            Text("Demo").font(.system(size: 14)).foregroundStyle(ShotIQColor.analysisBlue)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    ZStack(alignment: .topLeading) {
                        captureDark(420)
                        LiveViewfinder(camera: camera).frame(height: 420)
                        HStack(spacing: 6) {
                            Circle().fill(ShotIQColor.shotiqOrange).frame(width: 8, height: 8)
                            Text("LIVE").font(.system(size: 13, weight: .semibold)).foregroundStyle(.white)
                        }
                        .padding(.horizontal, 12).padding(.vertical, 7)
                        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 7))
                        .padding(12)
                    }
                    .overlay(alignment: .trailing) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("LATEST RESULT").font(.system(size: 10, weight: .bold)).kerning(0.7)
                                .foregroundStyle(ShotIQColor.graphite)
                            Text("FORM SCORE").font(.system(size: 11, weight: .bold)).kerning(0.7)
                                .foregroundStyle(ShotIQColor.ink)
                            Text("82").font(.custom("Tungsten-Semibold", size: 58))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            ScoreBar(pct: 0.82).frame(width: 110)
                            Text("GOOD").font(.system(size: 14, weight: .bold)).foregroundStyle(ShotIQColor.analysisBlue)
                            Text("Keep building consistency.").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(14)
                        .frame(width: 160, alignment: .leading)
                        .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 10))
                        .padding(.trailing, 12)
                    }
                    .padding(.horizontal, 20).padding(.top, 10)

                    ShotIQCard {
                        HStack(alignment: .center, spacing: 16) {
                            CorrectionGlyph(kind: .stack, size: 54).foregroundStyle(ShotIQColor.ink)
                            VStack(alignment: .leading, spacing: 6) {
                                Text("LIVE FEEDBACK").font(.system(size: 10, weight: .bold)).kerning(0.7)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("Keep elbow stacked.")
                                    .font(.system(size: 21, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                                HStack(spacing: 0) {
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text("CONFIDENCE").font(.system(size: 9, weight: .medium)).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("87%").font(.custom("Tungsten-Semibold", size: 20))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 30)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text("DETECTED").font(.system(size: 9, weight: .medium)).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("Release").font(.system(size: 15, weight: .semibold))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.leading, 12)
                                }
                            }
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    PhaseStrip().padding(.horizontal, 20).padding(.top, 16)

                    HStack(alignment: .top) {
                        Spacer()
                        VStack(spacing: 8) {
                            Button { muted.toggle() } label: {
                                Circle().stroke(muted ? ShotIQColor.shotiqOrange : ShotIQColor.rule, lineWidth: 1.5)
                                    .frame(width: 62, height: 62)
                                    .overlay(Image(systemName: muted ? "speaker.wave.2" : "speaker.slash")
                                        .font(.system(size: 19))
                                        .foregroundStyle(muted ? ShotIQColor.shotiqOrange : ShotIQColor.ink))
                            }
                            .buttonStyle(.plain)
                            Text(muted ? "Unmute coaching" : "Mute coaching")
                                .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                        VStack(spacing: 8) {
                            NavigationLink { ShotDetectedView() } label: {
                                Circle().fill(ShotIQColor.confirmGreen).frame(width: 74, height: 74)
                                    .overlay(RoundedRectangle(cornerRadius: 5).fill(.white).frame(width: 22, height: 22))
                            }
                            Text("Stop").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                    }
                    .padding(.top, 20)

                    Button { dismiss() } label: { captureCTA("Keep shooting", color: ShotIQColor.confirmGreen) }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 26)
                }
            }
        }
    }
}

struct ShotDetectedView: View {     // 034
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var camera = CameraService.live
    @State private var goReview = false
    private let context = [("Catch & Shoot", "Off the Dribble"), ("Top of Key", "17.5 ft"),
                           ("Release Height", "7.6 ft"), ("Defender", "4.2 ft Away")]

    /// Shared by CONFIRM MAKE / MARK MISS: record the real shot event, then
    /// move on to the capture review.
    private func record(made: Bool) {
        Task { await APIClient.shared.recordShotEvent(drillId: "live-capture", made: made) }
        goReview = true
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-shot-detected") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    HStack(spacing: 8) {
                        Text("ANALYSIS").font(.system(size: 12, weight: .bold)).kerning(1)
                            .foregroundStyle(ShotIQColor.graphite)
                        Image(systemName: "chevron.right").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                        Text("SHOT DETECTED").font(.system(size: 12, weight: .bold)).kerning(1)
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 14) {
                            HStack(spacing: 12) {
                                Text("SHOT 12").shotiqDisplay(30)
                                Text("SHOT DETECTED").font(.system(size: 11, weight: .bold)).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .padding(.horizontal, 10).padding(.vertical, 6)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                Spacer()
                            }
                            HStack(spacing: 0) {
                                HStack(spacing: 10) {
                                    Image(systemName: "clock").font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text("8:24:10 AM").font(.custom("Tungsten-Semibold", size: 19)).foregroundStyle(ShotIQColor.ink)
                                        Text("Today").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                HStack(spacing: 10) {
                                    Image(systemName: "waveform.path.ecg").font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text("97%").font(.custom("Tungsten-Semibold", size: 19)).foregroundStyle(ShotIQColor.ink)
                                        Text("CONFIDENCE").font(.system(size: 10, weight: .medium)).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.leading, 16)
                            }
                            // The just-recorded clip flows straight into review.
                            if let url = camera.lastVideoURL {
                                VideoPlayer(player: AVPlayer(url: url))
                                    .frame(height: 280)
                                    .clipShape(RoundedRectangle(cornerRadius: 6))
                            } else {
                                captureDark(280, radius: 6)
                            }
                            PhaseStrip()
                            HStack(alignment: .top, spacing: 0) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("FORM SCORE").font(.system(size: 10, weight: .medium)).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(alignment: .center, spacing: 10) {
                                        Text("82").font(.custom("Tungsten-Semibold", size: 46))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        VStack(alignment: .leading, spacing: 3) {
                                            ScoreBar(pct: 0.82).frame(width: 80)
                                            Text("GOOD").font(.system(size: 12, weight: .bold))
                                                .foregroundStyle(ShotIQColor.analysisBlue)
                                            Text("Keep building consistency.")
                                                .font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 66)
                                NavigationLink {
                                    FlawDetailView(title: "Keep elbow stacked through release", severity: "PRIMARY TARGET")
                                } label: {
                                    HStack(alignment: .center, spacing: 8) {
                                        VStack(alignment: .leading, spacing: 5) {
                                            Text("PRIMARY COACHING TARGET").font(.system(size: 10, weight: .medium)).kerning(0.5)
                                                .foregroundStyle(ShotIQColor.graphite)
                                                .lineLimit(1).minimumScaleFactor(0.7)
                                            Text("Keep elbow stacked through release")
                                                .font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(2).minimumScaleFactor(0.8)
                                        }
                                        Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .buttonStyle(.plain)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.leading, 14)
                            }
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    SectionLabel(text: "CONFIRM THIS RESULT").padding(.horizontal, 20).padding(.top, 20)
                    Text("Was this a shot attempt?").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 2)

                    HStack(alignment: .top, spacing: 10) {
                        Button { record(made: true) } label: {
                            VStack(spacing: 8) {
                                Image(systemName: "checkmark").font(.system(size: 18, weight: .bold))
                                Text("CONFIRM MAKE").font(.system(size: 12, weight: .heavy).width(.condensed)).kerning(0.5)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity).frame(height: 80)
                            .background(ShotIQColor.confirmGreen, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                        .buttonStyle(.plain)
                        Button { record(made: false) } label: {
                            VStack(spacing: 8) {
                                Image(systemName: "xmark").font(.system(size: 18, weight: .semibold))
                                Text("MARK MISS").font(.system(size: 12, weight: .heavy).width(.condensed)).kerning(0.5)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity).frame(height: 80)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        Button { dismiss() } label: {
                            VStack(spacing: 8) {
                                Image(systemName: "viewfinder").font(.system(size: 18))
                                Text("NOT A SHOT").font(.system(size: 12, weight: .heavy).width(.condensed)).kerning(0.5)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity).frame(height: 80)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    SectionLabel(text: "SHOT CONTEXT").padding(.horizontal, 20).padding(.top, 20)
                    HStack(alignment: .top, spacing: 0) {
                        ForEach(context, id: \.0) { t, d in
                            VStack(alignment: .center, spacing: 4) {
                                ReadinessGlyph(kind: .init(contextLabel: t), size: 22)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text(t).font(.system(size: 11, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text(d).font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
        .navigationDestination(isPresented: $goReview) { CaptureReviewView() }
    }
}

struct CaptureReviewView: View {    // 035
    @Environment(\.dismiss) private var dismiss
    @State private var filter = "Needs review (3)"
    @State private var lowestFirst = true
    @State private var confirmDiscard = false
    private let filters = ["All (24)", "Needs review (3)", "Confirmed (15)", "Discarded (6)"]
    private let flagged: [(Int, String, String, String, Double)] = [
        (7, "Today • 8:05 AM", "Release", "00:03", 0.58),
        (12, "Today • 8:09 AM", "Elbow angle", "00:05", 0.61),
        (19, "Today • 8:16 AM", "Release timing", "00:06", 0.64)]
    /// Canonical thumbnail per flagged shot — only shot 12's frame is bundled
    /// (035-visual-002); the other two rows keep the dark surface until cropped.
    private let shotThumbs: [Int: String] = [12: "035-visual-002"]
    private var visibleFlagged: [(Int, String, String, String, Double)] {
        guard filter == "All (24)" || filter == "Needs review (3)" else { return [] }
        return flagged.sorted { lowestFirst ? $0.4 < $1.4 : $0.4 > $1.4 }
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-capture-review") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()

                    Button { dismiss() } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "arrow.left").font(.system(size: 15, weight: .semibold))
                            Text("Back to session summary").font(.system(size: 15))
                        }
                        .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 16)

                    HStack(alignment: .top) {
                        Text("CAPTURE REVIEW").shotiqDisplay(40)
                        Spacer()
                        HStack(spacing: 8) {
                            Image(systemName: "film").font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
                            Text("24").font(.custom("Tungsten-Semibold", size: 24)).foregroundStyle(ShotIQColor.ink)
                            Text("SHOTS").font(.system(size: 9, weight: .medium)).kerning(0.5)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    }
                    .padding(.horizontal, 20).padding(.top, 8)
                    Text("We flagged 3 shots for review.\nConfirm, correct, or discard each shot.")
                        .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    HStack(alignment: .top, spacing: 0) {
                        captureStat("15", "MAKES", size: 30)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                        captureStat("62.5%", "MAKE %", size: 30)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                        captureStat("3", "NEED REVIEW", color: ShotIQColor.shotiqOrange, size: 30)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                        captureStat("6", "DISCARDED", size: 30)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                        captureStat("00:20:04", "PRACTICE TIME", size: 30)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(filters, id: \.self) { f in
                                Button { withAnimation { filter = f } } label: {
                                    filterChip(f, selected: filter == f)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    .padding(.top, 16)

                    HStack {
                        SectionLabel(text: filter.uppercased())
                        Spacer()
                        Button { withAnimation { lowestFirst.toggle() } } label: {
                            HStack(spacing: 6) {
                                Text(lowestFirst ? "Review lowest confidence first" : "Review highest confidence first")
                                    .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                Image(systemName: "chevron.up.chevron.down").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 20)

                    if visibleFlagged.isEmpty {
                        Text("Nothing to review in this view. Switch filters to see other shots.")
                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            .padding(.horizontal, 20).padding(.top, 12)
                    }

                    ForEach(visibleFlagged, id: \.0) { n, when, flaw, dur, conf in
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 14) {
                                ZStack(alignment: .bottomLeading) {
                                    if let key = shotThumbs[n] {
                                        CanonicalPhoto(key, width: 116, height: 132, cornerRadius: 4)
                                    } else {
                                        captureDark(132, radius: 4).frame(width: 116)
                                    }
                                    Text(dur).font(.custom("Tungsten-Semibold", size: 12)).foregroundStyle(.white)
                                        .padding(.horizontal, 6).padding(.vertical, 3)
                                        .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 3))
                                        .padding(6)
                                }
                                // Thumb (116) + confidence ring column both hold a
                                // fixed width, so this middle column was the only
                                // compressible one and the meta lines broke
                                // mid-word — "Low confidenc e" on 035. Pinning
                                // them to their own text gives the column a floor.
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("SHOT \(n)").shotiqDisplay(22)
                                    Text(when).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                    HStack(spacing: 6) {
                                        Image(systemName: "figure.basketball").font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
                                        Text(flaw).font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
                                            .lineLimit(1).fixedSize()
                                    }
                                    HStack(spacing: 6) {
                                        Image(systemName: "gauge.with.needle").font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
                                        Text("Low confidence").font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
                                            .lineLimit(1).fixedSize()
                                    }
                                    HStack(spacing: 6) {
                                        Image(systemName: "film").font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
                                        Text(dur).font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
                                            .lineLimit(1).fixedSize()
                                    }
                                }
                                Spacer(minLength: 4)
                                VStack(spacing: 6) {
                                    Ring(pct: conf, color: ShotIQColor.shotiqOrange, lineWidth: 5)
                                        .frame(width: 48, height: 48)
                                        .overlay(Text("\(Int(conf * 100))")
                                            .font(.custom("Tungsten-Semibold", size: 19)).foregroundStyle(ShotIQColor.ink))
                                    Text("CONFIDENCE").font(.system(size: 7, weight: .medium)).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    NavigationLink { ShotBreakdownView() } label: {
                                        Text("Review").font(.system(size: 13, weight: .medium))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                            .padding(.horizontal, 18).padding(.vertical, 8)
                                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(12)
                        }
                        .padding(.horizontal, 20).padding(.top, 12)
                    }

                    Button { confirmDiscard = true } label: { captureOutline("Discard session", icon: "trash") }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20).padding(.top, 18)

                    NavigationLink { AnalysisProcessingView() } label: {
                        captureCTA("Analyze session", icon: "camera.metering.center.weighted")
                    }
                    .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
        // End of the live flow — release the shared camera.
        .onAppear { CameraService.live.stop() }
        .alert("Discard this session?", isPresented: $confirmDiscard) {
            Button("Discard", role: .destructive) { dismiss() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("All 24 captured shots from this session will be deleted.")
        }
    }

    private func filterChip(_ t: String, selected: Bool) -> some View {
        Text(t).font(.system(size: 13, weight: selected ? .semibold : .regular))
            .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
            .padding(.horizontal, 14).padding(.vertical, 9)
            .background(selected ? ShotIQColor.paper : ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
    }
}
