import SwiftUI
import UIKit
import AVFoundation
import Photos
import UserNotifications

// Canonical onboarding flow — screens 008-016. Data persists in the shared
// OnboardingModel and is submitted once at review.

@MainActor
final class OnboardingModel: ObservableObject {
    @Published var ageYears = 24
    @Published var heightIn = 74
    @Published var weightLb = 185
    @Published var wingspanIn = 78
    @Published var experience = "Advanced"
    @Published var bodyType = "Athletic"
    @Published var hand = "Right"
    @Published var position = "Guard"
    @Published var shotStyle = "Catch & Shoot"
    @Published var ability = "Advanced"
    @Published var styleArc = "Balanced"
    @Published var bio = ""
    @Published var name = ""
    /// AI-enhanced bio returned by POST /api/enhance-bio (persisted separately).
    @Published var enhancedBio = ""

    // MARK: server payload (field names/values mirror src/app/api/profile/route.ts
    // and the web profile store's canonical enum values)

    struct ProfileSaveBody: Encodable {
        var heightInches: Int
        var weightLbs: Int
        var wingspanInches: Int
        var age: Int
        var experienceLevel: String
        var bodyType: String
        var athleticAbility: Int
        var dominantHand: String
        var shootingStyle: String
        var bio: String?
        var enhancedBio: String?
        var profileComplete: Bool
    }

    var saveBody: ProfileSaveBody {
        // Web canonical values: bodyType is ectomorph/mesomorph/endomorph,
        // athleticAbility is a 1-10 score, hand/experience are lowercase.
        let bodyTypeMap = ["Slim": "ectomorph", "Athletic": "mesomorph",
                           "Solid": "endomorph", "Big": "endomorph"]
        let abilityMap = ["Developing": 4, "Advanced": 7, "Elite": 9]
        return ProfileSaveBody(
            heightInches: heightIn,
            weightLbs: weightLb,
            wingspanInches: wingspanIn,
            age: ageYears,
            experienceLevel: experience.lowercased(),
            bodyType: bodyTypeMap[bodyType] ?? bodyType.lowercased(),
            athleticAbility: abilityMap[ability] ?? 5,
            dominantHand: hand.lowercased(),
            shootingStyle: styleArc.lowercased().replacingOccurrences(of: " ", with: "_"),
            bio: bio.isEmpty ? nil : bio,
            enhancedBio: enhancedBio.isEmpty ? nil : enhancedBio,
            profileComplete: true
        )
    }
}

struct OnboardingFlowView: View {
    @StateObject private var model = OnboardingModel()
    var body: some View {
        NavigationStack { OnboardingIntroView() }.environmentObject(model)
    }
}

// MARK: - Shared onboarding chrome

private func ftIn(_ inches: Int) -> String { "\(inches / 12)'\(inches % 12)\"" }

/// Canonical orange CTA label for NavigationLinks (same look as PrimaryButton).
@ViewBuilder
private func primaryLabel(_ title: String, icon: String? = nil, color: Color = ShotIQColor.shotiqOrange) -> some View {
    HStack(spacing: 10) {
        if let icon {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(.white)
        }
        Text(title).shotiqBody(17, weight: .medium)
    }
    .frame(maxWidth: .infinity).frame(height: ShotIQType.controlHeight)
    .background(color, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
    .foregroundStyle(.white)
}

/// Canonical outline label for NavigationLinks (same look as SecondaryButton).
@ViewBuilder
private func secondaryLabel(_ title: String, tint: Color = ShotIQColor.ink, border: Color = ShotIQColor.rule) -> some View {
    Text(title).shotiqBody(17)
        .frame(maxWidth: .infinity).frame(height: ShotIQType.controlHeight)
        .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(border))
        .foregroundStyle(tint)
}

/// Canonical step progress bars: short orange/gray segments.
private struct StepBars: View {
    var total: Int
    var filled: Int
    var barWidth: CGFloat = 40
    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<total, id: \.self) { i in
                Capsule().fill(i < filled ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                    .frame(width: barWidth, height: 5)
            }
        }
    }
}

/// Bottom tab bar shown on onboarding screens.
///
/// It used to be purely decorative, which made the app feel broken: the row
/// looks identical to the real app tab bar but none of the labels responded.
/// During onboarding, tabs stay locked until setup is done, but every tap now
/// gives immediate feedback instead of silently eating the gesture.
private struct OnboardingTabBar: View {
    var initials: String = "SI"
    @State private var toast: ShotIQToast?
    var body: some View {
        HStack {
            tab("camera.metering.center.weighted", "Home", active: true) {
                toast = .info("Setup in progress", "Finish onboarding to open Home.")
            }
            tab("point.3.connected.trianglepath.dotted", "Capture") {
                toast = .info("Capture unlocks after setup", "Complete your profile and permissions first.")
            }
            tab("film", "My Drills") {
                toast = .info("Training unlocks after setup", "Complete onboarding to start drills.")
            }
            tab("chart.line.uptrend.xyaxis", "Progress") {
                toast = .info("Progress unlocks after setup", "Your analytics appear after setup and analysis.")
            }
            Button {
                toast = .info("My Media unlocks after setup", "Finish these steps to unlock your media tab.")
            } label: {
                VStack(spacing: 5) {
                    Text(initials)
                        .shotiqBody(12, weight: .bold)
                        .frame(width: 24, height: 24)
                        .overlay(RoundedRectangle(cornerRadius: 5).stroke(ShotIQColor.graphite, lineWidth: 1.5))
                    Text("My Media").shotiqBody(10)
                }
                .frame(maxWidth: .infinity)
                .foregroundStyle(ShotIQColor.graphite)
            }
            .buttonStyle(.plain)
        }
        .padding(.top, 10).padding(.bottom, 22)
        .background(ShotIQColor.paper)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
        .shotiqToast($toast)
    }
    private func tab(_ icon: String, _ label: String, active: Bool = false,
                     action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 5) {
                // Same five marks as the real tab bar — this preview strip used to
                // draw its own SF set, so Home and Capture read as two more
                // meanings for `camera.metering...` / `point.3.connected...`.
                ShotIQConceptGlyph(concept: label, fallback: icon, size: 30)
                Text(label).shotiqBody(10, weight: active ? .bold : .regular)
            }
            .frame(maxWidth: .infinity)
            .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("onboarding-tab-\(label.lowercased())")
    }
}

/// Bold caps question header ("WHAT BEST DESCRIBES YOUR EXPERIENCE?").
private struct QuestionLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .shotiqBody(15, weight: .bold).kerning(0.5)
            .foregroundStyle(ShotIQColor.ink)
    }
}

/// DIN stat with tiny caps label, hairline separated in an HStack.
private struct StatRow: View {
    var stats: [(String, String, Color)]
    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(stats.enumerated()), id: \.offset) { i, s in
                VStack(spacing: 2) {
                    Text(s.0).font(.custom("Tungsten-Medium", size: 26)).foregroundStyle(s.2)
                        .lineLimit(1).minimumScaleFactor(0.7)
                    Text(s.1).shotiqBody(10, weight: .medium).kerning(0.6)
                        .foregroundStyle(ShotIQColor.graphite)
                }
                .frame(maxWidth: .infinity)
                if i < stats.count - 1 {
                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                }
            }
        }
    }
}

/// Selectable option card: centered icon, condensed caps label, gray caption,
/// orange border + check badge when selected.
private struct OptionCard: View {
    var icon: String
    var label: String
    var caption: String? = nil
    var selected: Bool
    var action: () -> Void
    private let iconSize: CGFloat = 76

    /// Only the two handedness cards resolve to a hand; "Right Corner" and the
    /// like must not, so the match is on the word "handed".
    static func handKind(for label: String) -> HandKind? {
        guard label.lowercased().contains("handed") else { return nil }
        return HandKind(handLabel: label)
    }

    private func rasterAsset(for label: String) -> String? {
        let k = label.lowercased()
        if k.contains("right-handed") { return "shotiq-correction-hand-right" }
        if k.contains("left-handed") { return "shotiq-correction-hand-left" }
        if k.contains("beginner") || k.contains("developing") { return "shotiq-correction-developing-experience" }
        if k.contains("intermediate") { return "shotiq-approved-v2-ability-intermediate" }
        if k.contains("advanced") { return "shotiq-correction-advanced-experience" }
        if k.contains("elite") { return "shotiq-correction-elite-experience" }
        if k.contains("professional") { return "shotiq-approved-v2-ability-professional" }
        return bodyTypeAsset(for: label)
    }

