#!/usr/bin/env bash
# Broker entry point: the kcloud-xcode-runner release lane calls
#   ./scripts/appstore-release.sh <app> <stage> [--build N ...]
# from the repo root. ShotIQ is a single app; this wrapper validates the app
# name, recovers the App Store Connect credentials already on this Mac when
# the environment does not provide them (same discovery the HoopTrack lane
# uses), and delegates to the real release script next to the Xcode project.
set -Eeuo pipefail

die() {
  printf 'APPSTORE_RELEASE_ERROR: %s\n' "$*" >&2
  exit 1
}

app="${1:-}"; shift || true
case "$app" in
  shotiq) ;;
  -h|--help)
    echo "Usage: scripts/appstore-release.sh shotiq <stage> [--build N] [--version x.y.z]"
    exit 0 ;;
  *) die "app must be 'shotiq' (got '${app:-}')" ;;
esac

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Homebrew lives off-PATH in daemon sessions; xcodegen (optional — the
# generated ShotIQ.xcodeproj is committed) and other tools may sit there.
export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH}"

# Recover the ASC key from this Mac when the caller did not provide it. The
# helper writes export lines to a mode-600 temp file and never echoes the key.
if [ -z "${ASC_KEY_ID:-}" ] || [ -z "${ASC_ISSUER_ID:-}" ]; then
  helper="${repo_root}/scripts/appfactory-credentials.sh"
  if [ -f "$helper" ]; then
    creds_out="$(mktemp)"
    if bash "$helper" "$creds_out"; then
      # shellcheck disable=SC1090
      . "$creds_out"
    fi
    rm -f "$creds_out"
  fi
fi

exec bash "${repo_root}/basketball-analysis/ios-native/release/appstore-release.sh" "$@"
