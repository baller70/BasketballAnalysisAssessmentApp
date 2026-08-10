import SwiftUI
import UIKit

// Canonical auth flow — screens 001-007.

/// Opens the user's mail app: tries the Mail app scheme first, falls back to
/// a mailto: compose sheet (which any configured mail client handles).
@MainActor
private func openMailApp() {
    guard let mail = URL(string: "message://") else { return }
    UIApplication.shared.open(mail, options: [:]) { ok in
        if !ok, let fallback = URL(string: "mailto:") {
            UIApplication.shared.open(fallback)
        }
    }
}

/// Help/guide page on the live web app (there is no dedicated support inbox).
private let supportGuideURL = URL(string: "https://shotiq.194-146-12-139.sslip.io/guide")!

// MARK: - Shared auth chrome

/// Brand lockup used on the auth screens: wordmark + "AI ANALYSIS" caption.
private struct BrandLockup: View {
    var size: CGFloat = 30
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Wordmark(size: size)
            Text("AI ANALYSIS")
                .shotiqBody(size * 0.4, weight: .semibold)
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
            Text("OR").shotiqBody(12, weight: .semibold).kerning(1)
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
        Text(title).shotiqBody(17, weight: .medium)
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
        Text(title).shotiqBody(17, weight: .semibold)
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
            ZStack {
                Image("photo-generated-splash-001")
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .opacity(0.78)
                    .saturation(0.9)
                    .clipped()
                    .ignoresSafeArea()
                LinearGradient(colors: [.black.opacity(0.66), .black.opacity(0.24), .black.opacity(0.70)],
                               startPoint: .top,
                               endPoint: .bottom)
                    .ignoresSafeArea()
                VStack(spacing: 0) {
                    Spacer()
                    Image("shotiq-header-logo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 330)
                        .accessibilityLabel("ShotIQ AI Analysis")
                        .padding(.top, 22)
                    VStack(spacing: 4) {
                        Text("SEE THE DETAILS.")
                            .shotiqDisplay(32)
                            .foregroundStyle(.white)
                        (Text("BUILD ").foregroundColor(ShotIQColor.shotiqOrange)
                            + Text("THE HABIT.").foregroundColor(.white))
                            .shotiqCondensed(25.6, weight: .heavy)
                    }
                    .padding(.top, 312)
                    Spacer()
                    Spacer()
                }
            }
        }
        // Tapping the brand moment moves on immediately. In the shipped app that
        // is just an impatient user skipping a 2.5s hold; under
        // -uiTestHoldSplash it is the only thing that ends the hold, which is
        // what lets the screenshot harness see screen 001 at all (its first
        // accessibility query lands 15-30s after launch — see
        // UITestHooks.holdSplash).
        .contentShape(Rectangle())
        .onTapGesture { app.leaveSplash() }
        .task { await app.boot() }
    }
}

struct AuthFlowView: View {
    var body: some View {
        NavigationStack {
            // Test-only: `-uiTestStage verify-email|reset-password` roots the
            // signed-out stack at canonical 005 / 007 instead of Welcome. 005
            // otherwise needs a real network sign-up and 007 a token that only
            // arrives in an email, so the screenshot walk could never see
            // either. `UITestHooks.stage` is nil in a shipped launch, so both
            // branches are dead code there — see UITestHooks.stage.
            if UITestHooks.stage == "create-account" {
                CreateAccountView()
            } else if UITestHooks.stage == "verify-email" {
                // Canonical 005 addresses the code to marcus@example.com.
                VerifyEmailView(email: "marcus@example.com")
            } else if UITestHooks.stage == "reset-password" {
                // Canonical 007 is the *verified-link* state, so hand it a token.
                ResetPasswordView(token: "uitest-reset-token")
            } else {
                WelcomeView()
            }
        }
    }
}

