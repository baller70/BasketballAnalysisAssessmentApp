import SwiftUI
import PhotosUI
import AVFoundation

// Capture & upload flow — screens 021-035. PhotosUI for library import,
// AVFoundation capture session for live camera (permission-gated).

struct AnalyzeHubView: View {       // 021
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analyze-hub") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("UPLOAD & ANALYZE").shotiqDisplay(40).padding(.top, 24)
                    Text("Add your footage to get AI-powered shooting analysis.")
                        .shotiqBody(15).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                    VStack(spacing: 14) {
                        NavigationLink { PhotoUploadSourceView() } label: {
                            hubCard("photo", "Upload photo", "Analyze a single shot frame", dashed: true)
                        }
                        NavigationLink { VideoUploadView() } label: {
                            hubCard("film", "Upload video", "Full-motion analysis of a rep")
                        }
                        NavigationLink { LiveCameraSetupView() } label: {
                            hubCard("dot.radiowaves.left.and.right", "Live camera", "Real-time form feedback")
                        }
                        NavigationLink { UploadQueueView() } label: {
                            hubCard("tray.full", "Upload queue", "Manage pending uploads")
                        }
                    }
                    .padding(.top, 22)
                    SectionLabel(text: "FILMING GUIDE").padding(.top, 26)
                    ForEach([("figure.stand", "Full body in frame"), ("arrow.left.and.right", "Side angle"),
                             ("rectangle.dashed", "Neutral background"), ("sun.max", "Good lighting")], id: \.1) { icon, t in
                        HStack(spacing: 12) {
                            Image(systemName: icon).frame(width: 28)
                            Text(t).shotiqBody(15)
                            Spacer()
                        }
                        .padding(.vertical, 9)
                    }
                }
                .padding(.horizontal, 24)
            }
        }
        .navigationTitle("").toolbar(.hidden, for: .navigationBar)
    }
    @ViewBuilder private func hubCard(_ icon: String, _ t: String, _ d: String, dashed: Bool = false) -> some View {
        HStack(spacing: 16) {
            Image(systemName: icon).font(.system(size: 26))
                .foregroundStyle(dashed ? ShotIQColor.shotiqOrange : ShotIQColor.ink).frame(width: 42)
            VStack(alignment: .leading, spacing: 3) {
                Text(t).shotiqBody(16, weight: .semibold)
                    .foregroundStyle(dashed ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                Text(d).font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
        }
        .padding(16)
        .overlay(RoundedRectangle(cornerRadius: 8)
            .stroke(dashed ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                    style: StrokeStyle(lineWidth: dashed ? 2 : 1, dash: dashed ? [6, 5] : [])))
    }
}

struct PhotoUploadSourceView: View { // 022
    @State private var pick: PhotosPickerItem?
    @State private var image: UIImage?
    @State private var goReview = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-upload-source") {
            VStack(spacing: 16) {
                Text("ADD A SHOT PHOTO").shotiqDisplay(38).padding(.top, 30)
                PhotosPicker(selection: $pick, matching: .images) {
                    sourceRow("photo.on.rectangle", "Photo library", "Choose from your photos")
                }
                sourceRow("camera", "Take photo", "Capture with the camera")
                sourceRow("folder", "Browse files", "Import from Files")
                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .onChange(of: pick) { _, item in
            Task {
                if let data = try? await item?.loadTransferable(type: Data.self),
                   let img = UIImage(data: data) { image = img; goReview = true }
            }
        }
        .navigationDestination(isPresented: $goReview) { PhotoReviewCropView(image: image) }
    }
    private func sourceRow(_ icon: String, _ t: String, _ d: String) -> some View {
        HStack(spacing: 16) {
            Image(systemName: icon).font(.system(size: 24)).frame(width: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(t).shotiqBody(16, weight: .semibold)
                Text(d).font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
        }
        .padding(16).foregroundStyle(ShotIQColor.ink)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct PhotoReviewCropView: View {  // 023
    var image: UIImage?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-review-crop") {
            VStack(spacing: 0) {
                Text("REVIEW & CROP").shotiqDisplay(36).padding(.top, 22)
                ZStack {
                    if let image {
                        Image(uiImage: image).resizable().scaledToFit()
                    } else {
                        MediaSurface(height: 420)
                    }
                    // rule-of-thirds crop grid
                    GeometryReader { geo in
                        Path { p in
                            for f in [1.0/3.0, 2.0/3.0] {
                                p.move(to: CGPoint(x: geo.size.width * f, y: 0))
                                p.addLine(to: CGPoint(x: geo.size.width * f, y: geo.size.height))
                                p.move(to: CGPoint(x: 0, y: geo.size.height * f))
                                p.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height * f))
                            }
                        }
                        .stroke(.white.opacity(0.6), lineWidth: 1)
                    }
                }
                .frame(height: 420).clipped().padding(.horizontal, 20).padding(.top, 16)
                HStack(spacing: 18) {
                    ForEach(["crop", "rotate.right", "wand.and.stars", "slider.horizontal.3"], id: \.self) { i in
                        Button {} label: {
                            Image(systemName: i).font(.system(size: 20)).frame(width: 52, height: 44)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                        }
                        .foregroundStyle(ShotIQColor.ink)
                    }
                }
                .padding(.top, 18)
                Spacer()
                NavigationLink { UploadQualityCheckView() } label: {
                    Text("Use this photo").frame(maxWidth: .infinity).frame(height: 54)
                        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                }
                .padding(.horizontal, 24).padding(.bottom, 26)
            }
        }
    }
}

