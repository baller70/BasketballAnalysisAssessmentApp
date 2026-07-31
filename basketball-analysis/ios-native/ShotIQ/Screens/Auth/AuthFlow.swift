import SwiftUI

// Canonical auth flow — screens 001-007.

struct SplashView: View {          // 001 · ios.splash
    @EnvironmentObject var app: AppState
    var body: some View {
        CanonicalScreen(testID: "screen-ios-splash") {
            VStack {
                Spacer()
                Wordmark(size: 64)
                Text("AI SHOOTING ANALYSIS")
                    .font(.system(size: 13, weight: .bold)).kerning(2)
                    .foregroundStyle(ShotIQColor.graphite).padding(.top, 8)
                Spacer()
                ProgressView().padding(.bottom, 60)
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
    var body: some View {
        CanonicalScreen(testID: "screen-ios-welcome") {
            VStack(spacing: 0) {
                Spacer().frame(height: 90)
                Wordmark(size: 52)
                Text("AI ANALYSIS. BETTER MECHANICS.\nBETTER RESULTS.")
                    .shotiqDisplay(34).multilineTextAlignment(.center).padding(.top, 26)
                Text("Capture your shot. Get AI analysis.\nFollow a plan. Track progress.")
                    .shotiqBody(16).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center).padding(.top, 12)
                PhaseStrip().padding(.horizontal, 24).padding(.top, 40)
                Spacer()
                VStack(spacing: 14) {
                    NavigationLink { CreateAccountView() } label: {
                        Text("Get started").frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                    }
                    NavigationLink { SignInView() } label: {
                        Text("I already have an account").frame(maxWidth: .infinity).frame(height: 54)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                            .foregroundStyle(ShotIQColor.ink).font(.system(size: 17))
                    }
                }
                .padding(.horizontal, 24).padding(.bottom, 40)
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

    var body: some View {
        CanonicalScreen(testID: "screen-ios-sign-in") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Wordmark(size: 30).padding(.top, 24)
                    Text("WELCOME BACK").shotiqDisplay(46).padding(.top, 34)
                    Text("Sign in to continue your training.")
                        .shotiqBody(16).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)

                    SectionLabel(text: "EMAIL").padding(.top, 30)
                    TextField("Enter your email", text: $vm.email)
                        .textContentType(.emailAddress).keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding(.horizontal, 14).frame(height: 50)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                        .padding(.top, 8)
                        .accessibilityIdentifier("signin-email")

                    SectionLabel(text: "PASSWORD").padding(.top, 20)
                    HStack {
                        Group {
                            if showPassword { TextField("Enter your password", text: $vm.password) }
                            else { SecureField("Enter your password", text: $vm.password) }
                        }
                        .textContentType(.password)
                        Button { showPassword.toggle() } label: {
                            Image(systemName: showPassword ? "eye.slash" : "eye")
                                .foregroundStyle(ShotIQColor.graphite)
                        }
                        .accessibilityLabel(showPassword ? "Hide password" : "Show password")
                    }
                    .padding(.horizontal, 14).frame(height: 50)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                    .padding(.top, 8)
                    .accessibilityIdentifier("signin-password")

                    HStack {
                        Spacer()
                        NavigationLink { ForgotPasswordView() } label: {
                            Text("Forgot password?").font(.system(size: 14))
                                .foregroundStyle(ShotIQColor.analysisBlue)
                        }
                    }
                    .padding(.top, 14)

                    if let e = vm.error {
                        Text(e).font(.system(size: 14)).foregroundStyle(ShotIQColor.reviewRed).padding(.top, 10)
                            .accessibilityIdentifier("signin-error")
                    }

                    PrimaryButton(title: vm.busy ? "Signing in…" : "Sign in") {
                        Task { await vm.submit(app: app) }
                    }
                    .disabled(vm.busy)
                    .padding(.top, 18)
                    .accessibilityIdentifier("signin-submit")

                    HStack(spacing: 14) {
                        Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                        Text("OR CONTINUE WITH").font(.system(size: 11, weight: .medium)).kerning(1)
                            .foregroundStyle(ShotIQColor.graphite).fixedSize()
                        Rectangle().fill(ShotIQColor.rule).frame(height: 1)
                    }
                    .padding(.top, 26)

                    SecondaryButton(title: "Continue with Apple", icon: "apple.logo").padding(.top, 18)
                    SecondaryButton(title: "Continue with Google", icon: "g.circle").padding(.top, 12)

                    HStack(spacing: 4) {
                        Text("Don't have an account?").foregroundStyle(ShotIQColor.graphite)
                        NavigationLink { CreateAccountView() } label: {
                            Text("Create account").foregroundStyle(ShotIQColor.analysisBlue)
                        }
                    }
                    .font(.system(size: 14))
                    .frame(maxWidth: .infinity).padding(.top, 24).padding(.bottom, 40)
                }
                .padding(.horizontal, 24)
            }
        }
    }
}

struct CreateAccountView: View {   // 004 · ios.create-account
    @State private var name = ""; @State private var email = ""; @State private var password = ""
    @State private var agreed = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-create-account") {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("CREATE ACCOUNT").shotiqDisplay(46).padding(.top, 40)
                    Text("Start your shooting journey.")
                        .shotiqBody(16).foregroundStyle(ShotIQColor.graphite).padding(.top, 6)
                    field("FULL NAME", text: $name, placeholder: "Enter your name")
                    field("EMAIL", text: $email, placeholder: "Enter your email")
                    field("PASSWORD", text: $password, placeholder: "Create a password", secure: true)
                    Toggle(isOn: $agreed) {
                        Text("I agree to the Terms of Use and Privacy Policy").font(.system(size: 14))
                    }
                    .toggleStyle(.switch).padding(.top, 20)
                    NavigationLink { VerifyEmailView(email: email) } label: {
                        Text("Create account").frame(maxWidth: .infinity).frame(height: 54)
                            .background(ShotIQColor.shotiqOrange, in: RoundedRectangle(cornerRadius: 6))
                            .foregroundStyle(.white).font(.system(size: 17, weight: .medium))
                    }
                    .disabled(!agreed || email.isEmpty || password.isEmpty)
                    .padding(.top, 22).padding(.bottom, 40)
                }
                .padding(.horizontal, 24)
            }
        }
    }
    @ViewBuilder private func field(_ label: String, text: Binding<String>, placeholder: String, secure: Bool = false) -> some View {
        SectionLabel(text: label).padding(.top, 22)
        Group {
            if secure { SecureField(placeholder, text: text) } else { TextField(placeholder, text: text).autocapitalization(.none) }
        }
        .padding(.horizontal, 14).frame(height: 50)
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
        .padding(.top, 8)
    }
}

