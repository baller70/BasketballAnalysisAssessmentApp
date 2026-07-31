// Analysis (036-047) and player-card/elite (048-053) flows.
import React, { useEffect, useState } from 'react'
import { View, Pressable, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Svg, { Path, Circle } from 'react-native-svg'
import {
  Screen, Display, Body, SectionLabel, PrimaryButton, SecondaryButton, Card,
  TrendLine, PhaseStrip, PhaseGlyph, MediaSurface, StatBlock, ScoreBar, Ring,
  Numeric, ListRow, Wordmark, S,
} from '../components'
import { color, font } from '../tokens'
import { api, EliteShooterDTO } from '../api'

/** Normalized-keypoint pose overlay scaled through the surface size. */
export function SkeletonOverlay({ width, height }: { width: number; height: number }) {
  const joints: [number, number][] = [
    [0.47, 0.9], [0.46, 0.72], [0.5, 0.55], [0.52, 0.36], [0.6, 0.27], [0.66, 0.18],
  ]
  const pts = joints.map(([x, y]) => [x * width, y * height] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <Svg width={width} height={height} style={{ position: 'absolute' }} accessible={false}>
      <Path d={d} stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {pts.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={5} stroke={color.shotiqOrange} strokeWidth={2.5} fill="none" />
      ))}
      <Circle cx={0.7 * width} cy={0.12 * height} r={8} stroke={color.shotiqOrange} strokeWidth={3} fill="none" />
    </Svg>
  )
}

export function AnalysisProcessingScreen() { // 036
  const nav = useNavigation<any>()
  const [pct, setPct] = useState(0.12)
  useEffect(() => {
    const t = setInterval(() => setPct((p) => Math.min(0.94, p + 0.11)), 500)
    const done = setTimeout(() => nav.navigate('AnalysisResultOverview'), 4200)
    return () => { clearInterval(t); clearTimeout(done) }
  }, [nav])
  return (
    <Screen testID="screen-ios-analysis-processing" scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Ring pct={pct} size={120}><Numeric size={28}>{`${Math.round(pct * 100)}%`}</Numeric></Ring>
        <Display size={32} style={{ marginTop: 26 }}>ANALYZING YOUR SHOT</Display>
        <Body size={13} colorV={color.graphite} style={{ marginTop: 8 }}>
          Detecting pose · measuring mechanics · scoring form
        </Body>
        <Pressable onPress={() => nav.navigate('AnalysisTakingLonger')} style={{ minHeight: 44, justifyContent: 'center', marginTop: 12 }}>
          <Body size={12} colorV={color.graphite}>Taking long?</Body>
        </Pressable>
      </View>
    </Screen>
  )
}

export function AnalysisTakingLongerScreen() { // 037
  return (
    <Screen testID="screen-ios-analysis-taking-longer" scroll={false}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', marginTop: 140 }}>
          <Display size={30} style={{ textAlign: 'center' }}>TAKING LONGER THAN USUAL</Display>
          <Body size={15} colorV={color.graphite} style={{ textAlign: 'center', marginTop: 10 }}>
            Your video is still processing. We&apos;ll notify you when it&apos;s ready — you can keep training.
          </Body>
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Notify me when done" />
        <View style={{ height: 12 }} />
        <SecondaryButton title="Keep waiting" />
        <View style={{ height: 30 }} />
      </View>
    </Screen>
  )
}

