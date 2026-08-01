#!/usr/bin/env bash
# Archive, export, validate, and upload the ShotIQ iOS app to App Store Connect.
# Ported from the proven HoopTrack pipeline (baller70/hooptrack), adapted for
# the single XcodeGen-generated ShotIQ target.
#
# Runs on macOS with Xcode installed (locally or a GitHub macos runner).
#
#   ./release/appstore-release.sh preflight
#   ./release/appstore-release.sh archive --build 1
#   ./release/appstore-release.sh all --build 1
set -Eeuo pipefail

die() {
  printf 'APPSTORE_RELEASE_ERROR: %s\n' "$*" >&2
  exit 1
}

note() { printf '  %s\n' "$*"; }
step() { printf '\n==> %s\n' "$*"; }

# Cached because every `xcodebuild -version` call is a process launch, and
# because piping it anywhere that closes early aborts it on Xcode 26.
xcodebuild_version_cache=""
xcodebuild_version_line() {
  if [ -z "$xcodebuild_version_cache" ]; then
    xcodebuild_version_cache="$(xcodebuild -version)"
  fi
  printf '%s' "${xcodebuild_version_cache%%$'\n'*}"
}

usage() {
  cat <<'USAGE'
Usage: release/appstore-release.sh <stage> [options]

  stage   preflight | archive | export | validate | upload | all

Options:
  --build <n>        Build number (CFBundleVersion). Must be higher than the
                     last build uploaded for this marketing version.
  --version <x.y.z>  Marketing version (CFBundleShortVersionString) override.
  --derived <path>   DerivedData location. Defaults to the internal drive.

App Store Connect credentials (for validate/upload) come from the environment:
  ASC_KEY_ID     App Store Connect API key ID
  ASC_ISSUER_ID  App Store Connect issuer ID
The matching AuthKey_<ASC_KEY_ID>.p8 must live in one of the locations altool
searches, e.g. ~/.appstoreconnect/private_keys/

Without those, the export falls back to destination=upload and Xcode's own
signed-in Apple ID delivers the build — the same path Organizer takes.
USAGE
}

[ $# -ge 1 ] || { usage; exit 2; }

stage="${1:-preflight}"; shift || true

scheme="ShotIQ"
project="ShotIQ.xcodeproj"
bundle_id="com.baller70.shotiq"

case "$stage" in
  preflight|archive|export|validate|upload|all) ;;
  -h|--help) usage; exit 0 ;;
  *) die "stage must be preflight, archive, export, validate, upload, or all" ;;
esac

build_number=""
marketing_version=""
derived_data="${HOME}/Library/Developer/Xcode/DerivedData/shotiq-release"

while [ $# -gt 0 ]; do
  case "$1" in
    --build)   build_number="${2:-}"; shift 2 ;;
    --version) marketing_version="${2:-}"; shift 2 ;;
    --derived) derived_data="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option '$1'" ;;
  esac
done

[ -z "$build_number" ] || [[ "$build_number" =~ ^[0-9]+$ ]] || die "--build must be an integer"
[ -z "$marketing_version" ] || [[ "$marketing_version" =~ ^[0-9]+(\.[0-9]+){0,2}$ ]] || die "--version must look like 1.2.3"

# This script lives in ios-native/release; the project root is ios-native.
ios_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ios_root"

team_id="DD9G8RP575"
build_dir="${ios_root}/build/appstore"
archive_path="${build_dir}/${scheme}.xcarchive"
export_dir="${build_dir}/export"
ipa_path="${export_dir}/${scheme}.ipa"
export_options="${build_dir}/ExportOptions.plist"

# ---------------------------------------------------------------- preflight --

