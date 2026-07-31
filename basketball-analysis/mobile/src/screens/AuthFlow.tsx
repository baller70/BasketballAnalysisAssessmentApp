// Canonical auth flow — screens 001-007.
import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import {
  Screen, Display, Body, SectionLabel, Wordmark, PrimaryButton, SecondaryButton,
  Field, PhaseStrip, Numeric, S,
} from '../components'
import { color, font } from '../tokens'
import { api } from '../api'
import { useApp } from '../appState'

export function SplashScreen() {            // 001 · ios.splash
  const { boot } = useApp()
  useEffect(() => { const t = setTimeout(boot, 1200); return () => clearTimeout(t) }, [boot])
  return (
    <Screen testID="screen-ios-splash" scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Wordmark size={64} />
        <Text style={{ fontFamily: font.bodyBold, fontSize: 13, letterSpacing: 2, color: color.graphite, marginTop: 8 }}>
          AI SHOOTING ANALYSIS
        </Text>
        <ActivityIndicator style={{ marginTop: 40 }} color={color.shotiqOrange} />
      </View>
    </Screen>
  )
}

export function WelcomeScreen() {           // 002 · ios.welcome
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-welcome" scroll={false}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', marginTop: 90 }}>
          <Wordmark size={52} />
          <Display size={34} style={{ textAlign: 'center', marginTop: 26 }}>
            AI ANALYSIS. BETTER MECHANICS.{'\n'}BETTER RESULTS.
          </Display>
          <Body size={16} colorV={color.graphite} style={{ textAlign: 'center', marginTop: 12 }}>
            Capture your shot. Get AI analysis.{'\n'}Follow a plan. Track progress.
          </Body>
        </View>
        <View style={{ marginTop: 40 }}><PhaseStrip /></View>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Get started" testID="cta-get-started" onPress={() => nav.navigate('CreateAccount')} />
        <View style={{ height: 14 }} />
        <SecondaryButton title="I already have an account" onPress={() => nav.navigate('SignIn')} />
        <View style={{ height: 40 }} />
      </View>
    </Screen>
  )
}

export function SignInScreen() {            // 003 · ios.sign-in
  const nav = useNavigation<any>()
  const { signedIn } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!email || !password) { setError('Email and password are required'); return }
    setBusy(true); setError('')
    try {
      const user = await api.signIn(email, password)
      signedIn(user)
    } catch {
      setError('Sign in failed — check your credentials.')
    }
    setBusy(false)
  }

  return (
    <Screen testID="screen-ios-sign-in">
      <View style={S.pad}>
        <View style={{ marginTop: 24 }}><Wordmark size={30} /></View>
        <Display size={46} style={{ marginTop: 34 }}>WELCOME BACK</Display>
        <Body size={16} colorV={color.graphite} style={{ marginTop: 6 }}>Sign in to continue your training.</Body>
        <Field label="EMAIL" placeholder="Enter your email" autoCapitalize="none" keyboardType="email-address"
               value={email} onChangeText={setEmail} testID="signin-email" />
        <Field label="PASSWORD" placeholder="Enter your password" secureTextEntry
               value={password} onChangeText={setPassword} testID="signin-password" />
        <Pressable onPress={() => nav.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginTop: 14, minHeight: 44, justifyContent: 'center' }}>
          <Body size={14} colorV={color.analysisBlue}>Forgot password?</Body>
        </Pressable>
        {error ? <Body size={14} colorV={color.reviewRed} style={{ marginTop: 6 }} testID="signin-error">{error}</Body> : null}
        <View style={{ marginTop: 16 }}>
          <PrimaryButton title={busy ? 'Signing in…' : 'Sign in'} onPress={submit} disabled={busy} testID="signin-submit" />
        </View>
        <View style={[S.row, { marginTop: 26, gap: 14 }]}>
          <View style={{ flex: 1, height: 1, backgroundColor: color.rule }} />
          <Text style={{ fontFamily: font.bodyMedium, fontSize: 11, letterSpacing: 1, color: color.graphite }}>OR CONTINUE WITH</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: color.rule }} />
        </View>
        <View style={{ marginTop: 18 }}><SecondaryButton title="Continue with Apple" /></View>
        <View style={{ marginTop: 12 }}><SecondaryButton title="Continue with Google" /></View>
        <View style={[S.row, { justifyContent: 'center', marginTop: 24 }]}>
          <Body size={14} colorV={color.graphite}>Don&apos;t have an account? </Body>
          <Pressable onPress={() => nav.navigate('CreateAccount')} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Body size={14} colorV={color.analysisBlue}>Create account</Body>
          </Pressable>
        </View>
      </View>
    </Screen>
  )
}

