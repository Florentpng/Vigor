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
        <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
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

      <ul className="bg-white border rounded-xl shadow-sm divide-y overflow-hidden">
        {WEEKDAYS.map(({ value, label }) => {
          const entry = plan.get(value)
          const isToday = value === today

          return (
            <li
              key={value}
              className={`flex items-center justify-between gap-3 px-4 py-4 ${
                isToday ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-24 font-medium text-gray-900">{label}</span>
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
                <span className="text-sm text-gray-400">Repos</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
