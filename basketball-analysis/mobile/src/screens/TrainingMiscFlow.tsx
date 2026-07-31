// Training (054-062), goals (063-065), analytics (066-067), media (068-069),
// profile (070), settings (071), share (072).
import React, { useEffect, useRef, useState } from 'react'
import { View, Pressable, TextInput, Switch, Share } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import {
  Screen, Display, Body, SectionLabel, PrimaryButton, SecondaryButton, Card, Chips,
  TrendLine, PhaseStrip, MediaSurface, StatBlock, ScoreBar, Ring, Numeric, ListRow,
  Wordmark, S,
} from '../components'
import { color, font } from '../tokens'
import { api, GoalDTO } from '../api'
import { useApp } from '../appState'

export function TrainingHomeScreen() {      // 054
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-training-home">
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 24 }}>TRAINING</Display>
        <Card style={{ padding: 16, marginTop: 16 }}>
          <Body size={16} weight="semibold">Quick Release Builder</Body>
          <Body size={12} colorV={color.graphite} style={{ marginTop: 3 }}>
            20 min · Form Focus · targets your #1 flaw
          </Body>
          <View style={{ marginTop: 12 }}>
            <PrimaryButton title="Start" onPress={() => nav.navigate('QuickStart')} />
          </View>
        </Card>
        <View style={{ marginTop: 18 }}>
          <ListRow title="Discover drills" onPress={() => nav.navigate('DiscoverDrills')} />
          <ListRow title="My drills" onPress={() => nav.navigate('MyDrills')} />
          <ListRow title="Workout calendar" onPress={() => nav.navigate('WorkoutCalendar')} />
          <ListRow title="Shot tracker" onPress={() => nav.navigate('ShotTracker')} />
        </View>
      </View>
    </Screen>
  )
}

export function QuickStartScreen() {        // 055
  const nav = useNavigation<any>()
  const steps: [string, string][] = [
    ['Wall Elbow Alignment', '8 min'], ['Quick Release Builder', '12 min'], ['Free Throw Ladder', '10 min'],
  ]
  return (
    <Screen testID="screen-ios-quick-start">
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 24 }}>QUICK START</Display>
        <Body size={15} colorV={color.graphite} style={{ marginTop: 6 }}>
          Today&apos;s recommended session, built from your last analysis.
        </Body>
        {steps.map(([t, d], i) => (
          <View key={t} style={[S.row, { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.rule, gap: 14 }]}>
            <Numeric size={18} colorV={color.shotiqOrange}>{String(i + 1)}</Numeric>
            <View style={{ flex: 1 }}>
              <Body size={15} weight="semibold">{t}</Body>
              <Body size={12} colorV={color.graphite}>{d}</Body>
            </View>
          </View>
        ))}
        <View style={{ marginTop: 24 }}>
          <PrimaryButton title="Start session · 30 min"
                         onPress={() => nav.navigate('DrillExecution', { name: 'Wall Elbow Alignment' })} />
        </View>
      </View>
    </Screen>
  )
}

export function DiscoverDrillsScreen() {    // 056
  const nav = useNavigation<any>()
  const [filter, setFilter] = useState('All')
  const drills: [string, string][] = [
    ['Pound Crossover Foundation', 'Ball Handling · Beginner · 6 min'],
    ['Quick Release Builder', 'Form Focus · Intermediate · 12 min'],
    ['One-Hand Form Shooting', 'Form · Beginner · 8 min'],
    ['Elbow Alignment Wall Drill', 'Form · Beginner · 8 min'],
    ['Catch & Shoot Ladder', 'Shooting · Advanced · 15 min'],
  ]
  return (
    <Screen testID="screen-ios-discover-drills">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>DISCOVER DRILLS</Display>
        <Chips options={['All', 'Form', 'Release', 'Balance', 'Footwork']} value={filter} onChange={setFilter} />
        {drills.map(([t, d]) => (
          <ListRow key={t} title={t} subtitle={d} onPress={() => nav.navigate('DrillDetail', { name: t })} />
        ))}
      </View>
    </Screen>
  )
}

