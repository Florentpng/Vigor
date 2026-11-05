'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as profile from '@vigor/shared/profile'
import type { ActionResult } from '@vigor/shared/result'

export async function resetMyBadges(): Promise<ActionResult> {
  const result = await profile.resetMyBadges(await createClient())
  if ('ok' in result) revalidatePath('/profile')
  return result
}

export async function updateWeight(weightKg: number): Promise<ActionResult> {
  const result = await profile.updateWeight(await createClient(), weightKg)
  if ('ok' in result) {
    revalidatePath('/profile')
    revalidatePath('/')
  }
  return result
}
