// Home (017-020) and capture/upload (021-035) flows.
import React, { useEffect, useRef, useState } from 'react'
import { View, Pressable, Modal } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import {
  Screen, Display, Body, SectionLabel, PrimaryButton, SecondaryButton, Card,
  TrendLine, PhaseStrip, PhaseGlyph, MediaSurface, StatBlock, ScoreBar, Numeric,
  Wordmark, ListRow, Ring, S,
} from '../components'
import { color } from '../tokens'
import { api, HistoryStats, AnalysisSummary } from '../api'
import { useApp } from '../appState'

function HomeHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <View style={[S.row, { paddingHorizontal: 20, paddingTop: 16 }]}>
      <Wordmark size={28} />
      <View style={{ flex: 1 }} />
      <StatBlock value="6" label="STREAK" size={20} />
      <View style={{ width: 14 }} />
      <StatBlock value="2,840" label="POINTS" size={20} />
      <Pressable accessibilityLabel="Profile menu" onPress={onMenu}
        style={{ marginLeft: 12, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: color.rule,
                       alignItems: 'center', justifyContent: 'center' }}>
          <Body size={12} weight="bold" colorV={color.graphite}>JE</Body>
        </View>
      </Pressable>
    </View>
  )
}

export function HomeScreen() {              // 017/018/019 by state
  const nav = useNavigation<any>()
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [recent, setRecent] = useState<AnalysisSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [menu, setMenu] = useState(false)
  const [pro] = useState(true)

  useEffect(() => {
    let dead = false
    api.history().then((r) => { if (!dead) { setStats(r.stats); setRecent(r.items.slice(0, 3)) } })
      .catch(() => {}).finally(() => { if (!dead) setLoading(false) })
    return () => { dead = true }
  }, [])

  const hasData = (stats?.totalAnalyses ?? 0) > 0
  const score = hasData ? Math.round(stats?.latestScore ?? stats?.averageScore ?? 0) : null

  if (!loading && !hasData) {
    return (                                 // 017 · ios.home-new-player
      <Screen testID="screen-ios-home-new-player">
        <HomeHeader onMenu={() => setMenu(true)} />
        <View style={S.pad}>
          <Display size={40} style={{ marginTop: 24 }}>WELCOME TO SHOTIQ</Display>
          <Body size={15} colorV={color.graphite} style={{ marginTop: 6 }}>
            Run your first analysis to unlock your Shot Room.
          </Body>
          <Card style={{ padding: 20, marginTop: 20 }}>
            <PhaseStrip />
            <Body size={17} weight="semibold" style={{ textAlign: 'center', marginTop: 14 }}>No analyses yet</Body>
            <Body size={13} colorV={color.graphite} style={{ textAlign: 'center', marginTop: 4 }}>
              Capture or upload a shot to see your form score, flaws and elite comparison.
            </Body>
            <View style={{ marginTop: 16 }}>
              <PrimaryButton title="Analyze my first shot" onPress={() => nav.navigate('AnalyzeTab')} />
            </View>
          </Card>
        </View>
        <ProfileMenu visible={menu} onClose={() => setMenu(false)} />
      </Screen>
    )
  }

  if (!pro) {
    return (                                 // 018 · ios.home-standard
      <Screen testID="screen-ios-home-standard">
        <HomeHeader onMenu={() => setMenu(true)} />
        <View style={S.pad}>
          <Display size={42} style={{ marginTop: 22 }}>DASHBOARD</Display>
          <Card style={{ padding: 18, marginTop: 16 }}>
            <SectionLabel>FORM SCORE</SectionLabel>
            <View style={[S.row, { justifyContent: 'space-between' }]}>
              <Numeric size={64} colorV={color.shotiqOrange}>{String(score ?? 0)}</Numeric>
              <TrendLine points={[3, 2.5, 3.6, 3, 4.4]} width={110} height={40} />
            </View>
            <ScoreBar pct={(score ?? 0) / 100} />
          </Card>
        </View>
        <ProfileMenu visible={menu} onClose={() => setMenu(false)} />
      </Screen>
    )
  }

  return (                                   // 019 · ios.home-professional
    <Screen testID="screen-ios-home-professional">
      <HomeHeader onMenu={() => setMenu(true)} />
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 22 }}>TODAY&apos;S SHOT ROOM</Display>
        <Body size={13} colorV={color.graphite}>{new Date().toDateString()}</Body>
        <MediaSurface height={220} style={{ marginTop: 16 }} />
        <View style={{ marginTop: 12 }}><PhaseStrip /></View>
        <View style={[S.row, { gap: 22, marginTop: 18 }]}>
          <StatBlock value={String(score ?? '—')} label="FORM SCORE" colorV={color.shotiqOrange} size={44} />
          <StatBlock value="24" label="SHOTS" size={30} />
          <StatBlock value="15" label="MAKES" size={30} />
          <StatBlock value="62.5%" label="MAKE %" size={30} />
        </View>
        <Card style={{ padding: 16, marginTop: 18 }}>
          <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
          <Body size={17} weight="semibold" style={{ marginTop: 6 }}>Keep elbow stacked through release</Body>
          <View style={[S.row, { marginTop: 10, gap: 12 }]}>
            <View style={{ flex: 1 }}><ScoreBar pct={0.72} colorV={color.confirmGreen} /></View>
            <Numeric size={18}>72%</Numeric>
          </View>
        </Card>
        <View style={{ marginTop: 18 }}>
          <PrimaryButton title="Analyze shot" onPress={() => nav.navigate('AnalyzeTab')} />
        </View>
        {recent.map((a, i) => (
          <ListRow key={i} title={a.title ?? 'Shot analysis'} subtitle={a.shotType ?? 'Catch & Shoot'}
                   onPress={() => nav.navigate('AnalysisResultOverview')} />
        ))}
      </View>
      <ProfileMenu visible={menu} onClose={() => setMenu(false)} />
    </Screen>
  )
}

