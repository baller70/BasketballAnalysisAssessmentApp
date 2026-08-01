import SwiftUI

// Analysis flow — screens 036-047. Pose overlays and gauges are Canvas/Path.

// MARK: - Shared canonical fragments for this flow

/// "PRIMARY COACHING TARGET / Keep elbow stacked through release" row (037-040).
fileprivate struct CoachTargetCard: View {
    var bordered = true
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("PRIMARY COACHING TARGET")
                    .font(.system(size: 11, weight: .semibold)).kerning(0.8)
                    .foregroundStyle(ShotIQColor.graphite)
                Text("Keep elbow stacked through release")
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(ShotIQColor.ink)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(bordered ? ShotIQColor.rule : .clear))
    }
}

/// "24 SHOTS | 15 MAKES | 62.5% MAKE % | trend +8.1%" strip (037/039/040).
fileprivate struct SessionStatsStrip: View {
    var body: some View {
        HStack(spacing: 0) {
            StatBlock(value: "24", label: "SHOTS", valueSize: 28).frame(maxWidth: .infinity, alignment: .leading)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
            StatBlock(value: "15", label: "MAKES", valueSize: 28).frame(maxWidth: .infinity)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
            StatBlock(value: "62.5%", label: "MAKE %", valueSize: 28).frame(maxWidth: .infinity)
            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
            VStack(spacing: 3) {
                TrendLine(points: [58, 66, 61, 70]).frame(width: 74, height: 22)
                HStack(spacing: 3) {
                    Text("+8.1%").font(.system(size: 11, weight: .bold)).foregroundStyle(ShotIQColor.confirmGreen)
                    Text("vs last session").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                }
                .lineLimit(1).minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity)
        }
    }
}

/// Orange DIN form-score numeral with ScoreBar + blue GOOD verdict.
fileprivate struct FormScorePanel: View {
    var numeralSize: CGFloat = 64
    var barWidth: CGFloat = 130
    var caption = "Keep building consistency."
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("FORM SCORE").font(.system(size: 12, weight: .semibold)).kerning(0.8)
                .foregroundStyle(ShotIQColor.graphite)
            Text("82").font(.custom("DINCondensed-Bold", size: numeralSize))
                .foregroundStyle(ShotIQColor.shotiqOrange)
                .lineLimit(1)
            ScoreBar(pct: 0.82).frame(width: barWidth)
            Text("GOOD").font(.custom("DINCondensed-Bold", size: 18))
                .foregroundStyle(ShotIQColor.analysisBlue).padding(.top, 6)
            Text(caption).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

struct AnalysisProcessingView: View { // 036
    @State private var pct = 0.12
    @State private var long = false
    @State private var done = false
    private let steps: [(String, String, Int)] = [ // icon, label, state: 0 done, 1 active, 2 queued
        ("viewfinder", "Upload complete", 0),
        ("point.3.connected.trianglepath.dotted", "Detecting pose & landmarks", 1),
        ("angle", "Scoring mechanics", 2),
        ("chart.dots.scatter", "Comparing to your baseline", 2),
        ("doc.text", "Building coaching plan", 2),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-processing") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            Text("ANALYSIS PROCESSING").shotiqDisplay(34).padding(.top, 18)
                            Text("Shot Rail AI is reviewing your mechanics and building your results.")
                                .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                                .padding(.top, 4)
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 0) {
                                    Text("PROCESSING VIDEO").font(.custom("DINCondensed-Bold", size: 19))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("1080p • 24s • 30fps").font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 2)
                                    HStack(spacing: 12) {
                                        ScoreBar(pct: pct, color: ShotIQColor.analysisBlue)
                                        Text("\(Int(pct * 100))%").font(.custom("DINCondensed-Bold", size: 22))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                    }
                                    .padding(.top, 14)
                                    ForEach(steps, id: \.1) { icon, label, state in
                                        HStack(spacing: 14) {
                                            Image(systemName: icon).font(.system(size: 17))
                                                .foregroundStyle(state == 2 ? ShotIQColor.ink : ShotIQColor.analysisBlue)
                                                .frame(width: 26)
                                            Text(label).shotiqBody(15)
                                            Spacer()
                                            switch state {
                                            case 0:
                                                Image(systemName: "checkmark.circle.fill")
                                                    .font(.system(size: 20)).foregroundStyle(ShotIQColor.analysisBlue)
                                            case 1:
                                                ProgressView().tint(ShotIQColor.analysisBlue)
                                            default:
                                                Text("Queued").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                            }
                                        }
                                        .padding(.vertical, 13)
                                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                                    }
                                    .padding(.top, 2)
                                }
                                .padding(16)
                            }
                            .padding(.top, 16)
                            SectionLabel(text: "LIVE FRAME PREVIEW").padding(.top, 20)
                            HStack(alignment: .top, spacing: 16) {
                                ZStack { MediaSurface(height: 200); SkeletonOverlay() }
                                    .frame(maxWidth: .infinity)
                                FormScorePanel(numeralSize: 56, barWidth: 90)
                                    .frame(width: 110, alignment: .leading)
                            }
                            .padding(.top, 8)
                            PhaseStrip().padding(.top, 16)
                            ShotIQCard {
                                HStack(alignment: .top, spacing: 14) {
                                    Image(systemName: "clock").font(.system(size: 28, weight: .light))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Keep app open").font(.system(size: 17, weight: .semibold))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Text("We'll notify you when your results are ready.\nYou can switch tasks — analysis will continue in the background.")
                                            .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                    Spacer(minLength: 0)
                                }
                                .padding(16)
                            }
                            .padding(.top, 18)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
        .task {
            for _ in 0..<8 {
                try? await Task.sleep(for: .seconds(0.5))
                pct = min(0.94, pct + 0.11)
            }
            done = true
        }
        .navigationDestination(isPresented: $done) { AnalysisResultOverviewView() }
        .navigationDestination(isPresented: $long) { AnalysisTakingLongerView() }
    }
}

struct AnalysisTakingLongerView: View { // 037
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-taking-longer") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            ShotIQCard {
                                VStack(spacing: 0) {
                                    ZStack {
                                        Circle().stroke(ShotIQColor.rule,
                                                        style: StrokeStyle(lineWidth: 2, dash: [5, 6]))
                                        Circle().trim(from: 0, to: 0.28)
                                            .stroke(ShotIQColor.analysisBlue,
                                                    style: StrokeStyle(lineWidth: 5, lineCap: .round))
                                            .rotationEffect(.degrees(-60))
                                        Image(systemName: "point.topleft.down.to.point.bottomright.curvepath")
                                            .font(.system(size: 24)).foregroundStyle(ShotIQColor.analysisBlue)
                                    }
                                    .frame(width: 96, height: 96)
                                    Text("ANALYSIS TAKING LONGER").shotiqDisplay(28)
                                        .multilineTextAlignment(.center).padding(.top, 20)
                                    Text("High-quality biomechanical analysis can take several minutes. Your shot is being processed in the background.")
                                        .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                                        .multilineTextAlignment(.center).padding(.top, 6)
                                    HStack(alignment: .top, spacing: 8) {
                                        stage("film", "Upload complete", "100%", false)
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 24, height: 1).padding(.top, 16)
                                        stage("point.3.connected.trianglepath.dotted", "Analyzing motion", "Estimating key angles", true)
                                        Rectangle().fill(ShotIQColor.rule).frame(width: 24, height: 1).padding(.top, 16)
                                        stage("doc.text", "Building insights", "Pending", false)
                                    }
                                    .padding(.top, 22)
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 20)
                                    HStack(alignment: .top, spacing: 14) {
                                        Image(systemName: "clock").font(.system(size: 30, weight: .light))
                                            .foregroundStyle(ShotIQColor.ink)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("We'll notify you when it's ready")
                                                .font(.system(size: 16, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                            Text("You'll get a notification and can view results anytime.")
                                                .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                        }
                                        Spacer(minLength: 0)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.top, 18)
                                }
                                .padding(18)
                            }
                            .padding(.top, 14)
                            PrimaryButton(title: "Notify me when ready", icon: "bell", color: ShotIQColor.analysisBlue)
                                .padding(.top, 16)
                            SecondaryButton(title: "Keep waiting", icon: "arrow.2.circlepath").padding(.top, 10)
                            SecondaryButton(title: "Cancel analysis", icon: "xmark").padding(.top, 10)
                            HStack {
                                SectionLabel(text: "ANALYSIS QUEUE")
                                Spacer()
                                Text("1 ahead of you").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 22)
                            ShotIQCard {
                                HStack(spacing: 14) {
                                    RoundedRectangle(cornerRadius: 4).fill(ShotIQColor.rule)
                                        .frame(width: 84, height: 56)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("Today • 8:22 AM").shotiqBody(14)
                                        Text("Set 1 • 24 shots").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                    Image(systemName: "clock").font(.system(size: 16)).foregroundStyle(ShotIQColor.ink)
                                    Text("Estimated\n2–4 min").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(12)
                            }
                            .padding(.top, 8)
                            PhaseStrip().padding(.top, 18)
                            CoachTargetCard(bordered: false)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                                .padding(.top, 14)
                            SessionStatsStrip()
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                                .padding(.top, 4)
                                .padding(.vertical, 10)
                            Spacer(minLength: 20)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private func stage(_ icon: String, _ title: String, _ sub: String, _ active: Bool) -> some View {
        VStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 24, weight: .light))
                .foregroundStyle(active ? ShotIQColor.analysisBlue : ShotIQColor.ink)
            Text(title).font(.system(size: 12)).foregroundStyle(ShotIQColor.ink)
                .multilineTextAlignment(.center)
            Text(sub).font(.system(size: 11))
                .foregroundStyle(active ? ShotIQColor.analysisBlue : ShotIQColor.graphite)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