struct UploadQualityCheckView: View { // 024
    var body: some View {
        CanonicalScreen(testID: "screen-ios-upload-quality-check") {
            VStack(alignment: .leading, spacing: 0) {
                Text("QUALITY CHECK").shotiqDisplay(38).padding(.top, 26)
                Text("We ran these checks before analysis.")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                VStack(spacing: 0) {
                    ForEach([("Resolution", "1080p", true), ("Lighting", "Well lit", true),
                             ("Full body visible", "Feet to head in frame", true),
                             ("Stability", "Slight blur detected", false)], id: \.0) { t, d, ok in
                        HStack(spacing: 14) {
                            Image(systemName: ok ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                                .foregroundStyle(ok ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(t).shotiqBody(15, weight: .semibold)
                                Text(d).font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(.vertical, 13)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                    }
                }
                .padding(.top, 18)
                Spacer()
                NavigationLink { AnalysisProcessingView() } label: {
                    Text("Start analysis").frame(maxWidth: .infinity).frame(height: 54)
                        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                }
                .padding(.bottom, 26)
            }
            .padding(.horizontal, 24)
        }
    }
}

struct UploadQueueView: View {      // 025
    struct Item: Identifiable { let id = UUID(); let name: String; let pct: Double; let state: String }
    @State private var items = [Item(name: "pullup-jumper.mov", pct: 0.62, state: "Uploading"),
                                Item(name: "spotup-three.mov", pct: 1.0, state: "Complete"),
                                Item(name: "transition-pullup.mov", pct: 0, state: "Queued")]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-upload-queue") {
            VStack(alignment: .leading, spacing: 0) {
                Text("UPLOAD QUEUE").shotiqDisplay(38).padding(.top, 26)
                Text("Uploads resume automatically, even after interruptions.")
                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                ForEach(items) { it in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "film").frame(width: 26)
                            Text(it.name).shotiqBody(15, weight: .semibold)
                            Spacer()
                            Text(it.state).font(.system(size: 12, weight: .bold))
                                .foregroundStyle(it.state == "Complete" ? ShotIQColor.confirmGreen : ShotIQColor.graphite)
                        }
                        ScoreBar(pct: it.pct, color: it.state == "Complete" ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue)
                    }
                    .padding(.vertical, 12)
                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                }
                Spacer()
            }
            .padding(.horizontal, 24)
        }
    }
}

