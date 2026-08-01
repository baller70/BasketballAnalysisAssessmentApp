import SwiftUI

// Canonical auth flow — screens 001-007.

// MARK: - Shared auth chrome

/// Brand lockup used on the auth screens: wordmark + "AI ANALYSIS" caption.
private struct BrandLockup: View {
    var size: CGFloat = 30
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Wordmark(size: size)
            Text("AI ANALYSIS")
                .font(.system(size: size * 0.4, weight: .semibold))
                .kerning(size * 0.12)
                .foregroundStyle(ShotIQColor.graphite)
        }
    }
}

/// White input shell: paper background, 1px rule border, radius 8.
private struct FieldShell<Content: View>: View {
    var valid: Bool = false
    @ViewBuilder var content: Content
    var body: some View {
        HStack(spacing: 12) { content }
            .padding(.horizontal, 14)
            .frame(height: 52)
            .background(ShotIQColor.paper, in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8)
                .stroke(valid ? ShotIQColor.confirmGreen : ShotIQColor.rule))
    }
}

private struct OrDivider: View {
    var body: some View {
        HStack(spacing: 14) {
            Rectangle().fill(ShotIQColor.rule).frame(height: 1)
            Text("OR").font(.system(size: 12, weight: .semibold)).kerning(1)
                .foregroundStyle(ShotIQColor.graphite).fixedSize()
            Rectangle().fill(ShotIQColor.rule).frame(height: 1)
        }
    }
}

/// Canonical orange CTA label for NavigationLinks (same look as PrimaryButton).
@ViewBuilder
private func primaryLabel(_ title: String, icon: String? = nil) -> some View {
    HStack(spacing: 10) {
        if let icon { Image(systemName: icon) }
        Text(title).font(.system(size: 17, weight: .medium))
    }
    .frame(maxWidth: .infinity).frame(height: 54)
    .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
    .foregroundStyle(.white)
}

/// Canonical outline label for NavigationLinks (same look as SecondaryButton).
@ViewBuilder
private func secondaryLabel(_ title: String, icon: String? = nil) -> some View {
    HStack(spacing: 10) {
        if let icon { Image(systemName: icon) }
        Text(title).font(.system(size: 17, weight: .semibold))
    }
    .frame(maxWidth: .infinity).frame(height: 54)
    .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
    .foregroundStyle(ShotIQColor.ink)
}

/// Splash motion-trace glyph: dashed orange gauge arc over an ink pose polyline.
private struct SplashTraceGlyph: View {
    var body: some View {
        Canvas { ctx, size in
            let w = size.width, h = size.height
            // Dashed gauge arc, orange, with a terminal ring.
            var arc = Path()
            arc.addArc(center: CGPoint(x: w * 0.44, y: h * 0.70),
                       radius: w * 0.52,
                       startAngle: .degrees(-150), endAngle: .degrees(-35), clockwise: false)
            ctx.stroke(arc, with: .color(ShotIQColor.shotiqOrange),
                       style: StrokeStyle(lineWidth: 2.5, lineCap: .round, dash: [2, 6]))
            let endAngle = -35.0 * Double.pi / 180.0
            let ringC = CGPoint(x: w * 0.44 + CGFloat(cos(endAngle)) * w * 0.52,
                                y: h * 0.70 + CGFloat(sin(endAngle)) * w * 0.52)
            ctx.stroke(Path(ellipseIn: CGRect(x: ringC.x - 6, y: ringC.y - 6, width: 12, height: 12)),
                       with: .color(ShotIQColor.shotiqOrange), lineWidth: 2.5)
            // Ink pose polyline with joints.
            let pts: [CGPoint] = [
                CGPoint(x: 0.34 * w, y: 0.96 * h),
                CGPoint(x: 0.30 * w, y: 0.76 * h),
                CGPoint(x: 0.46 * w, y: 0.84 * h),
                CGPoint(x: 0.52 * w, y: 0.56 * h),
                CGPoint(x: 0.62 * w, y: 0.66 * h),
                CGPoint(x: 0.58 * w, y: 0.46 * h)
            ]
            var line = Path()
            line.move(to: pts[0])
            for p in pts.dropFirst() { line.addLine(to: p) }
            ctx.stroke(line, with: .color(ShotIQColor.ink),
                       style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
            for (i, p) in pts.enumerated() {
                let orange = (i == 3)
                let r: CGFloat = orange ? 7 : 5
                let dot = Path(ellipseIn: CGRect(x: p.x - r, y: p.y - r, width: 2 * r, height: 2 * r))
                ctx.fill(dot, with: .color(ShotIQColor.paper))
                ctx.stroke(dot, with: .color(orange ? ShotIQColor.shotiqOrange : ShotIQColor.ink), lineWidth: 2)
            }
        }
        .accessibilityHidden(true)
    }
}

struct SplashView: View {          // 001 · ios.splash
    @EnvironmentObject var app: AppState
    var body: some View {
        CanonicalScreen(testID: "screen-ios-splash") {
            VStack(spacing: 0) {
                Spacer()
                // App-icon tile + wordmark lockup.
                HStack(spacing: 16) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 15).fill(ShotIQColor.ink)
                        Image(systemName: "basketball")
                            .font(.system(size: 32))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                    }
                    .frame(width: 62, height: 62)
                    VStack(alignment: .leading, spacing: 2) {
                        Wordmark(size: 46)
                        Text("AI ANALYSIS")
                            .font(.system(size: 17, weight: .semibold))
                            .kerning(5)
                            .foregroundStyle(ShotIQColor.graphite)
                    }
                }
                SplashTraceGlyph()
                    .frame(width: 140, height: 140)
                    .padding(.top, 64)
                VStack(spacing: 4) {
                    Text("SEE THE DETAILS.").shotiqDisplay(32)
                    (Text("BUILD ").foregroundColor(ShotIQColor.shotiqOrange)
                        + Text("THE HABIT.").foregroundColor(ShotIQColor.graphite))
                        .font(.system(size: 25.6, weight: .heavy).width(.condensed))
                }
                .padding(.top, 64)
                Spacer()
                Spacer()
            }
        }
        .task { await app.boot() }
    }
}

