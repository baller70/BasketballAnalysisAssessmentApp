#!/usr/bin/env bash
# Boot an iPhone simulator, run the canonical screenshot + click-test walk, and
# export every captured screen as a PNG.
#
#   ./scripts/simulator-screenshots.sh
#   SIMSHOTS_DEVICE='iPhone 16 Pro' ./scripts/simulator-screenshots.sh
#   SIMSHOTS_OUTPUT_DIR=/somewhere/artifacts/simshots ./scripts/simulator-screenshots.sh
#
#   # the configuration a real phone with larger text actually runs:
#   SIMSHOTS_CONTENT_SIZE=accessibility-medium ./scripts/simulator-screenshots.sh
#   # ... and the same walk with the app's type clamp lifted, to show what the
#   # clamp is preventing:
#   SIMSHOTS_CONTENT_SIZE=accessibility-medium SIMSHOTS_EXTRA_ARGS=-uiTestNoTypeClamp \
#     ./scripts/simulator-screenshots.sh
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

# CoreSimulator stores every device under ~/Library/Developer/CoreSimulator/Devices.
# On this runner that path is redirected to an offload folder the account cannot
# write, so *every* `simctl create` dies with "Device was allocated but was stuck
# in creation state" and the machine ends up with zero simulators. Repair it —
# in place if we own the folder, otherwise by pointing the set at a directory the
# runner definitely owns.
writable_dir() {
  local dir="$1" probe
  [ -d "$dir" ] || return 1
  probe="${dir}/.simshots-probe.$$"
  if mkdir "$probe" 2>/dev/null; then rmdir "$probe"; return 0; fi
  return 1
}

restart_coresimulator() {
  xcrun simctl shutdown all >/dev/null 2>&1 || true
  killall -9 com.apple.CoreSimulator.CoreSimulatorService >/dev/null 2>&1 || true
  killall -9 Simulator >/dev/null 2>&1 || true
  sleep 8
  xcrun simctl list devices >/dev/null 2>&1 || true
}

# Move the device set back onto the boot volume. A plain mkdir succeeds on the
# offload volume, so a write probe is not enough to detect this — CoreSimulator
# fails later, when it clones the runtime's sample content, with EPERM. Only a
# real local directory is known to work.
force_local_device_set() {
  local root="${HOME}/Library/Developer/CoreSimulator"
  local devices="${root}/Devices"
  local local_set="${root}/Devices.simshots"

  if [ -d "$devices" ] && [ ! -L "$devices" ]; then
    note 'The device set is already a real directory on the boot volume — nothing to repoint'
    return 1
  fi

  local current=""
  [ -L "$devices" ] && current="$(readlink "$devices")"
  mkdir -p "$local_set" 2>/dev/null || true
  writable_dir "$local_set" || { note "cannot create ${local_set}"; return 1; }

  local stamp backup
  stamp="$(date +%Y%m%d-%H%M%S)"
  backup="${devices}.simshots-backup-${stamp}"
  if [ -e "$devices" ] || [ -L "$devices" ]; then
    mv "$devices" "$backup" 2>/dev/null || rm -f "$devices" || { note 'could not move the device set aside'; return 1; }
  fi
  ln -s "$local_set" "$devices" || { note 'could not repoint the device set'; return 1; }

  {
    echo 'simshots repointed the CoreSimulator device set onto the boot volume'
    echo "  was:     ${current:-<real directory>}"
    echo "  now:     ${local_set}"
    echo "  restore: rm '${devices}' && mv '${backup}' '${devices}'"
    echo '  reason:  CoreSimulator cannot clone runtime sample content onto the'
    echo '           offload volume (EPERM), so every simctl create failed.'
    df -h "$HOME" 2>&1 | head -3
  } | tee "${work_dir}/coresimulator-device-set.txt" | sed 's/^/  /'

  restart_coresimulator
  return 0
}

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
  # "Device was allocated but was stuck in creation state" also shows up when the
  # daemon is still bound to a different Xcode than DEVELOPER_DIR. Killing the
  # service makes launchd restart it against the current one.
  step 'Resetting CoreSimulator and retrying'
  sed 's/^/    /' "${work_dir}/simctl-create.log" 2>/dev/null | tail -12 || true
  restart_coresimulator
  select_simulator
fi

if [ -z "$udid" ]; then
  step 'Moving the simulator device set onto the boot volume and retrying'
  if force_local_device_set; then
    select_simulator
  fi
fi

