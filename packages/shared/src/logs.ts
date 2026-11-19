import type { SupabaseClient } from '@supabase/supabase-js'
import { computeCalories } from './calories'
import { getUserId, INVALID_WEIGHT, isValidWeight } from './result'
import { getLatestWeight, getTodayDate, saveWeightEntry } from './weights'

export type NewBadge = { code: string; title: string; description: string }

export type LogResult =
  | { error: string }
  | { ok: true; calories: number; minutes: number; badges: NewBadge[]; badgesError?: string }

export type LogInput = {
  workoutId: string
  durationSeconds: number
  weightKg?: number
}

// Enregistre une séance terminée (calories MET × poids × durée), puis attribue les badges.
export async function saveWorkoutLog(supabase: SupabaseClient, input: LogInput): Promise<LogResult> {
  const userId = await getUserId(supabase)
  if (!userId) return { error: 'Non connecté.' }

  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) {
    return { error: 'Durée invalide.' }
  }

  // Poids : la dernière pesée, ou celui saisi à l'instant (et alors enregistré comme pesée du jour)
  let weightKg: number | null = null
  if (input.weightKg !== undefined) {
    if (!isValidWeight(input.weightKg)) return { error: INVALID_WEIGHT }
    const saved = await saveWeightEntry(supabase, getTodayDate(), input.weightKg)
    if ('error' in saved) return saved
    weightKg = input.weightKg
  } else {
    weightKg = await getLatestWeight(supabase, userId)
  }
  if (weightKg === null) return { error: 'Renseigne ton poids pour calculer les calories.' }

  const calories = computeCalories(weightKg, input.durationSeconds)
  const minutes = Math.max(1, Math.round(input.durationSeconds / 60))

  const { error } = await supabase.from('workout_logs').insert({
    user_id: userId,
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

  return { ok: true, calories, minutes, badges, badgesError: badgesError?.message }
}
