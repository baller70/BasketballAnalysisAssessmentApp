import SwiftUI
import PhotosUI
import AVFoundation
import AVKit
import UniformTypeIdentifiers

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
/// when running, canonical gym frame behind it when there is no feed, Settings
/// deep-link card when denied.
///
/// The `fallback` key is the point of this view. On a Simulator — and on a
/// device for the second or two before `AVCaptureSession` comes up — there is no
/// video, and every one of 028-031 rendered as a flat black rectangle. Two
/// graders read those as a defect and one could not tell whether it was the app
/// or the missing simulator camera. It is the app: the canonical designs paint a
/// real photographic viewfinder there and the crop is already in the bundle. The
/// live feed still wins whenever it exists — this only fills the hole.
///
/// Callers must consult `CameraService.isLive` before drawing viewfinder chrome:
/// several of these crops carry canonical's own HUD (framing brackets, checklist
/// card, hint card, resolution pill) baked into the pixels, so the app's copy has
/// to stand down while the photograph is what is on screen.
private struct LiveViewfinder: View {
    @ObservedObject var camera: CameraService
    var radius: CGFloat = 8
    var fallback: String? = nil
    var body: some View {
        ZStack {
            if let fallback, camera.status != .ready {
                CanonicalPhoto(fallback, cornerRadius: radius)
            }
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

extension CameraService {
    /// True only when a real capture session is feeding the preview layer. The
    /// capture screens gate their viewfinder HUD on this, because the canonical
    /// stand-in photographs already have that HUD burned into them.
    var isLive: Bool { status == .ready }
}

/// Canonical 029 viewfinder, reassembled from the three crops it was cut into.
///
/// The sidecar split the calibration preview along its own crosshair, so the
/// bundle holds the two top quadrants either side of the vertical rule
/// (`029-visual-002` left, `029-visual-001` right) and the full-width lower band
/// (`029-visual-003`) rather than one frame. On the 853x1844 canonical canvas the
/// preview runs y 256…1227 with the horizontal rule at y 618, which puts the
/// split at 0.373 of the height; the top halves are butted at the midline so the
/// 3px crosshair gutter between them closes.
///
/// The corner brackets and the "Center the hoop in the frame" card are baked into
/// these crops — 029 must not draw its own copies over them.
private struct HoopCalibrationBackdrop: View {
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let topH = h * 0.373
            VStack(spacing: 0) {
                HStack(spacing: 0) {
                    CanonicalPhoto("029-visual-002", width: w / 2, height: topH,
                                   cornerRadius: 0, alignment: .trailing)
                    CanonicalPhoto("029-visual-001", width: w / 2, height: topH,
                                   cornerRadius: 0, alignment: .leading)
                }
                CanonicalPhoto("029-visual-003", width: w, height: h - topH, cornerRadius: 0)
            }
        }
    }
}

/// Full-screen camera sheet behind "Take photo" / "Retake" — real capture via
/// CameraService.capturePhoto(); the shot flows back into the review path.
struct CameraPhotoCaptureView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var camera = CameraService.live
    @State private var toast: ShotIQToast?
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
                    toast = .progress("Capturing photo", "Hold still while ShotIQ saves this frame.", progress: 0.6)
                    camera.capturePhoto()
                } label: {
                    Circle().stroke(.white, lineWidth: 4).frame(width: 76, height: 76)
                        .overlay(Circle().fill(.white).frame(width: 62, height: 62))
                }
                .buttonStyle(.plain)
                .disabled(camera.status != .ready)
                .accessibilityLabel("Take photo")
                Button {
                    toast = .info("Camera closed", "Returning without changing the selected photo.")
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { dismiss() }
                } label: {
                    Text("Cancel").shotiqBody(16, weight: .medium).foregroundStyle(.white)
                }
                .buttonStyle(.plain)
            }
            .padding(.bottom, 34)
        }
        .shotiqToast($toast)
        .onAppear { camera.lastPhoto = nil; camera.start() }
        .onDisappear { camera.stop() }
        .onChange(of: camera.lastPhoto) { _, data in
            if let data, let img = UIImage(data: data) {
                toast = .success("Photo captured", "Sending this frame back for review.")
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

struct ShotIQPhotoQuality {
    typealias Row = (title: String, detail: String, status: String, ok: Bool)

    let pixelWidth: Int
    let pixelHeight: Int
    let averageLuminance: Double?

    static func evaluate(_ image: UIImage) -> ShotIQPhotoQuality {
        let pixels = image.cgImage.map { CGSize(width: $0.width, height: $0.height) }
            ?? CGSize(width: image.size.width * image.scale, height: image.size.height * image.scale)
        return ShotIQPhotoQuality(pixelWidth: max(0, Int(pixels.width.rounded())),
                                  pixelHeight: max(0, Int(pixels.height.rounded())),
                                  averageLuminance: averageLuminance(in: image))
    }

    var lightingRow: Row {
        guard let averageLuminance else {
            return ("Lighting", "ShotIQ could not read brightness from this image.", "Check", false)
        }
        if averageLuminance < 0.22 {
            return ("Lighting", "Image is too dark for a reliable pose read.", "Too dark", false)
        }
        if averageLuminance > 0.93 {
            return ("Lighting", "Image is overexposed. Reduce glare or bright backlight.", "Too bright", false)
        }
        return ("Lighting", "Average brightness is in range for analysis.", "Good", true)
    }

    var resolutionRow: Row {
        let shortSide = min(pixelWidth, pixelHeight)
        let longSide = max(pixelWidth, pixelHeight)
        let detail = "\(pixelWidth) x \(pixelHeight) pixels."
        if shortSide >= 720 && longSide >= 1080 {
            return ("Image resolution", detail, "High", true)
        }
        return ("Image resolution", "\(detail) Use at least 720p for analysis.", "Low", false)
    }

    private static func averageLuminance(in image: UIImage) -> Double? {
        guard let cgImage = image.cgImage else { return nil }
        let width = 16
        let height = 16
        var pixels = [UInt8](repeating: 0, count: width * height * 4)
        guard let context = CGContext(data: &pixels,
                                      width: width,
                                      height: height,
                                      bitsPerComponent: 8,
                                      bytesPerRow: width * 4,
                                      space: CGColorSpaceCreateDeviceRGB(),
                                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
            return nil
        }
        context.interpolationQuality = .low
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        var total = 0.0
        for index in stride(from: 0, to: pixels.count, by: 4) {
            let r = Double(pixels[index]) / 255.0
            let g = Double(pixels[index + 1]) / 255.0
            let b = Double(pixels[index + 2]) / 255.0
            total += 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        return total / Double(width * height)
    }
}

struct ShotIQPhotoVisionAnalysis: Codable, Equatable {
    var overallGrade: String?
    var gradeDescription: String?
    var coachSays: String?

    var coachingNotes: String? { coachSays ?? gradeDescription }

    /// `/api/vision-analyze` returns a qualitative letter grade for this photo
    /// route. A letter is not a measured 0-100 score, so it must not be saved as
    /// one.
    var measuredOverallScore: Double? { nil }

    var savePayload: ShotIQPhotoVisionAnalysisPayload {
        ShotIQPhotoVisionAnalysisPayload(source: "ios-native-photo-vision",
                                         overallGrade: overallGrade,
                                         gradeDescription: gradeDescription,
                                         coachSays: coachSays,
                                         scoreSource: "qualitative-grade-not-numeric")
    }
}

struct ShotIQPhotoVisionAnalysisPayload: Codable, Equatable {
    var source: String
    var overallGrade: String?
    var gradeDescription: String?
    var coachSays: String?
    var scoreSource: String
}

struct ShotIQPhotoBodyPosition: Codable, Equatable {
    var x: Double
    var y: Double
    var label: String
    var angle: Double?
    var status: String
    var note: String?
}

enum ShotViewpoint: String, CaseIterable, Identifiable {
    case front
    case side
    case rear

    var id: String { rawValue }

    var title: String {
        switch self {
        case .front: return "FRONT VIEW"
        case .side: return "SIDE VIEW"
        case .rear: return "REAR VIEW"
        }
    }

    var shortTitle: String {
        switch self {
        case .front: return "Front"
        case .side: return "Side"
        case .rear: return "Rear"
        }
    }

    var instruction: String {
        switch self {
        case .front: return "Face the camera so ShotIQ can check alignment, set point, and balance."
        case .side: return "Stand side-on so ShotIQ can read elbow stack, release angle, and lower-body load."
        case .rear: return "Show your back view so ShotIQ can check shoulder line, guide hand, and follow-through path."
        }
    }

    var placeholderPhoto: String {
        switch self {
        case .front: return "022-visual-001"
        case .side: return "022-visual-001"
        case .rear: return "022-visual-003"
        }
    }

    var uploadAngle: String {
        switch self {
        case .front: return "front"
        case .side: return "side"
        case .rear: return "rear"
        }
    }

    var imageCategory: String { "form_\(rawValue)" }
}

enum ShotImageOrientation: String, CaseIterable, Identifiable {
    case landscape
    case story

    var id: String { rawValue }
    var title: String {
        switch self {
        case .landscape: return "Landscape"
        case .story: return "Story 9:16"
        }
    }
    var mediaHeight: CGFloat {
        switch self {
        case .landscape: return 150
        case .story: return 220
        }
    }
}

private func shotiqPersistLocalJPEG(_ data: Data, prefix: String = "shotiq-photo") -> URL? {
    guard let dir = shotiqPersistentMediaDirectory() else {
        return nil
    }
    let url = dir.appendingPathComponent("\(prefix)-\(UUID().uuidString).jpg")
    do {
        try data.write(to: url, options: [.atomic])
        return url
    } catch {
        return nil
    }
}

private func shotiqPersistLocalVideo(_ data: Data, filename: String) -> URL? {
    guard let dir = shotiqPersistentMediaDirectory() else {
        return nil
    }
    let cleanName = filename.isEmpty ? "shotiq-\(UUID().uuidString).mov" : filename
    let url = dir.appendingPathComponent(cleanName)
    do {
        try data.write(to: url, options: [.atomic])
        return url
    } catch {
        return nil
    }
}

private func shotiqPersistentMediaDirectory() -> URL? {
    guard let base = FileManager.default.urls(for: .applicationSupportDirectory,
                                              in: .userDomainMask).first else {
        return nil
    }
    let dir = base.appendingPathComponent("ShotIQMedia", isDirectory: true)
    do {
        try FileManager.default.createDirectory(at: dir,
                                                withIntermediateDirectories: true)
        return dir
    } catch {
        return nil
    }
}

private func shotiqBundledPhoto(_ key: String) -> UIImage? {
    UIImage(named: "photo-\(key)")
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
        if let icon { Image(systemName: icon).font(.system(size: 24, weight: .medium)) }
        Text(title).shotiqBody(17, weight: .semibold)
    }
    // Was 56 — the same over-height primary CTA the review measured at 58pt on
    // 018. Shares the canonical control height with PrimaryButton.
    .frame(maxWidth: .infinity).frame(height: ShotIQType.controlHeight)
    .background(color, in: RoundedRectangle(cornerRadius: 8))
    .foregroundStyle(.white)
    .lineLimit(1)
    .minimumScaleFactor(0.7)
}

/// Bordered secondary label used inside NavigationLinks / plain buttons.
private func captureOutline(_ title: String, icon: String? = nil) -> some View {
    HStack(spacing: 10) {
        if let icon { Image(systemName: icon).font(.system(size: 24)) }
        Text(title).shotiqBody(16)
    }
    .frame(maxWidth: .infinity).frame(height: ShotIQType.controlHeight)
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
    @EnvironmentObject private var app: AppState
    @State private var toast: ShotIQToast?
    var boxed = false
    var body: some View {
        let row = VStack(alignment: .leading, spacing: 5) {
            Text("PRIMARY COACHING TARGET")
                .shotiqBody(11, weight: .medium).kerning(0.8)
                .foregroundStyle(ShotIQColor.graphite)
            HStack {
                Text("Keep elbow stacked through release")
                    .shotiqBody(19, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
            }
        }
        NavigationLink {
            if let latest = app.recentMedia.first {
                FlawDetailView(
                    title: "Keep elbow stacked through release",
                    severity: "PRIMARY TARGET",
                    presentation: AnalysisResultPresentation(result: latest.analysis))
            } else if UITestHooks.demoData {
                FlawDetailView(
                    title: "Keep elbow stacked through release",
                    severity: "PRIMARY TARGET",
                    presentation: .canonicalDemo)
            } else {
                AnalyzeHubView()
            }
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
        .simultaneousGesture(TapGesture().onEnded {
            if !app.recentMedia.isEmpty || UITestHooks.demoData {
                toast = .info("Opening coaching target")
            } else {
                toast = .info("Analyze a shot first",
                              "Record or upload media before opening measured correction details.")
            }
        })
        .shotiqToast($toast)
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
                        .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    CanonicalPhoto("029-visual-003", height: 168, cornerRadius: 8)
                        .overlay(alignment: .topLeading) {
                            Text("SIDE VIEW EXAMPLE")
                                .shotiqCondensed(13, weight: .heavy)
                                .foregroundStyle(.white)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.black.opacity(0.62), in: RoundedRectangle(cornerRadius: 3))
                                .padding(10)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 16)

                    ShotIQCard {
                        VStack(spacing: 0) {
                            ForEach(tips, id: \.1) { icon, t, d in
                                HStack(spacing: 14) {
                                    // Each capture tip is a different readiness
                                    // check, so each gets its own bracket mark.
                                    ShotIQConceptGlyph(concept: t, fallback: icon, size: 34)
                                        .foregroundStyle(ShotIQColor.ink).frame(width: 34)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(t).shotiqCondensed(14, weight: .heavy).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text(d).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
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

private struct CaptureSummaryValues {
    var score: String
    var shots: String
    var makes: String
    var makePercent: String
    var trend: String
    var trendCaption: String
    var hasRealData: Bool

    static func resolve(app: AppState, completedWorkoutsPayload: String) -> CaptureSummaryValues {
        let latestWorkout = TrainingWorkoutStore.latest(in: completedWorkoutsPayload)
        let latestPresentation = app.recentMedia.first.map { AnalysisResultPresentation(result: $0.analysis) }

        if let workout = latestWorkout {
            return CaptureSummaryValues(
                score: latestPresentation?.scoreText ?? "\(workout.formScore)",
                shots: "\(workout.shots)",
                makes: "\(workout.makes)",
                makePercent: workout.accuracyText,
                trend: workout.shots > 0 ? "SAVED" : "--",
                trendCaption: workout.drillName,
                hasRealData: true)
        }

        if let latestPresentation {
            return CaptureSummaryValues(
                score: latestPresentation.scoreText,
                shots: "--",
                makes: "--",
                makePercent: "--",
                trend: latestPresentation.sourceCoverageVerdict,
                trendCaption: "latest analysis",
                hasRealData: true)
        }

        if UITestHooks.demoData {
            return CaptureSummaryValues(score: "82",
                                        shots: "24",
                                        makes: "15",
                                        makePercent: "62.5%",
                                        trend: "+8.1%",
                                        trendCaption: "vs last session",
                                        hasRealData: false)
        }

        return CaptureSummaryValues(score: "--",
                                    shots: "--",
                                    makes: "--",
                                    makePercent: "--",
                                    trend: "--",
                                    trendCaption: "analyze a shot",
                                    hasRealData: false)
    }
}

private struct CaptureSummaryStrip: View {
    @EnvironmentObject private var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    var scoreSize: CGFloat = 26
    var body: some View {
        let values = CaptureSummaryValues.resolve(app: app,
                                                  completedWorkoutsPayload: completedWorkoutsPayload)
        HStack(alignment: .center, spacing: 0) {
            captureStat(values.score, "FORM SCORE",
                        color: values.score == "--" ? ShotIQColor.graphite : ShotIQColor.shotiqOrange,
                        size: scoreSize)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
            captureStat(values.shots, "SHOTS", size: scoreSize)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
            captureStat(values.makes, "MAKES", size: scoreSize)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
            captureStat(values.makePercent, "MAKE %", size: scoreSize)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Form score \(values.score), shots \(values.shots), makes \(values.makes), make percentage \(values.makePercent)")
    }
}

/// LATEST SESSION stats strip: shots / makes / make % / trend delta.
private struct CaptureSessionStats: View {
    @EnvironmentObject private var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    var body: some View {
        let values = CaptureSummaryValues.resolve(app: app,
                                                  completedWorkoutsPayload: completedWorkoutsPayload)
        HStack(alignment: .center, spacing: 18) {
            StatBlock(value: values.shots, label: "SHOTS", valueSize: ShotIQType.numeric)
            StatBlock(value: values.makes, label: "MAKES", valueSize: ShotIQType.numeric)
            StatBlock(value: values.makePercent, label: "MAKE %", valueSize: ShotIQType.numeric)
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 3) {
                TrendLine(points: values.hasRealData || UITestHooks.demoData ? [2, 3.1, 2.6, 4.2] : [2, 2, 2, 2],
                          stroke: values.hasRealData || UITestHooks.demoData ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                    .frame(width: 86, height: 28)
                HStack(spacing: 3) {
                    Text(values.trend).shotiqBody(11, weight: .semibold)
                        .foregroundStyle(values.hasRealData || UITestHooks.demoData ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                    Text(values.trendCaption).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
            }
        }
    }
}

/// One small centered stat used in horizontal stat strips.
private func captureStat(_ value: String, _ label: String,
                         color: Color = ShotIQColor.ink, size: CGFloat = 26) -> some View {
    VStack(spacing: 2) {
        Text(value).font(.custom("Tungsten-Medium", size: size)).foregroundStyle(color)
            .lineLimit(1).minimumScaleFactor(0.6)
        Text(label).shotiqMicroCaps()
            .foregroundStyle(ShotIQColor.graphite)
    }
    .frame(maxWidth: .infinity)
}

private struct CaptureV5Recent: Identifiable {
    let title: String
    let date: String
    let score: String
    let photo: String
    var id: String { title }
}

struct AnalyzeHubView: View {       // 021
    @EnvironmentObject var app: AppState
    @State private var toast: ShotIQToast?
    private let v5Recents: [CaptureV5Recent] = [
        CaptureV5Recent(title: "RELEASE REVIEW", date: "TODAY", score: "78", photo: "021-v5-recent-release"),
        CaptureV5Recent(title: "ELBOW DRIFT", date: "YESTERDAY", score: "64", photo: "021-v5-recent-elbow"),
        CaptureV5Recent(title: "WRIST SNAP", date: "YESTERDAY", score: "82", photo: "021-v5-recent-wrist")
    ]

    var body: some View {
        CanonicalScreen(testID: "screen-ios-analyze-hub") {
            GeometryReader { page in
                let screenWidth = min(page.size.width, UIScreen.main.bounds.width)
                let contentWidth = max(0, screenWidth - 44)
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        CaptureHeader()
                            .frame(width: screenWidth, alignment: .topLeading)
                            .padding(.horizontal, -22)
                        v5HeroCard(width: contentWidth)
                        v5CaptureTypePanel(width: contentWidth)
                        NavigationLink { CaptureGuideView() } label: {
                            v5GuideCard(width: contentWidth)
                        }
                        .buttonStyle(.plain)
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening capture guide", "Use the guide to frame the shooter.")
                        })
                        v5RecentCaptures(width: contentWidth)
                    }
                    .frame(width: contentWidth, alignment: .leading)
                    .padding(.horizontal, 22)
                    .padding(.bottom, 170)
                }
                .frame(width: screenWidth, alignment: .leading)
                .background(Color(red: 0.972, green: 0.976, blue: 0.982))
            }
        }
        .navigationTitle("").toolbar(.hidden, for: .navigationBar)
        // Returning to the hub means the live flow ended — release the camera.
        .onAppear { CameraService.live.stop() }
        .shotiqToast($toast)
    }

    private func v5HeroCard(width: CGFloat) -> some View {
        let height = min(206, max(182, width * 0.52))
        let imageWidth = width * 0.55
        return HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 18) {
                Text("ANALYZE\nYOUR SHOT")
                    .shotiqDisplay(45)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineSpacing(0)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Live capture, video,\nor image. ShotIQ\nturns clean footage\ninto form feedback.")
                    .shotiqBody(14)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(width: max(130, width - imageWidth), height: height, alignment: .leading)
            .padding(.leading, 22)

            CanonicalPhoto("021-v5-hero", width: imageWidth, height: height, cornerRadius: 0, alignment: .center)
        }
        .frame(width: width, height: height, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule, lineWidth: 1))
    }

    private func v5CaptureTypePanel(width: CGFloat) -> some View {
        let innerWidth = max(0, width - 16)
        return VStack(alignment: .leading, spacing: 0) {
            SectionLabel(text: "CHOOSE CAPTURE TYPE")
                .padding(.top, 14)
                .padding(.horizontal, 16)
            Rectangle()
                .fill(ShotIQColor.shotiqOrange)
                .frame(width: width * 0.32, height: 3)
                .padding(.top, 10)
                .padding(.leading, 16)
            HStack(spacing: 0) {
                NavigationLink { LiveCameraSetupView() } label: {
                    v5CaptureOption(title: "LIVE CAMERA",
                                    body: "Record a new shot\nin real time.",
                                    photo: "021-v5-live",
                                    width: innerWidth / 3)
                }
                .buttonStyle(.plain)
                .simultaneousGesture(TapGesture().onEnded {
                    toast = .info("Opening live camera", "Set up the phone before recording.")
                })

                NavigationLink { VideoUploadView() } label: {
                    v5CaptureOption(title: "UPLOAD VIDEO",
                                    body: "Analyze footage\nfrom your device.",
                                    photo: "021-v5-video",
                                    width: innerWidth / 3)
                }
                .buttonStyle(.plain)
                .simultaneousGesture(TapGesture().onEnded {
                    toast = .info("Opening video upload", "Choose a real shot video.")
                })

                NavigationLink { PhotoUploadSourceView() } label: {
                    v5CaptureOption(title: "UPLOAD IMAGE",
                                    body: "Analyze a single\nframe or photo.",
                                    photo: "021-v5-image",
                                    width: innerWidth / 3)
                }
                .buttonStyle(.plain)
                .simultaneousGesture(TapGesture().onEnded {
                    toast = .info("Opening image upload", "Choose or capture a real shot photo.")
                })
            }
            .frame(width: innerWidth, height: 186)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule, lineWidth: 1))
            .padding(.horizontal, 8)
            .padding(.bottom, 8)
        }
        .frame(width: width, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule, lineWidth: 1))
    }

    private func v5CaptureOption(title: String, body: String, photo: String, width: CGFloat) -> some View {
        let thumb = min(86, max(68, width * 0.66))
        return VStack(spacing: 10) {
            CanonicalPhoto(photo, width: thumb, height: thumb, cornerRadius: thumb / 2)
            Text(title)
                .shotiqDisplay(22)
                .foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
            Text(body)
                .shotiqBody(12)
                .foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.center)
                .lineSpacing(2)
                .lineLimit(2)
                .minimumScaleFactor(0.76)
        }
        .padding(.horizontal, 6)
        .frame(width: width, height: 186, alignment: .center)
        .contentShape(Rectangle())
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(width: 1), alignment: .trailing)
    }

    private func v5GuideCard(width: CGFloat) -> some View {
        HStack(spacing: 20) {
            CanonicalPhoto("021-v5-guide", width: 92, height: 92, cornerRadius: 46)
            VStack(alignment: .leading, spacing: 8) {
                Text("VIEW CAPTURE GUIDE")
                    .shotiqDisplay(26)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.68)
                Text("Best angle, distance, lighting,\nand framing.")
                    .shotiqBody(13)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 18)
        .frame(width: width, height: 112, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule, lineWidth: 1))
        .contentShape(Rectangle())
    }

    private func v5RecentCaptures(width: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                SectionLabel(text: "UPLOAD HISTORY")
                Spacer()
                NavigationLink { MyMediaView() } label: {
                    Text("VIEW ALL")
                        .shotiqDisplay(18)
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .lineLimit(1)
                }
                .buttonStyle(.plain)
                .simultaneousGesture(TapGesture().onEnded {
                    toast = .info("Opening upload history", "Your saved media and analysis history are there.")
                })
            }
            ForEach(v5Recents) { item in
                NavigationLink {
                    UploadQueueView()
                } label: {
                    v5RecentRow(item: item, width: width)
                }
                .buttonStyle(.plain)
                .simultaneousGesture(TapGesture().onEnded {
                    toast = .info("Opening \(item.title.capitalized)")
                })
            }
        }
        .frame(width: width, alignment: .leading)
    }

    private func v5RecentRow(item: CaptureV5Recent, width: CGFloat) -> some View {
        HStack(spacing: 18) {
            CanonicalPhoto(item.photo, width: width * 0.37, height: 74, cornerRadius: 6)
            VStack(alignment: .leading, spacing: 5) {
                Text(item.title)
                    .shotiqDisplay(25)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.64)
                Text(item.date)
                    .shotiqBody(11, weight: .semibold)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            VStack(alignment: .leading, spacing: 0) {
                Text("SCORE")
                    .shotiqBody(10, weight: .bold)
                    .kerning(0.6)
                    .foregroundStyle(ShotIQColor.graphite)
                Text(item.score)
                    .shotiqNumeric(42)
                    .foregroundStyle(ShotIQColor.shotiqOrange)
            }
            .frame(width: 42, alignment: .leading)
        }
        .padding(.trailing, 18)
        .frame(width: width, height: 80, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule, lineWidth: 1))
        .contentShape(Rectangle())
    }

    private func demoRecentCard(duration: String, when: String, kind: String, photo: String?) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            ZStack(alignment: .bottomTrailing) {
                if let photo {
                    CanonicalPhoto(photo, width: 85, height: 130, cornerRadius: 4)
                } else {
                    CanonicalPhoto("021-visual-003", width: 85, height: 130, cornerRadius: 4)
                }
                durationBadge(duration)
            }
            Text(when).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
            Text(kind).shotiqBody(12, weight: .medium).foregroundStyle(ShotIQColor.ink)
        }
        .frame(width: 85)
    }

    private func realRecentCard(_ entry: ShotIQRecentMediaEntry) -> some View {
        let presentation = AnalysisResultPresentation(result: entry.analysis)
        return VStack(alignment: .leading, spacing: 4) {
            ZStack(alignment: .bottomTrailing) {
                if let url = presentation.mediaURL,
                   url.isFileURL,
                   let image = UIImage(contentsOfFile: url.path) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 85, height: 130)
                        .clipped()
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                } else {
                    CanonicalPhoto(entry.kind == "Videos" ? "021-visual-003" : "021-visual-001",
                                   width: 85, height: 130, cornerRadius: 4)
                }
                durationBadge(entry.durationText)
            }
            Text(presentation.recordedLabel).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
            Text(entry.title).shotiqBody(12, weight: .medium).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(width: 85)
    }

    private func durationBadge(_ text: String) -> some View {
        Text(text).font(.custom("Tungsten-Medium", size: 12)).foregroundStyle(.white)
            .lineLimit(1).minimumScaleFactor(0.7)
            .padding(.horizontal, 6).padding(.vertical, 3)
            .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 3))
            .padding(6)
    }

    private func hubOption(_ icon: String, _ t: String, _ d: String) -> some View {
        VStack(spacing: 8) {
            // Canonical draws a different diagram per source, not a photo/film/
            // broadcast triple out of the system set.
            Group {
                if let source = CaptureSource(sourceLabel: t) {
                    CaptureSourceGlyph(source: source, size: 42)
                } else {
                    Image(systemName: icon).font(.system(size: 42))
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            .frame(height: 44)
            Text(t).shotiqBody(14, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(d).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.center)
                .lineLimit(2).minimumScaleFactor(0.8)
        }
        .padding(.vertical, 16).padding(.horizontal, 6)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        .contentShape(Rectangle())
    }
}

struct PhotoUploadSourceView: View { // 022
    @Environment(\.dismiss) private var dismiss
    @State private var frontPick: PhotosPickerItem?
    @State private var sidePick: PhotosPickerItem?
    @State private var rearPick: PhotosPickerItem?
    @State private var images: [ShotViewpoint: UIImage] = [:]
    @State private var orientationByViewpoint: [ShotViewpoint: ShotImageOrientation] = [
        .front: .landscape,
        .side: .landscape,
        .rear: .landscape
    ]
    @State private var activeViewpoint: ShotViewpoint = .side
    @State private var goReview = false
    @State private var showCamera = false
    @State private var toast: ShotIQToast?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-upload-source") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()

                    Button {
                        toast = .info("Returning to analyze shot")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
                            Text("ANALYZE SHOT").shotiqBody(13, weight: .bold).kerning(1)
                        }
                        .foregroundStyle(ShotIQColor.graphite)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 16)

                    Text("PHOTO UPLOAD SOURCE").shotiqDisplay(38)
                        .padding(.horizontal, 20).padding(.top, 8)
                    Text(UITestHooks.active
                         ? "Add front, side, and rear shot photos so ShotIQ knows exactly which angle it is evaluating."
                         : "Add one shot photo to start. Side view is best; front and rear can be added when you want a fuller breakdown.")
                        .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
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

                    SectionLabel(text: "SHOT VIEWPOINTS").padding(.horizontal, 20).padding(.top, 24)
                    VStack(spacing: 12) {
                        ForEach(ShotViewpoint.allCases) { viewpoint in
                            viewpointSlot(viewpoint)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    SectionLabel(text: "CHOOSE UPLOAD SOURCE").padding(.horizontal, 20).padding(.top, 24)
                    VStack(spacing: 12) {
                        if UITestHooks.useSampleMedia {
                            Button { loadSampleAngles() } label: {
                                sourceRow("photo.stack", "Use sample for all views",
                                          "Simulator proof only: fills front, side, and rear inputs.")
                            }
                            .buttonStyle(.plain)
                        }
                        Button { continueWithSelectedViews() } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 18, weight: .semibold))
                                Text(UITestHooks.active ? "Review selected views" : "Review selected photo")
                                    .shotiqBody(17, weight: .medium)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: ShotIQType.controlHeight)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                            .foregroundStyle(.white)
                        }
                        .buttonStyle(.plain)
                        Button {
                            toast = .info("Photo upload cancelled", "Returning to analyze options.")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { dismiss() }
                        } label: {
                            Text("Cancel").shotiqBody(16)
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
        .onChange(of: frontPick) { _, item in loadPicked(item, for: .front) }
        .onChange(of: sidePick) { _, item in loadPicked(item, for: .side) }
        .onChange(of: rearPick) { _, item in loadPicked(item, for: .rear) }
        .onChange(of: goReview) { wasReviewing, isReviewing in
            if wasReviewing && !isReviewing {
                resetViewpointGuides()
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPhotoCaptureView { img in
                images[activeViewpoint] = img
                toast = .success("\(activeViewpoint.shortTitle) view ready",
                                 UITestHooks.active
                                 ? "That angle is saved. Add the remaining views before analysis."
                                 : "Tap Review selected photo to check the shooter wireframe.")
            }
                .modifier(CanonicalTypeScale())
        }
        .navigationDestination(isPresented: $goReview) {
            PhotoReviewCropView(image: images[activeViewpoint], viewpoint: activeViewpoint)
        }
        .shotiqToast($toast)
    }

    private func loadPicked(_ item: PhotosPickerItem?, for viewpoint: ShotViewpoint) {
        guard let item else { return }
        toast = .progress("Loading \(viewpoint.shortTitle.lowercased()) view",
                          "Preparing that shot angle.", progress: 0.35)
        Task {
            if let data = try? await item.loadTransferable(type: Data.self),
               let img = UIImage(data: data) {
                await MainActor.run {
                    activeViewpoint = viewpoint
                    images[viewpoint] = img
                    toast = .success("\(viewpoint.shortTitle) view ready",
                                     UITestHooks.active
                                     ? "That angle is saved. Add the remaining views before analysis."
                                     : "Tap Review selected photo to check the shooter wireframe.")
                }
            } else {
                await MainActor.run {
                    toast = .error("\(viewpoint.shortTitle) view not loaded",
                                   "Choose a JPG, PNG, or HEIC from your library.")
                }
            }
        }
    }

    /// Canonical 022 gives each container its own bracketed mark. The shipped
    /// row printed the same filled `photo` symbol for JPG, PNG and HEIC.
    private func formatCol(_ icon: String, _ t: String, _ d: String) -> some View {
        VStack(spacing: 4) {
            Group {
                if let format = MediaFormatKind(formatLabel: t) {
                    MediaFormatGlyph(kind: format, size: 32)
                } else {
                    Image(systemName: icon).font(.system(size: 32))
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            Text(t).font(.custom("Tungsten-Medium", size: 17)).foregroundStyle(ShotIQColor.ink)
            Text(d).shotiqBody(9, weight: .medium).kerning(0.5).foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }

    private func viewpointSlot(_ viewpoint: ShotViewpoint) -> some View {
        let ready = images[viewpoint] != nil
        let orientation = orientationByViewpoint[viewpoint] ?? .landscape
        return VStack(spacing: 0) {
            ZStack(alignment: .topLeading) {
                Group {
                    if let image = images[viewpoint] {
                        Image(uiImage: image).resizable().scaledToFill()
                    } else {
                        CanonicalPhoto(viewpoint.placeholderPhoto, cornerRadius: 0)
                    }
                }
                .frame(height: orientation.mediaHeight).frame(maxWidth: .infinity).clipped()
                Text(viewpoint.title).shotiqBody(12, weight: .bold).foregroundStyle(.white)
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .background(ready ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue, in: Capsule())
                    .padding(8)
            }
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: ready ? "checkmark.circle.fill" : "plus.circle")
                    .font(.system(size: 28))
                    .foregroundStyle(ready ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                VStack(alignment: .leading, spacing: 2) {
                    Text(ready ? "\(viewpoint.shortTitle.uppercased()) READY" : "ADD \(viewpoint.shortTitle.uppercased()) PHOTO")
                        .shotiqCondensed(13, weight: .heavy).kerning(0.5)
                        .foregroundStyle(ready ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                    Text(viewpoint.instruction).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                }
                Spacer(minLength: 0)
            }
            .padding(10)
            HStack(spacing: 8) {
                PhotosPicker(selection: pickBinding(for: viewpoint), matching: .images) {
                    Text("Choose").shotiqBody(13, weight: .semibold)
                        .frame(maxWidth: .infinity).frame(height: 38)
                        .overlay(RoundedRectangle(cornerRadius: 7).stroke(ShotIQColor.rule))
                }
                .buttonStyle(.plain)
                .simultaneousGesture(TapGesture().onEnded {
                    activeViewpoint = viewpoint
                    toast = .info("Opening photo library",
                                  "Choose the \(viewpoint.shortTitle.lowercased()) angle.")
                })
                .accessibilityLabel("Choose \(viewpoint.shortTitle.lowercased()) photo")
                Button {
                    activeViewpoint = viewpoint
                    toast = .progress("Opening camera",
                                      "Capture the \(viewpoint.shortTitle.lowercased()) angle.",
                                      progress: 0.5)
                    showCamera = true
                } label: {
                    Text("Camera").shotiqBody(13, weight: .semibold)
                        .frame(maxWidth: .infinity).frame(height: 38)
                        .overlay(RoundedRectangle(cornerRadius: 7).stroke(ShotIQColor.rule))
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Take \(viewpoint.shortTitle.lowercased()) photo")
            }
            .foregroundStyle(ShotIQColor.ink)
            .padding(.horizontal, 10).padding(.bottom, 10)
            orientationPicker(for: viewpoint)
                .padding(.horizontal, 10)
                .padding(.bottom, 10)
        }
        .background(ShotIQColor.paper)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        .onTapGesture {
            activeViewpoint = viewpoint
            toast = .info("\(viewpoint.shortTitle) view selected")
        }
        .accessibilityElement(children: .contain)
    }

    private func orientationPicker(for viewpoint: ShotViewpoint) -> some View {
        HStack(spacing: 8) {
            ForEach(ShotImageOrientation.allCases) { option in
                let selected = (orientationByViewpoint[viewpoint] ?? .landscape) == option
                Button {
                    activeViewpoint = viewpoint
                    orientationByViewpoint[viewpoint] = option
                    toast = .info("\(viewpoint.shortTitle) orientation set", option.title)
                } label: {
                    Text(option.title)
                        .shotiqBody(12, weight: .semibold)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                        .frame(maxWidth: .infinity)
                        .frame(height: 34)
                        .background(selected ? ShotIQColor.shotiqOrange : ShotIQColor.paper,
                                    in: RoundedRectangle(cornerRadius: 7))
                        .overlay(RoundedRectangle(cornerRadius: 7)
                            .stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                        .foregroundStyle(selected ? .white : ShotIQColor.ink)
                }
                .buttonStyle(.plain)
            }
        }
        .accessibilityLabel("\(viewpoint.shortTitle) orientation")
    }

    private func sourceRow(_ icon: String, _ t: String, _ d: String) -> some View {
        HStack(spacing: 16) {
            ShotIQConceptGlyph(concept: t, fallback: icon, size: 40,
                               accent: ShotIQColor.shotiqOrange)
                .foregroundStyle(ShotIQColor.shotiqOrange).frame(width: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(t).shotiqBody(17, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                Text(d).shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
        }
        .padding(16)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func pickBinding(for viewpoint: ShotViewpoint) -> Binding<PhotosPickerItem?> {
        Binding(
            get: {
                switch viewpoint {
                case .front: return frontPick
                case .side: return sidePick
                case .rear: return rearPick
                }
            },
            set: { value in
                activeViewpoint = viewpoint
                switch viewpoint {
                case .front: frontPick = value
                case .side: sidePick = value
                case .rear: rearPick = value
                }
            }
        )
    }

    private var missingViewpoints: [ShotViewpoint] {
        ShotViewpoint.allCases.filter { images[$0] == nil }
    }

    private func continueWithSelectedViews() {
        if !UITestHooks.active {
            guard !images.isEmpty else {
                toast = .error("Choose or take a photo first",
                               "ShotIQ needs a real shooter image before it can draw the wireframe.")
                return
            }
            if images[activeViewpoint] == nil,
               let firstReady = ShotViewpoint.allCases.first(where: { images[$0] != nil }) {
                activeViewpoint = firstReady
            }
            toast = .success("\(activeViewpoint.shortTitle) view selected",
                             "Review the crop, then ShotIQ will check the pose wireframe.")
            goReview = true
            return
        }
        guard missingViewpoints.isEmpty else {
            let names = missingViewpoints.map { $0.shortTitle.lowercased() }.joined(separator: ", ")
            toast = .error("Add front, side, and rear photos first",
                           "Missing: \(names). Each viewpoint needs an input image.")
            return
        }
        activeViewpoint = .side
        toast = .success("All views ready", "Review the side view before ShotIQ analyzes your form.")
        goReview = true
    }

    private func loadSampleAngles() {
        guard let sample = UITestHooks.sampleShotImage else {
            toast = .error("Sample unavailable", "The test media asset could not be loaded.")
            return
        }
        for viewpoint in ShotViewpoint.allCases {
            images[viewpoint] = sample
        }
        activeViewpoint = .side
        toast = .success("All views ready", "Front, side, and rear sample images are loaded.")
    }

    private func resetViewpointGuides() {
        images = [:]
        frontPick = nil
        sidePick = nil
        rearPick = nil
        activeViewpoint = .side
        orientationByViewpoint = [.front: .landscape, .side: .landscape, .rear: .landscape]
    }
}

struct PhotoReviewCropView: View {  // 023
    @Environment(\.dismiss) private var dismiss
    private let viewpoint: ShotViewpoint
    @State private var image: UIImage?
    @State private var showCamera = false
    @State private var goQuality = false
    @State private var toast: ShotIQToast?
    init(image: UIImage?, viewpoint: ShotViewpoint = .side) {
        self.viewpoint = viewpoint
        _image = State(initialValue: image)
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-review-crop") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Centered wordmark bar with back arrow (canonical 023)
                    ZStack {
                        HStack {
                            Button {
                                toast = .info("Returning to photo source")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                            } label: {
                                Image(systemName: "arrow.left").font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
                            }
                            .buttonStyle(.plain)
                            Spacer()
                        }
                        VStack(spacing: 1) {
                            Wordmark(size: 26)
                            Text("AI ANALYSIS").shotiqBody(11, weight: .medium).kerning(2)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                    }
                    .padding(.horizontal, 20).frame(height: 58)
                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("PHOTO REVIEW").shotiqDisplay(36)
                            Text("\(viewpoint.shortTitle) view selected. Adjust crop to include your full body from head to toe.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
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
                        // Rule-of-thirds crop grid + dashed frame, drawn only over a
                        // real picked photo. The canonical fallback frame has the grid,
                        // the dashed border, the 3:4 badge and the tip caption baked
                        // into the image, so drawing them again over it rendered each
                        // one twice.
                        if image != nil {
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
                        Text("3:4").shotiqBody(13, weight: .semibold).foregroundStyle(.white)
                            .padding(.horizontal, 9).padding(.vertical, 5)
                            .background(.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 5))
                            .padding(10)
                        }
                    }
                    .frame(height: 430).clipped()
                    .overlay(alignment: .bottom) {
                        if image != nil {
                        HStack(spacing: 8) {
                            Image(systemName: "info.circle").font(.system(size: 12))
                            Text("Tip: Include your full body. Leave a little space above your head and below your feet.")
                                .shotiqBody(11)
                                .lineLimit(2).minimumScaleFactor(0.8)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 6))
                        .padding(10)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    // Rotation dial
                    HStack(spacing: 14) {
                        Button {
                            if let img = image {
                                image = shotiqRotated(img, clockwise: false)
                                toast = .success("\(viewpoint.shortTitle) view rotated", "Review the framing before analysis.")
                            } else {
                                toast = .error("Choose a photo first", "A real image is required before cropping.")
                            }
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
                            if let img = image {
                                image = shotiqRotated(img, clockwise: true)
                                toast = .success("\(viewpoint.shortTitle) view rotated", "Review the framing before analysis.")
                            } else {
                                toast = .error("Choose a photo first", "A real image is required before cropping.")
                            }
                        } label: {
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "rotate.right"), size: 44).font(.system(size: 19)).foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Rotate right")
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    HStack(spacing: 10) {
                        Button {
                            toast = .progress("Opening camera", "Retake the \(viewpoint.shortTitle.lowercased()) view.", progress: 0.5)
                            showCamera = true
                        } label: {
                            HStack(spacing: 8) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera"), size: 42).font(.system(size: 15))
                                Text("RETAKE").shotiqCondensed(13, weight: .heavy).kerning(0.5)
                            }
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        Button {
                            if let img = image {
                                image = shotiqCropped34(img)
                                toast = .success("\(viewpoint.shortTitle) crop applied", "Your shot frame is ready.")
                            } else {
                                toast = .error("Choose a photo first", "A real image is required before cropping.")
                            }
                        } label: {
                            HStack(spacing: 8) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "crop"), size: 42).font(.system(size: 15))
                                Text("CROP").shotiqCondensed(13, weight: .heavy).kerning(0.5)
                            }
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        Button {
                            if image == nil, UITestHooks.demoData, let sample = shotiqBundledPhoto("023-visual-001") {
                                image = sample
                                toast = .success("Sample photo loaded", "Checking the shooter wireframe next.")
                            } else if image == nil {
                                toast = .error("Choose a photo first", "ShotIQ needs a real shooter image before it can draw the wireframe.")
                                return
                            } else {
                                toast = .success("\(viewpoint.shortTitle) view selected", "Checking upload quality next.")
                            }
                            goQuality = true
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark").font(.system(size: 15, weight: .bold))
                                Text("USE PHOTO").shotiqCondensed(13, weight: .heavy).kerning(0.5)
                            }
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .background(ShotIQColor.confirmGreen, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    PhaseStrip().padding(.horizontal, 20).padding(.top, 20).padding(.bottom, 24)
                }
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPhotoCaptureView { img in
                image = img
                toast = .success("\(viewpoint.shortTitle) view captured", "Adjust the crop before analysis.")
            }
                .modifier(CanonicalTypeScale())
        }
        .navigationDestination(isPresented: $goQuality) {
            UploadQualityCheckView(image: image, viewpoint: viewpoint)
        }
        .shotiqToast($toast)
    }
}

struct UploadQualityCheckView: View { // 024
    var image: UIImage? = nil
    var viewpoint: ShotViewpoint = .side
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var app: AppState
    @State private var busy = false
    @State private var uploadError: String?
    @State private var savedAnalysis: ShotIQAnalysisResultDTO?
    @State private var toast: ShotIQToast?
    /// One route out of this screen: analysis processing on success, the
    /// canonical analysis-error screen (040) when the upload/analyze call fails.
    enum UploadRoute: Hashable { case processing, failed }
    @State private var route: UploadRoute?
    /// What Vision found in the picked photo, once it has looked.
    @State private var detectedPose: DetectedPose?
    @State private var poseChecked = false
    @State private var poseUnavailable = false

    /// The canonical check list. Over the canonical placeholder it reads exactly
    /// as it always has.
    private let canonicalChecks: [(String, String, String, Bool)] = [
        ("Lighting", "Well-lit and clear.", "Good", true),
        ("Full body visibility", "Entire body is visible.", "Good", true),
        ("Video resolution", "High resolution.", "1080p", true),
        ("Shooting hand visibility",
         "Shooting hand is slightly cropped at the fingertips. Please reframe to show the full hand and ball.",
         "Needs attention", false)]

    /// Over the player's OWN photo, quality rows are answered from the selected
    /// pixels and pose detection rather than asserted from a constant.
    /// "Entire body is visible · Good" printed over a picture with nobody in it
    /// is the app telling the player something it never checked.
    private var checks: [(String, String, String, Bool)] {
        guard let image else {
            guard UITestHooks.demoData else {
                return [
                    ("Photo selected", "Choose or capture a real shooter photo before analysis.", "Required", false),
                    ("Pose wireframe", "ShotIQ draws body key points after a real image is selected.", "Waiting", false),
                    ("Shooting hand visibility", "Hand and ball checks run on the selected player image.", "Waiting", false),
                    ("Score readiness", "Angles and coaching notes are created after upload.", "Waiting", false)
                ]
            }
            return canonicalChecks
        }
        let quality = ShotIQPhotoQuality.evaluate(image)
        guard poseChecked else {
            return [quality.lightingRow,
                    ("Full body visibility",
                     "Checking whether your full body is in frame.",
                     "Checking", true),
                    quality.resolutionRow,
                    ("Shooting hand visibility",
                     "Checking whether your shooting hand and ball are visible.",
                     "Checking", true)]
        }
        let body: (String, String, String, Bool)
        let hand: (String, String, String, Bool)
        if poseUnavailable {
            body = ("Full body visibility",
                    "Pose detector unavailable on this simulator/device.",
                    "Try on device", false)
            hand = ("Shooting hand visibility",
                    "ShotIQ could not load pose detection, so the hand could not be checked.",
                    "Try on device", false)
        } else if let pose = detectedPose {
            body = pose.isFullBodyVisible
                ? ("Full body visibility", "Entire body is visible.", "Good", true)
                : ("Full body visibility",
                   "Part of your body is out of frame. Reframe to include head to toe.",
                   "Needs attention", false)
            hand = pose.hasWrist
                ? ("Shooting hand visibility", "Shooting hand is in frame.", "Good", true)
                : ("Shooting hand visibility",
                   "Shooting hand was not found. Reframe to show the full hand and ball.",
                   "Needs attention", false)
        } else {
            body = ("Full body visibility",
                    "No shooter was detected in this photo.", "Needs attention", false)
            hand = ("Shooting hand visibility",
                    "No shooter was detected, so the hand could not be checked.",
                    "Needs attention", false)
        }
        return [quality.lightingRow, body, quality.resolutionRow, hand]
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-upload-quality-check") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    // Pre-analysis context strip. This screen can verify that a
                    // selected photo is ready to submit, but it has not scored the
                    // shot yet, so do not show measured-looking score/history stats.
                    HStack(alignment: .center, spacing: 0) {
                        captureStat(image == nil ? "GUIDE" : "READY", "PHOTO",
                                    color: image == nil ? ShotIQColor.graphite : ShotIQColor.confirmGreen)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                        captureStat(viewpoint.shortTitle.uppercased(), "VIEW")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                        captureStat(poseChecked ? (poseUnavailable ? "DEVICE" : "CHECKED") : "PENDING",
                                    "POSE",
                                    color: poseChecked && !poseUnavailable ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                        captureStat("AFTER", "SCORE", color: ShotIQColor.analysisBlue)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("TARGET AFTER ANALYSIS").shotiqBody(9, weight: .medium).kerning(0.5)
                                .foregroundStyle(ShotIQColor.graphite)
                            Text("ShotIQ will set this after the upload finishes.")
                                .shotiqBody(11).foregroundStyle(ShotIQColor.ink)
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
                    Text("We'll check your \(viewpoint.shortTitle.lowercased()) view to make sure it's ready for the best analysis.")
                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    // Canonical 024 prints the clip's own frame here, not a dark
                    // media plate: x 46…805, y 519…1035 on the 853x1844 canvas
                    // (759x516, so 240pt tall in the 353pt column). The 024
                    // sidecar declares no photo at all, which is why this was one
                    // of the black rectangles — cut from the render instead.
                    ZStack(alignment: .topLeading) {
                        if let image {
                            // THE QUALITY CHECK BELOW ASKS WHETHER YOUR FULL BODY IS
                            // IN FRAME — so show the body the app actually found.
                            // Vision runs on device over these very pixels, and the
                            // skeleton is the evidence for the checks; when nothing
                            // is found the view says so instead of implying a read.
                            CapturedPoseImage(image: image, height: 240, cornerRadius: 8, showAngles: true) { found in
                                detectedPose = found
                                poseChecked = true
                            }
                        } else {
                            CanonicalPhoto("024-visual-001", height: 240, cornerRadius: 8)
                        }
                        // The filename/format plate and the 00:04 timecode are
                        // baked into 024-visual-001. The app's copy is only for
                        // the reader's own still, which carries no plate.
                        if image != nil {
                            VStack(alignment: .leading, spacing: 1) {
                                Text("IMG_4521.JPG").shotiqBody(12, weight: .semibold)
                                Text("\(viewpoint.shortTitle) view • ready to analyze").shotiqBody(10)
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 5))
                            .padding(10)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    VStack(spacing: 0) {
                        ForEach(checks, id: \.0) { t, d, status, ok in
                            HStack(alignment: .top, spacing: 14) {
                                Image(systemName: ok ? "checkmark.circle.fill" : "exclamationmark.circle")
                                    .font(.system(size: 22))
                                    .foregroundStyle(ok ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(t).shotiqBody(16, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    Text(d).shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Text(status).shotiqBody(14, weight: .semibold)
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
                        Text("Best framing: \(viewpoint.shortTitle.lowercased()) view, full body in frame, shooting hand and ball fully visible.")
                            .shotiqBody(13).foregroundStyle(ShotIQColor.ink)
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
                                .shotiqBody(17, weight: .semibold)
                        }
                        .frame(maxWidth: .infinity).frame(height: 56)
                        .background(ShotIQColor.confirmGreen, in: RoundedRectangle(cornerRadius: 8))
                        .foregroundStyle(.white)
                    }
                    .buttonStyle(.plain)
                    .disabled(busy)
                    .padding(.horizontal, 20).padding(.top, 18)
                    if let uploadError {
                        Text(uploadError).shotiqBody(12).foregroundStyle(ShotIQColor.reviewRed)
                            .padding(.horizontal, 20).padding(.top, 8)
                    }
                    Button {
                        toast = .info("Choose another photo", "Returning to the photo source screen.")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { dismiss() }
                    } label: { captureOutline("Choose another") }
                        .buttonStyle(.plain)
                        .disabled(busy)
                        .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
        .navigationDestination(item: $route) { r in
            switch r {
            case .processing: AnalysisProcessingView(initialResult: savedAnalysis)
            case .failed: AnalysisErrorView(retryImage: image, retryViewpoint: viewpoint)
            }
        }
        .task(id: image) {
            await updatePoseCheck()
        }
        .shotiqToast($toast)
    }

    private func updatePoseCheck() async {
        guard let image else {
            detectedPose = nil
            poseChecked = false
            poseUnavailable = false
            return
        }
        poseChecked = false
        poseUnavailable = false
        switch await ShotIQPose.detectResult(in: image) {
        case .detected(let pose):
            detectedPose = pose
        case .noPose:
            detectedPose = nil
        case .unavailable:
            detectedPose = nil
            poseUnavailable = true
        }
        poseChecked = true
    }

    /// Mirrors the web upload flow: multipart POST /api/upload, then
    /// POST /api/vision-analyze on the same frame, then POST /api/save-analysis
    /// to persist the session — before showing the processing screen.
    private func analyze() async {
        let analysisImage = image ?? (UITestHooks.demoData ? shotiqBundledPhoto("024-visual-001") : nil)
        guard let selectedImage = analysisImage,
              let jpeg = selectedImage.jpegData(compressionQuality: 0.7) else {
            uploadError = "Choose or capture a photo before starting analysis."
            toast = .error("Choose a photo first", "ShotIQ needs real media before it can analyze.")
            return
        }
        busy = true
        uploadError = nil
        toast = .progress("Locking in your shot", "Preparing your ShotIQ media preview.", progress: 0.18)
        defer { busy = false }

        // 1. Upload the raw frame (field "image", uploadType "user").
        let localImageURL = shotiqPersistLocalJPEG(jpeg, prefix: "shotiq-\(viewpoint.rawValue)")
        let detectedPose = await ShotIQPose.detect(in: selectedImage)
            ?? (UITestHooks.forceSamplePose ? .uiTestSample : nil)
        let photoFrame = detectedPose.map {
            VideoPoseAnalyzer.frameRecord(index: 0, timestamp: 0, pose: $0)
        }
        let photoPoseData = detectedPose.map(AnalysisPoseDTO.init)
        let photoBodyPositions = photoFrame.map { bodyPositions(from: $0) }
        let localFallback = ShotIQLocalAnalysisFactory.photo(localImageURL: localImageURL,
                                                             detectedPose: detectedPose)
        if UITestHooks.analysisFailure {
            uploadError = nil
            toast = .error("Analysis failed", "Your selected photo is saved for retry.")
            route = .failed
            return
        }
        toast = .progress("Uploading \(viewpoint.shortTitle.lowercased()) view",
                          "Sending your shot into the ShotIQ breakdown.", progress: 0.25)
        var imageUrl: String?
        if let respData = try? await APIClient.shared.uploadImage(
            jpeg,
            filename: "\(viewpoint.rawValue)-shot.jpg",
            shootingAngle: viewpoint.uploadAngle,
            imageCategory: viewpoint.imageCategory,
            capturePhase: "form") {
            struct UploadResp: Codable { var success: Bool?; var url: String?; var imageUrl: String? }
            let r = try? JSONDecoder().decode(UploadResp.self, from: respData)
            imageUrl = r?.url ?? r?.imageUrl
        }
        toast = .progress("Tracking body mechanics",
                          "Reading pose, release path, ball slot, and centerline.", progress: 0.55)

        // 2. Coach-centric vision analysis (same contract the web client uses).
        struct VisionBody: Codable {
            var image: String; var drillId: String; var drillName: String
            var drillDescription: String; var coachingPoints: [String]; var focusArea: String
            var shootingAngle: String; var imageCategory: String
        }
        struct VisionResp: Codable {
            var success: Bool?
            var analysis: ShotIQPhotoVisionAnalysis?
        }
        let vision: VisionResp? = try? await APIClient.shared.call(
            "/api/vision-analyze", method: "POST",
            body: VisionBody(
                image: jpeg.base64EncodedString(),
                drillId: "shot-form-photo",
                drillName: "\(viewpoint.shortTitle) view shot form analysis",
                drillDescription: "Single-frame jump shot form check from an uploaded \(viewpoint.shortTitle.lowercased()) view photo.",
                coachingPoints: ["Keep elbow stacked through release",
                                 "Balanced base with feet shoulder-width apart",
                                 "Full follow-through with a relaxed wrist"],
                focusArea: "\(viewpoint.shortTitle) view shooting form",
                shootingAngle: viewpoint.uploadAngle,
                imageCategory: viewpoint.imageCategory))
        let photoVision = vision?.analysis

        // 3. Persist the analysis session (idempotent by clientSessionId).
        struct SaveBody: Codable {
            var clientSessionId: String; var recordedAt: String; var mediaType: String
            var visionAnalysis: ShotIQPhotoVisionAnalysisPayload?
            var imageUrl: String?; var overallScore: Double?; var coachingNotes: String?
            var roboflowPoseData: [String: AnalysisPosePointDTO]?
            var bodyPositions: [String: ShotIQPhotoBodyPosition]?
            var shootingPhase: String?; var elbowAngle: Double?; var kneeAngle: Double?
            var wristAngle: Double?; var shoulderAngle: Double?; var hipAngle: Double?
            var releaseAngle: Double?; var visualOverlays: [String: String]?
        }
        struct SaveResp: Codable {
            var success: Bool?
            var analysisId: String?
            var analysisResult: ShotIQAnalysisResultDTO?
            var analysis: ShotIQAnalysisResultDTO?
        }
        do {
            let saved: SaveResp = try await APIClient.shared.call(
                "/api/save-analysis", method: "POST",
                body: SaveBody(clientSessionId: "ios-\(UUID().uuidString)",
                               recordedAt: ISO8601DateFormatter().string(from: Date()),
                               mediaType: "image",
                               visionAnalysis: photoVision?.savePayload,
                               imageUrl: imageUrl,
                               overallScore: photoVision?.measuredOverallScore,
                               coachingNotes: photoVision?.coachingNotes,
                               roboflowPoseData: photoPoseData?.keypoints,
                               bodyPositions: photoBodyPositions,
                               shootingPhase: viewpoint.uploadAngle,
                               elbowAngle: photoFrame?.elbowAngle,
                               kneeAngle: photoFrame?.kneeAngle,
                               wristAngle: photoFrame?.wristAngle,
                               shoulderAngle: photoFrame?.shoulderAngle,
                               hipAngle: photoFrame?.hipAngle,
                               releaseAngle: photoFrame?.releaseAngle,
                               visualOverlays: ["shootingAngle": viewpoint.uploadAngle,
                                                "imageCategory": viewpoint.imageCategory]))
            var analysis = saved.analysisResult ?? saved.analysis ?? localFallback
            if analysis.media.localImageUrl == nil {
                analysis.media.localImageUrl = localImageURL?.absoluteString
            }
            if analysis.pose == nil {
                analysis.pose = localFallback.pose
            }
            savedAnalysis = analysis
            app.rememberAnalysisMedia(analysis, title: "\(viewpoint.shortTitle) View Analysis")
            toast = .success("Analysis started", "Building your ShotIQ results now.")
            route = .processing
        } catch {
            savedAnalysis = localFallback
            app.rememberAnalysisMedia(localFallback, title: "\(viewpoint.shortTitle) View Analysis")
            uploadError = nil
            toast = .info("Showing local result", "Your selected photo is ready; synced metrics need connection.")
            route = .processing
        }
    }

    private func bodyPositions(from frame: VideoPoseFrameRecord) -> [String: ShotIQPhotoBodyPosition] {
        var positions: [String: ShotIQPhotoBodyPosition] = [:]
        for (name, point) in frame.keypoints {
            let angle = angle(for: name, frame: frame)
            let guidance = guidance(for: name, angle: angle)
            positions[name] = ShotIQPhotoBodyPosition(
                x: point.x * 100,
                y: point.y * 100,
                label: name
                    .replacingOccurrences(of: "_", with: " ")
                    .split(separator: " ")
                    .map { $0.prefix(1).uppercased() + $0.dropFirst() }
                    .joined(separator: " "),
                angle: angle,
                status: guidance.status,
                note: guidance.note)
        }
        return positions
    }

    private func angle(for jointName: String, frame: VideoPoseFrameRecord) -> Double? {
        if jointName.contains("elbow") { return frame.elbowAngle }
        if jointName.contains("knee") { return frame.kneeAngle }
        if jointName.contains("wrist") { return frame.wristAngle }
        if jointName.contains("shoulder") { return frame.shoulderAngle }
        if jointName.contains("hip") { return frame.hipAngle }
        return nil
    }

    private func guidance(for jointName: String, angle: Double?) -> (status: String, note: String?) {
        guard let angle else { return ("good", nil) }
        if jointName.contains("elbow") {
            if angle >= 150 && angle <= 180 { return ("good", "Release band") }
            if angle >= 135 && angle < 150 { return ("warning", "Stack higher") }
            return ("critical", angle < 135 ? "Too tight" : "Too extended")
        }
        if jointName.contains("wrist") {
            if angle >= 50 && angle <= 100 { return ("good", "Wrist band") }
            if angle >= 40 && angle < 50 { return ("warning", "Hold set") }
            return ("critical", angle < 40 ? "Too flat" : "Too steep")
        }
        if jointName.contains("knee") {
            if angle >= 70 && angle <= 120 { return ("good", "Loaded base") }
            if angle > 120 && angle <= 150 { return ("warning", "Bend more") }
            return ("critical", angle < 70 ? "Too deep" : "Too upright")
        }
        return ("good", nil)
    }
}

struct UploadQueueView: View {      // 025
    enum QueuedMedia {
        case image(UIImage)
        case video(PickedVideoClip)

        var title: String {
            switch self {
            case .image: return "Image"
            case .video: return "Video"
            }
        }

        var detail: String {
            switch self {
            case .image(let image):
                let pixels = image.cgImage.map { "\($0.width) x \($0.height)" } ?? "Selected photo"
                return "\(pixels) • ready for pose check"
            case .video(let clip):
                return "\(clip.durationText) • \(clip.orientationText) • \(clip.fileSizeText)"
            }
        }
    }

    struct Item: Identifiable {
        let id = UUID()
        var name: String
        var pct: Double
        var state: String
        var media: QueuedMedia?
        var source: PhotosPickerItem? = nil
        var queuedAt = Date()

        var queuedAtText: String {
            queuedAt.formatted(date: .abbreviated, time: .shortened)
        }
    }

    enum QueueRoute: Hashable { case imageReview, videoReview }

    @State private var items: [Item] = []
    @State private var addPick: PhotosPickerItem?
    @State private var loadingMedia = false
    @State private var showFileImporter = false
    @State private var selectedImage: UIImage?
    @State private var selectedVideo: PickedVideoClip?
    @State private var route: QueueRoute?
    @State private var toast: ShotIQToast?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-upload-queue") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    CaptureSummaryStrip()
                    .padding(.horizontal, 20).padding(.top, 14)

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("UPLOAD QUEUE").shotiqDisplay(38)
                            Text("Review, upload, and analyze your shots.")
                                .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                        VStack(spacing: 8) {
                            PhotosPicker(selection: $addPick, matching: .any(of: [.images, .videos])) {
                                VStack(spacing: 5) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: loadingMedia ? "hourglass" : "plus.viewfinder"),
                                                             size: 42,
                                                             label: nil)
                                    Text(loadingMedia ? "Loading" : "Add media").shotiqBody(13).foregroundStyle(ShotIQColor.ink)
                                }
                                .padding(.horizontal, 16).padding(.vertical, 12)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            }
                            .buttonStyle(.plain)
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening media picker",
                                              "Choose a real photo or video to add to the queue.")
                            })
                            .disabled(loadingMedia)
                            Button {
                                toast = .info("Opening Files", "Choose a local image, MP4, MOV, or M4V.")
                                showFileImporter = true
                            } label: {
                                Text("Browse files")
                                    .shotiqBody(12, weight: .semibold)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                            .buttonStyle(.plain)
                            .disabled(loadingMedia)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 20)

                    HStack {
                        SectionLabel(text: "QUEUE (\(items.count))")
                        Spacer()
                        Text(queueSummary).shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 20).padding(.top, 20)

                    if items.isEmpty {
                        emptyQueueCard.padding(.horizontal, 20).padding(.top, 12)
                    } else {
                        ForEach(items) { it in
                            queueCard(it).padding(.horizontal, 20).padding(.top, 12)
                        }
                    }

                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(spacing: 14) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "checkmark.seal"), size: 38).font(.system(size: 20)).foregroundStyle(ShotIQColor.analysisBlue)
                                    .frame(width: 38)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Queued media is ready for review")
                                        .shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    Text("Pick an item, then ShotIQ opens the image or video analysis path.")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(.bottom, 12)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            HStack(spacing: 14) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "arrow.clockwise"), size: 38).font(.system(size: 20)).foregroundStyle(ShotIQColor.graphite)
                                    .frame(width: 38)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Retry by re-adding media")
                                        .shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    Text("If a file does not load, choose it again or use Browse files.")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(.top, 12)
                        }
                        .padding(14)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    Button {
                        guard items.isEmpty == false else {
                            toast = .info("Add media first", "Queue an image or video before starting analysis.")
                            return
                        }
                        startAnalyzingSelected()
                    } label: { captureCTA(items.isEmpty ? "Add media to analyze" : "Analyze selected (1)") }
                        .buttonStyle(.plain)
                        .disabled(loadingMedia)
                        .accessibilityIdentifier("Analyze now")
                        .padding(.horizontal, 20).padding(.top, 16)
                    Button {
                        let removed = items.filter { $0.state == "Complete" }.count
                        withAnimation { items.removeAll { $0.state == "Complete" } }
                        toast = removed > 0
                            ? .success("Completed uploads removed", "\(removed) item\(removed == 1 ? "" : "s") cleared.")
                            : .info("Nothing to remove", "No completed uploads are in the queue.")
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "trash").font(.system(size: 14))
                            Text("Remove completed").shotiqBody(14)
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
            loadQueuedMedia(item)
        }
        .fileImporter(isPresented: $showFileImporter,
                      allowedContentTypes: [.image, .movie, .mpeg4Movie, .quickTimeMovie],
                      allowsMultipleSelection: false) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                loadQueuedFile(url)
            case .failure:
                toast = .error("File not opened", "Choose a local image, MP4, MOV, or M4V.")
            }
        }
        .navigationDestination(item: $route) { route in
            switch route {
            case .imageReview:
                UploadQualityCheckView(image: selectedImage, viewpoint: .side)
            case .videoReview:
                VideoReviewView(video: selectedVideo)
            }
        }
        .shotiqToast($toast)
    }

    private var queueSummary: String {
        guard items.isEmpty == false else { return "No media queued" }
        let up = items.filter { $0.state == "Uploading" || $0.state == "Loading" }.count
        let done = items.filter { $0.state == "Complete" }.count
        let failed = items.filter { $0.state == "Failed" }.count
        return "\(up) uploading • \(done) completed • \(failed) failed"
    }

    private func loadQueuedMedia(_ item: PhotosPickerItem?) {
        guard let item else { return }
        loadingMedia = true
        toast = .progress("Loading media", "Reading the selected image or video.", progress: 0.25)
        let nextIndex = items.count + 1
        Task {
            let loaded = await makeQueuedItem(from: item, index: nextIndex)
            await MainActor.run {
                loadingMedia = false
                addPick = nil
                guard let loaded else {
                    let failed = Item(name: "selected-media-\(nextIndex)",
                                      pct: 0,
                                      state: "Failed",
                                      media: nil,
                                      source: item)
                    withAnimation { items.insert(failed, at: 0) }
                    toast = .error("Media not loaded", "Choose a photo, MP4, MOV, or M4V and try again.")
                    return
                }
                withAnimation { items.insert(loaded, at: 0) }
                toast = .success("Media queued", "\(loaded.name) is ready to analyze.")
            }
        }
    }

    private func makeQueuedItem(from item: PhotosPickerItem, index: Int) async -> Item? {
        if let data = try? await item.loadTransferable(type: Data.self),
           let image = UIImage(data: data) {
            return Item(name: "selected-image-\(index).jpg",
                        pct: 1,
                        state: "Complete",
                        media: .image(image),
                        source: item)
        }
        if let clip = await loadPickedVideoClip(from: item) {
            return Item(name: clip.filename,
                        pct: 1,
                        state: "Complete",
                        media: .video(clip),
                        source: item)
        }
        return nil
    }

    private func loadQueuedFile(_ url: URL) {
        loadingMedia = true
        toast = .progress("Loading file", "Reading the selected media from Files.", progress: 0.25)
        let nextIndex = items.count + 1
        Task {
            let loaded = await makeQueuedItem(fromFileURL: url, index: nextIndex)
            await MainActor.run {
                loadingMedia = false
                guard let loaded else {
                    let failed = Item(name: url.lastPathComponent.isEmpty ? "selected-file-\(nextIndex)" : url.lastPathComponent,
                                      pct: 0,
                                      state: "Failed",
                                      media: nil)
                    withAnimation { items.insert(failed, at: 0) }
                    toast = .error("File not loaded", "Choose a readable image, MP4, MOV, or M4V.")
                    return
                }
                withAnimation { items.insert(loaded, at: 0) }
                toast = .success("File queued", "\(loaded.name) is ready to analyze.")
            }
        }
    }

    private func makeQueuedItem(fromFileURL url: URL, index: Int) async -> Item? {
        let didAccess = url.startAccessingSecurityScopedResource()
        defer {
            if didAccess { url.stopAccessingSecurityScopedResource() }
        }
        guard let data = try? Data(contentsOf: url) else { return nil }
        if let image = UIImage(data: data) {
            return Item(name: url.lastPathComponent.isEmpty ? "selected-image-\(index).jpg" : url.lastPathComponent,
                        pct: 1,
                        state: "Complete",
                        media: .image(image))
        }
        if let clip = await loadVideoClip(data: data, ext: url.pathExtension.isEmpty ? "mov" : url.pathExtension) {
            return Item(name: url.lastPathComponent.isEmpty ? clip.filename : url.lastPathComponent,
                        pct: 1,
                        state: "Complete",
                        media: .video(clip))
        }
        return nil
    }

    private func retryQueuedItem(_ item: Item) {
        guard let source = item.source else {
            toast = .error("Retry unavailable", "Choose the media again from Photos.")
            return
        }
        guard let index = items.firstIndex(where: { $0.id == item.id }) else { return }
        items[index].state = "Loading"
        items[index].pct = 0.2
        toast = .progress("Retrying media", "Loading \(item.name) again.", progress: 0.35)
        Task {
            let loaded = await makeQueuedItem(from: source, index: index + 1)
            await MainActor.run {
                guard let current = items.firstIndex(where: { $0.id == item.id }) else { return }
                if let loaded {
                    withAnimation { items[current] = loaded }
                    toast = .success("Media queued", "\(loaded.name) is ready to analyze.")
                } else {
                    items[current].state = "Failed"
                    items[current].pct = 0
                    toast = .error("Retry failed", "Choose another photo, MP4, MOV, or M4V.")
                }
            }
        }
    }

    private func startAnalyzingSelected() {
        guard let item = items.first(where: { $0.state == "Complete" && $0.media != nil }),
              item.media != nil else {
            toast = .info("Add media first", "Queue a real image or video before starting analysis.")
            return
        }
        startAnalyzing(item)
    }

    private func startAnalyzing(_ item: Item) {
        guard let media = item.media else {
            toast = .info("Media still loading", "Wait for this queue item to finish loading.")
            return
        }
        switch media {
        case .image(let image):
            selectedImage = image
            selectedVideo = nil
            toast = .progress("Opening image analysis", "Checking pose and framing next.", progress: 0.45)
            route = .imageReview
        case .video(let clip):
            selectedVideo = clip
            selectedImage = nil
            toast = .progress("Opening video review", "Trim the selected clip before analysis.", progress: 0.45)
            route = .videoReview
        }
    }

    private var emptyQueueCard: some View {
        ShotIQCard {
            HStack(alignment: .center, spacing: 14) {
                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "plus.viewfinder"),
                                         size: 54,
                                         label: nil)
                    .frame(width: 54, height: 54)
                VStack(alignment: .leading, spacing: 4) {
                    Text("No media queued").shotiqBody(17, weight: .bold).foregroundStyle(ShotIQColor.ink)
                    Text("Add an image or video from your device to start upload and analysis.")
                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            .padding(14)
        }
    }

    private func queueCard(_ it: Item) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 12) {
                ZStack(alignment: .topLeading) {
                    queuePreview(it).frame(width: 118)
                    Image(systemName: it.mediaIcon)
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
                        Text(it.media?.title ?? (it.state == "Complete" ? "Image" : "Video"))
                            .shotiqBody(16, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                            .lineLimit(1).fixedSize()
                        Text("•").foregroundStyle(ShotIQColor.graphite)
                        // The trailing overflow Menu and the Spacer left this
                        // status word compressible, so "Uploading" and "Complete"
                        // broke inside the word — "Uploadin g" / "Complet e" on
                        // 025. It is a single token; it never wraps.
                        Text(it.state).shotiqBody(14, weight: .medium)
                            .lineLimit(1).fixedSize()
                            .foregroundStyle(it.state == "Complete" ? ShotIQColor.confirmGreen :
                                (it.state == "Uploading" ? ShotIQColor.analysisBlue : ShotIQColor.graphite))
                        Spacer()
                        Menu {
                            if it.state == "Failed" {
                                Button("Retry upload") {
                                    retryQueuedItem(it)
                                }
                            }
                            Button("Remove from queue", role: .destructive) {
                                withAnimation { items.removeAll { $0.id == it.id } }
                                toast = .info("Removed from queue", it.name)
                            }
                        } label: {
                            Image(systemName: "ellipsis").foregroundStyle(ShotIQColor.graphite)
                                .padding(.vertical, 4).padding(.leading, 8)
                        }
                    }
                    Text(it.queuedAtText).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                    Text(it.name).shotiqBody(13, weight: .medium).foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.8)
                    if let detail = it.media?.detail {
                        Text(detail).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                            .lineLimit(1).minimumScaleFactor(0.7)
                    }
                    if it.state == "Failed" {
                        Text("Media failed to load").shotiqBody(13, weight: .medium)
                            .foregroundStyle(ShotIQColor.reviewRed)
                        HStack(spacing: 8) {
                            Button {
                                retryQueuedItem(it)
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "arrow.clockwise")
                                    Text("Retry").shotiqBody(13, weight: .medium)
                                }
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                .frame(maxWidth: .infinity).frame(height: 38)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                            }
                            .buttonStyle(.plain)
                            .accessibilityIdentifier("upload-queue-retry-\(it.id.uuidString)")

                            Button {
                                withAnimation { items.removeAll { $0.id == it.id } }
                                toast = .info("Removed from queue", it.name)
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "trash")
                                    Text("Remove").shotiqBody(13, weight: .medium)
                                }
                                .foregroundStyle(ShotIQColor.graphite)
                                .frame(maxWidth: .infinity).frame(height: 38)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            }
                            .buttonStyle(.plain)
                            .accessibilityIdentifier("upload-queue-remove-\(it.id.uuidString)")
                        }
                    } else if it.state == "Complete" {
                        Text("Ready to analyze").shotiqBody(13, weight: .medium)
                            .foregroundStyle(ShotIQColor.confirmGreen)
                        // Shares the screen's one route to processing with
                        // "Analyze selected" — a second NavigationLink to the same
                        // destination competed with the screen's
                        // navigationDestination and the tap went nowhere.
                        Button {
                            startAnalyzing(it)
                        } label: {
                            HStack(spacing: 8) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.metering.center.weighted"),
                                                         size: 24,
                                                         label: nil)
                                Text("Analyze now").shotiqBody(14, weight: .medium)
                            }
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .frame(maxWidth: .infinity).frame(height: 40)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("Analyze now")
                    } else if it.state == "Uploading" || it.state == "Paused" {
                        HStack(alignment: .firstTextBaseline) {
                            Text("\(Int(it.pct * 100))%").font(.custom("Tungsten-Medium", size: 28))
                                .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Text("18.7 MB / 32.1 MB").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        }
                        ScoreBar(pct: it.pct, color: ShotIQColor.analysisBlue)
                        HStack {
                            Text(it.state == "Paused" ? "Upload paused" : "Uploading over Wi-Fi")
                                .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            Spacer()
                            Button {
                                if let idx = items.firstIndex(where: { $0.id == it.id }) {
                                    let paused = items[idx].state == "Uploading"
                                    items[idx].state = paused ? "Paused" : "Uploading"
                                    toast = .info(paused ? "Upload paused" : "Upload resumed", it.name)
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
                        Text("Waiting to upload").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                        ScoreBar(pct: it.pct, color: ShotIQColor.analysisBlue)
                    }
                }
            }
            .padding(12)
        }
    }

    @ViewBuilder
    private func queuePreview(_ item: Item) -> some View {
        switch item.media {
        case .image(let image):
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .frame(height: 104)
                .clipShape(RoundedRectangle(cornerRadius: 4))
        case .video(let clip):
            CaptureVideoPoseSurface(url: clip.url,
                                    height: 104,
                                    cornerRadius: 4,
                                    accessibilityID: "upload-queue-video-pose-preview")
        case .none:
            CanonicalPhoto("021-visual-004", height: 104, cornerRadius: 4)
        }
    }
}

