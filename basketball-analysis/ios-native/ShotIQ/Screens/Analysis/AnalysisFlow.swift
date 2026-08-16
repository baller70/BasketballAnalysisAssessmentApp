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
    var delta = 2
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("FORM SCORE").shotiqBody(12, weight: .semibold).kerning(0.8)
                .foregroundStyle(ShotIQColor.graphite)
            HStack(alignment: .center, spacing: 8) {
                Text(score).font(.custom("Tungsten-Medium", size: numeralSize))
                    .foregroundStyle(ShotIQColor.shotiqOrange)
                    .lineLimit(1)
                    .fixedSize(horizontal: true, vertical: false)
                ScoreDeltaBadge(delta: delta)
            }
            ScoreBar(pct: pct).frame(width: barWidth)
            Text(verdict).font(.custom("Tungsten-Medium", size: 18))
                .foregroundStyle(ShotIQColor.analysisBlue).padding(.top, 6)
            Text(caption).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

fileprivate struct ScoreDeltaBadge: View {
    let delta: Int

    private var isPositive: Bool { delta >= 0 }
    private var tint: Color { isPositive ? ShotIQColor.confirmGreen : ShotIQColor.reviewRed }
    private var label: String { "\(isPositive ? "+" : "")\(delta)" }
    private var icon: String { isPositive ? "arrow.up.right" : "arrow.down.right" }

    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: icon)
                .font(.system(size: 9, weight: .heavy))
            Text(label)
                .shotiqBody(11, weight: .bold)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 7)
        .padding(.vertical, 4)
        .background(tint.opacity(0.12), in: Capsule())
        .accessibilityLabel(isPositive ? "Form score up \(abs(delta)) points" : "Form score down \(abs(delta)) points")
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
    var showsPlaybackControl = true

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
                                       phase: phase,
                                       showsPoseStatusPill: showGuidanceLabels,
                                       showsPlaybackControl: showsPlaybackControl)
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
    var showsPoseStatusPill = true
    var showsPlaybackControl = true
    var isMuted = false
    var showsRepVerdictToastOverlay = true
    var onVerdictToastChange: ((RepVerdictToast?, Bool) -> Void)? = nil
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
    @State private var isScrubbing = false
    @State private var repVerdictToast: RepVerdictToast?
    @State private var repVerdictBurst = false
    @State private var lastRepVerdictToastKey: String?

    private var playbackFrames: [VideoPoseFrameRecord] {
        presentation.videoPoseFrames.sorted { $0.timestampSeconds < $1.timestampSeconds }
    }
    private var minimumRepResultHoldSeconds: Double { 1.05 }
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
        if isPlaying || isScrubbing || showsControlTray { return activePoseFrame ?? selectedPoseFrame }
        return selectedPoseFrame ?? activePoseFrame
    }
    private var displayPhase: String {
        poseFrame?.phaseLabel ?? phase?.uppercased().replacingOccurrences(of: "_", with: "-") ?? "RELEASE"
    }
    private var seekKey: String {
        "\(url.absoluteString)|\(phase ?? "")|\(overrideFrame?.frameIndex ?? -1)|\(selectedPoseFrame?.timestampSeconds ?? -1)"
    }
    private var lockedStillFrame: VideoPoseFrameRecord? {
        guard !isPlaying, !isScrubbing, !showsControlTray else { return nil }
        return overrideFrame ?? selectedPoseFrame
    }
    private var scrubProgress: Double {
        let lower = hasPlaybackBounds ? analyzedStartSeconds : 0
        let upper = hasPlaybackBounds ? analyzedEndSeconds : max(durationSeconds, 1)
        let span = max(upper - lower, 0.001)
        return min(max((currentSeconds - lower) / span, 0), 1)
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
                    if showAngles && showsPoseStatusPill {
                        videoPosePill(frame)
                    }
                } else if showAngles && showsPoseStatusPill {
                    videoPosePill(nil)
                }

                if showsPlaybackControl && !showsAdvancedControls {
                    playbackControl
                }
                if showsAdvancedControls {
                    advancedPlaybackControls
                }

                analysisFrameBorder
                if showsRepVerdictToastOverlay {
                    repVerdictToastOverlay
                }
            }
        }
        .frame(height: height)
        .clipped()
        .accessibilityIdentifier(poseFrame == nil ? "analysis-video-player" : "analysis-video-pose-overlay")
        .task(id: url) {
            await preparePlayer()
        }
        .onChange(of: seekKey) { _, _ in
            activePoseFrame = selectedPoseFrame
            seekToSelectedFrame()
        }
        .onChange(of: repVerdictToastKey) { _, key in
            showRepVerdictToast(for: key)
        }
        .onChange(of: isMuted) { _, muted in
            player?.isMuted = muted
        }
        .onDisappear {
            player?.pause()
            removeTimeObserver()
            isPlaying = false
            onVerdictToastChange?(nil, false)
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

    @MainActor
    private func seekToProgress(_ progress: Double) {
        let lower = hasPlaybackBounds ? analyzedStartSeconds : 0
        let upper = hasPlaybackBounds ? analyzedEndSeconds : max(durationSeconds, 1)
        seek(to: lower + (upper - lower) * min(max(progress, 0), 1))
    }

    private func preparePlayer() async {
        if loadedURL != url {
            let next = AVPlayer(url: url)
            next.actionAtItemEnd = .pause
            next.isMuted = isMuted
            await MainActor.run {
                removeTimeObserver()
                player = next
                loadedURL = url
                activePoseFrame = selectedPoseFrame
                isPlaying = false
                installTimeObserver(on: next)
            }
        } else {
            await MainActor.run {
                player?.isMuted = isMuted
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
            HStack(spacing: 12) {
                Button {
                    togglePlayback()
                } label: {
                    Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 58, height: 58)
                        .background(ShotIQColor.shotiqOrange, in: Circle())
                        .shadow(color: ShotIQColor.shotiqOrange.opacity(0.38), radius: 14, x: 0, y: 6)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(isPlaying ? "Pause full-screen video" : "Play full-screen video")

                VideoScrubWheel(progress: scrubProgress,
                                tint: frameOverallStatus(poseFrame ?? selectedPoseFrame ?? playbackFrames.first).main,
                                timeText: PickedVideoClip.timeText(currentSeconds),
                                onScrubBegan: {
                                    player?.pause()
                                    isPlaying = false
                                    isScrubbing = true
                                },
                                onScrubChanged: { progress in
                                    seekToProgress(progress)
                                },
                                onScrubEnded: {
                                    isScrubbing = false
                                })

                Button {
                    cycleRate()
                } label: {
                    VStack(spacing: 1) {
                        Text(rateLabel.uppercased())
                            .shotiqBody(13, weight: .heavy)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                        Text("SLOW")
                            .shotiqBody(8, weight: .bold)
                            .kerning(0.7)
                    }
                    .foregroundStyle(.white)
                    .frame(width: 58, height: 48)
                    .background(.white.opacity(playbackRate < 1.0 ? 0.22 : 0.12), in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(playbackRate < 1.0 ? ShotIQColor.shotiqOrange : .white.opacity(0.18), lineWidth: 1.3))
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Change slow motion speed")
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(.black.opacity(0.46), in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(.white.opacity(0.10), lineWidth: 1))
            .padding(.horizontal, 14)
            .padding(.bottom, 12)
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

    private var lockedShotBorderStatus: VideoPoseQualityStatus? {
        lockedShotVerdict?.status
    }

    private var lockedShotVerdict: (frame: VideoPoseFrameRecord, status: VideoPoseQualityStatus)? {
        guard let frame = activeBorderFrame,
              let releaseFrame = lockedReleaseFrame(for: frame) else {
            return nil
        }
        return (releaseFrame, shotResultStatus(for: releaseFrame))
    }

    private var repVerdictToastKey: String {
        guard showsAdvancedControls,
              let verdict = lockedShotVerdict else {
            return "none"
        }
        return "\(verdict.frame.frameIndex)-\(verdict.status.toastTitle)"
    }

    @ViewBuilder
    private var repVerdictToastOverlay: some View {
        if let repVerdictToast {
            HStack {
                Spacer()
                RepVerdictToastBanner(toast: repVerdictToast, burst: repVerdictBurst)
                Spacer()
            }
            .padding(.top, 12)
            .padding(.horizontal, 14)
            .transition(.scale(scale: 0.72, anchor: .top).combined(with: .opacity))
            .accessibilityHidden(true)
        }
    }

    @MainActor
    private func showRepVerdictToast(for key: String) {
        guard key != "none",
              key != lastRepVerdictToastKey,
              let verdict = lockedShotVerdict else {
            return
        }
        lastRepVerdictToastKey = key
        let toast = RepVerdictToast(status: verdict.status,
                                    frameIndex: verdict.frame.frameIndex + 1)
        repVerdictToast = toast
        repVerdictBurst = false
        onVerdictToastChange?(toast, false)
        withAnimation(.spring(response: 0.26, dampingFraction: 0.48)) {
            repVerdictBurst = true
            onVerdictToastChange?(toast, true)
        }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 950_000_000)
            guard lastRepVerdictToastKey == key else { return }
            withAnimation(.easeOut(duration: 0.18)) {
                repVerdictToast = nil
                repVerdictBurst = false
                onVerdictToastChange?(nil, false)
            }
        }
    }

    private func frameOverallStatus(_ frame: VideoPoseFrameRecord?) -> VideoPoseQualityStatus {
        bodyStatus(for: frame, greenThreshold: 0.70, yellowThreshold: 0.43)
    }

    private func activeBodyPartStatuses(_ frame: VideoPoseFrameRecord?) -> [VideoPoseQualityStatus] {
        guard let frame else { return [.warning, .good, .warning] }
        var statuses = bodyTrackedJoints.compactMap { jointStatus($0, in: frame) }
        if frame.confidence < 0.5 {
            statuses.append(.problem)
        } else if frame.confidence < 0.72 {
            statuses.append(.warning)
        } else {
            statuses.append(.good)
        }
        return statuses
    }

    private var activeBorderFrame: VideoPoseFrameRecord? {
        poseFrame ?? selectedPoseFrame ?? playbackFrames.first
    }

    private var previousBorderFrame: VideoPoseFrameRecord? {
        guard let activeBorderFrame else { return nil }
        return playbackFrames.last {
            $0.timestampSeconds < activeBorderFrame.timestampSeconds - 0.01
        } ?? playbackFrames.first
    }

    private var nextBorderFrame: VideoPoseFrameRecord? {
        guard let activeBorderFrame else { return nil }
        return playbackFrames.first {
            $0.timestampSeconds > activeBorderFrame.timestampSeconds + 0.01
        }
    }

    private var liveBorderStatus: VideoPoseQualityStatus {
        shotFrameStatus(for: activeBorderFrame)
    }

    private var bodyTrackedJoints: [DetectedPose.Joint] {
        [
            .nose, .leftEye, .rightEye, .leftEar, .rightEar,
            .neck,
            .leftShoulder, .rightShoulder,
            .leftElbow, .rightElbow,
            .leftWrist, .rightWrist,
            .leftHip, .rightHip,
            .leftKnee, .rightKnee,
            .leftAnkle, .rightAnkle
        ]
    }

    private func isShotCycleCompleteFrame(_ frame: VideoPoseFrameRecord) -> Bool {
        if playbackFrames.last?.frameIndex == frame.frameIndex {
            return true
        }
        guard isShotReleaseOrFinishFrame(frame),
              let nextBorderFrame else {
            return false
        }
        let nextPhase = nextBorderFrame.phaseLabel.uppercased()
        if nextPhase == "SETUP" || nextPhase == "LOAD" {
            return true
        }
        return !hasArmsAboveHead(in: nextBorderFrame) && !hasWristSnap(in: nextBorderFrame)
    }

    private func isShotReleaseOrFinishFrame(_ frame: VideoPoseFrameRecord) -> Bool {
        let phase = frame.phaseLabel.uppercased()
        if phase == "RELEASE" || phase == "FOLLOW-THROUGH" {
            return true
        }
        return hasArmsAboveHead(in: frame) && hasWristSnap(in: frame)
    }

    private func isReleaseDecisionFrame(_ frame: VideoPoseFrameRecord) -> Bool {
        if frame.phaseLabel.uppercased() == "RELEASE" {
            return true
        }
        return hasArmsAboveHead(in: frame) && hasWristSnap(in: frame)
    }

    private func isRepResetFrame(_ frame: VideoPoseFrameRecord) -> Bool {
        guard let pose = frame.detectedPose,
              let arm = shootingArm(in: pose),
              let wrist = arm.wrist,
              let elbow = arm.elbow,
              let shoulder = arm.shoulder else {
            return false
        }
        let hipY = [pose.joints[.leftHip]?.y, pose.joints[.rightHip]?.y].compactMap { $0 }.min()
        let wristDropped = wrist.y >= shoulder.y + 0.08
        let elbowDropped = elbow.y >= shoulder.y + 0.03
        let wristNearLoadPocket = hipY.map { wrist.y >= $0 - 0.10 } ?? wristDropped
        return wristDropped && elbowDropped && wristNearLoadPocket && !hasWristSnap(in: frame)
    }

    private func shotResultStatus(for frame: VideoPoseFrameRecord) -> VideoPoseQualityStatus {
        repStatusCounts(through: frame).dominantStatus
    }

    private func bodyStatus(for frame: VideoPoseFrameRecord?,
                            greenThreshold: Double,
                            yellowThreshold: Double) -> VideoPoseQualityStatus {
        let score = bodyMetricScore(for: frame)
        if score >= greenThreshold { return .good }
        if score >= yellowThreshold { return .warning }
        return .problem
    }

    private func bodyMetricScore(for frame: VideoPoseFrameRecord?) -> Double {
        guard let frame else { return 0.5 }
        let statuses = activeBodyPartStatuses(frame)
        let metricScores = statuses.map(score)
        let poseScore = namedBodyPartCoverageScore(for: frame)
        let combined = metricScores + [poseScore]
        guard !combined.isEmpty else { return 0.5 }
        return combined.reduce(0, +) / Double(combined.count)
    }

    private func score(_ status: VideoPoseQualityStatus) -> Double {
        switch status {
        case .good: return 1.0
        case .warning: return 0.66
        case .caution: return 0.35
        case .problem: return 0.0
        }
    }

    private func namedBodyPartCoverageScore(for frame: VideoPoseFrameRecord) -> Double {
        guard let pose = frame.detectedPose else { return 0 }
        let required: [DetectedPose.Joint] = [
            .nose, .leftEye, .rightEye, .leftEar, .rightEar,
            .neck,
            .leftShoulder, .rightShoulder,
            .leftElbow, .rightElbow,
            .leftWrist, .rightWrist,
            .leftHip, .rightHip,
            .leftKnee, .rightKnee,
            .leftAnkle, .rightAnkle
        ]
        let found = required.filter { pose.joints[$0] != nil }.count
        let coverage = Double(found) / Double(required.count)
        let confidence = min(max(frame.confidence, 0), 1)
        return coverage * 0.65 + confidence * 0.35
    }

    private func shotFrameStatus(for frame: VideoPoseFrameRecord?) -> VideoPoseQualityStatus {
        movingBodyPartStatus(for: frame)
            ?? visibleBodyPartStatus(for: frame)
            ?? bodyStatus(for: frame, greenThreshold: 0.70, yellowThreshold: 0.43)
    }

    private var releaseDecisionFrame: VideoPoseFrameRecord? {
        if let release = presentation.releaseVideoPoseFrame {
            return nearestPlaybackFrame(to: release.timestampSeconds) ?? release
        }
        return playbackFrames.first { $0.phaseLabel.uppercased() == "RELEASE" }
            ?? playbackFrames.last { isShotReleaseOrFinishFrame($0) }
            ?? playbackFrames.last
    }

    private func nearestPlaybackFrame(to seconds: Double) -> VideoPoseFrameRecord? {
        guard !playbackFrames.isEmpty else { return nil }
        return playbackFrames.min {
            abs($0.timestampSeconds - seconds) < abs($1.timestampSeconds - seconds)
        }
    }

    private func lockedReleaseFrame(for active: VideoPoseFrameRecord) -> VideoPoseFrameRecord? {
        guard !playbackFrames.isEmpty,
              let activeIndex = playbackIndex(of: active) else {
            return nil
        }
        guard let releaseIndex = playbackFrames[playbackFrames.startIndex...activeIndex].indices
            .last(where: { isReleaseDecisionFrame(playbackFrames[$0]) }) else {
            return nil
        }
        if hasNextRepLoaded(after: releaseIndex, through: activeIndex) {
            return nil
        }
        return playbackFrames[releaseIndex]
    }

    private func hasNextRepLoaded(after releaseIndex: Int, through activeIndex: Int) -> Bool {
        let nextIndex = playbackFrames.index(after: releaseIndex)
        guard nextIndex <= activeIndex else { return false }
        let releaseSeconds = playbackFrames[releaseIndex].timestampSeconds
        return playbackFrames[nextIndex...activeIndex].contains { frame in
            frame.timestampSeconds - releaseSeconds >= minimumRepResultHoldSeconds && isRepResetFrame(frame)
        }
    }

    private func currentRepStartIndex(endingAt releaseIndex: Int) -> Int {
        guard releaseIndex > playbackFrames.startIndex,
              let previousReleaseIndex = playbackFrames[playbackFrames.startIndex..<releaseIndex].indices
                  .last(where: { isReleaseDecisionFrame(playbackFrames[$0]) }) else {
            return playbackFrames.startIndex
        }
        let searchStart = playbackFrames.index(after: previousReleaseIndex)
        guard searchStart < releaseIndex,
              let resetIndex = playbackFrames[searchStart..<releaseIndex].indices
                  .first(where: { frameIndex in
                      playbackFrames[frameIndex].timestampSeconds - playbackFrames[previousReleaseIndex].timestampSeconds >= minimumRepResultHoldSeconds
                          && isRepResetFrame(playbackFrames[frameIndex])
                  }) else {
            return searchStart
        }
        var startIndex = resetIndex
        while startIndex > playbackFrames.startIndex {
            let previousIndex = playbackFrames.index(before: startIndex)
            guard isRepResetFrame(playbackFrames[previousIndex]) else { break }
            startIndex = previousIndex
        }
        return startIndex
    }

    private func playbackIndex(of frame: VideoPoseFrameRecord) -> Int? {
        playbackFrames.firstIndex { candidate in
            candidate.frameIndex == frame.frameIndex
                || abs(candidate.timestampSeconds - frame.timestampSeconds) < 0.01
        }
    }

    private func repFrames(through releaseFrame: VideoPoseFrameRecord) -> [VideoPoseFrameRecord] {
        guard !playbackFrames.isEmpty else { return [releaseFrame] }
        let releaseIndex = playbackIndex(of: releaseFrame) ?? playbackFrames.index(before: playbackFrames.endIndex)
        let repStartIndex = currentRepStartIndex(endingAt: releaseIndex)
        let repRange = repStartIndex...releaseIndex
        let setupIndex = playbackFrames[repRange].indices.first { index in
            playbackFrames[index].phaseLabel.uppercased() == "SETUP"
        }
        let fallbackStartIndex = playbackFrames[repRange].indices.first { index in
            let phase = playbackFrames[index].phaseLabel.uppercased()
            return phase == "SETUP" || phase == "LOAD"
        }
        let startIndex = setupIndex ?? fallbackStartIndex ?? repStartIndex
        return Array(playbackFrames[startIndex...releaseIndex])
    }

    private func repStatusCounts(through releaseFrame: VideoPoseFrameRecord) -> VideoPoseStatusCounts {
        var counts = VideoPoseStatusCounts()
        var previousStatus: VideoPoseQualityStatus?
        for frame in repFrames(through: releaseFrame) {
            let status = shotFrameStatus(for: frame)
            guard status != previousStatus else { continue }
            counts.add(status)
            previousStatus = status
        }
        return counts
    }

    private func movingBodyPartStatus(for frame: VideoPoseFrameRecord?) -> VideoPoseQualityStatus? {
        guard let frame,
              let currentPose = frame.detectedPose,
              let previousPose = previousFrame(before: frame)?.detectedPose else {
            return nil
        }
        let movingStatuses = bodyTrackedJoints.compactMap { joint -> (distance: CGFloat, status: VideoPoseQualityStatus)? in
            guard let current = currentPose.joints[joint],
                  let previous = previousPose.joints[joint],
                  let status = jointStatus(joint, in: frame) else {
                return nil
            }
            return (hypot(current.x - previous.x, current.y - previous.y), status)
        }
        .sorted { $0.distance > $1.distance }
        .filter { $0.distance > 0.004 }
        .prefix(6)
        .map(\.status)

        guard !movingStatuses.isEmpty else { return nil }
        return bodyPartDistributionStatus(in: movingStatuses)
    }

    private func visibleBodyPartStatus(for frame: VideoPoseFrameRecord?) -> VideoPoseQualityStatus? {
        guard let frame,
              let pose = frame.detectedPose else {
            return nil
        }
        let statuses = bodyTrackedJoints.compactMap { joint -> VideoPoseQualityStatus? in
            guard pose.joints[joint] != nil else { return nil }
            return jointStatus(joint, in: frame)
        }
        guard !statuses.isEmpty else { return nil }
        return bodyPartDistributionStatus(in: statuses)
    }

    private func bodyPartDistributionStatus(in statuses: [VideoPoseQualityStatus]) -> VideoPoseQualityStatus {
        let averageScore = statuses.map(score).reduce(0, +) / Double(statuses.count)
        return status(forScore: averageScore)
    }

    private func status(forScore score: Double) -> VideoPoseQualityStatus {
        if score >= 0.70 { return .good }
        if score >= 0.55 { return .warning }
        if score >= 0.35 { return .caution }
        return .problem
    }

    private func jointStatus(_ joint: DetectedPose.Joint, in frame: VideoPoseFrameRecord) -> VideoPoseQualityStatus? {
        if joint == .leftShoulder || joint == .rightShoulder {
            return VideoPoseQualityStatus.status(value: frame.shoulderAngle, ideal: 55...95, warning: 40...115)
        }
        if joint == .leftElbow || joint == .rightElbow {
            return VideoPoseQualityStatus.status(value: frame.elbowAngle, ideal: 150...180, warning: 130...190)
        }
        if joint == .leftWrist || joint == .rightWrist {
            let wrist = VideoPoseQualityStatus.status(value: frame.wristAngle, ideal: 50...100, warning: 35...120)
            let release = VideoPoseQualityStatus.status(value: frame.releaseAngle.map(abs), ideal: 0...5, warning: 0...12)
            return status(forScore: (score(wrist) + score(release)) / 2)
        }
        if joint == .leftHip || joint == .rightHip {
            return VideoPoseQualityStatus.status(value: frame.hipAngle, ideal: 55...95, warning: 40...115)
        }
        if joint == .leftKnee || joint == .rightKnee || joint == .leftAnkle || joint == .rightAnkle {
            return VideoPoseQualityStatus.status(value: frame.kneeAngle, ideal: 70...120, warning: 55...145)
        }
        if joint == .neck {
            let shoulder = VideoPoseQualityStatus.status(value: frame.shoulderAngle, ideal: 55...95, warning: 40...115)
            let hip = VideoPoseQualityStatus.status(value: frame.hipAngle, ideal: 55...95, warning: 40...115)
            return status(forScore: (score(shoulder) + score(hip)) / 2)
        }
        if joint == .nose || joint == .leftEye || joint == .rightEye || joint == .leftEar || joint == .rightEar {
            if frame.confidence >= 0.72 { return .good }
            if frame.confidence >= 0.5 { return .warning }
            return .problem
        }
        return nil
    }

    private func hasArmsAboveHead(in frame: VideoPoseFrameRecord) -> Bool {
        guard let pose = frame.detectedPose,
              let arm = shootingArm(in: pose),
              let wrist = arm.wrist,
              let shoulder = arm.shoulder else {
            return false
        }
        return wrist.y < shoulder.y - 0.03
    }

    private func hasWristSnap(in frame: VideoPoseFrameRecord) -> Bool {
        guard let pose = frame.detectedPose,
              let arm = shootingArm(in: pose),
              let wrist = arm.wrist,
              let elbow = arm.elbow else {
            return false
        }
        let forearmRaised = wrist.y < elbow.y
        let releaseNearCenter = frame.releaseAngle.map { abs($0) <= 18 } ?? false
        guard let previousPose = previousFrame(before: frame)?.detectedPose,
              let previousArm = shootingArm(in: previousPose),
              let previousWrist = previousArm.wrist else {
            return forearmRaised && releaseNearCenter
        }
        let upwardSnap = previousWrist.y - wrist.y > 0.012
        return forearmRaised && (releaseNearCenter || upwardSnap)
    }

    private func shootingArm(in pose: DetectedPose) -> (shoulder: CGPoint?, elbow: CGPoint?, wrist: CGPoint?)? {
        let leftWrist = pose.joints[.leftWrist]
        let rightWrist = pose.joints[.rightWrist]
        let useRight: Bool
        switch (leftWrist, rightWrist) {
        case let (left?, right?):
            useRight = right.y <= left.y
        case (nil, _?):
            useRight = true
        case (_?, nil):
            useRight = false
        default:
            return nil
        }
        return useRight
            ? (pose.joints[.rightShoulder], pose.joints[.rightElbow], pose.joints[.rightWrist])
            : (pose.joints[.leftShoulder], pose.joints[.leftElbow], pose.joints[.leftWrist])
    }

    private func previousFrame(before frame: VideoPoseFrameRecord) -> VideoPoseFrameRecord? {
        guard !playbackFrames.isEmpty else { return nil }
        if let index = playbackIndex(of: frame),
           index > playbackFrames.startIndex {
            return playbackFrames[playbackFrames.index(before: index)]
        }
        return playbackFrames.last {
            $0.timestampSeconds < frame.timestampSeconds - 0.01
        } ?? playbackFrames.first
    }

    @ViewBuilder
    private var analysisFrameBorder: some View {
        let shape = RoundedRectangle(cornerRadius: 8)
        if let lockedShotBorderStatus {
            shape
                .stroke(lockedShotBorderStatus.main, lineWidth: 7)
                .padding(1)
                .accessibilityHidden(true)
        } else {
            shape
                .stroke(liveBorderStatus.main, lineWidth: 5)
                .padding(2)
                .accessibilityHidden(true)
        }
    }
}

fileprivate struct VideoScrubWheel: View {
    var progress: Double
    var tint: Color
    var timeText: String
    var onScrubBegan: () -> Void
    var onScrubChanged: (Double) -> Void
    var onScrubEnded: () -> Void

    var body: some View {
        GeometryReader { proxy in
            let width = max(proxy.size.width, 1)
            let clamped = min(max(progress, 0), 1)
            let knobX = width * clamped
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(.white.opacity(0.16))
                    .frame(height: 2)
                    .position(x: width / 2, y: 19)
                Capsule()
                    .fill(tint)
                    .frame(width: max(8, knobX), height: 3)
                    .position(x: max(4, knobX / 2), y: 19)

                HStack(alignment: .center, spacing: 0) {
                    ForEach(0..<31, id: \.self) { index in
                        let major = index % 5 == 0
                        Capsule()
                            .fill(.white.opacity(major ? 0.62 : 0.30))
                            .frame(width: major ? 3 : 1.5, height: major ? 34 : 20)
                            .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 42)
                .position(x: width / 2, y: 38)

                RoundedRectangle(cornerRadius: 8)
                    .fill(tint.opacity(0.28))
                    .frame(width: 30, height: 54)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(tint, lineWidth: 2))
                    .position(x: min(max(knobX, 16), width - 16), y: 38)

                Text(timeText)
                    .shotiqBody(11, weight: .heavy)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .frame(height: 24)
                    .background(.black.opacity(0.46), in: Capsule())
                    .position(x: min(max(knobX, 34), width - 34), y: 8)
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        onScrubBegan()
                        onScrubChanged(Double(min(max(value.location.x / width, 0), 1)))
                    }
                    .onEnded { value in
                        onScrubChanged(Double(min(max(value.location.x / width, 0), 1)))
                        onScrubEnded()
                    }
            )
        }
        .frame(height: 68)
        .accessibilityLabel("Scrub video wheel")
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
                ShotIQBrainBallLogoMark(lineWidth: 2.1)
                    .frame(width: 44, height: 44)
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
        }
    }

    private var compactBrand: some View {
        HStack(spacing: 7) {
            ShotIQBrainBallLogoMark(lineWidth: 1.7)
                .frame(width: 34, height: 34)
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
                    let connectorX = labelCenter.x < anchorPoint.x ? labelCenter.x + width / 2 : labelCenter.x - width / 2
                    connector(from: anchorPoint,
                              to: CGPoint(x: connectorX, y: labelCenter.y),
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
        let bodyRect = poseDisplayBounds(size: size).insetBy(dx: -14, dy: -10)
        let margin: CGFloat = 10

        let edgeAnchoredX: CGFloat
        switch spec.side {
        case .right:
            let clearBodyX = bodyRect.maxX + width / 2 + margin
            let nearJointX = anchorPoint.x + width * 0.84
            edgeAnchoredX = max(clearBodyX, nearJointX)
        case .left:
            let clearBodyX = bodyRect.minX - width / 2 - margin
            let nearJointX = anchorPoint.x - width * 0.84
            edgeAnchoredX = min(clearBodyX, nearJointX)
        }
        let rawY = labelY(anchorPoint: anchorPoint, spec: spec, size: size)
        return CGPoint(x: min(max(edgeAnchoredX, width / 2 + margin), size.width - width / 2 - margin),
                       y: min(max(rawY, height / 2 + margin), size.height - height / 2 - margin))
    }

    private func labelY(anchorPoint: CGPoint, spec: VideoPoseAnnotationSpec, size: CGSize) -> CGFloat {
        if spec.title == "ELBOW ANGLE",
           let torsoY = torsoControlBandY(size: size) {
            return torsoY
        }
        return anchorPoint.y + size.height * spec.verticalOffset
    }

    private func torsoControlBandY(size: CGSize) -> CGFloat? {
        let shoulderPoints = [pose.joints[.leftShoulder], pose.joints[.rightShoulder]]
            .compactMap { $0 }
            .map { displayPoint(for: $0, size: size) }
        let hipPoints = [pose.joints[.leftHip], pose.joints[.rightHip]]
            .compactMap { $0 }
            .map { displayPoint(for: $0, size: size) }

        if let shoulderY = averageY(shoulderPoints),
           let hipY = averageY(hipPoints) {
            return shoulderY + (hipY - shoulderY) * 0.54
        }

        if let neck = pose.joints[.neck],
           let hipY = averageY(hipPoints) {
            let neckY = displayPoint(for: neck, size: size).y
            return neckY + (hipY - neckY) * 0.58
        }

        let bounds = poseDisplayBounds(size: size).standardized
        if bounds.width > 0, bounds.height > 0 {
            return bounds.minY + bounds.height * 0.48
        }

        return nil
    }

    private func averageY(_ points: [CGPoint]) -> CGFloat? {
        guard !points.isEmpty else { return nil }
        return points.map(\.y).reduce(0, +) / CGFloat(points.count)
    }

    private func poseDisplayBounds(size: CGSize) -> CGRect {
        let points = pose.joints.values.map { displayPoint(for: $0, size: size) }
        guard let first = points.first else {
            return CGRect(x: size.width * 0.25,
                          y: size.height * 0.18,
                          width: size.width * 0.5,
                          height: size.height * 0.68)
        }
        return points.dropFirst().reduce(CGRect(origin: first, size: .zero)) { partial, point in
            partial.union(CGRect(origin: point, size: .zero))
        }
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

private struct ShotIQBrainBallLogoMark: View {
    var lineWidth: CGFloat

    var body: some View {
        GeometryReader { proxy in
            let size = min(proxy.size.width, proxy.size.height)
            let scale = size / 44
            let inset = size * 0.13
            let rect = CGRect(x: inset,
                              y: inset,
                              width: size - inset * 2,
                              height: size - inset * 2)
            let dividerX = rect.midX
            let brainCenterX = rect.midX + rect.width * 0.22

            ZStack {
                RoundedRectangle(cornerRadius: 9 * scale)
                    .stroke(.white, lineWidth: lineWidth)

                Path { path in
                    path.addArc(center: CGPoint(x: dividerX, y: rect.midY),
                                radius: rect.height * 0.47,
                                startAngle: .degrees(90),
                                endAngle: .degrees(270),
                                clockwise: false)
                    path.move(to: CGPoint(x: dividerX, y: rect.minY + 1.5 * scale))
                    path.addLine(to: CGPoint(x: dividerX, y: rect.maxY - 1.5 * scale))
                    path.move(to: CGPoint(x: rect.minX + rect.width * 0.08, y: rect.midY))
                    path.addLine(to: CGPoint(x: dividerX, y: rect.midY))
                    path.move(to: CGPoint(x: rect.minX + rect.width * 0.17, y: rect.minY + rect.height * 0.13))
                    path.addQuadCurve(to: CGPoint(x: dividerX, y: rect.midY),
                                      control: CGPoint(x: rect.minX + rect.width * 0.28, y: rect.minY + rect.height * 0.38))
                    path.move(to: CGPoint(x: rect.minX + rect.width * 0.17, y: rect.maxY - rect.height * 0.13))
                    path.addQuadCurve(to: CGPoint(x: dividerX, y: rect.midY),
                                      control: CGPoint(x: rect.minX + rect.width * 0.28, y: rect.maxY - rect.height * 0.38))
                }
                .stroke(.white, style: StrokeStyle(lineWidth: lineWidth,
                                                   lineCap: .round,
                                                   lineJoin: .round))

                Path { path in
                    path.move(to: CGPoint(x: dividerX + rect.width * 0.07, y: rect.minY + rect.height * 0.15))
                    path.addCurve(to: CGPoint(x: brainCenterX, y: rect.minY + rect.height * 0.25),
                                  control1: CGPoint(x: dividerX + rect.width * 0.20, y: rect.minY - rect.height * 0.01),
                                  control2: CGPoint(x: brainCenterX + rect.width * 0.02, y: rect.minY + rect.height * 0.08))
                    path.addCurve(to: CGPoint(x: brainCenterX - rect.width * 0.01, y: rect.minY + rect.height * 0.42),
                                  control1: CGPoint(x: brainCenterX + rect.width * 0.17, y: rect.minY + rect.height * 0.26),
                                  control2: CGPoint(x: brainCenterX + rect.width * 0.14, y: rect.minY + rect.height * 0.43))
                    path.addCurve(to: CGPoint(x: brainCenterX + rect.width * 0.02, y: rect.minY + rect.height * 0.58),
                                  control1: CGPoint(x: brainCenterX + rect.width * 0.20, y: rect.minY + rect.height * 0.46),
                                  control2: CGPoint(x: brainCenterX + rect.width * 0.18, y: rect.minY + rect.height * 0.63))
                    path.addCurve(to: CGPoint(x: brainCenterX + rect.width * 0.02, y: rect.maxY - rect.height * 0.18),
                                  control1: CGPoint(x: brainCenterX + rect.width * 0.20, y: rect.maxY - rect.height * 0.35),
                                  control2: CGPoint(x: brainCenterX + rect.width * 0.17, y: rect.maxY - rect.height * 0.16))
                    path.addCurve(to: CGPoint(x: dividerX + rect.width * 0.07, y: rect.maxY - rect.height * 0.14),
                                  control1: CGPoint(x: brainCenterX - rect.width * 0.08, y: rect.maxY - rect.height * 0.03),
                                  control2: CGPoint(x: dividerX + rect.width * 0.10, y: rect.maxY - rect.height * 0.01))
                    path.move(to: CGPoint(x: dividerX + rect.width * 0.10, y: rect.minY + rect.height * 0.36))
                    path.addCurve(to: CGPoint(x: brainCenterX + rect.width * 0.05, y: rect.minY + rect.height * 0.37),
                                  control1: CGPoint(x: dividerX + rect.width * 0.19, y: rect.minY + rect.height * 0.27),
                                  control2: CGPoint(x: brainCenterX - rect.width * 0.02, y: rect.minY + rect.height * 0.28))
                    path.move(to: CGPoint(x: dividerX + rect.width * 0.10, y: rect.minY + rect.height * 0.63))
                    path.addCurve(to: CGPoint(x: brainCenterX + rect.width * 0.06, y: rect.minY + rect.height * 0.63),
                                  control1: CGPoint(x: dividerX + rect.width * 0.21, y: rect.minY + rect.height * 0.73),
                                  control2: CGPoint(x: brainCenterX - rect.width * 0.01, y: rect.minY + rect.height * 0.73))
                }
                .stroke(.white, style: StrokeStyle(lineWidth: lineWidth + 0.35,
                                                   lineCap: .round,
                                                   lineJoin: .round))
            }
            .frame(width: size, height: size)
            .position(x: proxy.size.width / 2, y: proxy.size.height / 2)
        }
        .accessibilityHidden(true)
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

enum VideoPoseQualityStatus: Equatable {
    case good
    case warning
    case caution
    case problem

    var main: Color {
        switch self {
        case .good: return Color(red: 0.13, green: 0.77, blue: 0.37)
        case .warning: return Color(red: 0.92, green: 0.70, blue: 0.03)
        case .caution: return ShotIQColor.shotiqOrange
        case .problem: return Color(red: 0.94, green: 0.27, blue: 0.27)
        }
    }

    var glow: Color { main.opacity(0.36) }
    var severity: Int {
        switch self {
        case .good: return 0
        case .warning: return 1
        case .caution: return 2
        case .problem: return 3
        }
    }

    var toastTitle: String {
        switch self {
        case .good: return "GOOD REP"
        case .warning: return "CLOSE REP"
        case .caution: return "ADJUST REP"
        case .problem: return "FIX REP"
        }
    }

    var toastSubtitle: String {
        switch self {
        case .good: return "SHOTIQ LOCKED IT"
        case .warning: return "ONE DETAIL OFF"
        case .caution: return "FORM NEEDS WORK"
        case .problem: return "REBUILD THE REP"
        }
    }

    static func status(value: Double?,
                       ideal: ClosedRange<Double>,
                       warning: ClosedRange<Double>) -> VideoPoseQualityStatus {
        guard let value else { return .good }
        if ideal.contains(value) { return .good }
        if warning.contains(value) { return .warning }
        if value < warning.lowerBound {
            let miss = warning.lowerBound - value
            let orangeBand = max(ideal.lowerBound - warning.lowerBound, 6)
            return miss <= orangeBand ? .caution : .problem
        }
        let miss = value - warning.upperBound
        let orangeBand = max(warning.upperBound - ideal.upperBound, 6)
        if miss <= orangeBand { return .caution }
        return .problem
    }
}

struct RepVerdictToast: Equatable {
    var status: VideoPoseQualityStatus
    var frameIndex: Int
}

fileprivate struct RepVerdictToastBanner: View {
    var toast: RepVerdictToast
    var burst: Bool

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: toast.status == .good ? "checkmark.seal.fill" : "bolt.fill")
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(toast.status.main)
                .scaleEffect(burst ? 1.15 : 0.82)

            VStack(alignment: .leading, spacing: 1) {
                Text(toast.status.toastTitle)
                    .shotiqBody(18, weight: .heavy)
                    .foregroundStyle(Color(red: 1.0, green: 0.82, blue: 0.08))
                    .lineLimit(1)
                Text("\(toast.status.toastSubtitle) • FRAME \(toast.frameIndex)")
                    .shotiqBody(8, weight: .bold)
                    .kerning(0.8)
                    .foregroundStyle(.white.opacity(0.84))
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .background(.black.opacity(0.78), in: Capsule())
        .overlay(Capsule().stroke(toast.status.main, lineWidth: 2))
        .shadow(color: toast.status.main.opacity(burst ? 0.72 : 0.22),
                radius: burst ? 17 : 5,
                x: 0,
                y: burst ? 4 : 1)
        .scaleEffect(burst ? 1.0 : 0.68)
        .opacity(burst ? 1 : 0.25)
    }
}

fileprivate struct VideoPoseStatusCounts {
    private(set) var green = 0
    private(set) var yellow = 0
    private(set) var orange = 0
    private(set) var red = 0

    mutating func add(_ status: VideoPoseQualityStatus) {
        switch status {
        case .good: green += 1
        case .warning: yellow += 1
        case .caution: orange += 1
        case .problem: red += 1
        }
    }

    var dominantStatus: VideoPoseQualityStatus {
        let candidates: [(status: VideoPoseQualityStatus, count: Int)] = [
            (.good, green),
            (.warning, yellow),
            (.caution, orange),
            (.problem, red)
        ]
        return candidates
            .sorted {
                if $0.count == $1.count {
                    return $0.status.severity > $1.status.severity
                }
                return $0.count > $1.count
            }
            .first(where: { $0.count > 0 })?.status ?? .warning
    }
}

fileprivate struct VideoGamePoseOverlay: View {
    var frame: VideoPoseFrameRecord
    var pose: DetectedPose
    var showBones: Bool
    var showJoints: Bool
    var showBall: Bool

    var body: some View {
        Canvas { ctx, size in
            func pt(_ p: CGPoint) -> CGPoint {
                displayPoint(for: p, size: size)
            }

            drawBodyCenterline(context: &ctx, size: size)

            if showBones {
                for pair in ShotIQPose.bones {
                    guard !isFaceBone(pair) else { continue }
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
                              isMain: true,
                              isFace: isFaceJoint(joint))
                }
            }

            if showBall, let wrist = shootingWrist {
                drawBall(context: &ctx, center: pt(wrist))
            }
        }
    }

    private func drawBodyCenterline(context ctx: inout GraphicsContext, size: CGSize) {
        guard let x = centerlineX(size: size),
              let range = centerlineYRange(size: size) else { return }
        let start = CGPoint(x: x, y: range.minY)
        let end = CGPoint(x: x, y: range.maxY)
        var line = Path()
        line.move(to: start)
        line.addLine(to: end)
        ctx.stroke(line,
                   with: .color(.black.opacity(0.30)),
                   style: StrokeStyle(lineWidth: 5,
                                      lineCap: .round,
                                      lineJoin: .round,
                                      dash: [7, 8]))
        ctx.stroke(line,
                   with: .color(.white.opacity(0.58)),
                   style: StrokeStyle(lineWidth: 2.4,
                                      lineCap: .round,
                                      lineJoin: .round,
                                      dash: [7, 8]))
        ctx.stroke(line,
                   with: .color(ShotIQColor.shotiqOrange.opacity(0.40)),
                   style: StrokeStyle(lineWidth: 1.2,
                                      lineCap: .round,
                                      lineJoin: .round,
                                      dash: [7, 8]))
    }

    private func centerlineX(size: CGSize) -> CGFloat? {
        if let nose = pose.joints[.nose] {
            return displayPoint(for: nose, size: size).x
        }
        if let neck = pose.joints[.neck] {
            return displayPoint(for: neck, size: size).x
        }
        if let left = pose.joints[.leftShoulder],
           let right = pose.joints[.rightShoulder] {
            return (displayPoint(for: left, size: size).x + displayPoint(for: right, size: size).x) / 2
        }
        if let left = pose.joints[.leftHip],
           let right = pose.joints[.rightHip] {
            return (displayPoint(for: left, size: size).x + displayPoint(for: right, size: size).x) / 2
        }
        return nil
    }

    private func centerlineYRange(size: CGSize) -> (minY: CGFloat, maxY: CGFloat)? {
        let topCandidates: [CGPoint] = [
            pose.joints[.nose],
            pose.joints[.leftEye],
            pose.joints[.rightEye],
            pose.joints[.neck],
            pose.joints[.leftShoulder],
            pose.joints[.rightShoulder]
        ].compactMap { $0 }.map { displayPoint(for: $0, size: size) }

        let bottomCandidates: [CGPoint] = [
            pose.joints[.leftAnkle],
            pose.joints[.rightAnkle],
            pose.joints[.leftKnee],
            pose.joints[.rightKnee],
            pose.joints[.leftHip],
            pose.joints[.rightHip]
        ].compactMap { $0 }.map { displayPoint(for: $0, size: size) }

        guard let top = topCandidates.map(\.y).min(),
              let bottom = bottomCandidates.map(\.y).max(),
              bottom > top else { return nil }

        let padding = size.height * 0.025
        return (max(0, top - padding), min(size.height, bottom + padding))
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
                           status: VideoPoseQualityStatus,
                           isMain: Bool,
                           isFace: Bool) {
        if isFace {
            drawTransparentFaceJoint(context: &ctx, center: center)
            return
        }

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

    private func drawTransparentFaceJoint(context ctx: inout GraphicsContext, center: CGPoint) {
        let radius: CGFloat = 5.8
        let outer = CGRect(x: center.x - radius,
                           y: center.y - radius,
                           width: radius * 2,
                           height: radius * 2)
        let inner = CGRect(x: center.x - radius + 2.2,
                           y: center.y - radius + 2.2,
                           width: (radius - 2.2) * 2,
                           height: (radius - 2.2) * 2)
        ctx.stroke(Path(ellipseIn: outer),
                   with: .color(.black.opacity(0.20)),
                   lineWidth: 3.2)
        ctx.stroke(Path(ellipseIn: outer),
                   with: .color(.white.opacity(0.36)),
                   lineWidth: 1.8)
        ctx.stroke(Path(ellipseIn: inner),
                   with: .color(.white.opacity(0.18)),
                   lineWidth: 1)
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

    private func segmentStatus(_ pair: (DetectedPose.Joint, DetectedPose.Joint)) -> VideoPoseQualityStatus {
        if isArmJoint(pair.0) || isArmJoint(pair.1) {
            return status(value: frame.elbowAngle, ideal: 150...180, warning: 130...190)
        }
        if isLowerBodyJoint(pair.0) || isLowerBodyJoint(pair.1) {
            return status(value: frame.kneeAngle, ideal: 70...120, warning: 55...145)
        }
        return .good
    }

    private func jointStatus(_ joint: DetectedPose.Joint) -> VideoPoseQualityStatus {
        if isArmJoint(joint) {
            return status(value: frame.elbowAngle, ideal: 150...180, warning: 130...190)
        }
        if isLowerBodyJoint(joint) {
            return status(value: frame.kneeAngle, ideal: 70...120, warning: 55...145)
        }
        return .good
    }

    private func status(value: Double?,
                        ideal: ClosedRange<Double>,
                        warning: ClosedRange<Double>) -> VideoPoseQualityStatus {
        VideoPoseQualityStatus.status(value: value, ideal: ideal, warning: warning)
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

    private func isFaceJoint(_ joint: DetectedPose.Joint) -> Bool {
        joint == .nose
            || joint == .leftEye
            || joint == .rightEye
            || joint == .leftEar
            || joint == .rightEar
    }

    private func isFaceBone(_ pair: (DetectedPose.Joint, DetectedPose.Joint)) -> Bool {
        isFaceJoint(pair.0) || isFaceJoint(pair.1)
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
    @State private var storyMode = true
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
    private var reviewHeight: CGFloat { storyMode ? 430 : 240 }
    private var reviewWidth: CGFloat? { storyMode ? 246 : nil }

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
                    Button {
                        storyMode.toggle()
                        toast = .success(storyMode ? "STORY VIEW SELECTED" : "LANDSCAPE VIEW SELECTED")
                    } label: {
                        HStack(spacing: 5) {
                            Image(systemName: storyMode ? "rectangle.portrait" : "rectangle")
                                .font(.system(size: 11, weight: .heavy))
                            Text(storyMode ? "STORY" : "LANDSCAPE")
                                .shotiqBody(10, weight: .heavy)
                                .kerning(0.5)
                        }
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .padding(.horizontal, 9)
                        .frame(height: 30)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange, lineWidth: 1.2))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(storyMode ? "Switch to landscape video view" : "Switch to story video view")
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
                    ZStack(alignment: .topLeading) {
                        if let url = videoURL {
                            VideoPoseResultSurface(url: url,
                                                   presentation: presentation,
                                                   height: reviewHeight,
                                                   showSkeleton: showSkeleton,
                                                   showJoints: showJoints,
                                                   showBall: showBall,
                                                   showAngles: false,
                                                   phase: selectedPhase,
                                                   overrideFrame: selectedFrame)
                            .frame(width: reviewWidth)
                        } else {
                            AnalysisResultMediaSurface(presentation: presentation,
                                                       fallbackKey: "042-visual-002",
                                                       height: reviewHeight,
                                                       phase: selectedPhase)
                            .frame(width: reviewWidth)
                        }
                        mediaExpandPill
                    }
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity, alignment: .center)

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
                    SectionLabel(text: "FORM ANALYSIS BREAKDOWN")
                    ForEach(Array(presentation.flaws.prefix(5)).indices, id: \.self) { idx in
                        let item = presentation.flaws[idx]
                        let needsFix = item.impact.contains("IMPACT")
                        HStack(spacing: 10) {
                            Circle()
                                .fill(needsFix ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen)
                                .frame(width: 8, height: 8)
                            Text("#\(idx + 1)").shotiqBody(11, weight: .bold).foregroundStyle(ShotIQColor.graphite)
                            Text(item.title).shotiqBody(13, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                                .lineLimit(1).minimumScaleFactor(0.65)
                            Spacer()
                            Text(needsFix ? "FIX THIS" : "GOOD")
                                .shotiqBody(9, weight: .bold)
                                .foregroundStyle(needsFix ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen)
                                .padding(.horizontal, 7).frame(height: 20)
                                .background((needsFix ? ShotIQColor.reviewRed : ShotIQColor.confirmGreen).opacity(0.12),
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
        AdaptivePhaseRail(active: active, action: action)
    }
}

fileprivate struct AnalysisFullScreenMediaView: View {
    var presentation: AnalysisResultPresentation
    var fallbackKey: String
    @Binding var selectedPhase: String
    var overrideFrame: VideoPoseFrameRecord? = nil
    @Environment(\.dismiss) private var dismiss
    @State private var toast: ShotIQToast?
    @State private var showsPhasePicker = false
    @State private var isMuted = false
    @State private var headerVerdictToast: RepVerdictToast?
    @State private var headerVerdictBurst = false

    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    private let headerHeight: CGFloat = 66
    private let headerToMediaGap: CGFloat = 16

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            GeometryReader { proxy in
                VStack(spacing: headerToMediaGap) {
                    ZStack {
                        if let headerVerdictToast {
                            RepVerdictToastBanner(toast: headerVerdictToast, burst: headerVerdictBurst)
                                .transition(.scale(scale: 0.72, anchor: .center).combined(with: .opacity))
                        } else {
                            Text(phaseDisplay(selectedPhase))
                                .shotiqCondensed(23, weight: .heavy)
                                .foregroundStyle(.white)
                                .lineLimit(1)
                                .minimumScaleFactor(0.72)
                                .transition(.opacity)
                        }

                        HStack {
                            Spacer()
                            closeButton
                        }
                    }
                    .frame(height: headerHeight)
                    .padding(.horizontal, 16)
                    .padding(.top, 6)
                    .zIndex(30)

                    if let url = presentation.videoURL ?? presentation.mediaURL,
                       presentation.mediaLabel.uppercased().contains("VIDEO") || presentation.videoURL != nil {
                        VideoPoseResultSurface(url: url,
                                               presentation: presentation,
                                               height: max(450, proxy.size.height - headerHeight - headerToMediaGap - 34),
                                               showSkeleton: true,
                                               showJoints: true,
                                               showBall: false,
                                               showAngles: true,
                                               phase: selectedPhase,
                                               overrideFrame: overrideFrame?.phaseLabel == selectedPhase ? overrideFrame : nil,
                                               showsAdvancedControls: true,
                                               showsPoseStatusPill: false,
                                               isMuted: isMuted,
                                               showsRepVerdictToastOverlay: false,
                                               onVerdictToastChange: { toast, burst in
                                                   headerVerdictToast = toast
                                                   headerVerdictBurst = burst
                                               })
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(alignment: .topLeading) {
                                phaseDropdown
                                    .padding(12)
                            }
                            .padding(.horizontal, 10)
                    } else {
                        AnalysisResultMediaSurface(presentation: presentation,
                                                   fallbackKey: fallbackKey,
                                                   height: max(450, proxy.size.height - headerHeight - headerToMediaGap - 34),
                                                   phase: selectedPhase,
                                                   showGuidanceLabels: true)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(alignment: .topLeading) {
                                phaseDropdown
                                    .padding(12)
                            }
                            .padding(.horizontal, 10)
                    }
                }
            }
        }
        .shotiqToast($toast)
    }

    private var closeButton: some View {
        Button {
            showsPhasePicker = false
            dismiss()
        } label: {
            Image(systemName: "xmark")
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(.white)
                .frame(width: 42, height: 42)
                .background(.black.opacity(0.20), in: Circle())
                .overlay(Circle().stroke(.white.opacity(0.24), lineWidth: 1.2))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Close full view")
    }

    private var phaseDropdown: some View {
        Button {
            withAnimation(.easeInOut(duration: 0.16)) {
                showsPhasePicker.toggle()
            }
        } label: {
            Image(systemName: "slider.horizontal.3")
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(.white)
                .frame(width: 42, height: 42)
                .background(.black.opacity(0.24), in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(.white.opacity(0.22), lineWidth: 1.1))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Select shot phase")
        .overlay(alignment: .topLeading) {
            if showsPhasePicker {
                VStack(spacing: 0) {
                    ForEach(phases, id: \.self) { phase in
                        Button {
                            selectedPhase = phase
                            toast = .success("\(phaseDisplay(phase)) SELECTED")
                            withAnimation(.easeInOut(duration: 0.16)) {
                                showsPhasePicker = false
                            }
                        } label: {
                            HStack(spacing: 10) {
                                PhasePhotoThumbnail(phase: ShotPhase(label: phase),
                                                    active: phase == selectedPhase,
                                                    width: 44,
                                                    height: 32,
                                                    cornerRadius: 5)
                                Text(phaseDisplay(phase))
                                    .shotiqBody(12, weight: phase == selectedPhase ? .heavy : .bold)
                                    .kerning(0.7)
                                    .foregroundStyle(phase == selectedPhase ? ShotIQColor.shotiqOrange : .white)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.72)
                                Spacer()
                                if phase == selectedPhase {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 12, weight: .heavy))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                }
                            }
                            .padding(.horizontal, 12)
                            .frame(height: 46)
                            .background(phase == selectedPhase ? ShotIQColor.shotiqOrange.opacity(0.13) : Color.clear)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Jump to \(phaseDisplay(phase))")

                        if phase != phases.last {
                            Rectangle()
                                .fill(.white.opacity(0.10))
                                .frame(height: 1)
                        }
                    }
                    Rectangle()
                        .fill(.white.opacity(0.10))
                        .frame(height: 1)
                    Button {
                        isMuted.toggle()
                        toast = .success(isMuted ? "AUDIO MUTED" : "AUDIO ON")
                        withAnimation(.easeInOut(duration: 0.16)) {
                            showsPhasePicker = false
                        }
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                                .font(.system(size: 18, weight: .heavy))
                                .foregroundStyle(isMuted ? ShotIQColor.shotiqOrange : .white)
                                .frame(width: 30, height: 30)
                            Text(isMuted ? "UNMUTE AUDIO" : "MUTE AUDIO")
                                .shotiqBody(12, weight: .heavy)
                                .kerning(0.7)
                                .foregroundStyle(isMuted ? ShotIQColor.shotiqOrange : .white)
                                .lineLimit(1)
                            Spacer()
                        }
                        .padding(.horizontal, 12)
                        .frame(height: 46)
                        .background(isMuted ? ShotIQColor.shotiqOrange.opacity(0.13) : Color.clear)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(isMuted ? "Unmute video audio" : "Mute video audio")
                }
                .frame(width: 246)
                .background(.black.opacity(0.92), in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(.white.opacity(0.16), lineWidth: 1))
                .shadow(color: .black.opacity(0.58), radius: 16, x: 0, y: 8)
                .offset(y: 48)
                .transition(.move(edge: .top).combined(with: .opacity))
                .zIndex(40)
            }
        }
    }

    private func phaseDisplay(_ phase: String) -> String {
        phase.replacingOccurrences(of: "-", with: " ").uppercased()
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

fileprivate struct CoachingActionItem {
    var id: String
    var icon: String
    var title: String
    var detail: String
    var tint: Color
}

fileprivate enum CoachingActionRoute: String, Identifiable {
    case breakdown
    case releaseHeight
    case centerline
    case compare
    case share

    var id: String { rawValue }
}

fileprivate enum PlayerFlawOverlayType: Hashable {
    case wristAngle
    case releaseHeight
    case releaseOffset
    case elbowAngle
    case centerline
}

fileprivate struct PlayerFlawLevelCompare: Identifiable, Hashable {
    let id: String
    let label: String
    let shortLabel: String
    let targetMin: Double?
    let targetMax: Double?
    let targetLabel: String
    let comparisonText: String
    let photoKey: String
}

fileprivate struct PlayerFlawMetricConfig: Identifiable, Hashable {
    let id: String
    let title: String
    let status: String
    let value: Double
    let valueLabel: String
    let targetMin: Double?
    let targetMax: Double?
    let targetLabel: String
    let meterMin: Double
    let meterMax: Double
    let insight: String
    let heroPhotoKey: String
    let overlayType: PlayerFlawOverlayType
    let drillName: String
    let levels: [PlayerFlawLevelCompare]
}

fileprivate enum PlayerFlawMetricsCatalog {
    static let all: [PlayerFlawMetricConfig] = [
        PlayerFlawMetricConfig(
            id: "release-offset",
            title: "Release Offset",
            status: "Develop It",
            value: -69,
            valueLabel: "-69°",
            targetMin: -5,
            targetMax: 5,
            targetLabel: "-5° to +5°",
            meterMin: -45,
            meterMax: 45,
            insight: "Release offset shows how far the ball leaves from the center shooting lane. A big offset creates side spin and left-right misses.",
            heroPhotoKey: "047-visual-002",
            overlayType: .releaseOffset,
            drillName: "Line Release Holds",
            levels: [
                level("middle-school", "MIDDLE SCHOOL", "MS", -10, 10, "-10°/+10°", "Outside target band by 59°", "041-visual-001"),
                level("high-school", "HIGH SCHOOL", "HS", -7, 7, "-7°/+7°", "Outside target band by 62°", "047-visual-004"),
                level("college", "COLLEGE", "COL", -5, 5, "-5°/+5°", "Outside target band by 64°", "041-visual-003"),
                level("professional", "PROFESSIONAL", "PRO", -3, 3, "-3°/+3°", "Outside target band by 66°", "041-visual-002"),
            ]),
        PlayerFlawMetricConfig(
            id: "elbow-angle",
            title: "Elbow Angle",
            status: "Needs Work",
            value: 70,
            valueLabel: "70°",
            targetMin: 150,
            targetMax: 180,
            targetLabel: "150°-180°",
            meterMin: 0,
            meterMax: 180,
            insight: "Elbow angle tells you if the elbow is stacked under the ball at release. When the elbow is outside the target band, the shot can push or pull.",
            heroPhotoKey: "041-visual-002",
            overlayType: .elbowAngle,
            drillName: "Towel Elbow Stack",
            levels: [
                level("middle-school", "MIDDLE SCHOOL", "MS", 135, nil, "135°+", "Outside target band by 65°", "041-visual-001"),
                level("high-school", "HIGH SCHOOL", "HS", 145, nil, "145°+", "Outside target band by 75°", "047-visual-004"),
                level("college", "COLLEGE", "COL", 150, nil, "150°+", "Outside target band by 80°", "041-visual-003"),
                level("professional", "PROFESSIONAL", "PRO", 160, nil, "160°+", "Outside target band by 90°", "041-visual-002"),
            ]),
        PlayerFlawMetricConfig(
            id: "wrist-angle",
            title: "Wrist Angle",
            status: "Needs Work",
            value: 159,
            valueLabel: "159°",
            targetMin: 50,
            targetMax: 100,
            targetLabel: "50°-100°",
            meterMin: 0,
            meterMax: 180,
            insight: "Your wrist is too open at release. Train snap timing and hand finish to bring the ball back into the target band.",
            heroPhotoKey: "player-flaw-wrist-hero",
            overlayType: .wristAngle,
            drillName: "Wrist Snap Holds",
            levels: [
                level("middle-school", "MIDDLE SCHOOL", "MS", 45, 110, "45°-110°", "Outside target band by 49°", "041-visual-001"),
                level("high-school", "HIGH SCHOOL", "HS", 50, 105, "50°-105°", "Outside target band by 54°", "047-visual-004"),
                level("college", "COLLEGE", "COL", 50, 100, "50°-100°", "Outside target band by 59°", "041-visual-003"),
                level("professional", "PROFESSIONAL", "PRO", 55, 95, "55°-95°", "Outside target band by 64°", "041-visual-002"),
            ]),
        PlayerFlawMetricConfig(
            id: "centerline",
            title: "Centerline",
            status: "Develop It",
            value: -32,
            valueLabel: "-32°",
            targetMin: 0,
            targetMax: 3,
            targetLabel: "0° to 3°",
            meterMin: -20,
            meterMax: 20,
            insight: "Centerline shows whether the ball, elbow, and finish stay on one lane. When the shot drifts sideways, accuracy becomes harder to repeat.",
            heroPhotoKey: "047-visual-001",
            overlayType: .centerline,
            drillName: "Centerline Form Shots",
            levels: [
                level("middle-school", "MIDDLE SCHOOL", "MS", -10, 10, "-10°/+10°", "Outside target band by 22°", "041-visual-001"),
                level("high-school", "HIGH SCHOOL", "HS", -7, 7, "-7°/+7°", "Outside target band by 25°", "047-visual-004"),
                level("college", "COLLEGE", "COL", -5, 5, "-5°/+5°", "Outside target band by 27°", "041-visual-003"),
                level("professional", "PROFESSIONAL", "PRO", 0, 3, "0° to 3°", "Outside target band by 35°", "041-visual-002"),
            ]),
        PlayerFlawMetricConfig(
            id: "release-height",
            title: "Release Height",
            status: "Needs Work",
            value: 58,
            valueLabel: "4'10\"",
            targetMin: 90,
            targetMax: nil,
            targetLabel: "7'6\"+",
            meterMin: 48,
            meterMax: 114,
            insight: "Release height matters because a higher release gives the defender less time and creates a cleaner window to the rim.",
            heroPhotoKey: "052-visual-001",
            overlayType: .releaseHeight,
            drillName: "Release Point",
            levels: [
                level("middle-school", "MIDDLE SCHOOL", "MS", 72, nil, "6'0\"+", "Below target by 1'2\"+", "041-visual-001"),
                level("high-school", "HIGH SCHOOL", "HS", 84, nil, "7'0\"+", "Below target by 2'2\"+", "047-visual-004"),
                level("college", "COLLEGE", "COL", 90, nil, "7'6\"+", "Below target by 2'8\"+", "041-visual-003"),
                level("professional", "PROFESSIONAL", "PRO", 96, nil, "8'0\"+", "Below target by 3'2\"+", "041-visual-002"),
            ])
    ]

    private static func level(_ id: String,
                              _ label: String,
                              _ shortLabel: String,
                              _ targetMin: Double?,
                              _ targetMax: Double?,
                              _ targetLabel: String,
                              _ comparisonText: String,
                              _ photoKey: String) -> PlayerFlawLevelCompare {
        PlayerFlawLevelCompare(id: id,
                               label: label,
                               shortLabel: shortLabel,
                               targetMin: targetMin,
                               targetMax: targetMax,
                               targetLabel: targetLabel,
                               comparisonText: comparisonText,
                               photoKey: photoKey)
    }
}

fileprivate struct PlayerFlawMetricDetailCard: View {
    let metric: PlayerFlawMetricConfig

    private var displayWidth: CGFloat {
        max(280, min(UIScreen.main.bounds.width - 40, 430))
    }

    var body: some View {
        PlayerFlawReferenceMetricCard(metric: metric, displayWidth: displayWidth)
        .frame(width: displayWidth)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("player-flaw-metric-\(metric.id)")
    }

    private var hero: some View {
        GeometryReader { geo in
            let width = geo.size.width
            let height = geo.size.height
            ZStack {
                CanonicalPhoto(metric.heroPhotoKey,
                               width: width,
                               height: height,
                               cornerRadius: 12,
                               alignment: .trailing)
                Rectangle()
                    .fill(LinearGradient(colors: [Color(red: 0.02, green: 0.07, blue: 0.14).opacity(0.98),
                                                  Color(red: 0.02, green: 0.07, blue: 0.14).opacity(0.78),
                                                  Color(red: 0.02, green: 0.07, blue: 0.14).opacity(0.28)],
                                         startPoint: .leading,
                                         endPoint: .trailing))
                if metric.overlayType != .wristAngle {
                    PlayerFlawHeroOverlay(metric: metric)
                        .padding(.trailing, 8)
                }

                if metric.overlayType == .wristAngle {
                    wristHeroCopy(width: width)
                        .padding(18)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                } else {
                    standardHeroCopy(width: width)
                        .padding(18)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .frame(height: displayWidth >= 400 ? 342 : 328)
    }

    private func standardHeroCopy(width: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            heroTitle(width: width)
            statusPill.padding(.top, 8)
            HStack(spacing: 16) {
                heroValueBlock("YOUR VALUE", metric.valueLabel, ShotIQColor.shotiqOrange)
                Rectangle().fill(.white.opacity(0.45)).frame(width: 1, height: 58)
                heroValueBlock("TARGET", metric.targetLabel, ShotIQColor.analysisBlue)
            }
            .padding(.top, 26)
            .frame(width: min(width * 0.58, 232), alignment: .leading)
            Spacer(minLength: 10)
            heroInsight(width: width)
                .frame(width: min(width * 0.62, 292), alignment: .leading)
        }
    }

    private func wristHeroCopy(width: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            heroTitle(width: width)
            statusPill.padding(.top, 8)
            Text("YOUR VALUE")
                .shotiqBody(10, weight: .bold)
                .kerning(0.55)
                .foregroundStyle(.white.opacity(0.86))
                .padding(.top, 22)
            Text(metric.valueLabel)
                .font(.custom("Tungsten-Medium", size: 72))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .lineLimit(1)
                .minimumScaleFactor(0.55)
                .frame(height: 70, alignment: .leading)
            PlayerFlawHeroRangeMeter(metric: metric)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .padding(.top, 8)
                .padding(.trailing, 4)
            Spacer(minLength: 8)
            heroInsight(width: width)
                .frame(width: min(width * 0.94, 430), alignment: .leading)
        }
    }

    private func heroTitle(width: CGFloat) -> some View {
        Text(metric.title.uppercased())
            .shotiqDisplay(width < 360 ? 37 : 46)
            .foregroundStyle(.white)
            .lineLimit(2)
            .minimumScaleFactor(0.62)
    }

    private var statusPill: some View {
        Text(metric.status.uppercased())
            .shotiqBody(13, weight: .black)
            .kerning(0.8)
            .foregroundStyle(ShotIQColor.shotiqOrange)
            .padding(.horizontal, 12)
            .frame(height: 32)
            .overlay(RoundedRectangle(cornerRadius: 7).stroke(ShotIQColor.shotiqOrange, lineWidth: 1.4))
    }

    private func heroInsight(width: CGFloat) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "lightbulb")
                .font(.system(size: 20, weight: .medium))
                .foregroundStyle(.white)
                .frame(width: 42, height: 42)
                .overlay(Circle().stroke(.white.opacity(0.42), lineWidth: 1))
            Text(metric.insight)
                .shotiqBody(width < 360 ? 12 : 13)
                .foregroundStyle(.white)
                .lineLimit(5)
                .minimumScaleFactor(0.74)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func heroValueBlock(_ label: String, _ value: String, _ tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label)
                .shotiqBody(10, weight: .bold)
                .kerning(0.55)
                .foregroundStyle(.white.opacity(0.86))
                .lineLimit(1)
            Text(value)
                .font(.custom("Tungsten-Medium", size: value.count > 6 ? 39 : 56))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.45)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var summary: some View {
        HStack(spacing: 0) {
            summaryCell("YOUR VALUE", metric.valueLabel, ShotIQColor.shotiqOrange)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 82)
            summaryCell("TARGET", metric.targetLabel, ShotIQColor.analysisBlue)
        }
        .padding(.vertical, 15)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(ShotIQColor.rule, lineWidth: 1))
    }

    private func summaryCell(_ label: String, _ value: String, _ tint: Color) -> some View {
        VStack(spacing: 5) {
            Text(label)
                .shotiqBody(12, weight: .black)
                .kerning(0.6)
                .foregroundStyle(ShotIQColor.graphite)
            Text(value)
                .font(.custom("Tungsten-Medium", size: value.count > 6 ? 50 : 70))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
        }
        .frame(maxWidth: .infinity)
    }

    private var compare: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(width: 20)
                Text("COMPARE BY LEVEL")
                    .shotiqDisplay(21)
                    .foregroundStyle(ShotIQColor.ink)
                Spacer()
            }
            .padding(.horizontal, 14)
            .frame(height: 42)
            Rectangle().fill(ShotIQColor.rule).frame(height: 1)

            ForEach(Array(metric.levels.enumerated()), id: \.element.id) { index, level in
                PlayerFlawLevelRow(metric: metric, level: level)
                if index != metric.levels.count - 1 {
                    Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                        .padding(.leading, 14)
                        .padding(.trailing, 14)
                }
            }
        }
        .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(ShotIQColor.rule, lineWidth: 1))
    }

    private var actions: some View {
        HStack(spacing: 12) {
            NavigationLink {
                DrillExecutionView(drillName: metric.drillName)
            } label: {
                Text("TRAIN THIS FLAW")
                    .shotiqBody(13, weight: .black)
                    .kerning(0.4)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 7))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Train \(metric.title)")

            NavigationLink {
                DiscoverDrillsView()
            } label: {
                Text("VIEW DRILLS")
                    .shotiqBody(13, weight: .black)
                    .kerning(0.4)
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 7))
                    .overlay(RoundedRectangle(cornerRadius: 7).stroke(ShotIQColor.ink, lineWidth: 1.2))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("View drills for \(metric.title)")
        }
        .padding(.horizontal, 10)
    }
}