export function DrillDetailScreen({ route }: any) { // 057
  const nav = useNavigation<any>()
  const name: string = route?.params?.name ?? 'Pound Crossover Foundation'
  const steps = [
    'Set feet shoulder width, ball in right hand.', 'Pound the ball hard at knee height.',
    'Cross over below the knees, stay low.', 'Repeat for 45 seconds, then switch hands.',
  ]
  return (
    <Screen testID="screen-ios-drill-detail">
      <View style={S.pad}>
        <Display size={34} style={{ marginTop: 24 }}>{name.toUpperCase()}</Display>
        <View style={[S.row, { gap: 8, marginTop: 10, flexWrap: 'wrap' }]}>
          {['Ball Handling', 'Beginner', '6 min', 'Right Hand'].map((c) => (
            <View key={c} style={{ borderWidth: 1, borderColor: color.rule, borderRadius: 99,
                                   paddingHorizontal: 11, paddingVertical: 5 }}>
              <Body size={12}>{c}</Body>
            </View>
          ))}
        </View>
        <MediaSurface height={240} style={{ marginTop: 16 }} />
        <SectionLabel style={{ marginTop: 20 }}>HOW TO DO IT</SectionLabel>
        {steps.map((s, i) => (
          <View key={i} style={[S.row, { paddingVertical: 7, gap: 12, alignItems: 'flex-start' }]}>
            <Numeric size={20} colorV={color.shotiqOrange}>{String(i + 1)}</Numeric>
            <Body size={14} style={{ flex: 1 }}>{s}</Body>
          </View>
        ))}
        <View style={{ marginVertical: 24 }}>
          <PrimaryButton title="Start drill" onPress={() => nav.navigate('DrillExecution', { name })} />
        </View>
      </View>
    </Screen>
  )
}

export function MyDrillsScreen() {          // 058
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-my-drills">
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 24 }}>MY DRILLS</Display>
        <SectionLabel style={{ marginTop: 16 }}>SAVED</SectionLabel>
        {[['Quick Release Builder', '3x this week'], ['Wall Elbow Alignment', 'Last: yesterday'],
          ['Free Throw Ladder', 'Last: 3 days ago']].map(([t, d]) => (
          <ListRow key={t} title={t} subtitle={d} onPress={() => nav.navigate('DrillDetail', { name: t })} />
        ))}
      </View>
    </Screen>
  )
}

export function WorkoutCalendarScreen() {   // 059
  const nav = useNavigation<any>()
  const [selected, setSelected] = useState(12)
  const marked = [3, 6, 10, 12]
  return (
    <Screen testID="screen-ios-workout-calendar">
      <View style={S.pad}>
        <Display size={36} style={{ marginTop: 24 }}>WORKOUT CALENDAR</Display>
        <Body size={15} weight="semibold" style={{ marginTop: 12 }}>May 2025</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <Pressable key={d} onPress={() => setSelected(d)} accessibilityRole="button"
              style={{ width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                             backgroundColor: selected === d ? color.shotiqOrange : 'transparent' }}>
                <Body size={14} weight={selected === d ? 'bold' : undefined}
                      colorV={selected === d ? '#fff' : color.ink}>{String(d)}</Body>
              </View>
              {marked.includes(d) && selected !== d && (
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color.confirmGreen, marginTop: -6 }} />
              )}
            </Pressable>
          ))}
        </View>
        <SectionLabel style={{ marginTop: 18 }}>{`MAY ${selected}`}</SectionLabel>
        <Card style={{ padding: 14, marginTop: 8 }}>
          <View style={S.row}>
            <View style={{ flex: 1 }}>
              <Body size={15} weight="semibold">Quick Release Builder</Body>
              <Body size={12} colorV={color.graphite}>Scheduled · 20 min</Body>
            </View>
            <Pressable onPress={() => nav.navigate('DrillExecution', { name: 'Quick Release Builder' })}
                       style={{ minHeight: 44, justifyContent: 'center' }}>
              <Body size={13} weight="semibold" colorV={color.shotiqOrange}>Start</Body>
            </Pressable>
          </View>
        </Card>
      </View>
    </Screen>
  )
}