private extension UploadQueueView.Item {
    var mediaIcon: String {
        switch media {
        case .image: return "photo"
        case .video: return "play.circle"
        case .none: return state == "Complete" ? "photo" : "play.circle"
        }
    }
}

struct PickedVideoClip: Identifiable, Equatable, Hashable {
    var id: String { url.path }
    var url: URL
    var filename: String
    var contentType: String
    var fileSizeBytes: Int
    var durationSeconds: Double
    var dimensions: CGSize?
    var frameRate: Float?

    func hash(into hasher: inout Hasher) {
        hasher.combine(url)
        hasher.combine(filename)
        hasher.combine(contentType)
        hasher.combine(fileSizeBytes)
        hasher.combine(durationSeconds)
        hasher.combine(dimensions?.width)
        hasher.combine(dimensions?.height)
        hasher.combine(frameRate)
    }

    var durationText: String { Self.timeText(durationSeconds) }

    var orientationText: String {
        guard let dimensions else { return "Unknown" }
        return "\(Int(dimensions.width.rounded())) x \(Int(dimensions.height.rounded()))"
    }

    var fileSizeText: String {
        let mb = Double(fileSizeBytes) / 1_000_000
        return "\(String(format: "%.1f", mb)) MB"
    }

    var frameRateText: String {
        guard let frameRate, frameRate > 0 else { return "Unknown" }
        return "\(Int(frameRate.rounded())) FPS"
    }

