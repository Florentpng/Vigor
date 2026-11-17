import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEditableWorkout, getExercises } from '@vigor/shared/queries'
import WorkoutForm from '@/components/workout-form'
import { updateMyWorkout } from '../../actions'

export const revalidate = 0

export default async function EditMyWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [workout, { data: exercises }] = await Promise.all([
    getEditableWorkout(supabase, id, user?.id ?? ''),
    getExercises(supabase),
  ])

  // Seules tes propres séances sont modifiables
  if (!workout) notFound()

  return (
    <WorkoutForm
      title="Modifier la séance"
      submitLabel="Enregistrer"
      action={updateMyWorkout.bind(null, id)}
      redirectTo={`/workouts/${id}`}
      exercises={exercises}
      initial={workout}
    />
  )
}