export function DrillExecutionScreen({ route }: any) { // 060
  const nav = useNavigation<any>()
  const name: string = route?.params?.name ?? 'Pound Crossover Foundation'
  const [shots, setShots] = useState<{ n: number; made: boolean }[]>([])
  const [sec, setSec] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = useRef(0)
  useEffect(() => {
    const t = setInterval(() => { if (!paused) setSec((s) => s + 1) }, 1000)
    return () => clearInterval(t)
  }, [paused])
  const mark = (made: boolean) => {
    n.current += 1
    setShots((s) => [...s, { n: n.current, made }])
    api.recordShotEvent(name, made) // persists via the shared contract
  }
  const makes = shots.filter((s) => s.made).length
  const pct = shots.length ? makes / shots.length : 0
  return (
    <Screen testID="screen-ios-drill-execution">
      <View style={S.pad}>
        <View style={[S.row, { marginTop: 16 }]}>
          <Display size={26} style={{ flex: 1 }}>{name.toUpperCase()}</Display>
          <Numeric size={24}>{`${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`}</Numeric>
        </View>
        <MediaSurface height={300} style={{ marginTop: 10 }} />
        <View style={[S.row, { gap: 26, marginTop: 14 }]}>
          <StatBlock value={String(shots.length)} label="SHOTS" size={30} />
          <StatBlock value={String(makes)} label="MAKES" colorV={color.confirmGreen} size={30} />
          <StatBlock value={`${Math.round(pct * 100)}%`} label="MAKE %" size={30} />
          <View style={{ flex: 1 }} />
          <Ring pct={pct} size={52} strokeWidth={6} colorV={color.confirmGreen} />
        </View>
        <View style={[S.row, { gap: 12, marginTop: 14 }]}>
          <View style={{ flex: 1 }}>
            <Pressable testID="mark-make" onPress={() => mark(true)} accessibilityRole="button"
              style={{ height: 50, borderRadius: 6, borderWidth: 2, borderColor: color.confirmGreen,
                       alignItems: 'center', justifyContent: 'center' }}>
              <Body size={15} weight="medium" colorV={color.confirmGreen}>Make</Body>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Pressable testID="mark-miss" onPress={() => mark(false)} accessibilityRole="button"
              style={{ height: 50, borderRadius: 6, borderWidth: 2, borderColor: color.reviewRed,
                       alignItems: 'center', justifyContent: 'center' }}>
              <Body size={15} weight="medium" colorV={color.reviewRed}>Miss</Body>
            </Pressable>
          </View>
          <Pressable testID="undo-shot" accessibilityLabel="Undo last shot"
            onPress={() => setShots((s) => s.slice(0, -1))}
            style={{ width: 52, height: 50, borderRadius: 6, borderWidth: 1, borderColor: color.rule,
                     alignItems: 'center', justifyContent: 'center' }}>
            <Body size={18}>↩</Body>
          </Pressable>
        </View>
        <View style={[S.row, { gap: 12, marginTop: 10 }]}>
          <View style={{ flex: 1 }}>
            <PrimaryButton title={paused ? 'Resume' : 'Pause'} onPress={() => setPaused(!paused)} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton title="End workout"
              onPress={() => nav.navigate('WorkoutCompletion', { shots: shots.length, makes })} />
          </View>
        </View>
      </View>
    </Screen>
  )
}

export function ShotTrackerScreen() {       // 061
  return (
    <Screen testID="screen-ios-shot-tracker">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>SHOT TRACKER</Display>
        <View style={[S.row, { marginTop: 18, gap: 20 }]}>
          <Ring pct={0.625} size={110} colorV={color.confirmGreen}>
            <View style={{ alignItems: 'center' }}>
              <Numeric size={24}>62.5%</Numeric>
              <Body size={9} weight="bold" colorV={color.graphite}>MAKE %</Body>
            </View>
          </Ring>
          <View style={{ flex: 1 }} />
          <StatBlock value="24" label="SHOTS" size={34} />
          <StatBlock value="15" label="MAKES" colorV={color.confirmGreen} size={34} />
          <StatBlock value="9" label="MISSES" colorV={color.reviewRed} size={34} />
        </View>
        <SectionLabel style={{ marginTop: 22 }}>MAKE % BY SESSION</SectionLabel>
        <Card style={{ padding: 14, marginTop: 8 }}>
          <TrendLine points={[52, 55, 58, 54, 60, 62.5]} width={300} height={130} stroke={color.analysisBlue} />
        </Card>
      </View>
    </Screen>
  )
}

