import SwiftUI

// Player card & elite comparison flow — screens 048-053. Shooter data comes
// from the shared /api/shooters endpoint.

struct PlayerCardView: View {       // 048
    var body: some View {
        CanonicalScreen(testID: "screen-ios-player-card") {
            ScrollView {
                VStack(spacing: 0) {
                    Text("PLAYER CARD").shotiqDisplay(38).padding(.top, 24)
                    ShotIQCard {
                        VStack(spacing: 12) {
                            Circle().fill(ShotIQColor.rule).frame(width: 88, height: 88)
                                .overlay(Text("JE").font(.system(size: 26, weight: .bold)).foregroundStyle(ShotIQColor.graphite))
                            Text("JORDAN ELLIS").shotiqDisplay(30)
                            Text("Guard · Right Hand · Advanced").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            HStack(spacing: 26) {
                                StatBlock(value: "82", label: "FORM", color: ShotIQColor.shotiqOrange, valueSize: 34)
                                StatBlock(value: "62.5%", label: "MAKE %", valueSize: 34)
                                StatBlock(value: "37", label: "ANALYSES", valueSize: 34)
                            }
                            TrendLine(points: [72, 75, 74, 78, 80, 82]).frame(height: 44).padding(.horizontal, 30)
                        }
                        .padding(22)
                    }
                    .padding(20)
                    NavigationLink { CustomizePlayerCardView() } label: {
                        Text("Customize card").frame(maxWidth: .infinity).frame(height: 52)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink).font(.system(size: 16))
                    }
                    .padding(.horizontal, 20)
                    NavigationLink { ShareResultsView() } label: {
                        Text("Share card").frame(maxWidth: .infinity).frame(height: 52)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 16, weight: .medium))
                    }
                    .padding(20)
                }
            }
        }
    }
}

