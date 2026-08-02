#!/usr/bin/env python3
"""Get screenshot attachments out of an .xcresult and give them sane names.

Subcommands (all driven by scripts/simulator-screenshots.sh):

  test-ids <tests.json>        print one test-case identifier per line, for the
                               per-test form of `xcresulttool export attachments`
  legacy <bundle> <outdir>     walk the result bundle with the legacy
                               `xcresulttool get object` API and export every
                               attachment payload, writing a manifest.json
  rename <exportdir> <outdir>  copy the exported payloads to <outdir>, renaming
                               each one to the attachment name the UI test chose
                               (e.g. 018-home-standard.png)
"""
import json
import os
import re
import shutil
import subprocess
import sys


# ------------------------------------------------------------------ test-ids


def test_ids(path):
    with open(path) as fh:
        data = json.load(fh)

    found = []

    def walk(node):
        if isinstance(node, dict):
            if node.get("nodeType") == "Test Case" and node.get("nodeIdentifier"):
                found.append(node["nodeIdentifier"])
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(data)
    for identifier in dict.fromkeys(found):
        print(identifier)


# -------------------------------------------------------------------- legacy


def legacy(bundle, out_dir):
    os.makedirs(out_dir, exist_ok=True)

    def get(object_id=None):
        cmd = ["xcrun", "xcresulttool", "get", "object", "--format", "json", "--path", bundle]
        if object_id:
            cmd += ["--id", object_id]
        for extra in (["--legacy"], []):
            r = subprocess.run(cmd + extra, capture_output=True, text=True)
            if r.returncode == 0 and r.stdout.strip():
                try:
                    return json.loads(r.stdout)
                except Exception:
                    return None
        return None

    manifest = []
    seen_refs = set()
    seen_objects = set()

    def walk(node):
        if isinstance(node, dict):
            if node.get("_type", {}).get("_name") == "ActionTestAttachment":
                ref = (node.get("payloadRef") or {}).get("id", {}).get("_value")
                name = (node.get("name") or {}).get("_value") or "attachment"
                uti = (node.get("uniformTypeIdentifier") or {}).get("_value", "")
                if ref and ref not in seen_refs:
                    seen_refs.add(ref)
                    ext = "png" if ("png" in uti or "image" in uti) else "dat"
                    filename = "%04d.%s" % (len(manifest), ext)
                    subprocess.run(
                        ["xcrun", "xcresulttool", "export", "--type", "file",
                         "--path", bundle, "--id", ref,
                         "--output-path", os.path.join(out_dir, filename)],
                        capture_output=True)
                    manifest.append({"exportedFileName": filename,
                                     "suggestedHumanReadableName": name})
            if node.get("_type", {}).get("_name") == "Reference":
                child_id = (node.get("id") or {}).get("_value")
                if child_id and child_id not in seen_objects:
                    seen_objects.add(child_id)
                    child = get(child_id)
                    if child:
                        walk(child)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    root = get()
    if root:
        walk(root)

    with open(os.path.join(out_dir, "manifest.json"), "w") as fh:
        json.dump(manifest, fh)
    print("legacy walk exported %d attachment(s)" % len(manifest))


# -------------------------------------------------------------------- rename


def safe(name):
    return re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-") or "screenshot"


def rename(export_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)

    manifest_path = None
    for root, _dirs, files in os.walk(export_dir):
        if "manifest.json" in files:
            manifest_path = os.path.join(root, "manifest.json")
            break

    entries = []
    if manifest_path:
        with open(manifest_path) as fh:
            data = json.load(fh)

        def collect(node):
            if isinstance(node, dict):
                if "exportedFileName" in node:
                    entries.append(node)
                for value in node.values():
                    collect(value)
            elif isinstance(node, list):
                for item in node:
                    collect(item)

        collect(data)

    def locate(filename, base):
        candidate = os.path.join(base, filename)
        if os.path.exists(candidate):
            return candidate
        for root, _dirs, files in os.walk(export_dir):
            if filename in files:
                return os.path.join(root, filename)
        return None

    written = 0
    used = set()
    if entries:
        base = os.path.dirname(manifest_path)
        for entry in entries:
            src = locate(entry["exportedFileName"], base)
            if not src:
                continue
            label = entry.get("suggestedHumanReadableName") or entry["exportedFileName"]
            stem, ext = os.path.splitext(label)
            if not ext:
                ext = os.path.splitext(entry["exportedFileName"])[1] or ".png"
            name = safe(stem) + ext
            n = 2
            while name in used:
                name = "%s-%d%s" % (safe(stem), n, ext)
                n += 1
            used.add(name)
            shutil.copyfile(src, os.path.join(out_dir, name))
            written += 1
    else:
        # No manifest: keep whatever names the exporter produced.
        for root, _dirs, files in os.walk(export_dir):
            for f in sorted(files):
                if f.lower().endswith((".png", ".jpg", ".jpeg", ".heic", ".txt")):
                    shutil.copyfile(os.path.join(root, f),
                                    os.path.join(out_dir, safe(f)))
                    written += 1

    print("wrote %d file(s) to %s" % (written, out_dir))


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "test-ids":
        test_ids(sys.argv[2])
    elif command == "legacy":
        legacy(sys.argv[2], sys.argv[3])
    elif command == "rename":
        rename(sys.argv[2], sys.argv[3])
    else:
        print(__doc__, file=sys.stderr)
        raise SystemExit(2)
