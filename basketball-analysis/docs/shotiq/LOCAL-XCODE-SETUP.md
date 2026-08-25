# ShotIQ Local Xcode Setup

Date updated: 2026-08-07

Goal: ShotIQ native iOS work should run from Kevin's desktop or laptop, not only
from the Mac mini broker.

## Mirrored State

The Mac mini is reachable from this Codex laptop with:

```sh
ssh -i ~/.ssh/shotiq_ios kevinhouston@kevins-mac-mini.local
```

Mirrored to this laptop:

- App Store Connect env: `~/.shotiq/asc.env`
- App Store Connect key: `~/.private_keys/AuthKey_<key-id>.p8`
- App Store Connect key copy for Apple tools:
  `~/.appstoreconnect/private_keys/AuthKey_<key-id>.p8`
- Provisioning profiles:
  `~/Library/Developer/Xcode/UserData/Provisioning Profiles`
- Xcode mirror:
  `/Volumes/TBF SKILLZ.INC/xcode-archive/Xcode.app`
- XcodeGen:
  `~/.local/bin/xcodegen`

Do not commit any of those user-home files. The repo helper only loads them.

## Laptop Admin Step

This laptop's mirrored Xcode is present, `xcodebuild -version` works, and the
local Xcode license has been accepted. If this setup is recreated on another
Mac, accept the mirrored Xcode license once with:

```sh
sudo DEVELOPER_DIR="/Volumes/TBF SKILLZ.INC/xcode-archive/Xcode.app/Contents/Developer" \
  xcodebuild -license accept
```

After it is run once, keep using the sourceable helper below; do not switch
global `xcode-select` unless you want the whole machine to use the mirrored
Xcode.

## Use It

From the repo root:

```sh
source scripts/shotiq-xcode-env.sh
shotiq_xcode_doctor
```

Expected doctor result:

- `DEVELOPER_DIR` points at a readable `Xcode.app/Contents/Developer`.
- `xcodebuild -version` prints Xcode 26.2 / build 17C52 or newer.
- `ASC_KEY_ID`, `ASC_ISSUER_ID`, and `ASC_KEY_PATH` report set/readable.
- `xcodegen --version` prints a version.

Verified on this laptop on 2026-08-07:

- Xcode mirror size: 12 GB.
- `DEVELOPER_DIR`: `/Volumes/TBF SKILLZ.INC/xcode-archive/Xcode.app/Contents/Developer`.
- `xcodebuild -version`: Xcode 26.2 / build 17C52.
- App Store Connect env/key: set/readable.
- `xcodegen --version`: 2.46.0.
- Xcode license: accepted.
- iOS simulator runtime: iOS 26.3.1 / build 23D8133.
- Local simulator: iPhone 17,
  `44811BE6-7BFE-424D-B677-FAE7442373F3`.

## Native Contract Test

```sh
source scripts/shotiq-xcode-env.sh
cd basketball-analysis/ios-native
xcodegen generate
xcodebuild \
  -project ShotIQ.xcodeproj \
  -scheme ShotIQ \
  -configuration Debug \
  -destination 'platform=iOS Simulator,id=44811BE6-7BFE-424D-B677-FAE7442373F3' \
  -derivedDataPath "$HOME/CodexWork/DerivedData/shotiq-contract" \
  CODE_SIGNING_ALLOWED=NO \
  -only-testing:ShotIQTests/AnalysisResultContractTests \
  test
```

## Install On Kevin's iPhone

```sh
source scripts/shotiq-xcode-env.sh
bash scripts/install-on-device.sh
```

The script finds the paired phone, regenerates the Xcode project, creates a
throwaway signing keychain, uses the mirrored App Store Connect key for
automatic provisioning, builds Debug, and installs `com.baller70.shotiq` with
`devicectl`.

## Current Evidence

On the Mac mini, the persistent checkout is:

`~/CodexWork/BasketballAnalysisAssessmentApp`

Evidence logs:

- `~/CodexWork/shotiq-evidence/xcode-contract-test-20260807-091549.log`
- `~/CodexWork/shotiq-evidence/device-install-20260807-091929.log`
- `~/CodexWork/shotiq-evidence/local-xcode-build-20260807-102900.log`
- `~/CodexWork/shotiq-evidence/local-xcode-contract-test-20260807-102900.log`

Those logs show the focused native contract XCTest passed on the Mac mini, the
current branch installed on Kevin's iPhone, the laptop Debug simulator app build
succeeded, and the laptop focused native contract XCTest passed.

## Source Of Truth Note

`scripts/install-on-device.sh` regenerates `ShotIQ.xcodeproj` from
`basketball-analysis/ios-native/project.yml` before building. Keep Xcode build
settings in `project.yml`; do not rely on hand edits in the generated
`.xcodeproj`.
