#!/usr/bin/env python3
"""Emit repo deliverables from the canonical sidecars: design tokens (CSS/TS/Swift),
screen implementation map, and the sidecar authority report."""
import json, os, glob, shutil, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
REPO = '/home/user/BasketballAnalysisAssessmentApp'
APP = os.path.join(REPO, 'basketball-analysis')

inv = json.load(open(os.path.join(OUT, 'screen-inventory.json')))
tok = json.load(open(os.path.join(OUT, 'design-tokens.json')))['consistent']

# ---------------------------------------------------------------- sidecars
dst = os.path.join(APP, 'docs', 'shotiq', 'sidecars')
if os.path.isdir(dst):
    shutil.rmtree(dst)
shutil.copytree(os.path.join(OUT, 'sidecars'), dst)

# ---------------------------------------------------------------- tokens
colors = tok['colors']; spacing = tok['spacing']; radii = tok['radii']
typo = {k: json.loads(v) for k, v in tok['typography'].items()}

def resolve(role):
    d = dict(typo[role])
    if 'inherits' in d:
        base = dict(typo[d.pop('inherits')])
        base.update(d)
        d = base
    return d

BANNER = ("/* GENERATED from the canonical HoopTrackLayoutSidecar design tokens.\n"
          "   Source: 92 embedded screens, batch shotiq-white-court-imagegen2-2026-07-30-v2.\n"
          "   Verified identical across all 92 screens (zero drift).\n"
          "   Regenerate with tools/shotiq-sidecar/emit.py - do not hand-edit. */\n\n")

css = [BANNER, ":root {\n"]
css.append("  /* colors */\n")
for k, v in sorted(colors.items()):
    css.append(f"  --shotiq-color-{k}: {v};\n")
css.append("\n  /* spacing */\n")
for k, v in sorted(spacing.items(), key=lambda x: int(x[1])):
    css.append(f"  --shotiq-space-{k}: {v}px;\n")
css.append("\n  /* radii */\n")
for k, v in sorted(radii.items(), key=lambda x: int(x[1])):
    css.append(f"  --shotiq-radius-{k}: {v}px;\n")
css.append("\n  /* typography */\n")
for role in sorted(typo):
    r = resolve(role)
    css.append(f"  --shotiq-font-{role}-family: '{r['fontFamily']}';\n")
    css.append(f"  --shotiq-font-{role}-size: {r['fontSize']}px;\n")
    css.append(f"  --shotiq-font-{role}-weight: {r['fontWeight']};\n")
    css.append(f"  --shotiq-font-{role}-line-height: {r['lineHeight']}px;\n")
    css.append(f"  --shotiq-font-{role}-letter-spacing: {r['letterSpacing']}px;\n")
css.append("}\n")
os.makedirs(os.path.join(APP, 'src', 'styles'), exist_ok=True)
open(os.path.join(APP, 'src', 'styles', 'shotiq-tokens.css'), 'w').write(''.join(css))

ts = [BANNER.replace('/*', '/*').replace('*/', '*/'),
      "export const shotiqColors = ", json.dumps(colors, indent=2, sort_keys=True), " as const\n\n",
      "export const shotiqSpacing = ", json.dumps({k: int(v) for k, v in spacing.items()}, indent=2, sort_keys=True), " as const\n\n",
      "export const shotiqRadii = ", json.dumps({k: int(v) for k, v in radii.items()}, indent=2, sort_keys=True), " as const\n\n",
      "export const shotiqTypography = ", json.dumps({k: resolve(k) for k in sorted(typo)}, indent=2, sort_keys=True), " as const\n\n",
      "export type ShotIQColorToken = keyof typeof shotiqColors\n",
      "export type ShotIQTypographyRole = keyof typeof shotiqTypography\n",
      "export const SHOTIQ_CANVAS = { ios: { width: 853, height: 1844 }, desktop: { width: 1440, height: 900 } } as const\n"]
os.makedirs(os.path.join(APP, 'src', 'lib', 'design'), exist_ok=True)
open(os.path.join(APP, 'src', 'lib', 'design', 'shotiqTokens.ts'), 'w').write(''.join(ts))

sw = ["// GENERATED from the canonical HoopTrackLayoutSidecar design tokens.\n",
      "// Source: 92 embedded screens, batch shotiq-white-court-imagegen2-2026-07-30-v2.\n",
      "// Verified identical across all 92 screens (zero drift).\n",
      "// Regenerate with tools/shotiq-sidecar/emit.py - do not hand-edit.\n\n",
      "import SwiftUI\n\npublic enum ShotIQColor {\n"]
for k, v in sorted(colors.items()):
    r, g, b = int(v[1:3], 16), int(v[3:5], 16), int(v[5:7], 16)
    sw.append(f'    /// {v}\n    public static let {k} = Color(red: {r/255:.6f}, green: {g/255:.6f}, blue: {b/255:.6f})\n')
