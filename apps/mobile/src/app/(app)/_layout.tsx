import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'
import type { ComponentProps } from 'react'
import type { ColorValue } from 'react-native'

import HeaderLogo from '@/components/header-logo'
import SettingsButton from '@/components/settings-button'
import { useAccent } from '@/lib/theme'

type IconName = ComponentProps<typeof Ionicons>['name']

// Icône pleine pour l'onglet actif, contour sinon
function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} color={color as string} size={size} />
  }
  return TabIcon
}

export default function AppLayout() {
  const accent = useAccent()

  return (
    <Tabs
      screenOptions={{
        headerTitle: () => <HeaderLogo />,
        headerTitleAlign: 'left',
        headerRight: () => <SettingsButton />,
        tabBarActiveTintColor: accent,
        // Fond transparent : la photo du fond reste visible derrière les écrans
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen
        name="workouts"
        options={{ title: 'Séances', tabBarIcon: tabIcon('barbell', 'barbell-outline') }}
      />
      <Tabs.Screen
        name="planning"
        options={{ title: 'Planning', tabBarIcon: tabIcon('calendar', 'calendar-outline') }}
      />
      <Tabs.Screen
        name="suivi"
        options={{ title: 'Suivi', tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  )
}
