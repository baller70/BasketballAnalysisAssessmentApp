#!/usr/bin/env bash
# Parse-verify every Swift source with a real Swift toolchain.
#
# On Linux this is the verification ceiling for this target: swiftc -parse runs
# the actual Swift 6 parser (grammar + structure), but type-checking is
# impossible off-macOS because SwiftUI and Security are Apple-platform
# frameworks. Full type-check + build + XCTest still require Xcode on macOS:
#   xcodegen generate && xcodebuild -project ShotIQ.xcodeproj -scheme ShotIQ \
#     -destination 'platform=iOS Simulator,name=iPhone 16' test
#
# Usage: SWIFTC=/path/to/swiftc ./verify-parse.sh   (defaults to swiftc on PATH)
set -u
SWIFTC="${SWIFTC:-swiftc}"
command -v "$SWIFTC" >/dev/null || { echo "swiftc not found — set SWIFTC"; exit 2; }
fail=0; pass=0
while IFS= read -r f; do
  if "$SWIFTC" -parse "$f" >/dev/null 2>&1; then
    pass=$((pass+1))
  else
    fail=$((fail+1)); echo "PARSE FAIL $f"; "$SWIFTC" -parse "$f" 2>&1 | head -5
  fi
done < <(find ShotIQ -name '*.swift' | sort)
echo "parsed OK: $pass  failed: $fail"
[ "$fail" -eq 0 ]