struct WelcomeView: View {         // 002 · ios.welcome
    @State private var toast: ShotIQToast?
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
                                .shotiqCondensed(36.8, weight: .heavy)
                                .foregroundStyle(ShotIQColor.shotiqOrange)
                                .lineLimit(1).minimumScaleFactor(0.6)
                            Text("TRAIN.").shotiqDisplay(46)
                            Text("TRACK.").shotiqDisplay(46)
                            Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.vertical, 14)
                            Text("Instant AI analysis. Clear insights. Smarter reps. Better results.")
                                .shotiqBody(15)
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        // Hero: the canonical jump-shot frame.
                        CanonicalPhoto("002-visual-005", width: 168, height: 400, cornerRadius: 12)
                    }
                    .padding(.top, 24)

                    HStack(spacing: 12) {
                        Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                        Text("BUILT FOR YOUR GAME")
                            .shotiqBody(14, weight: .bold).kerning(1)
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
                                // 002's four pillars are four different canonical
                                // marks; CAPTURE and TRAIN shipped as two of the
                                // three symbols the whole app was reusing.
                                ShotIQConceptGlyph(concept: f.1, fallback: f.0, size: 32)
                                    .foregroundStyle(ShotIQColor.ink)
                                    .frame(height: 34)
                                Text(f.1)
                                    .shotiqCondensed(13, weight: .heavy)
                                    .kerning(0.5)
                                    .foregroundStyle(f.2 ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                Text(f.3)
                                    .shotiqBody(11)
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
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening sign in")
                        })
                        NavigationLink { CreateAccountView() } label: {
                            Text("Create account")
                                .shotiqBody(17, weight: .medium)
                                .frame(maxWidth: .infinity).frame(height: 54)
                                .overlay(RoundedRectangle(cornerRadius: ShotIQRadius.control)
                                    .stroke(ShotIQColor.shotiqOrange))
                                .foregroundStyle(ShotIQColor.ink)
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening account setup")
                        })
                    }
                    .padding(.top, 34).padding(.bottom, 36)
                }
                .padding(.horizontal, 24)
            }
        }
        .shotiqToast($toast)
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
    @State private var toast: ShotIQToast?

    private var emailValid: Bool { vm.email.contains("@") && vm.email.contains(".") }
    private var passwordValid: Bool { vm.password.count >= 8 }

    private func submitSignIn() {
        guard emailValid else {
            vm.error = "Enter a valid email address."
            toast = .error("Check email", "Use the email address on your ShotIQ account.")
            return
        }
        guard passwordValid else {
            vm.error = "Password must be at least 8 characters."
            toast = .error("Check password", "Use at least 8 characters.")
            return
        }
        toast = .progress("Signing in", "Checking your ShotIQ account.", progress: 0.45)
        Task {
            await vm.submit(app: app)
            if let error = vm.error {
                toast = .error("Sign in failed", error)
            }
        }
    }

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
                                .shotiqBody(14).foregroundStyle(ShotIQColor.confirmGreen)
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
                                .shotiqBody(14).foregroundStyle(ShotIQColor.confirmGreen)
                                .padding(.top, 6)
                        }

                        HStack {
                            Button {
                                rememberMe.toggle()
                                toast = .success(rememberMe ? "Remember me on" : "Remember me off",
                                                 rememberMe ? "ShotIQ will keep this sign-in preference." : "ShotIQ will ask again next time.")
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: rememberMe ? "checkmark.square.fill" : "square")
                                        .font(.system(size: 19))
                                        .foregroundStyle(rememberMe ? ShotIQColor.shotiqOrange : ShotIQColor.ink)
                                    Text("Remember me")
                                        .shotiqBody(15).foregroundStyle(ShotIQColor.ink)
                                }
                            }
                            Spacer()
                            NavigationLink { ForgotPasswordView() } label: {
                                Text("Forgot password?").shotiqBody(15)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                        .padding(.top, 18)

                        if let e = vm.error {
                            Text(e).shotiqBody(14).foregroundStyle(ShotIQColor.reviewRed).padding(.top, 10)
                                .accessibilityIdentifier("signin-error")
                        }

                        PrimaryButton(title: vm.busy ? "Signing in…" : "Sign in",
                                      icon: "camera.metering.center.weighted") {
                            submitSignIn()
                        }
                        .disabled(vm.busy)
                        .padding(.top, 24)
                        .accessibilityIdentifier("signin-submit")

                        OrDivider().padding(.top, 26)

                        NavigationLink { CreateAccountView() } label: {
                            authRouteLabel("person.badge.plus", "Create email account")
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening account creation", "Create a ShotIQ email login.")
                        })
                        .buttonStyle(.plain)
                        .padding(.top, 18)
                        NavigationLink { ForgotPasswordView() } label: {
                            authRouteLabel("key", "Reset email password")
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening password reset", "Send a reset link to your email.")
                        })
                        .buttonStyle(.plain)
                        .padding(.top, 12)

                        VStack(spacing: 10) {
                            Text("Don't have an account?")
                                .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                            NavigationLink { CreateAccountView() } label: {
                                Text("Create account")
                                    .shotiqBody(17)
                                    .foregroundStyle(ShotIQColor.shotiqOrange)
                            }
                        }
                        .frame(maxWidth: .infinity).padding(.top, 26).padding(.bottom, 40)
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
        .shotiqToast($toast)
    }

    private func authRouteLabel(_ icon: String, _ title: String) -> some View {
        HStack(spacing: 10) {
            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: icon),
                                     size: 18,
                                     label: nil)
            Text(title).shotiqBody(ShotIQType.button)
        }
        .frame(maxWidth: .infinity).frame(height: ShotIQType.controlHeight)
        .background(RoundedRectangle(cornerRadius: ShotIQRadius.control).stroke(ShotIQColor.rule))
        .foregroundStyle(ShotIQColor.ink)
        .frame(minHeight: 44)
    }
}

