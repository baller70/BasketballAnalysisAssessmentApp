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
    var phase: String? = "RELEASE"
    var showGuidanceLabels = false

    var body: some View {
        ZStack {
            switch AnalysisResultMediaSurfaceResolver.source(for: presentation, fallbackKey: fallbackKey) {
            case .video(let url):
                VideoPoseResultSurface(url: url,
                                       presentation: presentation,
                                       height: height,
                                       showSkeleton: true,
                                       showJoints: true,
                                       showBall: false,
                                       showAngles: showGuidanceLabels,
                                       phase: phase)
            case .image(let url):
                if url.isFileURL {
                    if let image = UIImage(contentsOfFile: url.path) {
                        CapturedPoseImage(image: image,
                                          height: height,
                                          cornerRadius: 8,
                                          showAngles: showGuidanceLabels,
                                          showStatusOverlay: showGuidanceLabels,
                                          initialPose: presentation.detectedPose)
                    } else {
                        mediaFallback("Media unavailable")
                    }
                } else {
                    RemoteCapturedPoseImage(url: url,
                                            height: height,
                                            cornerRadius: 8,
                                            showAngles: showGuidanceLabels,
                                            showStatusOverlay: showGuidanceLabels,
                                            initialPose: presentation.detectedPose,
                                            fallbackKey: fallbackKey)
                }
            case .canonicalFallback(let key):
                CanonicalMediaSurface(key: key, height: height)
            case .placeholder(let label):
                mediaFallback(label)
            }
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .accessibilityLabel(presentation.mediaLabel)
    }

    private func mediaFallback(_ label: String, showsProgress: Bool = false) -> some View {
        CanonicalMediaSurface(key: fallbackKey, height: height)
            .overlay(alignment: .bottomLeading) {
                HStack(spacing: 7) {
                    if showsProgress {
                        ProgressView().controlSize(.small).tint(.white)
                    } else {
                        Image(systemName: "photo").font(.system(size: 11, weight: .semibold))
                    }
                    Text(label).shotiqBody(11, weight: .semibold)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 9).padding(.vertical, 6)
                .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 5))
                .padding(10)
        }
    }
}

fileprivate struct RemoteCapturedPoseImage: View {
    var url: URL
    var height: CGFloat
    var cornerRadius: CGFloat
    var showsPose: Bool = true
    var showBones: Bool = true
    var showJoints: Bool = true
    var showBall: Bool = false
    var showAngles: Bool = false
    var showStatusOverlay: Bool = true
    var initialPose: DetectedPose?
    var fallbackKey: String

    @State private var image: UIImage?
    @State private var failed = false

    var body: some View {
        Group {
            if let image {
                CapturedPoseImage(image: image,
                                  height: height,
                                  cornerRadius: cornerRadius,
                                  showsPose: showsPose,
                                  showBones: showBones,
                                  showJoints: showJoints,
                                  showBall: showBall,
                                  showAngles: showAngles,
                                  showStatusOverlay: showStatusOverlay,
                                  initialPose: initialPose)
            } else {
                CanonicalMediaSurface(key: fallbackKey, height: height)
                    .overlay(alignment: .bottomLeading) {
                        HStack(spacing: 7) {
                            if failed {
                                Image(systemName: "photo")
                                    .font(.system(size: 11, weight: .semibold))
                            } else {
                                ProgressView().controlSize(.small).tint(.white)
                            }
                            Text(failed ? "Media unavailable" : "Loading pose image")
                                .shotiqBody(11, weight: .semibold)
                                .lineLimit(1).minimumScaleFactor(0.7)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 9).padding(.vertical, 6)
                        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 5))
                        .padding(10)
                    }
            }
        }
        .task(id: url) { await loadImage() }
    }

    private func loadImage() async {
        image = nil
        failed = false
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse,
                  (200..<300).contains(http.statusCode),
                  let loaded = UIImage(data: data) else {
                failed = true
                return
            }
            image = loaded
        } catch {
            failed = true
        }
    }
}

fileprivate struct PhaseMediaThumbnail: View {
    var presentation: AnalysisResultPresentation
    var fallbackKey: String
    var height: CGFloat
    var phase: String

    private var phaseSeconds: Double {
        presentation.videoPoseFrame(for: phase)?.timestampSeconds
            ?? presentation.videoPoseFrames.sorted { $0.frameIndex < $1.frameIndex }.first?.timestampSeconds
            ?? 0
    }

    var body: some View {
        ZStack {
            if let url = presentation.videoURL ?? (presentation.mediaLabel.uppercased().contains("VIDEO") ? presentation.mediaURL : nil) {
                ShotIQVideoStillThumbnail(url: url,
                                          seconds: phaseSeconds,
                                          height: height,
                                          cornerRadius: 2)
            } else if let url = presentation.mediaURL {
                if url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().scaledToFill()
                        case .failure:
                            CanonicalPhoto(fallbackKey, height: height, cornerRadius: 2)
                        default:
                            Rectangle()
                                .fill(ShotIQColor.warmCanvas)
                                .overlay { ProgressView().tint(ShotIQColor.shotiqOrange) }
                        }
                    }
                }
            } else {
                CanonicalPhoto(fallbackKey, height: height, cornerRadius: 2)
            }
        }
        .frame(height: height)
        .frame(maxWidth: .infinity)
        .clipped()
        .clipShape(RoundedRectangle(cornerRadius: 2))
        .accessibilityLabel("Clean phase thumbnail for \(phase.lowercased())")
    }
}

struct VideoPoseResultSurface: View {
    var url: URL
    var presentation: AnalysisResultPresentation
    var height: CGFloat
    var showSkeleton: Bool
    var showJoints: Bool
    var showBall: Bool
    var showAngles: Bool
    var phase: String? = "RELEASE"
    var overrideFrame: VideoPoseFrameRecord? = nil
    var showsAdvancedControls = false
    @State private var player: AVPlayer?
    @State private var loadedURL: URL?
    @State private var naturalVideoSize: CGSize?
    @State private var activePoseFrame: VideoPoseFrameRecord?
    @State private var timeObserver: Any?
    @State private var isPlaying = false
    @State private var currentSeconds = 0.0
    @State private var durationSeconds = 0.0
    @State private var playbackRate = 1.0
    @State private var showsControlTray = false

    private var playbackFrames: [VideoPoseFrameRecord] {
        presentation.videoPoseFrames.sorted { $0.timestampSeconds < $1.timestampSeconds }
    }
    private var analyzedStartSeconds: Double {
        playbackFrames.first?.timestampSeconds ?? 0
    }
    private var analyzedEndSeconds: Double {
        playbackFrames.last?.timestampSeconds ?? durationSeconds
    }
    private var hasPlaybackBounds: Bool {
        !playbackFrames.isEmpty && analyzedEndSeconds > analyzedStartSeconds
    }
    private var selectedPoseFrame: VideoPoseFrameRecord? { overrideFrame ?? presentation.videoPoseFrame(for: phase) }
    private var poseFrame: VideoPoseFrameRecord? {
        if isPlaying || showsControlTray { return activePoseFrame ?? selectedPoseFrame }
        return selectedPoseFrame ?? activePoseFrame
    }
    private var displayPhase: String {
        poseFrame?.phaseLabel ?? phase?.uppercased().replacingOccurrences(of: "_", with: "-") ?? "RELEASE"
    }
    private var seekKey: String {
        "\(url.absoluteString)|\(phase ?? "")|\(overrideFrame?.frameIndex ?? -1)|\(selectedPoseFrame?.timestampSeconds ?? -1)"
    }
    private var lockedStillFrame: VideoPoseFrameRecord? {
        guard !isPlaying, !showsControlTray else { return nil }
        return overrideFrame ?? selectedPoseFrame
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                if let lockedStillFrame {
                    ShotIQVideoStillThumbnail(url: url,
                                              seconds: lockedStillFrame.timestampSeconds,
                                              width: proxy.size.width,
                                              height: proxy.size.height,
                                              cornerRadius: 0)
                    .accessibilityLabel("Exact saved analysis frame")
                } else if let player {
                    ShotIQAspectFillVideoPlayer(player: player)
                        .accessibilityLabel("Saved analysis video with pose overlay")
                } else {
                    Rectangle()
                        .fill(Color.black)
                        .overlay {
                            ProgressView()
                                .tint(ShotIQColor.shotiqOrange)
                        }
                        .accessibilityLabel("Loading saved analysis video")
                }

                if let frame = poseFrame, let pose = frame.detectedPose {
                    ShotIQVideoAnalysisOverlay(frame: frame,
                                               pose: pose,
                                               presentation: presentation,
                                               showSkeleton: showSkeleton,
                                               showJoints: showJoints || showAngles,
                                               showBall: showBall,
                                               showAnnotations: showAngles,
                                               displayPhase: displayPhase)
                        .frame(width: proxy.size.width, height: proxy.size.height)
                    if showAngles {
                        videoPosePill(frame)
                    }
                } else if showAngles {
                    videoPosePill(nil)
                }

                if !showsAdvancedControls {
                    playbackControl
                }
                if showsAdvancedControls {
                    advancedPlaybackControls
                }
            }
        }
        .frame(height: height)
        .clipped()
        .accessibilityIdentifier(poseFrame == nil ? "analysis-video-player" : "analysis-video-pose-overlay")
        .task(id: url) {
            await preparePlayer()
        }
        .onChange(of: seekKey) { _ in
            activePoseFrame = selectedPoseFrame
            seekToSelectedFrame()
        }
        .onDisappear {
            player?.pause()
            removeTimeObserver()
            isPlaying = false
        }
    }

    @ViewBuilder
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
                        .frame(width: 50, height: 50)
                        .background(ShotIQColor.shotiqOrange, in: Circle())
                        .shadow(color: .black.opacity(0.45), radius: 8, x: 0, y: 3)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(isPlaying ? "Pause uploaded video" : "Play uploaded video")
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
            if hasPlaybackBounds,
               currentSeconds >= analyzedEndSeconds - 0.035 {
                seek(to: analyzedStartSeconds)
            }
            player.playImmediately(atRate: Float(playbackRate))
        }
        isPlaying.toggle()
    }

    @MainActor
    private func seekToSelectedFrame() {
        guard let seconds = selectedPoseFrame?.timestampSeconds else { return }
        seek(to: seconds)
    }

    @MainActor
    private func seek(to seconds: Double) {
        let lower = hasPlaybackBounds ? analyzedStartSeconds : 0
        let upper = hasPlaybackBounds ? analyzedEndSeconds : max(durationSeconds, seconds)
        let bounded = min(max(seconds, lower), upper)
        currentSeconds = bounded
        let selected = selectedPoseFrame
        if let selected, abs(selected.timestampSeconds - bounded) < 0.035 {
            activePoseFrame = selected
        } else {
            activePoseFrame = nearestPoseFrame(to: bounded) ?? selected
        }
        player?.seek(to: CMTime(seconds: bounded, preferredTimescale: 600),
                     toleranceBefore: .zero,
                     toleranceAfter: .zero)
    }

    private func preparePlayer() async {
        if loadedURL != url {
            let next = AVPlayer(url: url)
            next.actionAtItemEnd = .pause
            await MainActor.run {
                removeTimeObserver()
                player = next
                loadedURL = url
                activePoseFrame = selectedPoseFrame
                isPlaying = false
                installTimeObserver(on: next)
            }
        }
        let size = await loadNaturalVideoSize()
        let duration = await loadDuration()
        await MainActor.run {
            naturalVideoSize = size
            durationSeconds = duration
            seekToSelectedFrame()
        }
    }

    @MainActor
    private func installTimeObserver(on player: AVPlayer) {
        let interval = CMTime(seconds: 1.0 / 30.0, preferredTimescale: 600)
        timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { time in
            let seconds = time.seconds
            guard seconds.isFinite else { return }
            if hasPlaybackBounds, seconds >= analyzedEndSeconds {
                currentSeconds = analyzedEndSeconds
                activePoseFrame = playbackFrames.last ?? selectedPoseFrame
                player.pause()
                isPlaying = false
                player.seek(to: CMTime(seconds: analyzedEndSeconds, preferredTimescale: 600),
                            toleranceBefore: .zero,
                            toleranceAfter: .zero)
                return
            }
            currentSeconds = seconds
            if isPlaying || showsControlTray {
                activePoseFrame = nearestPoseFrame(to: seconds) ?? selectedPoseFrame
            }
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
        guard !playbackFrames.isEmpty else { return selectedPoseFrame }
        return playbackFrames.min {
            abs($0.timestampSeconds - seconds) < abs($1.timestampSeconds - seconds)
        }
    }

    private func previousFrame() -> VideoPoseFrameRecord? {
        guard !playbackFrames.isEmpty else { return nil }
        let current = poseFrame?.timestampSeconds ?? currentSeconds
        return playbackFrames.last { $0.timestampSeconds < current - 0.01 } ?? playbackFrames.first
    }

    private func nextFrame() -> VideoPoseFrameRecord? {
        guard !playbackFrames.isEmpty else { return nil }
        let current = poseFrame?.timestampSeconds ?? currentSeconds
        return playbackFrames.first { $0.timestampSeconds > current + 0.01 } ?? playbackFrames.last
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

    private func loadDuration() async -> Double {
        let asset = AVURLAsset(url: url)
        guard let loadedDuration = try? await asset.load(.duration) else {
            return playbackFrames.last?.timestampSeconds ?? 0
        }
        let duration = loadedDuration.seconds
        guard duration.isFinite,
              duration > 0 else {
            return playbackFrames.last?.timestampSeconds ?? 0
        }
        return duration
    }

    private func fittedOverlaySize(for frame: VideoPoseFrameRecord, container: CGSize) -> CGSize {
        let frameSize: CGSize? = {
            guard let width = frame.sourceWidth,
                  let height = frame.sourceHeight,
                  width > 0,
                  height > 0 else { return nil }
            return CGSize(width: CGFloat(width), height: CGFloat(height))
        }()
        guard let sourceSize = frameSize ?? naturalVideoSize else {
            return container
        }
        return ShotIQPose.filledSize(image: sourceSize, in: container)
    }

    private func videoPosePill(_ frame: VideoPoseFrameRecord?) -> some View {
        HStack(spacing: 6) {
            Image(systemName: frame == nil ? "video" : "point.3.connected.trianglepath.dotted")
                .font(.system(size: 11, weight: .semibold))
            Text(frame.map { "\(displayPhase) • FRAME \($0.frameIndex + 1) • \(Int(($0.confidence * 100).rounded()))% POSE" }
                 ?? "VIDEO • POSE NOT DETECTED")
                .shotiqBody(11, weight: .bold)
                .kerning(0.4)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 9)
        .padding(.vertical, 7)
        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 6))
        .padding(10)
    }

    private var advancedPlaybackControls: some View {
        VStack {
            Spacer()
            VStack(spacing: 8) {
                if showsControlTray {
                    VStack(spacing: 8) {
                        Slider(value: Binding(
                            get: { currentSeconds },
                            set: { seek(to: $0) }),
                               in: 0...max(durationSeconds, playbackFrames.last?.timestampSeconds ?? 1))
                            .tint(ShotIQColor.shotiqOrange)
                        HStack(spacing: 8) {
                            transportButton("backward.frame.fill", "Previous frame") {
                                if let frame = previousFrame() { seek(to: frame.timestampSeconds) }
                            }
                            transportButton("gobackward.5", "Back five seconds") {
                                seek(to: currentSeconds - 5)
                            }
                            transportButton("goforward.5", "Forward five seconds") {
                                seek(to: currentSeconds + 5)
                            }
                            transportButton("forward.frame.fill", "Next frame") {
                                if let frame = nextFrame() { seek(to: frame.timestampSeconds) }
                            }
                            Button {
                                cycleRate()
                            } label: {
                                Text(rateLabel)
                                    .shotiqBody(11, weight: .bold)
                                    .foregroundStyle(.white)
                                    .frame(width: 48, height: 34)
                                    .background(.white.opacity(0.16), in: RoundedRectangle(cornerRadius: 7))
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Change playback speed")
                            Button {
                                withAnimation(.easeInOut(duration: 0.18)) {
                                    showsControlTray = false
                                }
                            } label: {
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundStyle(.white)
                                    .frame(width: 34, height: 34)
                                    .background(.white.opacity(0.16), in: RoundedRectangle(cornerRadius: 7))
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Hide video controls")
                        }
                    }
                    .padding(10)
                    .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 10))
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                HStack(spacing: 10) {
                    Button {
                        togglePlayback()
                    } label: {
                        Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 46, height: 46)
                            .background(ShotIQColor.shotiqOrange, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(isPlaying ? "Pause full-screen video" : "Play full-screen video")
                    Button {
                        withAnimation(.easeInOut(duration: 0.18)) {
                            showsControlTray.toggle()
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "slider.horizontal.3")
                                .font(.system(size: 13, weight: .bold))
                            Text("Controls")
                                .shotiqBody(11, weight: .bold)
                        }
                        .foregroundStyle(.white)
                        .frame(height: 36)
                        .padding(.horizontal, 12)
                        .background(.black.opacity(0.64), in: Capsule())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(showsControlTray ? "Hide video controls" : "Show video controls")
                    Spacer()
                }
                .padding(.horizontal, 12)
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 10)
        }
    }

    private var rateLabel: String {
        playbackRate == 0.5 ? "0.5x" : playbackRate == 0.25 ? "0.25x" : "1x"
    }

    @MainActor
    private func cycleRate() {
        if playbackRate == 1.0 {
            playbackRate = 0.5
        } else if playbackRate == 0.5 {
            playbackRate = 0.25
        } else {
            playbackRate = 1.0
        }
        if isPlaying {
            player?.rate = Float(playbackRate)
        }
    }

    private func transportButton(_ icon: String, _ label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 38, height: 38)
                .background(.white.opacity(0.16), in: RoundedRectangle(cornerRadius: 7))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}

struct ShotIQVideoAnalysisOverlay: View {
    var frame: VideoPoseFrameRecord
    var pose: DetectedPose
    var presentation: AnalysisResultPresentation
    var showSkeleton: Bool
    var showJoints: Bool
    var showBall: Bool
    var showAnnotations: Bool
    var displayPhase: String

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                VideoGamePoseOverlay(frame: frame,
                                     pose: pose,
                                     showBones: showSkeleton,
                                     showJoints: showJoints,
                                     showBall: showBall)
                    .opacity(0.96)
                    .accessibilityHidden(true)

                if showAnnotations {
                    annotationLayer(size: proxy.size)
                }

                if showAnnotations {
                    analysisBrand
                        .frame(maxWidth: .infinity, alignment: .topTrailing)
                        .padding(10)
                } else {
                    compactBrand
                        .frame(maxWidth: .infinity, alignment: .topTrailing)
                        .padding(9)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("ShotIQ AI analysis overlay showing skeleton, joint points, and angle guidance")
    }

    private var analysisBrand: some View {
        VStack(alignment: .trailing, spacing: 7) {
            HStack(spacing: 9) {
                RoundedRectangle(cornerRadius: 9)
                    .stroke(.white, lineWidth: 2)
                    .frame(width: 44, height: 44)
                    .overlay(
                        Image(systemName: "basketball.fill")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(.white)
                    )
                VStack(alignment: .trailing, spacing: 0) {
                    Text("SHOTIQ")
                        .font(.system(size: 25, weight: .black))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Text("AI ANALYSIS")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(.white)
                        .kerning(1.6)
                        .lineLimit(1)
                }
            }

            HStack(spacing: 6) {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 11, weight: .bold))
                Text("AI Processing")
                    .font(.system(size: 12, weight: .bold))
                    .lineLimit(1)
            }
            .foregroundStyle(ShotIQColor.shotiqOrange)
            .padding(.horizontal, 10)
            .frame(height: 30)
            .background(.black.opacity(0.76), in: RoundedRectangle(cornerRadius: 7))
        }
    }

    private var compactBrand: some View {
        HStack(spacing: 7) {
            RoundedRectangle(cornerRadius: 7)
                .stroke(.white, lineWidth: 1.6)
                .frame(width: 34, height: 34)
                .overlay(
                    Image(systemName: "basketball.fill")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                )
            VStack(alignment: .trailing, spacing: 0) {
                Text("SHOTIQ")
                    .font(.system(size: 19, weight: .black))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                Text("AI ANALYSIS")
                    .font(.system(size: 8, weight: .heavy))
                    .foregroundStyle(.white)
                    .kerning(1.1)
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 7)
        .background(.black.opacity(0.34), in: RoundedRectangle(cornerRadius: 8))
    }

    private func annotationLayer(size: CGSize) -> some View {
        ZStack {
            ForEach(Array(annotationSpecs(size: size).enumerated()), id: \.offset) { _, spec in
                if let anchor = point(for: spec.primaryJoint) ?? point(for: spec.fallbackJoint) {
                    let anchorPoint = displayPoint(for: anchor, size: size)
                    let labelCenter = labelCenter(for: anchor, spec: spec, size: size)
                    let width = calloutWidth(size)
                    connector(from: anchorPoint,
                              to: CGPoint(x: labelCenter.x + (spec.side == .left ? width / 2 : -width / 2),
                                          y: labelCenter.y),
                              tint: spec.tint)
                    analysisCallout(title: spec.title,
                                    value: spec.value,
                                    status: spec.status,
                                    tint: spec.tint)
                        .frame(width: width, height: calloutHeight(size))
                        .position(labelCenter)
                }
            }
        }
        .allowsHitTesting(false)
    }

    private func connector(from: CGPoint, to: CGPoint, tint: Color) -> some View {
        Path { path in
            path.move(to: from)
            path.addLine(to: to)
        }
        .stroke(tint.opacity(0.88), style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
        .shadow(color: tint.opacity(0.8), radius: 4)
    }

    private func analysisCallout(title: String, value: String, status: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.system(size: 14, weight: .black))
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
            Text(value)
                .font(.system(size: 25, weight: .black))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Text(status)
                .font(.system(size: 9, weight: .heavy))
                .foregroundStyle(Color(red: 0.44, green: 1.0, blue: 0.72))
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(.black.opacity(0.84), in: RoundedRectangle(cornerRadius: 7))
        .overlay(RoundedRectangle(cornerRadius: 7).stroke(tint, lineWidth: 2.5))
        .shadow(color: .black.opacity(0.45), radius: 8, x: 0, y: 3)
    }

    private func annotationSpecs(size: CGSize) -> [VideoPoseAnnotationSpec] {
        [
            VideoPoseAnnotationSpec(title: "SHOULDER",
                                    value: angleText(frame.shoulderAngle, fallback: 73),
                                    status: formStatus(frame.shoulderAngle, ideal: 55...95),
                                    tint: Color(red: 1.0, green: 0.88, blue: 0.0),
                                    primaryJoint: .rightShoulder,
                                    fallbackJoint: .leftShoulder,
                                    side: .left,
                                    verticalOffset: -0.10),
            VideoPoseAnnotationSpec(title: "ELBOW ANGLE",
                                    value: angleText(frame.elbowAngle, fallback: 165),
                                    status: formStatus(frame.elbowAngle, ideal: 150...180),
                                    tint: Color(red: 0.16, green: 0.95, blue: 0.48),
                                    primaryJoint: .rightElbow,
                                    fallbackJoint: .leftElbow,
                                    side: .right,
                                    verticalOffset: 0.02),
            VideoPoseAnnotationSpec(title: "HIP ALIGN",
                                    value: angleText(frame.hipAngle, fallback: 73),
                                    status: formStatus(frame.hipAngle, ideal: 55...95),
                                    tint: ShotIQColor.shotiqOrange,
                                    primaryJoint: .rightHip,
                                    fallbackJoint: .leftHip,
                                    side: .right,
                                    verticalOffset: 0.13),
        ]
    }

    private func point(for joint: DetectedPose.Joint?) -> CGPoint? {
        guard let joint, let p = pose.joints[joint] else { return nil }
        return p
    }

    private func labelCenter(for anchor: CGPoint, spec: VideoPoseAnnotationSpec, size: CGSize) -> CGPoint {
        let anchorPoint = displayPoint(for: anchor, size: size)
        let width = calloutWidth(size)
        let height = calloutHeight(size)
        let sideOffset = max(width * 1.05, size.width * 0.28)
        let rawX = spec.side == .left ? anchorPoint.x - sideOffset : anchorPoint.x + sideOffset
        let rawY = anchorPoint.y + size.height * spec.verticalOffset
        return CGPoint(x: min(max(rawX, width / 2 + 10), size.width - width / 2 - 10),
                       y: min(max(rawY, height / 2 + 10), size.height - height / 2 - 10))
    }

    private func calloutWidth(_ size: CGSize) -> CGFloat {
        min(max(size.width * 0.26, 116), min(190, size.width - 20))
    }

    private func calloutHeight(_ size: CGSize) -> CGFloat {
        size.width < 430 ? 64 : 74
    }

    private var sourceSize: CGSize? {
        guard let width = frame.sourceWidth,
              let height = frame.sourceHeight,
              width > 0,
              height > 0 else {
            return nil
        }
        return CGSize(width: CGFloat(width), height: CGFloat(height))
    }

    private func displayPoint(for point: CGPoint, size: CGSize) -> CGPoint {
        guard let source = sourceSize else {
            return CGPoint(x: point.x * size.width, y: point.y * size.height)
        }
        let scale = max(size.width / source.width, size.height / source.height)
        let offsetX = (size.width - source.width * scale) / 2
        let offsetY = (size.height - source.height * scale) / 2
        return CGPoint(x: point.x * source.width * scale + offsetX,
                       y: point.y * source.height * scale + offsetY)
    }

    private func angleText(_ value: Double?, fallback: Int, signed: Bool = false) -> String {
        guard let value else { return "\(fallback)°" }
        let rounded = Int(value.rounded())
        if signed && rounded > 0 { return "+\(rounded)°" }
        return "\(rounded)°"
    }

    private func formStatus(_ value: Double?, ideal: ClosedRange<Double>) -> String {
        guard let value else { return "TRACKING" }
        return ideal.contains(value) ? "GOOD FORM" : "ADJUST FORM"
    }
}