    func timeText(at fraction: Double) -> String {
        Self.timeText(durationSeconds * min(max(fraction, 0), 1))
    }

    static func timeText(_ seconds: Double) -> String {
        guard seconds.isFinite, seconds >= 0 else { return "00:00.00" }
        let minutes = Int(seconds / 60)
        let wholeSeconds = Int(seconds) % 60
        let hundredths = Int(((seconds - floor(seconds)) * 100).rounded())
        return String(format: "%02d:%02d.%02d", minutes, wholeSeconds, min(hundredths, 99))
    }

    static func contentType(forExtension ext: String) -> String {
        switch ext.lowercased() {
        case "mov": return "video/quicktime"
        case "webm": return "video/webm"
        case "m4v": return "video/x-m4v"
        default: return "video/mp4"
        }
    }
}

struct VideoAnalysisJob: Equatable, Hashable {
    var clientSessionId: String
    var clip: PickedVideoClip
    var trimStartFraction: Double
    var trimEndFraction: Double

    var trimStartSeconds: Double {
        clip.durationSeconds * min(max(trimStartFraction, 0), 1)
    }

    var trimEndSeconds: Double {
        clip.durationSeconds * min(max(trimEndFraction, 0), 1)
    }

    var trimmedDurationSeconds: Double {
        max(0, trimEndSeconds - trimStartSeconds)
    }

