'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { storagePathFromUrl } from '@/lib/storage'

export type ActionResult = { error: string } | { ok: true }

export async function deleteExercise(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: exercise } = await supabase
    .from('exercises')
    .select('video_url, thumbnail_url')
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

  // On supprime aussi les fichiers du bucket (média de démonstration et vignette)
  const paths = [exercise?.video_url, exercise?.thumbnail_url]
    .map((url) => (url ? storagePathFromUrl(url) : null))
    .filter((path): path is string => Boolean(path))
  if (paths.length > 0) await supabase.storage.from('exercise-media').remove(paths)

  revalidatePath('/admin/exercises')
  return { ok: true }
}
