'use client'

import { Fragment, useEffect, useMemo, useState, useSyncExternalStore, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { badgeImageSrc } from '@/lib/badges'
import { Button } from '@/components/ui/button'
import {
  CheckIcon,
  DumbbellIcon,
  FlameIcon,
  HourglassIcon,
  LinkIcon,
  TimerIcon,
  VideoIcon,
  VideoOffIcon,
} from '@/components/ui/icons'
import { Input, Label } from '@/components/ui/input'
import { LevelBadge } from '@/components/ui/level-badge'
import { Pill } from '@/components/ui/pill'
import { ProgressBar } from '@/components/ui/progress-bar'
import { RestLabel, SetsPill } from '@/components/ui/sets-pill'
import { computeCalories } from '@vigor/shared/calories'
import {
  estimateWorkoutSeconds,
  formatDuration,
  formatReps,
  formatRestTime,
  parseWorkoutTitle,
} from '@vigor/shared/format'
import { groupRepsLabel, groupRest, groupSets, groupSupersets } from '@vigor/shared/supersets'
import type { SessionExercise, SessionWorkout } from '@vigor/shared/types'
import { saveWorkoutLog } from './actions'

type StoredSession = {
  workoutId: string
  startedAt: number
  index: number // exercice en cours
  setIndex: number // série en cours dans cet exercice (0 = première)
  restEndsAt?: number // présent pendant un repos
  restSeconds?: number // durée totale du repos en cours
  endedAt?: number
  // présent une fois la séance enregistrée
  logged?: {
    calories: number
    minutes: number
    badges?: { code?: string; title: string; description: string }[]
    badgesError?: string
  }
}

const KEY = 'vigor-session'
const EVENT = 'vigor-session-change'

// La séance en cours est gardée dans le navigateur : un rechargement ne perd ni le chrono ni la progression.
let fallback: string | null = null

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(EVENT, callback)
  }
}

function getSnapshot(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return fallback
  }
}

function getServerSnapshot(): string | null {
  return null
}

function writeSession(session: StoredSession | null) {
  const value = session ? JSON.stringify(session) : null
  fallback = value
  try {
    if (value) localStorage.setItem(KEY, value)
    else localStorage.removeItem(KEY)
  } catch {
    // stockage indisponible : on garde la valeur en mémoire
  }
  window.dispatchEvent(new Event(EVENT))
}

function parseSession(raw: string | null): StoredSession | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    if (
      typeof value?.workoutId !== 'string' ||
      typeof value?.startedAt !== 'number' ||
      typeof value?.index !== 'number'
    ) {
      return null
    }
    return { ...value, setIndex: typeof value.setIndex === 'number' ? value.setIndex : 0 }
  } catch {
    return null
  }
}

// Description d'un exercice (aperçu) : en haut à droite, un bouton vidéo ; sans vidéo, la mention « Pas de vidéo »
function DetailsPanel({ exercise }: { exercise: SessionExercise }) {
  const [showVideo, setShowVideo] = useState(false)
  return (
    <div className="bg-gray-50 border-t px-4 py-4 space-y-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-gray-500">
          {exercise.muscle_group} · {exercise.equipment}
        </p>
        {exercise.video_url ? (
          <button
            type="button"
            onClick={() => setShowVideo((value) => !value)}
            aria-expanded={showVideo}
            className="-mt-1.5 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-blue-600/40 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <VideoIcon className="h-4 w-4" />
            {showVideo ? 'Masquer la vidéo' : 'Vidéo'}
          </button>
        ) : (
          <button
            type="button"
            disabled
            aria-label="Pas de vidéo"
            title="Pas de vidéo"
            className="-mt-1.5 inline-flex shrink-0 cursor-not-allowed items-center rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-gray-400"
          >
            <VideoOffIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      {exercise.description ? (
        <p className="text-gray-600">{exercise.description}</p>
      ) : (
        <p className="text-gray-500">Pas de description pour cet exercice.</p>
      )}
      {showVideo && <ExerciseMedia exercise={exercise} />}
    </div>
  )
}

// Petit bouton qui affiche ou masque l'exécution (image ou vidéo) de l'exercice
function ExecutionToggle({ exercise }: { exercise: SessionExercise }) {
  const [open, setOpen] = useState(false)
  if (!exercise.video_url) return null
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-blue-600/40 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-4 w-4"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.5v7l6-3.5z" />
        </svg>
        {open ? 'Masquer l’exécution' : 'Voir l’exécution'}
      </button>
      {open && <ExerciseMedia exercise={exercise} />}
    </div>
  )
}

// Heure actuelle, lue dans les gestionnaires de clic (pas pendant l'affichage)
const clock = () => Date.now()

function ExerciseMedia({ exercise }: { exercise: SessionExercise }) {
  if (!exercise.video_url) return null

  if (exercise.video_url.toLowerCase().endsWith('.gif')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={exercise.video_url} alt={exercise.name} className="max-h-64 rounded-lg border" />
    )
  }

  return (
    <video
      src={exercise.video_url}
      controls
      muted
      playsInline
      className="max-h-64 rounded-lg border"
    />
  )
}

