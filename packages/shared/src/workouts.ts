import type { SupabaseClient } from '@supabase/supabase-js'
import type { SessionWorkout } from './types'

type Row = {
  id: string
  name: string
  description: string | null
  user_id: string | null
  workout_exercises: {
    exercise_id: string
    order_index: number
    target_sets: number
    target_reps: number | null
    rest_time: number
    linked_to_previous: boolean
    exercises: {
      name: string
      description: string | null
      muscle_group: string
      equipment: string
      video_url: string | null
      thumbnail_url: string | null
    } | null
  }[]
}

// Charge une séance avec ses exercices triés. La RLS décide de ce qui est lisible.
export async function getSessionWorkout(
  supabase: SupabaseClient,
  id: string
): Promise<SessionWorkout | null> {
  const { data } = await supabase
    .from('workouts')
    .select(
      'id, name, description, user_id, workout_exercises(exercise_id, order_index, target_sets, target_reps, rest_time, linked_to_previous, exercises(name, description, muscle_group, equipment, video_url, thumbnail_url))'
    )
    .eq('id', id)
    .maybeSingle()

  if (!data) return null
  const row = data as unknown as Row

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    user_id: row.user_id,
    exercises: [...row.workout_exercises]
      .sort((a, b) => a.order_index - b.order_index)
      .map((item) => ({
        exercise_id: String(item.exercise_id),
        name: item.exercises?.name ?? 'Exercice supprimé',
        description: item.exercises?.description ?? null,
        muscle_group: item.exercises?.muscle_group ?? '',
        equipment: item.exercises?.equipment ?? '',
        video_url: item.exercises?.video_url ?? null,
        thumbnail_url: item.exercises?.thumbnail_url ?? null,
        target_sets: item.target_sets,
        target_reps: item.target_reps,
        rest_time: item.rest_time,
        linked_to_previous: Boolean(item.linked_to_previous),
      })),
  }
}
