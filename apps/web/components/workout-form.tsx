'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MUSCLE_GROUPS } from '@vigor/shared/constants'
import { formatRestTime } from '@vigor/shared/format'
import type { Exercise, WorkoutInput } from '@vigor/shared/types'
import type { ActionResult } from '@vigor/shared/workout-input'

type Item = {
  exercise_id: string
  sets: string
  reps: string
  rest: string
}

export type WorkoutFormInitial = {
  name: string
  description: string
  items: { exercise_id: string; sets: number; reps: number; rest: number }[]
}

type Props = {
  exercises: Exercise[]
  initial?: WorkoutFormInitial
  title: string
  submitLabel: string
  // Server Action qui enregistre la séance (création ou modification, admin ou utilisateur)
  action: (input: WorkoutInput) => Promise<ActionResult>
  // Où aller après l'enregistrement et en cas d'annulation
  redirectTo: string
}

const inputClass =
  'w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none'

export default function WorkoutForm({
  exercises,
  initial,
  title,
  submitLabel,
  action,
  redirectTo,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [items, setItems] = useState<Item[]>(
    (initial?.items ?? []).map((i) => ({
      exercise_id: i.exercise_id,
      sets: String(i.sets),
      reps: String(i.reps),
      rest: String(i.rest),
    }))
  )

  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState('')

  const exerciseById = new Map(exercises.map((e) => [e.id, e]))
  const addedIds = new Set(items.map((i) => i.exercise_id))
  const available = exercises.filter(
    (e) => !addedIds.has(e.id) && (!filter || e.muscle_group === filter)
  )

  const addExercise = () => {
    if (!selected) return
    // Valeurs par défaut de la table workout_exercises.
    setItems([...items, { exercise_id: selected, sets: '4', reps: '12', rest: '90' }])
    setSelected('')
  }

  const updateItem = (index: number, field: keyof Omit<Item, 'exercise_id'>, value: string) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
  }

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg('')

    const input: WorkoutInput = {
      name,
      description,
      exercises: items.map((i) => ({
        exercise_id: i.exercise_id,
        target_sets: Number(i.sets),
        target_reps: Number(i.reps),
        rest_time: Number(i.rest),
      })),
    }

    startTransition(async () => {
      const result = await action(input)

      if ('error' in result) {
        setErrorMsg(result.error)
        return
      }
      router.push(redirectTo)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto glass p-8 rounded-xl shadow-sm border space-y-6"
    >
      <h2 className="text-4xl font-extrabold text-gray-900">{title}</h2>

      {errorMsg && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMsg}</div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nom de la séance *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Ex: Push Day - Débutant"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Exercices</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setSelected('')
            }}
            className="border rounded-lg p-2 text-sm"
            aria-label="Filtrer par groupe musculaire"
          >
            <option value="">Tous les groupes</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 min-w-48 border rounded-lg p-2 text-sm"
            aria-label="Exercice à ajouter"
          >
            <option value="">Choisir un exercice...</option>
            {available.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.equipment})
              </option>
            ))}
          </select>

          <Button onClick={addExercise} disabled={!selected}>
            Ajouter
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 border border-dashed rounded-lg p-4 text-center">
            Aucun exercice pour l&apos;instant.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => {
              const exercise = exerciseById.get(item.exercise_id)
              const restSeconds = Number(item.rest)

              return (
                <li key={item.exercise_id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="font-medium text-gray-900 text-sm">
                      {index + 1}. {exercise?.name ?? 'Exercice introuvable'}
                      {exercise && (
                        <span className="ml-2 text-xs text-gray-500">{exercise.muscle_group}</span>
                      )}
                    </p>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        aria-label="Monter"
                        className="px-2 py-1 text-sm border rounded bg-white hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                        aria-label="Descendre"
                        className="px-2 py-1 text-sm border rounded bg-white hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-2 py-1 text-sm text-red-600 hover:underline cursor-pointer"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="text-xs text-gray-600">
                      Séries
                      <input
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={item.sets}
                        onChange={(e) => updateItem(index, 'sets', e.target.value)}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <label className="text-xs text-gray-600">
                      Répétitions
                      <input
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={item.reps}
                        onChange={(e) => updateItem(index, 'reps', e.target.value)}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <label className="text-xs text-gray-600">
                      Repos (secondes)
                      <input
                        type="number"
                        min={0}
                        step={5}
                        required
                        value={item.rest}
                        onChange={(e) => updateItem(index, 'rest', e.target.value)}
                        className={`${inputClass} mt-1`}
                      />
                      {Number.isInteger(restSeconds) && restSeconds >= 60 && (
                        <span className="block mt-1 text-gray-500">
                          = {formatRestTime(restSeconds)}
                        </span>
                      )}
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={() => router.push(redirectTo)}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
