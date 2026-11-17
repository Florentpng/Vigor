import { router, useLocalSearchParams } from 'expo-router'

import { updateMyWorkout } from '@vigor/shared/my-workouts'
import { getEditableWorkout, getExercises } from '@vigor/shared/queries'

import BackLink from '@/components/back-link'
import { ErrorBox, Loading, Muted, Screen } from '@/components/ui'
import WorkoutForm from '@/components/workout-form'
import { useUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useFocusQuery } from '@/lib/use-focus-query'

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const userId = useUserId()

  const { data, loading, error } = useFocusQuery(async () => {
    const [workout, exercises] = await Promise.all([getEditableWorkout(supabase, id, userId), getExercises(supabase)])
    return { workout, exercises: exercises.data }
  }, id)

  if (loading) return <Loading />

  // Seules tes propres séances sont modifiables
  if (!data?.workout) {
    return (
      <Screen>
        <BackLink label="Retour" fallback="/workouts" />
        {error ? <ErrorBox>{error}</ErrorBox> : <Muted>Cette séance n&apos;est pas modifiable.</Muted>}
      </Screen>
    )
  }

  return (
    <WorkoutForm
      title="Modifier la séance"
      submitLabel="Enregistrer"
      exercises={data.exercises}
      initial={data.workout}
      onSubmit={(input) => updateMyWorkout(supabase, id, input)}
      onDone={() => router.back()}
    />
  )
}
