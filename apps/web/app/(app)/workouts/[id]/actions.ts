'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = { error: string } | { ok: true }

export async function setWorkoutDays(workoutId: string, days: number[]): Promise<ActionResult> {
  if (days.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) {
    return { error: 'Jours invalides.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté.' }

  // 1. Retire les jours décochés pour cette séance
  const removal = supabase.from('weekly_plan').delete().eq('user_id', user.id).eq('workout_id', workoutId)
  const { error: deleteError } = days.length
    ? await removal.not('weekday', 'in', `(${days.join(',')})`)
    : await removal
  if (deleteError) return { error: deleteError.message }

  // 2. Ajoute les jours cochés. Un jour déjà pris par une autre séance est remplacé (clé user_id + weekday).
  if (days.length) {
    const { error } = await supabase
      .from('weekly_plan')
      .upsert(
        days.map((weekday) => ({ user_id: user.id, weekday, workout_id: workoutId })),
        { onConflict: 'user_id,weekday' }
      )
    if (error) return { error: error.message }
  }

  revalidatePath('/workouts')
  revalidatePath(`/workouts/${workoutId}`)
  revalidatePath('/planning')
  revalidatePath('/')
  return { ok: true }
}
