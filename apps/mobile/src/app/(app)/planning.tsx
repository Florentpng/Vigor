import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { WEEKDAYS } from '@vigor/shared/constants'
import { getTodayWeekday } from '@vigor/shared/format'
import { getWeeklyPlan } from '@vigor/shared/queries'

import { Chip, ErrorBox, Loading, Screen, Title } from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useFocusQuery } from '@/lib/use-focus-query'

// Semaine type : la séance prévue pour chaque jour, ou « Repos »
export default function PlanningScreen() {
  const userId = useUserId()
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

      <View className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {WEEKDAYS.map(({ value, label }, index) => {
          const entry = plan.get(value)
          const isToday = value === today

          return (
            <View
              key={value}
              className={`flex-row items-center justify-between gap-3 px-4 py-4 ${
                index > 0 ? 'border-t border-gray-200 dark:border-zinc-800' : ''
              } ${isToday ? 'bg-blue-50 dark:bg-blue-950/40' : ''}`}
            >
              <View className="flex-row items-center gap-2">
                <Text className="w-24 font-medium text-gray-900 dark:text-white">{label}</Text>
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
                <Text className="text-sm text-gray-400 dark:text-zinc-500">Repos</Text>
              )}
            </View>
          )
        })}
      </View>
    </Screen>
  )
}
