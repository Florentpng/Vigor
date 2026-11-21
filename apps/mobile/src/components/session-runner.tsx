import Ionicons from '@expo/vector-icons/Ionicons'
import { randomUUID } from 'expo-crypto'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, Text, TextInput, Vibration, View } from 'react-native'

import { computeCalories } from '@vigor/shared/calories'
import {
  estimateWorkoutSeconds,
  formatDuration,
  formatReps,
  formatRestTime,
  parseWorkoutTitle,
} from '@vigor/shared/format'
import { type ExerciseLoadInfo, formatLoad, getExerciseLoads, lastLoadForSet, type LoggedSet } from '@vigor/shared/loads'
import { saveWorkoutLog } from '@vigor/shared/logs'
import { groupRepsLabel, groupRest, groupSets, groupSupersets } from '@vigor/shared/supersets'
import type { SessionExercise, SessionWorkout } from '@vigor/shared/types'

import ExerciseMedia from '@/components/exercise-media'
import LoadControl from '@/components/load-control'
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
import { useUserId } from '@/lib/auth'
import { badgeImage } from '@/lib/badges'
import { cancelRestNotification, prepareRestNotifications, scheduleRestEnd } from '@/lib/rest-notification'
import { type StoredSession, useStoredSession, writeSession } from '@/lib/session-store'
import { supabase } from '@/lib/supabase'
import { useAccent } from '@/lib/theme'
import { useFocusQuery } from '@/lib/use-focus-query'

// Heure actuelle, lue dans les gestionnaires d'appui (pas pendant l'affichage)
const clock = () => Date.now()

