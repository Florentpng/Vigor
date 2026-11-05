import type { SupabaseClient } from '@supabase/supabase-js'
import { type ActionResult, getUserId, INVALID_WEIGHT, isValidWeight } from './result'

export async function updateWeight(supabase: SupabaseClient, weightKg: number): Promise<ActionResult> {
  if (!isValidWeight(weightKg)) return { error: INVALID_WEIGHT }

  const userId = await getUserId(supabase)
  if (!userId) return { error: 'Non connecté.' }

  const { data, error } = await supabase
    .from('profiles')
    .update({ weight_kg: weightKg })
    .eq('id', userId)
    .select('id')
  if (error) return { error: error.message }
  if (!data?.length) return { error: 'Profil introuvable.' }

  return { ok: true }
}

// Réservé aux admins : la vérification est faite par la fonction SQL elle-même.
export async function resetMyBadges(supabase: SupabaseClient): Promise<ActionResult> {
  const { error } = await supabase.rpc('admin_reset_badges')
  if (error) return { error: error.message }
  return { ok: true }
}