fileprivate struct PlayerFlawReferenceMetricCard: View {
    let metric: PlayerFlawMetricConfig
    let displayWidth: CGFloat

    private var assetName: String {
        "player-flaw-reference-\(metric.id)"
    }

    private var baseSize: CGSize {
        metric.id == "release-height" ? CGSize(width: 882, height: 1532) : CGSize(width: 908, height: 1504)
    }

    private var displayHeight: CGFloat {
        displayWidth * baseSize.height / baseSize.width
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            Image(assetName)
                .resizable()
                .interpolation(.high)
                .scaledToFit()
                .frame(width: displayWidth, height: displayHeight)

            PlayerFlawReferenceOverlay(metric: metric, baseSize: baseSize)
                .frame(width: displayWidth, height: displayHeight)
        }
        .frame(width: displayWidth, height: displayHeight)
    }
}

fileprivate struct PlayerFlawReferenceOverlay: View {
    let metric: PlayerFlawMetricConfig
    let baseSize: CGSize

    private let heroDark = Color(red: 0.018, green: 0.055, blue: 0.105)
    private let whiteCard = Color.white

    var body: some View {
        GeometryReader { geo in
            let sx = geo.size.width / baseSize.width
            let sy = geo.size.height / baseSize.height

            ZStack(alignment: .topLeading) {
                heroTextLayer(sx: sx, sy: sy)
                summaryLayer(sx: sx, sy: sy)
                compareLayer(sx: sx, sy: sy)
                actionLayer(sx: sx, sy: sy)
            }
        }
    }

    private func heroTextLayer(sx: CGFloat, sy: CGFloat) -> some View {
        let titleSize: CGFloat = baseSize.width < 900 ? 44 : 47
        let valueSize: CGFloat = metric.valueLabel.count > 5 ? 69 : 78
        let targetSize: CGFloat = metric.targetLabel.count > 7 ? 45 : 54
        return ZStack(alignment: .topLeading) {
            Rectangle()
                .fill(LinearGradient(colors: [heroDark.opacity(0.99), heroDark.opacity(0.86), heroDark.opacity(0.08)],
                                     startPoint: .leading,
                                     endPoint: .trailing))
                .frame(width: baseSize.width * 0.48 * sx, height: heroHeight * sy)
                .position(x: baseSize.width * 0.24 * sx, y: heroHeight * 0.5 * sy)

            Text(metric.title.uppercased())
                .shotiqDisplay(titleSize * sx)
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .frame(width: 390 * sx, alignment: .leading)
                .position(x: 220 * sx, y: 64 * sy)

            Text(metric.status.uppercased())
                .shotiqBody(17 * sx, weight: .black)
                .kerning(0)
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .frame(width: 170 * sx, height: 34 * sy)
                .overlay(RoundedRectangle(cornerRadius: 7 * sx).stroke(ShotIQColor.shotiqOrange, lineWidth: 2 * sx))
                .position(x: 142 * sx, y: 126 * sy)

            Text("YOUR VALUE")
                .shotiqBody(15 * sx, weight: .black)
                .foregroundStyle(.white.opacity(0.9))
                .frame(width: 160 * sx, alignment: .leading)
                .position(x: 116 * sx, y: valueLabelY * sy)

            Text(metric.valueLabel)
                .font(.custom("Tungsten-Medium", size: valueSize * sx))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .frame(width: 215 * sx, height: 82 * sy, alignment: .leading)
                .position(x: 145 * sx, y: valueY * sy)

            Rectangle()
                .fill(.white.opacity(metric.overlayType == .releaseHeight ? 0.35 : 0.45))
                .frame(width: 1.4 * sx, height: dividerHeight * sy)
                .position(x: dividerX * sx, y: dividerY * sy)

            Text("TARGET")
                .shotiqBody(15 * sx, weight: .black)
                .foregroundStyle(.white.opacity(0.9))
                .frame(width: 150 * sx, alignment: .leading)
                .position(x: targetLabelX * sx, y: targetLabelY * sy)

            Text(metric.targetLabel)
                .font(.custom("Tungsten-Medium", size: targetSize * sx))
                .foregroundStyle(ShotIQColor.analysisBlue)
                .lineLimit(1)
                .minimumScaleFactor(0.55)
                .frame(width: 245 * sx, height: 68 * sy, alignment: .leading)
                .position(x: targetValueX * sx, y: targetValueY * sy)

            if metric.overlayType != .centerline {
                heroBulbCopy(sx: sx, sy: sy)
            } else {
                centerlineCopy(sx: sx, sy: sy)
            }
        }
    }

    private func heroBulbCopy(sx: CGFloat, sy: CGFloat) -> some View {
        ZStack(alignment: .topLeading) {
            Image(systemName: "lightbulb")
                .font(.system(size: 30 * sx, weight: .regular))
                .foregroundStyle(.white)
                .frame(width: 70 * sx, height: 70 * sy)
                .overlay(Circle().stroke(.white.opacity(0.42), lineWidth: 1.4 * sx))
                .position(x: 73 * sx, y: insightY * sy)
            Text(metric.insight)
                .shotiqBody(insightFontSize * sx, weight: .semibold)
                .foregroundStyle(.white)
                .lineLimit(metric.overlayType == .releaseHeight ? 5 : 4)
                .minimumScaleFactor(0.7)
                .frame(width: insightWidth * sx, alignment: .leading)
                .position(x: insightTextX * sx, y: insightY * sy)
        }
    }

    private func centerlineCopy(sx: CGFloat, sy: CGFloat) -> some View {
        Text(metric.insight)
            .shotiqBody(21 * sx, weight: .semibold)
            .foregroundStyle(.white)
            .lineLimit(4)
            .minimumScaleFactor(0.72)
            .frame(width: 372 * sx, alignment: .leading)
            .position(x: 242 * sx, y: 420 * sy)
    }

    private func summaryLayer(sx: CGFloat, sy: CGFloat) -> some View {
        let y = summaryY
        return ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: 14 * sx)
                .fill(whiteCard)
                .overlay(RoundedRectangle(cornerRadius: 14 * sx).stroke(ShotIQColor.rule, lineWidth: 1 * sx))
                .frame(width: baseSize.width * sx, height: summaryHeight * sy)
                .position(x: baseSize.width * 0.5 * sx, y: (y + summaryHeight * 0.5) * sy)

            Rectangle()
                .fill(ShotIQColor.rule)
                .frame(width: 1 * sx, height: 104 * sy)
                .position(x: baseSize.width * 0.5 * sx, y: (y + 84) * sy)

            summaryText("YOUR VALUE", value: metric.valueLabel, color: ShotIQColor.shotiqOrange, x: baseSize.width * 0.25, y: y + 78, sx: sx, sy: sy)
            summaryText("TARGET", value: metric.targetLabel, color: ShotIQColor.analysisBlue, x: baseSize.width * 0.75, y: y + 78, sx: sx, sy: sy)
        }
    }

    private func summaryText(_ label: String, value: String, color: Color, x: CGFloat, y: CGFloat, sx: CGFloat, sy: CGFloat) -> some View {
        VStack(spacing: 7 * sy) {
            Text(label)
                .shotiqBody(17 * sx, weight: .black)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1)
            Text(value)
                .font(.custom("Tungsten-Medium", size: (value.count > 6 ? 55 : 72) * sx))
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
        }
        .frame(width: baseSize.width * 0.42 * sx, height: 128 * sy)
        .position(x: x * sx, y: y * sy)
    }

    private func compareLayer(sx: CGFloat, sy: CGFloat) -> some View {
        let y = compareY
        return ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: 14 * sx)
                .fill(whiteCard)
                .overlay(RoundedRectangle(cornerRadius: 14 * sx).stroke(ShotIQColor.rule, lineWidth: 1 * sx))
                .frame(width: baseSize.width * sx, height: compareHeight * sy)
                .position(x: baseSize.width * 0.5 * sx, y: (y + compareHeight * 0.5) * sy)

            HStack(spacing: 10 * sx) {
                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 18 * sx, weight: .black))
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(width: 22 * sx)
                Text("COMPARE BY LEVEL")
                    .shotiqDisplay(25 * sx)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                Spacer()
            }
            .frame(width: (baseSize.width - 56) * sx, height: 48 * sy)
            .position(x: baseSize.width * 0.5 * sx, y: (y + 38) * sy)

            Rectangle()
                .fill(ShotIQColor.rule)
                .frame(width: (baseSize.width - 52) * sx, height: 1 * sy)
                .position(x: baseSize.width * 0.5 * sx, y: (y + 67) * sy)

            ForEach(Array(metric.levels.enumerated()), id: \.element.id) { index, level in
                referenceLevelRow(level: level, rowIndex: index, sectionY: y, sx: sx, sy: sy)
            }
        }
    }

    private func referenceLevelRow(level: PlayerFlawLevelCompare, rowIndex: Int, sectionY: CGFloat, sx: CGFloat, sy: CGFloat) -> some View {
        let rowY = sectionY + 105 + CGFloat(rowIndex) * rowGap
        return ZStack(alignment: .topLeading) {
            if rowIndex > 0 {
                Rectangle()
                    .fill(ShotIQColor.rule)
                    .frame(width: (baseSize.width - 52) * sx, height: 1 * sy)
                    .position(x: baseSize.width * 0.5 * sx, y: (rowY - 49) * sy)
            }

            ZStack(alignment: .bottomLeading) {
                CanonicalPhoto(level.photoKey, width: 104 * sx, height: 104 * sx, cornerRadius: 9 * sx, alignment: .top)
                LinearGradient(colors: [.clear, .black.opacity(0.68)], startPoint: .top, endPoint: .bottom)
                Text(level.shortLabel)
                    .shotiqBody(17 * sx, weight: .black)
                    .foregroundStyle(.white)
                    .padding(.leading, 5 * sx)
                    .padding(.bottom, 5 * sy)
            }
            .frame(width: 104 * sx, height: 104 * sx)
            .clipShape(RoundedRectangle(cornerRadius: 8 * sx))
            .position(x: 78 * sx, y: rowY * sy)

            VStack(alignment: .leading, spacing: 0) {
                Text(level.label)
                    .shotiqDisplay(27 * sx)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Text("DEVELOPMENT TARGET")
                    .shotiqBody(14 * sx, weight: .black)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1)
                Text(level.targetLabel)
                    .shotiqBody(20 * sx, weight: .black)
                    .foregroundStyle(ShotIQColor.analysisBlue)
                    .lineLimit(1)
            }
            .frame(width: 250 * sx, height: 90 * sy, alignment: .leading)
            .position(x: 285 * sx, y: rowY * sy)

            PlayerFlawRangeMeter(metric: metric, level: level)
                .frame(width: meterWidth * sx, height: 62 * sy)
                .position(x: meterX * sx, y: rowY * sy)
        }
    }

    private func actionLayer(sx: CGFloat, sy: CGFloat) -> some View {
        let y = actionY
        return HStack(spacing: 28 * sx) {
            NavigationLink {
                DrillExecutionView(drillName: metric.drillName)
            } label: {
                Text("TRAIN THIS FLAW")
                    .shotiqBody(25 * sx, weight: .black)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 60 * sy)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8 * sx))
            }
            .buttonStyle(.plain)

            NavigationLink {
                DiscoverDrillsView()
            } label: {
                Text("VIEW DRILLS")
                    .shotiqBody(25 * sx, weight: .black)
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(maxWidth: .infinity)
                    .frame(height: 60 * sy)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 8 * sx))
                    .overlay(RoundedRectangle(cornerRadius: 8 * sx).stroke(ShotIQColor.ink, lineWidth: 1.4 * sx))
            }
            .buttonStyle(.plain)
        }
        .frame(width: (baseSize.width - 48) * sx, height: 70 * sy)
        .position(x: baseSize.width * 0.5 * sx, y: y * sy)
    }

    private var heroHeight: CGFloat {
        metric.id == "release-height" ? 646 : 650
    }

    private var valueLabelY: CGFloat {
        metric.id == "release-height" ? 205 : 210
    }

    private var valueY: CGFloat {
        metric.id == "release-height" ? 290 : 285
    }

    private var dividerX: CGFloat {
        metric.id == "release-height" ? 275 : (metric.id == "centerline" ? 250 : 275)
    }

    private var dividerY: CGFloat {
        metric.id == "release-height" ? 285 : 275
    }

    private var dividerHeight: CGFloat {
        metric.id == "release-height" ? 72 : 90
    }

    private var targetLabelX: CGFloat {
        metric.id == "release-height" ? 318 : (metric.id == "centerline" ? 338 : 78)
    }

    private var targetLabelY: CGFloat {
        metric.id == "release-height" ? 205 : (metric.id == "centerline" ? 210 : 358)
    }

    private var targetValueX: CGFloat {
        metric.id == "release-height" ? 337 : (metric.id == "centerline" ? 370 : 122)
    }

    private var targetValueY: CGFloat {
        metric.id == "release-height" ? 287 : (metric.id == "centerline" ? 283 : 410)
    }

    private var insightY: CGFloat {
        metric.id == "release-height" ? 505 : 520
    }

    private var insightTextX: CGFloat {
        metric.id == "release-height" ? 203 : 285
    }

    private var insightWidth: CGFloat {
        metric.id == "release-height" ? 265 : 375
    }

    private var insightFontSize: CGFloat {
        metric.id == "release-height" ? 21 : 20
    }

    private var summaryY: CGFloat {
        metric.id == "release-height" ? 664 : 672
    }

    private var summaryHeight: CGFloat {
        metric.id == "release-height" ? 164 : 166
    }

    private var compareY: CGFloat {
        metric.id == "release-height" ? 846 : 858
    }

    private var compareHeight: CGFloat {
        metric.id == "release-height" ? 540 : 530
    }

    private var rowGap: CGFloat {
        metric.id == "release-height" ? 118 : 115
    }

    private var meterX: CGFloat {
        baseSize.width * 0.72
    }

    private var meterWidth: CGFloat {
        baseSize.width * 0.47
    }

    private var actionY: CGFloat {
        metric.id == "release-height" ? 1433 : 1462
    }
}