struct CreateAccountView: View {   // 004 · ios.create-account
    @State private var name = ""; @State private var email = ""; @State private var password = ""
    @State private var lastName = ""; @State private var confirm = ""
    @State private var showPassword = false; @State private var showConfirm = false
    @State private var agreed = false
    @State private var busy = false
    @State private var error: String?
    @State private var goVerify = false
    @State private var toast: ShotIQToast?

    private var cleanFirstName: String { name.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var cleanLastName: String { lastName.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var cleanEmail: String { email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
    private var emailValid: Bool { cleanEmail.contains("@") && cleanEmail.contains(".") }

    @MainActor
    private func createAccount() async {
        guard !cleanFirstName.isEmpty, !cleanLastName.isEmpty else {
            error = "Enter your first and last name."
            toast = .error("Name required", "Add your first and last name.")
            return
        }
        guard emailValid else {
            error = "Enter a valid email address."
            toast = .error("Check email", "Use a valid email for verification.")
            return
        }
        guard agreed else {
            error = "Accept the terms before creating an account."
            toast = .error("Terms required", "Accept the Terms of Use and Privacy Policy.")
            return
        }
        guard password == confirm else {
            error = "Passwords do not match."
            toast = .error("Passwords do not match", "Confirm password must match your password.")
            return
        }
        guard password.count >= 8 else {
            error = "Use at least 8 characters for your password."
            toast = .error("Password too short", "Use at least 8 characters.")
            return
        }
        busy = true; error = nil
        toast = .progress("Creating account", "Saving your ShotIQ profile.", progress: 0.45)
        struct SignupResp: Codable { var user: APIUser }
        do {
            let _: SignupResp = try await APIClient.shared.call(
                "/api/auth/signup", method: "POST",
                body: ["email": cleanEmail, "password": password,
                       "firstName": cleanFirstName, "lastName": cleanLastName])
            // Store mobile access/refresh tokens so the rest of the flow is authenticated.
            _ = try? await APIClient.shared.signIn(email: cleanEmail, password: password)
            toast = .success("Account created", "Check your email to verify ShotIQ.")
            goVerify = true
        } catch APIClient.APIError.http(400) {
            error = "Could not create the account — that email may already be registered."
            toast = .error("Account not created", "That email may already be registered.")
        } catch {
            self.error = "Could not create the account. Check your connection and try again."
            toast = .error("Account not created", "Check your connection and try again.")
        }
        busy = false
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-create-account") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Wordmark(size: 30).padding(.top, 16)
                    Text("CREATE ACCOUNT").shotiqDisplay(54).padding(.top, 26)
                    Text("Create your ShotIQ account to save analyses, training, goals, and progress.")
                        .shotiqBody(16).foregroundStyle(ShotIQColor.graphite).padding(.top, 8)

                    HStack(spacing: 14) {
                        ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "laptopcomputer.and.iphone"), size: 32)
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
                        .shotiqBody(13).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)

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

                    Button {
                        agreed.toggle()
                        toast = .success(agreed ? "Terms accepted" : "Terms unchecked",
                                         agreed ? "You can create your ShotIQ account." : "Accept terms to create an account.")
                    } label: {
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

                    if let error {
                        Text(error)
                            .shotiqBody(14).foregroundStyle(ShotIQColor.reviewRed)
                            .padding(.top, 12)
                            .accessibilityIdentifier("signup-error")
                    }

                    Button { Task { await createAccount() } } label: {
                        primaryLabel(busy ? "Creating account…" : "Create account",
                                     icon: "camera.metering.center.weighted")
                    }
                    .disabled(busy)
                    .padding(.top, 20)
                    .navigationDestination(isPresented: $goVerify) { VerifyEmailView(email: email) }

                    OrDivider().padding(.top, 20)

                    NavigationLink { SignInView() } label: {
                        secondaryLabel("Sign in", icon: "point.3.connected.trianglepath.dotted")
                    }
                    .padding(.top, 20).padding(.bottom, 40)
                }
                .padding(.horizontal, 24)
            }
        }
        .shotiqToast($toast)
    }
}

