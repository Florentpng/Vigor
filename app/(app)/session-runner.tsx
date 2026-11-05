'use client'

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { badgeImageSrc } from '@/lib/badges'
import { formatDuration, formatRestTime } from '@/lib/format'
import type { SessionExercise, SessionWorkout } from '@/lib/types'
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

  const total = workout.exercises.length

  const start = () => {
    setNow(Date.now())
    writeSession({ workoutId: workout.id, startedAt: Date.now(), index: 0, setIndex: 0 })
  }

  const finish = (current: StoredSession) => {
    writeSession({ workoutId: current.workoutId, startedAt: current.startedAt, index: current.index, setIndex: current.setIndex, endedAt: Date.now() })
  }

  // Série terminée : on passe à la suivante (ou à l'exercice suivant) et le repos démarre
  const completeSet = () => {
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
    const base = {
      workoutId: session.workoutId,
      startedAt: session.startedAt,
      ...next,
    }

    const at = Date.now()
    setNow(at)
    writeSession(
      exercise.rest_time > 0
        ? { ...base, restEndsAt: at + exercise.rest_time * 1000, restSeconds: exercise.rest_time }
        : base
    )
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
        <p className="text-sm font-medium text-green-600">
          {session.logged ? 'Séance enregistrée' : 'Séance terminée'}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{workout.name}</h1>
        <p className="text-4xl font-bold tabular-nums text-gray-900">{formatDuration(durationMs)}</p>

        {session.logged ? (
          <>
            <p className="text-gray-700">
              <span className="text-2xl font-bold text-orange-600">{session.logged.calories}</span>{' '}
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
            <button
              onClick={() => writeSession(null)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium cursor-pointer"
            >
              Fermer
            </button>
          </>
        ) : (
          <>
            {weightKg === null && (
              <div className="text-left">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Ton poids (kg), pour calculer les calories
                </label>
                <input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  min={20}
                  max={400}
                  step="1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex : 75"
                />
                <p className="mt-1 text-xs text-gray-500">Il sera retenu dans ton profil.</p>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{saveError}</div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={save}
                disabled={saving || (weightKg === null && !weightInput)}
                className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
              </button>
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
    const exercise = workout.exercises[index]
    const setNumber = Math.min(session.setIndex + 1, exercise.target_sets)
    const isFinalSet = index === total - 1 && setNumber >= exercise.target_sets

    const header = (
      <>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{workout.name}</p>
            <p className="text-sm font-medium text-gray-700">
              Exercice {index + 1} sur {total}
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-gray-900">
            {formatDuration(now - session.startedAt)}
          </p>
        </div>

        <div className="flex gap-1.5" aria-hidden="true">
          {workout.exercises.map((item, i) => {
            const fill =
              i < index ? 100 : i === index ? (session.setIndex / item.target_sets) * 100 : 0

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
            <p className={`text-sm font-medium ${restDone ? 'text-green-700' : 'text-gray-500'}`}>
              {restDone ? 'Repos terminé' : 'Repos'}
            </p>
            <p
              className={`text-6xl font-bold tabular-nums ${
                restDone ? 'text-green-600' : 'text-gray-900'
              }`}
            >
              {formatDuration(seconds * 1000)}
            </p>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden" aria-hidden="true">
              <div
                className={`h-full transition-[width] duration-500 ${
                  restDone ? 'bg-green-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">
              À suivre :{' '}
              <span className="font-semibold text-gray-900">{exercise.name}</span>
              <span className="block">
                série {setNumber} sur {exercise.target_sets} · {exercise.target_reps} répétitions
              </span>
            </div>
          </div>

          <button
            onClick={endRest}
            className={`w-full px-4 py-4 rounded-xl text-base font-semibold text-white cursor-pointer ${
              restDone ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {restDone ? 'C’est reparti !' : 'Passer le repos'}
          </button>

          {abandon}
        </div>
      )
    }

    // Série à effectuer
    return (
      <div className="space-y-4">
        {header}

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exercise.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {exercise.muscle_group} · {exercise.equipment}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg py-3">
              <p className="text-3xl font-bold text-blue-700">
                {setNumber}
                <span className="text-lg font-medium text-blue-400">/{exercise.target_sets}</span>
              </p>
              <p className="text-xs text-blue-600">série</p>
            </div>
            <div className="bg-gray-50 rounded-lg py-3">
              <p className="text-3xl font-bold text-gray-900">{exercise.target_reps}</p>
              <p className="text-xs text-gray-500">répétitions</p>
            </div>
            <div className="bg-gray-50 rounded-lg py-3">
              <p className="text-xl font-bold leading-[2.25rem] text-gray-900">
                {formatRestTime(exercise.rest_time)}
              </p>
              <p className="text-xs text-gray-500">repos</p>
            </div>
          </div>

          {exercise.description && <p className="text-sm text-gray-600">{exercise.description}</p>}

          <ExerciseMedia exercise={exercise} />
        </div>

        <button
          onClick={completeSet}
          className={`w-full px-4 py-4 rounded-xl text-base font-semibold text-white cursor-pointer ${
            isFinalSet ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isFinalSet ? 'Dernière série terminée · Finir la séance' : 'Série terminée'}
        </button>

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
            Passer cet exercice →
          </button>
        </div>

        {abandon}
      </div>
    )
  }

  // --- Aperçu avant de commencer ---
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-blue-600">{heading}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{workout.name}</h1>
        {workout.description && <p className="mt-1 text-gray-600">{workout.description}</p>}
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500">Cette séance ne contient aucun exercice.</p>
      ) : (
        <ol className="bg-white border rounded-xl shadow-sm divide-y overflow-hidden">
          {workout.exercises.map((exercise, i) => (
            <li key={i}>
              <details className="group">
                <summary className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-gray-50">
                  <svg
                    className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
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
                  <span className="flex-1 font-medium text-gray-900">
                    {i + 1}. {exercise.name}
                  </span>
                  <span className="shrink-0 text-right text-gray-600">
                    {exercise.target_sets} × {exercise.target_reps}
                    <span className="block text-xs text-gray-500">
                      Repos {formatRestTime(exercise.rest_time)}
                    </span>
                  </span>
                </summary>

                <div className="bg-gray-50 border-t px-4 py-4 space-y-3 text-sm">
                  <p className="text-xs text-gray-500">
                    {exercise.muscle_group} · {exercise.equipment}
                  </p>
                  {exercise.description ? (
                    <p className="text-gray-600">{exercise.description}</p>
                  ) : (
                    <p className="text-gray-400">Pas de description pour cet exercice.</p>
                  )}
                  <ExerciseMedia exercise={exercise} />
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={start}
        disabled={total === 0}
        className="w-full px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
      >
        Commencer la séance
      </button>

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
