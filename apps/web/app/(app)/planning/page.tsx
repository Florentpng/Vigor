import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WEEKDAYS } from '@vigor/shared/constants'
import { getTodayWeekday } from '@vigor/shared/format'
import { getWeeklyPlan } from '@vigor/shared/queries'

export const revalidate = 0

export default async function PlanningPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await getWeeklyPlan(supabase, user?.id ?? '')

  const plan = new Map(data.map((row) => [row.weekday, row]))
  const today = getTodayWeekday()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-none text-gray-900">Planning</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ta semaine type. Pour changer un jour, ouvre une séance depuis{' '}
          <Link href="/workouts" className="text-blue-600 hover:underline">
            Séances
          </Link>
          .
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <ul className="stagger space-y-3">
        {WEEKDAYS.map(({ value, label }) => {
          const entry = plan.get(value)
          const isToday = value === today

          return (
            <li
              key={value}
              className={`glass flex items-center justify-between gap-3 rounded-xl border px-4 py-4 shadow-sm ${
                isToday ? 'border-blue-600 shadow-[0_0_14px_color-mix(in_srgb,var(--color-blue-600)_30%,transparent)]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-28 font-display text-2xl font-bold uppercase text-gray-900">{label}</span>
                {isToday && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Aujourd&apos;hui
                  </span>
                )}
              </div>

              {entry?.workout_name ? (
                <Link
                  href={`/workouts/${entry.workout_id}`}
                  className="text-right text-sm font-medium text-blue-600 hover:underline"
                >
                  {entry.workout_name}
                  <span className="block text-xs font-normal text-gray-500">
                    {entry.exercise_count} exercices
                  </span>
                </Link>
              ) : (
                <span className="text-sm text-gray-500">Repos</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
