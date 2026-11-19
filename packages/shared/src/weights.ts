import type { SupabaseClient } from '@supabase/supabase-js'
import { type ActionResult, getUserId, INVALID_WEIGHT, isValidWeight } from './result'

export type WeightEntry = { id: string; measured_on: string; weight_kg: number }

// Date du jour à Paris, au format AAAA-MM-JJ (celui de la colonne `date`).
export function getTodayDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
}

// Pesées de la plus récente à la plus ancienne.
export async function getWeightEntries(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: WeightEntry[]; error: string | null }> {
  const { data, error } = await supabase
    .from('weight_entries')
    .select('id, measured_on, weight_kg')
    .eq('user_id', userId)
    .order('measured_on', { ascending: false })
  return { data: (data ?? []) as WeightEntry[], error: error?.message ?? null }
}

// Dernière pesée (la plus récente), ou null.
export async function getLatestWeight(supabase: SupabaseClient, userId: string): Promise<number | null> {
  const { data } = await supabase
    .from('weight_entries')
    .select('weight_kg')
    .eq('user_id', userId)
    .order('measured_on', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.weight_kg ?? null
}

// Enregistre le poids d'un jour ; une seconde saisie le même jour remplace la première.
export async function saveWeightEntry(
  supabase: SupabaseClient,
  measuredOn: string,
  weightKg: number
): Promise<ActionResult> {
  if (!isValidWeight(weightKg)) return { error: INVALID_WEIGHT }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(measuredOn) || Number.isNaN(Date.parse(measuredOn))) {
    return { error: 'Date invalide.' }
  }
  if (measuredOn > getTodayDate()) return { error: 'La date ne peut pas être dans le futur.' }

  const userId = await getUserId(supabase)
  if (!userId) return { error: 'Non connecté.' }

  const { error } = await supabase
    .from('weight_entries')
    .upsert({ user_id: userId, measured_on: measuredOn, weight_kg: weightKg }, { onConflict: 'user_id,measured_on' })
  if (error) return { error: error.message }
  return { ok: true }
}

export async function deleteWeightEntry(supabase: SupabaseClient, id: string): Promise<ActionResult> {
  const { error } = await supabase.from('weight_entries').delete().eq('id', id)
  if (error) return { error: error.message }
  return { ok: true }
}