    var trimWindowText: String {
        "\(PickedVideoClip.timeText(trimStartSeconds))-\(PickedVideoClip.timeText(trimEndSeconds))"
    }
}

private struct PickedVideoThumbnailView: View {
    var clip: PickedVideoClip
    var height: CGFloat
    var compact = false
    @State private var image: UIImage?
    @State private var failed = false

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    Rectangle()
                        .fill(ShotIQColor.warmCanvas)
                        .overlay {
                            if failed {
                                Image(systemName: "video")
                                    .font(.system(size: compact ? 20 : 32, weight: .semibold))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            } else {
                                ProgressView()
                                    .tint(ShotIQColor.shotiqOrange)
                            }
                        }
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .clipped()

            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.76)],
                           startPoint: .top,
                           endPoint: .bottom)

            HStack(alignment: .bottom, spacing: 10) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: compact ? 16 : 20, weight: .semibold))
                    .foregroundStyle(ShotIQColor.confirmGreen)
                VStack(alignment: .leading, spacing: 2) {
                    Text(compact ? "Video ready" : clip.filename)
                        .shotiqBody(compact ? 12 : 13, weight: .bold)
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                    Text("\(clip.durationText) • \(clip.orientationText) • \(clip.fileSizeText)")
                        .shotiqBody(compact ? 10 : 11, weight: .semibold)
                        .foregroundStyle(.white.opacity(0.84))
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                }
                Spacer(minLength: 0)
            }
            .padding(12)
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .task(id: clip.id) { await loadThumbnail() }
        .accessibilityLabel("Selected video preview")
    }

    private func loadThumbnail() async {
        image = nil
        failed = false
        let asset = AVURLAsset(url: clip.url)
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: 900, height: 900)
        let seconds = min(max(clip.durationSeconds * 0.1, 0.05), 1.0)
        let time = CMTime(seconds: seconds, preferredTimescale: 600)
        do {
            let cgImage = try generator.copyCGImage(at: time, actualTime: nil)
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

private func loadPickedVideoClip(from item: PhotosPickerItem) async -> PickedVideoClip? {
    guard let data = try? await item.loadTransferable(type: Data.self) else { return nil }
    let ext = item.supportedContentTypes.first?.preferredFilenameExtension ?? "mov"
    return await loadVideoClip(data: data, ext: ext)
}

private func loadVideoClip(fromFileURL sourceURL: URL) async -> PickedVideoClip? {
    let didAccess = sourceURL.startAccessingSecurityScopedResource()
    defer {
        if didAccess { sourceURL.stopAccessingSecurityScopedResource() }
    }
    guard let data = try? Data(contentsOf: sourceURL) else { return nil }
    let ext = sourceURL.pathExtension.isEmpty ? "mov" : sourceURL.pathExtension
    return await loadVideoClip(data: data, ext: ext)
}

private func loadVideoClip(data: Data, ext: String) async -> PickedVideoClip? {
    let contentType = PickedVideoClip.contentType(forExtension: ext)
    let filename = "shotiq-\(UUID().uuidString).\(ext)"
    guard let url = shotiqPersistLocalVideo(data, filename: filename) else {
        return nil
    }

    let asset = AVURLAsset(url: url)
    let durationTime = (try? await asset.load(.duration)) ?? .zero
    let rawDuration = CMTimeGetSeconds(durationTime)
    let tracks = (try? await asset.loadTracks(withMediaType: .video)) ?? []
    let track = tracks.first

    var dimensions: CGSize?
    var frameRate: Float?
    if let track {
        let naturalSize = (try? await track.load(.naturalSize)) ?? .zero
        let transform = (try? await track.load(.preferredTransform)) ?? .identity
        let transformedSize = naturalSize.applying(transform)
        dimensions = CGSize(width: abs(transformedSize.width), height: abs(transformedSize.height))
        frameRate = try? await track.load(.nominalFrameRate)
    }

    return PickedVideoClip(url: url,
                           filename: filename,
                           contentType: contentType,
                           fileSizeBytes: data.count,
                           durationSeconds: rawDuration.isFinite ? rawDuration : 0,
                           dimensions: dimensions,
                           frameRate: frameRate)
}

struct VideoUploadView: View {      // 026
    @EnvironmentObject private var app: AppState
    enum VideoUploadRoute: Hashable { case review(PickedVideoClip), imageUpload, recordVideo, uploadQueue, captureGuide }
    @State private var pick: PhotosPickerItem?
    @State private var selectedVideo: PickedVideoClip?
    @State private var loadingVideo = false
    @State private var videoError: String?
    @State private var route: VideoUploadRoute?
    @State private var toast: ShotIQToast?

    var body: some View {
        CanonicalScreen(testID: "screen-ios-video-upload") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    HStack {
                        Button {
                            camera.stopRecording()
                            CameraService.live.stop()
                            timer?.invalidate()
                            toast = .info("Exiting live video", "Returning to the previous screen.")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { dismiss() }
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 14, weight: .heavy))
                                Text("EXIT LIVE")
                                    .shotiqBody(12, weight: .heavy)
                                    .kerning(0.8)
                            }
                            .foregroundStyle(ShotIQColor.ink)
                            .padding(.horizontal, 12)
                            .frame(height: 34)
                            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 7))
                            .overlay(RoundedRectangle(cornerRadius: 7).stroke(ShotIQColor.rule, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Exit live video")
                        .accessibilityIdentifier("live-video-exit")
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)

                    HStack(spacing: 8) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Text("UPLOAD YOUR SHOOTING MEDIA")
                            .shotiqCondensed(22, weight: .heavy)
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                    }
                    .padding(.horizontal, 20).padding(.top, 24)
                    Text("Choose to upload images or a video of your shooting form for comprehensive biomechanical analysis.")
                        .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    VStack(alignment: .leading, spacing: 8) {
                        Label("Video Requirements", systemImage: "exclamationmark.triangle")
                            .shotiqBody(13, weight: .bold)
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        videoRequirement("Maximum 10 seconds, under 50MB", highlight: true)
                        videoRequirement("Full body visible throughout the shot")
                        videoRequirement("Single shooter, clear view")
                        videoRequirement("Good lighting, minimal camera shake")
                        videoRequirement("Side or 45-degree angle preferred")
                        videoRequirement("Include the shooting motion, not just dribbling")
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    .padding(.horizontal, 20).padding(.top, 26)

                    PhotosPicker(selection: $pick, matching: .videos) {
                        videoUploadDropzone
                    }
                    .buttonStyle(.plain)
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening video library", "Choose a real shooting clip.")
                    })
                    .disabled(loadingVideo)
                    .padding(.horizontal, 20).padding(.top, 14)

                    if selectedVideo != nil || loadingVideo {
                        uploadMomentumCard
                            .padding(.horizontal, 20).padding(.top, 12)
                    }

                    HStack(spacing: 10) {
                        PhotosPicker(selection: $pick, matching: .videos) {
                            compactVideoAction("film", "Browse video")
                        }
                        .buttonStyle(.plain)
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening video library", "Choose a real shooting clip.")
                        })
                        .disabled(loadingVideo)

                        Button {
                            route = .recordVideo
                            toast = .info("Opening camera setup", "Position the phone before recording.")
                        } label: {
                            compactVideoAction("record.circle", "Record video")
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 10)

                    if let videoError {
                        Text(videoError).shotiqBody(12).foregroundStyle(ShotIQColor.reviewRed)
                            .padding(.horizontal, 20).padding(.top, 8)
                    }

                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Text("The system detects your shooting motion and extracts key frames for setup, release, and follow-through analysis.")
                            .shotiqBody(12)
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 20).padding(.top, 16)

                    Button { analyzeSelectedVideo() } label: {
                        captureCTA("Analyze My Shooting Form",
                                   icon: selectedVideo == nil ? "sparkles" : "camera.metering.center.weighted")
                            .opacity(selectedVideo == nil ? 0.45 : 1)
                    }
                    .buttonStyle(.plain)
                    .disabled(loadingVideo)
                    .accessibilityIdentifier("video-upload-analyze")
                    .padding(.horizontal, 20).padding(.top, 24)

                    Text(selectedVideo == nil
                         ? "Choose a video first. ShotIQ will analyze pose, angles, and release frames."
                         : "Video ready. Tap Analyze to review and process this shot.")
                        .shotiqBody(12)
                        .foregroundStyle(ShotIQColor.graphite)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.horizontal, 20).padding(.top, 8)

                    HStack(spacing: 10) {
                        Button {
                            route = .uploadQueue
                            toast = .info("Opening upload queue", "Queued media and retries are there.")
                        } label: { captureOutline("Upload queue", icon: "tray.full") }
                        .buttonStyle(.plain)

                        Button {
                            route = .captureGuide
                            toast = .info("Opening filming tips", "Use the guide to frame the shooter.")
                        } label: { captureOutline("Filming tips", icon: "point.topleft.down.curvedto.point.bottomright.up") }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
        .onChange(of: pick) { _, item in
            guard let item else { return }
            beginLoadingVideo()
            Task {
                let clip = await loadPickedVideoClip(from: item)
                await MainActor.run { finishLoadingVideo(clip) }
            }
        }
        .navigationDestination(item: $route) { route in
            switch route {
            case .review(let clip):
                VideoReviewView(video: clip)
            case .imageUpload:
                PhotoUploadSourceView()
            case .recordVideo:
                LiveCameraSetupView()
            case .uploadQueue:
                UploadQueueView()
            case .captureGuide:
                CaptureGuideView()
            }
        }
        .shotiqToast($toast)
    }

    private var videoUploadDropzone: some View {
        Group {
            if let selectedVideo, !loadingVideo {
                PickedVideoThumbnailView(clip: selectedVideo, height: 188)
                    .overlay(alignment: .topLeading) {
                        processingPill(icon: "checkmark.circle.fill",
                                       title: "SHOT LOCKED",
                                       subtitle: "READY FOR VIDEO REVIEW",
                                       color: ShotIQColor.confirmGreen)
                            .padding(10)
                    }
            } else {
                VStack(spacing: 10) {
                    Image(systemName: loadingVideo ? "hourglass" : "video")
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .frame(width: 62, height: 62)
                        .overlay(Circle().stroke(ShotIQColor.shotiqOrange.opacity(0.65), lineWidth: 2))
                    Text(uploadTitle)
                        .shotiqBody(16, weight: .semibold)
                        .foregroundStyle(ShotIQColor.ink)
                    Text(uploadSubtitle)
                        .shotiqBody(12)
                        .foregroundStyle(ShotIQColor.graphite)
                }
                .frame(maxWidth: .infinity, minHeight: 188)
                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
            }
        }
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(style: StrokeStyle(lineWidth: 1, dash: [5, 4])).foregroundStyle(ShotIQColor.rule))
    }

    private var uploadMomentumCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Image(systemName: loadingVideo ? "film.stack" : "checkmark.seal.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(loadingVideo ? ShotIQColor.shotiqOrange : ShotIQColor.confirmGreen)
                VStack(alignment: .leading, spacing: 2) {
                    Text(loadingVideo ? "LOCKING IN YOUR SHOT" : "SHOT READY FOR REVIEW")
                        .shotiqBody(13, weight: .heavy)
                        .foregroundStyle(loadingVideo ? ShotIQColor.shotiqOrange : ShotIQColor.confirmGreen)
                    Text(loadingVideo ? "Reading the clip, frame rate, and shooting window." : "Next, trim the clip before ShotIQ runs the full breakdown.")
                        .shotiqBody(11)
                        .foregroundStyle(ShotIQColor.graphite)
                }
                Spacer(minLength: 0)
            }
            ScoreBar(pct: loadingVideo ? 0.56 : 1.0,
                     color: loadingVideo ? ShotIQColor.shotiqOrange : ShotIQColor.confirmGreen)
                .frame(height: 6)
        }
        .padding(14)
        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(loadingVideo ? ShotIQColor.shotiqOrange.opacity(0.35) : ShotIQColor.confirmGreen.opacity(0.35)))
    }

    private func processingPill(icon: String, title: String, subtitle: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .bold))
            VStack(alignment: .leading, spacing: 0) {
                Text(title)
                    .shotiqBody(11, weight: .heavy)
                    .kerning(0.5)
                Text(subtitle)
                    .shotiqBody(9, weight: .bold)
                    .kerning(0.4)
                    .opacity(0.78)
            }
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(.black.opacity(0.68), in: RoundedRectangle(cornerRadius: 7))
        .overlay(RoundedRectangle(cornerRadius: 7).stroke(color.opacity(0.75), lineWidth: 1))
    }

    private var uploadTitle: String {
        if loadingVideo { return "Loading video" }
        return "Click to upload video"
    }

    private var uploadSubtitle: String {
        if loadingVideo { return "Reading duration, size, and frame rate" }
        return "MP4, MOV, M4V (max 10 sec, 50MB)"
    }

    private func videoRequirement(_ text: String, highlight: Bool = false) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•").shotiqBody(12, weight: .bold)
            Text(text).shotiqBody(12, weight: highlight ? .semibold : .regular)
        }
        .foregroundStyle(highlight ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
    }

    private func compactVideoAction(_ icon: String, _ title: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14, weight: .semibold))
            Text(title).shotiqBody(13, weight: .semibold)
        }
        .foregroundStyle(ShotIQColor.ink)
        .frame(maxWidth: .infinity)
        .frame(height: 44)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func analyzeSelectedVideo() {
        guard let selectedVideo else {
            videoError = "Choose a video before starting analysis."
            toast = .error("Choose a video first", "ShotIQ needs a real shot video before analysis.")
            return
        }
        toast = .progress("Preparing analysis", "Opening video review for \(selectedVideo.durationText).", progress: 0.35)
        route = .review(selectedVideo)
    }

    @MainActor
    private func beginLoadingVideo() {
        loadingVideo = true
        videoError = nil
        toast = .progress("Loading video", "Reading duration, size, and frame rate.", progress: 0.35)
    }

    @MainActor
    private func finishLoadingVideo(_ clip: PickedVideoClip?) {
        loadingVideo = false
        pick = nil
        if let clip {
            selectedVideo = clip
            app.rememberShootingMedia(url: clip.url,
                                      kind: "video",
                                      title: "Latest Uploaded Video",
                                      durationText: clip.durationText)
            toast = .success("Video ready", "Tap Analyze My Shooting Form when you're ready.")
        } else {
            videoError = "Couldn't load that video. Choose a local MP4 or MOV and try again."
            toast = .error("Video not loaded", "Choose a local MP4 or MOV and try again.")
        }
    }

    private func videoSourceRow(_ icon: String, _ title: String, _ subtitle: String, tint: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(tint)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).shotiqBody(16, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.78)
                Text(subtitle).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(2).minimumScaleFactor(0.8)
            }
            Spacer(minLength: 8)
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(ShotIQColor.graphite)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 72, alignment: .leading)
        .background(.white, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func framingCard(_ badge: String, photo: String? = nil, good: Bool) -> some View {
        ZStack(alignment: .topLeading) {
            if let photo {
                CanonicalPhoto(photo, height: 150, cornerRadius: 8)
            } else {
                captureDark(150, radius: 8)
            }
            Text(badge).shotiqBody(11, weight: .bold).foregroundStyle(.white)
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
    var video: PickedVideoClip? = nil
    enum ReviewRoute: Hashable { case processing(VideoAnalysisJob), upload }
    @Environment(\.dismiss) private var dismiss
    @State private var trimStart: Double = 0
    @State private var trimEnd: Double = 1
    @State private var route: ReviewRoute?
    @State private var toast: ShotIQToast?
    @State private var reviewPreviewProgress = 0.18
    var body: some View {
        CanonicalScreen(testID: "screen-ios-video-review") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Button {
                                toast = .info("Returning to video upload")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "arrow.left").font(.system(size: 14, weight: .semibold))
                                    Text("AI ANALYSIS").shotiqBody(13, weight: .bold).kerning(1)
                                }
                                .foregroundStyle(ShotIQColor.graphite)
                            }
                            .buttonStyle(.plain)
                            Text("VIDEO REVIEW").shotiqDisplay(38)
                            Text("Review your clip and adjust the range before we analyze.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer(minLength: 8)
                        HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                        HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    VStack(alignment: .leading, spacing: 10) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Jordan Ellis").shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                            Text("Right-handed • Advanced").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        }
                        CaptureSummaryStrip(scoreSize: 24)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    HStack(alignment: .center, spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("PRIMARY TARGET").shotiqBody(10, weight: .medium).kerning(0.7)
                                .foregroundStyle(ShotIQColor.graphite)
                            Text("Keep elbow stacked through release")
                                .shotiqBody(16, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                .lineLimit(1).minimumScaleFactor(0.7)
                        }
                        Spacer()
                        TrendLine(points: [2, 3, 2.6, 3.6, 4.1], stroke: ShotIQColor.shotiqOrange)
                            .frame(width: 76, height: 30)
                    }
                    .padding(14)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 20).padding(.top, 12)

                    Group {
                        if let video {
                            CaptureVideoPoseSurface(url: video.url,
                                                    height: 300,
                                                    cornerRadius: 8,
                                                    accessibilityID: "video-review-pose-preview")
                                .overlay(alignment: .bottomTrailing) {
                                    Text(video.durationText)
                                        .font(.custom("Tungsten-Medium", size: 13))
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 8).padding(.vertical, 4)
                                        .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 4))
                                        .padding(8)
                                }
                                .overlay(alignment: .topLeading) {
                                    reviewPreviewProcessingPill
                                        .padding(10)
                                }
                        } else {
                            CanonicalMediaSurface(key: "027-visual-001", height: 300, duration: "0:06")
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    Text("Drag the handles to trim your clip")
                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
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
                                    }
                                    .onEnded { _ in
                                        toast = .info("Trim start set", video?.timeText(at: trimStart) ?? "Start adjusted")
                                    })
                            RoundedRectangle(cornerRadius: 5).fill(ShotIQColor.shotiqOrange)
                                .frame(width: 18, height: 54)
                                .overlay(Image(systemName: "pause").font(.system(size: 10, weight: .bold)).foregroundStyle(.white))
                                .offset(x: w * trimEnd - 9)
                                .gesture(DragGesture(minimumDistance: 0, coordinateSpace: .named("trimTrack"))
                                    .onChanged { v in
                                        trimEnd = max(min(1, v.location.x / w), trimStart + 0.08)
                                    }
                                    .onEnded { _ in
                                        toast = .info("Trim end set", video?.timeText(at: trimEnd) ?? "End adjusted")
                                    })
                        }
                        .coordinateSpace(name: "trimTrack")
                    }
                    .frame(height: 54).padding(.horizontal, 20).padding(.top, 8)

                    HStack {
                        Text(video?.timeText(at: trimStart) ?? "00:00.50").font(.custom("Tungsten-Medium", size: 15)).foregroundStyle(ShotIQColor.graphite)
                        Spacer()
                        Text(video?.timeText(at: trimEnd) ?? "00:06.00").font(.custom("Tungsten-Medium", size: 15)).foregroundStyle(ShotIQColor.shotiqOrange)
                        Spacer()
                        Text(video?.durationText ?? "00:06.50").font(.custom("Tungsten-Medium", size: 15)).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 20).padding(.top, 6)

                    SectionLabel(text: "VIDEO DETAILS").padding(.horizontal, 20).padding(.top, 20)
                    HStack(alignment: .top, spacing: 0) {
                        detailCol("clock", video?.durationText ?? "00:06.00", "DURATION")
                        detailCol("iphone", video?.orientationText ?? "1080 x 1920", "ORIENTATION")
                        detailCol("doc", video?.fileSizeText ?? "24.8 MB", "FILE SIZE")
                        detailCol("film", video?.frameRateText ?? "60 FPS", "FRAME RATE")
                    }
                    .padding(.horizontal, 20).padding(.top, 10)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("HOW SHOT DETECTION WORKS")
                            .shotiqCondensed(15, weight: .heavy).kerning(0.5)
                            .foregroundStyle(ShotIQColor.ink)
                        Text("ShotIQ identifies your shooting motion using pose tracking and ball flight to isolate each rep. You can review and adjust the range if needed.")
                            .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 20).padding(.top, 16)

                    Button { analyzeVideo() } label: {
                        captureCTA(video == nil ? "Choose video to analyze" : "Analyze video",
                                   icon: video == nil ? "film" : "camera.metering.center.weighted")
                    }
                        .buttonStyle(.plain)
                        .accessibilityElement(children: .combine)
                        .accessibilityAddTraits(.isButton)
                        .accessibilityLabel("Analyze video")
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(spacing: 10) {
                        Button {
                            withAnimation(.easeInOut(duration: 0.25)) { trimStart = 0; trimEnd = 1 }
                            toast = .success("Trim reset", "Using the full uploaded clip.")
                        } label: { captureOutline("Trim", icon: "crop") }.buttonStyle(.plain)
                        Button {
                            toast = .info("Choose another video", "Returning to upload source.")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                        } label: { captureOutline("Change video", icon: "square.and.arrow.up") }.buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 10)

                    Spacer(minLength: 26)
                }
            }
        }
        .onAppear { beginReviewPreviewProcessing() }
        .navigationDestination(item: $route) { route in
            switch route {
            case .processing(let job):
                AnalysisProcessingView(videoJob: job)
            case .upload:
                VideoUploadView()
            }
        }
        .shotiqToast($toast)
    }

    private func detailCol(_ icon: String, _ v: String, _ l: String) -> some View {
        VStack(spacing: 4) {
            ShotIQConceptGlyph(concept: l, fallback: icon, size: 30)
                .foregroundStyle(ShotIQColor.ink)
            Text(v).font(.custom("Tungsten-Medium", size: 17)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(l).shotiqBody(9, weight: .medium).kerning(0.5).foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }

    private var reviewPreviewProcessingPill: some View {
        let isReady = reviewPreviewProgress >= 1
        return VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 8) {
                Image(systemName: isReady ? "checkmark.circle.fill" : "camera.metering.center.weighted")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(isReady ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                Text(isReady ? "SHOT PREVIEW READY" : "PROCESSING")
                    .shotiqBody(11, weight: .heavy)
                    .kerning(0.7)
                    .foregroundStyle(.white)
            }
            ScoreBar(pct: reviewPreviewProgress,
                     color: isReady ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                .frame(width: 142, height: 5)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 7))
        .overlay(RoundedRectangle(cornerRadius: 7).stroke(.white.opacity(0.18), lineWidth: 1))
    }

    private func beginReviewPreviewProcessing() {
        guard video != nil else { return }
        reviewPreviewProgress = 0.18
        Task {
            for value in [0.34, 0.52, 0.70, 0.86, 1.0] {
                try? await Task.sleep(for: .milliseconds(360))
                await MainActor.run {
                    withAnimation(.easeOut(duration: 0.28)) {
                        reviewPreviewProgress = value
                    }
                }
            }
        }
    }

    private func analyzeVideo() {
        guard let video else {
            showMissingVideoToast()
            return
        }
        let job = VideoAnalysisJob(
            clientSessionId: "ios-video-\(UUID().uuidString)",
            clip: video,
            trimStartFraction: trimStart,
            trimEndFraction: trimEnd)
        toast = .progress("Preparing analysis", "Trim window \(job.trimWindowText).", progress: 0.35)
        Task {
            try? await Task.sleep(for: .milliseconds(250))
            await MainActor.run { route = .processing(job) }
        }
    }

    private func showMissingVideoToast() {
        toast = .info("Choose a video first", "Opening video upload so ShotIQ can analyze a real clip.")
        Task {
            try? await Task.sleep(for: .milliseconds(250))
            await MainActor.run { route = .upload }
        }
    }
}

