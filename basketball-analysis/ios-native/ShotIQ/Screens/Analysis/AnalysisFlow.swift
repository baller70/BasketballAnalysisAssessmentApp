import SwiftUI
import UIKit
import UserNotifications
import AVKit

// Analysis flow — screens 036-047. Pose overlays and gauges are Canvas/Path.

// MARK: - Shared canonical fragments for this flow

/// TopBar whose settings gear actually opens the Settings hub.
fileprivate struct AnalysisTopBar: View {
    @State private var showSettings = false
    var body: some View {
        TopBar(onSettings: { showSettings = true })
            .navigationDestination(isPresented: $showSettings) { SettingsHubView() }
    }
}

/// Lightweight payload for the shared info alert used by this flow's ⓘ affordances.
fileprivate struct AnalysisInfoNote: Identifiable {
    let id = UUID()
    let title: String
    let message: String
}

fileprivate extension View {
    func analysisInfoAlert(_ note: Binding<AnalysisInfoNote?>) -> some View {
        alert(note.wrappedValue?.title ?? "",
              isPresented: Binding(get: { note.wrappedValue != nil },
                                   set: { if !$0 { note.wrappedValue = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(note.wrappedValue?.message ?? "")
        }
    }
}

/// "PRIMARY COACHING TARGET / Keep elbow stacked through release" row (037-040).
fileprivate struct CoachTargetCard: View {
    var bordered = true
    var title = "Keep elbow stacked through release"
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("PRIMARY COACHING TARGET")
                    .shotiqBody(11, weight: .semibold).kerning(0.8)
                    .foregroundStyle(ShotIQColor.graphite)
                Text(title)
                    .shotiqBody(19, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(bordered ? ShotIQColor.rule : .clear))
    }
}

/// "24 SHOTS | 15 MAKES | 62.5% MAKE % | trend +8.1%" strip (037/039/040).
fileprivate struct SessionStatsStrip: View {
    var body: some View {
        HStack(spacing: 0) {
            StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .leading)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
            StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
            StatBlock(value: "62.5%", label: "MAKE %", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
            VStack(spacing: 3) {
                TrendLine(points: [58, 66, 61, 70]).frame(width: 74, height: 22)
                HStack(spacing: 3) {
                    Text("+8.1%").shotiqBody(11, weight: .bold).foregroundStyle(ShotIQColor.confirmGreen)
                    Text("vs last session").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                }
                .lineLimit(1).minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity)
        }
    }
}

/// Orange DIN form-score numeral with ScoreBar + blue GOOD verdict.
fileprivate struct FormScorePanel: View {
    var numeralSize: CGFloat = 64
    var barWidth: CGFloat = 130
    var score = "82"
    var pct = 0.82
    var verdict = "GOOD"
    var caption = "Keep building consistency."
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("FORM SCORE").shotiqBody(12, weight: .semibold).kerning(0.8)
                .foregroundStyle(ShotIQColor.graphite)
            Text(score).font(.custom("Tungsten-Medium", size: numeralSize))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .lineLimit(1)
            ScoreBar(pct: pct).frame(width: barWidth)
            Text(verdict).font(.custom("Tungsten-Medium", size: 18))
                .foregroundStyle(ShotIQColor.analysisBlue).padding(.top, 6)
            Text(caption).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

enum AnalysisResultMediaSource: Equatable {
    case video(URL)
    case image(URL)
    case canonicalFallback(String)
    case placeholder(String)
}

enum AnalysisResultMediaSurfaceResolver {
    static func source(for presentation: AnalysisResultPresentation,
                       fallbackKey: String) -> AnalysisResultMediaSource {
        if let url = presentation.videoURL {
            return .video(url)
        }
        if let url = presentation.mediaURL {
            return .image(url)
        }
        if presentation.id == "canonical-demo" {
            return .canonicalFallback(fallbackKey)
        }
        return .placeholder(presentation.mediaLabel)
    }
}

fileprivate struct AnalysisResultMediaSurface: View {
    var presentation: AnalysisResultPresentation
    var fallbackKey: String
    var height: CGFloat

    var body: some View {
        ZStack {
            switch AnalysisResultMediaSurfaceResolver.source(for: presentation, fallbackKey: fallbackKey) {
            case .video(let url):
                VideoPlayer(player: AVPlayer(url: url))
                    .accessibilityLabel("Saved analysis video")
            case .image(let url):
                if url.isFileURL {
                    if let image = UIImage(contentsOfFile: url.path) {
                        CapturedPoseImage(image: image,
                                          height: height,
                                          cornerRadius: 8,
                                          initialPose: presentation.detectedPose)
                    } else {
                        mediaPlaceholder("Media unavailable")
                    }
                } else {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().scaledToFill()
                        case .failure:
                            mediaPlaceholder("Media unavailable")
                        default:
                            mediaPlaceholder("Loading media")
                        }
                    }
                }
            case .canonicalFallback(let key):
                CanonicalMediaSurface(key: key, height: height)
            case .placeholder(let label):
                mediaPlaceholder(label)
            }
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .accessibilityLabel(presentation.mediaLabel)
    }

    private func mediaPlaceholder(_ label: String) -> some View {
        RoundedRectangle(cornerRadius: 8)
            .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
            .overlay {
                VStack(spacing: 8) {
                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "photo"), size: 32)
                        .font(.system(size: 26, weight: .light))
                    Text(label)
                        .shotiqBody(12, weight: .medium)
                }
                .foregroundStyle(.white.opacity(0.85))
                .multilineTextAlignment(.center)
                .padding(12)
            }
    }
}

struct AnalysisProcessingView: View { // 036
    /// One route out of processing. Two `navigationDestination(isPresented:)`
    /// modifiers on the same view conflict — the second silently wins — so the
    /// screen drives a single item-based destination instead.
    enum ProcessingRoute: Hashable { case results, takingLonger, failed }
    /// Processing that is still running after this is no longer "a moment":
    /// canonical 037 takes over and offers notify / keep waiting / cancel.
    private static let longRunningThreshold: Duration = .seconds(12)
    var initialResult: ShotIQAnalysisResultDTO? = nil
    var videoJob: VideoAnalysisJob? = nil
    @State private var pct = 0.12
    @State private var route: ProcessingRoute?
    @State private var completedResult: ShotIQAnalysisResultDTO?
    private let steps: [(String, String, Int)] = [ // icon, label, state: 0 done, 1 active, 2 queued
        ("viewfinder", "Upload complete", 0),
        ("point.3.connected.trianglepath.dotted", "Detecting pose & landmarks", 1),
        ("angle", "Scoring mechanics", 2),
        ("chart.dots.scatter", "Comparing to your baseline", 2),
        ("doc.text", "Building coaching plan", 2),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-processing") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            Text("ANALYSIS PROCESSING").shotiqDisplay(34).padding(.top, 18)
                            Text("Shot Rail AI is reviewing your mechanics and building your results.")
                                .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                                .padding(.top, 4)
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 0) {
                                    Text("PROCESSING VIDEO").font(.custom("Tungsten-Medium", size: 19))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text(processingSummary).shotiqBody(13)
                                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                                    HStack(spacing: 12) {
                                        ScoreBar(pct: pct, color: ShotIQColor.analysisBlue)
                                        Text("\(Int(pct * 100))%").font(.custom("Tungsten-Medium", size: 22))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                    }
                                    .padding(.top, 14)
                                    ForEach(steps, id: \.1) { icon, label, state in
                                        HStack(spacing: 14) {
                                            Image(systemName: icon).font(.system(size: 17))
                                                .foregroundStyle(state == 2 ? ShotIQColor.ink : ShotIQColor.analysisBlue)
                                                .frame(width: 26)
                                            Text(label).shotiqBody(15)
                                            Spacer()
                                            switch state {
                                            case 0:
                                                Image(systemName: "checkmark.circle.fill")
                                                    .font(.system(size: 20)).foregroundStyle(ShotIQColor.analysisBlue)
                                            case 1:
                                                ProgressView().tint(ShotIQColor.analysisBlue)
                                            default:
                                                Text("Queued").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                            }
                                        }
                                        .padding(.vertical, 13)
                                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                                    }
                                    .padding(.top, 2)
                                }
                                .padding(16)
                            }
                            .padding(.top, 16)
                            SectionLabel(text: "LIVE FRAME PREVIEW").padding(.top, 20)
                            HStack(alignment: .top, spacing: 16) {
                                // Canonical live-frame preview: the pose overlay is already
                                // burned into this crop, so no SkeletonOverlay on top.
                                Group {
                                    if let videoJob {
                                        VideoPlayer(player: AVPlayer(url: videoJob.clip.url))
                                            .frame(height: 200)
                                            .clipShape(RoundedRectangle(cornerRadius: 8))
                                    } else {
                                        CanonicalMediaSurface(key: "036-visual-001", height: 200)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                FormScorePanel(numeralSize: 56, barWidth: 90)
                                    .frame(width: 110, alignment: .leading)
                            }
                            .padding(.top, 8)
                            PhaseStrip().padding(.top, 16)
                            ShotIQCard {
                                HStack(alignment: .top, spacing: 14) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "clock"), size: 32).font(.system(size: 28, weight: .light))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Keep app open").shotiqBody(17, weight: .semibold)
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Text("We'll notify you when your results are ready.\nYou can switch tasks — analysis will continue in the background.")
                                            .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                    Spacer(minLength: 0)
                                }
                                .padding(16)
                            }
                            .padding(.top, 18)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .task {
            if let videoJob {
                await processVideo(job: videoJob)
                return
            }
            // Watchdog: if the pipeline is still going when the threshold passes,
            // hand over to the analysis-taking-longer screen (canonical 037).
            let watchdog = Task { @MainActor in
                try? await Task.sleep(for: Self.longRunningThreshold)
                guard !Task.isCancelled, route == nil else { return }
                route = .takingLonger
            }
            defer { watchdog.cancel() }
            for _ in 0..<8 {
                try? await Task.sleep(for: .seconds(0.5))
                pct = min(0.94, pct + 0.11)
            }
            if route == nil { route = .results }
        }
        .navigationDestination(item: $route) { r in
            switch r {
            case .results: AnalysisResultOverviewView(initialResult: completedResult ?? initialResult)
            case .takingLonger: AnalysisTakingLongerView()
            case .failed: AnalysisErrorView()
            }
        }
    }

    private var processingSummary: String {
        guard let videoJob else { return "1080p • 24s • 30fps" }
        return "\(videoJob.clip.orientationText) • \(videoJob.trimWindowText) • \(videoJob.clip.frameRateText)"
    }

    private func processVideo(job: VideoAnalysisJob) async {
        pct = 0.18
        let poseAnalysis = await VideoPoseAnalyzer.analyze(job: job)
        let localFallback = ShotIQLocalAnalysisFactory.video(job: job, poseAnalysis: poseAnalysis)
        do {
            pct = 0.42
            let uploadedURL = try await APIClient.shared.uploadVideo(
                job.clip.url,
                filename: job.clip.filename,
                contentType: job.clip.contentType,
                sizeBytes: job.clip.fileSizeBytes,
                clientSessionId: job.clientSessionId,
                durationSeconds: job.clip.durationSeconds)
            pct = 0.72

            struct VideoVisionAnalysis: Codable {
                var source: String
                var filename: String
                var contentType: String
                var fileSizeBytes: Int
                var durationSeconds: Double
                var trimStartSeconds: Double
                var trimEndSeconds: Double
                var trimmedDurationSeconds: Double
                var uploadedVideoUrl: String?
                var pose: VideoPoseAnalysisSummary
            }
            struct SaveBody: Codable {
                var clientSessionId: String
                var recordedAt: String
                var mediaType: String
                var visionAnalysis: VideoVisionAnalysis
                var bodyPositions: [VideoPoseFrameRecord]
                var shootingPhase: String?
                var elbowAngle: Double?
                var kneeAngle: Double?
                var wristAngle: Double?
                var shoulderAngle: Double?
                var hipAngle: Double?
                var releaseAngle: Double?
                var kneeAngleMin: Double?
                var overallScore: Double?
                var formScore: Double?
                var releaseScore: Double?
                var consistencyScore: Double?
                var coachingNotes: String
            }
            struct SaveResp: Codable {
                var success: Bool?
                var analysisId: String?
                var analysisResult: ShotIQAnalysisResultDTO?
                var analysis: ShotIQAnalysisResultDTO?
            }

            let saved: SaveResp = try await APIClient.shared.call(
                "/api/save-analysis", method: "POST",
                body: SaveBody(
                    clientSessionId: job.clientSessionId,
                    recordedAt: ISO8601DateFormatter().string(from: Date()),
                    mediaType: "video",
                    visionAnalysis: VideoVisionAnalysis(
                        source: "ios-native-video-upload",
                        filename: job.clip.filename,
                        contentType: job.clip.contentType,
                        fileSizeBytes: job.clip.fileSizeBytes,
                        durationSeconds: job.clip.durationSeconds,
                        trimStartSeconds: job.trimStartSeconds,
                        trimEndSeconds: job.trimEndSeconds,
                        trimmedDurationSeconds: job.trimmedDurationSeconds,
                        uploadedVideoUrl: uploadedURL,
                        pose: poseAnalysis.summary),
                    bodyPositions: poseAnalysis.frames,
                    shootingPhase: poseAnalysis.summary.releaseFrameIndex == nil ? nil : "release",
                    elbowAngle: poseAnalysis.summary.releaseElbowAngle,
                    kneeAngle: poseAnalysis.summary.releaseKneeAngle,
                    wristAngle: poseAnalysis.summary.releaseWristAngle,
                    shoulderAngle: poseAnalysis.summary.releaseShoulderAngle,
                    hipAngle: poseAnalysis.summary.releaseHipAngle,
                    releaseAngle: poseAnalysis.summary.releaseAngle,
                    kneeAngleMin: poseAnalysis.summary.kneeAngleMin,
                    overallScore: poseAnalysis.summary.overallScore,
                    formScore: poseAnalysis.summary.formScore,
                    releaseScore: poseAnalysis.summary.releaseScore,
                    consistencyScore: poseAnalysis.summary.consistencyScore,
                    coachingNotes: poseAnalysis.frames.isEmpty
                        ? "Video uploaded and saved, but no usable body pose was detected in the selected trim window."
                        : "Video uploaded and analyzed from sampled frames inside the selected trim window."))
            var analysis = saved.analysisResult ?? saved.analysis ?? localFallback
            if analysis.media.localVideoUrl == nil {
                analysis.media.localVideoUrl = job.clip.url.absoluteString
            }
            completedResult = analysis
            pct = 0.94
            route = .results
        } catch {
            completedResult = localFallback
            pct = 0.94
            route = .results
        }
    }
}

