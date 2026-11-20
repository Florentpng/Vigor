import { SUPERSET_SETS_ERROR } from './supersets'
import type { WorkoutInput } from './types'

export type { ActionResult } from './result'

export function validateWorkoutInput(input: WorkoutInput): string | null {
  if (!input.name.trim()) return 'Le nom est obligatoire.'
  if (input.exercises.length === 0) return 'Ajoute au moins un exercice.'

  const invalid = input.exercises.some(
    (e) =>
      !e.exercise_id ||
      !Number.isInteger(e.target_sets) ||
      e.target_sets < 1 ||
      // target_reps vaut null pour « max » (jusqu'à l'échec)
      (e.target_reps !== null && (!Number.isInteger(e.target_reps) || e.target_reps < 1)) ||
      !Number.isInteger(e.rest_time) ||
      e.rest_time < 0
  )
  if (invalid) return 'Séries, répétitions et repos doivent être des nombres valides.'

  // Un superset : le premier exercice ne peut pas être lié, et tout le groupe a le même nombre de séries
  if (input.exercises[0].linked_to_previous) return 'Le premier exercice ne peut pas être lié à un précédent.'
  const mismatch = input.exercises.some(
    (e, i) => i > 0 && e.linked_to_previous && e.target_sets !== input.exercises[i - 1].target_sets
  )
  return mismatch ? SUPERSET_SETS_ERROR : null
}

export function toWorkoutRows(workoutId: string, input: WorkoutInput) {
  return input.exercises.map((e, index) => ({
    workout_id: workoutId,
    exercise_id: e.exercise_id,
    order_index: index,
    target_sets: e.target_sets,
    target_reps: e.target_reps,
    rest_time: e.rest_time,
    linked_to_previous: e.linked_to_previous,
  }))
}