struct AnalysisResultOverviewView: View { // 038
    private let metrics: [(String, String, String, String, Bool)] = [
        // icon, label, value, verdict, excellent
        ("figure.basketball", "RELEASE HEIGHT", "7'8\"", "EXCELLENT", true),
        ("angle", "RELEASE ANGLE", "52°", "GOOD", false),
        ("point.3.filled.connected.trianglepath.dotted", "ELBOW ALIGNMENT", "93%", "GOOD", false),
        ("point.bottomleft.forward.to.point.topright.scurvepath", "SHOT ARC", "46°", "GOOD", false),
        ("scope", "SPIN RATE", "8.6", "GOOD", false),
        ("viewfinder", "CENTEREDNESS", "92%", "EXCELLENT", true),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-result-overview") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        // Section tab strip: active ANALYSIS RESULT underlined orange.
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 24) {
                                VStack(spacing: 8) {
                                    Text("ANALYSIS RESULT").font(.system(size: 13, weight: .bold)).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Rectangle().fill(ShotIQColor.shotiqOrange).frame(height: 3)
                                }
                                .fixedSize()
                                stripLink("FLAWS", FlawsOverviewView())
                                stripLink("PLAYER", PlayerCardView())
                                stripLink("COMPARE", EliteMatchView())
                                Text("TRAINING").font(.system(size: 13, weight: .semibold)).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                                Text("GOALS").font(.system(size: 13, weight: .semibold)).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.horizontal, 20)
                        }
                        .padding(.top, 16)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top, spacing: 18) {
                                ZStack { MediaSurface(height: 220); SkeletonOverlay() }
                                    .frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 0) {
                                    NavigationLink { FormScoreView() } label: {
                                        FormScorePanel(numeralSize: 62, barWidth: 96)
                                    }
                                    HStack(spacing: 14) {
                                        miniStat("24", "SHOTS")
                                        miniStat("15", "MAKES")
                                        miniStat("62.5%", "MAKE %")
                                    }
                                    .padding(.top, 14)
                                }
                                .frame(width: 140, alignment: .leading)
                            }
                            .padding(.top, 16)
                            PhaseStrip().padding(.top, 16)
                            NavigationLink { FlawsOverviewView() } label: { CoachTargetCard() }
                                .padding(.top, 16)
                            HStack(spacing: 6) {
                                SectionLabel(text: "YOUR SIX KEY METRICS")
                                Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 22)
                            ShotIQCard {
                                VStack(spacing: 0) {
                                    metricRow(Array(metrics.prefix(3)))
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                    metricRow(Array(metrics.suffix(3)))
                                }
                            }
                            .padding(.top, 8)
                            HStack {
                                HStack(spacing: 6) {
                                    SectionLabel(text: "ELITE MATCH")
                                    Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                HStack(spacing: 3) {
                                    Text("How it works").font(.system(size: 13)).foregroundStyle(ShotIQColor.analysisBlue)
                                    Image(systemName: "chevron.right").font(.system(size: 11)).foregroundStyle(ShotIQColor.analysisBlue)
                                }
                            }
                            .padding(.top, 22)
                            NavigationLink { EliteMatchView() } label: {
                                ShotIQCard {
                                    HStack(spacing: 14) {
                                        RoundedRectangle(cornerRadius: 6).fill(ShotIQColor.rule)
                                            .frame(width: 84, height: 104)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("KLAY THOMPSON").shotiqDisplay(22)
                                            Text("Golden State Warriors").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                            matchLine("point.3.connected.trianglepath.dotted", "Release Angle", "51°")
                                            matchLine("figure.basketball", "Elbow Alignment", "95%")
                                            matchLine("point.bottomleft.forward.to.point.topright.scurvepath", "Shot Arc", "46°")
                                        }
                                        Spacer()
                                        VStack(spacing: 4) {
                                            Ring(pct: 0.88, color: ShotIQColor.analysisBlue, lineWidth: 7)
                                                .frame(width: 74, height: 74)
                                                .overlay(Text("88%").font(.custom("DINCondensed-Bold", size: 24)))
                                            Text("OVERALL MATCH").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                                                .foregroundStyle(ShotIQColor.graphite)
                                        }
                                    }
                                    .padding(14)
                                }
                            }
                            .padding(.top, 8)
                            NavigationLink { ShotBreakdownView() } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "film")
                                    Text("View shot breakdown").font(.system(size: 17, weight: .medium))
                                }
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                                .foregroundStyle(.white)
                            }
                            .padding(.top, 20)
                            NavigationLink { ShareResultsView() } label: {
                                HStack {
                                    Image(systemName: "square.and.arrow.up").font(.system(size: 16))
                                    Text("Share analysis").font(.system(size: 16))
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                                .padding(.horizontal, 16).frame(height: 52)
                                .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
                            }
                            .padding(.top, 10)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private func stripLink(_ t: String, _ dest: some View) -> some View {
        NavigationLink { dest } label: {
            Text(t).font(.system(size: 13, weight: .semibold)).kerning(0.6)
                .foregroundStyle(ShotIQColor.graphite)
        }
    }
    private func miniStat(_ v: String, _ l: String) -> some View {
        VStack(spacing: 2) {
            Text(v).font(.custom("DINCondensed-Bold", size: 22)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
            Text(l).font(.system(size: 8, weight: .medium)).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
        }
    }
    private func metricRow(_ row: [(String, String, String, String, Bool)]) -> some View {
        HStack(spacing: 0) {
            ForEach(row, id: \.1) { icon, label, value, verdict, excellent in
                VStack(spacing: 5) {
                    Image(systemName: icon).font(.system(size: 22, weight: .light))
                        .foregroundStyle(ShotIQColor.ink).frame(height: 30)
                    Text(label).font(.system(size: 8, weight: .semibold)).kerning(0.4)
                        .foregroundStyle(ShotIQColor.graphite)
                        .lineLimit(1).minimumScaleFactor(0.6)
                    Text(value).font(.custom("DINCondensed-Bold", size: 26)).foregroundStyle(ShotIQColor.ink)
                    Text(verdict).font(.system(size: 9, weight: .bold)).kerning(0.4)
                        .foregroundStyle(excellent ? ShotIQColor.confirmGreen : ShotIQColor.analysisBlue)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                if label != row.last?.1 {
                    Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 10)
                }
            }
        }
    }
    private func matchLine(_ icon: String, _ label: String, _ value: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 11)).foregroundStyle(ShotIQColor.ink).frame(width: 14)
            Text(label).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
            Text(value).font(.system(size: 12, weight: .semibold)).foregroundStyle(ShotIQColor.analysisBlue)
        }
    }
}