struct AnalysisTakingLongerView: View { // 037
    @Environment(\.dismiss) private var dismiss
    @State private var notifyRequested = false
    @State private var showCancelConfirm = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-taking-longer") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            ShotIQCard {
                                VStack(spacing: 0) {
                                    ZStack {
                                        Circle().stroke(ShotIQColor.rule,
                                                        style: StrokeStyle(lineWidth: 2, dash: [5, 6]))
                                        Circle().trim(from: 0, to: 0.28)
                                            .stroke(ShotIQColor.analysisBlue,
                                                    style: StrokeStyle(lineWidth: 5, lineCap: .round))
                                            .rotationEffect(.degrees(-60))
                                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "point.topleft.down.to.point.bottomright.curvepath"), size: 32)
                                            .font(.system(size: 24)).foregroundStyle(ShotIQColor.analysisBlue)
                                    }
                                    .frame(width: 96, height: 96)
                                    Text("ANALYSIS TAKING LONGER").shotiqDisplay(28)
                                        .multilineTextAlignment(.center).padding(.top, 20)
                                    Text("High-quality biomechanical analysis can take several minutes. Your shot is being processed in the background.")
                                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                        .multilineTextAlignment(.center).padding(.top, 6)
                                    HStack(alignment: .top, spacing: 8) {
                                        stage("film", "Upload complete", "100%", false)
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 24, height: 1).padding(.top, 16)
                                        stage("point.3.connected.trianglepath.dotted", "Analyzing motion", "Estimating key angles", true)
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 24, height: 1).padding(.top, 16)
                                        stage("doc.text", "Building insights", "Pending", false)
                                    }
                                    .padding(.top, 22)
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 20)
                                    HStack(alignment: .top, spacing: 14) {
                                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "clock"), size: 32).font(.system(size: 30, weight: .light))
                                            .foregroundStyle(ShotIQColor.ink)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("We'll notify you when it's ready")
                                                .shotiqBody(16, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                            Text("You'll get a notification and can view results anytime.")
                                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        }
                                        Spacer(minLength: 0)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.top, 18)
                                }
                                .padding(18)
                            }
                            .padding(.top, 14)
                            PrimaryButton(title: notifyRequested ? "We'll notify you when it's ready" : "Notify me when ready",
                                          icon: notifyRequested ? "bell.badge" : "bell",
                                          color: ShotIQColor.analysisBlue) {
                                UNUserNotificationCenter.current()
                                    .requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
                                notifyRequested = true
                            }
                            .disabled(notifyRequested)
                            .padding(.top, 16)
                            SecondaryButton(title: "Keep waiting", icon: "arrow.2.circlepath") { dismiss() }
                                .padding(.top, 10)
                            SecondaryButton(title: "Cancel analysis", icon: "xmark") { showCancelConfirm = true }
                                .padding(.top, 10)
                                .alert("Cancel this analysis?", isPresented: $showCancelConfirm) {
                                    Button("Cancel analysis", role: .destructive) { dismiss() }
                                    Button("Keep waiting", role: .cancel) {}
                                } message: {
                                    Text("Processing will stop. Your clip stays saved in your history.")
                                }
                            HStack {
                                SectionLabel(text: "ANALYSIS QUEUE")
                                Spacer()
                                Text("1 ahead of you").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 22)
                            ShotIQCard {
                                HStack(spacing: 14) {
                                    RoundedRectangle(cornerRadius: 4).fill(ShotIQColor.rule)
                                        .frame(width: 84, height: 56)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("Today • 8:22 AM").shotiqBody(14)
                                        Text("Set 1 • 24 shots").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "clock"), size: 32).font(.system(size: 16)).foregroundStyle(ShotIQColor.ink)
                                    Text("Estimated\n2–4 min").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(12)
                            }
                            .padding(.top, 8)
                            PhaseStrip().padding(.top, 18)
                            NavigationLink { FlawsOverviewView() } label: {
                                CoachTargetCard(bordered: false)
                                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            }
                            .padding(.top, 14)
                            SessionStatsStrip()
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                                .padding(.top, 4)
                                .padding(.vertical, 10)
                            Spacer(minLength: 20)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private func stage(_ icon: String, _ title: String, _ sub: String, _ active: Bool) -> some View {
        VStack(spacing: 5) {
            // Canonical 036 prints a different diagram per pipeline stage.
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 24)
                .foregroundStyle(active ? ShotIQColor.analysisBlue : ShotIQColor.ink)
            Text(title).shotiqBody(12).foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
            Text(sub).shotiqBody(11)
                .foregroundStyle(active ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

struct AnalysisResultOverviewView: View { // 038
    @EnvironmentObject private var app: AppState
    private let initialResult: ShotIQAnalysisResultDTO?
    @State private var presentation: AnalysisResultPresentation
    @State private var overviewChrome: AnalysisOverviewChrome
    @State private var isLoadingLatest = false
    @State private var loadError: String?
    @State private var info: AnalysisInfoNote?

    init(initialResult: ShotIQAnalysisResultDTO? = nil) {
        self.initialResult = initialResult
        let seeded = initialResult.map(AnalysisResultPresentation.init)
            ?? (UITestHooks.active ? .canonicalDemo : .noResult)
        _presentation = State(initialValue: seeded)
        _overviewChrome = State(initialValue: UITestHooks.active
                                ? .canonicalDemo
                                : .productionFallback(user: nil))
    }

    var body: some View {
        let p = presentation
        CanonicalScreen(testID: "screen-ios-analysis-result-overview") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: overviewChrome.playerName,
                                     subtitle: overviewChrome.subtitle,
                                     streak: overviewChrome.streak,
                                     points: overviewChrome.points)
                        // Section tab strip: active ANALYSIS RESULT underlined orange.
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 24) {
                                VStack(spacing: 8) {
                                    Text("ANALYSIS RESULT").shotiqBody(13, weight: .bold).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Rectangle().fill(ShotIQColor.shotiqOrange).frame(height: 3)
                                }
                                .fixedSize()
                                stripLink("FLAWS", FlawsOverviewView())
                                stripLink("PLAYER", PlayerCardView())
                                stripLink("COMPARE", EliteMatchView())
                                stripLink("TRAINING", TrainingHomeView())
                                stripLink("GOALS", GoalsView())
                            }
                            .padding(.horizontal, 20)
                        }
                        .padding(.top, 16)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top, spacing: 18) {
                                // Real production path: display the media URL returned by
                                // /api/save-analysis or /api/analysis/latest. Canonical
                                // bitmap fallback is only for the screenshot harness.
                                ZStack {
                                    AnalysisResultMediaSurface(presentation: p, fallbackKey: "038-visual-001", height: 220)
                                    if p.id == "canonical-demo" { SkeletonOverlay() }
                                }
                                .frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 0) {
                                    NavigationLink { FormScoreView(presentation: p) } label: {
                                        FormScorePanel(numeralSize: 62, barWidth: 96,
                                                       score: p.scoreText,
                                                       pct: p.scorePct,
                                                       verdict: p.scoreVerdict,
                                                       caption: p.scoreCaption)
                                    }
                                    HStack(spacing: 14) {
                                        miniStat(p.phaseText.uppercased(), "PHASE")
                                        miniStat(p.mediaLabel.uppercased(), "MEDIA")
                                        miniStat(p.provenanceSummary, "SOURCES")
                                    }
                                    .padding(.top, 14)
                                }
                                .frame(width: 140, alignment: .leading)
                            }
                            .padding(.top, 16)
                            PhaseStrip().padding(.top, 16)
                            NavigationLink { FlawsOverviewView() } label: { CoachTargetCard(title: p.coachingTarget) }
                                .padding(.top, 16)
                            HStack(spacing: 6) {
                                SectionLabel(text: "YOUR SIX KEY METRICS")
                                Button {
                                    info = AnalysisInfoNote(title: "Your six key metrics",
                                                            message: "These values are read from the shared saved analysis contract. Missing values stay unavailable instead of being filled with demo numbers.")
                                } label: {
                                    Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 22)
                            ShotIQCard {
                                VStack(spacing: 0) {
                                    metricRow(Array(p.metrics.prefix(3)))
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                    metricRow(Array(p.metrics.suffix(3)))
                                }
                            }
                            .padding(.top, 8)
                            HStack {
                                HStack(spacing: 6) {
                                    SectionLabel(text: "ELITE MATCH")
                                    Button {
                                        info = AnalysisInfoNote(title: "Elite match",
                                                                message: "We compare your measured mechanics to a library of elite shooters and surface the closest match.")
                                    } label: {
                                        Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    .buttonStyle(.plain)
                                }
                                Spacer()
                                Button {
                                    info = AnalysisInfoNote(title: "How elite match works",
                                                            message: "Your release angle, elbow alignment and shot arc are scored against each elite profile. The overall match is the weighted similarity across all six key metrics.")
                                } label: {
                                    HStack(spacing: 3) {
                                        Text("How it works").shotiqBody(13).foregroundStyle(ShotIQColor.analysisBlue)
                                        Image(systemName: "chevron.right").font(.system(size: 11)).foregroundStyle(ShotIQColor.analysisBlue)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 22)
                            eliteMatchCard(overviewChrome.eliteMatch)
                            .padding(.top, 8)
                            NavigationLink { ShotBreakdownView(presentation: p) } label: {
                                HStack(spacing: 10) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-upload-video",
                                                             size: 18,
                                                             label: nil)
                                    Text("View shot breakdown").shotiqBody(17, weight: .medium)
                                }
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                                .foregroundStyle(.white)
                            }
                            .padding(.top, 20)
                            NavigationLink { ShareResultsView() } label: {
                                HStack {
                                    Image(systemName: "square.and.arrow.up").font(.system(size: 16))
                                    Text("Share analysis").shotiqBody(16)
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                                .padding(.horizontal, 16).frame(height: 52)
                                // Outline row, no fill: without a content shape
                                // only the glyph, the words and the chevron are
                                // touchable and the Spacer's gap between them —
                                // which is where the middle of the row is — is a
                                // hole that swallows the tap.
                                .contentShape(Rectangle())
                                .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
                            }
                            .buttonStyle(.plain)
                            .accessibilityIdentifier("Share analysis")
                            .padding(.top, 10)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .analysisInfoAlert($info)
        .task {
            guard !UITestHooks.active else { return }
            await loadProductionChrome()
            guard initialResult == nil else { return }
            isLoadingLatest = true
            defer { isLoadingLatest = false }
            do {
                if let latest = try await APIClient.shared.latestAnalysis() {
                    presentation = AnalysisResultPresentation(result: latest)
                } else {
                    presentation = .noResult
                    loadError = "No saved analysis result found."
                }
            } catch {
                presentation = .noResult
                loadError = "Couldn't load your latest saved analysis."
            }
        }
    }

    private func loadProductionChrome() async {
        let profile = try? await APIClient.shared.profile()
        let badges = try? await APIClient.shared.badges()
        let match = try? await APIClient.shared.shooterMatch()
        overviewChrome = AnalysisOverviewChrome.production(
            user: app.user,
            profile: profile,
            badges: badges,
            match: match)
    }

    private func stripLink(_ t: String, _ dest: some View) -> some View {
        NavigationLink { dest } label: {
            Text(t).shotiqBody(13, weight: .semibold).kerning(0.6)
                .foregroundStyle(ShotIQColor.graphite)
        }
    }
    private func miniStat(_ v: String, _ l: String) -> some View {
        VStack(spacing: 2) {
            Text(v).font(.custom("Tungsten-Medium", size: v.count > 10 ? 13 : 22)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(l).shotiqBody(8, weight: .medium).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
        }
    }
    private func metricRow(_ row: [AnalysisMetricTile]) -> some View {
        HStack(spacing: 0) {
            ForEach(row, id: \.label) { tile in
                NavigationLink {
                    MetricDetailView(metric: tile.detailMetric,
                                     value: tile.detailValue,
                                     valueText: tile.value,
                                     presentation: presentation)
                } label: {
                    VStack(spacing: 5) {
                        // Six measurements, six diagrams — chosen from the metric
                        // caption so two of them can never resolve alike.
                        ShotIQConceptGlyph(concept: tile.label, fallback: tile.icon, size: 22)
                            .foregroundStyle(ShotIQColor.ink).frame(height: 30)
                        Text(tile.label).shotiqBody(8, weight: .semibold).kerning(0.4)
                            .foregroundStyle(ShotIQColor.graphite)
                            .lineLimit(1).minimumScaleFactor(0.6)
                        Text(tile.value).font(.custom("Tungsten-Medium", size: 26)).foregroundStyle(ShotIQColor.ink)
                        Text(tile.verdict).shotiqBody(9, weight: .bold).kerning(0.4)
                            .foregroundStyle(tile.isPositive ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue)
                            .lineLimit(1).minimumScaleFactor(0.55)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                }
                .buttonStyle(.plain)
                if tile.label != row.last?.label {
                    Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 10)
                }
            }
        }
    }
    @ViewBuilder private func eliteMatchCard(_ match: AnalysisEliteMatchSummary) -> some View {
        if match.isMatched {
            NavigationLink { EliteMatchView() } label: {
                ShotIQCard {
                    HStack(spacing: 14) {
                        Group {
                            if match == .canonicalDemo {
                                // Elite reference shooter photo from the canonical render.
                                CanonicalPhoto("038-visual-002", width: 84, height: 104, cornerRadius: 6)
                            } else if let photoURL = match.photoURL {
                                AsyncImage(url: photoURL) { phase in
                                    switch phase {
                                    case .success(let image):
                                        image.resizable().scaledToFill()
                                    default:
                                        ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-elite-match",
                                                                 size: 42,
                                                                 label: nil)
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                    }
                                }
                                .frame(width: 84, height: 104)
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                            } else {
                                ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-elite-match",
                                                         size: 42,
                                                         label: nil)
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                    .frame(width: 84, height: 104)
                            }
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text(match.title).shotiqDisplay(22)
                            Text(match.subtitle).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            matchLine("point.3.connected.trianglepath.dotted", "Release Angle", match.releaseAngleText)
                            matchLine("figure.basketball", "Elbow Angle", match.elbowAngleText)
                            matchLine("point.bottomleft.forward.to.point.topright.scurvepath", "Shot Arc", match.shotArcText)
                            if match.isEstimated {
                                Text("Catalog estimates").shotiqBody(10, weight: .medium)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        Spacer()
                        VStack(spacing: 4) {
                            Ring(pct: match.pct, color: ShotIQColor.analysisBlue, lineWidth: 7)
                                .frame(width: 74, height: 74)
                                .overlay(Text(match.overallText).font(.custom("Tungsten-Medium", size: 24)))
                            Text("OVERALL MATCH").shotiqBody(9, weight: .semibold).kerning(0.5)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                    }
                    .padding(14)
                }
            }
        } else {
            ShotIQCard {
                HStack(spacing: 14) {
                    Image(systemName: isLoadingLatest ? "clock" : "point.3.connected.trianglepath.dotted")
                        .font(.system(size: 30, weight: .light))
                        .foregroundStyle(ShotIQColor.analysisBlue)
                        .frame(width: 54)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(isLoadingLatest ? "LOADING ANALYSIS" : match.title).shotiqDisplay(21)
                        Text(loadError ?? match.subtitle)
                            .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 0)
                }
                .padding(14)
            }
        }
    }
    private func matchLine(_ icon: String, _ label: String, _ value: String) -> some View {
        HStack(spacing: 6) {
            MechanicGlyph(kind: .init(metricLabel: label), size: 13)
                .foregroundStyle(ShotIQColor.ink).frame(width: 14)
            Text(label).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
            Text(value).shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.analysisBlue)
        }
    }
}

/// Normalized-keypoint pose overlay drawn through the surface's fit transform.
/// Layers (bones / joint points / ball / joint-angle callouts) can be toggled
/// so screens with overlay controls give visible feedback; defaults keep the
/// canonical look everywhere else.
struct SkeletonOverlay: View {
    // normalized (0-1) demo keypoints: ankle→knee→hip→shoulder→elbow→wrist + ball
    let joints: [CGPoint] = [
        .init(x: 0.47, y: 0.9), .init(x: 0.46, y: 0.72), .init(x: 0.5, y: 0.55),
        .init(x: 0.52, y: 0.36), .init(x: 0.6, y: 0.27), .init(x: 0.66, y: 0.18),
    ]
    /// A body actually found in the picture underneath. When this is set the
    /// overlay draws THAT skeleton instead of the six constants above — the
    /// player's own joints rather than the canonical shooter's. Every existing
    /// caller passes nothing and is unaffected.
    ///
    /// The pose is in unit coordinates of the IMAGE, so whoever supplies one is
    /// responsible for sizing this view to the image's drawn rect (see
    /// `CapturedPoseImage`); an aspect-filled photo overflows its container and
    /// drawing into the container instead would slide every joint off the body.
    var pose: DetectedPose? = nil
    var ball = CGPoint(x: 0.7, y: 0.12)
    var showBones = true
    var showJoints = true
    var showBall = true
    var showAngles = false
    var boneColor: Color = .white
    var jointColor: Color = ShotIQColor.shotiqOrange
    var body: some View {
        Canvas { ctx, size in
            func pt(_ p: CGPoint) -> CGPoint { CGPoint(x: p.x * size.width, y: p.y * size.height) }

            // A real detection replaces the constants entirely: a full
            // seventeen-point figure with two arms and two legs, drawn from
            // where this player's joints actually are.
            if let pose {
                if showBones {
                    var path = Path()
                    for (a, b) in pose.boneSegments {
                        path.move(to: pt(a))
                        path.addLine(to: pt(b))
                    }
                    ctx.stroke(path, with: .color(boneColor),
                               style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
                }
                if showJoints {
                    for j in pose.points {
                        ctx.fill(Path(ellipseIn: CGRect(origin: pt(j).applying(.init(translationX: -3.5, y: -3.5)),
                                                        size: CGSize(width: 7, height: 7))),
                                 with: .color(jointColor))
                    }
                }
                return
            }

            if showBones {
                var path = Path()
                path.move(to: pt(joints[0]))
                joints.dropFirst().forEach { path.addLine(to: pt($0)) }
                ctx.stroke(path, with: .color(boneColor), style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
            }
            if showJoints {
                for j in joints {
                    ctx.stroke(Path(ellipseIn: CGRect(origin: pt(j).applying(.init(translationX: -5, y: -5)),
                                                      size: CGSize(width: 10, height: 10))),
                               with: .color(jointColor), lineWidth: 2.5)
                }
            }
            if showBall {
                ctx.stroke(Path(ellipseIn: CGRect(origin: pt(ball).applying(.init(translationX: -8, y: -8)),
                                                  size: CGSize(width: 16, height: 16))),
                           with: .color(jointColor), lineWidth: 3)
            }
            if showAngles {
                // Interior angle at each mid-chain joint, from the demo keypoints.
                for i in 1..<(joints.count - 1) {
                    let a = pt(joints[i - 1]), b = pt(joints[i]), c = pt(joints[i + 1])
                    let v1 = atan2(a.y - b.y, a.x - b.x), v2 = atan2(c.y - b.y, c.x - b.x)
                    var deg = abs(v1 - v2) * 180 / .pi
                    if deg > 180 { deg = 360 - deg }
                    ctx.stroke(Path(ellipseIn: CGRect(x: b.x - 12, y: b.y - 12, width: 24, height: 24)),
                               with: .color(ShotIQColor.shotiqOrange.opacity(0.7)), lineWidth: 1.5)
                    // Canvas text must stay a `Text`: GraphicsContext.draw has no
                    // overload for `some View`, so the brand face is applied with
                    // `.font(_:)` (Text -> Text) rather than the shotiq* helpers.
                    ctx.draw(Text("\(Int(deg))°")
                        .font(.custom(shotiqBoxedFace(.bold), size: 11))
                        .foregroundColor(ShotIQColor.shotiqOrange),
                             at: CGPoint(x: b.x + 20, y: b.y - 14))
                }
            }
        }
        .accessibilityHidden(true)
    }
}

struct NoAnalysisYetView: View {    // 039
    var body: some View {
        CanonicalScreen(testID: "screen-ios-no-analysis-yet") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            NavigationLink { AnalyzeHubView() } label: {
                                HStack(spacing: 12) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "viewfinder"),
                                                             size: 22,
                                                             label: nil)
                                    Text("Analyze a shot").shotiqBody(19, weight: .semibold)
                                }
                                .frame(maxWidth: .infinity).frame(height: 62)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            .padding(.top, 16)
                            sourceRow.padding(.top, 12)
                            HStack {
                                SectionLabel(text: "ANALYSIS HISTORY")
                                Spacer()
                                Text("0 ANALYSES").shotiqBody(12, weight: .semibold).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 24)
                            VStack(spacing: 0) {
                                PhaseGlyph(active: true, size: 120)
                                Text("NO ANALYSES YET").shotiqDisplay(30).padding(.top, 18)
                                Text("Upload a shot or record live to get AI-powered breakdowns of your mechanics.")
                                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                                    .multilineTextAlignment(.center).padding(.horizontal, 24).padding(.top, 6)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.top, 26)
                            sourceRow.padding(.top, 24)
                            PhaseStrip().padding(.top, 22)
                            NavigationLink { FlawsOverviewView() } label: {
                                CoachTargetCard(bordered: false)
                                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            }
                            .padding(.top, 14)
                            VStack(alignment: .leading, spacing: 8) {
                                SectionLabel(text: "LATEST SESSION")
                                SessionStatsStrip()
                            }
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            .padding(.vertical, 10)
                            Spacer(minLength: 20)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private var sourceRow: some View {
        HStack(spacing: 12) {
            NavigationLink { PhotoUploadSourceView() } label: {
                sourceCard("photo.on.rectangle", "Upload image")
            }
            NavigationLink { VideoUploadView() } label: {
                sourceCard("film", "Upload video")
            }
            NavigationLink { LiveCameraSetupView() } label: {
                sourceCard("point.3.connected.trianglepath.dotted", "Live camera")
            }
        }
    }
    private func sourceCard(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 10) {
            Group {
                if let source = CaptureSource(sourceLabel: label) {
                    CaptureSourceGlyph(source: source, size: 26)
                } else {
                    Image(systemName: icon).font(.system(size: 26, weight: .light))
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            Text(label).shotiqBody(14).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity).frame(height: 96)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct AnalysisErrorView: View {    // 040
    /// Single item-based route: stacking two `navigationDestination(isPresented:)`
    /// modifiers on one view makes only the last one work.
    enum ErrorRoute: Hashable { case retry, chooseFrame }
    var retryImage: UIImage? = nil
    var retryViewpoint: ShotViewpoint = .side
    @State private var route: ErrorRoute?
    private var hasRetryMedia: Bool { retryImage != nil }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-error") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top, spacing: 16) {
                                ZStack(alignment: .bottomTrailing) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "viewfinder"),
                                                             size: 42,
                                                             label: nil)
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "exclamationmark.triangle"), size: 32)
                                        .font(.system(size: 18)).foregroundStyle(ShotIQColor.reviewRed)
                                        .offset(x: 6, y: 6)
                                }
                                .frame(width: 56)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("ANALYSIS ERROR").font(.custom("Tungsten-Medium", size: 24))
                                        .foregroundStyle(ShotIQColor.reviewRed)
                                    Text("We couldn't complete the analysis.")
                                        .shotiqBody(16, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                    Text("Not enough of your body was visible in this clip.")
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(16)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.reviewRed))
                            .padding(.top, 14)
                            PrimaryButton(title: "Try analysis again", icon: "viewfinder", color: ShotIQColor.analysisBlue) {
                                route = .retry
                            }
                            .padding(.top, 14)
                            HStack(spacing: 12) {
                                Button { route = .chooseFrame } label: {
                                    halfButton("point.3.connected.trianglepath.dotted", "Choose another frame")
                                }
                                .buttonStyle(.plain)
                                Button {
                                    if let url = URL(string: "mailto:support@shotiq.app?subject=Analysis%20error") {
                                        UIApplication.shared.open(url)
                                    }
                                } label: {
                                    halfButton("headphones", "Contact support")
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 10)
                            HStack(alignment: .top, spacing: 16) {
                                Group {
                                    if let retryImage {
                                        Image(uiImage: retryImage)
                                            .resizable()
                                            .scaledToFill()
                                            .frame(height: 250)
                                            .frame(maxWidth: .infinity)
                                            .clipped()
                                            .clipShape(RoundedRectangle(cornerRadius: 8))
                                    } else {
                                        // Pose overlay is baked into the canonical crop.
                                        CanonicalMediaSurface(key: "040-visual-003", height: 250)
                                            .frame(maxWidth: .infinity)
                                    }
                                }
                                VStack(alignment: .leading, spacing: 0) {
                                    FormScorePanel(numeralSize: 56, barWidth: 110)
                                    Text("SHOT QUALITY").shotiqBody(12, weight: .semibold).kerning(0.8)
                                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 16)
                                    Text("FRAME 18/48").shotiqBody(13).foregroundStyle(ShotIQColor.ink)
                                        .padding(.top, 2)
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-upload-video",
                                                             size: 28,
                                                             label: nil)
                                        .padding(.top, 6)
                                    Text("Release phase detected.").shotiqBody(12)
                                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                                }
                                .frame(width: 120, alignment: .leading)
                            }
                            .padding(.top, 18)
                            PhaseStrip().padding(.top, 16)
                            NavigationLink { FlawsOverviewView() } label: {
                                CoachTargetCard(bordered: false)
                                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            }
                            .padding(.top, 14)
                            VStack(alignment: .leading, spacing: 8) {
                                SectionLabel(text: "LATEST SESSION")
                                SessionStatsStrip()
                            }
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            .padding(.vertical, 10)
                            HStack(spacing: 10) {
                                Image(systemName: "info.circle").font(.system(size: 15)).foregroundStyle(ShotIQColor.ink)
                                Text(hasRetryMedia
                                     ? "Your selected \(retryViewpoint.shortTitle.lowercased()) view is saved for retry."
                                     : "Your media is saved. This clip will be available in your history.")
                                    .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .padding(.top, 6)
                            Spacer(minLength: 20)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .navigationDestination(item: $route) { r in
            switch r {
            case .retry:
                if let retryImage {
                    UploadQualityCheckView(image: retryImage, viewpoint: retryViewpoint)
                } else {
                    AnalyzeHubView()
                }
            case .chooseFrame:
                if let retryImage {
                    PhotoReviewCropView(image: retryImage, viewpoint: retryViewpoint)
                } else {
                    FrameDetailSkeletonView()
                }
            }
        }
    }
    private func halfButton(_ icon: String, _ title: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 15))
            Text(title).shotiqBody(14)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .foregroundStyle(ShotIQColor.ink)
        .frame(maxWidth: .infinity).frame(height: 50)
        .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
    }
}