export function CreateAccountScreen() {     // 004 · ios.create-account
  const nav = useNavigation<any>()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <Screen testID="screen-ios-create-account">
      <View style={S.pad}>
        <Display size={46} style={{ marginTop: 40 }}>CREATE ACCOUNT</Display>
        <Body size={16} colorV={color.graphite} style={{ marginTop: 6 }}>Start your shooting journey.</Body>
        <Field label="FULL NAME" placeholder="Enter your name" value={name} onChangeText={setName} />
        <Field label="EMAIL" placeholder="Enter your email" autoCapitalize="none" keyboardType="email-address"
               value={email} onChangeText={setEmail} />
        <Field label="PASSWORD" placeholder="Create a password" secureTextEntry value={password} onChangeText={setPassword} />
        <View style={{ marginTop: 24 }}>
          <PrimaryButton title="Create account" disabled={!email || !password}
                         onPress={() => nav.navigate('VerifyEmail', { email })} />
        </View>
      </View>
    </Screen>
  )
}

export function VerifyEmailScreen({ route }: any) { // 005 · ios.verify-email
  const { signedIn } = useApp()
  const [code, setCode] = useState('')
  const email = route?.params?.email ?? 'you@example.com'
  return (
    <Screen testID="screen-ios-verify-email">
      <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
        <Display size={40} style={{ marginTop: 110 }}>VERIFY YOUR EMAIL</Display>
        <Body size={15} colorV={color.graphite} style={{ textAlign: 'center', marginTop: 10 }}>
          We sent a 6-digit code to{'\n'}{email}
        </Body>
        <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="000000"
          placeholderTextColor={color.muted}
          style={{ marginTop: 30, width: 220, height: 62, borderWidth: 1, borderColor: color.rule, borderRadius: 6,
                   textAlign: 'center', fontFamily: font.numeric, fontSize: 32, color: color.ink }} />
        <View style={{ alignSelf: 'stretch', marginTop: 26 }}>
          <PrimaryButton title="Verify" onPress={() => signedIn({ email, profileComplete: false })} />
        </View>
        <Pressable style={{ marginTop: 18, minHeight: 44, justifyContent: 'center' }}>
          <Body size={14} colorV={color.analysisBlue}>Resend code</Body>
        </Pressable>
      </View>
    </Screen>
  )
}

export function ForgotPasswordScreen() {    // 006 · ios.forgot-password
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <Screen testID="screen-ios-forgot-password">
      <View style={S.pad}>
        <Display size={42} style={{ marginTop: 60 }}>FORGOT PASSWORD</Display>
        <Body size={15} colorV={color.graphite} style={{ marginTop: 8 }}>
          Enter your email and we&apos;ll send a reset link.
        </Body>
        <Field label="EMAIL" placeholder="Enter your email" autoCapitalize="none" keyboardType="email-address"
               value={email} onChangeText={setEmail} />
        <View style={{ marginTop: 22 }}>
          <PrimaryButton title={sent ? 'Link sent ✓' : 'Send reset link'} onPress={() => setSent(true)} />
        </View>
      </View>
    </Screen>
  )
}

export function ResetPasswordScreen() {     // 007 · ios.reset-password
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  return (
    <Screen testID="screen-ios-reset-password">
      <View style={S.pad}>
        <Display size={42} style={{ marginTop: 60 }}>RESET PASSWORD</Display>
        <Body size={15} colorV={color.graphite} style={{ marginTop: 8 }}>Choose a new password for your account.</Body>
        <Field label="NEW PASSWORD" placeholder="New password" secureTextEntry value={p1} onChangeText={setP1} />
        <Field label="CONFIRM PASSWORD" placeholder="Repeat password" secureTextEntry value={p2} onChangeText={setP2} />
        <View style={{ marginTop: 22 }}>
          <PrimaryButton title="Update password" disabled={!p1 || p1 !== p2} />
        </View>
      </View>
    </Screen>
  )
}