export function ProfileMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) { // 020
  const nav = useNavigation<any>()
  const { signOut, user } = useApp()
  const go = (route: string) => { onClose(); nav.navigate(route) }
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[S.screen]} testID="screen-ios-profile-menu">
        <View style={[S.row, { padding: 20 }]}>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: color.rule,
                         alignItems: 'center', justifyContent: 'center' }}>
            <Body size={16} weight="bold" colorV={color.graphite}>JE</Body>
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Body size={17} weight="semibold">{user?.displayName ?? 'Jordan Ellis'}</Body>
            <Body size={13} colorV={color.graphite}>{user?.email ?? ''}</Body>
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Close menu"
                     style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Body size={22}>×</Body>
          </Pressable>
        </View>
        <View style={S.pad}>
          <ListRow title="Player card" onPress={() => go('PlayerCard')} />
          <ListRow title="Settings" onPress={() => go('SettingsHub')} />
          <ListRow title="My media" onPress={() => go('MyMedia')} />
          <ListRow title="Share results" onPress={() => go('ShareResults')} />
          <Pressable onPress={() => { onClose(); signOut() }}
                     style={{ minHeight: 44, justifyContent: 'center', paddingVertical: 16 }}>
            <Body size={16} colorV={color.reviewRed}>Sign out</Body>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

/* ------------------------------- capture ------------------------------- */

export function AnalyzeHubScreen() {        // 021
  const nav = useNavigation<any>()
  const rows: [string, string, string][] = [
    ['Upload photo', 'Analyze a single shot frame', 'PhotoUploadSource'],
    ['Upload video', 'Full-motion analysis of a rep', 'VideoUpload'],
    ['Live camera', 'Real-time form feedback', 'LiveCameraSetup'],
    ['Upload queue', 'Manage pending uploads', 'UploadQueue'],
  ]
  return (
    <Screen testID="screen-ios-analyze-hub">
      <View style={S.pad}>
        <Display size={40} style={{ marginTop: 24 }}>UPLOAD &amp; ANALYZE</Display>
        <Body size={15} colorV={color.graphite} style={{ marginTop: 6 }}>
          Add your footage to get AI-powered shooting analysis.
        </Body>
        {rows.map(([t, d, route], i) => (
          <Pressable key={t} onPress={() => nav.navigate(route)} accessibilityRole="button"
            style={{ marginTop: 14, padding: 16, borderRadius: 8, minHeight: 44,
                     borderWidth: i === 0 ? 2 : 1, borderStyle: i === 0 ? 'dashed' : 'solid',
                     borderColor: i === 0 ? color.shotiqOrange : color.rule }}>
            <Body size={16} weight="semibold" colorV={i === 0 ? color.shotiqOrange : color.ink}>{t}</Body>
            <Body size={13} colorV={color.graphite} style={{ marginTop: 3 }}>{d}</Body>
          </Pressable>
        ))}
        <SectionLabel style={{ marginTop: 26 }}>FILMING GUIDE</SectionLabel>
        {['Full body in frame', 'Side angle', 'Neutral background', 'Good lighting'].map((t) => (
          <Body key={t} size={15} style={{ paddingVertical: 9 }}>{t}</Body>
        ))}
      </View>
    </Screen>
  )
}

