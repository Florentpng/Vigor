'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as weights from '@vigor/shared/weights'
import type { ActionResult } from '@vigor/shared/result'

function refresh() {
  revalidatePath('/suivi')
  revalidatePath('/')
}

export async function saveWeightEntry(measuredOn: string, weightKg: number): Promise<ActionResult> {
  const result = await weights.saveWeightEntry(await createClient(), measuredOn, weightKg)
  if ('ok' in result) refresh()
  return result
}

export async function deleteWeightEntry(id: string): Promise<ActionResult> {
  const result = await weights.deleteWeightEntry(await createClient(), id)
  if ('ok' in result) refresh()
  return result
}