export function AnalysisResultOverviewScreen() { // 038
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-analysis-result-overview">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>ANALYSIS RESULT</Display>
        <Body size={13} colorV={color.graphite}>Pull-Up Jumper · Today</Body>
        <View style={{ marginTop: 14 }}>
          <MediaSurface height={300} />
          <SkeletonOverlay width={340} height={300} />
        </View>
        <View style={{ marginTop: 12 }}><PhaseStrip /></View>
        <View style={[S.row, { gap: 26, marginTop: 18, alignItems: 'flex-start' }]}>
          <View>
            <SectionLabel>FORM SCORE</SectionLabel>
            <Numeric size={64} colorV={color.shotiqOrange}>82</Numeric>
            <ScoreBar pct={0.82} width={130} />
            <Body size={14} weight="bold" colorV={color.analysisBlue} style={{ marginTop: 6 }}>GOOD</Body>
          </View>
          <View>
            <SectionLabel>SESSION</SectionLabel>
            <View style={{ gap: 10, marginTop: 8 }}>
              <StatBlock value="24" label="SHOTS" />
              <StatBlock value="15" label="MAKES" />
              <StatBlock value="62.5%" label="MAKE %" />
            </View>
          </View>
        </View>
        <View style={{ marginTop: 20 }}>
          <ListRow title="Shot breakdown" onPress={() => nav.navigate('ShotBreakdown')} />
          <ListRow title="Form score detail" onPress={() => nav.navigate('FormScore')} />
          <ListRow title="Flaws (3)" onPress={() => nav.navigate('FlawsOverview')} />
          <ListRow title="Elite match" onPress={() => nav.navigate('EliteMatch')} />
        </View>
      </View>
    </Screen>
  )
}

export function NoAnalysisYetScreen() {     // 039
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-no-analysis-yet" scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <PhaseGlyph size={64} />
        <Display size={34} style={{ marginTop: 22 }}>NO ANALYSIS YET</Display>
        <Body size={15} colorV={color.graphite} style={{ textAlign: 'center', marginTop: 8 }}>
          Capture or upload a shot and your results will live here.
        </Body>
        <View style={{ marginTop: 24, width: 240 }}>
          <PrimaryButton title="Analyze a shot" onPress={() => nav.navigate('AnalyzeHub')} />
        </View>
      </View>
    </Screen>
  )
}

export function AnalysisErrorScreen() {     // 040
  return (
    <Screen testID="screen-ios-analysis-error" scroll={false}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', marginTop: 140 }}>
          <Body size={44} colorV={color.reviewRed}>!</Body>
          <Display size={34} style={{ marginTop: 12 }}>ANALYSIS FAILED</Display>
          <Body size={15} colorV={color.graphite} style={{ textAlign: 'center', marginTop: 8 }}>
            We couldn&apos;t detect a full shooting motion. Check the filming guide and try again.
          </Body>
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Try again" />
        <View style={{ height: 12 }} />
        <SecondaryButton title="View filming guide" />
        <View style={{ height: 30 }} />
      </View>
    </Screen>
  )
}