fileprivate struct VideoPoseAnnotationSpec {
    enum Side { case left, right }

    var title: String
    var value: String
    var status: String
    var tint: Color
    var primaryJoint: DetectedPose.Joint
    var fallbackJoint: DetectedPose.Joint
    var side: Side
    var verticalOffset: CGFloat
}

fileprivate struct VideoGamePoseOverlay: View {
    var frame: VideoPoseFrameRecord
    var pose: DetectedPose
    var showBones: Bool
    var showJoints: Bool
    var showBall: Bool

    private enum Status {
        case good
        case warning
        case problem

        var main: Color {
            switch self {
            case .good: return Color(red: 0.13, green: 0.77, blue: 0.37)
            case .warning: return Color(red: 0.92, green: 0.70, blue: 0.03)
            case .problem: return Color(red: 0.94, green: 0.27, blue: 0.27)
            }
        }

        var glow: Color { main.opacity(0.36) }
    }

    var body: some View {
        Canvas { ctx, size in
            func pt(_ p: CGPoint) -> CGPoint {
                displayPoint(for: p, size: size)
            }

            if showBones {
                for pair in ShotIQPose.bones {
                    guard let a = pose.joints[pair.0], let b = pose.joints[pair.1] else { continue }
                    let status = segmentStatus(pair)
                    let start = pt(a)
                    let end = pt(b)
                    var path = Path()
                    path.move(to: start)
                    path.addLine(to: end)
                    ctx.stroke(path,
                               with: .color(status.glow),
                               style: StrokeStyle(lineWidth: 9, lineCap: .round, lineJoin: .round))
                    ctx.stroke(path,
                               with: .color(status.glow.opacity(0.78)),
                               style: StrokeStyle(lineWidth: 5.5, lineCap: .round, lineJoin: .round))
                    ctx.stroke(path,
                               with: .color(status.main),
                               style: StrokeStyle(lineWidth: 3.4, lineCap: .round, lineJoin: .round))
                    ctx.stroke(path,
                               with: .color(.white.opacity(0.92)),
                               style: StrokeStyle(lineWidth: 1.4, lineCap: .round, lineJoin: .round))
                }
            }

            if showJoints {
                for (joint, point) in pose.joints {
                    guard isMainJoint(joint) else { continue }
                    drawJoint(context: &ctx,
                              center: pt(point),
                              status: jointStatus(joint),
                              isMain: isMainJoint(joint))
                }
            }

            if showBall, let wrist = shootingWrist {
                drawBall(context: &ctx, center: pt(wrist))
            }
        }
    }

    private var sourceSize: CGSize? {
        guard let width = frame.sourceWidth,
              let height = frame.sourceHeight,
              width > 0,
              height > 0 else {
            return nil
        }
        return CGSize(width: CGFloat(width), height: CGFloat(height))
    }

    private func displayPoint(for point: CGPoint, size: CGSize) -> CGPoint {
        guard let source = sourceSize else {
            return CGPoint(x: point.x * size.width, y: point.y * size.height)
        }
        let scale = max(size.width / source.width, size.height / source.height)
        let offsetX = (size.width - source.width * scale) / 2
        let offsetY = (size.height - source.height * scale) / 2
        return CGPoint(x: point.x * source.width * scale + offsetX,
                       y: point.y * source.height * scale + offsetY)
    }

    private var shootingWrist: CGPoint? {
        let left = pose.joints[.leftWrist]
        let right = pose.joints[.rightWrist]
        switch (left, right) {
        case let (l?, r?): return r.y <= l.y ? r : l
        case let (nil, r?): return r
        case let (l?, nil): return l
        default: return nil
        }
    }

    private func drawJoint(context ctx: inout GraphicsContext,
                           center: CGPoint,
                           status: Status,
                           isMain: Bool) {
        let radius: CGFloat = isMain ? 7.5 : 5.5
        let glowRect = CGRect(x: center.x - radius - 6,
                              y: center.y - radius - 6,
                              width: (radius + 6) * 2,
                              height: (radius + 6) * 2)
        ctx.fill(Path(ellipseIn: glowRect), with: .color(status.glow.opacity(0.58)))
        ctx.stroke(Path(ellipseIn: CGRect(x: center.x - radius - 3,
                                          y: center.y - radius - 3,
                                          width: (radius + 3) * 2,
                                          height: (radius + 3) * 2)),
                   with: .color(status.main),
                   lineWidth: 2)
        ctx.fill(Path(ellipseIn: CGRect(x: center.x - radius,
                                        y: center.y - radius,
                                        width: radius * 2,
                                        height: radius * 2)),
                 with: .color(status.main))
        ctx.stroke(Path(ellipseIn: CGRect(x: center.x - radius + 2,
                                          y: center.y - radius + 2,
                                          width: (radius - 2) * 2,
                                          height: (radius - 2) * 2)),
                   with: .color(.black.opacity(0.35)),
                   lineWidth: 1.3)
        ctx.fill(Path(ellipseIn: CGRect(x: center.x - radius + 4,
                                        y: center.y - radius + 4,
                                        width: (radius - 4) * 2,
                                        height: (radius - 4) * 2)),
                 with: .color(.white))
    }

    private func drawBall(context ctx: inout GraphicsContext, center: CGPoint) {
        let radius: CGFloat = 12
        ctx.stroke(Path(ellipseIn: CGRect(x: center.x - radius - 8,
                                          y: center.y - radius - 8,
                                          width: (radius + 8) * 2,
                                          height: (radius + 8) * 2)),
                   with: .color(ShotIQColor.shotiqOrange.opacity(0.28)),
                   lineWidth: 10)
        ctx.stroke(Path(ellipseIn: CGRect(x: center.x - radius,
                                          y: center.y - radius,
                                          width: radius * 2,
                                          height: radius * 2)),
                   with: .color(ShotIQColor.shotiqOrange),
                   lineWidth: 4)
        ctx.fill(Path(ellipseIn: CGRect(x: center.x - 4,
                                        y: center.y - 4,
                                        width: 8,
                                        height: 8)),
                 with: .color(ShotIQColor.shotiqOrange))
    }

    private func segmentStatus(_ pair: (DetectedPose.Joint, DetectedPose.Joint)) -> Status {
        if isArmJoint(pair.0) || isArmJoint(pair.1) {
            return status(value: frame.elbowAngle, ideal: 150...180, warning: 130...190)
        }
        if isLowerBodyJoint(pair.0) || isLowerBodyJoint(pair.1) {
            return status(value: frame.kneeAngle, ideal: 70...120, warning: 55...145)
        }
        return .good
    }

    private func jointStatus(_ joint: DetectedPose.Joint) -> Status {
        if isArmJoint(joint) {
            return status(value: frame.elbowAngle, ideal: 150...180, warning: 130...190)
        }
        if isLowerBodyJoint(joint) {
            return status(value: frame.kneeAngle, ideal: 70...120, warning: 55...145)
        }
        return .good
    }

    private func status(value: Double?, ideal: ClosedRange<Double>, warning: ClosedRange<Double>) -> Status {
        guard let value else { return .good }
        if ideal.contains(value) { return .good }
        if warning.contains(value) { return .warning }
        return .problem
    }

    private func isArmJoint(_ joint: DetectedPose.Joint) -> Bool {
        joint == .leftShoulder || joint == .rightShoulder
            || joint == .leftElbow || joint == .rightElbow
            || joint == .leftWrist || joint == .rightWrist
    }

    private func isLowerBodyJoint(_ joint: DetectedPose.Joint) -> Bool {
        joint == .leftHip || joint == .rightHip
            || joint == .leftKnee || joint == .rightKnee
            || joint == .leftAnkle || joint == .rightAnkle
    }

    private func isMainJoint(_ joint: DetectedPose.Joint) -> Bool {
        isArmJoint(joint)
            || isLowerBodyJoint(joint)
            || joint == .neck
            || joint == .nose
            || joint == .leftEye
            || joint == .rightEye
            || joint == .leftEar
            || joint == .rightEar
    }
}

