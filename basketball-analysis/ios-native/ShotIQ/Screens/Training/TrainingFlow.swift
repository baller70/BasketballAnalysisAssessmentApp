import SwiftUI

// Training flow — screens 054-062. Drill execution mirrors the web contract:
// marks POST to /api/shot-events via APIClient.

// MARK: - Shared training helpers (canonical 054 look)

/// Light placeholder standing in for court photography (canonical thumbnails).
struct PhotoThumb: View {
    var width: CGFloat? = nil
    var height: CGFloat
    var icon: String = "figure.basketball"
    var body: some View {
        RoundedRectangle(cornerRadius: 6)
            .fill(ShotIQColor.warmCanvas)
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
            .overlay(Image(systemName: icon).font(.system(size: min(height, 44) * 0.42))
                .foregroundStyle(ShotIQColor.muted))
            .frame(width: width, height: height)
    }
}

/// Small gray capsule chip (canonical drill meta tags).
struct TagChip: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(ShotIQColor.graphite)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .background(ShotIQColor.warmCanvas, in: Capsule())
            .lineLimit(1)
    }
}

/// Tiny caps label used above values inside canonical cards.
struct MicroLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .semibold))
            .kerning(0.7)
            .foregroundStyle(ShotIQColor.graphite)
    }
}

