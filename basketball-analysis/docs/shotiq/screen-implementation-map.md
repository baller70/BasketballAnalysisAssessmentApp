# ShotIQ Screen Implementation Map

Generated 2026-07-31 from the canonical `HoopTrackLayoutSidecar` payloads embedded in the
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
| `ios.splash` | ios | 853x1844 | 17 | 3 | `ios://ios.splash` | `ios/App/App/Screens/SplashView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-splash` | TO-BUILD (native SwiftUI) |
| `ios.welcome` | ios | 853x1844 | 145 | 3 | `ios://ios.welcome` | `ios/App/App/Screens/WelcomeView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-welcome` | TO-BUILD (native SwiftUI) |
| `ios.sign-in` | ios | 853x1844 | 53 | 3 | `ios://ios.sign-in` | `ios/App/App/Screens/SignInView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-sign-in` | TO-BUILD (native SwiftUI) |
| `ios.create-account` | ios | 853x1844 | 72 | 3 | `ios://ios.create-account` | `ios/App/App/Screens/CreateAccountView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-create-account` | TO-BUILD (native SwiftUI) |
| `ios.verify-email` | ios | 853x1844 | 43 | 3 | `ios://ios.verify-email` | `ios/App/App/Screens/VerifyEmailView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-verify-email` | TO-BUILD (native SwiftUI) |
| `ios.forgot-password` | ios | 853x1844 | 41 | 3 | `ios://ios.forgot-password` | `ios/App/App/Screens/ForgotPasswordView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-forgot-password` | TO-BUILD (native SwiftUI) |
| `ios.reset-password` | ios | 853x1844 | 105 | 3 | `ios://ios.reset-password` | `ios/App/App/Screens/ResetPasswordView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-reset-password` | TO-BUILD (native SwiftUI) |
| `ios.onboarding-intro` | ios | 853x1844 | 115 | 3 | `ios://ios.onboarding-intro` | `ios/App/App/Screens/OnboardingIntroView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-onboarding-intro` | TO-BUILD (native SwiftUI) |
| `ios.physical-profile` | ios | 853x1844 | 73 | 3 | `ios://ios.physical-profile` | `ios/App/App/Screens/PhysicalProfileView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-physical-profile` | TO-BUILD (native SwiftUI) |
| `ios.experience-body-type` | ios | 853x1844 | 77 | 3 | `ios://ios.experience-body-type` | `ios/App/App/Screens/ExperienceBodyTypeView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-experience-body-type` | TO-BUILD (native SwiftUI) |
| `ios.shooting-profile` | ios | 853x1844 | 270 | 3 | `ios://ios.shooting-profile` | `ios/App/App/Screens/ShootingProfileView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-shooting-profile` | TO-BUILD (native SwiftUI) |
| `ios.player-bio` | ios | 853x1844 | 146 | 3 | `ios://ios.player-bio` | `ios/App/App/Screens/PlayerBioView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-player-bio` | TO-BUILD (native SwiftUI) |
| `ios.onboarding-review` | ios | 853x1844 | 101 | 3 | `ios://ios.onboarding-review` | `ios/App/App/Screens/OnboardingReviewView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-onboarding-review` | TO-BUILD (native SwiftUI) |
| `ios.camera-permission-primer` | ios | 853x1844 | 163 | 3 | `ios://ios.camera-permission-primer` | `ios/App/App/Screens/CameraPermissionPrimerView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-camera-permission-primer` | TO-BUILD (native SwiftUI) |
| `ios.photo-library-permission` | ios | 853x1844 | 157 | 3 | `ios://ios.photo-library-permission` | `ios/App/App/Screens/PhotoLibraryPermissionView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-photo-library-permission` | TO-BUILD (native SwiftUI) |
| `ios.notification-permission-primer` | ios | 853x1844 | 115 | 3 | `ios://ios.notification-permission-primer` | `ios/App/App/Screens/NotificationPermissionPrimerView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-notification-permission-primer` | TO-BUILD (native SwiftUI) |
| `ios.home-new-player` | ios | 853x1844 | 89 | 3 | `ios://ios.home-new-player` | `ios/App/App/Screens/HomeNewPlayerView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-home-new-player` | TO-BUILD (native SwiftUI) |
| `ios.home-standard` | ios | 853x1844 | 101 | 3 | `ios://ios.home-standard` | `ios/App/App/Screens/HomeStandardView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-home-standard` | TO-BUILD (native SwiftUI) |
| `ios.home-professional` | ios | 853x1844 | 165 | 3 | `ios://ios.home-professional` | `ios/App/App/Screens/HomeProfessionalView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-home-professional` | TO-BUILD (native SwiftUI) |
| `ios.profile-menu` | ios | 853x1844 | 277 | 3 | `ios://ios.profile-menu` | `ios/App/App/Screens/ProfileMenuView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-profile-menu` | TO-BUILD (native SwiftUI) |
| `ios.analyze-hub` | ios | 853x1844 | 141 | 3 | `ios://ios.analyze-hub` | `ios/App/App/Screens/AnalyzeHubView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-analyze-hub` | TO-BUILD (native SwiftUI) |
| `ios.photo-upload-source` | ios | 853x1844 | 84 | 3 | `ios://ios.photo-upload-source` | `ios/App/App/Screens/PhotoUploadSourceView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-photo-upload-source` | TO-BUILD (native SwiftUI) |
| `ios.photo-review-crop` | ios | 853x1844 | 141 | 3 | `ios://ios.photo-review-crop` | `ios/App/App/Screens/PhotoReviewCropView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-photo-review-crop` | TO-BUILD (native SwiftUI) |
| `ios.upload-quality-check` | ios | 853x1844 | 172 | 3 | `ios://ios.upload-quality-check` | `ios/App/App/Screens/UploadQualityCheckView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-upload-quality-check` | TO-BUILD (native SwiftUI) |
| `ios.upload-queue` | ios | 853x1844 | 122 | 3 | `ios://ios.upload-queue` | `ios/App/App/Screens/UploadQueueView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-upload-queue` | TO-BUILD (native SwiftUI) |
| `ios.video-upload` | ios | 853x1844 | 114 | 3 | `ios://ios.video-upload` | `ios/App/App/Screens/VideoUploadView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-video-upload` | TO-BUILD (native SwiftUI) |
| `ios.video-review` | ios | 853x1844 | 189 | 3 | `ios://ios.video-review` | `ios/App/App/Screens/VideoReviewView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-video-review` | TO-BUILD (native SwiftUI) |
| `ios.live-camera-setup` | ios | 853x1844 | 152 | 3 | `ios://ios.live-camera-setup` | `ios/App/App/Screens/LiveCameraSetupView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-live-camera-setup` | TO-BUILD (native SwiftUI) |
| `ios.hoop-calibration` | ios | 853x1844 | 116 | 3 | `ios://ios.hoop-calibration` | `ios/App/App/Screens/HoopCalibrationView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-hoop-calibration` | TO-BUILD (native SwiftUI) |
| `ios.readiness-check` | ios | 853x1844 | 167 | 3 | `ios://ios.readiness-check` | `ios/App/App/Screens/ReadinessCheckView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-readiness-check` | TO-BUILD (native SwiftUI) |
| `ios.capture-ready` | ios | 853x1844 | 114 | 3 | `ios://ios.capture-ready` | `ios/App/App/Screens/CaptureReadyView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-capture-ready` | TO-BUILD (native SwiftUI) |
| `ios.live-recording` | ios | 853x1844 | 189 | 3 | `ios://ios.live-recording` | `ios/App/App/Screens/LiveRecordingView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-live-recording` | TO-BUILD (native SwiftUI) |
| `ios.live-form-feedback` | ios | 853x1844 | 143 | 3 | `ios://ios.live-form-feedback` | `ios/App/App/Screens/LiveFormFeedbackView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-live-form-feedback` | TO-BUILD (native SwiftUI) |
| `ios.shot-detected` | ios | 853x1844 | 187 | 3 | `ios://ios.shot-detected` | `ios/App/App/Screens/ShotDetectedView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-shot-detected` | TO-BUILD (native SwiftUI) |
| `ios.capture-review` | ios | 853x1844 | 158 | 3 | `ios://ios.capture-review` | `ios/App/App/Screens/CaptureReviewView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-capture-review` | TO-BUILD (native SwiftUI) |
| `ios.analysis-processing` | ios | 853x1844 | 124 | 3 | `ios://ios.analysis-processing` | `ios/App/App/Screens/AnalysisProcessingView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-analysis-processing` | TO-BUILD (native SwiftUI) |
| `ios.analysis-taking-longer` | ios | 853x1844 | 103 | 3 | `ios://ios.analysis-taking-longer` | `ios/App/App/Screens/AnalysisTakingLongerView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-analysis-taking-longer` | TO-BUILD (native SwiftUI) |
| `ios.analysis-result-overview` | ios | 853x1844 | 165 | 3 | `ios://ios.analysis-result-overview` | `ios/App/App/Screens/AnalysisResultOverviewView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-analysis-result-overview` | TO-BUILD (native SwiftUI) |
| `ios.no-analysis-yet` | ios | 853x1844 | 82 | 3 | `ios://ios.no-analysis-yet` | `ios/App/App/Screens/NoAnalysisYetView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-no-analysis-yet` | TO-BUILD (native SwiftUI) |
| `ios.analysis-error` | ios | 853x1844 | 137 | 3 | `ios://ios.analysis-error` | `ios/App/App/Screens/AnalysisErrorView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-analysis-error` | TO-BUILD (native SwiftUI) |
| `ios.shot-breakdown` | ios | 853x1844 | 108 | 3 | `ios://ios.shot-breakdown` | `ios/App/App/Screens/ShotBreakdownView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-shot-breakdown` | TO-BUILD (native SwiftUI) |
| `ios.frame-detail-skeleton` | ios | 853x1844 | 154 | 3 | `ios://ios.frame-detail-skeleton` | `ios/App/App/Screens/FrameDetailSkeletonView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-frame-detail-skeleton` | TO-BUILD (native SwiftUI) |
| `ios.annotation-toolbar` | ios | 853x1844 | 181 | 3 | `ios://ios.annotation-toolbar` | `ios/App/App/Screens/AnnotationToolbarView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-annotation-toolbar` | TO-BUILD (native SwiftUI) |
| `ios.form-score` | ios | 853x1844 | 98 | 3 | `ios://ios.form-score` | `ios/App/App/Screens/FormScoreView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-form-score` | TO-BUILD (native SwiftUI) |
| `ios.metric-detail` | ios | 853x1844 | 171 | 3 | `ios://ios.metric-detail` | `ios/App/App/Screens/MetricDetailView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-metric-detail` | TO-BUILD (native SwiftUI) |
| `ios.flaws-overview` | ios | 853x1844 | 147 | 3 | `ios://ios.flaws-overview` | `ios/App/App/Screens/FlawsOverviewView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-flaws-overview` | TO-BUILD (native SwiftUI) |
| `ios.flaw-detail` | ios | 853x1844 | 102 | 3 | `ios://ios.flaw-detail` | `ios/App/App/Screens/FlawDetailView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-flaw-detail` | TO-BUILD (native SwiftUI) |
| `ios.player-card` | ios | 853x1844 | 113 | 3 | `ios://ios.player-card` | `ios/App/App/Screens/PlayerCardView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-player-card` | TO-BUILD (native SwiftUI) |
| `ios.customize-player-card` | ios | 853x1844 | 79 | 3 | `ios://ios.customize-player-card` | `ios/App/App/Screens/CustomizePlayerCardView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-customize-player-card` | TO-BUILD (native SwiftUI) |
| `ios.elite-match` | ios | 853x1844 | 126 | 3 | `ios://ios.elite-match` | `ios/App/App/Screens/EliteMatchView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-elite-match` | TO-BUILD (native SwiftUI) |
| `ios.photo-comparison` | ios | 853x1844 | 148 | 3 | `ios://ios.photo-comparison` | `ios/App/App/Screens/PhotoComparisonView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-photo-comparison` | TO-BUILD (native SwiftUI) |
| `ios.elite-shooters` | ios | 853x1844 | 94 | 3 | `ios://ios.elite-shooters` | `ios/App/App/Screens/EliteShootersView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-elite-shooters` | TO-BUILD (native SwiftUI) |
| `ios.elite-shooter-detail` | ios | 853x1844 | 284 | 3 | `ios://ios.elite-shooter-detail` | `ios/App/App/Screens/EliteShooterDetailView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-elite-shooter-detail` | TO-BUILD (native SwiftUI) |
| `ios.training-home` | ios | 853x1844 | 146 | 3 | `ios://ios.training-home` | `ios/App/App/Screens/TrainingHomeView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-training-home` | TO-BUILD (native SwiftUI) |
| `ios.quick-start` | ios | 853x1844 | 138 | 3 | `ios://ios.quick-start` | `ios/App/App/Screens/QuickStartView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-quick-start` | TO-BUILD (native SwiftUI) |
| `ios.discover-drills` | ios | 853x1844 | 110 | 3 | `ios://ios.discover-drills` | `ios/App/App/Screens/DiscoverDrillsView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-discover-drills` | TO-BUILD (native SwiftUI) |
| `ios.drill-detail` | ios | 853x1844 | 105 | 3 | `ios://ios.drill-detail` | `ios/App/App/Screens/DrillDetailView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-drill-detail` | TO-BUILD (native SwiftUI) |
| `ios.my-drills` | ios | 853x1844 | 102 | 3 | `ios://ios.my-drills` | `ios/App/App/Screens/MyDrillsView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-my-drills` | TO-BUILD (native SwiftUI) |
| `ios.workout-calendar` | ios | 853x1844 | 117 | 3 | `ios://ios.workout-calendar` | `ios/App/App/Screens/WorkoutCalendarView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-workout-calendar` | TO-BUILD (native SwiftUI) |
| `ios.drill-execution` | ios | 853x1844 | 161 | 3 | `ios://ios.drill-execution` | `ios/App/App/Screens/DrillExecutionView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-drill-execution` | TO-BUILD (native SwiftUI) |
| `ios.shot-tracker` | ios | 853x1844 | 194 | 3 | `ios://ios.shot-tracker` | `ios/App/App/Screens/ShotTrackerView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-shot-tracker` | TO-BUILD (native SwiftUI) |
| `ios.workout-completion` | ios | 853x1844 | 118 | 3 | `ios://ios.workout-completion` | `ios/App/App/Screens/WorkoutCompletionView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-workout-completion` | TO-BUILD (native SwiftUI) |
| `ios.goals` | ios | 853x1844 | 107 | 3 | `ios://ios.goals` | `ios/App/App/Screens/GoalsView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-goals` | TO-BUILD (native SwiftUI) |
| `ios.create-goal` | ios | 853x1844 | 88 | 3 | `ios://ios.create-goal` | `ios/App/App/Screens/CreateGoalView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-create-goal` | TO-BUILD (native SwiftUI) |
| `ios.goal-detail` | ios | 853x1844 | 169 | 3 | `ios://ios.goal-detail` | `ios/App/App/Screens/GoalDetailView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-goal-detail` | TO-BUILD (native SwiftUI) |
| `ios.analytics-cards` | ios | 853x1844 | 149 | 3 | `ios://ios.analytics-cards` | `ios/App/App/Screens/AnalyticsCardsView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-analytics-cards` | TO-BUILD (native SwiftUI) |
| `ios.analytics-detailed` | ios | 853x1844 | 101 | 3 | `ios://ios.analytics-detailed` | `ios/App/App/Screens/AnalyticsDetailedView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-analytics-detailed` | TO-BUILD (native SwiftUI) |
| `ios.my-media` | ios | 853x1844 | 218 | 3 | `ios://ios.my-media` | `ios/App/App/Screens/MyMediaView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-my-media` | TO-BUILD (native SwiftUI) |
| `ios.media-detail` | ios | 853x1844 | 268 | 3 | `ios://ios.media-detail` | `ios/App/App/Screens/MediaDetailView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-media-detail` | TO-BUILD (native SwiftUI) |
| `ios.profile` | ios | 853x1844 | 100 | 3 | `ios://ios.profile` | `ios/App/App/Screens/ProfileView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-profile` | TO-BUILD (native SwiftUI) |
| `ios.settings-hub` | ios | 853x1844 | 85 | 3 | `ios://ios.settings-hub` | `ios/App/App/Screens/SettingsHubView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-settings-hub` | TO-BUILD (native SwiftUI) |
| `ios.share-results` | ios | 853x1844 | 160 | 3 | `ios://ios.share-results` | `ios/App/App/Screens/ShareResultsView.swift` | `(shared OpenAPI client)` | `(shared)` | `screen-ios-share-results` | TO-BUILD (native SwiftUI) |
| `desktop.web-sign-in` | desktop | 1440x900 | 143 | 3 | `/signin` | `src/app/signin/page.tsx` | `POST /api/auth/[...nextauth]` | `User` | `screen-desktop-web-sign-in` | exists |
| `desktop.web-onboarding` | desktop | 1440x900 | 178 | 3 | `/onboarding` | `src/app/onboarding/page.tsx` | `POST /api/profile` | `UserProfile` | `screen-desktop-web-onboarding` | exists |
| `desktop.web-home-dashboard` | desktop | 1440x900 | 97 | 3 | `/dashboard` | `src/app/dashboard/page.tsx` | `GET /api/analysis-history` | `UserAnalysis` | `screen-desktop-web-home-dashboard` | exists |
| `desktop.web-standard-dashboard` | desktop | 1440x900 | 87 | 3 | `/dashboard` | `src/app/dashboard/page.tsx` | `GET /api/analysis-history` | `UserAnalysis` | `screen-desktop-web-standard-dashboard` | exists-variant |
| `desktop.web-analyze-workspace` | desktop | 1440x900 | 95 | 3 | `/analyze` | `src/app/analyze/page.tsx` | `POST /api/vision-analyze` | `UserAnalysis` | `screen-desktop-web-analyze-workspace` | exists |
| `desktop.web-live-capture` | desktop | 1440x900 | 269 | 3 | `/video-analysis` | `src/app/video-analysis/page.tsx` | `POST /api/capture-sessions` | `CaptureSession` | `screen-desktop-web-live-capture` | exists |
| `desktop.web-analysis-overview` | desktop | 1440x900 | 114 | 3 | `/results/demo/analysis` | `src/app/results/demo/(tabs)/analysis/page.tsx` | `GET /api/save-analysis` | `UserAnalysis` | `screen-desktop-web-analysis-overview` | exists |
| `desktop.web-biomechanics-workspace` | desktop | 1440x900 | 184 | 3 | `/results/demo/analysis` | `src/app/results/demo/(tabs)/analysis/page.tsx` | `POST /api/analyze-drill-frame` | `ShootingBiomechanics` | `screen-desktop-web-biomechanics-workspace` | exists |
| `desktop.web-flaws-history` | desktop | 1440x900 | 114 | 3 | `/results/demo/flaws` | `src/app/results/demo/(tabs)/flaws/page.tsx` | `GET /api/analysis-history` | `ShootingWeakness` | `screen-desktop-web-flaws-history` | exists |
| `desktop.web-player-card` | desktop | 1440x900 | 196 | 3 | `/results/demo/player` | `src/app/results/demo/(tabs)/player/page.tsx` | `GET /api/profile` | `UserProfile` | `screen-desktop-web-player-card` | exists |
| `desktop.web-elite-comparison` | desktop | 1440x900 | 175 | 3 | `/results/demo/compare` | `src/app/results/demo/(tabs)/compare/page.tsx` | `POST /api/compare-shooters` | `Shooter` | `screen-desktop-web-elite-comparison` | exists |
| `desktop.web-elite-shooters-database` | desktop | 1440x900 | 225 | 3 | `/elite-shooters` | `src/app/elite-shooters/page.tsx` | `GET /api/shooters` | `Shooter` | `screen-desktop-web-elite-shooters-database` | exists |
| `desktop.web-elite-shooter-detail` | desktop | 1440x900 | 225 | 3 | `/elite-shooters/[shooterId]` | `MISSING - dynamic route not present` | `GET /api/shooters/[id]` | `Shooter` | `screen-desktop-web-elite-shooter-detail` | MISSING |
| `desktop.web-training-hub` | desktop | 1440x900 | 208 | 3 | `/results/demo/training` | `src/app/results/demo/(tabs)/training/page.tsx` | `GET /api/workouts` | `Workout` | `screen-desktop-web-training-hub` | exists |
| `desktop.web-drill-execution` | desktop | 1440x900 | 193 | 3 | `/training/drills/[drillId]` | `MISSING - drill execution route not present` | `POST /api/drill-feedback` | `DrillVideoSubmission` | `screen-desktop-web-drill-execution` | MISSING |
| `desktop.web-goals-plan` | desktop | 1440x900 | 127 | 3 | `/results/demo/goals` | `src/app/results/demo/(tabs)/goals/page.tsx` | `GET/POST /api/goals` | `Goal` | `screen-desktop-web-goals-plan` | exists |
| `desktop.web-analytics-history` | desktop | 1440x900 | 126 | 3 | `/results/demo/history` | `src/app/results/demo/(tabs)/history/page.tsx` | `GET /api/analysis-history` | `AnalysisHistory` | `screen-desktop-web-analytics-history` | exists |
| `desktop.web-media-library` | desktop | 1440x900 | 126 | 3 | `/media` | `src/app/media/page.tsx` | `GET /api/media` | `MediaUpload` | `screen-desktop-web-media-library` | exists |
| `desktop.web-achievements-points` | desktop | 1440x900 | 128 | 3 | `/points` | `src/app/points/page.tsx + src/app/badges/page.tsx` | `GET /api/points, /api/badges` | `PointEvent, EarnedBadge` | `screen-desktop-web-achievements-points` | exists |
| `desktop.web-profile-settings` | desktop | 1440x900 | 82 | 3 | `/profile` | `src/app/profile/page.tsx + src/app/settings/page.tsx` | `GET/PUT /api/settings` | `UserSettings` | `screen-desktop-web-profile-settings` | exists |

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