/// Normalized-keypoint pose overlay drawn through the surface's fit transform.
struct SkeletonOverlay: View {
    // normalized (0-1) demo keypoints: ankle→knee→hip→shoulder→elbow→wrist + ball
    let joints: [CGPoint] = [
        .init(x: 0.47, y: 0.9), .init(x: 0.46, y: 0.72), .init(x: 0.5, y: 0.55),
        .init(x: 0.52, y: 0.36), .init(x: 0.6, y: 0.27), .init(x: 0.66, y: 0.18),
    ]
    var ball = CGPoint(x: 0.7, y: 0.12)
    var body: some View {
        Canvas { ctx, size in
            func pt(_ p: CGPoint) -> CGPoint { CGPoint(x: p.x * size.width, y: p.y * size.height) }
            var path = Path()
            path.move(to: pt(joints[0]))
            joints.dropFirst().forEach { path.addLine(to: pt($0)) }
            ctx.stroke(path, with: .color(.white), style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
            for j in joints {
                ctx.stroke(Path(ellipseIn: CGRect(origin: pt(j).applying(.init(translationX: -5, y: -5)),
                                                  size: CGSize(width: 10, height: 10))),
                           with: .color(ShotIQColor.shotiqOrange), lineWidth: 2.5)
            }
            ctx.stroke(Path(ellipseIn: CGRect(origin: pt(ball).applying(.init(translationX: -8, y: -8)),
                                              size: CGSize(width: 16, height: 16))),
                       with: .color(ShotIQColor.shotiqOrange), lineWidth: 3)
        }
        .accessibilityHidden(true)
    }
}

struct NoAnalysisYetView: View {    // 039
    var body: some View {
        CanonicalScreen(testID: "screen-ios-no-analysis-yet") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            NavigationLink { AnalyzeHubView() } label: {
                                HStack(spacing: 12) {
                                    Image(systemName: "viewfinder").font(.system(size: 20))
                                    Text("Analyze a shot").font(.system(size: 19, weight: .semibold))
                                }
                                .frame(maxWidth: .infinity).frame(height: 62)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 8))
                                .foregroundStyle(.white)
                            }
                            .padding(.top, 16)
                            sourceRow.padding(.top, 12)
                            HStack {
                                SectionLabel(text: "ANALYSIS HISTORY")
                                Spacer()
                                Text("0 ANALYSES").font(.system(size: 12, weight: .semibold)).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 24)
                            VStack(spacing: 0) {
                                PhaseGlyph(active: true, size: 120)
                                Text("NO ANALYSES YET").shotiqDisplay(30).padding(.top, 18)
                                Text("Upload a shot or record live to get AI-powered breakdowns of your mechanics.")
                                    .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                                    .multilineTextAlignment(.center).padding(.horizontal, 24).padding(.top, 6)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.top, 26)
                            sourceRow.padding(.top, 24)
                            PhaseStrip().padding(.top, 22)
                            CoachTargetCard(bordered: false)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                                .padding(.top, 14)
                            VStack(alignment: .leading, spacing: 8) {
                                SectionLabel(text: "LATEST SESSION")
                                SessionStatsStrip()
                            }
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            .padding(.vertical, 10)
                            Spacer(minLength: 20)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private var sourceRow: some View {
        HStack(spacing: 12) {
            sourceCard("photo.on.rectangle", "Upload image")
            sourceCard("film", "Upload video")
            sourceCard("point.3.connected.trianglepath.dotted", "Live camera")
        }
    }
    private func sourceCard(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 26, weight: .light)).foregroundStyle(ShotIQColor.ink)
            Text(label).font(.system(size: 14)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity).frame(height: 96)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct AnalysisErrorView: View {    // 040
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-error") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top, spacing: 16) {
                                ZStack(alignment: .bottomTrailing) {
                                    Image(systemName: "viewfinder").font(.system(size: 40, weight: .light))
                                        .foregroundStyle(ShotIQColor.ink)
                                    Image(systemName: "exclamationmark.triangle")
                                        .font(.system(size: 18)).foregroundStyle(ShotIQColor.reviewRed)
                                        .offset(x: 6, y: 6)
                                }
                                .frame(width: 56)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("ANALYSIS ERROR").font(.custom("DINCondensed-Bold", size: 24))
                                        .foregroundStyle(ShotIQColor.reviewRed)
                                    Text("We couldn't complete the analysis.")
                                        .font(.system(size: 16, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                    Text("Not enough of your body was visible in this clip.")
                                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(16)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.reviewRed))
                            .padding(.top, 14)
                            PrimaryButton(title: "Try analysis again", icon: "viewfinder", color: ShotIQColor.analysisBlue)
                                .padding(.top, 14)
                            HStack(spacing: 12) {
                                halfButton("point.3.connected.trianglepath.dotted", "Choose another frame")
                                halfButton("headphones", "Contact support")
                            }
                            .padding(.top, 10)
                            HStack(alignment: .top, spacing: 16) {
                                ZStack { MediaSurface(height: 250); SkeletonOverlay() }
                                    .frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 0) {
                                    FormScorePanel(numeralSize: 56, barWidth: 110)
                                    Text("SHOT QUALITY").font(.system(size: 12, weight: .semibold)).kerning(0.8)
                                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 16)
                                    Text("FRAME 18/48").font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                                        .padding(.top, 2)
                                    Image(systemName: "film").font(.system(size: 26, weight: .light))
                                        .foregroundStyle(ShotIQColor.ink).padding(.top, 6)
                                    Text("Release phase detected.").font(.system(size: 12))
                                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                                }
                                .frame(width: 120, alignment: .leading)
                            }
                            .padding(.top, 18)
                            PhaseStrip().padding(.top, 16)
                            CoachTargetCard(bordered: false)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                                .padding(.top, 14)
                            VStack(alignment: .leading, spacing: 8) {
                                SectionLabel(text: "LATEST SESSION")
                                SessionStatsStrip()
                            }
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .top)
                            .padding(.vertical, 10)
                            HStack(spacing: 10) {
                                Image(systemName: "info.circle").font(.system(size: 15)).foregroundStyle(ShotIQColor.ink)
                                Text("Your media is saved. This clip will be available in your history.")
                                    .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            .padding(.top, 6)
                            Spacer(minLength: 20)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private func halfButton(_ icon: String, _ title: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 15))
            Text(title).font(.system(size: 14))
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .foregroundStyle(ShotIQColor.ink)
        .frame(maxWidth: .infinity).frame(height: 50)
        .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
    }
}

