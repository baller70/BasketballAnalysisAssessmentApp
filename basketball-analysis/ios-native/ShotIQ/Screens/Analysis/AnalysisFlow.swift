import SwiftUI

// Analysis flow — screens 036-047. Pose overlays and gauges are Canvas/Path.

struct AnalysisProcessingView: View { // 036
    @State private var pct = 0.12
    @State private var long = false
    @State private var done = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-processing") {
            VStack(spacing: 0) {
                Spacer()
                Ring(pct: pct).frame(width: 120, height: 120)
                    .overlay(Text("\(Int(pct * 100))%").font(.custom("DINCondensed-Bold", size: 30)))
                Text("ANALYZING YOUR SHOT").shotiqDisplay(32).padding(.top, 26)
                Text("Detecting pose · measuring mechanics · scoring form")
                    .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite).padding(.top, 8)
                Spacer()
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
                Spacer()
                Image(systemName: "clock.badge.exclamationmark").font(.system(size: 54, weight: .light))
                Text("TAKING LONGER THAN USUAL").shotiqDisplay(30).multilineTextAlignment(.center).padding(.top, 22)
                Text("Your video is still processing. We'll notify you when it's ready — you can keep training.")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center).padding(.horizontal, 32).padding(.top, 10)
                Spacer()
                PrimaryButton(title: "Notify me when done").padding(.horizontal, 24)
                SecondaryButton(title: "Keep waiting").padding(.horizontal, 24).padding(.top, 12).padding(.bottom, 30)
            }
        }
    }
}

struct AnalysisResultOverviewView: View { // 038
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-result-overview") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("ANALYSIS RESULT").shotiqDisplay(38).padding(.top, 24)
                    Text("Pull-Up Jumper · Today").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                    ZStack { MediaSurface(height: 300); SkeletonOverlay() }
                        .padding(.top, 14)
                    PhaseStrip().padding(.top, 12)
                    HStack(alignment: .top, spacing: 26) {
                        VStack(alignment: .leading) {
                            SectionLabel(text: "FORM SCORE")
                            Text("82").font(.custom("DINCondensed-Bold", size: 64))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                            ScoreBar(pct: 0.82).frame(width: 130)
                            Text("GOOD").font(.system(size: 14, weight: .bold))
                                .foregroundStyle(ShotIQColor.analysisBlue).padding(.top, 6)
                        }
                        VStack(alignment: .leading, spacing: 12) {
                            SectionLabel(text: "SESSION")
                            StatBlock(value: "24", label: "SHOTS")
                            StatBlock(value: "15", label: "MAKES")
                            StatBlock(value: "62.5%", label: "MAKE %")
                        }
                        Spacer()
                    }
                    .padding(.top, 18)
                    VStack(spacing: 12) {
                        navRow("SHOT BREAKDOWN", ShotBreakdownView())
                        navRow("FORM SCORE DETAIL", FormScoreView())
                        navRow("FLAWS (3)", FlawsOverviewView())
                        navRow("ELITE MATCH", EliteMatchView())
                    }
                    .padding(.vertical, 20)
                }
                .padding(.horizontal, 24)
            }
        }
    }
    private func navRow(_ t: String, _ dest: some View) -> some View {
        NavigationLink { dest } label: {
            HStack {
                SectionLabel(text: t)
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
            }
            .padding(16)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
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
                Spacer()
                PhaseGlyph(size: 64)
                Text("NO ANALYSIS YET").shotiqDisplay(34).padding(.top, 22)
                Text("Capture or upload a shot and your results will live here.")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center).padding(.horizontal, 40).padding(.top, 8)
                NavigationLink { AnalyzeHubView() } label: {
                    Text("Analyze a shot").frame(width: 240).frame(height: 52)
                        .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                        .foregroundStyle(.white).font(.system(size: 16, weight: .medium))
                }
                .padding(.top, 24)
                Spacer()
            }
        }
    }
}

struct AnalysisErrorView: View {    // 040
    var body: some View {
        CanonicalScreen(testID: "screen-ios-analysis-error") {
            VStack(spacing: 0) {
                Spacer()
                Image(systemName: "exclamationmark.triangle").font(.system(size: 54, weight: .light))
                    .foregroundStyle(ShotIQColor.reviewRed)
                Text("ANALYSIS FAILED").shotiqDisplay(34).padding(.top, 22)
                Text("We couldn't detect a full shooting motion. Check the filming guide and try again.")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center).padding(.horizontal, 36).padding(.top, 8)
                Spacer()
                PrimaryButton(title: "Try again").padding(.horizontal, 24)
                SecondaryButton(title: "View filming guide").padding(.horizontal, 24).padding(.top, 12).padding(.bottom, 30)
            }
        }
    }
}

