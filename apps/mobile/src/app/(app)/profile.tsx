import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { useSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getThemePreference, setThemePreference, type ThemePreference } from '@/lib/theme'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Système' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
]

// Profil provisoire : poids, historique et badges arrivent à l'étape 8.
export default function ProfileScreen() {
  const { session } = useSession()
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference)

  function chooseTheme(value: ThemePreference) {
    setTheme(value)
    setThemePreference(value)
  }

  return (
    <ScrollView className="bg-gray-50 dark:bg-zinc-950" contentContainerClassName="gap-4 p-4">
      <View className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Text className="text-xs text-gray-500 dark:text-zinc-400">Connecté en tant que</Text>
        <Text className="mt-1 text-base font-medium text-gray-900 dark:text-white">{session?.user.email}</Text>
      </View>

      <View className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Text className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Thème</Text>
        <View className="flex-row rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
          {THEME_OPTIONS.map(({ value, label }) => {
            const active = theme === value
            return (
              <Pressable
                key={value}
                onPress={() => chooseTheme(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`flex-1 items-center rounded-md py-2 ${active ? 'bg-white dark:bg-zinc-700' : ''}`}
              >
                <Text
                  className={`text-sm font-medium ${
                    active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <Pressable
        onPress={() => supabase.auth.signOut()}
        className="items-center rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-100 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
      >
        <Text className="text-base font-medium text-red-600">Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  )
}
