'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { storagePathFromUrl } from '@/lib/storage'

export type ActionResult = { error: string } | { ok: true }

export async function deleteExercise(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: exercise } = await supabase
    .from('exercises')
    .select('video_url')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) {
    return {
      error:
        error.code === '23503'
          ? 'Cet exercice est utilisé dans une séance : retire-le d’abord de la séance.'
          : error.message,
    }
  }

  // Une suppression bloquée par la RLS ne renvoie pas d'erreur : on vérifie que la ligne a bien disparu.
  const { data: remaining } = await supabase.from('exercises').select('id').eq('id', id).maybeSingle()
  if (remaining) return { error: 'Suppression refusée (droits insuffisants).' }

  const path = exercise?.video_url ? storagePathFromUrl(exercise.video_url) : null
  if (path) await supabase.storage.from('exercise-media').remove([path])

  revalidatePath('/admin/exercises')
  return { ok: true }
}