struct ShotBreakdownView: View {    // 041
    @Environment(\.dismiss) private var dismiss
    var presentation: AnalysisResultPresentation = .canonicalDemo
    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    /// Canonical filmstrip crops, matched to their column on the 853x1844 render.
    /// LOAD has no crop in the asset set, so that cell keeps the dark surface.
    private static func phaseFrameKey(_ phase: String) -> String? {
        switch phase {
        case "SETUP": return "041-visual-001"
        case "RISE": return "041-visual-003"
        case "RELEASE": return "041-visual-002"
        case "FOLLOW-THROUGH": return "041-visual-004"
        default: return nil
        }
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-shot-breakdown") {
            VStack(spacing: 0) {
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "chevron.left").font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                    Wordmark(size: 30)
                    Spacer()
                    ShareLink(item: presentation.shotBreakdownShareText) {
                        Image(systemName: "square.and.arrow.up").font(.system(size: 18))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                }
                .padding(.horizontal, 20)
                .frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .center, spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("SHOT BREAKDOWN").shotiqDisplay(36)
                                Text(presentation.recordedLabel).shotiqBody(14)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer(minLength: 8)
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                        }
                        .padding(.top, 14)
                        // Five-frame phase filmstrip — each frame opens the frame detail.
                        HStack(spacing: 2) {
                            ForEach(phases, id: \.self) { phase in
                                NavigationLink { FrameDetailSkeletonView() } label: {
                                    VStack(spacing: 8) {
                                        if presentation.id != "canonical-demo",
                                           presentation.mediaURL != nil || presentation.videoURL != nil {
                                            AnalysisResultMediaSurface(presentation: presentation,
                                                                       fallbackKey: "041-visual-002",
                                                                       height: 190)
                                        } else if let key = Self.phaseFrameKey(phase) {
                                            // Canonical phase frame — pose overlay already in the pixels.
                                            CanonicalPhoto(key, height: 190, cornerRadius: 2)
                                        } else {
                                            ZStack {
                                                RoundedRectangle(cornerRadius: 2)
                                                    .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                                                SkeletonOverlay()
                                            }
                                            .frame(height: 190)
                                        }
                                        Text(phase).shotiqBody(9, weight: phase == "RELEASE" ? .bold : .regular)
                                            .kerning(0.4)
                                            .foregroundStyle(phase == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                            .lineLimit(1).minimumScaleFactor(0.6)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.top, 14)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 18) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("FORM SCORE").shotiqBody(12, weight: .semibold).kerning(0.8)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(alignment: .center, spacing: 14) {
                                        // A 62pt numeral with no line limit next
                                        // to a rigid 110pt bar: the card ran out
                                        // of width and the score wrapped between
                                        // its own digits — "8" over "2" on 041.
                                        // The numeral is now unbreakable and the
                                        // bar is the elastic half of the row.
                                        Text(presentation.scoreText).font(.custom("Tungsten-Medium", size: 62))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                            .lineLimit(1)
                                            .fixedSize(horizontal: true, vertical: false)
                                        ScoreBar(pct: presentation.scorePct).frame(maxWidth: 110)
                                    }
                                }
                                Spacer()
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(presentation.scoreVerdict).font(.custom("Tungsten-Medium", size: 20))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text(presentation.scoreCaption).shotiqBody(13)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(16)
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            HStack(spacing: 0) {
                                breakdownStat("figure.basketball", "RELEASE HEIGHT", presentation.releaseHeightText, nil)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                                breakdownStat("angle", "RELEASE OFFSET", presentation.releaseOffsetText, nil)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                                breakdownStat("point.3.filled.connected.trianglepath.dotted", "ELBOW ANGLE", presentation.elbowAngleText, nil)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                                breakdownStat("point.bottomleft.forward.to.point.topright.scurvepath", "WRIST ANGLE", presentation.wristAngleText, nil)
                            }
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 0) {
                                Text("PHASE COACHING").shotiqBody(12, weight: .semibold).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.graphite)
                                HStack(alignment: .top, spacing: 16) {
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack(spacing: 10) {
                                            Text("Release").shotiqBody(24, weight: .semibold)
                                                .foregroundStyle(ShotIQColor.ink)
                                            VStack(spacing: 2) {
                                                PhaseGlyph(active: true, size: 26)
                                                Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 30, height: 2)
                                            }
                                        }
                                        Text("Great elevation and alignment. Focus on snapping wrist down to create more backspin.")
                                            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                        NavigationLink { FrameDetailSkeletonView() } label: {
                                            HStack(spacing: 8) {
                                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "viewfinder"),
                                                                         size: 14,
                                                                         label: nil)
                                                Text("Open release frame").shotiqBody(14)
                                                    .foregroundStyle(ShotIQColor.ink)
                                                Image(systemName: "chevron.right").font(.system(size: 11))
                                                    .foregroundStyle(ShotIQColor.graphite)
                                            }
                                            .padding(.horizontal, 14).frame(height: 42)
                                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                        }
                                        .padding(.top, 4)
                                    }
                                    Spacer()
                                    VStack(spacing: 4) {
                                        ReleaseHandGlyph(size: 44)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text(presentation.elbowAngleText).font(.custom("Tungsten-Medium", size: 20))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        Text("Release\nAngle").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                            .multilineTextAlignment(.center)
                                    }
                                    .padding(8)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .padding(.top, 10)
                            }
                            .padding(16)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("SHOT CONTEXT").shotiqBody(12, weight: .semibold).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.graphite)
                                HStack(spacing: 0) {
                                    contextItem("basketball", "Catch & Shoot", "Shot Type", ShotIQColor.ink)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                    contextItem("mappin.and.ellipse", "Right Corner", "Court Location", ShotIQColor.ink)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                    contextItem("clock", "26:12", "In Workout", ShotIQColor.ink)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                    contextItem("checkmark.circle", "Make", "Result", ShotIQColor.confirmGreen)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 12)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func breakdownStat(_ icon: String, _ label: String, _ value: String, _ unit: String?) -> some View {
        VStack(spacing: 5) {
            MechanicGlyph(kind: .init(metricLabel: label), size: 20)
                .foregroundStyle(ShotIQColor.ink)
                .frame(height: 26)
            Text(label).shotiqBody(8, weight: .semibold).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value).font(.custom("Tungsten-Medium", size: 26)).foregroundStyle(ShotIQColor.ink)
                if let unit {
                    Text(unit).font(.custom("Tungsten-Medium", size: 14)).foregroundStyle(ShotIQColor.ink)
                }
            }
            Text("GOOD").shotiqBody(9, weight: .bold).kerning(0.4)
                .foregroundStyle(ShotIQColor.analysisBlue)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
    }
    private func contextItem(_ icon: String, _ value: String, _ label: String, _ tint: Color) -> some View {
        HStack(spacing: 8) {
            // The shot-type cell gets its own bespoke mark; court location, clock
            // and result keep their system marks (no bespoke mark exists for
            // those three, and they are already three different concepts).
            Group {
                if let shot = ShotTypeKind(shotTypeLabel: value) {
                    ShotTypeGlyph(kind: shot, size: 20)
                } else {
                    Image(systemName: icon).font(.system(size: 17, weight: .light))
                }
            }
            .foregroundStyle(tint)
            VStack(alignment: .leading, spacing: 1) {
                Text(value).shotiqBody(12, weight: .semibold).foregroundStyle(tint)
                    .lineLimit(1).minimumScaleFactor(0.6)
                Text(label).shotiqBody(9).foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1).minimumScaleFactor(0.6)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, 6)
    }
}