    var body: some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                VStack(spacing: 8) {
                    Group {
                        if let raster = rasterAsset(for: label) {
                            ShotIQApprovedRasterIcon(assetName: raster, size: iconSize, label: nil)
                        } else if let hand = OptionCard.handKind(for: label) {
                            HandGlyph(kind: hand, size: iconSize)
                        } else if let ability = AbilityKind(abilityLabel: label) {
                            AbilityGlyph(kind: ability, size: iconSize)
                        } else if let shot = ShotTypeKind(shotTypeLabel: label) {
                            ShotTypeGlyph(kind: shot, size: iconSize)
                        } else if !icon.isEmpty {
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                                     size: iconSize,
                                                     label: nil)
                        }
                    }
                    .foregroundStyle(ShotIQColor.ink)
                    .frame(height: iconSize)
                    Text(label)
                        .shotiqCondensed(14, weight: .heavy)
                        .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.7)
                    if let caption {
                        Text(caption).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.vertical, 14).padding(.horizontal, 8)
                .frame(maxWidth: .infinity)
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
                    .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                    .padding(8)
            }
            .background(selected ? ShotIQColor.warmCanvas : ShotIQColor.paper)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule, lineWidth: selected ? 1.5 : 1))
        }
        .buttonStyle(.plain)
    }

    private func bodyTypeAsset(for label: String) -> String? {
        let k = label.lowercased()
        if k.contains("slim") || k.contains("lean") { return "shotiq-approved-v2-bodytype-slim" }
        if k.contains("athletic") { return "shotiq-approved-v2-bodytype-athletic" }
        if k.contains("stocky") || k.contains("solid") || k.contains("strong") { return "shotiq-approved-v2-bodytype-stocky" }
        if k.contains("larger") || k.contains("big") { return "shotiq-approved-v2-bodytype-larger" }
        return nil
    }
}

/// Shooting-style card: media placeholder above a radio row and caption.
private struct StyleCard: View {
    var label: String
    var caption: String
    /// Canonical frame shown in the card's media slot (nil = no crop bundled yet).
    var photoKey: String? = nil
    var selected: Bool
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    if let photoKey {
                        CanonicalPhoto(photoKey, height: 96, cornerRadius: 6)
                        } else {
                            RoundedRectangle(cornerRadius: 6).fill(ShotIQColor.warmCanvas)
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "figure.basketball"),
                                                     size: 34,
                                                     label: nil)
                        }
                }
                .frame(height: 96)
                HStack(spacing: 6) {
                    Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 16))
                        .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.muted)
                    Text(label)
                        .shotiqCondensed(14, weight: .heavy)
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
                Text(caption).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center)
            }
            .padding(8)
            .frame(maxWidth: .infinity)
            .background(ShotIQColor.paper)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule, lineWidth: selected ? 1.5 : 1))
        }
        .buttonStyle(.plain)
    }
}

/// Segmented unit toggle: blue filled selected segment (YEARS/MONTHS, FT/IN vs CM…).
private struct UnitToggle: View {
    var left: String
    var right: String
    @Binding var leftSelected: Bool
    var accessibilityPrefix: String = ""
    var body: some View {
        HStack(spacing: 0) {
            seg(left, idSuffix: "left", on: leftSelected) { leftSelected = true }
            seg(right, idSuffix: "right", on: !leftSelected) { leftSelected = false }
        }
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
    }
    private func seg(_ label: String, idSuffix: String, on: Bool, tap: @escaping () -> Void) -> some View {
        Button(action: tap) {
            // The segment had no intrinsic width, so the measurement row's
            // trailing column absorbed every point the name column wanted and
            // "YEARS" / "MONTHS" broke mid-word into "YEAR S" / "MONT HS" on
            // 009. fixedSize pins each segment to its own text.
            Text(label).shotiqBody(11, weight: .bold).kerning(0.5)
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)
                .foregroundStyle(on ? .white : ShotIQColor.graphite)
                .padding(.horizontal, 12).frame(height: 30)
                .background(on ? ShotIQColor.shotiqOrange : ShotIQColor.paper)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("\(accessibilityPrefix)-unit-\(idSuffix)")
        .accessibilityLabel(label)
    }
}

/// Physical-profile measurement row: icon, condensed label + hint, big DIN value
/// with discreet steppers, and a unit toggle underneath.
private struct MeasurementRow: View {
    var icon: String
    var label: String
    var sub: String
    var value: String
    var leftUnit: String
    var rightUnit: String
    @Binding var leftSelected: Bool
    var onMinus: () -> Void
    var onPlus: () -> Void
    private var accessibilityKey: String {
        label.lowercased().replacingOccurrences(of: " ", with: "-")
    }
    private var correctionAsset: String? {
        let k = label.lowercased()
        if k == "age" { return "shotiq-correction-age" }
        if k == "height" { return "shotiq-correction-height" }
        if k == "weight" { return "shotiq-correction-weight" }
        if k == "wingspan" { return "shotiq-approved-v2-body-wingspan" }
        return nil
    }
    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            Group {
                if let asset = correctionAsset {
                    ShotIQApprovedRasterIcon(assetName: asset, size: 68, label: nil)
                } else if let body = BodyMetricKind(measurementLabel: label) {
                    BodyMetricGlyph(kind: body, size: 68)
                } else {
                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                             size: 68,
                                             label: nil)
                }
            }
            .foregroundStyle(ShotIQColor.ink)
            .frame(width: 68)
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .shotiqCondensed(20, weight: .heavy)
                    .foregroundStyle(ShotIQColor.ink)
                Text(sub).shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                HStack(spacing: 8) {
                    Button(action: onMinus) {
                        Image(systemName: "minus.circle")
                            .font(.system(size: 18)).foregroundStyle(ShotIQColor.muted)
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .ignore)
                    .accessibilityIdentifier("measurement-\(accessibilityKey)-decrease")
                    .accessibilityLabel("Decrease \(label.lowercased())")
                    Text(value).font(.custom("Tungsten-Medium", size: 36))
                        .foregroundStyle(ShotIQColor.ink)
                        .lineLimit(1).minimumScaleFactor(0.6)
                        .accessibilityIdentifier("measurement-\(accessibilityKey)-value")
                    Button(action: onPlus) {
                        Image(systemName: "plus.circle")
                            .font(.system(size: 18)).foregroundStyle(ShotIQColor.muted)
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .ignore)
                    .accessibilityIdentifier("measurement-\(accessibilityKey)-increase")
                    .accessibilityLabel("Increase \(label.lowercased())")
                }
                UnitToggle(left: leftUnit, right: rightUnit, leftSelected: $leftSelected,
                           accessibilityPrefix: "measurement-\(accessibilityKey)")
            }
        }
        .padding(.vertical, 20)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
    }
}

// MARK: - Chip helpers (also used by other flows)

struct ChipRow: View {
    let options: [String]; @Binding var selection: String
    var body: some View {
        FlowLayoutish(options: options, selection: $selection)
    }
}

struct FlowLayoutish: View {
    let options: [String]; @Binding var selection: String
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(options.chunked(2), id: \.self) { row in
                HStack(spacing: 10) {
                    ForEach(row, id: \.self) { o in
                        Button { selection = o } label: {
                            Text(o).shotiqBody(15, weight: selection == o ? .semibold : .regular)
                                .frame(maxWidth: .infinity).frame(height: 48)
                                .background(selection == o ? ShotIQColor.warmCanvas : ShotIQColor.paper)
                                .overlay(RoundedRectangle(cornerRadius: 6)
                                    .stroke(selection == o ? ShotIQColor.shotiqOrange : ShotIQColor.rule,
                                            lineWidth: selection == o ? 2 : 1))
                                .foregroundStyle(ShotIQColor.ink)
                        }
                    }
                }
            }
        }
    }
}

extension Array {
    func chunked(_ size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map { Array(self[$0..<Swift.min($0 + size, count)]) }
    }
}
extension Array: @retroactive Identifiable where Element == String { public var id: String { joined() } }

// MARK: - 008 · ios.onboarding-intro