fileprivate struct VideoFramePlaybackPanel: View {
    var presentation: AnalysisResultPresentation
    @State private var frameIndex = 0
    @State private var playing = false
    @State private var showSkeleton = true
    @State private var showJoints = true
    @State private var showAnnotations = true
    @State private var showBall = false
    @State private var showFullFrame = false
    @State private var toast: ShotIQToast?

    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    private var frames: [VideoPoseFrameRecord] {
        presentation.videoPoseFrames.sorted { $0.frameIndex < $1.frameIndex }
    }
    private var selectedFrame: VideoPoseFrameRecord? {
        guard !frames.isEmpty else { return nil }
        return frames[min(max(frameIndex, 0), frames.count - 1)]
    }
    private var selectedPhase: String {
        selectedFrame?.phaseLabel ?? presentation.phaseText.uppercased()
    }
    private var frameText: String {
        guard !frames.isEmpty else { return "Frame --" }
        return "Frame \(frameIndex + 1) / \(frames.count)"
    }
    private var timeText: String {
        guard let selectedFrame else { return "--" }
        return String(format: "%.1fs", selectedFrame.timestampSeconds)
    }
    private var videoURL: URL? {
        presentation.videoURL ?? presentation.mediaURL
    }

    var body: some View {
        ShotIQCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .center, spacing: 10) {
                    Image(systemName: "film.stack")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("VIDEO FRAME-BY-FRAME PLAYBACK")
                            .shotiqCondensed(20, weight: .heavy)
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Text("Scrub through your shooting motion to analyze each phase.")
                            .shotiqBody(12)
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    Spacer()
                    NavigationLink { VideoUploadView() } label: {
                        Text("New Video").shotiqBody(11, weight: .bold)
                            .padding(.horizontal, 10)
                            .frame(height: 30)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white)
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Starting new video", "Opening video upload.")
                    })
                    .buttonStyle(.plain)
                }

                Button {
                    showFullFrame = true
                    toast = .info("Opening full frame", selectedPhase.capitalized)
                } label: {
                    ZStack(alignment: .topTrailing) {
                        if let url = videoURL {
                            VideoPoseResultSurface(url: url,
                                                   presentation: presentation,
                                                   height: 240,
                                                   showSkeleton: showSkeleton,
                                                   showJoints: showJoints,
                                                   showBall: showBall,
                                                   showAngles: false,
                                                   phase: selectedPhase,
                                                   overrideFrame: selectedFrame)
                        } else {
                            AnalysisResultMediaSurface(presentation: presentation,
                                                       fallbackKey: "042-visual-002",
                                                       height: 240,
                                                       phase: selectedPhase)
                        }
                        mediaExpandPill
                    }
                }
                .buttonStyle(.plain)

                phaseThumbnailStrip

                Slider(value: Binding(
                    get: { Double(frameIndex) },
                    set: { frameIndex = Int($0.rounded()) }),
                       in: 0...Double(max(frames.count - 1, 1)),
                       step: 1)
                .disabled(frames.isEmpty)

                HStack(spacing: 10) {
                    playbackButton("backward.end.fill", "Go to start") {
                        frameIndex = 0
                        playing = false
                        toast = .success("Start selected", frameText)
                    }
                    playbackButton("backward.frame.fill", "Previous frame") {
                        frameIndex = max(0, frameIndex - 1)
                        playing = false
                        toast = .success("Previous frame", frameText)
                    }
                    Button {
                        playing.toggle()
                        toast = .info(playing ? "Playing sequence" : "Video paused", frameText)
                    } label: {
                        Image(systemName: playing ? "pause.fill" : "play.fill")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.black)
                            .frame(width: 44, height: 44)
                            .background(ShotIQColor.shotiqOrange, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(playing ? "Pause video" : "Play video")
                    playbackButton("forward.frame.fill", "Next frame") {
                        frameIndex = min(max(frames.count - 1, 0), frameIndex + 1)
                        playing = false
                        toast = .success("Next frame", frameText)
                    }
                    playbackButton("forward.end.fill", "Go to end") {
                        frameIndex = max(frames.count - 1, 0)
                        playing = false
                        toast = .success("End selected", frameText)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(frameText).font(.custom("Tungsten-Medium", size: 24))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .lineLimit(1).minimumScaleFactor(0.7)
                        Text(timeText).shotiqBody(11, weight: .semibold)
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 12)
                    .frame(height: 48)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                }

                VStack(alignment: .leading, spacing: 8) {
                    SectionLabel(text: "JUMP TO PHASE")
                    FlexiblePhaseButtons(phases: phases, active: selectedPhase) { phase in
                        jump(to: phase)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    SectionLabel(text: "FORM ANALYSIS BREAKDOWN")
                    ForEach(Array(presentation.flaws.prefix(4)).indices, id: \.self) { idx in
                        let item = presentation.flaws[idx]
                        HStack(spacing: 10) {
                            Circle()
                                .fill(idx == 0 ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen)
                                .frame(width: 8, height: 8)
                            Text("#\(idx + 1)").shotiqBody(11, weight: .bold).foregroundStyle(ShotIQColor.graphite)
                            Text(item.title).shotiqBody(13, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                .lineLimit(1).minimumScaleFactor(0.65)
                            Spacer()
                            Text(idx == 0 ? "FIX THIS" : "GOOD")
                                .shotiqBody(9, weight: .bold)
                                .foregroundStyle(idx == 0 ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen)
                                .padding(.horizontal, 7).frame(height: 20)
                                .background((idx == 0 ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen).opacity(0.12),
                                            in: RoundedRectangle(cornerRadius: 4))
                        }
                        .padding(.horizontal, 10)
                        .frame(height: 40)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                    }
                }

                HStack(spacing: 8) {
                    overlayButton("point.3.connected.trianglepath.dotted", "Skeleton Lines", showSkeleton) {
                        showSkeleton.toggle()
                        toast = .success(showSkeleton ? "Skeleton lines on" : "Skeleton lines off")
                    }
                    overlayButton("circle.grid.cross", "Joint Points", showJoints) {
                        showJoints.toggle()
                        toast = .success(showJoints ? "Joint points on" : "Joint points off")
                    }
                    overlayButton("square.and.pencil", "Annotations", showAnnotations) {
                        showAnnotations.toggle()
                        toast = .success(showAnnotations ? "Annotations on" : "Annotations off")
                    }
                    overlayButton("basketball", "Basketball", showBall) {
                        showBall.toggle()
                        toast = .success(showBall ? "Basketball marker on" : "Basketball marker off")
                    }
                }
            }
            .padding(14)
        }
        .shotiqToast($toast)
        .fullScreenCover(isPresented: $showFullFrame) {
            AnalysisFullScreenMediaView(presentation: presentation,
                                        fallbackKey: "042-visual-002",
                                        selectedPhase: Binding(
                                            get: { selectedPhase },
                                            set: { phase in jump(to: phase) }),
                                        overrideFrame: selectedFrame)
        }
        .onReceive(Timer.publish(every: 0.12, on: .main, in: .common).autoconnect()) { _ in
            guard playing, frames.count > 1 else { return }
            if frameIndex >= frames.count - 1 {
                frameIndex = frames.count - 1
                playing = false
            } else {
                frameIndex += 1
            }
        }
    }

    private func jump(to phase: String) {
        if let idx = frames.firstIndex(where: { $0.phaseLabel.uppercased() == phase }) {
            frameIndex = idx
        } else {
            switch phase {
            case "SETUP": frameIndex = 0
            case "LOAD": frameIndex = Int(Double(max(frames.count - 1, 0)) * 0.2)
            case "RISE": frameIndex = Int(Double(max(frames.count - 1, 0)) * 0.45)
            case "RELEASE": frameIndex = Int(Double(max(frames.count - 1, 0)) * 0.68)
            default: frameIndex = max(frames.count - 1, 0)
            }
        }
        playing = false
        toast = .success("\(phase.capitalized) selected", frameText)
    }

    private var phaseThumbnailStrip: some View {
        HStack(spacing: 7) {
            ForEach(phases, id: \.self) { phase in
                let on = selectedPhase == phase
                Button {
                    jump(to: phase)
                } label: {
                    VStack(spacing: 5) {
                        ZStack {
                            if let url = videoURL, let frame = phaseFrame(for: phase) {
                                ShotIQVideoStillThumbnail(url: url,
                                                          seconds: frame.timestampSeconds,
                                                          width: 62,
                                                          height: 52,
                                                          cornerRadius: 5)
                            } else {
                                CanonicalPhoto("042-visual-002", width: 62, height: 52, cornerRadius: 5)
                            }
                        }
                        .overlay(RoundedRectangle(cornerRadius: 5)
                            .stroke(on ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                                    lineWidth: on ? 2 : 1))
                        Text(phase.replacingOccurrences(of: "-", with: "\n"))
                            .shotiqBody(8, weight: on ? .bold : .semibold)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .minimumScaleFactor(0.7)
                            .foregroundStyle(on ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                            .frame(height: 20)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Show \(phase.lowercased()) frame")
            }
        }
    }

    private func phaseFrame(for phase: String) -> VideoPoseFrameRecord? {
        if let exact = frames.first(where: { $0.phaseLabel.uppercased() == phase }) {
            return exact
        }
        guard !frames.isEmpty else { return nil }
        switch phase {
        case "SETUP": return frames.first
        case "LOAD": return frameAt(0.2)
        case "RISE": return frameAt(0.45)
        case "RELEASE": return frameAt(0.68)
        default: return frames.last
        }
    }

    private func frameAt(_ fraction: Double) -> VideoPoseFrameRecord? {
        guard !frames.isEmpty else { return nil }
        let index = Int((Double(frames.count - 1) * fraction).rounded())
        return frames[min(max(index, 0), frames.count - 1)]
    }

    private func playbackButton(_ icon: String, _ label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(ShotIQColor.ink)
                .frame(width: 34, height: 34)
                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 6))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }

    private func overlayButton(_ icon: String, _ label: String, _ active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 20, weight: .semibold))
                Text(label).shotiqBody(9, weight: .bold)
                    .lineLimit(1).minimumScaleFactor(0.55)
            }
            .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
            .frame(maxWidth: .infinity)
            .frame(height: 46)
            .background(active ? ShotIQColor.shotiqOrange.opacity(0.1) : Color.clear,
                        in: RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }

    private var mediaExpandPill: some View {
        HStack(spacing: 5) {
            Image(systemName: "arrow.up.left.and.arrow.down.right")
                .font(.system(size: 10, weight: .bold))
            Text("Full view")
                .shotiqBody(10, weight: .bold)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 6))
        .padding(10)
    }
}

fileprivate struct TappablePhaseStrip: View {
    var active: String
    var action: (String) -> Void

    var body: some View {
        HStack(alignment: .top) {
            ForEach(ShotPhase.allCases, id: \.self) { phase in
                let on = ShotPhase(label: active) == phase
                Button {
                    action(phase.title)
                } label: {
                    VStack(spacing: 4) {
                        PhaseGlyph(phase: phase, active: on, size: 44)
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
                .buttonStyle(.plain)
                .accessibilityLabel("Jump to \(phase.title)")
            }
        }
    }
}

fileprivate struct AnalysisFullScreenMediaView: View {
    var presentation: AnalysisResultPresentation
    var fallbackKey: String
    @Binding var selectedPhase: String
    var overrideFrame: VideoPoseFrameRecord? = nil
    @Environment(\.dismiss) private var dismiss
    @State private var toast: ShotIQToast?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            GeometryReader { proxy in
                VStack(spacing: 14) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(selectedPhase)
                                .shotiqCondensed(24, weight: .heavy)
                                .foregroundStyle(.white)
                            Text(presentation.mediaLabel.uppercased())
                                .shotiqBody(11, weight: .bold)
                                .kerning(0.6)
                                .foregroundStyle(.white.opacity(0.72))
                        }
                        Spacer()
                        Button {
                            dismiss()
                        } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 40, height: 40)
                                .background(.white.opacity(0.16), in: Circle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Close full view")
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 14)

                    if let url = presentation.videoURL ?? presentation.mediaURL,
                       presentation.mediaLabel.uppercased().contains("VIDEO") || presentation.videoURL != nil {
                        VideoPoseResultSurface(url: url,
                                               presentation: presentation,
                                               height: max(320, proxy.size.height - 198),
                                               showSkeleton: true,
                                               showJoints: true,
                                               showBall: false,
                                               showAngles: true,
                                               phase: selectedPhase,
                                               overrideFrame: overrideFrame?.phaseLabel == selectedPhase ? overrideFrame : nil,
                                               showsAdvancedControls: true)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .padding(.horizontal, 10)
                    } else {
                        AnalysisResultMediaSurface(presentation: presentation,
                                                   fallbackKey: fallbackKey,
                                                   height: max(320, proxy.size.height - 198),
                                                   phase: selectedPhase,
                                                   showGuidanceLabels: true)
                            .padding(.horizontal, 10)
                    }

                    FlexiblePhaseButtons(phases: ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"],
                                         active: selectedPhase) { phase in
                        selectedPhase = phase
                        toast = .success("\(phase.capitalized) selected")
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 14)
                }
            }
        }
        .shotiqToast($toast)
    }
}

fileprivate enum AnalysisResultTab: String, CaseIterable {
    case result
    case flaws
    case player
    case compare

    var title: String {
        switch self {
        case .result: return "ANALYSIS RESULT"
        case .flaws: return "FLAWS"
        case .player: return "PLAYER"
        case .compare: return "COMPARE"
        }
    }
}

fileprivate struct FlexiblePhaseButtons: View {
    var phases: [String]
    var active: String
    var action: (String) -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            ForEach(phases, id: \.self) { phase in
                let shotPhase = ShotPhase(label: phase)
                let on = ShotPhase(label: active) == shotPhase
                Button { action(phase) } label: {
                    VStack(spacing: 5) {
                        PhaseGlyph(phase: shotPhase, active: on, size: 36)
                        Text(phase.replacingOccurrences(of: "-", with: "\n"))
                            .shotiqMicroCaps(weight: on ? .bold : .regular,
                                             tracking: ShotIQType.microTracking - 0.1)
                            .foregroundStyle(on ? ShotIQColor.shotiqOrange : Color.white.opacity(0.82))
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .minimumScaleFactor(0.72)
                        Rectangle()
                            .fill(on ? ShotIQColor.shotiqOrange : .clear)
                            .frame(width: 34, height: 3)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 76)
                    .background(on ? Color.white.opacity(0.14) : Color.white.opacity(0.07),
                                in: RoundedRectangle(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(on ? ShotIQColor.shotiqOrange : Color.white.opacity(0.18), lineWidth: on ? 1.6 : 1)
                    )
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Jump to \(phase)")
            }
        }
    }
}

fileprivate struct VideoPoseAngleStrip: View {
    var frame: VideoPoseFrameRecord
    var coachingTarget: String

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 6) {
                angleBadge("ELBOW", frame.elbowAngle)
                angleBadge("WRIST", frame.wristAngle)
                angleBadge("RELEASE", frame.releaseAngle, signed: true)
            }
            Text(coachingTarget)
                .shotiqBody(11, weight: .semibold)
                .foregroundStyle(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.72)
        }
        .padding(9)
        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 7))
    }

    private func angleBadge(_ label: String, _ value: Double?, signed: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label)
                .shotiqBody(8, weight: .bold)
                .kerning(0.5)
                .foregroundStyle(.white.opacity(0.72))
            Text(Self.degreeText(value, signed: signed))
                .font(.custom("Tungsten-Medium", size: 20))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(width: 54, alignment: .leading)
    }

    private static func degreeText(_ value: Double?, signed: Bool) -> String {
        guard let value else { return "--" }
        let rounded = Int(value.rounded())
        if signed, rounded > 0 { return "+\(rounded)°" }
        return "\(rounded)°"
    }
}

