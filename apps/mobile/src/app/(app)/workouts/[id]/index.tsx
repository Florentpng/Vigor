import Ionicons from '@expo/vector-icons/Ionicons'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, Text, View } from 'react-native'

import { parseWorkoutTitle } from '@vigor/shared/format'
import { deleteMyWorkout } from '@vigor/shared/my-workouts'
import { getWeeklyPlan } from '@vigor/shared/queries'
import { groupRepsLabel, groupRest, groupSets, groupSupersets } from '@vigor/shared/supersets'
import type { SessionExercise } from '@vigor/shared/types'
import { getSessionWorkout } from '@vigor/shared/workouts'

import BackLink from '@/components/back-link'
import DaysPicker from '@/components/days-picker'
import ExerciseMedia from '@/components/exercise-media'
import {
  Button,
  ErrorBox,
  glassClass,
  LevelBadge,
  Loading,
  Muted,
  RestLabel,
  Screen,
  SectionTitle,
  SetsPill,
} from '@/components/ui'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useFocusQuery } from '@/lib/use-focus-query'

// Carte d'un exercice : « 01. Nom » à gauche, séries × répétitions et repos à droite ; dans un superset (`bare`), pas de cadre
function ExerciseCard({
  exercise,
  position,
  bare,
  group,
}: {
  exercise: SessionExercise
  position: number
  bare: boolean
  // Premier exercice d'un superset : la pastille et le repos sont ceux du groupe
  group?: SessionExercise[]
}) {
  return (
    <View className={bare ? undefined : glassClass}>
      <View className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="shrink flex-1">
            <Text className="font-display text-2xl text-gray-900 dark:text-white">
              {String(position).padStart(2, '0')}. {exercise.name}
            </Text>
            {exercise.muscle_group ? (
              <Text className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                {exercise.muscle_group} · {exercise.equipment}
              </Text>
            ) : null}
          </View>

          {group ? (
            <View className="items-center gap-1.5">
              <SetsPill sets={groupSets(group)} reps={null} repsLabel={groupRepsLabel(group)} compact />
              <RestLabel seconds={groupRest(group)} compact />
            </View>
          ) : bare ? null : (
            <View className="items-center gap-1.5">
              <SetsPill sets={exercise.target_sets} reps={exercise.target_reps} compact />
              <RestLabel seconds={exercise.rest_time} compact />
            </View>
          )}
        </View>

        {exercise.description ? (
          <Text className="mt-1.5 text-sm text-gray-600 dark:text-zinc-400">{exercise.description}</Text>
        ) : null}

        {exercise.video_url ? (
          <View className="mt-3">
            <ExerciseMedia url={exercise.video_url} name={exercise.name} />
          </View>
        ) : null}
      </View>
    </View>
  )
}

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

  const { title, level } = parseWorkoutTitle(workout.name, workout.user_id)
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
        <View>
          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <Text className="font-display-xb text-4xl uppercase leading-none text-gray-900 dark:text-white">{title}</Text>
            {level ? <LevelBadge>{level}</LevelBadge> : null}
          </View>
          {workout.description ? (
            <Text className="mt-3 text-gray-600 dark:text-zinc-400">{workout.description}</Text>
          ) : null}
        </View>
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
          {groupSupersets(workout.exercises).map((block, b, blocks) => {
            const start = blocks.slice(0, b).reduce((n, g) => n + g.length, 0)
            if (block.length === 1) {
              return <ExerciseCard key={b} exercise={block[0]} position={start + 1} bare={false} />
            }

            // Superset : un seul bloc, barre orange à gauche, et entre les exercices un trait avec une étiquette
            return (
              <View key={b} className={`overflow-hidden ${glassClass}`}>
                <View className="absolute bottom-0 left-0 top-0 z-10 w-1 bg-blue-600" />
                {block.map((exercise, i) => (
                  <View key={i}>
                    {i > 0 ? (
                      <View className="h-px bg-gray-200 dark:bg-zinc-800" style={{ zIndex: 10, overflow: 'visible' }}>
                        <View className="absolute left-0 right-0 items-center" style={{ top: -9 }} pointerEvents="none">
                          <View className="flex-row items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5">
                            <Ionicons name="link" size={11} color="#ffffff" />
                            <Text className="text-[10px] font-bold uppercase tracking-wide text-white">Superset</Text>
                          </View>
                        </View>
                      </View>
                    ) : null}
                    <ExerciseCard
                      exercise={exercise}
                      position={start + i + 1}
                      bare
                      group={i === 0 ? block : undefined}
                    />
                  </View>
                ))}
              </View>
            )
          })}
        </View>
      )}
    </Screen>
  )
}