struct OnboardingIntroView: View {
    @EnvironmentObject var app: AppState
    @State private var toast: ShotIQToast?
    private let benefits: [(String, String, String, String)] = [
        ("shotiq-correction-personalized-analysis", "camera.metering.center.weighted", "PERSONALIZED ANALYSIS",
         "Your measurements help tailor angles, ranges, and feedback that fit you."),
        ("shotiq-correction-better-comparisons", "figure.run", "BETTER COMPARISONS",
         "Compare against similar players with a profile like yours."),
        ("shotiq-correction-smarter-coaching", "film", "SMARTER COACHING",
         "Get coaching cues that adapt as you improve.")
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-onboarding-intro") {
            VStack(spacing: 0) {
                HStack {
                    Wordmark(size: 30)
                    Spacer()
                    Button("Skip") {
                        toast = .info("Skipping profile", "You can finish setup from Profile later.")
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                            app.onboardingComplete = true
                        }
                    }
                        .font(.system(size: 16)).foregroundStyle(ShotIQColor.graphite)
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        StepBars(total: 4, filled: 1, barWidth: 34).padding(.top, 16)
                        Text("STEP 1 OF 4")
                            .shotiqBody(13, weight: .semibold).kerning(1)
                            .foregroundStyle(ShotIQColor.graphite).padding(.top, 10)

                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 0) {
                                Text("BUILD YOUR").shotiqDisplay(46).padding(.top, 14)
                                Text("PLAYER PROFILE")
                                    .shotiqCondensed(36.8, weight: .heavy)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text("Add quick measurements so ShotIQ can personalize your comparisons and coaching to you.")
                                    .shotiqBody(16).foregroundStyle(ShotIQColor.graphite)
                                    .padding(.top, 12)
                            }
                            CanonicalPhoto("002-visual-005", width: 138, height: 290, cornerRadius: 12)
                            .frame(width: 138, height: 290)
                        }
                        .padding(.top, 4)

                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 18)

                        VStack(spacing: 0) {
                            ForEach(benefits, id: \.2) { asset, icon, t, d in
                                HStack(alignment: .top, spacing: 16) {
                                    ShotIQApprovedRasterIcon(assetName: asset, size: 70, label: nil)
                                        .frame(width: 70)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(t).shotiqBody(15, weight: .bold).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text(d).shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(.vertical, 16)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            }
                        }

                        HStack(alignment: .top, spacing: 14) {
                            Image(systemName: "info.circle")
                                .font(.system(size: 26))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("ABOUT YOUR DATA")
                                    .shotiqBody(15, weight: .bold).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("Measurements personalize your experience only. ShotIQ does not provide medical advice or diagnoses.")
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(16)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 18)

                        HStack(spacing: 0) {
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                                .frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                .frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                            VStack(spacing: 3) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "scope"),
                                                         size: 18,
                                                         label: nil)
                                Text("82").font(.custom("Tungsten-Medium", size: 24))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                Text("FORM SCORE").shotiqBody(9, weight: .medium).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                            VStack(spacing: 4) {
                                Text("PRIMARY TARGET")
                                    .shotiqBody(9, weight: .medium).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("Keep elbow stacked through release")
                                    .shotiqBody(12, weight: .semibold)
                                    .foregroundStyle(ShotIQColor.ink)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.vertical, 14)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 14)

                        ShotIQCard {
                            StatRow(stats: [("24", "SHOTS", ShotIQColor.ink),
                                            ("15", "MAKES", ShotIQColor.ink),
                                            ("62.5%", "ACCURACY", ShotIQColor.ink),
                                            ("RIGHT", "HANDED", ShotIQColor.ink)])
                                .padding(.vertical, 14)
                        }
                        .padding(.top, 12)

                        NavigationLink { PhysicalProfileView() } label: {
                            primaryLabel("Build my player profile", icon: "camera.metering.center.weighted")
                        }
                        .padding(.top, 18)

                        SecondaryButton(title: "Sign out") {
                            toast = .progress("Signing out", "Returning you to sign in.", progress: 0.6)
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                                app.signOut()
                            }
                        }
                            .padding(.top, 12).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                }

                OnboardingTabBar(initials: shotiqInitials(app.user))
            }
        }
        .shotiqToast($toast)
    }
}

// MARK: - 009 · ios.physical-profile

struct PhysicalProfileView: View {
    @EnvironmentObject var m: OnboardingModel
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var ageInYears = true
    @State private var heightInFt = true
    @State private var weightInLb = true
    @State private var wingspanInFt = true
    @State private var toast: ShotIQToast?

    var body: some View {
        CanonicalScreen(testID: "screen-ios-physical-profile") {
            VStack(spacing: 0) {
                HStack {
                    Wordmark(size: 30)
                    Spacer()
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)

                ScrollView {
                    VStack(spacing: 0) {
                        Text("STEP 1 OF 4")
                            .shotiqBody(14, weight: .bold).kerning(2)
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .padding(.top, 22)
                        StepBars(total: 4, filled: 1, barWidth: 66).padding(.top, 12)
                        Text("PHYSICAL PROFILE").shotiqDisplay(56)
                            .multilineTextAlignment(.center).padding(.top, 22)
                        Text("Accurate measurements help AI personalize your analysis and training.")
                            .shotiqBody(17).foregroundStyle(ShotIQColor.graphite)
                            .multilineTextAlignment(.center)
                            .padding(.top, 10).padding(.horizontal, 16)

                        ZStack(alignment: .bottomLeading) {
                            CanonicalPhoto("generated-physical-profile-009", height: 142, cornerRadius: 10)
                                .frame(maxWidth: .infinity)
                            LinearGradient(colors: [.clear, .black.opacity(0.6)],
                                           startPoint: .center,
                                           endPoint: .bottom)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            HStack(spacing: 8) {
                                ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-onboarding-measurements",
                                                         size: 34,
                                                         label: nil)
                                Text("Measurements tune your analysis ranges.")
                                    .shotiqBody(13, weight: .semibold)
                                    .foregroundStyle(.white)
                                    .lineLimit(2)
                            }
                            .padding(12)
                        }
                        .frame(height: 142)
                        .padding(.top, 18)

                        VStack(spacing: 0) {
                            MeasurementRow(icon: "calendar", label: "AGE", sub: "Your current age",
                                           value: ageInYears ? "\(m.ageYears)" : "\(m.ageYears * 12)",
                                           leftUnit: "YEARS", rightUnit: "MONTHS",
                                           leftSelected: $ageInYears,
                                           onMinus: {
                                               m.ageYears = max(5, m.ageYears - 1)
                                               toast = .info("Age updated", "\(m.ageYears) years")
                                           },
                                           onPlus: {
                                               m.ageYears = min(99, m.ageYears + 1)
                                               toast = .info("Age updated", "\(m.ageYears) years")
                                           })
                            MeasurementRow(icon: "ruler", label: "HEIGHT", sub: "Without shoes",
                                           value: heightInFt ? ftIn(m.heightIn) : "\(Int(Double(m.heightIn) * 2.54))",
                                           leftUnit: "FT / IN", rightUnit: "CM",
                                           leftSelected: $heightInFt,
                                           onMinus: {
                                               m.heightIn = max(48, m.heightIn - 1)
                                               toast = .info("Height updated", ftIn(m.heightIn))
                                           },
                                           onPlus: {
                                               m.heightIn = min(96, m.heightIn + 1)
                                               toast = .info("Height updated", ftIn(m.heightIn))
                                           })
                            MeasurementRow(icon: "scalemass", label: "WEIGHT", sub: "Without shoes",
                                           value: weightInLb ? "\(m.weightLb)" : "\(Int(Double(m.weightLb) * 0.4536))",
                                           leftUnit: "LBS", rightUnit: "KG",
                                           leftSelected: $weightInLb,
                                           onMinus: {
                                               m.weightLb = max(60, m.weightLb - 1)
                                               toast = .info("Weight updated", "\(m.weightLb) lbs")
                                           },
                                           onPlus: {
                                               m.weightLb = min(400, m.weightLb + 1)
                                               toast = .info("Weight updated", "\(m.weightLb) lbs")
                                           })
                            MeasurementRow(icon: "arrow.left.and.right", label: "WINGSPAN", sub: "Fingertip to fingertip",
                                           value: wingspanInFt ? ftIn(m.wingspanIn) : "\(Int(Double(m.wingspanIn) * 2.54))",
                                           leftUnit: "FT / IN", rightUnit: "CM",
                                           leftSelected: $wingspanInFt,
                                           onMinus: {
                                               m.wingspanIn = max(48, m.wingspanIn - 1)
                                               toast = .info("Wingspan updated", ftIn(m.wingspanIn))
                                           },
                                           onPlus: {
                                               m.wingspanIn = min(102, m.wingspanIn + 1)
                                               toast = .info("Wingspan updated", ftIn(m.wingspanIn))
                                           })
                        }
                        .padding(.top, 16)

                        NavigationLink { ExperienceBodyTypeView() } label: {
                            Text("CONTINUE")
                                .shotiqCondensed(19, weight: .heavy).kerning(2)
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                                .foregroundStyle(.white)
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .success("Measurements saved", "Experience and body type are next.")
                        })
                        .padding(.top, 26)

                        HStack {
                            Button {
                                toast = .info("Back", "Returning to the intro screen.")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { dismiss() }
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "chevron.left")
                                        .font(.system(size: 16, weight: .semibold))
                                    Text("BACK")
                                        .shotiqBody(14, weight: .bold).kerning(1.5)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            Spacer()
                        }
                        .padding(.top, 18).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                }

                OnboardingTabBar(initials: shotiqInitials(app.user))
            }
        }
        .shotiqToast($toast)
    }
}

