import type { SupabaseClient } from '@supabase/supabase-js'

// Charges soulevées : charge de travail par exercice (exercise_loads) et séries réalisées (workout_log_sets).

// Sauts proposés pour une surcharge progressive (kg)
export const LOAD_STEPS = [2.5, 10] as const
// Après ce nombre de séances de suite à la même charge, l'app suggère de l'augmenter
export const SUGGEST_AFTER_SESSIONS = 3
export const MAX_LOAD_KG = 1000

// weight_kg : charge de travail actuelle (null : jamais renseignée ; 0 : sans charge / poids du corps)
// sessions : nombre de séances de suite faites à cette charge (les plus récentes)
// lastSets : séries de la dernière séance faite avec cet exercice (charge de chaque série), vide si aucune
export type ExerciseLoadInfo = {
  weight_kg: number | null
  sessions: number
  lastSets: { set_number: number; weight_kg: number }[]
}

// Une série réalisée pendant la séance
export type LoggedSet = { exercise_id: string; set_number: number; reps: number | null; weight_kg: number }

export function isValidLoad(kg: number): boolean {
  return Number.isFinite(kg) && kg >= 0 && kg <= MAX_LOAD_KG
}

// 42.5 -> "42,5 kg" ; sans charge : « PDC » (poids du corps) ou « - kg »
export function formatLoad(kg: number | null, bodyweight = false): string {
  if (kg === null || kg <= 0) return bodyweight ? 'PDC' : '- kg'
  return `${String(Math.round(kg * 100) / 100).replace('.', ',')} kg`
}

// Charge actuelle de chaque exercice et nombre de séances de suite à cette charge.
export async function getExerciseLoads(
  supabase: SupabaseClient,
  userId: string,
  exerciseIds: string[]
): Promise<Record<string, ExerciseLoadInfo>> {
  const ids = [...new Set(exerciseIds)]
  const result: Record<string, ExerciseLoadInfo> = {}
  if (ids.length === 0) return result

  const [loadsRes, setsRes] = await Promise.all([
    supabase.from('exercise_loads').select('exercise_id, weight_kg').eq('user_id', userId).in('exercise_id', ids),
    supabase
      .from('workout_log_sets')
      .select('exercise_id, session_id, set_number, weight_kg, completed_at')
      .eq('user_id', userId)
      .in('exercise_id', ids)
      .order('completed_at', { ascending: false })
      .limit(2000),
  ])

  const current = new Map<string, number>()
  for (const row of (loadsRes.data ?? []) as { exercise_id: string; weight_kg: number }[]) {
    current.set(String(row.exercise_id), Number(row.weight_kg))
  }

  // Charge de chaque séance (celle de sa dernière série), de la plus récente à la plus ancienne
  const sessionsByExercise = new Map<string, { session: string; weight: number }[]>()
  const seen = new Set<string>()
  for (const row of (setsRes.data ?? []) as { exercise_id: string; session_id: string; weight_kg: number }[]) {
    const key = `${row.exercise_id}|${row.session_id}`
    if (seen.has(key)) continue
    seen.add(key)
    const list = sessionsByExercise.get(String(row.exercise_id)) ?? []
    list.push({ session: row.session_id, weight: Number(row.weight_kg) })
    sessionsByExercise.set(String(row.exercise_id), list)
  }

  // Séries de la dernière séance de chaque exercice (la plus récente de la liste)
  const latestSession = new Map<string, string>()
  const lastSets = new Map<string, Map<number, number>>()
  for (const row of (setsRes.data ?? []) as {
    exercise_id: string
    session_id: string
    set_number: number
    weight_kg: number
  }[]) {
    const id = String(row.exercise_id)
    if (!latestSession.has(id)) latestSession.set(id, row.session_id)
    if (latestSession.get(id) !== row.session_id) continue
    const bySet = lastSets.get(id) ?? new Map<number, number>()
    // Les lignes sont triées de la plus récente à la plus ancienne : la première rencontrée par série est la bonne
    if (!bySet.has(row.set_number)) bySet.set(row.set_number, Number(row.weight_kg))
    lastSets.set(id, bySet)
  }

  for (const id of ids) {
    const weight = current.has(id) ? (current.get(id) as number) : null
    let sessions = 0
    if (weight !== null) {
      for (const s of sessionsByExercise.get(id) ?? []) {
        if (s.weight !== weight) break
        sessions++
      }
    }
    result[id] = {
      weight_kg: weight,
      sessions,
      lastSets: [...(lastSets.get(id) ?? [])]
        .map(([set_number, weight_kg]) => ({ set_number, weight_kg }))
        .sort((a, b) => a.set_number - b.set_number),
    }
  }
  return result
}

