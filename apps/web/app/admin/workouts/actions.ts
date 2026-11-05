'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WorkoutInput } from '@vigor/shared/types'
import { toWorkoutRows as toRows, validateWorkoutInput as validate } from '@vigor/shared/workout-input'
import type { ActionResult } from '@vigor/shared/workout-input'

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