// MARK: - 010 · ios.experience-body-type

struct ExperienceBodyTypeView: View {
    @EnvironmentObject var m: OnboardingModel
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var toast: ShotIQToast?
    private let cardColumns = [
        GridItem(.flexible(minimum: 0), spacing: 10),
        GridItem(.flexible(minimum: 0), spacing: 10)
    ]

    private let experienceOptions: [(String, String, String, String)] = [
        ("Beginner", "BEGINNER", "Just getting started", "chart.line.uptrend.xyaxis"),
        ("Intermediate", "INTERMEDIATE", "Consistent with basics", "point.3.connected.trianglepath.dotted"),
        ("Advanced", "ADVANCED", "Competes regularly", "point.3.filled.connected.trianglepath.dotted"),
        ("Elite", "ELITE", "High-level competition", "triangle"),
        ("Professional", "PROFESSIONAL", "Pro or aspiring pro", "arrow.up.right")
    ]
    private let bodyTypeOptions: [(String, String, String, String)] = [
        ("Slim", "SLIM / LEAN", "Light frame, longer limbs", "figure.stand"),
        ("Athletic", "ATHLETIC", "Balanced build, muscular", "figure.walk"),
        ("Solid", "STOCKY / STRONG", "Solid build, powerful frame", "figure.strengthtraining.traditional"),
        ("Big", "LARGER FRAME", "Broad build, higher mass", "figure.arms.open")
    ]

    var body: some View {
        CanonicalScreen(testID: "screen-ios-experience-body-type") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: app.user?.displayName ?? "Player",
                                     subtitle: "\(m.hand)-handed • \(m.experience)")

                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("PRIMARY TARGET")
                                    .shotiqBody(13, weight: .bold).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                Text("Keep elbow stacked through release")
                                    .shotiqBody(17, weight: .medium)
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.top, 16)

                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 18)

                        HStack {
                            Text("STEP 2 OF 4")
                                .shotiqBody(14, weight: .bold).kerning(1)
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            Spacer()
                            StepBars(total: 4, filled: 2, barWidth: 40)
                        }
                        .padding(.top, 18)

                        Text("EXPERIENCE & BODY TYPE")
                            .shotiqDisplay(42)
                            .lineLimit(1)
                            .minimumScaleFactor(0.55)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.top, 12)
                        Text("This helps us tailor analysis and training recommendations to your game.")
                            .shotiqBody(16)
                            .foregroundStyle(ShotIQColor.graphite)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 8)

                        QuestionLabel(text: "WHAT BEST DESCRIBES YOUR EXPERIENCE?").padding(.top, 24)
                        LazyVGrid(columns: cardColumns, alignment: .leading, spacing: 10) {
                            ForEach(experienceOptions, id: \.0) { value, label, caption, icon in
                                OptionCard(icon: icon, label: label, caption: caption,
                                           selected: m.experience == value) {
                                    m.experience = value
                                    toast = .success("Experience set", value)
                                }
                                .frame(minHeight: 178)
                            }
                        }
                        .padding(.top, 12)

                        QuestionLabel(text: "WHAT BEST DESCRIBES YOUR BODY TYPE?").padding(.top, 24)
                        LazyVGrid(columns: cardColumns, alignment: .leading, spacing: 10) {
                            ForEach(bodyTypeOptions, id: \.0) { value, label, caption, icon in
                                OptionCard(icon: icon, label: label, caption: caption,
                                           selected: m.bodyType == value) {
                                    m.bodyType = value
                                    toast = .success("Body type set", value)
                                }
                                .frame(minHeight: 178)
                            }
                        }
                        .padding(.top, 12)

                        HStack(spacing: 14) {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-coaching-tip",
                                                     size: 24,
                                                     label: nil)
                            Text("You can update these anytime in your profile settings.")
                                .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                            Spacer()
                        }
                        .padding(16)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 20)

                        NavigationLink { ShootingProfileView() } label: {
                            primaryLabel("Continue")
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .success("Profile preferences saved", "Shooting profile is next.")
                        })
                        .padding(.top, 20)

                        SecondaryButton(title: "Back") {
                            toast = .info("Back", "Returning to measurements.")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { dismiss() }
                        }
                            .padding(.top, 12).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                OnboardingTabBar(initials: shotiqInitials(app.user))
            }
        }
        .shotiqToast($toast)
    }
}

// MARK: - 011 · ios.shooting-profile

struct ShootingProfileView: View {
    @EnvironmentObject var m: OnboardingModel
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var toast: ShotIQToast?

    var body: some View {
        CanonicalScreen(testID: "screen-ios-shooting-profile") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("SHOOTING PROFILE").shotiqDisplay(48)
                                Text("Tell us about your game.")
                                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 6) {
                                ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-ladder-balls",
                                                         size: 28,
                                                         label: nil)
                                Text("STEP 3 OF 4")
                                    .shotiqBody(12, weight: .semibold).kerning(2)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .padding(.top, 14)

                        ShotIQCard {
                            HStack(spacing: 12) {
                                ZStack {
                                    Circle().fill(ShotIQColor.warmCanvas)
                                    Text(shotiqInitials(app.user))
                                        .shotiqCondensed(17, weight: .heavy)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(width: 54, height: 54)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text((app.user?.displayName ?? "Player").uppercased())
                                        .shotiqCondensed(19, weight: .heavy)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                    Text("\(m.hand)-handed • \(m.experience)")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    HStack(spacing: 4) {
                                        Text("Form Score").shotiqBody(12)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("82").shotiqBody(14, weight: .semibold)
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                    }
                                }
                                Spacer()
                                StatRow(stats: [("24", "SHOTS", ShotIQColor.ink),
                                                ("15", "MAKES", ShotIQColor.ink),
                                                ("62.5%", "ACC", ShotIQColor.ink)])
                                    .frame(width: 150)
                            }
                            .padding(14)
                        }
                        .padding(.top, 16)

