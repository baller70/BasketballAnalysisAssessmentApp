#!/usr/bin/env python3
"""Extract canonical sidecars from the 92 embedded PNGs, verify design-token
consistency across the batch, and emit the authority report + screen inventory."""
import json, os, glob, hashlib, sys
from collections import Counter, defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audit import read_png, EXPECT

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.join(HERE, 'pkg')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

screens, token_sets = [], defaultdict(Counter)
type_counter, region_counter = Counter(), Counter()

for plat in ('ios', 'desktop'):
    d = os.path.join(OUT, 'sidecars', plat)
    os.makedirs(d, exist_ok=True)
    for png in sorted(glob.glob(os.path.join(PKG, plat, 'embedded', '*.embedded.png'))):
        base = os.path.basename(png).replace('.embedded.png', '')
        p = read_png(png)
        sc = json.loads(p['sidecar_raw'])
        # write canonical extracted sidecar
        with open(os.path.join(d, base + '.sidecar.json'), 'w') as f:
            json.dump(sc, f, indent=1, sort_keys=True)
        app = sc['app']
        els = sc.get('elements', [])
        for e in els:
            type_counter[e.get('type', '?')] += 1
        for r in sc.get('regions', []):
            region_counter[r.get('id', r.get('name', '?'))] += 1
        # token consistency
        dt = sc.get('designTokens', {})
        for group in ('colors', 'spacing', 'radii'):
            for k, v in (dt.get(group) or {}).items():
                token_sets[group][f"{k}={v}"] += 1
        for k, v in (dt.get('typography') or {}).items():
            token_sets['typography'][f"{k}={json.dumps(v, sort_keys=True)}"] += 1

        screens.append({
            'screen': base,
            'platform': plat,
            'screenId': app.get('screenId'),
            'shareGroup': app.get('shareGroup'),
            'png': f"output/{plat}/embedded/{base}.embedded.png",
            'sidecar': f"docs/shotiq/sidecars/{plat}/{base}.sidecar.json",
            'canvas': f"{p['w']}x{p['h']}",
            'elements': len(els),
            'regions': len(sc.get('regions', [])),
            'repeatGroups': len(sc.get('repeatGroups', [])),
            'baselineGroups': len(sc.get('baselineGroups', [])),
            'pinnedRegions': len(sc.get('pinnedRegions', [])),
            'assets': len(sc.get('assets', [])),
            'idatSha256': p['idat_sha256'],
            'contractSha256': sc.get('canonicalContractSha256'),
            'sidecarBytes': len(p['sidecar_raw']),
        })

# ---- design token consolidation (must be identical across all 92) ----
consistent, drift = {}, {}
for group, c in token_sets.items():
    for entry, n in c.items():
        k = entry.split('=', 1)[0]
        consistent.setdefault(group, {})
        if n == 92:
            consistent[group][k] = entry.split('=', 1)[1]
        else:
            drift.setdefault(group, {}).setdefault(k, []).append((entry.split('=',1)[1], n))

json.dump(screens, open(os.path.join(OUT, 'screen-inventory.json'), 'w'), indent=1)
json.dump({'consistent': consistent, 'drift': drift},
          open(os.path.join(OUT, 'design-tokens.json'), 'w'), indent=1)

print("=" * 78)
print("SIDECAR EXTRACTION + TOKEN CONSOLIDATION")
print("=" * 78)
print(f"sidecars extracted : {len(screens)}")
print(f"  ios              : {sum(1 for s in screens if s['platform']=='ios')}")
print(f"  desktop          : {sum(1 for s in screens if s['platform']=='desktop')}")
print(f"total elements     : {sum(s['elements'] for s in screens)}")
print(f"total regions      : {sum(s['regions'] for s in screens)}")
print(f"total repeatGroups : {sum(s['repeatGroups'] for s in screens)}")
print(f"total assets refs  : {sum(s['assets'] for s in screens)}")
print(f"unique contractSha : {len(set(s['contractSha256'] for s in screens))}")
print()
print("DESIGN TOKENS IDENTICAL ACROSS ALL 92 SCREENS:")
for g in ('colors', 'spacing', 'radii'):
    print(f"  {g}: {len(consistent.get(g, {}))} tokens")
    for k, v in sorted(consistent.get(g, {}).items()):
        print(f"      {k:16s} {v}")
print(f"  typography: {len(consistent.get('typography', {}))} roles")
for k in sorted(consistent.get('typography', {})):
    print(f"      {k:16s} {consistent['typography'][k]}")
print()
if drift:
    print("!! TOKEN DRIFT (not identical across batch):")
    for g, kk in drift.items():
        for k, vals in kk.items():
            print(f"   {g}.{k}: {vals[:4]}")
else:
    print("TOKEN DRIFT: none - all design tokens identical across all 92 screens")
print()
print("element types (top 25):")
for t, n in type_counter.most_common(25):
    print(f"  {n:6d}  {t}")
