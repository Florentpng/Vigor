import Ionicons from '@expo/vector-icons/Ionicons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, Text, TextInput, Vibration, View, useColorScheme } from 'react-native'

import { computeCalories } from '@vigor/shared/calories'
import {
  estimateWorkoutSeconds,
  formatDuration,
  formatReps,
  formatRestTime,
  parseWorkoutTitle,
} from '@vigor/shared/format'
import { saveWorkoutLog } from '@vigor/shared/logs'
import type { SessionExercise, SessionWorkout } from '@vigor/shared/types'

import ExerciseMedia from '@/components/exercise-media'
import {
  Button,
  Chip,
  ErrorBox,
  ExerciseThumb,
  glassClass,
  inputClass,
  LevelBadge,
  ProgressBar,
  RestLabel,
  Screen,
  SetsPill,
} from '@/components/ui'
import { badgeImage } from '@/lib/badges'
import { type StoredSession, useStoredSession, writeSession } from '@/lib/session-store'
import { supabase } from '@/lib/supabase'
import { useAccent } from '@/lib/theme'

type Props = {
  workout: SessionWorkout
  heading: string
  showPlannedLink?: boolean
  weightKg: number | null
  // Recharge les données de l'accueil (poids enregistré, par exemple)
  onSaved?: () => void
}