fileprivate struct FrameDetailMediaSurface: View {
    var presentation: AnalysisResultPresentation
    var fallbackKey: String
    var height: CGFloat
    var phase: String? = "RELEASE"
    var showSkeleton: Bool
    var showJoints: Bool
    var showBall: Bool
    var showAngles: Bool

    var body: some View {
        ZStack {
            switch AnalysisResultMediaSurfaceResolver.source(for: presentation, fallbackKey: fallbackKey) {
            case .video(let url):
                VideoPoseResultSurface(url: url,
                                       presentation: presentation,
                                       height: height,
                                       showSkeleton: showSkeleton,
                                       showJoints: showJoints,
                                       showBall: showBall,
                                       showAngles: showAngles,
                                       phase: phase)
            case .image(let url):
                if url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
                    CapturedPoseImage(image: image,
                                      height: height,
                                      cornerRadius: 4,
                                      showsPose: showSkeleton || showJoints || showAngles,
                                      showBones: showSkeleton,
                                      showJoints: showJoints || showAngles,
                                      showBall: showBall,
                                      showAngles: showAngles,
                                      initialPose: presentation.detectedPose)
                } else {
                    RemoteCapturedPoseImage(url: url,
                                            height: height,
                                            cornerRadius: 4,
                                            showsPose: showSkeleton || showJoints || showAngles,
                                            showBones: showSkeleton,
                                            showJoints: showJoints || showAngles,
                                            showBall: showBall,
                                            showAngles: showAngles,
                                            initialPose: presentation.detectedPose,
                                            fallbackKey: fallbackKey)
                }
            case .canonicalFallback(let key):
                CanonicalPhoto(key, height: height, cornerRadius: 4)
            case .placeholder(let label):
                frameFallback(label)
            }
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: 4))
        .accessibilityIdentifier("frame-detail-real-media")
        .overlay(alignment: .topTrailing) {
            if presentation.detectedPose != nil {
                Color.clear
                    .frame(width: 1, height: 1)
                    .accessibilityIdentifier("captured-pose-detected")
                    .accessibilityLabel("Shooter pose detected")
            }
        }
    }

    private func frameFallback(_ label: String, showsProgress: Bool = false) -> some View {
        ZStack {
            CanonicalPhoto(fallbackKey, height: height, cornerRadius: 4)
            if showSkeleton || showJoints || showAngles {
                SkeletonOverlay(showBones: showSkeleton,
                                showJoints: showJoints || showAngles)
                    .opacity(0.72)
            }
        }
        .overlay(alignment: .bottomLeading) {
            HStack(spacing: 7) {
                if showsProgress {
                    ProgressView().controlSize(.small).tint(.white)
                } else {
                    Image(systemName: "photo").font(.system(size: 11, weight: .semibold))
                }
                Text(label).shotiqBody(11, weight: .semibold)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 9).padding(.vertical, 6)
            .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 5))
            .padding(10)
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
    @EnvironmentObject var app: AppState
    @State private var pct = 0.12
    @State private var route: ProcessingRoute?
    @State private var completedResult: ShotIQAnalysisResultDTO?
    @State private var previewPoseFrame: VideoPoseFrameRecord?
    @State private var startedVideoSessionId: String?
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
                                        ZStack(alignment: .bottomLeading) {
                                            ShotIQAspectFillVideoPlayer(player: AVPlayer(url: videoJob.clip.url))
                                            if let frame = previewPoseFrame, let pose = frame.detectedPose {
                                                ShotIQVideoAnalysisOverlay(frame: frame,
                                                                           pose: pose,
                                                                           presentation: .noResult,
                                                                           showSkeleton: true,
                                                                           showJoints: true,
                                                                           showBall: false,
                                                                           showAnnotations: false,
                                                                           displayPhase: frame.phaseLabel.uppercased())
                                            } else {
                                                HStack(spacing: 6) {
                                                    ProgressView().scaleEffect(0.7)
                                                    Text("Sampling pose").shotiqBody(10, weight: .bold).kerning(0.4)
                                                }
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 6)
                                                .background(.black.opacity(0.68), in: RoundedRectangle(cornerRadius: 6))
                                                .foregroundStyle(.white)
                                                .padding(10)
                                            }
                                        }
                                        .frame(height: 200)
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                        .accessibilityIdentifier(previewPoseFrame == nil ? "analysis-processing-video-preview" : "analysis-processing-pose-preview")
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
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "clock"), size: 44).font(.system(size: 28, weight: .light))
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
                guard startedVideoSessionId != videoJob.clientSessionId else { return }
                startedVideoSessionId = videoJob.clientSessionId
                await processVideo(job: videoJob)
                return
            }
            if let initialResult {
                app.rememberAnalysisMedia(initialResult)
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
        previewPoseFrame = poseAnalysis.frames.first { $0.frameIndex == poseAnalysis.summary.releaseFrameIndex }
            ?? poseAnalysis.frames.first
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
            if analysis.bodyPositions?.isEmpty != false {
                analysis.bodyPositions = poseAnalysis.frames
            }
            if analysis.media.videoUrl?.isEmpty != false {
                analysis.media.videoUrl = uploadedURL
            }
            if analysis.media.localVideoUrl == nil {
                analysis.media.localVideoUrl = job.clip.url.absoluteString
            }
            completedResult = analysis
            app.rememberAnalysisMedia(analysis, title: "Analyzed Video")
            pct = 0.94
            route = .results
        } catch {
            completedResult = localFallback
            app.rememberAnalysisMedia(localFallback, title: "Analyzed Video")
            pct = 0.94
            route = .results
        }
    }
}

