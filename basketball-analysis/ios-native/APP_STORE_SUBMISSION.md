# ShotIQ — TestFlight & App Store pipeline

Same pipeline as HoopTrack (baller70/hooptrack), adapted for the single
ShotIQ app. A GitHub-hosted macOS runner archives, signs, uploads to
App Store Connect, and can submit for review — no local Mac needed.

- App: **ShotIQ** · bundle id `com.baller70.shotiq` · team `DD9G8RP575`
- Workflows: `.github/workflows/ios-appstore.yml` (release),
  `.github/workflows/ios-release-preflight.yml` (readiness check)
- Scripts: `basketball-analysis/ios-native/release/`

## One-time setup (once per repo)

1. **Copy the five Actions secrets from the hooptrack repo to this repo**
   (GitHub → this repo → Settings → Secrets and variables → Actions).
   Same names, same values — they're team-level Apple credentials:
   - `APPLE_DIST_CERT_P12_BASE64` — Apple Distribution certificate (.p12, base64)
   - `APPLE_DIST_CERT_PASSWORD` — its password
   - `ASC_KEY_ID` — App Store Connect API key ID
   - `ASC_ISSUER_ID` — App Store Connect issuer ID
   - `ASC_KEY_P8_BASE64` — the AuthKey .p8, base64

2. **Create the app record in App Store Connect** (the API cannot):
   App Store Connect → Apps → “+” → New App → platform iOS,
   name **ShotIQ**, bundle ID **com.baller70.shotiq** (register it if it
   isn't in the dropdown), SKU e.g. `shotiq-ios`.

3. Run the **iOS Release Preflight** workflow (Actions tab → Run workflow).
   Its summary shows which secrets are set and what Apple's side looks like.

## Shipping a build to TestFlight

Actions → **iOS App Store** → Run workflow →
`build_number: 1` (must exceed the previous upload), `stage: upload`.

Apple processes the binary for 5–30 minutes, then it appears in
App Store Connect → TestFlight, and the TestFlight app on the phone can
install it (add yourself as an internal tester once).

## Submitting for App Review

Either dispatch the workflow with `stage: upload-and-submit`, or push a tag:

```bash
git tag release-2 && git push origin release-2   # uploads build 2 + submits
```

Before a submit can succeed, the version's metadata must be complete in
App Store Connect: screenshots, description, keywords, support URL, privacy
policy URL, age rating, pricing. The submit step reports exactly which field
is missing if any are.

## Stages

| stage | what happens |
| --- | --- |
| `archive` | build + export the signed IPA (artifact only) |
| `validate` | archive + altool validate against App Store Connect |
| `upload` | archive + validate + upload → lands in TestFlight |
| `upload-and-submit` | all of the above + attach to version + submit for review |