struct ShotBreakdownView: View {    // 041
    private let phases = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-shot-breakdown") {
            VStack(spacing: 0) {
                HStack {
                    Image(systemName: "chevron.left").font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(ShotIQColor.ink)
                    Spacer()
                    Wordmark(size: 30)
                    Spacer()
                    Image(systemName: "square.and.arrow.up").font(.system(size: 18))
                        .foregroundStyle(ShotIQColor.ink)
                }
                .padding(.horizontal, 20)
                .frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .center, spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("SHOT BREAKDOWN").shotiqDisplay(36)
                                Text("Shot 41 • Today at 8:24 AM").font(.system(size: 14))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer(minLength: 8)
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                        }
                        .padding(.top, 14)
                        // Five-frame phase filmstrip.
                        HStack(spacing: 2) {
                            ForEach(phases, id: \.self) { p in
                                VStack(spacing: 8) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 2)
                                            .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                                        SkeletonOverlay()
                                    }
                                    .frame(height: 190)
                                    Text(p).font(.system(size: 9, weight: p == "RELEASE" ? .bold : .regular))
                                        .kerning(0.4)
                                        .foregroundStyle(p == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                }
                            }
                        }
                        .padding(.top, 14)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 18) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("FORM SCORE").font(.system(size: 12, weight: .semibold)).kerning(0.8)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(alignment: .center, spacing: 14) {
                                        Text("82").font(.custom("DINCondensed-Bold", size: 62))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: 0.82).frame(width: 110)
                                    }
                                }
                                Spacer()
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("GOOD").font(.custom("DINCondensed-Bold", size: 20))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("Keep building\nconsistency.").font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(16)
                        }
                        .padding(.top, 16)
                        ShotIQCard {
                            HStack(spacing: 0) {
                                breakdownStat("point.3.connected.trianglepath.dotted", "ARC HEIGHT", "7.5", "FT")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                                breakdownStat("angle", "RELEASE ANGLE", "52°", nil)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                                breakdownStat("basketball", "SIDE SPIN", "6°", "R")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1).padding(.vertical, 12)
                                breakdownStat("point.bottomleft.forward.to.point.topright.scurvepath", "FLIGHT TIME", "0.79", "SEC")
                            }
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 0) {
                                Text("PHASE COACHING").font(.system(size: 12, weight: .semibold)).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.graphite)
                                HStack(alignment: .top, spacing: 16) {
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack(spacing: 10) {
                                            Text("Release").font(.system(size: 24, weight: .semibold))
                                                .foregroundStyle(ShotIQColor.ink)
                                            VStack(spacing: 2) {
                                                PhaseGlyph(active: true, size: 26)
                                                Rectangle().fill(ShotIQColor.shotiqOrange).frame(width: 30, height: 2)
                                            }
                                        }
                                        Text("Great elevation and alignment. Focus on snapping wrist down to create more backspin.")
                                            .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                        NavigationLink { FrameDetailSkeletonView() } label: {
                                            HStack(spacing: 8) {
                                                Image(systemName: "viewfinder").font(.system(size: 13))
                                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                                Text("Open release frame").font(.system(size: 14))
                                                    .foregroundStyle(ShotIQColor.ink)
                                                Image(systemName: "chevron.right").font(.system(size: 11))
                                                    .foregroundStyle(ShotIQColor.graphite)
                                            }
                                            .padding(.horizontal, 14).frame(height: 42)
                                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                        }
                                        .padding(.top, 4)
                                    }
                                    Spacer()
                                    VStack(spacing: 4) {
                                        Image(systemName: "hand.point.up.left").font(.system(size: 44, weight: .light))
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text("161°").font(.custom("DINCondensed-Bold", size: 20))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        Text("Release\nAngle").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                                            .multilineTextAlignment(.center)
                                    }
                                    .padding(8)
                                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                }
                                .padding(.top, 10)
                            }
                            .padding(16)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("SHOT CONTEXT").font(.system(size: 12, weight: .semibold)).kerning(0.8)
                                    .foregroundStyle(ShotIQColor.graphite)
                                HStack(spacing: 0) {
                                    contextItem("basketball", "Catch & Shoot", "Shot Type", ShotIQColor.ink)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                    contextItem("mappin.and.ellipse", "Right Corner", "Court Location", ShotIQColor.ink)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                    contextItem("clock", "26:12", "In Workout", ShotIQColor.ink)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                    contextItem("checkmark.circle", "Make", "Result", ShotIQColor.confirmGreen)
                                }
                            }
                            .padding(14)
                        }
                        .padding(.top, 12)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func breakdownStat(_ icon: String, _ label: String, _ value: String, _ unit: String?) -> some View {
        VStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 20, weight: .light)).foregroundStyle(ShotIQColor.ink)
                .frame(height: 26)
            Text(label).font(.system(size: 8, weight: .semibold)).kerning(0.4)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value).font(.custom("DINCondensed-Bold", size: 26)).foregroundStyle(ShotIQColor.ink)
                if let unit {
                    Text(unit).font(.custom("DINCondensed-Bold", size: 14)).foregroundStyle(ShotIQColor.ink)
                }
            }
            Text("GOOD").font(.system(size: 9, weight: .bold)).kerning(0.4)
                .foregroundStyle(ShotIQColor.analysisBlue)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
    }
    private func contextItem(_ icon: String, _ value: String, _ label: String, _ tint: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 17, weight: .light)).foregroundStyle(tint)
            VStack(alignment: .leading, spacing: 1) {
                Text(value).font(.system(size: 12, weight: .semibold)).foregroundStyle(tint)
                    .lineLimit(1).minimumScaleFactor(0.6)
                Text(label).font(.system(size: 9)).foregroundStyle(ShotIQColor.graphite)
                    .lineLimit(1).minimumScaleFactor(0.6)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, 6)
    }
}