struct AuthFlowView: View {
    var body: some View {
        NavigationStack { WelcomeView() }
    }
}

struct WelcomeView: View {         // 002 · ios.welcome
    private let features: [(String, String, Bool, String)] = [
        ("camera.metering.center.weighted", "CAPTURE", false, "Record from any angle."),
        ("film", "ANALYZE", true, "AI breaks down every rep."),
        ("point.3.connected.trianglepath.dotted", "TRAIN", false, "Get guided drills that fit your goals."),
        ("chart.line.uptrend.xyaxis", "TRACK", false, "Monitor progress. Stay consistent. Keep improving.")
    ]
    var body: some View {
        CanonicalScreen(testID: "screen-ios-welcome") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top, spacing: 16) {
                        VStack(alignment: .leading, spacing: 0) {
                            BrandLockup(size: 34)
                            Text("CAPTURE.").shotiqDisplay(46).padding(.top, 30)
                            Text("ANALYZE.")
                                .font(.system(size: 36.8, weight: .heavy).width(.condensed))
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                .lineLimit(1).minimumScaleFactor(0.6)
                            Text("TRAIN.").shotiqDisplay(46)
                            Text("TRACK.").shotiqDisplay(46)
                            Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.vertical, 14)
                            Text("Instant AI analysis. Clear insights. Smarter reps. Better results.")
                                .font(.system(size: 15))
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        // Hero: jump-shot media placeholder with pose glyph.
                        ZStack {
                            RoundedRectangle(cornerRadius: 12).fill(ShotIQColor.warmCanvas)
                            VStack(spacing: 16) {
                                Image(systemName: "figure.basketball")
                                    .font(.system(size: 60, weight: .light))
                                    .foregroundStyle(ShotIQColor.graphite)
                                PhaseGlyph(active: true, size: 36)
                            }
                        }
                        .frame(width: 168, height: 400)
                    }
                    .padding(.top, 24)

                    HStack(spacing: 12) {
                        Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                        Text("BUILT FOR YOUR GAME")
                            .font(.system(size: 14, weight: .bold)).kerning(1)
                            .foregroundStyle(ShotIQColor.ink).fixedSize()
                        Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                    }
                    .padding(.top, 40)