struct AnalysisTakingLongerView: View { // 037
    enum LongerRoute: Hashable { case capture }
    @Environment(\.dismiss) private var dismiss
    @State private var notifyRequested = false
    @State private var showCancelConfirm = false
    @State private var route: LongerRoute?
    @State private var toast: ShotIQToast?
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
                                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "point.topleft.down.to.point.bottomright.curvepath"), size: 44)
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
                                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "clock"), size: 44).font(.system(size: 30, weight: .light))
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
                                requestAnalysisReadyNotification()
                            }
                            .disabled(notifyRequested)
                            .padding(.top, 16)
                            SecondaryButton(title: "Keep waiting", icon: "arrow.2.circlepath") {
                                toast = .info("Keeping analysis in progress")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { dismiss() }
                            }
                                .padding(.top, 10)
                            SecondaryButton(title: "Cancel analysis", icon: "xmark") {
                                toast = .info("Confirm cancel analysis")
                                showCancelConfirm = true
                            }
                                .padding(.top, 10)
                                .alert("Cancel this analysis?", isPresented: $showCancelConfirm) {
                                    Button("Cancel analysis", role: .destructive) {
                                        toast = .info("Analysis cancelled", "Your clip is still saved in history.")
                                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { route = .capture }
                                    }
                                    Button("Keep waiting", role: .cancel) {
                                        toast = .success("Still analyzing", "ShotIQ will keep building your report.")
                                    }
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
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "clock"), size: 42).font(.system(size: 16)).foregroundStyle(ShotIQColor.ink)
                                    Text("Estimated\n2–4 min").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(12)
                            }
                            .padding(.top, 8)
                            PhaseStrip().padding(.top, 18)
                            NavigationLink { AnalyzeHubView() } label: {
                                CoachTargetCard(bordered: false)
                                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Analysis still processing",
                                              "Open capture if you need to add another shot while this finishes.")
                            })
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
        .shotiqToast($toast)
        .navigationDestination(item: $route) { r in
            switch r {
            case .capture:
                AnalyzeHubView()
            }
        }
    }
    private func stage(_ icon: String, _ title: String, _ sub: String, _ active: Bool) -> some View {
        VStack(spacing: 5) {
            // Canonical 036 prints a different diagram per pipeline stage.
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 38)
                .foregroundStyle(active ? ShotIQColor.analysisBlue : ShotIQColor.ink)
            Text(title).shotiqBody(12).foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
            Text(sub).shotiqBody(11)
                .foregroundStyle(active ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }

    private func requestAnalysisReadyNotification() {
        toast = .progress("Requesting notifications",
                          "Allow ShotIQ to notify you when this analysis is ready.",
                          progress: 0.45)
        UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                Task { @MainActor in
                    guard granted else {
                        toast = .info("Notifications need permission",
                                      "Turn on ShotIQ notifications in iOS Settings when you are ready.")
                        return
                    }
                    let content = UNMutableNotificationContent()
                    content.title = "ShotIQ analysis ready"
                    content.body = "Your shot breakdown is ready to review."
                    content.sound = .default
                    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 120, repeats: false)
                    let request = UNNotificationRequest(identifier: "shotiq-analysis-ready-\(UUID().uuidString)",
                                                        content: content,
                                                        trigger: trigger)
                    do {
                        try await UNUserNotificationCenter.current().add(request)
                        notifyRequested = true
                        toast = .success("Notification set",
                                         "ShotIQ will alert you when this analysis is ready.")
                    } catch {
                        toast = .error("Notification not set",
                                       "ShotIQ could not schedule the analysis alert.")
                    }
                }
            }
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
    @State private var toast: ShotIQToast?
    @State private var selectedTab: AnalysisResultTab = .result
    @State private var selectedPhase = "RELEASE"
    @State private var showFullMedia = false

    init(initialResult: ShotIQAnalysisResultDTO? = nil) {
        self.initialResult = initialResult
        let seeded = initialResult.map(AnalysisResultPresentation.init)
            ?? (UITestHooks.weakAnalysis
                ? AnalysisResultPresentation(result: ShotIQLocalAnalysisFactory.uiTestWeakAnalysis())
                : (UITestHooks.active ? .canonicalDemo : .noResult))
        _presentation = State(initialValue: seeded)
        _overviewChrome = State(initialValue: UITestHooks.active
                                ? .canonicalDemo
                                : .productionFallback(user: nil))
    }

    var body: some View {
        let p = resolvedPresentation
        let hasLoadedAnalysis = p.id != AnalysisResultPresentation.noResult.id
        CanonicalScreen(testID: "screen-ios-analysis-result-overview") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: overviewChrome.playerName,
                                     subtitle: overviewChrome.subtitle,
                                     streak: overviewChrome.streak,
                                     points: overviewChrome.points)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 24) {
                                ForEach(AnalysisResultTab.allCases, id: \.self) { tab in
                                    resultTabButton(tab, hasLoadedAnalysis: hasLoadedAnalysis)
                                }
                            }
                            .padding(.horizontal, 20)
                        }
                        .padding(.top, 16)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        VStack(alignment: .leading, spacing: 0) {
                            analysisTabContent(p, hasLoadedAnalysis: hasLoadedAnalysis)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .shotiqToast($toast)
        .analysisInfoAlert($info)
        .fullScreenCover(isPresented: $showFullMedia) {
            AnalysisFullScreenMediaView(presentation: resolvedPresentation,
                                        fallbackKey: "038-visual-001",
                                        selectedPhase: $selectedPhase)
        }
        .onAppear {
            if let initialResult {
                app.rememberAnalysisMedia(initialResult)
            }
        }
        .task {
            guard !UITestHooks.active else { return }
            await loadProductionChrome()
            guard initialResult == nil else { return }
            isLoadingLatest = true
            defer { isLoadingLatest = false }
            do {
                if let latest = try await APIClient.shared.latestAnalysis() {
                    presentation = AnalysisResultPresentation(result: latest)
                    app.rememberAnalysisMedia(latest)
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

    private var resolvedPresentation: AnalysisResultPresentation {
        guard !UITestHooks.active else { return presentation }
        let latest = app.recentMedia.first.map { AnalysisResultPresentation(result: $0.analysis) }
        if presentation.id == AnalysisResultPresentation.noResult.id {
            return latest ?? presentation
        }
        if presentation.id != "canonical-demo",
           presentation.mediaURL == nil,
           presentation.videoURL == nil,
           let latest {
            return latest
        }
        return presentation
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
        .simultaneousGesture(TapGesture().onEnded {
            toast = .info("Opening \(t.capitalized)")
        })
    }
    private func analysisGatedStripLink(_ t: String,
                                        hasLoadedAnalysis: Bool,
                                        _ dest: some View) -> some View {
        NavigationLink {
            if hasLoadedAnalysis {
                dest
            } else {
                AnalyzeHubView()
            }
        } label: {
            Text(t).shotiqBody(13, weight: .semibold).kerning(0.6)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .simultaneousGesture(TapGesture().onEnded {
            if hasLoadedAnalysis {
                toast = .info("Opening \(t.capitalized)")
            } else {
                toast = .info("Analyze a shot first",
                              "Create an analysis before opening \(t.lowercased()).")
            }
        })
    }

    private func resultTabButton(_ tab: AnalysisResultTab, hasLoadedAnalysis: Bool) -> some View {
        let on = selectedTab == tab
        return Button {
            guard hasLoadedAnalysis || tab == .result else {
                toast = .info("Analyze a shot first",
                              "Create an analysis before opening \(tab.title.lowercased()).")
                return
            }
            selectedTab = tab
            toast = .success("\(tab.title.capitalized) selected")
        } label: {
            VStack(spacing: 8) {
                Text(tab.title)
                    .shotiqBody(13, weight: on ? .bold : .semibold)
                    .kerning(0.6)
                    .foregroundStyle(on ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                Rectangle()
                    .fill(on ? ShotIQColor.shotiqOrange : .clear)
                    .frame(height: 3)
            }
            .fixedSize()
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.title)
    }

    @ViewBuilder
    private func analysisTabContent(_ p: AnalysisResultPresentation,
                                    hasLoadedAnalysis: Bool) -> some View {
        switch selectedTab {
        case .result:
            resultContent(p, hasLoadedAnalysis: hasLoadedAnalysis)
        case .flaws:
            flawsInlineContent(p)
        case .player:
            playerInlineContent(p)
        case .compare:
            compareInlineContent(p)
        }
    }

    private func resultContent(_ p: AnalysisResultPresentation,
                               hasLoadedAnalysis: Bool) -> some View {
        Group {
            HStack(alignment: .top, spacing: 18) {
                Button {
                    showFullMedia = true
                    toast = .info("Opening full view", selectedPhase.capitalized)
                } label: {
                    ZStack(alignment: .topTrailing) {
                        AnalysisResultMediaSurface(presentation: p,
                                                   fallbackKey: "038-visual-001",
                                                   height: 220,
                                                   phase: selectedPhase)
                        if p.id == "canonical-demo" { SkeletonOverlay() }
                        mediaExpandPill
                    }
                }
                .buttonStyle(.plain)
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
                        miniStat(selectedPhase, "PHASE")
                        miniStat(p.mediaLabel.uppercased(), "MEDIA")
                        miniStat(p.provenanceSummary, "SOURCES")
                    }
                    .padding(.top, 14)
                }
                .frame(width: 140, alignment: .leading)
            }
            .padding(.top, 16)
            TappablePhaseStrip(active: selectedPhase) { phase in
                selectedPhase = phase
                toast = .success("\(phase.capitalized) selected", "Media moved to this shot phase.")
            }
            .padding(.top, 16)
            if p.videoURL != nil || !p.videoPoseFrames.isEmpty {
                VideoFramePlaybackPanel(presentation: p)
                    .padding(.top, 18)
            }
            Button {
                selectedTab = .flaws
                toast = .success("Flaws selected")
            } label: {
                CoachTargetCard(title: p.coachingTarget)
            }
            .buttonStyle(.plain)
            .padding(.top, 16)
            metricsSection(p)
            compareSection(p)
            actionButtons(p, hasLoadedAnalysis: hasLoadedAnalysis)
        }
    }

    private func metricsSection(_ p: AnalysisResultPresentation) -> some View {
        Group {
            HStack(spacing: 6) {
                SectionLabel(text: "YOUR SIX KEY METRICS")
                Button {
                    info = AnalysisInfoNote(title: "Your six key metrics",
                                            message: "These values are read from the shared saved analysis contract. Missing values stay unavailable instead of being filled with demo numbers.")
                    toast = .info("Showing metric explanation")
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
        }
    }

    private func compareSection(_ p: AnalysisResultPresentation) -> some View {
        Group {
            HStack {
                HStack(spacing: 6) {
                    SectionLabel(text: "ELITE MATCH")
                    Button {
                        info = AnalysisInfoNote(title: "Elite match",
                                                message: "We compare your measured mechanics to a library of elite shooters and surface the closest match.")
                        toast = .info("Showing elite match explanation")
                    } label: {
                        Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                    }
                    .buttonStyle(.plain)
                }
                Spacer()
                Button {
                    info = AnalysisInfoNote(title: "How elite match works",
                                            message: "Your release angle, elbow alignment and shot arc are scored against each elite profile. The overall match is the weighted similarity across all six key metrics.")
                    toast = .info("Showing match details")
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
        }
    }

    private func actionButtons(_ p: AnalysisResultPresentation,
                               hasLoadedAnalysis: Bool) -> some View {
        Group {
            NavigationLink {
                if hasLoadedAnalysis {
                    ShotBreakdownView(presentation: p)
                } else {
                    AnalyzeHubView()
                }
            } label: {
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
            .simultaneousGesture(TapGesture().onEnded {
                if hasLoadedAnalysis {
                    toast = .info("Opening shot breakdown")
                } else {
                    toast = .info("Analyze a shot first",
                                  "Upload a photo or video before opening shot breakdown.")
                }
            })
            .padding(.top, 20)
            NavigationLink {
                if hasLoadedAnalysis {
                    ShareResultsView(presentationOverride: p,
                                     analysisOverride: initialResult)
                } else {
                    AnalyzeHubView()
                }
            } label: {
                HStack {
                    Image(systemName: "square.and.arrow.up").font(.system(size: 16))
                    Text("Share analysis").shotiqBody(16)
                    Spacer()
                    Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                }
                .foregroundStyle(ShotIQColor.ink)
                .padding(.horizontal, 16).frame(height: 52)
                .contentShape(Rectangle())
                .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
            }
            .simultaneousGesture(TapGesture().onEnded {
                if hasLoadedAnalysis {
                    toast = .info("Opening share results")
                } else {
                    toast = .info("Analyze a shot first",
                                  "Create an analysis before sharing results.")
                }
            })
            .buttonStyle(.plain)
            .accessibilityIdentifier("Share analysis")
            .padding(.top, 10)
        }
    }

    private func flawsInlineContent(_ p: AnalysisResultPresentation) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            CoachTargetCard(title: p.coachingTarget)
                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
            Text(p.flaws.isEmpty
                 ? "AI analysis detected no priority flaws from the saved measurements."
                 : "AI analysis detected \(p.flaws.count) priority flaw\(p.flaws.count == 1 ? "" : "s") impacting this saved shot.")
                .shotiqBody(14)
                .foregroundStyle(ShotIQColor.graphite)
            if p.flaws.isEmpty {
                inlineStatusCard("NO PRIORITY FLAWS DETECTED",
                                 "Saved measurements are inside the current ShotIQ target bands.",
                                 icon: "checkmark.circle",
                                 tint: ShotIQColor.confirmGreen)
            } else {
                ForEach(p.flaws) { flaw in
                    NavigationLink {
                        FlawDetailView(title: flaw.title,
                                       severity: flaw.impact,
                                       flaw: flaw,
                                       presentation: p)
                    } label: {
                        inlineFlawCard(flaw)
                    }
                    .buttonStyle(.plain)
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening flaw detail", flaw.title)
                    })
                }
            }
        }
        .padding(.top, 16)
    }

    private func playerInlineContent(_ p: AnalysisResultPresentation) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            inlineStatusCard(overviewChrome.playerName.uppercased(),
                             "\(overviewChrome.subtitle) • Current analysis saved as \(p.mediaLabel.lowercased()).",
                             icon: "person.crop.circle",
                             tint: ShotIQColor.analysisBlue)
            metricsSection(p)
        }
        .padding(.top, 16)
    }

    private func compareInlineContent(_ p: AnalysisResultPresentation) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            compareSection(p)
            NavigationLink { EliteMatchView(presentation: p) } label: {
                HStack(spacing: 10) {
                    Image(systemName: "person.2.wave.2")
                    Text("Open full compare")
                    Spacer()
                    Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold))
                }
                .shotiqBody(15, weight: .semibold)
                .foregroundStyle(ShotIQColor.ink)
                .padding(.horizontal, 16)
                .frame(height: 50)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
            }
            .buttonStyle(.plain)
        }
        .padding(.top, 16)
    }

    private func inlineStatusCard(_ title: String,
                                  _ message: String,
                                  icon: String,
                                  tint: Color) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(tint)
                    .frame(width: 30)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).shotiqDisplay(20)
                    Text(message)
                        .shotiqBody(13)
                        .foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            .padding(14)
        }
    }

    private func inlineFlawCard(_ flaw: AnalysisFlawItem) -> some View {
        let tint: Color = flaw.impact == "HIGH IMPACT" ? ShotIQColor.reviewRed : ShotIQColor.shotiqOrange
        return ShotIQCard {
            HStack(alignment: .top, spacing: 12) {
                RoundedRectangle(cornerRadius: 5)
                    .fill(tint)
                    .frame(width: 28, height: 28)
                    .overlay(Text("\(flaw.rank)").shotiqBody(14, weight: .bold).foregroundStyle(.white))
                VStack(alignment: .leading, spacing: 5) {
                    Text(flaw.title).shotiqDisplay(20)
                    Text(flaw.description)
                        .shotiqBody(13)
                        .foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(flaw.impact)
                        .shotiqBody(9, weight: .bold)
                        .foregroundStyle(tint)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 4)
                        .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(ShotIQColor.graphite)
            }
            .padding(14)
        }
    }

    private var mediaExpandPill: some View {
        HStack(spacing: 5) {
            Image(systemName: "arrow.up.left.and.arrow.down.right")
                .font(.system(size: 10, weight: .bold))
            Text("Full view")
                .shotiqBody(10, weight: .bold)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 6))
        .padding(10)
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
                        ShotIQConceptGlyph(concept: tile.label, fallback: tile.icon, size: 30)
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
                .simultaneousGesture(TapGesture().onEnded {
                    toast = .info("Opening \(tile.label)")
                })
                .buttonStyle(.plain)
                if tile.label != row.last?.label {
                    Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 10)
                }
            }
        }
    }
    @ViewBuilder private func eliteMatchCard(_ match: AnalysisEliteMatchSummary) -> some View {
        if match.isMatched {
            NavigationLink { EliteMatchView(presentation: presentation) } label: {
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
            .simultaneousGesture(TapGesture().onEnded {
                toast = .info("Opening elite match")
            })
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
            MechanicGlyph(kind: .init(metricLabel: label), size: 28)
                .foregroundStyle(ShotIQColor.ink).frame(width: 22)
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
    @State private var toast: ShotIQToast?
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
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening shot analysis")
                            })
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
                            NavigationLink { AnalyzeHubView() } label: {
                                CoachTargetCard(bordered: false)
                                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Analyze a shot first",
                                              "Upload or record media before ShotIQ can build a coaching target.")
                            })
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
        .shotiqToast($toast)
    }
    private var sourceRow: some View {
        HStack(spacing: 12) {
            NavigationLink { PhotoUploadSourceView() } label: {
                sourceCard("photo.on.rectangle", "Upload image")
            }
            .simultaneousGesture(TapGesture().onEnded {
                toast = .info("Opening image upload")
            })
            NavigationLink { VideoUploadView() } label: {
                sourceCard("film", "Upload video")
            }
            .simultaneousGesture(TapGesture().onEnded {
                toast = .info("Opening video upload")
            })
            NavigationLink { LiveCameraSetupView() } label: {
                sourceCard("point.3.connected.trianglepath.dotted", "Live camera")
            }
            .simultaneousGesture(TapGesture().onEnded {
                toast = .info("Opening live camera")
            })
        }
    }
    private func sourceCard(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 10) {
            Group {
                if let source = CaptureSource(sourceLabel: label) {
                    CaptureSourceGlyph(source: source, size: 44)
                } else {
                    Image(systemName: icon).font(.system(size: 44, weight: .light))
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
    @State private var toast: ShotIQToast?
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
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "exclamationmark.triangle"), size: 44)
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
                                toast = .progress(hasRetryMedia ? "Retrying analysis" : "Opening capture",
                                                  hasRetryMedia ? "Reloading your saved frame for a clean retry." : "Choose new media to analyze.",
                                                  progress: 0.45)
                                route = .retry
                            }
                            .padding(.top, 14)
                            HStack(spacing: 12) {
                                Button {
                                    toast = .info(hasRetryMedia ? "Opening frame picker" : "Opening capture",
                                                  hasRetryMedia ? "Your saved image is ready to crop again." : "Choose new media before selecting a frame.")
                                    route = .chooseFrame
                                } label: {
                                    halfButton("point.3.connected.trianglepath.dotted", "Choose another frame")
                                }
                                .buttonStyle(.plain)
                                Button {
                                    toast = .info("Opening Support", "Preparing an email about this analysis error.")
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
                            NavigationLink { AnalyzeHubView() } label: {
                                CoachTargetCard(bordered: false)
                                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Replace media",
                                              "Choose a clearer photo or video before reviewing flaws.")
                            })
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
        .shotiqToast($toast)
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
                    AnalyzeHubView()
                }
            }
        }
    }
    private func halfButton(_ icon: String, _ title: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 24))
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
    @State private var toast: ShotIQToast?
    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    /// Canonical filmstrip crops, matched to their column on the 853x1844 render.
    /// LOAD has no crop in the asset set, so that cell keeps the dark surface.
    private static func phaseFrameKey(_ phase: String) -> String? {
        switch phase {
        case "SETUP": return "041-visual-001"
        case "LOAD": return "042-frame-002"
        case "RISE": return "041-visual-003"
        case "RELEASE": return "041-visual-002"
        case "FOLLOW-THROUGH": return "041-visual-004"
        default: return "041-visual-002"
        }
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-shot-breakdown") {
            VStack(spacing: 0) {
                HStack {
                    Button {
                        toast = .info("Returning to analysis overview")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                    } label: {
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
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening share sheet", "Shot breakdown summary is ready.")
                    })
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
                                NavigationLink { FrameDetailSkeletonView(presentation: presentation) } label: {
                                    VStack(spacing: 8) {
                                        if presentation.id != "canonical-demo",
                                           presentation.mediaURL != nil || presentation.videoURL != nil {
                                            PhaseMediaThumbnail(presentation: presentation,
                                                                fallbackKey: "041-visual-002",
                                                                height: 190,
                                                                phase: phase)
                                        } else if let key = Self.phaseFrameKey(phase) {
                                            // Canonical phase frame — pose overlay already in the pixels.
                                            CanonicalPhoto(key, height: 190, cornerRadius: 2)
                                        } else {
                                            CanonicalPhoto("041-visual-002", height: 190, cornerRadius: 2)
                                                .overlay(SkeletonOverlay().opacity(0.72))
                                        }
                                        Text(phase).shotiqBody(9, weight: phase == "RELEASE" ? .bold : .regular)
                                            .kerning(0.4)
                                            .foregroundStyle(phase == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                            .lineLimit(1).minimumScaleFactor(0.6)
                                    }
                                }
                                .buttonStyle(.plain)
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening \(phase) frame")
                                })
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
                                        NavigationLink { FrameDetailSkeletonView(presentation: presentation) } label: {
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
                                        .simultaneousGesture(TapGesture().onEnded {
                                            toast = .info("Opening release frame")
                                        })
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
        .shotiqToast($toast)
    }
    private func breakdownStat(_ icon: String, _ label: String, _ value: String, _ unit: String?) -> some View {
        VStack(spacing: 5) {
            MechanicGlyph(kind: .init(metricLabel: label), size: 28)
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
    var presentation: AnalysisResultPresentation = .canonicalDemo
    @State private var frame = 3.0
    @State private var phase = "RELEASE"
    @State private var showSkeleton = true
    @State private var showJoints = false
    @State private var showBall = false
    @State private var showAngles = false
    @State private var toast: ShotIQToast?
    private let allPhases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    /// The five frames canonical shows in the scrubber strip, left to right.
    private let frameThumbs = ["042-frame-001", "042-frame-002", "042-frame-003",
                               "042-frame-004", "042-frame-005"]
    /// Frame 42 corresponds to the canonical slider position 3.
    private var frameNumber: Int { 39 + Int(frame) }
    private var isCanonicalDemo: Bool { presentation.id == "canonical-demo" }
    private var displayPhase: String {
        phase
    }
    private var shotLabel: String {
        isCanonicalDemo ? "SHOT 12 OF 24" : "SAVED ANALYSIS"
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-frame-detail-skeleton") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Button {
                                toast = .info("Returning to analysis")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { dismiss() }
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "chevron.left").font(.system(size: 15, weight: .semibold))
                                    Text("ANALYZE").shotiqBody(13, weight: .semibold).kerning(0.8)
                                }
                                .foregroundStyle(ShotIQColor.graphite)
                            }
                            .buttonStyle(.plain)
                            Spacer()
                            Text(shotLabel).shotiqBody(13, weight: .semibold).kerning(0.8)
                                .foregroundStyle(ShotIQColor.graphite)
                            Spacer()
                            NavigationLink { ShotBreakdownView(presentation: presentation) } label: {
                                HStack(spacing: 6) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-upload-video",
                                                             size: 16,
                                                             label: nil)
                                    Text("View sequence").shotiqBody(13)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .info("Opening shot sequence")
                            })
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 20).frame(height: 44)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        PlayerHeader(name: isCanonicalDemo ? "Jordan Ellis" : "Saved Analysis",
                                     subtitle: isCanonicalDemo ? "Right-handed • Advanced" : presentation.recordedLabel,
                                     streak: isCanonicalDemo ? "6" : "--",
                                     points: isCanonicalDemo ? "2,840" : "--")
                        VStack(alignment: .leading, spacing: 0) {
                            ZStack(alignment: .topLeading) {
                                if isCanonicalDemo {
                                    CanonicalPhoto("042-visual-002", height: 317, cornerRadius: 4)
                                } else {
                                    FrameDetailMediaSurface(presentation: presentation,
                                                            fallbackKey: "042-visual-002",
                                                            height: 317,
                                                            phase: phase,
                                                            showSkeleton: showSkeleton,
                                                            showJoints: showJoints,
                                                            showBall: showBall,
                                                            showAngles: showAngles)
                                }
                                if isCanonicalDemo && (showJoints || showBall || showAngles) {
                                    SkeletonOverlay(showBones: showSkeleton, showJoints: showJoints,
                                                    showBall: showBall, showAngles: showAngles)
                                }
                                HStack {
                                    Menu {
                                        ForEach(allPhases, id: \.self) { p in
                                            Button(p) {
                                                phase = p
                                                toast = .success("Phase set to \(p)")
                                            }
                                        }
                                    } label: {
                                        HStack(spacing: 6) {
                                            Text("\(displayPhase) • FRAME \(frameNumber)").shotiqBody(12, weight: .bold).kerning(0.5)
                                            Image(systemName: "chevron.down").font(.system(size: 10, weight: .bold))
                                        }
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 12).padding(.vertical, 8)
                                        .background(.black.opacity(isCanonicalDemo ? 0.55 : 0.68), in: RoundedRectangle(cornerRadius: 8))
                                        .opacity(isCanonicalDemo ? 0 : 1)
                                    }
                                    .accessibilityLabel("Shot phase, \(displayPhase), frame \(frameNumber)")
                                    Spacer()
                                }
                                .padding(10)
                            }
                            .padding(.top, 14)
                            if !isCanonicalDemo {
                                Text("\(presentation.mediaLabel) • \(presentation.provenanceSummary)")
                                    .shotiqBody(12, weight: .medium)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .accessibilityIdentifier("frame-detail-presentation-source")
                                    .padding(.top, 8)
                            }
                            HStack(spacing: 10) {
                                Button {
                                    showSkeleton.toggle()
                                    toast = .success(showSkeleton ? "Skeleton overlay on" : "Skeleton overlay off")
                                } label: {
                                    overlayToggleLabel("point.3.connected.trianglepath.dotted", "Skeleton", showSkeleton)
                                }
                                .buttonStyle(.plain)
                                Button {
                                    showJoints.toggle()
                                    toast = .success(showJoints ? "Joint points on" : "Joint points off")
                                } label: {
                                    overlayToggleLabel("circle.dotted", "Joint points", showJoints)
                                }
                                .buttonStyle(.plain)
                                NavigationLink { AnnotationToolbarView(presentation: presentation) } label: {
                                    overlayToggleLabel("square.and.pencil", "Annotations", false)
                                }
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening annotations")
                                })
                                Button {
                                    showBall.toggle()
                                    toast = .success(showBall ? "Basketball marker on" : "Basketball marker off")
                                } label: {
                                    overlayToggleLabel("basketball", "Basketball", showBall)
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 14)
                            TappablePhaseStrip(active: displayPhase) { selected in
                                phase = selected
                                toast = .success("\(selected.capitalized) selected",
                                                 "Video overlay moved to this shot phase.")
                            }
                            .padding(.top, 16)
                            HStack(spacing: 10) {
                                Button {
                                    guard frame > 0 else {
                                        toast = .info("First frame selected",
                                                      "Use Next or the scrubber to move forward.")
                                        return
                                    }
                                    frame = max(0, frame - 1)
                                    toast = .success("Frame \(frameNumber) selected")
                                } label: {
                                    VStack(spacing: 2) {
                                        HStack(spacing: 4) {
                                            Image(systemName: "chevron.left").font(.system(size: 11, weight: .semibold))
                                            Text("Previous").shotiqBody(13, weight: .semibold)
                                        }
                                        Text(frame > 0 ? "Frame \(frameNumber - 1)" : "First frame")
                                            .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    .foregroundStyle(ShotIQColor.ink)
                                    .frame(width: 78, height: 56)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .buttonStyle(.plain)
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
                                        Button {
                                            frame = min(9, max(0, frame + Double(i - 2)))
                                            toast = .success("Frame \(frameNumber) selected")
                                        } label: {
                                            frameStripThumbnail(index: i)
                                                .overlay(RoundedRectangle(cornerRadius: 4)
                                                    .stroke(i == 2 ? ShotIQColor.shotiqOrange : .clear, lineWidth: 2))
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                Button {
                                    guard frame < 9 else {
                                        toast = .info("Last frame selected",
                                                      "Use Previous or the scrubber to move back.")
                                        return
                                    }
                                    frame = min(9, frame + 1)
                                    toast = .success("Frame \(frameNumber) selected")
                                } label: {
                                    VStack(spacing: 2) {
                                        HStack(spacing: 4) {
                                            Text("Next").shotiqBody(13, weight: .semibold)
                                            Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold))
                                        }
                                        Text(frame < 9 ? "Frame \(frameNumber + 1)" : "Last frame")
                                            .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    .foregroundStyle(ShotIQColor.ink)
                                    .frame(width: 78, height: 56)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 14)
                            Slider(value: $frame, in: 0...9, step: 1).padding(.top, 6)
                            HStack(alignment: .center, spacing: 0) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("FORM SCORE").shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(spacing: 6) {
                                        Text(presentation.scoreText).font(.custom("Tungsten-Medium", size: 30))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: presentation.scorePct).frame(width: 34)
                                    }
                                    Text(presentation.scoreVerdict).font(.custom("Tungsten-Medium", size: 13))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                }
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                frameSummaryBlock(value: presentation.elbowAngleText, label: "ELBOW")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                frameSummaryBlock(value: presentation.releaseOffsetText, label: "OFFSET")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                frameSummaryBlock(value: presentation.wristAngleText, label: "WRIST")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                NavigationLink { FlawsOverviewView(presentation: presentation) } label: {
                                    HStack(spacing: 0) {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("TARGET").shotiqBody(9, weight: .semibold).kerning(0.5)
                                                .foregroundStyle(ShotIQColor.graphite)
                                            Text(presentation.coachingTarget)
                                                .shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(2).minimumScaleFactor(0.7)
                                        }
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening coaching target")
                                })
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 14)
                            PrimaryButton(title: showAngles ? "Hide joint angles" : "Show joint angles", icon: "angle") {
                                withAnimation(.easeInOut(duration: 0.15)) {
                                    showAngles.toggle()
                                    if showAngles { showJoints = true }
                                }
                                toast = .success(showAngles ? "Joint angles shown" : "Joint angles hidden")
                            }
                            .padding(.top, 16)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .shotiqToast($toast)
        .onAppear {
            guard !isCanonicalDemo, presentation.phaseText != "Unavailable" else { return }
            phase = presentation.phaseText.uppercased()
        }
    }
    private func frameSummaryBlock(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.custom("Tungsten-Medium", size: 24))
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(9, weight: .semibold).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }
    @ViewBuilder
    private func frameStripThumbnail(index: Int) -> some View {
        if !isCanonicalDemo, let url = presentation.videoURL {
            ShotIQVideoStillThumbnail(url: url,
                                      seconds: stripFrameSeconds(index),
                                      height: 38,
                                      cornerRadius: 4)
        } else {
            CanonicalPhoto(frameThumbs[index], height: 38, cornerRadius: 4)
        }
    }
    private func stripFrameSeconds(_ index: Int) -> Double {
        let frames = presentation.videoPoseFrames.sorted { $0.frameIndex < $1.frameIndex }
        guard !frames.isEmpty else { return Double(index) * 0.25 }
        let fraction = Double(index) / Double(max(frameThumbs.count - 1, 1))
        let resolvedIndex = Int((fraction * Double(frames.count - 1)).rounded())
        return frames[min(max(resolvedIndex, 0), frames.count - 1)].timestampSeconds
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
    var presentation: AnalysisResultPresentation = .canonicalDemo

    private struct StoredPoint: Codable {
        var x: Double
        var y: Double

        init(_ point: CGPoint) {
            x = Double(point.x)
            y = Double(point.y)
        }

        var point: CGPoint { CGPoint(x: x, y: y) }
    }

    private struct Annotation: Identifiable, Codable {
        var id = UUID()
        let tool: String
        var points: [StoredPoint]
    }
    @Environment(\.dismiss) private var dismiss
    @AppStorage("shotiq.annotations.frame43.v1") private var savedAnnotationPayload = ""
    @State private var tool = "Draw"
    @State private var annotations: [Annotation] = []
    @State private var redoStack: [Annotation] = []
    @State private var current: Annotation?
    @State private var playing = true
    @State private var frameTime = 1.28
    @State private var showSaved = false
    @State private var toast: ShotIQToast?
    @State private var exportedImage: UIImage?
    @State private var copiedSummary = false
    @State private var showWalkthrough = false
    private let tools: [(String, String)] = [
        ("Draw", "scribble"), ("Arrow", "arrow.up.right"), ("Angle", "angle"),
        ("Label", "textformat"), ("Undo", "arrow.uturn.backward"),
        ("Redo", "arrow.uturn.forward"), ("Clear", "trash"),
    ]
    private var annotationStatusText: String {
        "\(annotations.count) annotation\(annotations.count == 1 ? "" : "s") on frame 43"
    }
    private var annotationShareSummary: String {
        "ShotIQ annotated release frame 43: \(annotations.count) annotation\(annotations.count == 1 ? "" : "s") on \(presentation.coachingTarget)."
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-annotation-toolbar") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Button {
                                toast = .info("Returning to frame detail")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                            } label: {
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
	                        PlayerHeader(name: presentation.id == "canonical-demo" ? "Jordan Ellis" : "Saved Analysis",
                                         subtitle: presentation.id == "canonical-demo" ? "Right-handed • Advanced" : presentation.recordedLabel)
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(spacing: 0) {
                                annotStat("FORM SCORE", presentation.scoreText)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                annotStat("PHASE", presentation.phaseText.uppercased())
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                annotStat("MEDIA", presentation.mediaLabel.uppercased())
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                annotStat("SOURCE", presentation.provenanceSummary)
                            }
                            .padding(.top, 4)
                            HStack(spacing: 12) {
                                CorrectionGlyph(kind: .stack, size: 34).foregroundStyle(ShotIQColor.ink)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("PRIMARY TARGET").shotiqBody(11, weight: .semibold).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(presentation.coachingTarget)
                                        .shotiqBody(15).foregroundStyle(ShotIQColor.shotiqOrange)
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(.horizontal, 14).padding(.vertical, 9)
                            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            .padding(.top, 8)
                            ZStack(alignment: .topLeading) {
                                ZStack {
                                    // At 430pt this frame alone overran the fold and left the
                                    // ANNOTATION TOOLS palette and the Save CTA — the entire
                                    // point of this screen — unreachable in a screenshot. The
                                    // frame, the chrome above it, the palette and the CTA all
                                    // have to share the ~686pt between the notch and the tab
                                    // bar, so the frame is sized to what is left once the
                                    // other three are placed; canonical shows all four at once.
                                    annotationMediaSurface
                                    annotationCanvas
                                }
                                .contentShape(Rectangle())
                                .gesture(annotationGesture)
                                .accessibilityElement(children: .ignore)
                                .accessibilityLabel("Annotation drawing canvas")
                                .accessibilityIdentifier("annotation-canvas")
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
                                    .accessibilityIdentifier("annotation-frame-time")
                                    .padding(.horizontal, 12).padding(.vertical, 7)
                                    .background(.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 8))
                                    .padding(12)
                            }
                            .overlay(alignment: .bottomTrailing) {
                                HStack(spacing: 18) {
                                    Button {
                                        frameTime = max(0, frameTime - 0.04)
                                        toast = .info("Frame stepped back", String(format: "00:%05.2f", frameTime))
                                    } label: {
                                        Image(systemName: "backward.end.fill")
                                    }
                                    .accessibilityLabel("Step back annotation frame")
                                    .accessibilityIdentifier("annotation-step-back")
                                    Button {
                                        playing.toggle()
                                        toast = .info(playing ? "Annotation playback started" : "Annotation playback paused")
                                    } label: {
                                        Image(systemName: playing ? "pause.fill" : "play.fill")
                                    }
                                    .accessibilityLabel(playing ? "Pause annotation playback" : "Play annotation playback")
                                    .accessibilityIdentifier("annotation-play-pause")
                                    Button {
                                        frameTime += 0.04
                                        toast = .info("Frame stepped forward", String(format: "00:%05.2f", frameTime))
                                    } label: {
                                        Image(systemName: "forward.end.fill")
                                    }
                                    .accessibilityLabel("Step forward annotation frame")
                                    .accessibilityIdentifier("annotation-step-forward")
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
                            Text(annotationStatusText)
                                .shotiqBody(12, weight: .semibold).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                                .accessibilityIdentifier("annotation-count")
                                .padding(.top, 8)
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
                                    .accessibilityIdentifier("annotation-tool-\(name.lowercased())")
                                }
                            }
                            .padding(.top, 8)
                            PrimaryButton(title: "Save annotations", color: ShotIQColor.confirmGreen) {
                                saveAnnotations()
                            }
                            .padding(.top, 12)
                            .alert("Annotations saved", isPresented: $showSaved) {
                                Button("OK", role: .cancel) {}
                            } message: {
                                Text("\(annotations.count) annotation\(annotations.count == 1 ? "" : "s") saved to frame 43.")
                            }
                            HStack(spacing: 8) {
                                Button { playWalkthrough() } label: {
                                    annotationAction("play.circle", "Walkthrough", ShotIQColor.analysisBlue)
                                }
                                .buttonStyle(.plain)
                                .accessibilityIdentifier("annotation-play-walkthrough")
                                Button { exportAnnotationImage() } label: {
                                    annotationAction("arrow.down.to.line", "Export image", ShotIQColor.confirmGreen)
                                }
                                .buttonStyle(.plain)
                                .accessibilityIdentifier("annotation-export-image")
                                Button { shareAnnotationImage() } label: {
                                    annotationAction("square.and.arrow.up", "Share image", ShotIQColor.shotiqOrange)
                                }
                                .buttonStyle(.plain)
                                .accessibilityIdentifier("annotation-share-image")
                                Button { copyAnnotationSummary() } label: {
                                    annotationAction(copiedSummary ? "checkmark" : "square.on.square",
                                                     copiedSummary ? "Copied" : "Copy summary",
                                                     ShotIQColor.ink)
                                }
                                .buttonStyle(.plain)
                                .accessibilityIdentifier("annotation-copy-summary")
                            }
                            .padding(.top, 10)
                            Spacer(minLength: 12)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .onAppear(perform: restoreAnnotations)
        .fullScreenCover(isPresented: $showWalkthrough) {
            AnnotationWalkthroughSheet(annotations: annotations,
                                       presentation: presentation,
                                       onClose: { showWalkthrough = false })
        }
        .shotiqToast($toast)
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
            if let last = annotations.popLast() {
                redoStack.append(last)
                toast = .info("Annotation undone", annotationStatusText)
            } else {
                toast = .info("Nothing to undo", "Draw on the frame before using undo.")
            }
        case "Redo":
            if let next = redoStack.popLast() {
                annotations.append(next)
                toast = .success("Annotation restored", annotationStatusText)
            } else {
                toast = .info("Nothing to redo", "Undo a mark before using redo.")
            }
        case "Clear":
            guard annotations.isEmpty == false else {
                toast = .info("No annotations yet", "Draw on the frame before clearing marks.")
                return
            }
            annotations.removeAll()
            redoStack.removeAll()
            toast = .info("Annotations cleared", "Frame 43 is clean.")
        default:
            tool = name
            toast = .info("\(name) tool selected", "Drag on the frame to mark it up.")
        }
    }
    private var annotationGesture: some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { v in
                if current == nil {
                    current = Annotation(tool: tool, points: [StoredPoint(v.startLocation), StoredPoint(v.location)])
                } else if tool == "Draw" {
                    current?.points.append(StoredPoint(v.location))
                } else {
                    current?.points[current!.points.count - 1] = StoredPoint(v.location)
                }
            }
            .onEnded { _ in
                if let done = current {
                    annotations.append(done)
                    redoStack.removeAll()
                    toast = .success("\(done.tool) added", annotationStatusText)
                }
                current = nil
            }
    }
    private var annotationCanvas: some View {
        Canvas { ctx, _ in
            for a in annotations + (current.map { [$0] } ?? []) {
                AnnotationExportRenderer.draw(a, in: &ctx)
            }
        }
        .allowsHitTesting(false)
    }
    private func saveAnnotations() {
        toast = .progress("Saving annotations", "Storing frame 43 markup on this device.", progress: 0.7)
        if let data = try? JSONEncoder().encode(annotations),
           let text = String(data: data, encoding: .utf8) {
            savedAnnotationPayload = text
        }
        toast = .success("Annotations saved", "\(annotations.count) mark\(annotations.count == 1 ? "" : "s") saved to frame 43.")
        showSaved = true
    }
    @MainActor private func exportAnnotationImage() {
        guard !annotations.isEmpty else {
            toast = .error("Add annotation first", "Draw on the frame before exporting.")
            return
        }
        if let image = AnnotationExportRenderer.render(annotations: annotations,
                                                       presentation: presentation) {
            exportedImage = image
            toast = .success("Export ready", "Annotated frame image prepared.")
        } else {
            toast = .error("Export unavailable", "Could not render this annotated frame.")
        }
    }
    @MainActor private func shareAnnotationImage() {
        guard !annotations.isEmpty else {
            toast = .error("Add annotation first", "Draw on the frame before sharing.")
            return
        }
        let image = exportedImage ?? AnnotationExportRenderer.render(annotations: annotations,
                                                                     presentation: presentation)
        guard let image else {
            toast = .error("Share unavailable", "Could not render this annotated frame.")
            return
        }
        exportedImage = image
        toast = .success("Opening share sheet", "Annotated frame image prepared.")
        ShotIQSharePresenter.share([image, annotationShareSummary])
    }
    private func copyAnnotationSummary() {
        UIPasteboard.general.string = annotationShareSummary
        copiedSummary = true
        toast = .success("Summary copied", "Frame 43 annotation notes copied.")
        Task {
            try? await Task.sleep(for: .seconds(2))
            await MainActor.run { copiedSummary = false }
        }
    }
    private func playWalkthrough() {
        guard !annotations.isEmpty else {
            toast = .error("Add annotation first", "Draw on the frame before playing the walkthrough.")
            return
        }
        toast = .info("Opening walkthrough", "Playing annotation focus, body pan, and final skeleton.")
        showWalkthrough = true
    }
    private func restoreAnnotations() {
        guard let data = savedAnnotationPayload.data(using: .utf8),
              let stored = try? JSONDecoder().decode([Annotation].self, from: data) else { return }
        annotations = stored
        redoStack = []
        current = nil
    }
    private var annotationMediaSurface: some View {
        Group {
            if presentation.id == "canonical-demo" {
                CanonicalMediaSurface(key: "043-visual-001", height: 175)
            } else {
                FrameDetailMediaSurface(presentation: presentation,
                                        fallbackKey: "043-visual-001",
                                        height: 175,
                                        showSkeleton: true,
                                        showJoints: true,
                                        showBall: false,
                                        showAngles: tool == "Angle")
            }
        }
        .accessibilityIdentifier(presentation.id == "canonical-demo" ? "annotation-canonical-media" : "annotation-real-media")
    }
    private func annotationAction(_ icon: String, _ label: String, _ tint: Color) -> some View {
        VStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 15, weight: .semibold))
            Text(label).shotiqBody(10, weight: .semibold)
                .lineLimit(1).minimumScaleFactor(0.65)
        }
        .foregroundStyle(tint)
        .frame(maxWidth: .infinity).frame(height: 46)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    private struct AnnotationExportRenderer {
        @MainActor
        static func render(annotations: [Annotation],
                           presentation: AnalysisResultPresentation) -> UIImage? {
            let renderer = ImageRenderer(content: AnnotationExportCard(annotations: annotations,
                                                                       presentation: presentation))
            renderer.scale = 3
            return renderer.uiImage
        }

        static func draw(_ a: Annotation, in ctx: inout GraphicsContext) {
            let points = a.points.map(\.point)
            guard let first = points.first else { return }
            let last = points.last ?? first
            let color = ShotIQColor.shotiqOrange
            switch a.tool {
            case "Draw":
                var p = Path()
                p.move(to: first)
                points.dropFirst().forEach { p.addLine(to: $0) }
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
            default:
                ctx.draw(Text("NOTE").font(.custom(shotiqBoxedFace(.bold), size: 11)).foregroundColor(.white),
                         at: last)
                ctx.stroke(Path(roundedRect: CGRect(x: last.x - 24, y: last.y - 12, width: 48, height: 24), cornerRadius: 5),
                           with: .color(color), lineWidth: 1.5)
            }
        }
    }
    private struct AnnotationExportCard: View {
        let annotations: [Annotation]
        let presentation: AnalysisResultPresentation

        var body: some View {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Wordmark(size: 28)
                    Spacer()
                    Text("ANNOTATED FRAME 43").shotiqBody(12, weight: .bold).kerning(0.6)
                        .foregroundStyle(ShotIQColor.graphite)
                }
	                ZStack {
                        AnnotationExportMedia(presentation: presentation)
                            .frame(width: 390, height: 175)
                            .clipped()
	                    Canvas { ctx, _ in
                        for annotation in annotations {
                            AnnotationExportRenderer.draw(annotation, in: &ctx)
                        }
                    }
                    .frame(width: 390, height: 175)
                }
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                HStack(spacing: 10) {
                    CorrectionGlyph(kind: .stack, size: 32).foregroundStyle(ShotIQColor.ink)
	                    VStack(alignment: .leading, spacing: 3) {
	                        Text("PRIMARY TARGET").shotiqBody(10, weight: .semibold).kerning(0.6)
	                            .foregroundStyle(ShotIQColor.graphite)
	                        Text(presentation.coachingTarget)
	                            .shotiqBody(15, weight: .bold).foregroundStyle(ShotIQColor.ink)
                                .lineLimit(1).minimumScaleFactor(0.7)
	                    }
                    Spacer()
                    Text("\(annotations.count)")
                        .font(.custom("Tungsten-Medium", size: 34))
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                    Text("MARKS").shotiqBody(10, weight: .semibold).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite)
                }
            }
            .padding(20)
            .frame(width: 430, height: 320, alignment: .topLeading)
            .background(Color.white)
        }
    }
    private struct AnnotationExportMedia: View {
        let presentation: AnalysisResultPresentation

        private var overlayFrame: VideoPoseFrameRecord? {
            if let frame = presentation.releaseVideoPoseFrame ?? presentation.videoPoseFrames.sorted(by: { $0.frameIndex < $1.frameIndex }).first,
               frame.detectedPose != nil {
                return frame
            }
            if let pose = presentation.displayPose {
                return VideoPoseAnalyzer.frameRecord(index: 0, timestamp: 0, pose: pose)
            }
            return nil
        }

        var body: some View {
            ZStack {
                if presentation.id == "canonical-demo" {
                    Image("043-visual-001").resizable().scaledToFill()
                } else if let url = presentation.mediaURL,
                          url.isFileURL,
                          let image = UIImage(contentsOfFile: url.path) {
                    Image(uiImage: image).resizable().scaledToFill()
                    if let frame = overlayFrame, let pose = frame.detectedPose {
                        ShotIQVideoAnalysisOverlay(frame: frame,
                                                   pose: pose,
                                                   presentation: presentation,
                                                   showSkeleton: true,
                                                   showJoints: true,
                                                   showBall: false,
                                                   showAnnotations: true,
                                                   displayPhase: frame.phaseLabel)
                    }
                } else {
                    Image("043-visual-001").resizable().scaledToFill()
                }
            }
        }
    }
    private struct AnnotationWalkthroughSheet: View {
        let annotations: [Annotation]
        let presentation: AnalysisResultPresentation
        let onClose: () -> Void
        @State private var isPlaying = true
        @State private var step = 0

        private var totalSteps: Int { max(annotations.count * 3 + 1, 1) }
        private var progress: Double { totalSteps <= 1 ? 1 : Double(step) / Double(totalSteps - 1) }
        private var activeAnnotation: Annotation? {
            guard !annotations.isEmpty, step < annotations.count * 3 else { return nil }
            return annotations[min(step / 3, annotations.count - 1)]
        }
        private var phaseText: String {
            guard activeAnnotation != nil else { return "FULL SKELETON VIEW" }
            switch step % 3 {
            case 0: return "ANNOTATION FOCUS"
            case 1: return "MOVING TO BODY PART"
            default: return "BODY POSITION HOLD"
            }
        }

        var body: some View {
            ZStack {
                ShotIQColor.ink.ignoresSafeArea()
                VStack(spacing: 0) {
                    HStack {
                        Button {
                            onClose()
                        } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 40, height: 40)
                        }
                        .buttonStyle(.plain)
                        Spacer()
                        Text("ANNOTATION WALKTHROUGH")
                            .shotiqBody(14, weight: .bold)
                            .kerning(0.8)
                            .foregroundStyle(.white)
                        Spacer()
                        Text("\(Int((progress * 100).rounded()))%")
                            .font(.custom("Tungsten-Medium", size: 24))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .frame(width: 40)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    ZStack {
                        walkthroughMedia
                            .frame(width: 390, height: 260)
                            .scaleEffect(scale)
                            .offset(offset)
                            .animation(.easeInOut(duration: 0.35), value: step)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 430)
                    .clipped()
                    .background(.black)
                    .overlay(alignment: .topLeading) {
                        Text(phaseText)
                            .shotiqBody(12, weight: .bold)
                            .kerning(0.6)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 8))
                            .padding(16)
                    }
                    .overlay(alignment: .bottom) {
                        ProgressView(value: progress)
                            .tint(ShotIQColor.shotiqOrange)
                            .padding(.horizontal, 24)
                            .padding(.bottom, 14)
                    }
                    VStack(alignment: .leading, spacing: 10) {
                        Text(activeAnnotation?.tool.uppercased() ?? "FINAL SKELETON")
                            .font(.custom("Tungsten-Medium", size: 34))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        Text(presentation.coachingTarget)
                            .shotiqBody(16, weight: .semibold)
                            .foregroundStyle(.white)
                            .fixedSize(horizontal: false, vertical: true)
                        HStack(spacing: 12) {
                            Button { restart() } label: {
                                walkthroughButton("arrow.counterclockwise", "Restart")
                            }
                            Button {
                                isPlaying.toggle()
                            } label: {
                                walkthroughButton(isPlaying ? "pause.fill" : "play.fill",
                                                  isPlaying ? "Pause" : "Play")
                            }
                            Button { stepForward() } label: {
                                walkthroughButton("forward.end.fill", "Next")
                            }
                        }
                        .padding(.top, 8)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(20)
                    Spacer()
                }
            }
            .task(id: isPlaying) {
                while isPlaying {
                    try? await Task.sleep(for: .milliseconds(1500))
                    guard isPlaying else { break }
                    await MainActor.run { stepForward() }
                }
            }
        }

        private var walkthroughMedia: some View {
            ZStack {
                if presentation.id == "canonical-demo" {
                    AnnotationExportMedia(presentation: presentation)
                } else {
                    FrameDetailMediaSurface(presentation: presentation,
                                            fallbackKey: "043-visual-001",
                                            height: 260,
                                            showSkeleton: true,
                                            showJoints: true,
                                            showBall: false,
                                            showAngles: false)
                }
                Canvas { ctx, _ in
                    for annotation in annotations {
                        AnnotationExportRenderer.draw(annotation, in: &ctx)
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }

        private var scale: CGFloat {
            activeAnnotation == nil ? 1 : 2.2
        }

        private var offset: CGSize {
            guard let annotation = activeAnnotation else { return .zero }
            let points = annotation.points.map(\.point)
            let target = (step % 3 == 0 ? points.first : points.last) ?? CGPoint(x: 195, y: 130)
            return CGSize(width: 195 - target.x * scale,
                          height: 215 - target.y * scale)
        }

        private func stepForward() {
            if step + 1 >= totalSteps {
                isPlaying = false
                step = 0
            } else {
                step += 1
            }
        }

        private func restart() {
            step = 0
            isPlaying = true
        }

        private func walkthroughButton(_ icon: String, _ label: String) -> some View {
            HStack(spacing: 8) {
                Image(systemName: icon)
                Text(label).shotiqBody(14, weight: .semibold)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(.white.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(.white.opacity(0.18)))
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
    @State private var toast: ShotIQToast?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-form-score") {
            VStack(spacing: 0) {
                AnalysisTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            HStack {
                                Button {
                                    toast = .info("Returning to analysis overview")
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                                } label: {
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
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening share sheet", "Form score summary is ready.")
                                })
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
        .shotiqToast($toast)
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
    @State private var toast: ShotIQToast?
    var body: some View {
        CanonicalScreen(testID: "screen-ios-metric-detail") {
            VStack(spacing: 0) {
                HStack {
                    Button {
                        toast = .info("Returning to form score")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                    } label: {
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
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening share sheet", "\(metric) detail is ready.")
                    })
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
                                if presentation.id != "canonical-demo",
                                   presentation.mediaURL != nil || presentation.videoURL != nil {
                                    FrameDetailMediaSurface(presentation: presentation,
                                                            fallbackKey: "045-visual-001",
                                                            height: 268,
                                                            showSkeleton: true,
                                                            showJoints: true,
                                                            showBall: false,
                                                            showAngles: false)
                                        .frame(maxWidth: .infinity)
                                } else {
                                    // Canonical 045 already has the pose skeleton
                                    // and angle callout baked into this crop.
                                    CanonicalPhoto("045-visual-001", height: 268)
                                        .frame(maxWidth: .infinity)
                                }
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
                                NavigationLink { FrameDetailSkeletonView(presentation: presentation) } label: {
                                    detailRow("film", "View frame", "See this rep at release")
                                }
                                .buttonStyle(.plain)
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening frame detail", metric)
                                })
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                NavigationLink { EliteMatchView(presentation: presentation) } label: {
                                    detailRow("point.bottomleft.forward.to.point.topright.scurvepath", "Compare elite range", "See how you stack up")
                                }
                                .buttonStyle(.plain)
                                .simultaneousGesture(TapGesture().onEnded {
                                    toast = .info("Opening elite comparison", metric)
                                })
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
        .shotiqToast($toast)
    }
    /// "Training plan" maps to the web app's saved workouts (POST /api/saved-workouts).
    private func addToTrainingPlan() {
        guard !addingPlan, !addedPlan else { return }
        addingPlan = true
        planError = nil
        toast = .progress("Adding to training plan", "\(metric) correction plan is saving.", progress: 0.65)
        Task {
            struct Body: Encodable { let name: String; let drillCount: Int; let drillIds: [String] }
            struct Resp: Decodable { let success: Bool }
            do {
                let _: Resp = try await APIClient.shared.call(
                    "/api/saved-workouts", method: "POST",
                    body: Body(name: "\(metric) correction plan", drillCount: 1,
                               drillIds: ["towel-elbow-stack"]))
                addedPlan = true
                toast = .success("Added to training plan", "\(metric) correction plan is ready.")
            } catch {
                planError = "Couldn't add to your training plan. Check your connection and try again."
                toast = .error("Plan save failed", "Check your connection and try again.")
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
            ShotIQConceptGlyph(concept: label, fallback: "circle.dashed", size: 34)
                .foregroundStyle(ShotIQColor.ink)
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(tint)
            Text(label).shotiqBody(7, weight: .semibold).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
    }
    private func detailRow(_ icon: String, _ title: String, _ sub: String) -> some View {
        HStack(spacing: 14) {
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 30)
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
    var presentation: AnalysisResultPresentation = .canonicalDemo
    @EnvironmentObject private var app: AppState
    private var activePresentation: AnalysisResultPresentation {
        guard !UITestHooks.active else { return presentation }
        let latest = app.recentMedia.first.map { AnalysisResultPresentation(result: $0.analysis) }
        if presentation.id == "canonical-demo" || presentation.id == AnalysisResultPresentation.noResult.id {
            return latest ?? presentation
        }
        if presentation.mediaURL == nil,
           presentation.videoURL == nil,
           let latest {
            return latest
        }
        return presentation
    }
    private var flaws: [AnalysisFlawItem] { activePresentation.flaws }
    @Environment(\.dismiss) private var dismiss
    @State private var addingAll = false
    @State private var addedAll = false
    @State private var addAllError: String?
    @State private var selectedFlaw: AnalysisFlawItem?
    @State private var toast: ShotIQToast?
    var body: some View {
        let p = activePresentation
        let currentFlaws = p.flaws
        CanonicalScreen(testID: "screen-ios-flaws-overview") {
            GeometryReader { proxy in
                VStack(spacing: 0) {
                    AnalysisTopBar()
                    ScrollView {
                        VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .center, spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Button {
                                    toast = .info("Returning to analysis overview")
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                                } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
                                        Text("ANALYSIS").shotiqBody(12, weight: .semibold).kerning(0.8)
                                    }
                                    .foregroundStyle(ShotIQColor.graphite)
                                }
                                .buttonStyle(.plain)
                                Text("FLAWS OVERVIEW").shotiqDisplay(32)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.72)
                            }
                            .layoutPriority(1)
                            Spacer(minLength: 8)
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                                .frame(width: 50)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                .frame(width: 50)
                        }
                        .padding(.top, 14)
                        NavigationLink {
                            FlawDetailView(title: currentFlaws.first?.title ?? p.coachingTarget,
                                           severity: currentFlaws.first?.impact ?? "NO PRIORITY FLAW",
                                           flaw: currentFlaws.first,
                                           presentation: p)
                        } label: {
                            CoachTargetCard(bordered: false, title: p.coachingTarget)
                                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening top flaw", currentFlaws.first?.title ?? p.coachingTarget)
                        })
                        .padding(.top, 14)
                        Text(summaryText(for: p))
                            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 14)
                        if currentFlaws.isEmpty {
                            ShotIQCard {
                                HStack(spacing: 12) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "checkmark.circle"),
                                                             size: 26,
                                                             label: nil)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("NO PRIORITY FLAWS DETECTED")
                                            .shotiqDisplay(20)
                                        Text("Saved measurements are inside the current ShotIQ target bands.")
                                            .shotiqBody(13)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(14)
                            }
                            .padding(.top, 12)
                        } else {
                            ForEach(currentFlaws) { flaw in
                                Button {
                                    toast = .info("Opening flaw detail", flaw.title)
                                    selectedFlaw = flaw
                                } label: {
                                    flawCard(flaw, presentation: p)
                                }
                                .accessibilityElement(children: .combine)
                                .accessibilityLabel("\(flaw.title), \(flaw.impact), \(flaw.cta)")
                                .accessibilityIdentifier(flaw.cta)
                                .buttonStyle(.plain)
                                .padding(.top, 12)
                            }
                        }
                        if !currentFlaws.isEmpty {
                            HStack(spacing: 12) {
                                ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-training-goal",
                                                         size: 24,
                                                         label: nil)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Add all \(flaws.count) flaws to your training plan")
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
                        }
                        if let addAllError {
                            Text(addAllError).shotiqBody(12).foregroundStyle(ShotIQColor.reviewRed)
                                .padding(.top, 6)
                        }
                        Spacer(minLength: 24)
                    }
                        .padding(.horizontal, 20)
                        .frame(width: proxy.size.width, alignment: .leading)
                    }
                }
                .frame(width: proxy.size.width, alignment: .topLeading)
                .clipped()
            }
        }
        .navigationDestination(item: $selectedFlaw) { flaw in
            FlawDetailView(title: flaw.title, severity: flaw.impact,
                           flaw: flaw, presentation: activePresentation)
        }
        .shotiqToast($toast)
    }
    /// "Training plan" maps to the web app's saved workouts (POST /api/saved-workouts).
    private func addAllToPlan() {
        guard !addingAll, !addedAll else { return }
        addingAll = true
        addAllError = nil
        toast = .progress("Adding flaws to plan", "Saving \(flaws.count) correction target\(flaws.count == 1 ? "" : "s").", progress: 0.65)
        Task {
            struct Body: Encodable { let name: String; let drillCount: Int; let drillIds: [String] }
            struct Resp: Decodable { let success: Bool }
            do {
                let _: Resp = try await APIClient.shared.call(
                    "/api/saved-workouts", method: "POST",
                    body: Body(name: "Flaw correction plan", drillCount: flaws.count,
                               drillIds: flaws.map { $0.title.lowercased().replacingOccurrences(of: " ", with: "-") }))
                addedAll = true
                toast = .success("Added to training plan", "\(flaws.count) flaw correction target\(flaws.count == 1 ? "" : "s") saved.")
            } catch {
                addAllError = "Couldn't add flaws to your plan. Check your connection and try again."
                toast = .error("Plan save failed", "Check your connection and try again.")
            }
            addingAll = false
        }
    }
    private func summaryText(for presentation: AnalysisResultPresentation) -> String {
        let currentFlaws = presentation.flaws
        if currentFlaws.isEmpty {
            return presentation.id == AnalysisResultPresentation.noResult.id
                ? "No saved analysis is loaded yet."
                : "AI analysis detected no priority flaws from the saved measurements."
        }
        return "AI analysis detected \(currentFlaws.count) priority flaw\(currentFlaws.count == 1 ? "" : "s") impacting your shot efficiency."
    }
    private func tint(for flaw: AnalysisFlawItem) -> Color {
        switch flaw.impact {
        case "HIGH IMPACT": return ShotIQColor.reviewRed
        case "MEDIUM IMPACT": return ShotIQColor.shotiqOrange
        default: return ShotIQColor.muted
        }
    }
    private func flawCard(_ flaw: AnalysisFlawItem,
                          presentation: AnalysisResultPresentation) -> some View {
        let tint = tint(for: flaw)
        return ShotIQCard {
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top, spacing: 10) {
                        RoundedRectangle(cornerRadius: 5).fill(tint).frame(width: 26, height: 26)
                            .overlay(Text("\(flaw.rank)").shotiqBody(14, weight: .bold).foregroundStyle(.white))
                        VStack(alignment: .leading, spacing: 5) {
                            Text(flaw.title).shotiqDisplay(21)
                                .lineLimit(2)
                                .minimumScaleFactor(0.72)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            Text(flaw.impact).shotiqBody(9, weight: .bold).kerning(0.3)
                                .foregroundStyle(tint)
                                .padding(.horizontal, 7).padding(.vertical, 4)
                                .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                                .lineLimit(1).minimumScaleFactor(0.6)
                        }
                    }
                    Text(flaw.description).shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(.leading)
                        .padding(.top, 8)
                    Text("AFFECTED PHASES").shotiqBody(9, weight: .semibold).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 12)
                    FlawCompactPhaseStrip(active: flaw.phase)
                        .frame(height: 46)
                        .padding(.top, 4)
                    Text("TREND (LAST 6 SESSIONS)").shotiqBody(9, weight: .semibold).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 8)
                    TrendLine(points: [52, 74, 78, 50, 64, 48, Double(Int(flaw.trendEnd) ?? 60)], stroke: tint,
                              areaFill: true, gridlines: true, endBadge: flaw.trendEnd)
                        .frame(height: 40).padding(.top, 4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .layoutPriority(1)
                VStack(alignment: .leading, spacing: 8) {
                    Text("CONFIDENCE").shotiqBody(9, weight: .semibold).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite)
                    HStack(spacing: 8) {
                        Text(flaw.confidence).font(.custom("Tungsten-Medium", size: 24)).foregroundStyle(ShotIQColor.ink)
                        TrendLine(points: [40, 55, 48, 62, 58, 74], stroke: tint).frame(width: 54, height: 20)
                    }
                    FlawEvidenceThumbnail(presentation: presentation,
                                          phase: flaw.phase,
                                          tint: tint,
                                          width: 108,
                                          height: 108)
                    HStack(spacing: 5) {
                        Text(flaw.cta).shotiqBody(12, weight: .semibold)
                            .lineLimit(1).minimumScaleFactor(0.7)
                        Image(systemName: "chevron.right").font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundStyle(flaw.rank == 1 ? .white : ShotIQColor.ink)
                    .frame(width: 108, height: 40)
                    .background(flaw.rank == 1 ? ShotIQColor.shotiqOrange : .clear,
                                in: RoundedRectangle(cornerRadius: 6))
                    .overlay(RoundedRectangle(cornerRadius: 6)
                        .stroke(flaw.rank == 1 ? .clear : ShotIQColor.rule))
                }
                .frame(width: 108, alignment: .leading)
            }
            .padding(14)
        }
    }
}

