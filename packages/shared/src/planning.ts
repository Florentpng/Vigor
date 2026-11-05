import type { SupabaseClient } from '@supabase/supabase-js'
import { type ActionResult, getUserId } from './result'

// Définit les jours (1 = lundi … 7 = dimanche) où une séance est planifiée.
export async function setWorkoutDays(
  supabase: SupabaseClient,
  workoutId: string,
  days: number[]
): Promise<ActionResult> {
  if (days.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) {
    return { error: 'Jours invalides.' }
  }

  const userId = await getUserId(supabase)
  if (!userId) return { error: 'Non connecté.' }

  // 1. Retire les jours décochés pour cette séance
  const removal = supabase.from('weekly_plan').delete().eq('user_id', userId).eq('workout_id', workoutId)
  const { error: deleteError } = days.length
    ? await removal.not('weekday', 'in', `(${days.join(',')})`)
    : await removal
  if (deleteError) return { error: deleteError.message }

  // 2. Ajoute les jours cochés. Un jour déjà pris par une autre séance est remplacé (clé user_id + weekday).
  if (days.length) {
    const { error } = await supabase
      .from('weekly_plan')
      .upsert(
        days.map((weekday) => ({ user_id: userId, weekday, workout_id: workoutId })),
        { onConflict: 'user_id,weekday' }
      )
    if (error) return { error: error.message }
  }

  return { ok: true }
}