export function PhotoUploadSourceScreen() { // 022
  const nav = useNavigation<any>()
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] })
    if (!res.canceled) nav.navigate('PhotoReviewCrop', { uri: res.assets[0]?.uri })
  }
  return (
    <Screen testID="screen-ios-photo-upload-source">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 30 }}>ADD A SHOT PHOTO</Display>
        <View style={{ marginTop: 16 }}>
          <ListRow title="Photo library" subtitle="Choose from your photos" onPress={pick} testID="pick-library" />
          <ListRow title="Take photo" subtitle="Capture with the camera" onPress={() => nav.navigate('LiveCameraSetup')} />
          <ListRow title="Browse files" subtitle="Import from Files" onPress={pick} />
        </View>
      </View>
    </Screen>
  )
}

export function PhotoReviewCropScreen() {   // 023
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-photo-review-crop">
      <View style={S.pad}>
        <Display size={36} style={{ marginTop: 22 }}>REVIEW &amp; CROP</Display>
        <MediaSurface height={420} style={{ marginTop: 16 }} />
        <View style={{ marginTop: 18 }}>
          <PrimaryButton title="Use this photo" onPress={() => nav.navigate('UploadQualityCheck')} />
        </View>
      </View>
    </Screen>
  )
}

export function UploadQualityCheckScreen() { // 024
  const nav = useNavigation<any>()
  const checks: [string, string, boolean][] = [
    ['Resolution', '1080p', true], ['Lighting', 'Well lit', true],
    ['Full body visible', 'Feet to head in frame', true], ['Stability', 'Slight blur detected', false],
  ]
  return (
    <Screen testID="screen-ios-upload-quality-check">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 26 }}>QUALITY CHECK</Display>
        {checks.map(([t, d, ok]) => (
          <View key={t} style={[S.row, { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: color.rule }]}>
            <Body size={16} colorV={ok ? color.confirmGreen : color.shotiqOrange}>{ok ? '✓' : '!'}</Body>
            <View style={{ marginLeft: 14 }}>
              <Body size={15} weight="semibold">{t}</Body>
              <Body size={13} colorV={color.graphite}>{d}</Body>
            </View>
          </View>
        ))}
        <View style={{ marginTop: 24 }}>
          <PrimaryButton title="Start analysis" onPress={() => nav.navigate('AnalysisProcessing')} />
        </View>
      </View>
    </Screen>
  )
}

export function UploadQueueScreen() {       // 025
  const items: [string, number, string][] = [
    ['pullup-jumper.mov', 0.62, 'Uploading'], ['spotup-three.mov', 1, 'Complete'], ['transition-pullup.mov', 0, 'Queued'],
  ]
  return (
    <Screen testID="screen-ios-upload-queue">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 26 }}>UPLOAD QUEUE</Display>
        <Body size={14} colorV={color.graphite} style={{ marginTop: 6 }}>
          Uploads resume automatically, even after interruptions.
        </Body>
        {items.map(([name, pct, state]) => (
          <View key={name} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.rule }}>
            <View style={S.row}>
              <Body size={15} weight="semibold" style={{ flex: 1 }}>{name}</Body>
              <Body size={12} weight="bold" colorV={state === 'Complete' ? color.confirmGreen : color.graphite}>{state}</Body>
            </View>
            <View style={{ marginTop: 8 }}>
              <ScoreBar pct={pct} colorV={state === 'Complete' ? color.confirmGreen : color.analysisBlue} />
            </View>
          </View>
        ))}
      </View>
    </Screen>
  )
}