struct VerifyEmailView: View {     // 005 · ios.verify-email
    var email: String = "you@example.com"
    @State private var code = ""
    @EnvironmentObject var app: AppState
    var body: some View {
        CanonicalScreen(testID: "screen-ios-verify-email") {
            VStack(spacing: 0) {
                Image(systemName: "envelope.badge").font(.system(size: 52, weight: .light)).padding(.top, 110)
                Text("VERIFY YOUR EMAIL").shotiqDisplay(40).padding(.top, 24)
                Text("We sent a 6-digit code to\n\(email)")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite)
                    .multilineTextAlignment(.center).padding(.top, 10)
                TextField("000000", text: $code)
                    .keyboardType(.numberPad).multilineTextAlignment(.center)
                    .font(.custom("DINCondensed-Bold", size: 36))
                    .frame(width: 220, height: 62)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule))
                    .padding(.top, 30)
                PrimaryButton(title: "Verify") {
                    app.signedIn(APIUser(email: email, profileComplete: false))
                }
                .padding(.horizontal, 24).padding(.top, 26)
                Button("Resend code") {}.font(.system(size: 14))
                    .foregroundStyle(ShotIQColor.analysisBlue).padding(.top, 18)
                Spacer()
            }
        }
    }
}

struct ForgotPasswordView: View {  // 006 · ios.forgot-password
    @State private var email = ""
    @State private var sent = false
    var body: some View {
        CanonicalScreen(testID: "screen-ios-forgot-password") {
            VStack(alignment: .leading, spacing: 0) {
                Text("FORGOT PASSWORD").shotiqDisplay(42).padding(.top, 60)
                Text("Enter your email and we'll send a reset link.")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite).padding(.top, 8)
                SectionLabel(text: "EMAIL").padding(.top, 28)
                TextField("Enter your email", text: $email)
                    .keyboardType(.emailAddress).autocapitalization(.none)
                    .padding(.horizontal, 14).frame(height: 50)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule)).padding(.top, 8)
                PrimaryButton(title: sent ? "Link sent ✓" : "Send reset link") { sent = true }
                    .padding(.top, 22)
                Spacer()
            }
            .padding(.horizontal, 24)
        }
    }
}

struct ResetPasswordView: View {   // 007 · ios.reset-password
    @State private var p1 = ""; @State private var p2 = ""
    var body: some View {
        CanonicalScreen(testID: "screen-ios-reset-password") {
            VStack(alignment: .leading, spacing: 0) {
                Text("RESET PASSWORD").shotiqDisplay(42).padding(.top, 60)
                Text("Choose a new password for your account.")
                    .shotiqBody(15).foregroundStyle(ShotIQColor.graphite).padding(.top, 8)
                SectionLabel(text: "NEW PASSWORD").padding(.top, 28)
                SecureField("New password", text: $p1)
                    .padding(.horizontal, 14).frame(height: 50)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule)).padding(.top, 8)
                SectionLabel(text: "CONFIRM PASSWORD").padding(.top, 20)
                SecureField("Repeat password", text: $p2)
                    .padding(.horizontal, 14).frame(height: 50)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(ShotIQColor.rule)).padding(.top, 8)
                PrimaryButton(title: "Update password").padding(.top, 22)
                    .disabled(p1.isEmpty || p1 != p2)
                Spacer()
            }
            .padding(.horizontal, 24)
        }
    }
}
