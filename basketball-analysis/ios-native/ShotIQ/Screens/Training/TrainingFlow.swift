import SwiftUI

// Training flow — screens 054-062. Drill execution mirrors the web contract:
// marks POST to /api/shot-events via APIClient.

// MARK: - Shared training helpers (canonical 054 look)

/// Court photography slot. `photo` is a canonical crop key (see
/// `CanonicalPhoto`). Older screens left this nil and showed a gray icon box;
/// production paths now fall back to bundled basketball imagery so list/detail
/// cards still have a visible shot-related frame.
enum PhotoThumbMediaResolver {
    static func photoKey(explicit photo: String?, icon: String) -> String {
        if let photo { return photo }
        if icon.contains("play") { return "068-visual-002" }
        if icon.contains("chart") { return "069-visual-004" }
        if icon.contains("target") { return "065-visual-001" }
        if icon.contains("viewfinder") || icon.contains("camera") {
            return "054-visual-001"
        }
        return "054-visual-003"
    }
}

struct PhotoThumb: View {
    var width: CGFloat? = nil
    var height: CGFloat
    var icon: String = "figure.basketball"
    var photo: String? = nil
    var body: some View {
        CanonicalPhoto(resolvedPhoto, width: width, height: height, cornerRadius: 6)
            .accessibilityLabel("Shot media thumbnail")
    }
    private var resolvedPhoto: String {
        PhotoThumbMediaResolver.photoKey(explicit: photo, icon: icon)
    }
}

/// Small gray capsule chip (canonical drill meta tags).
/// Drill metadata pill ("20 min", "Form Focus", "Intermediate").
///
/// `lineLimit(1)` alone let the pill be squeezed to whatever the row had left,
/// so the label ellipsized inside the capsule — "Form…", "Inter…", "All Le…" on
/// 054/058. Canonical fits three of these in the ~164pt the drill row leaves
/// (12 min 28.6pt, Game Speed 44.2pt, All Levels 37.8pt); the condensed width,
/// the 9pt step and the tighter inset bring the app's three inside the same
/// budget, and `fixedSize` stops the row from taking it back.
struct TagChip: View {
    let text: String
    var body: some View {
        Text(text)
            .shotiqCondensed(9, weight: .medium)
            .foregroundStyle(ShotIQColor.graphite)
            .lineLimit(1)
            .fixedSize(horizontal: true, vertical: false)
            .padding(.horizontal, 6).padding(.vertical, 4)
            .background(ShotIQColor.warmCanvas, in: Capsule())
    }
}

/// Tiny caps label used above values inside canonical cards.
struct MicroLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .shotiqMicroCaps(10, weight: .semibold)
            .foregroundStyle(ShotIQColor.graphite)
    }
}

struct VRule: View {
    var height: CGFloat = 36
    var body: some View { Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: height) }
}

/// Request body for POST /api/saved-workouts — bookmarking a drill persists it
/// to the signed-in user's saved workouts (shape per src/app/api/saved-workouts/route.ts).
struct SavedWorkoutBody: Encodable {
    var name: String
    var drillCount = 1
    var drillIds: [String] = []
}

struct HRule: View {
    var body: some View { Rectangle().fill(ShotIQColor.rule).frame(height: 1) }
}

struct TrainingHomeView: View {     // 054
    @EnvironmentObject var app: AppState
    private var savedDrills: [(String, [String], String)] {
        [("Quick Release Builder", ["20 min", "Form Focus", "Intermediate"], "Improve release speed and consistency."),
         ("Elbow Alignment Series", ["15 min", "Form Focus", "All Levels"], "Train a stacked elbow and straight line."),
         ("Catch & Shoot Flow", ["12 min", "Game Speed", "All Levels"], "Smooth rhythm from catch to follow-through.")]
    }
    /// Each saved-drill row should carry a real court frame; the third row used
    /// to fall through to PhotoThumb's gray placeholder.
    private let savedDrillPhotos = ["054-visual-003", "054-visual-002", "054-visual-001"]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-training-home") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        // PRIMARY COACHING TARGET (canonical warm-canvas hero card)
                        HStack(alignment: .center, spacing: 12) {
                            VStack(alignment: .leading, spacing: 8) {
                                MicroLabel(text: "PRIMARY COACHING TARGET")
                                Text("Keep elbow stacked through release")
                                    .shotiqBody(21, weight: .bold)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer(minLength: 8)
                            VStack(spacing: 8) {
                                CorrectionGlyph(kind: .stack, size: 54).foregroundStyle(ShotIQColor.ink)
                                Image(systemName: "checkmark.circle")
                                    .font(.system(size: 19))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                        .padding(16)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 10))
                        .padding(.top, 16)

                        NavigationLink { QuickStartView() } label: {
                            HStack(spacing: 10) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.viewfinder"),
                                                         size: 18,
                                                         label: nil)
                                Text("Quick start").shotiqBody(17, weight: .medium)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                        .padding(.top, 14)

                        HStack(spacing: 10) {
                            optionCard("bookmark", "My drills", MyDrillsView())
                            optionCard("magnifyingglass", "Discover", DiscoverDrillsView())
                            optionCard("calendar", "Calendar", WorkoutCalendarView())
                        }
                        .padding(.top, 12)

                        HStack {
                            SectionLabel(text: "SAVED DRILLS")
                            Spacer()
                            NavigationLink { MyDrillsView() } label: {
                                HStack(spacing: 4) {
                                    Text("View all").shotiqBody(13)
                                    Image(systemName: "chevron.right").font(.system(size: 11))
                                }
                                .foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .padding(.top, 22)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                ForEach(Array(savedDrills.enumerated()), id: \.offset) { i, d in
                                    NavigationLink { DrillDetailView(name: d.0) } label: {
                                        // 8 rather than 10 across four gutters:
                                        // the three metadata pills need ~164pt and
                                        // the row was leaving them 166.
                                        HStack(spacing: 8) {
                                            PhotoThumb(width: 84, height: 76,
                                                       photo: savedDrillPhotos.indices.contains(i)
                                                       ? savedDrillPhotos[i] : nil)
                                            WorkoutGlyph(kind: .init(drillName: d.0), size: 28)
                                                .foregroundStyle(i == 0 ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                            VStack(alignment: .leading, spacing: 5) {
                                                Text(d.0).shotiqBody(15, weight: .semibold)
                                                    .lineLimit(1).minimumScaleFactor(0.8)
                                                HStack(spacing: 5) {
                                                    ForEach(d.1, id: \.self) { TagChip(text: $0) }
                                                }
                                                Text(d.2).shotiqBody(11)
                                                    .foregroundStyle(ShotIQColor.graphite)
                                                    .lineLimit(1).minimumScaleFactor(0.8)
                                            }
                                            Spacer(minLength: 4)
                                            Image(systemName: "chevron.right")
                                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                        }
                                        .padding(10)
                                    }
                                    if i < savedDrills.count - 1 {
                                        HRule().padding(.leading, 10)
                                    }
                                }
                            }
                        }
                        .padding(.top, 8)

                        HStack {
                            SectionLabel(text: "RECENT WORKOUT")
                            Spacer()
                            Text("Today at 8:24 AM").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 22)
                        NavigationLink { ShotTrackerView() } label: {
                            ShotIQCard {
                                HStack(spacing: 0) {
                                    PhotoThumb(width: 100, height: 128, photo: "054-visual-001")
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("Quick Release Builder").shotiqBody(15, weight: .semibold)
                                            .lineLimit(1).minimumScaleFactor(0.8)
                                        HStack(spacing: 14) {
                                            StatBlock(value: "24", label: "SHOTS", valueSize: ShotIQType.numeric)
                                            StatBlock(value: "15", label: "MAKES", valueSize: ShotIQType.numeric)
                                            StatBlock(value: "62.5%", label: "MAKE %", valueSize: ShotIQType.numeric)
                                        }
                                        HStack(spacing: 7) {
                                            Text("GOOD").shotiqBody(10, weight: .bold)
                                                .foregroundStyle(ShotIQColor.analysisBlue)
                                            Text("Keep building consistency.").shotiqBody(11)
                                                .foregroundStyle(ShotIQColor.graphite)
                                                .lineLimit(1).minimumScaleFactor(0.8)
                                        }
                                    }
                                    .padding(12)
                                    Spacer(minLength: 0)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("FORM SCORE").shotiqBody(9, weight: .semibold).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("82").font(.custom("Tungsten-Medium", size: 44))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: 0.82).frame(width: 60)
                                    }
                                    .padding(.trailing, 12)
                                }
                            }
                        }
                        .padding(.top, 8)
                        PhaseStrip().padding(.top, 22)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func optionCard(_ icon: String, _ title: String, _ dest: some View) -> some View {
        NavigationLink { dest } label: {
            VStack(spacing: 8) {
                ShotIQConceptGlyph(concept: title, fallback: icon, size: 24)
                    .foregroundStyle(ShotIQColor.ink)
                Text(title).shotiqBody(14, weight: .medium).foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity).frame(height: 82)
            .background(ShotIQColor.paper)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
        }
    }
}

