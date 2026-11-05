import type { WorkoutInput } from './types'

export type ActionResult = { error: string } | { ok: true }

export function validateWorkoutInput(input: WorkoutInput): string | null {
  if (!input.name.trim()) return 'Le nom est obligatoire.'
  if (input.exercises.length === 0) return 'Ajoute au moins un exercice.'

  const invalid = input.exercises.some(
    (e) =>
      !e.exercise_id ||
      !Number.isInteger(e.target_sets) ||
      e.target_sets < 1 ||
      !Number.isInteger(e.target_reps) ||
      e.target_reps < 1 ||
      !Number.isInteger(e.rest_time) ||
      e.rest_time < 0
  )
  return invalid ? 'Séries, répétitions et repos doivent être des nombres valides.' : null
}

export function toWorkoutRows(workoutId: string, input: WorkoutInput) {
  return input.exercises.map((e, index) => ({
    workout_id: workoutId,
    exercise_id: e.exercise_id,
    order_index: index,
    target_sets: e.target_sets,
    target_reps: e.target_reps,
    rest_time: e.rest_time,
  }))
}