struct VideoUploadView: View {      // 026
    @State private var pick: PhotosPickerItem?
    @State private var go = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-video-upload") {
            VStack(spacing: 0) {
                Text("UPLOAD VIDEO").shotiqDisplay(38).padding(.top, 26)
                Text("MP4, MOV or HEVC · up to 10GB")
                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                PhotosPicker(selection: $pick, matching: .videos) {
                    VStack(spacing: 12) {
                        Image(systemName: "square.and.arrow.up").font(.system(size: 30))
                        Text("Choose a video").shotiqBody(16, weight: .semibold)
                        Text("From your photo library").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                    }
                    .frame(maxWidth: .infinity).frame(height: 200)
                    .overlay(RoundedRectangle(cornerRadius: 8)
                        .stroke(ShotIQColor.shotiqOrange, style: StrokeStyle(lineWidth: 2, dash: [7, 6])))
                    .foregroundStyle(ShotIQColor.ink)
                }
                .padding(.horizontal, 24).padding(.top, 26)
                Spacer()
            }
        }
        .onChange(of: pick) { _, v in if v != nil { go = true } }
        .navigationDestination(isPresented: $go) { VideoReviewView() }
    }
}

struct VideoReviewView: View {      // 027
    @State private var trimStart: Double = 0.1
    @State private var trimEnd: Double = 0.8
    var body: some View {
        CanonicalScreen(testID: "screen-ios-video-review") {
            VStack(spacing: 0) {
                Text("REVIEW VIDEO").shotiqDisplay(38).padding(.top, 24)
                MediaSurface(height: 380).padding(.horizontal, 20).padding(.top, 16)
                SectionLabel(text: "TRIM TO ONE REP").padding(.top, 20)
                // trim scrubber
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4).fill(ShotIQColor.rule).frame(height: 44)
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(ShotIQColor.shotiqOrange, lineWidth: 3)
                            .frame(width: geo.size.width * (trimEnd - trimStart), height: 44)
                            .offset(x: geo.size.width * trimStart)
                    }
                }
                .frame(height: 44).padding(.horizontal, 24).padding(.top, 10)
                Spacer()
                NavigationLink { AnalysisProcessingView() } label: {
                    Text("Analyze this rep").frame(maxWidth: .infinity).frame(height: 54)
                        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                }
                .padding(.horizontal, 24).padding(.bottom, 26)
            }
        }
    }
}