export function ShotBreakdownScreen() {     // 041
  const nav = useNavigation<any>()
  const rows: [string, string, string, boolean][] = [
    ['SETUP', 'Stance width 16.5 in', '+1.5 vs elite', false],
    ['LOAD', 'Knee bend 24°', '-4° vs elite', false],
    ['RISE', 'Elevation 22.5 in', '-3.0 vs elite', false],
    ['RELEASE', 'Release angle 46°', '-4° vs elite', true],
    ['FOLLOW-THROUGH', 'Hold 0.7s', '-0.4s vs elite', false],
  ]
  return (
    <Screen testID="screen-ios-shot-breakdown">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>SHOT BREAKDOWN</Display>
        {rows.map(([phase, m, d, focus]) => (
          <Pressable key={phase} onPress={() => nav.navigate('FrameDetailSkeleton')} accessibilityRole="button"
            style={[S.row, { marginTop: 12, padding: 16, borderRadius: 8, minHeight: 44, gap: 14,
                             borderWidth: focus ? 2 : 1, borderColor: focus ? color.shotiqOrange : color.rule }]}>
            <PhaseGlyph active={focus} size={34} />
            <View style={{ flex: 1 }}>
              <Body size={12} weight="bold" colorV={focus ? color.shotiqOrange : color.ink}>{phase}</Body>
              <Body size={15} style={{ marginTop: 3 }}>{m}</Body>
              <Body size={12} colorV={color.reviewRed} style={{ marginTop: 2 }}>{d}</Body>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}

export function FrameDetailSkeletonScreen() { // 042
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-frame-detail-skeleton">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>FRAME DETAIL</Display>
        <View style={{ marginTop: 14 }}>
          <MediaSurface height={430} />
          <SkeletonOverlay width={340} height={430} />
        </View>
        <Body size={13} colorV={color.graphite} style={{ textAlign: 'center', marginTop: 12 }}>Frame 3 / 9 · RELEASE</Body>
        <View style={[S.row, { gap: 20, marginTop: 14, justifyContent: 'center' }]}>
          <StatBlock value="165°" label="ARM EXT." />
          <StatBlock value="46°" label="RELEASE ANGLE" />
          <StatBlock value="77.0 in" label="RELEASE HEIGHT" />
        </View>
        <Pressable onPress={() => nav.navigate('AnnotationToolbar')}
                   style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
          <Body size={14} colorV={color.analysisBlue}>Annotate this frame</Body>
        </Pressable>
      </View>
    </Screen>
  )
}

export function AnnotationToolbarScreen() { // 043
  const [tool, setTool] = useState('Draw')
  return (
    <Screen testID="screen-ios-annotation-toolbar">
      <View style={S.pad}>
        <View style={{ marginTop: 16 }}>
          <MediaSurface height={480} />
          <SkeletonOverlay width={340} height={480} />
        </View>
        <View style={[S.row, { gap: 10, marginTop: 18, justifyContent: 'center' }]}>
          {['Draw', 'Line', 'Circle', 'Angle', 'Text', 'Undo'].map((t) => (
            <Pressable key={t} onPress={() => setTool(t)} accessibilityRole="button"
              style={{ minWidth: 50, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6,
                       borderWidth: 1, borderColor: tool === t ? color.shotiqOrange : color.rule,
                       backgroundColor: tool === t ? color.warmCanvas : color.paper }}>
              <Body size={12}>{t}</Body>
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 20 }}><PrimaryButton title="Save annotation" /></View>
      </View>
    </Screen>
  )
}

export function FormScoreScreen() {         // 044
  const nav = useNavigation<any>()
  const metrics: [string, number][] = [
    ['Release', 0.88], ['Balance', 0.84], ['Alignment', 0.76], ['Rhythm', 0.81], ['Follow-through', 0.72],
  ]
  return (
    <Screen testID="screen-ios-form-score">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>FORM SCORE</Display>
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Ring pct={0.82} size={150}>
            <View style={{ alignItems: 'center' }}>
              <Numeric size={48} colorV={color.shotiqOrange}>82</Numeric>
              <Body size={12} weight="bold" colorV={color.analysisBlue}>GOOD</Body>
            </View>
          </Ring>
        </View>
        {metrics.map(([m, v]) => (
          <Pressable key={m} onPress={() => nav.navigate('MetricDetail', { metric: m, value: v })}
                     accessibilityRole="button" style={{ paddingVertical: 12, minHeight: 44 }}>
            <View style={S.row}>
              <Body size={15} weight="semibold" style={{ flex: 1 }}>{m}</Body>
              <Numeric size={22}>{String(Math.round(v * 100))}</Numeric>
            </View>
            <View style={{ marginTop: 7 }}>
              <ScoreBar pct={v} colorV={v >= 0.8 ? color.confirmGreen : color.shotiqOrange} />
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}

export function MetricDetailScreen({ route }: any) { // 045
  const metric: string = route?.params?.metric ?? 'Release'
  const value: number = route?.params?.value ?? 0.88
  return (
    <Screen testID="screen-ios-metric-detail">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>{metric.toUpperCase()}</Display>
        <View style={[S.row, { gap: 16, marginTop: 14, alignItems: 'flex-end' }]}>
          <Numeric size={64} colorV={value >= 0.8 ? color.confirmGreen : color.shotiqOrange}>
            {String(Math.round(value * 100))}
          </Numeric>
          <View>
            <Body size={11} weight="bold" colorV={color.graphite}>ELITE RANGE 85–95</Body>
            <TrendLine points={[70, 74, 72, 78, 82, 88]} width={150} height={44} />
          </View>
        </View>
        <SectionLabel style={{ marginTop: 20 }}>LAST 6 SESSIONS</SectionLabel>
        <Card style={{ padding: 14, marginTop: 8 }}>
          <TrendLine points={[70, 74, 72, 78, 82, 88]} width={300} height={140} stroke={color.analysisBlue} />
        </Card>
        <SectionLabel style={{ marginTop: 20 }}>WHAT DRIVES THIS</SectionLabel>
        <Body size={14} colorV={color.graphite} style={{ marginTop: 8, lineHeight: 20 }}>
          Release timing consistency, elbow path and wrist snap. Your release apex is 0.04s early relative to
          elite timing — the Quick Release Builder drill targets exactly this.
        </Body>
      </View>
    </Screen>
  )
}

export function FlawsOverviewScreen() {     // 046
  const nav = useNavigation<any>()
  const flaws: [string, string, string][] = [
    ['Elbow drifts out at release', 'HIGH', '-6% est. make rate'],
    ['Early release before apex', 'MEDIUM', '-3% est. make rate'],
    ['Short follow-through hold', 'LOW', '-1% est. make rate'],
  ]
  const sevColor = (s: string) => s === 'HIGH' ? color.reviewRed : s === 'MEDIUM' ? color.shotiqOrange : color.graphite
  return (
    <Screen testID="screen-ios-flaws-overview">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>FLAWS</Display>
        <Body size={14} colorV={color.graphite} style={{ marginTop: 4 }}>
          3 issues detected, ranked by impact on make %.
        </Body>
        {flaws.map(([t, sev, d]) => (
          <Pressable key={t} onPress={() => nav.navigate('FlawDetail', { title: t, severity: sev })}
            accessibilityRole="button"
            style={{ marginTop: 12, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: color.rule, minHeight: 44 }}>
            <View style={[S.row, { gap: 8 }]}>
              <View style={{ backgroundColor: sevColor(sev), borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Body size={10} weight="bold" colorV="#fff">{sev}</Body>
              </View>
            </View>
            <Body size={15} weight="semibold" style={{ marginTop: 8 }}>{t}</Body>
            <Body size={12} colorV={color.graphite} style={{ marginTop: 3 }}>{d}</Body>
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}

export function FlawDetailScreen({ route }: any) { // 047
  const nav = useNavigation<any>()
  const title: string = route?.params?.title ?? 'Elbow drifts out at release'
  return (
    <Screen testID="screen-ios-flaw-detail">
      <View style={S.pad}>
        <Display size={32} style={{ marginTop: 24 }}>{title.toUpperCase()}</Display>
        <View style={{ marginTop: 14 }}>
          <MediaSurface height={280} />
          <SkeletonOverlay width={340} height={280} />
        </View>
        <SectionLabel style={{ marginTop: 20 }}>WHY IT MATTERS</SectionLabel>
        <Body size={14} colorV={color.graphite} style={{ marginTop: 6, lineHeight: 20 }}>
          An elbow outside the ball&apos;s line adds lateral spin and reduces repeatability. Elite shooters keep
          the elbow stacked under the ball through release.
        </Body>
        <SectionLabel style={{ marginTop: 20 }}>FIX IT WITH</SectionLabel>
        <ListRow title="Wall Elbow Alignment" subtitle="8 min · Form Focus"
                 onPress={() => nav.navigate('DrillDetail', { name: 'Wall Elbow Alignment' })} />
      </View>
    </Screen>
  )
}

/* ------------------------- player card & elite ------------------------- */

export function PlayerCardScreen() {        // 048
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-player-card">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24, textAlign: 'center' }}>PLAYER CARD</Display>
        <Card style={{ padding: 22, marginTop: 16, alignItems: 'center' }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: color.rule,
                         alignItems: 'center', justifyContent: 'center' }}>
            <Body size={26} weight="bold" colorV={color.graphite}>JE</Body>
          </View>
          <Display size={30} style={{ marginTop: 12 }}>JORDAN ELLIS</Display>
          <Body size={13} colorV={color.graphite}>Guard · Right Hand · Advanced</Body>
          <View style={[S.row, { gap: 26, marginTop: 14 }]}>
            <StatBlock value="82" label="FORM" colorV={color.shotiqOrange} size={34} />
            <StatBlock value="62.5%" label="MAKE %" size={34} />
            <StatBlock value="37" label="ANALYSES" size={34} />
          </View>
          <TrendLine points={[72, 75, 74, 78, 80, 82]} width={220} height={44} />
        </Card>
        <View style={{ marginTop: 16 }}>
          <SecondaryButton title="Customize card" onPress={() => nav.navigate('CustomizePlayerCard')} />
        </View>
        <View style={{ marginTop: 12 }}>
          <PrimaryButton title="Share card" onPress={() => nav.navigate('ShareResults')} />
        </View>
      </View>
    </Screen>
  )
}

export function CustomizePlayerCardScreen() { // 049
  const [accent, setAccent] = useState('Orange')
  const [layout, setLayout] = useState('Classic')
  return (
    <Screen testID="screen-ios-customize-player-card">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>CUSTOMIZE CARD</Display>
        <SectionLabel style={{ marginTop: 20 }}>ACCENT</SectionLabel>
        <ChipsLocal options={['Orange', 'Blue', 'Green', 'Ink']} value={accent} onChange={setAccent} />
        <SectionLabel style={{ marginTop: 20 }}>LAYOUT</SectionLabel>
        <ChipsLocal options={['Classic', 'Stat-heavy', 'Minimal', 'Action']} value={layout} onChange={setLayout} />
        <View style={{ marginTop: 26 }}><PrimaryButton title="Save card" /></View>
      </View>
    </Screen>
  )
}
// local alias to avoid another import churn
import { Chips as ChipsLocal } from '../components'

export function EliteMatchScreen() {        // 050
  const nav = useNavigation<any>()
  const [top, setTop] = useState<EliteShooterDTO | null>(null)
  useEffect(() => { api.shooters().then((s) => setTop(s[0] ?? null)).catch(() => {}) }, [])
  return (
    <Screen testID="screen-ios-elite-match">
      <View style={S.pad}>
        <Display size={36} style={{ marginTop: 24 }}>YOUR ELITE MATCH</Display>
        <Body size={14} colorV={color.graphite} style={{ marginTop: 4 }}>
          Closest elite mechanics to your shot profile.
        </Body>
        <Card style={{ padding: 20, marginTop: 16, alignItems: 'center' }}>
          <Body size={12} weight="bold" colorV={color.confirmGreen} style={{ letterSpacing: 1 }}>94% MATCH</Body>
          <Display size={30} style={{ marginTop: 6 }}>{(top?.name ?? 'STEPHEN CURRY').toUpperCase()}</Display>
          <Body size={13} colorV={color.graphite}>{top ? `${top.team} · ${top.position}` : ''}</Body>
          <View style={{ marginTop: 12 }}>
            <Ring pct={0.94} size={110} colorV={color.confirmGreen}><Numeric size={34}>94</Numeric></Ring>
          </View>
          <Pressable onPress={() => nav.navigate('PhotoComparison')} style={{ minHeight: 44, justifyContent: 'center', marginTop: 8 }}>
            <Body size={14} weight="semibold" colorV={color.analysisBlue}>Side-by-side comparison</Body>
          </Pressable>
        </Card>
      </View>
    </Screen>
  )
}

export function PhotoComparisonScreen() {   // 051
  return (
    <Screen testID="screen-ios-photo-comparison">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24, textAlign: 'center' }}>SIDE-BY-SIDE</Display>
        <View style={[S.row, { gap: 10, marginTop: 14 }]}>
          <View style={{ flex: 1 }}>
            <MediaSurface height={340} />
            <SkeletonOverlay width={165} height={340} />
            <Body size={11} weight="bold" style={{ textAlign: 'center', marginTop: 8, letterSpacing: 1 }}>YOU</Body>
          </View>
          <View style={{ flex: 1 }}>
            <MediaSurface height={340} />
            <SkeletonOverlay width={165} height={340} />
            <Body size={11} weight="bold" colorV={color.analysisBlue}
                  style={{ textAlign: 'center', marginTop: 8, letterSpacing: 1 }}>ELITE</Body>
          </View>
        </View>
        <View style={{ marginTop: 14 }}><PhaseStrip /></View>
        <View style={[S.row, { gap: 22, marginTop: 12, justifyContent: 'center' }]}>
          <StatBlock value="46° vs 50°" label="RELEASE ANGLE" size={22} />
          <StatBlock value="77 vs 81 in" label="RELEASE HEIGHT" size={22} />
        </View>
      </View>
    </Screen>
  )
}

export function EliteShootersScreen() {     // 052
  const nav = useNavigation<any>()
  const [shooters, setShooters] = useState<EliteShooterDTO[]>([])
  const [query, setQuery] = useState('')
  useEffect(() => { api.shooters().then(setShooters).catch(() => {}) }, [])
  const filtered = query ? shooters.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())) : shooters
  return (
    <Screen testID="screen-ios-elite-shooters">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>ELITE SHOOTERS</Display>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search shooters"
          placeholderTextColor={color.muted}
          style={{ marginTop: 12, height: 46, borderWidth: 1, borderColor: color.rule, borderRadius: 6,
                   paddingHorizontal: 14, fontFamily: font.body, fontSize: 15, color: color.ink }} />
        {filtered.map((s) => (
          <ListRow key={s.id} title={s.name} subtitle={`${s.team} · ${s.league}`}
                   onPress={() => nav.navigate('EliteShooterDetail', { shooter: s })} />
        ))}
        {!filtered.length && (
          <Body size={13} colorV={color.graphite} style={{ marginTop: 20 }}>
            {shooters.length ? 'No shooters match your search.' : 'Loading shooters…'}
          </Body>
        )}
      </View>
    </Screen>
  )
}

export function EliteShooterDetailScreen({ route }: any) { // 053
  const nav = useNavigation<any>()
  const s: EliteShooterDTO | undefined = route?.params?.shooter
  return (
    <Screen testID="screen-ios-elite-shooter-detail">
      <View style={S.pad}>
        <Display size={36} style={{ marginTop: 24 }}>{(s?.name ?? 'Elite shooter').toUpperCase()}</Display>
        <Body size={13} colorV={color.graphite}>{s ? `${s.team} · ${s.position} · ${s.league}` : ''}</Body>
        <MediaSurface height={300} style={{ marginTop: 14 }} />
        <View style={{ marginTop: 12 }}><PhaseStrip /></View>
        <SectionLabel style={{ marginTop: 20 }}>CAREER SHOOTING</SectionLabel>
        <View style={[S.row, { gap: 24, marginTop: 8 }]}>
          {s?.careerPct != null && <StatBlock value={`${s.careerPct.toFixed(1)}%`} label="3P%" size={30} />}
          {s && <StatBlock value={`${s.careerFreeThrowPct.toFixed(1)}%`} label="FT%" size={30} />}
          {s && <StatBlock value={`${Math.floor(s.height / 12)}' ${s.height % 12}"`} label="HEIGHT" size={30} />}
          {s && <StatBlock value={`${s.weight} lb`} label="WEIGHT" size={30} />}
        </View>
        <View style={{ marginVertical: 24 }}>
          <PrimaryButton title="Compare with my shot" bg={color.analysisBlue}
                         onPress={() => nav.navigate('PhotoComparison')} />
        </View>
      </View>
    </Screen>
  )
}
