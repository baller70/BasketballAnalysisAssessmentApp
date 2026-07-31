// Canonical onboarding flow — screens 008-016.
import React, { createContext, useContext, useState } from 'react'
import { View, TextInput, Pressable, Switch } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import {
  Screen, Display, Body, SectionLabel, PrimaryButton, Card, Chips, Numeric, S,
} from '../components'
import { color, font } from '../tokens'
import { useApp } from '../appState'

interface OnbData {
  heightIn: number; weightLb: number; wingspanIn: number
  experience: string; bodyType: string; hand: string; position: string; shotStyle: string
  name: string; bio: string
  set: (patch: Partial<Omit<OnbData, 'set'>>) => void
}
const OnbCtx = createContext<OnbData | null>(null)
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [d, setD] = useState({
    heightIn: 74, weightLb: 185, wingspanIn: 78, experience: 'Advanced', bodyType: 'Athletic',
    hand: 'Right', position: 'Guard', shotStyle: 'Catch & Shoot', name: '', bio: '',
  })
  return <OnbCtx.Provider value={{ ...d, set: (p) => setD((x) => ({ ...x, ...p })) }}>{children}</OnbCtx.Provider>
}
const useOnb = () => {
  const v = useContext(OnbCtx); if (!v) throw new Error('onboarding ctx'); return v
}

function Step({ testID, step, title, subtitle, nextRoute, onFinish, children }: {
  testID: string; step: number; title: string; subtitle: string
  nextRoute?: string; onFinish?: () => void; children: React.ReactNode
}) {
  const nav = useNavigation<any>()
  return (
    <Screen testID={testID}>
      <View style={S.pad}>
        <View style={[S.row, { gap: 6, marginTop: 20 }]}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 99,
              backgroundColor: i < step ? color.shotiqOrange : color.rule }} />
          ))}
        </View>
        <Display size={40} style={{ marginTop: 26 }}>{title}</Display>
        <Body size={15} colorV={color.graphite} style={{ marginTop: 6 }}>{subtitle}</Body>
        <View style={{ marginTop: 22 }}>{children}</View>
        <View style={{ marginTop: 30 }}>
          <PrimaryButton title={onFinish ? 'Finish setup' : 'Continue'}
            onPress={onFinish ?? (() => nav.navigate(nextRoute!))} />
        </View>
      </View>
    </Screen>
  )
}

function StepperRow({ label, unit, value, onChange }: {
  label: string; unit: string; value: number; onChange: (v: number) => void
}) {
  return (
    <View style={[S.row, { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.rule }]}>
      <SectionLabel>{label}</SectionLabel>
      <View style={{ flex: 1 }} />
      <Pressable accessibilityLabel={`decrease ${label}`} onPress={() => onChange(value - 1)}
                 style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Body size={26}>−</Body>
      </Pressable>
      <Numeric size={28} style={{ width: 96, textAlign: 'center' }}>{`${value} ${unit}`}</Numeric>
      <Pressable accessibilityLabel={`increase ${label}`} onPress={() => onChange(value + 1)}
                 style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Body size={26}>+</Body>
      </Pressable>
    </View>
  )
}

export function OnboardingIntroScreen() {   // 008
  return (
    <Step testID="screen-ios-onboarding-intro" step={1} title="LET'S BUILD YOUR PROFILE"
          subtitle="A few questions so the AI can calibrate analysis to you." nextRoute="PhysicalProfile">
      {[['Physical profile', 'Height, weight and wingspan'],
        ['Experience', 'Skill level and body type'],
        ['Shooting profile', 'Hand, position and shot style']].map(([t, d]) => (
        <Card key={t} style={{ padding: 16, marginBottom: 12 }}>
          <Body size={16} weight="semibold">{t}</Body>
          <Body size={13} colorV={color.graphite} style={{ marginTop: 3 }}>{d}</Body>
        </Card>
      ))}
    </Step>
  )
}

export function PhysicalProfileScreen() {   // 009
  const d = useOnb()
  return (
    <Step testID="screen-ios-physical-profile" step={2} title="PHYSICAL PROFILE"
          subtitle="Used to normalize biomechanics measurements." nextRoute="ExperienceBodyType">
      <StepperRow label="HEIGHT" unit="in" value={d.heightIn} onChange={(v) => d.set({ heightIn: v })} />
      <StepperRow label="WEIGHT" unit="lb" value={d.weightLb} onChange={(v) => d.set({ weightLb: v })} />
      <StepperRow label="WINGSPAN" unit="in" value={d.wingspanIn} onChange={(v) => d.set({ wingspanIn: v })} />
    </Step>
  )
}

export function ExperienceBodyTypeScreen() { // 010
  const d = useOnb()
  return (
    <Step testID="screen-ios-experience-body-type" step={3} title="EXPERIENCE & BODY TYPE"
          subtitle="Calibrates elite-range comparisons." nextRoute="ShootingProfile">
      <SectionLabel>EXPERIENCE LEVEL</SectionLabel>
      <Chips options={['Beginner', 'Intermediate', 'Advanced', 'Professional']}
             value={d.experience} onChange={(v) => d.set({ experience: v })} />
      <SectionLabel style={{ marginTop: 20 }}>BODY TYPE</SectionLabel>
      <Chips options={['Slim', 'Athletic', 'Solid', 'Big']}
             value={d.bodyType} onChange={(v) => d.set({ bodyType: v })} />
    </Step>
  )
}