struct LiveCameraSetupView: View {  // 028
    @State private var granted = AVCaptureDevice.authorizationStatus(for: .video) == .authorized
    var body: some View {
        CanonicalScreen(testID: "screen-ios-live-camera-setup") {
            VStack(spacing: 0) {
                Text("LIVE CAMERA SETUP").shotiqDisplay(38).padding(.top, 26)
                Text("Position your phone so your full body and the hoop are visible.")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center).padding(.horizontal, 30).padding(.top, 8)
                MediaSurface(height: 360).padding(.horizontal, 20).padding(.top, 18)
                    .overlay(alignment: .center) {
                        if !granted {
                            VStack(spacing: 10) {
                                Image(systemName: "camera").font(.system(size: 30)).foregroundStyle(.white)
                                Text("Camera permission needed").font(.system(size: 14)).foregroundStyle(.white)
                                Button("Allow camera") {
                                    AVCaptureDevice.requestAccess(for: .video) { ok in
                                        DispatchQueue.main.async { granted = ok }
                                    }
                                }
                                .font(.system(size: 14, weight: .semibold)).foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                    }
                Spacer()
                NavigationLink { HoopCalibrationView() } label: {
                    Text("Continue to calibration").frame(maxWidth: .infinity).frame(height: 54)
                        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                }
                .padding(.horizontal, 24).padding(.bottom, 26)
            }
        }
    }
}

struct HoopCalibrationView: View {  // 029
    @State private var hoopPos = CGPoint(x: 0.72, y: 0.28)
    var body: some View {
        CanonicalScreen(testID: "screen-ios-hoop-calibration") {
            VStack(spacing: 0) {
                Text("HOOP CALIBRATION").shotiqDisplay(38).padding(.top, 26)
                Text("Drag the marker onto the rim.")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                GeometryReader { geo in
                    ZStack {
                        MediaSurface(height: geo.size.height)
                        Circle().stroke(ShotIQColor.shotiqOrange, lineWidth: 3)
                            .frame(width: 54, height: 54)
                            .position(x: hoopPos.x * geo.size.width, y: hoopPos.y * geo.size.height)
                            .gesture(DragGesture().onChanged { v in
                                hoopPos = CGPoint(x: v.location.x / geo.size.width,
                                                  y: v.location.y / geo.size.height)
                            })
                    }
                }
                .frame(height: 420).padding(.horizontal, 20).padding(.top, 16)
                Spacer()
                NavigationLink { ReadinessCheckView() } label: {
                    Text("Lock calibration").frame(maxWidth: .infinity).frame(height: 54)
                        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                }
                .padding(.horizontal, 24).padding(.bottom, 26)
            }
        }
    }
}

struct ReadinessCheckView: View {   // 030
    var body: some View {
        CanonicalScreen(testID: "screen-ios-readiness-check") {
            VStack(alignment: .leading, spacing: 0) {
                Text("READINESS CHECK").shotiqDisplay(38).padding(.top, 26)
                VStack(spacing: 0) {
                    ForEach([("Full body visible", true), ("Hoop calibrated", true),
                             ("Lighting sufficient", true), ("Phone stable", true)], id: \.0) { t, ok in
                        HStack {
                            Image(systemName: ok ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundStyle(ok ? ShotIQColor.confirmGreen : ShotIQColor.reviewRed)
                            Text(t).shotiqBody(16)
                            Spacer()
                        }
                        .padding(.vertical, 14)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                    }
                }
                .padding(.top, 16)
                Spacer()
                NavigationLink { CaptureReadyView() } label: {
                    Text("I'm ready").frame(maxWidth: .infinity).frame(height: 54)
                        .background(ShotIQColor.confirmGreen, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                }
                .padding(.bottom, 26)
            }
            .padding(.horizontal, 24)
        }
    }
}

struct CaptureReadyView: View {     // 031
    @State private var count = 3
    @State private var go = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-capture-ready") {
            ZStack {
                MediaSurface(height: 900).ignoresSafeArea()
                VStack {
                    Spacer()
                    Text("\(count)").font(.custom("DINCondensed-Bold", size: 140)).foregroundStyle(.white)
                    Text("GET SET").font(.system(size: 15, weight: .bold)).kerning(2).foregroundStyle(.white)
                    Spacer()
                }
            }
        }
        .task {
            while count > 1 { try? await Task.sleep(for: .seconds(1)); count -= 1 }
            try? await Task.sleep(for: .seconds(1)); go = true
        }
        .navigationDestination(isPresented: $go) { LiveRecordingView() }
    }
}

struct LiveRecordingView: View {    // 032
    @State private var seconds = 0
    @State private var timer: Timer?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-live-recording") {
            ZStack {
                MediaSurface(height: 900).ignoresSafeArea()
                VStack {
                    HStack {
                        HStack(spacing: 7) {
                            Circle().fill(ShotIQColor.shotiqOrange).frame(width: 8, height: 8)
                            Text("LIVE").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                        }
                        .padding(.horizontal, 10).padding(.vertical, 6)
                        .background(.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 4))
                        Spacer()
                        Text(String(format: "%02d:%02d", seconds / 60, seconds % 60))
                            .font(.custom("DINCondensed-Bold", size: 22)).foregroundStyle(.white)
                    }
                    .padding(20)
                    Spacer()
                    NavigationLink { LiveFormFeedbackView() } label: {
                        Circle().stroke(.white, lineWidth: 4).frame(width: 74, height: 74)
                            .overlay(RoundedRectangle(cornerRadius: 6).fill(ShotIQColor.reviewRed).frame(width: 30, height: 30))
                    }
                    .padding(.bottom, 44)
                }
            }
        }
        .onAppear { timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in seconds += 1 } }
        .onDisappear { timer?.invalidate() }
    }
}