struct FrameDetailSkeletonView: View { // 042
    @State private var frame = 3.0
    var body: some View {
        CanonicalScreen(testID: "screen-ios-frame-detail-skeleton") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            HStack(spacing: 8) {
                                Image(systemName: "chevron.left").font(.system(size: 15, weight: .semibold))
                                Text("ANALYZE").font(.system(size: 13, weight: .semibold)).kerning(0.8)
                            }
                            .foregroundStyle(ShotIQColor.graphite)
                            Spacer()
                            Text("SHOT 12 OF 24").font(.system(size: 13, weight: .semibold)).kerning(0.8)
                                .foregroundStyle(ShotIQColor.graphite)
                            Spacer()
                            HStack(spacing: 6) {
                                Image(systemName: "film").font(.system(size: 15))
                                Text("View sequence").font(.system(size: 13))
                            }
                            .foregroundStyle(ShotIQColor.ink)
                        }
                        .padding(.horizontal, 20).frame(height: 44)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            ZStack(alignment: .topLeading) {
                                ZStack { MediaSurface(height: 400); SkeletonOverlay() }
                                HStack {
                                    HStack(spacing: 6) {
                                        Text("RELEASE • FRAME 42").font(.system(size: 12, weight: .bold)).kerning(0.5)
                                        Image(systemName: "chevron.down").font(.system(size: 10, weight: .bold))
                                    }
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 12).padding(.vertical, 8)
                                    .background(.black.opacity(0.55), in: RoundedRectangle(cornerRadius: 8))
                                    Spacer()
                                    Text("120 FPS").font(.system(size: 12, weight: .bold)).kerning(0.5)
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 12).padding(.vertical, 8)
                                        .background(.black.opacity(0.55), in: RoundedRectangle(cornerRadius: 8))
                                }
                                .padding(10)
                            }
                            .overlay(alignment: .trailing) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("CONFIDENCE").font(.system(size: 9, weight: .semibold)).kerning(0.6)
                                        .foregroundStyle(.white.opacity(0.8))
                                    HStack(spacing: 6) {
                                        Text("98%").font(.custom("DINCondensed-Bold", size: 18))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Capsule().fill(ShotIQColor.analysisBlue).frame(width: 40, height: 3)
                                    }
                                    Rectangle().fill(.white.opacity(0.25)).frame(height: 1)
                                    Text("KEYPOINTS").font(.system(size: 9, weight: .semibold)).kerning(0.6)
                                        .foregroundStyle(.white.opacity(0.8))
                                    Text("17/17").font(.custom("DINCondensed-Bold", size: 18))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    Rectangle().fill(.white.opacity(0.25)).frame(height: 1)
                                    Text("TRACKING").font(.system(size: 9, weight: .semibold)).kerning(0.6)
                                        .foregroundStyle(.white.opacity(0.8))
                                    Text("EXCELLENT").font(.custom("DINCondensed-Bold", size: 16))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                }
                                .padding(12)
                                .background(.black.opacity(0.55), in: RoundedRectangle(cornerRadius: 10))
                                .padding(.trailing, 12)
                            }
                            .padding(.top, 14)
                            HStack(spacing: 10) {
                                overlayToggle("point.3.connected.trianglepath.dotted", "Skeleton", true)
                                overlayToggle("circle.dotted", "Joint points", false)
                                NavigationLink { AnnotationToolbarView() } label: {
                                    overlayToggleLabel("square.and.pencil", "Annotations", false)
                                }
                                overlayToggle("basketball", "Basketball", false)
                            }
                            .padding(.top, 14)
                            PhaseStrip().padding(.top, 16)
                            HStack(spacing: 10) {
                                VStack(spacing: 2) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "chevron.left").font(.system(size: 11, weight: .semibold))
                                        Text("Previous").font(.system(size: 13, weight: .semibold))
                                    }
                                    Text("Frame 41").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                                .frame(width: 78, height: 56)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                                HStack(spacing: 4) {
                                    ForEach(0..<5, id: \.self) { i in
                                        RoundedRectangle(cornerRadius: 4)
                                            .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                                            .frame(height: 52)
                                            .overlay(RoundedRectangle(cornerRadius: 4)
                                                .stroke(i == 2 ? ShotIQColor.shotiqOrange : .clear, lineWidth: 2))
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                VStack(spacing: 2) {
                                    HStack(spacing: 4) {
                                        Text("Next").font(.system(size: 13, weight: .semibold))
                                        Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold))
                                    }
                                    Text("Frame 43").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                }
                                .foregroundStyle(ShotIQColor.ink)
                                .frame(width: 78, height: 56)
                                .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            }
                            .padding(.top, 14)
                            Slider(value: $frame, in: 0...9, step: 1).padding(.top, 6)
                            HStack(alignment: .center, spacing: 0) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("FORM SCORE").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(spacing: 6) {
                                        Text("82").font(.custom("DINCondensed-Bold", size: 30))
                                            .foregroundStyle(ShotIQColor.shotiqOrange)
                                        ScoreBar(pct: 0.82).frame(width: 34)
                                    }
                                    Text("GOOD").font(.custom("DINCondensed-Bold", size: 13))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                }
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                StatBlock(value: "24", label: "SHOTS", valueSize: 24)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                StatBlock(value: "15", label: "MAKES", valueSize: 24)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                StatBlock(value: "62.5%", label: "MAKE %", valueSize: 24)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 40).padding(.horizontal, 10)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("TARGET").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("Keep elbow stacked through release")
                                        .font(.system(size: 12, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                        .lineLimit(2).minimumScaleFactor(0.7)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 14)
                            PrimaryButton(title: "Show joint angles", icon: "angle").padding(.top, 16)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private func overlayToggle(_ icon: String, _ label: String, _ active: Bool) -> some View {
        overlayToggleLabel(icon, label, active)
    }
    private func overlayToggleLabel(_ icon: String, _ label: String, _ active: Bool) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 19, weight: .light))
            Text(label).font(.system(size: 12))
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .foregroundStyle(active ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
        .frame(maxWidth: .infinity).frame(height: 68)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct AnnotationToolbarView: View { // 043
    @State private var tool = "Draw"
    private let tools: [(String, String)] = [
        ("Draw", "scribble"), ("Arrow", "arrow.up.right"), ("Angle", "angle"),
        ("Label", "textformat"), ("Undo", "arrow.uturn.backward"),
        ("Redo", "arrow.uturn.forward"), ("Clear", "trash"),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-annotation-toolbar") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            HStack(spacing: 6) {
                                Image(systemName: "chevron.left").font(.system(size: 15, weight: .semibold))
                                Text("Back").font(.system(size: 14))
                            }
                            .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            HStack(spacing: 6) {
                                Text("ANALYSIS").font(.system(size: 14, weight: .heavy).width(.condensed))
                                Text("— ANNOTATION").font(.system(size: 13, weight: .semibold)).kerning(0.5)
                            }
                            .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                            Text("Frame 43 / 96").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.horizontal, 20).frame(height: 44)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(spacing: 0) {
                                annotStat("FORM SCORE", "82")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                annotStat("SHOTS", "24")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                annotStat("MAKES", "15")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 34)
                                annotStat("%", "62.5%")
                            }
                            .padding(.top, 6)
                            HStack(spacing: 12) {
                                PhaseGlyph(active: true, size: 34)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("PRIMARY TARGET").font(.system(size: 11, weight: .semibold)).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("Keep elbow stacked through release.")
                                        .font(.system(size: 15)).foregroundStyle(ShotIQColor.shotiqOrange)
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(14)
                            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            .padding(.top, 12)
                            ZStack(alignment: .topLeading) {
                                ZStack { MediaSurface(height: 430); SkeletonOverlay() }
                                HStack(spacing: 6) {
                                    Circle().fill(.white).frame(width: 6, height: 6)
                                    Text("LIVE").font(.system(size: 12, weight: .bold)).kerning(0.5)
                                        .foregroundStyle(.white)
                                }
                                .padding(.horizontal, 12).padding(.vertical, 7)
                                .background(.black.opacity(0.6), in: Capsule())
                                .padding(10)
                            }
                            .overlay(alignment: .bottomLeading) {
                                Text("00:01.28").font(.custom("DINCondensed-Bold", size: 15)).foregroundStyle(.white)
                                    .padding(.horizontal, 12).padding(.vertical, 7)
                                    .background(.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 8))
                                    .padding(12)
                            }
                            .overlay(alignment: .bottomTrailing) {
                                HStack(spacing: 18) {
                                    Image(systemName: "backward.end.fill")
                                    Image(systemName: "pause.fill")
                                    Image(systemName: "forward.end.fill")
                                }
                                .font(.system(size: 14)).foregroundStyle(.white)
                                .padding(.horizontal, 16).padding(.vertical, 10)
                                .background(.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 8))
                                .padding(12)
                            }
                            .padding(.top, 14)
                            PhaseStrip().padding(.top, 16)
                            Text("ANNOTATION TOOLS").shotiqDisplay(20).padding(.top, 18)
                            HStack(spacing: 8) {
                                ForEach(tools, id: \.0) { name, icon in
                                    Button { tool = name } label: {
                                        VStack(spacing: 6) {
                                            Image(systemName: icon).font(.system(size: 18, weight: .light))
                                                .foregroundStyle(name == "Redo" ? ShotIQColor.muted :
                                                                 tool == name ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                            Text(name).font(.system(size: 11))
                                                .foregroundStyle(name == "Redo" ? ShotIQColor.muted : ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.6)
                                        }
                                        .frame(maxWidth: .infinity).frame(height: 62)
                                        .overlay(RoundedRectangle(cornerRadius: 8)
                                            .stroke(tool == name ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.top, 10)
                            PrimaryButton(title: "Save annotations", color: ShotIQColor.confirmGreen)
                                .padding(.top, 16)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private func annotStat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.system(size: 10, weight: .medium)).kerning(0.5)
                .foregroundStyle(ShotIQColor.graphite)
            Text(value).font(.custom("DINCondensed-Bold", size: 24)).foregroundStyle(ShotIQColor.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, 4)
    }
}

struct FormScoreView: View {        // 044
    private let breakdown: [(String, Double, String, String)] = [
        ("Form", 0.84, "GOOD", "Solid mechanics overall."),
        ("Balance", 0.78, "GOOD", "Slight lean on the rise."),
        ("Elbow", 0.72, "NEEDS WORK", "Elbow drifts out at load."),
        ("Power", 0.86, "GOOD", "Strong lower body drive."),
        ("Consistency", 0.81, "GOOD", "Release point is repeatable."),
    ]
    private let details: [(String, Double, String, String)] = [
        ("Form", 0.84, "Alignment, posture, efficiency", "High"),
        ("Balance", 0.78, "Stability, control, body position", "Medium"),
        ("Elbow", 0.72, "Stack, path, separation", "High"),
        ("Power", 0.86, "Lower body drive, force transfer", "Medium"),
        ("Consistency", 0.81, "Repeatability, release control", "High"),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-form-score") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            HStack {
                                HStack(spacing: 8) {
                                    Image(systemName: "chevron.left").font(.system(size: 14, weight: .semibold))
                                    Text("Back to analysis").font(.system(size: 14))
                                }
                                .foregroundStyle(ShotIQColor.ink)
                                Spacer()
                                Image(systemName: "square.and.arrow.up").font(.system(size: 17))
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .padding(.vertical, 12)
                            .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            HStack(spacing: 6) {
                                Text("FORM SCORE").shotiqDisplay(24)
                                Image(systemName: "info.circle").font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 18)
                            HStack(alignment: .top, spacing: 14) {
                                Text("82").font(.custom("DINCondensed-Bold", size: 76))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("GOOD").font(.custom("DINCondensed-Bold", size: 19))
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("Keep building\nconsistency.").font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.graphite)
                                }
                                .padding(.top, 12)
                                Spacer()
                                VStack(alignment: .trailing, spacing: 3) {
                                    TrendLine(points: [58, 66, 61, 70]).frame(width: 110, height: 34)
                                    HStack(spacing: 3) {
                                        Text("+8.1%").font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                        Text("vs last session").font(.system(size: 12))
                                            .foregroundStyle(ShotIQColor.graphite)
                                    }
                                }
                                .padding(.top, 12)
                            }
                            ScoreBar(pct: 0.82).padding(.top, 2)
                            HStack(spacing: 12) {
                                linkRow("doc.text", "View score method")
                                linkRow("point.3.connected.trianglepath.dotted", "Compare session")
                            }
                            .padding(.top, 16)
                            SectionLabel(text: "FORM BREAKDOWN").padding(.top, 22)
                            HStack(spacing: 8) {
                                ForEach(breakdown, id: \.0) { m, v, verdict, caption in
                                    NavigationLink { MetricDetailView(metric: m, value: v) } label: {
                                        VStack(spacing: 4) {
                                            Text(m.uppercased()).font(.system(size: 9, weight: .bold)).kerning(0.4)
                                                .foregroundStyle(ShotIQColor.ink)
                                                .lineLimit(1).minimumScaleFactor(0.5)
                                            PhaseGlyph(active: verdict == "NEEDS WORK", size: 30)
                                            Text("\(Int(v * 100))").font(.custom("DINCondensed-Bold", size: 30))
                                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                            Text(verdict).font(.system(size: 8, weight: .bold)).kerning(0.3)
                                                .foregroundStyle(verdict == "NEEDS WORK" ? ShotIQColor.reviewRed : ShotIQColor.analysisBlue)
                                                .lineLimit(1).minimumScaleFactor(0.5)
                                            Text(caption).font(.system(size: 8)).foregroundStyle(ShotIQColor.graphite)
                                                .multilineTextAlignment(.center)
                                                .lineLimit(2).minimumScaleFactor(0.7)
                                        }
                                        .padding(.vertical, 10).padding(.horizontal, 2)
                                        .frame(maxWidth: .infinity)
                                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                                    }
                                }
                            }
                            .padding(.top, 8)
                            HStack(spacing: 6) {
                                SectionLabel(text: "CONFIDENCE")
                                Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 22)
                            HStack(alignment: .center, spacing: 14) {
                                Text("76%").font(.custom("DINCondensed-Bold", size: 44))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                Text("MODERATE").font(.system(size: 12, weight: .bold)).kerning(0.6)
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                                Text("Form is repeatable in games, with room to tighten elbow.")
                                    .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                Spacer(minLength: 0)
                                TrendLine(points: [40, 55, 42, 60, 48, 70, 66, 82], stroke: ShotIQColor.analysisBlue)
                                    .frame(width: 100, height: 36)
                            }
                            .padding(.top, 6)
                            SectionLabel(text: "KEY INSIGHT").padding(.top, 22)
                            HStack(alignment: .top, spacing: 14) {
                                PhaseGlyph(active: true, size: 44)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Elbow separation at load is causing inconsistency at release.")
                                        .font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                    Text("Focus on keeping your elbow stacked over your hip through the rise and into release.")
                                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 0)
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("IMPACT").font(.system(size: 10, weight: .semibold)).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("+11%").font(.custom("DINCondensed-Bold", size: 30))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    Text("Consistency").font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                }
                            }
                            .padding(14)
                            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            .padding(.top, 8)
                            HStack(spacing: 6) {
                                SectionLabel(text: "METRIC DETAILS")
                                Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 22)
                            HStack {
                                Text("METRIC").frame(maxWidth: .infinity, alignment: .leading)
                                Text("SCORE").frame(width: 110, alignment: .leading)
                                Text("DETAILS").frame(maxWidth: .infinity, alignment: .leading)
                                Text("IMPACT").frame(width: 52, alignment: .trailing)
                            }
                            .font(.system(size: 9, weight: .semibold)).kerning(0.5)
                            .foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 10)
                            ForEach(details, id: \.0) { m, v, desc, impact in
                                NavigationLink { MetricDetailView(metric: m, value: v) } label: {
                                    HStack {
                                        Text(m).shotiqBody(13).frame(maxWidth: .infinity, alignment: .leading)
                                        HStack(spacing: 6) {
                                            Text("\(Int(v * 100))").font(.custom("DINCondensed-Bold", size: 17))
                                                .foregroundStyle(ShotIQColor.ink)
                                            ScoreBar(pct: v, color: v < 0.75 ? ShotIQColor.shotiqOrange : ShotIQColor.analysisBlue)
                                                .frame(width: 74)
                                        }
                                        .frame(width: 110, alignment: .leading)
                                        Text(desc).font(.system(size: 11)).foregroundStyle(ShotIQColor.graphite)
                                            .lineLimit(2).minimumScaleFactor(0.7)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                        Text(impact).font(.system(size: 11)).foregroundStyle(ShotIQColor.ink)
                                            .frame(width: 52, alignment: .trailing)
                                    }
                                    .padding(.vertical, 9)
                                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                                }
                            }
                            NavigationLink { MetricDetailView(metric: "Elbow", value: 0.72) } label: {
                                HStack(spacing: 10) {
                                    Text("Review weakest metric").font(.system(size: 17, weight: .medium))
                                    Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold))
                                }
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                                .foregroundStyle(.white)
                            }
                            .padding(.top, 16)
                            HStack(spacing: 6) {
                                SectionLabel(text: "SESSION SUMMARY")
                                Image(systemName: "info.circle").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(.top, 20)
                            SessionStatsStrip().padding(.top, 8).padding(.bottom, 10)
                            Spacer(minLength: 16)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private func linkRow(_ icon: String, _ title: String) -> some View {
        HStack {
            Image(systemName: icon).font(.system(size: 15))
            Text(title).font(.system(size: 14))
                .lineLimit(1).minimumScaleFactor(0.7)
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
        }
        .foregroundStyle(ShotIQColor.ink)
        .padding(.horizontal, 14).frame(height: 50)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
    }
}