struct VerifyEmailView: View {     // 005 · ios.verify-email
    var email: String = "you@example.com"
    /// Production verification is link-based: the emailed link hits
    /// /api/auth/verify-email, then this screen checks account status through
    /// /api/auth/resend-verification.
    @State private var resendBusy = false
    @State private var verifyBusy = false
    @State private var resendNote: String?
    @State private var resendOK = false
    @State private var verifyError: String?
    @State private var toast: ShotIQToast?
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    private let helpRows: [(String, String)] = [
        ("envelope", "Check your spam or promotions folder"),
        ("clock", "Wait a few minutes and tap “Resend email”"),
        ("questionmark.circle", "Need help? Contact support")
    ]

    /// POST /api/auth/resend-verification — re-issues the verify link for the
    /// signed-in account (tokens were stored during signup).
    @MainActor
    private func resend() async {
        guard !resendBusy else { return }
        resendBusy = true; resendNote = nil
        verifyError = nil
        toast = .progress("Sending email", "Requesting a new ShotIQ verification link.", progress: 0.5)
        struct Resp: Codable { var success: Bool?; var alreadyVerified: Bool? }
        do {
            let r: Resp = try await APIClient.shared.call("/api/auth/resend-verification", method: "POST")
            resendOK = true
            resendNote = (r.alreadyVerified ?? false)
                ? "Your email is already verified — you're all set."
                : "Verification email sent — check your inbox."
            toast = .success((r.alreadyVerified ?? false) ? "Already verified" : "Email sent",
                             resendNote)
        } catch {
            resendOK = false
            resendNote = "Could not send the email. Try again shortly."
            toast = .error("Email not sent", resendNote)
        }
        resendBusy = false
    }

    /// The backend verifies email by link, then exposes the signed-in user's
    /// verification state through GET /api/auth/resend-verification. Do not gate
    /// this on a fake one-time code; the real customer action is opening the
    /// newest ShotIQ email link and asking the app to check again.
    @MainActor
    private func verifyCode() async {
        guard !verifyBusy else { return }
        verifyBusy = true
        verifyError = nil
        toast = .progress("Checking verification", "Confirming whether your ShotIQ email link was opened.", progress: 0.5)
        struct StatusResp: Codable { var success: Bool?; var verified: Bool?; var email: String? }
        do {
            let r: StatusResp = try await APIClient.shared.call("/api/auth/resend-verification", method: "GET")
            if r.verified == true {
                toast = .success("Email verified", "Continuing to player setup.")
                app.signedIn(APIUser(email: r.email ?? email, profileComplete: false))
            } else {
                verifyError = "Open the newest ShotIQ verification link from your email, then tap Check status."
                toast = .error("Email not verified", "Open the latest ShotIQ email link, then check again.")
            }
        } catch {
            verifyError = "Could not check verification. Check your connection and try again."
            toast = .error("Verification check failed", "Check your connection and try again.")
        }
        verifyBusy = false
    }

