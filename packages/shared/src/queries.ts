import type { SupabaseClient } from '@supabase/supabase-js'
import type { Exercise } from './types'

// Lectures communes au web et au mobile. La RLS décide de ce qui est lisible.

export type Query<T> = { data: T; error: string | null }

// --- Planning ---

export type PlanEntry = {
  weekday: number
  workout_id: string
  workout_name: string | null
  exercise_count: number
}

type PlanRow = {
  weekday: number
  workout_id: string
  workouts: { name: string; workout_exercises: { count: number }[] } | null
}

export async function getWeeklyPlan(supabase: SupabaseClient, userId: string): Promise<Query<PlanEntry[]>> {
  const { data, error } = await supabase
    .from('weekly_plan')
    .select('weekday, workout_id, workouts(name, workout_exercises(count))')
    .eq('user_id', userId)

  return {
    data: ((data ?? []) as unknown as PlanRow[]).map((row) => ({
      weekday: row.weekday,
      workout_id: row.workout_id,
      workout_name: row.workouts?.name ?? null,
      exercise_count: row.workouts?.workout_exercises[0]?.count ?? 0,
    })),
    error: error?.message ?? null,
  }
}

// Jours planifiés (triés) de chaque séance
export function daysByWorkout(plan: PlanEntry[]): Map<string, number[]> {
  const days = new Map<string, number[]>()
  for (const row of plan) {
    days.set(row.workout_id, [...(days.get(row.workout_id) ?? []), row.weekday].sort())
  }
  return days
}

export async function getPlannedWorkoutId(
  supabase: SupabaseClient,
  userId: string,
  weekday: number
): Promise<string | null> {
  const { data } = await supabase
    .from('weekly_plan')
    .select('workout_id')
    .eq('user_id', userId)
    .eq('weekday', weekday)
    .maybeSingle()
  return (data?.workout_id as string | undefined) ?? null
}

// --- Séances ---

export type WorkoutCard = {
  id: string
  name: string
  description: string | null
  user_id: string | null
  exercise_count: number
  muscles: string[]
}

type WorkoutCardRow = Omit<WorkoutCard, 'exercise_count' | 'muscles'> & {
  workout_exercises: { exercises: { muscle_group: string } | null }[]
}

export async function getWorkoutCards(supabase: SupabaseClient): Promise<Query<WorkoutCard[]>> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, name, description, user_id, workout_exercises(exercises(muscle_group))')
    .order('created_at', { ascending: true })

  return {
    data: ((data ?? []) as unknown as WorkoutCardRow[]).map(({ workout_exercises, ...workout }) => ({
      ...workout,
      exercise_count: workout_exercises.length,
      muscles: [
        ...new Set(
          workout_exercises.map((item) => item.exercises?.muscle_group).filter((m): m is string => Boolean(m))
        ),
      ],
    })),
    error: error?.message ?? null,
  }
}

export type EditableWorkout = {
  name: string
  description: string
  items: { exercise_id: string; sets: number; reps: number | null; rest: number }[]
}

type EditableRow = {
  name: string
  description: string | null
  workout_exercises: {
    exercise_id: string
    order_index: number
    target_sets: number
    target_reps: number | null
    rest_time: number
  }[]
}

// Une séance perso de l'utilisateur, prête pour le formulaire de modification (null si pas à lui)
export async function getEditableWorkout(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<EditableWorkout | null> {
  const { data } = await supabase
    .from('workouts')
    .select('name, description, workout_exercises(exercise_id, order_index, target_sets, target_reps, rest_time)')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null
  const row = data as unknown as EditableRow

  return {
    name: row.name,
    description: row.description ?? '',
    items: [...row.workout_exercises]
      .sort((a, b) => a.order_index - b.order_index)
      .map((i) => ({ exercise_id: i.exercise_id, sets: i.target_sets, reps: i.target_reps, rest: i.rest_time })),
  }
}

export async function getExercises(supabase: SupabaseClient): Promise<Query<Exercise[]>> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, description, muscle_group, equipment, video_url, thumbnail_url')
    .order('name', { ascending: true })
  return { data: (data ?? []) as Exercise[], error: error?.message ?? null }
}

// --- Profil ---

export type Profile = { weight_kg: number | null; is_admin: boolean }

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile> {
  const { data } = await supabase.from('profiles').select('weight_kg, is_admin').eq('id', userId).maybeSingle()
  return { weight_kg: data?.weight_kg ?? null, is_admin: Boolean(data?.is_admin) }
}

export type HistoryEntry = {
  id: string
  completed_at: string
  duration_minutes: number
  calories_burned: number
  workout_name: string | null
}

type HistoryRow = Omit<HistoryEntry, 'workout_name'> & { workouts: { name: string } | null }

export async function getHistory(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<Query<HistoryEntry[]>> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('id, completed_at, duration_minutes, calories_burned, workouts(name)')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit)

  return {
    data: ((data ?? []) as unknown as HistoryRow[]).map(({ workouts, ...log }) => ({
      ...log,
      workout_name: workouts?.name ?? null,
    })),
    error: error?.message ?? null,
  }
}

export type HistoryTotals = { sessions: number; minutes: number; calories: number }

// Totaux de toutes les séances effectuées (getHistory, lui, ne renvoie que les dernières).
// Supabase plafonne une réponse à 1000 lignes par défaut.
export async function getHistoryTotals(
  supabase: SupabaseClient,
  userId: string
): Promise<Query<HistoryTotals>> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('duration_minutes, calories_burned')
    .eq('user_id', userId)

  const rows = (data ?? []) as { duration_minutes: number; calories_burned: number }[]

  return {
    data: {
      sessions: rows.length,
      minutes: rows.reduce((sum, row) => sum + Number(row.duration_minutes), 0),
      calories: Math.round(rows.reduce((sum, row) => sum + Number(row.calories_burned), 0)),
    },
    error: error?.message ?? null,
  }
}

export type BadgeStatus = {
  id: string
  code: string
  title: string
  description: string
  unlocked_at: string | null
}

// Tous les badges, avec la date de déblocage de l'utilisateur (null si verrouillé)
export async function getBadges(supabase: SupabaseClient, userId: string): Promise<BadgeStatus[]> {
  const [{ data: badges }, { data: unlockedRows }] = await Promise.all([
    supabase.from('badges').select('id, code, title, description').order('title'),
    supabase.from('user_badges').select('badge_id, unlocked_at').eq('user_id', userId),
  ])

  const unlocked = new Map(
    ((unlockedRows ?? []) as { badge_id: string; unlocked_at: string }[]).map((r) => [r.badge_id, r.unlocked_at])
  )

  return ((badges ?? []) as Omit<BadgeStatus, 'unlocked_at'>[]).map((badge) => ({
    ...badge,
    unlocked_at: unlocked.get(badge.id) ?? null,
  }))
}