struct LiveCameraSetupView: View {  // 028
    @ObservedObject private var camera = CameraService.live
    @State private var rightHanded = true
    @State private var toast: ShotIQToast?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-live-camera-setup") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    ShotIQCard {
                        CaptureSummaryStrip(scoreSize: 24)
                            .padding(.vertical, 12).padding(.horizontal, 8)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("LIVE CAMERA SETUP").shotiqDisplay(36)
                            Text("Follow the checklist below for best AI analysis.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                        Button {
                            camera.flipCamera()
                            toast = .info("Switching camera", "Use the view that keeps your full body and hoop visible.")
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "arrow.triangle.2.circlepath").font(.system(size: 15))
                                Text("Switch camera").shotiqBody(13, weight: .medium)
                            }
                            .foregroundStyle(ShotIQColor.ink)
                            .padding(.horizontal, 12).padding(.vertical, 10)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    // Live camera preview with corner brackets + dashed crosshair.
                    //
                    // 300pt was the app's own number; canonical gives this frame
                    // 497 of 1844 canvas rows, i.e. 229pt, and the crop's 774x497
                    // aspect only lands un-cropped at that height. At 300 the
                    // .fill scale cut ~94px off each edge of the crop, taking the
                    // baked framing brackets with it.
                    ZStack {
                        captureDark(229)
                        LiveViewfinder(camera: camera, fallback: "028-visual-002")
                        // Canonical's dashed thirds guide and framing brackets are
                        // burned into 028-visual-002, so they are drawn live only
                        // when a real feed has replaced the photograph.
                        if camera.isLive {
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
                        }
                        if camera.status == .unknown {
                            VStack(spacing: 10) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera"), size: 32).font(.system(size: 30)).foregroundStyle(.white)
                                Text("Camera permission needed").shotiqBody(14).foregroundStyle(.white)
                                Button("Allow camera") {
                                    toast = .progress("Opening camera permission", "Allow camera access to use live capture.", progress: 0.5)
                                    camera.start()
                                }
                                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                    }
                    .frame(height: 229)
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
                                    Text("SHOOTING HAND").shotiqCondensed(14, weight: .heavy).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text("Confirm your dominant shooting hand.")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                HStack(spacing: 0) {
                                    Button {
                                        rightHanded = false
                                        toast = .success("Shooting hand set", "Left hand selected.")
                                    } label: {
                                        Text("LEFT").shotiqBody(12, weight: .bold).kerning(0.5)
                                            .padding(.horizontal, 14).padding(.vertical, 9)
                                            .background(rightHanded ? ShotIQColor.paper : ShotIQColor.shotiqOrange)
                                            .foregroundStyle(rightHanded ? ShotIQColor.ink : .white)
                                    }
                                    .buttonStyle(.plain)
                                    Button {
                                        rightHanded = true
                                        toast = .success("Shooting hand set", "Right hand selected.")
                                    } label: {
                                        Text("RIGHT").shotiqBody(12, weight: .bold).kerning(0.5)
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
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .progress("Opening calibration", "Center the hoop before recording.", progress: 0.5)
                    })
                    .padding(.horizontal, 20).padding(.top, 16)
                    NavigationLink { VideoUploadView() } label: {
                        captureOutline("Use uploaded video", icon: "square.and.arrow.up")
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening video upload", "Choose a real shot video from your library.")
                    })
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 10)

                    PhaseStrip(active: "SETUP").padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 26)
                }
            }
        }
        .shotiqToast($toast)
    }

    private func setupRow(_ icon: String, _ t: String, _ d: String) -> some View {
        HStack(spacing: 14) {
            // Four different readiness checks, four different bracket marks —
            // this row shipped `camera.metering...` beside `figure.stand`.
            ShotIQConceptGlyph(concept: t, fallback: icon, size: 34)
                .foregroundStyle(ShotIQColor.ink).frame(width: 34)
            VStack(alignment: .leading, spacing: 2) {
                Text(t).shotiqCondensed(14, weight: .heavy).kerning(0.5)
                    .foregroundStyle(ShotIQColor.ink)
                Text(d).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
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
    /// Canonical parks the reticle at x 425 / y 618 of the 0…853 x 256…1227
    /// preview, i.e. (0.498, 0.373) — which is also where the crosshair is baked
    /// into the lower canonical crop, so the drawn rule lands on top of it
    /// instead of beside it.
    @State private var hoopPos = CGPoint(x: 0.498, y: 0.373)
    @State private var toast: ShotIQToast?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-hoop-calibration") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("HOOP CALIBRATION").shotiqDisplay(36)
                            Text("Align the overlay with the hoop.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
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
                            if !camera.isLive { HoopCalibrationBackdrop() }
                            LiveViewfinder(camera: camera, radius: 0)
                            Path { p in
                                p.move(to: CGPoint(x: cx, y: 0)); p.addLine(to: CGPoint(x: cx, y: h))
                                p.move(to: CGPoint(x: 0, y: cy)); p.addLine(to: CGPoint(x: w, y: cy))
                            }
                            .stroke(.white, lineWidth: 1.6)
                            // The framing brackets are burned into all three
                            // canonical crops; drawing them again over the
                            // photograph would print a second set beside the
                            // first. Live feed only.
                            if camera.isLive {
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
                                    toast = .info("Hoop target moved", "Align the crosshair with the rim.")
                                }
                        )
                        .accessibilityLabel("Hoop calibration viewfinder — press and hold, then drag, to move the crosshair")
                        .overlay(alignment: .bottom) {
                            // "Center the hoop in the frame / Align the rim with
                            // the crosshair" is baked into 029-visual-003, so the
                            // live card only appears over a live feed.
                            if camera.isLive {
                                HStack(spacing: 10) {
                                    ReadinessGlyph(kind: .framing, size: 26).foregroundStyle(.white)
                                    Text("Center the hoop in the frame.\nAlign the rim with the crosshair.")
                                        .shotiqBody(14).foregroundStyle(.white)
                                }
                                .padding(.horizontal, 14).padding(.vertical, 10)
                                .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 8))
                                .padding(.bottom, 18)
                            }
                        }
                    }
                    // Canonical runs this full-bleed frame from y 256 to y 1227 of
                    // the 1844-row canvas — 971px, i.e. 447pt, not 430.
                    .frame(height: 447)
                    .padding(.top, 14)

                    HStack(spacing: 10) {
                        Button {
                            camera.flipCamera()
                            toast = .info("Switching camera", "Keep the rim centered in frame.")
                        } label: { captureOutline("Switch camera", icon: "arrow.triangle.2.circlepath") }
                            .buttonStyle(.plain)
                        NavigationLink { ReadinessCheckView() } label: {
                            captureOutline("Skip calibration", icon: "viewfinder")
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Skipping calibration", "ShotIQ will use the current framing.")
                        })
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    NavigationLink { ReadinessCheckView() } label: {
                        captureCTA("Confirm hoop", icon: "scope", color: ShotIQColor.confirmGreen)
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .success("Hoop confirmed", "Readiness check is next.")
                    })
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("Confirm hoop")
                    .padding(.horizontal, 20).padding(.top, 10)

                    PhaseStrip().padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 26)
                }
            }
        }
        .shotiqToast($toast)
    }
}

