import type { SupabaseClient } from '@supabase/supabase-js'
import { type ActionResult, getUserId } from './result'
import type { WorkoutInput } from './types'
import { toWorkoutRows, validateWorkoutInput } from './workout-input'

// Séances personnelles de l'utilisateur connecté (user_id = lui).

export async function createMyWorkout(supabase: SupabaseClient, input: WorkoutInput): Promise<ActionResult> {
  const invalid = validateWorkoutInput(input)
  if (invalid) return { error: invalid }

  const userId = await getUserId(supabase)
  if (!userId) return { error: 'Non connecté.' }

  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({ name: input.name.trim(), description: input.description.trim() || null, user_id: userId })
    .select('id')
    .single()
  if (error || !workout) return { error: error?.message ?? 'Création impossible.' }

  const { error: rowsError } = await supabase
    .from('workout_exercises')
    .insert(toWorkoutRows(workout.id, input))
  if (rowsError) {
    // Pas de transaction : on retire la séance pour ne pas laisser une séance vide.
    await supabase.from('workouts').delete().eq('id', workout.id)
    return { error: rowsError.message }
  }

  return { ok: true }
}

export async function updateMyWorkout(
  supabase: SupabaseClient,
  id: string,
  input: WorkoutInput
): Promise<ActionResult> {
  const invalid = validateWorkoutInput(input)
  if (invalid) return { error: invalid }

  const userId = await getUserId(supabase)
  if (!userId) return { error: 'Non connecté.' }

  const { data: updated, error } = await supabase
    .from('workouts')
    .update({ name: input.name.trim(), description: input.description.trim() || null })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
  if (error) return { error: error.message }
  if (!updated?.length) return { error: 'Séance introuvable ou non modifiable.' }

  const { error: deleteError } = await supabase.from('workout_exercises').delete().eq('workout_id', id)
  if (deleteError) return { error: deleteError.message }

  const { error: rowsError } = await supabase
    .from('workout_exercises')
    .insert(toWorkoutRows(id, input))
  if (rowsError) return { error: rowsError.message }

  return { ok: true }
}

export async function deleteMyWorkout(supabase: SupabaseClient, id: string): Promise<ActionResult> {
  const userId = await getUserId(supabase)
  if (!userId) return { error: 'Non connecté.' }

  // Vérifie d'abord que la séance est bien la tienne, avant de toucher à ses exercices.
  const { data: own } = await supabase
    .from('workouts')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (!own) return { error: 'Séance introuvable ou non supprimable.' }

  const { error: rowsError } = await supabase.from('workout_exercises').delete().eq('workout_id', id)
  if (rowsError) return { error: rowsError.message }

  const { error } = await supabase.from('workouts').delete().eq('id', id).eq('user_id', userId)
  if (error) return { error: error.message }

  return { ok: true }
}
