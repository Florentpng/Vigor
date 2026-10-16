import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/lib/types'
import WorkoutForm from '../workout-form'

export const revalidate = 0

export default async function NewWorkoutPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('exercises')
    .select('id, name, description, muscle_group, equipment, video_url')
    .order('name', { ascending: true })

  return <WorkoutForm exercises={(data ?? []) as Exercise[]} />
}
