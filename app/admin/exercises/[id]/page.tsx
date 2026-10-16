import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/lib/types'
import ExerciseForm from '../exercise-form'

export const revalidate = 0

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('exercises')
    .select('id, name, description, muscle_group, equipment, video_url')
    .eq('id', id)
    .maybeSingle()

  if (!data) notFound()

  return <ExerciseForm exercise={data as Exercise} />
}
