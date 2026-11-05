import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WEEKDAYS } from '@vigor/shared/constants'
import { getTodayWeekday } from '@vigor/shared/format'
import { getSessionWorkout } from '@vigor/shared/workouts'
import SessionRunner from './session-runner'

export const revalidate = 0

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ workout?: string }>
}) {
  const { workout: chosenId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = getTodayWeekday()
  const todayLabel = WEEKDAYS.find((d) => d.value === today)?.label ?? ''

  // Séance choisie à la main pour aujourd'hui, sinon celle du planning
  let workoutId = chosenId ?? null
  if (!workoutId) {
    const { data: plan } = await supabase
      .from('weekly_plan')
      .select('workout_id')
      .eq('user_id', user?.id ?? '')
      .eq('weekday', today)
      .maybeSingle()
    workoutId = plan?.workout_id ?? null
  }

  const workout = workoutId ? await getSessionWorkout(supabase, workoutId) : null

  if (workout) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('weight_kg')
      .eq('id', user?.id ?? '')
      .maybeSingle()

    return (
      <SessionRunner
        weightKg={profile?.weight_kg ?? null}
        workout={workout}
        heading={chosenId ? `Séance choisie pour ${todayLabel.toLowerCase()}` : `${todayLabel} · séance du jour`}
        showPlannedLink={Boolean(chosenId)}
      />
    )
  }

  // Aucune séance prévue (jour de repos ou planning vide) : liste des séances
  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, name, description')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-blue-600">{todayLabel}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Aucune séance prévue aujourd&apos;hui</h1>
        <p className="mt-1 text-gray-600">
          Choisis une séance à faire maintenant, ou associe des jours à tes séances dans le{' '}
          <Link href="/planning" className="text-blue-600 hover:underline">
            planning
          </Link>
          .
        </p>
      </div>

      {(workouts ?? []).length > 0 && (
        <ul className="space-y-3">
          {(workouts ?? []).map((item) => (
            <li key={item.id}>
              <Link
                href={`/?workout=${item.id}`}
                className="block bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="font-semibold text-gray-900">{item.name}</p>
                {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