struct FrameDetailSkeletonView: View { // 042
    @Environment(\.dismiss) private var dismiss
    @State private var frame = 3.0
    @State private var phase = "RELEASE"
    @State private var showSkeleton = true
    @State private var showJoints = false
    @State private var showBall = false
    @State private var showAngles = false
    private let allPhases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    /// The five frames canonical shows in the scrubber strip, left to right.
    private let frameThumbs = ["042-frame-001", "042-frame-002", "042-frame-003",
                               "042-frame-004", "042-frame-005"]
    /// Frame 42 corresponds to the canonical slider position 3.
    private var frameNumber: Int { 39 + Int(frame) }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-frame-detail-skeleton") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Button { dismiss() } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "chevron.left").font(.system(size: 15, weight: .semibold))
                                    Text("ANALYZE").shotiqBody(13, weight: .semibold).kerning(0.8)
                                }
                                .foregroundStyle(ShotIQColor.graphite)
                            }
                            .buttonStyle(.plain)
                            Spacer()
                            Text("SHOT 12 OF 24").shotiqBody(13, weight: .semibold).kerning(0.8)
                                .foregroundStyle(ShotIQColor.graphite)
                            Spacer()
                            NavigationLink { ShotBreakdownView() } label: {
                                HStack(spacing: 6) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-upload-video",
                                                             size: 16,
                                                             label: nil)
                                    Text("View sequence").shotiqBody(13)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 20).frame(height: 44)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            // The canonical frame, not a black rectangle. 042's
                            // sidecar bundles one crop for this panel and it is the
                            // *finished* panel: 767x689 at y 333 on the 853x1844
                            // canvas — 353x317pt, which is exactly the width this
                            // column offers, so it lands with no crop at all — and
                            // it already carries the pose skeleton, the 168° elbow
                            // callout, the phase and FPS chips, the CONFIDENCE card
                            // and the transport row burned into the pixels.
                            //
                            // So the app draws none of those a second time: the
                            // skeleton, the confidence card and the FPS chip are
                            // gone, `MediaSurface`'s own scrubber is gone (that is
                            // why this is a plain CanonicalPhoto), and the phase
                            // Menu is kept only as a transparent hit target sitting
                            // on its own printed chip, so the control still works
                            // without stamping a second chip over the first.
                            ZStack(alignment: .topLeading) {
                                CanonicalPhoto("042-visual-002", height: 317, cornerRadius: 4)
                                // The live Canvas only comes out for something the
                                // printed frame does not already show — joint
                                // points, the ball marker, or the angle arcs behind
                                // "Show joint angles". Left unconditional it drew a
                                // second white stick figure a few points off the
                                // baked one.
                                if showJoints || showBall || showAngles {
                                    SkeletonOverlay(showBones: showSkeleton, showJoints: showJoints,
                                                    showBall: showBall, showAngles: showAngles)
                                }
                                HStack {
                                    Menu {
                                        ForEach(allPhases, id: \.self) { p in
                                            Button(p) { phase = p }
                                        }
                                    } label: {
                                        HStack(spacing: 6) {
                                            Text("\(phase) • FRAME \(frameNumber)").shotiqBody(12, weight: .bold).kerning(0.5)
                                            Image(systemName: "chevron.down").font(.system(size: 10, weight: .bold))
                                        }
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 12).padding(.vertical, 8)
                                        .background(.black.opacity(0.55), in: RoundedRectangle(cornerRadius: 8))
                                        .opacity(0)
                                    }
                                    .accessibilityLabel("Shot phase, \(phase), frame \(frameNumber)")
                                    Spacer()
                                }
                                .padding(10)
                            }
                            .padding(.top, 14)
                            HStack(spacing: 10) {
                                Button { showSkeleton.toggle() } label: {
                                    overlayToggleLabel("point.3.connected.trianglepath.dotted", "Skeleton", showSkeleton)
                                }
                                .buttonStyle(.plain)
                                Button { showJoints.toggle() } label: {
                                    overlayToggleLabel("circle.dotted", "Joint points", showJoints)
                                }
                                .buttonStyle(.plain)
                                NavigationLink { AnnotationToolbarView() } label: {
                                    overlayToggleLabel("square.and.pencil", "Annotations", false)
                                }
                                Button { showBall.toggle() } label: {
                                    overlayToggleLabel("basketball", "Basketball", showBall)
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 14)
                            PhaseStrip(active: phase).padding(.top, 16)
                            HStack(spacing: 10) {
                                Button { frame = max(0, frame - 1) } label: {
                                    VStack(spacing: 2) {
                                        HStack(spacing: 4) {
                                            Image(systemName: "chevron.left").font(.system(size: 11, weight: .semibold))
                                            Text("Previous").shotiqBody(13, weight: .semibold)
                                        }
                                        Text("Frame \(frameNumber - 1)").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    .foregroundStyle(ShotIQColor.ink)
                                    .frame(width: 78, height: 56)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .buttonStyle(.plain)
                                .disabled(frame <= 0)
                                // Canonical's frame scrubber is five different
                                // frames of the take, not five dark rectangles.
                                // The 042 sidecar declares one photo region (the
                                // hero, already bundled as 042-visual-002) and
                                // says nothing about this strip, so each thumb is
                                // cut from the render: the row sits at y 1331…1414
                                // between the phase strip above and the slider
                                // below, and the five thumbs are separated by the
                                // paper gutters at x 271, 367, 470 and 574.
                                // Canonical's own selection ring is excluded from
                                // the middle crop — the app draws that ring.
                                HStack(spacing: 4) {
                                    ForEach(0..<5, id: \.self) { i in
                                        Button { frame = min(9, max(0, frame + Double(i - 2))) } label: {
                                            CanonicalPhoto(frameThumbs[i], height: 38, cornerRadius: 4)
                                                .overlay(RoundedRectangle(cornerRadius: 4)
                                                    .stroke(i == 2 ? ShotIQColor.shotiqOrange : .clear, lineWidth: 2))
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                Button { frame = min(9, frame + 1) } label: {
                                    VStack(spacing: 2) {
                                        HStack(spacing: 4) {
                                            Text("Next").shotiqBody(13, weight: .semibold)
                                            Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold))
                                        }
                                        Text("Frame \(frameNumber + 1)").shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    .foregroundStyle(ShotIQColor.ink)
                                    .frame(width: 78, height: 56)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .buttonStyle(.plain)
                                .disabled(frame >= 9)
                            }
                            .padding(.top, 14)
                            Slider(value: $frame, in: 0...9, step: 1).padding(.top, 6)
                            HStack(alignment: .center, spacing: 0) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("FORM SCORE").shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(spacing: 6) {
                                        Text("82").font(.custom("Tungsten-Medium", size: 30))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: 0.82).frame(width: 34)
                                    }
                                    Text("GOOD").font(.custom("Tungsten-Medium", size: 13))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                }
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                StatBlock(value: "62.5%", label: "MAKE %", valueSize: ShotIQType.numeric)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                NavigationLink { FlawsOverviewView() } label: {
                                    HStack(spacing: 0) {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("TARGET").shotiqBody(9, weight: .semibold).kerning(0.5)
                                                .foregroundStyle(ShotIQColor.graphite)
                                            Text("Keep elbow stacked through release")
                                                .shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(2).minimumScaleFactor(0.7)
                                        }
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 14)
                            PrimaryButton(title: showAngles ? "Hide joint angles" : "Show joint angles", icon: "angle") {
                                withAnimation(.easeInOut(duration: 0.15)) {
                                    showAngles.toggle()
                                    if showAngles { showJoints = true }
                                }
                            }
                            .padding(.top, 16)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private func overlayToggleLabel(_ icon: String, _ label: String, _ active: Bool) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 19, weight: .light))
            Text(label).shotiqBody(12)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
        .frame(maxWidth: .infinity).frame(height: 68)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct AnnotationToolbarView: View { // 043
    private struct Annotation: Identifiable {
        let id = UUID()
        let tool: String
        var points: [CGPoint]
    }
    @Environment(\.dismiss) private var dismiss
    @State private var tool = "Draw"
    @State private var annotations: [Annotation] = []
    @State private var redoStack: [Annotation] = []
    @State private var current: Annotation?
    @State private var playing = true
    @State private var frameTime = 1.28
    @State private var showSaved = false
    private let tools: [(String, String)] = [
        ("Draw", "scribble"), ("Arrow", "arrow.up.right"), ("Angle", "angle"),
        ("Label", "textformat"), ("Undo", "arrow.uturn.backward"),
        ("Redo", "arrow.uturn.forward"), ("Clear", "trash"),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-annotation-toolbar") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Button { dismiss() } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "chevron.left").font(.system(size: 15, weight: .semibold))
                                    Text("Back").shotiqBody(14)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            .buttonStyle(.plain)
                            Spacer()
                            HStack(spacing: 6) {
                                Text("ANALYSIS").shotiqCondensed(14, weight: .heavy)
                                Text("— ANNOTATION").shotiqBody(13, weight: .semibold).kerning(0.5)
                            }
                            .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Text("Frame 43 / 96").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.horizontal, 20).frame(height: 38)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(spacing: 0) {
                                annotStat("FORM SCORE", "82")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                annotStat("SHOTS", "24")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                annotStat("MAKES", "15")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                annotStat("%", "62.5%")
                            }
                            .padding(.top, 4)
                            HStack(spacing: 12) {
                                CorrectionGlyph(kind: .stack, size: 34).foregroundStyle(ShotIQColor.ink)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("PRIMARY TARGET").shotiqBody(11, weight: .semibold).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("Keep elbow stacked through release.")
                                        .shotiqBody(15).foregroundStyle(ShotIQColor.shotiqOrange)
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(.horizontal, 14).padding(.vertical, 9)
                            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            .padding(.top, 8)
                            ZStack(alignment: .topLeading) {
                                ZStack {
                                    // Canonical annotation frame — release-angle callout and
                                    // pose overlay are already burned into the crop.
                                    //
                                    // At 430pt this frame alone overran the fold and left the
                                    // ANNOTATION TOOLS palette and the Save CTA — the entire
                                    // point of this screen — unreachable in a screenshot. The
                                    // frame, the chrome above it, the palette and the CTA all
                                    // have to share the ~686pt between the notch and the tab
                                    // bar, so the frame is sized to what is left once the
                                    // other three are placed; canonical shows all four at once.
                                    CanonicalMediaSurface(key: "043-visual-001", height: 175)
                                    annotationCanvas
                                }
                                .contentShape(Rectangle())
                                .gesture(annotationGesture)
                                HStack(spacing: 6) {
                                    Circle().fill(.white).frame(width: 6, height: 6)
                                    Text("LIVE").shotiqBody(12, weight: .bold).kerning(0.5)
                                        .foregroundStyle(.white)
                                }
                                .padding(.horizontal, 12).padding(.vertical, 7)
                                .background(.black.opacity(0.6), in: Capsule())
                                .padding(10)
                            }
                            .overlay(alignment: .bottomLeading) {
                                Text(String(format: "00:%05.2f", frameTime))
                                    .font(.custom("Tungsten-Medium", size: 15)).foregroundStyle(.white)
                                    .padding(.horizontal, 12).padding(.vertical, 7)
                                    .background(.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 8))
                                    .padding(12)
                            }
                            .overlay(alignment: .bottomTrailing) {
                                HStack(spacing: 18) {
                                    Button { frameTime = max(0, frameTime - 0.04) } label: {
                                        Image(systemName: "backward.end.fill")
                                    }
                                    Button { playing.toggle() } label: {
                                        Image(systemName: playing ? "pause.fill" : "play.fill")
                                    }
                                    Button { frameTime += 0.04 } label: {
                                        Image(systemName: "forward.end.fill")
                                    }
                                }
                                .buttonStyle(.plain)
                                .font(.system(size: 14)).foregroundStyle(.white)
                                .padding(.horizontal, 16).padding(.vertical, 10)
                                .background(.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 8))
                                .padding(12)
                            }
                            .padding(.top, 10)
                            PhaseStrip().padding(.top, 10)
                            Text("ANNOTATION TOOLS").shotiqDisplay(20).padding(.top, 8)
                            HStack(spacing: 8) {
                                ForEach(tools, id: \.0) { name, icon in
                                    Button { activate(name) } label: {
                                        VStack(spacing: 6) {
                                            Image(systemName: icon).font(.system(size: 18, weight: .light))
                                                .foregroundStyle(toolDisabled(name) ? ShotIQColor.muted :
                                                                 tool == name ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                            Text(name).shotiqBody(11)
                                                .foregroundStyle(toolDisabled(name) ? ShotIQColor.muted : ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.6)
                                        }
                                        .frame(maxWidth: .infinity).frame(height: 52)
                                        .overlay(RoundedRectangle(cornerRadius: 8)
                                            .stroke(tool == name ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(toolDisabled(name))
                                }
                            }
                            .padding(.top, 8)
                            PrimaryButton(title: "Save annotations", color: ShotIQColor.confirmGreen) {
                                showSaved = true
                            }
                            .padding(.top, 12)
                            .alert("Annotations saved", isPresented: $showSaved) {
                                Button("OK", role: .cancel) {}
                            } message: {
                                Text("\(annotations.count) annotation\(annotations.count == 1 ? "" : "s") saved to frame 43.")
                            }
                            Spacer(minLength: 12)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    // MARK: annotation drawing

    private func toolDisabled(_ name: String) -> Bool {
        switch name {
        case "Undo": return annotations.isEmpty
        case "Redo": return redoStack.isEmpty
        case "Clear": return annotations.isEmpty
        default: return false
        }
    }
    private func activate(_ name: String) {
        switch name {
        case "Undo":
            if let last = annotations.popLast() { redoStack.append(last) }
        case "Redo":
            if let next = redoStack.popLast() { annotations.append(next) }
        case "Clear":
            annotations.removeAll()
            redoStack.removeAll()
        default:
            tool = name
        }
    }
    private var annotationGesture: some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { v in
                if current == nil {
                    current = Annotation(tool: tool, points: [v.startLocation, v.location])
                } else if tool == "Draw" {
                    current?.points.append(v.location)
                } else {
                    current?.points[current!.points.count - 1] = v.location
                }
            }
            .onEnded { _ in
                if let done = current {
                    annotations.append(done)
                    redoStack.removeAll()
                }
                current = nil
            }
    }
    private var annotationCanvas: some View {
        Canvas { ctx, _ in
            for a in annotations + (current.map { [$0] } ?? []) {
                draw(a, in: &ctx)
            }
        }
        .allowsHitTesting(false)
    }
    private func draw(_ a: Annotation, in ctx: inout GraphicsContext) {
        guard let first = a.points.first else { return }
        let last = a.points.last ?? first
        let color = ShotIQColor.shotiqOrange
        switch a.tool {
        case "Draw":
            var p = Path()
            p.move(to: first)
            a.points.dropFirst().forEach { p.addLine(to: $0) }
            ctx.stroke(p, with: .color(color), style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
        case "Arrow":
            var p = Path()
            p.move(to: first)
            p.addLine(to: last)
            let angle = atan2(last.y - first.y, last.x - first.x)
            for side in [angle + .pi * 0.85, angle - .pi * 0.85] {
                p.move(to: last)
                p.addLine(to: CGPoint(x: last.x + 14 * cos(side), y: last.y + 14 * sin(side)))
            }
            ctx.stroke(p, with: .color(color), style: StrokeStyle(lineWidth: 3, lineCap: .round))
        case "Angle":
            var p = Path()
            p.move(to: first)
            p.addLine(to: last)
            ctx.stroke(p, with: .color(color), style: StrokeStyle(lineWidth: 2.5, dash: [6, 4]))
            let deg = abs(atan2(last.y - first.y, last.x - first.x)) * 180 / .pi
            ctx.draw(Text("\(Int(deg))°").font(.custom(shotiqBoxedFace(.bold), size: 12)).foregroundColor(color),
                     at: CGPoint(x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 - 12))
        default: // Label
            ctx.draw(Text("NOTE").font(.custom(shotiqBoxedFace(.bold), size: 11)).foregroundColor(.white),
                     at: last)
            ctx.stroke(Path(roundedRect: CGRect(x: last.x - 24, y: last.y - 12, width: 48, height: 24), cornerRadius: 5),
                       with: .color(color), lineWidth: 1.5)
        }
    }
    private func annotStat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            // Four labels across the width, the longest of which is "MAKE %":
            // at 10pt SF with 0.5 tracking it did not fit its quarter and broke
            // to "MAKE" / "%" on 043.
            Text(label).shotiqMicroCaps()
                .foregroundStyle(ShotIQColor.graphite)
            Text(value).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, 4)
    }
}

struct FormScoreView: View {        // 044
    @Environment(\.dismiss) private var dismiss
    var presentation: AnalysisResultPresentation = .canonicalDemo
    @State private var info: AnalysisInfoNote?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-form-score") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            HStack {
                                Button { dismiss() } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: "chevron.left").font(.system(size: 14, weight: .semibold))
                                        Text("Back to analysis").shotiqBody(14)
                                    }
                                    .foregroundStyle(ShotIQColor.ink)
                                }
                                .buttonStyle(.plain)
                                Spacer()
                                ShareLink(item: presentation.formScoreShareText) {
                                    Image(systemName: "square.and.arrow.up").font(.system(size: 17))
                                        .foregroundStyle(ShotIQColor.ink)
                                }
                            }
                            .padding(.vertical, 12)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            HStack(spacing: 6) {
                                Text("FORM SCORE").shotiqDisplay(24)
                                infoButton("Form score",
                                           "A 0–100 grade of your shooting mechanics, weighted across form, balance, elbow, power and consistency.",
                                           size: 14)
                            }
                            .padding(.top, 18)
                            HStack(alignment: .top, spacing: 14) {
                                Text(presentation.scoreText).font(.custom("Tungsten-Medium", size: 76))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(presentation.scoreVerdict).font(.custom("Tungsten-Medium", size: 19))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text(presentation.scoreCaption).shotiqBody(13)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(.top, 12)
                                Spacer()
                                VStack(alignment: .trailing, spacing: 3) {
                                    TrendLine(points: presentation.scoreBreakdown.map { $0.scorePct * 100 }).frame(width: 110, height: 34)
                                    HStack(spacing: 3) {
                                        Text(presentation.provenanceSummary).shotiqBody(12, weight: .bold)
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Text(presentation.recordedLabel).shotiqBody(12)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    .lineLimit(1).minimumScaleFactor(0.65)
                                }
                                .padding(.top, 12)
                            }
                            ScoreBar(pct: presentation.scorePct).padding(.top, 2)
                            HStack(spacing: 12) {
                                Button {
                                    info = AnalysisInfoNote(title: "How the form score works",
                                                            message: "Form, balance, elbow, power and consistency are each scored 0–100 from your pose data, then weighted into one form score. 80+ is GOOD; 90+ is EXCELLENT.")
                                } label: {
                                    linkRow("doc.text", "View score method")
                                }
                                .buttonStyle(.plain)
                                NavigationLink { AnalyticsDetailedView() } label: {
                                    linkRow("point.3.connected.trianglepath.dotted", "Compare session")
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 16)
                            SectionLabel(text: "FORM BREAKDOWN").padding(.top, 22)
                            HStack(spacing: 8) {
                                ForEach(presentation.scoreBreakdown, id: \.metric) { item in
                                    NavigationLink {
                                        MetricDetailView(metric: item.metric,
                                                         value: item.scorePct,
                                                         valueText: item.scoreText,
                                                         presentation: presentation)
                                    } label: {
                                        VStack(spacing: 4) {
                                            Text(item.metric.uppercased()).shotiqBody(9, weight: .bold).kerning(0.4)
                                                .foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.5)
                                            MechanicGlyph(kind: .init(metricLabel: item.metric), size: 30,
                                                          accent: item.verdict == "NEEDS WORK"
                                                              ? ShotIQColor.reviewRed : ShotIQColor.shotiqOrange)
                                                .foregroundStyle(ShotIQColor.ink)
                                            Text(item.scoreText).font(.custom("Tungsten-Medium", size: 30))
                                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                            Text(item.verdict).shotiqBody(8, weight: .bold).kerning(0.3)
                                                .foregroundStyle(item.verdict == "NEEDS WORK" ? ShotIQColor.reviewRed : ShotIQColor.analysisBlue)
                                                .lineLimit(1).minimumScaleFactor(0.5)
                                            Text(item.caption).shotiqBody(8).foregroundStyle(ShotIQColor.graphite)
                                                .multilineTextAlignment(.center)
                                                .lineLimit(2).minimumScaleFactor(0.7)
                                        }
                                        .padding(.vertical, 10).padding(.horizontal, 2)
                                        .frame(maxWidth: .infinity)
                                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                    }
                                }
                            }
                            .padding(.top, 8)
                            HStack(spacing: 6) {
                                SectionLabel(text: "SOURCE COVERAGE")
                                infoButton("Source coverage",
                                           "How many fields in the saved analysis contract were measured. Missing fields stay unavailable instead of being replaced by demo values.")
                            }
                            .padding(.top, 22)
                            HStack(alignment: .center, spacing: 14) {
                                Text(presentation.sourceCoverageText).font(.custom("Tungsten-Medium", size: 44))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                Text(presentation.sourceCoverageVerdict).shotiqBody(12, weight: .bold).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                Text(presentation.sourceCoverageCaption)
                                    .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                Spacer(minLength: 0)
                                TrendLine(points: presentation.scoreBreakdown.map { $0.scorePct * 100 }, stroke: ShotIQColor.analysisBlue)
                                    .frame(width: 100, height: 36)
                            }
                            .padding(.top, 6)
                            SectionLabel(text: "KEY INSIGHT").padding(.top, 22)
                            HStack(alignment: .top, spacing: 14) {
                                CueGlyph(kind: .extensionLine, size: 44).foregroundStyle(ShotIQColor.ink)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(presentation.coachingTarget)
                                        .shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                    Text("Generated from the lowest trusted saved score and measured angle sources in this analysis.")
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 0)
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("IMPACT").shotiqBody(10, weight: .semibold).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(presentation.weakestScoreItem.verdict).font(.custom("Tungsten-Medium", size: 18))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Text(presentation.weakestScoreItem.metric).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(14)
                            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            .padding(.top, 8)
                            HStack(spacing: 6) {
                                SectionLabel(text: "METRIC DETAILS")
                                infoButton("Metric details",
                                           "Each metric's score, what it measures, and how strongly it impacts your overall form score. Tap a row to drill in.")
                            }
                            .padding(.top, 22)
                            HStack {
                                Text("METRIC").frame(maxWidth: .infinity, alignment: .leading)
                                Text("SCORE").frame(width: 110, alignment: .leading)
                                Text("DETAILS").frame(maxWidth: .infinity, alignment: .leading)
                                Text("IMPACT").frame(width: 52, alignment: .trailing)
                            }
                            .font(.system(size: 9, weight: .semibold)).kerning(0.5)
                            .foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 10)
                            ForEach(presentation.scoreBreakdown, id: \.metric) { item in
                                NavigationLink {
                                    MetricDetailView(metric: item.metric,
                                                     value: item.scorePct,
                                                     valueText: item.scoreText,
                                                     presentation: presentation)
                                } label: {
                                    HStack {
                                        Text(item.metric).shotiqBody(13).frame(maxWidth: .infinity, alignment: .leading)
                                        HStack(spacing: 6) {
                                            Text(item.scoreText).font(.custom("Tungsten-Medium", size: 17))
                                                .foregroundStyle(ShotIQColor.ink)
                                            ScoreBar(pct: item.scorePct, color: item.scorePct < 0.75 ? ShotIQColor.shotiqOrange : ShotIQColor.analysisBlue)
                                                .frame(width: 74)
                                        }
                                        .frame(width: 110, alignment: .leading)
                                        Text(item.detail).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(2).minimumScaleFactor(0.7)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                        Text(item.impact).shotiqBody(11).foregroundStyle(ShotIQColor.ink)
                                            .frame(width: 52, alignment: .trailing)
                                    }
                                    .padding(.vertical, 9)
                                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                                }
                            }
                            NavigationLink {
                                MetricDetailView(metric: presentation.weakestScoreItem.metric,
                                                 value: presentation.weakestScoreItem.scorePct,
                                                 valueText: presentation.weakestScoreItem.scoreText,
                                                 presentation: presentation)
                            } label: {
                                HStack(spacing: 10) {
                                    Text("Review weakest metric").shotiqBody(17, weight: .medium)
                                    Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold))
                                }
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                                .foregroundStyle(.white)
                            }
                            .padding(.top, 16)
                            HStack(spacing: 6) {
                                SectionLabel(text: "SESSION SUMMARY")
                                infoButton("Session summary",
                                           "Totals from the session this analysis belongs to: shots taken, makes, make percentage and the trend versus your previous session.")
                            }
                            .padding(.top, 20)
                            SessionStatsStrip().padding(.top, 8).padding(.bottom, 10)
                            Spacer(minLength: 16)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .analysisInfoAlert($info)
    }
    private func infoButton(_ title: String, _ message: String, size: CGFloat = 13) -> some View {
        Button { info = AnalysisInfoNote(title: title, message: message) } label: {
            Image(systemName: "info.circle").font(.system(size: size)).foregroundStyle(ShotIQColor.graphite)
        }
        .buttonStyle(.plain)
    }
    private func linkRow(_ icon: String, _ title: String) -> some View {
        HStack {
            Image(systemName: icon).font(.system(size: 15))
            Text(title).shotiqBody(14)
                .lineLimit(1).minimumScaleFactor(0.7)
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
        }
        .foregroundStyle(ShotIQColor.ink)
        .padding(.horizontal, 14).frame(height: 50)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct MetricDetailView: View {     // 045
    var metric = "Release"; var value = 0.88
    var valueText: String? = nil
    var presentation: AnalysisResultPresentation = .canonicalDemo
    @Environment(\.dismiss) private var dismiss
    @State private var addingPlan = false
    @State private var addedPlan = false
    @State private var planError: String?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-metric-detail") {
            VStack(spacing: 0) {
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "chevron.left").font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                    HStack(spacing: 8) {
                        Wordmark(size: 26)
                        Text("AI ANALYSIS").shotiqBody(13, weight: .semibold).kerning(1)
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    Spacer()
                    ShareLink(item: presentation.metricShareText(metric: metric, valueText: measuredText)) {
                        Image(systemName: "square.and.arrow.up").font(.system(size: 18)).foregroundStyle(ShotIQColor.ink)
                    }
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: 12) {
                            Circle().fill(ShotIQColor.ink).frame(width: 42, height: 42)
                                .overlay(Text("JE").shotiqBody(15, weight: .bold).foregroundStyle(.white))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Jordan Ellis").shotiqBody(16, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                Text("Right-handed • Advanced").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            HeaderStat(icon: "point.3.connected.trianglepath.dotted", value: "2,840", label: "POINTS")
                        }
                        .padding(.vertical, 12)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        HStack(alignment: .center, spacing: 0) {
                            StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .leading)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            StatBlock(value: "62.5%", label: "SHOOTING %", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity)
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("FORM SCORE").shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(presentation.scoreText).font(.custom("Tungsten-Medium", size: 28))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: presentation.scorePct).frame(width: 74)
                                }
                                .padding(12)
                            }
                        }
                        .padding(.top, 14)
                        Text(metric.uppercased()).shotiqDisplay(38).padding(.top, 16)
                        Text("Release • Right-handed").shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 2)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 0) {
                                // Canonical 045 prints a photograph in this column,
                                // 416x581 at x 37…453, y 449…1030 — 268pt tall for
                                // the ~192pt column. The 045 sidecar declares no
                                // photo element at all, so the app had nothing to
                                // draw and fell back to the dark media plate; that
                                // plate plus a synthetic skeleton is the grey
                                // rectangle readers reported.
                                //
                                // The pose skeleton and the 91° elbow callout are
                                // baked into the crop, so SkeletonOverlay goes:
                                // drawing it as well would stack two skeletons.
                                CanonicalPhoto("045-visual-001", height: 268)
                                    .frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 0) {
                                    Text("MEASURED").shotiqBody(11, weight: .semibold).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(measuredText).font(.custom("Tungsten-Medium", size: 54))
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text(metric.uppercased()).shotiqBody(11, weight: .semibold).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.vertical, 12)
                                    Text("ELITE RANGE").shotiqBody(11, weight: .semibold).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("85° — 95°").font(.custom("Tungsten-Medium", size: 30))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    ZStack(alignment: .leading) {
                                        Capsule().fill(ShotIQColor.rule).frame(height: 3)
                                        Capsule().fill(ShotIQColor.confirmGreen).frame(width: 60, height: 4)
                                            .offset(x: 30)
                                        Circle().stroke(ShotIQColor.confirmGreen, lineWidth: 3)
                                            .background(Circle().fill(.white))
                                            .frame(width: 14, height: 14).offset(x: 62)
                                    }
                                    .frame(height: 16).padding(.top, 6)
                                    HStack {
                                        Text("80°").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                        Spacer()
                                        Text("100°").shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.vertical, 12)
                                    Text("CONFIDENCE").shotiqBody(11, weight: .semibold).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(spacing: 8) {
                                        Text("HIGH").font(.custom("Tungsten-Medium", size: 20))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Text("92%").font(.custom("Tungsten-Medium", size: 20))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        TrendLine(points: [40, 52, 48, 66, 74, 88], stroke: ShotIQColor.analysisBlue)
                                            .frame(width: 60, height: 24)
                                    }
                                    .padding(.top, 2)
                                }
                                .padding(14)
                                .frame(width: 168)
                            }
                        }
                        .padding(.top, 14)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 16) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("WHY IT MATTERS").shotiqDisplay(19)
                                    Text("A stacked elbow (near 90°) improves shot consistency by aligning force from your legs through your shoulder to the ball.")
                                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer()
                                ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-bodytype-larger",
                                                         size: 46,
                                                         label: nil)
                            }
                            .padding(16)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 16) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("CORRECTION CUE").shotiqDisplay(19)
                                    Text("Keep elbow stacked under the ball")
                                        .shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("Avoid flaring out. Drive your elbow up and keep it under the ball at release.")
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer()
                                HStack(spacing: 14) {
                                    cueFigure("xmark.circle.fill", "TOO FLARED", ShotIQColor.reviewRed)
                                    cueFigure("checkmark.circle.fill", "STACKED", ShotIQColor.confirmGreen)
                                    cueFigure("xmark.circle.fill", "BEHIND BODY", ShotIQColor.reviewRed)
                                }
                            }
                            .padding(16)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                NavigationLink { FrameDetailSkeletonView() } label: {
                                    detailRow("film", "View frame", "See this rep at release")
                                }
                                .buttonStyle(.plain)
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                NavigationLink { EliteMatchView() } label: {
                                    detailRow("point.bottomleft.forward.to.point.topright.scurvepath", "Compare elite range", "See how you stack up")
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.top, 12)
                        PrimaryButton(title: addedPlan ? "Added to training plan" : "Add to training plan") {
                            addToTrainingPlan()
                        }
                        .disabled(addingPlan || addedPlan)
                        .opacity(addingPlan ? 0.6 : 1)
                        .padding(.top, 16)
                        if let planError {
                            Text(planError).shotiqBody(12).foregroundStyle(ShotIQColor.reviewRed)
                                .padding(.top, 6)
                        }
                        PhaseStrip().padding(.top, 18).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    /// "Training plan" maps to the web app's saved workouts (POST /api/saved-workouts).
    private func addToTrainingPlan() {
        guard !addingPlan, !addedPlan else { return }
        addingPlan = true
        planError = nil
        Task {
            struct Body: Encodable { let name: String; let drillCount: Int; let drillIds: [String] }
            struct Resp: Decodable { let success: Bool }
            do {
                let _: Resp = try await APIClient.shared.call(
                    "/api/saved-workouts", method: "POST",
                    body: Body(name: "\(metric) correction plan", drillCount: 1,
                               drillIds: ["towel-elbow-stack"]))
                addedPlan = true
            } catch {
                planError = "Couldn't add to your training plan. Check your connection and try again."
            }
            addingPlan = false
        }
    }
    private var measuredText: String {
        valueText ?? "\(Int(value * 100))°"
    }
    private func cueFigure(_ icon: String, _ label: String, _ tint: Color) -> some View {
        VStack(spacing: 5) {
            // The cue's own text picks the skeleton fragment; the small status
            // symbol below it stays a system mark (pass/fail has no bespoke mark).
            ShotIQConceptGlyph(concept: label, fallback: "circle.dashed", size: 26)
                .foregroundStyle(ShotIQColor.ink)
            Image(systemName: icon).font(.system(size: 13)).foregroundStyle(tint)
            Text(label).shotiqBody(7, weight: .semibold).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
    }
    private func detailRow(_ icon: String, _ title: String, _ sub: String) -> some View {
        HStack(spacing: 14) {
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 19)
                .foregroundStyle(ShotIQColor.ink).frame(width: 30)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                Text(sub).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
        }
        .padding(14)
    }
}