struct QuickStartView: View {       // 055
    @EnvironmentObject var app: AppState
    @State private var shotTarget = 24
    @State private var makeTarget = 15
    var body: some View {
        CanonicalScreen(testID: "screen-ios-quick-start") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        Text("QUICK START").shotiqDisplay(40).padding(.top, 16)
                        (Text("Get right to work. We've prefilled this workout from ")
                            + Text("Keep elbow stacked through release.").fontWeight(.semibold))
                            .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 6)
                        HStack(alignment: .top, spacing: 16) {
                            PhotoThumb(height: 190, photo: "055-visual-001").frame(maxWidth: .infinity)
                            VStack(alignment: .leading, spacing: 6) {
                                MicroLabel(text: "FORM SCORE")
                                Text("82").font(.custom("Tungsten-Medium", size: 52))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                ScoreBar(pct: 0.82).frame(width: 96)
                                Text("GOOD").shotiqBody(13, weight: .bold)
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                Text("Keep building consistency.")
                                    .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .frame(width: 112, alignment: .leading)
                        }
                        .padding(.top, 16)
                        SectionLabel(text: "SHOT RAIL FOCUS").padding(.top, 22)
                        PhaseStrip().padding(.top, 10)
                        NavigationLink { GoalsView() } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                MicroLabel(text: "PRIMARY COACHING TARGET")
                                HStack {
                                    Text("Keep elbow stacked through release").shotiqBody(18, weight: .bold)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(.vertical, 14)
                            .overlay(HRule(), alignment: .top)
                            .overlay(HRule(), alignment: .bottom)
                        }
                        .padding(.top, 18)
                        SectionLabel(text: "WORKOUT TARGETS").padding(.top, 16)
                        HStack(alignment: .top, spacing: 12) {
                            targetCard("SHOT TARGET", icon: "target", value: $shotTarget,
                                       unit: "SHOTS", caption: "Recommended 20–30 shots")
                            targetCard("MAKE TARGET", icon: "chart.line.uptrend.xyaxis", value: $makeTarget,
                                       unit: "MAKES", caption: "Recommended 50–65%")
                        }
                        .padding(.top, 10)
                        NavigationLink { DrillExecutionView(drillName: "Wall Elbow Alignment") } label: {
                            HStack(spacing: 10) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.viewfinder"),
                                                         size: 18,
                                                         label: nil)
                                Text("Start shot tracking").shotiqBody(17, weight: .medium)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                        .padding(.vertical, 22)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func targetCard(_ label: String, icon: String, value: Binding<Int>,
                            unit: String, caption: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            MicroLabel(text: label)
            HStack(alignment: .top) {
                StatBlock(value: "\(value.wrappedValue)", label: unit, valueSize: ShotIQType.numeric * 1.4)
                Spacer()
                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                         size: 24,
                                         label: nil)
            }
            Text(caption).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(2).minimumScaleFactor(0.8)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 10) {
                Spacer()
                stepButton("minus") { value.wrappedValue = max(0, value.wrappedValue - 1) }
                stepButton("plus") { value.wrappedValue += 1 }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ShotIQColor.rule))
    }
    private func stepButton(_ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.system(size: 14, weight: .medium))
                .frame(width: 38, height: 38)
                .overlay(Circle().stroke(ShotIQColor.rule))
                .foregroundStyle(ShotIQColor.ink)
        }
    }
}

