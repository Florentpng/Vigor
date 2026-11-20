'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MUSCLE_GROUPS } from '@vigor/shared/constants'
import { formatReps, formatRestTime, parseRepsInput } from '@vigor/shared/format'
import type { Exercise, WorkoutInput } from '@vigor/shared/types'
import type { ActionResult } from '@vigor/shared/workout-input'

// Valeur de `reps` quand le bouton « Max » est activé (jusqu'à l'échec)
const MAX_REPS = 'max'

type Item = {
  exercise_id: string
  sets: string
  reps: string
  rest: string
  // enchaîné avec l'exercice précédent (superset)
  linked: boolean
  // dernier nombre saisi, rétabli quand on désactive « Max »
  lastReps?: string
}

export type WorkoutFormInitial = {
  name: string
  description: string
  items: { exercise_id: string; sets: number; reps: number | null; rest: number; linked: boolean }[]
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

// Début et fin (indices inclus) du superset qui contient l'exercice `index` ; un exercice seul : [index, index]
function groupRange(items: { linked: boolean }[], index: number): [number, number] {
  let from = index
  while (from > 0 && items[from].linked) from--
  let to = index
  while (to + 1 < items.length && items[to + 1].linked) to++
  return [from, to]
}

function LinkIcon() {
  return (
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
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  )
}

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
      reps: formatReps(i.reps),
      rest: String(i.rest),
      linked: i.linked,
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
    setItems([...items, { exercise_id: selected, sets: '4', reps: '12', rest: '90', linked: false }])
    setSelected('')
  }

  const updateItem = (index: number, field: 'sets' | 'reps' | 'rest', value: string) => {
    // Les exercices d'un superset ont tous le même nombre de séries : on le change pour tout le groupe
    const [from, to] = field === 'sets' ? groupRange(items, index) : [index, index]
    setItems(items.map((item, i) => (i >= from && i <= to ? { ...item, [field]: value } : item)))
  }

  // Lie l'exercice au précédent (ou délie) ; lié, il prend le nombre de séries du précédent
  const toggleLink = (index: number) => {
    if (index === 0) return
    const linking = !items[index].linked
    const next = items.map((item, i) => (i === index ? { ...item, linked: linking } : item))
    if (!linking) {
      setItems(next)
      return
    }
    const [from, to] = groupRange(next, index)
    const sets = next[from].sets
    setItems(next.map((item, i) => (i >= from && i <= to ? { ...item, sets } : item)))
  }

  // Bouton « Max » : remplace le nombre de répétitions par MAX, et le rétablit au second clic
  const toggleMax = (index: number) => {
    setItems(
      items.map((item, i) => {
        if (i !== index) return item
        return item.reps === MAX_REPS
          ? { ...item, reps: item.lastReps ?? '12' }
          : { ...item, reps: MAX_REPS, lastReps: item.reps }
      })
    )
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    // Déplacer un exercice défait les supersets qui l'entourent (liens des deux exercices échangés et du suivant)
    const low = Math.min(index, target)
    for (let i = low; i <= Math.min(low + 2, next.length - 1); i++) next[i] = { ...next[i], linked: false }
    setItems(next)
  }

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index)
    // Le suivant, lié à l'exercice retiré, ne doit pas se retrouver lié à un autre groupe
    if (next[index] && !items[index].linked) next[index] = { ...next[index], linked: false }
    if (next[0]) next[0] = { ...next[0], linked: false }
    setItems(next)
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg('')

    const input: WorkoutInput = {
      name,
      description,
      exercises: items.map((i, position) => {
        // « max » -> null ; une saisie invalide -> NaN, que la validation refuse
        const reps = parseRepsInput(i.reps)

        return {
          exercise_id: i.exercise_id,
          target_sets: Number(i.sets),
          target_reps: reps === undefined ? NaN : reps,
          rest_time: Number(i.rest),
          linked_to_previous: position > 0 && i.linked,
        }
      }),
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
              const [groupFrom, groupTo] = groupRange(items, index)
              const inGroup = groupTo > groupFrom
              // Dans un superset, seul le dernier exercice a un repos (après le tour complet)
              const hasRest = !inGroup || index === groupTo

              return (
                <li key={item.exercise_id}>
                  {index > 0 && (
                    <div className="flex justify-center pb-3">
                      <button
                        type="button"
                        onClick={() => toggleLink(index)}
                        aria-pressed={item.linked}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold cursor-pointer transition ${
                          item.linked
                            ? 'border-blue-600 bg-blue-600/15 text-blue-600'
                            : 'text-gray-500 hover:border-blue-600 hover:text-blue-600'
                        }`}
                      >
                        <LinkIcon />
                        {item.linked
                          ? 'Superset avec le précédent · délier'
                          : 'Lier en superset avec le précédent'}
                      </button>
                    </div>
                  )}
                  <div
                    className={`border rounded-lg p-3 bg-gray-50 ${
                      inGroup ? 'border-l-4 border-l-blue-600' : ''
                    }`}
                  >
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
                    <div className="text-xs text-gray-600">
                      <label htmlFor={`reps-${index}`}>Répétitions</label>
                      <div className="mt-1 flex gap-2">
                        {item.reps === MAX_REPS ? (
                          // « Max » remplace le nombre : le champ n'est plus modifiable
                          <input
                            id={`reps-${index}`}
                            type="text"
                            readOnly
                            value="MAX"
                            aria-label="Répétitions : max, jusqu'à l'échec"
                            className={`${inputClass} min-w-0 flex-1 font-bold text-blue-600`}
                          />
                        ) : (
                          <input
                            id={`reps-${index}`}
                            type="number"
                            min={1}
                            step={1}
                            required
                            value={item.reps}
                            onChange={(e) => updateItem(index, 'reps', e.target.value)}
                            className={`${inputClass} min-w-0 flex-1`}
                          />
                        )}
                        <Button
                          variant={item.reps === MAX_REPS ? 'primary' : 'secondary'}
                          onClick={() => toggleMax(index)}
                          aria-pressed={item.reps === MAX_REPS}
                          title="Max : jusqu'à l'échec"
                          className="shrink-0 px-3"
                        >
                          Max
                        </Button>
                      </div>
                      {item.reps === MAX_REPS && (
                        <span className="block mt-1 text-gray-500">Jusqu&apos;à l&apos;échec</span>
                      )}
                    </div>
                    {hasRest ? (
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
                    ) : (
                      <div className="text-xs text-gray-600">
                        Repos
                        <p className="mt-1 flex h-[38px] items-center text-gray-500">
                          Aucun : enchaîné avec la suite
                        </p>
                      </div>
                    )}
                  </div>
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