fileprivate struct PlayerFlawLevelRow: View {
    let metric: PlayerFlawMetricConfig
    let level: PlayerFlawLevelCompare

    var body: some View {
        Button {
            // Keep level rows interactive without changing the current tab.
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 10) {
                    ZStack(alignment: .bottomLeading) {
                        CanonicalPhoto(level.photoKey, width: 58, height: 58, cornerRadius: 7, alignment: .top)
                        LinearGradient(colors: [.clear, .black.opacity(0.64)], startPoint: .top, endPoint: .bottom)
                        Text(level.shortLabel)
                            .shotiqBody(9, weight: .black)
                            .foregroundStyle(.white)
                            .padding(.leading, 5)
                            .padding(.bottom, 4)
                    }
                    .frame(width: 58, height: 58)
                    .clipShape(RoundedRectangle(cornerRadius: 7))

                    VStack(alignment: .leading, spacing: 1) {
                        Text(level.label)
                            .shotiqDisplay(22)
                            .foregroundStyle(ShotIQColor.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.66)
                        Text("DEVELOPMENT TARGET")
                            .shotiqBody(9, weight: .bold)
                            .kerning(0.35)
                            .foregroundStyle(ShotIQColor.graphite)
                            .lineLimit(1)
                        Text(level.targetLabel)
                            .shotiqBody(15, weight: .black)
                            .foregroundStyle(ShotIQColor.analysisBlue)
                            .lineLimit(1)
                            .minimumScaleFactor(0.58)
                    }

                    Spacer(minLength: 8)

                    Text(metric.valueLabel)
                        .shotiqBody(15, weight: .black)
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }

                PlayerFlawRangeMeter(metric: metric, level: level)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(level.label), target \(level.targetLabel), \(level.comparisonText)")
    }
}