// Enregistre les séries d'une séance puis la charge de travail de chaque exercice (la dernière charge utilisée).
export async function saveSessionSets(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  sets: LoggedSet[]
): Promise<{ error: string } | { ok: true }> {
  if (sets.length === 0) return { ok: true }

  const invalid = sets.some(
    (s) =>
      !s.exercise_id ||
      !Number.isInteger(s.set_number) ||
      s.set_number < 1 ||
      (s.reps !== null && (!Number.isInteger(s.reps) || s.reps < 1)) ||
      !isValidLoad(s.weight_kg)
  )
  if (invalid) return { error: 'Séries invalides.' }

  const { error } = await supabase.from('workout_log_sets').insert(
    sets.map((s) => ({
      session_id: sessionId,
      user_id: userId,
      exercise_id: s.exercise_id,
      set_number: s.set_number,
      reps: s.reps,
      weight_kg: s.weight_kg,
    }))
  )
  if (error) return { error: error.message }

  // Dernière charge utilisée par exercice : c'est la charge à reprendre à la prochaine séance
  const last = new Map<string, number>()
  for (const s of sets) last.set(s.exercise_id, s.weight_kg)
  const { error: loadsError } = await supabase.from('exercise_loads').upsert(
    [...last].map(([exercise_id, weight_kg]) => ({
      user_id: userId,
      exercise_id,
      weight_kg,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'user_id,exercise_id' }
  )
  if (loadsError) return { error: loadsError.message }
  return { ok: true }
}

// --- Suivi : liste des charges et historique par exercice ---

export type LoadSummary = {
  exercise_id: string
  name: string
  muscle_group: string
  equipment: string
  weight_kg: number // charge actuelle
  record_kg: number // charge la plus lourde jamais utilisée
}

// Exercices pour lesquels une charge est enregistrée, avec la charge actuelle et le record.
export async function getLoadSummaries(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: LoadSummary[]; error: string | null }> {
  const [loadsRes, setsRes] = await Promise.all([
    supabase
      .from('exercise_loads')
      .select('exercise_id, weight_kg, exercises(name, muscle_group, equipment)')
      .eq('user_id', userId),
    supabase.from('workout_log_sets').select('exercise_id, weight_kg').eq('user_id', userId).limit(5000),
  ])

  const record = new Map<string, number>()
  for (const row of (setsRes.data ?? []) as { exercise_id: string; weight_kg: number }[]) {
    const id = String(row.exercise_id)
    record.set(id, Math.max(record.get(id) ?? 0, Number(row.weight_kg)))
  }

  type Row = {
    exercise_id: string
    weight_kg: number
    exercises: { name: string; muscle_group: string; equipment: string } | { name: string; muscle_group: string; equipment: string }[] | null
  }
  const data = ((loadsRes.data ?? []) as unknown as Row[])
    .map((row) => {
      const exercise = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises
      const id = String(row.exercise_id)
      return {
        exercise_id: id,
        name: exercise?.name ?? 'Exercice supprimé',
        muscle_group: exercise?.muscle_group ?? '',
        equipment: exercise?.equipment ?? '',
        weight_kg: Number(row.weight_kg),
        record_kg: Math.max(record.get(id) ?? 0, Number(row.weight_kg)),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  return { data, error: loadsRes.error?.message ?? setsRes.error?.message ?? null }
}

// Une séance d'un exercice : charge de chaque série (dans l'ordre) et charge la plus lourde
export type LoadSession = { session_id: string; date: string; weights: number[]; max_kg: number }

// Historique d'un exercice, de la séance la plus ancienne à la plus récente.
export async function getLoadHistory(
  supabase: SupabaseClient,
  userId: string,
  exerciseId: string
): Promise<{ data: LoadSession[]; error: string | null }> {
  const { data, error } = await supabase
    .from('workout_log_sets')
    .select('session_id, set_number, weight_kg, completed_at')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('completed_at', { ascending: true })
    .limit(2000)

  const parisDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' })
  const sessions = new Map<string, { date: string; sets: { set_number: number; weight_kg: number }[] }>()
  for (const row of (data ?? []) as { session_id: string; set_number: number; weight_kg: number; completed_at: string }[]) {
    const entry = sessions.get(row.session_id) ?? { date: parisDate.format(new Date(row.completed_at)), sets: [] }
    entry.sets.push({ set_number: row.set_number, weight_kg: Number(row.weight_kg) })
    sessions.set(row.session_id, entry)
  }

  const list = [...sessions].map(([session_id, entry]) => {
    const weights = entry.sets.sort((a, b) => a.set_number - b.set_number).map((s) => s.weight_kg)
    return { session_id, date: entry.date, weights, max_kg: Math.max(...weights) }
  })
  return { data: list, error: error?.message ?? null }
}
