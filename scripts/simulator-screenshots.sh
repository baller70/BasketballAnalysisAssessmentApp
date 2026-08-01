#!/usr/bin/env bash
# Boot an iPhone simulator, run the canonical screenshot + click-test walk, and
# export every captured screen as a PNG.
#
#   ./scripts/simulator-screenshots.sh
#   SIMSHOTS_DEVICE='iPhone 16 Pro' ./scripts/simulator-screenshots.sh
#   SIMSHOTS_OUTPUT_DIR=/somewhere/artifacts/simshots ./scripts/simulator-screenshots.sh
#
# The walk itself is ShotIQ/UITests/CanonicalScreenshotTests.swift: it launches
# the app with the test-only `-uiTestBypassAuth` flag, pushes into every screen
# it can reach, attaches a screenshot per screen, and asserts that each control
# it taps actually lands on the destination screen's accessibilityIdentifier.
#
# Nothing here signs anything, touches a keychain, or talks to App Store
# Connect — it is a simulator-only lane.
set -Eeuo pipefail

die() { printf 'SIMSHOTS_ERROR: %s\n' "$*" >&2; exit 1; }
note() { printf '  %s\n' "$*"; }
step() { printf '\n==> %s\n' "$*"; }

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_dir="${repo_root}/basketball-analysis/ios-native"
project="ShotIQ.xcodeproj"
scheme="ShotIQ"
ui_test_class="ShotIQUITests/CanonicalScreenshotTests"

output_dir="${SIMSHOTS_OUTPUT_DIR:-${repo_root}/artifacts/simshots}"
work_dir="${SIMSHOTS_WORK_DIR:-${repo_root}/artifacts/simshots-work}"
result_bundle="${work_dir}/ShotIQScreenshots.xcresult"
derived_data="${work_dir}/DerivedData"
sim_name="${SIMSHOTS_SIMULATOR_NAME:-ShotIQ-Screenshots}"

command -v xcrun >/dev/null 2>&1 || die 'xcrun is unavailable — this must run on a Mac with Xcode'
[ -d "$project_dir" ] || die "no iOS project at ${project_dir}"

rm -rf "$work_dir" "$output_dir"
mkdir -p "$work_dir" "$output_dir"