    @MainActor
    private func helpAction(_ text: String) {
        if text.contains("spam") {
            toast = .info("Opening email", "Check spam or promotions for ShotIQ.")
            openMailApp()
        }
        else if text.contains("Resend") { Task { await resend() } }
        else {
            toast = .info("Opening help", "Loading ShotIQ support.")
            UIApplication.shared.open(supportGuideURL)
        }
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-verify-email") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(spacing: 0) {
                        HStack {
                            Button {
                                toast = .info("Returning to account setup")
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { dismiss() }
                            } label: {
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
                        (Text("Open the verification link we sent to\n")
                            + Text(email).fontWeight(.semibold).foregroundColor(ShotIQColor.ink)
                            + Text("."))
                            .shotiqBody(17)
                            .foregroundStyle(ShotIQColor.graphite)
                            .multilineTextAlignment(.center)
                            .padding(.top, 12)

                        ShotIQCard {
                            HStack(alignment: .center, spacing: 14) {
                                ZStack {
                                    Circle().fill(ShotIQColor.warmCanvas)
                                    ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-upload",
                                                             size: 32,
                                                             label: nil)
                                }
                                .frame(width: 58, height: 58)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text("EMAIL LINK REQUIRED")
                                        .shotiqBody(11, weight: .bold).kerning(0.6)
                                        .foregroundStyle(ShotIQColor.graphite)
                                    Text("Open the newest ShotIQ email link, then tap Check verification status.")
                                        .shotiqBody(15)
                                        .foregroundStyle(ShotIQColor.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 0)
                            }
                        }
                        .padding(.top, 30)

                        (Text("Resend link in ").foregroundColor(ShotIQColor.graphite)
                            + Text("2:00").foregroundColor(ShotIQColor.shotiqOrange).fontWeight(.semibold))
                            .font(.system(size: 17))
                            .padding(.top, 26)

                        Button(resendBusy ? "Sending…" : "Resend verification link") { Task { await resend() } }
                            .font(.system(size: 17))
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                            .underline()
                            .disabled(resendBusy)
                            .padding(.top, 18)

                        if let resendNote {
                            Text(resendNote)
                                .shotiqBody(14)
                                .foregroundStyle(resendOK ? ShotIQColor.confirmGreen : ShotIQColor.reviewRed)
                                .multilineTextAlignment(.center)
                                .padding(.top, 10)
                        }
                        if let verifyError {
                            Text(verifyError)
                                .shotiqBody(14)
                                .foregroundStyle(ShotIQColor.reviewRed)
                                .multilineTextAlignment(.center)
                                .padding(.top, 10)
                        }

                        PrimaryButton(title: verifyBusy ? "Checking…" : "Check verification status", icon: "checkmark.shield") {
                            Task { await verifyCode() }
                        }
                        .disabled(verifyBusy)
                        .padding(.top, 26)

                        SecondaryButton(title: "Open email app", icon: "envelope") {
                            toast = .info("Opening email", "Open the newest ShotIQ verification link.")
                            openMailApp()
                        }
                        .padding(.top, 12)

                        SecondaryButton(title: "Use a different email", icon: "envelope.badge") {
                            toast = .info("Use a different email")
                            dismiss()
                        }
                        .padding(.top, 12)

                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 28)

                        HStack {
                            Text("DIDN'T GET THE EMAIL?")
                                .shotiqBody(14, weight: .bold).kerning(0.5)
                                .foregroundStyle(ShotIQColor.ink)
                            Spacer()
                        }
                        .padding(.top, 20)

                        VStack(spacing: 0) {
                            ForEach(helpRows, id: \.1) { icon, text in
                                Button { helpAction(text) } label: {
                                    HStack(spacing: 14) {
                                        ShotIQConceptGlyph(concept: text, fallback: icon, size: 32)
                                            .frame(width: 36)
                                        Text(text).shotiqBody(16).foregroundStyle(ShotIQColor.ink)
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 13))
                                            .foregroundStyle(ShotIQColor.muted)
                                    }
                                    .padding(.vertical, 16)
                                    .contentShape(Rectangle())
                                    .overlay(Rectangle().fill(ShotIQColor.rule).frame(height: 1), alignment: .bottom)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.top, 4)

                        HStack(spacing: 16) {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-privacy-info",
                                                     size: 42,
                                                     label: nil)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Your account is safe").shotiqBody(17, weight: .semibold)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("We'll never share your email or data.")
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                            }
                            Spacer()
                        }
                        .padding(.top, 24).padding(.bottom, 40)
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
        .shotiqToast($toast)
    }
}