                        HStack(alignment: .top, spacing: 14) {
                            CoachingTargetGlyph(size: 28)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("PRIMARY TARGET")
                                    .shotiqBody(14, weight: .bold).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("Keep elbow stacked through release.")
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(.top, 18)

                        sectionHeader("DOMINANT HAND", "The hand you use to shoot.")
                        HStack(spacing: 10) {
                            OptionCard(icon: "", label: "RIGHT-HANDED",
                                       selected: m.hand == "Right") {
                                m.hand = "Right"
                                toast = .success("Shooting hand set", "Right-handed")
                            }
                            OptionCard(icon: "", label: "LEFT-HANDED",
                                       selected: m.hand == "Left") {
                                m.hand = "Left"
                                toast = .success("Shooting hand set", "Left-handed")
                            }
                        }
                        .padding(.top, 12)

                        sectionHeader("ATHLETIC ABILITY", "How would you describe your athletic ability?")
                        HStack(alignment: .top, spacing: 10) {
                            OptionCard(icon: "", label: "DEVELOPING",
                                       selected: m.ability == "Developing") {
                                m.ability = "Developing"
                                toast = .success("Ability set", "Developing")
                            }
                            OptionCard(icon: "", label: "ADVANCED",
                                       selected: m.ability == "Advanced") {
                                m.ability = "Advanced"
                                toast = .success("Ability set", "Advanced")
                            }
                            OptionCard(icon: "", label: "ELITE",
                                       selected: m.ability == "Elite") {
                                m.ability = "Elite"
                                toast = .success("Ability set", "Elite")
                            }
                        }
                        .padding(.top, 12)

                        sectionHeader("SHOOTING STYLE", "Pick the style that best matches your shot.")
                        // All three canonical style frames are bundled; the middle
                        // one was the only card still falling back to the grey
                        // `figure.basketball` placeholder. Note that canonical
                        // shows BALANCED selected, so 011-visual-001 carries the
                        // orange check in its own top-right corner. StyleCard's
                        // live selection mark sits under the photo, not on it, so
                        // nothing is drawn twice — but the baked mark does not
                        // move if the player picks another style.
                        HStack(alignment: .top, spacing: 10) {
                            StyleCard(label: "COMPACT", caption: "Quick, efficient release",
                                      photoKey: "011-visual-004",
                                      selected: m.styleArc == "Compact") {
                                m.styleArc = "Compact"
                                toast = .success("Shot style set", "Compact")
                            }
                            StyleCard(label: "BALANCED", caption: "Versatile all-around approach",
                                      photoKey: "011-visual-001",
                                      selected: m.styleArc == "Balanced") {
                                m.styleArc = "Balanced"
                                toast = .success("Shot style set", "Balanced")
                            }
                            StyleCard(label: "HIGH ARC", caption: "Higher release, maximum arc",
                                      photoKey: "011-visual-003",
                                      selected: m.styleArc == "High Arc") {
                                m.styleArc = "High Arc"
                                toast = .success("Shot style set", "High Arc")
                            }
                        }
                        .padding(.top, 12)

                        HStack(alignment: .top, spacing: 14) {
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.metering.center.weighted"),
                                                     size: 26,
                                                     label: nil)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Why this matters")
                                    .shotiqBody(15, weight: .semibold)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("Your profile helps ShotIQ provide more accurate feedback and training recommendations.")
                                    .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(.top, 20)

                        HStack(spacing: 14) {
                            Button {
                                toast = .info("Back", "Returning to experience and body type.")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { dismiss() }
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "chevron.left")
                                        .font(.system(size: 15, weight: .semibold))
                                    Text("Back").shotiqBody(17)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                                .padding(.horizontal, 18).frame(height: 50)
                            }
                            NavigationLink { PlayerBioView() } label: {
                                Text("Continue")
                                    .shotiqBody(17, weight: .medium)
                                    .frame(maxWidth: .infinity).frame(height: 50)
                                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                                    .foregroundStyle(.white)
                            }
                            .simultaneousGesture(TapGesture().onEnded {
                                toast = .success("Shooting profile saved", "Player bio is next.")
                            })
                        }
                        .padding(.top, 20).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                }
                OnboardingTabBar(initials: shotiqInitials(app.user))
            }
        }
        .shotiqToast($toast)
    }

    @ViewBuilder
    private func sectionHeader(_ title: String, _ sub: String) -> some View {
        Text(title)
            .shotiqCondensed(22, weight: .heavy)
            .foregroundStyle(ShotIQColor.ink)
            .padding(.top, 24)
        Text(sub)
            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
            .padding(.top, 3)
    }
}

// MARK: - 012 · ios.player-bio

struct PlayerBioView: View {
    @EnvironmentObject var m: OnboardingModel
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var enhanceBusy = false
    @State private var enhanceError: String?
    @State private var toast: ShotIQToast?

    /// POST /api/enhance-bio — AI-expands the bio; result lands in the preview card.
    @MainActor
    private func enhance() async {
        let trimmed = m.bio.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 20 else {
            enhanceError = "Write at least 20 characters first so the AI has something to work with."
            toast = .error("Bio too short", "Write at least 20 characters first.")
            return
        }
        enhanceBusy = true; enhanceError = nil
        toast = .progress("Enhancing bio", "ShotIQ is rewriting your player bio.", progress: 0.55)
        struct Resp: Codable { var success: Bool?; var enhancedBio: String? }
        do {
            let r: Resp = try await APIClient.shared.call(
                "/api/enhance-bio", method: "POST", body: ["bio": trimmed])
            if let enhanced = r.enhancedBio, !enhanced.isEmpty {
                m.enhancedBio = enhanced
                toast = .success("Bio enhanced", "Review the updated profile copy.")
            } else {
                enhanceError = "Could not enhance the bio. Try again shortly."
                toast = .error("Enhance failed", "Try again shortly.")
            }
        } catch {
            enhanceError = "Could not enhance the bio. Try again shortly."
            toast = .error("Enhance failed", "Check your connection and try again.")
        }
        enhanceBusy = false
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-player-bio") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Text("ONBOARDING 7 OF 8")
                                .shotiqBody(13, weight: .bold).kerning(1)
                                .foregroundStyle(ShotIQColor.graphite)
                            Spacer()
                            StepBars(total: 5, filled: 4, barWidth: 34)
                        }
                        .padding(.top, 16)

                        HStack(alignment: .top, spacing: 16) {
                            VStack(alignment: .leading, spacing: 0) {
                                Text("PLAYER BIO").shotiqDisplay(52).padding(.top, 12)
                                Text("Add a short bio to personalize your profile.")
                                    .shotiqBody(15).foregroundStyle(ShotIQColor.ink)
                                    .padding(.top, 10)
                                Text("You can always update it later in settings.")
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                    .padding(.top, 6)
                            }
                            ZStack(alignment: .bottomTrailing) {
                                CanonicalPhoto("013-avatar", width: 148, height: 150, cornerRadius: 10)
                                ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-profile-initials",
                                                         size: 28,
                                                         label: nil)
                                    .padding(8)
                                    .background(.white.opacity(0.9), in: Circle())
                                    .padding(8)
                            }
                            .frame(width: 148, height: 150)
                        }

                        HStack(spacing: 0) {
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                                .frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 52)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                .frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 52)
                            HeaderStat(icon: "scope", value: "82", label: "FORM SCORE")
                                .frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 52)
                            HeaderStat(icon: "chart.line.uptrend.xyaxis", value: "62.5%", label: "MAKE %")
                                .frame(maxWidth: .infinity)
                        }
                        .padding(.top, 20)

                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 18)

                        HStack(alignment: .firstTextBaseline) {
                            Text("YOUR BIO")
                                .shotiqCondensed(24, weight: .heavy)
                                .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Text("\(m.bio.count) / 160")
                                .font(.custom("Tungsten-Medium", size: 20))
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 18)

                        ZStack(alignment: .topLeading) {
                            TextEditor(text: $m.bio)
                                .shotiqBody(16)
                                .foregroundStyle(ShotIQColor.ink)
                                .scrollContentBackground(.hidden)
                                .padding(10)
                                .frame(height: 190)
                            if m.bio.isEmpty {
                                Text("Tell us about your basketball journey, goals, and what motivates you.")
                                    .shotiqBody(16)
                                    .foregroundStyle(ShotIQColor.muted)
                                    .padding(.horizontal, 15).padding(.top, 18)
                                    .allowsHitTesting(false)
                            }
                        }
                        .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 10)
                        .onChange(of: m.bio) { _, v in
                            if v.count > 160 { m.bio = String(v.prefix(160)) }
                        }

                        ShotIQCard {
                            HStack(spacing: 14) {
                                ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-improve",
                                                         size: 28,
                                                         label: nil)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("ENHANCE WITH AI")
                                        .shotiqBody(14, weight: .bold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text("Let ShotIQ AI craft a stronger bio based on your profile and training data.")
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Button { Task { await enhance() } } label: {
                                    HStack(spacing: 6) {
                                        if enhanceBusy {
                                            ProgressView().controlSize(.small).tint(ShotIQColor.shotiqOrange)
                                        } else {
                                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "sparkles"), size: 42).font(.system(size: 13))
                                        }
                                        Text(enhanceBusy ? "Enhancing…" : "Enhance bio")
                                            .shotiqBody(14, weight: .medium)
                                    }
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .padding(.horizontal, 12).frame(height: 40)
                                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange))
                                }
                                .disabled(enhanceBusy)
                            }
                            .padding(16)
                        }
                        .padding(.top, 16)

                        if let enhanceError {
                            Text(enhanceError)
                                .shotiqBody(14).foregroundStyle(ShotIQColor.reviewRed)
                                .padding(.top, 10)
                        }

                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("AI-ENHANCED PREVIEW")
                                    .shotiqBody(12, weight: .bold).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.graphite)
                                if m.enhancedBio.isEmpty {
                                    HStack(spacing: 14) {
                                        Image(systemName: "circle.dashed")
                                            .font(.system(size: 26))
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("Your enhanced bio will appear here.\nReview and customize before saving.")
                                            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                        Spacer()
                                    }
                                } else {
                                    Text(m.enhancedBio)
                                        .shotiqBody(14).foregroundStyle(ShotIQColor.ink)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                    Text("Saved with your profile as your AI-enhanced bio.")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.confirmGreen)
                                }
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.top, 12)

                        NavigationLink { OnboardingReviewView() } label: {
                            primaryLabel("Review profile")
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .success("Bio saved", "Review your full profile next.")
                        })
                        .padding(.top, 20)

                        SecondaryButton(title: "Back") {
                            toast = .info("Back", "Returning to shooting profile.")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { dismiss() }
                        }
                            .padding(.top, 12).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                }
                OnboardingTabBar(initials: shotiqInitials(app.user))
            }
        }
        .shotiqToast($toast)
    }
}

