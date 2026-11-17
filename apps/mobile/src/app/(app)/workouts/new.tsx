import { router } from 'expo-router'

import { createMyWorkout } from '@vigor/shared/my-workouts'
import { getExercises } from '@vigor/shared/queries'

import { ErrorBox, Loading, Screen } from '@/components/ui'
import WorkoutForm from '@/components/workout-form'
import { supabase } from '@/lib/supabase'
import { useFocusQuery } from '@/lib/use-focus-query'

export default function NewWorkoutScreen() {
  const { data, loading, error } = useFocusQuery(() => getExercises(supabase))

  if (loading) return <Loading />
  const errorMessage = error ?? data?.error
  if (!data || errorMessage) {
    return (
      <Screen>
        <ErrorBox>{errorMessage ?? 'Chargement impossible.'}</ErrorBox>
      </Screen>
    )
  }

  return (
    <WorkoutForm
      title="Créer une séance"
      submitLabel="Créer"
      exercises={data.data}
      onSubmit={(input) => createMyWorkout(supabase, input)}
      // Retour à la liste, sur l'onglet de la séance qu'on vient de créer
      onDone={() => router.dismissTo({ pathname: '/workouts', params: { tab: 'mine' } })}
    />
  )
}