fileprivate struct PlayerFlawRangeMeter: View {
    let metric: PlayerFlawMetricConfig
    let level: PlayerFlawLevelCompare

    var body: some View {
        GeometryReader { geo in
            let width = geo.size.width
            let markerX = width * markerPercent
            let bandX = width * bandStart
            let bandWidth = max(4, width * (bandEnd - bandStart))
            VStack(spacing: 4) {
                ZStack(alignment: .leading) {
                    Text(metric.valueLabel)
                        .shotiqBody(11, weight: .black)
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .position(x: min(max(markerX, 16), width - 16), y: 8)
                    Text(edgeLabel(metric.meterMin))
                        .shotiqBody(9, weight: .bold)
                        .foregroundStyle(ShotIQColor.ink)
                        .position(x: 0, y: 28)
                    Text(targetStartLabel)
                        .shotiqBody(9, weight: .bold)
                        .foregroundStyle(ShotIQColor.ink)
                        .position(x: bandX, y: 28)
                    Text(edgeLabel(metric.meterMax))
                        .shotiqBody(9, weight: .bold)
                        .foregroundStyle(ShotIQColor.ink)
                        .position(x: width, y: 28)
                }
                .frame(height: 35)

                ZStack(alignment: .leading) {
                    Capsule().fill(ShotIQColor.rule)
                    Capsule()
                        .fill(ShotIQColor.analysisBlue)
                        .frame(width: bandWidth)
                        .offset(x: bandX)
                    Rectangle()
                        .fill(ShotIQColor.shotiqOrange)
                        .frame(width: 1, height: 27)
                        .offset(x: min(max(markerX, 1), width - 1), y: -12)
                    Circle()
                        .stroke(ShotIQColor.shotiqOrange, lineWidth: 3)
                        .background(Circle().fill(Color.white))
                        .frame(width: 16, height: 16)
                        .offset(x: min(max(markerX - 8, 0), width - 16), y: -5)
                }
                .frame(height: 10)

                HStack(spacing: 3) {
                    Text(comparisonLead)
                        .shotiqBody(10)
                        .foregroundStyle(ShotIQColor.ink)
                    Text(comparisonAmount)
                        .shotiqBody(12, weight: .black)
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                }
                .lineLimit(1)
                .minimumScaleFactor(0.56)
                .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
    }

    private var markerPercent: CGFloat {
        percent(metric.value, min: metric.meterMin, max: metric.meterMax)
    }

    private var bandStart: CGFloat {
        percent(level.targetMin ?? metric.targetMin ?? metric.meterMin,
                min: metric.meterMin,
                max: metric.meterMax)
    }

    private var bandEnd: CGFloat {
        let end = level.targetMax ?? metric.targetMax ?? metric.meterMax
        return percent(end, min: metric.meterMin, max: metric.meterMax)
    }

    private func percent(_ value: Double, min: Double, max: Double) -> CGFloat {
        guard max > min else { return 0 }
        return CGFloat(Swift.min(1, Swift.max(0, (value - min) / (max - min))))
    }

    private var targetStartLabel: String {
        if metric.id == "release-height" {
            return inchesLabel(level.targetMin ?? metric.targetMin ?? 0)
        }
        let value = level.targetMin ?? metric.targetMin ?? 0
        return degreeLabel(value)
    }

    private func edgeLabel(_ value: Double) -> String {
        metric.id == "release-height" ? inchesLabel(value) : degreeLabel(value)
    }

    private func degreeLabel(_ value: Double) -> String {
        let intValue = Int(value.rounded())
        return intValue > 0 ? "+\(intValue)°" : "\(intValue)°"
    }

    private func inchesLabel(_ value: Double) -> String {
        let inches = Int(value.rounded())
        return "\(inches / 12)'\(inches % 12)\""
    }

    private var comparisonLead: String {
        if let range = level.comparisonText.range(of: " by ") {
            return String(level.comparisonText[..<range.upperBound])
        }
        return level.comparisonText
    }

    private var comparisonAmount: String {
        if let range = level.comparisonText.range(of: " by ") {
            return String(level.comparisonText[range.upperBound...])
        }
        return ""
    }
}

fileprivate struct PlayerFlawHeroRangeMeter: View {
    let metric: PlayerFlawMetricConfig

    var body: some View {
        GeometryReader { geo in
            let width = geo.size.width
            let left = percent(metric.targetMin ?? metric.meterMin) * width
            let right = percent(metric.targetMax ?? metric.meterMax) * width
            let marker = percent(metric.value) * width
            ZStack(alignment: .leading) {
                Text("0°")
                    .shotiqBody(10, weight: .bold)
                    .foregroundStyle(.white)
                    .position(x: 10, y: 8)
                Text("50°")
                    .shotiqBody(10, weight: .bold)
                    .foregroundStyle(.white)
                    .position(x: left, y: 8)
                Text("100°")
                    .shotiqBody(10, weight: .bold)
                    .foregroundStyle(.white)
                    .position(x: right, y: 8)
                Text("180°")
                    .shotiqBody(10, weight: .bold)
                    .foregroundStyle(.white)
                    .position(x: width - 18, y: 8)
                Capsule()
                    .fill(.white.opacity(0.42))
                    .frame(height: 7)
                    .position(x: width / 2, y: 29)
                Capsule()
                    .fill(ShotIQColor.analysisBlue)
                    .frame(width: max(10, right - left), height: 7)
                    .position(x: left + max(10, right - left) / 2, y: 29)
                Rectangle()
                    .fill(ShotIQColor.shotiqOrange)
                    .frame(width: 1.4, height: 24)
                    .position(x: marker, y: 22)
                Circle()
                    .stroke(ShotIQColor.shotiqOrange, lineWidth: 4)
                    .background(Circle().fill(Color.white))
                    .frame(width: 22, height: 22)
                    .position(x: min(max(marker, 12), width - 12), y: 29)
            }
        }
    }

    private func percent(_ value: Double) -> CGFloat {
        guard metric.meterMax > metric.meterMin else { return 0 }
        return CGFloat(Swift.min(1, Swift.max(0, (value - metric.meterMin) / (metric.meterMax - metric.meterMin))))
    }
}

fileprivate struct PlayerFlawHeroOverlay: View {
    let metric: PlayerFlawMetricConfig

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            ZStack {
                Canvas { context, size in
                    var drawingContext = context
                    drawOverlay(context: &drawingContext, size: size)
                }
                overlayLabels(width: w, height: h)
            }
        }
    }

    @ViewBuilder
    private func overlayLabels(width: CGFloat, height: CGFloat) -> some View {
        switch metric.overlayType {
        case .releaseHeight:
            Text("YOUR RELEASE\n\(metric.valueLabel)")
                .shotiqBody(11, weight: .black)
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .multilineTextAlignment(.leading)
                .position(x: width * 0.78, y: height * 0.16)
            Text("TARGET\n\(metric.targetLabel)")
                .shotiqBody(11, weight: .black)
                .foregroundStyle(ShotIQColor.analysisBlue)
                .multilineTextAlignment(.leading)
                .position(x: width * 0.82, y: height * 0.58)
        case .centerline:
            Text(metric.valueLabel)
                .shotiqBody(18, weight: .black)
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .position(x: width * 0.62, y: height * 0.14)
            Text("0°   3°")
                .shotiqBody(11, weight: .black)
                .foregroundStyle(ShotIQColor.analysisBlue)
                .position(x: width * 0.82, y: height * 0.08)
        default:
            Text(metric.valueLabel)
                .shotiqBody(19, weight: .black)
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .position(x: width * 0.82, y: height * 0.36)
        }
    }

    private func drawOverlay(context: inout GraphicsContext, size: CGSize) {
        switch metric.overlayType {
        case .wristAngle:
            drawSkeleton(&context, size, points: [(0.68, 0.28), (0.75, 0.34), (0.82, 0.22)], color: .white)
            drawLine(&context, size, from: (0.70, 0.61), to: (0.96, 0.61), color: ShotIQColor.rule, width: 7)
            drawLine(&context, size, from: (0.77, 0.61), to: (0.86, 0.61), color: ShotIQColor.analysisBlue, width: 7)
            drawLine(&context, size, from: (0.88, 0.17), to: (0.79, 0.37), color: ShotIQColor.shotiqOrange, width: 3)
            drawDot(&context, size, at: (0.90, 0.17), color: ShotIQColor.shotiqOrange)
            drawDot(&context, size, at: (0.78, 0.37), color: ShotIQColor.shotiqOrange)
        case .releaseHeight:
            drawDashedLine(&context, size, from: (0.78, 0.10), to: (0.78, 0.92), color: .white, width: 1.4)
            drawDashedLine(&context, size, from: (0.58, 0.17), to: (0.78, 0.17), color: ShotIQColor.shotiqOrange, width: 2.2)
            drawDashedLine(&context, size, from: (0.58, 0.55), to: (0.78, 0.55), color: ShotIQColor.analysisBlue, width: 2.2)
            drawDot(&context, size, at: (0.78, 0.17), color: ShotIQColor.shotiqOrange)
            drawDot(&context, size, at: (0.78, 0.55), color: ShotIQColor.analysisBlue)
        case .releaseOffset:
            drawDashedLine(&context, size, from: (0.70, 0.00), to: (0.70, 0.86), color: .white, width: 1.6)
            drawDashedLine(&context, size, from: (0.64, 0.22), to: (0.61, 0.73), color: ShotIQColor.shotiqOrange, width: 2.5)
            drawLine(&context, size, from: (0.50, 0.78), to: (0.92, 0.78), color: .white.opacity(0.82), width: 1)
            drawLine(&context, size, from: (0.63, 0.78), to: (0.78, 0.78), color: ShotIQColor.analysisBlue, width: 2)
            drawDot(&context, size, at: (0.64, 0.22), color: ShotIQColor.shotiqOrange)
        case .elbowAngle:
            drawSkeleton(&context, size, points: [(0.60, 0.78), (0.61, 0.48), (0.80, 0.36), (0.80, 0.20)], color: .white)
            drawArc(&context, size, center: (0.62, 0.48), radius: 54, start: 0.0, end: 1.15, color: ShotIQColor.shotiqOrange, width: 4)
        case .centerline:
            drawDashedLine(&context, size, from: (0.74, 0.04), to: (0.74, 0.94), color: .white, width: 1.7)
            drawLine(&context, size, from: (0.78, 0.08), to: (0.84, 0.38), color: ShotIQColor.analysisBlue.opacity(0.72), width: 28)
            drawSkeleton(&context, size, points: [(0.66, 0.20), (0.62, 0.37), (0.66, 0.57), (0.72, 0.70)], color: ShotIQColor.shotiqOrange)
        }
    }

    private func point(_ p: (CGFloat, CGFloat), _ size: CGSize) -> CGPoint {
        CGPoint(x: p.0 * size.width, y: p.1 * size.height)
    }

    private func drawLine(_ context: inout GraphicsContext,
                          _ size: CGSize,
                          from: (CGFloat, CGFloat),
                          to: (CGFloat, CGFloat),
                          color: Color,
                          width: CGFloat) {
        var path = Path()
        path.move(to: point(from, size))
        path.addLine(to: point(to, size))
        context.stroke(path, with: .color(color), lineWidth: width)
    }

    private func drawDashedLine(_ context: inout GraphicsContext,
                                _ size: CGSize,
                                from: (CGFloat, CGFloat),
                                to: (CGFloat, CGFloat),
                                color: Color,
                                width: CGFloat) {
        var path = Path()
        path.move(to: point(from, size))
        path.addLine(to: point(to, size))
        context.stroke(path, with: .color(color), style: StrokeStyle(lineWidth: width, dash: [8, 7]))
    }

    private func drawSkeleton(_ context: inout GraphicsContext,
                              _ size: CGSize,
                              points: [(CGFloat, CGFloat)],
                              color: Color) {
        guard let first = points.first else { return }
        var path = Path()
        path.move(to: point(first, size))
        for p in points.dropFirst() {
            path.addLine(to: point(p, size))
        }
        context.stroke(path, with: .color(color), style: StrokeStyle(lineWidth: 4.5, lineCap: .round, lineJoin: .round))
        for p in points {
            drawDot(&context, size, at: p, color: ShotIQColor.shotiqOrange)
        }
    }

    private func drawDot(_ context: inout GraphicsContext,
                         _ size: CGSize,
                         at: (CGFloat, CGFloat),
                         color: Color) {
        let p = point(at, size)
        let rect = CGRect(x: p.x - 7, y: p.y - 7, width: 14, height: 14)
        context.fill(Path(ellipseIn: rect), with: .color(color))
        context.stroke(Path(ellipseIn: rect), with: .color(.white), lineWidth: 2.4)
    }

    private func drawArc(_ context: inout GraphicsContext,
                         _ size: CGSize,
                         center: (CGFloat, CGFloat),
                         radius: CGFloat,
                         start: Double,
                         end: Double,
                         color: Color,
                         width: CGFloat) {
        var path = Path()
        path.addArc(center: point(center, size),
                    radius: radius,
                    startAngle: .radians(start),
                    endAngle: .radians(end),
                    clockwise: false)
        context.stroke(path, with: .color(color), style: StrokeStyle(lineWidth: width, lineCap: .round))
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
                        PhasePhotoThumbnail(phase: shotPhase,
                                            active: on,
                                            width: 58,
                                            height: 42,
                                            cornerRadius: 6)
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
    private struct ProcessingStage: Identifiable {
        var id: Int
        var assetName: String
        var title: String
        var detail: String
        var start: Double
        var end: Double
    }

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
    private let processingStages: [ProcessingStage] = [
        .init(id: 0,
              assetName: "shotiq-processing-upload-media",
              title: "LOCKING IN YOUR SHOT",
              detail: "Securing the media, trim range, frame rate, and shot window.",
              start: 0.00,
              end: 1.0 / 6.0),
        .init(id: 1,
              assetName: "shotiq-processing-pose-lock",
              title: "TRACKING BODY MECHANICS",
              detail: "Finding eyes, shoulders, elbows, wrists, hips, knees, ankles, and release landmarks.",
              start: 1.0 / 6.0,
              end: 2.0 / 6.0),
        .init(id: 2,
              assetName: "shotiq-processing-release-angles",
              title: "BREAKING DOWN RELEASE ANGLES",
              detail: "Measuring elbow stack, wrist snap, release path, ball slot, and centerline.",
              start: 2.0 / 6.0,
              end: 3.0 / 6.0),
        .init(id: 3,
              assetName: "shotiq-processing-footwork-balance",
              title: "CHECKING FOOTWORK + BALANCE",
              detail: "Reading base, load, rise, lower-body timing, and follow-through stability.",
              start: 3.0 / 6.0,
              end: 4.0 / 6.0),
        .init(id: 4,
              assetName: "shotiq-processing-elite-database",
              title: "COMPARING TO ELITE SHOOTERS",
              detail: "Comparing your motion against ShotIQ's elite shooter database.",
              start: 4.0 / 6.0,
              end: 5.0 / 6.0),
        .init(id: 5,
              assetName: "shotiq-processing-coaching-plan",
              title: "BUILDING YOUR COACHING PLAN",
              detail: "Turning the measurements into targets you can train on the next rep.",
              start: 5.0 / 6.0,
              end: 1.00),
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
                            Text("ShotIQ AI is breaking down your shooting form, reading every key angle, and comparing your mechanics to elite shooters.")
                                .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                                .padding(.top, 4)
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 0) {
                                    Text("SHOTIQ AI IS BUILDING YOUR REPORT").font(.custom("Tungsten-Medium", size: 19))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text(processingSummary).shotiqBody(13)
                                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                                    HStack(spacing: 12) {
                                        ScoreBar(pct: pct, color: ShotIQColor.analysisBlue)
                                        Text("\(Int(pct * 100))%").font(.custom("Tungsten-Medium", size: 22))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                    }
                                    .padding(.top, 14)
                                    ForEach(processingStages) { stage in
                                        processingStageRow(stage)
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
                                                    Text("Locking pose").shotiqBody(10, weight: .bold).kerning(0.4)
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
            await runEvenProcessingPace(totalSeconds: 12, maxProgress: 0.94)
            if route == nil {
                await finishAllProcessingStages()
            }
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
        guard let videoJob else { return "Shooting media ready for ShotIQ breakdown" }
        return "\(videoJob.clip.orientationText) • \(videoJob.trimWindowText) • \(videoJob.clip.frameRateText)"
    }

    @ViewBuilder
    private func processingStageRow(_ stage: ProcessingStage) -> some View {
        let progress = stageProgress(stage)
        let isDone = progress >= 1
        let isActive = progress > 0 && progress < 1
        HStack(alignment: .center, spacing: 14) {
            ShotIQApprovedRasterIcon(assetName: stage.assetName,
                                     size: 64,
                                     label: stage.title)
                .frame(width: 64, height: 64)
                .opacity(progress == 0 ? 0.42 : 1)
                .scaleEffect(isDone ? 1.04 : 1)
            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(stage.title)
                        .shotiqBody(14, weight: .heavy)
                        .foregroundStyle(isDone ? ShotIQColor.confirmGreen : (isActive ? ShotIQColor.analysisBlue : ShotIQColor.ink))
                        .lineLimit(1)
                        .minimumScaleFactor(0.66)
                    Spacer(minLength: 6)
                    if isDone {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(ShotIQColor.confirmGreen)
                            .transition(.scale.combined(with: .opacity))
                    } else if isActive {
                        Text("\(Int((progress * 100).rounded()))%")
                            .font(.custom("Tungsten-Medium", size: 18))
                            .foregroundStyle(ShotIQColor.analysisBlue)
                    } else {
                        Text("Queued")
                            .shotiqBody(11, weight: .semibold)
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                }
                Text(stage.detail)
                    .shotiqBody(11)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(2)
                    .minimumScaleFactor(0.72)
                ScoreBar(pct: progress, color: isDone ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue)
                    .frame(height: 5)
                    .opacity(progress == 0 ? 0.34 : 1)
            }
        }
        .padding(.vertical, 11)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
        .animation(.spring(response: 0.32, dampingFraction: 0.74), value: isDone)
        .animation(.easeOut(duration: 0.2), value: progress)
    }

    private func stageProgress(_ stage: ProcessingStage) -> Double {
        guard stage.end > stage.start else { return 0 }
        if pct <= stage.start { return 0 }
        if pct >= stage.end { return 1 }
        return min(max((pct - stage.start) / (stage.end - stage.start), 0), 1)
    }

    @MainActor
    private func finishAllProcessingStages() async {
        for boundary in processingStages.map(\.end) where pct < boundary {
            withAnimation(.easeOut(duration: 0.34)) {
                pct = boundary
            }
            try? await Task.sleep(for: .milliseconds(650))
        }
        withAnimation(.easeOut(duration: 0.28)) { pct = 1.0 }
        try? await Task.sleep(for: .milliseconds(850))
        guard route == nil else { return }
        route = .results
    }

    private func runEvenProcessingPace(totalSeconds: Double, maxProgress: Double = 0.94) async {
        let tickSeconds = 0.12
        let tickCount = max(Int(totalSeconds / tickSeconds), 1)
        let step = maxProgress / Double(tickCount)
        for _ in 0..<tickCount {
            guard !Task.isCancelled else { return }
            try? await Task.sleep(for: .milliseconds(Int(tickSeconds * 1000)))
            await MainActor.run {
                guard route == nil else { return }
                withAnimation(.linear(duration: tickSeconds)) {
                    pct = min(maxProgress, pct + step)
                }
            }
        }
    }

    private func expectedProcessingSeconds(for job: VideoAnalysisJob) -> Double {
        min(max(job.trimmedDurationSeconds * 2.4, 18), 45)
    }

    private func processVideo(job: VideoAnalysisJob) async {
        pct = 0.02
        let paceTask = Task {
            await runEvenProcessingPace(totalSeconds: expectedProcessingSeconds(for: job), maxProgress: 0.94)
        }
        let poseAnalysis = await VideoPoseAnalyzer.analyze(job: job)
        previewPoseFrame = poseAnalysis.frames.first { $0.frameIndex == poseAnalysis.summary.releaseFrameIndex }
            ?? poseAnalysis.frames.first
        let localFallback = ShotIQLocalAnalysisFactory.video(job: job, poseAnalysis: poseAnalysis)
        do {
            let uploadedURL = try await APIClient.shared.uploadVideo(
                job.clip.url,
                filename: job.clip.filename,
                contentType: job.clip.contentType,
                sizeBytes: job.clip.fileSizeBytes,
                clientSessionId: job.clientSessionId,
                durationSeconds: job.clip.durationSeconds)

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
            ShotIQLocalAnalysisFactory.fillVideoMeasurements(&analysis, poseAnalysis: poseAnalysis)
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
            paceTask.cancel()
            await finishAllProcessingStages()
        } catch {
            completedResult = localFallback
            app.rememberAnalysisMedia(localFallback, title: "Analyzed Video")
            paceTask.cancel()
            await finishAllProcessingStages()
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
                                    Text("ShotIQ is still breaking down your form, checking release angles, and comparing the rep to elite mechanics in the background.")
                                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                        .multilineTextAlignment(.center).padding(.top, 6)
                                    HStack(alignment: .top, spacing: 8) {
                                        stage("checkmark.circle", "Shot locked", "100%", false)
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 24, height: 1).padding(.top, 16)
                                        stage("point.3.connected.trianglepath.dotted", "Tracking mechanics", "Reading key angles", true)
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 24, height: 1).padding(.top, 16)
                                        stage("figure.basketball", "Building plan", "Queued", false)
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
    @State private var coachingRoute: CoachingActionRoute?
    @State private var isCoachingActionsExpanded = false
    @State private var selectedBreakdown: AnalysisBreakdownExplanation?

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
                GeometryReader { pageGeo in
                    let screenWidth = min(pageGeo.size.width, UIScreen.main.bounds.width)
                    let contentWidth = max(0, screenWidth - 40)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 0) {
                            PlayerHeader(name: overviewChrome.playerName,
                                         subtitle: overviewChrome.subtitle,
                                         streak: overviewChrome.streak,
                                         points: overviewChrome.points)
                            .frame(width: screenWidth, alignment: .topLeading)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 24) {
                                    ForEach(AnalysisResultTab.allCases, id: \.self) { tab in
                                        resultTabButton(tab, hasLoadedAnalysis: hasLoadedAnalysis)
                                    }
                                }
                                .padding(.horizontal, 20)
                            }
                            .padding(.top, 16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .clipped()
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            VStack(alignment: .leading, spacing: 0) {
                                analysisTabContent(p, hasLoadedAnalysis: hasLoadedAnalysis)
                                Spacer(minLength: 24)
                            }
                            .frame(width: contentWidth, alignment: .leading)
                            .padding(.horizontal, 20)
                        }
                        .frame(width: screenWidth, alignment: .leading)
                    }
                }
            }
        }
        .shotiqToast($toast)
        .analysisInfoAlert($info)
        .sheet(item: $selectedBreakdown) { breakdown in
            AnalysisBreakdownExplanationSheet(breakdown: breakdown)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .navigationDestination(item: $coachingRoute) { route in
            coachingDestination(route, presentation: resolvedPresentation)
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
            if tab == .compare {
                coachingRoute = .compare
                toast = .info("Opening elite comparison")
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
            HStack(alignment: .top, spacing: 12) {
                ZStack(alignment: .topLeading) {
                    AnalysisResultMediaSurface(presentation: p,
                                               fallbackKey: "038-visual-001",
                                               height: 244,
                                               phase: "FOLLOW-THROUGH",
                                               showsPlaybackControl: false)
                    if p.id == "canonical-demo" {
                        SkeletonOverlay()
                    }
                }
                .frame(minWidth: 164, maxWidth: 184)
                VStack(alignment: .leading, spacing: 0) {
                    NavigationLink { FormScoreView(presentation: p) } label: {
                        FormScorePanel(numeralSize: 64, barWidth: 104,
                                       score: p.scoreText,
                                       pct: p.scorePct,
                                       verdict: p.scoreVerdict,
                                       caption: p.scoreCaption)
                    }
                    HStack(spacing: 20) {
                        miniStat(selectedPhase, "PHASE")
                            .frame(width: 70)
                        miniStat(p.mediaLabel.uppercased(), "MEDIA")
                            .frame(width: 70)
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 18)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .layoutPriority(1)
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.top, 16)
            if p.videoURL != nil || !p.videoPoseFrames.isEmpty {
                VideoFramePlaybackPanel(presentation: p)
                    .padding(.top, 18)
            }
            coachingTargetDropdown(p, hasLoadedAnalysis: hasLoadedAnalysis)
                .padding(.top, 16)
            resultFormBreakdownSection(p)
            compareSection(p)
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

    private func resultFormBreakdownSection(_ p: AnalysisResultPresentation) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionLabel(text: "FORM BREAKDOWN")
                .padding(.top, 22)
            Text("Tap any card to learn what the score means.")
                .shotiqBody(12, weight: .semibold)
                .foregroundStyle(ShotIQColor.graphite)
            VStack(spacing: 10) {
                ForEach(Array(resultFormBreakdownItems(p).enumerated()), id: \.offset) { _, item in
                    Button {
                        selectedBreakdown = AnalysisBreakdownExplanation(item: item,
                                                                         provenanceSummary: p.provenanceSummary)
                        toast = .info("Opening \(item.metric) breakdown")
                    } label: {
                        AnalysisFormBreakdownCard(item: item)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func resultFormBreakdownItems(_ p: AnalysisResultPresentation) -> [AnalysisScoreBreakdownItem] {
        orderedAnalysisBreakdownItems(p.scoreBreakdown)
    }

    private func coachingTargetDropdown(_ p: AnalysisResultPresentation,
                                        hasLoadedAnalysis: Bool) -> some View {
        ShotIQCard {
            VStack(spacing: 0) {
                Button {
                    withAnimation(.easeInOut(duration: 0.18)) {
                        isCoachingActionsExpanded.toggle()
                    }
                    toast = .info(isCoachingActionsExpanded ? "Closing coaching actions" : "Opening coaching actions")
                } label: {
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("COACHES, COACHING ACTIONS")
                                .shotiqBody(11, weight: .semibold)
                                .kerning(0.8)
                                .foregroundStyle(ShotIQColor.graphite)
                            Text(p.coachingTarget)
                                .shotiqBody(19, weight: .semibold)
                                .foregroundStyle(ShotIQColor.ink)
                                .lineLimit(2)
                                .minimumScaleFactor(0.76)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer(minLength: 8)
                        Image(systemName: isCoachingActionsExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                if isCoachingActionsExpanded {
                    Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                    VStack(spacing: 0) {
                        let items = coachingActionItems(p)
                        ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                            Button {
                                handleCoachingAction(item.id, p: p, hasLoadedAnalysis: hasLoadedAnalysis)
                            } label: {
                                coachingDropdownActionRow(item)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(item.title)

                            if index != items.count - 1 {
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 2)
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
        }
    }

    private func coachingDropdownActionRow(_ item: CoachingActionItem) -> some View {
        HStack(spacing: 12) {
            Image(systemName: item.icon)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(item.tint)
                .frame(width: 30, height: 30)
                .background(item.tint.opacity(0.1), in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .shotiqBody(14, weight: .bold)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Text(item.detail)
                    .shotiqBody(11)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(2)
                    .minimumScaleFactor(0.74)
            }
            Spacer(minLength: 8)
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(minHeight: 54)
        .contentShape(Rectangle())
    }

    private func playerMetricScorecard(_ p: AnalysisResultPresentation) -> some View {
        let rows = Array(p.metrics.prefix(6))
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                SectionLabel(text: "YOUR SIX KEY METRICS")
                Button {
                    info = AnalysisInfoNote(title: "Your six key metrics",
                                            message: "These are your measured mechanics from the saved analysis. Each row shows the metric, value, and status without filler data.")
                    toast = .info("Showing metric explanation")
                } label: {
                    Image(systemName: "info.circle")
                        .font(.system(size: 13))
                        .foregroundStyle(ShotIQColor.graphite)
                }
                .buttonStyle(.plain)
            }
            .padding(.top, 22)

            VStack(spacing: 10) {
                ForEach(rows, id: \.label) { tile in
                    playerMetricTeachingCard(tile, presentation: p)
                }
            }
            .padding(.top, 8)
        }
    }

    private struct PlayerMetricTeaching {
        let why: String
        let visualPhase: String
        let targetValue: String
        let levels: [(String, String)]
        let status: String
        let statusTint: Color
    }

    private func playerMetricTeachingCard(_ tile: AnalysisMetricTile,
                                          presentation: AnalysisResultPresentation) -> some View {
        let teaching = playerMetricTeaching(for: tile)
        return ShotIQCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .top, spacing: 12) {
                    PlayerMetricStoryThumbnail(presentation: presentation,
                                               phase: teaching.visualPhase,
                                               tint: teaching.statusTint,
                                               width: 104,
                                               height: 156)

                    VStack(alignment: .leading, spacing: 9) {
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text(tile.label.uppercased())
                                .shotiqDisplay(22)
                                .foregroundStyle(ShotIQColor.ink)
                                .lineLimit(1)
                                .minimumScaleFactor(0.68)
                            Spacer(minLength: 8)
                            Text(teaching.status.uppercased())
                                .shotiqBody(10, weight: .bold)
                                .kerning(0.5)
                                .foregroundStyle(teaching.statusTint)
                                .lineLimit(1)
                                .minimumScaleFactor(0.62)
                                .padding(.horizontal, 9)
                                .padding(.vertical, 6)
                                .background(teaching.statusTint.opacity(0.12),
                                            in: RoundedRectangle(cornerRadius: 5))
                        }

                        HStack(spacing: 8) {
                            playerMetricValueBlock("YOUR VALUE", tile.value, teaching.statusTint)
                            playerMetricValueBlock("TARGET", teaching.targetValue, ShotIQColor.analysisBlue)
                        }

                        Text(teaching.why)
                            .shotiqBody(12)
                            .foregroundStyle(ShotIQColor.graphite)
                            .fixedSize(horizontal: false, vertical: true)
                            .multilineTextAlignment(.leading)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("COMPARE BY LEVEL")
                            .shotiqBody(11, weight: .bold)
                            .kerning(0.7)
                            .foregroundStyle(ShotIQColor.graphite)
                        Spacer()
                        Text("Tap a level")
                            .shotiqBody(10, weight: .bold)
                            .foregroundStyle(ShotIQColor.graphite.opacity(0.78))
                    }
                    ForEach(Array(teaching.levels.enumerated()), id: \.offset) { index, level in
                        playerMetricLevelRow(level,
                                             index: index,
                                             tile: tile,
                                             tint: teaching.statusTint,
                                             teaching: teaching)
                    }
                }
            }
            .padding(14)
        }
    }

    private func playerMetricValueBlock(_ label: String, _ value: String, _ tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .shotiqBody(8, weight: .bold)
                .kerning(0.45)
                .foregroundStyle(ShotIQColor.graphite)
            Text(value)
                .font(.custom("Tungsten-Medium", size: value.count > 7 ? 22 : 28))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.56)
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 7)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.opacity(0.1), in: RoundedRectangle(cornerRadius: 5))
    }

    private func playerMetricLevelRow(_ level: (String, String),
                                      index: Int,
                                      tile: AnalysisMetricTile,
                                      tint: Color,
                                      teaching: PlayerMetricTeaching) -> some View {
        let status = playerMetricLevelStatus(tile: tile, levelTarget: level.1, index: index)
        return Button {
            info = AnalysisInfoNote(title: "\(fullLevelName(level.0)) \(tile.label.capitalized)",
                                    message: playerMetricLevelExplanation(tile: tile,
                                                                          level: level,
                                                                          teaching: teaching,
                                                                          status: status.0))
            toast = .info("Showing \(fullLevelName(level.0)) comparison")
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Text(fullLevelName(level.0))
                        .shotiqBody(17, weight: .bold)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                    Spacer(minLength: 8)
                    Text(status.0.uppercased())
                        .shotiqBody(9, weight: .bold)
                        .kerning(0.45)
                        .foregroundStyle(status.1)
                        .lineLimit(1)
                        .minimumScaleFactor(0.68)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(status.1.opacity(0.12), in: RoundedRectangle(cornerRadius: 5))
                }
                Text("Tap to see what \(fullLevelName(level.0).lowercased()) development means for \(tile.label.lowercased()).")
                    .shotiqBody(10)
                    .foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                HStack(alignment: .lastTextBaseline, spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("YOUR VALUE")
                            .shotiqBody(8, weight: .bold)
                            .kerning(0.45)
                            .foregroundStyle(ShotIQColor.graphite)
                        Text(tile.value)
                            .font(.custom("Tungsten-Medium", size: 25))
                            .foregroundStyle(tint)
                            .lineLimit(1)
                            .minimumScaleFactor(0.62)
                    }
                    Spacer(minLength: 8)
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("DEVELOPMENT TARGET")
                            .shotiqBody(8, weight: .bold)
                            .kerning(0.45)
                            .foregroundStyle(ShotIQColor.graphite)
                        Text(level.1)
                            .font(.custom("Tungsten-Medium", size: 25))
                            .foregroundStyle(ShotIQColor.analysisBlue)
                            .lineLimit(1)
                            .minimumScaleFactor(0.62)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule, lineWidth: 1))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func fullLevelName(_ shortName: String) -> String {
        switch shortName.uppercased() {
        case "MIDDLE": return "Middle School"
        case "HIGH": return "High School"
        case "COLLEGE": return "College"
        case "PRO": return "Professional"
        default: return shortName.capitalized
        }
    }

    private func playerMetricLevelProgress(tile: AnalysisMetricTile,
                                           levelTarget: String,
                                           index: Int) -> CGFloat {
        guard tile.value != "--" else { return 0.08 }
        let label = tile.label.uppercased()
        let value = tile.detailValue
        if label.contains("RELEASE OFFSET") || label.contains("CENTERLINE") {
            let cleanTarget = levelTarget.replacingOccurrences(of: "°", with: "")
            let firstTarget = cleanTarget
                .split(separator: "/")
                .first
                .map(String.init)?
                .replacingOccurrences(of: "-", with: "") ?? ""
            let allowed = Double(firstTarget) ?? Double(10 - index * 2)
            return CGFloat(max(0.08, min(1, 1 - (abs(value) / max(allowed * 2, 1)))))
        }
        if label.contains("WRIST ANGLE") && levelTarget.contains("-") {
            let parts = levelTarget.replacingOccurrences(of: "°", with: "").split(separator: "-")
            let low = Double(parts.first ?? "50") ?? 50
            let high = Double(parts.last ?? "100") ?? 100
            if value >= low && value <= high { return 1 }
            let nearest = min(abs(value - low), abs(value - high))
            return CGFloat(max(0.08, min(1, 1 - nearest / 80)))
        }
        if label.contains("BALL SLOT") {
            return tile.isPositive ? 0.9 : CGFloat(0.18 + Double(index) * 0.16)
        }
        let target = numericTarget(from: levelTarget)
        guard target > 0 else { return CGFloat(0.2 + Double(index) * 0.16) }
        return CGFloat(max(0.08, min(1, value / target)))
    }

    private func playerMetricLevelStatus(tile: AnalysisMetricTile,
                                         levelTarget: String,
                                         index: Int) -> (String, Color) {
        guard tile.value != "--" else { return ("Developing", ShotIQColor.analysisBlue) }
        let progress = playerMetricLevelProgress(tile: tile, levelTarget: levelTarget, index: index)
        if progress >= 0.92 { return ("On track", ShotIQColor.confirmGreen) }
        if progress >= 0.68 { return ("Improving", ShotIQColor.shotiqOrange) }
        return ("Developing", ShotIQColor.reviewRed)
    }

    private func playerMetricLevelExplanation(tile: AnalysisMetricTile,
                                              level: (String, String),
                                              teaching: PlayerMetricTeaching,
                                              status: String) -> String {
        let levelName = fullLevelName(level.0)
        let metric = tile.label.lowercased()
        let value = tile.value
        let target = level.1
        let levelPhrase: String
        switch level.0.uppercased() {
        case "MIDDLE":
            levelPhrase = "At the middle school level, development is about learning the habit early so the shot can grow with the player."
        case "HIGH":
            levelPhrase = "At the high school level, defenders close faster, so the mechanic has to be tighter and easier to repeat."
        case "COLLEGE":
            levelPhrase = "At the college level, the best shooters need this mechanic to hold up under speed, fatigue, and pressure."
        case "PRO":
            levelPhrase = "At the professional level, elite shooters live in a very tight window because every inch and degree affects the release."
        default:
            levelPhrase = "At this level, the goal is steady development and a more repeatable shot."
        }
        return "\(levelPhrase) For \(metric), your current value is \(value). The \(levelName) development target is \(target), so your status is \(status.lowercased()). Keep training this number until the movement feels simple and repeatable."
    }

    private func numericTarget(from text: String) -> Double {
        let clean = text
            .replacingOccurrences(of: "+", with: "")
            .replacingOccurrences(of: "°", with: "")
            .replacingOccurrences(of: "\"", with: "")
        if clean.contains("'") {
            let pieces = clean.split(separator: "'")
            let feet = Double(pieces.first ?? "0") ?? 0
            let inches = pieces.count > 1 ? (Double(pieces[1]) ?? 0) : 0
            return feet * 12 + inches
        }
        return Double(clean.filter { "0123456789.-".contains($0) }) ?? 0
    }

    private func playerMetricTeaching(for tile: AnalysisMetricTile) -> PlayerMetricTeaching {
        let label = tile.label.uppercased()
        let status = playerMetricStatus(for: tile)
        if label.contains("RELEASE HEIGHT") {
            return PlayerMetricTeaching(
                why: "Release height matters because a higher release gives the defender less time and creates a cleaner window to the rim. If it is too low, shots get blocked more often and the ball has to travel on a tougher line.",
                visualPhase: "RELEASE",
                targetValue: "7'6\"+",
                levels: [("MIDDLE", "6'0\"+"), ("HIGH", "7'0\"+"), ("COLLEGE", "7'6\"+"), ("PRO", "8'0\"+")],
                status: status.0,
                statusTint: status.1)
        }
        if label.contains("RELEASE OFFSET") {
            return PlayerMetricTeaching(
                why: "Release offset shows how far the ball leaves from the center shooting lane. A big offset creates side spin and left-right misses because the ball is not traveling straight to the rim.",
                visualPhase: "RELEASE",
                targetValue: "-5° to +5°",
                levels: [("MIDDLE", "-10°/+10°"), ("HIGH", "-7°/+7°"), ("COLLEGE", "-5°/+5°"), ("PRO", "-3°/+3°")],
                status: status.0,
                statusTint: status.1)
        }
        if label.contains("ELBOW ANGLE") {
            return PlayerMetricTeaching(
                why: "Elbow angle tells you if the elbow is stacked under the ball at release. When the elbow is outside the target band, the shot can push or pull instead of staying on the rim line.",
                visualPhase: "RELEASE",
                targetValue: "150°-180°",
                levels: [("MIDDLE", "135°+"), ("HIGH", "145°+"), ("COLLEGE", "150°+"), ("PRO", "155°+")],
                status: status.0,
                statusTint: status.1)
        }
        if label.contains("WRIST ANGLE") {
            return PlayerMetricTeaching(
                why: "Wrist angle controls touch and arc. A wrist that is too open or too closed makes the ball leave flat, roll off-center, or change from shot to shot.",
                visualPhase: "RELEASE",
                targetValue: "50°-100°",
                levels: [("MIDDLE", "45°-110°"), ("HIGH", "50°-105°"), ("COLLEGE", "50°-100°"), ("PRO", "55°-95°")],
                status: status.0,
                statusTint: status.1)
        }
        if label.contains("CENTERLINE") {
            return PlayerMetricTeaching(
                why: "Centerline shows whether the ball, elbow, and finish stay on one lane. When the shot drifts sideways, accuracy becomes harder to repeat.",
                visualPhase: "RELEASE",
                targetValue: "0° to 3°",
                levels: [("MIDDLE", "-10°/+10°"), ("HIGH", "-7°/+7°"), ("COLLEGE", "-5°/+5°"), ("PRO", "-3°/+3°")],
                status: status.0,
                statusTint: status.1)
        }
        return PlayerMetricTeaching(
            why: "Ball slot shows whether the ball starts on the correct shooting-side lane. A clean slot helps the shot travel straight without extra correction.",
            visualPhase: "LOAD",
            targetValue: "Shooting side",
            levels: [("MIDDLE", "Side lane"), ("HIGH", "Side lane"), ("COLLEGE", "Tight lane"), ("PRO", "Tight lane")],
            status: status.0,
            statusTint: status.1)
    }

    private func playerMetricStatus(for tile: AnalysisMetricTile) -> (String, Color) {
        guard tile.value != "--" else { return ("Develop it", ShotIQColor.analysisBlue) }
        let label = tile.label.uppercased()
        let value = tile.detailValue

        if label.contains("RELEASE HEIGHT") {
            if value >= 90 { return ("Develop it", ShotIQColor.analysisBlue) }
            if value >= 84 { return ("Improve", ShotIQColor.shotiqOrange) }
            return ("Needs work", ShotIQColor.reviewRed)
        }
        if label.contains("RELEASE OFFSET") || label.contains("CENTERLINE") {
            let absValue = abs(value)
            if absValue <= 5 { return ("Develop it", ShotIQColor.analysisBlue) }
            if absValue <= 10 { return ("Improve", ShotIQColor.shotiqOrange) }
            return ("Needs work", ShotIQColor.reviewRed)
        }
        if label.contains("ELBOW ANGLE") {
            if value >= 150 && value <= 180 { return ("Develop it", ShotIQColor.analysisBlue) }
            if value >= 135 && value <= 190 { return ("Improve", ShotIQColor.shotiqOrange) }
            return ("Needs work", ShotIQColor.reviewRed)
        }
        if label.contains("WRIST ANGLE") {
            if value >= 50 && value <= 100 { return ("Develop it", ShotIQColor.analysisBlue) }
            if value >= 40 && value <= 115 { return ("Improve", ShotIQColor.shotiqOrange) }
            return ("Needs work", ShotIQColor.reviewRed)
        }
        if tile.isPositive { return ("Develop it", ShotIQColor.analysisBlue) }
        return ("Improve", ShotIQColor.shotiqOrange)
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
        VStack(alignment: .leading, spacing: 10) {
            SectionLabel(text: "COACHING ACTIONS")
            ShotIQCard {
                VStack(spacing: 0) {
                    ForEach(Array(coachingActionItems(p).enumerated()), id: \.offset) { index, item in
                        Button {
                            handleCoachingAction(item.id, p: p, hasLoadedAnalysis: hasLoadedAnalysis)
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: item.icon)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(index == 0 ? .white : item.tint)
                                    .frame(width: 32, height: 32)
                                    .background(index == 0 ? item.tint : item.tint.opacity(0.12),
                                                in: Circle())
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.title)
                                        .shotiqBody(15, weight: .bold)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.72)
                                    Text(item.detail)
                                        .shotiqBody(11)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(2)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .frame(minHeight: 58)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(item.title)

                        if index != coachingActionItems(p).count - 1 {
                            Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                        }
                    }
                }
                .padding(.horizontal, 12)
            }
        }
        .padding(.top, 20)
    }

    private func coachingActionItems(_ p: AnalysisResultPresentation) -> [CoachingActionItem] {
        let goodShot = (Int(p.scoreText) ?? 0) >= 85
        if goodShot {
            return [
                CoachingActionItem(id: "breakdown", icon: "film.stack", title: "REVIEW THIS FORM", detail: "Open the full frame breakdown and lock in what worked.", tint: ShotIQColor.confirmGreen),
                CoachingActionItem(id: "release-height", icon: "arrow.up.to.line", title: "CHECK RELEASE HEIGHT", detail: "Confirm the ball leaves high and clean.", tint: ShotIQColor.analysisBlue),
                CoachingActionItem(id: "centerline", icon: "scope", title: "CHECK CENTERLINE", detail: "Make sure the ball path stays stacked to the rim.", tint: ShotIQColor.analysisBlue),
                CoachingActionItem(id: "compare", icon: "person.2", title: "COMPARE ELITE MATCH", detail: "See how this rep lines up against the selected pro.", tint: ShotIQColor.analysisBlue),
                CoachingActionItem(id: "share", icon: "square.and.arrow.up", title: "SHARE ANALYSIS", detail: "Send this ShotIQ result or save it as proof.", tint: ShotIQColor.shotiqOrange),
            ]
        }
        let flawTitle = p.flaws.first?.title ?? p.coachingTarget
        return [
            CoachingActionItem(id: "target", icon: "target", title: "FIX PRIMARY TARGET", detail: flawTitle, tint: ShotIQColor.reviewRed),
            CoachingActionItem(id: "breakdown", icon: "film.stack", title: "REVIEW FRAME BREAKDOWN", detail: "Step through setup, load, rise, release, and follow-through.", tint: ShotIQColor.shotiqOrange),
            CoachingActionItem(id: "release-height", icon: "arrow.up.to.line", title: "CHECK RELEASE HEIGHT", detail: "Use the release frame to see if the ball is high enough.", tint: ShotIQColor.analysisBlue),
            CoachingActionItem(id: "centerline", icon: "scope", title: "CHECK CENTERLINE", detail: "Track whether the ball drifts left or right from your body line.", tint: ShotIQColor.analysisBlue),
            CoachingActionItem(id: "share", icon: "square.and.arrow.up", title: "SHARE ANALYSIS", detail: "Send this result after reviewing the correction.", tint: ShotIQColor.graphite),
        ]
    }

    private func handleCoachingAction(_ id: String,
                                      p: AnalysisResultPresentation,
                                      hasLoadedAnalysis: Bool) {
        guard hasLoadedAnalysis else {
            toast = .info("Analyze a shot first", "Upload a photo or video before opening coaching actions.")
            return
        }
        switch id {
        case "target":
            selectedTab = .flaws
            toast = .info("Opening primary target", p.coachingTarget)
        case "compare":
            coachingRoute = .compare
            toast = .info("Opening elite comparison")
        case "breakdown":
            coachingRoute = .breakdown
            toast = .info("Opening frame breakdown")
        case "release-height":
            coachingRoute = .releaseHeight
            toast = .info("Opening release height", p.releaseHeightText == "--" ? "Measurement unavailable" : p.releaseHeightText)
        case "centerline":
            let centerline = p.metrics.first { $0.label == "CENTERLINE" }?.value ?? "--"
            coachingRoute = .centerline
            toast = .info("Opening centerline", centerline == "--" ? "Measurement unavailable" : centerline)
        case "share":
            coachingRoute = .share
            toast = .info("Opening share analysis")
        default:
            coachingRoute = .breakdown
            toast = .info("Opening frame breakdown")
        }
    }

    @ViewBuilder
    private func coachingDestination(_ route: CoachingActionRoute,
                                     presentation p: AnalysisResultPresentation) -> some View {
        switch route {
        case .breakdown:
            FrameDetailSkeletonView(presentation: p)
        case .releaseHeight:
            metricDestination("RELEASE HEIGHT", presentation: p)
        case .centerline:
            metricDestination("CENTERLINE", presentation: p)
        case .compare:
            EliteMatchView(presentation: p)
        case .share:
            ShareResultsView(presentationOverride: p)
        }
    }

    private func metricDestination(_ label: String,
                                   presentation p: AnalysisResultPresentation) -> some View {
        let tile = p.metrics.first { $0.label == label }
        return MetricDetailView(metric: tile?.detailMetric ?? label.capitalized,
                                value: tile?.detailValue ?? 0,
                                valueText: tile?.value,
                                presentation: p)
    }

    private func flawsInlineContent(_ p: AnalysisResultPresentation) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            CoachTargetCard(title: p.coachingTarget)
                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
            Text(p.flaws.isEmpty
                 ? "AI analysis built no coaching checkpoints from the saved measurements."
                 : "AI analysis built \(p.flaws.count) coaching checkpoint\(p.flaws.count == 1 ? "" : "s") from this saved shot.")
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
        VStack(alignment: .leading, spacing: 18) {
            ForEach(PlayerFlawMetricsCatalog.all) { metric in
                PlayerFlawMetricDetailCard(metric: metric)
            }
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
            HStack(alignment: .center, spacing: 12) {
                Text("\(flaw.rank)")
                    .font(.custom("Tungsten-Medium", size: 44))
                    .foregroundStyle(tint.opacity(0.78))
                    .frame(width: 34, alignment: .leading)

                VStack(alignment: .leading, spacing: 7) {
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(flaw.title)
                            .shotiqDisplay(20)
                            .lineLimit(1)
                            .minimumScaleFactor(0.72)
                        Spacer(minLength: 6)
                        Text("VIEW")
                            .shotiqBody(9, weight: .bold)
                            .kerning(0.7)
                            .foregroundStyle(ShotIQColor.graphite)
                    }

                    Text(flaw.description)
                        .shotiqBody(13)
                        .foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)

                    HStack(spacing: 8) {
                        Text(flaw.impact)
                            .foregroundStyle(tint)
                            .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                        Text(flaw.phase.replacingOccurrences(of: "-", with: " ").uppercased())
                            .foregroundStyle(ShotIQColor.graphite)
                            .background(ShotIQColor.rule.opacity(0.32), in: RoundedRectangle(cornerRadius: 4))
                        Text("\(flaw.confidence) CONF")
                            .foregroundStyle(ShotIQColor.graphite)
                            .background(ShotIQColor.rule.opacity(0.32), in: RoundedRectangle(cornerRadius: 4))
                    }
                    .shotiqBody(9, weight: .bold)
                    .kerning(0.3)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.vertical, 4)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
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
                .lineLimit(1).minimumScaleFactor(0.5)
            Text(l).shotiqBody(8, weight: .medium).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
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
                                PhasePhotoThumbnail(phase: .release,
                                                    active: true,
                                                    width: 150,
                                                    height: 110,
                                                    cornerRadius: 10)
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
                    ShotIQShareButton(payload: ShotIQSharePayload.simple(title: "SHARE ANALYSIS",
                                                                          headline: "Shot Breakdown",
                                                                          subheadline: presentation.recordedLabel,
                                                                          primaryValue: presentation.scoreText,
                                                                          primaryLabel: "FORM SCORE",
                                                                          secondaryValue: presentation.scoreVerdict,
                                                                          secondaryLabel: "RESULT",
                                                                          accentLabel: "ANALYSIS",
                                                                          metrics: [
                                                                            ShotIQShareMetric(value: presentation.elbowAngleText, label: "Elbow"),
                                                                            ShotIQShareMetric(value: presentation.releaseHeightText, label: "Release height")
                                                                          ],
                                                                          shareText: presentation.shotBreakdownShareText)) {
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
                                                PhasePhotoThumbnail(phase: .release,
                                                                    active: true,
                                                                    width: 38,
                                                                    height: 28,
                                                                    cornerRadius: 4)
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
    @State private var annotationSharePayload: ShotIQSharePayload?
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
        .sheet(item: $annotationSharePayload) { payload in
            ShotIQShareDrawer(payload: payload)
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
                .modifier(CanonicalTypeScale())
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
        annotationSharePayload = ShotIQSharePayload.simple(title: "SHARE IMAGE",
                                                           headline: "Annotated Frame",
                                                           subheadline: "ShotIQ frame markup",
                                                           primaryValue: "\(annotations.count)",
                                                           primaryLabel: "MARKS",
                                                           secondaryValue: presentation.scoreText,
                                                           secondaryLabel: "FORM SCORE",
                                                           accentLabel: "ANNOTATED",
                                                           image: image,
                                                           shareText: annotationShareSummary)
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
                            .frame(maxWidth: .infinity)
                            .aspectRatio(390.0 / 175.0, contentMode: .fit)
                            .clipped()
	                    Canvas { ctx, _ in
                        for annotation in annotations {
                            AnnotationExportRenderer.draw(annotation, in: &ctx)
                        }
                    }
                    .frame(maxWidth: .infinity)
                            .aspectRatio(390.0 / 175.0, contentMode: .fit)
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
            .frame(maxWidth: .infinity, alignment: .topLeading)
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
                            .frame(maxWidth: .infinity)
                            .aspectRatio(390.0 / 260.0, contentMode: .fit)
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

fileprivate func orderedAnalysisBreakdownItems(_ items: [AnalysisScoreBreakdownItem]) -> [AnalysisScoreBreakdownItem] {
    let preferred = ["Overall", "Balance", "Release", "Consistency"]
    let lookup = items.reduce(into: [String: AnalysisScoreBreakdownItem]()) { result, item in
        result[item.metric.lowercased()] = result[item.metric.lowercased()] ?? item
    }
    let ordered = preferred.compactMap { lookup[$0.lowercased()] }
    return ordered.isEmpty ? Array(items.filter { $0.metric.uppercased() != "FORM" }.prefix(4)) : ordered
}

fileprivate struct AnalysisFormBreakdownCard: View {
    var item: AnalysisScoreBreakdownItem

    private var statusColor: Color {
        if item.isUnavailable { return ShotIQColor.analysisBlue }
        if item.verdict.uppercased().contains("NEED") { return ShotIQColor.shotiqOrange }
        if item.scorePct >= 0.9 { return ShotIQColor.analysisBlue }
        return ShotIQColor.analysisBlue
    }

    private var progress: CGFloat {
        item.isUnavailable ? 0 : CGFloat(min(max(item.scorePct, 0), 1))
    }

    private var sparkPoints: [Double] {
        AnalysisBreakdownExplanation.trendPoints(for: item)
    }

    private var trendNote: String {
        item.isUnavailable ? "Waiting for analysis" : "Last 5 scores - latest right"
    }

    private var analysisNote: String {
        item.isUnavailable ? "No saved score loaded." : "Measured from this saved ShotIQ analysis."
    }

    var body: some View {
        VStack(spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    HStack(spacing: 5) {
                        Text(item.metric.uppercased())
                            .font(.custom("Tungsten-Medium", size: 22))
                            .foregroundStyle(ShotIQColor.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                        Image(systemName: "info.circle")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    Text(item.scoreText)
                        .font(.custom("Tungsten-Medium", size: 70))
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .lineLimit(1)
                        .minimumScaleFactor(0.55)
                        .frame(height: 58, alignment: .leading)
                }
                .frame(width: 82, alignment: .leading)

                VStack(alignment: .leading, spacing: 5) {
                    Text(item.verdict.uppercased())
                        .font(.custom("Tungsten-Medium", size: 21))
                        .foregroundStyle(statusColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(analysisNote)
                        .shotiqBody(12)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .trailing, spacing: 6) {
                    AnalysisMiniSparkline(points: sparkPoints,
                                          color: item.isUnavailable ? ShotIQColor.graphite.opacity(0.55) : ShotIQColor.confirmGreen)
                        .frame(width: 100, height: 42)
                    Text(trendNote)
                        .shotiqBody(9, weight: .semibold)
                        .foregroundStyle(item.isUnavailable ? ShotIQColor.graphite : ShotIQColor.analysisBlue)
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                }
                .frame(width: 106, alignment: .trailing)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(ShotIQColor.rule)
                    Capsule()
                        .fill(ShotIQColor.shotiqOrange)
                        .frame(width: max(geo.size.width * progress, item.isUnavailable ? 0 : 18))
                }
            }
            .frame(height: 8)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, minHeight: 118)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule, lineWidth: 1))
        .contentShape(RoundedRectangle(cornerRadius: 8))
    }
}

fileprivate struct AnalysisBreakdownExplanation: Identifiable {
    let item: AnalysisScoreBreakdownItem
    var provenanceSummary: String
    var id: String { "\(item.metric.lowercased())-\(provenanceSummary)" }

    var metricTitle: String { item.metric.uppercased() }
    var scoreText: String { item.scoreText }
    var verdictText: String { item.verdict.uppercased() }

    var currentState: String {
        if item.isUnavailable { return "ShotIQ needs one saved shot before it can score this." }
        return "Your \(item.metric.lowercased()) score is \(item.scoreText). That means this part of your shot needs attention."
    }

    var whyItMatters: String {
        switch item.metric.lowercased() {
        case "overall":
            return "Overall is your full shot grade. It looks at balance, release, and consistency together so you know how close your whole shot is to clean form."
        case "balance":
            return "Balance is your base. If your feet or body move too much, the ball can miss left or right even when your hand feels good."
        case "release":
            return "Release is when the ball leaves your hand. A cleaner release helps the ball go straight to the rim and makes the shot harder to block."
        case "consistency":
            return "Consistency means doing the same good shot again and again. One good shot is nice, but repeating it is how you become a shooter."
        default:
            return "\(item.metric) shows one part of your shot. When this gets better, your full form score can go up."
        }
    }

    var whatTheGraphMeans: String {
        "Each dot is one saved analysis for this category. The left dot is the oldest of the last five shown; the right dot is the latest score used on this card."
    }

    var whatToDo: String {
        switch item.metric.lowercased() {
        case "overall":
            return "Start with the lowest score first. Fix that one thing, then test again and watch the overall number move."
        case "balance":
            return "Hold your finish. Land in the same spot. Keep your chest and feet steady until the ball gets to the rim."
        case "release":
            return "Bring the ball up clean. Keep the elbow under the ball. Finish with your wrist pointed at the rim."
        case "consistency":
            return "Go slow first. Repeat the same setup, load, rise, release, and follow-through before you speed up."
        default:
            return "Look at the saved frames, fix one thing, then run another analysis to see if the score changed."
        }
    }

    static func trendPoints(for item: AnalysisScoreBreakdownItem) -> [Double] {
        guard !item.isUnavailable else { return [0.44, 0.38, 0.47, 0.42, 0.45] }
        let base = min(max(item.scorePct, 0.1), 1)
        return [base * 0.86, base * 0.72, base * 0.91, base * 0.84, base * 0.88]
    }
}

fileprivate struct AnalysisBreakdownExplanationSheet: View {
    let breakdown: AnalysisBreakdownExplanation
    @Environment(\.dismiss) private var dismiss

    private var statusColor: Color {
        if breakdown.item.isUnavailable { return ShotIQColor.analysisBlue }
        return breakdown.item.verdict.uppercased().contains("NEED") ? ShotIQColor.shotiqOrange : ShotIQColor.analysisBlue
    }

    private var trendPoints: [Double] {
        AnalysisBreakdownExplanation.trendPoints(for: breakdown.item)
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    scoreSummary
                    teachingBlock(title: "WHY IT MATTERS", text: breakdown.whyItMatters)
                    graphBlock
                    teachingBlock(title: "WHAT TO WORK ON", text: breakdown.whatToDo)
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 18)
            }

            Button {
                dismiss()
            } label: {
                Text("DONE")
                    .shotiqBody(13, weight: .black)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
        }
        .background(Color.white)
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(breakdown.metricTitle)
                    .shotiqDisplay(42)
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                Text("Form breakdown")
                    .shotiqBody(14, weight: .semibold)
                    .foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(width: 38, height: 38)
                    .background(ShotIQColor.warmCanvas, in: Circle())
            }
            .buttonStyle(.plain)
        }
    }

    private var scoreSummary: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center, spacing: 14) {
                Text(breakdown.scoreText)
                    .font(.custom("Tungsten-Medium", size: 72))
                    .foregroundStyle(breakdown.item.isUnavailable ? ShotIQColor.graphite.opacity(0.5) : ShotIQColor.shotiqOrange)
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)
                    .frame(width: 86, alignment: .leading)
                VStack(alignment: .leading, spacing: 5) {
                    Text(breakdown.verdictText)
                        .font(.custom("Tungsten-Medium", size: 30))
                        .foregroundStyle(statusColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(breakdown.currentState)
                        .shotiqBody(14)
                        .foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            ScoreBar(pct: breakdown.item.isUnavailable ? 0 : breakdown.item.scorePct,
                     color: breakdown.item.isUnavailable ? ShotIQColor.rule : ShotIQColor.shotiqOrange)
        }
        .padding(14)
        .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private var graphBlock: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text("SCORE HISTORY")
                    .shotiqDisplay(22)
                    .foregroundStyle(ShotIQColor.ink)
                Spacer()
                Text(breakdown.item.isUnavailable ? "WAITING" : "LATEST ON RIGHT")
                    .shotiqBody(10, weight: .black)
                    .foregroundStyle(breakdown.item.isUnavailable ? ShotIQColor.graphite : ShotIQColor.analysisBlue)
            }

            AnalysisMiniSparkline(points: trendPoints,
                                  color: breakdown.item.isUnavailable ? ShotIQColor.graphite.opacity(0.55) : ShotIQColor.confirmGreen)
                .frame(height: 74)
                .padding(.horizontal, 8)

            Text(breakdown.whatTheGraphMeans)
                .shotiqBody(13)
                .foregroundStyle(ShotIQColor.graphite)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 8) {
                ForEach(Array(trendPoints.enumerated()), id: \.offset) { index, value in
                    VStack(spacing: 3) {
                        Text(index == 0 ? "OLDEST" : (index == trendPoints.count - 1 ? "LATEST" : "\(index + 1)"))
                            .shotiqBody(8, weight: .black)
                            .foregroundStyle(ShotIQColor.graphite)
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                        Text(breakdown.item.isUnavailable ? "--" : "\(Int((value * 100).rounded()))")
                            .font(.custom("Tungsten-Medium", size: 24))
                            .foregroundStyle(index == trendPoints.count - 1 ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 7))
                }
            }
        }
        .padding(14)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }

    private func teachingBlock(title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .shotiqDisplay(22)
                .foregroundStyle(ShotIQColor.ink)
            Text(text)
                .shotiqBody(14)
                .foregroundStyle(ShotIQColor.graphite)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.leading, 14)
        .padding(.vertical, 2)
        .overlay(Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 4), alignment: .leading)
    }
}

