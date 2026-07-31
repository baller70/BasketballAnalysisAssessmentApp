import SwiftUI

// Canonical onboarding flow — screens 008-016. Data persists in the shared
// OnboardingModel and is submitted once at review.

@MainActor
final class OnboardingModel: ObservableObject {
    @Published var heightIn = 74
    @Published var weightLb = 185
    @Published var wingspanIn = 78
    @Published var experience = "Advanced"
    @Published var bodyType = "Athletic"
    @Published var hand = "Right"
    @Published var position = "Guard"
    @Published var shotStyle = "Catch & Shoot"
    @Published var bio = ""
    @Published var name = ""
}

struct OnboardingFlowView: View {
    @StateObject private var model = OnboardingModel()
    var body: some View {
        NavigationStack { OnboardingIntroView() }.environmentObject(model)
    }
}

/// Shared scaffold: step header + progress + continue button.
struct OnboardingStep<Content: View>: View {
    var testID: String; var step: Int; var title: String; var subtitle: String
    var next: AnyView?
    var finish: (() -> Void)?
    @ViewBuilder var content: Content
    var body: some View {
        CanonicalScreen(testID: testID) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 6) {
                    ForEach(0..<6) { i in
                        Capsule().fill(i < step ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                            .frame(height: 4)
                    }
                }
                .padding(.top, 20)
                Text(title).shotiqDisplay(40).padding(.top, 26)
                Text(subtitle).shotiqBody(15).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                ScrollView { content.padding(.top, 22) }
                Spacer(minLength: 0)
                if let next {
                    NavigationLink { next } label: {
                        Text("Continue").frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                    }
                    .padding(.bottom, 30)
                } else if let finish {
                    PrimaryButton(title: "Finish setup", action: finish).padding(.bottom, 30)
                }
            }
            .padding(.horizontal, 24)
        }
    }
}

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
                            Text(o).font(.system(size: 15, weight: selection == o ? .semibold : .regular))
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

struct StepperRow: View {
    let label: String; let unit: String; @Binding var value: Int
    var body: some View {
        HStack {
            SectionLabel(text: label)
            Spacer()
            Button { value -= 1 } label: { Image(systemName: "minus.circle").font(.system(size: 26)) }
            Text("\(value) \(unit)").font(.custom("DINCondensed-Bold", size: 30)).frame(width: 100)
            Button { value += 1 } label: { Image(systemName: "plus.circle").font(.system(size: 26)) }
        }
        .foregroundStyle(ShotIQColor.ink)
        .padding(.vertical, 12)
        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
    }
}