// Vignette de l'exercice, à gauche de son nom. Tant que l'admin n'en a pas envoyé, un emplacement
// neutre garde les lignes alignées.
function ExerciseThumb({ exercise }: { exercise: SessionExercise }) {
  // Panneau collé au bord gauche de la carte, sur toute sa hauteur. L'image est en position
  // absolue : elle remplit le panneau sans agrandir la ligne (les bords peuvent être rognés).
  const panel = 'relative w-20 sm:w-[6.5rem] shrink-0 self-stretch overflow-hidden bg-gray-100'

  if (exercise.thumbnail_url) {
    return (
      <span className={panel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={exercise.thumbnail_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </span>
    )
  }

  return (
    <span className={`${panel} flex items-center justify-center text-gray-400`} aria-hidden="true">
      <DumbbellIcon className="h-6 w-6" />
    </span>
  )
}

type Props = {
  workout: SessionWorkout
  heading: string
  showPlannedLink?: boolean
  weightKg: number | null
}

export default function SessionRunner({ workout, heading, showPlannedLink, weightKg }: Props) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const stored = useMemo(() => parseSession(raw), [raw])
  const session = stored && stored.workoutId === workout.id ? stored : null

  const [now, setNow] = useState(() => Date.now())
  const [saving, startSaving] = useTransition()
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

  // Vibration à la fin du repos (si l'appareil le permet)
  useEffect(() => {
    if (restDone && 'vibrate' in navigator) navigator.vibrate([250, 120, 250])
  }, [restDone])

  // Un superset est un seul bloc : ses exercices se font ensemble, tour après tour
  const blocks = groupSupersets(workout.exercises)
  const total = blocks.length
  const exerciseCount = workout.exercises.length

  const start = () => {
    // Une autre séance est déjà en cours (ou terminée sans être enregistrée) : on demande avant de la remplacer
    if (stored && stored.workoutId !== workout.id && !stored.logged) {
      const message = stored.endedAt
        ? 'Une autre séance est terminée mais pas enregistrée. La remplacer la supprimera. Continuer ?'
        : 'Une autre séance est déjà en cours. La remplacer fera perdre son chrono et sa progression. Continuer ?'
      if (!confirm(message)) return
    }
    setNow(Date.now())
    writeSession({ workoutId: workout.id, startedAt: Date.now(), index: 0, setIndex: 0 })
  }

  const finish = (current: StoredSession) => {
    writeSession({ workoutId: current.workoutId, startedAt: current.startedAt, index: current.index, setIndex: current.setIndex, endedAt: clock() })
  }

  // Série terminée : on passe à la suivante (ou à l'exercice suivant) et le repos démarre
  const completeSet = () => {
    if (!session) return
    const block = blocks[session.index]
    const lastSet = session.setIndex + 1 >= groupSets(block)
    const lastExercise = session.index + 1 >= total

    if (lastSet && lastExercise) {
      finish(session)
      return
    }

    const next = lastSet
      ? { index: session.index + 1, setIndex: 0 }
      : { index: session.index, setIndex: session.setIndex + 1 }
    const base = {
      workoutId: session.workoutId,
      startedAt: session.startedAt,
      ...next,
    }

    // Repos une seule fois par tour : après le dernier exercice du bloc
    const rest = groupRest(block)
    const at = clock()
    setNow(at)
    writeSession(rest > 0 ? { ...base, restEndsAt: at + rest * 1000, restSeconds: rest } : base)
  }

  const endRest = () => {
    if (!session) return
    writeSession({
      workoutId: session.workoutId,
      startedAt: session.startedAt,
      index: session.index,
      setIndex: session.setIndex,
    })
  }

  const jumpToExercise = (index: number) => {
    if (!session) return
    writeSession({ workoutId: session.workoutId, startedAt: session.startedAt, index, setIndex: 0 })
  }

  // --- Séance terminée ---
  if (session?.endedAt) {
    const ended = session.endedAt
    const durationMs = ended - session.startedAt

    const save = () => {
      setSaveError('')
      const typedWeight = weightKg === null ? Number(weightInput.replace(',', '.')) : undefined

      startSaving(async () => {
        const result = await saveWorkoutLog({
          workoutId: workout.id,
          durationSeconds: Math.round(durationMs / 1000),
          weightKg: typedWeight,
        })
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
      })
    }

    return (
      <div className="bg-white border rounded-xl p-6 shadow-sm text-center space-y-4">
        <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-green-600">
          <CheckIcon className="h-4 w-4" />
          {session.logged ? 'Séance enregistrée' : 'Séance terminée'}
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900">{workout.name}</h1>
        <p className="flex items-center justify-center gap-2 font-display text-6xl font-bold tabular-nums text-gray-900">
          <TimerIcon className="h-9 w-9 text-blue-600" />
          {formatDuration(durationMs)}
        </p>

        {session.logged ? (
          <>
            <p className="flex items-center justify-center gap-2 text-gray-700">
              <FlameIcon className="h-6 w-6 text-orange-600" />
              <span className="font-display text-3xl font-bold text-orange-600">
                {session.logged.calories}
              </span>
              kcal brûlées
            </p>

            {session.logged.badgesError && (
              <p className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm text-left">
                Les badges n&apos;ont pas pu être calculés : {session.logged.badgesError}
              </p>
            )}

            {session.logged.badges && session.logged.badges.length > 0 && (
              <div className="space-y-2 text-left">
                {session.logged.badges.map((badge) => {
                  const image = badge.code ? badgeImageSrc(badge.code) : null

                  return (
                    <div
                      key={badge.title}
                      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                    >
                      {image && (
                        <Image
                          src={image}
                          alt=""
                          width={96}
                          height={96}
                          className="h-20 w-20 shrink-0 object-contain"
                        />
                      )}
                      <div>
                        <p className="text-xs font-medium text-amber-700">Nouveau badge débloqué</p>
                        <p className="font-semibold text-gray-900">{badge.title}</p>
                        <p className="text-sm text-gray-600">{badge.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Button onClick={() => writeSession(null)} className="px-5 py-2.5">
              Fermer
            </Button>
          </>
        ) : (
          <>
            {weightKg === null && (
              <div className="text-left">
                <Label htmlFor="weight">Ton poids (kg), pour calculer les calories</Label>
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  min={20}
                  max={400}
                  step="1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="Ex : 75"
                />
                <p className="mt-1 text-xs text-gray-500">Il sera retenu dans ton profil.</p>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{saveError}</div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                variant="success"
                size="lg"
                onClick={save}
                disabled={saving || (weightKg === null && !weightInput)}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
              </Button>
              <button
                onClick={() => {
                  if (confirm('Fermer sans enregistrer ? Cette séance sera perdue.')) writeSession(null)
                }}
                className="text-sm text-gray-500 hover:text-red-600 cursor-pointer"
              >
                Ne pas enregistrer
              </button>
            </div>
          </>
        )}
      </div>
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
      <>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{workout.name}</p>
            <p className="text-sm font-medium text-gray-700">
              {isSuperset ? 'Superset' : 'Exercice'} {index + 1} sur {total}
            </p>
          </div>
          <p className="flex items-center gap-2 font-display text-4xl font-bold tabular-nums text-gray-900">
            <TimerIcon className="h-6 w-6 text-blue-600" />
            {formatDuration(now - session.startedAt)}
          </p>
        </div>

        <div className="flex gap-1.5" aria-hidden="true">
          {blocks.map((item, i) => {
            const fill =
              i < index ? 100 : i === index ? (session.setIndex / groupSets(item)) * 100 : 0

            return (
              <span key={i} className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
                <span className="block h-full bg-blue-600" style={{ width: `${fill}%` }} />
              </span>
            )
          })}
        </div>
      </>
    )

    const abandon = (
      <button
        onClick={() => {
          if (confirm('Abandonner la séance en cours ? Le chrono sera perdu.')) writeSession(null)
        }}
        className="block mx-auto text-sm text-gray-500 hover:text-red-600 cursor-pointer"
      >
        Abandonner la séance
      </button>
    )

    // Repos entre deux séries
    if (resting && session.restEndsAt) {
      const remainingMs = session.restEndsAt - now
      const seconds = Math.max(0, Math.ceil(remainingMs / 1000))
      const totalMs = (session.restSeconds ?? 1) * 1000
      const progress = Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100))

      return (
        <div className="space-y-4">
          {header}

          <div
            className={`rounded-xl border p-6 text-center space-y-4 shadow-sm ${
              restDone ? 'bg-green-50 border-green-200' : 'bg-white'
            }`}
          >
            <p
              className={`flex items-center justify-center gap-1.5 text-sm font-medium ${
                restDone ? 'text-green-700' : 'text-gray-500'
              }`}
            >
              {restDone ? <CheckIcon className="h-4 w-4" /> : <HourglassIcon className="h-4 w-4" />}
              {restDone ? 'Repos terminé' : 'Repos'}
            </p>
            <p
              className={`font-display text-8xl font-bold tabular-nums ${
                restDone ? 'text-green-600' : 'text-gray-900'
              }`}
            >
              {formatDuration(seconds * 1000)}
            </p>
            <ProgressBar value={progress} tone={restDone ? 'success' : 'accent'} />
            <div className="text-sm text-gray-600">
              À suivre :{' '}
              <span className="font-semibold text-gray-900">
                {isSuperset ? `${joinNames(block)} en superset` : exercise.name}
              </span>
              <span className="block">
                série {setNumber} sur {sets}
                {isSuperset ? '' : ` · ${repsText(exercise)}`}
              </span>
              {isSuperset &&
                block.map((e, i) => (
                  <span key={i} className="block">
                    {e.name} : {repsText(e)}
                  </span>
                ))}
            </div>
          </div>

          <Button size="lg" variant={restDone ? 'success' : 'primary'} onClick={endRest}>
            {restDone ? 'C’est reparti !' : 'Passer le repos'}
          </Button>

          {abandon}
        </div>
      )
    }

    // Série à effectuer
    return (
      <div className="space-y-4">
        {header}

        {isSuperset ? (
          <div className="bg-white border rounded-xl px-5 pb-5 pt-2.5 shadow-sm space-y-2.5">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-600">
                <LinkIcon className="h-4 w-4" />
                Superset · {block.length} exercices enchaînés
              </p>
            </div>

            <div className="space-y-4">
              {block.map((e, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">{e.name}</h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {e.muscle_group} · {e.equipment}
                      {repsDiffer && ` · ${e.target_reps === null ? 'max' : e.target_reps} reps`}
                    </p>
                  </div>

                  {e.description && <p className="text-sm text-gray-600">{e.description}</p>}

                  <ExecutionToggle exercise={e} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 rounded-lg py-3">
                <p className="font-display text-4xl font-bold text-blue-700">
                  {setNumber}
                  <span className="text-xl font-semibold text-blue-400">/{sets}</span>
                </p>
                <p className="text-xs text-blue-600">série</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-3">
                <p className="font-display text-4xl font-bold uppercase text-gray-900">{groupRepsLabel(block)}</p>
                <p className="text-xs text-gray-500">
                  {block.every((e) => e.target_reps === null) ? 'jusqu’à l’échec' : 'répétitions'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg py-3">
                <p className="font-display text-3xl font-bold leading-[2.5rem] text-gray-900">
                  {formatRestTime(restSeconds)}
                </p>
                <p className="text-xs text-gray-500">repos</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">{exercise.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {exercise.muscle_group} · {exercise.equipment}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 rounded-lg py-3">
                <p className="font-display text-4xl font-bold text-blue-700">
                  {setNumber}
                  <span className="text-xl font-semibold text-blue-400">/{sets}</span>
                </p>
                <p className="text-xs text-blue-600">série</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-3">
                <p className="font-display text-4xl font-bold uppercase text-gray-900">
                  {formatReps(exercise.target_reps)}
                </p>
                <p className="text-xs text-gray-500">
                  {exercise.target_reps === null ? 'jusqu’à l’échec' : 'répétitions'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg py-3">
                <p className="font-display text-3xl font-bold leading-[2.5rem] text-gray-900">
                  {formatRestTime(restSeconds)}
                </p>
                <p className="text-xs text-gray-500">repos</p>
              </div>
            </div>

            {exercise.description && <p className="text-sm text-gray-600">{exercise.description}</p>}

            <ExecutionToggle exercise={exercise} />
          </div>
        )}

        <Button size="lg" variant={isFinalSet ? 'success' : 'primary'} onClick={completeSet}>
          {isFinalSet ? 'Dernière série terminée · Finir la séance' : 'Série terminée'}
        </Button>

        <div className="flex justify-between text-sm">
          <button
            onClick={() => jumpToExercise(index - 1)}
            disabled={index === 0}
            className="text-gray-600 hover:text-blue-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            ← Exercice précédent
          </button>
          <button
            onClick={() => jumpToExercise(index + 1)}
            disabled={index === total - 1}
            className="text-gray-600 hover:text-blue-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSuperset ? 'Passer ce superset →' : 'Passer cet exercice →'}
          </button>
        </div>

        {abandon}
      </div>
    )
  }

  // --- Aperçu avant de commencer ---
  const { title, level } = parseWorkoutTitle(workout.name, workout.user_id)
  const estimatedSeconds = estimateWorkoutSeconds(workout.exercises)
  const muscles = [...new Set(workout.exercises.map((e) => e.muscle_group).filter(Boolean))]

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-blue-600">{heading}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-none text-gray-900">{title}</h1>
          {level && (
            <LevelBadge>{level}</LevelBadge>
          )}
        </div>

        {total > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <TimerIcon className="h-5 w-5 text-blue-600" />~
              {Math.max(1, Math.round(estimatedSeconds / 60))} min
            </span>
            {weightKg !== null && (
              <span className="inline-flex items-center gap-1.5">
                <FlameIcon className="h-[26px] w-[26px] text-orange-600" />~
                {computeCalories(weightKg, estimatedSeconds)} kcal
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <DumbbellIcon className="h-5 w-5 text-gray-500" />
              {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}
            </span>
            {muscles.map((muscle) => (
              <Pill key={muscle}>{muscle}</Pill>
            ))}
          </div>
        )}

        {workout.description && <p className="mt-3 text-gray-600">{workout.description}</p>}
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500">Cette séance ne contient aucun exercice.</p>
      ) : (
        <ol className="stagger space-y-3">
          {blocks.map((block, b) => {
            const start = blocks.slice(0, b).reduce((n, g) => n + g.length, 0)
            if (block.length === 1) return <ExerciseRow key={b} exercise={block[0]} position={start + 1} />

            return <SupersetCard key={b} block={block} start={start} />
          })}
        </ol>
      )}

      <Button size="lg" onClick={start} disabled={total === 0}>
        Commencer la séance
      </Button>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        <Link href="/workouts" className="text-blue-600 hover:underline">
          Choisir une autre séance
        </Link>
        {showPlannedLink && (
          <Link href="/" className="text-blue-600 hover:underline">
            Revenir à la séance prévue
          </Link>
        )}
      </div>
    </div>
  )
}

// Carte d'un exercice de l'aperçu : vignette, nom, séries ; un clic déplie la description et le média
function ExerciseRow({
  exercise,
  position,
  bare = false,
  group,
  followsLabel = false,
}: {
  // Exercice qui suit un autre dans un superset : un peu d'espace en plus pour l'étiquette « SUPERSET » posée sur le trait
  followsLabel?: boolean
  exercise: SessionExercise
  position: number
  // Dans un bloc superset : pas de cadre
  bare?: boolean
  // Premier exercice d'un superset : la pastille et le repos sont ceux du groupe, comme un exercice normal
  group?: SessionExercise[]
}) {
  return (
    <li className={bare ? undefined : 'glass border rounded-xl shadow-sm overflow-hidden'}>
      <details className="group">
        <summary
          className={`relative flex flex-wrap items-start gap-x-3 pr-8 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-gray-50 ${
            bare ? 'min-h-[5.5rem]' : ''
          }`}
        >
          <ExerciseThumb exercise={exercise} />
          <span
            className={`min-w-0 flex-1 basis-40 text-base font-semibold text-gray-900 ${followsLabel ? 'pb-4 pt-5' : 'py-4'}`}
          >
            {position}. {exercise.name}
          </span>
          {group ? (
            <span className={`ml-auto shrink-0 flex flex-col items-center gap-2 ${followsLabel ? 'pb-4 pt-5' : 'py-4'}`}>
              <SetsPill sets={groupSets(group)} reps={null} repsLabel={groupRepsLabel(group)} />
              <RestLabel seconds={groupRest(group)} />
            </span>
          ) : bare ? (
            <span className="ml-auto" />
          ) : (
            <span className={`ml-auto shrink-0 flex flex-col items-center gap-2 ${followsLabel ? 'pb-4 pt-5' : 'py-4'}`}>
              <SetsPill sets={exercise.target_sets} reps={exercise.target_reps} />
              <RestLabel seconds={exercise.rest_time} />
            </span>
          )}
          <svg
            className="absolute bottom-2 right-3 h-4 w-4 text-gray-400 transition-transform group-open:rotate-180"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </summary>

        <DetailsPanel exercise={exercise} />
      </details>
    </li>
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

// Un superset dans l'aperçu : un seul bloc. Les exercices sont au-dessus, puis séries, répétitions et repos une seule fois.
function SupersetCard({ block, start }: { block: SessionExercise[]; start: number }) {
  return (
    <li className="glass overflow-hidden rounded-xl border border-l-4 border-l-blue-600 shadow-sm">
      {/* Le premier exercice porte séries × répétitions et repos ; « SUPERSET » est entre les exercices */}
      <ol>
        {block.map((exercise, i) => (
          <Fragment key={i}>
            {i > 0 && (
              // Simple trait entre les deux exercices, avec une petite étiquette posée dessus
              <li aria-label="Superset avec l'exercice précédent" className="relative z-10 h-0 border-t">
                <span className="absolute left-1/2 top-0 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <LinkIcon className="h-3 w-3" />
                  Superset
                </span>
              </li>
            )}
            <ExerciseRow
              exercise={exercise}
              position={start + i + 1}
              bare
              group={i === 0 ? block : undefined}
              followsLabel={i > 0}
            />
          </Fragment>
        ))}
      </ol>
    </li>
  )
}