export function WorkoutCompletionScreen({ route }: any) { // 062
  const nav = useNavigation<any>()
  const shots: number = route?.params?.shots ?? 24
  const makes: number = route?.params?.makes ?? 15
  return (
    <Screen testID="screen-ios-workout-completion" scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Display size={36}>WORKOUT COMPLETE</Display>
        <View style={[S.row, { gap: 30, marginTop: 22 }]}>
          <StatBlock value={String(shots)} label="SHOTS" size={36} />
          <StatBlock value={String(makes)} label="MAKES" colorV={color.confirmGreen} size={36} />
          <StatBlock value={shots ? `${Math.round((makes / shots) * 100)}%` : '—'} label="MAKE %" size={36} />
        </View>
        <Body size={15} weight="semibold" colorV={color.confirmGreen} style={{ marginTop: 16 }}>+120 points earned</Body>
        <View style={{ alignSelf: 'stretch', marginTop: 30 }}>
          <PrimaryButton title="Done" onPress={() => nav.navigate('TrainingHome')} />
        </View>
      </View>
    </Screen>
  )
}

/* ------------------------------ goals etc ------------------------------ */

export function GoalsScreen() {             // 063
  const nav = useNavigation<any>()
  const [goals, setGoals] = useState<GoalDTO[]>([])
  useEffect(() => { api.goals().then(setGoals).catch(() => {}) }, [])
  const display = goals.length ? goals : [
    { id: 'g1', title: 'Improve release consistency and arm alignment', progress: 0.72 },
    { id: 'g2', title: 'Raise make % to 65', progress: 0.4 },
  ]
  return (
    <Screen testID="screen-ios-goals">
      <View style={S.pad}>
        <View style={[S.row, { marginTop: 24 }]}>
          <Display size={40} style={{ flex: 1 }}>GOALS</Display>
          <Pressable accessibilityLabel="Create goal" onPress={() => nav.navigate('CreateGoal')}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.shotiqOrange,
                     alignItems: 'center', justifyContent: 'center' }}>
            <Body size={22} colorV="#fff">+</Body>
          </Pressable>
        </View>
        {display.map((g) => (
          <Pressable key={g.id} onPress={() => nav.navigate('GoalDetail', { goal: g })} accessibilityRole="button"
            style={{ marginTop: 12, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: color.rule }}>
            <View style={S.row}>
              <Body size={10} weight="bold" colorV={color.confirmGreen}>ACTIVE</Body>
              <View style={{ flex: 1 }} />
              <Numeric size={20}>{`${Math.round((g.progress ?? 0) * 100)}%`}</Numeric>
            </View>
            <Body size={16} weight="semibold" style={{ marginTop: 8 }}>{g.title}</Body>
            <View style={{ marginTop: 9 }}>
              <ScoreBar pct={g.progress ?? 0} colorV={color.confirmGreen} />
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}

export function CreateGoalScreen() {        // 064
  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState('Make %')
  return (
    <Screen testID="screen-ios-create-goal">
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 24 }}>CREATE GOAL</Display>
        <SectionLabel style={{ marginTop: 20 }}>GOAL NAME</SectionLabel>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Raise make % to 65"
          placeholderTextColor={color.muted}
          style={{ marginTop: 8, height: 50, borderWidth: 1, borderColor: color.rule, borderRadius: 6,
                   paddingHorizontal: 14, fontFamily: font.body, fontSize: 15, color: color.ink }} />
        <SectionLabel style={{ marginTop: 20 }}>METRIC</SectionLabel>
        <Chips options={['Make %', 'Form Score', 'Release', 'Balance']} value={metric} onChange={setMetric} />
        <View style={{ marginTop: 26 }}>
          <PrimaryButton title="Create goal" disabled={!title} />
        </View>
      </View>
    </Screen>
  )
}

export function GoalDetailScreen({ route }: any) { // 065
  const nav = useNavigation<any>()
  const g: GoalDTO = route?.params?.goal ?? { id: 'g', title: 'Goal', progress: 0.5 }
  return (
    <Screen testID="screen-ios-goal-detail">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>GOAL DETAIL</Display>
        <Card style={{ padding: 18, marginTop: 14 }}>
          <Body size={17} weight="semibold">{g.title}</Body>
          <View style={[S.row, { marginTop: 12 }]}>
            <Ring pct={g.progress ?? 0} size={88} colorV={color.confirmGreen}>
              <Numeric size={22}>{`${Math.round((g.progress ?? 0) * 100)}%`}</Numeric>
            </Ring>
            <View style={{ flex: 1 }} />
            <TrendLine points={[40, 48, 55, 60, 66, 72]} width={150} height={60} />
          </View>
        </Card>
        <SectionLabel style={{ marginTop: 20 }}>LINKED DRILLS</SectionLabel>
        {['Quick Release Builder', 'Wall Elbow Alignment'].map((d) => (
          <ListRow key={d} title={d} onPress={() => nav.navigate('DrillDetail', { name: d })} />
        ))}
        <View style={{ marginTop: 24 }}><SecondaryButton title="Mark goal complete" /></View>
      </View>
    </Screen>
  )
}