struct DiscoverDrillsView: View {   // 056
    @EnvironmentObject var app: AppState
    @State private var query = ""
    // Each browse chip is a real filter dimension backed by a picker dialog.
    @State private var flawFilter = "All Flaws"
    @State private var phaseFilter = "All Phases"
    @State private var difficultyFilter = "All Difficulties"
    @State private var durationFilter = "Any Duration"
    @State private var sortMode = "Recommended"
    @State private var activeChip: String?
    @State private var showFilterMenu = false
    @State private var bookmarked: Set<String> = []
    private let drills: [(String, String, String, String)] = [
        ("STACK & SHOOT", "Beginner", "8 min", "Builds stacked elbow position and a straight shooting line."),
        ("WRIST STAY DRILL", "Beginner", "6 min", "Keeps wrist neutral for a clean, consistent release."),
        ("ALIGN & EXTEND", "Intermediate", "10 min", "Promotes full extension and vertical ball flight.")
    ]
    private let chipOptions: [String: [String]] = [
        "All Flaws": ["All Flaws", "Elbow flare", "Early wrist bend", "Left lean"],
        "All Phases": ["All Phases", "Setup", "Load", "Rise", "Release", "Follow-through"],
        "All Difficulties": ["All Difficulties", "Beginner", "Intermediate", "Advanced"],
        "Any Duration": ["Any Duration", "Under 10 min", "10+ min"]
    ]
    private func minutes(_ s: String) -> Int { Int(s.split(separator: " ").first ?? "0") ?? 0 }
    /// All sample drills target the Release phase / elbow-related flaws, so
    /// phase and flaw filters keep them unless a non-matching value is chosen.
    private var filteredDrills: [(String, String, String, String)] {
        var out = drills.filter { d in
            (query.isEmpty || d.0.localizedCaseInsensitiveContains(query) || d.3.localizedCaseInsensitiveContains(query))
            && (difficultyFilter == "All Difficulties" || d.1 == difficultyFilter)
            && (durationFilter == "Any Duration"
                || (durationFilter == "Under 10 min" && minutes(d.2) < 10)
                || (durationFilter == "10+ min" && minutes(d.2) >= 10))
            && (phaseFilter == "All Phases" || phaseFilter == "Release")
            && (flawFilter == "All Flaws" || flawFilter == "Elbow flare" || flawFilter == "Early wrist bend")
        }
        switch sortMode {
        case "Shortest first": out.sort { minutes($0.2) < minutes($1.2) }
        case "Name A–Z": out.sort { $0.0 < $1.0 }
        default: break
        }
        return out
    }
    private func chipLabel(for dimension: String) -> String {
        switch dimension {
        case "All Flaws": return flawFilter
        case "All Phases": return phaseFilter
        case "All Difficulties": return difficultyFilter
        default: return durationFilter
        }
    }
    private func setChip(_ dimension: String, to value: String) {
        switch dimension {
        case "All Flaws": flawFilter = value
        case "All Phases": phaseFilter = value
        case "All Difficulties": difficultyFilter = value
        default: durationFilter = value
        }
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-discover-drills") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        Text("DISCOVER DRILLS").shotiqDisplay(38).padding(.top, 16)
                        Text("Drills to address your mechanics and reach your targets.")
                            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                        HStack(spacing: 10) {
                            HStack(spacing: 8) {
                                Image(systemName: "magnifyingglass")
                                    .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                                TextField("Search drills", text: $query).shotiqBody(15)
                            }
                            .padding(.horizontal, 12).frame(height: 46)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            Button { showFilterMenu = true } label: {
                                HStack(spacing: 6) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-settings",
                                                             size: 15,
                                                             label: nil)
                                    Text("Filters").shotiqBody(14, weight: .medium)
                                }
                                .padding(.horizontal, 14).frame(height: 46)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            .confirmationDialog("Filter drills", isPresented: $showFilterMenu, titleVisibility: .visible) {
                                Button("Beginner only") { difficultyFilter = "Beginner" }
                                Button("Intermediate only") { difficultyFilter = "Intermediate" }
                                Button("Under 10 minutes") { durationFilter = "Under 10 min" }
                                Button("Reset all filters") {
                                    flawFilter = "All Flaws"; phaseFilter = "All Phases"
                                    difficultyFilter = "All Difficulties"; durationFilter = "Any Duration"
                                }
                                Button("Cancel", role: .cancel) {}
                            }
                        }
                        .padding(.top, 12)
                        SectionLabel(text: "RECOMMENDED FOR YOUR TARGET").padding(.top, 18)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 12) {
                                CorrectionGlyph(kind: .stack, size: 44).foregroundStyle(ShotIQColor.ink)
                                    .padding(9)
                                    .overlay(RoundedRectangle(cornerRadius: 8)
                                        .stroke(ShotIQColor.rule, style: StrokeStyle(lineWidth: 1, dash: [4])))
                                VStack(alignment: .leading, spacing: 10) {
                                    MicroLabel(text: "PRIMARY COACHING TARGET")
                                    NavigationLink { GoalsView() } label: {
                                        HStack {
                                            Text("Keep elbow stacked through release").shotiqBody(15, weight: .semibold)
                                                .foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.8)
                                            Spacer()
                                            Image(systemName: "chevron.right")
                                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                        }
                                    }
                                    .buttonStyle(.plain)
                                    HRule()
                                    MicroLabel(text: "RELATED FLAWS DETECTED")
                                    // Three labelled flaw marks share the ~250pt
                                    // this card's text column has left. At 11pt
                                    // with 14pt gutters the longest one bottomed
                                    // out on its scale floor and still ellipsized
                                    // — "Early wrist b…" on 056. One step down the
                                    // ramp plus tighter gutters puts all three
                                    // inside the column at full size.
                                    HStack(spacing: 8) {
                                        ForEach(["Elbow flare", "Early wrist bend", "Left lean"], id: \.self) { f in
                                            HStack(spacing: 5) {
                                                FlawFigure(kind: .init(flawLabel: f), size: 16,
                                                           accent: ShotIQColor.reviewRed)
                                                    .foregroundStyle(ShotIQColor.graphite)
                                                Text(f).shotiqBody(10).foregroundStyle(ShotIQColor.ink)
                                                    .lineLimit(1).minimumScaleFactor(0.6)
                                            }
                                        }
                                    }
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "BROWSE DRILLS").padding(.top, 20)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(["All Flaws", "All Phases", "All Difficulties", "Any Duration"], id: \.self) { f in
                                    let selected = chipLabel(for: f) != f
                                    Button { activeChip = f } label: {
                                        HStack(spacing: 4) {
                                            Text(chipLabel(for: f)).shotiqBody(13, weight: selected ? .semibold : .regular)
                                            Image(systemName: "chevron.down").font(.system(size: 9))
                                        }
                                        .padding(.horizontal, 12).frame(height: 38)
                                        .overlay(RoundedRectangle(cornerRadius: 8)
                                            .stroke(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                                        .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                    }
                                }
                            }
                        }
                        .padding(.top, 10)
                        .confirmationDialog(activeChip ?? "Filter", isPresented: Binding(
                            get: { activeChip != nil }, set: { if !$0 { activeChip = nil } }
                        ), titleVisibility: .visible) {
                            if let dim = activeChip {
                                ForEach(chipOptions[dim] ?? [], id: \.self) { option in
                                    Button(option) { setChip(dim, to: option) }
                                }
                            }
                            Button("Cancel", role: .cancel) {}
                        }
                        HStack(spacing: 5) {
                            Image(systemName: "arrow.up.arrow.down").font(.system(size: 12))
                            Text("Sort:").shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                            Menu {
                                ForEach(["Recommended", "Shortest first", "Name A–Z"], id: \.self) { s in
                                    Button(s) { sortMode = s }
                                }
                            } label: {
                                HStack(spacing: 5) {
                                    Text(sortMode).shotiqBody(13, weight: .semibold)
                                    Image(systemName: "chevron.down").font(.system(size: 9))
                                }
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            Spacer()
                            Text("\(filteredDrills.count) drills").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 12)
                        ForEach(filteredDrills, id: \.0) { d in
                            NavigationLink { DrillDetailView(name: d.0) } label: {
                                ShotIQCard {
                                    HStack(spacing: 0) {
                                        // Canonical 056 only carries a frame for STACK & SHOOT.
                                        PhotoThumb(width: 104, height: 158,
                                                   photo: d.0 == "STACK & SHOOT" ? "056-visual-001" : nil)
                                        VStack(alignment: .leading, spacing: 8) {
                                            HStack(alignment: .top) {
                                                Text(d.0).shotiqDisplay(20).lineLimit(1)
                                                Spacer()
                                                Button {
                                                    if bookmarked.contains(d.0) {
                                                        bookmarked.remove(d.0)
                                                    } else {
                                                        bookmarked.insert(d.0)
                                                        Task { await APIClient.shared.send("/api/saved-workouts",
                                                                                           body: SavedWorkoutBody(name: d.0)) }
                                                    }
                                                } label: {
                                                    Image(systemName: bookmarked.contains(d.0) ? "bookmark.fill" : "bookmark")
                                                        .font(.system(size: 15))
                                                        .foregroundStyle(bookmarked.contains(d.0) ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                                        .frame(width: 32, height: 32, alignment: .topTrailing)
                                                }
                                                .buttonStyle(.plain)
                                                .accessibilityLabel("Bookmark drill")
                                            }
                                            HStack(spacing: 8) {
                                                HStack(spacing: 4) {
                                                    ForEach(0..<4, id: \.self) { i in
                                                        PhaseGlyph(phase: ShotPhase.allCases[i],
                                                                   active: i == 3, size: 15)
                                                    }
                                                }
                                                Text("Release").shotiqBody(11, weight: .medium)
                                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                                Text("· \(d.1) · \(d.2)").shotiqBody(11)
                                                    .foregroundStyle(ShotIQColor.graphite)
                                                    .lineLimit(1).minimumScaleFactor(0.7)
                                            }
                                            Text(d.3).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                                .lineLimit(2).multilineTextAlignment(.leading)
                                                .fixedSize(horizontal: false, vertical: true)
                                            HStack {
                                                Spacer()
                                                Text("View drill").shotiqBody(13, weight: .semibold)
                                                    .padding(.horizontal, 14).padding(.vertical, 8)
                                                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                                                    .foregroundStyle(.white)
                                            }
                                        }
                                        .padding(12)
                                    }
                                }
                            }
                            .padding(.top, 12)
                        }
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
}

struct DrillDetailView: View {      // 057
    var name = "Pound Crossover Foundation"
    @Environment(\.dismiss) private var dismiss
    @State private var bookmarked = false
    private let steps: [(String, String)] = [
        ("SETUP", "Feet shoulder-width. Ball in shooting pocket. Elbow in."),
        ("LOAD", "Dip into a smooth gather. Keep elbow tucked and stacked."),
        ("RISE", "Extend up. Keep elbow under ball and aligned."),
        ("RELEASE", "Release at full extension. Wrist snaps over."),
        ("FOLLOW-THROUGH", "Hold tall finish. Elbow stacked, fingers down.")
    ]
    private let mechanics: [(String, String)] = [
        ("Elbow Under Ball", "Keep elbow under the ball from load to release."),
        ("Wrist Over Elbow", "Snap wrist over elbow at the top of release."),
        ("Straight Release Path", "Drive straight up with minimal lateral drift.")
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-drill-detail") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Button { dismiss() } label: {
                            Image(systemName: "arrow.left")
                                .font(.system(size: 19, weight: .medium)).foregroundStyle(ShotIQColor.ink)
                        }
                        .accessibilityLabel("Back")
                        Spacer()
                        Wordmark(size: 26)
                        Spacer()
                        HStack(spacing: 18) {
                            Button {
                                bookmarked.toggle()
                                if bookmarked {
                                    Task { await APIClient.shared.send("/api/saved-workouts",
                                                                       body: SavedWorkoutBody(name: name)) }
                                }
                            } label: {
                                Image(systemName: bookmarked ? "bookmark.fill" : "bookmark")
                                    .foregroundStyle(bookmarked ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                            }
                            .accessibilityLabel("Bookmark drill")
                            ShareLink(item: "Check out the \(name) drill on ShotIQ 🏀") {
                                Image(systemName: "square.and.arrow.up").foregroundStyle(ShotIQColor.ink)
                            }
                        }
                        .font(.system(size: 17))
                    }
                    .padding(.horizontal, 20).frame(height: 52)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                MicroLabel(text: "DRILL DETAIL")
                                Text(name.uppercased()).shotiqDisplay(30)
                                Text("Build a tight, controlled release by stacking your elbow and wrist through extension.")
                                    .shotiqBody(13).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            PhotoThumb(width: 138, height: 160, photo: "057-visual-001")
                                .overlay(alignment: .bottomTrailing) {
                                    VStack(spacing: 2) {
                                        Text("FORM SCORE").shotiqBody(7, weight: .semibold).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("82").font(.custom("Tungsten-Medium", size: 26))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 28, height: 3)
                                    }
                                    .padding(7)
                                    .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 6))
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                    .padding(8)
                                }
                        }
                        .padding(.top, 16)
                        HStack(spacing: 0) {
                            factColumn("chart.bar", "SKILL TYPE", "Shooting")
                            VRule(height: 44)
                            factColumn("chart.line.uptrend.xyaxis", "LEVEL", "Advanced")
                            VRule(height: 44)
                            factColumn("stopwatch", "DURATION", "15 min")
                            VRule(height: 44)
                            factColumn("arrow.triangle.2.circlepath", "REPS / TIME", "60–70 reps")
                        }
                        .padding(.vertical, 14)
                        .overlay(HRule(), alignment: .bottom)
                        SectionLabel(text: "WHAT IT BUILDS").padding(.top, 18)
                        HStack(alignment: .top, spacing: 12) {
                            Text("Teaches vertical alignment of the shooting arm to improve consistency, accuracy, and repeatable release mechanics.")
                                .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                .fixedSize(horizontal: false, vertical: true)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            buildColumn("figure.stand", "ELBOW STACK")
                            buildColumn("gauge", "WRIST ALIGNMENT")
                            buildColumn("checkmark.circle", "RELEASE PATH")
                        }
                        .padding(.top, 10)
                        SectionLabel(text: "EQUIPMENT & SETUP").padding(.top, 20)
                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible())], spacing: 10) {
                            equipCard("figure.basketball", "Basketball", "1")
                            equipCard("cone", "Cones", "2–3")
                            equipCard("ruler", "Spot", "Free throw line")
                            equipCard("mappin.and.ellipse", "Location", "Any court")
                        }
                        .padding(.top, 10)
                        SectionLabel(text: "STEP-BY-STEP").padding(.top, 20)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(alignment: .top, spacing: 12) {
                                ForEach(Array(steps.enumerated()), id: \.offset) { i, s in
                                    VStack(alignment: .leading, spacing: 6) {
                                        PhotoThumb(width: 104, height: 104)
                                            .overlay(alignment: .topLeading) {
                                                Text("\(i + 1)").font(.custom("Tungsten-Medium", size: 15))
                                                    .foregroundStyle(.white)
                                                    .frame(width: 22, height: 22)
                                                    .background(ShotIQColor.shotiqOrange, in: Circle())
                                                    .offset(x: -6, y: -6)
                                            }
                                        Text(s.0).shotiqBody(11, weight: .bold).kerning(0.5)
                                            .foregroundStyle(s.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                        Text(s.1).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                            .frame(width: 104, alignment: .leading)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        .padding(.top, 10)
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "COACHING CUE")
                                Text("\u{201C}Stack your elbow under the ball and finish tall every time.\u{201D}")
                                    .shotiqBody(15).italic()
                                    .foregroundStyle(ShotIQColor.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            VRule(height: 120)
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "TARGET MECHANICS")
                                ForEach(mechanics, id: \.0) { m in
                                    HStack(alignment: .top, spacing: 8) {
                                        MechanicGlyph(kind: .init(metricLabel: m.0), size: 18)
                                            .foregroundStyle(ShotIQColor.ink)
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(m.0).shotiqBody(12, weight: .semibold)
                                            Text(m.1).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                                                .fixedSize(horizontal: false, vertical: true)
                                        }
                                    }
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.top, 22)
                        SectionLabel(text: "DRILL PREVIEW (AI OVERLAY)").padding(.top, 22)
                        HStack(alignment: .top, spacing: 12) {
                            MediaSurface(height: 112)
                            VStack(alignment: .leading, spacing: 7) {
                                Text("Green is the ideal alignment. Orange is your tracked movement.")
                                    .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                                legend(ShotIQColor.confirmGreen, "Optimal Path")
                                legend(ShotIQColor.shotiqOrange, "Your Path")
                            }
                            .frame(width: 128)
                        }
                        .padding(.top, 10)
                        HStack(spacing: 10) {
                            NavigationLink { DrillExecutionView(drillName: name) } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "play.fill")
                                    Text("Start drill").shotiqBody(17, weight: .medium)
                                }
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            squareNav("calendar") { WorkoutCalendarView() }
                            squareNav("play.rectangle") { MediaDetailView() }
                        }
                        .padding(.vertical, 22)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func factColumn(_ icon: String, _ label: String, _ value: String) -> some View {
        VStack(spacing: 4) {
            ShotIQConceptGlyph(concept: label, fallback: icon, size: 17)
                .foregroundStyle(ShotIQColor.ink)
            Text(label).shotiqBody(8, weight: .semibold).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
            Text(value).shotiqBody(12, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }
    private func buildColumn(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 5) {
            // TARGET MECHANICS: one diagram per mechanic being built.
            ShotIQConceptGlyph(concept: label, fallback: icon, size: 22)
                .foregroundStyle(ShotIQColor.ink)
            Text(label).shotiqBody(7.5, weight: .semibold).kerning(0.4)
                .foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
        }
        .frame(width: 62)
    }
    private func equipCard(_ icon: String, _ title: String, _ caption: String) -> some View {
        HStack(spacing: 10) {
            ShotIQConceptGlyph(concept: title, fallback: icon, size: 26)
                .foregroundStyle(ShotIQColor.ink)
                .frame(width: 26)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).shotiqBody(13, weight: .semibold)
                Text(caption).shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1).minimumScaleFactor(0.8)
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
    private func legend(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 6) {
            HStack(spacing: 2) {
                ForEach(0..<3, id: \.self) { _ in Circle().fill(color).frame(width: 3.5, height: 3.5) }
            }
            Text(label).shotiqBody(11).foregroundStyle(ShotIQColor.ink)
        }
    }
    private func squareNav(_ icon: String, @ViewBuilder dest: @escaping () -> some View) -> some View {
        NavigationLink { dest() } label: {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                     size: 18,
                                     label: nil)
                .frame(width: 54, height: 54)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
        }
    }
}