run_preflight() {
  step "Preflight — ${scheme} (${bundle_id})"

  [ "$(uname -s)" = "Darwin" ] || die "this script requires macOS; Xcode does not run on $(uname -s)"

  command -v xcodebuild >/dev/null 2>&1 || die "xcodebuild not found — install Xcode and run: sudo xcode-select --switch /Applications/Xcode.app"
  # Never pipe xcodebuild into head: it writes a second line, and on Xcode 26
  # the resulting SIGPIPE surfaces as an uncaught NSFileHandleOperationException
  # that aborts with exit 134. Capture the whole thing and slice it here.
  note "$(xcodebuild_version_line)"

  # The Xcode project is generated from project.yml — make sure it exists and
  # is fresh (xcodegen is a no-op when nothing changed).
  if command -v xcodegen >/dev/null 2>&1; then
    xcodegen generate --quiet || xcodegen generate
  fi
  [ -d "$project" ] || die "missing ${project} — run: brew install xcodegen && xcodegen generate"
  [ -f "${project}/xcshareddata/xcschemes/${scheme}.xcscheme" ] || die "scheme '${scheme}' is not shared; regenerate with xcodegen (project.yml defines it)"
  note "Shared scheme present: ${scheme}"

  # Signing is checked here rather than discovered a minute into an archive.
  local identities
  identities="$(security find-identity -v -p codesigning 2>/dev/null || true)"
  note "Code-signing identities visible to this process:"
  if [ -n "$identities" ]; then
    printf '%s\n' "$identities" | sed 's/^/    /'
  else
    note "    (none)"
  fi
  if printf '%s' "$identities" | grep -q 'Apple Distribution'; then
    note "Signing: Apple Distribution identity present"
  elif printf '%s' "$identities" | grep -q 'Apple Development'; then
    note "WARNING: only an Apple Development identity is in this keychain."
    note "         App Store archives need 'Apple Distribution'."
  else
    note "WARNING: no code-signing identity is visible to this process."
  fi

  # The backend the shipped app will talk to. App Review exercises this host —
  # it must be up and serving valid TLS for the whole review window.
  local backend
  backend="$(awk 'match($0, /https:\/\/[^"]+/) { print substr($0, RSTART, RLENGTH); exit }' \
    "ShotIQ/Core/APIClient.swift")"
  note "Backend: ${backend}"
  if curl -fsS -o /dev/null --max-time 15 "$backend" 2>/dev/null; then
    note "Backend reachable."
  else
    note "WARNING: backend did not respond. App Review will exercise this host."
  fi

  if [ "$stage" = "preflight" ]; then
    note "Preflight complete. Next: $0 all --build <n>"
  fi
}

asc_key_path=""

# altool searches these directories by name; xcodebuild wants an explicit path.
# ASC_KEY_PATH short-circuits the search — that is how App Factory's worker
# passes the key, and its .p8 does not live in any of altool's search dirs.
locate_asc_key() {
  asc_key_path=""
  if [ -n "${ASC_KEY_PATH:-}" ] && [ -f "$ASC_KEY_PATH" ]; then
    asc_key_path="$ASC_KEY_PATH"
    if [ -z "${ASC_KEY_ID:-}" ]; then
      local base="${asc_key_path##*/}"
      base="${base%.p8}"
      ASC_KEY_ID="${base#AuthKey_}"
      export ASC_KEY_ID
    fi
    return 0
  fi
  [ -n "${ASC_KEY_ID:-}" ] || return 1
  local dir
  for dir in "./private_keys" "${HOME}/private_keys" "${HOME}/.private_keys" "${HOME}/.appstoreconnect/private_keys"; do
    if [ -f "${dir}/AuthKey_${ASC_KEY_ID}.p8" ]; then
      asc_key_path="${dir}/AuthKey_${ASC_KEY_ID}.p8"
      return 0
    fi
  done
  return 1
}

