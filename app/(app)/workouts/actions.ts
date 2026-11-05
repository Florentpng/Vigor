'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WorkoutInput } from '@/lib/types'
import { toWorkoutRows, validateWorkoutInput } from '@/lib/workout-input'
import type { ActionResult } from '@/lib/workout-input'

async function getUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

export async function createMyWorkout(input: WorkoutInput): Promise<ActionResult> {
  const invalid = validateWorkoutInput(input)
  if (invalid) return { error: invalid }

  const { supabase, userId } = await getUserId()
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

  revalidatePath('/workouts')
  revalidatePath('/')
  return { ok: true }
}

export async function updateMyWorkout(id: string, input: WorkoutInput): Promise<ActionResult> {
  const invalid = validateWorkoutInput(input)
  if (invalid) return { error: invalid }

  const { supabase, userId } = await getUserId()
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

  revalidatePath('/workouts')
  revalidatePath(`/workouts/${id}`)
  revalidatePath('/')
  return { ok: true }
}

export async function deleteMyWorkout(id: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId()
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

  revalidatePath('/workouts')
  revalidatePath('/planning')
  revalidatePath('/')
  return { ok: true }
}