export function ShootingProfileScreen() {   // 011
  const d = useOnb()
  return (
    <Step testID="screen-ios-shooting-profile" step={4} title="SHOOTING PROFILE"
          subtitle="Hand, position and preferred shot." nextRoute="PlayerBio">
      <SectionLabel>SHOOTING HAND</SectionLabel>
      <Chips options={['Right', 'Left']} value={d.hand} onChange={(v) => d.set({ hand: v })} />
      <SectionLabel style={{ marginTop: 20 }}>POSITION</SectionLabel>
      <Chips options={['Guard', 'Wing', 'Forward', 'Center']} value={d.position} onChange={(v) => d.set({ position: v })} />
      <SectionLabel style={{ marginTop: 20 }}>SHOT STYLE</SectionLabel>
      <Chips options={['Catch & Shoot', 'Off the Dribble', 'Pull-Up', 'Spot-Up']}
             value={d.shotStyle} onChange={(v) => d.set({ shotStyle: v })} />
    </Step>
  )
}

export function PlayerBioScreen() {         // 012
  const d = useOnb()
  return (
    <Step testID="screen-ios-player-bio" step={5} title="PLAYER BIO"
          subtitle="Tell us who you are (optional)." nextRoute="OnboardingReview">
      <SectionLabel>DISPLAY NAME</SectionLabel>
      <TextInput value={d.name} onChangeText={(v) => d.set({ name: v })} placeholder="Your name"
        placeholderTextColor={color.muted}
        style={{ marginTop: 8, height: 50, borderWidth: 1, borderColor: color.rule, borderRadius: 6,
                 paddingHorizontal: 14, fontFamily: font.body, fontSize: 15, color: color.ink }} />
      <SectionLabel style={{ marginTop: 20 }}>BIO</SectionLabel>
      <TextInput value={d.bio} onChangeText={(v) => d.set({ bio: v })} multiline placeholder="A few lines about your game"
        placeholderTextColor={color.muted}
        style={{ marginTop: 8, height: 120, borderWidth: 1, borderColor: color.rule, borderRadius: 6,
                 padding: 14, fontFamily: font.body, fontSize: 15, color: color.ink, textAlignVertical: 'top' }} />
    </Step>
  )
}

export function OnboardingReviewScreen() {  // 013
  const d = useOnb()
  const rows: [string, string][] = [
    ['Height', `${d.heightIn} in`], ['Weight', `${d.weightLb} lb`], ['Wingspan', `${d.wingspanIn} in`],
    ['Experience', d.experience], ['Body type', d.bodyType], ['Hand', d.hand],
    ['Position', d.position], ['Shot style', d.shotStyle],
  ]
  return (
    <Step testID="screen-ios-onboarding-review" step={6} title="REVIEW YOUR PROFILE"
          subtitle="Confirm before we calibrate the AI." nextRoute="CameraPermissionPrimer">
      <Card>
        {rows.map(([k, v]) => (
          <View key={k} style={[S.row, { paddingHorizontal: 16, paddingVertical: 11,
            borderBottomWidth: 1, borderBottomColor: color.rule }]}>
            <Body size={14} colorV={color.graphite}>{k}</Body>
            <View style={{ flex: 1 }} />
            <Body size={15} weight="semibold">{v}</Body>
          </View>
        ))}
      </Card>
    </Step>
  )
}

function Primer({ testID, title, body, nextRoute, onFinish }: {
  testID: string; title: string; body: string; nextRoute?: string; onFinish?: () => void
}) {
  const nav = useNavigation<any>()
  const go = onFinish ?? (() => nav.navigate(nextRoute!))
  return (
    <Screen testID={testID} scroll={false}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', marginTop: 130 }}>
          <Display size={38} style={{ textAlign: 'center' }}>{title}</Display>
          <Body size={15} colorV={color.graphite} style={{ textAlign: 'center', marginTop: 12, paddingHorizontal: 12 }}>
            {body}
          </Body>
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Allow access" onPress={go} />
        <Pressable onPress={go} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <Body size={15} colorV={color.graphite}>Not now</Body>
        </Pressable>
        <View style={{ height: 30 }} />
      </View>
    </Screen>
  )
}

export function CameraPermissionPrimerScreen() { // 014
  return <Primer testID="screen-ios-camera-permission-primer" title="CAMERA ACCESS"
    body="ShotIQ uses the camera to capture live shooting sessions and give real-time form feedback."
    nextRoute="PhotoLibraryPermission" />
}
export function PhotoLibraryPermissionScreen() { // 015
  return <Primer testID="screen-ios-photo-library-permission" title="PHOTO LIBRARY"
    body="Import existing shot photos and videos from your library for AI analysis."
    nextRoute="NotificationPermissionPrimer" />
}
export function NotificationPermissionPrimerScreen() { // 016
  const { finishOnboarding } = useApp()
  return <Primer testID="screen-ios-notification-permission-primer" title="STAY ON TRACK"
    body="Workout reminders, analysis results and streak alerts — never spam."
    onFinish={finishOnboarding} />
}