# altool takes --apiKey by *id* and then goes looking for the file itself, so a
# key held anywhere else has to be staged into one of its search directories.
stage_key_for_altool() {
  locate_asc_key || return 1
  case "$asc_key_path" in
    ./private_keys/*|"${HOME}/private_keys/"*|"${HOME}/.private_keys/"*|"${HOME}/.appstoreconnect/private_keys/"*)
      return 0 ;;
  esac
  mkdir -p "${HOME}/.appstoreconnect/private_keys"
  cp "$asc_key_path" "${HOME}/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8"
  chmod 600 "${HOME}/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8"
  note "Staged the API key where altool looks for it."
}

require_asc_credentials() {
  [ -n "${ASC_ISSUER_ID:-}" ] || die "ASC_ISSUER_ID is not set"
  locate_asc_key || die "no App Store Connect key: set ASC_KEY_PATH, or put AuthKey_\${ASC_KEY_ID}.p8 in ~/.appstoreconnect/private_keys/ (or ./private_keys, ~/private_keys, ~/.private_keys)"
  stage_key_for_altool || true
}

# Is there a usable App Store Connect API key? Both the key file and the issuer
# id are needed; a .p8 on its own cannot authenticate.
have_asc_credentials() {
  [ -n "${ASC_ISSUER_ID:-}" ] && locate_asc_key
}

# With these flags xcodebuild can create and download provisioning profiles on
# its own, which is what makes -allowProvisioningUpdates work on a CI runner
# where nobody can answer an interactive Apple ID prompt.
asc_auth_args=()
set_asc_auth_args() {
  asc_auth_args=()
  if have_asc_credentials; then
    asc_auth_args=(
      -authenticationKeyID "$ASC_KEY_ID"
      -authenticationKeyIssuerID "$ASC_ISSUER_ID"
      -authenticationKeyPath "$(cd "$(dirname "$asc_key_path")" && pwd)/$(basename "$asc_key_path")"
    )
    note "Signing non-interactively with App Store Connect key ${ASC_KEY_ID}"
  fi
}

# ------------------------------------------------------------------ archive --

write_export_options() {
  # Xcode 15.3 renamed the App Store method; older Xcode rejects the new name.
  local method="app-store-connect" version major minor
  version="$(xcodebuild_version_line)"   # e.g. "Xcode 16.2"
  version="${version##* }"
  major="${version%%.*}"
  minor="${version#*.}"
  minor="${minor%%.*}"
  [[ "$major" =~ ^[0-9]+$ ]] || major=99
  [[ "$minor" =~ ^[0-9]+$ ]] || minor=0
  if [ "$major" -lt 15 ] || { [ "$major" -eq 15 ] && [ "$minor" -lt 3 ]; }; then
    method="app-store"
  fi

  # Without an API key, hand the upload to Xcode itself. `destination: upload`
  # authenticates with the Apple ID signed into Xcode on this machine, which is
  # the same path Organizer's "Distribute App" takes.
  local destination="export"
  if ! have_asc_credentials; then
    destination="upload"
    note "No App Store Connect key; exporting with destination=upload so Xcode's"
    note "  own signed-in account performs the upload."
  fi

  mkdir -p "$build_dir"
  cat >"$export_options" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>${method}</string>
	<key>destination</key>
	<string>${destination}</string>
	<key>teamID</key>
	<string>${team_id}</string>
	<key>signingStyle</key>
	<string>automatic</string>
	<key>uploadSymbols</key>
	<true/>
	<key>stripSwiftSymbols</key>
	<true/>
	<key>manageAppVersionAndBuildNumber</key>
	<false/>
</dict>
</plist>
PLIST
  note "Export method: ${method}, destination: ${destination}"
}

run_archive() {
  step "Archive — ${scheme}"
  local overrides=("DEVELOPMENT_TEAM=${team_id}")
  if [ -n "$build_number" ]; then
    overrides+=("CURRENT_PROJECT_VERSION=${build_number}")
  fi
  if [ -n "$marketing_version" ]; then
    overrides+=("MARKETING_VERSION=${marketing_version}")
  fi
  note "Build settings: ${overrides[*]}"

  rm -rf "$archive_path"
  mkdir -p "$build_dir"
  set_asc_auth_args

  xcodebuild archive \
    -project "$project" \
    -scheme "$scheme" \
    -configuration Release \
    -destination 'generic/platform=iOS' \
    -archivePath "$archive_path" \
    -derivedDataPath "$derived_data" \
    -allowProvisioningUpdates \
    "${asc_auth_args[@]+"${asc_auth_args[@]}"}" \
    "${overrides[@]}"

  [ -d "$archive_path" ] || die "archive was not produced at ${archive_path}"
  note "Archive: ${archive_path}"
}

run_export() {
  step "Export — ${scheme}"
  [ -d "$archive_path" ] || die "no archive at ${archive_path} — run the archive stage first"
  write_export_options
  rm -rf "$export_dir"
  set_asc_auth_args

  xcodebuild -exportArchive \
    -archivePath "$archive_path" \
    -exportPath "$export_dir" \
    -exportOptionsPlist "$export_options" \
    -allowProvisioningUpdates \
    "${asc_auth_args[@]+"${asc_auth_args[@]}"}"

  # destination=upload hands the build straight to App Store Connect and leaves
  # no .ipa behind, so its absence there is success rather than failure.
  if [ -f "$ipa_path" ]; then
    note "IPA: ${ipa_path} ($(du -h "$ipa_path" | cut -f1))"
  elif have_asc_credentials; then
    die "no IPA at ${ipa_path}"
  else
    note "Uploaded to App Store Connect by Xcode; no local IPA is produced."
    note "Processing takes 5-30 minutes before the build appears in TestFlight."
  fi
}

run_validate() {
  step "Validate with App Store Connect — ${scheme}"
  [ -f "$ipa_path" ] || die "no IPA at ${ipa_path} — run the export stage first"
  require_asc_credentials
  xcrun altool --validate-app \
    --type ios \
    --file "$ipa_path" \
    --apiKey "$ASC_KEY_ID" \
    --apiIssuer "$ASC_ISSUER_ID"
  note "Validation passed."
}

run_upload() {
  step "Upload to App Store Connect — ${scheme}"
  [ -f "$ipa_path" ] || die "no IPA at ${ipa_path} — run the export stage first"
  require_asc_credentials
  xcrun altool --upload-app \
    --type ios \
    --file "$ipa_path" \
    --apiKey "$ASC_KEY_ID" \
    --apiIssuer "$ASC_ISSUER_ID"
  note "Uploaded. Processing takes 5-30 minutes before the build appears in TestFlight."
}

run_preflight
case "$stage" in
  preflight) ;;
  archive)   run_archive ;;
  export)    run_export ;;
  validate)  run_validate ;;
  upload)    run_upload ;;
  all)
    run_archive
    run_export
    # With no API key the export already uploaded; altool has nothing to add
    # and could not authenticate anyway.
    if have_asc_credentials; then
      run_validate
      run_upload
    else
      note "Skipping altool validate/upload — Xcode already uploaded the build."
    fi
    ;;
esac

step "Done — ${stage}"
