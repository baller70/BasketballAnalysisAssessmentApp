#!/usr/bin/env bash
# Build ShotIQ for a physical iPhone and install it straight onto it.
#
#   ./scripts/install-on-device.sh
#   DEVICE_UDID=00008030-... ./scripts/install-on-device.sh
#
# Ported from the hooptrack lane that put HoopTrack on the phone. This is not
# the App Store path: an app-store-signed IPA cannot be installed on a device
# directly, so this builds Debug with a *development* identity that xcodebuild
# creates on demand through the App Store Connect key, and hands the result to
# devicectl. It never touches the archive, the upload, or anything in review.
set -Eeuo pipefail

die() { printf 'INSTALL_ERROR: %s\n' "$*" >&2; exit 1; }
note() { printf '  %s\n' "$*"; }
step() { printf '\n==> %s\n' "$*"; }

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

team_id="DD9G8RP575"
project_dir="basketball-analysis/ios-native"
project="ShotIQ.xcodeproj"
scheme="ShotIQ"
derived_data="${SHOTIQ_DERIVED_DATA:-/Volumes/TBF SKILLZ.INC/CodexWork/DerivedData/shotiq-device}"

# ---------------------------------------------------------------- the device --

step 'Finding the device'
devices_json="$(mktemp)"
xcrun devicectl list devices --json-output "$devices_json" >/dev/null 2>&1 \
  || die 'devicectl could not list devices'

read -r device_id device_udid device_name device_state <<<"$(
  DEVICE_UDID="${DEVICE_UDID:-}" python3 - "$devices_json" <<'PY'
import json, os, sys

wanted = os.environ.get('DEVICE_UDID', '').strip()
devices = json.load(open(sys.argv[1])).get('result', {}).get('devices', [])

def udid_of(d):
    return (d.get('hardwareProperties', {}) or {}).get('udid', '')

def name_of(d):
    return (d.get('deviceProperties', {}) or {}).get('name', '?')

def state_of(d):
    return (d.get('connectionProperties', {}) or {}).get('tunnelState', '?')

def usable(d):
    # "available (paired)" is installable. Only treat an explicit unavailable
    # or disconnected as unusable, and even then only for ranking.
    return not state_of(d).startswith(('unavailable', 'disconnected'))

def is_iphone(d):
    # The Mac also has a paired iPad; the deliverable goes on the PHONE.
    product = (d.get('hardwareProperties', {}) or {}).get('productType', '')
    return product.startswith('iPhone') or 'iphone' in name_of(d).lower()

def matches(d, wanted):
    """DEVICE_UDID accepts EITHER id devicectl prints for the phone.

    `xcrun devicectl list devices` shows an Identifier column — a CoreDevice
    UUID like 37711652-37E7-57D1-9C76-8E028428D01B — and that is the value
    anyone reads off the terminal and pastes in. It is NOT
    hardwareProperties.udid, which is the 00008030-style hardware id. Matching
    only the latter meant a correct-looking DEVICE_UDID selected nothing and
    the script reported 'no paired iPhone at all' while devicectl was listing
    the phone as available (paired) one command earlier.

    Case-insensitive because the two ids differ in case between tools.
    """
    w = wanted.lower()
    return w in (udid_of(d).lower(), (d.get('identifier', '') or '').lower())

candidates = [d for d in devices if not wanted or matches(d, wanted)]
if wanted and not candidates:
    # Say which id was looked for and what is actually attached, rather than
    # claiming nothing is paired.
    sys.stderr.write(
        'DEVICE_UDID=%s matched no device. Attached:\n%s\n' % (
            wanted,
            '\n'.join('  %s  udid=%s  identifier=%s' % (
                name_of(d), udid_of(d) or '-', d.get('identifier', '-'))
                for d in devices) or '  (none)'))
ranked = sorted(candidates, key=lambda d: (not is_iphone(d), not usable(d)))
chosen = (ranked or [None])[0]

if chosen is None:
    print('  ')
else:
    print(' '.join([
        chosen.get('identifier', ''),
        # Second field feeds `-destination id=...`. Prefer the hardware udid,
        # but a device that reports none must not turn into a literal '-' and
        # send xcodebuild looking for a device called dash.
        udid_of(chosen) or chosen.get('identifier', ''),
        name_of(chosen).replace(' ', '_'),
        state_of(chosen),
    ]))
PY
)"

[ -n "${device_id:-}" ] || die 'no paired iPhone at all — pair it with the Mac in Xcode first'
note "Device: ${device_name//_/ } (${device_udid})"
note "Connection state: ${device_state}"