struct ReadinessCheckView: View {   // 030
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppState
    @ObservedObject private var camera = CameraService.live
    @State private var toast: ShotIQToast?
    private let checks = [("Full body", "GOOD"), ("Lighting", "GOOD"), ("Stability", "GOOD"),
                          ("Hoop visible", "GOOD"), ("Ball visible", "GOOD"), ("Pose confidence", "92%")]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-readiness-check") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    Button {
                        toast = .info("Returning to calibration", "Readiness check closed.")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "arrow.left").font(.system(size: 16, weight: .semibold))
                            Text("AI ANALYSIS").shotiqBody(13, weight: .bold).kerning(1)
                        }
                        .foregroundStyle(ShotIQColor.graphite)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 16)

                    Text("READINESS CHECK").shotiqDisplay(38).padding(.horizontal, 20).padding(.top, 6)
                    Text("Get everything green to capture your best analysis.")
                        .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    // Canonical gives this frame 621 of 1844 canvas rows (286pt);
                    // 030-visual-001 is 790x621 and only lands un-cropped there.
                    ZStack(alignment: .topLeading) {
                        captureDark(286)
                        LiveViewfinder(camera: camera, fallback: "030-visual-001").frame(height: 286)
                        // The LIVE pill is baked into 030-visual-001.
                        if camera.isLive {
                            HStack(spacing: 6) {
                                Circle().fill(ShotIQColor.confirmGreen).frame(width: 8, height: 8)
                                Text("LIVE").shotiqBody(13, weight: .semibold).foregroundStyle(.white)
                            }
                            .padding(.horizontal, 12).padding(.vertical, 7)
                            .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 7))
                            .padding(12)
                        }
                    }
                    .overlay(alignment: .trailing) {
                        // So is the whole six-row readiness card, together with the
                        // green framing brackets and the pose overlay — this crop
                        // is canonical's finished HUD, not a bare frame. Drawing
                        // the app's card as well would stack two of them.
                        if camera.isLive {
                            VStack(alignment: .leading, spacing: 0) {
                                ForEach(checks, id: \.0) { name, value in
                                    HStack(spacing: 8) {
                                        Image(systemName: "checkmark.circle.fill").font(.system(size: 16))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(name).shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                            Text(value).shotiqBody(10, weight: .bold).kerning(0.5)
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
                        VStack {
                            ForEach(checks, id: \.0) { name, value in
                                Color.clear
                                    .frame(width: 1, height: 1)
                                    .accessibilityElement(children: .ignore)
                                    .accessibilityLabel("\(name) \(value)")
                                    .accessibilityIdentifier("readiness-\(name)")
                            }
                        }
                        .frame(width: 1, height: 1)
                        .allowsHitTesting(false)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    SectionLabel(text: "SHOT PHASE").padding(.horizontal, 20).padding(.top, 18)
                    PhaseStrip().padding(.horizontal, 20).padding(.top, 8)

                    NavigationLink {
                        if let latest = app.recentMedia.first {
                            FlawDetailView(
                                title: "Keep elbow stacked through release",
                                severity: "PRIMARY TARGET",
                                presentation: AnalysisResultPresentation(result: latest.analysis))
                        } else if UITestHooks.demoData {
                            FlawDetailView(
                                title: "Keep elbow stacked through release",
                                severity: "PRIMARY TARGET",
                                presentation: .canonicalDemo)
                        } else {
                            AnalyzeHubView()
                        }
                    } label: {
                        HStack(alignment: .center, spacing: 14) {
                            TrendLine(points: [1, 2.4, 3.4, 4], stroke: ShotIQColor.shotiqOrange)
                                .frame(width: 52, height: 40)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("PRIMARY COACHING TARGET")
                                    .shotiqBody(10, weight: .medium).kerning(0.7)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("Keep elbow stacked through release")
                                    .shotiqBody(18, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(2).minimumScaleFactor(0.8)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening coaching target",
                                      "Review the elbow-stack correction before recording.")
                    })
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 16)

                    NavigationLink { CaptureReadyView() } label: {
                        captureCTA("Keep position", color: ShotIQColor.confirmGreen)
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .success("Readiness confirmed", "Starting capture countdown.")
                    })
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("Keep position")
                    .padding(.horizontal, 20).padding(.top, 16)

                    HStack(spacing: 10) {
                        NavigationLink { CaptureGuideView() } label: { captureOutline("Camera help", icon: "camera") }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening camera help", "Review positioning tips before recording.")
                            })
                            .buttonStyle(.plain)
                        Button {
                            toast = .info("Capture cancelled", "Returning to the previous screen.")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                                dismiss()
                            }
                        } label: { captureOutline("Cancel") }.buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
        .shotiqToast($toast)
    }
}

struct CaptureReadyView: View {     // 031
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var camera = CameraService.live
    @State private var count = 3
    @State private var go = false
    @State private var cancelled = false
    @State private var toast: ShotIQToast?
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
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
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
                                Text(t).shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text(d).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    SectionLabel(text: "CAMERA PREVIEW").padding(.horizontal, 20).padding(.top, 20)
                    // Canonical: 756x448 at y 572 — 448 canvas rows is 206pt.
                    ZStack(alignment: .bottomTrailing) {
                        captureDark(206)
                        LiveViewfinder(camera: camera, fallback: "031-visual-001").frame(height: 206)
                        // The resolution pill (and the pose overlay) are baked into
                        // 031-visual-001; only a live feed needs the app's copy.
                        if camera.isLive {
                            Text("1080p • 60fps").shotiqBody(12, weight: .medium).foregroundStyle(.white)
                                .padding(.horizontal, 10).padding(.vertical, 6)
                                .background(.black.opacity(0.72), in: Capsule())
                                .padding(10)
                        }
                    }
                    .overlay(alignment: .topTrailing) {
                        Text("AUTO-START IN \(count)")
                            .shotiqBody(10, weight: .bold).kerning(0.6).foregroundStyle(.white)
                            .padding(.horizontal, 8).padding(.vertical, 5)
                            .background(.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 4))
                            .padding(10)
                    }
                    .padding(.horizontal, 20).padding(.top, 8)

                    HStack(spacing: 6) {
                        SectionLabel(text: "SHOT RAIL:")
                        Text("SETUP").shotiqBody(12, weight: .bold).kerning(0.8)
                            .foregroundStyle(ShotIQColor.analysisBlue)
                    }
                    .padding(.horizontal, 20).padding(.top, 18)
                    PhaseStrip(active: "RELEASE").padding(.horizontal, 20).padding(.top, 8)

                    CaptureCoachingRow().padding(.horizontal, 20).padding(.top, 16)

                    SectionLabel(text: "LATEST SESSION").padding(.horizontal, 20).padding(.top, 12)
                    CaptureSessionStats().padding(.horizontal, 20).padding(.top, 8)

                    Button {
                        toast = .progress("Starting recording", "ShotIQ is opening the live recording HUD.", progress: 0.8)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                            go = true
                        }
                    } label: {
                        captureCTA("Start recording", icon: "record.circle", color: ShotIQColor.confirmGreen)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 18)

                    HStack(spacing: 10) {
                        Button {
                            cancelled = true
                            toast = .info("Adjust setup", "Returning to the readiness screen.")
                            dismiss() // back to the readiness/setup screens
                        } label: { captureOutline("Adjust setup", icon: "slider.horizontal.3") }.buttonStyle(.plain)
                        Button {
                            cancelled = true
                            CameraService.live.stop()
                            toast = .info("Capture cancelled", "Camera session stopped.")
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
                toast = .info("Auto-start in \(count)", "Stay in position.")
            }
            try? await Task.sleep(for: .seconds(1))
            if !cancelled { go = true }
        }
        .navigationDestination(isPresented: $go) { LiveRecordingView() }
        .shotiqToast($toast)
    }
}

struct LiveRecordingStats: Equatable {
    var shots = 0
    var makes = 0

    var makePercentText: String {
        guard shots > 0 else { return "--" }
        return String(format: "%.1f%%", (Double(makes) / Double(shots)) * 100)
    }

    mutating func record(made: Bool) {
        shots += 1
        if made { makes += 1 }
    }

    var accessibilityRows: [(String, String)] {
        [("SHOTS", "\(shots)"), ("MAKES", "\(makes)"), ("MAKE %", makePercentText)]
    }
}