struct LiveFormFeedbackView: View { // 033
    var body: some View {
        CanonicalScreen(testID: "screen-ios-live-form-feedback") {
            ZStack {
                MediaSurface(height: 900).ignoresSafeArea()
                VStack {
                    Spacer()
                    ShotIQCard {
                        VStack(alignment: .leading, spacing: 10) {
                            SectionLabel(text: "LIVE FORM FEEDBACK")
                            ForEach([("Keep elbow stacked", "GOOD", true),
                                     ("Release at apex", "FOCUS", false),
                                     ("Square shoulders", "GOOD", true)], id: \.0) { t, s, ok in
                                HStack {
                                    TrendLine(points: [2, 4, 3, 5, 4],
                                              stroke: ok ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                                        .frame(width: 40, height: 22)
                                    Text(t).shotiqBody(14, weight: .semibold)
                                    Spacer()
                                    Text(s).font(.system(size: 10, weight: .bold))
                                        .padding(.horizontal, 9).padding(.vertical, 3)
                                        .overlay(Capsule().stroke(ok ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue))
                                        .foregroundStyle(ok ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue)
                                }
                            }
                            NavigationLink { ShotDetectedView() } label: {
                                Text("Simulate shot").font(.system(size: 13)).foregroundStyle(ShotIQColor.analysisBlue)
                            }
                        }
                        .padding(16)
                    }
                    .padding(16)
                }
            }
        }
    }
}

struct ShotDetectedView: View {     // 034
    var body: some View {
        CanonicalScreen(testID: "screen-ios-shot-detected") {
            ZStack {
                MediaSurface(height: 900).ignoresSafeArea()
                VStack(spacing: 14) {
                    Spacer()
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 62))
                        .foregroundStyle(ShotIQColor.confirmGreen)
                    Text("SHOT DETECTED").shotiqDisplay(34).foregroundStyle(.white)
                    Text("Shot 24 · analyzing release…").font(.system(size: 14)).foregroundStyle(.white.opacity(0.8))
                    NavigationLink { CaptureReviewView() } label: {
                        Text("End session & review").frame(width: 260).frame(height: 52)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 16, weight: .medium))
                    }
                    Spacer().frame(height: 70)
                }
            }
        }
    }
}

struct CaptureReviewView: View {    // 035
    var body: some View {
        CanonicalScreen(testID: "screen-ios-capture-review") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("SESSION REVIEW").shotiqDisplay(38).padding(.top, 24)
                    HStack(spacing: 24) {
                        StatBlock(value: "24", label: "SHOTS", valueSize: 34)
                        StatBlock(value: "15", label: "MAKES", color: ShotIQColor.confirmGreen, valueSize: 34)
                        StatBlock(value: "9", label: "MISSES", color: ShotIQColor.reviewRed, valueSize: 34)
                        StatBlock(value: "62.5%", label: "MAKE %", valueSize: 34)
                    }
                    .padding(.top, 16)
                    SectionLabel(text: "SHOTS").padding(.top, 22)
                    ForEach(1..<7) { n in
                        HStack(spacing: 14) {
                            MediaSurface(height: 54).frame(width: 90)
                            Text("Shot \(n)").shotiqBody(15, weight: .semibold)
                            Spacer()
                            Image(systemName: n % 3 == 0 ? "xmark.circle.fill" : "checkmark.circle.fill")
                                .foregroundStyle(n % 3 == 0 ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen)
                        }
                        .padding(.vertical, 8)
                    }
                    NavigationLink { AnalysisProcessingView() } label: {
                        Text("Analyze session").frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                    }
                    .padding(.vertical, 24)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}
