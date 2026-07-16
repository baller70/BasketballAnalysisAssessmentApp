import Capacitor

@objc(ShotIQBridgeViewController)
class ShotIQBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(ShotIQVisionPlugin())
    }
}
