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
| 004 | create-account | IN PROGRESS | — | whole screen **11.457 -> 5.3669**, verified in built captures. THIS ROUND (all three solves matched their in-page prediction to four decimals, which is the evidence for rule 47): overlay viewBox origin +0.48/+0.50 device px — twelve features, twelve negative deltas, one container offset, nine bands better from one parameter; plate 10.5487 -> **8.4842** (createLab scaleX 0.90 -> 0.7845, height exact against a 14.7% advance); signin 6.6987 -> **5.1897** (signinLab 21.0/0.90 -> 18.95/0.9092, both axes 11% over within 0.7% of each other — the OPPOSITE diagnosis to createLab on a run seeded identically); wordmark 8.7161 -> **4.1879** (ty 1.2670, NOT dy — see rule 47). Carried by the overlay alone: checkbox 9.3142 -> 7.1859, orrow 3.1520 -> 2.4379, fieldPass 5.2310 -> 4.6804, fieldConf 5.1655 -> 4.7994, fieldFirst 3.4513 -> 3.1399, fieldLast 3.3287 -> 2.9323, eyePass 8.7305 -> 8.1379, eyeConf 7.4985 -> 7.1219, fieldEmail 10.5242 -> 10.1237. EARLIER: display 89.96->14.801, lede 21.19->12.770, terms 20.078->10.666, five labels jointly 44.347->28.342, oneacct 12.912->6.329, helpPass 10.949->4.571. monogram **13.8039 -> 5.5289** — its "unreachable residual" was an artefact of the sweep rule 40 discredited; re-solved against a clean control, a 1.20px translation was worth 8.3 of the 13.8. The remaining 5.5289 IS the shape error (L +1.05 R -0.35 T -1.13 B -0.21: 1.40px narrow, 0.92px tall, aspect 1.291 vs 1.343) and is left as measured — closing it means re-tracing Marks004.tsx, and a non-uniform scale would buy the extents with the stroke widths. display **14.8012 -> 14.3046** on the CORRECTED window (ty -0.3455 + stroke 0.15; the first attempt at this band was scored on a window that clipped 20 of its 78 ink rows and is retracted — see rule 49/50). lede 12.7701 INVESTIGATED, NOT SHIPPED: not colour and not weight (rule 51 control), position already optimal (control beats every offset), stems median 2.0 in both. A (size,scale) valley floor of ~12.01 exists — 13.00/0.976 = 12.013, 12.94/0.980 = 12.057, 13.06/0.972 = 12.167 — but it is the rule 32 degeneracy, a diagonal ridge the band mean cannot resolve into one pair, and the attempt to pin the size independently used an x-height estimator that spanned BOTH lede lines (rule 45) and is void. Not shipped on an undetermined pair. OPEN, largest first: display 14.3046, lede 12.7701, terms 10.6657, fieldEmail 10.1237, plate 8.4842, labConfirm 8.3835, eyePass 8.1379, checkbox 7.1859, eyeConf 7.1219, oneacct 6.3291, monogram 5.5289 (shape). INDEPENDENTLY VERIFIED (not the builder's self-report): `.next-r9` predated the current 004 sources by two days and could not have contained this work, so it was reclaimed and a clean production build made into `.next-004v`, served by `next start` on 3181 and captured with the shipping harness. `python3 -m measure.report004` reproduces EVERY band to four decimals — whole screen 5.3669, display 14.3046, lede 12.7701, terms 10.6657, fieldEmail 10.1237, plate 8.4842, monogram 5.5289, orrow 2.4379. The work is real and it is in the built output. For calibration 003 graded A at 3.644, so 5.3669 is not yet there. RE-VERIFIED at ef46691 after a container rollback wiped the dist and the capture: clean production build (NODE_ENV=production, npm run build so `prisma generate` runs), served on 3181, captured with the shipping harness. Every band reproduces BYTE-IDENTICALLY to the earlier measurement taken at a different commit on a different container - whole screen 5.3669, display 14.3046, lede 12.7701, monogram 5.5289, orrow 2.4379. Two independent runs, two HEADs, same numbers to four decimals: the measurement is stable and Codex's intervening commits did not touch 004. GRADED **B+** by an independent grader (2026-08-11), below A, with ten measured defects each carrying a falsification test stated in advance. Its buy-backs are STEPS in a cumulative in-place simulation whose identity control costs only +0.0008, so the instrument fires. OPEN, largest buy-back first: fieldEmail text (+4.50,+2.00) 0.2905; bullets pitch 31.206->25.510, first centre 100.90->101.29, diameter 8.74->10.22 0.2596; plate label 6.4% oversized and 5px low 0.2512; signin 10% OVER-TRACKED not oversized (per-glyph width ratio exactly 1.0000, so the affine sx 0.907 is the WRONG prescription) 0.1193; field-value ink graphite where canonical is black-class 0.0786 but ONLY after the geometry - applied alone it makes the screen WORSE by +0.196, rule 49's mechanism exactly; display cap 1.8% short 0.0666; txtLast 0.0624; txtFirst 0.0591; plate mark 0.0208; share mark 0.0159. The grader FALSIFIED its own label-group finding: the five labels' ty do not share a sign (+1.10,+1.10,+0.80,+0.25,-0.40) so it is not one container offset - reported as four sub-pixel placements bounded at 0.213 instead. It also RE-CONFIRMED both documented residuals: lede 12.7701 (tried to defeat it, could not - helpPass, adjudicated correct, reads +4.2% on the same estimator, so the bias is the same order as the effect) and monogram 5.5289 (full affine buys 0.0022; it is shape, not placement). Its verdict: corrected, the screen lands at 4.1430, still 14% above the 3.6443 that earned 003 its A. ALL TEN APPLIED, whole screen **5.3669 -> 4.3657**. Each was solved by sweeping CSS variants in the SHIPPING rasteriser with a rule-40 control, then confirmed by a real build reproducing the sweep to four decimals: field values placed + bullet grid rebuilt (pitch 31.206->25.510, diameter 8.74->10.22) 5.3669->4.7157; plate label size 21.0->20.0 dy 8.52->12.52, scaleX UNTOUCHED, ->4.5095 (plate 8.4842->4.7206 after the viewfinder lift); signinLab ls -0.03->-0.07 dx->2.66 ->4.4295 (signin 5.1897->3.7430); --s4-value-ink #131419 ->4.4040; display scaleY 1.014 ->4.3718 (display 14.3046->13.7110); viewfinder lift ->4.3657. RULE 47 CONFIRMED FOUR TIMES: the grade's affine BOUNDED each defect but never PRESCRIBED the CSS - plate 19.74 was wrong (20.0, and the scale never needed touching), signin sx 0.907 was wrong (the defect was TRACKING; per-glyph width was exactly 1.0000), ink 0.0786 returned 0.0255 (a simulation darkens pixels, CSS re-rasterises glyphs). AND THE CONVERSE, which nearly cost a real finding: on display I first swept font-size with the advance divided back out through scaleX and EVERY variant scored worse, which looked like the grade failing to transfer. It was my parameterisation failing - scaleY at the grade's own 1.014 then bought 0.59. A wrong result from ONE parameterisation is a claim about the parameterisation, not a refutation of the finding. SHARE MARK DELIBERATELY UNMOVED: every offset in dy {0,0.55,0.9,1.4} x dx {0,0.55,1.1} returns signin 3.7430 to four decimals; proven not an instrument failure because (40,30) gives 4.5120 and hiding it gives 3.9234. Stated with its numbers rather than forced. RE-GRADED **A-** by a FRESH independent grader at 4.3657 (2026-08-11). Not A. It reproduced all 23 bands to 4dp, confirmed every one of the ten fixes held, and found the screen structurally flawless (23/23 bands present and in order; box edges to 0.04-0.22px; bullet grid 9/9 pitch 25.526->25.425). It also established the canonical-side export floor at 0.9281 against 003's 0.9398 - the two canvases have the SAME floor, so the 003 comparison at 3.6443 is fair and 004 is not being asked to clear a harder bar. Gap to the A bar 0.72; it names 0.46-0.94 of measured, falsification-tested placement error, so the bar is inside reach. IT REFUTED MY SHARE-MARK CONCLUSION AND WAS RIGHT - see the rule below. OPEN, by buy-back: terms orange link spans 5-7% wide relative to the black text in the same line (~0.11, blue-channel control survives, and o-height moves only +1.7% so it is horizontal distribution not size); lede per-glyph horizontal registration (~0.12-0.15, and lede1's advance ratio 1.00632 vs lede2's 0.99873 CANNOT be size or scale because one run shares both); five micro-cap labels ink-left 1.17-1.99px left, needing dx 1.68->2.86 which is OUTSIDE the 0.55px neighbourhood the recipe's quantisation note covers (0.0882 confirmed on three by rigid move; labLast and labConfirm need left-edge AND width); display glyphs 2.5% narrow with wider gaps at an exact total advance - the signinLab signature again (~0.06); share mark (+0.90,+0.50) 0.0158; eyePass dy+0.6 0.0066, eyeConf dx-0.3 0.0016. It could NOT break monogram (full translation buys 0.0010) or the lede size/scale valley, and it confirmed the viewfinder lift landed at the image-space optimum exactly. ROUND 3 APPLIED: share/eye marks via transform (rule 53) -> 4.3428; four of the five micro-cap labels -> **4.2137** (labFirst 5.5350->4.6190, labEmail 3.5891->2.5239, labPass 5.5681->4.2860 all by +1.0 device px through tx; labLast by WIDTH scaleX 0.62->0.61, not shift). THE REMAINING DEFECTS DO NOT ANSWER TO THE AVAILABLE CSS LEVERS, and that is the finding rather than a reason to keep grinding: terms - link letter-spacing made it WORSE at every value tested (10.6657 control, 10.8400 at -0.005em, 13.28 at -0.040em); links as inline-block scaleX gave only 10.4570 at 0.99 and worse below; condensing the whole run gave 13.84-14.50. Three parameterisations, no meaningful gain. display - the coupled scaleX-up/tracking-down sweep that the 'narrow glyphs, wide gaps, exact advance' signature implies EXPLODES the band to 32.6-63.8 against a 13.7110 control, because widening the glyphs at fixed size overflows the headline and wraps it. labConfirm - every (scaleX, shift) pair worse than shipping. WHAT THESE FOUR HAVE IN COMMON: the A- grade's buy-backs for them came from PER-WORD and PER-GLYPH image-space warps, which have no CSS lever short of wrapping every word or glyph in its own positioned span. That is markup surgery on a form the player actually uses, to buy about 0.3, and it is a decision to state rather than take unilaterally. Recorded with its numbers per the standing ruling on unreachable residuals. THIRD GRADE: **A- HELD, NOT ADVANCED**, and it REFUTED MY 'no CSS lever' claim for THREE of the four defects by demonstrating the buy-back rather than arguing. The lever I never tried is **word-spacing**. Its screen-level finding: EVERY multi-word Geist run on 004 has word gaps 1.3-2.0 device px too narrow and word ink 1.1-4.4% too wide - deltas sharing a sign across nine unrelated runs, rule 15's signature of ONE defect, not nine. The advance-based solve fitted total advance with scaleX, so a short space forced the glyphs wide; word-spacing breaks the rule-32 degeneracy because unlike size it does not touch cap height. ROUND 4 APPLIED ALL TEN OF ITS PRESCRIPTIONS, every band landing on its predicted value exactly and the whole screen on its combined figure: **4.2137 -> 3.9572**. terms 10.6657->7.2649 (scaleX 0.92, ws 1.1, plus link ls -0.02em - separable ONLY once the gaps are right, which is why my link-only sweep read worse at every value); labConfirm 8.3835->6.6196; lede 12.7701->11.8523, BEATING the (size,scale) valley floor of ~12.01 this ledger had declined to ship; labPass 4.2860->3.5308; labFirst 4.6190->3.9349; signin 3.4560->3.1961; orrow 2.4379->1.9943; labEmail 2.5239->2.2922; helpPass 4.5714->4.3262; labLast 3.5723->3.4984. IT ALSO FOUND A BUG THREE ROUNDS OF BAND MEANS COULD NOT SEE: signup/page.tsx carried an INLINE style minHeight:900, which beats the phone media query, so /signup computed 900px and the document scrolled 48pt revealing a blank band - scrolled, the screen reads 27.27 against canonical. 003 does the same thing correctly with md:min-h-[900px]. Zero pixels of the capture change, so no band ever saw it. Fixed; /signup now reports scrollY 0 / scrollHeight 852, identical to /signin. display 13.7110 STANDS as unreachable, now on better evidence than I had: its best word-spacing candidate is 15.2486, and the grader corrected my stated MECHANISM - the run is white-space:nowrap at 278.55 CSS px inside a 393px shell and CANNOT wrap, so the 32.6-63.8 explosion was plain misregistration cost on 78px caps, not the overflow I claimed. font-stretch/wdth is also not a lever: GeistVF.woff carries a wght axis only. THE METHOD FAILURE, recorded because it is the point: rule 13 requires an unreachable residual to carry algebra plus the measured alternative, and rule 52's corollary says a wrong result from one parameterisation is a claim about the parameterisation. I wrote up four defects as unreachable on exactly the evidence both rules forbid, and three fell to the first untried lever. FOURTH GRADE: **A- HELD A THIRD TIME**, at 3.9572, and it changed the reason. The previous two A- grades withheld A because a grader could name 0.26-0.94 of measured reachable error; this one could name **0.0309**, and it found out why the rest is out of reach. It reproduced all 23 bands to 4dp, ran a rule-40 control from the same dist that returned 3.9572 / n_over8 80548 identically, and cleared the screen structurally: 23/23 bands in canonical order, no run wraps (every text run computes white-space:nowrap and returns exactly one client rect), 393pt invariant held, every interactive control resolves to itself under elementFromPoint including both terms links and both eye buttons, the real user path fills all five fields and ticks the checkbox and flips the password type, and the desktop guard measured rather than argued (at 1440x900 the overlay computes display:none, .s4 is position:static, scrollHeight 900). SCROLL FIX INDEPENDENTLY VERIFIED in the served build with quiesce()'s scrollTo removed - scrollY 0, scrollHeight 852, zero scrollable descendants, served HTML carries md:min-h-[900px] and 0 occurrences of min-height:900 - and searched for siblings three ways, including a sweep of all 812 phone-CSS declarations against getComputedStyle, which found 0 genuine mismatches. ROUND 5 APPLIED ITS THREE MOVES, each landing on its predicted band value exactly and the whole screen on the combined figure: **3.9572 -> 3.9263**. helpPass tx 0 -> -0.30 (4.3262 -> 3.6233), terms ty 0 -> +0.45 (7.2649 -> 6.9464), orLab tx 1.2 -> 2.30 (orrow 1.9943 -> 1.7513). Rule 47 confirmed a fifth time. labConfirm's predicted 0.0059 was NOT applied and should not be: the grader proved the lever live (ty +0.65 moves the band to 10.8665, ty -0.40 to 6.7555) and the band still returns 6.6196 at every ty in +/-0.7 - the vertical rung is simply wider than the move. **THE BIG FINDING IS RULE 54: THE HEADLINE IS SET IN A DIFFERENT TYPEFACE FROM CANONICAL.** Within-run ink-width ratios - invariant under every lever four rounds were spent sweeping - put the render on tungsten_semibold at 0.34% rms and canonical OFF it at 4.62% (E +10.7%, C -4.2%); all seven bundled cuts were fitted and measured in-page and the shipped one wins by 6.1 band points. The correct face is not in this repository. Independently corroborated from the builder's side: per-glyph FREE translation - the optimum no shared CSS lever can beat - takes the in-box mean only 20.5730 -> 13.8907, and +per-glyph scaleX only to 12.9841, with every glyph's optimal dy exactly 0. IT IS NOT A 004 DEFECT: canonical 003 carries the same gap (4.53% vs 4.62%), so the 3.6443 A bar was itself set with this defect present and unmeasured. Gap to that bar is now 0.2820, and display's shape (0.4740) plus lede's per-word scatter (0.1190) alone exceed it - the whole remaining gap is placement error downstream of glyph metrics that no CSS lever on this screen can express. TWO INSTRUMENT HOLES FOUND AND CLOSED, both class-level rather than 004-specific: sweep-run.mjs injected into <head> and lost the cascade to PHONE_CSS's body <style> for any bang:true run, so every face sweep it ran measured the unmodified page (rule 55, fixed - the sheet now appends to end of body); and capture-ios.mjs had a horizontal guard with no vertical arm, which is how the min-height bug walked past it on all 72 screens (rule 56, fixed - scrollHeight and innerHeight now recorded for every screen and reported as `scrolls`). FIFTH GRADE: **A- HELD A FOURTH TIME**, at 3.9263, and it named 0.0825 of reachable error - nearly TRIPLE the previous round's 0.0309. Two of its four findings had been invisible for five consecutive grades because of a fault in the MEASURING INSTRUMENT, not in the screen (rule 57). It reproduced 3.9263 / n_over8 80306 to 4dp, ran its own rule-40 control from the live dist that returned the same, and captured 003 from the same dist at **3.6443** - reproducing the A-grade calibration figure exactly, which is what makes the comparison usable. Rule 50 re-checked clean: out-of-window mean |d| 0.9903 against the 0.9281 canonical export floor, only 182 of 80,306 hot pixels outside all 23 windows. ROUND 6 APPLIED ITS FOUR MOVES AND EVERY ONE LANDED ON ITS PREDICTED VALUE, whole screen **3.9263 -> 3.8438** and n_over8 80306 -> 79893, both exactly as predicted. lede1 tx 0 -> -0.536 (15.7273 -> 14.1329); createLab tx/ty 0 -> 0.20/0.18 (plate 4.7206 -> 4.0960); signinLab tx 0 -> -0.25 (signin 3.1961 -> 3.0637); terms tx 0 -> -0.05 (6.9464 -> 6.8756). Rule 47 confirmed a SIXTH time. **THE INSTRUMENT FAULT IS THE FINDING.** The report carried ONE `lede` window over TWO independently positioned runs whose optimal corrections have OPPOSITE SIGNS, so a 2.1496 defect on line 1 averaged down to a 0.4413 compromise and read as solved. Split at row 312 (inside the gap between the two lines' ink, so neither is clipped), line 1 shows **15.7273** - the second-worst band on the screen, behind only the headline - where the aggregate had read 11.8523. The same arithmetic in its other form hid createLab and signinLab: a hot label inside an already-solved box is divided by the box's area. In their own diagnostic sub-windows they measured **19.6505** and **23.2584** where their parent bands read 4.7206 and 3.1961 - a factor of six. Sub-windows are reported SEPARATELY and deliberately NOT merged into the band table, because folding overlapping rows in would silently change the meaning of every band figure this ledger has quoted for five rounds. After the fixes: createLab 13.8227, signinLab 21.6707. MEASURED NEGATIVES, stated rather than forced: lede1's vertical is already optimal (ty across +/-0.345 returns 14.1329 identically; +0.4608 gives 14.3525, -0.4608 gives 17.4070) and its +1.25% advance excess is unreachable (per-line scaleX worse at every value: 0.942 -> 14.71, 0.938 -> 15.45, 0.934 -> 18.40, 0.930 -> 19.91). labConfirm's ty stays put, re-verified: ty in {-0.30, -0.15, 0} all return 6.6196 and ANY positive ty jumps to 8.5821, costing 0.0501. The fourth grade's decision not to apply it was right. display stroke 0.15 -> 0.35 NOT applied: it buys 0.0039 and trades against the documented ladder weight match. RULE 54 INDEPENDENTLY RECONFIRMED, with the estimator rebuilt from scratch rather than reused: no pure scale maps the render's glyph ink widths onto canonical's (3.97% rms, 2.89px max on ~35px glyphs), and the two-parameter affine escape - which would absorb any uniform stroke or unsharp-mask halo term - demands a physically absurd +10.3px constant and STILL leaves 2.99%. Canonical's E is +15.1% relative to its C where the render's is -23%. 37 CSS candidates across tx/ty/stroke/sy/sx/ls/ws/weight with read-back confirming injection landed: best 13.6396, a 0.5% gain. ONE CORRECTION TO THIS LEDGER'S OWN NUMBER: crossings.glyph_widths's default pad=4 bleeds neighbours on canonical's tight tracking (canonical's two A's disagreed by 10%, its two T's by 12% - measurement error, not type). Bounding the pad by the actual inter-glyph gap makes every repeated letter agree to 0.4% and lowers canonical-vs-tungsten_semibold from the recorded 4.62% to **3.98%**. The conclusion is unchanged; the headline figure was overstated. ON CALIBRATION the fifth grader partly disagreed with the fourth and is right: lede's 0.1190 was NOT all per-word scatter - 0.0380 of it was plain reachable rigid translation. The honest comparison removes the headline from both screens: 003 (graded A) 3.6443 whole / **3.3021** headline-excluded; 004 now 3.8438 whole / **3.2645** headline-excluded. Outside the headline the fixed screen is BETTER than the screen that earned the A, and 004 carries LESS ink than 003 (122,264 vs 132,040 canonical px), so the comparison is not flattered by density. STRUCTURAL, all new tests, all clean: all four validation error states render as a single line at 836.22-852.22pt with scrollHeight still 852; both terms links sit inside the checkbox's label and Chromium's interactive-content exemption holds - measured at EVENT-DISPATCH time, zero click/change events on the checkbox when either link is tapped, while tapping the plain label text correctly fires both; /terms and /privacy return 200. FIXED: firstName and lastName carried no autocomplete where the other three inputs did, so the browser offered an email and two passwords and left the player to type their own name - now given-name / family-name, zero pixels. RULE 58 came out of this round too: a full 72-screen capture ran eight minutes, captured every screen, then died writing its summary on an unset env var and threw away all 72 results without printing one. Findings now print before the persist is attempted, the persist falls back to OUT, and its failure is caught rather than thrown. SIXTH GRADE: **A- HELD A FIFTH TIME**, at 3.8438, and it OVERTURNED THIS LEDGER'S OWN CLAIM about display. It reproduced 3.8438 / n_over8 79893, took its own capture from the same dist that was BYTE-IDENTICAL to the committed render, reproduced 003 at 3.6443 from the same dist, and re-checked rule 50 (out-of-window 0.9903, 182 of 79,893 hot pixels outside all 23 windows). ROUND 7 APPLIED ITS THREE MOVES AND EVERY BAND LANDED EXACTLY, whole screen **3.8438 -> 3.7825** and n_over8 79893 -> 79258, both as predicted. display 13.7110 -> **12.7612**; fieldFirst 2.1975 -> **2.1003**; wordmark 4.1879 -> **4.0584**. **THE DISPLAY BAND WAS NEVER FULLY UNREACHABLE AND I WROTE THAT IT WAS.** Rule 57 had been applied to lede, plate, signin and the five field bands, and NOT to display, because display was already marked closed. Split by WORD its two halves want optima of OPPOSITE SIGN - CREATE 26.1342 -> 24.4445 at dx -1.05 device px, ACCOUNT 15.2209 -> 15.0664 at dx +0.15 - the lede signature exactly. 0.0515 of whole screen, through two fields that already existed (tx -0.3209 with ws 3.85 -> 4.2952). Four rounds of sweeps missed it because every one moved the run AS A WHOLE: tx alone at the measured -1.05 scores 16.2278 against a 13.7110 control, WORSE, and word-spacing alone is worse in both directions. Only the COMPENSATED PAIR separates the words. A defect whose correction is a compensated pair is invisible to any sweep of either lever alone and looks exactly like proof that neither works. See rule 59. Rule 54's FACE finding survived a third independent attack (per-glyph width ratios rebuilt from scratch run 0.877 to 1.016 across the 13 glyphs, a 14% spread, no uniform scale fits); what was wrong was the COROLLARY I drew from it. ty and sy were BOTH re-swept at the new horizontal position rather than assumed to carry over, and both still win. THE FIVE FIELD BANDS were split too and show real dilution (values read 17-27 in their own windows against bands of 1.76-4.81) but only valFirst yields; the horizontal null is real rather than an instrument claim, because the control wins at every offset in +/-2.0 device px WHILE the score moves continuously, so the lever is live. orrow hides orLab at 32.72 against a band of 1.7513 - a factor of 19 - but the label is already at its optimum and a rigid shift buys 0. lede1, lede2, oneacct, terms and helpPass all tested per-word: optima alternate sign with NO monotone trend, so they are scatter, not a gap - which is why display was the only band that yielded. BOTH DELIBERATE NON-APPLICATIONS CONFIRMED, one on better evidence than was recorded: display stroke 0.35 was rightly declined, and the real reason is stronger than the one on file - at the shipped 0.15 the run is already HEAVY on every rung (rms_log 0.0201, not 'matched' as the recipe says), and 0.35 triples that to 0.0595 to buy 0.0039. labConfirm's wanted move is smaller than its rung. MORE MEASURED NULLS: valEmail's -0.50 vertical bound made it WORSE (19.3605 -> 19.6044, rule 47 a seventh time); oneacct scaleX worse at every value; lede/terms word-spacing worse in every case; the plate box is genuinely solved (its 6,134 hot pixels are the rasteriser floor - sub-pixel crossings put top/bottom at 0.12 and left/right at 0.03 device px); checkbox extents are exact and its 7.1859 is ring and tick SHAPE, whose lever is Marks004.tsx and not phone-004.ts. ACCESSIBILITY DEFECT FIXED: both eye buttons were named 'Show password', so an ARIA snapshot read `button "Show password"` twice and a screen-reader user could not tell which field each revealed. The confirm button is now named for its own field; verified live - two distinct names, correct toggle labels, and the two fields toggle independently. 003 has one password field and could never have surfaced this. ON CALIBRATION the sixth grader verified the arithmetic independently (004 headline-excluded 3.2644 against the recorded 3.2645; 003 3.2985 against 3.3021; the less-ink claim survives a different threshold at 0.924 vs 0.926) and then made the objection that matters: excluding the headline is only legitimate if the headline is unreachable, AND IT WAS NOT. That is why this round is a fix and not an argument. It also measured 004's headline carrying +24.4% more error per unit canonical ink than 003's, which the shared-face story does not fully explain; this fix closes that to +15.5%. Stated with the grader's own caveat: 14 glyphs at ~35px against 6 at ~76px means more edge per unit ink, so it is suggestive rather than decisive. SEVENTH GRADE: **A- HELD A SIXTH TIME** at 3.7825, and it was the strongest round yet - ELEVEN defects worth 0.0861, FIVE of them in Marks004.tsx, a file this ledger had twice correctly named as the lever for the checkbox and monogram residuals and that nobody opened for seven rounds. ROUND 8 APPLIED ALL ELEVEN: whole screen **3.7825 -> 3.6956** (grader predicted 3.6964) and n_over8 79258 -> **76152** (predicted 76150). THE MONOGRAM ARC WAS MALFORMED and the browser was silently repairing it into the wrong place: the old path's endpoint is not on its own r=11.8 circle (chord 23.729, so the minimum radius is 11.865), and per SVG spec Chromium scales the radii up and re-centres on the chord midpoint, 1.24 px below the intended point. Measured, the hook sat 0.954 px low and 1.037 px right while the E-arm block beside it was within 0.53 px on every side - which is what says the ARC and not the placement. Re-cut as a semicircle that closes exactly: 5.5289 -> **4.9232**. THE EYE PUPIL IS A DIFFERENT DRAWING, NOT A MISPLACED ONE, and the proof is that r=0 - no pupil at all - scores BETTER than any positive radius (eyePass 5.0596, eyeConf 4.7359). A size error cannot do that. Canonical draws a small broken arc where this draws a closed circle; r 4.2 / stroke 2.6 is the best honest value inside the existing parameters. eyePass 7.0040 -> **5.0992**, eyeConf 6.8625 -> **5.0148**. Drawing the broken arc properly would beat it and is a re-trace, not a tune. checkbox ring and tick oversized (rx 7.4 -> 6.0, stroke 2.24 -> 1.90, tick re-traced, 3.5 -> 3.2): 7.1859 -> **5.2033**, and its MAX fell 171 -> 84, i.e. the worst mismatched pixels are gone rather than averaged down. Field borders and the sign-in border were too heavy AND too dark, and the pair had to move together (strokeWidth 1.74 -> 1.66 with --s4-field-rule #DBDCE0 -> #DEDFE3; 1.70 -> 1.60 with --s4-hair #D1D2D6 -> #D5D6DA): five field bands 12.3829 -> 11.0135, signin 3.0637 -> 3.0047. COMPENSATED PAIRS on lede1 (14.1329 -> **13.8831**), lede2 (7.5898 -> **7.2253**), helpPass (3.6233 -> **3.4332**), labFirst (3.9349 -> **3.6701**), labLast (3.4984 -> **3.3847**), plus labConfirm answering to tx ALONE (6.6196 -> **6.3993**) - a band this ledger records as answering to neither knob, on a vertical-rung argument that was correct about ty and got silently generalised to the run. **RULE 61, AND IT IS A CORRECTION OF THE PREVIOUS ROUND'S WORK:** rule 59 said to test for compensated pairs; round 7 tested them the CHEAP way - per-word optima, look for a monotone ramp - found scatter, and wrote off six runs. Five were wrong. The band mean is NOT the sum of per-word optima: lede1's per-word optima genuinely scatter (+0.69, 0.00, -1.02, -2.68, -0.03, +0.77, +5.00 device px) and fit a ramp badly, and the ramp still buys 0.2498, because the band is scored on PIXELS and the proxy was scored on CENTROIDS. oneacct and terms ARE real 2-D nulls and only the grid could say which was which. **RULE 62:** a CSS geometry property is not interchangeable with the SVG attribute it shadows. An orrow gain measured through CSS as 1.7513 -> 1.5892 delivers only 1.7380 through the attribute (with height.baseVal read back as exactly 1.5, so the injection landed) and puts n_over8 UP 599. Dropped rather than claimed. Also: [data-s4="eyePass"] circle matches TWO circles - the desktop lucide Eye sits in a display:none span beside the real pupil - so a querySelector injection hits the invisible one and returns a null that reads exactly like a dead lever. FUNCTIONAL, which is where four consecutive rounds' real findings have been. **NO VISIBLE FOCUS INDICATOR on five of six controls**: the recipe sets outline:none to hold the canonical render and put nothing back, so arriving at a field with a real Tab left the full-page screenshot BYTE-IDENTICAL to the unfocused page. WCAG 2.4.7, introduced by the recipe - the checkbox, which never had outline:none, still showed the UA ring. Restored on :focus-visible. **AND I THEN WROTE A FALSE CLAIM ABOUT IT AND MEASURED IT DOWN:** the first version of that code comment said the ring is invisible to a pointer user. It is not - a TEXT INPUT matches :focus-visible on a pointer click too, because it accepts keyboard input, and the ring duly appears in both paths (computed box-shadow rgb(253,55,1) inset either way). Only the eye BUTTONS get keyboard-only behaviour. What actually protects the canonical render is the BLUR, not the pointer/keyboard distinction: the route map's steps end with a blur, so no focused control is ever in frame - confirmed by this round's capture landing on its predicted figure. FIXED IN 003 TOO (phone-003.ts carried the identical two lines): 003 is graded A and should not sit on a known accessibility failure. Email format was validated ONLY by the server, so a bad address cost a POST and a 400 where the other three rules cost nothing - client gate added and verified live (0 POSTs, 'Enter a valid email address'). No aria-invalid or aria-describedby anywhere: the error was announced via role=alert but nothing tied it to the field at fault. Wired and verified live - the flag follows the failing rule (email -> null / confirm -> true on a mismatch). SENT TO AN EIGHTH FRESH GRADER at 3.6956. Gap to 003's 3.6443 is now **0.0513 with NOTHING excluded**, where two rounds ago the case for A depended on excluding the headline. NOT DONE. |
| 005+ | … | not started | — | |

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

## Method rules — sixty-four, each learned by getting something wrong

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

- Never edit the four measurement-tuned type roles in `globals.css`.
- Scope a colour disagreement to the screen; never change a global token — those
  roles carry the 20 desktop screens graded B+.
- Never delete a region or pad dead space to improve a score.
- Never build into a dist dir while a server serves from it.
- State physically unreachable residuals with their numbers rather than forcing
  them and breaking another metric.
- Do not commit a tree that fails `tsc` or a screen that breaks its size invariant.

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

### OPEN, CLASS-LEVEL: every phone screen scrolls horizontally below 393pt

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
