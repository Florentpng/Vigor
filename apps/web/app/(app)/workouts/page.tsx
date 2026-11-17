import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DumbbellIcon } from '@/components/ui/icons'
import { LevelBadge } from '@/components/ui/level-badge'
import { Pill } from '@/components/ui/pill'
import { WEEKDAYS } from '@vigor/shared/constants'
import { parseWorkoutTitle } from '@vigor/shared/format'
import { daysByWorkout, getWeeklyPlan, getWorkoutCards, type WorkoutCard } from '@vigor/shared/queries'

export const revalidate = 0

function WorkoutList({ workouts, days }: { workouts: WorkoutCard[]; days: Map<string, number[]> }) {
  return (
    <ul className="stagger grid gap-4 sm:grid-cols-2">
      {workouts.map((workout) => {
        const { muscles } = workout
        const plannedDays = days.get(workout.id) ?? []

        const { title, level } = parseWorkoutTitle(workout.name, workout.user_id)

        return (
          <li key={workout.id}>
            <Link href={`/workouts/${workout.id}`} className="block h-full">
              <Card interactive className="h-full hover:border-blue-600/60">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-2xl font-extrabold uppercase leading-tight text-gray-900">{title}</h3>
                  {level && <LevelBadge size="sm">{level}</LevelBadge>}
                </div>
                {workout.description && (
                  <p className="mt-1 text-sm text-gray-600">{workout.description}</p>
                )}

                <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                  <DumbbellIcon className="h-4 w-4" />
                  {workout.exercise_count} exercice
                  {workout.exercise_count > 1 ? 's' : ''}
                </p>

                {muscles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {muscles.map((muscle) => (
                      <Pill key={muscle}>{muscle}</Pill>
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
              </Card>
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
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-none text-gray-900">Séances</h1>
        <ButtonLink href="/workouts/new">+ Créer une séance</ButtonLink>
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
              <span className="ml-2 text-xs text-gray-500">
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