export function VideoUploadScreen() {       // 026
  const nav = useNavigation<any>()
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] })
    if (!res.canceled) nav.navigate('VideoReview')
  }
  return (
    <Screen testID="screen-ios-video-upload">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 26 }}>UPLOAD VIDEO</Display>
        <Body size={14} colorV={color.graphite} style={{ marginTop: 6 }}>MP4, MOV or HEVC · up to 10GB</Body>
        <Pressable onPress={pick} accessibilityRole="button" testID="pick-video"
          style={{ marginTop: 26, height: 200, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed',
                   borderColor: color.shotiqOrange, alignItems: 'center', justifyContent: 'center' }}>
          <Body size={16} weight="semibold">Choose a video</Body>
          <Body size={13} colorV={color.graphite} style={{ marginTop: 4 }}>From your photo library</Body>
        </Pressable>
      </View>
    </Screen>
  )
}

export function VideoReviewScreen() {       // 027
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-video-review">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>REVIEW VIDEO</Display>
        <MediaSurface height={380} style={{ marginTop: 16 }} />
        <SectionLabel style={{ marginTop: 20 }}>TRIM TO ONE REP</SectionLabel>
        <View style={{ marginTop: 10, height: 44, borderRadius: 4, backgroundColor: color.rule }}>
          <View style={{ position: 'absolute', left: '10%', width: '70%', height: 44, borderRadius: 4,
                         borderWidth: 3, borderColor: color.shotiqOrange }} />
        </View>
        <View style={{ marginTop: 24 }}>
          <PrimaryButton title="Analyze this rep" onPress={() => nav.navigate('AnalysisProcessing')} />
        </View>
      </View>
    </Screen>
  )
}

export function LiveCameraSetupScreen() {   // 028
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-live-camera-setup">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 26 }}>LIVE CAMERA SETUP</Display>
        <Body size={15} colorV={color.graphite} style={{ marginTop: 8 }}>
          Position your phone so your full body and the hoop are visible.
        </Body>
        <MediaSurface height={360} style={{ marginTop: 18 }} />
        <View style={{ marginTop: 22 }}>
          <PrimaryButton title="Continue to calibration" onPress={() => nav.navigate('HoopCalibration')} />
        </View>
      </View>
    </Screen>
  )
}

export function HoopCalibrationScreen() {   // 029
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-hoop-calibration">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 26 }}>HOOP CALIBRATION</Display>
        <Body size={15} colorV={color.graphite} style={{ marginTop: 6 }}>Drag the marker onto the rim.</Body>
        <View style={{ marginTop: 16 }}>
          <MediaSurface height={420} />
          <View style={{ position: 'absolute', right: '22%', top: '24%', width: 54, height: 54, borderRadius: 27,
                         borderWidth: 3, borderColor: color.shotiqOrange }} />
        </View>
        <View style={{ marginTop: 22 }}>
          <PrimaryButton title="Lock calibration" onPress={() => nav.navigate('ReadinessCheck')} />
        </View>
      </View>
    </Screen>
  )
}

export function ReadinessCheckScreen() {    // 030
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-readiness-check">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 26 }}>READINESS CHECK</Display>
        {['Full body visible', 'Hoop calibrated', 'Lighting sufficient', 'Phone stable'].map((t) => (
          <View key={t} style={[S.row, { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.rule }]}>
            <Body size={16} colorV={color.confirmGreen}>✓</Body>
            <Body size={16} style={{ marginLeft: 12 }}>{t}</Body>
          </View>
        ))}
        <View style={{ marginTop: 24 }}>
          <PrimaryButton title="I'm ready" bg={color.confirmGreen} onPress={() => nav.navigate('CaptureReady')} />
        </View>
      </View>
    </Screen>
  )
}

export function CaptureReadyScreen() {      // 031
  const nav = useNavigation<any>()
  const [count, setCount] = useState(3)
  useEffect(() => {
    if (count === 0) { nav.navigate('LiveRecording'); return }
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, nav])
  return (
    <Screen testID="screen-ios-capture-ready" scroll={false}>
      <View style={{ flex: 1, backgroundColor: color.media, alignItems: 'center', justifyContent: 'center' }}>
        <Numeric size={120} colorV="#fff">{String(Math.max(count, 1))}</Numeric>
        <Body size={15} weight="bold" colorV="#fff" style={{ letterSpacing: 2 }}>GET SET</Body>
      </View>
    </Screen>
  )
}