struct MyDrillsView: View {         // 058
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var tab = 1                  // 0 TRAIN · 1 MY DRILLS · 2 ASSIGNED
    @State private var sortMode = "Newest"
    @State private var phaseFilter = "All phases"
    private let drills: [(String, String, String, Int, Int, String, String)] = [
        ("Quick Release Builder", "Keep elbow stacked through release", "RELEASE", 24, 15, "62.5%", "May 10, 2025"),
        ("Stationary Pound Dribble", "Build a strong handle with a stationary pound dribble focus", "LOAD", 18, 11, "61.1%", "May 8, 2025"),
        ("Speed Dribble Combo", "Advance your handle with speed dribble combinations and counters", "RISE", 30, 21, "70.0%", "May 5, 2025"),
        ("1-2 Step Finishing", "Finish at the rim using quick 1-2 step footwork and control", "RISE", 16, 12, "75.0%", "Apr 28, 2025")
    ]
    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    /// Canonical 058 frames, keyed by drill so sorting/filtering keeps each
    /// card with the photograph the design pairs it with.
    private let drillPhotos = ["Quick Release Builder": "058-visual-002",
                               "Stationary Pound Dribble": "058-visual-001",
                               "Speed Dribble Combo": "058-visual-003",
                               "1-2 Step Finishing": "058-visual-004"]
    private var visibleDrills: [(String, String, String, Int, Int, String, String)] {
        var out = drills.filter { phaseFilter == "All phases" || $0.2 == phaseFilter }
        if sortMode == "Best accuracy" {
            out.sort { (Double($0.5.dropLast()) ?? 0) > (Double($1.5.dropLast()) ?? 0) }
        }
        return out
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-my-drills") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        NavigationLink { AnalyzeHubView() } label: {
                            HStack(spacing: 10) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.viewfinder"),
                                                         size: 18,
                                                         label: nil)
                                Text("Analyze shot").shotiqBody(17, weight: .medium)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                            .foregroundStyle(.white)
                        }
                        .padding(.top, 16)
                        HStack(spacing: 0) {
                            tabButton("figure.run", "TRAIN", "Drills & workouts", 0)
                            tabButton("point.3.connected.trianglepath.dotted", "MY DRILLS", "Saved for you", 1)
                            tabButton("scribble.variable", "ASSIGNED", "From coach", 2)
                        }
                        .padding(.top, 18)
                        HStack {
                            SectionLabel(text: "\(visibleDrills.count) DRILLS")
                            Spacer()
                            Menu {
                                Button("Newest") { sortMode = "Newest" }
                                Button("Best accuracy") { sortMode = "Best accuracy" }
                            } label: {
                                HStack(spacing: 4) {
                                    Text("Sort:").shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                    Text(sortMode).shotiqBody(12, weight: .semibold)
                                        .foregroundStyle(ShotIQColor.ink)
                                    Image(systemName: "chevron.down").font(.system(size: 8))
                                        .foregroundStyle(ShotIQColor.ink)
                                }
                            }
                            VRule(height: 14).padding(.horizontal, 8)
                            Menu {
                                ForEach(["All phases", "SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                                    Button(p) { phaseFilter = p }
                                }
                            } label: {
                                HStack(spacing: 5) {
                                    Text(phaseFilter == "All phases" ? "Filter" : phaseFilter)
                                        .shotiqBody(12)
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-settings",
                                                             size: 12,
                                                             label: nil)
                                }
                                .foregroundStyle(phaseFilter == "All phases" ? ShotIQColor.ink : ShotIQColor.shotiqOrange)
                            }
                        }
                        .padding(.top, 18)
                        if tab == 2 {
                            ShotIQCard {
                                VStack(spacing: 8) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-workout-saved",
                                                             size: 28,
                                                             label: nil)
                                    Text("No assigned drills yet").shotiqBody(15, weight: .semibold)
                                    Text("Drills your coach assigns will appear here.")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 28)
                            }
                            .padding(.top, 12)
                        } else {
                            ForEach(visibleDrills, id: \.0) { d in
                                drillCard(d)
                                    .padding(.top, 12)
                            }
                        }
                        ShotIQCard {
                            HStack(spacing: 12) {
                                PhotoThumb(width: 74, height: 74, icon: "viewfinder")
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("READY TO DISCOVER MORE DRILLS?").shotiqBody(13, weight: .bold)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                    Text("Find new drills tailored to your shooting mechanics and training goals.")
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 6)
                                NavigationLink { DiscoverDrillsView() } label: {
                                    Text("Discover drills").shotiqBody(12, weight: .semibold)
                                        .padding(.horizontal, 11).padding(.vertical, 8)
                                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                            }
                            .padding(12)
                        }
                        .padding(.top, 14)
                        PhaseStrip().padding(.top, 22)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func tabButton(_ icon: String, _ title: String, _ caption: String, _ index: Int) -> some View {
        let selected = tab == index
        // TRAIN pops back to the training home this screen was pushed from;
        // the other two switch the visible list in place.
        return Button {
            if index == 0 { dismiss() } else { tab = index }
        } label: {
            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    ShotIQConceptGlyph(concept: title, fallback: icon, size: 16)
                    Text(title).shotiqBody(12, weight: .bold).kerning(0.5)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
                .foregroundStyle(selected ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                Text(caption).shotiqBody(10).foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Rectangle().fill(selected ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                    .frame(height: selected ? 2 : 1)
            }
            .frame(maxWidth: .infinity)
        }
    }
    private func drillCard(_ d: (String, String, String, Int, Int, String, String)) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 12) {
                NavigationLink { DrillDetailView(name: d.0) } label: {
                    PhotoThumb(width: 84, height: 150, photo: drillPhotos[d.0])
                }
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top, spacing: 8) {
                        NavigationLink { DrillDetailView(name: d.0) } label: {
                            Text(d.0.uppercased()).shotiqDisplay(18)
                                .multilineTextAlignment(.leading)
                        }
                        Spacer(minLength: 4)
                        NavigationLink { DrillExecutionView(drillName: d.0) } label: {
                            Text("Start drill").shotiqBody(12, weight: .semibold)
                                .padding(.horizontal, 11).padding(.vertical, 7)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.shotiqOrange))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                    }
                    Text(d.1).shotiqBody(12).foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(2).fixedSize(horizontal: false, vertical: true)
                    HStack(spacing: 16) {
                        ForEach(phases, id: \.self) { p in
                            VStack(spacing: 3) {
                                PhaseGlyph(phase: p, active: p == d.2, size: 18)
                                Rectangle().fill(p == d.2 ? ShotIQColor.shotiqOrange : .clear)
                                    .frame(width: 18, height: 2)
                            }
                        }
                    }
                    HStack(spacing: 0) {
                        miniStat("\(d.3)", "SHOTS")
                        miniStat("\(d.4)", "MAKES")
                        miniStat(d.5, "BEST ACCURACY")
                        miniStat(d.6, "LAST COMPLETED")
                    }
                }
                .padding(.vertical, 12).padding(.trailing, 12)
            }
        }
    }
    private func miniStat(_ value: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(.custom("Tungsten-Medium", size: 17)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(7, weight: .medium).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct WorkoutCalendarView: View {  // 059
    @EnvironmentObject var app: AppState
    @State private var selected = 7
    @State private var monthIndex = 4          // 0-based; 4 = May 2025 (has data)
    @State private var dayCardExpanded = true
    private let monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                              "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
    private let daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    private var isDataMonth: Bool { monthIndex == 4 }
    private let completed: Set<Int> = [4, 5, 6, 9, 12, 15, 18]
    private let missed: Set<Int> = [10, 17]
    /// Canonical greys 24 with no marker and no duration — the legend's
    /// "no workout" state. 31 falls outside the scheduled range already.
    private let noWorkout: Set<Int> = [24]
    private let minutes: [Int: String] = [4: "18 min", 5: "17 min", 6: "20 min", 9: "15 min",
                                          12: "17 min", 15: "15 min", 18: "18 min"]
    private let weekdayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-workout-calendar") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        // Primary target strip
                        HStack(spacing: 10) {
                            CorrectionGlyph(kind: .stack, size: 28).foregroundStyle(ShotIQColor.ink)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("PRIMARY TARGET").shotiqBody(9, weight: .semibold).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("Keep elbow stacked through release")
                                    .shotiqBody(13, weight: .semibold)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            Spacer(minLength: 6)
                            stripStat("24", "SHOTS")
                            stripStat("15", "MAKES")
                            stripStat("62.5%", "FG%")
                        }
                        .padding(12)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 16)
                        // Month header
                        HStack {
                            Button { if monthIndex > 0 { monthIndex -= 1 } } label: {
                                Image(systemName: "chevron.left").font(.system(size: 17))
                                    .foregroundStyle(monthIndex > 0 ? ShotIQColor.ink : ShotIQColor.muted)
                            }
                            .accessibilityLabel("Previous month")
                            Spacer()
                            Text("\(monthNames[monthIndex]) 2025").shotiqDisplay(26)
                            Spacer()
                            Button { if monthIndex < 11 { monthIndex += 1 } } label: {
                                Image(systemName: "chevron.right").font(.system(size: 17))
                                    .foregroundStyle(monthIndex < 11 ? ShotIQColor.ink : ShotIQColor.muted)
                            }
                            .accessibilityLabel("Next month")
                        }
                        .padding(.top, 16)
                        let cols = Array(repeating: GridItem(.flexible(), spacing: 2), count: 7)
                        LazyVGrid(columns: cols, spacing: 2) {
                            ForEach(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], id: \.self) { d in
                                Text(d).shotiqBody(9, weight: .bold).kerning(0.4)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            if isDataMonth {
                                // Offset ids, exactly as the trailing run below does.
                                // These April cells print 27-30, and so do May's real
                                // 27-30 further down the SAME LazyVGrid — identical
                                // \.self ids in one grid collide, SwiftUI keeps the
                                // first of each and silently drops the later four, so
                                // the month ended at 26 with 31 stranded.
                                ForEach(227...230, id: \.self) { d in adjacentCell(d - 200) }
                            }
                            ForEach(1...daysInMonth[monthIndex], id: \.self) { d in dayCell(d) }
                            if isDataMonth {
                                ForEach(101...107, id: \.self) { d in adjacentCell(d - 100) }
                            }
                        }
                        .padding(.top, 10)
                        // Legend
                        HStack(spacing: 10) {
                            legendItem("Completed") { Image(systemName: "checkmark.circle").font(.system(size: 11)).foregroundStyle(ShotIQColor.confirmGreen) }
                            legendItem("Scheduled") { Circle().stroke(ShotIQColor.shotiqOrange, lineWidth: 1.4).frame(width: 10, height: 10) }
                            legendItem("In Progress") { Circle().fill(ShotIQColor.shotiqOrange).frame(width: 10, height: 10) }
                            legendItem("Missed") { Image(systemName: "xmark.circle").font(.system(size: 11)).foregroundStyle(ShotIQColor.reviewRed) }
                            legendItem("No workout") { Text("24").font(.custom("Tungsten-Medium", size: 12)).foregroundStyle(ShotIQColor.muted) }
                        }
                        .padding(.top, 12)
                        // Selected day card
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 10) {
                                    Text("\(weekdayNames[(4 + selected - 1) % 7]), MAY \(selected)")
                                        .shotiqBody(15, weight: .bold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                    Text("IN PROGRESS").shotiqBody(9, weight: .bold).kerning(0.4)
                                        .padding(.horizontal, 7).padding(.vertical, 3)
                                        .overlay(RoundedRectangle(cornerRadius: 4).stroke(ShotIQColor.shotiqOrange))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Spacer()
                                    Button { withAnimation { dayCardExpanded.toggle() } } label: {
                                        Image(systemName: dayCardExpanded ? "chevron.up" : "chevron.down")
                                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                                    }
                                    .accessibilityLabel(dayCardExpanded ? "Collapse day details" : "Expand day details")
                                }
                                if dayCardExpanded {
                                HStack(alignment: .top, spacing: 12) {
                                    PhotoThumb(width: 112, height: 128, photo: "059-visual-001")
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text("COMBO LADDER").shotiqDisplay(22)
                                        HStack(spacing: 5) {
                                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "clock"), size: 32).font(.system(size: 11))
                                            Text("Day 4 of 7 • 17 min").shotiqBody(12, weight: .semibold)
                                        }
                                        Text("Layer catch-and-shoot reps with movement progressions to reinforce release timing and alignment under fatigue.")
                                            .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                        HStack(spacing: 12) {
                                            ForEach(["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"], id: \.self) { p in
                                                PhaseGlyph(phase: p, active: p == "RELEASE", size: 16)
                                            }
                                        }
                                    }
                                }
                                NavigationLink { DrillExecutionView(drillName: "Combo Ladder") } label: {
                                    HStack(spacing: 8) {
                                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "camera.viewfinder"),
                                                                 size: 18,
                                                                 label: nil)
                                        Text("Open workout").shotiqBody(16, weight: .medium)
                                    }
                                    .frame(maxWidth: .infinity).frame(height: 50)
                                    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                    .foregroundStyle(.white)
                                }
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 14)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func stripStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 1) {
            Text(value).font(.custom("Tungsten-Medium", size: 17)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(7, weight: .medium).foregroundStyle(ShotIQColor.graphite)
        }
    }
    private func adjacentCell(_ d: Int) -> some View {
        Text("\(d)").shotiqBody(13).foregroundStyle(ShotIQColor.muted)
            .frame(maxWidth: .infinity, minHeight: 54, alignment: .top)
            .padding(.top, 4)
    }
    @ViewBuilder
    private func dayCell(_ d: Int) -> some View {
        Button { selected = d; dayCardExpanded = true } label: {
            VStack(spacing: 3) {
                if !isDataMonth {
                    Text("\(d)").shotiqBody(13).foregroundStyle(ShotIQColor.ink)
                } else if d == selected {
                    Text("\(d)").shotiqBody(12, weight: .bold).foregroundStyle(.white)
                        .frame(width: 26, height: 26)
                        .background(ShotIQColor.shotiqOrange, in: Circle())
                    Text("In Progress").shotiqBody(7, weight: .semibold)
                        .foregroundStyle(ShotIQColor.shotiqOrange)
                        .lineLimit(1).minimumScaleFactor(0.7)
                } else {
                    Text("\(d)").shotiqBody(13, weight: .semibold).foregroundStyle(ShotIQColor.ink)
                    if completed.contains(d) {
                        Image(systemName: "checkmark.circle").font(.system(size: 12))
                            .foregroundStyle(ShotIQColor.confirmGreen)
                        Text(minutes[d] ?? "").shotiqBody(7).foregroundStyle(ShotIQColor.graphite)
                    } else if missed.contains(d) {
                        Image(systemName: "xmark.circle").font(.system(size: 12))
                            .foregroundStyle(ShotIQColor.reviewRed)
                        Text("Missed").shotiqBody(7).foregroundStyle(ShotIQColor.reviewRed)
                    } else if d >= 8 && d <= 30 && !noWorkout.contains(d) {
                        Circle().stroke(ShotIQColor.shotiqOrange, lineWidth: 1.3)
                            .frame(width: 12, height: 12)
                        Text("20 min").shotiqBody(7).foregroundStyle(ShotIQColor.graphite)
                    }
                }
            }
            .frame(maxWidth: .infinity, minHeight: 54, alignment: .top)
            .padding(.top, 4)
        }
    }
    private func legendItem(_ label: String, @ViewBuilder mark: () -> some View) -> some View {
        HStack(spacing: 4) {
            mark()
            Text(label).shotiqBody(8.5).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
    }
}

