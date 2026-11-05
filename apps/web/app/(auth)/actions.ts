'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signIn, signUp } from '@vigor/shared/auth'

export type AuthState = { error: string } | { message: string } | null

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  }
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)
  const result = await signIn(await createClient(), email, password)
  if (!('ok' in result)) return result

  redirect('/')
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)
  const result = await signUp(await createClient(), email, password)
  if (!('ok' in result)) return result

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