struct ForgotPasswordView: View {  // 006 · ios.forgot-password
    @State private var email = ""
    @State private var sent = false
    @State private var busy = false
    @State private var errorText: String?
    @State private var toast: ShotIQToast?
    @Environment(\.dismiss) private var dismiss

    private var emailValid: Bool { email.contains("@") && email.contains(".") }

    /// POST /api/auth/forgot-password — issues the reset token and emails the link.
    @MainActor
    private func sendReset() async {
        guard emailValid else {
            errorText = "Enter a valid account email first."
            toast = .error("Check email", "Use the email address on your ShotIQ account.")
            return
        }
        busy = true; errorText = nil
        toast = .progress("Sending reset link", "Checking your ShotIQ account email.", progress: 0.55)
        struct Resp: Codable { var success: Bool?; var message: String? }
        do {
            let _: Resp = try await APIClient.shared.call(
                "/api/auth/forgot-password", method: "POST", body: ["email": email])
            sent = true
            toast = .success("Reset link sent", "Check your email for the secure reset link.")
        } catch {
            errorText = "Could not send the reset link. Check your connection and try again."
            toast = .error("Reset link not sent", "Check your connection and try again.")
        }
        busy = false
    }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-forgot-password") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Button {
                            toast = .info("Returning to sign in")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { dismiss() }
                        } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "arrow.left")
                                    .font(.system(size: 20, weight: .semibold))
                                Text("BACK TO SIGN IN")
                                    .shotiqBody(13, weight: .bold).kerning(1)
                            }
                            .foregroundStyle(ShotIQColor.graphite)
                        }
                        .padding(.top, 18)

                        Text("RESET PASSWORD").shotiqDisplay(52).padding(.top, 20)
                        Text("Enter your account email and we will send a secure reset link.")
                            .shotiqBody(17).foregroundStyle(ShotIQColor.graphite).padding(.top, 8)

                        SectionLabel(text: "EMAIL ADDRESS").padding(.top, 26)
                        FieldShell(valid: emailValid) {
                            ShotIQApprovedRasterIcon(assetName: ShotIQApprovedIconAsset.assetName(forSystemFallback: "envelope"),
                                                     size: 22,
                                                     label: nil)
                            TextField("Enter your email", text: $email)
                                .keyboardType(.emailAddress).autocapitalization(.none)
                            if emailValid {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 20))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                            }
                        }
                        .padding(.top, 8)

                        Button { Task { await sendReset() } } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "envelope.open.fill")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundStyle(.white)
                                Text(busy ? "SENDING…" : "SEND RESET LINK")
                                    .shotiqCondensed(18, weight: .heavy)
                                    .kerning(1.5)
                            }
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: ShotIQRadius.control))
                            .foregroundStyle(.white)
                        }
                        .disabled(busy)
                        .padding(.top, 24)

                        if let errorText {
                            Text(errorText)
                                .shotiqBody(14).foregroundStyle(ShotIQColor.reviewRed)
                                .padding(.top, 10)
                        }

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
                                            .shotiqCondensed(19, weight: .heavy)
                                            .foregroundStyle(ShotIQColor.ink)
                                        Text("Check your inbox for secure reset instructions.")
                                            .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                    }
                                    Spacer()
                                }
                                .padding(18)
                            }
                            .padding(.top, 24)
                        }

                        // Canonical 007 is the second half of this flow: once the
                        // link is out (or if the player already has one) they set
                        // the new password here.
                        NavigationLink { ResetPasswordView() } label: {
                            HStack(spacing: 8) {
                                ShotIQApprovedRasterIcon(assetName: "shotiq-approved-v2-ui-check-ring",
                                                         size: 18,
                                                         label: nil)
                                Text(sent ? "Enter your new password" : "I already have a reset link")
                                    .shotiqBody(15, weight: .medium)
                            }
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            toast = .info("Opening password reset", "Enter and confirm your new password.")
                        })
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("Enter your new password")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 20)

                        OrDivider().padding(.top, 34)

                        Button {
                            toast = .info("Returning to sign in")
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { dismiss() }
                        } label: {
                            HStack(spacing: 8) {
                                Text("BACK TO SIGN IN")
                                    .shotiqBody(15, weight: .bold).kerning(1.5)
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 13, weight: .bold))
                            }
                            .foregroundStyle(ShotIQColor.shotiqOrange)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 26)

                        Button {
                            toast = .info("Opening help", "Loading ShotIQ support.")
                            UIApplication.shared.open(supportGuideURL)
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "questionmark.circle").font(.system(size: 17))
                                Text("Need help?").shotiqBody(16).underline()
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
        .shotiqToast($toast)
    }
}

