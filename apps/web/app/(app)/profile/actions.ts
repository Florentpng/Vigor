'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = { error: string } | { ok: true }

// Réservé aux admins : la vérification est faite par la fonction SQL elle-même.
export async function resetMyBadges(): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('admin_reset_badges')
  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { ok: true }
}

export async function updateWeight(weightKg: number): Promise<ActionResult> {
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
    return { error: 'Poids invalide (entre 20 et 400 kg).' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté.' }

  const { data, error } = await supabase
    .from('profiles')
    .update({ weight_kg: weightKg })
    .eq('id', user.id)
    .select('id')
  if (error) return { error: error.message }
  if (!data?.length) return { error: 'Profil introuvable.' }

  revalidatePath('/profile')
  revalidatePath('/')
  return { ok: true }
}
