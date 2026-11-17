import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WEEKDAYS } from '@vigor/shared/constants'
import { daysByWorkout, getWeeklyPlan, getWorkoutCards, type WorkoutCard } from '@vigor/shared/queries'

export const revalidate = 0

function WorkoutList({ workouts, days }: { workouts: WorkoutCard[]; days: Map<string, number[]> }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {workouts.map((workout) => {
        const { muscles } = workout
        const plannedDays = days.get(workout.id) ?? []

        return (
          <li key={workout.id}>
            <Link
              href={`/workouts/${workout.id}`}
              className="block h-full bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900">{workout.name}</h3>
              {workout.description && (
                <p className="mt-1 text-sm text-gray-600">{workout.description}</p>
              )}

              <p className="mt-3 text-sm text-gray-500">
                {workout.exercise_count} exercice
                {workout.exercise_count > 1 ? 's' : ''}
              </p>

              {muscles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {muscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              )}

              {plannedDays.length > 0 && (
                <p className="mt-3 text-xs font-medium text-purple-700">
                  {plannedDays
                    .map((day) => WEEKDAYS.find((w) => w.value === day)?.label)
                    .join(', ')}
                </p>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

const TABS = [
  { key: 'templates', label: 'Séances Vigor', href: '/workouts' },
  { key: 'mine', label: 'Mes séances', href: '/workouts?tab=mine' },
] as const

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'mine' ? 'mine' : 'templates'
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: workouts, error }, { data: plan }] = await Promise.all([
    getWorkoutCards(supabase),
    getWeeklyPlan(supabase, user?.id ?? ''),
  ])

  const templates = workouts.filter((w) => w.user_id === null)
  const mine = workouts.filter((w) => w.user_id !== null)
  const days = daysByWorkout(plan)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Séances</h1>
        <Link
          href="/workouts/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          + Créer une séance
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <nav className="flex border-b" aria-label="Type de séances">
        {TABS.map(({ key, label, href }) => {
          const active = key === activeTab

          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`px-4 py-2.5 -mb-px border-b-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
              <span className="ml-2 text-xs text-gray-400">
                {key === 'mine' ? mine.length : templates.length}
              </span>
            </Link>
          )
        })}
      </nav>

      {activeTab === 'mine' ? (
        mine.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tu n&apos;as pas encore créé de séance.{' '}
            <Link href="/workouts/new" className="text-blue-600 hover:underline">
              Créer ma première séance
            </Link>
          </p>
        ) : (
          <WorkoutList workouts={mine} days={days} />
        )
      ) : templates.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune séance Vigor pour l&apos;instant.</p>
      ) : (
        <WorkoutList workouts={templates} days={days} />
      )}
    </div>
  )
}
