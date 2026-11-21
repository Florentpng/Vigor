import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'
import type { ComponentProps } from 'react'
import type { ColorValue } from 'react-native'

import AppHeader from '@/components/app-header'
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
        // En-tête maison : logo, bandeau Spotify, engrenage (voir app-header.tsx)
        header: () => <AppHeader />,
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
      {/* Écran Badges : ouvert depuis le Profil, sans onglet */}
      <Tabs.Screen name="badges" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  )
}
