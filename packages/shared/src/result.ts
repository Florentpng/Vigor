import type { SupabaseClient } from '@supabase/supabase-js'

export type ActionResult = { error: string } | { ok: true }

// Id de l'utilisateur connecté, ou null.
export async function getUserId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export function isValidWeight(weightKg: number): boolean {
  return Number.isFinite(weightKg) && weightKg >= 20 && weightKg <= 400
}

export const INVALID_WEIGHT = 'Poids invalide (entre 20 et 400 kg).'
