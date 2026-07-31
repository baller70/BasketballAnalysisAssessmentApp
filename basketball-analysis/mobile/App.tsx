// ShotIQ — canonical white interface, Expo/React Native.
// 72 canonical screens (ios.splash … ios.share-results), tokens shared with
// web and SwiftUI from the sidecar contract.
import React from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import {
  useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from '@expo-google-fonts/inter'
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue'
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald'
import { AppStateProvider, useApp } from './src/appState'
import { OnboardingProvider } from './src/screens/OnboardingFlow'
import { SCREENS } from './src/registry'
import { color, font } from './src/tokens'

const Stack = createNativeStackNavigator()
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: color.paper } }

const AUTH = ['Welcome', 'SignIn', 'CreateAccount', 'VerifyEmail', 'ForgotPassword', 'ResetPassword']
const ONBOARDING = [
  'OnboardingIntro', 'PhysicalProfile', 'ExperienceBodyType', 'ShootingProfile',
  'PlayerBio', 'OnboardingReview', 'CameraPermissionPrimer', 'PhotoLibraryPermission',
  'NotificationPermissionPrimer',
]
const TABS: [string, string][] = [
  ['Home', 'HomeProfessional'], ['Analyze', 'AnalyzeHub'], ['Training', 'TrainingHome'],
  ['Progress', 'AnalyticsCards'], ['Profile', 'Profile'],
]
// every remaining canonical screen is reachable from the main stack
const MAIN = Object.keys(SCREENS).filter(
  (k) => !AUTH.includes(k) && !ONBOARDING.includes(k) && k !== 'Splash')

function TabBar({ active, onTab }: { active: string; onTab: (route: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: color.rule,
                   paddingTop: 10, paddingBottom: 22, backgroundColor: color.paper }}>
      {TABS.map(([label, route]) => (
        <Pressable key={label} onPress={() => onTab(route)} accessibilityLabel={label}
                   style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: active === route ? font.bodyBold : font.body, fontSize: 11,
                         color: active === route ? color.shotiqOrange : color.graphite }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function Root() {
  const { phase, onboardingComplete } = useApp()
  const navRef = React.useRef<any>(null)
  const [activeTab, setActiveTab] = React.useState('HomeProfessional')

  if (phase === 'splash') {
    const Splash = SCREENS.Splash[1]
    return <Splash />
  }

  if (phase === 'welcome') {
    return (
      <NavigationContainer theme={theme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {AUTH.map((name) => (
            <Stack.Screen key={name} name={name} component={SCREENS[name][1]} />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    )
  }

  if (!onboardingComplete) {
    return (
      <OnboardingProvider>
        <NavigationContainer theme={theme}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {ONBOARDING.map((name) => (
              <Stack.Screen key={name} name={name} component={SCREENS[name][1]} />
            ))}
          </Stack.Navigator>
        </NavigationContainer>
      </OnboardingProvider>
    )
  }

  return (
    <NavigationContainer theme={theme} ref={navRef}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            screenListeners={{
              state: (e: any) => {
                const routes = e?.data?.state?.routes ?? []
                const top = routes[routes.length - 1]?.name
                if (top && TABS.some(([, r]) => r === top)) setActiveTab(top)
              },
            }}>
            {MAIN.map((name) => (
              <Stack.Screen key={name} name={name} component={SCREENS[name][1]} />
            ))}
          </Stack.Navigator>
        </View>
        <TabBar active={activeTab} onTab={(route) => navRef.current?.navigate(route)} />
      </View>
    </NavigationContainer>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    BebasNeue_400Regular, Oswald_600SemiBold,
  })
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: color.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.shotiqOrange} />
      </View>
    )
  }
  return (
    <AppStateProvider>
      {/* canonical screens hide the system status bar */}
      <StatusBar hidden />
      <Root />
    </AppStateProvider>
  )
}
