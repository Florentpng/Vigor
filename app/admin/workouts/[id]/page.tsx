import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/lib/types'
import WorkoutForm from '@/components/workout-form'
import { updateWorkout } from '../actions'

export const revalidate = 0

type WorkoutWithItems = {
  id: string
  name: string
  description: string | null
  workout_exercises: {
    exercise_id: string
    order_index: number
    target_sets: number
    target_reps: number
    rest_time: number
  }[]
}

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: workout }, { data: exercises }] = await Promise.all([
    supabase
      .from('workouts')
      .select(
        'id, name, description, workout_exercises(exercise_id, order_index, target_sets, target_reps, rest_time)'
      )
      .eq('id', id)
      .is('user_id', null)
      .maybeSingle(),
    supabase
      .from('exercises')
      .select('id, name, description, muscle_group, equipment, video_url')
      .order('name', { ascending: true }),
  ])

  if (!workout) notFound()

  const { name, description, workout_exercises } = workout as unknown as WorkoutWithItems

  return (
    <WorkoutForm
      title="Modifier la séance"
      submitLabel="Enregistrer"
      action={updateWorkout.bind(null, id)}
      redirectTo="/admin/workouts"
      exercises={(exercises ?? []) as Exercise[]}
      initial={{
        name,
        description: description ?? '',
        items: [...workout_exercises]
          .sort((a, b) => a.order_index - b.order_index)
          .map((i) => ({
            exercise_id: i.exercise_id,
            sets: i.target_sets,
            reps: i.target_reps,
            rest: i.rest_time,
          })),
      }}
    />
  )
}
