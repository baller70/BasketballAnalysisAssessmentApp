import SwiftUI
import UIKit

// Player card & elite comparison flow — screens 048-053. Shooter data comes
// from the shared /api/shooters endpoint. Elite shooter photos are neutral
// gray placeholder rectangles (no raster assets ship with the app).

/// TopBar whose settings gear actually opens the Settings hub.
fileprivate struct EliteTopBar: View {
    @State private var showSettings = false
    var body: some View {
        TopBar(onSettings: { showSettings = true })
            .navigationDestination(isPresented: $showSettings) { SettingsHubView() }
    }
}

/// Lightweight payload for this flow's info alerts.
fileprivate struct EliteInfoNote: Identifiable {
    let id = UUID()
    let title: String
    let message: String
}

fileprivate extension View {
    func eliteInfoAlert(_ note: Binding<EliteInfoNote?>) -> some View {
        alert(note.wrappedValue?.title ?? "",
              isPresented: Binding(get: { note.wrappedValue != nil },
                                   set: { if !$0 { note.wrappedValue = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(note.wrappedValue?.message ?? "")
        }
    }
}

/// Compact, self-contained card used for ImageRenderer exports ("Download card" /
/// "Save card"). Mirrors the canonical card banner + score + session stats.
fileprivate struct PlayerCardExportView: View {
    var name: String
    var accent: Color = ShotIQColor.shotiqOrange
    var jersey: Int? = nil
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("SHOTIQ").font(.system(size: 17, weight: .black).width(.condensed))
                Spacer()
                if let jersey {
                    Text("#\(jersey)").font(.custom("Tungsten-Semibold", size: 18))
                }
                Text("AI ANALYSIS").font(.system(size: 12, weight: .semibold)).kerning(3)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 16).frame(height: 44)
            .background(accent)
            VStack(alignment: .leading, spacing: 10) {
                Text(name.uppercased()).shotiqDisplay(34)
                Text("RIGHT-HANDED • ADVANCED").font(.system(size: 11, weight: .medium)).kerning(0.6)
                    .foregroundStyle(ShotIQColor.graphite)
                HStack(alignment: .center, spacing: 16) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("FORM SCORE").font(.system(size: 10, weight: .semibold)).kerning(0.6)
                            .foregroundStyle(ShotIQColor.graphite)
                        Text("82").font(.custom("Tungsten-Semibold", size: 52)).foregroundStyle(accent)
                        ScoreBar(pct: 0.82, color: accent).frame(width: 96)
                    }
                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 56)
                    StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric)
                    StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric)
                    StatBlock(value: "62.5%", label: "MAKE %", valueSize: ShotIQType.numeric)
                }
                PhaseStrip()
            }
            .padding(16)
        }
        .frame(width: 380)
        .background(ShotIQColor.paper)
    }
}