if [ -z "$udid" ]; then
  note 'simctl create output:'
  sed 's/^/    /' "${work_dir}/simctl-create.log" 2>/dev/null | tail -20 || true
  note 'installed runtimes:'
  sed 's/^/    /' "${work_dir}/simctl-runtimes.txt" 2>/dev/null | tail -20 || true
  note 'known devices:'
  sed 's/^/    /' "${work_dir}/simctl-devices.txt" 2>/dev/null | tail -30 || true

  step 'CoreSimulator diagnostics'
  {
    echo "--- whoami / HOME"; whoami; echo "HOME=${HOME}"
    echo "--- xcode-select -p"; xcode-select -p 2>&1
    echo "--- DEVELOPER_DIR=${DEVELOPER_DIR:-<unset>}"
    echo "--- simctl runtime list"; xcrun simctl runtime list -v 2>&1 | head -60
    echo "--- CoreSimulator dir"; ls -la "${HOME}/Library/Developer/CoreSimulator/" 2>&1 | head -20
    echo "--- Devices dir"; ls -la "${HOME}/Library/Developer/CoreSimulator/Devices" 2>&1 | head -20
    echo "--- free space"; df -h "${HOME}" 2>&1 | head -5
    echo "--- CoreSimulator.log tail"
    tail -80 "${HOME}/Library/Logs/CoreSimulator/CoreSimulator.log" 2>&1
  } 2>&1 | tee "${work_dir}/coresimulator-diagnostics.txt" | sed 's/^/    /'

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

# THE TEXT SIZE IS PART OF THE ENVIRONMENT, AND LEAVING IT AT THE DEFAULT HID A
# REAL BUG FOR AS LONG AS THIS SCRIPT HAS EXISTED.
#
# Every one of the app's ~176 type declarations is `Font.custom(_:size:)`, which
# scales with the phone's Text Size setting, while the layout around it is fixed
# canonical geometry. On a phone set above the default the text outgrows its
# containers, rows sum wider than the screen, and the whole screen is drawn wider
# than the viewport and centred — clipped off both edges, wordmark and tab bar
# included. Kevin was looking at exactly that while all 74 screenshots from this
# script came back clean, because a freshly created simulator always boots at the
# default size. A capture that only ever samples the default configuration is not
# evidence about the configurations users actually run.
#
# `SIMSHOTS_CONTENT_SIZE` sets the simulator's content size category for the run.
# Values are simctl's: small … large (default) … extra-extra-extra-large, then
# accessibility-medium … accessibility-extra-extra-extra-large.
content_size="${SIMSHOTS_CONTENT_SIZE:-}"
if [ -n "$content_size" ]; then
  step "Setting the simulator content size to ${content_size}"
  xcrun simctl ui "$udid" content_size "$content_size" \
    || die "simctl ui content_size ${content_size} was rejected — check the spelling against 'xcrun simctl ui --help'"
  note 'A run at a non-default content size measures the app as a real phone draws it.'
fi

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
# Hard deadline. A UI walk that wedges on one screen must not eat the whole CI
# job: kill it and export whatever the result bundle already holds, so a slow or
# stuck screen still produces evidence instead of a bare timeout.
test_deadline="${SIMSHOTS_TEST_DEADLINE:-2400}"
test_log="${work_dir}/xcodebuild-test.log"
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
  -maximum-test-execution-time-allowance 420 \
  CODE_SIGNING_ALLOWED=NO \
  TEST_RUNNER_SIMSHOTS_EXTRA_ARGS="${SIMSHOTS_EXTRA_ARGS:-}" \
  >"$test_log" 2>&1 &
xcodebuild_pid=$!

test_timed_out=0
deadline_at=$(( $(date +%s) + test_deadline ))
while kill -0 "$xcodebuild_pid" 2>/dev/null; do
  if [ "$(date +%s)" -ge "$deadline_at" ]; then
    note "the walk passed its ${test_deadline}s deadline — stopping it so the screenshots still get exported"
    kill -TERM "$xcodebuild_pid" 2>/dev/null || true
    sleep 15
    kill -9 "$xcodebuild_pid" 2>/dev/null || true
    pkill -9 -f 'xctest|testmanagerd|XCTRunner' 2>/dev/null || true
    test_timed_out=1
    break
  fi
  sleep 10
done
wait "$xcodebuild_pid"
test_status=$?
set -e
[ "$test_timed_out" -eq 1 ] && test_status=124
tail -80 "$test_log" || true
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