                    HStack(alignment: .top, spacing: 2) {
                        ForEach(Array(features.enumerated()), id: \.offset) { i, f in
                            if i > 0 {
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 11))
                                    .foregroundStyle(ShotIQColor.muted)
                                    .padding(.top, 12)
                            }
                            VStack(spacing: 6) {
                                Image(systemName: f.0)
                                    .font(.system(size: 24))
                                    .foregroundStyle(ShotIQColor.ink)
                                    .frame(height: 30)
                                Text(f.1)
                                    .font(.system(size: 13, weight: .heavy).width(.condensed))
                                    .kerning(0.5)
                                    .foregroundStyle(f.2 ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                Text(f.3)
                                    .font(.system(size: 11))
                                    .foregroundStyle(ShotIQColor.graphite)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.top, 22)

                    VStack(spacing: 14) {
                        NavigationLink { SignInView() } label: {
                            primaryLabel("Sign in")
                        }
                        NavigationLink { CreateAccountView() } label: {
                            Text("Create account")
                                .font(.system(size: 17, weight: .medium))
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control)
                                    .stroke(ShotIQColor.shotiqOrange))
                                .foregroundStyle(ShotIQColor.ink)
                        }
                    }
                    .padding(.top, 34).padding(.bottom, 36)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

@MainActor
final class SignInViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var error: String?
    @Published var busy = false

    func submit(app: AppState) async {
        guard !email.isEmpty, !password.isEmpty else { error = "Email and password are required"; return }
        busy = true; error = nil
        do {
            let user = try await APIClient.shared.signIn(email: email, password: password)
            app.signedIn(user)
        } catch {
            self.error = "Sign in failed — check your credentials."
        }
        busy = false
    }
}

struct SignInView: View {          // 003 · ios.sign-in
    @EnvironmentObject var app: AppState
    @StateObject private var vm = SignInViewModel()
    @State private var showPassword = false
    @State private var rememberMe = false

    private var emailValid: Bool { vm.email.contains("@") && vm.email.contains(".") }
    private var passwordValid: Bool { vm.password.count >= 8 }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-sign-in") {
            VStack(spacing: 0) {
                HStack {
                    BrandLockup(size: 30)
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.top, 16).padding(.bottom, 12)
                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("SIGN IN").shotiqDisplay(64).padding(.top, 30)
                        Text("Continue your training, saved analyses, and progress.")
                            .shotiqBody(17).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)

                        SectionLabel(text: "EMAIL").padding(.top, 30)
                        FieldShell {
                            Image(systemName: "envelope")
                                .font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
                            TextField("Enter your email", text: $vm.email)
                                .textContentType(.emailAddress).keyboardType(.emailAddress)
                                .autocapitalization(.none)
                            if emailValid {
                                Image(systemName: "checkmark.circle")
                                    .font(.system(size: 18))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                            }
                        }
                        .padding(.top, 8)
                        .accessibilityIdentifier("signin-email")
                        if emailValid {
                            Text("Looks good.")
                                .font(.system(size: 14)).foregroundStyle(ShotIQColor.confirmGreen)
                                .padding(.top, 6)
                        }