struct CustomizePlayerCardView: View { // 049
    @State private var accent = "Orange"
    @State private var layout = "Classic"
    @State private var showTrend = true
    var body: some View {
        CanonicalScreen(testID: "screen-ios-customize-player-card") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("CUSTOMIZE CARD").shotiqDisplay(38).padding(.top, 24)
                    SectionLabel(text: "ACCENT").padding(.top, 20)
                    ChipRow(options: ["Orange", "Blue", "Green", "Ink"], selection: $accent)
                    SectionLabel(text: "LAYOUT").padding(.top, 20)
                    ChipRow(options: ["Classic", "Stat-heavy", "Minimal", "Action"], selection: $layout)
                    Toggle("Show mechanics trend", isOn: $showTrend).padding(.top, 20)
                    PrimaryButton(title: "Save card").padding(.top, 26)
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

@MainActor
final class EliteViewModel: ObservableObject {
    @Published var shooters: [EliteShooterDTO] = []
    @Published var loading = true
    func load() async {
        defer { loading = false }
        shooters = (try? await APIClient.shared.shooters()) ?? []
    }
}

struct EliteMatchView: View {       // 050
    @StateObject private var vm = EliteViewModel()
    var body: some View {
        CanonicalScreen(testID: "screen-ios-elite-match") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("YOUR ELITE MATCH").shotiqDisplay(36).padding(.top, 24)
                    Text("Closest elite mechanics to your shot profile.")
                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                    if let top = vm.shooters.first {
                        ShotIQCard {
                            VStack(spacing: 10) {
                                Text("94% MATCH").font(.system(size: 12, weight: .bold)).kerning(1)
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                Text(top.name.uppercased()).shotiqDisplay(30)
                                Text("\(top.team) · \(top.position)").font(.system(size: 13))
                                    .foregroundStyle(ShotIQColor.graphite)
                                Ring(pct: 0.94, color: ShotIQColor.confirmGreen).frame(width: 110, height: 110)
                                    .overlay(Text("94").font(.custom("DINCondensed-Bold", size: 38)))
                                NavigationLink { PhotoComparisonView() } label: {
                                    Text("Side-by-side comparison").font(.system(size: 14, weight: .semibold))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                }
                            }
                            .padding(20)
                        }
                        .padding(.top, 16)
                    } else if vm.loading {
                        ProgressView().frame(maxWidth: .infinity).padding(.top, 60)
                    }
                    SectionLabel(text: "OTHER CLOSE MATCHES").padding(.top, 22)
                    ForEach(vm.shooters.dropFirst().prefix(4)) { s in
                        NavigationLink { EliteShooterDetailView(shooter: s) } label: {
                            HStack {
                                Circle().fill(ShotIQColor.rule).frame(width: 40, height: 40)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(s.name).shotiqBody(15, weight: .semibold)
                                    Text(s.team).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.vertical, 10)
                        }
                    }
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
        .task { await vm.load() }
    }
}

struct PhotoComparisonView: View {  // 051
    @State private var phase = 3.0
    var body: some View {
        CanonicalScreen(testID: "screen-ios-photo-comparison") {
            VStack(spacing: 0) {
                Text("SIDE-BY-SIDE").shotiqDisplay(38).padding(.top, 24)
                HStack(spacing: 10) {
                    VStack(spacing: 8) {
                        ZStack { MediaSurface(height: 340); SkeletonOverlay() }
                        Text("YOU").font(.system(size: 11, weight: .bold)).kerning(1)
                    }
                    VStack(spacing: 8) {
                        ZStack { MediaSurface(height: 340); SkeletonOverlay() }
                        Text("ELITE").font(.system(size: 11, weight: .bold)).kerning(1)
                            .foregroundStyle(ShotIQColor.analysisBlue)
                    }
                }
                .padding(.horizontal, 20).padding(.top, 14)
                PhaseStrip().padding(.horizontal, 20).padding(.top, 14)
                Slider(value: $phase, in: 0...4, step: 1).padding(.horizontal, 28).padding(.top, 8)
                HStack(spacing: 22) {
                    StatBlock(value: "46° vs 50°", label: "RELEASE ANGLE", valueSize: 22)
                    StatBlock(value: "77 vs 81 in", label: "RELEASE HEIGHT", valueSize: 22)
                }
                .padding(.top, 12)
                Spacer()
            }
        }
    }
}

struct EliteShootersView: View {    // 052
    @StateObject private var vm = EliteViewModel()
    @State private var query = ""
    var filtered: [EliteShooterDTO] {
        query.isEmpty ? vm.shooters : vm.shooters.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-elite-shooters") {
            VStack(alignment: .leading, spacing: 0) {
                Text("ELITE SHOOTERS").shotiqDisplay(38).padding(.horizontal, 24).padding(.top, 24)
                TextField("Search shooters", text: $query)
                    .padding(.horizontal, 14).frame(height: 46)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                    .padding(.horizontal, 24).padding(.top, 12)
                if vm.loading { ProgressView().frame(maxWidth: .infinity).padding(.top, 60) }
                List(filtered) { s in
                    NavigationLink { EliteShooterDetailView(shooter: s) } label: {
                        HStack(spacing: 14) {
                            Circle().fill(ShotIQColor.rule).frame(width: 44, height: 44)
                                .overlay(Text(String(s.name.prefix(1))).font(.system(size: 15, weight: .bold))
                                    .foregroundStyle(ShotIQColor.graphite))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(s.name).shotiqBody(15, weight: .semibold)
                                Text("\(s.team) · \(s.league)").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            if let p = s.careerPct {
                                StatBlock(value: String(format: "%.1f%%", p), label: "3P%", valueSize: 20)
                            }
                        }
                    }
                    .listRowSeparatorTint(ShotIQColor.rule)
                }
                .listStyle(.plain)
            }
        }
        .task { await vm.load() }
    }
}

struct EliteShooterDetailView: View { // 053
    var shooter: EliteShooterDTO
    var body: some View {
        CanonicalScreen(testID: "screen-ios-elite-shooter-detail") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text(shooter.name.uppercased()).shotiqDisplay(36).padding(.top, 24)
                    Text("\(shooter.team) · \(shooter.position) · \(shooter.league)")
                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                    MediaSurface(height: 300).padding(.top, 14)
                    PhaseStrip().padding(.top, 12)
                    SectionLabel(text: "CAREER SHOOTING").padding(.top, 20)
                    HStack(spacing: 24) {
                        if let p = shooter.careerPct {
                            StatBlock(value: String(format: "%.1f%%", p), label: "3P%", valueSize: 30)
                        }
                        StatBlock(value: String(format: "%.1f%%", shooter.careerFreeThrowPct), label: "FT%", valueSize: 30)
                        StatBlock(value: "\(Int(shooter.height / 12))' \(shooter.height % 12)\"", label: "HEIGHT", valueSize: 30)
                        StatBlock(value: "\(shooter.weight) lb", label: "WEIGHT", valueSize: 30)
                    }
                    .padding(.top, 8)
                    NavigationLink { PhotoComparisonView() } label: {
                        Text("Compare with my shot").frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.analysisBlue, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 16, weight: .medium))
                    }
                    .padding(.vertical, 24)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}