export function LiveRecordingScreen() {     // 032
  const nav = useNavigation<any>()
  const [sec, setSec] = useState(0)
  useEffect(() => { const t = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(t) }, [])
  return (
    <Screen testID="screen-ios-live-recording" scroll={false}>
      <View style={{ flex: 1, backgroundColor: color.media }}>
        <View style={[S.row, { padding: 20 }]}>
          <View style={[S.row, { backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, gap: 7 }]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.shotiqOrange }} />
            <Body size={12} weight="bold" colorV="#fff">LIVE</Body>
          </View>
          <View style={{ flex: 1 }} />
          <Numeric size={22} colorV="#fff">{`${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`}</Numeric>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityLabel="Stop recording" onPress={() => nav.navigate('LiveFormFeedback')}
          style={{ alignSelf: 'center', marginBottom: 44, width: 74, height: 74, borderRadius: 37,
                   borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: color.reviewRed }} />
        </Pressable>
      </View>
    </Screen>
  )
}

export function LiveFormFeedbackScreen() {  // 033
  const nav = useNavigation<any>()
  const cues: [string, string, boolean][] = [
    ['Keep elbow stacked', 'GOOD', true], ['Release at apex', 'FOCUS', false], ['Square shoulders', 'GOOD', true],
  ]
  return (
    <Screen testID="screen-ios-live-form-feedback" scroll={false}>
      <View style={{ flex: 1, backgroundColor: color.media, justifyContent: 'flex-end', padding: 16 }}>
        <Card style={{ padding: 16 }}>
          <SectionLabel>LIVE FORM FEEDBACK</SectionLabel>
          {cues.map(([t, s, ok]) => (
            <View key={t} style={[S.row, { marginTop: 10, gap: 10 }]}>
              <TrendLine points={[2, 4, 3, 5, 4]} width={40} height={22}
                         stroke={ok ? color.confirmGreen : color.shotiqOrange} />
              <Body size={14} weight="semibold" style={{ flex: 1 }}>{t}</Body>
              <Body size={10} weight="bold" colorV={ok ? color.confirmGreen : color.analysisBlue}>{s}</Body>
            </View>
          ))}
          <Pressable onPress={() => nav.navigate('ShotDetected')} style={{ minHeight: 44, justifyContent: 'center', marginTop: 8 }}>
            <Body size={13} colorV={color.analysisBlue}>Simulate shot</Body>
          </Pressable>
        </Card>
      </View>
    </Screen>
  )
}

export function ShotDetectedScreen() {      // 034
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-shot-detected" scroll={false}>
      <View style={{ flex: 1, backgroundColor: color.media, alignItems: 'center', justifyContent: 'center' }}>
        <Body size={52} colorV={color.confirmGreen}>✓</Body>
        <Display size={34} style={{ color: '#fff', marginTop: 10 }}>SHOT DETECTED</Display>
        <Body size={14} colorV="rgba(255,255,255,0.8)" style={{ marginTop: 6 }}>Shot 24 · analyzing release…</Body>
        <View style={{ marginTop: 22, width: 260 }}>
          <PrimaryButton title="End session & review" onPress={() => nav.navigate('CaptureReview')} />
        </View>
      </View>
    </Screen>
  )
}

export function CaptureReviewScreen() {     // 035
  const nav = useNavigation<any>()
  return (
    <Screen testID="screen-ios-capture-review">
      <View style={S.pad}>
        <Display size={38} style={{ marginTop: 24 }}>SESSION REVIEW</Display>
        <View style={[S.row, { gap: 24, marginTop: 16 }]}>
          <StatBlock value="24" label="SHOTS" size={34} />
          <StatBlock value="15" label="MAKES" colorV={color.confirmGreen} size={34} />
          <StatBlock value="9" label="MISSES" colorV={color.reviewRed} size={34} />
          <StatBlock value="62.5%" label="MAKE %" size={34} />
        </View>
        <SectionLabel style={{ marginTop: 22 }}>SHOTS</SectionLabel>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <ListRow key={n} title={`Shot ${n}`} subtitle={n % 3 === 0 ? 'Miss' : 'Make'} />
        ))}
        <View style={{ marginVertical: 24 }}>
          <PrimaryButton title="Analyze session" onPress={() => nav.navigate('AnalysisProcessing')} />
        </View>
      </View>
    </Screen>
  )
}
