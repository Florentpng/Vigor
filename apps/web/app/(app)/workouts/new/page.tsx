import { createClient } from '@/lib/supabase/server'
import { getExercises } from '@vigor/shared/queries'
import WorkoutForm from '@/components/workout-form'
import { createMyWorkout } from '../actions'

export const revalidate = 0

export default async function NewWorkoutPage() {
  const supabase = await createClient()

  const { data: exercises } = await getExercises(supabase)

  return (
    <WorkoutForm
      exercises={exercises}
      title="Créer une séance"
      submitLabel="Créer la séance"
      action={createMyWorkout}
      redirectTo="/workouts"
    />
  )
}
