import Ionicons from '@expo/vector-icons/Ionicons'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { WEEKDAYS } from '@vigor/shared/constants'
import { parseWorkoutTitle } from '@vigor/shared/format'
import { daysByWorkout, getWeeklyPlan, getWorkoutCards, type WorkoutCard } from '@vigor/shared/queries'

import { Button, Card, Chip, ErrorBox, LevelBadge, Loading, Muted, Screen, Title } from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useFocusQuery } from '@/lib/use-focus-query'

const TABS = [
  { key: 'templates', label: 'Séances Vigor' },
  { key: 'mine', label: 'Mes séances' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function WorkoutsScreen() {
  const userId = useUserId()
  // `tab` est passé au retour de la création (« Mes séances »)
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  const [activeTab, setActiveTab] = useState<TabKey>(tab === 'mine' ? 'mine' : 'templates')

  // Bascule d'onglet quand le paramètre change (ajustement pendant le rendu, sans effet)
  const [lastTabParam, setLastTabParam] = useState(tab)
  if (tab !== lastTabParam) {
    setLastTabParam(tab)
    if (tab === 'mine' || tab === 'templates') setActiveTab(tab)
  }

  const { data, loading, refreshing, refresh, error } = useFocusQuery(async () => {
    const [cards, plan] = await Promise.all([getWorkoutCards(supabase), getWeeklyPlan(supabase, userId)])
    return { cards, days: daysByWorkout(plan.data) }
  })

  if (loading) return <Loading />

  const workouts = data?.cards.data ?? []
  const templates = workouts.filter((w) => w.user_id === null)
  const mine = workouts.filter((w) => w.user_id !== null)
  const shown = activeTab === 'mine' ? mine : templates
  const errorMessage = error ?? data?.cards.error

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View className="flex-row items-center justify-between gap-3">
        <Title>Séances</Title>
        <Button label="+ Créer une séance" onPress={() => router.push('/workouts/new')} />
      </View>

      {errorMessage ? <ErrorBox>{errorMessage}</ErrorBox> : null}

      <View className="flex-row border-b border-gray-200 dark:border-zinc-800">
        {TABS.map(({ key, label }) => {
          const active = key === activeTab
          return (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={`-mb-px flex-row items-center gap-2 border-b-2 px-4 py-2.5 ${
                active ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <Text className={`text-sm font-medium ${active ? 'text-blue-600' : 'text-gray-500 dark:text-zinc-400'}`}>
                {label}
              </Text>
              <Text className="text-xs text-gray-400 dark:text-zinc-500">
                {key === 'mine' ? mine.length : templates.length}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {shown.length === 0 ? (
        activeTab === 'mine' ? (
          <Text className="text-sm text-gray-500 dark:text-zinc-400">
            Tu n&apos;as pas encore créé de séance.{' '}
            <Text className="font-medium text-blue-600" onPress={() => router.push('/workouts/new')}>
              Créer ma première séance
            </Text>
          </Text>
        ) : (
          <Muted>Aucune séance Vigor pour l&apos;instant.</Muted>
        )
      ) : (
        <View className="gap-4">
          {shown.map((workout) => (
            <WorkoutItem key={workout.id} workout={workout} days={data?.days.get(workout.id) ?? []} />
          ))}
        </View>
      )}
    </Screen>
  )
}

function WorkoutItem({ workout, days }: { workout: WorkoutCard; days: number[] }) {
  const { title, level } = parseWorkoutTitle(workout.name, workout.user_id)

  return (
    <Card onPress={() => router.push(`/workouts/${workout.id}`)}>
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <Text className="font-display-xb text-2xl uppercase leading-tight text-gray-900 dark:text-white">{title}</Text>
        {level ? <LevelBadge size="sm">{level}</LevelBadge> : null}
      </View>
      {workout.description ? (
        <Text className="mt-1 text-sm text-gray-600 dark:text-zinc-400">{workout.description}</Text>
      ) : null}

      <View className="mt-3 flex-row items-center gap-1.5">
        <Ionicons name="barbell-outline" size={16} color="#64748b" />
        <Text className="text-sm text-gray-500 dark:text-zinc-400">
          {workout.exercise_count} exercice{workout.exercise_count > 1 ? 's' : ''}
        </Text>
      </View>

      {workout.muscles.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {workout.muscles.map((muscle) => (
            <Chip key={muscle}>{muscle}</Chip>
          ))}
        </View>
      ) : null}

      {days.length > 0 ? (
        <Text className="mt-3 text-xs font-medium text-purple-700 dark:text-purple-400">
          {days.map((day) => WEEKDAYS.find((w) => w.value === day)?.label).join(', ')}
        </Text>
      ) : null}
    </Card>
  )
}