struct VRule: View {
    var height: CGFloat = 36
    var body: some View { Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: height) }
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
                                PhaseGlyph(active: true, size: 54)
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
                                Image(systemName: "camera.viewfinder")
                                Text("Quick start").font(.system(size: 17, weight: .medium))
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
                            HStack(spacing: 4) {
                                Text("View all").font(.system(size: 13))
                                Image(systemName: "chevron.right").font(.system(size: 11))
                            }
                            .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 22)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                ForEach(Array(savedDrills.enumerated()), id: \.offset) { i, d in
                                    NavigationLink { DrillDetailView(name: d.0) } label: {
                                        HStack(spacing: 10) {
                                            PhotoThumb(width: 84, height: 76)
                                            PhaseGlyph(active: i == 0, size: 28)
                                            VStack(alignment: .leading, spacing: 5) {
                                                Text(d.0).shotiqBody(15, weight: .semibold)
                                                    .lineLimit(1).minimumScaleFactor(0.8)
                                                HStack(spacing: 6) {
                                                    ForEach(d.1, id: \.self) { TagChip(text: $0) }
                                                }
                                                Text(d.2).font(.system(size: 11))
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
                            Text("Today at 8:24 AM").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 22)
                        NavigationLink { ShotTrackerView() } label: {
                            ShotIQCard {
                                HStack(spacing: 0) {
                                    PhotoThumb(width: 100, height: 128)
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("Quick Release Builder").shotiqBody(15, weight: .semibold)
                                            .lineLimit(1).minimumScaleFactor(0.8)
                                        HStack(spacing: 14) {
                                            StatBlock(value: "24", label: "SHOTS", valueSize: 22)
                                            StatBlock(value: "15", label: "MAKES", valueSize: 22)
                                            StatBlock(value: "62.5%", label: "MAKE %", valueSize: 22)
                                        }
                                        HStack(spacing: 7) {
                                            Text("GOOD").font(.system(size: 10, weight: .bold))
                                                .foregroundStyle(ShotIQColor.analysisBlue)
                                            Text("Keep building consistency.").font(.system(size: 11))
                                                .foregroundStyle(ShotIQColor.graphite)
                                                .lineLimit(1).minimumScaleFactor(0.8)
                                        }
                                    }
                                    .padding(12)
                                    Spacer(minLength: 0)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("FORM SCORE").font(.system(size: 9, weight: .semibold)).kerning(0.6)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("82").font(.custom("DINCondensed-Bold", size: 44))
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
                Image(systemName: icon).font(.system(size: 22)).foregroundStyle(ShotIQColor.ink)
                Text(title).font(.system(size: 14, weight: .medium)).foregroundStyle(ShotIQColor.ink)
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
                            .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 6)
                        HStack(alignment: .top, spacing: 16) {
                            PhotoThumb(height: 190).frame(maxWidth: .infinity)
                            VStack(alignment: .leading, spacing: 6) {
                                MicroLabel(text: "FORM SCORE")
                                Text("82").font(.custom("DINCondensed-Bold", size: 52))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                ScoreBar(pct: 0.82).frame(width: 96)
                                Text("GOOD").font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                Text("Keep building consistency.")
                                    .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .frame(width: 112, alignment: .leading)
                        }
                        .padding(.top, 16)
                        SectionLabel(text: "SHOT RAIL FOCUS").padding(.top, 22)
                        PhaseStrip().padding(.top, 10)
                        VStack(alignment: .leading, spacing: 6) {
                            MicroLabel(text: "PRIMARY COACHING TARGET")
                            HStack {
                                Text("Keep elbow stacked through release").shotiqBody(18, weight: .bold)
                                    .lineLimit(1).minimumScaleFactor(0.8)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                            }
                        }
                        .padding(.vertical, 14)
                        .overlay(HRule(), alignment: .top)
                        .overlay(HRule(), alignment: .bottom)
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
                                Image(systemName: "camera.viewfinder")
                                Text("Start shot tracking").font(.system(size: 17, weight: .medium))
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
                StatBlock(value: "\(value.wrappedValue)", label: unit, valueSize: 38)
                Spacer()
                Image(systemName: icon).font(.system(size: 24)).foregroundStyle(ShotIQColor.graphite)
            }
            Text(caption).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
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
    @State private var filter = "All Flaws"
    private let drills: [(String, String, String, String)] = [
        ("STACK & SHOOT", "Beginner", "8 min", "Builds stacked elbow position and a straight shooting line."),
        ("WRIST STAY DRILL", "Beginner", "6 min", "Keeps wrist neutral for a clean, consistent release."),
        ("ALIGN & EXTEND", "Intermediate", "10 min", "Promotes full extension and vertical ball flight.")
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-discover-drills") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    TopBar()
                    PlayerHeader(name: app.user?.displayName ?? "Jordan Ellis")
                    VStack(alignment: .leading, spacing: 0) {
                        Text("DISCOVER DRILLS").shotiqDisplay(38).padding(.top, 16)
                        Text("Drills to address your mechanics and reach your targets.")
                            .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                        HStack(spacing: 10) {
                            HStack(spacing: 8) {
                                Image(systemName: "magnifyingglass")
                                    .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                                TextField("Search drills", text: $query).font(.system(size: 15))
                            }
                            .padding(.horizontal, 12).frame(height: 46)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            Button {} label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "slider.horizontal.3").font(.system(size: 14))
                                    Text("Filters").font(.system(size: 14, weight: .medium))
                                }
                                .padding(.horizontal, 14).frame(height: 46)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                .foregroundStyle(ShotIQColor.ink)
                            }
                        }
                        .padding(.top, 12)
                        SectionLabel(text: "RECOMMENDED FOR YOUR TARGET").padding(.top, 18)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 12) {
                                PhaseGlyph(active: true, size: 44)
                                    .padding(9)
                                    .overlay(RoundedRectangle(cornerRadius: 8)
                                        .stroke(ShotIQColor.rule, style: StrokeStyle(lineWidth: 1, dash: [4])))
                                VStack(alignment: .leading, spacing: 10) {
                                    MicroLabel(text: "PRIMARY COACHING TARGET")
                                    HStack {
                                        Text("Keep elbow stacked through release").shotiqBody(15, weight: .semibold)
                                            .lineLimit(1).minimumScaleFactor(0.8)
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    HRule()
                                    MicroLabel(text: "RELATED FLAWS DETECTED")
                                    HStack(spacing: 14) {
                                        ForEach(["Elbow flare", "Early wrist bend", "Left lean"], id: \.self) { f in
                                            HStack(spacing: 5) {
                                                PhaseGlyph(size: 16)
                                                Text(f).font(.system(size: 11)).foregroundStyle(ShotIQColor.ink)
                                                    .lineLimit(1).minimumScaleFactor(0.7)
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
                                    Button { filter = f } label: {
                                        HStack(spacing: 4) {
                                            Text(f).font(.system(size: 13, weight: filter == f ? .semibold : .regular))
                                            Image(systemName: "chevron.down").font(.system(size: 9))
                                        }
                                        .padding(.horizontal, 12).frame(height: 38)
                                        .overlay(RoundedRectangle(cornerRadius: 8)
                                            .stroke(filter == f ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                                        .foregroundStyle(filter == f ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                    }
                                }
                            }
                        }
                        .padding(.top, 10)
                        HStack(spacing: 5) {
                            Image(systemName: "arrow.up.arrow.down").font(.system(size: 12))
                            Text("Sort:").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            Text("Recommended").font(.system(size: 13, weight: .semibold))
                            Image(systemName: "chevron.down").font(.system(size: 9))
                            Spacer()
                            Text("128 drills").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 12)
                        ForEach(drills, id: \.0) { d in
                            NavigationLink { DrillDetailView(name: d.0) } label: {
                                ShotIQCard {
                                    HStack(spacing: 0) {
                                        PhotoThumb(width: 104, height: 158)
                                        VStack(alignment: .leading, spacing: 8) {
                                            HStack(alignment: .top) {
                                                Text(d.0).shotiqDisplay(20).lineLimit(1)
                                                Spacer()
                                                Image(systemName: "bookmark")
                                                    .font(.system(size: 15)).foregroundStyle(ShotIQColor.ink)
                                            }
                                            HStack(spacing: 8) {
                                                HStack(spacing: 4) {
                                                    ForEach(0..<4, id: \.self) { i in
                                                        PhaseGlyph(active: i == 3, size: 15)
                                                    }
                                                }
                                                Text("Release").font(.system(size: 11, weight: .medium))
                                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                                Text("· \(d.1) · \(d.2)").font(.system(size: 11))
                                                    .foregroundStyle(ShotIQColor.graphite)
                                                    .lineLimit(1).minimumScaleFactor(0.7)
                                            }
                                            Text(d.3).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                                .lineLimit(2).multilineTextAlignment(.leading)
                                                .fixedSize(horizontal: false, vertical: true)
                                            HStack {
                                                Spacer()
                                                Text("View drill").font(.system(size: 13, weight: .semibold))
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
                            Image(systemName: "bookmark")
                            Image(systemName: "square.and.arrow.up")
                        }
                        .font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
                    }
                    .padding(.horizontal, 20).frame(height: 52)
                    .overlay(HRule(), alignment: .bottom)
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                MicroLabel(text: "DRILL DETAIL")
                                Text(name.uppercased()).shotiqDisplay(30)
                                Text("Build a tight, controlled release by stacking your elbow and wrist through extension.")
                                    .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            PhotoThumb(width: 138, height: 160)
                                .overlay(alignment: .bottomTrailing) {
                                    VStack(spacing: 2) {
                                        Text("FORM SCORE").font(.system(size: 7, weight: .semibold)).kerning(0.5)
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("82").font(.custom("DINCondensed-Bold", size: 26))
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
                                .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
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
                                                Text("\(i + 1)").font(.custom("DINCondensed-Bold", size: 15))
                                                    .foregroundStyle(.white)
                                                    .frame(width: 22, height: 22)
                                                    .background(ShotIQColor.shotiqOrange, in: Circle())
                                                    .offset(x: -6, y: -6)
                                            }
                                        Text(s.0).font(.system(size: 11, weight: .bold)).kerning(0.5)
                                            .foregroundStyle(s.0 == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                        Text(s.1).font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
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
                                    .font(.system(size: 15)).italic()
                                    .foregroundStyle(ShotIQColor.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            VRule(height: 120)
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "TARGET MECHANICS")
                                ForEach(mechanics, id: \.0) { m in
                                    HStack(alignment: .top, spacing: 8) {
                                        PhaseGlyph(size: 18)
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(m.0).font(.system(size: 12, weight: .semibold))
                                            Text(m.1).font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
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
                                    .font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
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
                                    Text("Start drill").font(.system(size: 17, weight: .medium))
                                }
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            squareButton("calendar")
                            squareButton("play.rectangle")
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
            Image(systemName: icon).font(.system(size: 15)).foregroundStyle(ShotIQColor.ink)
            Text(label).font(.system(size: 8, weight: .semibold)).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
            Text(value).font(.system(size: 12, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }
    private func buildColumn(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 20)).foregroundStyle(ShotIQColor.ink)
            Text(label).font(.system(size: 7.5, weight: .semibold)).kerning(0.4)
                .foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
        }
        .frame(width: 62)
    }
    private func equipCard(_ icon: String, _ title: String, _ caption: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(ShotIQColor.ink).frame(width: 26)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.system(size: 13, weight: .semibold))
                Text(caption).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
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
            Text(label).font(.system(size: 11)).foregroundStyle(ShotIQColor.ink)
        }
    }
    private func squareButton(_ icon: String) -> some View {
        Button {} label: {
            Image(systemName: icon).font(.system(size: 18))
                .frame(width: 54, height: 54)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                .foregroundStyle(ShotIQColor.ink)
        }
    }
}

// APPEND-058
