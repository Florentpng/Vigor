'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as myWorkouts from '@vigor/shared/my-workouts'
import type { ActionResult } from '@vigor/shared/result'
import type { WorkoutInput } from '@vigor/shared/types'

export async function createMyWorkout(input: WorkoutInput): Promise<ActionResult> {
  const result = await myWorkouts.createMyWorkout(await createClient(), input)
  if ('ok' in result) {
    revalidatePath('/workouts')
    revalidatePath('/')
  }
  return result
}

export async function updateMyWorkout(id: string, input: WorkoutInput): Promise<ActionResult> {
  const result = await myWorkouts.updateMyWorkout(await createClient(), id, input)
  if ('ok' in result) {
    revalidatePath('/workouts')
    revalidatePath(`/workouts/${id}`)
    revalidatePath('/')
  }
  return result
}

export async function deleteMyWorkout(id: string): Promise<ActionResult> {
  const result = await myWorkouts.deleteMyWorkout(await createClient(), id)
  if ('ok' in result) {
    revalidatePath('/workouts')
    revalidatePath('/planning')
    revalidatePath('/')
  }
  return result
}
