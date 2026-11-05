'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { computeCalories } from '@/lib/calories'

export type NewBadge = { code: string; title: string; description: string }

export type LogResult =
  | { error: string }
  | { ok: true; calories: number; minutes: number; badges: NewBadge[]; badgesError?: string }

export async function saveWorkoutLog(input: {
  workoutId: string
  durationSeconds: number
  weightKg?: number
}): Promise<LogResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté.' }

  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) {
    return { error: 'Durée invalide.' }
  }

  // Poids : celui du profil, ou celui saisi à l'instant (et alors enregistré dans le profil)
  let weightKg: number | null = null
  if (input.weightKg !== undefined) {
    if (!Number.isFinite(input.weightKg) || input.weightKg < 20 || input.weightKg > 400) {
      return { error: 'Poids invalide (entre 20 et 400 kg).' }
    }
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ weight_kg: input.weightKg })
      .eq('id', user.id)
      .select('id')
    if (error) return { error: error.message }
    if (!updated?.length) return { error: 'Profil introuvable.' }
    weightKg = input.weightKg
  } else {
    const { data: profile } = await supabase
      .from('profiles')
      .select('weight_kg')
      .eq('id', user.id)
      .maybeSingle()
    weightKg = profile?.weight_kg ?? null
  }
  if (weightKg === null) return { error: 'Renseigne ton poids pour calculer les calories.' }

  const calories = computeCalories(weightKg, input.durationSeconds)
  const minutes = Math.max(1, Math.round(input.durationSeconds / 60))

  const { error } = await supabase.from('workout_logs').insert({
    user_id: user.id,
    workout_id: input.workoutId,
    duration_minutes: minutes,
    calories_burned: calories,
  })
  if (error) return { error: error.message }

  // Les badges ne doivent jamais faire échouer l'enregistrement de la séance
  const { data: unlocked, error: badgesError } = await supabase.rpc('award_badges')
  const badges = (
    (unlocked ?? []) as { badge_code: string; badge_title: string; badge_description: string }[]
  ).map((b) => ({ code: b.badge_code, title: b.badge_title, description: b.badge_description }))

  revalidatePath('/profile')
  return { ok: true, calories, minutes, badges, badgesError: badgesError?.message }
}
