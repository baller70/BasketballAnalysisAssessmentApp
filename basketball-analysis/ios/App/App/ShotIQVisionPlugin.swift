import Capacitor
import Foundation
import ImageIO
import UIKit
import Vision

@objc(ShotIQVisionPlugin)
public class ShotIQVisionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ShotIQVisionPlugin"
    public let jsName = "ShotIQVision"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "detectPose", returnType: CAPPluginReturnPromise)
    ]

    private let worker = DispatchQueue(
        label: "com.shotiqai.vision.body-pose",
        qos: .userInitiated
    )

    private let canonicalJoints: [(String, VNHumanBodyPoseObservation.JointName)] = [
        ("nose", .nose),
        ("left_eye", .leftEye),
        ("right_eye", .rightEye),
        ("left_ear", .leftEar),
        ("right_ear", .rightEar),
        ("left_shoulder", .leftShoulder),
        ("right_shoulder", .rightShoulder),
        ("left_elbow", .leftElbow),
        ("right_elbow", .rightElbow),
        ("left_wrist", .leftWrist),
        ("right_wrist", .rightWrist),
        ("left_hip", .leftHip),
        ("right_hip", .rightHip),
        ("left_knee", .leftKnee),
        ("right_knee", .rightKnee),
        ("left_ankle", .leftAnkle),
        ("right_ankle", .rightAnkle)
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "available": true,
            "engine": "apple-vision"
        ])
    }

    @objc func detectPose(_ call: CAPPluginCall) {
        guard let imageData = call.getString("imageData") else {
            call.reject("ShotIQ Vision requires imageData")
            return
        }

        let width = call.getDouble("width", 0)
        let height = call.getDouble("height", 0)
        guard width > 0, height > 0 else {
            call.reject("ShotIQ Vision requires positive frame dimensions")
            return
        }
        let frameOrientation = ShotIQVisionGeometry.frameOrientation(
            call.getString("orientation", "up")
        )

        let configuredConfidence = getConfig().getConfigJSON()["minimumConfidence"] as? NSNumber
        let minimumConfidence = Float(configuredConfidence?.doubleValue ?? 0.2)

        worker.async { [weak self] in
            guard let self else { return }

            do {
                guard
                    let encoded = imageData.split(separator: ",").last,
                    let data = Data(base64Encoded: String(encoded)),
                    let image = UIImage(data: data),
                    let cgImage = image.cgImage
                else {
                    throw ShotIQVisionError.invalidImage
                }

                let request = VNDetectHumanBodyPoseRequest()
                let handler = VNImageRequestHandler(
                    cgImage: cgImage,
                    orientation: frameOrientation.cgImagePropertyOrientation,
                    options: [:]
                )
                try handler.perform([request])

                guard let observation = request.results?.first else {
                    DispatchQueue.main.async {
                        call.resolve([
                            "keypoints": [],
                            "score": NSNull(),
                            "engine": "apple-vision",
                            "width": width,
                            "height": height,
                            "orientation": frameOrientation.rawValue
                        ])
                    }
                    return
                }

                let recognized = try observation.recognizedPoints(.all)
                var keypoints: [[String: Any]] = []
                var confidenceTotal = 0.0

                for (name, joint) in self.canonicalJoints {
                    guard let point = recognized[joint] else { continue }
                    let pixel = ShotIQVisionGeometry.pixelPoint(
                        normalizedX: Double(point.location.x),
                        normalizedY: Double(point.location.y),
                        confidence: Double(point.confidence),
                        width: width,
                        height: height
                    )
                    guard pixel.confidence >= Double(minimumConfidence) else { continue }

                    keypoints.append([
                        "name": name,
                        "x": pixel.x,
                        "y": pixel.y,
                        "score": pixel.confidence
                    ])
                    confidenceTotal += pixel.confidence
                }

                let score: Any = keypoints.isEmpty
                    ? NSNull()
                    : confidenceTotal / Double(keypoints.count)

                DispatchQueue.main.async {
                    call.resolve([
                        "keypoints": keypoints,
                        "score": score,
                        "engine": "apple-vision",
                        "width": width,
                        "height": height,
                        "orientation": frameOrientation.rawValue
                    ])
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject("Apple Vision could not analyze this frame", nil, error)
                }
            }
        }
    }
}

private extension ShotIQVisionFrameOrientation {
    var cgImagePropertyOrientation: CGImagePropertyOrientation {
        switch self {
        case .up: return .up
        case .upMirrored: return .upMirrored
        case .down: return .down
        case .downMirrored: return .downMirrored
        case .left: return .left
        case .leftMirrored: return .leftMirrored
        case .right: return .right
        case .rightMirrored: return .rightMirrored
        }
    }
}

private enum ShotIQVisionError: Error {
    case invalidImage
}