sw.append("}\n\npublic enum ShotIQSpacing {\n")
for k, v in sorted(spacing.items(), key=lambda x: int(x[1])):
    sw.append(f"    public static let {k}: CGFloat = {v}\n")
sw.append("}\n\npublic enum ShotIQRadius {\n")
for k, v in sorted(radii.items(), key=lambda x: int(x[1])):
    sw.append(f"    public static let {k}: CGFloat = {v}\n")
sw.append("}\n\npublic enum ShotIQTypography {\n")
for role in sorted(typo):
    r = resolve(role)
    sw.append(f'    public static let {role} = ShotIQTextStyle(family: "{r["fontFamily"]}", '
              f'size: {r["fontSize"]}, weight: {r["fontWeight"]}, '
              f'lineHeight: {r["lineHeight"]}, letterSpacing: {r["letterSpacing"]})\n')
sw.append("""}

public struct ShotIQTextStyle {
    public let family: String
    public let size: CGFloat
    public let weight: Int
    public let lineHeight: CGFloat
    public let letterSpacing: CGFloat
}

public enum ShotIQCanvas {
    public static let ios = CGSize(width: 853, height: 1844)
    public static let desktop = CGSize(width: 1440, height: 900)
}
""")
swdir = os.path.join(APP, 'ios', 'App', 'App', 'Generated')
os.makedirs(swdir, exist_ok=True)
open(os.path.join(swdir, 'ShotIQTokens.swift'), 'w').write(''.join(sw))

# ------------------------------------------------- screen implementation map
ROUTES = {
 '077-web-sign-in': ('/signin', 'src/app/signin/page.tsx', 'POST /api/auth/[...nextauth]', 'User', 'exists'),
 '078-web-onboarding': ('/onboarding', 'src/app/onboarding/page.tsx', 'POST /api/profile', 'UserProfile', 'exists'),
 '079-web-home-dashboard': ('/dashboard', 'src/app/dashboard/page.tsx', 'GET /api/analysis-history', 'UserAnalysis', 'exists'),
 '080-web-standard-dashboard': ('/dashboard', 'src/app/dashboard/page.tsx', 'GET /api/analysis-history', 'UserAnalysis', 'exists-variant'),
 '081-web-analyze-workspace': ('/analyze', 'src/app/analyze/page.tsx', 'POST /api/vision-analyze', 'UserAnalysis', 'exists'),
 '082-web-live-capture': ('/video-analysis', 'src/app/video-analysis/page.tsx', 'POST /api/capture-sessions', 'CaptureSession', 'exists'),
 '083-web-analysis-overview': ('/results/demo/analysis', 'src/app/results/demo/(tabs)/analysis/page.tsx', 'GET /api/save-analysis', 'UserAnalysis', 'exists'),
 '084-web-biomechanics-workspace': ('/results/demo/analysis', 'src/app/results/demo/(tabs)/analysis/page.tsx', 'POST /api/analyze-drill-frame', 'ShootingBiomechanics', 'exists'),
 '085-web-flaws-history': ('/results/demo/flaws', 'src/app/results/demo/(tabs)/flaws/page.tsx', 'GET /api/analysis-history', 'ShootingWeakness', 'exists'),
 '086-web-player-card': ('/results/demo/player', 'src/app/results/demo/(tabs)/player/page.tsx', 'GET /api/profile', 'UserProfile', 'exists'),
 '087-web-elite-comparison': ('/results/demo/compare', 'src/app/results/demo/(tabs)/compare/page.tsx', 'POST /api/compare-shooters', 'Shooter', 'exists'),
 '088-web-elite-shooters-database': ('/elite-shooters', 'src/app/elite-shooters/page.tsx', 'GET /api/shooters', 'Shooter', 'exists'),
 '089-web-elite-shooter-detail': ('/elite-shooters/[shooterId]', 'MISSING - dynamic route not present', 'GET /api/shooters/[id]', 'Shooter', 'MISSING'),
 '090-web-training-hub': ('/results/demo/training', 'src/app/results/demo/(tabs)/training/page.tsx', 'GET /api/workouts', 'Workout', 'exists'),
 '091-web-drill-execution': ('/training/drills/[drillId]', 'MISSING - drill execution route not present', 'POST /api/drill-feedback', 'DrillVideoSubmission', 'MISSING'),
 '092-web-goals-plan': ('/results/demo/goals', 'src/app/results/demo/(tabs)/goals/page.tsx', 'GET/POST /api/goals', 'Goal', 'exists'),
 '093-web-analytics-history': ('/results/demo/history', 'src/app/results/demo/(tabs)/history/page.tsx', 'GET /api/analysis-history', 'AnalysisHistory', 'exists'),
 '094-web-media-library': ('/media', 'src/app/media/page.tsx', 'GET /api/media', 'MediaUpload', 'exists'),
 '095-web-achievements-points': ('/points', 'src/app/points/page.tsx + src/app/badges/page.tsx', 'GET /api/points, /api/badges', 'PointEvent, EarnedBadge', 'exists'),
 '096-web-profile-settings': ('/profile', 'src/app/profile/page.tsx + src/app/settings/page.tsx', 'GET/PUT /api/settings', 'UserSettings', 'exists'),
}

