# ShotIQ iOS 72 Screen Feature and Functionality Map

Source of truth: `basketball-analysis/docs/shotiq/screen-implementation-map.json`,
`basketball-analysis/ios-native/ShotIQ/UITests/CanonicalScreenshotTests.swift`, and
the native SwiftUI screen files under `basketball-analysis/ios-native/ShotIQ/Screens`.

Purpose: map every canonical iOS screen to the feature it represents, the real
customer functionality it must support, and the proof surface that must be checked
when fixing the native app. Kevin's rule still applies: finish one screen fully
before starting the next.

Customer feedback rule for all 72 screens: any tap that changes data, requests a
permission, uploads media, starts analysis, records a shot, saves progress, shares,
or waits on network/device work must visibly confirm what is happening with a
toast, progress indicator, loading/disabled state, or system prompt.

| # | Screen | Area | Primary feature | Required functionality | Media / proof surface |
|---|---|---|---|---|---|
| 001 | splash | Auth | Brand launch | Show ShotIQ launch state, hold deterministically in UI tests, then advance to welcome. | Brand mark, launch timing, no dead blank state. |
| 002 | welcome | Auth | Entry choice | Let customer choose sign in or create account; both routes must work. | Hero/brand imagery and working auth buttons. |
| 003 | sign-in | Auth | Existing account login | Email/password entry, forgot-password route, submit state, validation, auth failure/success feedback. | Form fields, password visibility, loading/toast/error feedback. |
| 004 | create-account | Auth | New account registration | First/last/email/password/confirm-password, terms acceptance, create account submit, route to verification/onboarding. | Form validation, checkbox, loading/toast/error feedback. |
| 005 | verify-email | Auth | Email verification | Code entry, resend code, verify account, handle expired/wrong code. | Code fields, resend timer/state, success/error feedback. |
| 006 | forgot-password | Auth | Password reset request | Email entry, send reset link, route to reset-password for users with a link. | Confirmation toast/progress and error state. |
| 007 | reset-password | Auth | Password replacement | Token-aware reset screen, new password/confirm password, checklist/validation, submit feedback. | Password checklist, loading/toast/error feedback. |
| 008 | onboarding-intro | Onboarding | Start profile setup | Explain setup value and route into physical profile. | Intro panels, start button, progress through onboarding. |
| 009 | physical-profile | Onboarding | Body measurements | Capture height, weight, age/reach style profile values and continue only with valid input. | Form controls, validation, progress through onboarding. |
| 010 | experience-body-type | Onboarding | Experience and body type | Select skill level/body type/preferences and continue. | Segmented/options controls, selected states. |
| 011 | shooting-profile | Onboarding | Shooting identity | Capture handedness, position, shot profile, mechanics preferences. | Option chips/cards, selected states, validation. |
| 012 | player-bio | Onboarding | Player identity | Capture name, team/context, bio fields and review route. | Form fields, avatar/initials if present, validation. |
| 013 | onboarding-review | Onboarding | Profile review/save | Summarize onboarding data, allow edits, complete profile, continue without saving if backend blocks. | Save progress/toast/error and review summary. |
| 014 | camera-permission-primer | Onboarding | Camera permission | Explain camera need, request real iOS camera permission, offer not-now route. | System camera prompt, permission feedback, camera iconography. |
| 015 | photo-library-permission | Onboarding | Photo library permission | Explain photo import, request real iOS photo authorization, offer camera instead. | System photo prompt, sample media, permission feedback. |
| 016 | notification-permission-primer | Onboarding | Notifications | Explain reminders/results/goals alerts, request real notification permission, allow skip. | System notification prompt and sample result card. |
| 017 | home-new-player | Home | Empty/new-player dashboard | Show first-shot CTA, capture guide, setup checklist, and routes to image/video/live capture. | Real capture-option imagery, checklist state, navigation. |
| 018 | home-standard | Home | Standard dashboard | Show latest analysis, form score, session stats, next workout, and analyze-shot actions. | Latest analysis photo, stats strip, progress/trend chart. |
| 019 | home-professional | Home | Advanced dashboard | Show pro/advanced dashboard summary with deeper analytics and training routes. | Latest analysis photo, pro-level stats/cards. |
| 020 | profile-menu | Home | Account/profile menu | Open profile menu/sheet, switch dashboard mode, navigate to profile/settings/elite/training areas. | Sheet layout, segmented controls, toasts for menu actions. |
| 021 | analyze-hub | Capture | Capture entry hub | Choose live camera, upload video, upload image, view capture guide, open recent media. | Four capture photos, no missing placeholders, all routes alive. |
| 022 | photo-upload-source | Capture | Photo source selection | Choose camera, library, or sample photo; handle permission and import/capture result. | PhotosUI/camera integration, source buttons, loading/toast. |
| 023 | photo-review-crop | Capture | Photo crop/review | Display selected real image, rotate/crop/retake/continue to quality check. | Crop box, real photo, no black placeholder, progress on continue. |
| 024 | upload-quality-check | Capture | Image quality gate | Evaluate lighting/resolution/framing/viewpoint and allow analyze/upload when acceptable. | Quality checklist, real image preview, toast/progress/error. |
| 025 | upload-queue | Capture | Upload queue | Show queued items, upload/analyze progress, retry/remove failed items. | Progress bars, queue rows, success/failure toasts. |
| 026 | video-upload | Capture | Video import | Choose video source, show filming tips, accept imported video and move to review. | Video thumbnail/cards, duration badges, PhotosUI/video route. |
| 027 | video-review | Capture | Video review/trim | Preview selected video, trim/select frame, continue to analysis/upload. | Video player/thumbnail, scrubber/trim state, progress feedback. |
| 028 | live-camera-setup | Capture | Live capture setup | Explain camera position and permissions, start camera setup path. | Real camera/fallback viewfinder photo, setup checklist. |
| 029 | hoop-calibration | Capture | Hoop calibration | Calibrate hoop/rim area before live recording; allow continue when framing is ready. | Hoop/photo calibration imagery, overlay guides, progress. |
| 030 | readiness-check | Capture | Readiness gate | Confirm player, hoop, lighting, and camera are ready before capture. | Readiness checklist, pass/fail indicators, continue feedback. |
| 031 | capture-ready | Capture | Recording countdown | Show ready state/countdown and start recording. | Camera preview/fallback, countdown/progress state. |
| 032 | live-recording | Capture | Live video recording | Record live session, show timer/shot counter/controls, stop safely. | Real camera preview or canonical fallback, timer, recording HUD. |
| 033 | live-form-feedback | Capture | Live form feedback | Show live mechanics hints while recording or immediately after detected form state. | Pose/wireframe-style feedback, score badges, live media preview. |
| 034 | shot-detected | Capture | Shot event confirmation | Detect a shot, show make/miss/event details, allow keep recording or review. | Shot event HUD, media preview, toast/progress on save. |
| 035 | capture-review | Capture | Session review | Review captured session, selected shots, save/send to analysis. | Session screenshots/thumbnails, summary stats, progress on analyze. |
| 036 | analysis-processing | Analysis | AI analysis progress | Show multi-step processing while media uploads/analyzes. | Progress bar/spinner, stage text, no silent wait. |
| 037 | analysis-taking-longer | Analysis | Slow analysis fallback | Tell customer analysis is still running, allow continue waiting/background/retry route. | Long-running progress state and reassurance copy. |
| 038 | analysis-result-overview | Analysis | Result summary | Show form score, key metrics, primary flaw, routes to breakdown/metrics/share/training. | Real shot image with pose/wireframe evidence, score cards. |
| 039 | no-analysis-yet | Analysis | Empty analysis state | Explain no saved analysis and route to analyze a shot. | Empty-state graphic/photo and working capture CTA. |
| 040 | analysis-error | Analysis | Analysis failure recovery | Show failed analysis reason, retry, replace media, or return to capture. | Error banner, retry loading/toast, preserved media context. |
| 041 | shot-breakdown | Analysis | Shot phase breakdown | Display setup/load/rise/release/follow-through phases and drill routes. | Phase images/thumbnails, score bars, navigation. |
| 042 | frame-detail-skeleton | Analysis | Frame skeleton detail | Show selected frame with body pose skeleton/wireframe and measurements. | Pose skeleton/wireframe overlay, real frame, measurement labels. |
| 043 | annotation-toolbar | Analysis | Annotation tools | Let customer mark up a frame: draw/undo/redo/save/share annotations. | Toolbar icons, annotated screenshot/image, save/share feedback. |
| 044 | form-score | Analysis | Form score breakdown | Explain score, phase scores, and what affects the grade. | Score ring/bar, metric cards, progress indicators. |
| 045 | metric-detail | Analysis | Metric explanation | Drill into one metric with measured value, target band, meaning, and coaching cue. | Metric chart, measurement bands, frame/photo proof. |
| 046 | flaws-overview | Analysis | Flaw priority list | List detected flaws by impact/confidence and route to each detail. | Flaw cards, trend/chart snippets, add-all-to-plan feedback. |
| 047 | flaw-detail | Analysis | Flaw correction | Explain flaw impact, affected frames, target position, recommended drill, add to goals. | Evidence frames with pose overlay, share, add-to-goal toast/progress. |
| 048 | player-card | Elite | Shareable player card | Build player card from profile/latest analysis, download/export/share. | Exportable card image, stats, screenshot/share surface. |
| 049 | customize-player-card | Elite | Card customization | Let customer change card accent/style/details before export. | Live card preview, style controls, save/export feedback. |
| 050 | elite-match | Elite | Elite comparison score | Compare customer mechanics to elite reference metrics and show match gaps. | Comparison charts, measurement bands, elite reference values. |
| 051 | photo-comparison | Elite | Side-by-side comparison | Show customer photo next to elite shooter with aligned mechanics. | Two real photos, pose/wireframe comparison, sync/zoom states. |
| 052 | elite-shooters | Elite | Shooter library | Browse/search/filter elite shooters and open detail pages. | Shooter photos, filter chips, loading/error/empty states. |
| 053 | elite-shooter-detail | Elite | Elite shooter profile | Show shooter stats, reference mechanics, media, and compare/share actions. | Shooter photo, stats tabs, comparison route, share surface. |
| 054 | training-home | Training | Training dashboard | Show training plan, recommended drills, saved workouts, and quick-start routes. | Workout cards, progress summaries, routes alive. |
| 055 | quick-start | Training | Fast workout setup | Configure a quick session and start drill execution. | Setup controls, selected state, start progress/toast. |
| 056 | discover-drills | Training | Drill discovery | Browse/search/filter drills and save/open a drill. | Drill cards, filters, save toast, empty/loading states. |
| 057 | drill-detail | Training | Drill instructions | Show drill purpose, steps, cues, media, and start/save actions. | Drill image/video placeholder, steps, save/start feedback. |
| 058 | my-drills | Training | Saved drills | Show saved/custom drills, remove/reorder/start. | Saved drill list, empty state, toast on save/remove. |
| 059 | workout-calendar | Training | Workout calendar | Show scheduled/completed workouts and open a day/session. | Calendar grid, completion markers, route states. |
| 060 | drill-execution | Training | Active drill | Run drill timer/reps, pause/resume, complete workout. | Timer/progress, rep controls, completion save feedback. |
| 061 | shot-tracker | Training | Manual shot tracker | Mark make/miss, undo last shot, track percentage, end workout and save. | Make/miss controls, progress row, toasts for each action. |
| 062 | workout-completion | Training | Workout summary | Show shots/makes/accuracy/points/form progress; repeat/share/review shots. | Summary screenshot/share surface, progress bars, saved state. |
| 063 | goals | Goals | Goal dashboard | List active goals, progress, completion, create-goal route. | Goal progress bars/cards, empty state, refresh/load feedback. |
| 064 | create-goal | Goals | Goal creation | Choose metric/target/date, validate, save new goal. | Form controls, progress/toast/error on save. |
| 065 | goal-detail | Goals | Goal tracking detail | Show goal progress history, related drills/analysis, edit/complete actions. | Progress chart, linked workouts/analysis, save/complete feedback. |
| 066 | analytics-cards | Analytics | Analytics overview | Show scan-friendly analytics cards for shots, accuracy, form score, trends. | Charts/cards, time summary, loading/empty states. |
| 067 | analytics-detailed | Analytics | Deep analytics | Filter by date/type/metric and inspect detailed trends. | Charts, filters, segmented controls, share/export feedback. |
| 068 | my-media | Media | Media library | Browse captured/uploaded photos/videos, filter/sort/select media. | Real thumbnails, no missing placeholders, delete/share feedback. |
| 069 | media-detail | Media | Media item detail | Show selected photo/video, metadata, linked analysis, delete/share/reanalyze. | Real photo/video preview, linked analysis route, destructive confirmation. |
| 070 | profile | Profile | Player profile | Show profile fields, stats, player card, goals/media/settings routes. | Avatar/initials, profile stats, edit/save feedback. |
| 071 | settings-hub | Settings | Settings/actions | Manage dashboard mode, profile/preferences, external actions, logout-style flows. | Toggles/rows, toasts before external opens, real app state. |
| 072 | share-results | Share | Results sharing | Export/share analysis result, copy summary, save image/screenshot/PDF-style card. | Share sheet, generated image/screenshot, export progress/success feedback. |