struct ResetPasswordView: View {   // 007 · ios.reset-password
    /// Single-use token from the emailed reset link (deep link). Without it the
    /// backend cannot reset — the UI directs the user to request a fresh link.
    var token: String? = nil
    @State private var p1 = ""; @State private var p2 = ""
    @State private var show1 = false; @State private var show2 = false
    @State private var busy = false
    @State private var done = false
    @State private var successText: String?
    @State private var errorText: String?
    @State private var showForgot = false
    @State private var toast: ShotIQToast?
    @Environment(\.dismiss) private var dismiss

    /// POST /api/auth/reset-password — consumes the emailed token and sets the
    /// new password. Success does not auto-login; the user signs in afterwards.
    @MainActor
    private func resetPassword() async {
        guard let token, !token.isEmpty else {
            errorText = "This screen needs the reset link from your email. Request a new link below."
            toast = .error("Reset link needed", "Open the secure link from your email or request a new one.")
            return
        }
        guard passwordReady else {
            errorText = "Finish every password requirement before resetting."
            toast = .error("Password not ready", "Meet every requirement and confirm the password.")
            return
        }
        busy = true; errorText = nil
        toast = .progress("Resetting password", "Saving your new ShotIQ password.", progress: 0.55)
        struct Resp: Codable { var success: Bool?; var message: String? }
        do {
            let r: Resp = try await APIClient.shared.call(
                "/api/auth/reset-password", method: "POST",
                body: ["token": token, "password": p1])
            done = true
            successText = r.message ?? "Your password has been reset. You can now sign in."
            toast = .success("Password reset", "You can now sign in with your new password.")
        } catch APIClient.APIError.http(400) {
            errorText = "This reset link is invalid or has expired. Request a new one below."
            toast = .error("Reset link expired", "Request a new secure reset link.")
        } catch {
            errorText = "Something went wrong. Please try again."
            toast = .error("Password not reset", "Something went wrong. Please try again.")
        }
        busy = false
    }

    /// Test-only: canonical 007 shows both fields still on their placeholders
    /// *and* every requirement already green with a STRONG meter — a state no
    /// typed password can reproduce, because a SecureField draws dots the moment
    /// it has any text. Under `-uiTestStage reset-password` the checklist and the
    /// meter render that satisfied state directly. `UITestHooks.stage` is nil in
    /// a shipped launch, so a real player always sees their own progress.
    private var stagedCanonicalState: Bool { UITestHooks.stage == "reset-password" }
    private var hasResetToken: Bool { !(token ?? "").isEmpty }

    private var checks: [(String, Bool)] {
        [("At least 8 characters long", stagedCanonicalState || p1.count >= 8),
         ("Includes an uppercase letter", stagedCanonicalState || p1.contains(where: \.isUppercase)),
         ("Includes a lowercase letter", stagedCanonicalState || p1.contains(where: \.isLowercase)),
         ("Includes a number", stagedCanonicalState || p1.contains(where: \.isNumber)),
         ("Includes a special character",
          stagedCanonicalState || p1.contains(where: { !$0.isLetter && !$0.isNumber })),
         ("Passwords match", stagedCanonicalState || (!p1.isEmpty && p1 == p2))]
    }
    private var strength: Int { checks.prefix(5).filter(\.1).count }
    private var strengthLabel: String { strength >= 5 ? "STRONG" : strength >= 3 ? "GOOD" : "WEAK" }
    private var passwordReady: Bool { checks.allSatisfy(\.1) }