export default function SessionRunner({ workout, heading, showPlannedLink, weightKg, onSaved }: Props) {
  const accent = useAccent()
  const stored = useStoredSession()
  const session = stored && stored.workoutId === workout.id ? stored : null

  const [now, setNow] = useState(() => Date.now())
  const [saving, setSaving] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [saveError, setSaveError] = useState('')
  const running = Boolean(session && !session.endedAt)
  const resting = Boolean(session?.restEndsAt)
  const restDone = Boolean(session?.restEndsAt && now >= session.restEndsAt)

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [running])

  // Vibration à la fin du repos
  useEffect(() => {
    if (restDone) Vibration.vibrate([0, 250, 120, 250])
  }, [restDone])

  const total = workout.exercises.length

  function start() {
    setNow(Date.now())
    writeSession({ workoutId: workout.id, startedAt: Date.now(), index: 0, setIndex: 0 })
  }

  function finish(current: StoredSession) {
    writeSession({
      workoutId: current.workoutId,
      startedAt: current.startedAt,
      index: current.index,
      setIndex: current.setIndex,
      endedAt: Date.now(),
    })
  }

  // Série terminée : on passe à la suivante (ou à l'exercice suivant) et le repos démarre
  function completeSet() {
    if (!session) return
    const exercise = workout.exercises[session.index]
    const lastSet = session.setIndex + 1 >= exercise.target_sets
    const lastExercise = session.index + 1 >= total

    if (lastSet && lastExercise) {
      finish(session)
      return
    }

    const next = lastSet
      ? { index: session.index + 1, setIndex: 0 }
      : { index: session.index, setIndex: session.setIndex + 1 }
    const base = { workoutId: session.workoutId, startedAt: session.startedAt, ...next }

    const at = Date.now()
    setNow(at)
    writeSession(
      exercise.rest_time > 0
        ? { ...base, restEndsAt: at + exercise.rest_time * 1000, restSeconds: exercise.rest_time }
        : base
    )
  }

  function endRest() {
    if (!session) return
    writeSession({
      workoutId: session.workoutId,
      startedAt: session.startedAt,
      index: session.index,
      setIndex: session.setIndex,
    })
  }

  function jumpToExercise(index: number) {
    if (!session) return
    writeSession({ workoutId: session.workoutId, startedAt: session.startedAt, index, setIndex: 0 })
  }

  function confirmDiscard(title: string, message: string, action: string) {
    Alert.alert(title, message, [
      { text: 'Continuer', style: 'cancel' },
      { text: action, style: 'destructive', onPress: () => writeSession(null) },
    ])
  }

  // --- Séance terminée ---
  if (session?.endedAt) {
    const durationMs = session.endedAt - session.startedAt

    async function save() {
      if (!session) return
      setSaveError('')
      const typedWeight = weightKg === null ? Number(weightInput.replace(',', '.')) : undefined
      setSaving(true)
      const result = await saveWorkoutLog(supabase, {
        workoutId: workout.id,
        durationSeconds: Math.round(durationMs / 1000),
        weightKg: typedWeight,
      })
      setSaving(false)

      if ('error' in result) {
        setSaveError(result.error)
        return
      }
      writeSession({
        ...session,
        logged: {
          calories: result.calories,
          minutes: result.minutes,
          badges: result.badges,
          badgesError: result.badgesError,
        },
      })
      onSaved?.()
    }

    return (
      <Screen key="ended">
        <View className={`items-center gap-4 p-6 ${glassClass}`}>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="checkmark" size={18} color="#059669" />
            <Text className="text-sm font-medium text-green-600">
              {session.logged ? 'Séance enregistrée' : 'Séance terminée'}
            </Text>
          </View>
          <Text className="text-center font-display-xb text-4xl uppercase leading-none text-gray-900 dark:text-white">
            {workout.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <Ionicons name="timer-outline" size={36} color={accent} />
            <Text className="font-display text-6xl text-gray-900 dark:text-white">{formatDuration(durationMs)}</Text>
          </View>

          {session.logged ? (
            <>
              <View className="flex-row items-center gap-2">
                <Ionicons name="flame" size={26} color="#ea580c" />
                <Text className="font-display text-3xl text-orange-600">{session.logged.calories}</Text>
                <Text className="text-gray-700 dark:text-zinc-300">kcal brûlées</Text>
              </View>

              {session.logged.badgesError ? (
                <Text className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Les badges n&apos;ont pas pu être calculés : {session.logged.badgesError}
                </Text>
              ) : null}

              {session.logged.badges?.map((badge) => {
                const image = badge.code ? badgeImage(badge.code) : null
                return (
                  <View
                    key={badge.title}
                    className="w-full flex-row items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                  >
                    {image ? <Image source={image} contentFit="contain" style={{ width: 72, height: 72 }} /> : null}
                    <View className="shrink flex-1">
                      <Text className="text-xs font-medium text-amber-700">Nouveau badge débloqué</Text>
                      <Text className="font-semibold text-gray-900">{badge.title}</Text>
                      <Text className="text-sm text-gray-600">{badge.description}</Text>
                    </View>
                  </View>
                )
              })}

              <Button label="Fermer" className="px-8" onPress={() => writeSession(null)} />
            </>
          ) : (
            <>
              {weightKg === null ? (
                <View className="w-full">
                  <Text className="mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Ton poids (kg), pour calculer les calories
                  </Text>
                  <TextInput
                    className={inputClass}
                    value={weightInput}
                    onChangeText={setWeightInput}
                    keyboardType="decimal-pad"
                    placeholder="Ex : 75"
                    placeholderTextColor="#94a3b8"
                    maxLength={6}
                  />
                  <Text className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Il sera retenu dans ton profil.</Text>
                </View>
              ) : null}

              {saveError ? <ErrorBox>{saveError}</ErrorBox> : null}

              <View className="w-full gap-3">
                <Button
                  label="Enregistrer la séance"
                  variant="success"
                  size="lg"
                  onPress={save}
                  pending={saving}
                  disabled={weightKg === null && !weightInput}
                />
                <Pressable
                  onPress={() =>
                    confirmDiscard('Fermer sans enregistrer ?', 'Cette séance sera perdue.', 'Ne pas enregistrer')
                  }
                  className="items-center py-1 active:opacity-60"
                >
                  <Text className="text-sm text-gray-500 dark:text-zinc-400">Ne pas enregistrer</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Screen>
    )
  }

  // --- Séance en cours ---
  if (session) {
    const index = Math.min(Math.max(session.index, 0), total - 1)
    const exercise = workout.exercises[index]
    const setNumber = Math.min(session.setIndex + 1, exercise.target_sets)
    const isFinalSet = index === total - 1 && setNumber >= exercise.target_sets

    const header = (
      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <View className="shrink">
            <Text className="text-xs text-gray-500 dark:text-zinc-400" numberOfLines={1}>
              {workout.name}
            </Text>
            <Text className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Exercice {index + 1} sur {total}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="timer-outline" size={24} color={accent} />
            <Text className="font-display text-4xl text-gray-900 dark:text-white">
              {formatDuration(now - session.startedAt)}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-1.5">
          {workout.exercises.map((item, i) => {
            const fill = i < index ? 100 : i === index ? (session.setIndex / item.target_sets) * 100 : 0
            return (
              <View key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
                <View className="h-full bg-blue-600" style={{ width: `${fill}%` }} />
              </View>
            )
          })}
        </View>
      </View>
    )

    const abandon = (
      <Pressable
        onPress={() => confirmDiscard('Abandonner la séance ?', 'Le chrono sera perdu.', 'Abandonner')}
        className="items-center py-1 active:opacity-60"
      >
        <Text className="text-sm text-gray-500 dark:text-zinc-400">Abandonner la séance</Text>
      </Pressable>
    )

    // Repos entre deux séries
    if (resting && session.restEndsAt) {
      const remainingMs = session.restEndsAt - now
      const seconds = Math.max(0, Math.ceil(remainingMs / 1000))
      const totalMs = (session.restSeconds ?? 1) * 1000
      const progress = ((totalMs - remainingMs) / totalMs) * 100

      return (
        <Screen key="rest">
          {header}

          <View
            className={`items-center gap-4 p-6 ${
              restDone ? 'rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : glassClass
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name={restDone ? 'checkmark' : 'hourglass-outline'}
                size={16}
                color={restDone ? '#15803d' : '#64748b'}
              />
              <Text className={`text-sm font-medium ${restDone ? 'text-green-700' : 'text-gray-500 dark:text-zinc-400'}`}>
                {restDone ? 'Repos terminé' : 'Repos'}
              </Text>
            </View>
            <Text className={`font-display text-8xl ${restDone ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
              {formatDuration(seconds * 1000)}
            </Text>
            <View className="w-full">
              <ProgressBar value={progress} tone={restDone ? 'success' : 'accent'} />
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-600 dark:text-zinc-400">À suivre :</Text>
              <Text className="text-center font-semibold text-gray-900 dark:text-white">{exercise.name}</Text>
              <Text className="text-center text-sm text-gray-600 dark:text-zinc-400">
                série {setNumber} sur {exercise.target_sets} ·{' '}
                {exercise.target_reps === null
                  ? 'max de répétitions (jusqu’à l’échec)'
                  : `${exercise.target_reps} répétitions`}
              </Text>
            </View>
          </View>

          <Button
            label={restDone ? 'C’est reparti !' : 'Passer le repos'}
            variant={restDone ? 'success' : 'primary'}
            size="lg"
            onPress={endRest}
          />

          {abandon}
        </Screen>
      )
    }

    // Série à effectuer
    return (
      <Screen key="set">
        {header}

        <View className={`gap-4 p-5 ${glassClass}`}>
          <View>
            <Text className="font-display-xb text-4xl uppercase leading-none text-gray-900 dark:text-white">
              {exercise.name}
            </Text>
            <Text className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
              {exercise.muscle_group} · {exercise.equipment}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 items-center rounded-lg bg-blue-50 py-3">
              <Text className="font-display text-4xl text-blue-700">
                {setNumber}
                <Text className="text-xl text-blue-400">/{exercise.target_sets}</Text>
              </Text>
              <Text className="text-xs text-blue-600">série</Text>
            </View>
            <View className="flex-1 items-center rounded-lg bg-gray-50 py-3 dark:bg-zinc-800">
              <Text className="font-display text-4xl uppercase text-gray-900 dark:text-white">
                {formatReps(exercise.target_reps)}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-zinc-400">
                {exercise.target_reps === null ? 'jusqu’à l’échec' : 'répétitions'}
              </Text>
            </View>
            <View className="flex-1 items-center rounded-lg bg-gray-50 py-3 dark:bg-zinc-800">
              {/* « 1 min 30 s » reste sur une seule ligne : le texte rétrécit au besoin */}
              <Text
                className="px-1 font-display text-4xl text-gray-900 dark:text-white"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {formatRestTime(exercise.rest_time)}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-zinc-400">repos</Text>
            </View>
          </View>

          {exercise.description ? (
            <Text className="text-sm text-gray-600 dark:text-zinc-400">{exercise.description}</Text>
          ) : null}

          {exercise.video_url ? <ExerciseMedia url={exercise.video_url} name={exercise.name} /> : null}
        </View>

        <Button
          label={isFinalSet ? 'Dernière série · Finir la séance' : 'Série terminée'}
          variant={isFinalSet ? 'success' : 'primary'}
          size="lg"
          onPress={completeSet}
        />

        <View className="flex-row justify-between">
          <Pressable
            onPress={() => jumpToExercise(index - 1)}
            disabled={index === 0}
            className="py-1 disabled:opacity-30 active:opacity-60"
          >
            <Text className="text-sm text-gray-600 dark:text-zinc-300">← Exercice précédent</Text>
          </Pressable>
          <Pressable
            onPress={() => jumpToExercise(index + 1)}
            disabled={index === total - 1}
            className="py-1 disabled:opacity-30 active:opacity-60"
          >
            <Text className="text-sm text-gray-600 dark:text-zinc-300">Passer cet exercice →</Text>
          </Pressable>
        </View>

        {abandon}
      </Screen>
    )
  }

  // --- Aperçu avant de commencer ---
  const { title, level } = parseWorkoutTitle(workout.name, workout.user_id)
  const estimatedSeconds = estimateWorkoutSeconds(workout.exercises)
  const muscles = [...new Set(workout.exercises.map((e) => e.muscle_group).filter(Boolean))]

  return (
    <Screen key="preview">
      <View>
        <Text className="text-sm font-medium text-blue-600">{heading}</Text>
        <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Text className="font-display-xb text-5xl uppercase leading-none text-gray-900 dark:text-white">{title}</Text>
          {level ? <LevelBadge>{level}</LevelBadge> : null}
        </View>

        {total > 0 ? (
          <View className="mt-3 flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="timer-outline" size={20} color={accent} />
              <Text className="text-sm text-gray-600 dark:text-zinc-400">
                ~{Math.max(1, Math.round(estimatedSeconds / 60))} min
              </Text>
            </View>
            {weightKg !== null ? (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="flame" size={26} color="#ea580c" />
                <Text className="text-sm text-gray-600 dark:text-zinc-400">
                  ~{computeCalories(weightKg, estimatedSeconds)} kcal
                </Text>
              </View>
            ) : null}
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="barbell-outline" size={20} color="#64748b" />
              <Text className="text-sm text-gray-600 dark:text-zinc-400">
                {total} exercice{total > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        ) : null}

        {muscles.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            {muscles.map((muscle) => (
              <Chip key={muscle}>{muscle}</Chip>
            ))}
          </View>
        ) : null}

        {workout.description ? (
          <Text className="mt-3 text-gray-600 dark:text-zinc-400">{workout.description}</Text>
        ) : null}
      </View>

      {total === 0 ? (
        <Text className="text-sm text-gray-500 dark:text-zinc-400">Cette séance ne contient aucun exercice.</Text>
      ) : (
        <View className="gap-3">
          {workout.exercises.map((exercise, i) => (
            <ExerciseRow key={i} exercise={exercise} position={i + 1} />
          ))}
        </View>
      )}

      <Button label="Commencer la séance" size="lg" onPress={start} disabled={total === 0} />

      <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-2">
        <Text className="text-sm text-blue-600" onPress={() => router.navigate('/workouts')}>
          Choisir une autre séance
        </Text>
        {showPlannedLink ? (
          <Text className="text-sm text-blue-600" onPress={() => router.setParams({ workout: undefined })}>
            Revenir à la séance prévue
          </Text>
        ) : null}
      </View>
    </Screen>
  )
}

// Carte d'un exercice de l'aperçu : vignette, nom, séries ; un appui déplie la description et le média
function ExerciseRow({ exercise, position }: { exercise: SessionExercise; position: number }) {
  const [open, setOpen] = useState(false)
  const dark = useColorScheme() === 'dark'

  return (
    <View className={`overflow-hidden ${glassClass}`}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center active:bg-gray-100 dark:active:bg-zinc-800"
      >
        <ExerciseThumb url={exercise.thumbnail_url} />
        <View className="shrink flex-1 gap-1.5 px-3 py-4">
          <Text className="text-base font-semibold text-gray-900 dark:text-white">
            {String(position).padStart(2, '0')}. {exercise.name}
          </Text>
          <SetsPill sets={exercise.target_sets} reps={exercise.target_reps} />
          <RestLabel seconds={exercise.rest_time} />
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={dark ? '#8b9bb0' : '#94a3b8'}
          style={{ marginRight: 14 }}
        />
      </Pressable>

      {open ? (
        <View className="gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <Text className="text-xs text-gray-500 dark:text-zinc-400">
            {exercise.muscle_group} · {exercise.equipment}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-zinc-400">
            {exercise.description ?? 'Pas de description pour cet exercice.'}
          </Text>
          {exercise.video_url ? <ExerciseMedia url={exercise.video_url} name={exercise.name} /> : null}
        </View>
      ) : null}
    </View>
  )
}