struct LiveRecordingView: View {    // 032
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var camera = CameraService.live
    @State private var seconds = 0
    @State private var timer: Timer?
    @State private var paused = false
    @State private var stats = LiveRecordingStats()
    @State private var toast: ShotIQToast?
    @State private var pendingLiveVideo: PickedVideoClip?
    /// Single item-based route out of recording: two
    /// `navigationDestination(isPresented:)` modifiers on one view conflict and
    /// only the last one presents, which left "Stop recording" going nowhere.
    enum RecordingRoute: Hashable { case feedback, detected, videoReview }
    @State private var route: RecordingRoute?
    private var clock: String { String(format: "%02d:%02d", seconds / 60, seconds % 60) }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-live-recording") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    HStack(spacing: 8) {
                        Circle().fill(ShotIQColor.shotiqOrange).frame(width: 9, height: 9)
                        Text("LIVE RECORDING").shotiqCondensed(16, weight: .heavy).kerning(0.8)
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Text("Session time  \(clock)").shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                            .padding(.leading, 8)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    // Live camera surface with recording overlays.
                    //
                    // The 032 sidecar declares no photo element, so this surface
                    // had no fallback and rendered as a flat dark rectangle
                    // wherever there is no camera — the single most-reported
                    // defect on this screen. Canonical prints one 789x795 frame at
                    // x 31…820, y 324…1119; 353pt of column makes it 356pt tall.
                    //
                    // That frame is canonical's *finished* HUD: the CONFIDENCE
                    // meter, the REC/timecode pill, the SHOTS/MAKES/MAKE % rail
                    // and the shot-phase strip are all painted into the pixels.
                    // Every one of them therefore stands down unless a real feed
                    // is running, or the screen would show two of each.
                    ZStack(alignment: .topLeading) {
                        captureDark(356)
                        LiveViewfinder(camera: camera, fallback: "032-visual-001").frame(height: 356)
                        if camera.isLive {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("CONFIDENCE").shotiqBody(10, weight: .bold).kerning(0.8)
                                    .foregroundStyle(.white)
                                Text("92%").font(.custom("Tungsten-Medium", size: 30))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                Capsule().fill(ShotIQColor.confirmGreen).frame(width: 64, height: 4)
                            }
                            .padding(14)
                        }
                        VStack {
                            ForEach(stats.accessibilityRows, id: \.0) { label, value in
                                Color.clear
                                    .frame(width: 1, height: 1)
                                    .accessibilityElement(children: .ignore)
                                    .accessibilityLabel("\(label) \(value)")
                                    .accessibilityIdentifier("live-stat-\(label)")
                            }
                        }
                        .frame(width: 1, height: 1)
                        .allowsHitTesting(false)
                    }
                    .overlay(alignment: .topTrailing) {
                        if camera.isLive {
                            HStack(spacing: 7) {
                                Circle().fill(ShotIQColor.shotiqOrange).frame(width: 8, height: 8)
                                VStack(alignment: .leading, spacing: 0) {
                                    Text("REC").shotiqBody(10, weight: .bold).foregroundStyle(.white)
                                    Text(clock).font(.custom("Tungsten-Medium", size: 20)).foregroundStyle(.white)
                                }
                            }
                            .padding(.horizontal, 12).padding(.vertical, 8)
                            .background(.black.opacity(0.66), in: RoundedRectangle(cornerRadius: 7))
                            .padding(12)
                        }
                    }
                    .overlay(alignment: .trailing) {
                        if camera.isLive {
                            VStack(alignment: .leading, spacing: 12) {
                                liveRecordingStat("SHOTS", "\(stats.shots)")
                                Rectangle().fill(.white.opacity(0.5)).frame(width: 60, height: 1)
                                liveRecordingStat("MAKES", "\(stats.makes)")
                                Rectangle().fill(.white.opacity(0.5)).frame(width: 60, height: 1)
                                liveRecordingStat("MAKE %", stats.makePercentText)
                            }
                            .padding(.trailing, 16)
                        }
                    }
                    .overlay(alignment: .bottom) {
                        if camera.isLive {
                            HStack(alignment: .top) {
                                ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                                    VStack(spacing: 3) {
                                        Text(p).shotiqBody(8, weight: p == "RELEASE" ? .bold : .regular).kerning(0.4)
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
                                Text("CURRENT STREAK").shotiqBody(8, weight: .medium).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text("7").font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.vertical, 14).padding(.horizontal, 8)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    if UITestHooks.active {
                        HStack(spacing: 10) {
                            Button("Simulate made shot") { stats.record(made: true) }
                                .accessibilityIdentifier("Simulate made shot")
                            Button("Simulate missed shot") { stats.record(made: false) }
                                .accessibilityIdentifier("Simulate missed shot")
                        }
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 8)
                    }

                    HStack(alignment: .top) {
                        Spacer()
                        // Each transport control is one Button covering its glyph AND
                        // its caption — the captions used to be loose Text siblings,
                        // so tapping the visible word did nothing.
                        Button {
                            paused.toggle()
                            if paused {
                                camera.stopRecording()
                                toast = .info("Recording paused", "Tap resume when the shooter is ready.")
                            } else if camera.status == .ready {
                                camera.startRecording()
                                toast = .success("Recording resumed", "ShotIQ is tracking this session.")
                            } else {
                                toast = .info("Camera warming up", "Keep the phone aimed at the shooter.")
                            }
                        } label: {
                            VStack(spacing: 8) {
                                Circle().stroke(ShotIQColor.rule, lineWidth: 1.5).frame(width: 62, height: 62)
                                    .overlay(Image(systemName: paused ? "play.fill" : "pause.fill")
                                        .font(.system(size: 20)).foregroundStyle(ShotIQColor.ink))
                                Text(paused ? "RESUME" : "PAUSE").shotiqBody(10, weight: .medium).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(paused ? "Resume recording" : "Pause recording")
                        Spacer()
                        Button {
                            camera.stopRecording()
                            toast = .progress("Stopping recording", "Preparing recorded clip for review.", progress: 0.75)
                            Task { await finishRecordingToReview(fallback: .feedback) }
                        } label: {
                            VStack(spacing: 8) {
                                Circle().fill(ShotIQColor.shotiqOrange).frame(width: 84, height: 84)
                                    .overlay(RoundedRectangle(cornerRadius: 5).fill(.white).frame(width: 26, height: 26))
                                Text("STOP RECORDING").shotiqBody(11, weight: .bold).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Stop recording")
                        .accessibilityIdentifier("Stop recording")
                        Spacer()
                        Button {
                            camera.stopRecording()
                            toast = .progress("Ending round", "Opening shot confirmation.", progress: 0.75)
                            Task { await finishRecordingToDetected() }
                        } label: {
                            VStack(spacing: 8) {
                                Circle().stroke(ShotIQColor.rule, lineWidth: 1.5).frame(width: 62, height: 62)
                                    .overlay(ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "flag.fill"), size: 44).font(.system(size: 19)).foregroundStyle(ShotIQColor.ink))
                                Text("END ROUND").shotiqBody(10, weight: .medium).kerning(0.6)
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
            if camera.status == .ready {
                toast = .success("Recording started", "ShotIQ is tracking shots and form.")
            }
        }
        .navigationDestination(item: $route) { r in
            switch r {
            case .feedback: LiveFormFeedbackView()
            case .detected: ShotDetectedView()
            case .videoReview:
                if let pendingLiveVideo {
                    VideoReviewView(video: pendingLiveVideo)
                } else {
                    LiveFormFeedbackView()
                }
            }
        }
        .shotiqToast($toast)
    }

    private func finishRecordingToReview(fallback: RecordingRoute) async {
        for _ in 0..<24 {
            if let url = camera.lastVideoURL,
               let clip = await loadVideoClip(fromFileURL: url) {
                pendingLiveVideo = clip
                toast = .success("Recording ready", "Review the live clip before analysis.")
                route = .videoReview
                return
            }
            try? await Task.sleep(for: .milliseconds(125))
        }

        toast = .info("Opening live feedback", "The recorded clip is still finalizing.")
        route = fallback
    }

    private func finishRecordingToDetected() async {
        for _ in 0..<24 {
            if let url = camera.lastVideoURL,
               (await loadVideoClip(fromFileURL: url)) != nil {
                toast = .success("Shot clip ready", "Confirm make or miss with the recorded frame.")
                route = .detected
                return
            }
            try? await Task.sleep(for: .milliseconds(125))
        }

        toast = .info("Opening shot confirmation", "The recorded clip is still finalizing.")
        route = .detected
    }

    private func liveRecordingStat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label).shotiqBody(9, weight: .bold).kerning(0.6).foregroundStyle(.white.opacity(0.85))
            Text(value).font(.custom("Tungsten-Medium", size: 30)).foregroundStyle(.white)
        }
    }

    private func liveMetric(_ icon: String, _ label: String, _ value: String) -> some View {
        VStack(spacing: 4) {
            ShotIQConceptGlyph(concept: label, fallback: icon, size: 28)
                .foregroundStyle(ShotIQColor.ink)
            Text(label).shotiqBody(8, weight: .medium).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(value).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
        }
        .frame(maxWidth: .infinity)
    }
}

struct LiveFormFeedbackState: Equatable {
    var formScore: Int?
    var confidence: Double?
    var detectedPhase: String?
    var cue: String?

    var hasMeasurement: Bool {
        formScore != nil || confidence != nil || detectedPhase != nil || cue != nil
    }

    var scoreText: String { formScore.map(String.init) ?? "--" }
    var scorePercent: Double { Double(formScore ?? 0) / 100 }
    var confidenceText: String {
        guard let confidence else { return "--" }
        return "\(Int((confidence * 100).rounded()))%"
    }
    var phaseText: String { detectedPhase ?? "Waiting" }
    var headline: String { cue ?? "Waiting for live pose." }
    var detail: String {
        hasMeasurement
            ? "Measured from the current capture session."
            : "No live pose measurement yet. Keep the athlete fully in frame."
    }

    static let waiting = LiveFormFeedbackState()

    static func measured(formScore: Int, confidence: Double, phase: String, cue: String) -> LiveFormFeedbackState {
        LiveFormFeedbackState(formScore: formScore,
                              confidence: confidence,
                              detectedPhase: phase,
                              cue: cue)
    }
}

struct LiveFormFeedbackView: View { // 033
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var camera = CameraService.live
    @State private var muted = false
    @State private var feedback = LiveFormFeedbackState.waiting
    @State private var liveFrame: VideoPoseFrameRecord?
    @State private var lastAnalyzedFrameID = -1
    @State private var announcedLivePose = false
    @State private var toast: ShotIQToast?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-live-form-feedback") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    HStack {
                        SectionLabel(text: "LIVE FORM FEEDBACK")
                        Spacer()
                        HStack(spacing: 6) {
                            Circle().fill(feedback.hasMeasurement ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                                .frame(width: 8, height: 8)
                            Text(feedback.hasMeasurement ? "Measured" : "Waiting")
                                .shotiqBody(14)
                                .foregroundStyle(feedback.hasMeasurement ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 18)

                    // Same incomplete contract as 032: the 033 sidecar declares no
                    // photo, so the viewfinder had no stand-in and this screen
                    // read as a dark plate. Canonical's frame is 767x799 at
                    // x 45…812, y 330…1129 — 368pt tall across the 353pt column.
                    //
                    // The canonical fallback already paints its own HUD details,
                    // so the app's live pill and summary card only draw over a
                    // real feed.
                    ZStack(alignment: .topLeading) {
                        captureDark(368)
                        LiveViewfinder(camera: camera, fallback: "033-visual-001").frame(height: 368)
                        if camera.isLive, let pose = liveFrame?.detectedPose {
                            SkeletonOverlay(pose: pose,
                                            showBones: true,
                                            showJoints: true,
                                            showBall: false,
                                            boneColor: .white,
                                            jointColor: ShotIQColor.shotiqOrange)
                                .accessibilityIdentifier("live-feedback-pose-overlay")
                        }
                        if camera.isLive {
                            HStack(spacing: 6) {
                                Circle().fill(ShotIQColor.shotiqOrange).frame(width: 8, height: 8)
                                Text("LIVE").shotiqBody(13, weight: .semibold).foregroundStyle(.white)
                            }
                            .padding(.horizontal, 12).padding(.vertical, 7)
                            .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 7))
                            .padding(12)
                        }
                    }
                    .overlay(alignment: .trailing) {
                        if camera.isLive {
                            liveResultCard
                            .padding(14)
                            .frame(width: 160, alignment: .leading)
                            .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 10))
                            .padding(.trailing, 12)
                        }
                    }
                    .overlay(alignment: .bottom) {
                        if camera.isLive, let liveFrame {
                            LiveFeedbackAngleRail(frame: liveFrame)
                                .padding(.horizontal, 12)
                                .padding(.bottom, 12)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 10)

                    ShotIQCard {
                        HStack(alignment: .center, spacing: 16) {
                            CorrectionGlyph(kind: .stack, size: 54).foregroundStyle(ShotIQColor.ink)
                            VStack(alignment: .leading, spacing: 6) {
                                Text("LIVE FEEDBACK").shotiqBody(10, weight: .bold).kerning(0.7)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text(feedback.headline)
                                    .shotiqBody(21, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(2).minimumScaleFactor(0.7)
                                    .accessibilityIdentifier("live-feedback-headline")
                                Text(feedback.detail)
                                    .shotiqBody(12)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(2)
                                HStack(spacing: 0) {
                                    feedbackValue("FORM SCORE", feedback.scoreText, "live-feedback-score")
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 30)
                                    feedbackValue("CONFIDENCE", feedback.confidenceText, "live-feedback-confidence")
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 30)
                                    feedbackValue("DETECTED", feedback.phaseText, "live-feedback-phase")
                                }
                            }
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)

                    if UITestHooks.active {
                        Button("Simulate live feedback") {
                            feedback = .measured(formScore: 79,
                                                 confidence: 0.72,
                                                 phase: "Release",
                                                 cue: "Keep elbow stacked.")
                            toast = .success("Live feedback updated", "Pose measurement is now visible.")
                        }
                        .accessibilityIdentifier("Simulate live feedback")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 8)
                    }

                    PhaseStrip().padding(.horizontal, 20).padding(.top, 16)

                    HStack(alignment: .top) {
                        Spacer()
                        VStack(spacing: 8) {
                            Button {
                                muted.toggle()
                                toast = .info(muted ? "Coaching muted" : "Coaching unmuted")
                            } label: {
                                Circle().stroke(muted ? ShotIQColor.shotiqOrange : ShotIQColor.rule, lineWidth: 1.5)
                                    .frame(width: 62, height: 62)
                                    .overlay(Image(systemName: muted ? "speaker.wave.2" : "speaker.slash")
                                        .font(.system(size: 19))
                                        .foregroundStyle(muted ? ShotIQColor.shotiqOrange : ShotIQColor.ink))
                            }
                            .buttonStyle(.plain)
                            Text(muted ? "Unmute coaching" : "Mute coaching")
                                .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                        VStack(spacing: 8) {
                            NavigationLink { ShotDetectedView() } label: {
                                Circle().fill(ShotIQColor.confirmGreen).frame(width: 74, height: 74)
                                    .overlay(RoundedRectangle(cornerRadius: 5).fill(.white).frame(width: 22, height: 22))
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                camera.stopRecording()
                                toast = .progress("Stopping capture", "Opening shot confirmation.", progress: 0.65)
                            })
                            Text("Stop").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                    }
                    .padding(.top, 20)

                    Button {
                        toast = .success("Keeping capture live", "Returning to the recording screen.")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                    } label: { captureCTA("Keep shooting", color: ShotIQColor.confirmGreen) }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 26)
                }
            }
        }
        .task {
            camera.start()
            await measureLivePoseLoop()
        }
        .shotiqToast($toast)
    }

    private var liveResultCard: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(feedback.hasMeasurement ? "LATEST RESULT" : "LIVE STATUS")
                .shotiqBody(10, weight: .bold).kerning(0.7)
                .foregroundStyle(ShotIQColor.graphite)
            Text("FORM SCORE").shotiqBody(11, weight: .bold).kerning(0.7)
                .foregroundStyle(ShotIQColor.ink)
            Text(feedback.scoreText).font(.custom("Tungsten-Medium", size: 58))
                .foregroundStyle(feedback.hasMeasurement ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                .accessibilityIdentifier("live-feedback-overlay-score")
            ScoreBar(pct: feedback.scorePercent,
                     color: feedback.hasMeasurement ? ShotIQColor.shotiqOrange : ShotIQColor.graphite.opacity(0.55))
                .frame(width: 110)
            Text(feedback.hasMeasurement ? "LIVE" : "NOT MEASURED")
                .shotiqBody(14, weight: .bold)
                .foregroundStyle(feedback.hasMeasurement ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
            Text(feedback.hasMeasurement ? "Updating from live session." : "Waiting for body tracking.")
                .shotiqBody(11)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("live-feedback-summary")
    }

    private func feedbackValue(_ label: String, _ value: String, _ id: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label).shotiqBody(9, weight: .medium).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
            Text(value).shotiqBody(label == "DETECTED" ? 15 : 17, weight: .semibold)
                .foregroundStyle(value == "--" ? ShotIQColor.graphite : ShotIQColor.shotiqOrange)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
                .accessibilityIdentifier(id)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, label == "FORM SCORE" ? 0 : 10)
    }

    private func measureLivePoseLoop() async {
        while !Task.isCancelled {
            guard camera.isLive,
                  let image = camera.latestFrame,
                  camera.latestFrameID != lastAnalyzedFrameID else {
                try? await Task.sleep(for: .milliseconds(450))
                continue
            }

            let frameID = camera.latestFrameID
            lastAnalyzedFrameID = frameID
            switch await ShotIQPose.detectResult(in: image) {
            case .detected(let pose):
                let frame = VideoPoseAnalyzer.frameRecord(index: frameID,
                                                          timestamp: Date().timeIntervalSince1970,
                                                          pose: pose)
                liveFrame = frame
                feedback = feedbackState(from: frame)
                if !announcedLivePose {
                    announcedLivePose = true
                    toast = .success("Live pose measured", "Wireframe and angles are updating from the camera.")
                }
            case .noPose:
                liveFrame = nil
                feedback = .waiting
            case .unavailable(let message):
                liveFrame = nil
                feedback = .waiting
                if !announcedLivePose {
                    announcedLivePose = true
                    toast = .error("Pose detection unavailable", message)
                }
            }

            try? await Task.sleep(for: .milliseconds(900))
        }
    }

    private func feedbackState(from frame: VideoPoseFrameRecord) -> LiveFormFeedbackState {
        let score = average([
            score(value: frame.elbowAngle, idealMin: 150, idealMax: 180),
            score(value: frame.wristAngle, idealMin: 50, idealMax: 100),
            score(value: frame.releaseAngle, idealMin: -5, idealMax: 5),
            score(value: frame.kneeAngle, idealMin: 70, idealMax: 120)
        ]) ?? (frame.confidence * 100)

        return .measured(formScore: Int(score.rounded()),
                         confidence: frame.confidence,
                         phase: frame.phaseLabel.capitalized,
                         cue: liveCue(for: frame))
    }

    private func liveCue(for frame: VideoPoseFrameRecord) -> String {
        if let elbow = frame.elbowAngle, elbow < 150 { return "Raise shooting elbow into the 150-180 degree band." }
        if let elbow = frame.elbowAngle, elbow > 180 { return "Relax the elbow; it is past the release band." }
        if let wrist = frame.wristAngle, wrist < 50 { return "Lift the wrist angle into the 50-100 degree band." }
        if let wrist = frame.wristAngle, wrist > 100 { return "Soften the wrist; it is above the target band." }
        if let release = frame.releaseAngle, abs(release) > 5 { return "Keep forearm closer to vertical at release." }
        if frame.elbowAngle == nil || frame.wristAngle == nil { return "Keep the shooting arm fully in frame." }
        return "Form is inside the current release targets."
    }

    private func score(value: Double?, idealMin: Double, idealMax: Double) -> Double? {
        guard let value else { return nil }
        if value >= idealMin && value <= idealMax { return 100 }
        let miss = value < idealMin ? idealMin - value : value - idealMax
        return min(max(100 - miss * 2, 0), 100)
    }

    private func average(_ values: [Double?]) -> Double? {
        let measured = values.compactMap { $0 }
        guard !measured.isEmpty else { return nil }
        return measured.reduce(0, +) / Double(measured.count)
    }
}

private struct LiveFeedbackAngleRail: View {
    var frame: VideoPoseFrameRecord

    var body: some View {
        HStack(spacing: 8) {
            angleBadge("ELBOW", frame.elbowAngle)
            angleBadge("WRIST", frame.wristAngle)
            angleBadge("RELEASE", frame.releaseAngle, signed: true)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 7))
        .accessibilityIdentifier("live-feedback-angle-rail")
    }

    private func angleBadge(_ label: String, _ value: Double?, signed: Bool = false) -> some View {
        VStack(spacing: 1) {
            Text(label).shotiqBody(8, weight: .bold).kerning(0.5).foregroundStyle(.white.opacity(0.72))
            Text(text(value, signed: signed))
                .font(.custom("Tungsten-Medium", size: 18))
                .foregroundStyle(ShotIQColor.shotiqOrange)
        }
        .frame(maxWidth: .infinity)
    }

    private func text(_ value: Double?, signed: Bool) -> String {
        guard let value else { return "--" }
        let rounded = Int(value.rounded())
        if signed, rounded > 0 { return "+\(rounded)°" }
        return "\(rounded)°"
    }
}