struct MetricDetailView: View {     // 045
    var metric = "Release"; var value = 0.88
    var body: some View {
        CanonicalScreen(testID: "screen-ios-metric-detail") {
            VStack(spacing: 0) {
                HStack {
                    Image(systemName: "chevron.left").font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(ShotIQColor.ink)
                    Spacer()
                    HStack(spacing: 8) {
                        Wordmark(size: 26)
                        Text("AI ANALYSIS").font(.system(size: 13, weight: .semibold)).kerning(1)
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                    Spacer()
                    Image(systemName: "square.and.arrow.up").font(.system(size: 18)).foregroundStyle(ShotIQColor.ink)
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: 12) {
                            Circle().fill(ShotIQColor.ink).frame(width: 42, height: 42)
                                .overlay(Text("JE").font(.system(size: 15, weight: .bold)).foregroundStyle(.white))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Jordan Ellis").font(.system(size: 16, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                Text("Right-handed • Advanced").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            HeaderStat(icon: "point.3.connected.trianglepath.dotted", value: "2,840", label: "POINTS")
                        }
                        .padding(.vertical, 12)
                        .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                        HStack(alignment: .center, spacing: 0) {
                            StatBlock(value: "24", label: "SHOTS", valueSize: 28).frame(maxWidth: .infinity, alignment: .leading)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            StatBlock(value: "15", label: "MAKES", valueSize: 28).frame(maxWidth: .infinity)
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 36)
                            StatBlock(value: "62.5%", label: "SHOOTING %", valueSize: 28).frame(maxWidth: .infinity)
                            ShotIQCard {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("FORM SCORE").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("82").font(.custom("DINCondensed-Bold", size: 28))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: 0.82).frame(width: 74)
                                }
                                .padding(12)
                            }
                        }
                        .padding(.top, 14)
                        Text(metric.uppercased()).shotiqDisplay(38).padding(.top, 16)
                        Text("Release • Right-handed").font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 2)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 0) {
                                ZStack { MediaSurface(height: 300); SkeletonOverlay() }
                                    .frame(maxWidth: .infinity)
                                VStack(alignment: .leading, spacing: 0) {
                                    Text("MEASURED").font(.system(size: 11, weight: .semibold)).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("\(Int(value * 100))°").font(.custom("DINCondensed-Bold", size: 54))
                                        .foregroundStyle(ShotIQColor.ink)
                                    Text(metric.uppercased()).font(.system(size: 11, weight: .semibold)).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .lineLimit(1).minimumScaleFactor(0.6)
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.vertical, 12)
                                    Text("ELITE RANGE").font(.system(size: 11, weight: .semibold)).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("85° — 95°").font(.custom("DINCondensed-Bold", size: 30))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                    ZStack(alignment: .leading) {
                                        Capsule().fill(ShotIQColor.rule).frame(height: 3)
                                        Capsule().fill(ShotIQColor.confirmGreen).frame(width: 60, height: 4)
                                            .offset(x: 30)
                                        Circle().stroke(ShotIQColor.confirmGreen, lineWidth: 3)
                                            .background(Circle().fill(.white))
                                            .frame(width: 14, height: 14).offset(x: 62)
                                    }
                                    .frame(height: 16).padding(.top, 6)
                                    HStack {
                                        Text("80°").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                                        Spacer()
                                        Text("100°").font(.system(size: 10)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.vertical, 12)
                                    Text("CONFIDENCE").font(.system(size: 11, weight: .semibold)).kerning(0.7)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    HStack(spacing: 8) {
                                        Text("HIGH").font(.custom("DINCondensed-Bold", size: 20))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        Text("92%").font(.custom("DINCondensed-Bold", size: 20))
                                            .foregroundStyle(ShotIQColor.analysisBlue)
                                        TrendLine(points: [40, 52, 48, 66, 74, 88], stroke: ShotIQColor.analysisBlue)
                                            .frame(width: 60, height: 24)
                                    }
                                    .padding(.top, 2)
                                }
                                .padding(14)
                                .frame(width: 168)
                            }
                        }
                        .padding(.top, 14)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 16) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("WHY IT MATTERS").shotiqDisplay(19)
                                    Text("A stacked elbow (near 90°) improves shot consistency by aligning force from your legs through your shoulder to the ball.")
                                        .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer()
                                Image(systemName: "figure.arms.open").font(.system(size: 44, weight: .light))
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .padding(16)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            HStack(alignment: .top, spacing: 16) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("CORRECTION CUE").shotiqDisplay(19)
                                    Text("Keep elbow stacked under the ball")
                                        .font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.analysisBlue)
                                    Text("Avoid flaring out. Drive your elbow up and keep it under the ball at release.")
                                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer()
                                HStack(spacing: 14) {
                                    cueFigure("xmark.circle.fill", "TOO FLARED", ShotIQColor.reviewRed)
                                    cueFigure("checkmark.circle.fill", "STACKED", ShotIQColor.confirmGreen)
                                    cueFigure("xmark.circle.fill", "BEHIND BODY", ShotIQColor.reviewRed)
                                }
                            }
                            .padding(16)
                        }
                        .padding(.top, 12)
                        ShotIQCard {
                            VStack(spacing: 0) {
                                detailRow("film", "View frame", "See this rep at release")
                                Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                                detailRow("point.bottomleft.forward.to.point.topright.scurvepath", "Compare elite range", "See how you stack up")
                            }
                        }
                        .padding(.top, 12)
                        PrimaryButton(title: "Add to training plan").padding(.top, 16)
                        PhaseStrip().padding(.top, 18).padding(.bottom, 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func cueFigure(_ icon: String, _ label: String, _ tint: Color) -> some View {
        VStack(spacing: 5) {
            Image(systemName: "figure.basketball").font(.system(size: 26, weight: .light))
                .foregroundStyle(ShotIQColor.ink)
            Image(systemName: icon).font(.system(size: 13)).foregroundStyle(tint)
            Text(label).font(.system(size: 7, weight: .semibold)).kerning(0.3)
                .foregroundStyle(ShotIQColor.graphite)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
    }
    private func detailRow(_ icon: String, _ title: String, _ sub: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.system(size: 19, weight: .light))
                .foregroundStyle(ShotIQColor.ink).frame(width: 30)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                Text(sub).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
        }
        .padding(14)
    }
}