                        SectionLabel(text: "PASSWORD").padding(.top, 20)
                        FieldShell {
                            Image(systemName: "lock")
                                .font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
                            Group {
                                if showPassword { TextField("Enter your password", text: $vm.password) }
                                else { SecureField("Enter your password", text: $vm.password) }
                            }
                            .textContentType(.password)
                            Button { showPassword.toggle() } label: {
                                Image(systemName: showPassword ? "eye.slash" : "eye")
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .accessibilityLabel(showPassword ? "Hide password" : "Show password")
                        }
                        .padding(.top, 8)
                        .accessibilityIdentifier("signin-password")
                        if passwordValid {
                            Text("Password looks good.")
                                .font(.system(size: 14)).foregroundStyle(ShotIQColor.confirmGreen)
                                .padding(.top, 6)
                        }

                        HStack {
                            Button { rememberMe.toggle() } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: rememberMe ? "checkmark.square.fill" : "square")
                                        .font(.system(size: 19))
                                        .foregroundStyle(rememberMe ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                    Text("Remember me")
                                        .font(.system(size: 15)).foregroundStyle(ShotIQColor.ink)
                                }
                            }
                            Spacer()
                            NavigationLink { ForgotPasswordView() } label: {
                                Text("Forgot password?").font(.system(size: 15))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                        .padding(.top, 18)

                        if let e = vm.error {
                            Text(e).font(.system(size: 14)).foregroundStyle(ShotIQColor.reviewRed).padding(.top, 10)
                                .accessibilityIdentifier("signin-error")
                        }

                        PrimaryButton(title: vm.busy ? "Signing in…" : "Sign in",
                                      icon: "camera.metering.center.weighted") {
                            Task { await vm.submit(app: app) }
                        }
                        .disabled(vm.busy)
                        .padding(.top, 24)
                        .accessibilityIdentifier("signin-submit")

                        OrDivider().padding(.top, 26)

                        SecondaryButton(title: "Continue with Apple", icon: "apple.logo").padding(.top, 18)
                        SecondaryButton(title: "Continue with Google", icon: "g.circle").padding(.top, 12)

                        VStack(spacing: 10) {
                            Text("Don't have an account?")
                                .font(.system(size: 15)).foregroundStyle(ShotIQColor.graphite)
                            NavigationLink { CreateAccountView() } label: {
                                Text("Create account")
                                    .font(.system(size: 17))
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                        .frame(maxWidth: .infinity).padding(.top, 26).padding(.bottom, 40)
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
    }
}

struct CreateAccountView: View {   // 004 · ios.create-account
    @State private var name = ""; @State private var email = ""; @State private var password = ""
    @State private var lastName = ""; @State private var confirm = ""
    @State private var showPassword = false; @State private var showConfirm = false
    @State private var agreed = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-create-account") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Wordmark(size: 30).padding(.top, 16)
                    Text("CREATE ACCOUNT").shotiqDisplay(54).padding(.top, 26)
                    Text("Create your ShotIQ account to save analyses, training, goals, and progress.")
                        .shotiqBody(16).foregroundStyle(ShotIQColor.graphite).padding(.top, 8)

                    HStack(spacing: 14) {
                        Image(systemName: "laptopcomputer.and.iphone")
                            .font(.system(size: 26)).foregroundStyle(ShotIQColor.ink)
                        Text("One account across web and iOS.")
                            .shotiqBody(16)
                    }
                    .padding(.top, 24)

                    SectionLabel(text: "FIRST NAME").padding(.top, 26)
                    FieldShell { TextField("First name", text: $name).textContentType(.givenName) }
                        .padding(.top, 8)

                    SectionLabel(text: "LAST NAME").padding(.top, 20)
                    FieldShell { TextField("Last name", text: $lastName).textContentType(.familyName) }
                        .padding(.top, 8)

                    SectionLabel(text: "EMAIL").padding(.top, 20)
                    FieldShell {
                        TextField("Enter your email", text: $email)
                            .textContentType(.emailAddress).keyboardType(.emailAddress)
                            .autocapitalization(.none)
                    }
                    .padding(.top, 8)

                    SectionLabel(text: "PASSWORD").padding(.top, 20)
                    FieldShell {
                        Group {
                            if showPassword { TextField("Create a password", text: $password) }
                            else { SecureField("Create a password", text: $password) }
                        }
                        .textContentType(.newPassword)
                        Button { showPassword.toggle() } label: {
                            Image(systemName: showPassword ? "eye" : "eye.slash")
                                .foregroundStyle(ShotIQColor.ink)
                        }
                        .accessibilityLabel(showPassword ? "Hide password" : "Show password")
                    }
                    .padding(.top, 8)
                    Text("Use at least 8 characters.")
                        .font(.system(size: 13)).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)

                    SectionLabel(text: "CONFIRM PASSWORD").padding(.top, 20)
                    FieldShell {
                        Group {
                            if showConfirm { TextField("Repeat your password", text: $confirm) }
                            else { SecureField("Repeat your password", text: $confirm) }
                        }
                        .textContentType(.newPassword)
                        Button { showConfirm.toggle() } label: {
                            Image(systemName: showConfirm ? "eye" : "eye.slash")
                                .foregroundStyle(ShotIQColor.ink)
                        }
                        .accessibilityLabel(showConfirm ? "Hide password" : "Show password")
                    }
                    .padding(.top, 8)

                    Button { agreed.toggle() } label: {
                        HStack(spacing: 10) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 5)
                                    .stroke(agreed ? ShotIQColor.confirmGreen : ShotIQColor.rule, lineWidth: 1.5)
                                    .frame(width: 22, height: 22)
                                if agreed {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(ShotIQColor.confirmGreen)
                                }
                            }
                            (Text("I agree to the ")
                                + Text("Terms of Use").foregroundColor(ShotIQColor.shotiqOrange)
                                + Text(" and ")
                                + Text("Privacy Policy").foregroundColor(ShotIQColor.shotiqOrange)
                                + Text("."))
                                .font(.system(size: 15))
                                .foregroundStyle(ShotIQColor.ink)
                        }
                    }
                    .padding(.top, 22)
                    .accessibilityLabel("I agree to the Terms of Use and Privacy Policy")

                    NavigationLink { VerifyEmailView(email: email) } label: {
                        primaryLabel("Create account", icon: "camera.metering.center.weighted")
                    }
                    .disabled(!agreed || email.isEmpty || password.isEmpty)
                    .padding(.top, 20)

                    OrDivider().padding(.top, 20)

                    NavigationLink { SignInView() } label: {
                        secondaryLabel("Sign in", icon: "point.3.connected.trianglepath.dotted")
                    }
                    .padding(.top, 20).padding(.bottom, 40)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct VerifyEmailView: View {     // 005 · ios.verify-email
    var email: String = "you@example.com"
    @State private var code = ""
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    private let helpRows: [(String, String)] = [
        ("envelope", "Check your spam or promotions folder"),
        ("clock", "Wait a few minutes and tap “Resend email”"),
        ("questionmark.circle", "Need help? Contact support")
    ]

    var body: some View {
        CanonicalScreen(testID: "screen-ios-verify-email") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(spacing: 0) {
                        HStack {
                            Button { dismiss() } label: {
                                Image(systemName: "arrow.left")
                                    .font(.system(size: 22, weight: .semibold))
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .accessibilityLabel("Back")
                            Spacer()
                        }
                        .padding(.top, 18)

                        Text("VERIFY YOUR EMAIL").shotiqDisplay(52)
                            .multilineTextAlignment(.center).padding(.top, 22)
                        (Text("Enter the code we sent to\n")
                            + Text(email).fontWeight(.semibold).foregroundColor(ShotIQColor.ink)
                            + Text("."))
                            .font(.system(size: 17))
                            .foregroundStyle(ShotIQColor.graphite)
                            .multilineTextAlignment(.center)
                            .padding(.top, 12)

                        // Six code boxes over an invisible entry field.
                        ZStack {
                            HStack(spacing: 10) {
                                ForEach(0..<6, id: \.self) { i in
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 8).fill(ShotIQColor.paper)
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(i == code.count ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                                        if i < code.count {
                                            Text(String(Array(code)[i]))
                                                .font(.custom("DINCondensed-Bold", size: 34))
                                                .foregroundStyle(ShotIQColor.ink)
                                        } else if i == code.count {
                                            Rectangle().fill(ShotIQColor.shotiqOrange)
                                                .frame(width: 2, height: 26)
                                        }
                                    }
                                    .frame(width: 48, height: 58)
                                }
                            }
                            TextField("", text: $code)
                                .keyboardType(.numberPad)
                                .textContentType(.oneTimeCode)
                                .foregroundStyle(.clear)
                                .tint(.clear)
                                .frame(height: 58)
                                .contentShape(Rectangle())
                                .onChange(of: code) { _, new in
                                    code = String(new.filter(\.isNumber).prefix(6))
                                }
                        }
                        .padding(.top, 30)

                        (Text("Resend code in ").foregroundColor(ShotIQColor.graphite)
                            + Text("0:42").foregroundColor(ShotIQColor.shotiqOrange).fontWeight(.semibold))
                            .font(.system(size: 17))
                            .padding(.top, 26)

                        Button("Resend email") {}
                            .font(.system(size: 17))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .underline()
                            .padding(.top, 18)

                        PrimaryButton(title: "Open email app", icon: "envelope") {
                            app.signedIn(APIUser(email: email, profileComplete: false))
                        }
                        .padding(.top, 26)

                        SecondaryButton(title: "Use a different email", icon: "envelope.badge") {
                            dismiss()
                        }
                        .padding(.top, 12)

                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 28)

                        HStack {
                            Text("DIDN'T GET THE EMAIL?")
                                .font(.system(size: 14, weight: .bold)).kerning(0.5)
                                .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                        }
                        .padding(.top, 20)

                        VStack(spacing: 0) {
                            ForEach(helpRows, id: \.1) { icon, text in
                                HStack(spacing: 14) {
                                    Image(systemName: icon)
                                        .font(.system(size: 20))
                                        .foregroundStyle(ShotIQColor.ink)
                                        .frame(width: 32)
                                    Text(text).font(.system(size: 16)).foregroundStyle(ShotIQColor.ink)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 13))
                                        .foregroundStyle(ShotIQColor.muted)
                                }
                                .padding(.vertical, 16)
                                .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                            }
                        }
                        .padding(.top, 4)

                        HStack(spacing: 16) {
                            Image(systemName: "checkmark.shield")
                                .font(.system(size: 34, weight: .light))
                                .foregroundStyle(ShotIQColor.ink)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Your account is safe").font(.system(size: 17, weight: .semibold))
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("We'll never share your email or data.")
                                    .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(.top, 24).padding(.bottom, 40)
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
    }
}

