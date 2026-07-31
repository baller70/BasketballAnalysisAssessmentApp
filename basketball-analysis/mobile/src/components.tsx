// Canonical ShotIQ component kit for React Native. Charts/gauges/glyphs are
// react-native-svg paths — never raster screenshots (sidecar contract).
import React from 'react'
import {
  View, Text, Pressable, TextInput, StyleSheet, ViewStyle, TextStyle, ScrollView,
} from 'react-native'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { color, font, radius } from './tokens'

export const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  pad: { paddingHorizontal: 24 },
  row: { flexDirection: 'row', alignItems: 'center' },
})

export function Display({ children, size = 40, style }: { children: React.ReactNode; size?: number; style?: TextStyle }) {
  return <Text style={[{ fontFamily: font.display, fontSize: size, color: color.ink, letterSpacing: 0.5 }, style]}>{children}</Text>
}
export function Body({ children, size = 15, weight, colorV = color.ink, style, testID }: {
  children: React.ReactNode; size?: number; weight?: 'medium' | 'semibold' | 'bold'; colorV?: string; style?: TextStyle; testID?: string
}) {
  const f = weight === 'bold' ? font.bodyBold : weight === 'semibold' ? font.bodySemibold : weight === 'medium' ? font.bodyMedium : font.body
  return <Text testID={testID} style={[{ fontFamily: f, fontSize: size, color: colorV }, style]}>{children}</Text>
}
export function Numeric({ children, size = 26, colorV = color.ink, style }: {
  children: React.ReactNode; size?: number; colorV?: string; style?: TextStyle
}) {
  return <Text style={[{ fontFamily: font.numeric, fontSize: size, color: colorV }, style]}>{children}</Text>
}
export function SectionLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[{ fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 0.8, color: color.ink }, style]}>{children}</Text>
}
export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <View style={S.row} accessibilityLabel="ShotIQ">
      <Text style={{ fontFamily: font.display, fontSize: size, color: color.ink }}>SHOT</Text>
      <Text style={{ fontFamily: font.display, fontSize: size, color: color.shotiqOrange }}>IQ</Text>
    </View>
  )
}

export function PrimaryButton({ title, onPress, bg = color.shotiqOrange, disabled, testID }: {
  title: string; onPress?: () => void; bg?: string; disabled?: boolean; testID?: string
}) {
  return (
    <Pressable testID={testID} onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={{ height: 54, minHeight: 44, borderRadius: radius.control, backgroundColor: bg,
               alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.6 : 1 }}>
      <Text style={{ fontFamily: font.bodyMedium, fontSize: 17, color: '#fff' }}>{title}</Text>
    </Pressable>
  )
}
export function SecondaryButton({ title, onPress, testID }: { title: string; onPress?: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} accessibilityRole="button"
      style={{ height: 54, minHeight: 44, borderRadius: radius.control, borderWidth: 1, borderColor: color.rule,
               alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: font.body, fontSize: 17, color: color.ink }}>{title}</Text>
    </Pressable>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ borderRadius: radius.card, borderWidth: 1, borderColor: color.rule, backgroundColor: color.paper }, style]}>
      {children}
    </View>
  )
}

export function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginTop: 20 }}>
      <SectionLabel>{label}</SectionLabel>
      <TextInput placeholderTextColor={color.muted}
        style={{ marginTop: 8, height: 50, borderWidth: 1, borderColor: color.rule, borderRadius: radius.control,
                 paddingHorizontal: 14, fontFamily: font.body, fontSize: 15, color: color.ink }}
        {...props} />
    </View>
  )
}

export function TrendLine({ points, width = 100, height = 36, stroke = color.confirmGreen }: {
  points: number[]; width?: number; height?: number; stroke?: string
}) {
  const max = Math.max(...points), min = Math.min(...points)
  const span = max - min || 1, pad = 4
  const cs = points.map((p, i) => [
    pad + (i / (points.length - 1)) * (width - 2 * pad),
    height - pad - ((p - min) / span) * (height - 2 * pad),
  ] as const)
  const d = cs.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <Svg width={width} height={height} accessible={false}>
      <Path d={d} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {cs.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.6} fill={stroke} />)}
    </Svg>
  )
}

export function Ring({ pct, size = 96, strokeWidth = 8, colorV = color.shotiqOrange, children }: {
  pct: number; size?: number; strokeWidth?: number; colorV?: string; children?: React.ReactNode
}) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, pct))
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color.rule} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colorV} strokeWidth={strokeWidth} fill="none"
                strokeDasharray={`${c * clamped} ${c}`} strokeLinecap="round" />
      </Svg>
      {children}
    </View>
  )
}

