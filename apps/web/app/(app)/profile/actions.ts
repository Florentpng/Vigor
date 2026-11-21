'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as profile from '@vigor/shared/profile'
import type { ActionResult } from '@vigor/shared/result'

export async function saveIdentity(firstName: string, lastName: string): Promise<ActionResult> {
  const result = await profile.updateIdentity(await createClient(), { firstName, lastName })
  // Le nom est affiché dans l'en-tête de toutes les pages
  if ('ok' in result) revalidatePath('/', 'layout')
  return result
}

export async function changeEmail(email: string): Promise<ActionResult> {
  return profile.updateEmail(await createClient(), email)
}
