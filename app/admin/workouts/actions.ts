'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WorkoutInput } from '@/lib/types'

export type ActionResult = { error: string } | { ok: true }

function validate(input: WorkoutInput): string | null {
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

function toRows(workoutId: string, input: WorkoutInput) {
  return input.exercises.map((e, index) => ({
    workout_id: workoutId,
    exercise_id: e.exercise_id,
    order_index: index,
    target_sets: e.target_sets,
    target_reps: e.target_reps,
    rest_time: e.rest_time,
  }))
}

export async function createWorkout(input: WorkoutInput): Promise<ActionResult> {
  const invalid = validate(input)
  if (invalid) return { error: invalid }

  const supabase = await createClient()

  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({ name: input.name.trim(), description: input.description.trim() || null, user_id: null })
    .select('id')
    .single()
  if (error || !workout) return { error: error?.message ?? 'Création impossible.' }

  const { error: rowsError } = await supabase
    .from('workout_exercises')
    .insert(toRows(workout.id, input))
  if (rowsError) {
    // Pas de transaction : on retire la séance pour ne pas laisser une séance vide.
    await supabase.from('workouts').delete().eq('id', workout.id)
    return { error: rowsError.message }
  }

  revalidatePath('/admin/workouts')
  return { ok: true }
}

export async function updateWorkout(id: string, input: WorkoutInput): Promise<ActionResult> {
  const invalid = validate(input)
  if (invalid) return { error: invalid }

  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('workouts')
    .update({ name: input.name.trim(), description: input.description.trim() || null })
    .eq('id', id)
    .is('user_id', null)
    .select('id')
  if (error) return { error: error.message }
  if (!updated?.length) return { error: 'Séance introuvable ou non modifiable.' }

  const { error: deleteError } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('workout_id', id)
  if (deleteError) return { error: deleteError.message }

  const { error: rowsError } = await supabase.from('workout_exercises').insert(toRows(id, input))
  if (rowsError) return { error: rowsError.message }

  revalidatePath('/admin/workouts')
  return { ok: true }
}

export async function deleteWorkout(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Pas de on delete cascade sur la clé étrangère : on supprime d'abord les lignes liées.
  const { error: rowsError } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('workout_id', id)
  if (rowsError) return { error: rowsError.message }

  const { error } = await supabase.from('workouts').delete().eq('id', id).is('user_id', null)
  if (error) {
    return {
      error: error.message.includes('foreign key')
        ? 'Cette séance a déjà été enregistrée par des utilisateurs : suppression impossible.'
        : error.message,
    }
  }

  revalidatePath('/admin/workouts')
  return { ok: true }
}
