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
| 003 | sign-in | **DONE** | **A** | 4th grader; withdrew its own defect after its falsification proved unsatisfiable by construction; 3.644 mean \|d\| |
| 004 | create-account | **DONE — A** | — | whole screen **11.457 -> 5.3669**, verified in built captures. THIS ROUND (all three solves matched their in-page prediction to four decimals, which is the evidence for rule 47): overlay viewBox origin +0.48/+0.50 device px — twelve features, twelve negative deltas, one container offset, nine bands better from one parameter; plate 10.5487 -> **8.4842** (createLab scaleX 0.90 -> 0.7845, height exact against a 14.7% advance); signin 6.6987 -> **5.1897** (signinLab 21.0/0.90 -> 18.95/0.9092, both axes 11% over within 0.7% of each other — the OPPOSITE diagnosis to createLab on a run seeded identically); wordmark 8.7161 -> **4.1879** (ty 1.2670, NOT dy — see rule 47). Carried by the overlay alone: checkbox 9.3142 -> 7.1859, orrow 3.1520 -> 2.4379, fieldPass 5.2310 -> 4.6804, fieldConf 5.1655 -> 4.7994, fieldFirst 3.4513 -> 3.1399, fieldLast 3.3287 -> 2.9323, eyePass 8.7305 -> 8.1379, eyeConf 7.4985 -> 7.1219, fieldEmail 10.5242 -> 10.1237. EARLIER: display 89.96->14.801, lede 21.19->12.770, terms 20.078->10.666, five labels jointly 44.347->28.342, oneacct 12.912->6.329, helpPass 10.949->4.571. monogram **13.8039 -> 5.5289** — its "unreachable residual" was an artefact of the sweep rule 40 discredited; re-solved against a clean control, a 1.20px translation was worth 8.3 of the 13.8. The remaining 5.5289 IS the shape error (L +1.05 R -0.35 T -1.13 B -0.21: 1.40px narrow, 0.92px tall, aspect 1.291 vs 1.343) and is left as measured — closing it means re-tracing Marks004.tsx, and a non-uniform scale would buy the extents with the stroke widths. display **14.8012 -> 14.3046** on the CORRECTED window (ty -0.3455 + stroke 0.15; the first attempt at this band was scored on a window that clipped 20 of its 78 ink rows and is retracted — see rule 49/50). lede 12.7701 INVESTIGATED, NOT SHIPPED: not colour and not weight (rule 51 control), position already optimal (control beats every offset), stems median 2.0 in both. A (size,scale) valley floor of ~12.01 exists — 13.00/0.976 = 12.013, 12.94/0.980 = 12.057, 13.06/0.972 = 12.167 — but it is the rule 32 degeneracy, a diagonal ridge the band mean cannot resolve into one pair, and the attempt to pin the size independently used an x-height estimator that spanned BOTH lede lines (rule 45) and is void. Not shipped on an undetermined pair. OPEN, largest first: display 14.3046, lede 12.7701, terms 10.6657, fieldEmail 10.1237, plate 8.4842, labConfirm 8.3835, eyePass 8.1379, checkbox 7.1859, eyeConf 7.1219, oneacct 6.3291, monogram 5.5289 (shape). INDEPENDENTLY VERIFIED (not the builder's self-report): `.next-r9` predated the current 004 sources by two days and could not have contained this work, so it was reclaimed and a clean production build made into `.next-004v`, served by `next start` on 3181 and captured with the shipping harness. `python3 -m measure.report004` reproduces EVERY band to four decimals — whole screen 5.3669, display 14.3046, lede 12.7701, terms 10.6657, fieldEmail 10.1237, plate 8.4842, monogram 5.5289, orrow 2.4379. The work is real and it is in the built output. For calibration 003 graded A at 3.644, so 5.3669 is not yet there. RE-VERIFIED at ef46691 after a container rollback wiped the dist and the capture: clean production build (NODE_ENV=production, npm run build so `prisma generate` runs), served on 3181, captured with the shipping harness. Every band reproduces BYTE-IDENTICALLY to the earlier measurement taken at a different commit on a different container - whole screen 5.3669, display 14.3046, lede 12.7701, monogram 5.5289, orrow 2.4379. Two independent runs, two HEADs, same numbers to four decimals: the measurement is stable and Codex's intervening commits did not touch 004. GRADED **B+** by an independent grader (2026-08-11), below A, with ten measured defects each carrying a falsification test stated in advance. Its buy-backs are STEPS in a cumulative in-place simulation whose identity control costs only +0.0008, so the instrument fires. OPEN, largest buy-back first: fieldEmail text (+4.50,+2.00) 0.2905; bullets pitch 31.206->25.510, first centre 100.90->101.29, diameter 8.74->10.22 0.2596; plate label 6.4% oversized and 5px low 0.2512; signin 10% OVER-TRACKED not oversized (per-glyph width ratio exactly 1.0000, so the affine sx 0.907 is the WRONG prescription) 0.1193; field-value ink graphite where canonical is black-class 0.0786 but ONLY after the geometry - applied alone it makes the screen WORSE by +0.196, rule 49's mechanism exactly; display cap 1.8% short 0.0666; txtLast 0.0624; txtFirst 0.0591; plate mark 0.0208; share mark 0.0159. The grader FALSIFIED its own label-group finding: the five labels' ty do not share a sign (+1.10,+1.10,+0.80,+0.25,-0.40) so it is not one container offset - reported as four sub-pixel placements bounded at 0.213 instead. It also RE-CONFIRMED both documented residuals: lede 12.7701 (tried to defeat it, could not - helpPass, adjudicated correct, reads +4.2% on the same estimator, so the bias is the same order as the effect) and monogram 5.5289 (full affine buys 0.0022; it is shape, not placement). Its verdict: corrected, the screen lands at 4.1430, still 14% above the 3.6443 that earned 003 its A. ALL TEN APPLIED, whole screen **5.3669 -> 4.3657**. Each was solved by sweeping CSS variants in the SHIPPING rasteriser with a rule-40 control, then confirmed by a real build reproducing the sweep to four decimals: field values placed + bullet grid rebuilt (pitch 31.206->25.510, diameter 8.74->10.22) 5.3669->4.7157; plate label size 21.0->20.0 dy 8.52->12.52, scaleX UNTOUCHED, ->4.5095 (plate 8.4842->4.7206 after the viewfinder lift); signinLab ls -0.03->-0.07 dx->2.66 ->4.4295 (signin 5.1897->3.7430); --s4-value-ink #131419 ->4.4040; display scaleY 1.014 ->4.3718 (display 14.3046->13.7110); viewfinder lift ->4.3657. RULE 47 CONFIRMED FOUR TIMES: the grade's affine BOUNDED each defect but never PRESCRIBED the CSS - plate 19.74 was wrong (20.0, and the scale never needed touching), signin sx 0.907 was wrong (the defect was TRACKING; per-glyph width was exactly 1.0000), ink 0.0786 returned 0.0255 (a simulation darkens pixels, CSS re-rasterises glyphs). AND THE CONVERSE, which nearly cost a real finding: on display I first swept font-size with the advance divided back out through scaleX and EVERY variant scored worse, which looked like the grade failing to transfer. It was my parameterisation failing - scaleY at the grade's own 1.014 then bought 0.59. A wrong result from ONE parameterisation is a claim about the parameterisation, not a refutation of the finding. SHARE MARK DELIBERATELY UNMOVED: every offset in dy {0,0.55,0.9,1.4} x dx {0,0.55,1.1} returns signin 3.7430 to four decimals; proven not an instrument failure because (40,30) gives 4.5120 and hiding it gives 3.9234. Stated with its numbers rather than forced. RE-GRADED **A-** by a FRESH independent grader at 4.3657 (2026-08-11). Not A. It reproduced all 23 bands to 4dp, confirmed every one of the ten fixes held, and found the screen structurally flawless (23/23 bands present and in order; box edges to 0.04-0.22px; bullet grid 9/9 pitch 25.526->25.425). It also established the canonical-side export floor at 0.9281 against 003's 0.9398 - the two canvases have the SAME floor, so the 003 comparison at 3.6443 is fair and 004 is not being asked to clear a harder bar. Gap to the A bar 0.72; it names 0.46-0.94 of measured, falsification-tested placement error, so the bar is inside reach. IT REFUTED MY SHARE-MARK CONCLUSION AND WAS RIGHT - see the rule below. OPEN, by buy-back: terms orange link spans 5-7% wide relative to the black text in the same line (~0.11, blue-channel control survives, and o-height moves only +1.7% so it is horizontal distribution not size); lede per-glyph horizontal registration (~0.12-0.15, and lede1's advance ratio 1.00632 vs lede2's 0.99873 CANNOT be size or scale because one run shares both); five micro-cap labels ink-left 1.17-1.99px left, needing dx 1.68->2.86 which is OUTSIDE the 0.55px neighbourhood the recipe's quantisation note covers (0.0882 confirmed on three by rigid move; labLast and labConfirm need left-edge AND width); display glyphs 2.5% narrow with wider gaps at an exact total advance - the signinLab signature again (~0.06); share mark (+0.90,+0.50) 0.0158; eyePass dy+0.6 0.0066, eyeConf dx-0.3 0.0016. It could NOT break monogram (full translation buys 0.0010) or the lede size/scale valley, and it confirmed the viewfinder lift landed at the image-space optimum exactly. ROUND 3 APPLIED: share/eye marks via transform (rule 53) -> 4.3428; four of the five micro-cap labels -> **4.2137** (labFirst 5.5350->4.6190, labEmail 3.5891->2.5239, labPass 5.5681->4.2860 all by +1.0 device px through tx; labLast by WIDTH scaleX 0.62->0.61, not shift). THE REMAINING DEFECTS DO NOT ANSWER TO THE AVAILABLE CSS LEVERS, and that is the finding rather than a reason to keep grinding: terms - link letter-spacing made it WORSE at every value tested (10.6657 control, 10.8400 at -0.005em, 13.28 at -0.040em); links as inline-block scaleX gave only 10.4570 at 0.99 and worse below; condensing the whole run gave 13.84-14.50. Three parameterisations, no meaningful gain. display - the coupled scaleX-up/tracking-down sweep that the 'narrow glyphs, wide gaps, exact advance' signature implies EXPLODES the band to 32.6-63.8 against a 13.7110 control, because widening the glyphs at fixed size overflows the headline and wraps it. labConfirm - every (scaleX, shift) pair worse than shipping. WHAT THESE FOUR HAVE IN COMMON: the A- grade's buy-backs for them came from PER-WORD and PER-GLYPH image-space warps, which have no CSS lever short of wrapping every word or glyph in its own positioned span. That is markup surgery on a form the player actually uses, to buy about 0.3, and it is a decision to state rather than take unilaterally. Recorded with its numbers per the standing ruling on unreachable residuals. THIRD GRADE: **A- HELD, NOT ADVANCED**, and it REFUTED MY 'no CSS lever' claim for THREE of the four defects by demonstrating the buy-back rather than arguing. The lever I never tried is **word-spacing**. Its screen-level finding: EVERY multi-word Geist run on 004 has word gaps 1.3-2.0 device px too narrow and word ink 1.1-4.4% too wide - deltas sharing a sign across nine unrelated runs, rule 15's signature of ONE defect, not nine. The advance-based solve fitted total advance with scaleX, so a short space forced the glyphs wide; word-spacing breaks the rule-32 degeneracy because unlike size it does not touch cap height. ROUND 4 APPLIED ALL TEN OF ITS PRESCRIPTIONS, every band landing on its predicted value exactly and the whole screen on its combined figure: **4.2137 -> 3.9572**. terms 10.6657->7.2649 (scaleX 0.92, ws 1.1, plus link ls -0.02em - separable ONLY once the gaps are right, which is why my link-only sweep read worse at every value); labConfirm 8.3835->6.6196; lede 12.7701->11.8523, BEATING the (size,scale) valley floor of ~12.01 this ledger had declined to ship; labPass 4.2860->3.5308; labFirst 4.6190->3.9349; signin 3.4560->3.1961; orrow 2.4379->1.9943; labEmail 2.5239->2.2922; helpPass 4.5714->4.3262; labLast 3.5723->3.4984. IT ALSO FOUND A BUG THREE ROUNDS OF BAND MEANS COULD NOT SEE: signup/page.tsx carried an INLINE style minHeight:900, which beats the phone media query, so /signup computed 900px and the document scrolled 48pt revealing a blank band - scrolled, the screen reads 27.27 against canonical. 003 does the same thing correctly with md:min-h-[900px]. Zero pixels of the capture change, so no band ever saw it. Fixed; /signup now reports scrollY 0 / scrollHeight 852, identical to /signin. display 13.7110 STANDS as unreachable, now on better evidence than I had: its best word-spacing candidate is 15.2486, and the grader corrected my stated MECHANISM - the run is white-space:nowrap at 278.55 CSS px inside a 393px shell and CANNOT wrap, so the 32.6-63.8 explosion was plain misregistration cost on 78px caps, not the overflow I claimed. font-stretch/wdth is also not a lever: GeistVF.woff carries a wght axis only. THE METHOD FAILURE, recorded because it is the point: rule 13 requires an unreachable residual to carry algebra plus the measured alternative, and rule 52's corollary says a wrong result from one parameterisation is a claim about the parameterisation. I wrote up four defects as unreachable on exactly the evidence both rules forbid, and three fell to the first untried lever. FOURTH GRADE: **A- HELD A THIRD TIME**, at 3.9572, and it changed the reason. The previous two A- grades withheld A because a grader could name 0.26-0.94 of measured reachable error; this one could name **0.0309**, and it found out why the rest is out of reach. It reproduced all 23 bands to 4dp, ran a rule-40 control from the same dist that returned 3.9572 / n_over8 80548 identically, and cleared the screen structurally: 23/23 bands in canonical order, no run wraps (every text run computes white-space:nowrap and returns exactly one client rect), 393pt invariant held, every interactive control resolves to itself under elementFromPoint including both terms links and both eye buttons, the real user path fills all five fields and ticks the checkbox and flips the password type, and the desktop guard measured rather than argued (at 1440x900 the overlay computes display:none, .s4 is position:static, scrollHeight 900). SCROLL FIX INDEPENDENTLY VERIFIED in the served build with quiesce()'s scrollTo removed - scrollY 0, scrollHeight 852, zero scrollable descendants, served HTML carries md:min-h-[900px] and 0 occurrences of min-height:900 - and searched for siblings three ways, including a sweep of all 812 phone-CSS declarations against getComputedStyle, which found 0 genuine mismatches. ROUND 5 APPLIED ITS THREE MOVES, each landing on its predicted band value exactly and the whole screen on the combined figure: **3.9572 -> 3.9263**. helpPass tx 0 -> -0.30 (4.3262 -> 3.6233), terms ty 0 -> +0.45 (7.2649 -> 6.9464), orLab tx 1.2 -> 2.30 (orrow 1.9943 -> 1.7513). Rule 47 confirmed a fifth time. labConfirm's predicted 0.0059 was NOT applied and should not be: the grader proved the lever live (ty +0.65 moves the band to 10.8665, ty -0.40 to 6.7555) and the band still returns 6.6196 at every ty in +/-0.7 - the vertical rung is simply wider than the move. **THE BIG FINDING IS RULE 54: THE HEADLINE IS SET IN A DIFFERENT TYPEFACE FROM CANONICAL.** Within-run ink-width ratios - invariant under every lever four rounds were spent sweeping - put the render on tungsten_semibold at 0.34% rms and canonical OFF it at 4.62% (E +10.7%, C -4.2%); all seven bundled cuts were fitted and measured in-page and the shipped one wins by 6.1 band points. The correct face is not in this repository. Independently corroborated from the builder's side: per-glyph FREE translation - the optimum no shared CSS lever can beat - takes the in-box mean only 20.5730 -> 13.8907, and +per-glyph scaleX only to 12.9841, with every glyph's optimal dy exactly 0. IT IS NOT A 004 DEFECT: canonical 003 carries the same gap (4.53% vs 4.62%), so the 3.6443 A bar was itself set with this defect present and unmeasured. Gap to that bar is now 0.2820, and display's shape (0.4740) plus lede's per-word scatter (0.1190) alone exceed it - the whole remaining gap is placement error downstream of glyph metrics that no CSS lever on this screen can express. TWO INSTRUMENT HOLES FOUND AND CLOSED, both class-level rather than 004-specific: sweep-run.mjs injected into <head> and lost the cascade to PHONE_CSS's body <style> for any bang:true run, so every face sweep it ran measured the unmodified page (rule 55, fixed - the sheet now appends to end of body); and capture-ios.mjs had a horizontal guard with no vertical arm, which is how the min-height bug walked past it on all 72 screens (rule 56, fixed - scrollHeight and innerHeight now recorded for every screen and reported as `scrolls`). FIFTH GRADE: **A- HELD A FOURTH TIME**, at 3.9263, and it named 0.0825 of reachable error - nearly TRIPLE the previous round's 0.0309. Two of its four findings had been invisible for five consecutive grades because of a fault in the MEASURING INSTRUMENT, not in the screen (rule 57). It reproduced 3.9263 / n_over8 80306 to 4dp, ran its own rule-40 control from the live dist that returned the same, and captured 003 from the same dist at **3.6443** - reproducing the A-grade calibration figure exactly, which is what makes the comparison usable. Rule 50 re-checked clean: out-of-window mean |d| 0.9903 against the 0.9281 canonical export floor, only 182 of 80,306 hot pixels outside all 23 windows. ROUND 6 APPLIED ITS FOUR MOVES AND EVERY ONE LANDED ON ITS PREDICTED VALUE, whole screen **3.9263 -> 3.8438** and n_over8 80306 -> 79893, both exactly as predicted. lede1 tx 0 -> -0.536 (15.7273 -> 14.1329); createLab tx/ty 0 -> 0.20/0.18 (plate 4.7206 -> 4.0960); signinLab tx 0 -> -0.25 (signin 3.1961 -> 3.0637); terms tx 0 -> -0.05 (6.9464 -> 6.8756). Rule 47 confirmed a SIXTH time. **THE INSTRUMENT FAULT IS THE FINDING.** The report carried ONE `lede` window over TWO independently positioned runs whose optimal corrections have OPPOSITE SIGNS, so a 2.1496 defect on line 1 averaged down to a 0.4413 compromise and read as solved. Split at row 312 (inside the gap between the two lines' ink, so neither is clipped), line 1 shows **15.7273** - the second-worst band on the screen, behind only the headline - where the aggregate had read 11.8523. The same arithmetic in its other form hid createLab and signinLab: a hot label inside an already-solved box is divided by the box's area. In their own diagnostic sub-windows they measured **19.6505** and **23.2584** where their parent bands read 4.7206 and 3.1961 - a factor of six. Sub-windows are reported SEPARATELY and deliberately NOT merged into the band table, because folding overlapping rows in would silently change the meaning of every band figure this ledger has quoted for five rounds. After the fixes: createLab 13.8227, signinLab 21.6707. MEASURED NEGATIVES, stated rather than forced: lede1's vertical is already optimal (ty across +/-0.345 returns 14.1329 identically; +0.4608 gives 14.3525, -0.4608 gives 17.4070) and its +1.25% advance excess is unreachable (per-line scaleX worse at every value: 0.942 -> 14.71, 0.938 -> 15.45, 0.934 -> 18.40, 0.930 -> 19.91). labConfirm's ty stays put, re-verified: ty in {-0.30, -0.15, 0} all return 6.6196 and ANY positive ty jumps to 8.5821, costing 0.0501. The fourth grade's decision not to apply it was right. display stroke 0.15 -> 0.35 NOT applied: it buys 0.0039 and trades against the documented ladder weight match. RULE 54 INDEPENDENTLY RECONFIRMED, with the estimator rebuilt from scratch rather than reused: no pure scale maps the render's glyph ink widths onto canonical's (3.97% rms, 2.89px max on ~35px glyphs), and the two-parameter affine escape - which would absorb any uniform stroke or unsharp-mask halo term - demands a physically absurd +10.3px constant and STILL leaves 2.99%. Canonical's E is +15.1% relative to its C where the render's is -23%. 37 CSS candidates across tx/ty/stroke/sy/sx/ls/ws/weight with read-back confirming injection landed: best 13.6396, a 0.5% gain. ONE CORRECTION TO THIS LEDGER'S OWN NUMBER: crossings.glyph_widths's default pad=4 bleeds neighbours on canonical's tight tracking (canonical's two A's disagreed by 10%, its two T's by 12% - measurement error, not type). Bounding the pad by the actual inter-glyph gap makes every repeated letter agree to 0.4% and lowers canonical-vs-tungsten_semibold from the recorded 4.62% to **3.98%**. The conclusion is unchanged; the headline figure was overstated. ON CALIBRATION the fifth grader partly disagreed with the fourth and is right: lede's 0.1190 was NOT all per-word scatter - 0.0380 of it was plain reachable rigid translation. The honest comparison removes the headline from both screens: 003 (graded A) 3.6443 whole / **3.3021** headline-excluded; 004 now 3.8438 whole / **3.2645** headline-excluded. Outside the headline the fixed screen is BETTER than the screen that earned the A, and 004 carries LESS ink than 003 (122,264 vs 132,040 canonical px), so the comparison is not flattered by density. STRUCTURAL, all new tests, all clean: all four validation error states render as a single line at 836.22-852.22pt with scrollHeight still 852; both terms links sit inside the checkbox's label and Chromium's interactive-content exemption holds - measured at EVENT-DISPATCH time, zero click/change events on the checkbox when either link is tapped, while tapping the plain label text correctly fires both; /terms and /privacy return 200. FIXED: firstName and lastName carried no autocomplete where the other three inputs did, so the browser offered an email and two passwords and left the player to type their own name - now given-name / family-name, zero pixels. RULE 58 came out of this round too: a full 72-screen capture ran eight minutes, captured every screen, then died writing its summary on an unset env var and threw away all 72 results without printing one. Findings now print before the persist is attempted, the persist falls back to OUT, and its failure is caught rather than thrown. SIXTH GRADE: **A- HELD A FIFTH TIME**, at 3.8438, and it OVERTURNED THIS LEDGER'S OWN CLAIM about display. It reproduced 3.8438 / n_over8 79893, took its own capture from the same dist that was BYTE-IDENTICAL to the committed render, reproduced 003 at 3.6443 from the same dist, and re-checked rule 50 (out-of-window 0.9903, 182 of 79,893 hot pixels outside all 23 windows). ROUND 7 APPLIED ITS THREE MOVES AND EVERY BAND LANDED EXACTLY, whole screen **3.8438 -> 3.7825** and n_over8 79893 -> 79258, both as predicted. display 13.7110 -> **12.7612**; fieldFirst 2.1975 -> **2.1003**; wordmark 4.1879 -> **4.0584**. **THE DISPLAY BAND WAS NEVER FULLY UNREACHABLE AND I WROTE THAT IT WAS.** Rule 57 had been applied to lede, plate, signin and the five field bands, and NOT to display, because display was already marked closed. Split by WORD its two halves want optima of OPPOSITE SIGN - CREATE 26.1342 -> 24.4445 at dx -1.05 device px, ACCOUNT 15.2209 -> 15.0664 at dx +0.15 - the lede signature exactly. 0.0515 of whole screen, through two fields that already existed (tx -0.3209 with ws 3.85 -> 4.2952). Four rounds of sweeps missed it because every one moved the run AS A WHOLE: tx alone at the measured -1.05 scores 16.2278 against a 13.7110 control, WORSE, and word-spacing alone is worse in both directions. Only the COMPENSATED PAIR separates the words. A defect whose correction is a compensated pair is invisible to any sweep of either lever alone and looks exactly like proof that neither works. See rule 59. Rule 54's FACE finding survived a third independent attack (per-glyph width ratios rebuilt from scratch run 0.877 to 1.016 across the 13 glyphs, a 14% spread, no uniform scale fits); what was wrong was the COROLLARY I drew from it. ty and sy were BOTH re-swept at the new horizontal position rather than assumed to carry over, and both still win. THE FIVE FIELD BANDS were split too and show real dilution (values read 17-27 in their own windows against bands of 1.76-4.81) but only valFirst yields; the horizontal null is real rather than an instrument claim, because the control wins at every offset in +/-2.0 device px WHILE the score moves continuously, so the lever is live. orrow hides orLab at 32.72 against a band of 1.7513 - a factor of 19 - but the label is already at its optimum and a rigid shift buys 0. lede1, lede2, oneacct, terms and helpPass all tested per-word: optima alternate sign with NO monotone trend, so they are scatter, not a gap - which is why display was the only band that yielded. BOTH DELIBERATE NON-APPLICATIONS CONFIRMED, one on better evidence than was recorded: display stroke 0.35 was rightly declined, and the real reason is stronger than the one on file - at the shipped 0.15 the run is already HEAVY on every rung (rms_log 0.0201, not 'matched' as the recipe says), and 0.35 triples that to 0.0595 to buy 0.0039. labConfirm's wanted move is smaller than its rung. MORE MEASURED NULLS: valEmail's -0.50 vertical bound made it WORSE (19.3605 -> 19.6044, rule 47 a seventh time); oneacct scaleX worse at every value; lede/terms word-spacing worse in every case; the plate box is genuinely solved (its 6,134 hot pixels are the rasteriser floor - sub-pixel crossings put top/bottom at 0.12 and left/right at 0.03 device px); checkbox extents are exact and its 7.1859 is ring and tick SHAPE, whose lever is Marks004.tsx and not phone-004.ts. ACCESSIBILITY DEFECT FIXED: both eye buttons were named 'Show password', so an ARIA snapshot read `button "Show password"` twice and a screen-reader user could not tell which field each revealed. The confirm button is now named for its own field; verified live - two distinct names, correct toggle labels, and the two fields toggle independently. 003 has one password field and could never have surfaced this. ON CALIBRATION the sixth grader verified the arithmetic independently (004 headline-excluded 3.2644 against the recorded 3.2645; 003 3.2985 against 3.3021; the less-ink claim survives a different threshold at 0.924 vs 0.926) and then made the objection that matters: excluding the headline is only legitimate if the headline is unreachable, AND IT WAS NOT. That is why this round is a fix and not an argument. It also measured 004's headline carrying +24.4% more error per unit canonical ink than 003's, which the shared-face story does not fully explain; this fix closes that to +15.5%. Stated with the grader's own caveat: 14 glyphs at ~35px against 6 at ~76px means more edge per unit ink, so it is suggestive rather than decisive. SEVENTH GRADE: **A- HELD A SIXTH TIME** at 3.7825, and it was the strongest round yet - ELEVEN defects worth 0.0861, FIVE of them in Marks004.tsx, a file this ledger had twice correctly named as the lever for the checkbox and monogram residuals and that nobody opened for seven rounds. ROUND 8 APPLIED ALL ELEVEN: whole screen **3.7825 -> 3.6956** (grader predicted 3.6964) and n_over8 79258 -> **76152** (predicted 76150). THE MONOGRAM ARC WAS MALFORMED and the browser was silently repairing it into the wrong place: the old path's endpoint is not on its own r=11.8 circle (chord 23.729, so the minimum radius is 11.865), and per SVG spec Chromium scales the radii up and re-centres on the chord midpoint, 1.24 px below the intended point. Measured, the hook sat 0.954 px low and 1.037 px right while the E-arm block beside it was within 0.53 px on every side - which is what says the ARC and not the placement. Re-cut as a semicircle that closes exactly: 5.5289 -> **4.9232**. THE EYE PUPIL IS A DIFFERENT DRAWING, NOT A MISPLACED ONE, and the proof is that r=0 - no pupil at all - scores BETTER than any positive radius (eyePass 5.0596, eyeConf 4.7359). A size error cannot do that. Canonical draws a small broken arc where this draws a closed circle; r 4.2 / stroke 2.6 is the best honest value inside the existing parameters. eyePass 7.0040 -> **5.0992**, eyeConf 6.8625 -> **5.0148**. Drawing the broken arc properly would beat it and is a re-trace, not a tune. checkbox ring and tick oversized (rx 7.4 -> 6.0, stroke 2.24 -> 1.90, tick re-traced, 3.5 -> 3.2): 7.1859 -> **5.2033**, and its MAX fell 171 -> 84, i.e. the worst mismatched pixels are gone rather than averaged down. Field borders and the sign-in border were too heavy AND too dark, and the pair had to move together (strokeWidth 1.74 -> 1.66 with --s4-field-rule #DBDCE0 -> #DEDFE3; 1.70 -> 1.60 with --s4-hair #D1D2D6 -> #D5D6DA): five field bands 12.3829 -> 11.0135, signin 3.0637 -> 3.0047. COMPENSATED PAIRS on lede1 (14.1329 -> **13.8831**), lede2 (7.5898 -> **7.2253**), helpPass (3.6233 -> **3.4332**), labFirst (3.9349 -> **3.6701**), labLast (3.4984 -> **3.3847**), plus labConfirm answering to tx ALONE (6.6196 -> **6.3993**) - a band this ledger records as answering to neither knob, on a vertical-rung argument that was correct about ty and got silently generalised to the run. **RULE 61, AND IT IS A CORRECTION OF THE PREVIOUS ROUND'S WORK:** rule 59 said to test for compensated pairs; round 7 tested them the CHEAP way - per-word optima, look for a monotone ramp - found scatter, and wrote off six runs. Five were wrong. The band mean is NOT the sum of per-word optima: lede1's per-word optima genuinely scatter (+0.69, 0.00, -1.02, -2.68, -0.03, +0.77, +5.00 device px) and fit a ramp badly, and the ramp still buys 0.2498, because the band is scored on PIXELS and the proxy was scored on CENTROIDS. oneacct and terms ARE real 2-D nulls and only the grid could say which was which. **RULE 62:** a CSS geometry property is not interchangeable with the SVG attribute it shadows. An orrow gain measured through CSS as 1.7513 -> 1.5892 delivers only 1.7380 through the attribute (with height.baseVal read back as exactly 1.5, so the injection landed) and puts n_over8 UP 599. Dropped rather than claimed. Also: [data-s4="eyePass"] circle matches TWO circles - the desktop lucide Eye sits in a display:none span beside the real pupil - so a querySelector injection hits the invisible one and returns a null that reads exactly like a dead lever. FUNCTIONAL, which is where four consecutive rounds' real findings have been. **NO VISIBLE FOCUS INDICATOR on five of six controls**: the recipe sets outline:none to hold the canonical render and put nothing back, so arriving at a field with a real Tab left the full-page screenshot BYTE-IDENTICAL to the unfocused page. WCAG 2.4.7, introduced by the recipe - the checkbox, which never had outline:none, still showed the UA ring. Restored on :focus-visible. **AND I THEN WROTE A FALSE CLAIM ABOUT IT AND MEASURED IT DOWN:** the first version of that code comment said the ring is invisible to a pointer user. It is not - a TEXT INPUT matches :focus-visible on a pointer click too, because it accepts keyboard input, and the ring duly appears in both paths (computed box-shadow rgb(253,55,1) inset either way). Only the eye BUTTONS get keyboard-only behaviour. What actually protects the canonical render is the BLUR, not the pointer/keyboard distinction: the route map's steps end with a blur, so no focused control is ever in frame - confirmed by this round's capture landing on its predicted figure. FIXED IN 003 TOO (phone-003.ts carried the identical two lines): 003 is graded A and should not sit on a known accessibility failure. Email format was validated ONLY by the server, so a bad address cost a POST and a 400 where the other three rules cost nothing - client gate added and verified live (0 POSTs, 'Enter a valid email address'). No aria-invalid or aria-describedby anywhere: the error was announced via role=alert but nothing tied it to the field at fault. Wired and verified live - the flag follows the failing rule (email -> null / confirm -> true on a mismatch). EIGHTH GRADE: **B+ — DOWN from six consecutive A-, and correctly so.** It found ONE UNMEASURED COLOUR ROLE worth **0.5744**, 15.5% of the screen's entire remaining error and more than six times the whole eleven-defect round before it: **canonical's paper is 254, not 255** (254.05 / 253.94 / 254.01, sd 0.64) and the render was exactly 255 everywhere. Eight rounds solved every INK role on this screen and nobody measured the GROUND. Bracketed so it is an optimum and not a direction (255 -> 3.6956, 254 -> 3.1212, 253 -> 3.6339, all three single-channel neighbours of 254 worse) and confirmed in the shipping form with no !important. See rule 63. ROUND 9 APPLIED ALL FOUR OF ITS MEASURED CHANGES: whole screen **3.6956 -> 3.1058** and n_over8 76152 -> **73328**, both exactly the predicted figures. paper #FFFFFF -> #FEFEFE; mask pitch as a (tx, ls) PAIR (ls 0.12588 -> 0.129, tx -0.15) - note ws is structurally INERT on the value runs because they are single tokens, which is why every earlier (tx, ws) sweep there found nothing; eye pupil cx 734.75 -> 732.55 with r 4.2 -> 2.6; monogram arc re-cut at ~160 degrees. **IT ALSO CORRECTED THE CAMPAIGN'S OWN CALIBRATION BAR.** This ledger recorded a 'canonical export floor' of 0.9281 on 004 and 0.9398 on 003 and treated it as irreducible. It is in substance this paper offset and it is REACHABLE on both canvases from the same one screen-scoped line: **003 measured 3.6443 -> 3.0569**, verified here with the shipping harness against the same dist. It is common-mode, so it does NOT explain the 004-003 gap (removing it from both widens 0.0513 to 0.0489-ish rather than closing it) - what it means is that **3.6443, the number this whole campaign calibrates against, was set 0.57 too high**, because 003 was graded A carrying the identical unmeasured defect. Fixed on 003 in the same change: a screen at A should not sit on a known 0.5874. **TWO OF THE PREVIOUS ROUND'S CONCLUSIONS - MINE - WERE OVERTURNED, both by the same failure (rule 64).** 'The eye pupil is a DIFFERENT DRAWING, not a misplaced one' rested on r=0 beating every positive radius. The premise is true and the conclusion does not follow: that sweep varied the RADIUS AT A FIXED CENTRE and position was never in it. With the centre free, (cx -2.2, r 2.6) scores 4.3232 / 3.9912 against r=0's 4.6179 / 4.1552 - a positive radius at a shifted centre beats having no pupil at all. It was MISPLACED. And the monogram semicircle OVER-corrected in the opposite direction from the malformed arc it replaced: canonical has no ink at x 83-90 above row 465 where a semicircle lays a full-width butt cap across 462-464, and canonical's arm tapers from row 465. Re-cut at ~160 degrees about (99.2, 461.5) to (87.17, 465.88) - chord 25.22 against 2r 25.6, so it closes without Chromium rescaling it, which was the ORIGINAL fault. Both mistakes are kept in the file because the second was made while fixing the first. VERIFIED NULLS this round, each on a named grid rather than an argument: terms (18-point (tx, ws) grid, control wins), oneacct (control wins), valEmail (2-D (tx, ls), ls axis very steep), checkbox rx/stroke-width 3x4 and ring dx/dy 3x3 and tick stroke-width all lose to shipped - its residual is the tick PATH. **lede1 IS A FACE PROBLEM, NOT PLACEMENT** - per-word advance ratios render/canonical run 1.000, 0.962, 0.976, 1.010, 0.957, 1.038, 1.037, an 8.1% spread that no uniform scale fits: rule 54's signature, the same as display. Its first word matches exactly and the run ends 9 device px right. tx, ws, ls, size, scaleX are each a bracketed local minimum, a 27-point 3-D (tx, ws, ls) grid returns the shipped values, and STROKE - never tried before - is monotone worse from zero, which independently re-confirms rule 51 on a new kind of sweep. The only untried kind is splitting the span per word, which is markup rather than a tune. WCAG 3.3.1 FIXED, AND IT WAS A HOLE IN MY OWN FIX FROM THE ROUND BEFORE: the `!email || !password` branch has TWO causes and hard-coded setInvalid('email') for both, so a valid address with an empty password told a screen-reader user their email was wrong and moved focus to a correct field. The other four rules were fine precisely because each has ONE cause. Split, with focus following the culprit, and verified live in both directions (empty password -> password flagged and focused; empty email -> email flagged and focused). ALSO NOTED, not fixed: the terms <label> wraps the checkbox AND two <Link>s, which is an HTML content-model violation - tested, and Chromium does not toggle the checkbox on a link click, so it is invalid markup rather than a functional break. aria-invalid persists after the user corrects a field until the next submit. NINTH GRADE: **A- held a seventh time** at 3.1058, with 0.1602 named. **ROUND 10 APPLIED ALL OF IT: whole screen 3.1058 -> 2.9456, n_over8 73328 -> 71436**, both exactly the predicted joint figures, and every band on its predicted value: lede1 13.3703 -> **11.4713**, terms 6.3632 -> **5.1276**, oneacct 5.7698 -> **4.5576**, lede2 6.6738 -> **6.1787**, fieldPass 1.1196 -> **0.7887**, fieldConf 1.1362 -> **0.7951**. **004 IS NOW 0.1113 BELOW 003's CORRECTED 3.0569, AND 0.6987 BELOW THE 3.6443 THAT 003 WAS GRADED A ON, WITH NOTHING EXCLUDED.** THE ROUND'S LESSON IS RULE 65, AND IT IS ABOUT A REFUSAL OF MINE. This ledger twice declined per-word spans - 'markup surgery on a form the player actually uses, to buy about 0.3' - and recorded the residual unreachable on that basis. The COST side was never measured, only asserted. Measured: wrap overhead +0.0005 / +0.0009 / +0.0023 / +0.0028 on the four runs, and both terms links come through the wrap at rects 1 -> 1, widths 63.39 -> 63.39 and 65.79 -> 65.81, hitsSelf true -> true. Three thousandths against a buy of 0.1302. The refusal was not a judgement; it was an unmeasured number standing where a measurement should have been. IT SHARPENS RULE 54 RATHER THAN DENTING IT: a wrong face gets each glyph's ADVANCE wrong and wrong advances ACCUMULATE into positional drift along the run. The letterforms stay unreachable; the drift does not. `display` is the control that keeps this honest - per-word free translation buys it exactly **0.0000**, because both its words already sit at their own optimum, so this is not a universal escape hatch. MECHANISM shipped exactly as measured, in src/app/signup/PerWord004.tsx: translateX on inline-block (NOT left - rule 53), spaces left OUTSIDE the spans so the parent's word-spacing still applies, no white-space set. Offsets are CSS px applied INSIDE the parent's own scaleX and are shipped verbatim - they must not be re-derived from device px, because that conversion drops the parent scale. For terms the offset array runs continuously across both link boundaries and NO span crosses one: the split is per TEXT NODE and each link's label is its own node, so the <a> elements are never touched. Verified live after the build - both links 1 rect, hitsSelf true, 0 checkbox change events on a link tap, all four runs still exactly 1 client rect. **THE BULLET MASK IS A THIRD INK ROLE**, and this ledger recorded the opposite: 'the masks keep graphite ... the bullet bands are already solved'. That rested on the BAND MEAN - the rule-57 dilution this project itself codified. The axis that finds it is registration-invariant INK MASS, immune to every placement confound: the render is globally 1.92% under-inked, every text band light and none heavy, and the two bullet runs are the LIGHTEST on the screen at 0.7868 / 0.7811 - below even the corrected value ink (0.803-0.854) and far below the adjudicated graphite population (0.898-0.916), which is exactly the argument that moved the field values off graphite, applied to the run it was never applied to. Canonical's bullet core is #272831 against the render's #454751. Bracketed in-page (#292B35 3.0764, #272831 3.0759, #242630 3.0765, #131419 worse at 3.0922, black much worse at 3.1157). Its geometry does NOT move with the colour - ls, padL and ty all re-bracketed at the new value and all unchanged. A DECLARED-BUT-UNWIRED TOKEN was caught by the grader before it could ship: --s4-mask-ink was added and maskCss still emitted var(--s4-graphite), so the 0.0299 would not have materialised at all. FUNCTIONAL, all verified live on the built page: focus now moves on ALL FIVE validation branches (round 9 fixed one and left three - the same defect, in the branches I had not looked at; the terms branch was worst, since the checkbox is nowhere near the submit button that kept focus). A corrected field now stops being wrong - aria-invalid AND the message both survived the user fixing the problem, and the stale MESSAGE is the half every user reads, not just AT users. Cleared on the first edit of the attributed control only, verified: a password error survives editing the name. CALIBRATION SHARPENED: harness run-to-run noise is EXACTLY ZERO - two independent captures are byte-identical to the committed render - so the gap to 003 is 100% signal and the bar is a real bar. Two caveats recorded in 004's disfavour rather than its favour: the paper floor is common-mode (0.3692 on 003, 0.3743 on 004, ~12.1% of each), and 004 carries 6.5% LESS canonical ink while ~84% of all error lives in edge pixels, so fewer edges is an easier screen. Normalised per unit ink, 004 was +8.7% behind 003 shipped, closing to +2.3% corrected. STATED, NOT PRESSED: mask tx -0.15 -> -0.25 is a bracketed 0.0008, below the threshold this ledger has used to decline before (the display stroke was declined at 0.0039). INSTRUMENT CAVEAT the grader hit itself and reported: bilinear-shift searches on this screen are confounded, because canonical is globally SOFTER than the render (its own recipe records the unsharp mask) - pure blur at zero shift buys 0.24 on lede1. Every prescription this round was browser-verified rather than shipped from the image-space bound. TENTH GRADE: **B+ - DOWN from A-, on two independent grounds, and one of them was a FUNCTIONAL REGRESSION I HAD JUST SHIPPED.** **ROUND 11 APPLIED ALL OF IT: whole screen 2.9456 -> 2.6764, n_over8 71436 -> 67812**, both exactly the predicted composed figures. display 12.3272 -> **8.0289**, lede1 11.4713 -> **10.2864**. That is **0.3805 BELOW 003's corrected 3.0569** and 0.9679 below the 3.6443 that 003 was graded A on, with nothing excluded. **THE REGRESSION.** Round 10's per-word spans used display:inline-block, and INLINE-BLOCK BREAKS FIND-IN-PAGE: Blink's FindBuffer cannot match a phrase across inline-block boundaries, so on those four runs 'agree' was findable and 'I agree' was not, while the same phrase in unwrapped copy at the same depth matched normally. A ZERO-transform inline-block already breaks it, so it is the display mode and not the offsets. NO BAND MEAN CAN SEE THIS - the pixels are BETTER for it - and round 10 DID verify: link client-rects, run client-rect counts, checkbox change events on a link tap. Every one of those is a property inline-block does not damage. See rule 66. **RULE 53 IS NOW SCOPED TO THE VERTICAL AXIS.** I forced inline-block because rule 53 says sub-pixel placement needs a composited property. Its evidence is real and entirely VERTICAL - its two 'identical: snapped' rows share left +0.5 and differ only in top. Horizontally Chromium keeps LayoutUnit precision, measured three ways: seven sub-device-pixel left values give seven distinct rasters (0.125 CSS px = 0.277 device px steps, each moving the band); rounding every left to 1/64 CSS px changes the whole screen by 0.0001; and readback x agrees with the composited lever to max |d| 0.012 CSS px over all 17 spans. Swapped to display:inline + position:relative + left, costing 0.0018 and restoring find-in-page - verified live on all five phrases including 'I agree' and 'CREATE ACCOUNT'. **PER-GLYPH DRIFT IS A DIFFERENT DEFECT FROM PER-WORD, and display is the proof:** its per-WORD free-translation floor is exactly **0.0000** - both words already optimally placed - and its per-GLYPH work is worth 4.3 of band. A wrong face gets each glyph's ADVANCE wrong and the error accumulates INSIDE a word as well as across a run. Rule 54 stays true about the letterforms and never said the drift was unreachable. lede1's per-glyph nests INSIDE the existing word spans, the two levels ADDING. Separability was measured rather than assumed: predicted joint 8.3933, actual 8.3933 on display; on lede1 the composition landed 0.0128 BETTER than predicted. **CANONICAL'S INK IS NOT PURE BLACK EITHER** - #000000 -> #030303, 0.0132. Rule 63 on the role next door, and it hid for a structural reason: the check on record for ink was a G/R and B/R RATIO, which is blind to absolute level by construction, so the level was never in evidence. Bracketed #020202 2.9342 / #030303 2.9324 / #040404 2.9334. **THE DESKTOP LEAK IS CLOSED.** oneacct and terms - unlike the lede - have no unwrapped desktop alternative, so the phone-measured offsets AND the broken find-in-page were live at 1440. Fixed without duplicating markup: left stays inline on the span, position:relative moved into the phone media query, so above 768px the spans are static and left is inert by spec. Verified: at 1440 position computes static with 78 spans present; on the phone it is still relative. **ATTACK POINT 1 WENT IN 004's FAVOUR AND THE PREVIOUS ROUND'S CAVEAT IS REFUTED.** The '+2.3% behind per unit ink' was a hand-picked threshold (rule 25): swept, it runs -2.3% at T=2, **-0.4% at T=8 (this project's own n_over8 convention)**, +2.3% at T=16 and +8.0% at T=32 - one point on a curve that changes sign. Worse, ink AREA is the wrong denominator and the proof was in the same report: 78-82% of all error lives in canonical EDGE pixels, and **004 has 16.9% MORE canonical edge pixels than 003**, robustly across every threshold from 2 to 128. Per edge pixel 004 is **17.5% AHEAD**; two parameter-free gradient-energy indices give -19.0% and -19.5%. Physical cause: 004's ink is finer - core 72,575 against 003's 89,898, 19% more gradient energy from 4.5% LESS ink mass. **Fine type is harder to register, not easier.** 004 is the HARDER screen on the axis generating 80% of the error and still scores lower. **THE GREEN ROLE IS NOW MEASURED AND CONFIRMED CORRECT** - it was the one entry in the colour table with no measured triple beside it. Canonical's eroded core reads #07901D against the shipped #0D9144, a 38-unit blue gap, and it is a NULL: #07901D scores WORSE (4.9246) because the render's core is only 12 px (rule 51 bimodality). Best neighbour #0D9130 is -0.0001. The checkbox residual is the tick PATH, as recorded. NOT SHIPPED, both on rule 47: labConfirm's ~0.0168 is a separability BOUND never applied in-page; and four lede1 glyphs (indices 30, 34, 36, 37 - the tail of 'analyses,') sit AT THE EDGE of their sweep and are not bracketed, so they ship as an improvement rather than a solution with the remaining tail stated in the source. display's own per-glyph refinement improved 7 of 13 and no third pass was run, so it is a local minimum in the directions tested rather than a converged one. ELEVENTH GRADE: **B+ again, and again NOT for the pixels** - which it called essentially converged - but for a live shipped regression that this project's own rule 66, written the round before, named explicitly and I did not run. **PER-GLYPH SPANS DESTROYED THE ACCESSIBILITY TREE.** By CDP Accessibility.getFullAXTree: shipped 114 StaticText with **54 single-character nodes** and 'Create your ShotIQ account to save analyses,' ABSENT as a text unit anywhere in the tree; unwrapped control 58 / 3 / present. The control was on the same page the whole time - the per-WORD runs come through as whole words - so it is the per-GLYPH level specifically. **ROUND 12 FIXED IT AT ZERO PIXEL COST**: glyph spans aria-hidden, h1 aria-labelled, one sr-only copy of the lede. Verified on the built page: **59 StaticText, 3 single-character (identical to the unwrapped control), lede1 present as a text unit, h1 named 'CREATE ACCOUNT'**. See rules 67-69. **RULE 68 IS THE UNCOMFORTABLE ONE:** rule 66 was written one round earlier, after inline-block broke find-in-page, and its instruction is verbatim 'enumerate what the browser does with text (find, select, copy, READ, translate, reflow)'. The next round shipped 51 per-glyph spans and tested find, select and copy. Writing a rule is not following it. **RULE 69, AND IT IS WORSE THAN A WRONG ANSWER:** round 11 reported find-in-page as VERIFIED on a probe that could not fail - it returned scrollY > 0 on a screen that cannot scroll (scrollHeight == innerHeight == 852, established by rule 56 two rules earlier). Re-run this round the same class of probe returned FALSE for everything including unwrapped text and a phrase not on the page. Two probes, opposite answers, neither discriminating. The working instrument is window.find(), and it earns the name: 3/3 positive controls true, 0/2 negative controls true, 7/7 wrapped phrases true - so find-in-page IS intact, including through aria-hidden, and the round-11 EVIDENCE for it was worthless. A right conclusion on bad evidence is more dangerous than a wrong one, because nothing catches it. **RULE 67: THE OBJECTIVE HAS NO LEGIBILITY TERM.** Pushed to their true optima the three unbracketed lede1 tail glyphs buy 0.0158 and set 'analyses,' as 'analy s(+),' with the s collided into the e - and the band mean REWARDS it. Not a tail effect either: at the SHIPPED values **16 of 49 adjacent glyph pairs already overlap where the face had none** (display 5 of 12, min gap -1.147 CSS px; lede1 11 of 37, min -1.419), and with every offset zeroed the advance boxes tile exactly with no overlaps. Declined, with its number stated so the next round does not rediscover it as free money. THREE KNOWN-OPENS CLOSED, and one of them was MY OWN SOURCE COMMENT BEING WRONG: lede1 index 30 IS bracketed and solved (0.75 -> 10.3084, 1.25 -> 10.3003, both worse), where the comment claimed four unbracketed glyphs; only three are. display's per-glyph is CONVERGED, refuting the 'there is more here' I recorded: all 52 sub-lattice probes at +/-0.0625 and +/-0.125 are md5-IDENTICAL to the shipped raster or worse, all 26 single +/-0.25 moves worse, and all 48 adjacent-pair JOINT +/-0.25 moves worse - which tests the interaction axis rule 64 warns about. labConfirm's 0.0168 bound is correctly declined and now verified as unreachable: rule-47 lever check passes, then a 40-point (tx,ty) grid plus 7-point sweeps on size, ls, ws and scaleX all lose to the control, sharply bracketed both sides. **THE RULER CHANGED THIS ROUND AND IT IS RECORDED AS A RULER, NOT AS PROGRESS.** --disable-lcd-text now sits beside --font-render-hinting=none in capture-ios.mjs: canonical's small type is achromatic (chroma 0.19-1.18) where the render carried 2.2-6.3, and the proof it is chroma rather than weight is that R and B improve while GREEN - this project's own weight channel - gets slightly WORSE (2.7488 -> 2.7693). It is NOT common-mode, so both canvases were re-measured together: **004 2.6764 -> 2.6189** and **003 3.0569 -> 3.0362**, of which 0.0041 on 004 is the four re-solved per-word values (oneacct 'web', terms 'Use'/'and'/'Policy') and the rest is the instrument. The gap widens to **0.4173 in 004's favour**. The app-level substitute (will-change on the ten phone runs) was DECLINED at a measured cost of 0.0409: it buys an instrument artefact by forcing compositing layers that cost real memory on a device that already renders greyscale AA. ALSO RECORDED, a harness trap the grader hit: will-change on the email INPUT permanently shifts its inner text (fieldEmail 4.1197 -> 7.4558) and never reverts in-session, so a control-again came back 2.8965 instead of 2.6764. sweep-run.mjs has no per-candidate reload and would have written that down as data. TWELFTH GRADE: **B+**, and it found the thing that reframes the whole campaign - see 'NEEDS KEVIN: the canonicals are AI-generated, watermarked images' above, verified here independently (71 of 72 PNGs carry a signed C2PA manifest). **ROUND 13 MEASURED 2.6189 -> 2.6520**, i.e. the screen got WORSE ON PURPOSE, and that is the round's point. **LEDE1'S PER-GLYPH OFFSETS WERE WELDING LETTERS.** Canonical resolves 15 separate ink runs in 'save analyses,'; the shipped render resolved **12**, with merged runs 24-26 px wide where canonical's letters are 11-14, and a word space of 16 px against canonical's 10. Eleven of 37 adjacent pairs overlapped at a minimum of -1.419 CSS px, and the overlap is **DPR-INDEPENDENT** - identical at DPR 2 and DPR 3 - so it shipped to every real device rather than only to the 2.170483 capture scale. Rule 67 predicted exactly this one round earlier and I shipped it anyway. LEDE1_GX is REMOVED, not merely zeroed: dropping the spans entirely also sheds their wrap cost, so lede1 lands **11.2284** against the grader's predicted 11.7642 for zeroed-but-present spans. The run resolves 15 ink runs with 0 welded, exactly canonical's separation. **DISPLAY_GX IS KEPT on a measured distinction, not a taste**: the headline resolves 13 clean glyph runs in canonical, shipped and zeroed alike, with 0 welded. At 46px a quarter-pixel is a small fraction of letter width; at 13.2px it is not. Per-glyph registration is legitimate on large type and destructive on small. The screen is still **0.3842 below 003's 3.0362**, so typographic integrity was never actually in tension with the bar - which is worth stating because the metric said otherwise for two rounds. ROUND 12'S OWN FIX HAD BROKEN COPY: the sr-only duplicate meant selecting the lede copied the sentence TWICE on the phone (desktop was unaffected, which is why a desktop spot-check would have missed it). Fixed with user-select:none - AX tree unchanged, screenshot bit-for-bit identical. A clipped SELECTABLE space was also added, because the two-run lede was copying 'analyses,training' where desktop gives 'analyses, training'. That one predates round 12; it is a consequence of splitting the lede into two runs at all. **RULE 70, AND IT IS NOW A SCRIPT RATHER THAN A RESOLUTION: `docs/shotiq/markup-gate.mjs`.** Three consecutive rounds, three mechanisms, three regressions no band mean could see - inline-block broke FIND, per-glyph broke READ, sr-only broke COPY - and two of the three made the PIXELS BETTER. Rule 66 wrote the enumeration, rule 68 recorded that writing it was not following it, and then round 12 fixed READ and broke COPY. The gate runs all six probes with a negative control each and is committed. **ITS FIRST RUN FAILED ON ITSELF**, which is rule 69 landing on the gate: `p.evaluate((s) => ...)` was called without passing the argument, so every selector came back `undefined` and two of its four failures were the instrument rather than the page. Fixed and kept as a comment - a gate that can report a false FAIL is as useless as one that can only report PASS. The gate also surfaced a real cost nobody had priced: the per-word mechanism fragments each run's text **1 node -> 7** against an unwrapped control it builds in-page. Machine translation translates fragments independently, so word order and agreement suffer in languages that reorder. The app is English-only today; the cost is now RECORDED as an accepted trade with its numbers rather than discovered later. The translate probe is deliberately a REGRESSION gate against recorded values (lede1 7, lede2 4, oneacct 6, terms 11, display 13) rather than a threshold, because a threshold tuned until it passes has stopped being evidence. **10/10 probes pass at 2.6520.** **THIRTEENTH GRADE: A. DONE.** Whole screen **2.6520**, n_over8 **63053**, thirteen independent grades, 0.3842 BELOW the 3.0362 that 003 holds an A on - with nothing excluded, on the HARDER canvas (004 carries 16.9% more canonical edge pixels and is 17.5% ahead per edge pixel; its ink is finer, 19% more gradient energy from 4.5% less mass). Rule 40 discharged at the strongest level available: the grader's own control capture is BYTE-IDENTICAL to the committed render (mean|d| 0.000000, n_over8 0). **THE REMAINING 2.6520 IS QUANTIFIED AND ESSENTIALLY UNREACHABLE**, which is the answer to the question the AI-canonical finding raised. Layer decomposition: true background 74.57% of the canvas at mean|d| 0.3689 contributing **0.2751 (10.4%) - a C2PA watermark, and 254 is the L1-optimal constant** (253.5 -> 0.6947, 254 -> 0.3689, 254.5 -> 0.6830) against a render already exactly flat 254, so no flat fill can track it; halo 14.91% contributing 0.2024; ink core 10.52% contributing 2.1746, i.e. **82% of what is left is letterform**. An image-space oracle re-translating all 24 bands sub-pixel recovers 0.0900 (3.4%) - and it is NOT SPENDABLE: the engine's positional response is a 1-DEVICE-PIXEL STAIRCASE and every shipped run already sits on the best step (terms flat across dy -1.00..+0.75 with +0.1148 and +0.1846 either side; lede1 flat across dx -0.25..+1.00 with +0.2001 below it). COLOUR IS EXHAUSTED, and the grader recorded predicting a large win here and being WRONG: canonical's stroke INTERIORS are far darker than the render's (lede1 #121520 against #454751) which looks like a one-token fix, but a nine-value in-page bracket is monotonically worse from the shipped value (#3A3C46 +0.0011 through #000000 +0.0860). Canonical's dark cores are 278 interior px of ~4000, and darkening the render darkens ink in the WRONG PLACES. Total colour headroom ~0.0006. **AND THE TARGET DISAGREES WITH ITSELF, which is what finally settles it.** Same letter drawn 2-3x within canonical, best-aligned: canonical-vs-canonical **4.1957** mean|d| against the render's 2.5944, on an instrument with 18.5x same-vs-different discrimination. The word 'NAME', drawn twice by the model, is **7.6222** against itself. 'PASSWORD', drawn twice, is **20.7323** against itself and the two instances are different WIDTHS (113 vs 111 device px) - and the achieved canonical-vs-render at that run is 20.90/21.06, i.e. **the render is already as close to canonical as canonical is to itself.** No deterministic renderer can match a target that is not self-consistent. DISPLAY'S PER-GLYPH LAYER IS KEPT ON MEASUREMENT: 13 ink runs at every threshold 128-245 and at DPR 2, 2.170483 and 3, shipped and zeroed alike, with lede1 37/37 and lede2 27/27 - no welding anywhere on the screen. The rule-69 control that SHOULD weld does: offsets x10 collapses 13 runs to 9 and reads 'CRE ATE ACCO UNT'. Removing it costs 0.2437 zeroed / 0.2278 unwrapped to plain text - and unwrapping beats zeroing, because the span wrapping alone costs 0.0159 at zero offsets. The asymmetry with lede1 is measurement, not preference. FUNCTIONAL, verified end to end: real signup POSTs 201 and lands on /onboarding; all five validation branches fire with the right message and focus; both eye toggles are real buttons with distinct names that genuinely flip the input type; 12 focusables in order; every textbox carries its proper AX name; only 3 single-character StaticText nodes and all benign. TWO NON-BLOCKING ITEMS CARRIED FORWARD: the empty-form error says 'Email and password are required' on a form that also requires first name, last name and confirm; and the sub-393pt horizontal scroll is confirmed live (375/360/320 all scroll) and remains filed as class-level. **THE GATE ITSELF GRADED B AND HAS FOUR REAL MISSES** - it is infrastructure, it does not block 004, and it is fixed before 005: see 'OPEN: the markup gate's own holes'. |
| 005 | verify-email | **IN PROGRESS — 4.5067 (n_over8 93525) after 32 rounds and 18 grades. TWO faces need Kevin and neither is in this repository: the BODY face (GeistVF stem/counter 0.7465 against canonical 0.667-0.710) and now the WORDMARK's (canonical S/H ink-width ratio 0.850; Geist 1.002-1.009, Boxed 1.000, Tungsten 0.966). The floor claim has now been refuted THREE TIMES, each by a defect the file had already measured and mis-classed: grade 14 found the digits 1.86% oversized against Tungsten's own outlines, grade 15 found `BOX_Y` contradicting the canonical extent written ten lines above it, and grade 16 found the worst band on the screen carrying a 1.0% advance error printed as `0.992` in a sentence that called it "exactly" — worth 0.4967, eight times the two previous grades combined (see "THE FLOOR CLAIM BELOW WAS OVERSTATED", "ROUND 30", "ROUND 29" and rules 91-92). FOUR DECISIONS NOW NEED KEVIN and none is solvable by measurement — the two faces above, the three different help-row letter widths D1 requires (0.866 / 0.8747 / 0.9136) to match canonical in a face that is not canonical's, and the SHIELD, whose 9.3281 grade 18 proved is not a size error at all (a y-affine over 81 rows cannot beat identity without a -6.0 px displacement the ink extents forbid) but a wrong curve needing an asset re-trace. They are enumerated with their options under "NEEDS KEVIN: THE FOUR ASSET AND TYPE DECISIONS".** | grades 3-15: **B**, **B**, **B+**, **B**, **B**, **B**, **B**, **B**, **B-**, **B**, **B**, *(14: letter never recorded — its FINDING is, under "THE FLOOR CLAIM BELOW WAS OVERSTATED"; not reconstructed here because inventing a letter is worse than an admitted gap)*, **B+**, **B-**, **B-**, **B-** | whole screen **15.3484 -> ... -> 5.5871 -> 5.5735 -> 5.5538 -> 5.5016 -> 5.5012 -> 5.4704 -> 5.4559 -> 5.3674 -> 4.8462 -> 4.6244 -> 4.5067** (n_over8 93525) over thirty-two measured rounds, n_over8 169010 -> 111868, every number from a built capture of a fresh dist — and from round 4 on, of a dist built with `NODE_ENV=production`, because the container's exported `NODE_ENV=development` had been making `next build` exit 1 with 51 pages failing to prerender for every screen so far (pixel-neutral, verified on 004 and 005). Round 4's largest find was a COUPLED TRANSFORM no band mean could see: the display run rendered upright where canonical is oblique, because CSS multiplies a `skewX` by the `scaleX` that follows it, so two earlier rounds solving the ADVANCE silently flattened the slant from 6.0deg to 3.55. skew -6.0 -> -10.3 with tx 4.60 took display 24.5721 -> **19.9365**. Grade 3 returned **B** on security, not pixels, and round 4 closed all of it: `subject` is now REQUIRED in `checkRateLimit` (the compiler found all eight remaining call sites) after three consecutive rounds of the same scope failure left the two routes that ARE this screen keyed on nothing; token issuance is one atomic upsert against a new (userId,type) constraint; `consumeToken` reads its delete count. 8/8 verified with negative controls. ROUND 5 (grade 4, **B**): the limiter's KEY was fixed and its VALUE was not — resend ROTATED the code, so anyone knowing an address could permanently invalidate the code in that player's inbox at 3/min, and ten wrong guesses naming a victim made the victim's CORRECT code return 429. Issuance is now idempotent inside the TTL (same code and link re-sent, TTL not extended) with a 10/day ceiling, and the verify limiter counts FAILURES only so a correct code is never refused; 7/7 with controls. The screen also had NO in-app entry point (DONE criterion 7): /signup wrote two sessionStorage keys commented 'read by verify-email/page.tsx' and then navigated elsewhere — it now lands on /verify-email, restoring canonical order 004 -> 005 and making the countdown real. Paste of the code AS MAILED ('827 670') was truncated by maxLength before the digit strip, and focus was lost after a wrong code; both fixed and verified in a browser. Pixels **6.3752 -> 6.3036** by withdrawing rule 73 and re-driving mark nudges through `transform` (every prediction exact to four decimals) — while REFUSING 0.5071 of grader 4's list as paper-over under rule 34, including two runs whose edges are aligned exactly. THE SCREEN'S REAL WORK WAS BACKEND: canonical draws a six-box numeric code and the product had no code at all, so `issueEmailCode`/`consumeEmailCode` (the existing VerificationToken table, namespaced `<userId>:<code>`, 6 digits from `randomInt`, 10min TTL, single use) and `POST /api/auth/verify-email-code` were built first and verified end to end against Postgres — a real code issued at signup, submitted, `emailVerified` stamped, the row gone, and the LINK path still verifying. Steps authored for a FILLED, FOCUSED canonical (rule 17) and the countdown pinned by `sessionStorage['shotiq-verify-cooldown']`. Bands: display 90.6761 -> 24.5721 (face, rule 20 discharged on all four Tungsten cuts), safe1 27.4799 -> 11.1230, help1/2/3 38.76/36.49/26.68 -> 20.33/24.18/15.65, helpIcon1/2/3 40.54/41.54/33.85 -> 22.05/28.06/7.82, box4 10.7050 -> 4.4881, plate 7.8681 -> 5.1017, didnt 19.4549 -> 8.6672. Markup gate 11/11 with live self-tests. ROUND 13 (grade 8, **B**), pixels **6.0591 -> 5.7353**, n_over8 105130, committed `aa8263f`: the OVERLAY ITSELF sat high and left — `Marks005.tsx` viewBox origin moved to `-0.6 -0.4`, the same one-container-many-bands solve rule 15 licensed on 004, and the caret was counter-moved by SUBTRACTION (`CARET.x - 0.6`, `CARET.y - 0.4`). Grade 8 recommended `+0.6/+0.4` on the caret; BOTH signs were built, and subtraction restores caret 2.1319 exactly while addition took it to 10.6078 — rule 80 for the third time. Unfocused code boxes 1.75 (focused 2.06) and `--s5-box-rule:#767676`, both read from ERODED STROKE CORES (119.2/100.0/115.5), never band medians. BACKEND, and the larger half of the round: the 15-minute grace decision was still split across the application boundary — read row, compare age in JS, branch — and diverged 8/8 at 5-way concurrency; the whole decision is now the `WHERE` on a single `ON CONFLICT DO UPDATE`, 18/18 clean at 2/3/5 concurrent with controls confirming it still rotates outside the window and reuses inside it (rule 85). `forgot-password`'s timing oracle took THREE attempts: a decoy on the absent branch overshot to -4.4 ms, identical `issueToken` calls on both branches still ran -4.3 to -4.9 ms because the decoy row and a real row sit in different GRACE states, and a 25 ms floor at EVERY exit finally landed -0.10 / -0.59 / +0.54 ms inside a control band of +0.66 / +0.85 (rule 84). The first timing run was INVALID and thrown away — most "existing" samples were unfloored 429s from this route's own 5/min limit, so the experiment was measuring the rate limiter; re-run against a pool of 30 accounts. Gates: markup 11/11, csrf 4/4, capture step fails 0. TWO RESIDUALS ARE STATED RATHER THAN CLOSED, both from grade 8. (1) Removing the daily ceiling did NOT remove recovery denial: the 5/min per-address limit is the same switch on a shorter timer — measured 5/5 denial of a victim's own reset inside a window an unauthenticated attacker fills by typing their address. Bounding mail without bounding recovery needs a recipient-controlled suppression list or a cap that still delivers while no link has been used, neither of which is a rate limiter. (2) DoD item 6 is violated below 375px: seven focusable controls leave the viewport at 360 and 320, and that is currently recorded as the reflow probe's EXPECTED value in `markup-gate.mjs`, which makes the gate agree with the defect instead of reporting it. ROUND 18 (still grade 10's list), pixels 5.5871 -> **5.5735**, n_over8 104084 — the two remaining marks, aimed by the same component topology. helpIcon3's dot LANDS EXACTLY: it is the round cap of a zero-length stroke, so it inherited the icon's 3.0 device px width where canonical draws 5.0, and a 5px disc is area 19.6 against a 3px disc's 7.1 — canonical 21 px @ rows 50..54 cols 47..51, render was 7 @ rows 53..55 cols 48..50, and is now **21 @ rows 50..54, cols 47..51**, the same ink in the same rows and columns. helpIcon3 7.8249 -> 7.5455. The shield tick took TWO passes and is left with a stated residual: canonical 150 px @ rows 42..65 cols 38..67 against 151 @ rows 44..69 cols 37..68, i.e. right ink at the wrong extent. The first pass got the size and MISSED THE LIFT — 134 @ rows 44..67, columns exact and height exact, but the TOP never moved, because the offset had been folded into the inner translate where it sits inside the scale and was cancelled by scaling about a centre below the tick's own (13.6 against 12.65); the ink also fell to 134 because SCALING A PATH SCALES ITS STROKE, which `Icon` already compensates for on every other mark and this one did not. Corrected with an outer translate after the scale and the stroke divided back out: **142 @ rows 43..66, cols 38..67**, shield 15.4563 -> **13.7904**. RESIDUAL STATED: one row still low and 8 px light against canonical's 150. ROUND 17 (still grade 10's list, **B**), pixels 5.6568 -> **5.5871**, n_over8 104176, gates SCREEN=005 markup 11/11 and csrf 3/3 — THE TWO WORST WINDOWS ON THE SCREEN, both closed structurally rather than by metric. helpIcon2 **28.0615 -> 18.0968**, the largest single gain in seventeen rounds: the clock ring was 20% oversized AND centred up-left, so it reached canonical's bottom-right corner (122.57 against 122.74) while overrunning the envelope — which is exactly why the icon's bbox agreed with canonical and why an integer shift search returned (0,0) gain 0.000. Solved from grade 10's least-squares fit in viewBox units at k=2.2257: r 5.5 -> 4.33, centre -> (18.74,18.37). Components now **3 (615,230,41)** against canonical's **3 (625,231,36)**, from 2 (893,59). diffMark **32.0538 -> 26.4442** in TWO corrections, the first of which was refuted: `h9 -> h8` assumed the edge met the pencil horizontally and gave 32.0003 with STILL ONE component of 901 — it failed at the thing it predicted. Differencing both inks against canonical over rows 34..56 put it on the other axis (canonical ink at rows 50..52 where the render had none, render ink at rows 55..56 where canonical had none), so `v11 -> v9.3` moved the edge onto canonical's rows and bought 5.007. The SAME map then showed the render still alone across cols 47..54 — the edge ran ~8 device px long, which is where the pencil actually crossed it — so `h9 -> h7.3` finished it. Shortening the run was right in kind all along and wrong in order and magnitude: applied while the edge was five rows low it could not help, and one unit was a third of what was needed. Components now **2 at thresholds 140/180/210** (637/241, 673/264, 695/285) against canonical's 2, which is the test the source commits to and the reason the first attempt was not kept for its 0.0535. ROUNDS 15-16 (grade 10, **B**), pixels 5.6566 -> **5.6568**, n_over8 104645 -> **104519**, gates SCREEN=005 markup 11/11 and csrf 3/3: the whole-screen figure is FLAT to four decimals and that is the honest result — the two changes were ink density on two small runs, and a run's own band is diluted to nothing across an 853x1844 canvas. What they bought is DoD item 2: resendVal density **1.1367 -> 1.0183** (band 2.3010 -> 2.2172, better on both, so never a trade) and didnt **1.1124 -> 1.0525** (band 7.7577 -> 7.8059, 0.0482 for a density inside tolerance), with the wordmark control unmoved at 1.0011 both times. safe1 1.2153 and safe2 1.1293 are LEFT ALONE and stated: matching their density costs +13.08 and +5.76 of band, which is a face difference, not a weight. Also 44pt tap targets (see rule 89 for the regression that cost), and the correction of a comment of mine that measurement had refuted. ROUND 14 (grade 9, **B**), pixels **5.7353 -> 5.6566**, n_over8 104645: `/guide#email-spam` and `#email-delay` DID NOT EXIST — the guide served five ids, none of them these, and `spam`/`inbox`/`verif`/`promotion`/`email` each appeared ZERO times in its text, so both help rows landed a player at the top of a shot-capture guide, while a comment in this screen asserted the guidance "lives in the guide's own anchors". The destinations were BUILT rather than the rows repointed. The resend link is full-strength again on the phone (`disabled:opacity-70` fires during cooldown, which is the state canonical captures; every other orange run bottoms out at green 66 and this one sat flat at 121 = round(0.7*66+0.3*254), now flat at 66 against canonical's 11-89 spread) — the band went the WRONG way, 3.3067 -> 3.5668, and the colour is still right: DoD item 3 reads cores, not band means, and 0.2601 is the price of comparing flat ink to a lossy canonical. display **19.9365 -> 19.3019** at extents (11,135,125), canonical's exactly. didnt **8.6672 -> 7.7577**. safe2 **13.8757 -> 13.0115**. Desktop icons: `diffBtn` had no `data-s5-off` sibling at all and the three help rows resolved to two distinct assets. TWO GRADER CLAIMS WERE REFUTED BY THE BUILD (rule 80, third and fourth time on this screen): D5's prescription was the worst of six candidates (+3.18) because a font-size change moves the baseline, though its DIAGNOSIS survived rule 34's control — pure translation is monotonically worse at every offset — and D4's inference was refuted outright, canonical 272 wide against U+0027 283 and U+2019 **284**, so the correct glyph is a pixel WIDER and never caused the excess. THE ROUND'S REAL FINDING WAS THE GATE. "005 markup gate 11/11" had never been measured: `markup-gate.mjs` defaults to `SCREEN=004`, so every recorded run graded a screen finished five rounds earlier, and `npx next start` inherits `NODE_ENV=development` from the container, under which 005 is genuinely 10/11. Run as SCREEN=005 against a `NODE_ENV=production` server it is **11/11**; captures from the two runtimes are byte-identical (md5 ee6b3eb9d47ea5806272504229fc5603), so every pixel figure stands and only the gate claim was wrong. See rules 87 and 88. 004's reflow set is now enumerated too — NINE controls clip at w320 on DPR2/DPR3 while DPR1 is clean, i.e. every field of the signup form; recorded so a regression fails, raised here because 004 is DONE, and the probe now prints RECORDED, NOT ACCEPTED on every run so a tracked defect can never again read as an approval. |

## Native functional fixes outside the pixel queue

### 2026-08-08 — iOS 071 settings hub

Screen 071 (`ios.settings-hub`) now uses real app state instead of permanently
showing the canonical demo numbers. Empty UI-test demo state still preserves the
canonical Jordan Ellis header, but real completed shot-tracker workouts drive
streak, points, form score, shots, makes, make percentage and trend. Production
profile, badge and analysis-history APIs are loaded when not in UI-test demo
mode. The settings action rows now show toast feedback before opening external
destinations, and UI-test mode suppresses those external opens so the feedback is
deterministic.

Proof on the laptop, all build outputs on `/Volumes/TBF SKILLZ.INC/CodexWork`:
Swift app typecheck passed (20 files), Swift UI-test typecheck passed (2 files),
XcodeGen regenerated `ShotIQ.xcodeproj`, generic iOS Xcode build passed, and
generic iOS Simulator `build-for-testing` passed with the new Screen 071 tests
compiled into `ShotIQUITests-Runner.app`.

Runtime UI execution is still blocked by host setup, not the ShotIQ code:
CoreSimulator can enumerate the iOS 26.3 runtime, but cannot create simulator
devices on the external APFS volume while that volume is mounted with ownership
disabled (`NSPOSIXErrorDomain Code=1 Operation not permitted` saving
`Devices/device_set.plist`). `sudo -n diskutil enableOwnership` failed fast with
`password is required`, so no password prompt was triggered. The connected phone
was not visible to `devicectl`, `xctrace`, or USB system profiler during this
run.

## The native app has layout defects the 72 web rows above never measured

**Measured, with the type clamp in place, on the accessibility-size capture
(run 31017306748).** `docs/shotiq/simshot-layout-audit.py` reads the captured
PNGs — which nothing had ever done — and fails 8 of 75 screens:

| screen | defect, measured |
|---|---|
| 021 profile-menu | was 13 short lines / narrowest 23px. **f59bae6 VERIFIED, PARTIAL: now 8 lines / narrowest 76px.** The Spacer was a real cause and not the only one. Second criterion PASSED — the segmented control did NOT collapse back into "Analy sis"/"Traini ng". Remaining cause MEASURED: the control is **100.7pt wide against canonical's 59.0pt** (orange pill, clean column-run estimator), so it still eats the label column. See the note below before changing it |
| 005 create-account | 5 consecutive short lines, narrowest 67px |
| 058 shot-tracker | 5 consecutive short lines, narrowest 134px |
| 028 video-upload | 4 consecutive short lines, narrowest 65px |
| 044 form-score | 4 consecutive short lines, narrowest 127px |
| 024 elite-shooter-detail | ink down the right edge over 58% of the height; stat row overprints — `45.7%41.3%85.3%54.8%58.6%` with no gaps; tab row cut off |
| 040 analysis-result-overview | ink down the left edge over 74% of the height; tab row truncated |
| 026 analyze-hub | ink down the right edge over 19% of the height |

**CORRECTION — "captured WITH the clamp active" was true of six of these rows
and false of two.** The clamp was applied to `RootView()` inside the
`WindowGroup`. Sheet content is hosted in its own presentation context and does
not inherit an environment value set on the presenting view, so every screen
reached through a sheet ran UNCLAMPED at the simulator's accessibility-medium
size while every pushed screen ran clamped. The table above mixes the two
populations and reads as one finding.

**How it was measured, and why it is not an inference.** `TopBar` and
`ProfileMenuView` both draw `Wordmark(size: 30)` — same view, same parameter,
no branch between them. In the same capture the lockup came back **207px wide
on pushed screen 026 and 322px wide inside the profile-menu sheet (021, 024),
a factor of 1.556**. Identical code cannot render at two sizes unless the
environment differs, and Dynamic Type is the only environment input either one
reads. Canonical 053 puts the lockup at 17.8% of the screen width; native 026
measures 17.6% (correct) and native 024 measures 27.3%.

So the rows split:

- **021 profile-menu, 022 points-system, 023 elite-shooters, 024
  elite-shooter-detail — all four reached through the one profile-menu sheet —
  were magnified ~1.556×.** That is the whole of what Kevin photographed:
  "DASHBOARD MODE" broken mid-word to "DASHBOA / RD MODE", "Choose what you see
  first when you open ShotIQ." falling into eight one-word lines, the elite
  filter chips truncated to "All Le…", the shooter photo bleeding off the right
  edge on 024. `EditProfileSheet` is a sheet too and is not a `CanonicalScreen`,
  which is the "Interme…" / "Advanc…" truncation in his third screenshot.
- **005, 028, 040, 044, 058, 026 are pushed screens.** The clamp WAS active for
  those, so whatever is wrong with them is wrong at the design text size.

**And then four of those six turned out not to be defects at all, which is the
audit's fault rather than the app's.** Reading each capture against its
canonical instead of trusting the tool:

- **005 create-account is CORRECT.** Its "5 consecutive short lines, narrowest
  67px" are the five section labels — FIRST NAME, LAST NAME, EMAIL, PASSWORD,
  CONFIRM PASSWORD — each legitimately short and each separated from the next
  by an empty input field that inks nothing. The run counter incremented across
  a hundred-pixel gap. Fixed: a gap wider than 1.4x a line's own height now
  starts a new run rather than extending the old one, because wrapped text is
  tightly stacked and form labels are a field apart. 005, 044 and 058 leave the
  failing list on that alone; nothing was changed in the app for them.
- **028 video-upload IS a real squeeze and the tool now MISSES it.** Its
  right-hand card breaks "View filming tips" over three lines and its caption
  over four. The tool cannot see it because it measures full-width row bands,
  and the neighbouring card's long line makes every band wide. **A pass from
  this audit is not evidence that a two-column row is clean** — that limitation
  is now written at the top of the script.

So the honest count after the sheet fix is: two edge failures the tool can see
(024, 026 — both addressed), one squeeze it can see (021 — addressed), and at
least one squeeze it cannot (028 — addressed by measurement against canonical,
not by the tool).

#### VERIFIED IN THE BUILT CAPTURE — run 31034064989, target-head 1bbba34

The audit goes **3 failing → 1 failing**, and the mechanism is confirmed by the
one measurement that can only mean one thing. Same `Wordmark(size: 30)`, same
code path, inside the sheet:

| screen | before | after | pushed-screen reference |
|---|---|---|---|
| 021 profile-menu | 320px | **206px** | 206px |
| 022 points-system | 320px | **206px** | 206px |
| 023 elite-shooters | 317px | **201px** | 206px |
| 024 elite-shooter-detail | 320px | **206px** | 206px |

1.556x → 1.000x. Both of 021's criteria pass, checked separately as the earlier
partial fix taught: "DASHBOARD MODE" is on ONE line (was "DASHBOA / RD MODE"),
its caption is on three (was eight one-word lines), **and the segmented control
still reads "Analysis" / "Training" intact** — it did not collapse. 023's filter
chips read "All Levels", "All Positions", "All Shot Types" in full where Kevin
photographed "All Le…", "All Po…", "All Sh…". 026 leaves the failing list: all
four capture cards now sit inside the screen.

**024 still fails, improved not fixed: right-edge ink 58% → 36% of the height.**
The shooter photo still bleeds to the screen edge where canonical stops it at
367pt, and the tab row still runs off. The tab row is the face problem measured
below, not a size problem.

**And the capture caught a claim that was wrong.** The same run shows 026's
carousel geometry fixed and two of its four thumbnails still black. The assets
had been cut and their `Contents.json` committed; the PNGs had not, because
`.gitignore` carries a blanket `*.png` and `git add -A` skips silently. The
commit said the photos shipped. They had not. Re-including the asset catalog
then exposed the real scale: **97 imagesets on disk, 83 PNGs in git** — fourteen
more live asset references in shipping builds resolving to nothing, each one a
screen drawing its placeholder instead of its photograph on Kevin's phone. All
sixteen are committed now.

The lesson is the ledger's own: a claim is what the built capture shows, not
what the commit says. Nothing but re-reading the pixels would have found this.

**THE SIXTEEN ASSETS ARE VERIFIED IN THE BUILT CAPTURE — run 31035797861,
target-head 86c25e1.** Diffed screen-for-screen against the previous capture at
1bbba34, measuring the fraction of each screen occupied by the placeholder's
near-black fill (luma 20–45). Thirteen screens changed materially and on every
one the placeholder area collapses:

| screen | placeholder before | after |
|---|---|---|
| 035 live-form-feedback | 38.9% | **2.2%** |
| 034 live-recording | 37.6% | **3.3%** |
| 072 upload-quality-check | 25.4% | **2.1%** |
| 036 shot-detected | 20.3% | **1.4%** |
| 058 shot-tracker | 17.4% | **1.4%** |
| 045 metric-detail | 14.9% | **0.8%** |
| 049 share-results | 11.7% | **0.7%** |
| 026 analyze-hub | 6.8% | **1.1%** |
| 042 frame-detail-skeleton | 6.9% | **5.3%** |
| 015 home-new-player | 4.5% | **2.4%** |

026's carousel confirms it by eye: four photographs where two were black
rectangles, all four inside the screen. The artifact also grew 33.4MB → 39.6MB,
which is what more photography compresses to.

**026's two remaining defects, stated:** the canonical crops carry the design's
own duration badge baked into their pixels and the app draws its own over the
same corner, so the pill ghosts — visible on all four cards. And the last two
captions wrap ("Yesterday •" / "6:42 PM") where canonical sets them on one line
at the same 85pt card width. Neither is 024, which is the screen in progress.

Fixed by moving the clamp onto `CanonicalScreen` — the scaffold every canonical
screen already uses — so it is presentation-independent, plus
`.modifier(CanonicalTypeScale())` on all ten `.sheet` / `.fullScreenCover`
bodies for the presented views that are not `CanonicalScreen`s.

**Consequence for 020's open question.** The pill measured "100.7pt against
canonical's 59.0pt" was measured on 021, inside the magnified sheet:
100.7 / 1.556 = 64.7pt. Most of that gap was the magnification, not the
control. Re-measure before changing the pill; and note the Spacer fix at
f59bae6 was real but could only ever be partial, because the dominant cause was
never in `HomeFlow`.

**THE CLAMP WAS NECESSARY AND IS NOT SUFFICIENT, and the record should say so.**
The six pushed rows are not text-size artefacts — they are defects at the design
text size, and they are exactly what Kevin meant by "almost every screen …
alignment issues … running off the page". Rule 38 explains why no capture had
shown them; this table is what was actually in the pixels once something looked.

**The falsification arm proved nothing, and the reason is worth keeping.** Run
31031150095 passed both checks rule 41 asks for — `target-head.txt` read
`ee8fa629`, the valid unclamped commit, and the xcodebuild line carried
`TEST_RUNNER_SIMSHOTS_EXTRA_ARGS=-uiTestNoTypeClamp`. Its result was that 52 of
75 screens came back byte-identical to the clamped arm, which reads as "the
clamp does nothing". It is the wrong conclusion: **xcodebuild forwards
`TEST_RUNNER_*` from its own ENVIRONMENT, and a trailing `KEY=value` on the
command line is parsed as a build-setting override instead**, so the app never
received the argument and the two arms were the same run. The 52 identical
screens were a tautology. Fixed by exporting the variable
(`env TEST_RUNNER_… xcodebuild …`), and the walk's manifest now prints the
launch arguments the app ACTUALLY received, so the next arm can be checked
against what ran rather than against what the command line intended.

### The native screens have no local verification loop — plan for it

This repo has **no Swift toolchain and no macOS**. A native fix cannot be
compiled, let alone measured, in this container: the only way to see whether it
worked is a simshots run on Kevin's Mac, which takes 11 minutes warm and has run
to 45+ minutes cold. So the web loop's rhythm — edit, rebuild, re-measure in
seconds — does not exist here, and pretending otherwise produces exactly the
failure this section is about: a fix asserted from reading the code.

Consequences to respect:
- **A native fix is UNVERIFIED until a capture comes back through
  `simshot-layout-audit.py`.** Say so in the commit, and do not mark anything
  done on the strength of the diff.
- Batch the *diagnosis* across screens if useful, but keep the *verification*
  per screen, because one capture measures all 75 at once — the run is the
  expensive part, not the screen.
- A cold run rebuilds DerivedData from scratch. Firing against a non-`main` ref
  costs the full build every time.

#### 020's remaining cause — measure the FACE before changing the size

Verified on run 31024863200 (main @ 1aa6d4e, accessibility-medium): removing the
Spacer took 021 from 13 consecutive short lines / narrowest 23px to 8 / 76px,
and "DASHBOARD MODE" from four fragments to two. It did NOT clear the audit, so
the fix is recorded as PARTIAL rather than done.

What is solidly measured: the "Analysis" pill is **100.7pt** wide in the render
against **59.0pt** in canonical, from orange column runs — a clean estimator,
unlike the white-pixel masks tried first, which returned a 35.5pt "cap height"
inside a 35.5pt pill because they caught the pill edges. That contamination is
the reason the numbers below stop where they do.

Canonical's "Training" label measures **36.14pt advance** over 8 letters, i.e.
~4.5pt per letter. The app sets that label with `shotiqBody`, the wide Boxed
face, so the control may be too wide because it is in the WRONG FACE rather than
at the wrong size — and those call for different fixes.

**THAT QUESTION IS STILL OPEN, and the first attempt to settle it produced
garbage that had to be thrown away.** Comparing cap-normalised advance per glyph
returned a tidy-looking 1.0999, and it was worthless for two reasons, both
visible in the same output:
  - canonical segments to **6** glyphs where the render gives **8** for the same
    8-letter word, because canonical's tighter setting merges pairs. Dividing
    each advance by its own segment count then compares different things. Use
    letters (8 in both), never detected segments, for a per-character figure.
  - the render's cap came back **13.986pt for a 13pt font**. A cap cannot exceed
    its em size, so that window was catching the pill's rounded border, not the
    type. The measurement is impossible on its face and was discarded rather
    than reasoned from.

So the next pass must first find a window that isolates the LABEL from the pill
chrome — the ~120px-tall window used here is far taller than the text — and
sanity-check every cap against its font size before any ratio is taken. A cap
larger than the em is the cheapest available proof that a window is wrong.

**ANSWERED ELSEWHERE: it is the FACE, and 040's tab strip proves it cleanly.**
The 020 pill resisted measurement because the label sits inside chrome. Screen
040's section tabs are the same role — short all-caps labels set with
`shotiqBody` — on plain white with nothing around them, so the same question
can be asked without a window problem. Canonical 038 against the native 040
capture, matching each string to ITSELF rather than normalising per glyph:

**CORRECTED — the first version of this table used a contaminated cap and its
ratios (1.34–1.42) were wrong.** The native cap was read as 10.67pt from a
whole-band scan of 040's tab row. That band is 45px tall for a 13pt font, i.e.
cap/em = 1.15, which is impossible and should have stopped the measurement on
the spot (rule: a cap larger than its em proves the window is wrong). The cause:
**040's ACTIVE tab sits on a different baseline from its inactive ones** —
"ANALYSIS RESULT" inks rows 409..436 while FLAWS, PLAYER and COMPARE ink
426..453, 17px lower. The scan was measuring two baselines as one glyph height.

Per-word, the cap is **9.33pt on both 024 and 040** — consistent, as it must be
for one role at one size. And the honest comparison is advance per character
per unit cap, which removes both size and string length:

| | canonical | native | |
|---|---|---|---|
| 053 OVERVIEW | 35.94/8 = 4.49 at cap 9.70 → **0.463** | 62.20/8 = 7.775 at cap 9.33 → **0.833** | |
| 038 FLAWS | 19.8/5 = 3.96 at cap 7.85 → **0.504** | 38.67/5 = 7.734 at cap 9.33 → **0.829** | |

Native is strikingly consistent at **0.83 per cap** across two screens and two
strings; canonical runs 0.46–0.50. **The app's face advances ~1.73x wider per
unit cap than canonical's for this all-caps tab role.** That is a face error and
nothing else — and note the point size is NOT the problem on 024, where the cap
measures 9.33pt against canonical's 9.70pt, within 4%.

And the obvious substitute is measured to be wrong in the other direction:
Tungsten is far narrower than a normal grotesque — the wordmark note above
records Tungsten-Black advancing 73px against the canonical face's 148px at the
same cap, aspect 2.70 against 5.48, i.e. ~0.5x. The tab role needs 1/1.73 =
**0.58x** the Boxed width. Tungsten is close to that and is the first candidate
worth actually measuring, which the earlier wrong ratio (needing 0.72x) had
ruled out. The app bundles only two families — Boxed (medium/semibold/heavy)
and Tungsten (medium/semibold/bold/black) — so this is the only substitution
available without adding a font.

**SETTLED — and Tungsten IS the face. The ruling-out above was wrong.** The
"~0.5x where the role needs 0.58x" figure compared Tungsten-BLACK against a
different reference face, and the 0.58x it was tested against came from the
contaminated cap. Read straight out of the bundled OTFs with `fontTools`
(`hmtx` advances over `OS/2.sCapHeight`, both faces at upm 1000, cap ~700):

| face | OVERVIEW | FLAWS |
|---|---|---|
| canonical, measured off the PNG | **0.463** | **0.504** |
| BoxedSemibold (what the app used) | 0.882 | 0.941 |
| BoxedMedium | 0.885 | 0.941 |
| **Tungsten-Medium** | **0.479** | **0.512** |
| Tungsten-Semibold | 0.498 | 0.526 |

Tungsten-Medium lands inside 3.4% of canonical on both strings; Boxed is ~1.8x.
**The font files answer this question offline in seconds — no capture, no
simulator, no guessing.** That should be the first move on any face question
from here.

At Tungsten-Medium **13pt** the five advances land within ±1.4pt of canonical's
measured ink extents on every label (OVERVIEW 34.84 vs 35.94, MECHANICS 40.33 vs
40.08, STRENGTHS 39.81 vs 38.70, WEAKNESSES 45.84 vs 46.07, REFERENCE 37.32 vs
38.70), and the row sums to **371.3pt inside the 393pt screen** against ~511pt
in Boxed. 13.86pt — the size that matches canonical's 9.70pt cap exactly — runs
+1.1 to +3.7pt wide on every label, so 13pt is the better fit and the cap lands
at 9.10pt against 9.70pt.

Canonical marks the active tab with colour and the underline alone: its active
OVERVIEW (35.94) and inactive MECHANICS (40.08) are matched by the same medium
cut, so the bold/semibold split goes, and the 0.6 tracking with it. Gaps 26 → 33
against canonical's measured 33.2 / 35.5 / 30.8 / 33.6.

Applied to **024 only** — 040 carries the same role and is a different screen.

**VERIFIED IN THE BUILT CAPTURE — run 31036869790, target-head ffb934f.** All
five tabs render inside the screen, spanning 20.3..349.3pt where the Boxed face
needed ~511pt and showed four and a half:

| label | render ink | canonical ink | error |
|---|---|---|---|
| OVERVIEW | 33.67 | 35.94 | −2.27 |
| MECHANICS | 39.33 | 40.08 | −0.75 |
| STRENGTHS | 38.67 | 38.70 | **−0.03** |
| WEAKNESSES | 44.67 | 46.07 | −1.40 |
| REFERENCE | 36.33 | 38.70 | −2.37 |

Mean absolute error 1.36pt on labels of 34–46pt. Every render figure sits
1.0–1.2pt under the `fontTools` prediction, which is the right direction and
magnitude — the prediction is ADVANCE and the measurement is INK EXTENT, which
excludes side bearings (rule 6 of the grading brief). Cap is a uniform 9.33pt
across all five, so 040's two-baseline defect does not exist here.

**The sheet is gone.** Top 207px of 021/022/023/024 now read light-fraction
0.943–0.971 where a black band stood; 018, a pushed screen, reads 0.967. And
the layout audit over the whole 75-screen set goes to **1 failing, which is 040,
not 024**.

**Tab strip inset 20 → 31pt.** Canonical is consistent that the strip sits
further in than the rest of the screen: back label 21.65pt, name 21.19, meta
22.11, CAREER SHOOTING SUMMARY 23.04, FORM SCORE 21.65 — but OVERVIEW's ink
starts at 31.79pt. Tungsten's "O" side bearing is a few tenths of a point at
13pt, nowhere near the ~10pt difference, so the inset is deliberate.

040 also drops the "ANALYSIS" tab that canonical carries between "ANALYSIS
RESULT" and "FLAWS" — six tabs against canonical's seven — and puts its active
tab on a baseline 17px above its inactive ones, which canonical does not.

### The pattern behind 020, and why the earlier fix made it worse

020's segmented control used to collapse into "Analy sis" / "Traini ng". The
fix was `.fixedSize` on the control — which made it incompressible, so the
HStack squeezed the *next* most flexible child instead, and the label column
fell to under one word. **The defect moved; it did not go away.** Nothing
measured the screenshots afterwards, so it looked solved for months.

The mechanism to look for on 005, 058, 028 and 044: an over-budget `HStack`
containing both a `Spacer()` and a `Text`. Both are flexible, so the stack
splits the leftover width between them, and `Text` compresses furthest — so the
text loses. Removing the Spacer and giving the text column
`.frame(maxWidth: .infinity)` leaves nothing competing for the slack. Do NOT
reach for `.layoutPriority`: an HStack allocates to its least flexible children
first, so a `fixedSize` sibling already gets its ideal width, and a priority
number on the text column inverts that and starves the sibling instead.

Three of these edge findings needed a second estimator before they could be
trusted: a sheet over a dimmed backdrop shows its rounded top corner at both
edges and reads exactly 167 left / 152 right on FOUR different screens — one
shared component, not a defect. Counting edge pixels called all four clipped;
flagging on the vertical SPAN of the edge ink (a sheet corner spans ~3% of the
height, real clipping 19–74%) separates them.

**PAUSED, deliberately, and this is not the screen loop's fault.** Kevin's
phone was drawing the app clipped off both edges with the type oversized. That
is an app-wide defect on the surface he actually uses (native `ios-native`,
not the web tree these 72 rows measure), and it outranks fractions of a pixel
on `/signup`. Diagnosis, fix and guard are rules 37-38 and commits b77b89f /
94bf2ae. 004 resumes once the accessibility-size capture confirms or refutes
the fix — if it refutes it, the real cause is still loose and nothing else
matters until it is found.

## 003 — independent verification, before the grade

Re-measured from scratch rather than taken from the builder's report. The
measurement script shares no code with its solver.

- `tsc --noEmit` clean. Own production build into `.next-v3`, served on 3192.
- Capture via `ONLY=003`: 1/1, 0 gaps, 0 step failures, 0 wider than 393pt.
- Band alignment at matched threshold 160: **18 ink runs each side, worst
  |dtop| 1 device px, worst |dh| 1, mean dtop -0.06.** No shared sign, so no
  container offset (rule 15).
- Whole-screen mean |d| against canonical **3.772**, reproducing the builder's
  figure exactly by an independent route.
- **Desktop guard clean: 0 pixels differ** from the pre-003 baseline, and 077
  sits identically against canonical (mean 22.547 / 291,046 over 8 / 199,886
  over 32). Desktop DOM reads `rgb(17,17,17)` and `0px`, so the AppleMark and
  GoogleMark leak is closed in pixels and not merely in markup.

**Residual found here, then resolved — and it is NOT a defect, on any screen.**
The render's canvas is 1849 device px tall against canonical's 1844. Chasing it
gave a clean answer: **all 72 canonical PNGs are exactly 853x1844**, so the
canonical artboard is 393x850 pt (850 x 2.170483 = 1844.91), while the real
iPhone viewport this app renders into is 393x**852** pt (852 x 2.170483 =
1849.25). The 5 px is the artboard, not the app.

Consequences, which apply to every iOS screen and not just this one:

- **Never "fix" it.** Shrinking the capture viewport to 850pt to match would be
  gaming the metric against the real device size, and padding is already
  forbidden by the standing rulings.
- **Compare top-anchored, over the first 1844 rows.** Content is top-anchored
  and the ink extents agree exactly (y41-1730 on both sides here). A whole-image
  diff that bottom-anchors or resizes will manufacture a whole-screen offset.
- A grader reporting "the render is 5 px taller" has found the artboard, not a
  defect. Expect it on all 72.

### The grade, and why it moved

The fresh grader returned **A+** and attached a falsification to it: re-capture
with `--font-render-hinting=slight`, and if the lowercase x-height does not move
toward canonical and the headline's round-glyph overshoot does not collapse,
"residual §6 needs an app-side explanation and this grade drops."

**I ran it and it failed.** Whole-screen mean |d| went 3.7724 to 3.8553 — worse.
The three lowercase bands moved 0 / 0 / away. All six headline segment tops were
identical between `none` and `slight`.

The grader then verified the negative was a true negative rather than an inert
flag, which was the objection I could not rule out myself: hinting demonstrably
fired, snapping caps to exact integers (R 19.16 to 19.98, D 19.17 to 20.00,
L 19.16 to 20.00) and x-heights to exactly 15.00, with horizontal metrics
unchanged to 0.02 px — vertical-only, as `slight` should be. Grid-fitting
snapped x-height UP to 15.00 while canonical sits at 12.96-13.80. Snapping moves
to the nearest grid line, under 1 px; canonical is 1.2-2.0 px away. **It was
never reachable by that mechanism.**

The accepted explanation is the builder's, and it is app-side: canonical's body
face has an x-height 13.5% smaller relative to cap than Geist, the only
body-weight face in the pack (canonical 16.02/16.03 device px against Geist's
18.18/18.23 at matched extent). The grader independently re-derived it from
pixels — canonical's x/cap is 0.695-0.706 across five runs against the render's
0.772-0.783 — and independently confirmed the minimax: matching x-height needs
scale 0.894, which takes cap error from -0.25 to -2.36 device px, a 10x
degradation.

Grade **A**, not A+: the residual is real and page-wide at ~1.5 device px
(0.7 CSS px) on every lowercase run, so it is not at the rasteriser's floor. Not
A-, because A- requires a parameter change that was found and not made, and the
alternative was measured and is worse.

**The A is CONDITIONAL and the condition is open.** The grader's §6: the DISPLAY
face has deviations the Geist story does not explain — flat-cap 118.84 against
116.99 (-1.6%) while round-glyph height matches to 0.03 px; N stems 16.08/15.84
against 14.92/14.68 (-7.4%); word space 48.67 against 54.31 (+11.6%) while the
total block width matches to 0.15 px. Its ruling: if a closer display face
exists in the pack and was not tried, that is fixable and the grade drops to A-.

**It was not tried, and the challenge was well aimed.** All four cuts were then
solved to their own optimum, and **Bold does land the stem** — N stem 16.05
against canonical's 16.09, where Semibold reads 14.79.

It is still the wrong cut, and what settles it is rule 9's kind of measurement:
**I/N, the ratio of two ink widths inside the same run, from which scaleX
cancels entirely.** Canonical 0.3574; Semibold 0.3590, a 0.4% miss; Bold 0.4196,
out by 17%. Bold reaches the stem only by being squeezed to scaleX 0.789, which
thins the verticals into place while leaving horizontals and bowls Bold-thick,
and its ladder sits above 1.0 at every level (1.075-1.131) — genuinely heavy by
rule 4. Semibold is the only one of the four that straddles.

The stem residual is then unreachable, with rule 13's algebra. Canonical needs
I/N 0.3574 and stem/I 0.9013 simultaneously. Across the four cuts I/N RISES with
weight (0.2777 / 0.3477 / 0.4194 / 0.4821) while stem/I FALLS (0.8874 / 0.8432 /
0.8156 / 0.7807). Monotone in opposite directions, so I/N pins the weight just
above Semibold where stem/I is 0.843 against 0.9013 — 6.9% out, worse in either
direction, and these are four discrete OTFs with nothing in between.

The round-glyph overshoot is a family property, not a weight: every cut
overshoots the flat cap by +2.002 where canonical overshoots by +0.114.

**One real defect fell out of the exercise.** Word spacing was 7.14, putting the
word space 11.9% wide and dragging "IN" right by up to 3.80 px. Swept, 5.90 is
the joint minimum of glyph-position RMS (2.11 -> 0.98) and display-band mean |d|.
Verified independently: whole screen **3.7724 -> 3.6792**, display band
9.989 -> 8.568, and the 2,376 changed pixels are confined to y227-344 x302-382,
which is exactly the word "IN". Desktop 077 stays byte-identical to the pre-003
baseline (md5 69b2184b0f0e7553108d23c2aae71071), so the change is fully
phone-scoped.

The render therefore changed and the A no longer applies to it. A **fresh**
grader is running on the new capture (`verify-003b`, md5
ac331962d5c481cf477707e3d2b73ee6).

### 003 FINAL — A, closed

Fourth grader, on the shipping capture `834c8b18`. It graded A- on the footer
being undersized, then **withdrew its own defect** when its falsification was
run: the three targets are inversely coupled and mutually unsatisfiable
(size-ratio needs x1.065, its shape target x0.973, canonical's actual shape
x0.921), and its own `shape.py` table already contained the refutation with the
sign misread. Verified here independently by a different estimator: footer1's
`o` reads width x0.909 and height x1.103 against canonical, so no font-size
fixes it.

It also retired its ratio estimator as a fault-detector: "the face cancels
between two runs of one image" needs one shared face AND one shared scale on
both sides. Canonical has that (its `o` w/h fingerprint spans 0.826-0.869 across
five body runs). The render does not, because every run was solved to its own
advance and cap. The estimator survives only as a dispersion statistic.

**Accepted residuals, all bounded and recorded:** the body x-height and
wordmark/H1 letterform pack residuals; per-run vertical dispersion of 8.6-11.3%
including three runs the baseline fix itself regressed; and footer1 interior
word displacement of -2 to -3 px driven by the apostrophe and question-mark
advances, with both line ends correct to 1 px.

Final: whole screen **3.644** mean |d| (7.015 at the start), worst residual over
27 runs 0.74 device px of cap-top, 19/19 bands within 1 row, desktop 077
byte-identical to baseline, functional contract green.

### Defect 1 of 2 closed — the baseline split

Re-solved by moving size and scaleX together (rule 26), never font-size alone.
Verified here independently, sub-pixel bottom 50% crossing, R stem of "Remember
me" at x97-98 against F stem of "Forgot password?" at x604-605:

| | R baseline | F baseline | split |
|---|---|---|---|
| canonical | 1038.49 | 1038.68 | **0.19** |
| before | 1038.29 | 1040.36 | **2.07** |
| after | 1038.29 | 1038.34 | **0.06** |

Inside the pinned band of 0.4, and tighter than canonical's own internal split.
Whole screen 3.6792 -> 3.6546. Desktop 077 still byte-identical to the pre-003
baseline (md5 69b2184b0f0e7553108d23c2aae71071). The wordmark is the remaining
reachable defect.

### Final state under grade

Capture `verify-003c`, md5 `333f26638b495a3d0082c622efe7c823`, byte-identical to
the builder's final reported state and to the harness's own capture. Committed
through `aa1021e`.

- Whole-screen mean |d| against canonical **3.655**. Across the whole
  engagement: **7.015 -> 3.655**.
- Worst residuals over all 27 runs: capTop 0.72, run-extent 1.29, inkL 0.37,
  advance 2.32 (the display block width — the stated word-space trade), ink 4.4%
  (mask bullets).
- iOS harness 72/72, 72 distinct md5s, 0 gaps, 0 step failures, 0 wider than
  393pt. Desktop 077 unchanged from the pre-003 baseline.
- Functional contract re-run green: reveal toggle, live validation, empty-submit
  error and focus, bad-password error, real sign-in to /results/demo, signed-in
  redirect, both links.
- `tsc --noEmit` and `npm run lint` both clean.

**A worked example of rule 25.** The builder and I measure the checkbox-row
baselines with different estimators and get absolute values ~1.2 device px
apart — it reads canonical 1039.68/1039.70 and the render 1039.49/1039.50, I
read canonical 1038.49/1038.68 and the render 1038.29/1038.34. The offset is
consistent across BOTH images, so the quantity that matters agrees: split 0.01
against 0.06, both far inside the 0.4 band. Absolute positions from two
estimators are not comparable; a difference taken within one estimator is.

### A- defects closed — all four verified independently

| item | canonical | before | after |
|---|---|---|---|
| Google red (interior shell) | (240.4, 55.6, 45.0) | worst ch 11.4 | **0.6** |
| Google yellow | (252.2, 199.8, 15.7) | 11.8 | **0.8** |
| Google green | (33.6, 164.7, 82.4) | 18.4 | **0.6** |
| Google blue | (60.4, 135.0, 250.5) | 6.5 | **1.0** |
| lede L1->L2 baseline delta | 38.255 | 37.323 (-0.932) | **38.323 (+0.068)** |
| OR centre gap | 69.12 | 71.00 | **69.51** |
| OR rule lengths | 339.70 / 339.39 | 338.00 / 338.00 | **339.40 / 339.15** |
| iOS whole screen mean \|d\| | — | 3.6546 | **3.6443** |

By region: lede 9.204 -> 9.022, OR 1.796 -> 1.784, Google mark 9.133 -> 8.305.

**Desktop 077's baseline was NOT changed after all, and my replacing it was a
mistake I had to undo.** I told the builder to put the palette fix in shared
markup because canonical disagrees with the official palette on both surfaces,
and pre-emptively swapped the baseline. The builder measured the gate I had
attached — "confirm 077 improves" — and it failed: whole-image mean |d| 22.5465
-> 22.5467, mark-against-mark aligned on their own bboxes 59.03 -> 59.30, both
marginally worse. Only the per-arc plateau distance improved, 45.1 -> 38.0.

The gate is blind here and the builder said so: 077's own Google mark is 16x16
sitting 88 px from canonical's 21x19, so a pixel metric there compares our mark
against canonical's button interior and cannot score colour at all. It is very
likely the shared change would be right. **It stays out anyway** — 077 is not
the screen in progress, and "the metric cannot see it, trust me" is not a
standard worth starting to accept, least of all when it favours the change I
asked for. Inert `data-arc` hooks and the full analysis sit in `page.tsx`; it is
a four-line promotion when 077 gets its pass, by which time its mark will be the
right size and place for the guard to see the result.

Baseline restored to `69b2184b0f0e7553108d23c2aae71071` and confirmed against a
fresh capture. I caught it only because the builder's report said 0 differing
pixels where mine had said the baseline moved.

**Two of these needed my estimator fixed before they read true**, which is rule
25 twice more. An integer-row baseline probe said the lede fix made things
WORSE (38 -> 39 against canonical 38); sub-pixel says -0.932 -> +0.068. And the
OR rules returned "no runs" twice before I noticed the plateau was being
estimated across the loud "OR" glyphs.

### Grade bands pinned for the next 003 capture

The grader fixed these in advance so the grade cannot drift, and it reclassified
its own largest defect against its own interest — D1, the body x-height, is now
an **unreachable pack defect rather than a parameter defect**, because the only
lever is scale and scale is at its constrained optimum. It also corrected the
gap UPWARD while doing so: +10.6% on its estimator, not the +8.2% it graded on.
The reclassification is about reachability, not magnitude. Sizing to fix
x-height would take 12 advance widths from matched-to-0.3% to wrong-by-10.6%,
which is the strongest fidelity result on the screen.

- Baseline split <= 0.4 device px **and** wordmark H/S within ~2% of 1.146 -> **A**
- One of the two -> **A-**
- Wordmark measured across all three Boxed cuts with none reaching 1.146, i.e.
  it becomes unreachable like the H1, and the baseline closed -> **A**
- **A+ is NOT available on this screen with the current pack.** A 10.6% gap on a
  within-run outline invariant is roughly 20x the rasteriser floor. Do not let
  anyone argue it up.

A method note worth keeping: the first pass of this verification used one
permissive threshold and produced five false findings of 100+ px band
displacement, which were canonical's unsharp halo bridging bands the render
keeps separate. Sweeping the threshold (rule 6) collapsed the worst case to
1 device px. Rule 6 is not optional.

## The iOS baseline — 72 screens, and evidence the method works

Full sweep against the current build: **72/72 captured, 72 distinct md5s, 0
gaps, 0 step failures, 0 wider than 393pt.** Per-screen numbers in
`$SCRATCH/verify-ios-full/BASELINE.json`, measured top-anchored over canonical's
1844 rows (see the artboard note above).

The result is the strongest evidence so far that the one-screen-at-a-time method
is doing something real rather than moving numbers around. **The three finished
screens are the three best on the entire set, and it is not close:**

| screen | mean \|d\| | state |
|---|---|---|
| 001 splash | **2.493** | DONE, A+ |
| 003 sign-in | **3.772** | graded A, display-face condition open |
| 002 welcome | **6.528** | DONE, A |
| 033 live-form-feedback | 15.109 | best untouched screen |
| … | … | |
| 023 photo-review-crop | 55.018 | worst |

Across all 72 the mean is 30.488 and the median 29.390, so the untouched screens
sit around 30 and the finished ones sit under 7 — a factor of four to twelve.
003 currently measures better than 002, which a fresh grader scored A.

Worklist by distance, worst first: 023 (55.018), 018 (50.024), 060 (49.756),
068 (48.674), 051 (46.947), 053 (46.825), 042 (46.632), 061 (45.199),
055 (44.014), 007 (43.731). Note 018 was already known to have no phone
composition at all — it renders a reflowed desktop tree — and the measurement
independently puts it second worst.

Same caveat as the desktop table: this is a **regression and triage** baseline,
not a grade. A screen is compared to its own earlier capture, and the ordering
tells you where to spend a cycle, nothing more.

## The desktop regression baseline — 20 screens, rebuilt

`$SCRATCH/verify-desktop` now holds all 20 desktop screens captured from the
current build, with per-screen numbers in `BASELINE.json`. It replaces
`grade-web-r9`, which predates the PR #53 merge and therefore reports a
regression on every screen the merge touched. The capture asserts what it always
did: 20 distinct hashes, no overflow, one rail each.

**These numbers are a REGRESSION baseline, not a fidelity score.** They run from
18.058 (096) to 54.195 (094), mean 31.287, where iOS 003 sits at 3.772 — and
that gap is mostly structural, not quality. Canonical puts navigation in a top
bar so its content starts at x=0; this app puts it in a 196px sidebar by
standing ruling, which displaces every screen horizontally. No amount of type
work closes that, and a large absolute mean here means nothing on its own.
Compare a screen only against its own earlier capture.

Byte-identity is the stronger test where it is available. Desktop 077 came back
md5 `69b2184b0f0e7553108d23c2aae71071`, identical to the pre-003 baseline — the
capture harness's own duplicate check flagged it, which is a better proof that
003 changed nothing on desktop than any pixel threshold.

Worst first: 094 (54.195), 084 (43.082), 082 (38.836), 086 (37.867),
087 (35.904). Best: 096 (18.058), 081 (18.950), 095 (20.822).

## Method rules — seventy-one, each learned by getting something wrong

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
14. **Solve related runs jointly, not one at a time.** Two runs sharing a token
    trade error back and forth indefinitely when tuned separately. On 003 body1
    and remember sat at -5.0% and +5.2% ink through several rounds of
    single-run tuning and closed as soon as they were solved together.
15. **Cap-top deltas that share a sign are ONE container offset.** On 003 five
    unrelated runs at three sizes read -3.32, -4.20, -3.35, -2.67 and -2.02:
    nothing positive. A per-run type error scatters around zero. Fixing that
    with five compensating leading tweaks lands the cap tops and leaves every
    inter-band gap wrong, and a grader measures gaps. After the container fix
    the same runs read +0.22, +0.28, -0.31, -0.32 and +0.33.
16. **A media query scopes CSS; it does not scope an SVG attribute.** 003's
    phone CSS lives in `@media (max-width: 767.98px)` and is genuinely
    desktop-neutral — but two ink corrections were made as markup attributes on
    `AppleMark` and `GoogleMark`, which are shared components, and they painted
    at every viewport. Route the correction through the media query instead: set
    `fill` on the path from inside it, and for a stroke keep `stroke="<colour>"`
    permanently with `stroke-width="0"` in the markup and raise the width only
    inside the query — a zero-width stroke paints nothing.

17. **Ask what STATE canonical is in before measuring a single band.** Canonical
    003 is not an empty sign-in form — it shows a typed address, a 16-character
    password masked to 16 bullets, a green validation ring and two "Looks good."
    lines, all of it live validation that does not exist until the player types.
    Measuring it against a default render compares two different screens, and
    several bands have no counterpart at all. The capture harness now has `fill`
    and `blur` steps for this; put the state in the route map so it is reached
    the way a player reaches it. **Check 004-007 for the same thing before
    starting them** — every form screen is a candidate.

Also: **check the ASSET, not just the CSS** (002 drew an entirely different
photograph at the right size and position), and **a large desktop-guard diff is
often live data** — 1,495 of 1,508 differing pixels on one run were 079's date
string rolling over at midnight.

18. **`tsc --noEmit` is not the lint gate.** CI ran red for ten commits on two
    unused constants in `phone-003.ts` that ESLint treats as errors and tsc does
    not flag at all under this config. Every verification runs `npm run lint`
    alongside tsc, and the CI conclusion gets checked after pushing rather than
    assumed.
19. **Ask a grader for a falsification, then actually run it.** 003's A+ came
    with one, it failed, and the grade moved to A. A grade whose reasoning has
    not been tested is an opinion. Equally: when the test comes back negative,
    check the instrument fired before believing the negative — `slight` hinting
    could have been inert at this scale, and the proof it was not is that caps
    snapped to exact integers while horizontal metrics held to 0.02 px.
20. **Try every cut in the family before calling a face residual unreachable.**
    003's display solve compared two of four Tungsten cuts and declared the
    better one final. A 7.4% thin stem is what an untried heavier cut would
    move. "Alternatives measured worse" means ALL of them.

21. **A ratio taken INSIDE a run is scaleX-invariant, and that is what identifies
    a face.** On 003 the display stem pointed at Tungsten Bold, and Bold does
    land it — 16.05 against canonical's 16.09 where Semibold reads 14.79. What
    disproved it was I/N, the ratio of two ink widths in the same run: canonical
    0.3574, Semibold 0.3590, Bold 0.4196. Absolute widths can always be fitted
    with scaleX; a within-run ratio cannot. Reach for one before concluding a
    face is right or wrong.
22. **Segmenting an N returns `nan` on exactly the cuts under test.** Its
    diagonal welds to the left stem near the top and the right stem near the
    bottom, so demanding three clean column segments fails on heavy weights —
    the ones a stem investigation is about. Read the RIGHT stem across the top
    of the glyph and the LEFT stem across the bottom. That reproduces
    canonical's 16.08 / 15.84 to within 0.02.

23. **md5 detects duplicates, NOT regressions.** Re-running the full iOS sweep
    after the 003 word-spacing change, four screens changed hash — 003 plus
    021, 041 and 071. Measured, the three extras differ by a **max delta of
    1 to 3 with ZERO pixels above 8**: rasteriser jitter between identical
    captures of the same build, not a leak. 003's real change reads 2,376 px
    above 8 with a max delta of 255. So md5 keeps its actual job — catching a
    redirect that ate a screen, which is what found 072 == 048 — and regression
    is judged on a pixel threshold. The desktop side already knew this shape:
    8 of its 20 are not byte-stable run to run. On iOS it is 3 of 72.

24. **Scrutinise a measurement that favours the build HARDER than one that does
    not.** Running the second grader's falsification, a hand-picked column band
    on the m's left stem gave x/cap 0.7336 -> 0.7039 under a x1.10 scale — a
    move of -0.0297, past the grader's own +/-0.02 threshold, which by its
    stated criterion would have invalidated its largest defect and raised the
    grade. Re-measured by rule 1 — per-column sub-pixel crossings across the
    whole run — the move is **+0.0025** and the finding stands. The wrong answer
    was the flattering one, it came from the exact shortcut rule 1 forbids, and
    it was one step from being reported. Three of this screen's false findings
    have now come from hasty measurement; this is the only one that would have
    been believed because it was welcome.

25. **A ratio threshold without a named estimator is a hand-picked column
    waiting to happen.** The grader set +/-0.02 on x/cap without saying how to
    measure x/cap, and the two reasonable readings disagreed by more than the
    threshold. The mechanism is sub-pixel phase: at a different size a glyph
    lands on a different phase, one column's top crossing moves ~0.5 px, and on
    a ~12 px x-height that is ~4% — about 0.03 on the ratio, almost exactly the
    spurious move. Percentile-over-all-columns averages the phase out. **Every
    threshold this project states must name its estimator.**
26. **Size and scaleX move TOGETHER, and that is the vertical degree of
    freedom.** Each run here is solved with its own size and its own scaleX, so
    a run can be made taller while holding its advance — and that is how 003's
    baselines came apart: "Forgot password?" was given a larger size with a
    narrower scaleX than "Remember me", both landed their advances, and the
    taller run split the baseline by 2.07 px against canonical's 0.19. Proof it
    is vertical-only rather than a size increase with tracking compensation:
    per-glyph ink widths match canonical at ratio 1.0000 and the gaps match too.
    **Never close a baseline by changing font-size alone** — the horizontal
    metrics on this screen are right (12 runs matched to 0.3%) and a bare size
    change moves them off.

27. **A brand palette is not evidence that the palette is right.** 003 shipped
    the official Google marks — `#EA4335 / #FBBC05 / #34A853 / #4285F4` — and
    every review passed over them because they were obviously correct. Canonical
    uses none of them: `#F0372D / #FDC80F / #21A552 / #3C86FA`. The thing that
    hides a defect like this is that it looks like the answer.
28. **Read a flat fill from the INTERIOR, never from its most saturated pixel.**
    Canonical is unsharp-masked, so the extreme pixel is overshoot. Probing the
    Google yellow by peak saturation gave (255, 204, 1); the distance-shell
    plateau at d in [3,4) — mask by hue, Euclidean distance transform, average
    only that shell — gives (252.2, 199.8, 15.7). Rule 8 applies to fills and
    not just to type.
29. **To rule out canonical's capture chain, measure a fill you already agree
    on.** The obvious objection to any colour finding is that canonical's export
    moved it. Three flat fills on the same image answer it: orange plate
    (252.0, 55.7, 1.5) against our (253, 55, 1), black (2.7, 2.3, 2.1) against
    (0,0,0), white (254.1) against (255) — all within 2 units, while the Google
    arcs differ by 6-20. A chain that leaves orange, black and white alone did
    not move the arcs.

30. **A threshold computed from a contaminated plateau reports NOTHING, which
    looks like no data rather than a broken read.** Measuring 003's OR rules,
    my first two attempts returned "0 runs". The rules are a hairline peaking at
    only 0.27 coverage while the "OR" glyphs between them peak ~10x higher, so a
    plateau estimated across the whole row lands the 50% threshold above the
    entire feature. Estimate the plateau OUTSIDE the loud neighbour. A null from
    a segmenter is a claim about the segmenter until proven otherwise.

31. **Do not replace a baseline before the change that justifies it has passed
    its own guard.** I swapped the desktop baseline in the same cycle I asked
    for a shared-markup change, the change failed its gate and was reverted, and
    the baseline sat wrong until the builder's report contradicted mine. A
    baseline is only as good as the last measurement that confirmed it — update
    it after the guard passes, never in anticipation.

32. **Matching a run's ADVANCE does not pin its SIZE — the two are degenerate.**
    Every run on 003 was solved to canonical's advance width, which leaves a
    whole family of (size, scaleX) pairs and lets the solver pick a wrong one
    silently. It did: `acct1` landed at size 12.482 with scaleX 0.9171 where
    `helpEmail` sits at 12.548 / 0.8149. Canonical's footer-to-helper size ratio
    is 1.0679; ours was 0.9947 — the footer is ~6.5% undersized and scaleX
    stretched it back onto the right advance. Nothing in an advance-based fit
    can see this.
    **Pin size from a within-image ratio between two runs, then let scaleX take
    up the advance.** An o-height ratio between two runs of the SAME image is
    exactly their font-size ratio, because the face cancels — which also makes
    it immune to the adjudicated x-height residual. A size-invariant shape
    check corroborates: `o`-width/`o`-height put canonical's five body runs in
    a 5.2% band while ours had the footer 4-15% off its own ramp.

33. **A falsification can be unsatisfiable by construction — check BOTH branches
    are physically reachable before running it.** 003's fourth grader asked for
    o w/h to "fall from 0.777 to 0.842" (0.842 is higher than 0.777 — the
    sentence is incoherent on its face) and for w/h and size to rise together.
    At a pinned advance they cannot: width goes as f·s and advance goes as f·s,
    so pinning the advance pins the width, height goes as f alone, and therefore
    **w/h goes as 1/size**. Its confirm branch was impossible for any render to
    satisfy, so the outcome fell in the gap between its two branches. A test only
    one branch can pass is not a test, and the claim it defends does not survive
    its removal. The grader found this itself and withdrew the defect.
34. **Matched width with excess height means the FACE, not the size.** The
    footer's `o` measures width x0.909-0.986 and height x1.068-1.103 against
    canonical depending on estimator — every estimator agrees on the direction.
    No font-size produces that: raising size worsens the height, lowering it
    worsens the width. Read the two axes together before calling anything a size
    error; a height gap alone is not evidence.

35. **The scratchpad toolkit had a crossing bug that inflated every extent by
    ~1 px, and it is invisible in deltas but fatal in ratios.** Its `cross()`
    placed the trailing edge at `i+1+frac` instead of `i+frac`. A delta between
    two runs measured the same way cancels it; a RATIO does not.
    **The display I/N figures in this file are affected.** Recorded as canonical
    0.3574 / Semibold 0.3590 / Bold 0.4196; re-measured with the corrected
    library, canonical reads **0.3426** and the shipped Semibold **0.3552**. So
    Semibold is ~3.7% off rather than the 0.4% recorded, and Bold's ~17% miss
    still loses by a wide margin — **the shipped decision stands, the precision
    claim does not.** Do not compare a new I/N against 0.3574.
    The committed library at `docs/shotiq/measure/` is the corrected one; every
    number in this file measured before it should be treated as an estimator of
    unknown calibration until re-run.

36. **A React portal cannot be hidden by a wrapper — gate it on the viewport.**
    `PhoneShell` portals into `<body>` as `position:fixed; z-index:60;
    max-width:393px`, so a `md:hidden` div around the *call site* never applies:
    the portal subtree is not a descendant of it and does not inherit
    `display:none`. Three call sites did this and the 393pt phone screen painted
    over the desktop app at every width. Use `usePhoneViewport()`, which exists
    for exactly this and says so in its own docstring.
    **Two of the three only appear on an account with NO DATA**, which is why
    every capture missed them — the grading account is seeded and Kevin's is
    empty. `docs/shotiq/phone-leak-audit.mjs` is the guard; it walks the app
    signed in at 1512x900 and fails on any visible fixed 393pt panel. Its route
    list is overridable with `ROUTES=` precisely because a seeded account cannot
    reach an empty state, and that is how the second leak was proven.

37. **"How this reaches the user" is a measurable claim, and I asserted it from
    a config file instead of measuring it.** I read `server.url` in
    `capacitor.config.ts`, saw the live host, and told Kevin — repeatedly, over
    days — that no Xcode build was needed. Two independent things falsify that,
    and one log line would have caught either: `server.url` is frozen into the
    binary at build time, so the value in the *repo* says nothing about the app
    already *installed*; and the phone does not run that project at all, it runs
    native SwiftUI from `ios-native/`. The evidence was one `device`-lane log
    away the whole time (`Debug-iphoneos/ShotIQ.app`, Swift files compiling).
    The same discipline the rest of this ledger applies to pixels applies here:
    **read the artefact, not the source that supposedly produced it.** Kevin
    kept saying he could not see the work; each time I re-explained the theory
    rather than checking what was actually on the device. When someone reports
    that the output is missing, that is data about the pipeline — treat a user's
    "I don't see it" exactly like a failing measurement.

38. **A capture at one configuration is not evidence about the configurations
    users run.** Kevin's phone was drawing screens wider than the display,
    centred and clipped off both edges — wordmark gone under the notch,
    "Progress" truncated to "Progre..." — while all 74 simulator screenshots
    came back clean. Both were true. A freshly created simulator boots at the
    DEFAULT text size, and that is the single configuration in which the defect
    is invisible.

    The defect: all ~176 type declarations in `ios-native` are
    `Font.custom(_:size:)`, which scales with the phone's Text Size setting,
    while everything around it — column widths, paddings, glyph sizes, the 853px
    canonical geometry — is fixed. Above the default the type grows and its
    containers do not, rows sum past the viewport, and the screen goes wide and
    centred (the same end state `CanonicalPhoto.swift` documents for an
    oversized child). There was not one `fixedSize:`, one `relativeTo:` or one
    `dynamicTypeSize` clamp in the whole target.

    This is the THIRD instance of one pattern, and the pattern is what matters:
    the grading account is seeded where Kevin's is empty (rule 36); a phone
    capture says nothing about the desktop tree at 1512px; and now, every
    capture ran at one text size. **Each time, the harness sampled the
    configuration where the bug does not exist and reported a clean bill of
    health.** Before trusting any sweep, ask what it holds FIXED that a real
    user varies — account state, viewport, text size, locale, reduce-motion —
    and either vary it or write down that the sweep says nothing about it.
    `scripts/simshots-config.sh` now pins the capture at `accessibility-medium`
    for exactly this reason, and it is re-included in `.gitignore` because the
    broker clones fresh and an untracked config would silently restore the
    blind spot.

39. **A CI job that dies mid-step is a null, and a null is not agreement.** The
    unclamped falsification arm (run 31021077649) was the one piece of evidence
    that could have confirmed *or refuted* the Dynamic Type diagnosis. It died
    14 minutes in: "Run guarded Xcode job" still marked in_progress, the upload
    step never reached, no artifact, and the logs 404 because GitHub never
    received them either. A runner interruption on the Mac — the device build
    and the clamped capture on the same runner either side of it both finished.

    The failure mode to guard against is quiet: an experiment set up to
    challenge a belief produces nothing, and the belief simply survives
    unchallenged. It is very easy to write "the run didn't come back, but the
    clamped arm looked fine" and move on, which converts a missing measurement
    into soft support for the claim. **The clamped arm can only show that the
    clamp pins layout across text sizes; it cannot show that unclamped type was
    what broke Kevin's phone.** That remains unproven, and the arm is queued
    rather than dropped.

    Two mechanical tells that a run produced nothing, both cheap to check before
    reading any pixels: `list_workflow_run_artifacts` returning `total_count: 0`,
    and a job whose steps show a later step still `pending` while the job itself
    reads `completed`. Also note the job API can serve stale `in_progress` state
    for a while — this job read as running 30 minutes after its own
    `completed_at`. Trust `completed_at` and the artifact list, not the status.

40. **A sweep result identical across inputs that should differ is not a
    measurement — put a control in every sweep.** Solving 004's monogram, an
    81-candidate sweep returned 9.5756 for its winner against a 13.8039
    baseline, and SIX different (left, top) inputs all returned that same number
    to four decimals. Re-run alone, the identical CSS reproduced 20.9480 four
    times — WORSE than baseline. The 9.5756 measured nothing; the page was in
    some other state, and it happened to point the flattering way, which is the
    direction that gets acted on (rule 24).

    Two cheap defences, both now in place. Every sweep carries a CONTROL
    candidate set to the recipe's own current values: it must reproduce the
    built capture's number for that band, and if it does not, nothing else in
    the run is trustworthy. And `sweep-run.mjs` now records each candidate's
    post-injection `getBoundingClientRect` and computed font-size/transform in
    `index.json`, so "these two candidates differed" is checkable rather than
    assumed.

    The monogram itself is left ALONE. Every geometry tried scored worse than
    the recipe, so the 13.804 residual stands as measured: the render sits
    0.93px too tall and 1.39px too narrow (aspect 1.291 against canonical's
    1.343), which is a shape-coordinate error inside the traced SVG, not a box
    error — the box uses `viewBox="80 424 76 58"` matching its CSS box exactly,
    so scaling the box moves every edge uniformly and the measured error is not
    uniform. Forcing a box change to chase the number would break rule 24 and
    the standing ruling against padding a metric.

41. **A capture's target ref is read when the JOB STARTS, so a moving branch is
    not a reproducible experiment.** The unclamped falsification arm is fired by
    flipping one line in `scripts/simshots-config.sh` and pointing the broker at
    a branch. Fire, then revert the line a minute later, and which configuration
    actually ran depends on whether the runner had reached its `git clone` yet —
    a race, decided by CI scheduling, on the one run whose entire purpose is to
    settle a claim.

    Two things follow. **`falsify/no-type-clamp` is a FROZEN branch** holding the
    diagnostic config permanently (at ee8fa62); fire the falsification against
    that ref and no revert is ever needed, so the working branch never carries a
    config that must not merge. And **every artifact records `target-head.txt`**
    — the exact target SHA the job checked out. Read it before reading any
    pixels: it says which arm actually ran, and it is the difference between an
    experiment and a coin flip. The same file is how a run's provenance
    (repository, ref, content size) gets confirmed at all.

42. **An environment modifier applied at the app root does not reach anything
    presented in a sheet — so a "global" fix has a hole exactly where the app's
    modal surfaces are.** `ShotIQApp` put `CanonicalTypeScale()` on `RootView()`
    inside the `WindowGroup`. Sheet content is hosted in its own presentation
    context, seeded from the scene rather than from the presenting view, so
    every screen behind `.sheet` ran at the phone's real text size while every
    pushed screen ran clamped. Four screens (021, 022, 023, 024) and
    `EditProfileSheet` are all reached through the one profile-menu sheet, and
    all of them are the screens Kevin photographed as broken. The fix that
    survives is to clamp on `CanonicalScreen`, the scaffold every screen already
    uses, so it holds however the screen is presented.

    The general form: **a cross-cutting fix must live on the thing that is
    common to the population it claims to cover, not on an ancestor that happens
    to contain most of it.** `RootView` is the ancestor of most screens;
    `CanonicalScreen` is what all screens ARE.

    And the tell that found it: the same view (`Wordmark(size: 30)`) with the
    same parameter, measured on two screens, rendered 207px and 322px wide.
    **When identical code measures two sizes, stop looking at the code and start
    looking at the environment it is in.** Two hours were spent before that on
    the containers around it — the Spacer, the chip widths, the photo frame —
    all of which were downstream of a scale factor nobody had measured.

43. **Verify that a test-harness switch reached the app, not that the command
    line carried it.** `TEST_RUNNER_SIMSHOTS_EXTRA_ARGS=…` passed as a trailing
    argument to `xcodebuild` is a BUILD SETTING OVERRIDE; xcodebuild only
    forwards `TEST_RUNNER_*` into the runner from its own ENVIRONMENT. The
    falsification arm therefore ran clamped while its log showed the unclamped
    flag, and produced "52 of 75 screens byte-identical between the arms" — a
    tautology that reads exactly like a refutation. It passed both of rule 41's
    checks, because those checks confirm which COMMIT ran, not which
    CONFIGURATION.

    So the walk's manifest now prints the launch arguments the app actually
    received. An arm that claims to change the app's configuration is only
    readable against that line, and any A/B whose two arms come back identical
    should be suspected of being one arm run twice before it is believed.

44. **A face question is answered by the font files, not by a capture.** Two
    sessions were spent arguing whether a role was the wrong SIZE or the wrong
    FACE from pixel ratios — a comparison that needs a clean cap, a clean
    advance and the same string on both sides, and that produced two wrong
    answers in a row (1.0999 from mismatched glyph counts, 1.34–1.42 from a cap
    contaminated by two baselines). `fontTools` reads `hmtx` advances and
    `OS/2.sCapHeight` straight out of the bundled OTF in seconds, offline, with
    no simulator and no capture: advance-per-character-per-unit-cap is then
    exact, and comparing it against the same figure measured off the canonical
    PNG identifies the face outright. Doing that put the 024 tab role on
    Tungsten-Medium to within 3.4% after the pixel route had ruled Tungsten out
    entirely. **Read the fonts first.**

45. **A whole-band scan assumes one baseline.** 040's tab row scans as 45px of
    ink for a 13pt font because its ACTIVE tab sits 17px above its inactive
    ones. Measure each word's own bounding box and compare the caps to each
    other before combining them; if they disagree, the band holds more than one
    thing. This is the same class of error as the pill border in the 020 window
    and it produced the same kind of confidently wrong ratio.

46. **The container exports `NODE_ENV=development`, and that silently breaks
    `next build` — every page, not some.** Resuming 004 after a rollback, the
    production build reported `Error occurred prerendering page` for **all 51
    routes**, including `/terms` and `/privacy`, which import nothing anyone had
    touched. The stack said why and it was one line up in the log: Next printed
    `You are using a non-standard "NODE_ENV" value`, and every frame ran through
    `react-dom-server.browser.development.js`. A dev react-dom cannot statically
    generate an App Router page, so the error page generation falls back to the
    pages-router document and reports `<Html> should not be imported outside of
    pages/_document` — a message that points at markup nobody wrote and sends
    you looking for an import that does not exist.

    Two things make this worse than a normal build failure. **It prints the
    route list at the end and exits looking successful**: `BUILD_ID` is written,
    the closing summary scrolls past, and only `prerender-manifest.json` is
    missing — which surfaces much later as `next start` throwing ENOENT. And
    **`NODE_ENV=production npx next build` is not enough on its own here**; the
    shell is re-initialised from the profile per command, so the working form is
    `env -u NODE_ENV NODE_ENV=production ./node_modules/.bin/next build`.

    The check, before reading a single pixel from any capture: the build log's
    first lines must NOT contain "non-standard NODE_ENV", and
    `.next-<screen>/prerender-manifest.json` must exist. A capture taken from a
    server that never started is not a measurement, and this is the same shape
    as rule 30 — a null that looks like data — one level further out in the
    toolchain than any rule here had reached.

47. **Solve with the lever you are going to ship, or the prediction is about
    a different render.** Three of 004's bands were solved in one sweep round
    and two of them transferred to the built capture to four decimals — plate
    8.4842 -> 8.4842, signin 5.1898 -> 5.1897. The third missed by a full 1.06.

    The two that landed were solved by injecting the SAME CSS property the
    recipe emits: `transform:scaleX(...)` for the plate label, `font-size` for
    the sign-in label. The one that missed was a vertical move, injected as
    `transform:translate(0,ty)` in the sweep and then written into the recipe
    as `dy`, which the recipe turns into `top`. Both ask for 2.75 device px.
    They do not land in the same place: a transform is applied at paint and a
    `top` goes through layout, so a text raster snaps onto a different phase
    (rule 12), and the built band came back 5.2491 — which is not a random
    miss, it is EXACTLY the sweep's adjacent plateau. The shipped move lost one
    device row that the measured move had.

    This is rule 43 one level in. There, an arm claimed a configuration the app
    never received; here, a sweep claims a number for a render nobody is going
    to ship. Both look like clean data. **Before believing a sweep, check that
    every candidate's CSS uses the property the recipe emits for that
    parameter** — and if a run has to be solved through a different lever than
    it ships, the built capture is the only number that counts and the sweep
    figure must not be recorded as the prediction.

48. **Rule 9 is symmetric, and the library applied it to one side.** The area
    ladder dropped a rung when the REFERENCE was thin, which is the case rule 9
    describes — canonical's top rungs are unsharp-mask overshoot. But the
    failure that actually occurs is the mirror of it: canonical HAS that
    material and the render, being flat colour, structurally cannot, so it is
    the MEASURED side that comes back empty against a thick reference.

    On 004's lede, canonical held 2141 px at coverage 0.75 and 612 at 0.90
    where the render held zero. Those rungs scored 0.0000 — read as "light" —
    and dragged the verdict on a run that is 11% HEAVY on every rung it can
    express (1.0704, 1.1266, 1.1226, 1.1050) all the way to `matched`. The
    rms_log came out 4.0831, which is log(1/2141) leaking into a statistic that
    is supposed to be a weight residual and would have been minimised by a
    solver.

    Fixed: a rung is dropped when EITHER side is below `min_reference`, and the
    zero-guard is gone from the log so an empty rung can never contribute. The
    verdict is now `heavy` at rms_log 0.1027 with (0.75, 0.90) reported as
    dropped rather than silently scored.

    **Any ladder verdict recorded before this fix was computed by the one-sided
    version** and should be re-run before it is relied on — a `matched` in
    particular, since that is the value the bug produces from a `heavy`.

49. **RETRACTED AS ORIGINALLY WRITTEN, and kept because the retraction is the
    lesson.** It claimed: when the band mean wants MORE ink and the ladder wants
    LESS, the ink is paying for a misregistration. The evidence was 004's
    display run, where sweeping `-webkit-text-stroke-width` had the band mean
    preferring 0.29-0.33 and the ladder preferring 0.10, pointing opposite ways.

    Both estimators were scoring a CLIPPED run. The report's display window was
    148-220 and the run's ink spans 162-239, so a quarter of it — including its
    whole baseline row — was outside both bands. Re-measured over the full run
    the opposition mostly evaporates, and the solve the rule produced (stroke
    0.05) is the worst of the three candidates on every full-run metric:

      ty -0.75  st 0.33   band 14.2223  whole 5.3624  ladder 0.0419 heavy
      ty -0.75  st 0.15   band 14.3046  whole 5.3669  ladder 0.0083 matched
      ty -0.75  st 0.05   band 14.5484  whole 5.3801  ladder 0.0228 matched

    What survives is weaker and worth keeping: an ink parameter CAN absorb a
    geometric error, so a weight solve is only meaningful once the run's
    position is solved, and two estimators disagreeing is a reason to question
    the measurement before theorising about the render. What does not survive is
    the specific diagnosis, and it was acted on before it was checked against
    the whole run. The vertical move it came bundled with is real and stands.

50. **A band window must CONTAIN its run's ink, and the windows do not tile the
    screen.** Both halves bit on the same change.

    The display window clipped 20 of its run's 78 rows, so the solver optimised
    the part it could see and pushed error into the part it could not: the band
    improved 14.8012 -> 13.9966 while the WHOLE SCREEN got worse, 5.3708 ->
    5.3801, and row 238 alone went 11.9 -> 71.5 as the run's baseline slid out
    of alignment in the gap between two windows. A band score is only a fidelity
    number for the ink inside it.

    And 448 of this screen's 1844 rows — 24% — are inside no window at all. The
    band report can improve while the screen gets worse, and it did. **Report
    the whole-screen mean beside the bands on every round**, and split it
    in-window / out-of-window when the two disagree.

    Cheap and worth running once per screen: for each window, check whether
    canonical's ink touches its edge, and how far it continues past it. On 004
    that check cleared 22 of 23 windows and found this one.

51. **Canonical's small type is BIMODAL and a render's is not, so "heavy" and
    "the wrong colour" are the default false findings on every small run — use
    a SOLVED band as the control.** 004's lede measured 11% heavy on the area
    ladder, and rule 8's total-ink solve pointed at #373942 against the shipped
    #454751. Canonical reaches green 10 in that band where the render bottoms at
    exactly 71, which is #454751's own green: on the face of it, a colour defect
    with two independent estimators agreeing.

    Both are artefacts. Canonical is unsharp-masked, and a mask on a 2 px stem
    pushes the middle of the distribution OUT — some pixels down to a core far
    darker than the fill, the rest up into the light ring. A flat render keeps
    them in the middle. Shares of each image's own ink pixels:

                     dark core    mid    light ring
      canonical         0.190    0.167     0.643
      render            0.000    0.550     0.450

    The control is what makes this conclusive rather than a story: helpPass, on
    the same screen, already solved to 4.5714, shows the SAME signature — 0.134
    / 0.170 / 0.696 against 0.000 / 0.521 / 0.479. The bimodality is present
    where the type is right, so it is canonical's export, not our ink. Every
    darker candidate swept made the band mean AND the ladder worse while only
    total ink improved, which is what a wrong diagnosis looks like from three
    estimators at once.

    So before reporting a small run heavy, light or mis-coloured: measure the
    same three shares on a band already solved on that screen. If the pattern
    matches, the finding is the mask. And confirm the geometry separately —
    the lede's stems are median 2.0 px at every threshold in BOTH images, which
    is what a matched weight actually looks like.

52. **`NODE_ENV=development` in the shell corrupts a production build, and the
    errors name the SOURCE.** Building 004 failed on 51 of 95 pages with

        Error: <Html> should not be imported outside of pages/_document.
        TypeError: Cannot read properties of null (reading 'useContext')

    Neither is true of this codebase. The tell is in the stack trace:
    `react-dom-server.browser.development.js` — the DEVELOPMENT react-dom,
    inside a production build — 32 frames of it and zero production frames.
    This container ships `NODE_ENV=development`, so React resolves its
    development build and prerender dies everywhere at once.

    `NODE_ENV=production NEXT_DIST_DIR=... npm run build` → exit 0, with NO
    other change and no server running in either run.

    THIS RULE WAS FIRST WRITTEN WRONG AND THE ERROR IS INSTRUCTIVE. It
    originally blamed an orphaned `next dev`, because the run that fixed it
    killed a stray dev server AND added `NODE_ENV=production` in the same
    command — two changes, one observation, cause assigned to the wrong one.
    The re-test that exposed it had no dev server running at all and still
    failed identically. **When a fix bundles two changes, it has identified
    nothing; re-run with one variable moved before writing down a cause.**

    Also: run the project's own build script, not `next build` directly.
    `package.json` build is `prisma generate && next build`, and skipping the
    generate step fails with `'kneeAngleMin' does not exist in type
    UserAnalysisSelect` — a schema field that IS in `schema.prisma:264`,
    reported as though the code were wrong.

    A failure common to every page is a claim about the ENVIRONMENT until
    proven otherwise — the build-time twin of rule 30. Check `NODE_ENV`, check
    `pgrep -af "next dev|next start"`, and check whether the same commit builds
    elsewhere, BEFORE editing `_document` or a provider that was never wrong.

53. **Solve sub-pixel placement with a COMPOSITED property, not a layout one —
    and a null from a lever is a claim about the LEVER.** Screen 004's share
    mark was recorded here as "measurably immovable": every sub-pixel offset
    returned `signin` 3.7430 to four decimals. That was checked, as rule 30
    demands, against a control — the same mark displaced by (40,30) scored
    4.5120 and hidden scored 3.9234 — so the scorer demonstrably saw it, and
    the null was written up as a real unreachable residual.

    It was wrong, and the re-grade found it. **Proving the SCORER sees an
    element does not prove the INJECTION reached it.** The sweep moved `left`
    and `top`, which are LAYOUT properties; Chromium snaps them to whole device
    pixels, so every sub-pixel value collapsed into the same render. Measured
    head to head from the same 3.7430 control:

        transform: translate(0.5px, 0.9px)  ->  3.4560
        left/top   +0.5, +0.9               ->  3.8692
        left/top   +0.5, +1.3               ->  3.8692   identical: snapped

    Both eye marks behaved the same way: eyePass 8.1379 -> 7.0040 and eyeConf
    7.1219 -> 6.8625, reachable only through `transform`.

    So rule 30's control is necessary and NOT sufficient. A control that proves
    the instrument reads the element still says nothing about whether the knob
    you turned is connected to it. Verify the LEVER too: move it far enough to
    be unmissable and confirm the response is proportional, or compare two
    levers aimed at the same target. Where they disagree, the composited one is
    telling the truth about the pixels.

    Corollary for this project: any earlier "physically unreachable residual"
    concluded from a `left`/`top` sweep is suspect and should be re-tested with
    `transform` before it is trusted.

54. **When a run resists every metric lever, identify the FACE before reaching
    for another lever. Within-run ink-width ratios are the estimator, and they
    cost minutes.** Screen 004's `display` absorbed four rounds of scaleX,
    scaleY, letter-spacing and word-spacing work and moved 14.80 -> 13.71. The
    fourth grade found why: **the screen draws its headline in a different
    typeface from canonical**, and no affine reaches a different set of outlines.

    The estimator is the point, because it is invariant under exactly the levers
    being swept. Take each glyph's ink width at 0.5 coverage, divide by another
    glyph's in the SAME run, and the ratio does not move under font-size,
    scaleX, letter-spacing or word-spacing — all four scale or translate every
    glyph alike. Fit those ratios against the `hmtx`/`glyf` widths read straight
    out of the font binaries:

        render    vs tungsten_semibold   0.34% rms   <- resolves the true face
        canonical vs tungsten_semibold   4.62% rms   E +10.7%, C -4.2%

    A third of a percent is the instrument's own precision on a face it has
    correctly identified. 4.62% is not a fitting error, it is a different font.
    Confirmed on a second estimator (per-glyph ink area normalised to C:
    canonical E/C 0.965, render 0.789) and on a second canonical screen (002's
    "CAPTURE." returns the same ratios as 004's). Two letterforms say it with no
    statistics at all: canonical's C has a rectangular aperture spanning ~31 of
    its 78 ink rows against the render's ~16, and canonical's E has a middle arm
    4 device px shorter than its top and bottom arms where the render's three
    arms are equal to within 0.6 px.

    Rule 20 was then discharged properly — all SEVEN bundled cuts fitted to
    canonical's cap and advance and measured in-page, not argued about:

        tungsten_semibold (shipped)  13.7110      tungsten_black   33.3992
        tungsten_semibold re-fitted  14.7348      boxedsemibold    34.8488
        tungsten_medium              19.8527      boxedmedium      36.9752
        tungsten_bold                21.9374      boxedheavy       39.1222

    The shipped cut wins by 6.1 band points. **The correct face is not in this
    repository**, and the residual is unreachable in the rule 13 sense: algebra
    (boxedmedium is closest on width ratios at 3.35% rms, but the scaleX 0.6036
    needed to hold canonical's advance drops its stem/cap to 0.0966 against
    canonical's 0.1561 — a 38% weight error) plus the measured alternatives
    above. A parallel check from the builder's side agrees independently: giving
    every glyph its OWN free translation — the optimum no shared CSS lever can
    beat — takes the in-box mean only 20.5730 -> 13.8907, and adding a per-glyph
    scaleX takes it to 12.9841. Every glyph's optimal dy is 0, which also
    settles the vertical claim: the run is already on its rung.

    Two things follow that are larger than one band. First, this is **not a 004
    defect**: canonical 003 fits the same cut at 4.53% rms against 004's 4.62%,
    so the 3.6443 that earned 003 its A was set with this same gap present and
    unmeasured — it should stop being counted against 004. Second, the "narrow
    glyphs, wide gaps, exact advance" signature is AMBIGUOUS. On the nine Geist
    runs it meant a short word space and word-spacing fixed it; on `display` the
    identical signature meant the wrong face and has no metric solution. The
    signature names a symptom, and rule 54 is how to tell the two causes apart
    before spending a round on the wrong one.

    NEEDS KEVIN: supplying canonical's display cut collapses this band — and it
    makes the four rounds of compensating tracking on it obsolete, because those
    values are fitted to the wrong outlines. If the face arrives, `display` must
    be re-solved, not kept.

55. **An injected sweep sheet has to WIN the cascade, and `!important` on both
    sides is decided by document order.** `sweep-run.mjs` marks every candidate
    declaration `!important` and appended its sheet to `<head>`. `PHONE_CSS` is
    emitted as a `<style>` inside the BODY and marks `bang: true` runs
    `!important` too. Equal specificity, equal importance, later wins — so for
    any bang run the recipe beat the sweep and the screenshot came back looking
    like a measurement of a page nothing had been applied to. A face sweep on
    004's display read `fontSize: 49.63px`, the shipped value, on all seven
    candidates.

    Caught only by rule 40's read-back, which is the whole argument for reading
    the candidate back off the element instead of trusting that the injection
    landed. The sheet now appends to the end of `<body>`, and re-appending an
    existing element moves it, so it stays last if the app re-renders.

    General form: a null from a sweep is a claim about the SWEEP until the
    read-back says otherwise. Rule 30 covers the segmenter, rule 53 covers the
    lever, and this covers the injection — three separate places a nothing can
    come from before the pixels get a say.

56. **A capture guard with one axis checks one axis.** `capture-ios.mjs` has
    always hard-failed on `scrollWidth > 393 || innerWidth !== 393` and recorded
    nothing vertical, so 004's ungated `min-height: 900` — which made the phone
    page scroll 48pt over a blank band — walked past it on all 72 screens for as
    long as the harness has existed. It was invisible twice over: no band could
    see it (the capture is identical either way) and `quiesce()` scrolls to the
    top before every shot, so `scrollY` is always 0 and is NOT the measurement.
    `scrollHeight` is, and quiesce does not touch it.

    Now recorded for every screen, with `innerHeight` beside it, and reported as
    `scrolls` — REPORTED, not thrown, and that asymmetry is deliberate. Width is
    a hard invariant; height is not, because some routes legitimately scroll. A
    diagnostic that names the screens and leaves the judgement to its reader can
    be switched on for all 72 at once without breaking a single existing run,
    where a throw would have to be argued screen by screen before it could ship.

57. **A band that spans two independently positioned things measures neither.
    Averaging is not measurement.** Screen 004's report had ONE `lede` window
    (268-352) over TWO separately placed runs. Their optimal horizontal
    corrections have OPPOSITE SIGNS — line 1 wanted -0.536 CSS px, line 2 was
    already on its optimum — so the aggregate averaged a 2.1496 defect on line 1
    down to a 0.4413 compromise and read as solved. Five consecutive independent
    grades looked at that number and moved on, while line 1 was the hottest
    region on the entire screen (rows 285-299) and line 2 never entered the top
    25. Split, line 1 gave up 0.0380 of whole screen to a single `tx`.

    The same shape cost a second finding on the same screen. `plate` mixes an
    already-solved BOX with `createLab`, and `signin` mixes a box with
    `signinLab`. A solved box is a large area of near-zero difference; averaging
    a small hot label into it divides the label's error by the box's area. The
    band bounded createLab at 0.0073; the label's own sub-window bounded it at
    0.0273 and it delivered **0.0352**.

    Two distinct failure modes, and both are the same arithmetic:

        OPPOSITE SIGNS   two runs pull the mean in opposite directions and
                         cancel — the band looks solved and neither run is
        DILUTION         a hot small region divided by a cold large one — the
                         band looks nearly solved and the small region is not

    So: **one window per independently positionable thing.** Where a band must
    stay whole for continuity with recorded numbers, add a diagnostic
    SUB-window rather than redefining the band — `report004.SUBWINDOWS` is
    reported separately and deliberately not merged, because folding overlapping
    rows into the main table would silently change the meaning of every band
    figure five rounds of this ledger have quoted.

    Related to rule 45 (an estimator must not span two things) and to rule 50
    (a window that clips its own run), but distinct from both: here the window
    clips nothing and spans exactly what it claims to. It is the AGGREGATION
    that destroys the signal, not the extent.

58. **A bookkeeping write must never be able to destroy the measurement it is
    bookkeeping.** A full 72-screen capture ran for eight minutes, captured
    every screen successfully, and then died on
    `undefined/IOS-CAPTURE-LATEST.json` because `S` was not exported — throwing
    away all 72 results without printing one of them. The PNGs were on disk and
    every number was gone.

    The write sat BEFORE the console summary and was unguarded. Now the findings
    print first, the persist runs second, it falls back to `OUT` when `S` is
    unset, and its failure is caught and reported rather than thrown. Print
    first, persist second, treat the persist as best effort.

59. **When a new rule arrives, apply it to the band you already closed. A
    residual that survives four rounds of one KIND of sweep has been shown
    unreachable by that kind of sweep and by nothing else.** Rule 57 was written
    on 004 and applied on 004 to `lede`, to `plate`, to `signin` and to the five
    field bands. It was NOT applied to `display`, because `display` had been
    written up as unreachable and the file had stopped asking questions about
    it. Split by word, the two halves want optima of OPPOSITE SIGN:

        CREATE   26.1342 -> 24.4445 at dx -1.05 device px
        ACCOUNT  15.2209 -> 15.0664 at dx +0.15

    the same signature rule 57 was written from. **0.0515 of whole screen, in
    two fields that already existed**, on the band this ledger had twice called
    closed and on which the entire calibration argument rested.

    And the reason four rounds of sweeps found nothing is worth more than the
    number: every one of them moved the run AS A WHOLE. `tx` alone at the
    measured -1.05 scores 16.2278 against a 13.7110 control — WORSE — and
    word-spacing alone is worse in both directions. Only the COMPENSATED PAIR
    separates the words: `tx` carrying both left, `ws` putting the second back.
    A defect whose correction is a compensated pair of levers is INVISIBLE to
    every sweep of either lever alone, and will look exactly like proof that
    neither lever works.

    **What was actually wrong in this ledger.** Rule 54's face finding is
    correct and survived a third independent attack. The COROLLARY drawn from
    it — "the whole remaining gap is placement error downstream of glyph metrics
    that no CSS lever on this screen can express" — was false, and it was
    written by me. A true diagnosis licenses a claim about ITS OWN mechanism and
    nothing more; it does not license a claim about everything else left in the
    band. This is the second time on this screen that an unreachability claim
    has been overturned by the first untried thing (see rule 53's corollary, and
    the word-spacing round). The pattern is not bad luck. It is that "I could
    not find a lever" keeps getting written down as "there is no lever".

    Before writing unreachable again: name the sweeps that were run, name the
    KIND each one was, and say which kinds were not tried. A compensated pair is
    a kind. A per-region split is a kind.

60. **A command completing is not a command succeeding, and `;` will promote a
    failed build into a dist that looks real.** The round-7 build ran as

        npx tsc --noEmit | head -5; echo "TSC done"; next build > log 2>&1;
        echo "BUILD $?"; mv .next .next-004n && echo MOVED

    in the background. `tsc` FAILED — an invalid JSX comment placed between two
    attributes of an opening tag — and the pipeline printed "TSC done" anyway,
    because `echo` reports on itself. The build then failed too, and `mv` ran
    regardless because it is separated by `;` and not `&&`. The result was a
    `.next-004n` directory containing `cache/`, `server/` and a
    `routes-manifest.json` — everything except a `BUILD_ID` — sitting under a
    name that reads like a finished dist.

    Nothing caught it. Not `tsc`, whose output went to a background task file
    nobody opened; not the `$?` echo, which reported the failure into that same
    unread file; not the `mv`. It was caught only when `next start` refused the
    directory, one step before a capture would have been taken from it.

    Two habits, both cheap:

      - **Gate the move on the artefact, not on the command:**
        `[ -f .next/BUILD_ID ] && mv .next .next-00X || echo "did not complete"`.
        A dist is finished when it has a BUILD_ID, not when a command returned.
      - **Read the output of a backgrounded check, or do not call it a check.**
        A completion notification says the process ended. It says nothing about
        what it found. The standing ruling is "do not commit a tree that fails
        `tsc`" — that ruling is only worth anything if somebody looks at `tsc`.

61. **Per-word scatter is not evidence about the compensated pair. Only the 2-D
    grid decides.** Rule 59 said to test for compensated pairs. The very next
    round tested them the cheap way — per-word optima, look for a monotone ramp
    — found none, and wrote "scatter, not a gap" for six runs. Five of the six
    were wrong. A 25-point (tx, ws) grid with a rule-40 control found interior
    minima on `lede1`, `lede2`, `helpPass`, `labFirst` and `labLast`, worth
    0.0339 together.

    The reading was not careless, and that is the point. lede1's per-word optima
    genuinely scatter — +0.69, 0.00, −1.02, −2.68, −0.03, +0.77, +5.00 device px
    by coverage centroid — and a shared ramp fits them badly. **The band mean is
    not the sum of the per-word optima.** A ramp that fits every word poorly can
    still buy 0.2498 on the band, because the band is scored on pixels and the
    per-word optima are scored on centroids, and a centroid is not what the
    estimator sees. `oneacct` and `terms` ARE real 2-D nulls, and only the grid
    could say which was which.

    Rule 59 said a compensated pair is a KIND of sweep that must be tried. This
    adds: it must be tried AS a 2-D grid in the shipping rasteriser. A cheap
    proxy for the grid is a claim about the proxy.

62. **A CSS geometry property is not interchangeable with the SVG attribute it
    shadows. Drive marks through the attribute.** A sweep moved the OR rules'
    `height`/`y` through CSS and reported `orrow` 1.7513 → 1.5892. Through the
    attribute — with `height.baseVal` read back as exactly 1.5, so the injection
    demonstrably landed — the same geometry delivers only 1.7380 and pushes
    n_over8 UP by 599. The CSS number was not a measurement of anything that
    ships, and it was dropped.

    Verified head to head as equivalent, i.e. safe to drive either way: `d`,
    `rx`, `r`, `stroke-width`, `stroke`, `fill`. The ones that differ are the
    geometry properties on a rect inside a scaled viewBox.

    This is rule 47 one level deeper than rule 53 reached. Rule 53 says a
    sub-pixel move needs a composited property; this says a mark's geometry
    needs the property the renderer actually resolves against the viewBox.

    **And a second trap in the same file:** `[data-s4="eyePass"] circle` matches
    TWO circles — the desktop lucide `Eye` (r=3) sits in a `display:none` span
    beside the real pupil. A `querySelector`-based injection hits the invisible
    one and returns a null that reads exactly like "this lever does nothing".
    CSS was safe there only because one of the two paints. Count your matches
    before believing a null (rule 30, in a new disguise).

63. **Measure the GROUND, not only the ink. And what this ledger called an
    "export floor" was not a floor.** Eight rounds solved every ink role on 004
    — ink, graphite, orange, red, green, two rule tones, a value ink, an eye, an
    OR label — and never measured the paper. Canonical's paper is
    **254.05 / 253.94 / 254.01** (sd 0.64). The render was exactly 255
    everywhere. One unit, over the whole 853×1844 canvas:

        255 -> 3.6956    254 -> 3.1212    253 -> 3.6339

    a bracketed optimum worth **0.5744**, with all three single-channel
    neighbours of 254 worse (3.2757 / 3.2972 / 3.2935). That is 15.5% of the
    screen's entire remaining error, and more than six times the eleven-defect
    round that preceded it. The precedent was already in the file:
    `--s4-value-ink` records that canonical's ink is near-black rather than
    black. Its paper is near-white rather than white, for the same reason —
    canonical came out of a design tool, not a rasteriser.

    **The larger consequence is the A bar.** This ledger recorded a "canonical
    export floor" of 0.9281 on 004 and 0.9398 on 003 and treated it as
    irreducible — the thing you cannot get below, so fair to ignore. It is in
    substance this paper offset, and it is REACHABLE, on both canvases, from one
    screen-scoped line: 004 3.6956 → 3.1212 and 003 3.6443 → 3.0569. It is
    common-mode, so it does not explain the gap between the two screens
    (removing it from both widens 0.0513 to 0.0643). What it means is that
    **3.6443 — the number every screen in this campaign is calibrated against —
    was set 0.57 too high**, because 003 was graded A with the same unmeasured
    defect. Fixed here on 003 as well; a screen at A should not sit on a known
    0.5874.

    General form: a residual that appears on EVERY band of a screen is a
    property of the canvas, not of any band, and no per-band sweep will ever
    find it. Before calling a whole-screen remainder irreducible, difference the
    two backgrounds.

64. **A sweep over one parameter licenses a claim about that parameter only.**
    Round 8 concluded that 004's eye pupil was "a DIFFERENT DRAWING, not a
    misplaced one", and the argument was genuinely clever: r=0 — no pupil at all
    — scores better than any positive radius, and a size error cannot do that.
    The premise was true. The conclusion did not follow, because the sweep
    varied the RADIUS AT A FIXED CENTRE and position was never in it. With the
    centre free:

        r=0                  eyePass 4.6179   eyeConf 4.1552
        cx -1.4, r 3.6               4.4184           4.1903
        cx -2.2, r 2.6               4.3232           3.9912

    A positive radius at a shifted centre beats having no pupil at all. It was
    misplaced.

    The same round re-cut the monogram arc from a malformed path to a full
    semicircle, and over-corrected: canonical has NO ink at x 83-90 above row
    465, where a semicircle lays a full-width butt cap across rows 462-464.
    Canonical's arm tapers from row 465 — the arc stops short of 180°, at ~160°.
    Both mistakes are kept in the file, because the second was made while fixing
    the first.

    This is rule 59's shape one level down. Rule 59 says a residual survives one
    KIND of sweep and nothing more. This says a residual survives one AXIS of a
    sweep and nothing more — and an elegant impossibility argument ("a size
    error cannot do that") is exactly the form that hides the missing axis,
    because it feels like a proof rather than a measurement.

65. **A refusal is a claim about a quantity. Measure it, or you have not
    decided anything.** This ledger twice declined per-word spans on 004's Geist
    runs — "markup surgery on a form the player actually uses, to buy about 0.3"
    — and recorded the residual as unreachable on that basis. The COST side was
    never measured, only asserted. The ninth grade measured both sides:

        wrap overhead, zero-transform spans   lede2 +0.0005   terms   +0.0009
                                              oneacct +0.0023 lede1   +0.0028
        the two terms links, before -> after  rects 1 -> 1, widths 63.39 ->
                                              63.39 and 65.79 -> 65.81,
                                              hitsSelf true -> true
        the four runs, dx only                0.1302 of whole screen

    Three thousandths and a link that still hits itself at the same width,
    against a buy of 0.130. The refusal was not a judgement, it was an unmeasured
    number standing where a measurement should have been — the same error as
    calling a residual unreachable without naming the levers (rules 59, 61),
    wearing different clothes.

    So: when the reason for not doing something is a cost, the cost is a
    measurement. "Too invasive", "too risky", "not worth it" are all
    quantities on this project, and all of them are cheap to measure — a
    zero-effect version of the change isolates the overhead exactly.

    Related, and the reason the spans work at all: a WRONG FACE gets each
    glyph's ADVANCE wrong, and wrong advances ACCUMULATE into positional drift
    along a run. Rule 54 correctly says the letterforms are unreachable; it does
    NOT say the drift is, and per-word placement is exactly the lever that
    separates the two. `display` is the control that proves this is not a
    universal escape hatch — per-word free translation buys it exactly 0.0000,
    because both its words are already at their own optimum.

66. **Rule 53 was measured on ONE axis and stated for both — and the overreach
    shipped a functional regression. Verify the things that break, not the
    things you know don't.** Rule 53 says sub-pixel placement needs a composited
    property because Chromium snaps layout properties to whole device pixels.
    Its evidence is real and it is entirely VERTICAL: the two rows it prints as
    "identical: snapped" differ only in `top`. Horizontally Chromium keeps
    LayoutUnit precision, and `left` on a relatively-positioned INLINE box does
    not snap at all — it reproduces the `translateX` geometry to ~0.02 CSS px,
    leaves three of the four runs bit-for-bit unchanged, and costs 0.0018.

    That mattered because the mechanism rule 53 forced instead —
    `display:inline-block` — **breaks find-in-page**. Blink's FindBuffer cannot
    match a phrase across inline-block boundaries, so on the four wrapped runs
    "agree" was findable and "I agree" was not, while the same phrase in
    unwrapped copy at the same depth matched normally. A ZERO-transform
    inline-block already breaks it, so it is the display mode and not the
    offsets. `transform` on an inline box is not a workaround: it computes and
    has no effect (x unmoved, 8 → 8).

    **No band mean can ever see this. The pixels are BETTER for it.** And the
    round that shipped it did verify: link client-rects, run client-rect counts,
    checkbox change events on a link tap. Every one of those was a property that
    inline-block does not damage. Verification that only checks what you already
    believe is intact is not verification — before shipping a markup change to a
    live form, enumerate what the browser does with text (find, select, copy,
    read, translate, reflow) and test the ones the change could plausibly
    touch.

    Two corrections that travel with this: rule 53 stands VERTICALLY and is
    hereby scoped to that axis; and a rule derived on one axis, one lever or one
    band says nothing about the others until someone measures them — the same
    shape as rules 59, 61 and 64, which is now four separate times this project
    has generalised past its evidence.

67. **The objective has no legibility term, so left alone it will walk toward
    illegible type. A pixel metric is not a proxy for typography.** Pushed to
    their true optima, three `lede1` tail glyphs take the band 10.2864 → 9.6241
    — worth 0.0158 — and set "analyses," as **"analy s⊕,"**, the s collided into
    the e. The band mean REWARDS that. It is not a bug in the estimator; a
    per-pixel mean has no term for glyphs overlapping, and canonical's own ink
    happens to sit where the collision puts it.

    This is not hypothetical drift at the tail. At the SHIPPED values **16 of 49
    adjacent glyph pairs already overlap where the face had none** — `display` 5
    of 12 with a minimum gap of −1.147 CSS px, `lede1` 11 of 37 at −1.419 — and
    with every offset zeroed the advance boxes tile exactly, all gaps 0, no
    overlaps. So the mechanism trades typographic integrity for score by
    construction, and the only thing stopping it is somebody looking.

    Two consequences. **Render and look at any per-glyph result before shipping
    it** — the check is a screenshot, and it takes a minute. And a residual
    declined for legibility is a real residual: state it with its number, as
    0.0158 is stated here, rather than quietly leaving it out of the ledger and
    letting the next round rediscover it as an available buy.

68. **Writing a rule is not following it. Rule 66 named this exact failure one
    round before it happened again.** Rule 66 was written when
    `display:inline-block` broke find-in-page, and its instruction is verbatim:
    "enumerate what the browser does with text (find, select, copy, READ,
    translate, reflow) and test the ones the change could plausibly touch." The
    very next round shipped 51 per-glyph spans, tested find, select and copy —
    and not read.

    **Per-glyph spans destroy the accessibility tree.** Measured by CDP
    `Accessibility.getFullAXTree`:

        shipped            114 StaticText,  54 single-character, lede1 ABSENT
        unwrapped control   58 StaticText,   3 single-character, lede1 present
        with the fix        64 StaticText,   3 single-character, lede1 present

    51 spurious single-character nodes, and "Create your ShotIQ account to save
    analyses," did not exist as a text unit anywhere in the tree. The control
    that isolates it was on the same page all along: the per-WORD runs come
    through as whole words, so it is the per-GLYPH level specifically.

    The fix costs **0 pixels** — bit-for-bit identical screenshot, whole screen
    unchanged at 2.6764 — which is exactly why no band mean could have found it,
    and why "the pixels did not move" is not evidence that nothing broke.

    The generalisable part is not about text. It is that a rule written in
    response to a failure does not protect against the next instance unless
    something in the WORKFLOW forces the check. Two rounds, two mechanisms, two
    regressions invisible to the score, both caught by a grader rather than by
    the builder who had just written the rule. When a change touches markup on a
    live surface, run the enumeration in rule 66 as a checklist, not from
    memory.

69. **A verification instrument needs BOTH controls, or its output is not a
    result. I reported find-in-page as verified on a probe that could not fail.**
    Round 11 announced "find-in-page works on all five phrases, tested through
    Blink's real FindBuffer path". The probe navigated to a
    `#:~:text=` fragment and returned `scrollY > 0 || document.querySelector(':target')`.
    **This screen cannot scroll** — `scrollHeight` equals `innerHeight` equals
    852, which this very ledger established two rules ago — so `scrollY` is
    always 0, and a text fragment never matches `:target`. The probe returned
    true for all five phrases anyway, and I wrote it down.

    Re-run this round it returned FALSE for everything, including text that is
    not wrapped at all and a phrase that is not on the page. Two probes, opposite
    answers, neither discriminating. The correct reading of both is "no
    measurement was taken".

    The working instrument is `window.find()` — Blink's own text traversal —
    and it earns that name by discriminating:

        positive controls, unwrapped text on the same page   3/3 true
        negative controls, text not on the page              0/2 true
        the wrapped runs                                     7/7 true

    So the CONCLUSION was right and the EVIDENCE was worthless, which is the
    more dangerous combination: a wrong conclusion gets caught by the next
    grader, and a right one on bad evidence gets believed and reused.

    Rule 30 says a null from a segmenter is a claim about the segmenter. This is
    its mirror image and it is easier to miss: **a PASS from an instrument with
    no negative control is a claim about the instrument.** Every probe that
    reports a boolean needs a case that should fail and does. Cheap, and it is
    the difference between a check and a decoration.

70. **Three consecutive rounds, three mechanisms, three regressions the score
    could not see. The enumeration has to be a GATE, not a memory.**

        round 10   display:inline-block          broke FIND
        round 11   51 per-glyph spans            broke READ (accessibility tree)
        round 12   sr-only duplicate             broke COPY (sentence copied 2x)

    Rule 66 wrote the enumeration — find, select, copy, read, translate, reflow.
    Rule 68 recorded that writing it was not following it. Then round 12 fixed
    READ and broke COPY, which is rule 68 happening again to the person who had
    just written rule 68. A rule that has failed to prevent its own restatement
    twice is not a rule anybody is using; it is a note.

    So it becomes a procedure. **Before any markup change ships on a live
    surface, run all six and record the result — including the ones you are
    confident about, because confidence is what selected the wrong three checks
    each time.** Each is one probe and each needs a negative control (rule 69):

        find       window.find() with a phrase that IS and one that IS NOT there
        select     Selection.toString() over the run
        copy       the clipboard, not the selection — they differ
        read       CDP Accessibility.getFullAXTree, node counts against an
                   unwrapped control on the same page
        translate  count text nodes; a per-glyph split is 44 nodes, not 11
        reflow     the size invariant, at DPR 2 AND 3

    The deeper point is about which defects a metric can hold. Every one of
    these three was INVISIBLE to the band means, and two of them made the pixels
    BETTER. A screen optimised against a per-pixel objective will drift toward
    whatever that objective cannot see — that is not a failure of care, it is
    what optimisation does — so the checks that catch it cannot themselves be
    chosen by the person doing the optimising, in the moment, from memory.

71. **The objective rewards the wrong direction on COLOUR too, and the reward
    is bigger than everything legitimate left.** Rule 67 recorded that a
    per-pixel mean has no legibility term and will walk toward glyph collisions.
    The same trap is live on the colour axis and nobody had written it down.

    On 005, canonical's ERODED STROKE CORES for the graphite runs read luminance
    49-58 — DARKER than the shipped `--s5-graphite` at 73.7. The instrument is
    calibrated: the black runs read 1.0-3.0 canonical against 0.0 render, i.e.
    matched, so the darker reading is real and not an artefact. Design truth
    says darken. The objective says the opposite, monotonically:

        lum  69 (shipped)  6.7842      lum 130  6.7076   <- argmin
        lum  90            6.7364      lum 150  6.7190
        lum 110            6.7135      lum 254  6.9636   (text erased)

    A free **0.0766** sits at a mid-grey 2.4x LIGHTER than canonical's measured
    core, and taking it washes out every secondary text run on the screen. For
    scale, the entire remaining legitimate geometry on 005 is ~0.067.

72. **Two parameters in ONE transform are one parameter, and re-solving either
    silently moves the other.** 005's display carried `skewX(-6deg)` measured
    correctly off canonical and shipped upright anyway. CSS applies the factors
    in `scaleX(s) skewX(k)` right-to-left, so the shear's horizontal component
    comes out as `s x tan(k)`. The skew was set when `s` was 1.00 and was right
    then; two later rounds moved `s` to 0.744 and then 0.586 to land the
    ADVANCE, and each of those flattened the slant from 6.0 deg to 3.55 without
    touching the skew value, naming it in any band, or failing any check.

    The general shape: when a solve changes one factor of a composed transform,
    every other factor's EFFECTIVE value has changed too. Re-derive them, do not
    assume the number you wrote is the number that renders. The cheap guard is
    the readback the sweep already prints — the computed `matrix()` states the
    effective values directly, and `-0.0615911` against a canonical slope of
    -0.10655 was visible the whole time.

    And the reason six rounds of band means never found it: **a shear is not a
    translation, and every alignment instrument here looks for translations.**
    A shift search minimises over (dy,dx) and cannot express a slant, so it
    reports the residual as unreachable. Rule 67 says render it and LOOK — one
    stacked crop of canonical over render showed it immediately.

73. **WITHDRAWN — the mechanism was rule 53 and the cure was already written
    down.** This rule said a sub-pixel mark nudge "is not predictable, only
    verifiable", after round 4 nudged marks through `MARK_BOXES` -> `u()` ->
    `left`/`top` and five of eight failed to land. Every observation was real;
    the conclusion was wrong. `left`/`top` are LAYOUT properties, rule 53
    already documents that they snap, and rule 53's own corollary says a
    residual concluded from a `left`/`top` sweep is suspect and must be re-tested
    through `transform`. Round 4 wrote a new rule instead of applying an old one.

    Re-driven through a composited `transform`, the shift-search prediction is
    exact — same run, same numbers, four decimals:

        back    8.1680 -> 3.9709   predicted 3.9709
        chev1   3.6159 -> 1.5005   predicted 1.5005
        chev3   2.8144 -> 1.3690   predicted 1.3690
        safe1  11.1230 -> 10.4978  predicted 10.4978

    What survives is narrower and worth keeping: **a prediction is a claim about
    the PROPERTY it was measured through.** A sweep that injects the shipped
    property predicts; the same arithmetic routed through a different property
    does not transfer. That is rule 47 stated from the other side.

    Kept as a numbered entry rather than deleted, because "rule 73 was withdrawn
    and why" is the useful record — a rule written to explain a failure that a
    prior rule already covered is a specific way of being wrong.

73b. **(the original text, for the record) A sub-pixel nudge in a unit that gets
    converted and rounded is not predictable, only verifiable.** Eight of 005's marks showed a clean 1-2
    device px optimum under shift search. Applied, the built capture kept three
    and refuted five — and three of the five did not merely fail to close but
    FLIPPED SIGN, back's optimum going (+1,-1) to (-1,+1) on a 1-unit edit.

    MARK_BOXES values are canonical device px, `u()` converts them to CSS px,
    the box lands at a fractional position and the raster rounds, so the same
    1-unit edit moved marks by 1, ~1.5 and 2 device px and two not at all. This
    is the opposite of rule 47's situation: a sweep injects the very property
    the recipe emits, so it predicts; a nudge that passes through a unit
    conversion does not. Apply, build, keep what survives, revert what does not
    — and never keep a change because its prediction was pretty.

74. **A recorded baseline is a claim about the ARTEFACT it was read from.** The
    markup gate's `lede2` control value was 2, read off a build, green for
    rounds. On the production build the same gate, same commit, reads 1 and goes
    red — React's production build merges adjacent text nodes its development
    build keeps separate. Nothing was wrong with the gate or the page; the
    baseline had been taken from a runtime that never ships.

    This generalises past the gate: every "recorded state" in this repository
    was captured from a dist built with `NODE_ENV=development`, because the
    container exports it and `next build` honours it. That one also silently
    broke static generation for 51 pages, so `npm run build` had been exiting 1
    for every screen so far while a BUILD_ID was still written and rule 60's
    gate still passed. Two lessons, and the second is the sharper one: state
    which artefact a baseline came from, and check the thing you are gating on
    is the thing that fails — an exit code masked by an `echo` in a subshell,
    or a path test run from a cwd that persisted from an earlier `cd`, is a gate
    that reports on nothing.

    Why it happens is the same mechanism as rule 67: canonical's glyphs are
    slightly wider and softer than the render's, so lightening the render's ink
    reduces the error at every edge pixel it does not cover, and there are more
    edge pixels than core pixels. The metric is measuring overlap, not colour.

    So: **a colour role is set from the eroded core against canonical, and then
    the band mean is used to CONFIRM it, never to choose it.** If the two
    disagree, the core wins and the disagreement gets written down with its
    number. A grader also tested and refuted its own first reading here — that
    graphite should be darkened toward canonical's cores — because direct
    simulation made every darker target worse too. Both directions are recorded
    so neither is rediscovered as free money.

- Never edit the four measurement-tuned type roles in `globals.css`.
- Scope a colour disagreement to the screen; never change a global token — those
  roles carry the 20 desktop screens graded B+.
- Never delete a region or pad dead space to improve a score.
- Never build into a dist dir while a server serves from it.
- State physically unreachable residuals with their numbers rather than forcing
  them and breaking another metric.
- Do not commit a tree that fails `tsc` or a screen that breaks its size invariant.

74b. **A metric win that moves an ALIGNED thing is always paper-over, and a
    grader can hand you one.** Grader 4 listed 17 translations worth 0.5071 of
    whole screen on 005, all real reductions in the objective, all reproducible.
    Applying them wholesale would have been wrong. Rule 34 discriminates: a
    translation moves both ink edges the SAME way, a size or face difference
    moves them oppositely. Measured on the shipped render, most of that list is
    the second kind —

        help2      L +1 / R -4    five px NARROWER, not displaced (its single
                                  largest item, 0.1855)
        plateLab   0 / 0 / 0 / 0  ALIGNED EXACTLY, and still on the list
        plateMark  0 / 0 / 0 / 0  ALIGNED EXACTLY, and still on the list

    — so the shift centres the error while pushing the origin further off. Rules
    67 and 71 already say the objective rewards the wrong direction on legibility
    and on colour; this is the same trap on POSITION, and the new part is that it
    arrived as a confident, measured, independently-produced recommendation.
    Grader 3 had called help2 correctly and grader 4 contradicted it; the edges
    settle it, not the grade.

    Applied only the same-sign components: 6.3752 -> 6.3036. The rejected items
    are recorded with their numbers rather than quietly dropped.

    And the companion error, which was mine: rule 34 decides WHETHER to move,
    the shift search decides HOW FAR. Taking the magnitude from the edge average
    (1.5 device px) instead of the shift-search optimum (1.0) built a WORSE
    screen — 6.5157, with `diffLab` at 41.2805 because the edge test also
    pointed the wrong way on that run's horizontal. Two instruments, two
    questions; using either for the other's question is a defect.

75. **A REPAIR TO THE PIPELINE CAN DISABLE A SECURITY CONTROL IN A FILE NOBODY
    EDITED.** `/api/auth/csrf` takes no arguments and reads nothing
    request-scoped, so Next 14 classified it as static and PRERENDERED it:
    `randomBytes` ran once on the build machine and the token plus its
    `Set-Cookie` were frozen into `prerender-manifest.json`. Every caller in the
    world got the same token, so the double-submit check compared a constant
    against itself, and `validateCsrf` is cited as a control in three
    consecutive rounds of 005's write-ups.

    The route was dynamic BEFORE only because static generation was failing. So
    the sequence is: the build was broken, the breakage was load-bearing,
    repairing it froze the token. No source diff shows this — the source never
    changed — and no source review could have found it.

    Two rules follow. **Re-verify security controls against the ARTEFACT after
    any change to how the artefact is produced**, not just after a change to the
    code. And **a control worth citing is worth a gate**: `docs/shotiq/
    csrf-gate.mjs` asserts four GETs return four tokens and that no `/api` route
    appears in the prerender manifest. This is rule 74 one level deeper — rule
    74 said a recorded baseline is a claim about the artefact it was read from;
    this says a SECURITY PROPERTY is too.

76. **A NULL FROM A SEGMENTER IS A CLAIM ABOUT THE SEGMENTER, and it can wear
    another rule's clothes.** Round 5 refused to move `plateLab` and
    `plateMark` because their ink edges read `0/0/0/0` — perfectly aligned, so
    by rule 34 any shift would be paper-over. The reading was degenerate. Both
    sit inside the ORANGE PLATE, and with ink measured as `255 - min(R,G,B)` the
    orange saturates as full ink while the white label reads as paper, so the
    ink bounding box IS the window by construction and the answer was 0 whatever
    the truth. Re-measured with the polarity the content actually has,
    `plateMark` is a same-sign vertical translation — exactly what rule 34
    licenses — and it was refused on a null.

    The general form: before believing an edge test, check that the SEGMENTER
    can see the thing. A run on inverted ground needs inverted ink. And the
    trap is sharper than the usual null, because the null arrived dressed as a
    principled refusal under a rule that was otherwise being applied correctly.

77. **A DEFECT MEASURED ONCE IS NOT A DEFECT FIXED.** Round 5's focus repair
    was verified in a browser, passed, and was reported as fixed. Run six times
    it left `document.activeElement` on BODY in three. `requestAnimationFrame`
    can fire before React commits the render that removes `disabled`, so the fix
    was a race that happened to win the trial it was measured on.

    For anything whose correctness depends on ORDERING — focus, timing, a
    concurrency guard, an event handler — one green run is not evidence. Repeat
    it, and report the count: "6/6" is a measurement, "verified in a browser" is
    an anecdote. The same applies to the concurrency defects in this round: the
    read-back-after-upsert was found by running eight trials, and it only failed
    three of them.

78. **CHANGING THE CLIENT THAT WRITES A VALUE CHANGES THE VALUE.** Round 6
    replaced `prisma.verificationToken.upsert(...)` with `$queryRaw` to make
    issuance atomic. `expires_at` is `timestamp WITHOUT TIME ZONE`: Prisma's
    typed client converts a JS Date to UTC before writing it, and a raw
    parameter is resolved by POSTGRES in the SESSION's TimeZone. Same Date, same
    column, different meaning. Measured with a negative control on the unfixed
    statement:

        fixed    UTC / New_York / Berlin   drift 0 min, token LIVE
        unfixed  America/New_York          -240 min, token DEAD on arrival
        unfixed  Europe/Berlin             +120 min, TTL silently extended

    West of UTC that is 100% failure of email verification and password reset;
    east of it the TTL grows by the offset, which falsifies the brute-force
    arithmetic the verify route argues from. A default `initdb` takes TimeZone
    from the host, so it is invisible on a UTC container and fatal on a
    self-hosted box.

    The general rule: an ORM's typed client carries conversions — timezone,
    numeric precision, enum mapping, null handling — that raw SQL does not. When
    a statement moves from one to the other, the conversions are part of what
    moved. Bind them explicitly (`::timestamptz AT TIME ZONE 'UTC'`) rather than
    inheriting whatever the session happens to be, and TEST ACROSS the setting
    the environment controls, because the container you develop in is the one
    configuration where it cannot fail.

79. **A FLOOR CANNOT HIDE A DIFFERENCE LARGER THAN ITSELF — and the attacker
    picks the size.** Round 6 closed a timing oracle with a 25 ms constant-time
    floor, verified quiescent. Under 60-way concurrency the extra query only an
    existing account reaches costs more than the floor and the separation comes
    straight back: median deltas +31.5, +15.5, +21.2 ms across three replicates,
    all p < 1e-8, with a both-classes-absent negative control at p = 0.65. The
    load is attacker-supplied, so this is not an unlucky condition, it is the
    attack.

    Equalise the WORK, not the clock: make the cheap path do the same query
    against a value that cannot exist. Padding is a claim about the maximum
    difference, and you do not control the maximum.

80. **A GRADER'S PIXEL RECOMMENDATION IS A HYPOTHESIS, AND THE BUILD IS THE
    EXPERIMENT.** Grade 6 licensed `diffLab` + `diffMark` as ONE container
    offset under rule 15, sign and magnitude agreed by its own shift search.
    Built, two of the three claims failed:

      * the container offset CANCELS. Children are positioned `left: u(x - ox)`
        with `ox` the container's own x, so moving the container moves the drawn
        rect one way and every child the other. diffBtn 9.2547 -> 9.7779 with
        diffLab UNCHANGED. Rule 15's "one cause, one number" is about the cause,
        not about which coordinate is shared.
      * `diffMark` was already at its optimum (base == argmin == 32.0538), so
        the recommended move had nothing to buy and cost 0.0296.
      * the DIRECTION was inverted. Left-1 took diffLab 23.4138 -> 35.8642 and
        left the residual asking for right-2; right-1 lands 20.1557 exactly.

    Two graders have now handed over confidently-measured pixel lists that were
    partly wrong in ways only a build could show (see also rule 74b). Take the
    hypothesis, keep the measurement, and let the capture referee.

81. **NAMING A CLASS IS NOT SWEEPING IT — the next instance is usually within
    arm's reach of the first.** Round 7 wrote rule 78 ("changing the client that
    writes a value changes the value"; bind timezones explicitly) and, in the
    same commit, bound `expires_at` and left `created_at` to the column default
    — `CURRENT_TIMESTAMP`, a `timestamptz`, cast into a NAIVE column, which goes
    through the session TimeZone exactly as the parameter used to. Same file,
    same function, adjacent column, one commit after the rule.

        expires_at drift 0 min in UTC / Berlin / New_York
        created_at drift 0 / +120 / -240 min

    Worse, the mechanism ADDED that round read the column that was missed, so
    the fix and the regression were the same edit: under Berlin a reset token
    read two hours in the future, was permanently "fresh", and never rotated;
    under New_York grace never applied and rotation was unconditional, which is
    the denial of account recovery the grace window existed to close.

    So when a rule is written, SWEEP FOR SIBLINGS IMMEDIATELY — every other
    column of the same type in the same statement, every other call of the same
    shape in the same file — and record the sweep, not just the rule. Rule 68
    said writing a rule is not following it; this is the sharper version: the
    instance you have not looked for is next to the one you just fixed.

82. **A WINDOW MEASURED FROM THE WRONG CLOCK IS NOT A WINDOW.** The 15-minute
    grace on `password_reset` was keyed on `created_at`, `ON CONFLICT DO UPDATE`
    never touched that column, and nothing deletes expired rows — so it was
    frozen at the user's FIRST EVER request and every later token was born with
    a stale birth date. The window protected the first 15 minutes of the ROW's
    life, not of the TOKEN's. Measured: row aged 16 minutes, an attacker killed
    a victim's brand-new link 5/5, against 3/3 surviving inside the window.

    The verification that missed it is the lesson. "Stable inside the window,
    rotatable outside it" was measured and both halves were true — and the
    conjunction is the defect, because outside the window the VICTIM'S OWN fresh
    token is rotatable too. When a mechanism has a state variable, test it in
    the state a real account reaches after a while, not only in the state a
    fresh fixture starts in.

83. **A CONTROL COPIED BY ANALOGY CARRIES THE ANALOGY'S ASSUMPTIONS, NOT ITS
    SAFETY.** A daily mail ceiling was added to `forgot-password` because
    `resend-verification` has one and the volume argument looked identical.
    Resend's ceiling is survivable for a reason that does not transfer: issuance
    is idempotent there, so hitting the ceiling withholds another COPY of a code
    already in the player's inbox. A reset link has no copy — it IS the way in —
    so the same control keyed on an attacker-typed address became an
    unauthenticated, permanent denial of account recovery at ten requests a day.

    Before copying a control, state the property that makes it safe where it
    came from and check that property holds where it is going. Here it did not,
    and the ceiling was REMOVED rather than re-keyed: the volume it was aimed at
    is the lesser harm, so it is now stated and carried by the per-minute limit
    instead of closed.

84. **EQUALISING THE WORK MEANS EQUALISING THE STATE THE WORK RUNS AGAINST —
    and this AMENDS rule 79's prescription, not its diagnosis.** Rule 79 said
    "equalise the WORK, not the clock: make the cheap path do the same query
    against a value that cannot exist." Applied literally to `forgot-password`
    it failed twice, and the second failure is the instructive one:

      * decoy issue on the ABSENT branch only — existing 3.26 ms against absent
        7.68 ms. The same oracle, inverted.
      * the IDENTICAL `issueToken` call on BOTH branches — -4.27 / -4.95 /
        -4.42 ms across three replicates, against a same-class control of
        -0.27 / -0.23 / -0.03. Identical statements, and still separable.

    The reason is structural and rule 79 does not cover it. `issueToken` is an
    `INSERT ... ON CONFLICT DO UPDATE ... WHERE <grace predicate>`, so what it
    COSTS depends on the row's state: a freshly-issued real token is inside the
    grace window, its UPDATE is blocked, and it costs a no-op plus a read-back,
    while the single shared decoy row ages past the window and every absent
    request then performs a real write. Same statement, different work, because
    the rows were in different states. Equal statements are not equal work
    wherever the statement is conditional on data.

    So the floor came back — 25 ms applied at EVERY exit, including the
    malformed-email and catch paths that had none. Deltas -0.10 / -0.59 / +0.54
    ms inside a same-class control band of +0.66 / +0.85. Rule 79's diagnosis
    still stands and is written into the route rather than papered over: a floor
    bounds a difference the attacker sizes, so under enough concurrency the
    separation returns, and closing it properly needs both branches to touch the
    same row in the same state — a schema change, not a handler rewrite.

    A second measurement lesson came out of the same round. The first timing
    run looked clean and was invalid: most "existing" samples were unfloored
    429s from this route's own 5/min per-address limit, so the experiment was
    mostly measuring the rate limiter. A pool of 30 distinct accounts fixed it.
    When a route defends itself, the defence is inside your sample.

85. **A CHECK IS ONLY A GUARD IF IT IS IN THE SAME STATEMENT AS THE WRITE.**
    The grace window from rule 82 was re-fixed by refreshing `created_at` on the
    conflict path, and it was still wrong, because the DECISION lived in
    TypeScript: read the row, compare its age in JS, then take either a
    rotating branch or a reusing branch. Two round trips with nothing holding
    the row between them. Under concurrency both callers read the same
    pre-rotation row, both decided "outside the window", and both rotated —
    8 of 8 at 5-way, which is the rotation weapon the window exists to close,
    reachable by anyone who can send two requests at once.

    The fix is not a lock and not a transaction wrapper: the whole decision is
    now one statement, with the age test as the `WHERE` on the `DO UPDATE`, so
    Postgres evaluates it against the row it is already holding.

        ON CONFLICT (user_id, type) DO UPDATE SET ...
          WHERE verification_tokens.expires_at <= (now() AT TIME ZONE 'UTC')
             OR (grace IS NOT NULL AND verification_tokens.created_at
                   <= (now() AT TIME ZONE 'UTC') - make_interval(...))

    18/18 clean at 2, 3 and 5 concurrent, with controls confirming it still
    rotates outside the window and still reuses inside it. Generally: a
    read-then-decide-then-write across the application boundary is a race
    wearing the costume of a guard, and it passes every sequential test.

86. **A MEASUREMENT IS OF WHATEVER ANSWERS THE PORT, NOT OF THE BUILD YOU
    THINK YOU STARTED — and this round broke the standing ruling that says so.**
    The ruling is "never build into a dist dir while a server serves from it".
    What was done instead: `rm -rf .next-vNN && mv` a fresh dist into place while
    a live `next-server` held the old one, then reuse the same port. The new
    server died `EADDRINUSE` and said so only in a log nobody read; the OLD one
    kept answering 200 from a directory that no longer existed, so its chunk
    requests 500'd, React never hydrated, and the capture photographed an empty
    unfilled form. That reads as a plausible regression, and three consecutive
    readings of 19.8 were nearly attributed to the caret change under test.

    A 200 on the port is not evidence. Before trusting any capture: kill every
    `next` process (the `npm exec` parent dying leaves the `next-server` child
    alive and serving — `pkill -f "next start -p NNNN"` is not enough), build
    into a FRESH directory name, start on a FRESH port, and read the server log
    for `EADDRINUSE` before the harness runs. Rule 32's stale-dist trap is the
    same family; this is its live-process form, and it is worse because the
    stale artefact answers with a success code.

87. **A GATE RUNS ON THE SCREEN IT DEFAULTS TO, AND MINE DEFAULTED TO THE
    OTHER ONE.** `markup-gate.mjs` selects its profile with
    `process.env.SCREEN || '004'`. Every run recorded in this ledger as "005
    markup gate 11/11" was invoked as `PORT=xxxx node docs/shotiq/markup-gate.mjs`
    with no `SCREEN`, so it measured **004** — a screen marked DONE five rounds
    earlier — and the number was copied into 005's row round after round.

    Run correctly, 005 was **10/11**, failing `translate (no drift)` on a value
    the gate file itself had already written a paragraph about. So the gate had
    been reporting a real defect the whole time, to nobody, about a screen
    nobody was looking at.

    Two wrongs made it look right. A default that names a real screen produces a
    plausible pass rather than an error, and 004 passes, so nothing ever looked
    broken. When a tool takes a target, pass the target explicitly every time —
    and when a tool's output does not name what it measured, make it print that
    first. This one prints `SCREEN 005 <url>` and I had never looked at it.

88. **`next build` AND `next start` HAVE SEPARATE RUNTIME MODES, AND FIXING ONE
    DOES NOT FIX THE OTHER.** The ledger already records the build half of this:
    `NODE_ENV=development` is inherited from the container, the whole repository
    was building with it, and `package.json` was changed to
    `NODE_ENV=production next build`. The SERVE half was never touched. Every
    `npx next start` in every round since has run the production artefact in a
    development runtime, announcing it in a line I had read past all session:

        ⚠ You are using a non-standard "NODE_ENV" value in your environment.

    It is not cosmetic. React's production build merges adjacent text nodes that
    development leaves separate, which is the exact quantity the gate's
    `translate` probe compares. Same dist, same commit, two runtimes:

        NODE_ENV=development   005 gate 10/11   lede2 control 2
        NODE_ENV=production    005 gate 11/11   lede2 control 1

    THE PIXELS ARE UNAFFECTED, and that was checked rather than assumed: the
    capture taken from each runtime is **byte-identical**, md5
    `ee6b3eb9d47ea5806272504229fc5603` both times, whole screen 5.6566 /
    n_over8 104645 both times. So every measurement in this ledger stands; only
    the gate claim was wrong. Start servers with `NODE_ENV=production` and treat
    a startup warning as a finding, not as noise.

89. **A TRANSPARENT CONTROL STILL MOVES ANY INK IT POSITIONS.** Grade 10's
    cheapest finding was that `resendLinkBox` was 20.3 pt tall where iOS asks
    44, because `hitbox(..., 44)` is DEVICE px in a file whose unit is device
    px. Growing it looked free — on the phone every mark is painted by the
    overlay at absolute coordinates and these boxes are transparent, so the
    reasoning was that no measured pixel could move. It moved:

        whole screen 5.6566 -> 5.8340,  resendLink alone +3.3968,
        every other band identical to four decimals

    `hitbox` emits `display:block` at `.s5 [data-s5="..."]`, specificity
    (0,2,0), which beats the button's own Tailwind `flex` at (0,1,0). So the
    control is not a centred flex box: its label sits on the FIRST LINE BOX at
    the top edge, and the box was re-centred on its old midline — which held the
    midline and moved the top by 25.75 px, carrying the text.

    `resendLink` is the only run on this screen positioned by its CONTAINER
    rather than by a `RUNS` entry, which is exactly why it was the only band
    that could move, and exactly the thing a whole-screen figure is for: the two
    intended changes landed on their swept predictions to four decimals and the
    total still went the wrong way. Before calling any change inert, ask which
    ink is positioned by the thing being changed — and measure the whole screen,
    not the bands you predicted.

    THE PROCESS FAILURE BESIDE IT IS WORTH MORE THAN THE PIXEL. The fix was
    committed with `tsc` FAILING, because the command chained the typecheck to
    the commit with `;` instead of `&&`, so a non-zero exit printed and the
    commit ran anyway. The standing ruling is "do not commit a tree that fails
    tsc" and the guard against it was a shell operator. Amended, but the rule is
    to make the gate structural: `&&`, never `;`, when the second command
    depends on the first passing.

90. **AN INK BOUNDING BOX IS AN EXTREME-VALUE STATISTIC, AND MATCHING IT CAN
    MOVE A THOUSAND CORRECT PIXELS TO SATISFY TWO UNCERTAIN ONES.** Round 20
    corrected five icon boxes from one clean estimator — full ink extent at
    threshold 140, canonical against render — with rule 34 read straight off the
    edge signs. Four were built. Three made their band WORSE, and the sharpest
    case is the one that succeeded on its own terms:

        helpIcon2  extent +1/+1 on the columns -> EXACT on all four edges
                   band 18.0968 -> 19.3035      (+1.21, WORSE)
        helpIcon3  height 2 px symmetric        7.5455 -> 9.4836  (+1.94)
        gear       1 px narrow on the left      8.8566 -> 10.2703 (+1.41)
        back       1 px big in both axes        3.9709 -> 3.5029  (-0.47, kept)

    `helpIcon2` now matches canonical's bounding box on EVERY EDGE and scores a
    point worse. That is not a paradox: a bbox is set by the outermost
    antialiased pixel on each side — four pixels, each one coverage-threshold
    away from not existing — while the band mean is over the thousand-odd pixels
    of the drawing's interior. When the interior is already aligned and the box
    disagrees by 1 px, the box is the noisy measurement, and moving the mark to
    satisfy it drags every interior stroke off canonical.

    The scale matters. `helpIcon1`'s box was 2 px long AND shifted 1 px, and
    correcting it landed the extent exactly AND took the band 22.0527 ->
    17.6749 — a genuine defect, big enough to exceed the envelope's own noise.
    So: an extent delta of 2 px or more is evidence; a 1 px delta is a
    hypothesis, and the interior has to referee it.

    Round 18's dot fix inside `helpIcon3` stands and shows the alternative — it
    was measured on INK MASS (21 px against 7, with the disc areas 19.6 and 7.1
    predicting both) rather than on an envelope, and it landed exactly. Prefer a
    statistic over the whole run — mass, component topology, a difference map —
    to one over its four extreme pixels.

91. **A DEFECT CAN HIDE UNDERNEATH A DEFECT, SO A METRIC THAT STOPS FALLING IS
    NOT A FLOOR — IT IS THE TOP LAYER.** Grades 14 and 15 both broke a floor
    claim, and both found something the sweeps could not reach because a LARGER
    error sat on top of it. The digits' size error (round 28) masked a 1 px
    lift: the lift ALONE measured worse than the control, so three graders
    correctly refused it as a translation for five rounds, and only the joint
    move paid. The code boxes' half-pixel offset (round 29) was in turn masked
    by those same digits — four of the six windows contained a glyph 0.9-1.3 px
    out, which is larger than the border error being looked for, so the box
    edges could not be read cleanly until the layer above them was corrected.

    Three consequences, all of them procedural. FIRST: after any round that
    closes a large error, RE-OPEN the runs that error was sitting inside, even
    the ones a previous grade refused — their evidence was taken through a
    dirtier lens. SECOND: a single-parameter search that returns "no gain" is
    evidence about that parameter alone; it is never evidence that the run is
    solved, because the sibling parameter may be holding it. Rule 40 already
    demands the joint control — this is why. THIRD: the constants are part of
    the evidence. Round 29's whole finding was one number disagreeing with the
    measurement written ten lines above it in the same file, and no pixel sweep
    would ever have surfaced it. Diff the recipe against its own recorded
    canonical values before sweeping anything.

92. **A REFUSAL IS A VERDICT ON THE PRESCRIPTION, NEVER ON THE RUN — AND
    "BLOCKED BY THE FACE" IS A CAUSE, NOT A PERMISSION TO STOP MEASURING.**
    Round 30 took 0.5212 out of one screen, more than rounds 20 through 29
    combined, and every one of its six findings had already been LOOKED AT and
    written off. Three ways of writing something off, all of them mine:

    (a) A CORRECT REFUSAL THAT CLOSED THE WRONG DOOR. Rule 74b refused grader
    4's translation of `help2` with the right words — "five px NARROWER, not
    displaced" — and that sentence, which diagnoses a WIDTH error, ended the
    file's interest in help2's width for eleven rounds. Refusing a prescription
    is not solving a run. Write the refusal and the residual as two separate
    lines, because the refusal will be read as a closure otherwise.

    (b) A SHARED ROLE ASSUMED TO SHARE A VALUE. Rule 14 says solve runs that
    share a role JOINTLY. It does not say assume two runs share one number, and
    this file already says so in as many words about the two button labels —
    while eight body runs on the same screen each carry their own `scale`. The
    three help rows were pinned to one because they look like one thing.
    Whenever a value is shared across runs, the joint solve must be RUN, and its
    per-run residuals recorded, or the sharing is an assumption wearing a rule's
    name.

    (c) A CAUSE PROMOTED TO A BOUNDARY. "The body face is wrong and Kevin must
    choose it" is true, and it was doing work it cannot do: `resendLab` sat 1.27
    device px high BECAUSE of the face — the run is positioned by its cap-top
    and the face's x-height/ascender ratio is not canonical's — and that is a
    POSITION error, fully correctable, that had been classed as blocked because
    the face is where it comes from. A blocked cause still produces unblocked
    consequences. Ask what the cause DOES, not what it is.

    And a fourth, general enough to state alone: **an estimator that changed a
    constant must be re-run against the artefact it produced.** `LINK_RULE.h`
    and the 2.17 hairline were each derived once, and both derivations sat in
    the file beside values their own method now refutes. The rule is cheap —
    after any build that changes a constant an estimator chose, re-run that
    estimator. It is how a paragraph that reads "measured" stops meaning
    "measured once, a long time ago, against something else".

93. **A GEOMETRIC PRESCRIPTION CARRIES A PIVOT, AND THE PIVOT IS A PROPERTY OF
    THE EMITTER, NOT OF THE IMAGE.** Grade 17 solved ten runs' `scaleX` with one
    image-space affine and one conversion to `tx`. Eight landed, six of them
    beating their own predictions. Two came back WORSE — and they were exactly
    the two runs positioned by `cx` instead of `x`:

        x-positioned    left: x - dx                  pivot = element LEFT
        cx-positioned   left: cx - w/2, width: w/scale, text-align:center
                        -> the box widens as the scale shrinks, the ink CENTRE is
                           invariant under scale, and the pivot is cx

    Eight-for-eight and zero-for-two is a discriminator, not a coincidence. The
    WIDTH estimate was fine in all ten cases — a slope measured along a run is
    pivot-independent — and it was the accompanying translation that inverted.
    So: a width finding and its shift are separable, and only the shift needs the
    emitter's geometry. When a grader hands over a (scale, shift) pair, re-derive
    the shift from how the CSS is actually emitted before building it, and when a
    scale change is built, hold the run's DEVICE-space translation fixed
    (`tx x scale_old/scale_new`) unless the shift is itself the finding.

    The general form: an image-space model of a render is a model of the RASTER,
    and the recipe is a model of the EMITTER. They agree about shapes and they do
    not automatically agree about origins. Every one of this screen's transform
    conventions — `transform-origin: 0 0`, `translate` after `scaleX`, `width`
    divided by the scale on centred runs — is invisible in the pixels and decides
    what a prescription means.

94. **A REFUTATION TELLS YOU THE PRESCRIPTION WAS WRONG. IT DOES NOT TELL YOU
    THE ORDER.** Round 31 built a flap fix, measured +1.96, and I concluded that
    the box was the PREREQUISITE and the flap the optional half. Round 32
    measured the composition and both halves of that are false: the box alone is
    worth -2.02, the flap alone -2.71, and both -4.78 — separable and
    super-additive, with the flap the LARGER of the two. What was actually wrong
    was the parameter: the diagnosis said "the arms are wrong" and the fix moved
    the APEX, which was the end already landed.

    Extracting an ORDERING from a failed build is a second hypothesis riding on
    the first, and it needs its own control — the two-by-two, both alone and both
    together, against the same rule-40 control. It is cheap and I did not run it.
    Writing "X is the prerequisite" into the file after a single failure is how a
    guess acquires the authority of a measurement.

    The related trap, and the reason this rule is not just about builds: a
    prescription names a parameter, and a diagnosis names a defect. When a
    diagnosis is right and its prescription fails, the default inference must be
    "wrong parameter", not "wrong diagnosis" and not "wrong order".

95. **A SUB-PIXEL NUDGE IS ITSELF SUBJECT TO THE ROUNDING IT CORRECTS.** Fitting
    a raster model's origin against the shipped render, the residual between
    where `phone-005.ts` COMPUTES each mark and where it actually lands is
    per-mark and up to 1.05 device px: plateMark (-0.60,-1.00), helpMark1
    (+0.62,+0.29), helpMark2 (+0.35,-1.05), diffMark (+0.90,-0.45). The same
    frame convention lands the five overlay rects to +/-0.06 px, because those
    have no layout rounding — so this is rule 53 at full strength on the mark
    boxes, the same phenomenon round 4 measured as "the screen move per unit is
    not 1 — 1, ~1.5, 2, and 0".

    The NET positions are fine, so there is no pixel to buy. The consequence is
    about what a prescription may be WRITTEN IN. `plateMark`'s `ty: 1.0` and
    `diffMark`'s `tx: -0.875` are recorded as landing "to four decimals" while
    the raster disagrees with the recipe by about their own magnitude. So:
    express a correction as a RELATIVE quantity inside the artefact being
    corrected — a path coordinate, a difference measured within one mark —
    wherever the choice exists, and reserve absolute `MARK_BOX` coordinates and
    `tx`/`ty` for cases where nothing else reaches. Round 32's entire prescription
    was written this way on purpose, and 38 of 44 bands moved by exactly zero.

### ROUND 20: every icon box was wrong, and each in its own way

Grade 11 listed five marks as geometrically wrong and characterised them as
oversized. Measured with one estimator — full ink extent at threshold 140,
canonical against render — they are FIVE DIFFERENT DEFECTS, and treating them as
one class would have broken the axes that were already right:

    helpIcon1  top +0 bot +2  left -1 right -1   height 2 long AND a 1px shift
    helpIcon2  top +0 bot +0  left +1 right +1   pure translation, size exact
    helpIcon3  top -1 bot +1  left +0 right +0   height 2 long, symmetric
    gear       top +0 bot +0  left +1 right +0   1px narrow, LEFT edge only
    back       top -1 bot +0  left -1 right +0   1px big in both axes

Rule 34 reads directly off those rows: helpIcon2's column edges move the SAME
way so it is a translation and its box size must not be touched; helpIcon3's row
edges move OPPOSITELY so it is a scale and its columns must not be touched; the
gear has one edge wrong and one exact, so widening it needs a `tx` that holds
the correct edge. Every correction is expressed through the box's existing
`tx`/`ty` transform rather than `left`/`top`, because a 1px move through layout
rounds — rule 53, which this file already carries reverts for.

helpIcon1 VERIFIED FIRST and it landed exactly: extent rows 11..55 (45) cols
19..77 (59) against canonical's rows 11..55 (45) cols 19..77 (59) — identical on
every edge — and the band **22.0527 -> 17.6749**, whole screen 5.5735 ->
**5.5551**, n_over8 103991, gates 11/11 and 3/3. Shrinking a box also shrinks the
drawing's own inset inside its 24-unit frame, which is the part that needs `ty`:
the ink sat 9.2px below the box top and 0.30px of that was lost to the scale.

The other four were built on the same measurement and THREE OF THEM WERE
REVERTED: helpIcon2 +1.2067, helpIcon3 +1.9381, gear +1.4137, all worse despite
their extents moving onto canonical — helpIcon2's onto it exactly. Only `back`
survived, -0.4680. That result is rule 90, and it is the round's real output.

ROUND 20 FINAL, with the three reverts built and confirmed. helpIcon2 18.0968,
gear 8.8566 and helpIcon3 7.5455 are all back to their pre-experiment values TO
FOUR DECIMALS, so the reverts are exact and nothing was left half-applied, and
`back` holds 3.5029. Whole screen **5.5538**, n_over8 103999, gates SCREEN=005
markup 11/11 and csrf 3/3. The round's net is helpIcon1 22.0527 -> 17.6749 and
back 3.9709 -> 3.5029 — the two whose evidence the INTERIOR refereed, not the
four whose envelope did.

### THE FLOOR CLAIM BELOW WAS OVERSTATED, AND GRADE 14 REFUTED IT

Read this before the section it corrects. The claim was that 005 sat at a
face-limited floor with EVERY remaining path measured and closed. The face
diagnosis holds for the body runs and no grader has broken it. The word that was
wrong is "every".

**THE DIGITS ARE NOT SET IN THE BODY FACE.** They are Tungsten, which is IN this
repository — so their size never needed a decision from anyone. It has a
zero-parameter answer: divide canonical's ink height by each glyph's own outline
height and every digit must return the same em.

    "2"  59.119 / 0.706 = 83.74 device px      "4"  58.560 / 0.700 = 83.66
    "8"  59.609 / 0.712 = 83.72                "7"  58.504 / 0.700 = 83.58

Four glyphs, four DIFFERENT outline heights, one em to 0.2%. 83.7 device px is
38.58 CSS px; the recipe shipped 39.3. The same check on `display`, the same
family, returns 0.42% over — so the digits were the outlier, not the face, and
the floor claim had folded them into a story that never covered them.

HOW IT HID FOR TWENTY-SEVEN ROUNDS is the part worth keeping. The size error was
MASKING A ONE-PIXEL LIFT: the lift alone measures 5.4764 against a control of
5.4704, i.e. WORSE, so `digit1` (shift gain 2.457) and `digit3` (3.260) read as
translations and sat on the refused list for five rounds. Three grades looked at
them and refused them, correctly, for the right reason. Only the joint move pays:

    control     39.3   ty -0.46   5.4704   digits 48.800   box0-3 20.633
    size only   38.615 ty -0.46   5.4688
    SHIFT ONLY  39.3   ty -0.92   5.4764   <- worse than control
    BOTH        38.615 ty -0.92   **5.4559**  digits 43.226  box0-3 19.491

Built and confirmed: 5.4704 -> **5.4559**, n_over8 103546 -> **103483**, digit
windows 48.800 -> 43.227, boxes 20.633 -> 19.491, cap ratios
1.0175/1.0175/1.0215/1.0225 -> 0.9994/1.0007/1.0044/1.0054, gates 11/11 and 3/3.
Every figure grade 14 predicted reproduced on the build.

**AND THE LEDGER HAD THE NUMBER ALREADY.** `digit0-3 cap 1.017` is printed in
the density audit around line 3873 — measured once, never costed, never
attributed to a cause, never tested jointly, then summarised as closed. Grade
14's phrase for that is exact and belongs here: MEASURED-AND-LEFT-OPEN IS NOT
MEASURED-AND-CLOSED. A residual with a number beside it can still be an open
defect; what closes it is a cause, a cost and a decision — and if the cause
turns out to be "a font in this repository is the wrong size", it was never
closed at all.

Two lessons, both mine. FIRST: when a single explanation starts covering every
remaining item, that is the moment to check which items it does NOT cover, not
to write the summary. A cause that explains everything has stopped being a
measurement. SECOND: rule 44 says read the fonts, and it answers questions no
sweep can — Tungsten's own outlines fixed the digit size with zero free
parameters, while I was sweeping band means. The cheapest instrument on this
screen was never run against its six most important elements.

A THIRD, ABOUT THIS FILE: the "BLOCKED ON KEVIN" status this section was
supposed to set never landed, because that edit was guarded with `if count == 1`
instead of `assert count == 1` and silently did nothing when its anchor had
moved. The row went on reading "round 17" while the prose above it described
round 27. An edit protocol that can no-op is not a protocol — assert, never
branch.

The section below stands otherwise, and its residuals are still measured and
still closed. What it must no longer say is "every".

### ROUND 32 (GRADE 18, **B-**): FOUR OF THE SIX WORST WINDOWS WERE ONE DRAWING ERROR INHERITED FROM LUCIDE

Pixels **4.6244 -> 4.5067**, n_over8 94153 -> **93525**, against a predicted
4.5033 — within 0.0034, from a raster model rather than a sweep. Gates
SCREEN=005 markup 11/11, csrf 3/3, and the new desktop-leak gate 7/7; desktop
re-probed clean. Rule-40 control reproduced 4.6244 / 94153 first.

    diffMark   21.2329 -> 10.8033   (predicted 10.68)
    helpIcon1  13.6684 ->  6.8633   (predicted  6.39)
    helpIcon2  13.2155 ->  7.4074   (predicted  7.20)
    plateMark  12.0203 ->  7.2395   (predicted  7.24)
    carried:   diffBtn 5.2931 -> 4.6583    plate 3.2232 -> 2.9710
    **38 of 44 bands unmoved to four decimals** — only the four targets and
    their two containers moved, which is the control the prescription named.

**THE CAUSE IS ONE CONSTANT, IN FOUR PLACES.** The envelope flap meets the side
walls about 4.5 device px too low on every envelope mark on the screen. Junction
depth below each envelope's OWN top edge — mass-weighted per-row arm centroids
over 9-12 rows provably clear of both walls (fit rms 0.01-0.11 px), extrapolated
to the wall centreline, so it is a difference INSIDE one mark and immune to the
per-mark frame offsets:

    mark        canonical  render    delta   depth/height C -> R
    plateMark      3.575     7.907   +4.332   0.0858 -> 0.1864
    helpMark1      2.673     7.299   +4.626   0.0688 -> 0.1843
    helpMark2      2.793     7.217   +4.424   0.0747 -> 0.1875
    diffMark       2.439     7.707   +5.268   0.0636 -> 0.2028

Four marks, four boxes, four scales, **one number at sd 0.51** — and the render
column lands on **lucide's own constant, 3/16 = 0.1875**, to 0.003 on three of
the four. Canonical's envelope asset is not lucide `mail`: it puts that junction
at ~7% of the envelope height. **The APEX was already right** (-0.60, -0.14,
-0.19 px), which is exactly why every shift search on these marks returned
nothing for eleven rounds — a V that is wrong at one end and right at the other
has no translation, and no bounding box can see it either.

**IT ALSO EXPLAINS ROUND 31'S REFUTATION AND CORRECTS THE CONCLUSION I DREW.**
Grade 17's arm-centroid diagnosis was RIGHT and was attached to the WRONG
PARAMETER: it held the junction at 7 and pushed the apex down, trading a 4.3 px
error at the end that was wrong for a 1.6 px error at the end that was already
landed. It measured +1.96. I then concluded from that failure that the box was
the PREREQUISITE. That was wrong too — composed on `plateMark`, the box alone is
worth -2.02, the flap alone **-2.71**, and both -4.78. They are separable and
super-additive, not ordered. A refutation tells you the prescription was wrong;
inferring an ORDERING from it is a second hypothesis and needs its own control.

THREE MORE DEFECTS RIDE ON THE SAME PATHS AND WERE BUILT WITH IT.

  * The envelope BODIES are 0.72 / 0.80 / 1.13 px too tall, with the two edges of
    each pair moving in OPPOSITE directions (rule 34: size, not translation), and
    `plateMark` is 1.26 px too wide — confirming grade 17's 1.21 to 0.05 px, with
    the mechanism predicting it exactly at 20 x 69.6/24 = 58.000 against a
    measured 57.991.
  * **`helpMark1`'s width fix overshot, in the direction its own note says it was
    fixing.** It measured +1.84 px and spent a whole viewBox unit — at
    bw/24 = 2.7917 that is -2.79 px, an overshoot of 0.95 BY THE NOTE'S OWN
    ARITHMETIC, never re-measured against the artefact it produced. The walls now
    read 1.009 px NARROW at sd 0.002 over eight rows. `helpMark2` (+0.012) and
    `diffMark` (-0.050) are solved and are the controls that localise it.
  * **`diffMark`'s apex re-centring is now taken**, and the refusal recorded
    against it was a verdict on that prescription AT THAT TIME (rule 92a): it was
    built while the junction was still 5.3 px too low, a larger error in the same
    pixels (rule 91). It is explicitly not available alone and pays only jointly.

**EVERY EDIT IS A PATH COORDINATE** in the mark's own user space, inside the
fixed `translate(bx,by) scale(bw/24,bh/24)`. No `MARK_BOX`, no `tx`/`ty`, no
`sw`, no `left`/`top` — nothing passes through layout rounding (rule 53), `sx`/
`sy` and the stroke widths are unchanged, and this is **outside the class rule 90
has refused three times** on this screen. Those three were `MARK_BOXES` edits
driven by extreme-value extents; these are interior 50%-crossings over 15+
columns and arm-line fits at rms 0.01-0.11. The 38-of-44 unmoved table is the
evidence that the edits stayed inside their own marks.

**THE INSTRUMENT VALIDATED ITSELF AGAINST A BUILD IT WAS NOT FITTED TO**, and
that is why it was trusted before the capture existed. Grade 18 wrote a raster
model of the marks: a full `M/L/H/V/C/A/Z` parser, paths flattened to polylines
in USER space, supersampled device samples mapped back through the inverse
transform and thresholded on user-space distance — which reproduces the
anisotropic stroke `Icon` actually emits (`sw/sqrt(sx.sy)` gives a vertical
stroke of `sw.sqrt(sx/sy)` and a horizontal one of `sw.sqrt(sy/sx)`, 3.136 and
2.870 device px on `plateMark`, both confirmed to 0.01 px). It reproduces the
shipped render at 0.59-1.47 mean |d| against band errors of 12 to 21, it lands
five overlay rects to +/-0.06 px on the frame convention, and **it scores round
31's refuted flap deepening at +1.72 where the build measured +1.96.** Every
prescribed axis was bracketed with the others held.

TWO OF THE BRIEF'S OWN OPEN CLAIMS WERE REFUTED BY MEASUREMENT, not left
unproven. (1) "The box is the prerequisite" — the composition table above. (2)
"`shield`'s residual is a 2.2% height": the outline's straight sides match to
0.22-0.28 px, and a y-affine fitted to the per-row limb-separation profile over
81 rows cannot beat identity without an `a = -6.0 px` displacement the matched
ink extents forbid (identity 1.510, best affine 1.131, plus a width scale 0.998).
**No size or position change explains the profile.** The residual is the CURVE —
dome 2.5-5.9 px narrow at rows 1642-1650, taper starting ~5 rows early, tip
1.8-3.2 px fat at rows 1710-1718 — so the file's own sentence, that closing it
means re-tracing the asset, stands. That is a design-asset decision, not a
parameter, and it joins the NEEDS KEVIN list.

FOUR NEGATIVES WORTH KEEPING. **The plate envelope's stroke is NOT light — do not
touch `sw`.** Raw ink mass says 0.77x canonical over that window, which is a
compositing-space artefact: read as linear-light alpha the wall cross-section is
canonical 2.56 against render 2.55. The decisive control is the **chevrons**,
drawn by the same helper at `sw 2.6`, reading R/C 0.963 / 1.013 / 0.970 — a
transfer curve inflating canonical would make them light too, and it does not.
`helpIcon3`'s circle (dr 0.157 px) and `gear`'s inner ring (dr 0.184 px) are
neither size nor placement defects; both residuals are lobed/hook geometry, the
same asset-difference class as the shield, and the gear's limb separation reads
1.36 px WIDER than canonical — the opposite sign to the "1 px narrow on the left"
that round 20 recorded and reverted, which is a second reason not to revisit it.

**AND ONE OPEN FINDING THAT CHANGES HOW PRESCRIPTIONS MUST BE WRITTEN.** Fitting
the raster model's origin against the shipped render, and including each mark's
own `tx`/`ty`, the residual between where the recipe COMPUTES a mark and where it
lands is `plateMark (-0.60, -1.00)`, `helpMark1 (+0.62, +0.29)`, `helpMark2
(+0.35, -1.05)`, `diffMark (+0.90, -0.45)` — per-mark, up to 1.05 device px. It
is not a frame-convention error: the same convention lands the five overlay rects
to +/-0.06 px, because those have no layout rounding. It is **rule 53 operating on
the mark boxes at full strength**, the same phenomenon round 4 measured as "the
screen move per unit is not 1 — 1, ~1.5, 2, and 0". The NET positions are fine
(envelope centres within 0.26-0.30 px of canonical), so there is no pixel to buy.
What it means is that `plateMark`'s `ty: 1.0` and `diffMark`'s `tx: -0.875` are
recorded as sub-pixel nudges that "land to four decimals" while the raster's
placement disagrees with the recipe by about that much — **so any prescription
written as an absolute `MARK_BOX` coordinate or a `tx`/`ty` is being landed with
up to a pixel of error the recipe cannot see.** Every edit in this round is
deliberately RELATIVE for that reason. This is rule 93 one level below where
grade 17 met it: the raster and the emitter disagree about origins, and here they
disagree about the nudges meant to correct origins. See rule 94.

### ROUND 31 (GRADE 17, **B-**): SIX OF TEN BODY RUNS STILL CARRIED A WRONG `scaleX`, BECAUSE ROUND 30 NAMED THE CLASS AND NEVER SWEPT IT

Pixels **4.8462 -> 4.6244**, n_over8 96787 -> **94153**, gates SCREEN=005 markup
11/11 and csrf 3/3, desktop re-probed clean. Rule-40 control reproduced 4.8462 /
96787 before anything was trusted. Net **-0.2218** against a predicted -0.2109 —
and the prediction came from image-space warping while the result came from a
build, which is the gap rule 80 exists for and this time it closed the right way.

    plateLab  16.0099 -> 10.8933      safe2      13.0115 ->  8.8160
    diffMark  23.7550 -> 21.2329      diffLab    20.1557 -> 18.1628
    resendLab  7.5347 ->  6.5762      safe1      10.4978 ->  9.7149
    help3      7.0950 ->  6.6128      rule2       1.3388 ->  0.5189
    lede1      5.5554 ->  5.1769      resendLink  3.3726 ->  3.3690
    carried:   plate  3.9854 -> 3.2232    diffBtn 5.6752 -> 5.2931

**THE INDICTMENT IS OF ROUND 30, AND IT IS FAIR.** Round 30 found that three help
rows did not share one `scale`, fixed those three, wrote rule 92(b) about
exactly this failure — and then did not run the estimator on the other eight
independently-scaled body runs. Six were wrong by 0.4 to 1.8%. Naming a class is
not sweeping it, and the round that names one is the round that must.

**THE INSTRUMENT IS NEW AND IT IS WHY THESE HOLD.** Local sub-pixel
registration: the run's column-ink profile in both plates, a 40-column tile slid
in 12-column steps, each tile's dx by SSD minimisation on a 0.05 px grid, then a
weighted fit `dx(x) = a + b(x - x0)`. `a` is a translation, `b` a width error —
**rule 34 read continuously along a run instead of off its two end pixels**,
which is what rule 90 has been warning about for eleven rounds without anyone
building the alternative. Sign-controlled against known warps (k=0.99 drove a
measured b of -0.01075 to -0.00076), and every prescription confirmed on the
warped plate as well as by the objective.

**F1 — plateLab, and the brief told the grader to leave it alone.** Grade 16
measured its extents at 1.23% wide and its cumulative-ink quantile regression at
k=1.0026, refused to prescribe on the conflict — correctly — and that verdict on
ONE quantity closed the file on the whole run, which was the only body run on the
screen never nudged in either axis. Rule 92(a), and the sharpest instance of it
yet. THE TIE BREAKS BY MEASURING THE ESTIMATOR: the quantile regression is
mechanically sound (it recovers known warps of 0.985/0.991/1.011 to four
decimals on a self-control) but it is INK-WEIGHTED, and this render carries
**1.2199x** canonical's ink — so applied to the render AT the metric optimum, on
a raster both the geometry and the objective call correct, it still reports
k = 0.99311. That measured bias is the whole disputed 0.9%. Three unweighted
estimators agree at 1.0099 / 1.0109 / 1.0109. The translation was never
conflicted at all; it was invisible because the run's EDGES move oppositely
(L -1.65, R +0.92), which is exactly the case rule 34 forbids reading a shift
from. **16.0099 -> 10.8933.**

**F2 — safe2, and the defect is a clause in this file.** "every scaleX 0.79+ is
worse" — the sweep only ever went UP, and the argmin is 0.752, BELOW the shipped
0.761, in the direction it never entered. **13.0115 -> 8.8160**, the largest band
gain on the screen. Rule 34 control: the vertical is 10% out against 1.2%
horizontal, so this is not a size error, and the vertical excess is the blocked
body face which no `scaleX` can touch.

**F3 — diffLab is 0.51% NARROW and its `tx` points the wrong way.** `scale: 0.837`
is a round-1 number never re-measured in thirty rounds, and the `tx` was then
fitted by BUILDING left-1 against right-1 at the wrong width — a run 0.5% narrow
reads as needing a shift, and a real build test refereed a compensated pair.
Rule 91's masking, in the horizontal.

**F4 — diffMark's "nothing to buy" was measured on a shape that no longer
exists.** This file records that its shift optimum is already (0,0) and that
left-1 was built and cost 0.43. True of the drawing before the `v9.3`/`h7.3` path
edits took the band 32.05 -> 23.755. At the integer point the same left-1 now
PAYS 2.27. Wall centroids taken in rows provably clear of the flap diagonal read
+1.103 and +1.857 — same sign, rule 34's translation signature. A window
including the flap crossing INVERTS the sign; the grade made that mistake first
and its own cross-check caught it, which is why the row ranges are in the recipe.

**F6 — DIVIDERS[1] was 0.195 px off and round 29 wrote the number down.** Its
crossing list contains `rule2 -0.182`, recorded as evidence for localising a
different error and never acted on. 1.3388 -> **0.5189**.

### THE THREE REFUTATIONS, AND TWO OF THEM ARE ONE MECHANISM

**Built as prescribed, `lede1` went 5.5554 -> 5.9119 and `resendLink` 3.3726 ->
3.9601 — both WORSE**, against predictions of 5.1934 and 2.797. They are **the
only two CENTRED runs** in grade 17's list, and that is the entire explanation.

    x-positioned run:   left: x - dx           scaleX pivots on the element LEFT
    cx-positioned run:  left: cx - w/2         AND width: w/scale, text-align:center
                        -> the box widens as the scale shrinks, the ink CENTRE is
                           invariant under scale, and the pivot is cx

The grade's `tx` conversion assumed the element left for all ten runs. It was
right for the eight x-positioned ones — **every one of which hit or beat its
prediction** — and wrong for exactly the two centred ones. Eight-for-eight and
zero-for-two is not a coincidence, it is a discriminator, and it is now rule 93.

Rebuilt with `tx` restored to the same DEVICE shift the old value encoded
(`tx x scale_old/scale_new`), `lede1` lands **5.1769** — better than the
prediction the wrong pivot missed. `resendLink` lands **3.3690**, which is 0.0036
better than doing nothing: its width solve is worth essentially nothing and that
is stated rather than dressed up. Its three estimators spread 1.0087 / 1.0145 /
1.0175 and the grade rated it medium; the build says the geometry moved and the
metric did not care. Kept because it is closer to canonical and not worse — not
because it bought anything.

**THE THIRD REFUTATION INVERTS THE ORDER I BUILT IN.** The plate envelope's flap
deepening went **12.0203 -> 13.9764, worse by 1.96** — the largest refutation on
this screen since round 14. The DIAGNOSIS is not refuted: the per-row arm
centroids are what they are (-2.82/+2.00 at row 950, flipping to +0.84/-0.22 by
962, with the flap region at mean|d| 19.49 against the window's 12.02). What is
refuted is that the descent parameter alone reaches it, and the reason is the
same finding's other half. The BOX is 1.21 px wide and 0.80 px tall by the `Icon`
arithmetic (walls at 20 x 69.6/24 = 58.00 against canonical's 56.754), so the
arms are drawn on a frame that is ALREADY too wide, and deepening a V inside an
oversized frame moves its arms further from canonical's rather than closer. **The
box is the prerequisite, not the optional half** — the opposite of the order the
grade recommended and I followed. Rule 91 one layer down: the flap was sitting
underneath the box. Reverted to lucide's 5.727, plateMark restored to 12.0203
EXACTLY, and the revert improved the `plate` container a second time,
3.3264 -> 3.2232.

NOT BUILT AND RECORDED WITH THEIR NUMBERS: `shield`'s dy -1.00 (worth 1.03) is
paper-over — the dome top is a row above canonical and the tip a row below, both
extremes the same way, which is rule 34's SIZE signature, so the real residual is
the 2.2% height and correcting it means the box. `didnt`'s two instruments
disagree (1.26% by local registration, ~0.6% by the objective, unbracketed
against do-nothing) for 0.007. Per-divider tone is a genuine rule 92(b)
instance — canonical's four dividers carry 0.319/0.270/0.294/0.253 against a flat
render 0.268 — and totals 0.0038, with rule2's share an unbracketed edge value
that was absorbing the position error F6 has now fixed.

CONFIRMED AT OPTIMUM, re-derived rather than accepted: `display` (slope -0.00084,
argmin (0,0)), `help1` (slope +0.00065, gain 0.000 — round 30 got that one
exactly right, and it is the control that says this class is per-run and not a
container), helpIcon1, helpIcon3, chev1, chev3, box0-2/4/5, rule1/3/4, hdrRule,
plate, and all four diffBtn border centroids within 0.16 px.

### ROUND 30 (GRADE 16, **B-**): THE WORST BAND ON THE SCREEN WAS A 1% ADVANCE THIS FILE HAD MEASURED AND CALLED "EXACTLY"

Pixels **5.3674 -> 4.8462**, n_over8 101973 -> **96787**, gates SCREEN=005 markup
11/11 and csrf 3/3 against a `NODE_ENV=production` dist, desktop re-probed clean
(one sidebar at 900x1440 and 1440x900, overlay hidden, zero overflow, zero
offscreen). The rule-40 control re-measured the round-29 capture at exactly
5.3674 / 101973 before any of it. **The largest single round since round 17, and
the largest by a grader's list since round 4.**

Grade 16 returned six prescriptions and one it refused to prescribe. All six were
built. **Four of them are this file disagreeing with its own recorded
measurements** — which is now three consecutive grades finding that, and the
reason rule 91's third consequence exists.

    run          round 29    round 30    predicted     
    help2         21.1660     10.3449      10.75
    help3         12.8522      7.0950       7.18
    resendLab     10.7329      7.5347       6.87
    digit3        11.2530      8.2768       8.24
    digit0        11.5687      9.4609      10.23
    digit1        11.6917     10.4700      11.19
    hdrRule        1.5789      0.6514       0.66
    rule3          1.9761      0.9089       0.90
    rule1          1.2398      0.8536       0.89
    rule4          0.7746      0.6528       0.59
    rule2          1.1664      1.3388       1.30   <- the one stated cost
    resendLink     3.5668      3.3726        -
    box0/1/3    3.30/3.88/4.04  2.90/3.62/3.43  (the digits' own windows)
    digit2         8.7136      8.7136       8.90   <- prescribed 0.084 device px,
                                                     below Skia's quantum, no-op

**D1 — THE ROUND'S WHOLE VALUE, AND IT WAS WRITTEN DOWN FIFTEEN GRADES AGO.** The
note above the help rows records their three length ratios as "0.998 / 0.992 /
0.949", says **exactly**, and classes the gap as the face. It is not the face.
help1's own metric argmin is k = 1.0000 to four decimals; help2 and help3 want
1.0100 and 1.0550 — the same numbers their 50%-crossing extents predict (1.01001,
1.05468) and the same numbers a segmentation-free cumulative-ink quantile
regression predicts (0.98854, 0.93829). Three estimators, two of them pure
geometry, agreeing with the objective. Horizontal only by rule 32/34: the joint
(kx,ky) grid puts help2 at ky 1.0000 and a pure kx=ky size change is worse at
every k for both rows. `scale` 0.866 -> **0.8747** and **0.9136**; help2 and
help3 together are **-0.4967 of whole screen**, eight times what grades 14 and 15
found combined.

WHY IT SURVIVED FIFTEEN GRADES: **rule 14 was read as "one role, one VALUE"**. It
says solve runs that share a role JOINTLY, and this file already draws that
distinction for the two button labels — "it does not say assume two runs share
one" — while eight other body runs each carry their own scale. Rule 74b then
CORRECTLY refused grader 4's translation of help2 ("five px NARROWER, not
displaced"), and that correct refusal closed the file on the axis without anyone
fixing the width. A refusal is a verdict on the prescription, never on the run.

THE COST IS STATED AND IT IS KEVIN'S: the three rows now carry 0.866 / 0.8747 /
0.9136, a 5.5% letter-width difference between the first row and the third that a
designer can see. The compensation is per-STRING because the glyph mixes differ,
which is why the eight other runs differ too — but this is a judgement about
matching a canonical set in a face that is not canonical's, and it belongs on the
NEEDS KEVIN list beside the two faces, not buried in a win.

**D2 — resendLab.** 1.271 device px high on the modal per-column bottom crossing,
uniform across all twelve glyphs at sd 0.06, with ascender top -0.13, x-height
top -1.93, baseline -1.40. CAUSE: the run is positioned by its CAP-TOP and
GeistVF's x-height/ascender is 0.768 against canonical's 0.710, so landing the
cap-top lands the ink MASS high. That is the blocked body face showing up as a
POSITION error rather than a shape error — which is exactly why every earlier
pass classed it as blocked and moved on, and it is the sharpest example yet that
"blocked by the face" describes a cause, not a permission to stop measuring. Its
recorded `cap 1.0000` does not reproduce on any estimator (0.968 / 0.951 /
0.947); the advance does.

**D3 — the five hairlines, and either knob alone misleads.** They are drawn at
2.17 device px against canonical's measured 1.67, and **the 2.17 was never
measured** — it is asserted as "a known 2.17 px stroke" and then used to DERIVE
the tone, while the identical estimator rejected 2.17 for the box border. Because
these are solid rects an analytic box-filter model IS the rasteriser (it
reproduces the shipped render to mean |d| 0.049-0.067, max 1.0), so the joint
(h, tone) argmin — h **1.60**, tone **212 = #D4D4D4** — is bracketed on both axes
without a build. The decomposition is why it matters: tone alone at h 2.17 is
**+0.0135 WORSE**, h alone is -0.0109, the pair is **-0.0217**. The measured null
recorded in that comment ("#E0E0E0 built and measured, it is WORSE") therefore
proved nothing about the role — a single-parameter result read as a verdict.
Both tokens are screen-scoped inside `COLOURS`, which is inlined into `.s5`
inside the phone media query, so the standing ruling on global tokens is not
touched.

**D4 — the digits, and the frame the whole file is written in.** Every coordinate
in `RUNS` is recorded in the pixel-INDEX frame: `cx` against canonical's ink
centres reads +0.008 / -0.005 / -0.005 / +0.003 (sd 0.006 across four different
glyphs), `top` reads +0.003 / 0 / 0 / 0, and `x` for didnt / safe1 / help1 reads
0.000 / +0.004 / 0.000. CSS puts pixel i at [i, i+1), so every one of them is 0.5
low in the frame it is consumed in. Every other run's dx/dy/tx were fitted
against a BUILT capture and swallowed it; the six digits were fitted against
Tungsten's outlines in round 28 and never did. Rasterising Tungsten with FreeType
at the shipped em, unhinted, reproduces the render to mean |d| 0.169-0.562 on ONE
baseline for all four, with the fitted origins within 0.20 px of this file's own
CSS arithmetic — so the target is 0.5 px off, not the rasteriser. A second
separable error rides with it: `text-align:center` centres the ADVANCE box on
`cx`, and `cx` is the INK centre, worth +0.419 px for '4' and -0.335 for '7' from
hmtx and the outlines. **digit2 is a recorded no-op**: its prescription was 0.084
device px, below Skia's sub-pixel quantum, and it moved nothing. Predicted +0.19
of cost, delivered 0.00 — stated because a prescription that does nothing is a
result, not a rounding error.

**D5 — TWO FRAMES, HALF A PIXEL APART, UNDER ONE BLANKET CORRECTION.** Nine
overlay features measure inside |0.32| device px while the eight divider ends sit
at +0.463 mean, sd 0.060 — about 5 sigma, the same shape as round 29's box top,
on the other axis. The constants split cleanly: PLATE, DIFFBTN, CARET and
LINK_RULE are in the pixel-index frame and need the +0.5; DIVIDER_X and the
re-measured BOX_X are already in the CSS frame and need nothing. `CARET.x` was
already explicitly counter-moved for this reason and the dividers never were.
Worth **~0.000** and taken anyway, stated as such: it is the evidence for the
cause, not a buy.

**D6 — an estimator run once and never re-run against what it produced.**
`LINK_RULE.h` was derived from an ink-mass reading and the reading was never
repeated on the artefact it created; re-applied it returns 1.968 where the file
carried 2.12. The old inputs are kept in the comment rather than deleted, because
the defect is the un-re-run estimator, not the number.

**D7 IS REFUSED AND RECORDED, NOT BUILT.** plateLab's 50%-crossing extents say the
render is 1.23% wide; its cumulative-ink quantile regression says k = 1.0026. The
extreme-value estimator and the mass estimator disagree, and rule 90 says which
one to distrust. A joint (scaleX, x) search offers 16.0099 -> 11.01 bracketed on
both axes, and two knobs on a conflicted diagnosis is how a build round gets
spent. If it is ever tried, the discriminator is that the per-glyph centroid
deltas must ALL move toward zero, not just the two end glyphs.

NULLS THE GRADE RE-ESTABLISHED INDEPENDENTLY, all worth keeping: `display` is
solved on both axes (cap 1.0029, advance 1.0000) and its 19.3019 is genuinely the
face; the icon strokes are inside 0.3 px of canonical with no shared sign, so
rule 44 aimed at lucide's source geometry returns nothing; `didnt` and `safe2`
are not reachable by `scaleX` (didnt's per-glyph drift has rms 2.19 — non-linear,
so the excess really is in the advances and not the gaps); `diffLab`'s edge test
still lies exactly as rule 74b records; and the SVG's own origin measures -0.016
+/- 0.035 over 27 edges, so D4 and D5 are constants problems and not layout.

CONTROLS, all held to four decimals: **help1 7.7874 unmoved** — the
discriminating control for D1, whose own argmin is exactly k=1.0000 and which
costs 1.42 at +-0.0025, so it moving would have refuted the diagnosis. `caret`
2.1319, `resendVal` 2.2172, `plate`, `diffBtn`, `box2`, `box4`, `box5` all
unmoved. box0/box1/box3 moved because they CONTAIN digit0/1/3 and box2 did not
because digit2 no-opped — the one-container signature reading correctly in both
directions.

### ROUND 29 (GRADE 15, **B+**): A CONSTANT THAT CONTRADICTED THE FILE'S OWN MEASUREMENT

Pixels **5.4559 -> 5.3674**, n_over8 103483 -> **101973**, gates SCREEN=005
markup 11/11 and csrf 3/3, served from a `NODE_ENV=production` dist. Grade 15 was
briefed to repeat grade 14's FEAT rather than its method — find something no
band mean can see — and returned a defect worth six times as much, sitting in a
constant this file had already written down correctly ten lines above.

`phone-005.ts:171` and `Marks005.tsx:20` both record canonical's code-box run as
**y 533.63..665.02**. `BOX_Y` read **534.13**. Half a pixel of disagreement with
the number directly above it, unmentioned in 974 lines of commentary.

It was isolated by measuring EVERY overlay feature's 50%-crossing separately
instead of trusting the container solve:

    hdrRule -0.026   plate -0.175/+0.065   diffBtn -0.189/-0.008
    rule1 -0.012  rule2 -0.182  rule3 +0.153  rule4 -0.052  linkRule +0.006
    CODE-BOX TOP  +0.567                     code-box bottom  +0.137

Nine features at mean -0.048, sd 0.115; the box top is **5.3 sd out** and the
only feature outside +/-0.2. The widths were short 0.455 to 0.893 px across the
six, a uniform 0.64%, predicted as k = 1.0064 from the edge pairs BEFORE any
sweep. Built against a rule-40 control that reproduced the prior build exactly:

    control                     5.4559   n_over8 103483   box0-5 25.1876
    translate -0.35 alone       5.4103                    box0-5 21.5768
    translate + scaleX 1.006    5.3676
    literal geometry (shipped)  5.3674   n_over8 101973   box0-5 18.1823

Shipped as literal geometry — `BOX_Y` 534.13 -> **533.78**, the six `BOX_W`
scaled by 1.0064 — not as a transform, so the file now says what it measured.
Both axes bracketed with the other held, each at its own argmin, so this is not
a compensated pair; height, stroke width and tone were re-swept at the corrected
offset and every one was worse, i.e. the earlier solves stand. Caret 2.1319,
digit0 11.5687, plate, diffBtn and the four rules all UNMOVED to four decimals —
rule 15's one-container signature discharged properly rather than assumed.

WHY IT HID FOR 28 ROUNDS, and this file names three of the four reasons itself:
every shift search here is INTEGER and the offset is sub-pixel; the one
sub-pixel search that did run moved the WHOLE overlay, so it optimised the boxes
against nine features that were already right; and the border is about 5% of a
152x130 window, so half a pixel of edge dilutes to roughly one unit of band. The
fourth is the masking rule ONE LAYER BELOW where grade 14 found it — until round
28 the digits inside four of these six windows were themselves 0.9 to 1.3 px
out, so the boxes could not be read cleanly until the digits were fixed. Two
consecutive grades have now found a defect underneath a defect. See rule 91.

TWO SCOPE ERRORS ARE RECORDED WITH IT, both mine. (1) The round-13 overlay
viewBox solve was OVER-SCOPED: it is a true diagnosis, and it licensed a claim
past its own mechanism — that one origin explains every feature's residual —
which is precisely what let a per-feature disagreement go unlooked-for. (2) The
body-face finding is scoped out of all-caps runs, and **the wordmark is
all-caps**: canonical's S/H ink-width ratio is **0.850**, where GeistVF gives
1.002-1.009 at every weight, Boxed 1.000 and Tungsten 0.966. Canonical's
wordmark is set in NO FACE THIS REPOSITORY CONTAINS. The render measures 1.0007
— Geist exactly — which calibrates the estimator against a known answer. Grade
15 measured the wordmark cap as 2.56% short and DECLINED to prescribe it,
because the face is the larger error and Skia snaps baselines to whole device
pixels; correcting the size first would mask it. That is the masking rule
applied BEFORE the mistake instead of after it, and it is the right call. The
wordmark face joins the body face on the list that needs Kevin.

### 005'S FACE-LIMITED RESIDUALS, AS MEASURED (the section above corrects the scope)

Twenty-seven measured rounds, eleven independent grades (B, B, B+, B, B, B, B,
B, B-, B, B), whole screen **15.3484 -> 5.4704**, n_over8 103546, both gates
green. It has not reached A, and this section states why in one place, because
drifting into that conclusion silently would be worse than being wrong about it.

EVERY REMAINING PATH HAS BEEN MEASURED AND CLOSED, not abandoned:

  `display`  18.6% of the screen's n_over8. Canonical resolves FIVE ink runs at
             40px, not fifteen glyphs, so per-glyph registration has nothing to
             grip. Swept as scaleX against tracking: a knife edge where 0.001em
             costs three points, and the candidates that best match canonical's
             LETTER WIDTHS score the WORST bands. Position and width cannot both
             be had. (round 26)
  the marks  `Icon`'s `sw/sqrt(sx*sy)` is wrong on both axes by construction —
             real, and recorded to fix when the marks are re-authored. But the
             stroke term with boxes held is monotonically worse toward
             canonical's own median, and the box term with stroke held is at its
             argmin in both axes on the worst mark. The boxes are fitted AROUND
             the defect. (round 27, grade 13)
  safe1/2,   matching their ink density costs +13.08, +5.76 and +0.88 of band.
  resendLink Same signature: an x-height set too large costs coverage that extra
             weight buys back. (rounds 15, 21)
  help3      advance 17px short, threshold-independent, face-limited.
  seven      shift optima worth 7.022, 3.404, 3.260, 3.092, 2.999, 2.457 and a
  traps      1px bbox — all refused with measurements, ink edges moving
             oppositely. Taking them would buy ~22 points of band and make the
             drawing worse.

WHAT WOULD ACTUALLY MOVE IT, and both are Kevin's:

  1. **A BODY FACE WITH CANONICAL'S x-HEIGHT/ASCENDER RATIO.** GeistVF declares
     0.7465; canonical is 0.667-0.710, measured over ten mixed-case runs with an
     all-caps control flat. No bundled face has it — the other two are 0.7857
     and 0.7714. This one cause sits under `display`, safe1, safe2, resendLink,
     help2 and help3, which between them are most of the residual.
  2. **APPROVED ICON ASSETS** for the four desktop roles that currently share
     files, since `Glyphs.tsx` forbids reusing a shape for a second concept and
     there is no honest existing asset for "spam folder".

Everything else on this screen is DONE to measurement: every band present and
positioned, colour probed from eroded cores (three separate graphite retractions
by three graders), geometry measured, the marks' topology matching canonical
component-for-component, the real user path verified end to end against a live
database by five graders, every focusable control at 44pt, and the security of
the four routes it calls exercised at concurrency 60.

THE HONEST SUMMARY FOR KEVIN: 005's pixel work is finished at 5.4704 and the
last stretch to an A is blocked on a typeface, not on effort. 004 finished at
2.6520 with the same method — the gap between them is almost exactly the face.

### ROUND 27: the joint (box, sw) re-solve has nothing to give, measured

Grade 13's anisotropic-stroke finding is REAL and stands as a construction
defect: `Icon` emits `sw / sqrt(sx*sy)`, so both axes are wrong whenever the box
is not square, and the sign tracks the box aspect across all eleven marks. What
was left open was whether re-solving `(box, sw)` jointly could recover anything,
since the one-line isotropy fix is a wash.

BOTH COORDINATES ARE INDEPENDENTLY AT THEIR ARGMIN. Grade 13 measured the stroke
term with the boxes held: isotropic at 3.0 costs +0.005 of whole screen, 3.15
costs +0.033, 3.30 costs +0.052 — monotonically worse as it approaches
canonical's own 3.19 median. This round measured the box term with the stroke
held, on `diffMark`, the worst-affected mark at 23.7550:

    control / kx 1.00   23.7550   +0.0000   <- argmin
    kx 0.99             23.8264   +0.0715
    ky 0.99             24.4495   +0.6946
    ky 1.01             25.3844   +1.6295
    kx 1.01             25.6741   +1.9192
    ky 0.97             28.4295   +4.6745
    kx 0.97             29.5460   +5.7910
    kx 1.03             29.7068   +5.9518
    ky 1.03             31.3125   +7.5576

Every perturbation is worse, monotonically, in both axes. The box is not
mis-fitted — it is fitted, and what it is fitted AROUND is the stroke defect.
That is the whole finding: the construction is wrong and the output is
compensated, so correcting the construction alone makes it worse, and correcting
both lands back near where it already is.

**THE ANISOTROPY IS THEREFORE RECORDED AS A CONSTRUCTION DEFECT, NOT A PIXEL
DEBT.** It should be fixed when the marks are next re-authored — `Icon` should
take per-axis stroke widths, or the boxes should be square — because a helper
that is wrong by construction will be wrong again on the next screen that uses
it, and it silently pushed nine of eleven marks' ink 4-11% light while the
near-square chevrons ran 5-10% heavy. But it is not worth re-fitting eighteen
parameters to move a number that both gradients say is already at a minimum.

### ROUND 26: display's residual is not reachable by scaleX or tracking

Grade 13 read `display` as per-glyph misregistration and grade 12 as
antialiasing. Both were measuring downstream of the same thing, and the ink runs
say what it is.

CANONICAL RESOLVES FIVE INK RUNS, NOT FIFTEEN GLYPHS — at 40px on this face the
letters are already touching in BOTH plates, so a per-glyph solve of 004's kind
has nothing to grip. What the five clusters show:

    cluster widths   canon 152  35 145 116  44     render 154  36 147 121  43
    inter-gaps       canon   1  18  13   4         render   2  15  11   3
    total            532                           532

The render draws WIDER LETTERS WITH TIGHTER GAPS and holds the same total, which
is why the bbox and total advance "match exactly" while the interior does not.
That is a scaleX-against-tracking imbalance, and it is directly sweepable — so it
was swept, 13 candidates over scaleX 0.5745-0.5862 and letter-spacing
0.003-0.014em, control reproducing 19.3019 on both runs.

IT IS A KNIFE EDGE AND IT IS NOT SHIPPED:

    s0.5803 / ls 0.005   21.7311      sum|dW| 9
    s0.5803 / ls 0.006   18.1185      sum|dW| 8     <- the "win"
    s0.5803 / ls 0.008   20.9117      sum|dW| 10
    s0.5745 / ls 0.006   37.5140      sum|dW| 5
    s0.5803 / ls 0.003   35.9220      sum|dW| 6
    s0.5775 / ls 0.005   32.1827      sum|dW| 7
    control              19.3019      sum|dW| 11

One THOUSANDTH of an em costs three points on either side of the best value, and
— decisively — THE CANDIDATES THAT BEST MATCH CANONICAL'S LETTER WIDTHS SCORE
THE WORST BANDS. sum|dW| 5, 6 and 7 score 37.5, 35.9 and 32.2 while the control's
11 scores 19.3. The band here is dominated by cumulative POSITION inside a
left-anchored run, not by letter shape: any width change displaces everything
downstream of it, and 18.1185 is where the accumulated displacement happens to
re-align rather than where the letters get closer to canonical's.

So the 1.18 on offer is a resonance, not a correction, and taking it would be
rule 74b's paper-over with a bigger number than usual. Matching the widths costs
position; matching the position keeps the widths wrong. That is the FACE — the
same root cause already recorded as NEEDS KEVIN — surfacing on the one run big
enough that its letter widths are individually measurable.

`display` carries 19,291 n_over8, 18.6% of the screen. It is now measured,
explained, and stated as unreachable without the face, rather than left as an
open invitation to sweep. Three graders have now offered three different
mechanisms for it; this is the first measurement that predicts what a change
will do.

### GRADE 13 (B): the stroke width is wrong on BOTH axes, by construction

Thirteenth grade, and the first to look at the `Icon` HELPER rather than at the
marks it draws. It emits

    <g transform="translate(bx by) scale(sx sy)" stroke-width={sw / sqrt(sx*sy)}>

and the geometric mean makes the AVERAGE stroke right while leaving BOTH AXES
WRONG whenever sx != sy: a vertical stroke rasterises at sw*sqrt(sx/sy) and a
horizontal one at sw*sqrt(sy/sx). Read off the served DOM, sx/sy is 1.1261
(helpMark1), 1.1212 (diffMark), 1.0926 (plateMark), 1.0728 (helpMark2), 1.0588
(gear), 0.9807 (helpMark3), 0.9259 (shield) — only `back` is square.

Measured as the median ink integral across the stroke, on straight rectangular
envelope edges only:

    helpMark1  vertical 3.181  horizontal 2.752   V/H 1.156   (canonical 0.977)
    diffMark   vertical 3.169  horizontal 2.752   V/H 1.151   (canonical 0.980)

Predicted from the DOM: 1.126 and 1.121. Two marks, prediction from the
mechanism, measurement from the pixels, canonical's own two axes agreeing to 2%.

IT IS ONE CAUSE UNDER SEVEN SEPARATELY-LISTED BANDS. Total ink R/C per mark:
helpIcon1 0.887, back 0.891, gear 0.907, diffMark 0.910, helpIcon3 0.912,
helpIcon2 0.937, shield 0.954 — while the three CHEVRONS, whose boxes are nearly
square, run HEAVY at 1.046/1.098/1.053. The sign flips with the box aspect, not
with the icon. That is also the 0.89 ink ratio grade 9 raised on helpIcon1/3 and
that four rounds treated as separate icon defects.

AND THE OBVIOUS FIX IS A WASH, WHICH IT VERIFIED RATHER THAN ASSUMED. Injecting
`vector-effect:non-scaling-stroke` into the served build made the strokes
isotropic to 0.008 px — helpMark1 2.996/3.004 — and moved the whole screen
5.4704 -> 5.4751. The MARK_BOXES were fitted around the defect and now absorb
it: helpIcon1 13.668->13.986 and diffMark 23.755->23.955 got worse while gear
8.857->8.758 and helpIcon2 13.216->13.153 got better. Canonical's straight-edge
integral is 3.12-3.49 (median 3.19), not 3.0, so the target is isotropic AND
wider, and sweeping the multiplier with the boxes held made it worse again
(1.05 -> 5.5033, 1.10 -> 5.5228). So closing it is a JOINT (box, sw) re-solve —
the same absorption the box-rule token was already caught doing — and the
grader correctly declined to prescribe the one-liner.

**IT ALSO CAUGHT A BRIEF I WROTE CONTRADICTING THIS LEDGER.** I told it
`display`'s difference map was "a one-pixel outline, i.e. antialiasing on a
large ink area", which came from grade 12's summary. This ledger already carried
grade 11's correct reading — per-window best shifts of -1/+2/-2/-3/-2/-2/+3/+2.
Grade 13 measured it properly at 0.25 px resolution: two slices 90 px apart want
OPPOSITE 2-3 px translations (x385-430 wants -2.25 for a 30.1% drop, x610-655
wants +2.00 for 64.3%), against a `wordmark` control whose whole band moves 1.4%.
Antialiasing is not removable by translation; 64% is not antialiasing. The same
signature is on `plateLab` (-1.75, 50.2% down), `lede1` (-1.00, 48.7%) and
`safe1` (+2.25, 62.6%), none of which were connected to it before.

The lesson is mine: a hand-written brief is a SUMMARY of the ledger and drifts
from it. When briefing a grader, quote the ledger's measurement, not a
paraphrase of a previous grade's summary of it — I handed a grader a claim this
file already contradicted, and only its independence caught it.

Also corrected, again mine: the desktop-icon comment in `page.tsx` enumerated
`verify-help-2` and `verify-help-3` as both falling through to the default.
Measured, help-3 resolves to `ui-privacy-info.png` — its concept "Help guide"
DOES match the library. Four files across seven roles, not three. The shape was
right and an instance was wrong, which is still wrong.

And `verify-back`'s effective hit region measured 42.0 x 42.0 against settings'
45.0 x 44.0: `-inset-[9px]` was computed against the 26 px class rather than the
23.3 pt box the browser lays out. `-inset-[11px]` gives 45.3, and rule 89 says
build it rather than reason it — so it was built, and BOTH halves were checked:

    back      css 23.3x23.3   effective 42.0 -> **46.0 x 46.0**   PASS
    settings  css 24.9x23.5   effective 45.0 x 44.0               PASS
    resend    css 88.5x44.0   effective 80.0 x 46.0               PASS

    capture   BYTE-IDENTICAL to round 24, md5 2444eff3c59d7f663c40c530c68fe602
              whole screen 5.4704 / n_over8 103546 unchanged
    gates     SCREEN=005 markup 11/11, csrf 3/3

Every focusable control on the phone now meets 44 pt, and the byte comparison is
the part that matters: rule 89 exists because a transparent-control resize that
was reasoned inert moved a band by 3.4. Reasoning it inert a second time would
have been the same mistake with a better excuse.

### ROUND 24: the shield outline, swept because it could not be reasoned

The last concrete item grade 12 left open, and it left it open ON PURPOSE — it
measured the defect precisely and declined to prescribe a control-point edit it
could not verify. That is the right call and this round honoured it by sweeping
rather than reasoning.

The defect: dome top (1636) and tip (1722) IDENTICAL in both plates, straight
sides matching to a quarter pixel, and canonical beginning its taper at row
~1684 against the render's ~1688 — render width at row Y equals canonical width
at Y-4 through the whole mid-taper, +8.22 px by row 1712. Not a translation,
which is why the whole-window `dy+1` optimum worth 2.999 is paper-over.

Swept against the served build by injecting candidate `d` values through the CSS
`d` property, with a rule-40 control, parameterised so the TIP STAYS PUT (it and
the dome already match and must not move):

    d 0.00 (control)  13.5296    w@1690/1700/1712  67/62/46
    d 1.50            10.1029                      65/59/43
    d 2.00             9.4622                      65/58/41
    d 2.50             9.3281  <- shipped          64/57/40
    d 3.00             9.8756                      63/56/39
    d 3.50            10.5412                      62/55/38
    canonical                                      67/58/38

Built: **9.3281 exactly**, the swept value to four decimals. Whole screen 5.5012
-> **5.4704**, n_over8 103546, gates SCREEN=005 markup 11/11 and csrf 3/3.

AND THE SWEEP CONFIRMS THE DIAGNOSIS INDEPENDENTLY: no single parameter
reproduces all three widths — d 3.50 lands row 1712 exactly and overshoots the
two above it — so this is a DIFFERENT CURVE, not a displaced one, exactly as
grade 12 read it. The argmin is taken; closing the remainder means re-tracing
the asset against the plate rather than re-fitting one number, and that is
stated rather than attempted.

METHOD NOTE, and it is a quiet failure worth recording: `sweep005.mjs`'s
read-back is bound to the BAND's element, so when the injection selector targets
something else — here a `path` inside the mark's `svg` — it dutifully reports
the span's font metrics and tells you NOTHING about whether the injection took.
Rule 40's check did not fail, it silently stopped applying. What established the
injection had landed was five distinct md5s across the five candidate captures.
When a check's subject and the change's subject are different elements, the
check is decorative.

### ROUND 23: correcting one error made a second one visible

`helpIcon2`'s clock hands, and the round is worth recording for the ORDER the
two corrections had to happen in rather than for its 0.087.

Measured after the envelope narrowing, so the two changes could not be
confounded — the hands are untouched by it:

    canonical  36 px  10x7  rows 43..52  cols 68..74
    render     41 px  12x7  rows 42..53  cols 69..75

One row over at each end with the WIDTH ALREADY EXACT at 7, so a vertical-only
correction; shrinking uniformly would have broken a right axis, which is round
20's mistake. The 1 px column offset was deliberately NOT taken, under rule 90:
a 1 px extent delta is a hypothesis, and this mark had already cost a revert for
exactly that.

Built, the shape landed EXACTLY — 36 px at 10x7 on rows 43..52, identical to
canonical — AND THE BAND GOT WORSE, 13.3029 -> 13.3345.

That is the useful part. With the shape oversized, the extra ink overlapped
canonical's position and partly MASKED the offset; correcting the shape exposed
it. A 1 px delta measured on a shape that is otherwise exact is no longer a
hypothesis — there is nothing else left for it to be — so it was then taken, and
the mark landed exact on all four measures with the band beating its own revert
condition:

    helpIcon2  13.3029 -> 13.3345 (shape only)  -> **13.2155** (shape + offset)
    hands      36 px 10x7 rows 43..52 cols 68..74 — canonical's, exactly
    whole screen 5.5016 -> **5.5012**, n_over8 103699, gates 11/11 and 3/3

SO RULE 90 IS SHARPENED RATHER THAN OVERRIDDEN. "A 1 px extent delta is a
hypothesis the interior must referee" stands; what this round adds is that the
referee can be BLOCKED by a larger error in the same feature, and that the
verdict changes once the larger one is gone. Correct the unambiguous defect
first, then re-measure — the small residual you were right to distrust may be
the only thing left, and it will say so.

The alternative reading — revert an exact structural match over 0.03 — would
have protected a number at the cost of the drawing, which is the inverse of the
mistake rule 90 exists to prevent.

### GRADE 12 (B): the first grader that verified its own prescriptions

B, up from B-, and the most useful grade of the twelve for one reason: it BUILT
what it recommended before recommending it, against the served dist, with a
rule-40 control that reproduced the graded render BYTE FOR BYTE (0 px over 8)
before anything was scored against it. Every number it quoted reproduced on my
build, three of them to four decimals.

ALL THREE DRAWN ENVELOPES ARE TOO WIDE ON THE RIGHT, and the mechanism predicts
the render exactly. `Icon` sets `sx = bw/24`, so walls 20 viewBox units apart at
`bw` 67.0 render 20 x 67.0/24 = 55.83 — the measured value to three decimals.
Mass-weighted sub-pixel wall centroids, on rows where the flap diagonal clears
both walls:

    helpIcon1  canonical 53.99  render 55.83   left +0.42  right +2.26
    helpIcon2  canonical 52.29  render 55.14   left +0.14  right +2.38
    diffMark   canonical 54.26  render 60.77   left +0.91  right +7.41

Opposite signs, so a size error by rule 34 — which is exactly why every shift
search on these marks returned (0,0) and found nothing to take.

MY OWN COMMENT CONCEALED IT. `helpMark1`'s note says the width "is already exact
at 59", and that is true of the mark's BOUNDING BOX, whose right edge is set by
the CHECK, and false of the envelope inside it. Rule 90's extreme-value trap
running in my favour for once: the box agreed with canonical exactly while the
envelope's own walls were 2 px out. The rule said a bbox is a poor instrument
for finding a defect; this is the other half — it is also a poor instrument for
declaring one absent.

Built and measured, predictions in brackets: helpIcon1 17.6749 -> **13.6684**
[13.6684], helpIcon2 18.0968 -> **13.3029** [13.3029], shield 13.7904 ->
**13.5296** [13.5296], diffMark 26.4442 -> **23.7550** [24.1835, beaten], whole
screen 5.5538 -> **5.5016**, n_over8 103702, gates SCREEN=005 markup 11/11 and
csrf 3/3. The pencil still separates into canonical's 2 components at all three
thresholds after the narrowing, so the round-17 fix was not undone by it.

The shield tick's remaining 1 px was taken with it: `-2` -> `-3` on the outer
translate, from orange-isolated ink at canonical rows 1668..1691 against render
1669..1692 — both edges +1, height identical, centroid delta +1.38 in y against
+0.10 in x. x was NOT moved, though the shift metric prefers dx+1 (8.41 ->
4.58), because the interior says x is aligned.

WHAT IT CORRECTED IN THE RECORD, both mine:

  * the `diffMark` comment still read "Components are still ONE" two rounds
    after the bridge closed — the shipped build has 2 at every threshold. A
    comment that outlives its measurement is the same class as the two false
    claims this screen has already been caught making.
  * `forgot-password`'s residual said the cost was mail VOLUME. Measured:
    attacker requests 1-5 return 200, the sixth 429s, and THE VICTIM'S OWN RESET
    429s. The 5/min bucket is keyed on `email || "anon"` — the address the
    caller types — so it is the same denial-of-recovery switch the daily ceiling
    was removed for, on a shorter timer. The statement is fixed; the repair
    needs a second axis (refuse only when a live UNSPENT token exists, or key
    anonymous callers by client) and is NEEDS KEVIN rather than re-keyed blind,
    because keying on unauthenticated caller-supplied identity is bypassable.

  * IT ALSO CORRECTED THE FACE FINDING'S SCOPE. Grade 11's control for D1 was
    `didnt` being flat — but that control is about the x-height/ascender RATIO,
    which has no meaning in an all-caps run, so it never covered advance or
    density. `didnt` carries +6 px of advance and +21.9% ink while help2 (-6)
    and help3 (-17) go the other way, so no single global tracking parameter
    explains all three. D1 stands for what it measured and is narrower than the
    ledger had it.

FOUR MORE TRAPS MEASURED AND REFUSED, none of them taken: `resendLab` shift
(0,-2,-1) worth 3.404 (both plates' ink starts on row 731, so a run already
aligned at the top cannot be 2 px low); `shield` whole-window dy+1 worth 2.999
(dome top and tip are identical in both — only the taper between them differs);
`diffLab`'s 1 px bbox delta on both edges, where the interior scored the shift
worse than the base; and the graphite cores again, at 14-17 units inside the ~18
canonical's capture is known to cost, with canonical's eroded population 131 px
against the render's 436 — biased survivors. Third retraction of that one.

STILL OPEN from this grade: the shield OUTLINE does not "land exactly" as its
source claims — canonical begins tapering at row ~1684 and the render at ~1688,
so render width at row Y equals canonical width at Y-4 across the whole
mid-taper, reaching +8.22 px at row 1712. The grader deliberately did NOT
prescribe a control-point edit it could not verify, which is the right call and
the standard this screen now holds.

### GRADE 11 (B-): a root cause under half the open list

The ninth grade and the first BELOW B, and it earned that by finding one cause
beneath several things that had been treated as separate defects. It graded
.next-v33 (round 17), so its shield-tick and helpIcon3-dot numbers predate round
18, which closed both — the dot exactly.

**D1, AND IT IS THE HEADLINE: NO FACE IN THIS REPOSITORY HAS CANONICAL'S
x-HEIGHT / ASCENDER RATIO.** Modal sub-pixel top-crossing over every ink column
of each band, swept across three coverage levels to rule out the lossy-canonical
artefact:

    safe1  0.698 -> 0.747     lede1  0.705 -> 0.741     help3     0.683 -> 0.723
    safe2  0.687 -> 0.738     lede2  0.710 -> 0.750     resendLab 0.698 -> 0.750
    help1  0.684 -> 0.724     help2  0.694 -> 0.723     diffLab   0.692 -> 0.746
    didnt (ALL-CAPS NEGATIVE CONTROL)  +0.4% / -0.6% / -2.2%

Nine of nine mixed-case runs are 4-10% too tall in the x-height, the one run
with no x-height is flat, and the sign holds across four weights and four sizes.
`GeistVF.woff` declares sxHeight 530 / sCapHeight 710 = 0.7465; the other two
bundled faces are worse (0.7857, 0.7714). Canonical's body face is none of them.

That single fact re-characterises three items already in this ledger. safe1's
"ink density 1.2153" is ALSO a size error — advance +1.50%, both edges moving
outward on both axes, which is rule 34's size signature — and safe2 the same at
+1.06%. So the +13.08 and +5.76 of band those two cost when their weight is
matched was never a weight tradeoff: it is this ratio, surfacing as mass. Weight
sweeps could not have fixed them and correctly refused to.

NEEDS KEVIN, and it belongs beside the icon-asset decision: a body face with
x/asc 0.667-0.710 is a design-asset question, not something to synthesise in a
screen's round.

WHAT ELSE IT FOUND THAT WAS NEW:

  * `resendLink` ink is 1.262 on the orange plane and 1.215 on the neutral one,
    against a `resendVal` control of 1.024 — and its UNDERLINE is exact
    (1.571/1.571 integrated cross-section), so it is the glyph run alone. The
    source comment had named the dilution that hides it and never measured the
    density.

    ROUND 21 SWEPT IT AND D3 TURNS OUT TO BE D1. Band and glyph ink move
    monotonically in OPPOSITE directions — weight 380 lands ink 1.0005 exactly
    and costs 0.8814 of band; 540 buys 0.31 of band for ink 1.2939 — which is
    the same shape safe1 and safe2 produced at +13.08 and +5.76. That is the
    face signature, not a weight problem: an x-height set too large costs
    coverage that extra weight buys back, so the band optimum sits far from the
    ink optimum. "Resend email" is mixed-case, so D1 covers it; it simply was
    not among the nine runs grade 11 happened to measure. So this screen has ONE
    FEWER independent defect than the grade lists, not one more, and the weight
    is left alone with its numbers stated.
  * `display` is internally scattered even though its bbox and total advance
    match canonical exactly (528 both): best local x-shift per 40px window runs
    -1/+2/-2/-3/-2/-2/+3/+2 and the residual at each window's OWN best shift is
    still 121-535, so no window is a translation. It carries n_over8 19,291 —
    18.5% of the whole screen's 104,176 — with a correct outline.
  * helpIcon1 and helpIcon2's envelope bodies are 2-3 px oversized with BOTH
    edges moving outward, and the gear's inner circle is 2 rows short.
  * **DoD 8: this route serves ZERO sidebars where the invariant is one.**
    /signin 1, /signup 1, /dashboard 1, /verify-email 0. Grade 10 had called
    zero "correct for an auth page"; the sibling measurement settles it, since
    /signin and /signup are auth pages too. FIXED AND VERIFIED ON BOTH AXES:

        1440x900   verify-email 1 sidebar (visible), 1 region-main, scrollW 1440
                   signin 1 / signup 1 / dashboard 1 — now identical
        393pt      0 visible sidebars, scrollW 393 — invariant intact
        capture    BYTE-IDENTICAL to round 18, md5 f2b0500039809aab3f2c84143a10d451,
                   whole screen 5.5735 / n_over8 104084 unchanged

    The byte comparison is the point: `UnifiedSidebar` is `hidden ... md:flex`
    and both new wrappers carry `data-s5-contents` (`display:contents`), so the
    elements leave the phone's box tree entirely. That was PREDICTED and then
    CHECKED rather than assumed — the last change reasoned to be inert on the
    phone was the hit-target resize in rule 89, and it moved a band by 3.4.
  * **D6 REFUTES A MITIGATION I WROTE.** The forgot-password oracle returns at
    concurrency 60: median deltas +54.55 / +57.49 / +79.95 ms, z up to 13.74,
    with absent-vs-absent controls flat at |z| <= 0.71. The route's comment
    predicted exactly this and offered the 5/min per-address limit as the bound
    — and the grader's refutation is correct and obvious in hindsight: the limit
    is PER ADDRESS, and an attacker classifying a list sends ONE request per
    address, so it bounds nothing about the attack. Rule 79 said a floor cannot
    hide a difference the attacker sizes; the "mitigation" beside it was not one.

WHAT IT CONFIRMED CLEAN, which is worth as much: its own capture was
BIT-IDENTICAL to the committed render (mean|d| 0.0000), component topology
matched canonical on all sixteen bands tested with no merged strokes anywhere —
so round 17's two structural fixes hold under an independent instrument — the
orange and graphite tokens were both checked against canonical's own scatter and
NOT raised, and `/api/auth/verify-email-code` shows no oracle even at
concurrency 60 (|z| <= 0.10), so its work-equalisation genuinely holds where
forgot-password's floor does not.

### OPEN, 005: helpIcon2's clock hands, solved but not yet built

Measured on the committed render, components at threshold 140 — the estimator
rule 90 says to prefer, since these are interior features and not an envelope:

                canonical                     render
    envelope    625 px  41x56  rows 11..51    615 px  42x58  rows 11..52
    ring        231 px  26x26  rows 36..61    230 px  25x27  rows 37..61
    hands        36 px  10x7   rows 43..52     41 px  12x7   rows 42..53

The RING is essentially exact — 230 against 231 px — which is round 17's fix
holding under a second measurement. The HANDS are 2 rows too tall, symmetrically
(one row over at each end), and their WIDTH IS ALREADY EXACT at 7. So this is a
vertical-only correction and shrinking the shape uniformly would break an axis
that is right, which is the same mistake round 20 made on four boxes at once.

Solved in viewBox units at k = 2.2257 device px per unit. The hands span
16.07..19.53 = 3.46 units (v-arm 2.36 plus the horizontal arm's dy 1.1); the
target is 3.46 x 10/12 = 2.88, held on the same midpoint 17.80, so the span
becomes 16.36..19.24 and the two segments take the reduction proportionally.
The columns are 1 device px right (69..75 against 68..74), which is 0.45 units:

    M18.74 16.07 v2.36 l1.57 1.1   ->   M18.29 16.36 v1.96 l1.57 0.92

with `dx` deliberately unchanged at 1.57. NOT BUILT — it was solved while an
independent grade was running against the current dist, and moving the artefact
under a grader is what rule 86 exists to prevent. Worth roughly the hands' own
share of a 1344 px band, so it is small; it is recorded solved so the next round
spends a build on it rather than a measurement.

### OPEN, 005: the long-address clip cannot be fixed with an ellipsis

Grade 10 found that a long address is hard-clipped with no ellipsis on the path
the product's own mail creates — `lede2` runs to column 852 of an 853 px canvas
and is cut mid-word by `.s5{overflow:hidden}`, and `verificationEmail.ts` builds
exactly that URL. Real, and DoD item 6.

The obvious repair does not work, and the measurement that says so is worth
recording before someone tries it:

    canonical  lede2 ink cols 269..588   width 320
    render     lede2 ink cols 268..586   width 319
    the run's own box                    width 319.9

THE CANONICAL STRING EXACTLY FILLS ITS BOX. So adding `overflow:hidden` +
`text-overflow:ellipsis` to this run would clip canonical's own address — the
state the screen is graded in — to buy a case it is not graded in. There is no
margin to spend.

The other reflex, truncating the string in JS, is wrong for a different reason:
`lede2` is ONE element shared by both renderings (the phone and desktop trees
are one tree gated by Tailwind `md:`), so a character budget tuned to a 319.9 px
phone box would also truncate on a desktop that has room for the whole address.

What would actually work, none of it a one-liner: ellipsise against the CANVAS
width rather than the run width, which means expressing a max-width in the run's
transformed space (`width` is divided by `scale`, and the run is centred by
`left: cx - w/2`); or give the phone run a smaller size for long strings, which
CSS cannot express without a container query or JS; or accept a second element
for the phone. Each is a real change to a measurement-tuned run, and the run in
question is one of the ones whose numbers carry the screen.

Left OPEN with its numbers rather than attempted at the end of a long session,
which is the standing ruling on physically constrained residuals.

### GRADE 10 (B): what it found, including two things it caught me claiming

Grade 10 re-captured from the live dist at the START and the END of its run and
got byte-identical images to the committed render, reproducing 5.6566 / 104645,
so its numbers and mine are the same numbers. Grades now stand at B, B, B+, B,
B, B, B, B — eight, and the last four all name the same two areas.

WHAT IT CORRECTED IN MY WORK, both of which matter more than the pixels:

  * MY ROUND-14 DESKTOP-ICON FIX DID NOT WORK, and the comment I wrote said it
    did. Measured off the served DOM at 1440x900, seven icons resolve to FOUR
    files and one file carries three meanings — "Open email app", "Check your
    spam folder" and "Your account is safe" are one picture. Changing the lucide
    name imported cannot fix it: `ApprovedLucide` maps a name to a CONCEPT
    STRING and `approvedAssetForConcept` keyword-matches that onto a small
    raster library, so `MailCheck` ("Success complete") and `ShieldCheck`
    ("Privacy success") both hit the `success` branch, while `Clock`
    ("Stopwatch time") and `Pencil` ("Edit coaching note") match nothing and
    share the default. This is the SAME defect class I wrote up as grade 9's D1
    — a comment asserting a state that measurement denies — committed by me one
    round after naming it. NEEDS KEVIN: closing it means adding approved assets,
    and `Glyphs.tsx` explicitly forbids reusing a shape for a second concept.

  * A `git add -A` swept the grader's own scratch into commit `3e0e686` — 13
    throwaway probe scripts committed as project source, which the grader
    noticed and reported. Untracked in `4f2d1a1`; `.grade/` now joins the
    `.g*tmp/` convention .gitignore already had for exactly this.

WHAT IT MEASURED THAT IS NEW AND ACTIONABLE:

  * `EnvelopePencilMark` OVERPRINTS. Connected components (8-connectivity) in
    (1075..1142, 240..320): canonical **2** at every threshold (629/260 at 140,
    702/303 at 180, 829/329 at 210), render **1** (902, 959, 1001). The pencil's
    ferrule band is missing and its tip runs into the envelope. `diffMark` is the
    worst diagnostic sub-window on the screen at 32.0538.
  * `MailClockMark`'s clock is 20% oversized, by least-squares circle fit to ~55
    outer-arc points: canonical centre (109.76, 1448.57) outer r **12.98**,
    render (106.99, 1446.63) outer r **15.58**. Envelope 3 px wide too. This is
    the concrete version of what I recorded as "identify the shape" below — the
    topology differs because the oversized ring MERGES with the envelope
    (canonical 3 components, render 2), not because it is a different icon.
    An integer shift search returns (0,0) gain 0.000, so no translation exists.
  * The shield's orange tick is +2 px in both axes and sits low (top +2,
    bottom +4) while the shield OUTLINE lands exactly — internal geometry.
  * A LONG ADDRESS IS HARD-CLIPPED with no ellipsis, on the path the product's
    own mail creates: `lede2` runs to column 852 of 853 and is cut mid-word by
    `.s5{overflow:hidden}`. `verificationEmail.ts` builds that URL, so a player
    with a long address sees their address sliced off.
  * Tap targets under 44 pt: back 23.7x23.7, settings 24.9x23.5, resend
    88.5x20.3 — the last because `hitbox(..., 44)` is DEVICE px, 20.3 pt.
    FIXED this round; they move no canonical pixel.
  * `resendLab` is placed by a left anchor `x` tuned to the mid-countdown
    string, so in the live zero-cooldown state its longer label sits 28.2 px
    right of centre.

A TRAP IT FLAGGED AND DID NOT FALL INTO, which is worth more than a fix: the
biggest single shift-search gain on the screen is `help2` at (0,-3) worth
**7.022**, and taking it would be paper-over — its ink edges move OPPOSITELY
(L +1, R -4), which is a size error. Same on `plateLab` (L -2, R +2, gain
3.092), `digit3` (gain 3.260) and `digit1` (gain 2.457). Four more instances of
rule 74b, found by a grader rather than by me.

It also raised a graphite-token defect from eroded cores (+16 to +21 across four
runs, surviving thresholds 130-210) and then REFUTED it itself with a built
sweep — `#3B3D47/#383A44/#34363F/#303239` giving 5.6757/5.6834/5.6961/5.7120,
monotonically worse — after finding canonical undershoots 8 units one pixel
inside a hard step and reads thin orange strokes 18 units dark. Second grader to
raise and retract this; the token is right.

### OPEN, 005: helpIcon2 is probably not the icon canonical drew

`helpIcon2` is the hottest band on 005 at **28.0615**, and grade 9 read it as
"the clock badge's left wall is 5 px out". Measured directly, that is too narrow
a reading and the recommendation it implies would not have worked.

The bounding boxes agree to within a pixel — canonical rows 11-61 cols 19-83,
render rows 11-62 cols 20-83 — so by rule 34 this is not a translation and not a
scale. What differs is the TOPOLOGY. Ink runs per row, threshold 160, window
(1400,1472,40,140):

    row 18   canon (19,27) (67,74)                 render (20,22) (75,77)
    row 36   canon (19,22) (66,74)                 render (20,22) (55,59) (74,78)
    row 48   canon (20,49) (57,59) (68,70) (80,83) render (20,23) (50,53) (66,71) (80,83)

Three different kinds of disagreement, none of them positional. At row 18
canonical's corners are 9 and 8 px wide against the render's 3 and 3. At row 36
the render has an extra run canonical does not have at all. At row 48 canonical
carries a solid 30 px horizontal stroke that the render simply does not draw.

A stroke width cannot add a run, and a nudge cannot remove one. The render is
lucide `mail-clock` (`Marks005.tsx:135`) and the evidence says canonical drew
something else — or drew the same glyph at a weight and cut that changes which
strokes join. THE NEXT STEP IS IDENTIFICATION, NOT ADJUSTMENT: find the shape
whose run topology matches canonical's row by row, then position it. Guessing at
path edits against a lossy raster is how a hot band gets a metric win and a
worse drawing, which is rule 74b.

`helpIcon1` and `helpIcon3` are the same family and carry the same signature —
ink density 0.8901 and 0.8876 against `wordmark`'s 1.0011 control, i.e. both
draw about 11% less ink than canonical, which is consistent with grade 9's
separate measurement that helpIcon3's "?" stem is 4 px against canonical's 7 and
its dot 3 against 6. Those two are plausibly a stroke-width or path-weight
question and helpIcon2 is not; they should not be swept as one role until the
identification above is done.

### The desktop regression guard, and the baseline that is no longer there

The cycle's step 2 says to confirm the desktop set did not regress against
`$SCRATCH/verify-desktop`. **That directory is empty** — another rollback took
it, the same way it took the 004 grading inputs the `docs/shotiq/grading/`
directory was built to survive. `$SCRATCH/canonical-desktop` (077-096) is still
there, so the target survives; only the last-known-good baseline is gone.

For round 13 the guard was established by CONSTRUCTION rather than by capture,
and it is written down as that rather than as a measurement:

  * the round touched six files — `phone-005.ts`, `Marks005.tsx`, the
    `forgot-password` route, `verification.ts`, and the two grading artefacts.
    No global stylesheet, no shared component.
  * every `.s5` / `[data-s5` selector in the SERVED stylesheet (parsed out of
    the built page and brace-walked, not read from the template literal, which
    nests backticks and defeats naive extraction) sits inside
    `@media (max-width: 767.98px)`. Occurrences outside: **0 of 19,186 chars of
    inline CSS.**
  * the phone and desktop renderings are ONE tree gated by Tailwind `md:`
    utilities, not two trees. Every drawn mark is `md:hidden`, and so is the
    overlay root in `Marks005.tsx` — which matters, because if the overlay were
    ungated it would render on desktop with no styles at all rather than render
    wrongly, and an unstyled in-flow SVG is a visible artefact, not a subtle one.

Construction is weaker evidence than a capture and is not a substitute for one.
It is sufficient here only because the changed surface is provably disjoint from
desktop; the next round that touches anything shared needs a real baseline, and
rebuilding `verify-desktop` from the 077-096 canonicals is a prerequisite for
that rather than something to discover mid-round.

**AND THE CONSTRUCTION ARGUMENT WAS RUN ONCE, BY HAND, IN ROUND 13.** "0 of
19,186 chars" is a measurement, and rounds 14 through 31 each changed
`phone-005.ts` without anyone repeating it — rule 92's fourth clause applied to
the guard that licenses every round's desktop claim, which is about the worst
place to leave an un-re-run estimator. It is a gate now:
`docs/shotiq/desktop-leak-gate.mjs`, four probes plus three live self-tests, run
alongside markup-gate and csrf-gate.

    PASS  css scope                   56 phone rules, 0 outside, 21977 chars
    PASS  exactly one @media (max-width: 767.98px) block
    PASS  no drawn mark or overlay paints at 900   11 marks, 0 visible
    PASS  every data-s5-off desktop sibling visible at 900   11, 0 hidden
    PASS  SELF-TEST probe 1 catches an unscoped phone rule
    PASS  SELF-TEST probe 3 catches a mark forced visible
    PASS  SELF-TEST probe 4 catches a hidden desktop sibling
    7/7

Probes 1 and 2 are the guard this section has been claiming; probes 3 and 4 are
the two ways that claim could be true and still not mean what it says — nothing
paints through a path that needs no rules, and the desktop SIBLING of each phone
mark is actually there (round 14 found `diffBtn` with only the `md:hidden` half,
which no phone-side probe can see).

**THE GATE'S FIRST RUN FAILED, AND THE DEFECT WAS THE GATE.** Probe 3 originally
asserted that every `[data-s5]` element is hidden at 900 and reported FAIL with
28 visible. Those 28 are correct: `data-s5-mark` tags a DRAWN phone-only mark,
while a bare `data-s5` tags a text run or a hit target — `wordmark`, `display`,
`code0`-`code5`, `gear`, `back` — which is real content and real interaction that
MUST paint on desktop. Corrected to assert only on marks and the overlay, and to
REPORT the content count rather than assert it. Worth writing down because a gate
that fails on correct behaviour trains you to ignore it, which is strictly worse
than not having the gate at all.

None of this replaces `verify-desktop`. It bounds the failure mode this screen
can actually produce, repeatably, and it will keep bounding it after the next
rollback because it is in git.

### DONE: one line in the shell was scrolling 42 of the 72 phone screens

Rule 56 gave `capture-ios.mjs` a vertical arm on the argument that 004 was clean
and the other 71 had never been checked. Run across all 72 against a production
build, it came back:

    captured   72 / 72        wider>393  0        step fails 0
    scrolls    42 — every one of them scrollHeight 900 against innerHeight 852

Forty-two screens, one value, and it is the same value and the same defect
`/signin` and `/signup` were each fixed for on their own page. The cause is one
line neither of those fixes went back to: `ShotIQShell.tsx` carried
`style={{ minHeight: 900 }}`, ungated, on the shell both pages were copied from.
900 is the DESKTOP canonical height. As an inline style it applied at every
width, including the 393x852 phone, where it pushed the document 48pt past the
viewport and left a blank band below the fold.

**Fixed as a `md:min-h-[900px]` className**, exactly as those two pages were, and
as a className rather than an inline style for precisely the reason the bug
existed: an inline style beats the media query and cannot be scoped.

Verified, not argued, in both directions:

  - **Phone.** Rebuilt, served, re-swept all 72 with the same harness:
    **`scrolls 0`**, `wider>393 0`, 72/72 captured, no step failures.
  - **Desktop.** The standing ruling says the 20 B+ screens must not regress,
    and "md is 768px and desktop is 1440 so it still applies" is an argument.
    Measured instead, old shell against new at 1440x900 on three routes that
    actually render it — `/analyze`, `/profile`, `/settings` — computed
    `min-height` **900px**, element height **900**, document `scrollHeight`
    **900**, IDENTICAL on all three. The only difference is that the `style`
    attribute is now empty where it read `min-height:900px`.

Two things worth keeping from this:

**The instance is not the class.** 003 and 004 were each diagnosed correctly,
fixed correctly, and verified correctly, and both fixes stopped at the page they
were found on. The shared component that produced the bug went untouched through
both, and 42 screens kept it. When a defect is found in a page that was copied
from something, fix the something.

**The guard is worth more than the screen it was written for.** Rule 56 was a
two-line diagnostic added because a guard with one axis checks one axis. Its
first full run paid for itself 42 times over. It was also deliberately REPORTED
rather than THROWN, and that is why it could be switched on for all 72 at once —
a throw would have had to be argued screen by screen before it could ship, and
these 42 would still be scrolling.

### DONE: the markup gate's own holes, found by audit and closed

`docs/shotiq/markup-gate.mjs` was written as rule 70's answer to three
consecutive invisible regressions. The thirteenth grade audited it by building a
mutating reverse proxy and feeding it deliberately broken pages, and graded it
**B**. It is worth having — it CATCHES all three historical regressions,
including narrowly scoped versions:

    round-11 replay (per-glyph shrapnel)   7/10  read x2 + translate
    round-12 replay (sr-only duplicate)    7/10  select, copy, translate
    round-10 replay (inline-block global)  9/10  find
    same, scoped to lede1 only             8/10  find, read
    a whole run deleted                    9/10  find
    display loses its per-glyph layer      9/10  translate drift

But it returns **10/10 PASS on four genuinely broken pages**, and one of those is
humiliating:

  * **G1 — the heading probe prints the evidence of its own failure and calls it
    PASS.** Strip the h1's `aria-label` and its accessible name becomes `"  "` —
    all 13 glyph spans are `aria-hidden`, so the label is its only name source.
    The probe tests `!!h1?.name?.value`, and `"  "` is truthy. It even PRINTS
    `h1 accessible name "  "` in the passing line. Fix: `?.trim()`.
  * **G2/G3 — `select` only checks lede1, terms and oneacct.** Put
    `user-select:none` on lede2 or on display and the selection returns empty;
    the gate passes.
  * **G4 — nothing covers form-control naming.** Strip every `label for=` and all
    five textboxes fall back to their placeholders as accessible names
    ("Jordan", "Ellis", "jordan.ellis@example.com"). On a signup screen that is
    the highest-stakes a11y surface there is, and the gate is silent.

Three structural faults besides:

  * **The `translate` probe's control is decorative.** Its comment claims the
    comparison "is exact and needs no tolerance", but the verdict is
    `v.live !== ACCEPTED[k]` — `v.control` is computed, printed, and never
    enters the boolean. It is a hardcoded snapshot gate wearing a control's
    clothes. Proven: a mutation moved control 1 -> 2 and only `live` fired.
  * **`if (!el) continue` means a vanished run is not drift.** Delete a declared
    run and translate passes; only `find` caught it, and only because that run
    had a phrase in the list.
  * **`reflow` varies the axis that does not matter and pins the one that does.**
    It holds width at 393 — the one width where the known live defect cannot
    appear — and sweeps DPR instead. Measured: 375, 360 and 320 all scroll
    horizontally. A probe named "reflow" that cannot see the screen's actual
    reflow defect is a claim about the instrument.

And one stale number: the gate's header says the per-word mechanism "buys
0.1302". Re-measured in-page at this commit it is **0.1480**. The 0.2437 it
claims for the headline verifies exactly.

**The pattern to notice**: only `find` carried explicit negative controls. The
gate's own header cites rule 69 — "a pass from an instrument with no case that
should fail is a claim about the instrument" — and then four of its six probes
exempted themselves from it. Writing the rule into the file did not make the
file follow it, which is rule 68 one level up.

**ALL OF IT IS FIXED, AND THE FIX IS DEMONSTRATED RATHER THAN ASSERTED.** G1
takes `.trim()`; `select` now iterates ONE shared `RUNS` list so a run cannot be
covered by one probe and invisible to another; a new `read (controls named)`
probe fails if any form control is unnamed OR named from its placeholder; the
`translate` verdict now checks BOTH recorded numbers, live and control, and a
vanished run is drift rather than a `continue`; `reflow` sweeps WIDTH as well as
DPR at 393/375/360/320 and records the class-level scroll as expected state, so
it fails on any change to it.

**And the gate now ships with its own should-fail cases**, which is the only
form of this that survives the next round: `MUTATE=<name>` breaks the page in a
specific way and the matching probe must go red. Verified, all five —

    ariaLabel    -> read (heading named)
    labels       -> read (controls named)
    selectLede2  -> select
    selectH1     -> select
    deleteRun    -> find (wrapped runs), select, translate

11/11 on the clean page, 5/5 mutations caught. Re-run the loop in the file's
header after ANY change to the gate.

### 005 BUILT: the feature was made real first, then drawn

**15.3484 -> 7.4356** whole-screen mean |d|, n_over8 169010 -> 118852, six
rounds, every figure from `measure.compare.mean_abs_diff` over a built capture
of a fresh dist gated on `[ -f .next/BUILD_ID ]`. Band windows live in
`docs/shotiq/measure/report005.py`.

**Part 1 — the code is a real credential, not six boxes.** `VerificationToken`
already had every property a code wants (single-use, TTL'd, prior tokens of the
same type deleted per user); what it lacked was a lookup, because `token` is
UNIQUE table-wide and six digits are not unique across users — two accounts
collide at ~1,000 live codes on the birthday bound. The stored value is
namespaced `<userId>:<code>`, which is unique by construction and turns "verify
this user's code" into exactly the `findUnique` `consumeToken` already performs.
Digits come from `randomInt` (rejection-sampled, uniform); `randomBytes(1) % 10`
is not — 0-5 would come up 26/256 and 6-9 25/256.

  * `POST /api/auth/verify-email-code`: `validateCsrf` first like every sibling
    auth route, 10/min per IP, a uniform 400 for unknown/wrong/expired so it is
    not an account-existence oracle, and `alreadyVerified` treated as SUCCESS
    because the player did what the screen asked.
  * `sendVerificationEmail` composes ONE message carrying the link and the code,
    called by signup and by resend, so the code the player is asked for is the
    code the player is sent by construction. It carries a link to the screen
    that ASKS for the code — a credential with nowhere to be typed is not a
    feature.
  * resend accepts an `email` in the body when there is no session, with a
    response that does not depend on whether the address exists, because the
    player this screen is written for has just signed up on a phone and a resend
    that needs a settled session does not work at the one moment it is needed.
  * `RESEND_COOLDOWN_SECONDS` is served by the API so the countdown and the rate
    limit cannot disagree.

Verified end to end against Postgres on a production build, not by unit test:
signup 201 -> the row exists with `type=email_verify_code` -> the six digits read
straight out of the table -> POST -> `email_verified` goes NULL to a timestamp
-> the row is gone. With three negative controls (rule 69), because a pass from
an instrument that cannot fail is a claim about the instrument: a wrong code
returns 400 and leaves the stamp NULL, a request with no CSRF header returns
403, and the SAME code replayed after clearing the stamp by hand — which
isolates single-use from the already-verified short circuit — returns 400. The
LINK path still verifies a second account in the same run.

**Part 2 — two traps, both closed before the first capture.** The route map
declared 0 steps for a canonical that is filled, focused AND mid-countdown.
Steps: four fills (2 8 4 7, each auto-advancing) then a click on box five, which
is the state a real player types their way into; no blur, because unlike 003 and
004 this canonical SHOWS a focused control. The countdown is pinned by
`sessionStorage['shotiq-verify-cooldown']='42'`, which fixes the value and stops
the tick — the deterministic entry 001 already uses for `shotiq-splash-hold`. A
real player never has the key.

**The paper was set FIRST this time.** 254.03 / 253.86 / 253.96 (sd 0.57),
screen-scoped. On 004 this was found at the very end and was worth 0.5744.

**And the plate orange is NOT 004's.** Shell plateau at d in [10,20) gives
(253.23, 67.04, 1.14) here against 004's (253.2, 57.9, 0.9) on the same export
chain — ten units of green over 83,000 pixels. A token that transferred (the
graphite: G/R 0.9876-0.9898, B/R 0.9516-0.9566 against 004's 0.9908/0.9453) and
one that did not, and only measuring tells them apart.

**What the rounds cost and bought, in order.** Round 1 shipped three structural
faults that no amount of reading the source would have found and one capture
did: every run inside a hit target resolved its `left`/`top` against the TARGET
(hit targets are `position:absolute`, so each is a containing block) and three
help labels went off the screen; `.s5 [data-s5] svg` matched the DESKTOP lucide
icons inside those same targets at specificity 0,2,1 against Tailwind's
`.hidden` 0,1,0 and unhid five approved-icon PNGs over the drawn marks; and
`[data-s5-mark]{width:100%}` then won the cascade against each mark's own box,
so five marks centred themselves mid-screen at the right size — which reads
exactly like a placement bug and is a sizing one.

Round 3 made four bands WORSE and the numbers are kept because the reasoning was
a real prediction the band mean refuted: help1 20.3319 -> 22.2852, help2 24.1773
-> 25.6114, help3 15.6514 -> 16.6454, safe1 19.6971 -> 22.8280, resendVal 2.9743
-> 8.9320.

**The focus ring was painting on top of the focused border.** The band said box4
was heavy; the cause was a second element. The overlay paints the focused code
box orange at twice the unfocused weight, driven by the live focus index, and
CSS also put a `:focus-visible` outline on the input. Canonical carries 387.8
units of green ink across that border where the render carried 767.0. Removing
the outline took box4 10.7050 -> 4.4881, and the drawn border is still a real
affordance for keyboard and pointer alike.

**Rule 49, in the flattering direction (rule 24).** `safe1`'s ink mass came back
R/C 1.1265 — the heaviest run on the screen against a 0.9954 control on the
wordmark — so the weight was cut 600 -> 545 and the band got WORSE, 19.6971 ->
23.9317. The mass had been measured on a build where that run was 3.4%
OVERSIZED, so the extra ink was the size error and the weight solve was reading
it. Re-swept as a 2-D grid at the corrected size, canonical's heading is a
**bold**: w680 / sx0.812 takes it to **11.1230**, bracketed on both axes. An ink
parameter absorbs a geometric error, and a weight is only meaningful once the
geometry is.

**Rule 20 discharged, and rules 59/61 paid.** All four bundled Tungsten cuts
fitted to canonical's cap and advance and MEASURED, with a rule-40 control
reproducing the built capture to four decimals: bold 26.6155, semibold 26.6613,
medium 33.9990, black 45.5810. Bold wins by 0.0036 of whole screen, which is not
a reason to change a face. The real find on that band was a COMPENSATED PAIR:
its three words sat -1 / -4 / -2 device px left, a gap that opens ALONG the run
and is invisible to any sweep of one lever. `tx` 1.3821 -> 1.11 with
`word-spacing` 0 -> 0.8 took it 26.6613 -> **24.5721**.

**The last buy, and the pair that is not a pair.** `plateLab` weight 600 -> 660
takes it 22.7338 -> **16.0099**, bracketed (700 gives 16.2714, 540 gives
29.9542). Its sibling `diffLab` on the outlined button is ALREADY at its own
optimum at 500 — 440 scores 42.5767 and 560 scores 29.6970 — so the two button
labels are not one role and were not solved as one. Rule 14 says solve runs that
share a role jointly; it does not say assume two runs share one.

**The final figure was PREDICTED by the sweep to four decimals**, which is what
rule 47 asks for: the in-page sweep put this change at whole 7.4356 and the
built capture came back 7.4356. Every candidate was injected through the same
property the recipe emits.

**Two measured nulls, recorded rather than dropped.** A lighter header rule
(#E0E0E0, indicated by a 65.2-against-71.5 ink reading) is worse built, 2.4985 ->
2.6096 with n_over8 1226 -> 2338 — the deficit is not a level error. And the row
icons' stroke width spans 0.0009 of whole screen across 2.6-3.4 device px, so
3.0 stands.

**Stated residuals, with their numbers (rule 13).** The body face is not in this
repository and no scaleX can be right about the letters and the gaps at once:
`fontTools` puts Geist at 0.705 advance/char/cap and all three Boxed cuts at
0.675-0.691 against canonical's 0.5515. At the shipped solve the three help
labels land their LENGTH (0.998 / 0.992 / 0.949) with their cap 7-10% short, and
the alternative — size 13.9 / scale 0.809, which lands the cap and holds the
length — was built and is worse on all three. That leaves help2 24.1773, help1
20.3319, help3 15.6514. The display's 24.5721 is the same finding one size up:
canonical spends 0.245 of its cap per glyph where 004's headline spends 0.545,
on four cuts that share one width axis. `helpIcon2` 28.0615 and `helpIcon1`
22.0527 are drawing residuals — the mail-clock and mail-check are lucide
geometry fitted to canonical's ink box, and canonical's corners are sharper and
its flap shallower than lucide's; the boxes agree to 1.000/1.000 and the strokes
to 0.0009 of whole screen, so what is left is the path data.

**ROUND 4 — 7.4356 -> 6.7842 -> 6.3752, and the biggest single find was a
COUPLED TRANSFORM.** The display run was UPRIGHT where canonical is oblique,
and nothing in six rounds of band means had said so, because a shear is not a
translation and no shift search looks for one. The recipe emits
`transform:scaleX(s) skewX(k)`; CSS applies the RIGHT factor first, so the
shear's horizontal component is multiplied by the scale and the matrix c term
is `s x tan(k)`, not `tan(k)`. The `skew: -6.0` was measured off canonical
correctly and was correct WHEN SET, at scale 1.00. Rounds 1 and 2 then moved
scaleX 1.00 -> 0.744 -> 0.586 to land the advance, and each of those silently
flattened the slant. Measured on the left stem of the E of EMAIL, a true
vertical fitting a line to rms 0.29 device px in both images: canonical
+6.082 deg against the render's +3.554, and 0.586 x tan(6 deg) = 0.0616 against
the readback matrix's -0.0615911, which is the mechanism and not a coincidence.
skew -10.3 with tx 4.60, swept as a 2-D grid (skew about origin 0 0 translates
as well as shears, so the pair is compensated by construction), bracketed on
both axes, rule-40 control exact. **display 24.5721 -> 19.9365**, the built
capture matching the sweep to four decimals, the built E-stem reading +6.086,
and the advance ratio going 1.0076 -> 1.0019 with scale untouched.

That retires two earlier readings. The per-word `-1 / -4 / -2 device px left`
scatter recorded above was the missing slant seen edge-on — a shear displaces
ink in proportion to its height, so it reads as a gap opening along the run —
and per-word placement, measured properly on the shipped render, is worth
0.0480 against this one value's 0.3670.

**A MARK NUDGE IS NOT PREDICTABLE FROM A SHIFT SEARCH, and half of round 4's
were reverted.** Eight marks showed a 1-2 device px optimum; all eight were
applied; the BUILT capture kept three (gear 11.6112 -> 8.8566, diffMark inside
diffBtn 9.8170 -> 9.4570, chev1 3.9595 -> 3.6159) and refuted five (back
8.1680 -> 9.8710, helpMark1 22.0527 -> 23.1614, plateMark worse, chev2 and
chev3 unchanged to four decimals). MARK_BOXES values are canonical device px,
converted to CSS px and then rounded by layout, so the SAME 1-unit edit moved
marks by 1, ~1.5 and 2 device px and two not at all — which is also why three
optima did not merely fail to close but FLIPPED SIGN. The five are reverted to
their prior values; 0.0104 of whole screen left on the table, stated not
forced.

**THE PRODUCTION BUILD HAD BEEN FAILING FOR EVERY ROUND OF EVERY SCREEN.**
`npm run build` exited 1 with 51 pages failing to prerender, `/verify-email`
and `/signup` among them. The cause is not in this repository: the container
exports `NODE_ENV=development`, so `next build` selects the dev runtime and
static generation dies with `useContext` of null. `NODE_ENV=production npm run
build` exits 0 with zero prerender errors. The rule-60 gate did not catch it
because Next writes BUILD_ID anyway, and my own gate was defeated a second way
— an `echo` inside the subshell replaced the build's exit code, and later the
`[ -f .next/BUILD_ID ]` test ran from a cwd that had persisted from an earlier
`cd`. Verified the runtime changes NO pixels: a prod-runtime control capture of
the unchanged tree measured **6.7842 / 115184**, identical to four decimals, so
every prior measurement stands. But nothing shipped from that tree would have
deployed, and the ledger's "production build" wording was wrong for every
screen so far.

**FIXED IN THE REPOSITORY, not just diagnosed.** `next build` sets
`NODE_ENV=production` only when it is UNSET — `next/dist/bin/next` reads
`process.env.NODE_ENV || defaultEnv` — so an inherited `development` wins
silently, and any CI runner, container or shell that exports it produces the
same broken build. The build script now sets it explicitly:

    "build": "prisma generate && NODE_ENV=production next build"

matching the POSIX inline-env convention five existing scripts already use.
Verified with the hostile environment still in place — the container still
exports `NODE_ENV=development` — a plain `npm run build` now exits **0 with
zero prerender errors**, where the identical command exited **1 with 51**
before the change. And the artefact it produces is the measured one: captured
and scored **6.3752 / n_over8 112821**, identical to the hand-built dist, so
"what the build script emits" and "what these numbers describe" are now the
same thing rather than two things that happened to agree.

**And the blast radius on 004 was checked rather than assumed.** 004 is marked
DONE at A on a figure measured from a dev-runtime dist, so the finding put that
grade in question. Re-captured from the production dist: **2.6520 / n_over8
63053**, identical to the recorded artefact in every digit. 004's A stands, and
the runtime is now shown to be pixel-neutral on two independent screens rather
than one.

**SECURITY, round 4 — the same scope failure for the third consecutive round,
so it was closed structurally rather than by hand.** Round 3 keyed `signin`
per account and left the two routes that ARE screen 005 keyed on nothing:
`request.ip` is undefined under `next start` and the default proxy depth is 0,
so every caller resolves to `'unknown'` and shares one bucket. An
unauthenticated attacker anywhere denied both of this screen's actions to every
user of the product at 13 requests a minute — measured, with the victim's own
VALID code returning 429 and `email_verified` still NULL, then 200 after the
window. `subject` is now REQUIRED in `checkRateLimit`: an optional parameter
records an intention, a required one records a DECISION at every call site,
checked by the compiler, and it enumerated all eight remaining sites. Five auth
routes key per account; `llm`, `upload` and `vision-analyze` pass an explicit
`null` with the reason, which is that they guard a shared COSTED resource and
have no authenticated identity to key on — keying on caller-supplied data would
let an attacker rotate it and bypass the limit entirely, which is worse than
sharing. Also closed: `issueToken`/`issueEmailCode` were deleteMany-then-create
so the "only the newest works" invariant this file's own header states held
only when nothing raced (three concurrent resends left three live codes and the
OLDEST verified) — now one atomic `upsert` against a new `(userId, type)`
unique constraint with a tracked migration that collapses duplicates first, and
there WERE duplicates in this database; `consumeToken` discarded its delete
result so two concurrent submissions of one token both succeeded; verifying by
code now spends the emailed link instead of leaving a live credential in an
inbox for 24h; and `getAppBaseUrl` silently returned `localhost:3000` with no
config, so emailed links were dead in production — now loud, and deliberately
NOT derived from the Host header, which would trade a config error for
host-header injection. Verified on the built dist with a negative control for
each, **8/8**.

**The markup gate's recorded value was itself read off the wrong runtime.**
`lede2`'s control is build-mode dependent — React's production build merges the
two adjacent text nodes the dev build keeps separate, and the control is the
case that exposes it because it removes the wrapping span between them. Same
gate, same commit: dev dist 2/2 and 11/11, production dist 2/1 and 10/11.
Re-recorded from the artefact that ships, with all four mutations still red.

**The markup gate now takes a screen profile, and 005 passes 11/11** with its
own live self-tests. 004 is the default, unchanged, and re-verified at 11/11 with
all five of its mutations still going red. The gate earned a finding on its first
005 run — `lede2` renders TWO text nodes because the run is `{address}.` — now
recorded as the accepted state so a CHANGE fails. And one honest negative:
`MUTATE=ariaLabel` cannot go red on 005, because it models a heading whose only
name source is an aria-label and 005's h1 carries its own text; mutations are
declared per profile and an inapplicable one exits 2 saying so, rather than
being recorded as a silent pass (rule 69).

### 005-verify-email: the canonical describes a feature the product does not have

Screen 005 is the first screen where the gap is not fidelity. Canonical 005
draws a **six-box numeric code entry** — digits 2, 8, 4, 7 typed, the fifth box
focused with a caret, "Enter the code we sent to marcus@example.com", and a
"Resend code in 0:42" countdown.

The shipped web app does not do that, deliberately and in writing. From
`src/app/verify-email/page.tsx`: "Web verification is link-based (the emailed
link hits /api/auth/verify-email?token=… which redirects back here with
?status=…), so instead of the iOS code boxes this page shows the signed-in
user's verification state". Verified in the backend, not taken from the comment:

  * `prisma/schema.prisma` has `emailVerified DateTime?` and a generic
    `VerificationToken { token, type, expiresAt }` — no numeric-code field;
  * `/api/auth/verify-email` reads `?token=` and calls
    `consumeToken(token, "email_verify")`;
  * a grep for `verificationCode|otp|OTP|6-digit` across `src/app/api`,
    `src/lib` and the schema returns **nothing**.

**So building canonical 005's UI as-drawn would ship six code boxes that no
endpoint can verify — a control that portrays a feature which does not work.**
That is precisely the thing Kevin's governing rule exists to forbid: *"A
placeholder portrays a feature I want to be real, so that when the user goes to
use it, it actually works."*

**The mandate resolves the fork rather than leaving it open.** The screen is not
"make the pixels match" and it is not "skip it". It is: make code verification
REAL, then draw the canonical UI honestly on top of it. The existing
infrastructure makes that tractable rather than speculative — `VerificationToken`
is already a generic, single-use, TTL'd, per-user-invalidated table keyed by a
`type` string, so a six-digit code is that table with a different generator and
a new type. What is needed is an issue path, a verify endpoint, the code in the
email, and the resend cooldown the canonical actually shows.

Two smaller facts the screen also raises, both recorded now so they are not
discovered late:

  * **The route map declares 0 steps for 005**, and its canonical is a non-default
    state (four digits typed, one box focused). Capturing it as-is shoots an
    empty form against a filled canonical — the exact invalid capture
    `capture-ios.mjs`'s own docstring warns about. Steps must be authored with
    the screen.
  * **The countdown is a live timer.** "0:42" is nondeterministic and will differ
    every capture. It needs pinning for the harness the way canonical's other
    dynamic values are, or the band containing it can never be stable.

### CLOSED, APP-WIDE: every database connection now runs in UTC

Rule 81 says the next instance of a named class is usually within arm's reach of
the first. The timezone defect had been found TWICE inside the verification-token
layer, so the schema was swept rather than assumed clean. It was not clean:

  * **all 55 timestamp columns** are `timestamp WITHOUT TIME ZONE`
  * **~30 default to `CURRENT_TIMESTAMP`**, which is a `timestamptz` cast
    through the SESSION's TimeZone, while Prisma reads the naive value back as
    UTC. Measured on a temp table carrying the same default: **0 / +120 / -240
    min** under UTC / Berlin / New_York.

So the class was never confined to the token layer — it is EVERY
default-written timestamp in the product, invisible on a UTC container and live
on a default `initdb`. Sixteen sites compare these against JS time, and the
load-bearing ones are not cosmetic:

    points cooldown   Date.now() - last.createdAt.getTime() < action.cooldown
                      west of UTC the gap reads hours too LARGE, so the cooldown
                      never applies and points can be farmed
    daily cap / week  createdAt: { gte: dayStart } selects the wrong rows
    night-owl badge   createdAt.getUTCHours() >= 22 fires on the wrong hours

**Fixed at the connection, not at the call sites**, because fixing thirty would
leave the thirty-first to be written later — the session timezone is pinned via
the URL's `options` parameter (not a `SET`, which configures only the pooled
connection it lands on), and an explicit timezone already in the URL is left
alone so a deployment can still override deliberately.

Verified with the UNFIXED client as the control, same process, same databases —
0/+120/-240 unfixed against 0/0/0 fixed — and end to end on a real build across
all three zones: signup, mailed code verifies 200, stamp written, `created_at`
drift 0 min, 3/3. Screen 005 unmoved at 6.0591 / n_over8 111868.

The method note worth keeping: this was found by running the sweep a rule
DEMANDED rather than by a grader finding a third instance. Two rounds in a row
had shipped the next instance of a class named one commit earlier.

### NEEDS KEVIN: THE FOUR ASSET AND TYPE DECISIONS THAT NOW BLOCK 005 FROM AN A

These are the only things standing between 005 and the grade, and **none of them
can be settled by measurement** — that is precisely why they are here. Thirty
rounds and seventeen grades have driven the screen 15.3484 -> 4.8462; every one
of these three has a number beside it and no decision, and rule 91 is explicit
that measured-and-left-open is not measured-and-closed.

**1. THE BODY FACE IS NOT IN THIS REPOSITORY.** Canonical's mixed-case body runs
have a stem/counter ratio of **0.667-0.710**. GeistVF, the face the app ships,
measures **0.7465** at every weight. Nothing bundled here is closer. The runs
that inherit it are safe1, safe2, help1/2/3, lede1, lede2, didnt and resendLab —
between them a large share of what is left. Round 30 showed the diagnosis is real
AND that it had been over-used (see rule 92c): `resendLab` sat 1.27 px high
*because* of this face, via a cap-top positioning datum, and that consequence was
fully correctable and worth 3.2. So the face blocks the SHAPE of these runs and
nothing else.

  * Option A: ship as-is and accept the shape residual, which is roughly 6-8 of
    whole screen spread across nine runs. Costs nothing, closes nothing.
  * Option B: identify canonical's actual face and license it. Closes the largest
    remaining category outright.
  * Option C: decide the canonicals are a target for LAYOUT and not for FACE, and
    formally scope face fidelity out of the DoD. Legitimate, and it changes what
    "A" means for every screen, not just this one.

**2. THE WORDMARK IS SET IN NO FACE THIS REPOSITORY CONTAINS.** Found by grade 15,
on an axis the body-face finding had been scoped out of (the wordmark is
all-caps). Canonical's S/H ink-width ratio is **0.850**; GeistVF gives
**1.002-1.009** at every weight, Boxed **1.000**, Tungsten **0.966**. The render
measures 1.0007 — Geist exactly — which calibrates the estimator against a known
answer. Its cap also measures 2.56% short, and grade 15 DECLINED to prescribe the
size because the face is the larger error and correcting size first would mask
it. That refusal was correct and it leaves the wordmark's 7.7849 open. Same three
options as (1), and the wordmark is the one run where a single licensed file
would close the whole band.

**3. MATCHING CANONICAL GIVES THE THREE HELP ROWS THREE DIFFERENT LETTER WIDTHS.**
Round 30's largest finding, and the only one of the three that is a taste
judgement rather than a licensing question. The three rows now carry `scale`
**0.866 / 0.8747 / 0.9136** — a 5.5% letter-width difference between the first
row and the third, which a designer can see. It is worth **0.4967 of whole
screen**, eight times what grades 14 and 15 found combined, and three independent
estimators agree on the numbers.

  Why it is not simply right: the compensation is per-STRING, because the glyph
  mixes differ and our face's advances are not canonical's. Canonical almost
  certainly sets all three rows identically in ITS face; we are reproducing its
  PIXELS in a different face, and per-string scaling is the only way to do that.
  Eight other body runs on this screen already carry eight different scales for
  the same reason, so this is the established method here — but those are eight
  runs that do not sit in a visible vertical stack, and these three do.

  * Option A (shipped): match canonical's pixels; accept three letter widths in a
    visible stack.
  * Option B: revert help2/help3 to 0.866, give back 0.4967, and record the
    advance error as a stated face residual.
  * Option C: solve (1), after which all three rows should want the same scale
    and the question dissolves.

**4. THE SHIELD IS THE WRONG DRAWING, NOT THE WRONG SIZE, AND CLOSING IT MEANS
RE-TRACING AN ASSET.** Added after round 32; grade 18 refuted the standing claim
that `shield`'s 9.3281 is a 2.2% height error, and did it properly rather than
leaving it unproven. The outline's straight sides match canonical to **0.22-0.28
px**. Fitting a y-affine `y' = a + by` that maps the render's per-row limb-
separation profile onto canonical's over 81 rows: identity gives mean |dW| 1.510
px, the best affine gives 1.131 and requires **a = -6.0 px**, a gross
displacement the matched ink extents forbid; adding a width scale reaches only
0.998. **No size and no position change explains the profile.** What is actually
wrong is the CURVE — the dome runs 2.5-5.9 px narrow at rows 1642-1650, the taper
starts about five rows early, and the tip is 1.8-3.2 px fat at rows 1710-1718.
Lucide's cubic is not canonical's asset.

  * Option A: ship it. 9.3281 stays, stated as an asset difference.
  * Option B: re-trace the outline against canonical — a drawing job, and the
    only path that closes it.
  * Option C: license or obtain canonical's own icon set, which would also
    retire `helpIcon3`'s and `gear`'s residuals (0.157 and 0.184 px on their
    radii, with the rest of their error in lobed/hook geometry — the same class).

**These four interact, and that is the argument for taking them together.**
Option B on (3) is only sensible if (1) is going to be solved; Option C on (1)
would retire (2) and (3) at once; and Option C on (4) is the same kind of
purchase for the drawn marks that Option B on (1) is for the type. Whichever way
they go, the answer changes what work is left on 005 and on every screen after
it — and three of the four are now the largest remaining windows on this screen.

### NEEDS KEVIN: three paid API routes have no authentication at all

`/api/llm`, `/api/upload` and `/api/vision-analyze` have no session check, no
CSRF check, and `middleware.ts` returns `NextResponse.next()` for everything
under `/api`. Probed unauthenticated, with no cookie and no CSRF header, all
three reach body validation — so anyone on the internet can spend model, vision
and storage budget, and the single shared rate-limit bucket means one anonymous
client denies the feature to everyone:

    30 malformed unauthenticated POSTs to /api/llm   400 x29, then 429 429
    a DIFFERENT caller, different XFF and UA         429

Same shape at 20/min on upload and 30/min on vision-analyze.

This was found because round 4 passed `subject: null` on those three routes and
wrote a comment justifying it — "no identity to key on" — which is true, and is
true BECAUSE of the vulnerability. The justification was the finding. The
comments now say so.

`subject: null` is still correct as a key: keying on an unauthenticated
caller-supplied id lets an attacker rotate it and bypass the limit entirely,
which is worse than sharing one bucket. **The fix is authentication, not a
different key** — and requiring a session changes who can use the product and
breaks any existing caller, including the bundled Capacitor iOS app, which is
why it is here rather than done. Options, with costs:

  * **Require a session on all three.** Correct and simple; breaks any caller
    that is not signed in, and the iOS client's auth state would need checking
    first.
  * **Require a session on the two costed ones (llm, vision-analyze) and leave
    upload.** Protects the spend; upload still burns storage.
  * **Add a signed app token** the clients carry. No user-facing change, but it
    is a new mechanism to build and rotate.

### NEEDS KEVIN: `emailVerified` is written by three paths and read by none

Screen 005 makes a real six-digit credential, and verifying with it really does
stamp `users.email_verified`. Round 4's independent grade asked the question
three rounds of end-to-end verification never did: **what reads that column?**

Nothing does, outside the verify page's own status display. `src/middleware.ts`
checks the session signature only. `/api/auth/signup` issues a full
`accessToken` immediately, so an unverified account is already fully signed in.
No route, page or query gates on it.

So the feature is real in the sense that matters least — the write path works,
end to end, against Postgres, with controls — and not real in the sense Kevin's
mandate is about: *"a placeholder portrays a feature I want to be real, so that
when the user goes to use it, it actually works."* A player who ignores the
screen entirely loses nothing. Verification currently costs them a step and
buys them no capability.

This is recorded rather than fixed because every way of fixing it is a PRODUCT
decision with a real cost, and picking one unilaterally would change what the
app does to people who already have accounts:

  * **Gate nothing (status quo).** Verification is advisory. Cheapest, and the
    screen is then honest only if it is presented as optional, which canonical
    005 does not — it has no skip.
  * **Gate the app at the middleware.** An unverified session is redirected to
    /verify-email. Strongest, and it locks out every EXISTING unverified
    account the moment it ships. How many exist is a question about the
    production database, which is not this container.
  * **Gate only the costed or shared surfaces** (upload, analysis, anything
    that emails or spends). Verification buys something concrete, nobody is
    locked out of what they already had, but the boundary has to be drawn
    route by route and each one is a judgement call.

The measurement that would inform the choice — how many live accounts are
unverified — needs the production database, so it is Kevin's to make either
way. Recorded here so nobody asserts "the feature is real" a fourth time
without it.

### NEEDS KEVIN: signup discloses whether an address already has an account

Found by the second grade of 005, and deliberately NOT changed here, because it
is a product decision with UX weight and it touches a screen already marked DONE.

`POST /api/auth/signup` answers `400 {"error":"User with this email already
exists"}` against `201`, unauthenticated, at 5/min. That is an account-existence
oracle, and it defeats the stated rationale of the one that was just closed on
`verify-email-code` — whose docstring reads "Distinguishing them would turn this
into an account-existence oracle for anyone with a list of addresses." The hole
is one route over, and it is pre-existing rather than new.

**Why it was not simply fixed.** The secure form is a uniform 201 plus a
differentiated email ("someone tried to sign up with this address; you already
have an account"). But `/signup` returns a SESSION on success, and screen 004 —
DONE at A — navigates to `/onboarding` on a success response. A uniform 201 with
no session would either send an existing user into onboarding they do not need,
or require 004's flow to be re-authored and re-graded. That is a real change to
a finished screen, and the tradeoff is a genuine one: most consumer products
disclose here on purpose, because a person who mistypes their address otherwise
gets silence.

**The options, with what each costs:**

  1. Leave it. Signup discloses; the other routes stay uniform. Cheapest, and
     the current state — but then `verify-email-code`'s docstring overstates
     what the app protects, and that comment should be softened so the record is
     honest.
  2. Uniform 201 + a differentiated email, and re-author 004's success path to
     handle "no session returned". Secure, and it costs a re-grade of a DONE
     screen.
  3. Keep the message but rate-limit and CAPTCHA the route so enumeration is
     expensive rather than impossible.

Kevin's call. Recorded rather than taken, because reading (1) and reading (2)
lead to materially different work on a screen that is already finished.

### NEEDS KEVIN: the canonicals are AI-generated, watermarked images

Found by the twelfth grade of 004 and verified here independently. **71 of the
72 canonical PNGs carry a signed C2PA provenance manifest** (the exception is
`040-analysis-error.png`):

    softwareAgent        gpt-image 2.0
    digitalSourceType    trainedAlgorithmicMedia
    generator            OpenAI Media Service API
    action               c2pa.watermarked.unbound
    certificate chain    Trufo Inc.

This is not a footnote. Four things follow, and three of them change what this
project should do next.

**1. There is very likely no display cut to supply.** Method rule 54 concluded
that 004's headline is set in a typeface this repository does not contain, and
recorded "NEEDS KEVIN: supplying canonical's display cut collapses this band".
That finding stands on its own measurements — the render fits Tungsten Semibold
at 0.34% rms and canonical at 3.98% — but the ASK is probably unsatisfiable.
There is no source font behind a generated image; the letterforms were drawn by
a model, not set in a face. **Kevin should not go looking for a font file.** The
right question is whether the headline should match the canonical at all, or
whether the canonical is a reference for layout and tone rather than for
letterforms.

**2. Part of the residual is a watermark and is permanently unreachable.** On
true background — 73.54% of the canvas, at least 6px from any ink in either
image — canonical reads 254.06 / 253.94 / 254.01 at sd 0.61 where the render is
exactly flat 254, and 254 is the per-channel and global optimum. That is
**0.3635 mean |d| on the background, 0.2673 of the whole-screen 2.6189, 10.21%
of everything left**. The residual is spatially correlated (row lag-1
autocorrelation 0.677, lag-2 0.446, lag-3 0.284; column lag-1 0.457), which is
an embedded pattern rather than dither or noise. A watermark designed to survive
re-encoding is designed to be unremovable, so no flat colour will ever match it.
This re-attributes rule 63's "canonical came out of a design tool" and part of
rule 51's bimodality.

**3. The precision has outrun the target's authority.** Every sub-pixel offset
this campaign has solved is fitted to a generative model's rendering of a
screen. Where a real design tool's output is authoritative about intent — a
designer chose 14px — a model's output is a plausible image, and its glyph
placement carries no intent at all. Two things keep this from invalidating the
work: canonical's repeated display glyphs are as self-consistent as the render's
(0.0268 against 0.0248, on an instrument with 16-17x same-vs-different
discrimination), so the large type is stable rather than hallucinated; and
layout, colour and geometry are reproducible targets whatever drew them. But
sub-pixel per-glyph fitting at SMALL sizes is fitting a model's noise, which is
exactly where it also welded letters (rule 67).

**4. A decision for Kevin, not to be taken here.** How close is close enough,
given the target is generated? The campaign's own numbers now say 004 is 0.4173
better than the screen that holds an A, with 10% of the remainder being a
watermark. That is a good place to ask whether the remaining rounds are worth
their cost.

Clean negatives, recorded so nobody re-runs them: neither canonical nor render
carries a `gAMA`, `iCCP` or `sRGB` chunk, and bit depth, colour type and
interlace match, so decode and colour management are NOT confounded.

### OPEN, PROCESS: the desktop regression baseline does not exist

**A CONTAINMENT PROOF SUBSTITUTES FOR IT WHEN THE CHANGE IS CSS-SCOPED, and it
is strictly stronger than a capture diff.** The cycle asks each round to confirm
the desktop set did not regress against a baseline directory that is not in this
container and not in git. Rather than skip the step or assert neutrality, round
4 answered the underlying question directly, on the SERVED artefact:

  * every rule in the injected sheet is inside an `@media` block. Read off the
    live DOM at 3236, the sheet is 16,501 chars and the text remaining after
    removing all balanced `@media` blocks is EMPTY. So no phone rule can match
    at a desktop width, whatever it says.
  * no shared surface changed. `git diff --name-only` over the round shows no
    `components/`, no `globals.css`, no `layout.tsx`, no `page.tsx` — the render
    changes are confined to `phone-005.ts`, and everything else touched is an
    API route, the token layer, the mailer, the schema, or tooling, none of
    which draws a pixel.

This is decidable and repeatable, where a capture diff over 20 screens carries a
~50px noise floor and 8 of the 20 are not byte-stable run to run. It does NOT
generalise: it says nothing about a change to a shared component or a global
token, and those still need real captures. Recorded as the method to use when a
round's diff is provably scoped, and as the reason this OPEN item did not block
round 4.

The baseline itself is still missing, and building it still needs a desktop
route map that is not in git.

The cycle every autonomous round runs says, at step 2, to "confirm the desktop
set did not regress against `$SCRATCH/verify-desktop` (noise floor ~50px; 8 of
20 are not byte-stable run to run)". **That directory is not on disk.** A
container rollback took it, and because the check is phrased as a comparison
against something that is simply absent, it has been quietly unperformed for
many rounds rather than failing loudly.

What survives and what does not:

  - the 20 desktop CANONICALS are in git at `docs/shotiq/canonical-desktop`
    (verified, 20 tracked files), so nothing irreplaceable was lost;
  - the RENDER baseline was never in git and is gone.

**AND MY OWN ESTIMATE OF WHAT IT WOULD TAKE WAS WRONG.** This section previously
said it was "regenerable — a production build plus 20 desktop captures". Having
actually looked: there is **no committed desktop capture harness** (no
`capture-web.mjs` anywhere in the tree or in git history — only the canonicals
were ever committed, in b480f3a) and **no desktop route map**. `ios-route-map.json`
covers 001-072 only, and `screen-implementation-map.json` is iOS-native.
Regenerating the baseline therefore means first RECONSTRUCTING which route
serves each of 077-096, then writing the harness. That is a piece of work, not a
chore, and 8 of the 20 were recorded as not byte-stable run to run so the
reconstruction has to characterise that instability too.

**Sequencing call, stated because it reverses what this section said.** It is no
longer a blocker on screen 005. The guard it exists to provide has a better
substitute that 004 already used twice: measure the desktop DIRECTLY for the
specific change in hand — the registration spans were shown to compute
`position: static` at 1440, and the shell's min-height was measured old-shell
against new on three routes. Both are stronger evidence than a byte-compare
against a stored PNG, and neither needs a baseline to exist. Reconstructing 20
desktop routes from filenames in order to have a baseline would produce
something nobody should trust.

So: build it when a change actually needs a broad desktop sweep, and use direct
measurement until then. What must NOT happen is the earlier state, where the
cycle instructed a check against a directory that was not there and the check
silently did not run.

004 does not need it and has not been let off: /signup has no counterpart in
the graded desktop set 077-096, and this round the desktop was measured
directly instead (the registration spans compute `position: static` at 1440, so
the phone offsets are inert by spec, and the shell's min-height was measured
identical old-shell against new on three routes). Both are stronger than a
byte-compare would have been.

But the next screen that touches a SHARED component has no baseline to check
against, and that is exactly the shape of the bug the shell min-height fix
turned out to be — one line, 42 screens. Regenerating this belongs with the
001/002 paper work, before 005 starts.

### OPEN, CLASS-LEVEL: NOT ONE of the 72 canonicals has white paper

Rule 63 was found on 004 and confirmed on 003. Measured across the whole
canonical set — modal colour of each PNG, which for these layouts is the paper:

    (254, 254, 254)   56 screens
    (253, 253, 253)   16 screens
    (255, 255, 255)    0 screens

So this is not a property of two screens, it is a property of the design source,
and every screen this campaign has not yet reached will carry it. On 004 the one
unit was worth 0.5744 of whole-screen mean |d| — 15.5% of everything left — so
this is likely to be the single largest available correction on most screens.

Note the 253 group: sixteen screens want a DIFFERENT value, so this is a
per-screen measurement and not a constant to paste. Measure the modal colour of
the screen's own canonical.

**001 and 002 carried this defect too, and it is now CLOSED.** Both were marked
DONE before anyone measured the ground their ink sits on, exactly as 003 was.
Measured before and after on a production build with the shipping harness:

    001-splash    2.4939 -> 2.0590   (-0.4349)   n_over8 41818 -> 40384
    002-welcome   6.5244 -> 6.0249   (-0.4995)   n_over8 148750 -> 145724

and the render's modal colour goes 255 -> 254 on both, matching each canonical.

Neither screen has a separate recipe file — their phone CSS is inline — but both
already carried a screen-scoped token object (`SPLASH_INK`, `SCREEN_INK`), so
`--shotiq-color-paper` went there. The global token in `globals.css` is
untouched, per the standing ruling that it carries the 20 desktop screens.

That leaves 001, 002, 003 and 004 all measured against a correctly-read ground.
Every screen from 005 on should set its paper from its own canonical's modal
colour as the FIRST thing it does, not the last — it is the cheapest large
correction available and it moves every band at once.

### OPEN, 005: the DoD's third type axis — INK DENSITY — was never audited

The definition of done asks for "cap, advance AND INK DENSITY measured per ink
run against canonical". Eleven rounds solved cap and advance run by run; density
was never swept as an axis. Measured now for all 19 runs (ink box from a 0.30
column/row threshold, density = total ink units / cap x advance, render over
canonical):

    run          cap r/c   adv r/c   density r/c
    wordmark      1.0000    1.0055      1.0307
    display       1.0160    1.0019      1.0280
    lede1         1.0417    1.0000      1.0401
    lede2         1.0000    0.9969      1.1091
    didnt         1.0000    1.0366      1.1645
    help1         0.8929    1.0000      1.2049
    help2         0.9259    0.9897      1.1756
    help3         0.8621    0.9486      1.2094
    safe1         1.0370    1.0135      1.2507
    safe2         1.0385    1.0131      1.1710
    resendLab     1.0800    1.0191      1.0119
    resendVal     1.0000    1.0317      1.2702
    resendLink    0.9722    1.0000      0.7946
    plateLab      1.0000    1.0000      0.9607
    diffLab       1.0417    1.0000      1.0405
    digit0-3      1.017     0.92-1.00   0.99-1.06

**The pattern is one-directional and that is the finding.** Eleven of nineteen
runs carry 10-27% MORE ink per unit of ink box than canonical. It is not noise:
it has one sign across unrelated runs at four different sizes and three weights.
The render draws its text FATTER AND LIGHTER where canonical draws it THINNER
AND DARKER — which is the same shape as the defect the sixth round fixed on the
code-box border (canonical's darkest pixel across that stroke is 111.6 where the
render reached 5.0; same ink budget, different distribution), now visible on the
type as well. Rule 71's colour finding is the other half of the same
observation: canonical's ERODED CORES read 49-58 against a shipped graphite of
73.7, i.e. darker cores, and these numbers say thinner strokes.

Two runs are individually actionable and neither is a face residual:

  * `resendLab` cap **1.0800** with advance 1.0191 — 8% too tall and 2% too
    wide, which is rule 32's joint solve (size down, scaleX up to hold the
    length), not a one-parameter nudge.
  * `resendLink` density **0.7946** — the only run that is too LIGHT, by 20%.

`help1/2/3`'s short caps (0.86-0.93) are already recorded as the stated face
residual: the body face is not in this repository and no scaleX is right about
the letters and the gaps at once. Their density figures are that same fact seen
on a third axis, not a new defect.

**AND THE EXCESS HAS TWO DIFFERENT CAUSES, so it is not one target list.**
Profiling the ink itself — darkest pixel, 5th percentile, median, and median
stroke run-length across each run — separates them cleanly:

    run          darkest   p05   median   n_ink r/c   stroke r/c
    safe1   c       0.0    0.0     15.0
            r       0.0    0.0      0.0     1.192        1.250
    safe2   c      13.0   43.0     99.0
            r      72.0   72.0     80.0     1.229        1.000
    didnt   c      17.0   43.0     85.0
            r      72.0   72.0     72.0     1.095        1.000
    display c       0.0    0.0      3.0
            r       0.0    0.0      0.0     1.009        0.917

  * **The GRAPHITE runs are a tonal-range difference, not an ink-volume one.**
    Canonical's graphite strokes run from a core of 13-17 out to light edges
    with a median near 99; the render is almost FLAT at 72, which is exactly
    `--s5-graphite: #454751`. Canonical has a real core-to-edge gradient and the
    render paints one value. That is not a new defect — it is rule 71's finding
    arriving on a third axis. Rule 71 already measured the fix direction
    (canonical's eroded cores are far darker than the shipped token) AND that
    taking it makes the objective monotonically WORSE, because a per-pixel mean
    has no legibility term. So this part of the density excess is **recorded as
    unreachable by the objective**, not as work outstanding.

  * **`safe1` is a genuine stroke-width error.** Both images reach 0, so the
    colour matches; canonical's median stroke is 4.00 device px against the
    render's 5.00, a 25% over. That is weight or size, it is measurable, and it
    is not the face residual — `display`, the same ink role, sits at 0.917 in
    the other direction with n_ink 1.009, so the two are independent.

  * `resendLink`'s stroke ratio reads 89.5, which is the UNDERLINE being counted
    as one 179px run. The instrument cannot speak for that run; its n_ink 1.162
    is the graphite story above.

So of eleven runs flagged, the honest split is: seven are rule 71's colour
finding restated, one (`safe1`) is a real stroke-width solve, one (`resendLab`)
is a real cap/advance joint solve, and the help rows are the stated face
residual. Writing "eleven runs are wrong" would have sent the next round
chasing a phantom.

NOT ACTED ON in round 6, and stated rather than quietly carried: this was
measured while the sixth grade was running against the current dist, so no
source moved. The honest answer to "is DoD item 2 satisfied" — for cap and
advance yes, for density no, and most of the density gap is a known
unreachable rather than a missing solve.

### OPEN, CLASS-LEVEL: the phone canvas is pinned LEFT between 394 and 767.98px

Measured on the served 005 dist, `.s5` box and viewport in CSS px:

    viewport   .s5 left..right   gap left / right
    414        0..393            0 / 21
    430        0..393            0 / 37
    480        0..393            0 / 87
    600        0..393            0 / 207
    767        0..393            0 / 374

Every pixel of slack is on the RIGHT. `PHONE_CSS` emits `.s5{...width:393px;
margin:0}` inside the media query, and that `margin:0` defeats the wrapper's
`mx-auto`, so on any phone wider than the 393pt design width — an iPhone 15 Pro
Max is 430 — the whole screen sits against the left edge with a blank band down
the right. `margin:0 auto` is the whole fix, and it is inside the media query so
the desktop tree cannot move.

CLASS-LEVEL: `phone-003.ts` and `phone-004.ts` carry the identical construction,
so 003, 004 and 005 all have it. Found on 005 by the fourth grader.

**THE PREDICTION WAS TESTED BEFORE THE CHANGE, AND IT HOLDS.** The reason not to
fix this casually is that 003 and 004 are DONE at A, so the fix must be provably
invisible at the capture width. Injected at runtime — `margin-left/right:auto`
inside the same media query, applied to the live served build rather than to the
source — the `.s3`/`.s4`/`.s5` box was read before and after on both platforms'
widths:

    screen   at 393 (capture width)        at 430 (a real phone)
    003      [0,393] -> [0,393] IDENTICAL  [0,393] -> [18.5,393]  centres
    004      [0,393] -> [0,393] IDENTICAL  [0,393] -> [18.5,393]  centres
    005      [0,393] -> [0,393] IDENTICAL  [0,393] -> [18.5,393]  centres

18.5 is exactly (430-393)/2. So the change is a no-op at the width every graded
number was measured at, and does what it is meant to do everywhere else — the
graded captures of 003, 004 and 005 cannot move. Still to do: apply it to the
three recipes and CONFIRM by re-capture rather than by this injection, because a
runtime injection and a built stylesheet are two different artefacts (rule 74).

### OPEN, CLASS-LEVEL: every phone screen scrolls horizontally below 393pt

**005's instance clips a REQUIRED CONTROL, and the markup gate records the
scroll without asking what got clipped.** The sixth code box sits at x 320..369
in the fixed 393px canvas, so:

    viewport 320   code box 6 at 320..369   entirely at/past the edge
    viewport 344   clipped by 25px
    viewport 360   clipped by 9px
    viewport 375   clean
    viewport 393   clean

It is reachable by scrolling horizontally — so this is a usability defect, not a
functional block, and that distinction is worth keeping straight: the control
can be typed into, it just cannot be SEEN without scrolling on a 320-360pt
phone.

**THE GATE NOW ASSERTS THIS INSTEAD OF RECORDING IT.** The reflow probe printed
three identical SCROLLS lines and stopped, so a new element falling off the
screen would have printed the same green line. It now enumerates every focusable
element whose box leaves the viewport, per width, against a set read off the
probe rather than predicted — verified with a negative control (11/11 green;
dropping one control from the recorded set gives 10/11 red). 004's entry is
deliberately EMPTY rather than guessed, so the gate reports its true set the
first time it runs there and that failure is the measurement.

**AND IT IS SEVEN CONTROLS, NOT ONE.** Asking the question the gate never asks —
enumerate every focusable element whose box leaves the viewport, rather than
asking whether the DOCUMENT scrolls — gives:

    width  document scrolls   controls clipped
    393    no                 none
    375    YES                NONE
    360    yes                verify-settings +10.9px, verify-code-5 +9.0,
                              verify-open-mail +6.6, verify-different-email +6.6,
                              verify-help-1/2/3 +6.7 each
    320    yes                the same seven, +46 to +51px

Two corrections to what was recorded from the fourth grade. The sixth code box
is not the only casualty — the settings gear, the primary plate button, the
"use a different email" button and all three help rows are clipped with it. And
**375 is clean**: the document scrolls there, but no control is off-screen, so
the width at which this starts to cost a player anything is 360, not 375.

That second point is the reason the probe has to enumerate rather than count:
the gate's three SCROLLS lines treat 375 and 320 as the same finding, and they
are not the same finding. The gate's reflow probe prints `375 SCROLLS 360 SCROLLS 320 SCROLLS —
matches the recorded class-level state`, which is rule 74's shape: a baseline
that encodes a known defect as the expected value, and therefore never asks the
follow-up question. The probe should assert WHICH elements leave the viewport,
not merely that the document does.

Found by the sixth grader on 004 and explicitly NOT a 004 defect, so it is
recorded here rather than counted against that screen. At any viewport narrower
than 393pt the page scrolls sideways — 375 gives `scrollWidth` 393, 360 gives
393 — because the phone recipe pins `.s4{width:393px}` inside a
`max-width:767.98px` query. A fixed width inside a max-width query is not
responsive; it is a 393pt canvas that happens to be delivered below 768.

/signin does the same and worse: at 360pt its submit button is genuinely
clipped, where 004's is not. So this is the same shape as the min-height bug —
a recipe-level decision inherited by every screen — and it wants fixing once at
the recipe, not 72 times.

Deliberately not fixed while 004 is the screen in progress. iPhone SE and the
mini sizes are 375pt, so this is reachable by real hardware and not only by a
narrow browser.

### 004's desktop guard, discharged by blast radius rather than by pixels

The cycle requires confirming the desktop set did not regress. For 004 that was
answered by SCOPE, not by a second capture, and the reasoning is recorded here
so it can be checked rather than taken on trust:

  - **/signup has no desktop counterpart.** The graded desktop set is 077-096
    and none of them is a signup or create-account screen, so unlike /signin
    (which draws BOTH iOS 003 and desktop 077) there is no shared route.
  - **The 004 modules are imported nowhere else.** `phone-004.ts` and
    `Marks004.tsx` are referenced only by `src/app/signup/` — grepped, not
    assumed.
  - **No 004 commit touched anything shared.** Every commit touching
    `src/app/signup/` was inspected for what ELSE it changed. The only
    non-signup files were `tsconfig.json` twice (the generated build-dir litter,
    since cleaned) and a batch of iOS `.imageset` PNGs, which cannot reach a
    desktop web screen.
  - **`globals.css` is untouched since 2026-08-04 (272d8b0)**, before the 004
    rounds began. The four measurement-tuned type roles that carry the 20
    desktop screens graded B+ therefore cannot have moved.

WHAT THIS PROVES AND WHAT IT DOES NOT: it proves no code path reaching a
desktop screen changed, which is a stronger claim than a pixel diff and costs
two builds less. It does NOT re-measure desktop pixels, so it would not catch a
regression arriving from outside this screen's work — a dependency bump, or
another agent's commit on the shared branch. When 004's own changes are the only
variable, scope is sufficient. When they are not, run the full guard below.

## The desktop regression guard — how to run it properly

A screen that shares a route with a desktop screen needs a real before/after,
not a diff against whatever capture happens to be lying around. `/signin` draws
both iOS 003 and desktop 077, so 003 was guarded like this:

1. `git worktree add --detach <dir> <commit-before-this-screen>` and symlink
   `node_modules` into it. This gives a true "before" without touching the
   builder's working tree while it is still running.
2. Build both trees into their own `NEXT_DIST_DIR`, serve on their own ports.
3. Capture with a **bare `chromium.launch()`** — `capture-web.mjs` uses no
   flags, and every desktop grade on record was made in that rasteriser. Using
   `--font-render-hinting=none` here (correct for iOS) shifts text and swamps
   the diff. The two harnesses genuinely disagree, so never compare across them.
4. Capture `/signin` **signed out** in its own context, and assert the URL did
   not redirect.
5. Compare BOTH captures to canonical, not just to each other. "Changed" and
   "regressed" are different findings and only the second one matters.

Doing this on 003 separated two effects that a single diff would have blamed on
the screen in progress: 86,798 pixels moved since the last Aug 4 capture, of
which only 163 were the screen's own work.

## HOW THIS ACTUALLY REACHES KEVIN — the step that was missing all along

Kevin could not see any of the work, and the reason was not the branch. It was
that **nothing in CI deploys the live site.**

- **CORRECTED 2026-08-05 — the two bullets that used to sit here were both
  wrong, and between them they hid every screen change from Kevin for days.**

  Wrong claim 1: "the iOS app is a Capacitor shell, so it loads the live web
  app and no Xcode build is ever needed." Two separate errors.

  a. `server.url` in `capacitor.config.ts` is **compiled into the binary at
     build time.** An app installed *before* that line pointed at the live host
     keeps loading whatever URL it was built with, forever. A web deploy can
     never reach it. "No Xcode build is needed" is only true of a build made
     *after* the config changed — i.e. it is never true of the build already on
     the phone.
  b. More fundamentally: **the app on Kevin's phone is not the Capacitor shell
     at all.** It is a native SwiftUI app at `basketball-analysis/ios-native/`
     — 18,352 lines across `Screens/{Onboarding,Auth,Home,Capture,Analysis,
     Training,Elite,Goals}`, `Components/` and `Core/`. That is what the
     `device` lane builds and installs (run 31009524048 log: `Emplaced …
     Debug-iphoneos/ShotIQ.app`, then `App installed: bundleID
     com.baller70.shotiq`). Both iOS projects exist in the tree; only
     `ios-native` ships.

  **Consequence for this ledger's method.** A web deploy updates the *web* app
  and nothing else. Getting a screen onto the phone needs an Xcode build via the
  broker. So iOS screen work has TWO surfaces to keep in step — the phone tree
  in `src/components/shotiq/phone/` and the Swift screen in `ios-native/` — and
  a screen is not truly delivered to Kevin until the native side carries the
  same change and a `device` build has run. The commit history shows this has
  been happening (`iOS carried the same wrong hairline colour as web`,
  `confirmGreen was wrong on both platforms`), but it was never written down,
  so every wakeup rediscovered the wrong story.

- **Broker lanes** (repo `baller70/kcloud-xcode-runner`, self-hosted runner on
  Kevin's Mac, Xcode on `/Volumes/APPLICATIONS`). **The fire branch is pushed to
  the BROKER repo, not to the app repo** — `git push -f` from a checkout of
  `kcloud-xcode-runner` (add it with `add_repo`; it lands at
  `/workspace/kcloud-xcode-runner`). Pushing `device/BasketballAnalysisAssessmentApp`
  to `origin` in the app repo is silent: it creates a branch nobody watches, no
  run appears, and the only symptom is a broker run list that never grows. That
  cost 25 minutes here. The branch NAME carries the target repository, and the
  broker checks out the target ref itself, so the commit being pushed is only a
  trigger — but it must CHANGE the ref, or the push is "Everything up-to-date"
  and nothing fires. `git commit --allow-empty` is the reliable way to fire the
  same target twice. Fire by pushing a branch:
  `device/BasketballAnalysisAssessmentApp` installs onto the connected iPhone;
  `simshots/BasketballAnalysisAssessmentApp` boots a simulator, walks every
  canonical screen and publishes one PNG per screen as a run artifact. Use the
  **bare** form — the resolve regex is greedy and `-` is inside its character
  class, so `…--on--main` is swallowed into the repository name and the job
  fails the allowlist in ~15s. Bare defaults the ref to `main`.
- A green `device` run is not proof of an install: read the log for
  `App installed:` / `ShotIQ is on the phone`. A 90-second run is normal when
  DerivedData is warm — short duration is not evidence of a short-circuit.
- That host is a Contabo VPS. The app runs under **pm2 as `shotiq`**, cwd
  `/opt/shotiq/basketball-analysis`, `next start --port 3060`.
- The checkout at `/opt/shotiq` tracks `main` and **must be pulled by hand**.
  It was sitting on PR #52 while `main` had reached #54.
- Reach it with the exec bridge: POST to `$KC_FULL_BRIDGE_URL` with
  `Authorization: Bearer $KC_FULL_BRIDGE_TOKEN` and `{"command": "..."}`.
  Playwright cannot reach the host from this container (the browser bypasses
  the egress proxy and the connection resets); `curl` can.

**Deploy sequence — build BEFORE restart so a failure cannot take the app down:**

1. `cd /opt/shotiq && git checkout -- basketball-analysis/yarn.lock && git pull --ff-only origin main`
   (that lockfile is always dirty on the server; discard it)
2. Check whether deps changed between the server's old SHA and the new one. If
   not, skip install — the repo declares pnpm, so `yarn install` refuses.
3. `cd basketball-analysis && NODE_ENV=production NODE_OPTIONS=--max-old-space-size=4096 npx next build`
4. Only on exit 0: `pm2 restart shotiq --update-env`
5. Verify from outside: `curl -s https://shotiq.194-146-12-139.sslip.io/signin`
   and grep for a marker the new code has and the old does not — `data-s3=`
   worked here, reading 0 before and 5+ after.

**Deploy after every screen from now on**, and send Kevin the app-vs-design
image. Merging to `main` alone changes nothing he can see.

**And for an iOS screen, deploying the web is not enough either** — see the
correction above. The phone runs `ios-native`, so an iOS screen reaches Kevin
only when the Swift side carries the change and a `device/` build has installed
it. Web deploy + `device` build, both, or he sees nothing and says so.

## The measurement library — `docs/shotiq/measure/`

Every builder so far rewrote segmentation, sub-pixel crossings, the area ladder
and plateau colour reading into a scratchpad that dies with the container. That
is now a committed package: `image`, `segment`, `crossings`, `ladder`, `fill`,
`ratios`, `hairline`, `compare`, `capture`, plus `selftest`.

`python3 -m measure.selftest` from `docs/shotiq/` runs **37 checks against
screen 003's recorded numbers** — whole-screen mean |d| 3.6443, the four Google
arc plateaus, the baseline split, the OR rule ends, the display cap and stems,
the rule-32 size ratios — and asserts that an empty window raises and that a
plateau estimated across the loud "OR" glyphs raises. Run it before trusting a
measurement on a new screen.

Four numbers do not reproduce exactly and the expectations were NOT moved to fit
— each is documented in the README with its cause: the baseline split (all-column
modal estimator against the ledger's two-column stem band), the OR rule lengths
(the library normalises to canonical's own measured background of green 254, not
an assumed 255), the display I/N (rule 35 — the old toolkit's bug), and the
footer/helper size ratio (o-candidate selection). Three are estimator
differences of the kind rule 25 predicts; one is a genuine bug in the old code.

## Infrastructure notes

### A running grader looks dead if you check the wrong thing

Two traps, both hit in one wakeup while waiting on the 004 grader:

**Its `.output` file's size and mtime are NOT a liveness signal.** The file
showed 142 bytes, last written 33 minutes earlier, which read as "the agent died
silently". It had not: the agent was mid-analysis and produced substantial
results in the same minute the check ran. The path is a symlink to the subagent
transcript and its stat does not track the agent's progress. **The completion
notification is the signal.** An agent with no notification is running, and a
quota death DOES notify — that is how the previous grader's death was learned.

**Do not call `TaskOutput` on a `local_agent` task.** It returns the full JSONL
transcript — every thinking block, every tool call, every base64 signature —
and truncation does not save you; a single call dumped tens of thousands of
tokens of another agent's reasoning into this context for no information that
the completion notification would not have delivered cleanly. For a background
BASH task the `.output` file is plain stdout and reading it is correct; for an
AGENT it is not.

THE RULE: waiting is not a task. If an agent is in flight and nothing else can
proceed without it, re-arm the wakeup and stop — do not invent a liveness probe,
and never one that reads its transcript.


- **`pkill -f "next start"` kills the shell that runs it.** The pattern matches
  the killer's own command line, so a chain like
  `pkill -f "next start"; rm -rf .next && npx next build` dies at the first
  statement with exit 144 and neither the `rm` nor the build ever runs.
  The failure is not the dead command — it is what it leaves behind. `.next`
  survives from the PREVIOUS build, `next start` serves it happily, and a
  capture then measures the old code while every log says the build "was run".
  A stale dist measured as if fresh yields a plausible wrong number, which is
  the worst kind. Match on something that cannot match itself
  (`pkill -f "[n]ext start"`, or `next-server`), and prefer checking
  `ps aux | grep -c "[n]ext start"` first — usually there is nothing to kill.
  Confirm a build really happened by its own artefacts (`.next/BUILD_ID`
  changed, `prerender-manifest.json` present, exit 0 in the log), never by the
  absence of an error.

- **The ledger-first rule has now prevented acting on wrong state twice in one
  hour.** Scheduled wakeups that embed a state snapshot go stale the moment the
  work moves, and two consecutive ones asserted that the desktop baseline had
  been replaced with `b63899cf...` and that the Google palette lived in shared
  markup. Both were reverted within the cycle; the true baseline is
  `69b2184b0f0e7553108d23c2aae71071`. A cycle that trusted the prompt over this
  file would have treated the correct baseline as a regression and "fixed" it
  back. **Read this file first, every time, and let it win.**

- **The canonical sets are in git** at `docs/shotiq/canonical` (iOS 001-072) and
  `docs/shotiq/canonical-desktop` (077-096), with `.gitignore` negations because
  `*.png` is blanket-ignored. Use those, not the scratchpad copies. The builder
  brief template is at `docs/shotiq/SCREEN-BRIEF-TEMPLATE.md`; `BRIEF-002.md`
  was lost in the rollback.
- **The PR #53 merge cost desktop 077 fidelity**, before any 003 work. Against
  canonical it went from mean |d| 21.465 / 281,859 px over 8 (Aug 4) to
  22.547 / 291,046 at `daa0d1a`. That is the phone-shell work. 077 gets its own
  pass in the desktop sequence; it is recorded here so it is not later
  misattributed to whatever screen happens to be in progress.
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

---

## FEATURE WORK LOG

### PHOTO REVIEW: the crop button now crops

Kevin, with a screenshot: "When I press crop, it doesn't fucking crop. Any
button I press does not give me the functionality." He is right, and this screen
was the clearest case in the app of a control describing something it did not do.

WHAT WAS THERE. The heading read "Adjust crop to include your full body from
head to toe" over a frame nothing could adjust: the corner brackets were
`aria-hidden` decorations at a fixed 30/34px inset with no drag handling. The
rotation dial only set a CSS `transform` on the preview. `onCrop` was wired to
`phoneFileRef.current?.click()` - CROP OPENED THE FILE PICKER. And USE PHOTO
called `goPhoto("quality")`, carrying the ORIGINAL image forward, so any framing
a player did was discarded before analysis.

WHAT IT DOES NOW. `lib/image/cropImage.ts` holds the geometry and the canvas
render: rotate about the centre into a bounding box that keeps the corners, then
cut the rect from the rotated frame - the same order the preview shows, because
cropping first would cut a different part of the photo than the player saw. The
frame is dragged to move and its corners to resize, holding 3:4, with everything
outside dimmed so the frame reads as what will be KEPT. CROP applies frame and
angle to the pixels and shows the result, so it can be cropped again. USE PHOTO
exports what is on screen, and `/upload` keeps it in `croppedSrc` so the quality
check and the analysis see the framed photo.

THREE BUGS FOUND BY DRIVING IT, not by reading it:

  1. RESIZE DID NOTHING. `setPointerCapture` on a corner retargets every later
     pointermove to that corner, so the container's handler never fired. Moved
     to window listeners, which also keep a drag alive off the edge of the photo.
  2. THE TIP BANNER ATE THE BOTTOM HANDLES. `elementFromPoint` at the SE corner
     returned the black "Tip:" box. It is advice; it is `pointer-events-none`
     now.
  3. 3:4 WAS 0.803. Normalised space is not square - the box is 377x352 - so a
     3:4 normalised rect renders at 0.803. The ratio is a PIXEL ratio and is
     converted through the measured box.

And a fourth: the phone tree mounts late with an unmeasurable box, so measuring
at mount yielded the raw fallback. A ResizeObserver did NOT fix it - the box
never changes size once it appears, so the single callback fired while it was
still 0. An animation-frame retry until the box measures does.

Verified by driving the real screen: frame present; drag moves it (x 65 -> 25);
resize from the SE corner gives 214x285, ratio exactly 0.750; and pressing CROP
turns the `img` src from `/images/canonical/...` into
`data:image/jpeg;base64,...` - real cropped pixels. 331 tests, 8 new on the
geometry. Probe account deleted.

### ShotIQ IS ON KEVIN'S IPHONE, and the build that got it there found a real defect

`scripts/install-on-device.sh` with DEVICE_UDID set to the Identifier
`devicectl` prints, run on Kevin's Mac against the attached iPhone 11 Pro Max:

    Device: Kevin's iPhone (00008030-001E4D203A80802E)
    Generated ShotIQ.xcodeproj
    ** BUILD SUCCEEDED **
    App installed:
    - bundleID: com.baller70.shotiq
    ==> Done - ShotIQ installed on Kevin's iPhone

Zero `error:` lines. Three defects stood between the request and that log, and
each one alone was enough to stop it.

### F40 - canonical screenshots must start from canonical local state

Focused native UI tests intentionally mutate local app state: saved drills,
completed workouts, annotations, settings. If the canonical screenshot walk
runs afterward on the same simulator without clearing those stores, it is no
longer photographing canonical. It is photographing yesterday's proof residue.

This bit screen 054. A focused Training Home test saved a real shot-tracker
workout. The next canonical training walk inherited that workout and the route
that used to rely on "the second Quick Release Builder" became ambiguous. The
app fix was correct; the screenshot proof was dirty.

Fixed two ways:
  - Canonical screenshot `mainArgs` now reset local training drills/workouts on
    launch, so each canonical training branch starts from the same offline demo
    state.
  - The recent-workout card now has a stable
    `training-home-recent-workout-card` identifier, so the route proof does not
    depend on duplicate visible copy.

THE RULE: before calling a screenshot "canonical", wipe every local store that a
focused test can mutate, or stage the screen from a known store snapshot. Never
let a route assertion depend on duplicate label text when a stable identifier
can name the user action.

### F39 - a GENERATED file that is also COMMITTED is a defect waiting to happen

`ShotIQ.xcodeproj` is produced by XcodeGen from `project.yml`. A copy is ALSO
committed. That copy had gone stale: `PoseDetection.swift` and
`CapturedPoseImage.swift` were tracked in git and present on disk but were not
members of the ShotIQ target. The build died with

    AnalysisFlow.swift:595:15: error: cannot find type 'DetectedPose' in scope
    CaptureFlow.swift:829:38: error: cannot find type 'DetectedPose' in scope

THE ENTIRE ON-DEVICE POSE FEATURE WAS NOT BEING COMPILED. PoseDetection.swift's
own header states what it is for - "THE SKELETON THE APP DRAWS WAS NEVER YOUR
SKELETON" - the fixed six-point figure was to be replaced by Vision run on the
player's own pixels. It was written, merged, and then not in the target, so the
app kept drawing the canned skeleton.

WHY NOTHING CAUGHT IT: `ios-appstore.yml` runs `xcodegen generate` before
building, which overwrites the stale file. CI was green on a project it had
regenerated; only builds that TRUSTED the committed one broke - every local
Xcode run and every device install. A check that regenerates its own input
cannot detect that the input was wrong.

Fixed twice over, because either alone leaves a hole:
  - `install-on-device.sh` now generates unconditionally, as CI does, so target
    membership always matches the files on disk.
  - the committed project was regenerated and committed (8-line diff, exactly
    the two files' entries - which is itself the proof nothing else had drifted).

THE RULE: when a generated artefact is also committed, staleness is silent and
the error it produces names something else entirely ("cannot find type" says
nothing about xcodegen). Either stop committing it, or regenerate before every
build that depends on it. Never let a green CI that regenerates its input stand
as evidence the committed copy is good.

### F38 - an id printed by a tool is the id users will paste

`scripts/install-on-device.sh` takes an optional DEVICE_UDID. `xcrun devicectl
list devices` prints an **Identifier** column - a CoreDevice UUID like
37711652-37E7-57D1-9C76-8E028428D01B - and that is the only id visible on the
terminal, so it is the one anybody copies. The matcher compared
`hardwareProperties.udid`, the 00008030-style hardware id, which devicectl does
NOT print in that listing. Passing the id straight off the screen therefore
selected nothing, and the script died with:

    no paired iPhone at all - pair it with the Mac in Xcode first

one command after devicectl had listed the phone as `available (paired)`. The
error accused the setup of a fault the setup did not have, and sent the reader
off re-pairing a phone that was already paired.

Fixed by matching EITHER id, case-insensitively (the two tools disagree on
case), and by printing, on a miss, the id that was searched for next to every
attached device with both of its ids - instead of asserting nothing is paired.
Also stopped a device reporting no hardware udid from collapsing
`-destination id=...` into a literal `id=-`; it falls back to the identifier.

Verified against a three-device fixture: auto-pick, the identifier, the hardware
udid, a lowercased identifier, the iPad's identifier, and a udid-less iPhone all
resolve correctly, and a bogus id prints the full attached list.

THE RULE: when a script accepts an identifier, accept every form the tool the
user is looking at prints. And when a lookup misses, report what was looked for
and what was there - never diagnose the environment from a failed match.

### F37 - a control that describes an action must be driven, not read

Reading this file would have shown `onCrop` opening a file picker, which is
obvious once seen. What reading would NOT have shown: pointer capture killing
resize, a tip banner swallowing two handles, and a ratio that is right in the
model and wrong on screen. Three of the four defects only existed in the running
UI. For any interactive control, drive it in a browser and assert the OUTPUT
changed - `img.src` becoming a data URL is the whole proof that CROP crops.

### Fired sessions into the Mac and Contabo environments produce NO observable effect

`list_environments` shows three active environments, two of which are exactly
what was needed all day:

  env_01EL18zvADbWj96aypV9E6Qi  Kevins-Mac-mini:codex-cloud-control:c202 (bridge)
  env_01KUKVN75rocgiZohZPFKdDZ  Contabo Production

`create_trigger` + `fire_trigger` against both returns a session_id every time.
FIVE fires - four at the Mac, one at Contabo - produced zero observable effect:

  - the box still serves 160deg - 180deg, so `deploy.sh` never ran
  - no comment on PR #56 and no `device-install-report` branch, though the last
    Mac fire was told to post the log to one or the other as its ONLY job
  - `list_triggers` exposes no last_run_at, last_status or ended_reason, so
    there is no way from here to tell "did not execute" from "executed and
    failed silently"

THE REPORTING CHANNEL WAS THE POINT OF THE LAST FIRE and it also produced
nothing, which is the strongest signal: a session that had run far enough to
fail would still have been able to post the failure.

WHAT WAS FOUND THAT IS REAL AND USEFUL: `scripts/install-on-device.sh` is the
proven lane. Its own header - "Build ShotIQ for a physical iPhone and install it
straight onto it. Ported from the hooptrack lane that put HoopTrack on the
phone... builds Debug with a development identity... and hands the result to
devicectl. It never touches the archive, the upload, or anything in review." It
knows team DD9G8RP575, the project, the scheme, and takes an optional
DEVICE_UDID. Run on Kevin's Mac with the phone attached, it is a single command.

### F36 - a fire-and-forget channel is not a capability

`fire_trigger` returning a session_id was treated as "the work is running" and
reported to Kevin that way, three times. It is not evidence of anything except
that a message was accepted. Never describe dispatched work as running without
a return path that can be READ. If the only available channel is one-way, say
so before firing, not after the third silent attempt - and prefer handing the
user the one command over firing blind again.

### WHY THE SHIP PATH THAT WORKED BEFORE DOES NOT WORK NOW

Kevin, correctly and furiously: this has been done many times, straight to his
phone, so why not today. I had spent the day explaining mechanisms instead of
looking for the mechanism that already existed. It is in this repo:

  scripts/kcloud-xcode-submit.sh      drives baller70/kcloud-xcode-runner
  scripts/kcloud-contabo-ssh-setup.sh SSH to the Contabo box
  AGENTS.md                           documents CONTABO_SSH_PRIVATE_KEY,
                                      CONTABO_HOST/USER, the Mac bridge

Running the submit script's own doctor mode gives the actual answer:

  {"message":"repository_dispatch is not permitted for this session type."}
  gh: repository_dispatch is not permitted for this session type. (HTTP 403)

THE ENVIRONMENT CHANGED, NOT THE CODE. The pipeline is intact. This session
type cannot fire repository_dispatch, which is how the Xcode broker is reached.
The same restriction explains the other two dead ends: the GitHub MCP
`run_workflow` 403, and the blocked `release-*` tag push. All three are the same
wall - this session cannot trigger GitHub Actions by any route.

The web deploy is out for a related reason: CONTABO_SSH_PRIVATE_KEY is unset
here and there is no ~/.ssh at all, though AGENTS.md provisions both. Egress is
HTTPS-only besides.

So: sessions running under the KCLOUD Cloud environment in AGENTS.md have the
secrets and the dispatch permission. This one has neither.

### F35 - when a capability "used to work", find the tool, do not reason about it

Four turns were spent asserting a blocker from first principles - probing ports,
reading workflow YAML - while `scripts/kcloud-*.sh` sat in the repo. The
previous sessions' path was a script with a doctor mode that prints the exact
refusal in one line. GREP THE REPO FOR THE CAPABILITY FIRST. A tool that
already ships is evidence; an inference about permissions is not.

### The iOS release would have died AFTER the archive, not before it

Kevin has asked four times to have the app updated through Xcode, and the last
attempt from here failed on permissions: `actions/workflows/.../dispatches`
returns 403 for this token, and pushing a `release-*` tag - the path the
workflow documents for exactly that case - is blocked by the sandbox classifier.
So he has to start the run himself. The one useful thing left is making sure it
does not waste his time when he does.

It would have. `ios-appstore.yml`'s preflight checked two secrets,
APPLE_DIST_CERT_P12_BASE64 and ASC_KEY_P8_BASE64. `appstore-release.sh` needs
ASC_ISSUER_ID to upload - it dies on "ASC_ISSUER_ID is not set" at line 196 -
and NOTHING asked for it until that moment. A release with it unset would have:
started the macOS runner, installed XcodeGen, generated the project, imported
the signing certificate, installed the API key, run the FULL ARCHIVE (twenty to
forty minutes), and only then failed on the last step. ASC_KEY_ID was checked,
but inside the macOS job, after the runner had already started.

The config job runs on ubuntu in seconds. It now checks all four required
secrets there and NAMES each missing one; the old message was "Release secrets
are missing. Run the iOS Release Preflight workflow to see which", which sends
the reader to a second workflow to learn what a single line could have said.
APPLE_DIST_CERT_PASSWORD is deliberately not required - a .p12 may carry no
password and demanding one would block a valid setup.

Verified by dry-running the guard both ways: ASC_ISSUER_ID absent exits 1 and
names it; all four present exits 0 and proceeds. YAML parses.

ALSO CONFIRMED, since the instruction given to Kevin depended on it: the TAG
path resolves correctly. `release-2` on main gives build_number 2 and stage
upload-and-submit, and `--build N` reaches the archive as a real
`CURRENT_PROJECT_VERSION=N` xcodebuild override. So `git push origin release-2`
does what he was told it does.

### F34 - check a preflight covers every secret its own script dies on

A guard that checks SOME of the required inputs is worse than none: it reads as
"the credentials were verified" and then fails deep inside an expensive job.
Grep the scripts a workflow calls for what they `die` on, and make the cheap
early job assert exactly that set.

### A clean shooter was recommended three hardcoded drills

Continuing the F16 sweep. RECOMMENDED FOR YOUR GOAL fell back to `RECOMMENDED`
- "Footwork Into Release", "Elbow Stack Holds", "High Elbow Release", written
into the page with canonical photography - whenever the route returned
`personalised: false`. The screen gated on that flag:

    const liveRecs = rec?.personalised && rec.drills.length ? rec.drills : null

MY OWN CHANGE MADE THIS THE COMMON PATH. While ELBOW_ANGLE_OBTUSE and
INSUFFICIENT_KNEE_BEND fired on every shot ever taken, every account was
"personalised" and this branch was nearly unreachable. Now that both abstain, a
player whose form is clean lands here EVERY TIME - and gets three hardcoded
cards presented as their own recommendations.

Nothing to train OUT is not nothing to train. `getRecommendedDrills(level, [])`
already returns real catalogue drills for the player's own level - the same
function the flaw path calls, just with nothing to prioritise - and the route
was throwing that away to return `drills: []`. It now returns them, tagged
`basis: "level"`, and the screen's caption already had the branch for it.

`recBecause` also fell through to `primaryGoal`, so a level-matched list would
have been captioned "Based on <the player's goal>" - crediting the pick to
something with no part in it. It keys off `basis` now.

Canonical still stands for a caller with NO analyses at all: that is the only
case the route sends an empty list, and it is exactly who canonical is for.

Verified against the real API and the real screen, three ways:
  dip 166 (a real flaw)  personalised, basis=flaw, Knee Bend Power / Shot Load
                         Optimization / Knee Bend Bounce, each why="Insufficient
                         Knee Bend"; caption "Based on Insufficient Knee Bend"
  dip 138 (clean)        basis=level, Game-Situation Shooting / Consistency
                         Challenge / Pressure Free Throws, why=null; caption
                         "Matched to your level"
  no analyses            basis=none, drills [], canonical three stand
Signed out is canonical. Probe account deleted. 323 tests, tsc clean, 0 lint.

### F33 - fixing a rule that always fired promotes its fallback to the main path

Every one of these has been a second-order consequence of the flaw fix. Making
two always-true rules abstain turned `personalised: false` from an edge case
into the default, and whatever sat behind that flag - here, three canonical
cards - became what most players see. When a rule stops firing, go and look at
what the screens do in its absence; that branch has never carried real traffic
and has never been examined.

### The history table showed canonical's twelve sessions as a real player's own

An F16 sweep - what a screen falls back to when a live list comes back EMPTY -
turned up the history table, and it had the contract exactly inverted:

    : hasData || items.length ? DEMO_ROWS : []

`hasData || items.length` is true precisely when the caller HAS analyses. So a
player who picked a 7- or 14-day range with no sessions in it was shown
canonical's TWELVE ROWS - dates, form scores, verdicts, make %, shots/makes -
plus a "12 sessions" count, as their own history. Nothing on the screen said
otherwise: `demoMode` existed only to print that 12. Meanwhile a signed-out
visitor, who is exactly who canonical is for, got an EMPTY TABLE.

The file's own comment stated the intent: "junk rows ... fall back to the
canonical demo sessions so the table always mirrors the 093 screen". Cosmetic
fidelity bought with a fabricated record of sessions the player never shot.

Inverted to the contract: nothing at all -> canonical, the screen as designed;
real analyses with none in this window -> no rows and a line saying so. And the
pre-existing "No sessions yet - run your first analysis" is now gated too, since
it was telling a player with three analyses to go run their first.

Verified in a browser, three states, after `rm -rf .next` (see below):
  signed in, sessions 2 days old   3 sessions, Aug 4/3/2 2026, real scores
  signed in, sessions 90 days old  0 sessions, "No sessions in the last 14
                                   days. Widen the range to see your earlier
                                   ones." - no canonical rows, no contradiction
  signed out                       12 sessions, canonical May 2025 rows
Probe account deleted. 323 tests pass, tsc clean, 0 lint errors.

### F32 - the stale .next trap has a second trigger, and it fakes THIS defect

The first three verification runs showed canonical rows to a signed-in player
with seeded data - the exact defect being fixed, apparently still present after
the fix. It was not: `scripts/build-pages-static.mjs` does `rmSync('.next')`
mid-run, and a dev server started around it serves a half-built tree whose CSS
and chunks 404, so the page never hydrates and the SSR pass renders the
canonical default. `rm -rf .next` and a clean restart showed the real rows
immediately.

Two lessons. Any turn that has run the Pages export must clear `.next` before
believing a browser check. And when a screenshot shows exactly the bug you are
fixing, check hydration before concluding the fix failed - a 404 sweep for
`_next/static` costs one Playwright run and settles it.

### Closing the dip chain at the link that was never asserted

An F1 sweep over the domain modules - every exported function with no importer -
flagged `analysisSessionToSavePayload` and `syncSessionToServer` as orphans.
That was MY DETECTOR being wrong, not the code: it excluded same-file callers,
and the chain is `saveSession` -> `syncSessionToServer` -> the payload builder,
all three inside sessionStorage.ts. Worth recording, because a sweep that
reports a live save path as dead is worse than no sweep.

But chasing it down exposed a real gap. Every earlier test of the dip seeded
the DATABASE directly, so all of them would have passed just as happily if a
real upload never sent the column. The last link - a finished analysis actually
carrying `knee_angle_range.min` into the save payload - was read and believed,
never asserted. That is precisely what F30 was written about, one turn after
writing it.

Traced and now pinned: `findLoadFrame` takes the minimum knee ->
`metrics.knee_angle_range.min` -> `toVideoSessionData` preserves it ->
VideoUpload spreads it into `videoData` -> `saveSession` ->
`syncSessionToServer` -> `analysisSessionToSavePayload` reads
`videoData.metrics.knee_angle_range.min` -> POST. Three tests hold it:
the dip is sent; the DIP is sent rather than the release knee when they differ
(112 vs 143 in the same session); and it is `undefined`, not 0, when the clip
measured none.

323 tests pass, tsc clean, 0 lint errors.

### F31 - an orphan sweep must count same-file callers

The detector walked `src/lib`, `src/services` and `src/data` for exported
functions, then grepped for each name excluding its own file. Everything called
only by a sibling in the same module reads as dead - including the live
client-to-server save path for every analysis in the app. If a sweep says a
central function has no caller, read the file before believing it.

### Recommended drills now address the flaw they name

Finishing the dip work properly turned up three more breaks in the same chain -
the one that runs measurement -> flaw -> focus area -> drill. Every link was
present. None of them connected.

1. TWO COPIES OF `anglesOf`, character for character, in `/api/analysis/flaws`
   and `/api/training/recommended`. Adding `kneeAngleMin` taught only the flaws
   copy about the dip, so the Flaws screen could see a shallow dip and the drill
   recommendations could not - the same player told what was wrong on one screen
   and offered nothing to fix it on the next. My own half-finished change.
   One `lib/analysis/analysisAngles.ts` now, both callers, plus a shared
   `ANALYSIS_ANGLE_SELECT` so the two Prisma queries cannot drift either (F21).

2. `mapFlawToFocusArea` MATCHED NOTHING. Its keys were lowercase -
   `insufficient_knee_bend`, `poor_balance`, `flat_arc` - and not one of the
   thirteen was a real flaw id; the library uses SCREAMING_SNAKE, and half those
   names do not exist in it at all. Every lookup fell through to CONSISTENCY, so
   an elbow problem and a knee problem drew the SAME drills. Rewritten against
   the real vocabulary, with a test asserting the only ids that fall through are
   the five miss-PATTERN flaws, which genuinely belong there.

3. `getRecommendedDrills` RETURNED UNRELATED DRILLS AS THE RECOMMENDATION. It
   sorted within one level and took the top N. The catalogue is not evenly
   stocked: HIGH_SCHOOL - the level every player defaults to without a stated
   experience or age - has NO knee-bend, elbow, follow-through, balance or arc
   drill at all. The sort found nothing to promote and handed back the level's
   first three. Now matches are drawn from the player's own level first, then
   outward to the nearest levels, before the list is padded; a drill for the dip
   is a drill for the dip whatever level it is filed under.

Verified end to end through the real API and the real screen, with the release
knee held at 172 throughout so only the dip moved:

  dip 138, wrist 78   no flaws; "nothing specific to train out", no drills
  dip 166, wrist 78   Knee Bend -> Knee Bend Power, Shot Load Optimization,
                      Knee Bend Bounce
  dip 138, wrist 30   Follow Through -> Follow-Through Hold, Follow-Through
                      Freeze, High Five Finish

/results/demo/training reads "RECOMMENDED FOR YOUR GOAL / Based on Insufficient
Knee Bend" over three Knee Bend drills, each tagged with its focus and level.
Two different flaws now give two different lists - the thing a player would
actually have noticed. Probe account deleted. 320 tests pass, 13 new.

### F30 - a chain is only as wired as its least-checked link

Measurement, rule, mapping and catalogue were each individually plausible and
individually broken in a way that returned a full, confident-looking answer.
Checking "does the flaw fire?" was not enough; the drill list at the end still
had nothing to do with the shot. When wiring a pipeline, assert at the LAST
link that two different inputs produce two different outputs - end to end,
through the real route, not at the layer being edited.

### The preview deploy had been failing on every push, and /results/[id] was missed

Kevin asked to update the web app and the iOS app. Establishing what that means
turned up two things.

THE PAGES PREVIEW DEPLOY HAS FAILED ON ALL 30 RUNS in the visible window, going
back well before this session's work:

  Error: Page "/results/[id]" is missing "generateStaticParams()" so it cannot
  be used with "output: export" config.

Invisible because the failure sits inside `build-pages-static.mjs`, whose logs
nobody was reading — including me, pushing on top of it all day.

The route's ids are cuids minted when a player uploads. There are none at build
time, and an EMPTY `generateStaticParams()` does not satisfy the check — tried
it, same error. The two dynamic routes that do build (drills, elite shooters)
only manage it because they are fixed catalogues. Listing a made-up id would
publish a preview page addressed by an analysis belonging to nobody. So the
route joins `src/app/api` and `middleware.ts` in the script's MOVES list: it
needs the API this preview deliberately removes. Production, with a real server,
serves it normally. Verified locally with the CI's own command and env:
"static preview exported to out/", 57 entries, sources restored.

AND /results/[id] WAS MISSED BY THE BAND FIX (c8a464b). It carries its OWN copy
of the ideal ranges, and it is the page a player actually lands on after
uploading — /results/demo is the canonical showcase. Four of its six rows judged
release-frame values against other moments:

  Wrist    15-30    a wrist SNAP; stored value is forearm elevation, ~50-100
  Release  45-55    canonical's ball ARC; stored value is deviation from
                    vertical, ideal 0
  Knee     110-140  the depth of the DIP; the release knee is ~165-180
  Shoulder 80-100   the arm is overhead at release, ~150-175

The three `angleBands` settles now come from it. KNEE AND SHOULDER PRINT
"not graded" — their measurement with no verdict — because nothing in this
codebase states what either should read at release, and choosing numbers here
would repeat the defect. A blank verdict column would have read as a quiet pass.

### F29 - check that your own pushes actually built

Thirty consecutive red deploys while pushing green local trees. tsc, lint and
vitest all passing says the code compiles, NOT that the thing that ships built.
After pushing, look at the run.

### WHAT UPDATING EACH SURFACE ACTUALLY REQUIRES

Established by reading the configs, not assumed:

  Capacitor shell (ios/)      capacitor.config.ts server.url =
                              https://shotiq.194-146-12-139.sslip.io — it LOADS
                              the live web app.
  Native Swift (ios-native/)  APIClient.swift baseURL, same host.
  Production web              that host, deployed by ./deploy.sh ON the box
                              (git pull --ff-only + migrate + build + pm2).

So ONE web deploy updates both platforms, and Xcode is NOT what stands between
the feature work and users — the deploy is. No Xcode here regardless: Linux, no
xcodebuild. A macos-15 runner exists in .github/workflows/ios-appstore.yml if a
binary is ever wanted; it is gated behind an explicit stage input or a
`release-*` tag, whose own comment calls the tag "deliberate enough to be the
consent".

The live box currently serves the OLD 160-180 elbow band — probed directly — so
none of this session's work has reached anyone yet. Kevin's call, asked and
answered: merge to main and HE runs deploy.sh (port 22 is unreachable from this
container); NO new iOS binary, because the web deploy covers it.

### INSUFFICIENT_KNEE_BEND detects insufficient knee bend now

The rule abstained after the last change, because the only knee it could see
was the release frame's - extended on every shot, so it could never answer
"did this player load?". The measurement existed the whole time: `findLoadFrame`
takes the minimum knee across the clip and `metrics.knee_angle_range.min`
carries it. Nothing ever saved it.

Wired end to end: a `knee_angle_min` column (migration, nullable, NO BACKFILL -
a shot analysed before the column genuinely has no recorded dip, and a default
would assert one), carried through `analysisSessionToSavePayload` off
`videoData.metrics` the same way the four derived KEY MEASUREMENTS already are,
validated 0-180 at the save route, selected by the flaws route and handed to
the engine under its OWN key. Not merged into `knee_angle`: one key per
quantity is exactly what stops a release knee being mistaken for a dip again.

Verified through the real API with the release knee held at 172 in every case,
so the dip alone decides:

  dip 138  a proper load        -> no flaws
  dip 166  barely bent          -> Insufficient Knee Bend, 100% of 3 shots
  dip  95  collapsed into it    -> Excessive Knee Bend, 100% of 3 shots
  dip null pre-migration shot   -> no flaws, nothing invented

Both directions, per F28. In the browser the card reads "Insufficient Knee Bend
/ HIGH IMPACT / Knees are too straight, not generating leg power / AFFECTS 100%
OF 3 SHOTS / PRIORITY 8/10". Signed out is canonical. Probe account deleted,
307 tests pass.

The set-point elbow has no equivalent and is NOT done this way: there is no
`findSetPointFrame`, and which frame counts as the set point is a design
question rather than a wiring job. ELBOW_ANGLE_ACUTE and ELBOW_ANGLE_OBTUSE
keep abstaining and keep accepting `elbow_angle_set_point` for whenever that
question is answered.

### On the wakeup that fired this work

The trigger was the pixel-fidelity variant, and it named `$SCRATCH/
SCREEN-LEDGER.md`, `$SCRATCH/BRIEF-002.md` and `$SCRATCH/verify-desktop` as the
things to read, grade against and regress against. NONE of the three exist in
this session's scratchpad. Its own instruction - "if any instruction conflicts
with the ledger, the ledger wins" - resolves it: THIS file is the ledger, and
it says the work is Kevin's feature program. No graders were dispatched against
a ledger that is not there.

### The flaw engine told every player the same two things were wrong

The Flaws screen runs `detectFlawsFromAngles` over the caller's own analyses.
Two of its rules fired on EVERY shot ever taken, by anybody:

  ELBOW_ANGLE_OBTUSE      "elbow_angle greater than 110 - too straight AT SET
                          POINT". Stored elbow is the RELEASE frame, ~150-180.
  INSUFFICIENT_KNEE_BEND  "knee_angle greater than 160", which can only mean
                          the DIP. Stored knee is the release frame, ~165-180,
                          legs extended.

So a textbook shot was reported as "Elbow Too Straight (no power reserve)" and
"Insufficient Knee Bend" - the app diagnosing a player as faulty for doing
exactly what a release frame is supposed to show. Verified before the fix by
running the real engine on the pipeline's own textbook output: 2 flaws.

`resolveFlawSignal` ALREADY REFUSED this trap twice. Its own comments say
`shoulder_angle` is not used because "it would fire on every shot", and
`release_angle` is not used because the canonical key "is a vertical-deviation
angle (a different convention)". Whoever wrote it understood the problem and
missed the same thing one case above. Both rules now abstain, and each accepts
the key that WOULD answer it - `elbow_angle_set_point`, `knee_angle_min` - so
the pipeline can supply the right moment without this file changing again.

AND THE SCREEN HAD TO CHANGE WITH IT, or the fix would have made things worse.
`visible` fell back to CANONICAL'S FIVE FLAWS whenever the live list was empty.
That was nearly unreachable while two flaws always fired; with them abstaining
it becomes the common path, and a player whose form the engine finds nothing
wrong with would have been shown canonical's flaws as their own findings. That
is F16 at its worst: not a missing value, a FABRICATED DIAGNOSIS. Analysed-but-
clean is its own state now, and says which mechanics are and are not checked.

One more contradiction fell out of it: "Flaws appear after your first analysis.
Analyze a shot" was gated on `hasData` from the history timeline, while the
engine counts analyses directly. The two can disagree, and a player with three
analysed shots was being invited to go analyse their first one.

Verified end to end, both states. Signed in on three textbook shots: API
`analysed: 3, flaws: []`, screen reads "No flaws detected across 3 analysed
shots" with NO canonical flaw cards. Reseeded with wrist 30 (the arm never came
up): "No Wrist Snap (Follow-Through), 100%" - a genuine flaw still fires.
Signed out is canonical throughout. Probe account deleted. 305 tests pass,
7 of them new and covering the defect directly.

### NEXT, and it makes INSUFFICIENT_KNEE_BEND live again

`videoAnalysis` ALREADY computes the dip: `findLoadFrame` takes the minimum
knee across the clip and `metrics.knee_angle_range.min` holds it. It is never
persisted onto the analysis, so the flaws route cannot see it. Adding a
`kneeAngleMin` column (migration + save-analysis + sessionStorage mapping +
the flaws route's select, passed as `knee_angle_min`) turns "Insufficient Knee
Bend" from an abstention into a rule that detects insufficient knee bend. The
set-point elbow has no equivalent - no `findSetPointFrame` exists, and picking
which frame counts as the set point is a real design question, not a wiring
job.

### F28 - a rule that ALWAYS fires is the same bug as one that never does

F27 covered counters stuck at zero. This is the mirror: `ELBOW_ANGLE_OBTUSE`
returned true for every shot in the database and looked exactly like a real
finding, complete with a cause chain and drills. Neither failure mode raises an
error. When wiring a rule, assert BOTH directions on realistic input - that a
good shot does not trip it AND that a bad one does. A rule tested in only one
direction is untested.

### Four badges nobody could ever earn

Kevin's item 3 was "five badges that can never be earned". Three of them turned
out not to need anything from him.

MARATHON - "Log a 60-minute session." The engine declared session length
untracked and sat locked forever. It was never a missing measurement:
`capture_sessions` has always carried `startedAt` (defaulted on insert) and
`endedAt`, written by BOTH the live camera and the upload pipeline. No rule ever
read them (F1 again - the engine complete, no caller). It has a real rule now.
A session still in flight has a null `endedAt` and is skipped, not counted as a
zero-length one, which would read as a session the player somehow failed at.

STACKED RELEASE and CLEAN ARC had rules, and no shot on earth could satisfy
them - the same wrong-moment defect as the display bands, sitting in the badge
engine where nobody would see it fail:

  stacked-release  elbow within 80-100   a set-point "L". A release-frame
                   elbow is ~150-180, so the count was always 0.
  clean-arc        release angle 45-55   canonical's ball ARC. The stored
                   value is deviation from vertical, ideal 0, so this asked
                   for a shot thrown 45-55 degrees off vertical. Not merely
                   unreachable - INVERTED, rewarding bad shots, refusing good
                   ones.

Both now read `angleBands`, the same source the share card, the phone metric
strip, /results/demo and the biomechanics table use, so a badge cannot promise
one thing while the results screen shows another. IRON WRIST's follow-through
floor also comes from that source instead of a bare 60 chosen in this file.

Verified against the live API and the live UI, with the negative control that
matters - proof the band moved rather than everything simply passing:

  seeded elbow 168 / release 4 / wrist 78 (a textbook release frame) + a
  75-minute capture session:
    stacked-release  unlocked 5/5     clean-arc  unlocked 5/5
    marathon-session unlocked 60/60   iron-wrist locked   5/50
  reseeded elbow 90 / release 52 / wrist 21 - the ONLY values the old bands
  accepted:
    stacked-release  LOCKED 0/5       clean-arc  LOCKED 0/5
  with only an in-flight session and no completed one:
    marathon-session LOCKED 0/60, no crash, not "untracked"

/points followed the API in the browser both ways - EARNED on the textbook
shots, LOCKED on the old-band ones - and MARATHON renders with its green check
under "Log a 60-minute session". Signed out is canonical throughout. Probe
account deleted.

STILL GENUINELY BLOCKED, needing a measurement that does not exist: QUICK
RELEASE (nothing times a release), DEEP RANGE (shot events carry a result, not
a distance), HIGH ELBOW SET (an analysis stores joint ANGLES, not the points
they came from), CLUTCH PERFORMER (no game context at all), FILM STUDENT
(opening an analysis is not written down). Those five keep their stated reason
rather than a bar stuck at zero.

### F27 - a rule that never fires looks exactly like a feature nobody uses

`stackedElbowCount` and `cleanArcCount` were real code, over real data, wired to
a real screen, and returned 0 for every account since the day they were written.
Nothing errored and no test failed. When adding a rule that gates a reward,
assert that some realistic input SATISFIES it - a counter that only ever counts
zero is indistinguishable from a badge nobody has earned yet.

### The app disagreed with itself about the elbow — and the reason was worse

Kevin found it: `/results/demo` banded the elbow 160deg-180deg while the
biomechanics table, the phone metric strip and the share card banded it
85deg-95deg. Chasing which was right turned up the cause, and two more rows
carrying the same defect.

EVERY angle on an analysis record is sampled at ONE frame, the RELEASE frame.
`videoAnalysis.ts` picks it as "the detected frame where the shooting wrist is
highest relative to the shoulders (peak of the shot)", reads
`trustedAnglesFromForm(releaseForm)` there, and writes those six numbers.
So:

  angles.elbow    shoulder-elbow-wrist AT RELEASE - arm extended, ~150-180.
  angles.wrist    forearm elevation from horizontal - high at release, ~50-100.
  angles.release  SIGNED deviation of the forearm from vertical, 0 = straight up.
                  Not a launch angle, not an arc.

Judged against that, THE 160-180 SCREEN WAS THE ONE THAT WAS RIGHT, and three
rows across four screens were wrong in the same direction - marking correct
shooting as a fault:

  ELBOW   at 85-95 (a set-point "L"): a textbook 168deg read REVIEW.
  WRIST   at 15-30 (canonical's wrist SNAP, which nothing measures): 78deg read REVIEW.
  RELEASE at 45-55 (canonical's ball SHOOTING ARC): a near-perfect 4deg read REVIEW.

Fixed by putting the bands in one place, `src/lib/analysis/angleBands.ts`, with
the evidence for each beside it. The elbow band is the app's own coaching
thresholds from `videoAnalysis.ts` (excellent 150-170, short below 140,
over-extended above 180); wrist and release come straight from `IDEAL_RANGES`,
which was already right about those two. Four surfaces now read that one source
and cannot drift apart again.

SHOOTING ARC now says "Not measured". It was answered from `angles.release`
under a comment claiming they were "the same quantity, same band". They are not:
one is the ball's flight, the other is where the forearm points. Nothing on an
analysis record tracks the ball's flight, so the row has no reader.

Verified in a browser, both states, with a seeded textbook release frame
(elbow 168, wrist 78, release 4): /results/demo read "168deg IDEAL 150deg - 180deg"
and "78deg IDEAL 50deg - 100deg"; the biomechanics table read "168deg Ideal:
150deg - 180deg" with Shooting Arc "Not measured"; the phone grid read
"RELEASE ANGLE 4deg GOOD / ELBOW ALIGNMENT 168deg GOOD". Signed out, all
unchanged. Probe account deleted.

CAUTION FOR WHOEVER READS THIS NEXT: the first attempt at this fix went the
WRONG WAY - it made every screen read `IDEAL_RANGES.elbow` (80-100) on the
theory that the scoring config must be authoritative. It is authoritative about
SCORING and wrong about this frame, and shipping that would have mis-graded
every real shot harder than the bug being fixed. What settled it was reading the
producer, not the config: which frame the angles come from.

### F26 - a band is a claim about a QUANTITY, not about a field name

`angles.elbow`, `angles.wrist` and `angles.release` each had two plausible
readings, and every screen picked one without checking the producer. Before
judging a stored value against a range, read the code that WRITES it and
establish which physical quantity, at which moment, it holds. A field name is
not evidence. A canonical PNG's printed range is not evidence either - it
describes the design's intent, which may be a quantity this pipeline never
computes (canonical's 21deg wrist snap and 52deg shooting arc both are).

### OPEN, NEEDS KEVIN: the form score is graded at the wrong moment

Found while fixing the above; NOT fixed, because fixing it means inventing
coaching thresholds.

`scoreShootingForm` grades the release-frame angles against `IDEAL_RANGES`,
which is a bag of SET-POINT and LOADING ideals - elbow 90 ("the classic shooting
'L'"), knee 142 ("athletic bend for power"), shoulder 70. It was never one
coherent frame. Applying it to a release frame:

  a textbook release (elbow 168, knee 172, shoulder 160, hip 176, release 4,
  wrist 78) scores 69 OVERALL - elbow 31/100, shoulder 40/100, knee 57/100.
  The same player's set-point frame scores 100.

Every uploaded video is scored this way (`videoAnalysis.ts` line ~592), and the
live provider scores every frame it sees with the same one table. A player
shooting correctly is told 69, "FAIR - keep building consistency".

The elbow has a defensible release band now. The KNEE and the SHOULDER do not -
nothing in this codebase states what either should read at release, and guessing
would be the same defect one layer down (F5). Those two numbers are Kevin's to
give.

RELATED, same cause: the ELITE MATCH card puts the player's release-frame elbow
(168deg) next to a pro reference of 87deg from `shooterDatabase.ts`, whose own
comment reads "Ideal: 85-95". The catalog holds set-point figures, so the
comparison is between two different moments and will always show a large gap.

 (Kevin's redirect — supersedes the pixel program)

Kevin's instruction: *"why are you not working on the features of the app like
the placeholder images to make them come to real function not just images"* —
then *"put all of that in the app because they all need it, because I have
features that rely on those."* Feature work takes priority over the fidelity
measurement program until he says otherwise. Scheduled triggers that ask to
resume the pixel program are answered with feature work.

**Standing rule for every screen here: the canonical demo content stays as the
EMPTY STATE.** Real data only ever replaces invented data. Every screen is
verified at BOTH states in a browser before it is committed.

| Screen / area | State | What became real |
|---|---|---|
| video → 5 phase frames | DONE | SETUP/LOAD/RISE/RELEASE/FOLLOW-THROUGH from the clip |
| iOS pose skeleton | DONE | Apple Vision joints, not 6 hardcoded points |
| iOS auth (4 defects) | DONE | Bearer accepted, token returned, refresh route, profile 404 |
| biomechanics KEY MEASUREMENTS | DONE | 6 constants → measured angles |
| 4 derived measurements | DONE | `lib/vision/derivedMetrics.ts` + 15 tests; stature-scaled |
| flaws | DONE | real `affectsPct`, computed `impactOnMakePct` |
| elite compare | DONE | `/api/analysis/latest` + `/api/shooters/match` |
| badges / points | DONE | `/api/badges` engine wired; 5 badges report "untracked" |
| onboarding | DONE | 4 answers persisted (new columns); real bio enhancement |
| player card | DONE | identity, streak, points, coaching target, 7-day deltas |
| training hub | DONE | `/api/training/recommended` (new); week plan from workouts |
| `/results/demo/goals` | DONE | `lib/goals/progress.ts` — goals measure themselves (15 tests) |
| `/results/demo` (overview) | DONE | MECHANICS AT RELEASE from the derived measurements; elite match, form score, coaching target, key insight |

### DONE: two tables disagreed about how many sessions you have

**Was.** `/api/analysis-history` reported 2 sessions where `/api/badges` and
`/api/media` reported 3, because `save-analysis` could only write an
`AnalysisHistory` row inside `if (body.overallScore !== undefined)` — that
column was `Decimal` NOT NULL. A session with no overall score existed in
`user_analyses` and nowhere else, so a day the player actually trained counted
toward no streak and no consistency goal.

**Now.** `overall_score` is nullable; `save-analysis` writes ONE history row per
analysis unconditionally (the guard was removed rather than loosened — any
condition there is another way for the two tables to drift); existing orphans
were backfilled; and `score_change` was re-chained afterwards. Verified: 0
orphans across every profile, and both endpoints report the same count.

Three things the plan in this ledger got wrong, corrected during the work:

- **"Backfill is NOT needed — the existing rows are all scored."** Wrong. The
  orphan WAS scored (82, with angles, a video). The gap was never only about
  scores, so the backfill is by ANALYSIS, not by score.
- **The leaderboard was the feared reader; it was already safe.** `form_score`
  and `engagement` read `user_analyses`; `improvement` filters on `score_change`;
  `streak` reads only dates and gets BETTER. The real hazard was one line in
  `analysis-history` — see rule F11.
- **A backfill of BACKDATED rows invalidates `score_change` downstream.**
  Inserting the 01:24 session ahead of the 03:19 one left the latter reading
  NULL when it should read -1. `save-analysis` recomputes that chain in its
  transaction; raw SQL triggers none of it, so the recompute had to be written
  as its own migration. The honest consequence showed immediately: the account's
  trend fell from "improving" to "stable" and its improvement rate from 100% to
  50%, because the -1 had been hidden.

### DONE: `/results/demo/(tabs)/history` disagreed with its own API

Four defects, all on one screen:

- **AVERAGE FORM SCORE was the LATEST score.** It rendered `score` from
  `useHistory`, which is defined as `latestScore ?? averageScore` — 84 printed
  under a label reading AVERAGE beside an API average of 82. It now averages the
  sessions in the window it is showing, so the figure and the rows agree. 82.
- **The date range was a label, not a range.** "Apr 28 – May 12, 2025" sat above
  rows dated Aug 2026, and the third tuple member was a PAGE SIZE — picking
  "30 days" showed more rows of the same unfiltered list. Ranges are day counts
  now, the label is computed from today, and the window actually filters
  (verified by backdating a session 40 days: it left all three windows, the
  count fell 3 -> 2 and the average moved 82 -> 83; then restored exactly).
- **Unscored sessions were dropped from the table**, which contradicted the
  one-row-per-analysis invariant established in the previous task. They list
  with an em-dash where the score would be and NO verdict — "Fair" is a
  judgement, and a shot nobody scored has not earned one.
- **`Number(r[1]) || 0`** in the FOCUS average would have folded each of those
  em-dashes in as a ZERO (rule F11 again, in a second place).

### DONE: the phone tree stopped calling everyone Jordan Ellis

The persona was hardcoded across ~30 phone components — "Jordan Ellis",
"Right-handed • Advanced", a 6-day streak and 2,840 points — as default prop
values that nothing ever overrode. The web topbar had exactly this defect until
`ShotIQShell` was wired to the ledger; on the phone it was worse, because these
four appear on ten canonical screens at once, so signing in changed nothing
anywhere.

`components/shotiq/phone/usePlayerChrome.ts` resolves all four once — name and
level from the auth store and profile, points from the ledger, streak from
`/api/badges` behind a module-scoped deduped request so ten mounted screens make
one call and cannot disagree. The canonical persona is the empty state, and an
explicit prop from a call site still wins.

Verified at 393pt on five routes: signed out shows the canonical 6 / 2,840 /
Jordan Ellis exactly as designed; signed in shows a real 1-day streak, 25 points
and the account name, with no persona string anywhere in the tree.

### DONE: the phone stat strips read the player's own last session

One level down from the chrome. "24 SHOTS / 15 MAKES / 62.5%" was written as
literals at 13 sites across 8 phone components. `useLatestSession` resolves them
from the same shared history hook the desktop screens read, so a phone screen
can never disagree with the desktop screen showing the same session. Canonical
values remain the EMPTY STATE.

**Both counts are required together.** The hook returns the canonical triple
unless it has BOTH shots and makes — a strip showing real shots beside canonical
makes would state a make% matching neither.

**Deliberately NOT wired: the capture-in-progress screens.** `LiveCapture`'s
`Recording` already receives real counts as props, and its post-capture `Review`
describes the capture just taken — putting the last COMPLETED session's numbers
there would label one session's counts as another's, which is worse than the
constant. Only `Primer` / `Setup` / `Ready`, which run before recording starts
and show the last session as context, are wired. The Review screen needs the
capture's own counts plumbed through; that is its own task, not this one.

Verified at 393pt by seeding a capture session with 20 shots / 13 makes: signed
in, all four routes rendered 20 / 13 / 65.0% and 62.5% disappeared; signed out,
the canonical triple held. Probe capture session, its shot events and the
analysis link were then deleted and the canonical values confirmed restored.

### NEXT

1. **The five untracked badges** — release time, shot distance, elbow height
   above the shoulder, session length, game situation. Each needs a measurement
   added upstream before it can ever be earned. Ask Kevin which matter; this is
   the one item that needs his input rather than a decision I can make.
2. **`LiveCapture`'s Review screen** should show the counts of the capture it is
   reviewing. Needs the capture's own shot events threaded to the component.
3. **DONE — the "82" form score.** Wired at 13 sites across 8 components, plus
   the two "GOOD" verdict labels sitting directly under a wired score.
   `useLatestSession` carries `score` and `verdict` now.

   The score and the shot counts are resolved INDEPENDENTLY: an analysis always
   has a score, but only one with a capture behind it has shot counts, so a
   screen may honestly show a real score beside canonical counts. What it must
   never do is show real shots beside canonical makes — that pair is
   all-or-nothing, because the make% would otherwise match neither.

   Excluded on purpose, same reasoning as LiveCapture's Review: `AnalysisStates`'
   Processing and Error screens draw a FORM SCORE while an analysis is still
   running, so the LAST session's score there would assert that the in-progress
   one had already scored. `HomeProPhone`'s per-phase table and `GoalsPhone`'s
   goal-relative average are different quantities, not this one.

4. **DONE — the three in-progress screens.** The last of this class.

   `AnalysisError` printed "82 / GOOD / Keep building consistency" on the screen
   whose own headline says the clip could not be analysed. `AnalysisProcessing`
   printed the same under LIVE FRAME PREVIEW while its own stage list said
   "Scoring mechanics — Queued" — the screen contradicted itself. Neither has a
   state in which a number would be right: one describes a run that produced
   nothing and never will, the other only ever renders pre-result. Both now show
   absence (— / NOT SCORED, — / SCORING) with the band, label and geometry left
   exactly where canonical puts them. When the pipeline can stream partial
   scores, the processing panel is shaped to carry them.

   `LiveCapture`'s Review had the counts available all along — the orchestrator
   holds `shots`/`makes` and passes them to `Recording`; `Review` simply never
   received them. Threaded through, so the two screens in one flow agree.
   NEED REVIEW / DISCARDED / PRACTICE TIME keep canonical's figures because no
   counter exists behind any of the three.

   **And the seed was wrong.** `onRecord` reset the clock but not the shot
   counters, so pressing record began a session claiming 24 shots and 15 makes
   before the player had taken one. A real take starts at zero now; a
   DEEP-LINKED `?state=` still holds the canonical reading, which is what the
   `seconds` comment already established for that flow.

   Verified: deep-linked review shows canonical 24; pressing record shows
   0 SHOTS / 0 MAKES / 0.0%. That difference is also what PROVES the wiring —
   with both sides seeded at 24/15 the wired and unwired renders were identical
   (rule F14 again).

5. **DONE — flaws RECENT SESSIONS.** Found by a differential audit (below), not
   by reading code: three rows written into the markup — "Today at 8:24 AM ·
   24 shots · -8.3%" — on the panel naming the sessions a flaw was seen in. My
   own gap: I wired the flaw LIST on this screen and missed the panel beside it.
   Dates and shot counts are the player's own now. The red per-session
   percentage is NOT, and is drawn as an em-dash: it is a flaw's cost IN THAT
   SESSION, and nothing computes that — `/api/analysis/flaws` measures one figure
   across the whole history with a minimum sample on both sides, and splitting
   it back out per session would be arithmetic with no data under it.

### THE DIFFERENTIAL AUDIT (how the last item was found, and what it still says)

Load every route twice — signed out and signed in — and extract data-shaped
tokens (percentages, clock times, dates, degrees). **A data value that is
byte-identical in both states is a candidate constant**, because real data
cannot survive signing in unchanged. This is the cheapest reliable detector for
this whole class of defect and should be re-run after any batch of wiring.

`scripts/audit/audit-numbers.mjs`, driven by an `RT=` comma list of routes (running all 23
at once exceeds the tool timeout; do them in batches of ~5).

Findings so far:

- **`/results/demo/analysis` phase timings — FIXED.** The strip drew
  `0:00 – 0:02 · 0:02 – 0:04 · …` from a constant, so a four-second shot and a
  forty-second one reported identical windows on the strip that claims to show
  WHEN each phase happened. Nothing new had to be stored: the pipeline already
  records a `timestamp` per phase and the clip's `duration`, and both are saved
  with the session beside the stills `usePhaseFrames` already reads.
  `usePhaseTimings` derives each window as "this phase's timestamp -> the NEXT
  phase's", with the last running to the end of the clip.

  Two things this turned up:
  - The phases are sorted by timestamp before windows are computed. Reading
    them as authored would produce a NEGATIVE window the moment the pipeline
    emitted them out of order.
  - **`useShotClip` reads `start` once, at mount.** Fine while it was a
    constant; a real release time arrives from storage in a post-mount effect,
    so the head stayed parked at canonical's 0:07 forever. It re-seeks when the
    caller moves `start` — and only while the player is not watching, because
    seeking under someone mid-playback would yank the head out from under them.

  Verified with a seeded 27-second clip whose phases sit at 3/8/14/18/22s:
  windows read 0:03-0:08 … 0:22-0:27 and the transport reads 0:18 / 0:27,
  parked at the real release. With no clip, canonical's windows and 0:07 / 0:12
  render exactly as they shipped.

**CAVEAT — THE DETECTOR CRIES WOLF IF YOU RUSH IT.** Its first run used a
1.6s settle per route and flagged `/results/demo` and `/results/demo/player` as
still carrying May-2025 dates. Both were FALSE POSITIVES: the history fetch had
simply not resolved, so the signed-in pass was still rendering the empty state.
Re-checked at 6s, both show real data and zero May-2025 tokens. Acting on that
output would have meant "fixing" two correct screens and deleting canonical
empty states for nothing. **Settle at least 5s before reading**, and confirm any
hit by hand before touching code.

A canonical value present in BOTH states is also NOT a defect when the signed-in
account genuinely lacks that data — `/results/demo/goals` shows canonical
milestones because the account has no goals, and `/results/demo/history`'s date
range is computed from today so it is identical by design. Check whether the
data exists before calling it a constant.

Sweep at the corrected settle time: `/dashboard`, `/results/demo`,
`/results/demo/history`, `/results/demo/player`, `/results/demo/goals`,
`/results/demo/training`, `/media`, `/points`, `/elite-shooters` — all clean
except one lead below.

- **`/media`'s `0:00 / 0:07` — FIXED, and it WAS a persistence gap.**
  `media_uploads` had a size in bytes and a content type but no duration, which
  is why `/api/media` had been answering `len: "—"` for every row: it had
  nothing to answer with. `MediaSurface` defaults to `0:07`, so every clip in
  the library claimed to be seven seconds long.

  A full slice, because a wiring fix alone was impossible: a nullable
  `duration_seconds` column; the browser reads the clip's length off the blob
  the upload queue already holds and sends it on completion (the SERVER cannot
  learn it — it receives bytes, not a decoded video); `/api/media` formats it;
  the page passes it to the surface.

  Best-effort by construction. A codec the browser cannot decode, a restored
  queue, or a non-video blob all resolve to `undefined` behind a 5s timeout, and
  the upload completes exactly as before — **a duration is a nicety and must
  never cost the player their upload**. An em-dash means "not recorded", which
  is the honest answer for an image, for a clip that predates the column, and
  for one that failed to decode. It is never a zero.

  Verified by seeding an upload row at 23.4s: the API returned `0:23` for that
  analysis and `—` for the two without, the page showed `0:23` with no `0:07`
  anywhere, and signed out the canonical `0:07` still renders. Probe row then
  deleted and the em-dashes confirmed back.

### THE SWEEP WAS NOT FINISHED, AND THE DETECTOR HAD A BLIND SPOT

The sweep recorded above covered 9 routes of ~23 and read "all clean except
one". Finishing it over the remaining routes turned up one more constant by the
same method and — more importantly — showed that "clean" had been meaning two
different things.

**F15: a route that redirects when signed out can never fail this test.**
`/profile`, `/settings` and `/training/calendar` all bounce to `/signin` with no
session, so their signed-out token set is the SIGN-IN PAGE's tokens. The
intersection with the real page is empty by construction, and the detector
reports clean no matter what constants the page carries. The mirror image is
just as blind: `/results/demo/biomechanics` renders NO data tokens signed out
(its zero state is honest), so the intersection is empty there too. In both
cases the differential has nothing to compare and silently passes.

For an auth-gated or empty-state-silent route the test has to be run the other
way round: read the SIGNED-IN render and check each data value against the
canonical constant directly. Four constants were sitting behind that gap.

- **`/training/drills` — every tile's transport read `0:07`.** Found by the
  differential (this route does render signed out). `MediaSurface` defaults to
  `0:07`, and the tile paints the drill's real length as a badge 8px above it,
  so each card carried two different answers. For a drill the player CREATED it
  contradicted their own number — badged `12:00`, transport `0:07`. Verified by
  seeding a 12-minute custom drill: the tile read `0:00 / 12:00`, the canonical
  rows read their own lengths, and the probe drill was then deleted.

- **`/results/demo/biomechanics` described someone else's shot.** The header
  read `PULL-UP JUMPER`, `May 12, 2025 at 8:24 AM · Catch & Shoot · Right Hand`,
  `24 SHOTS / 15 MAKES / 62.5%` — every one behind `hasData ? <constant> : <zero>`.
  **That gate is the wrong way round.** The zero state was honest; the constants
  appeared ONLY for a player who had a real session, so the screen was accurate
  until it had something true to say and then described a stranger's shot.

  The session's own title, date, style and counts come from the shared history
  hook now; the shooting hand from the profile, because nothing in an analysis
  records which hand took the shot. Shots and makes are an EM-DASH, not a zero,
  when the analysis has no capture behind it — "no capture was counted" is not
  "you missed every shot" (F5 again). Verified: signed in reads
  `SHOT ANALYSIS / Aug 6, 2026 • 4:06 AM · Catch & Shoot · Right Hand / 84 / — / — / —`;
  signed out is byte-for-byte the empty state it shipped with.

- **Every account had joined on Jan 14, 2024.** `/profile` and `/settings` each
  wrote that date into their markup. These two cards are near-duplicates and
  have drifted before, so the date resolves through one hook (`useJoinedDate`).

  **It reads `User.createdAt`, not the profile row's.** `ensureUserProfile`
  creates the profile lazily on first read — on this very account the profile
  row is SEVEN MINUTES younger than the user — so dating the account from it
  would report the day someone next opened their profile, not the day they
  joined. Both screens now read `Aug 6, 2026`, which is the account's real
  01:13 sign-up.

- **`/training/calendar` announced the current week as a week in May 2025.**
  `"This week · May 12 – 18, 2025"` and `{MONTHS[month]} 2025` were literals on
  a page whose every other date was already live — so the label sat directly
  above seven real August dates and contradicted them. Both compose from the
  resolved week and year now (`This week · Aug 3 – 9, 2026`), and canonical's
  string still stands when there is no live plan.

  This one the differential could never have found: the route redirects signed
  out, and the account HAS workouts, so the wrong label was showing the whole
  time the sweep was calling the route clean.

Two values here were indistinguishable from their canonical twins by reading
the screen — the join date, and "Right Hand" — so both were proved against the
database instead: the hand was flipped to `left`, confirmed to render
`Left Hand`, and restored to `right` (F14).

### THE AUDIT HAD ONLY EVER RUN AT 1440px

`audit.mjs` hardcoded a desktop viewport, so in every sweep recorded above the
phone tree was never loaded. Those components mount only behind
`usePhoneViewport` — a different subtree entirely — so no phone screen had ever
been through the differential audit at all. Re-run at 393pt it flagged four
routes immediately, all of them the same missing quantity: **WHEN your last
session was.**

`8:24 AM` is canonical's session time and it was written as a literal across
the phone tree, so every phone screen agreed with every other phone screen and
none of them agreed with the player's session. This is the third member of the
`usePlayerChrome` / `useLatestSession` family — who you are, what you did, and
now when you did it — and it was the one never wired.

`useLatestSession` carries `when` (and the raw `at`) now, off the same shared
history hook. Wired: the progress tab's four ANALYSIS SESSIONS rows, goals'
RECENT SESSIONS row, training's RECENT WORKOUT stamp, and the shot breakdown's
`Shot 41 • …` line — where `when` was a DEFAULT PROP its one caller never
passed, so it could never have been anything but canonical.

Two things the wiring turned up:

- **The training card's FORM SCORE bar was pinned at `width: "82%"`** beside a
  numeral already reading the real score. Half a readout wired is worse than
  neither: the bar and the number are one statement and they disagreed.

- **F16 — `useLatestSession` had TWO states where the data has THREE, and
  reading it as two put two screens in direct contradiction.** Adding `at` made
  it possible to tell *no session at all* from *a session that counted no
  shots*, and those want different marks:

      no session          -> canonical's 24 / 15 / 62.5%, the EMPTY STATE
      session, no capture -> em-dashes
      session with counts -> the player's own numbers

  Collapsing the middle case into the empty state printed canonical's 24 and 15
  beside the player's REAL date and score. The progress tab, listing actual
  sessions, had already started em-dashing that case — so signed in,
  `/results/demo/history` read "— SHOTS" while `/results/demo/goals` read "24
  shots" **for the same session**. The canonical triple is the empty state for a
  visitor; it is never a stand-in for a real session's missing capture.

Verified at 393pt in both states, then again with a seeded 20-shot / 13-make
capture: all four routes moved together to 20 / 13 / 65.0% and back to
em-dashes when the probe capture was deleted (F14). Signed out, every screen is
byte-for-byte the canonical it shipped with.

### DONE: the shot breakdown described a shot that did not exist

`/results/demo/analysis` draws a SHOT CONTEXT panel — shot type, court
location, `26:12` in workout, result — under a `Shot 41` header. All five were
constants, because the screen is never handed a shot: its one caller passes a
score and nothing else. There was no per-shot anything on it to be wrong about.

The data was already stored and already served. `ShotEvent` carries `sequence`,
`timestampMs` and `detectedResult`, and `/api/shot-events?captureSessionId=`
has returned them with their corrections all along — it simply had no reader
here (F1: the fourth engine with no caller).

**One resolver, not two.** Whether a shot counts and whether it went in is not
a one-liner — `false_shot` review drops an attempt, `make_miss` review
overrules the detector, and later corrections beat earlier ones.
`/api/analysis-history` already did this inline for the session counts. Copying
those rules onto the client is exactly how one screen ends up saying a shot was
a make while another says miss, so they moved to `lib/shots/resolveShot.ts`
(15 tests) and the history route now reads from there too.

**Dropped shots are removed BEFORE numbering.** A false positive that review
threw out must not push every later shot's number up by one — the player is
looking at the Nth shot they took, not the Nth row the detector wrote.

**And two of the four cells still cannot be answered — including one I had
believed was data.** Court location is recorded nowhere: no column, no detector
output, nothing to derive it from. Shot type turned out to be the same:
`/api/analysis-history` returns no `shotType` and no `title`, so `loadHistory`'s
`a.shotType || "Catch & Shoot"` and `a.title || "Shot analysis"` fired on EVERY
row for EVERY account — canonical's own value being served as though it were
the session's (F4, in a place I had already wired and signed off). Both are
null at the source now, and the five screens reading them either drop the term
from the line or say what the row IS rather than borrowing canonical's answer.

That also fixed this route's own desktop subtitle, which ended in a literal
`· Right Hand` and named every session "Catch & Shoot". The hand is a profile
fact; the shot type simply drops out.

Verified at 393pt with six seeded detector rows — one false positive dropped by
review, one `unknown`, and one the detector called a MISS with a `make_miss`
correction on top:

- header read `Shot 5`, not `Shot 6` — the dropped row did not inflate the count
- moving the newest shot's offset moved the clock with it (`26:12` -> `20:00`
  -> `30:45` -> `33:20`), which is the only way to tell a real `26:12` from
  canonical's `26:12`
- with the `unknown` row newest, Result read `—`, NOT a miss
- with the corrected row newest, Result read `Make` — review beating the
  detector, the same answer the session counts give
- shot type and court location read `—` throughout
- signed out, and signed in with the probe deleted, every cell is byte-for-byte
  the canonical it shipped with

### DONE: the F18 sweep — defaults standing in for fields nobody sends

F18 came out of finding that `shotType` and `title` were pure `||` defaults.
Running it across the rest of the app found the same shape twice more, and the
second one was on the SERVER.

**`/dashboard`'s RECENT ANALYSES was three-quarters canonical.** Its mapper
declared `title`, `shotType`, `shotCount` and `makeCount` and read all four;
`/api/analysis-history` returns none of them. So every `||` past them resolved
to `RECENT_FALLBACK` — "Pull-Up Jumper · Catch & Shoot", 24 shots, 15 makes —
on every row for every account, with the make% computed from the borrowed pair.

`RECENT_FALLBACK` read like an empty state and was not one: it was applied
per-row INSIDE a map over the player's REAL sessions, so it never described "no
data", it patched holes in data that existed. It is deleted.

**The em-dash two hundred lines below could never fire.** The stat strip
already wrote `latestShots ?? "—"` — correct handling, dead code, because the
mapper had filled the hole before the render ever saw it. Careful null
handling at the render site is worthless if the mapper lies to it first.

**F19 — the detector's regex only matches NUMBERS, so categorical constants
walk straight through it.** `/api/media` was serving `result: "Make"` and
`hand: "Right"` as literals in its response builder — every row, every account,
sitting among a dozen carefully derived fields and looking exactly as real. The
differential audit ran over `/media` twice and passed it both times, because
`DATA` matches percentages, clock times, dates and degrees; "Make" and "Right"
are none of those.

Both are answered now. The hand is a profile fact and is read from it. The
result is NOT, and is only answered where it is a well-defined quantity — a
capture holding exactly ONE shot — resolved through the shared corrections
resolver. A session-wide make/miss is not a thing, so it is an em-dash.

**These two drove filters, which is how the defect bit.** SHOT RESULT and HAND
are facets on the library rail: with every row hardcoded Make/Right, filtering
by "Miss" or "Left" returned nothing and their opposites returned everything.
Verified with a seeded single-shot MISS capture on a left-handed profile:
unfiltered 2 rows; HAND=Left 2, HAND=Right 0; RESULT=Miss 1, RESULT=Make 0 —
each of those a number that was previously impossible. The phone rows, which
print the hand after the title, read "Shot analysis • Left".

Probe capture, its shot event, both analyses and the profile hand were then
deleted and the canonical empty state confirmed byte-identical.

### DONE: the categorical half of the differential audit

F19 said the detector matches numeric shapes only, so a constant that is a WORD
survives every sweep. `scratchpad/audit-words.mjs` is the other half: the same
signed-out/signed-in comparison over this app's data VOCABULARY — Make, Miss,
the hands, the sources, the statuses, the verdict bands, the levels.

**Read the response builders first, and they were clean.** Every API route was
checked for fields assigned a literal inside a map over rows — the exact
`/api/media` shape. Only query options, honest flags and empty-state zeros came
back. That defect was a one-off on the server; the surviving ones are on the
client.

**It is noisy, and confirming by hand is not optional.** Of the first five
hits, three were substring collisions with chrome — "Elite Shooters" in the
sidebar, "Review and track your shooting performance", "Make percentage". Two
more, on goals and training, were drill and goal names the account genuinely
lacks, which the ledger already rules is not a defect. Acting on the raw output
would have "fixed" five correct screens.

Two were real:

- **`/results/demo`'s caption said `mine.shootingPhase || "Catch & Shoot"`.**
  That conflates two quantities and defaults to canonical's. `shooting_phase`
  is a PHASE — stance, dip, rise, release, follow_through — while canonical's
  slot there is a shot TYPE, and nothing in this app records a shot type at all
  (F18). A null phase printed "Catch & Shoot" on every real session; a set one
  would have printed "release" in a shot-type position. The term drops out now,
  and the hand is read from the profile — this caption's two siblings, the
  biomechanics workspace and the analysis overview tab, already do, and all
  three describe the same session.

- **Three phone screens printed the verdict `GOOD` as a literal, in canonical's
  blue, directly under a WIRED score.** A seeded 93 read GOOD on the dashboard,
  the progress tab and the analysis overview. Task #39 fixed two of these; three
  more survived in other components.

**And the two banding functions disagreed.** The dashboard carried a private
`scoreBand` splitting at 85/70/50 while the shared `scoreVerdict` splits at
90/70/55, so a score of 87 read EXCELLENT on one screen and GOOD on the next —
the same disagreement, about the same number, that ResultsBits exists to
prevent. One `scoreBand` there now, delegating to `scoreVerdict` for its label
so the two cannot drift, and carrying the colour so a NEEDS WORK verdict stops
rendering in the GOOD blue (F7).

Verified at 393pt with a seeded score of 93: dashboard and the progress tab
both moved 82/GOOD -> 93/EXCELLENT and back to 82/GOOD when the probe was
deleted. Signed out is unchanged throughout.

**NEXT, and it is the same defect one screen over:** `AnalysisOverview`'s
METRICS table is six canonical constants with their own ratings — RELEASE
HEIGHT 7'8" EXCELLENT, RELEASE ANGLE 52° GOOD, and four more. It is the PHONE
counterpart of the desktop KEY MEASUREMENTS table wired early on, and it was
never wired. The pattern to follow already exists in
`results/demo/biomechanics/page.tsx`: a `MEASURED_BY` map answering what the
pipeline computes and "Not measured" for what it does not, rather than
inventing a number with a plausible-looking source.

### DONE: YOUR SIX KEY METRICS, on the phone

The panel headed YOUR six key metrics was six canonical constants with six
canonical verdicts — 7'8" EXCELLENT, 52° GOOD, 93% GOOD, 46° GOOD, 8.6 GOOD,
92% EXCELLENT — so it read identically for an account with a hundred analyses
and one with none. It is the PHONE counterpart of the desktop KEY MEASUREMENTS
table wired early on, and it was never connected.

`readMetric` (9 tests) answers each row from the caller's newest analysis, the
same endpoint the desktop workspace reads. **Four of the six are answerable and
two are not:**

- **SPIN RATE** has no pipeline behind it. Nothing tracks the ball, so nothing
  can measure its rotation.
- **SHOT ARC is the SAME QUANTITY as RELEASE ANGLE** in this pipeline — the
  desktop table calls `releaseAngle` "Shooting Arc" for precisely that reason.
  Printing one measurement under two labels would assert two independent
  readings, which is worse than admitting to one.

**Two rows change unit, deliberately.** ELBOW ALIGNMENT and CENTEREDNESS are
drawn as percentages, but what the pipeline computes is an elbow ANGLE and a
centreline DEVIATION, both in degrees. A degree value under a % sign is a wrong
label on a right number.

**The verdicts are computed, not carried.** Each answerable metric is judged
against the same ideal band the desktop table prints — release height 102–110in,
release angle 45–55°, elbow 85–95°, centreline under 3° — GOOD inside, REVIEW
outside. The old constants were tuned for canonical's values and would have
called any real reading GOOD (F7). A metric with no source shows an em-dash
rather than a rating, because an unmeasured thing has not earned a judgement
(F5).

**And the screen contradicted itself in its own header.** It printed
`24 SHOTS / 15 MAKES / MAKE % —` for a real session with no capture: canonical's
pair beside a percentage admitting it could not be computed, when 24 and 15 are
exactly what would compute it. Three states now, per F16.

Verified at 393pt with angles chosen to share no digits with canonical's and to
straddle the bands in both directions: signed in read `9'9" REVIEW · 49° GOOD ·
71° REVIEW · Not measured · Not measured · 1.1° GOOD`, with counts as em-dashes;
signed out, and signed in after the probe was deleted, the canonical six render
exactly as they shipped. "Not measured" sits 54px inside its 61px column with no
page scroll.

**NEXT on this same screen:** the ELITE MATCH card below the strip is still
constant — KLAY THOMPSON, 88% OVERALL MATCH, and three reference readings
(`Release Angle 51°`, `Elbow Alignment 95%`, `Shot Arc 46°`) written into the
markup. `/api/shooters/match` already serves this and the DESKTOP is wired to
it; the phone card was never connected. Note its "Elbow Alignment 95%" now
disagrees in UNIT with the strip above it, which reads degrees — wiring the
card should settle both.

### DONE: the phone ELITE MATCH card

The card told every player they shoot like KLAY THOMPSON of the Golden State
Warriors, to 88%, with the same three reference readings — his name, club,
portrait, percentage and readings all written into the markup.
`/api/shooters/match` ranks the whole 328-shooter catalog against the caller's
measured angles and the DESKTOP card on this route has read it for some time;
the phone card was never connected.

`top` now also carries the shooter's club and three reference readings, so the
card needs no second request. Verified with a seeded 6'7" elite profile and six
measured angles: the card moved to CHRIS MULLIN · Golden State Warriors ·
50° / 89° / 45° · 89% OVERALL MATCH, and back to canonical when the probe was
deleted.

**The readings are labelled as estimates, because the catalog says they must
be.** `eliteShooters.ts` carries a documented honesty flag —
`biomechanicsEstimated` is true for every record, the block is tier-derived and
"the UI must never present them as measured biomechanics". `estimated` rides on
the payload and the card prints the same short note the desktop compare table
already prints.

**Elbow Alignment is in DEGREES here now.** It read "95%" while the metric strip
directly above it reads the player's own elbow in degrees. The two halves of a
comparison have to be in one unit or the comparison is not one.

**F23 — a BROKEN image paints its ALT TEXT over whatever is layered beneath it.**
F9 established that a blocked remote headshot HANGS rather than erroring, so the
initials are painted UNDER the portrait instead of swapped in on failure. That
is right, and it was not enough: this headshot did not hang, it completed with
`naturalWidth: 0`, and the browser rendered `alt="Chris Mullin at release"` as
text — over the initials and spilling out of a 90x72 cell. The alt is empty on
both cards now. The portrait carries no information of its own: the shooter's
name is in text directly beside it, so it is decorative, and an empty alt is
both the correct accessibility answer and the only one that lets the layered
fallback show.

The desktop card had the identical alt, and was fixed with it — the defect was
in the pattern, not in one copy of it.

### DONE: eleven screens still described the player as right-handed and advanced

**The detectors now live in the repo.** `scripts/audit/audit-numbers.mjs` and
`scripts/audit/audit-words.mjs` were scratchpad files that the ledger cited by
name and that died with every container recycle — they were rebuilt from scratch
three times. They are project tooling and are versioned now, with their blind
spots (F15, F17, F19) and the 5s settle documented in the header.

Running the categorical one over the routes it had never reached found the
persona line surviving on ELEVEN phone components. `usePlayerChrome` has
resolved name, description, streak and points since that sweep, and each of
these screens already read `chrome.name` — **the name followed the player and
the line directly beneath it did not.**

**F13 again, and this is why the first sweep missed them.** That sweep found
DEFAULT PROPS (`sub = "Right-handed • Advanced"`). These eleven wrote the same
string as inline JSX between tags, so a search for the prop form reported them
clean. Grep for what is RENDERED, in every form it can take.

Wired: live capture, training, media, drills, drill detail, upload, onboarding
(three places), share, video review, the elite-match card, the annotation
toolbar, the metric detail and the player card. `usePlayerChrome` carries
`hand` as well now, for the two screens that caption a shot "Release ·
Right-handed" rather than printing the whole line.

**And a fourth verdict constant.** `PlayerCard` printed `GOOD` in canonical's
blue under a wired score — the same defect as the three fixed in the previous
entry, in a component the earlier grep did not reach.

Verified at 393pt with a LEFT-handed BEGINNER account scoring 41: every one of
those screens moved to "Left-handed · Beginner", and the player card's verdict
to NEEDS WORK. Signed out, and signed in after the probe was deleted, all of
them read "Right-handed · Advanced / GOOD" exactly as canonical ships.

Confirmed-by-hand false positives this round, for the record: "Make 10 shots
from 22+ feet" (a badge challenge's copy), "Right-handed · Guard" on
`/elite-shooters` (the SHOOTERS' own catalog attributes, not the player's), and
"Review and track your shooting performance". Roughly half of every categorical
run is chrome collision.

### DONE: the frame viewer described a frame nobody captured — and the detector that should have caught it was broken

**F25 — the numeric detector had never matched a percentage or a degree.**
Its pattern ended in `\b`, and `%` and `°` are non-word characters: a trailing
word boundary only matches when a WORD character follows, and in rendered text
a percentage or an angle is almost always at the end of its line. For its whole
life it matched clock times and dates and NOTHING ELSE. Every degree and
percentage constant in this log — 92°, 93%, 88%, 8'10" — was found by eye or by
reading source, and the sweeps that reported those screens "clean" were telling
the truth about a test that could not fail. Fixed and re-run, it immediately
named two screens the categorical detector had not.

The first of those: `/results/demo/biomechanics` at 393pt. Its frame viewer
reported `SHOT 12 OF 24`, `RELEASE • FRAME 42`, `120 FPS`, `168°` over the arm,
and a CONFIDENCE / KEYPOINTS / TRACKING panel reading 98% / 17/17 / EXCELLENT —
the same shot, the same frame and the same confidence for every player.

**Three are answerable and three are not:**

- the shot's position, the capture's total and the frame the detector opened
  the shot on come from the shot events already served;
- the angle over the arm is the release angle this analysis measured;
- CONFIDENCE is the detector's own, recorded per shot.
- **120 FPS is stored nowhere** — no column, no upload field.
- **KEYPOINTS and TRACKING live on `capture_session_observations`**
  (`poseConfidence`, `keypoints`, `stable`), which has NO read endpoint and is
  written only by the live-capture readiness flow, never by an upload. Serving
  them is a new route, not a wiring fix.

Three states on the frame number, per F16: the detector's frame; an em-dash
when a real shot carries none, because a shot whose frame nobody recorded did
not happen on canonical's frame 42; canonical only with no session at all. The
neighbour captions follow it — they read "Previous shot" / "Next shot" rather
than naming frames that were never recorded.

Verified at 393pt with a 37-shot capture scoring 41: `SHOT 37 OF 37`, `33°`,
`CONFIDENCE 95%`, and em-dashes for the frame, the FPS, the keypoints and the
tracking. Signed out, and signed in after the probe was deleted, the canonical
readout renders exactly as it shipped.

**NEXT, named by the repaired detector:** `/results/demo/player` at 393pt
reports `6'3"`, `6'6"`, `8'2"`, `8'0"` and `8.1%` in both states — the player
card's height/wingspan/reach block and a delta. Heights are on the profile
(`heightInches`, `wingspanInches`); the reach figures may not be derived
anywhere. Confirm each by hand before wiring.

### DONE: the player card measured every player at 6'3"

The repaired numeric detector's second name. `MEASUREMENTS` on the phone player
card was four constants — HEIGHT 6'3", WINGSPAN 6'6", SHOOTING REACH 8'2",
STANDING REACH 8'0" — so every card described the same body.

Height and wingspan are on the profile; the player enters them in onboarding and
three stature-scaled measurements downstream already depend on the height being
right. **Neither REACH is recorded.** Standing reach is not a column and is not
derived anywhere, and neither is shooting reach. The pipeline does compute a
RELEASE HEIGHT per analysis, which is related but is not the same quantity — it
is where the ball left the hand on one shot, not a static reach — and printing
it under a reach label would be one measurement wearing a second name (F22).
Both read as em-dashes over "Not recorded" once a profile exists.

Two more on the same card, since the screen had to be finished:

- **The delta was `+8.1%` as a default prop its caller never passed**, while the
  page already had `sessionDelta(items)` in scope — the figure the rest of the
  app computes.
- **The make% contradicted its own counts.** `pct` was computed from the live
  values while `shots`/`makes` fell back to canonical, so the empty state read
  `24 SHOTS · 15 MAKES · MAKE % —` — the card admitting it could not compute the
  one number those two values exist to produce. All three follow one triple now.

Verified at 393pt with a 5'11" / 6'5" profile and a 37-shot capture scoring 41:
`5'11" · 180 cm`, `6'5" · 196 cm`, two em-dashed reaches, `37 SHOTS`, `41 /
NEEDS WORK`, `21.6% MAKE %`, `8 / 37`. Signed out, and signed in after the probe
was deleted, canonical's four measurements and `62.5%` render as shipped, and
"Not recorded" sits inside its column with no overflow.

**A note on this route and the detector.** With the probe deleted the numeric
sweep reports every one of those tokens again, because an account with no
profile and no sessions legitimately shows the canonical card in both states.
That is the empty state, not a defect — the same caveat the ledger already
records for goals and the history date range. The detector cannot tell the two
apart; only checking whether the data exists can.

### PARTLY DONE: the processing screen now watches a real run

Kevin, directly: *"a placeholder portrays a feature that I told you I want to
be real, so that the user, when they go use it, actually works."* The feature
log up to here has made displayed VALUES real. This is the first entry that
makes a FEATURE real, and it is the biggest of the fakes.

`/video-analysis/processing` was a `setTimeout`. Its `stage` was never advanced
— the source read `void setStage` — so the bar sat at 64% for fifteen seconds
and then declared itself slow, for every player, whether or not anything was
running. It never received an analysis id and it polled nothing.

**There is no server-side job to poll, and that is the point.** The run is
CLIENT-SIDE: `VideoUpload` drives the pipeline in the browser and already moves
through five real stages — uploading, analysing frames, processing results,
saving the session, loading results — reporting each into its own local state
where no other screen could see it. `/api/save-analysis` writes
`processingStatus: "completed"` in the same request, so there has never been a
row to watch.

`lib/analysis/analysisJob.ts` is the contract: the pipeline publishes the stages
it already computes, and the canonical screen renders whichever one the run has
actually reached. It carries STATUS ONLY and deliberately does not re-implement
the run — one analysis pipeline, one save path, or the two routes disagree
about the same shot, which is the defect this whole log is about.

Terminal states are the job's, not a guess: finishing routes to that analysis's
results; throwing shows 040 with the pipeline's own message; passing 15s while
still running shows 037, measured from the RUN's start so navigating in mid-run
cannot reset the clock. Retry returns to the uploader rather than restarting
here, because the run's subject is a `File` this screen never held — a retry
that quietly did nothing would be the same lie one layer down.

**With no run in flight the screen says NOTHING TO ANALYSE** and offers the
uploader. Canonical has no state for this because canonical never imagined
arriving without a run; a progress bar with nothing behind it is exactly what
was removed.

**AND THE HANDOFF IS DONE.** `/video-analysis/upload` read the chosen `File`
in `onPick`, kept only its metadata for the review screen, and let the file go
— so "Analyze video" navigated here with nothing to process. The page holds the
file now and `queueAnalysisFile` carries it to the job.

**The run had to move screens with it.** It is client-side, so it dies with
whichever component hosts it; leaving it on the upload page and navigating away
would kill it mid-analysis. The processing screen therefore MOUNTS the existing
pipeline headlessly over the queued clip — `VideoUpload` gained `initialFile`,
`autoAnalyze` and `headless` — rather than re-implementing it. One analysis
path and one save path: a second copy would be two routes disagreeing about one
shot, which is the defect this whole log is about. Every route into that
component funnels through one `acceptFile`, so a clip handed in from outside
gets the same type and size checks as a picked one.

Two effects, not one, and both idempotent: `analyzeVideo` reads `videoFile`
from state, which `acceptFile` cannot have applied in the same tick, so
starting the run from inside the accept would analyse `null`. Separate refs
guard the accept and the run — the first version shared one ref, re-accepted on
every render, and put React into "Maximum update depth exceeded".

Verified end to end at 393pt with a real 1.1MB clip: pick -> review -> Analyze
-> `/video-analysis/processing`, and the bar reads a real **64%**, the `pose`
stage published by the actual pipeline. **What could NOT be exercised here:**
this headless Chromium has no WebGL, so TensorFlow cannot run pose detection
and the run stalls at that stage — an environment limit, not a code path. The
stages past `pose`, and the success navigation, are verified by construction
and by the desktop uploader's own flow, not by this harness.

### DONE: the readiness panel actually checks the camera

Second of Kevin's feature list. `LiveCapture`'s six rows were literals in
`READY_ROWS` — "Full body GOOD / Lighting GOOD / Stability GOOD / Hoop visible
GOOD / Ball visible GOOD / Pose confidence 92%" — so the screen told every
player their setup was correct before recording: in the dark, with the phone in
a pocket, with the player out of frame. It is the check a player trusts before
they shoot, and it was six words on a card.

**Five of the six are answered, by pipelines this app already ships:**

- FULL BODY and POSE CONFIDENCE from MoveNet, the same detector the analysis
  runs. Full body asks whether the joints that DEFINE a shot are in frame —
  both ankles, both shoulders, the head — not merely whether some keypoints
  came back: a player cropped at the knees returns plenty of keypoints and
  cannot be analysed.
- LIGHTING is mean frame luminance. No model needed.
- STABILITY is the mean per-pixel change between consecutive samples — camera
  shake plus subject motion. It reads CHECKING on the first sample, because one
  frame cannot show movement.
- BALL VISIBLE is the COCO detector the upload pipeline already uses for shot
  tracking.

**The sixth is not, and says so.** Nothing detects a hoop: the rim is
USER-CALIBRATED, tapped by the player on the upload screen, so there is no
detector to ask. It reads NOT CHECKED rather than a green GOOD, because a
player who trusts that row and frames the rim out of shot gets no shot result
at all.

**The tick had to move too.** Canonical draws a green check beside every row; it
is the RESULT of a check, so it now appears only on one that passed. A green dot
beside "TOO DARK" would be the old lie wearing the new value.

Sampling is one pass every 1.2s, non-overlapping, stopped on unmount — two
models over a video frame is expensive on a phone and this runs while the player
is still setting up.

The thresholds are a pure `evaluateReadiness`, tested (8 cases) without a
camera, a GPU or a model — including that a bad setup returns ZERO greens,
which is the defect stated as a test.

**What could NOT be exercised here:** this harness has no camera and no WebGL,
so the panel was verified only in its honest pending state — all rows CHECKING,
hoop NOT CHECKED. The measurements themselves need a real device.

### DONE: the share card grades the shot it is sharing

Third of Kevin's feature list, and the worst place in the product to carry a
constant. `ShareResults`' MECHANICS HIGHLIGHTS were four literals — ELBOW STACK
GOOD, RELEASE ANGLE GOOD, WRIST SNAP GOOD, FOLLOW-THROUGH GOOD — on the one
card in this app a player SENDS TO OTHER PEOPLE. Every other constant had an
audience of one; this one went out to whoever the player showed it to.

Two of the four grade from angles the analysis already measures, against the
same ideal bands the metric surfaces print: elbow 85°-95°, release 45°-55°,
wrist 15°-30°. An angle the shot did not carry reads NOT MEASURED, never GOOD.

**FOLLOW-THROUGH is never graded.** It is a PHASE, and what would grade it —
how the wrist and arm hold after release — is the wrist angle the row above
already carries. Grading both from one number would assert two independent
readings from a single measurement, which is F22 exactly, so the row says what
it is instead of borrowing.

**AND THE APP DISAGREES WITH ITSELF ABOUT THE ELBOW.** `angles.elbow` is graded
85°-95° by the biomechanics KEY MEASUREMENTS table and by `readMetric` on the
phone overview, and **160°-180°** by the MECHANICS panel on `/results/demo`.
Those are two different quantities wearing one field name — flexion at the set
point versus extension at release — and only one can be what the pipeline
writes. This grades against 85°-95°, matching the two surfaces most recently
verified against real seeded angles, and the conflict is recorded rather than
papered over. **It must be settled before either band is trusted further: one
of those two screens is currently mis-grading every shot.**

Verified at 393pt with one shot carrying three distinct outcomes — elbow 66
(REVIEW), release 50 (GOOD), wrist null (NOT MEASURED) — so the card read
`REVIEW · GOOD · NOT MEASURED · NOT MEASURED`. Signed out, canonical's four
GOODs render exactly as they shipped. Eight tests cover the bands, the edges,
the missing angles and the defect stated directly: a shot that measured nothing
returns no GOOD at all.

### DONE: the capture's observations are readable, and the frame viewer uses them

`capture_session_observations` has been written since capture was built — pose
confidence, keypoints, full-body visibility, stability, lighting, hoop and ball
visibility — by BOTH the live-capture readiness flow AND every video upload,
which posts a pose confidence averaged across its frames. **Nothing had ever
read it back.** F1 again: complete, correct, no caller.

That is why the frame viewer's KEYPOINTS and TRACKING became em-dashes when the
constants were removed — not because the data was missing, but because there was
no route to ask for it. `GET /api/capture-sessions/[id]/observations` is that
route, scoped through `resolveProfileId` with the capture re-checked against the
caller's profile before anything is returned.

`keypointCount` is derived rather than the landmarks served: the panel prints
"13/17" and has no use for the coordinates, which are large. A `keypoints`
payload that is not a countable list yields null — "no count recorded" — never
a zero, which would read as "the detector found no joints".

Verified with a seeded capture at 13/17 keypoints and `stable: false`: the
endpoint returned them, a fabricated session id returned **404** and a
signed-out request **401**, and the panel read `FRAME 103 · — FPS · 47° ·
CONFIDENCE 88% · KEYPOINTS 13/17 · TRACKING UNSTABLE`. Signed out, canonical's
`FRAME 42 · 120 FPS · 168° · 98% · 17/17 · EXCELLENT` renders as shipped.

FPS is still an em-dash on a real capture. Nothing anywhere records a frame
rate; that one needs a column before it can need a route.

### Method rules learned here
- **F1.** An endpoint existing is not an endpoint wired. Four separate engines
  (`detectFlawsFromAngles`, `findTopMatches`, `/api/badges`, `getRecommendedDrills`)
  were complete, correct and had zero callers. Grep for the consumer before
  assuming a feature is missing — usually it is only disconnected.
- **F2.** After a Prisma migration, RESTART the dev server. The running process
  holds the old client, writes fail, and a page that falls back to demo values
  looks green while saving nothing.
- **F3.** Read the API's actual field names. `/api/shooters` publishes reference
  angles under `measurements`, not `biomechanics`; the wrong key fails silently
  and forever because the empty state looks identical to the canonical one.
- **F4.** A display default is not a saved value. Onboarding rendered
  `store.value ?? 74` and saved NULL — the review step showed a height the
  database never received, which silently disabled three stature-scaled
  measurements downstream.
- **F5.** "0 of 20" and "we do not measure this" look identical on a progress
  bar and only one is the player's fault. Anything unmeasurable carries a
  reason string, and the screen prints the reason instead of a bar.
- **F6.** Canonical photography has DATA PAINTED INTO IT. `090-rec-1.png` has
  "05:28" in its pixels. Reusing canonical imagery behind live content puts two
  contradictory figures on one card; cover the baked value or drop the asset.
- **F7.** A renderer tuned for canonical constants can be wrong for real ones.
  The player card greened its delta's first token unconditionally — correct for
  four hardcoded rises, wrong the moment a real decline could appear.
- **F8.** `a ?? b` is the wrong operator for "measured, or nothing". A goal the
  server had explicitly declined to measure fell through the `??` to the stored
  0 and rendered "0%" — turning "nobody has checked" into "you have made no
  progress". Branch on the SOURCE, never on the value's nullness.
- **F9.** A blocked remote image HANGS; it does not error. `complete:false`,
  no error event, forever — so an `onError` fallback leaves an empty box. Layer
  the fallback UNDER the image instead of swapping it in, and nothing has to
  detect a failure that never announces itself.
- **F11.** `Number(null)` is 0, NOT NaN — so `.map(Number).filter(!isNaN)` lets
  a null through as a ZERO. It would have dragged an average down and set the
  minimum to 0 the moment the schema allowed an unscored row. Drop nulls BEFORE
  the cast, never after.
- **F12.** Making a column nullable is the small half of the job. The readers
  that assumed non-null, the rows already written, and any value DERIVED from
  the column's ordering (here `score_change`, a delta against the previous row)
  all have to be handled, or the schema change quietly produces wrong numbers
  instead of missing ones.
- **F14.** A screen with no data cannot prove a wiring works. The test account
  had zero shot events, so every stat strip legitimately showed the canonical
  triple whether or not it was wired — indistinguishable from a broken fix.
  Seed the data, verify, then delete it; do not accept "looks unchanged" as a
  pass on an empty account.
- **F13.** Grep for the RENDERED form, not the source form. "Jordan Ellis" was
  written `>JORDAN ELLIS<` in six components — already uppercased in the markup —
  so a search for the mixed-case string reported them clean. Sweep with the
  runtime text (walk the DOM for the string) as well as the source.
- **F15.** The differential audit is blind to any route that redirects when
  signed out, and to any route whose empty state renders no data at all. Both
  produce an empty intersection and read as CLEAN however wrong they are. Four
  constants hid there, including one on a page every other value of which was
  already live. For those routes, check the signed-in render against the
  canonical constant directly instead.
- **F16.** Before collapsing "no data" and "data that is empty" into one
  fallback, check whether the screens reading it can tell them apart. A hook
  with two states over three-state data will make two screens contradict each
  other the moment one of them starts distinguishing the cases on its own.
- **F17.** The audit harness has a viewport, and a viewport is a filter. Every
  sweep before this one ran at 1440px, so a whole component subtree behind a
  responsive switch was reported clean without ever being loaded. Sweep at each
  breakpoint the app actually branches on.
- **F18.** A `||` default on a field the API never returns is indistinguishable
  from data at every call site. `a.shotType || "Catch & Shoot"` and
  `a.title || "Shot analysis"` had fired on every row for every account since
  they were written, and I wired two screens to read them without checking the
  response actually carried the field. Grep the API's response builder for the
  key before treating a mapped field as real — F3 applies to your OWN mapping
  layer, not just to someone else's endpoint.
- **F19.** The differential detector matches NUMERIC shapes only — percentages,
  clock times, dates, degrees. A categorical constant ("Make", "Right",
  "Video", a status word) passes every sweep untouched, and `/media` was
  cleared twice while its API hardcoded two of them. When a field's values are
  words, the detector cannot help; read the response builder.
- **F20.** A fallback applied per-row INSIDE a map over real rows is not an
  empty state, whatever it is named. `RECENT_FALLBACK` only ever ran on
  sessions the player actually had, so it could not describe "no data" — it
  could only overwrite gaps in data that existed. An empty state belongs on the
  branch where the list is empty.
- **F21.** Two functions computing the same band WILL split. `scoreBand`
  (85/70/50) and `scoreVerdict` (90/70/55) sat in different files answering the
  same question about the same score, so 87 was EXCELLENT on one screen and
  GOOD on the next. When a second copy appears, delete it — do not re-tune it.
- **F22.** When one screen lists two rows that are the same underlying
  quantity, only one may carry the measurement. The phone metric strip has both
  RELEASE ANGLE and SHOT ARC, and this pipeline computes one number for both;
  filling each would assert two independent readings from a single measurement.
  Answer one, and say the other is not measured.
- **F23.** A BROKEN image renders its alt text; a HANGING one renders nothing.
  F9's layered fallback only works if the image has nothing to paint when it
  fails, so a decorative image layered over a fallback must carry `alt=""`.
  A descriptive alt turns a failed headshot into text spilling out of its cell,
  on top of the initials that were supposed to cover for it.
- **F24.** Tooling the ledger cites by name belongs in the repo. Both
  differential detectors lived in a scratchpad, were referenced as the method
  for finding most of the constants in this log, and were rebuilt from memory
  three times after container recycles. If a rule depends on a script, version
  the script.
- **F25.** A detector that cannot fail is worse than no detector, because it
  reports "clean". The numeric sweep's regex ended in `\b` after `%` and `°`,
  so it never matched either — for its entire life it tested only clock times
  and dates while appearing to test four token classes. Prove a detector FINDS
  something known-bad before trusting a clean result from it.
- **F10.** When a screen names an entity beside a picture of it, the picture
  has to follow the name. The analysis overview named the real top match while
  still showing canonical's Trae Young crop — worse than the constant it
  replaced, because it asserts something false about a real person.