struct PlayerCardView: View {       // 048
    @EnvironmentObject var app: AppState
    @State private var cardImage: Image?
    private var playerName: String { app.user?.displayName ?? "Jordan Ellis" }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-player-card") {
            VStack(spacing: 0) {
                HStack {
                    Spacer().frame(width: 52)
                    Spacer()
                    Wordmark(size: 30)
                    Spacer()
                    HStack(spacing: 18) {
                        NavigationLink { EliteMatchView() } label: {
                            Image(systemName: "point.3.connected.trianglepath.dotted").font(.system(size: 17))
                        }
                        .buttonStyle(.plain)
                        downloadControl {
                            Image(systemName: "arrow.down.to.line").font(.system(size: 17))
                        }
                    }
                    .foregroundStyle(ShotIQColor.ink)
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 18) {
                            RoundedRectangle(cornerRadius: 12).fill(ShotIQColor.rule)
                                .frame(width: 132, height: 150)
                                .overlay(Text(shotiqInitials(app.user))
                                    .font(.system(size: 34, weight: .bold)).foregroundStyle(ShotIQColor.graphite))
                            VStack(alignment: .leading, spacing: 4) {
                                Text((app.user?.displayName ?? "Jordan Ellis").uppercased()).shotiqDisplay(36)
                                Text("Right-handed • Advanced").font(.system(size: 14))
                                    .foregroundStyle(ShotIQColor.graphite)
                                HStack(spacing: 0) {
                                    HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                                        .frame(maxWidth: .infinity)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                    HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                        .frame(maxWidth: .infinity)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                    HeaderStat(icon: "viewfinder", value: "24", label: "SHOTS TODAY")
                                        .frame(maxWidth: .infinity)
                                }
                                .padding(.top, 12)
                            }
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            HStack(alignment: .center, spacing: 16) {
                                Text("FORM SCORE").font(.system(size: 12, weight: .semibold)).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.ink)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("82").font(.custom("Tungsten-Semibold", size: 58))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: 0.82).frame(width: 110)
                                }
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("GOOD").font(.custom("Tungsten-Semibold", size: 17))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("Keep building\nconsistency.").font(.system(size: 12))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 56)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("62.5%").font(.custom("Tungsten-Semibold", size: 26))
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text("MAKE %").font(.system(size: 10, weight: .medium)).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("15 / 24").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(16)
                        }
                        .padding(.top, 16)
                        HStack(alignment: .top, spacing: 0) {
                            archetypeCol("ARCHETYPE", "point.3.connected.trianglepath.dotted",
                                         "Balanced Shooter", "Smooth, repeatable, and well-aligned mechanics.")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                            archetypeCol("PRIMARY TARGET", "figure.basketball",
                                         "Keep elbow stacked through release", "Maintain vertical alignment for a cleaner release.")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                            archetypeCol("LATEST BADGE", "hexagon",
                                         "Release Control", "Consistent release height and timing.")
                        }
                        .padding(.vertical, 6)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        .padding(.top, 18)
                        SectionLabel(text: "MEASUREMENTS").padding(.top, 18)
                        HStack(spacing: 0) {
                            measureCol("HEIGHT", "6'3\"", "190 cm")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 54)
                            measureCol("WINGSPAN", "6'6\"", "198 cm")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 54)
                            measureCol("SHOOTING REACH", "8'2\"", "249 cm")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 54)
                            measureCol("STANDING REACH", "8'0\"", "244 cm")
                        }
                        .padding(.top, 8)
                        HStack(spacing: 6) {
                            SectionLabel(text: "SHOT BREAKDOWN")
                            Text("(TODAY)").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 18)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -9), alignment: .top)
                        HStack(spacing: 0) {
                            StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .leading)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                            StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                            StatBlock(value: "62.5%", label: "MAKE %", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40)
                            VStack(spacing: 3) {
                                TrendLine(points: [58, 66, 61, 70]).frame(width: 84, height: 24)
                                HStack(spacing: 3) {
                                    Text("+8.1%").font(.system(size: 11, weight: .bold)).foregroundStyle(ShotIQColor.confirmGreen)
                                    Text("vs last session").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "MECHANICS OVERVIEW").padding(.top, 18)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -9), alignment: .top)
                        HStack(alignment: .top) {
                            phaseScore("SETUP", "84", ShotIQColor.confirmGreen, false)
                            phaseScore("LOAD", "78", ShotIQColor.analysisBlue, false)
                            phaseScore("RISE", "81", ShotIQColor.analysisBlue, false)
                            phaseScore("RELEASE", "78", ShotIQColor.shotiqOrange, true)
                            phaseScore("FOLLOW-THROUGH", "88", ShotIQColor.confirmGreen, false)
                        }
                        .padding(.top, 8)
                        HStack(spacing: 12) {
                            NavigationLink { CustomizePlayerCardView() } label: {
                                VStack(spacing: 8) {
                                    Image(systemName: "viewfinder").font(.system(size: 20))
                                    Text("Customize card").font(.system(size: 14, weight: .semibold))
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 84)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            .buttonStyle(.plain)
                            .accessibilityIdentifier("Customize card")
                            NavigationLink { ShareResultsView() } label: {
                                VStack(spacing: 8) {
                                    Image(systemName: "point.3.connected.trianglepath.dotted").font(.system(size: 20))
                                    Text("Share card").font(.system(size: 14))
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 84)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            downloadControl {
                                VStack(spacing: 8) {
                                    Image(systemName: "arrow.down.to.line").font(.system(size: 20))
                                    Text("Download card").font(.system(size: 14))
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 84)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                        }
                        .padding(.top, 18)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .onAppear { renderCard() }
    }
    /// Renders the export card once, then serves it through ShareLink (the share
    /// sheet's "Save Image" covers photo-library saving without an Info.plist key).
    @ViewBuilder
    private func downloadControl<Label: View>(@ViewBuilder label: () -> Label) -> some View {
        if let cardImage {
            ShareLink(item: cardImage,
                      preview: SharePreview("ShotIQ Player Card", image: cardImage)) {
                label()
            }
            .buttonStyle(.plain)
        } else {
            Button { renderCard() } label: { label() }
                .buttonStyle(.plain)
        }
    }
    private func renderCard() {
        guard cardImage == nil else { return }
        let renderer = ImageRenderer(content: PlayerCardExportView(name: playerName))
        renderer.scale = 3
        if let ui = renderer.uiImage { cardImage = Image(uiImage: ui) }
    }
    private func archetypeCol(_ label: String, _ icon: String, _ title: String, _ caption: String) -> some View {
        VStack(spacing: 8) {
            Text(label).font(.system(size: 11, weight: .semibold)).kerning(0.7)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Image(systemName: icon).font(.system(size: 34, weight: .light)).foregroundStyle(ShotIQColor.ink)
                .frame(height: 44)
            Text(title).font(.system(size: 14, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
                .lineLimit(2).minimumScaleFactor(0.7)
            Text(caption).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                .multilineTextAlignment(.center)
                .lineLimit(3).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14).padding(.horizontal, 6)
    }
    private func measureCol(_ label: String, _ value: String, _ metric: String) -> some View {
        VStack(spacing: 3) {
            Text(label).font(.system(size: 10, weight: .medium)).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(value).font(.custom("Tungsten-Semibold", size: 30)).foregroundStyle(ShotIQColor.ink)
            Text(metric).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func phaseScore(_ phase: String, _ score: String, _ tint: Color, _ active: Bool) -> some View {
        VStack(spacing: 4) {
            PhaseGlyph(phase: phase, active: active, size: 28)
            Text(phase).font(.system(size: 8, weight: active ? .bold : .regular)).kerning(0.4)
                .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(score).font(.custom("Tungsten-Semibold", size: 20)).foregroundStyle(tint)
            if active {
                Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 40, height: 3)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct CustomizePlayerCardView: View { // 049
    @Environment(\.dismiss) private var dismiss
    @State private var savedImage: Image?
    @State private var showSaveSheet = false
    @State private var layoutInfo: EliteInfoNote?
    @State private var accent = "Orange"
    @State private var layout = "Classic"
    @State private var showTrend = true
    @State private var jersey = 24
    @State private var firstName = "Jordan"
    @State private var lastName = "Ellis"
    private let banners: [(String, Color)] = [
        ("Orange", ShotIQColor.shotiqOrange), ("Blue", ShotIQColor.analysisBlue),
        ("Green", ShotIQColor.confirmGreen), ("Red", ShotIQColor.reviewRed),
        ("Ink", ShotIQColor.graphite),
    ]
    private var bannerColor: Color {
        banners.first(where: { $0.0 == accent })?.1 ?? ShotIQColor.shotiqOrange
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-customize-player-card") {
            VStack(spacing: 0) {
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "chevron.left").font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                    Text("CUSTOMIZE PLAYER CARD").shotiqDisplay(20)
                    Spacer()
                    Button { dismiss() } label: {
                        Text("Cancel").font(.system(size: 15)).foregroundStyle(ShotIQColor.shotiqOrange)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("LIVE PREVIEW").font(.system(size: 14, weight: .heavy).width(.condensed)).kerning(0.5)
                            .foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 16)
                        // Live card preview
                        VStack(spacing: 0) {
                            HStack {
                                Text("SHOTIQ").font(.system(size: 17, weight: .black).width(.condensed))
                                Spacer()
                                Text("AI ANALYSIS").font(.system(size: 12, weight: .semibold)).kerning(3)
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 16).frame(height: 44)
                            .background(bannerColor)
                            VStack(alignment: .leading, spacing: 0) {
                                HStack(alignment: .top) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("\(firstName)\n\(lastName)".uppercased()).shotiqDisplay(34)
                                        Text("RIGHT-HANDED • ADVANCED").font(.system(size: 11, weight: .medium)).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                    HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                    HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                                }
                                HStack(alignment: .top, spacing: 14) {
                                    // Canonical card frame — the pose overlay is already
                                    // burned into the crop.
                                    CanonicalPhoto("049-visual-001", height: 250, cornerRadius: 4)
                                        .frame(maxWidth: .infinity)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("FORM SCORE").font(.system(size: 10, weight: .semibold)).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("82").font(.custom("Tungsten-Semibold", size: 52))
                                            .foregroundStyle(bannerColor)
                                        ScoreBar(pct: 0.82, color: bannerColor).frame(width: 96)
                                        Text("GOOD").font(.custom("Tungsten-Semibold", size: 16))
                                            .foregroundStyle(ShotIQColor.analysisBlue).padding(.top, 4)
                                        Text("Keep elbow stacked\nthrough release.").font(.system(size: 11))
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.vertical, 8)
                                        HStack(spacing: 0) {
                                            StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric)
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 30)
                                            StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric)
                                                .frame(maxWidth: .infinity, alignment: .trailing)
                                        }
                                        StatBlock(value: "62.5%", label: "ACCURACY", valueSize: ShotIQType.numeric)
                                            .padding(.top, 4)
                                    }
                                    .frame(width: 130)
                                }
                                .padding(.top, 14)
                                PhaseStrip().padding(.top, 14)
                            }
                            .padding(14)
                        }
                        .background(ShotIQColor.paper)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
                        .padding(.top, 8)
                        Text("CUSTOMIZE DETAILS").font(.system(size: 14, weight: .heavy).width(.condensed)).kerning(0.5)
                            .foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 20)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                HStack {
                                    detailLabel("BANNER COLOR", "Set the accent color for your card.")
                                    Spacer()
                                    HStack(spacing: 12) {
                                        ForEach(banners, id: \.0) { name, color in
                                            Button { accent = name } label: {
                                                Circle().fill(color).frame(width: 26, height: 26)
                                                    .overlay(Circle().stroke(accent == name ? color : .clear, lineWidth: 2)
                                                        .padding(-4))
                                            }
                                            .buttonStyle(.plain)
                                        }
                                    }
                                }
                                .padding(14)
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                HStack {
                                    detailLabel("JERSEY NUMBER", "Display your number on the card.")
                                    Spacer()
                                    HStack(spacing: 0) {
                                        Button { jersey = max(0, jersey - 1) } label: {
                                            Image(systemName: "minus").font(.system(size: 13)).frame(width: 40, height: 38)
                                        }
                                        .buttonStyle(.plain)
                                        Text("\(jersey)").font(.custom("Tungsten-Semibold", size: 20))
                                            .frame(width: 40)
                                        Button { jersey += 1 } label: {
                                            Image(systemName: "plus").font(.system(size: 13)).frame(width: 40, height: 38)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                    .foregroundStyle(ShotIQColor.ink)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .padding(14)
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                HStack {
                                    detailLabel("FIRST NAME", "Shown on your player card.")
                                    Spacer()
                                    TextField("First name", text: $firstName)
                                        .multilineTextAlignment(.center)
                                        .font(.system(size: 15))
                                        .frame(width: 130, height: 40)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .padding(14)
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                HStack {
                                    detailLabel("LAST NAME", "Shown on your player card.")
                                    Spacer()
                                    TextField("Last name", text: $lastName)
                                        .multilineTextAlignment(.center)
                                        .font(.system(size: 15))
                                        .frame(width: 130, height: 40)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .padding(14)
                            }
                        }
                        .padding(.top, 8)
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("CARD LAYOUT").font(.system(size: 14, weight: .heavy).width(.condensed)).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("Your card layout is optimized for clarity and cannot be changed.")
                                    .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            Button {
                                layoutInfo = EliteInfoNote(title: "Card layout",
                                                           message: "ShotIQ cards use one fixed layout so every player card stays legible and instantly recognizable. Colors, names and jersey number are yours to customize.")
                            } label: {
                                Image(systemName: "info.circle").font(.system(size: 16)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 18)
                        PrimaryButton(title: "Save card") { saveCard() }.padding(.top, 18)
                        Button { dismiss() } label: {
                            Text("Cancel").font(.system(size: 16)).foregroundStyle(ShotIQColor.shotiqOrange)
                                .frame(maxWidth: .infinity).frame(height: 44)
                        }
                        .buttonStyle(.plain)
                        .padding(.top, 4)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .sheet(isPresented: $showSaveSheet) {
            VStack(spacing: 18) {
                Text("CARD SAVED").shotiqDisplay(26).padding(.top, 24)
                Text("Share it, or choose \u{201C}Save Image\u{201D} to add it to your photos.")
                    .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center)
                if let savedImage {
                    savedImage.resizable().scaledToFit()
                        .frame(maxHeight: 320)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
                    ShareLink(item: savedImage,
                              preview: SharePreview("ShotIQ Player Card", image: savedImage)) {
                        HStack(spacing: 10) {
                            Image(systemName: "square.and.arrow.up")
                            Text("Save or share image").font(.system(size: 17, weight: .medium))
                        }
                        .frame(maxWidth: .infinity).frame(height: 54)
                        .background(bannerColor, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                        .foregroundStyle(.white)
                    }
                }
                Spacer(minLength: 8)
            }
            .padding(.horizontal, 24)
            .presentationDetents([.medium, .large])
        }
        .eliteInfoAlert($layoutInfo)
    }
    /// Renders the customized card to a bitmap; ShareLink's sheet handles saving
    /// (no photo-library permission key ships in Info.plist).
    private func saveCard() {
        let renderer = ImageRenderer(content: PlayerCardExportView(
            name: "\(firstName) \(lastName)", accent: bannerColor, jersey: jersey))
        renderer.scale = 3
        if let ui = renderer.uiImage {
            savedImage = Image(uiImage: ui)
            showSaveSheet = true
        }
    }
    private func detailLabel(_ title: String, _ caption: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title).font(.system(size: 13, weight: .heavy).width(.condensed)).kerning(0.4)
                .foregroundStyle(ShotIQColor.ink)
            Text(caption).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
        }
    }
}

/// Small white-line pose overlay used inside the live card preview (049).
fileprivate struct SkeletonPreviewOverlay: View {
    var body: some View {
        Canvas { ctx, size in
            let pts: [CGPoint] = [
                .init(x: 0.45 * size.width, y: 0.88 * size.height),
                .init(x: 0.44 * size.width, y: 0.68 * size.height),
                .init(x: 0.5 * size.width, y: 0.5 * size.height),
                .init(x: 0.53 * size.width, y: 0.32 * size.height),
                .init(x: 0.62 * size.width, y: 0.22 * size.height),
                .init(x: 0.68 * size.width, y: 0.13 * size.height),
            ]
            var p = Path()
            p.move(to: pts[0])
            pts.dropFirst().forEach { p.addLine(to: $0) }
            ctx.stroke(p, with: .color(.white), style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
            for j in pts {
                ctx.stroke(Path(ellipseIn: CGRect(x: j.x - 4, y: j.y - 4, width: 8, height: 8)),
                           with: .color(ShotIQColor.shotiqOrange), lineWidth: 2)
            }
        }
        .accessibilityHidden(true)
    }
}

@MainActor
final class EliteViewModel: ObservableObject {
    @Published var shooters: [EliteShooterDTO] = []
    @Published var loading = true
    func load() async {
        defer { loading = false }
        // Test-only: one canned shooter so 052/053 have a row to open without
        // reaching /api/shooters.
        if UITestHooks.demoData {
            shooters = [EliteShooterDTO(id: 1, name: "Klay Thompson", team: "Warriors",
                                        league: "NBA", era: "Modern", tier: "Elite",
                                        position: "SG", height: 78, weight: 215,
                                        careerPct: 0.459, careerFreeThrowPct: 0.855,
                                        approvedFormImages: nil)]
            return
        }
        shooters = (try? await APIClient.shared.shooters()) ?? []
    }
}

struct EliteMatchView: View {       // 050
    @Environment(\.dismiss) private var dismiss
    @State private var showSettings = false
    @StateObject private var vm = EliteViewModel()
    private let comparisons: [(String, String, String, String, String, String)] = [
        // icon, name, unit, you, elite, diff
        ("figure.basketball", "Release Height", "inches", "78.2", "78.6", "0.4\""),
        ("angle", "Release Angle", "degrees", "52°", "51°", "1°"),
        ("point.3.connected.trianglepath.dotted", "Elbow Flexion", "degrees", "92°", "93°", "1°"),
        ("person.crop.rectangle", "Shot Pocket", "inches", "12.1\"", "12.4\"", "0.3\""),
        ("arrow.up.and.down", "Vertical Jump", "inches", "18.7\"", "19.1\"", "0.4\""),
        ("stopwatch", "Release Time", "sec", "0.52", "0.50", "0.02"),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-elite-match") {
            VStack(spacing: 0) {
                HStack {
                    Wordmark(size: 30)
                    Spacer()
                    HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                    Button { showSettings = true } label: {
                        Image(systemName: "gearshape").font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    .padding(.leading, 14)
                }
                .padding(.horizontal, 20).frame(height: 60)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 12) {
                            Button { dismiss() } label: {
                                Image(systemName: "arrow.left").font(.system(size: 20, weight: .semibold))
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .buttonStyle(.plain)
                            .padding(.top, 8)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("AI ANALYSIS 50 – ELITE MATCH").shotiqDisplay(32)
                                Text("Compare mechanics").font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 10) {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("JORDAN ELLIS").shotiqDisplay(22)
                                    Text("Right-handed • Advanced").font(.system(size: 11))
                                        .foregroundStyle(ShotIQColor.graphite)
                                    StatBlock(value: "82", label: "FORM SCORE", color: ShotIQColor.shotiqOrange, valueSize: ShotIQType.numeric)
                                        .padding(.top, 6)
                                    StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric)
                                    StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric)
                                    StatBlock(value: "62.5%", label: "SHOOTING %", valueSize: ShotIQType.numeric)
                                }
                                Spacer(minLength: 4)
                                VStack(spacing: 6) {
                                    Text("ELITE MATCH").font(.system(size: 12, weight: .bold)).kerning(0.8)
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text("89%").font(.custom("Tungsten-Semibold", size: 58))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("OVERALL\nSIMILARITY").font(.system(size: 10, weight: .medium)).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .multilineTextAlignment(.center)
                                    HStack(spacing: 3) {
                                        ForEach(0..<6, id: \.self) { i in
                                            Rectangle().fill(i < 5 ? ShotIQColor.analysisBlue : ShotIQColor.rule)
                                                .frame(width: 18, height: 6)
                                        }
                                    }
                                    Text("SHARED MECHANICS").font(.system(size: 9, weight: .bold)).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.ink).padding(.top, 4)
                                    Text("5 OF 6").font(.custom("Tungsten-Semibold", size: 18))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                }
                                Spacer(minLength: 4)
                                VStack(alignment: .trailing, spacing: 3) {
                                    Text((vm.shooters.first?.name ?? "Elite Guard").uppercased()).shotiqDisplay(22)
                                        .multilineTextAlignment(.trailing)
                                    Text(vm.shooters.first.map { "\($0.team) • \($0.position)" } ?? "Reference Profile")
                                        .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                    Text("94").font(.custom("Tungsten-Semibold", size: 28))
                                        .foregroundStyle(ShotIQColor.analysisBlue).padding(.top, 6)
                                    Text("FORM SCORE").font(.system(size: 10, weight: .medium)).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    // Elite reference shooter frame from the canonical render.
                                    CanonicalPhoto("050-visual-002", width: 88, height: 96, cornerRadius: 4)
                                        .padding(.top, 6)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 14)
                        if vm.loading && vm.shooters.isEmpty {
                            ProgressView().frame(maxWidth: .infinity).padding(.top, 8)
                        }
                        HStack(spacing: 12) {
                            if let top = vm.shooters.first {
                                NavigationLink { EliteShooterDetailView(shooter: top) } label: {
                                    actionRow("doc.text", "View elite profile")
                                }
                            } else {
                                // Shooters still loading — browsing the list is the next-best destination.
                                NavigationLink { EliteShootersView() } label: {
                                    actionRow("doc.text", "View elite profile")
                                }
                            }
                            NavigationLink { EliteShootersView() } label: {
                                actionRow("person.2", "Choose another shooter")
                            }
                        }
                        .padding(.top, 12)
                        HStack {
                            Text("MECHANICS COMPARISON").shotiqDisplay(20)
                            Spacer()
                            HStack(spacing: 12) {
                                legendDot(ShotIQColor.shotiqOrange, "You")
                                legendDot(ShotIQColor.analysisBlue, "Elite")
                            }
                        }
                        .padding(.top, 22)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -11), alignment: .top)
                        ForEach(comparisons, id: \.1) { icon, name, unit, you, elite, diff in
                            HStack(spacing: 10) {
                                Image(systemName: icon).font(.system(size: 18, weight: .light))
                                    .foregroundStyle(ShotIQColor.ink).frame(width: 30)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(name).font(.system(size: 14, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                    Text(unit).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(width: 96, alignment: .leading)
                                Text(you).font(.custom("Tungsten-Semibold", size: 17))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .frame(width: 38, alignment: .trailing)
                                GeometryReader { geo in
                                    ZStack(alignment: .leading) {
                                        Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                            .frame(maxHeight: .infinity)
                                        Capsule().fill(ShotIQColor.shotiqOrange)
                                            .frame(width: geo.size.width * 0.46, height: 4)
                                            .offset(y: -5)
                                        Capsule().fill(ShotIQColor.analysisBlue)
                                            .frame(width: geo.size.width * 0.3, height: 4)
                                            .offset(x: geo.size.width * 0.5, y: 5)
                                        Rectangle().fill(ShotIQColor.ink).frame(width: 2, height: 18)
                                            .offset(x: geo.size.width * 0.48)
                                    }
                                }
                                .frame(height: 24)
                                Text(elite).font(.custom("Tungsten-Semibold", size: 17))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                    .frame(width: 38, alignment: .leading)
                                VStack(spacing: 0) {
                                    Text(diff).font(.custom("Tungsten-Semibold", size: 16)).foregroundStyle(ShotIQColor.ink)
                                    Text("DIFF").font(.system(size: 8, weight: .medium)).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(width: 32)
                                Image(systemName: "checkmark.circle.fill").font(.system(size: 15))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                            }
                            .padding(.vertical, 10)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        }
                        HStack {
                            Text("RELEASE FRAME MATCH").shotiqDisplay(20)
                            Spacer()
                            Text("Average frame alignment").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            Text("±2°").font(.custom("Tungsten-Semibold", size: 16)).foregroundStyle(ShotIQColor.ink)
                            Image(systemName: "checkmark.circle.fill").font(.system(size: 14))
                                .foregroundStyle(ShotIQColor.confirmGreen)
                        }
                        .padding(.top, 18)
                        NavigationLink { PhotoComparisonView() } label: {
                            HStack(spacing: 4) {
                                ForEach(0..<7, id: \.self) { i in
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(ShotIQColor.rule)
                                        .frame(height: 64)
                                        .overlay(RoundedRectangle(cornerRadius: 4)
                                            .stroke(i == 3 ? ShotIQColor.shotiqOrange : .clear, lineWidth: 2))
                                }
                            }
                        }
                        .padding(.top, 8)
                        ShotIQCard {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("PRIMARY COACHING TARGET ALIGNMENT")
                                        .font(.system(size: 11, weight: .semibold)).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("Keep elbow stacked through release")
                                        .font(.system(size: 17, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 2) {
                                    HStack(spacing: 5) {
                                        Text("ON TRACK").font(.custom("Tungsten-Semibold", size: 18))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                        Image(systemName: "checkmark.circle.fill").font(.system(size: 14))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                    }
                                    Text("91% match").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 14)
                        HStack(alignment: .top, spacing: 8) {
                            Text("SHOT RAIL").font(.system(size: 11, weight: .bold)).kerning(0.7)
                                .foregroundStyle(ShotIQColor.ink).padding(.top, 8)
                            VStack(spacing: 2) {
                                PhaseStrip()
                                HStack {
                                    ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                                        Group {
                                            if p == "RELEASE" {
                                                Circle().fill(ShotIQColor.shotiqOrange).frame(width: 13, height: 13)
                                            } else if p == "FOLLOW-THROUGH" {
                                                Circle().fill(ShotIQColor.rule).frame(width: 13, height: 13)
                                            } else {
                                                Image(systemName: "checkmark.circle.fill").font(.system(size: 13))
                                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                            }
                                        }
                                        .frame(maxWidth: .infinity)
                                    }
                                }
                            }
                        }
                        .padding(.top, 16)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .task { await vm.load() }
        .navigationDestination(isPresented: $showSettings) { SettingsHubView() }
    }
    private func actionRow(_ icon: String, _ title: String) -> some View {
        HStack {
            Image(systemName: icon).font(.system(size: 15))
            Text(title).font(.system(size: 14))
                .lineLimit(1).minimumScaleFactor(0.7)
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
        }
        .foregroundStyle(ShotIQColor.ink)
        .padding(.horizontal, 12).frame(height: 50)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    private func legendDot(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 9, height: 9)
            Text(label).font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
        }
    }
}

struct PhotoComparisonView: View {  // 051
    @Environment(\.dismiss) private var dismiss
    @State private var phaseIndex = 3
    @State private var overlaySkeletons = false
    @State private var savedComparison = false
    @State private var synced = false
    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    private let rows: [(String, String, String, String, String, String)] = [
        // icon, label, sub, you, diff, elite
        ("point.3.connected.trianglepath.dotted", "ELBOW ANGLE", "at release", "162°", "12°", "174°"),
        ("arrow.up.to.line", "RELEASE HEIGHT", "from floor", "8' 11\"", "+2\"", "9' 1\""),
        ("arrow.left.and.right", "RELEASE DISTANCE", "from forehead", "9.3\"", "+0.7\"", "10.0\""),
        ("point.bottomleft.forward.to.point.topright.scurvepath", "SHOT ARC", "peak height", "74°", "+6°", "80°"),
        ("gauge.with.needle", "BALANCE", "centered at release", "92%", "+8%", "100%"),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-comparison") {
            VStack(spacing: 0) {
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "chevron.left").font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ShotIQColor.ink)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                    Text("COMPARE SHOOTERS").shotiqDisplay(22)
                    Spacer()
                    ShareLink(item: "Comparing my shot to an elite reference on ShotIQ — 82 vs 94 form score, release angle within 12°. 🏀") {
                        Image(systemName: "square.and.arrow.up").font(.system(size: 18)).foregroundStyle(ShotIQColor.ink)
                    }
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 10) {
                            Circle().fill(ShotIQColor.rule).frame(width: 52, height: 52)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("JORDAN ELLIS").shotiqDisplay(19)
                                Text("You • Right • Advanced").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                                Text("FORM SCORE").font(.system(size: 8, weight: .semibold)).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                                HStack(spacing: 6) {
                                    Text("82").font(.custom("Tungsten-Semibold", size: 24))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: 0.82).frame(width: 58)
                                }
                            }
                            Spacer(minLength: 2)
                            Text("VS").font(.system(size: 12, weight: .bold)).foregroundStyle(ShotIQColor.graphite)
                                .frame(width: 34, height: 34)
                                .overlay(Circle().stroke(ShotIQColor.rule))
                                .padding(.top, 8)
                            Spacer(minLength: 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("ELITE REFERENCE").shotiqDisplay(19)
                                Text("Pro • Right • Elite").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                                Text("FORM SCORE").font(.system(size: 8, weight: .semibold)).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                                HStack(spacing: 6) {
                                    Text("94").font(.custom("Tungsten-Semibold", size: 24))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    ScoreBar(pct: 0.94, color: ShotIQColor.analysisBlue).frame(width: 58)
                                }
                            }
                            Circle().fill(ShotIQColor.rule).frame(width: 52, height: 52)
                        }
                        .padding(.top, 14)
                        HStack(spacing: 0) {
                            StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .leading)
                            StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .leading)
                            StatBlock(value: "62.5%", label: "ACCURACY", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .leading)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                            StatBlock(value: "—", label: "SHOTS", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .center)
                            StatBlock(value: "—", label: "MAKES", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .center)
                            StatBlock(value: "—", label: "ACCURACY", valueSize: ShotIQType.numeric).frame(maxWidth: .infinity, alignment: .trailing)
                        }
                        .padding(.top, 10)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -5), alignment: .top)
                        HStack(spacing: 2) {
                            ZStack(alignment: .topLeading) {
                                ZStack {
                                    // Your canonical frame; its own pose overlay is baked in.
                                    CanonicalMediaSurface(key: "051-visual-003", height: 330)
                                    if overlaySkeletons {
                                        // Elite skeleton overlaid on your frame for direct comparison.
                                        SkeletonOverlay(boneColor: ShotIQColor.analysisBlue,
                                                        jointColor: ShotIQColor.analysisBlue)
                                            .opacity(0.75)
                                            .offset(x: 5)
                                    }
                                }
                                mediaTag(ShotIQColor.shotiqOrange, overlaySkeletons ? "YOU + ELITE" : "YOU")
                            }
                            ZStack(alignment: .topLeading) {
                                CanonicalMediaSurface(key: "051-visual-001", height: 330)
                                mediaTag(ShotIQColor.analysisBlue, "ELITE REFERENCE")
                            }
                        }
                        .padding(.top, 12)
                        PhaseStrip(active: phases[phaseIndex]).padding(.top, 14)
                        if synced && phaseIndex == 3 {
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill").font(.system(size: 13))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                Text("Release frames aligned — both shooters shown at RELEASE (±2°).")
                                    .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 8)
                        }
                        ForEach(rows, id: \.1) { icon, label, sub, you, diff, elite in
                            HStack(spacing: 8) {
                                Image(systemName: icon).font(.system(size: 17, weight: .light))
                                    .foregroundStyle(ShotIQColor.ink).frame(width: 28)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(label).font(.system(size: 12, weight: .bold)).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text(sub).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                }
                                .frame(width: 108, alignment: .leading)
                                Text(you).font(.custom("Tungsten-Semibold", size: 26))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                    .frame(maxWidth: .infinity)
                                VStack(spacing: 0) {
                                    Text(diff).font(.custom("Tungsten-Semibold", size: 17)).foregroundStyle(ShotIQColor.ink)
                                    Text("DIFFERENCE").font(.system(size: 7, weight: .medium)).kerning(0.4)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(width: 62)
                                Text(elite).font(.custom("Tungsten-Semibold", size: 26))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                    .frame(maxWidth: .infinity)
                            }
                            .padding(.vertical, 11)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        }
                        HStack(spacing: 10) {
                            Button { overlaySkeletons.toggle() } label: {
                                smallAction("figure.2", "Overlay skeletons", active: overlaySkeletons)
                            }
                            .buttonStyle(.plain)
                            Button {
                                withAnimation(.easeInOut(duration: 0.15)) {
                                    phaseIndex = (phaseIndex + 1) % phases.count
                                    if phaseIndex != 3 { synced = false }
                                }
                            } label: {
                                smallAction("arrow.left.and.right", "Phase: \(phases[phaseIndex].capitalized)")
                            }
                            .buttonStyle(.plain)
                            Button { savedComparison.toggle() } label: {
                                smallAction(savedComparison ? "bookmark.fill" : "bookmark",
                                            savedComparison ? "Saved" : "Save comparison",
                                            active: savedComparison)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 14)
                        PrimaryButton(title: synced && phaseIndex == 3 ? "Release frames synced" : "Sync release frames",
                                      icon: synced && phaseIndex == 3 ? "checkmark" : "arrow.2.circlepath") {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                phaseIndex = 3
                                synced = true
                            }
                        }
                        .padding(.top, 12)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func mediaTag(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label).font(.system(size: 11, weight: .bold)).kerning(0.5).foregroundStyle(.white)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .padding(.horizontal, 10).padding(.vertical, 6)
        .background(.black.opacity(0.45), in: Capsule())
        .padding(8)
    }
    private func smallAction(_ icon: String, _ label: String, active: Bool = false) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 13))
            Text(label).font(.system(size: 12))
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
        .frame(maxWidth: .infinity).frame(height: 46)
        .overlay(RoundedRectangle(cornerRadius: 8)
            .stroke(active ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
    }
}