fileprivate struct FlawEvidenceThumbnail: View {
    var presentation: AnalysisResultPresentation
    var phase: String
    var tint: Color
    var width: CGFloat
    var height: CGFloat

    private var hasRealMedia: Bool {
        presentation.id != "canonical-demo" &&
        (presentation.mediaURL != nil || presentation.videoURL != nil)
    }

    var body: some View {
        Group {
            if hasRealMedia {
                FrameDetailMediaSurface(presentation: presentation,
                                        fallbackKey: "047-visual-001",
                                        height: height,
                                        phase: phase,
                                        showSkeleton: true,
                                        showJoints: true,
                                        showBall: false,
                                        showAngles: false)
            } else {
                CanonicalPhoto(presentation.id == "canonical-demo" ? "046-visual-001" : "047-visual-001",
                               height: height,
                               cornerRadius: 4)
                    .overlay(SkeletonOverlay().opacity(0.72))
            }
        }
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: 4))
        .overlay(RoundedRectangle(cornerRadius: 4).stroke(tint.opacity(0.28), lineWidth: 1))
        .accessibilityIdentifier(hasRealMedia ? "flaws-real-media-evidence" : "flaws-demo-evidence")
    }
}

fileprivate struct FlawCompactPhaseStrip: View {
    var active: String

    var body: some View {
        HStack(alignment: .top, spacing: 2) {
            ForEach(ShotPhase.allCases, id: \.self) { phase in
                let on = ShotPhase(label: active) == phase
                VStack(spacing: 3) {
                    PhaseGlyph(phase: phase, active: on, size: 28)
                    Text(phase.title)
                        .font(.custom(shotiqTungstenFace(on ? .bold : .medium), size: 7))
                        .kerning(0.15)
                        .foregroundStyle(on ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    Rectangle()
                        .fill(on ? ShotIQColor.shotiqOrange : .clear)
                        .frame(width: 22, height: 2)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }
}

struct FlawDetailView: View {       // 047
    struct DetailContent {
        let title: String
        let description: String
        let phaseText: String
        let severityText: String
        let confidenceText: String
        let metricLabel: String
        let measuredValue: String
        let idealLabel: String
        let idealValue: String
        let impactText: String
        let fixText: String
        let targets: [String]
        let drillName: String
        let drillMeta: String
        let drillDescription: String
        let highlightedFrame: String
    }

    var title = "Elbow flare at release"
    var severity = "HIGH IMPACT"
    var flaw: AnalysisFlawItem?
    var presentation: AnalysisResultPresentation = .canonicalDemo
    @Environment(\.dismiss) private var dismiss
    @State private var addingGoal = false
    @State private var addedGoal = false
    @State private var goalError: String?
    @State private var toast: ShotIQToast?
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
    private var detail: DetailContent {
        guard let flaw, flaw.source != "demo" else {
            return DetailContent(
                title: title,
                description: "Your elbow drifts outward in the release phase, creating side spin and inconsistency.",
                phaseText: "Release phase",
                severityText: severity.capitalized,
                confidenceText: "72% confidence",
                metricLabel: "YOUR ANGLE",
                measuredValue: "25°",
                idealLabel: "IDEAL RANGE",
                idealValue: "15-20°",
                impactText: "Elbow flare opens your shooting angle and adds unwanted side spin, which reduces accuracy and increases variability.",
                fixText: "Keep your elbow stacked under the ball through release. Think \"elbow in, wrist out.\"",
                targets: ["Elbow under ball", "Forearm vertical", "Wrist behind ball"],
                drillName: "Towel Elbow Stack",
                drillMeta: "8 min • Shooting Mechanics",
                drillDescription: "Use a towel between elbow and hip to build awareness of keeping your elbow stacked through release.",
                highlightedFrame: "RELEASE")
        }

        let flawTitle = flaw.title.uppercased()
        let severityText = flaw.impact.capitalized
        let phase = flaw.phase.replacingOccurrences(of: "-", with: " ").capitalized
        let confidence = "\(flaw.confidence) confidence"
        if flawTitle.contains("RELEASE PATH") {
            return DetailContent(
                title: flaw.title,
                description: flaw.description,
                phaseText: "\(phase) phase",
                severityText: severityText,
                confidenceText: confidence,
                metricLabel: "YOUR OFFSET",
                measuredValue: "\(flaw.trendEnd)°",
                idealLabel: "IDEAL BAND",
                idealValue: "-5° to +5°",
                impactText: "The ball is leaving outside the centerline window, which makes left-right misses more likely.",
                fixText: "Drive the ball straight up through the shooting line and hold the finish toward the rim.",
                targets: ["Release through centerline", "Elbow over shooting hip", "Hold follow-through"],
                drillName: "Line Release Holds",
                drillMeta: "7 min • Release Control",
                drillDescription: "Pause at release with the ball, elbow, and wrist stacked on one vertical line.",
                highlightedFrame: "RELEASE")
        }
        if flawTitle.contains("ELBOW") {
            return DetailContent(
                title: flaw.title,
                description: flaw.description,
                phaseText: "\(phase) phase",
                severityText: severityText,
                confidenceText: confidence,
                metricLabel: "YOUR ANGLE",
                measuredValue: "\(flaw.trendEnd)°",
                idealLabel: "IDEAL RANGE",
                idealValue: "150-180°",
                impactText: "The elbow is outside the stacked release band, which can push the shot path away from the rim line.",
                fixText: "Keep your elbow stacked under the ball through release and finish tall through the wrist.",
                targets: ["Elbow under ball", "Forearm vertical", "Wrist behind ball"],
                drillName: "Towel Elbow Stack",
                drillMeta: "8 min • Shooting Mechanics",
                drillDescription: "Use a towel between elbow and hip to build awareness of keeping your elbow stacked through release.",
                highlightedFrame: "RELEASE")
        }
        if flawTitle.contains("WRIST") {
            return DetailContent(
                title: flaw.title,
                description: flaw.description,
                phaseText: "\(phase) phase",
                severityText: severityText,
                confidenceText: confidence,
                metricLabel: "YOUR ANGLE",
                measuredValue: "\(flaw.trendEnd)°",
                idealLabel: "IDEAL RANGE",
                idealValue: "50-100°",
                impactText: "The wrist is outside the release-control band, which can flatten arc and reduce touch.",
                fixText: "Let the wrist load behind the ball, then snap through the center of the ball at release.",
                targets: ["Wrist behind ball", "Snap over elbow", "Fingers finish down"],
                drillName: "Wrist Snap Holds",
                drillMeta: "6 min • Release Feel",
                drillDescription: "Hold the wrist-loaded position, release softly, and finish with fingers through the rim line.",
                highlightedFrame: "RELEASE")
        }
        if flawTitle.contains("CENTERLINE") {
            return DetailContent(
                title: flaw.title,
                description: flaw.description,
                phaseText: "\(phase) phase",
                severityText: severityText,
                confidenceText: confidence,
                metricLabel: "YOUR DRIFT",
                measuredValue: "\(flaw.trendEnd)°",
                idealLabel: "IDEAL BAND",
                idealValue: "< 3°",
                impactText: "The shot path is drifting away from the body centerline, which adds side-to-side variability.",
                fixText: "Start balanced, keep the ball on the shooting side, and finish through one vertical lane.",
                targets: ["Ball on shooting lane", "Shoulders square", "Finish on target line"],
                drillName: "Centerline Form Shots",
                drillMeta: "8 min • Alignment",
                drillDescription: "Shoot close-range reps while keeping feet, elbow, wrist, and follow-through on one line.",
                highlightedFrame: "RISE")
        }
        return DetailContent(
            title: flaw.title,
            description: flaw.description,
            phaseText: "\(phase) phase",
            severityText: severityText,
            confidenceText: confidence,
            metricLabel: "YOUR SCORE",
            measuredValue: flaw.trendEnd,
            idealLabel: "TARGET",
            idealValue: "75+",
            impactText: "This score gap is pulling down the saved analysis result and should be prioritized in training.",
            fixText: "Use focused reps on the lowest-scoring mechanic before adding speed or fatigue.",
            targets: ["Clean setup", "Controlled rhythm", "Repeatable finish"],
            drillName: "Release Rhythm Builder",
            drillMeta: "9 min • Form Focus",
            drillDescription: "Build repeatable reps by pausing at set point, release, and follow-through before increasing pace.",
            highlightedFrame: "RELEASE")
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-flaw-detail") {
            VStack(spacing: 0) {
                HStack {
                    Button {
                        toast = .info("Returning to flaws overview")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { dismiss() }
                    } label: {
                        Image(systemName: "arrow.left").font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                    Wordmark(size: 30)
                    Spacer()
                    ShareLink(item: "Working on my shot: fixing \(detail.title.lowercased()) with ShotIQ AI analysis. 🏀") {
                        Image(systemName: "square.and.arrow.up").font(.system(size: 18)).foregroundStyle(ShotIQColor.ink)
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        toast = .info("Opening share sheet", "\(detail.title) summary is ready.")
                    })
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
                                    Text(detail.title.uppercased()).shotiqDisplay(30)
                                    Text(detail.description)
                                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .padding(.top, 2)
                                }
                                Spacer(minLength: 12)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("FORM SCORE").shotiqBody(10, weight: .semibold).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(presentation.scoreText).font(.custom("Tungsten-Medium", size: 40))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: presentation.scorePct).frame(width: 76)
                                }
                            }
                            .padding(.top, 14)
                            HStack(spacing: 0) {
                                metaItem("clock", detail.phaseText)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 20)
                                metaItem("chart.bar", detail.severityText)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 20)
                                metaItem("water.waves", detail.confidenceText)
                            }
                            .padding(.top, 14)
                            SectionLabel(text: "EVIDENCE FRAMES").padding(.top, 20)
                            HStack(spacing: 4) {
                                ForEach(frames, id: \.self) { f in
                                    Button {
                                        toast = .info("Opening affected frame", "\(f.capitalized) evidence for \(detail.title).")
                                        route = .frames
                                    } label: {
                                        VStack(spacing: 6) {
                                            evidenceFrameSurface(f)
                                            .overlay(RoundedRectangle(cornerRadius: 4)
                                                .stroke(f == detail.highlightedFrame ? ShotIQColor.shotiqOrange : .clear, lineWidth: 2))
                                            Text(f).shotiqBody(8, weight: f == detail.highlightedFrame ? .bold : .regular)
                                                .kerning(0.3)
                                                .foregroundStyle(f == detail.highlightedFrame ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.6)
                                            if f == detail.highlightedFrame {
                                                Text("(Flaw)").shotiqBody(9).foregroundStyle(ShotIQColor.reviewRed)
                                            }
                                        }
                                        .frame(maxWidth: .infinity)
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityIdentifier("flaw-detail-evidence-\(f.lowercased())")
                                }
                            }
                            .padding(.top, 8)
                            HStack(alignment: .top, spacing: 18) {
                                VStack(alignment: .leading, spacing: 6) {
                                    SectionLabel(text: "IMPACT")
                                    Text(detail.impactText)
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                HStack(spacing: 14) {
                                    angleFigure(detail.metricLabel, detail.measuredValue, ShotIQColor.reviewRed)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 74)
                                    angleFigure(detail.idealLabel, detail.idealValue, ShotIQColor.analysisBlue)
                                }
                            }
                            .padding(.top, 22)
                            HStack(alignment: .top, spacing: 18) {
                                VStack(alignment: .leading, spacing: 6) {
                                    SectionLabel(text: "HOW TO FIX")
                                    Text(detail.fixText)
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                VStack(alignment: .leading, spacing: 7) {
                                    Text("TARGET POSITION").shotiqBody(11, weight: .bold).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    ForEach(detail.targets, id: \.self) { target in
                                        targetCheck(target)
                                    }
                                }
                                .padding(12)
                                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            }
                            .padding(.top, 20)
                            SectionLabel(text: "RECOMMENDED DRILL").padding(.top, 22)
                            NavigationLink { DrillDetailView(name: detail.drillName) } label: {
                                HStack(alignment: .top, spacing: 14) {
                                    RoundedRectangle(cornerRadius: 6).fill(ShotIQColor.rule)
                                        .frame(width: 92, height: 92)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(detail.drillName).shotiqBody(16, weight: .semibold)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text(detail.drillMeta).shotiqBody(12)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text(detail.drillDescription)
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
                                    toast = .info("Opening affected frames", detail.title)
                                    route = .frames
                                }
                            }
                            .padding(.top, 14)
                            if let goalError {
                                Text(goalError).shotiqBody(12).foregroundStyle(ShotIQColor.reviewRed)
                                    .padding(.top, 6)
                            }
                            PrimaryButton(title: "Start recommended drill", icon: "figure.basketball") {
                                toast = .progress("Starting drill", detail.drillName, progress: 0.35)
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
            case .frames: FrameDetailSkeletonView(presentation: presentation)
            case .drill: DrillExecutionView(drillName: detail.drillName)
            }
        }
        .shotiqToast($toast)
    }

    @ViewBuilder
    private func evidenceFrameSurface(_ frame: String) -> some View {
        let hasRealMedia = presentation.id != "canonical-demo" &&
            (presentation.mediaURL != nil || presentation.videoURL != nil)
        if hasRealMedia {
            FrameDetailMediaSurface(presentation: presentation,
                                    fallbackKey: Self.evidenceFrameKey(frame) ?? "047-visual-001",
                                    height: 132,
                                    phase: frame,
                                    showSkeleton: true,
                                    showJoints: true,
                                    showBall: false,
                                    showAngles: false)
                .accessibilityIdentifier("flaw-detail-real-media-\(frame.lowercased())")
        } else if let key = Self.evidenceFrameKey(frame) {
            CanonicalPhoto(key, height: 132, cornerRadius: 4)
        } else {
            CanonicalPhoto("047-visual-001", height: 132, cornerRadius: 4)
                .overlay(SkeletonOverlay().opacity(0.72))
        }
    }

    /// Goals live on the web backend — POST /api/goals (name is the only required field).
    private func addToGoals() {
        guard !addingGoal, !addedGoal else { return }
        addingGoal = true
        goalError = nil
        toast = .progress("Adding goal", "Saving this correction target.", progress: 0.65)
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
                    body: Body(name: "Fix \(detail.title.lowercased())",
                               description: "\(detail.fixText) Recommended drill: \(detail.drillName).",
                               category: "form", targetValue: 100, unit: "%", xpReward: 150))
                addedGoal = true
                toast = .success("Goal added", "\(detail.drillName) is linked to this fix.")
            } catch {
                goalError = "Couldn't save the goal. Check your connection and try again."
                toast = .error("Goal save failed", "Check your connection and try again.")
            }
            addingGoal = false
        }
    }
    private func metaItem(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 22, weight: .light)).foregroundStyle(ShotIQColor.ink)
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
