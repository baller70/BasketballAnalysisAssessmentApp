# Screen ledger — one screen at a time, finished, then the next

**Kevin's rule, overriding everything:** do not move on from a screen until it is
100% done. No partial work spread across screens. No coming back later.

> **Rebuilt 2026-08-05 05:20 UTC after a container rollback wiped the scratchpad.**
> The canonical design sets survived; this ledger, the briefs and the capture
> directories did not. Everything below was recovered from the commit messages on
> `main`, which is why the reasoning is written into them. Treat that as the
> lesson: **the scratchpad is not durable — git is.**

## Definition of DONE

1. Every canonical band present, in canonical order, at canonical position.
2. Type: cap height, advance width and ink density measured per ink run.
3. Colour: every role from **eroded stroke cores**, never band medians.
4. Geometry: cards, gutters, rules, bar strokes, icon sizes measured.
5. Imagery: right asset, right crop, right drawn size.
6. No overflow, truncation, overprinting, or one-word-per-line columns.
7. Reachable by a real user path AND deterministically by the harness.
8. Invariants: iOS 393pt wide; desktop 900x1440 with exactly one sidebar.
9. **An independent grader scores it A or A+.** Not "improved".
10. Committed and pushed.

## Order

iOS 001 -> 072, then desktop 077 -> 096.

## Status

| # | screen | state | grade | notes |
|---|---|---|---|---|
| 001 | splash | **DONE** | **A+** | second independent grader; A- refuted, all 3 defects closed |
| 002 | welcome | **DONE** | **A** | fresh grader refuted the A-; 6 defects closed; crossbar residual proven unreachable |
| 003 | sign-in | IN PROGRESS | — | builder work checkpointed at ed032eb (page.tsx, Marks003.tsx, phone-003.ts) |
| 004+ | … | not started | — | |

## Method rules — thirteen, each learned by getting something wrong

1. **Measure in the shipping rasteriser.** `capture-ios.mjs` launches with
   `--font-render-hinting=none`. A bare `chromium.launch()` hints stems to whole
   pixels and shifts advances — that alone produced a false +5px advance defect
   on 001, and explained an entire grader-vs-builder disagreement.
2. **Weight on the GREEN channel.** Chromium applies LCD subpixel AA to some runs
   at some sizes (fringes ~12px and ~21px CSS, neutral at 30px+); canonical is
   greyscale. On luminance such a run reads +7 to +13% heavy — a false defect.
3. **Ink on ORANGE runs on the BLUE channel.** Canonical's orange has B = 0.7-3
   and its black B = 0, so on blue both read as full ink and the measurement is
   colour-independent. On 002 a label read -5.1% on green and was called an
   outlier; on blue all four labels sat at -1.4 to -2.5% and it never was one.
4. **Area-ratio ladder for weight**, not raw density: area at coverage
   .25/.4/.5/.6/.75/.9. Below 1.0 at EVERY level = genuinely light; straddling
   1.0 = matched with a halo difference.
5. **Row-segment then column-segment. Never a fixed crop box or y-window.** A
   solid block adjacent to a run welds them into one row-run — 001's mark plate
   (y535-681) did this twice and produced two false findings of mine.
6. **Match thresholds.** Canonical carries a soft halo a crisper render does not;
   sweep rather than picking one.
7. **Cap height on a stem-only glyph (the I) at 50% coverage** — colour-independent.
8. **Canonical PNGs are unsharp-masked.** A small-type stem reads
   `248 / 255 / [74 85] / 255 / 248`, ringing BOTH sides. Below ~30px an eroded
   stroke core is UNOBTAINABLE — a colour defect reported from one cannot be
   real. Solve small-type colour from total ink at matched geometry, hue fixed by
   an R:G:B ratio over a large sample.
9. **Ladder tops read 0 on grey runs** — canonical has 10-14px above 0.8 coverage
   no flat-colour render can produce. Unsharp-mask overshoot, not ink.
10. **Font weight can silently resolve DOWN.** Boxed registers 400/600/800, so
    `font-medium` (500) rendered as 400 on 001.
11. **Chromium pixel-snaps background boxes to whole CSS pixels.** A rule authored
    at 828.5 device px with a 1.88px height painted at 829.11 / 2.170. Draw
    hairlines as `<rect>` in an SVG whose viewBox is 1 unit = 1 canonical device px.
12. **Text raster positions quantise** to whole device rows, so a cap-top has a
    plateau of reachable values. Probe the plateau and centre inside it.
13. **Prove a residual unreachable with algebra plus the measured alternative.**
    On 002 the display crossbar could not be matched: with font-size f, scaleX s
    and stroke t, the shape parameter r = t/f had to satisfy stem/width ~ 4.95 AND
    crossbar/cap ~ 0.64 — a 3.05x disagreement, invariant under scaleX and scaleY.
    The alternative cut was measured and shown worse. That is what "unreachable"
    must look like, not "I tried and it did not work".

Also: **check the ASSET, not just the CSS** (002 drew an entirely different
photograph at the right size and position), and **a large desktop-guard diff is
often live data** — 1,495 of 1,508 differing pixels on one run were 079's date
string rolling over at midnight.

## Standing rulings

- Never edit the four measurement-tuned type roles in `globals.css`.
- Scope a colour disagreement to the screen; never change a global token — those
  roles carry the 20 desktop screens graded B+.
- Never delete a region or pad dead space to improve a score.
- Never build into a dist dir while a server serves from it.
- State physically unreachable residuals with their numbers rather than forcing
  them and breaking another metric.
- Do not commit a tree that fails `tsc` or a screen that breaks its size invariant.

## Infrastructure notes

- **PR #53 is MERGED** (`daa0d1a`). Follow-up work restarts the branch from
  `origin/main`, which is what recovered from the rollback.
- CI needs Node 22 (package.json declares `engines: >=22`), runs the Capacitor
  sync before tests with `NODE_ENV=production`, and mocks `prisma.shotEvent`.
- **The Pages deploy is blocked on a repo setting only Kevin can change:**
  Settings -> Pages -> Source = "GitHub Actions". The build compiles fine and
  fails at `configure-pages` with "Resource not accessible by integration".
- Capture harnesses (`capture-ios.mjs`, `capture-web.mjs`) and the grade
  directories were lost in the rollback and must be rebuilt before the next
  grading pass.