export function ScoreBar({ pct, colorV = color.shotiqOrange, width }: { pct: number; colorV?: string; width?: number }) {
  return (
    <View style={{ height: 7, borderRadius: 99, backgroundColor: color.rule, overflow: 'hidden', width, alignSelf: width ? undefined : 'stretch' }}>
      <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct * 100))}%`, borderRadius: 99, backgroundColor: colorV }} />
    </View>
  )
}

export function PhaseGlyph({ active = false, size = 30 }: { active?: boolean; size?: number }) {
  const c = active ? color.shotiqOrange : color.ink
  const s = size / 30
  return (
    <Svg width={size} height={size} accessible={false}>
      <Path d={`M${17 * s} ${8 * s} L${15 * s} ${15 * s} L${11 * s} ${21 * s} M${15 * s} ${15 * s} L${18 * s} ${21 * s} M${17 * s} ${9.5 * s} L${22 * s} ${7 * s} L${24 * s} ${3 * s}`}
            stroke={c} strokeWidth={1.6 * s} strokeLinecap="round" fill="none" />
      <Circle cx={17 * s} cy={5 * s} r={2.6 * s} stroke={c} strokeWidth={1.6 * s} fill="none" />
      <Circle cx={25 * s} cy={2.5 * s} r={1.8 * s} stroke={c} strokeWidth={1.4 * s} fill={active ? c : 'none'} />
    </Svg>
  )
}

const PHASES = ['SETUP', 'LOAD', 'RISE', 'RELEASE', 'FOLLOW-THROUGH']
export function PhaseStrip({ active = 'RELEASE' }: { active?: string }) {
  return (
    <View style={[S.row, { justifyContent: 'space-between' }]}>
      {PHASES.map((p) => (
        <View key={p} style={{ alignItems: 'center', flex: 1 }}>
          <PhaseGlyph active={p === active} size={28} />
          <Text style={{ fontFamily: p === active ? font.bodyBold : font.body, fontSize: 9, letterSpacing: 0.5,
                         color: p === active ? color.shotiqOrange : color.graphite, marginTop: 4 }}>{p}</Text>
          {p === active && <View style={{ width: 40, height: 3, backgroundColor: color.shotiqOrange, marginTop: 4 }} />}
        </View>
      ))}
    </View>
  )
}

export function MediaSurface({ height, duration = '0:07', progress = 0.28, style }: {
  height: number; duration?: string; progress?: number; style?: ViewStyle
}) {
  return (
    <View style={[{ height, borderRadius: 4, backgroundColor: color.media, overflow: 'hidden', justifyContent: 'flex-end' }, style]}
          testID="media-surface">
      <View style={[S.row, { paddingHorizontal: 14, paddingBottom: 14, gap: 10 }]}>
        <Svg width={13} height={13}><Path d="M2 1.5 L11.5 6.5 L2 11.5 Z" fill="#fff" /></Svg>
        <Text style={{ fontFamily: font.numeric, fontSize: 12, color: '#fff' }}>0:00 / {duration}</Text>
        <View style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.35)' }}>
          <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 99, backgroundColor: '#fff' }} />
        </View>
      </View>
    </View>
  )
}

export function StatBlock({ value, label, colorV = color.ink, size = 26 }: {
  value: string; label: string; colorV?: string; size?: number
}) {
  return (
    <View>
      <Numeric size={size} colorV={colorV}>{value}</Numeric>
      <Text style={{ fontFamily: font.bodyMedium, fontSize: 10, letterSpacing: 0.7, color: color.graphite, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

export function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="button"
          style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: radius.control,
                   borderWidth: value === o ? 2 : 1, borderColor: value === o ? color.shotiqOrange : color.rule,
                   backgroundColor: value === o ? color.warmCanvas : color.paper }}>
          <Text style={{ fontFamily: value === o ? font.bodySemibold : font.body, fontSize: 15, color: color.ink }}>{o}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function Screen({ testID, children, scroll = true }: {
  testID: string; children: React.ReactNode; scroll?: boolean
}) {
  if (!scroll) return <View style={S.screen} testID={testID}>{children}</View>
  return (
    <View style={S.screen} testID={testID}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  )
}

export function ListRow({ title, subtitle, onPress, testID }: {
  title: string; subtitle?: string; onPress?: () => void; testID?: string
}) {
  return (
    <Pressable onPress={onPress} testID={testID} accessibilityRole="button"
      style={[S.row, { minHeight: 44, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: color.rule }]}>
      <View style={{ flex: 1 }}>
        <Body size={15} weight="semibold">{title}</Body>
        {subtitle ? <Body size={12} colorV={color.graphite} style={{ marginTop: 2 }}>{subtitle}</Body> : null}
      </View>
      <Text style={{ color: color.graphite, fontSize: 16 }}>›</Text>
    </Pressable>
  )
}
