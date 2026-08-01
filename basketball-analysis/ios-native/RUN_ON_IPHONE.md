# Run ShotIQ on your iPhone

The native SwiftUI app (all 72 canonical screens, talking to the live ShotIQ
server) lives in this folder. Building an iOS app requires a Mac with Xcode —
there is no way around that — but from a fresh Mac this whole flow is about
10 minutes and needs only a free Apple ID.

## What you need
- A Mac with **Xcode 16** (App Store → search "Xcode" → install; it's big).
- Your **iPhone + cable** (Wi-Fi running works after the first cabled run).
- Your **Apple ID** signed into Xcode (Xcode → Settings → Accounts → "+").
  A free account is enough — the app just re-signs every 7 days.

## Steps

1. **Get the code onto the Mac**
   ```bash
   git clone https://github.com/baller70/BasketballAnalysisAssessmentApp.git
   cd BasketballAnalysisAssessmentApp/basketball-analysis/ios-native
   ```

2. **Generate the Xcode project** (one command via XcodeGen)
   ```bash
   brew install xcodegen        # once; install Homebrew from brew.sh if needed
   xcodegen generate
   open ShotIQ.xcodeproj
   ```

3. **Pick your signing team** (once)
   - In Xcode's left sidebar click the blue **ShotIQ** project icon
   - Select the **ShotIQ** target → **Signing & Capabilities** tab
   - Check **Automatically manage signing** and choose your **Team**
     (your Apple ID / "Personal Team")

4. **Put it on the phone**
   - Plug in the iPhone; unlock it and tap **Trust This Computer**
   - On the iPhone enable **Settings → Privacy & Security → Developer Mode**
     (toggle on, restart when asked — iOS 16+ requires this for dev installs)
   - In Xcode's top bar pick your iPhone as the run destination
   - Press **⌘R** (Run). First build takes a couple of minutes.
   - If the app icon shows "Untrusted Developer": on the iPhone go to
     **Settings → General → VPN & Device Management** → your Apple ID → Trust

5. **Sign in** with the same account you use on the web app — the app talks
   to the live server (`https://shotiq.194-146-12-139.sslip.io`), so your real
   profile, history, goals, and points show up.

## Pointing at a different server
The API origin is read from the `SHOTIQ_API` environment variable at launch
(default is the live production URL). In Xcode: Product → Scheme → Edit
Scheme → Run → Arguments → Environment Variables → add `SHOTIQ_API`.

## Verifying before you build
Every Swift file in this target is parse-verified in CI-less fashion with a
real Swift 6 toolchain:
```bash
./verify-parse.sh
```
(That is the ceiling on Linux; full type-check/build happens in Xcode.)

## No Mac available?
Two realistic options, both need an Apple **Developer Program** account ($99/yr):
- **A cloud Mac** (MacStadium, Scaleway, AWS EC2 Mac) — same steps as above.
- **CI + TestFlight** — a GitHub Actions `macos-15` runner can archive and
  upload to TestFlight; you then install from the TestFlight app on the phone.
  This needs your App Store Connect API key added as repo secrets — say the
  word and the workflow can be added to this repo.
