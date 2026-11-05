'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type LogInput, type LogResult, saveWorkoutLog as save } from '@vigor/shared/logs'

export async function saveWorkoutLog(input: LogInput): Promise<LogResult> {
  const result = await save(await createClient(), input)
  if ('ok' in result) revalidatePath('/profile')
  return result
}