export function AnalyticsCardsScreen() {    // 066
  const nav = useNavigation<any>()
  const cards: [string, string, string, number[]][] = [
    ['FORM SCORE', '82', '+8.1%', [72, 75, 74, 78, 80, 82]],
    ['MAKE %', '62.5%', '+6.4%', [52, 55, 58, 54, 60, 62.5]],
    ['RELEASE SPEED', '1.32s', '+3.2%', [1.5, 1.44, 1.4, 1.38, 1.35, 1.32]],
    ['ELBOW ALIGNMENT', '92%', '+7.6%', [80, 83, 86, 88, 90, 92]],
  ]
  return (
    <Screen testID="screen-ios-analytics-cards">
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 24 }}>PROGRESS</Display>
        {cards.map(([label, v, d, pts]) => (
          <Pressable key={label} onPress={() => nav.navigate('AnalyticsDetailed', { metric: label })}
                     accessibilityRole="button">
            <Card style={{ padding: 16, marginTop: 12 }}>
              <View style={S.row}>
                <View style={{ flex: 1 }}>
                  <SectionLabel>{label}</SectionLabel>
                  <Numeric size={40}>{v}</Numeric>
                  <Body size={12} colorV={color.confirmGreen}>{`${d} vs last 30 days`}</Body>
                </View>
                <TrendLine points={pts} width={130} height={60} stroke={color.analysisBlue} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}

export function AnalyticsDetailedScreen({ route }: any) { // 067
  const metric: string = route?.params?.metric ?? 'FORM SCORE'
  const [range, setRange] = useState('30D')
  return (
    <Screen testID="screen-ios-analytics-detailed">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>{metric}</Display>
        <Chips options={['7D', '30D', '90D', 'ALL']} value={range} onChange={setRange} />
        <Card style={{ padding: 16, marginTop: 14 }}>
          <TrendLine points={[70, 72, 71, 75, 74, 78, 77, 80, 82]} width={300} height={200} stroke={color.analysisBlue} />
        </Card>
        <SectionLabel style={{ marginTop: 20 }}>BY SHOT TYPE</SectionLabel>
        {[['Catch & Shoot', 0.84], ['Pull-Up', 0.78], ['Off the Dribble', 0.71]].map(([t, v]) => (
          <View key={String(t)} style={{ paddingVertical: 9 }}>
            <View style={S.row}>
              <Body size={14} weight="semibold" style={{ flex: 1 }}>{String(t)}</Body>
              <Numeric size={20}>{String(Math.round(Number(v) * 100))}</Numeric>
            </View>
            <View style={{ marginTop: 6 }}>
              <ScoreBar pct={Number(v)} colorV={color.analysisBlue} />
            </View>
          </View>
        ))}
      </View>
    </Screen>
  )
}

export function MyMediaScreen() {           // 068
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-my-media">
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 24 }}>MY MEDIA</Display>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <Pressable key={i} onPress={() => nav.navigate('MediaDetail')} accessibilityRole="button"
                       style={{ width: '31%' }}>
              <MediaSurface height={120} duration={`0:0${i % 9}`} />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  )
}

export function MediaDetailScreen() {       // 069
  return (
    <Screen testID="screen-ios-media-detail">
      <View style={S.pad}>
        <MediaSurface height={420} style={{ marginTop: 16 }} />
        <View style={[S.row, { gap: 24, marginTop: 16 }]}>
          <StatBlock value="82" label="FORM SCORE" colorV={color.shotiqOrange} size={30} />
          <StatBlock value="Made" label="RESULT" colorV={color.confirmGreen} size={30} />
          <StatBlock value="0:07" label="LENGTH" size={30} />
        </View>
        <View style={[S.row, { gap: 12, marginTop: 14 }]}>
          <View style={{ flex: 1 }}><SecondaryButton title="Re-analyze" /></View>
          <View style={{ flex: 1 }}><SecondaryButton title="Share" /></View>
        </View>
      </View>
    </Screen>
  )
}