// MARK: - 013 · ios.onboarding-review

struct OnboardingReviewView: View {
    @EnvironmentObject var m: OnboardingModel
    @EnvironmentObject var app: AppState
    @State private var saving = false
    @State private var saveError: String?
    @State private var goNext = false
    @State private var focusExpanded = false
    @State private var toast: ShotIQToast?

    /// PUT /api/profile — persists every onboarding field (measurements,
    /// experience, body type, hand, ability, style, bio) and marks the
    /// profile complete, then advances to the permission primers.
    @MainActor
    private func completeProfile() async {
        saving = true; saveError = nil
        toast = .progress("Saving profile", "Personalizing ShotIQ coaching for you.", progress: 0.55)
        struct Resp: Codable { var success: Bool? }
        do {
            let r: Resp = try await APIClient.shared.call(
                "/api/profile", method: "PUT", body: m.saveBody)
            if r.success == false {
                saveError = "Could not save your profile. Try again."
                toast = .error("Profile not saved", "Try again or continue without saving.")
            } else {
                app.user?.profileComplete = true
                toast = .success("Profile saved", "Next, set up your permissions.")
                goNext = true
            }
        } catch {
            saveError = "Could not save your profile. Check your connection and try again."
            toast = .error("Profile not saved", "Check your connection and try again.")
        }
        saving = false
    }

    private var summaryRows: [(String, String)] {
        [("Shooting Hand", m.hand),
         ("Experience Level", m.experience),
         ("Primary Position", m.position),
         ("Height", ftIn(m.heightIn)),
         ("Wingspan", ftIn(m.wingspanIn)),
         ("Dominant Shot Type", m.shotStyle),
         ("Practice Frequency", "3–5 times per week"),
         ("Training Goal", "Improve consistency")]
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-onboarding-review") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("ONBOARDING • STEP 5 OF 5")
                            .shotiqBody(13, weight: .semibold).kerning(1)
                            .foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 16)
                        Text("REVIEW YOUR PROFILE").shotiqDisplay(50).padding(.top, 8)
                        Text("We'll use your profile and shooting data to personalize your coaching experience.")
                            .shotiqBody(16).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)

                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 16)

                        HStack(alignment: .top, spacing: 14) {
                            // Canonical prints the player's headshot here, not
                            // initials. Its sidecar declares no photo region for
                            // this screen, so the crop pipeline had no source and
                            // the app fell back to a monogram — the photograph is
                            // in the render regardless, and is now cut from it.
                            // If the asset were ever missing, CanonicalPhoto paints
                            // its dark surface rather than a monogram, so the crop
                            // is bundled alongside this change, not assumed.
                            CanonicalPhoto("013-avatar", width: 74, height: 74,
                                           cornerRadius: 37)
                                .overlay(Circle().stroke(ShotIQColor.rule, lineWidth: 1))
                            VStack(alignment: .leading, spacing: 4) {
                                Text((app.user?.displayName ?? "Player").uppercased())
                                    .shotiqCondensed(26, weight: .heavy)
                                    .foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text("\(m.hand)-handed • \(m.experience)")
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                HStack(spacing: 6) {
                                    AbilityGlyph(kind: .intermediate, size: 14)
                                    Text("INTERMEDIATE TIER")
                                        .shotiqBody(13, weight: .bold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                }
                                Text("Built from your profile and data")
                                    .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 8) {
                                editLink("figure.stand", "Edit measurements") { PhysicalProfileView() }
                                editLink("point.3.connected.trianglepath.dotted", "Edit shooting profile") { ShootingProfileView() }
                            }
                        }
                        .padding(.top, 18)

                        ShotIQCard {
                            HStack(spacing: 0) {
                                HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                                    .frame(maxWidth: .infinity)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 52)
                                HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                    .frame(maxWidth: .infinity)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 52)
                                HeaderStat(icon: "scope", value: "82", label: "FORM SCORE")
                                    .frame(maxWidth: .infinity)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 52)
                                VStack(spacing: 3) {
                                    ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "arrow.up.right"), size: 42)
                                        .font(.system(size: 15))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Text("+8.1%").font(.custom("Tungsten-Medium", size: 24))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Text("VS LAST SESSION")
                                        .shotiqBody(9, weight: .medium).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(maxWidth: .infinity)
                            }
                            .padding(.vertical, 16)
                        }
                        .padding(.top, 18)

                        ShotIQCard {
                            Button {
                                withAnimation(.easeInOut(duration: 0.2)) { focusExpanded.toggle() }
                                toast = .info(focusExpanded ? "Coaching focus expanded" : "Coaching focus collapsed")
                            } label: {
                                VStack(alignment: .leading, spacing: 0) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 6) {
                                            Text("COACHING FOCUS")
                                                .shotiqBody(12, weight: .bold).kerning(0.8)
                                                .foregroundStyle(ShotIQColor.graphite)
                                            Text("Keep elbow stacked through release")
                                                .shotiqBody(19, weight: .semibold)
                                                .foregroundStyle(ShotIQColor.ink)
                                        }
                                        Spacer()
                                        Image(systemName: focusExpanded ? "chevron.down" : "chevron.right")
                                            .font(.system(size: 15))
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    if focusExpanded {
                                        Text("Your coaching focus updates automatically as ShotIQ analyzes your shots. Track it from the Training tab once onboarding is complete.")
                                            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                            .padding(.top, 10)
                                    }
                                }
                                .padding(16)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 12)

                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 14) {
                                SectionLabel(text: "SHOOTING SUMMARY")
                                StatRow(stats: [("24", "SHOTS", ShotIQColor.ink),
                                                ("15", "MAKES", ShotIQColor.ink),
                                                ("62.5%", "MAKE %", ShotIQColor.ink)])
                                SectionLabel(text: "SHOT RAIL").padding(.top, 4)
                                PhaseStrip(active: "RELEASE")
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.top, 12)

                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "PROFILE SUMMARY")
                                ForEach(summaryRows, id: \.0) { k, v in
                                    HStack(alignment: .top) {
                                        Text(k).shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                            .frame(width: 150, alignment: .leading)
                                        Text(v).shotiqBody(14).foregroundStyle(ShotIQColor.ink)
                                        Spacer()
                                    }
                                }
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.top, 12)

                        if let saveError {
                            Text(saveError)
                                .shotiqBody(14).foregroundStyle(ShotIQColor.reviewRed)
                                .padding(.top, 16)
                        }

                        Button { Task { await completeProfile() } } label: {
                            primaryLabel(saving ? "Saving profile…" : "Complete profile", icon: "checkmark.circle.fill")
                        }
                        .disabled(saving)
                        .padding(.top, 20)
                        .navigationDestination(isPresented: $goNext) { CameraPermissionPrimerView() }

                        if saveError != nil {
                            Button {
                                toast = .info("Continuing without saving", "You can update your profile later.")
                                goNext = true
                            } label: {
                                Text("Continue without saving")
                                    .shotiqBody(15)
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .underline()
                                    .frame(maxWidth: .infinity)
                            }
                            .padding(.top, 14)
                        }

                        Spacer().frame(height: 24)
                    }
                    .padding(.horizontal, 20)
                }
                OnboardingTabBar(initials: shotiqInitials(app.user))
            }
        }
        .shotiqToast($toast)
    }

    private func editLink<D: View>(_ icon: String, _ label: String,
                                   @ViewBuilder destination: @escaping () -> D) -> some View {
        NavigationLink { destination() } label: {
            HStack(spacing: 6) {
                ShotIQConceptGlyph(concept: label, fallback: icon, size: 24)
                Text(label).shotiqBody(12, weight: .medium)
            }
            .padding(.horizontal, 10).frame(height: 34)
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
            .foregroundStyle(ShotIQColor.ink)
        }
        .simultaneousGesture(TapGesture().onEnded {
            toast = .info("Opening \(label)")
        })
    }
}

