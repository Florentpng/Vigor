import { router, useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

import { WEEKDAYS } from '@vigor/shared/constants'
import { getTodayWeekday } from '@vigor/shared/format'
import { getPlannedWorkoutId, getProfile, getWorkoutCards } from '@vigor/shared/queries'
import { getSessionWorkout } from '@vigor/shared/workouts'

import SessionRunner from '@/components/session-runner'
import { Card, ErrorBox, Loading, Screen, Title } from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useFocusQuery } from '@/lib/use-focus-query'

// Séance du jour (ou choisie à la main) et mode séance
export default function HomeScreen() {
  const userId = useUserId()
  // `workout` : séance choisie pour aujourd'hui (depuis « Faire cette séance maintenant »)
  const { workout: chosenId } = useLocalSearchParams<{ workout?: string }>()

  const today = getTodayWeekday()
  const todayLabel = WEEKDAYS.find((d) => d.value === today)?.label ?? ''

  const { data, loading, refreshing, refresh, error } = useFocusQuery(async () => {
    // Séance choisie à la main, sinon celle du planning
    const workoutId = chosenId ?? (await getPlannedWorkoutId(supabase, userId, today))
    const workout = workoutId ? await getSessionWorkout(supabase, workoutId) : null
    if (workout) {
      return { workout, weightKg: (await getProfile(supabase, userId)).weight_kg, cards: null }
    }
    // Aucune séance prévue : on propose la liste
    return { workout: null, weightKg: null, cards: (await getWorkoutCards(supabase)).data }
  }, chosenId ?? '')

  if (loading) return <Loading />

  if (data?.workout) {
    return (
      <SessionRunner
        workout={data.workout}
        weightKg={data.weightKg}
        heading={chosenId ? `Séance choisie pour ${todayLabel.toLowerCase()}` : `${todayLabel} · séance du jour`}
        showPlannedLink={Boolean(chosenId)}
        onSaved={refresh}
      />
    )
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View>
        <Text className="text-sm font-medium text-blue-600">{todayLabel}</Text>
        <Title
          subtitle={
            <>
              Choisis une séance à faire maintenant, ou associe des jours à tes séances dans le{' '}
              <Text className="font-medium text-blue-600" onPress={() => router.navigate('/planning')}>
                planning
              </Text>
              .
            </>
          }
        >
          Aucune séance prévue aujourd&apos;hui
        </Title>
      </View>

      {error ? <ErrorBox>{error}</ErrorBox> : null}

      <View className="gap-3">
        {(data?.cards ?? []).map((item) => (
          <Card key={item.id} onPress={() => router.setParams({ workout: item.id })}>
            <Text className="font-semibold text-gray-900 dark:text-white">{item.name}</Text>
            {item.description ? (
              <Text className="mt-1 text-sm text-gray-600 dark:text-zinc-400">{item.description}</Text>
            ) : null}
          </Card>
        ))}
      </View>
    </Screen>
  )
}