@MainActor
final class DrillSessionModel: ObservableObject {
    @Published var shots: [(n: Int, made: Bool)] = []
    @Published var elapsed = 0
    @Published var paused = false
    @Published var saving = false
    private var n = 0
    private var timer: Timer?
    var makes: Int { shots.filter(\.made).count }
    var pct: Double { shots.isEmpty ? 0 : Double(makes) / Double(shots.count) }

    func start() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in if let self, !self.paused { self.elapsed += 1 } }
        }
    }
    func stop() { timer?.invalidate() }
    /// Marks count locally so Undo can truly remove the last shot; the whole
    /// session is persisted in one batch by `finish` — matching the backend,
    /// where POST /api/shot-events accepts `{ events: [...] }` batches and has
    /// no per-event delete.
    func mark(_ made: Bool, drillId: String) { n += 1; shots.append((n, made)) }
    func undo() { if !shots.isEmpty { shots.removeLast(); n = max(0, n - 1) } }

    // POST /api/shot-events — shape per src/app/api/shot-events/route.ts.
    private struct ShotEventsBody: Encodable {
        struct Event: Encodable {
            var sequence: Int
            var detected = true
            var detectedResult: String
            var confidence = 1.0
            var metadata: [String: String]
        }
        var events: [Event]
    }
    // POST /api/workouts — shape per src/app/api/workouts/route.ts.
    private struct WorkoutBody: Encodable {
        var name: String
        var scheduledDate: String
        var completed = true
        var completedAt: String
        var duration: Int
        var totalShots: Int
        var totalMade: Int
        var totalMissed: Int
        var accuracy: Double
    }

    /// Ends the session: writes every marked shot to /api/shot-events and the
    /// completed workout (real totals) to /api/workouts.
    func finish(drillName: String) async {
        stop()
        guard !shots.isEmpty, !saving else { return }
        saving = true
        defer { saving = false }
        let events = shots.map { shot in
            ShotEventsBody.Event(sequence: shot.n,
                                 detectedResult: shot.made ? "make" : "miss",
                                 metadata: ["drillId": drillName, "source": "ios-manual"])
        }
        await APIClient.shared.send("/api/shot-events", body: ShotEventsBody(events: events))
        let now = ISO8601DateFormatter().string(from: Date())
        let made = makes
        await APIClient.shared.send("/api/workouts", body: WorkoutBody(
            name: drillName,
            scheduledDate: now,
            completedAt: now,
            duration: max(1, Int((Double(elapsed) / 60).rounded())),
            totalShots: shots.count,
            totalMade: made,
            totalMissed: shots.count - made,
            accuracy: Double(made) / Double(shots.count) * 100))
    }
}