# Do not refuse on the reported state. devicectl's tunnelState says whether a
# network tunnel is up, which is not the same question as "can this be
# installed" — a USB-attached phone can read as disconnected and install fine.
case "$device_state" in
  unavailable|disconnected|'?')
    note "WARNING: reported state is '${device_state}'. Trying anyway —"
    note "         if this fails, plug the phone into this Mac, unlock it, and"
    note "         tap Trust." ;;
esac

# ------------------------------------------------------------- credentials --

if [ -f "${repo_root}/scripts/appfactory-credentials.sh" ] && [ -z "${ASC_KEY_ID:-}" ]; then
  creds="$(mktemp)"
  bash "${repo_root}/scripts/appfactory-credentials.sh" "$creds" || true
  if [ -s "$creds" ]; then
    # shellcheck disable=SC1090
    . "$creds"
    note 'Using the App Store Connect key already on this Mac.'
  fi
  rm -f "$creds"
fi

auth_args=()
if [ -n "${ASC_KEY_ID:-}" ] && [ -n "${ASC_ISSUER_ID:-}" ] && [ -n "${ASC_KEY_PATH:-}" ] && [ -f "${ASC_KEY_PATH}" ]; then
  auth_args=(
    -authenticationKeyID "$ASC_KEY_ID"
    -authenticationKeyIssuerID "$ASC_ISSUER_ID"
    -authenticationKeyPath "$ASC_KEY_PATH"
  )
fi

# ------------------------------------------------------------- keychain --
#
# A device build signs with an Apple *Development* identity, and the only one
# on this Mac sits in login.keychain — which a runner with no GUI session
# cannot unlock, so codesign dies with errSecInternalComponent after the app
# has already compiled. Build inside a throwaway unlocked keychain instead;
# -allowProvisioningUpdates mints a development certificate there through the
# API key.
signing_keychain=""
original_keychains=""
original_default=""

cleanup() {
  rm -f "$devices_json"

  # The keychain search path and default are *per-user* settings, shared with
  # whatever GUI session that user has open. Restoring is required — fall back
  # to login.keychain rather than leave the machine pointed at something
  # unopenable.
  local login="${HOME}/Library/Keychains/login.keychain-db"

  if [ -n "$original_keychains" ]; then
    # shellcheck disable=SC2086
    security list-keychains -d user -s $original_keychains 2>/dev/null \
      || security list-keychains -d user -s "$login" 2>/dev/null || true
  elif [ -n "$signing_keychain" ]; then
    security list-keychains -d user -s "$login" 2>/dev/null || true
  fi

  if [ -n "$original_default" ] && [ -e "$original_default" ]; then
    security default-keychain -d user -s "$original_default" 2>/dev/null || true
  elif [ -n "$signing_keychain" ]; then
    security default-keychain -d user -s "$login" 2>/dev/null || true
  fi

  [ -n "$signing_keychain" ] && security delete-keychain "$signing_keychain" 2>/dev/null || true

  if [ -n "$signing_keychain" ]; then
    if security list-keychains -d user | grep -q 'device-signing'; then
      printf 'WARNING: the throwaway keychain is still on the search path.\n' >&2
      printf '         Run: security list-keychains -d user -s %s\n' "$login" >&2
    fi
  fi
}
trap cleanup EXIT INT TERM

step 'Preparing a keychain codesign can actually use'

signing_keychain="$(mktemp -d)/device-signing.keychain-db"
signing_password="$(openssl rand -base64 24)"

original_keychains=""
while IFS= read -r kc; do
  kc="${kc#"${kc%%[![:space:]]*}"}"; kc="${kc%\"}"; kc="${kc#\"}"
  [ -n "$kc" ] && [ -e "$kc" ] && original_keychains="${original_keychains}${kc} "
done < <(security list-keychains -d user)
original_default="$(security default-keychain -d user | sed -e 's/^[[:space:]]*//' -e 's/"//g')"
[ -e "$original_default" ] || original_default="${HOME}/Library/Keychains/login.keychain-db"

security create-keychain -p "$signing_password" "$signing_keychain"
security set-keychain-settings -lut 21600 "$signing_keychain"
security unlock-keychain -p "$signing_password" "$signing_keychain"
# The throwaway keychain must be the ONLY one on the search path, or automatic
# signing keeps picking the locked Apple Development identity in login.keychain.
security list-keychains -d user -s "$signing_keychain"
security default-keychain -d user -s "$signing_keychain"
security set-key-partition-list -S apple-tool:,apple:,codesign: \
  -k "$signing_password" "$signing_keychain" >/dev/null 2>&1 || true
