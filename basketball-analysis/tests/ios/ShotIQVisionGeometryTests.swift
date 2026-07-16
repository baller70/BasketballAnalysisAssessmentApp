import Foundation

@main
struct ShotIQVisionGeometryTests {
    static func main() {
        let center = ShotIQVisionGeometry.pixelPoint(
            normalizedX: 0.5,
            normalizedY: 0.75,
            confidence: 0.9,
            width: 640,
            height: 480
        )

        precondition(center.x == 320)
        precondition(center.y == 120)
        precondition(center.confidence == 0.9)

        let clamped = ShotIQVisionGeometry.pixelPoint(
            normalizedX: 1.2,
            normalizedY: -0.1,
            confidence: 1.4,
            width: 100,
            height: 200
        )

        precondition(clamped.x == 100)
        precondition(clamped.y == 200)
        precondition(clamped.confidence == 1)

        print("ShotIQVisionGeometryTests passed")
    }
}
