#!/usr/bin/env bash
# Launch the physical-device installer inside the logged-in Mac GUI session.
#
# Tailscale/SSH can run xcodebuild, but Xcode's automatic signing sometimes
# needs the GUI user's keychain services to mint and use a Development identity.
# This wrapper is intentionally tiny: it creates an external-drive runner and
# asks Terminal to execute it in the desktop session.
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
xcode_work_root="${XCODE_WORK_ROOT:-/Volumes/APPLICATIONS/06_XCODE_TESTING}"
derived_data="${SHOTIQ_DERIVED_DATA:-${xcode_work_root}/DerivedData/shotiq-device-gui}"
run_dir="${xcode_work_root}/gui-runners"
log_dir="${xcode_work_root}/logs"
mkdir -p "$run_dir" "$log_dir"

stamp="$(date +%Y%m%d-%H%M%S)"
runner="${run_dir}/shotiq-device-install-${stamp}.sh"
log="${log_dir}/shotiq-device-gui-${stamp}.log"

cat > "$runner" <<SCRIPT
#!/usr/bin/env bash
set -o pipefail
cd "$repo_root"
export DEVELOPER_DIR="\${DEVELOPER_DIR:-/Volumes/APPLICATIONS/02_STORAGE_AND_RUNTIME/mac-storage/xcode-archive/Xcode.app/Contents/Developer}"
export PATH="\$DEVELOPER_DIR/usr/bin:\$DEVELOPER_DIR/Toolchains/XcodeDefault.xctoolchain/usr/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export SHOTIQ_DERIVED_DATA="$derived_data"
export XCODE_WORK_ROOT="$xcode_work_root"
export SHOTIQ_SIGNING_WORK_ROOT="\$XCODE_WORK_ROOT/SigningWork"
export SHOTIQ_SIGNING_KEYCHAIN_ROOT="\$HOME/Library/Keychains/shotiq-device-signing"
export SHOTIQ_CREATE_DEV_CERT=0
bash ./scripts/install-on-device.sh 2>&1 | tee "$log"
printf '\\nGUI_INSTALL_EXIT:%s\\n' "\${PIPESTATUS[0]}" >> "$log"
SCRIPT
chmod +x "$runner"

osascript \
  -e 'tell application "Terminal" to activate' \
  -e "tell application \"Terminal\" to do script quoted form of \"$runner\""

printf 'GUI install launched.\n'
printf 'Runner: %s\n' "$runner"
printf 'Log: %s\n' "$log"