struct FlawsOverviewView: View {    // 046
    private struct SelectedFlaw: Identifiable, Hashable {
        let title: String
        let severity: String
        var id: String { "\(title)-\(severity)" }
    }

    private let flaws: [(Int, String, String, String, String, String, Color)] = [
        // rank, title, impact chip, description, confidence, cta, tint
        (1, "ELBOW FLARE", "HIGH IMPACT",
         "Elbow drifts outward during lift, creating inconsistent release path.",
         "92%", "Review elbow flare", ShotIQColor.reviewRed),
        (2, "EARLY WRIST EXTENSION", "MEDIUM IMPACT",
         "Wrist extends too early, reducing arc and consistency.",
         "76%", "View history", ShotIQColor.shotiqOrange),
        (3, "LOW FOLLOW-THROUGH", "LOW IMPACT",
         "Follow-through finishes below eye level, limiting rotation and hold.",
         "58%", "View history", ShotIQColor.muted),
    ]
    @Environment(\.dismiss) private var dismiss
    @State private var addingAll = false
    @State private var addedAll = false
    @State private var addAllError: String?
    @State private var selectedFlaw: SelectedFlaw?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-flaws-overview") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .center, spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Button { dismiss() } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
                                        Text("ANALYSIS").shotiqBody(12, weight: .semibold).kerning(0.8)
                                    }
                                    .foregroundStyle(ShotIQColor.graphite)
                                }
                                .buttonStyle(.plain)
                                Text("FLAWS OVERVIEW").shotiqDisplay(36)
                            }
                            Spacer(minLength: 8)
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                        }
                        .padding(.top, 14)
                        NavigationLink { FlawDetailView(title: "ELBOW FLARE", severity: "HIGH IMPACT") } label: {
                            CoachTargetCard(bordered: false)
                                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        }
                        .padding(.top, 14)
                        Text("AI analysis detected 3 priority flaws impacting your shot efficiency.")
                            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 14)
                        ForEach(flaws, id: \.0) { rank, title, impact, desc, confidence, cta, tint in
                            Button {
                                selectedFlaw = SelectedFlaw(title: title, severity: impact)
                            } label: {
                                flawCard(rank, title, impact, desc, confidence, cta, tint)
                            }
                            .accessibilityElement(children: .combine)
                            .accessibilityLabel("\(title), \(impact), \(cta)")
                            .accessibilityIdentifier(cta)
                            .buttonStyle(.plain)
                            .padding(.top, 12)
                        }
                        HStack(spacing: 12) {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-training-goal",
                                                     size: 24,
                                                     label: nil)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Add all 3 flaws to your training plan")
                                    .shotiqBody(15, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                Text("Get personalized drills to fix these issues.")
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            Button { addAllToPlan() } label: {
                                HStack(spacing: 6) {
                                    if addingAll {
                                        ProgressView().tint(.white).scaleEffect(0.8)
                                    }
                                    Text(addedAll ? "Added to plan" : "Add all to plan")
                                        .shotiqBody(14, weight: .semibold)
                                    Image(systemName: addedAll ? "checkmark" : "chevron.right")
                                        .font(.system(size: 11, weight: .semibold))
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 14).padding(.vertical, 11)
                                .background(addedAll ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue,
                                            in: RoundedRectangle(cornerRadius: 8))
                            }
                            .buttonStyle(.plain)
                            .disabled(addingAll || addedAll)
                        }
                        .padding(14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 14)
                        if let addAllError {
                            Text(addAllError).shotiqBody(12).foregroundStyle(ShotIQColor.reviewRed)
                                .padding(.top, 6)
                        }
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .navigationDestination(item: $selectedFlaw) { flaw in
            FlawDetailView(title: flaw.title, severity: flaw.severity)
        }
    }
    /// "Training plan" maps to the web app's saved workouts (POST /api/saved-workouts).
    private func addAllToPlan() {
        guard !addingAll, !addedAll else { return }
        addingAll = true
        addAllError = nil
        Task {
            struct Body: Encodable { let name: String; let drillCount: Int; let drillIds: [String] }
            struct Resp: Decodable { let success: Bool }
            do {
                let _: Resp = try await APIClient.shared.call(
                    "/api/saved-workouts", method: "POST",
                    body: Body(name: "Flaw correction plan", drillCount: flaws.count,
                               drillIds: flaws.map { $0.1.lowercased().replacingOccurrences(of: " ", with: "-") }))
                addedAll = true
            } catch {
                addAllError = "Couldn't add flaws to your plan. Check your connection and try again."
            }
            addingAll = false
        }
    }
    private func flawCard(_ rank: Int, _ title: String, _ impact: String, _ desc: String,
                          _ confidence: String, _ cta: String, _ tint: Color) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 10) {
                        RoundedRectangle(cornerRadius: 5).fill(tint).frame(width: 26, height: 26)
                            .overlay(Text("\(rank)").shotiqBody(14, weight: .bold).foregroundStyle(.white))
                        Text(title).shotiqDisplay(21)
                        Text(impact).shotiqBody(9, weight: .bold).kerning(0.3)
                            .foregroundStyle(tint)
                            .padding(.horizontal, 7).padding(.vertical, 4)
                            .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                            .lineLimit(1).minimumScaleFactor(0.6)
                    }
                    Text(desc).shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(.leading)
                        .padding(.top, 8)
                    Text("AFFECTED PHASES").shotiqBody(9, weight: .semibold).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 12)
                    PhaseStrip(active: title == "LOW FOLLOW-THROUGH" ? "FOLLOW-THROUGH" : "RELEASE")
                        .scaleEffect(0.82, anchor: .leading)
                        .frame(height: 52)
                        .padding(.top, 4)
                    Text("TREND (LAST 6 SESSIONS)").shotiqBody(9, weight: .semibold).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 8)
                    TrendLine(points: [52, 74, 78, 50, 64, 48, 60], stroke: tint,
                              areaFill: true, gridlines: true, endBadge: "60")
                        .frame(height: 40).padding(.top, 4)
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("CONFIDENCE").shotiqBody(9, weight: .semibold).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite)
                    HStack(spacing: 8) {
                        Text(confidence).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                        TrendLine(points: [40, 55, 48, 62, 58, 74], stroke: tint).frame(width: 54, height: 20)
                    }
                    // Only the second flaw card has a canonical crop; the others keep
                    // the dark surface so the row stays consistent.
                    if rank == 2 {
                        CanonicalPhoto("046-visual-001", width: 120, height: 108, cornerRadius: 4)
                    } else {
                        ZStack {
                            RoundedRectangle(cornerRadius: 4).fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                            SkeletonOverlay()
                        }
                        .frame(width: 120, height: 108)
                    }
                    HStack(spacing: 5) {
                        Text(cta).shotiqBody(12, weight: .semibold)
                            .lineLimit(1).minimumScaleFactor(0.7)
                        Image(systemName: "chevron.right").font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundStyle(rank == 1 ? .white : ShotIQColor.ink)
                    .frame(width: 120, height: 40)
                    .background(rank == 1 ? ShotIQColor.shotiqOrange : .clear,
                                in: RoundedRectangle(cornerRadius: 6))
                    .overlay(RoundedRectangle(cornerRadius: 6)
                        .stroke(rank == 1 ? .clear : ShotIQColor.rule))
                }
            }
            .padding(14)
        }
    }
}

