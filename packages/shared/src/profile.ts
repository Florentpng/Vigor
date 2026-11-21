import type { SupabaseClient } from '@supabase/supabase-js'
import { type ActionResult, getUserId } from './result'

export type Identity = { first_name: string | null; last_name: string | null }

// Prénom et nom du profil (nulls si non renseignés, ou si les colonnes n'existent pas encore)
export async function getIdentity(supabase: SupabaseClient, userId: string): Promise<Identity> {
  const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', userId).maybeSingle()
  return { first_name: data?.first_name ?? null, last_name: data?.last_name ?? null }
}

// « Prénom Nom », ou undefined si aucun des deux n'est renseigné
export function fullName(identity: Identity): string | undefined {
  const name = [identity.first_name, identity.last_name].filter(Boolean).join(' ').trim()
  return name || undefined
}

const MAX_NAME_LENGTH = 60

// Enregistre prénom et nom (facultatifs : une saisie vide efface la valeur)
export async function updateIdentity(
  supabase: SupabaseClient,
  input: { firstName: string; lastName: string }
): Promise<ActionResult> {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  if (firstName.length > MAX_NAME_LENGTH || lastName.length > MAX_NAME_LENGTH) {
    return { error: `Prénom et nom : ${MAX_NAME_LENGTH} caractères maximum.` }
  }

  const userId = await getUserId(supabase)
  if (!userId) return { error: 'Non connecté.' }

  const { data, error } = await supabase
    .from('profiles')
    .update({ first_name: firstName || null, last_name: lastName || null })
    .eq('id', userId)
    .select('id')
  if (error) return { error: error.message }
  if (!data?.length) return { error: 'Profil introuvable.' }
  return { ok: true }
}

// Demande le changement d'adresse mail : Supabase envoie un lien de confirmation, l'ancienne adresse reste valable avant.
export async function updateEmail(supabase: SupabaseClient, email: string): Promise<ActionResult> {
  const value = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: 'Adresse mail invalide.' }
  const { error } = await supabase.auth.updateUser({ email: value })
  if (error) return { error: error.message }
  return { ok: true }
}

// Réservé aux admins : la vérification est faite par la fonction SQL elle-même.
export async function resetMyBadges(supabase: SupabaseClient): Promise<ActionResult> {
  const { error } = await supabase.rpc('admin_reset_badges')
  if (error) return { error: error.message }
  return { ok: true }
}