// MARK: - 014 · ios.camera-permission-primer

struct CameraPermissionPrimerView: View {
    @EnvironmentObject var m: OnboardingModel
    @EnvironmentObject var app: AppState
    @State private var goNext = false
    @State private var toast: ShotIQToast?

    private let recordTiles: [(String, String, String)] = [
        ("shotiq-correction-full-body-motion", "Full-body motion", "Your movement from setup through follow-through."),
        ("shotiq-correction-ball-trajectory", "Ball trajectory", "The path and release point of your shot."),
        ("shotiq-correction-timing-sequence", "Timing & sequence", "Key moments and phase transitions.")
    ]

    var body: some View {
        CanonicalScreen(testID: "screen-ios-camera-permission-primer") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: app.user?.displayName ?? "Player",
                                     subtitle: "\(m.hand)-handed • \(m.experience)")
                            .padding(.horizontal, -20)

                        Text("LIVE SHOT CAPTURE").shotiqDisplay(50).padding(.top, 18)
                        Text("HOW IT WORKS")
                            .shotiqBody(16, weight: .semibold).kerning(4)
                            .foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 2)
                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 12)
                        Text("Live capture uses your camera to record your shot so ShotIQ can analyze your mechanics in real time.")
                            .shotiqBody(16).foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 14)

                        QuestionLabel(text: "WHAT WE RECORD").padding(.top, 22)
                        HStack(alignment: .top, spacing: 12) {
                            ForEach(recordTiles, id: \.1) { icon, title, caption in
                                VStack(spacing: 8) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 6).fill(ShotIQColor.warmCanvas)
                                        ShotIQApprovedRasterIcon(assetName: icon, size: 104, label: title)
                                    }
                                    .frame(height: 110)
                                    Text(title).shotiqBody(15, weight: .semibold)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                    Text(caption).shotiqBody(12)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .multilineTextAlignment(.center)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.top, 12)

                        HStack(alignment: .top, spacing: 14) {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-privacy-info",
                                                     size: 38,
                                                     label: nil)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Your privacy matters")
                                    .shotiqBody(16, weight: .semibold)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("Videos are securely processed to generate your analysis. We do not share or use your videos for anything else.")
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(16)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 20)

                        QuestionLabel(text: "WHEN YOU'LL SEE THIS").padding(.top, 24)
                        HStack(alignment: .top, spacing: 16) {
                            Text("You'll be asked for camera access the first time you start a live capture.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            // Mock of the system camera prompt.
                            ShotIQCard {
                                VStack(spacing: 0) {
                                    Text("“ShotIQ” Would Like to Access the Camera")
                                        .shotiqBody(14, weight: .semibold)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .multilineTextAlignment(.center)
                                        .padding(.top, 14).padding(.horizontal, 12)
                                    Text("ShotIQ uses your camera to record live shots and analyze your form.")
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .multilineTextAlignment(.center)
                                        .padding(.top, 6).padding(.horizontal, 12).padding(.bottom, 12)
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                    HStack(spacing: 0) {
                                        Text("Don't Allow")
                                            .shotiqBody(14)
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                            .frame(maxWidth: .infinity)
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                                        Text("Allow")
                                            .shotiqBody(14, weight: .semibold)
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                            .frame(maxWidth: .infinity)
                                    }
                                    .frame(height: 40)
                                }
                            }
                            .frame(width: 200)
                        }
                        .padding(.top, 12)

                        QuestionLabel(text: "HOW TO ALLOW").padding(.top, 24)
                        HStack(alignment: .top, spacing: 4) {
                            allowStep("gearshape", "Open Settings")
                            stepChevron
                            allowStep("hand.raised", "Tap Privacy & Security")
                            stepChevron
                            allowStep("camera", "Select Camera")
                            stepChevron
                            VStack(spacing: 8) {
                                ZStack(alignment: .trailing) {
                                    Capsule().fill(ShotIQColor.shotiqOrange).frame(width: 40, height: 24)
                                    Circle().fill(.white).frame(width: 18, height: 18).padding(.trailing, 3)
                                }
                                .frame(height: 30)
                                Text("Turn on ShotIQ")
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.top, 14)

                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 20)

                        HStack(alignment: .top, spacing: 16) {
                            VStack(alignment: .leading, spacing: 6) {
                                QuestionLabel(text: "GOOD TO KNOW")
                                VStack(alignment: .leading, spacing: 4) {
                                    bullet("You can change this anytime in Settings.")
                                    bullet("Camera access is required for live shot capture.")
                                    bullet("This permission does not affect your saved videos.")
                                }
                            }
                            Spacer()
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-upload-video",
                                                     size: 42,
                                                     label: nil)
                        }
                        .padding(.top, 18)

                        // Continue actually raises the system camera prompt this
                        // screen primes for, then advances.
                        Button {
                            Task {
                                toast = .progress("Requesting camera access",
                                                  "ShotIQ needs camera access for live capture.",
                                                  progress: 0.5)
                                let granted = await AVCaptureDevice.requestAccess(for: .video)
                                toast = granted
                                    ? .success("Camera ready", "Live shot capture can use your camera.")
                                    : .info("Camera not allowed", "You can still upload photos and videos.")
                                goNext = true
                            }
                        } label: {
                            primaryLabel("Continue", icon: "camera.fill")
                        }
                        .padding(.top, 20)
                        .navigationDestination(isPresented: $goNext) { PhotoLibraryPermissionView() }

                        NavigationLink { PhotoLibraryPermissionView() } label: {
                            secondaryLabel("Not now", tint: ShotIQColor.shotiqOrange, border: ShotIQColor.shotiqOrange)
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Camera skipped", "You can allow camera access later in Settings.")
                        })
                        .padding(.top, 12).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                }
                OnboardingTabBar(initials: shotiqInitials(app.user))
            }
        }
        .shotiqToast($toast)
    }

    private var stepChevron: some View {
        Image(systemName: "chevron.right")
            .font(.system(size: 12))
            .foregroundStyle(ShotIQColor.muted)
            .padding(.top, 8)
    }
    private func allowStep(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 8) {
            ShotIQConceptGlyph(concept: label, fallback: icon, size: 30)
                .foregroundStyle(ShotIQColor.ink)
                .frame(height: 30)
            Text(label)
                .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
    private func bullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
            Text(text).shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
        }
    }
}

// MARK: - 015 · ios.photo-library-permission

struct PhotoLibraryPermissionView: View {
    @EnvironmentObject var m: OnboardingModel
    @EnvironmentObject var app: AppState
    @State private var goNext = false
    @State private var toast: ShotIQToast?

    /// Raises the system photo-library prompt this screen primes for, then advances.
    @MainActor
    private func chooseAccess() async {
        toast = .progress("Requesting photo access",
                          "ShotIQ uses only the photos you choose for analysis.",
                          progress: 0.5)
        let status = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
        toast = status == .authorized || status == .limited
            ? .success("Photos ready", "You can upload real shot images.")
            : .info("Photos not allowed", "You can still use the camera path.")
        goNext = true
    }

    /// Camera path instead of the library: raises the camera prompt, then advances.
    @MainActor
    private func useCameraInstead() async {
        toast = .progress("Requesting camera access",
                          "Opening the camera path for shot capture.",
                          progress: 0.5)
        let granted = await AVCaptureDevice.requestAccess(for: .video)
        toast = granted
            ? .success("Camera ready", "You can capture a new shot.")
            : .info("Camera not allowed", "You can change this later in Settings.")
        goNext = true
    }