struct ForgotPasswordView: View {  // 006 · ios.forgot-password
    @State private var email = ""
    @State private var sent = false
    @Environment(\.dismiss) private var dismiss

    private var emailValid: Bool { email.contains("@") && email.contains(".") }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-forgot-password") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Button { dismiss() } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "arrow.left")
                                    .font(.system(size: 20, weight: .semibold))
                                Text("BACK TO SIGN IN")
                                    .font(.system(size: 13, weight: .bold)).kerning(1)
                            }
                            .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 18)

                        Text("RESET PASSWORD").shotiqDisplay(52).padding(.top, 20)
                        Text("Enter your account email and we will send a secure reset link.")
                            .shotiqBody(17).foregroundStyle(ShotIQColor.graphite).padding(.top, 8)

                        SectionLabel(text: "EMAIL ADDRESS").padding(.top, 26)
                        FieldShell(valid: emailValid) {
                            Image(systemName: "envelope")
                                .font(.system(size: 17)).foregroundStyle(ShotIQColor.ink)
                            TextField("Enter your email", text: $email)
                                .keyboardType(.emailAddress).autocapitalization(.none)
                            if emailValid {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 20))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                            }
                        }
                        .padding(.top, 8)

                        Button { sent = true } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "camera.metering.center.weighted")
                                Text("SEND RESET LINK")
                                    .font(.system(size: 18, weight: .heavy).width(.condensed))
                                    .kerning(1.5)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                            .foregroundStyle(.white)
                        }
                        .padding(.top, 24)

                        if sent {
                            ShotIQCard {
                                HStack(spacing: 16) {
                                    ZStack {
                                        Circle().stroke(ShotIQColor.confirmGreen, lineWidth: 2)
                                            .frame(width: 44, height: 44)
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 18, weight: .semibold))
                                            .foregroundStyle(ShotIQColor.confirmGreen)
                                    }
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("RESET LINK SENT")
                                            .font(.system(size: 19, weight: .heavy).width(.condensed))
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text("Check your inbox for secure reset instructions.")
                                            .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(18)
                            }
                            .padding(.top, 24)
                        }

                        OrDivider().padding(.top, 34)

                        Button { dismiss() } label: {
                            HStack(spacing: 8) {
                                Text("BACK TO SIGN IN")
                                    .font(.system(size: 15, weight: .bold)).kerning(1.5)
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 13, weight: .bold))
                            }
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 26)

                        Button {} label: {
                            HStack(spacing: 8) {
                                Image(systemName: "questionmark.circle").font(.system(size: 17))
                                Text("Need help?").font(.system(size: 16)).underline()
                            }
                            .foregroundStyle(ShotIQColor.graphite)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 20).padding(.bottom, 40)
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
    }
}