## Fix Priority Tags

Use these tags when turning the map into implementation work:

- `media-real`: screen must show a real photo/video/thumbnail, not a black or generic placeholder.
- `pose-wireframe`: screen must show a pose skeleton, wireframe, calibration guide, or measurement overlay.
- `progress-toast`: customer must see confirmation, progress, loading, or error feedback.
- `click-route`: every visible button/link must land somewhere real or give feedback.
- `native-device`: must be verified on the iPhone/native build, not just the screenshot harness.

## Screens With Special Proof Requirements

| Requirement | Screens |
|---|---|
| Real photo/video or screenshot/export surface | 017, 018, 019, 021, 023, 024, 026, 027, 028, 029, 032, 033, 034, 035, 038, 041, 042, 043, 045, 047, 048, 049, 051, 052, 053, 057, 062, 068, 069, 072 |
| Pose, skeleton, wireframe, calibration, or measurement overlay | 029, 033, 038, 042, 043, 045, 047, 050, 051 |
| Upload/analyze/save/share progress or toast is mandatory | 003, 004, 005, 006, 007, 013, 014, 015, 016, 022, 023, 024, 025, 026, 027, 035, 036, 037, 040, 043, 046, 047, 048, 049, 053, 056, 058, 060, 061, 062, 064, 065, 067, 069, 071, 072 |
| Training workflow | 054, 055, 056, 057, 058, 059, 060, 061, 062 |
| Analysis workflow | 036, 037, 038, 039, 040, 041, 042, 043, 044, 045, 046, 047 |
| Capture workflow | 021, 022, 023, 024, 025, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035 |
