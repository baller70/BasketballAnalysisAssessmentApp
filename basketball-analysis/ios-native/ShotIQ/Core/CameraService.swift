import SwiftUI
import AVFoundation

/// Real camera plumbing for the capture screens. The canonical mockups show a
/// live viewfinder; this provides one — permission flow, preview layer, photo
/// capture and video recording — so "Live camera" actually opens the camera.
@MainActor
final class CameraService: NSObject, ObservableObject {
    enum Status { case unknown, unauthorized, ready, failed }
    @Published var status: Status = .unknown
    @Published var isRecording = false

    /// True only when a real capture session is feeding the preview layer.
    ///
    /// The canonical camera screens (028-031, 042) ship the design's finished
    /// viewfinder — framing brackets, readiness card, pose skeleton and HUD are
    /// all baked into the photograph. Those crops back the preview whenever no
    /// camera is available, which is always the case in the Simulator. Drawing
    /// the app's own chrome on top of them renders every element twice, so the
    /// viewfinder overlays are gated on this: live feed gets the live chrome,
    /// the canonical still already contains its own.
    @Published var lastPhoto: Data?
    @Published var lastVideoURL: URL?

    var isLive: Bool { status == .ready && session.isRunning }

    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let movieOutput = AVCaptureMovieFileOutput()
    private var configured = false

    func start() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            configureAndRun()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                Task { @MainActor in
                    if granted { self?.configureAndRun() } else { self?.status = .unauthorized }
                }
            }
        default:
            status = .unauthorized
        }
    }

    func stop() {
        let s = session
        Task.detached { s.stopRunning() }
    }

    private func configureAndRun() {
        if !configured {
            session.beginConfiguration()
            session.sessionPreset = .high
            guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
                  let input = try? AVCaptureDeviceInput(device: device),
                  session.canAddInput(input) else {
                session.commitConfiguration()
                status = .failed
                return
            }
            session.addInput(input)
            if let mic = AVCaptureDevice.default(for: .audio),
               let micInput = try? AVCaptureDeviceInput(device: mic),
               session.canAddInput(micInput) {
                session.addInput(micInput)
            }
            if session.canAddOutput(photoOutput) { session.addOutput(photoOutput) }
            if session.canAddOutput(movieOutput) { session.addOutput(movieOutput) }
            session.commitConfiguration()
            configured = true
        }
        status = .ready
        let s = session
        Task.detached { if !s.isRunning { s.startRunning() } }
    }

    func capturePhoto() {
        photoOutput.capturePhoto(with: AVCapturePhotoSettings(), delegate: self)
    }

    func startRecording() {
        guard !movieOutput.isRecording else { return }
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("shotiq-\(UUID().uuidString).mov")
        movieOutput.startRecording(to: url, recordingDelegate: self)
        isRecording = true
    }

    func stopRecording() {
        guard movieOutput.isRecording else { return }
        movieOutput.stopRecording()
    }

    static func openSystemSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

extension CameraService: AVCapturePhotoCaptureDelegate {
    nonisolated func photoOutput(_ output: AVCapturePhotoOutput,
                                 didFinishProcessingPhoto photo: AVCapturePhoto,
                                 error: Error?) {
        let data = photo.fileDataRepresentation()
        Task { @MainActor in self.lastPhoto = data }
    }
}

extension CameraService: AVCaptureFileOutputRecordingDelegate {
    nonisolated func fileOutput(_ output: AVCaptureFileOutput,
                                didFinishRecordingTo outputFileURL: URL,
                                from connections: [AVCaptureConnection],
                                error: Error?) {
        Task { @MainActor in
            self.isRecording = false
            self.lastVideoURL = outputFileURL
        }
    }
}

/// Live viewfinder surface. Drop into any capture screen in place of the
/// former placeholder rectangle.
struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession

    final class PreviewView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
        var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
    }

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.previewLayer.session = session
        view.previewLayer.videoGravity = .resizeAspectFill
        view.backgroundColor = .black
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {}
}

/// Standard denied-permission card: explains and deep-links to Settings.
struct CameraDeniedView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "video.slash").font(.system(size: 30)).foregroundStyle(ShotIQColor.graphite)
            Text("Camera access is off").shotiqBody(16, weight: .semibold)
            Text("ShotIQ needs the camera to record your shot. Turn it on in Settings.")
                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.center)
            Button { CameraService.openSystemSettings() } label: {
                Text("Open Settings").shotiqBody(15, weight: .semibold)
                    .frame(maxWidth: .infinity).frame(height: 46)
                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                    .foregroundStyle(.white)
            }
        }
        .padding(18)
        .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
    }
}
