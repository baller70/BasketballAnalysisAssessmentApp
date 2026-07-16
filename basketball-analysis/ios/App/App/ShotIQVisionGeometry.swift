import Foundation

struct ShotIQVisionPixelPoint {
    let x: Double
    let y: Double
    let confidence: Double
}

enum ShotIQVisionGeometry {
    static func pixelPoint(
        normalizedX: Double,
        normalizedY: Double,
        confidence: Double,
        width: Double,
        height: Double
    ) -> ShotIQVisionPixelPoint {
        let x = min(max(normalizedX, 0), 1) * max(width, 0)
        // Apple Vision's origin is lower-left; ShotIQ canvas coordinates start
        // at the upper-left, so vertical coordinates must be inverted once.
        let y = (1 - min(max(normalizedY, 0), 1)) * max(height, 0)
        let safeConfidence = min(max(confidence, 0), 1)
        return ShotIQVisionPixelPoint(x: x, y: y, confidence: safeConfidence)
    }
}