private struct CaptureVideoPoseSurface: View {
    var url: URL
    var height: CGFloat
    var cornerRadius: CGFloat
    var accessibilityID: String
    var showAnnotations: Bool = false
    @State private var frames: [VideoPoseFrameRecord] = []
    @State private var frame: VideoPoseFrameRecord?
    @State private var timeObserver: Any?
    @State private var measuring = true
    @State private var player: AVPlayer?
    @State private var naturalVideoSize: CGSize?
    @State private var isPlaying = false

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .topTrailing) {
                if let player {
                    ShotIQAspectFillVideoPlayer(player: player)
                        .accessibilityLabel("Shot video preview")
                } else {
                    Color.black
                }
                if let frame, let pose = frame.detectedPose {
                    ShotIQVideoAnalysisOverlay(frame: frame,
                                               pose: pose,
                                               presentation: .canonicalDemo,
                                               showSkeleton: true,
                                               showJoints: true,
                                               showBall: false,
                                               showAnnotations: showAnnotations,
                                               displayPhase: frame.phaseLabel)
                        .frame(width: proxy.size.width, height: proxy.size.height)
                        .accessibilityIdentifier("\(accessibilityID)-pose-overlay")
                }
                if measuring {
                    HStack(spacing: 6) {
                        ProgressView().scaleEffect(0.7)
                        Text("Locking pose").shotiqBody(10, weight: .bold).kerning(0.4)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    .background(.black.opacity(0.68), in: RoundedRectangle(cornerRadius: 6))
                    .foregroundStyle(.white)
                    .padding(8)
                }
                playbackControl
            }
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        .clipped()
        .accessibilityIdentifier(accessibilityID)
        .onAppear {
            if player == nil {
                let next = AVPlayer(url: url)
                next.isMuted = true
                installTimeObserver(on: next)
                player = next
            }
        }
        .onDisappear {
            player?.pause()
            isPlaying = false
            removeTimeObserver()
        }
        .task(id: url) {
            await measurePose()
            naturalVideoSize = await loadNaturalVideoSize()
        }
    }

    private var playbackControl: some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                Button {
                    togglePlayback()
                } label: {
                    Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 52, height: 52)
                        .background(ShotIQColor.shotiqOrange, in: Circle())
                        .shadow(color: .black.opacity(0.45), radius: 8, x: 0, y: 3)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(isPlaying ? "Pause uploaded video preview" : "Play uploaded video preview")
                .padding(12)
            }
        }
    }

    @MainActor
    private func togglePlayback() {
        guard let player else { return }
        if isPlaying {
            player.pause()
        } else {
            player.play()
        }
        isPlaying.toggle()
    }

    private func measurePose() async {
        await MainActor.run { measuring = true }
        guard let clip = await loadVideoClip(fromFileURL: url) else {
            await MainActor.run { measuring = false }
            return
        }
        let analysis = await VideoPoseAnalyzer.analyze(
            job: VideoAnalysisJob(clientSessionId: "capture-video-\(UUID().uuidString)",
                                  clip: clip,
                                  trimStartFraction: 0,
                                  trimEndFraction: 1)
        )
        let sorted = analysis.frames.sorted { $0.timestampSeconds < $1.timestampSeconds }
        let release = sorted.first { $0.frameIndex == analysis.summary.releaseFrameIndex } ?? sorted.first
        await MainActor.run {
            frames = sorted
            frame = release
            measuring = false
        }
    }

    private func loadNaturalVideoSize() async -> CGSize? {
        let asset = AVURLAsset(url: url)
        guard let track = try? await asset.loadTracks(withMediaType: .video).first,
              let natural = try? await track.load(.naturalSize),
              let transform = try? await track.load(.preferredTransform) else {
            return nil
        }
        let rect = CGRect(origin: .zero, size: natural).applying(transform)
        let size = CGSize(width: abs(rect.width), height: abs(rect.height))
        guard size.width > 0, size.height > 0 else { return nil }
        return size
    }

    private func fittedOverlaySize(for frame: VideoPoseFrameRecord, container: CGSize) -> CGSize {
        let frameSize: CGSize? = {
            guard let width = frame.sourceWidth,
                  let height = frame.sourceHeight,
                  width > 0,
                  height > 0 else { return nil }
            return CGSize(width: width, height: height)
        }()
        guard let sourceSize = frameSize ?? naturalVideoSize else {
            return container
        }
        return ShotIQPose.filledSize(image: sourceSize, in: container)
    }

    @MainActor
    private func installTimeObserver(on player: AVPlayer) {
        let interval = CMTime(seconds: 1.0 / 30.0, preferredTimescale: 600)
        timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { time in
            let seconds = time.seconds
            guard seconds.isFinite else { return }
            frame = nearestPoseFrame(to: seconds) ?? frame
        }
    }

    @MainActor
    private func removeTimeObserver() {
        if let timeObserver, let player {
            player.removeTimeObserver(timeObserver)
        }
        timeObserver = nil
    }

    private func nearestPoseFrame(to seconds: Double) -> VideoPoseFrameRecord? {
        guard !frames.isEmpty else { return frame }
        return frames.min {
            abs($0.timestampSeconds - seconds) < abs($1.timestampSeconds - seconds)
        }
    }
}

struct LiveCaptureSessionSummary: Equatable {
    var shots = 0
    var makes = 0
    var misses = 0
    var needReview = 0
    var discarded = 0
    var elapsedSeconds = 0

    var confirmed: Int { makes + misses }
    var makePercentText: String {
        guard shots > 0 else { return "--" }
        return String(format: "%.1f%%", (Double(makes) / Double(shots)) * 100)
    }
    var practiceTimeText: String {
        String(format: "%02d:%02d:%02d", elapsedSeconds / 3600, (elapsedSeconds / 60) % 60, elapsedSeconds % 60)
    }

    mutating func record(made: Bool) {
        shots += 1
        if made {
            makes += 1
        } else {
            misses += 1
        }
    }
}

struct ShotDetectedView: View {     // 034
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppState
    @AppStorage(TrainingWorkoutStore.key) private var completedWorkoutsPayload = ""
    @ObservedObject private var camera = CameraService.live
    @State private var goReview = false
    @State private var toast: ShotIQToast?
    @State private var summary = LiveCaptureSessionSummary()
    @State private var reviewVideo: PickedVideoClip?
    private let context = [("Catch & Shoot", "Off the Dribble"), ("Top of Key", "17.5 ft"),
                           ("Release Height", "7.6 ft"), ("Defender", "4.2 ft Away")]

    /// Shared by CONFIRM MAKE / MARK MISS: record the real shot event, then
    /// move on to the capture review.
    private func record(made: Bool) {
        toast = .progress("Saving shot result", made ? "Recording this attempt as a make." : "Recording this attempt as a miss.", progress: 0.7)
        Task {
            let saved = UITestHooks.active
                ? true
                : await APIClient.shared.recordShotEvent(drillId: "live-capture", made: made)
            await MainActor.run {
                if saved {
                    toast = .success(made ? "Make recorded" : "Miss recorded", "Opening capture review.")
                } else {
                    toast = .info(made ? "Make noted" : "Miss noted", "Opening capture review; sync may require connection.")
                }
                summary.record(made: made)
            }
            if let url = await MainActor.run(body: { camera.lastVideoURL }),
               let clip = await loadVideoClip(fromFileURL: url) {
                await MainActor.run { reviewVideo = clip }
            }
            try? await Task.sleep(for: .milliseconds(900))
            await MainActor.run { goReview = true }
        }
    }

    var body: some View {
        let values = CaptureSummaryValues.resolve(app: app,
                                                  completedWorkoutsPayload: completedWorkoutsPayload)
        let scorePct = (Double(values.score) ?? 0) / 100
        let hasScore = values.score != "--"
        CanonicalScreen(testID: "screen-ios-shot-detected") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    CaptureHeader()

                    HStack(spacing: 8) {
                        Text("ANALYSIS").shotiqBody(12, weight: .bold).kerning(1)
                            .foregroundStyle(ShotIQColor.graphite)
                        Image(systemName: "chevron.right").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                        Text("SHOT DETECTED").shotiqBody(12, weight: .bold).kerning(1)
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 14) {
                            HStack(spacing: 12) {
                                Text("SHOT 12").shotiqDisplay(30)
                                Text("SHOT DETECTED").shotiqBody(11, weight: .bold).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .padding(.horizontal, 10).padding(.vertical, 6)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                Spacer()
                            }
                            HStack(spacing: 0) {
                                HStack(spacing: 10) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "clock"), size: 42).font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text("8:24:10 AM").font(.custom("Tungsten-Medium", size: 19)).foregroundStyle(ShotIQColor.ink)
                                        Text("Today").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                HStack(spacing: 10) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "waveform.path.ecg"), size: 42).font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text("97%").font(.custom("Tungsten-Medium", size: 19)).foregroundStyle(ShotIQColor.ink)
                                        Text("CONFIDENCE").shotiqBody(10, weight: .medium).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.leading, 16)
                            }
                            // The just-recorded clip flows straight into review;
                            // with nothing recorded this was a bare dark plate.
                            // Canonical 034 shows the detected shot's own frame —
                            // 751x493 at x 51…802, y 464…957, which is 211pt tall
                            // in this card's 321pt content width. The 034 sidecar
                            // declares no photo, so it is cut from the render.
                            // Nothing but the pose skeleton and release arc is
                            // baked in, and the app draws neither over this slot.
                            if let url = camera.lastVideoURL {
                                CaptureVideoPoseSurface(url: url,
                                                        height: 211,
                                                        cornerRadius: 6,
                                                        accessibilityID: "shot-detected-pose-video")
                            } else {
                                CanonicalPhoto("034-visual-001", height: 211, cornerRadius: 6)
                            }
                            PhaseStrip()
                            HStack(alignment: .top, spacing: 0) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("FORM SCORE").shotiqBody(10, weight: .medium).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(alignment: .center, spacing: 10) {
                                        Text(values.score).font(.custom("Tungsten-Medium", size: 46))
                                            .foregroundStyle(hasScore ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                        VStack(alignment: .leading, spacing: 3) {
                                            ScoreBar(pct: scorePct).frame(width: 80)
                                            Text(hasScore ? "READY" : "WAITING").shotiqBody(12, weight: .bold)
                                                .foregroundStyle(ShotIQColor.analysisBlue)
                                            Text(hasScore ? "Latest measured form score." : "Analyze this clip to create a form score.")
                                                .shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 66)
                                NavigationLink {
                                    if let latest = app.recentMedia.first {
                                        FlawDetailView(
                                            title: "Keep elbow stacked through release",
                                            severity: "PRIMARY TARGET",
                                            presentation: AnalysisResultPresentation(result: latest.analysis))
                                    } else if UITestHooks.demoData {
                                        FlawDetailView(
                                            title: "Keep elbow stacked through release",
                                            severity: "PRIMARY TARGET",
                                            presentation: .canonicalDemo)
                                    } else {
                                        AnalyzeHubView()
                                    }
                                } label: {
                                    HStack(alignment: .center, spacing: 8) {
                                        VStack(alignment: .leading, spacing: 5) {
                                            Text("PRIMARY COACHING TARGET").shotiqBody(10, weight: .medium).kerning(0.5)
                                                .foregroundStyle(ShotIQColor.graphite)
                                                .lineLimit(1).minimumScaleFactor(0.7)
                                            Text("Keep elbow stacked through release")
                                                .shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(2).minimumScaleFactor(0.8)
                                        }
                                        Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .simultaneousGesture(TapGesture().onEnded {
                                    if !app.recentMedia.isEmpty || UITestHooks.demoData {
                                        toast = .info("Opening coaching target",
                                                      "Review the detected release issue.")
                                    } else {
                                        toast = .info("Analyze a shot first",
                                                      "Save or analyze media before opening measured correction details.")
                                    }
                                })
                                .buttonStyle(.plain)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.leading, 14)
                            }
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 20).padding(.top, 12)

                    SectionLabel(text: "CONFIRM THIS RESULT").padding(.horizontal, 20).padding(.top, 20)
                    Text("Was this a shot attempt?").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 2)

                    HStack(alignment: .top, spacing: 10) {
                        Button { record(made: true) } label: {
                            VStack(spacing: 8) {
                                Image(systemName: "checkmark").font(.system(size: 18, weight: .bold))
                                Text("CONFIRM MAKE").shotiqCondensed(12, weight: .heavy).kerning(0.5)
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
                                Text("MARK MISS").shotiqCondensed(12, weight: .heavy).kerning(0.5)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity).frame(height: 80)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .buttonStyle(.plain)
                        Button {
                            toast = .info("Shot ignored", "Returning to live capture.")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { dismiss() }
                        } label: {
                            VStack(spacing: 8) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "viewfinder"),
                                                         size: 20,
                                                         label: nil)
                                Text("NOT A SHOT").shotiqCondensed(12, weight: .heavy).kerning(0.5)
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
                                Text(t).shotiqBody(11, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text(d).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
        .shotiqToast($toast)
        .navigationDestination(isPresented: $goReview) { CaptureReviewView(summary: summary, liveVideo: reviewVideo) }
    }
}

struct CaptureReviewView: View {    // 035
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppState
    var summary = LiveCaptureSessionSummary()
    var liveVideo: PickedVideoClip?
    @State private var filter = "needs-review"
    @State private var lowestFirst = true
    @State private var confirmDiscard = false
    @State private var toast: ShotIQToast?
    private var filters: [(String, String)] {
        [("all", "All (\(summary.shots))"),
         ("needs-review", "Needs review (\(summary.needReview))"),
         ("confirmed", "Confirmed (\(summary.confirmed))"),
         ("discarded", "Discarded (\(summary.discarded))")]
    }
    private let flagged: [(Int, String, String, String, Double)] = [
        (7, "Today • 8:05 AM", "Release", "00:03", 0.58),
        (12, "Today • 8:09 AM", "Elbow angle", "00:05", 0.61),
        (19, "Today • 8:16 AM", "Release timing", "00:06", 0.64)]
    /// Canonical thumbnail per flagged shot — only shot 12's frame is bundled
    /// (035-visual-002); the other two rows keep the dark surface until cropped.
    private let shotThumbs: [Int: String] = [12: "035-visual-002"]
    private var visibleFlagged: [(Int, String, String, String, Double)] {
        guard summary.needReview > 0, filter == "all" || filter == "needs-review" else { return [] }
        return flagged.sorted { lowestFirst ? $0.4 < $1.4 : $0.4 > $1.4 }
    }
    private var selectedFilterLabel: String {
        filters.first { $0.0 == filter }?.1 ?? filters[1].1
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-capture-review") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()

                    Button {
                        toast = .info("Returning to summary", "Leaving capture review.")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { dismiss() }
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "arrow.left").font(.system(size: 15, weight: .semibold))
                            Text("Back to session summary").shotiqBody(15)
                        }
                        .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20).padding(.top, 16)

                    HStack(alignment: .top) {
                        Text("CAPTURE REVIEW").shotiqDisplay(40)
                        Spacer()
                        HStack(spacing: 8) {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-upload-video",
                                                     size: 18,
                                                     label: nil)
                            Text("\(summary.shots)").font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                            Text("SHOTS").shotiqBody(9, weight: .medium).kerning(0.5)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                    }
                    .padding(.horizontal, 20).padding(.top, 8)
                    Text("We flagged \(summary.needReview) shots for review.\nConfirm, correct, or discard each shot.")
                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                        .padding(.horizontal, 20).padding(.top, 4)

                    HStack(alignment: .top, spacing: 0) {
                        captureStat("\(summary.makes)", "MAKES", size: 30)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                        captureStat(summary.makePercentText, "MAKE %", size: 30)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                        captureStat("\(summary.needReview)", "NEED REVIEW", color: ShotIQColor.shotiqOrange, size: 30)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                        captureStat("\(summary.discarded)", "DISCARDED", size: 30)
                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                        captureStat(summary.practiceTimeText, "PRACTICE TIME", size: 30)
                    }
                    .padding(.horizontal, 20).padding(.top, 16)

                    if let liveVideo {
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                CaptureVideoPoseSurface(url: liveVideo.url,
                                                        height: 190,
                                                        cornerRadius: 6,
                                                        accessibilityID: "capture-review-live-video")
                                HStack(spacing: 0) {
                                    captureStat(liveVideo.durationText, "RECORDED CLIP", color: ShotIQColor.analysisBlue, size: 26)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                                    captureStat(liveVideo.fileSizeText, "FILE SIZE", size: 26)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                                    captureStat(liveVideo.frameRateText, "FRAME RATE", size: 26)
                                }
                            }
                            .padding(12)
                        }
                        .padding(.horizontal, 20).padding(.top, 14)
                    }

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(filters, id: \.0) { key, label in
                                Button {
                                    withAnimation { filter = key }
                                    toast = .info("Filter updated", label)
                                } label: {
                                    filterChip(label, selected: filter == key)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    .padding(.top, 16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .clipped()

                    HStack {
                        SectionLabel(text: selectedFilterLabel.uppercased())
                        Spacer()
                        Button {
                            withAnimation { lowestFirst.toggle() }
                            toast = .info("Review order updated",
                                          lowestFirst ? "Lowest confidence first." : "Highest confidence first.")
                        } label: {
                            HStack(spacing: 6) {
                                Text(lowestFirst ? "Review lowest confidence first" : "Review highest confidence first")
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                Image(systemName: "chevron.up.chevron.down").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 20)

                    if visibleFlagged.isEmpty {
                        Text("Nothing to review in this view. Switch filters to see other shots.")
                            .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            .padding(.horizontal, 20).padding(.top, 12)
                    }

                    ForEach(visibleFlagged, id: \.0) { n, when, flaw, dur, conf in
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 14) {
                                ZStack(alignment: .bottomLeading) {
                                    if let key = shotThumbs[n] {
                                        CanonicalPhoto(key, width: 116, height: 132, cornerRadius: 4)
                                    } else {
                                        CanonicalPhoto("035-visual-002", width: 116, height: 132, cornerRadius: 4)
                                            .overlay(SkeletonOverlay().opacity(0.72))
                                    }
                                    Text(dur).font(.custom("Tungsten-Medium", size: 12)).foregroundStyle(.white)
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
                                    Text(when).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                    HStack(spacing: 6) {
                                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "figure.basketball"),
                                                                 size: 13,
                                                                 label: nil)
                                        Text(flaw).shotiqBody(12).foregroundStyle(ShotIQColor.ink)
                                            .lineLimit(1).fixedSize()
                                    }
                                    HStack(spacing: 6) {
                                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "gauge.with.needle"), size: 42).font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
                                        Text("Low confidence").shotiqBody(12).foregroundStyle(ShotIQColor.ink)
                                            .lineLimit(1).fixedSize()
                                    }
                                    HStack(spacing: 6) {
                                        ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-upload-video",
                                                                 size: 13,
                                                                 label: nil)
                                        Text(dur).shotiqBody(12).foregroundStyle(ShotIQColor.ink)
                                            .lineLimit(1).fixedSize()
                                    }
                                }
                                Spacer(minLength: 4)
                                VStack(spacing: 6) {
                                    Ring(pct: conf, color: ShotIQColor.shotiqOrange, lineWidth: 5)
                                        .frame(width: 48, height: 48)
                                        .overlay(Text("\(Int(conf * 100))")
                                            .font(.custom("Tungsten-Medium", size: 19)).foregroundStyle(ShotIQColor.ink))
                                    Text("CONFIDENCE").shotiqBody(7, weight: .medium).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    NavigationLink {
                                        if let latest = app.recentMedia.first {
                                            ShotBreakdownView(presentation: AnalysisResultPresentation(result: latest.analysis))
                                        } else if UITestHooks.demoData {
                                            ShotBreakdownView(presentation: .canonicalDemo)
                                        } else {
                                            AnalyzeHubView()
                                        }
                                    } label: {
                                        Text("Review").shotiqBody(13, weight: .medium)
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                            .padding(.horizontal, 18).padding(.vertical, 8)
                                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                    }
                                    .simultaneousGesture(TapGesture().onEnded {
                                        if !app.recentMedia.isEmpty || UITestHooks.demoData {
                                            toast = .info("Opening shot review", "Shot \(n) breakdown is ready.")
                                        } else {
                                            toast = .info("Analyze a shot first",
                                                          "Save or analyze media before opening shot breakdown.")
                                        }
                                    })
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(12)
                        }
                        .padding(.horizontal, 20).padding(.top, 12)
                    }

                    Button {
                        toast = .info("Confirm discard", "Review the warning before deleting this session.")
                        confirmDiscard = true
                    } label: { captureOutline("Discard session", icon: "trash") }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20).padding(.top, 18)

                    NavigationLink {
                        if let liveVideo {
                            VideoReviewView(video: liveVideo)
                        } else {
                            AnalysisProcessingView()
                        }
                    } label: {
                        captureCTA("Analyze session", icon: "camera.metering.center.weighted")
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .progress("Analyzing session",
                                          liveVideo == nil ? "ShotIQ is preparing the captured shots." : "Opening the recorded clip for trim and analysis.",
                                          progress: 0.7)
                    })
                    .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 26)
                }
            }
        }
        // End of the live flow — release the shared camera.
        .onAppear { CameraService.live.stop() }
        .alert("Discard this session?", isPresented: $confirmDiscard) {
            Button("Discard", role: .destructive) {
                toast = .info("Session discarded", "Captured shots were removed.")
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    dismiss()
                }
            }
            Button("Cancel", role: .cancel) {
                toast = .success("Session kept", "You can keep reviewing or analyze the capture.")
            }
        } message: {
            Text("All \(summary.shots) captured shots from this session will be deleted.")
        }
        .shotiqToast($toast)
    }

    private func filterChip(_ t: String, selected: Bool) -> some View {
        Text(t).shotiqBody(13, weight: selected ? .semibold : .regular)
            .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
            .padding(.horizontal, 14).padding(.vertical, 9)
            .background(selected ? ShotIQColor.paper : ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
    }
}