struct ResetPasswordView: View {   // 007 · ios.reset-password
    @State private var p1 = ""; @State private var p2 = ""
    @State private var show1 = false; @State private var show2 = false
    @Environment(\.dismiss) private var dismiss

    private var checks: [(String, Bool)] {
        [("At least 8 characters long", p1.count >= 8),
         ("Includes an uppercase letter", p1.contains(where: \.isUppercase)),
         ("Includes a lowercase letter", p1.contains(where: \.isLowercase)),
         ("Includes a number", p1.contains(where: \.isNumber)),
         ("Includes a special character", p1.contains(where: { !$0.isLetter && !$0.isNumber })),
         ("Passwords match", !p1.isEmpty && p1 == p2)]
    }
    private var strength: Int { checks.prefix(5).filter(\.1).count }
    private var strengthLabel: String { strength >= 5 ? "STRONG" : strength >= 3 ? "GOOD" : "WEAK" }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-reset-password") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 16) {
                            VStack(alignment: .leading, spacing: 0) {
                                Button { dismiss() } label: {
                                    HStack(spacing: 10) {
                                        Image(systemName: "arrow.left")
                                            .font(.system(size: 20, weight: .semibold))
                                        Text("BACK TO SIGN IN")
                                            .font(.system(size: 13, weight: .bold)).kerning(1)
                                    }
                                    .foregroundStyle(ShotIQColor.graphite)
                                }
                                Text("RESET PASSWORD").shotiqDisplay(52).padding(.top, 18)
                                Text("Enter a new password for your ShotIQ account. Make it strong and easy for you to remember.")
                                    .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                                    .padding(.top, 8)
                            }
                            ZStack {
                                RoundedRectangle(cornerRadius: 10).fill(ShotIQColor.warmCanvas)
                                Image(systemName: "figure.basketball")
                                    .font(.system(size: 44, weight: .light))
                                    .foregroundStyle(ShotIQColor.graphite)
                            }
                            .frame(width: 150, height: 180)
                        }
                        .padding(.top, 18)

                        HStack(spacing: 16) {
                            Image(systemName: "camera.metering.center.weighted")
                                .font(.system(size: 30))
                                .foregroundStyle(ShotIQColor.ink)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("RESET LINK VERIFIED")
                                    .font(.system(size: 15, weight: .bold)).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("This reset link is valid.\nYou can set a new password.")
                                    .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(16)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 22)

                        SectionLabel(text: "NEW PASSWORD").padding(.top, 24)
                        FieldShell {
                            Group {
                                if show1 { TextField("Enter new password", text: $p1) }
                                else { SecureField("Enter new password", text: $p1) }
                            }
                            .textContentType(.newPassword)
                            Button { show1.toggle() } label: {
                                Image(systemName: show1 ? "eye.slash" : "eye")
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .accessibilityLabel(show1 ? "Hide password" : "Show password")
                        }
                        .padding(.top, 8)

                        HStack(spacing: 8) {
                            ForEach(0..<4, id: \.self) { i in
                                Capsule()
                                    .fill(i < min(strength, 3) ? ShotIQColor.shotiqOrange : ShotIQColor.rule)
                                    .frame(height: 6)
                            }
                            Text(p1.isEmpty ? "" : strengthLabel)
                                .font(.system(size: 13, weight: .bold)).kerning(0.5)
                                .foregroundStyle(ShotIQColor.confirmGreen)
                                .frame(width: 66, alignment: .leading)
                        }
                        .padding(.top, 12)

                        SectionLabel(text: "CONFIRM PASSWORD").padding(.top, 22)
                        FieldShell {
                            Group {
                                if show2 { TextField("Confirm new password", text: $p2) }
                                else { SecureField("Confirm new password", text: $p2) }
                            }
                            .textContentType(.newPassword)
                            Button { show2.toggle() } label: {
                                Image(systemName: show2 ? "eye.slash" : "eye")
                                    .foregroundStyle(ShotIQColor.ink)
                            }
                            .accessibilityLabel(show2 ? "Hide password" : "Show password")
                        }
                        .padding(.top, 8)

                        VStack(alignment: .leading, spacing: 12) {
                            Text("PASSWORD REQUIREMENTS")
                                .font(.system(size: 14, weight: .bold)).kerning(0.5)
                                .foregroundStyle(ShotIQColor.ink)
                            ForEach(checks, id: \.0) { label, met in
                                HStack(spacing: 10) {
                                    Image(systemName: met ? "checkmark.circle.fill" : "circle")
                                        .font(.system(size: 17))
                                        .foregroundStyle(met ? ShotIQColor.confirmGreen : ShotIQColor.muted)
                                    Text(label).font(.system(size: 15)).foregroundStyle(ShotIQColor.ink)
                                }
                            }
                        }
                        .padding(18)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 24)

                        PrimaryButton(title: "Reset password", icon: "camera.metering.center.weighted")
                            .disabled(p1.isEmpty || p1 != p2)
                            .padding(.top, 24)

                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 28)

                        HStack(alignment: .top, spacing: 16) {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 30, weight: .light))
                                .foregroundStyle(ShotIQColor.ink)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("RESET LINK EXPIRED?")
                                    .font(.system(size: 15, weight: .bold)).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("For your security, reset links expire after 15 minutes.")
                                    .font(.system(size: 14)).foregroundStyle(ShotIQColor.graphite)
                                Button("Request a new reset link") {}
                                    .font(.system(size: 14))
                                    .foregroundStyle(ShotIQColor.analysisBlue)
                            }
                            Spacer()
                        }
                        .padding(.top, 20).padding(.bottom, 40)
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
    }
}