    private let accessRows: [(String, String, String)] = [
        ("shotiq-correction-selected-photos", "Selected photos only",
         "You pick the photos we analyze. We never scan your entire library."),
        ("shotiq-correction-private-secure", "Private and secure",
         "Analysis happens in the cloud. Your photos are never shared."),
        ("shotiq-correction-used-for-analysis", "Used for analysis",
         "Your photos help us deliver accurate form insights.")
    ]

    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-library-permission") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: app.user?.displayName ?? "Player",
                                     subtitle: "\(m.hand)-handed • \(m.experience)")
                            .padding(.horizontal, -20)

                        StatRow(stats: [("82", "FORM SCORE", ShotIQColor.analysisBlue),
                                        ("24", "SHOTS", ShotIQColor.ink),
                                        ("15", "MAKES", ShotIQColor.ink),
                                        ("62.5%", "SHOOTING", ShotIQColor.ink)])
                            .padding(.vertical, 14)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            .padding(.top, 14)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("PRIMARY TARGET")
                                .shotiqBody(12, weight: .semibold).kerning(1)
                                .foregroundStyle(ShotIQColor.graphite)
                            Text("Keep elbow stacked through release.")
                                .shotiqBody(16, weight: .semibold)
                                .foregroundStyle(ShotIQColor.ink)
                        }
                        .padding(.top, 16)

                        HStack(alignment: .top, spacing: 16) {
                            VStack(alignment: .leading, spacing: 0) {
                                Text("WE NEED ACCESS TO YOUR PHOTOS").shotiqDisplay(44).padding(.top, 12)
                                Text("ShotIQ analyzes your mechanics using photos from your library. You choose what to share—nothing is uploaded without your permission.")
                                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                                    .padding(.top, 10)
                            }
                            CanonicalPhoto("generated-photo-library-015",
                                           width: 150,
                                           height: 250,
                                           cornerRadius: 10)
                            .frame(width: 150)
                            .padding(.top, 12)
                        }

                        QuestionLabel(text: "WHAT WE ACCESS").padding(.top, 24)
                        VStack(spacing: 0) {
                            ForEach(accessRows, id: \.1) { icon, title, caption in
                                HStack(alignment: .top, spacing: 16) {
                                    ShotIQApprovedRasterIcon(assetName: icon, size: 64, label: title)
                                        .frame(width: 68)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(title).shotiqBody(16, weight: .semibold)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text(caption).shotiqBody(14)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(.vertical, 14)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            }
                        }
                        .padding(.top, 6)

                        QuestionLabel(text: "OTHER WAYS TO ADD PHOTOS").padding(.top, 22)
                        Button { Task { await useCameraInstead() } } label: {
                            HStack(spacing: 16) {
                                ShotIQApprovedRasterIcon(assetName: "shotiq-approved-ui-live-camera",
                                                         size: 42,
                                                         label: nil)
                                    .frame(width: 44)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("Use camera instead").shotiqBody(16, weight: .semibold)
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text("Open the camera to capture a new shot.")
                                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.vertical, 14)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)

                        QuestionLabel(text: "CHOOSE HOW YOU'D LIKE TO PROCEED").padding(.top, 14)

                        // Raises the actual system photo prompt, then advances.
                        Button { Task { await chooseAccess() } } label: {
                            primaryLabel("Choose access", icon: "camera.metering.center.weighted")
                        }
                        .padding(.top, 14)
                        .navigationDestination(isPresented: $goNext) { NotificationPermissionPrimerView() }

                        Button { Task { await useCameraInstead() } } label: {
                            HStack(spacing: 10) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera"), size: 42)
                                Text("Use camera instead").shotiqBody(17, weight: .medium)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.shotiqOrange))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .padding(.top, 12)

                        NavigationLink { NotificationPermissionPrimerView() } label: {
                            secondaryLabel("Not now")
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Photos skipped", "You can allow photo access later in Settings.")
                        })
                        .padding(.top, 12)

                        HStack(spacing: 6) {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-privacy-info",
                                                     size: 14,
                                                     label: nil)
                            Text("You can change this anytime in Settings.")
                                .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            Button("Learn more") {
                                toast = .info("Opening Settings", "Review photo access controls in iOS Settings.")
                                CameraService.openSystemSettings()
                            }
                                .font(.system(size: 13))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 14).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                }
                OnboardingTabBar(initials: shotiqInitials(app.user))
            }
        }
        .shotiqToast($toast)
    }
}

// MARK: - 016 · ios.notification-permission-primer

struct NotificationPermissionPrimerView: View {
    @EnvironmentObject var m: OnboardingModel
    @EnvironmentObject var app: AppState
    @State private var toast: ShotIQToast?

    private let reasons: [(String, String, String)] = [
        ("film", "ANALYSIS COMPLETE", "Get notified as soon as your AI analysis is ready to review."),
        ("point.3.connected.trianglepath.dotted", "TRAINING REMINDERS", "Stay consistent with timely reminders for your workouts and goals."),
        ("target", "GOAL MILESTONES", "Celebrate progress with nudges when you hit key milestones.")
    ]

    var body: some View {
        CanonicalScreen(testID: "screen-ios-notification-permission-primer") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: app.user?.displayName ?? "Player",
                                     subtitle: "\(m.hand)-handed • \(m.experience)")
                            .padding(.horizontal, -20)

                        StatRow(stats: [("24", "SHOTS", ShotIQColor.ink),
                                        ("15", "MAKES", ShotIQColor.ink),
                                        ("62.5%", "SHOOTING", ShotIQColor.ink),
                                        ("82", "FORM SCORE", ShotIQColor.shotiqOrange)])
                            .padding(.vertical, 14)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            .padding(.top, 14)

                        HStack(spacing: 8) {
                            Text("PRIMARY TARGET:")
                                .shotiqBody(12, weight: .bold).kerning(0.8)
                                .foregroundStyle(ShotIQColor.graphite)
                            Text("Keep elbow stacked through release")
                                .shotiqBody(15).foregroundStyle(ShotIQColor.ink)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 14)

                        Text("STAY IN THE LOOP").shotiqDisplay(54).padding(.top, 16)
                        Text("Turn on notifications so you never miss AI analysis results, training reminders, or goal milestones.")
                            .shotiqBody(16).foregroundStyle(ShotIQColor.graphite).padding(.top, 8)

                        VStack(spacing: 0) {
                            ForEach(reasons, id: \.1) { icon, title, caption in
                                HStack(alignment: .center, spacing: 16) {
                                    ShotIQConceptGlyph(concept: title, fallback: icon, size: 58)
                                        .frame(width: 64)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 58)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(title)
                                            .shotiqCondensed(19, weight: .heavy)
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        Text(caption)
                                            .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(.vertical, 16)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            }
                        }
                        .padding(.top, 8)

                        HStack(alignment: .top, spacing: 16) {
                            CanonicalPhoto("016-visual-001", height: 190, cornerRadius: 8)
                            VStack(alignment: .leading, spacing: 6) {
                                Text("FORM SCORE")
                                    .shotiqBody(12, weight: .bold).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("82")
                                    .font(.custom("Tungsten-Medium", size: 62))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                ScoreBar(pct: 0.82)
                                Text("GOOD")
                                    .shotiqCondensed(15, weight: .heavy)
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                Text("Keep building consistency.")
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                            }
                            .frame(width: 120)
                        }
                        .padding(.top, 20)

                        PrimaryButton(title: "Turn on notifications", icon: "bell.badge.fill",
                                      color: ShotIQColor.shotiqOrange) {
                            Task { @MainActor in
                                toast = .progress("Requesting notifications",
                                                  "ShotIQ will use these for analysis results and training reminders.",
                                                  progress: 0.5)
                                // Raise the real system prompt; onboarding completes either way.
                                let granted = (try? await UNUserNotificationCenter.current()
                                    .requestAuthorization(options: [.alert, .badge, .sound])
                                ) ?? false
                                toast = granted
                                    ? .success("Notifications on", "You will know when analysis and workouts are ready.")
                                    : .info("Notifications skipped", "You can turn them on later in Settings.")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                                    app.onboardingComplete = true
                                }
                            }
                        }
                        .padding(.top, 22)

                        SecondaryButton(title: "Not now") {
                            toast = .info("Notifications skipped", "You can turn them on later in Settings.")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                                app.onboardingComplete = true
                            }
                        }
                            .padding(.top, 12).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                }
                OnboardingTabBar(initials: shotiqInitials(app.user))
            }
        }
        .shotiqToast($toast)
    }
}