struct EliteShootersView: View {    // 052
    /// Canonical list-row crops, in the top-to-bottom order they appear on the
    /// 853x1844 render. The fifth row is cut off there, so it has no crop.
    private static let cardPhotoKeys = [
        "052-visual-001", "052-visual-002", "052-visual-004", "052-visual-003",
    ]
    @StateObject private var vm = EliteViewModel()
    @State private var query = ""
    @State private var level = "All Levels"
    @State private var position = "All Positions"
    @State private var shotType = "All Shot Types"
    @State private var league = "More Filters"
    @State private var sortKey = "WSI"
    @State private var showFilters = true
    @State private var info: EliteInfoNote?
    private var levelOptions: [String] {
        ["All Levels"] + Array(Set(vm.shooters.compactMap { $0.tier })).sorted()
    }
    private var positionOptions: [String] {
        ["All Positions"] + Array(Set(vm.shooters.map { $0.position })).sorted()
    }
    private var leagueOptions: [String] {
        ["More Filters"] + Array(Set(vm.shooters.map { $0.league })).sorted()
    }
    var filtered: [EliteShooterDTO] {
        var out = vm.shooters
        if !query.isEmpty { out = out.filter { $0.name.localizedCaseInsensitiveContains(query) } }
        if level != "All Levels" { out = out.filter { $0.tier == level } }
        if position != "All Positions" { out = out.filter { $0.position == position } }
        if league != "More Filters" { out = out.filter { $0.league == league } }
        switch sortKey {
        case "FG%": out.sort { ($0.careerPct ?? 0) > ($1.careerPct ?? 0) }
        case "Name": out.sort { $0.name < $1.name }
        default: break // WSI — canonical server order
        }
        return out
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-elite-shooters") {
            VStack(spacing: 0) {
                EliteTopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("ELITE SHOOTERS").shotiqDisplay(40).padding(.top, 18)
                        Text("Study the world's best. Compare forms. Elevate your game.")
                            .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                        HStack(spacing: 12) {
                            HStack(spacing: 10) {
                                Image(systemName: "magnifyingglass").font(.system(size: 16))
                                    .foregroundStyle(ShotIQColor.graphite)
                                TextField("Search elite shooters...", text: $query)
                                    .font(.system(size: 15))
                            }
                            .padding(.horizontal, 14).frame(height: 50)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            Button { withAnimation(.easeInOut(duration: 0.15)) { showFilters.toggle() } } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "slider.horizontal.3").font(.system(size: 15))
                                    Text("Filter").font(.system(size: 14))
                                }
                                .foregroundStyle(showFilters ? ShotIQColor.ink : ShotIQColor.shotiqOrange)
                                .padding(.horizontal, 14).frame(height: 50)
                                .overlay(RoundedRectangle(cornerRadius: 8)
                                    .stroke(showFilters ? ShotIQColor.rule : ShotIQColor.shotiqOrange))
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 14)
                        if showFilters {
                            HStack(spacing: 8) {
                                filterChip($level, options: levelOptions, defaultLabel: "All Levels")
                                filterChip($position, options: positionOptions, defaultLabel: "All Positions")
                                filterChip($shotType,
                                           options: ["All Shot Types", "Catch & Shoot", "Pull-Up", "Off Dribble"],
                                           defaultLabel: "All Shot Types")
                                filterChip($league, options: leagueOptions, defaultLabel: "More Filters")
                            }
                            .padding(.top, 10)
                        }
                        HStack {
                            Menu {
                                ForEach(["WSI", "FG%", "Name"], id: \.self) { k in
                                    Button(k) { sortKey = k }
                                }
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "arrow.up.arrow.down").font(.system(size: 14))
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text("Sort: \(sortKey)").font(.system(size: 14, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    Image(systemName: "chevron.down").font(.system(size: 10, weight: .semibold))
                                        .foregroundStyle(ShotIQColor.ink)
                                }
                            }
                            Spacer()
                            Button {
                                info = EliteInfoNote(title: "What is WSI?",
                                                     message: "The Weighted Shooting Index blends career shooting efficiency, mechanics quality and consistency into a single 0–100 score so shooters across eras and leagues can be ranked side by side.")
                            } label: {
                                HStack(spacing: 5) {
                                    Text("What is WSI?").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                    Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, 14)
                        if vm.loading && vm.shooters.isEmpty {
                            ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                        }
                        ForEach(Array(filtered.enumerated()), id: \.element.id) { i, s in
                            NavigationLink { EliteShooterDetailView(shooter: s) } label: {
                                shooterCard(s, rank: i)
                            }
                            .padding(.top, 12)
                        }
                        HStack(spacing: 12) {
                            Image(systemName: "point.3.connected.trianglepath.dotted")
                                .font(.system(size: 24, weight: .light)).foregroundStyle(ShotIQColor.ink)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Compare your form to any elite shooter.")
                                    .font(.system(size: 14, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                                Text("Upload a shot to see your Form Similarity.")
                                    .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            Spacer()
                            NavigationLink { AnalyzeHubView() } label: {
                                HStack(spacing: 7) {
                                    Image(systemName: "viewfinder").font(.system(size: 13))
                                    Text("Analyze shot").font(.system(size: 13, weight: .semibold))
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 14).padding(.vertical, 11)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            }
                        }
                        .padding(12)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 14)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .task { await vm.load() }
        .eliteInfoAlert($info)
    }
    private func filterChip(_ selection: Binding<String>, options: [String], defaultLabel: String) -> some View {
        Menu {
            ForEach(options, id: \.self) { o in
                Button(o) { selection.wrappedValue = o }
            }
        } label: {
            HStack(spacing: 6) {
                Text(selection.wrappedValue).font(.system(size: 12))
                    .foregroundStyle(selection.wrappedValue == defaultLabel ? ShotIQColor.ink : ShotIQColor.shotiqOrange)
                    .lineLimit(1).minimumScaleFactor(0.6)
                Image(systemName: "chevron.down").font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(ShotIQColor.graphite)
            }
            .frame(maxWidth: .infinity).frame(height: 42)
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(selection.wrappedValue == defaultLabel ? ShotIQColor.rule : ShotIQColor.shotiqOrange))
        }
    }
    private func shooterCard(_ s: EliteShooterDTO, rank: Int) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 14) {
                if rank < Self.cardPhotoKeys.count {
                    // Canonical shooter frame for this row of the list.
                    CanonicalPhoto(Self.cardPhotoKeys[rank], width: 104, height: 148, cornerRadius: 4)
                } else {
                    // Beyond the canonical rows no crop exists — neutral gray keeps the layout.
                    RoundedRectangle(cornerRadius: 4).fill(ShotIQColor.rule)
                        .frame(width: 104, height: 148)
                        .overlay(Text(String(s.name.prefix(1)))
                            .font(.system(size: 28, weight: .bold)).foregroundStyle(ShotIQColor.graphite))
                }
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top, spacing: 8) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(s.name.uppercased()).shotiqDisplay(20)
                            Text("Right-handed • \(s.position)").font(.system(size: 12))
                                .foregroundStyle(ShotIQColor.graphite)
                                .lineLimit(1).minimumScaleFactor(0.7)
                            Text(s.team).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                .lineLimit(1).minimumScaleFactor(0.7)
                            Text(s.league).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer()
                        HStack(spacing: 0) {
                            VStack(spacing: 3) {
                                Text("FG%").font(.system(size: 9, weight: .medium)).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text(s.careerPct.map { String(format: "%.1f%%", $0) } ?? "—")
                                    .font(.custom("Tungsten-Semibold", size: 22)).foregroundStyle(ShotIQColor.ink)
                            }
                            .frame(width: 58)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            VStack(spacing: 3) {
                                Text("WSI").font(.system(size: 9, weight: .medium)).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                Text("\(max(70, 94 - rank * 2))")
                                    .font(.custom("Tungsten-Semibold", size: 22)).foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                            .frame(width: 44)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            VStack(spacing: 3) {
                                Text("SIMILARITY").font(.system(size: 9, weight: .medium)).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("\(max(60, 91 - rank * 3))%")
                                    .font(.custom("Tungsten-Semibold", size: 22)).foregroundStyle(ShotIQColor.analysisBlue)
                            }
                            .frame(width: 62)
                        }
                    }
                    Spacer(minLength: 8)
                    HStack(alignment: .bottom) {
                        PhaseStrip()
                            .scaleEffect(0.7, anchor: .bottomLeading)
                            .frame(width: 210, height: 42, alignment: .bottomLeading)
                            .clipped()
                        Spacer()
                        HStack(spacing: 4) {
                            Text("View shooter").font(.system(size: 13, weight: .semibold))
                            Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold))
                        }
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                    }
                }
            }
            .padding(12)
        }
    }
}

