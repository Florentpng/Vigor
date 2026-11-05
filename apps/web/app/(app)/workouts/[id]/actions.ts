'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { setWorkoutDays as setDays } from '@vigor/shared/planning'
import type { ActionResult } from '@vigor/shared/result'

export async function setWorkoutDays(workoutId: string, days: number[]): Promise<ActionResult> {
  const result = await setDays(await createClient(), workoutId, days)
  if ('ok' in result) {
    revalidatePath('/workouts')
    revalidatePath(`/workouts/${workoutId}`)
    revalidatePath('/planning')
    revalidatePath('/')
  }
  return result
}