    var body: some View {
        CanonicalScreen(testID: "screen-ios-reset-password") {
            VStack(spacing: 0) {
                TopBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .top, spacing: 16) {
                            VStack(alignment: .leading, spacing: 0) {
                                Button {
                                    toast = .info("Returning to sign in")
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { dismiss() }
                                } label: {
                                    HStack(spacing: 10) {
                                        Image(systemName: "arrow.left")
                                            .font(.system(size: 20, weight: .semibold))
                                        Text("BACK TO SIGN IN")
                                            .shotiqBody(13, weight: .bold).kerning(1)
                                    }
                                    .foregroundStyle(ShotIQColor.graphite)
                                }
                                Text("RESET PASSWORD").shotiqDisplay(52).padding(.top, 18)
                                Text("Enter a new password for your ShotIQ account. Make it strong and easy for you to remember.")
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                    .padding(.top, 8)
                            }
                            CanonicalPhoto("generated-splash-001", width: 150, height: 180, cornerRadius: 10)
                            .frame(width: 150, height: 180)
                        }
                        .padding(.top, 18)

                        HStack(spacing: 16) {
                            ShotIQApprovedRasterIcon(assetName: hasResetToken ? "shotiq-approved-v2-ui-check-ring" : "shotiq-approved-v2-ui-privacy-info",
                                                     size: 34,
                                                     label: nil)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(hasResetToken ? "RESET LINK VERIFIED" : "RESET LINK REQUIRED")
                                    .shotiqBody(15, weight: .bold).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text(hasResetToken
                                     ? "This reset link is valid.\nYou can set a new password."
                                     : "Open the newest ShotIQ reset email before setting a new password.")
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
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
                            Text(p1.isEmpty && !stagedCanonicalState ? "" : strengthLabel)
                                .shotiqBody(13, weight: .bold).kerning(0.5)
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
                                .shotiqBody(14, weight: .bold).kerning(0.5)
                                .foregroundStyle(ShotIQColor.ink)
                            ForEach(checks, id: \.0) { label, met in
                                HStack(spacing: 10) {
                                    Image(systemName: met ? "checkmark.circle.fill" : "circle")
                                        .font(.system(size: 17))
                                        .foregroundStyle(met ? ShotIQColor.confirmGreen : ShotIQColor.muted)
                                    Text(label).shotiqBody(15).foregroundStyle(ShotIQColor.ink)
                                }
                            }
                        }
                        .padding(18)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(ShotIQColor.warmCanvas, in: RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 24)

                        if let successText {
                            HStack(spacing: 10) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 18))
                                    .foregroundStyle(ShotIQColor.confirmGreen)
                                Text(successText)
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.confirmGreen)
                                Spacer()
                            }
                            .padding(.top, 20)
                        }
                        if let errorText {
                            Text(errorText)
                                .shotiqBody(14).foregroundStyle(ShotIQColor.reviewRed)
                                .padding(.top, 20)
                        }

                        PrimaryButton(title: !hasResetToken ? "Open reset email" : (busy ? "Resetting…" : done ? "Password reset" : "Reset password"),
                                      icon: hasResetToken ? "key.fill" : "envelope.open.fill") {
                            if hasResetToken {
                                Task { await resetPassword() }
                            } else {
                                toast = .info("Opening email", "Open the newest ShotIQ reset link.")
                                openMailApp()
                            }
                        }
                        // Canonical 007 draws this CTA live, not dimmed.
                        .disabled(busy || done)
                        .padding(.top, 24)

                        Rectangle().fill(ShotIQColor.rule).frame(height: 1).padding(.top, 28)

                        HStack(alignment: .top, spacing: 16) {
                            ShotIQApprovedRasterIcon(assetName: "shotiq-approved-mechanics-routine-refresh",
                                                     size: 34,
                                                     label: nil)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("RESET LINK EXPIRED?")
                                    .shotiqBody(15, weight: .bold).kerning(0.5)
                                    .foregroundStyle(ShotIQColor.ink)
                                Text("For your security, reset links expire after 15 minutes.")
                                    .shotiqBody(14).foregroundStyle(ShotIQColor.graphite)
                                Button("Request a new reset link") {
                                    toast = .info("Opening password reset", "Request a fresh secure reset link.")
                                    showForgot = true
                                }
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
        .sheet(isPresented: $showForgot) {
            NavigationStack { ForgotPasswordView() }
                .modifier(CanonicalTypeScale())
        }
        .shotiqToast($toast)
    }
}