struct EliteShooterDetailView: View { // 053
    var shooter: EliteShooterDTO
    @Environment(\.dismiss) private var dismiss
    @State private var tab = "OVERVIEW"
    @State private var savedReference = false
    @State private var info: EliteInfoNote?
    private let tabs = ["OVERVIEW", "MECHANICS", "STRENGTHS", "WEAKNESSES", "REFERENCE"]
    private let strengths = ["Quick, repeatable release", "High shooting arc", "Consistent base and balance"]
    private let weaknesses = ["Slight elbow flare in load", "Lower body under-utilized", "Off dribble rhythm"]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-elite-shooter-detail") {
            VStack(spacing: 0) {
                EliteTopBar()
                ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 0) {
                            VStack(alignment: .leading, spacing: 0) {
                                Button { dismiss() } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
                                        Text("ELITE SHOOTERS").font(.system(size: 12, weight: .semibold)).kerning(0.8)
                                    }
                                    .foregroundStyle(ShotIQColor.graphite)
                                }
                                .buttonStyle(.plain)
                                .padding(.top, 14)
                                Text(shooter.name.uppercased()).shotiqDisplay(36).padding(.top, 12)
                                Text("Right-handed  •  \(shooter.position)").font(.system(size: 14))
                                    .foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                                Text("\(shooter.team)  •  \(shooter.league)").font(.system(size: 14))
                                    .foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.vertical, 12)
                                HStack(alignment: .top, spacing: 12) {
                                    PhaseGlyph(active: true, size: 40)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("ELITE REFERENCE").shotiqDisplay(17)
                                        Text("\(shooter.tier ?? "Elite") \(shooter.era ?? "era") shooter.\nQuick, repeatable release.")
                                            .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                            }
                            .padding(.leading, 20)
                            Spacer(minLength: 10)
                            // Canonical reference-shooter frame; pose overlay is baked in.
                            CanonicalPhoto("053-visual-001", width: 170, height: 210, cornerRadius: 0)
                        }
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 26) {
                                ForEach(tabs, id: \.self) { t in
                                    Button {
                                        tab = t
                                        withAnimation(.easeInOut(duration: 0.25)) {
                                            proxy.scrollTo(anchorID(for: t), anchor: .top)
                                        }
                                    } label: {
                                        VStack(spacing: 8) {
                                            Text(t).font(.system(size: 13, weight: tab == t ? .bold : .semibold)).kerning(0.6)
                                                .foregroundStyle(tab == t ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                            Rectangle().fill(tab == t ? ShotIQColor.shotiqOrange : .clear).frame(height: 3)
                                        }
                                        .fixedSize()
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal, 20)
                        }
                        .padding(.top, 14)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("CAREER SHOOTING SUMMARY").shotiqDisplay(22)
                                    Text("24 Shots Analyzed").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Button {
                                    let fg = shooter.careerPct.map { String(format: "%.1f%%", $0) } ?? "—"
                                    info = EliteInfoNote(
                                        title: shooter.name,
                                        message: "\(shooter.position) • \(shooter.team) (\(shooter.league)). \(shooter.tier ?? "Elite") \(shooter.era ?? "era") shooter standing \(shooter.height / 12)'\(shooter.height % 12)\" at \(shooter.weight) lb, with a \(fg) career field-goal percentage and \(String(format: "%.1f%%", shooter.careerFreeThrowPct)) from the line.")
                                } label: {
                                    HStack(spacing: 3) {
                                        Text("View bio").font(.system(size: 14)).foregroundStyle(ShotIQColor.shotiqOrange)
                                        Image(systemName: "chevron.right").font(.system(size: 11))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.top, 18)
                            .id("section-OVERVIEW")
                            HStack(alignment: .top, spacing: 12) {
                                ShotIQCard {
                                    HStack(spacing: 0) {
                                        summaryStat("FG%", shooter.careerPct.map { String(format: "%.1f%%", $0) } ?? "—")
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 38)
                                        summaryStat("FT%", String(format: "%.1f%%", shooter.careerFreeThrowPct))
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 38)
                                        summaryStat("HEIGHT", "\(shooter.height / 12)'\(shooter.height % 12)\"")
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 38)
                                        summaryStat("WEIGHT", "\(shooter.weight) lb")
                                    }
                                    .padding(.vertical, 14)
                                }
                                ShotIQCard {
                                    VStack(spacing: 3) {
                                        Text("WSI TIER").font(.system(size: 10, weight: .medium)).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("53").font(.custom("Tungsten-Semibold", size: 34))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        Text((shooter.tier ?? "ELITE").uppercased())
                                            .font(.system(size: 10, weight: .medium)).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                    .padding(.vertical, 12).padding(.horizontal, 16)
                                }
                            }
                            .padding(.top, 12)
                            Text("FORM SCORE").shotiqDisplay(20).padding(.top, 22)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -11), alignment: .top)
                            HStack(alignment: .top, spacing: 20) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("82").font(.custom("Tungsten-Semibold", size: 54))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Text("GOOD").font(.custom("Tungsten-Semibold", size: 17))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("High-level, repeatable form.").font(.system(size: 12))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                VStack(spacing: 4) {
                                    ScoreBar(pct: 0.82).padding(.top, 22)
                                    HStack {
                                        ForEach(["0", "25", "50", "75", "100"], id: \.self) { t in
                                            Text(t).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                            if t != "100" { Spacer() }
                                        }
                                    }
                                }
                            }
                            .padding(.top, 6)
                            HStack {
                                Text("SHOT BREAKDOWN (CAREER)").shotiqDisplay(20)
                                Spacer()
                                Text("100% = 24 SHOTS").font(.system(size: 11, weight: .medium)).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 22)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -11), alignment: .top)
                            HStack(spacing: 0) {
                                breakdownCol("Catch & Shoot", "62.5%", "15 SHOTS")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 58)
                                breakdownCol("Pull-Up", "20.8%", "5 SHOTS")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 58)
                                breakdownCol("Off Dribble", "12.5%", "3 SHOTS")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 58)
                                breakdownCol("Other", "4.2%", "1 SHOT")
                            }
                            .padding(.top, 8)
                            Text("MECHANICS SNAPSHOT").shotiqDisplay(20).padding(.top, 22)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1).offset(y: -11), alignment: .top)
                                .id("section-MECHANICS")
                            HStack(spacing: 0) {
                                snapshotCol("Elbow Angle", "89°")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                snapshotCol("Release Height", "7'1\"")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                snapshotCol("Release Angle", "51°")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                snapshotCol("Backspin", "3,200 RPM")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 44)
                                snapshotCol("Balance", "88%")
                            }
                            .padding(.top, 8)
                            HStack(alignment: .top, spacing: 24) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("STRENGTHS").shotiqDisplay(18).id("section-STRENGTHS")
                                    ForEach(strengths, id: \.self) { s in
                                        HStack(spacing: 8) {
                                            Image(systemName: "checkmark.circle").font(.system(size: 14))
                                                .foregroundStyle(ShotIQColor.confirmGreen)
                                            Text(s).font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.7)
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("WEAKNESSES").shotiqDisplay(18)
                                    ForEach(weaknesses, id: \.self) { w in
                                        HStack(spacing: 8) {
                                            Image(systemName: "minus.circle").font(.system(size: 14))
                                                .foregroundStyle(ShotIQColor.reviewRed)
                                            Text(w).font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.7)
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(.top, 20)
                            Text("REFERENCE FORM FRAMES").shotiqDisplay(20).padding(.top, 22)
                                .id("section-REFERENCE")
                            HStack(spacing: 8) {
                                ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                                    VStack(spacing: 6) {
                                        RoundedRectangle(cornerRadius: 4).fill(ShotIQColor.rule)
                                            .frame(height: 96)
                                            .overlay(SkeletonOverlay().opacity(0.7))
                                        Text(p).font(.system(size: 8, weight: p == "RELEASE" ? .bold : .regular)).kerning(0.3)
                                            .foregroundStyle(p == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                            .lineLimit(1).minimumScaleFactor(0.6)
                                        if p == "RELEASE" {
                                            Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 34, height: 2)
                                        }
                                    }
                                    .frame(maxWidth: .infinity)
                                }
                            }
                            .padding(.top, 8)
                            HStack(spacing: 10) {
                                NavigationLink { PhotoComparisonView() } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: "magnifyingglass")
                                        Text("Compare with my shot").font(.system(size: 15, weight: .medium))
                                            .lineLimit(1).minimumScaleFactor(0.7)
                                    }
                                    .frame(maxWidth: .infinity).frame(height: 52)
                                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                                    .foregroundStyle(.white)
                                }
                                Button { savedReference.toggle() } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: savedReference ? "bookmark.fill" : "bookmark")
                                        Text(savedReference ? "Saved" : "Save reference").font(.system(size: 14))
                                            .lineLimit(1).minimumScaleFactor(0.7)
                                    }
                                    .foregroundStyle(savedReference ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                    .padding(.horizontal, 16).frame(height: 52)
                                    .overlay(RoundedRectangle(cornerRadius: 6)
                                        .stroke(savedReference ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                                }
                                .buttonStyle(.plain)
                                ShareLink(item: "Studying \(shooter.name)'s shooting form on ShotIQ — \(shooter.careerPct.map { String(format: "%.1f%%", $0) } ?? "elite") career FG. 🏀") {
                                    Image(systemName: "square.and.arrow.up").font(.system(size: 17))
                                        .foregroundStyle(ShotIQColor.ink)
                                        .frame(width: 52, height: 52)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                            }
                            .padding(.top, 18)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
                }
            }
        }
        .eliteInfoAlert($info)
    }
    /// Strengths and weaknesses share one row, so both tabs land on the same anchor.
    private func anchorID(for tab: String) -> String {
        tab == "WEAKNESSES" ? "section-STRENGTHS" : "section-\(tab)"
    }
    private func summaryStat(_ label: String, _ value: String) -> some View {
        VStack(spacing: 3) {
            Text(label).font(.system(size: 10, weight: .medium)).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(value).font(.custom("Tungsten-Semibold", size: 24)).foregroundStyle(ShotIQColor.ink)
        }
        .frame(maxWidth: .infinity)
    }
    private func breakdownCol(_ label: String, _ pct: String, _ shots: String) -> some View {
        VStack(spacing: 4) {
            MechanicGlyph(kind: .init(metricLabel: label), size: 26)
                .foregroundStyle(ShotIQColor.ink)
            Text(label).font(.system(size: 11)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(pct).font(.custom("Tungsten-Semibold", size: 24)).foregroundStyle(ShotIQColor.ink)
            Text(shots).font(.system(size: 9, weight: .medium)).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
    private func snapshotCol(_ label: String, _ value: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: "figure.basketball").font(.system(size: 18, weight: .light))
                .foregroundStyle(ShotIQColor.ink)
            Text(label).font(.system(size: 9)).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(value).font(.custom("Tungsten-Semibold", size: 17)).foregroundStyle(ShotIQColor.confirmGreen)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity)
    }
}