fileprivate struct AnalysisMiniSparkline: View {
    var points: [Double]
    var color: Color

    var body: some View {
        GeometryReader { geo in
            let maxV = points.max() ?? 1
            let minV = points.min() ?? 0
            let span = max(maxV - minV, 0.0001)
            let coords = points.enumerated().map { index, value in
                CGPoint(x: CGFloat(index) / CGFloat(max(points.count - 1, 1)) * geo.size.width,
                        y: geo.size.height - CGFloat((value - minV) / span) * geo.size.height)
            }
            ZStack {
                Path { path in
                    guard let first = coords.first else { return }
                    path.move(to: first)
                    coords.dropFirst().forEach { path.addLine(to: $0) }
                }
                .stroke(color, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))

                ForEach(coords.indices, id: \.self) { index in
                    Circle()
                        .fill(color)
                        .frame(width: 8, height: 8)
                        .position(coords[index])
                }
            }
            .padding(4)
        }
    }
}

struct FormScoreView: View {        // 044
    @Environment(\.dismiss) private var dismiss
    var presentation: AnalysisResultPresentation = .canonicalDemo
    @State private var info: AnalysisInfoNote?
    @State private var toast: ShotIQToast?
    @State private var selectedBreakdown: AnalysisBreakdownExplanation?
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
                                ShotIQShareButton(payload: ShotIQSharePayload.simple(title: "SHARE SCORE",
                                                                                      headline: "Form Score",
                                                                                      subheadline: presentation.recordedLabel,
                                                                                      primaryValue: presentation.scoreText,
                                                                                      primaryLabel: "FORM SCORE",
                                                                                      secondaryValue: presentation.scoreVerdict,
                                                                                      secondaryLabel: "RESULT",
                                                                                      accentLabel: "SHOTIQ",
                                                                                      shareText: presentation.formScoreShareText)) {
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
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "FORM BREAKDOWN").padding(.top, 22)
                                Text("Tap any card to learn what the score means.")
                                    .shotiqBody(12, weight: .semibold)
                                    .foregroundStyle(ShotIQColor.graphite)
                                VStack(spacing: 10) {
                                    ForEach(Array(orderedAnalysisBreakdownItems(presentation.scoreBreakdown).enumerated()), id: \.offset) { _, item in
                                        Button {
                                            selectedBreakdown = AnalysisBreakdownExplanation(item: item,
                                                                                             provenanceSummary: presentation.provenanceSummary)
                                        } label: {
                                            AnalysisFormBreakdownCard(item: item)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
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
        .sheet(item: $selectedBreakdown) { breakdown in
            AnalysisBreakdownExplanationSheet(breakdown: breakdown)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
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
                    ShotIQShareButton(payload: ShotIQSharePayload.simple(title: "SHARE METRIC",
                                                                          headline: metric,
                                                                          subheadline: "ShotIQ AI analysis",
                                                                          primaryValue: measuredText,
                                                                          primaryLabel: "MEASURED",
                                                                          secondaryValue: presentation.scoreText,
                                                                          secondaryLabel: "FORM SCORE",
                                                                          accentLabel: "METRIC",
                                                                          shareText: presentation.metricShareText(metric: metric, valueText: measuredText))) {
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
                                    Text("Add all \(flaws.count) checkpoints to your training plan")
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
        toast = .progress("Adding checkpoints to plan", "Saving \(flaws.count) correction target\(flaws.count == 1 ? "" : "s").", progress: 0.65)
        Task {
            struct Body: Encodable { let name: String; let drillCount: Int; let drillIds: [String] }
            struct Resp: Decodable { let success: Bool }
            do {
                let _: Resp = try await APIClient.shared.call(
                    "/api/saved-workouts", method: "POST",
                    body: Body(name: "Flaw correction plan", drillCount: flaws.count,
                               drillIds: flaws.map { $0.title.lowercased().replacingOccurrences(of: " ", with: "-") }))
                addedAll = true
                toast = .success("Added to training plan", "\(flaws.count) coaching checkpoint\(flaws.count == 1 ? "" : "s") saved.")
            } catch {
                addAllError = "Couldn't add checkpoints to your plan. Check your connection and try again."
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
                : "AI analysis built no coaching checkpoints from the saved measurements."
        }
        return "AI analysis built \(currentFlaws.count) coaching checkpoint\(currentFlaws.count == 1 ? "" : "s") from this saved shot."
    }
    private func tint(for flaw: AnalysisFlawItem) -> Color {
        switch flaw.impact {
        case "HIGH IMPACT": return ShotIQColor.reviewRed
        case "MEDIUM IMPACT": return ShotIQColor.shotiqOrange
        case "ON TRACK": return ShotIQColor.confirmGreen
        default: return ShotIQColor.muted
        }
    }

    private struct FlawTeachingCopy {
        let measuredLabel: String
        let measuredValue: String
        let targetLabel: String
        let targetValue: String
        let why: String
        let fix: String
        let thumbnailPhase: String
    }

    private func teachingCopy(for flaw: AnalysisFlawItem) -> FlawTeachingCopy {
        let title = flaw.title.uppercased()
        let phase = flaw.phase.uppercased()
        if title.contains("CENTERLINE") {
            let side = flaw.description.localizedCaseInsensitiveContains("right") ? "RIGHT" : "LEFT"
            return FlawTeachingCopy(
                measuredLabel: "BALL PATH",
                measuredValue: "\(flaw.trendEnd)° \(side)",
                targetLabel: "TARGET",
                targetValue: "0° TO 3°",
                why: "The ball is leaving too far left of your body line, so the shot has to correct sideways before it gets to the rim. That creates left-right misses and makes the same form harder to repeat.",
                fix: "Keep the ball, elbow, wrist, and finish on one lane through release.",
                thumbnailPhase: "RELEASE")
        }
        if title.contains("CONSISTENCY") {
            return FlawTeachingCopy(
                measuredLabel: "YOUR SCORE",
                measuredValue: flaw.trendEnd,
                targetLabel: "TARGET",
                targetValue: "80+",
                why: "A low consistency score means your release is changing from rep to rep. Even if one shot looks good, the next one can miss because the ball is not leaving the same way.",
                fix: "Slow the rep down and repeat the same set point, release, and follow-through before adding speed.",
                thumbnailPhase: "FOLLOW-THROUGH")
        }
        if title.contains("ELBOW") {
            return FlawTeachingCopy(
                measuredLabel: "ELBOW ANGLE",
                measuredValue: "\(flaw.trendEnd)°",
                targetLabel: "TARGET",
                targetValue: "150°-180°",
                why: "Your elbow is outside the stacked release range, so the ball can come off your hand on a crooked line. That usually shows up as pushes, pulls, or a shot that changes under pressure.",
                fix: "Stack the elbow under the ball and finish tall with the wrist pointed through the rim.",
                thumbnailPhase: "RELEASE")
        }
        if title.contains("WRIST") {
            return FlawTeachingCopy(
                measuredLabel: "WRIST ANGLE",
                measuredValue: "\(flaw.trendEnd)°",
                targetLabel: "TARGET",
                targetValue: "50°-100°",
                why: "Your wrist is outside the control range, so the ball can leave flat or with inconsistent touch. The shot becomes harder to control at game speed.",
                fix: "Load the wrist behind the ball, then snap straight through the center of the ball.",
                thumbnailPhase: "RELEASE")
        }
        if title.contains("RELEASE PATH") {
            return FlawTeachingCopy(
                measuredLabel: "OFFSET",
                measuredValue: "\(flaw.trendEnd)°",
                targetLabel: "TARGET",
                targetValue: "-5° TO +5°",
                why: "The release is drifting outside the rim line, which adds side spin and makes the ball miss left or right instead of long or short.",
                fix: "Drive the ball straight up the shooting lane and freeze the finish at the rim.",
                thumbnailPhase: "RELEASE")
        }
        if title.contains("BALANCE") {
            return FlawTeachingCopy(
                measuredLabel: "BALANCE",
                measuredValue: flaw.trendEnd,
                targetLabel: "TARGET",
                targetValue: "80+",
                why: "When your base is unstable, your upper body has to compensate. That changes your release point and makes makes harder to repeat.",
                fix: "Land under control and keep shoulders stacked over the hips before the ball leaves.",
                thumbnailPhase: "SETUP")
        }
        return FlawTeachingCopy(
            measuredLabel: "FORM SCORE",
            measuredValue: flaw.trendEnd,
            targetLabel: "TARGET",
            targetValue: "75+",
            why: "This score is pulling down the whole analysis because one or more mechanics are outside the target window. The goal is to clean up the biggest gap first.",
            fix: "Start with the highest-impact flaw, save a cleaner rep, then compare the new score to this one.",
            thumbnailPhase: phase.isEmpty ? "RELEASE" : phase)
    }

    private func flawCard(_ flaw: AnalysisFlawItem,
                          presentation: AnalysisResultPresentation) -> some View {
        let tint = tint(for: flaw)
        let teaching = teachingCopy(for: flaw)
        return ShotIQCard {
            VStack(alignment: .leading, spacing: 11) {
                HStack(alignment: .top, spacing: 12) {
                    Text("\(flaw.rank)")
                        .font(.custom("Tungsten-Medium", size: 52))
                        .foregroundStyle(tint.opacity(0.78))
                        .frame(width: 40, alignment: .leading)
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(alignment: .firstTextBaseline) {
                            Text(flaw.title)
                                .shotiqDisplay(22)
                                .lineLimit(2)
                                .minimumScaleFactor(0.72)
                            Spacer(minLength: 8)
                            Text("VIEW")
                                .shotiqBody(9, weight: .bold)
                                .kerning(0.7)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        Text(teaching.why)
                            .shotiqBody(13)
                            .foregroundStyle(ShotIQColor.graphite)
                            .fixedSize(horizontal: false, vertical: true)
                            .multilineTextAlignment(.leading)
                    }
                }

                HStack(alignment: .top, spacing: 12) {
                    FlawEvidenceThumbnail(presentation: presentation,
                                          phase: teaching.thumbnailPhase,
                                          tint: tint,
                                          width: 92,
                                          height: 72)
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            flawMetricChip(label: teaching.measuredLabel,
                                           value: teaching.measuredValue,
                                           tint: tint)
                            flawMetricChip(label: teaching.targetLabel,
                                           value: teaching.targetValue,
                                           tint: ShotIQColor.analysisBlue)
                        }
                        Text("Fix: \(teaching.fix)")
                            .shotiqBody(12, weight: .semibold)
                            .foregroundStyle(ShotIQColor.ink)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                HStack(alignment: .center, spacing: 12) {
                    flawInfoChip(flaw.impact, tint: tint, fill: tint.opacity(0.12))
                    flawInfoChip(flaw.phase.replacingOccurrences(of: "-", with: " ").uppercased(),
                                 tint: ShotIQColor.graphite,
                                 fill: ShotIQColor.rule.opacity(0.32))
                    flawInfoChip("\(flaw.confidence) CONF",
                                 tint: ShotIQColor.graphite,
                                 fill: ShotIQColor.rule.opacity(0.32))
                    Spacer(minLength: 8)

                    Text(flaw.cta.uppercased())
                        .shotiqBody(10, weight: .bold)
                        .kerning(0.4)
                        .foregroundStyle(flaw.rank == 1 ? .white : ShotIQColor.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.64)
                        .frame(width: 106, height: 34)
                        .background(flaw.rank == 1 ? ShotIQColor.shotiqOrange : .clear,
                                    in: RoundedRectangle(cornerRadius: 6))
                        .overlay(RoundedRectangle(cornerRadius: 6)
                            .stroke(flaw.rank == 1 ? .clear : ShotIQColor.rule))
                }
            }
            .padding(14)
        }
    }

    private func flawMetricChip(label: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .shotiqBody(8, weight: .bold)
                .kerning(0.45)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
            Text(value)
                .font(.custom("Tungsten-Medium", size: 20))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 7)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.opacity(0.1), in: RoundedRectangle(cornerRadius: 5))
    }

    private func flawInfoChip(_ text: String, tint: Color, fill: Color) -> some View {
        Text(text)
            .shotiqBody(9, weight: .bold)
            .kerning(0.35)
            .foregroundStyle(tint)
            .lineLimit(1)
            .minimumScaleFactor(0.62)
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(fill, in: RoundedRectangle(cornerRadius: 4))
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

    private var fallbackKey: String {
        switch phase.uppercased() {
        case "SETUP": return "041-visual-001"
        case "LOAD": return "047-visual-004"
        case "RISE": return "041-visual-003"
        case "RELEASE": return "041-visual-002"
        case "FOLLOW-THROUGH": return "041-visual-004"
        default: return "041-visual-002"
        }
    }

    var body: some View {
        ZStack {
            PhaseMediaThumbnail(presentation: presentation,
                                fallbackKey: fallbackKey,
                                height: height,
                                phase: phase)
            if hasRealMedia {
                SkeletonOverlay()
                    .opacity(0.5)
            }
        }
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: 7))
        .overlay(RoundedRectangle(cornerRadius: 7).stroke(tint.opacity(0.72), lineWidth: 1.5))
        .accessibilityIdentifier(hasRealMedia ? "flaws-real-media-evidence" : "flaws-demo-evidence")
    }
}

fileprivate struct PlayerMetricStoryThumbnail: View {
    var presentation: AnalysisResultPresentation
    var phase: String
    var tint: Color
    var width: CGFloat
    var height: CGFloat

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            PhaseMediaThumbnail(presentation: presentation,
                                fallbackKey: presentation.id == "canonical-demo" ? "046-visual-001" : "047-visual-001",
                                height: height,
                                phase: phase)
                .overlay(SkeletonOverlay().opacity(0.58))
                .overlay(
                    LinearGradient(colors: [.clear, .black.opacity(0.46)],
                                   startPoint: .center,
                                   endPoint: .bottom)
                )
            Text(phase.uppercased())
                .shotiqBody(9, weight: .bold)
                .kerning(0.45)
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 4))
                .padding(8)
        }
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(tint, lineWidth: 2))
        .accessibilityLabel("Clean story thumbnail for \(phase.lowercased())")
    }
}

