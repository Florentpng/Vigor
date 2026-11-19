import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActionResult } from './result'

// Réservé aux admins : la vérification est faite par la fonction SQL elle-même.
export async function resetMyBadges(supabase: SupabaseClient): Promise<ActionResult> {
  const { error } = await supabase.rpc('admin_reset_badges')
  if (error) return { error: error.message }
  return { ok: true }
}
