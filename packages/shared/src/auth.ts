import type { SupabaseClient } from '@supabase/supabase-js'

// ok : session ouverte ; message : compte créé mais email à confirmer.
export type AuthResult = { error: string } | { message: string } | { ok: true }

export const MIN_PASSWORD_LENGTH = 8

export async function signIn(supabase: SupabaseClient, email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) return { error: 'Email ou mot de passe incorrect.' }
  return { ok: true }
}

export async function signUp(supabase: SupabaseClient, email: string, password: string): Promise<AuthResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` }
  }

  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
  if (error) return { error: error.message }

  // Avec « Confirm email » activé, aucune session n'est ouverte avant le clic sur le lien.
  if (!data.session) return { message: 'Compte créé. Confirme ton email avant de te connecter.' }

  return { ok: true }
}