struct OnboardingIntroView: View {   // 008
    var body: some View {
        OnboardingStep(testID: "screen-ios-onboarding-intro", step: 1,
                       title: "LET'S BUILD YOUR PROFILE",
                       subtitle: "A few questions so the AI can calibrate analysis to you.",
                       next: AnyView(PhysicalProfileView())) {
            VStack(spacing: 16) {
                ForEach([("figure.stand", "Physical profile", "Height, weight and wingspan"),
                         ("chart.bar", "Experience", "Skill level and body type"),
                         ("scope", "Shooting profile", "Hand, position and shot style")], id: \.1) { icon, t, d in
                    ShotIQCard {
                        HStack(spacing: 14) {
                            Image(systemName: icon).font(.system(size: 24)).frame(width: 40)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(t).shotiqBody(16, weight: .semibold)
                                Text(d).font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(16)
                    }
                }
            }
        }
    }
}

struct PhysicalProfileView: View {   // 009
    @EnvironmentObject var m: OnboardingModel
    var body: some View {
        OnboardingStep(testID: "screen-ios-physical-profile", step: 2,
                       title: "PHYSICAL PROFILE", subtitle: "Used to normalize biomechanics measurements.",
                       next: AnyView(ExperienceBodyTypeView())) {
            VStack(spacing: 6) {
                StepperRow(label: "HEIGHT", unit: "in", value: $m.heightIn)
                StepperRow(label: "WEIGHT", unit: "lb", value: $m.weightLb)
                StepperRow(label: "WINGSPAN", unit: "in", value: $m.wingspanIn)
            }
        }
    }
}

struct ExperienceBodyTypeView: View { // 010
    @EnvironmentObject var m: OnboardingModel
    var body: some View {
        OnboardingStep(testID: "screen-ios-experience-body-type", step: 3,
                       title: "EXPERIENCE & BODY TYPE", subtitle: "Calibrates elite-range comparisons.",
                       next: AnyView(ShootingProfileView())) {
            VStack(alignment: .leading, spacing: 18) {
                SectionLabel(text: "EXPERIENCE LEVEL")
                ChipRow(options: ["Beginner", "Intermediate", "Advanced", "Professional"], selection: $m.experience)
                SectionLabel(text: "BODY TYPE").padding(.top, 8)
                ChipRow(options: ["Slim", "Athletic", "Solid", "Big"], selection: $m.bodyType)
            }
        }
    }
}

struct ShootingProfileView: View {    // 011
    @EnvironmentObject var m: OnboardingModel
    var body: some View {
        OnboardingStep(testID: "screen-ios-shooting-profile", step: 4,
                       title: "SHOOTING PROFILE", subtitle: "Hand, position and preferred shot.",
                       next: AnyView(PlayerBioView())) {
            VStack(alignment: .leading, spacing: 18) {
                SectionLabel(text: "SHOOTING HAND")
                ChipRow(options: ["Right", "Left"], selection: $m.hand)
                SectionLabel(text: "POSITION").padding(.top, 8)
                ChipRow(options: ["Guard", "Wing", "Forward", "Center"], selection: $m.position)
                SectionLabel(text: "SHOT STYLE").padding(.top, 8)
                ChipRow(options: ["Catch & Shoot", "Off the Dribble", "Pull-Up", "Spot-Up"], selection: $m.shotStyle)
            }
        }
    }
}

struct PlayerBioView: View {          // 012
    @EnvironmentObject var m: OnboardingModel
    var body: some View {
        OnboardingStep(testID: "screen-ios-player-bio", step: 5,
                       title: "PLAYER BIO", subtitle: "Tell us who you are (optional).",
                       next: AnyView(OnboardingReviewView())) {
            VStack(alignment: .leading, spacing: 14) {
                SectionLabel(text: "DISPLAY NAME")
                TextField("Your name", text: $m.name)
                    .padding(.horizontal, 14).frame(height: 50)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                SectionLabel(text: "BIO").padding(.top, 8)
                TextEditor(text: $m.bio)
                    .frame(height: 130)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
            }
        }
    }
}

struct OnboardingReviewView: View {   // 013
    @EnvironmentObject var m: OnboardingModel
    var body: some View {
        OnboardingStep(testID: "screen-ios-onboarding-review", step: 6,
                       title: "REVIEW YOUR PROFILE", subtitle: "Confirm before we calibrate the AI.",
                       next: AnyView(CameraPermissionPrimerView())) {
            ShotIQCard {
                VStack(spacing: 0) {
                    ForEach([("Height", "\(m.heightIn) in"), ("Weight", "\(m.weightLb) lb"),
                             ("Wingspan", "\(m.wingspanIn) in"), ("Experience", m.experience),
                             ("Body type", m.bodyType), ("Hand", m.hand),
                             ("Position", m.position), ("Shot style", m.shotStyle)], id: \.0) { k, v in
                        HStack {
                            Text(k).font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                            Spacer()
                            Text(v).shotiqBody(15, weight: .semibold)
                        }
                        .padding(.horizontal, 16).padding(.vertical, 11)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                    }
                }
            }
        }
    }
}

/// Shared permission primer scaffold — canonical screens explain before the
/// system prompt is requested.
struct PermissionPrimer: View {
    var testID: String; var icon: String; var title: String; var body_: String
    var next: AnyView?
    var finish: (() -> Void)?
    var body: some View {
        CanonicalScreen(testID: testID) {
            VStack(spacing: 0) {
                Image(systemName: icon).font(.system(size: 56, weight: .light)).padding(.top, 130)
                Text(title).shotiqDisplay(38).multilineTextAlignment(.center).padding(.top, 26)
                Text(body_).shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center).padding(.top, 12).padding(.horizontal, 30)
                Spacer()
                VStack(spacing: 12) {
                    if let next {
                        NavigationLink { next } label: {
                            Text("Allow access").frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                                .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                        }
                        NavigationLink { next } label: {
                            Text("Not now").font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                        }
                    } else if let finish {
                        PrimaryButton(title: "Allow notifications", action: finish)
                        Button("Not now", action: finish).font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                    }
                }
                .padding(.horizontal, 24).padding(.bottom, 36)
            }
        }
    }
}

struct CameraPermissionPrimerView: View { // 014
    var body: some View {
        PermissionPrimer(testID: "screen-ios-camera-permission-primer",
                         icon: "camera", title: "CAMERA ACCESS",
                         body_: "ShotIQ uses the camera to capture live shooting sessions and give real-time form feedback.",
                         next: AnyView(PhotoLibraryPermissionView()))
    }
}

struct PhotoLibraryPermissionView: View { // 015
    var body: some View {
        PermissionPrimer(testID: "screen-ios-photo-library-permission",
                         icon: "photo.on.rectangle", title: "PHOTO LIBRARY",
                         body_: "Import existing shot photos and videos from your library for AI analysis.",
                         next: AnyView(NotificationPermissionPrimerView()))
    }
}

struct NotificationPermissionPrimerView: View { // 016
    @EnvironmentObject var app: AppState
    var body: some View {
        PermissionPrimer(testID: "screen-ios-notification-permission-primer",
                         icon: "bell.badge", title: "STAY ON TRACK",
                         body_: "Workout reminders, analysis results and streak alerts — never spam.",
                         finish: { app.onboardingComplete = true })
    }
}
