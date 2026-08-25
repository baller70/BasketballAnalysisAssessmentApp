#!/usr/bin/env bash
# Source this before running ShotIQ native iOS lanes from any Kevin/Codex Mac.
#
# It intentionally contains no secrets. App Store Connect credentials live in
# ~/.shotiq/asc.env, and the private .p8 key lives outside git.
#
# Usage:
#   source scripts/shotiq-xcode-env.sh
#   cd basketball-analysis/ios-native
#   xcodebuild -version

shotiq_repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export PATH="/opt/homebrew/bin:${HOME}/.local/bin:${PATH}"

if [ -x "/Volumes/TBF SKILLZ.INC/xcode-archive/Xcode.app/Contents/Developer/usr/bin/xcodebuild" ]; then
  export DEVELOPER_DIR="/Volumes/TBF SKILLZ.INC/xcode-archive/Xcode.app/Contents/Developer"
elif [ -x "/Volumes/APPLICATIONS/02_STORAGE_AND_RUNTIME/mac-storage/xcode-archive/Xcode.app/Contents/Developer/usr/bin/xcodebuild" ]; then
  export DEVELOPER_DIR="/Volumes/APPLICATIONS/02_STORAGE_AND_RUNTIME/mac-storage/xcode-archive/Xcode.app/Contents/Developer"
elif [ -x "/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild" ]; then
  export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
fi

if [ -f "${HOME}/.shotiq/asc.env" ]; then
  # shellcheck disable=SC1091
  . "${HOME}/.shotiq/asc.env"
fi

export SHOTIQ_REPO_ROOT="$shotiq_repo_root"

shotiq_xcode_doctor() {
  printf 'SHOTIQ_REPO_ROOT=%s\n' "${SHOTIQ_REPO_ROOT:-}"
  printf 'DEVELOPER_DIR=%s\n' "${DEVELOPER_DIR:-<unset>}"
  if [ -n "${DEVELOPER_DIR:-}" ] && [ -x "${DEVELOPER_DIR}/usr/bin/xcodebuild" ]; then
    "${DEVELOPER_DIR}/usr/bin/xcodebuild" -version
  else
    printf 'xcodebuild unavailable; mirror Xcode or install it under /Applications.\n' >&2
    return 1
  fi
  printf 'ASC_KEY_ID=%s\n' "$([ -n "${ASC_KEY_ID:-}" ] && echo '<set>' || echo '<unset>')"
  printf 'ASC_ISSUER_ID=%s\n' "$([ -n "${ASC_ISSUER_ID:-}" ] && echo '<set>' || echo '<unset>')"
  printf 'ASC_KEY_PATH=%s\n' "$([ -n "${ASC_KEY_PATH:-}" ] && [ -r "${ASC_KEY_PATH}" ] && echo '<readable>' || echo '<unset-or-unreadable>')"
  command -v xcodegen >/dev/null 2>&1 && xcodegen --version || printf 'xcodegen missing from PATH\n' >&2
}
