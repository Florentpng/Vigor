import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, Text, View } from 'react-native'

import { formatRestTime } from '@vigor/shared/format'
import { deleteMyWorkout } from '@vigor/shared/my-workouts'
import { getWeeklyPlan } from '@vigor/shared/queries'
import { getSessionWorkout } from '@vigor/shared/workouts'

import BackLink from '@/components/back-link'
import DaysPicker from '@/components/days-picker'
import ExerciseMedia from '@/components/exercise-media'
import { Button, Card, ErrorBox, Loading, Muted, Screen, SectionTitle, Title } from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useFocusQuery } from '@/lib/use-focus-query'

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const userId = useUserId()
  const [deleting, setDeleting] = useState(false)

  const { data, loading, refreshing, refresh, error } = useFocusQuery(async () => {
    const [workout, plan] = await Promise.all([getSessionWorkout(supabase, id), getWeeklyPlan(supabase, userId)])
    return { workout, plan: plan.data }
  }, id)

  if (loading) return <Loading />

  const workout = data?.workout
  if (!workout) {
    return (
      <Screen>
        <BackLink label="Retour" fallback="/workouts" />
        {error ? <ErrorBox>{error}</ErrorBox> : <Muted>Cette séance n&apos;existe pas ou plus.</Muted>}
      </Screen>
    )
  }

  const isMine = workout.user_id !== null && workout.user_id === userId
  const plan = data?.plan ?? []
  const initialDays = plan.filter((r) => r.workout_id === id).map((r) => r.weekday)
  const takenBy: Record<number, string> = {}
  for (const row of plan) {
    if (row.workout_id !== id && row.workout_name) takenBy[row.weekday] = row.workout_name
  }

  function confirmDelete() {
    Alert.alert('Supprimer la séance', `Supprimer « ${workout?.name} » ? Son historique est conservé.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          const result = await deleteMyWorkout(supabase, id)
          setDeleting(false)
          if ('error' in result) {
            Alert.alert('Erreur', result.error)
            return
          }
          router.back()
        },
      },
    ])
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View className="gap-4">
        <BackLink label="Retour" fallback="/workouts" />
        <Title subtitle={workout.description ?? undefined}>{workout.name}</Title>
        <Button
          label="Faire cette séance maintenant"
          onPress={() => router.navigate({ pathname: '/', params: { workout: id } })}
        />
        {isMine ? (
          <View className="flex-row gap-3">
            <Button
              label="Modifier"
              variant="secondary"
              className="flex-1"
              onPress={() => router.push({ pathname: '/workouts/[id]/edit', params: { id } })}
            />
            <Button label="Supprimer" variant="danger" className="flex-1" onPress={confirmDelete} pending={deleting} />
          </View>
        ) : null}
      </View>

      {/* Remonté quand le planning change, pour repartir des jours enregistrés */}
      <DaysPicker
        key={`${initialDays.join()}|${Object.entries(takenBy).join()}`}
        workoutId={id}
        initialDays={initialDays}
        takenBy={takenBy}
      />

      <SectionTitle>Exercices ({workout.exercises.length})</SectionTitle>

      {workout.exercises.length === 0 ? (
        <Muted>Cette séance ne contient aucun exercice.</Muted>
      ) : (
        <View className="gap-4">
          {workout.exercises.map((exercise, index) => (
            <Card key={index}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="shrink">
                  <Text className="text-xs font-medium text-gray-400 dark:text-zinc-500">Exercice {index + 1}</Text>
                  <Text className="font-semibold text-gray-900 dark:text-white">{exercise.name}</Text>
                  {exercise.muscle_group ? (
                    <Text className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                      {exercise.muscle_group} · {exercise.equipment}
                    </Text>
                  ) : null}
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-gray-900 dark:text-white">
                    {exercise.target_sets} × {exercise.target_reps}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-zinc-400">
                    Repos {formatRestTime(exercise.rest_time)}
                  </Text>
                </View>
              </View>

              {exercise.description ? (
                <Text className="mt-3 text-sm text-gray-600 dark:text-zinc-400">{exercise.description}</Text>
              ) : null}

              {exercise.video_url ? (
                <View className="mt-3">
                  <ExerciseMedia url={exercise.video_url} name={exercise.name} />
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  )
}