struct FlawsOverviewView: View {    // 046
    private let flaws: [(Int, String, String, String, String, String, Color)] = [
        // rank, title, impact chip, description, confidence, cta, tint
        (1, "ELBOW FLARE", "HIGH IMPACT",
         "Elbow drifts outward during lift, creating inconsistent release path.",
         "92%", "Review elbow flare", ShotIQColor.reviewRed),
        (2, "EARLY WRIST EXTENSION", "MEDIUM IMPACT",
         "Wrist extends too early, reducing arc and consistency.",
         "76%", "View history", ShotIQColor.shotiqOrange),
        (3, "LOW FOLLOW-THROUGH", "LOW IMPACT",
         "Follow-through finishes below eye level, limiting rotation and hold.",
         "58%", "View history", ShotIQColor.muted),
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-flaws-overview") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .center, spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 8) {
                                    Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
                                    Text("ANALYSIS").font(.system(size: 12, weight: .semibold)).kerning(0.8)
                                }
                                .foregroundStyle(ShotIQColor.graphite)
                                Text("FLAWS OVERVIEW").shotiqDisplay(36)
                            }
                            Spacer(minLength: 8)
                            HeaderStat(icon: "film", value: "6", label: "DAY STREAK")
                            Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 46)
                            HeaderStat(icon: "circle.hexagongrid", value: "2,840", label: "POINTS")
                        }
                        .padding(.top, 14)
                        CoachTargetCard(bordered: false)
                            .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            .padding(.top, 14)
                        Text("AI analysis detected 3 priority flaws impacting your shot efficiency.")
                            .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                            .padding(.top, 14)
                        ForEach(flaws, id: \.0) { rank, title, impact, desc, confidence, cta, tint in
                            NavigationLink { FlawDetailView(title: title, severity: impact) } label: {
                                flawCard(rank, title, impact, desc, confidence, cta, tint)
                            }
                            .padding(.top, 12)
                        }
                        HStack(spacing: 12) {
                            Image(systemName: "point.3.connected.trianglepath.dotted")
                                .font(.system(size: 22, weight: .light)).foregroundStyle(ShotIQColor.analysisBlue)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Add all 3 flaws to your training plan")
                                    .font(.system(size: 15, weight: .semibold)).foregroundStyle(ShotIQColor.ink)
                                Text("Get personalized drills to fix these issues.")
                                    .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            HStack(spacing: 6) {
                                Text("Add all to plan").font(.system(size: 14, weight: .semibold))
                                Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14).padding(.vertical, 11)
                            .background(ShotIQColor.analysisBlue, in: RoundedRectangle(cornerRadius: 8))
                        }
                        .padding(14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        .padding(.top, 14)
                        Spacer(minLength: 24)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    private func flawCard(_ rank: Int, _ title: String, _ impact: String, _ desc: String,
                          _ confidence: String, _ cta: String, _ tint: Color) -> some View {
        ShotIQCard {
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 10) {
                        RoundedRectangle(cornerRadius: 5).fill(tint).frame(width: 26, height: 26)
                            .overlay(Text("\(rank)").font(.system(size: 14, weight: .bold)).foregroundStyle(.white))
                        Text(title).shotiqDisplay(21)
                        Text(impact).font(.system(size: 9, weight: .bold)).kerning(0.3)
                            .foregroundStyle(tint)
                            .padding(.horizontal, 7).padding(.vertical, 4)
                            .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                            .lineLimit(1).minimumScaleFactor(0.6)
                    }
                    Text(desc).font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(.leading)
                        .padding(.top, 8)
                    Text("AFFECTED PHASES").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 12)
                    PhaseStrip(active: title == "LOW FOLLOW-THROUGH" ? "FOLLOW-THROUGH" : "RELEASE")
                        .scaleEffect(0.82, anchor: .leading)
                        .frame(height: 52)
                        .padding(.top, 4)
                    Text("TREND (LAST 6 SESSIONS)").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite).padding(.top, 8)
                    TrendLine(points: [52, 74, 78, 50, 64, 48, 60], stroke: tint)
                        .frame(height: 40).padding(.top, 4)
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("CONFIDENCE").font(.system(size: 9, weight: .semibold)).kerning(0.5)
                        .foregroundStyle(ShotIQColor.graphite)
                    HStack(spacing: 8) {
                        Text(confidence).font(.custom("DINCondensed-Bold", size: 24)).foregroundStyle(ShotIQColor.ink)
                        TrendLine(points: [40, 55, 48, 62, 58, 74], stroke: tint).frame(width: 54, height: 20)
                    }
                    ZStack {
                        RoundedRectangle(cornerRadius: 4).fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                        SkeletonOverlay()
                    }
                    .frame(width: 120, height: 108)
                    HStack(spacing: 5) {
                        Text(cta).font(.system(size: 12, weight: .semibold))
                            .lineLimit(1).minimumScaleFactor(0.7)
                        Image(systemName: "chevron.right").font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundStyle(rank == 1 ? .white : ShotIQColor.ink)
                    .frame(width: 120, height: 40)
                    .background(rank == 1 ? ShotIQColor.shotiqOrange : .clear,
                                in: RoundedRectangle(cornerRadius: 6))
                    .overlay(RoundedRectangle(cornerRadius: 6)
                        .stroke(rank == 1 ? .clear : ShotIQColor.rule))
                }
            }
            .padding(14)
        }
    }
}

