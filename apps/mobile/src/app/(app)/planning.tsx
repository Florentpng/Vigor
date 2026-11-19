import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { WEEKDAYS } from '@vigor/shared/constants'
import { getTodayWeekday } from '@vigor/shared/format'
import { getWeeklyPlan } from '@vigor/shared/queries'

import { Chip, ErrorBox, glassClass, Loading, Screen, Title } from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useAccent } from '@/lib/theme'
import { useFocusQuery } from '@/lib/use-focus-query'

// Semaine type : la séance prévue pour chaque jour, ou « Repos »
export default function PlanningScreen() {
  const userId = useUserId()
  const accent = useAccent()
  const { data, loading, refreshing, refresh, error } = useFocusQuery(() => getWeeklyPlan(supabase, userId))

  if (loading) return <Loading />

  const plan = new Map((data?.data ?? []).map((row) => [row.weekday, row]))
  const today = getTodayWeekday()
  const errorMessage = error ?? data?.error

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Title
        subtitle={
          <>
            Ta semaine type. Pour changer un jour, ouvre une séance depuis{' '}
            <Text className="font-medium text-blue-600" onPress={() => router.navigate('/workouts')}>
              Séances
            </Text>
            .
          </>
        }
      >
        Planning
      </Title>

      {errorMessage ? <ErrorBox>{errorMessage}</ErrorBox> : null}

      <View className="gap-3">
        {WEEKDAYS.map(({ value, label }) => {
          const entry = plan.get(value)
          const isToday = value === today

          return (
            <View
              key={value}
              className={`flex-row items-center justify-between gap-3 px-4 py-4 ${glassClass} ${
                isToday ? 'border-blue-600' : ''
              }`}
              style={isToday ? { shadowColor: accent, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } } : undefined}
            >
              <View className="flex-row items-center gap-2">
                <Text className="w-24 font-display text-2xl uppercase text-gray-900 dark:text-white">{label}</Text>
                {isToday ? <Chip color="accent">Aujourd&apos;hui</Chip> : null}
              </View>

              {entry?.workout_name ? (
                <Pressable
                  onPress={() => router.push(`/workouts/${entry.workout_id}`)}
                  className="shrink items-end active:opacity-60"
                >
                  <Text className="text-right text-sm font-medium text-blue-600" numberOfLines={2}>
                    {entry.workout_name}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-zinc-400">{entry.exercise_count} exercices</Text>
                </Pressable>
              ) : (
                <Text className="text-sm text-gray-500 dark:text-zinc-400">Repos</Text>
              )}
            </View>
          )
        })}
      </View>
    </Screen>
  )
}
