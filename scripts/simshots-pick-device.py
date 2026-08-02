#!/usr/bin/env python3
"""Pick the iPhone simulator that scripts/simulator-screenshots.sh should use.

Two modes:

  existing  print "<udid>\\t<name>" for the best already-created, available
            iPhone simulator, or nothing at all when there is none.
  create    print one "<devicetype-id>\\t<devicetype-name>\\t<runtime-id>\\t
            <runtime-name>" candidate per line, best first, so the caller can
            try `simctl create` until one succeeds.

Preference order in both modes: an explicit $SIMSHOTS_DEVICE, then "iPhone 16"
(the canonical review device), then the newest runtime and newest model, with a
plain "iPhone <n>" ahead of Pro / Pro Max / Plus / mini / SE.
"""
import json
import os
import re
import subprocess
import sys

WANTED = os.environ.get("SIMSHOTS_DEVICE", "").strip()


def simctl_json(*args):
    out = subprocess.run(["xcrun", "simctl", "list", "--json", *args],
                         capture_output=True, text=True).stdout
    try:
        return json.loads(out)
    except Exception:
        return {}


def model_rank(name):
    nums = re.findall(r"\d+", name)
    generation = int(nums[0]) if nums else 0
    return (
        0 if (WANTED and name == WANTED) else 1,
        0 if name == "iPhone 16" else 1,
        -generation,
        0 if re.fullmatch(r"iPhone \d+", name) else 1,
        name,
    )


def existing():
    data = simctl_json("devices", "available").get("devices", {})
    candidates = []
    for runtime, devices in data.items():
        if "iOS" not in runtime:
            continue
        parts = re.findall(r"iOS-(\d+)-(\d+)", runtime)
        major, minor = (int(parts[0][0]), int(parts[0][1])) if parts else (0, 0)
        for d in devices:
            name = d.get("name", "")
            if "iPhone" not in name or not d.get("isAvailable", False):
                continue
            if d.get("state") == "Creating":
                continue
            candidates.append((major, minor, name, d["udid"]))

    if not candidates:
        return

    def rank(c):
        major, minor, name, _ = c
        m = model_rank(name)
        return (m[0], m[1], -major, -minor, m[2], m[3], m[4])

    _major, _minor, name, udid = sorted(candidates, key=rank)[0]
    print("%s\t%s" % (udid, name))


def create():
    data = simctl_json("devicetypes", "runtimes")

    def runtime_version(r):
        return tuple(int(x) for x in re.findall(r"\d+", r.get("version", "0")))

    runtimes = [r for r in data.get("runtimes", [])
                if r.get("isAvailable")
                and ("iOS" in r.get("name", "") or r.get("platform") == "iOS")]
    runtimes.sort(key=runtime_version, reverse=True)

    types = [t for t in data.get("devicetypes", []) if "iPhone" in t.get("name", "")]
    types.sort(key=lambda t: model_rank(t["name"]))

    for runtime in runtimes:
        for t in types[:6]:
            print("\t".join([t["identifier"], t["name"],
                             runtime["identifier"], runtime["name"]]))


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "existing"
    if mode == "create":
        create()
    else:
        existing()