export function ProfileScreen() {           // 070
  const nav = useNavigation<any>()
  const { user, signOut } = useApp()
  return (
    <Screen testID="screen-ios-profile">
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 24 }}>PROFILE</Display>
        <View style={[S.row, { marginTop: 16, gap: 16 }]}>
          <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: color.rule,
                         alignItems: 'center', justifyContent: 'center' }}>
            <Body size={22} weight="bold" colorV={color.graphite}>JE</Body>
          </View>
          <View>
            <Body size={18} weight="semibold">{user?.displayName ?? 'Jordan Ellis'}</Body>
            <Body size={13} colorV={color.graphite}>Right Hand · Advanced · Guard</Body>
          </View>
        </View>
        <View style={[S.row, { gap: 26, marginTop: 18 }]}>
          <StatBlock value="37" label="ANALYSES" size={30} />
          <StatBlock value="82" label="BEST FORM" size={30} />
          <StatBlock value="6" label="DAY STREAK" size={30} />
          <StatBlock value="2,840" label="POINTS" size={30} />
        </View>
        <View style={{ marginTop: 18 }}>
          <ListRow title="Player card" onPress={() => nav.navigate('PlayerCard')} />
          <ListRow title="My media" onPress={() => nav.navigate('MyMedia')} />
          <ListRow title="Goals" onPress={() => nav.navigate('Goals')} />
          <ListRow title="Settings" onPress={() => nav.navigate('SettingsHub')} />
          <ListRow title="Share results" onPress={() => nav.navigate('ShareResults')} />
        </View>
        <Pressable onPress={signOut} style={{ minHeight: 44, justifyContent: 'center', marginTop: 10 }}>
          <Body size={16} colorV={color.reviewRed}>Sign out</Body>
        </Pressable>
      </View>
    </Screen>
  )
}

export function SettingsHubScreen() {       // 071
  const [notifs, setNotifs] = useState(true)
  const [audio, setAudio] = useState(true)
  const [metric, setMetric] = useState(false)
  const Row = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={[S.row, { paddingVertical: 10, minHeight: 44 }]}>
      <Body size={15} style={{ flex: 1 }}>{label}</Body>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: color.shotiqOrange }} />
    </View>
  )
  return (
    <Screen testID="screen-ios-settings-hub">
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 24 }}>SETTINGS</Display>
        <SectionLabel style={{ marginTop: 18 }}>PREFERENCES</SectionLabel>
        <Row label="Workout notifications" value={notifs} onChange={setNotifs} />
        <Row label="Coaching audio cues" value={audio} onChange={setAudio} />
        <Row label="Metric units" value={metric} onChange={setMetric} />
        <SectionLabel style={{ marginTop: 18 }}>ACCOUNT</SectionLabel>
        {['Edit profile', 'Change password', 'Privacy', 'Export my data'].map((t) => (
          <ListRow key={t} title={t} />
        ))}
        <View style={[S.row, { paddingVertical: 12 }]}>
          <Body size={15} style={{ flex: 1 }}>Version</Body>
          <Body size={14} colorV={color.graphite}>1.0.0</Body>
        </View>
      </View>
    </Screen>
  )
}

export function ShareResultsScreen() {      // 072
  const share = () => {
    Share.share({ message: 'My ShotIQ form score: 82 (GOOD) — 62.5% make rate, trending +8.1%. 🏀' }).catch(() => {})
  }
  return (
    <Screen testID="screen-ios-share-results">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24, textAlign: 'center' }}>SHARE RESULTS</Display>
        <Card style={{ padding: 20, marginTop: 16, alignItems: 'center' }}>
          <Wordmark size={24} />
          <Display size={26} style={{ marginTop: 8 }}>JORDAN ELLIS</Display>
          <View style={[S.row, { gap: 22, marginTop: 12 }]}>
            <StatBlock value="82" label="FORM" colorV={color.shotiqOrange} size={32} />
            <StatBlock value="62.5%" label="MAKE %" size={32} />
            <StatBlock value="+8.1%" label="TREND" colorV={color.confirmGreen} size={32} />
          </View>
          <View style={{ alignSelf: 'stretch', marginTop: 14 }}><PhaseStrip /></View>
        </Card>
        <View style={{ marginTop: 16 }}>
          <PrimaryButton title="Share" onPress={share} testID="share-button" />
        </View>
      </View>
    </Screen>
  )
}