# The work dir usually lives inside a throwaway CI clone, so make sure the logs
# land next to the PNGs however this run ends.
log_dir="${SIMSHOTS_LOG_DIR:-$(dirname "$output_dir")}"
copy_logs() {
  mkdir -p "$log_dir" 2>/dev/null || return 0
  for log in "${work_dir}"/*.log "${work_dir}"/*.txt; do
    [ -f "$log" ] && cp -f "$log" "${log_dir}/simshots-$(basename "$log")" 2>/dev/null || true
  done
}
trap copy_logs EXIT

step 'Toolchain'
xcodebuild -version | tee "${work_dir}/xcode-version.txt"

# ------------------------------------------------------------------ project --
#
# project.yml is the source of truth. Regenerate when xcodegen is on the Mac;
# otherwise fall back to the committed .xcodeproj (kept in sync by hand).
cd "$project_dir"
if command -v xcodegen >/dev/null 2>&1; then
  step 'Regenerating the Xcode project from project.yml'
  xcodegen generate
else
  note 'xcodegen not installed — using the committed ShotIQ.xcodeproj'
fi

# ---------------------------------------------------------------- simulator --
#
# Prefer a simulator that already exists on this Mac. `simctl create` is the
# fragile path: on a runner whose CoreSimulator service does not match the
# installed runtime it fails with "Device was allocated but was stuck in
# creation state", while an already-created device boots fine.

step 'Choosing a simulator'
xcrun simctl list runtimes 2>&1 | tee "${work_dir}/simctl-runtimes.txt" | sed 's/^/  /' || true
xcrun simctl list devices 2>&1 | tee "${work_dir}/simctl-devices.txt" >/dev/null || true

udid=""
sim_label=""

select_simulator() {
  udid=""
  sim_label=""

  local existing
  existing="$(SIMSHOTS_DEVICE="${SIMSHOTS_DEVICE:-}" python3 "${repo_root}/scripts/simshots-pick-device.py" existing || true)"
  if [ -n "$existing" ]; then
    IFS=$'\t' read -r udid sim_label <<<"$existing"
    note "Reusing existing simulator: ${sim_label} (${udid})"
    xcrun simctl shutdown "$udid" >/dev/null 2>&1 || true
    xcrun simctl erase "$udid" >/dev/null 2>&1 || true
    return 0
  fi

  note 'No usable simulator exists yet — creating one'
  # Try every (iPhone device type, iOS runtime) pair, newest first, until one
  # sticks; one failure is not proof the machine cannot make simulators.
  local device_type_id device_type_name runtime_id runtime_name
  while IFS=$'\t' read -r device_type_id device_type_name runtime_id runtime_name; do
    [ -n "${device_type_id:-}" ] || continue
    note "Trying ${device_type_name} on ${runtime_name}"
    if udid="$(xcrun simctl create "$sim_name" "$device_type_id" "$runtime_id" 2>>"${work_dir}/simctl-create.log")"; then
      sim_label="${device_type_name} (${runtime_name})"
      return 0
    fi
    udid=""
    xcrun simctl delete "$sim_name" >/dev/null 2>&1 || true
  done < <(SIMSHOTS_DEVICE="${SIMSHOTS_DEVICE:-}" python3 "${repo_root}/scripts/simshots-pick-device.py" create)
  return 0
}

select_simulator

if [ -z "$udid" ]; then
  # "Device was allocated but was stuck in creation state" is what CoreSimulator
  # says when its daemon is still bound to a different Xcode than DEVELOPER_DIR
  # — which is exactly this runner, whose Xcode lives on an external volume.
  # Killing the service makes launchd restart it against the current Xcode.
  step 'Resetting CoreSimulator and retrying'
  sed 's/^/    /' "${work_dir}/simctl-create.log" 2>/dev/null | tail -12 || true
  xcrun simctl shutdown all >/dev/null 2>&1 || true
  killall -9 com.apple.CoreSimulator.CoreSimulatorService >/dev/null 2>&1 || true
  killall -9 Simulator >/dev/null 2>&1 || true
  sleep 8
  xcrun simctl list devices >/dev/null 2>&1 || true
  select_simulator
fi

if [ -z "$udid" ]; then
  note 'simctl create output:'
  sed 's/^/    /' "${work_dir}/simctl-create.log" 2>/dev/null | tail -20 || true
  note 'installed runtimes:'
  sed 's/^/    /' "${work_dir}/simctl-runtimes.txt" 2>/dev/null | tail -20 || true
  note 'known devices:'
  sed 's/^/    /' "${work_dir}/simctl-devices.txt" 2>/dev/null | tail -30 || true
  die 'no iOS simulator is available and none could be created'
fi
note "Simulator: ${sim_label:-unknown} (${udid})"

step 'Booting the simulator'
xcrun simctl boot "$udid" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$udid" -b || die 'the simulator never finished booting'
# Deterministic chrome for the screenshots (the app hides the status bar, but
# an override keeps anything that does show it stable).
xcrun simctl status_bar "$udid" override --time "9:41" --batteryState charged --batteryLevel 100 \
  >/dev/null 2>&1 || true

# ---------------------------------------------------------------- the walk --

destination="platform=iOS Simulator,id=${udid}"

step "Building ${scheme} for the simulator"
set +e
xcodebuild build-for-testing \
  -project "$project" \
  -scheme "$scheme" \
  -configuration Debug \
  -destination "$destination" \
  -derivedDataPath "$derived_data" \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | tee "${work_dir}/xcodebuild-build.log" | tail -40
build_status="${PIPESTATUS[0]}"
set -e
[ "$build_status" -eq 0 ] || die "build-for-testing failed (see simshots-xcodebuild-build.log)"

step 'Running the canonical screenshot + click-test walk'
set +e
xcodebuild test-without-building \
  -project "$project" \
  -scheme "$scheme" \
  -configuration Debug \
  -destination "$destination" \
  -derivedDataPath "$derived_data" \
  -resultBundlePath "$result_bundle" \
  -only-testing:"$ui_test_class" \
  -test-timeouts-enabled YES \
  -maximum-test-execution-time-allowance 1800 \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | tee "${work_dir}/xcodebuild-test.log" | tail -80
test_status="${PIPESTATUS[0]}"
set -e
note "xcodebuild test exit status: ${test_status}"

xcrun simctl shutdown "$udid" >/dev/null 2>&1 || true

# ------------------------------------------------------------- attachments --
#
# Xcode 16+ renamed the whole xcresulttool surface. Try the modern exporter
# first, then the per-test variant, then xcparse, then the legacy object walk.
# Whichever one works, the payload lands in $export_dir with a manifest that
# maps exported file names back to the attachment names the test chose.
step 'Exporting screenshots from the result bundle'
[ -d "$result_bundle" ] || die "no result bundle at ${result_bundle} — the test run produced nothing"

export_dir="${work_dir}/attachments"
mkdir -p "$export_dir"

exported=0
if xcrun xcresulttool export attachments \
     --path "$result_bundle" --output-path "$export_dir" \
     >"${work_dir}/export.log" 2>&1; then
  note 'Exported with: xcresulttool export attachments'
  exported=1
else
  note 'Whole-bundle export unavailable; trying per-test export'
  sed 's/^/    /' "${work_dir}/export.log" || true
  if xcrun xcresulttool get test-results tests --path "$result_bundle" --format json \
       >"${work_dir}/tests.json" 2>/dev/null; then
    while IFS= read -r test_id; do
      [ -n "$test_id" ] || continue
      xcrun xcresulttool export attachments \
        --path "$result_bundle" --output-path "$export_dir" \
        --test-id "$test_id" >>"${work_dir}/export.log" 2>&1 || true
    done < <(python3 "${repo_root}/scripts/simshots-export-attachments.py" test-ids "${work_dir}/tests.json")
    [ -n "$(ls -A "$export_dir" 2>/dev/null)" ] && exported=1
  fi
fi

if [ "$exported" -eq 0 ] && command -v xcparse >/dev/null 2>&1; then
  note 'Falling back to xcparse'
  xcparse screenshots "$result_bundle" "$export_dir" >>"${work_dir}/export.log" 2>&1 || true
  [ -n "$(ls -A "$export_dir" 2>/dev/null)" ] && exported=1
fi

if [ "$exported" -eq 0 ]; then
  note 'Falling back to the legacy xcresulttool object walk'
  python3 "${repo_root}/scripts/simshots-export-attachments.py" legacy "$result_bundle" "$export_dir" \
    | sed 's/^/    /' || true
fi

step "Naming the PNGs into ${output_dir}"
python3 "${repo_root}/scripts/simshots-export-attachments.py" rename "$export_dir" "$output_dir"

png_count="$(find "$output_dir" -type f -name '*.png' | wc -l | tr -d ' ')"
find "$output_dir" -type f | sort | sed "s|${output_dir}/|  |" | tee "${work_dir}/simshots-index.txt"

step 'Result'
note "screenshots: ${png_count}"
note "output:      ${output_dir}"

[ "$png_count" -gt 0 ] || die 'the walk captured no screenshots'
[ "$test_status" -eq 0 ] || die "the UI test run failed (exit ${test_status}) — see simshots-xcodebuild-test.log"

printf '\nSIMSHOTS_READY: %s screenshots in %s\n' "$png_count" "$output_dir"