struct DrillExecutionView: View {   // 060
    @EnvironmentObject var app: AppState
    var drillName = "Pound Crossover Foundation"
    @StateObject private var m = DrillSessionModel()
    @State private var viewAngle = "FRONT VIEW"
    @State private var showCompletion = false
    @State private var toast: ShotIQToast?
    private let target = 15
    var body: some View {
        CanonicalScreen(testID: "screen-ios-drill-execution") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .center, spacing: 10) {
                            Text("DRILL EXECUTION").shotiqDisplay(30)
                            Text("Set 2 of 5").shotiqBody(12, weight: .medium)
                                .padding(.horizontal, 10).padding(.vertical, 5)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("TARGET").shotiqBody(10, weight: .semibold).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("\(target) makes").shotiqBody(16, weight: .semibold)
                            }
                        }
                        .padding(.top, 14)
                        ShotIQCard {
                            HStack(alignment: .center, spacing: 12) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("COACHING CUE").shotiqBody(11, weight: .bold).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("Keep elbow stacked through release").shotiqBody(17, weight: .bold)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 4)
                                VRule(height: 58)
                                CorrectionGlyph(kind: .stack, size: 40).foregroundStyle(ShotIQColor.ink)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("FOCUS AREA").shotiqBody(9, weight: .semibold).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("Elbow alignment at release").shotiqBody(12, weight: .medium)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .frame(width: 84)
                            }
                            .padding(14)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            HStack(spacing: 0) {
                                execStat("\(m.makes)", "MAKES")
                                VRule(height: 40)
                                execStat("\(m.shots.count)", "SHOTS")
                                VRule(height: 40)
                                execStat(String(format: "%.1f%%", m.pct * 100), "MAKE %")
                                Spacer(minLength: 8)
                                VStack(spacing: 6) {
                                    HStack(spacing: 5) {
                                        ForEach(0..<6, id: \.self) { i in
                                            Circle()
                                                .fill(i < min(6, m.makes * 6 / target)
                                                      ? ShotIQColor.confirmGreen : ShotIQColor.rule)
                                                .frame(width: 11, height: 11)
                                        }
                                    }
                                    Text("\(max(target - m.makes, 0)) to target")
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 10)
                        ZStack(alignment: .top) {
                            CanonicalMediaSurface(key: "060-visual-002", height: 290)
                            HStack {
                                Menu {
                                    ForEach(["FRONT VIEW", "SIDE VIEW", "REAR VIEW"], id: \.self) { v in
                                        Button(v) {
                                            viewAngle = v
                                            toast = .success("Camera view changed", v)
                                        }
                                    }
                                } label: {
                                    HStack(spacing: 5) {
                                        Text(viewAngle).shotiqBody(10, weight: .bold).kerning(0.5)
                                        Image(systemName: "chevron.down").font(.system(size: 8))
                                    }
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 10).padding(.vertical, 6)
                                    .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 5))
                                }
                                Spacer()
                                HStack(spacing: 6) {
                                    Circle().fill(ShotIQColor.shotiqOrange).frame(width: 7, height: 7)
                                    Text(String(format: "%02d:%02d", m.elapsed / 60, m.elapsed % 60))
                                        .font(.custom("Tungsten-Medium", size: 14)).foregroundStyle(.white)
                                }
                                .padding(.horizontal, 9).padding(.vertical, 5)
                                .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 5))
                            }
                            .padding(10)
                        }
                        .padding(.top, 12)
                        PhaseStrip().padding(.top, 16)
                        HStack(spacing: 10) {
                            Button {
                                m.mark(true, drillId: drillName)
                                toast = .success("Make recorded", "\(m.makes) makes • \(m.shots.count) shots")
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "checkmark.circle")
                                    Text("Mark make").shotiqBody(15, weight: .semibold)
                                }
                                .frame(maxWidth: .infinity).frame(height: 52)
                                .background(ShotIQColor.confirmGreen, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            .accessibilityIdentifier("mark-make")
                            Button {
                                m.mark(false, drillId: drillName)
                                toast = .info("Miss recorded", "\(m.makes) makes • \(m.shots.count) shots")
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "xmark.circle")
                                    Text("Mark miss").shotiqBody(15, weight: .semibold)
                                }
                                .frame(maxWidth: .infinity).frame(height: 52)
                                .background(ShotIQColor.reviewRed, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            .accessibilityIdentifier("mark-miss")
                        }
                        .padding(.top, 16)
                        HStack(spacing: 10) {
                            Button {
                                m.undo()
                                toast = .info("Last shot removed", "\(m.shots.count) shots remaining")
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "arrow.uturn.backward")
                                    Text("Undo").shotiqBody(15)
                                }
                                .frame(maxWidth: .infinity).frame(height: 48)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                            .accessibilityLabel("Undo last shot")
                            Button {
                                m.paused.toggle()
                                toast = .info(m.paused ? "Workout paused" : "Workout resumed",
                                              m.paused ? "Timer is paused." : "Keep tracking your makes.")
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: m.paused ? "play" : "pause")
                                    Text(m.paused ? "Resume" : "Pause").shotiqBody(15)
                                }
                                .frame(maxWidth: .infinity).frame(height: 48)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                        }
                        .padding(.top, 10)
                        Button {
                            Task {
                                toast = .progress("Saving workout", "Syncing shots and workout summary.", progress: 0.65)
                                await m.finish(drillName: drillName)   // persist shots + workout
                                toast = .success("Workout saved", "Opening your completion summary.")
                                try? await Task.sleep(nanoseconds: 650_000_000)
                                showCompletion = true
                            }
                        } label: {
                            HStack(spacing: 8) {
                                if m.saving { ProgressView().tint(ShotIQColor.shotiqOrange) }
                                else { Image(systemName: "stop.circle") }
                                Text(m.saving ? "Saving…" : "End workout").shotiqBody(16, weight: .medium)
                            }
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .disabled(m.saving)
                        .padding(.top, 10)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
        .navigationDestination(isPresented: $showCompletion) {
            WorkoutCompletionView(shots: m.shots.count, makes: m.makes, drillName: drillName)
        }
        .onAppear { m.start() }
        .onDisappear { m.stop() }
    }
    private func execStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.custom("Tungsten-Medium", size: 30)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(9, weight: .medium).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ShotTrackerView: View {      // 061
    @EnvironmentObject var app: AppState
    @StateObject private var m = DrillSessionModel()
    @State private var showCompletion = false
    @State private var toast: ShotIQToast?
    private let baseShots = 24, baseMakes = 15, sessionTarget = 25
    private let baseMisses: Set<Int> = [2, 4, 5, 8, 11, 14, 17, 20, 21]
    private var shots: Int { baseShots + m.shots.count }
    private var makes: Int { baseMakes + m.makes }
    private var pct: Double { shots == 0 ? 0 : Double(makes) / Double(shots) }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-shot-tracker") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    // Session bar
                    HStack(spacing: 10) {
                        Text("20-MINUTE TRAINING SESSION").shotiqBody(14, weight: .bold)
                            .lineLimit(1).minimumScaleFactor(0.7)
                        Spacer(minLength: 6)
                        Image(systemName: "stopwatch").font(.system(size: 13))
                        VStack(alignment: .leading, spacing: 0) {
                            Text("03:18").font(.custom("Tungsten-Medium", size: 17))
                            Text("REMAINING").shotiqBody(7, weight: .medium).kerning(0.4)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        VRule(height: 26)
                        Button {
                            m.paused.toggle()
                            toast = .info(m.paused ? "Workout paused" : "Workout resumed")
                        } label: {
                            HStack(spacing: 5) {
                                Image(systemName: m.paused ? "play.fill" : "pause.fill").font(.system(size: 10))
                                Text(m.paused ? "RESUME" : "PAUSE WORKOUT")
                                    .shotiqBody(10, weight: .bold).kerning(0.4)
                                    .lineLimit(1).minimumScaleFactor(0.7)
                            }
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                    }
                    .padding(.horizontal, 20).padding(.vertical, 12)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    SectionLabel(text: "SHOT TRACKER")
                                    Spacer()
                                    Text("\(shots) OF \(sessionTarget)")
                                        .font(.custom("Tungsten-Medium", size: 16))
                                }
                                // Canonical 061 shows the last shot's own frame in
                                // this column; the 061 sidecar declares no photo
                                // element, so the app had only the dark media
                                // plate to draw. The frame runs x 28…519,
                                // y 423…1195 on the 853x1844 canvas.
                                //
                                // Cut short at y 1082: canonical bakes its own
                                // "SHOT 15 / JUST NOW" plate and a fullscreen
                                // glyph into the bottom of that frame, and the
                                // plate here has to stay live — it counts the
                                // shots the reader actually records. Dropping the
                                // bottom 113 rows of floor keeps one plate on
                                // screen instead of two. 491x659 is 284pt tall in
                                // this 211pt column. The plate moves to
                                // .bottomLeading because that is the corner
                                // canonical hangs it off.
                                ZStack(alignment: .bottomLeading) {
                                    CanonicalPhoto("061-visual-001", height: 284)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text("SHOT \(shots)").shotiqBody(10, weight: .bold).kerning(0.4)
                                        Text("JUST NOW").shotiqBody(7).opacity(0.8)
                                    }
                                    .foregroundStyle(.white)
                                    .padding(8)
                                    .background(.black.opacity(0.75), in: RoundedRectangle(cornerRadius: 4))
                                    .padding(10)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            VStack(alignment: .leading, spacing: 9) {
                                MicroLabel(text: "MAKE PERCENTAGE")
                                Text(String(format: "%.1f%%", pct * 100))
                                    .font(.custom("Tungsten-Medium", size: 36))
                                    .foregroundStyle(ShotIQColor.ink)
                                    .lineLimit(1).minimumScaleFactor(0.6)
                                Text("\(makes) OF \(shots)").font(.custom("Tungsten-Medium", size: 14))
                                    .foregroundStyle(ShotIQColor.graphite)
                                Ring(pct: pct, color: ShotIQColor.confirmGreen, lineWidth: 7)
                                    .frame(width: 54, height: 54)
                                HRule()
                                MicroLabel(text: "CURRENT STREAK")
                                HStack(alignment: .firstTextBaseline, spacing: 4) {
                                    Text("3").font(.custom("Tungsten-Medium", size: 26))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Text("MAKES").shotiqBody(8, weight: .bold)
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                }
                                HRule()
                                MicroLabel(text: "QUICK CORRECTION")
                                correction("Elbow Height", "Raise elbow")
                                correction("Shooting Pocket", "Tighten pocket")
                                correction("Release Arc", "Less forward tilt")
                                NavigationLink { AnalysisResultOverviewView() } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: "list.bullet").font(.system(size: 10))
                                        Text("VIEW ANALYSIS").shotiqBody(9, weight: .bold).kerning(0.4)
                                    }
                                    .frame(maxWidth: .infinity).frame(height: 34)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                    .foregroundStyle(ShotIQColor.ink)
                                }
                            }
                            .frame(width: 128)
                        }
                        .padding(.top, 16)
                        SectionLabel(text: "SET PROGRESS").padding(.top, 20)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(1...sessionTarget, id: \.self) { i in
                                    VStack(spacing: 3) {
                                        if i <= shots {
                                            let made = i <= baseShots
                                                ? !baseMisses.contains(i)
                                                : (m.shots.indices.contains(i - baseShots - 1)
                                                   ? m.shots[i - baseShots - 1].made : true)
                                            Image(systemName: made ? "checkmark.circle.fill" : "xmark.circle")
                                                .font(.system(size: 18))
                                                .foregroundStyle(made ? ShotIQColor.confirmGreen : ShotIQColor.reviewRed)
                                        } else {
                                            Circle().stroke(ShotIQColor.rule, lineWidth: 1.4)
                                                .frame(width: 17, height: 17)
                                        }
                                        Text("\(i)").shotiqBody(9).foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                            }
                            .padding(.vertical, 2)
                        }
                        .padding(.top, 8)
                        HStack(spacing: 16) {
                            Spacer()
                            HStack(spacing: 5) {
                                Image(systemName: "checkmark.circle.fill").font(.system(size: 11))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                Text("MAKE").shotiqBody(9, weight: .bold)
                            }
                            HStack(spacing: 5) {
                                Image(systemName: "xmark.circle").font(.system(size: 11))
                                    .foregroundStyle(ShotIQColor.reviewRed)
                                Text("MISS").shotiqBody(9, weight: .bold)
                            }
                            Spacer()
                        }
                        .padding(.top, 8)
                        SectionLabel(text: "SHOT RAIL").padding(.top, 20)
                        HStack(alignment: .top) {
                            ForEach([("SETUP", "100%"), ("LOAD", "100%"), ("RISE", "100%"),
                                     ("RELEASE", "98%"), ("FOLLOW-THROUGH", "100%")], id: \.0) { p in
                                VStack(spacing: 3) {
                                    PhaseGlyph(phase: p.0, active: p.0 == "RELEASE", size: 26)
                                    Text(p.0).shotiqBody(8, weight: p.0 == "RELEASE" ? .bold : .regular)
                                        .kerning(0.3)
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text(p.1).font(.custom("Tungsten-Medium", size: 12))
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.top, 8)
                        ScoreBar(pct: 0.96).padding(.top, 8)
                        HStack(spacing: 8) {
                            Button {
                                m.mark(true, drillId: "shot-tracker")
                                toast = .success("Make recorded", "\(makes) of \(shots) shots made")
                            } label: {
                                trackerButton("checkmark.circle", "MARK MAKE", .white, ShotIQColor.confirmGreen)
                            }
                            Button {
                                m.mark(false, drillId: "shot-tracker")
                                toast = .info("Miss recorded", "\(makes) of \(shots) shots made")
                            } label: {
                                trackerButton("xmark.circle", "MARK MISS", .white, ShotIQColor.shotiqOrange)
                            }
                            Button {
                                m.undo()
                                toast = .info("Last shot removed", "\(shots) shots tracked")
                            } label: {
                                trackerButton("arrow.uturn.backward", "UNDO", ShotIQColor.ink, nil)
                            }
                            Button {
                                Task {
                                    toast = .progress("Saving workout", "Syncing shot tracker results.", progress: 0.65)
                                    await m.finish(drillName: "Shot Tracker Session")
                                    toast = .success("Workout saved", "Opening your completion summary.")
                                    try? await Task.sleep(nanoseconds: 650_000_000)
                                    showCompletion = true
                                }
                            } label: {
                                trackerButton("stop.circle", m.saving ? "SAVING…" : "END WORKOUT", ShotIQColor.ink, nil)
                            }
                            .disabled(m.saving)
                        }
                        .padding(.top, 18)
                        Spacer(minLength: 30)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .shotiqToast($toast)
        .navigationDestination(isPresented: $showCompletion) {
            WorkoutCompletionView(shots: shots, makes: makes, drillName: "Shot Tracker Session")
        }
        .onAppear { m.start() }
        .onDisappear { m.stop() }
    }
    private func correction(_ title: String, _ caption: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(title).shotiqBody(11, weight: .semibold)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(caption).shotiqBody(9).foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .padding(.horizontal, 8).padding(.vertical, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
    }
    private func trackerButton(_ icon: String, _ label: String, _ fg: Color, _ bg: Color?) -> some View {
        HStack(spacing: 5) {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                     size: 12,
                                     label: nil)
            Text(label).shotiqBody(10, weight: .bold).kerning(0.3)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity).frame(height: 50)
        .background(bg ?? .clear, in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(bg == nil ? ShotIQColor.rule : .clear))
        .foregroundStyle(fg)
    }
}