struct FlawDetailView: View {       // 047
    var title = "Elbow flare at release"; var severity = "HIGH IMPACT"
    private let frames = ["LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH", "RESET"]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-flaw-detail") {
            VStack(spacing: 0) {
                HStack {
                    Image(systemName: "arrow.left").font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(ShotIQColor.ink)
                    Spacer()
                    Wordmark(size: 30)
                    Spacer()
                    Image(systemName: "square.and.arrow.up").font(.system(size: 18)).foregroundStyle(ShotIQColor.ink)
                }
                .padding(.horizontal, 20).frame(height: 52)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        PlayerHeader(name: "Jordan Ellis")
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("FLAW DETAIL").font(.system(size: 12, weight: .semibold)).kerning(0.8)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text(title.uppercased()).shotiqDisplay(30)
                                    Text("Your elbow drifts outward in the release phase, creating side spin and inconsistency.")
                                        .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .padding(.top, 2)
                                }
                                Spacer(minLength: 12)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("FORM SCORE").font(.system(size: 10, weight: .semibold)).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("82").font(.custom("DINCondensed-Bold", size: 40))
                                        .foregroundStyle(ShotIQColor.shotiqOrange)
                                    ScoreBar(pct: 0.82).frame(width: 76)
                                }
                            }
                            .padding(.top, 14)
                            HStack(spacing: 0) {
                                metaItem("clock", "Release phase")
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 20)
                                metaItem("chart.bar", severity.capitalized)
                                Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 20)
                                metaItem("water.waves", "72% confidence")
                            }
                            .padding(.top, 14)
                            SectionLabel(text: "EVIDENCE FRAMES").padding(.top, 20)
                            HStack(spacing: 4) {
                                ForEach(frames, id: \.self) { f in
                                    VStack(spacing: 6) {
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 4)
                                                .fill(Color(red: 0.106, green: 0.114, blue: 0.125))
                                            SkeletonOverlay()
                                        }
                                        .frame(height: 150)
                                        .overlay(RoundedRectangle(cornerRadius: 4)
                                            .stroke(f == "RELEASE" ? ShotIQColor.shotiqOrange : .clear, lineWidth: 2))
                                        Text(f).font(.system(size: 8, weight: f == "RELEASE" ? .bold : .regular))
                                            .kerning(0.3)
                                            .foregroundStyle(f == "RELEASE" ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                            .lineLimit(1).minimumScaleFactor(0.6)
                                        if f == "RELEASE" {
                                            Text("(Flaw)").font(.system(size: 9)).foregroundStyle(ShotIQColor.reviewRed)
                                        }
                                    }
                                    .frame(maxWidth: .infinity)
                                }
                            }
                            .padding(.top, 8)
                            HStack(alignment: .top, spacing: 18) {
                                VStack(alignment: .leading, spacing: 6) {
                                    SectionLabel(text: "IMPACT")
                                    Text("Elbow flare opens your shooting angle and adds unwanted side spin, which reduces accuracy and increases variability.")
                                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                HStack(spacing: 14) {
                                    angleFigure("YOUR ANGLE", "25°", ShotIQColor.reviewRed)
                                    Rectangle().fill(ShotIQColor.rule).frame(width: 1, height: 74)
                                    angleFigure("IDEAL RANGE", "15–20°", ShotIQColor.analysisBlue)
                                }
                            }
                            .padding(.top, 22)
                            HStack(alignment: .top, spacing: 18) {
                                VStack(alignment: .leading, spacing: 6) {
                                    SectionLabel(text: "HOW TO FIX")
                                    Text("Keep your elbow stacked under the ball through release. Think \u{201C}elbow in, wrist out.\u{201D}")
                                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                VStack(alignment: .leading, spacing: 7) {
                                    Text("TARGET POSITION").font(.system(size: 11, weight: .bold)).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.analysisBlue)
                                    targetCheck("Elbow under ball")
                                    targetCheck("Forearm vertical")
                                    targetCheck("Wrist behind ball")
                                }
                                .padding(12)
                                .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                            }
                            .padding(.top, 20)
                            SectionLabel(text: "RECOMMENDED DRILL").padding(.top, 22)
                            NavigationLink { DrillDetailView(name: "Towel Elbow Stack") } label: {
                                HStack(alignment: .top, spacing: 14) {
                                    RoundedRectangle(cornerRadius: 6).fill(ShotIQColor.rule)
                                        .frame(width: 92, height: 92)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("Towel Elbow Stack").font(.system(size: 16, weight: .semibold))
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text("8 min • Shooting Mechanics").font(.system(size: 12))
                                            .foregroundStyle(ShotIQColor.graphite)
                                        Text("Use a towel between elbow and hip to build awareness of keeping your elbow stacked through release.")
                                            .font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                            .fixedSize(horizontal: false, vertical: true)
                                            .multilineTextAlignment(.leading)
                                            .padding(.top, 4)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.graphite)
                                        .padding(.top, 32)
                                }
                                .padding(12)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                            }
                            .padding(.top, 8)
                            HStack(spacing: 12) {
                                SecondaryButton(title: "Add to goals", icon: "bookmark")
                                SecondaryButton(title: "View affected frames", icon: "film")
                            }
                            .padding(.top, 14)
                            PrimaryButton(title: "Start recommended drill", icon: "figure.basketball")
                                .padding(.top, 10)
                            Spacer(minLength: 24)
                        }
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }
    private func metaItem(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 14, weight: .light)).foregroundStyle(ShotIQColor.ink)
            Text(label).font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, 4)
    }
    private func angleFigure(_ label: String, _ value: String, _ tint: Color) -> some View {
        VStack(spacing: 5) {
            Text(label).font(.system(size: 10, weight: .bold)).kerning(0.5).foregroundStyle(tint)
            Image(systemName: "figure.basketball").font(.system(size: 34, weight: .light))
                .foregroundStyle(ShotIQColor.ink)
            Text(value).font(.custom("DINCondensed-Bold", size: 17)).foregroundStyle(tint)
        }
    }
    private func targetCheck(_ label: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill").font(.system(size: 14))
                .foregroundStyle(ShotIQColor.analysisBlue)
            Text(label).font(.system(size: 13)).foregroundStyle(ShotIQColor.ink)
        }
    }
}