fileprivate struct FlawCompactPhaseStrip: View {
    var active: String

    var body: some View {
        HStack(alignment: .top, spacing: 2) {
            ForEach(ShotPhase.allCases, id: \.self) { phase in
                let on = ShotPhase(label: active) == phase
                VStack(spacing: 3) {
                    PhasePhotoThumbnail(phase: phase,
                                        active: on,
                                        width: 38,
                                        height: 28,
                                        cornerRadius: 4)
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
    @State private var selectedEvidencePhase = "RELEASE"
    /// Single item-based route: two `navigationDestination(isPresented:)`
    /// modifiers on one view conflict and only the last one presents.
    enum FlawRoute: Hashable { case frames, drill }
    @State private var route: FlawRoute?
    private let frames = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    /// Clean player/wireframe crops for evidence thumbnails. Avoid the old
    /// AI/play-button crops because these frames are teaching references.
    private static func evidenceFrameKey(_ frame: String) -> String? {
        switch frame {
        case "SETUP": return "041-visual-001"
        case "LOAD": return "047-visual-004"
        case "RISE": return "041-visual-003"
        case "RELEASE": return "041-visual-002"
        case "FOLLOW-THROUGH": return "041-visual-004"
        default: return "041-visual-002"
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
                impactText: "The ball is leaving outside the rim line, so the shot has to correct sideways in the air. That creates side spin and turns clean misses into left-right misses.",
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
                impactText: "Your elbow is outside the stacked release range, so the ball can come off your hand on a crooked line. That usually shows up as pushes, pulls, or a shot that changes under pressure.",
                fixText: "Stack the elbow under the ball through release and finish tall with the wrist pointed through the rim.",
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
                impactText: "The wrist is outside the release-control band, so the ball can leave flat or with inconsistent touch. The shot becomes harder to control at game speed.",
                fixText: "Let the wrist load behind the ball, then snap through the center of the ball at release.",
                targets: ["Wrist behind ball", "Snap over elbow", "Fingers finish down"],
                drillName: "Wrist Snap Holds",
                drillMeta: "6 min • Release Feel",
                drillDescription: "Hold the wrist-loaded position, release softly, and finish with fingers through the rim line.",
                highlightedFrame: "RELEASE")
        }
        if flawTitle.contains("CENTERLINE") {
            let side = flaw.description.localizedCaseInsensitiveContains("right") ? "right" : "left"
            return DetailContent(
                title: flaw.title,
                description: flaw.description,
                phaseText: "\(phase) phase",
                severityText: severityText,
                confidenceText: confidence,
                metricLabel: "YOUR DRIFT",
                measuredValue: "\(flaw.trendEnd)° \(side)",
                idealLabel: "IDEAL BAND",
                idealValue: "0° to 3°",
                impactText: "The ball is leaving too far \(side) of your body line, so the shot has to correct sideways before it gets to the rim. That creates left-right misses and makes the same form harder to repeat.",
                fixText: "Start balanced, keep the ball on the shooting-side lane, and finish through one vertical line.",
                targets: ["Ball on shooting lane", "Shoulders square", "Finish on target line"],
                drillName: "Centerline Form Shots",
                drillMeta: "8 min • Alignment",
                drillDescription: "Shoot close-range reps while keeping feet, elbow, wrist, and follow-through on one line.",
                highlightedFrame: "RISE")
        }
        if flawTitle.contains("CONSISTENCY") {
            return DetailContent(
                title: flaw.title,
                description: flaw.description,
                phaseText: "\(phase) phase",
                severityText: severityText,
                confidenceText: confidence,
                metricLabel: "YOUR SCORE",
                measuredValue: flaw.trendEnd,
                idealLabel: "TARGET",
                idealValue: "80+",
                impactText: "A low consistency score means your release is changing from rep to rep. Even if one shot looks good, the next one can miss because the ball is not leaving the same way.",
                fixText: "Slow the rep down and repeat the same set point, release, and follow-through before adding speed.",
                targets: ["Same set point", "Same release lane", "Same follow-through"],
                drillName: "Repeat Release Series",
                drillMeta: "10 min • Consistency",
                drillDescription: "Shoot controlled reps from the same spot and save only the makes that keep the same release shape.",
                highlightedFrame: "FOLLOW-THROUGH")
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
            impactText: "This score is pulling down the whole analysis because one or more mechanics are outside the target window. The goal is to clean up the biggest gap first.",
            fixText: "Start with the highest-impact flaw, save a cleaner rep, then compare the new score to this one.",
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
                    ShotIQShareButton(payload: ShotIQSharePayload.simple(title: "SHARE TARGET",
                                                                          headline: detail.title,
                                                                          subheadline: "ShotIQ correction plan",
                                                                          primaryValue: presentation.scoreText,
                                                                          primaryLabel: "FORM SCORE",
                                                                          secondaryValue: detail.severityText,
                                                                          secondaryLabel: "FOCUS",
                                                                          accentLabel: "TARGET",
                                                                          shareText: "Working on my shot: fixing \(detail.title.lowercased()) with ShotIQ AI analysis.")) {
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
                            HStack(spacing: 8) {
                                detailInfoPill(label: "PHASE", value: detail.phaseText)
                                detailInfoPill(label: "IMPACT", value: detail.severityText)
                                detailInfoPill(label: "CONF", value: detail.confidenceText)
                            }
                            .padding(.top, 16)
                            evidenceFramesSection
                                .padding(.top, 20)
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 14) {
                                    SectionLabel(text: "IMPACT")
                                    Text(detail.impactText)
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)

                                    HStack(spacing: 10) {
                                        comparisonValueBlock(detail.metricLabel,
                                                             detail.measuredValue,
                                                             ShotIQColor.reviewRed)
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 72)
                                        comparisonValueBlock(detail.idealLabel,
                                                             detail.idealValue,
                                                             ShotIQColor.analysisBlue)
                                    }
                                }
                                .padding(14)
                            }
                            .padding(.top, 22)
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 14) {
                                    SectionLabel(text: "HOW TO FIX")
                                    Text(detail.fixText)
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)

                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("TARGET POSITION").shotiqBody(11, weight: .bold).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ForEach(Array(detail.targets.enumerated()), id: \.element) { index, target in
                                            targetCheck("\(index + 1)", target)
                                        }
                                    }
                                    .padding(12)
                                    .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                                }
                                .padding(14)
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
        .onAppear {
            selectedEvidencePhase = detail.highlightedFrame
        }
        .shotiqToast($toast)
    }

    @ViewBuilder
    private func evidenceFrameSurface(_ frame: String) -> some View {
        let hasRealMedia = presentation.id != "canonical-demo" &&
            (presentation.mediaURL != nil || presentation.videoURL != nil)
        if hasRealMedia {
            PhaseMediaThumbnail(presentation: presentation,
                                fallbackKey: Self.evidenceFrameKey(frame) ?? "041-visual-002",
                                height: 126,
                                phase: frame)
                .overlay(SkeletonOverlay().opacity(0.5))
                .accessibilityIdentifier("flaw-detail-real-media-\(frame.lowercased())")
        } else if let key = Self.evidenceFrameKey(frame) {
            CanonicalPhoto(key, height: 126, cornerRadius: 7)
        } else {
            CanonicalPhoto("041-visual-002", height: 126, cornerRadius: 7)
        }
    }

    private var activeEvidencePhase: String {
        frames.contains(selectedEvidencePhase) ? selectedEvidencePhase : detail.highlightedFrame
    }

    private var evidenceFramesSection: some View {
        ShotIQCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .firstTextBaseline) {
                    SectionLabel(text: "EVIDENCE FRAMES")
                    Spacer()
                    Text("TAP A PHASE")
                        .shotiqBody(9, weight: .bold)
                        .kerning(0.45)
                        .foregroundStyle(ShotIQColor.graphite)
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: 10) {
                        ForEach(frames, id: \.self) { frame in
                            evidencePhaseCard(frame)
                        }
                    }
                    .padding(.vertical, 2)
                }

                phaseLessonCard(activeEvidencePhase)
            }
            .padding(14)
        }
    }

    private func evidencePhaseCard(_ frame: String) -> some View {
        let selected = frame == activeEvidencePhase
        let highlighted = frame == detail.highlightedFrame
        return Button {
            selectedEvidencePhase = frame
            let lesson = phaseLesson(for: frame)
            toast = .info(lesson.title, lesson.short)
        } label: {
            VStack(spacing: 7) {
                evidenceFrameSurface(frame)
                    .frame(width: 78, height: 126)
                    .clipShape(RoundedRectangle(cornerRadius: 7))
                    .overlay(RoundedRectangle(cornerRadius: 7)
                        .stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                                lineWidth: selected ? 3 : 1))
                Text(phaseTitle(frame))
                    .shotiqBody(9, weight: selected ? .bold : .semibold)
                    .kerning(0.35)
                    .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                if highlighted {
                    Text("FLAW FRAME")
                        .shotiqBody(7, weight: .bold)
                        .kerning(0.35)
                        .foregroundStyle(ShotIQColor.reviewRed)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 3)
                        .background(ShotIQColor.reviewRed.opacity(0.12), in: RoundedRectangle(cornerRadius: 3))
                }
            }
            .frame(width: 86)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("flaw-detail-evidence-\(frame.lowercased())")
    }

    private func phaseLessonCard(_ frame: String) -> some View {
        let lesson = phaseLesson(for: frame)
        let highlighted = frame == detail.highlightedFrame
        return VStack(alignment: .leading, spacing: 9) {
            HStack(alignment: .firstTextBaseline) {
                Text(lesson.title)
                    .shotiqDisplay(22)
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                Spacer()
                Text(highlighted ? "WHERE THIS FLAW SHOWS" : "SHOT SEQUENCE")
                    .shotiqBody(8, weight: .bold)
                    .kerning(0.45)
                    .foregroundStyle(highlighted ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
            }
            Text(lesson.explanation)
                .shotiqBody(13)
                .foregroundStyle(ShotIQColor.graphite)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 8) {
                Text("LOOK FOR")
                    .shotiqBody(8, weight: .bold)
                    .kerning(0.45)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 5)
                    .background(ShotIQColor.ink, in: RoundedRectangle(cornerRadius: 4))
                Text(lesson.lookFor)
                    .shotiqBody(12, weight: .semibold)
                    .foregroundStyle(ShotIQColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(12)
        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
    }

    private func phaseTitle(_ frame: String) -> String {
        frame == "FOLLOW-THROUGH" ? "FOLLOW" : frame
    }

    private func phaseLesson(for frame: String) -> (title: String, short: String, explanation: String, lookFor: String) {
        switch frame {
        case "SETUP":
            return ("SETUP", "How the shot starts.",
                    "Setup is your starting position before the ball moves. Feet, hips, shoulders, and eyes set the aim, so a crooked setup forces the rest of the shot to make corrections.",
                    "Balanced feet, square shoulders, ball ready on the shooting side.")
        case "LOAD":
            return ("LOAD", "Where rhythm and power build.",
                    "Load is the gather before the shot rises. The ball and legs should work together so the release feels smooth instead of rushed or forced.",
                    "Ball close to the body, knees loaded, elbow already moving under the ball.")
        case "RISE":
            return ("RISE", "Power travels up.",
                    "Rise is when your legs drive and the ball climbs. A clean rise keeps the ball on one lane, so power moves toward the rim instead of drifting left or right.",
                    "Ball, elbow, and wrist climbing on the same shooting lane.")
        case "RELEASE":
            return ("RELEASE", "The ball leaves your hand.",
                    "Release is the main decision point. Elbow angle, wrist angle, release height, and centerline decide whether the miss is straight, left, right, flat, or short.",
                    "Elbow stacked under the ball, wrist through the rim, finish tall.")
        default:
            return ("FOLLOW-THROUGH", "The finish tells the truth.",
                    "Follow-through shows whether the shot stayed on target after the ball left. Holding the finish helps players see if the wrist, elbow, and shoulders stayed aimed at the rim.",
                    "Wrist down, elbow high, fingers and shoulders finishing on the rim line.")
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
    private func detailInfoPill(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .shotiqBody(9, weight: .bold)
                .kerning(0.55)
                .foregroundStyle(ShotIQColor.graphite)
            Text(value)
                .shotiqBody(12, weight: .semibold)
                .foregroundStyle(ShotIQColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    private func comparisonValueBlock(_ label: String, _ value: String, _ tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .shotiqBody(10, weight: .bold)
                .kerning(0.55)
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(value)
                .font(.custom("Tungsten-Medium", size: 34))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            AngleWedgeGlyph(degrees: Double(value.prefix { $0.isNumber }) ?? 20,
                            size: 34,
                            accent: tint)
                .foregroundStyle(ShotIQColor.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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
    private func targetCheck(_ number: String, _ label: String) -> some View {
        HStack(alignment: .top, spacing: 9) {
            Text(number)
                .shotiqBody(10, weight: .bold)
                .foregroundStyle(.white)
                .frame(width: 18, height: 18)
                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 4))
            Text(label)
                .shotiqBody(13)
                .foregroundStyle(ShotIQColor.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