struct ShotBreakdownView: View {    // 041
    var body: some View {
        CanonicalScreen(testID: "screen-ios-shot-breakdown") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("SHOT BREAKDOWN").shotiqDisplay(38).padding(.top, 24)
                    ForEach([("SETUP", "Stance width 16.5 in", "+1.5 vs elite", false),
                             ("LOAD", "Knee bend 24°", "-4° vs elite", false),
                             ("RISE", "Elevation 22.5 in", "-3.0 vs elite", false),
                             ("RELEASE", "Release angle 46°", "-4° vs elite", true),
                             ("FOLLOW-THROUGH", "Hold 0.7s", "-0.4s vs elite", false)], id: \.0) { phase, m, d, focus in
                        NavigationLink { FrameDetailSkeletonView() } label: {
                            HStack(spacing: 14) {
                                PhaseGlyph(active: focus, size: 34)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(phase).font(.system(size: 12, weight: .bold)).kerning(0.6)
                                        .foregroundStyle(focus ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                    Text(m).shotiqBody(15)
                                    Text(d).font(.system(size: 12)).foregroundStyle(ShotIQColor.reviewRed)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(16)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(focus ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                        }
                        .padding(.top, 12)
                    }
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct FrameDetailSkeletonView: View { // 042
    @State private var frame = 3.0
    var body: some View {
        CanonicalScreen(testID: "screen-ios-frame-detail-skeleton") {
            VStack(spacing: 0) {
                Text("FRAME DETAIL").shotiqDisplay(38).padding(.top, 24)
                ZStack { MediaSurface(height: 430); SkeletonOverlay() }
                    .padding(.horizontal, 20).padding(.top, 14)
                Slider(value: $frame, in: 0...9, step: 1).padding(.horizontal, 28).padding(.top, 16)
                Text("Frame \(Int(frame)) / 9 · RELEASE").font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite)
                HStack(spacing: 20) {
                    StatBlock(value: "165°", label: "ARM EXT.")
                    StatBlock(value: "46°", label: "RELEASE ANGLE")
                    StatBlock(value: "77.0 in", label: "RELEASE HEIGHT")
                }
                .padding(.top, 14)
                NavigationLink { AnnotationToolbarView() } label: {
                    Text("Annotate this frame").font(.system(size: 14)).foregroundStyle(ShotIQColor.analysisBlue)
                }
                .padding(.top, 16)
                Spacer()
            }
        }
    }
}

struct AnnotationToolbarView: View { // 043
    @State private var tool = "pencil"
    var body: some View {
        CanonicalScreen(testID: "screen-ios-annotation-toolbar") {
            VStack(spacing: 0) {
                ZStack { MediaSurface(height: 560); SkeletonOverlay() }
                HStack(spacing: 14) {
                    ForEach(["pencil", "line.diagonal", "circle", "angle", "textformat", "arrow.uturn.backward"], id: \.self) { t in
                        Button { tool = t } label: {
                            Image(systemName: t == "angle" ? "angle" : t)
                                .font(.system(size: 19))
                                .frame(width: 48, height: 48)
                                .background(tool == t ? ShotIQColor.warmCanvas : .clear)
                                .overlay(RoundedRectangle(cornerRadius: 6)
                                    .stroke(tool == t ? ShotIQColor.shotiqOrange : ShotIQColor.rule))
                        }
                        .foregroundStyle(ShotIQColor.ink)
                    }
                }
                .padding(.top, 18)
                Spacer()
                PrimaryButton(title: "Save annotation").padding(.horizontal, 24).padding(.bottom, 26)
            }
        }
    }
}

struct FormScoreView: View {        // 044
    var body: some View {
        CanonicalScreen(testID: "screen-ios-form-score") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("FORM SCORE").shotiqDisplay(38).padding(.top, 24)
                    HStack {
                        Spacer()
                        Ring(pct: 0.82).frame(width: 150, height: 150)
                            .overlay(VStack {
                                Text("82").font(.custom("DINCondensed-Bold", size: 52))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                                Text("GOOD").font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                            })
                        Spacer()
                    }
                    .padding(.top, 18)
                    ForEach([("Release", 0.88), ("Balance", 0.84), ("Alignment", 0.76),
                             ("Rhythm", 0.81), ("Follow-through", 0.72)], id: \.0) { m, v in
                        NavigationLink { MetricDetailView(metric: m, value: v) } label: {
                            VStack(alignment: .leading, spacing: 7) {
                                HStack {
                                    Text(m).shotiqBody(15, weight: .semibold)
                                    Spacer()
                                    Text("\(Int(v * 100))").font(.custom("DINCondensed-Bold", size: 22))
                                }
                                ScoreBar(pct: v, color: v >= 0.8 ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                            }
                            .padding(.vertical, 12)
                        }
                    }
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct MetricDetailView: View {     // 045
    var metric = "Release"; var value = 0.88
    var body: some View {
        CanonicalScreen(testID: "screen-ios-metric-detail") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text(metric.uppercased()).shotiqDisplay(38).padding(.top, 24)
                    HStack(alignment: .bottom, spacing: 16) {
                        Text("\(Int(value * 100))").font(.custom("DINCondensed-Bold", size: 64))
                            .foregroundStyle(value >= 0.8 ? ShotIQColor.confirmGreen : ShotIQColor.shotiqOrange)
                        VStack(alignment: .leading) {
                            Text("ELITE RANGE 85–95").font(.system(size: 11, weight: .bold)).kerning(0.5)
                                .foregroundStyle(ShotIQColor.graphite)
                            TrendLine(points: [70, 74, 72, 78, 82, 88]).frame(width: 150, height: 44)
                        }
                    }
                    .padding(.top, 14)
                    SectionLabel(text: "LAST 6 SESSIONS").padding(.top, 20)
                    ShotIQCard {
                        TrendLine(points: [70, 74, 72, 78, 82, 88], stroke: ShotIQColor.analysisBlue)
                            .frame(height: 140).padding(14)
                    }
                    .padding(.top, 8)
                    SectionLabel(text: "WHAT DRIVES THIS").padding(.top, 20)
                    Text("Release timing consistency, elbow path and wrist snap. Your release apex is 0.04s early relative to elite timing — the Quick Release Builder drill targets exactly this.")
                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 8)
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct FlawsOverviewView: View {    // 046
    var body: some View {
        CanonicalScreen(testID: "screen-ios-flaws-overview") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("FLAWS").shotiqDisplay(38).padding(.top, 24)
                    Text("3 issues detected, ranked by impact on make %.")
                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 4)
                    ForEach([("Elbow drifts out at release", "HIGH", "-6% est. make rate"),
                             ("Early release before apex", "MEDIUM", "-3% est. make rate"),
                             ("Short follow-through hold", "LOW", "-1% est. make rate")], id: \.0) { t, sev, d in
                        NavigationLink { FlawDetailView(title: t, severity: sev) } label: {
                            HStack(spacing: 14) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(sev).font(.system(size: 10, weight: .bold))
                                        .padding(.horizontal, 8).padding(.vertical, 3)
                                        .background(sev == "HIGH" ? ShotIQColor.reviewRed :
                                                    sev == "MEDIUM" ? ShotIQColor.shotiqOrange : ShotIQColor.graphite)
                                        .foregroundStyle(.white).clipShape(Capsule())
                                    Text(t).shotiqBody(15, weight: .semibold).multilineTextAlignment(.leading)
                                    Text(d).font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
                            }
                            .padding(16)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                        }
                        .padding(.top, 12)
                    }
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct FlawDetailView: View {       // 047
    var title = "Elbow drifts out at release"; var severity = "HIGH"
    var body: some View {
        CanonicalScreen(testID: "screen-ios-flaw-detail") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text(severity).font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 10).padding(.vertical, 4)
                        .background(ShotIQColor.reviewRed).foregroundStyle(.white).clipShape(Capsule())
                        .padding(.top, 24)
                    Text(title.uppercased()).shotiqDisplay(32).padding(.top, 10)
                    ZStack { MediaSurface(height: 280); SkeletonOverlay() }.padding(.top, 14)
                    SectionLabel(text: "WHY IT MATTERS").padding(.top, 20)
                    Text("An elbow outside the ball's line adds lateral spin and reduces repeatability. Elite shooters keep the elbow stacked under the ball through release.")
                        .shotiqBody(14).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                    SectionLabel(text: "FIX IT WITH").padding(.top, 20)
                    NavigationLink { DrillDetailView(name: "Wall Elbow Alignment") } label: {
                        HStack {
                            Image(systemName: "figure.strengthtraining.functional").frame(width: 34)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Wall Elbow Alignment").shotiqBody(15, weight: .semibold)
                                Text("8 min · Form Focus").font(.system(size: 12)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(14)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(ShotIQColor.rule))
                    }
                    .padding(.top, 8)
                    Spacer(minLength: 30)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}
