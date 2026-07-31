#!/usr/bin/env python3
"""Phase 2 sidecar authority audit: extract HoopTrackLayoutSidecar iTXt from every
canonical embedded PNG, verify canvas parity and structural completeness."""
import struct, zlib, hashlib, json, os, sys, glob
from collections import Counter, defaultdict

EXPECT = {'ios': (853, 1844), 'desktop': (1440, 900)}
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pkg')

def read_png(path):
    d = open(path, 'rb').read()
    if d[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not a PNG (got %r)' % d[:16])
    off, out, idat = 8, {}, hashlib.sha256()
    chunks = []
    while off < len(d):
        ln = struct.unpack('>I', d[off:off+4])[0]
        typ = d[off+4:off+8].decode('latin1')
        data = d[off+8:off+8+ln]
        crc = struct.unpack('>I', d[off+8+ln:off+12+ln])[0]
        if zlib.crc32(d[off+4:off+8+ln]) & 0xffffffff != crc:
            raise ValueError('CRC mismatch in %s chunk' % typ)
        chunks.append(typ)
        if typ == 'IHDR':
            out['w'], out['h'], out['bitdepth'], out['color'] = (
                *struct.unpack('>II', data[:8]), data[8], data[9])
        elif typ == 'IDAT':
            idat.update(data)
        elif typ == 'iTXt':
            kw, rest = data.split(b'\x00', 1)
            if kw == b'HoopTrackLayoutSidecar':
                cf = rest[0]
                body = rest[2:]
                _, body = body.split(b'\x00', 1)   # lang
                _, body = body.split(b'\x00', 1)   # translated keyword
                out['sidecar_raw'] = zlib.decompress(body) if cf == 1 else body
        off += 12 + ln
    out['idat_sha256'] = idat.hexdigest()
    out['file_sha256'] = hashlib.sha256(d).hexdigest()
    out['chunks'] = chunks
    out['bytes'] = len(d)
    return out

def walk(node, path=""):
    """Yield every dict that looks like an element node."""
    if isinstance(node, dict):
        yield path, node
        for k, v in node.items():
            yield from walk(v, f"{path}.{k}" if path else k)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from walk(v, f"{path}[{i}]")

rows, errors = [], []
key_union = Counter()
elem_field_cov = Counter()
total_elems = 0

for plat in ('ios', 'desktop'):
    for png in sorted(glob.glob(os.path.join(ROOT, plat, 'embedded', '*.embedded.png'))):
        name = os.path.basename(png)
        rec = {'platform': plat, 'file': name}
        try:
            p = read_png(png)
        except Exception as e:
            errors.append(f"{plat}/{name}: UNREADABLE {e}")
            continue
        rec['w'], rec['h'] = p['w'], p['h']
        rec['idat'] = p['idat_sha256']
        rec['bytes'] = p['bytes']
        ew, eh = EXPECT[plat]
        if (p['w'], p['h']) != (ew, eh):
            errors.append(f"{plat}/{name}: CANVAS {p['w']}x{p['h']} != {ew}x{eh}")
        if 'sidecar_raw' not in p:
            errors.append(f"{plat}/{name}: NO HoopTrackLayoutSidecar iTXt")
            rec['sidecar'] = False
            rows.append(rec)
            continue
        rec['sidecar'] = True
        rec['sidecar_bytes'] = len(p['sidecar_raw'])
        try:
            sc = json.loads(p['sidecar_raw'])
        except Exception as e:
            errors.append(f"{plat}/{name}: SIDECAR NOT JSON {e}")
            rows.append(rec)
            continue
        rec['schemaVersion'] = sc.get('schemaVersion')
        app = sc.get('app', {})
        rec['screenId'] = app.get('screenId')
        rec['appId'] = app.get('appId')
        rec['batchId'] = app.get('batchId')
        rec['platformId'] = app.get('platformId')
        for k in sc.keys():
            key_union[k] += 1
        # canvas parity between sidecar and PNG
        canvas = sc.get('canvas') or sc.get('rendering', {}).get('canvas') or {}
        cw = canvas.get('width'); ch = canvas.get('height')
        rec['canvas'] = f"{cw}x{ch}" if cw else None
        if cw and (cw, ch) != (p['w'], p['h']):
            errors.append(f"{plat}/{name}: SIDECAR CANVAS {cw}x{ch} != PNG {p['w']}x{p['h']}")
        # element inventory
        els = []
        for _, n in walk(sc):
            if isinstance(n, dict) and ('elementId' in n or 'id' in n) and (
                    'bounds' in n or 'frame' in n or 'rect' in n):
                els.append(n)
        rec['elements'] = len(els)
        global_total = 0
        for e in els:
            total_elems += 1
            for f in ('elementId', 'sourceKey', 'measurementId', 'semanticOwner',
                      'parentId', 'bounds', 'textInkBounds', 'baseline', 'font',
                      'componentType', 'textRole', 'colorToken', 'spacingToken',
                      'radius', 'borderWidth', 'zOrder', 'icon', 'asset'):
                if f in e:
                    elem_field_cov[f] += 1
        rows.append(rec)

print("=" * 78)
print("PHASE 2 - SIDECAR AUTHORITY AUDIT")
print("=" * 78)
print(f"screens audited : {len(rows)}")
print(f"  ios           : {sum(1 for r in rows if r['platform']=='ios')}")
print(f"  desktop       : {sum(1 for r in rows if r['platform']=='desktop')}")
print(f"sidecar present : {sum(1 for r in rows if r.get('sidecar'))}/{len(rows)}")
print(f"total elements  : {total_elems}")
print()
dims = Counter((r['platform'], r.get('w'), r.get('h')) for r in rows)
print("canvas dimensions:")
for k, v in sorted(dims.items()):
    print(f"  {k[0]:8s} {k[1]}x{k[2]}  ->  {v} screens")
print()
print("schemaVersion:", Counter(r.get('schemaVersion') for r in rows))
print("appId        :", Counter(r.get('appId') for r in rows))
print("batchId      :", Counter(r.get('batchId') for r in rows))
print("platformId   :", Counter(r.get('platformId') for r in rows))
print()
print("top-level sidecar keys (count of screens containing):")
for k, v in key_union.most_common():
    print(f"  {v:3d}  {k}")
print()
print("element field coverage (of %d element-like nodes):" % total_elems)
for f, c in elem_field_cov.most_common():
    pct = 100.0 * c / total_elems if total_elems else 0
    print(f"  {c:6d}  {pct:6.2f}%  {f}")
print()
ids = [r.get('screenId') for r in rows if r.get('screenId')]
print(f"unique screenIds: {len(set(ids))} / {len(ids)}")
dupes = [k for k, v in Counter(ids).items() if v > 1]
if dupes:
    print("  DUPLICATES:", dupes)
idats = [r.get('idat') for r in rows if r.get('idat')]
print(f"unique IDAT hashes: {len(set(idats))} / {len(idats)}")
print()
print(f"ERRORS: {len(errors)}")
for e in errors[:40]:
    print("  -", e)

json.dump(rows, open(os.path.join(os.path.dirname(ROOT), 'audit-rows.json'), 'w'), indent=1)
print("\nwrote audit-rows.json")