def ios_view(name):
    stem = name.split('-', 1)[1]
    return ''.join(p.capitalize() for p in stem.split('-')) + 'View'

rows_md, rows_json = [], []
for s in inv:
    n = s['screen']
    if s['platform'] == 'desktop':
        route, comp, api, model, status = ROUTES.get(n, ('?', '?', '?', '?', 'UNMAPPED'))
    else:
        route = 'ios://' + s['screenId']
        comp = f"ios/App/App/Screens/{ios_view(n)}.swift"
        api, model, status = '(shared OpenAPI client)', '(shared)', 'TO-BUILD (native SwiftUI)'
    r = {
        'screenId': s['screenId'], 'screen': n, 'platform': s['platform'],
        'canvas': s['canvas'], 'png': s['png'], 'sidecar': s['sidecar'],
        'route': route, 'component': comp, 'endpoint': api, 'model': model,
        'elements': s['elements'], 'regions': s['regions'],
        'testId': f"screen-{s['screenId'].replace('.', '-')}",
        'status': status,
    }
    rows_json.append(r)
    rows_md.append(
        f"| `{s['screenId']}` | {s['platform']} | {s['canvas']} | {s['elements']} | {s['regions']} | "
        f"`{route}` | `{comp}` | `{api}` | `{model}` | `{r['testId']}` | {status} |")

today = '2026-07-31'
md = [f"""# ShotIQ Screen Implementation Map

Generated {today} from the canonical `HoopTrackLayoutSidecar` payloads embedded in the
92 canonical screens (batch `shotiq-white-court-imagegen2-2026-07-30-v2`).

- **92 logical screens**: 72 iOS @ 853x1844, 20 desktop @ 1440x900
- **12,658 measured elements**, **276 semantic regions**
- Machine-readable equivalent: `docs/shotiq-screen-implementation-map.json`
- Extracted sidecars: `basketball-analysis/docs/shotiq/sidecars/<platform>/<screen>.sidecar.json`

## Status legend

| Status | Meaning |
|---|---|
| `exists` | A repository route/component already backs this screen and is reachable. |
| `exists-variant` | Backed by an existing route rendering a different state of the same view. |
| `MISSING` | No route/component exists yet; must be built. |
| `TO-BUILD (native SwiftUI)` | No native SwiftUI target exists. Requires macOS + Xcode to build and test. |

## Screens

| screenId | platform | canvas | elements | regions | route/view | component | endpoint | model | testId | status |
|---|---|---|---|---|---|---|---|---|---|---|
"""]
md.append('\n'.join(rows_md))
md.append(f"""

## Desktop gap register

Two desktop screens have no backing route and must be built:

1. **`089-web-elite-shooter-detail`** -> `/elite-shooters/[shooterId]`. The
   `/elite-shooters` index exists and `Shooter`/`ShootingBiomechanics`/`ShootingStats`
   models are populated, but no per-shooter detail route is present.
2. **`091-web-drill-execution`** -> `/training/drills/[drillId]`. `DrillVideoSubmission`
   and `POST /api/drill-feedback` exist, but no drill-execution route is present.

The other 18 desktop screens map onto existing routes and need presentation
reconciliation against canonical geometry rather than new backend work.

## iOS

All 72 iOS screens are marked `TO-BUILD`. The repository's `ios/` directory is a
**Capacitor web wrapper**, not a native SwiftUI target. Native SwiftUI work cannot be
compiled or simulator-tested in a Linux container - it requires macOS with Xcode.
""")
open(os.path.join(APP, 'docs', 'shotiq', 'screen-implementation-map.md'), 'w').write(''.join(md))
json.dump(rows_json, open(os.path.join(APP, 'docs', 'shotiq', 'screen-implementation-map.json'), 'w'), indent=1)

print("emitted:")
print("  basketball-analysis/docs/shotiq/sidecars/                     92 sidecars")
print("  docs/shotiq-screen-implementation-map.md  %d rows" % len(rows_json))
print("  docs/shotiq-screen-implementation-map.json")
print("  basketball-analysis/src/styles/shotiq-tokens.css")
print("  basketball-analysis/src/lib/design/shotiqTokens.ts")
print("  basketball-analysis/ios/App/App/Generated/ShotIQTokens.swift")
print()
print("desktop mapped exists : %d" % sum(1 for r in rows_json if r['platform']=='desktop' and r['status'].startswith('exists')))
print("desktop MISSING       : %d" % sum(1 for r in rows_json if r['platform']=='desktop' and r['status']=='MISSING'))
print("ios TO-BUILD          : %d" % sum(1 for r in rows_json if r['platform']=='ios'))