// Séance sans la minuterie de repos
function withoutRest(current: StoredSession): StoredSession {
  const next = { ...current }
  delete next.restEndsAt
  delete next.restSeconds
  return next
}

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
  const userId = useUserId()

  // Charge de travail de chaque exercice et nombre de séances à cette charge
  const { data: loadData, refresh: refreshLoads } = useFocusQuery(
    () => getExerciseLoads(supabase, userId, workout.exercises.map((e) => e.exercise_id)),
    workout.id
  )
  const infos: Record<string, ExerciseLoadInfo> = loadData ?? {}
  // Charge actuelle d'un exercice : celle choisie pendant la séance, sinon la charge de référence
  // Par défaut : la charge de cette même série à la dernière séance (séries en pyramide), sinon la charge de référence
  const currentLoad = (exercise: SessionExercise) =>
    session?.loads[exercise.exercise_id] ??
    lastLoadForSet(infos[exercise.exercise_id], (session?.setIndex ?? 0) + 1) ??
    infos[exercise.exercise_id]?.weight_kg ??
    0

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

  // Un superset est un seul bloc : ses exercices se font ensemble, tour après tour
  const blocks = groupSupersets(workout.exercises)
  const total = blocks.length
  const exerciseCount = workout.exercises.length

  function begin() {
    // Autorisation des notifications (demandée une seule fois) pour être prévenu de la fin des repos
    prepareRestNotifications()
    setNow(Date.now())
    writeSession({
      workoutId: workout.id,
      startedAt: Date.now(),
      index: 0,
      setIndex: 0,
      sessionId: randomUUID(),
      loads: {},
      sets: [],
    })
  }

  function start() {
    // Une autre séance est déjà en cours (ou terminée sans être enregistrée) : on demande avant de la remplacer
    if (stored && stored.workoutId !== workout.id && !stored.logged) {
      Alert.alert(
        'Une séance est déjà en cours',
        stored.endedAt
          ? 'Une autre séance est terminée mais pas enregistrée. La remplacer la supprimera.'
          : 'La remplacer fera perdre son chrono et sa progression.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Remplacer', style: 'destructive', onPress: begin },
        ]
      )
      return
    }
    begin()
  }

  function finish(current: StoredSession) {
    writeSession({ ...withoutRest(current), endedAt: clock() })
  }

  // Série terminée : on la note avec la charge du moment, puis on passe à la suivante (ou à l'exercice suivant) et le repos démarre
  function completeSet() {
    if (!session) return
    const block = blocks[session.index]
    const lastSet = session.setIndex + 1 >= groupSets(block)
    const lastExercise = session.index + 1 >= total
    const sets: LoggedSet[] = [
      ...session.sets,
      ...block.map((e) => ({
        exercise_id: e.exercise_id,
        set_number: session.setIndex + 1,
        reps: e.target_reps,
        weight_kg: currentLoad(e),
      })),
    ]

    if (lastSet && lastExercise) {
      finish({ ...session, sets })
      return
    }

    const next = lastSet
      ? { index: session.index + 1, setIndex: 0 }
      : { index: session.index, setIndex: session.setIndex + 1 }
    const base: StoredSession = { ...withoutRest(session), ...next, sets }

    // Repos une seule fois par tour : après le dernier exercice du bloc
    const rest = groupRest(block)
    const at = clock()
    setNow(at)
    writeSession(rest > 0 ? { ...base, restEndsAt: at + rest * 1000, restSeconds: rest } : base)

    // Notification « Repos terminé », déclenchée par le système même téléphone verrouillé
    if (rest > 0) {
      const nextBlock = blocks[next.index]
      const label = nextBlock.length > 1 ? `${joinNames(nextBlock)} en superset` : nextBlock[0].name
      scheduleRestEnd(rest, `À suivre : ${label} · série ${next.setIndex + 1} sur ${groupSets(nextBlock)}`)
    }
  }

  function endRest() {
    if (!session) return
    cancelRestNotification()
    writeSession(withoutRest(session))
  }

  function jumpToExercise(index: number) {
    if (!session) return
    writeSession({ ...withoutRest(session), index, setIndex: 0 })
  }

  // Surcharge progressive : la nouvelle charge s'applique aux séries suivantes et reste la référence de la prochaine séance
  function setLoad(exercise: SessionExercise, kg: number) {
    if (!session) return
    writeSession({ ...session, loads: { ...session.loads, [exercise.exercise_id]: kg } })
  }

  function confirmDiscard(title: string, message: string, action: string) {
    Alert.alert(title, message, [
      { text: 'Continuer', style: 'cancel' },
      {
        text: action,
        style: 'destructive',
        onPress: () => {
          cancelRestNotification()
          writeSession(null)
        },
      },
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
        sessionId: session.sessionId || undefined,
        sets: session.sets,
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
          setsError: result.setsError,
        },
      })
      // Les séances à cette charge viennent d'augmenter : on recharge le compteur (sinon il reste figé tant qu'on ne quitte pas l'écran)
      refreshLoads()
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

              {session.logged.setsError ? (
                <Text className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Les charges n&apos;ont pas pu être enregistrées : {session.logged.setsError}
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
    const block = blocks[index]
    const exercise = block[0]
    const isSuperset = block.length > 1
    const repsDiffer = new Set(block.map((e) => e.target_reps)).size > 1
    const sets = groupSets(block)
    const restSeconds = groupRest(block)
    const setNumber = Math.min(session.setIndex + 1, sets)
    const isFinalSet = index === total - 1 && setNumber >= sets

    const header = (
      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <View className="shrink">
            <Text className="text-xs text-gray-500 dark:text-zinc-400" numberOfLines={1}>
              {workout.name}
            </Text>
            <Text className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              {isSuperset ? 'Superset' : 'Exercice'} {index + 1} sur {total}
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
          {blocks.map((item, i) => {
            const fill = i < index ? 100 : i === index ? (session.setIndex / groupSets(item)) * 100 : 0
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
              <Text className="text-center font-semibold text-gray-900 dark:text-white">
                {isSuperset ? `${joinNames(block)} en superset` : exercise.name}
              </Text>
              <Text className="text-center text-sm text-gray-600 dark:text-zinc-400">
                série {setNumber} sur {sets}
                {isSuperset ? '' : ` · ${repsText(exercise)}`}
              </Text>
              {isSuperset
                ? block.map((e, i) => (
                    <Text key={i} className="text-center text-sm text-gray-600 dark:text-zinc-400">
                      {e.name} : {repsText(e)}
                    </Text>
                  ))
                : null}
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

        {isSuperset ? (
          <View className={`gap-2.5 px-5 pb-5 pt-2.5 ${glassClass}`}>
            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="link" size={16} color={accent} />
                <Text className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Superset · {block.length} exercices enchaînés
                </Text>
              </View>
            </View>

            <View className="gap-4">
              {block.map((e, i) => (
                <View key={i} className="gap-2 rounded-lg border border-gray-200 p-3 dark:border-zinc-700">
                  <LoadControl
                    setNumber={setNumber}
                    exercise={e}
                    info={infos[e.exercise_id]}
                    value={currentLoad(e)}
                    onChange={(kg) => setLoad(e, kg)}
                    header={
                      <View>
                        <Text className="font-display-xb text-3xl uppercase leading-none text-gray-900 dark:text-white">
                          {e.name}
                        </Text>
                        <Text className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                          {e.muscle_group} · {e.equipment}
                          {repsDiffer ? ` · ${e.target_reps === null ? 'max' : e.target_reps} reps` : ''}
                        </Text>
                      </View>
                    }
                  />

                  {e.description ? (
                    <Text className="text-sm text-gray-600 dark:text-zinc-400">{e.description}</Text>
                  ) : null}

                  <ExecutionToggle exercise={e} />
                </View>
              ))}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 items-center rounded-lg bg-blue-50 py-3">
                <Text className="font-display text-4xl text-blue-700">
                  {setNumber}
                  <Text className="text-xl text-blue-400">/{sets}</Text>
                </Text>
                <Text className="text-xs text-blue-600">série</Text>
              </View>
              <View className="flex-1 items-center rounded-lg bg-gray-50 py-3 dark:bg-zinc-800">
                <Text
                  className="px-1 font-display text-4xl uppercase text-gray-900 dark:text-white"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {groupRepsLabel(block)}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-zinc-400">
                  {block.every((e) => e.target_reps === null) ? 'jusqu’à l’échec' : 'répétitions'}
                </Text>
              </View>
              <View className="flex-1 items-center rounded-lg bg-gray-50 py-3 dark:bg-zinc-800">
                <Text
                  className="px-1 font-display text-4xl text-gray-900 dark:text-white"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {formatRestTime(restSeconds)}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-zinc-400">repos</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className={`gap-4 p-5 ${glassClass}`}>
            <LoadControl
              large
              setNumber={setNumber}
              exercise={exercise}
              info={infos[exercise.exercise_id]}
              value={currentLoad(exercise)}
              onChange={(kg) => setLoad(exercise, kg)}
              header={
                <View>
                  <Text className="font-display-xb text-4xl uppercase leading-none text-gray-900 dark:text-white">
                    {exercise.name}
                  </Text>
                  <Text className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    {exercise.muscle_group} · {exercise.equipment}
                  </Text>
                </View>
              }
            />

            <View className="flex-row gap-3">
              <View className="flex-1 items-center rounded-lg bg-blue-50 py-3">
                <Text className="font-display text-4xl text-blue-700">
                  {setNumber}
                  <Text className="text-xl text-blue-400">/{sets}</Text>
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
                  {formatRestTime(restSeconds)}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-zinc-400">repos</Text>
              </View>
            </View>

            {exercise.description ? (
              <Text className="text-sm text-gray-600 dark:text-zinc-400">{exercise.description}</Text>
            ) : null}

            <ExecutionToggle exercise={exercise} />
          </View>
        )}

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
            <Text className="text-sm text-gray-600 dark:text-zinc-300">
              {isSuperset ? 'Passer ce superset →' : 'Passer cet exercice →'}
            </Text>
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
                {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}
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
          {blocks.map((block, b) => {
            const start = blocks.slice(0, b).reduce((n, g) => n + g.length, 0)
            return block.length === 1 ? (
              <ExerciseRow key={b} exercise={block[0]} position={start + 1} infos={infos} />
            ) : (
              <SupersetGroup key={b} block={block} start={start} infos={infos} />
            )
          })}
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
function ExerciseRow({
  exercise,
  position,
  bare = false,
  group,
  infos,
  followsLabel = false,
}: {
  // Exercice qui suit un autre dans un superset : un peu d'espace en plus pour l'étiquette « SUPERSET » posée sur le trait
  followsLabel?: boolean
  exercise: SessionExercise
  position: number
  // Charge de chaque exercice (affichée en bas à gauche de la carte)
  infos: Record<string, ExerciseLoadInfo>
  // Dans un bloc superset : pas de cadre
  bare?: boolean
  // Premier exercice d'un superset : la pastille et le repos sont ceux du groupe, comme un exercice normal
  group?: SessionExercise[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <View className={bare ? 'overflow-hidden' : `overflow-hidden ${glassClass}`}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className={`flex-row items-start active:bg-gray-100 dark:active:bg-zinc-800 ${bare ? 'min-h-[88px]' : ''}`}
      >
        <ExerciseThumb url={exercise.thumbnail_url} />
        <View className={`shrink flex-1 gap-1 px-2.5 pb-2 ${followsLabel ? 'pt-3.5' : 'pt-2'}`}>
          {/* Nom à gauche, charge à prévoir en haut à droite sur la même ligne */}
          <View className="flex-row items-start justify-between gap-2">
            <Text className="shrink flex-1 text-base font-semibold text-gray-900 dark:text-white">
              {position}. {exercise.name}
            </Text>
            <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
              {loadLabel(exercise, infos[exercise.exercise_id])}
            </Text>
          </View>
          {/* Série et repos sur la même ligne */}
          {group ? (
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1.5">
              <SetsPill sets={groupSets(group)} reps={null} repsLabel={groupRepsLabel(group)} compact />
              <RestLabel seconds={groupRest(group)} compact />
            </View>
          ) : bare ? null : (
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1.5">
              <SetsPill sets={exercise.target_sets} reps={exercise.target_reps} compact />
              <RestLabel seconds={exercise.rest_time} compact />
            </View>
          )}
        </View>
      </Pressable>

      {open ? (
        <DetailsPanel exercise={exercise} info={infos[exercise.exercise_id]} />
      ) : null}
    </View>
  )
}

// Un superset dans l'aperçu : un seul bloc. Les exercices sont au-dessus, puis séries, répétitions et repos une seule fois.
function SupersetGroup({
  block,
  start,
  infos,
}: {
  block: SessionExercise[]
  start: number
  infos: Record<string, ExerciseLoadInfo>
}) {
  return (
    <View className={`overflow-hidden ${glassClass}`}>
      <View className="absolute bottom-0 left-0 top-0 z-10 w-1 bg-blue-600" />
      {/* Le premier exercice porte séries × répétitions et repos ; « SUPERSET » est entre les exercices */}
      <View>
        {block.map((exercise, i) => (
          <View key={i}>
            {i > 0 ? (
              // Simple trait entre les deux exercices, avec une petite étiquette posée dessus
              <View className="h-px bg-gray-200 dark:bg-zinc-800" style={{ zIndex: 10, overflow: 'visible' }}>
                <View className="absolute left-0 right-0 items-center" style={{ top: -9 }} pointerEvents="none">
                  <View className="flex-row items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5">
                    <Ionicons name="link" size={11} color="#ffffff" />
                    <Text className="text-[10px] font-bold uppercase tracking-wide text-white">Superset</Text>
                  </View>
                </View>
              </View>
            ) : null}
            <ExerciseRow
              exercise={exercise}
              position={start + i + 1}
              bare
              group={i === 0 ? block : undefined}
              infos={infos}
              followsLabel={i > 0}
            />
          </View>
        ))}
      </View>
    </View>
  )
}

// Description d'un exercice (aperçu) : en haut à droite, un bouton vidéo ; sans vidéo, la mention « Pas de vidéo »
function DetailsPanel({ exercise, info }: { exercise: SessionExercise; info: ExerciseLoadInfo | undefined }) {
  const accent = useAccent()
  const [showVideo, setShowVideo] = useState(false)
  return (
    <View className="gap-3 border-t border-gray-200 bg-[#f8fafc] px-4 py-4 dark:border-zinc-800 dark:bg-[#0b0f19]">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="shrink flex-1 text-xs text-gray-500 dark:text-zinc-400">
          {exercise.muscle_group} · {exercise.equipment}
        </Text>
        {exercise.video_url ? (
          <Pressable
            onPress={() => setShowVideo((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showVideo }}
            className="-mt-1.5 flex-row items-center gap-1.5 rounded-full border border-blue-600/40 bg-blue-50 px-2.5 py-1 active:opacity-60"
          >
            <Ionicons name="videocam-outline" size={16} color={accent} />
            <Text className="text-xs font-semibold text-blue-700">{showVideo ? 'Masquer la vidéo' : 'Vidéo'}</Text>
          </Pressable>
        ) : (
          <View
            accessibilityRole="button"
            accessibilityLabel="Pas de vidéo"
            accessibilityState={{ disabled: true }}
            className="-mt-1.5 flex-row items-center rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <Ionicons name="videocam-off-outline" size={16} color="#94a3b8" />
          </View>
        )}
      </View>
      <Text className="text-sm text-gray-600 dark:text-zinc-400">
        {exercise.description ?? 'Pas de description pour cet exercice.'}
      </Text>

      {/* Charge de chaque série à la dernière séance */}
      <View>
        {info && info.lastSets.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {info.lastSets.map((set) => (
              <Text
                key={set.set_number}
                className="overflow-hidden rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
              >
                {set.weight_kg > 0 ? formatLoad(set.weight_kg) : exercise.equipment === 'PDC' ? 'PDC' : '-'}
              </Text>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-gray-500 dark:text-zinc-400">Aucune séance enregistrée pour cet exercice.</Text>
        )}
      </View>
      {showVideo && exercise.video_url ? <ExerciseMedia url={exercise.video_url} name={exercise.name} /> : null}
    </View>
  )
}

// Petit bouton qui affiche ou masque l'exécution (image ou vidéo) de l'exercice
function ExecutionToggle({ exercise }: { exercise: SessionExercise }) {
  const accent = useAccent()
  const [open, setOpen] = useState(false)
  if (!exercise.video_url) return null
  return (
    <View className="gap-3">
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-1.5 self-start rounded-full border border-blue-600/40 bg-blue-50 px-3 py-1.5 active:opacity-60"
      >
        <Ionicons name={open ? 'eye-off-outline' : 'play-circle-outline'} size={16} color={accent} />
        <Text className="text-xs font-semibold text-blue-700">{open ? 'Masquer l’exécution' : 'Voir l’exécution'}</Text>
      </Pressable>
      {open ? <ExerciseMedia url={exercise.video_url} name={exercise.name} /> : null}
    </View>
  )
}

// « Pompes, Dips et Curl » : les noms du bloc, séparés par des virgules puis « et »
function joinNames(block: SessionExercise[]): string {
  const names = block.map((e) => e.name)
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`
}

function repsText(exercise: SessionExercise): string {
  return exercise.target_reps === null ? 'max de répétitions (jusqu’à l’échec)' : `${exercise.target_reps} répétitions`
}

// Charge à prévoir : « 40 kg », « PDC » (poids du corps) ou « - » quand il n'y en a pas
function loadLabel(exercise: SessionExercise, info: ExerciseLoadInfo | undefined): string {
  const bodyweight = exercise.equipment === 'PDC'
  const kg = info?.weight_kg ?? null
  if (kg === null || kg <= 0) return bodyweight ? 'PDC' : '-'
  return formatLoad(kg, bodyweight)
}
