import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatRestTime } from '@vigor/shared/format'
import { getWeeklyPlan } from '@vigor/shared/queries'
import { getSessionWorkout } from '@vigor/shared/workouts'
import DaysPicker from './days-picker'
import DeleteMyWorkoutButton from './delete-button'

export const revalidate = 0

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [detail, { data: plan }] = await Promise.all([
    getSessionWorkout(supabase, id),
    getWeeklyPlan(supabase, user?.id ?? ''),
  ])

  if (!detail) notFound()

  const isMine = detail.user_id !== null && detail.user_id === user?.id
  const { exercises } = detail

  const initialDays = plan.filter((r) => r.workout_id === id).map((r) => r.weekday)
  const takenBy: Record<number, string> = {}
  for (const row of plan) {
    if (row.workout_id !== id && row.workout_name) takenBy[row.weekday] = row.workout_name
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/workouts" className="text-sm text-blue-600 hover:underline">
          ← Toutes les séances
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{detail.name}</h1>
        {detail.description && <p className="mt-1 text-gray-600">{detail.description}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/?workout=${id}`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Faire cette séance aujourd&apos;hui
          </Link>
          {isMine && (
            <>
              <Link
                href={`/workouts/${id}/edit`}
                className="px-4 py-2 border text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
              >
                Modifier
              </Link>
              <DeleteMyWorkoutButton id={id} name={detail.name} />
            </>
          )}
        </div>
      </div>

      <DaysPicker workoutId={id} initialDays={initialDays} takenBy={takenBy} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Exercices ({exercises.length})
        </h2>

        {exercises.length === 0 ? (
          <p className="text-sm text-gray-500">Cette séance ne contient aucun exercice.</p>
        ) : (
          <ol className="space-y-4">
            {exercises.map((exercise, index) => {
              const isGif = exercise.video_url?.toLowerCase().endsWith('.gif')

              return (
                <li key={index} className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-400">Exercice {index + 1}</p>
                      <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                      {exercise.muscle_group && (
                        <p className="mt-1 text-xs text-gray-500">
                          {exercise.muscle_group} · {exercise.equipment}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-right">
                      <span className="text-lg font-bold text-gray-900">
                        {exercise.target_sets} × {exercise.target_reps}
                      </span>
                      <span className="block text-xs text-gray-500">
                        Repos {formatRestTime(exercise.rest_time)}
                      </span>
                    </p>
                  </div>

                  {exercise.description && (
                    <p className="mt-3 text-sm text-gray-600">{exercise.description}</p>
                  )}

                  {exercise.video_url &&
                    (isGif ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={exercise.video_url}
                        alt={exercise.name}
                        className="mt-3 max-h-56 rounded-lg border"
                      />
                    ) : (
                      <video
                        src={exercise.video_url}
                        controls
                        muted
                        playsInline
                        className="mt-3 max-h-56 rounded-lg border"
                      />
                    ))}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}