struct WorkoutCompletionView: View { // 062
    @EnvironmentObject var app: AppState
    var shots = 24; var makes = 15
    var drillName = "Quick Release Builder"
    private var accuracy: String {
        shots > 0 ? String(format: "%.1f%%", Double(makes) / Double(shots) * 100) : "—"
    }
    var body: some View {
        CanonicalScreen(testID: "screen-ios-workout-completion") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    HStack(alignment: .center, spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("WORKOUT COMPLETE").shotiqDisplay(34)
                            Text("Great session, \(app.user?.firstName ?? "Jordan").")
                                .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                        }
                        Spacer(minLength: 8)
                        NavigationLink { WorkoutCalendarView() } label: {
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                        }
                        .buttonStyle(.plain)
                        VRule(height: 46)
                        NavigationLink { PlayerCardView() } label: {
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20).padding(.top, 14)
                    VStack(alignment: .leading, spacing: 0) {
                        ShotIQCard {
                            HStack(spacing: 0) {
                                completionStat("scope", "\(shots)", "SHOTS", ShotIQColor.ink)
                                VRule(height: 54)
                                completionStat("target", "\(makes)", "MAKES", ShotIQColor.ink)
                                VRule(height: 54)
                                completionStat("gauge", accuracy, "ACCURACY", ShotIQColor.ink)
                                VRule(height: 54)
                                completionStat("chart.line.uptrend.xyaxis", "+210", "POINTS EARNED", ShotIQColor.ink)
                            }
                            .padding(.vertical, 16)
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            HStack(spacing: 0) {
                                PhotoThumb(width: 200, height: 210, photo: "062-visual-001")
                                VStack(alignment: .leading, spacing: 6) {
                                    MicroLabel(text: "FORM SCORE")
                                    Text("82").font(.custom("Tungsten-Medium", size: 58))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: 0.82).frame(width: 96)
                                    Text("GOOD").shotiqBody(13, weight: .bold)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("Keep building consistency.")
                                        .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .padding(14)
                                Spacer(minLength: 0)
                            }
                        }
                        .padding(.top, 12)
                        SectionLabel(text: "PHASE BREAKDOWN").padding(.top, 20)
                        HStack(alignment: .top) {
                            ForEach([("SETUP", "80"), ("LOAD", "78"), ("RISE", "84"),
                                     ("RELEASE", "82"), ("FOLLOW-THROUGH", "85")], id: \.0) { p in
                                VStack(spacing: 4) {
                                    PhaseGlyph(phase: p.0, active: p.0 == "RELEASE", size: 28)
                                    Text(p.0).shotiqBody(8, weight: p.0 == "RELEASE" ? .bold : .regular)
                                        .kerning(0.3)
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Text(p.1).font(.custom("Tungsten-Medium", size: 16))
                                        .foregroundStyle(p.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.top, 10)
                        ShotIQCard {
                            HStack(spacing: 14) {
                                CorrectionGlyph(kind: .stack, size: 38).foregroundStyle(ShotIQColor.ink)
                                    .padding(10)
                                    .overlay(Circle().stroke(ShotIQColor.rule))
                                VStack(alignment: .leading, spacing: 6) {
                                    MicroLabel(text: "PRIMARY TARGET")
                                    Text("Keep elbow stacked through release").shotiqBody(15, weight: .bold)
                                        .lineLimit(1).minimumScaleFactor(0.8)
                                    HStack(spacing: 10) {
                                        ScoreBar(pct: 0.8, color: ShotIQColor.confirmGreen)
                                        Text("8 / 10").font(.custom("Tungsten-Medium", size: 16))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                    }
                                    Text("Progress this session").shotiqBody(11)
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 12) {
                                ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "viewfinder"),
                                                         size: 32,
                                                         label: nil)
                                VStack(alignment: .leading, spacing: 5) {
                                    MicroLabel(text: "COACHING TAKEAWAY")
                                    Text("Nice arc and balance. Your release path is clean. Focus on keeping your elbow in line on fatigue.")
                                        .shotiqBody(12).foregroundStyle(ShotIQColor.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 10)
                        NavigationLink { DrillDetailView(name: "Elbow Stack Builder") } label: {
                            ShotIQCard {
                                HStack(spacing: 12) {
                                    Circle().fill(ShotIQColor.analysisBlue).frame(width: 44, height: 44)
                                        .overlay(ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-training-goal",
                                                                         size: 22,
                                                                         label: nil))
                                    VStack(alignment: .leading, spacing: 2) {
                                        MicroLabel(text: "NEXT RECOMMENDATION")
                                        Text("Elbow Stack Builder").shotiqBody(15, weight: .semibold)
                                        Text("15 min • Form Focus — Build alignment and repeatable release.")
                                            .shotiqBody(11).foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(1).minimumScaleFactor(0.8)
                                    }
                                    Spacer(minLength: 4)
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(14)
                            }
                        }
                        .padding(.top, 10)
                        HStack(spacing: 10) {
                            NavigationLink { ShotBreakdownView() } label: {
                                HStack(spacing: 6) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-onboarding-review",
                                                             size: 14,
                                                             label: nil)
                                    Text("Review shots").shotiqBody(13, weight: .semibold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 50)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.shotiqOrange))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                            ShareLink(item: "ShotIQ workout complete — \(makes)/\(shots) makes (\(accuracy)). 🏀") {
                                HStack(spacing: 6) {
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-share",
                                                             size: 14,
                                                             label: nil)
                                    Text("Share progress").shotiqBody(13, weight: .semibold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 50)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.analysisBlue))
                                .foregroundStyle(ShotIQColor.analysisBlue)
                            }
                            NavigationLink { DrillExecutionView(drillName: drillName) } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "arrow.clockwise").font(.system(size: 12))
                                    Text("Repeat drill").shotiqBody(13, weight: .semibold)
                                        .lineLimit(1).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity).frame(height: 50)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                        }
                        .padding(.vertical, 20)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    /// Canonical 062 prints four clearly different marks across this row. The
    /// shipped screen used `scope` for SHOTS and `target` for MAKES — two SF
    /// concentric rings that both graders read as the same icon.
    private func completionStat(_ icon: String, _ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 4) {
            StatMarkGlyph(kind: StatMarkGlyph.kind(forStatLabel: label) ?? .volume, size: 18)
                .foregroundStyle(ShotIQColor.ink)
            Text(value).font(.custom("Tungsten-Medium", size: 28)).foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(label).shotiqBody(8, weight: .medium).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }
}