unset signing_password

note "Signing into ${signing_keychain}"
note 'xcodebuild will create a development certificate here through the API key.'

# A previous device build's certificate has its private key in a deleted
# throwaway keychain; Apple refuses to mint a new one while that orphan
# exists ("Revoke certificate: ... private key is not installed"). Revoke
# stale Development certs so -allowProvisioningUpdates can create a fresh
# one. Distribution certs (TestFlight / App Store) are untouched.
step 'Revoking orphaned development certificates'
node_bin="$(command -v node || echo /opt/homebrew/bin/node)"
"$node_bin" "${repo_root}/scripts/revoke-stale-dev-cert.mjs" --confirm || true

# ------------------------------------------------------------------ install --

cd "${repo_root}/${project_dir}"

# ALWAYS regenerate the project, the way the CI workflow does.
#
# ShotIQ.xcodeproj is generated by XcodeGen from project.yml, but a copy of it
# is ALSO committed — and a committed generated file goes stale the moment a
# source file is added without re-running xcodegen. It had: PoseDetection.swift
# and CapturedPoseImage.swift were in git and on disk but were not members of
# the target, so the device build died with
#
#     error: cannot find type 'DetectedPose' in scope
#
# in the two screens that draw the player's skeleton. The whole on-device pose
# feature was simply not being compiled. CI never noticed because
# `ios-appstore.yml` runs `xcodegen generate` first and overwrites the stale
# file; only builds that trusted the committed project broke.
#
# Generating unconditionally means target membership always matches the files
# actually on disk, so adding a source file can never silently not-ship again.
if [ -f project.yml ]; then
  step "Generating ${project} from project.yml"

  xcodegen_bin="$(command -v xcodegen || true)"
  for candidate in /opt/homebrew/bin/xcodegen /usr/local/bin/xcodegen "${HOME}/.mint/bin/xcodegen"; do
    [ -n "$xcodegen_bin" ] && break
    [ -x "$candidate" ] && xcodegen_bin="$candidate"
  done

  if [ -z "$xcodegen_bin" ]; then
    brew_bin="$(command -v brew || true)"
    [ -n "$brew_bin" ] || { [ -x /opt/homebrew/bin/brew ] && brew_bin=/opt/homebrew/bin/brew; }
    if [ -n "$brew_bin" ]; then
      note 'XcodeGen is missing; installing it with Homebrew.'
      "$brew_bin" install xcodegen >/dev/null 2>&1 || true
      xcodegen_bin="$(command -v xcodegen || true)"
      [ -n "$xcodegen_bin" ] || [ ! -x /opt/homebrew/bin/xcodegen ] || xcodegen_bin=/opt/homebrew/bin/xcodegen
    fi
  fi

  if [ -n "$xcodegen_bin" ]; then
    "$xcodegen_bin" generate || die 'xcodegen could not generate the project'
    note "Generated ${project}"
  elif [ -d "$project" ]; then
    # Falling back to the committed project is worth doing rather than
    # refusing outright, but say so plainly: if it is out of date this build
    # fails on a missing type, and that error will not mention xcodegen.
    note 'WARNING: XcodeGen is not installed and could not be installed.'
    note "         Using the COMMITTED ${project}, which may be missing files"
    note '         added since it was generated. A "cannot find type ... in'
    note '         scope" error below means exactly that — install XcodeGen.'
  else
    die "no ${project} and XcodeGen is not available to generate one"
  fi
fi

[ -d "$project" ] || die "no ${project} in ${PWD}"

step "Destinations this project can actually target"
xcodebuild -showdestinations -project "$project" -scheme "$scheme" 2>&1 \
  | sed -n '/Available destinations/,/^$/p' | head -12 || true

step "Building ${scheme} for the device"
xcodebuild build \
  -project "$project" \
  -scheme "$scheme" \
  -configuration Debug \
  -destination "platform=iOS,id=${device_udid}" \
  -derivedDataPath "$derived_data" \
  -allowProvisioningUpdates \
  "${auth_args[@]+"${auth_args[@]}"}" \
  DEVELOPMENT_TEAM="$team_id"

app_path="${derived_data}/Build/Products/Debug-iphoneos/${scheme}.app"
[ -d "$app_path" ] || die "no ${scheme}.app at ${app_path}"
note "Built: ${app_path}"

step "Installing ${scheme} onto ${device_name//_/ }"
xcrun devicectl device install app --device "$device_id" "$app_path"
note "${scheme} is on the phone."

step "Done — ShotIQ installed on ${device_name//_/ }"
note 'The app is on the home screen. It points at the live backend.'