struct FlawDetailView: View {       // 047
    var title = "Elbow flare at release"; var severity = "HIGH IMPACT"
    @Environment(\.dismiss) private var dismiss
    @State private var addingGoal = false
    @State private var addedGoal = false
    @State private var goalError: String?
    /// Single item-based route: two `navigationDestination(isPresented:)`
    /// modifiers on one view conflict and only the last one presents.
    enum FlawRoute: Hashable { case frames, drill }
    @State private var route: FlawRoute?
    private let frames = ["LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH", "RESET"]
    /// Canonical evidence-frame crops, matched to their column on the 853x1844
    /// render. FOLLOW-THROUGH has no crop, so that cell keeps the dark surface.
    private static func evidenceFrameKey(_ frame: String) -> String? {
        switch frame {
        case "LOAD": return "047-visual-004"
        case "RISE": return "047-visual-001"
        case "RELEASE": return "047-visual-002"
        case "RESET": return "047-visual-003"
        default: return nil
        }
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-flaw-detail") {
            VStack(spacing: 0) {
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "arrow.left").font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                    Wordmark(size: 30)
                    Spacer()
                    ShareLink(item: "Working on my shot: fixing \(title.lowercased()) with ShotIQ AI analysis. 🏀") {
                        Image(systemName: "square.and.arrow.up").font(.system(size: 18)).foregroundStyle(ShotIQColor.ink)
                    }
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("FLAW DETAIL").shotiqBody(12, weight: .semibold).kerning(0.8)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(title.uppercased()).shotiqDisplay(30)
                                    Text("Your elbow drifts outward in the release phase, creating side spin and inconsistency.")
                                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .padding(.top, 2)
                                }
                                Spacer(minLength: 12)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("FORM SCORE").shotiqBody(10, weight: .semibold).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("82").font(.custom("Tungsten-Medium", size: 40))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: 0.82).frame(width: 76)
                                }
                            }
                            .padding(.top, 14)
                            HStack(spacing: 0) {
                                metaItem("clock", "Release phase")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 20)
                                metaItem("chart.bar", severity.capitalized)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 20)
                                metaItem("water.waves", "72% confidence")
                            }
                            .padding(.top, 14)
                            SectionLabel(text: "EVIDENCE FRAMES").padding(.top, 20)
                            HStack(spacing: 4) {
                                ForEach(frames, id: \.self) { f in
                                    VStack(spacing: 6) {
                                        Group {
                                            if let key = Self.evidenceFrameKey(f) {
                                                // Canonical evidence frame — pose overlay is in the pixels.
                                                CanonicalPhoto(key, height: 150, cornerRadius: 4)
                                            } else {
                                                ZStack {
                                                    RoundedRectangle(cornerRadius: 4)
                                                        .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                                                    SkeletonOverlay()
                                                }
                                                .frame(height: 150)
                                            }
                                        }
                                        .overlay(RoundedRectangle(cornerRadius: 4)
                                            .stroke(f == "RELEASE" ? ShotIQColor.shotiqOrange : .clear, lineWidth: 2))
                                        Text(f).shotiqBody(8, weight: f == "RELEASE" ? .bold : .regular)
                                            .kerning(0.3)
                                            .foregroundStyle(f == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                            .lineLimit(1).minimumScaleFactor(0.6)
                                        if f == "RELEASE" {
                                            Text("(Flaw)").shotiqBody(9).foregroundStyle(ShotIQColor.reviewRed)
                                        }
                                    }
                                    .frame(maxWidth: .infinity)
                                }
                            }
                            .padding(.top, 8)
                            HStack(alignment: .top, spacing: 18) {
                                VStack(alignment: .leading, spacing: 6) {
                                    SectionLabel(text: "IMPACT")
                                    Text("Elbow flare opens your shooting angle and adds unwanted side spin, which reduces accuracy and increases variability.")
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                HStack(spacing: 14) {
                                    angleFigure("YOUR ANGLE", "25°", ShotIQColor.reviewRed)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 74)
                                    angleFigure("IDEAL RANGE", "15–20°", ShotIQColor.analysisBlue)
                                }
                            }
                            .padding(.top, 22)
                            HStack(alignment: .top, spacing: 18) {
                                VStack(alignment: .leading, spacing: 6) {
                                    SectionLabel(text: "HOW TO FIX")
                                    Text("Keep your elbow stacked under the ball through release. Think \u{201C}elbow in, wrist out.\u{201D}")
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                VStack(alignment: .leading, spacing: 7) {
                                    Text("TARGET POSITION").shotiqBody(11, weight: .bold).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    targetCheck("Elbow under ball")
                                    targetCheck("Forearm vertical")
                                    targetCheck("Wrist behind ball")
                                }
                                .padding(12)
                                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            }
                            .padding(.top, 20)
                            SectionLabel(text: "RECOMMENDED DRILL").padding(.top, 22)
                            NavigationLink { DrillDetailView(name: "Towel Elbow Stack") } label: {
                                HStack(alignment: .top, spacing: 14) {
                                    RoundedRectangle(cornerRadius: 6).fill(ShotIQColor.rule)
                                        .frame(width: 92, height: 92)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("Towel Elbow Stack").shotiqBody(16, weight: .semibold)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text("8 min • Shooting Mechanics").shotiqBody(12)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("Use a towel between elbow and hip to build awareness of keeping your elbow stacked through release.")
                                            .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                            .multilineTextAlignment(.leading)
                                            .padding(.top, 4)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .padding(.top, 32)
                                }
                                .padding(12)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            }
                            .padding(.top, 8)
                            HStack(spacing: 12) {
                                SecondaryButton(title: addedGoal ? "Added to goals" : "Add to goals",
                                                icon: addedGoal ? "bookmark.fill" : "bookmark") {
                                    addToGoals()
                                }
                                .disabled(addingGoal || addedGoal)
                                .opacity(addingGoal ? 0.6 : 1)
                                SecondaryButton(title: "View affected frames", icon: "film") {
                                    route = .frames
                                }
                            }
                            .padding(.top, 14)
                            if let goalError {
                                Text(goalError).shotiqBody(12).foregroundStyle(ShotIQColor.reviewRed)
                                    .padding(.top, 6)
                            }
                            PrimaryButton(title: "Start recommended drill", icon: "figure.basketball") {
                                route = .drill
                            }
                            .padding(.top, 10)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .navigationDestination(item: $route) { r in
            switch r {
            case .frames: FrameDetailSkeletonView()
            case .drill: DrillExecutionView(drillName: "Towel Elbow Stack")
            }
        }
    }
    /// Goals live on the web backend — POST /api/goals (name is the only required field).
    private func addToGoals() {
        guard !addingGoal, !addedGoal else { return }
        addingGoal = true
        goalError = nil
        Task {
            struct Body: Encodable {
                let name: String
                let description: String
                let category: String
                let targetValue: Int
                let unit: String
                let xpReward: Int
            }
            struct Resp: Decodable { let success: Bool }
            do {
                let _: Resp = try await APIClient.shared.call(
                    "/api/goals", method: "POST",
                    body: Body(name: "Fix \(title.lowercased())",
                               description: "Correct \(title.lowercased()) identified by shot analysis.",
                               category: "form", targetValue: 100, unit: "%", xpReward: 150))
                addedGoal = true
            } catch {
                goalError = "Couldn't save the goal. Check your connection and try again."
            }
            addingGoal = false
        }
    }
    private func metaItem(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14, weight: .light)).foregroundStyle(ShotIQColor.ink)
            Text(label).shotiqBody(13).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, 4)
    }
    /// Draws the angle it is labelled with, so "YOUR ANGLE 25°" and "IDEAL RANGE
    /// 15–20°" cannot render the same. The shipped screen drew one SF runner for
    /// both, which is what destroyed the comparison.
    private func angleFigure(_ label: String, _ value: String, _ tint: Color) -> some View {
        let degrees = Double(value.prefix { $0.isNumber }) ?? 20
        return VStack(spacing: 5) {
            Text(label).shotiqBody(10, weight: .bold).kerning(0.5).foregroundStyle(tint)
            AngleWedgeGlyph(degrees: degrees, size: 34, accent: tint)
                .foregroundStyle(ShotIQColor.ink)
            Text(value).font(.custom("Tungsten-Medium", size: 17)).foregroundStyle(tint)
        }
    }
    private func targetCheck(_ label: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill").font(.system(size: 14))
                .foregroundStyle(ShotIQColor.analysisBlue)
            Text(label).shotiqBody(13).foregroundStyle(ShotIQColor.ink)
        }
    }
}
